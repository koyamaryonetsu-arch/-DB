// れん金がま（第32回 C）の 画面。メニューの「道具」の いちばん上の「れん金がま」から 開く
//
//   「れん金がまに、何を入れる？」→ レシピから作る／自分で入れてみる／やめる
//   レシピから作る: 知っている レシピ（材料が そろっている 物に「作れる」）→「〇〇＋〇〇で、△△を作る？」→ 入れる → 閉じる
//     いちばん上は「同じ武具を2つ」（きたえられる 回数が 1 ふえる）
//   自分で入れてみる: ふくろの 物を 1つずつ えらぶ（2つ 入れたら「これで、れん金する」）。はずれは もどってくる
//   中に 何か 入っている 間は「あと〇歩ほど」を 出す（レシピは 見られる）
// できあがりの 知らせは サーバーから（world/alchemy.js の finishPot。トースト）
import { sourcesFlow } from './sources.js?v=e3f2209f7dc0';
import { GEAR_FX, fxBlock, fxText, fxShort, fxListOf, fxRange, fxStars, fxSlots, fxMatsOf } from '../../shared/data/gear-fx.js?v=e3f2209f7dc0';
import { el, esc } from './dom.js?v=e3f2209f7dc0';
import { Counter, itemInfo, myTeam } from './counter.js?v=e3f2209f7dc0';
import { request } from './shop.js?v=e3f2209f7dc0';
import { itemCount } from '../../shared/stats.js?v=e3f2209f7dc0';
import { rareNameHtml } from './rarity.js?v=e3f2209f7dc0';
import { ITEMS, baseItemId, sortItemIds, SLOT_NAMES } from '../../shared/data/items.js?v=e3f2209f7dc0';
import { UPGRADE_TYPES } from '../../shared/data/items-forge.js?v=e3f2209f7dc0';
import { setForgeViewer, maxPlus, isShopForge } from '../../shared/data/forge.js?v=e3f2209f7dc0';
import {
  ALCHEMY_POT, RECIPE_BY_ID, MERGE_RECIPE, CAP_UP_MAX, LB_MAX, limitMerge, hasPot, knownRecipes, recipeLack, pickIngredients, insText, capUp, potSteps,
} from '../../shared/data/alchemy.js?v=e3f2209f7dc0';

// きたえる 回数を 見る 人を 自分の キャラに（道具の 説明・かじ屋の 画面。data/forge.js）
export function bindAlchemy(game) {
  setForgeViewer(() => game.me || null);
}

const CSS = `
.alchemy-panel .al-pot { display: flex; flex-direction: column; gap: 0.35em; }
.alchemy-panel .al-pot .hd { color: #ffd66b; }
.alchemy-panel .al-slots { display: flex; flex-wrap: wrap; gap: 0.3em; align-items: center; }
.alchemy-panel .al-slot { border: 1px solid rgba(255, 214, 107, 0.55); border-radius: 6px; padding: 0.1em 0.45em; min-width: 3.2em; text-align: center; }
.alchemy-panel .al-slot.empty { color: var(--muted); border-style: dashed; }
.alchemy-panel .al-need { display: grid; grid-template-columns: 1fr auto auto; gap: 0 0.6em; font-size: var(--fs-small); }
.alchemy-panel .al-need .ok { color: #8fe08f; }
.alchemy-panel .al-need .ng { color: #ff8f8f; }
.alchemy-panel .al-steps { font-size: 1.15em; color: #ffd66b; }
.menu .tag.pot { color: #ffd66b; border-color: rgba(255, 214, 107, 0.6); }
`;
let cssDone = false;
function ensureCss() {
  if (cssDone || typeof document === 'undefined') return;
  cssDone = true;
  document.head.append(el('style', { id: 'alchemy-css', text: CSS }));
}

