// 第7章 Step 3・4（A: 世界と物語）「千年前の クモイの 海」（c7s_sea）と、今の クモイ地方（kumoi）に たす もの（maps/c7.js の attachCh7 で まぜる）
// ※ ネタバレ注意（docs/plan-ch7.md の 4）
// ・c7s_sea … 今の クモイ地方（kumoi。第5章）と おなじ 大きさ・おなじ 座標。今の 地図から 作る（手で ぜんぶ かかない）:
//   雲の 海は 青い 海・島の 雲に とけかけた ふちは 砂浜・かたむいた 木は ヤシの木・かたむいた 柱は 岩・風見の石は まだ ない
//   今の 風の道は「しおの流れ」（のると 流される。風見の石が ない ので 曲がり角は きまった 向き）
//   今の ハネノの島の 町の あたりに「ナギの村」（カイの 村。maps/c7s-village-rows.js）
//   今の しずみゆく島の 古い神殿の 場所に「しずむ前の島の灯台」（中は maps/c7s-light.js）。北の 浜に 海賊船（中ボス）
//   今の 星読みの里の 島は 星見の島・根の島は 大木の島（大地の 神殿は まだ ない）
// ・時の砂時計（world/time-glass.js）: kumoi ⇔ c7s_sea（timePair）。カリムが 仲間に なった あと、トキネの 話を 聞くと 使える（c7_sea。map.timeSpot）
// ・時をこえる手紙（data/sidequests-c7s.js）: 千年前で うめる 所と、今の おなじ 座標で 見つける 所（ナギの村の 浜・貝がらの小島・星見の島）
// だいほんは data/story-c7s.js
import { T, TILE_INFO } from '../tiles.js?v=d89f0f9d101a';
import { hash2 } from '../rng.js?v=d89f0f9d101a';
import { npc } from './npc.js?v=d89f0f9d101a';
import { parseRows16, wideTiles } from './past.js?v=d89f0f9d101a';
import { KUMOI_ISLES, KUMOI_ROADS, KUMOI_JUNCTIONS, KUMOI_POS, KUMOI_TOWN, STAR_TOWN } from './kumoi.js?v=d89f0f9d101a';
import { EARTH_OUT } from './earth.js?v=d89f0f9d101a';
import { VILLAGE_ROWS, VILLAGE_SPOTS, VILLAGE_ROOFS } from './c7s-village-rows.js?v=d89f0f9d101a';
import {
  C7S, ARRIVE7S, C7S_SEA, PRESENT_SEA, VILLAGE, LIGHT_WALL, LIGHT_DOOR, REEF_ZONE, REEF_SHIP, LETTER7S, LETTER7S_SIDE, WIN7S,
} from './c7s-flags.js?v=d89f0f9d101a';
import { c7slArrive } from './c7s-light.js?v=d89f0f9d101a';

export const C7S_SEA_NAME = '千年前のクモイの海';
const V = (x, y) => ({ x: VILLAGE.x + x, y: VILLAGE.y + y });
const inRect = (x, y, r, pad = 0) => x >= r.x - pad && y >= r.y - pad && x < r.x + r.w + pad && y < r.y + r.h + pad;
const IS = KUMOI_ISLES;
const inIsle = (I, x, y, k = 1) => ((x + 0.5 - I.cx) / I.rx) ** 2 + ((y + 0.5 - I.cy) / I.ry) ** 2 < k;
// 千年前の 島の 名前（今の 名前の かわり。雲から 出てくる 島・影の城の 前の 小島は まだ 海の 中）
export const ISLE_NAMES7S = {
  hanono: 'ナギの島', vane1: '貝がらの小島', treasure: '小さな岩の島', vane2: 'かもめの小島', sink: 'しずむ前の島', far: 'はなれ小島', star: '星見の島', root: '大木の島',
};
const isleAt = (x, y) => Object.keys(ISLE_NAMES7S).find((k) => inIsle(IS[k], x, y)) || null;

