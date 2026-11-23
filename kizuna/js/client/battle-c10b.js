// 第3部 第2章 第2幕「青と白」の 中ボス 2人・ふつうの 魔物の がめん
// （client/battle-c9b.js から よぶ。サーバーがわは shared/battle-c10b.js）
// ・画面の 上の まど（中ボスの 戦いだけ。PC は 右上・スマホの たては 戦いの 絵の すぐ 下）:
//   ゲッコー … 水の めもり（●●○）と ひとこと（砂の体・ぬれた・大かんそう）
//   シロフクロウ … さいごに 動いた 場所（＝本物）・入れかわった・てらして いる・ぬすむの ねらい
// ・シロフクロウ: どの え の 足もとにも 場所の 名前（左・まん中・右 …）。てらして いる 間は 本物に 金の 光と「本物！」
//   的を えらぶ 画面は 名前（「左のシロフクロウ」）で 左・中・右が わかる（スマホの たてでも）
// ・中ボスの しるし: 大かんそうの 前ぶれ・砂の体・ぬすむの ねらい・シャッフルの 前ぶれ
// ・勝った あと: ゲッコーは びしょぬれで しょんぼり・シロフクロウは おじぎ（え の コマ 2・3。たおれても 消えない）
// ・コマンド: ゲッコーの 戦いは いちばん 上に「水の音を鳴らす」（水が 0 の 時は「今だ！」）
import { C10B_GECKO, C10B_OWL, C10B_OWL_FAKE, OWL_NAME } from '../shared/data/monsters-c10b.js?v=28060a38724e';
import { MIZUOTO } from '../shared/data/abilities-c10b.js?v=28060a38724e';
import { OWL_POS } from '../shared/battle-c10b.js?v=28060a38724e';
import { monsterCanvas } from './render/monsters.js?v=28060a38724e';

// 前ぶれの バナーを 自分で 出す（client/battle-c8r.js の C8R_OWN_TELE に まぜる）
export const C10B_OWN_TELE = [C10B_GECKO, C10B_OWL, C10B_OWL_FAKE];
export const C10B_SCREEN_ANIMS = ['c10x_storm', 'c10x_dry', 'c10x_sand', 'c10o_wing', 'c10o_shuffle', 'c10b_dust'];
export const C10B_ALLY_FX = {
  c10b_drop: 'down', c10b_rain: 'down', c10b_pinch: 'claw', c10b_sandkick: 'wind', c10b_bite: 'claw', c10b_jet: 'down', c10b_punch: 'quake',
  c10b_dust: 'wind', c10b_sink: 'down', c10b_claw: 'claw', c10b_snow: 'down', c10b_glare: 'down', c10b_fang: 'claw', c10b_breath: 'down',
  c10b_slash: 'claw', c10b_sweep: 'wind',
  c10x_cane: 'quake', c10x_sand: 'wind', c10x_tail: 'quake', c10x_storm: 'wind', c10x_dry: 'quake',
  c10o_feather: 'claw', c10o_wing: 'wind', c10o_moon: 'bolt', c10o_steal: 'down',
};
export const C10B_SFX = {
  c10b_drop: 'hit', c10b_rain: 'sparkle', c10b_pinch: 'hit', c10b_sandkick: 'hit', c10b_shell: 'buff', c10b_bite: 'hit', c10b_jet: 'hit', c10b_bubble: 'buff',
  c10b_punch: 'smash', c10b_dust: 'hit', c10b_sink: 'warn', c10b_claw: 'hit', c10b_snow: 'hit', c10b_glare: 'warn', c10b_fang: 'hit', c10b_howl: 'buff',
  c10b_breath: 'hit', c10b_slash: 'smash', c10b_sweep: 'hit', c10b_guard: 'buff', c10b_ring: 'sparkle',
  c10x_cane: 'smash', c10x_sand: 'hit', c10x_tail: 'smash', c10x_storm: 'blast', c10x_dry: 'blast', c10x_stop: 'sparkle',
  c10o_feather: 'hit', c10o_wing: 'hit', c10o_moon: 'smash', c10o_shuffle: 'sparkle', c10o_steal: 'warn',
};
const isGecko = (c) => c?.species === C10B_GECKO;
const isOwl = (c) => c?.species === C10B_OWL || c?.species === C10B_OWL_FAKE;
export const posName = (pos, n) => (OWL_POS[n] || OWL_POS[3])[pos] || '';

