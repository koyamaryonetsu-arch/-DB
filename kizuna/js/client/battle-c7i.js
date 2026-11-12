// 第2部 第7章 第3幕 の いばらの魔女マレフィナ（黒い 竜）・カイの影・手下の 魔物の がめん（client/battle-c7s.js から よぶ。サーバーがわは shared/battle-c7i.js）
// ・マレフィナ: 頭の 上に 百年ねむりののろいまでの しるし（糸車の はり。のこり 1つは 赤く ゆれる）。いばらのかべが ある 間は「×0.25」（ダメージが へる）。
//   黒い 竜に なったら え が 竜の すがた（コマ 2・3。c7iSprite）・頭の 上に 黒いほのおのいきまでの しるし（ほのお）
// ・いばらのかべ: こわれて いる 間は 魔女の 足もとに、また はえるまでの 小さな 芽
// ・カイの影: 頭の 上に ねらいまでの しるし（ブーメラン）。ねらって いる 間は、ねらわれた 人の まどに「ねらわれている」（c7iMarks）・
//   影の まわりに 白い 光の わ（ブーメランまでの 数）
// ・バナー: のろいの 前ぶれ・ねむった・はね返した／かべを こわした・また はえた／変身・いきの 前ぶれ・いき／ねらった・ブーメランの 前ぶれ・はね返した・当たった
// ・敵が 使うと がめんの まん中に 大きく 出す 技・味方の まどの えんしゅつ・音（client/battle-c7s.js から client/battle-ch4.js・client/battle.js に まぜる）
import { C7_WITCH, C7_SHADOW } from '../shared/data/monsters-c7i.js?v=a1c844b80134';
import { monsterCanvas } from './render/monsters.js?v=a1c844b80134';
import { el } from './ui/dom.js?v=a1c844b80134';
// 第2部 第8章 第1幕: オウムのイアゴン・大臣ジャハール（コブラ・魔人）の がめん（battle-c8a.js）
//   （大技・味方の まど・音の 表は client/battle-ch4.js・client/battle.js が じかに まぜる）
import { C8A_OWN_TELE, c8aSprite, c8aDraw, c8aPresent } from './battle-c8a.js?v=a1c844b80134';

// 前ぶれの バナーを 自分で 出す（client/battle-c7s.js の C7S_OWN_TELE に まぜる）
export const C7I_OWN_TELE = [C7_WITCH, C7_SHADOW, ...C8A_OWN_TELE];

export const C7I_SCREEN_ANIMS = ['a7m_curse', 'a7m_transform', 'a7d_breath', 'a7h_throw'];
export const C7I_ALLY_FX = {
  a7n_iceball: 'ice', a7n_barrage: 'ice', a7n_bite: 'claw', a7n_breath: 'ice', a7n_spear: 'claw', a7n_march: 'claw',
  a7n_beam: 'ice', a7n_frost: 'ice', a7n_shine: 'down', a7n_storm: 'ice', a7n_freeze: 'ice', a7n_claw: 'claw',
  a7m_whip: 'claw', a7m_green: 'fire', a7m_staff: 'dark', a7m_laugh: 'down', a7m_curse: 'down',
  a7d_claw: 'claw', a7d_tail: 'quake', a7d_fire: 'fire', a7d_roar: 'down', a7d_breath: 'fire',
  a7h_star: 'claw', a7h_boomerang: 'claw', a7h_stitch: 'dark', a7h_dark: 'dark', a7h_throw: 'quake',
};
export const C7I_SFX = {
  a7n_iceball: 'ice', a7n_barrage: 'ice', a7n_bite: 'smash', a7n_breath: 'ice', a7n_spear: 'hit', a7n_march: 'hit', a7n_cheer: 'buff',
  a7n_beam: 'ice', a7n_frost: 'ice', a7n_shine: 'warn', a7n_storm: 'ice', a7n_freeze: 'ice', a7n_claw: 'hit',
  a7m_whip: 'hit', a7m_green: 'fire', a7m_staff: 'warn', a7m_laugh: 'warn', a7m_curse: 'warn', a7m_transform: 'blast',
  a7d_claw: 'smash', a7d_tail: 'smash', a7d_fire: 'fire', a7d_roar: 'warn', a7d_breath: 'blast',
  a7h_star: 'hit', a7h_boomerang: 'wind', a7h_stitch: 'warn', a7h_hide: 'buff', a7h_dark: 'warn', a7h_throw: 'blast', a7h_daze: 'hit',
};

