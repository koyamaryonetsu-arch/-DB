// 第6章 Step 5（A: 世界と物語）の 品（items-ch6-key.js で まぜる。plan-ch6.md の 13-2・13-5・15）
// ・大事な物: 星読みのしおり（ミナモに もらう。時計塔の 中で「使う」と、その 階の ヒントを ミナモの 星読みで 1回ずつ 読める。world/tokei-use.js）
// ・より道「トキネの砂時計のかざり」の ごほうび（src: 'gift'「たくされた品」。ランク10の ★5・レア度 4）: 6こで 時の砂のブローチ
const ACC = { type: 'acc', rank: 10, rarity: 4, src: 'gift' };

export const CH6C_ITEMS = {
  c6s_bookmark: {
    name: '星読みのしおり', type: 'key', menuUse: 'bookmark',
    desc: 'ミナモがくれた、星の形のしおり。止まった時計塔の中で「使う」と、その階のことを、ミナモの星読みが1回ずつ教えてくれる。',
  },
  c6s_orn_brooch: {
    ...ACC, name: '時の砂のブローチ', bonus: { hp: 40, agi: 18, mag: 12, def: 12, heal: 10 }, resist: { sleep: 0.6, confuse: 0.6 },
    desc: 'トキネの砂時計のかざりを6つ集めたお礼。光の砂が中で流れている。素早さが上がり、ねむりや混乱にかかりにくい。',
  },
};
export const CH6C_KANA = {
  c6s_bookmark: 'ほしよみのしおり', c6s_orn_brooch: 'ときのすなのぶろーち',
};