const CSS = `
.c10b-top { position: absolute; right: 4px; top: 4px; z-index: 4; max-width: 46%; pointer-events: none;
  padding: 3px 8px 4px; border-radius: 10px; text-align: left; line-height: 1.3; color: #eef8ff;
  background: rgba(10, 30, 56, 0.86); border: 2px solid rgba(110, 190, 255, 0.85); box-shadow: 0 0 10px rgba(90, 180, 255, 0.4); }
.c10b-top.owl { background: rgba(20, 22, 46, 0.88); border-color: rgba(230, 236, 255, 0.85); box-shadow: 0 0 10px rgba(230, 236, 255, 0.4); }
.c10b-top .row { font-size: 12px; white-space: nowrap; }
.c10b-top .dots { letter-spacing: 1px; color: #5ab8ff; }
.c10b-top .dots b { color: #8ad8ff; }
.c10b-top .tx { margin-top: 2px; font-size: 11px; color: #d8f0ff; }
.c10b-top.warn { border-color: #ffd040; box-shadow: 0 0 14px rgba(255, 208, 64, 0.85); }
.c10b-top.warn .tx { color: #ffe060; animation: c10b-pulse 0.9s infinite; }
.c10b-top.good { border-color: #8affc8; }
.c10b-top.good .tx { color: #b0ffd8; }
@keyframes c10b-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
.c10b-top.c10b-flow { position: relative; left: auto; right: auto; top: auto; margin: 3px auto 0; max-width: 98%; box-sizing: border-box; text-align: center; }
@media (max-aspect-ratio: 1/1) { .c10b-top { top: 2px; left: 2px; right: auto; max-width: 58%; padding: 1px 5px 2px; } .c10b-top .row { font-size: 10px; } .c10b-top .tx { font-size: 10px; margin-top: 0; }
  .c10b-stage .b-hold { bottom: auto; top: 4px; right: auto; left: 6px; } }
`;
function addCss() {
  if (typeof document === 'undefined' || document.getElementById('c10b-css')) return;
  const s = document.createElement('style');
  s.id = 'c10b-css';
  s.textContent = CSS;
  document.head.append(s);
}
const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

// 水の めもり（テストからも 見る）
export function waterMeter(n, max = 3) {
  const on = Math.max(0, Math.min(max, n || 0));
  return { on, max, word: on <= 0 ? 'からから' : on === 1 ? '少し' : on >= max ? 'いっぱい' : 'ちょうどいい' };
}

