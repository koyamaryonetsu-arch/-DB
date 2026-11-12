// 第2部 第8章 第3幕 の マジカメック（ほうき）・初代大魔王クッパード（ギガ）・橋のオノ・手下の 魔物の がめん
// （client/battle-c8b.js から よぶ。サーバーがわは shared/battle-c8c.js）
// ・マジカメック: 頭の 上に でっかくなあれまでの しるし（星。のこり 1 は 赤く ゆれる）。ちびカメックの 間は え が 小さく なり「ちびカメック」と「×2」。
//   ほうきに のると え は コマ 2・3（c8cSprite）
// ・子分: 魔法じんの 間は 足もとに 回る 魔法じんと「×2」。デカ〜に なると え が 大きく なる（c8cSprite が 大きく した え を かえす）
// ・クッパード: 1だんめ … ドッスンヒップドロップまでの しるし（下むきの 三角）・かけらが 光る 前ぶれ（むらさきの きらきら）・
//   また ギガに なるまでの しるし（むらさきの 星）・目を 回している 間は「ぐるぐる」／2だんめ … ギガほのおまでの しるし（ほのお）。え は コマ 2・3
// ・橋のオノ: のこりの たたく 回数（オノの しるし）と「ぶきで たたけ」
// ・バナー: 魔法じん・でっかくなあれの 前ぶれ・でっかくなった・魔法じんが 消えた・ちびカメック・ほうき／
//   ヒップドロップの 前ぶれ・ヒップドロップ・かけらが 光る・ギガ・ギガほのおの 前ぶれ・ギガほのお・オノが かたむいた・橋が おちた・また ギガの 前ぶれ
// ・敵が 使うと がめんの まん中に 大きく 出す 技・味方の まどの えんしゅつ・音（client/battle-ch4.js・client/battle.js に まぜる）
import { C8_KAMEK, C8_BOWSER } from '../shared/data/monsters-c8c.js?v=eb1c3a4395d7';
import { monsterCanvas } from './render/monsters.js?v=eb1c3a4395d7';

// 前ぶれの バナーを 自分で 出す（client/battle-c8b.js の C8B_OWN_TELE に まぜる）
export const C8C_OWN_TELE = [C8_KAMEK, C8_BOWSER];

export const C8C_SCREEN_ANIMS = ['c8k_grow', 'c8k_broom', 'c8w_pound', 'c8w_giga', 'c8w_gigafire'];
export const C8C_ALLY_FX = {
  c8n_hop: 'fire', c8n_magma: 'fire', c8n_throw: 'claw', c8n_jump: 'quake', c8n_rain: 'claw', c8n_bite: 'claw', c8n_dash: 'claw',
  c8n_drop: 'quake', c8n_quake: 'quake', c8n_glare: 'down', c8n_rush: 'quake', c8n_boom: 'fire',
  c8k_shapes: 'bolt', c8k_spark: 'bolt', c8k_shrink: 'down', c8k_broomhit: 'claw', c8k_kstomp: 'quake',
  c8w_claw: 'claw', c8w_breath: 'fire', c8w_shell: 'quake', c8w_pound: 'quake', c8w_gstomp: 'quake', c8w_gbreath: 'fire', c8w_groar: 'down', c8w_gigafire: 'fire',
};
export const C8C_SFX = {
  c8n_hop: 'fire', c8n_magma: 'fire', c8n_bounce: 'buff', c8n_throw: 'hit', c8n_jump: 'smash', c8n_rain: 'hit', c8n_bite: 'hit', c8n_dash: 'smash', c8n_wind: 'buff',
  c8n_drop: 'smash', c8n_quake: 'smash', c8n_glare: 'warn', c8n_rush: 'smash', c8n_boom: 'blast', c8n_aim: 'buff',
  c8k_shapes: 'bolt', c8k_spark: 'bolt', c8k_shrink: 'warn', c8k_broomhit: 'smash', c8k_grow: 'blast', c8k_summon: 'warn', c8k_broom: 'buff', c8k_fizzle: 'sparkle', c8k_kstomp: 'smash',
  c8w_claw: 'hit', c8w_breath: 'fire', c8w_shell: 'smash', c8w_pound: 'blast', c8w_giga: 'blast', c8w_fallen: 'hit', c8w_gstomp: 'smash', c8w_gbreath: 'fire', c8w_groar: 'warn', c8w_gigafire: 'blast',
};

