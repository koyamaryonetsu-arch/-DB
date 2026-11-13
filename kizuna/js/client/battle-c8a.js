// 第2部 第8章 第1幕 の オウムのイアゴン・大臣ジャハール（大きな コブラ・ランプの 魔人）・手下の 魔物の がめん
// （client/battle-c7i.js から よぶ。サーバーがわは shared/battle-c8a.js）
// ・イアゴン: 頭の 上に オウムがえしまでの しるし（ふきだし。のこり 1つは 赤く ゆれる）。聞き耳の 間は「聞き耳」の ふだと 耳の 光。
//   覚えた 呪文は 体の 横に 属性の 色の 玉で ならぶ。しっぱいして 目を まわすと「目をまわした」
// ・ジャハール: 1だんめ … 頭の 上に さいみんじゅつまでの しるし（へびの 目）・つえが もどるまでの 小さな つえの しるし／
//   2だんめ … とぐろまでの しるし（うず）・とぐろの 間は「とぐろ！」の ふだと 赤い わ・のびきった 間は「×1.5」／
//   3だんめ … むげんの魔力までの しるし（ほのお）・ランプの 中の 間は「ランプの中」「×1.6」。え は コブラ（コマ 2・3）・魔人（コマ 4・5）（c8aSprite）
// ・あやつられた 人の まどに「あやつられている」（c8aMarks）
// ・バナー: 聞き耳・オウムがえしの 前ぶれ・はね返された／しっぱい／さいみんじゅつの 前ぶれ・あやつられた・つえを こわした／
//   変身（コブラ・魔人）・とぐろ・かみつかれた・いちげき・からぶり／魔力の 前ぶれ・魔力・ランプに すいこまれた・出てきた
// ・敵が 使うと がめんの まん中に 大きく 出す 技・味方の まどの えんしゅつ・音（client/battle-c7i.js から client/battle-ch4.js・client/battle.js に まぜる）
import { C8_PET, C8_JAFAR } from '../shared/data/monsters-c8a.js?v=e32f6eb85bad';
import { monsterCanvas } from './render/monsters.js?v=e32f6eb85bad';
import { el } from './ui/dom.js?v=e32f6eb85bad';
// 第2部 第8章 第2幕: ペイニックと パニクル・よみの王ハデロスの がめん（battle-c8b.js）
import { C8B_OWN_TELE, c8bSprite, c8bDraw, c8bPresent } from './battle-c8b.js?v=e32f6eb85bad';

// 前ぶれの バナーを 自分で 出す（client/battle-c7i.js の C7I_OWN_TELE に まぜる）
export const C8A_OWN_TELE = [C8_PET, C8_JAFAR, ...C8B_OWN_TELE];

export const C8A_SCREEN_ANIMS = ['a8p_echo', 'a8j_hypno', 'a8j_cobra', 'a8c_strike', 'a8j_genie', 'a8g_blast'];
export const C8A_ALLY_FX = {
  a8n_slash: 'claw', a8n_rush: 'claw', a8n_needle: 'claw', a8n_roll: 'quake', a8n_bite: 'claw', a8n_jump: 'claw', a8n_glare: 'down',
  a8n_smoke: 'dark', a8n_haze: 'dark', a8n_arm: 'claw', a8n_beam: 'fire', a8n_split: 'claw',
  a8p_peck: 'claw', a8p_gust: 'wind', a8p_jewel: 'down', a8p_chatter: 'down', a8p_echo: 'quake',
  a8j_ray: 'fire', a8j_sand: 'wind', a8j_laugh: 'down', a8j_hypno: 'dark',
  a8c_bite: 'claw', a8c_tail: 'quake', a8c_hiss: 'down', a8c_strike: 'quake',
  a8g_fist: 'quake', a8g_fire: 'fire', a8g_blast: 'dark',
};
export const C8A_SFX = {
  a8n_slash: 'hit', a8n_rush: 'hit', a8n_guard: 'buff', a8n_needle: 'hit', a8n_roll: 'smash', a8n_grow: 'buff', a8n_bite: 'smash', a8n_jump: 'smash', a8n_glare: 'warn',
  a8n_smoke: 'warn', a8n_haze: 'warn', a8n_arm: 'hit', a8n_beam: 'sparkle', a8n_split: 'hit', a8n_shine: 'buff',
  a8p_peck: 'hit', a8p_gust: 'wind', a8p_jewel: 'hit', a8p_chatter: 'warn', a8p_echo: 'blast', a8p_dizzy: 'hit',
  a8j_ray: 'fire', a8j_sand: 'wind', a8j_laugh: 'warn', a8j_hypno: 'warn', a8j_daze: 'hit', a8j_cobra: 'blast',
  a8c_bite: 'smash', a8c_tail: 'smash', a8c_hiss: 'warn', a8c_coil: 'warn', a8c_strike: 'blast', a8c_whiff: 'smash', a8j_genie: 'blast',
  a8g_fist: 'smash', a8g_fire: 'fire', a8g_wish: 'buff', a8g_blast: 'blast', a8g_sealed: 'hit',
};

