/**
 * In-memory room lifecycle management.
 * Creates, retrieves, and destroys game rooms.
 *
 * @module RoomManager
 */

import { randomUUID } from 'crypto';
import type { ServerRoom, ServerPlayer, QueueEntry } from './types';
import type { GameConfig } from '@/types/game';
import { createInitialGameState } from '@/game/GameState';

export class RoomManager {
  private rooms = new Map<string, ServerRoom>();

  createRoom(
    entryA: QueueEntry,
    entryB: QueueEntry,
    isPrivate = false
  ): ServerRoom {
    const roomId = randomUUID();

    const playerA: ServerPlayer = {
      socketId: entryA.socketId,
      userId: entryA.userId,
      characterId: entryA.characterId,
      elo: entryA.elo,
      nickname: entryA.nickname,
      connected: true,
    };

    const playerB: ServerPlayer = {
      socketId: entryB.socketId,
      userId: entryB.userId,
      characterId: entryB.characterId,
      elo: entryB.elo,
      nickname: entryB.nickname,
      connected: true,
    };

    const config: GameConfig = {
      mode: 'online_1v1',
      player1CharacterId: entryA.characterId,
      player2CharacterId: entryB.characterId,
      roomId,
    };

    const room: ServerRoom = {
      id: roomId,
      players: [playerA, playerB],
      spectatorSocketIds: [],
      state: createInitialGameState(config),
      gameLoop: null,
      createdAt: new Date(),
      isPrivate,
      pendingInputs: [
        { left: false, right: false, jump: false, special: false },
        { left: false, right: false, jump: false, special: false },
      ],
    };

    this.rooms.set(roomId, room);
    return room;
  }

  createPrivateRoom(entry: QueueEntry): ServerRoom {
    const roomId = randomUUID();

    const player: ServerPlayer = {
      socketId: entry.socketId,
      userId: entry.userId,
      characterId: entry.characterId,
      elo: entry.elo,
      nickname: entry.nickname,
      connected: true,
    };

    const room: ServerRoom = {
      id: roomId,
      players: [player, null],
      spectatorSocketIds: [],
      state: null,
      gameLoop: null,
      createdAt: new Date(),
      isPrivate: true,
      pendingInputs: [
        { left: false, right: false, jump: false, special: false },
        { left: false, right: false, jump: false, special: false },
      ],
    };

    this.rooms.set(roomId, room);
    return room;
  }

  joinPrivateRoom(roomId: string, entry: QueueEntry): ServerRoom | null {
    const room = this.rooms.get(roomId);
    if (!room || !room.isPrivate || room.players[1] !== null) return null;

    const player: ServerPlayer = {
      socketId: entry.socketId,
      userId: entry.userId,
      characterId: entry.characterId,
      elo: entry.elo,
      nickname: entry.nickname,
      connected: true,
    };

    room.players[1] = player;

    const config: GameConfig = {
      mode: 'online_1v1',
      player1CharacterId: room.players[0]!.characterId,
      player2CharacterId: entry.characterId,
      roomId,
    };
    room.state = createInitialGameState(config);

    return room;
  }

  getRoom(roomId: string): ServerRoom | undefined {
    return this.rooms.get(roomId);
  }

  getRoomBySocketId(socketId: string): { room: ServerRoom; playerIdx: 0 | 1 } | null {
    for (const room of this.rooms.values()) {
      for (let i = 0; i < 2; i++) {
        if (room.players[i]?.socketId === socketId) {
          return { room, playerIdx: i as 0 | 1 };
        }
      }
    }
    return null;
  }

  getRoomByUserId(userId: string): { room: ServerRoom; playerIdx: 0 | 1 } | null {
    for (const room of this.rooms.values()) {
      for (let i = 0; i < 2; i++) {
        if (room.players[i]?.userId === userId) {
          return { room, playerIdx: i as 0 | 1 };
        }
      }
    }
    return null;
  }

  markDisconnected(socketId: string): { room: ServerRoom; playerIdx: 0 | 1 } | null {
    const result = this.getRoomBySocketId(socketId);
    if (!result) return null;
    result.room.players[result.playerIdx]!.connected = false;
    return result;
  }

  markReconnected(roomId: string, playerIdx: 0 | 1, newSocketId: string): void {
    const room = this.rooms.get(roomId);
    if (!room || !room.players[playerIdx]) return;
    room.players[playerIdx]!.socketId = newSocketId;
    room.players[playerIdx]!.connected = true;
    if (room.players[playerIdx]!.reconnectTimeout) {
      clearTimeout(room.players[playerIdx]!.reconnectTimeout);
      room.players[playerIdx]!.reconnectTimeout = undefined;
    }
  }

  destroyRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    if (room.gameLoop) clearInterval(room.gameLoop);
    this.rooms.delete(roomId);
  }

  size(): number {
    return this.rooms.size;
  }

  /** Returns all rooms (read-only view). */
  all(): IterableIterator<ServerRoom> {
    return this.rooms.values();
  }
}
