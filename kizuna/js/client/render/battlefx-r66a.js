// 第66回 A班の 4つの 伝説の 職業の 技の エフェクト（守りの神・光と闇の剣神・ポケモンマスター・千年の大魔法使い）
// 技の id では なく「えんしゅつの なまえ（anim）」で ひく。技の データの anim に ここの なまえを 書く（例 anim: 'kenshin_sig'）。
// battlefx.js の play() で battlefx-r43j.js の つぎに よばれる（ここに ない anim なら false を かえす）。
// え は「それと わかる、でも そのまま うつさない」かんたんな かたち（ロゴや 顔は かかない）。文字は 出さない
//
// 看板の技（なまえは '<職業の id>_sig'）
//  guard_god_sig    守りの神の大結界 … 画面が 金色に なり、大きな 光の たてが 空から おりて 敵を おしかえす → 仲間の 上に 光の やじるし
//  kenshin_sig      光と闇の大剣神斬 … 金の 剣と むらさきの 剣が 空から おりて 十字に まじわり、敵に 光と 闇の 大きな 十字の きず
//  poke_master_sig  めざせポケモンマスター … 赤と 白の ボールが つぎつぎに とんで ひらき、いろいろな 色の 光が 敵に とびかかる
//  sennen_mage_sig  千年の花の大魔法 … 夜の 色の 中、敵の 足もとに 魔法じん → 白い 光の 柱 → 画面の 下に 花畑が ひろがる
// ほかの 技（敵に つかう もの。みかたに つかう 技は 前から ある えんしゅつ）
//  r66a_shield       金の たてが とんで いって ぶつかる（聖なるたての一撃・神のたての大はんげき）
//  r66a_pillar       空から 白と 金の 光の 柱（天のさばきの光）
//  r66a_light_blade  金の 光の 太刀すじ（光の剣・光の一太刀）
//  r66a_dark_blade   むらさきの 太刀すじと、すいとる 闇の つぶ（闇の魔剣）
//  r66a_light_rain   小さな 光の 剣が 雨のように ふる（光の剣の雨）
//  r66a_dark_wave    黒むらさきの 大波（闇の大波）
//  r66a_cross        金と むらさきの 十字の きず（光と闇の十字斬り・光と闇のうず）
//  r66a_ball         赤と 白の ボール（モンスターボール）
//  r66a_volt         上から 黄色い いなずま（たのんだぞ10まんボルト）
//  r66a_team         小さな ボールが いくつも とんで、色とりどりの 光が とびかかる（いっしょに戦おう・みんな出てこい！）
//  r66a_masterball   むらさきの ボール（マスターボール）
//  r66a_beam         白い 光の 線が まっすぐ（ふつうの攻撃魔法）
//  r66a_thunder      空から いくつもの いなずま（かみなりの大魔法）
//  r66a_ice          地面から 氷の 柱（氷の大魔法）
// ・どれも 2.2びょう いないで おわる。あたる じかんは R66A_HIT（battle.js の HIT_DELAY に まぜる）
// ・つぶの なまえは r66a で はじめる（R66A_FINE。battlefx.js の FINE に まぜる）

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t);
const fadeOut = (t, from = 0.7) => (t < from ? 1 : Math.max(0, 1 - (t - from) / (1 - from)));

