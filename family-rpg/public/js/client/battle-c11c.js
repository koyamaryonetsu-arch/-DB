// 第3部 第3章 第3幕「はかりの回ろうと、ふたつの光」の バラバラン3号・近衛の隊長エースの がめん（client/battle-c9b.js から よぶ。サーバーがわは shared/battle-c11c.js）
// ・画面の 上の まど（PC は 右上・スマホの たては 戦いの 絵の すぐ 下。かさならない）:
//   隊長 … 場の カードを 大きく ならべる（うら向き・おもての マーク・次に めくる 1まい・食べられた しるし・めくった カード・ほうき星の ねらい）
//   メカ … あたま・うで・あし の ようす（こわれた・直す 前ぶれ・ロケットパンチの ねらい）
// ・仲間の まど: ねらわれて いる 人の 名前の 横に「ねらわれ」の しるし
// ・え: 隊長が カードに もどって ちらばる（コマ 2・3）
// ・コマンド: いちばん 上に「アルゴルにたのむ」（食べられる・おなかいっぱい）→ どのカード？（1回で 決定）
// ・えんしゅつ: アルゴルの 絵（今 ある 少年の 絵 c10c_algol）が カードの 上に 出て、ぱくっと 食べる
import { C11C_HEAD, C11C_ARM, C11C_LEG, C11C_ACE, C11C_GUARD, ACE_SHORT, MECHA_NAME } from '../shared/data/monsters-c11c.js';
import { TANOMU } from '../shared/data/abilities-c11c.js';
import { C11C_CMD_B } from '../shared/data/c11c-names-b.js';
import { monsterCanvas } from './render/monsters.js';

export const C11C_CMD = C11C_CMD_B;
// 前ぶれの バナーを 自分で 出す（client/battle-c8r.js の C8R_OWN_TELE に まぜる）
export const C11C_OWN_TELE = [C11C_HEAD, C11C_ARM, C11C_LEG, C11C_ACE, C11C_GUARD];
export const C11C_SCREEN_ANIMS = ['c11h_horn', 'c11l_stomp', 'c11e_comet', 'c11e_star', 'c11e_moon', 'c11e_sun', 'c11v_moon', 'c11v_tail', 'c11v_fence', 'c11v_flit'];
export const C11C_ALLY_FX = {
  c11v_spear: 'claw', c11v_peck: 'claw', c11v_dash: 'claw', c11v_star: 'bolt', c11v_tail: 'down', c11v_beam: 'bolt', c11v_dust: 'bolt',
  c11h_beam: 'bolt', c11h_horn: 'quake', c11r_punch: 'quake', c11r_grab: 'quake', c11r_rocket: 'quake', c11l_stomp: 'quake', c11l_kick: 'claw',
  c11e_comet: 'quake', c11e_star: 'down', c11e_moon: 'down', c11g_spear: 'claw',
};
export const C11C_SFX = {
  c11v_spear: 'hit', c11v_moon: 'sleep', c11v_star: 'sparkle', c11v_peck: 'hit', c11v_weigh: 'debuff', c11v_dash: 'hit', c11v_tail: 'fire', c11v_beam: 'bolt',
  c11v_fence: 'debuff', c11v_sun: 'heal', c11v_dust: 'sparkle', c11v_flit: 'sparkle',
  c11h_beam: 'bolt', c11h_horn: 'blast', c11h_fix: 'buff', c11r_punch: 'smash', c11r_grab: 'smash', c11r_rocket: 'blast', c11l_stomp: 'smash', c11l_kick: 'hit',
  c11e_lay: 'sparkle', c11e_comet: 'blast', c11e_star: 'sparkle', c11e_moon: 'sleep', c11e_sun: 'heal', c11g_spear: 'hit', c11g_salute: 'buff', c11c_eat: 'void',
};
const isPart = (c) => [C11C_HEAD, C11C_ARM, C11C_LEG].includes(c?.species);
const isAce = (c) => c?.species === C11C_ACE;
const isGuard = (c) => c?.species === C11C_GUARD;
const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
export const SUIT_NAME = { comet: 'ほうき星', star: '星', moon: '月', sun: '太陽' };
const SUIT_COL = { comet: '#e04a6a', star: '#4a8ae0', moon: '#d8a820', sun: '#f08a20' };
const ROLE = { head: 'あたま', arm: 'うで', leg: 'あし' };
const ROLE_OF = { [C11C_HEAD]: 'head', [C11C_ARM]: 'arm', [C11C_LEG]: 'leg' };

