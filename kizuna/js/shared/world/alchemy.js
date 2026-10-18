// れん金がま（第32回 C）の うごき。きまりは data/alchemy.js
//   forgePotGift … かじ屋で かまを もらう・親方が レシピを 1つ 教えて くれる（world/forge.js の forgeInfo）
//   alchemyAction … かまの そうさ（svc の kind 'alchemy'。status・put）
//   alchemySteps … 歩くと できあがりに 近づく（world.js の onMove。マスが かわった ときの 歩数）
//   alchemyShelf … 本だなで れん金の 本を 読む（world.js の searchTile）
//   useAlchemyMemo … れん金のメモを 使う（services.js の useItem）
//   alchemyMemoLoot … フィールドの 宝箱に メモが 入っている ことが ある（world/fieldchests.js）
//   repairAlchemy・mergeAlchemy … セーブを ととのえる・データ合わせ
import { ITEMS, baseItemId } from '../data/items.js?v=cd32925e7010';
import { addItem, removeItem, itemCount, ownsItem } from '../stats.js?v=cd32925e7010';
import {
  ALCHEMY_POT, ALCHEMY_MEMO, POT_FLAG, STARTER_RECIPES, KEEPER_RECIPES, MERGE_RECIPE, CAP_UP_MAX, RECIPE_BY_ID,
  hasPot, matchPot, learnableRecipes, knowsRecipe, insText, capUp, POT_FAST_JOBS, POT_FAST_RATE,
} from '../data/alchemy.js?v=cd32925e7010';
import { partyOf } from './party.js?v=cd32925e7010';
import { bossRareOf } from '../data/rare-loot.js?v=cd32925e7010';

// 本だなの きろくの 数（多すぎる ときは 古い ものから わすれる）
const SHELF_MAX = 400;

function rec(c) {
  if (!c.alchemy || typeof c.alchemy !== 'object' || Array.isArray(c.alchemy)) c.alchemy = {};
  return c.alchemy;
}
// レシピを 覚える（新しく 覚えたら true）
export function learnRecipe(c, id) {
  if (!RECIPE_BY_ID[id]) return false;
  const a = rec(c);
  if (!Array.isArray(a.known)) a.known = [];
  if (a.known.includes(id)) return false;
  a.known.push(id);
  return true;
}
const ownFlags = (c) => (f) => !!c?.flags?.[f];
// 同じ 章の 中から 1つ（早い 章を 先に）
function pickLearnable(list, rng) {
  if (!list.length) return null;
  const t = list[0].tier;
  const same = list.filter((r) => r.tier === t);
  return rng ? rng.pick(same) : same[0];
}
const recipeLine = (r) => `「${insText(r.ins)}」で、${ITEMS[r.out].name}ができる`;

// ───────────── かじ屋で もらう・教わる ─────────────
// かまを もらう（カモメ港に 着いた あと。どの かじ屋でも）。もう 持っていれば、その 親方の レシピを 1つ 教わる
// かえす: { gift?: もらった ときの 文, tip?: 教わった ときの 文 }
export function forgePotGift(world, s, place) {
  const c = s.char;
  if (!c) return {};
  if (!hasPot(c)) {
    if (!c.flags?.[POT_FLAG]) return {};
    addItem(c, ALCHEMY_POT, 1);
    for (const id of STARTER_RECIPES) learnRecipe(c, id);
    world.sendSelf(s);
    world.markDirty();
    return {
      gift: 'おっと、そうだ。これを持っていけ。\nむかし使っていた「れん金がま」だ。\n装備や道具を入れて歩くと、新しい物ができる。',
      giftNote: `${c.name}は、れん金がまを手に入れた！\n（メニューの「道具」のいちばん上から使える）`,
    };
  }
  // 第36回: 生まれ変わりの 武器の レシピを 先に
  const list = learnableRecipes(c, ownFlags(c), KEEPER_RECIPES[place] || []);
  const reborn = list.filter((x) => x.reborn);
  const r = pickLearnable(reborn.length ? reborn : list, null);
  if (!r) return {};
  learnRecipe(c, r.id);
  world.sendSelf(s);
  world.markDirty();
  return { tip: `そうだ、れん金のコツを1つ教えよう。\n${recipeLine(r)}ぞ。` };
}

