// 第43回の 新しい 職業 3つの 技の エフェクト（配管工 → ひげおやじ → マリオ。女の子は ももの姫 → おてんば姫 → ピーチ）
// 技の id では なく「えんしゅつの なまえ（anim）」で ひく。技の データの anim に ここの なまえを 書く（例 anim: 'mario_sig'）。
// battlefx.js の play() で battlefx-r41a.js の つぎに よばれる（ここに ない anim なら false を かえす）。
// え は「それと わかる、でも そのまま うつさない」かんたんな かたち（ロゴや 顔は かかない）
//
// 看板の技（なまえは '<職業の id>_sig'）
//  plumber_sig    三だんジャンプ … 赤い ぼうしの 小さな かげが ぴょん・ぴょん・ぴょーんと 敵を つぎつぎに ふみつける
//  mustache_sig   ファイアフラワー … 大きな 花が ひらいて、はずむ 火の玉が つぎつぎに 敵へ
//  mario_sig      スーパースターラッシュ … 画面が にじ色に 光り、星を まとった かげが 敵の 頭の 上を 3回ずつ とびこえる
// ほかの 技
//  r43j_stomp     上から ふみつける かげ（ドスン）
//  r43j_wrench    くるくる 回る スパナと 回復の きらきら（みかた）
//  r43j_pipe      地面から 緑の 土管が せり上がる（みかた。自分）
//  r43j_fireball  はずむ 火の玉が 2つ
//  r43j_mushroom  赤い キノコが ぽんと 出て、体が 大きく なる（みかた。自分）
//  r43j_shell     緑の こうらが 地面を すべって 敵に つぎつぎ ぶつかる
//  r43j_hipdrop   空で くるりと 回って まっすぐ 落ちる（大きな しょうげきと 星）
//  r43j_star      にじ色に 光る 星を つかまえる（みかた。自分）
//  r43j_egg       もようの ある たまごが 弧を えがいて 敵へ
// ・どれも 2.2びょう いないで おわる。あたる じかんは R43J_HIT（battle.js の HIT_DELAY に まぜる）
// ・みかたに つかう えんしゅつ（PARTY_ANIMS_R43J）は、battle.js が がめんの 下の まん中に 出す

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t);
const fadeOut = (t, from = 0.7) => (t < from ? 1 : Math.max(0, 1 - (t - from) / (1 - from)));

