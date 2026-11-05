// 第66回 E1班の 技の エフェクト（公安ゼロ・トリプルフェイス・ハイパーレスキュー・火消しの神・登録者1000万人・世界一の配信者）
// 技の id では なく「えんしゅつの なまえ（anim）」で ひく。技の データの anim に ここの なまえを 書く（例 anim: 'triple_face_sig'）。
// battlefx.js の play() で battlefx-r43j.js の つぎに よばれる（ここに ない anim なら false を かえす）。
// え は かんたんな かたち（顔・ロゴ・文字は かかない）。自分や 仲間に かける 技は 前から ある えんしゅつ（buff・guard・heal2 など）なので、ここは 敵に 出す 物だけ
//
// 看板の技（なまえは '<職業の id>_sig'）
//  koan_zero_sig      ゼロの正義ラッシュ … 画面が こい あいいろに → 敵ごとに こぶしの しょうげきが 3回ずつ・さいごに 光の 十字
//  triple_face_sig    トリプル・ジャスティス … 3色（こん・黒・金）の 仮面の かげが 回り、敵ごとに 3回の 連打 → 金の 大きな しょうげき
//  hyper_rescue_sig   ハイパーウォーターキャノン … 下から 太い 水の ビームが 敵へ・大きな しぶき（仲間には 水しぶきの きらきら）
//  hikeshi_god_sig    天の川大放水 … 画面が 夜空に → 星の 川が 上から 流れ落ちて 敵を のみこむ・赤い まといの しるし
//  top_streamer_sig   同時接続1000万人 … コメントの ふきだしと ハートが 画面中を 流れ、敵に 光が ふる
//  world_streamer_sig コメントの大嵐 … 画面が 金色に → ふきだし・ハート・地球の まるが うずを まいて 敵を つつむ
// ほかの 技
//  r66e1_jab       ジャブ … 小さな こぶしの しょうげきが すばやく 3〜4回
//  r66e1_disguise  変そう … 白い けむりが ぽんと 出て、仮面の かげが 敵の 上を 回る・虫めがねの わ
//  r66e1_car       スポーツカー … 白い 車の かげが 左から 右へ 走りぬける（スピードの 線）
//  r66e1_comment   コメント … 白い ふきだしが 右から 左へ 流れて 敵に ぶつかる
//  r66e1_wave      大水 … 水の 大波が 横から 敵を おし流す（しぶき）
// ・どれも 2.2びょう いないで おわる。あたる じかんは R66E1_HIT（battle.js の HIT_DELAY に まぜる）

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t);

export const R66E1_SIG_JOBS = ['koan_zero', 'triple_face', 'hyper_rescue', 'hikeshi_god', 'top_streamer', 'world_streamer'];
export const R66E1_SIGS = R66E1_SIG_JOBS.map((j) => `${j}_sig`);
export const R66E1_MOVES = ['r66e1_jab', 'r66e1_disguise', 'r66e1_car', 'r66e1_comment', 'r66e1_wave'];
export const R66E1_ANIMS = new Set([...R66E1_SIGS, ...R66E1_MOVES]);
// あたる じかん（ms。ダメージの 数字を この ときに 出す）
export const R66E1_HIT = {
  koan_zero_sig: 520, triple_face_sig: 760, hyper_rescue_sig: 560, hikeshi_god_sig: 820, top_streamer_sig: 640, world_streamer_sig: 820,
  r66e1_jab: 200, r66e1_disguise: 380, r66e1_car: 420, r66e1_comment: 420, r66e1_wave: 460,
};
// たたかいの 音（battle.js の ANIM_SFX に まぜる。audio.js・sfx-r26.js に ある 音）
export const R66E1_SFX = {
  koan_zero_sig: 'smash', triple_face_sig: 'smash', hyper_rescue_sig: 'splash', hikeshi_god_sig: 'splash', top_streamer_sig: 'sparkle', world_streamer_sig: 'sparkle',
  r66e1_jab: 'hit', r66e1_disguise: 'pu', r66e1_car: 'train', r66e1_comment: 'pon', r66e1_wave: 'splash',
};

