// 第66回 B班の 新しい 伝説の 職業 4つの 技の エフェクト（ニューカワイイ・SMAP・大御所・五つ星シェフ）
// 技の id では なく「えんしゅつの なまえ（anim）」で ひく。技の データの anim に ここの なまえを 書く（例 anim: 'smap_sig'）。
// battlefx.js の play() で battlefx-r43j.js の つぎに よばれる（ここに ない anim なら false を かえす）。
//
// 看板の技（なまえは '<職業の id>_sig'）
//  new_kawaii_sig      ニューカワイイ … 画面が ピンクに なり、上から スポットライト → ハートが いっぱい ふりそそぐ → 敵の 上で ハートが はじける・みかたに ピンクの やじるし
//  smap_sig            SMAP … 夜の ステージ → 5色の 光の すじ（5人）が 1つに 集まる → 敵の 上で 大きな 花が さく → 花びらが まう・みかたに 金の やじるし
//  oogosho_sig         大御所 … 金の びょうぶの ような 光 → 大きな ハリセンが 3回 → 敵の まわりに 笑いの 音ぷと きらきら・大きな しょうげき
//  five_star_chef_sig  五つ星シェフ … 銀の ふたが ひらく → 金の 星が 5つ ならんで 光る → 大きな 炎の 柱が 敵を つつむ・みかたに 回復の 光
// ほかの 技
//  r66b_kawaii   みかたの まわりに ピンクの ハートと リボンの きらきら（みかた）
//  r66b_heart    手で 作った ハートから ピンクの ビーム → 敵で ハートが はじける
//  r66b_five     5色の 音ぷが みかたの 上を まわる（みかた）
//  r66b_laugh    敵の まわりで 音ぷと きらきらが ゆれる（笑いの うず）
//  r66b_harisen  大きな ハリセンが ふり下ろされて スパーン
//  r66b_dish     銀の ふたが ひらいて、湯気と 金の 星（みかた）
// ・どれも 2.2びょう いないで おわる。あたる じかんは R66B_HIT（battle.js の HIT_DELAY に まぜる）
// ・みかたに つかう えんしゅつ（PARTY_ANIMS_R66B）は、battle.js が がめんの 下の まん中に 出す（この ファイルで battlefx-jobs2.js の PARTY_ANIMS に まぜる）
// ・文字は 出さない（笑い声も 絵で あらわす）

import { PARTY_ANIMS } from './battlefx-jobs2.js?v=c69281e421b9';

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t);
const fadeOut = (t, from = 0.7) => (t < from ? 1 : Math.max(0, 1 - (t - from) / (1 - from)));

export const R66B_SIG_JOBS = ['new_kawaii', 'smap', 'oogosho', 'five_star_chef'];
export const R66B_SIGS = R66B_SIG_JOBS.map((j) => `${j}_sig`);
export const R66B_MOVES = ['r66b_kawaii', 'r66b_heart', 'r66b_five', 'r66b_laugh', 'r66b_harisen', 'r66b_dish'];
export const R66B_ANIMS = new Set([...R66B_SIGS, ...R66B_MOVES]);
// みかたに つかう ことが ある えんしゅつ（敵が いない ときは がめんの 下に 大きく 出す）
export const PARTY_ANIMS_R66B = new Set(['r66b_kawaii', 'r66b_five', 'r66b_dish']);
// battle.js・テストが 見る みかたの えんしゅつの 一覧（battlefx-jobs2.js の PARTY_ANIMS）に まぜる（長い 行を かえない ため）
for (const a of PARTY_ANIMS_R66B) PARTY_ANIMS.add(a);
// あたる じかん（ms。ダメージの 数字を この ときに 出す）
export const R66B_HIT = {
  new_kawaii_sig: 900, smap_sig: 920, oogosho_sig: 880, five_star_chef_sig: 900, r66b_heart: 380, r66b_laugh: 360, r66b_harisen: 300,
};
// たたかいの 音（battle.js の ANIM_SFX に まぜる。audio.js・sfx-r26.js・sfx-r33.js に ある 音）
export const R66B_SFX = {
  new_kawaii_sig: 'sparkle', smap_sig: 'kirari', oogosho_sig: 'r33_clap', five_star_chef_sig: 'fire',
  r66b_kawaii: 'kirari', r66b_heart: 'sparkle', r66b_five: 'buff', r66b_laugh: 'r33_clap', r66b_harisen: 'smash', r66b_dish: 'heal',
};