// ───────────── え（client/battle.js の monsterCanvas の かわり）─────────────
// ジャハールが 変身したら、おなじ え の コマ 2・3（コブラ）・4・5（魔人）（render/c8a-art.js）
export function c8aSprite(c, frame) {
  // 第8章 第2幕（battle-c8b.js）
  const s8 = c8bSprite(c, frame);
  if (s8) return s8;
  if (c?.species !== C8_JAFAR || !(c.c8form >= 2)) return null;
  return monsterCanvas(C8_JAFAR, (frame ? 1 : 0) + (c.c8form === 2 ? 2 : 4));
}

// 属性の 色（覚えた 呪文の 玉）
const EL_COL = { fire: '#ff6a3a', ice: '#9ae6ff', bolt: '#fff06a', wind: '#9af0b0', light: '#fffbe0', dark: '#a87ae0', water: '#5a9aff', blast: '#ffb04a', void: '#e8e8ff', none: '#e8e8ff' };

// しるしの うしろの くらい まる（背景と まざらない）
function backDot(x, cx, cy, r, base) {
  x.globalAlpha = base * 0.6;
  x.fillStyle = '#0c0814';
  x.beginPath();
  x.arc(cx, cy, r, 0, Math.PI * 2);
  x.fill();
}
// ふきだし（オウムがえしの しるし）
function bubbleMark(x, cx, cy, s, col) {
  x.fillStyle = col;
  x.beginPath();
  x.ellipse(cx, cy - s * 0.15, s * 0.9, s * 0.65, 0, 0, Math.PI * 2);
  x.fill();
  x.beginPath();
  x.moveTo(cx - s * 0.3, cy + s * 0.3);
  x.lineTo(cx - s * 0.6, cy + s * 0.9);
  x.lineTo(cx + s * 0.05, cy + s * 0.4);
  x.fill();
}
// へびの 目（さいみんじゅつの しるし）
function eyeMark(x, cx, cy, s, col) {
  x.fillStyle = col;
  x.beginPath();
  x.moveTo(cx - s, cy);
  x.quadraticCurveTo(cx, cy - s * 0.9, cx + s, cy);
  x.quadraticCurveTo(cx, cy + s * 0.9, cx - s, cy);
  x.fill();
  x.fillStyle = '#0c0814';
  x.fillRect(cx - s * 0.12, cy - s * 0.5, s * 0.24, s);
}
// うず（とぐろの しるし）
function coilMark(x, cx, cy, s, col) {
  x.strokeStyle = col;
  x.lineWidth = 1.5;
  x.beginPath();
  for (let i = 0; i <= 18; i++) {
    const a = (i / 18) * Math.PI * 3.2;
    const r = s * (0.15 + (i / 18) * 0.85);
    const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
    if (i) x.lineTo(px, py);
    else x.moveTo(px, py);
  }
  x.stroke();
}
// ほのお（魔力の しるし）
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
// 小さな 文字の ふだ（「聞き耳」「×1.5」など）
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
// 赤い わ（とぐろ・ランプの 中）
function ring(x, px, py, w, h, base, T, col) {
  for (let i = 0; i < 2; i++) {
    const r = ((T / 9 + i * 20) % 40) / 40;
    x.globalAlpha = base * (0.6 - r * 0.5);
    x.strokeStyle = col;
    x.lineWidth = 2;
    x.beginPath();
    x.ellipse(px + w / 2, py + h * 0.6, w * (0.35 + r * 0.25), h * (0.3 + r * 0.2), 0, 0, Math.PI * 2);
    x.stroke();
  }
  x.globalAlpha = base;
}