// メニューの「道具」の いちばん上の 行（かまを 持っていない ときは null）
export function alchemyRow(c) {
  if (!hasPot(c)) return null;
  ensureCss();
  const busy = !!c.alchemy?.pot;
  return { html: `${esc(ITEMS[ALCHEMY_POT].name)}<span class="tag pot">${busy ? 'れん金中' : '大事'}</span>`, label: ITEMS[ALCHEMY_POT].name, value: ALCHEMY_POT, key: true, pot: true };
}

const nameOf = (id) => ITEMS[id]?.name || id;

// かまの 中の ようす（info の まど）
function potBox(game, pot) {
  const box = el('div', { class: 'al-pot' });
  box.append(el('div', { class: 'hd', text: 'れん金がまの中' }));
  box.append(el('div', { class: 'al-slots' }, ...(pot.ins || []).map((id) => el('span', { class: 'al-slot', text: nameOf(id) }))));
  box.append(el('div', { html: `できる物: ${pot.known ? rareNameHtml(pot.out) : '？？？'}` }));
  if (pot.lb) box.append(el('div', { class: 'small', text: `${nameOf(pot.merge)}が限界とっぱする（★${pot.lb}）` }));
  else if (pot.merge) box.append(el('div', { class: 'small', text: `${nameOf(pot.merge)}のきたえられる回数が1ふえる` }));
  box.append(el('div', { class: 'al-steps', text: `あと${pot.left}歩ほど` }));
  box.append(el('div', { class: 'small muted', text: '歩いていると完成する。' }), el('div', { class: 'small muted', text: '（できたら知らせが出て、ふくろに入る）' }));
  return box;
}

// レシピの 材料と できる 物（info の まど）
function recipeBox(game, rid) {
  const r = RECIPE_BY_ID[rid];
  const box = el('div', { class: 'al-pot' });
  const need = new Map();
  for (const id of r.ins) need.set(id, (need.get(id) || 0) + 1);
  const lack = new Map(recipeLack(game.me, rid).map((x) => [x.id, x]));
  const have = (id) => (game.me.items || []).filter((e) => baseItemId(e.id) === id).reduce((a, e) => a + e.n, 0);
  const grid = el('div', { class: 'al-need' }, el('span', { class: 'muted', text: '材料' }), el('span', { class: 'muted', text: 'いる' }), el('span', { class: 'muted', text: '持っている' }));
  for (const [id, n] of need) {
    grid.append(el('span', { text: nameOf(id) }), el('span', { text: `${n}` }), el('span', { class: lack.has(id) ? 'ng' : 'ok', text: `${have(id)}` }));
  }
  box.append(grid, el('div', { class: 'small muted', text: `あと${potSteps(r.out)}歩ほど歩くとできる` }));
  const info = itemInfo(game, r.out);
  if (info) box.append(info);
  return box;
}

// 同じ 武具を 2つ（ふくろに 2つ いじょう ある 装備。もとの 装備ごと）。店で 買える 装備（★1）は きたえられない ので 出さない（第35回）
function mergeChoices(game) {
  const groups = new Map();
  for (const e of game.me.items || []) {
    const it = ITEMS[e.id];
    if (!it || !UPGRADE_TYPES.includes(it.type) || !(e.n > 0) || isShopForge(e.id)) continue;
    const b = baseItemId(e.id);
    if (!groups.has(b)) groups.set(b, []);
    for (let i = 0; i < e.n; i++) groups.get(b).push(e.id);
  }
  const out = [];
  for (const [b, ids] of groups) {
    if (ids.length < 2) continue;
    ids.sort((x, y) => (ITEMS[y].plus || 0) - (ITEMS[x].plus || 0) || (ITEMS[y].lb || 0) - (ITEMS[x].lb || 0));
    // 回数を ふやす: きたえた 回数が いちばん 多い 物と、いちばん 少ない 物（少ない ほうが なくなる）
    if (capUp(game.me, b) < CAP_UP_MAX) {
      out.push({ base: b, ids: [ids[0], ids[ids.length - 1]], n: ids.length, full: false });
      continue;
    }
    // 第65回: 限界とっぱ（上限まで きたえた 物を 2つ。★の 多い ほうが のこって ★が 1つ ふえる）
    const lb = limitMerge([ids[0], ids[1]], game.me);
    out.push({ base: b, ids: [ids[0], ids[1]], n: ids.length, full: !!lb.why, lb: lb.k || 0, why: lb.why || null, out: lb.out || null });
  }
  return out;
}

