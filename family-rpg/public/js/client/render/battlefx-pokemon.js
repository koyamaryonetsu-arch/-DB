// 第44回: ポケモン（第1だん）の 技の エフェクト（技の データの anim に ここの なまえを 書く。例 anim: 'pk_spark'）
// battlefx.js の play() の いちばん はじめに よばれる（ここに ない anim なら false を かえす）。
// ・味方の ポケモンが 敵に つかう … opts.from は 味方の いち（がめんの 下）。敵に むかって とぶ
// ・敵の ポケモンが みんなに つかう … battle.js が みんなの いち（がめんの 下）を targets に、敵の まん中を opts.from に して よぶ
//   （どちらでも 出どころ → あいての むきで かくので、上むきでも 下むきでも 形が くずれない）
//
//  pk_spark    でんきショック … 小さな いなずまが ピリッ
//  pk_thunder  10まんボルト・かみなり … がめんが くらく なって、空から 太い いなずまが 3本
//  pk_quick    でんこうせっか … 白い 光の すじが すごい はやさで つっこむ
//  pk_ember    ひのこ … 小さな 火の玉が 3つ ぽんぽん
//  pk_flame    かえんほうしゃ・だいもんじ … 炎が ゴーッと のびて、あたった ところに「大」の 字の 火
//  pk_water    みずでっぽう … 水の すじが ビュッ・しぶき
//  pk_hydro    ハイドロポンプ … 太い 水の 大ほうが 2本・大きな しぶき
//  pk_leaf     はっぱカッター … くるくる 回る はっぱが 弧を えがいて つぎつぎ
//  pk_solar    ソーラービーム … 光を あつめて（ためる）、太い 光の ビーム
//  pk_shadow   シャドーボール … こい むらさきの たまを ためて なげる
//  pk_psychic  サイコキネシス … ピンクの なみの わが ぐにゃぐにゃ ひろがる
//  pk_bodyslam のしかかり・ギガインパクト … 空から 大きな かげが ドスン（がめんが ゆれる）
// ・どれも 2びょう いないで おわる。あたる じかんは PK_HIT（battle.js の HIT_DELAY に まぜる）
// ・音は PK_SFX（anim と おなじ なまえの 音。sfx-pokemon.js）

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t);
const easeIn = (t) => t * t;
const fadeOut = (t, from = 0.7) => (t < from ? 1 : Math.max(0, 1 - (t - from) / (1 - from)));
// きまった らんすう（いなずまの ギザギザが こまごとに ちらつかない）
const hash = (n) => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); };

export const PK_ANIMS = new Set(['pk_spark', 'pk_thunder', 'pk_quick', 'pk_ember', 'pk_flame', 'pk_water', 'pk_hydro', 'pk_leaf', 'pk_solar', 'pk_shadow', 'pk_psychic', 'pk_bodyslam']);
// あたる じかん（ms。ダメージの 数字を この ときに 出す）
export const PK_HIT = {
  pk_spark: 200, pk_thunder: 440, pk_quick: 170, pk_ember: 380, pk_flame: 330, pk_water: 260, pk_hydro: 320,
  pk_leaf: 400, pk_solar: 700, pk_shadow: 560, pk_psychic: 380, pk_bodyslam: 430,
};
// たたかいの 音（battle.js の ANIM_SFX に まぜる。音そのものは sfx-pokemon.js の SFX_PK）
export const PK_SFX = Object.fromEntries([...PK_ANIMS].map((a) => [a, a]));
// 敵の ポケモンの 技が みんなに あたった ときの まどの えんしゅつ（battle.js の allyFxKind）
export const PK_ALLY_FX = {
  pk_spark: 'bolt', pk_thunder: 'bolt', pk_quick: 'claw', pk_ember: 'fire', pk_flame: 'fire', pk_water: 'ice', pk_hydro: 'ice',
  pk_leaf: 'wind', pk_solar: 'bolt', pk_shadow: 'dark', pk_psychic: 'dark', pk_bodyslam: 'quake',
};

