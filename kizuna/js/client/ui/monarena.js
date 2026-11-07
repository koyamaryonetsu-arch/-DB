// 第67回 A班: モンスター闘技場の 受付の 画面（だいほんの ['ui', 'monarena', { mode }]。data/story-monarena-a.js）
//
// ドラクエ風の カウンター（ui/counter.js の Counter）で:
//   はじめ … ランク戦 / 家族の登録チームと戦う / チームを登録する / その場で家族と対戦（C班。今は じゅんび中）/ きまり / やめる
//   ランク戦 … ランクの 一覧（開いた・勝ちぬいた・まだ。目安の レベル・ヒント）→ 4ひきを 選ぶ → はじめる
//   家族対戦 … 家族の 登録チーム → 強さ（そのままの強さ／レベルをそろえる）→ 4ひきを 選ぶ → はじめる
//   登録 … 4ひきを 選ぶ → 登録
// 4ひきを 選ぶ 画面（pickTeam）は 戦う たびに かならず 出す（前回の チームが はじめから 入っているので、そのまま 決めても よい）。
//   1回で 選ぶ: 前回のチーム・登録チーム・おまかせ（強い順）。わくを 選ぶと 入れかえ・はずす・1つ前へ
//
// サーバーの 窓口は B班の svc kind:'monarena'（action: status / setTeam / register / rank / family）。A班は 戦いの しょりを 書かない。
// 戦いを はじめる 'rank' / 'family' は、この 画面を とじて だいほんが おわってから 送る（受付の だいほんの 間に 戦いが はじまらない ように）
import { el, esc, toast } from './dom.js?v=1804b2cae177';
import { Counter } from './counter.js?v=1804b2cae177';
import { request } from './shop.js?v=1804b2cae177';
import { faceURL } from '../field.js?v=1804b2cae177';
import { boardIconURL } from '../render/boards.js?v=1804b2cae177';
import { monsterCanvas } from '../render/monsters.js?v=1804b2cae177';
import { MONSTERS } from '../../shared/data/monsters.js?v=1804b2cae177';
import {
  TEAM_MAX, whereLabel, normTeam, sortStrong, presetTeam, initialTeam, placeInSlot, removeAt, moveUp,
  rankState, rankName, familyRows, teamStats, avgLevel,
} from './monarena-team.js?v=1804b2cae177';

// C班（その場の 対戦）など、受付の はじめの えらびしを 足す ところ。
//   { value, label, hint, show?: (ctx) => bool, run: async (ctx) => 'started' | void }
//   ctx … { game, ct（Counter）, st（status）, data, svc(msg), pickTeam(opts), startFight(msg, line) }
//   value が 'live' の ものが あれば「じゅんび中」の 行の かわりに 出る
export const MONARENA_EXTRA = [];

