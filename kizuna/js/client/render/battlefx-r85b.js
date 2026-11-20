// 第85回 B班: 烈火の炎の 系統の 技の エフェクト（炎術士・八竜の炎術士・烈火）
// 技の id では なく「えんしゅつの なまえ（anim）」で ひく。battlefx.js の play() で battlefx-r84b.js の つぎに よばれる（ここに ない anim なら false）。
// え は かんたんな かたち（ロゴや 顔は かかない）。文字は 出さない
//
// 8ひきの 火竜（r85bDragon … うねる 長い 体。色と 形で 見分けが つく）
//  r85b_nadare   なだれ   … だいだいと 黄色の 太い 竜。空を わたりながら 火の玉を ふらせる
//  r85b_saiha    さいは   … まっ赤で 白い ひれ（刃）の 竜。まっすぐ とびこみ、炎の 刃で 切る
//  r85b_homura   ほむら   … もも色の ほそく 長い 竜。むちの ように 敵に まきつく
//  r85b_setsuna  せつな   … 白と 黄色の 小さな 竜。ぱっと 光って 画面が まっ白に
//  r85b_madoka   まどか   … こはく色の 竜が 仲間の まわりを まるく まわって けっかいに（みかた）
//  r85b_rui      るい     … むらさきの すけた 竜（とぎれとぎれの 体）。かげろうが ゆらゆら（みかた）
//  r85b_kokuu    こくう   … 青い 竜が 大きく 口を あけて 青白い 光線（敵1体）
//  r85b_resshin  れっしん … 金色の つばさの ある 不死鳥の 竜が 上へ まい上がる（みかた）
// 看板の技（'<職業の id>_sig'）
//  enjutsushi_sig 火竜・二ひき同時   … （みかた）2ひきの 竜が より合わさって 上へ（client/battle-r85b.js が 2ひきめの 火竜も 出す）
//  rekka_sig      八竜・同時しょうかん … 8色の 竜が つぎつぎに 画面を わたり、敵全体で 大ばくはつ
// ほかの 技
//  r85b_call     火竜を よぶ（みかた。右うでに 炎が ともる）  r85b_hanabi  花火（敵の 上で 色とりどりに はじける）
//  r85b_kemuri   忍びのかくれ身（みかた。けむり）              r85b_kaina   炎のうで・火影の目ざめ（みかた。炎が ふき上がる）
//  r85b_kiba     火竜のきば（炎の きばが かみつく）             r85b_hime    姫を守る忍び（みかた。赤い たての 光）
// ・どれも 2.2びょう いないで おわる。あたる じかんは R85B_HIT（battle.js の HIT_DELAY に まぜる）
import { PARTY_ANIMS } from './battlefx-jobs2.js?v=02b3721e7c0a';

const rnd = (a, b) => a + Math.random() * (b - a);
const ease = (t) => t * t * (3 - 2 * t);

export const R85B_SIG_JOBS = ['enjutsushi', 'rekka'];
export const R85B_SIGS = R85B_SIG_JOBS.map((j) => `${j}_sig`);
// 火竜の えんしゅつ（abilities-r85b.js の RYU の anim と おなじ じゅん）
export const R85B_DRAGONS = ['r85b_nadare', 'r85b_saiha', 'r85b_homura', 'r85b_setsuna', 'r85b_madoka', 'r85b_rui', 'r85b_kokuu', 'r85b_resshin'];
export const R85B_MOVES = ['r85b_hanabi', 'r85b_kiba'];
export const PARTY_ANIMS_R85B = new Set(['enjutsushi_sig', 'r85b_madoka', 'r85b_rui', 'r85b_resshin', 'r85b_call', 'r85b_kemuri', 'r85b_kaina', 'r85b_hime']);
export const R85B_ANIMS = new Set([...R85B_SIGS, ...R85B_DRAGONS, ...R85B_MOVES, ...PARTY_ANIMS_R85B]);
// battle.js・テストが 見る みかたの えんしゅつの 一覧に まぜる（第84回 B班と おなじ）
for (const a of PARTY_ANIMS_R85B) PARTY_ANIMS.add(a);