// ───────────── だいじな 場所 ─────────────
export const C7S_POS = {
  villageIn: V(VILLAGE_SPOTS.plaza.x, VILLAGE_SPOTS.plaza.y), // 村の 大通りの まん中
  elder: V(VILLAGE_SPOTS.elder.x, VILLAGE_SPOTS.elder.y),
  kaiHome: V(VILLAGE_SPOTS.kaiHome.x, VILLAGE_SPOTS.kaiHome.y),
  shrine: V(VILLAGE_SPOTS.shrine.x, VILLAGE_SPOTS.shrine.y),
  altar: V(VILLAGE_SPOTS.altar.x, VILLAGE_SPOTS.altar.y),
  beach: { x: 58, y: 37 }, // 村の 南の 浜（さいごの 場面）
  glass: { x: 47, y: 31 }, // 目標の しるし（今の ハネノの島の 西の 船着き場の 道。どちらの 時代も 立てる）
  landing: { x: 18, y: 37 }, // しずむ前の島の 北の 浜（しおの流れで 着く ところ）
};
// 時をこえる手紙の 場所（千年前で うめる 所と 今で 見つける 所は おなじ 座標）
//   1 … ナギの村の 浜（今の ハネノの島の 竜の 降り場）/ 2 … 貝がらの小島（今の 風見の小島）/ 3 … 星見の島（今の 星読みの里の 島）
export const LETTER7S_SPOTS = { 1: { x: 56, y: 35 }, 2: { x: 32, y: 31 }, 3: { x: 4, y: 30 } };
// たのむ 人（千年前）
export const LETTER7S_ASKERS = { 1: 'c7s_kid', 2: 'c7s_fisher', 3: 'c7s_stargazer' };
export const LETTER7S_PLACES = { 1: 'ナギの村のはま', 2: '貝がらの小島', 3: '星見の島' };
export const LETTER7S_NOW_PLACES = { 1: 'ハネノの島の竜の降り場', 2: '風見の小島', 3: '星読みの里の島' };

// ───────────── しおの流れ（今の 風の道と おなじ 所。曲がり角は きまった 向き）─────────────
const CUR = { N: T.C7_CUR_N, E: T.C7_CUR_E, S: T.C7_CUR_S, W: T.C7_CUR_W };
const WIND2CUR = { [T.SKYWIND_N]: T.C7_CUR_N, [T.SKYWIND_E]: T.C7_CUR_E, [T.SKYWIND_S]: T.C7_CUR_S, [T.SKYWIND_W]: T.C7_CUR_W };
// 千年前の 曲がり角（j1 … 西の かもめの小島へ / j2 … 南の しずむ前の島へ）
export const SEA_JUNCTIONS7S = { j1: 'W', j2: 'S' };
const isCur = (v) => v === T.C7_CUR_N || v === T.C7_CUR_E || v === T.C7_CUR_S || v === T.C7_CUR_W;