const CSS = `
.monarena-panel .ct-list .menu .item.mona-mon { min-height: 2.55em; padding-top: 0.12em; padding-bottom: 0.12em; }
.monarena-panel .ct-list .menu .item .face { width: 2em; height: 2em; }
.mona-t { display: flex; flex-direction: column; min-width: 0; line-height: 1.2; }
.mona-t .nm { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mona-st { font-size: var(--fs-small); color: var(--muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
.mona-no { display: inline-block; min-width: 1.3em; color: var(--accent); font-weight: bold; }
.monarena-panel .menu .item.mona-empty .l { color: var(--muted); }
.monarena-panel .menu .item.mona-ok:not(.dis) .l { color: var(--accent); font-weight: bold; }
.monarena-panel .menu .item.mona-preset .l::before { content: '★'; color: #ffd66b; margin-right: 0.25em; }
.monarena-panel .menu .item .r.cleared { color: #ffd66b; }
.monarena-panel .menu .item .r.locked { color: #6d6c88; }
.monarena-panel .menu .item .r.inteam { color: var(--good); }
.mona-h { color: var(--accent); margin: 0.1em 0 0.25em; padding-bottom: 0.1em; border-bottom: 1px dashed rgba(255, 214, 107, 0.35); }
.mona-cards { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; }
.mona-card { display: flex; flex-direction: column; align-items: center; gap: 0.05em; padding: 0.2em 0.15em; border-radius: 6px; background: rgba(255, 255, 255, 0.05); min-width: 0; font-size: var(--fs-small); line-height: 1.25; font-variant-numeric: tabular-nums; }
.mona-card.empty { color: var(--muted); justify-content: center; min-height: 4.5em; border: 1px dashed rgba(255, 255, 255, 0.18); background: none; }
.mona-card.focus { box-shadow: 0 0 0 2px #ffd66b; background: rgba(255, 214, 107, 0.12); }
.mona-card canvas { image-rendering: pixelated; display: block; }
.mona-card .nm { max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mona-card .lv { color: var(--accent); }
.mona-card .st { color: var(--muted); white-space: nowrap; }
.mona-note { margin-top: 0.35em; white-space: pre-line; }
.mona-vs { margin-bottom: 0.35em; padding: 0.2em 0.4em; border-radius: 6px; background: rgba(255, 138, 106, 0.1); border: 1px solid rgba(255, 138, 106, 0.35); }
.mona-vs .who { color: #ff8a6a; font-weight: bold; }
.mona-big { display: flex; gap: 0.6em; align-items: center; }
.mona-stats { display: grid; grid-template-columns: auto auto; justify-content: start; column-gap: 1em; margin-top: 0.2em; font-variant-numeric: tabular-nums; }
.mona-stats .k { color: var(--muted); }
.mona-rank-st { display: inline-block; margin-left: 0.5em; font-size: var(--fs-small); }
.mona-rank-st.cleared { color: #ffd66b; }
.mona-rank-st.locked { color: #6d6c88; }
@media (max-width: 700px) {
  .mona-card .st.more { display: none; }
}
`;
function addCss() {
  if (typeof document === 'undefined' || document.getElementById('monarena-a-css')) return;
  document.head.append(el('style', { id: 'monarena-a-css', text: CSS }));
}

// サーバーの 窓口（B班。world/monarena.js）
async function svc(game, msg) {
  return request(game, { kind: 'monarena', ...msg });
}

// ───────────── 絵と 数字 ─────────────
function monPic(sp, px = 48) {
  const c = document.createElement('canvas');
  try {
    const src = monsterCanvas(sp, 0);
    c.width = src.width;
    c.height = src.height;
    c.getContext('2d').drawImage(src, 0, 0);
    const r = src.res || 1, w = src.width / r, h = src.height / r;
    const k = px / Math.max(w, h);
    c.style.width = `${Math.round(w * k)}px`;
    c.style.height = `${Math.round(h * k)}px`;
  } catch {
    c.width = c.height = 1;
  }
  return c;
}
const picSize = () => (typeof window !== 'undefined' && (window.innerHeight < 520 || window.innerWidth < 420) ? 40 : 54);
const face = (m) => { try { return faceURL({ mon: m.species }); } catch { return ''; } };
const kind = (m) => MONSTERS[m.species]?.name || '';
const n0 = (v) => (Number.isFinite(+v) ? Math.round(+v) : '-');
const statLine = (m) => `HP${n0(m.hp)}　攻${n0(m.atk)}　守${n0(m.def)}　速${n0(m.agi)}`;

// 一覧の 1行（名前・レベル・強さ）
function monHtml(m, no = null) {
  return `<span class="mona-t"><span class="nm">${no !== null ? `<span class="mona-no">${no}</span>` : ''}${esc(m.name)}<span class="muted small">　Lv${n0(m.level)}</span></span>`
    + `<span class="mona-st">${esc(statLine(m))}</span></span>`;
}

