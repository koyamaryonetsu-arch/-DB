// 第88回: 作品を 思い出す 装備の「使う」の えんしゅつ（かくし技。shared/data/abilities-r88.js）
//   ほかの 品の えんしゅつは 今 ある 物を 使い回す。作品の 顔に なる 品だけ ここで 作る
//   battlefx.js の play() で よばれる（ここに ない anim なら false）。文字は 出さない
//
//  r88_raikou  雷公べん・大いかずち … 画面が まっくらに なり、空から 金と むらさきの 太い いなずまが 何本も 落ちて、
//              敵 みんなに 大きな いなずまが つきささる → 白い 光 ＋ 大きな 輪
//  r88_hikari  光の剣・光のやいば（G2班）… 画面が 少し くらく なり、画面の 手前から 金色の 長い 光の やいばが のびて、
//              敵に 大きく 2回 切りつける → 白い 光の 十字 ＋ 光の つぶ
//  r88_fujin   風神・風魂（G2班）… 緑と 白の つむじ風が うずを まいて ふくらみ、風の やいばが 何本も 敵の グループを 切りさく
//  r88_raijin  雷神・いかずち（G2班）… こての 雷が 青白く ばちばち 光り、敵 みんなの 上から 青い いなずまが ジグザグに 落ちる
// G12班: 味方に かける えんしゅつ（もしもボックス・ムーン・ヒーリング）を PARTY_ANIMS に まぜる（client/battle.js が 画面の 下に 出す）
import { PARTY_ANIMS } from './battlefx-jobs2.js?v=dd9bfc47ef83';
const BOLT = ['#ffffff', '#fff6b0', '#ffd23a', '#c890ff'];
const LIGHT = ['#ffffff', '#fffbe0', '#ffe680', '#ffd23a'];
const WIND = ['#ffffff', '#e8fff0', '#9ef0c0', '#4ad890'];
const BLUE = ['#ffffff', '#d8f0ff', '#7ac8ff', '#3a8aff'];

const rnd = (a, b) => a + Math.random() * (b - a);

export const R88_ANIMS = new Set(['r88_raikou', 'r88_hikari', 'r88_fujin', 'r88_raijin']);
export const R88_HIT = { r88_raikou: 900, r88_hikari: 520, r88_fujin: 640, r88_raijin: 760 };
export const R88_SFX = { r88_raikou: 'thunder', r88_hikari: 'crit', r88_fujin: 'wind', r88_raijin: 'thunder' };

export function playR88Fx(fx, anim, targets, element, opts, W, H) {
  if (G8_FX[anim]) return G8_FX[anim](fx, targets, W, H); // G8班（ファイルの さいご）
  if (!R88_ANIMS.has(anim)) return false;
  if (anim === 'r88_hikari') return hikari(fx, targets, W, H);
  if (anim === 'r88_fujin') return fujin(fx, targets, W, H);
  if (anim === 'r88_raijin') return raijin(fx, targets, W, H);
  if (G7_FX[anim]) return G7_FX[anim](fx, targets, W, H); // G7班
  // 空が くらく なる → 雷雲が ゴロゴロ
  fx.tintAt('rgba(20,10,50,0.55)', 1500);
  for (let k = 0; k < 7; k++) {
    const x = 20 + k * ((W - 40) / 6) + rnd(-10, 10);
    fx.zap(x + rnd(-20, 20), -10, x, H * 0.55 + rnd(-20, 20), { color: '#ffffff', glow: k % 2 ? '#c890ff' : '#ffd23a', w: 1.4, delay: 120 + k * 70, life: 260, forks: 2 });
  }
  fx.flashAt(90, '#fff8d0', 200);
  // 敵 ひとりずつに 太い いなずま
  targets.forEach((t, i) => {
    const d = 620 + i * 60;
    fx.zap(t.x + rnd(-6, 6), -20, t.x, t.y - 4, { color: '#ffffff', glow: '#ffd23a', w: 3, delay: d, life: 360, forks: 3 });
    fx.zap(t.x + rnd(-14, 14), -20, t.x, t.y - 4, { color: '#f0e0ff', glow: '#a060ff', w: 2, delay: d + 40, life: 320, forks: 2 });
    fx.sparks(t.x, t.y, { colors: BOLT, n: 22, speed: 150, delay: d + 80, life: 420 });
    fx.shock(t.x, t.y, { r0: 6, r1: 46, color: '#ffe680', w: 3, delay: d + 60, life: 380 });
  });
  fx.flashAt(140, '#ffffff', 660);
  fx.hitStop(160, 700, 1.6);
  return true;
}

// 光の剣: 光の やいばが のびて、大きく 2回 切る
function hikari(fx, targets, W, H) {
  fx.tintAt('rgba(30,24,10,0.35)', 900);
  const t = targets[0] || { x: W * 0.3, y: H * 0.45 };
  // 光が あつまる → やいばが のびる
  fx.converge(t.x - 10, t.y + 80, { colors: LIGHT, n: 16, r: 34, delay: 0, life: 260 });
  fx.spear(t.x - 10, t.y + 90, t.x, t.y - 6, { len: 90, w: 4, color: '#ffffff', glow: '#ffd23a', tip: '#ffffff', delay: 220, travel: 120, hold: 120, life: 360 });
  // 大きく 2回 切る
  fx.swipe([t.x - 34, t.y - 34], [t.x, t.y - 4], [t.x + 30, t.y + 30], { w: 7, color: '#fffbe0', glow: '#ffd23a', core: '#ffffff', delay: 380, swing: 120, life: 360, after: 2 });
  fx.swipe([t.x + 34, t.y - 30], [t.x, t.y], [t.x - 30, t.y + 30], { w: 6, color: '#fffbe0', glow: '#ffe680', core: '#ffffff', delay: 500, swing: 110, life: 340, after: 1 });
  fx.flashAt(120, '#fff8d0', 520);
  fx.pillar(t.x, t.y + 10, '#ffe680', { w: 10, h: 70, delay: 520, life: 520, edge: '#ffffff' });
  fx.sparks(t.x, t.y, { colors: LIGHT, n: 26, speed: 160, delay: 540, life: 460 });
  fx.shock(t.x, t.y, { r0: 6, r1: 50, color: '#fff2a0', w: 3, delay: 520, life: 400 });
  fx.hitStop(150, 540, 1.3);
  return true;
}

// 風神: 緑の つむじ風と 風の やいば
function fujin(fx, targets, W, H) {
  const cx = targets.length ? targets.reduce((s, t) => s + t.x, 0) / targets.length : W * 0.3;
  const cy = targets.length ? targets.reduce((s, t) => s + t.y, 0) / targets.length : H * 0.45;
  fx.swirl(cx, cy + 16, WIND, { n: 34, rad: 30, h: 80, delay: 0, life: 900, size: 1.8 });
  for (let k = 0; k < 6; k++) fx.gust(cx - 40 + rnd(-10, 10), cy - 30 + k * 12, { len: 90, amp: 6, color: k % 2 ? '#ffffff' : '#9ef0c0', w: 1.4, dir: 1, delay: 80 + k * 50, life: 420 });
  targets.forEach((t, i) => {
    const d = 380 + i * 70;
    fx.cut(t.x, t.y - 4, { ang: 0.7, len: 40, w: 2.2, color: '#ffffff', glow: '#4ad890', delay: d, life: 260 });
    fx.cut(t.x, t.y - 2, { ang: -0.6, len: 36, w: 2, color: '#e8fff0', glow: '#9ef0c0', delay: d + 70, life: 260 });
    fx.cut(t.x, t.y, { ang: 1.4, len: 30, w: 1.8, color: '#ffffff', glow: '#4ad890', delay: d + 140, life: 240 });
    fx.sparks(t.x, t.y, { colors: WIND, n: 14, speed: 120, delay: d + 60, life: 380 });
  });
  fx.hitStop(110, 520, 1.1);
  return true;
}

// 雷神: 青白い いなずま
function raijin(fx, targets, W, H) {
  fx.tintAt('rgba(10,20,50,0.5)', 1200);
  fx.flashAt(70, '#d8f0ff', 120);
  for (let k = 0; k < 5; k++) {
    const x = 30 + k * ((W - 60) / 4) + rnd(-12, 12);
    fx.zap(x, -10, x + rnd(-30, 30), H * 0.5, { color: '#ffffff', glow: '#3a8aff', w: 1.2, delay: 100 + k * 60, life: 240, forks: 2 });
  }
  targets.forEach((t, i) => {
    const d = 480 + i * 70;
    fx.zap(t.x + rnd(-8, 8), -20, t.x, t.y - 4, { color: '#ffffff', glow: '#7ac8ff', w: 3, delay: d, life: 360, forks: 3 });
    fx.zap(t.x + rnd(-16, 16), -20, t.x, t.y - 4, { color: '#d8f0ff', glow: '#3a8aff', w: 2, delay: d + 50, life: 320, forks: 2 });
    fx.sparks(t.x, t.y, { colors: BLUE, n: 20, speed: 150, delay: d + 70, life: 400 });
    fx.ring(t.x, t.y, '#7ac8ff', 3, d + 60, 380, 42);
  });
  fx.flashAt(120, '#ffffff', 560);
  fx.hitStop(140, 600, 1.4);
  return true;
}