// ───────────── れん金術師が いると 歩数が 半分（第33回） ─────────────
// いっしょに 歩いている パーティー（自分・家族・仲間）で、れん金術師の 系統に 今 ついている 人（いなければ null）
export function potHelper(world, s) {
  const chars = [s?.char];
  const p = world?.parties && s ? partyOf(world, s) : null;
  if (p) {
    for (const sid of p.members || []) chars.push(world.sessions?.get(sid)?.char);
    for (const x of p.supports || []) chars.push(x?.char);
  }
  return chars.find((c) => c && !c.species && POT_FAST_JOBS.includes(c.job)) || null;
}
// 1歩で 何歩ぶん 進むか（れん金術師が いれば POT_FAST_RATE）
export function potRate(world, s) {
  return potHelper(world, s) ? POT_FAST_RATE : 1;
}

// ───────────── かまの そうさ ─────────────
// 画面に 出す かまの ようす（できる 物の 名前は、知っている レシピ だけ）。rate … potRate（のこりの 歩数を その ぶん へらして 見せる）
export function potView(c, rate = 1) {
  const p = c?.alchemy?.pot;
  if (!p || !ITEMS[p.out]) return null;
  return { out: p.out, left: Math.max(1, Math.ceil(p.left / (rate || 1))), merge: p.merge || null, known: p.recipe === MERGE_RECIPE || knowsRecipe(c, p.recipe), ins: p.ins || [] };
}

// reply(ok, text, extra)
export function alchemyAction(world, s, msg, reply) {
  const c = s.char;
  if (!hasPot(c)) return reply(false, 'れん金がまを持っていない。');
  switch (msg.action) {
    case 'status': return reply(true, '', { pot: potView(c, potRate(world, s)) });
    case 'put': {
      if (s.busy) return reply(false, '今はできない。');
      if (c.alchemy?.pot) return reply(false, 'れん金がまの中では、まだ何かが完成するのを待っている。', { pot: potView(c, potRate(world, s)) });
      const ids = Array.isArray(msg.ids) ? msg.ids.filter((x) => typeof x === 'string').slice(0, 4) : [];
      if (ids.length < 2) return reply(false, '2つ以上入れよう。');
      if (ids.length > 3) return reply(false, '入れられるのは3つまで。');
      // ふくろに あるか（同じ 物を 2つ 入れる ときは 2つ いる）
      const need = new Map();
      for (const id of ids) need.set(id, (need.get(id) || 0) + 1);
      for (const [id, n] of need) if (!ITEMS[id] || ITEMS[id].type === 'key' || itemCount(c, id) < n) return reply(false, 'ふくろに入っていない物がある。');
      const m = matchPot(ids, c);
      if (!m.ok) {
        if (m.why === 'shop') return reply(false, `${ITEMS[baseItemId(ids[0])].name}は店の品（★1）なので、\n2つ合わせても、きたえられる回数はふえない。\n（入れた物は、ふくろにもどした）`);
        if (m.why === 'capMax') return reply(false, `${ITEMS[baseItemId(ids[0])].name}は、もうこれ以上きたえられる回数をふやせない。\n（ふやせるのは${CAP_UP_MAX}回まで）`);
        return reply(false, `${insText(ids)}…\nこの組み合わせは、うまくいきそうにない。\n（入れた物は、ふくろにもどした）`);
      }
      for (const [id, n] of need) removeItem(c, id, n);
      const known = m.recipe === MERGE_RECIPE || knowsRecipe(c, m.recipe);
      rec(c).pot = { out: m.out, recipe: m.recipe, left: m.steps, ins: ids, ...(m.merge ? { merge: m.merge } : {}) };
      const name = ITEMS[m.out].name;
      // 第33回: れん金術師が いると 歩数が 半分
      const helper = potHelper(world, s);
      const rate = helper ? POT_FAST_RATE : 1;
      const steps = Math.ceil(m.steps / rate);
      let text;
      if (m.merge) text = `${insText(ids)}を、れん金がまに入れた！\nあと${steps}歩ほど歩くと、\n${ITEMS[m.merge].name}のきたえられる回数がふえる。`;
      else if (known) text = `${insText(ids)}を、れん金がまに入れた！\nあと${steps}歩ほど歩くと、${name}ができる。`;
      else text = `${insText(ids)}を、れん金がまに入れた！\n…うまくいきそうだ！\nあと${steps}歩ほど歩くと、何かができる。`;
      if (helper) text += `\n（${helper.name}のれん金術で、歩数が半分！）`;
      world.markDirty();
      return reply(true, text, { pot: potView(c, rate), steps });
    }
    default: return reply(false, '');
  }
}

