// 第2部 第8章 第2幕 の ペイニックと パニクル・よみの王ハデロス（おこった すがた）・手下の 魔物の がめん
// （client/battle-c8a.js から よぶ。サーバーがわは shared/battle-c8b.js）
// ・小おに: 頭の 上に ばけばけ大がったいまでの しるし（おばけ。のこり 1つは 赤く ゆれる）。相談の 間は「ひそひそ」の ふだ、けんかの 間は「けんか」。
//   パニックの 間は「あたふた」と「×1.5」・あせの しずく、カンカンの 間は「カンカン」と ひとりばけばけまでの しるし。え は コマ 2・3（c8bSprite）
// ・ハデロス: 1だんめ … けいやくまでの しるし（まき物）・けいやくの 間は「けいやく」と たましいを とられるまでの しるし・赤く ちらちら する 前ぶれ／
//   2だんめ … 大ふん火までの しるし（ほのお）。え は おこった すがた（コマ 2・3）。あちちっ・頭が ひえた 間は ふだ
// ・けいやくされた 人の まどに「けいやく」（c8bMarks）
// ・バナー: 相談・大がったいの 前ぶれ・けんか・がったい・パニック・カンカン・ひとりばけばけの 前ぶれ／
//   けいやくの 前ぶれ・けいやく・すいとる・たましいの 前ぶれ・もやした・たましいを とられた・赤く ちらちら・おこった・ふん火の 前ぶれ・ふん火・ひえた
// ・敵が 使うと がめんの まん中に 大きく 出す 技・味方の まどの えんしゅつ・音（client/battle-ch4.js・client/battle.js に まぜる）
import { C8_PAIN, C8_PANIC, C8_HADES } from '../shared/data/monsters-c8b.js?v=e3f2209f7dc0';
import { monsterCanvas } from './render/monsters.js?v=e3f2209f7dc0';
import { el } from './ui/dom.js?v=e3f2209f7dc0';

// 前ぶれの バナーを 自分で 出す（client/battle-c8a.js の C8A_OWN_TELE に まぜる）
export const C8B_OWN_TELE = [C8_PAIN, C8_PANIC, C8_HADES];

export const C8B_SCREEN_ANIMS = ['b8i_fuse', 'b8i_solo', 'b8h_contract', 'b8h_soul', 'b8h_anger', 'b8h_erupt'];
export const C8B_ALLY_FX = {
  b8n_bite: 'claw', b8n_fire: 'fire', b8n_howl: 'down', b8n_fbite: 'claw', b8n_dash: 'claw', b8n_rattle: 'dark',
  b8n_zap: 'bolt', b8n_sting: 'bolt', b8n_flame: 'fire', b8n_wail: 'down', b8n_drain: 'dark', b8n_hbite: 'claw', b8n_heads: 'claw',
  b8i_pound: 'quake', b8i_belly: 'quake', b8i_tease: 'down', b8i_scratch: 'claw', b8i_bluefire: 'fire', b8i_trip: 'claw', b8i_fuse: 'quake', b8i_solo: 'quake',
  b8h_bluefire: 'fire', b8h_skull: 'dark', b8h_talk: 'down', b8h_contract: 'dark', b8h_soul: 'dark',
  b8h_fist: 'quake', b8h_flare: 'fire', b8h_shout: 'down', b8h_erupt: 'fire',
};
export const C8B_SFX = {
  b8n_bite: 'hit', b8n_fire: 'fire', b8n_howl: 'warn', b8n_fbite: 'hit', b8n_dash: 'smash', b8n_rattle: 'warn', b8n_zap: 'bolt', b8n_sting: 'hit', b8n_glow: 'buff',
  b8n_flame: 'fire', b8n_wail: 'warn', b8n_drain: 'dark', b8n_hbite: 'smash', b8n_heads: 'hit', b8n_regrow: 'buff',
  b8i_pound: 'smash', b8i_belly: 'smash', b8i_tease: 'warn', b8i_scratch: 'hit', b8i_bluefire: 'fire', b8i_trip: 'hit', b8i_fuse: 'blast',
  b8i_quarrel: 'hit', b8i_panic: 'warn', b8i_rage: 'blast', b8i_solo: 'blast',
  b8h_bluefire: 'fire', b8h_skull: 'dark', b8h_talk: 'warn', b8h_contract: 'warn', b8h_soul: 'dark', b8h_hot: 'hit', b8h_anger: 'blast',
  b8h_fist: 'smash', b8h_flare: 'fire', b8h_shout: 'warn', b8h_erupt: 'blast', b8h_cool: 'ice',
};

