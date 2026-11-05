// 第66回 E2班の 6つの 職業の 技の エフェクト（data/abilities-r66e2.js。docs/plan-r66-legend.md）
// 技の id では なく「えんしゅつの なまえ（anim）」で ひく。battlefx.js の play() で battlefx-r43j.js の つぎに よばれる
// （ここに ない anim なら false を かえす）。え は かんたんな かたち（ロゴ・顔・文字は かかない）
//
// 看板の技（なまえは '<職業の id>_sig'）
//  esports_king_sig   ワールドチャンピオンコンボ … 4色の ボタンが ひかり、敵 みんなに 4回ずつ 金の コンボの 光
//  game_god_sig       パーフェクトクリア … ドットの ブロックが ふり、金の 星が 光って 敵に 4回ずつ・さいごに 花火（みかたに 守りの やじるし）
//  gold_cardman_sig   楽天ゴールドカード！ … 金の カードが つぎつぎ とんで 敵を 切り、金貨が はねる
//  black_cardman_sig  楽天ブラックカード！ … 黒と 金の カードが うずを まいて 敵に ふりそそぎ、大きな 金の しょうげき
//  psychicer_sig      サイコキネシス・マックス … むらさきの 波が 敵を つつみ、うかせて（つぶが 上へ）地面に たたきつける
//  saiki_sig          やれやれ、本気の超能力 … 画面が くらく なり、ピンクと 緑の 光の わが 広がって、敵 みんなに 大きな 光の しょうげき
// ほかの 技
//  r66e2_combo   ボタンの 光が ぽんぽんと はじけて、小さな あたりが つづく（れんだ・コンボ）
//  r66e2_card    金の カードが くるくる 回って とび、ズバッと 切る
//  r66e2_psy     むらさきの 波が あいてに あつまって、ぎゅっと おしつぶす（念力）
//  r66e2_save    青い セーブの しるし（四角い ディスク）が うかんで、きらきら（みかた）
//  r66e2_load    まき もどしの わ（やじるしの 弧が ぎゃくに 回る）と、回復の 光（みかた）
//  r66e2_limiter ピンクの 光の わと 上へ のびる やじるし（制御装置を はずす。みかた。自分）
// ・どれも 2.2びょう いないで おわる。あたる じかんは R66E2_HIT（battle.js の HIT_DELAY に まぜる）
// ・みかたに つかう えんしゅつ（PARTY_ANIMS_R66E2）は、battle.js が がめんの 下の まん中に 出す

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t);
const fadeOut = (t, from = 0.7) => (t < from ? 1 : Math.max(0, 1 - (t - from) / (1 - from)));

export const R66E2_SIG_JOBS = ['esports_king', 'gold_cardman', 'psychicer', 'game_god', 'black_cardman', 'saiki'];
export const R66E2_SIGS = R66E2_SIG_JOBS.map((j) => `${j}_sig`);
export const R66E2_MOVES = ['r66e2_combo', 'r66e2_card', 'r66e2_psy', 'r66e2_save', 'r66e2_load', 'r66e2_limiter'];
export const R66E2_ANIMS = new Set([...R66E2_SIGS, ...R66E2_MOVES]);
// みかたに つかう えんしゅつ（敵が いない ときは がめんの 下に 大きく 出す）
export const PARTY_ANIMS_R66E2 = new Set(['r66e2_save', 'r66e2_load', 'r66e2_limiter']);
// あたる じかん（ms。ダメージの 数字を この ときに 出す）
export const R66E2_HIT = {
  esports_king_sig: 600, game_god_sig: 760, gold_cardman_sig: 520, black_cardman_sig: 640, psychicer_sig: 700, saiki_sig: 780,
  r66e2_combo: 260, r66e2_card: 360, r66e2_psy: 380,
};
// たたかいの 音（battle.js の ANIM_SFX に まぜる。audio.js・sfx-r26.js に ある 音）
export const R66E2_SFX = {
  esports_king_sig: 'smash', game_god_sig: 'sparkle', gold_cardman_sig: 'cardfly', black_cardman_sig: 'cardfly', psychicer_sig: 'void', saiki_sig: 'void',
  r66e2_combo: 'click', r66e2_card: 'card', r66e2_psy: 'void', r66e2_save: 'item', r66e2_load: 'warp', r66e2_limiter: 'kirari',
};