// チームの 4つの わく（絵・名前・レベル・強さ）
function teamCards(keys, mons, focus = -1) {
  const by = new Map(mons.map((m) => [m.key, m]));
  const px = picSize();
  const box = el('div', { class: 'mona-cards' });
  for (let i = 0; i < TEAM_MAX; i++) {
    const m = by.get(keys[i]);
    if (!m) {
      box.append(el('div', { class: `mona-card empty ${i === focus ? 'focus' : ''}`, text: `${i + 1}．あき` }));
      continue;
    }
    box.append(el('div', { class: `mona-card ${i === focus ? 'focus' : ''}` },
      monPic(m.species, px),
      el('span', { class: 'nm', text: m.name }),
      el('span', { class: 'lv', text: `Lv${n0(m.level)}` }),
      el('span', { class: 'st', text: `HP${n0(m.hp)}` }),
      el('span', { class: 'st more', text: `攻${n0(m.atk)}　守${n0(m.def)}` })));
  }
  return box;
}

// 家族の 登録チーム（相手。species・name・level だけ）
function regCards(reg) {
  const px = picSize();
  const box = el('div', { class: 'mona-cards' });
  for (let i = 0; i < TEAM_MAX; i++) {
    const m = reg[i];
    if (!m) { box.append(el('div', { class: 'mona-card empty', text: '－' })); continue; }
    box.append(el('div', { class: 'mona-card' }, monPic(m.species, px), el('span', { class: 'nm', text: m.name || MONSTERS[m.species]?.name || '' }), el('span', { class: 'lv', text: `Lv${n0(m.level)}` })));
  }
  return box;
}

// 1ぴきの くわしい 強さ（入れかえる 魔物を 選ぶ 時）
function monInfo(m, team) {
  const j = team.indexOf(m.key);
  const box = el('div', { class: 'ct-item' });
  box.append(el('div', { class: 'mona-big' }, monPic(m.species, picSize() + 16),
    el('div', {}, el('div', { class: 'gold', text: m.name }), el('div', { class: 'small muted', text: `${kind(m)}　Lv${n0(m.level)}` }),
      el('div', { class: 'small', text: `いる所: ${whereLabel(m.where) || '－'}${j >= 0 ? `　（チームの${j + 1}ばん）` : ''}` }))));
  const st = el('div', { class: 'mona-stats' });
  for (const [k, n] of [['hp', '最大HP'], ['mp', '最大MP'], ['atk', '攻撃力'], ['def', '守備力'], ['agi', '素早さ']]) st.append(el('span', { class: 'k', text: n }), el('span', { text: String(n0(m[k])) }));
  box.append(st);
  return box;
}

// ───────────── はじめの えらびし ─────────────
const HELLO = {
  rank: 'ランク戦にちょうせんする？\nそれとも、ほかのご用？',
  family: '家族のチームと戦う？\nそれとも、ほかのご用？',
  reg: 'チームを登録する？\nそれとも、ほかのご用？',
};
const MAIN_HINT = {
  rank: 'ランクFからSまで。1つのランクは、休みなしの3連戦。\n勝ちぬくと、ごほうびがもらえる。物語が進むと、上のランクが開く。',
  family: '家族が登録した4ひきと戦う。\n相手の魔物は、作戦で動く（相手が遊んでいない時でも戦える）。\n強さは「そのままの強さ」か「レベルをそろえる」から選べる。',
  reg: '自分の4ひきを登録しておくと、家族がいつでも、そのチームと戦える。\n登録は何回でもやり直せる。',
  live: '家族と2人で闘技場に来て、その場で申しこんで戦う。\nおたがいにコマンドを選んで戦えるよ。\n（今、じゅんびをしているところ）',
  rule: '闘技場のきまりを聞く。',
  exit: '',
};

function mainItems(ctx) {
  const extra = MONARENA_EXTRA.filter((x) => !x.show || x.show(ctx));
  const items = [
    { value: 'rank', label: 'ランク戦にちょうせん' },
    { value: 'family', label: '家族の登録チームと戦う' },
    { value: 'reg', label: 'チームを登録する' },
    ...extra.map((x) => ({ value: x.value, label: x.label, hint: x.hint, extra: x })),
  ];
  if (!extra.some((x) => x.value === 'live')) items.push({ value: 'live', label: 'その場で家族と対戦', right: 'じゅんび中', rightCls: 'locked', disabled: true });
  items.push({ value: 'rule', label: '闘技場のきまり' }, { value: 'exit', label: 'やめる' });
  return items;
}