export async function alchemyUI(game) {
  ensureCss();
  bindAlchemy(game);
  const ct = new Counter(game, { title: 'れん金がま', keeper: 'れん金がま', cls: 'alchemy-panel' });
  // 画面の 間は フィールドを 歩かない（えらぶ まどが ない すきまも）
  const hold = { onNav: () => {}, pad: true };
  game.input.push(hold);
  ct.hook(() => game.input.pop(hold));
  try {
    await potLoop(game, ct);
  } finally {
    if (!ct.closed) ct.close();
  }
}

async function potLoop(game, ct) {
  let line = null;
  while (!ct.closed) {
    const st = await request(game, { kind: 'alchemy', action: 'status' });
    if (ct.closed) return;
    const pot = st.pot || null;
    ct.info(pot ? potBox(game, pot) : el('div', { class: 'detail', text: '装備や道具を2〜3こ入れて歩くと、新しい物ができる。\n同じ武具を2つ入れると、きたえられる回数がふえる。' }));
    await ct.say(line || (pot ? `れん金がまの中で、${pot.known ? nameOf(pot.out) : '何か'}ができるのを待っている。\nあと${pot.left}歩ほど歩こう。` : 'れん金がまに、何を入れる？'), { narr: true });
    const known = knownRecipes(game.me);
    const cmd = await ct.pick([
      { label: pot ? 'レシピを見る' : 'レシピから作る', value: 'recipe', right: `${known.length + 1}こ` },
      { label: '自分で入れてみる', value: 'try', disabled: !!pot },
      { label: '装備に効果をつける', value: 'enchant' },
      { label: 'やめる', value: 'exit' },
    ], { back: null, onMove: (x) => { if (x?.value === 'try') ct.info(el('div', { class: 'detail', text: 'ふくろの物を2〜3こ入れてみる。\nうまくいけば、新しいレシピになる。\n（はずれは入れられない）' })); else if (x?.value === 'enchant') ct.info(el('div', { class: 'detail', text: ENCHANT_HELP })); else if (pot) ct.info(potBox(game, pot)); } });
    if (ct.closed || !cmd || cmd.value === 'exit') return;
    if (cmd.value === 'enchant') {
      await enchantLoop(game, ct);
      line = null;
      continue;
    }
    const done = cmd.value === 'recipe' ? await recipeLoop(game, ct, !!pot) : await tryLoop(game, ct);
    if (done) return;
    line = null;
  }
}

