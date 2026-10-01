// ふしぎなかじ屋（作る・きたえる）の そうさ
import { ITEMS } from '../data/items.js?v=3f43270b2d54';
import { FORGES } from '../data/facilities.js?v=3f43270b2d54';
import { RECIPES, recipeOf, recipeOpen, openRecipes, upgradeCost, lackOf } from '../data/forge.js?v=3f43270b2d54';
import { addItem, removeItem, itemCount, canEquipChar, computeStats } from '../stats.js?v=3f43270b2d54';
import { partyOf } from './party.js?v=3f43270b2d54';
import { BAG_STACK } from './bank.js?v=3f43270b2d54';

export function forgeInfo(world, s, place) {
  const f = FORGES[place] || FORGES.town;
  const open = openRecipes(world.hasFlagFn(s)).map((r) => r.id);
  return { place: FORGES[place] ? place : 'town', name: f.name, keeper: f.keeper, hello: f.hello, recipes: open, locked: RECIPES.length - open.length };
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
      const cost = upgradeCost(msg.id);
      if (!cost) return reply(false, 'それは、これ以上きたえられないな。');
      // who … 装備している 人（じぶん か じぶんの 仲間）。ない ときは ふくろの 品
      const owner = msg.who ? ownChar(s, msg.who) : null;
      const slot = ITEMS[msg.id].type;
      if (msg.who) {
        if (!owner || owner.equip?.[slot] !== msg.id) return reply(false, 'その装備は見当たらないな。');
      } else {
        if (itemCount(c, msg.id) < 1) return reply(false, 'それは持っていないようだな。');
        if (itemCount(c, cost.to) >= BAG_STACK) return reply(false, `${ITEMS[cost.to].name}は、もう持ちきれないようだ。`);
      }
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
      return reply(true, `カン！カン！カン！\n${ITEMS[msg.id].name}は、${ITEMS[cost.to].name}になった！`, { upgraded: cost.to, who: msg.who || null });
    }
    default:
      return reply(false, '');
  }
}
