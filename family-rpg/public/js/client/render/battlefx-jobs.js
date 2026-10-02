// 学校・公務員・町の みかた・アイドルの 技の エフェクト
// battlefx.js の play() の さいしょに よばれる（ここに ない anim なら false を かえす）
// どれも あたる しゅんかんが すぐ（ダメージの 数字と ずれない）

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const FRUIT_COL = ['#f03a4a', '#ff9a2a', '#9a5ad8', '#ffe23a'];

// こまかい つぶの かきかた（battlefx.js の FINE に まぜる）
export const JOB_FINE = {
  // 音符（♪）
  note(x, p, t) {
    const X = Math.round(p.x), Y = Math.round(p.y);
    x.globalAlpha = Math.max(0, 1 - t * t);
    x.fillStyle = p.color;
    x.fillRect(X - 2, Y, 3, 2);
    x.fillRect(X - 1, Y - 1, 2, 1);
    x.fillRect(X, Y - 6, 1, 6);
    x.fillRect(X + 1, Y - 6, 2, 1);
    x.fillRect(X + 2, Y - 5, 1, 2);
  },
  // フルーツ（0 イチゴ・1 オレンジ・2 ブドウ・3 バナナ）
  fruit(x, p, t) {
    const X = Math.round(p.x), Y = Math.round(p.y);
    x.globalAlpha = Math.max(0, 1 - Math.max(0, t - 0.65) / 0.35);
    const c = FRUIT_COL[p.fruit % 4];
    x.fillStyle = c;
    if (p.fruit === 0) {
      x.fillRect(X - 2, Y - 1, 5, 2);
      x.fillRect(X - 1, Y + 1, 3, 1);
      x.fillRect(X, Y + 2, 1, 1);
      x.fillStyle = '#3ab04a';
      x.fillRect(X - 1, Y - 2, 3, 1);
      x.fillStyle = '#ffe08a';
      x.fillRect(X - 1, Y, 1, 1);
      x.fillRect(X + 1, Y, 1, 1);
    } else if (p.fruit === 1) {
      x.fillRect(X - 1, Y - 2, 3, 1);
      x.fillRect(X - 2, Y - 1, 5, 3);
      x.fillRect(X - 1, Y + 2, 3, 1);
      x.fillStyle = '#ffd27a';
      x.fillRect(X - 1, Y - 1, 1, 1);
    } else if (p.fruit === 2) {
      for (const [a, b] of [[-2, -2], [0, -2], [-1, 0], [1, 0], [0, 2]]) x.fillRect(X + a, Y + b, 2, 2);
      x.fillStyle = '#3ab04a';
      x.fillRect(X, Y - 3, 1, 1);
    } else {
      x.fillRect(X - 3, Y - 1, 1, 1);
      x.fillRect(X - 2, Y, 4, 1);
      x.fillRect(X + 2, Y - 1, 1, 1);
      x.fillRect(X - 1, Y + 1, 2, 1);
    }
  },
  // まくら（くるくる まわる）
  pillow(x, p, t) {
    x.globalAlpha = Math.max(0, 1 - Math.max(0, t - 0.6) / 0.4);
    x.save();
    x.translate(p.x, p.y);
    x.rotate((p.rot || 0) + p.age / 90);
    x.fillStyle = '#ffffff';
    x.fillRect(-5, -3, 10, 6);
    x.fillStyle = '#c8d4f0';
    x.fillRect(-5, 2, 10, 1);
    x.fillRect(-6, -2, 1, 4);
    x.fillRect(5, -2, 1, 4);
    x.restore();
  },
  // 運動会の 大玉（赤と 白。ころがる）
  odama(x, p) {
    const r = p.r || 14;
    const a = p.age / 70;
    x.globalAlpha = 1;
    x.save();
    x.translate(p.x, p.y);
    x.rotate(a);
    x.fillStyle = '#ffffff';
    x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#e83a3a';
    x.beginPath(); x.arc(0, 0, r, 0, Math.PI); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.55)';
    x.beginPath(); x.arc(-r * 0.35, -r * 0.4, r * 0.25, 0, Math.PI * 2); x.fill();
    x.restore();
  },
};