// ───── G7班: 犬夜しゃ・ゆう☆遊☆白書 ─────
//  r88_bakusai  爆さいが（本気の せっしょう丸の 大技）… みどりの 光の 刀が 横に 2回 走り、切った 所から 光が つぎつぎ はじける
//  r88_reikou   れい光はどう（幻海の 大技）… 手前に 青白い 光が あつまり、大きな 光の 玉が 敵へ とんで 広がる
//  r88_jigento  次元刀・空間切り … 画面が くらく なり、敵の 前に 黒い 空間の 切れ目が たてに ひらいて、白く 光って とじる
const GREEN = ['#ffffff', '#e0ffe8', '#8af0b0', '#3ac878'];
const SPIRIT = ['#ffffff', '#e0f4ff', '#8ad0ff', '#3a9aff'];
const VOID = ['#ffffff', '#d8c8ff', '#8a6ad0', '#3a2a6a'];
const center = (targets, W, H) => (targets.length ? { x: targets.reduce((s, t) => s + t.x, 0) / targets.length, y: targets.reduce((s, t) => s + t.y, 0) / targets.length } : { x: W * 0.3, y: H * 0.45 });

function bakusai(fx, targets, W, H) {
  const c = center(targets, W, H);
  fx.tintAt('rgba(6,24,14,0.45)', 1300);
  fx.converge(c.x + 60, c.y + 40, { colors: GREEN, n: 18, r: 40, delay: 0, life: 280 });
  fx.swipe([c.x - 70, c.y - 20], [c.x, c.y - 6], [c.x + 70, c.y + 8], { w: 8, color: '#e0ffe8', glow: '#3ac878', core: '#ffffff', delay: 280, swing: 140, life: 380, after: 2 });
  fx.swipe([c.x + 70, c.y - 26], [c.x, c.y], [c.x - 70, c.y + 16], { w: 7, color: '#e0ffe8', glow: '#8af0b0', core: '#ffffff', delay: 440, swing: 130, life: 360, after: 1 });
  targets.forEach((t, i) => {
    for (let k = 0; k < 3; k++) {
      const d = 620 + i * 60 + k * 110;
      const x = t.x + rnd(-14, 14), y = t.y + rnd(-14, 10);
      fx.shock(x, y, { r0: 4, r1: 30 + k * 6, color: k % 2 ? '#8af0b0' : '#ffffff', w: 3, delay: d, life: 320 });
      fx.sparks(x, y, { colors: GREEN, n: 12, speed: 140, delay: d + 20, life: 380 });
    }
  });
  fx.flashAt(160, '#e8fff0', 640);
  fx.hitStop(150, 680, 1.4);
  return true;
}

function reikou(fx, targets, W, H) {
  const c = center(targets, W, H);
  const sx = W * 0.82, sy = H * 0.62;
  fx.tintAt('rgba(8,18,40,0.4)', 1300);
  fx.converge(sx, sy, { colors: SPIRIT, n: 26, r: 46, delay: 0, life: 420 });
  fx.shock(sx, sy, { r0: 30, r1: 6, color: '#8ad0ff', w: 2, delay: 120, life: 300 });
  fx.spear(sx, sy, c.x, c.y, { len: 70, w: 12, color: '#ffffff', glow: '#3a9aff', tip: '#e0f4ff', delay: 440, travel: 200, hold: 80, life: 340 });
  fx.flashAt(150, '#e0f4ff', 640);
  fx.shock(c.x, c.y, { r0: 10, r1: 90, color: '#8ad0ff', w: 5, delay: 640, life: 520 });
  targets.forEach((t, i) => {
    fx.ring(t.x, t.y, '#ffffff', 3, 660 + i * 50, 420, 40);
    fx.sparks(t.x, t.y, { colors: SPIRIT, n: 18, speed: 160, delay: 680 + i * 50, life: 420 });
  });
  fx.hitStop(150, 680, 1.4);
  return true;
}

function jigento(fx, targets, W, H) {
  const t = targets[0] || { x: W * 0.3, y: H * 0.45 };
  fx.tintAt('rgba(10,4,24,0.55)', 1100);
  fx.pillar(t.x, t.y + 30, '#1a0e36', { w: 4, h: 100, delay: 120, life: 520, edge: '#d8c8ff' });
  fx.cut(t.x, t.y - 6, { ang: 1.5, len: 80, w: 3, color: '#ffffff', glow: '#8a6ad0', delay: 160, life: 420 });
  fx.cut(t.x, t.y - 6, { ang: 0.9, len: 60, w: 2.4, color: '#ffffff', glow: '#d8c8ff', delay: 420, life: 300 });
  fx.flashAt(120, '#ffffff', 560);
  fx.sparks(t.x, t.y, { colors: VOID, n: 24, speed: 170, delay: 580, life: 420 });
  fx.shock(t.x, t.y, { r0: 4, r1: 52, color: '#d8c8ff', w: 3, delay: 560, life: 400 });
  fx.hitStop(150, 580, 1.3);
  return true;
}

const G7_FX = { r88_bakusai: bakusai, r88_reikou: reikou, r88_jigento: jigento };
for (const id of Object.keys(G7_FX)) R88_ANIMS.add(id);
Object.assign(R88_HIT, { r88_bakusai: 700, r88_reikou: 680, r88_jigento: 600 });
Object.assign(R88_SFX, { r88_bakusai: 'crit', r88_reikou: 'blast', r88_jigento: 'crit' });

// ───── G8班: らんま1/2・じごく先生ぬ〜べ〜（ほかの 係の 行と ぶつからない ように、ファイルの さいごに まとめた）─────
//  r88_onite   おにの手 … 画面が くらく なり、手の まわりに 赤と むらさきの 光が あつまって、大きな こぶしが 敵1体に 打ちこまれる
//              → 光の 十字の ひび ＋ 大きな 輪（こわく ない よう、血や 顔は 出さない）
//  r88_kaen    火炎じょう・竜の炎 … つえの 竜が 口を 開き、下から 竜の 形に うねる 炎が 敵みんなを つつむ
//  r88_hanabi  八宝大か輪 … 花火玉が 空に 上がり、敵みんなの 上で 色とりどりの 花火が ひらく
const ONI = ['#ffffff', '#ffd0e0', '#ff6a8a', '#a040ff'];
const FIRE = ['#ffffff', '#fff0a0', '#ffb030', '#ff5a1a'];
const HANABI = [['#ffffff', '#ff8ac8', '#ff3a8a'], ['#ffffff', '#a0f0ff', '#3ab0ff'], ['#ffffff', '#fff080', '#ffc020'], ['#ffffff', '#a0ffa0', '#3ad860']];
const centerOf = (targets, W, H) => (targets.length
  ? { x: targets.reduce((s, t) => s + t.x, 0) / targets.length, y: targets.reduce((s, t) => s + t.y, 0) / targets.length }
  : { x: W * 0.5, y: H * 0.45 });

function onite(fx, targets, W, H) {
  fx.tintAt('rgba(30,6,30,0.5)', 1100);
  const t = targets[0] || { x: W * 0.5, y: H * 0.45 };
  // 力が あつまる
  fx.converge(t.x, t.y + 70, { colors: ONI, n: 22, r: 40, delay: 0, life: 360 });
  fx.glow(t.x, t.y + 70, { color: '#ff4a8a', r: 22, delay: 200, life: 300 });
  // こぶしが まっすぐ のびる
  fx.spear(t.x, t.y + 80, t.x, t.y - 2, { len: 70, w: 9, color: '#ffd0e0', glow: '#a040ff', tip: '#ffffff', delay: 420, travel: 90, hold: 120, life: 300 });
  fx.speedLines(t.x, t.y, { color: '#ffd0e0', n: 18, delay: 470, life: 280, r0: 20, r1: 90 });
  fx.flashAt(110, '#ffe0f0', 520);
  fx.impact(t.x, t.y, { r: 26, color: '#ffffff', delay: 520, life: 220 });
  fx.crack(t.x, t.y + 4, { n: 6, len: 30, color: '#3a0a2a', hi: '#ff8ac8', delay: 530, life: 700 });
  fx.shock(t.x, t.y, { r0: 8, r1: 60, color: '#ff8ac8', w: 3.5, delay: 520, life: 420 });
  fx.shock(t.x, t.y, { r0: 4, r1: 40, color: '#c890ff', w: 2, delay: 600, life: 380 });
  fx.sparks(t.x, t.y, { colors: ONI, n: 28, speed: 170, delay: 540, life: 460 });
  fx.hitStop(170, 540, 1.7);
  return true;
}

function kaen(fx, targets, W, H) {
  const c = centerOf(targets, W, H);
  fx.tintAt('rgba(40,10,0,0.4)', 1200);
  // 竜の 口に 火が ともる
  fx.glow(c.x - 70, H - 30, { color: '#ffb030', r: 18, delay: 0, life: 400 });
  // うねる 炎の 竜（左下から 敵の 列の 上を うねりながら 右へ。頭は 大きく、しっぽは 小さく）
  const x0 = Math.max(10, c.x - 110), x1 = Math.min(W - 10, c.x + 110);
  for (let k = 0; k < 22; k++) {
    const f = k / 21;
    const x = x0 + f * (x1 - x0);
    const y = c.y - 20 + Math.sin(f * Math.PI * 2.5) * 18 + (1 - f) * 30;
    const d = 160 + (21 - k) * 28; // 頭（右）から 先に 出て、からだが のびて くる
    const r = 4 + f * 9;
    fx.glow(x, y, { color: k % 3 ? '#ff7a1a' : '#ffd040', r: r * 1.8, delay: d, life: 520, alpha: 0.9, grow: 0.3 });
    fx.puff(x, y, { color: k % 2 ? '#ffb030' : '#ff5a1a', r0: r * 0.6, r1: r * 1.3, vy: -10, delay: d, life: 560, add: true });
    if (k % 3 === 0) fx.sparks(x, y, { colors: FIRE, n: 4, speed: 50, delay: d + 40, life: 360, g: -50 });
  }
  // 頭の 目
  fx.glow(x1 - 4, c.y - 26, { color: '#ffffff', r: 6, delay: 160, life: 600 });
  // 敵みんなが 炎に つつまれる
  targets.forEach((t, i) => {
    const d = 720 + i * 70;
    for (let k = 0; k < 5; k++) fx.puff(t.x + (k - 2) * 6, t.y + 6, { color: k % 2 ? '#ffb030' : '#ff5a1a', r0: 5, r1: 16, vy: -40 - k * 6, delay: d + k * 40, life: 520, add: true });
    fx.glow(t.x, t.y, { color: '#ff9a3a', r: 26, delay: d, life: 460 });
    fx.sparks(t.x, t.y + 6, { colors: FIRE, n: 20, speed: 110, ang: -Math.PI / 2, spread: 1.2, delay: d + 40, life: 480, g: -60 });
  });
  fx.flashAt(100, '#fff0c0', 740);
  fx.hitStop(120, 760, 1.2);
  return true;
}

