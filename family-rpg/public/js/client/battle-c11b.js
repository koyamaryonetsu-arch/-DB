// 第3部 第3章 第2幕「月の都と、名前のランプ」の ランプの番人・月のむかえ オボロの がめん（client/battle-c9b.js から よぶ。サーバーがわは shared/battle-c11b.js）
// ・画面の 上の まど（PC は 右上・スマホの たては 戦いの 絵の すぐ 下）:
//   オボロ … 大きく「スピカの思い出　あと 3」（あと 1 は 赤く ゆれる）・天人の ようす・わすれの衣／わすれの光の 前ぶれ
//   番人 … ランプが 明るい／暗い（今 効く こうげき）・明かりが かわる 前ぶれ
// ・仲間の まど: わすれの じょうたいの 人の 名前の 横に「わすれ：呪文」の しるし
// ・え: 番人の ランプが 暗い（コマ 2・3）・オボロが 引いていく（コマ 2・3）・番人の 上に 明るい／暗い の しるし
// ・コマンド: いちばん 上に「よびかける」（思い出 あと ○）→ だれに よびかける？（スピカ・味方）。ゲストの スピカも えらべる
// ・音: よびかけた 時の 短い 音 c11b_call（F班の 曲。audio に cue が なければ きらきら）
import { C11B_KEEPER, C11B_OBORO, C11B_TENNIN, OBORO_SHORT, KEEPER_SHORT } from '../shared/data/monsters-c11b.js';
import { YOBIKAKE } from '../shared/data/abilities-c11b.js';
import { C11B_TRACKS_B as C11B_TRACKS, C11B_CMD_B } from '../shared/data/c11b-names-b.js';
import { monsterCanvas } from './render/monsters.js';
import { playC11bCall } from './render/battlefx-c11b.js';

export const C11B_CMD = C11B_CMD_B;
// 前ぶれの バナーを 自分で 出す（client/battle-c8r.js の C8R_OWN_TELE に まぜる）
export const C11B_OWN_TELE = [C11B_KEEPER, C11B_OBORO, C11B_TENNIN];
export const C11B_SCREEN_ANIMS = ['c11k_ring', 'c11k_light', 'c11k_dark', 'c11o_moon', 'c11o_flash', 'c11o_robe', 'c11m_glow', 'c11m_moon', 'c11m_name', 'c11m_dim', 'c11m_rain'];
export const C11B_ALLY_FX = {
  c11m_powder: 'bolt', c11m_trip: 'claw', c11m_claw: 'claw', c11m_flame: 'down', c11m_name: 'down', c11m_spear: 'claw', c11m_bump: 'quake', c11m_mist: 'down', c11m_rain: 'down',
  c11k_bash: 'quake', c11k_beam: 'bolt', c11k_ring: 'down', c11k_light: 'quake', c11k_dark: 'quake',
  c11o_whip: 'claw', c11o_moon: 'down', c11o_flash: 'bolt', c11t_sleeve: 'claw',
};
export const C11B_SFX = {
  c11m_powder: 'sparkle', c11m_glow: 'sparkle', c11m_trip: 'hit', c11m_hide: 'buff', c11m_claw: 'hit', c11m_moon: 'sleep', c11m_flame: 'fire', c11m_name: 'hit',
  c11m_spear: 'hit', c11m_scale: 'debuff', c11m_bump: 'hit', c11m_dim: 'sparkle', c11m_mist: 'ice', c11m_rain: 'ice',
  c11k_bash: 'smash', c11k_beam: 'bolt', c11k_ring: 'sparkle', c11k_light: 'blast', c11k_dark: 'dark',
  c11o_whip: 'hit', c11o_moon: 'ice', c11o_bow: 'buff', c11o_robe: 'void', c11o_flash: 'bolt', c11t_sleeve: 'hit', c11t_drop: 'heal', c11b_call: 'sparkle',
};
const isKeeper = (c) => c?.species === C11B_KEEPER;
const isOboro = (c) => c?.species === C11B_OBORO;
const isTennin = (c) => c?.species === C11B_TENNIN;
const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const KIND = { spell: '呪文', skill: '特技' };

