// ふしぎなかじ屋（作る・きたえる）の そうさ
import { ITEMS } from '../data/items.js?v=eb1c3a4395d7';
import { FORGES } from '../data/facilities.js?v=eb1c3a4395d7';
import { RECIPES, recipeOf, recipeOpen, openRecipes, upgradeCost, lackOf, maxPlus, isShopForge } from '../data/forge.js?v=eb1c3a4395d7';
import { addItem, removeItem, itemCount, canEquipChar, computeStats } from '../stats.js?v=eb1c3a4395d7';
import { partyOf } from './party.js?v=eb1c3a4395d7';
import { BAG_STACK } from './bank.js?v=eb1c3a4395d7';
import { forgePotGift } from './alchemy.js?v=eb1c3a4395d7';
import { salvageOf, salvageBlock } from '../data/salvage.js?v=eb1c3a4395d7';
import { LB_MAX } from '../data/items-forge.js?v=eb1c3a4395d7';

export function forgeInfo(world, s, place) {
  const f = FORGES[place] || FORGES.town;
  const open = openRecipes(world.hasFlagFn(s)).map((r) => r.id);
  const at = FORGES[place] ? place : 'town';
  // 第32回: れん金がまを もらう・れん金の レシピを 1つ 教わる（world/alchemy.js）
  const gift = forgePotGift(world, s, at);
  return { place: at, name: f.name, keeper: f.keeper, hello: f.hello, recipes: open, locked: RECIPES.length - open.length, ...gift };
}

function pay(c, cost) {
  c.gold -= cost.gold;
  for (const [id, n] of cost.mats) removeItem(c, id, n);
}