function hanabi(fx, targets, W, H) {
  const c = centerOf(targets, W, H);
  // 花火玉が 上がる
  fx.proj(c.x, c.y - 40, ['#ffffff', '#fff080'], { size: 3, travel: 360, delay: 0, from: { x: W * 0.5, y: H } });
  const spots = targets.length ? targets : [c];
  spots.forEach((t, i) => {
    const d = 420 + i * 110;
    const col = HANABI[i % HANABI.length];
    fx.flashAt(70, '#ffffff', d);
    fx.sparks(t.x, t.y - 26, { colors: col, n: 34, speed: 150, spread: Math.PI * 2, delay: d, life: 700, g: 40, len: 9 });
    fx.shock(t.x, t.y - 26, { r0: 4, r1: 46, color: col[1], w: 2.5, delay: d, life: 460 });
    for (let k = 0; k < 6; k++) fx.twinkle(t.x + (Math.random() - 0.5) * 60, t.y - 30 + (Math.random() - 0.5) * 40, { color: col[2], size: 5, delay: d + 200 + k * 60, life: 420, g: 20 });
  });
  fx.hitStop(110, 440, 1.1);
  return true;
}

const G8_FX = { r88_onite: onite, r88_kaen: kaen, r88_hanabi: hanabi };
for (const k of Object.keys(G8_FX)) R88_ANIMS.add(k);
Object.assign(R88_HIT, { r88_onite: 540, r88_kaen: 760, r88_hanabi: 460 });
Object.assign(R88_SFX, { r88_onite: 'blast', r88_kaen: 'fire', r88_hanabi: 'blast' });

// ───── G10班: ナルト・きめつのやいば（G8班の 表に まぜる。playR88Fx は さわらない）─────
//  r88_kakuto  赤く光る日輪刀 … 刀が まっ赤に そまって 光り、炎を まとった 大きな 3つの 切りすじが 敵1体を 切る → 赤い 火の 輪
//  r88_basho   ばしょうせん … 大きな うちわの 形の 風の うずが 画面を 横切り、炎・雷・風の 色の すじが 敵みんなを ふきぬける
const KAKU = ['#ffffff', '#ffe0c0', '#ff5a2a', '#c81a1a'];
function kakuto(fx, targets, W, H) {
  fx.tintAt('rgba(40,0,0,0.45)', 1000);
  const t = targets[0] || { x: W * 0.4, y: H * 0.45 };
  // 刀が 赤く そまる（下から 赤い 光が あつまる）
  fx.converge(t.x - 30, t.y + 60, { colors: KAKU, n: 18, r: 36, delay: 0, life: 300 });
  fx.glow(t.x - 30, t.y + 60, { color: '#ff3a1a', r: 20, delay: 180, life: 320 });
  // 炎を まとった 3つの 切りすじ
  const cuts = [[[-40, -30], [0, -2], [38, 30]], [[40, -32], [0, 0], [-36, 30]], [[-46, 4], [0, -4], [46, -2]]];
  cuts.forEach((c, i) => {
    const d = 380 + i * 130;
    fx.swipe([t.x + c[0][0], t.y + c[0][1]], [t.x + c[1][0], t.y + c[1][1]], [t.x + c[2][0], t.y + c[2][1]], { w: 7 - i, color: '#ffb080', glow: '#ff2a1a', core: '#ffffff', delay: d, swing: 110, life: 380, after: 2 });
    for (let k = 0; k < 4; k++) fx.puff(t.x + c[1][0] + (k - 1.5) * 12, t.y + c[1][1], { color: k % 2 ? '#ff7a2a' : '#ff3a1a', r0: 4, r1: 13, vy: -30, delay: d + 60, life: 460, add: true });
  });
  fx.flashAt(110, '#ffd0b0', 640);
  fx.shock(t.x, t.y, { r0: 6, r1: 56, color: '#ff5a2a', w: 3.5, delay: 660, life: 420 });
  fx.sparks(t.x, t.y, { colors: KAKU, n: 30, speed: 160, delay: 670, life: 480, g: -40 });
  fx.hitStop(160, 660, 1.6);
  return true;
}
const BASHO = [['#ffffff', '#ffd040', '#ff5a1a'], ['#ffffff', '#fff6b0', '#c890ff'], ['#ffffff', '#e8fff0', '#4ad890']];
function basho(fx, targets, W, H) {
  const c = centerOf(targets, W, H);
  fx.tintAt('rgba(10,20,30,0.35)', 1100);
  // 大きな うちわの ひとあおぎ（左から 右へ ひろがる 3色の すじ）
  for (let k = 0; k < 14; k++) {
    const col = BASHO[k % 3];
    const y = c.y - 40 + k * 6 + rnd(-3, 3);
    const d = 120 + k * 30;
    fx.swipe([-10, y + 20], [c.x - 30, y], [W + 10, y - 16], { w: 3, color: col[1], glow: col[2], core: col[0], delay: d, swing: 260, life: 420, after: 1 });
  }
  // 敵みんなの まわりで うず
  targets.forEach((t, i) => {
    const d = 560 + i * 70;
    const col = BASHO[i % 3];
    fx.shock(t.x, t.y, { r0: 4, r1: 40, color: col[2], w: 2.5, delay: d, life: 420 });
    fx.sparks(t.x, t.y, { colors: col, n: 18, speed: 130, spread: Math.PI * 2, delay: d + 30, life: 460 });
  });
  fx.flashAt(90, '#ffffff', 560);
  fx.hitStop(110, 600, 1.2);
  return true;
}
Object.assign(G8_FX, { r88_kakuto: kakuto, r88_basho: basho });
for (const k of ['r88_kakuto', 'r88_basho']) R88_ANIMS.add(k);
Object.assign(R88_HIT, { r88_kakuto: 680, r88_basho: 600 });
Object.assign(R88_SFX, { r88_kakuto: 'fire', r88_basho: 'wind' });

// ───── G9班: ドラゴンボール・ワンピース（G8_FX に まぜる。playR88Fx の はじめの 行で よばれる）─────
//  r88_zeus  ゼウスの 天候棒・雷げき（ナミ）／カイドウ・ビッグ・マムの 大技 … 空が まっくらに なり、
//            まるい 雷雲（白い 目の ついた ゼウス）が ふくらんで、敵 みんなに 太い 金色の いなずまが 何本も 落ちる
//  r88_whis  天使の つえ・時もどし（ウイス）… つえの 玉が 光り、時計の 輪が さかさに 回って、白い 光の つぶが 体へ もどって いく
const ZEUS = ['#ffffff', '#fff6b0', '#ffd23a', '#7ac8ff'];
const WHIS = ['#ffffff', '#e8f0ff', '#b8d0ff', '#8ab0ff'];

function zeus(fx, targets, W, H) {
  const c = centerOf(targets, W, H);
  fx.tintAt('rgba(10,10,40,0.6)', 1500);
  // 雷雲ゼウスが ふくらむ（上の まん中）
  const zx = c.x, zy = Math.max(18, c.y - 54);
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2;
    fx.puff(zx + Math.cos(a) * 16, zy + Math.sin(a) * 7, { color: k % 2 ? '#9a9ab8' : '#7a7a9a', r0: 8, r1: 16, vy: 0, delay: k * 30, life: 1100 });
  }
  fx.glow(zx, zy, { color: '#b0b0d8', r: 26, delay: 120, life: 1000, alpha: 0.7 });
  // 白い 目（ゼウスの 顔）
  fx.glow(zx - 6, zy - 1, { color: '#ffffff', r: 3, delay: 300, life: 800 });
  fx.glow(zx + 6, zy - 1, { color: '#ffffff', r: 3, delay: 300, life: 800 });
  fx.sparks(zx, zy, { colors: ZEUS, n: 14, speed: 60, delay: 320, life: 400 });
  // 敵 みんなに 太い いなずま
  const list = targets.length ? targets : [c];
  list.forEach((t, i) => {
    const d = 620 + i * 70;
    fx.zap(zx + (i - list.length / 2) * 6, zy + 6, t.x, t.y - 4, { color: '#ffffff', glow: '#ffd23a', w: 3.2, delay: d, life: 380, forks: 3 });
    fx.zap(zx + (i - list.length / 2) * 8, zy + 4, t.x + rnd(-8, 8), t.y - 2, { color: '#e0f0ff', glow: '#7ac8ff', w: 2, delay: d + 50, life: 320, forks: 2 });
    fx.sparks(t.x, t.y, { colors: ZEUS, n: 20, speed: 150, delay: d + 80, life: 420 });
    fx.shock(t.x, t.y, { r0: 6, r1: 44, color: '#ffe680', w: 3, delay: d + 60, life: 380 });
  });
  fx.flashAt(120, '#fffbe0', 640);
  fx.hitStop(150, 680, 1.5);
  return true;
}