// マークの え（SVG。月・星・ほうき星・太陽）
export function suitSvg(s, px = 26) {
  const c = SUIT_COL[s] || '#888';
  const body = {
    moon: `<circle cx="16" cy="16" r="11" fill="${c}"/><circle cx="21" cy="12" r="9.5" fill="#fbf8ee"/>`,
    star: `<polygon points="16,3 19.5,12 29,12.5 21.5,18.5 24,28 16,22.5 8,28 10.5,18.5 3,12.5 12.5,12" fill="${c}"/>`,
    comet: `<polygon points="2,4 17,13 13,18" fill="#f4c0cc"/><circle cx="19" cy="19" r="8" fill="${c}"/>`,
    sun: `<circle cx="16" cy="16" r="7" fill="${c}"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<polygon points="16,1 18,7 14,7" fill="${c}" transform="rotate(${a} 16 16)"/>`).join('')}`,
  }[s] || '';
  return `<svg viewBox="0 0 32 32" width="${px}" height="${px}" aria-hidden="true">${body}</svg>`;
}

const CSS = `
.c11c-top { position: absolute; right: 4px; top: 4px; z-index: 4; max-width: 60%; pointer-events: none;
  padding: 3px 8px 5px; border-radius: 10px; text-align: left; line-height: 1.35; color: #f2f0ff;
  background: rgba(20, 18, 48, 0.92); border: 2px solid rgba(232, 200, 120, 0.9); box-shadow: 0 0 10px rgba(232, 200, 120, 0.4); }