function mainInfo(ctx, it) {
  const { st } = ctx;
  const box = el('div', { class: 'ct-item' });
  box.append(el('div', { class: 'hd' }, el('span', { class: 'gold', text: 'モンスター闘技場' })));
  const ranks = st.ranks || [];
  const won = ranks.filter((r) => r.cleared).length;
  box.append(
    el('div', { class: 'bank-row' }, el('span', { text: '勝ちぬいたランク' }), el('span', { class: 'gold', text: `${won}／${ranks.length}` })),
    el('div', { class: 'bank-row' }, el('span', { text: '戦える魔物' }), el('span', { text: `${(st.monsters || []).length}ひき` })),
  );
  const v = it?.value;
  if (v === 'reg' || v === 'family') {
    const reg = normTeam(st.reg, st.monsters || []);
    box.append(el('div', { class: 'mona-h', text: reg.length ? '今の登録チーム' : '登録チーム: まだない' }));
    if (reg.length) box.append(teamCards(reg, st.monsters || []));
  } else if (v === 'rank') {
    const last = normTeam(st.team, st.monsters || []);
    if (last.length) {
      box.append(el('div', { class: 'mona-h', text: '前回のチーム' }), teamCards(last, st.monsters || []));
    }
  }
  const hint = it?.hint || MAIN_HINT[v] || '';
  if (hint) box.append(el('div', { class: 'mona-note small', text: hint }));
  return box;
}

const RULES = [
  'ここで戦うのは、きみが育てた魔物だけ。\n人は、戦いには出ないよ。',
  '魔物は4ひきまで。ふだんと同じように、その魔物の作戦で動く。\n作戦が「めいれいさせろ」なら、きみがコマンドを選ぶんだ。',
  'パーティーの魔物でも、馬車の魔物でも、あずかり所の魔物でも出られるよ。\n戦う前に、いつでもチームを選びなおせる。',
];

// ───────────── 受付の 画面 ─────────────
export async function monArenaUI(game, data = {}) {
  addCss();
  const mode = ['rank', 'family', 'reg'].includes(data.mode) ? data.mode : 'rank';
  const ct = new Counter(game, { title: data.name || 'モンスター闘技場', keeper: data.keeper || '闘技場の受付', icon: boardIconURL('arena'), cls: 'monarena-panel' });
  ct.say('ちょっと待ってね…');
  const st = await svc(game, { action: 'status' });
  if (ct.closed) return;
  if (!st?.ok) {
    await ct.say(st?.text && st.text !== '通信がおくれています' ? st.text : 'ごめんね、今は受付のじゅんびをしているところなんだ。\nまた後で来てね。');
    await ct.tap(2600);
    ct.close();
    return;
  }
  for (const k of ['ranks', 'monsters', 'family', 'team', 'reg']) if (!Array.isArray(st[k])) st[k] = [];
  const ctx = { game, ct, st, data };
  ctx.svc = (msg) => svc(game, msg);
  ctx.pickTeam = (opts) => pickTeam(ctx, opts);
  ctx.startFight = (msg, line) => startFight(ctx, msg, line);
  let items = mainItems(ctx);
  let start = Math.max(0, items.findIndex((x) => x.value === mode));
  let line = HELLO[mode];
  while (!ct.closed) {
    await ct.say(line);
    items = mainItems(ctx);
    ct.info(mainInfo(ctx, items[start]));
    const cmd = await ct.pick(items, { back: null, start, onMove: (x) => ct.info(mainInfo(ctx, x)) });
    if (ct.closed) return;
    if (!cmd || cmd.value === 'exit') break;
    start = Math.max(0, items.findIndex((x) => x.value === cmd.value));
    let r;
    if (cmd.extra) r = await cmd.extra.run(ctx);
    else if (cmd.value === 'rank') r = await rankFlow(ctx);
    else if (cmd.value === 'family') r = await familyFlow(ctx);
    else if (cmd.value === 'reg') r = await regFlow(ctx);
    else if (cmd.value === 'rule') {
      ct.list(null);
      for (const t of RULES) {
        await ct.say(t);
        await ct.tap();
        if (ct.closed) return;
      }
    }
    if (r === 'started' || ct.closed) return;
    line = 'ほかに、ご用はある？';
  }
  if (ct.closed) return;
  ct.list(null);
  ct.info(null);
  await ct.say('またおいで！\n魔物たちと、もっと強くなってね。');
  await ct.tap(1400);
  ct.close();
}

