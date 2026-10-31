// 第5章 Step 9（B9）ノクト（本気）・魔王ソリトゥスの がめん（client/battle-ch5.js・client/battle.js から よぶ。サーバーがわは shared/battle-final.js）
// ・ひとりに された 人: まどに「ひとりぼっち」の しるし（client/battle-earth.js の earthMarks。こい あいいろ）
// ・新しい コマンド「よびかける」: だれかが ひとりの 時だけ、コマンドの いちばん 上に（finalCmdItems・finalCmdPick）
// ・家族の きずな技: 第3段階で ゲージ（がめんの 左上「きずなの光」）が たまると、だれの コマンドにも いちばん 上に 出る。
//   使うと、出した 人 みんなの 名前が 1人ずつ 大きく 出て、星の 光が 闇を つらぬく（finalBondFx）
// ・段階が かわる ときは、がめんいっぱいの 大きな 文字（finalPhaseFx）。第2段階から 背景が ひとりぼっちの闇に かわる
// ・前ぶれ: ノクト（本気）は 合体技の かまえ（赤むらさきの わ）・きずなくだき（むらさきの わ）、ソリトゥスは きずなを食べる（むねの 口が 光る）・
//   終わらない夜（黒い わ）。第3段階の ソリトゥスの まわりには、もどってきた 星が またたく
import { el } from './ui/dom.js?v=31a32b16dd7b';
import { battleBackground } from './render/battlefx.js?v=31a32b16dd7b';

const N2 = 'nocto_2';
const SL = 'solitus';
const CLONE = 'nocto_clone';
const BOND_MAX = 100;
export const BOND_TECH = 'みんなの星あかり';
export const FINAL_SCREEN_ANIMS = ['sl_wave', 'sl_eat', 'sl_night'];
// 前ぶれの バナーを 自分で 出す 魔物（client/battle.js の ふつうの「大技が来る！」を 出さない）
export const FINAL_OWN_TELE = new Set([N2, SL]);
export const FINAL_ALLY_FX = {
  n2_blade: 'claw', sl_claw: 'claw', sl_wave: 'dark', sl_alone: 'dark', sl_maw: 'claw', sl_eat: 'dark', sl_night: 'dark', sl_call: 'up',
};
export const FINAL_SFX = {
  n2_blade: 'smash', sl_claw: 'smash', sl_wave: 'dark', sl_alone: 'dark', sl_maw: 'smash', sl_eat_watch: 'warn', sl_eat: 'blast', sl_night_watch: 'warn', sl_night: 'blast',
  nc_dawn_blade: 'smash', nc_star_storm: 'sparkle', nc_shadow_step: 'buff', sl_call: 'heal', family_bond: 'sparkle',
};
// ダメージの 数字を 出す までの 時間（ミリびょう。client/battle.js の HIT_DELAY）
export const FINAL_HIT = { family_bond: 1300, sl_eat: 380, sl_night: 600, sl_alone: 300 };
export const CALL_INFO = 'ひとりぼっちの闇にとじこめられた仲間の名前をよんで、すぐにもどってきてもらう。\nひとりの間は、動けず、仲間の回復も補助もとどかない。';

