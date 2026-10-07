// ニート・中二病・ダ天使・サイヤ人・設備屋・ゴム人間・配信者・魔王 などの 技の エフェクト
// battlefx.js の play() の さいしょに よばれる（ここに ない anim なら false を かえす）
// どれも あたる しゅんかんが すぐ（ダメージの 数字と ずれない）。スマホでも 見やすい ように ふとく・はっきり
//
// みかたに かける 技（super_aura・nika_drum・aircon）は、がめんの したの ほう（みかたの いる ところ）に 大きく 出る。
// battle.js は 敵に あたる ときだけ play() を よぶので、みかたに かける ときは PARTY_ANIMS を 見て
//   fx.play(anim, [{ x: BW / 2, y: BH * 0.62 }], null, { fromAlly: true }) の ように がめんの まん中で よぶ

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t);
const easeIn = (t) => t * t * t;

const GOLD = ['#fff6b0', '#ffe066', '#ffd040', '#ffffff'];
const KI = ['#ffffff', '#bfe6ff', '#6ac0ff'];
const DARK = ['#c070ff', '#7a2ab8', '#e0b8ff', '#2a0a46'];
const RAINBOW = ['#ff6a6a', '#ffb04a', '#ffe066', '#7de08a', '#6ac8ff', '#b08aff'];
const COIN_COL = ['#ffd24a', '#e8ecf4', '#ff5a6a', '#4a9aff', '#4ad86a', '#c86aff'];
// スーパーチャットの おびの いろ（あお → みずいろ → みどり → きいろ → オレンジ → ピンク → あか）
const SC_COL = [['#1e5ad8', '#3a7af0'], ['#00a8c8', '#20c8e8'], ['#0a9a5a', '#20c070'], ['#e0a800', '#ffc820'], ['#e86a00', '#ff8a20'], ['#d01a6a', '#f03a8a'], ['#c81a1a', '#e83a3a']];

// みかたに かける 技（がめんの まん中で よぶ もの）と、たたかいの 音の めやす（battle.js の ANIM_SFX に つかえる）
export const PARTY_ANIMS = new Set(['super_aura', 'nika_drum', 'aircon']);
export const JOB2_SFX = {
  kamehameha: 'void', ki_blast: 'blast', super_aura: 'buff', gomu_punch: 'smash', gomu_gatling: 'smash', nika_drum: 'buff',
  dark_wings: 'dark', chuuni_flame: 'dark', flame_up: 'fire', glitch: 'debuff', aircon: 'ice', maou_dark: 'dark', superchat: 'item',
};

// にぎった こぶし（f: 大きさ。+x が なぐる むき。まえに 4つの ゆびの ふくらみ・うえに おやゆび）
function fistShape(x, f) {
  const blob = (r) => {
    x.beginPath();
    x.moveTo(-f * 0.55, -r);
    x.lineTo(f * 0.55, -r);
    x.quadraticCurveTo(r * 1.08, -r, r * 1.08, -f * 0.5);
    x.lineTo(r * 1.08, f * 0.5);
    x.quadraticCurveTo(r * 1.08, r, f * 0.55, r);
    x.lineTo(-f * 0.55, r);
    x.quadraticCurveTo(-r, r, -r, f * 0.4);
    x.lineTo(-r, -f * 0.4);
    x.quadraticCurveTo(-r, -r, -f * 0.55, -r);
    x.fill();
  };
  x.fillStyle = '#5a2a1a';
  blob(f + 1);
  x.fillStyle = '#f2c09a';
  blob(f);
  // ゆびの すじ と ふくらみ
  x.fillStyle = '#d08a66';
  for (let i = -1; i <= 1; i++) x.fillRect(f * 0.25, i * f * 0.5 - 0.5, f * 0.8, 1);
  x.fillStyle = '#ffe2c8';
  for (let i = 0; i < 4; i++) x.fillRect(f * 0.62, -f * 0.9 + i * f * 0.5, f * 0.32, f * 0.28);
  // おやゆび
  x.fillStyle = '#5a2a1a';
  x.fillRect(-f * 0.3, -f - 1.2, f * 0.95, 2.2);
  x.fillStyle = '#f6cca8';
  x.fillRect(-f * 0.22, -f - 0.6, f * 0.8, 1.2);
}