export const R85B_HIT = {
  enjutsushi_sig: 360, rekka_sig: 900,
  r85b_nadare: 520, r85b_saiha: 440, r85b_homura: 460, r85b_setsuna: 300, r85b_madoka: 420, r85b_rui: 380, r85b_kokuu: 560, r85b_resshin: 520,
  r85b_hanabi: 380, r85b_kiba: 300, r85b_call: 200, r85b_kemuri: 200, r85b_kaina: 260, r85b_hime: 240,
};
export const R85B_SFX = {
  enjutsushi_sig: 'fire', rekka_sig: 'blast',
  r85b_nadare: 'fire', r85b_saiha: 'crit', r85b_homura: 'whip', r85b_setsuna: 'sparkle', r85b_madoka: 'buff', r85b_rui: 'buff', r85b_kokuu: 'void', r85b_resshin: 'heal',
  r85b_hanabi: 'blast', r85b_kiba: 'fire', r85b_call: 'fire', r85b_kemuri: 'flee', r85b_kaina: 'buff', r85b_hime: 'buff',
};

// 火竜の 色と 形（abilities-r85b.js の RYU の color・color2 と おなじ 色）
//  w … 体の ふとさ、len … 体の ながさ（道の わりあい）、amp・freq … うねり、fin … 背の 刃、dot … とぎれた 体、wing … つばさ、jaw … 大きな 口、ring … まるく まわる
export const DRAGON_LOOK = {
  r85b_nadare: { color: '#ff7a1c', color2: '#ffd04a', w: 5.2, len: 0.42, amp: 10, freq: 1.6 },
  r85b_saiha: { color: '#e8201c', color2: '#ffb0a0', w: 4, len: 0.38, amp: 6, freq: 2.2, fin: true },
  r85b_homura: { color: '#ff4a8a', color2: '#ffc0d8', w: 2.6, len: 0.62, amp: 14, freq: 3 },
  r85b_setsuna: { color: '#fff4a0', color2: '#ffffff', w: 3, len: 0.26, amp: 8, freq: 2.6, spark: true },
  r85b_madoka: { color: '#ffb02a', color2: '#fff0b0', w: 4, len: 0.55, amp: 0, freq: 0, ring: true },
  r85b_rui: { color: '#b06ae8', color2: '#e8c8ff', w: 4, len: 0.5, amp: 12, freq: 2, dot: true },
  r85b_kokuu: { color: '#4ab8ff', color2: '#e0f6ff', w: 4.6, len: 0.36, amp: 5, freq: 1.4, jaw: true },
  r85b_resshin: { color: '#ffe04a', color2: '#ff6a1c', w: 4.2, len: 0.34, amp: 6, freq: 1.2, wing: true },
};