// 6人（第3段階で ノクトが 加わる）の たてむき: 3人＋3人（CSS の さいご）
const CSS = `
.b-cmd .menu .item.k-call { border-color: #9ad8ff; background: linear-gradient(90deg, rgba(60, 110, 200, 0.32), rgba(200, 236, 255, 0.12)); }
.call-cmd { color: #d8f0ff; font-weight: bold; }
.b-cmd .menu .item.k-bond { border-color: #ffd66b; background: linear-gradient(90deg, rgba(255, 200, 80, 0.42), rgba(255, 170, 220, 0.25), rgba(150, 210, 255, 0.25)); animation: fin-bond-glow 1.2s ease-in-out infinite; }
.bond-cmd { color: #fff6c0; font-weight: bold; text-shadow: 0 0 6px rgba(255, 214, 107, 0.9); }
@keyframes fin-bond-glow { 50% { box-shadow: 0 0 12px rgba(255, 214, 107, 0.9); } }
.b-mem.n2-guest { box-shadow: 0 0 0 2px #000, inset 0 0 10px rgba(255, 214, 140, 0.55); }
.fin-gauge { position: absolute; left: 6px; bottom: 6px; z-index: 4; pointer-events: none; padding: 2px 7px 4px; border-radius: 6px; font-size: 0.78em; line-height: 1.2;
  color: #fff6c0; background: rgba(20, 14, 40, 0.86); border: 1px solid #ffd66b; box-shadow: 0 0 0 1px #000; min-width: 7.5em; }
.fin-gauge .bar { height: 6px; margin-top: 2px; border-radius: 3px; background: #2a2244; overflow: hidden; }
.fin-gauge .bar > i { display: block; height: 100%; width: 0; background: linear-gradient(90deg, #ffd66b, #ffb0e0, #9ad8ff); transition: width 0.3s; }
.fin-gauge.full { animation: fin-bond-glow 1.2s ease-in-out infinite; }
.fin-phase { position: absolute; inset: 0; z-index: 6; pointer-events: none; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.15em;
  background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.72), rgba(0, 0, 0, 0.25) 70%, transparent); animation: fin-phase 2.8s ease-out forwards; text-align: center; }
.fin-phase .p1 { font-size: 1.1em; letter-spacing: 0.4em; color: #c8b8ff; }
.fin-phase .p2 { font-size: 2.1em; font-weight: bold; color: #ffffff; text-shadow: 0 0 12px #7a5ac0, 0 0 2px #000; }
.fin-phase .p3 { font-size: 0.9em; color: #e8e4f4; padding: 0 1em; }
.fin-phase.dawn .p1 { color: #ffe0a0; }
.fin-phase.dawn .p2 { text-shadow: 0 0 14px #ffd66b, 0 0 2px #000; }
@keyframes fin-phase { 0% { opacity: 0; transform: scale(1.25); } 12% { opacity: 1; transform: scale(1); } 80% { opacity: 1; } 100% { opacity: 0; } }
.fin-bondfx { position: absolute; inset: 0; z-index: 6; pointer-events: none; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.1em;
  animation: fin-bondfx 3.2s ease-out forwards; text-align: center; }
.fin-bondfx .names { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.2em 0.55em; padding: 0 0.6em; }
.fin-bondfx .names span { font-size: 1.15em; font-weight: bold; color: #fff6c0; text-shadow: 0 0 8px #ffb070, 0 0 2px #000; opacity: 0; animation: fin-name 0.5s ease-out forwards; }
.fin-bondfx .tech { margin-top: 0.25em; font-size: 2em; font-weight: bold; color: #ffffff; text-shadow: 0 0 14px #ffd66b, 0 0 26px #ffb0e0, 0 0 2px #000; opacity: 0; animation: fin-name 0.6s ease-out forwards; }
.fin-bondfx .sub { font-size: 0.8em; color: #ffe9b0; opacity: 0; animation: fin-name 0.5s ease-out forwards; }
@keyframes fin-name { from { opacity: 0; transform: translateY(8px) scale(1.3); } to { opacity: 1; transform: none; } }
@keyframes fin-bondfx { 0% { background: rgba(255, 240, 200, 0); } 30% { background: rgba(255, 240, 200, 0.12); } 85% { opacity: 1; } 100% { opacity: 0; } }
@media (max-aspect-ratio: 1/1) {
  .b-status[data-n="6"] { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px; }
  .b-status[data-n="6"] .b-mem { padding-left: 0.4em; padding-right: 0.4em; }
  .b-status[data-n="6"] .b-mem .tg, .b-status[data-n="6"] .b-mem .gl { display: none; }
}
`;
let styled = false;
function ensureCss() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  document.head.append(el('style', { id: 'final-css', text: CSS }));
}

const solitusOf = (scene) => scene.enemies?.().find((e) => e.species === SL && e.alive) || null;
const aloneOthers = (scene, a) => scene.allies().filter((x) => x.alive && x.trap === 'alone' && x.id !== a?.id);
export const bondReady = (scene) => {
  const s = solitusOf(scene);
  return !!s && s.slPhase >= 3 && (s.slBond ?? 0) >= BOND_MAX;
};
export const bondNames = (scene) => scene.allies().filter((x) => x.alive && !x.trap).map((x) => x.name);

// ───────────── コマンド（client/battle.js の openCommand）─────────────
// { items: [...], info: '…' }。items は コマンドの いちばん 上に ならべる
export function finalCmdItems(scene, a) {
  const items = [];
  let info = '';
  if (aloneOthers(scene, a).length) {
    ensureCss();
    items.push({ html: '<span class="call-cmd">よびかける</span>', value: 'call', cls: 'k-call' });
    info = CALL_INFO;
  }
  if (bondReady(scene) && !a?.trap) {
    ensureCss();
    items.unshift({ html: '<span class="bond-cmd">家族のきずな技</span>', value: 'bond', cls: 'k-bond' });
    info = `家族のきずな技「${BOND_TECH}」：職業に関係なく、みんなの力を1つにする。\n${bondNames(scene).join('・')}の、星の光が闇をつらぬく！（使うと、きずなの光は0から）`;
  }
  return { items, info };
}
// えらんだ とき（よびかける: 1人なら すぐ・2人いじょう なら えらぶ）。ほかの コマンドなら false
export function finalCmdPick(scene, a, value) {
  if (value === 'bond') {
    scene.send({ type: 'bond' });
    return true;
  }
  if (value !== 'call') return false;
  const list = aloneOthers(scene, a);
  if (!list.length) {
    scene.openCommand();
    return true;
  }
  if (list.length === 1) {
    scene.send({ type: 'call', target: list[0].id });
    return true;
  }
  scene.showMenu(list.map((x) => ({ label: `${x.name}（ひとりぼっち）`, value: x.id })), (it) => scene.send({ type: 'call', target: it.value }), () => scene.openCommand(), 'だれによびかける？');
  scene.targeting = { side: 'ally', done: (id) => scene.send({ type: 'call', target: id }), dead: false };
  return true;
}

