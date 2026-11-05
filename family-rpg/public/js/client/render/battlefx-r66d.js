// 第66回 D班の 伝説の 職業 5つの 技の エフェクト（docs/plan-r66-legend.md）
// 技の id では なく「えんしゅつの なまえ（anim）」で ひく。技の データの anim に ここの なまえを 書く（例 anim: 'gekka_sig'）。
// battlefx.js の play() で battlefx-r43j.js の つぎに よばれる（ここに ない anim なら false を かえす）。
// え は「それと わかる、でも そのまま うつさない」かんたんな かたち（ロゼッタや チコの 顔・ロゴは かかない。チコは 目の 点だけの 小さな 星）
//
// 看板の技（なまえは '<職業の id>_sig'）
//  gekka_sig       月下のロイヤルストレートフラッシュ … 夜空に 満月。光る トランプ 5まいが 扇に ならび、つぎつぎに 敵へ（5回ずつ）
//  nobu_dora_sig   ひみつ道具大行進 … ポケットが 光り、空気ほうの わ・名刀電光丸の 光・どこでもドアが つぎつぎ 出る
//  kappa_king_sig  大王の大パッカーン … 大きな 花が 色を かえながら さき（バラ → トウガラシ → さくら → ニンニク）、花びらと 大きな しょうげき
//  truth_gate_sig  真理のとびら・大れん成 … 青い れん成の 円の 上に 大きな とびらが ひらき、大地が せり上がって 敵を つきあげる
//  rosetta_sig     流星群とチコの大行進 … 夜空に 流れ星が ふりそそぎ、小さな 星の 仲間たちが はねながら 敵へ
// ほかの 技（どれも 敵に あたる。みかたに かける 技は 前から ある えんしゅつ）
//  r66d_ace        光る エースの トランプが まっすぐ 飛ぶ
//  r66d_cards      トランプが 花びらの ように まいおどる（敵全体）
//  r66d_vanish     けむりで 消えて、敵の うしろから 2回 きらっと 切る
//  r66d_door       敵の うしろに ピンクの ドアが 出て、ひらいて ポカン
//  r66d_shock      ビビッと しびれる 光の たまが 敵へ
//  r66d_harite     大きな 手のひらが どーんと つっぱる
//  r66d_splash     頭の お皿から 大きな 水しぶき
//  r66d_stonefist  地面から 石の うでが のびて なぐる
//  r66d_terrain    地面が 山と 谷に かわって ぐらり
//  r66d_meteor     流れ星が 1つ 落ちる
//  r66d_spin       星の 光を まとって くるっと 回る（わと きらきら）
//  r66d_luma       小さな 星の 仲間が 大きな 星に なって 体当たり
// ・どれも 2.4びょう いないで おわる。あたる じかんは R66D_HIT（battle.js の HIT_DELAY に まぜる）
// ・文字は 出さない

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t);
const fadeOut = (t, from = 0.7) => (t < from ? 1 : Math.max(0, 1 - (t - from) / (1 - from)));

export const R66D_SIG_JOBS = ['gekka', 'nobu_dora', 'kappa_king', 'truth_gate', 'rosetta'];
export const R66D_SIGS = R66D_SIG_JOBS.map((j) => `${j}_sig`);
export const R66D_MOVES = ['r66d_ace', 'r66d_cards', 'r66d_vanish', 'r66d_door', 'r66d_shock', 'r66d_harite', 'r66d_splash', 'r66d_stonefist', 'r66d_terrain', 'r66d_meteor', 'r66d_spin', 'r66d_luma'];
export const R66D_ANIMS = new Set([...R66D_SIGS, ...R66D_MOVES]);
// あたる じかん（ms。ダメージの 数字を この ときに 出す）
export const R66D_HIT = {
  gekka_sig: 720, nobu_dora_sig: 700, kappa_king_sig: 980, truth_gate_sig: 900, rosetta_sig: 820,
  r66d_ace: 300, r66d_cards: 380, r66d_vanish: 420, r66d_door: 460, r66d_shock: 320, r66d_harite: 300,
  r66d_splash: 360, r66d_stonefist: 420, r66d_terrain: 360, r66d_meteor: 440, r66d_spin: 300, r66d_luma: 420,
};
// たたかいの 音（battle.js の ANIM_SFX に まぜる。audio.js・sfx-r26.js・sfx-r33.js に ある 音）
export const R66D_SFX = {
  gekka_sig: 'r33_cards', nobu_dora_sig: 'gadget', kappa_king_sig: 'muscle', truth_gate_sig: 'r33_clap', rosetta_sig: 'sparkle',
  r66d_ace: 'cardfly', r66d_cards: 'r33_cards', r66d_vanish: 'r33_poof', r66d_door: 'door', r66d_shock: 'bolt', r66d_harite: 'smash',
  r66d_splash: 'splash', r66d_stonefist: 'hammer', r66d_terrain: 'rumble', r66d_meteor: 'kirari', r66d_spin: 'wind', r66d_luma: 'pon',
};