export const R43J_SIG_JOBS = ['plumber', 'mustache', 'mario'];
export const R43J_SIGS = R43J_SIG_JOBS.map((j) => `${j}_sig`);
export const R43J_MOVES = ['r43j_stomp', 'r43j_wrench', 'r43j_pipe', 'r43j_fireball', 'r43j_mushroom', 'r43j_shell', 'r43j_hipdrop', 'r43j_star', 'r43j_egg'];
export const R43J_ANIMS = new Set([...R43J_SIGS, ...R43J_MOVES]);
// みかたに つかう ことが ある えんしゅつ（敵が いない ときは がめんの 下に 大きく 出す）
export const PARTY_ANIMS_R43J = new Set(['r43j_wrench', 'r43j_pipe', 'r43j_mushroom', 'r43j_star']);
// あたる じかん（ms。ダメージの 数字を この ときに 出す）
export const R43J_HIT = {
  plumber_sig: 360, mustache_sig: 520, mario_sig: 760, r43j_stomp: 380, r43j_fireball: 360, r43j_shell: 300, r43j_hipdrop: 620, r43j_egg: 440,
};
// たたかいの 音（battle.js の ANIM_SFX に まぜる。audio.js・sfx-r26.js に ある 音）
export const R43J_SFX = {
  plumber_sig: 'stamp', mustache_sig: 'fire', mario_sig: 'sparkle', r43j_stomp: 'stamp', r43j_wrench: 'heal', r43j_pipe: 'warp',
  r43j_fireball: 'fire', r43j_mushroom: 'pu', r43j_shell: 'smash', r43j_hipdrop: 'fall', r43j_star: 'kirari', r43j_egg: 'pon',
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
const RAINBOW = ['#ff5a5a', '#ffb03a', '#fff04a', '#5ae86a', '#4ac8ff', '#a87aff'];
// 弧の とちゅうの いち（x0,y0 → x1,y1。hop: たかさ）
const arcAt = (p, k) => [p.x0 + (p.x1 - p.x0) * k, p.y0 + (p.y1 - p.y0) * k - Math.sin(k * Math.PI) * (p.hop || 0)];

export const R43J_FINE = {
  // 赤い ぼうしの 小さな かげ（ジャンプして ふみつける。star: にじ色に 光る）
  j43jJumper(x, p, t) {
    const k = clamp01(p.age / (p.travel || 320));
    if (p.age > (p.travel || 320) + 120) return;
    const [cx, cy] = arcAt(p, easeOut(k));
    const s = p.s || 1, dir = p.x1 >= p.x0 ? 1 : -1;
    x.save();
    if (p.star) {
      x.globalCompositeOperation = 'lighter';
      softGlow(x, cx, cy - 6 * s, 14 * s, RAINBOW[Math.floor(p.age / 60) % RAINBOW.length], 0.8);
      x.globalCompositeOperation = 'source-over';
    }
    x.globalAlpha = 1;
    x.translate(cx, cy);
    x.scale(dir, 1);
    // ぼうし・かお・からだ（赤）・つなぎ（青）・くつ
    x.fillStyle = '#d8202c';
    x.fillRect(-3 * s, -15 * s, 6 * s, 3 * s);
    x.fillRect(1 * s, -13 * s, 4 * s, 1 * s);
    x.fillStyle = '#f2c8a0';
    x.fillRect(-2.5 * s, -12 * s, 5 * s, 3 * s);
    x.fillStyle = '#d8202c';
    x.fillRect(-3.5 * s, -9 * s, 7 * s, 3 * s);
    x.fillStyle = '#2a4ec0';
    x.fillRect(-3 * s, -7 * s, 6 * s, 4 * s);
    x.fillRect(-3 * s, -3 * s, 2 * s, 2 * s);
    x.fillRect(1 * s, -3 * s, 2 * s, 2 * s);
    x.fillStyle = '#5a3218';
    x.fillRect(-3.5 * s, -1 * s, 3 * s, 1.5 * s);
    x.fillRect(1 * s, -1 * s, 3 * s, 1.5 * s);
    x.restore();
  },
  // はずむ 火の玉（x0 → x1。bounce: はねる 回数）
  j43jFire(x, p, t) {
    const travel = p.travel || 360;
    const k = clamp01(p.age / travel);
    if (p.age > travel + 40) return;
    const n = p.bounce || 2;
    const cx = p.x0 + (p.x1 - p.x0) * k;
    const ground = p.y0 + (p.y1 - p.y0) * k;
    const cy = ground - Math.abs(Math.sin(k * Math.PI * n)) * (p.hop || 12);
    const r = p.r || 3.2;
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, cx, cy, r * 3.2, 'rgba(255,150,40,0.95)', 0.9);
    x.globalAlpha = 1;
    x.fillStyle = '#ffd040';
    x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#fff6c0';
    x.beginPath(); x.arc(cx - r * 0.3, cy - r * 0.3, r * 0.45, 0, Math.PI * 2); x.fill();
    x.restore();
  },
  // 緑の こうら（地面を すべって 回る）
  j43jShell(x, p, t) {
    const travel = p.travel || 420;
    const k = clamp01(p.age / travel);
    if (p.age > travel + 60) return;
    const cx = p.x0 + (p.x1 - p.x0) * k, cy = p.y0 + (p.y1 - p.y0) * k;
    const s = p.s || 1;
    x.save();
    x.translate(cx, cy);
    // すべる すじ
    x.globalAlpha = 0.5;
    x.fillStyle = '#ffffff';
    const dir = p.x1 >= p.x0 ? 1 : -1;
    for (let i = 0; i < 3; i++) x.fillRect(-dir * (10 + i * 6) * s - 3, (-3 + i * 2) * s, 6, 1);
    x.globalAlpha = 1;
    x.fillStyle = '#f6f0d8';
    x.beginPath(); x.ellipse(0, 1 * s, 7 * s, 2.2 * s, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = p.c || '#3aa83a';
    x.beginPath(); x.ellipse(0, -1 * s, 6.5 * s, 4.6 * s, 0, Math.PI, 0); x.fill();
    // こうらの もよう（回って 見える）
    x.fillStyle = p.c2 || '#e8f4d8';
    const ph = (p.age / 40) % 3;
    for (let i = -1; i <= 1; i++) x.fillRect((i * 3.2 + ph - 1) * s - 0.8 * s, -4.2 * s, 1.6 * s, 3 * s);
    x.restore();
  },
  // 緑の 土管（地面から せり上がる）
  j43jPipe(x, p, t) {
    const a = fadeOut(t, 0.75);
    if (a <= 0) return;
    const s = p.s || 1;
    const up = easeOut(clamp01(p.age / 260));
    const h = 22 * s * up;
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y);
    x.fillStyle = '#1a6a2a';
    x.fillRect(-7 * s, -h, 14 * s, h);
    x.fillStyle = '#3ac04a';
    x.fillRect(-6 * s, -h, 6 * s, h);
    x.fillStyle = '#9af0a0';
    x.fillRect(-4.5 * s, -h, 1.5 * s, h);
    // ふち
    x.fillStyle = '#1a6a2a';
    x.fillRect(-9 * s, -h - 5 * s, 18 * s, 5 * s);
    x.fillStyle = '#4ad85a';
    x.fillRect(-8 * s, -h - 4.5 * s, 9 * s, 3.5 * s);
    x.fillStyle = '#0c2a12';
    x.fillRect(-7 * s, -h - 5.5 * s, 14 * s, 1.2 * s);
    x.restore();
  },
  // 赤い キノコ（白い てんてん。ぽんと 出て、ふわっと 上へ）
  j43jMush(x, p, t) {
    const a = fadeOut(t, 0.65);
    if (a <= 0) return;
    const s = (p.s || 1) * (0.4 + 0.6 * easeOut(clamp01(p.age / 220)));
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y - p.age * 0.015);
    x.fillStyle = '#f6ecd8';
    x.fillRect(-3 * s, -1 * s, 6 * s, 5 * s);
    x.fillStyle = p.c || '#e8302a';
    x.beginPath(); x.ellipse(0, -1 * s, 7 * s, 5.5 * s, 0, Math.PI, 0); x.fill();
    x.fillRect(-7 * s, -1.4 * s, 14 * s, 1.4 * s);
    x.fillStyle = '#ffffff';
    for (const [dx, dy, r] of [[0, -4.2, 1.6], [-4.2, -2.4, 1.2], [4.2, -2.4, 1.2]]) { x.beginPath(); x.arc(dx * s, dy * s, r * s, 0, Math.PI * 2); x.fill(); }
    x.restore();
  },
  // 光る 星（くるくる 回る。rainbow: にじ色の ひかり）
  j43jStar(x, p, t) {
    const a = fadeOut(t, p.fade ?? 0.6);
    if (a <= 0) return;
    const k = p.travel ? easeOut(clamp01(p.age / p.travel)) : 1;
    const cx = p.x0 !== undefined ? p.x0 + (p.x1 - p.x0) * k : p.x;
    const cy = p.y0 !== undefined ? p.y0 + (p.y1 - p.y0) * k - Math.sin(k * Math.PI) * (p.hop || 0) : p.y;
    const r = (p.r || 7) * (0.6 + 0.4 * easeOut(clamp01(p.age / 200)));
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, cx, cy, r * 3, p.rainbow ? RAINBOW[Math.floor(p.age / 70) % RAINBOW.length] : 'rgba(255,230,120,0.9)', a * 0.8);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a;
    x.fillStyle = '#ffd820';
    starPath(x, cx, cy, r, p.age / 220);
    x.fill();
    x.fillStyle = '#fff6b0';
    starPath(x, cx, cy, r * 0.5, p.age / 220);
    x.fill();
    x.restore();
  },
  // もようの ある たまご（弧を えがいて 飛ぶ）
  j43jEgg(x, p, t) {
    const travel = p.travel || 420;
    const k = clamp01(p.age / travel);
    if (p.age > travel + 40) return;
    const [cx, cy] = arcAt(p, k);
    const s = p.s || 1;
    x.save();
    x.translate(cx, cy);
    x.rotate(p.age / 90);
    x.fillStyle = '#fbfbf2';
    x.beginPath(); x.ellipse(0, 0, 3.6 * s, 4.6 * s, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#3ab84a';
    for (const [dx, dy] of [[-1.4, -1.8], [1.6, 0.4], [-0.6, 2.4]]) { x.beginPath(); x.arc(dx * s, dy * s, 1 * s, 0, Math.PI * 2); x.fill(); }
    x.restore();
  },
  // くるくる 回る 銀の スパナ
  j43jWrench(x, p, t) {
    const a = fadeOut(t, 0.6);
    if (a <= 0) return;
    const s = p.s || 1;
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y - p.age * 0.01);
    x.rotate(p.age / 80);
    x.fillStyle = '#c4c8d6';
    x.fillRect(-1.2 * s, -7 * s, 2.4 * s, 12 * s);
    x.beginPath(); x.arc(0, -8 * s, 3.2 * s, 0, Math.PI * 2); x.fill();
    // 口の すきま
    x.fillStyle = '#3a3a4a';
    x.fillRect(-1 * s, -11.2 * s, 2 * s, 2.6 * s);
    x.restore();
  },
  // 大きな 花（ひらく。ファイアフラワー）
  j43jFlower(x, p, t) {
    const a = fadeOut(t, 0.7);
    if (a <= 0) return;
    const s = (p.s || 1) * easeOut(clamp01(p.age / 260));
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y);
    x.fillStyle = '#3aa83a';
    x.fillRect(-1 * s, 0, 2 * s, 12 * s);
    const cols = ['#ff5a2a', '#ffb03a', '#ffe060'];
    for (let i = 0; i < 3; i++) {
      x.fillStyle = cols[i];
      x.beginPath(); x.ellipse(0, 0, (10 - i * 3) * s, (6 - i * 1.6) * s, 0, 0, Math.PI * 2); x.fill();
    }
    x.restore();
  },
};