// ───────────── 歩くと できあがる ─────────────
// n … 前の マスから 何マス 動いたか（world.js の onMove）。空を 飛んでいる 間は 数えない
export function alchemySteps(world, s, n) {
  const c = s?.char;
  const p = c?.alchemy?.pot;
  if (!p || !(n > 0) || s.flying) return false;
  // 第33回: れん金術師が パーティーに いると 1歩で 2歩ぶん
  p.left = (Number(p.left) || 0) - n * potRate(world, s);
  world.markDirty();
  if (p.left > 0) return false;
  finishPot(world, s);
  return true;
}

// できあがり: ふくろに 入れて、知らせる
export function finishPot(world, s) {
  const c = s.char;
  const p = c.alchemy?.pot;
  if (!p) return null;
  delete c.alchemy.pot;
  const it = ITEMS[p.out];
  if (!it) return null;
  addItem(c, p.out, 1);
  let text;
  if (p.merge) {
    const a = rec(c);
    a.cap = a.cap && typeof a.cap === 'object' ? a.cap : {};
    a.cap[p.merge] = Math.min(CAP_UP_MAX, capUp(c, p.merge) + 1);
    text = `れん金がまで\n${it.name}が完成した！\n${ITEMS[p.merge].name}は、きたえられる回数が1ふえた！\n（ふくろに入れた）`;
  } else {
    const fresh = learnRecipe(c, p.recipe);
    text = `れん金がまで\n${it.name}が完成した！\n（ふくろに入れた）${fresh ? '\n新しいレシピを覚えた！' : ''}`;
  }
  world.send(s, { t: 'toast', text, sfx: 'sparkle', afterBattle: true });
  world.sendSelf(s);
  world.markDirty();
  return { out: p.out, text };
}

// ───────────── 本だな・メモ・宝箱 ─────────────
// 本だなを 調べた（key: 'マップ:x:y'）。かまを 持っていて、まだ 読んでいない 本だなで、わかる レシピが あれば 1つ
// かえす: runSteps に わたす steps か null（ふつうの 本だなと おなじ）
export function alchemyShelf(world, s, key) {
  const c = s.char;
  if (!hasPot(c)) return null;
  const a = rec(c);
  if (!Array.isArray(a.shelves)) a.shelves = [];
  if (a.shelves.includes(key)) return null;
  const r = pickLearnable(learnableRecipes(c, ownFlags(c)), world.rng);
  if (!r) return null;
  a.shelves.push(key);
  if (a.shelves.length > SHELF_MAX) a.shelves.splice(0, a.shelves.length - SHELF_MAX);
  learnRecipe(c, r.id);
  world.sendSelf(s);
  world.markDirty();
  return [['sfx', 'item'], ['say', null, `本だなに、れん金の本があった！\n${recipeLine(r)}らしい。\n新しいレシピを覚えた！`]];
}

// れん金のメモを 使う（わかる レシピが ない ときは へらない）
export function useAlchemyMemo(world, s, id, reply) {
  const c = s.char;
  const r = pickLearnable(learnableRecipes(c, ownFlags(c)), world.rng);
  if (!r) return reply(false, 'れん金のメモを読んだ。\nでも、もう知っていることばかりだ。');
  removeItem(c, id, 1);
  learnRecipe(c, r.id);
  return reply(true, `れん金のメモを読んだ。\n${recipeLine(r)}らしい！\n新しいレシピを覚えた！`);
}

