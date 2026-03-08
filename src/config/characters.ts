/**
 * Character registry — all 12 satirical world-leader parody characters.
 * To add a character: append one CharacterConfig to CHARACTERS.
 * The rest of the app (character-select, game engine, stats) auto-reflects it.
 *
 * ⚠️ LEGAL: All characters are satirical fictional parodies for entertainment only.
 *
 * @module characters
 */

import type { CharacterConfig, GameState } from '@/types/game';
import { MISSILE_MAP } from './missileTypes';

// ─── Helper: clone state ──────────────────────────────────────────────────────

const clone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

// ─── 1. Donald Trump ─────────────────────────────────────────────────────────

const trump: CharacterConfig = {
  id: 'trump',
  name: 'D. TRUMP',
  country: 'USA',
  flag: '🇺🇸',
  type: 'power',
  stats: { speed: 2, jump: 3, power: 5 },
  special: {
    name: 'Tariff Launcher',
    description: 'Splits missile into 2. Overlays WRONG! on opponent screen.',
    cooldown: 8,
    execute(state): GameState {
      const next = clone(state);
      next.missile.vx *= 1.4;
      next.missile.vy = -14;
      next.toastMessage = 'WRONG! FAKE MISSILE!';
      next.toastExpiresAt = Date.now() + 2000;
      return next;
    },
  },
  colors: { primary: '#b91c1c', accent: '#1d4ed8', missileTrail: '#ef4444' },
  emotes: { win: "TREMENDOUS! Bigly WIN!", lose: "RIGGED! TOTAL DISASTER!" },
};

// ─── 2. Ali Khamenei ─────────────────────────────────────────────────────────

const khamenei: CharacterConfig = {
  id: 'khamenei',
  name: 'KHAMENEI',
  country: 'Iran',
  flag: '🇮🇷',
  type: 'defense',
  stats: { speed: 2, jump: 2, power: 4 },
  special: {
    name: 'Martyr Volley',
    description: 'Converts missile to hypersonic, sends it nearly vertical.',
    cooldown: 9,
    missileOverride: MISSILE_MAP['hypersonic'],
    execute(state): GameState {
      const next = clone(state);
      next.missile.config = MISSILE_MAP['hypersonic'];
      next.missile.vy = -22;
      next.missile.vx = next.missile.vx > 0 ? 3 : -3;
      return next;
    },
  },
  colors: { primary: '#166534', accent: '#dc2626', missileTrail: '#16a34a' },
  emotes: { win: "Death to gravity!", lose: "This is an act of war." },
};

// ─── 3. Xi Jinping ───────────────────────────────────────────────────────────

const xi: CharacterConfig = {
  id: 'xi',
  name: 'XI JINPING',
  country: 'China',
  flag: '🇨🇳',
  type: 'balanced',
  stats: { speed: 3, jump: 3, power: 3 },
  special: {
    name: 'Iron Curtain',
    description: 'Activates shield that reflects the next missile back.',
    cooldown: 10,
    execute(state): GameState {
      const next = clone(state);
      const playerIdx = next.players[0].config.id === 'xi' ? 0 : 1;
      next.players[playerIdx].shieldActive = true;
      next.players[playerIdx].shieldExpiresAt = Date.now() + 3000;
      return next;
    },
  },
  colors: { primary: '#dc2626', accent: '#facc15', missileTrail: '#dc2626' },
  emotes: { win: "Harmony achieved.", lose: "This is a misunderstanding." },
};

// ─── 4. Vladimir Putin ───────────────────────────────────────────────────────

const putin: CharacterConfig = {
  id: 'putin',
  name: 'V. PUTIN',
  country: 'Russia',
  flag: '🇷🇺',
  type: 'speed',
  stats: { speed: 5, jump: 3, power: 3 },
  special: {
    name: 'Kinzhal Dash',
    description: 'Converts to hypersonic + zigzag trajectory.',
    cooldown: 7,
    missileOverride: MISSILE_MAP['hypersonic'],
    execute(state): GameState {
      const next = clone(state);
      next.missile.config = MISSILE_MAP['hypersonic'];
      next.missile.vx *= 2;
      next.missile.vy -= 4;
      return next;
    },
  },
  colors: { primary: '#1d4ed8', accent: '#dc2626', missileTrail: '#3b82f6' },
  emotes: { win: "Mother Russia wins again.", lose: "Special operation continues." },
};