const FIVE = ['#ff5a7a', '#ffb02a', '#4ad070', '#3aa0ff', '#b070ff'];

// ───────────── え の ぶひん ─────────────
function softGlow(x, cx, cy, r, col, a) {
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, col);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.globalAlpha = a;
  x.fillStyle = g;
  x.fillRect(cx - r, cy - r, r * 2, r * 2);
}
function heartPath(x, s) {
  x.beginPath();
  x.moveTo(0, 3.2 * s);
  x.bezierCurveTo(-5.5 * s, -0.5 * s, -3.2 * s, -5 * s, 0, -2.2 * s);
  x.bezierCurveTo(3.2 * s, -5 * s, 5.5 * s, -0.5 * s, 0, 3.2 * s);
  x.closePath();
}
function starPath(x, r, n = 5, inner = 0.45) {
  x.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    const rr = i % 2 ? r * inner : r;
    if (i) x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else x.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  x.closePath();
}

export const R66B_FINE = {
  // ハート（rise … 上へ のぼる 速さ px/びょう、spin … ゆれ）
  r66bHeart(x, p, t) {
    const a = fadeOut(t, 0.65) * clamp01(p.age / 80);
    if (a <= 0) return;
    const s = (p.s || 1) * (0.6 + 0.4 * easeOut(clamp01(p.age / 220)));
    const yy = p.y - (p.rise || 0) * (p.age / 1000);
    const xx = p.x + Math.sin(p.age / 140 + (p.ph || 0)) * (p.sway || 0);
    x.save();
    x.globalAlpha = a;
    x.translate(xx, yy);
    x.rotate(Math.sin(p.age / 200 + (p.ph || 0)) * 0.25);
    heartPath(x, s);
    x.fillStyle = p.color || '#ff5aa8';
    x.fill();
    x.lineWidth = 1;
    x.strokeStyle = '#ffffff';
    x.stroke();
    x.fillStyle = 'rgba(255,255,255,0.8)';
    x.fillRect(-2.4 * s, -1.8 * s, 1.2 * s, 1.2 * s);
    x.restore();
  },
  // 音ぷ（たまと ぼう。2つ つながる 音ぷも）
  r66bNote(x, p, t) {
    const a = fadeOut(t, 0.65) * clamp01(p.age / 80);
    if (a <= 0) return;
    const s = p.s || 1;
    let cx = p.x, cy = p.y - (p.rise || 0) * (p.age / 1000);
    if (p.orbit) {
      const ang = (p.ph || 0) + p.age / 260;
      cx = p.x + Math.cos(ang) * p.orbit;
      cy = p.y + Math.sin(ang) * p.orbit * 0.4 - (p.rise || 0) * (p.age / 1000);
    }
    x.save();
    x.globalAlpha = a;
    x.translate(cx, cy);
    x.fillStyle = p.color || '#ffffff';
    x.strokeStyle = p.color || '#ffffff';
    x.lineWidth = 1.2 * s;
    x.beginPath(); x.ellipse(0, 0, 2.4 * s, 1.8 * s, -0.4, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.moveTo(2 * s, -0.6 * s); x.lineTo(2 * s, -8 * s); x.stroke();
    if (p.two) {
      x.beginPath(); x.ellipse(6 * s, 1 * s, 2.4 * s, 1.8 * s, -0.4, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.moveTo(8 * s, 0.4 * s); x.lineTo(8 * s, -7 * s); x.stroke();
      x.fillRect(2 * s, -8.6 * s, 6 * s, 1.8 * s);
    } else {
      x.beginPath(); x.moveTo(2 * s, -8 * s); x.quadraticCurveTo(5.5 * s, -6 * s, 4.4 * s, -3 * s); x.stroke();
    }
    x.restore();
  },
  // 5つの とがりの 星（金。ぽんと 出て かがやく）
  r66bStar(x, p, t) {
    const a = fadeOut(t, 0.7) * clamp01(p.age / 100);
    if (a <= 0) return;
    const r = (p.r || 6) * (0.4 + 0.6 * easeOut(clamp01(p.age / 220)));
    x.save();
    x.translate(p.x, p.y - (p.rise || 0) * (p.age / 1000));
    x.rotate((p.spin || 0) * p.age / 1000);
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, 0, r * 2.4, 'rgba(255,220,120,0.9)', a * 0.7);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a;
    starPath(x, r);
    x.fillStyle = p.color || '#ffd040';
    x.fill();
    x.lineWidth = 1;
    x.strokeStyle = '#fff6cc';
    x.stroke();
    x.restore();
  },
  // 大きな 花（5まいの 花びらが ひらく）
  r66bFlower(x, p, t) {
    const a = fadeOut(t, 0.7) * clamp01(p.age / 120);
    if (a <= 0) return;
    const open = easeOut(clamp01(p.age / 420));
    const r = (p.r || 20) * open;
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y);
    x.rotate(p.age / 2000);
    const cols = p.colors || FIVE;
    for (let i = 0; i < 5; i++) {
      x.save();
      x.rotate((i * Math.PI * 2) / 5);
      x.fillStyle = cols[i % cols.length];
      x.beginPath(); x.ellipse(0, -r * 0.6, r * 0.32, r * 0.55, 0, 0, Math.PI * 2); x.fill();
      x.restore();
    }
    x.fillStyle = '#fff6b0';
    x.beginPath(); x.arc(0, 0, r * 0.26, 0, Math.PI * 2); x.fill();
    x.restore();
  },
  // 花びら（ひらひら おちる）
  r66bPetal(x, p, t) {
    const a = fadeOut(t, 0.6);
    if (a <= 0) return;
    const sec = p.age / 1000;
    x.save();
    x.globalAlpha = a;
    x.translate(p.x + Math.sin(sec * 5 + (p.ph || 0)) * 6, p.y + (p.fall || 30) * sec);
    x.rotate(sec * 4 + (p.ph || 0));
    x.fillStyle = p.color || '#ff9ac8';
    x.beginPath(); x.ellipse(0, 0, 1.6, 3, 0, 0, Math.PI * 2); x.fill();
    x.restore();
  },
  // ハリセン（じゃばらの 白い 紙。ang0 から ang1 へ ふり下ろす）
  r66bFan(x, p, t) {
    const a = fadeOut(t, 0.75);
    if (a <= 0) return;
    const k = easeOut(clamp01(p.age / (p.swing || 180)));
    const ang = (p.ang0 ?? -1.6) + ((p.ang1 ?? 0.2) - (p.ang0 ?? -1.6)) * k;
    const s = p.s || 1;
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y);
    x.rotate(ang);
    // もつ ところ（赤い テープ）
    x.fillStyle = '#d8202c';
    x.fillRect(-2 * s, 0, 4 * s, 10 * s);
    // じゃばら（ひろがった 紙）
    const n = 7;
    for (let i = 0; i < n; i++) {
      const a0 = -0.55 + (i * 1.1) / n, a1 = -0.55 + ((i + 1) * 1.1) / n;
      x.fillStyle = i % 2 ? '#ffffff' : '#e4e4ee';
      x.beginPath();
      x.moveTo(0, 0);
      x.lineTo(Math.sin(a0) * 30 * s, -Math.cos(a0) * 30 * s);
      x.lineTo(Math.sin(a1) * 30 * s, -Math.cos(a1) * 30 * s);
      x.closePath();
      x.fill();
    }
    x.strokeStyle = '#8a8aa0';
    x.lineWidth = 1;
    x.stroke();
    x.restore();
  },
  // 銀の ふた（クローシュ）と お皿。open の あとで ふたが 上に ひらく
  r66bCloche(x, p, t) {
    const a = fadeOut(t, 0.7) * clamp01(p.age / 120);
    if (a <= 0) return;
    const s = p.s || 1;
    const lift = easeOut(clamp01((p.age - (p.open ?? 300)) / 260)) * 16 * s;
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y);
    // お皿
    x.fillStyle = '#f6f6fa';
    x.beginPath(); x.ellipse(0, 2 * s, 16 * s, 3.5 * s, 0, 0, Math.PI * 2); x.fill();
    x.strokeStyle = '#d69a2e';
    x.lineWidth = 1;
    x.stroke();
    // 料理（ひらいた あと）
    if (lift > 0) {
      x.fillStyle = '#c8602a';
      x.beginPath(); x.ellipse(0, 0, 8 * s, 3 * s, 0, Math.PI, Math.PI * 2); x.fill();
      x.fillStyle = '#4ad070';
      x.fillRect(-1.5 * s, -3.5 * s, 3 * s, 2 * s);
    }
    // ふた（銀の まるい ドーム）
    x.translate(0, -lift);
    const g = x.createLinearGradient(-12 * s, -12 * s, 12 * s, 0);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#8a90a4');
    x.fillStyle = g;
    x.beginPath(); x.ellipse(0, 1 * s, 13 * s, 12 * s, 0, Math.PI, Math.PI * 2); x.fill();
    x.fillStyle = '#c3c8d8';
    x.beginPath(); x.arc(0, -11.5 * s, 2 * s, 0, Math.PI * 2); x.fill();
    x.restore();
  },
};