// ゲームの ボタンの 4色・お金の 金・念力の むらさき・さいきの ピンクと 緑
const PAD = ['#ff4a5a', '#4ac8ff', '#5ae86a', '#ffd040'];
const GOLD = ['#fff6c0', '#ffd84a', '#e0a81c'];
const PSY = ['#f0d0ff', '#c070ff', '#7a2ad8'];
const SAIKI = ['#ffd0e8', '#ff78b8', '#5ae8a0'];

function softGlow(x, cx, cy, r, col, a) {
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, col);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.globalAlpha = a;
  x.fillStyle = g;
  x.fillRect(cx - r, cy - r, r * 2, r * 2);
}

export const R66E2_FINE = {
  // くるくる 回る カード（x0,y0 → x1,y1。c: 色・edge: ふちの 色）
  r66e2Card(x, p, t) {
    const travel = p.travel || 300;
    const k = clamp01(p.age / travel);
    if (p.age > travel + 60) return;
    const e = easeOut(k);
    const cx = p.x0 + (p.x1 - p.x0) * e, cy = p.y0 + (p.y1 - p.y0) * e - Math.sin(k * Math.PI) * (p.hop || 0);
    const s = p.s || 1;
    x.save();
    x.translate(cx, cy);
    x.rotate(p.age / 45 + (p.rot || 0));
    x.globalAlpha = k >= 1 ? fadeOut(clamp01((p.age - travel) / 60), 0) : 1;
    x.fillStyle = p.edge || '#fff6c0';
    x.fillRect(-5.2 * s, -3.4 * s, 10.4 * s, 6.8 * s);
    x.fillStyle = p.c || '#e8b830';
    x.fillRect(-4.6 * s, -2.8 * s, 9.2 * s, 5.6 * s);
    // IC チップ（小さな 四角）と 線
    x.fillStyle = p.chip || '#fff0a0';
    x.fillRect(-3.4 * s, -1.4 * s, 2.4 * s, 1.8 * s);
    x.fillStyle = p.edge || '#fff6c0';
    x.fillRect(-3.4 * s, 1.4 * s, 6.6 * s, 0.6 * s);
    x.restore();
  },
  // ゲームの ボタン（まるい 光が ぽんと ふくらんで 消える）
  r66e2Button(x, p, t) {
    const a = fadeOut(t, 0.5);
    if (a <= 0) return;
    const r = (p.r || 4) * (0.5 + 0.8 * easeOut(clamp01(p.age / 160)));
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, p.x, p.y, r * 2.6, p.c || '#ffffff', a * 0.7);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a;
    x.fillStyle = p.c || '#ffffff';
    x.beginPath(); x.arc(p.x, p.y, r, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#ffffff';
    x.beginPath(); x.arc(p.x - r * 0.3, p.y - r * 0.3, r * 0.35, 0, Math.PI * 2); x.fill();
    x.restore();
  },
  // ドットの ブロック（上から おちて くる 四角）
  r66e2Pixel(x, p, t) {
    const a = fadeOut(t, 0.75);
    if (a <= 0) return;
    const y = p.y0 + (p.y1 - p.y0) * easeOut(clamp01(p.age / (p.travel || 400)));
    const s = p.s || 3;
    x.save();
    x.globalAlpha = a;
    x.fillStyle = p.c || '#ffd840';
    x.fillRect(Math.round(p.x - s), Math.round(y - s), Math.round(s * 2), Math.round(s * 2));
    x.fillStyle = 'rgba(255,255,255,0.7)';
    x.fillRect(Math.round(p.x - s), Math.round(y - s), Math.round(s), Math.max(1, Math.round(s * 0.5)));
    x.restore();
  },
  // セーブの しるし（四角い ディスク。青い 体・白い ラベル・銀の まど）
  r66e2Floppy(x, p, t) {
    const a = fadeOut(t, 0.7);
    if (a <= 0) return;
    const s = (p.s || 1) * (0.6 + 0.4 * easeOut(clamp01(p.age / 220)));
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y - p.age * 0.012);
    x.fillStyle = '#1e3c8a';
    x.fillRect(-6 * s, -6 * s, 12 * s, 12 * s);
    x.fillStyle = '#c8ccd8';
    x.fillRect(-3.4 * s, -6 * s, 6.8 * s, 4 * s);
    x.fillStyle = '#1e3c8a';
    x.fillRect(0.8 * s, -5.4 * s, 1.6 * s, 2.8 * s);
    x.fillStyle = '#f6f6fa';
    x.fillRect(-4.4 * s, 0.4 * s, 8.8 * s, 4.6 * s);
    x.restore();
  },
  // まき もどしの わ（やじるしの 弧が ぎゃくに 回る）
  r66e2Rewind(x, p, t) {
    const a = fadeOut(t, 0.6);
    if (a <= 0) return;
    const r = (p.r || 14) * (0.7 + 0.3 * easeOut(clamp01(p.age / 260)));
    const rot = -p.age / 130;
    x.save();
    x.globalAlpha = a;
    x.globalCompositeOperation = 'lighter';
    x.strokeStyle = p.c || '#9af0ff';
    x.lineWidth = 2.2;
    for (let i = 0; i < 2; i++) {
      const a0 = rot + i * Math.PI;
      x.beginPath(); x.arc(p.x, p.y, r, a0, a0 + Math.PI * 0.7); x.stroke();
      // やじるしの さき（ぎゃく まわり）
      const hx = p.x + Math.cos(a0) * r, hy = p.y + Math.sin(a0) * r;
      const tx = Math.sin(a0), ty = -Math.cos(a0);
      x.fillStyle = p.c || '#9af0ff';
      x.beginPath();
      x.moveTo(hx + tx * 4, hy + ty * 4);
      x.lineTo(hx + Math.cos(a0) * 3, hy + Math.sin(a0) * 3);
      x.lineTo(hx - Math.cos(a0) * 3, hy - Math.sin(a0) * 3);
      x.closePath();
      x.fill();
    }
    x.restore();
  },
  // あつまる 波（大きな わが 小さく なって 中に あつまる。念力）
  r66e2Wave(x, p, t) {
    const a = fadeOut(t, 0.55);
    if (a <= 0) return;
    const k = easeOut(clamp01(p.age / (p.travel || 300)));
    const r = (p.r0 || 30) + ((p.r1 ?? 4) - (p.r0 || 30)) * k;
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = a * 0.9;
    x.strokeStyle = p.c || '#c070ff';
    x.lineWidth = p.w || 1.8;
    x.beginPath(); x.ellipse(p.x, p.y, Math.max(1, r), Math.max(1, r * (p.sy || 0.8)), 0, 0, Math.PI * 2); x.stroke();
    x.restore();
  },
};