// ───────────── ランク戦 ─────────────
const RANK_RIGHT = { locked: 'まだ', cleared: '★勝ちぬいた', open: '' };
function rankInfo(r) {
  const s = rankState(r);
  const box = el('div', { class: 'ct-item' });
  box.append(el('div', { class: 'hd' }, el('span', { class: 'gold', text: rankName(r) }),
    el('span', { class: `mona-rank-st ${s}`, text: s === 'locked' ? 'まだ開いていない' : s === 'cleared' ? '★勝ちぬいた' : 'ちょうせんできる' })));
  if (r.lv) box.append(el('div', { class: 'bank-row' }, el('span', { text: '目安のレベル' }), el('span', { class: 'gold', text: `Lv${r.lv}くらい` })));
  box.append(el('div', { class: 'bank-row' }, el('span', { text: '戦い方' }), el('span', { text: '休みなしの3連戦' })));
  if (r.hint) box.append(el('div', { class: 'mona-note small', text: s === 'locked' ? `ヒント: ${r.hint}` : r.hint }));
  return box;
}

async function rankFlow(ctx) {
  const { ct, st } = ctx;
  if (!st.ranks.length) {
    await ct.say('ごめんね、ランク戦は、まだじゅんび中なんだ。');
    await ct.tap(2000);
    return null;
  }
  let idx = st.ranks.findIndex((r) => rankState(r) === 'open');
  if (idx < 0) idx = Math.max(0, st.ranks.map(rankState).lastIndexOf('cleared'));
  while (!ct.closed) {
    await ct.say('どのランクにちょうせんする？');
    const items = st.ranks.map((r, i) => {
      const s = rankState(r);
      return { value: i, label: rankName(r), right: s === 'open' ? (r.lv ? `Lv${r.lv}くらい` : '') : RANK_RIGHT[s], rightCls: s, cls: `mona-rank ${s}` };
    });
    ct.info(rankInfo(st.ranks[idx]));
    const it = await ct.pick(items, { start: idx, onMove: (x) => ct.info(rankInfo(st.ranks[x.value])) });
    if (ct.closed || !it) return null;
    idx = it.value;
    const r = st.ranks[idx];
    if (!r.open) {
      await ct.say(`${rankName(r)}は、まだ開いていないんだ。\n${r.hint || '物語を進めると、開くよ。'}`);
      await ct.tap(2600);
      continue;
    }
    const team = await pickTeam(ctx, { purpose: 'fight', title: `${rankName(r)}に出るチーム` });
    if (ct.closed) return null;
    if (!team) continue;
    return startFight(ctx, { action: 'rank', rank: r.rank, team }, `${rankName(r)}、3連戦のはじまりだ！\nがんばってね！`);
  }
  return null;
}

// ───────────── 家族の 登録チームと 戦う ─────────────
function famInfo(f, note = '') {
  const box = el('div', { class: 'ct-item' });
  box.append(el('div', { class: 'hd' }, el('span', { class: 'gold', text: `${f.name}のチーム` }), el('span', { class: 'st', text: `平均Lv${avgLevel(f.reg)}` })));
  box.append(regCards(f.reg));
  if (note) box.append(el('div', { class: 'mona-note small', text: note }));
  return box;
}
const EVEN_NOTE = '「そのままの強さ」…おたがい、今のレベルのままで戦う。\n「レベルをそろえる」…両方の魔物が、みんな同じレベルになって戦う。小さい子の魔物でも、いい勝負！';