// ───── 画面の 上の まど ─────
function topEl(scene) {
  if (typeof document === 'undefined' || !scene.stage) return null;
  if (!scene.c10bTop) {
    addCss();
    scene.c10bTop = document.createElement('div');
    scene.c10bTop.className = 'c10b-top';
    scene.c10bTop.style.display = 'none';
    scene.stage.append(scene.c10bTop);
  }
  return scene.c10bTop;
}
// 中ボスの まど（HTML。テストからも 見る）。c … 中ボスの pub・o … { moved: 動いた 本物の 場所の 名前・mixed: 入れかわった あと・allies }
export function c10bHtml(c, o = {}) {
  let cls = 'c10b-top';
  let row;
  let tx;
  if (isGecko(c) && c.c10Kind === 'gecko') {
    const m = waterMeter(c.water, c.waterMax || 3);
    row = `水 <span class="dots">${'<b>●</b>'.repeat(m.on)}${'○'.repeat(m.max - m.on)}</span>（${m.word}）`;
    if (c.c10Down) { tx = 'ゲッコーは、びしょぬれだ！'; cls += ' good'; } else if (c.big) { tx = '大かんそうが来る！雷か氷で止めよう（防御でもそなえられる）'; cls += ' warn'; } else if (m.on <= 0) {
      tx = '砂の体！こうげきが通らない。「水の音を鳴らす」で水をよぼう';
      cls += ' warn';
    } else if (m.on === 1) tx = '水が少ない。「水の音を鳴らす」か、水や氷の技でぬらそう';
    else if (m.on >= m.max) { tx = '水がいっぱい…大かんそうに気をつけて！'; cls += ' warn'; } else { tx = 'ぬれている！今だ、たたみかけろ（雷がよく効く）'; cls += ' good'; }
  } else if (isOwl(c) && c.c10Kind === 'owl') {
    cls += ' owl';
    const lit = o.lit;
    row = lit ? `本物：<b>${esc(lit)}</b>（スピカの光）` : o.mixed ? '本物：？（入れかわった）' : o.moved ? `さいごに動いた：<b>${esc(o.moved)}</b>` : '本物：？';
    const aim = c.owlSteal ? (o.allies || []).find((a) => a.id === c.owlSteal) : null;
    if (c.c10Down) { tx = 'シロフクロウが、おじぎをした！'; cls += ' good'; } else if (aim) { tx = `ぬすむが来る！ねらいは${aim.name}。「防御」でふせごう`; cls += ' warn'; } else if (c.owlShuffle) { tx = '次に入れかわる！今のうちに本物をたたこう'; cls += ' warn'; } else if (lit) { tx = '光っているのが本物だ！'; cls += ' good'; } else if (o.mixed || !o.moved) tx = '次に動くのを待とう。スピカのてらすで本物が光る';
    else tx = '動いたのが本物！にせものをなぐると、からかわれるぞ';
  } else return { html: '', cls };
  return { html: `<div class="row">${row}</div><div class="tx">${esc(tx)}</div>`, cls };
}
const portrait = () => typeof window !== 'undefined' && window.innerHeight > window.innerWidth;
function showTop(scene, html, cls) {
  const el = topEl(scene);
  if (!el) return;
  const flow = portrait() && !!scene.stage.parentElement;
  if (flow && el.parentElement !== scene.stage.parentElement) scene.stage.after(el);
  else if (!flow && el.parentElement !== scene.stage) scene.stage.append(el);
  const key = cls + '|' + html + '|' + flow;
  if (el.dataset.k === key) return;
  el.dataset.k = key;
  el.className = cls + (flow ? ' c10b-flow' : '');
  el.innerHTML = html;
  el.style.display = html ? '' : 'none';
}
// シロフクロウの まどの 中み（scene.c10bOwl … { moved, mixed }）
function owlInfo(scene) {
  const owls = (scene.enemies?.() || []).filter((e) => isOwl(e) && e.alive);
  const litOne = owls.find((e) => e.owlLit);
  return { ...(scene.c10bOwl || {}), lit: litOne ? posName(litOne.owlPos, litOne.owlN) : null, allies: scene.allies?.() || [] };
}

