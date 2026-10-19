// ふしぎなかじ屋（ドラクエ風の カウンター）
//
// 「今日は何をする？」→ 作る／きたえる／やめる
//   作る:     レシピを えらぶ（みぎに 素材の 数・みんなの 強さが どう かわるか）→「〇〇と〇〇ゴールドがいる。作るか？」
//             →「すぐに装備するか？」→「だれが装備する？」
//   きたえる: 装備を えらぶ（E は 装備している 物）→ みぎに きたえる 前→あとの 強さと 素材
//             第35回: 店で 買える 装備（★1）は きたえられない ので 一覧に 出さない。
//             ただし 生まれ変わりの もとに なる 店の 武器（銅の剣 など 5つ）は 出して、れん金がまの レシピを 見せる
//             （第36回: かくさない。知らない 人には、本だな・メモ・親方で わかると 出す）
//             →「〇〇にきたえるには〇〇がいる。きたえるか？」→ カン！カン！カン！
import { el, esc } from './dom.js?v=fdf2e7d68566';
import { Counter, compareTeam, itemInfo, whoItems, myTeam } from './counter.js?v=fdf2e7d68566';
import { request } from './shop.js?v=fdf2e7d68566';
import { rankText } from './info.js?v=fdf2e7d68566';
import { rareNameHtml } from './rarity.js?v=fdf2e7d68566';
import { ITEMS } from '../../shared/data/items.js?v=fdf2e7d68566';
import { UPGRADE_TYPES, UPGRADE_MAX } from '../../shared/data/items-forge.js?v=fdf2e7d68566';
import { recipeOf, upgradeCost, lackOf, canUpgrade, maxPlus, isShopForge } from '../../shared/data/forge.js?v=fdf2e7d68566';
import { REBIRTH_START } from '../../shared/data/items-alchemy.js?v=fdf2e7d68566';
import { hasPot, knowsRecipe, insText } from '../../shared/data/alchemy.js?v=fdf2e7d68566';
import { bindAlchemy } from './alchemy.js?v=fdf2e7d68566';
import { computeStats, itemCount } from '../../shared/stats.js?v=fdf2e7d68566';
import { boardIconURL } from '../render/boards.js?v=fdf2e7d68566';

const BONUS_NAMES = { str: '力', def: '身の守り', agi: '素早さ', mag: '攻撃魔力', heal: '回復魔力', hp: '最大HP', mp: '最大MP' };

const HINTS = {
  craft: '素材とゴールドで、店では売っていない装備を作る。\n物語が進むと、作れる物がふえる。',
  upgrade: `店では買えない装備（★2から）をきたえる。1回ごとに攻撃力や守備力が上がる。\n店の品（★1）は、きたえられない。\nきたえられる回数は、装備のランクで決まる。（最大+${UPGRADE_MAX}）\n+3からは星のかけらもいる。\nれん金がまで同じ装備を2つ合わせると、回数がふえる。`,
  exit: '',
};

const hint = (text) => (text ? el('div', { class: 'detail', text }) : null);

// 生まれ変わりの もとに なる 店の 武器（銅の剣 など。items-alchemy.js の REBIRTH_START）
const REBIRTH_FROM = new Set(REBIRTH_START.map((x) => x.from));
const isRebirthSeed = (id) => REBIRTH_FROM.has(ITEMS[id]?.base || id);
const seedOf = (id) => REBIRTH_START.find((x) => x.from === (ITEMS[id]?.base || id));

// 「鉄のかけら2個・星のかけら1個」
export function matsText(mats) {
  return mats.map(([id, n]) => `${ITEMS[id]?.name || id}${n}個`).join('・');
}

// 必要な 素材と ゴールド（いる数・持っている数。たりない ものは 赤）
function costBlock(game, cost) {
  const me = game.me;
  const box = el('div', { class: 'forge-cost' },
    el('span', { class: 'hd', text: '必要な物' }), el('span', { class: 'hd n', text: 'いる' }), el('span', { class: 'hd n', text: '持っている' }));
  const row = (name, need, have, ok) => box.append(
    el('span', { class: 'nm', text: name }), el('span', { class: 'n', text: need }), el('span', { class: `n ${ok ? 'ok' : 'ng'}`, text: have }));
  for (const [id, n] of cost.mats) {
    const have = itemCount(me, id);
    row(ITEMS[id]?.name || id, `${n}`, `${have}`, have >= n);
  }
  row('ゴールド', `${cost.gold}`, `${me.gold}`, me.gold >= cost.gold);
  return box;
}

