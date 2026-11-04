// 第2部 第7章 第2幕「海の紋章」の 魔物の 仲間（companions.js で まぜる）と、ゲスト・酒場の カイ（名前の 約束 docs/plan-ch7.md の 4-3）
// 第26回の きまり（data/companions-c7.js と おなじ）:
// ・ふつうの 魔物は 1/10〜1/16・強い 魔物は 1/22〜1/26
// ・growth の 合計は 今までの 仲間と おなじ はば（力の 魔物 5.8〜6.1・呪文の 魔物 6.8〜7.3）
// ・learn の 技は 味方が 使っても うごく もの（ボスの しかけの 技・なかまを よぶ 技は 入れない）
// ・mix … 系統まぜ配合で 生まれる 相手の 系統（breed-mix.js）。5しゅ ぜんぶ
//   系統配合（familyPool）の 子にも なるのは A の 海賊オウムだけ（第7章 第1幕と おなじ きまり）。F〜C の 4しゅは noFamily
//   ドラゴン F・ゾンビ E・せいれい D・ドラゴン C・悪魔 A（docs/plan-r53-breed-more.md の 1 の 足りない 所。第1幕の あとで 少ない 所）
//   第7章の B〜S は 2わりまで（test/monsters-r43a.test.js）なので、魚人の海賊は ドラゴン B ではなく C
//   ランクは tools/gen-monster-ranks.mjs の 表（monster-ranks.js）
// ・ここは ほかの データを import しない（酒場・ゲストの 一覧からも 読む ため）
export const FRIENDS_C7S = {
  // ドラゴン F（1/10）
  pukupuku: {
    rate: 1 / 10, mix: ['slime'], names: ['プクリン', 'ピチピチ', 'アカヒレ', 'ぷくまる'],
    growth: { hp: 1.0, mp: 0.6, str: 1.15, def: 0.9, agi: 1.25, mag: 0.6, heal: 0.5 },
    learn: [[1, 'm_tackle'], [4, 'm7s_pk_jump'], [9, 'baikiruto'], [14, 'm7s_pk_splash'], [20, 'sukara']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: '海からとび出す赤い魚。仲間になると、水たまりを見つけるたびに、ピョーンととびこんでしまう。',
  },
  // ゾンビ E（1/11）
  karon: {
    rate: 1 / 11, mix: ['dragon'], names: ['カラカラ', 'ホネタ', 'コツコツ', 'ほねがめ'],
    growth: { hp: 1.1, mp: 0.5, str: 1.15, def: 1.25, agi: 0.8, mag: 0.6, heal: 0.5 },
    learn: [[1, 'm_swing'], [4, 'm7s_kr_bone'], [9, 'sukara'], [14, 'm7s_kr_crumble'], [20, 'kabau']],
    gear: { weapons: [], armor: ['heavy'], shield: true, head: false },
    note: 'こうらをせおった、ほねのカメ。仲間になると、びっくりするたびにバラバラになって、組み立てるのを手伝わされる。',
  },
  // せいれい D（1/15）
  jugemu: {
    rate: 1 / 15, mix: ['dragon'], names: ['ジュゲ', 'クモタ', 'メガネン', 'ふわくも'],
    growth: { hp: 0.9, mp: 1.15, str: 0.9, def: 0.85, agi: 1.3, mag: 1.2, heal: 0.7 },
    learn: [[1, 'hyado'], [4, 'm7s_jg_spiny'], [9, 'm7s_jg_rain'], [14, 'm7s_jg_cloud'], [20, 'hyadaruko']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: 'hat' },
    note: '雲にのったメガネのカメ。仲間になると、雨の日に、みんなの頭の上に雲をうかべて、かさのかわりになってくれる。',
  },
  // ドラゴン C（1/16）
  fish_pirate: {
    rate: 1 / 16, mix: ['beast'], names: ['サメジ', 'ギョロ', 'フカヒレ', 'うみおとこ'],
    growth: { hp: 1.15, mp: 0.5, str: 1.3, def: 1.05, agi: 0.95, mag: 0.5, heal: 0.5 },
    learn: [[1, 'm_swing'], [4, 'm7s_fp_saber'], [9, 'baikiruto'], [14, 'm7s_fp_karate'], [20, 'm7s_fp_shout']],
    gear: { weapons: ['sword'], armor: ['heavy', 'gi'], shield: false, head: 'hat' },
    note: 'サメの顔の魚人の海賊。仲間になると、海賊をやめて、魚の売り場で元気に声を出している。',
  },
  // 悪魔 A（なりにくい 1/26）
  pirate_parrot: {
    rate: 1 / 26, mix: ['beast'], names: ['オウタ', 'ベラベラ', 'アカバネ', 'まねっこ'],
    growth: { hp: 0.85, mp: 1.2, str: 0.9, def: 0.8, agi: 1.35, mag: 1.3, heal: 0.6 },
    learn: [[1, 'mera'], [4, 'm7s_pp_peck'], [9, 'm7s_pp_mimic'], [14, 'merami'], [20, 'm7s_pp_curse']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: '船長のかたにのっていた赤いオウム。仲間になると、家族の口ぐせを、すぐに覚えてまねしてしまう。',
  },
};

// F〜C の 4しゅは 系統配合の 子には ならない（companions.js の familyPool。まぜ配合の 子には なる）
for (const sp of ['pukupuku', 'karon', 'jugemu', 'fish_pirate']) FRIENDS_C7S[sp].noFamily = true;

// ───── ゲストの カイ（千年前の 海の 小さな 島の 少年。いちばん 明るい・素早い）─────
// A が 台本の ['guest', 'kai'] で 入れる（c7_isle で 入る・Step 4 の さいごまで）。data/shops.js の GUESTS.kai
// world/party.js の guestChar → makeNpcSupportChar で、レベルは パーティーの いちばん 高い レベル（minLevel より 下には ならない）
// 職業は 忍者（素早い。ブーメラン・短剣・ぼうし）。作戦は ガンガンいこうぜ
// その子だけの 技（ひらめき技として 入る）: しおかぜブーメラン（敵みんなを 2回 打つ。abilities-c7s.js の ky7_boomerang）
// 装備は 島の 店の 品（items-c7s.js）
export const KAI_GUEST = {
  id: 'guest_kai', name: 'カイ', job: 'ninja', tactics: 'aggressive', minLevel: 72,
  look: { body: 0, hair: 3, hairColor: 0, skin: 2, color: 1, style: 'side', hcol: 'black', tone: 'tan', face: 'smile' },
  skills: ['ky7_boomerang'],
  gear: { weapon: 'c7s_island_boomerang', armor: 'c7s_island_gi', head: 'c7s_island_hat' },
};

// ───── 仲間に なった あとの 酒場の カイ（c7_kai から。A が 台本で 酒場に ならべる … shops.js の NPC_SUPPORTS と おなじ 形）─────
//   カリム（companions-c7.js の KARIM_SUPPORT）と おなじ。強さは ゲストの ときと おなじ 形
export const KAI_SUPPORT = {
  ...KAI_GUEST, id: 'npc_kai', minLevel: 74, unlock: 'c7_kai',
  desc: '千年前の海の、小さな島の少年。いつも明るくて、素早いブーメランで、みんなを助けてくれる。',
};
