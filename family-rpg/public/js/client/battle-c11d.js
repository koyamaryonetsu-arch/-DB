// 第3部 第3章 第4幕「かがやきの女王と、八つめの音」の 鏡と月の使い・かがやきの女王ポラリスの がめん（client/battle-c9b.js から よぶ。サーバーがわは shared/battle-c11d.js）
// ・画面の 上の まど（PC は 右上・スマホの たては 戦いの 絵の すぐ 下。かさならない）:
//   中ボス … 今 前に いるのは だれか（大きく）・ミラーレの まくの 色（色の 丸 ＋ 色の 名前）・スピカの 思い出・入れかわる 前ぶれ
//   女王 … つないだ 輪（輪の 色の 丸・人の 名前・のこりの 番）・つないで いない 人・光の はかりの ねらい・かがやきの 前ぶれ・八つの音の のこり
// ・仲間の まど: 名前の 横に 輪の 色の しるし（輪の 人数・のこりの 番）・ながされた 人（もどるまで あと ○）・はかられる 人
// ・え: 中ボスが ひざを つく（今 ある え の コマ 2・3）・女王が 手を 下ろす（コマ 2・3）
// ・コマンド: 女王 … いちばん 上に「手をつなぐ」→ だれと つなぐ？（スピカ・味方・ひとりの 時は アルゴル）／「八つの音」（八つめの 音の あと。のこりの 回数）
//   中ボス … 今 ある「音を鳴らす」（第2章 第4幕の 6つの 音の まど）と「よびかける」（第2幕の まど）を そのまま 出す（前に いる 方の コマンドが 上）
// ・えんしゅつ: 手を つなぐ 光の 線（味方の まどの 間）・八つめの 音の 場面（女王の 戦いの 中。サーバーの 文を じゅんに 出す。曲が かわる）
import { C11D_MIRROR, C11D_MOON, C11D_QUEEN, MIRROR_SHORT, MOON_SHORT, QUEEN_SHORT } from '../shared/data/monsters-c11d.js';
import { HOLD, EIGHT } from '../shared/data/abilities-c11d.js';
import { C11D_CMD_B, C11D_TRACKS_B } from '../shared/data/c11d-names-b.js';
import { C10D_MIRARE } from '../shared/data/monsters-c10d.js';
import { C11B_OBORO } from '../shared/data/monsters-c11b.js';
import { NOTE_COLORS } from '../shared/battle-c10d.js';
import { monsterCanvas } from './render/monsters.js';
import { c10dCmdItems, c10dNoteMenu } from './battle-c10d.js';
import { c11bCmdItems, c11bCmdPick } from './battle-c11b.js';
import { TRAP_LABEL } from './battle-earth.js';
import { EIGHT_CSS } from './render/battlefx-c11d.js';

export const C11D_CMD = C11D_CMD_B;
// ながされた 人の 名前の 下の しるし（client/battle-earth.js の 地われと おなじ data-trap）
TRAP_LABEL.c11dswept = 'ながされた';
// 前ぶれの バナーを 自分で 出す（client/battle-c8r.js の C8R_OWN_TELE に まぜる）
export const C11D_OWN_TELE = [C11D_MIRROR, C11D_MOON, C11D_QUEEN];
export const C11D_SCREEN_ANIMS = ['c11w_prism', 'c11w_rain', 'c11q_rain', 'c11q_shine', 'c11q_eight'];
export const C11D_ALLY_FX = {
  c11w_slash: 'claw', c11w_peck: 'claw', c11w_prism: 'bolt', c11w_flash: 'bolt', c11w_beam: 'bolt', c11w_rain: 'down', c11w_dark: 'bolt', c11w_sun: 'down',
  c11q_strike: 'quake', c11q_rain: 'down', c11q_shine: 'quake', c11q_measure: 'bolt',
};
export const C11D_SFX = {
  c11w_slash: 'smash', c11w_peck: 'hit', c11w_prism: 'sparkle', c11w_proud: 'debuff', c11w_flash: 'sparkle', c11w_beam: 'bolt', c11w_rain: 'sparkle', c11w_dark: 'dark', c11w_sun: 'fire',
  c11q_strike: 'smash', c11q_rain: 'sparkle', c11q_measure: 'warn', c11q_shine: 'blast', c11q_names: 'heal', c11q_eight: 'sparkle', c11d_hold: 'sparkle', c11d_eight: 'sparkle',
};
// 輪の 色（shared/battle-c11d.js の RING_COLORS と 同じ ならび）
export const RING_CSS = ['#ffd84a', '#7ad8ff', '#ff8ad0', '#9aff8a'];
export const RING_NAME = ['金', '水色', 'もも色', 'わかば色'];
const isMirror = (c) => c?.species === C11D_MIRROR;
const isMoon = (c) => c?.species === C11D_MOON;
const isDuo = (c) => isMirror(c) || isMoon(c);
const isQueen = (c) => c?.species === C11D_QUEEN;
const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const inkOf = (i) => (['yellow', 'white', 'green'].includes(NOTE_COLORS[i]?.id) ? '#1a1430' : '#ffffff');
const colorChip = (i) => `<span class="c11d-col" style="background:${NOTE_COLORS[i]?.css || '#ccc'};color:${inkOf(i)}">${esc(NOTE_COLORS[i]?.name || '')}（${esc(NOTE_COLORS[i]?.note || '')}）</span>`;
const ringDot = (c) => `<span class="c11d-dot" style="background:${RING_CSS[c % RING_CSS.length]}"></span>`;