export const R66A_SIG_JOBS = ['guard_god', 'kenshin', 'poke_master', 'sennen_mage'];
export const R66A_SIGS = R66A_SIG_JOBS.map((j) => `${j}_sig`);
export const R66A_MOVES = [
  'r66a_shield', 'r66a_pillar', 'r66a_light_blade', 'r66a_dark_blade', 'r66a_light_rain', 'r66a_dark_wave', 'r66a_cross',
  'r66a_ball', 'r66a_volt', 'r66a_team', 'r66a_masterball', 'r66a_beam', 'r66a_thunder', 'r66a_ice',
];
export const R66A_ANIMS = new Set([...R66A_SIGS, ...R66A_MOVES]);
// あたる じかん（ms。ダメージの 数字を この ときに 出す）
export const R66A_HIT = {
  guard_god_sig: 560, kenshin_sig: 640, poke_master_sig: 620, sennen_mage_sig: 720,
  r66a_shield: 320, r66a_pillar: 380, r66a_light_blade: 200, r66a_dark_blade: 220, r66a_light_rain: 300, r66a_dark_wave: 340, r66a_cross: 240,
  r66a_ball: 360, r66a_volt: 280, r66a_team: 340, r66a_masterball: 420, r66a_beam: 260, r66a_thunder: 320, r66a_ice: 360,
};
// たたかいの 音（battle.js の ANIM_SFX に まぜる。audio.js・sfx-r26.js に ある 音）
export const R66A_SFX = {
  guard_god_sig: 'sparkle', kenshin_sig: 'blast', poke_master_sig: 'pon', sennen_mage_sig: 'void',
  r66a_shield: 'smash', r66a_pillar: 'kirari', r66a_light_blade: 'kirari', r66a_dark_blade: 'dark', r66a_light_rain: 'sparkle', r66a_dark_wave: 'dark', r66a_cross: 'crit',
  r66a_ball: 'pon', r66a_volt: 'thunder', r66a_team: 'smash', r66a_masterball: 'pon', r66a_beam: 'void', r66a_thunder: 'thunder', r66a_ice: 'ice',
};

const GOLD = ['#fff6c0', '#ffd84a', '#f2a81e', '#ffffff'];
const DARK = ['#d0a0ff', '#8a3ac8', '#3a1060', '#ffffff'];
const VOLT = ['#fff6a0', '#ffe030', '#ffffff'];
const ICE = ['#e0f8ff', '#8ad8ff', '#3a9ae0', '#ffffff'];
const FLOWER = ['#ff8ab8', '#ffd84a', '#ffffff', '#b88aff', '#ff6a6a', '#8ad8ff'];
const TEAM = ['#ffd030', '#ff6a3a', '#5ad8ff', '#7ae06a', '#c88aff'];

// ───────────── え の ぶひん ─────────────
function softGlow(x, cx, cy, r, col, a) {
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, col);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.globalAlpha = a;
  x.fillStyle = g;
  x.fillRect(cx - r, cy - r, r * 2, r * 2);
}
// x0,y0 → x1,y1 の とちゅう（hop: 弧の たかさ）
const along = (p, k) => [p.x0 + (p.x1 - p.x0) * k, p.y0 + (p.y1 - p.y0) * k - Math.sin(k * Math.PI) * (p.hop || 0)];