// ───────────── 千年前の クモイの 海を 今の 地図から 作る ─────────────
const grassAt = (x, y) => { const r = hash2(x, y, 1701); return r < 0.08 ? T.FLOWERS : r < 0.18 ? T.TALLGRASS : T.GRASS; };
const SOLID_DECO = new Set([T.TREE, T.TILT_TREE, T.HEDGE]);
function seaTiles(present) {
  const W = present.w, H = present.h;
  const t = wideTiles(present.tiles);
  const get = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? t[y * W + x] : T.DEEP);
  const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < W && y < H) t[y * W + x] = v; };
  // 1) 雲 → 海・雲の ふち → 砂浜・風の道 → しおの流れ・今の かざり → 千年前の もの
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const v = present.tiles[y * W + x];
      if (WIND2CUR[v]) set(x, y, WIND2CUR[v]);
      else if (v === T.CLOUD_SEA) set(x, y, T.DEEP);
      else if (v === T.CLOUD_RIM) set(x, y, T.SAND);
      else if (SOLID_DECO.has(v)) set(x, y, hash2(x, y, 1703) < 0.7 ? T.PALM : T.TREE);
      else if (v === T.TILT_PILLAR || v === T.RUIN_WALL || v === T.GAIA_ROOT || v === T.ROOT_GATE) set(x, y, T.ROCK);
      else if (v === T.STONE_PATH || v === T.PLAZA) set(x, y, T.SAND);
      else if (v === T.VANE || v === T.VANE_ON || v === T.SIGN) set(x, y, grassAt(x, y));
      else if (v === T.WALL_WOOD && isleAt(x, y) === 'hanono') set(x, y, grassAt(x, y));
    }
  }
  // 2) 開け しめ できる 風の道（今は 風見の石で 開く）も、千年前は いつも しおの流れ。曲がり角は きまった 向き
  for (const R of Object.values(KUMOI_ROADS)) for (const [x, y, d] of R.cells) set(x, y, CUR[d]);
  for (const [k, J] of Object.entries(KUMOI_JUNCTIONS)) set(J.x, J.y, CUR[SEA_JUNCTIONS7S[k]]);
  // 4) 星見の島の 生けがき・根の島の 石がこいは まだ ない（ひらけた 草地）
  for (let y = STAR_TOWN.y; y < STAR_TOWN.y + STAR_TOWN.h; y++) for (let x = STAR_TOWN.x; x < STAR_TOWN.x + STAR_TOWN.w; x++) if (get(x, y) === T.PALM || get(x, y) === T.TREE) set(x, y, grassAt(x, y));
  const EO = EARTH_OUT;
  for (let y = EO.y; y < EO.y + EO.h; y++) for (let x = EO.x; x < EO.x + EO.w; x++) set(x, y, (x + y) % 3 ? T.ROCK : T.TREE);
  // 5) ナギの村を はめこむ（今の ハネノの町の あたり）
  const p = parseRows16(VILLAGE_ROWS);
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) set(VILLAGE.x + x, VILLAGE.y + y, p.tiles[y * p.w + x]);
  // 村の まわり 1マスは 砂（村から 島へ 出られる）
  for (let y = VILLAGE.y - 1; y <= VILLAGE.y + VILLAGE.h; y++) for (let x = VILLAGE.x - 1; x <= VILLAGE.x + VILLAGE.w; x++) {
    if (inRect(x, y, VILLAGE)) continue;
    const v = get(x, y);
    if (v === T.DEEP || v === T.WATER || v === T.PALM || v === T.TREE || v === T.ROCK) set(x, y, T.SAND);
  }
  // 6) しずむ前の島の 灯台（白い 石の 塔の 土台。とびらは 南。海賊の くさりで ふさがれている）
  const L = LIGHT_WALL;
  for (let y = L.y; y < L.y + L.h; y++) for (let x = L.x; x < L.x + L.w; x++) set(x, y, T.RUIN_WALL);
  set(LIGHT_DOOR.x, LIGHT_DOOR.y, T.ANC_DOOR);
  for (const x of [LIGHT_DOOR.x - 2, LIGHT_DOOR.x + 2]) set(x, LIGHT_DOOR.y + 1, T.PILLAR);
  // 北の 浜から 灯台の 東がわを まわって 南の とびらへ（ヤシの木や 岩を どける）
  const open = (x, y) => { const v = get(x, y); if (v === T.PALM || v === T.TREE || v === T.ROCK) set(x, y, T.SAND); };
  for (let y = L.y - 3; y <= LIGHT_DOOR.y + 2; y++) for (let x = L.x + L.w + 1; x <= L.x + L.w + 2; x++) open(x, y);
  for (let x = LIGHT_DOOR.x - 1; x <= L.x + L.w + 2; x++) open(x, LIGHT_DOOR.y + 1);
  for (let x = REEF_ZONE.x; x < REEF_ZONE.x + REEF_ZONE.w; x++) for (let y = REEF_ZONE.y; y <= REEF_ZONE.y + REEF_ZONE.h; y++) if (isleAt(x, y) === 'sink') open(x, y);
  // 3) 島の 近くの 海は あさい 海（青い）・遠くは 深い 海
  const snap = t.slice();
  const land = (x, y) => { const v = x >= 0 && y >= 0 && x < W && y < H ? snap[y * W + x] : T.DEEP; return v !== T.DEEP && !isCur(v); };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (get(x, y) !== T.DEEP) continue;
    let near = false;
    for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) if (land(x + dx, y + dy)) { near = true; break; }
    if (near) set(x, y, T.WATER);
  }
  // 7) しずむ前の島の まわりの サンゴの 岩（しおの流れ・浜の となりは さける）
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (get(x, y) !== T.WATER || !inIsle(IS.sink, x, y, 1.9) || inIsle(IS.sink, x, y, 1.15)) continue;
    let ok = true;
    for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1; dx++) { const v = get(x + dx, y + dy); if (isCur(v) || (v !== T.WATER && v !== T.DEEP && v !== T.C7S_REEF)) { ok = false; break; } }
    if (ok && hash2(x, y, 1707) < 0.22) set(x, y, T.C7S_REEF);
  }
  return t;
}

