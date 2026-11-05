// 第66回 C班の 伝説の職業 4つの 技の エフェクト（総理大臣・会長・働き方改革の星・あの方。docs/plan-r66-legend.md の C班）
// 技の id では なく「えんしゅつの なまえ（anim）」で ひく。技の データの anim に ここの なまえを 書く（例 anim: 'souri_sig'）。
// battlefx.js の play() で よばれる（ここに ない anim なら false を かえす）。
//
// 看板の技（なまえは '<職業の id>_sig'）
//  souri_sig        総理大臣 … 画面が くらく なり、日本列島の 形の 光が うかぶ → 北から 南へ 光の つぶが ならぶ → 光の 柱が 敵に ふりそそぐ・みかたに 金の やじるし
//  kaichou_sig      会長 … 金の 光の なか、空から 大判小判が ざくざく ふりそそぐ → 敵の 上で 金の しょうげき・みかたに 青い やじるし
//  hatarakikata_sig 働き方改革の星 … 時計が 定時を さす → まっ白な 星が 空に かがやき、白い 光の 波が 敵を のみこむ・みかたに 緑の きらきら
//  ano_kata_sig     あの方 … 画面が まっくらに なり、音ぷが ながれる → 黒い カラスの むれが 敵へ → 闇の しょうげき
// ほかの 技
//  r66c_speech   演台の マイクと 声の すじ・みかたに 金の やじるし（みかた）
//  r66c_cabinet  大臣たちが 丸く ならぶ 光の わ・やじるし（みかた）
//  r66c_kaisan   「解散」の 大きな ばくはつ（光の 玉が はじける）
//  r66c_hanko    赤い 丸い ハンコが 上から どーんと おちる
//  r66c_guard    金の たてが みかたの 前に ならぶ（みかた）
//  r66c_bills    お札が 空から ひらひら ふる
//  r66c_group    社員の まぼろしが つぎつぎ かけぬける
//  r66c_clock    時計の はりが くるっと まわって 定時（敵にも みかたにも）
//  r66c_home     小さな 家の まどに あかりが ともり、緑の きらきら（みかた）
//  r66c_mail     手紙が 敵へ とんで、音ぷが ひびく
//  r66c_crow     黒い カラスが 3羽ずつ 敵へ
//  r66c_potion   黒い 薬の びんから むらさきの けむり
//  r66c_shadow   黒い かげが ひろがる（自分にも 敵にも）
// ・どれも 2.2びょう いないで おわる。あたる じかんは R66C_HIT（battle.js の HIT_DELAY に まぜる）
// ・みかたに つかう えんしゅつ（PARTY_ANIMS_R66C）は、battle.js が がめんの 下の まん中に 出す
// ・文字は 出さない（絵だけ）

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t);
const fadeOut = (t, from = 0.7) => (t < from ? 1 : Math.max(0, 1 - (t - from) / (1 - from)));

export const R66C_SIG_JOBS = ['souri', 'kaichou', 'hatarakikata', 'ano_kata'];
export const R66C_SIGS = R66C_SIG_JOBS.map((j) => `${j}_sig`);
export const R66C_MOVES = ['r66c_speech', 'r66c_cabinet', 'r66c_kaisan', 'r66c_hanko', 'r66c_guard', 'r66c_bills', 'r66c_group', 'r66c_clock',
  'r66c_home', 'r66c_mail', 'r66c_crow', 'r66c_potion', 'r66c_shadow'];