const FIRE = ['#ff4a1a', '#ffa020', '#fff27a'];
const WATER = ['#2a78d8', '#6ac8ff', '#eaf8ff'];
const ELEC = { core: '#fff6b0', glow: '#ffd83a', spark: ['#fff6b0', '#ffe040', '#ffffff'] };
const SHADOW = ['#9a5ae8', '#3a1a5a', '#120818'];
const PSY = ['#ff7ad8', '#ffb0ec', '#ffffff'];
const LEAF = ['#3aa83a', '#8ae070', '#1e6a2a'];

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
function stroke(x, pts) {
  x.beginPath();
  pts.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py)));
  x.stroke();
}
// x0,y0 → x1,y1 の とちゅう（e … 0〜1。hop … 上へ ふくらむ。bend … よこへ ふくらむ）
function along(p, e) {
  const dx = p.x1 - p.x0, dy = p.y1 - p.y0;
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const s = Math.sin(e * Math.PI);
  return [p.x0 + dx * e + nx * (p.bend || 0) * s, p.y0 + dy * e + ny * (p.bend || 0) * s - (p.hop || 0) * s];
}

export const PK_FINE = {
  // ギザギザの いなずま（grow … さきまで のびる じかん。n … おれる 回数。amp … ギザギザの はば）
  pkBolt(x, p) {
    const life = p.life || 300;
    const a = fadeOut(p.age / life, 0.45);
    if (a <= 0) return;
    const k = clamp01(p.age / (p.grow || 1));
    const dx = p.x1 - p.x0, dy = p.y1 - p.y0;
    const L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    const n = p.n || 7;
    const seed = (p.seed || 0) + Math.floor(p.age / 55) * 17;
    const pts = [[p.x0, p.y0]];
    for (let i = 1; i < n; i++) {
      const s = i / n;
      if (s > k) break;
      const j = (hash(seed + i * 7.1) - 0.5) * 2 * (p.amp || 8);
      pts.push([p.x0 + dx * s + nx * j, p.y0 + dy * s + ny * j]);
    }
    pts.push([p.x0 + dx * k, p.y0 + dy * k]);
    const w = p.w || 2;
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.lineJoin = 'miter';
    x.globalAlpha = a * 0.45;
    x.strokeStyle = p.glow || ELEC.glow;
    x.lineWidth = w * 3.2;
    stroke(x, pts);
    x.globalAlpha = a;
    x.strokeStyle = p.core || ELEC.core;
    x.lineWidth = w;
    stroke(x, pts);
    x.strokeStyle = '#ffffff';
    x.lineWidth = Math.max(0.6, w * 0.4);
    stroke(x, pts);
    x.restore();
  },
  // とぶ たま（charge … 出どころで ふくらむ じかん、travel … とぶ じかん。cols … [ひかり, からだ, しん]。dark … しんが くらい）
  pkOrb(x, p) {
    const ch = p.charge || 0, tr = p.travel || 300;
    if (p.age > ch + tr + 20) return;
    const grow = ch ? clamp01(p.age / ch) : 1;
    const e = clamp01((p.age - ch) / tr);
    const [cx, cy] = along(p, e * e * (3 - 2 * e) * 0.3 + e * 0.7);
    const r = (p.r || 3) * (0.35 + 0.65 * easeOut(grow));
    const [gl, body, core] = p.cols || FIRE;
    x.save();
    // しっぽ（前の いち）
    if (e > 0) {
      for (let i = 3; i >= 1; i--) {
        const [tx, ty] = along(p, Math.max(0, e - i * 0.07));
        x.globalAlpha = 0.18 * (4 - i);
        disc(x, tx, ty, r * (1 - i * 0.18), body);
      }
    }
    x.globalCompositeOperation = p.dark ? 'source-over' : 'lighter';
    softGlow(x, cx, cy, r * 2.6, gl, p.dark ? 0.55 : 0.85);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = 1;
    disc(x, cx, cy, r, p.dark ? gl : body);
    disc(x, cx, cy, r * 0.72, p.dark ? body : core);
    if (p.dark) {
      // くろい うずまき
      disc(x, cx + Math.cos(p.age / 60) * r * 0.2, cy + Math.sin(p.age / 60) * r * 0.2, r * 0.42, core);
      x.strokeStyle = gl;
      x.lineWidth = Math.max(0.6, r * 0.18);
      x.beginPath();
      x.arc(cx, cy, r * 0.55, p.age / 70, p.age / 70 + 2.2);
      x.stroke();
    } else disc(x, cx - r * 0.25, cy - r * 0.25, r * 0.3, '#ffffff');
    x.restore();
  },
  // のびる 炎・水の すじ（travel … さきまで とどく じかん。r0 → r1 … 出どころ → さきの ふとさ。cols … そとがわ から）
  pkStream(x, p) {
    const life = p.life || 600, tr = p.travel || 240;
    const head = clamp01(p.age / tr);
    const tail = clamp01((p.age - (life - tr)) / tr);
    if (head <= tail) return;
    const cols = p.cols || FIRE;
    const n = Math.max(6, Math.round(Math.hypot(p.x1 - p.x0, p.y1 - p.y0) / 3));
    const dx = p.x1 - p.x0, dy = p.y1 - p.y0;
    const L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    x.save();
    x.globalCompositeOperation = p.add === false ? 'source-over' : 'lighter';
    cols.forEach((c, ci) => {
      const k = 1 - ci * 0.32;
      x.globalAlpha = ci === 0 ? 0.75 : 1;
      x.fillStyle = c;
      for (let i = 0; i <= n; i++) {
        const u = tail + (head - tail) * (i / n);
        const wob = Math.sin(p.age / 45 + i * 1.3 + (p.seed || 0)) * (p.wob || 1.5) * u;
        const r = ((p.r0 || 2) + ((p.r1 || 6) - (p.r0 || 2)) * u) * k * (0.85 + 0.15 * Math.sin(i * 2.1 + p.age / 30));
        if (r <= 0.2) continue;
        x.beginPath();
        x.arc(p.x0 + dx * u + nx * wob, p.y0 + dy * u + ny * wob, r, 0, Math.PI * 2);
        x.fill();
      }
    });
    x.restore();
  },
  // くるくる 回る はっぱ（x0,y0 → x1,y1。bend … よこへ ふくらむ）
  pkLeaf(x, p) {
    const tr = p.travel || 340;
    if (p.age > tr + 20) return;
    const e = clamp01(p.age / tr);
    const [cx, cy] = along(p, e);
    const s = p.s || 1;
    x.save();
    x.translate(cx, cy);
    x.rotate(p.age / 30 * (p.spin || 1));
    x.globalAlpha = 1;
    x.fillStyle = LEAF[2];
    x.beginPath(); x.ellipse(0, 0, 4.6 * s, 2.2 * s, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = LEAF[0];
    x.beginPath(); x.ellipse(0, 0, 4 * s, 1.6 * s, 0, 0, Math.PI * 2); x.fill();
    x.strokeStyle = LEAF[1];
    x.lineWidth = 0.6;
    x.beginPath(); x.moveTo(-3.6 * s, 0); x.lineTo(3.6 * s, 0); x.stroke();
    x.restore();
  },
  // ふとい 光の ビーム（はじめに ふとく なって、さいごに 細く きえる。w … ふとさ）
  pkBeam(x, p) {
    const life = p.life || 420;
    const t = p.age / life;
    const k = t < 0.2 ? easeOut(t / 0.2) : t > 0.7 ? Math.max(0, 1 - (t - 0.7) / 0.3) : 1;
    if (k <= 0) return;
    const w = (p.w || 8) * k * (1 + Math.sin(p.age / 25) * 0.08);
    const pts = [[p.x0, p.y0], [p.x1, p.y1]];
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.lineCap = 'round';
    x.globalAlpha = 0.45;
    x.strokeStyle = p.glow || '#b8ff7a';
    x.lineWidth = w * 2;
    stroke(x, pts);
    x.globalAlpha = 0.9;
    x.strokeStyle = p.mid || '#fff6a0';
    x.lineWidth = w;
    stroke(x, pts);
    x.globalAlpha = 1;
    x.strokeStyle = '#ffffff';
    x.lineWidth = w * 0.4;
    stroke(x, pts);
    x.restore();
  },
  // ためる 光（r まで ふくらむ。cols … [ひかり, しん]）
  pkCharge(x, p) {
    const t = p.age / (p.life || 500);
    const r = (p.r || 10) * easeOut(clamp01(t * 1.3));
    const a = fadeOut(t, 0.85);
    if (a <= 0) return;
    const [gl, core] = p.cols || ['#fff6a0', '#ffffff'];
    x.save();
    x.globalCompositeOperation = p.dark ? 'source-over' : 'lighter';
    softGlow(x, p.x, p.y, r * 2, gl, a * 0.8);
    x.globalAlpha = a;
    disc(x, p.x, p.y, r * 0.55 * (1 + Math.sin(p.age / 40) * 0.1), core);
    x.restore();
  },
  // サイコキネシスの ぐにゃぐにゃの わ（r0 → r1。sy … たてに つぶす）
  pkRing(x, p) {
    const t = p.age / (p.life || 520);
    const a = fadeOut(t, 0.4);
    if (a <= 0) return;
    const r = (p.r0 || 4) + ((p.r1 || 30) - (p.r0 || 4)) * easeOut(t);
    const sy = p.sy || 0.7;
    const pts = [];
    for (let i = 0; i <= 28; i++) {
      const q = (i / 28) * Math.PI * 2;
      const rr = r * (1 + 0.12 * Math.sin(q * 5 + p.age / 45));
      pts.push([p.x + Math.cos(q) * rr, p.y + Math.sin(q) * rr * sy]);
    }
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = a * 0.5;
    x.strokeStyle = p.glow || PSY[0];
    x.lineWidth = (p.w || 2) * 2.4;
    stroke(x, pts);
    x.globalAlpha = a;
    x.strokeStyle = p.core || PSY[1];
    x.lineWidth = p.w || 2;
    stroke(x, pts);
    x.restore();
  },
  // でんこうせっかの 光の すじ（あたまが x1,y1 へ。うしろに ながい しっぽ）
  pkStreak(x, p) {
    const tr = p.travel || 160;
    const e = clamp01(p.age / tr);
    const a = fadeOut(p.age / (p.life || 280), 0.6);
    if (a <= 0) return;
    const dx = p.x1 - p.x0, dy = p.y1 - p.y0;
    const L = Math.hypot(dx, dy) || 1;
    const hx = p.x0 + dx * easeIn(e), hy = p.y0 + dy * easeIn(e);
    const len = Math.min(L * easeIn(e), 46);
    const tx = hx - (dx / L) * len, ty = hy - (dy / L) * len;
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.lineCap = 'round';
    x.globalAlpha = a * 0.5;
    x.strokeStyle = p.glow || '#9ad8ff';
    x.lineWidth = (p.w || 3) * 2.4;
    stroke(x, [[tx, ty], [hx, hy]]);
    x.globalAlpha = a;
    x.strokeStyle = '#ffffff';
    x.lineWidth = p.w || 3;
    stroke(x, [[tx, ty], [hx, hy]]);
    softGlow(x, hx, hy, (p.w || 3) * 3, '#ffffff', a * 0.9);
    x.restore();
  },
  // だいもんじ（「大」の 形の 火。s … 大きさ）
  pkFireStar(x, p) {
    const t = p.age / (p.life || 700);
    const a = fadeOut(t, 0.65);
    if (a <= 0) return;
    const s = (p.s || 1) * easeOut(clamp01(t * 3.5));
    const arms = [[0, -1], [-1, -0.12], [1, -0.12], [-0.62, 1], [0.62, 1]];
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, p.x, p.y, 26 * s, 'rgba(255,120,30,0.9)', a * 0.7);
    FIRE.forEach((c, ci) => {
      x.globalAlpha = a * (ci ? 1 : 0.85);
      x.fillStyle = c;
      for (const [ax, ay] of arms) {
        for (let i = 0; i <= 5; i++) {
          const u = i / 5;
          const fl = Math.sin(p.age / 35 + i * 1.7 + ax * 3) * 0.8;
          const r = (4.2 - u * 2.2) * (1 - ci * 0.3) * s;
          if (r <= 0.2) continue;
          x.beginPath();
          x.arc(p.x + ax * 16 * s * u + fl, p.y + ay * 15 * s * u - u * 2 * s, r, 0, Math.PI * 2);
          x.fill();
        }
      }
    });
    x.restore();
  },
  // のしかかり: 空から 大きな まるい かげが おちて くる（あしもとの かげが だんだん こく 大きく）
  pkSlam(x, p) {
    const fall = p.fall || 380;
    const t = p.age;
    const R = (p.r || 16);
    const ground = p.ground ?? p.y + 10;
    x.save();
    // あしもとの かげ
    const k = clamp01(t / fall);
    if (t < fall + 220) {
      x.globalAlpha = 0.25 + 0.4 * k;
      x.fillStyle = '#0a0a18';
      x.beginPath();
      x.ellipse(p.x, ground, R * (0.4 + 0.8 * k), R * 0.28 * (0.4 + 0.8 * k), 0, 0, Math.PI * 2);
      x.fill();
    }
    // おちて くる からだ（さいごは つぶれて きえる）
    if (t < fall) {
      const e = easeIn(clamp01((t - fall * 0.35) / (fall * 0.65)));
      if (t > fall * 0.35) {
        const cy = -R * 2 + (p.y + R * 2) * e;
        x.globalAlpha = 0.85;
        x.fillStyle = p.body || '#2e3a5a';
        x.beginPath(); x.ellipse(p.x, cy, R, R * 1.05, 0, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#ffffff';
        x.globalAlpha = 0.5;
        for (const d of [-0.6, 0, 0.6]) x.fillRect(p.x + d * R - 0.5, cy - R * 2.4, 1, R * 1.2);
      }
    } else if (t < fall + 160) {
      const q = (t - fall) / 160;
      x.globalAlpha = 0.85 * (1 - q);
      x.fillStyle = p.body || '#2e3a5a';
      x.beginPath(); x.ellipse(p.x, p.y + R * 0.3, R * (1.25 + q * 0.3), R * (0.7 - q * 0.3), 0, 0, Math.PI * 2); x.fill();
    }
    x.restore();
  },
};

// ───────────── エフェクト ─────────────
// fx: Effects（battlefx.js）  targets: [{ x, y }]  W・H: がめんの 大きさ
// opts: { crit, fromAlly, from: { x, y }（出どころ。ないときは がめんの 下の まん中） }
export function playPokemonFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  if (!PK_ANIMS.has(anim) || !targets || !targets.length) return false;
  const pts = targets.filter((t) => t && Number.isFinite(t.x) && Number.isFinite(t.y));
  if (!pts.length) return false;
  const crit = !!opts.crit;
  const all = pts.length > 1;
  // 敵が みんなに つかう ときは、がめんの てまえ（大きく 見える）
  const foe = opts.fromAlly === false;
  const sz = (all ? 0.85 : 1) * (foe ? 1.2 : 1) * (crit ? 1.15 : 1);
  const src = opts.from && Number.isFinite(opts.from.x) && Number.isFinite(opts.from.y) ? { x: opts.from.x, y: opts.from.y } : { x: W / 2, y: H + 6 };
  // 出どころが がめんの 下（みかた）の ときは すこし 上から 出す
  const from = { x: src.x, y: Math.min(H - 10, src.y) };
  const each = (fn) => pts.forEach((t, i) => fn(t, i, all ? i * 60 : 0));
  const hitMark = (t, d, cols, r = 14) => {
    fx.impact(t.x, t.y, { r: r * sz, color: '#ffffff', delay: d });
    fx.sparks(t.x, t.y, { colors: ['#ffffff', ...cols], n: all ? 8 : 12, speed: 140, delay: d, life: 340, len: 6 });
  };
  const seed = () => Math.floor(Math.random() * 1000);
  switch (anim) {
    case 'pk_spark': {
      // でんきショック: 小さな いなずまが ピリッ
      fx.sparks(from.x, from.y, { colors: ELEC.spark, n: 6, speed: 60, life: 220 });
      each((t, i, d) => {
        for (let k = 0; k < 2; k++) fx.add({ kind: 'pkBolt', x0: from.x, y0: from.y, x1: t.x + rnd(-3, 3), y1: t.y + rnd(-3, 3), grow: 110, n: 6, amp: 6, w: 1.4 * sz, seed: seed(), life: 300, delay: d + k * 70 });
        fx.glow(t.x, t.y, { color: '#fff6a0', r: 18 * sz, delay: d + 150, life: 260 });
        hitMark(t, d + 170, ELEC.spark, 12);
      });
      return true;
    }
    case 'pk_thunder': {
      // 10まんボルト・かみなり: 空が くらく なって、空から 太い いなずまが 3本
      fx.tintAt('rgba(8, 8, 36, 0.5)', 1000);
      fx.glow(from.x, from.y, { color: '#fff6a0', r: 16, life: 360 });
      fx.sparks(from.x, from.y, { colors: ELEC.spark, n: 10, speed: 90, ang: -Math.PI / 2, spread: 0.9, life: 300 });
      each((t, i, d) => {
        for (let k = 0; k < 3; k++) {
          const sx = t.x + rnd(-18, 18);
          fx.add({ kind: 'pkBolt', x0: sx, y0: -8, x1: t.x + rnd(-4, 4), y1: t.y + 4, grow: 60, n: 9, amp: 10, w: (k ? 2.2 : 3.2) * sz, seed: seed(), life: 380, delay: 320 + d + k * 90 });
        }
        fx.glow(t.x, t.y, { color: '#c8e8ff', r: 40 * sz, delay: 380 + d, life: 420 });
        fx.shock(t.x, t.y + 6, { r0: 6, r1: 46 * sz, sy: 0.4, color: '#fff6b0', w: 2.4, delay: 400 + d, life: 380 });
        hitMark(t, 400 + d, ELEC.spark, 22);
        fx.sparks(t.x, t.y, { colors: ELEC.spark, n: 14, speed: 180, delay: 420 + d, life: 420 });
      });
      fx.flashAt(140, '#fffbe0', 380);
      fx.hitStop(crit ? 220 : 160, 420, 1.7);
      return true;
    }
    case 'pk_quick': {
      // でんこうせっか: 白い 光の すじが すごい はやさで つっこむ
      let px = from.x, py = from.y;
      pts.forEach((t, i) => {
        const d = i * 90;
        fx.add({ kind: 'pkStreak', x0: px, y0: py, x1: t.x, y1: t.y, travel: 150, w: 3 * sz, life: 300, delay: d });
        fx.speedLines(t.x, t.y, { delay: d + 140, r1: 70 * sz, life: 220 });
        hitMark(t, d + 160, ['#9ad8ff', '#fff6b0'], 16);
        px = t.x; py = t.y;
      });
      fx.hitStop(crit ? 180 : 110, 170, 1.3);
      return true;
    }
    case 'pk_ember': {
      // ひのこ: 小さな 火の玉が 3つ ぽんぽん
      each((t, i, d) => {
        for (let k = 0; k < 3; k++) {
          const dd = d + k * 80;
          fx.add({ kind: 'pkOrb', x0: from.x + rnd(-4, 4), y0: from.y, x1: t.x + rnd(-6, 6), y1: t.y + rnd(-4, 6), hop: rnd(14, 26), r: 3.4 * sz, travel: 220, cols: ['rgba(255,120,30,0.95)', '#ffa020', '#fff27a'], life: 260, delay: dd });
          fx.sparks(t.x, t.y, { colors: FIRE, n: 6, speed: 80, ang: -Math.PI / 2, spread: 0.9, g: -80, delay: dd + 220, life: 360 });
          fx.puff(t.x, t.y - 4, { color: '#5a4a4a', r0: 2, r1: 8, vy: -16, life: 420, alpha: 0.4, delay: dd + 240 });
        }
        fx.impact(t.x, t.y, { r: 10 * sz, color: '#fff6c0', delay: d + 380 });
      });
      return true;
    }
    case 'pk_flame': {
      // かえんほうしゃ → あたった ところに「大」の 字の 火（だいもんじ）
      fx.tintAt('rgba(60, 14, 0, 0.3)', 1100);
      each((t, i, d) => {
        fx.add({ kind: 'pkStream', x0: from.x, y0: from.y, x1: t.x, y1: t.y, travel: 260, r0: 3, r1: 9 * sz, wob: 2, cols: FIRE, seed: i, life: 640, delay: d });
        fx.add({ kind: 'pkFireStar', x: t.x, y: t.y, s: 1.25 * sz, life: 800, delay: d + 300 });
        fx.glow(t.x, t.y, { color: '#ff7a2a', r: 36 * sz, delay: d + 300, life: 520, alpha: 0.8 });
        fx.sparks(t.x, t.y + 10, { colors: [...FIRE, '#fff6c0'], n: all ? 12 : 22, speed: 90, ang: -Math.PI / 2, spread: 0.8, g: -150, drag: 0.96, delay: d + 320, life: 560, size: 1.4 });
        hitMark(t, d + 330, FIRE, 16);
      });
      fx.flashAt(90, '#ffd8a0', 320);
      fx.hitStop(crit ? 200 : 130, 330, 1.4);
      return true;
    }
    case 'pk_water': {
      // みずでっぽう: 水の すじが ビュッ・しぶき
      each((t, i, d) => {
        fx.add({ kind: 'pkStream', x0: from.x, y0: from.y, x1: t.x, y1: t.y, travel: 220, r0: 1.4, r1: 4 * sz, wob: 1.2, cols: WATER, add: false, seed: i, life: 520, delay: d });
        for (let k = 0; k < 12; k++) fx.drop(t.x + rnd(-8, 8), t.y + rnd(-4, 4), { color: WATER[k % 3], vx: rnd(-90, 90), vy: rnd(-150, -50), g: 360, size: rnd(1, 1.8), delay: d + 240, life: 520 });
        fx.shock(t.x, t.y + 6, { r0: 4, r1: 30 * sz, sy: 0.35, color: '#bfe6ff', w: 1.6, delay: d + 250, life: 340 });
        hitMark(t, d + 250, ['#9ae6ff'], 12);
      });
      return true;
    }
    case 'pk_hydro': {
      // ハイドロポンプ: 太い 水の 大ほうが 2本・大きな しぶき
      each((t, i, d) => {
        const dx = t.x - from.x, dy = t.y - from.y;
        const L = Math.hypot(dx, dy) || 1;
        const nx = (-dy / L) * 10, ny = (dx / L) * 10;
        for (const s of [-1, 1]) {
          fx.add({ kind: 'pkStream', x0: from.x + nx * s, y0: from.y + ny * s, x1: t.x + nx * s * 0.25, y1: t.y + ny * s * 0.25, travel: 260, r0: 3.5, r1: 10 * sz, wob: 2, cols: WATER, add: false, seed: i * 3 + s, life: 820, delay: d });
        }
        for (let k = 0; k < 22; k++) fx.drop(t.x + rnd(-14, 14), t.y + rnd(-6, 6), { color: WATER[k % 3], vx: rnd(-150, 150), vy: rnd(-220, -80), g: 380, size: rnd(1.4, 2.4), delay: d + 300 + (k % 4) * 60, life: 640 });
        for (let k = 0; k < 6; k++) fx.bubble(t.x + rnd(-14, 14), t.y + rnd(-4, 10), { color: '#e6fbff', size: rnd(1.4, 2.4), vy: rnd(-40, -20), delay: d + 360 + k * 50, life: 700 });
        fx.shock(t.x, t.y + 8, { r0: 6, r1: 56 * sz, sy: 0.35, color: '#bfe6ff', w: 2.4, delay: d + 300, life: 420 });
        hitMark(t, d + 320, ['#9ae6ff', '#e6fbff'], 22);
      });
      fx.hitStop(crit ? 240 : 170, 320, 1.8);
      return true;
    }
    case 'pk_leaf': {
      // はっぱカッター: くるくる 回る はっぱが 弧を えがいて つぎつぎ
      each((t, i, d) => {
        for (let k = 0; k < 5; k++) {
          const dd = d + k * 50;
          fx.add({ kind: 'pkLeaf', x0: from.x, y0: from.y, x1: t.x + rnd(-6, 6), y1: t.y + rnd(-6, 6), bend: (k % 2 ? 1 : -1) * rnd(14, 30), travel: 300, spin: k % 2 ? 1 : -1, s: 1.5 * sz, life: 330, delay: dd });
          fx.cut(t.x + rnd(-6, 6), t.y + rnd(-6, 6), { ang: rnd(0, Math.PI), len: 18 * sz, w: 1.4, color: '#e8ffd0', glow: '#5ac85a', delay: dd + 300, life: 200 });
        }
        hitMark(t, d + 400, LEAF.slice(0, 2), 12);
      });
      return true;
    }
    case 'pk_solar': {
      // ソーラービーム: 光を あつめて（ためる）、太い 光の ビーム
      fx.tintAt('rgba(30, 40, 0, 0.3)', 1300);
      fx.add({ kind: 'pkCharge', x: from.x, y: from.y, r: 12 * sz, cols: ['rgba(220,255,140,0.95)', '#ffffff'], life: 720 });
      for (let k = 0; k < 3; k++) fx.converge(from.x, from.y, { colors: ['#fff6a0', '#c8ff8a', '#ffffff'], n: 12, r: 40, delay: k * 150, life: 300 });
      each((t, i, d) => {
        fx.add({ kind: 'pkBeam', x0: from.x, y0: from.y, x1: t.x, y1: t.y, w: 9 * sz, life: 460, delay: 640 + d });
        fx.glow(t.x, t.y, { color: '#fff6a0', r: 40 * sz, delay: 680 + d, life: 420 });
        fx.shock(t.x, t.y, { r0: 6, r1: 50 * sz, color: '#e8ffb0', w: 2.6, delay: 700 + d, life: 380 });
        hitMark(t, 700 + d, ['#fff6a0', '#c8ff8a'], 22);
      });
      fx.flashAt(140, '#fffbe0', 660);
      fx.hitStop(crit ? 260 : 190, 700, 1.8);
      return true;
    }
    case 'pk_shadow': {
      // シャドーボール: こい むらさきの たまを ためて なげる
      each((t, i, d) => {
        fx.add({ kind: 'pkOrb', x0: from.x, y0: from.y - 6, x1: t.x, y1: t.y, hop: 10, r: 8 * sz, charge: 260, travel: 300, cols: SHADOW, dark: true, life: 580, delay: d });
        fx.glow(t.x, t.y, { color: '#2a0a3a', r: 40 * sz, delay: d + 560, life: 460, add: false, alpha: 0.6 });
        fx.shock(t.x, t.y, { r0: 6, r1: 44 * sz, color: '#b07ae0', w: 2.4, delay: d + 560, life: 380 });
        fx.sparks(t.x, t.y, { colors: ['#c8a8f0', '#8a4ae0', '#ffffff'], n: all ? 10 : 18, speed: 150, delay: d + 560, life: 420 });
        for (let k = 0; k < 6; k++) fx.puff(t.x + rnd(-10, 10), t.y + rnd(-8, 8), { color: '#1a0a28', r0: 3, r1: 12, vy: rnd(-30, -10), vx: rnd(-20, 20), life: 520, alpha: 0.55, delay: d + 580 });
        hitMark(t, d + 560, ['#c8a8f0'], 18);
      });
      fx.hitStop(crit ? 220 : 150, 560, 1.6);
      return true;
    }
    case 'pk_psychic': {
      // サイコキネシス: ピンクの なみの わが ぐにゃぐにゃ ひろがる
      fx.tintAt('rgba(120, 20, 90, 0.22)', 1000);
      fx.add({ kind: 'pkRing', x: from.x, y: from.y, r0: 4, r1: 18, sy: 0.6, w: 1.4, life: 360 });
      each((t, i, d) => {
        for (let k = 0; k < 3; k++) fx.add({ kind: 'pkRing', x: t.x, y: t.y, r0: 34 * sz, r1: 6, sy: 0.7, w: 1.8 * sz, life: 360, delay: d + k * 90 });
        for (let k = 0; k < 2; k++) fx.add({ kind: 'pkRing', x: t.x, y: t.y, r0: 6, r1: 50 * sz, sy: 0.6, w: 2.2 * sz, life: 520, delay: d + 380 + k * 120 });
        for (let k = 0; k < 6; k++) fx.twinkle(t.x + rnd(-18, 18), t.y + rnd(-16, 12), { color: PSY[k % 3], size: rnd(3, 6), delay: d + 380 + k * 40, life: 320 });
        hitMark(t, d + 380, PSY.slice(0, 2), 16);
      });
      fx.hitStop(crit ? 200 : 120, 380, 1.3);
      return true;
    }
    case 'pk_bodyslam': {
      // のしかかり・ギガインパクト: 空から 大きな かげが ドスン
      each((t, i, d) => {
        fx.add({ kind: 'pkSlam', x: t.x, y: t.y, ground: Math.min(H - 4, t.y + 12), r: 16 * sz, fall: 400, life: 600, delay: d });
        fx.speedLines(t.x, t.y - 10, { delay: d + 200, r1: 80 * sz, life: 240 });
        fx.shock(t.x, Math.min(H - 4, t.y + 10), { r0: 8, r1: 64 * sz, sy: 0.35, color: '#ffffff', w: 3, delay: d + 400, life: 420 });
        fx.debris(t.x, t.y + 8, ['#a08060', '#6a5040', '#d8c0a0'], all ? 6 : 12, d + 410, 130);
        for (let k = 0; k < 4; k++) fx.puff(t.x + (k - 1.5) * 10, Math.min(H - 6, t.y + 10), { color: '#d8c8b0', r0: 4, r1: 14, vx: (k - 1.5) * 24, vy: -10, life: 520, alpha: 0.5, delay: d + 410 });
        hitMark(t, d + 410, ['#ffd66b'], 24);
      });
      fx.flashAt(90, '#ffffff', 410);
      fx.hitStop(crit ? 320 : 240, 420, crit ? 3 : 2.4);
      return true;
    }
  }
  return false;
}
