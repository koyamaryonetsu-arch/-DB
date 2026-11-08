// いま フィールドで つかえる 呪文・技（メニューの 呪文・技の「今使える」タブ）
// サーバーの 'cast'（world/services.js）と おなじ きまりで えらぶ:
//   ・field の ない 技（戦いだけの 技）は 出さない
//   ・掛け合わせ技を 今の 職業で 使えない とき・ぶきが 合わない ときは 出さない
//   ・ルーラは 洞窟や 塔の 中では 出さない（天井に 頭を ぶつける だけ）。リレミトは フィールドでは 出さない
//   ・MPが 足りない 技・唱える 人が 死んでいる ときは 出すが えらべない（why: 'mp' / 'dead'）
//   ・呪文が ふうじられた 場所（noSpells。王家のピラミッド 2階）では 呪文を 出すが えらべない（why: 'seal'）
import { ABILITIES } from './data/abilities.js?v=6495abec1e26';
import { ITEMS } from './data/items.js?v=6495abec1e26';
import { learnedAbilities, mpCost, comboAllowed, weaponOk } from './stats.js?v=6495abec1e26';
import { spellSealed } from './battle.js?v=6495abec1e26';
import { effectTab } from './skill-tabs.js?v=6495abec1e26';
import { sortByStdPower } from './skill-sort.js?v=6495abec1e26';

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
    if (a.effect?.type === 'exit' && mapKind === 'field') continue; // リレミトは 洞窟や 塔の 中だけ（abilities-field27.js）
    const cost = mpCost(char, id);
    const why = (char.hp ?? 1) <= 0 ? 'dead' : noSpells && spellSealed(a) ? 'seal' : (char.mp || 0) < cost ? 'mp' : '';
    out.push({ id, cost, ok: !why, why });
  }
  return out;
}

// 第69回: メニューの「回復」「回復以外」の タブ（家族の ことば「使える技は、回復。回復以外で分けて。使用頻度が多いのは、回復と、ルーラ、リレミト」）
//   list: fieldUsableAbilities の へんじ。heal: 回復・生き返る・どくけし など（戦いの タブの「回復」と おなじ きまり。skill-tabs.js の effectTab）
//   どちらも 弱い じゅん（shared/skill-sort.js）。回復以外は ルーラ・リレミトが いちばん 上
export const FIELD_TOP = ['warp', 'exit'];
export function splitFieldAbilities(list) {
  const byId = new Map((list || []).map((x) => [x.id, x]));
  const ids = sortByStdPower([...byId.keys()]);
  const heal = ids.filter((id) => effectTab(ABILITIES[id]) === 'heal');
  const rest = ids.filter((id) => effectTab(ABILITIES[id]) !== 'heal');
  const top = (id) => {
    const i = FIELD_TOP.indexOf(ABILITIES[id]?.effect?.type);
    return i < 0 ? FIELD_TOP.length : i;
  };
  // sort は おなじ ときは もとの じゅん（弱い じゅん）の まま
  rest.sort((x, y) => top(x) - top(y));
  return { heal: heal.map((id) => byId.get(id)), other: rest.map((id) => byId.get(id)) };
}