// ─── 5. Kim Jong-un ──────────────────────────────────────────────────────────

const kim: CharacterConfig = {
  id: 'kim',
  name: 'KIM JONG-UN',
  country: 'North Korea',
  flag: '🇰🇵',
  type: 'power',
  stats: { speed: 1, jump: 2, power: 5 },
  special: {
    name: 'Juche Rocket',
    description: 'Max parabola ICBM. Explosion radius ×3.',
    cooldown: 12,
    missileOverride: MISSILE_MAP['icbm'],
    execute(state): GameState {
      const next = clone(state);
      next.missile.config = { ...MISSILE_MAP['icbm'], explosionRadius: 150 };
      next.missile.vy = -24;
      next.missile.vx *= 0.7;
      next.toastMessage = '주체 로켓 발사!';
      next.toastExpiresAt = Date.now() + 2000;
      return next;
    },
  },
  colors: { primary: '#dc2626', accent: '#1d4ed8', missileTrail: '#fbbf24' },
  emotes: { win: "Brilliant Comrade strikes again!", lose: "Provocative result." },
};

// ─── 6. Emmanuel Macron ──────────────────────────────────────────────────────

const macron: CharacterConfig = {
  id: 'macron',
  name: 'MACRON',
  country: 'France',
  flag: '🇫🇷',
  type: 'tech',
  stats: { speed: 3, jump: 4, power: 2 },
  special: {
    name: 'Diplomatic Spin',
    description: 'Adds heavy backspin — unpredictable bounce in opponent court.',
    cooldown: 6,
    execute(state): GameState {
      const next = clone(state);
      next.missile.config = { ...next.missile.config, restitution: 0.9 };
      next.missile.vx *= -0.4; // reverse some horizontal — confusing curve
      next.missile.vy -= 3;
      return next;
    },
  },
  colors: { primary: '#1d4ed8', accent: '#dc2626', missileTrail: '#6366f1' },
  emotes: { win: "Magnifique!", lose: "We shall renegotiate." },
};

// ─── 7. Olaf Scholz ──────────────────────────────────────────────────────────

const scholz: CharacterConfig = {
  id: 'scholz',
  name: 'O. SCHOLZ',
  country: 'Germany',
  flag: '🇩🇪',
  type: 'defense',
  stats: { speed: 2, jump: 3, power: 3 },
  special: {
    name: 'Patriot Shield',
    description: 'Auto-intercepts incoming missile and reverses it.',
    cooldown: 10,
    execute(state): GameState {
      const next = clone(state);
      // Reverse missile direction — simulate intercept + re-launch
      next.missile.vx *= -1.1;
      next.missile.vy = -10;
      return next;
    },
  },
  colors: { primary: '#1f2937', accent: '#facc15', missileTrail: '#9ca3af' },
  emotes: { win: "Ordnung muss sein!", lose: "Kompliziert." },
};

// ─── 8. Volodymyr Zelensky ───────────────────────────────────────────────────

const zelensky: CharacterConfig = {
  id: 'zelensky',
  name: 'ZELENSKY',
  country: 'Ukraine',
  flag: '🇺🇦',
  type: 'speed',
  stats: { speed: 5, jump: 4, power: 2 },
  special: {
    name: 'Himars Dive',
    description: 'Roll-receive any missile + 1.5× return speed.',
    cooldown: 5,
    execute(state): GameState {
      const next = clone(state);
      next.missile.vx *= 1.5;
      next.missile.vy = Math.min(next.missile.vy, -8);
      next.toastMessage = 'HIMARS ACTIVATED!';
      next.toastExpiresAt = Date.now() + 1500;
      return next;
    },
  },
  colors: { primary: '#1d4ed8', accent: '#facc15', missileTrail: '#facc15' },
  emotes: { win: "Slava Ukraini!", lose: "We need more ammo." },
};

// ─── 9. Shigeru Ishiba ───────────────────────────────────────────────────────