// ───────────── エフェクト ─────────────
// fx: Effects（battlefx.js）  targets: [{ x, y }]  W・H: がめんの 大きさ
export function playR66e2Fx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  if (!R66E2_ANIMS.has(anim) || !targets || !targets.length) return false;
  if (targets.some((t) => !Number.isFinite(t.x) || !Number.isFinite(t.y))) return false;
  const crit = !!opts.crit;
  const all = targets.length > 1;
  const sz = all ? 0.85 : 1;
  const from = opts.from || { x: W / 2, y: H + 6 };
  const fy = Math.min(H - 16, from.y - 18);
  const each = (fn) => targets.forEach((t, i) => fn(t, i, i * (all ? 50 : 0)));
  const hitMark = (t, d, col, r = 16) => {
    fx.impact(t.x, t.y, { r: (crit ? r + 6 : r) * sz, color: '#ffffff', delay: d });
    fx.sparks(t.x, t.y, { colors: ['#ffffff', col], n: all ? 8 : 12, speed: 150, delay: d, life: 320, len: 7 });
  };
  const cardsTo = (t, d, k, col, edge) => {
    fx.add({ kind: 'r66e2Card', x0: from.x + rnd(-10, 10), y0: fy, x1: t.x, y1: t.y, hop: 16 + k * 4, travel: 300, s: 1.2, c: col, edge, life: 380, delay: d, rot: k });
  };
  const coins = (t, d) => {
    for (let k = 0; k < 4; k++) fx.twinkle(t.x + rnd(-10, 10), t.y - 8, { color: GOLD[k % 3], size: 4, delay: d + k * 40, life: 420, vy: -40, g: 120 });
  };
  switch (anim) {
    // ───── 看板の技 ─────
    case 'esports_king_sig': {
      fx.tintAt('rgba(8, 10, 30, 0.45)', 1500);
      // 4色の ボタンが 手もとで ひかる
      PAD.forEach((c, k) => fx.add({ kind: 'r66e2Button', x: from.x + (k - 1.5) * 12, y: fy - 6 - (k % 2) * 6, r: 4, c, life: 500, delay: k * 60 }));
      // 敵 みんなに 4回ずつ（金の コンボの 光）
      for (let r = 0; r < 4; r++) {
        each((t, i) => {
          const d = 300 + r * 110 + i * 40;
          fx.add({ kind: 'r66e2Button', x: t.x + rnd(-8, 8), y: t.y + rnd(-10, 6), r: 3.4, c: PAD[(r + i) % 4], life: 320, delay: d });
          hitMark(t, d, GOLD[1], 12 + r * 2);
        });
      }
      each((t, i, d) => fx.shock(t.x, t.y, { r0: 6, r1: 44 * sz, color: GOLD[1], w: 2.4, delay: 780 + d, life: 360 }));
      fx.flashAt(90, '#fff6d0', 780);
      fx.hitStop(crit ? 260 : 190, 780, 1.6);
      return true;
    }
    case 'game_god_sig': {
      fx.tintAt('rgba(10, 8, 30, 0.5)', 2000);
      // ドットの ブロックが ふる
      for (let k = 0; k < 18; k++) {
        const px = rnd(10, W - 10);
        fx.add({ kind: 'r66e2Pixel', x: px, y0: -8, y1: rnd(H * 0.2, H * 0.6), s: rnd(2, 3.5), c: [...PAD, '#ffffff'][k % 5], travel: 420, life: 900, delay: k * 30 });
      }
      // 金の 星が 光って 敵に 4回ずつ
      for (let r = 0; r < 4; r++) {
        each((t, i) => {
          const d = 420 + r * 120 + i * 40;
          fx.twinkle(t.x + rnd(-8, 8), t.y + rnd(-12, 4), { color: GOLD[r % 3], size: 7, delay: d, life: 300, spin: 4 });
          hitMark(t, d, GOLD[1], 14);
          fx.debris(t.x, t.y, PAD, all ? 3 : 5, d, 70);
        });
      }
      // さいごに 花火（クリア！）
      each((t, i, d) => {
        fx.shock(t.x, t.y, { r0: 8, r1: 56 * sz, color: '#fff6b0', w: 3, delay: 1000 + d, life: 420 });
        fx.burst(t.x, t.y - 20, [...GOLD, ...PAD], all ? 10 : 18, 110, { delay: 1060 + d });
      });
      fx.flashAt(110, '#fff6d0', 1000);
      fx.hitStop(crit ? 300 : 230, 1000, 2.0);
      return true;
    }
    case 'gold_cardman_sig': {
      fx.tintAt('rgba(40, 24, 0, 0.35)', 1300);
      fx.glow(from.x, fy, { color: GOLD[1], r: 30, life: 500 });
      for (let k = 0; k < 6; k++) {
        const t = targets[k % targets.length];
        cardsTo(t, 120 + k * 70, k, '#e8b830', '#fff6c0');
        hitMark(t, 420 + k * 70, GOLD[1], 14);
      }
      each((t, i, d) => coins(t, 700 + d));
      fx.flashAt(80, '#fff0b0', 520);
      fx.hitStop(crit ? 220 : 150, 520, 1.5);
      return true;
    }
    case 'black_cardman_sig': {
      fx.tintAt('rgba(6, 4, 10, 0.55)', 1600);
      // 黒と 金の カードが うずを まく
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2;
        fx.add({ kind: 'r66e2Card', x0: from.x + Math.cos(a) * 30, y0: fy - 20 + Math.sin(a) * 14, x1: from.x + Math.cos(a + 2) * 18, y1: fy - 30 + Math.sin(a + 2) * 8, hop: 0, travel: 300, s: 1.1, c: '#26222e', edge: '#e0a81c', chip: '#ffd84a', life: 340, delay: k * 25 });
      }
      for (let k = 0; k < 8; k++) {
        const t = targets[k % targets.length];
        fx.add({ kind: 'r66e2Card', x0: from.x + rnd(-24, 24), y0: fy - 30, x1: t.x, y1: t.y, hop: 10, travel: 260, s: 1.3, c: '#26222e', edge: '#e0a81c', chip: '#ffd84a', life: 320, delay: 360 + k * 40 });
        hitMark(t, 620 + k * 40, GOLD[1], 14);
      }
      each((t, i, d) => {
        fx.shock(t.x, t.y, { r0: 8, r1: 54 * sz, color: GOLD[1], w: 3, delay: 940 + d, life: 420 });
        coins(t, 980 + d);
      });
      fx.flashAt(100, '#ffe8a0', 940);
      fx.hitStop(crit ? 280 : 210, 940, 1.9);
      return true;
    }
    case 'psychicer_sig': {
      fx.tintAt('rgba(30, 6, 50, 0.45)', 1600);
      each((t, i, d) => {
        // むらさきの 波が つつむ → うかせる → たたきつける
        for (let k = 0; k < 3; k++) fx.add({ kind: 'r66e2Wave', x: t.x, y: t.y, r0: 40, r1: 8, c: PSY[k % 3], travel: 320, life: 420, delay: d + k * 90 });
        for (let k = 0; k < 6; k++) fx.puff(t.x + rnd(-12, 12), t.y + 10, { color: PSY[0], vy: -60, r0: 2, r1: 6, life: 500, alpha: 0.6, delay: 300 + d + k * 30 });
        fx.shock(t.x, t.y + 10, { r0: 8, r1: 52 * sz, color: PSY[1], w: 3, sy: 0.4, delay: 700 + d, life: 380 });
        fx.debris(t.x, t.y + 12, ['#c8b0e0', '#ffffff', PSY[1]], all ? 5 : 9, 720 + d, 100);
        hitMark(t, 700 + d, PSY[1], 20);
      });
      fx.flashAt(90, '#f0d8ff', 700);
      fx.hitStop(crit ? 260 : 200, 700, 1.8);
      return true;
    }
    case 'saiki_sig': {
      fx.tintAt('rgba(6, 4, 16, 0.6)', 1900);
      // めがねの きらり → ピンクと 緑の 光の わ
      fx.twinkle(from.x - 4, fy - 10, { color: SAIKI[2], size: 8, life: 400 });
      fx.twinkle(from.x + 4, fy - 10, { color: SAIKI[2], size: 8, life: 400, delay: 40 });
      for (let k = 0; k < 4; k++) fx.shock(W / 2, H * 0.45, { r0: 6, r1: 150, color: SAIKI[k % 3], w: 2, delay: 240 + k * 110, life: 520 });
      each((t, i, d) => {
        for (let k = 0; k < 2; k++) fx.add({ kind: 'r66e2Wave', x: t.x, y: t.y, r0: 46, r1: 6, c: SAIKI[k], travel: 360, life: 460, delay: 380 + d + k * 100 });
        fx.glow(t.x, t.y, { color: SAIKI[1], r: 34 * sz, delay: 760 + d, life: 420 });
        fx.shock(t.x, t.y, { r0: 8, r1: 60 * sz, color: '#ffffff', w: 3, delay: 780 + d, life: 420 });
        hitMark(t, 780 + d, SAIKI[1], 22);
      });
      fx.flashAt(120, '#ffe0f0', 780);
      fx.hitStop(crit ? 300 : 240, 780, 2.0);
      return true;
    }
    // ───── ほかの 技 ─────
    case 'r66e2_combo': {
      each((t, i, d) => {
        for (let k = 0; k < 6; k++) {
          const dd = d + k * 45;
          fx.add({ kind: 'r66e2Button', x: t.x + rnd(-10, 10), y: t.y + rnd(-12, 6), r: 3, c: PAD[k % 4], life: 260, delay: dd });
          fx.impact(t.x + rnd(-6, 6), t.y + rnd(-6, 6), { r: 9 * sz, color: '#ffffff', delay: dd + 20 });
        }
      });
      fx.hitStop(crit ? 160 : 90, 260, 1.2);
      return true;
    }
    case 'r66e2_card': {
      each((t, i, d) => {
        cardsTo(t, d, i, '#e8b830', '#fff6c0');
        hitMark(t, 320 + d, GOLD[1], 14);
        coins(t, 360 + d);
      });
      return true;
    }
    case 'r66e2_psy': {
      each((t, i, d) => {
        for (let k = 0; k < 3; k++) fx.add({ kind: 'r66e2Wave', x: t.x, y: t.y, r0: 34, r1: 6, c: PSY[k], travel: 280, life: 360, delay: d + k * 50 });
        fx.glow(t.x, t.y, { color: PSY[1], r: 20 * sz, delay: 360 + d, life: 260 });
        hitMark(t, 380 + d, PSY[1], 16);
      });
      return true;
    }
    case 'r66e2_save': {
      for (const [i, t] of targets.entries()) {
        fx.add({ kind: 'r66e2Floppy', x: t.x, y: t.y - 18, s: 1.1, life: 900, delay: i * 60 });
        fx.glow(t.x, t.y, { color: '#c8e8ff', r: 22, delay: 220 + i * 60, life: 420 });
        for (let k = 0; k < 4; k++) fx.twinkle(t.x + rnd(-12, 12), t.y + rnd(-12, 8), { color: '#ffffff', size: 4, delay: 260 + i * 60 + k * 40, life: 320 });
      }
      return true;
    }
    case 'r66e2_load': {
      for (const [i, t] of targets.entries()) {
        fx.add({ kind: 'r66e2Rewind', x: t.x, y: t.y - 4, r: 16, c: '#9af0ff', life: 800, delay: i * 50 });
        fx.glow(t.x, t.y, { color: '#c8ffd8', r: 26, delay: 300 + i * 50, life: 460 });
        for (let k = 0; k < 4; k++) fx.twinkle(t.x + rnd(-12, 12), t.y + rnd(-14, 8), { color: '#e8fff0', size: 4, delay: 360 + i * 50 + k * 40, life: 320 });
      }
      return true;
    }
    case 'r66e2_limiter': {
      for (const t of targets) {
        fx.twinkle(t.x - 5, t.y - 24, { color: SAIKI[1], size: 6, life: 360 });
        fx.twinkle(t.x + 5, t.y - 24, { color: SAIKI[1], size: 6, life: 360, delay: 40 });
        fx.shock(t.x, t.y, { r0: 6, r1: 36, color: SAIKI[1], w: 2, delay: 200, life: 380 });
        fx.arrows(t.x, t.y, SAIKI[0], true, 3, 260);
      }
      return true;
    }
  }
  return false;
}