export const R66A_FINE = {
  // 赤と 白の ボール（とんで いく。top: 上の 色・r: 大きさ）
  r66aBall(x, p, t) {
    const travel = p.travel || 320;
    if (p.age > travel + 60) return;
    const k = clamp01(p.age / travel);
    const [cx, cy] = along(p, easeOut(k));
    const r = p.r || 4;
    x.save();
    x.globalAlpha = 1;
    x.translate(cx, cy);
    x.rotate(p.age / 60);
    x.fillStyle = '#f6f6fa';
    x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.fill();
    x.fillStyle = p.top || '#e8303a';
    x.beginPath(); x.arc(0, 0, r, Math.PI, 0); x.fill();
    x.fillStyle = '#1a1a22';
    x.fillRect(-r, -0.6, r * 2, 1.2);
    x.beginPath(); x.arc(0, 0, r * 0.38, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#ffffff';
    x.beginPath(); x.arc(0, 0, r * 0.22, 0, Math.PI * 2); x.fill();
    x.restore();
  },
  // 光の たて（まるい たてに 十字の しるし。x0,y0 → x1,y1 へ うごく）
  r66aShield(x, p, t) {
    const a = fadeOut(t, 0.75);
    if (a <= 0) return;
    const k = p.travel ? easeOut(clamp01(p.age / p.travel)) : 1;
    const [cx, cy] = p.x0 !== undefined ? along(p, k) : [p.x, p.y];
    const r = (p.r || 10) * (0.5 + 0.5 * easeOut(clamp01(p.age / 220)));
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, cx, cy, r * 2.4, 'rgba(255,220,110,0.9)', a * 0.7);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a;
    x.fillStyle = '#d69a2e';
    x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#fff2b8';
    x.beginPath(); x.arc(cx, cy, r * 0.82, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#f2b830';
    x.fillRect(cx - r * 0.14, cy - r * 0.62, r * 0.28, r * 1.24);
    x.fillRect(cx - r * 0.5, cy - r * 0.14, r, r * 0.28);
    x.restore();
  },
  // 大きな 剣（上から おりて くる。c: 刀の 色・glow: 光の 色・ang: かたむき）
  r66aBlade(x, p, t) {
    const a = fadeOut(t, 0.7);
    if (a <= 0) return;
    const k = easeOut(clamp01(p.age / (p.travel || 260)));
    const cx = p.x0 + (p.x1 - p.x0) * k, cy = p.y0 + (p.y1 - p.y0) * k;
    const s = p.s || 1;
    x.save();
    x.translate(cx, cy);
    x.rotate(p.ang || 0);
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, -10 * s, 18 * s, p.glow || 'rgba(255,230,140,0.9)', a * 0.6);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a;
    // 刀（先が 下）
    x.fillStyle = p.c || '#fff6d0';
    x.beginPath();
    x.moveTo(0, 6 * s);
    x.lineTo(-2.2 * s, 0);
    x.lineTo(-2.2 * s, -22 * s);
    x.lineTo(2.2 * s, -22 * s);
    x.lineTo(2.2 * s, 0);
    x.closePath();
    x.fill();
    // つば・つか
    x.fillStyle = p.hilt || '#d69a2e';
    x.fillRect(-6 * s, -24 * s, 12 * s, 2.4 * s);
    x.fillStyle = '#4a2a1a';
    x.fillRect(-1.2 * s, -31 * s, 2.4 * s, 7 * s);
    x.restore();
  },
  // まっすぐな 光の 線（x0,y0 → x1,y1。はじめ ふとく、だんだん ほそく）
  r66aBeam(x, p, t) {
    const a = fadeOut(t, 0.5);
    if (a <= 0) return;
    const w = (p.w || 4) * (1 - t * 0.7);
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = a * 0.7;
    x.strokeStyle = p.glow || '#9ad8ff';
    x.lineWidth = w * 2.4;
    x.lineCap = 'round';
    x.beginPath(); x.moveTo(p.x0, p.y0); x.lineTo(p.x1, p.y1); x.stroke();
    x.globalAlpha = a;
    x.strokeStyle = '#ffffff';
    x.lineWidth = w;
    x.beginPath(); x.moveTo(p.x0, p.y0); x.lineTo(p.x1, p.y1); x.stroke();
    x.restore();
  },
  // 花（くきと 5まいの 花びら。だんだん ひらく）
  r66aFlower(x, p, t) {
    const a = fadeOut(t, 0.75);
    if (a <= 0) return;
    const s = (p.s || 1) * easeOut(clamp01(p.age / 300));
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y);
    x.fillStyle = '#3aa83a';
    x.fillRect(-0.5 * s, 0, 1 * s, 6 * s);
    x.fillStyle = p.c || '#ff8ab8';
    for (let i = 0; i < 5; i++) {
      const q = (i / 5) * Math.PI * 2 + (p.rot || 0);
      x.beginPath(); x.arc(Math.cos(q) * 2 * s, Math.sin(q) * 2 * s, 1.6 * s, 0, Math.PI * 2); x.fill();
    }
    x.fillStyle = '#ffe060';
    x.beginPath(); x.arc(0, 0, 1.1 * s, 0, Math.PI * 2); x.fill();
    x.restore();
  },
  // 氷の 柱（地面から のびる。h: たかさ）
  r66aIce(x, p, t) {
    const a = fadeOut(t, 0.7);
    if (a <= 0) return;
    const h = (p.h || 24) * easeOut(clamp01(p.age / 180));
    const w = p.w || 6;
    x.save();
    x.globalAlpha = a * 0.9;
    x.fillStyle = '#8ad8ff';
    x.beginPath();
    x.moveTo(p.x - w, p.y);
    x.lineTo(p.x, p.y - h);
    x.lineTo(p.x + w, p.y);
    x.closePath();
    x.fill();
    x.fillStyle = '#e8faff';
    x.beginPath();
    x.moveTo(p.x - w * 0.3, p.y);
    x.lineTo(p.x, p.y - h * 0.9);
    x.lineTo(p.x + w * 0.15, p.y);
    x.closePath();
    x.fill();
    x.restore();
  },
};