// ───────────── たたかいの え（client/battle-c7i.js の c7iDraw から）─────────────
export function c8aDraw(scene, x, m, c, px, py, w, h, base) {
  if (!c?.alive) return;
  // 第8章 第2幕（battle-c8b.js）
  c8bDraw(scene, x, m, c, px, py, w, h, base);
  const T = scene.time || 0;
  // イアゴン: オウムがえしまでの しるし・聞き耳・覚えた 呪文
  if (c.echoEvery) {
    marks(x, px, py, w, c.echoLeft || 0, c.echoEvery, base, T, bubbleMark, ['#fff0c0', '#ff6a4a', '#3a3040']);
    if (c.listen) {
      tag(x, px + w / 2, py + h * 0.18, '聞き耳', base, '#2a0a10', '#ffd66b');
      x.globalAlpha = base * (0.5 + Math.sin(T / 90) * 0.3);
      x.strokeStyle = '#ffd66b';
      x.lineWidth = 1.2;
      for (const s of [-1, 1]) {
        x.beginPath();
        x.arc(px + w / 2 + s * w * 0.12, py + h * 0.25, 4 + ((T / 60) % 6), s < 0 ? Math.PI * 0.6 : -Math.PI * 0.4, s < 0 ? Math.PI * 1.4 : Math.PI * 0.4);
        x.stroke();
      }
      x.globalAlpha = base;
    }
    (c.words || []).forEach((el, i) => {
      const cx = px + w - 6, cy = py + h * 0.35 + i * 11;
      backDot(x, cx, cy, 5, base);
      x.globalAlpha = base * 0.95;
      x.fillStyle = EL_COL[el] || EL_COL.none;
      x.beginPath();
      x.arc(cx, cy, 3.6, 0, Math.PI * 2);
      x.fill();
      x.globalAlpha = base;
    });
    if (c.dizzy) tag(x, px + w / 2, py + h * 0.3, '目をまわした', base, '#2a1a3a', '#ffe890', 46);
  }
  // ジャハール
  if (c.c8form === 1) {
    marks(x, px, py, w, c.hypnoLeft || 0, c.hypnoEvery || 3, base, T, eyeMark, ['#ffd66b', '#ff3a4a', '#3a2a2a']);
    for (let i = 0; i < (c.staffDown || 0); i++) {
      backDot(x, px + 6 + i * 10, py + h - 4, 4.5, base);
      x.globalAlpha = base * 0.9;
      x.fillStyle = '#f2c14e';
      x.fillRect(px + 5.4 + i * 10, py + h - 8, 1.4, 7);
      x.fillStyle = '#e03040';
      x.fillRect(px + 4.6 + i * 10, py + h - 9, 3, 2);
    }
    x.globalAlpha = base;
  }
  if (c.c8form === 2) {
    if (c.coiled) {
      ring(x, px, py, w, h, base, T, '#ff6a4a');
      tag(x, px + w / 2, Math.max(8, py - 4), 'とぐろ！', base, '#2a0808', '#ff8a6a', 34);
    } else marks(x, px, py, w, c.coilLeft || 0, c.coilEvery || 3, base, T, coilMark, ['#f2c14e', '#ff6a4a', '#3a2a20']);
    if (c.openLeft) tag(x, px + w / 2, py + h * 0.42, `×${c.openK ?? 1.5}`, base, '#1a2a10', '#c8ff8a');
  }
  if (c.c8form === 3) {
    if (c.sealLeft) {
      ring(x, px, py, w, h, base, T, '#c8a0ff');
      tag(x, px + w / 2, Math.max(8, py - 4), 'ランプの中', base, '#1a0a20', '#e8d8ff', 44);
      tag(x, px + w / 2, py + h * 0.42, `×${c.sealK ?? 1.6}`, base, '#1a2a10', '#c8ff8a');
    } else marks(x, px, py, w, c.blastLeft || 0, c.blastEvery || 3, base, T, flameMark, ['#c84a8a', '#ff4a4a', '#2a1a2a']);
  }
}

// ───────────── あやつられた 人の まどの しるし ─────────────
const CSS = `
.b-mem.c8a-hypno { box-shadow: 0 0 0 2px #000, inset 0 0 14px rgba(224, 48, 64, 0.9); }
.b-mem.c8a-hypno::after {
  content: 'あやつられている'; position: absolute; left: 50%; top: -0.95em; transform: translateX(-50%); z-index: 3; pointer-events: none;
  font-size: 0.78em; line-height: 1.25; white-space: nowrap; padding: 0 0.45em; color: #ffecec;
  background: rgba(44, 8, 12, 0.94); border: 1px solid #e03040; border-radius: 4px; box-shadow: 0 0 0 1px #000;
}
`;
let styled = false;
function ensureCss() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  document.head.append(el('style', { id: 'c8a-css', text: CSS }));
}
// あやつられた 人（ev.c8aHypno の 人。目を さますと はずす）を 覚えて おく
export function c8aMarks(scene) {
  if (!scene.allies || !scene.statusBoxes) return;
  const set = scene.c8aHypno || new Set();
  let any = false;
  for (const a of scene.allies()) {
    const s = scene.statusBoxes.get(a.id);
    if (!s) continue;
    // pub の status は じょうたいの 名前の ならび（こんらんが とけたら はずす）
    const on = a.alive && set.has(a.id) && (Array.isArray(a.status) ? a.status.includes('confuse') : true);
    if (on) any = true;
    s.box.classList.toggle('c8a-hypno', !!on);
  }
  if (any) ensureCss();
}

