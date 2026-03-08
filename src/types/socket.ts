/**
 * Shared Socket.io event types between client and server.
 * Import this in both the Next.js client AND the Fly.io socket server.
 */

import type { GameState, GameConfig, PlayerInput, AIDifficulty } from './game';

// ─── Room ────────────────────────────────────────────────────────────────────

export interface RoomInfo {
  roomId: string;
  playerCount: number;
  maxPlayers: number;
  isPrivate: boolean;
}

// ─── Client → Server ─────────────────────────────────────────────────────────

export interface ClientToServerEvents {
  /** Join ELO matchmaking queue */
  'queue:join': (payload: { userId: string; characterId: string; elo: number }) => void;
  /** Leave matchmaking queue */
  'queue:leave': (payload: { userId: string }) => void;
  /** Create a private room with friend code */
  'room:create': (payload: { userId: string; characterId: string }) => void;
  /** Join a private room by code */
  'room:join': (payload: { roomId: string; userId: string; characterId: string }) => void;
  /** Leave current room */
  'room:leave': () => void;
  /** Send player input (server-authoritative model) */
  'game:input': (payload: { input: PlayerInput; frameTime: number }) => void;
  /** Spectator join */
  'spectate:join': (payload: { roomId: string }) => void;
  /** In-game emote */
  'game:emote': (payload: { emote: string }) => void;
}

// ─── Server → Client ─────────────────────────────────────────────────────────

export interface ServerToClientEvents {
  /** Matched with an opponent */
  'queue:matched': (payload: { roomId: string; opponentId: string; opponentElo: number }) => void;
  /** Room created successfully */
  'room:created': (payload: { roomId: string }) => void;
  /** An opponent joined the room */
  'room:opponent_joined': (payload: { userId: string; characterId: string }) => void;
  /** Player disconnected */
  'room:player_disconnected': (payload: { userId: string; reconnectTimeoutSec: number }) => void;
  /** Authoritative game state update (delta-compressed, 20Hz) */
  'game:state': (payload: DeltaGameState) => void;
  /** Game over */
  'game:over': (payload: { winnerId: string; eloChange: [number, number] }) => void;
  /** Server error */
  error: (payload: { code: string; message: string }) => void;
  /** Emote from opponent */
  'game:emote': (payload: { emote: string }) => void;
}

// ─── Delta Compression ───────────────────────────────────────────────────────

/** Partial game state sent over the wire — only changed fields */
export interface DeltaGameState {
  /** Compressed missile position (x, y as Int16, scaled ×100) */
  mx?: number;
  my?: number;
  mvx?: number;
  mvy?: number;
  /** Compressed player positions */
  p0x?: number;
  p0y?: number;
  p1x?: number;
  p1y?: number;
  phase?: GameState['phase'];
  score?: GameState['score'];
  effects?: Array<{ type: string; x: number; y: number }>;
}
