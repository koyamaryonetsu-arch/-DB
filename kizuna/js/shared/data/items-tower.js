// 第5章 Step 2「星の塔」の ボスが 落とす 品（B: 戦い。items.js で まぜる）
// ボスは かならず、1人 1つの アクセサリーを 落とす（loot.js の きまり）
export const ITEMS_TOWER = {
  // 星の番人アルゴスが 落とす: 3つの 目の もようの ペンダント。素早さと 魔力が 上がり、マヌーサと 混乱に 強く なる
  argos_pendant: {
    name: '星見のペンダント', type: 'acc', rank: 8, unique: true, bonus: { agi: 12, mag: 10, def: 6 }, resist: { blind: 0.5, confuse: 0.6 }, price: 0, sell: 1600,
    desc: '星の番人アルゴスがのこした、3つの目のもようのペンダント。素早さと魔力が上がり、マヌーサと混乱にかかりにくくなる。',
  },
};

export const TOWER_ITEM_KANA = {
  argos_pendant: 'ほしみのぺんだんと',
};

// 第2部 第6章 Step 5: 止まった時計塔の 宝箱（名前の 約束 docs/plan-ch6.md の 15 の TOWER_TREASURE_FLOORS）。中みは items-tokei.js
export { TOWER_TREASURE_FLOORS, ITEMS_TOKEI, TOKEI_DROPS } from './items-tokei.js?v=dd582b3d4c53';
