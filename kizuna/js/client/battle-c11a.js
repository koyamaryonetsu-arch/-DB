// 第3部 第3章 第1幕「星の船と、星座の島」の 星座のけもの・いかり船長の がめん（client/battle-c9b.js から よぶ。サーバーがわは shared/battle-c11a.js）
// ・画面の 上の まど（PC は 右上・スマホの たては 戦いの 絵の すぐ 下）:
//   船長 … 大きく「チク・タク　あと 5」（時計ごと。持って いる 人の 名前。あと 2 いかは 赤く ゆれる）・船長が 目を 回して いる・いかりなげの 前ぶれ
//   けもの … 3つの 星（あたま・むね・しっぽ）の ようす。たおれた 星は「よみがえるまで あと ○」・「星が、また光りはじめた…」
// ・仲間の まど: 時計を 持って いる 人の 名前の 横に「時計 5」の しるし（あと 2 いかは 赤）
// ・え: 船長が にげる え（コマ 2・3）・船長の 頭の 上に 時計の しるし（船長が 持って いる 時）・目を 回して いる 星
// ・コマンド: 時計を 持って いる 人に だけ、いちばん 上に「時計を投げる」（あと ○ の 文字）。1回で 決定（えらぶ まどは ない）
import { C11A_CAPTAIN, C11A_STARS, CAPTAIN_SHORT } from '../shared/data/monsters-c11a.js?v=8f07681fe7a2';
import { TOKEI_NAGE } from '../shared/data/abilities-c11a.js?v=8f07681fe7a2';
import { monsterCanvas } from './render/monsters.js?v=8f07681fe7a2';
import { playC11aBite, playC11aClock } from './render/battlefx-c11a.js?v=8f07681fe7a2';

// 前ぶれの バナーを 自分で 出す（client/battle-c8r.js の C8R_OWN_TELE に まぜる）
export const C11A_OWN_TELE = [C11A_CAPTAIN, ...C11A_STARS];
export const C11A_SCREEN_ANIMS = ['c11b_sweep', 'c11b_dust', 'c11b_mend', 'c11p_cannon', 'c11a_trail', 'c11a_wave', 'c11a_gaze', 'c11a_lull', 'c11a_flash'];
export const C11A_ALLY_FX = {
  c11a_sting: 'claw', c11a_dash: 'claw', c11a_trail: 'down', c11a_glide: 'claw', c11a_wave: 'down', c11a_jump: 'claw', c11a_splash: 'down',
  c11a_pinch: 'claw', c11a_horn: 'quake', c11a_thread: 'bolt', c11a_swoop: 'claw', c11a_gaze: 'down',
  c11b_claw: 'claw', c11b_pulse: 'bolt', c11b_fang: 'claw', c11b_sweep: 'quake', c11b_dust: 'down',
  c11p_saber: 'quake', c11p_cannon: 'quake', c11p_anchor: 'quake', c11p_throw: 'down',
};
export const C11A_SFX = {
  c11a_sting: 'hit', c11a_flash: 'sparkle', c11a_dash: 'hit', c11a_trail: 'hit', c11a_glide: 'hit', c11a_wave: 'hit', c11a_jump: 'hit', c11a_splash: 'hit',
  c11a_pinch: 'smash', c11a_shell: 'buff', c11a_horn: 'hit', c11a_lull: 'sparkle', c11a_thread: 'hit', c11a_tie: 'warn', c11a_swoop: 'hit', c11a_gaze: 'hit',
  c11b_claw: 'smash', c11b_pulse: 'hit', c11b_fang: 'blast', c11b_mend: 'sparkle', c11b_sweep: 'smash', c11b_dust: 'hit',
  c11p_saber: 'smash', c11p_cannon: 'blast', c11p_brag: 'buff', c11p_throw: 'warn', c11p_anchor: 'smash', c11p_dizzy: 'sparkle', c11a_pass: 'sparkle',
};
const isCap = (c) => c?.species === C11A_CAPTAIN;
const isStar = (c) => C11A_STARS.includes(c?.species);
const ROLE = { head: 'あたま', chest: 'むね', tail: 'しっぽ' };
const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

