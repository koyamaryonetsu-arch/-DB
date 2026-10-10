// いま フィールドで つかえる 呪文・技（メニューの 呪文・技の「今使える」タブ）
// サーバーの 'cast'（world/services.js）と おなじ きまりで えらぶ:
//   ・field の ない 技（戦いだけの 技）は 出さない
//   ・掛け合わせ技を 今の 職業で 使えない とき・ぶきが 合わない ときは 出さない
//   ・ルーラは 洞窟や 塔の 中では 出さない（天井に 頭を ぶつける だけ）
//   ・MPが 足りない 技・唱える 人が 死んでいる ときは 出すが えらべない（why: 'mp' / 'dead'）
//   ・呪文が ふうじられた 場所（noSpells。王家のピラミッド 2階）では 呪文を 出すが えらべない（why: 'seal'）
import { ABILITIES } from './data/abilities.js?v=b13027e590f9';
import { ITEMS } from './data/items.js?v=b13027e590f9';
import { learnedAbilities, mpCost, comboAllowed, weaponOk } from './stats.js?v=b13027e590f9';
import { spellSealed } from './battle.js?v=b13027e590f9';

// mapKind: 今いる マップの しゅるい（'field' なら そと）
// へんじ: [{ id, cost, ok, why }]（覚えた じゅん）
export function fieldUsableAbilities(char, { mapKind = 'field', noSpells = false } = {}) {
  if (!char) return [];
  const weaponCat = ITEMS[char.equip?.weapon]?.cat || 'none';
  const out = [];
  for (const id of learnedAbilities(char)) {
    const a = ABILITIES[id];
    if (!a || !a.field) continue;
    if (a.kind === 'combo' && !comboAllowed(char, id)) continue;
    if (!weaponOk(a, weaponCat)) continue;
    if (a.effect?.type === 'warp' && mapKind !== 'field') continue;
    const cost = mpCost(char, id);
    const why = (char.hp ?? 1) <= 0 ? 'dead' : noSpells && spellSealed(a) ? 'seal' : (char.mp || 0) < cost ? 'mp' : '';
    out.push({ id, cost, ok: !why, why });
  }
  return out;
}
