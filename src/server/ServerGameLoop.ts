/**
 * Server-authoritative game loop running at 20 Hz (3 physics sub-steps per tick).
 * Applies queued player inputs, runs physics, broadcasts delta state to room clients.
 *
 * @module ServerGameLoop
 */

import type { Server as IOServer } from 'socket.io';
import type { ServerRoom } from './types';
import type { GameState, GameEvent } from '@/types/game';
import { applyInput } from '@/game/InputProcessor';
import {
  stepMissile,
  stepCharacter,
  circlesOverlap,
  missileHitFloor,
  missileHitNet,
  missileSide,
  computeHitVelocity,
} from '@/game/PhysicsEngine';
import {
  awardPoint,
  resetForServe,
  tickCooldowns,
  tickToast,
  tickFlash,
} from '@/game/GameState';
import { ARENA, CHAR_RADIUS, MISSILE_RADIUS, RECONNECT_TIMEOUT_SEC } from '@/config/gameConfig';
import { calculateNewElos } from '@/lib/elo';

const TICK_RATE_HZ = 20;
const TICK_INTERVAL_MS = 1000 / TICK_RATE_HZ;
const PHYSICS_STEPS_PER_TICK = 3;

/** Point delay before next serve (ms) */
const POINT_DELAY_MS = 2000;

interface GameLoopOptions {
  io: IOServer;
  room: ServerRoom;
  onMatchOver: (room: ServerRoom, winnerIdx: 0 | 1, eloChange: [number, number]) => void;
}

export function startGameLoop({ io, room, onMatchOver }: GameLoopOptions): void {
  if (room.gameLoop) return; // already running

  let pointTimestamp: number | null = null;

  room.gameLoop = setInterval(() => {
    if (!room.state) return;

    // ── Pending point delay ───────────────────────────────────────────────────
    if (room.state.phase === 'point_scored' || room.state.phase === 'set_over') {
      if (pointTimestamp === null) {
        pointTimestamp = Date.now();
      } else if (Date.now() - pointTimestamp >= POINT_DELAY_MS) {
        pointTimestamp = null;
        const serving = room.state.servingPlayer;
        room.state = resetForServe(room.state, serving);
        broadcastState(io, room);
      }
      return;
    }

    if (room.state.phase === 'match_over') {
      return; // loop stopped externally after ELO
    }

    // ── Apply inputs + physics sub-steps ─────────────────────────────────────
    let state: GameState = room.state;

    for (let step = 0; step < PHYSICS_STEPS_PER_TICK; step++) {
      // Apply queued player inputs
      state = applyInput(state, 0, room.pendingInputs[0]);
      state = applyInput(state, 1, room.pendingInputs[1]);

      // Step characters
      state = {
        ...state,
        players: [
          stepCharacter(state.players[0], ARENA),
          stepCharacter(state.players[1], ARENA),
        ],
      };

      // Step missile
      let missile = stepMissile(state.missile, ARENA);

      // Character–missile collision
      for (let p = 0; p < 2; p++) {
        const char = state.players[p as 0 | 1];
        if (
          circlesOverlap(
            missile.x, missile.y, MISSILE_RADIUS,
            char.x, char.y, CHAR_RADIUS
          )
        ) {
          const vel = computeHitVelocity(missile, char, p as 0 | 1);
          missile = {
            ...missile,
            vx: vel.vx,
            vy: vel.vy,
            lastTouchedBy: p as 0 | 1,
          };

          // Apply special on hit if active (special may transform missile)
          if (char.specialCooldownRemaining <= 0 && room.pendingInputs[p as 0 | 1].special) {
            state = char.config.special.execute(state);
            missile = state.missile;
          }
        }
      }

      // Net collision → bounce back
      if (missileHitNet(missile, ARENA)) {
        missile = { ...missile, vx: -missile.vx * 0.6, vy: missile.vy * 0.8 };
      }

      // Floor collision → score
      if (missileHitFloor(missile, ARENA.floorY)) {
        const scoringPlayer: 0 | 1 = missileSide(missile, ARENA) === 0 ? 1 : 0;
        state = awardPoint(state, scoringPlayer);

        const events: GameEvent[] = [
          { type: 'score', scoringPlayer, newScore: state.score },
        ];

        if (state.matchOver && state.winner !== null) {
          const winner = state.winner;
          const loser: 0 | 1 = winner === 0 ? 1 : 0;
          const p0 = room.players[0];
          const p1 = room.players[1];
          const winnerElo = winner === 0 ? p0!.elo : p1!.elo;
          const loserElo = winner === 0 ? p1!.elo : p0!.elo;
          const { winnerNew, loserNew } = calculateNewElos(winnerElo, loserElo);
          const eloChangeWinner = winnerNew - winnerElo;
          const eloChangeLoser = loserNew - loserElo;
          const eloChange: [number, number] =
            winner === 0
              ? [eloChangeWinner, eloChangeLoser]
              : [eloChangeLoser, eloChangeWinner];

          events.push({ type: 'match_over', winner, eloChange });
          broadcastEvents(io, room, events);
          broadcastState(io, room);

          stopGameLoop(room);
          onMatchOver(room, winner, eloChange);
          return;
        }

        if (state.phase === 'set_over') {
          const setWinner: 0 | 1 = state.score.sets[0] > state.score.sets[1] ? 0 : 1;
          events.push({ type: 'set_over', winner: setWinner });
        }

        broadcastEvents(io, room, events);
        state = { ...state, missile: { ...missile, active: false } };
        room.state = state;
        broadcastState(io, room);
        break; // stop sub-steps; wait for point delay
      }

      state = { ...state, missile };
    }

    // ── Tick timers ───────────────────────────────────────────────────────────
    state = tickCooldowns(state);
    state = tickToast(state);
    state = tickFlash(state);
    state = { ...state, frameTime: state.frameTime + PHYSICS_STEPS_PER_TICK };

    room.state = state;
    broadcastState(io, room);
  }, TICK_INTERVAL_MS);
}

export function stopGameLoop(room: ServerRoom): void {
  if (room.gameLoop) {
    clearInterval(room.gameLoop);
    room.gameLoop = null;
  }
}

// ─── Socket broadcasting ──────────────────────────────────────────────────────

function broadcastState(io: IOServer, room: ServerRoom): void {
  io.to(room.id).emit('game:state', room.state);
}

function broadcastEvents(io: IOServer, room: ServerRoom, events: GameEvent[]): void {
  for (const event of events) {
    io.to(room.id).emit('game:event', event);
  }
}

/** Schedule a reconnect forfeit if the player doesn't come back in time. */
export function scheduleReconnectForfeit(
  io: IOServer,
  room: ServerRoom,
  playerIdx: 0 | 1,
  onForfeit: (room: ServerRoom, forfeitingPlayer: 0 | 1) => void
): void {
  const player = room.players[playerIdx];
  if (!player) return;

  player.reconnectTimeout = setTimeout(() => {
    const winner: 0 | 1 = playerIdx === 0 ? 1 : 0;
    io.to(room.id).emit('game:event', {
      type: 'toast',
      message: `${player.nickname} disconnected. ${room.players[winner]!.nickname} wins!`,
    } satisfies GameEvent);
    stopGameLoop(room);
    onForfeit(room, playerIdx);
  }, RECONNECT_TIMEOUT_SEC * 1000);
}
