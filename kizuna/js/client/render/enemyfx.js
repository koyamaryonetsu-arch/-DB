// てきの うごき（こうげき・じゅもん・ブレス…）と、みかたに あたった ときの えんしゅつ
import { MONSTERS } from '../../shared/data/monsters.js?v=a39a58253380';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t);
const easeIn = (t) => t * t * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// うごきの ながさ（ms）と、あたる わりあい
export const ACTS = {
  lunge: { dur: 380, hit: 0.48 },
  big: { dur: 540, hit: 0.56 },
  jump: { dur: 600, hit: 0.64 },
  cast: { dur: 440, hit: 0.45 },
  breath: { dur: 620, hit: 0.36 },
  shimmy: { dur: 480, hit: 0.42 },
  heal: { dur: 480, hit: 0.3 },
  buff: { dur: 460, hit: 0.3 },
  roar: { dur: 540, hit: 0.3 },
  charge: { dur: 820, hit: 0.5 },
};

const ELEM_COL = { fire: '#ff7a3a', ice: '#9ae6ff', wind: '#9af0b0', bolt: '#fff6b0', dark: '#b07ae0', light: '#fff6b0', blast: '#ffb04a', void: '#c8a8ff' };
const STATUS_COL = { sleep: '#f7a1d4', poison: '#b06ae0', paralyze: '#ffe066', blind: '#8a8aa0', confuse: '#ffe066', silence: '#9ad8ff' };

// なにを したかで うごきを えらぶ
export function enemyActKind(fx, ab, actor) {
  if (!fx) return null;
  if (fx.type === 'attack') return actor.boss ? 'big' : 'lunge';
  if (fx.type === 'telegraph') return 'charge';
  if (fx.type !== 'ability' || !ab) return null;
  const e = ab.effect || {};
  const anim = fx.anim;
  switch (e.type) {
    case 'phys': case 'drainHp':
      if (anim === 'quake') return 'jump';
      return anim === 'tackle' || actor.boss || (e.mult || 1) >= 1.6 ? 'big' : 'lunge';
    case 'magic': return e.breath || anim === 'breath' ? 'breath' : 'cast';
    case 'status': case 'debuff': case 'drainMp': return anim === 'breath' ? 'breath' : 'shimmy';
    case 'heal': case 'cure': case 'revive': return 'heal';
    case 'buff': case 'cover': case 'charge': return 'buff';
    case 'callHelp': return 'roar';
    case 'telegraph': return 'charge';
    default: return null;
  }
}

// うごきの いろ
export function actColor(kind, fx, ab) {
  const e = ab?.effect || {};
  if (kind === 'heal') return '#7dffb0';
  if (kind === 'buff') return '#ffd66b';
  if (kind === 'charge') return '#ff3a2a';
  if (e.type === 'status') return STATUS_COL[e.status] || '#c8a8f0';
  if (e.type === 'debuff' || e.type === 'drainMp') return '#b07ae0';
  return ELEM_COL[fx?.element || e.element] || (kind === 'cast' || kind === 'breath' ? '#6ac8ff' : '#ffffff');
}

// ブレスの いろ
function breathCols(fx, ab) {
  const e = ab?.effect || {};
  const el = fx?.element || e.element;
  if (el === 'fire') return { cols: ['#ffe07a', '#ff9a3a', '#ff5a2a', '#ff7a2a'], add: true, base: '#ff6a1a', spark: ['#ffe07a', '#ff9a3a', '#fff6c0'] };
  if (el === 'ice') return { cols: ['#e6fbff', '#9ae6ff', '#ffffff'], add: true, base: '#6ac8ff', spark: ['#ffffff', '#e6fbff'] };
  if (e.status === 'sleep') return { cols: ['#f7c8e8', '#ffd0ec', '#ffffff'], add: false, base: '#f7a1d4', spark: ['#ffffff', '#ffc8e8'] };
  if (e.status === 'poison') return { cols: ['#b06ae0', '#d8a8ff', '#7a3aa8'], add: false, base: '#8a3ac8', spark: ['#d8a8ff', '#b06ae0'] };
  return { cols: ['#e6fbff', '#ffffff', '#c8e0ff'], add: false, base: '#c8e0ff', spark: ['#ffffff'] };
}

