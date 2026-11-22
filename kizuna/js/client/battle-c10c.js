// 第3部 第2章 第3幕「紫と、うばわれた音」の たいさ・アルゴル・ふつうの 魔物の がめん
// （client/battle-c9b.js から よぶ。サーバーがわは shared/battle-c10c.js）
// ・画面の 上の まど（ボスの 戦いだけ。PC は 右上・スマホの たては 戦いの 絵の すぐ 下）:
//   たいさ … 雷の 前ぶれ（光った 石）・まぶしい・休んで いる（1.5倍）／アルゴル … 光を 食べるまで・やみの とばり・星の音の 前ぶれ
// ・うき石の まど（たいさの 戦いだけ。PC は 戦いの 絵の 下・スマホの たては 上の まどの すぐ 下）:
//   3つの 石（左・まん中・右）と、だれが どこに いるか。光って いる 石は 黄色く 光る・くずれた 石・ひび・せまい！
// ・コマンド: たいさの 戦いは いちばん 上に「うつる」（自分の 石が 光って いる 時は「にげろ！」）。行き先は 3つの 石から えらぶ（的えらびと おなじ 1回で 決まる まど）
//   アルゴルの 戦いは コマンドの せつめいで「強くなる技は、食べられる」「星の音が来る … 星のうた」「暗い … てらす」
// ・勝った あと: たいさは しょんぼり・アルゴルは ひざを つく（え の コマ 2・3。たおれても 消えない）
import { C10C_COLONEL, C10C_ALGOL } from '../shared/data/monsters-c10c.js?v=92b65651df0b';
import { UTSURU } from '../shared/data/abilities-c10c.js?v=92b65651df0b';
import { STONE_NAMES } from '../shared/battle-c10c.js?v=92b65651df0b';
import { monsterCanvas } from './render/monsters.js?v=92b65651df0b';

// 前ぶれの バナーを 自分で 出す（client/battle-c8r.js の C8R_OWN_TELE に まぜる）
export const C10C_OWN_TELE = [C10C_COLONEL, C10C_ALGOL];
export const C10C_SCREEN_ANIMS = ['c10c_rain', 'c10k_bolt', 'c10k_spark', 'c10y_eat', 'c10y_veil', 'c10y_blast', 'c10y_shard'];
export const C10C_ALLY_FX = {
  c10c_tackle: 'quake', c10c_mist: 'down', c10c_glide: 'claw', c10c_sting: 'bolt', c10c_bolt: 'bolt', c10c_rain: 'bolt', c10c_jsting: 'claw', c10c_stone: 'quake',
  c10c_box: 'quake', c10c_throw: 'down', c10c_drill: 'claw', c10c_dust: 'wind', c10c_beam: 'bolt', c10c_alarm: 'down', c10c_flare: 'down', c10c_spear: 'claw', c10c_march: 'quake',
  c10k_slab: 'quake', c10k_spark: 'bolt', c10k_flash: 'bolt', c10k_bolt: 'bolt',
  c10y_shard: 'down', c10y_cold: 'bolt', c10y_mantle: 'wind', c10y_blast: 'quake',
};
export const C10C_SFX = {
  c10c_tackle: 'hit', c10c_mist: 'warn', c10c_glide: 'hit', c10c_sting: 'hit', c10c_bolt: 'smash', c10c_rain: 'hit', c10c_jsting: 'hit', c10c_stone: 'hit', c10c_glow: 'buff',
  c10c_box: 'smash', c10c_throw: 'sparkle', c10c_rest: 'buff', c10c_drill: 'hit', c10c_dust: 'hit', c10c_beam: 'smash', c10c_alarm: 'warn', c10c_flare: 'hit',
  c10c_spear: 'smash', c10c_march: 'hit', c10c_guard: 'buff', c10c_move: 'sparkle',
  c10k_slab: 'smash', c10k_spark: 'hit', c10k_flash: 'smash', c10k_bolt: 'blast', c10k_why: 'sparkle',
  c10y_shard: 'hit', c10y_cold: 'smash', c10y_mantle: 'smash', c10y_eat: 'warn', c10y_veil: 'warn', c10y_blast: 'blast', c10y_still: 'sparkle',
};
const isColonel = (c) => c?.species === C10C_COLONEL;
const isAlgol = (c) => c?.species === C10C_ALGOL;
export const stoneName = (i) => `${STONE_NAMES[i] || ''}の石`;