export async function forgeUI(game, data) {
  bindAlchemy(game);
  const ct = new Counter(game, { title: data.name || 'ふしぎなかじ屋', keeper: data.keeper || 'かじ屋', icon: boardIconURL('smith') });
  let line = data.hello || 'ここはふしぎなかじ屋だ。\n今日は何をする？';
  // 第32回: れん金がまを もらう・れん金の コツを 教わる（world/alchemy.js の forgePotGift）
  if (data.gift) {
    await ct.say(data.gift);
    await ct.tap();
    game.audio.sfx('key');
    await ct.say(data.giftNote, { narr: true });
    await ct.tap();
  } else if (data.tip) {
    await ct.say(data.tip);
    await ct.tap();
  }
  while (!ct.closed) {
    await ct.say(line);
    ct.info(hint(HINTS.craft));
    const cmd = await ct.pick([
      { label: '作る', value: 'craft' },
      { label: 'きたえる', value: 'upgrade' },
      { label: 'やめる', value: 'exit' },
    ], { back: null, onMove: (x) => ct.info(hint(HINTS[x?.value])) });
    if (ct.closed) return;
    if (!cmd || cmd.value === 'exit') break;
    if (cmd.value === 'craft') await craftLoop(game, ct, data);
    else await upgradeLoop(game, ct);
    line = 'ほかに何かするか？';
  }
  if (ct.closed) return;
  ct.list(null);
  ct.info(null);
  await ct.say('またいつでも来てくれ。\n良い素材が手に入ったら、見せてくれよ。');
  await ct.tap(1400);
  ct.close();
}

// ───────────── 作る ─────────────
function recipeBox(game, id) {
  const r = recipeOf(id);
  const box = itemInfo(game, id);
  if (!box || !r) return box;
  box.insertBefore(costBlock(game, r), box.children[2] || null);
  return box;
}

async function craftLoop(game, ct, data) {
  let line = '何を作る？';
  let idx = 0;
  while (!ct.closed) {
    await ct.say(line);
    const rows = (data.recipes || []).filter((id) => ITEMS[id] && recipeOf(id)).map((id) => {
      const lack = lackOf(game.me, recipeOf(id));
      return {
        value: id,
        label: ITEMS[id].name,
        html: `${esc(ITEMS[id].name)}${lack.ok ? '<span class="tag up">作れる</span>' : ''}`,
        right: `${recipeOf(id).gold}G`,
        rightCls: lack.ok ? 'gold' : 'dis',
      };
    });
    if (data.locked) rows.push({ value: '__locked', html: `<span class="muted">？？？　×${data.locked}</span>`, right: 'ひみつ', disabled: true });
    const pick = await ct.pick(rows, {
      start: idx,
      onMove: (x) => ct.info(x?.value === '__locked' ? hint('物語が進むと、作れる物がふえる。\n新しい素材を見つけたら、また来てくれ。') : x ? recipeBox(game, x.value) : null),
    });
    if (ct.closed || !pick) return;
    idx = rows.findIndex((r) => r.value === pick.value);
    line = await craftOne(game, ct, pick.value);
  }
}