// ───────────── 千年前の 人（NPC）─────────────
function seaNpcs() {
  const at = (p) => [p.x, p.y];
  const VS = VILLAGE_SPOTS;
  return [
    // ナギの村
    npc('c7s_elder', '村長のおばば', at(C7S_POS.elder), 'c7s_oldwoman', 'c7s_elder', { dir: 'right' }),
    npc('c7s_inn', '宿屋のおかみ', at(V(VS.inn.x, VS.inn.y)), 'c7s_woman', 'c7s_inn'),
    npc('c7s_shrine', '海のほこらのみこ', at(C7S_POS.shrine), 'c7s_miko', 'c7s_shrine', { dir: 'right' }),
    npc('c7s_weapon', '武器屋', at(V(VS.weapon.x, VS.weapon.y)), 'c7s_man', 'c7s_weapon'),
    npc('c7s_armor', '防具屋', at(V(VS.armor.x, VS.armor.y)), 'c7s_woman', 'c7s_armor'),
    npc('c7s_item', '道具屋', at(V(VS.item.x, VS.item.y)), 'c7s_girl', 'c7s_item'),
    npc('c7s_kid', 'ナギの村の子ども', at(V(6, 7)), 'c7s_kid', 'c7s_kid', { wander: 2 }),
    npc('c7s_town1', '漁師のおじさん', at(V(14, 7)), 'c7s_man', 'c7s_town1', { wander: 1 }),
    npc('c7s_town2', 'あみをあむおばあさん', at(V(13, 10)), 'c7s_oldwoman', 'c7s_town2'),
    npc('c7s_town3', '村のむすめ', at(V(5, 13)), 'c7s_girl', 'c7s_town3', { wander: 1 }),
    npc('c7s_town4', '旅の船乗り', at(V(19, 6)), 'c7s_sailor', 'c7s_town4', { wander: 1 }),
    npc('c7s_town5', 'カイのとなりのおばさん', at(V(14, 11)), 'c7s_woman', 'c7s_town5'),
    // カイの じいちゃん（灯台守のゲンじい。灯台の ボスに 勝つと 村に もどる。灯台 4階では maps/c7s-light.js）
    npc('c7s_gen_home', '灯台守のゲンじい', at(C7S_POS.kaiHome), 'c7s_keeper', 'c7s_gen_home', { dir: 'left', show: { all: [WIN7S] } }),
    // 貝がらの小島の 漁師（時をこえる手紙 2）・星見の島の おじいさん（時をこえる手紙 3）
    npc('c7s_fisher', '小島の漁師', [34, 32], 'c7s_man', 'c7s_fisher'),
    npc('c7s_stargazer', '星見のおじいさん', [6, 29], 'c7s_oldman', 'c7s_stargazer', { dir: 'down' }),
    // しずむ前の島の 北の 海の 海賊船（中ボス。B の きまった 戦い c7_reef。大きな 人の え）
    npc('c7s_reef_npc', '海賊船', [REEF_SHIP.x, REEF_SHIP.y], 'c7s_ship_npc', 'c7s_reef_event', { big: true, show: { not: [C7S.reef] } }),
  ];
}

// 町や 家の 中（時の砂時計が 使えない）
export const C7S_TOWNS = [VILLAGE];
export const NOW_TOWNS7S = [KUMOI_TOWN, STAR_TOWN];