// CSS の おわりの ほう:
//   .c11d-stage .b-hold … スマホの たてでは「えらぶまで、待っているよ」を え の 左上に（第3幕と 同じ）
//   .c11d-scene … 八つめの 音の 場面（戦いの 絵の 上に 1まい。家族 みんなの 画面で 同じ 文が 同じ じゅんに 出る）
const CSS = `
.c11d-top { position: absolute; right: 4px; top: 4px; z-index: 4; max-width: 60%; pointer-events: none;
  padding: 3px 8px 5px; border-radius: 10px; text-align: left; line-height: 1.35; color: #f6f4ff;
  background: rgba(16, 18, 46, 0.92); border: 2px solid rgba(220, 226, 255, 0.9); box-shadow: 0 0 10px rgba(200, 220, 255, 0.45); }
.c11d-top .row { font-size: 12px; white-space: nowrap; }
.c11d-top .row b { color: #ffe9a0; }
.c11d-top .big { font-size: 16px; font-weight: bold; color: #ffe9a0; white-space: nowrap; }
.c11d-top .tx { margin-top: 3px; font-size: 11px; color: #e4e8ff; white-space: normal; }
.c11d-top.warn { border-color: #ff9a40; box-shadow: 0 0 14px rgba(255, 150, 64, 0.85); }
.c11d-top.warn .tx { color: #ffd060; }
.c11d-top.good { border-color: #8affc8; }
.c11d-top.bad { border-color: #ff6a6a; }
.c11d-top .ring { display: inline-block; white-space: nowrap; margin: 1px 3px 1px 0; padding: 0 5px; border-radius: 9px; font-size: 11px; background: rgba(255, 255, 255, 0.12); }
.c11d-top .ring.lock { background: rgba(255, 230, 140, 0.25); }
.c11d-top .ring.soon { animation: c11d-pulse 0.7s infinite; }
.c11d-dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 3px; vertical-align: -1px; border: 1px solid rgba(0, 0, 0, 0.5); }
.c11d-col { display: inline-block; padding: 0 5px; margin: 0 1px; border-radius: 8px; font-weight: bold; font-size: 11px; border: 1px solid rgba(0, 0, 0, 0.5); }
.c11d-chip { display: inline-block; padding: 0 5px; margin: 0 1px; border-radius: 8px; font-size: 11px; background: #e8e4ff; color: #2a2050; }
.c11d-chip.front { background: #ffe070; color: #3a2a00; font-weight: bold; }
.c11d-chip.back { background: #4a4870; color: #d0d0e8; }
.c11d-chip.down { background: #3a3850; color: #a8a8c0; text-decoration: line-through; }
.c11d-chip.warn { background: #ff9a6a; color: #2a0a00; animation: c11d-pulse 0.7s infinite; }
@keyframes c11d-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
.c11d-top.c11d-flow { position: relative; left: auto; right: auto; top: auto; bottom: auto; transform: none; margin: 3px auto 0; max-width: 98%; box-sizing: border-box; text-align: center; }
.c11d-top.c11d-flow .row { white-space: normal; }
@media (max-aspect-ratio: 1/1) { .c11d-top { max-width: 70%; padding: 1px 5px 3px; } .c11d-top .row { font-size: 11px; } .c11d-top .big { font-size: 14px; } .c11d-top .tx { font-size: 10px; margin-top: 1px; } }
.c11d-badge { display: inline-block; margin-left: 3px; padding: 0 4px; border-radius: 7px; font-size: 10px; font-weight: bold; line-height: 1.4;
  color: #1a1430; vertical-align: middle; white-space: nowrap; border: 1px solid rgba(0, 0, 0, 0.45); }
.c11d-badge.lone { background: #3a3a5a; color: #e0e0f0; }
.c11d-badge.swept { background: #8ab8ff; color: #10183a; }
.c11d-badge.aim { background: #ff8a6a; color: #2a0a00; animation: c11d-pulse 0.7s infinite; }
@media (max-aspect-ratio: 1/1) { .c11d-stage .b-hold { bottom: auto; top: 4px; right: auto; left: 6px; } }
.b-banner.c11d-bn { white-space: normal; width: 94%; max-width: 94%; text-align: center; line-height: 1.25; box-sizing: border-box; }
@media (max-aspect-ratio: 1/1) { .b-banner.c11d-bn { font-size: min(var(--fs-big), 5.4vw); top: 18%; } }
.c11d-line { position: fixed; z-index: 59; height: 4px; border-radius: 2px; pointer-events: none; transform-origin: 0 50%;
  animation: c11d-line 1.4s ease-out forwards; box-shadow: 0 0 8px currentColor, 0 0 3px #ffffff; }
@keyframes c11d-line { 0% { opacity: 0; clip-path: inset(0 100% 0 0); } 30% { opacity: 1; clip-path: inset(0 0 0 0); } 80% { opacity: 1; } 100% { opacity: 0; } }
.c11d-scene { position: absolute; inset: 0; z-index: 8; pointer-events: none; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: radial-gradient(ellipse at 50% 100%, rgba(40, 50, 120, 0.95) 0%, rgba(8, 10, 32, 0.97) 70%); animation: c11d-in 0.6s ease-out; }
@keyframes c11d-in { from { opacity: 0; } to { opacity: 1; } }
.c11d-scene .lt { position: absolute; left: 50%; bottom: -10%; width: 18px; height: 18px; margin-left: -9px; border-radius: 50%;
  background: radial-gradient(circle, #ffffff 0%, #bfefff 45%, rgba(191, 239, 255, 0) 70%); box-shadow: 0 0 18px 8px rgba(191, 239, 255, 0.6);
  animation: c11d-rise var(--rise, 6s) ease-out forwards; }
@keyframes c11d-rise { 0% { bottom: -10%; transform: scale(0.6); } 70% { bottom: 58%; transform: scale(1); } 100% { bottom: 62%; transform: scale(1.25); } }
.c11d-scene .notes { position: absolute; top: 10%; left: 0; right: 0; display: flex; justify-content: center; gap: 6px; }
.c11d-scene .notes i { display: block; width: 12px; height: 12px; border-radius: 50%; opacity: 0.25; transition: opacity 0.5s; box-shadow: 0 0 6px currentColor; }
.c11d-scene .notes i.on { opacity: 1; }
.c11d-scene .say { position: relative; z-index: 2; max-width: 88%; margin-top: 12%; padding: 6px 12px; border-radius: 10px; background: rgba(10, 12, 40, 0.75);
  color: #f6f4ff; font-size: 16px; line-height: 1.5; text-align: center; min-height: 3em; box-sizing: border-box; }
.c11d-scene .say b { color: #ffe9a0; }
@media (max-aspect-ratio: 1/1) { .c11d-scene .say { font-size: 14px; max-width: 94%; } }
`;
function addCss() {
  if (typeof document === 'undefined' || document.getElementById('c11d-css')) return;
  const s = document.createElement('style');
  s.id = 'c11d-css';
  s.textContent = CSS;
  document.head.append(s);
}

