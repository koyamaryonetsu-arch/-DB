// 第88回 G4班: 作品の ガチャガチャ・七つの玉の 宝箱・竜神の ほこら（data/gacha-r88.js。今の マップに 足す だけ）
//   ・ガチャガチャ … ルミナの町（星の神殿の 東の 外。神殿の 中は さわらない）と 王都サファラ（市場の 東）。台と 店の 人
//   ・七つの玉 … ORB_PLACES の 7つの 宝箱（ダンジョンの 宝箱 ＝ c.chests。フィールドの 宝箱は 開けると きえる。どれも キャラごとに 1回）
//   ・竜神の ほこら … 星竜山の 頂上の すみ（HOKORA）
import { npc } from './npc.js?v=3103aa50fe85';
import { PLACES } from './overworld.js?v=3103aa50fe85';
import { ORB_PLACES, orbChestId, HOKORA } from '../data/gacha-r88.js?v=3103aa50fe85';

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
  return maps;
}
