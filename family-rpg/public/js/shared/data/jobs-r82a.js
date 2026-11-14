// 第82回 A班: 犬夜叉の 系統（docs/plan-jobs-r79.md の 8-0・8-1・8-3・8-5。docs/plan-r82-jobs-a.md）
//   半ようの少年（基本職）→ 鉄さいがの使い手（上級職）→ 犬夜しゃ（超級職）→ ばくりゅうはの大よう（伝説。＋ほかの 超級職 1つ）
// ・jobs.js が JOBS に まぜて、ならびの おわりに 足す（BASE_/ADV_/SUPER_/LEGEND_R82A_ORDER）
// ・この 系統だけの しくみ（shared/battle-r82a.js。どれも 戦いの 中だけ。キャラに 新しい 項目は 足さない）
//   passive.youkai … ようかい化（HP が 3わり いかで、力と 素早さが この 倍。命令を 聞かず つめで あばれる）。
//                    刀（剣の 武器）を 持って いる 間は ならない。HP が 半分より 上に もどるか「おすわり！」で もどる
//   風の技（vsBuff）… 敵 全体。自分を 強くして いる 敵ほど ダメージが 上がる
//   ばくりゅうは（bakuryu）… かまえの 技。敵の 呪文・ブレス・ためた 大技を 受けると 風で 敵 全体へ 返す（上限 つき）
// ・「妖・砕・叉」は 小学校で ならわない 字なので かな（半よう・鉄さいが・犬夜しゃ・大よう）
// ・強さ（mods の 合計）: 6.4・6.9・8.3・9.55（設計の 表の とおり）
// ・技は abilities-r82a.js・ひらめき技は hirameki-r82a.js・見た目は client/render/hero-r82a.js・えんしゅつは client/render/battlefx-r82a.js
export const BASE_R82A_ORDER = ['hanyo_boy'];
export const ADV_R82A_ORDER = ['tessaiga_user'];
export const SUPER_R82A_ORDER = ['inuyasha'];
export const LEGEND_R82A_ORDER = ['bakuryuha'];

export const JOBS_R82A = {
  hanyo_boy: {
    id: 'hanyo_boy', name: '半ようの少年', kana: 'はんようのしょうねん', short: '半よう', tier: 0, family: 'phys', color: '#c8283a',
    desc: '頭に犬のような耳がある、人とようかいの間に生まれた少年。するどいつめで戦う。HPが少なくなると、ようかいの血があばれだして、命令を聞かずに強くなる。きわめると鉄さいがの使い手になれる。',
    mods: { hp: 1.15, mp: 0.5, str: 1.3, def: 0.95, agi: 1.3, mag: 0.5, heal: 0.7 },
    weapons: ['claw', 'none'], shield: false, armor: ['cloth', 'gi'], helm: false,
    perLv: { str: 0.8, agi: 0.5 },
    passive: { youkai: 1.3 },
    learn: [[1, 'hyb_sankon'], [2, 'hyb_hana'], [3, 'hyb_hijin'], [5, 'hyb_osuwari'], [7, 'hyb_renge'], [10, 'hanyo_boy_sig']],
  },
  tessaiga_user: {
    id: 'tessaiga_user', name: '鉄さいがの使い手', kana: 'てっさいがのつかいて', short: '鉄さいが', tier: 1, req: ['hanyo_boy'], family: 'phys', color: '#b8202e',
    desc: '父からのこされた、ふしぎな刀「鉄さいが」を手にした少年。刀をもつと、ようかいの血がおさえられる。刀で敵全体を風のきずでなぎはらい、つめでも戦える。半ようの少年をきわめるとなれる。',
    mods: { hp: 1.25, mp: 0.55, str: 1.5, def: 1.05, agi: 1.35, mag: 0.5, heal: 0.7 },
    weapons: ['sword', 'claw', 'none'], shield: false, armor: ['cloth', 'gi'], helm: false,
    perLv: { str: 1, hp: 0.5 },
    passive: { youkai: 1.4 },
    learn: [[1, 'tsg_hitofuri'], [2, 'tsg_henge'], [3, 'tsg_kabau'], [5, 'tsg_kekkai'], [7, 'tsg_sankon'], [10, 'tessaiga_user_sig']],
  },
  inuyasha: {
    id: 'inuyasha', name: '犬夜しゃ', kana: 'いぬやしゃ', short: '犬夜しゃ', tier: 2, req: ['tessaiga_user'], family: 'phys', color: '#d0202c',
    desc: '赤い着物に銀色のかみ、犬の耳の半ようの少年。鉄さいがをふるって、仲間を守りながら戦う。敵の大技を風にまきこんで返す「ばくりゅうは」を使いこなす。',
    mods: { hp: 1.5, mp: 0.9, str: 1.7, def: 1.3, agi: 1.5, mag: 0.45, heal: 0.95 },
    weapons: ['sword', 'claw', 'none'], shield: false, armor: ['cloth', 'gi'], helm: false,
    perLv: { str: 1, hp: 1 },
    passive: { youkai: 1.5 },
    learn: [[1, 'iny_kaze_ren'], [2, 'iny_akai'], [3, 'iny_shinjiru'], [5, 'iny_kongou'], [7, 'iny_osaeru'], [10, 'inuyasha_sig']],
  },
  bakuryuha: {
    id: 'bakuryuha', name: 'ばくりゅうはの大よう', kana: 'ばくりゅうはのたいよう', short: '大よう', tier: 3, req: ['inuyasha'], reqSuper: 1, family: 'phys', color: '#8a1a3a',
    desc: 'ようかいの力も、人の心も、どちらも自分のものにした半よう。犬夜しゃと、ほかの超級職を1つきわめた者だけがなれる。大ようの力を命令どおりに使いこなし、敵の大技も、物理の大技も、風にまきこんで返す。',
    mods: { hp: 1.75, mp: 1.0, str: 1.95, def: 1.5, agi: 1.65, mag: 0.7, heal: 1.0 },
    weapons: ['sword', 'claw', 'none'], shield: false, armor: ['cloth', 'gi'], helm: false,
    perLv: { str: 1.5, hp: 1, def: 0.5 },
    passive: { youkai: 1.6 },
    learn: [[1, 'bry_ryurin'], [3, 'bry_meidou'], [5, 'bry_daiyou'], [7, 'bry_kongou'], [8, 'bry_chikai'], [10, 'bakuryuha_sig']],
  },
};

// 神殿の うわさ（jobs.js の JOB_HINTS に まぜる。もとの 職業を はじめた 人に だけ、名前を ださずに 聞こえる）
export const HINTS_R82A = {
  inuyasha: '鉄さいがをきわめた半ようは、銀色のかみと赤い着物の、あの少年になれるらしい…',
  bakuryuha: '犬夜しゃと、ほかの超級職を1つきわめた者は、ようかいの力を自分のものにできるらしい…',
};