// ───── 画面の 上の まど（HTML。テストからも 見る）─────
// foes … 中ボス 2人・女王の pub・allies … 味方の pub・me … 自分の キャラの id
const nameIn = (allies) => (id) => (id === 'spica' ? 'スピカ' : id === 'algol' ? 'アルゴル' : allies.find((a) => a.id === id)?.name || '？');
export function c11dHtml(foes = [], allies = [], me = null) {
  const q = foes.find(isQueen);
  const nm = nameIn(allies);
  let cls = 'c11d-top';
  if (q) {
    if (q.c11dDown) return { html: `<div class="row"><b>${esc(QUEEN_SHORT)}は、しずかに手を下ろした。</b></div>`, cls: cls + ' good' };
    if (q.scene11d) return { html: '<div class="big">八つめの音が…</div>', cls: cls + ' warn' };
    const rings = q.rings11d || [];
    const loose = q.loose11d || [];
    let rows = '<div class="row"><b>手をつないだ輪</b>';
    if (!rings.length) rows += '　（まだ、だれもつないでいない）';
    rows += '</div>';
    if (rings.length) {
      rows += `<div class="row">${rings.map((r) => `<span class="ring${r.lock ? ' lock' : r.left <= 1 ? ' soon' : ''}">${ringDot(r.color)}${esc(r.m.map(nm).join('・'))}${r.lock ? `（ほどけない・あと${r.lock}）` : `（あと${r.left}）`}</span>`).join('')}</div>`;
    }
    if (loose.length) rows += `<div class="row">ひとり：${esc(loose.map(nm).join('・'))}</div>`;
    if (q.phase11d === 2 && q.eight11d) rows += `<div class="row">八つの音：のこり<b>${q.eight11d.left}</b>回${q.eight11d.lock ? `（はかりがきかない・あと${q.eight11d.lock}）` : ''}</div>`;
    let tx;
    const aim = q.measure11d;
    const aimRing = aim ? rings.find((r) => r.m.includes(aim)) : null;
    if (aim && q.eight11d?.lock > 1) tx = `光のはかり → ${nm(aim)}。でも、八つの音の輪で、はかりはきかない！`;
    else if (aim && (!aimRing || aimRing.left <= 1)) {
      tx = aim === me ? '光のはかりのねらいは、あなた！だれかと「手をつなぐ」！' : `光のはかり → ${nm(aim)}！${nm(aim)}と「手をつなぐ」で、ながされない！`;
      cls += ' warn';
    } else if (aim) tx = `光のはかり → ${nm(aim)}。手をつないでいるから、だいじょうぶ！`;
    else if (q.shine11d && loose.length) {
      tx = `かがやきが来る！ひとりの人（${loose.map(nm).join('・')}）は、とても大きなダメージ！「手をつなぐ」！`;
      cls += ' warn';
    } else if (q.shine11d) tx = 'かがやきが来る！みんなつないでいるから、こらえられる！';
    else if (me && loose.includes(me)) {
      tx = 'あなたは、まだ、だれとも手をつないでいない。「手をつなぐ」で、輪に入ろう！';
      cls += ' warn';
    } else if (rings.some((r) => !r.lock && r.left <= 1)) {
      tx = 'つないだ手が、はなれそう！もう一度「手をつなぐ」で、つなぎ直そう';
      cls += ' warn';
    } else if (q.phase11d === 2 && q.eight11d?.left) tx = '「八つの音」は、苦しい時に。みんなが、ほどけない輪になる！';
    else tx = 'みんなで1つの輪になろう。つないでいれば、ながされない！';
    return { html: `${rows}<div class="tx">${esc(tx)}</div>`, cls };
  }
  const ms = foes.find(isMirror);
  const mn = foes.find(isMoon);
  if (!ms && !mn) return { html: '', cls };
  const d0 = ms || mn;
  if (d0.c11dDuoDown) return { html: `<div class="row"><b>${esc(MIRROR_SHORT)}と${esc(MOON_SHORT)}は、引いていった！</b></div>`, cls: cls + ' good' };
  if (d0.c11dTaken) return { html: '<div class="row"><b>スピカが、つれていかれてしまった…</b></div>', cls: cls + ' bad' };
  const front = [ms, mn].find((e) => e?.front11d) || null;
  const chip = (e, nm2) => (e ? `<span class="c11d-chip ${e.down11d ? 'down' : e.front11d ? (e.swap11d ? 'warn' : 'front') : 'back'}">${esc(nm2)}${e.down11d ? '' : e.front11d ? '：前' : '：うしろ'}</span>` : '');
  let rows = `<div class="big">前：${esc(front ? (isMirror(front) ? MIRROR_SHORT : MOON_SHORT) : '…')}</div>`;
  rows += `<div class="row">${chip(ms, MIRROR_SHORT)}${chip(mn, MOON_SHORT)}</div>`;
  const veil = ms?.veil10 || [];
  if (ms && isMirror(front)) rows += `<div class="row">まく：${veil.length ? veil.map(colorChip).join('') : '<b>われている！</b>'}</div>`;
  const max = mn?.forgetMax11b || 3;
  const left = Math.max(0, max - (mn?.forget11b || 0));
  if (mn) rows += `<div class="row">スピカの思い出：<b>${'●'.repeat(left)}${'○'.repeat(max - left)}</b>（あと${left}）</div>`;
  let tx;
  if (front?.swap11d) {
    tx = `もうすぐ入れかわる！次は${isMirror(front) ? MOON_SHORT : MIRROR_SHORT}が前に出る。`;
    cls += ' warn';
  } else if (mn?.robe11b) {
    tx = 'わすれの衣が来る！「よびかける」で、スピカの名前をよぼう！';
    cls += ' warn';
  } else if (isMirror(front) && veil.length) {
    tx = `${MIRROR_SHORT}が前！まくと同じ色の「音を鳴らす」で、まくがわれる。`;
    cls += ' warn';
  } else if (isMoon(front) && left < max) {
    tx = `${MOON_SHORT}が前！わすれの衣につつまれている。スピカに「よびかける」！`;
    cls += ' warn';
  } else if (left < max) tx = `スピカの思い出が消えている。「よびかける」で、とりもどそう。`;
  else tx = `今だ！前にいる${front ? (isMirror(front) ? MIRROR_SHORT : MOON_SHORT) : ''}にこうげき！（うしろのほうは、こうげきが通りにくい）`;
  return { html: `${rows}<div class="tx">${esc(tx)}</div>`, cls };
}
const portrait = () => typeof window !== 'undefined' && window.innerHeight > window.innerWidth;
function showTop(scene, html, cls) {
  if (typeof document === 'undefined' || !scene.stage) return;
  if (!scene.c11dTop) {
    addCss();
    scene.c11dTop = document.createElement('div');
    scene.c11dTop.className = cls;
    scene.c11dTop.style.display = 'none';
    scene.stage.append(scene.c11dTop);
  }
  const el = scene.c11dTop;
  const flow = portrait() && !!scene.stage.parentElement;
  if (flow) {
    if (el.previousElementSibling !== scene.stage || el.parentElement !== scene.stage.parentElement) scene.stage.after(el);
  } else if (el.parentElement !== scene.stage) scene.stage.append(el);
  const key = cls + '|' + html + '|' + flow;
  if (el.dataset.k === key) return;
  el.dataset.k = key;
  el.className = cls + (flow ? ' c11d-flow' : '');
  el.innerHTML = html;
  el.style.display = html ? '' : 'none';
}
const myId = (scene) => scene.myActor?.id ?? scene.cur ?? null;
const foesOf = (scene) => (scene.enemies?.() || []).filter((e) => isDuo(e) || isQueen(e));
const queenPub = (scene) => (scene.enemies?.() || []).find(isQueen) || null;

