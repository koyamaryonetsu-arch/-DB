// 第83回 B班の 技の エフェクト（ぬ〜べ〜の 系統: 小学校の先生・れい能力教師ぬ〜べ〜・おにの手のじごく先生）
// 技の id では なく「えんしゅつの なまえ（anim）」で ひく。技の データの anim に ここの なまえを 書く。
// battlefx.js の play() で battlefx-r82b.js の あとに よばれる（ここに ない anim なら false を かえす）。
// え は かんたんな かたち（顔・文字は かかない）。自分や 仲間に かける 技は 前から ある えんしゅつ（guard・heal2・holy・charge・warcry・revive）なので、ここは 敵に 出す 物だけ
//
// 看板の技
//  nube_sig           おにの手・強制じょうぶつ … 画面が くらく なり、下から 赤い おにの手が 敵を つかむ → 白い 光の 柱が 天へ のびて きらきら
//  jigoku_sensei_sig  おにの手・最大出力       … 画面が 赤く なり、とても 大きな 赤い おにの手が 横に ふりぬいて 敵 みんなに しょうげき
// ほかの 技
//  r83b_eraser  黒板けしアタック … くるくる 回る 黒板けしが 飛んで 当たり、白い チョークの こなが ぱっと 広がる
//  r83b_ofuda   おふだ           … 白い おふだ（赤い しるし）が 回りながら 飛び、光の わ
//  r83b_oni     おにの手         … 赤い おにの手が 上から ふり下ろされ、つめの あと
//  r83b_renda   おにの手・れんげき … 赤い おにの手が 左右から 2回
//  r83b_crystal れい水しょう      … 敵の 上に すきとおった 水しょうの 玉が うかび、青い 光の わ
//  r83b_seal    よう気ふうじ     … 敵の まわりを おふだが 回って、むらさきの もようが とじる
//  r83b_fubuki  雪女のふぶき     … 画面が 青白く なり、雪と 氷の つぶが 横から ふきつける
// ・どれも 2.2びょう いないで おわる。あたる じかんは R83B_HIT（client/battle.js の HIT_DELAY に まぜる）

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t);

export const R83B_SIGS = ['nube_sig', 'jigoku_sensei_sig'];
export const R83B_MOVES = ['r83b_eraser', 'r83b_ofuda', 'r83b_oni', 'r83b_renda', 'r83b_crystal', 'r83b_seal', 'r83b_fubuki'];
export const R83B_ANIMS = new Set([...R83B_SIGS, ...R83B_MOVES]);
// あたる じかん（ms。ダメージの 数字を この ときに 出す）
export const R83B_HIT = {
  nube_sig: 760, jigoku_sensei_sig: 680,
  r83b_eraser: 360, r83b_ofuda: 380, r83b_oni: 300, r83b_renda: 260, r83b_crystal: 420, r83b_seal: 520, r83b_fubuki: 560,
};
// たたかいの 音（client/battle.js の ANIM_SFX に まぜる。audio.js に ある 音）
export const R83B_SFX = {
  nube_sig: 'smash', jigoku_sensei_sig: 'smash',
  r83b_eraser: 'hit', r83b_ofuda: 'card', r83b_oni: 'smash', r83b_renda: 'smash', r83b_crystal: 'sparkle', r83b_seal: 'debuff', r83b_fubuki: 'ice',
};