// .b-banner.c11b-bn … 大きな 知らせ: この 幕の 戦いでは 1つずつ（前の 知らせを 消す）・はばに おさめて 折り返す（前の 幕と 同じ）
const CSS = `
.c11b-top { position: absolute; right: 4px; top: 4px; z-index: 4; max-width: 54%; pointer-events: none;
  padding: 3px 8px 4px; border-radius: 10px; text-align: left; line-height: 1.35; color: #f2f0ff;
  background: rgba(20, 16, 48, 0.9); border: 2px solid rgba(220, 210, 255, 0.85); box-shadow: 0 0 10px rgba(200, 190, 255, 0.4); }
.c11b-top .row { font-size: 12px; white-space: nowrap; }
.c11b-top .row b { color: #ffe9a0; }
.c11b-top .mem { font-size: 19px; font-weight: bold; letter-spacing: 1px; color: #ffe9a0; white-space: nowrap; }
.c11b-top .mem .n { font-size: 24px; margin-left: 4px; }
.c11b-top .mem.hot { color: #ff7a6a; animation: c11b-shake 0.35s infinite; }
.c11b-top .tx { margin-top: 2px; font-size: 11px; color: #e4e0ff; }
.c11b-top.warn { border-color: #ff9a40; box-shadow: 0 0 14px rgba(255, 150, 64, 0.85); }
.c11b-top.warn .tx { color: #ffd060; animation: c11b-pulse 0.9s infinite; }
.c11b-top.good { border-color: #8affc8; }
.c11b-top.good .tx { color: #b0ffd8; }
.c11b-top.bad { border-color: #ff6a6a; }
.c11b-lamp { display: inline-block; padding: 0 5px; margin: 0 1px; border-radius: 8px; font-size: 12px; font-weight: bold; }
.c11b-lamp.light { background: #fff2a0; color: #4a3000; }
.c11b-lamp.dark { background: #2a2450; color: #d8d0ff; border: 1px solid #8a80d0; }
.c11b-lamp.warn { animation: c11b-pulse 0.6s infinite; }
.c11b-chip { display: inline-block; padding: 0 4px; margin: 0 1px; border-radius: 8px; font-size: 11px; background: #e8e4ff; color: #2a2050; }
.c11b-chip.down { background: #4a4870; color: #d0d0e8; }
.c11b-chip.warn { background: #ffe070; color: #3a2a00; animation: c11b-pulse 0.7s infinite; }
@keyframes c11b-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
@keyframes c11b-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-1px); } 75% { transform: translateX(1px); } }
.c11b-top.c11b-flow { position: relative; left: auto; right: auto; top: auto; bottom: auto; transform: none; margin: 3px auto 0; max-width: 98%; box-sizing: border-box; text-align: center; }
@media (max-aspect-ratio: 1/1) { .c11b-top { top: 2px; left: 2px; right: auto; max-width: 62%; padding: 1px 5px 2px; } .c11b-top .row { font-size: 11px; } .c11b-top .mem { font-size: 17px; } .c11b-top .mem .n { font-size: 21px; } .c11b-top .tx { font-size: 10px; margin-top: 0; } }
.c11b-badge { display: inline-block; margin-left: 3px; padding: 0 4px; border-radius: 7px; font-size: 10px; font-weight: bold; line-height: 1.4;
  background: #c8c0ff; color: #20184a; vertical-align: middle; }
.b-banner.c11b-bn { white-space: normal; width: 94%; max-width: 94%; text-align: center; line-height: 1.25; box-sizing: border-box; }
@media (max-aspect-ratio: 1/1) { .b-banner.c11b-bn { font-size: min(var(--fs-big), 5.4vw); top: 18%; } }
`;
function addCss() {
  if (typeof document === 'undefined' || document.getElementById('c11b-css')) return;
  const s = document.createElement('style');
  s.id = 'c11b-css';
  s.textContent = CSS;
  document.head.append(s);
}