export const R66C_ANIMS = new Set([...R66C_SIGS, ...R66C_MOVES]);
// みかたに つかう ことが ある えんしゅつ（敵が いない ときは がめんの 下に 大きく 出す）
export const PARTY_ANIMS_R66C = new Set(['r66c_speech', 'r66c_cabinet', 'r66c_guard', 'r66c_clock', 'r66c_home', 'r66c_shadow']);
// あたる じかん（ms。ダメージの 数字を この ときに 出す）
export const R66C_HIT = {
  souri_sig: 900, kaichou_sig: 860, hatarakikata_sig: 880, ano_kata_sig: 900,
  r66c_kaisan: 420, r66c_hanko: 360, r66c_bills: 520, r66c_group: 380, r66c_clock: 360, r66c_mail: 420, r66c_crow: 440, r66c_potion: 420, r66c_shadow: 360,
};
// たたかいの 音（battle.js の ANIM_SFX に まぜる。audio.js・sfx-r26.js・sfx-r33.js に ある 音）
export const R66C_SFX = {
  souri_sig: 'kirari', kaichou_sig: 'coin', hatarakikata_sig: 'sparkle', ano_kata_sig: 'dark',
  r66c_speech: 'buff', r66c_cabinet: 'r33_clap', r66c_kaisan: 'blast', r66c_hanko: 'stamp', r66c_guard: 'buff', r66c_bills: 'coin',
  r66c_group: 'hit', r66c_clock: 'click', r66c_home: 'heal', r66c_mail: 'pon', r66c_crow: 'wind', r66c_potion: 'debuff', r66c_shadow: 'dark',
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
// x0,y0 → x1,y1 を travel ms で（lift: 山なり）
const along = (p) => {
  const k = clamp01(p.age / (p.travel || 400));
  return [p.x0 + ((p.x1 ?? p.x0) - p.x0) * k, p.y0 + ((p.y1 ?? p.y0) - p.y0) * k - Math.sin(k * Math.PI) * (p.lift || 0), k];
};

export const R66C_FINE = {
  // お札（みどりがかった 長しかく）・小判（金の 楕円）。ゆらゆら 回りながら おちる
  r66cBill(x, p, t) {
    const a = fadeOut(t, 0.75);
    if (a <= 0) return;
    const [cx, cy] = along(p);
    const s = p.s || 1, rot = (p.rot || 0) + Math.sin(p.age / 90 + (p.ph || 0)) * 0.6;
    x.save();
    x.globalAlpha = a;
    x.translate(cx, cy);
    x.rotate(rot);
    if (p.coin) {
      x.fillStyle = '#9c5e1a';
      x.beginPath(); x.ellipse(0, 0, 4.4 * s, 3 * s, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#f6d26c';
      x.beginPath(); x.ellipse(0, 0, 3.6 * s, 2.3 * s, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#fff6cc';
      x.fillRect(-1.5 * s, -1.2 * s, 1, 1);
    } else {
      x.fillStyle = '#5a7a4a';
      x.fillRect(-5 * s, -2.6 * s, 10 * s, 5.2 * s);
      x.fillStyle = '#d8e6c0';
      x.fillRect(-4.2 * s, -1.9 * s, 8.4 * s, 3.8 * s);
      x.fillStyle = '#8a6a3a';
      x.beginPath(); x.arc(1.6 * s, 0, 1.3 * s, 0, Math.PI * 2); x.fill();
    }
    x.restore();
  },
  // 赤い 丸い ハンコ（上から おちて、どん。おした あとは 赤い まるが のこる）
  r66cHanko(x, p, t) {
    const a = fadeOut(t, 0.7);
    if (a <= 0) return;
    const k = easeOut(clamp01(p.age / (p.drop || 300)));
    const s = p.s || 1;
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y);
    if (k >= 1) {
      // おした あと（赤い わと 中の 線）
      x.strokeStyle = '#d8202c';
      x.lineWidth = 2 * s;
      x.beginPath(); x.arc(0, 0, 9 * s, 0, Math.PI * 2); x.stroke();
      x.fillStyle = '#d8202c';
      x.fillRect(-4 * s, -4 * s, 8 * s, 1.6 * s);
      x.fillRect(-0.8 * s, -4 * s, 1.6 * s, 8 * s);
      x.fillRect(-4 * s, 2.4 * s, 8 * s, 1.6 * s);
    }
    const hy = -60 * (1 - k) - 12 * s;
    // 金の ハンコ（にぎりと 台）
    x.fillStyle = '#9c5e1a';
    x.fillRect(-7 * s, hy, 14 * s, 8 * s);
    x.fillStyle = '#f6d26c';
    x.fillRect(-6 * s, hy + 1 * s, 12 * s, 5 * s);
    x.fillStyle = '#d69a2e';
    x.fillRect(-3 * s, hy - 10 * s, 6 * s, 10 * s);
    x.beginPath(); x.arc(0, hy - 11 * s, 4.5 * s, 0, Math.PI * 2); x.fill();
    x.restore();
  },
  // 時計（白い 文字ばん・赤い ふち。はりが くるっと まわって、さいごは 定時〈5時〉で とまる）
  r66cClock(x, p, t) {
    const a = fadeOut(t, 0.7) * clamp01(p.age / 120);
    if (a <= 0) return;
    const s = p.s || 1, r = 11 * s;
    const k = easeOut(clamp01(p.age / (p.spin || 500)));
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y);
    x.fillStyle = '#f8f8f2';
    x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.fill();
    x.strokeStyle = p.col || '#3aa86a';
    x.lineWidth = 2 * s;
    x.stroke();
    x.fillStyle = '#26304a';
    for (let i = 0; i < 12; i++) {
      const q = (i / 12) * Math.PI * 2;
      x.fillRect(Math.cos(q) * r * 0.78 - 0.5, Math.sin(q) * r * 0.78 - 0.5, 1, 1);
    }
    x.strokeStyle = '#26304a';
    x.lineCap = 'round';
    // 長い はりは 12（上）・みじかい はりは 5
    const big = -Math.PI / 2 + (1 - k) * Math.PI * 4;
    const small = -Math.PI / 2 + (5 / 12) * Math.PI * 2 - (1 - k) * Math.PI;
    x.lineWidth = 1.4 * s;
    x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(big) * r * 0.8, Math.sin(big) * r * 0.8); x.stroke();
    x.lineWidth = 2 * s;
    x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(small) * r * 0.5, Math.sin(small) * r * 0.5); x.stroke();
    if (k >= 1) {
      x.globalCompositeOperation = 'lighter';
      softGlow(x, 0, 0, r * 2, 'rgba(160,255,190,0.8)', a * 0.5 * fadeOut(t, 0.4));
    }
    x.restore();
  },
  // 黒い カラス（はばたきながら x0 → x1）
  r66cCrow(x, p, t) {
    const a = fadeOut(t, 0.8);
    if (a <= 0) return;
    const [cx, cy] = along(p);
    const s = p.s || 1, dir = (p.x1 ?? p.x0) >= p.x0 ? 1 : -1;
    const flap = Math.sin(p.age / 45 + (p.ph || 0));
    x.save();
    x.globalAlpha = a;
    x.translate(cx, cy);
    x.scale(dir, 1);
    x.fillStyle = '#121018';
    x.beginPath(); x.ellipse(0, 0, 5 * s, 2.4 * s, 0, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.arc(4.6 * s, -1.2 * s, 2 * s, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#3a3448';
    x.beginPath(); x.moveTo(6.2 * s, -1.4 * s); x.lineTo(8.6 * s, -0.8 * s); x.lineTo(6.2 * s, -0.2 * s); x.closePath(); x.fill();
    x.fillStyle = '#121018';
    x.beginPath(); x.moveTo(-1 * s, -1 * s); x.lineTo(-6 * s, -1 * s - flap * 6 * s); x.lineTo(2 * s, -1 * s); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(-4.5 * s, 0); x.lineTo(-8 * s, -1.5 * s); x.lineTo(-8 * s, 1.5 * s); x.closePath(); x.fill();
    x.fillStyle = '#e8c040';
    x.fillRect(5 * s, -1.8 * s, 1, 1);
    x.restore();
  },
  // 音ぷ（8分音ぷの 形。ふわふわ 上へ）
  r66cNote(x, p, t) {
    const a = fadeOut(t, 0.6) * clamp01(p.age / 100);
    if (a <= 0) return;
    const [cx, cy0] = along(p);
    const cy = cy0 - p.age * 0.015;
    const s = p.s || 1;
    x.save();
    x.globalAlpha = a;
    x.translate(cx + Math.sin(p.age / 120 + (p.ph || 0)) * 2, cy);
    x.fillStyle = p.col || '#c8a0ff';
    x.beginPath(); x.ellipse(0, 0, 2.4 * s, 1.7 * s, -0.4, 0, Math.PI * 2); x.fill();
    x.fillRect(1.6 * s, -8 * s, 1.1 * s, 8 * s);
    x.fillRect(1.6 * s, -8 * s, 3.4 * s, 1.3 * s);
    x.restore();
  },
  // 手紙（白い ふうとうに 黒い ふた）
  r66cMail(x, p, t) {
    const a = fadeOut(t, 0.85);
    if (a <= 0) return;
    const [cx, cy] = along(p);
    const s = p.s || 1;
    x.save();
    x.globalAlpha = a;
    x.translate(cx, cy);
    x.rotate(Math.sin(p.age / 100) * 0.2);
    x.fillStyle = '#f6f6fa';
    x.fillRect(-6 * s, -4 * s, 12 * s, 8 * s);
    x.fillStyle = '#16141e';
    x.beginPath(); x.moveTo(-6 * s, -4 * s); x.lineTo(0, 1 * s); x.lineTo(6 * s, -4 * s); x.closePath(); x.fill();
    x.fillStyle = '#8a1a2a';
    x.beginPath(); x.arc(0, 0.5 * s, 1.3 * s, 0, Math.PI * 2); x.fill();
    x.restore();
  },
  // 薬の びん（黒い 薬・むらさきの ひかり）
  r66cBottle(x, p, t) {
    const a = fadeOut(t, 0.6) * clamp01(p.age / 120);
    if (a <= 0) return;
    const s = p.s || 1;
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y);
    x.rotate(Math.min(1, p.age / 400) * 1.9);
    x.fillStyle = '#c8c8d8';
    x.fillRect(-4 * s, -3 * s, 8 * s, 10 * s);
    x.fillStyle = '#1a1020';
    x.fillRect(-3.2 * s, 0, 6.4 * s, 6.2 * s);
    x.fillStyle = '#c8c8d8';
    x.fillRect(-1.6 * s, -7 * s, 3.2 * s, 4 * s);
    x.fillStyle = '#5a1a2a';
    x.fillRect(-2 * s, -8.4 * s, 4 * s, 1.8 * s);
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, 2 * s, 10 * s, 'rgba(170,90,230,0.8)', a * 0.6);
    x.restore();
  },
  // 小さな 家（三角の やねと あかりの ともる まど）
  r66cHouse(x, p, t) {
    const a = fadeOut(t, 0.7) * clamp01(p.age / 150);
    if (a <= 0) return;
    const s = p.s || 1;
    const lit = p.age > (p.lit ?? 300);
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y);
    x.fillStyle = '#c84a3a';
    x.beginPath(); x.moveTo(-13 * s, -6 * s); x.lineTo(0, -16 * s); x.lineTo(13 * s, -6 * s); x.closePath(); x.fill();
    x.fillStyle = '#f2e6c8';
    x.fillRect(-10 * s, -6 * s, 20 * s, 14 * s);
    x.fillStyle = '#7a4e2e';
    x.fillRect(3 * s, 0, 5 * s, 8 * s);
    x.fillStyle = lit ? '#ffe070' : '#4a5470';
    x.fillRect(-7 * s, -3 * s, 6 * s, 5 * s);
    if (lit) {
      x.globalCompositeOperation = 'lighter';
      softGlow(x, -4 * s, -0.5 * s, 14 * s, 'rgba(255,220,120,0.9)', a * 0.7);
    }
    x.restore();
  },
  // 金の たて（ボディーガード）
  r66cShield(x, p, t) {
    const a = fadeOut(t, 0.7) * clamp01(p.age / 120);
    if (a <= 0) return;
    const s = (p.s || 1) * (0.6 + 0.4 * easeOut(clamp01(p.age / 220)));
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y);
    x.fillStyle = '#9c5e1a';
    x.beginPath(); x.moveTo(-8 * s, -9 * s); x.lineTo(8 * s, -9 * s); x.lineTo(8 * s, 2 * s); x.lineTo(0, 10 * s); x.lineTo(-8 * s, 2 * s); x.closePath(); x.fill();
    x.fillStyle = '#f6d26c';
    x.beginPath(); x.moveTo(-6.5 * s, -7.5 * s); x.lineTo(6.5 * s, -7.5 * s); x.lineTo(6.5 * s, 1.4 * s); x.lineTo(0, 8 * s); x.lineTo(-6.5 * s, 1.4 * s); x.closePath(); x.fill();
    x.fillStyle = '#fff6cc';
    x.fillRect(-1 * s, -5 * s, 2 * s, 9 * s);
    x.fillRect(-4 * s, -2 * s, 8 * s, 2 * s);
    x.restore();
  },
  // 日本列島の 形の 光（ななめに ならんだ 4つの 島の つぶ）
  r66cIslands(x, p, t) {
    const a = fadeOut(t, 0.75) * clamp01(p.age / 250);
    if (a <= 0) return;
    const s = p.s || 1;
    const isl = [[30, -30, 7, 5], [16, -14, 6, 4], [-2, 2, 16, 5], [-20, 14, 6, 3], [-30, 22, 5, 4]];
    x.save();
    x.translate(p.x, p.y);
    x.globalCompositeOperation = 'lighter';
    isl.forEach(([ix, iy, rx, ry], i) => {
      const on = clamp01((p.age - i * 90) / 200);
      if (on <= 0) return;
      softGlow(x, ix * s, iy * s, (rx + 8) * s, 'rgba(255,230,140,0.9)', a * on * 0.6);
      x.globalAlpha = a * on;
      x.fillStyle = '#fff2b0';
      x.beginPath(); x.ellipse(ix * s, iy * s, rx * s, ry * s, -0.6, 0, Math.PI * 2); x.fill();
    });
    x.restore();
  },
  // 光の 柱（上から 敵へ）
  r66cPillar(x, p, t) {
    const a = fadeOut(t, 0.5) * clamp01(p.age / 80);
    if (a <= 0) return;
    const w = (p.w || 14) * (1 - 0.5 * t);
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = a * 0.8;
    const g = x.createLinearGradient(p.x, 0, p.x, p.y);
    g.addColorStop(0, 'rgba(255,250,220,0)');
    g.addColorStop(1, p.col || 'rgba(255,236,150,0.95)');
    x.fillStyle = g;
    x.fillRect(p.x - w / 2, 0, w, p.y + 6);
    x.restore();
  },
  // 社員の まぼろし（スーツの 人の かたち。x0 → x1）
  r66cWorker(x, p, t) {
    const a = fadeOut(t, 0.6) * clamp01(p.age / 100) * 0.9;
    if (a <= 0) return;
    const [cx, cy] = along(p);
    const s = p.s || 1, dir = (p.x1 ?? p.x0) >= p.x0 ? 1 : -1;
    x.save();
    x.globalAlpha = a;
    x.translate(cx, cy);
    x.scale(dir, 1);
    x.fillStyle = p.col || '#2a3050';
    x.beginPath(); x.arc(0, -16 * s, 3.2 * s, 0, Math.PI * 2); x.fill();
    x.fillRect(-3 * s, -12.5 * s, 6 * s, 9 * s);
    x.fillRect(-3 * s, -3.5 * s, 2.2 * s, 7 * s);
    x.fillRect(1 * s, -3.5 * s, 2.2 * s, 7 * s);
    x.fillStyle = '#d8202c';
    x.fillRect(-0.5 * s, -12 * s, 1, 4 * s);
    x.fillStyle = '#3a2a1a';
    x.fillRect(3 * s, -8 * s, 4 * s, 3 * s);
    x.globalAlpha = a * 0.5;
    x.fillStyle = '#ffffff';
    for (let i = 0; i < 3; i++) x.fillRect(-12 * s - i * 6 * s, (-14 + i * 5) * s, 7 * s, 1);
    x.restore();
  },
  // 白い 星（まっ白に かがやく 5つの とんがり）
  r66cStar(x, p, t) {
    const a = fadeOut(t, 0.7) * clamp01(p.age / 200);
    if (a <= 0) return;
    const R = (p.r || 16) * (0.6 + 0.4 * easeOut(clamp01(p.age / 300)));
    x.save();
    x.translate(p.x, p.y);
    x.rotate(p.age / 900);
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, 0, R * 2.4, 'rgba(220,255,235,0.9)', a * 0.7);
    x.globalAlpha = a;
    x.fillStyle = '#ffffff';
    x.beginPath();
    for (let i = 0; i < 10; i++) {
      const q = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? R * 0.45 : R;
      x.lineTo(Math.cos(q) * r, Math.sin(q) * r);
    }
    x.closePath();
    x.fill();
    x.restore();
  },
};