async function craftOne(game, ct, id) {
  const it = ITEMS[id];
  const r = recipeOf(id);
  const AGAIN = 'ほかに作る物はあるか？';
  const lack = lackOf(game.me, r);
  if (lack.mats.length) {
    await ct.say(`${it.name}を作るには、\n${matsText(r.mats)}がいる。\n素材が足りないようだな。`);
    await ct.tap(2400);
    return AGAIN;
  }
  if (lack.gold) {
    await ct.say(`${it.name}を作るには、${r.gold}ゴールドいる。\nおや？ゴールドが足りないようだな。`);
    await ct.tap(2000);
    return AGAIN;
  }
  const yes = await ct.ask(`${it.name}を作るには、\n${matsText(r.mats)}と${r.gold}ゴールドがいる。\n作るか？`);
  if (ct.closed || yes !== 0) return AGAIN;
  let who = null;
  const rows = compareTeam(game, id);
  if (rows.some((x) => x.can && !x.same)) {
    const now = await ct.ask('完成したら、すぐに装備するか？');
    if (ct.closed) return AGAIN;
    if (now === 0) {
      await ct.say('だれが装備する？');
      const w = await ct.pick(whoItems(rows), { box: 'info', back: '装備しない' });
      if (w) who = w.value;
    }
  }
  if (ct.closed) return AGAIN;
  game.audio.sfx('hammer');
  const res = await request(game, { kind: 'forge', action: 'craft', id, who });
  ct.updGold();
  if (!res.ok) {
    await ct.say(res.text || 'おや？何かおかしいようだな。');
    await ct.tap(2000);
    return AGAIN;
  }
  setTimeout(() => game.audio.sfx(who ? 'buff' : 'item'), 700);
  ct.info(recipeBox(game, id));
  await ct.say(res.text, { narr: true });
  await ct.tap(2600);
  return `いい仕上がりだろう？\n${AGAIN}`;
}

// ───────────── きたえる ─────────────
// きたえられる 装備（装備している 物 → ふくろの 物）。まものの 仲間が 武器や よろいを 装備しても おなじ
function candidates(game) {
  const out = [];
  // 店で 買える 装備（★1）は きたえられない ので 出さない。生まれ変わりの もとの 店の 武器だけ（seed）出す（第35回）
  const shown = (id) => !isShopForge(id) || isRebirthSeed(id);
  for (const m of myTeam(game)) {
    for (const slot of UPGRADE_TYPES) {
      const id = m.char.equip?.[slot];
      if (id && ITEMS[id] && shown(id)) out.push({ id, who: m.key, whoName: m.name, char: m.char, seed: isShopForge(id) });
    }
  }
  for (const e of game.me.items || []) {
    if (e.n > 0 && UPGRADE_TYPES.includes(ITEMS[e.id]?.type) && shown(e.id)) out.push({ id: e.id, who: null, n: e.n, seed: isShopForge(e.id) });
  }
  return out;
}

function statLines(id) {
  const it = ITEMS[id];
  const out = new Map();
  if (it.type === 'weapon') out.set('atk', ['攻撃力', it.atk || 0]);
  else out.set('def', ['守備力', it.def || 0]);
  for (const [k, v] of Object.entries(it.bonus || {})) out.set(k, [BONUS_NAMES[k] || k, v]);
  return out;
}

const signed = (k, v) => (k === 'atk' || k === 'def' ? `${v}` : `${v > 0 ? '+' : ''}${v}`);

