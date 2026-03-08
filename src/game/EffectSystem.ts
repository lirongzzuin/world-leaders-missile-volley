/**
 * Particle and visual effects system.
 * Manages a pool of EffectState objects independently of the physics loop.
 */

import type { EffectState, ScreenShakeState } from '@/types/game';
import {
  EXPLOSION_PARTICLE_COUNT, EXPLOSION_PARTICLE_LIFETIME,
  TRAIL_PARTICLE_LIFETIME, DEFAULT_SHAKE_INTENSITY, DEFAULT_SHAKE_DURATION_FRAMES,
} from '@/config/gameConfig';

let _idCounter = 0;
const uid = () => `e${_idCounter++}`;

// ─── Factory functions ────────────────────────────────────────────────────────

export function createExplosionParticles(x: number, y: number, color: string, count = EXPLOSION_PARTICLE_COUNT): EffectState[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 2 + Math.random() * 6;
    return {
      id: uid(), type: 'explosion' as const, x, y,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 2,
      color: i % 3 === 0 ? '#f9d406' : i % 3 === 1 ? '#ef4444' : color,
      alpha: 1, size: 3 + Math.random() * 5, lifetime: 0, maxLifetime: EXPLOSION_PARTICLE_LIFETIME,
    };
  });
}

export function createTrailParticle(x: number, y: number, vx: number, vy: number, color: string): EffectState {
  return {
    id: uid(), type: 'trail' as const,
    x: x + (Math.random() - 0.5) * 4, y: y + (Math.random() - 0.5) * 4,
    vx: -vx * 0.1 + (Math.random() - 0.5) * 0.5, vy: -vy * 0.1 + (Math.random() - 0.5) * 0.5,
    color, alpha: 0.7, size: 4 + Math.random() * 3, lifetime: 0, maxLifetime: TRAIL_PARTICLE_LIFETIME,
  };
}

export function createSparkParticles(x: number, y: number): EffectState[] {
  return Array.from({ length: 8 }, () => ({
    id: uid(), type: 'spark' as const, x, y,
    vx: (Math.random() - 0.5) * 8, vy: -Math.random() * 6,
    color: '#f9d406', alpha: 1, size: 2, lifetime: 0, maxLifetime: 15,
  }));
}

// ─── Update & Render ──────────────────────────────────────────────────────────

export function updateEffects(effects: EffectState[]): EffectState[] {
  return effects
    .map((e) => ({ ...e, x: e.x + e.vx, y: e.y + e.vy, vy: e.vy + 0.15, alpha: 1 - e.lifetime / e.maxLifetime, lifetime: e.lifetime + 1 }))
    .filter((e) => e.lifetime < e.maxLifetime);
}

export function renderEffects(ctx: CanvasRenderingContext2D, effects: EffectState[]): void {
  for (const e of effects) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, e.alpha);
    ctx.fillStyle = e.color;
    if (e.type === 'explosion' || e.type === 'spark') {
      ctx.beginPath(); ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2); ctx.fill();
    } else if (e.type === 'trail') {
      ctx.beginPath(); ctx.arc(e.x, e.y, e.size * (1 - e.lifetime / e.maxLifetime), 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}

// ─── Screen Shake ─────────────────────────────────────────────────────────────

export function createScreenShake(intensity = DEFAULT_SHAKE_INTENSITY, duration = DEFAULT_SHAKE_DURATION_FRAMES): ScreenShakeState {
  return { intensity, duration, elapsed: 0 };
}
export function stepScreenShake(shake: ScreenShakeState): ScreenShakeState {
  if (shake.elapsed >= shake.duration) return shake;
  return { ...shake, elapsed: shake.elapsed + 1 };
}
export function getShakeOffset(shake: ScreenShakeState): { dx: number; dy: number } {
  if (shake.elapsed >= shake.duration) return { dx: 0, dy: 0 };
  const magnitude = shake.intensity * (1 - shake.elapsed / shake.duration);
  return { dx: (Math.random() - 0.5) * magnitude * 2, dy: (Math.random() - 0.5) * magnitude * 2 };
}

// ─── Missile ─────────────────────────────────────────────────────────────────

export function renderMissile(ctx: CanvasRenderingContext2D, x: number, y: number, rotation: number, trailColor: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  const gradient = ctx.createRadialGradient(-18, 0, 0, -18, 0, 16);
  gradient.addColorStop(0, `${trailColor}dd`);
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.beginPath(); ctx.ellipse(-18, 0, 16, 8, 0, 0, Math.PI * 2); ctx.fill();

  // Body
  ctx.fillStyle = '#9ca3af';
  ctx.beginPath(); ctx.roundRect(-14, -5, 28, 10, 2); ctx.fill();
  // Stripes
  ctx.fillStyle = '#6b7280';
  ctx.fillRect(-8, -5, 4, 10); ctx.fillRect(0, -5, 4, 10);
  // Warhead
  ctx.fillStyle = '#ef4444';
  ctx.beginPath(); ctx.moveTo(14, -5); ctx.lineTo(14, 5); ctx.lineTo(26, 0); ctx.closePath(); ctx.fill();
  // Wing fins
  ctx.fillStyle = '#6b7280';
  ctx.beginPath(); ctx.moveTo(-12, -5); ctx.lineTo(-22, -13); ctx.lineTo(-16, -5); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-12, 5); ctx.lineTo(-22, 13); ctx.lineTo(-16, 5); ctx.closePath(); ctx.fill();

  ctx.restore();
}

