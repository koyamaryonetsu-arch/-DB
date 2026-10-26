// 第44回（ポケモン P1。docs/plan-breed-new.md の 2 の C・D）: 魔物の 進化
//
// レベルで 進化（ピカチュウ・ヒトカゲ・ゼニガメ・フシギダネの 系統。data/companions-pokemon.js の evolve）
//   1. 戦い・サポートの おれい などで レベルが 上がると、stats.js の gainExp が char.evolveTo（進化の 用意）を つける
//   2. 戦いの けっかを 読みおわった あと・台本が おわった あと・ログインした あと（フィールドに もどった とき）に、
//      world.js の tick が「…おや？〇〇のようすが…！」→「みまもる」「とめる」の 台本を その 人だけに 出す（家族の ほかの 人には 出ない）
//      （world/scripts.js の checkEvolve。s.evoCheck が ついた 人を 見る）
//   3. みまもる → 進化（evolveEntry）。とめる → 用意を 消す（次に レベルが 上がった ときに また たずねる）
//   かわらずのいし（everstone）を 装備していると、レベルで 進化しない（用意も つかない）
// 石で 進化（イーブイ。stones）: メニューの「道具」→「使う」で 石を 使うと すぐ 進化（useEvoStone。石は なくなる）
//
// 進化で かわるのは しゅぞく だけ: レベル・＋・受けついだ 強さ（bonus）・受けついだ 技・種・追いつき・血統・ランクの しるしは そのまま。
//   名前は、まだ もとの しゅぞくの 名前（ヒトカゲ・はじめの 名前の 一覧）の ときだけ 新しい しゅぞくの 名前に。
//   新しい すがたで 装備できない 物は ふくろへ。HP・MP は 満タンに。図鑑に のる
import { MONSTERS } from '../data/monsters.js?v=5cf16f1946f7';
import { ITEMS, SLOTS } from '../data/items.js?v=5cf16f1946f7';
import { MONSTER_FRIENDS, levelEvolveTo, stoneEvolveTo } from '../data/companions.js?v=5cf16f1946f7';
import { addItem, removeItem, canEquipMonster, fullHeal } from '../stats.js?v=5cf16f1946f7';
import { ensureCompanions, partyOf } from './party.js?v=5cf16f1946f7';

// 進化した あとの 名前（もとの しゅぞくの 名前の ままなら 新しい しゅぞくの 名前。自分で つけた 名前は そのまま）
export function evolvedName(name, from, to) {
  if (name === MONSTERS[from]?.name) return MONSTERS[to].name;
  const i = (MONSTER_FRIENDS[from]?.names || []).indexOf(name);
  if (i >= 0) return MONSTER_FRIENDS[to]?.names?.[i] || MONSTERS[to].name;
  return name;
}

// 進化させる（c … もちぬしの キャラ・e … 仲間の { key, kind, species, char }・to … 進化した すがた）
//   かえす もの: { ok, from, to, oldName, name, stowed: [ふくろへ しまった 装備] }
export function evolveEntry(c, e, to) {
  const ch = e?.char;
  if (!ch || e.kind !== 'monster' || !MONSTERS[to] || !MONSTER_FRIENDS[to]) return { ok: false };
  const from = ch.species;
  const oldName = ch.name;
  ch.species = to;
  e.species = to;
  ch.name = String(evolvedName(oldName, from, to)).slice(0, 8);
  // 新しい すがたで 装備できない 物は ふくろへ
  const stowed = [];
  ch.equip = ch.equip || {};
  for (const slot of SLOTS) {
    const id = ch.equip[slot];
    if (!id || canEquipMonster(to, id)) continue;
    addItem(c, id, 1);
    ch.equip[slot] = null;
    stowed.push(id);
  }
  delete ch.evolveTo;
  fullHeal(ch);
  // 図鑑（仲間に した ことが ある・進化した 回数）
  c.bestiary = c.bestiary || {};
  const b = c.bestiary[to] || (c.bestiary[to] = {});
  b.friend = (b.friend || 0) + 1;
  b.evolved = (b.evolved || 0) + 1;
  // 進化した すがたも もう 次の 進化の レベル（リザードで Lv50 いじょう など）なら、つづけて たずねる
  const next = levelEvolveTo(ch);
  if (next) ch.evolveTo = next;
  return { ok: true, from, to, oldName, name: ch.name, stowed };
}