// きたえる 前 → あと
function upgradeBox(game, cand) {
  const it = ITEMS[cand.id];
  const cost = upgradeCost(cand.id);
  const box = el('div', { class: 'ct-item forge-up' });
  // 第35回: 生まれ変わりの もとに なる 店の 武器 … きたえられないが、れん金がまで 生まれ変わる（第36回: かくさない）
  if (cand.seed) {
    const x = seedOf(cand.id);
    const to = ITEMS[x?.to]?.name || '？？？';
    box.append(el('div', { class: 'hd' }, el('span', { class: 'gold', text: `${it.name} → ${to}` }), el('span', { class: 'rk', text: rankText(cand.id) })));
    if (cand.who) box.append(el('div', { class: 'small muted', text: `${cand.whoName}が装備している` }));
    const how = !hasPot(game.me)
      ? 'カモメ港へ行くと、どこかのかじ屋で「れん金がま」をもらえる。\nかまに入れると、生まれ変わるぞ。'
      : knowsRecipe(game.me, x.id)
        ? `れん金がまに「${insText([x.from, x.mat, 'star_shard'])}」を入れると、${to}に生まれ変わる！`
        : 'れん金がまで、星のかけらと何かを合わせると、生まれ変わる。\n作り方は、本だな・れん金のメモ・かじ屋の親方からわかるぞ。';
    box.append(el('div', { class: 'small forge-reborn forge-seed', style: { whiteSpace: 'pre-line' }, text: `店の品なので、きたえられない。\n…でも、${it.name}が、かすかに光っている。\n${how}` }));
    return box;
  }
  // 生まれ変わる: 何に なるかも 見せる（第36回: かくさない）
  const title = cost ? `${it.name} → ${ITEMS[cost.to]?.name || '？？？'}` : it.name;
  box.append(el('div', { class: 'hd' }, el('span', { class: 'gold', text: title }), el('span', { class: 'rk', text: rankText(cand.id) })));
  if (!cost) {
    if (cand.who) box.append(el('div', { class: 'small muted', text: `${cand.whoName}が装備している` }));
    box.append(el('div', { class: 'detail', text: UPGRADE_TYPES.includes(it.type) ? `これ以上はきたえられない。\n（この装備は+${maxPlus(cand.id)}まで。ランクが高い装備ほど、たくさんきたえられる。れん金がまで同じ装備を2つ合わせると、ふやせる）` : 'これはきたえられない。' }));
    return box;
  }
  if (cost.reborn) {
    box.append(el('div', { class: 'detail forge-reborn', text: `${it.name}が、ふしぎな光をはなっている…。\nもう1回きたえると、${ITEMS[cost.to]?.name || '新しい武器'}に生まれ変わる！` }));
    box.append(costBlock(game, cost));
    return box;
  }
  // きたえられる 回数（ランクで きまる ＋ れん金で ふやした 回数）。生まれ変わる 武器は 上限を こえても きたえられる
  box.append(el('div', { class: 'small muted forge-limit', text: cost.over
    ? `この装備は+${maxPlus(cand.id)}まで…のはずだが、\nまだきたえられそうだ。（今は+${it.plus || 0}）`
    : `この装備は+${maxPlus(cand.id)}まできたえられる。（今は+${it.plus || 0}）` }));
  const before = statLines(cand.id);
  const after = statLines(cost.to);
  const tbl = el('div', { class: 'forge-stats' });
  for (const k of new Set([...before.keys(), ...after.keys()])) {
    const [name] = before.get(k) || after.get(k);
    const a = after.get(k)?.[1] ?? 0;
    const bv = before.get(k)?.[1] ?? 0;
    tbl.append(el('div', { class: `forge-stat ${a !== bv ? 'chg' : ''}` },
      el('span', { class: 'nm', text: name }), el('span', { class: 'b', text: signed(k, bv) }), el('span', { class: 'ar', text: '→' }),
      el('span', { class: `a ${a > bv ? 'up' : ''}`, text: signed(k, a) })));
  }
  box.append(tbl);
  // 装備している 人の 強さ
  if (cand.char) {
    const slot = it.type;
    const s0 = computeStats(cand.char);
    const s1 = computeStats({ ...cand.char, equip: { ...(cand.char.equip || {}), [slot]: cost.to } });
    const key = slot === 'weapon' ? 'atk' : 'dfn';
    box.append(el('div', { class: 'small forge-who' }, `E ${cand.whoName}の${slot === 'weapon' ? '攻撃力' : '守備力'} ${s0[key]} → `,
      el('span', { class: 'up', text: `${s1[key]}` })));
  }
  box.append(costBlock(game, cost));
  return box;
}

// ───────────── 生まれ変わり ─────────────
const REBORN_CSS = `
.reborn-flash { position: fixed; inset: 0; z-index: 30; pointer-events: none; background: radial-gradient(circle at 50% 45%, #fff 0%, #fff6c8 30%, rgba(255, 214, 107, 0.4) 60%, rgba(255, 214, 107, 0) 80%); animation: reborn-flash 1.6s ease-out forwards; }
@keyframes reborn-flash { 0% { opacity: 0; } 12% { opacity: 1; } 100% { opacity: 0; } }
.ct-item.reborn { border: 2px solid #ffd66b; border-radius: 8px; padding: 0.4em; box-shadow: 0 0 14px rgba(255, 214, 107, 0.55); animation: reborn-glow 1.8s ease-in-out infinite alternate; }
.ct-item.reborn .rb-hd { color: #ffd66b; font-size: 1.1em; text-align: center; margin-bottom: 0.2em; }
@keyframes reborn-glow { from { box-shadow: 0 0 6px rgba(255, 214, 107, 0.35); } to { box-shadow: 0 0 18px rgba(255, 214, 107, 0.85); } }
`;
let rebornCss = false;
async function rebornScene(game, ct, res) {
  if (!rebornCss) {
    rebornCss = true;
    document.head.append(el('style', { text: REBORN_CSS }));
  }
  const flash = el('div', { class: 'reborn-flash' });
  document.getElementById('ui').append(flash);
  setTimeout(() => flash.remove(), 1700);
  game.audio.sfx('hirameki');
  setTimeout(() => game.audio.sfx('sparkle'), 900);
  const box = itemInfo(game, res.upgraded);
  if (box) {
    box.classList.add('reborn');
    box.prepend(el('div', { class: 'rb-hd', text: '✦ 生まれ変わった！ ✦' }));
  }
  ct.info(box);
  await ct.say(res.text, { narr: true });
  await ct.tap(4200);
}