// ───────────── え の ぶひん ─────────────
function softGlow(x, cx, cy, r, col, a) {
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, col);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.globalAlpha = a;
  x.fillStyle = g;
  x.fillRect(cx - r, cy - r, r * 2, r * 2);
}
// 5つの とがりの 星
function starPath(x, cx, cy, r, rot = 0) {
  x.beginPath();
  for (let i = 0; i < 10; i++) {
    const q = rot - Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    const px = cx + Math.cos(q) * rr, py = cy + Math.sin(q) * rr;
    if (i) x.lineTo(px, py); else x.moveTo(px, py);
  }
  x.closePath();
}
// 弧の とちゅうの いち（x0,y0 → x1,y1。hop: たかさ）
const arcAt = (p, k) => [p.x0 + (p.x1 - p.x0) * k, p.y0 + (p.y1 - p.y0) * k - Math.sin(k * Math.PI) * (p.hop || 0)];
const SUITS = ['#d8202c', '#1a1a2a', '#d8202c', '#1a1a2a', '#e8b020'];
const STARC = ['#fff6a0', '#a8e8ff', '#ffb0d8', '#b8ffb0', '#ffd080'];
// 花の いろ（バラ → トウガラシ → さくら → ニンニク）
const FLOWERS = [['#e8203a', '#ff7a8a'], ['#ff5a1a', '#ffc040'], ['#ffb0cc', '#fff0f6'], ['#c99ae0', '#f4dcff']];