// ───────────── イベントを 見せる とき（client/battle-c7i.js の c7iPresent から）─────────────
export function c8aPresent(scene, ev, fx, anim, actor) {
  const g = scene.game;
  const nameOf = (id) => scene.c?.get?.(id)?.name || '';
  const names = (ids) => (ids || []).map(nameOf).filter(Boolean).join('と');
  // イアゴン
  if (ev.c8aParrot?.listen && ev.c8aParrot.left === 2) {
    g.audio.sfx('warn');
    scene.banner('！イアゴンが聞き耳を立てている…呪文をひかえよう！', 'danger');
  }
  if (ev.c8aParrot?.left === 1) {
    g.audio.sfx('warn');
    scene.banner('！次にオウムがえし…！', 'danger');
  }
  if (ev.c8aLearn) scene.banner(`イアゴンが呪文を覚えた…（${ev.c8aLearn.words.length}こ）`, 'danger');
  if (ev.c8aEcho) {
    if (ev.c8aEcho.n) {
      scene.shake?.(800, 8);
      scene.banner(`オウムがえし…！覚えた呪文が${ev.c8aEcho.n}つ、はね返ってきた！`, 'danger');
    } else {
      g.audio.sfx('sparkle');
      scene.banner('イアゴンは何も覚えていない！目をまわした！', 'combo');
    }
  }
  // ジャハール
  if (ev.c8aHypnoLeft?.left === 1) {
    g.audio.sfx('warn');
    scene.banner('！次にさいみんじゅつ…！へびのつえをこわせ！', 'danger');
  }
  if (ev.c8aHypno) {
    scene.c8aHypno = scene.c8aHypno || new Set();
    for (const id of ev.c8aHypno.who || []) scene.c8aHypno.add(id);
    scene.banner(ev.c8aHypno.who?.length ? `${names(ev.c8aHypno.who)}があやつられてしまった…！` : 'さいみんじゅつをこらえた！', ev.c8aHypno.who?.length ? 'danger' : 'combo');
  }
  if (ev.c8aBreak) {
    g.audio.sfx('crit');
    scene.c8aHypno?.clear();
    scene.banner('へびのつえをこわした！さいみんじゅつがとけた！', 'combo');
  }
  if (ev.c8aStaffBack) scene.banner('へびのつえが、ジャハールの手にもどった…！', 'danger');
  if (ev.c8aCobra) {
    scene.c8aHypno?.clear();
    scene.shake?.(900, 9);
    scene.banner('ジャハールが、大きなコブラに姿をかえた…！', 'danger');
  }
  if (ev.c8aCoilLeft?.left === 1) {
    g.audio.sfx('warn');
    scene.banner('！次にとぐろ…！とぐろの間は攻撃するな！', 'danger');
  }
  if (ev.c8aCoil) scene.banner('とぐろをまいた！攻撃すると、かみつかれる！', 'danger');
  if (ev.c8aBite) scene.banner(`${nameOf(ev.c8aBite.who)}がかみつかれた！`, 'danger');
  if (ev.c8aStrike) {
    scene.shake?.(800, 8);
    scene.banner('大へびのいちげき…！', 'danger');
  }
  if (ev.c8aWhiff) {
    g.audio.sfx('crit');
    scene.banner(`からぶり！コブラがのびきった！今ならダメージ${ev.c8aWhiff.k}倍！`, 'combo');
  }
  if (ev.c8aGenie) {
    scene.shake?.(1000, 10);
    scene.banner('ジャハールが、ランプの魔人に姿をかえた…！', 'danger');
  }
  if (ev.c8aBlastLeft?.left === 1) {
    g.audio.sfx('warn');
    scene.banner('！次にむげんの魔力…！ランプをこわすか、身を守れ！', 'danger');
  }
  if (ev.c8aBlast) {
    scene.shake?.(900, 9);
    scene.banner('むげんの魔力…！', 'danger');
  }
  if (ev.c8aSeal) {
    g.audio.sfx('crit');
    scene.banner(`ランプをこわした！魔人がランプにすいこまれた！（ダメージ${ev.c8aSeal.k}倍）`, 'combo');
  }
  if (ev.c8aOut) scene.banner('魔人がランプから出てきた…！また火がともった！', 'danger');
  c8aMarks(scene);
  // 第8章 第2幕（battle-c8b.js）
  c8bPresent(scene, ev, fx, anim, actor);
}