// ───────────── きずなの光の ゲージ・ゲストの ノクトの しるし ─────────────
export function finalMarks(scene) {
  const s = solitusOf(scene);
  for (const a of scene.allies()) {
    const box = scene.statusBoxes?.get(a.id)?.box;
    if (box && a.n2Guest) {
      ensureCss();
      box.classList.add('n2-guest');
    }
  }
  const on = !!s && s.slPhase >= 3;
  if (!on) {
    scene.finGauge?.remove();
    scene.finGauge = null;
    return;
  }
  ensureCss();
  if (!scene.finGauge && scene.stage) {
    scene.finGauge = el('div', { class: 'fin-gauge' }, el('div', { class: 't', text: 'きずなの光' }), el('div', { class: 'bar' }, el('i')));
    scene.stage.append(scene.finGauge);
  }
  if (!scene.finGauge) return;
  const v = Math.max(0, Math.min(BOND_MAX, s.slBond ?? 0));
  scene.finGauge.querySelector('i').style.width = `${v}%`;
  scene.finGauge.classList.toggle('full', v >= BOND_MAX);
  scene.finGauge.querySelector('.t').textContent = v >= BOND_MAX ? 'きずなの光（使える！）' : 'きずなの光';
}

// 段階が かわる（がめんいっぱいの 大きな 文字）
export function finalPhaseFx(scene, phase) {
  if (!scene.stage) return;
  ensureCss();
  const T = phase === 3
    ? ['第3段階', '家族のきずな', 'ノクトが仲間に！だれでも「家族のきずな技」が使える']
    : ['第2段階', 'きずなを食べる', '前ぶれのあとは、身を守ろう！'];
  const box = el('div', { class: `fin-phase${phase === 3 ? ' dawn' : ''}` }, el('div', { class: 'p1', text: T[0] }), el('div', { class: 'p2', text: T[1] }), el('div', { class: 'p3', text: T[2] }));
  scene.stage.append(box);
  setTimeout(() => box.remove(), 2900);
}

// 家族の きずな技: 出した 人 みんなの 名前を 1人ずつ → 技の 名前
export function finalBondFx(scene, names) {
  if (!scene.stage) return;
  ensureCss();
  const step = 0.22;
  const box = el('div', { class: 'fin-bondfx' },
    el('div', { class: 'names' }, ...names.map((n, i) => el('span', { text: n, style: `animation-delay:${(i * step).toFixed(2)}s` }))),
    el('div', { class: 'sub', text: '家族のきずな技', style: `animation-delay:${(names.length * step).toFixed(2)}s` }),
    el('div', { class: 'tech', text: `${BOND_TECH}！！`, style: `animation-delay:${(names.length * step + 0.15).toFixed(2)}s` }));
  scene.stage.append(box);
  setTimeout(() => box.remove(), 3300);
}