// 進化を まっている 仲間（なければ null）。用意の あとで かわらずのいしを 装備した ときなどは 用意を 消す
export function pendingEvolve(c) {
  if (!Array.isArray(c?.companions)) return null;
  for (const e of c.companions) {
    const ch = e?.char;
    if (e?.kind !== 'monster' || !ch?.evolveTo) continue;
    if (levelEvolveTo(ch) !== ch.evolveTo) {
      delete ch.evolveTo;
      continue;
    }
    return e;
  }
  return null;
}

// 「…おや？」の 台本（その 人だけ。world/scripts.js の checkEvolve）
export function evolveAskSteps(e) {
  const ch = e.char;
  return [
    ['showMon', ch.species],
    ['sfx', 'sparkle'],
    ['say', null, `…おや？\n${ch.name}のようすが…！`],
    ['choice', `${ch.name}をどうする？`, ['みまもる', 'とめる'], [
      [['evolve', e.key, ch.evolveTo]],
      [['evolveStop', e.key]],
    ]],
    ['showMon', null],
  ];
}

const stowText = (ids) => (ids.length ? `\n（${ids.map((id) => ITEMS[id]?.name || id).join('と')}は装備できないので、ふくろにしまった）` : '');

// 家族の パーティーの ほかの 人に 知らせる（えらぶ 文は 出さない）
function tellParty(world, s, text) {
  const p = partyOf(world, s);
  if (!p || p.members.length < 2) return;
  for (const sid of p.members) {
    const m = sid !== s.id && world.sessions.get(sid);
    if (m) world.send(m, { t: 'toast', text });
  }
}

function afterChange(world, s) {
  world.sendSelf(s);
  const p = partyOf(world, s);
  if (p) world.sendParty(p);
  world.markDirty();
}

// 台本の 'evolve'（みまもる）・'evolveStop'（とめる）。かえす もの: 台本に 足す 行
export function evolveScriptStep(world, s, op, key, to) {
  const c = ensureCompanions(s.char);
  const e = c.companions.find((x) => x.key === key && x.kind === 'monster');
  if (!e) return [];
  const name = e.char.name;
  if (op === 'evolveStop') {
    delete e.char.evolveTo;
    world.markDirty();
    return [['say', null, `あれ…？\n${name}の進化が止まった！`]];
  }
  if (e.char.evolveTo !== to || levelEvolveTo(e.char) !== to) {
    delete e.char.evolveTo;
    return [['say', null, `${name}のようすが、もとにもどった…。`]];
  }
  const r = evolveEntry(c, e, to);
  if (!r.ok) return [];
  afterChange(world, s);
  tellParty(world, s, `${c.name}の${r.oldName}が${MONSTERS[to].name}に進化した！`);
  return [
    ['sfx', 'sparkle'], ['flash'], ['showMon', to], ['sfx', 'join'],
    ['say', null, `おめでとう！\n${r.oldName}は${MONSTERS[to].name}に進化した！${stowText(r.stowed)}`],
  ];
}

// 進化の 石を 使う（メニューの「道具」→「使う」。world/services.js の useItem）。target … えらんだ 人の キャラ
//   自分の 仲間の 魔物で、その 石で 進化する しゅぞく だけ（ほかは 石は へらない）
export function useEvoStone(world, s, itemId, target, reply) {
  const c = ensureCompanions(s.char);
  const it = ITEMS[itemId];
  const e = target ? c.companions.find((x) => x.kind === 'monster' && x.char === target) : null;
  if (!e) return reply(false, `${target?.name || ''}に${it.name}を使っても、何も起こらなかった…`);
  const to = stoneEvolveTo(e.char.species, itemId);
  if (!to) return reply(false, `${e.char.name}に${it.name}を使っても、何も起こらなかった…`);
  removeItem(c, itemId, 1);
  const r = evolveEntry(c, e, to);
  tellParty(world, s, `${c.name}の${r.oldName}が${MONSTERS[to].name}に進化した！`);
  return reply(true, `${c.name}は${r.oldName}に${it.name}を使った！\n${r.oldName}の体が光につつまれた…！\n${r.oldName}は${MONSTERS[to].name}に進化した！${stowText(r.stowed)}`);
}