// ───────────── え（client/battle.js の monsterCanvas の かわり）─────────────
// マレフィナが 黒い 竜に なったら、おなじ え の コマ 2・3（render/c7i-art.js）
export function c7iSprite(c, frame) {
  // 第8章 第1幕: ジャハールの コブラ・魔人（battle-c8a.js）
  const s8 = c8aSprite(c, frame);
  if (s8) return s8;
  if (c?.species !== C7_WITCH || c.c7form !== 2) return null;
  return monsterCanvas(C7_WITCH, (frame ? 1 : 0) + 2);
}

// しるしの うしろの くらい まる（背景と まざらない）
function backDot(x, cx, cy, r, base) {
  x.globalAlpha = base * 0.6;
  x.fillStyle = '#0c0814';
  x.beginPath();
  x.arc(cx, cy, r, 0, Math.PI * 2);
  x.fill();
}
// 糸車の はり（のろいの しるし）
function spindleMark(x, cx, cy, s, col) {
  x.strokeStyle = col;
  x.lineWidth = 1.4;
  x.beginPath();
  x.moveTo(cx - s * 0.8, cy + s * 0.8);
  x.lineTo(cx + s * 0.8, cy - s * 0.8);
  x.stroke();
  x.fillStyle = col;
  x.beginPath();
  x.arc(cx - s * 0.1, cy + s * 0.1, s * 0.35, 0, Math.PI * 2);
  x.fill();
}
// ほのお（いきの しるし）
function flameMark(x, cx, cy, s, col) {
  x.fillStyle = col;
  x.beginPath();
  x.moveTo(cx, cy - s);
  x.quadraticCurveTo(cx + s * 0.9, cy, cx, cy + s * 0.8);
  x.quadraticCurveTo(cx - s * 0.9, cy, cx, cy - s);
  x.fill();
}
// ブーメラン（ねらいの しるし）
function boomMark(x, cx, cy, s, col) {
  x.strokeStyle = col;
  x.lineWidth = 1.8;
  x.lineCap = 'round';
  x.beginPath();
  x.moveTo(cx - s, cy - s * 0.4);
  x.lineTo(cx, cy + s * 0.5);
  x.lineTo(cx + s, cy - s * 0.4);
  x.stroke();
}
// のこりの しるしを ならべる（on … のこり・max … ぜんぶ）
function marks(x, px, py, w, on, max, base, T, draw, cols) {
  const gap = 11, x0 = px + w / 2 - ((max - 1) * gap) / 2, y0 = Math.max(6, py - 6);
  for (let i = 0; i < max; i++) {
    const lit = i < on;
    const last = lit && on === 1;
    backDot(x, x0 + i * gap, y0, 5, base);
    x.globalAlpha = base * (lit ? (last ? 0.7 + Math.sin(T / 80) * 0.3 : 0.95) : 0.3);
    draw(x, x0 + i * gap, y0, 4, lit ? (last ? cols[1] : cols[0]) : cols[2]);
  }
  x.globalAlpha = base;
}
// 小さな 文字の ふだ（「×0.25」など）
function tag(x, tx, ty, text, base, bg, fg) {
  x.globalAlpha = base * 0.85;
  x.fillStyle = bg;
  x.fillRect(Math.round(tx - 15), Math.round(ty - 5), 30, 10);
  x.globalAlpha = base;
  x.fillStyle = fg;
  x.font = 'bold 7px sans-serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(text, tx, ty + 0.5);
  x.textAlign = 'start';
  x.textBaseline = 'alphabetic';
}