// ───────────── たたかいの え（client/battle-ch5.js の towerDraw から）─────────────
function ringAt(x, cx, cy, rx, ry, col, lw) {
  x.strokeStyle = col;
  x.lineWidth = lw;
  x.beginPath();
  x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  x.stroke();
}
export function finalDraw(scene, x, m, c, px, py, w, h, base) {
  if (!scene.finInit) {
    scene.finInit = true;
    finalMarks(scene);
  }
  if (!c?.alive) return;
  const T = scene.time || 0;
  const pulse = 0.55 + Math.sin(T / 100) * 0.3;
  // ノクト（本気）: 前ぶれの わ（合体技 … 赤むらさき。影たちにも / きずなくだき … むらさき）
  const n2 = c.species === N2 ? c : c.species === CLONE ? scene.enemies?.().find((e) => e.species === N2 && e.alive) : null;
  if (n2?.tele) {
    const combo = n2.tele === 'm_n1_combo';
    if (c.species === N2 || combo) {
      x.globalAlpha = base * pulse;
      ringAt(x, px + w * 0.5, py + h * 0.58, w * 0.48, h * 0.5, combo ? '#d04a8a' : '#9a7ae0', 2);
      ringAt(x, px + w * 0.5, py + h * 0.58, w * 0.42 + Math.sin(T / 80) * 2, h * 0.44, combo ? '#ffc8e8' : '#d8c8ff', 1);
      x.globalAlpha = base;
    }
  }
  if (c.species !== SL) return;
  // ソリトゥス: きずなを食べるの 前ぶれ（むねの 口が えんじに 光る）・終わらない夜（黒と 青の わ）
  if (c.tele === 'm_sl_eat') {
    x.globalAlpha = base * pulse;
    x.fillStyle = '#ff4a8a';
    x.beginPath();
    x.ellipse(px + w * 0.5, py + h * 0.56, w * (0.06 + Math.sin(T / 90) * 0.01), h * 0.06, 0, 0, Math.PI * 2);
    x.fill();
    ringAt(x, px + w * 0.5, py + h * 0.56, w * 0.14, h * 0.13, '#ffb0d0', 1.5);
    x.globalAlpha = base;
  }
  if (c.tele === 'm_sl_night') {
    x.globalAlpha = base * pulse;
    ringAt(x, px + w * 0.5, py + h * 0.5, w * 0.5, h * 0.52, '#030208', 3);
    ringAt(x, px + w * 0.5, py + h * 0.5, w * 0.44 + Math.sin(T / 80) * 2, h * 0.46, '#7ad8ff', 1);
    x.globalAlpha = base;
  }
  // 第3段階: もどってきた 星が まわりで またたく
  if (c.slPhase >= 3) {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + T / 4000;
      const sx = px + w * 0.5 + Math.cos(a) * w * 0.52, sy = py + h * 0.45 + Math.sin(a) * h * 0.5;
      x.globalAlpha = base * (0.4 + 0.5 * Math.abs(Math.sin(T / 300 + i)));
      x.fillStyle = i % 3 ? '#fff6c0' : '#9ad8ff';
      x.fillRect(Math.round(sx) - 1, Math.round(sy), 3, 1);
      x.fillRect(Math.round(sx), Math.round(sy) - 1, 1, 3);
    }
    x.globalAlpha = base;
  }
}

// ───────────── イベントを 見せる とき（client/battle-ch5.js の towerPresent から）─────────────
export function finalPresent(scene, ev, fx, anim, actor) {
  const g = scene.game;
  const nameOf = (id) => scene.c.get(id)?.name || '';
  // 背景が かわる（第2段階から ひとりぼっちの闇）
  if (ev.bg) {
    scene.bg = battleBackground(ev.bg);
    scene.bgHi = null;
    scene.shake(700, 6);
  }
  if (fx.type === 'telegraph' && actor?.species === N2) {
    g.audio.sfx('warn');
    if (actor.tele === 'm_n1_combo') scene.banner('！合体技のかまえ！影をたおすか、身を守れ！', 'danger');
    else if (actor.tele === 'm_ns_bond_break') scene.banner('！きずなくだきの前ぶれ！身を守れ！', 'danger');
  }
  if (fx.type === 'telegraph' && actor?.species === SL) {
    g.audio.sfx('warn');
    scene.banner(actor.tele === 'm_sl_night' ? '！終わらない夜の前ぶれ！身を守れ！' : '！きずなを食べる前ぶれ！身を守れ！', 'danger');
  }
  if (ev.slAlone) {
    g.audio.sfx('warn');
    scene.banner(`！${nameOf(ev.slAlone.who)}がひとりにされた！「よびかける」でよびもどそう`, 'danger');
  }
  if (ev.slCall) {
    g.audio.sfx('heal');
    scene.allyFx?.(ev.slCall.who, 'up');
    scene.banner(`${nameOf(ev.slCall.who)}が、もどってきた！`, 'combo');
  }
  if (ev.slEat) {
    if (ev.slEat.eaten > 0 && !ev.slEat.broke) scene.banner('強くなる力を、食べられてしまった…', 'danger');
    scene.shake(500, 6);
  }
  if (ev.slNight) scene.shake(700, 8);
  if (ev.n2Heart) {
    g.audio.sfx('sparkle');
    scene.banner(ev.n2Heart.shards || ev.n2Heart.letter ? 'ノクトの心が、ゆれている…' : 'ノクトの紋章が、強く光った…！', 'combo');
  }
  if (ev.slPhase) {
    g.audio.sfx(ev.slPhase.phase >= 3 ? 'sparkle' : 'warn');
    finalPhaseFx(scene, ev.slPhase.phase);
  }
  if (ev.bondReady) {
    g.audio.sfx('sparkle');
    scene.banner('きずなの光がたまった！「家族のきずな技」が使える！', 'combo');
  }
  if (ev.familyBond) {
    g.audio.sfx('crit');
    finalBondFx(scene, ev.familyBond.names || []);
    setTimeout(() => { if (!scene.destroyed) scene.shake(900, 9); }, 1300);
  }
  finalMarks(scene);
}
