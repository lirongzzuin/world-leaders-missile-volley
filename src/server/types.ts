/**
 * Server-only types for room/player management.
 * Not imported by Next.js pages — server process only.
 */

import type { GameState, PlayerInput, GameEvent } from '@/types/game';

export type { GameEvent };

export interface ServerPlayer {
  socketId: string;
  userId: string;
  characterId: string;
  elo: number;
  nickname: string;
  connected: boolean;
  /** Timer reference for reconnect grace period */
  reconnectTimeout?: ReturnType<typeof setTimeout>;
}

export interface ServerRoom {
  id: string;
  players: [ServerPlayer | null, ServerPlayer | null];
  spectatorSocketIds: string[];
  state: GameState | null;
  gameLoop: ReturnType<typeof setInterval> | null;
  createdAt: Date;
  isPrivate: boolean;
  /** Queued inputs per player — overwritten each tick */
  pendingInputs: [PlayerInput, PlayerInput];
}

export interface QueueEntry {
  socketId: string;
  userId: string;
  elo: number;
  characterId: string;
  nickname: string;
  joinedAt: Date;
  /** Expands by 50 every 10 s of waiting */
  eloRange: number;
}