function seaZone(x, y) {
  if (inRect(x, y, VILLAGE, 1)) return 'safe:village';
  if (inRect(x, y, LIGHT_WALL, 2) || inRect(x, y, REEF_ZONE, 1)) return 'safe:light';
  if (!isleAt(x, y)) return 'safe:sea';
  return 't7_sea';
}
function seaArea(x, y) {
  if (inRect(x, y, VILLAGE)) return VILLAGE.name;
  if (inRect(x, y, LIGHT_WALL, 2)) return 'しずむ前の島の灯台';
  const k = isleAt(x, y);
  return k ? ISLE_NAMES7S[k] : C7S_SEA_NAME;
}

function buildSea(maps) {
  const present = maps[PRESENT_SEA];
  const t = seaTiles(present);
  const m = {
    id: C7S_SEA, name: C7S_SEA_NAME, kind: 'field', bgm: 'c7s_sea', dark: false,
    // 千年前: 少し セピアがかった 色（第6章の 千年前・第1幕と おなじ）
    past: true, theme: 'past', dusk: { color: 'rgba(150, 110, 60, 0.10)' },
    sky3d: { bg: '#6aa8e0', fog: 0xbcd8f0 },
    timePair: PRESENT_SEA,
    w: present.w, h: present.h, tiles: t, gates: [],
    npcs: seaNpcs(), chests: [], signs: [], warps: [], boards: [], triggers: [], actions: [], sparkles: [], links: [],
    roofs: VILLAGE_ROOFS.map(([x, y, w, h, color]) => ({ x: VILLAGE.x + x, y: VILLAGE.y + y, w, h, color })),
    labels: [
      { name: VILLAGE.name, x: VILLAGE.x, y: VILLAGE.y, w: VILLAGE.w, h: VILLAGE.h },
      { name: 'しずむ前の島の灯台', x: LIGHT_WALL.x, y: LIGHT_WALL.y - 2, w: LIGHT_WALL.w, h: 4 },
      ...Object.entries(ISLE_NAMES7S).filter(([k]) => k !== 'hanono').map(([k, name]) => ({ name, x: Math.round(IS[k].cx - IS[k].rx), y: Math.round(IS[k].cy - IS[k].ry), w: Math.round(IS[k].rx * 2), h: Math.round(IS[k].ry * 2) })),
    ],
    zoneAt: seaZone, areaName: seaArea,
    spawnCounts: { t7_sea: 12 },
    // 村の 中は 村の 曲（千年前の 里と おなじ）。灯台の 前は 灯台の 曲
    bgmAt: (x, y) => (inRect(x, y, VILLAGE) ? 'past_village' : inRect(x, y, LIGHT_WALL, 3) ? 'c7s_light' : 'c7s_sea'),
    noFlyText: '風の笛をふいた！\nしかし、何も起こらなかった…\n（千年前の空には、アステルは来られないようだ。今へは、時の砂時計でもどろう）',
    timeNoUse: (x, y) => (C7S_TOWNS.some((r) => inRect(x, y, r)) ? 'town' : null),
    fcStart: [C7S_POS.villageIn.x, C7S_POS.villageIn.y],
    timeHome: [C7S_POS.villageIn.x, C7S_POS.villageIn.y],
  };
  // 灯台の とびら（中ボスを たおすと 海賊の くさりが 切れて 開く）
  const D = LIGHT_DOOR;
  m.gates.push({ x: D.x, y: D.y, closed: T.ANC_DOOR, open: T.RUIN_DOOR, flag: C7S.reef });
  m.warps.push({ x: D.x, y: D.y, to: c7slArrive(1) });
  m.links.push({ x: D.x, y: D.y, to: 'c7s_light_1f' });
  m.actions.push({ x: D.x, y: D.y, script: 'c7s_light_door', show: { not: [C7S.reef] } });
  // はじめて 千年前の クモイの 海に 来た（どこに 着いても）・村に 着いた（c7_isle）・しずむ前の島の 北の 浜の 海賊船（c7_reef）
  m.triggers.push({ id: 'c7s_arrive', x: 0, y: 0, w: m.w, h: m.h, script: 'c7s_arrive', show: { all: [C7S.sea], not: [ARRIVE7S] } });
  m.triggers.push({ id: 'c7s_isle_arrive', x: VILLAGE.x, y: VILLAGE.y, w: VILLAGE.w, h: VILLAGE.h, script: 'c7s_isle_arrive', show: { all: [C7S.sea], not: [C7S.isle] } });
  m.triggers.push({ id: 'c7s_reef_event', ...REEF_ZONE, script: 'c7s_reef_event', show: { all: [C7S.isle], not: [C7S.reef] } });
  // 海のほこらの 祭だん（記録）・井戸
  m.actions.push({ ...C7S_POS.altar, script: 'c7s_altar' }, { ...V(VILLAGE_SPOTS.well.x, VILLAGE_SPOTS.well.y), script: 'c7s_well' });
  // かんばん
  m.signs.push({ x: VILLAGE.x + 12, y: VILLAGE.y - 1, text: '流木の札だ。\n「ナギの村　海とともに生きる村」' });
  m.signs.push({ x: 20, y: 38, text: '古い石の札だ。\n「しずむ前の島　灯台の火は、海の道しるべ」' });
  m.signs.push({ x: 46, y: 32, text: '流木の札だ。\n「← しおの流れにのると、貝がらの小島へ」' });
  for (const s of m.signs) m.tiles[s.y * m.w + s.x] = T.SIGN;
  const NB = ([x, y], kind, name) => ({ x: VILLAGE.x + x, y: VILLAGE.y + y, kind, name });
  m.boards.push(NB([5, 5], 'inn', '宿屋'), NB([18, 5], 'general', '村の店'), NB([12, 4], 'temple', '海のほこら'));
  // フィールドの 小さな 宝箱（道具）
  m.chests.push({ id: 'c7s_ow0', x: 36, y: 32, item: 'magic_water', n: 2 }, { id: 'c7s_ow1', x: 10, y: 46, item: 'seed_agi', n: 1 }, { id: 'c7s_ow2', x: 64, y: 54, item: 'revive_flower', n: 2 });
  // 時をこえる手紙: うめる 所（千年前。たのまれた あと・うめる まで）
  for (const k of LETTER7S_SIDE) {
    const p = LETTER7S_SPOTS[k];
    m.npcs.push(npc(`c7s_bury_${k}`, '手紙をうめる場所', [p.x, p.y], 'capsule_hole', `c7s_letter_bury_${k}`, { solid: false, show: { all: [LETTER7S.start(k)], not: [LETTER7S.bury(k)] } }));
  }
  // 宝箱・手紙の 場所・人の 立つ マスは 歩ける ままに
  for (const c of [...m.chests, ...Object.values(LETTER7S_SPOTS), ...m.npcs.filter((n) => !n.big)]) {
    const k = c.y * m.w + c.x;
    if (TILE_INFO[m.tiles[k]]?.solid) m.tiles[k] = T.SAND;
  }
  return m;
}