// ───────────── エフェクト ─────────────
// fx: Effects（battlefx.js）  targets: [{ x, y }]  W・H: がめんの 大きさ
export function playR66cFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  if (!R66C_ANIMS.has(anim) || !targets || !targets.length) return false;
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
    case 'souri_sig': {
      // 1) くらく なって、日本列島の 光が 北から 南へ ともる
      fx.tintAt('rgba(10, 10, 34, 0.55)', 1900);
      fx.add({ kind: 'r66cIslands', x: W / 2, y: 40, s: 1.1, life: 1500 });
      for (let k = 0; k < 10; k++) fx.twinkle(rnd(20, W - 20), rnd(6, 60), { color: '#fff6c0', size: rnd(3, 5), delay: 200 + k * 40, life: 360 });
      // 2) 光の 柱が 敵へ
      each((t, i, d) => {
        fx.add({ kind: 'r66cPillar', x: t.x, y: t.y, w: 18 * sz, life: 600, delay: 700 + d });
        hitMark(t, 900 + d, '#ffe07a', 22);
        fx.shock(t.x, t.y, { r0: 8, r1: 54 * sz, color: '#fff2b0', w: 3, delay: 900 + d, life: 420 });
      });
      fx.flashAt(110, '#fff6d0', 900);
      fx.hitStop(crit ? 300 : 240, 900, 2.0);
      // みかたも 強く なる（金の やじるし）
      fx.arrows(from.x, fy, '#ffe066', true, 3, 1150);
      return true;
    }
    case 'kaichou_sig': {
      // 1) 金の 光の なか、大判小判が ふりそそぐ
      fx.tintAt('rgba(40, 26, 4, 0.4)', 1800);
      for (let k = 0; k < 34; k++) {
        const x0 = rnd(tx - 90, tx + 90);
        fx.add({ kind: 'r66cBill', coin: k % 3 !== 0, x0, y0: -10, x1: x0 + rnd(-14, 14), y1: ty + rnd(-10, 14), travel: rnd(560, 820), s: rnd(0.9, 1.3), rot: rnd(-1, 1), ph: rnd(0, 6), life: 900, delay: 120 + k * 22 });
      }
      // 2) 金の しょうげき
      each((t, i, d) => {
        hitMark(t, 860 + d, '#ffd040', 22);
        fx.shock(t.x, t.y, { r0: 8, r1: 54 * sz, color: '#ffe680', w: 3, delay: 860 + d, life: 420 });
        fx.debris(t.x, t.y + 10, ['#ffd040', '#fff6cc', '#9c5e1a'], all ? 6 : 10, 880 + d, 110);
      });
      fx.flashAt(110, '#fff2c0', 860);
      fx.hitStop(crit ? 300 : 240, 860, 2.0);
      // みかたの 守備力（青い やじるし）
      fx.arrows(from.x, fy, '#9ad8ff', true, 3, 1150);
      return true;
    }
    case 'hatarakikata_sig': {
      // 1) 時計が 定時を さす
      fx.add({ kind: 'r66cClock', x: Math.min(W - 18, from.x + 34), y: Math.max(26, fy - 30), s: 1.2, spin: 380, life: 900 });
      // 2) まっ白な 星が 空に かがやき、白い 光の 波
      fx.add({ kind: 'r66cStar', x: tx, y: Math.max(22, ty - 46), r: 18, life: 1300, delay: 420 });
      fx.flashAt(120, '#ffffff', 760);
      each((t, i, d) => {
        fx.shock(t.x, t.y, { r0: 10, r1: 60 * sz, color: '#ffffff', w: 4, delay: 820 + d, life: 460 });
        hitMark(t, 880 + d, '#c8ffd8', 22);
      });
      fx.hitStop(crit ? 300 : 240, 880, 2.0);
      // 3) みかたは 緑の きらきらで 回復
      for (let k = 0; k < 10; k++) fx.twinkle(from.x + rnd(-40, 40), fy + rnd(-16, 6), { color: k % 2 ? '#8af0b0' : '#ffffff', size: rnd(4, 6), vy: -18, delay: 1000 + k * 40, life: 500 });
      return true;
    }
    case 'ano_kata_sig': {
      // 1) まっくらに なり、音ぷが ながれる
      fx.tintAt('rgba(4, 2, 10, 0.7)', 2000);
      for (let k = 0; k < 7; k++) fx.add({ kind: 'r66cNote', x0: 20 + k * 34, y0: 40 + (k % 2) * 10, travel: 1, s: 1.1, ph: k, col: k % 2 ? '#d8b040' : '#c8a0ff', life: 800, delay: k * 70 });
      // 2) カラスの むれが 敵へ
      each((t, i, d) => {
        for (let k = 0; k < 4; k++) fx.add({ kind: 'r66cCrow', x0: -16 - k * 10, y0: 20 + k * 8, x1: t.x, y1: t.y - 6 + k * 3, lift: 10, travel: 440, s: 1.1, ph: k, life: 520, delay: 360 + k * 50 + d });
        // 3) 闇の しょうげき
        fx.shock(t.x, t.y, { r0: 8, r1: 56 * sz, color: '#b070f0', w: 3, delay: 900 + d, life: 440 });
        hitMark(t, 900 + d, '#a060e0', 22);
        fx.puff(t.x, t.y, { color: '#2a1040', r0: 6, r1: 26 * sz, life: 520, alpha: 0.7, delay: 920 + d });
      });
      fx.flashAt(90, '#c8a0ff', 900);
      fx.hitStop(crit ? 300 : 240, 900, 2.0);
      return true;
    }
    // ───── 総理大臣 ─────
    case 'r66c_speech': {
      // 演台の 声の すじと 金の やじるし（みかた）
      fx.shock(tx, ty, { r0: 8, r1: 64, color: '#ffe07a', w: 2, sy: 0.4, life: 520 });
      for (const t of targets) {
        fx.speedLines(t.x, t.y - 6, { color: '#fff2b0', n: 8, r0: 10, r1: 26, delay: 120, life: 300 });
        fx.arrows(t.x, t.y, '#ffd040', true, 3, 320);
      }
      return true;
    }
    case 'r66c_cabinet': {
      // 大臣たちの 光の わ（みかた）
      for (let k = 0; k < 8; k++) {
        const q = (k / 8) * Math.PI * 2;
        fx.glow(tx + Math.cos(q) * 40, ty + Math.sin(q) * 14, { color: '#c8b8ff', r: 10, delay: k * 50, life: 520 });
      }
      for (const t of targets) fx.arrows(t.x, t.y, '#9ad8ff', true, 3, 460);
      return true;
    }
    case 'r66c_kaisan': {
      // 「解散」の 大きな ばくはつ
      fx.add({ kind: 'r66cStar', x: tx, y: Math.max(22, ty - 40), r: 10, life: 420 });
      each((t, i, d) => {
        fx.shock(t.x, t.y, { r0: 6, r1: 48 * sz, color: '#ffb060', w: 3, delay: 400 + d, life: 380 });
        hitMark(t, 420 + d, '#ffb060', 18);
        fx.debris(t.x, t.y + 8, ['#ffffff', '#ffd040', '#ff8a2a'], all ? 5 : 8, 430 + d, 90);
      });
      fx.flashAt(80, '#fff0d0', 420);
      fx.hitStop(crit ? 220 : 150, 420, 1.5);
      return true;
    }
    // ───── 会長 ─────
    case 'r66c_hanko': {
      // 赤い ハンコが どーん
      each((t, i, d) => {
        fx.add({ kind: 'r66cHanko', x: t.x, y: t.y - 4, s: 1.1 * sz, drop: 340, life: 900, delay: d });
        hitMark(t, 360 + d, '#ff8a8a', 18);
        fx.shock(t.x, t.y, { r0: 6, r1: 34 * sz, color: '#ffd0d0', w: 2, delay: 360 + d, life: 320 });
      });
      fx.hitStop(crit ? 220 : 150, 360, 1.5);
      return true;
    }
    case 'r66c_guard': {
      // 金の たてが ならぶ（みかた）
      for (const [i, t] of targets.entries()) {
        fx.add({ kind: 'r66cShield', x: t.x, y: t.y - 8, s: 1, life: 900, delay: i * 70 });
        fx.glow(t.x, t.y, { color: '#ffe680', r: 24, delay: 200 + i * 70, life: 420 });
        fx.arrows(t.x, t.y, '#9ad8ff', true, 3, 360 + i * 70);
      }
      return true;
    }
    case 'r66c_bills': {
      // お札が ひらひら ふる
      for (let k = 0; k < 24; k++) {
        const x0 = rnd(tx - 80, tx + 80);
        fx.add({ kind: 'r66cBill', coin: k % 4 === 0, x0, y0: -8, x1: x0 + rnd(-20, 20), y1: ty + rnd(-8, 16), travel: rnd(420, 620), s: rnd(0.9, 1.2), rot: rnd(-1, 1), ph: rnd(0, 6), life: 760, delay: k * 18 });
      }
      each((t, i, d) => hitMark(t, 520 + d, '#c8e6a0', 16));
      fx.hitStop(crit ? 200 : 140, 520, 1.4);
      return true;
    }
    case 'r66c_group': {
      // 社員の まぼろしが つぎつぎ かけぬける
      each((t, i, d) => {
        for (let k = 0; k < 3; k++) {
          const dir = k % 2 ? -1 : 1;
          fx.add({ kind: 'r66cWorker', x0: t.x - dir * 40, x1: t.x + dir * 40, y0: t.y + 10, travel: 300, s: 0.9 * sz, col: ['#2a3050', '#3a2a2a', '#2a3a2a'][k], life: 480, delay: 120 + k * 140 + d });
        }
        hitMark(t, 380 + d, '#ffffff', 14);
      });
      return true;
    }
    // ───── 働き方改革の星 ─────
    case 'r66c_clock': {
      // 時計の はりが くるっと 定時（敵にも みかたにも）
      const foe = !opts.fromAlly;
      fx.add({ kind: 'r66cClock', x: tx, y: Math.max(22, ty - 34), s: 1, spin: 320, life: 760 });
      each((t, i, d) => {
        if (foe) hitMark(t, 360 + d, '#8af0b0', 18);
        else fx.arrows(t.x, t.y, '#8af0b0', true, 3, 360 + d);
      });
      if (foe) fx.hitStop(crit ? 200 : 140, 360, 1.4);
      return true;
    }
    case 'r66c_home': {
      // 家の まどに あかり・緑の きらきら（みかた）
      fx.add({ kind: 'r66cHouse', x: tx, y: Math.max(26, ty - 36), s: 1, lit: 260, life: 1000 });
      for (const [i, t] of targets.entries()) {
        fx.glow(t.x, t.y, { color: '#c8ffd8', r: 24, delay: 320 + i * 60, life: 460 });
        for (let k = 0; k < 4; k++) fx.twinkle(t.x + rnd(-12, 12), t.y + rnd(-10, 10), { color: k % 2 ? '#8af0b0' : '#ffffff', size: 4, delay: 360 + i * 60 + k * 40, life: 320 });
      }
      return true;
    }
    // ───── あの方 ─────
    case 'r66c_mail': {
      // 手紙が とんで、音ぷが ひびく
      each((t, i, d) => {
        fx.add({ kind: 'r66cMail', x0: from.x, y0: fy, x1: t.x, y1: t.y - 8, lift: 16, travel: 400, s: 1, life: 460, delay: d });
        for (let k = 0; k < 3; k++) fx.add({ kind: 'r66cNote', x0: t.x + (k - 1) * 10, y0: t.y - 14, travel: 1, s: 0.9, ph: k, life: 600, delay: 420 + k * 60 + d });
        hitMark(t, 420 + d, '#c8a0ff', 12);
      });
      return true;
    }
    case 'r66c_crow': {
      // 黒い カラスが 3羽ずつ
      each((t, i, d) => {
        for (let k = 0; k < 3; k++) fx.add({ kind: 'r66cCrow', x0: from.x + (k - 1) * 16, y0: fy - 10, x1: t.x, y1: t.y - 6, lift: 18, travel: 420, s: 1, ph: k, life: 480, delay: k * 60 + d });
        hitMark(t, 440 + d, '#a060e0', 14);
      });
      fx.hitStop(crit ? 200 : 140, 440, 1.4);
      return true;
    }
    case 'r66c_potion': {
      // 黒い 薬の びんから むらさきの けむり
      each((t, i, d) => {
        fx.add({ kind: 'r66cBottle', x: t.x - 10, y: t.y - 22, s: 1, life: 700, delay: d });
        fx.puff(t.x, t.y - 6, { color: '#6a2a9a', r0: 4, r1: 22 * sz, life: 560, alpha: 0.6, delay: 380 + d });
        fx.arrows(t.x, t.y, '#c070ff', false, 3, 440 + d);
      });
      return true;
    }
    case 'r66c_shadow': {
      // 黒い かげが ひろがる（自分にも 敵にも）
      each((t, i, d) => {
        fx.puff(t.x, t.y, { color: '#120818', r0: 6, r1: 28 * sz, life: 600, alpha: 0.7, delay: d });
        fx.shock(t.x, t.y, { r0: 6, r1: 40 * sz, color: '#8a50c0', w: 2, sy: 0.5, delay: 200 + d, life: 380 });
      });
      return true;
    }
  }
  return false;
}
