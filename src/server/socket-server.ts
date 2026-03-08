/**
 * Express + Socket.io server entry point.
 * Deployed on Fly.io as a standalone Node process.
 *
 * Events (client → server):
 *   queue:join      { userId, elo, characterId, nickname, token }
 *   queue:leave     {}
 *   game:input      { left, right, jump, special }
 *   room:join       { roomId }   (spectator or reconnect)
 *
 * Events (server → client):
 *   queue:matched   { roomId, opponentNickname, opponentCharacterId, playerIdx }
 *   game:state      GameState
 *   game:event      GameEvent
 *   error           { code, message }
 *
 * @module socket-server
 */

import express from 'express';
import { createServer } from 'http';
import { Server as IOServer, Socket } from 'socket.io';
import cors from 'cors';
import { MatchmakingQueue } from './MatchmakingQueue';
import { RoomManager } from './RoomManager';
import type { ServerRoom, QueueEntry } from './types';
import type { PlayerInput, GameEvent } from '@/types/game';
import { startGameLoop, stopGameLoop, scheduleReconnectForfeit } from './ServerGameLoop';
import { MAX_ROOMS } from '@/config/gameConfig';
import { calculateNewElos } from '@/lib/elo';

// ─── Setup ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'https://world-leaders-missile-volley.vercel.app';

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

const httpServer = createServer(app);

