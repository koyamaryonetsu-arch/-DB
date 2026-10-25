// 第45回: ドラクエふう（配合だけの 第2だん）の 技の エフェクト（技の データの anim に ここの なまえを 書く。例 anim: 'dq_gold_rain'）
// battlefx.js の play() の はじめに よばれる（ここに ない anim なら false を かえす）。かきかたは battlefx-pokemon.js と おなじ
// ・味方の 魔物が 敵に つかう … opts.from は 味方の いち（がめんの 下）。敵に むかって とぶ
// ・敵の 魔物が みんなに つかう … battle.js が みんなの いち（がめんの 下）を targets に、敵の まん中を opts.from に して よぶ
//   （どちらでも 出どころ → あいての むきで かくので、上むきでも 下むきでも 形が くずれない）
//
//  dq_gold_rain    ゴールドぷるりん … 空から 金の コインが ジャラジャラ ふってくる
//  dq_rose_storm   ローズクイーン … 赤い バラの 花びらが うずを まいて 敵みんなを つつむ・トゲで きりさく
//  dq_world_tree   せかいじゅの子 … 大きな 木の かげ と、光る はっぱが 味方に ふりそそいで 回復（味方に かける えんしゅつ）
//  dq_lantern      ランタンゴースト … 青みどりの おにびが ゆらゆら とんで ボッと もえる
//  dq_bone_king    がいこつ王 … ほねが くるくる とんで、がいこつの かおが うかんで ほねが はじける
//  dq_seasons      こよみのせいれい … さくら・たいよう・もみじ・ゆき が うずを まいて あつまる
//  dq_killer_slash キラーからくり … 赤い 目が 光って、2本の きりさきが ×の 字に
//  dq_chomp        ひとくい箱 … 大きな 宝箱の 口（キバ）が ガブッと かみつく
//  dq_dragon_lord  竜王のまご … 大きな 竜の かげが あらわれて、敵みんなに ほのおを はく
// ・どれも 2びょう いないで おわる。あたる じかんは DQ_HIT（battle.js の HIT_DELAY に まぜる）
// ・音は DQ_SFX（anim と おなじ なまえの 音。sfx-dqm.js）

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t);
const easeIn = (t) => t * t;
const fadeOut = (t, from = 0.7) => (t < from ? 1 : Math.max(0, 1 - (t - from) / (1 - from)));
const fadeIn = (t, to = 0.2) => clamp01(t / to);

export const DQ_ANIMS = new Set(['dq_gold_rain', 'dq_rose_storm', 'dq_world_tree', 'dq_lantern', 'dq_bone_king', 'dq_seasons', 'dq_killer_slash', 'dq_chomp', 'dq_dragon_lord']);
// あたる じかん（ms。ダメージ・回復の 数字を この ときに 出す）
export const DQ_HIT = {
  dq_gold_rain: 420, dq_rose_storm: 460, dq_world_tree: 520, dq_lantern: 480, dq_bone_king: 420,
  dq_seasons: 640, dq_killer_slash: 200, dq_chomp: 340, dq_dragon_lord: 820,
};
// たたかいの 音（battle.js の ANIM_SFX に まぜる。音そのものは sfx-dqm.js の SFX_DQ）
export const DQ_SFX = Object.fromEntries([...DQ_ANIMS].map((a) => [a, a]));
// 技が みんなに あたった ときの まどの えんしゅつ（battle.js の allyFxKind。せかいじゅは 回復）
export const DQ_ALLY_FX = {
  dq_gold_rain: 'claw', dq_rose_storm: 'wind', dq_world_tree: 'heal', dq_lantern: 'fire', dq_bone_king: 'dark',
  dq_seasons: 'wind', dq_killer_slash: 'claw', dq_chomp: 'claw', dq_dragon_lord: 'fire',
};

const GOLD = ['#ffd23a', '#fff6b0', '#c8861a'];
const ROSE = ['#e02a4a', '#ff7a90', '#a01030'];
const LEAF = ['#3eb84a', '#9aff7a', '#e0ffc8'];
const GHOST = ['#3affc8', '#c8fff0', '#1aa888'];
const BONE = ['#ece4cc', '#a89a7a', '#fffaf0'];
const FIRE = ['#ff4a1a', '#ffa020', '#fff27a'];
const SEASON = ['#ffa0c8', '#ffe04a', '#ff8a2a', '#f4faff'];

