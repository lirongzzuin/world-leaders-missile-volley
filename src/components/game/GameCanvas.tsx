'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { GameConfig, PlayerInput, GameState as GS } from '@/types/game';
import { createInitialGameState, awardPoint, resetForServe, tickCooldowns, tickToast, tickFlash } from '@/game/GameState';
import {
  stepCharacter, stepMissile, computeHitVelocity,
  circlesOverlap, missileHitFloor, missileHitNet, missileSide,
} from '@/game/PhysicsEngine';
import {
  createExplosionParticles, createTrailParticle, createSparkParticles,
  createScreenShake, updateEffects, renderEffects, renderMissile,
  renderCharacter, renderNet, renderCourt, renderFlash,
  getShakeOffset, stepScreenShake,
} from '@/game/EffectSystem';
import { computeAIInput } from '@/game/AIController';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, ARENA, CHAR_RADIUS,
  MISSILE_RADIUS, TRAIL_PARTICLES_PER_FRAME,
} from '@/config/gameConfig';

interface Props {
  config: GameConfig;
  onMatchOver: (winner: 0 | 1) => void;
}

export default function GameCanvas({ config, onMatchOver }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GS>(createInitialGameState(config));
  const keysRef = useRef<Record<string, boolean>>({});
  const animFrameRef = useRef<number>(0);
  const aiKeyRef = useRef<object>({});
  const lastTimeRef = useRef<number>(0);
  const accumRef = useRef<number>(0);
  const FIXED_DT = 1000 / 60; // 60 FPS target in ms
  const touchRef = useRef<{
    joystickId: number | null;
    joystickX: number;
    actionJump: boolean;
    actionSpecial: boolean;
  }>({ joystickId: null, joystickX: 0, actionJump: false, actionSpecial: false });

  const [score, setScore] = useState<GS['score']>({ points: [0, 0], sets: [0, 0] });
  const [toast, setToast] = useState<string | null>(null);
  const [phase, setPhase] = useState<GS['phase']>('serving');
  const [winSize, setWinSize] = useState({ w: 800, h: 450 });
  const countdownRef = useRef(3);
  const [countdownDisplay, setCountdownDisplay] = useState(3);
  const [showPause, setShowPause] = useState(false);
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

  useEffect(() => {
    const update = () => setWinSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Countdown timer (3, 2, 1, GO!)
  useEffect(() => {
    const timer = setInterval(() => {
      if (countdownRef.current > 0) {
        countdownRef.current -= 1;
        setCountdownDisplay(countdownRef.current);
      }
      if (countdownRef.current <= 0) clearInterval(timer);
    }, 800);
    return () => clearInterval(timer);
  }, []);

  // ─── Input helpers ──────────────────────────────────────────────────────────
  function getP1Input(): PlayerInput {
    const k = keysRef.current;
    return { left: !!k['a'] || !!k['A'], right: !!k['d'] || !!k['D'], jump: !!k['w'] || !!k['W'], special: !!k['f'] || !!k['F'] };
  }
  function getP2Input(): PlayerInput {
    const k = keysRef.current;
    return { left: !!k['ArrowLeft'], right: !!k['ArrowRight'], jump: !!k['ArrowUp'], special: !!k['/'] };
  }
  function getMobileP1Input(): PlayerInput {
    const t = touchRef.current;
    return { left: t.joystickX < -20, right: t.joystickX > 20, jump: t.actionJump, special: t.actionSpecial };
  }

  function applyInput(state: GS, playerIdx: 0 | 1, input: PlayerInput): GS {
    const next = { ...state, players: [...state.players] as GS['players'] };
    const char = { ...next.players[playerIdx] };
    const cfg = char.config;
    const speedMult = cfg.stats.speed / 3;
    const jumpMult = cfg.stats.jump / 3;

    if (input.left) { char.vx = Math.max(-8, char.vx - 1.5 * speedMult); char.facingLeft = true; }
    else if (input.right) { char.vx = Math.min(8, char.vx + 1.5 * speedMult); char.facingLeft = false; }
    else { char.vx *= 0.78; }

    if (input.jump && char.isGrounded) {
      char.vy = -13 * jumpMult; char.isGrounded = false; char.isJumping = true;
    }
    if (input.special && char.specialCooldownRemaining <= 0 && state.phase === 'playing') {
      char.specialCooldownRemaining = cfg.special.cooldown;
      char.isSpecialActive = true;
      next.players[playerIdx] = char;
      return cfg.special.execute({ ...next });
    }
    next.players[playerIdx] = char;
    return next;
  }

  // ─── Main game loop ─────────────────────────────────────────────────────────
  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dt = lastTimeRef.current > 0 ? Math.min(timestamp - lastTimeRef.current, 100) : FIXED_DT;
    lastTimeRef.current = timestamp;
    accumRef.current += dt;
    let state = stateRef.current;
    const isMobile = 'ontouchstart' in window;
    const inCountdown = countdownRef.current > 0;

    // Fixed-timestep physics loop (prevents 120Hz from running 2x fast)
    while (accumRef.current >= FIXED_DT) {
      accumRef.current -= FIXED_DT;

    if (!inCountdown && !showPause && (state.phase === 'playing' || state.phase === 'serving')) {
      const p1Input = isMobile ? getMobileP1Input() : getP1Input();
      state = applyInput(state, 0, p1Input);

      if (config.mode === 'vs_ai' || config.mode === 'practice') {
        state = applyInput(state, 1, computeAIInput(state, 1, config.aiDifficulty ?? 'normal', aiKeyRef.current));
      } else {
        state = applyInput(state, 1, getP2Input());
      }
    }

    if (!inCountdown && !showPause && (state.phase === 'playing' || state.phase === 'serving')) {
      state = { ...state, players: [stepCharacter(state.players[0], ARENA), stepCharacter(state.players[1], ARENA)] };

      if (state.missile.active) {
        state = { ...state, missile: stepMissile(state.missile, ARENA) };
      }

      if (state.missile.active && Math.abs(state.missile.vx) + Math.abs(state.missile.vy) > 2) {
        const trailColor = state.missile.config.trailColor[0];
        const trails = Array.from({ length: TRAIL_PARTICLES_PER_FRAME }, () =>
          createTrailParticle(state.missile.x, state.missile.y, state.missile.vx, state.missile.vy, trailColor)
        );
        state = { ...state, effects: [...state.effects, ...trails] };
      }

      // Character–missile collision
      for (let i = 0 as 0 | 1; i <= 1; i++) {
        const char = state.players[i as 0 | 1];
        const charHitY = char.y - CHAR_RADIUS / 2;
        if (state.missile.active && circlesOverlap(state.missile.x, state.missile.y, MISSILE_RADIUS, char.x, charHitY, CHAR_RADIUS)) {
          const { vx, vy } = computeHitVelocity(state.missile, char, i as 0 | 1);
          const missileConfig = char.isSpecialActive
            ? { ...state.missile.config, ...(char.config.special.missileOverride ?? {}) }
            : state.missile.config;
          state = {
            ...state,
            missile: { ...state.missile, vx, vy, config: { ...missileConfig, trailColor: [char.config.colors.missileTrail, missileConfig.trailColor[1]] }, lastTouchedBy: i as 0 | 1 },
            players: state.players.map((p, idx) => idx === i ? { ...p, isSpecialActive: false, hitFlashRemaining: 3 } : p) as GS['players'],
            effects: [...state.effects, ...createSparkParticles(state.missile.x, state.missile.y)],
          };
          break;
        }
      }

      // Shield reflection
      for (let i = 0 as 0 | 1; i <= 1; i++) {
        const char = state.players[i as 0 | 1];
        if (char.shieldActive) {
          const dx = state.missile.x - char.x;
          const dy = state.missile.y - (char.y - 30);
          if (Math.sqrt(dx * dx + dy * dy) < 55 + MISSILE_RADIUS) {
            state = { ...state, missile: { ...state.missile, vx: state.missile.vx * -1.1, vy: -Math.abs(state.missile.vy) }, effects: [...state.effects, ...createSparkParticles(state.missile.x, state.missile.y)] };
          }
        }
      }

      // Net collision
      if (state.missile.active && missileHitNet(state.missile, ARENA)) {
        const side = missileSide(state.missile, ARENA);
        state = { ...state, missile: { ...state.missile, active: false }, effects: [...state.effects, ...createExplosionParticles(state.missile.x, state.missile.y, state.missile.config.trailColor[0], 20)], screenShake: createScreenShake(4, 10), phase: 'point_scored' };
        setTimeout(() => { stateRef.current = resetForServe(stateRef.current, side); }, 1500);
      }

      // Floor collision
      if (state.missile.active && missileHitFloor(state.missile, ARENA.floorY)) {
        const side = missileSide(state.missile, ARENA);
        const scoringPlayer: 0 | 1 = side === 0 ? 1 : 0;
        state = awardPoint(state, scoringPlayer);
        state = { ...state, missile: { ...state.missile, active: false }, effects: [...state.effects, ...createExplosionParticles(state.missile.x, ARENA.floorY, state.missile.config.trailColor[0], state.missile.config.explosionRadius / 2)], screenShake: createScreenShake(state.missile.config.hitShakeIntensity), flashOpacity: 0.6 };
        if (state.matchOver && state.winner !== null) { stateRef.current = state; onMatchOver(state.winner); return; }
        setTimeout(() => { stateRef.current = resetForServe(stateRef.current, side); }, state.phase === 'set_over' ? 2500 : 1500);
      }

      // Serve release — any input from the serving player starts the rally
      if (state.phase === 'serving') {
        const serveInput = state.servingPlayer === 0
          ? (isMobile ? getMobileP1Input() : getP1Input())
          : (config.mode === 'local_1v1' ? getP2Input() : { left: false, right: false, jump: false, special: false });
        if (serveInput.jump || serveInput.left || serveInput.right || serveInput.special) {
          state = { ...state, phase: 'playing' };
        }
        // For AI modes, auto-serve after a short delay when AI is serving
        if (state.servingPlayer === 1 && (config.mode === 'vs_ai' || config.mode === 'practice')) {
          state = { ...state, phase: 'playing' };
        }
      }
    }

    state = { ...state, effects: updateEffects(state.effects) };
    state = { ...state, screenShake: stepScreenShake(state.screenShake) };
    state = tickCooldowns(state);
    state = tickToast(state);
    state = tickFlash(state);
    stateRef.current = state;

    } // end fixed-timestep loop

    state = stateRef.current;
    setScore(state.score);
    setToast(state.toastMessage);
    setPhase(state.phase);

    // ─── Render ──────────────────────────────────────────────────────────────
    const cw = canvas.width / dpr;
    const ch = canvas.height / dpr;
    const gameScale = Math.min(cw / CANVAS_WIDTH, ch / CANVAS_HEIGHT);
    const offX = (cw - CANVAS_WIDTH * gameScale) / 2;
    const offY = (ch - CANVAS_HEIGHT * gameScale) / 2;
    const shake = getShakeOffset(state.screenShake);

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cw, ch);

    ctx.save();
    ctx.translate(offX + shake.dx, offY + shake.dy);
    ctx.scale(gameScale, gameScale);

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bgGrad.addColorStop(0, '#0a1628');
    bgGrad.addColorStop(1, '#0d0c05');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Stars background
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (let s = 0; s < 40; s++) {
      const sx = ((s * 137.5 + 50) % CANVAS_WIDTH);
      const sy = ((s * 97.3 + 20) % (CANVAS_HEIGHT * 0.7));
      const sr = 0.5 + (s % 3) * 0.5;
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
    }

    renderCourt(ctx, CANVAS_WIDTH, ARENA.floorY);
    renderNet(ctx, ARENA.net.x, ARENA.net.y, ARENA.net.width, ARENA.net.height);

    state.players.forEach((char) => {
      const cooldownFrac = char.config.special.cooldown > 0 ? char.specialCooldownRemaining / char.config.special.cooldown : 0;
      renderCharacter(ctx, char.x, char.y, char.config.colors.primary, char.config.flag, char.config.name, char.facingLeft, char.shieldActive, char.hitFlashRemaining, char.config.id, cooldownFrac);
    });

    if (state.missile.active) {
      renderMissile(ctx, state.missile.x, state.missile.y, state.missile.rotation, state.missile.config.trailColor[0]);
    }

    renderEffects(ctx, state.effects);
    renderFlash(ctx, state.flashOpacity, CANVAS_WIDTH, CANVAS_HEIGHT);

    // ── Serving indicator arrow ──────────────────────────────────────────────
    if (state.phase === 'serving' && !inCountdown) {
      const servChar = state.players[state.servingPlayer];
      const arrowX = servChar.x;
      const arrowBaseY = servChar.y - 130;
      const bob = Math.sin(Date.now() / 200) * 5;
      ctx.fillStyle = '#f9d406';
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowBaseY + bob + 12);
      ctx.lineTo(arrowX - 8, arrowBaseY + bob);
      ctx.lineTo(arrowX + 8, arrowBaseY + bob);
      ctx.closePath();
      ctx.fill();
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SERVE', arrowX, arrowBaseY + bob - 6);
    }

    // ── Countdown overlay ────────────────────────────────────────────────────
    if (inCountdown) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      const cdVal = countdownRef.current;
      const pulse = 1 + Math.sin(Date.now() / 100) * 0.08;
      ctx.save();
      ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = '#f9d406';
      ctx.font = 'bold 100px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#f9d406';
      ctx.shadowBlur = 20;
      ctx.fillText(cdVal > 0 ? String(cdVal) : 'GO!', 0, 0);
      ctx.shadowBlur = 0;
      ctx.restore();
      // Player names below
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${state.players[0].config.flag} ${state.players[0].config.name}  vs  ${state.players[1].config.name} ${state.players[1].config.flag}`,
        CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60
      );
    }

    ctx.restore(); // game coordinate transform
    ctx.restore(); // dpr scale

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [config, onMatchOver, showPause, dpr]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      if (e.key === 'Escape') setShowPause(p => !p);
    };
    const onKeyUp = (e: KeyboardEvent) => { keysRef.current[e.key] = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, []);

  useEffect(() => {
    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [gameLoop]);

  const handleJoystickStart = (e: React.TouchEvent) => {
    touchRef.current.joystickId = e.changedTouches[0].identifier;
  };
  const handleJoystickMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === touchRef.current.joystickId) {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        touchRef.current.joystickX = t.clientX - rect.left - rect.width / 2;
      }
    }
  };
  const handleJoystickEnd = () => { touchRef.current.joystickId = null; touchRef.current.joystickX = 0; };

  const p1cfg = stateRef.current.players[0]?.config;
  const p2cfg = stateRef.current.players[1]?.config;
  const currentSet = Math.max(1, score.sets[0] + score.sets[1] + 1);

  return (
    <div className="fixed inset-0 z-50 bg-black select-none touch-none overflow-hidden">

      {/* ── Pause button ────────────────────────────────────────────────────── */}
      <button
        onClick={() => setShowPause(p => !p)}
        className="absolute top-2 right-2 z-30 size-8 flex items-center justify-center rounded-full bg-black/50 text-white/60 active:bg-black/80"
      >
        <span className="material-symbols-outlined text-lg">pause</span>
      </button>

      {/* ── Score HUD ────────────────────────────────────────────────────────── */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center px-3 py-1.5 bg-gradient-to-b from-black/80 to-transparent">
        {/* P1 */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-2xl leading-none">{p1cfg?.flag}</span>
          <div className="min-w-0">
            <div className="text-primary text-[10px] font-black uppercase tracking-wider truncate">{p1cfg?.name}</div>
            <div className="text-white text-3xl font-black leading-none tabular-nums">{score.points[0]}</div>
          </div>
        </div>

        {/* Center */}
        <div className="flex-shrink-0 text-center mx-3">
          <div className="text-primary/70 text-[9px] font-bold tracking-[0.2em] uppercase">세트 {currentSet}</div>
          <div className="flex gap-1 mt-0.5 justify-center">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <div className={`w-2 h-2 rounded-full transition-colors ${score.sets[0] > i ? 'bg-primary shadow-[0_0_4px_#f9d406]' : 'bg-white/15'}`} />
                <div className={`w-2 h-2 rounded-full transition-colors ${score.sets[1] > i ? 'bg-danger shadow-[0_0_4px_#ef4444]' : 'bg-white/15'}`} />
              </div>
            ))}
          </div>
          <div className="text-white/30 text-[8px] font-mono mt-0.5">VS</div>
        </div>

        {/* P2 */}
        <div className="flex items-center gap-2 flex-1 min-w-0 flex-row-reverse">
          <span className="text-2xl leading-none">{p2cfg?.flag}</span>
          <div className="min-w-0 text-right">
            <div className="text-slate-400 text-[10px] font-black uppercase tracking-wider truncate">{p2cfg?.name}</div>
            <div className="text-white text-3xl font-black leading-none tabular-nums">{score.points[1]}</div>
          </div>
        </div>
      </div>

      {/* ── Canvas ───────────────────────────────────────────────────────────── */}
      <canvas
        ref={canvasRef}
        width={winSize.w * dpr}
        height={winSize.h * dpr}
        className="block w-full h-full"
        style={{ width: winSize.w, height: winSize.h }}
      />

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
          <div className="bg-primary/95 text-background-dark px-6 py-2 rounded-xl -rotate-1 shadow-2xl border-2 border-primary/60">
            <span className="text-xl font-black italic tracking-tight uppercase">{toast}</span>
          </div>
        </div>
      )}

      {/* ── Serving hint ─────────────────────────────────────────────────────── */}
      {phase === 'serving' && countdownDisplay <= 0 && (
        <div className="absolute bottom-36 inset-x-0 flex justify-center pointer-events-none z-20">
          <div className="bg-black/60 text-primary/80 text-xs font-bold px-4 py-1.5 rounded-full border border-primary/20 animate-pulse">
            {stateRef.current.servingPlayer === 0 ? '아무 키나 눌러서 발사!' : config.mode === 'local_1v1' ? 'P2: 방향키로 발사!' : '발사 준비 중...'}
          </div>
        </div>
      )}

      {/* ── Mobile Controls ──────────────────────────────────────────────────── */}
      <div className="absolute bottom-0 inset-x-0 z-20 flex items-end justify-between px-5 pb-6 pointer-events-none">
        {/* Left cluster: joystick + jump */}
        <div className="flex items-end gap-4 pointer-events-auto">
          <div
            className="w-28 h-28 rounded-full bg-black/50 border-2 border-white/15 flex items-center justify-center relative"
            onTouchStart={handleJoystickStart}
            onTouchMove={handleJoystickMove}
            onTouchEnd={handleJoystickEnd}
          >
            <div className="w-11 h-11 rounded-full bg-white/15 border border-white/30" />
            <span className="absolute left-2 text-white/40 text-base font-bold select-none">‹</span>
            <span className="absolute right-2 text-white/40 text-base font-bold select-none">›</span>
          </div>
          <button
            className="w-16 h-16 mb-6 rounded-full bg-accent-cyan/20 border-2 border-accent-cyan/50 flex items-center justify-center text-accent-cyan text-2xl font-black active:scale-90 active:bg-accent-cyan/35 transition-transform"
            onTouchStart={() => { touchRef.current.actionJump = true; }}
            onTouchEnd={() => { touchRef.current.actionJump = false; }}
          >↑</button>
        </div>

        {/* Right: special */}
        <div className="pointer-events-auto">
          <button
            className="w-24 h-24 rounded-full bg-primary flex items-center justify-center border-4 border-primary/60 shadow-2xl shadow-primary/40 active:scale-90 active:brightness-110 transition-transform"
            onTouchStart={() => { touchRef.current.actionSpecial = true; }}
            onTouchEnd={() => { touchRef.current.actionSpecial = false; }}
          >
            <div className="text-background-dark font-black text-center leading-tight">
              <div className="text-2xl">🚀</div>
              <div className="text-[10px] tracking-wide">SPECIAL</div>
            </div>
          </button>
        </div>
      </div>

      {/* ── Desktop hint ─────────────────────────────────────────────────────── */}
      <div className="hidden md:flex absolute bottom-2 inset-x-0 justify-center">
        <span className="text-[10px] text-white/20 font-mono">P1: WASD + F &nbsp;|&nbsp; P2: 방향키 + / &nbsp;|&nbsp; ESC: 일시정지</span>
      </div>

      {/* ── Countdown overlay (React) ─────────────────────────────────────── */}
      {countdownDisplay > 0 && (
        <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-primary text-[120px] font-black leading-none drop-shadow-[0_0_40px_rgba(249,212,6,0.5)] animate-pulse">
              {countdownDisplay}
            </div>
            <div className="text-white/60 text-sm font-bold mt-4 tracking-widest uppercase">
              {stateRef.current.players[0]?.config.flag} {stateRef.current.players[0]?.config.name} vs {stateRef.current.players[1]?.config.name} {stateRef.current.players[1]?.config.flag}
            </div>
          </div>
        </div>
      )}

      {/* ── Pause modal ─────────────────────────────────────────────────────── */}
      {showPause && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-72 bg-card-dark rounded-2xl p-6 border border-white/10 space-y-3 text-center">
            <h2 className="text-xl font-bold text-primary mb-4">일시정지</h2>
            <button
              onClick={() => setShowPause(false)}
              className="w-full h-12 bg-primary text-background-dark rounded-xl font-black text-base"
            >계속하기</button>
            <button
              onClick={() => { window.location.href = '/lobby'; }}
              className="w-full h-12 bg-white/10 text-slate-300 rounded-xl font-bold text-sm"
            >작전실로 나가기</button>
          </div>
        </div>
      )}
    </div>
  );
}