.c11c-top .row { font-size: 12px; white-space: nowrap; }
.c11c-top .row b { color: #ffe9a0; }
.c11c-top .tx { margin-top: 3px; font-size: 11px; color: #e4e0ff; white-space: normal; }
.c11c-top.warn { border-color: #ff9a40; box-shadow: 0 0 14px rgba(255, 150, 64, 0.85); }
.c11c-top.warn .tx { color: #ffd060; }
.c11c-top.good { border-color: #8affc8; }
.c11c-cards { display: flex; gap: 6px; justify-content: center; margin: 3px 0 1px; }
.c11c-card { position: relative; width: 52px; height: 70px; border-radius: 6px; box-sizing: border-box; display: flex; flex-direction: column;
  align-items: center; justify-content: center; font-size: 11px; font-weight: bold; color: #2a2050; background: #fbf8ee; border: 2px solid #c8b070; }
.c11c-card.back { background: repeating-linear-gradient(45deg, #2e3a88 0 5px, #24306e 5px 10px); border-color: #e0c070; color: #ffe9a0; }
.c11c-card.back .q { font-size: 22px; line-height: 1; }
.c11c-card .nm { margin-top: 1px; font-size: 10px; line-height: 1.1; }
.c11c-card .aim { font-size: 9px; color: #c83a48; line-height: 1.1; max-width: 50px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.c11c-card.used { opacity: 0.35; transform: scale(0.9); }
.c11c-card.eaten { background: #3a3060; border-color: #8a80d0; color: #d8d0ff; opacity: 0.85; }
.c11c-card.eaten .bite { font-size: 12px; }
.c11c-card.next { border-color: #ff9a40; box-shadow: 0 0 8px rgba(255, 154, 64, 0.95); transform: translateY(-3px); }
.c11c-card.next::after { content: '次'; position: absolute; top: -9px; left: 50%; transform: translateX(-50%); padding: 0 5px; border-radius: 6px;
  font-size: 10px; background: #ff9a40; color: #2a1000; }
.c11c-card.danger { border-color: #e04a6a; }
.c11c-chip { display: inline-block; padding: 0 5px; margin: 0 2px; border-radius: 8px; font-size: 11px; background: #e8e4ff; color: #2a2050; }
.c11c-chip.down { background: #4a4870; color: #d0d0e8; text-decoration: line-through; }
.c11c-chip.warn { background: #ffe070; color: #3a2a00; animation: c11c-pulse 0.7s infinite; }
@keyframes c11c-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
.c11c-top.c11c-flow { position: relative; left: auto; right: auto; top: auto; bottom: auto; transform: none; margin: 3px auto 0; max-width: 98%; box-sizing: border-box; text-align: center; }
@media (max-aspect-ratio: 1/1) { .c11c-top { max-width: 70%; padding: 1px 5px 3px; } .c11c-top .row { font-size: 11px; } .c11c-top .tx { font-size: 10px; margin-top: 1px; }
  .c11c-card { width: 56px; height: 72px; } }
.c11c-badge { display: inline-block; margin-left: 3px; padding: 0 4px; border-radius: 7px; font-size: 10px; font-weight: bold; line-height: 1.4;
  background: #ff8a6a; color: #2a0a00; vertical-align: middle; }
.c11c-eat { position: fixed; z-index: 60; pointer-events: none; animation: c11c-eat 1.8s ease-out forwards; filter: drop-shadow(0 0 6px rgba(200, 190, 255, 0.95)); }
.c11c-eat canvas { width: 100%; height: 100%; image-rendering: pixelated; }
@keyframes c11c-eat { 0% { opacity: 0; transform: translateY(-30px) scale(0.6); } 15% { opacity: 1; transform: translateY(0) scale(1); }
  40% { transform: translateY(4px) scale(1.12, 0.9); } 55% { transform: translateY(0) scale(1); } 80% { opacity: 1; } 100% { opacity: 0; transform: translateY(-14px) scale(0.9); } }
.c11c-chomp { position: fixed; z-index: 61; pointer-events: none; font-weight: bold; font-size: 16px; color: #ffe9a0; text-shadow: 0 0 4px #000;
  animation: c11c-chomp 1.1s ease-out forwards; }
@keyframes c11c-chomp { 0% { opacity: 0; transform: scale(0.5); } 40% { opacity: 1; transform: scale(1.3); } 100% { opacity: 0; transform: scale(1) translateY(-16px); } }
.b-banner.c11c-bn { white-space: normal; width: 94%; max-width: 94%; text-align: center; line-height: 1.25; box-sizing: border-box; }
@media (max-aspect-ratio: 1/1) { .b-banner.c11c-bn { font-size: min(var(--fs-big), 5.4vw); top: 18%; } }
`;
function addCss() {
  if (typeof document === 'undefined' || document.getElementById('c11c-css')) return;
  const s = document.createElement('style');
  s.id = 'c11c-css';
  s.textContent = CSS;
  document.head.append(s);
}

// ───── カード 1まいの HTML ─────
function cardHtml(k, nameOf) {
  const cls = ['c11c-card'];
  let inner;
  if (k.eaten) {
    cls.push('eaten');
    inner = `${k.s ? suitSvg(k.s, 22) : ''}<span class="bite">ぱくっ</span><span class="nm">食べた</span>`;
  } else if (!k.up) {
    cls.push('back');
    inner = '<span class="q">？</span><span class="nm">うら向き</span>';
  } else {
    if (k.s === 'comet' || k.s === 'moon') cls.push('danger');
    inner = `${suitSvg(k.s, 28)}<span class="nm">${esc(SUIT_NAME[k.s] || '')}</span>${k.s === 'comet' && k.aim ? `<span class="aim">→${esc(nameOf(k.aim))}</span>` : ''}`;
  }
  if (k.used) cls.push('used');
  if (k.next) cls.push('next');
  return `<div class="${cls.join(' ')}" data-no="${k.no}">${inner}</div>`;
}

// ───── 画面の 上の まど（HTML。テストからも 見る）─────
// foes … メカの 体・隊長・へいたいの pub（こわれた 体・たおれた へいたいも）・allies … 味方の pub
export function c11cHtml(foes = [], allies = [], me = null) {
  const ace = foes.find(isAce);
  const nameOf = (id) => allies.find((a) => a.id === id)?.name || '？';
  let cls = 'c11c-top';
  if (ace) {
    if (ace.c11cDown) return { html: `<div class="row"><b>${esc(ACE_SHORT)}は、カードにもどって、ちらばった！</b></div>`, cls: cls + ' good' };
    const cards = ace.cards11c || [];
    const left = cards.filter((k) => !k.used && !k.eaten);
    let rows = `<div class="row"><b>隊長のカード</b>${left.length ? `　のこり${left.length}まい` : '　（次は、新しくならべる）'}${ace.eatOk11c ? '　アルゴル：食べられる' : left.length ? '　アルゴル：おなかいっぱい' : ''}</div>`;
    if (cards.length) rows += `<div class="c11c-cards">${cards.map((k) => cardHtml(k, nameOf)).join('')}</div>`;
    const gs = foes.filter(isGuard).filter((g) => !g.gone11c);
    if (gs.length) {
      const chips = gs.map((g) => (g.alive !== false ? '<span class="c11c-chip">へいたい</span>' : `<span class="c11c-chip ${g.back11c === 1 ? 'warn' : 'down'}">${g.back11c ? `もどるまで、あと${g.back11c}` : 'カード'}</span>`)).join('');
      rows += `<div class="row">${chips}${ace.guards11c ? '（カードが1まい多い）' : ''}</div>`;
    }
    const nx = left[0];
    const hidden = left.filter((k) => !k.up).length;
    let tx;
    if (!left.length) tx = '隊長が、次のカードをならべるぞ。';
    else if (nx?.up && nx.s === 'comet' && nx.aim === me) { tx = `次は、ほうき星！ねらいは、あなた！「防御」か「アルゴルにたのむ」！`; cls += ' warn'; }
    else if (ace.eatOk11c && left.some((k) => k.up && (k.s === 'comet' || k.s === 'moon'))) { tx = 'こわいカードが見える！「アルゴルにたのむ」で、食べてもらおう！'; cls += ' warn'; }
    else if (hidden && ace.eatOk11c) tx = 'うら向きのカードは、スピカの「てらす」で見える。';
    else if (nx?.up && nx.s === 'moon') { tx = '次は、月のカード。「防御」していると、ねむらない！'; cls += ' warn'; }
    else if (nx?.up && nx.s === 'star') tx = '次は、星のカード。みんなにダメージ。「防御」でへらせる。';
    else if (ace.guards11c) tx = 'へいたいは、1体ずつねらってたおそう。';
    else tx = '今だ！隊長にこうげき！';
    return { html: `${rows}<div class="tx">${esc(tx)}</div>`, cls };
  }
  const parts = foes.filter(isPart);
  if (parts.length) {
    const up = parts.filter((p) => p.alive !== false);
    if (!up.length) return { html: `<div class="row"><b>${esc(MECHA_NAME)}は、ばらばらになった！</b></div>`, cls: cls + ' good' };
    const order = ['head', 'arm', 'leg'];
    const byRole = Object.fromEntries(parts.map((p) => [p.role11c || ROLE_OF[p.species], p]));
    const head = byRole.head;
    const arm = byRole.arm;
    const chips = order.filter((r) => byRole[r]).map((r) => {
      const p = byRole[r];
      const down = p.alive === false;
      const warn = !down && ((r === 'head' && p.fix11c) || (r === 'arm' && p.rocket11c));
      return `<span class="c11c-chip${down ? ' down' : warn ? ' warn' : ''}">${ROLE[r]}${r === 'head' && !down ? '（かたい）' : ''}</span>`;
    }).join('');
    let tx;
    if (arm && arm.alive !== false && arm.rocket11c) {
      tx = arm.rocket11c === me ? 'うでがぐるぐる…ロケットパンチのねらいは、あなた！「防御」！' : `うでがぐるぐる…ロケットパンチのねらいは${nameOf(arm.rocket11c)}！`;
      cls += ' warn';
    } else if (head && head.alive !== false && head.fix11c) {
      tx = 'あたまが、こわれた所をなおそうとしている！あたまをこわせば、なおせない！';
      cls += ' warn';
    } else if (head && head.alive !== false) tx = 'こわした所のわざは出なくなる。あたまは、こわれた所をなおしてしまう（かたい）。';
    else tx = 'あたまをこわした！もう、なおせない！のこりもこわそう！';
    return { html: `<div class="row"><b>${esc(MECHA_NAME)}</b>　${chips}</div><div class="tx">${esc(tx)}</div>`, cls };
  }
  return { html: '', cls };
}
const portrait = () => typeof window !== 'undefined' && window.innerHeight > window.innerWidth;
function showTop(scene, html, cls) {
  if (typeof document === 'undefined' || !scene.stage) return;
  if (!scene.c11cTop) {
    addCss();
    scene.c11cTop = document.createElement('div');
    scene.c11cTop.className = cls;
    scene.c11cTop.style.display = 'none';
    scene.stage.append(scene.c11cTop);
  }
  const el = scene.c11cTop;
  const flow = portrait() && !!scene.stage.parentElement;
  if (flow) {
    if (el.previousElementSibling !== scene.stage || el.parentElement !== scene.stage.parentElement) scene.stage.after(el);
  } else if (el.parentElement !== scene.stage) scene.stage.append(el);
  const key = cls + '|' + html + '|' + flow;
  if (el.dataset.k === key) return;
  el.dataset.k = key;
  el.className = cls + (flow ? ' c11c-flow' : '');
  el.innerHTML = html;
  el.style.display = html ? '' : 'none';
}
const myId = (scene) => scene.myActor?.id ?? scene.cur ?? null;
const foesOf = (scene) => (scene.enemies?.() || []).filter((e) => isPart(e) || isAce(e) || isGuard(e));

// ───────────── え（client/battle-c9b.js の c9bSprite から）─────────────
// 隊長 … 勝った あとは カードに もどって ちらばる え（コマ 2・3。たおれても 消えない）
export function c11cSprite(c, frame) {
  if (isAce(c) && c.c11cDown) {
    c.dead = -1;
    return monsterCanvas(C11C_ACE, (frame ? 1 : 0) + 2);
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
export function c11cDraw(scene, x, m, c, px, py, w, h, base) {
  if (!isPart(c) && !isAce(c) && !isGuard(c)) return;
  c11cBannerOne(scene);
  const allies = scene.allies?.() || [];
  const foes = foesOf(scene).concat(isAce(c) && c.c11cDown && !c.alive ? [c] : []).filter((e, i, a) => a.indexOf(e) === i);
  const top = c11cHtml(foes, allies, myId(scene));
  showTop(scene, top.html, top.cls);
  if (isAce(c)) refreshCmd(scene, c);
  if (!c.alive || c.c11cDown) return;
  const ty = portrait() ? py + h * 0.6 : py + h + 4;
  if (isPart(c)) {
    if (c.role11c === 'head') tag(x, px + w / 2, Math.max(6, py - 2), c.fix11c ? 'なおす！' : 'かたい', base, c.fix11c ? '#3a1a00' : '#2a2a40', c.fix11c ? '#ffd060' : '#e4e0ff', 40);
    if (c.role11c === 'arm' && c.rocket11c) tag(x, px + w / 2, ty, 'ぐるぐる…防御！', base, '#3a1a00', '#ffd060', 70);
  } else if (isAce(c)) {
    const nx = (c.cards11c || []).find((k) => !k.used && !k.eaten);
    if (nx?.up && (nx.s === 'comet' || nx.s === 'moon')) tag(x, px + w / 2, ty, `次は${SUIT_NAME[nx.s]}！`, base, '#3a1a00', '#ffd060', 64);
  }
  x.globalAlpha = base;
}

// ───────────── アルゴルが カードを 食べる えんしゅつ（カードの まどの 上。アルゴルの 絵 c10c_algol）─────────────
export function playEatFx(scene, no) {
  if (typeof document === 'undefined') return false;
  const card = scene?.c11cTop?.querySelector?.(`.c11c-card[data-no="${no}"]`);
  const r = card?.getBoundingClientRect?.();
  if (!r) return false;
  addCss();
  const box = document.createElement('div');
  box.className = 'c11c-eat';
  const hgt = Math.max(96, r.height * 1.7);
  const wd = hgt * (192 / 224);
  Object.assign(box.style, { left: `${Math.round(r.left + r.width / 2 - wd / 2)}px`, top: `${Math.round(r.top - hgt * 0.35)}px`, width: `${Math.round(wd)}px`, height: `${Math.round(hgt)}px` });
  try {
    const cv = monsterCanvas('c10c_algol', 0);
    if (cv) {
      const c2 = document.createElement('canvas');
      c2.width = cv.width;
      c2.height = cv.height;
      c2.getContext('2d')?.drawImage(cv, 0, 0);
      box.append(c2);
    }
  } catch { /* え が ない 時は 文字だけ */ }
  const chomp = document.createElement('div');
  chomp.className = 'c11c-chomp';
  chomp.textContent = 'ぱくっ！';
  Object.assign(chomp.style, { left: `${Math.round(r.left + r.width / 2 - 24)}px`, top: `${Math.round(r.top + r.height * 0.3)}px` });
  document.body.append(box, chomp);
  setTimeout(() => { box.remove(); chomp.remove(); }, 1900);
  return true;
}

// ───────────── イベントを 見せる とき（client/battle-c9b.js の c9bPresent の さいご）─────────────
export function c11cBannerOne(scene) {
  if (!scene || scene._c11cBn || typeof scene.banner !== 'function') return;
  const orig = scene.banner.bind(scene);
  scene._c11cBn = true;
  scene.banner = (text, cls = '') => {
    scene.stage?.querySelectorAll?.('.b-banner')?.forEach((x) => x.remove());
    addCss();
    return orig(text, `${cls} c11c-bn`);
  };
}
// カードを めくる・ならべる 音（効果音の 道。戦いの 曲〈F班の c11c_ace〉は 止めない。tone が ない 時は cursor）
export function playCardSound(audio, n = 1) {
  if (!audio) return;
  for (let i = 0; i < n; i++) {
    if (typeof audio.tone === 'function') {
      audio.tone(1320, 0.03, { type: 'triangle', vol: 0.06, delay: i * 0.12 });
      audio.tone(990, 0.05, { type: 'triangle', vol: 0.05, delay: i * 0.12 + 0.035 });
    } else audio.sfx?.('cursor');
  }
}
export function c11cPresent(scene, ev) {
  if (foesOf(scene).length) c11cBannerOne(scene);
  const g = scene.game;
  const warn = (t) => { g?.audio?.sfx('warn'); scene.banner(t, 'danger'); };
  const good = (t, s = 'crit') => { g?.audio?.sfx(s); scene.banner(t, 'combo'); };
  const me = myId(scene);
  if (ev.c11cEat?.ok) {
    g?.audio?.sfx('void');
    // カードの まどを 先に 新しく しない（食べる 前の カードの 場所で 見せる）
    playEatFx(scene, ev.c11cEat.no);
  }
  if (ev.c11cFlip) playCardSound(g?.audio, 1);
  if (ev.c11cLay) playCardSound(g?.audio, Math.min(4, ev.c11cLay.n || 3));
  if (ev.c11cFlip?.suit === 'comet' || ev.c11cRocket) scene.shake?.(500, 5);
  if (ev.c11cMechaDown || ev.c11cDown) scene.shake?.(500, 4);
  const say = [
    ev.c11cEat?.ok && [(t) => good(t, 'sparkle'), `アルゴルが、${SUIT_NAME[ev.c11cEat.suit]}のカードを食べた！`],
    ev.c11cEat && !ev.c11cEat.ok && ev.c11cEat.why === 'full' && [warn, 'アルゴルは、おなかいっぱい…（次のならびまで、まって）'],
    ev.c11cFlip && [ev.c11cFlip.suit === 'sun' ? warn : warn, `${SUIT_NAME[ev.c11cFlip.suit]}のカード！${ev.c11cFlip.suit === 'comet' && ev.c11cFlip.to === me ? '（あなたに！）' : ''}`],
    ev.c11cLay && [warn, ev.c11cLay.up ? `カードが${ev.c11cLay.n}まい、ならんだ！（見えている）` : `カードが${ev.c11cLay.n}まい、ならんだ！（うら向き）`],
    ev.c11cBack && [warn, 'へいたいが、もどってきた！'],
    ev.c11cOut && !ev.c11cOut.left && [(t) => good(t, 'sparkle'), 'へいたいがいない！カードが1まいへる！'],
    ev.c11cMechaDown && [(t) => good(t, 'sparkle'), `${MECHA_NAME}は、ばらばらになった！`],
    ev.c11cBreak && [(t) => good(t, 'sparkle'), `${ROLE[ev.c11cBreak.role]}をこわした！`],
    ev.c11cFix && [warn, 'こわれた所が、なおってしまった！'],
    ev.c11cFixUp && [warn, '！あたまが、こわれた所をなおそうとしている！'],
    ev.c11cRocketUp && [warn, ev.c11cRocketUp.aim === me ? '！ロケットパンチのねらいは、あなた！「防御」！' : '！うでがぐるぐる回りはじめた！'],
    ev.c11cRocket && [warn, ev.c11cRocket.guard ? 'ロケットパンチ！…身を守って、こらえた！' : 'ロケットパンチ！'],
    ev.c11cTwin && [(t) => good(t, 'sparkle'), 'ふたりの光！みんなのHPが回復した！'],
  ].find(Boolean);
  if (say && !ev.c11cDown) say[0](say[1]);
  if (ev.c11cDown) good(`${ACE_SHORT}は、カードにもどって、ちらばった！`, 'sparkle');
}

// ───────────── 仲間の まど（client/battle-c9a.js の c9aStatus から）: ねらわれて いる 人の 名前の 横に「ねらわれ」─────────────
export function c11cStatus(s, a) {
  if (!s?.name) return;
  const parent = s.name.parentNode;
  let b = parent?.querySelector?.('.c11c-badge');
  if (!a?.aimed11c || !a.alive) {
    b?.remove();
    return;
  }
  addCss();
  if (!b && parent) {
    b = document.createElement('span');
    b.className = 'c11c-badge';
    s.name.after(b);
  }
  if (!b) return;
  b.textContent = a.aimed11c === 2 ? 'ねらわれ！' : 'ねらわれ';
  b.title = 'ほうき星のカードか、ロケットパンチに、ねらわれている';
}

// ───────────── コマンド（client/battle-c9b.js の c9bCmdItems・c9bCmdPick）─────────────
const acePub = (scene) => (scene.enemies?.() || []).find(isAce) || null;
const cardsKey = (ace) => JSON.stringify((ace?.cards11c || []).map((k) => [k.s, k.eaten, k.used])) + (ace?.eatOk11c ? 1 : 0);
export function c11cCmdItems(scene, a) {
  const items = [];
  let info = '';
  if (!a || !(a.abilities || []).includes(TANOMU)) return { items, info };
  const ace = acePub(scene);
  const left = (ace?.cards11c || []).filter((k) => !k.used && !k.eaten);
  const tagTx = !left.length ? 'カードなし' : ace?.eatOk11c ? '食べられる' : 'おなかいっぱい';
  items.push({ html: `<span class="dual-cmd">アルゴルにたのむ</span><span class="tag">${tagTx}</span>`, value: C11C_CMD, cls: 'k-dual' });
  scene.c11cShown = { id: a.id, key: cardsKey(ace) };
  const nx = left[0];
  if (ace?.eatOk11c && left.some((k) => k.up && k.s === 'comet')) info = 'ほうき星のカードが見える！「アルゴルにたのむ」で、食べてもらおう。';
  else if (ace?.eatOk11c && left.some((k) => k.up && k.s === 'moon')) info = '月のカードが見える。食べてもらうか、「防御」でふせごう。';
  else if (ace?.eatOk11c && left.some((k) => !k.up)) info = 'うら向きのカードは、スピカの「てらす」で見える。';
  else if (nx?.up && nx.s === 'comet' && nx.aim === a.id) info = '次は、あなたにほうき星！「防御」で身を守ろう。';
  return { items, info };
}
// コマンドの まどを 開いて いる 間に カードが かわったら（てらした・めくった・食べた）、いちばん 上の まどを 開き直す
export function refreshCmd(scene, ace) {
  const me = scene.myActor;
  const shown = scene.c11cShown;
  if (!me || !shown || shown.id !== me.id || !scene.menu || typeof scene.openCommand !== 'function') return false;
  const title = scene.cmdEl?.querySelector?.('.who')?.textContent || '';
  if (!title.includes('はどうする？')) return false;
  const key = cardsKey(ace);
  if (key === shown.key) return false;
  scene.c11cShown = { id: me.id, key };
  scene.openCommand();
  return true;
}
// どの カードを 食べて もらうか えらぶ まど（1回で 決定）
export function c11cCmdPick(scene, a, value) {
  if (value !== C11C_CMD) return false;
  const ace = acePub(scene);
  const cards = (ace?.cards11c || []).filter((k) => !k.used && !k.eaten);
  const send = (choice) => scene.send({ type: 'ability', id: TANOMU, choice });
  const nameOf = (id) => (scene.allies?.() || []).find((x) => x.id === id)?.name || '？';
  const list = cards.map((k, i) => ({
    html: `${k.up ? suitSvg(k.s, 18) : ''}<span>${i === 0 ? '次にめくる' : `${i + 1}ばんめ`}：${k.up ? SUIT_NAME[k.s] : 'うら向き'}${k.up && k.s === 'comet' && k.aim ? `（ねらい：${esc(nameOf(k.aim))}）` : ''}</span>`,
    label: `${i === 0 ? '次にめくる' : `${i + 1}ばんめ`}：${k.up ? SUIT_NAME[k.s] : 'うら向き'}`,
    value: k.no,
  }));
  if (!list.length) list.push({ label: '場に、カードがない（それでも、たのむ）', value: -1 });
  scene.showMenu(list, (it) => send(it.value), () => scene.openCommand(), 'どのカードを、アルゴルに食べてもらう？');
  return true;
}
void C11C_HEAD;