function whis(fx, targets, W, H) {
  const t = targets[0] || { x: W * 0.5, y: H * 0.5 };
  fx.tintAt('rgba(20,30,60,0.35)', 1300);
  // つえの 玉が 光る
  fx.glow(t.x, t.y - 26, { color: '#b8d0ff', r: 10, delay: 0, life: 1100, grow: 0.4 });
  // 時計の 輪が さかさに（外から 内へ ちぢむ 輪を 3つ）
  for (let k = 0; k < 3; k++) fx.shock(t.x, t.y, { r0: 60 - k * 6, r1: 8, color: k % 2 ? '#ffffff' : '#8ab0ff', w: 2.5, delay: 150 + k * 220, life: 520 });
  // 時計の はり（12本の 光の 点が 左回りに）
  for (let k = 0; k < 12; k++) {
    const a = -Math.PI / 2 - (k / 12) * Math.PI * 2;
    fx.twinkle(t.x + Math.cos(a) * 34, t.y + Math.sin(a) * 34, { color: '#ffffff', size: 4, delay: 120 + k * 55, life: 360, g: 0 });
  }
  // 光の つぶが 体へ もどる
  fx.converge(t.x, t.y, { colors: WHIS, n: 26, r: 56, delay: 500, life: 520 });
  fx.flashAt(90, '#f0f6ff', 1000);
  return true;
}

Object.assign(G8_FX, { r88_zeus: zeus, r88_whis: whis });
for (const k of ['r88_zeus', 'r88_whis']) R88_ANIMS.add(k);
Object.assign(R88_HIT, { r88_zeus: 700, r88_whis: 1000 });
Object.assign(R88_SFX, { r88_zeus: 'thunder', r88_whis: 'heal' });

// ───── G11班: るろうに剣心・名探ていコナン・まじっく快と（G8_FX に まぜる。playR88Fx の はじめの 行で よばれる）─────
//  r88_guren  無限じん・紅れんかいな（志々お）… 刀から 火花が ばちばち とびちり、燃える 手が 敵1体に つっこんで、
//             赤と 金の 大きな 火の 玉が はじける → 炎の 輪
//  r88_masui  うで時計型ますいじゅう（コナン）… 小さな 時計の 光が ぴかっと 光り、細い はりが 1本 すうっと とんで 敵に ささる →
//             「Z」の 形の 光が ふわふわ 上がって、ねむりの あわ
//  r88_kid    キッドの まぼろしの 大技（トランプの あらし・満月の イリュージョン）… 夜空が くらく なり、大きな 月が 光る。白い つばさの 三角が 画面を よこぎり、
//             白い トランプと ハトの はねが ひらひら まう
const GUREN = ['#ffffff', '#fff0a0', '#ffb030', '#ff4a1a'];
function guren(fx, targets, W, H) {
  const t = targets[0] || { x: W * 0.4, y: H * 0.45 };
  fx.tintAt('rgba(40,8,0,0.45)', 1100);
  // 刀から 火花（ギザギザの はが こすれる）
  const sx = t.x - 70, sy = t.y + 34;
  for (let k = 0; k < 4; k++) fx.sparks(sx + k * 6, sy - k * 3, { colors: GUREN, n: 10, speed: 120, ang: -Math.PI / 4, spread: 1.2, delay: k * 70, life: 320 });
  fx.glow(sx, sy, { color: '#ff7a2a', r: 14, delay: 60, life: 360 });
  // 燃える 手が つっこむ（炎の すじ）
  fx.spear(sx, sy, t.x, t.y, { len: 70, w: 5, color: '#ffb030', glow: '#ff3a1a', tip: '#ffffff', delay: 300, travel: 140, hold: 80, life: 320 });
  for (let k = 0; k < 6; k++) fx.puff(sx + ((t.x - sx) * k) / 6, sy + ((t.y - sy) * k) / 6, { color: k % 2 ? '#ff7a2a' : '#ffb030', r0: 3, r1: 10, vy: -20, delay: 320 + k * 25, life: 420, add: true });
  // 大きな 火の 玉が はじける
  fx.glow(t.x, t.y, { color: '#ff5a1a', r: 30, delay: 460, life: 520, grow: 0.8 });
  fx.flashAt(110, '#ffd8a0', 470);
  fx.shock(t.x, t.y, { r0: 6, r1: 60, color: '#ff8a2a', w: 4, delay: 480, life: 440 });
  fx.shock(t.x, t.y, { r0: 4, r1: 40, color: '#fff0a0', w: 2, delay: 540, life: 380 });
  fx.sparks(t.x, t.y, { colors: GUREN, n: 34, speed: 170, spread: Math.PI * 2, delay: 490, life: 520, g: -30 });
  fx.hitStop(150, 480, 1.5);
  return true;
}
const MASUI = ['#ffffff', '#e8f4ff', '#b8d8ff', '#8ab0ff'];
function masui(fx, targets, W, H) {
  const t = targets[0] || { x: W * 0.4, y: H * 0.45 };
  // うで時計の ふたが 開いて、照じゅんの 光
  const sx = W * 0.82, sy = H * 0.72;
  fx.glow(sx, sy, { color: '#ffe680', r: 6, delay: 0, life: 360 });
  fx.twinkle(sx, sy, { color: '#ffffff', size: 7, delay: 40, life: 260, spin: 4 });
  fx.shock(t.x, t.y, { r0: 22, r1: 6, color: '#ff6a6a', w: 1.5, delay: 60, life: 320 });
  // 細い はりが 1本 すうっと
  fx.spear(sx, sy, t.x, t.y - 4, { len: 14, w: 1.2, color: '#ffffff', glow: '#9ad8ff', tip: '#ffffff', delay: 300, travel: 160, hold: 40, life: 220 });
  fx.impact(t.x, t.y - 4, { r: 8, color: '#ffffff', delay: 470, life: 160 });
  // ねむりの Z と あわ
  for (let k = 0; k < 3; k++) {
    const x0 = t.x + 8 + k * 7, y0 = t.y - 14 - k * 9, d = 620 + k * 180, s = 3 + k;
    fx.cut(x0 - s, y0 - s, { ang: 0, len: s * 2, w: 1.4, color: '#ffffff', glow: '#8ab0ff', delay: d, life: 520, speed: 0 });
    fx.cut(x0, y0, { ang: 2.36, len: s * 2.8, w: 1.4, color: '#ffffff', glow: '#8ab0ff', delay: d + 40, life: 480, speed: 0 });
    fx.cut(x0 - s, y0 + s, { ang: 0, len: s * 2, w: 1.4, color: '#ffffff', glow: '#8ab0ff', delay: d + 80, life: 440, speed: 0 });
  }
  for (let k = 0; k < 6; k++) fx.bubble(t.x + rnd(-12, 12), t.y + rnd(-6, 6), { color: MASUI[k % 4], size: 1.8, vy: -24, delay: 560 + k * 90, life: 800 });
  fx.flashAt(60, '#e8f0ff', 480);
  return true;
}
const KID = ['#ffffff', '#f4f6ff', '#d8e0ff', '#a8b8f0'];
function kid(fx, targets, W, H) {
  fx.tintAt('rgba(8,10,40,0.55)', 1500);
  // 大きな 月
  const mx = W * 0.78, my = H * 0.22;
  fx.glow(mx, my, { color: '#fff6d0', r: 22, delay: 0, life: 1400, grow: 0.1 });
  fx.glow(mx, my, { color: '#ffffff', r: 12, delay: 60, life: 1300, grow: 0.1 });
  // 白い つばさ（三角）が 画面を よこぎる
  for (let k = 0; k < 3; k++) {
    const d = 260 + k * 40;
    const y = H * 0.36 + k * 3;
    fx.swipe([-30, y + 10], [W * 0.5, y - 14], [W + 30, y - 30], { w: 6 - k * 2, color: '#ffffff', glow: '#a8b8f0', core: '#ffffff', delay: d, swing: 560, life: 640, after: 2, pow: 1 });
  }
  // トランプと ハトの はねが まう
  for (let k = 0; k < 18; k++) {
    const x = rnd(10, W - 10), y = rnd(-10, H * 0.3);
    fx.twinkle(x, y, { color: KID[k % 4], size: k % 3 ? 4 : 6, delay: 380 + k * 40, life: 900, vx: rnd(-20, 20), vy: 40, g: 10, spin: rnd(-6, 6) });
  }
  for (let k = 0; k < 8; k++) fx.petal(rnd(20, W - 20), rnd(0, H * 0.4), { color: '#ffffff', vx: rnd(-20, 20), vy: 10, size: 1.6, delay: 500 + k * 70, life: 1000, g: 25 });
  fx.flashAt(80, '#f4f6ff', 300);
  return true;
}
Object.assign(G8_FX, { r88_guren: guren, r88_masui: masui, r88_kid: kid });
for (const k of ['r88_guren', 'r88_masui', 'r88_kid']) R88_ANIMS.add(k);
Object.assign(R88_HIT, { r88_guren: 540, r88_masui: 480, r88_kid: 600 });
Object.assign(R88_SFX, { r88_guren: 'fire', r88_masui: 'sleep', r88_kid: 'wind' });

// ───── G12班: ドラえもん・セーラームーン（G8_FX に まぜる。playR88Fx の はじめの 行で よばれる）─────
//  r88_dokan     空気ほう「ドカン！」… 手前に 空気が うずを まいて あつまり、すきとおった 大きな 空気の 玉が とんで、
//                敵1体に ぶつかって はじける（白い 輪が 3つ ＋ 風の つぶ）
//  r88_moshimo   もしもボックス … 画面が ゆらりと ゆがみ、まん中から 七色の 大きな 輪が 何回も ひろがって、世界が かわる（星の つぶ）
//  r88_moonheal  ムーン・ヒーリング（うさぎの スティック）… 上に 金色の 三日月が うかび、ピンクと 金の 光の つぶが
//                仲間 みんなに ふりそそいで、体が やさしく 光る
const AIR = ['#ffffff', '#eaf6ff', '#bfe4ff', '#8ac8ff'];
const RAINBOW = ['#ff7a7a', '#ffb84a', '#ffe85a', '#7ae08a', '#6ab8ff', '#b88aff'];
const MOON = ['#ffffff', '#fff2b0', '#ffd8ec', '#ff9ac8'];