// ───────────── え の ぶひん ─────────────
function roundRect(x, cx, cy, w, h, r) {
  x.beginPath();
  x.moveTo(cx - w / 2 + r, cy - h / 2);
  x.lineTo(cx + w / 2 - r, cy - h / 2);
  x.quadraticCurveTo(cx + w / 2, cy - h / 2, cx + w / 2, cy - h / 2 + r);
  x.lineTo(cx + w / 2, cy + h / 2 - r);
  x.quadraticCurveTo(cx + w / 2, cy + h / 2, cx + w / 2 - r, cy + h / 2);
  x.lineTo(cx - w / 2 + r, cy + h / 2);
  x.quadraticCurveTo(cx - w / 2, cy + h / 2, cx - w / 2, cy + h / 2 - r);
  x.lineTo(cx - w / 2, cy - h / 2 + r);
  x.quadraticCurveTo(cx - w / 2, cy - h / 2, cx - w / 2 + r, cy - h / 2);
  x.closePath();
}
const lerpAt = (p) => {
  const k = easeOut(clamp01(p.age / (p.travel || p.life)));
  return [p.x0 + (p.x1 - p.x0) * k, p.y0 + (p.y1 - p.y0) * k];
};

export const R66E1_FINE = {
  // コメントの ふきだし（白い 角まるの 四角に 色の 線 2本。しっぽ つき）
  e66Bubble(x, p, t) {
    const [cx, cy] = lerpAt(p);
    const s = p.s || 1, w = 22 * s, h = 10 * s;
    x.save();
    x.globalAlpha = Math.max(0, 1 - Math.max(0, t - 0.75) * 4);
    x.fillStyle = '#ffffff';
    roundRect(x, cx, cy, w, h, 3 * s);
    x.fill();
    x.beginPath();
    x.moveTo(cx - w * 0.2, cy + h / 2 - 0.5);
    x.lineTo(cx - w * 0.32, cy + h / 2 + 4 * s);
    x.lineTo(cx - w * 0.05, cy + h / 2 - 0.5);
    x.fill();
    x.strokeStyle = p.color || '#ff48d8';
    x.lineWidth = 1.2 * s;
    x.beginPath();
    x.moveTo(cx - w * 0.35, cy - h * 0.15); x.lineTo(cx + w * 0.3, cy - h * 0.15);
    x.moveTo(cx - w * 0.35, cy + h * 0.18); x.lineTo(cx + w * 0.1, cy + h * 0.18);
    x.stroke();
    x.restore();
  },
  // 白い スポーツカーの かげ（ひくい 車体・まるい 2つの タイヤ・赤い テールランプ）
  e66Car(x, p, t) {
    const [cx, cy] = lerpAt(p);
    const s = p.s || 1, dir = p.x1 >= p.x0 ? 1 : -1;
    x.save();
    x.globalAlpha = Math.max(0, 1 - Math.max(0, t - 0.8) * 5);
    x.translate(cx, cy);
    x.scale(dir * s, s);
    x.fillStyle = p.color || '#f4f4f8';
    x.beginPath();
    x.moveTo(-18, 2); x.lineTo(-17, -4); x.lineTo(-6, -6); x.lineTo(0, -11); x.lineTo(9, -11); x.lineTo(16, -5); x.lineTo(19, -3); x.lineTo(19, 2);
    x.closePath();
    x.fill();
    x.fillStyle = '#3a4a6a';
    x.beginPath(); x.moveTo(1, -10); x.lineTo(8, -10); x.lineTo(13, -5); x.lineTo(-3, -5); x.closePath(); x.fill();
    x.fillStyle = '#1a1a22';
    for (const wx of [-11, 12]) { x.beginPath(); x.arc(wx, 2, 3.6, 0, Math.PI * 2); x.fill(); }
    x.fillStyle = '#ff3a3a';
    x.fillRect(-18.5, -3, 2, 2);
    x.restore();
  },
  // 仮面の かげ（目の あいた アイマスクの 形。col の 色。くるっと 回る）
  e66Mask(x, p, t) {
    const k = p.age / (p.life || 600);
    const a = (p.a0 || 0) + k * (p.spin || 4);
    const cx = p.x + Math.cos(a) * (p.r || 14), cy = p.y + Math.sin(a) * (p.r || 14) * 0.4;
    const s = p.s || 1;
    x.save();
    x.globalAlpha = Math.max(0, 1 - Math.max(0, t - 0.7) * 3.3);
    x.translate(cx, cy);
    x.scale(s, s);
    x.fillStyle = p.color || '#2a2e3e';
    x.beginPath();
    x.ellipse(0, 0, 9, 4.5, 0, 0, Math.PI * 2);
    x.fill();
    // 目の あなは 白く ひかる（下の 絵を けさない）
    x.fillStyle = '#f4f6ff';
    for (const ex of [-4, 4]) { x.beginPath(); x.ellipse(ex, -0.5, 2.4, 1.5, 0, 0, Math.PI * 2); x.fill(); }
    x.restore();
  },
  // 水の 大波（はばの ある 青い 弧が 横に すすむ。上に 白い あわ）
  e66Wave(x, p, t) {
    const k = easeOut(clamp01(p.age / (p.travel || p.life)));
    const cx = p.x0 + (p.x1 - p.x0) * k;
    const h = (p.h || 30) * (0.6 + 0.4 * Math.sin(Math.min(1, k * 1.2) * Math.PI));
    const w = p.w || 46, dir = p.x1 >= p.x0 ? 1 : -1;
    x.save();
    x.globalAlpha = Math.max(0, 1 - Math.max(0, t - 0.75) * 4);
    x.fillStyle = p.color || '#3a8ae8';
    x.beginPath();
    x.moveTo(cx - (w / 2) * dir, p.y);
    x.quadraticCurveTo(cx - (w / 4) * dir, p.y - h * 1.1, cx + (w / 2) * dir, p.y - h);
    x.quadraticCurveTo(cx + (w / 3) * dir, p.y - h * 0.4, cx + (w / 2) * dir, p.y);
    x.closePath();
    x.fill();
    x.strokeStyle = '#eaf6ff';
    x.lineWidth = 2;
    x.beginPath();
    x.moveTo(cx - (w / 4) * dir, p.y - h * 0.85);
    x.quadraticCurveTo(cx + (w / 6) * dir, p.y - h * 1.15, cx + (w / 2) * dir, p.y - h);
    x.stroke();
    x.restore();
  },
  // 太い 水の ビーム（from → to。ゆらゆら ふるえる）
  e66Beam(x, p, t) {
    const grow = clamp01(p.age / 160);
    const fade = Math.max(0, 1 - Math.max(0, t - 0.7) * 3.3);
    const ex = p.x0 + (p.x1 - p.x0) * grow, ey = p.y0 + (p.y1 - p.y0) * grow;
    x.save();
    x.globalAlpha = fade;
    x.lineCap = 'round';
    x.strokeStyle = p.color || '#3a8ae8';
    x.lineWidth = (p.w || 9) + Math.sin(p.age / 30) * 1.5;
    x.beginPath(); x.moveTo(p.x0, p.y0); x.lineTo(ex, ey); x.stroke();
    x.strokeStyle = '#eaf6ff';
    x.lineWidth = (p.w || 9) * 0.35;
    x.beginPath(); x.moveTo(p.x0, p.y0); x.lineTo(ex, ey); x.stroke();
    x.restore();
  },
  // 星の 川（上から 下へ 流れる、星を ちりばめた 青い 帯）
  e66River(x, p, t) {
    const k = clamp01(p.age / (p.travel || 500));
    const y1 = p.y0 + (p.y1 - p.y0) * easeOut(k);
    x.save();
    x.globalAlpha = Math.max(0, 1 - Math.max(0, t - 0.7) * 3.3) * 0.85;
    const g = x.createLinearGradient(p.x - p.w / 2, 0, p.x + p.w / 2, 0);
    g.addColorStop(0, 'rgba(58,138,232,0)');
    g.addColorStop(0.3, '#3a8ae8');
    g.addColorStop(0.5, '#cfeaff');
    g.addColorStop(0.7, '#3a8ae8');
    g.addColorStop(1, 'rgba(58,138,232,0)');
    x.fillStyle = g;
    x.fillRect(p.x - p.w / 2, p.y0, p.w, y1 - p.y0);
    x.fillStyle = '#fff6c0';
    for (let i = 0; i < 10; i++) {
      const sy = p.y0 + ((i * 17 + p.age * 0.12) % Math.max(1, y1 - p.y0));
      const sx = p.x + Math.sin(i * 2.3) * p.w * 0.3;
      x.fillRect(sx - 0.8, sy - 0.8, 1.6, 1.6);
    }
    x.restore();
  },
};