// ───── 第64回 ⑥c・第65回: 装備に 効果を つける（data/gear-fx.js。すぐ できる。効果は ランダム）─────
const ENCHANT_HELP = '装備（★2から）に、素材で効果をつける。\n効果のしゅるいと強さは、入れてみるまでわからない。レア度が高いほど強い効果が出やすい。\n同じ効果が出ると強くなる。限界とっぱすると、効果を2つつけられる。';
const SLOT_ORDER = ['weapon', 'armor', 'shield', 'head'];
async function enchantLoop(game, ct) {
  const team = myTeam(game);
  let mate = team[0];
  if (team.length > 1) {
    await ct.say('だれの装備に効果をつける？', { narr: true });
    const p = await ct.pick(team.map((m) => ({ label: m.name, right: m.kind, value: m.key })));
    if (ct.closed || !p) return;
    mate = team.find((m) => m.key === p.value);
  }
  const ch = mate.char;
  const listOf = (id) => fxListOf(ch, id);
  const slots = SLOT_ORDER.filter((sl) => ch.equip?.[sl]).map((sl) => {
    const id = ch.equip[sl];
    const fx = listOf(id);
    return { label: `${SLOT_NAMES[sl]}：${nameOf(id)}`, right: fxBlock(id) ? '×' : fx.length ? fxShort(fx) : '効果なし', value: sl, disabled: !!fxBlock(id) };
  });
  if (!slots.length) {
    await ct.say(`${ch.name}は、何も装備していない。`, { narr: true });
    await ct.tap(1600);
    return;
  }
  const detail = (id) => {
    if (fxBlock(id)) return fxBlock(id);
    const fx = listOf(id);
    const [lo, hi] = fxRange(id);
    const mats = fxMatsOf(id);
    return `今の効果（${fx.length}/${fxSlots(ch, id)}）：${fx.length ? fx.map((x) => fxText(x.k, x.v)).join('\n　') : 'なし'}\n出る強さ：+${lo}〜+${hi}（★${fxStars(id)}）\nいる素材：${mats.map(([m, n]) => `${nameOf(m)}${n}こ（${itemCount(game.me, m)}）`).join('・')}`;
  };
  await ct.say('どの装備に効果をつける？\n（店の品・★1にはつけられない）', { narr: true });
  const sp = await ct.pick(slots, { onMove: (x) => { const id = x && ch.equip?.[x.value]; ct.info(el('div', { class: 'detail', text: id ? detail(id) : '' })); } });
  if (ct.closed || !sp) return;
  const slot = sp.value;
  const id = ch.equip[slot];
  const mats = fxMatsOf(id);
  const lack = mats.filter(([m, n]) => itemCount(game.me, m) < n).map(([m, n]) => ({ id: m, need: n, have: itemCount(game.me, m) }));
  if (lack.length) {
    await ct.say(`素材が足りない。\n（${lack.map((x) => `${nameOf(x.id)}があと${x.need - x.have}こ`).join('・')}）`, { narr: true });
    await ct.tap(2200);
    await sourcesFlow(game, ct, lack);
    return;
  }
  const yes = await ct.ask(`${mats.map(([m, n]) => `${nameOf(m)}${n}こ`).join('・')}を使って、\n${ch.name}の${nameOf(id)}に力をこめる？\n（どんな力が出るかは、お楽しみ）`);
  if (ct.closed || yes !== 0) return;
  game.audio.sfx('item');
  const res = await request(game, { kind: 'alchemy', action: 'enchant', who: mate.key, slot });
  if (ct.closed) return;
  if (res.ok) game.audio.sfx('key');
  await ct.say(res.text || '', { narr: true });
  await ct.tap(2400);
  // 効果が いっぱい: 入れかえるか 前の ままか
  if (res.ok && res.fxChoose) {
    const now = res.fxNow || [];
    await ct.say(`生まれた力：${fxText(res.fxRoll.k, res.fxRoll.v)}\nどうする？`, { narr: true });
    const rows = [...now.map((x, i) => ({ label: `${GEAR_FX[x.k]?.name || ''}+${x.v}と入れかえる`, value: i })), { label: '前のままにする', value: -1 }];
    const p = await ct.pick(rows, { back: null, onMove: (x) => ct.info(el('div', { class: 'detail', text: x && x.value >= 0 ? `今：${fxText(now[x.value].k, now[x.value].v)}\n→ ${fxText(res.fxRoll.k, res.fxRoll.v)}` : '生まれた力は消えて、今の効果のまま' })) });
    const r2 = await request(game, { kind: 'alchemy', action: 'enchantPick', replace: p ? p.value : -1 });
    if (ct.closed) return;
    await ct.say(r2.text || '', { narr: true });
    await ct.tap(2000);
  }
}

