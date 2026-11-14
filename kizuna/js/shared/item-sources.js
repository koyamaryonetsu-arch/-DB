// 第64回 ⑥a: 素材・道具の 入手先（作りたい 装備を しらべた ときに 出す。client/ui/sources.js）
//   ・魔物が 落とす（monsters.js の drops・data/loot.js の MAT_DROPS）… 出る 場所（出現表 → その表を 使う マップ）
//     ダンジョンでしか 出ない ときは ダンジョンの 名前。図鑑で 見た 魔物は 名前、まだの 魔物は ？？？（場所は 出す）
//   ・店で 売っている（data/shops.js）・宝箱（マップの chests）は そのまま 場所
//   データから 自動で 作る（魔物や マップが ふえても 書きたさなくて よい）
import { ITEMS } from './data/items.js?v=5e5310169c06';
import { MONSTERS } from './data/monsters.js?v=5e5310169c06';
import { MAT_DROPS, DROP_N } from './data/loot.js?v=5e5310169c06';
import { ENCOUNTER_TABLES } from './data/encounters.js?v=5e5310169c06';
import { NIGHT_ZONES } from './data/night.js?v=5e5310169c06';
import { SHOPS } from './data/shops.js?v=5e5310169c06';
import { MAPS } from './maps/index.js?v=5e5310169c06';

let cache = null;

// 第65回: データから 自動で わからない 入手先（宝の地図・闘技場・ひみつのダンジョンの ごほうび）
export const EXTRA_SOURCES = {
  limit_stone: ['宝の地図の洞窟（Lv30から）の主の宝箱', '闘技場のランク9・10のごほうび', 'ひみつのダンジョンの30階からの休み所'],
};

// 出現表 → その表を 使う 場所（{ map, name, field }）。昼の 表と 夜の 表は 同じ 場所
function zonePlaces() {
  const out = new Map();
  const add = (table, p) => {
    if (!out.has(table)) out.set(table, []);
    const list = out.get(table);
    if (!list.some((x) => x.map === p.map && x.name === p.name)) list.push(p);
  };
  for (const m of Object.values(MAPS)) {
    if (!m.spawnCounts) continue;
    const zones = Object.keys(m.spawnCounts);
    // フィールドは その ちいきの 名前（ホシフル村のまわり など）。数が 多いので とびとびに しらべる
    const names = new Map();
    if (m.kind === 'field' && typeof m.zoneAt === 'function' && typeof m.areaName === 'function') {
      const step = Math.max(1, Math.floor(Math.max(m.w, m.h) / 120));
      const tally = new Map();
      for (let y = 0; y < m.h; y += step) {
        for (let x = 0; x < m.w; x += step) {
          const z = m.zoneAt(x, y);
          if (!z || !zones.includes(z)) continue;
          const nm = m.areaName(x, y);
          if (!nm) continue;
          const t = tally.get(z) || new Map();
          t.set(nm, (t.get(nm) || 0) + 1);
          tally.set(z, t);
        }
      }
      for (const [z, t] of tally) names.set(z, [...t].sort((a, b) => b[1] - a[1])[0][0]);
    }
    for (const z of zones) {
      const p = { map: m.id, name: names.get(z) || m.name, field: m.kind === 'field' };
      add(z, p);
      if (NIGHT_ZONES[z]) add(NIGHT_ZONES[z], { ...p, night: true });
    }
  }
  return out;
}