function dokan(fx, targets, W, H) {
  const t = targets[0] || { x: W * 0.35, y: H * 0.45 };
  const sx = Math.min(W - 20, t.x + 120), sy = t.y + 20;
  // 空気が あつまる
  fx.converge(sx, sy, { colors: AIR, n: 18, r: 30, delay: 0, life: 280 });
  fx.glow(sx, sy, { color: '#d8f0ff', r: 12, delay: 200, life: 260 });
  // 空気の 玉が とぶ（すきとおった まるを ならべて うごかす）
  for (let k = 0; k < 6; k++) {
    const p = k / 5;
    fx.puff(sx + (t.x - sx) * p, sy + (t.y - sy) * p, { color: k % 2 ? '#eaf6ff' : '#bfe4ff', r0: 6 + k, r1: 14 + k * 2, delay: 300 + k * 35, life: 220, alpha: 0.55, add: true });
  }
  // ぶつかって はじける
  for (let k = 0; k < 3; k++) fx.shock(t.x, t.y, { r0: 4, r1: 34 + k * 14, color: k % 2 ? '#bfe4ff' : '#ffffff', w: 3 - k * 0.6, delay: 520 + k * 70, life: 380 });
  fx.sparks(t.x, t.y, { colors: AIR, n: 26, speed: 170, delay: 530, life: 420 });
  for (let k = 0; k < 5; k++) fx.gust(t.x - 30, t.y - 20 + k * 10, { len: 60, amp: 4, color: '#ffffff', w: 1.2, dir: -1, delay: 540 + k * 30, life: 320 });
  fx.flashAt(90, '#f0f8ff', 520);
  fx.hitStop(140, 540, 1.5);
  return true;
}

function moshimo(fx, targets, W, H) {
  const cx = W / 2, cy = H * 0.45;
  fx.tintAt('rgba(40,20,60,0.35)', 1300);
  // 七色の 輪が 何回も ひろがる
  RAINBOW.forEach((col, i) => fx.shock(cx, cy, { r0: 4, r1: Math.max(W, H) * 0.7, color: col, w: 3, delay: 120 + i * 90, life: 760 }));
  // 星の つぶ
  for (let k = 0; k < 18; k++) {
    fx.twinkle(rnd(10, W - 10), rnd(10, H * 0.8), { color: RAINBOW[k % RAINBOW.length], size: rnd(3, 6), delay: 200 + k * 40, life: 520, g: 0 });
  }
  fx.glow(cx, cy, { color: '#ffffff', r: 26, delay: 100, life: 600, alpha: 0.6 });
  fx.flashAt(120, '#fff8ff', 760);
  return true;
}

function moonheal(fx, targets, W, H) {
  const list = targets.length ? targets : [{ x: W * 0.5, y: H * 0.6 }];
  const c = centerOf(list, W, H);
  const mx = c.x, my = Math.max(16, c.y - 60);
  fx.tintAt('rgba(30,10,40,0.3)', 1200);
  // 三日月（金色の 光の 点を 弓の 形に）
  for (let k = 0; k < 11; k++) {
    const a = -Math.PI * 0.75 + (k / 10) * Math.PI * 1.5;
    fx.glow(mx + Math.cos(a) * 14, my + Math.sin(a) * 14, { color: '#ffe680', r: 3, delay: k * 25, life: 1000 });
  }
  fx.glow(mx, my, { color: '#fff6c0', r: 20, delay: 120, life: 900, alpha: 0.5 });
  // 光の つぶが ふりそそぐ
  list.forEach((t, i) => {
    for (let k = 0; k < 7; k++) fx.twinkle(t.x + rnd(-14, 14), t.y - 50 + rnd(-10, 10), { color: MOON[k % MOON.length], size: rnd(3, 5), vy: 50, delay: 300 + i * 60 + k * 40, life: 560 });
    fx.glow(t.x, t.y, { color: '#ffc0e0', r: 18, delay: 620 + i * 60, life: 520, alpha: 0.7 });
    fx.sparks(t.x, t.y, { colors: MOON, n: 12, speed: 70, delay: 660 + i * 60, life: 460, g: -30 });
  });
  fx.flashAt(70, '#fff0f8', 640);
  return true;
}

Object.assign(G8_FX, { r88_dokan: dokan, r88_moshimo: moshimo, r88_moonheal: moonheal });
for (const k of ['r88_dokan', 'r88_moshimo', 'r88_moonheal']) R88_ANIMS.add(k);
Object.assign(R88_HIT, { r88_dokan: 560, r88_moshimo: 800, r88_moonheal: 700 });
Object.assign(R88_SFX, { r88_dokan: 'blast', r88_moshimo: 'sparkle', r88_moonheal: 'heal' });
// 味方に かける えんしゅつ（client/battle.js・テストが 見る PARTY_ANIMS に まぜる。M1班と 同じ）
export const R88_PARTY_ANIMS = new Set(['r88_moshimo', 'r88_moonheal']);
for (const a of R88_PARTY_ANIMS) PARTY_ANIMS.add(a);

// ───── G14班: 鋼のれん金術師・アナと雪の女王（G8_FX に まぜる。playR88Fx の はじめの 行で よばれる）─────
//  r88_snap   発火布の 指パッチン … 「パチン」と 白い 火花が 1つ はじけ、火花の すじが 敵の 列へ 走って、
//             敵みんなの まわりで 大きな 炎が ふき上がる（オレンジの 光 ＋ 火の 粉 ＋ 輪）
//  r88_elsa   第5のせいれいの 雪の 結しょう … 画面が 青く しずまり、まん中に 6本の うでの 大きな 雪の 結しょうが ひらき、
//             まわりに 4つの せいれいの 色の 光（風 白・火 むらさき・水 青・大地 茶）→ 敵みんなが 氷の 光に つつまれ、雪が まう
const SNAP = ['#ffffff', '#fff0a0', '#ffb030', '#ff5a1a'];
const SNOWC = ['#ffffff', '#e8f8ff', '#bfe6ff', '#7ac8ff'];
const SPIRITS4 = ['#ffffff', '#c890ff', '#5aa8ff', '#c8a060'];

function snap(fx, targets, W, H) {
  const c = centerOf(targets, W, H);
  const sx = Math.min(W - 16, c.x + 120), sy = Math.max(20, c.y - 30);
  // 指を ならす 火花
  fx.glow(sx, sy, { color: '#ffffff', r: 8, delay: 0, life: 200 });
  fx.sparks(sx, sy, { colors: ['#ffffff', '#fff6b0'], n: 10, speed: 90, delay: 0, life: 240 });
  fx.flashAt(50, '#fffbe0', 60);
  // 火花の すじが 敵へ 走る
  const spots = targets.length ? targets : [c];
  spots.forEach((t, i) => {
    fx.spear(sx, sy, t.x, t.y, { len: 30, w: 1.6, color: '#fff0a0', glow: '#ff9a3a', tip: '#ffffff', delay: 160 + i * 40, travel: 140, hold: 20, life: 220 });
  });
  // 大きな 炎が ふき上がる
  spots.forEach((t, i) => {
    const d = 340 + i * 60;
    fx.glow(t.x, t.y, { color: '#ff9a3a', r: 30, delay: d, life: 520 });
    for (let k = 0; k < 7; k++) fx.puff(t.x + (k - 3) * 6, t.y + 8, { color: k % 2 ? '#ffb030' : '#ff5a1a', r0: 6, r1: 20, vy: -50 - k * 5, delay: d + k * 30, life: 560, add: true });
    fx.shock(t.x, t.y, { r0: 6, r1: 44, color: '#ffd040', w: 3, delay: d, life: 420 });
    fx.sparks(t.x, t.y + 6, { colors: SNAP, n: 22, speed: 130, ang: -Math.PI / 2, spread: 1.4, delay: d + 30, life: 520, g: -60 });
  });
  fx.tintAt('rgba(60,20,0,0.3)', 900);
  fx.flashAt(110, '#fff0c0', 360);
  fx.hitStop(130, 380, 1.4);
  return true;
}

function elsa(fx, targets, W, H) {
  const cx = W / 2, cy = H * 0.42;
  fx.tintAt('rgba(10,30,70,0.45)', 1500);
  // 4つの せいれいの 光が まわりから あつまる
  SPIRITS4.forEach((col, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 2 + Math.PI / 4;
    fx.glow(cx + Math.cos(a) * 60, cy + Math.sin(a) * 36, { color: col, r: 10, delay: i * 80, life: 600 });
    fx.converge(cx, cy, { colors: [col, '#ffffff'], n: 8, r: 50, delay: 100 + i * 80, life: 360 });
  });
  // 6本の うでの 雪の 結しょう
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3;
    const x = cx + Math.cos(a) * 44, y = cy + Math.sin(a) * 44;
    fx.spear(cx, cy, x, y, { len: 44, w: 3, color: '#ffffff', glow: '#7ac8ff', tip: '#e8f8ff', delay: 480, travel: 160, hold: 300, life: 700, over: 0 });
    // うでの とちゅうの 小さな えだ
    const mx = cx + Math.cos(a) * 26, my = cy + Math.sin(a) * 26;
    for (const da of [-0.6, 0.6]) fx.spear(mx, my, mx + Math.cos(a + da) * 12, my + Math.sin(a + da) * 12, { len: 12, w: 2, color: '#e8f8ff', glow: '#7ac8ff', tip: '#ffffff', delay: 600, travel: 100, hold: 260, life: 560, over: 0 });
  }
  fx.glow(cx, cy, { color: '#ffffff', r: 14, delay: 480, life: 800 });
  fx.shock(cx, cy, { r0: 6, r1: Math.max(W, H) * 0.6, color: '#bfe6ff', w: 3, delay: 760, life: 700 });
  // 敵みんなが 氷の 光に つつまれる
  const spots = targets.length ? targets : [{ x: W * 0.3, y: H * 0.45 }];
  spots.forEach((t, i) => {
    const d = 880 + i * 60;
    fx.glow(t.x, t.y, { color: '#a8e0ff', r: 26, delay: d, life: 520 });
    fx.shock(t.x, t.y, { r0: 4, r1: 34, color: '#ffffff', w: 2.5, delay: d, life: 380 });
    fx.sparks(t.x, t.y, { colors: SNOWC, n: 18, speed: 110, delay: d + 20, life: 480 });
  });
  // 雪が まう
  for (let k = 0; k < 22; k++) fx.twinkle(rnd(8, W - 8), rnd(-10, H * 0.5), { color: SNOWC[k % 4], size: rnd(2, 5), vy: 30, vx: rnd(-10, 10), delay: 300 + k * 45, life: 1000, g: 8 });
  fx.flashAt(120, '#eaf8ff', 880);
  fx.hitStop(120, 900, 1.2);
  return true;
}