// ───────────── こまかい つぶの かきかた（battlefx.js の FINE に まぜる） ─────────────
// x: キャンバス、p: つぶ、t: 0〜1（age / life）
export const JOB2_FINE = {
  // かめはめ波: あおじろい ふとい ひかりの せん（ゆらぎながら のびて、ほそく なって きえる）
  kame(x, p, t) {
    const grow = clamp01(p.age / 70);
    const fade = t < 0.55 ? 1 : 1 - (t - 0.55) / 0.45;
    const w = p.w * fade * (1 + 0.12 * Math.sin(p.age / 22)) * (0.4 + 0.6 * grow);
    if (w <= 0.2) return;
    const dx = p.x - p.x0, dy = p.y - p.y0;
    const L = Math.hypot(dx, dy) * grow;
    x.save();
    x.translate(p.x0, p.y0);
    x.rotate(Math.atan2(dy, dx));
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = 0.45 * fade;
    x.fillStyle = p.glow;
    x.fillRect(0, -w * 1.15, L, w * 2.3);
    x.globalAlpha = 0.9 * fade;
    x.fillStyle = '#7ac8ff';
    x.fillRect(0, -w * 0.62, L, w * 1.24);
    x.globalAlpha = fade;
    x.fillStyle = '#ffffff';
    x.fillRect(0, -w * 0.28, L, w * 0.56);
    // ながれる すじ
    x.globalAlpha = 0.8 * fade;
    for (let i = 0; i < 6; i++) {
      const u = ((p.age * 0.9 + i * 47) % 100) / 100;
      x.fillRect(u * L, (((i * 37) % 9) - 4) * w * 0.12, 10, 1);
    }
    // ての ところと さきの たま
    x.globalAlpha = 0.9 * fade;
    x.beginPath(); x.arc(0, 0, w * 1.05, 0, Math.PI * 2); x.fillStyle = '#bfe6ff'; x.fill();
    x.beginPath(); x.arc(L, 0, w * 1.25, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#ffffff';
    x.beginPath(); x.arc(L, 0, w * 0.7, 0, Math.PI * 2); x.fill();
    x.restore();
  },
  // ほのおの した（したから うえへ ゆらめく。dark: くろい なかみに むらさきの ふち）
  flame(x, p, t) {
    const life = Math.sin(Math.PI * Math.min(1, t * 1.15 + 0.05));
    const h = p.h * (0.35 + 0.65 * life) * (1 + 0.1 * Math.sin(p.age / 40 + p.ph));
    const w = p.w * (0.6 + 0.4 * life);
    if (h < 1) return;
    const sway = Math.sin(p.age / 70 + p.ph) * w * 0.35;
    const tongue = (hh, ww) => {
      x.beginPath();
      x.moveTo(p.x - ww, p.y);
      x.quadraticCurveTo(p.x - ww * 1.05, p.y - hh * 0.45, p.x + sway, p.y - hh);
      x.quadraticCurveTo(p.x + ww * 1.05, p.y - hh * 0.45, p.x + ww, p.y);
      x.closePath();
      x.fill();
    };
    const a = Math.max(0, 1 - Math.max(0, t - 0.6) / 0.4);
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = 0.85 * a;
    x.fillStyle = p.c2;
    tongue(h, w);
    x.globalCompositeOperation = p.dark ? 'source-over' : 'lighter';
    x.globalAlpha = (p.dark ? 0.92 : 0.9) * a;
    x.fillStyle = p.c1;
    tongue(h * 0.62, w * 0.55);
  },
  // のびる ゴムの うで（したから のびて、あたって、もどる）とがった こぶし
  gomuarm(x, p) {
    const ext = p.ext, hold = p.hold;
    let u;
    if (p.age < ext) u = easeOut(p.age / ext);
    else if (p.age < ext + hold) u = 1 + Math.sin(((p.age - ext) / hold) * Math.PI) * 0.06;
    else u = 1 - easeIn(clamp01((p.age - ext - hold) / Math.max(1, p.life - ext - hold)));
    if (u <= 0.02) return;
    const dx = p.x - p.x0, dy = p.y - p.y0;
    const L = Math.hypot(dx, dy) || 1;
    const ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    const tx = p.x0 + dx * u, ty = p.y0 + dy * u;
    const wob = Math.sin(p.age / 18) * 5 * (p.age < ext ? 1 - u : 0.3);
    const mx = (p.x0 + tx) / 2 + nx * wob, my = (p.y0 + ty) / 2 + ny * wob;
    const r = p.r;
    x.globalAlpha = 1;
    x.lineCap = 'round';
    // うで（ふち → はだ → ひかり）
    for (const [lw, col] of [[r * 2 + 2, '#5a2a1a'], [r * 2, '#f2c09a'], [r * 0.7, '#ffe2c8']]) {
      x.strokeStyle = col;
      x.lineWidth = lw;
      x.beginPath(); x.moveTo(p.x0, p.y0); x.quadraticCurveTo(mx, my, tx, ty); x.stroke();
    }
    // あかい そで（ねもと）
    x.strokeStyle = '#d8302a';
    x.lineWidth = r * 2.6;
    x.beginPath(); x.moveTo(p.x0, p.y0); x.lineTo(p.x0 + ux * 12, p.y0 + uy * 12); x.stroke();
    // こぶし
    x.save();
    x.translate(tx, ty);
    x.rotate(Math.atan2(uy, ux));
    fistShape(x, r * 1.75);
    x.restore();
    // のびる ときの すじ
    if (p.age < ext) {
      x.globalAlpha = 0.7;
      x.strokeStyle = '#ffffff';
      x.lineWidth = 1;
      for (const o of [-1, 1]) {
        x.beginPath();
        x.moveTo(tx - ux * 16 + nx * o * (r + 3), ty - uy * 16 + ny * o * (r + 3));
        x.lineTo(tx - ux * 34 + nx * o * (r + 3), ty - uy * 34 + ny * o * (r + 3));
        x.stroke();
      }
    }
  },
  // ガトリング: たくさんの こぶし（うでの のこりと すじを ひいて、ぱっと あらわれる）
  fist(x, p, t) {
    const pop = t < 0.35 ? 0.65 + (t / 0.35) * 0.35 : 1;
    const a = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4;
    const dx = p.x - p.x0, dy = p.y - p.y0;
    const L = Math.hypot(dx, dy) || 1;
    const ux = dx / L, uy = dy / L;
    const f = p.r * pop;
    x.globalAlpha = a * 0.75;
    x.strokeStyle = '#f2c09a';
    x.lineWidth = f * 1.5;
    x.lineCap = 'round';
    x.beginPath(); x.moveTo(p.x - ux * 22, p.y - uy * 22); x.lineTo(p.x - ux * 4, p.y - uy * 4); x.stroke();
    x.strokeStyle = '#ffffff';
    x.lineWidth = 1;
    x.beginPath(); x.moveTo(p.x - ux * 30 - uy * f, p.y - uy * 30 + ux * f); x.lineTo(p.x - ux * 12 - uy * f, p.y - uy * 12 + ux * f); x.stroke();
    x.globalAlpha = a;
    x.save();
    x.translate(p.x, p.y);
    x.rotate(Math.atan2(uy, ux));
    fistShape(x, f);
    x.restore();
  },
  // ドラムの わ（はずむ しろい わ に にじいろの ふち）
  drumring(x, p, t) {
    const r = 6 + p.r1 * easeOut(t);
    const a = 1 - t;
    const sy = p.sy || 0.42;
    x.globalCompositeOperation = 'lighter';
    x.lineWidth = Math.max(1, 4 * (1 - t));
    const n = RAINBOW.length;
    for (let i = 0; i < n; i++) {
      x.globalAlpha = 0.8 * a;
      x.strokeStyle = RAINBOW[i];
      x.beginPath();
      x.ellipse(p.x, p.y, r + 2.5, (r + 2.5) * sy, 0, (i / n) * Math.PI * 2 + t * 2, ((i + 1) / n) * Math.PI * 2 + t * 2);
      x.stroke();
    }
    x.globalAlpha = a;
    x.strokeStyle = '#ffffff';
    x.lineWidth = Math.max(1, 3 * (1 - t));
    x.beginPath(); x.ellipse(p.x, p.y, r, r * sy, 0, 0, Math.PI * 2); x.stroke();
  },
  // くろい はね（うずを まいて あつまり、さいごに ぱっと ちる）
  feather(x, p, t) {
    let r, ang;
    if (t < 0.62) {
      const k = t / 0.62;
      r = p.r0 + (p.r1 - p.r0) * easeOut(k);
      ang = p.a0 + k * 5.2 * p.dir;
    } else {
      const k = (t - 0.62) / 0.38;
      r = p.r1 + k * p.r0 * 1.4;
      ang = p.a0 + 5.2 * p.dir + k * 1.2 * p.dir;
    }
    p.x = p.cx + Math.cos(ang) * r;
    p.y = p.cy + Math.sin(ang) * r * 0.62 - t * 10;
    const rot = ang + Math.PI / 2 * p.dir + Math.sin(p.age / 60) * 0.4;
    const a = t < 0.75 ? 1 : 1 - (t - 0.75) / 0.25;
    const s = p.size;
    x.save();
    x.translate(p.x, p.y);
    x.rotate(rot);
    x.globalAlpha = a;
    x.fillStyle = p.color;
    x.beginPath(); x.ellipse(0, 0, s, s * 0.36, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = p.edge || '#7a5aa8';
    x.fillRect(-s, -0.4, s * 2.3, 0.8);
    x.restore();
  },
  // ひらく くろい つばさ（敵の うしろに 大きく）
  darkwing(x, p, t) {
    const open = easeOut(clamp01(t * 2.4));
    const a = t < 0.55 ? 1 : 1 - (t - 0.55) / 0.45;
    x.save();
    x.translate(p.x, p.y);
    x.scale(p.s, 1);
    x.rotate(-0.25 - open * 0.9);
    x.globalAlpha = 0.9 * a;
    const L = p.len * (0.5 + 0.5 * open);
    // はねを ならべる（ながい ものから）
    for (let i = 0; i < 6; i++) {
      const u = i / 5;
      x.save();
      x.rotate(u * 1.1 * open);
      x.fillStyle = i % 2 ? '#1a1424' : '#2a2038';
      x.beginPath(); x.ellipse(L * 0.55, 0, L * 0.5 * (1 - u * 0.35), 3.2, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#8a5ac8';
      x.globalAlpha = 0.55 * a;
      x.fillRect(L * 0.12, -0.5, L * 0.8 * (1 - u * 0.35), 1);
      x.globalAlpha = 0.9 * a;
      x.restore();
    }
    x.restore();
  },
  // おこった コメントの ふきだし（v: 0 いかりマーク / 1 「!!」 / 2 「?!」）
  angry(x, p, t) {
    const pop = t < 0.12 ? 0.4 + (t / 0.12) * 0.75 : t < 0.2 ? 1.15 - ((t - 0.12) / 0.08) * 0.15 : 1;
    const a = t < 0.75 ? 1 : 1 - (t - 0.75) / 0.25;
    const X = Math.round(p.x), Y = Math.round(p.y);
    const w = Math.round(13 * pop), h = Math.round(9 * pop);
    x.globalAlpha = a;
    // ふきだし（くろい ふち・しろ・した の しっぽ）
    x.fillStyle = '#2a1a1a';
    x.fillRect(X - w - 1, Y - h - 1, w * 2 + 2, h * 2 + 2);
    x.beginPath(); x.moveTo(X - 4, Y + h); x.lineTo(X - 8, Y + h + 6); x.lineTo(X + 2, Y + h); x.fill();
    x.fillStyle = '#ffffff';
    x.fillRect(X - w, Y - h, w * 2, h * 2);
    x.beginPath(); x.moveTo(X - 3, Y + h - 1); x.lineTo(X - 6, Y + h + 3); x.lineTo(X + 1, Y + h - 1); x.fill();
    if (pop < 0.8) return;
    x.fillStyle = '#e8202a';
    if (p.v === 0) {
      // いかりマーク（4つの かぎ）
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        x.fillRect(X + sx * 2 - (sx < 0 ? 3 : 0), Y + sy * 2 - (sy < 0 ? 1 : 0), 3, 1);
        x.fillRect(X + sx * 2 - (sx < 0 ? 1 : 0), Y + sy * 2 - (sy < 0 ? 3 : 0), 1, 3);
      }
    } else if (p.v === 1) {
      for (const dx of [-3, 2]) { x.fillRect(X + dx, Y - 5, 2, 6); x.fillRect(X + dx, Y + 3, 2, 2); }
    } else {
      x.fillRect(X - 5, Y - 5, 4, 1); x.fillRect(X - 2, Y - 4, 1, 3); x.fillRect(X - 4, Y - 1, 2, 1); x.fillRect(X - 4, Y + 1, 2, 1); x.fillRect(X - 4, Y + 3, 2, 2);
      x.fillRect(X + 2, Y - 5, 2, 6); x.fillRect(X + 2, Y + 3, 2, 2);
    }
  },
  // グリッチ（いろの ずれた ドットの かたまりが ちらつく）
  glitch(x, p, t) {
    const step = Math.floor(p.age / 45);
    if (step !== p.step) {
      p.step = step;
      p.rects = [];
      const n = 10 + Math.floor(Math.random() * 8);
      for (let i = 0; i < n; i++) {
        p.rects.push([p.x + rnd(-p.w / 2, p.w / 2), p.y + rnd(-p.h / 2, p.h / 2), 2 + Math.floor(Math.random() * 11), 1 + Math.floor(Math.random() * 4), pick(['#00ffff', '#ff30ff', '#ffffff', '#101018', '#40ff60', '#ffe040'])]);
      }
      p.bars = [];
      for (let i = 0; i < 3; i++) p.bars.push([p.y + rnd(-p.h / 2, p.h / 2), rnd(-6, 6), 1 + Math.floor(Math.random() * 3)]);
    }
    const a = (t < 0.8 ? 1 : 1 - (t - 0.8) / 0.2) * (step % 3 === 2 ? 0.55 : 1);
    x.globalAlpha = a;
    for (const [rx, ry, rw, rh, c] of p.rects) { x.fillStyle = c; x.fillRect(Math.round(rx), Math.round(ry), rw, rh); }
    // よこに ずれた すじ（あか と あお）
    for (const [by, off, bh] of p.bars) {
      x.globalAlpha = a * 0.75;
      x.fillStyle = '#ff2a6a';
      x.fillRect(Math.round(p.x - p.w / 2 + off), Math.round(by), p.w, bh);
      x.fillStyle = '#2affff';
      x.fillRect(Math.round(p.x - p.w / 2 - off), Math.round(by) + bh, p.w, 1);
    }
  },
  // エアコン（かべに つける しろい エアコン。うえから おりてきて、ふきだし口が ひらく）
  acunit(x, p, t) {
    const inn = easeOut(clamp01(p.age / 160));
    const out = t > 0.85 ? (t - 0.85) / 0.15 : 0;
    const Y = Math.round(p.y - 30 * (1 - inn) - 30 * out);
    const X = Math.round(p.x);
    const w = 26, h = 9;
    x.globalAlpha = 1;
    x.fillStyle = '#5a6278';
    x.fillRect(X - w - 1, Y - h - 1, w * 2 + 2, h * 2 + 2);
    x.fillStyle = '#f4f6fa';
    x.fillRect(X - w, Y - h, w * 2, h * 2);
    x.fillStyle = '#ffffff';
    x.fillRect(X - w + 2, Y - h + 1, w * 2 - 4, 2);
    x.fillStyle = '#d4d8e4';
    x.fillRect(X - w, Y + h - 5, w * 2, 5);
    // ふきだし口（ルーバーが ひらく）と みどりの ランプ・ひしがたの しるし
    const open = clamp01((p.age - 120) / 180);
    x.fillStyle = '#3a4258';
    x.fillRect(X - w + 3, Y + h - 4, w * 2 - 6, 1 + Math.round(open * 2));
    x.fillStyle = '#c8ccd8';
    x.fillRect(X - w + 3, Y + h - 1 + Math.round(open * 2), w * 2 - 6, 1);
    x.fillStyle = Math.floor(p.age / 300) % 2 ? '#4ae88a' : '#2ac86a';
    x.fillRect(X + w - 6, Y - 2, 2, 2);
    x.fillStyle = '#6cc0f0';
    x.fillRect(X - w + 5, Y - 3, 1, 1); x.fillRect(X - w + 4, Y - 2, 3, 1); x.fillRect(X - w + 5, Y - 1, 1, 1);
  },
  // すずしい かぜの すじ（うえから したへ ゆれながら ながれる）
  airstream(x, p, t) {
    const head = easeOut(clamp01(t * 1.6));
    const tail = easeIn(clamp01(t * 1.6 - 0.35));
    if (head - tail < 0.01) return;
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = 0.85 * (1 - t * 0.5);
    x.strokeStyle = p.color;
    x.lineWidth = p.w || 1.5;
    x.lineCap = 'round';
    x.beginPath();
    for (let i = 0; i <= 16; i++) {
      const u = tail + (head - tail) * (i / 16);
      const px = p.x + (p.x1 - p.x) * u + Math.sin(u * Math.PI * 3 + p.ph) * p.amp;
      const py = p.y + (p.y1 - p.y) * u;
      if (i) x.lineTo(px, py); else x.moveTo(px, py);
    }
    x.stroke();
  },
  // ゆきの けっしょう（6本の うで）
  flake(x, p, t) {
    const s = p.size * Math.sin(Math.PI * Math.min(1, t * 1.2 + 0.1));
    if (s <= 0.3) return;
    const rot = p.age / 400;
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = 1 - t * 0.5;
    x.strokeStyle = p.color;
    x.lineWidth = 1;
    x.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = rot + (i * Math.PI) / 3;
      x.moveTo(p.x - Math.cos(a) * s, p.y - Math.sin(a) * s);
      x.lineTo(p.x + Math.cos(a) * s, p.y + Math.sin(a) * s);
    }
    x.stroke();
  },
  // いろとりどりの コイン（くるくる まわって おちる）
  coin2(x, p, t) {
    const spin = Math.abs(Math.cos(p.age / 70 + p.ph));
    const r = p.size;
    const a = t < 0.85 ? 1 : 1 - (t - 0.85) / 0.15;
    x.globalAlpha = a;
    x.fillStyle = '#2a1a10';
    x.beginPath(); x.ellipse(p.x, p.y, r * spin + 1, r + 1, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = p.c;
    x.beginPath(); x.ellipse(p.x, p.y, r * spin, r, 0, 0, Math.PI * 2); x.fill();
    if (spin > 0.4) {
      x.fillStyle = '#ffffff';
      x.globalAlpha = a * 0.8;
      x.fillRect(Math.round(p.x - r * spin * 0.45), Math.round(p.y - r * 0.5), 1, Math.max(1, Math.round(r * 0.6)));
    }
  },
  // おさつ（ひらひら まいおちる）
  bill(x, p, t) {
    const a = t < 0.85 ? 1 : 1 - (t - 0.85) / 0.15;
    x.save();
    x.translate(p.x + Math.sin(p.age / 160 + p.ph) * 6, p.y);
    x.rotate(Math.sin(p.age / 200 + p.ph) * 0.6);
    x.scale(1, Math.abs(Math.cos(p.age / 150 + p.ph)) * 0.7 + 0.3);
    x.globalAlpha = a;
    x.fillStyle = '#2a4a2a';
    x.fillRect(-8, -4, 16, 8);
    x.fillStyle = p.c;
    x.fillRect(-7, -3, 14, 6);
    x.fillStyle = '#f8f4e0';
    x.fillRect(-3, -2, 5, 4);
    x.fillStyle = p.c;
    x.fillRect(-2, -1, 3, 1); x.fillRect(-1, 0, 1, 2);
    x.restore();
  },
  // スーパーチャットの おび（いろの ついた コメントが よこに ながれる）
  scbar(x, p, t) {
    const a = t < 0.85 ? 1 : 1 - (t - 0.85) / 0.15;
    const X = Math.round(p.x), Y = Math.round(p.y);
    x.globalAlpha = a * 0.95;
    x.fillStyle = '#1a1a24';
    x.fillRect(X - 1, Y - 1, 52, 13);
    x.fillStyle = p.c[0];
    x.fillRect(X, Y, 50, 5);
    x.fillStyle = p.c[1];
    x.fillRect(X, Y + 5, 50, 6);
    x.fillStyle = '#ffffff';
    x.beginPath(); x.arc(X + 4, Y + 3, 2.2, 0, Math.PI * 2); x.fill();
    x.fillRect(X + 9, Y + 2, 14, 1);
    x.fillRect(X + 4, Y + 7, 30 + (p.n % 3) * 4, 1);
    x.fillStyle = '#fff6b0';
    x.fillRect(X + 40, Y + 1, 7, 3);
  },
};

// ───────────── 技ごとの えんしゅつ ─────────────
// その anim の エフェクトを だす（だしたら true）
// fx: Effects、W・H: たたかいの がめんの 大きさ
export function playJob2Fx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  const crit = !!opts.crit;
  const all = targets.length > 1;
  const each = (fn) => targets.forEach((t, ti) => fn(t.x, t.y, ti * (all ? 70 : 0), ti));
  switch (anim) {
    case 'kamehameha': { // かめはめ波: あおじろい たまを ためて、ふとい ひかりの せんが 敵へ
      const x0 = W / 2, y0 = H - 6;
      fx.glow(x0, y0, { color: '#4aa8ff', r: 40, life: 420, grow: 1 });
      fx.converge(x0, y0, { colors: KI, n: 20, r: 46, life: 120, size: 1.3 });
      fx.add({ kind: 'orb', x: x0, y: y0, color: '#bfe6ff', r: 17, life: 300 });
      fx.flashAt(50, '#e0f4ff', 0);
      each((x, y, d, ti) => {
        const hd = 80 + d;
        fx.add({ kind: 'kame', x0, y0, x, y, w: crit ? 16 : 13, glow: '#2a8aff', life: 660, delay: 60 + d, add: true });
        fx.add({ kind: 'orb', x, y, color: '#bfe6ff', r: crit ? 32 : 26, life: 520, delay: hd });
        fx.ring(x, y, '#9ad8ff', 5, hd, 460, crit ? 66 : 54);
        fx.shock(x, y, { r0: 6, r1: 70, color: '#ffffff', w: 2.6, delay: hd, life: 420 });
        fx.burst(x, y, KI, 30, 150, { delay: hd });
        fx.sparks(x, y, { colors: KI, n: 18, speed: 230, delay: hd, life: 380, len: 12 });
        fx.speedLines(x, y, { delay: hd, r1: 110, color: '#dff4ff' });
        if (ti === 0) { fx.flashAt(crit ? 130 : 90, '#cfeaff', hd); fx.hitStop(crit ? 300 : 240, hd, 1.7); }
      });
      return true;
    }
    case 'ki_blast': // 気弾: きいろい 小さな たまを つぎつぎに
      each((x, y, d, ti) => {
        for (let k = 0; k < 5; k++) {
          const from = { x: W / 2 + (k % 2 ? 30 : -30) + rnd(-12, 12), y: H + 4 };
          const dd = d + k * 70;
          const tx = x + rnd(-9, 9), ty = y + rnd(-7, 7);
          fx.proj(tx, ty, ['#ffe066', '#fff6b0', '#ffffff'], { size: 3.2, travel: 90, delay: dd, from });
          fx.glow(tx, ty, { color: '#ffd040', r: 16, delay: dd + 90, life: 240 });
          fx.star(tx, ty, '#fff6b0', 10, dd + 90, 180);
          fx.shock(tx, ty, { r0: 2, r1: 16, color: '#ffe066', w: 1.4, delay: dd + 90, life: 220 });
          fx.burst(tx, ty, GOLD, 7, 90, { delay: dd + 90 });
        }
        if (ti === 0) fx.hitStop(160, 90 + 4 * 70, 1.1);
      });
      return true;
    case 'super_aura': { // 金色の オーラ: みかたの いる がめんの したから 金の ほのおが もえあがる
      fx.flashAt(100, '#fff6c0', 0);
      fx.tintAt('rgba(255, 210, 80, 0.12)', 700);
      for (let k = 0; k < 22; k++) {
        fx.add({ kind: 'flame', x: 8 + (k * (W - 16)) / 21 + rnd(-4, 4), y: H + 6, h: 22 + rnd(0, 22), w: 8 + rnd(0, 6), c1: '#fffbe0', c2: '#ffc830', ph: rnd(0, 6), vy: -22, life: 760 + rnd(0, 200), delay: k * 10, add: true });
      }
      fx.add({ kind: 'ellipse', x: W / 2, y: H - 8, color: '#ffe066', life: 640, r1: 130 });
      fx.sparks(W / 2, H, { colors: GOLD, n: 40, speed: 170, ang: -Math.PI / 2, spread: 0.85, g: -50, drag: 0.97, life: 760, len: 8 });
      fx.shock(W / 2, H - 6, { r0: 10, r1: 150, sy: 0.3, color: '#fff6b0', w: 2.4, life: 520 });
      each((x, y, d) => {
        fx.swirl(x, y, GOLD, { n: 22, rad: 20, h: 60, delay: d, life: 700, size: 2 });
        fx.glow(x, y, { color: '#ffd040', r: 30, delay: d, life: 500 });
      });
      fx.hitStop(120, 0, 0.8);
      return true;
    }
    case 'gomu_punch': // ゴムの パンチ: うでが のびて なぐり、ビュンと もどる
      each((x, y, d, ti) => {
        const x0 = W / 2 + (ti % 2 ? 30 : -24) + rnd(-10, 10), y0 = H + 14;
        fx.add({ kind: 'gomuarm', x0, y0, x, y, r: 5.2, ext: 70, hold: 70, life: 330, delay: d });
        const hd = d + 70;
        fx.impact(x, y, { r: crit ? 26 : 20, delay: hd });
        fx.star(x, y, '#fff6b0', crit ? 22 : 17, hd, 240);
        fx.shock(x, y, { r0: 4, r1: 40, color: '#ffffff', w: 2.4, delay: hd, life: 300 });
        fx.speedLines(x, y, { delay: hd, r1: 90 });
        fx.burst(x, y, ['#ffffff', '#ffd66b', '#ffb070'], 16, 120, { delay: hd });
        if (ti === 0) fx.hitStop(crit ? 220 : 160, hd, 1.4);
      });
      return true;
    case 'gomu_gatling': // ゴムの ガトリング: たくさんの こぶしが いっきに
      each((x, y, d, ti) => {
        for (let k = 0; k < 14; k++) {
          const dd = d + k * 36;
          const px = x + rnd(-18, 18), py = y + rnd(-14, 12);
          fx.add({ kind: 'fist', x: px, y: py, x0: W / 2 + rnd(-70, 70), y0: H + 14, r: 4.4, life: 150, delay: dd });
          fx.star(px, py, k % 2 ? '#ffffff' : '#fff6b0', 8, dd + 40, 140);
          fx.shock(px, py, { r0: 2, r1: 12, color: '#ffffff', w: 1.4, delay: dd + 40, life: 160 });
        }
        fx.bigHit(x, y, { crit, heavy: true, delay: d + 14 * 36, color: '#ffd66b' });
        if (ti === 0) { fx.hitStop(500, 40, 0.9); fx.speedLines(x, y, { delay: d, r1: 110, life: 520 }); }
      });
      return true;
    case 'nika_drum': { // 解放の ドラム: ドン・ドドン と はずむ しろい わ・にじいろの きらきら・しろい くも
      const cx = W / 2, cy = H - 16;
      [0, 170, 300, 470, 600].forEach((d, k) => {
        fx.add({ kind: 'drumring', x: cx, y: cy, r1: 80 + k * 8, life: 560, delay: d, add: true });
        fx.shock(cx, cy, { r0: 6, r1: 50, sy: 0.42, color: '#ffffff', w: 2.6, delay: d, life: 360 });
        fx.hitStop(70, d, 0.6);
      });
      for (let k = 0; k < 26; k++) fx.twinkle(rnd(10, W - 10), rnd(H * 0.3, H - 8), { color: RAINBOW[k % RAINBOW.length], size: rnd(3, 6), vy: -rnd(10, 34), delay: k * 24, life: 720, spin: 4 });
      for (let k = 0; k < 8; k++) fx.puff(rnd(20, W - 20), H - rnd(2, 14), { color: '#ffffff', vx: rnd(-14, 14), vy: -rnd(6, 16), r0: 6, r1: 18, alpha: 0.7, delay: k * 60, life: 900 });
      for (let k = 0; k < 6; k++) fx.add({ kind: 'note', x: rnd(30, W - 30), y: H - rnd(10, 30), vx: rnd(-10, 10), vy: -26, color: RAINBOW[(k * 2) % RAINBOW.length], life: 900, delay: 100 + k * 90 });
      fx.flashAt(90, '#ffffff', 0);
      each((x, y, d) => fx.burst(x, y, ['#ffffff', ...RAINBOW], 14, 70, { delay: d }));
      return true;
    }
    case 'dark_wings': // 黒い はね: はねが うずを まいて あつまり、やみが はじける
      fx.tintAt('rgba(30, 10, 50, 0.3)', 760);
      each((x, y, d, ti) => {
        for (const s of [-1, 1]) fx.add({ kind: 'darkwing', x: x + s * 4, y: y - 4, s, len: 46, life: 640, delay: d });
        for (let k = 0; k < 16; k++) {
          fx.add({ kind: 'feather', cx: x, cy: y, a0: (k / 16) * Math.PI * 2, r0: 42, r1: 8, dir: k % 2 ? 1 : -1, size: 4 + (k % 3), color: k % 3 ? '#1a1424' : '#3a2a5a', edge: '#9a7ad0', x, y, life: 560, delay: d + k * 6 });
        }
        fx.glow(x, y, { color: '#2a0a46', r: 34, add: false, alpha: 0.75, delay: d + 40, life: 600 });
        fx.glow(x, y, { color: '#a050ff', r: 22, delay: d + 40, life: 420 });
        fx.shock(x, y, { r0: 4, r1: 54, color: '#c080ff', w: 2.4, delay: d + 40, life: 420 });
        fx.burst(x, y, DARK, 22, 110, { delay: d + 40 });
        if (ti === 0) { fx.flashAt(90, '#2a1040', d + 40); fx.hitStop(180, d + 40, 1.2); }
      });
      return true;
    case 'chuuni_flame': // 漆黒の 炎: まほうじんから くろと むらさきの ほのおが ふきあがる
      each((x, y, d, ti) => {
        fx.rune(x, y + 16, { color: '#c06aff', r: 28, delay: d, life: 760 });
        for (let k = 0; k < 14; k++) {
          fx.add({ kind: 'flame', x: x + rnd(-17, 17), y: y + 16, h: 22 + rnd(0, 20), w: 6 + rnd(0, 5), c1: '#1a0628', c2: '#b050ff', dark: true, ph: rnd(0, 6), vy: -22, life: 640 + rnd(0, 220), delay: d + k * 20 });
        }
        fx.glow(x, y, { color: '#6a1aa8', r: 30, delay: d, life: 600 });
        fx.sparks(x, y + 10, { colors: ['#e0b8ff', '#b050ff', '#ffffff'], n: 16, speed: 70, ang: -Math.PI / 2, spread: 0.9, g: -90, drag: 0.95, delay: d, life: 700, len: 6, size: 1.2 });
        fx.shock(x, y, { r0: 4, r1: 36, color: '#c070ff', w: 2, delay: d, life: 360 });
        if (ti === 0) fx.hitStop(140, d, 1);
      });
      return true;
    case 'flame_up': { // 炎上: がめんじゅうに ひが ひろがって、おこった コメントが つぎつぎ
      fx.tintAt('rgba(255, 90, 30, 0.18)', 1000);
      for (let k = 0; k < 24; k++) {
        fx.add({ kind: 'flame', x: 6 + (k * (W - 12)) / 23 + rnd(-3, 3), y: H + 4, h: 18 + rnd(0, 24), w: 8 + rnd(0, 6), c1: '#fff2a0', c2: '#ff5a1a', ph: rnd(0, 6), vy: -16, life: 700 + rnd(0, 260), delay: k * 16, add: true });
      }
      each((x, y, d, ti) => {
        for (let k = 0; k < 8; k++) fx.add({ kind: 'flame', x: x + rnd(-15, 15), y: y + 14, h: 18 + rnd(0, 16), w: 6 + rnd(0, 4), c1: '#fff2a0', c2: '#ff4a10', ph: rnd(0, 6), vy: -20, life: 600 + rnd(0, 200), delay: d + k * 24, add: true });
        fx.fireUp(x, y, 14, d);
        fx.glow(x, y, { color: '#ff6a2a', r: 26, delay: d, life: 500 });
        fx.star(x, y, '#ffe07a', 14, d, 240);
        if (ti === 0) fx.hitStop(140, d, 1);
      });
      for (let k = 0; k < 7; k++) fx.add({ kind: 'angry', x: rnd(28, W - 28), y: rnd(18, H * 0.55), v: k % 3, vy: -7, life: 900, delay: 40 + k * 85 });
      return true;
    }
    case 'glitch': // バグ: ドットの かたまりが ちらつき、色が ずれる
      each((x, y, d, ti) => {
        fx.add({ kind: 'glitch', x, y, w: 48, h: 42, life: 560, delay: d, step: -1 });
        fx.add({ kind: 'glitch', x: x + rnd(-10, 10), y: y + rnd(-8, 8), w: 30, h: 24, life: 420, delay: d + 120, step: -1 });
        fx.flashAt(50, '#ff40ff', d + 60);
        if (ti === 0) fx.hitStop(160, d, 0.9);
      });
      return true;
    case 'aircon': { // エアコン: がめんの うえに エアコン。すずしい かぜと きらきらが みかたに ふく
      const ax = W / 2, ay = 13;
      fx.add({ kind: 'acunit', x: ax, y: ay, life: 1150 });
      for (let k = 0; k < 10; k++) {
        const x0 = ax - 20 + (k % 5) * 10, x1 = 18 + ((k * 23) % (W - 36));
        fx.add({ kind: 'airstream', x: x0, y: ay + 9, x1, y1: H + 4, amp: 3 + (k % 3), ph: rnd(0, 6), w: k % 2 ? 1 : 1.6, color: k % 3 ? '#7ac8f0' : '#cdeeff', life: 720, delay: 180 + k * 40, add: true });
      }
      for (let k = 0; k < 18; k++) fx.add({ kind: 'flake', x: rnd(16, W - 16), y: rnd(26, H * 0.6), vx: rnd(-8, 8), vy: 22 + rnd(0, 18), size: rnd(2, 3.6), color: k % 2 ? '#ffffff' : '#9ad8ff', life: 900, delay: 220 + k * 30 });
      for (let k = 0; k < 10; k++) fx.twinkle(rnd(14, W - 14), rnd(H * 0.45, H - 8), { color: k % 2 ? '#e6fbff' : '#9ae6ff', size: rnd(3, 5), vy: -rnd(6, 16), delay: 360 + k * 50, life: 560, spin: 3 });
      fx.tintAt('rgba(170, 220, 255, 0.16)', 1000);
      each((x, y, d) => {
        fx.puff(x, y, { color: '#e6fbff', r0: 6, r1: 22, alpha: 0.6, delay: 260 + d, life: 600 });
        fx.burst(x, y, ['#ffffff', '#bfe8ff', '#9ad8ff'], 12, 60, { delay: 260 + d });
      });
      return true;
    }
    case 'maou_dark': { // 魔王の やみ: がめんが くらく なり、むらさきの ほのおが ふきあがる
      fx.tintAt('rgba(36, 0, 48, 0.55)', 1150);
      fx.flashAt(90, '#4a0a5a', 0);
      for (let k = 0; k < 24; k++) {
        fx.add({ kind: 'flame', x: 6 + (k * (W - 12)) / 23 + rnd(-3, 3), y: H + 6, h: 26 + rnd(0, 34), w: 9 + rnd(0, 6), c1: '#14041e', c2: '#c050ff', dark: true, ph: rnd(0, 6), vy: -18, life: 820 + rnd(0, 240), delay: k * 14 });
      }
      each((x, y, d, ti) => {
        for (let k = 0; k < 10; k++) fx.add({ kind: 'flame', x: x + rnd(-18, 18), y: y + 16, h: 28 + rnd(0, 22), w: 7 + rnd(0, 6), c1: '#14041e', c2: '#d070ff', dark: true, ph: rnd(0, 6), vy: -26, life: 700 + rnd(0, 200), delay: d + k * 18 });
        fx.glow(x, y, { color: '#200030', r: 36, add: false, alpha: 0.7, delay: d, life: 700 });
        fx.shock(x, y, { r0: 6, r1: 64, color: '#c060ff', w: 3, delay: d + 40, life: 460 });
        fx.burst(x, y, DARK, 26, 120, { delay: d + 40 });
        fx.glow(x, y, { color: '#c060ff', r: 24, delay: d + 40, life: 360 });
        if (ti === 0) { fx.hitStop(320, d + 40, 2); fx.vignette('#4a0060', 900, 0.6); }
      });
      return true;
    }
    case 'superchat': { // スパチャ: いろとりどりの コインと おさつが ふって、カラフルな コメントが ながれる
      for (let k = 0; k < 32; k++) fx.add({ kind: 'coin2', x: rnd(8, W - 8), y: -8 - rnd(0, 46), vx: rnd(-14, 14), vy: 110 + rnd(0, 70), g: 70, size: rnd(2.6, 3.6), c: COIN_COL[k % COIN_COL.length], ph: rnd(0, 6), life: 1000, delay: k * 16 });
      for (let k = 0; k < 8; k++) fx.add({ kind: 'bill', x: rnd(16, W - 16), y: -10 - rnd(0, 26), vy: 46 + rnd(0, 26), c: k % 2 ? '#7ac87a' : '#8ab0e8', ph: rnd(0, 6), life: 1150, delay: k * 50 });
      for (let k = 0; k < 4; k++) fx.add({ kind: 'scbar', x: W + 6 + k * 18, y: 10 + k * 15, vx: -230 - k * 20, c: SC_COL[(k * 2 + 1) % SC_COL.length], n: k, life: 1000, delay: k * 110 });
      each((x, y, d) => {
        fx.burst(x, y, COIN_COL, 18, 110, { delay: d + 60 });
        fx.star(x, y, '#ffe07a', 14, d + 60, 240);
        fx.glow(x, y, { color: '#ffd24a', r: 22, delay: d + 60, life: 380 });
      });
      fx.flashAt(70, '#fff6c0', 60);
      return true;
    }
    default:
      return false;
  }
}
