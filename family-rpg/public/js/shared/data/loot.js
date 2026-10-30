// 魔物が 落とす 物（ドロップ）のきまり
//
// monsters.js の drops は こう 書く:
//   drops: { common: ['herb', 8], rare: ['iron_claw', 64] }
//     common … よく 落とす 物。8 なら 8回に 1回（書かなければ DROP_N.common）
//     rare   … めったに 落とさない 物。装備か 種（書かなければ DROP_N.rare）
//   drops: { boss: ['rock_bangle'] }
//     boss   … ボスが かならず 落とす 物（1人 1つの 品）
//
// きまり（長い 物語でも おなじ）
//   ・1体から 落ちるのは 1つまで。さきに レア、だめなら よく落とす 物
//   ・レアの 装備は「店で 買えない ★の 品」か「その地方の 店より 少し 先の 品」
//   ・種は その魔物に 合った もの（かたい→守り、はやい→素早さ、呪文→かしこさ、大きい→命、力じまん→力）
//   ・素材（ふしぎなかじ で 使う）は MAT_DROPS に 書く。レアも よく落とす 物も 出なかった ときに 出る
//   ・図鑑に 落とす 物が のる（手に入れるまでは ？？？）
//   ・第31回: ボスは ちなんだ レア装備も（kind 'brare'。第32回から かならず: BOSS_RARE_N = 1）。ふつうの 魔物は その地方の レア装備を まれに
//     （REGION_RARE_N 体に 1体。図鑑には のらない）。ひみつのダンジョンの 中では、ここだけの ★4〜★5（data/rare-loot.js）
import { ITEMS } from './items.js';
import { MONSTERS } from './monsters.js';
import { RARE_MAT_DROPS } from './monsters-rare.js';
import { CH3_MAT_DROPS } from './monsters-ch3.js';
import { CH4_MAT_DROPS } from './monsters-ch4.js';
import { R23_MAT_DROPS } from './monsters-r23.js';
import { TEMPLE_MAT_DROPS } from './monsters-temple.js';
import { CH5_MAT_DROPS } from './monsters-ch5.js';
import { KUMOI_MAT_DROPS } from './monsters-kumoi.js';
import { HOSHIYOMI_MAT_DROPS } from './monsters-hoshiyomi.js';
import { EARTH_MAT_DROPS } from './monsters-earth.js';
import { PHANTOM_MAT_DROPS } from './monsters-phantom.js';
import { PAST_MAT_DROPS } from './monsters-past.js';
import { ROAD_MAT_DROPS } from './monsters-road.js';
import { TOKEI_MAT_DROPS } from './monsters-tokei.js';
import { TOKEI6_MAT_DROPS } from './monsters-tokei6.js';
import { bossRareOf, BOSS_RARE_N, regionRareList, REGION_RARE_N, pickSdGear, SD_DROP_N, SD_GUARD_DROP_N } from './rare-loot.js';
import { sdFloorOf } from './secret.js';

export const DROP_N = { common: 8, rare: 64, mat: 8 };

// 素材の ドロップ（[素材, 何回に 1回]）。その魔物に 合った もの
//   けもの→けもののキバ・鳥→風の羽・かたい 魔物や 剣士→鉄のかけら・呪文や キノコ→魔法の粉
//   カニや 貝→きれいな貝がら・海賊や 嵐の兵→銀のかけら・海へび→竜のうろこ
export const MAT_DROPS = {
  tsunousagi: ['beast_fang', 8],
  kobushi: ['magic_powder', 12],
  koumorin: ['beast_fang', 10],
  goblin: ['iron_shard', 8],
  nemuri: ['magic_powder', 8],
  wolf: ['beast_fang', 5],
  lamp: ['magic_powder', 6],
  armor_crab: ['pretty_shell', 5],
  crow: ['wind_feather', 5],
  skeleton: ['iron_shard', 6],
  dark_bat: ['beast_fang', 6],
  rockman: ['iron_shard', 3],
  shadow_mage: ['magic_powder', 5],
  // 第2章
  marine_slime: ['pretty_shell', 6],
  wild_gull: ['wind_feather', 4],
  shell_knight: ['pretty_shell', 4],
  sea_serpent: ['dragon_scale', 5],
  wind_imp: ['wind_feather', 6],
  ghost_pirate: ['silver_shard', 8],
  thunder_imp: ['magic_powder', 5],
  storm_bird: ['wind_feather', 4],
  coral_golem: ['silver_shard', 5],
  storm_soldier: ['silver_shard', 5],
  // めずらしい 魔物（monsters-rare.js）
  ...RARE_MAT_DROPS,
  // 第3章（monsters-ch3.js）
  ...CH3_MAT_DROPS,
  // 第4章（monsters-ch4.js）
  ...CH4_MAT_DROPS,
  // あたらしい 仲間モンスター（monsters-r23.js）
  ...R23_MAT_DROPS,
  // 第4章 Step 7「砂の底の神殿」（monsters-temple.js）
  ...TEMPLE_MAT_DROPS,
  // 第5章 Step 2「星の塔」（monsters-ch5.js）
  ...CH5_MAT_DROPS,
  // 第5章 Step 3・4「クモイ地方・しずみゆく島の古い神殿」（monsters-kumoi.js）
  ...KUMOI_MAT_DROPS,
  // 第5章 Step 5「星読みの里・ノクトの思い出の迷宮」（monsters-hoshiyomi.js）
  ...HOSHIYOMI_MAT_DROPS,
  // 第5章 Step 6・7「根の島・大地の神殿」（monsters-earth.js）
  ...EARTH_MAT_DROPS,
  // 第5章 Step 8「影の城」（monsters-phantom.js）
  ...PHANTOM_MAT_DROPS,
  // 第2部 第6章 Step 1・2（monsters-past.js）
  ...PAST_MAT_DROPS,
  // 第2部 第6章 Step 3・4（monsters-road.js）
  ...ROAD_MAT_DROPS,
  // 第2部 第6章 Step 5（monsters-tokei.js）
  ...TOKEI_MAT_DROPS,
  // 第53回 D: きらきらぷるりんが まれに 色の石（配合で 色ちがいの 子。data/breed-mix.js）
  kirakira: ['color_stone', 4],
  // 第2部 第6章 Step 6（monsters-tokei6.js）
  ...TOKEI6_MAT_DROPS,
};
// ぬすむ ときは レアが 出やすい（この 倍。でも 半分まで）
export const STEAL_RARE_MULT = 8;