// ───── 画面の 上の まど（HTML。テストからも 見る）─────
// foes … 番人・オボロ・天人の pub（たおれた 天人も）・allies … 味方の pub
export function c11bHtml(foes = [], allies = [], me = null) {
  const ob = foes.find(isOboro);
  const kp = foes.find(isKeeper);
  const mine = allies.find((a) => a.id === me);
  let cls = 'c11b-top';
  if (ob) {
    if (ob.c11bDown) return { html: `<div class="row"><b>${esc(OBORO_SHORT)}は、引いていった！</b></div>`, cls: cls + ' good' };
    if (ob.c11bTaken) return { html: '<div class="row"><b>スピカが、つれていかれてしまった…</b></div>', cls: cls + ' bad' };
    const max = ob.forgetMax11b || 3;
    const left = Math.max(0, max - (ob.forget11b || 0));
    let rows = `<div class="mem${left <= 1 ? ' hot' : ''}">スピカの思い出　あと<span class="n">${left}</span></div>`;
    const ts = foes.filter(isTennin).filter((t) => !t.gone11b);
    if (ts.length) {
      const chips = ts.map((t) => (t.alive !== false && !t.dead ? '<span class="c11b-chip">天人</span>' : `<span class="c11b-chip ${t.back11b === 1 ? 'warn' : 'down'}">${t.back11b ? `もどるまで、あと${t.back11b}` : '消えた'}</span>`)).join('');
      rows += `<div class="row">${chips}${ob.tennin11b ? '（オボロをまもっている）' : '（今、こうげきが通る！）'}</div>`;
    }
    let tx;
    if (ob.robe11b) {
      tx = left <= 2 ? 'わすれの衣が来る！今すぐ「よびかける」で、スピカの名前をよぼう！' : 'わすれの衣が来る！「よびかける」で、スピカの名前をよぼう';
      cls += ' warn';
    } else if (ob.flash11b) {
      tx = 'わすれの光が来る！「防御」でふせごう';
      cls += ' warn';
    } else if (mine?.forgot11b) {
      tx = `${KIND[mine.forgot11b]}をわすれている…。仲間に「よびかける」でよんでもらおう`;
      cls += ' warn';
    } else if (left <= 1) {
      tx = '思い出が、あと1！だれかが「よびかける」で、スピカの名前をよぼう！';
      cls += ' warn';
    } else if (ob.tennin11b) tx = '天人をたおすと、オボロにこうげきが通る';
    else tx = '今だ！オボロにこうげき！';
    return { html: `${rows}<div class="tx">${esc(tx)}</div>`, cls };
  }
  if (kp) {
    if (kp.alive === false) return { html: '', cls };
    const dark = kp.lamp11b === 'dark';
    const chip = `<span class="c11b-lamp ${dark ? 'dark' : 'light'}${kp.lampWarn11b ? ' warn' : ''}">${dark ? '暗い' : '明るい'}</span>`;
    const rows = `<div class="row">ランプ：${chip}　${dark ? '物理が効く' : '呪文が効く'}</div>`;
    let tx;
    if (kp.lampWarn11b) {
      tx = `ランプがちらちら…次に${dark ? '明るく' : '暗く'}なる！かわる時に光の波が来る。「防御」でそなえよう`;
      cls += ' warn';
    } else tx = dark ? '暗い間は、呪文が効きにくい。戦う・物理の技でこうげき！' : '明るい間は、物理が効きにくい。呪文でこうげき！';
    return { html: `${rows}<div class="tx">${esc(tx)}</div>`, cls };
  }
  return { html: '', cls };
}
const portrait = () => typeof window !== 'undefined' && window.innerHeight > window.innerWidth;
function showTop(scene, html, cls) {
  if (typeof document === 'undefined' || !scene.stage) return;
  if (!scene.c11bTop) {
    addCss();
    scene.c11bTop = document.createElement('div');
    scene.c11bTop.className = cls;
    scene.c11bTop.style.display = 'none';
    scene.stage.append(scene.c11bTop);
  }
  const el = scene.c11bTop;
  const flow = portrait() && !!scene.stage.parentElement;
  if (flow) {
    if (el.previousElementSibling !== scene.stage || el.parentElement !== scene.stage.parentElement) scene.stage.after(el);
  } else if (el.parentElement !== scene.stage) scene.stage.append(el);
  const key = cls + '|' + html + '|' + flow;
  if (el.dataset.k === key) return;
  el.dataset.k = key;
  el.className = cls + (flow ? ' c11b-flow' : '');
  el.innerHTML = html;
  el.style.display = html ? '' : 'none';
}
const myId = (scene) => scene.myActor?.id ?? scene.cur ?? null;
const foesOf = (scene) => (scene.enemies?.() || []).filter((e) => isKeeper(e) || isOboro(e) || isTennin(e));