Object.assign(G8_FX, { r88_snap: snap, r88_elsa: elsa });
for (const k of ['r88_snap', 'r88_elsa']) R88_ANIMS.add(k);
Object.assign(R88_HIT, { r88_snap: 520, r88_elsa: 940 });
Object.assign(R88_SFX, { r88_snap: 'fire', r88_elsa: 'ice' });

// ───── G15班: ダイの大冒険・ドラゴンクエスト（G8_FX に まぜる。playR88Fx の はじめの 行で よばれる）─────
//  r88_saya    ダイの剣・さやに おさめる … 剣の 光が さやへ すいこまれ、青白い いなずまが 体の まわりを はしって、金色の 光が たまる
//  r88_namida  神のなみだ … 上に 金色の 小さな 光の 玉（スライムの 形）が うかび、金の しずくが 仲間 みんなに ふりそそいで 体が 光る
//  r88_mirror  シャハルの鏡・天空のたて … 体の 前に 六角の 光の かべが ひらき、まわりを 光の すじが かけめぐる
//              （シグマの まぼろしの 大技にも。敵 みんなに 光が はね返る）
const GOLDN = ['#ffffff', '#fff6c0', '#ffe680', '#ffd23a'];
const MIRR = ['#ffffff', '#eaf6ff', '#bfe4ff', '#d8c8ff'];

function saya(fx, targets, W, H) {
  const t = targets[0] || { x: W * 0.5, y: H * 0.6 };
  fx.tintAt('rgba(10,20,40,0.3)', 1000);
  // 剣の 光が すいこまれる
  fx.converge(t.x, t.y - 4, { colors: BLUE, n: 20, r: 40, delay: 0, life: 360 });
  // 青白い いなずまが 体の まわりを はしる
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2 + 0.4;
    fx.zap(t.x + Math.cos(a) * 26, t.y + Math.sin(a) * 18 - 10, t.x, t.y - 4, { color: '#ffffff', glow: '#7ac8ff', w: 1.4, delay: 260 + k * 70, life: 220, forks: 1 });
  }
  // 金色の 光が たまる
  fx.glow(t.x, t.y - 4, { color: '#ffe680', r: 18, delay: 520, life: 600 });
  fx.pillar(t.x, t.y + 8, '#8ac8ff', { w: 8, h: 50, delay: 560, life: 460, edge: '#ffffff' });
  fx.sparks(t.x, t.y, { colors: GOLDN, n: 16, speed: 80, delay: 600, life: 420, g: -40 });
  fx.flashAt(70, '#e8f4ff', 560);
  return true;
}

function namida(fx, targets, W, H) {
  const list = targets.length ? targets : [{ x: W * 0.5, y: H * 0.6 }];
  const c = centerOf(list, W, H);
  const mx = c.x, my = Math.max(18, c.y - 64);
  fx.tintAt('rgba(40,30,0,0.25)', 1300);
  // 金色の 小さな 光の 玉（しずくの 形）
  fx.glow(mx, my, { color: '#ffd23a', r: 10, delay: 0, life: 1100 });
  fx.glow(mx, my - 6, { color: '#fff6c0', r: 5, delay: 0, life: 1100 });
  fx.shock(mx, my, { r0: 4, r1: 40, color: '#ffe680', w: 2, delay: 200, life: 600 });
  // 金の しずくが ふりそそぐ
  list.forEach((t, i) => {
    for (let k = 0; k < 8; k++) fx.twinkle(t.x + rnd(-12, 12), t.y - 50 + rnd(-8, 8), { color: GOLDN[k % GOLDN.length], size: rnd(3, 5), vy: 60, delay: 360 + i * 70 + k * 40, life: 520 });
    fx.glow(t.x, t.y, { color: '#fff2a0', r: 20, delay: 700 + i * 70, life: 560, alpha: 0.75 });
    fx.sparks(t.x, t.y, { colors: GOLDN, n: 12, speed: 70, delay: 740 + i * 70, life: 460, g: -30 });
  });
  fx.flashAt(90, '#fffbe0', 700);
  return true;
}

function mirror(fx, targets, W, H) {
  const list = targets.length ? targets : [{ x: W * 0.5, y: H * 0.6 }];
  list.forEach((t, i) => {
    const d = i * 60;
    // 六角の 光の かべ
    for (let k = 0; k < 6; k++) {
      const a0 = (k * Math.PI) / 3, a1 = ((k + 1) * Math.PI) / 3;
      fx.spear(t.x + Math.cos(a0) * 22, t.y - 6 + Math.sin(a0) * 22, t.x + Math.cos(a1) * 22, t.y - 6 + Math.sin(a1) * 22, { len: 22, w: 2, color: '#ffffff', glow: '#bfe4ff', tip: '#ffffff', delay: d + 100 + k * 40, travel: 80, hold: 260, life: 420, over: 0 });
    }
    fx.glow(t.x, t.y - 6, { color: '#d8f0ff', r: 20, delay: d + 300, life: 560, alpha: 0.6 });
    fx.shock(t.x, t.y - 6, { r0: 6, r1: 40, color: '#ffffff', w: 2, delay: d + 340, life: 420 });
    fx.sparks(t.x, t.y - 6, { colors: MIRR, n: 14, speed: 110, delay: d + 360, life: 420 });
  });
  fx.flashAt(80, '#f4f8ff', 340);
  return true;
}

Object.assign(G8_FX, { r88_saya: saya, r88_namida: namida, r88_mirror: mirror });
for (const k of ['r88_saya', 'r88_namida', 'r88_mirror']) R88_ANIMS.add(k);
Object.assign(R88_HIT, { r88_saya: 640, r88_namida: 800, r88_mirror: 460 });
Object.assign(R88_SFX, { r88_saya: 'thunder', r88_namida: 'heal', r88_mirror: 'sparkle' });
// 味方に かける えんしゅつ（G12班と 同じ。client/battle.js が 画面の 下に 出す）
for (const a of ['r88_saya', 'r88_namida', 'r88_mirror']) PARTY_ANIMS.add(a);
// ───── G13班: ハリー・ポッター・マリオ（G8_FX に まぜる。playR88Fx の はじめの 行で よばれる）─────
//  r88_superstar  スーパースター … 上から 金の 星が 回りながら おりて きて、体に とびこむ。
//                 七色の 光の 輪が ひろがり、星の つぶが ぴかぴか ちらばる（味方に かける。画面の 下に 出す）
//  r88_timeturner 逆転時計 … 金の 砂時計の 光が うかび、時計の 輪が 外から 内へ さかさに ちぢんで、
//                 光の つぶが 体へ もどる（味方に かける）
const STAR7 = ['#ff5a5a', '#ffb84a', '#ffe85a', '#7ae08a', '#6ab8ff', '#b88aff', '#ffffff'];
const SAND = ['#ffffff', '#fff6c8', '#ffe08a', '#e8b84a'];

function superstar(fx, targets, W, H) {
  const t = targets[0] || { x: W * 0.5, y: H * 0.6 };
  // 星が 回りながら おりて くる（光の 点を 5つの とがりに ならべて、少しずつ 下へ）
  for (let s = 0; s < 6; s++) {
    const y = t.y - 70 + s * 12;
    for (let k = 0; k < 5; k++) {
      const a = s * 0.5 + (k / 5) * Math.PI * 2 - Math.PI / 2;
      fx.glow(t.x + Math.cos(a) * 9, y + Math.sin(a) * 9, { color: '#ffe85a', r: 3, delay: s * 70, life: 160 });
    }
    fx.glow(t.x, y, { color: '#fff6b0', r: 7, delay: s * 70, life: 160 });
  }
  // 体に とびこむ → 七色の 輪
  fx.glow(t.x, t.y, { color: '#ffffff', r: 26, delay: 440, life: 520, alpha: 0.8 });
  STAR7.forEach((col, i) => fx.shock(t.x, t.y, { r0: 4, r1: 30 + i * 8, color: col, w: 2.5, delay: 460 + i * 45, life: 420 }));
  // 星の つぶ
  for (let k = 0; k < 16; k++) fx.twinkle(t.x + rnd(-30, 30), t.y + rnd(-34, 14), { color: STAR7[k % STAR7.length], size: rnd(3, 5), delay: 520 + k * 30, life: 520, g: 0 });
  fx.sparks(t.x, t.y, { colors: STAR7, n: 24, speed: 120, delay: 480, life: 520, g: -20 });
  fx.flashAt(460, '#fffbe0', 520);
  return true;
}