// reply(ok, text, extra) で こたえる。helpers: { equipItem, ownChar }（services.js）
export function forgeAction(world, s, msg, reply, { equipItem, ownChar }) {
  const c = s.char;
  switch (msg.action) {
    case 'craft': {
      const r = recipeOf(msg.id);
      const it = r && ITEMS[r.id];
      if (!it || !recipeOpen(r, world.hasFlagFn(s))) return reply(false, 'それは、まだ作れないな。');
      const lack = lackOf(c, r);
      if (lack.mats.length) return reply(false, `素材が足りないようだ。\n（${lack.mats.map((m) => `${ITEMS[m.id]?.name || m.id}があと${m.need - m.have}個`).join('・')}）`);
      if (lack.gold) return reply(false, 'おや？ゴールドが足りないようだな。');
      if (itemCount(c, r.id) >= BAG_STACK) return reply(false, `${it.name}は、もう持ちきれないようだ。`);
      // だれが 装備する？（じぶん か じぶんの 仲間）
      const who = msg.who ? ownChar(s, msg.who) : null;
      if (msg.who && (!who || !canEquipChar(who, r.id))) return reply(false, 'その人は装備できないようだ。');
      pay(c, r);
      addItem(c, r.id, 1);
      const lines = [`${it.name}が完成した！`];
      if (who) {
        const old = who.equip[it.type];
        equipItem(who, r.id, c);
        lines.push(`${who.name}は${it.name}を装備した！`);
        if (old) lines.push(`${ITEMS[old]?.name || old}は、ふくろに入れた。`);
        if (who !== c) world.sendParty(partyOf(world, s));
      } else {
        lines.push(`${it.name}は、ふくろに入れた。`);
      }
      return reply(true, lines.join('\n'), { made: r.id, equipped: !!who });
    }
    case 'upgrade': {
      // れん金で ふやした 回数は 持ち主（自分）の きろく
      const cost = upgradeCost(msg.id, c);
      if (!cost) {
        // 第35回: 店で 買える 装備（★1）は きたえられない
        if (isShopForge(msg.id)) return reply(false, 'それは店で売っている品だな。\n店の品（★1）は、きたえられないんだ。');
        const top = maxPlus(msg.id, c);
        if (top && (ITEMS[msg.id]?.lb || 0) >= LB_MAX) return reply(false, `それは、もう★${LB_MAX}まで限界とっぱしているな。\nこれ以上は、わしにもむりだ。`);
        return reply(false, top ? `それは、これ以上きたえられないな。\n（その装備は+${top}まで。ランクが高い装備ほど、たくさんきたえられる）` : 'それは、きたえられないな。');
      }
      // who … 装備している 人（じぶん か じぶんの 仲間）。ない ときは ふくろの 品
      const owner = msg.who ? ownChar(s, msg.who) : null;
      const slot = ITEMS[msg.id].type;
      if (msg.who) {
        if (!owner || owner.equip?.[slot] !== msg.id) return reply(false, 'その装備は見当たらないな。');
      } else {
        if (itemCount(c, msg.id) < 1) return reply(false, 'それは持っていないようだな。');
        if (itemCount(c, cost.to) >= BAG_STACK) return reply(false, `${ITEMS[cost.to].name}は、もう持ちきれないようだ。`);
      }
      if (cost.reborn && owner && !canEquipChar(owner, cost.to)) return reply(false, 'その人は、生まれ変わった武器を装備できないようだ。');
      const lack = lackOf(c, cost);
      if (lack.mats.length) return reply(false, `素材が足りないようだ。\n（${lack.mats.map((m) => `${ITEMS[m.id]?.name || m.id}があと${m.need - m.have}個`).join('・')}）`);
      if (lack.gold) return reply(false, 'おや？ゴールドが足りないようだな。');
      pay(c, cost);
      if (owner) {
        owner.equip[slot] = cost.to;
        const st = computeStats(owner);
        owner.hp = Math.min(owner.hp, st.maxHp);
        owner.mp = Math.min(owner.mp, st.maxMp);
        if (owner !== c) world.sendParty(partyOf(world, s));
      } else {
        removeItem(c, msg.id, 1);
        addItem(c, cost.to, 1);
      }
      // 生まれ変わり（かくし要素）
      if (cost.reborn) return reply(true, `カン！カン！カン！\n…なんと！\n${ITEMS[msg.id].name}は、${ITEMS[cost.to].name}に生まれ変わった！`, { upgraded: cost.to, who: msg.who || null, reborn: true, from: msg.id });
      // 第65回: 限界とっぱ
      if (cost.limit) return reply(true, `カン！カン！…キィィン！\n${ITEMS[msg.id].name}は、限界をこえて\n${ITEMS[cost.to].name}になった！${cost.lb === 1 ? '\n（れん金の効果を2つつけられるようになった）' : ''}`, { upgraded: cost.to, who: msg.who || null, limit: cost.lb });
      return reply(true, `カン！カン！カン！\n${ITEMS[msg.id].name}は、${ITEMS[cost.to].name}になった！`, { upgraded: cost.to, who: msg.who || null });
    }
    // 第64回 ⑥b: 分解（ふくろの 装備 1つ → 素材。data/salvage.js）
    case 'salvage': {
      const id = String(msg.id || '');
      const block = salvageBlock(id);
      if (block) return reply(false, block);
      if (itemCount(c, id) < 1) return reply(false, 'それは持っていないようだな。\n（装備している物は、外してから分解してくれ）');
      const mats = salvageOf(id);
      const full = mats.find(([m, n]) => itemCount(c, m) + n > BAG_STACK);
      if (full) return reply(false, `${ITEMS[full[0]].name}は、もう持ちきれないようだ。`);
      removeItem(c, id, 1);
      for (const [m, n] of mats) addItem(c, m, n);
      return reply(true, `トン、トン、トン…\n${ITEMS[id].name}を分解した！\n${mats.map(([m, n]) => `${ITEMS[m].name}を${n}個`).join('・')}手に入れた！`, { salvaged: id, mats });
    }
    default:
      return reply(false, '');
  }
}