// ───────────── エフェクト ─────────────
// fx: Effects（battlefx.js）  targets: [{ x, y }]  W・H: がめんの 大きさ
export function playR43jFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  if (!R43J_ANIMS.has(anim) || !targets || !targets.length) return false;
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
  const ground = (t) => Math.min(H - 6, t.y + 12);
  switch (anim) {
    // ───── 看板の技 ─────
    case 'plumber_sig': {
      // ぴょん・ぴょん・ぴょーん（敵を じゅんばんに ふみつける。さいごは 大ジャンプ）
      const order = [...targets, ...targets, ...targets].slice(0, 3);
      let px = from.x, py = fy;
      order.forEach((t, i) => {
        const d = i * 150;
        fx.add({ kind: 'j43jJumper', x0: px, y0: py, x1: t.x, y1: t.y - 10, hop: i === 2 ? 46 : 26, travel: 200, s: 1.35, life: 260, delay: d });
        hitMark(t, d + 210, '#ffd040', i === 2 ? 20 : 14);
        fx.puff(t.x, t.y - 8, { color: '#ffffff', r0: 3, r1: 12, life: 260, alpha: 0.6, delay: d + 210 });
        px = t.x; py = t.y - 10;
      });
      fx.hitStop(crit ? 220 : 150, 510, 1.5);
      return true;
    }
    case 'mustache_sig': {
      // 大きな 花が ひらいて、はずむ 火の玉が つぎつぎに 敵へ
      fx.tintAt('rgba(40, 10, 0, 0.35)', 1400);
      fx.add({ kind: 'j43jFlower', x: from.x, y: fy - 8, s: 1.2, life: 1300 });
      for (let k = 0; k < 5; k++) {
        const t = targets[k % targets.length];
        fx.add({ kind: 'j43jFire', x0: from.x, y0: fy, x1: t.x, y1: ground(t) - 4, bounce: 3, hop: 14, travel: 380, life: 420, delay: 160 + k * 90 });
        hitMark(t, 520 + k * 90, '#ff9a3a', 14);
      }
      fx.flashAt(90, '#ffd8a0', 520);
      return true;
    }
    case 'mario_sig': {
      // 1) にじ色の 光と 星が ふる
      fx.tintAt('rgba(10, 6, 30, 0.45)', 2000);
      fx.add({ kind: 'j43jStar', x: from.x, y: fy - 12, r: 10, rainbow: true, life: 700 });
      for (let k = 0; k < 12; k++) fx.twinkle(rnd(8, W - 8), rnd(6, H * 0.5), { color: RAINBOW[k % RAINBOW.length], size: rnd(3, 6), delay: k * 40, life: 360 });
      // 2) 星を まとった かげが 敵の 頭の 上を 3回ずつ とびこえる
      let px = from.x, py = fy;
      for (let r = 0; r < 3; r++) {
        each((t, i, d) => {
          const dd = 360 + r * 300 + i * 90;
          fx.add({ kind: 'j43jJumper', x0: px, y0: py, x1: t.x, y1: t.y - 12, hop: 30, travel: 160, s: 1.4, star: true, life: 220, delay: dd });
          hitMark(t, dd + 160 + d * 0, RAINBOW[(r * 2 + i) % RAINBOW.length], 16);
          px = t.x; py = t.y - 12;
        });
      }
      // 3) さいごに 大きな にじ色の しょうげき
      each((t, i, d) => {
        fx.shock(t.x, t.y, { r0: 8, r1: 56 * sz, color: '#fff6b0', w: 3, delay: 1300 + d, life: 420 });
        fx.add({ kind: 'j43jStar', x: t.x, y: t.y - 20, r: 6, rainbow: true, life: 600, delay: 1300 + d });
      });
      fx.flashAt(110, '#fff6d0', 1300);
      fx.hitStop(crit ? 300 : 240, 760, 2.0);
      return true;
    }
    // ───── 配管工 ─────
    case 'r43j_stomp': {
      each((t, i, d) => {
        fx.add({ kind: 'j43jJumper', x0: from.x, y0: fy, x1: t.x, y1: t.y - 10, hop: 40, travel: 340, s: 1.35, life: 420, delay: d });
        hitMark(t, 380 + d, '#ffd040', 18);
        fx.puff(t.x, t.y - 6, { color: '#ffffff', r0: 3, r1: 14, life: 300, alpha: 0.6, delay: 380 + d });
      });
      fx.hitStop(crit ? 200 : 130, 380, 1.4);
      return true;
    }
    case 'r43j_wrench': {
      // くるくる 回る スパナと 回復の きらきら（みかた）
      for (const [i, t] of targets.entries()) {
        fx.add({ kind: 'j43jWrench', x: t.x + 8, y: t.y - 14, s: 1, life: 760, delay: i * 70 });
        fx.glow(t.x, t.y, { color: '#c8ffd8', r: 24, delay: 200 + i * 70, life: 420 });
        for (let k = 0; k < 4; k++) fx.twinkle(t.x + rnd(-12, 12), t.y + rnd(-10, 10), { color: '#ffffff', size: 4, delay: 260 + i * 70 + k * 40, life: 320 });
      }
      return true;
    }
    case 'r43j_pipe': {
      // 地面から 緑の 土管（みかた。自分）
      for (const t of targets) {
        fx.add({ kind: 'j43jPipe', x: t.x, y: Math.min(H - 2, t.y + 14), s: 1, life: 1000 });
        fx.puff(t.x, Math.min(H - 4, t.y + 12), { color: '#c8f0c8', r0: 4, r1: 16, life: 300, alpha: 0.5, delay: 80 });
      }
      return true;
    }
    // ───── ひげおやじ ─────
    case 'r43j_fireball': {
      each((t, i, d) => {
        for (let k = 0; k < 2; k++) {
          fx.add({ kind: 'j43jFire', x0: from.x, y0: fy, x1: t.x, y1: ground(t) - 4, bounce: 2, hop: 12, travel: 320, life: 360, delay: d + k * 110 });
          hitMark(t, 330 + d + k * 110, '#ff9a3a', 14);
        }
      });
      return true;
    }
    case 'r43j_mushroom': {
      // 赤い キノコが ぽん → 体が 大きく なる（みかた。自分）
      for (const t of targets) {
        fx.add({ kind: 'j43jMush', x: t.x, y: t.y - 18, s: 1.1, life: 760 });
        fx.shock(t.x, t.y, { r0: 6, r1: 34, color: '#ff8a8a', w: 2, delay: 280, life: 360 });
        fx.arrows(t.x, t.y, '#ff6a5a', true, 3, 320);
      }
      return true;
    }
    case 'r43j_shell': {
      // 緑の こうらが 地面を すべって、敵に つぎつぎ ぶつかる
      const yb = Math.min(H - 8, Math.max(...targets.map((t) => t.y)) + 8);
      const xs = targets.map((t) => t.x);
      fx.add({ kind: 'j43jShell', x0: from.x < tx ? Math.min(...xs) - 50 : Math.max(...xs) + 50, y0: yb, x1: from.x < tx ? Math.max(...xs) + 40 : Math.min(...xs) - 40, y1: yb, s: 1.1, travel: 520, life: 600 });
      // すべって いく じゅんに ぶつかる
      [...targets].sort((a, b) => (from.x < tx ? a.x - b.x : b.x - a.x)).forEach((t, i) => hitMark(t, 260 + i * 80, '#9af0a0', 16));
      fx.hitStop(crit ? 200 : 120, 420, 1.4);
      return true;
    }
    // ───── マリオ ─────
    case 'r43j_hipdrop': {
      // 空で くるりと 回って、まっすぐ 落ちる
      each((t, i, d) => {
        fx.add({ kind: 'j43jJumper', x0: t.x, y0: -10, x1: t.x, y1: t.y - 10, hop: 0, travel: 260, s: 1.3, life: 320, delay: 300 + d });
        fx.speedLines(t.x, t.y - 20, { delay: 300 + d, r1: 70 });
        hitMark(t, 620 + d, '#ffd040', 24);
        fx.shock(t.x, t.y + 8, { r0: 8, r1: 50 * sz, color: '#ffffff', w: 3, sy: 0.4, delay: 620 + d, life: 380 });
        fx.debris(t.x, t.y + 10, ['#c8a070', '#ffffff', '#ffd040'], all ? 6 : 10, 640 + d, 110);
        for (let k = 0; k < 3; k++) fx.add({ kind: 'j43jStar', x: t.x + (k - 1) * 9, y: t.y - 22, r: 3, life: 600, delay: 700 + d + k * 60 });
      });
      fx.flashAt(90, '#ffffff', 620);
      fx.hitStop(crit ? 280 : 200, 620, 1.8);
      return true;
    }
    case 'r43j_star': {
      // にじ色に 光る 星を つかまえる（みかた。自分）
      for (const t of targets) {
        fx.add({ kind: 'j43jStar', x0: t.x + 30, y0: t.y - 40, x1: t.x, y1: t.y - 8, hop: 10, travel: 360, r: 8, rainbow: true, fade: 0.8, life: 1100 });
        fx.glow(t.x, t.y, { color: '#fff6a0', r: 32, delay: 360, life: 600 });
        for (let k = 0; k < 8; k++) fx.twinkle(t.x + rnd(-18, 18), t.y + rnd(-22, 8), { color: RAINBOW[k % RAINBOW.length], size: 5, delay: 380 + k * 50, life: 340 });
      }
      return true;
    }
    case 'r43j_egg': {
      // もようの ある たまごが 弧を えがいて 敵へ
      each((t, i, d) => {
        fx.add({ kind: 'j43jEgg', x0: from.x, y0: fy, x1: t.x, y1: t.y, hop: 40, travel: 400, s: 1.1, life: 440, delay: d });
        hitMark(t, 440 + d, '#9af0a0', 16);
        fx.debris(t.x, t.y, ['#fbfbf2', '#3ab84a'], all ? 5 : 8, 450 + d, 90);
      });
      return true;
    }
  }
  return false;
}