// fx: Effects（battlefx.js）  targets: [{ x, y }]  W・H: がめんの 大きさ
export function playR66bFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  if (!R66B_ANIMS.has(anim) || !targets || !targets.length) return false;
  const crit = !!opts.crit;
  const all = targets.length > 1;
  const sz = all ? 0.85 : 1;
  const tx = targets.reduce((s, t) => s + t.x, 0) / targets.length;
  const ty = targets.reduce((s, t) => s + t.y, 0) / targets.length;
  const from = opts.from || { x: W / 2, y: H + 6 };
  const each = (fn) => targets.forEach((t, i) => fn(t, i, i * (all ? 50 : 0)));
  const hitMark = (t, d, col, r = 16) => {
    fx.impact(t.x, t.y, { r: (crit ? r + 6 : r) * sz, color: '#ffffff', delay: d });
    fx.sparks(t.x, t.y, { colors: ['#ffffff', col], n: all ? 8 : 14, speed: 150, delay: d, life: 340, len: 7 });
  };
  const fy = Math.min(H - 16, from.y - 18);
  switch (anim) {
    // ───── 看板の技 ─────
    case 'new_kawaii_sig': {
      // 1) ピンクの ステージと スポットライト
      fx.tintAt('rgba(60, 10, 40, 0.45)', 1900);
      for (let k = 0; k < 3; k++) fx.glow(W * (0.2 + k * 0.3), 10, { color: '#ffc8e8', r: 40, delay: k * 120, life: 900, alpha: 0.6 });
      // 2) ハートが いっぱい ふりそそぐ
      for (let k = 0; k < 22; k++) {
        fx.add({ kind: 'r66bHeart', x: rnd(10, W - 10), y: rnd(-10, 30), rise: -rnd(60, 110), sway: 4, ph: rnd(0, 6), s: rnd(0.8, 1.4), color: k % 3 ? '#ff5aa8' : '#ffb0d8', life: 1200, delay: 200 + k * 30 });
      }
      // 3) 敵の 上で 大きな ハートが はじける
      each((t, i, d) => {
        fx.add({ kind: 'r66bHeart', x: t.x, y: t.y - 6, s: 2.6 * sz, color: '#ff3a8a', life: 520, delay: 640 + d });
        hitMark(t, 900 + d, '#ff8ac8', 22);
        fx.shock(t.x, t.y, { r0: 8, r1: 54 * sz, color: '#ffc8e8', w: 3, delay: 900 + d, life: 420 });
      });
      fx.flashAt(110, '#ffe0f0', 900);
      fx.hitStop(crit ? 300 : 240, 900, 2.0);
      // みかたの 攻撃力と 魔力も 上がる（ピンクの やじるし）
      fx.arrows(from.x, fy, '#ff8ac8', true, 3, 1100);
      return true;
    }
    case 'smap_sig': {
      // 1) 夜の ステージ
      fx.tintAt('rgba(6, 10, 34, 0.55)', 2000);
      for (let k = 0; k < 12; k++) fx.twinkle(rnd(6, W - 6), rnd(4, 34), { color: '#ffffff', size: rnd(3, 5), delay: k * 40, life: 320 });
      // 2) 5色の 光の すじ（5人）が 敵の 上に 集まる
      FIVE.forEach((c, k) => {
        const sx = W * (0.1 + k * 0.2);
        fx.add({ kind: 'r66bNote', x: sx, y: H - 10, rise: 120, s: 1.2, color: c, two: k % 2 === 0, life: 700, delay: 120 + k * 60 });
        fx.glow(sx, H - 20, { color: c, r: 18, delay: 120 + k * 60, life: 500 });
        fx.glow(tx, ty - 10, { color: c, r: 22, delay: 520 + k * 50, life: 360 });
      });
      // 3) 敵の 上で 大きな 花が さく → 花びらが まう
      each((t, i, d) => {
        fx.add({ kind: 'r66bFlower', x: t.x, y: t.y - 8, r: 26 * sz, life: 1000, delay: 760 + d });
        hitMark(t, 920 + d, '#fff6b0', 22);
        fx.shock(t.x, t.y, { r0: 8, r1: 56 * sz, color: '#ffffff', w: 3, delay: 920 + d, life: 420 });
        for (let k = 0; k < 6; k++) fx.add({ kind: 'r66bPetal', x: t.x + rnd(-24, 24), y: t.y - rnd(20, 40), fall: rnd(24, 40), ph: rnd(0, 6), color: FIVE[k % 5], life: 900, delay: 960 + d + k * 40 });
      });
      fx.flashAt(110, '#fffbe0', 920);
      fx.hitStop(crit ? 300 : 240, 920, 2.0);
      fx.arrows(from.x, fy, '#ffe066', true, 3, 1150);
      return true;
    }
    case 'oogosho_sig': {
      // 1) 金の びょうぶの ような 光
      fx.tintAt('rgba(40, 24, 4, 0.45)', 1800);
      for (let k = 0; k < 4; k++) fx.glow(W * (0.14 + k * 0.24), H * 0.4, { color: '#ffd878', r: 44, delay: k * 80, life: 900, alpha: 0.5 });
      // 2) 大きな ハリセンが 3回
      each((t, i, d) => {
        for (let k = 0; k < 3; k++) {
          fx.add({ kind: 'r66bFan', x: t.x + (k - 1) * 14, y: t.y + 16, s: 1.1 * sz, ang0: k % 2 ? 1.6 : -1.6, ang1: k % 2 ? -0.2 : 0.2, swing: 160, life: 360, delay: 260 + k * 200 + d });
          fx.impact(t.x + (k - 1) * 6, t.y - 6, { r: 12 * sz, color: '#ffffff', delay: 420 + k * 200 + d });
        }
        // 3) 笑いの 音ぷと きらきら・大きな しょうげき
        for (let k = 0; k < 5; k++) fx.add({ kind: 'r66bNote', x: t.x + rnd(-20, 20), y: t.y - rnd(4, 18), rise: 40, s: 0.9, color: '#ffe07a', two: k % 2 === 1, life: 700, delay: 880 + d + k * 40 });
        hitMark(t, 880 + d, '#ffe07a', 22);
        fx.shock(t.x, t.y, { r0: 8, r1: 54 * sz, color: '#fff2b0', w: 3, delay: 880 + d, life: 420 });
      });
      fx.flashAt(110, '#fff6d0', 880);
      fx.hitStop(crit ? 300 : 240, 880, 2.0);
      return true;
    }
    case 'five_star_chef_sig': {
      // 1) 銀の ふたが ひらく
      fx.tintAt('rgba(30, 14, 4, 0.45)', 1900);
      const cy = Math.max(30, ty - 40);
      fx.add({ kind: 'r66bCloche', x: tx, y: cy, s: 1.3, open: 260, life: 900 });
      // 2) 金の 星が 5つ ならんで 光る
      for (let k = 0; k < 5; k++) fx.add({ kind: 'r66bStar', x: tx + (k - 2) * 18, y: cy - 26, r: 6, spin: 2, life: 900, delay: 420 + k * 70 });
      // 3) 大きな 炎の 柱が 敵を つつむ
      each((t, i, d) => {
        for (let k = 0; k < 4; k++) fx.fireUp(t.x, t.y, 6, 700 + d + k * 40);
        fx.glow(t.x, t.y, { color: '#ff8a2a', r: 34 * sz, delay: 760 + d, life: 420 });
        hitMark(t, 900 + d, '#ffb040', 22);
        fx.shock(t.x, t.y, { r0: 8, r1: 54 * sz, color: '#ffd8a0', w: 3, delay: 900 + d, life: 420 });
        fx.debris(t.x, t.y + 10, ['#ff8a2a', '#ffd040', '#ffffff'], all ? 6 : 10, 920 + d, 110);
      });
      fx.flashAt(110, '#fff0d0', 900);
      fx.hitStop(crit ? 300 : 240, 900, 2.0);
      // みかたの 回復と 攻撃力（みどりの 光と 金の やじるし）
      fx.glow(from.x, fy, { color: '#c8ffd8', r: 40, delay: 1100, life: 500 });
      fx.arrows(from.x, fy, '#ffd040', true, 3, 1150);
      return true;
    }
    // ───── ニューカワイイ・SMAP ─────
    case 'r66b_kawaii': {
      // ピンクの ハートと リボンの きらきら（みかた）
      for (const [i, t] of targets.entries()) {
        for (let k = 0; k < 4; k++) fx.add({ kind: 'r66bHeart', x: t.x + rnd(-14, 14), y: t.y + rnd(-4, 8), rise: rnd(30, 50), sway: 3, ph: rnd(0, 6), s: 0.9, color: k % 2 ? '#ff5aa8' : '#ffb0d8', life: 800, delay: i * 60 + k * 70 });
        fx.glow(t.x, t.y, { color: '#ffc8e8', r: 26, delay: 120 + i * 60, life: 460 });
        fx.arrows(t.x, t.y, '#ff8ac8', true, 3, 320 + i * 60);
      }
      return true;
    }
    case 'r66b_heart': {
      // ハートから ピンクの ビーム → 敵で ハートが はじける
      each((t, i, d) => {
        fx.add({ kind: 'r66bHeart', x: from.x, y: fy, s: 1.4, color: '#ff5aa8', life: 300, delay: d });
        for (let k = 0; k < 5; k++) {
          const u = (k + 1) / 6;
          fx.add({ kind: 'r66bHeart', x: from.x + (t.x - from.x) * u, y: fy + (t.y - fy) * u, s: 0.8, color: '#ffb0d8', life: 260, delay: 120 + d + k * 40 });
        }
        fx.add({ kind: 'r66bHeart', x: t.x, y: t.y, s: 2 * sz, color: '#ff3a8a', life: 360, delay: 340 + d });
        hitMark(t, 380 + d, '#ff8ac8', 18);
      });
      return true;
    }
    case 'r66b_five': {
      // 5色の 音ぷが みかたの 上を まわる（みかた）
      for (const [i, t] of targets.entries()) {
        FIVE.forEach((c, k) => fx.add({ kind: 'r66bNote', x: t.x, y: t.y - 6, orbit: 16, ph: (k * Math.PI * 2) / 5, rise: 20, s: 0.9, color: c, two: k % 2 === 1, life: 900, delay: i * 60 }));
        fx.glow(t.x, t.y, { color: '#fff2b0', r: 24, delay: 200 + i * 60, life: 460 });
        fx.arrows(t.x, t.y, '#ffd040', true, 3, 360 + i * 60);
      }
      return true;
    }
    // ───── 大御所 ─────
    case 'r66b_laugh': {
      // 敵の まわりで 音ぷと きらきらが ゆれる（笑いの うず）
      each((t, i, d) => {
        for (let k = 0; k < 4; k++) fx.add({ kind: 'r66bNote', x: t.x + rnd(-16, 16), y: t.y - rnd(0, 14), rise: 30, s: 0.9, color: k % 2 ? '#ffe07a' : '#ffffff', two: k % 2 === 0, life: 620, delay: d + k * 60 });
        fx.shock(t.x, t.y, { r0: 6, r1: 30 * sz, color: '#ffe07a', w: 2, sy: 0.6, delay: 200 + d, life: 360 });
        hitMark(t, 360 + d, '#ffe07a', 16);
      });
      return true;
    }
    case 'r66b_harisen': {
      // 大きな ハリセンが ふり下ろされて スパーン
      each((t, i, d) => {
        fx.add({ kind: 'r66bFan', x: t.x - 8, y: t.y + 18, s: 1.3 * sz, ang0: -1.7, ang1: 0.25, swing: 200, life: 420, delay: d });
        fx.speedLines(t.x, t.y, { delay: 240 + d, r1: 70 });
        hitMark(t, 300 + d, '#ffffff', 22);
        fx.add({ kind: 'r66bStar', x: t.x + 10, y: t.y - 14, r: 4, spin: 4, life: 420, delay: 320 + d });
      });
      fx.hitStop(crit ? 220 : 160, 300, 1.6);
      return true;
    }
    // ───── 五つ星シェフ ─────
    case 'r66b_dish': {
      // 銀の ふたが ひらいて、湯気と 金の 星（みかた）
      fx.add({ kind: 'r66bCloche', x: tx, y: Math.max(26, ty - 30), s: 1, open: 220, life: 760 });
      for (let k = 0; k < 3; k++) fx.puff(tx + (k - 1) * 6, Math.max(20, ty - 36), { color: '#ffffff', vy: -26, r0: 3, r1: 9, life: 600, alpha: 0.5, delay: 360 + k * 60 });
      for (const [i, t] of targets.entries()) {
        fx.add({ kind: 'r66bStar', x: t.x, y: t.y - 14, r: 4, rise: 20, life: 600, delay: 400 + i * 60 });
        fx.glow(t.x, t.y, { color: '#c8ffd8', r: 24, delay: 420 + i * 60, life: 420 });
      }
      return true;
    }
  }
  return false;
}