async function familyFlow(ctx) {
  const { game, ct, st } = ctx;
  const rows = familyRows(st, game.me?.id);
  if (!rows.length) {
    ct.list(null);
    ct.info(null);
    await ct.say('まだ、家族のだれも、チームを登録していないみたい。\n家族に「チーム登録の係」で、登録してもらってね。');
    await ct.tap(2600);
    return null;
  }
  let idx = 0;
  while (!ct.closed) {
    await ct.say('だれのチームと戦う？');
    const items = rows.map((f, i) => ({ value: i, label: `${f.name}のチーム`, right: `${f.reg.length}ひき　平均Lv${avgLevel(f.reg)}` }));
    ct.info(famInfo(rows[idx]));
    const it = await ct.pick(items, { start: idx, onMove: (x) => ct.info(famInfo(rows[x.value])) });
    if (ct.closed || !it) return null;
    idx = it.value;
    const f = rows[idx];
    ct.info(famInfo(f, EVEN_NOTE));
    const even = await ct.ask(`${f.name}のチームと戦うんだね。\n強さは、どうする？`, ['そのままの強さ', 'レベルをそろえる', 'やめる']);
    if (ct.closed) return null;
    if (even !== 0 && even !== 1) continue;
    const team = await pickTeam(ctx, { purpose: 'fight', title: `${f.name}のチームと戦う`, vs: f, even: even === 1 });
    if (ct.closed) return null;
    if (!team) continue;
    return startFight(ctx, { action: 'family', charId: f.charId, team, even: even === 1 }, `${f.name}のチームとの対戦、始め！\n${even === 1 ? 'レベルをそろえて' : 'そのままの強さで'}、いい勝負をしてね！`);
  }
  return null;
}

// ───────────── チームの 登録 ─────────────
async function regFlow(ctx) {
  const { game, ct, st } = ctx;
  const team = await pickTeam(ctx, { purpose: 'reg', title: '登録するチーム' });
  if (ct.closed || !team) return null;
  const res = await svc(game, { action: 'register', team });
  if (ct.closed) return null;
  if (res?.ok) {
    st.reg = Array.isArray(res.reg) ? res.reg : team;
    game.audio?.sfx('confirm');
  }
  ct.list(null);
  ct.info(el('div', { class: 'ct-item' }, el('div', { class: 'mona-h', text: '登録チーム' }), teamCards(normTeam(st.reg, st.monsters), st.monsters)));
  await ct.say(res?.text || (res?.ok ? 'チームを登録したよ！\n家族が、いつでもこのチームと戦えるようになった。' : 'あれ？うまく登録できなかったみたい。'));
  await ct.tap(2000);
  return null;
}

// ───────────── 戦いを はじめる ─────────────
const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
async function startFight(ctx, msg, line) {
  const { game, ct, st } = ctx;
  // 前回の チームとして おぼえる（B班。うまく いかなくても 戦いは はじめる）
  const r = await svc(game, { action: 'setTeam', team: msg.team });
  if (r?.ok) st.team = [...msg.team];
  if (ct.closed) return 'started';
  ct.list(null);
  ct.info(el('div', { class: 'ct-item' }, el('div', { class: 'mona-h', text: '出場する4ひき' }), teamCards(msg.team, st.monsters)));
  await ct.say(line);
  await ct.tap(1300);
  ct.close();
  // 受付の だいほんが おわってから たのむ（この 画面が とじると、だいほんの へんじが 先に とどく）
  (async () => {
    for (let i = 0; i < 40 && game.script?.running; i++) await wait(50);
    await wait(80);
    const res = await svc(game, msg);
    if (!res?.ok && res?.text) toast(res.text);
  })();
  return 'started';
}