function timeturner(fx, targets, W, H) {
  const t = targets[0] || { x: W * 0.5, y: H * 0.6 };
  const cy = t.y - 10;
  fx.tintAt('rgba(40,30,10,0.3)', 1100);
  // 砂時計（上と 下の 三角を 光の 点で）
  for (let k = 0; k < 6; k++) {
    const d = k * 3;
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) fx.glow(t.x + sx * (12 - d * 0.66), cy + sy * (18 - d), { color: '#ffe08a', r: 2.5, delay: k * 20, life: 900 });
  }
  // 時計の 輪が さかさに ちぢむ（大きい 輪から 小さい 輪へ）
  for (let k = 0; k < 4; k++) fx.shock(t.x, cy, { r0: 70 - k * 12, r1: 6, color: k % 2 ? '#ffe08a' : '#ffffff', w: 2, delay: 240 + k * 110, life: 420 });
  // 光の つぶが 体へ もどる
  fx.converge(t.x, cy, { colors: SAND, n: 26, r: 60, delay: 300, life: 520 });
  fx.glow(t.x, cy, { color: '#fff6c8', r: 22, delay: 760, life: 420, alpha: 0.7 });
  fx.flashAt(760, '#fff8e0', 420);
  return true;
}

Object.assign(G8_FX, { r88_superstar: superstar, r88_timeturner: timeturner });
for (const k of ['r88_superstar', 'r88_timeturner']) { R88_ANIMS.add(k); R88_PARTY_ANIMS.add(k); PARTY_ANIMS.add(k); }
Object.assign(R88_HIT, { r88_superstar: 700, r88_timeturner: 800 });
Object.assign(R88_SFX, { r88_superstar: 'sparkle', r88_timeturner: 'heal' });

// ───── G16班: ポケモン（G8_FX に まぜる。playR88Fx の はじめの 行で よばれる）─────
//   r88_zpower … Zリング。うでわの 石が 光り、5色の 光の すじが 体に あつまって、金色の Z の 字が かがやく
//   r88_mega   … メガリング。にじ色の 光の まゆに つつまれ、たまごの からが われる ように 光が はじける
const ZCOL = ['#ffffff', '#fff6b0', '#ffd23a', '#ff9a3a'];
const MEGA = ['#ff7a7a', '#ffb84a', '#ffe85a', '#7ae08a', '#6ab8ff', '#b88aff'];
function zpower(fx, targets, W, H) {
  const t = targets[0] || { x: W * 0.5, y: H * 0.6 };
  fx.tintAt('rgba(30,20,0,0.3)', 1100);
  fx.glow(t.x + 8, t.y - 2, { color: '#ffffff', r: 6, delay: 0, life: 500 });
  // 5色の 光の すじが まわりから あつまる
  MEGA.slice(0, 5).forEach((col, k) => {
    const a = (k * 2 * Math.PI) / 5 - Math.PI / 2;
    fx.zap(t.x + Math.cos(a) * 44, t.y - 6 + Math.sin(a) * 32, t.x, t.y - 6, { color: '#ffffff', glow: col, w: 1.6, delay: 120 + k * 60, life: 260, forks: 0 });
  });
  fx.converge(t.x, t.y - 6, { colors: ZCOL, n: 24, r: 46, delay: 160, life: 380 });
  // 金色の Z（3本の 線）
  const z = [[-10, -22, 10, -22], [10, -22, -10, 4], [-10, 4, 10, 4]];
  z.forEach(([x0, y0, x1, y1], k) => fx.spear(t.x + x0, t.y + y0 - 8, t.x + x1, t.y + y1 - 8, { len: 22, w: 3, color: '#fff6b0', glow: '#ffd23a', tip: '#ffffff', delay: 560 + k * 90, travel: 90, hold: 320, life: 460, over: 0 }));
  fx.shock(t.x, t.y - 12, { r0: 6, r1: 52, color: '#ffd23a', w: 3, delay: 860, life: 420 });
  fx.sparks(t.x, t.y - 12, { colors: ZCOL, n: 22, speed: 120, delay: 880, life: 460 });
  fx.flashAt(100, '#fff6c0', 860);
  return true;
}
function mega(fx, targets, W, H) {
  const t = targets[0] || { x: W * 0.5, y: H * 0.6 };
  fx.tintAt('rgba(20,10,40,0.35)', 1300);
  // にじ色の 光の まゆ
  MEGA.forEach((col, k) => fx.glow(t.x, t.y - 8, { color: col, r: 30 - k * 3, delay: 80 + k * 70, life: 700, alpha: 0.5 }));
  fx.converge(t.x, t.y - 8, { colors: MEGA, n: 30, r: 52, delay: 100, life: 520 });
  // からが われる ように、光の すじが 外へ
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4 + 0.2;
    fx.spear(t.x, t.y - 8, t.x + Math.cos(a) * 46, t.y - 8 + Math.sin(a) * 38, { len: 18, w: 2, color: '#ffffff', glow: MEGA[k % MEGA.length], tip: '#ffffff', delay: 720 + k * 20, travel: 160, hold: 120, life: 340, over: 0 });
  }
  fx.shock(t.x, t.y - 8, { r0: 8, r1: 60, color: '#ffffff', w: 3, delay: 740, life: 460 });
  fx.pillar(t.x, t.y + 8, '#d8c8ff', { w: 10, h: 60, delay: 760, life: 520, edge: '#ffffff' });
  fx.sparks(t.x, t.y - 8, { colors: MEGA, n: 26, speed: 130, delay: 760, life: 520 });
  fx.flashAt(110, '#f4eeff', 740);
  return true;
}
Object.assign(G8_FX, { r88_zpower: zpower, r88_mega: mega });
for (const k of ['r88_zpower', 'r88_mega']) R88_ANIMS.add(k);
Object.assign(R88_HIT, { r88_zpower: 860, r88_mega: 760 });
Object.assign(R88_SFX, { r88_zpower: 'crit', r88_mega: 'sparkle' });
// 味方に かける えんしゅつ（G12班と 同じ。client/battle.js が 画面の 下に 出す）
for (const a of ['r88_zpower', 'r88_mega']) PARTY_ANIMS.add(a);

// ───── G19班: SPY×FAMILY・オリジナル（G8_FX に まぜる。playR88Fx の はじめの 行で よばれる）─────
//   r88_ibara … スティレット（〈いばら姫〉の 大技にも）。画面が しずかに くらく なり、金色の 細い 光の すじが 何本も 走って、
//              切った 所から 金と 赤の 花びらが まう
//   r88_kouan … 光と闇の剣神のかげの 大技。白い 光の すじと 黒むらさきの すじが 十字に かさなり、まん中で 光と 闇が はじける
const IBARA = ['#ffffff', '#fff2a0', '#e8b020', '#c83a4a'];
function ibara(fx, targets, W, H) {
  const c = centerOf(targets, W, H);
  fx.tintAt('rgba(20,6,14,0.5)', 1200);
  // 金色の 細い すじが 何本も 走る（2本ずつ さか手の 形）
  for (let k = 0; k < 6; k++) {
    const y = c.y - 34 + k * 13 + rnd(-4, 4);
    const d = 160 + k * 70;
    fx.swipe([c.x - 70, y + (k % 2 ? 18 : -18)], [c.x, y], [c.x + 70, y + (k % 2 ? -18 : 18)], { w: 2.2, color: '#fff2a0', glow: '#e8b020', core: '#ffffff', delay: d, swing: 90, life: 300, after: 1 });
  }
  targets.forEach((t, i) => {
    const d = 360 + i * 60;
    fx.cut(t.x, t.y - 4, { ang: 0.8, len: 34, w: 1.8, color: '#ffffff', glow: '#e8b020', delay: d, life: 240 });
    fx.cut(t.x, t.y - 2, { ang: -0.8, len: 34, w: 1.8, color: '#ffffff', glow: '#e8b020', delay: d + 60, life: 240 });
    fx.sparks(t.x, t.y, { colors: IBARA, n: 14, speed: 120, delay: d + 80, life: 380 });
  });
  // 金と 赤の 花びらが まう
  for (let k = 0; k < 14; k++) fx.petal(c.x + rnd(-80, 80), c.y + rnd(-50, 10), { color: k % 3 ? '#e8b020' : '#c83a4a', vx: rnd(-30, 30), vy: rnd(-10, 10), size: 1.8, delay: 520 + k * 40, life: 900, g: 30 });
  fx.flashAt(90, '#fff2c8', 520);
  fx.hitStop(110, 560, 1.2);
  return true;
}
const KOU = ['#ffffff', '#fffbe0', '#ffe680'];
const AN = ['#ffffff', '#d8c8ff', '#8a6ad0', '#3a2a6a'];
function kouan(fx, targets, W, H) {
  const c = centerOf(targets, W, H);
  fx.tintAt('rgba(16,8,30,0.5)', 1300);
  // 光（左上 → 右下）と 闇（右上 → 左下）の 大きな すじ
  fx.swipe([c.x - 80, c.y - 60], [c.x, c.y - 4], [c.x + 80, c.y + 56], { w: 8, color: '#fffbe0', glow: '#ffe680', core: '#ffffff', delay: 200, swing: 140, life: 460, after: 2 });
  fx.swipe([c.x + 80, c.y - 60], [c.x, c.y - 4], [c.x - 80, c.y + 56], { w: 8, color: '#b8a0f0', glow: '#3a2a6a', core: '#ffffff', delay: 340, swing: 140, life: 460, after: 2 });
  // まん中で 光と 闇が はじける
  fx.glow(c.x, c.y - 4, { color: '#ffffff', r: 26, delay: 480, life: 420, alpha: 0.8 });
  fx.shock(c.x, c.y - 4, { r0: 6, r1: 70, color: '#ffe680', w: 3.5, delay: 500, life: 460 });
  fx.shock(c.x, c.y - 4, { r0: 6, r1: 56, color: '#8a6ad0', w: 3, delay: 560, life: 460 });
  targets.forEach((t, i) => {
    const d = 540 + i * 50;
    fx.sparks(t.x, t.y, { colors: i % 2 ? AN : KOU, n: 18, speed: 150, delay: d, life: 440 });
  });
  fx.flashAt(120, '#ffffff', 500);
  fx.hitStop(150, 540, 1.4);
  return true;
}
Object.assign(G8_FX, { r88_ibara: ibara, r88_kouan: kouan });
for (const k of ['r88_ibara', 'r88_kouan']) R88_ANIMS.add(k);
Object.assign(R88_HIT, { r88_ibara: 560, r88_kouan: 600 });
Object.assign(R88_SFX, { r88_ibara: 'crit', r88_kouan: 'crit' });