const entry = (kind, v) => {
  const [item, n] = Array.isArray(v) ? v : [v, DROP_N[kind]];
  if (!ITEMS[item]) return null;
  const N = Math.max(1, Number(n) || DROP_N[kind] || 1);
  return { item, kind, n: N, rate: 1 / N };
};

// その魔物が 落とす 物の 一覧 [{ item, kind, n, rate }]（ボス → レア → よく落とす 物 の じゅん）
export function monsterDrops(species) {
  const d = MONSTERS[species]?.drops;
  if (!d || typeof d !== 'object') return [];
  const out = [];
  for (const id of Array.isArray(d.boss) ? d.boss : d.boss ? [d.boss] : []) {
    if (ITEMS[id]) out.push({ item: id, kind: 'boss', n: 1, rate: 1 });
  }
  // ボスに ちなんだ レア装備（第32回から かならず）
  const br = bossRareOf(species);
  if (br) out.push({ item: br, kind: 'brare', n: BOSS_RARE_N, rate: 1 / BOSS_RARE_N });
  if (d.rare) out.push(entry('rare', d.rare));
  if (d.common) out.push(entry('common', d.common));
  if (MAT_DROPS[species]) out.push(entry('mat', MAT_DROPS[species]));
  return out.filter(Boolean);
}

// たおした 1体から 落ちる 物（rng.chance を つかう）
// where … { map }（戦った マップ。ひみつのダンジョンの 中なら ここだけの 装備が 出る）
export function rollDrops(species, rng, where = null) {
  const list = monsterDrops(species);
  const out = list.filter((x) => x.kind === 'boss').map((x) => x.item);
  const brare = list.find((x) => x.kind === 'brare');
  if (brare && rng.chance(brare.rate)) out.push(brare.item);
  const rare = list.find((x) => x.kind === 'rare');
  const common = list.find((x) => x.kind === 'common');
  const mat = list.find((x) => x.kind === 'mat');
  // ひみつのダンジョン（20階から）: 番人は 3回に 1回・ふつうの 魔物は まれに
  const f = where?.map ? sdFloorOf(where.map) : 0;
  const sdId = f ? pickSdGear(rng, f) : null;
  const region = regionRareList(species);
  if (sdId && rng.chance(1 / (MONSTERS[species]?.boss ? SD_GUARD_DROP_N : SD_DROP_N))) out.push(sdId);
  else if (region.length && rng.chance(1 / REGION_RARE_N)) out.push(rng.pick(region));
  else if (rare && rng.chance(rare.rate)) out.push(rare.item);
  else if (common && rng.chance(common.rate)) out.push(common.item);
  else if (mat && rng.chance(mat.rate)) out.push(mat.item);
  return out;
}

// 第50回: 種・木の実（強さを ずっと 上げる 道具）か
export function isStatSeed(id) {
  const e = ITEMS[id]?.effect;
  return !!e && (e.type === 'seed' || (Array.isArray(e.parts) && e.parts.some((p) => p.type === 'seed')));
}
// 第50回: 種・木の実は ぬすみにくい（1回で この 確率まで。ほかの 物が とれない ときの かわりにも ならない）
export const STEAL_SEED_MAX = 1 / 3;

// ぬすむ ときに とれる 物（ボスの 品は とれない）
export function stealPick(species, rng) {
  const list = monsterDrops(species);
  const rare = list.find((x) => x.kind === 'rare');
  const common = list.find((x) => x.kind === 'common');
  const p = (x, cap) => Math.min(isStatSeed(x.item) ? STEAL_SEED_MAX : cap, x.rate * STEAL_RARE_MULT);
  if (rare && rng.chance(p(rare, 0.5))) return rare.item;
  if (common && isStatSeed(common.item)) return rng.chance(p(common, 1)) ? common.item : null;
  if (common) return common.item;
  return rare && !isStatSeed(rare.item) ? rare.item : null;
}