const CSS = `
.c10c-top { position: absolute; right: 4px; top: 4px; z-index: 4; max-width: 46%; pointer-events: none;
  padding: 3px 8px 4px; border-radius: 10px; text-align: left; line-height: 1.3; color: #f2eaff;
  background: rgba(36, 18, 64, 0.88); border: 2px solid rgba(190, 150, 255, 0.85); box-shadow: 0 0 10px rgba(170, 120, 255, 0.4); }
.c10c-top .row { font-size: 12px; white-space: nowrap; }
.c10c-top .row b { color: #ffe860; }
.c10c-top .tx { margin-top: 2px; font-size: 11px; color: #e8dcff; }
.c10c-top.warn { border-color: #ffd040; box-shadow: 0 0 14px rgba(255, 208, 64, 0.85); }
.c10c-top.warn .tx { color: #ffe060; animation: c10c-pulse 0.9s infinite; }
.c10c-top.good { border-color: #8affc8; }
.c10c-top.good .tx { color: #b0ffd8; }
@keyframes c10c-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
.c10c-stones { position: absolute; left: 50%; bottom: 2px; transform: translateX(-50%); z-index: 4; pointer-events: none;
  display: flex; gap: 6px; padding: 3px 6px; border-radius: 10px; background: rgba(20, 12, 40, 0.86); border: 2px solid rgba(160, 130, 220, 0.7); }
.c10c-stones .st { min-width: 96px; max-width: 150px; padding: 2px 6px 3px; border-radius: 8px; text-align: center; line-height: 1.25;
  background: linear-gradient(#6a6080, #4a4060); border: 2px solid #8a80a0; color: #f4f0ff; }
.c10c-stones .st .nm { font-size: 11px; font-weight: bold; }
.c10c-stones .st .who { font-size: 11px; color: #ffffff; white-space: normal; }
.c10c-stones .st .who .me { color: #ffe860; font-weight: bold; }
.c10c-stones .st .who .gone { color: #a098b8; text-decoration: line-through; }
.c10c-stones .st .tg { font-size: 10px; font-weight: bold; }
.c10c-stones .st.lit { background: linear-gradient(#a08a20, #6a5a10); border-color: #ffe860; box-shadow: 0 0 12px rgba(255, 232, 96, 0.95); animation: c10c-lit 0.6s infinite; }
.c10c-stones .st.lit .tg { color: #ffe860; }
.c10c-stones .st.broken { background: #2a2434; border: 2px dashed #6a6080; color: #8a80a0; }
.c10c-stones .st.crack .tg { color: #ffb0a0; }
.c10c-stones .st.tight .tg { color: #ff9a9a; }
@keyframes c10c-lit { 0%, 100% { box-shadow: 0 0 12px rgba(255, 232, 96, 0.95); } 50% { box-shadow: 0 0 4px rgba(255, 232, 96, 0.5); } }
.c10c-top.c10c-flow, .c10c-stones.c10c-flow { position: relative; left: auto; right: auto; top: auto; bottom: auto; transform: none; margin: 3px auto 0; max-width: 98%; box-sizing: border-box; }
.c10c-top.c10c-flow { text-align: center; }
.c10c-stones.c10c-flow { width: fit-content; }
@media (max-aspect-ratio: 1/1) { .c10c-top { top: 2px; left: 2px; right: auto; max-width: 58%; padding: 1px 5px 2px; } .c10c-top .row { font-size: 10px; } .c10c-top .tx { font-size: 10px; margin-top: 0; }
  .c10c-stones .st { min-width: 0; flex: 1 1 0; max-width: 34%; padding: 1px 3px 2px; } .c10c-stones { gap: 3px; padding: 2px 3px; }
  .c10c-stones .st .who, .c10c-stones .st .nm { font-size: 10px; }
  .c10c-stage .b-hold { bottom: auto; top: 4px; right: auto; left: 6px; } }
`;
function addCss() {
  if (typeof document === 'undefined' || document.getElementById('c10c-css')) return;
  const s = document.createElement('style');
  s.id = 'c10c-css';
  s.textContent = CSS;
  document.head.append(s);
}
const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