export const R66D_FINE = {
  // トランプ（白い 板と マーク）。x0,y0 → x1,y1 を とぶ（travel ms）。x0 が なければ x,y に とまる
  r66dCard(x, p, t) {
    let cx = p.x, cy = p.y, rot = p.rot || 0;
    if (p.x0 !== undefined) {
      const k = clamp01(p.age / (p.travel || 300));
      if (p.age > (p.travel || 300) + 60) return;
      [cx, cy] = arcAt(p, easeOut(k));
      rot += p.age / 40;
    }
    const a = p.x0 !== undefined ? 1 : fadeOut(t, 0.75);
    if (a <= 0) return;
    const s = p.s || 1;
    x.save();
    if (p.glow) {
      x.globalCompositeOperation = 'lighter';
      softGlow(x, cx, cy, 10 * s, p.glow, 0.7 * a);
      x.globalCompositeOperation = 'source-over';
    }
    x.globalAlpha = a;
    x.translate(cx, cy);
    x.rotate(rot);
    x.fillStyle = '#2a2a3a';
    x.fillRect(-3.6 * s, -5.1 * s, 7.2 * s, 10.2 * s);
    x.fillStyle = '#fbfbff';
    x.fillRect(-3 * s, -4.5 * s, 6 * s, 9 * s);
    x.fillStyle = p.suit || '#d8202c';
    x.beginPath(); x.arc(0, 0, 1.6 * s, 0, Math.PI * 2); x.fill();
    x.fillRect(-0.5 * s, 0, 1 * s, 2.4 * s);
    x.restore();
  },
  // 満月（夜空の 大きな まるい 月）
  r66dMoon(x, p, t) {
    const a = fadeOut(t, 0.75) * clamp01(p.age / 200);
    if (a <= 0) return;
    const r = p.r || 18;
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, p.x, p.y, r * 2.4, 'rgba(255,248,210,0.9)', 0.6 * a);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a;
    x.fillStyle = '#fff8dc';
    x.beginPath(); x.arc(p.x, p.y, r, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#efe2b0';
    x.beginPath(); x.arc(p.x - r * 0.3, p.y - r * 0.2, r * 0.22, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.arc(p.x + r * 0.25, p.y + r * 0.3, r * 0.15, 0, Math.PI * 2); x.fill();
    x.restore();
  },
  // ピンクの ドア（ひらく）
  r66dDoor(x, p, t) {
    const a = fadeOut(t, 0.75) * clamp01(p.age / 120);
    if (a <= 0) return;
    const s = p.s || 1, open = clamp01((p.age - (p.openAt || 200)) / 160);
    const w = 10 * s, h = 18 * s;
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y);
    // わく（中は 光）
    x.fillStyle = '#7a2a4a';
    x.fillRect(-w / 2 - 1.2 * s, -h, w + 2.4 * s, h + 1 * s);
    x.fillStyle = open > 0 ? '#fff6d0' : '#3a1a2a';
    x.fillRect(-w / 2, -h + 1 * s, w, h - 1 * s);
    // とびら（ひらくと よこに うすく なる）
    const dw = w * (1 - open * 0.8);
    x.fillStyle = '#f27ab0';
    x.fillRect(-w / 2, -h + 1 * s, dw, h - 1 * s);
    x.fillStyle = '#ffd040';
    x.fillRect(-w / 2 + dw - 2.2 * s, -h / 2, 1.4 * s, 1.4 * s);
    x.restore();
  },
  // 花（いろが かわりながら ひらく。cols: [[花びら, 中], …]）
  r66dFlower(x, p, t) {
    const a = fadeOut(t, 0.78);
    if (a <= 0) return;
    const s = (p.s || 1) * easeOut(clamp01(p.age / 260));
    const cols = p.cols || FLOWERS;
    const i = Math.min(cols.length - 1, Math.floor(p.age / (p.step || 160)));
    const [pet, mid] = cols[p.fix !== undefined ? p.fix : i];
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y);
    x.rotate(p.age / 600);
    x.fillStyle = pet;
    for (let k = 0; k < 5; k++) {
      const q = (k / 5) * Math.PI * 2;
      x.beginPath(); x.ellipse(Math.cos(q) * 6 * s, Math.sin(q) * 6 * s, 5 * s, 3.4 * s, q, 0, Math.PI * 2); x.fill();
    }
    x.fillStyle = mid;
    x.beginPath(); x.arc(0, 0, 3.2 * s, 0, Math.PI * 2); x.fill();
    x.restore();
  },
  // 大きな とびら（2まいの とびらが ひらく。中は 白い 光）
  r66dGate(x, p, t) {
    const a = fadeOut(t, 0.8) * clamp01(p.age / 160);
    if (a <= 0) return;
    const s = p.s || 1, open = clamp01((p.age - 300) / 400);
    const w = 30 * s, h = 40 * s;
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y);
    if (open > 0) {
      x.globalCompositeOperation = 'lighter';
      softGlow(x, 0, -h / 2, h * (0.6 + open), 'rgba(220,240,255,0.95)', open);
      x.globalCompositeOperation = 'source-over';
    }
    x.globalAlpha = a;
    x.fillStyle = '#3a3448';
    x.fillRect(-w / 2 - 2 * s, -h - 2 * s, w + 4 * s, h + 2 * s);
    x.fillStyle = '#ffffff';
    x.fillRect(-w / 2, -h, w, h);
    const dw = (w / 2) * (1 - open * 0.85);
    x.fillStyle = '#8a8296';
    x.fillRect(-w / 2, -h, dw, h);
    x.fillRect(w / 2 - dw, -h, dw, h);
    x.fillStyle = '#c8bede';
    for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) x.fillRect(sx < 0 ? -w / 2 + dw * 0.3 : w / 2 - dw * 0.7, -h + (k + 0.5) * (h / 4), dw * 0.4, 1.2 * s);
    x.restore();
  },
  // れん成の 円（青い 光の わと 中の 三角）
  r66dCircle(x, p, t) {
    const a = fadeOut(t, 0.7) * clamp01(p.age / 160);
    if (a <= 0) return;
    const r = (p.r || 24) * easeOut(clamp01(p.age / 240));
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = a;
    x.strokeStyle = p.color || '#7ad0ff';
    x.lineWidth = 1.4;
    x.translate(p.x, p.y);
    x.scale(1, p.sy || 0.4);
    x.rotate(p.age / 500);
    x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.arc(0, 0, r * 0.78, 0, Math.PI * 2); x.stroke();
    x.beginPath();
    for (let k = 0; k <= 3; k++) {
      const q = -Math.PI / 2 + (k / 3) * Math.PI * 2;
      if (k) x.lineTo(Math.cos(q) * r * 0.78, Math.sin(q) * r * 0.78); else x.moveTo(Math.cos(q) * r * 0.78, Math.sin(q) * r * 0.78);
    }
    x.stroke();
    x.restore();
  },
  // 地面から せり上がる 石の はしら（うで）
  r66dRock(x, p, t) {
    const a = fadeOut(t, 0.75);
    if (a <= 0) return;
    const up = easeOut(clamp01(p.age / (p.rise || 220)));
    const s = p.s || 1, h = (p.h || 26) * s * up, w = (p.w || 8) * s;
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y);
    x.fillStyle = '#6a5a48';
    x.beginPath();
    x.moveTo(-w / 2, 0); x.lineTo(-w / 2 + 1 * s, -h); x.lineTo(w / 2 - 1 * s, -h - (p.fist ? 2 * s : 3 * s)); x.lineTo(w / 2, 0);
    x.closePath(); x.fill();
    x.fillStyle = '#9a8a72';
    x.fillRect(-w / 2 + 1 * s, -h, 2 * s, h);
    if (p.fist && up > 0.5) {
      x.fillStyle = '#7a6a56';
      x.beginPath(); x.arc(0, -h - 2 * s, w * 0.75, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#a89880';
      x.beginPath(); x.arc(-w * 0.2, -h - 3 * s, w * 0.3, 0, Math.PI * 2); x.fill();
    }
    x.restore();
  },
  // 流れ星（光る 星と しっぽ）。x0,y0 → x1,y1
  r66dMeteor(x, p, t) {
    const travel = p.travel || 360;
    const k = clamp01(p.age / travel);
    if (p.age > travel + 40) return;
    const e = k * k;
    const cx = p.x0 + (p.x1 - p.x0) * e, cy = p.y0 + (p.y1 - p.y0) * e;
    const r = p.r || 5, col = p.color || '#fff6a0';
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = 0.7;
    x.strokeStyle = col;
    x.lineWidth = r * 0.9;
    x.lineCap = 'round';
    const tx = cx - (p.x1 - p.x0) * 0.25, ty = cy - (p.y1 - p.y0) * 0.25;
    x.beginPath(); x.moveTo(tx, ty); x.lineTo(cx, cy); x.stroke();
    softGlow(x, cx, cy, r * 3, col, 0.9);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = 1;
    x.fillStyle = '#ffffff';
    starPath(x, cx, cy, r, p.age / 90);
    x.fill();
    x.restore();
  },
  // 小さな 星の 仲間（目の 点だけの まるい 星）。x0,y0 → x1,y1 を はねる。big: 大きな 星に なる
  r66dLuma(x, p, t) {
    const travel = p.travel || 360;
    const k = clamp01(p.age / travel);
    if (p.age > travel + 80) return;
    const [cx, cy] = arcAt(p, easeOut(k));
    const s = (p.s || 1) * (p.big ? 1 + k : 1);
    const col = p.color || '#fff6a0';
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, cx, cy, 9 * s, col, 0.6);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = 1;
    x.fillStyle = col;
    starPath(x, cx, cy, 5 * s, Math.sin(p.age / 80) * 0.3);
    x.fill();
    x.fillStyle = '#2a2a3a';
    x.fillRect(cx - 1.6 * s, cy - 0.8 * s, 0.9 * s, 1.4 * s);
    x.fillRect(cx + 0.7 * s, cy - 0.8 * s, 0.9 * s, 1.4 * s);
    x.restore();
  },
  // 大きな 手のひら（つっぱり）。x0 → x1
  r66dPalm(x, p, t) {
    const travel = p.travel || 240;
    const k = clamp01(p.age / travel);
    const a = p.age > travel ? fadeOut(clamp01((p.age - travel) / 200), 0) : 1;
    if (a <= 0) return;
    const cx = p.x0 + (p.x1 - p.x0) * easeOut(k), cy = p.y0 + (p.y1 - p.y0) * easeOut(k);
    const s = p.s || 1;
    x.save();
    x.globalAlpha = a;
    x.translate(cx, cy);
    x.fillStyle = '#7ac84a';
    x.beginPath(); x.ellipse(0, 0, 7 * s, 8 * s, 0, 0, Math.PI * 2); x.fill();
    for (let f = 0; f < 4; f++) {
      x.beginPath(); x.ellipse((-4.5 + f * 3) * s, -9 * s, 1.4 * s, 3.2 * s, 0, 0, Math.PI * 2); x.fill();
    }
    x.beginPath(); x.ellipse(-8 * s, -1 * s, 3 * s, 1.5 * s, -0.5, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#b8f08a';
    x.beginPath(); x.ellipse(-1.5 * s, -1.5 * s, 3 * s, 3.4 * s, 0, 0, Math.PI * 2); x.fill();
    x.restore();
  },
};