// 入れる（ids）。うまく いったら true（画面を 閉じる）
async function put(game, ct, ids) {
  game.audio.sfx('item');
  const res = await request(game, { kind: 'alchemy', action: 'put', ids });
  if (ct.closed) return false;
  if (!res.ok) {
    game.audio.sfx('buzz');
    await ct.say(res.text || 'うまくいかなかった。', { narr: true });
    await ct.tap(2400);
    return false;
  }
  setTimeout(() => game.audio.sfx('sparkle'), 300);
  if (res.pot) ct.info(potBox(game, res.pot));
  ct.list(null);
  await ct.say(res.text, { narr: true });
  await ct.tap(3200);
  return true;
}

// ───────────── レシピから 作る ─────────────
async function recipeLoop(game, ct, busy) {
  let idx = 0;
  while (!ct.closed) {
    const list = knownRecipes(game.me);
    const rows = [{ value: MERGE_RECIPE, html: '同じ武具を2つ<span class="tag up">回数+1</span>', right: '' }];
    for (const rid of list) {
      const r = RECIPE_BY_ID[rid];
      const ok = !recipeLack(game.me, rid).length;
      rows.push({ value: rid, html: `${rareNameHtml(r.out)}${ok && !busy ? '<span class="tag up">作れる</span>' : ''}`, right: '', rightCls: ok ? 'gold' : 'dis' });
    }
    await ct.say(busy ? '覚えたレシピ' : '何を作る？', { narr: true });
    const pick = await ct.pick(rows, {
      start: Math.min(idx, rows.length - 1),
      onMove: (x) => ct.info(!x ? null : x.value === MERGE_RECIPE
        ? el('div', { class: 'detail', text: `同じ武具（武器・よろい・たて・頭）を2つ入れると、きたえられる回数が1ふえる。\n（1つの装備で${CAP_UP_MAX}回まで。レア度は変わらない。きたえた回数が多いほうが残る）\n${CAP_UP_MAX}回ふやしたあとは、上限まできたえた物を2つ入れると限界とっぱ（★${LB_MAX}まで）。` })
        : recipeBox(game, x.value)),
    });
    if (ct.closed || !pick) return false;
    idx = rows.findIndex((r) => r.value === pick.value);
    if (busy) continue;
    if (pick.value === MERGE_RECIPE) {
      if (await mergeLoop(game, ct)) return true;
      continue;
    }
    const r = RECIPE_BY_ID[pick.value];
    const lack = recipeLack(game.me, pick.value);
    if (lack.length) {
      await ct.say(`材料が足りない。\n（${lack.map((x) => `${nameOf(x.id)}があと${x.need - x.have}こ`).join('・')}）`, { narr: true });
      await ct.tap(2400);
      await sourcesFlow(game, ct, lack); // 第64回 ⑥a: 入手先
      continue;
    }
    const yes = await ct.ask(`${insText(r.ins)}で、\n${nameOf(r.out)}を作る？`);
    if (ct.closed) return false;
    if (yes !== 0) continue;
    const ids = pickIngredients(game.me, pick.value);
    if (ids && await put(game, ct, ids)) return true;
  }
  return false;
}

// 同じ 武具を 2つ: 右の まど（限界とっぱの ときは、できる 物と わけ）
function mergeInfo(game, m) {
  const box = el('div', {});
  const info = itemInfo(game, m.lb ? m.out : m.ids[0]);
  if (info) box.append(info);
  const top = maxPlus(m.base, game.me);
  const note = m.lb
    ? `限界とっぱ（★${m.lb}）！${m.lb === 1 ? '\nれん金の効果を2つつけられるようになる。' : '\nもう1回きたえたぶん強くなる。'}`
    : m.why === 'capMax' ? `回数はもうふやせない。\n上限（+${top}）まできたえた物を2つ入れると、限界とっぱできる。`
      : m.why === 'lbMax' ? `もう★${LB_MAX}まで限界とっぱしている。`
        : m.why === 'rebirth' ? '生まれ変わる武器は、限界とっぱできない。' : '';
  if (note) box.append(el('div', { class: 'detail', text: note }));
  return box;
}