// ───── 画面の 上の まど（HTML。テストからも 見る）─────
// c … ボスの pub・o … { allies, me（自分の id）}
export function c10cHtml(c, o = {}) {
  let cls = 'c10c-top';
  let row;
  let tx;
  if (isColonel(c) && c.c10Kind === 'colonel') {
    const S = c.stones || [];
    const lit = S.map((s, i) => (s.lit ? i : -1)).filter((i) => i >= 0);
    row = lit.length ? `雷の前ぶれ：<b>${lit.map(stoneName).join('と')}</b>` : 'うき石：雷は、まだ来ない';
    const meStone = (o.allies || []).find((a) => a.id === o.me)?.stone10;
    if (c.c10Down) { tx = 'たいさは、しょんぼりすわりこんだ！'; cls += ' good'; } else if (c.rest) { tx = 'たいさは、うろたえている！今なら、こうげきがよく通る（1.5倍）'; cls += ' good'; } else if (lit.length && c.dazzle) { tx = 'スピカの光で、たいさはまぶしい！次の雷は外れる'; cls += ' good'; } else if (lit.length) {
      tx = Number.isInteger(meStone) && S[meStone]?.lit ? 'あなたの石が光っている！「うつる」で、光っていない石へ！' : '光った石の人は「うつる」で、にげよう！';
      cls += ' warn';
    } else if ((o.allies || []).some((a) => a.alive && a.tight10)) tx = '3人いじょう同じ石だと、せまい！（こうげき半分）';
    else tx = c.half ? 'HPが半分…光る石が2つになる！かたまりすぎに気をつけて' : '光った石には、雷が落ちる。光ったら「うつる」でにげよう';
  } else if (isAlgol(c) && c.c10Kind === 'algol') {
    const left = c.eatLeft ?? 0;
    row = `光を食べるまで：<b>あと${left}</b>${c.veil ? '　やみのとばり' : ''}`;
    if (c.c10Down) { tx = 'アルゴルは、ひざをついた…'; cls += ' good'; } else if (c.ring) { tx = '星の音が来る！スピカの「星のうた」で止めよう（「防御」でもそなえられる）'; cls += ' warn'; } else if (c.still) { tx = 'むらさきの音が止まった！アルゴルは動けない'; cls += ' good'; } else if (c.veil) { tx = '暗くて、こうげきが半分…スピカの「てらす」ではらおう'; cls += ' warn'; } else if (left <= 1) {
      tx = '強くなる技を使うと、食べられて回復される！';
      cls += ' warn';
    } else tx = '強くなる技は、使わない方がいい。食べられてしまう';
  } else return { html: '', cls };
  return { html: `<div class="row">${row}</div><div class="tx">${esc(tx)}</div>`, cls };
}
// ───── うき石の まど（HTML。テストからも 見る）─────
export function stonesHtml(c, allies = [], me = null) {
  if (!isColonel(c) || c.c10Kind !== 'colonel' || c.c10Down) return '';
  const S = c.stones || [];
  return S.map((s, i) => {
    const on = allies.filter((a) => a.stone10 === i);
    const tight = on.filter((a) => a.alive).length >= 3;
    const cls = ['st', s.broken ? 'broken' : '', s.lit && !s.broken ? 'lit' : '', s.crack ? 'crack' : '', tight ? 'tight' : ''].filter(Boolean).join(' ');
    const who = on.length ? on.map((a) => `<span class="${a.id === me ? 'me' : a.alive ? '' : 'gone'}">${esc(a.name)}</span>`).join('・') : '（だれもいない）';
    const tg = s.broken ? 'くずれた' : s.lit ? (c.dazzle ? '光っている（外れる）' : '光っている！雷が来る') : s.crack ? 'ひびが入った' : tight ? 'せまい！' : '';
    return `<div class="${cls}" data-st="${i}"><div class="nm">${STONE_NAMES[i]}の石</div><div class="who">${s.broken ? '' : who}</div>${tg ? `<div class="tg">${esc(tg)}</div>` : ''}</div>`;
  }).join('');
}
const portrait = () => typeof window !== 'undefined' && window.innerHeight > window.innerWidth;
function boxEl(scene, key, cls) {
  if (typeof document === 'undefined' || !scene.stage) return null;
  if (!scene[key]) {
    addCss();
    scene[key] = document.createElement('div');
    scene[key].className = cls;
    scene[key].style.display = 'none';
    scene.stage.append(scene[key]);
  }
  return scene[key];
}
function place(scene, el, after) {
  const flow = portrait() && !!scene.stage.parentElement;
  if (flow) {
    const anchor = after && after.parentElement === scene.stage.parentElement ? after : scene.stage;
    if (el.previousElementSibling !== anchor || el.parentElement !== scene.stage.parentElement) anchor.after(el);
  } else if (el.parentElement !== scene.stage) scene.stage.append(el);
  return flow;
}
function showTop(scene, html, cls) {
  const el = boxEl(scene, 'c10cTop', 'c10c-top');
  if (!el) return;
  const flow = place(scene, el, null);
  const key = cls + '|' + html + '|' + flow;
  if (el.dataset.k === key) return;
  el.dataset.k = key;
  el.className = cls + (flow ? ' c10c-flow' : '');
  el.innerHTML = html;
  el.style.display = html ? '' : 'none';
}
function showStones(scene, html) {
  const el = boxEl(scene, 'c10cStones', 'c10c-stones');
  if (!el) return;
  const flow = place(scene, el, scene.c10cTop?.style.display === 'none' ? null : scene.c10cTop);
  const key = html + '|' + flow;
  if (el.dataset.k === key) return;
  el.dataset.k = key;
  el.className = 'c10c-stones' + (flow ? ' c10c-flow' : '');
  el.innerHTML = html;
  el.style.display = html ? '' : 'none';
}
const myId = (scene) => scene.myActor?.id ?? scene.cur ?? null;