// ───────────── たたかいの え（client/battle-c7s.js の c7sDraw から）─────────────
export function c7iDraw(scene, x, m, c, px, py, w, h, base) {
  if (!c?.alive) return;
  const T = scene.time || 0;
  // マレフィナ（魔女）: のろいまでの しるし・かべの 間の ×0.25・かべが また はえるまで
  if (c.c7form === 1) {
    marks(x, px, py, w, c.curseLeft || 0, c.curseEvery || 5, base, T, spindleMark, ['#c8a0ff', '#ff6a4a', '#3a2a4a']);
    const thorn = [...(scene.c?.values?.() || [])].find((e) => e.c7thorn && e.alive);
    if (thorn) tag(x, px + w / 2, py + h * 0.42, `×${c.cut ?? 0.25}`, base, '#1a0a20', '#c8a0ff');
    for (let i = 0; i < (c.thornDown || 0); i++) {
      backDot(x, px + 6 + i * 10, py + h - 4, 4.5, base);
      x.globalAlpha = base * 0.9;
      x.fillStyle = '#4a8a5a';
      x.beginPath();
      x.moveTo(px + 6 + i * 10, py + h - 8);
      x.lineTo(px + 9 + i * 10, py + h - 2);
      x.lineTo(px + 3 + i * 10, py + h - 2);
      x.fill();
    }
    x.globalAlpha = base;
  }
  // 黒い 竜: いきまでの しるし
  if (c.c7form === 2) marks(x, px, py, w, c.breathLeft || 0, c.breathEvery || 4, base, T, flameMark, ['#4ae870', '#ff6a4a', '#1a3a2a']);
  // カイの影: ねらいまでの しるし／ねらって いる 間は 白い 光の わ
  if (c.aimEvery) {
    if (c.aims?.length) {
      const n = c.aimLead || 1;
      for (let i = 0; i < 2; i++) {
        const r = ((T / 8 + i * 20) % 40) / 40;
        x.globalAlpha = base * (0.6 - r * 0.5) * (n <= 1 ? 1.3 : 0.8);
        x.strokeStyle = n <= 1 ? '#ff8a6a' : '#e8f8ff';
        x.lineWidth = 2;
        x.beginPath();
        x.ellipse(px + w / 2, py + h * 0.55, w * (0.35 + r * 0.3), h * (0.4 + r * 0.25), 0, 0, Math.PI * 2);
        x.stroke();
      }
      x.globalAlpha = base;
      tag(x, px + w / 2, Math.max(8, py - 4), `あと${n}`, base, '#0c0a1a', n <= 1 ? '#ff8a6a' : '#e8f8ff');
    } else marks(x, px, py, w, c.aimLeft || 0, c.aimEvery || 3, base, T, boomMark, ['#a85ae0', '#ff6a4a', '#2a2448']);
    if (c.daze) tag(x, px + w / 2, py + h * 0.3, 'ふらふら', base, '#2a1a3a', '#ffe890');
  }
  // 第8章 第1幕（battle-c8a.js）
  c8aDraw(scene, x, m, c, px, py, w, h, base);
}