// 魔物 → 出る 場所
function build() {
  const places = zonePlaces();
  const mon = new Map();
  for (const [table, list] of Object.entries(ENCOUNTER_TABLES)) {
    const ps = places.get(table);
    if (!ps || !Array.isArray(list)) continue;
    for (const e of list) {
      for (const [sp] of e.group || []) {
        if (!mon.has(sp)) mon.set(sp, []);
        const l = mon.get(sp);
        for (const p of ps) if (!l.some((x) => x.map === p.map && x.name === p.name)) l.push(p);
      }
    }
  }
  // 道具 → 落とす 魔物（[{ species, n: 何体に 1回, kind }]）
  const drops = new Map();
  const addDrop = (id, sp, n, kind) => {
    if (!id || !ITEMS[id]) return;
    if (!drops.has(id)) drops.set(id, []);
    const l = drops.get(id);
    if (!l.some((x) => x.species === sp)) l.push({ species: sp, n, kind });
  };
  for (const [sp, m] of Object.entries(MONSTERS)) {
    const d = m.drops || {};
    if (d.common) addDrop(d.common[0], sp, d.common[1] || DROP_N.common, 'common');
    if (d.rare) addDrop(d.rare[0], sp, d.rare[1] || DROP_N.rare, 'rare');
    if (d.boss) for (const id of [].concat(d.boss)) addDrop(id, sp, 1, 'boss');
    if (d.bonus) for (const id of [].concat(d.bonus)) addDrop(id, sp, 1, 'boss');
  }
  for (const [sp, [id, n]] of Object.entries(MAT_DROPS)) addDrop(id, sp, n || DROP_N.mat, 'mat');
  // 店・宝箱
  const shops = new Map();
  // 物語で ふえる 品ぞろえ（more）も 店の 品（第81回: へそくりのさいふ・金庫番のお守りは more で 足す）
  for (const sh of Object.values(SHOPS)) for (const id of [...(sh.items || []), ...(sh.more || []).flatMap((m) => m.items || [])]) {
    if (!shops.has(id)) shops.set(id, []);
    if (!shops.get(id).includes(sh.name)) shops.get(id).push(sh.name);
  }
  const chests = new Map();
  for (const m of Object.values(MAPS)) for (const ch of m.chests || []) {
    if (!ch?.item || !ITEMS[ch.item]) continue;
    if (!chests.has(ch.item)) chests.set(ch.item, []);
    const nm = m.kind === 'field' && typeof m.areaName === 'function' ? m.areaName(ch.x, ch.y) || m.name : m.name;
    if (!chests.get(ch.item).includes(nm)) chests.get(ch.item).push(nm);
  }
  return { mon, drops, shops, chests };
}
const data = () => (cache ||= build());

// その 魔物が 出る 場所（[{ map, name, field }]。ボスなど 出現表に ない 魔物は []）
export function monsterPlaces(species) {
  return data().mon.get(species) || [];
}

// その 道具の 入手先。seen(species) … 図鑑で 見たか（見ていない 魔物は 名前を ？？？）
//   [{ kind: 'monster', species, name, places: [名前], dungeon: ダンジョンでしか 出ない, n, boss },
//    { kind: 'shop', name }, { kind: 'chest', name }, { kind: 'note', name }（EXTRA_SOURCES）]
export function itemSources(id, seen = () => true) {
  const d = data();
  const out = [];
  // 弱い 魔物（はやく 行ける 場所）から。出る 場所の ない 魔物（配合だけ など）は ボスの ほかは 出さない
  const lv = (sp) => MONSTERS[sp]?.lv || 99;
  for (const x of (d.drops.get(id) || []).slice().sort((a, b) => lv(a.species) - lv(b.species) || a.n - b.n)) {
    const ps = monsterPlaces(x.species);
    if (!ps.length && x.kind !== 'boss' && !MONSTERS[x.species]?.boss) continue;
    const dungeon = ps.length > 0 && ps.every((p) => !p.field);
    // 「炎の山　1階」「炎の山　2階」は「炎の山」に まとめる
    const names = [...new Set(ps.map((p) => String(p.name).split('　')[0]))];
    out.push({ kind: 'monster', species: x.species, name: seen(x.species) ? MONSTERS[x.species]?.name || x.species : '？？？', seen: !!seen(x.species), places: names, dungeon, n: x.n, boss: x.kind === 'boss' || !!MONSTERS[x.species]?.boss });
  }
  for (const name of d.shops.get(id) || []) out.push({ kind: 'shop', name });
  for (const name of d.chests.get(id) || []) out.push({ kind: 'chest', name });
  for (const name of EXTRA_SOURCES[id] || []) out.push({ kind: 'note', name });
  return out;
}

// 1行の 文（「はぐれウルフ（ホシフル村のまわり）」「？？？（ねむりの洞窟）」「ルミナの道具屋で売っている」）
export function sourceText(s, maxPlaces = 2) {
  if (s.kind === 'shop') return `${s.name}で売っている`;
  if (s.kind === 'chest') return `${s.name}の宝箱`;
  if (s.kind === 'note') return s.name;
  const where = s.places.length ? `（${s.places.slice(0, maxPlaces).join('・')}${s.places.length > maxPlaces ? 'など' : ''}）` : s.boss ? '（ボス）' : '';
  // 落とす 回数の 目安（何体に 1回）
  const often = s.boss ? '' : s.n <= 5 ? 'よく' : s.n <= 12 ? 'ときどき' : 'たまに';
  return `${s.name}が${often}落とす${where}`;
}