// ───────────── え（client/battle.js の monsterCanvas の かわり）─────────────
// マジカメックが ほうきに のったら・クッパードが ギガに なったら おなじ え の コマ 2・3。デカ〜の 子分は 大きく した え
const BIG = new Map();
const GIGA_K = 1.8;
const TINY_K = 0.6;
function bigCanvas(sp, frame, k = GIGA_K) {
  if (typeof document === 'undefined') return null;
  const key = `${sp}|${frame}|${k}`;
  if (BIG.has(key)) return BIG.get(key);
  const src = monsterCanvas(sp, frame);
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  c.getContext('2d').drawImage(src, 0, 0);
  // こまかさ（res）を かえて、がめんでは k ばいの 大きさに 見せる（デカ〜は 大きく・ちびカメックは 小さく）
  c.res = (src.res || 1) / k;
  BIG.set(key, c);
  return c;
}
export function c8cSprite(c, frame) {
  const sp = c?.species;
  if (sp === C8_KAMEK && c.tiny) return bigCanvas(C8_KAMEK, (frame ? 1 : 0) + (c.kmForm === 2 ? 2 : 0), TINY_K);
  if (sp === C8_KAMEK && c.kmForm === 2) return monsterCanvas(C8_KAMEK, (frame ? 1 : 0) + 2);
  if (sp === C8_BOWSER && c.bwForm === 2) return monsterCanvas(C8_BOWSER, (frame ? 1 : 0) + 2);
  if (c?.giga) return bigCanvas(sp, frame ? 1 : 0);
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
// 星（でっかくなあれ・また ギガの しるし）
function starMark(x, cx, cy, s, col) {
  x.fillStyle = col;
  x.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? s * 0.45 : s;
    x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  x.closePath();
  x.fill();
}
// 下むきの 三角（ヒップドロップの しるし）
function dropMark(x, cx, cy, s, col) {
  x.fillStyle = col;
  x.beginPath();
  x.moveTo(cx - s * 0.8, cy - s * 0.6);
  x.lineTo(cx + s * 0.8, cy - s * 0.6);
  x.lineTo(cx, cy + s * 0.8);
  x.closePath();
  x.fill();
}
// ほのお（ギガほのおの しるし）
function flameMark(x, cx, cy, s, col) {
  x.fillStyle = col;
  x.beginPath();
  x.moveTo(cx, cy - s);
  x.quadraticCurveTo(cx + s * 0.9, cy, cx, cy + s * 0.8);
  x.quadraticCurveTo(cx - s * 0.9, cy, cx, cy - s);
  x.fill();
}
// オノ（橋の オノの しるし）
function axeMark(x, cx, cy, s, col) {
  x.fillStyle = col;
  x.fillRect(cx - s * 0.12, cy - s * 0.9, s * 0.24, s * 1.8);
  x.beginPath();
  x.moveTo(cx, cy - s * 0.8);
  x.lineTo(cx + s * 0.9, cy - s * 0.9);
  x.lineTo(cx + s * 0.9, cy + s * 0.1);
  x.lineTo(cx, cy);
  x.closePath();
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
// 足もとで 回る 魔法じん（でっかくなあれの 前ぶれ）
function circle(x, px, py, w, h, base, T) {
  const cx = px + w / 2, cy = py + h - 2, rx = Math.max(12, w * 0.55), ry = rx * 0.3;
  x.globalAlpha = base * (0.55 + Math.sin(T / 120) * 0.25);
  x.strokeStyle = '#ff7ae0';
  x.lineWidth = 1.2;
  x.beginPath();
  x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  x.stroke();
  x.beginPath();
  x.ellipse(cx, cy, rx * 0.7, ry * 0.7, 0, 0, Math.PI * 2);
  x.stroke();
  x.fillStyle = '#ffe0fa';
  for (let i = 0; i < 6; i++) {
    const a = T / 500 + (i * Math.PI) / 3;
    x.fillRect(Math.round(cx + Math.cos(a) * rx * 0.85) - 1, Math.round(cy + Math.sin(a) * ry * 0.85) - 1, 2, 2);
  }
  x.globalAlpha = base;
}
// むらさきの きらきら（黒い 星の かけらが 光る 前ぶれ）
function shardGlow(x, px, py, w, h, base, T) {
  for (let i = 0; i < 4; i++) {
    const a = 0.45 + Math.sin(T / 90 + i * 1.6) * 0.45;
    if (a <= 0.05) continue;
    x.globalAlpha = base * a;
    starMark(x, px + w * (0.25 + i * 0.17), py + h * (0.3 + (i % 2) * 0.12), 2.5 + (i % 2), '#c88aff');
  }
  x.globalAlpha = base;
}
// 頭の 上の ぐるぐる（橋から おちて 目を 回している）
function dizzy(x, px, py, w, base, T) {
  for (let i = 0; i < 3; i++) {
    const a = T / 200 + (i * Math.PI * 2) / 3;
    x.globalAlpha = base * 0.9;
    starMark(x, px + w / 2 + Math.cos(a) * 10, Math.max(6, py + 4) + Math.sin(a) * 3, 3, '#fff6a0');
  }
  x.globalAlpha = base;
}

// ───────────── たたかいの え（client/battle-c8b.js の c8bDraw から）─────────────
export function c8cDraw(scene, x, m, c, px, py, w, h, base) {
  if (!c?.alive) return;
  const T = scene.time || 0;
  // マジカメック
  if (c.growEvery) marks(x, px, py, w, c.growLeft || 0, c.growEvery, base, T, starMark, ['#ffe0fa', '#ff4ad8', '#2a2040']);
  if (c.tiny) {
    tag(x, px + w / 2, Math.max(8, py - 4), 'ちびカメック', base, '#2a1040', '#ffd0f8', 44);
    tag(x, px + w / 2, py + h * 0.8, `×${c.tinyK ?? 2}`, base, '#1a2a10', '#c8ff8a');
  }
  // 子分（魔法じん）
  if (c.aimed) {
    circle(x, px, py, w, h, base, T);
    tag(x, px + w / 2, Math.max(8, py - 4), '魔法じん', base, '#2a1040', '#ffb0f0', 36);
    tag(x, px + w / 2, py + h * 0.82, '×2', base, '#1a2a10', '#c8ff8a', 22);
  }
  // クッパード
  if (c.bwForm === 1) {
    if (c.poundEvery) marks(x, px, py, w, c.poundLeft || 0, c.poundEvery, base, T, dropMark, ['#ffd040', '#ff3a3a', '#3a3020']);
    if (c.flicker) shardGlow(x, px, py, w, h, base, T);
    // また ギガに なるまでの のこり（目を 回している 間は 出さない）
    if (c.regrowLeft && !c.fallen) tag(x, px + w / 2, py + h * 0.18, `かけら ${c.regrowLeft}`, base, '#200a30', '#d8a8ff', 36);
    if (c.fallen) {
      dizzy(x, px, py, w, base, T);
      tag(x, px + w / 2, py + h * 0.3, 'ぐるぐる', base, '#3a3010', '#fff6a0', 36);
    }
  }
  if (c.bwForm === 2) marks(x, px, py, w, c.fireLeft || 0, c.fireEvery || 3, base, T, flameMark, ['#ff9a4a', '#ff2a2a', '#3a2010']);
  // 橋の オノ
  if (c.axeMax) {
    marks(x, px, py, w, c.axeLeft || 0, c.axeMax, base, T, axeMark, ['#e0e6f0', '#ffd040', '#2a2a3a']);
    tag(x, px + w / 2, py + h * 0.55, 'ぶきでたたけ', base, '#3a1a0a', '#ffd06a', 44);
  }
}

// ───────────── イベントを 見せる とき（client/battle-c8b.js の c8bPresent から）─────────────
export function c8cPresent(scene, ev, fx, anim, actor) {
  const g = scene.game;
  const nameOf = (id) => scene.c?.get?.(id)?.name || '';
  // マジカメック
  if (ev.c8cAim) {
    g.audio.sfx('warn');
    scene.banner(`！${nameOf(ev.c8cAim.who)}に魔法じん…先にたおせ！`, 'danger');
  }
  if (ev.c8cGrowLeft?.left === 1 && !ev.c8cAim) {
    g.audio.sfx('warn');
    scene.banner('！次に、でっかくなあれ…！', 'danger');
  }
  if (ev.c8cGrow) {
    scene.shake?.(900, 9);
    scene.banner(`${nameOf(ev.c8cGrow.who)}が、大きくなった…！`, 'danger');
  }
  if (ev.c8cAimGone) {
    g.audio.sfx('crit');
    scene.banner('魔法じんが消えた！魔法はから回りするぞ！', 'combo');
  }
  if (ev.c8cFizzle) {
    g.audio.sfx('sparkle');
    scene.banner(`魔法がはね返った！ちびカメック！今ならダメージ${ev.c8cFizzle.k ?? 2}倍！`, 'combo');
  }
  if (ev.c8cBroom) {
    scene.shake?.(600, 6);
    scene.banner('マジカメックがほうきで空へ！魔法が速くなった！', 'danger');
  }
  // クッパード
  if (ev.c8cPoundLeft?.left === 1) {
    g.audio.sfx('warn');
    scene.banner('！次に、ドッスンヒップドロップ…！身を守れ！', 'danger');
  }
  if (ev.c8cPound) {
    scene.shake?.(900, 10);
    scene.banner('ドッスンヒップドロップ…！', 'danger');
  }
  if (ev.c8cFlicker) {
    g.audio.sfx('warn');
    scene.banner('！黒い星のかけらが光っている…何かが起こるぞ！', 'danger');
  }
  if (ev.c8cGiga) {
    scene.shake?.(1200, 12);
    scene.banner('ギガクッパード…！橋のオノを、ぶきでたたけ！', 'danger');
  }
  if (ev.c8cFireLeft?.left === 1) {
    g.audio.sfx('warn');
    scene.banner('！次に、ギガほのお…！身を守るか、オノをたたけ！', 'danger');
  }
  if (ev.c8cGigaFire) {
    scene.shake?.(1000, 10);
    scene.banner('ギガほのお…！', 'danger');
  }
  if (ev.c8cAxeHit?.left > 0) {
    g.audio.sfx('hit');
    scene.banner(`オノがかたむいた！あと${ev.c8cAxeHit.left}回！`, 'combo');
  }
  if (ev.c8cFall) {
    g.audio.sfx('crit');
    scene.shake?.(1000, 10);
    scene.banner('橋がおちた！クッパードが、もとの大きさにもどった！', 'combo');
  }
  if (ev.c8cRegrow?.left === 1) {
    g.audio.sfx('warn');
    scene.banner('！かけらがまた光り出した…次にギガクッパード！', 'danger');
  }
  void fx; void anim; void actor;
}