const CSS = `
.c11a-top { position: absolute; right: 4px; top: 4px; z-index: 4; max-width: 52%; pointer-events: none;
  padding: 3px 8px 4px; border-radius: 10px; text-align: left; line-height: 1.35; color: #eaf2ff;
  background: rgba(10, 20, 50, 0.9); border: 2px solid rgba(150, 200, 255, 0.85); box-shadow: 0 0 10px rgba(120, 180, 255, 0.4); }
.c11a-top .row { font-size: 12px; white-space: nowrap; }
.c11a-top .row b { color: #ffe070; }
.c11a-top .tick { font-size: 18px; font-weight: bold; letter-spacing: 1px; color: #ffe070; white-space: nowrap; }
.c11a-top .tick.hot { color: #ff6a5a; animation: c11a-shake 0.35s infinite; }
.c11a-top .tick.cap { color: #b8ffd0; }
.c11a-top .tick .who { font-size: 12px; color: #eaf2ff; font-weight: normal; margin-left: 4px; }
.c11a-top .tx { margin-top: 2px; font-size: 11px; color: #d8e8ff; }
.c11a-top.warn { border-color: #ff9a40; box-shadow: 0 0 14px rgba(255, 150, 64, 0.85); }
.c11a-top.warn .tx { color: #ffd060; animation: c11a-pulse 0.9s infinite; }
.c11a-top.good { border-color: #8affc8; }
.c11a-top.good .tx { color: #b0ffd8; }
.c11a-clk { display: inline-block; min-width: 1.4em; padding: 0 4px; margin: 0 1px; border-radius: 8px; font-weight: bold; font-size: 11px;
  text-align: center; background: #ffd040; color: #3a1a00; border: 1px solid rgba(0, 0, 0, 0.5); }
.c11a-clk.hot { background: #ff4a3a; color: #ffffff; animation: c11a-shake 0.35s infinite; }
.c11a-star { display: inline-block; padding: 0 4px; margin: 0 1px; border-radius: 8px; font-size: 11px; background: #d8ecff; color: #1a2450; }
.c11a-star.down { background: #4a5070; color: #c8d0e8; }
.c11a-star.warn { background: #ffe070; color: #3a2a00; animation: c11a-pulse 0.7s infinite; }
@keyframes c11a-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
@keyframes c11a-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-1px); } 75% { transform: translateX(1px); } }
.c11a-top.c11a-flow { position: relative; left: auto; right: auto; top: auto; bottom: auto; transform: none; margin: 3px auto 0; max-width: 98%; box-sizing: border-box; text-align: center; }
@media (max-aspect-ratio: 1/1) { .c11a-top { top: 2px; left: 2px; right: auto; max-width: 62%; padding: 1px 5px 2px; } .c11a-top .row { font-size: 11px; } .c11a-top .tick { font-size: 16px; } .c11a-top .tx { font-size: 10px; margin-top: 0; } }
.c11a-badge { display: inline-block; margin-left: 3px; padding: 0 4px; border-radius: 7px; font-size: 10px; font-weight: bold; line-height: 1.4;
  background: #ffd040; color: #3a1a00; vertical-align: middle; }
.c11a-badge.hot { background: #ff4a3a; color: #ffffff; animation: c11a-shake 0.35s infinite; }
`;
function addCss() {
  if (typeof document === 'undefined' || document.getElementById('c11a-css')) return;
  const s = document.createElement('style');
  s.id = 'c11a-css';
  s.textContent = CSS;
  document.head.append(s);
}