// てきが うごきはじめる。へんじ: みかたに あたる じかん（ms）
// pt: てきの まんなか {x,y,w,h,foot}、to: みかたの いち、o: { fx, ab, boss, finisher }
export function startEnemyAct(E, a, pt, kind, to, o = {}) {
  const A = ACTS[kind];
  if (!A || !pt) return 0;
  const boss = !!(a.boss || o.finisher);
  const big = boss && (kind === 'big' || kind === 'jump' || kind === 'cast' || kind === 'breath');
  const dur = A.dur * (boss && (kind === 'big' || kind === 'jump') ? 1.12 : 1);
  const color = actColor(kind, o.fx, o.ab);
  a.act = { kind, age: 0, dur, color, boss };
  const hitAt = dur * A.hit;
  const { x, y } = pt;
  const foot = Math.min(E.H - 8, pt.foot ?? y + 16);
  if (o.finisher || big) {
    // ボスの 大技: くらく なって ひかり、あたる ときに がめんが しろく はじける
    E.tintAt('rgba(20, 0, 30, 0.32)', hitAt);
    E.glow(x, y, { color: '#ff5a3a', r: (pt.h || 40) * 0.9, life: hitAt + 120, alpha: 0.7, grow: 1 });
    if (o.finisher) {
      E.converge(x, y, { colors: ['#ffffff', '#ffd66b'], n: 18, r: 60, life: hitAt * 0.8 });
      E.flashAt(140, '#ffffff', hitAt);
      E.hitStop(320, hitAt, 2.6);
    }
  }
  switch (kind) {
    case 'big':
      E.speedLines(x, y, { delay: hitAt * 0.55, r0: 20, r1: 120, n: 18, life: 260, color: '#ffffff' });
      break;
    case 'jump': {
      const land = dur * 0.64;
      E.shock(x, foot, { r0: 6, r1: 120, sy: 0.22, color: '#ffffff', w: 2.4, delay: land, life: 440 });
      E.shock(x, foot, { r0: 4, r1: 80, sy: 0.22, color: '#d8c0a0', w: 1.6, delay: land + 60, life: 420 });
      E.debris(x, foot - 4, ['#a08060', '#6a5040', '#d8c0a0', '#8a7050'], 14, land, 140);
      for (let k = 0; k < 6; k++) E.puff(x + (k - 2.5) * 12, foot, { color: '#d8c8b0', vx: (k - 2.5) * 44, vy: -10, r0: 4, r1: 15, life: 640, delay: land, alpha: 0.55 });
      E.hitStop(380, land, 2.4);
      break;
    }
    case 'cast':
      E.converge(x, y, { colors: [color, '#ffffff'], n: 16, r: 36, life: dur * 0.42 });
      E.glow(x, y, { color, r: 26, life: dur * 0.6, alpha: 0.7, grow: 0.8 });
      E.rune(x, foot, { color, r: Math.max(18, (pt.w || 30) * 0.6), life: dur });
      break;
    case 'breath': {
      // すいこんで、ブレスを はく（くちから こちらへ ひろがる）
      E.converge(x, y, { colors: ['#ffffff'], n: 8, r: 30, life: dur * 0.32, size: 0.6 });
      const { cols, add, base, spark } = breathCols(o.fx, o.ab);
      const mx = x, my = y + (pt.h || 30) * 0.08;
      const t0 = dur * 0.36;
      const pts = to && to.length ? to : [{ x: E.W / 2, y: E.H + 10 }];
      // くちもとが ひかって、こちらへ ひろがる けむり（ちかづくほど 大きく）
      E.glow(mx, my, { color: base, r: 18, delay: t0 - 60, life: 420, alpha: 0.9 });
      for (let k = 0; k < 44; k++) {
        const p = pts[k % pts.length];
        const life = rnd(380, 560);
        const tx = p.x + rnd(-44, 44), ty = p.y + rnd(-4, 22);
        const vx = (tx - mx) / (life / 1000), vy = (ty - my) / (life / 1000);
        // したじ（ふつうの いろ）と ひかり（かさねる）を まぜて、どんな はいけいでも 見える ように
        E.puff(mx, my, { color: k % 3 ? pick(cols) : base, vx, vy, r0: 3, r1: rnd(30, 52), life, delay: t0 + k * 8, alpha: k % 3 ? 0.7 : 0.5, add: add && k % 3 !== 0 });
      }
      E.sparks(mx, my, { colors: spark, n: 24, speed: 170, ang: Math.PI / 2, spread: 0.7, g: 0, drag: 0.99, delay: t0, life: 520, len: 8, size: 1.2 });
      return t0 + 300;
    }
    case 'shimmy':
      // あやしい ひかりが なみの ように こちらへ
      E.glow(x, y, { color, r: 26, life: dur, alpha: 0.6, add: true });
      for (let k = 0; k < 10; k++) E.twinkle(x + rnd(-18, 18), y + rnd(-14, 14), { color, size: rnd(2.6, 4), vy: -20, delay: k * 36, life: 440, spin: 4 });
      for (let k = 0; k < 2; k++) E.shock(x, y, { r0: 8, r1: 150, sy: 0.55, color, w: 2.2, delay: hitAt - 80 + k * 90, life: 460 });
      break;
    case 'heal':
      E.glow(x, y, { color: '#7dffb0', r: 28, life: dur, alpha: 0.6 });
      for (let k = 0; k < 10; k++) E.twinkle(x + rnd(-16, 16), foot - rnd(0, 8), { color: pick(['#7dffb0', '#ffffff', '#b8ffd0']), size: rnd(2, 3.5), vy: rnd(-70, -30), delay: k * 30, life: 540 });
      break;
    case 'buff':
      E.glow(x, y, { color, r: 28, life: dur * 0.8, alpha: 0.6 });
      E.shock(x, y, { r0: 6, r1: 36, color, w: 1.6, life: 420 });
      E.shock(x, y, { r0: 6, r1: 36, color: '#ffffff', w: 1, delay: 120, life: 420 });
      break;
    case 'roar':
      for (let k = 0; k < 3; k++) E.shock(x, y - 4, { r0: 8, r1: 80, color: '#ffffff', w: 1.8, delay: k * 110, life: 440 });
      E.hitStop(dur * 0.8, 0, 0.7);
      break;
    case 'charge':
      E.converge(x, y, { colors: ['#ff5a3a', '#ffd66b', '#ffffff'], n: 22, r: 52, life: dur * 0.6 });
      E.converge(x, y, { colors: ['#ff5a3a', '#ffffff'], n: 16, r: 44, life: dur * 0.5, delay: dur * 0.35 });
      E.glow(x, y, { color: '#ff3a2a', r: (pt.h || 40) * 0.9, life: dur, alpha: 0.6, grow: 1 });
      E.hitStop(dur * 0.9, 0, 0.5);
      E.tintAt('rgba(60, 0, 0, 0.2)', dur);
      break;
    default:
  }
  return hitAt;
}