// ───────────── え（client/battle-c9b.js の c9bSprite から）─────────────
// 中ボス … ひざを ついた 方・勝った あと（今 ある え の コマ 2・3。たおれても 消えない）／ 女王 … 手を 下ろす（コマ 2・3）
export function c11dSprite(c, frame) {
  if (isDuo(c) && (c.down11d || c.c11dDuoDown)) {
    c.dead = -1;
    return monsterCanvas(c.species, (frame ? 1 : 0) + 2);
  }
  if (isQueen(c) && c.c11dDown) {
    c.dead = -1;
    return monsterCanvas(C11D_QUEEN, (frame ? 1 : 0) + 2);
  }
  return null;
}

function tag(x, tx, ty, text, base, bg, fg, wd = 30) {
  x.globalAlpha = base * 0.9;
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

// ───────────── たたかいの え（client/battle-c9b.js の c9bDraw の さいご）─────────────
export function c11dDraw(scene, x, m, c, px, py, w, h, base) {
  if (!isDuo(c) && !isQueen(c)) return;
  c11dBannerOne(scene);
  const allies = scene.allies?.() || [];
  const foes = foesOf(scene).concat(!c.alive ? [c] : []).filter((e, i, a) => a.indexOf(e) === i);
  const top = c11dHtml(foes, allies, myId(scene));
  showTop(scene, top.html, top.cls);
  scene.stage?.classList?.add?.('c11d-stage');
  refreshCmd(scene);
  // 曲: 後半（八つめの 音の あと）は c11d_queen2。つなぎ直した 時も（場面を 見て いない 人）
  if (isQueen(c) && c.phase11d === 2 && !scene.c11dScene && !c.c11dDown) playTrack(scene, C11D_TRACKS_B.queen2);
  if (!c.alive || c.c11dDown || c.down11d) return;
  const ty = portrait() ? py + h * 0.6 : py + h + 4;
  if (isDuo(c)) {
    tag(x, px + w / 2, Math.max(6, py - 2), c.front11d ? (c.swap11d ? '前→入れかわる！' : '前') : 'うしろ', base, c.front11d ? '#3a1a00' : '#20184a', c.front11d ? '#ffd060' : '#c8c0e8', 56);
    if (isMirror(c) && c.front11d && (c.veil10 || []).length) tag(x, px + w / 2, ty, `まく：${NOTE_COLORS[c.veil10[0]]?.name || ''}（${NOTE_COLORS[c.veil10[0]]?.note || ''}）`, base, NOTE_COLORS[c.veil10[0]]?.css || '#ccc', inkOf(c.veil10[0]), 64);
    if (isMoon(c) && c.robe11b) tag(x, px + w / 2, ty, 'わすれの衣！よびかけよう', base, '#3a1a00', '#ffd060', 104);
  } else if (isQueen(c)) {
    if (c.measure11d) tag(x, px + w / 2, ty, '光のはかり！', base, '#3a1a00', '#ffd060', 60);
    else if (c.shine11d) tag(x, px + w / 2, ty, 'かがやきが来る！', base, '#3a1a00', '#ffd060', 70);
  }
  x.globalAlpha = base;
}
function playTrack(scene, id) {
  const a = scene.game?.audio;
  if (!a || typeof a.play !== 'function' || a.music?.id === id) return;
  a.play(id, { force: true });
}

// ───────────── 手を つなぐ 光の 線（味方の まどの 間。スピカ・アルゴルは 上の まど・スピカの 光の 所へ）─────────────
function boxOf(scene, id) {
  if (id === 'spica' || id === 'algol') return scene.c9hud?.el || scene.c11dTop || null;
  return scene.statusBoxes?.get?.(id)?.box || null;
}
export function playHoldLine(scene, fromId, toId, color = 0) {
  if (typeof document === 'undefined') return false;
  const a = boxOf(scene, fromId)?.getBoundingClientRect?.();
  const b = boxOf(scene, toId)?.getBoundingClientRect?.();
  if (!a || !b) return false;
  addCss();
  const x1 = a.left + a.width / 2, y1 = a.top + a.height / 2, x2 = b.left + b.width / 2, y2 = b.top + b.height / 2;
  const len = Math.max(8, Math.hypot(x2 - x1, y2 - y1));
  const el = document.createElement('div');
  el.className = 'c11d-line';
  const col = RING_CSS[color % RING_CSS.length];
  Object.assign(el.style, { left: `${Math.round(x1)}px`, top: `${Math.round(y1 - 2)}px`, width: `${Math.round(len)}px`, transform: `rotate(${Math.atan2(y2 - y1, x2 - x1)}rad)`, background: `linear-gradient(90deg, #ffffff, ${col}, #ffffff)`, color: col });
  document.body.append(el);
  setTimeout(() => el.remove(), 1500);
  return true;
}

// ───────────── 八つめの 音の 場面（サーバーの 文を じゅんに 出す。ev.dur の 間。だれの 画面でも 同じ）─────────────
export function playEightScene(scene, e) {
  if (typeof document === 'undefined' || !scene?.stage || !e?.lines?.length) return false;
  addCss();
  scene.c11dScene?.remove?.();
  const ms = e.ms || 1500;
  const el = document.createElement('div');
  el.className = 'c11d-scene';
  el.style.setProperty('--rise', `${Math.round((e.lines.length * ms) / 1000 * 0.6)}s`);
  el.innerHTML = `<div class="notes">${EIGHT_CSS.map((c, i) => `<i style="background:${c};color:${c}" data-i="${i}"></i>`).join('')}</div><div class="lt"></div><div class="say"></div>`;
  scene.stage.append(el);
  scene.c11dScene = el;
  const say = el.querySelector('.say');
  const dots = [...el.querySelectorAll('.notes i')];
  const fmt = (t) => {
    const m = /^(.+?)「(.*)」$/.exec(t);
    return m ? `<b>${esc(m[1])}</b>「${esc(m[2])}」` : esc(t);
  };
  e.lines.forEach((t, i) => setTimeout(() => {
    if (!el.isConnected) return;
    say.innerHTML = fmt(t);
    // 7つの 音の 丸は はじめから、8つめは さいごの 2行で 光る
    const on = i >= e.lines.length - 2 ? 8 : 7;
    dots.forEach((d, k) => d.classList.toggle('on', k < on));
  }, i * ms));
  setTimeout(() => {
    el.remove();
    if (scene.c11dScene === el) scene.c11dScene = null;
    playTrack(scene, C11D_TRACKS_B.queen2);
  }, e.lines.length * ms + 300);
  return true;
}

// ───────────── イベントを 見せる とき（client/battle-c9b.js の c9bPresent の さいご）─────────────
export function c11dBannerOne(scene) {
  if (!scene || scene._c11dBn || typeof scene.banner !== 'function') return;
  const orig = scene.banner.bind(scene);
  scene._c11dBn = true;
  scene.banner = (text, cls = '') => {
    scene.stage?.querySelectorAll?.('.b-banner')?.forEach((x) => x.remove());
    addCss();
    return orig(text, `${cls} c11d-bn`);
  };
}
export function c11dPresent(scene, ev) {
  if (foesOf(scene).length) c11dBannerOne(scene);
  const g = scene.game;
  const warn = (t) => { g?.audio?.sfx('warn'); scene.banner(t, 'danger'); };
  const good = (t, s = 'crit') => { g?.audio?.sfx(s); scene.banner(t, 'combo'); };
  const me = myId(scene);
  const nm = nameIn(scene.allies?.() || []);
  if (ev.c11dHold?.ok) {
    g?.audio?.sfx('sparkle');
    playHoldLine(scene, ev.c11dHold.id, ev.c11dHold.to, ev.c11dHold.color);
  }
  if (ev.c11dEight) {
    playTrack(scene, C11D_TRACKS_B.eight);
    playEightScene(scene, ev.c11dEight);
  }
  if (ev.c11dDazzle) scene.shake?.(700, 5);
  if (ev.c11dShine || ev.c11dSweep) scene.shake?.(500, 5);
  if (ev.c11dDown || ev.c11dDuoDown) scene.shake?.(500, 4);
  const say = [
    ev.c11dDazzle && [warn, 'まぶしすぎる光！手が、ぜんぶほどけた…！'],
    ev.c11dEight && [(t) => good(t, 'sparkle'), '八つめの音が、とどいた！みんなが1つの輪に！'],
    ev.c11dEightUse?.ok && [(t) => good(t, 'sparkle'), `八つの音！ほどけない輪になった！（のこり${ev.c11dEightUse.left}回）`],
    ev.c11dSweep && [warn, ev.c11dSweep.id === me ? 'あなたは、光の川にながされた…！' : `${nm(ev.c11dSweep.id)}が、光の川にながされた…！`],
    ev.c11dMeasure?.held && [(t) => good(t, 'sparkle'), '手が、はなれない！ながされなかった！'],
    ev.c11dHold?.ok && ev.c11dHold.ring.length >= 3 && ev.c11dHold.grew && [(t) => good(t, 'sparkle'), `${ev.c11dHold.ring.length}人の輪になった！`],
    ev.c11dHold?.ok && [(t) => good(t, 'sparkle'), `${nm(ev.c11dHold.id)}と${nm(ev.c11dHold.to)}が、手をつないだ！`],
    ev.c11dMeasureUp && [warn, ev.c11dMeasureUp.aim === me ? '！光のはかりのねらいは、あなた！「手をつなぐ」！' : `！光のはかり → ${nm(ev.c11dMeasureUp.aim)}`],
    ev.c11dShineUp && [warn, ev.c11dShineUp.loose.length ? '！かがやきが来る！ひとりの人は「手をつなぐ」！' : '！かがやきが来る！'],
    ev.c11dShine && [warn, ev.c11dShine.loose.length ? 'かがやき！ひとりの人に、大きなダメージ…！' : 'かがやき！つないだ手で、こらえた！'],
    ev.c11dRingOff && [warn, 'つないだ手が、はなれてしまった…'],
    ev.c11dReturn && [(t) => good(t, 'sparkle'), `${nm(ev.c11dReturn.id)}が、もどってきた！`],
    ev.c11dGlow?.n >= 3 && [(t) => good(t, 'sparkle'), `スピカの光が、${ev.c11dGlow.n}人の輪にひろがった！`],
    ev.c11dSong && [(t) => good(t, 'sparkle'), '八つの音のうた！みんな回復した！'],
    // 中ボス
    ev.c11dTaken && [warn, 'スピカが、つれていかれてしまった…'],
    ev.c11dKnee && [(t) => good(t, 'sparkle'), `もう入れかわらない！${ev.c11dKnee.front === 'mirror' ? MIRROR_SHORT : MOON_SHORT}だけが前に！`],
    ev.c11dSwap && [warn, ev.c11dSwap.front === 'mirror' ? `${MIRROR_SHORT}が前に！まくの色を見て「音を鳴らす」！` : `${MOON_SHORT}が前に！「よびかける」で、思い出を守ろう！`],
    ev.c11dBreak && [(t) => good(t, 'sparkle'), `${MIRROR_SHORT}のまくが、われた！`],
    ev.c11dCall?.ok && [(t) => good(t, 'sparkle'), `スピカの思い出が、もどった！（あと${ev.c11dCall.left}）`],
    ev.c11dRobe && [warn, `わすれの衣が、スピカにかかった…（思い出、あと${ev.c11dRobe.left}）`],
    ev.c11dRobeUp && [warn, '！わすれの衣が来る！「よびかける」でスピカの名前をよぼう！'],
    ev.c11dSwapUp && [warn, `！次は${ev.c11dSwapUp.next === 'mirror' ? MIRROR_SHORT : MOON_SHORT}が前に出てくる！`],
    ev.c11dRing && !ev.c11dRing.ok && ev.c11dRing.why === 'back' && [warn, `${MIRROR_SHORT}は、うしろにいる…（今は${MOON_SHORT}が前）`],
  ].find(Boolean);
  if (say && !ev.c11dDown && !ev.c11dDuoDown) say[0](say[1]);
  if (ev.c11dDown) good(`${QUEEN_SHORT}は、しずかに手を下ろした。`, 'sparkle');
  if (ev.c11dDuoDown) good(`${MIRROR_SHORT}と${MOON_SHORT}は、引いていった！`, 'sparkle');
}

// ───────────── 仲間の まど（client/battle-c9a.js の c9aStatus から）: 輪の しるし・ながされた・はかられる ─────────────
export function c11dStatus(s, a) {
  if (!s?.name) return;
  const parent = s.name.parentNode;
  let b = parent?.querySelector?.('.c11d-badge');
  if (!a?.hold11d || !a.alive) {
    b?.remove();
    return;
  }
  addCss();
  if (!b && parent) {
    b = document.createElement('span');
    b.className = 'c11d-badge';
    s.name.after(b);
  }
  if (!b) return;
  const r = a.ring11d;
  if (a.swept11d) {
    b.className = 'c11d-badge swept';
    b.style.background = '';
    b.textContent = `ながされた・あと${a.swept11d}`;
    b.title = '光の川にながされている（戦いの外）。もどると、HPは半分';
  } else if (a.aim11d && !r) {
    b.className = 'c11d-badge aim';
    b.style.background = '';
    b.textContent = 'はかられる！';
    b.title = '光のはかりのねらい。だれかと手をつなぐと、ながされない';
  } else if (r) {
    b.className = `c11d-badge${a.aim11d ? ' aim' : ''}`;
    b.style.background = a.aim11d ? '' : RING_CSS[r.c % RING_CSS.length];
    b.textContent = r.lock ? `輪${r.n}・ほどけない` : `輪${r.n}・あと${r.left}`;
    b.title = `${RING_NAME[r.c % RING_NAME.length]}の輪（${r.n}人）。同じ色のしるしの人と、手をつないでいる`;
  } else {
    b.className = 'c11d-badge lone';
    b.style.background = '';
    b.textContent = 'ひとり';
    b.title = 'だれとも手をつないでいない';
  }
}

// ───────────── コマンド（client/battle-c9b.js の c9bCmdItems・c9bCmdPick）─────────────
// 中ボスの 戦いでは、今 ある「音を鳴らす」「よびかける」の まどを そのまま 使う（もとの まどが 見る 名前の 魔物に 見せる）
function duoScene(scene) {
  const fake = () => (scene.enemies?.() || []).map((e) => {
    if (isMirror(e)) return { ...e, species: C10D_MIRARE, alive: e.alive !== false && !e.down11d, veil10: e.front11d ? e.veil10 || [] : [], left10: 0, measure: 0 };
    if (isMoon(e)) return { ...e, species: C11B_OBORO };
    return e;
  });
  return new Proxy(scene, {
    get(t, k) {
      if (k === 'enemies') return fake;
      const v = Reflect.get(t, k, t);
      return typeof v === 'function' ? v.bind(t) : v;
    },
  });
}
const duoPubs = (scene) => (scene.enemies?.() || []).filter(isDuo);
const cmdKey = (scene) => {
  const q = queenPub(scene);
  if (q) return JSON.stringify([q.rings11d, q.loose11d, q.measure11d, q.shine11d, q.phase11d, q.eight11d, q.scene11d]);
  return JSON.stringify(duoPubs(scene).map((e) => [e.front11d, e.veil10, e.forget11b, e.robe11b, e.swap11d, e.down11d]));
};
export function c11dCmdItems(scene, a) {
  const items = [];
  let info = '';
  if (!a) return { items, info };
  const q = queenPub(scene);
  if (q && (a.abilities || []).includes(HOLD)) {
    const me = (scene.allies?.() || []).find((x) => x.id === a.id) || a;
    const r = me.ring11d;
    const tagTx = r ? (r.lock ? '輪・ほどけない' : `輪${r.n}・あと${r.left}`) : 'ひとり';
    items.push({ html: `<span class="dual-cmd">手をつなぐ</span><span class="tag">${esc(tagTx)}</span>`, value: C11D_CMD.hold, cls: 'k-dual' });
    if ((a.abilities || []).includes(EIGHT) && q.eight11d?.done) {
      const left = q.eight11d.left || 0;
      items.push({ html: `<span class="dual-cmd">八つの音</span><span class="tag">${left ? `のこり${left}回` : 'もうない'}</span>`, value: C11D_CMD.eight, cls: 'k-dual' });
    }
    if (q.measure11d === a.id && !r) info = '光のはかりのねらいは、あなた！「手をつなぐ」で、ながされない！';
    else if (!r) info = 'まだ、だれとも手をつないでいない。「手をつなぐ」で、輪に入ろう！';
    else if (!r.lock && r.left <= 1) info = 'つないだ手が、はなれそう！もう一度「手をつなぐ」で、つなぎ直そう。';
    else if (q.shine11d && (q.loose11d || []).length) info = 'かがやきが来る！ひとりの人と「手をつなぐ」で、守ろう。';
    else if (q.phase11d === 2 && q.eight11d?.left && !q.eight11d.lock) info = '「八つの音」で、みんなが、ほどけない輪になる。苦しい時に！';
    scene.c11dShown = { id: a.id, key: cmdKey(scene) };
    return { items, info };
  }
  const duo = duoPubs(scene);
  if (!duo.length) return { items, info };
  const ds = duoScene(scene);
  const ring = c10dCmdItems(ds, a);
  const call = c11bCmdItems(ds, a);
  const mirrorFront = duo.some((e) => isMirror(e) && e.front11d && !e.down11d);
  items.push(...(mirrorFront ? [...ring.items, ...call.items] : [...call.items, ...ring.items]));
  const mn = duo.find(isMoon);
  const ms = duo.find(isMirror);
  const left = mn ? Math.max(0, (mn.forgetMax11b || 3) - (mn.forget11b || 0)) : 3;
  if (mirrorFront && (ms?.veil10 || []).length) info = `${MIRROR_SHORT}が前！まくの色は${NOTE_COLORS[ms.veil10[0]]?.name}（${NOTE_COLORS[ms.veil10[0]]?.note}）。同じ色の「音を鳴らす」で、まくがわれる。`;
  else if (mn?.robe11b) info = 'わすれの衣が来る！「よびかける」で、スピカの名前をよぼう。';
  else if (left < (mn?.forgetMax11b || 3)) info = `スピカの思い出が、あと${left}。「よびかける」で、スピカの名前をよぼう。`;
  else info = '前に出ているほうに、こうげきしよう（うしろのほうは、こうげきが通りにくい）。';
  scene.c11dShown = { id: a.id, key: cmdKey(scene) };
  return { items, info };
}
// コマンドの まどを 開いて いる 間に 輪・前ぶれ・前に いる 方が かわったら、いちばん 上の まどを 開き直す
export function refreshCmd(scene) {
  const me = scene.myActor;
  const shown = scene.c11dShown;
  if (!me || !shown || shown.id !== me.id || !scene.menu || typeof scene.openCommand !== 'function') return false;
  const title = scene.cmdEl?.querySelector?.('.who')?.textContent || '';
  if (!title.includes('はどうする？')) return false;
  const key = cmdKey(scene);
  if (key === shown.key) return false;
  scene.c11dShown = { id: me.id, key };
  scene.openCommand();
  return true;
}
// だれと 手を つなぐ？（スピカ・味方〈自分 いがい・ながされて いない〉・ひとりの 時は アルゴル。味方の まどを タップしても えらべる）
export function holdChoices(scene, a) {
  const q = queenPub(scene);
  const allies = scene.allies?.() || [];
  const rings = q?.rings11d || [];
  const ringTx = (id) => {
    const r = rings.find((x) => x.m.includes(id));
    return r ? `（${RING_NAME[r.color % RING_NAME.length]}の輪・${r.m.length}人）` : '（ひとり）';
  };
  const aim = q?.measure11d;
  const list = [{ label: `スピカ${ringTx('spica')}`, value: 'spica' }];
  for (const x of allies) {
    if (!x.alive || x.id === a.id || x.swept11d || x.kind === 'guest') continue;
    list.push({ label: `${x.name}${ringTx(x.id)}${x.id === aim ? '　←はかられる！' : ''}`, value: x.id });
  }
  if (q?.solo11d) list.push({ label: `アルゴル${ringTx('algol')}`, value: 'algol' });
  return list;
}
export function c11dCmdPick(scene, a, value) {
  if (value === C11D_CMD.hold) {
    const send = (choice) => scene.send({ type: 'ability', id: HOLD, choice });
    scene.showMenu(holdChoices(scene, a), (it) => send(it.value), () => scene.openCommand(), 'だれと、手をつなぐ？');
    scene.targeting = { side: 'ally', done: (id) => (id === a.id ? null : send(id)), dead: false };
    return true;
  }
  if (value === C11D_CMD.eight) {
    scene.send({ type: 'ability', id: EIGHT });
    return true;
  }
  // 中ボス: 今 ある まど（音を鳴らす … 6つの 音・よびかける … だれに）
  if (!duoPubs(scene).length) return false;
  if (value === 'c10dring') return c10dNoteMenu(duoScene(scene), a);
  if (value === 'c11bcall') return c11bCmdPick(duoScene(scene), a, value);
  return false;
}