// ───────────── え（client/battle.js の monsterCanvas の かわり）─────────────
// ハデロスが おこったら おなじ え の コマ 2・3。小おにの パニック・カンカンも コマ 2・3（render/c8b-art.js）
export function c8bSprite(c, frame) {
  const sp = c?.species;
  if (sp === C8_HADES && c.c8hform === 2) return monsterCanvas(C8_HADES, (frame ? 1 : 0) + 2);
  if ((sp === C8_PAIN || sp === C8_PANIC) && c.impForm === 2) return monsterCanvas(sp, (frame ? 1 : 0) + 2);
  return null;
}

// しるしの うしろの くらい まる（背景と まざらない）
function backDot(x, cx, cy, r, base) {
  x.globalAlpha = base * 0.6;
  x.fillStyle = '#060c18';
  x.beginPath();
  x.arc(cx, cy, r, 0, Math.PI * 2);
  x.fill();
}
// おばけ（ばけばけの しるし）
function ghostMark(x, cx, cy, s, col) {
  x.fillStyle = col;
  x.beginPath();
  x.arc(cx, cy - s * 0.2, s * 0.75, Math.PI, 0);
  x.lineTo(cx + s * 0.75, cy + s * 0.7);
  x.lineTo(cx + s * 0.25, cy + s * 0.4);
  x.lineTo(cx - s * 0.25, cy + s * 0.7);
  x.lineTo(cx - s * 0.75, cy + s * 0.4);
  x.closePath();
  x.fill();
}
// まき物（けいやくの しるし）
function scrollMark(x, cx, cy, s, col) {
  x.fillStyle = col;
  x.fillRect(cx - s * 0.6, cy - s * 0.7, s * 1.2, s * 1.4);
  x.fillRect(cx - s * 0.85, cy - s * 0.85, s * 1.7, s * 0.35);
  x.fillRect(cx - s * 0.85, cy + s * 0.5, s * 1.7, s * 0.35);
}
// たましい（とられるまでの しるし）
function soulMark(x, cx, cy, s, col) {
  x.fillStyle = col;
  x.beginPath();
  x.arc(cx, cy + s * 0.2, s * 0.6, 0, Math.PI * 2);
  x.moveTo(cx - s * 0.5, cy);
  x.quadraticCurveTo(cx, cy - s * 1.4, cx + s * 0.3, cy - s * 0.9);
  x.quadraticCurveTo(cx + s * 0.2, cy - s * 0.3, cx + s * 0.55, cy);
  x.fill();
}
// ほのお（ふん火の しるし）
function flameMark(x, cx, cy, s, col) {
  x.fillStyle = col;
  x.beginPath();
  x.moveTo(cx, cy - s);
  x.quadraticCurveTo(cx + s * 0.9, cy, cx, cy + s * 0.8);
  x.quadraticCurveTo(cx - s * 0.9, cy, cx, cy - s);
  x.fill();
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
// 小さな 文字の ふだ
function tag(x, tx, ty, text, base, bg, fg, wd = 30) {
  x.globalAlpha = base * 0.85;
  x.fillStyle = bg;
  x.fillRect(Math.round(tx - wd / 2), Math.round(ty - 5), wd, 10);
  x.globalAlpha = base;
  x.fillStyle = fg;
  x.font = 'bold 7px sans-serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(text, tx, ty + 0.5);
  x.textAlign = 'start';
  x.textBaseline = 'alphabetic';
}
// あせの しずく（パニック）
function sweat(x, px, py, w, h, base, T) {
  for (let i = 0; i < 3; i++) {
    const t = ((T / 400 + i / 3) % 1);
    const sx = px + w * (0.2 + i * 0.3), sy = py + h * 0.2 + t * h * 0.3;
    x.globalAlpha = base * (1 - t) * 0.9;
    x.fillStyle = '#9ad8ff';
    x.beginPath();
    x.moveTo(sx, sy - 3);
    x.quadraticCurveTo(sx + 2.5, sy + 1, sx, sy + 2.5);
    x.quadraticCurveTo(sx - 2.5, sy + 1, sx, sy - 3);
    x.fill();
  }
  x.globalAlpha = base;
}
// 赤い ちらちら（ハデロスが おこる 前ぶれ）
function flicker(x, px, py, w, h, base, T) {
  for (let i = 0; i < 4; i++) {
    const a = 0.4 + Math.sin(T / 70 + i * 1.7) * 0.4;
    if (a <= 0.05) continue;
    x.globalAlpha = base * a;
    flameMark(x, px + w * (0.35 + i * 0.1), py + h * 0.08 + (i % 2) * 3, 3 + (i % 2), '#ff4a2a');
  }
  x.globalAlpha = base;
}

// ───────────── たたかいの え（client/battle-c8a.js の c8aDraw から）─────────────
export function c8bDraw(scene, x, m, c, px, py, w, h, base) {
  if (!c?.alive) return;
  const T = scene.time || 0;
  // 小おに
  if (c.impEvery) {
    marks(x, px, py, w, c.impLeft || 0, c.impEvery, base, T, ghostMark, ['#e8f0ff', '#ff6a4a', '#2a3040']);
    if (c.plot) tag(x, px + w / 2, py + h * 0.18, 'ひそひそ', base, '#10203a', '#9ad8ff', 36);
  }
  if (c.quarrel) tag(x, px + w / 2, py + h * 0.3, 'けんか', base, '#3a1a0a', '#ffb06a');
  if (c.panicLeft) {
    sweat(x, px, py, w, h, base, T);
    tag(x, px + w / 2, Math.max(8, py - 4), 'あたふた', base, '#10203a', '#9ad8ff', 36);
    tag(x, px + w / 2, py + h * 0.62, `×${c.panicK ?? 1.5}`, base, '#1a2a10', '#c8ff8a');
  }
  if (c.rage) {
    tag(x, px + w / 2, py + h * 0.18, 'カンカン', base, '#3a0808', '#ff8a6a', 36);
    marks(x, px, py, w, c.soloLeft || 0, c.soloEvery || 2, base, T, ghostMark, ['#ffb0a0', '#ff3a3a', '#3a2020']);
  }
  // ハデロス
  if (c.c8hform === 1) {
    if (c.bound) {
      tag(x, px + w / 2, py + h * 0.18, 'けいやく', base, '#1a0a2a', '#e0c8ff', 36);
      marks(x, px, py, w, (c.soulLeft ?? 0) + 1, 3, base, T, soulMark, ['#c8e0ff', '#ff4a6a', '#2a2a3a']);
    } else marks(x, px, py, w, c.contractLeft || 0, c.contractEvery || 4, base, T, scrollMark, ['#f0e0b0', '#ff6a4a', '#3a3428']);
    if (c.flicker) flicker(x, px, py, w, h, base, T);
  }
  if (c.c8hform === 2) marks(x, px, py, w, c.eruptLeft || 0, c.eruptEvery || 3, base, T, flameMark, ['#ff9a4a', '#ff2a2a', '#3a2010']);
  if (c.hot) tag(x, px + w / 2, py + h * 0.3, 'あちちっ', base, '#3a1a0a', '#ffd06a', 36);
  if (c.cool) tag(x, px + w / 2, py + h * 0.3, 'ひえひえ', base, '#0a1a3a', '#9ae6ff', 36);
}

// ───────────── けいやくされた 人の まどの しるし ─────────────
const CSS = `
.b-mem.c8b-bound { box-shadow: 0 0 0 2px #000, inset 0 0 14px rgba(150, 110, 230, 0.9); }
.b-mem.c8b-bound::after {
  content: 'けいやく'; position: absolute; left: 50%; top: -0.95em; transform: translateX(-50%); z-index: 3; pointer-events: none;
  font-size: 0.78em; line-height: 1.25; white-space: nowrap; padding: 0 0.45em; color: #f0e8ff;
  background: rgba(26, 10, 44, 0.94); border: 1px solid #9a6ae0; border-radius: 4px; box-shadow: 0 0 0 1px #000;
}
`;
let styled = false;
function ensureCss() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  document.head.append(el('style', { id: 'c8b-css', text: CSS }));
}
// けいやくされた 人（ev.c8bContract の 人。もえる・とられる・おこると はずす）を 覚えて おく
export function c8bMarks(scene) {
  if (!scene.allies || !scene.statusBoxes) return;
  let any = false;
  for (const a of scene.allies()) {
    const s = scene.statusBoxes.get(a.id);
    if (!s) continue;
    const on = a.alive && scene.c8bBound === a.id;
    if (on) any = true;
    s.box.classList.toggle('c8b-bound', !!on);
  }
  if (any) ensureCss();
}