// フィールドの 宝箱（かまを 持っていて、わかる レシピが 残っている 人だけ。6回に 1回）
export const MEMO_CHEST_RATE = 1 / 6;
export function alchemyMemoLoot(c, rng) {
  if (!hasPot(c) || !learnableRecipes(c, ownFlags(c)).length) return null;
  return rng.chance(MEMO_CHEST_RATE) ? { item: ALCHEMY_MEMO, n: 1 } : null;
}

// ───────────── セーブ ─────────────
const str = (v) => typeof v === 'string';
// こわれた 形を なおす（なんど よんでも おなじ）。第32回: もう たおした 物語の ボスの 品（かならず 落とす ように なった）を わたす
export function repairAlchemy(c) {
  if (!c || typeof c !== 'object') return;
  if (c.alchemy !== undefined) {
    const a = c.alchemy;
    if (!a || typeof a !== 'object' || Array.isArray(a)) delete c.alchemy;
    else {
      if (a.known !== undefined) a.known = Array.isArray(a.known) ? [...new Set(a.known.filter((id) => str(id) && RECIPE_BY_ID[id]))] : [];
      if (a.shelves !== undefined) a.shelves = Array.isArray(a.shelves) ? [...new Set(a.shelves.filter(str))].slice(-SHELF_MAX) : [];
      if (a.cap !== undefined) {
        const cap = {};
        if (a.cap && typeof a.cap === 'object') for (const [id, n] of Object.entries(a.cap)) if (ITEMS[id] && Number.isInteger(n) && n > 0) cap[id] = Math.min(CAP_UP_MAX, n);
        a.cap = cap;
      }
      const p = a.pot;
      if (p !== undefined && (!p || typeof p !== 'object' || !ITEMS[p.out] || !Number.isFinite(p.left) || (p.recipe !== MERGE_RECIPE && !RECIPE_BY_ID[p.recipe]) || (p.merge && !ITEMS[p.merge]))) delete a.pot;
    }
  }
  // ボスの 品（人の キャラだけ。たおした ことが ある ボスで、まだ 持っていない 物）
  if (c.species || !c.kills || typeof c.kills !== 'object' || !Array.isArray(c.items)) return;
  if (c.alchemy?.fill) return;
  for (const [sp, n] of Object.entries(c.kills)) {
    const id = n > 0 ? bossRareOf(sp) : null;
    if (!id || ownsItem(c, id)) continue;
    addItem(c, id, 1);
    c.bestiary = c.bestiary && typeof c.bestiary === 'object' ? c.bestiary : {};
    c.bestiary[sp] = { ...(c.bestiary[sp] && typeof c.bestiary[sp] === 'object' ? c.bestiary[sp] : {}), [`drop_${id}`]: 1 };
  }
  rec(c).fill = 1;
}

// データ合わせ（b: わかれる 前・a: こちら・t: あちら）。レシピ・本だなは 両方、回数は 多い ほう、かまの 中は あとで 遊んだ ほう
export function mergeAlchemy(b, a, t, tLater) {
  const A = a && typeof a === 'object' ? a : {};
  const T = t && typeof t === 'object' ? t : {};
  if (!a && !t) return undefined;
  const out = {};
  const union = (k) => {
    const list = [...new Set([...(Array.isArray(A[k]) ? A[k] : []), ...(Array.isArray(T[k]) ? T[k] : [])])];
    if (list.length) out[k] = list;
  };
  union('known');
  union('shelves');
  const cap = {};
  for (const src of [A.cap, T.cap]) if (src && typeof src === 'object') for (const [id, n] of Object.entries(src)) if (Number.isInteger(n)) cap[id] = Math.max(cap[id] || 0, n);
  if (Object.keys(cap).length) out.cap = cap;
  const pot = tLater ? (T.pot ?? A.pot) : (A.pot ?? T.pot);
  if (pot) out.pot = JSON.parse(JSON.stringify(pot));
  if (A.fill || T.fill) out.fill = 1;
  return out;
}
