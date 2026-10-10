// 仲間の粉を 使う（メニューの 道具。world/services.js の useItem から よぶ）
// 決まりは data/friend-powder.js。戦いの おわりで へらすのは world/battles.js
import { ITEMS } from '../data/items.js?v=1a19851ff61f';
import { POWDER, powderLeft } from '../data/friend-powder.js?v=1a19851ff61f';
import { itemCount, removeItem } from '../stats.js?v=1a19851ff61f';
import { MAPS } from '../maps/index.js?v=1a19851ff61f';

export function usePowder(world, s, c, id, reply) {
  const it = ITEMS[id];
  if (!it || itemCount(c, id) < 1) return reply(false, '持っていない');
  // 「魔物の心」に 目ざめる 前（道具は へらない）
  if (!c.flags?.monster_bond) return reply(false, `${c.name}は${it.name}をふりかけようとした。\nしかし、まだ魔物の心に目覚めていないので、効き目がなさそうだ…`);
  // ひみつのダンジョンの 中では 魔物は 仲間に ならない（道具は へらない）
  if (MAPS[s.map]?.noBefriend) return reply(false, `ここでは魔物は仲間にならない。\n${it.name}は、ひみつのダンジョンの外で使おう。`);
  const before = powderLeft(c);
  if (before >= POWDER.max) return reply(false, `${it.name}の力は、もう十分にかかっている（のこり${before}回）。`);
  removeItem(c, id, 1);
  c.befriendBoost = Math.min(POWDER.max, before + POWDER.battles);
  world.markDirty?.();
  const add = before ? `\n（のこり${before}回→${c.befriendBoost}回にふえた）` : '';
  return reply(true, `${c.name}は${it.name}をふりかけた！\nこれから${POWDER.battles}回の戦いの間、魔物が仲間になりやすい（${POWDER.mult}倍）。${add}\n（ボスとひみつのダンジョンでは効かない）`);
}