// ───────────── え の ぶひん ─────────────
function softGlow(x, cx, cy, r, col, a) {
  if (!(r > 0)) return;
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, col);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.globalAlpha = a;
  x.fillStyle = g;
  x.fillRect(cx - r, cy - r, r * 2, r * 2);
}
function disc(x, cx, cy, r, col) {
  if (!(r > 0)) return;
  x.fillStyle = col;
  x.beginPath();
  x.arc(cx, cy, r, 0, Math.PI * 2);
  x.fill();
}
function oval(x, cx, cy, rx, ry, col, rot = 0) {
  if (!(rx > 0) || !(ry > 0)) return;
  x.fillStyle = col;
  x.beginPath();
  x.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
  x.fill();
}
function poly(x, pts, col) {
  x.fillStyle = col;
  x.beginPath();
  pts.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py)));
  x.closePath();
  x.fill();
}
// ほのおの 形（cx, by … ねもと、w … はば、h … たかさ〈マイナスで 下むき〉）
function flameShape(x, cx, by, w, h, col, lean = 0) {
  if (!(w > 0)) return;
  x.fillStyle = col;
  x.beginPath();
  x.moveTo(cx - w / 2, by);
  x.quadraticCurveTo(cx - w * 0.6, by - h * 0.55, cx + lean, by - h);
  x.quadraticCurveTo(cx + w * 0.6, by - h * 0.55, cx + w / 2, by);
  x.quadraticCurveTo(cx, by + Math.abs(h) * 0.25 * Math.sign(h || 1), cx - w / 2, by);
  x.fill();
}
// x0,y0 → x1,y1 の とちゅう（e … 0〜1。hop … 上へ ふくらむ。bend … よこへ ふくらむ）
function along(p, e) {
  const dx = p.x1 - p.x0, dy = p.y1 - p.y0;
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const s = Math.sin(e * Math.PI);
  return [p.x0 + dx * e + nx * (p.bend || 0) * s, p.y0 + dy * e + ny * (p.bend || 0) * s - (p.hop || 0) * s];
}
// はっぱ・花びら（rx・ry … 大きさ、cols … [ふち, なか, すじ]）
function leafShape(x, rx, ry, cols) {
  oval(x, 0, 0, rx, ry, cols[0]);
  oval(x, 0, 0, rx * 0.8, ry * 0.7, cols[1]);
  if (cols[2]) {
    x.strokeStyle = cols[2];
    x.lineWidth = 0.6;
    x.beginPath(); x.moveTo(-rx * 0.8, 0); x.lineTo(rx * 0.8, 0); x.stroke();
  }
}
// もみじ（s … 大きさ）
function maple(x, s, c, cL) {
  const pts = [[0, -1], [0.25, -0.3], [1, -0.4], [0.45, 0.1], [0.7, 0.7], [0, 0.35], [-0.7, 0.7], [-0.45, 0.1], [-1, -0.4], [-0.25, -0.3]];
  poly(x, pts.map(([a, b]) => [a * s, b * s]), c);
  poly(x, pts.map(([a, b]) => [a * s * 0.6, b * s * 0.6]), cL);
}
// ゆきの けっしょう
function snow(x, s, c) {
  x.strokeStyle = c;
  x.lineWidth = Math.max(0.6, s * 0.28);
  x.beginPath();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI;
    x.moveTo(Math.cos(a) * s, Math.sin(a) * s);
    x.lineTo(-Math.cos(a) * s, -Math.sin(a) * s);
  }
  x.stroke();
}
// ほね（まん中の ぼう と りょうはしの こぶ）
function bone(x, s, c, cD) {
  x.strokeStyle = cD;
  x.lineWidth = 2.6 * s;
  x.beginPath(); x.moveTo(-5 * s, 0); x.lineTo(5 * s, 0); x.stroke();
  for (const e of [-1, 1]) for (const k of [-1, 1]) disc(x, e * 5.5 * s, k * 1.5 * s, 1.9 * s, cD);
  x.strokeStyle = c;
  x.lineWidth = 1.5 * s;
  x.beginPath(); x.moveTo(-5 * s, 0); x.lineTo(5 * s, 0); x.stroke();
  for (const e of [-1, 1]) for (const k of [-1, 1]) disc(x, e * 5.5 * s, k * 1.5 * s, 1.3 * s, c);
}