// ───────────── イベントを 見せる とき（client/battle-c8a.js の c8aPresent から）─────────────
export function c8bPresent(scene, ev, fx, anim, actor) {
  const g = scene.game;
  const nameOf = (id) => scene.c?.get?.(id)?.name || '';
  // ペイニックと パニクル
  if (ev.c8bImpLeft?.plot && ev.c8bImpLeft.left > 1) {
    g.audio.sfx('warn');
    scene.banner('！2ひきが、ひそひそ相談している…強い一撃でじゃましよう！', 'danger');
  }
  if (ev.c8bImpLeft?.left === 1) {
    g.audio.sfx('warn');
    scene.banner('！次に、ばけばけ大がったい…！', 'danger');
  }
  if (ev.c8bQuarrel) {
    g.audio.sfx('crit');
    scene.banner('作戦がばれた！2ひきがけんかを始めた！', 'combo');
  }
  if (ev.c8bFuse) {
    scene.shake?.(900, 9);
    scene.banner('ばけばけ大がったい…！', 'danger');
  }
  if (ev.c8bPanic) {
    g.audio.sfx('sparkle');
    scene.banner(`${nameOf(ev.c8bPanic.id)}がパニックになった！今ならダメージ${ev.c8bPanic.k}倍！`, 'combo');
  }
  if (ev.c8bRage) {
    scene.shake?.(800, 8);
    scene.banner(`${nameOf(ev.c8bRage.id)}が、カンカンにおこった…！`, 'danger');
  }
  if (ev.c8bSoloLeft?.left === 1) {
    g.audio.sfx('warn');
    scene.banner('！次に、ひとりばけばけ…！身を守れ！', 'danger');
  }
  if (ev.c8bSolo) {
    scene.shake?.(800, 8);
    scene.banner('ひとりばけばけ…！', 'danger');
  }
  // ハデロス
  if (ev.c8bContractLeft?.left === 1) {
    g.audio.sfx('warn');
    scene.banner('！次に、たましいのけいやく…！', 'danger');
  }
  if (ev.c8bContract) {
    scene.c8bBound = ev.c8bContract.who;
    scene.banner(`${nameOf(ev.c8bContract.who)}に、けいやくしょがはりついた…！炎でもやせ！`, 'danger');
  }
  if (ev.c8bDrain?.left === 0) {
    g.audio.sfx('warn');
    scene.banner(`！次に、${nameOf(ev.c8bDrain.who)}のたましいがとられる…！`, 'danger');
  }
  if (ev.c8bBurnt) {
    g.audio.sfx('crit');
    scene.c8bBound = null;
    scene.banner('けいやくしょがもえた！ハデロスがあわてている！', 'combo');
  }
  if (ev.c8bSoul) {
    scene.c8bBound = null;
    scene.shake?.(700, 7);
    scene.banner(`${nameOf(ev.c8bSoul.who)}のたましいが、とられてしまった…！`, 'danger');
  }
  if (ev.c8bFlicker) {
    g.audio.sfx('warn');
    scene.banner('！ハデロスのかみの毛が、赤くちらちら…もうすぐおこるぞ！', 'danger');
  }
  if (ev.c8bAnger) {
    scene.c8bBound = null;
    scene.shake?.(1000, 10);
    scene.banner('ハデロスがおこった！赤い炎…弱点がかわった！', 'danger');
  }
  if (ev.c8bEruptLeft?.left === 2) {
    g.audio.sfx('warn');
    scene.banner('！もうすぐ、よみの大ふん火…今のうちに氷で頭をひやせ！', 'danger');
  }
  if (ev.c8bEruptLeft?.left === 1) {
    g.audio.sfx('warn');
    scene.banner('！次に、よみの大ふん火…！氷で頭をひやせ！', 'danger');
  }
  if (ev.c8bErupt) {
    scene.shake?.(1000, 10);
    scene.banner('よみの大ふん火…！', 'danger');
  }
  if (ev.c8bCool) {
    g.audio.sfx('crit');
    scene.banner('頭がひえた！大ふん火がしぼんだ！', 'combo');
  }
  c8bMarks(scene);
  void fx; void anim; void actor;
}