// その しゅんかんの すがた（dx,dy: ずれ、sx,sy: 大きさ、aura: まわりの ひかり、white: しろく ひかる）
export function actPose(a, ageOverride) {
  const age = ageOverride ?? a.age;
  const t = clamp01(age / a.dur);
  const B = a.boss ? 1.3 : 1;
  const P = { dx: 0, dy: 0, sx: 1, sy: 1, aura: null, auraA: 0, white: 0, ghost: false };
  switch (a.kind) {
    case 'lunge': case 'big': {
      // うしろに ひいて → こちらへ とびこむ → もどる
      const k = (a.kind === 'big' ? 1.6 : 1) * B;
      const peak = 0.24 * k;
      if (t < 0.3) {
        const u = easeOut(t / 0.3);
        P.dy = -3 * k * u;
        P.sx = P.sy = 1 - 0.06 * u;
        if (a.kind === 'big') P.white = 0.55 * Math.sin(u * Math.PI);
      } else if (t < 0.5) {
        const u = easeIn((t - 0.3) / 0.2);
        P.dy = -3 * k + 12 * k * u;
        P.sx = P.sy = 0.94 + (peak + 0.06) * u;
        P.ghost = true;
      } else {
        const u = easeOut((t - 0.5) / 0.5);
        P.dy = 9 * k * (1 - u);
        P.sx = P.sy = 1 + peak * (1 - u);
        P.ghost = t < 0.6;
      }
      break;
    }
    case 'jump': {
      if (t < 0.14) {
        const u = t / 0.14;
        P.sy = 1 - 0.12 * u; P.sx = 1 + 0.1 * u;
      } else if (t < 0.52) {
        const u = (t - 0.14) / 0.38;
        P.dy = -40 * B * Math.sin((u * Math.PI) / 2); P.sy = 1.08; P.sx = 0.95;
      } else if (t < 0.64) {
        const u = (t - 0.52) / 0.12;
        P.dy = -40 * B * (1 - easeIn(u)); P.sy = 1.1; P.sx = 0.94; P.ghost = true;
      } else {
        const u = easeOut(clamp01((t - 0.64) / 0.22));
        P.sy = 0.8 + 0.2 * u; P.sx = 1.18 - 0.18 * u;
      }
      break;
    }
    case 'cast':
      P.dy = -3 * Math.sin(Math.PI * t);
      P.aura = a.color; P.auraA = 0.75 * Math.sin(Math.PI * Math.min(1, t * 1.2));
      P.white = Math.max(0, 1 - Math.abs(t - 0.45) / 0.08) * 0.7;
      break;
    case 'breath':
      if (t < 0.36) {
        const u = easeOut(t / 0.36);
        P.sy = 1 + 0.08 * u; P.sx = 1 - 0.05 * u; P.dy = -3 * u;
      } else if (t < 0.7) {
        const u = easeOut(clamp01((t - 0.36) / 0.1));
        P.sy = 1.08 - 0.14 * u; P.sx = 0.95 + 0.14 * u; P.dy = -3 + 7 * u;
      } else {
        const u = easeOut((t - 0.7) / 0.3);
        P.sy = 0.94 + 0.06 * u; P.sx = 1.09 - 0.09 * u; P.dy = 4 * (1 - u);
      }
      P.aura = a.color; P.auraA = t > 0.3 && t < 0.75 ? 0.45 : 0;
      break;
    case 'shimmy':
      P.dx = Math.sin(t * Math.PI * 8) * 3 * (1 - t) * B;
      P.aura = a.color; P.auraA = 0.55 * Math.sin(Math.PI * t);
      break;
    case 'heal':
      P.dy = -4 * Math.sin(Math.PI * t);
      P.aura = '#7dffb0'; P.auraA = 0.6 * Math.sin(Math.PI * t);
      break;
    case 'buff': {
      const k = Math.sin(Math.PI * t);
      P.sx = P.sy = 1 + 0.1 * k;
      P.aura = a.color; P.auraA = 0.6 * k;
      P.white = t < 0.15 ? 0.5 * (1 - t / 0.15) : 0;
      break;
    }
    case 'roar': {
      const k = Math.sin(t * Math.PI * 7) * (1 - t);
      P.sx = 1 + 0.07 * k; P.sy = 1 - 0.07 * k; P.dy = -2 * Math.sin(Math.PI * t);
      P.aura = '#ff9a6a'; P.auraA = 0.35 * Math.sin(Math.PI * t);
      break;
    }
    case 'charge':
      P.dx = (Math.random() - 0.5) * 2.6 * t;
      P.sx = P.sy = 1 + 0.06 * t;
      P.aura = '#ff3a2a'; P.auraA = 0.35 + 0.3 * Math.sin(age / 60);
      break;
    default:
  }
  return P;
}