export const DQ_FINE = {
  // おちてくる コイン（y0 → y1 へ fall ms で おちて、ちょっと はねて きえる。くるくる 回る）
  dqCoin(x, p) {
    const fall = p.fall || 260, life = p.life || 520;
    if (p.age > life) return;
    let cx = p.x, cy;
    if (p.age < fall) cy = p.y0 + (p.y1 - p.y0) * easeIn(p.age / fall);
    else {
      const q = (p.age - fall) / (life - fall);
      cy = p.y1 - Math.sin(Math.min(1, q * 1.6) * Math.PI) * 8;
      cx += (p.vx0 || 0) * q * 0.3;
    }
    const a = p.age < fall ? 1 : fadeOut((p.age - fall) / (life - fall), 0.4);
    if (a <= 0) return;
    const r = p.r || 3.2;
    const w = Math.max(0.5, Math.abs(Math.cos(p.age / 55 + (p.ph || 0))) * r);
    x.save();
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a;
    oval(x, cx, cy, w + 0.6, r + 0.6, '#7a4a0a');
    oval(x, cx, cy, w, r, GOLD[0]);
    if (w > 1.2) oval(x, cx - w * 0.2, cy - r * 0.2, w * 0.45, r * 0.55, GOLD[1]);
    x.restore();
  },
  // うずを まく 花びら・はっぱ・ゆき（x0,y0 から とんで きて、cx,cy の まわりを まわりながら ちぢむ）
  // shape … 'rose'・'sakura'・'maple'・'snow'・'sun'・'leaf'、R0 … まわる 大きさ、spin … 回る はやさ、sy … たての つぶれ
  dqSwirl(x, p) {
    const tr = p.travel || 200, life = p.life || 700;
    if (p.age > life) return;
    let px, py;
    const R0 = p.R0 || 26, sy = p.sy || 0.55;
    if (p.age < tr) {
      const e = easeOut(p.age / tr);
      const tx = p.cx + Math.cos(p.a0) * R0, ty = p.cy + Math.sin(p.a0) * R0 * sy;
      px = p.x0 + (tx - p.x0) * e + Math.sin(e * Math.PI) * (p.bend || 0);
      py = p.y0 + (ty - p.y0) * e;
    } else {
      const q = (p.age - tr) / (life - tr);
      const a = p.a0 + q * (p.spin || 6);
      const R = R0 * (1 - 0.7 * easeIn(q));
      px = p.cx + Math.cos(a) * R;
      py = p.cy + Math.sin(a) * R * sy - q * (p.rise || 0);
    }
    const al = fadeOut(p.age / life, 0.75);
    if (al <= 0) return;
    const s = p.s || 1;
    x.save();
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = al;
    x.translate(px, py);
    x.rotate(p.age / 70 + (p.a0 || 0));
    switch (p.shape) {
      case 'rose': x.scale(1, 0.5 + 0.5 * Math.abs(Math.sin(p.age / 90 + p.a0))); leafShape(x, 3.2 * s, 2.2 * s, ['#a01030', ROSE[0], ROSE[1]]); break;
      case 'sakura': x.scale(1, 0.5 + 0.5 * Math.abs(Math.sin(p.age / 90 + p.a0))); leafShape(x, 2.6 * s, 1.9 * s, ['#d0608e', '#ffa0c8', null]); break;
      case 'maple': maple(x, 3.4 * s, '#c0501a', '#ff8a2a'); break;
      case 'snow': snow(x, 3 * s, '#ffffff'); disc(x, 0, 0, 0.9 * s, '#bfe6ff'); break;
      case 'sun': {
        x.rotate(-(p.age / 70 + (p.a0 || 0)));
        x.globalCompositeOperation = 'lighter';
        softGlow(x, 0, 0, 9 * s, 'rgba(255,220,80,0.9)', al * 0.8);
        x.globalAlpha = al;
        x.strokeStyle = '#ffe04a';
        x.lineWidth = 1;
        x.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + p.age / 200;
          x.moveTo(Math.cos(a) * 3.4 * s, Math.sin(a) * 3.4 * s);
          x.lineTo(Math.cos(a) * 5.6 * s, Math.sin(a) * 5.6 * s);
        }
        x.stroke();
        disc(x, 0, 0, 3 * s, '#ffe04a');
        disc(x, -0.8 * s, -0.8 * s, 1.2 * s, '#fffbe0');
        break;
      }
      default: leafShape(x, 3.6 * s, 1.7 * s, ['#1e7a32', LEAF[0], LEAF[1]]);
    }
    x.restore();
  },
  // ゆらゆら おちる 光る はっぱ（y0 → y1。sway … よこの ゆれ）
  dqLeafFall(x, p) {
    const life = p.life || 600;
    if (p.age > life) return;
    const e = clamp01(p.age / (p.fall || life * 0.8));
    const px = p.x + Math.sin(p.age / 120 + (p.ph || 0)) * (p.sway || 6) * (1 - e * 0.5);
    const py = p.y0 + (p.y1 - p.y0) * e;
    const al = fadeIn(p.age / life, 0.15) * fadeOut(p.age / life, 0.7);
    if (al <= 0) return;
    const s = p.s || 1;
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, px, py, 7 * s, 'rgba(150,255,120,0.8)', al * 0.6);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = al;
    x.translate(px, py);
    x.rotate(Math.sin(p.age / 150 + (p.ph || 0)) * 0.9);
    leafShape(x, 3.6 * s, 1.8 * s, ['#1e7a32', LEAF[1], LEAF[2]]);
    x.restore();
  },
  // せかいじゅの かげ（x,y … みきの ねもと。s … 大きさ。うすく 光る）
  dqTree(x, p) {
    const life = p.life || 900;
    const t = p.age / life;
    const a = fadeIn(t, 0.25) * fadeOut(t, 0.6) * (p.alpha || 0.5);
    if (a <= 0) return;
    const s = (p.s || 1) * (0.85 + 0.15 * easeOut(clamp01(t * 3)));
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, p.x, p.y - 40 * s, 64 * s, 'rgba(120,255,120,0.4)', a);
    // みき と は（うすい かげ。うしろの 魔物や みんなが 見える こさ）
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a * 0.55;
    poly(x, [[p.x - 6 * s, p.y], [p.x - 3 * s, p.y - 30 * s], [p.x + 3 * s, p.y - 30 * s], [p.x + 6 * s, p.y], [p.x + 14 * s, p.y + 3 * s], [p.x - 14 * s, p.y + 3 * s]], '#6a4a26');
    const crown = [[0, -44, 22], [-22, -36, 16], [22, -36, 16], [-12, -56, 15], [12, -56, 15], [-30, -28, 11], [30, -28, 11]];
    x.globalAlpha = a * 0.45;
    for (const [dx, dy, r] of crown) disc(x, p.x + dx * s, p.y + dy * s, r * s, '#1e7a32');
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = a * 0.35;
    for (const [dx, dy, r] of crown) disc(x, p.x + (dx - r * 0.25) * s, p.y + (dy - r * 0.3) * s, r * 0.45 * s, '#6aff6a');
    x.restore();
  },
  // おにび（x0,y0 → x1,y1 へ ゆらゆら とんで、ついたら ボッと もえる。burn … もえる じかん）
  dqWisp(x, p) {
    const tr = p.travel || 360, burn = p.burn || 340;
    if (p.age > tr + burn) return;
    const s = p.s || 1;
    x.save();
    if (p.age < tr) {
      const e = p.age / tr;
      const ee = e * e * (3 - 2 * e);
      const [bx, by] = along(p, ee);
      const dx = p.x1 - p.x0, dy = p.y1 - p.y0;
      const L = Math.hypot(dx, dy) || 1;
      const w = Math.sin(e * Math.PI * 3 + (p.ph || 0)) * (p.wave || 8) * (1 - e);
      const cx = bx + (-dy / L) * w, cy = by + (dx / L) * w;
      // しっぽ
      x.globalCompositeOperation = 'lighter';
      for (let i = 4; i >= 1; i--) {
        const e2 = Math.max(0, ee - i * 0.04);
        const [tx, ty] = along(p, e2);
        x.globalAlpha = 0.12 * (5 - i);
        disc(x, tx, ty, (3.4 - i * 0.5) * s, GHOST[2]);
      }
      softGlow(x, cx, cy, 10 * s, 'rgba(60,255,200,0.9)', 0.8);
      x.globalAlpha = 1;
      const fl = 1 + Math.sin(p.age / 30) * 0.12;
      flameShape(x, cx, cy + 3 * s, 7 * s, 11 * s * fl, GHOST[2]);
      flameShape(x, cx, cy + 3 * s, 4.8 * s, 8 * s * fl, GHOST[0]);
      flameShape(x, cx, cy + 3 * s, 2.4 * s, 5 * s * fl, GHOST[1]);
    } else {
      const q = (p.age - tr) / burn;
      const a = fadeOut(q, 0.5);
      const h = 14 + 16 * easeOut(clamp01(q * 3));
      x.globalCompositeOperation = 'lighter';
      softGlow(x, p.x1, p.y1 - 6 * s, 22 * s, 'rgba(60,255,200,0.8)', a * 0.8);
      x.globalAlpha = a;
      for (const [dx, k] of [[-6, 0.7], [6, 0.75], [0, 1]]) {
        const fl = 1 + Math.sin(p.age / 25 + dx) * 0.1;
        flameShape(x, p.x1 + dx * s, p.y1 + 6 * s, 9 * s * k, h * s * k * fl, GHOST[2], Math.sin(p.age / 40 + dx) * 2);
        flameShape(x, p.x1 + dx * s, p.y1 + 6 * s, 6 * s * k, h * 0.75 * s * k * fl, GHOST[0]);
        flameShape(x, p.x1 + dx * s, p.y1 + 6 * s, 3 * s * k, h * 0.45 * s * k * fl, GHOST[1]);
      }
    }
    x.restore();
  },
  // くるくる 回る ほね（とぶ: x0,y0 → x1,y1。はじける: x,y から vx,vy・g）
  dqBone(x, p) {
    const life = p.life || 400;
    if (p.age > life) return;
    let cx, cy;
    if (p.travel) {
      const e = clamp01(p.age / p.travel);
      [cx, cy] = along(p, e);
      if (p.age > p.travel) return;
    } else {
      const t = p.age / 1000;
      cx = p.x + (p.bvx || 0) * t;
      cy = p.y + (p.bvy || 0) * t + 0.5 * (p.bg || 300) * t * t;
    }
    const a = p.travel ? 1 : fadeOut(p.age / life, 0.6);
    x.save();
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a;
    x.translate(cx, cy);
    x.rotate(p.age / 45 * (p.spin || 1) + (p.ph || 0));
    bone(x, p.s || 1, BONE[0], '#5a4c3a');
    x.restore();
  },
  // うかぶ がいこつの かお（赤い め。あごが ガクッ と ひらく）
  dqSkull(x, p) {
    const life = p.life || 520;
    const t = p.age / life;
    const a = fadeIn(t, 0.2) * fadeOut(t, 0.6) * 0.9;
    if (a <= 0) return;
    const s = (p.s || 1) * (0.8 + 0.3 * easeOut(clamp01(t * 2.5)));
    const jaw = Math.sin(clamp01(t * 2) * Math.PI) * 4 * s;
    x.save();
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a;
    const X = p.x, Y = p.y;
    oval(x, X, Y, 14 * s, 13 * s, '#5a4c3a');
    oval(x, X, Y - 0.5 * s, 13 * s, 12 * s, BONE[0]);
    poly(x, [[X - 8 * s, Y + 8 * s + jaw], [X + 8 * s, Y + 8 * s + jaw], [X + 6 * s, Y + 15 * s + jaw], [X - 6 * s, Y + 15 * s + jaw]], BONE[0]);
    x.fillStyle = '#2a1a2a';
    for (let i = -2; i <= 2; i++) x.fillRect(X + i * 3 * s - 0.5, Y + 8 * s + jaw, 1, 4 * s);
    oval(x, X - 5 * s, Y + 1 * s, 4 * s, 4.4 * s, '#1a1026');
    oval(x, X + 5 * s, Y + 1 * s, 4 * s, 4.4 * s, '#1a1026');
    poly(x, [[X - 1.5 * s, Y + 7 * s], [X + 1.5 * s, Y + 7 * s], [X, Y + 4.5 * s]], '#1a1026');
    x.globalCompositeOperation = 'lighter';
    softGlow(x, X - 5 * s, Y + 1.5 * s, 5 * s, 'rgba(255,60,60,0.95)', a);
    softGlow(x, X + 5 * s, Y + 1.5 * s, 5 * s, 'rgba(255,60,60,0.95)', a);
    x.globalAlpha = a;
    disc(x, X - 5 * s, Y + 1.5 * s, 1.4 * s, '#ffb0a0');
    disc(x, X + 5 * s, Y + 1.5 * s, 1.4 * s, '#ffb0a0');
    // かんむり
    x.globalCompositeOperation = 'source-over';
    poly(x, [[X - 9 * s, Y - 9 * s], [X - 9 * s, Y - 16 * s], [X - 4.5 * s, Y - 12 * s], [X, Y - 18 * s], [X + 4.5 * s, Y - 12 * s], [X + 9 * s, Y - 16 * s], [X + 9 * s, Y - 9 * s]], '#f2c14e');
    x.restore();
  },
  // 4つの 季節の わ（ひろがる。4色）
  dqRing4(x, p) {
    const t = p.age / (p.life || 420);
    const a = fadeOut(t, 0.4);
    if (a <= 0) return;
    const r = (p.r0 || 4) + ((p.r1 || 30) - (p.r0 || 4)) * easeOut(t);
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = a;
    x.lineWidth = p.w || 2.4;
    for (let k = 0; k < 4; k++) {
      x.strokeStyle = SEASON[k];
      x.beginPath();
      x.ellipse(p.x, p.y, r, r * (p.sy || 0.5), 0, (k * Math.PI) / 2 + p.age / 150, ((k + 1) * Math.PI) / 2 + p.age / 150);
      x.stroke();
    }
    x.restore();
  },
  // 宝箱の 口（上の ふた と 下の はこ。ひらいて → ガブッ と とじる。bite … とじる とき）
  dqJaws(x, p) {
    const life = p.life || 620, bite = p.bite || 320;
    if (p.age > life) return;
    const s = p.s || 1;
    const t = p.age;
    // ひらく → とじる
    let open;
    if (t < bite * 0.55) open = easeOut(t / (bite * 0.55));
    else if (t < bite) open = 1 - easeIn((t - bite * 0.55) / (bite * 0.45));
    else open = 0;
    const a = fadeIn(t / life, 0.12) * (t > bite ? fadeOut((t - bite) / (life - bite), 0.45) : 1);
    if (a <= 0) return;
    const shake = t > bite && t < bite + 120 ? Math.sin(t / 12) * 1.5 : 0;
    const X = p.x + shake, Y = p.y;
    const w = 22 * s, gap = 3 * s + open * 9 * s;
    x.save();
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a;
    // 口の 中
    if (open > 0.05) {
      x.fillStyle = '#2a0a14';
      x.fillRect(X - w + 1, Y - gap, w * 2 - 2, gap * 2);
      // した
      oval(x, X + 4 * s, Y + gap * 0.6, 8 * s, Math.max(1, gap * 0.45), '#e8506a');
    }
    // した の キバ と はこ
    const by = Y + gap;
    x.fillStyle = '#6a1414'; x.fillRect(X - w, by, w * 2, 12 * s);
    x.fillStyle = '#b8302a'; x.fillRect(X - w + 1, by + 1, w * 2 - 2, 10 * s);
    x.fillStyle = '#f2c14e'; x.fillRect(X - w, by + 4 * s, w * 2, 2 * s);
    for (let i = 0; i < 6; i++) poly(x, [[X - w + 2 + i * (w * 2 - 4) / 6, by], [X - w + 2 + (i + 1) * (w * 2 - 4) / 6, by], [X - w + 2 + (i + 0.5) * (w * 2 - 4) / 6, by - 5 * s]], '#fffaf0');
    // 上の キバ と ふた
    const ty = Y - gap;
    x.fillStyle = '#6a1414'; x.fillRect(X - w - 1, ty - 12 * s, w * 2 + 2, 12 * s);
    x.fillStyle = '#b8302a'; x.fillRect(X - w, ty - 11 * s, w * 2, 10 * s);
    x.fillStyle = '#f2c14e'; x.fillRect(X - w - 1, ty - 4 * s, w * 2 + 2, 2 * s);
    x.fillRect(X - 2 * s, ty - 9 * s, 4 * s, 4 * s);
    for (let i = 0; i < 5; i++) poly(x, [[X - w + 4 + i * (w * 2 - 8) / 5, ty], [X - w + 4 + (i + 1) * (w * 2 - 8) / 5, ty], [X - w + 4 + (i + 0.5) * (w * 2 - 8) / 5, ty + 6 * s]], '#fffaf0');
    // 中で 光る め
    if (open > 0.3) {
      disc(x, X - 7 * s, Y - gap * 0.3, 1.8 * s, '#ffe040');
      disc(x, X + 7 * s, Y - gap * 0.3, 1.8 * s, '#ffe040');
    }
    x.restore();
  },
  // 大きな 竜の かげ（x,y … あたま。s … 大きさ。back … うしろすがた〈め・口の 光 なし〉。breath … 口を あける とき）
  dqDragon(x, p) {
    const life = p.life || 1300;
    const t = p.age / life;
    const a = fadeIn(t, 0.22) * fadeOut(t, 0.72);
    if (a <= 0) return;
    const s = (p.s || 1) * (0.9 + 0.1 * easeOut(clamp01(t * 3)));
    const rise = (1 - easeOut(clamp01(t * 3))) * 14 * (p.back ? 1 : -1);
    const X = p.x, Y = p.y + rise;
    const flap = Math.sin(p.age / 160) * 6 * s;
    const P = (pts) => pts.map(([px, py]) => [X + px * s, Y + py * s]);
    x.save();
    x.globalCompositeOperation = 'source-over';
    // まわりの もや
    softGlow(x, X, Y + 30 * s, 90 * s, 'rgba(90,30,140,0.55)', a * 0.7);
    x.globalAlpha = a * 0.88;
    const body = '#1c0c2c', rim = '#7a3ab0';
    // つばさ（りょうがわ）
    for (const k of [-1, 1]) {
      const wing = [[14, 22], [56, -18 - flap / s], [100, -8 - flap / s], [92, 10], [82, 16], [74, 34], [60, 30], [48, 48], [22, 46]].map(([px, py]) => [px * k, py]);
      poly(x, P(wing), body);
      x.strokeStyle = rim;
      x.lineWidth = 1.2;
      x.beginPath();
      P(wing).forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py)));
      x.stroke();
      // ほね
      x.beginPath();
      for (const [ex, ey] of [[100, -8 - flap / s], [82, 16], [60, 30], [48, 48]]) { x.moveTo(X + 16 * k * s, Y + 22 * s); x.lineTo(X + ex * k * s, Y + ey * s); }
      x.stroke();
    }
    // しっぽ（よこに うねる）
    const sw = Math.sin(p.age / 200) * 8;
    x.strokeStyle = body;
    x.lineCap = 'round';
    x.lineWidth = 9 * s;
    x.beginPath(); x.moveTo(X + 10 * s, Y + 70 * s); x.quadraticCurveTo(X + (46 + sw) * s, Y + 86 * s, X + (66 + sw) * s, Y + 66 * s); x.stroke();
    poly(x, P([[62 + sw, 60], [80 + sw, 56], [70 + sw, 74]]), body);
    // からだ・くび（せなかの トゲ）
    oval(x, X, Y + 46 * s, 22 * s, 32 * s, body);
    poly(x, P([[-9, 4], [9, 4], [13, 26], [-13, 26]]), body);
    for (let i = 0; i < 4; i++) poly(x, P([[-3, 8 + i * 9], [0, 2 + i * 9], [3, 8 + i * 9]]), rim);
    // あたま（大きく。ほお の ひれ・長い つの・はなさき）
    for (const k of [-1, 1]) {
      poly(x, P([[k * 12, -2], [k * 26, -6], [k * 22, 2], [k * 26, 8], [k * 12, 6]]), body);
      poly(x, P([[k * 9, -8], [k * 22, -26], [k * 30, -40], [k * 24, -22], [k * 5, -12]]), body);
    }
    oval(x, X, Y - 1 * s, 16 * s, 13 * s, body);
    oval(x, X, Y + 11 * s, 10 * s, 9 * s, body);
    x.strokeStyle = rim;
    x.lineWidth = 1;
    x.beginPath(); x.ellipse(X, Y - 1 * s, 16 * s, 13 * s, 0, Math.PI * 1.08, Math.PI * 1.92); x.stroke();
    for (const k of [-1, 1]) { x.beginPath(); x.moveTo(X + k * 9 * s, Y - 8 * s); x.lineTo(X + k * 22 * s, Y - 26 * s); x.lineTo(X + k * 30 * s, Y - 40 * s); x.stroke(); }
    if (!p.back) { disc(x, X - 3 * s, Y + 15 * s, 1.1 * s, rim); disc(x, X + 3 * s, Y + 15 * s, 1.1 * s, rim); }
    if (!p.back) {
      // め（光る）・口
      x.globalCompositeOperation = 'lighter';
      for (const k of [-1, 1]) {
        softGlow(x, X + k * 6 * s, Y - 2 * s, 6 * s, 'rgba(255,200,40,0.95)', a);
        x.globalAlpha = a;
        oval(x, X + k * 6 * s, Y - 2 * s, 2.6 * s, 1.4 * s, '#fff27a', k * 0.3);
      }
      const br = p.breath || 600;
      if (p.age > br - 220) {
        const q = clamp01((p.age - (br - 220)) / 220);
        softGlow(x, X, Y + 16 * s, 14 * s * q, 'rgba(255,140,40,0.95)', a);
      }
    } else {
      const br = p.breath || 600;
      if (p.age > br - 220) {
        x.globalCompositeOperation = 'lighter';
        const q = clamp01((p.age - (br - 220)) / 220);
        softGlow(x, X, Y - 6 * s, 16 * s * q, 'rgba(255,140,40,0.9)', a);
      }
    }
    x.restore();
  },
  // のびる 炎の いき（travel … さきまで とどく じかん。r0 → r1 … 出どころ → さきの ふとさ）
  dqBreath(x, p) {
    const life = p.life || 600, tr = p.travel || 240;
    const head = clamp01(p.age / tr);
    const tail = clamp01((p.age - (life - tr)) / tr);
    if (head <= tail) return;
    const dx = p.x1 - p.x0, dy = p.y1 - p.y0;
    const L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    const n = Math.max(6, Math.round(L / 3));
    x.save();
    x.globalCompositeOperation = 'lighter';
    FIRE.forEach((c, ci) => {
      const k = 1 - ci * 0.32;
      x.globalAlpha = ci === 0 ? 0.75 : 1;
      x.fillStyle = c;
      for (let i = 0; i <= n; i++) {
        const u = tail + (head - tail) * (i / n);
        const wob = Math.sin(p.age / 45 + i * 1.3 + (p.seed || 0)) * 2 * u;
        const r = ((p.r0 || 2) + ((p.r1 || 8) - (p.r0 || 2)) * u) * k * (0.85 + 0.15 * Math.sin(i * 2.1 + p.age / 30));
        if (r <= 0.2) continue;
        x.beginPath();
        x.arc(p.x0 + dx * u + nx * wob, p.y0 + dy * u + ny * wob, r, 0, Math.PI * 2);
        x.fill();
      }
    });
    x.restore();
  },
  // からくりの 赤い 目の きらめき
  dqEye(x, p) {
    const t = p.age / (p.life || 260);
    const a = fadeIn(t, 0.2) * fadeOut(t, 0.5);
    if (a <= 0) return;
    const r = (p.r || 6) * (0.6 + 0.6 * Math.sin(clamp01(t) * Math.PI));
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, p.x, p.y, r * 2.4, 'rgba(255,40,40,0.95)', a);
    x.globalAlpha = a;
    x.strokeStyle = '#ffb0a0';
    x.lineWidth = 1;
    x.beginPath();
    x.moveTo(p.x - r * 2.2, p.y); x.lineTo(p.x + r * 2.2, p.y);
    x.moveTo(p.x, p.y - r * 1.4); x.lineTo(p.x, p.y + r * 1.4);
    x.stroke();
    disc(x, p.x, p.y, r * 0.4, '#ffffff');
    x.restore();
  },
};