// うねる 竜の 体（FINE。p … { x0, y0, x1, y1, look〈DRAGON_LOOK〉, s〈大きさ〉 }。ring の 竜は cx・cy の まわりを まわる）
export const R85B_FINE = {
  r85bDragon(x, p, t) {
    const L = p.look || DRAGON_LOOK.r85b_nadare;
    const s = p.s || 1;
    const fade = t < 0.78 ? 1 : Math.max(0, 1 - (t - 0.78) / 0.22);
    const head = ease(Math.min(1, t / 0.8)) * (1 + L.len);
    const n = 18;
    const at = (u) => {
      if (L.ring) {
        const a = u * Math.PI * 2.2 + (p.ph || 0);
        return [p.cx + Math.cos(a) * (p.rx || 40), p.cy + Math.sin(a) * (p.ry || 14)];
      }
      const dx = p.x1 - p.x0, dy = p.y1 - p.y0, d = Math.hypot(dx, dy) || 1;
      const off = Math.sin((u * L.freq + (p.ph || 0)) * Math.PI * 2) * L.amp * s;
      return [p.x0 + dx * u + (-dy / d) * off, p.y0 + dy * u + (dx / d) * off];
    };
    x.save();
    x.globalCompositeOperation = 'source-over';
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const u = head - (i / n) * L.len;
      if (u < 0) break;
      pts.push([...at(Math.min(u, 1.15)), i]);
    }
    // しっぽから 頭へ（頭を いちばん 上に）
    for (let j = pts.length - 1; j >= 0; j--) {
      const [px, py, i] = pts[j];
      if (L.dot && i % 2) continue;
      const r = L.w * s * (1 - (i / n) * 0.65);
      x.globalAlpha = fade * (L.dot ? 0.55 : 1);
      x.fillStyle = L.color;
      x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill();
      x.fillStyle = L.color2;
      x.beginPath(); x.arc(px, py + r * 0.35, r * 0.45, 0, Math.PI * 2); x.fill();
      // 背の 刃（さいは）
      if (L.fin && i % 3 === 1) {
        x.fillStyle = '#ffffff';
        x.beginPath(); x.moveTo(px - r * 0.6, py - r * 0.6); x.lineTo(px, py - r * 2.1); x.lineTo(px + r * 0.6, py - r * 0.6); x.fill();
      }
      // つばさ（れっしん）
      if (L.wing && i === 4) {
        const flap = Math.sin(p.age / 70) * 0.5 + 0.6;
        x.fillStyle = L.color2;
        for (const sd of [-1, 1]) {
          x.beginPath(); x.moveTo(px, py); x.lineTo(px + sd * 16 * s, py - 14 * s * flap); x.lineTo(px + sd * 22 * s, py - 4 * s * flap); x.lineTo(px + sd * 6 * s, py + 2 * s); x.fill();
        }
      }
    }
    // 頭（つの・目・口）
    if (pts.length) {
      const [hx, hy] = pts[0];
      const nx = pts[1] ? hx - pts[1][0] : 1, ny = pts[1] ? hy - pts[1][1] : 0;
      const d = Math.hypot(nx, ny) || 1, ux = nx / d, uy = ny / d;
      const hr = L.w * s * 1.35;
      x.globalAlpha = fade;
      x.fillStyle = L.color;
      x.beginPath(); x.arc(hx, hy, hr, 0, Math.PI * 2); x.fill();
      // つの（2本。うしろ むき）
      x.strokeStyle = L.color2;
      x.lineWidth = Math.max(1, s * 1.2);
      for (const sd of [-1, 1]) {
        x.beginPath(); x.moveTo(hx - ux * hr * 0.3 - uy * sd * hr * 0.6, hy - uy * hr * 0.3 + ux * sd * hr * 0.6);
        x.lineTo(hx - ux * hr * 1.9 - uy * sd * hr * 1.3, hy - uy * hr * 1.9 + ux * sd * hr * 1.3); x.stroke();
      }
      // 口（こくうは 大きく あける）
      x.fillStyle = L.jaw ? '#ffffff' : L.color2;
      const jw = L.jaw ? 0.9 : 0.45;
      x.beginPath(); x.moveTo(hx + ux * hr * 0.4, hy + uy * hr * 0.4); x.lineTo(hx + ux * hr * 1.9 - uy * hr * jw, hy + uy * hr * 1.9 + ux * hr * jw); x.lineTo(hx + ux * hr * 1.9 + uy * hr * jw, hy + uy * hr * 1.9 - ux * hr * jw); x.fill();
      x.fillStyle = '#ffffff';
      x.fillRect(Math.round(hx - uy * hr * 0.4) - 0.5, Math.round(hy + ux * hr * 0.4 - hr * 0.3) - 0.5, 1.5, 1.5);
      if (L.spark) {
        x.fillStyle = '#ffffff';
        x.globalAlpha = fade * 0.6;
        x.beginPath(); x.arc(hx, hy, hr * 2.2, 0, Math.PI * 2); x.fill();
      }
    }
    x.restore();
  },
};