// 同じ 武具を 2つ
async function mergeLoop(game, ct) {
  while (!ct.closed) {
    const list = mergeChoices(game);
    if (!list.length) {
      await ct.say('同じ武具を2つ持っていない。\n（武器・よろい・たて・頭の装備。店の品〈★1〉はのぞく）', { narr: true });
      await ct.tap(2400);
      return false;
    }
    const rows = list.map((m, i) => {
      const top = maxPlus(m.base, game.me);
      const right = m.lb ? `★${m.lb}へ` : m.full ? (m.why === 'capMax' ? `+${top}まで` : '最大') : `+${top}→+${top + 1}`;
      return { value: i, html: `${rareNameHtml(m.base)}<span class="cnt">×${m.n}</span>`, right, rightCls: m.full ? 'muted' : 'gold', disabled: m.full };
    });
    await ct.say('どの武具を入れる？', { narr: true });
    const pick = await ct.pick(rows, { onMove: (x) => ct.info(x ? mergeInfo(game, list[x.value]) : null) });
    if (ct.closed || !pick) return false;
    const m = list[pick.value];
    const top = maxPlus(m.base, game.me);
    const yes = await ct.ask(m.lb
      ? `${insText(m.ids)}を入れる？\n（${nameOf(m.ids[0])}が限界とっぱして、${nameOf(m.out)}になる）`
      : `${insText(m.ids)}を入れる？\n（${nameOf(m.base)}は+${top}→+${top + 1}まできたえられるようになる）`);
    if (ct.closed) return false;
    if (yes === 0 && await put(game, ct, m.ids)) return true;
  }
  return false;
}

// ───────────── 自分で 入れてみる ─────────────
function slotsBox(slots) {
  const cells = [0, 1, 2].map((i) => (slots[i] ? el('span', { class: 'al-slot', text: nameOf(slots[i]) }) : el('span', { class: 'al-slot empty', text: i < 2 ? '？' : '（なくてもよい）' })));
  return el('div', { class: 'al-pot' }, el('div', { class: 'hd', text: '入れる物' }), el('div', { class: 'al-slots' }, ...cells));
}

async function tryLoop(game, ct) {
  const slots = [];
  while (!ct.closed) {
    const used = new Map();
    for (const id of slots) used.set(id, (used.get(id) || 0) + 1);
    const bag = sortItemIds((game.me.items || []).filter((e) => e.n - (used.get(e.id) || 0) > 0 && ITEMS[e.id] && ITEMS[e.id].type !== 'key').map((e) => e.id), 'type');
    const count = (id) => ((game.me.items || []).find((e) => e.id === id)?.n || 0) - (used.get(id) || 0);
    const rows = [];
    if (slots.length >= 2) rows.push({ value: '#go', html: '<span class="gold">これで、れん金する</span>' });
    if (slots.length) rows.push({ value: '#undo', label: '1つもどす' });
    if (slots.length < 3) for (const id of bag) rows.push({ value: id, html: ITEMS[id].type === 'mat' ? `${esc(nameOf(id))}<span class="tag mat">素材</span>` : rareNameHtml(id), right: `×${count(id)}` });
    ct.info(slotsBox(slots));
    await ct.say(slots.length >= 2 ? (slots.length < 3 ? 'これで入れる？\n3つめを入れてもよい。' : 'これで入れる？') : `${slots.length + 1}つめに、何を入れる？`, { narr: true });
    const pick = await ct.pick(rows, { onMove: (x) => ct.info(x && ITEMS[x.value] ? el('div', {}, slotsBox(slots), itemInfo(game, x.value)) : slotsBox(slots)) });
    if (ct.closed || !pick) return false;
    if (pick.value === '#undo') { slots.pop(); continue; }
    if (pick.value === '#go') {
      if (await put(game, ct, slots.slice())) return true;
      slots.length = 0;
      continue;
    }
    slots.push(pick.value);
  }
  return false;
}