// ───── 画面の 上の まど（HTML。テストからも 見る）─────
// foes … 船長・星の pub（たおれた 星も）・allies … 味方の pub
export function c11aHtml(foes = [], allies = [], me = null) {
  const cap = foes.find(isCap);
  const nameOf = (id) => allies.find((a) => a.id === id)?.name || '';
  let cls = 'c11a-top';
  let rows = '';
  let tx = '';
  if (cap) {
    if (cap.c11Down) {
      return { html: `<div class="row"><b>${esc(CAPTAIN_SHORT)}は、にげていった！</b></div>`, cls: cls + ' good' };
    }
    const clocks = cap.clocks11 || [];
    for (const k of clocks) {
      if (k.wound && k.holder && k.holder !== 'cap') {
        const hot = k.n <= 2;
        const mine = k.holder === me;
        rows += `<div class="tick${hot ? ' hot' : ''}">チク・タク　あと${k.n}<span class="who">${mine ? 'あなたが持っている！' : `${esc(nameOf(k.holder))}が持っている`}</span></div>`;
      } else if (k.holder === 'cap') {
        const aim = k.aim ? nameOf(k.aim) : '';
        rows += `<div class="tick cap">${k.wound ? `チク・タク　あと${k.n}` : '時計'}<span class="who">${esc(CAPTAIN_SHORT)}が持っている${aim ? `（つぎは ${esc(aim)}に）` : ''}</span></div>`;
      } else rows += `<div class="row">時計は、サメのおなかの中…</div>`;
    }
    const held = clocks.filter((k) => k.wound && k.holder === me);
    if (cap.dizzy11 > 0) {
      tx = `${CAPTAIN_SHORT}が目を回している！今だ、いっせいにこうげき！`;
      cls += ' good';
    } else if (cap.anchor11 && cap.anchorAim11) {
      tx = cap.anchorAim11 === me ? '「いかりなげ」があなたに来る！「防御」でふせげる' : `「いかりなげ」が${nameOf(cap.anchorAim11)}に来る！「防御」でふせげる`;
      cls += ' warn';
    } else if (held.length) {
      tx = held[0].n <= 2 ? '「時計を投げる」で船長に投げ返そう！' : '早く投げると、投げ返される…。ぎりぎりまで、がまん！';
      cls += held[0].n <= 2 ? ' warn' : '';
    } else if (cap.freeze11) tx = 'スピカの歌で、時計の音が止まっている！';
    else tx = '時計が0になった時に持っていると、サメにかまれる！';
    return { html: `${rows}<div class="tx">${esc(tx)}</div>`, cls };
  }
  const stars = foes.filter(isStar);
  if (!stars.length) return { html: '', cls };
  const chips = stars.map((s) => {
    const name = ROLE[s.role11] || '';
    if (s.dead11) return `<span class="c11a-star ${s.revive11 === 1 ? 'warn' : 'down'}">${esc(name)}${s.revive11 ? `：よみがえるまであと${s.revive11}` : '：消えた'}</span>`;
    return `<span class="c11a-star">${esc(name)}</span>`;
  }).join('');
  rows = `<div class="row">星：${chips}</div>`;
  const roar = stars.find((s) => s.roar11 && s.roarAim11);
  if (roar) {
    tx = roar.roarAim11 === me ? '大きなかみつきが、あなたに来る！「防御」でそなえよう' : `大きなかみつきが${nameOf(roar.roarAim11)}に来る！「防御」でそなえよう`;
    cls += ' warn';
  } else if (stars.some((s) => s.dead11 && s.revive11 === 1)) {
    tx = '星が、また光りはじめた…！のこりの星を、早くたおそう！';
    cls += ' warn';
  } else if (stars.some((s) => s.dead11 && s.revive11 > 0)) {
    tx = 'たおれた星が、よみがえる前に、のこりの星もたおそう！';
    cls += ' warn';
  } else tx = '3つの星を、同じくらいにけずって、そろえてたおそう';
  return { html: `${rows}<div class="tx">${esc(tx)}</div>`, cls };
}
const portrait = () => typeof window !== 'undefined' && window.innerHeight > window.innerWidth;
function showTop(scene, html, cls) {
  if (typeof document === 'undefined' || !scene.stage) return;
  if (!scene.c11aTop) {
    addCss();
    scene.c11aTop = document.createElement('div');
    scene.c11aTop.className = cls;
    scene.c11aTop.style.display = 'none';
    scene.stage.append(scene.c11aTop);
  }
  const el = scene.c11aTop;
  const flow = portrait() && !!scene.stage.parentElement;
  if (flow) {
    if (el.previousElementSibling !== scene.stage || el.parentElement !== scene.stage.parentElement) scene.stage.after(el);
  } else if (el.parentElement !== scene.stage) scene.stage.append(el);
  const key = cls + '|' + html + '|' + flow;
  if (el.dataset.k === key) return;
  el.dataset.k = key;
  el.className = cls + (flow ? ' c11a-flow' : '');
  el.innerHTML = html;
  el.style.display = html ? '' : 'none';
}
const myId = (scene) => scene.myActor?.id ?? scene.cur ?? null;
const foesOf = (scene) => (scene.enemies?.() || []).filter((e) => isCap(e) || isStar(e));