// ───────────── エフェクト ─────────────
// fx: Effects（battlefx.js）  targets: [{ x, y }]  W・H: がめんの 大きさ
// opts: { crit, fromAlly, from: { x, y }（出どころ。ないときは がめんの 下の まん中） }
export function playDqmFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  if (!DQ_ANIMS.has(anim) || !targets || !targets.length) return false;
  const pts = targets.filter((t) => t && Number.isFinite(t.x) && Number.isFinite(t.y));
  if (!pts.length) return false;
  const crit = !!opts.crit;
  const all = pts.length > 1;
  // 敵が みんなに つかう ときは、がめんの てまえ（大きく 見える）
  const foe = opts.fromAlly === false;
  const sz = (all ? 0.85 : 1) * (foe ? 1.2 : 1) * (crit ? 1.15 : 1);
  const src = opts.from && Number.isFinite(opts.from.x) && Number.isFinite(opts.from.y) ? { x: opts.from.x, y: opts.from.y } : { x: W / 2, y: H + 6 };
  const from = { x: src.x, y: Math.min(H - 10, src.y) };
  const each = (fn) => pts.forEach((t, i) => fn(t, i, all ? i * 60 : 0));
  const hitMark = (t, d, cols, r = 14) => {
    fx.impact(t.x, t.y, { r: r * sz, color: '#ffffff', delay: d });
    fx.sparks(t.x, t.y, { colors: ['#ffffff', ...cols], n: all ? 8 : 12, speed: 140, delay: d, life: 340, len: 6 });
  };
  const cx = pts.reduce((s, t) => s + t.x, 0) / pts.length;
  const cy = pts.reduce((s, t) => s + t.y, 0) / pts.length;
  // あいてが 出どころより 上（味方 → 敵）か
  const up = cy < from.y - 4;
  switch (anim) {
    case 'dq_gold_rain': {
      // ゴールドぷるりん: 空から 金の コインが ジャラジャラ
      fx.sparks(from.x, from.y, { colors: GOLD, n: 8, speed: 80, ang: -Math.PI / 2, spread: 0.8, life: 300 });
      each((t, i, d) => {
        const top = Math.max(-6, t.y - 70);
        fx.glow(t.x, top + 6, { color: '#fff2a0', r: 22 * sz, delay: d, life: 360, alpha: 0.6 });
        const n = all ? 7 : 10;
        for (let k = 0; k < n; k++) {
          fx.add({ kind: 'dqCoin', x: t.x + rnd(-14, 14) * sz, y0: top + rnd(-6, 6), y1: t.y + rnd(-4, 8), fall: rnd(200, 260), r: rnd(2.6, 3.6) * sz, ph: rnd(0, 6), vx0: rnd(-20, 20), life: 560, delay: d + k * 24 });
        }
        fx.glow(t.x, t.y, { color: '#ffd23a', r: 26 * sz, delay: d + 400, life: 320 });
        hitMark(t, d + 420, GOLD, 16);
        for (let k = 0; k < 4; k++) fx.twinkle(t.x + rnd(-14, 14), t.y + rnd(-12, 6), { color: k % 2 ? '#fff6b0' : '#ffffff', size: rnd(3, 6), delay: d + 430 + k * 50, life: 300 });
      });
      fx.hitStop(crit ? 160 : 100, 420, 1.2);
      return true;
    }
    case 'dq_rose_storm': {
      // ローズクイーン: バラの 花びらの うず → トゲの きりさき
      fx.tintAt('rgba(80, 0, 20, 0.28)', 1100);
      fx.add({ kind: 'dqSwirl', shape: 'rose', x0: from.x, y0: from.y, cx: from.x, cy: from.y - 4, a0: 0, R0: 10, travel: 1, spin: 4, s: 1.2, life: 300 });
      each((t, i, d) => {
        const n = all ? 9 : 14;
        for (let k = 0; k < n; k++) {
          fx.add({ kind: 'dqSwirl', shape: 'rose', x0: from.x + rnd(-8, 8), y0: from.y + rnd(-4, 4), cx: t.x, cy: t.y, a0: (k / n) * Math.PI * 2, R0: 26 * sz, sy: 0.55, bend: rnd(-30, 30), travel: 220, spin: 7, s: rnd(1, 1.4) * sz, life: 680, delay: d + k * 12 });
        }
        for (let k = 0; k < 3; k++) fx.cut(t.x + rnd(-6, 6), t.y + rnd(-6, 6), { ang: 0.5 + k * 1.1, len: 26 * sz, w: 1.6, color: '#e8ffd0', glow: '#3e9a3a', delay: d + 440 + k * 60, life: 220 });
        fx.glow(t.x, t.y, { color: '#ff4a6a', r: 30 * sz, delay: d + 440, life: 360, alpha: 0.7 });
        hitMark(t, d + 460, ROSE, 14);
        for (let k = 0; k < 6; k++) fx.petal(t.x + rnd(-10, 10), t.y + rnd(-6, 6), { color: ROSE[k % 3], vx: rnd(-70, 70), vy: rnd(-90, -30), size: rnd(1.6, 2.4), delay: d + 470, life: 600 });
      });
      fx.hitStop(crit ? 180 : 110, 460, 1.3);
      return true;
    }
    case 'dq_world_tree': {
      // せかいじゅの子: 大きな 木の かげ と 光る はっぱが ふりそそいで 回復（あいては 味方。敵が 敵に かけても おなじ）
      fx.tintAt('rgba(20, 70, 20, 0.22)', 1100);
      fx.add({ kind: 'dqTree', x: cx, y: Math.min(H - 4, cy + 4), s: (all ? 1.15 : 0.9) * (foe ? 1.1 : 1), alpha: 0.55, life: 1150 });
      fx.converge(from.x, from.y, { colors: LEAF, n: 10, r: 26, life: 300 });
      each((t, i, d) => {
        const top = Math.max(-4, t.y - 64);
        for (let k = 0; k < (all ? 6 : 9); k++) {
          fx.add({ kind: 'dqLeafFall', x: t.x + rnd(-16, 16), y0: top + rnd(-8, 8), y1: t.y + rnd(-4, 6), fall: rnd(380, 460), sway: rnd(4, 9), ph: rnd(0, 6), s: rnd(0.9, 1.3) * sz, life: 640, delay: d + 60 + k * 30 });
        }
        fx.glow(t.x, t.y, { color: '#8aff8a', r: 30 * sz, delay: d + 500, life: 460, alpha: 0.85 });
        fx.shock(t.x, t.y + 6, { r0: 4, r1: 34 * sz, sy: 0.4, color: '#c8ffb0', w: 1.6, delay: d + 500, life: 380 });
        fx.sparks(t.x, t.y + 6, { colors: LEAF, n: all ? 8 : 12, speed: 60, ang: -Math.PI / 2, spread: 0.7, g: -60, delay: d + 520, life: 520, size: 1.2 });
        for (let k = 0; k < 4; k++) fx.twinkle(t.x + rnd(-12, 12), t.y + rnd(-10, 6), { color: k % 2 ? '#e0ffc8' : '#ffffff', size: rnd(3, 5), vy: -20, delay: d + 520 + k * 60, life: 360 });
      });
      return true;
    }
    case 'dq_lantern': {
      // ランタンゴースト: 青みどりの おにびが ゆらゆら とんで ボッと もえる
      fx.tintAt('rgba(0, 30, 40, 0.35)', 1100);
      fx.glow(from.x, from.y, { color: '#3affc8', r: 16, life: 360 });
      each((t, i, d) => {
        for (let k = 0; k < 2; k++) {
          fx.add({ kind: 'dqWisp', x0: from.x + (k ? 8 : -8), y0: from.y - 4, x1: t.x + (k ? 5 : -5), y1: t.y, bend: (k ? 1 : -1) * 18, wave: 7, ph: k * 2, travel: 420, burn: 360, s: (k ? 0.9 : 1.1) * sz, life: 780, delay: d + k * 50 });
        }
        fx.sparks(t.x, t.y + 6, { colors: GHOST, n: all ? 8 : 14, speed: 70, ang: -Math.PI / 2, spread: 0.8, g: -120, drag: 0.96, delay: d + 470, life: 520, size: 1.3 });
        hitMark(t, d + 480, GHOST.slice(0, 2), 14);
      });
      fx.hitStop(crit ? 160 : 100, 480, 1.2);
      return true;
    }
    case 'dq_bone_king': {
      // がいこつ王: ほねが くるくる とんで、がいこつの かおが うかんで ほねが はじける
      fx.tintAt('rgba(30, 10, 40, 0.35)', 1000);
      each((t, i, d) => {
        for (let k = 0; k < 3; k++) fx.add({ kind: 'dqBone', x0: from.x + rnd(-6, 6), y0: from.y, x1: t.x + rnd(-6, 6), y1: t.y + rnd(-6, 4), hop: rnd(10, 24), bend: (k - 1) * 14, travel: 300, spin: k % 2 ? 1 : -1, s: 0.9 * sz, life: 300, delay: d + k * 50 });
        fx.add({ kind: 'dqSkull', x: t.x, y: t.y - 6, s: 1.1 * sz, life: 560, delay: d + 260 });
        for (let k = 0; k < (all ? 5 : 8); k++) {
          const a = rnd(-Math.PI, 0);
          fx.add({ kind: 'dqBone', x: t.x, y: t.y, bvx: Math.cos(a) * rnd(60, 120), bvy: Math.sin(a) * rnd(60, 130), bg: 320, spin: k % 2 ? 1.4 : -1.4, ph: rnd(0, 6), s: rnd(0.5, 0.8) * sz, life: 600, delay: d + 420 });
        }
        fx.shock(t.x, t.y + 6, { r0: 6, r1: 44 * sz, sy: 0.45, color: '#e8d8ff', w: 2.2, delay: d + 420, life: 380 });
        for (let k = 0; k < 4; k++) fx.puff(t.x + (k - 1.5) * 8, t.y + 8, { color: '#c8c0b0', r0: 3, r1: 11, vx: (k - 1.5) * 18, vy: -14, life: 480, alpha: 0.45, delay: d + 430 });
        hitMark(t, d + 420, BONE, 18);
      });
      fx.hitStop(crit ? 200 : 140, 420, 1.6);
      return true;
    }
    case 'dq_seasons': {
      // こよみのせいれい: さくら → たいよう → もみじ → ゆき が うずを まいて あつまる
      fx.add({ kind: 'dqRing4', x: from.x, y: from.y, r0: 4, r1: 30, sy: 0.5, w: 2.4, life: 480 });
      const shapes = ['sakura', 'sun', 'maple', 'snow'];
      each((t, i, d) => {
        for (let k = 0; k < 4; k++) {
          const m = k === 1 ? 1 : all ? 3 : 4;
          for (let j = 0; j < m; j++) {
            const a0 = (k * Math.PI) / 2 + (j / m) * 0.9;
            fx.add({ kind: 'dqSwirl', shape: shapes[k], x0: from.x, y0: from.y, cx: t.x, cy: t.y, a0, R0: 30 * sz, sy: 0.55, bend: (k % 2 ? 1 : -1) * 20, travel: 240, spin: 6.5, rise: 0, s: (k === 1 ? 1.2 : 1.1) * sz, life: 560 + (3 - k) * 30, delay: d + k * 70 + j * 20 });
          }
        }
        fx.add({ kind: 'dqRing4', x: t.x, y: t.y + 4, r0: 4, r1: 46 * sz, sy: 0.45, w: 2.6, life: 440, delay: d + 640 });
        fx.glow(t.x, t.y, { color: '#fff6c8', r: 30 * sz, delay: d + 630, life: 380 });
        hitMark(t, d + 640, SEASON, 18);
      });
      fx.flashAt(80, '#fffbe8', 640);
      fx.hitStop(crit ? 180 : 120, 640, 1.4);
      return true;
    }
    case 'dq_killer_slash': {
      // キラーからくり: 赤い 目が 光って、2本の きりさきが ×の 字
      fx.add({ kind: 'dqEye', x: from.x, y: from.y - 6, r: 5, life: 240 });
      each((t, i, d) => {
        fx.speedLines(t.x, t.y, { delay: d + 80, r1: 70 * sz, life: 200, color: '#c8d8ff' });
        fx.cut(t.x, t.y, { ang: 0.8, len: 46 * sz, w: 2.6, color: '#ffffff', glow: '#7aa8ff', delay: d + 100, life: 280, speed: 50 });
        fx.cut(t.x, t.y, { ang: Math.PI - 0.8, len: 46 * sz, w: 2.6, color: '#ffffff', glow: '#ff6a6a', delay: d + 190, life: 280, speed: 50 });
        fx.add({ kind: 'dqEye', x: t.x, y: t.y, r: 4 * sz, life: 220, delay: d + 190 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#c8ccd8', '#7aa8ff'], n: all ? 10 : 16, speed: 170, delay: d + 200, life: 320, len: 7 });
        hitMark(t, d + 200, ['#c8ccd8', '#ff6a6a'], 16);
      });
      fx.hitStop(crit ? 200 : 130, 200, 1.5);
      return true;
    }
    case 'dq_chomp': {
      // ひとくい箱: 大きな 宝箱の 口が ガブッ
      fx.sparks(from.x, from.y, { colors: GOLD, n: 5, speed: 60, ang: -Math.PI / 2, spread: 1, life: 260 });
      each((t, i, d) => {
        fx.add({ kind: 'dqJaws', x: t.x, y: t.y - 2, s: 1.15 * sz, bite: 330, life: 640, delay: d });
        fx.impact(t.x, t.y, { r: 22 * sz, color: '#ffffff', delay: d + 330 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#fff0a0', '#e8506a'], n: all ? 10 : 16, speed: 160, delay: d + 340, life: 360 });
        fx.speedLines(t.x, t.y, { delay: d + 330, r1: 64 * sz, life: 220 });
        hitMark(t, d + 340, ['#e8506a', '#ffd23a'], 16);
      });
      fx.hitStop(crit ? 240 : 170, 340, crit ? 2.4 : 1.9);
      return true;
    }
    case 'dq_dragon_lord': {
      // 竜王のまご: 大きな 竜の かげが あらわれて、敵みんなに ほのお
      fx.tintAt('rgba(30, 0, 40, 0.45)', 1600);
      // 竜の いち: 味方 → 敵 は がめんの 下（うしろすがた）、敵 → みんな は 敵の うしろ（まえむき）
      const head = up ? { x: W / 2, y: H - 42 } : { x: Math.min(W - 60, Math.max(60, from.x)), y: Math.max(28, Math.min(from.y - 30, 50)) };
      const ds = up ? 0.95 : 1.05;
      const mouth = up ? { x: head.x, y: head.y - 6 * ds } : { x: head.x, y: head.y + 16 * ds };
      fx.add({ kind: 'dqDragon', x: head.x, y: head.y, s: ds, back: up, breath: 560, life: 1450 });
      fx.converge(mouth.x, mouth.y, { colors: FIRE, n: 14, r: 34, delay: 280, life: 280 });
      each((t, i, d) => {
        fx.add({ kind: 'dqBreath', x0: mouth.x, y0: mouth.y, x1: t.x, y1: t.y, travel: 260, r0: 4, r1: 11 * sz, seed: i * 3, life: 700, delay: 560 + d });
        fx.glow(t.x, t.y, { color: '#ff7a2a', r: 40 * sz, delay: 800 + d, life: 520, alpha: 0.85 });
        fx.sparks(t.x, t.y + 10, { colors: [...FIRE, '#fff6c0'], n: all ? 12 : 22, speed: 100, ang: -Math.PI / 2, spread: 0.8, g: -150, drag: 0.96, delay: 820 + d, life: 560, size: 1.4 });
        for (let k = 0; k < 3; k++) fx.puff(t.x + (k - 1) * 10, t.y - 4, { color: '#3a2a2a', r0: 3, r1: 12, vy: -18, life: 520, alpha: 0.4, delay: 880 + d });
        hitMark(t, 820 + d, FIRE, 20);
      });
      fx.flashAt(120, '#ffd8a0', 820);
      fx.hitStop(crit ? 260 : 200, 820, crit ? 2.4 : 2);
      return true;
    }
  }
  return false;
}