async function upgradeLoop(game, ct) {
  let line = 'どれをきたえる？';
  let idx = 0;
  const AGAIN = 'ほかにきたえる物はあるか？';
  while (!ct.closed) {
    const list = candidates(game);
    if (!list.length) {
      ct.list(null);
      ct.info(null);
      await ct.say('おや？きたえられる装備を持っていないようだな。\n店の品（★1）は、きたえられないんだ。');
      await ct.tap(1800);
      return;
    }
    await ct.say(line);
    const rows = list.map((c, i) => {
      const cost = upgradeCost(c.id);
      const lack = cost ? lackOf(game.me, cost) : null;
      return {
        value: i,
        label: ITEMS[c.id].name,
        html: `${c.who ? '<span class="tag e">E</span>' : ''}${rareNameHtml(c.id)}${c.who ? `<span class="cnt">${esc(c.whoName)}</span>` : c.n > 1 ? `<span class="cnt">×${c.n}</span>` : ''}`,
        right: c.seed ? '？？？' : cost ? (cost.reborn ? '？？？' : `+${cost.n}へ${cost.over ? '？' : ''}`) : '最大',
        rightCls: !cost ? 'muted' : lack.ok ? 'gold' : 'dis',
        disabled: !canUpgrade(c.id),
      };
    });
    const pick = await ct.pick(rows, { start: Math.min(idx, rows.length - 1), onMove: (x) => ct.info(x ? upgradeBox(game, list[x.value]) : null) });
    if (ct.closed || !pick) return;
    idx = pick.value;
    const cand = list[pick.value];
    const it = ITEMS[cand.id];
    const cost = upgradeCost(cand.id);
    if (!cost) continue;
    const lack = lackOf(game.me, cost);
    if (!lack.ok) {
      await ct.say(`${it.name}を${cost.reborn ? 'もう1回' : `+${cost.n}に`}きたえるには、\n${matsText(cost.mats)}と${cost.gold}ゴールドがいる。\n${lack.mats.length ? '素材が足りないようだな。' : 'ゴールドが足りないようだな。'}`);
      await ct.tap(2600);
      line = AGAIN;
      continue;
    }
    const yes = await ct.ask(cost.reborn
      ? `${it.name}をもう1回きたえるには、\n${matsText(cost.mats)}と${cost.gold}ゴールドがいる。\n…何かが起こりそうだ。きたえるか？`
      : `${it.name}を+${cost.n}にきたえるには、\n${matsText(cost.mats)}と${cost.gold}ゴールドがいる。\nきたえるか？`);
    if (ct.closed) return;
    if (yes !== 0) {
      line = AGAIN;
      continue;
    }
    game.audio.sfx('hammer');
    const res = await request(game, { kind: 'forge', action: 'upgrade', id: cand.id, who: cand.who });
    ct.updGold();
    if (!res.ok) {
      await ct.say(res.text || 'おや？何かおかしいようだな。');
      await ct.tap(2000);
      line = AGAIN;
      continue;
    }
    // 生まれ変わり（かくし要素）の 場面
    if (res.reborn) {
      await rebornScene(game, ct, res);
      line = `なんと…！こんなことがあるなんて！\n${AGAIN}`;
      continue;
    }
    setTimeout(() => game.audio.sfx('sparkle'), 800);
    // きたえた あとの 品を みぎに（つぎの 回へ）
    const next = candidates(game).find((c) => c.id === res.upgraded && c.who === cand.who);
    if (next) ct.info(upgradeBox(game, next));
    await ct.say(res.text, { narr: true });
    await ct.tap(2600);
    line = `うむ、いい出来だ。\n${AGAIN}`;
  }
}
