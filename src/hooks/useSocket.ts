/**
 * Client-side Socket.io connection hook.
 * Manages connection lifecycle, matchmaking, and game event subscriptions.
 *
 * @module useSocket
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameState, GameEvent, PlayerInput } from '@/types/game';

const SOCKET_SERVER_URL =
  process.env.NEXT_PUBLIC_SOCKET_SERVER_URL ?? 'https://wlmv-server.fly.dev';

export interface QueueJoinPayload {
  userId: string;
  elo: number;
  characterId: string;
  nickname: string;
}

export interface MatchedPayload {
  roomId: string;
  opponentNickname: string;
  opponentCharacterId: string;
  playerIdx: 0 | 1;
}

interface UseSocketCallbacks {
  onMatched?: (payload: MatchedPayload) => void;
  onGameState?: (state: GameState) => void;
  onGameEvent?: (event: GameEvent) => void;
  onError?: (err: { code: string; message: string }) => void;
}

export function useSocket(callbacks: UseSocketCallbacks) {
  const socketRef = useRef<Socket | null>(null);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks; // always latest without re-subscribing

  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('queue:matched', (payload: MatchedPayload) => {
      callbacksRef.current.onMatched?.(payload);
    });

    socket.on('game:state', (state: GameState) => {
      callbacksRef.current.onGameState?.(state);
    });

    socket.on('game:event', (event: GameEvent) => {
      callbacksRef.current.onGameEvent?.(event);
    });

    socket.on('error', (err: { code: string; message: string }) => {
      callbacksRef.current.onError?.(err);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []); // mount once

  const joinQueue = useCallback((payload: QueueJoinPayload) => {
    socketRef.current?.emit('queue:join', payload);
  }, []);

  const leaveQueue = useCallback(() => {
    socketRef.current?.emit('queue:leave');
  }, []);

  const sendInput = useCallback((input: PlayerInput) => {
    socketRef.current?.emit('game:input', input);
  }, []);

  const joinRoom = useCallback((roomId: string, userId?: string) => {
    socketRef.current?.emit('room:join', { roomId, userId });
  }, []);

  const isConnected = useCallback(() => socketRef.current?.connected ?? false, []);

  return { joinQueue, leaveQueue, sendInput, joinRoom, isConnected };
}