// ─── Character renderer ───────────────────────────────────────────────────────

/**
 * Render a character caricature on canvas.
 * (x, y) = character center-bottom (feet).
 * cooldownFraction: 0 = special ready, 1 = max cooldown.
 */
export function renderCharacter(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  primaryColor: string,
  flag: string,
  name: string,
  facingLeft: boolean,
  shieldActive: boolean,
  hitFlash: number,
  characterId = 'trump',
  cooldownFraction = 0,
): void {
  ctx.save();
  ctx.scale(facingLeft ? -1 : 1, 1);
  const rx = facingLeft ? -x : x;

  // Hit flash
  if (hitFlash > 0) {
    ctx.globalAlpha = hitFlash / 10;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(rx, y - 42, 50, 70, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Draw per-character body
  drawCharacterVisuals(ctx, characterId, rx, y);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(rx, y + 2, 22, 5, 0, 0, Math.PI * 2); ctx.fill();

  // Name label
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.beginPath(); ctx.roundRect(rx - 34, y - 122, 68, 16, 3); ctx.fill();
  ctx.fillStyle = '#f9d406';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(name.substring(0, 11), rx, y - 110);

  // Cooldown bar (only when on cooldown)
  if (cooldownFraction > 0.02) {
    const bw = 40, bh = 4, bx = rx - 20, by = y + 5;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 2); ctx.fill();
    const readyF = 1 - cooldownFraction;
    ctx.fillStyle = readyF > 0.5 ? '#22c55e' : readyF > 0.25 ? '#f9d406' : '#ef4444';
    ctx.beginPath(); ctx.roundRect(bx, by, bw * readyF, bh, 2); ctx.fill();
  }

  // Shield bubble
  if (shieldActive) {
    ctx.strokeStyle = '#06f9e9';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.65 + Math.sin(Date.now() / 80) * 0.2;
    ctx.shadowColor = '#06f9e9';
    ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(rx, y - 42, 58, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// ─── Dispatcher ──────────────────────────────────────────────────────────────

function drawCharacterVisuals(ctx: CanvasRenderingContext2D, id: string, rx: number, y: number): void {
  switch (id) {
    case 'trump':    drawTrump(ctx, rx, y);    break;
    case 'khamenei': drawKhamenei(ctx, rx, y); break;
    case 'xi':       drawXi(ctx, rx, y);       break;
    case 'putin':    drawPutin(ctx, rx, y);    break;
    case 'kim':      drawKim(ctx, rx, y);      break;
    case 'macron':   drawMacron(ctx, rx, y);   break;
    case 'scholz':   drawScholz(ctx, rx, y);   break;
    case 'zelensky': drawZelensky(ctx, rx, y); break;
    case 'ishiba':   drawIshiba(ctx, rx, y);   break;
    case 'lee':      drawLee(ctx, rx, y);      break;
    case 'modi':     drawModi(ctx, rx, y);     break;
    case 'meloni':   drawMeloni(ctx, rx, y);   break;
    default:         drawGeneric(ctx, rx, y, '#6b7280'); break;
  }
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
// Coordinate system: y = bottom (feet). Head center = (rx, y-80), radius 26.

function drawSuitBody(ctx: CanvasRenderingContext2D, rx: number, y: number, suitColor: string, shirtColor = '#f8fafc'): void {
  ctx.fillStyle = suitColor;
  ctx.beginPath(); ctx.roundRect(rx - 23, y - 65, 46, 65, [4, 4, 2, 2]); ctx.fill();
  // White shirt
  ctx.fillStyle = shirtColor;
  ctx.beginPath();
  ctx.moveTo(rx - 7, y - 63); ctx.lineTo(rx + 7, y - 63);
  ctx.lineTo(rx + 5, y - 32); ctx.lineTo(rx, y - 26); ctx.lineTo(rx - 5, y - 32);
  ctx.closePath(); ctx.fill();
  // Lapels
  ctx.fillStyle = suitColor;
  ctx.beginPath(); ctx.moveTo(rx - 7, y - 63); ctx.lineTo(rx - 22, y - 46); ctx.lineTo(rx - 10, y - 36); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(rx + 7, y - 63); ctx.lineTo(rx + 22, y - 46); ctx.lineTo(rx + 10, y - 36); ctx.closePath(); ctx.fill();
}

function drawMaoJacket(ctx: CanvasRenderingContext2D, rx: number, y: number, color: string, extraWidth = 0): void {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.roundRect(rx - 23 - extraWidth, y - 65, 46 + extraWidth * 2, 65, [4, 4, 2, 2]); ctx.fill();
  // Mandarin collar
  ctx.fillStyle = shadeColor(color, -20);
  ctx.beginPath(); ctx.roundRect(rx - 8, y - 70, 16, 12, 4); ctx.fill();
  // Center button line
  ctx.fillStyle = shadeColor(color, -30);
  ctx.fillRect(rx - 1.5, y - 65, 3, 48);
}

function shadeColor(hex: string, amount: number): string {
  return hex; // simple pass-through; actual shading via opacity
}

function drawHead(ctx: CanvasRenderingContext2D, rx: number, y: number, faceColor: string, radius = 26): void {
  ctx.fillStyle = faceColor;
  ctx.beginPath(); ctx.arc(rx, y - 80, radius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 2; ctx.stroke();
}

function drawEars(ctx: CanvasRenderingContext2D, rx: number, y: number, skinColor: string): void {
  ctx.fillStyle = skinColor;
  ctx.beginPath(); ctx.ellipse(rx - 26, y - 80, 5, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(rx + 26, y - 80, 5, 7, 0, 0, Math.PI * 2); ctx.fill();
}

function drawEyes(ctx: CanvasRenderingContext2D, rx: number, y: number, irisColor = '#1a1a2e'): void {
  // Whites
  ctx.fillStyle = '#f0f0f0';
  ctx.beginPath(); ctx.ellipse(rx - 9, y - 85, 5.5, 4.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(rx + 9, y - 85, 5.5, 4.5, 0, 0, Math.PI * 2); ctx.fill();
  // Iris
  ctx.fillStyle = irisColor;
  ctx.beginPath(); ctx.arc(rx - 8.5, y - 85, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(rx + 9.5, y - 85, 3, 0, Math.PI * 2); ctx.fill();
  // Highlights
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath(); ctx.arc(rx - 7, y - 86.5, 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(rx + 11, y - 86.5, 1.2, 0, Math.PI * 2); ctx.fill();
}

function drawNose(ctx: CanvasRenderingContext2D, rx: number, y: number): void {
  ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(rx + 1, y - 82); ctx.lineTo(rx - 3, y - 72); ctx.lineTo(rx + 5, y - 72); ctx.stroke();
}

function drawMouth(ctx: CanvasRenderingContext2D, rx: number, y: number, style: 'smile' | 'frown' | 'smirk' | 'neutral' | 'open' = 'neutral'): void {
  ctx.strokeStyle = '#8B4513'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  ctx.beginPath();
  switch (style) {
    case 'smile': ctx.arc(rx + 1, y - 64, 8, 0.25, Math.PI - 0.25, false); ctx.stroke(); break;
    case 'frown': ctx.arc(rx + 1, y - 61, 8, Math.PI + 0.25, -0.25, false); ctx.stroke(); break;
    case 'smirk':
      ctx.moveTo(rx - 6, y - 69); ctx.quadraticCurveTo(rx + 1, y - 68, rx + 9, y - 72); ctx.stroke(); break;
    case 'neutral':
      ctx.moveTo(rx - 6, y - 69); ctx.lineTo(rx + 8, y - 69); ctx.stroke(); break;
    case 'open':
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath(); ctx.ellipse(rx + 1, y - 67, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e8d5c4';
      ctx.fillRect(rx - 5, y - 70, 12, 4); break;
  }
}

function drawTie(ctx: CanvasRenderingContext2D, rx: number, y: number, color: string): void {
  ctx.fillStyle = color;
  // Knot
  ctx.beginPath(); ctx.moveTo(rx - 5, y - 63); ctx.lineTo(rx + 5, y - 63); ctx.lineTo(rx + 4, y - 58); ctx.lineTo(rx, y - 56); ctx.lineTo(rx - 4, y - 58); ctx.closePath(); ctx.fill();
  // Blade
  ctx.beginPath(); ctx.moveTo(rx - 4, y - 58); ctx.lineTo(rx + 4, y - 58); ctx.lineTo(rx + 7, y - 35); ctx.lineTo(rx + 3, y - 8); ctx.lineTo(rx - 3, y - 8); ctx.lineTo(rx - 7, y - 35); ctx.closePath(); ctx.fill();
  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath(); ctx.moveTo(rx - 1, y - 57); ctx.lineTo(rx + 2, y - 57); ctx.lineTo(rx + 4, y - 32); ctx.lineTo(rx + 1, y - 32); ctx.closePath(); ctx.fill();
}

type HairStyle = 'pompadour' | 'short_flat' | 'bald' | 'upswept' | 'short_side' | 'wavy_long' | 'gray_short' | 'white_sides';

function drawHair(ctx: CanvasRenderingContext2D, rx: number, y: number, color: string, style: HairStyle): void {
  ctx.fillStyle = color;
  switch (style) {
    case 'pompadour':
      ctx.beginPath();
      ctx.moveTo(rx - 22, y - 100);
      ctx.quadraticCurveTo(rx - 8, y - 130, rx + 10, y - 122);
      ctx.quadraticCurveTo(rx + 30, y - 110, rx + 27, y - 100);
      ctx.quadraticCurveTo(rx + 14, y - 104, rx - 18, y - 101);
      ctx.closePath(); ctx.fill();
      // Sheen
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.beginPath(); ctx.moveTo(rx - 6, y - 118); ctx.quadraticCurveTo(rx + 4, y - 126, rx + 14, y - 118); ctx.quadraticCurveTo(rx + 8, y - 122, rx - 2, y - 116); ctx.closePath(); ctx.fill();
      break;
    case 'short_flat':
      ctx.beginPath(); ctx.arc(rx, y - 80, 26, Math.PI, 0); ctx.fill();
      ctx.fillRect(rx - 26, y - 107, 52, 9);
      break;
    case 'bald':
      // Near-bald: just a thin ring at sides
      ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.arc(rx, y - 80, 27, Math.PI * 1.1, Math.PI * 1.9); ctx.lineTo(rx + 22, y - 80); ctx.arc(rx, y - 80, 22, Math.PI * 1.9, Math.PI * 1.1, true); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
      break;
    case 'upswept':
      ctx.beginPath();
      ctx.moveTo(rx - 26, y - 103);
      ctx.quadraticCurveTo(rx - 10, y - 132, rx + 14, y - 122);
      ctx.quadraticCurveTo(rx + 32, y - 108, rx + 28, y - 100);
      ctx.quadraticCurveTo(rx + 14, y - 107, rx - 20, y - 105);
      ctx.closePath(); ctx.fill();
      break;
    case 'short_side':
      ctx.beginPath(); ctx.arc(rx, y - 80, 26, Math.PI, 0); ctx.fill();
      ctx.fillRect(rx - 26, y - 107, 52, 9);
      // Side part line
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(rx - 10, y - 107); ctx.lineTo(rx - 10, y - 94); ctx.stroke();
      break;
    case 'wavy_long':
      ctx.beginPath(); ctx.arc(rx, y - 80, 26, Math.PI, 0); ctx.fill();
      ctx.fillRect(rx - 26, y - 107, 52, 9);
      // Wavy sides
      ctx.beginPath();
      ctx.moveTo(rx - 26, y - 100);
      ctx.bezierCurveTo(rx - 36, y - 82, rx - 34, y - 60, rx - 28, y - 48);
      ctx.lineTo(rx - 22, y - 50);
      ctx.bezierCurveTo(rx - 28, y - 62, rx - 29, y - 83, rx - 22, y - 100);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(rx + 26, y - 100);
      ctx.bezierCurveTo(rx + 36, y - 82, rx + 34, y - 60, rx + 28, y - 48);
      ctx.lineTo(rx + 22, y - 50);
      ctx.bezierCurveTo(rx + 28, y - 62, rx + 29, y - 83, rx + 22, y - 100);
      ctx.closePath(); ctx.fill();
      break;
    case 'gray_short':
      ctx.beginPath(); ctx.arc(rx, y - 80, 26, Math.PI, 0); ctx.fill();
      ctx.fillRect(rx - 26, y - 107, 52, 9);
      break;
    case 'white_sides':
      // Left side patch
      ctx.fillRect(rx - 33, y - 100, 12, 24);
      ctx.beginPath(); ctx.arc(rx - 27, y - 100, 6, Math.PI, 0); ctx.fill();
      // Right side patch
      ctx.fillRect(rx + 21, y - 100, 12, 24);
      ctx.beginPath(); ctx.arc(rx + 27, y - 100, 6, Math.PI, 0); ctx.fill();
      break;
  }
}

type BeardStyle = 'full' | 'stubble' | 'goatee';

function drawBeard(ctx: CanvasRenderingContext2D, rx: number, y: number, color: string, style: BeardStyle): void {
  switch (style) {
    case 'full':
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(rx - 22, y - 68);
      ctx.bezierCurveTo(rx - 24, y - 56, rx - 18, y - 46, rx, y - 42);
      ctx.bezierCurveTo(rx + 18, y - 46, rx + 24, y - 56, rx + 22, y - 68);
      ctx.bezierCurveTo(rx + 16, y - 71, rx - 16, y - 71, rx - 22, y - 68);
      ctx.closePath(); ctx.fill();
      break;
    case 'stubble':
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#3d2b1f';
      ctx.beginPath(); ctx.ellipse(rx + 1, y - 67, 17, 13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1; break;
    case 'goatee':
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(rx + 1, y - 66, 8, 7, 0, 0, Math.PI * 2); ctx.fill(); break;
  }
}

function drawBrow(ctx: CanvasRenderingContext2D, rx: number, y: number, angry = false): void {
  ctx.strokeStyle = '#3d2520'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  if (angry) {
    // V-shaped angry brows
    ctx.beginPath(); ctx.moveTo(rx - 15, y - 93); ctx.lineTo(rx - 7, y - 90); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(rx + 15, y - 93); ctx.lineTo(rx + 7, y - 90); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(rx - 14, y - 91); ctx.lineTo(rx - 4, y - 91); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(rx + 4, y - 91); ctx.lineTo(rx + 14, y - 91); ctx.stroke();
  }
}

function drawGlasses(ctx: CanvasRenderingContext2D, rx: number, y: number, frameColor: string, style: 'round' | 'square' = 'round'): void {
  ctx.strokeStyle = frameColor; ctx.lineWidth = 2; ctx.lineCap = 'round';
  if (style === 'round') {
    ctx.beginPath(); ctx.arc(rx - 9, y - 86, 7, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(rx + 9, y - 86, 7, 0, Math.PI * 2); ctx.stroke();
  } else {
    ctx.strokeRect(rx - 16, y - 92, 14, 12);
    ctx.strokeRect(rx + 2, y - 92, 14, 12);
  }
  ctx.beginPath(); ctx.moveTo(rx - 2, y - 86); ctx.lineTo(rx + 2, y - 86); ctx.stroke(); // bridge
  ctx.beginPath(); ctx.moveTo(rx - 16, y - 86); ctx.lineTo(rx - 22, y - 85); ctx.stroke(); // L arm
  ctx.beginPath(); ctx.moveTo(rx + 16, y - 86); ctx.lineTo(rx + 22, y - 85); ctx.stroke(); // R arm
}

// ─── Per-character drawings ───────────────────────────────────────────────────

function drawTrump(ctx: CanvasRenderingContext2D, rx: number, y: number): void {
  drawSuitBody(ctx, rx, y, '#1d2d5a');
  drawTie(ctx, rx, y, '#dc2626');
  drawHead(ctx, rx, y, '#e2854a', 27); // wider orange face
  drawEars(ctx, rx, y, '#e2854a');
  // Puffy under-eye whites (signature Trump look)
  ctx.fillStyle = '#fef3c7';
  ctx.beginPath(); ctx.ellipse(rx - 9, y - 83, 8, 3.5, -0.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(rx + 9, y - 83, 8, 3.5, 0.2, 0, Math.PI * 2); ctx.fill();
  drawEyes(ctx, rx, y, '#1e40af');
  drawNose(ctx, rx, y);
  drawMouth(ctx, rx, y, 'smirk');
  drawBrow(ctx, rx, y, false);
  // Golden pompadour
  ctx.fillStyle = '#f9d406';
  drawHair(ctx, rx, y, '#f9d406', 'pompadour');
}

function drawKhamenei(ctx: CanvasRenderingContext2D, rx: number, y: number): void {
  // Black flowing robes
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.moveTo(rx - 28, y - 62); ctx.quadraticCurveTo(rx - 30, y - 28, rx - 26, y);
  ctx.lineTo(rx + 26, y); ctx.quadraticCurveTo(rx + 30, y - 28, rx + 28, y - 62);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#0d1421'; ctx.fillRect(rx - 3, y - 62, 6, 55); // center line
  drawHead(ctx, rx, y, '#c8956a', 26);
  drawEars(ctx, rx, y, '#c8956a');
  drawEyes(ctx, rx, y, '#1f2937');
  drawNose(ctx, rx, y);
  drawMouth(ctx, rx, y, 'frown');
  drawBrow(ctx, rx, y, false);
  // White full beard
  ctx.fillStyle = '#d1d5db';
  drawBeard(ctx, rx, y, '#d1d5db', 'full');
  // White turban
  ctx.fillStyle = '#f1f5f9';
  ctx.beginPath(); ctx.arc(rx, y - 80, 29, Math.PI, 0); ctx.fill();
  ctx.fillRect(rx - 29, y - 83, 58, 11);
  // Wrap lines
  ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.2;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(rx, y - 80, 29 - i * 4.5, Math.PI + 0.15, -0.15); ctx.stroke(); }
  // Black turban tip
  ctx.fillStyle = '#111827';
  ctx.beginPath(); ctx.roundRect(rx - 5, y - 115, 10, 16, 3); ctx.fill();
}

function drawXi(ctx: CanvasRenderingContext2D, rx: number, y: number): void {
  drawMaoJacket(ctx, rx, y, '#9b1c1c');
  // Gold buttons
  ctx.fillStyle = '#f9d406';
  [y - 56, y - 49, y - 42, y - 35].forEach(by => { ctx.beginPath(); ctx.arc(rx, by, 2.5, 0, Math.PI * 2); ctx.fill(); });
  drawHead(ctx, rx, y, '#f0d090', 27); // slightly rounder, CCP vigor
  drawEars(ctx, rx, y, '#f0d090');
  drawEyes(ctx, rx, y, '#1a0a00');
  drawNose(ctx, rx, y);
  drawMouth(ctx, rx, y, 'neutral');
  drawBrow(ctx, rx, y, false);
  ctx.fillStyle = '#0d0d0d';
  drawHair(ctx, rx, y, '#0d0d0d', 'short_flat');
}

function drawPutin(ctx: CanvasRenderingContext2D, rx: number, y: number): void {
  drawSuitBody(ctx, rx, y, '#1e3a5f');
  drawTie(ctx, rx, y, '#64748b');
  drawHead(ctx, rx, y, '#f0d090', 26);
  drawEars(ctx, rx, y, '#f0d090');
  drawBrow(ctx, rx, y, true); // angry brows - drawn BEFORE hair
  drawEyes(ctx, rx, y, '#1f2937');
  drawNose(ctx, rx, y);
  drawMouth(ctx, rx, y, 'frown');
  // Near bald
  ctx.fillStyle = '#6b5040';
  drawHair(ctx, rx, y, '#6b5040', 'bald');
}

function drawKim(ctx: CanvasRenderingContext2D, rx: number, y: number): void {
  // Chubby wide Mao jacket
  drawMaoJacket(ctx, rx, y, '#1f2937', 5);
  drawHead(ctx, rx, y, '#f0d090', 30); // extra big round face
  drawEars(ctx, rx, y, '#f0d090');
  // Chubby cheeks
  ctx.fillStyle = 'rgba(255,140,100,0.28)';
  ctx.beginPath(); ctx.arc(rx - 20, y - 74, 13, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(rx + 20, y - 74, 13, 0, Math.PI * 2); ctx.fill();
  // Double chin
  ctx.fillStyle = '#e8c878';
  ctx.beginPath(); ctx.ellipse(rx, y - 58, 20, 9, 0, 0, Math.PI * 2); ctx.fill();
  drawEyes(ctx, rx, y, '#1a0a00');
  drawNose(ctx, rx, y);
  drawMouth(ctx, rx, y, 'neutral');
  ctx.fillStyle = '#0d0d0d';
  drawHair(ctx, rx, y, '#0d0d0d', 'upswept');
}

function drawMacron(ctx: CanvasRenderingContext2D, rx: number, y: number): void {
  drawSuitBody(ctx, rx, y, '#1d4ed8');
  drawTie(ctx, rx, y, '#dc2626');
  drawHead(ctx, rx, y, '#f0d090', 25);
  drawEars(ctx, rx, y, '#f0d090');
  drawEyes(ctx, rx, y, '#1f2937');
  drawNose(ctx, rx, y);
  drawMouth(ctx, rx, y, 'smile');
  drawBrow(ctx, rx, y, false);
  ctx.fillStyle = '#3d2b1f';
  drawHair(ctx, rx, y, '#3d2b1f', 'short_side');
}

function drawScholz(ctx: CanvasRenderingContext2D, rx: number, y: number): void {
  drawSuitBody(ctx, rx, y, '#374151');
  drawTie(ctx, rx, y, '#6b7280');
  drawHead(ctx, rx, y, '#f0d090', 25);
  drawEars(ctx, rx, y, '#f0d090');
  drawEyes(ctx, rx, y, '#1f2937');
  drawNose(ctx, rx, y);
  drawMouth(ctx, rx, y, 'neutral');
  drawBrow(ctx, rx, y, false);
  ctx.fillStyle = '#9ca3af';
  drawHair(ctx, rx, y, '#9ca3af', 'gray_short');
  drawGlasses(ctx, rx, y, '#374151', 'round');
}

function drawZelensky(ctx: CanvasRenderingContext2D, rx: number, y: number): void {
  // Olive military shirt
  ctx.fillStyle = '#4b6741';
  ctx.beginPath(); ctx.roundRect(rx - 23, y - 65, 46, 65, [4, 4, 2, 2]); ctx.fill();
  // Crew neck
  ctx.fillStyle = '#3a5233';
  ctx.beginPath(); ctx.arc(rx, y - 64, 10, Math.PI, 0); ctx.fill();
  // Z logo
  ctx.strokeStyle = '#f9d406'; ctx.lineWidth = 2.5; ctx.lineCap = 'square';
  ctx.beginPath(); ctx.moveTo(rx - 9, y - 46); ctx.lineTo(rx + 5, y - 46); ctx.lineTo(rx - 9, y - 34); ctx.lineTo(rx + 5, y - 34); ctx.stroke();
  drawHead(ctx, rx, y, '#c8a87a', 25);
  drawEars(ctx, rx, y, '#c8a87a');
  drawEyes(ctx, rx, y, '#1f2937');
  drawNose(ctx, rx, y);
  drawMouth(ctx, rx, y, 'frown');
  drawBrow(ctx, rx, y, true);
  drawBeard(ctx, rx, y, '#3d2b1f', 'stubble');
  ctx.fillStyle = '#1a100a';
  drawHair(ctx, rx, y, '#1a100a', 'short_flat');
}

function drawIshiba(ctx: CanvasRenderingContext2D, rx: number, y: number): void {
  drawSuitBody(ctx, rx, y, '#1f2937');
  drawTie(ctx, rx, y, '#dc2626');
  drawHead(ctx, rx, y, '#f0d090', 25);
  drawEars(ctx, rx, y, '#f0d090');
  drawEyes(ctx, rx, y, '#1f2937');
  drawNose(ctx, rx, y);
  drawMouth(ctx, rx, y, 'neutral');
  drawBrow(ctx, rx, y, false);
  ctx.fillStyle = '#2d3748';
  drawHair(ctx, rx, y, '#2d3748', 'gray_short');
  drawGlasses(ctx, rx, y, '#92400e', 'round');
}

function drawLee(ctx: CanvasRenderingContext2D, rx: number, y: number): void {
  drawSuitBody(ctx, rx, y, '#1e40af');
  drawTie(ctx, rx, y, '#3b82f6');
  drawHead(ctx, rx, y, '#f0d090', 26);
  drawEars(ctx, rx, y, '#f0d090');
  drawEyes(ctx, rx, y, '#1f2937');
  drawNose(ctx, rx, y);
  drawMouth(ctx, rx, y, 'neutral');
  drawBrow(ctx, rx, y, false);
  ctx.fillStyle = '#0d0d0d';
  drawHair(ctx, rx, y, '#0d0d0d', 'short_side');
  // Taeguk lapel pin
  ctx.fillStyle = '#dc2626';
  ctx.beginPath(); ctx.arc(rx - 14, y - 51, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1d4ed8';
  ctx.beginPath(); ctx.arc(rx - 14, y - 51, 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111';
  ctx.font = '5px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('☯', rx - 14, y - 49);
}

function drawModi(ctx: CanvasRenderingContext2D, rx: number, y: number): void {
  // Saffron kurta
  ctx.fillStyle = '#ea7c1f';
  ctx.beginPath(); ctx.roundRect(rx - 23, y - 65, 46, 65, [4, 4, 2, 2]); ctx.fill();
  // Center seam + buttons
  ctx.fillStyle = '#c4640a'; ctx.fillRect(rx - 1.5, y - 65, 3, 52);
  ctx.fillStyle = '#fbbf24';
  [y - 58, y - 50, y - 42, y - 34, y - 26].forEach(by => { ctx.beginPath(); ctx.arc(rx, by, 2.2, 0, Math.PI * 2); ctx.fill(); });
  drawHead(ctx, rx, y, '#a0622a', 26); // darker skin
  drawEars(ctx, rx, y, '#a0622a');
  drawEyes(ctx, rx, y, '#1f2937');
  drawNose(ctx, rx, y);
  drawMouth(ctx, rx, y, 'smile');
  drawBrow(ctx, rx, y, false);
  // White beard
  ctx.fillStyle = '#f1f5f9';
  drawBeard(ctx, rx, y, '#f1f5f9', 'full');
  // White hair on sides only (bald on top)
  ctx.fillStyle = '#f1f5f9';
  drawHair(ctx, rx, y, '#f1f5f9', 'white_sides');
}

function drawMeloni(ctx: CanvasRenderingContext2D, rx: number, y: number): void {
  // Dark blazer
  ctx.fillStyle = '#0f2d1a';
  ctx.beginPath(); ctx.roundRect(rx - 23, y - 65, 46, 65, [4, 4, 2, 2]); ctx.fill();
  // White shirt
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath(); ctx.moveTo(rx - 7, y - 63); ctx.lineTo(rx + 7, y - 63); ctx.lineTo(rx + 5, y - 32); ctx.lineTo(rx, y - 26); ctx.lineTo(rx - 5, y - 32); ctx.closePath(); ctx.fill();
  // Italian flag stripe on lapel
  ctx.fillStyle = '#22c55e'; ctx.fillRect(rx + 11, y - 62, 4, 20);
  ctx.fillStyle = '#f8fafc'; ctx.fillRect(rx + 15, y - 62, 4, 20);
  ctx.fillStyle = '#dc2626'; ctx.fillRect(rx + 19, y - 62, 4, 20);
  drawHead(ctx, rx, y, '#f0d090', 25);
  drawEars(ctx, rx, y, '#f0d090');
  drawEyes(ctx, rx, y, '#1f2937');
  drawNose(ctx, rx, y);
  drawMouth(ctx, rx, y, 'smile');
  drawBrow(ctx, rx, y, false);
  ctx.fillStyle = '#c8960a';
  drawHair(ctx, rx, y, '#c8960a', 'wavy_long');
}

function drawGeneric(ctx: CanvasRenderingContext2D, rx: number, y: number, bodyColor: string): void {
  drawSuitBody(ctx, rx, y, bodyColor);
  drawHead(ctx, rx, y, '#f0d090');
  drawEyes(ctx, rx, y);
  drawNose(ctx, rx, y);
  drawMouth(ctx, rx, y, 'neutral');
  drawHair(ctx, rx, y, '#374151', 'short_flat');
}

// ─── Court & Net ─────────────────────────────────────────────────────────────

export function renderNet(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
  // Pole
  ctx.fillStyle = '#4b5563';
  ctx.fillRect(x, y, width, height);
  // Net mesh
  ctx.strokeStyle = 'rgba(249,212,6,0.35)'; ctx.lineWidth = 1;
  for (let ly = y + 8; ly < y + height; ly += 14) {
    ctx.beginPath(); ctx.moveTo(x - 10, ly); ctx.lineTo(x + width + 10, ly); ctx.stroke();
  }
  // Top bar
  ctx.fillStyle = '#f9d406';
  ctx.fillRect(x - 8, y, width + 16, 5);
  // Glow on top bar
  ctx.shadowColor = '#f9d406'; ctx.shadowBlur = 8;
  ctx.fillRect(x - 8, y, width + 16, 5);
  ctx.shadowBlur = 0;
  // Globe emoji
  ctx.font = '18px serif'; ctx.textAlign = 'center';
  ctx.fillText('🌐', x + width / 2, y - 6);
}

export function renderCourt(ctx: CanvasRenderingContext2D, width: number, floorY: number): void {
  // Floor line
  ctx.strokeStyle = 'rgba(249,212,6,0.4)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, floorY); ctx.lineTo(width, floorY); ctx.stroke();
  // Center dash
  ctx.strokeStyle = 'rgba(249,212,6,0.12)'; ctx.lineWidth = 1;
  ctx.setLineDash([10, 10]);
  ctx.beginPath(); ctx.moveTo(width / 2, floorY - 60); ctx.lineTo(width / 2, floorY); ctx.stroke();
  ctx.setLineDash([]);
}

export function renderFlash(ctx: CanvasRenderingContext2D, alpha: number, width: number, height: number): void {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height); ctx.restore();
}