// ───────────── 4ひきを 選ぶ ─────────────
// purpose: 'fight'（戦う 前）/ 'reg'（登録）。vs: 家族の 相手（{ name, reg }）。もどりち: key の ならび（やめたら null）
const PRESETS = [['last', '前回のチーム'], ['reg', '登録チーム'], ['auto', 'おまかせ（強い順）']];
async function pickTeam(ctx, { purpose = 'fight', title = 'チーム', vs = null, even = false } = {}) {
  const { ct, st } = ctx;
  const mons = st.monsters || [];
  if (!mons.length) {
    ct.list(null);
    ct.info(null);
    await ct.say('まだ、戦える魔物の仲間がいないみたい。\n魔物を仲間にしてから、また来てね。');
    await ct.tap(2400);
    return null;
  }
  const okLabel = purpose === 'reg' ? 'このチームを登録する' : 'このチームで戦う！';
  const full = Math.min(TEAM_MAX, mons.length);
  let team = initialTeam(st, purpose);
  let cur = team.length >= full ? 'ok' : `slot:${team.length}`;
  let line = purpose === 'reg' ? '登録する4ひきを選んでね。' : '戦う4ひきを選んでね。\nこのままでよければ、すぐに始められるよ。';
  let said = '';
  const info = (it) => {
    const box = el('div', { class: 'ct-item' });
    if (vs) box.append(el('div', { class: 'mona-vs small' }, el('span', { class: 'who', text: `相手: ${vs.name}のチーム` }), `（平均Lv${avgLevel(vs.reg)}・${even ? 'レベルをそろえる' : 'そのままの強さ'}）`));
    const v = String(it?.value || '');
    let keys = team;
    let head = `${title}（${team.length}／${TEAM_MAX}ひき）`;
    let note = '';
    if (v.startsWith('p:')) {
      keys = presetTeam(v.slice(2), st);
      head = `${PRESETS.find((p) => p[0] === v.slice(2))?.[1] || ''}にすると…`;
      note = keys.length ? '選ぶと、このチームになる。' : v === 'p:reg' ? 'まだ、チームを登録していない。' : '前回のチームは、まだない。';
    } else if (v.startsWith('slot:')) {
      note = team[+v.slice(5)] ? '選ぶと、この魔物を入れかえたり、はずしたり、順番をかえたりできる。' : '選ぶと、ここに入れる魔物を選べる。';
    } else if (v === 'ok') {
      note = team.length ? (purpose === 'reg' ? `この${team.length}ひきを登録する。` : `この${team.length}ひきで戦う！`) : 'まず、魔物を1ぴき以上入れてね。';
    }
    const s = teamStats(keys, mons);
    box.append(el('div', { class: 'mona-h', text: head }), teamCards(keys, mons, v.startsWith('slot:') ? +v.slice(5) : -1));
    if (s.n) box.append(el('div', { class: 'small muted', text: `平均Lv${s.avgLv}` }));
    if (note) box.append(el('div', { class: 'mona-note small', text: note }));
    return box;
  };
  while (!ct.closed) {
    const by = new Map(mons.map((m) => [m.key, m]));
    const items = [{ header: true, label: `${title}（${team.length}／${TEAM_MAX}ひき）` }];
    for (let i = 0; i < TEAM_MAX; i++) {
      const m = by.get(team[i]);
      if (m) items.push({ value: `slot:${i}`, face: face(m), html: monHtml(m, i + 1), right: whereLabel(m.where), cls: 'mona-mon' });
      else items.push({ value: `slot:${i}`, label: `${i + 1}　あき（魔物を入れる）`, cls: 'mona-empty', disabled: i > team.length || team.length >= mons.length });
    }
    items.push({ header: true, label: '1回で選ぶ' });
    for (const [k, n] of PRESETS) {
      const t = presetTeam(k, st);
      items.push({ value: `p:${k}`, label: n, right: t.length ? `${t.length}ひき` : 'なし', disabled: !t.length, cls: 'mona-preset' });
    }
    items.push({ header: true, label: '' });
    items.push({ value: 'ok', label: okLabel, disabled: !team.length, cls: 'mona-ok' });
    if (line !== said) {
      said = line;
      await ct.say(line);
      if (ct.closed) return null;
    }
    const start = Math.max(0, items.findIndex((x) => x.value === cur));
    ct.info(info(items[start]));
    const it = await ct.pick(items, { start, onMove: (x) => ct.info(info(x)) });
    if (ct.closed || !it) return null;
    const v = String(it.value);
    if (v === 'ok') return [...team];
    if (v.startsWith('p:')) {
      const t = presetTeam(v.slice(2), st);
      if (!t.length) continue;
      team = t;
      cur = 'ok';
      line = `「${PRESETS.find((p) => p[0] === v.slice(2))[1]}」にしたよ。\nこれでよければ「${okLabel}」を選んでね。`;
      continue;
    }
    if (v.startsWith('slot:')) {
      const i = +v.slice(5);
      const was = team[i];
      const next = await chooseMon(ctx, team, i);
      if (ct.closed) return null;
      if (next) {
        team = next;
        // あいていた わくに 入れたら つぎの あきへ。4ひき そろったら「決める」へ
        cur = !was && team.length < full ? `slot:${team.length}` : !was && team.length >= full ? 'ok' : `slot:${Math.min(i, Math.max(0, team.length - 1))}`;
        line = team.length >= full ? `チームがそろったよ。\nこれでよければ「${okLabel}」を選んでね。` : '戦う4ひきを選んでね。';
      }
      said = '';
      continue;
    }
  }
  return null;
}