// ───────────── ねらわれて いる 人の まどの しるし ─────────────
const CSS = `
.b-mem.c7i-aim { box-shadow: 0 0 0 2px #000, inset 0 0 14px rgba(168, 90, 224, 0.9); }
.b-mem.c7i-aim::after {
  content: 'ねらわれている'; position: absolute; left: 50%; top: -0.95em; transform: translateX(-50%); z-index: 3; pointer-events: none;
  font-size: 0.78em; line-height: 1.25; white-space: nowrap; padding: 0 0.45em; color: #f4ecff;
  background: rgba(24, 12, 44, 0.94); border: 1px solid #a85ae0; border-radius: 4px; box-shadow: 0 0 0 1px #000;
}
`;
let styled = false;
function ensureCss() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  document.head.append(el('style', { id: 'c7i-css', text: CSS }));
}
export function c7iMarks(scene) {
  if (!scene.allies || !scene.statusBoxes) return;
  const aims = new Set();
  for (const e of scene.c?.values?.() || []) if (e.side === 'enemy' && e.alive && e.aims?.length) for (const id of e.aims) aims.add(id);
  let any = false;
  for (const a of scene.allies()) {
    const s = scene.statusBoxes.get(a.id);
    if (!s) continue;
    const on = a.alive && aims.has(a.id);
    if (on) any = true;
    s.box.classList.toggle('c7i-aim', on);
  }
  if (any) ensureCss();
}

// ───────────── イベントを 見せる とき（client/battle-c7s.js の c7sPresent から）─────────────
export function c7iPresent(scene, ev, fx, anim, actor) {
  const g = scene.game;
  const nameOf = (id) => scene.c?.get?.(id)?.name || '';
  const names = (ids) => (ids || []).map(nameOf).filter(Boolean).join('と');
  if (ev.c7iCurse?.left === 1) {
    g.audio.sfx('warn');
    scene.banner('！次に百年ねむりののろい…！身を守れ！', 'danger');
  }
  if (ev.c7iSleep) {
    if (ev.c7iSleep.safe?.length && !ev.c7iSleep.slept?.length) {
      g.audio.sfx('sparkle');
      scene.banner('みんな、のろいをはね返した！', 'combo');
    } else scene.banner(ev.c7iSleep.slept?.length ? `${names(ev.c7iSleep.slept)}がねむってしまった…！` : 'のろいは、だれにも効かなかった！', ev.c7iSleep.slept?.length ? 'danger' : 'combo');
  }
  if (ev.c7iBreak) {
    g.audio.sfx('crit');
    scene.banner('いばらのかべをこわした！今なら魔女にダメージがとどく！', 'combo');
  }
  if (ev.c7iRegrow) scene.banner('また、いばらのかべがのびてきた…！', 'danger');
  if (ev.c7iDragon) {
    scene.shake?.(900, 9);
    scene.banner('マレフィナが、黒い竜に姿をかえた…！', 'danger');
  }
  if (ev.c7iBreath?.left === 1) {
    g.audio.sfx('warn');
    scene.banner('！次に黒いほのおのいき…！身を守れ！', 'danger');
  }
  if (ev.c7iFire) {
    scene.shake?.(800, 8);
    scene.banner('黒いほのおのいき…！', 'danger');
  }
  if (ev.c7iMark) {
    g.audio.sfx('warn');
    scene.banner(`！${names(ev.c7iMark.who)}がねらわれた！身を守ると、はね返せる！`, 'danger');
  }
  if (ev.c7iAimLeft?.lead === 1) {
    g.audio.sfx('warn');
    scene.banner(`！次にかげブーメラン…！${names(ev.c7iAimLeft.who)}は身を守れ！`, 'danger');
  }
  if (ev.c7iThrow) {
    if (ev.c7iThrow.back?.length) {
      g.audio.sfx('crit');
      scene.banner(ev.c7iThrow.hit?.length ? `${names(ev.c7iThrow.back)}がはね返した！（${names(ev.c7iThrow.hit)}には当たった…）` : `${names(ev.c7iThrow.back)}がブーメランをはね返した！`, ev.c7iThrow.hit?.length ? 'danger' : 'combo');
    } else {
      scene.shake?.(700, 7);
      scene.banner('かげブーメランが当たった…！', 'danger');
    }
  }
  c7iMarks(scene);
  // 第8章 第1幕（battle-c8a.js）
  c8aPresent(scene, ev, fx, anim, actor);
}
