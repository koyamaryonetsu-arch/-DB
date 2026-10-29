// 魔物あずかり所（第43回 C。ルミナの町。家族の ねがい「仲間が 40 いっぱいでも、魔物を とっておきたい」）
//   c.storage … あずけた 魔物（world/party.js の ensureStorage。60 まで。仲間の 40 とは 別に 数える）
//   ・あずける … 仲間の 魔物だけ（人間の 仲間は あずけられない）。パーティー・馬車に いても あずけられる（そこから はずれる。装備は ふくろへ）
//   ・ひきとる … 仲間が いっぱい（40）なら できない。ひきとった 魔物は 酒場で 待つ（げんき いっぱい）
//   ・あずけた 魔物は 戦わない・育たない。酒場の 配合の 親には なれる（world/breed.js。「あずかり中」の しるし）
//   ・戦いの あとに 仲間が いっぱいの 時の「あずかり所へ送る」（world/farewell.js・scripts.js の 'befriend'）
//   ・酒場で 人間の 仲間を さそう 時に いっぱいの 時の「あずかり所へ送る」（world/services.js の 'recruit' の store）
import { MONSTERS } from '../data/monsters.js?v=060276fb0270';
import { ROSTER_MAX } from '../data/companions.js?v=060276fb0270';
import { SLOTS } from '../data/items.js?v=060276fb0270';
import { addItem, fullHeal } from '../stats.js?v=060276fb0270';
import { ensureCompanions, ensureStorage, storedOf, companionOf, afterRosterChange, STORAGE_MAX } from './party.js?v=060276fb0270';

export const STORAGE_KEEPER = '魔物あずかり所のモモ';

// あずける（key の 魔物を 仲間から あずかり所へ）
export function depositMonster(world, s, key) {
  const c = ensureStorage(ensureCompanions(s.char));
  const e = companionOf(c, String(key || ''));
  if (!e) return { ok: false, reason: '見つかりません' };
  if (e.kind !== 'monster') return { ok: false, reason: 'あずかれるのは魔物の仲間だけです' };
  if (c.storage.length >= STORAGE_MAX) return { ok: false, full: true, reason: `あずかり所はいっぱいです（${STORAGE_MAX}ひきまで）` };
  // 装備は ふくろへ（酒場で 待つ 時と 同じ）
  const stowed = [];
  for (const slot of SLOTS) {
    const id = e.char.equip?.[slot];
    if (!id) continue;
    addItem(c, id, 1);
    e.char.equip[slot] = null;
    stowed.push(id);
  }
  c.companions = c.companions.filter((x) => x !== e);
  c.partyKeys = c.partyKeys.filter((k) => k !== e.key);
  if (Array.isArray(c.wagonKeys)) c.wagonKeys = c.wagonKeys.filter((k) => k !== e.key);
  c.storage.push(e);
  afterRosterChange(world, s);
  return { ok: true, key: e.key, name: e.char.name, stowed };
}

// ひきとる（あずかり所から 酒場へ）
export function withdrawMonster(world, s, key) {
  const c = ensureStorage(ensureCompanions(s.char));
  const e = storedOf(c, String(key || ''));
  if (!e) return { ok: false, reason: '見つかりません' };
  if (c.companions.length >= ROSTER_MAX) return { ok: false, full: true, reason: `仲間がいっぱいです（${ROSTER_MAX}）。\n酒場でだれかと別れるか、ほかの魔物をあずけてね` };
  c.storage = c.storage.filter((x) => x !== e);
  // 番号が かさなって いたら（データを 合わせた あとなど）新しい 番号に
  if (companionOf(c, e.key)) {
    while (c.companions.some((x) => x.key === `m${c.monsterSeq}`) || c.storage.some((x) => x.key === `m${c.monsterSeq}`)) c.monsterSeq++;
    e.key = `m${c.monsterSeq++}`;
    e.char.id = `${c.id}:${e.key}`;
  }
  fullHeal(e.char);
  c.companions.push(e);
  afterRosterChange(world, s);
  return { ok: true, key: e.key, name: e.char.name };
}

// あずけた ときの ことば
export function storeText(r) {
  if (!r?.ok) return r?.reason || '';
  return `${r.name}をあずかり所へ送った。\n「またむかえに来てね！」${r.stowed?.length ? '\n（装備はふくろにしまった）' : ''}`;
}

// あずかり所の まどに わたす じょうほう
export function storageInfo(world, s) {
  const c = ensureStorage(ensureCompanions(s.char));
  const busy = new Set([...(c.partyKeys || []), ...(c.wagonKeys || [])]);
  const row = (e, where) => ({
    key: e.key, name: e.char.name, species: e.species, level: e.char.level || 1, plus: e.char.plus || 0,
    spName: MONSTERS[e.species]?.name || '', where,
  });
  return {
    name: '魔物あずかり所', keeper: STORAGE_KEEPER,
    hello: 'ここは魔物あずかり所。\n仲間の魔物を、60ぴきまであずかるよ。\nあずけた魔物は戦わないけど、酒場の配合の親にはなれるんだ。',
    roster: c.companions.filter((e) => e.kind === 'monster').map((e) => row(e, busy.has(e.key) ? 'いっしょ' : '酒場')),
    stored: c.storage.map((e) => row(e, 'あずかり中')),
    rosterCount: c.companions.length, rosterMax: ROSTER_MAX, storageMax: STORAGE_MAX,
  };
}

// あずかり所の そうさ（world/services.js の serviceAction から）
export function storageAction(world, s, msg, reply) {
  if (!s.openStorage) return reply(false, 'あずかり所で話しかけてね');
  const r = msg.action === 'deposit' ? depositMonster(world, s, msg.key) : msg.action === 'withdraw' ? withdrawMonster(world, s, msg.key) : null;
  if (!r) return reply(false, 'できません', { storage: storageInfo(world, s) });
  if (!r.ok) return reply(false, r.reason, { storage: storageInfo(world, s) });
  const text = msg.action === 'deposit'
    ? `${r.name}をおあずかりしました。${r.stowed.length ? '\n（装備はふくろにしまった）' : ''}`
    : `${r.name}を酒場へ送りました。\n（ルミナの町の酒場で待っている）`;
  return reply(true, text, { storage: storageInfo(world, s) });
}
