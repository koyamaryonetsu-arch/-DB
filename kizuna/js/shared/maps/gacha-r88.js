// 第88回 G4班: 作品の ガチャガチャ・七つの玉の 宝箱・竜神の ほこら（data/gacha-r88.js。今の マップに 足す だけ）
//   ・ガチャガチャ … ルミナの町（星の神殿の 東の 外。神殿の 中は さわらない）と 王都サファラ（市場の 東）。台と 店の 人
//   ・七つの玉 … ORB_PLACES の 7つの 宝箱（ダンジョンの 宝箱 ＝ c.chests。フィールドの 宝箱は 開けると きえる。どれも キャラごとに 1回）
//   ・竜神の ほこら … 星竜山の 頂上の すみ（HOKORA）
import { npc } from './npc.js?v=36007aad9f1d';
import { PLACES } from './overworld.js?v=36007aad9f1d';
import { ORB_PLACES, orbChestId, HOKORA } from '../data/gacha-r88.js?v=36007aad9f1d';
// 第88回 G9班: ドラゴンボールの 宝箱 7つ（だいほんで 開ける。ねがいの あとの 待ちが ある）・神龍の さいだん（星見の丘）
import { DB_PLACES, dbChestId, dbChestScript, SHENRON } from '../data/shenron-r88.js?v=36007aad9f1d';
// 第88回 G12班: 聖はいの 水しょうの台（鏡の湖の 東の ほとり）
import { GRAIL_ALTAR } from '../data/items-r88-sailormoon.js?v=36007aad9f1d';
// 第88回 G14班: 第5のせいれいのドレスの 氷の石の台（白銀の湖の 北の ほとり）
import { FIFTH_ALTAR } from '../data/items-r88-frozen.js?v=36007aad9f1d';

const TW = (x, y) => [PLACES.town.x + x, PLACES.town.y + y];

export const GACHA_SPOTS = [
  { map: 'overworld', machine: TW(32, 5), keeper: TW(33, 5), name: 'ガチャガチャ屋のポン', sprite: 'merchant', town: 'ルミナの町' },
  { map: 'south', machine: [52, 93], keeper: [53, 93], name: 'ガチャガチャ屋のピン', sprite: 'desert_merchant', town: '王都サファラ' },
];

export function attachGachaR88(maps) {
  GACHA_SPOTS.forEach((g, i) => {
    const m = maps[g.map];
    if (!m) return;
    m.npcs.push(npc(`r88_gacha_${i}`, 'ガチャガチャ', g.machine, 'r88_gacha', 'r88_gacha', { dir: 'down' }));
    m.npcs.push(npc(`r88_gacha_keeper_${i}`, g.name, g.keeper, g.sprite, 'r88_gacha_keeper', { dir: 'down' }));
  });
  for (const p of ORB_PLACES) {
    const m = maps[p.map];
    if (m) m.chests.push({ id: orbChestId(p), x: p.x, y: p.y, item: p.item });
  }
  const top = maps[HOKORA.map];
  if (top) top.npcs.push(npc('r88_hokora', '竜神のほこら', [HOKORA.x, HOKORA.y], 'r88_hokora', 'r88_hokora', { dir: 'down' }));
  attachShenron(maps); // G9班: ドラゴンボールの 宝箱・神龍の さいだん
  attachGrail(maps); // G12班: 聖はいの 水しょうの台
  attachFifth(maps); // G14班: 第5のせいれいのドレスの 氷の石の台
  return maps;
}

// G9班: ドラゴンボールの 宝箱（chest.script … world/shenron-r88.js が 開ける）・神龍の さいだん
function attachShenron(maps) {
  for (const p of DB_PLACES) {
    const m = maps[p.map];
    if (m) m.chests.push({ id: dbChestId(p), x: p.x, y: p.y, item: p.item, script: dbChestScript(p) });
  }
  const ow = maps[SHENRON.map];
  if (ow) ow.npcs.push(npc('r88_shenron_altar', 'シェンロンのさいだん', [SHENRON.x, SHENRON.y], 'r88_shenron_altar', 'r88_shenron', { dir: 'down' }));
}

// G12班: 聖はいの 水しょうの台（3つの タリスマンを 持って 行くと 聖はい。world/grail-r88.js）
function attachGrail(maps) {
  const m = maps[GRAIL_ALTAR.map];
  if (m) m.npcs.push(npc('r88_grail_altar', '水しょうの台', [GRAIL_ALTAR.x, GRAIL_ALTAR.y], 'r88_grail_altar', 'r88_grail', { dir: 'down' }));
}

// G14班: 第5のせいれいのドレスの 氷の石の台（白銀の湖の 北の ほとり。4つの せいれいの しるしを 持って 行くと ドレス。world/frozen-r88.js）
function attachFifth(maps) {
  const m = maps[FIFTH_ALTAR.map];
  if (m) m.npcs.push(npc('r88_fifth_altar', '氷の石の台', [FIFTH_ALTAR.x, FIFTH_ALTAR.y], 'r88_fifth_altar', 'r88_fifth', { dir: 'down' }));
}