// ───────────── え の ぶひん ─────────────
// おにの手（ひらいた 手の ひらと 5本の 指。先に 白い つめ）。x,y … 手の ひらの まんなか、s … 大きさ、rot … かたむき、
// x0,y0 → x,y … 出て くる ところ（travel ms で とどく）
function drawHand(x, p, k, alpha) {
  const s = p.s || 1;
  const cx = p.x0 + (p.x - p.x0) * k, cy = p.y0 + (p.y - p.y0) * k;
  x.save();
  x.globalAlpha = alpha;
  x.translate(cx, cy);
  x.rotate(p.rot || 0);
  // 赤い 光
  x.fillStyle = 'rgba(255, 60, 40, 0.28)';
  x.beginPath();
  x.ellipse(0, -4 * s, 17 * s, 19 * s, 0, 0, Math.PI * 2);
  x.fill();
  // 指（ほそ長い だ円）と つめ
  const fingers = [[-8, -10, -0.35, 11], [-3.5, -13, -0.12, 13], [1.5, -13.5, 0.06, 13.5], [6, -12, 0.22, 12], [10, -2, 0.9, 9]];
  for (const [fx, fy, fr, fl] of fingers) {
    x.save();
    x.translate(fx * s, fy * s);
    x.rotate(fr);
    x.fillStyle = p.dark || '#a8141c';
    x.beginPath();
    x.ellipse(0, -fl * 0.4 * s, 2.3 * s, fl * 0.55 * s, 0, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = p.color || '#e8302a';
    x.beginPath();
    x.ellipse(-0.5 * s, -fl * 0.4 * s, 1.4 * s, fl * 0.45 * s, 0, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = '#fff6ea';
    x.beginPath();
    x.moveTo(-1.6 * s, -fl * 0.9 * s);
    x.lineTo(0, -fl * 1.18 * s);
    x.lineTo(1.6 * s, -fl * 0.9 * s);
    x.closePath();
    x.fill();
    x.restore();
  }
  // 手の ひら
  x.fillStyle = p.dark || '#a8141c';
  x.beginPath();
  x.ellipse(0, 0, 9.5 * s, 8.5 * s, 0, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = p.color || '#e8302a';
  x.beginPath();
  x.ellipse(-1.2 * s, -1 * s, 7.5 * s, 6.5 * s, 0, 0, Math.PI * 2);
  x.fill();
  // 手首の ほうへ
  x.fillStyle = p.dark || '#a8141c';
  x.fillRect(-6 * s, 6 * s, 12 * s, 9 * s);
  x.restore();
}

export const R83B_FINE = {
  // 赤い おにの手（出て きて、少し とまって、きえる）
  e83Hand(x, p, t) {
    const k = easeOut(clamp01(p.age / (p.travel || 260)));
    const fade = Math.max(0, 1 - Math.max(0, t - 0.7) * 3.3);
    drawHand(x, p, k, fade);
  },
  // 黒板けし（回りながら 飛ぶ。黒い もちての 上に 白っぽい ぬの）
  e83Eraser(x, p, t) {
    const k = easeOut(clamp01(p.age / (p.travel || 320)));
    const cx = p.x0 + (p.x1 - p.x0) * k, cy = p.y0 + (p.y1 - p.y0) * k - Math.sin(k * Math.PI) * 18;
    x.save();
    x.globalAlpha = Math.max(0, 1 - Math.max(0, t - 0.75) * 4);
    x.translate(cx, cy);
    x.rotate(p.age / 70);
    const s = p.s || 1;
    x.fillStyle = '#2a2a34';
    x.fillRect(-7 * s, -3 * s, 14 * s, 4 * s);
    x.fillStyle = '#d8d4c8';
    x.fillRect(-7 * s, 1 * s, 14 * s, 2.4 * s);
    x.fillStyle = '#ffffff';
    x.fillRect(-5 * s, 1.4 * s, 4 * s, 1 * s);
    x.restore();
  },
  // おふだ（白い 長方形に 赤い しるし。回りながら 飛ぶ）
  e83Ofuda(x, p, t) {
    const k = easeOut(clamp01(p.age / (p.travel || 340)));
    const cx = p.x0 + (p.x1 - p.x0) * k, cy = p.y0 + (p.y1 - p.y0) * k;
    x.save();
    x.globalAlpha = Math.max(0, 1 - Math.max(0, t - 0.8) * 5);
    x.translate(cx, cy);
    x.rotate((p.spin ?? 1) * p.age / 90);
    const s = p.s || 1;
    x.fillStyle = 'rgba(255, 250, 200, 0.35)';
    x.fillRect(-5 * s, -9 * s, 10 * s, 18 * s);
    x.fillStyle = '#fbf8ee';
    x.fillRect(-3.5 * s, -7.5 * s, 7 * s, 15 * s);
    x.fillStyle = '#d0202a';
    x.fillRect(-0.6 * s, -6 * s, 1.2 * s, 11 * s);
    x.fillRect(-2.4 * s, -4 * s, 4.8 * s, 1 * s);
    x.fillRect(-2.4 * s, 1 * s, 4.8 * s, 1 * s);
    x.restore();
  },
  // 水しょうの 玉（うかんで、光って、きえる）
  e83Crystal(x, p, t) {
    const up = easeOut(clamp01(p.age / 300));
    const a = Math.min(1, t * 4) * Math.max(0, 1 - Math.max(0, t - 0.75) * 4);
    const r = (p.r || 9) * (0.6 + 0.4 * up);
    const cy = p.y - 14 * up;
    x.save();
    x.globalAlpha = a;
    x.fillStyle = 'rgba(140, 220, 255, 0.35)';
    x.beginPath(); x.arc(p.x, cy, r * 1.6, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#bfefff';
    x.beginPath(); x.arc(p.x, cy, r, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#7ac8f0';
    x.beginPath(); x.arc(p.x + r * 0.2, cy + r * 0.25, r * 0.6, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#ffffff';
    x.beginPath(); x.arc(p.x - r * 0.35, cy - r * 0.35, r * 0.25, 0, Math.PI * 2); x.fill();
    x.restore();
  },
  // 光の 柱（下から 上へ のびて、ほそく なって きえる）
  e83Pillar(x, p, t) {
    const grow = easeOut(clamp01(p.age / 260));
    const w = (p.w || 12) * (1 - Math.max(0, t - 0.5) * 1.6);
    if (w <= 0) return;
    const top = p.y - (p.h || 140) * grow;
    x.save();
    x.globalAlpha = Math.max(0, 1 - Math.max(0, t - 0.6) * 2.4);
    x.fillStyle = 'rgba(255, 246, 210, 0.45)';
    x.fillRect(p.x - w, top, w * 2, p.y - top);
    x.fillStyle = '#ffffff';
    x.fillRect(p.x - w * 0.35, top, w * 0.7, p.y - top);
    x.restore();
  },
};

export function playR83bFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  if (!R83B_ANIMS.has(anim) || !targets || !targets.length) return false;
  const crit = !!opts.crit;
  const all = targets.length > 1;
  const sz = all ? 0.85 : 1;
  const from = opts.from || { x: W / 2, y: H + 6 };
  const each = (fn) => targets.forEach((t, i) => fn(t, i, i * (all ? 50 : 0)));
  const hit = (t, d, col = '#ffffff', r = 12) => {
    fx.impact(t.x + rnd(-5, 5), t.y + rnd(-5, 4), { r: (crit ? r + 5 : r) * sz, color: col, delay: d });
    fx.sparks(t.x, t.y, { colors: ['#ffffff', col], n: all ? 5 : 8, speed: 130, delay: d, life: 260, len: 6 });
  };
  // 赤い おにの手（o.from … 出て くる ところ）
  const hand = (t, d, o = {}) => fx.add({
    kind: 'e83Hand', x: t.x + (o.dx || 0), y: t.y + (o.dy ?? -2), x0: o.x0 ?? t.x + (o.dx || 0), y0: o.y0 ?? t.y - 40,
    s: (o.s || 1) * sz, rot: o.rot || 0, travel: o.travel || 240, life: o.life || 620, delay: d, color: o.color, dark: o.dark,
  });
  const claws = (t, d, ang = 0.5) => {
    for (let k = 0; k < 3; k++) fx.cut(t.x + (k - 1) * 5, t.y, { ang, len: 22 * sz, w: 2.4, color: '#fff0e8', glow: '#e8302a', delay: d + k * 30, life: 260 });
  };
  switch (anim) {
    // ───── 看板の技 ─────
    case 'nube_sig': {
      fx.tintAt('rgba(14, 6, 20, 0.5)', 1700);
      each((t, i, d) => {
        hand(t, 120 + d, { s: 1.6, y0: H + 20, x0: t.x - 10, travel: 360, life: 900 });
        fx.shock(t.x, t.y, { r0: 6, r1: 40 * sz, color: '#ff4a3a', w: 3, delay: 480 + d, life: 360 });
        fx.add({ kind: 'e83Pillar', x: t.x, y: t.y + 12, h: 150, w: 14 * sz, life: 900, delay: 620 + d });
        for (let k = 0; k < 6; k++) fx.twinkle(t.x + rnd(-14, 14), t.y - rnd(10, 60), { color: '#fff6c8', size: 5, delay: 760 + d + k * 60, life: 420, vy: -30 });
        hit(t, 760 + d, '#fff6c8', 16);
      });
      fx.flashAt(110, '#fff6e0', 760);
      fx.hitStop(crit ? 260 : 200, 760, 1.8);
      return true;
    }
    case 'jigoku_sensei_sig': {
      fx.tintAt('rgba(50, 0, 6, 0.5)', 1700);
      // とても 大きな 手が 左から 右へ
      const mid = { x: W / 2, y: targets.reduce((a, t) => a + t.y, 0) / targets.length };
      fx.add({ kind: 'e83Hand', x: W - 30, y: mid.y, x0: 20, y0: mid.y + 10, s: 3.2, rot: 1.35, travel: 620, life: 980, delay: 100 });
      each((t, i, d) => {
        claws(t, 520 + d, 0.2);
        fx.shock(t.x, t.y, { r0: 6, r1: 56 * sz, color: '#ff3a2a', w: 3.5, delay: 640 + d, life: 420 });
        hit(t, 680 + d, '#ff5a3a', 18);
      });
      fx.flashAt(120, '#ffd8d0', 680);
      fx.hitStop(crit ? 300 : 240, 680, 2.2);
      return true;
    }
    // ───── ほかの 技 ─────
    case 'r83b_eraser': {
      each((t, i, d) => {
        fx.add({ kind: 'e83Eraser', x0: from.x, y0: from.y - 10, x1: t.x, y1: t.y, travel: 340, life: 420, s: sz, delay: d });
        for (let k = 0; k < 6; k++) fx.puff(t.x + rnd(-6, 6), t.y + rnd(-4, 4), { color: '#f4f2ea', vx: rnd(-40, 40), vy: rnd(-40, 10), r0: 3, r1: 11, delay: 340 + d, life: 600, alpha: 0.75 });
        hit(t, 360 + d, '#f4f2ea', 11);
      });
      fx.hitStop(crit ? 140 : 90, 360, 1.0);
      return true;
    }
    case 'r83b_ofuda': {
      each((t, i, d) => {
        fx.add({ kind: 'e83Ofuda', x0: from.x, y0: from.y - 12, x1: t.x, y1: t.y - 2, travel: 360, life: 440, s: sz, delay: d });
        fx.ring(t.x, t.y, '#fff2a8', 2, 360 + d, 360, 26 * sz);
        fx.glow(t.x, t.y, { color: '#fff6c8', r: 18 * sz, delay: 360 + d, life: 360 });
        hit(t, 380 + d, '#fff2a8', 12);
      });
      return true;
    }
    case 'r83b_oni': {
      each((t, i, d) => {
        hand(t, d, { s: 1.2, travel: 220 });
        claws(t, 240 + d, 0.45);
        hit(t, 300 + d, '#ff4a3a', 14);
      });
      fx.hitStop(crit ? 180 : 120, 300, 1.3);
      return true;
    }
    case 'r83b_renda': {
      each((t, i, d) => {
        hand(t, d, { s: 1.1, dx: -8, x0: t.x - 50, y0: t.y - 20, rot: -0.5, travel: 200, life: 460 });
        claws(t, 200 + d, 0.6);
        hand(t, 280 + d, { s: 1.1, dx: 8, x0: t.x + 50, y0: t.y - 20, rot: 0.5, travel: 200, life: 460 });
        claws(t, 480 + d, -0.6);
        hit(t, 260 + d, '#ff4a3a', 12);
        hit(t, 540 + d, '#ff4a3a', 12);
      });
      fx.hitStop(crit ? 160 : 100, 260, 1.1);
      return true;
    }
    case 'r83b_crystal': {
      each((t, i, d) => {
        fx.add({ kind: 'e83Crystal', x: t.x, y: t.y - 10, r: 9 * sz, life: 900, delay: d });
        fx.ring(t.x, t.y, '#9ae4ff', 2, 380 + d, 420, 30 * sz);
        fx.converge(t.x, t.y, { colors: ['#bfefff', '#ffffff'], n: 10, r: 26, delay: 200 + d, life: 300 });
      });
      return true;
    }
    case 'r83b_seal': {
      each((t, i, d) => {
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * Math.PI * 2;
          fx.add({ kind: 'e83Ofuda', x0: t.x + Math.cos(a) * 34, y0: t.y + Math.sin(a) * 20, x1: t.x + Math.cos(a) * 14, y1: t.y + Math.sin(a) * 9, travel: 360, life: 620, s: 0.8 * sz, spin: 0.4, delay: d + k * 40 });
        }
        fx.rune(t.x, t.y, { color: '#c8a8ff', r: 22 * sz, delay: 360 + d, life: 520 });
        hit(t, 520 + d, '#c8a8ff', 10);
      });
      return true;
    }
    case 'r83b_fubuki': {
      fx.tintAt('rgba(160, 210, 255, 0.28)', 1300);
      for (let k = 0; k < 26; k++) {
        const y = rnd(10, H - 20);
        fx.sparks(-6, y, { colors: ['#ffffff', '#cdeeff'], n: 1, speed: rnd(220, 320), ang: rnd(-0.15, 0.25), spread: 0.1, delay: k * 30, life: 900, g: 10, size: 1.1, drag: 1, len: 4 });
      }
      each((t, i, d) => {
        for (let k = 0; k < 4; k++) fx.puff(t.x + rnd(-10, 10), t.y + rnd(-6, 6), { color: '#eaf6ff', vx: rnd(10, 50), vy: rnd(-10, 10), r0: 3, r1: 12, delay: 380 + d + k * 40, life: 640, alpha: 0.7 });
        fx.shock(t.x, t.y, { r0: 4, r1: 30 * sz, color: '#9ad8ff', w: 2, delay: 520 + d, life: 320 });
        hit(t, 560 + d, '#cdeeff', 12);
      });
      return true;
    }
  }
  return false;
}