// ───────────── え（client/battle-c9b.js の c9bSprite から）: 勝った あと（コマ 2・3）─────────────
export function c10cSprite(c, frame) {
  if (!(isColonel(c) || isAlgol(c)) || !c.c10Down) return null;
  c.dead = -1;
  return monsterCanvas(c.species, (frame ? 1 : 0) + 2);
}

function tag(x, tx, ty, text, base, bg, fg, wd = 30) {
  x.globalAlpha = base * 0.88;
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
export function c10cDraw(scene, x, m, c, px, py, w, h, base) {
  if (!isColonel(c) && !isAlgol(c)) return;
  const T = scene.time || 0;
  scene.stage?.classList?.add?.('c10c-stage');
  const allies = scene.allies?.() || [];
  const top = c10cHtml(c, { allies, me: myId(scene) });
  showTop(scene, top.html, top.cls);
  if (isColonel(c)) showStones(scene, stonesHtml(c, allies, myId(scene)));
  refreshInfo(scene);
  if (c.c10Down) return;
  const ty = portrait() ? py + h * 0.55 : py + h + 4;
  if (isColonel(c)) {
    if (c.rest) tag(x, px + w / 2, ty, 'うろたえている！今だ！', base, '#0a2a1a', '#b0ffd8', 90);
    else if ((c.stones || []).some((s) => s.lit)) {
      x.globalAlpha = base * (0.45 + Math.sin(T / 70) * 0.35);
      x.fillStyle = '#ffe860';
      x.beginPath();
      x.ellipse(px + w * 0.75, py + h * 0.2, 10, 10, 0, 0, Math.PI * 2);
      x.fill();
      x.globalAlpha = base;
      tag(x, px + w / 2, ty, c.dazzle ? 'まぶしい！（次の雷は外れる）' : '雷が来る！光った石からにげろ', base, '#3a2a00', '#ffe860', 112);
    }
    return;
  }
  // アルゴル
  if (c.veil) {
    x.globalAlpha = base * (0.25 + Math.sin(T / 300) * 0.05);
    x.fillStyle = '#0a0418';
    x.fillRect(0, 0, 256, 144);
    x.globalAlpha = base;
  }
  if (c.ring) {
    x.globalAlpha = base * (0.5 + Math.sin(T / 70) * 0.4);
    x.strokeStyle = '#c8a0ff';
    x.lineWidth = 2;
    x.beginPath();
    x.ellipse(px + w / 2, py + h, w * 0.6, 8, 0, 0, Math.PI * 2);
    x.stroke();
    x.globalAlpha = base;
    tag(x, px + w / 2, ty, '星の音が来る！星のうたで止めろ', base, '#2a0a3a', '#e8d8ff', 116);
  } else if (c.still) tag(x, px + w / 2, ty, '音が止まった！動けない', base, '#0a2a1a', '#b0ffd8', 86);
  else if (c.veil) tag(x, px + w / 2, ty, 'やみのとばり（てらすではらえる）', base, '#14082a', '#d8c8ff', 116);
}

// ───────────── イベントを 見せる とき（client/battle-c9b.js の c9bPresent の さいご）─────────────
export function c10cPresent(scene, ev) {
  const g = scene.game;
  const warn = (t) => { g.audio.sfx('warn'); scene.banner(t, 'danger'); };
  const good = (t, s = 'crit') => { g.audio.sfx(s); scene.banner(t, 'combo'); };
  if (ev.c10kBolt || ev.c10yBlast) scene.shake?.(800, 9);
  if (ev.c10yEat?.n) scene.shake?.(400, 4);
  const names = (a) => (a || []).map(stoneName).join('と');
  // バナーは 1つの できごとに 1つだけ（大事な じゅん）
  const say = [
    ev.c10kLit && [warn, `！${names(ev.c10kLit.stones)}が光った！雷が来る…「うつる」でにげよう！`],
    ev.c10kMiss && [(t) => good(t, 'sparkle'), ev.c10kMiss.dazzled ? '雷が外れた！たいさはまぶしくて、うろたえている！' : '雷が外れた！たいさはうろたえている！今だ！'],
    ev.c10kHit && [warn, `雷が${ev.c10kHit.n}人に当たった…！`],
    ev.c10kCrack && [warn, `${stoneName(ev.c10kCrack.stone)}が、くずれた！`],
    ev.c10kDazzle && [(t) => good(t, 'sparkle'), 'スピカの光で、たいさはまぶしい！次の雷は外れる！'],
    ev.c10yRingUp && [warn, '！星の音が来る！スピカの「星のうた」で止めよう！'],
    ev.c10yStop && [(t) => good(t, 'sparkle'), 'むらさきの音が、スピカの歌にこたえた！アルゴルは動けない！'],
    ev.c10yEat && ev.c10yEat.n > 0 && [warn, `よい効果を${ev.c10yEat.n}こ、食べられた…！アルゴルが回復した！`],
    ev.c10yEat && !ev.c10yEat.n && [(t) => good(t, 'sparkle'), 'アルゴルは、何も食べられなかった！'],
    ev.c10yVeil && [warn, 'やみのとばり…！こうげきが半分しか通らない！'],
    ev.c10yClear && [(t) => good(t, 'sparkle'), 'スピカの光で、やみのとばりがはれた！'],
    ev.c10kMove?.ok && ev.c10kMove.id === myId(scene) && [(t) => good(t, 'sparkle'), `${stoneName(ev.c10kMove.to)}へ、うつった！`],
  ].find(Boolean);
  if (say && !ev.c10cDown) say[0](say[1]);
  if (ev.c10cDown) {
    scene.shake?.(400, 3);
    good(ev.c10cDown.kind === 'colonel' ? 'たいさは、しょんぼりすわりこんだ！' : 'アルゴルは、ひざをついた…！', 'sparkle');
  }
}

// ───────────── コマンド（client/battle-c9b.js の c9bCmdItems・c9bCmdPick）─────────────
const bossOf = (scene, f) => (scene.enemies?.() || []).find((e) => f(e) && e.alive && !e.c10Down) || null;
export function c10cCmdItems(scene, a) {
  const items = [];
  let info = '';
  if (!a) return { items, info };
  const col = bossOf(scene, isColonel);
  if (col && (a.abilities || []).includes(UTSURU)) {
    const me = (scene.allies?.() || []).find((x) => x.id === a.id) || a;
    const S = col.stones || [];
    const danger = Number.isInteger(me.stone10) && S[me.stone10]?.lit && !col.dazzle;
    items.push({ html: `<span class="dual-cmd">うつる</span>${danger ? '<span class="tag">にげろ！</span>' : ''}`, value: 'c10cmove', cls: 'k-dual' });
    const here = Number.isInteger(me.stone10) ? stoneName(me.stone10) : '';
    info = danger ? `${here}が光っている！「うつる」で、光っていない石へにげよう。`
      : col.rest ? `いまは${here}。たいさはうろたえている！今のうちに、たたみかけよう。`
        : me.tight10 ? `いまは${here}。せまい！（こうげき半分）ほかの石へ「うつる」と、よい。`
          : `いまは${here}。光った石には、雷が落ちる。光ったら「うつる」でにげよう。`;
  }
  const alg = bossOf(scene, isAlgol);
  if (alg) {
    info = alg.ring ?'星の音が来る！スピカの「星のうた」で止めよう（「防御」でもそなえられる）。'
      : alg.veil ? 'やみのとばりで、こうげきが半分…。スピカの「てらす」で、はらおう。'
        : '強くなる技（守りや力を上げる技）は、アルゴルに食べられてしまう。こうげきで戦おう。';
  }
  if (info) scene.c10cInfoText = info;
  return { items, info };
}
// コマンドの まどを 開いた あとに ようすが かわったら（石が 光った・とばり など）、せつめいを 今の ようすで 出し直す
//   出して いる せつめいが この 幕の せつめいの まま の 時だけ（ほかの 技の せつめいを 見て いる 時は さわらない）
export function refreshInfo(scene) {
  const old = scene.c10cInfoText;
  const a = scene.myActor;
  if (!old || !a || !scene.infoEl || scene.infoEl.textContent !== old) return false;
  const now = c10cCmdItems({ enemies: () => scene.enemies?.() || [], allies: () => scene.allies?.() || [] }, a).info;
  if (!now || now === old) return false;
  scene.info(now);
  scene.c10cInfoText = now;
  return true;
}
// うつる: 行き先の まど（左・まん中・右。的えらびと おなじ 形 … 1回 えらぶと 決まる）
export function c10cMoveMenu(scene, a) {
  const col = bossOf(scene, isColonel);
  const S = col?.stones || [];
  const allies = scene.allies?.() || [];
  const me = allies.find((x) => x.id === a.id) || a;
  const list = S.map((s, i) => {
    const on = allies.filter((x) => x.alive && x.stone10 === i && x.id !== a.id);
    const state = s.broken ? 'くずれた' : s.lit ? (col.dazzle ? '光っている（外れる）' : '光っている！') : on.length + 1 >= 3 ? 'せまくなる' : '光っていない';
    const cls = s.broken ? 'a-null' : s.lit ? 'a-weak' : on.length + 1 >= 3 ? 'a-resist' : 'a-normal';
    return {
      html: `${esc(stoneName(i))}<span class="cnt">（${on.length}人）</span><span class="aff-line ${cls}">${esc(state)}</span>`,
      value: i,
      disabled: !!s.broken || i === me.stone10,
    };
  });
  const start = Math.max(0, list.findIndex((it) => !it.disabled && !S[it.value].lit));
  scene.showMenu(list, (it) => scene.send({ type: 'ability', id: UTSURU, choice: it.value }), () => scene.openCommand(), 'どの石へうつる？', null, start);
  return true;
}
export function c10cCmdPick(scene, a, value) {
  if (value !== 'c10cmove') return false;
  return c10cMoveMenu(scene, a);
}