// みかたに あたる ときの えの しゅるい
const RACE_HIT = { beast: 'claw', demon: 'claw', dragon: 'claw', undead: 'slash', spirit: 'dark' };
const ELEM_HIT = { fire: 'fire', ice: 'ice', wind: 'wind', bolt: 'bolt', dark: 'darkm', light: 'light', blast: 'blast', void: 'light' };
export function hitStyle(fx, ab, actor) {
  const e = ab?.effect || {};
  const anim = fx?.anim;
  const magic = e.type === 'magic';
  if (magic && ELEM_HIT[fx.element || e.element]) return ELEM_HIT[fx.element || e.element];
  if (e.type === 'status' || e.type === 'debuff' || e.type === 'drainMp') return 'powder';
  switch (anim) {
    case 'bite': return 'bite';
    case 'slash_heavy': case 'slash_fast': case 'slash_multi': case 'cross_slash': case 'gigabreak': return 'slash';
    case 'dark_slash': return 'dark';
    case 'quake': return 'quake';
    case 'ice1': case 'ice2': return magic ? 'water' : 'ice';
    case 'wind1': case 'wind2': return 'wind';
    case 'bolt1': case 'bolt2': return 'bolt';
    case 'dark1': return 'darkm';
    case 'tackle': return 'blow';
    default:
  }
  if (magic) return 'blast';
  return RACE_HIT[MONSTERS[actor?.species]?.race] || 'blow';
}