// ───────────── エフェクト ─────────────
// fx: Effects（battlefx.js）  targets: [{ x, y }]  W・H: がめんの 大きさ
export function playR66dFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  if (!R66D_ANIMS.has(anim) || !targets || !targets.length) return false;
  const crit = !!opts.crit;
  const all = targets.length > 1;
  const sz = all ? 0.85 : 1;
  const tx = targets.reduce((s, t) => s + t.x, 0) / targets.length;
  const from = opts.from || { x: W / 2, y: H + 6 };
  const each = (fn) => targets.forEach((t, i) => fn(t, i, i * (all ? 60 : 0)));
  const hitMark = (t, d, col, r = 16) => {
    fx.impact(t.x, t.y, { r: (crit ? r + 6 : r) * sz, color: '#ffffff', delay: d });
    fx.sparks(t.x, t.y, { colors: ['#ffffff', col], n: all ? 8 : 14, speed: 150, delay: d, life: 340, len: 7 });
  };
  const fy = Math.min(H - 16, from.y - 18);
  const ground = (t) => Math.min(H - 4, t.y + 12);
  switch (anim) {
    // ───── 看板の技 ─────
    case 'gekka_sig': {
      // 夜空に 満月 → 5まいの トランプが 扇に ならぶ → つぎつぎ 敵へ（5回ずつ）
      fx.tintAt('rgba(8, 12, 40, 0.55)', 2100);
      fx.add({ kind: 'r66dMoon', x: W * 0.78, y: 26, r: 16, life: 2000 });
      for (let k = 0; k < 5; k++) {
        fx.add({ kind: 'r66dCard', x: tx + (k - 2) * 14, y: 30 - Math.abs(k - 2) * 3, rot: (k - 2) * 0.22, s: 1.5, suit: SUITS[k], glow: 'rgba(255,240,180,0.9)', life: 520, delay: 120 + k * 60 });
      }
      for (let r = 0; r < 5; r++) {
        each((t, i, d) => {
          const dd = 640 + r * 130 + d;
          fx.add({ kind: 'r66dCard', x0: tx + (r - 2) * 14, y0: 30, x1: t.x, y1: t.y, hop: 6, travel: 90, s: 1.3, suit: SUITS[r], glow: 'rgba(200,220,255,0.9)', life: 160, delay: dd - 90 });
          hitMark(t, dd, '#fff2b0', r === 4 ? 20 : 13);
        });
      }
      fx.flashAt(90, '#f0f4ff', 1300);
      fx.hitStop(crit ? 260 : 180, 1300, 1.6);
      return true;
    }
    case 'nobu_dora_sig': {
      // ポケットが 光る → 空気ほうの わ → 名刀電光丸の 光 → どこでもドア
      fx.glow(from.x, fy, { color: '#fff6c0', r: 30, life: 500 });
      for (let k = 0; k < 8; k++) fx.twinkle(from.x + rnd(-16, 16), fy - rnd(0, 18), { color: '#ffffff', size: 5, delay: k * 40, life: 320 });
      each((t, i, d) => {
        // 空気ほう（わが 3つ）
        for (let k = 0; k < 3; k++) fx.shock(t.x, t.y, { r0: 4, r1: 30 * sz, color: '#d8f0ff', w: 2.2, delay: 520 + d + k * 70, life: 260 });
        hitMark(t, 700 + d, '#ffd66b', 18);
        // 名刀電光丸（すばやい 光の 切りあと）
        fx.cut(t.x, t.y, { ang: -0.7, len: 40 * sz, color: '#ffffff', glow: '#ffe060', delay: 980 + d, life: 260 });
        fx.cut(t.x, t.y, { ang: 0.7, len: 40 * sz, color: '#ffffff', glow: '#ffe060', delay: 1060 + d, life: 260 });
        hitMark(t, 1060 + d, '#ffe060', 16);
      });
      fx.add({ kind: 'r66dDoor', x: tx, y: Math.min(H - 6, Math.max(...targets.map((t) => t.y)) + 16), s: 1.3, openAt: 1300, life: 900, delay: 1150 });
      fx.flashAt(80, '#ffffff', 700);
      fx.hitStop(crit ? 240 : 160, 700, 1.5);
      return true;
    }
    case 'kappa_king_sig': {
      // 大きな 花が 色を かえながら さく → 花びらと 大きな しょうげき
      fx.tintAt('rgba(20, 30, 10, 0.35)', 1900);
      fx.add({ kind: 'r66dFlower', x: from.x, y: fy - 16, s: 2.0, step: 180, life: 1300 });
      for (let k = 0; k < 10; k++) fx.petal(from.x + rnd(-20, 20), fy - 20, { color: FLOWERS[k % 4][0], vx: rnd(-40, 40), vy: rnd(-60, -20), delay: 720 + k * 25, life: 900 });
      each((t, i, d) => {
        fx.add({ kind: 'r66dFlower', x: t.x, y: t.y - 10, s: 1.2, fix: Math.floor(Math.random() * 4), life: 700, delay: 860 + d });
        hitMark(t, 980 + d, '#ffe060', 24);
        fx.shock(t.x, t.y, { r0: 6, r1: 60 * sz, color: '#fff0a0', w: 3, delay: 980 + d, life: 420 });
      });
      fx.flashAt(110, '#fff6d0', 980);
      fx.hitStop(crit ? 300 : 220, 980, 2.0);
      return true;
    }
    case 'truth_gate_sig': {
      // れん成の 円 → 大きな とびらが ひらく → 大地が せり上がって 敵を つきあげる
      fx.tintAt('rgba(10, 16, 40, 0.5)', 2200);
      fx.add({ kind: 'r66dCircle', x: W / 2, y: H - 30, r: 70, sy: 0.32, life: 1900 });
      fx.add({ kind: 'r66dGate', x: W / 2, y: H * 0.62, s: 1.2, life: 1100 });
      for (let k = 0; k < 6; k++) fx.zap(W / 2 + rnd(-60, 60), H - 30, W / 2 + rnd(-60, 60), H - 50, { color: '#c8f0ff', glow: '#3a8ae8', delay: 200 + k * 90, life: 220 });
      each((t, i, d) => {
        for (let k = 0; k < 3; k++) fx.add({ kind: 'r66dRock', x: t.x + (k - 1) * 9, y: ground(t), h: 20 + k * 6, w: 8, s: sz, rise: 160, life: 760, delay: 760 + d + k * 50 });
        hitMark(t, 900 + d, '#8ad0ff', 22);
        fx.debris(t.x, ground(t), ['#9a8a72', '#6a5a48', '#c8f0ff'], all ? 6 : 10, 900 + d, 110);
      });
      fx.flashAt(110, '#e0f4ff', 900);
      fx.hitStop(crit ? 300 : 220, 900, 2.0);
      return true;
    }
    case 'rosetta_sig': {
      // 夜空に 流れ星が ふりそそぎ、小さな 星の 仲間たちが はねながら 敵へ
      fx.tintAt('rgba(10, 8, 40, 0.55)', 2100);
      for (let k = 0; k < 16; k++) fx.twinkle(rnd(8, W - 8), rnd(6, H * 0.45), { color: STARC[k % STARC.length], size: rnd(3, 6), delay: k * 30, life: 500 });
      for (let k = 0; k < 6; k++) {
        const x0 = rnd(-20, W * 0.5);
        fx.add({ kind: 'r66dMeteor', x0, y0: -10, x1: x0 + 90, y1: H * 0.5, r: 3, color: STARC[k % STARC.length], travel: 420, life: 460, delay: 100 + k * 70 });
      }
      each((t, i, d) => {
        fx.add({ kind: 'r66dMeteor', x0: t.x - 70, y0: -14, x1: t.x, y1: t.y, r: 6, color: '#fff6a0', travel: 380, life: 420, delay: 440 + d });
        hitMark(t, 820 + d, '#fff6a0', 20);
        for (let k = 0; k < 3; k++) fx.add({ kind: 'r66dLuma', x0: from.x + (k - 1) * 14, y0: fy, x1: t.x + (k - 1) * 8, y1: t.y, hop: 30, travel: 360, s: 1.1, color: STARC[(k + i) % STARC.length], life: 440, delay: 1000 + d + k * 80 });
        hitMark(t, 1360 + d, '#ffd0f0', 14);
      });
      fx.flashAt(100, '#fffbe0', 820);
      fx.hitStop(crit ? 260 : 200, 820, 1.8);
      return true;
    }
    // ───── 月下のき術師 ─────
    case 'r66d_ace': {
      each((t, i, d) => {
        fx.add({ kind: 'r66dCard', x0: from.x, y0: fy, x1: t.x, y1: t.y, hop: 10, travel: 280, s: 1.5, suit: '#1a1a2a', glow: 'rgba(255,240,180,0.95)', life: 340, delay: d });
        hitMark(t, 300 + d, '#fff2b0', 18);
      });
      fx.hitStop(crit ? 180 : 110, 300, 1.3);
      return true;
    }
    case 'r66d_cards': {
      for (let k = 0; k < 14; k++) {
        const t = targets[k % targets.length];
        fx.add({ kind: 'r66dCard', x0: from.x + rnd(-30, 30), y0: fy - rnd(0, 20), x1: t.x + rnd(-12, 12), y1: t.y + rnd(-10, 6), hop: rnd(10, 30), travel: 340, s: 1.1, suit: SUITS[k % SUITS.length], life: 380, delay: k * 25 });
      }
      each((t, i, d) => {
        hitMark(t, 380 + d, '#ffd0e0', 14);
        for (let k = 0; k < 3; k++) fx.petal(t.x + rnd(-10, 10), t.y - 8, { color: '#ffd0e0', vx: rnd(-30, 30), vy: -20, delay: 400 + d + k * 30, life: 600 });
      });
      return true;
    }
    case 'r66d_vanish': {
      fx.puff(from.x, fy, { color: '#ffffff', r0: 6, r1: 22, life: 400, alpha: 0.8 });
      each((t, i, d) => {
        fx.puff(t.x + 10, t.y - 4, { color: '#e8ecff', r0: 4, r1: 16, life: 360, alpha: 0.7, delay: 260 + d });
        fx.cut(t.x, t.y, { ang: -0.8, len: 34 * sz, color: '#ffffff', glow: '#a8c0ff', delay: 400 + d, life: 240 });
        hitMark(t, 420 + d, '#c8d8ff', 15);
        fx.cut(t.x, t.y, { ang: 0.8, len: 34 * sz, color: '#ffffff', glow: '#a8c0ff', delay: 560 + d, life: 240 });
        hitMark(t, 580 + d, '#c8d8ff', 15);
      });
      return true;
    }
    // ───── のぶドラ ─────
    case 'r66d_door': {
      each((t, i, d) => {
        fx.add({ kind: 'r66dDoor', x: t.x + 14, y: ground(t), s: 1.2, openAt: 260, life: 760, delay: d });
        fx.glow(t.x + 14, t.y, { color: '#fff6d0', r: 18, delay: 300 + d, life: 300 });
        hitMark(t, 460 + d, '#ffb0d8', 18);
      });
      fx.hitStop(crit ? 180 : 120, 460, 1.4);
      return true;
    }
    case 'r66d_shock': {
      each((t, i, d) => {
        fx.zap(from.x, fy, t.x, t.y, { color: '#fff6b0', glow: '#9ad8ff', w: 1.4, delay: d, life: 260, forks: 2 });
        fx.glow(t.x, t.y, { color: '#c8ecff', r: 18, delay: 260 + d, life: 300 });
        hitMark(t, 320 + d, '#9ad8ff', 14);
      });
      return true;
    }
    // ───── かっぱの大王 ─────
    case 'r66d_harite': {
      each((t, i, d) => {
        fx.add({ kind: 'r66dPalm', x0: from.x, y0: fy, x1: t.x, y1: t.y, travel: 260, s: 1.5, life: 460, delay: d });
        hitMark(t, 300 + d, '#c8ff9a', 22);
        fx.speedLines(t.x, t.y, { delay: 300 + d, r1: 60 });
      });
      fx.hitStop(crit ? 220 : 160, 300, 1.7);
      return true;
    }
    case 'r66d_splash': {
      for (let k = 0; k < 18; k++) fx.drop(from.x + rnd(-10, 10), fy - 10, { color: k % 2 ? '#7ac8ff' : '#e8f6ff', vx: (tx - from.x) * rnd(0.8, 1.4) + rnd(-80, 80), vy: rnd(-200, -120), g: 380, size: 1.8, delay: k * 12, life: 700 });
      each((t, i, d) => {
        hitMark(t, 360 + d, '#9ad8ff', 16);
        for (let k = 0; k < 4; k++) fx.bubble(t.x + rnd(-10, 10), t.y + rnd(-4, 8), { color: '#bfe6ff', delay: 380 + d + k * 40 });
      });
      return true;
    }
    // ───── 真理のとびらをひらく者 ─────
    case 'r66d_stonefist': {
      each((t, i, d) => {
        fx.add({ kind: 'r66dCircle', x: t.x, y: ground(t), r: 20, life: 700, delay: d });
        fx.add({ kind: 'r66dRock', x: t.x - 6, y: ground(t), h: 30, w: 9, s: 1.1, fist: true, rise: 300, life: 800, delay: 120 + d });
        hitMark(t, 420 + d, '#c8f0ff', 20);
        fx.debris(t.x, t.y, ['#9a8a72', '#6a5a48'], all ? 5 : 8, 420 + d, 90);
      });
      fx.hitStop(crit ? 200 : 140, 420, 1.6);
      return true;
    }
    case 'r66d_terrain': {
      fx.add({ kind: 'r66dCircle', x: tx, y: H - 24, r: 60, sy: 0.3, life: 900 });
      each((t, i, d) => {
        for (let k = 0; k < 2; k++) fx.add({ kind: 'r66dRock', x: t.x + (k ? 10 : -10), y: ground(t), h: 16 + k * 8, w: 10, s: sz, rise: 200, life: 700, delay: 200 + d + k * 60 });
        hitMark(t, 360 + d, '#d8c8a0', 16);
        fx.crack(t.x, ground(t) - 2, { n: 5, len: 24, delay: 300 + d });
      });
      fx.hitStop(crit ? 200 : 130, 360, 1.8);
      return true;
    }
    // ───── ロゼッタ ─────
    case 'r66d_meteor': {
      each((t, i, d) => {
        fx.add({ kind: 'r66dMeteor', x0: t.x - 80, y0: -14, x1: t.x, y1: t.y, r: 6, color: '#fff6a0', travel: 420, life: 460, delay: d });
        hitMark(t, 440 + d, '#fff6a0', 20);
        for (let k = 0; k < 5; k++) fx.twinkle(t.x + rnd(-16, 16), t.y + rnd(-14, 8), { color: STARC[k], size: 4, delay: 460 + d + k * 40, life: 320 });
      });
      fx.flashAt(70, '#fffbe0', 440);
      return true;
    }
    case 'r66d_spin': {
      fx.shock(from.x, fy, { r0: 4, r1: 30, color: '#fff6a0', w: 2, life: 300 });
      each((t, i, d) => {
        fx.swirl(t.x, t.y + 6, ['#fff6a0', '#a8e8ff', '#ffffff'], { n: 18, rad: 14, h: 30, delay: 120 + d, life: 420 });
        hitMark(t, 300 + d, '#fff6a0', 15);
      });
      return true;
    }
    case 'r66d_luma': {
      each((t, i, d) => {
        for (let k = 0; k < 3; k++) {
          fx.add({ kind: 'r66dLuma', x0: from.x + (k - 1) * 16, y0: fy, x1: t.x, y1: t.y, hop: 24, travel: 380, s: 1.2, big: true, color: STARC[(k + i) % STARC.length], life: 460, delay: d + k * 60 });
        }
        hitMark(t, 420 + d, '#fff6a0', 16);
      });
      return true;
    }
  }
  return false;
}