export function playR66e1Fx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  if (!R66E1_ANIMS.has(anim) || !targets || !targets.length) return false;
  const crit = !!opts.crit;
  const all = targets.length > 1;
  const sz = all ? 0.85 : 1;
  const from = opts.from || { x: W / 2, y: H + 6 };
  const each = (fn) => targets.forEach((t, i) => fn(t, i, i * (all ? 50 : 0)));
  const punch = (t, d, col = '#ffffff', r = 12) => {
    fx.impact(t.x + rnd(-6, 6), t.y + rnd(-6, 4), { r: (crit ? r + 5 : r) * sz, color: col, delay: d });
    fx.sparks(t.x, t.y, { colors: ['#ffffff', col], n: all ? 5 : 8, speed: 130, delay: d, life: 260, len: 6 });
  };
  const splash = (t, d) => {
    for (let k = 0; k < (all ? 5 : 8); k++) fx.drop(t.x + rnd(-6, 6), t.y - 4, { color: k % 2 ? '#9ad8ff' : '#3a8ae8', vx: rnd(-70, 70), vy: rnd(-120, -50), g: 320, size: 1.6, delay: d, life: 520 });
    fx.shock(t.x, t.y + 6, { r0: 4, r1: 26 * sz, color: '#9ad8ff', w: 2, delay: d, life: 360, sy: 0.4 });
  };
  const COM = ['#ff48d8', '#38e8ff', '#ffd23a', '#7aff7a'];
  switch (anim) {
    // ───── 看板の技 ─────
    case 'koan_zero_sig': {
      fx.tintAt('rgba(10, 16, 40, 0.4)', 1300);
      for (let r = 0; r < 3; r++) each((t, i, d) => punch(t, 160 + r * 150 + d, '#bcd4ff', 13));
      each((t, i, d) => {
        fx.cut(t.x, t.y, { ang: 0, len: 40 * sz, w: 2.5, color: '#ffffff', glow: '#7aa8ff', delay: 640 + d, life: 320 });
        fx.cut(t.x, t.y, { ang: Math.PI / 2, len: 40 * sz, w: 2.5, color: '#ffffff', glow: '#7aa8ff', delay: 640 + d, life: 320 });
      });
      fx.flashAt(90, '#dbe8ff', 640);
      fx.hitStop(crit ? 220 : 160, 520, 1.5);
      return true;
    }
    case 'triple_face_sig': {
      fx.tintAt('rgba(8, 10, 24, 0.5)', 1800);
      const cols = ['#1e2848', '#16161e', '#d0a838'];
      each((t, i, d) => cols.forEach((c, k) => fx.add({ kind: 'e66Mask', x: t.x, y: t.y - 22, r: 16, a0: (k * Math.PI * 2) / 3, spin: 5, s: 1.1, color: c, life: 700, delay: d })));
      for (let r = 0; r < 3; r++) each((t, i, d) => punch(t, 760 + r * 160 + d, cols[r] === '#16161e' ? '#a8a8c8' : cols[r] === '#1e2848' ? '#7aa8ff' : '#ffd66b', 14));
      each((t, i, d) => fx.shock(t.x, t.y, { r0: 6, r1: 52 * sz, color: '#ffd66b', w: 3, delay: 1300 + d, life: 420 }));
      fx.flashAt(110, '#fff2c8', 1300);
      fx.hitStop(crit ? 300 : 240, 760, 2.0);
      return true;
    }
    case 'hyper_rescue_sig': {
      const fy = Math.min(H - 10, from.y - 14);
      each((t, i, d) => {
        fx.add({ kind: 'e66Beam', x0: from.x, y0: fy, x1: t.x, y1: t.y, w: 10, color: '#3a8ae8', life: 900, delay: d });
        splash(t, 560 + d);
        splash(t, 820 + d);
      });
      for (let k = 0; k < 10; k++) fx.twinkle(rnd(16, W - 16), rnd(H * 0.55, H - 8), { color: '#cfeaff', size: rnd(2, 4), delay: 600 + k * 40, life: 360 });
      fx.hitStop(crit ? 220 : 160, 560, 1.4);
      return true;
    }
    case 'hikeshi_god_sig': {
      fx.tintAt('rgba(4, 8, 36, 0.55)', 2000);
      for (let k = 0; k < 14; k++) fx.twinkle(rnd(8, W - 8), rnd(4, H * 0.45), { color: '#fff6c0', size: rnd(2, 4), delay: k * 30, life: 500 });
      each((t, i, d) => {
        fx.add({ kind: 'e66River', x: t.x, y0: 0, y1: t.y + 8, w: 34 * sz, travel: 520, life: 1200, delay: 200 + d });
        splash(t, 820 + d);
        splash(t, 1100 + d);
      });
      fx.pillar(from.x, Math.min(H - 6, from.y - 10), '#d8202c', { w: 4, h: 34, delay: 0, life: 700, edge: '#ffd66b' });
      fx.flashAt(100, '#dff0ff', 820);
      fx.hitStop(crit ? 280 : 220, 820, 1.8);
      return true;
    }
    case 'top_streamer_sig': {
      fx.tintAt('rgba(30, 6, 30, 0.35)', 1500);
      for (let k = 0; k < 10; k++) {
        const y = rnd(10, H * 0.7);
        fx.add({ kind: 'e66Bubble', x0: W + 20, y0: y, x1: -20, y1: y, travel: 900, life: 900, s: rnd(0.8, 1.1), color: COM[k % COM.length], delay: k * 60 });
      }
      each((t, i, d) => {
        for (let k = 0; k < 4; k++) { const hx = from.x + rnd(-30, 30); fx.add({ kind: 'heart', x: hx, y: H, x0: hx, y0: H, x1: t.x + rnd(-8, 8), y1: t.y, travel: 420, life: 460, color: k % 2 ? '#ff7ab8' : '#ff48d8', size: 3, delay: 200 + k * 60 + d }); }
        fx.glow(t.x, t.y, { color: '#ffe0f4', r: 22 * sz, delay: 640 + d, life: 360 });
        punch(t, 640 + d, '#ff7ab8', 15);
      });
      fx.flashAt(90, '#fff0fa', 640);
      return true;
    }
    case 'world_streamer_sig': {
      fx.tintAt('rgba(40, 28, 0, 0.4)', 2000);
      for (let k = 0; k < 16; k++) {
        const y = rnd(8, H * 0.8), ltr = k % 2;
        fx.add({ kind: 'e66Bubble', x0: ltr ? -20 : W + 20, y0: y, x1: ltr ? W + 20 : -20, y1: y + rnd(-10, 10), travel: 1000, life: 1000, s: rnd(0.8, 1.2), color: COM[k % COM.length], delay: k * 45 });
      }
      each((t, i, d) => {
        fx.swirl(t.x, t.y, ['#ffd23a', '#ffffff', '#ff48d8', '#38e8ff'], { n: 28, rad: 22 * sz, h: 46, delay: 300 + d, life: 800 });
        for (let k = 0; k < 3; k++) { const hx = t.x + rnd(-40, 40); fx.add({ kind: 'heart', x: hx, y: -10, x0: hx, y0: -10, x1: t.x, y1: t.y, travel: 480, life: 520, color: '#ff48d8', size: 3, delay: 360 + k * 80 + d }); }
        fx.shock(t.x, t.y, { r0: 6, r1: 56 * sz, color: '#ffd23a', w: 3, delay: 820 + d, life: 420 });
        punch(t, 820 + d, '#ffd23a', 16);
      });
      fx.flashAt(110, '#fff6d0', 820);
      fx.hitStop(crit ? 300 : 240, 820, 2.0);
      return true;
    }
    // ───── ほかの 技 ─────
    case 'r66e1_jab': {
      for (let r = 0; r < 4; r++) each((t, i, d) => punch(t, 60 + r * 90 + d, '#bcd4ff', 9));
      fx.hitStop(crit ? 160 : 90, 200, 1.0);
      return true;
    }
    case 'r66e1_disguise': {
      each((t, i, d) => {
        fx.puff(t.x, t.y - 6, { color: '#eef0f6', r0: 4, r1: 18 * sz, life: 420, alpha: 0.8, delay: d });
        fx.add({ kind: 'e66Mask', x: t.x, y: t.y - 20, r: 12, spin: 4, s: 1, color: '#2a2e3e', life: 700, delay: 120 + d });
        fx.ring(t.x, t.y, '#ffd66b', 2, 380 + d, 360, 22);
      });
      return true;
    }
    case 'r66e1_car': {
      const y = Math.min(H - 14, targets.reduce((s, t) => s + t.y, 0) / targets.length + 10);
      fx.add({ kind: 'e66Car', x0: -30, y0: y, x1: W + 30, y1: y, travel: 760, life: 760, s: 1.3 });
      fx.speedLines(W / 2, y - 6, { color: '#ffffff', n: 14, delay: 200, life: 320, r0: 30, r1: 120 });
      each((t, i, d) => punch(t, 420 + d, '#ffffff', 13));
      fx.hitStop(crit ? 180 : 120, 420, 1.2);
      return true;
    }
    case 'r66e1_comment': {
      each((t, i, d) => {
        for (let k = 0; k < 4; k++) fx.add({ kind: 'e66Bubble', x0: W + 20, y0: t.y - 20 + k * 9, x1: t.x, y1: t.y - 8 + k * 4, travel: 380, life: 460, s: 0.9, color: COM[k % COM.length], delay: k * 40 + d });
        punch(t, 420 + d, '#ff7ab8', 11);
      });
      return true;
    }
    case 'r66e1_wave': {
      const y = Math.min(H - 6, Math.max(...targets.map((t) => t.y)) + 14);
      fx.add({ kind: 'e66Wave', x0: -30, y: y, x1: W + 30, h: 34, w: 60, travel: 900, life: 900, color: '#3a8ae8' });
      each((t, i, d) => splash(t, 460 + d));
      fx.hitStop(crit ? 180 : 120, 460, 1.2);
      return true;
    }
  }
  return false;
}