// みかたに あたる（がめんの てまえ、したの ほう）。power: HPに たいする ダメージの わりあい
export function closeUp(E, p, style, power = 0.1, delay = 0, color = null) {
  const k = 0.85 + Math.min(1, power) * 0.8;
  const { x, y } = p;
  // きりさく・かみつく ものは、ダメージの しゅんかんに ちょうど おわる ように すこし はやく はじめる
  const early = { claw: 60, bite: 125, slash: 90, dark: 90 }[style] || 0;
  delay = Math.max(0, delay - early);
  switch (style) {
    case 'claw':
      for (let i = 0; i < 3; i++) E.cut(x + (i - 1) * 12 * k, y - 8, { ang: 1.05, len: 72 * k, w: 2.6 * k, color: '#ffffff', glow: '#ff3a3a', delay: delay + i * 30, life: 380, speed: 70 });
      E.sparks(x, y - 8, { colors: ['#ff8a8a', '#ffffff'], n: 12, speed: 140, ang: 1.05, spread: 0.6, delay: delay + 60, life: 320 });
      break;
    case 'bite':
      E.fang(x, y - 12, { color: '#ffffff', glow: '#ff5a5a', size: 1.9 * k, delay, life: 420 });
      E.sparks(x, y - 12, { colors: ['#ff6a6a', '#ffffff'], n: 12, speed: 130, delay: delay + 130, life: 320 });
      break;
    case 'slash':
    case 'dark': {
      const g = style === 'dark' ? '#8a3ae0' : '#ff5a5a';
      E.swipe([x - 74 * k, y - 46], [x + 6, y - 12], [x + 66 * k, y + 34], { w: 7 * k, color: '#ffffff', glow: g, core: '#ffffff', delay, swing: 130, life: 340, pow: 1.4 });
      E.sparks(x, y - 12, { colors: ['#ffffff', style === 'dark' ? '#c8a8f0' : '#ffb0b0'], n: 12, speed: 150, ang: 0.6, spread: 0.5, delay: delay + 90, life: 320 });
      if (style === 'dark') E.glow(x, y - 10, { color: '#3a1a5a', r: 40 * k, delay: delay + 80, life: 420, add: false, alpha: 0.55 });
      break;
    }
    case 'quake':
      E.debris(x, y + 8, ['#a08060', '#6a5040', '#d8c0a0'], 10, delay, 170);
      E.puff(x, y + 10, { color: '#d8c8b0', r0: 8, r1: 34, vy: -20, life: 520, delay, alpha: 0.5 });
      break;
    case 'fire':
      E.glow(x, y, { color: '#ff7a2a', r: 46 * k, delay, life: 460, alpha: 0.8 });
      E.sparks(x, y + 18, { colors: ['#ffe07a', '#ff9a3a', '#ff5a2a', '#fff6c0'], n: 28, speed: 90, ang: -Math.PI / 2, spread: 0.7, g: -160, drag: 0.96, delay, life: 560, len: 7, size: 1.6 });
      break;
    case 'ice':
      E.glow(x, y - 6, { color: '#9ae6ff', r: 40 * k, delay, life: 420 });
      for (let i = 0; i < 12; i++) E.add({ kind: 'shard', x: x + rnd(-10, 10), y: y - 8 + rnd(-6, 6), vx: rnd(-160, 160), vy: rnd(-120, 60), color: pick(['#e6fbff', '#9ae6ff', '#5ab8e8']), life: 420, delay });
      E.twinkle(x, y - 8, { color: '#e6fbff', size: 14 * k, delay, life: 260 });
      break;
    case 'water':
      for (let i = 0; i < 16; i++) E.drop(x + rnd(-16, 16), y + 10, { color: pick(['#9ae6ff', '#e6fbff', '#5ab8e8']), vx: rnd(-90, 90), vy: rnd(-190, -80), g: 380, size: rnd(1.2, 2.2), delay, life: 620 });
      E.shock(x, y + 6, { r0: 6, r1: 60 * k, sy: 0.35, color: '#bfe6ff', w: 2, delay, life: 380 });
      break;
    case 'wind':
      for (let i = 0; i < 5; i++) E.gust(x, y - 26 + i * 10, { len: 110, amp: 5, color: '#e8fff0', w: 1.3, dir: i % 2 ? -1 : 1, delay: delay + i * 30, life: 420 });
      E.swirl(x, y - 6, ['#e8fff0', '#9af0b0', '#ffffff'], { n: 26, rad: 24 * k, h: 60, delay, life: 560, size: 1.4 });
      break;
    case 'bolt':
      E.zap(x + rnd(-10, 10), -6, x, y + 16, { color: '#fff6b0', glow: '#7ac8ff', w: 2.2, delay, life: 320, forks: 2 });
      E.glow(x, y + 6, { color: '#9ad8ff', r: 44 * k, delay, life: 320 });
      E.flashAt(120, '#fffbe0', delay);
      break;
    case 'darkm':
      E.glow(x, y, { color: '#3a1a5a', r: 46 * k, delay, life: 480, add: false, alpha: 0.6 });
      E.sparks(x, y + 10, { colors: ['#c8a8f0', '#8a5ac8'], n: 16, speed: 80, ang: -Math.PI / 2, spread: 0.9, g: -80, delay, life: 520 });
      break;
    case 'light':
      E.glow(x, y, { color: '#fff6b0', r: 50 * k, delay, life: 420 });
      E.add({ kind: 'crossflash', x, y: y - 8, color: '#fffbe0', life: 320, delay });
      break;
    case 'blast':
      E.star(x, y - 8, '#ffffff', 18 * k, delay, 220);
      E.shock(x, y - 8, { r0: 6, r1: 70 * k, color: '#ffd66b', w: 2.4, delay, life: 380 });
      E.sparks(x, y - 8, { colors: ['#ffffff', '#ffd66b', '#ff8a2a'], n: 18, speed: 170, delay, life: 380 });
      break;
    case 'powder': {
      const c = color || '#f7a1d4';
      for (let i = 0; i < 20; i++) E.twinkle(x + rnd(-44, 44), y - 44 + rnd(-10, 10), { color: c, size: rnd(2.4, 4.2), vy: rnd(50, 80), delay: Math.max(0, delay - 200) + i * 16, life: 560, spin: 3 });
      E.glow(x, y, { color: c, r: 46, delay, life: 460, alpha: 0.7 });
      break;
    }
    case 'blow':
    default:
      // ドカッ（こちらに むかって くる しょうげき）
      E.glow(x, y - 8, { color: '#ffb05a', r: 36 * k, delay, life: 300, alpha: 0.8 });
      E.star(x, y - 8, '#ffffff', 20 * k, delay, 220);
      E.shock(x, y - 8, { r0: 6, r1: 80 * k, color: '#ffffff', w: 3, delay, life: 320 });
      E.sparks(x, y - 8, { colors: ['#ffffff', '#ffd66b'], n: 14, speed: 170, delay, life: 320, len: 10 });
  }
}