// ───── G18班: おしり探てい（G8_FX に まぜる。playR88Fx の はじめの 行で よばれる）─────
//   r88_oshiri … 名探ていのスーツとちょうネクタイ「しつれい、こかせていただきます」。
//                手前で「ぽん・ぽん・ぽん」と 小さな 黄色い 輪が 3つ はじけ、ふんわり した 黄緑の 雲が ころころ ころがって 敵の 方へ。
//                敵の 上で 雲が ふくらんで つつみ、きらきらの 星 → 「Z」と ねむりの あわが ふわふわ 上がる（ゆかいで、やさしい 形）
const PUU = ['#ffffff', '#fffbd0', '#f4f0a0', '#d8f0a0'];
function oshiri(fx, targets, W, H) {
  const c = targets.length ? center(targets, W, H) : { x: W * 0.3, y: H * 0.45 };
  const sx = W * 0.8, sy = H * 0.72;
  fx.tintAt('rgba(60,60,10,0.18)', 1500);
  // ぽん・ぽん・ぽん（小さな 輪が 3つ）
  for (let k = 0; k < 3; k++) {
    fx.shock(sx - k * 8, sy - k * 4, { r0: 2, r1: 12 + k * 4, color: '#f4e870', w: 2, delay: k * 140, life: 260 });
    fx.puff(sx - k * 8, sy - k * 4, { color: '#f8f0a0', r0: 2, r1: 7 + k * 2, vy: -8, delay: k * 140 + 20, life: 360, add: true });
  }
  // ふんわり 雲が ころころ ころがって いく
  for (let k = 0; k < 8; k++) {
    const t = k / 7;
    const x = sx + (c.x - sx) * t, y = sy + (c.y - sy) * t - Math.sin(t * Math.PI) * 16;
    fx.puff(x, y, { color: PUU[(k % 3) + 1], r0: 4, r1: 11 + k, vy: -6, delay: 440 + k * 55, life: 520, add: true });
  }
  // 敵の 上で 雲が ふくらんで つつむ
  for (const t of targets.length ? targets : [c]) {
    fx.glow(t.x, t.y - 4, { color: '#f4f0a0', r: 22, delay: 860, life: 700, grow: 0.5, alpha: 0.6 });
    for (let k = 0; k < 4; k++) fx.puff(t.x + rnd(-12, 12), t.y + rnd(-8, 6), { color: PUU[(k % 3) + 1], r0: 6, r1: 16, vy: -10, delay: 880 + k * 40, life: 620, add: true });
    // きらきらの 星
    for (let k = 0; k < 3; k++) fx.twinkle(t.x + rnd(-14, 14), t.y - 18 + rnd(-6, 6), { color: '#ffffff', size: 4, delay: 960 + k * 80, life: 420, spin: 3 });
    // ねむりの Z と あわ
    for (let k = 0; k < 2; k++) {
      const x0 = t.x + 8 + k * 7, y0 = t.y - 16 - k * 9, d = 1180 + k * 160, z = 3 + k;
      fx.cut(x0 - z, y0 - z, { ang: 0, len: z * 2, w: 1.4, color: '#ffffff', glow: '#8ab0ff', delay: d, life: 480, speed: 0 });
      fx.cut(x0, y0, { ang: 2.36, len: z * 2.8, w: 1.4, color: '#ffffff', glow: '#8ab0ff', delay: d + 40, life: 440, speed: 0 });
      fx.cut(x0 - z, y0 + z, { ang: 0, len: z * 2, w: 1.4, color: '#ffffff', glow: '#8ab0ff', delay: d + 80, life: 400, speed: 0 });
    }
    for (let k = 0; k < 3; k++) fx.bubble(t.x + rnd(-10, 10), t.y + rnd(-4, 4), { color: '#d8e8ff', size: 1.6, vy: -22, delay: 1100 + k * 110, life: 760 });
  }
  return true;
}
Object.assign(G8_FX, { r88_oshiri: oshiri });
R88_ANIMS.add('r88_oshiri');
Object.assign(R88_HIT, { r88_oshiri: 900 });
Object.assign(R88_SFX, { r88_oshiri: 'sleep' });

// ───── G17班: フリーレン・さいきくすお（G8_FX に まぜる。playR88Fx の はじめの 行で よばれる）─────
//  r88_tenbin  服従のてんびん … 敵の 上に 金の てんびんが あらわれ、2つの 皿に 光（魔力）が のって、ぐらりと かたむく。
//              かたむいた 方から 金の 光の 輪が 敵に おりて、動きを 止める
//  r88_seigyo  頭の制御装置 … 頭の 2本の かざりから ピンクの 火花が はじけ、むらさきの 念の 輪が 何回も ひろがる（味方に かける）
const SCALE = ['#ffffff', '#fff6c0', '#ffe680', '#c8961a'];
const PSY = ['#ffffff', '#ffd8f0', '#ff8ad0', '#a86ad8'];

function tenbin(fx, targets, W, H) {
  const t = targets[0] || { x: W * 0.3, y: H * 0.45 };
  const cx = t.x, cy = Math.max(20, t.y - 46);
  fx.tintAt('rgba(30,20,0,0.3)', 1200);
  // 柱と うで（はじめは まっすぐ → かたむく）
  fx.spear(cx, cy + 22, cx, cy - 4, { len: 26, w: 2.4, color: '#ffe680', glow: '#c8961a', tip: '#ffffff', delay: 0, travel: 160, hold: 900, life: 1100, over: 0 });
  fx.spear(cx - 22, cy - 4, cx + 22, cy - 4, { len: 44, w: 2, color: '#ffe680', glow: '#c8961a', tip: '#ffffff', delay: 120, travel: 160, hold: 240, life: 420, over: 0 });
  fx.spear(cx - 22, cy - 12, cx + 22, cy + 6, { len: 48, w: 2, color: '#fff6c0', glow: '#ffd23a', tip: '#ffffff', delay: 560, travel: 120, hold: 420, life: 560, over: 0 });
  // 2つの 皿に のる 光（左 ＝ 使った 人の 魔力・右 ＝ 敵の 魔力）
  fx.glow(cx - 22, cy + 4, { color: '#bfe4ff', r: 9, delay: 260, life: 400 });
  fx.glow(cx + 22, cy + 4, { color: '#ff9ac8', r: 6, delay: 300, life: 360 });
  fx.glow(cx - 22, cy - 4, { color: '#ffffff', r: 12, delay: 640, life: 520 });
  fx.glow(cx + 22, cy + 14, { color: '#ffd23a', r: 8, delay: 640, life: 520 });
  // 金の 光の 輪が 敵に おりる
  for (let k = 0; k < 3; k++) fx.shock(t.x, t.y - 4 + k * 4, { r0: 30 - k * 6, r1: 8, color: '#ffe680', w: 2.5, delay: 760 + k * 90, life: 360 });
  fx.sparks(t.x, t.y, { colors: SCALE, n: 18, speed: 90, delay: 900, life: 460 });
  fx.flashAt(80, '#fff6d0', 640);
  return true;
}

function seigyo(fx, targets, W, H) {
  const t = targets[0] || { x: W * 0.5, y: H * 0.6 };
  fx.tintAt('rgba(40,10,40,0.3)', 1200);
  // 頭の 2本の かざりから 火花
  for (const dx of [-7, 7]) {
    fx.glow(t.x + dx, t.y - 22, { color: '#ff8ad0', r: 5, delay: 0, life: 420 });
    fx.sparks(t.x + dx, t.y - 22, { colors: PSY, n: 10, speed: 90, delay: 120, life: 360, g: 40 });
  }
  // むらさきの 念の 輪
  for (let k = 0; k < 4; k++) fx.shock(t.x, t.y - 6, { r0: 6, r1: 34 + k * 14, color: k % 2 ? '#ff8ad0' : '#a86ad8', w: 2.5, delay: 360 + k * 120, life: 460 });
  fx.glow(t.x, t.y - 6, { color: '#ffd8f0', r: 22, delay: 420, life: 700, alpha: 0.7 });
  fx.pillar(t.x, t.y + 8, '#a86ad8', { w: 10, h: 56, delay: 480, life: 520, edge: '#ffd8f0' });
  fx.flashAt(90, '#ffe8f6', 420);
  return true;
}

Object.assign(G8_FX, { r88_tenbin: tenbin, r88_seigyo: seigyo });
for (const k of ['r88_tenbin', 'r88_seigyo']) R88_ANIMS.add(k);
Object.assign(R88_HIT, { r88_tenbin: 900, r88_seigyo: 520 });
Object.assign(R88_SFX, { r88_tenbin: 'sparkle', r88_seigyo: 'sparkle' });
// 味方に かける えんしゅつ（client/battle.js が 画面の 下に 出す）
PARTY_ANIMS.add('r88_seigyo');
