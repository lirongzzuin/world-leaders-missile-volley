/**
 * In-memory ELO matchmaking queue.
 * Scans every 5 s; ELO range expands by 50 per 10 s of wait.
 *
 * @module MatchmakingQueue
 */

import type { QueueEntry } from './types';

const SCAN_INTERVAL_MS = 5_000;
const INITIAL_ELO_RANGE = 150;
const ELO_RANGE_EXPAND = 50;
const ELO_RANGE_TICK_SEC = 10;

type MatchCallback = (a: QueueEntry, b: QueueEntry) => void;

export class MatchmakingQueue {
  private queue: QueueEntry[] = [];
  private scanInterval: ReturnType<typeof setInterval> | null = null;
  private onMatch: MatchCallback;

  constructor(onMatch: MatchCallback) {
    this.onMatch = onMatch;
  }

  start(): void {
    this.scanInterval = setInterval(() => this.scan(), SCAN_INTERVAL_MS);
  }

  stop(): void {
    if (this.scanInterval) clearInterval(this.scanInterval);
  }

  add(entry: Omit<QueueEntry, 'joinedAt' | 'eloRange'>): void {
    // Replace existing entry from same user
    this.remove(entry.userId);
    this.queue.push({ ...entry, joinedAt: new Date(), eloRange: INITIAL_ELO_RANGE });
  }

  remove(userId: string): void {
    this.queue = this.queue.filter((e) => e.userId !== userId);
  }

  removeBySocketId(socketId: string): void {
    this.queue = this.queue.filter((e) => e.socketId !== socketId);
  }

  size(): number {
    return this.queue.length;
  }

  private scan(): void {
    const now = Date.now();

    // Expand ELO ranges
    this.queue.forEach((e) => {
      const waitSec = (now - e.joinedAt.getTime()) / 1000;
      e.eloRange = INITIAL_ELO_RANGE + Math.floor(waitSec / ELO_RANGE_TICK_SEC) * ELO_RANGE_EXPAND;
    });

    // Greedy matching — first compatible pair wins
    const matched = new Set<number>();
    for (let i = 0; i < this.queue.length - 1; i++) {
      if (matched.has(i)) continue;
      for (let j = i + 1; j < this.queue.length; j++) {
        if (matched.has(j)) continue;
        const a = this.queue[i];
        const b = this.queue[j];
        const eloDiff = Math.abs(a.elo - b.elo);
        const range = Math.min(a.eloRange, b.eloRange);
        if (eloDiff <= range) {
          matched.add(i);
          matched.add(j);
          this.onMatch(a, b);
          break;
        }
      }
    }

    // Remove matched entries
    this.queue = this.queue.filter((_, i) => !matched.has(i));
  }
}