// 竜を 1ぴき 出す（from → to。life … とぶ 時間）
function dragon(fx, anim, from, to, { delay = 0, life = 900, s = 1, ph = 0 } = {}) {
  fx.add({ kind: 'r85bDragon', x: to.x, y: to.y, x0: from.x, y0: from.y, x1: to.x, y1: to.y, look: DRAGON_LOOK[anim], s, ph, delay, life });
}
// みかたの まわりを まわる 竜（まどか）
function ringDragon(fx, anim, cx, cy, { delay = 0, life = 1100, s = 1, rx = 46, ry = 14, ph = 0 } = {}) {
  fx.add({ kind: 'r85bDragon', x: cx, y: cy, cx, cy, rx, ry, look: DRAGON_LOOK[anim], s, ph, delay, life });
}
const FIRE = ['#fff0a0', '#ffb040', '#ff6a1c', '#d8301c'];

export function playR85bFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  if (!R85B_ANIMS.has(anim) || !targets || !targets.length) return false;
  const crit = !!opts.crit;
  const all = targets.length > 1;
  const sz = all ? 0.85 : 1;
  const each = (fn) => targets.forEach((t, i) => fn(t, i, i * (all ? 50 : 0)));
  const hitMark = (t, d, col, r = 16) => {
    fx.impact(t.x, t.y, { r: (crit ? r + 6 : r) * sz, color: '#ffffff', delay: d });
    fx.sparks(t.x, t.y, { colors: ['#ffffff', col], n: all ? 8 : 14, speed: 140, delay: d, life: 340, len: 6 });
  };
  const me = targets[0];
  const avgY = targets.reduce((a, t) => a + t.y, 0) / targets.length;
  const L = DRAGON_LOOK[anim];
  switch (anim) {
    // ───── 8ひきの 火竜 ─────
    case 'r85b_nadare': {
      fx.tintAt('rgba(60, 20, 0, 0.25)', 1100);
      dragon(fx, anim, { x: -20, y: avgY - 34 }, { x: W + 20, y: avgY - 44 }, { life: 1000, s: 1.1 });
      each((t, i, d) => {
        for (let k = 0; k < (all ? 2 : 4); k++) fx.proj(t.x + rnd(-8, 8), t.y + rnd(-6, 6), FIRE, { size: 3.5, travel: 220, delay: d + 260 + k * 70, from: { x: t.x + rnd(-30, 30), y: avgY - 46 } });
        hitMark(t, d + 520, L.color, 14);
        fx.fireUp(t.x, t.y, 5, d + 520);
      });
      fx.hitStop(crit ? 160 : 110, 520, 1.1);
      return true;
    }
    case 'r85b_saiha': {
      each((t, i, d) => {
        dragon(fx, anim, { x: t.x - 120, y: t.y + 30 }, { x: t.x + 30, y: t.y - 10 }, { delay: d, life: 620 });
        fx.arc(t.x, t.y, { r: 26 * sz, a0: -2.6, a1: 0.6, w: 5, color: '#ffffff', glow: L.color, delay: d + 420, life: 300 });
        fx.bigCut(t.x, t.y, { ang: 0.6, color: '#ffffff', glow: L.color, w: 3, delay: d + 440, life: 300 });
        hitMark(t, d + 440, L.color, 20);
      });
      fx.hitStop(crit ? 200 : 140, 440, 1.4);
      return true;
    }
    case 'r85b_homura': {
      each((t, i, d) => {
        dragon(fx, anim, { x: W / 2 + rnd(-20, 20), y: H + 10 }, { x: t.x, y: t.y - 6 }, { delay: d, life: 700, s: 0.9, ph: i * 0.3 });
        fx.lash(W / 2, H, t.x, t.y, { color: L.color, glow: L.color2, w: 2.4, delay: d + 300, life: 420, bow: -18, amp: 8 });
        for (let k = 0; k < 3; k++) fx.shock(t.x, t.y + 2 - k * 6, { r0: 4, r1: 16 * sz, color: L.color, w: 1.6, delay: d + 420 + k * 60, life: 420, sy: 0.35 });
        hitMark(t, d + 460, L.color, 14);
      });
      return true;
    }
    case 'r85b_setsuna': {
      dragon(fx, anim, { x: W / 2, y: H + 10 }, { x: W / 2, y: avgY - 40 }, { life: 520, s: 0.9 });
      fx.flashAt(220, '#ffffff', 300);
      each((t, i, d) => {
        for (let k = 0; k < 4; k++) fx.star(t.x + rnd(-14, 14), t.y + rnd(-16, 6), k % 2 ? '#fff4a0' : '#ffffff', 8, d + 320 + k * 40, 360);
        fx.glow(t.x, t.y - 4, { color: '#fff8d0', r: 18 * sz, delay: d + 300, life: 420, alpha: 0.8 });
      });
      return true;
    }
    case 'r85b_kokuu': {
      each((t, i, d) => {
        const from = { x: 10, y: t.y - 30 };
        dragon(fx, anim, { x: -30, y: t.y - 10 }, { x: t.x - 40, y: t.y - 20 }, { delay: d, life: 520, s: 1.1 });
        fx.spear(t.x - 40, t.y - 20, t.x, t.y, { len: 90, w: 4, color: '#ffffff', glow: L.color, tip: '#e0f6ff', delay: d + 420, travel: 120, hold: 120, life: 360 });
        fx.glow(from.x + 20, from.y + 10, { color: L.color, r: 10, delay: d + 380, life: 300, alpha: 0.7 });
        fx.shock(t.x, t.y, { r0: 6, r1: 44 * sz, color: L.color, w: 3, delay: d + 540, life: 380 });
        hitMark(t, d + 560, L.color, 22);
      });
      fx.flashAt(140, '#e0f6ff', 540);
      fx.hitStop(crit ? 240 : 180, 560, 1.6);
      return true;
    }
    // ───── みかたに よぶ 火竜（下の まん中） ─────
    case 'r85b_madoka': {
      ringDragon(fx, anim, me.x, me.y + 4, { life: 1200, s: 1, rx: 60, ry: 16 });
      fx.shock(me.x, me.y + 6, { r0: 10, r1: 70, color: L.color, w: 2.4, delay: 380, life: 620, sy: 0.3 });
      fx.glow(me.x, me.y - 6, { color: L.color2, r: 30, delay: 420, life: 560, alpha: 0.45 });
      return true;
    }
    case 'r85b_rui': {
      dragon(fx, anim, { x: me.x - 90, y: me.y + 6 }, { x: me.x + 90, y: me.y - 10 }, { life: 900 });
      for (let k = 0; k < 10; k++) fx.puff(me.x + rnd(-60, 60), me.y + rnd(-14, 6), { color: k % 2 ? L.color : L.color2, r0: 4, r1: 14, delay: 260 + k * 40, life: 700, alpha: 0.4, vy: -10 });
      return true;
    }
    case 'r85b_resshin': {
      dragon(fx, anim, { x: me.x, y: me.y + 30 }, { x: me.x + 10, y: me.y - 70 }, { life: 1000, s: 1.2 });
      fx.fanShape(me.x, me.y - 30, { r: 34, color: L.color, rib: L.color2, delay: 420, life: 520, ribs: 9 });
      for (let k = 0; k < 10; k++) fx.twinkle(me.x + rnd(-30, 30), me.y + rnd(-10, 10), { color: k % 2 ? '#fff4a0' : '#ffb040', size: 5, delay: 420 + k * 40, life: 520, vy: -30 });
      return true;
    }
    // ───── 看板の技 ─────
    case 'enjutsushi_sig': {
      // 2ひきの 竜が より合わさって 上へ
      fx.tintAt('rgba(50, 10, 0, 0.3)', 1200);
      dragon(fx, 'r85b_saiha', { x: me.x - 30, y: me.y + 30 }, { x: me.x + 20, y: me.y - 80 }, { life: 900, ph: 0 });
      dragon(fx, 'r85b_nadare', { x: me.x + 30, y: me.y + 30 }, { x: me.x - 20, y: me.y - 80 }, { life: 900, ph: 0.5, delay: 60 });
      fx.swirl(me.x, me.y, FIRE, { n: 22, rad: 20, h: 50, delay: 100, life: 700, size: 1.5 });
      return true;
    }
    case 'rekka_sig': {
      fx.tintAt('rgba(40, 6, 0, 0.45)', 2000);
      // 8色の 竜が つぎつぎに わたる
      R85B_DRAGONS.forEach((a, k) => {
        const y0 = avgY - 50 + (k % 4) * 16;
        const left = k % 2 === 0;
        dragon(fx, a, { x: left ? -30 : W + 30, y: y0 + 20 }, { x: left ? W + 30 : -30, y: y0 - 6 }, { delay: k * 70, life: 900, s: 0.9, ph: k * 0.2 });
      });
      each((t, i, d) => {
        fx.glow(t.x, t.y, { color: '#ffb040', r: 30 * sz, delay: d + 820, life: 420, alpha: 0.9 });
        fx.shock(t.x, t.y, { r0: 8, r1: 60 * sz, color: '#ff6a1c', w: 3.5, delay: d + 860, life: 460 });
        fx.fireUp(t.x, t.y, 8, d + 860);
        hitMark(t, d + 900, '#ff6a1c', 24);
      });
      fx.flashAt(260, '#fff0c0', 860);
      fx.hitStop(crit ? 280 : 220, 900, 1.8);
      return true;
    }
    // ───── ほかの 技 ─────
    case 'r85b_hanabi': {
      each((t, i, d) => {
        const cols = ['#ff4a4a', '#ffd04a', '#4ab8ff', '#8ae86a', '#ff8ad8'];
        fx.proj(t.x, t.y - 20, ['#ffffff', '#ffd04a'], { size: 3, travel: 260, delay: d });
        fx.burst(t.x, t.y - 20, cols, all ? 14 : 22, 110, { delay: d + 260 });
        fx.shock(t.x, t.y - 20, { r0: 4, r1: 30 * sz, color: '#ffd04a', w: 2, delay: d + 260, life: 380 });
        hitMark(t, d + 380, '#ff8a3a', 14);
      });
      return true;
    }
    case 'r85b_kiba': {
      each((t, i, d) => {
        fx.fang(t.x, t.y, { color: '#fff0a0', glow: '#ff6a1c', size: 1.3 * sz, delay: d, life: 380 });
        fx.fireUp(t.x, t.y, 6, d + 260);
        hitMark(t, d + 300, '#ff6a1c', 18);
      });
      fx.hitStop(crit ? 180 : 120, 300, 1.2);
      return true;
    }
    case 'r85b_call': {
      fx.swirl(me.x + 10, me.y - 4, FIRE, { n: 14, rad: 10, h: 30, delay: 0, life: 520, size: 1.3 });
      fx.glow(me.x + 10, me.y - 8, { color: '#ff8a3a', r: 14, delay: 60, life: 420, alpha: 0.7 });
      return true;
    }
    case 'r85b_kemuri': {
      for (let k = 0; k < 10; k++) fx.puff(me.x + rnd(-24, 24), me.y + rnd(-8, 8), { color: k % 2 ? '#d8d4dc' : '#a8a4b0', r0: 5, r1: 16, delay: k * 30, life: 640, alpha: 0.7, vx: rnd(-20, 20), vy: -10 });
      return true;
    }
    case 'r85b_kaina': {
      fx.fireUp(me.x, me.y, 14, 0);
      fx.swirl(me.x, me.y, FIRE, { n: 20, rad: 16, h: 44, delay: 60, life: 640, size: 1.4 });
      fx.arrows(me.x, me.y - 4, '#ff8a3a', true, 3, 200);
      return true;
    }
    case 'r85b_hime': {
      fx.glow(me.x, me.y - 8, { color: '#ff6a4a', r: 26, delay: 0, life: 520, alpha: 0.6 });
      fx.shock(me.x, me.y + 4, { r0: 6, r1: 44, color: '#ffb07a', w: 2.2, delay: 80, life: 480, sy: 0.4 });
      fx.arrows(me.x, me.y - 4, '#ffd04a', true, 2, 160);
      return true;
    }
    default: return false;
  }
}