// ───────────── え（client/battle-c9b.js の c9bSprite から）: 勝った あと（コマ 2・3）─────────────
export function c10bSprite(c, frame) {
  if (!(isGecko(c) || isOwl(c)) || !c.c10Down) return null;
  c.dead = -1;
  return monsterCanvas(isGecko(c) ? C10B_GECKO : C10B_OWL, (frame ? 1 : 0) + 2);
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
export function c10bDraw(scene, x, m, c, px, py, w, h, base) {
  if (!isGecko(c) && !isOwl(c)) return;
  const T = scene.time || 0;
  scene.stage?.classList?.add?.('c10b-stage');
  if (isGecko(c)) {
    const top = c10bHtml(c);
    showTop(scene, top.html, top.cls);
    refreshWaterInfo(scene, c);
    if (c.c10Down) return;
    const ty = portrait() ? py + h * 0.55 : py + h + 4;
    if (c.big) {
      x.globalAlpha = base * (0.5 + Math.sin(T / 70) * 0.4);
      x.strokeStyle = '#ffd040';
      x.lineWidth = 2;
      x.beginPath();
      x.ellipse(px + w / 2, py + h, w * 0.6, 8, 0, 0, Math.PI * 2);
      x.stroke();
      x.globalAlpha = base;
      tag(x, px + w / 2, ty, '大かんそうが来る！雷か氷！', base, '#3a0a1a', '#ffd06a', 100);
    } else if (c.water <= 0) {
      // 砂の体（黄土の まく）
      x.globalAlpha = base * (0.2 + Math.sin(T / 300) * 0.05);
      x.fillStyle = '#d8b870';
      x.beginPath();
      x.ellipse(px + w / 2, py + h * 0.55, w * 0.55, h * 0.52, 0, 0, Math.PI * 2);
      x.fill();
      x.globalAlpha = base;
      tag(x, px + w / 2, ty, '砂の体（水の音でぬらそう）', base, '#2a2014', '#f0d898', 104);
    } else if (c.water >= 2) {
      tag(x, px + w / 2, ty, 'ぬれている！（今だ！）', base, '#0a2a4a', '#8ad8ff', 80);
    }
    return;
  }
  // シロフクロウ（本物も まぼろしも おなじ）
  const lead = (scene.enemies?.() || []).find((e) => isOwl(e) && e.alive && e.owlPos === 0);
  if (lead === c || !lead) { const top = c10bHtml(c, owlInfo(scene)); showTop(scene, top.html, top.cls); }
  if (!c.alive) return;
  if (c.owlLit) {
    x.globalAlpha = base * (0.35 + Math.sin(T / 120) * 0.15);
    x.fillStyle = '#fff0a0';
    x.beginPath();
    x.ellipse(px + w / 2, py + h * 0.5, w * 0.6, h * 0.56, 0, 0, Math.PI * 2);
    x.fill();
    x.globalAlpha = base;
    tag(x, px + w / 2, Math.max(8, py + 4), '本物！', base, '#3a2a00', '#fff0a0', 30);
  }
  if (c.c10Down) return;
  // 足もとの 場所の 名前（左・まん中・右）
  tag(x, px + w / 2, py + h + 4, posName(c.owlPos, c.owlN), base, '#141a3a', '#e8eeff', c.owlN >= 4 ? 36 : 30);
}

// ───────────── イベントを 見せる とき（client/battle-c9b.js の c9bPresent の さいご）─────────────
export function c10bPresent(scene, ev) {
  const g = scene.game;
  const warn = (t) => { g.audio.sfx('warn'); scene.banner(t, 'danger'); };
  const good = (t, s = 'crit') => { g.audio.sfx(s); scene.banner(t, 'combo'); };
  const nm = (id) => scene.c?.get?.(id)?.name || '';
  // シロフクロウの まどの 記おく（動いた 場所・入れかわった）
  if (ev.c10oMoved) scene.c10bOwl = { moved: posName(ev.c10oMoved.pos, ev.c10oMoved.n), mixed: false };
  if (ev.c10oShuffle) scene.c10bOwl = { moved: null, mixed: true };
  if (ev.c10oHalf) scene.c10bOwl = { ...(scene.c10bOwl || {}), mixed: !scene.c10bOwl?.moved };
  if (ev.c10xDry || ev.c10xStorm) scene.shake?.(ev.c10xDry ? 900 : 500, ev.c10xDry ? 10 : 4);
  // バナーは 1つの できごとに 1つだけ（大事な じゅん）
  const say = [
    ev.c10xDryUp && [warn, '！大かんそうが来る！雷か氷を当てて止めよう！'],
    ev.c10xStop && [(t) => good(t, 'sparkle'), '大かんそうを止めた！水はちょうど2つ！'],
    ev.c10xSand && [warn, '水がなくなった！砂の体に…「水の音を鳴らす」で水をよぼう！'],
    ev.c10xRing && ev.c10xRing.water >= 2 && ev.c10xRing.before < 2 && [(t) => good(t, 'sparkle'), 'ゲッコーがぬれた！こうげきが通る！'],
    ev.c10xWet && ev.c10xWet.water === 2 && [(t) => good(t, 'sparkle'), 'ゲッコーがぬれた！こうげきが通る！'],
    ev.c10oStealUp && [warn, `！ぬすむが来る…ねらいは${nm(ev.c10oStealUp.aim)}！「防御」でふせごう！`],
    ev.c10oShuffleUp && [warn, `！${nm(ev.c10oShuffleUp.id)}が本物！次に入れかわる…！`],
    ev.c10oHalf && [warn, 'シロフクロウが4人になった！'],
    ev.c10oShuffle && [warn, '入れかわった！次に動くのを待とう…'],
    ev.c10oLit && [(t) => good(t, 'sparkle'), `スピカの光で、${nm(ev.c10oLit.id)}が光った！あれが本物！`],
    ev.c10oTease && [warn, 'すりぬけた！それは、まぼろしだった…'],
    ev.c10oSteal && !ev.c10oSteal.blocked && ev.c10oSteal.got > 0 && [warn, 'よい効果を、ぬすまれた…！'],
    ev.c10oSteal?.blocked && [(t) => good(t, 'sparkle'), '防御で、ぬすむをふせいだ！'],
    ev.c10oMoved && [(t) => { g.audio.sfx('warn'); scene.banner(t, 'warn'); }, `${ev.c10oMoved.name}が動いた！あれが本物！`],
  ].find(Boolean);
  if (say && !ev.c10bDown) say[0](say[1]);
  if (ev.c10bDown) {
    scene.shake?.(400, 3);
    good(ev.c10bDown.kind === 'gecko' ? 'ゲッコーは、びしょぬれになった！' : 'シロフクロウは、ぼうしを取っておじぎをした！', 'sparkle');
    const boss = (scene.enemies?.() || []).find((c) => c.id === ev.c10bDown.id);
    if (boss) { const t = c10bHtml({ ...boss, c10Down: 1, big: 0, owlSteal: null, owlShuffle: 0 }, {}); showTop(scene, t.html, t.cls); }
  }
}

// ───────────── コマンド（client/battle-c9b.js の c9bCmdItems・c9bCmdPick）─────────────
// コマンドの せつめい（今の 水の 数。テストからも 見る）
export function waterInfo(m) {
  const w = m.water ?? 2;
  return m.big ? '大かんそうが来る！雷か氷の技を当てると止まる（「防御」でもそなえられる）。'
    : w <= 0 ? '水がない！「水の音を鳴らす」で水を2つよぼう。'
      : w === 1 ? `水 ${w}つ。もう少しで、かわいてしまう。水や氷の技でも、ぬらせる。`
        : w >= (m.waterMax || 3) ? '水がいっぱい。入れすぎると、大かんそうが来る。'
          : '水が2つ、ちょうどいい！雷の技がよく効く。';
}
// コマンドの まどを 開いた あとに 水が かわったら（自動の 仲間が 鳴らした・かわいた など）、せつめいを 今の 水の 数で 出し直す
//   出して いる せつめいが 水の せつめいの まま の 時だけ（ほかの 技の せつめいを 見て いる 時は さわらない）
export function refreshWaterInfo(scene, m) {
  const old = scene.c10bInfoText;
  if (!old || !m || m.c10Down || !scene.infoEl || scene.infoEl.textContent !== old) return false;
  const now = waterInfo(m);
  if (now === old) return false;
  scene.info(now);
  scene.c10bInfoText = now;
  return true;
}
const geckoOf = (scene) => (scene.enemies?.() || []).find((e) => isGecko(e) && e.alive && !e.c10Down) || null;
export function c10bCmdItems(scene, a) {
  const items = [];
  let info = '';
  if (!a) return { items, info };
  const m = geckoOf(scene);
  if (m && (a.abilities || []).includes(MIZUOTO)) {
    const now = (m.water ?? 2) <= 0;
    items.push({ html: `<span class="dual-cmd">水の音を鳴らす</span>${now ? '<span class="tag">今だ！</span>' : ''}`, value: 'c10bring', cls: 'k-dual' });
    info = waterInfo(m);
    scene.c10bInfoText = info;
  }
  const owl = (scene.enemies?.() || []).find((e) => isOwl(e) && e.alive && !e.c10Down);
  if (owl) {
    const aim = owl.owlSteal && owl.owlSteal === a.id;
    info = aim ? 'ぬすむのねらいは、自分！「防御」でふせごう。' : '本物を1人えらんでこうげき。全体の技は、本物に半分だけ当たる。';
  }
  return { items, info };
}
export function c10bCmdPick(scene, a, value) {
  if (value !== 'c10bring') return false;
  scene.send({ type: 'ability', id: MIZUOTO });
  return true;
}
void OWL_NAME;