// わく i に 入れる 魔物を 選ぶ（入れかえ・はずす・1つ前へ）。もどりち: 新しい ならび（やめたら null）
async function chooseMon(ctx, team, i) {
  const { ct, st } = ctx;
  const mons = sortStrong(st.monsters || []);
  const cur = team[i];
  const items = [];
  if (cur) {
    items.push({ value: '@up', label: '↑ 1つ前にする', disabled: i === 0 });
    items.push({ value: '@rm', label: 'チームからはずす' });
    items.push({ header: true, label: '入れかえる魔物（強い順）' });
  } else items.push({ header: true, label: '入れる魔物（強い順）' });
  for (const m of mons) {
    const j = team.indexOf(m.key);
    items.push({
      value: m.key, face: face(m), html: monHtml(m), cls: 'mona-mon',
      right: j >= 0 ? `チーム${j + 1}` : whereLabel(m.where), rightCls: j >= 0 ? 'inteam' : '',
    });
  }
  const by = new Map(mons.map((m) => [m.key, m]));
  const info = (x) => {
    const m = by.get(x?.value);
    if (m) return monInfo(m, team);
    const box = el('div', { class: 'ct-item' }, el('div', { class: 'mona-h', text: 'チーム' }), teamCards(team, mons, i));
    box.append(el('div', { class: 'mona-note small', text: x?.value === '@up' ? `${by.get(cur)?.name || ''}を、1つ前にする。` : x?.value === '@rm' ? `${by.get(cur)?.name || ''}を、チームからはずす。` : '' }));
    return box;
  };
  await ct.say(cur ? `${by.get(cur)?.name || ''}を、どうする？` : `${i + 1}ばんめに入れる魔物を選んでね。`);
  if (ct.closed) return null;
  let start = items.findIndex((x) => x.value === cur);
  if (start < 0) start = items.findIndex((x) => !x.header && !x.disabled && !String(x.value).startsWith('@') && !team.includes(x.value));
  if (start < 0) start = items.findIndex((x) => !x.header && !x.disabled);
  ct.info(info(items[start]));
  const it = await ct.pick(items, { start, onMove: (x) => ct.info(info(x)) });
  if (ct.closed || !it) return null;
  if (it.value === '@up') return moveUp(team, i);
  if (it.value === '@rm') return removeAt(team, i);
  return placeInSlot(team, i, it.value);
}

// 第67回 C班: その場の 対戦（ui/monarena-live.js）でも 使う（申しこまれた 人は 受付の だいほんの 外で 4ひきを 選ぶ）
export { pickTeam as monArenaPickTeam, teamCards as monArenaTeamCards, addCss as monArenaCss };