const io = new IOServer(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// ─── Singletons ───────────────────────────────────────────────────────────────

const rooms = new RoomManager();

const queue = new MatchmakingQueue((entryA, entryB) => {
  if (rooms.size() >= MAX_ROOMS) {
    io.to(entryA.socketId).emit('error', { code: 'SERVER_FULL', message: 'Server is full' });
    io.to(entryB.socketId).emit('error', { code: 'SERVER_FULL', message: 'Server is full' });
    return;
  }

  const room = rooms.createRoom(entryA, entryB);

  // Both players join the Socket.io room
  const socketA = io.sockets.sockets.get(entryA.socketId);
  const socketB = io.sockets.sockets.get(entryB.socketId);
  socketA?.join(room.id);
  socketB?.join(room.id);

  socketA?.emit('queue:matched', {
    roomId: room.id,
    opponentNickname: entryB.nickname,
    opponentCharacterId: entryB.characterId,
    playerIdx: 0,
  });
  socketB?.emit('queue:matched', {
    roomId: room.id,
    opponentNickname: entryA.nickname,
    opponentCharacterId: entryA.characterId,
    playerIdx: 1,
  });

  startGameLoop({
    io,
    room,
    onMatchOver: handleMatchOver,
  });
});

queue.start();

// ─── Match completion ─────────────────────────────────────────────────────────

async function handleMatchOver(
  room: ServerRoom,
  winnerIdx: 0 | 1,
  eloChange: [number, number]
): Promise<void> {
  const p0 = room.players[0];
  const p1 = room.players[1];
  if (!p0 || !p1) return;

  // Notify backend to persist result (fire-and-forget with error logging)
  const payload = {
    roomId: room.id,
    winner: winnerIdx,
    player0: { userId: p0.userId, characterId: p0.characterId, eloChange: eloChange[0] },
    player1: { userId: p1.userId, characterId: p1.characterId, eloChange: eloChange[1] },
  };

  const backendUrl = process.env.BACKEND_URL ?? CLIENT_ORIGIN;
  fetch(`${backendUrl}/api/game/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-server-secret': process.env.SERVER_SECRET ?? '' },
    body: JSON.stringify(payload),
  }).catch((err) => console.error('[match_over] backend notify failed', err));

  // Delay room cleanup so clients receive the final state broadcast
  setTimeout(() => rooms.destroyRoom(room.id), 10_000);
}

// ─── Socket event handlers ────────────────────────────────────────────────────

io.on('connection', (socket: Socket) => {
  console.log(`[connect] ${socket.id}`);

  // ── queue:join ─────────────────────────────────────────────────────────────
  socket.on(
    'queue:join',
    (data: { userId: string; elo: number; characterId: string; nickname: string }) => {
      // Basic validation
      if (!data.userId || !data.characterId || !data.nickname) {
        socket.emit('error', { code: 'INVALID_PAYLOAD', message: 'Missing queue fields' });
        return;
      }

      // Prevent duplicate in-game users from re-queuing
      const existing = rooms.getRoomByUserId(data.userId);
      if (existing) {
        socket.emit('error', { code: 'ALREADY_IN_GAME', message: 'You are already in a game' });
        return;
      }

      const entry: QueueEntry = {
        socketId: socket.id,
        userId: data.userId,
        elo: data.elo ?? 1000,
        characterId: data.characterId,
        nickname: data.nickname,
        joinedAt: new Date(),
        eloRange: 150,
      };

      queue.add(entry);
      console.log(`[queue] +${data.nickname} (elo ${entry.elo}) queue=${queue.size()}`);
    }
  );

  // ── queue:leave ────────────────────────────────────────────────────────────
  socket.on('queue:leave', () => {
    queue.removeBySocketId(socket.id);
  });

  // ── game:input ─────────────────────────────────────────────────────────────
  socket.on('game:input', (input: PlayerInput) => {
    const result = rooms.getRoomBySocketId(socket.id);
    if (!result) return;
    const { room, playerIdx } = result;
    room.pendingInputs[playerIdx] = input;
  });

  // ── room:join (spectate / reconnect) ───────────────────────────────────────
  socket.on('room:join', (data: { roomId: string; userId?: string }) => {
    const room = rooms.getRoom(data.roomId);
    if (!room) {
      socket.emit('error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' });
      return;
    }

    // Reconnect: match by userId
    if (data.userId) {
      for (let i = 0; i < 2; i++) {
        const p = room.players[i as 0 | 1];
        if (p && p.userId === data.userId && !p.connected) {
          rooms.markReconnected(room.id, i as 0 | 1, socket.id);
          socket.join(room.id);
          if (room.state) socket.emit('game:state', room.state);
          io.to(room.id).emit('game:event', {
            type: 'toast',
            message: `${p.nickname} reconnected`,
          } satisfies GameEvent);
          console.log(`[reconnect] ${p.nickname} → room ${room.id}`);
          return;
        }
      }
    }

    // Spectator
    socket.join(room.id);
    room.spectatorSocketIds.push(socket.id);
    if (room.state) socket.emit('game:state', room.state);
  });

  // ── disconnect ─────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[disconnect] ${socket.id}`);

    // Remove from queue if waiting
    queue.removeBySocketId(socket.id);

    // Handle in-game disconnect
    const result = rooms.markDisconnected(socket.id);
    if (!result) return;

    const { room, playerIdx } = result;
    const player = room.players[playerIdx];
    if (!player) return;

    io.to(room.id).emit('game:event', {
      type: 'toast',
      message: `${player.nickname} disconnected — reconnecting...`,
    } satisfies GameEvent);

    scheduleReconnectForfeit(io, room, playerIdx, (r, forfeitingPlayer) => {
      const winner: 0 | 1 = forfeitingPlayer === 0 ? 1 : 0;
      const p0 = r.players[0];
      const p1 = r.players[1];
      if (p0 && p1) {
        const winnerElo = winner === 0 ? p0.elo : p1.elo;
        const loserElo = winner === 0 ? p1.elo : p0.elo;
        const { winnerNew, loserNew } = calculateNewElos(winnerElo, loserElo);
        const eloChange: [number, number] =
          winner === 0
            ? [winnerNew - winnerElo, loserNew - loserElo]
            : [loserNew - loserElo, winnerNew - winnerElo];
        handleMatchOver(r, winner, eloChange).catch(console.error);
      }
      stopGameLoop(r);
      rooms.destroyRoom(r.id);
    });
  });
});

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ ok: true, rooms: rooms.size(), queue: queue.size() });
});

// ─── Start ────────────────────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(`[socket-server] listening on :${PORT}`);
});