// ───────────── 今の クモイ地方（kumoi）に たす もの ─────────────
function addPresent(maps) {
  const s = maps[PRESENT_SEA];
  s.timePair = C7S_SEA;
  s.timeNoUse = (x, y) => (NOW_TOWNS7S.some((r) => inRect(x, y, r)) ? 'town' : null);
  s.timeHome = [Math.floor(KUMOI_POS.gateOut.x), Math.floor(KUMOI_POS.gateOut.y)];
  // カリムが 仲間に なった あと、トキネの 話を 聞くまでは、砂時計の 砂が 鳴る だけ（world/time-glass.js の GLASS_TEXT.c7swait。story-c7s.js が たす）
  s.timeSpot = (x, y, has) => (has(C7S.sea) ? '' : 'c7swait');
  // 時をこえる手紙: 見つける 所（今。千年前で うめた あと・見つける まで）
  for (const k of LETTER7S_SIDE) {
    const p = LETTER7S_SPOTS[k];
    s.npcs.push(npc(`c7s_dig_${k}`, '時をこえる手紙', [p.x, p.y], 'capsule_spot', `c7s_letter_dig_${k}`, { solid: false, show: { all: [LETTER7S.bury(k)], not: [LETTER7S.found(k)] } }));
  }
}

export const C7S_SEA_MAPS = [C7S_SEA];
export function attachC7sSea(maps) {
  addPresent(maps);
  maps[C7S_SEA] = buildSea(maps);
}
export { inRect, isleAt as seaIsleAt };
