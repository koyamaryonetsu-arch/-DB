// 第45回（ドラクエふう D1）: 素材配合の 大事な物 2つ（items.js で まぜる）
//
// ・四季のこよみ: ひみつのダンジョンの 地下40階（黄金の古代の階の はじめ）の 休み所の 宝箱（data/secret.js の sdKeyRewards）。
//   せいれい系 2ひきと 配合すると、こよみのせいれいが 生まれる（素材配合。品は なくなる）
// ・竜王のしるし: サファラ闘技場の 伝説の部 ランク8（伝説のチャンピオン）を 勝ちぬくと（data/arena.js の key・world/arena.js の clearRewards）。
//   ドラゴン系 2ひきと 配合すると、竜王のまごが 生まれる
// ・どちらも 1人 1つ（まだ 持っていない・その 子を 配合で 生んだ ことが ない 人だけ もらえる。companions-dqm.js の dqKeyDue）。店では 売らない

export const DQM_ITEMS = {
  koyomi_book: {
    name: '四季のこよみ', type: 'key',
    desc: '春・夏・秋・冬の絵がかかれた、古いこよみの本。せいれい系の魔物2ひきと配合すると、何かが生まれるという。',
  },
  ryuou_seal: {
    name: '竜王のしるし', type: 'key',
    desc: '竜の王の紋章がきざまれた、黒い石のしるし。ドラゴン系の魔物2ひきと配合すると、何かが生まれるという。',
  },
};

export const DQM_ITEM_KANA = {
  koyomi_book: 'しきのこよみ', ryuou_seal: 'りゅうおうのしるし',
};