// ───────────── エフェクト ─────────────
// fx: Effects（battlefx.js）  targets: [{ x, y }]  W・H: がめんの 大きさ
export function playR66aFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  if (!R66A_ANIMS.has(anim) || !targets || !targets.length) return false;
  const crit = !!opts.crit;
  const all = targets.length > 1;
  const sz = all ? 0.85 : 1;
  const tx = targets.reduce((s, t) => s + t.x, 0) / targets.length;
  const ty = targets.reduce((s, t) => s + t.y, 0) / targets.length;
  const from = opts.from || { x: W / 2, y: H + 6 };
  const fy = Math.min(H - 16, from.y - 18);
  const each = (fn) => targets.forEach((t, i) => fn(t, i, i * (all ? 50 : 0)));
  const hitMark = (t, d, col, r = 16) => {
    fx.impact(t.x, t.y, { r: (crit ? r + 6 : r) * sz, color: '#ffffff', delay: d });
    fx.sparks(t.x, t.y, { colors: ['#ffffff', col], n: all ? 8 : 14, speed: 150, delay: d, life: 340, len: 7 });
  };
  switch (anim) {
    // ───── 看板の技 ─────
    case 'guard_god_sig': {
      // 1) 画面が 金色に なり、空から 大きな 光の たてが おりて くる
      fx.tintAt('rgba(60, 40, 0, 0.35)', 1600);
      fx.add({ kind: 'r66aShield', x0: tx, y0: -24, x1: tx, y1: ty - 6, travel: 460, r: 26, life: 1000 });
      for (let k = 0; k < 10; k++) fx.twinkle(rnd(10, W - 10), rnd(6, H * 0.5), { color: GOLD[k % GOLD.length], size: rnd(3, 6), delay: k * 40, life: 360 });
      // 2) 敵を おしかえす（金の わと ひばな）
      each((t, i, d) => {
        fx.shock(t.x, t.y, { r0: 6, r1: 48 * sz, color: '#ffe08a', w: 3, delay: 560 + d, life: 420 });
        hitMark(t, 560 + d, '#ffd84a', 20);
      });
      fx.flashAt(100, '#fff6d0', 560);
      // 3) 仲間の 上に 光の やじるし（守備力が 上がる）
      fx.arrows(W / 2, H - 22, '#ffd84a', true, 4, 780);
      fx.hitStop(crit ? 260 : 200, 560, 1.8);
      return true;
    }
    case 'kenshin_sig': {
      // 1) 夜の 色。金の 剣と むらさきの 剣が 左右の 空から おりる
      fx.tintAt('rgba(16, 6, 30, 0.5)', 1800);
      fx.add({ kind: 'r66aBlade', x0: tx - 70, y0: -30, x1: tx - 8, y1: ty - 8, travel: 420, s: 1.5, ang: 0.5, c: '#fff6d0', hilt: '#d69a2e', glow: 'rgba(255,230,140,0.9)', life: 900 });
      fx.add({ kind: 'r66aBlade', x0: tx + 70, y0: -30, x1: tx + 8, y1: ty - 8, travel: 420, s: 1.5, ang: -0.5, c: '#d0a0ff', hilt: '#3a1060', glow: 'rgba(160,80,240,0.9)', life: 900 });
      // 2) まじわった ところから 光と 闇の 十字の きず
      each((t, i, d) => {
        fx.bigCut(t.x, t.y, { ang: 0.75, color: '#fff6d0', glow: '#ffd84a', w: 3, delay: 560 + d, life: 360 });
        fx.bigCut(t.x, t.y, { ang: -0.75, color: '#e8d0ff', glow: '#8a3ac8', w: 3, delay: 640 + d, life: 360 });
        hitMark(t, 640 + d, '#ffd84a', 20);
        fx.sparks(t.x, t.y, { colors: DARK, n: 10, speed: 130, delay: 660 + d, life: 380, len: 6 });
      });
      fx.flashAt(110, '#f0e0ff', 640);
      fx.hitStop(crit ? 300 : 230, 640, 2.0);
      return true;
    }
    case 'poke_master_sig': {
      // 1) ボールが つぎつぎに とんで いって ひらく
      fx.tintAt('rgba(10, 20, 40, 0.3)', 1600);
      const n = Math.max(4, targets.length * 2);
      for (let k = 0; k < n; k++) {
        const t = targets[k % targets.length];
        const d = k * 70;
        fx.add({ kind: 'r66aBall', x0: from.x + rnd(-30, 30), y0: fy, x1: t.x + rnd(-14, 14), y1: t.y - 16 + rnd(-6, 6), hop: 30, travel: 300, r: 4, life: 360, delay: d });
        fx.glow(t.x, t.y - 12, { color: TEAM[k % TEAM.length], r: 16, delay: d + 320, life: 300, alpha: 0.9 });
      }
      // 2) 色とりどりの 光が とびかかる
      each((t, i, d) => {
        fx.sparks(t.x, t.y, { colors: TEAM, n: 18, speed: 170, delay: 620 + d, life: 420, len: 8 });
        hitMark(t, 620 + d, '#ffd030', 20);
        fx.shock(t.x, t.y, { r0: 6, r1: 40 * sz, color: '#ffffff', w: 2, delay: 620 + d, life: 360 });
      });
      fx.flashAt(90, '#ffffff', 620);
      fx.hitStop(crit ? 260 : 200, 620, 1.7);
      return true;
    }
    case 'sennen_mage_sig': {
      // 1) 夜の 色。敵の 足もとに 魔法じん・光が あつまる
      fx.tintAt('rgba(6, 10, 40, 0.5)', 2000);
      each((t, i, d) => {
        fx.rune(t.x, t.y + 10, { color: '#c8e8ff', r: 26 * sz, delay: d, life: 900 });
        fx.converge(t.x, t.y, { colors: ['#ffffff', '#c8e8ff'], n: 12, r: 34, delay: 200 + d, life: 420 });
      });
      // 2) 白い 光の 柱
      each((t, i, d) => {
        fx.pillar(t.x, t.y + 12, '#c8e8ff', { w: 12 * sz, h: 120, delay: 680 + d, life: 520, edge: '#ffffff' });
        hitMark(t, 720 + d, '#c8e8ff', 22);
      });
      fx.flashAt(120, '#ffffff', 720);
      // 3) 画面の 下に 花畑が ひろがる（花びらも まう）
      for (let k = 0; k < 14; k++) {
        fx.add({ kind: 'r66aFlower', x: 10 + (k / 13) * (W - 20) + rnd(-4, 4), y: H - 8 - rnd(0, 6), s: rnd(1.2, 1.8), c: FLOWER[k % FLOWER.length], rot: rnd(0, 6), life: 900, delay: 820 + k * 20 });
        fx.petal(rnd(10, W - 10), H - rnd(10, 30), { color: FLOWER[k % FLOWER.length], vy: -rnd(20, 40), vx: rnd(-20, 20), delay: 880 + k * 20, life: 800 });
      }
      fx.hitStop(crit ? 300 : 220, 720, 1.8);
      return true;
    }
    // ───── 守りの神 ─────
    case 'r66a_shield': {
      each((t, i, d) => {
        fx.add({ kind: 'r66aShield', x0: from.x, y0: fy, x1: t.x, y1: t.y - 4, travel: 300, r: 10, life: 520, delay: d });
        hitMark(t, 320 + d, '#ffd84a', 18);
      });
      fx.hitStop(crit ? 200 : 130, 320, 1.4);
      return true;
    }
    case 'r66a_pillar': {
      each((t, i, d) => {
        fx.glow(t.x, 8, { color: '#fff6c0', r: 16, delay: d, life: 360, alpha: 0.8 });
        fx.pillar(t.x, t.y + 12, '#fff2b8', { w: 9 * sz, h: 110, delay: 300 + d, life: 460, edge: '#ffffff' });
        hitMark(t, 380 + d, '#ffd84a', 16);
      });
      fx.flashAt(70, '#fffbe0', 380);
      return true;
    }
    // ───── 光と闇の剣神 ─────
    case 'r66a_light_blade': {
      each((t, i, d) => {
        fx.cut(t.x, t.y, { ang: 0.8, len: 44 * sz, w: 3, color: '#fffbe0', glow: '#ffd84a', delay: d, life: 300 });
        hitMark(t, 200 + d, '#ffd84a', 18);
        fx.twinkle(t.x + 8, t.y - 10, { color: '#ffd84a', size: 6, delay: 200 + d, life: 320 });
      });
      return true;
    }
    case 'r66a_dark_blade': {
      each((t, i, d) => {
        fx.cut(t.x, t.y, { ang: -0.8, len: 44 * sz, w: 3, color: '#e8d0ff', glow: '#8a3ac8', delay: d, life: 300 });
        hitMark(t, 220 + d, '#8a3ac8', 18);
        // すいとる 闇の つぶ（敵 → 自分の ほうへ）
        for (let k = 0; k < 6; k++) fx.add({ x: t.x + rnd(-6, 6), y: t.y + rnd(-6, 6), vx: (from.x - t.x) * 1.4, vy: (fy - t.y) * 1.4, color: DARK[k % 3], life: 520, size: 1.6, delay: 260 + d + k * 40 });
      });
      return true;
    }
    case 'r66a_light_rain': {
      for (let k = 0; k < 9; k++) {
        const t = targets[k % targets.length];
        const x1 = t.x + rnd(-14, 14), y1 = t.y + rnd(-6, 6);
        const d = k * 60;
        fx.add({ kind: 'r66aBlade', x0: x1, y0: -20, x1, y1, travel: 240, s: 0.7, life: 360, delay: d });
        fx.sparks(x1, y1, { colors: GOLD, n: 5, speed: 100, delay: d + 240, life: 260, len: 5 });
      }
      each((t, i, d) => hitMark(t, 300 + d, '#ffd84a', 14));
      fx.hitStop(crit ? 180 : 120, 300, 1.2);
      return true;
    }
    case 'r66a_dark_wave': {
      fx.tintAt('rgba(20, 0, 40, 0.3)', 700);
      for (let k = 0; k < 3; k++) fx.gust(W / 2, ty + k * 6 - 6, { len: W * 0.9, amp: 6, color: DARK[k], w: 2.4, dir: 1, delay: k * 60, life: 460 });
      each((t, i, d) => {
        fx.shock(t.x, t.y, { r0: 4, r1: 32 * sz, color: '#8a3ac8', w: 2, delay: 340 + d, life: 360 });
        hitMark(t, 340 + d, '#8a3ac8', 16);
      });
      return true;
    }
    case 'r66a_cross': {
      each((t, i, d) => {
        fx.cut(t.x, t.y, { ang: 0.8, len: 40 * sz, w: 3, color: '#fffbe0', glow: '#ffd84a', delay: d, life: 280 });
        fx.cut(t.x, t.y, { ang: -0.8, len: 40 * sz, w: 3, color: '#e8d0ff', glow: '#8a3ac8', delay: 90 + d, life: 280 });
        hitMark(t, 240 + d, '#c8a0ff', 18);
      });
      fx.hitStop(crit ? 180 : 120, 240, 1.3);
      return true;
    }
    // ───── ポケモンマスター ─────
    case 'r66a_ball':
    case 'r66a_masterball': {
      const master = anim === 'r66a_masterball';
      const hit = R66A_HIT[anim];
      each((t, i, d) => {
        fx.add({ kind: 'r66aBall', x0: from.x, y0: fy, x1: t.x, y1: t.y - 8, hop: 34, travel: hit - 40, r: master ? 5.5 : 4.5, top: master ? '#8a3ac8' : '#e8303a', life: hit + 40, delay: d });
        fx.glow(t.x, t.y - 8, { color: master ? '#d0a0ff' : '#ffffff', r: master ? 26 : 18, delay: hit + d, life: 320, alpha: 0.9 });
        hitMark(t, hit + d, master ? '#c88aff' : '#ff6a6a', master ? 22 : 16);
      });
      if (master) fx.flashAt(90, '#f0e0ff', hit);
      fx.hitStop(crit ? 220 : 140, hit, master ? 1.6 : 1.2);
      return true;
    }
    case 'r66a_volt': {
      each((t, i, d) => {
        fx.zap(t.x + rnd(-8, 8), 0, t.x, t.y, { color: '#fff6a0', glow: '#ffe030', w: 1.8, delay: 120 + d, life: 320, forks: 2 });
        fx.sparks(t.x, t.y, { colors: VOLT, n: 12, speed: 160, delay: 280 + d, life: 320, len: 7 });
        hitMark(t, 280 + d, '#ffe030', 16);
      });
      fx.flashAt(70, '#fff6a0', 280);
      return true;
    }
    case 'r66a_team': {
      // 小さな ボールが いくつも → 色とりどりの 光が とびかかる
      for (let k = 0; k < 5; k++) {
        const t = targets[k % targets.length];
        fx.add({ kind: 'r66aBall', x0: from.x + (k - 2) * 14, y0: fy, x1: t.x + rnd(-10, 10), y1: t.y - 14, hop: 22, travel: 240, r: 3, life: 280, delay: k * 50 });
        fx.proj(t.x + rnd(-6, 6), t.y + rnd(-6, 6), [TEAM[k], '#ffffff'], { size: 3, travel: 160, delay: 180 + k * 50, from: { x: t.x + rnd(-20, 20), y: t.y - 24 } });
      }
      each((t, i, d) => hitMark(t, 340 + d, TEAM[i % TEAM.length], 16));
      fx.hitStop(crit ? 180 : 120, 340, 1.3);
      return true;
    }
    // ───── 千年の大魔法使い ─────
    case 'r66a_beam': {
      each((t, i, d) => {
        fx.converge(from.x, fy, { colors: ['#ffffff', '#c8e8ff'], n: 10, r: 20, delay: d, life: 200 });
        fx.add({ kind: 'r66aBeam', x0: from.x, y0: fy, x1: t.x, y1: t.y, w: 4, glow: '#9ad8ff', life: 360, delay: 200 + d });
        hitMark(t, 260 + d, '#c8e8ff', 18);
      });
      return true;
    }
    case 'r66a_thunder': {
      fx.tintAt('rgba(10, 10, 40, 0.35)', 700);
      for (let k = 0; k < 6; k++) {
        const t = targets[k % targets.length];
        fx.zap(t.x + rnd(-14, 14), 0, t.x + rnd(-6, 6), t.y, { color: '#ffffff', glow: '#9ad8ff', w: 1.6, delay: 120 + k * 60, life: 300, forks: 2 });
      }
      each((t, i, d) => {
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#9ad8ff', '#fff6a0'], n: 12, speed: 160, delay: 320 + d, life: 340, len: 7 });
        hitMark(t, 320 + d, '#9ad8ff', 18);
      });
      fx.flashAt(90, '#e8f0ff', 320);
      return true;
    }
    case 'r66a_ice': {
      each((t, i, d) => {
        for (let k = 0; k < 3; k++) fx.add({ kind: 'r66aIce', x: t.x + (k - 1) * 9, y: t.y + 14, h: k === 1 ? 34 : 22, w: k === 1 ? 7 : 5, life: 700, delay: 200 + d + k * 50 });
        fx.sparks(t.x, t.y, { colors: ICE, n: 12, speed: 140, delay: 360 + d, life: 360, len: 6 });
        hitMark(t, 360 + d, '#8ad8ff', 16);
      });
      return true;
    }
    default:
      return false;
  }
}