const ishiba: CharacterConfig = {
  id: 'ishiba',
  name: 'S. ISHIBA',
  country: 'Japan',
  flag: '🇯🇵',
  type: 'balanced',
  stats: { speed: 3, jump: 3, power: 3 },
  special: {
    name: 'Tomahawk Lob',
    description: 'Cruise missile type — low flat arc skimming the net.',
    cooldown: 7,
    missileOverride: MISSILE_MAP['cruise'],
    execute(state): GameState {
      const next = clone(state);
      next.missile.config = MISSILE_MAP['cruise'];
      next.missile.vy = -5; // shallow arc
      next.missile.vx = (next.missile.vx > 0 ? 1 : -1) * 16;
      return next;
    },
  },
  colors: { primary: '#dc2626', accent: '#ffffff', missileTrail: '#fca5a5' },
  emotes: { win: "Defense partnership achieved.", lose: "Rethinking security..." },
};

// ─── 10. Lee Jae-myung ───────────────────────────────────────────────────────

const lee: CharacterConfig = {
  id: 'lee',
  name: '이재명',
  country: 'South Korea',
  flag: '🇰🇷',
  type: 'power',
  stats: { speed: 3, jump: 3, power: 5 },
  special: {
    name: '현무 스매시',
    description: 'Speed ×2 + powerful down-court shot. Taegukgi trail.',
    cooldown: 8,
    execute(state): GameState {
      const next = clone(state);
      next.missile.vx *= 2;
      next.missile.vy = 8; // sharp downward spike
      next.missile.config = {
        ...next.missile.config,
        trailColor: ['#dc2626', '#1d4ed8'],
      };
      next.toastMessage = '현무 스매시!';
      next.toastExpiresAt = Date.now() + 1500;
      return next;
    },
  },
  colors: { primary: '#dc2626', accent: '#1d4ed8', missileTrail: '#3b82f6' },
  emotes: { win: "경제는 민주주의!", lose: "부당한 결과입니다." },
};

// ─── 11. Narendra Modi ───────────────────────────────────────────────────────

const modi: CharacterConfig = {
  id: 'modi',
  name: 'N. MODI',
  country: 'India',
  flag: '🇮🇳',
  type: 'tech',
  stats: { speed: 3, jump: 3, power: 4 },
  special: {
    name: 'Agni Curve',
    description: 'Missile curves around the net and lands behind opponent.',
    cooldown: 9,
    execute(state): GameState {
      const next = clone(state);
      // Simulate curve by giving very high horizontal + low vertical — hits back court
      next.missile.vy = -3;
      next.missile.vx = (next.missile.vx > 0 ? 1 : -1) * 18;
      next.missile.config = { ...next.missile.config, gravity: 0.05 };
      return next;
    },
  },
  colors: { primary: '#f97316', accent: '#16a34a', missileTrail: '#f97316' },
  emotes: { win: "Jai Hind! Incredible India!", lose: "Resilient like Bharat." },
};

// ─── 12. Giorgia Meloni ──────────────────────────────────────────────────────

const meloni: CharacterConfig = {
  id: 'meloni',
  name: 'G. MELONI',
  country: 'Italy',
  flag: '🇮🇹',
  type: 'speed',
  stats: { speed: 5, jump: 4, power: 4 },
  special: {
    name: 'Cannone Romano',
    description: 'Diagonal jump + straight-line cannon shot. Max speed.',
    cooldown: 6,
    execute(state): GameState {
      const next = clone(state);
      next.missile.vx = (next.missile.vx > 0 ? 1 : -1) * MAX_SPEED;
      next.missile.vy = -2; // near horizontal
      return next;
    },
  },
  colors: { primary: '#16a34a', accent: '#dc2626', missileTrail: '#22c55e' },
  emotes: { win: "Fratelli d'Italia!", lose: "Non ci arrendo!" },
};

const MAX_SPEED = 26;

// ─── Registry ─────────────────────────────────────────────────────────────────

export const CHARACTERS: CharacterConfig[] = [
  trump, khamenei, xi, putin, kim, macron, scholz, zelensky, ishiba, lee, modi, meloni,
];

export const CHARACTER_MAP = Object.fromEntries(
  CHARACTERS.map((c) => [c.id, c])
) as Record<string, CharacterConfig>;

export const DEFAULT_CHARACTER_ID = 'trump';
