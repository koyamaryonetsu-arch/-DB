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