// その anim の エフェクトを だす（だしたら true）
// fx: Effects、W・H: たたかいの がめんの 大きさ
export function playJobFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  const crit = !!opts.crit;
  const all = targets.length > 1;
  const each = (fn) => targets.forEach((t, ti) => fn(t.x, t.y, ti * (all ? 70 : 0), ti));
  switch (anim) {
    case 'notes': // リコーダー・歌: 音符が ふわふわ
      each((x, y, d) => {
        for (let k = 0; k < 6; k++) fx.add({ kind: 'note', x: x - 18 + Math.random() * 36, y: y + 4 + Math.random() * 10, vx: (Math.random() - 0.5) * 18, vy: -24 - Math.random() * 16, color: ['#ffffff', '#ffe066', '#9ad8ff', '#f7a1c4'][k % 4], life: 900, delay: d + k * 60 });
        fx.add({ kind: 'z', x: x + 6, y: y - 8, vx: 8, vy: -14, color: '#ffffff', life: 1000, delay: d + 300 });
      });
      return true;
    case 'odama': { // 大玉ころがし: 大玉が ころがって ぶつかる
      const y0 = Math.max(...targets.map((t) => t.y)) + 6;
      fx.add({ kind: 'odama', x: -18, y: y0, vx: 560, vy: 0, life: 620, r: 15 });
      each((x, y, d) => fx.bigHit(x, y, { crit, heavy: true, delay: d, color: '#ff8a8a' }));
      return true;
    }
    case 'pillow': // 修学旅行: まくらが ぶつかって 羽が まう
      each((x, y, d) => {
        fx.add({ kind: 'pillow', x, y: y - 2, vx: 0, vy: -10, life: 420, delay: d, rot: Math.random() * 3 });
        fx.impact(x, y, { r: 14, delay: d });
        for (let k = 0; k < 7; k++) fx.petal(x + (Math.random() - 0.5) * 16, y, { color: '#ffffff', vx: (Math.random() - 0.5) * 60, vy: -50 - Math.random() * 30, delay: d, life: 900, g: 60 });
      });
      return true;
    case 'camera': // 記者会見: カメラの フラッシュ
      each((x, y, d, ti) => {
        for (let k = 0; k < 4; k++) fx.add({ kind: 'crossflash', x: x + (Math.random() - 0.5) * 30, y: y + (Math.random() - 0.5) * 22, color: '#ffffff', life: 240, delay: d + k * 90 });
        if (ti === 0) for (let k = 0; k < 3; k++) fx.flashAt(70, '#ffffff', k * 120);
      });
      return true;
    case 'stamp': // ハンコ連打: 赤い ハンコが ポンポン
      each((x, y, d) => {
        for (let k = 0; k < 4; k++) {
          const px = x + (Math.random() - 0.5) * 18, py = y + (Math.random() - 0.5) * 12, dd = d + k * 80;
          fx.ring(px, py, '#e83a3a', 2, dd, 220, 12);
          fx.impact(px, py, { r: 7, color: '#ffd0d0', delay: dd });
          fx.star(px, py, '#ff6a6a', 7, dd, 160);
        }
      });
      return true;
    case 'siren': // パトカー出動: 赤と 青の ひかり
      fx.flashAt(80, '#ff3a3a', 0);
      fx.flashAt(80, '#3a6aff', 150);
      fx.flashAt(80, '#ff3a3a', 300);
      each((x, y, d) => {
        fx.speedLines(x, y, { delay: d, r1: 90 });
        fx.bigHit(x, y, { crit, heavy: true, delay: d, color: '#9ad8ff' });
      });
      return true;
    case 'water': // 放水: 水の ビームと しぶき
      each((x, y, d) => {
        fx.add({ kind: 'beam', x0: W / 2 + (Math.random() - 0.5) * 30, y0: H + 4, x, y, color: '#cfeeff', glow: '#3a9ad8', w: 6, life: 380, delay: d });
        fx.burst(x, y, ['#e6fbff', '#9ae6ff', '#5ab8e8'], 18, 90, { delay: d, g: 140 });
        for (let k = 0; k < 5; k++) fx.bubble(x + (Math.random() - 0.5) * 20, y + 6, { delay: d + k * 40 });
      });
      return true;
    case 'fruits': // フルーツが はじける
      each((x, y, d) => {
        fx.impact(x, y, { r: 14, color: '#ffe0f0', delay: d });
        for (let k = 0; k < 10; k++) {
          const a = Math.random() * Math.PI * 2, s = 50 + Math.random() * 60;
          fx.add({ kind: 'fruit', fruit: k % 4, x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 50, g: 180, life: 750, delay: d });
        }
        for (let k = 0; k < 3; k++) fx.star(x + (k - 1) * 12, y - 12, pick(['#f7a1c4', '#ffe066', '#9ae6c0']), 6, d + k * 80, 300);
      });
      return true;
    case 'fruits_big': // フルーツメテオ: ふりそそぐ フルーツと 大きな はじけ
      fx.flashAt(160, '#fff0f8', 0);
      fx.hitStop(160);
      for (let k = 0; k < 26; k++) fx.add({ kind: 'fruit', fruit: k % 4, x: Math.random() * W, y: -10 - Math.random() * 40, vx: -20, vy: 160 + Math.random() * 60, life: 900, delay: k * 22 });
      each((x, y, d) => {
        fx.bigHit(x, y, { crit, heavy: true, delay: d, color: '#ff9ad0' });
        for (let k = 0; k < 8; k++) {
          const a = Math.random() * Math.PI * 2, s = 60 + Math.random() * 60;
          fx.add({ kind: 'fruit', fruit: k % 4, x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, g: 180, life: 700, delay: d });
        }
      });
      return true;
    case 'storm': // 旋風ステップ: 5色の つむじ風
      if (opts.fromAlly !== false) fx.circle('#9af0b0');
      each((x, y, d) => {
        fx.swirl(x, y, ['#ff6a6a', '#6a9aff', '#6ad88a', '#ffd84a', '#b07ae0'], { n: 30, rad: 18, h: 60, delay: d, life: 700, size: 2 });
        fx.star(x, y, '#ffffff', 12, d, 240);
        fx.burst(x, y, ['#ffffff', '#d8ffe0', '#9af0b0'], 14, 80, { delay: d });
      });
      return true;
    default:
      return false;
  }
}