// ───────────── え（client/battle-c9b.js の c9bSprite から）─────────────
// 船長 … 勝った あとは にげる え（コマ 2・3。たおれても 消えない）
export function c11aSprite(c, frame) {
  if (isCap(c) && c.c11Down) {
    c.dead = -1;
    return monsterCanvas(C11A_CAPTAIN, (frame ? 1 : 0) + 2);
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
// 時計の しるし（まるい 時計と 数）
function clockMark(x, cx, cy, n, base, T) {
  const hot = n <= 2;
  const dx = hot ? Math.sin(T / 40) * 0.8 : 0;
  x.globalAlpha = base;
  x.fillStyle = '#1a1020';
  x.beginPath();
  x.arc(cx + dx, cy, 7, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = hot ? '#ff5a4a' : '#ffd040';
  x.beginPath();
  x.arc(cx + dx, cy, 6, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = hot ? '#ffffff' : '#3a1a00';
  x.font = 'bold 8px sans-serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(String(n), cx + dx, cy + 0.5);
  x.textAlign = 'start';
  x.textBaseline = 'alphabetic';
}

// ───────────── たたかいの え（client/battle-c9b.js の c9bDraw の さいご）─────────────
export function c11aDraw(scene, x, m, c, px, py, w, h, base) {
  if (!isCap(c) && !isStar(c)) return;
  const T = scene.time || 0;
  const allies = scene.allies?.() || [];
  const foes = foesOf(scene).filter((e) => e.alive || isStar(e)).concat(isCap(c) && c.c11Down && !c.alive ? [c] : []);
  const top = c11aHtml(foes, allies, myId(scene));
  showTop(scene, top.html, top.cls);
  if (isCap(c)) refreshCmd(scene);
  if (!c.alive || c.c11Down) return;
  const ty = portrait() ? py + h * 0.6 : py + h + 4;
  if (isCap(c)) {
    // 船長が 持って いる 時計（頭の 上）
    const mine = (c.clocks11 || []).filter((k) => k.holder === 'cap');
    mine.forEach((k, j) => clockMark(x, px + w / 2 + (j - (mine.length - 1) / 2) * 16, Math.max(8, py - 4), k.wound ? k.n : '?', base, T));
    if (c.dizzy11 > 0) {
      for (let k = 0; k < 3; k++) {
        const a = T / 300 + k * 2.1;
        x.globalAlpha = base * 0.9;
        x.fillStyle = '#ffe070';
        x.fillRect(Math.round(px + w / 2 + Math.cos(a) * 14), Math.round(py + h * 0.12 + Math.sin(a) * 4), 2, 2);
      }
      tag(x, px + w / 2, ty, '目を回している！今だ！', base, '#0a2a1a', '#b0ffd8', 100);
    } else if (c.anchor11) tag(x, px + w / 2, ty, 'いかりなげ！ねらわれた人は防御', base, '#3a1a00', '#ffd060', 120);
    x.globalAlpha = base;
    return;
  }
  if (c.roar11) tag(x, px + w / 2, ty, 'かみつきが来る！防御', base, '#3a1a00', '#ffd060', 84);
  x.globalAlpha = base;
}

// ───────────── イベントを 見せる とき（client/battle-c9b.js の c9bPresent の さいご）─────────────
export function c11aPresent(scene, ev) {
  const g = scene.game;
  const warn = (t) => { g.audio.sfx('warn'); scene.banner(t, 'danger'); };
  const good = (t, s = 'crit') => { g.audio.sfx(s); scene.banner(t, 'combo'); };
  const who = (id) => [...(scene.c?.values?.() || [])].find((x) => x.id === id) || null;
  const ptOf = (a) => (a?.side === 'ally' ? scene.allyPt?.(a) : scene.center?.(a));
  const cap = foesOf(scene).find(isCap);
  if (ev.c11aBite && scene.fx) { const t = who(ev.c11aBite.to); if (t) playC11aBite(scene.fx, ptOf(t)); }
  if (ev.c11aBite) scene.shake?.(ev.c11aBite.cap ? 500 : 700, ev.c11aBite.cap ? 5 : 8);
  if (ev.c11aPass?.ok && scene.fx && cap) playC11aClock(scene.fx, ptOf(who(ev.c11aPass.id)), scene.center?.(cap));
  if (ev.c11aThrow && scene.fx && cap) playC11aClock(scene.fx, scene.center?.(cap), ptOf(who(ev.c11aThrow.to)));
  if (ev.c11aFang && !ev.c11aFang.guard) scene.shake?.(700, 8);
  const me = myId(scene);
  const say = [
    ev.c11aBite?.cap && [(t) => good(t, 'sparkle'), 'ガブッ！サメが船長にかみついた！今だ、こうげき！'],
    ev.c11aBite && !ev.c11aBite.cap && [warn, ev.c11aBite.guard ? 'ガブッ！サメにかまれた…（身を守って、こらえた！）' : 'ガブッ！サメにかまれた…！'],
    ev.c11aThrow && [warn, ev.c11aThrow.to === me ? `時計が、あなたに投げられた！（あと${ev.c11aThrow.n}）` : `時計が投げられた！（あと${ev.c11aThrow.n}）`],
    ev.c11aPass?.ok && [(t) => good(t, 'sparkle'), '時計を、船長に投げ返した！'],
    ev.c11aPass && !ev.c11aPass.ok && ev.c11aPass.id === me && [warn, '時計を持っていない…'],
    ev.c11aTwo && [warn, '時計が2つになった！'],
    ev.c11aAnchorUp && [warn, '！いかりなげが来る！ねらわれた人は「防御」！'],
    ev.c11aSong && [(t) => good(t, 'sparkle'), 'スピカの歌で、時計が止まった！'],
    ev.c11aRoar && [warn, '！大きなかみつきが来る！ねらわれた人は「防御」！'],
    ev.c11aWarn && [warn, '星が、また光りはじめた…！'],
    ev.c11aRevive && [warn, '星が、よみがえった！3つをそろえてたおそう！'],
    ev.c11aOut && [(t) => good(t, 'sparkle'), '星の光が消えた！のこりの星も、早く！'],
  ].find(Boolean);
  if (say && !ev.c11aDown) say[0](say[1]);
  if (ev.c11aDown) {
    scene.shake?.(500, 4);
    good(`${CAPTAIN_SHORT}は、サメに追われて、にげていった！`, 'sparkle');
  }
}

// ───────────── 仲間の まど（client/battle-c9a.js の c9aStatus から）: 時計を 持って いる 人の 名前の 横に「時計 5」─────────────
export function c11aStatus(s, a) {
  if (!s?.name) return;
  const parent = s.name.parentNode;
  let b = parent?.querySelector?.('.c11a-badge');
  if (!Number.isInteger(a?.clock11) || !a.alive) {
    b?.remove();
    return;
  }
  addCss();
  if (!b && parent) {
    b = document.createElement('span');
    b.className = 'c11a-badge';
    s.name.after(b);
  }
  if (!b) return;
  b.textContent = `時計${a.clock11}`;
  b.classList.toggle('hot', a.clock11 <= 2);
  b.title = `目ざまし時計（あと${a.clock11}）`;
}

// ───────────── コマンド（client/battle-c9b.js の c9bCmdItems・c9bCmdPick）─────────────
export function c11aCmdItems(scene, a) {
  const items = [];
  let info = '';
  if (!a || !(a.abilities || []).includes(TOKEI_NAGE)) return { items, info };
  const me = (scene.allies?.() || []).find((x) => x.id === a.id) || a;
  // コマンドの まどを 出した 時に 時計を 持って いたか（refreshCmd が 見る）
  scene.c11aShown = { id: a.id, n: Number.isInteger(me.clock11) ? me.clock11 : null };
  if (!Number.isInteger(me.clock11)) return { items, info };
  const n = me.clock11;
  items.push({ html: `<span class="dual-cmd">時計を投げる</span><span class="tag">あと${n}</span>`, value: 'c11apass', cls: 'k-dual' });
  info = n <= 1
    ? `時計は、あと${n}！今「時計を投げる」と、船長がサメにかまれる！`
    : n <= 2
      ? `時計は、あと${n}！そろそろ「時計を投げる」で、船長に投げ返そう。`
      : `時計は、あと${n}。早く投げると、投げ返されるかも…。自分の番が、もう1回来るかな？`;
  return { items, info };
}
// コマンドの まどを 開いて いる 間に 時計が とんで きた（投げられた・投げた）ら、いちばん 上の まどを 開き直す
//   （人が えらんで いる 間も、もう えらんだ 人の 行動は 進む。まどの 中の「時計を投げる」と あと ○ を 今の ようすに）
export function refreshCmd(scene) {
  const me = scene.myActor;
  const shown = scene.c11aShown;
  if (!me || !shown || shown.id !== me.id || !scene.menu || typeof scene.openCommand !== 'function') return false;
  const title = scene.cmdEl?.querySelector?.('.who')?.textContent || '';
  if (!title.includes('はどうする？')) return false;
  const n = Number.isInteger(me.clock11) ? me.clock11 : null;
  if (n === shown.n) return false;
  scene.openCommand();
  return true;
}
export function c11aCmdPick(scene, a, value) {
  if (value !== 'c11apass') return false;
  scene.send({ type: 'ability', id: TOKEI_NAGE });
  return true;
}