// ───────────── え（client/battle-c9b.js の c9bSprite から）─────────────
// 番人 … ランプが 暗い 間は コマ 2・3 ／ オボロ … 勝った あとは 引いていく え（コマ 2・3。たおれても 消えない）
export function c11bSprite(c, frame) {
  if (isOboro(c) && c.c11bDown) {
    c.dead = -1;
    return monsterCanvas(C11B_OBORO, (frame ? 1 : 0) + 2);
  }
  if (isKeeper(c) && c.alive !== false && c.lamp11b === 'dark') return monsterCanvas(C11B_KEEPER, (frame ? 1 : 0) + 2);
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
export function c11bDraw(scene, x, m, c, px, py, w, h, base) {
  if (!isKeeper(c) && !isOboro(c) && !isTennin(c)) return;
  c11bBannerOne(scene);
  const allies = scene.allies?.() || [];
  const foes = foesOf(scene).filter((e) => e.alive || isTennin(e)).concat(isOboro(c) && c.c11bDown && !c.alive ? [c] : []);
  const top = c11bHtml(foes, allies, myId(scene));
  showTop(scene, top.html, top.cls);
  if (!c.alive || c.c11bDown) return;
  const ty = portrait() ? py + h * 0.6 : py + h + 4;
  // 名前の 上の しるし（明るい／暗い・前ぶれ）
  if (isKeeper(c)) {
    const dark = c.lamp11b === 'dark';
    tag(x, px + w / 2, Math.max(6, py - 2), dark ? '暗い：物理が効く' : '明るい：呪文が効く', base, dark ? '#2a2450' : '#fff2a0', dark ? '#d8d0ff' : '#4a3000', 84);
    if (c.lampWarn11b) tag(x, px + w / 2, ty, 'ランプがちらちら！防御', base, '#3a1a00', '#ffd060', 96);
  } else if (isOboro(c)) {
    if (c.robe11b) tag(x, px + w / 2, ty, 'わすれの衣！よびかけよう', base, '#3a1a00', '#ffd060', 104);
    else if (c.flash11b) tag(x, px + w / 2, ty, 'わすれの光！防御', base, '#3a1a00', '#ffd060', 80);
    else if (c.tennin11b) tag(x, px + w / 2, ty, '天人がまもっている', base, '#20184a', '#e4e0ff', 84);
  }
  x.globalAlpha = base;
}

// ───────────── よびかけた 音（F班の 短い 曲 c11b_call。audio に cue が ない 時は きらきら）─────────────
export function playCallCue(audio) {
  if (!audio) return;
  if (typeof audio.cue === 'function') return audio.cue(C11B_TRACKS.call);
  if (typeof audio.playCue === 'function') return audio.playCue(C11B_TRACKS.call);
  audio.sfx?.('sparkle');
}

// ───────────── イベントを 見せる とき（client/battle-c9b.js の c9bPresent の さいご）─────────────
export function c11bBannerOne(scene) {
  if (!scene || scene._c11bBn || typeof scene.banner !== 'function') return;
  const orig = scene.banner.bind(scene);
  scene._c11bBn = true;
  scene.banner = (text, cls = '') => {
    scene.stage?.querySelectorAll?.('.b-banner')?.forEach((x) => x.remove());
    addCss();
    return orig(text, `${cls} c11b-bn`);
  };
}
export function c11bPresent(scene, ev) {
  if (foesOf(scene).length) c11bBannerOne(scene);
  const g = scene.game;
  const warn = (t) => { g?.audio?.sfx('warn'); scene.banner(t, 'danger'); };
  const good = (t, s = 'crit') => { g?.audio?.sfx(s); scene.banner(t, 'combo'); };
  const who = (id) => [...(scene.c?.values?.() || [])].find((x) => x.id === id) || null;
  const ptOf = (a) => (a?.side === 'ally' ? scene.allyPt?.(a) : scene.center?.(a));
  const me = myId(scene);
  if (ev.c11bCall?.ok) {
    playCallCue(g?.audio);
    if (scene.fx) playC11bCall(scene.fx, ptOf(who(ev.c11bCall.id)), ev.c11bCall.to === 'spica' ? null : ptOf(who(ev.c11bCall.to)));
  }
  if (ev.c11bSwitch) scene.shake?.(500, 5);
  if (ev.c11bTaken) scene.shake?.(600, 4);
  const say = [
    ev.c11bTaken && [warn, 'スピカが、つれていかれてしまった…'],
    ev.c11bCall?.ok && ev.c11bCall.to === 'spica' && [(t) => good(t, 'sparkle'), `スピカの思い出が、もどった！（あと${ev.c11bCall.left}）`],
    ev.c11bCall?.ok && ev.c11bCall.cured && [(t) => good(t, 'sparkle'), 'わすれていた技を、思い出した！'],
    ev.c11bRobe && [warn, `わすれの衣が、スピカにかかった…（思い出、あと${ev.c11bRobe.left}）`],
    ev.c11bRobeUp && [warn, ev.c11bRobeUp.again ? '！もう一度、わすれの衣が来る！すぐに「よびかける」！' : '！わすれの衣が来る！「よびかける」でスピカの名前をよぼう！'],
    ev.c11bFlash && [warn, ev.c11bFlash.hit.includes(me) ? 'わすれの光！技をわすれてしまった…' : 'わすれの光！'],
    ev.c11bFlashUp && [warn, '！わすれの光が来る！「防御」でふせごう！'],
    ev.c11bSong?.cured?.length && [(t) => good(t, 'sparkle'), 'スピカの歌で、みんな思い出した！'],
    ev.c11bBack && [warn, '天人が、もどってきた！'],
    ev.c11bOut && !ev.c11bOut.left && [(t) => good(t, 'sparkle'), '天人が消えた！今だ、オボロにこうげき！'],
    ev.c11bWarn && [warn, ev.c11bWarn.next === 'dark' ? '！ランプがちらちら…暗くなる！「防御」！' : '！ランプがちらちら…明るくなる！「防御」！'],
    ev.c11bSwitch && [warn, ev.c11bSwitch.phase === 'dark' ? 'ランプが暗くなった！物理でこうげき！' : 'ランプが明るくなった！呪文でこうげき！'],
    ev.c11bName && [(t) => good(t, 'sparkle'), 'スピカが名前をよんで、仲間が生き返った！'],
  ].find(Boolean);
  if (say && !ev.c11bDown) say[0](say[1]);
  if (ev.c11bDown) {
    scene.shake?.(500, 4);
    good(`${OBORO_SHORT}は、雲の車で、引いていった！`, 'sparkle');
  }
}

// ───────────── 仲間の まど（client/battle-c9a.js の c9aStatus から）: わすれて いる 人の 名前の 横に「わすれ：呪文」─────────────
export function c11bStatus(s, a) {
  if (!s?.name) return;
  const parent = s.name.parentNode;
  let b = parent?.querySelector?.('.c11b-badge');
  if (!a?.forgot11b || !a.alive) {
    b?.remove();
    return;
  }
  addCss();
  if (!b && parent) {
    b = document.createElement('span');
    b.className = 'c11b-badge';
    s.name.after(b);
  }
  if (!b) return;
  b.textContent = `わすれ：${KIND[a.forgot11b] || ''}`;
  b.title = `${KIND[a.forgot11b] || ''}をわすれている（あと${a.forgotLeft11b ?? '?'}回）`;
}

// ───────────── コマンド（client/battle-c9b.js の c9bCmdItems・c9bCmdPick）─────────────
const oboroPub = (scene) => (scene.enemies?.() || []).find(isOboro) || null;
export function c11bCmdItems(scene, a) {
  const items = [];
  let info = '';
  if (!a || !(a.abilities || []).includes(YOBIKAKE)) return { items, info };
  const ob = oboroPub(scene);
  const left = ob ? Math.max(0, (ob.forgetMax11b || 3) - (ob.forget11b || 0)) : null;
  items.push({ html: `<span class="dual-cmd">よびかける</span>${left !== null ? `<span class="tag">思い出・あと${left}</span>` : ''}`, value: C11B_CMD, cls: 'k-dual' });
  const me = (scene.allies?.() || []).find((x) => x.id === a.id) || a;
  const lost = (scene.allies?.() || []).filter((x) => x.alive && x.id !== a.id && x.forgot11b);
  if (me.forgot11b) info = `${KIND[me.forgot11b]}をわすれている…（あと${me.forgotLeft11b ?? '?'}回）。ほかの人に「よびかける」でよんでもらうと、すぐ思い出す。`;
  else if (left !== null && left <= 1) info = `スピカの思い出が、あと${left}！「よびかける」で、スピカの名前をよぼう！`;
  else if (ob?.robe11b) info = 'わすれの衣が来る！「よびかける」で、スピカの名前をよぼう。';
  else if (lost.length) info = `${lost.map((x) => x.name).join('・')}が技をわすれている。「よびかける」でよぶと、すぐ思い出す。`;
  else if (ob?.flash11b) info = 'わすれの光が来る！「防御」でふせごう。';
  return { items, info };
}
// よびかける 相手を えらぶ まど（スピカ ＝ ゲストも えらべる・味方は 自分 いがい。味方の 絵を タップしても えらべる）
export function c11bCmdPick(scene, a, value) {
  if (value !== C11B_CMD) return false;
  const ob = oboroPub(scene);
  const left = ob ? Math.max(0, (ob.forgetMax11b || 3) - (ob.forget11b || 0)) : 3;
  const send = (choice) => scene.send({ type: 'ability', id: YOBIKAKE, choice });
  const list = [{ label: `スピカ（思い出・あと${left}）`, value: 'spica' }];
  for (const x of scene.allies?.() || []) {
    if (!x.alive || x.id === a.id) continue;
    list.push({ label: `${x.name}${x.forgot11b ? `（${KIND[x.forgot11b]}をわすれている）` : ''}`, value: x.id });
  }
  scene.showMenu(list, (it) => send(it.value), () => scene.openCommand(), 'だれによびかける？');
  scene.targeting = { side: 'ally', done: (id) => (id === a.id ? null : send(id)), dead: false };
  return true;
}
void KEEPER_SHORT;
