// 夜の 魔物の え（いまの 魔物の いろを かえて、すこし かざりを たす）と 夜の たたかいの はいけい
// render/monsters.js の さいごで addNightArt(MONSTER_ART) を よぶ

// いろを おきかえて かく（g … monsters.js の かく ための どうぐ）
function recolor(base, map, extra = null) {
  const tr = (c) => map[c] || c;
  return {
    size: base.size,
    pal: [...new Set([...base.pal.map(tr), ...(extra?.pal || [])])],
    draw: (g, f) => {
      const w = Object.create(g);
      w.ell = (cx, cy, rx, ry, c, rot) => g.ell(cx, cy, rx, ry, tr(c), rot);
      w.poly = (pts, c) => g.poly(pts, tr(c));
      w.rect = (x, y, rw, rh, c) => g.rect(x, y, rw, rh, tr(c));
      w.line = (pts, c, lw) => g.line(pts, tr(c), lw);
      w.dot = (x, y, c) => g.dot(x, y, tr(c));
      w.eye = (cx, cy, r, look = 0, white = '#ffffff', pupil = '#1a1026') => g.eye.call(w, cx, cy, r, look, white, pupil);
      base.draw(w, f);
      extra?.draw?.(g, f);
    },
  };
}

export function addNightArt(ART) {
  // 月夜ぷるりん: うすむらさきの からだに 三日月
  ART.moon_pururin = recolor(ART.pururin, { '#4fa8ff': '#8a78e0', '#2f78d0': '#54449e', '#bfe6ff': '#ddd4ff' }, {
    pal: ['#ffe07a', '#f2c14e'],
    draw: (g, f) => {
      const b = f ? 0.04 : 0;
      g.poly([[0.46, 0.02 + b], [0.62, 0.06 + b], [0.66, 0.18 + b], [0.58, 0.26 + b], [0.6, 0.16 + b], [0.54, 0.08 + b]], '#ffe07a');
      g.dot(0.3, 0.2, '#ffe07a');
      g.dot(0.78, 0.3, '#f2c14e');
    },
  });
  // 夜ふかしフクロウ: 大ガラスを ちゃいろに して、まるい 顔と 大きな 目
  ART.night_owl = recolor(ART.crow, { '#2a2a3a': '#8a6a4a', '#14141e': '#5a4230', '#4a4a6a': '#c8a878', '#ff4a4a': '#1a1026' }, {
    pal: ['#e8d0a0', '#ffe07a', '#5a4230', '#e0a040'],
    draw: (g) => {
      g.ell(0.5, 0.31, 0.12, 0.1, '#e8d0a0');
      g.poly([[0.38, 0.24], [0.36, 0.1], [0.44, 0.2]], '#5a4230');
      g.poly([[0.62, 0.24], [0.64, 0.1], [0.56, 0.2]], '#5a4230');
      g.eye(0.45, 0.3, 0.05, 0, '#ffe07a', '#1a1026');
      g.eye(0.55, 0.3, 0.05, 0, '#ffe07a', '#1a1026');
      g.poly([[0.48, 0.35], [0.5, 0.41], [0.52, 0.35]], '#e0a040');
    },
  });
  // ひとだまランプ: 青白い 火
  ART.wisp_lamp = recolor(ART.lamp, {
    '#ff8a2a': '#4a8aff', '#ffd66b': '#c8e8ff', '#d65a2a': '#2a4aa8', '#e8b84a': '#9a9ab0', '#b8862a': '#5a5a70', '#fff0a0': '#e8f4ff',
  });
  // 闇ウルフ: こい あい色の からだ
  ART.dark_wolf = recolor(ART.wolf, { '#8a8a9a': '#3a3a60', '#5a5a6e': '#22223c', '#c8c8d8': '#6a6aa0' }, {
    pal: ['#8a5ac8'],
    draw: (g, f) => {
      const b = f ? 0.02 : 0;
      g.line([[0.42, 0.44 + b], [0.5, 0.4 + b], [0.6, 0.42 + b], [0.7, 0.4 + b]], '#8a5ac8');
    },
  });
  // 夜光ぷるりん: ぼんやり 光る みどり
  ART.glow_jelly = recolor(ART.marine_slime, { '#4ad0c8': '#7ae890', '#2a9a9a': '#3a9a5a', '#bff6f0': '#eaffd8', '#f4b8d0': '#fff6b0', '#e87aa0': '#e0c040' }, {
    pal: ['#fff6b0'],
    draw: (g, f) => {
      const s = f ? [[0.16, 0.3], [0.84, 0.46]] : [[0.84, 0.26], [0.14, 0.5]];
      for (const [x, y] of s) g.ell(x, y, 0.035, 0.035, '#fff6b0');
    },
  });
}

// ───── 夜の たたかいの はいけい（'grass_night' など）─────
const toNight = (hex, k = 0.45) => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const mix = (v, t) => Math.round(v * k + t * (1 - k) * 0.35);
  return `#${[mix(r, 30), mix(g, 40), mix(b, 110)].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('')}`;
};

// 昼の はいけいの データから 夜の データを つくる（BG … battlefx.js の 表）
export function nightBg(BG, id) {
  if (!id || !id.endsWith('_night')) return null;
  const d = BG[id.slice(0, -6)];
  if (!d) return null;
  return {
    ...d,
    sky: ['#070b24', '#111a44', '#1e2a60'],
    far: toNight(d.far, 0.55), near: toNight(d.near), ground: d.ground.map((c) => toNight(c)),
    night: true,
  };
}

// 夜空の 星と 月（x … はいけいの ctx。hor … 地面の たかさ）
export function drawNightSky(x, w, hor) {
  x.fillStyle = '#ffffff';
  for (let i = 0; i < 38; i++) x.fillRect((i * 97 + 13) % w, (i * 53) % (hor - 12), 1, 1);
  x.fillStyle = '#c8d0ff';
  for (let i = 0; i < 14; i++) x.fillRect((i * 61 + 40) % w, (i * 37 + 5) % (hor - 14), 1, 1);
  // 月
  x.fillStyle = '#fff6c8';
  x.beginPath(); x.arc(w - 44, 20, 9, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#e8dca0';
  x.fillRect(w - 47, 17, 3, 2); x.fillRect(w - 41, 23, 2, 2);
}
