// 第88回 G9班: ワンピースの 品（docs/plan-r88-anime-gear.md の 3-2・4-12 の「ナミの 天候棒」）
//   作品の 職業（海賊・ゴム人間・ニカ・海賊王）は 素手と ツメ・服と 道着・頭は つけられる
//   ・天候棒 … 4だんに 生まれ変わる（天候棒 → 完成版 → 魔法の 天候棒 → ゼウスの 天候棒）。どれも 雷の力。
//     天候の 職業（気象予報士・お天気キャスター・天候をあやつる者・天候の神）が 持つと、「使う」が 今の 天気で かわる
//     （晴れ ＝ ミラージュ＝テンポ・雨 ＝ レイン＝テンポ〈2だんから〉・かみなり ＝ その だんの 雷の 技。use.weather。shared/battle-r88.js の useAbilityOf）
//     4だんめへは ビッグ・マムの まぼろしに 勝って いる こと（need.rivals）
//   ・三刀流 … ゾロの 刀を 3本 持って いると、どれを つけても 追撃（そろい santoryu）
//   ・悪魔の実 … 力が 大きく 上がり、氷に 弱く なる（作品では 海に 弱い）
//   ・今 ある 麦わらぼうしにも 作品を つけた（R88_TAG_ONEPIECE。強さ・手に入れ方は かえない）
//   作品の 字は 使える 字に 直した（鬼 → おに・閻魔 → えんま・衝撃 → しょうげき・海楼石 → 海ろう石 など。設計書の「実装メモ（G9班）」）
//   入れない 品: 古代兵器・フランキーの 武器（設計書 3-2）
import { weapon, armor, shield, head, acc, priceUp } from './items-r88-kit.js?v=27b736e61284';

const O = { work: 'onepiece' };
const Z = { work: 'onepiece', set: 'santoryu' };
// 天候棒の 使う（天候の 職業が 持つと 天気で かわる）
const tact = (thunder, rain) => ({ ability: thunder, weather: { sun: 'r88u_op_mirage', ...(rain ? { rain: 'r88u_op_rain' } : {}), thunder } });
export const CLIMA_TACTS = ['r88_op_tact1', 'r88_op_tact2', 'r88_op_tact3', 'r88_op_tact4'];

const GEAR = {
  // ───── 麦わらの 一味 ─────
  r88_op_vest: { ...armor('gi', 'fu3'), ...O, name: '赤いベスト', fx: [{ k: 'hp', v: 4 }], bonus: { agi: 4 }, desc: '麦わらぼうしの船長が着ている、前の開いた赤いベスト。動きやすい。最大HPが上がる。' },
  r88_op_wado: { ...weapon('sword', 'mei'), ...Z, name: '和道一文字', fx: [{ k: 'crit', v: 6 }], look: 'katana', desc: '白いさやの名刀。剣士が、むかしのやくそくといっしょに受けついだ。会心の一撃が出やすい。' },
  r88_op_kitetsu: { ...weapon('sword', 'mei'), ...Z, name: '三代おにてつ', bonus: { str: 14 }, resist: { confuse: 1.3 }, look: 'katana', desc: '持ち主に悪いことが起きるといわれる刀。剣士は、運だめしをして手に入れた。力が上がるが、混乱にかかりやすい。' },
  r88_op_yubashiri: { ...weapon('sword', 'fu3'), ...Z, name: '雪走', fx: [{ k: 'el_ice', v: 4 }], look: 'katana', desc: '軽くて、よくしなる刀。雪のように白いはもん。ふつうの攻撃が氷になる。' },
  r88_op_shusui: { ...weapon('sword', 'mei'), ...Z, name: '秋水', fx: [{ k: 'slay_undead', v: 6 }], bonus: { str: 6 }, look: 'katana', desc: '黒くかがやく、重い名刀。ゆうれい船の島で、むかしの剣士から受けついだ。ゾンビ系の敵に大きなダメージ。' },
  r88_op_enma: { ...weapon('sword', 'den'), ...Z, name: 'えんま', fx: [{ k: 'atk', v: 8 }], bonus: { str: 26, mp: -40 }, look: 'katana', desc: '地ごくの王の名をもつ名刀。持つ人の力を、かってにすいとって強くなる。攻撃力がとても高いが、最大MPが下がる。' },
  r88_op_kuroashi: { ...acc('mei'), ...O, name: '黒足のくつ', bonus: { str: 16, agi: 4 }, desc: 'コックの手は料理のためにある。足だけで戦う、黒いくつ。力が上がる。' },
  r88_op_raid: { ...armor('cloth', 'mei'), ...O, name: 'レイドスーツ', fx: [{ k: 'evade', v: 6 }], bonus: { agi: 6 }, desc: '着るとすがたが消える、黒いスーツ。だれでも装備できる。敵の攻撃をかわしやすくなる。' },
  r88_op_pink: { ...head('fu3'), ...O, name: 'ピンクのぼうし', fx: [{ k: 'guard_poison', v: 4 }], desc: 'トナカイの船医が、たいせつな先生からもらったピンクのぼうし。毒にかかりにくい。' },
  r88_op_rumble: { ...acc('fu3'), ...O, name: 'ランブルボール', bonus: { str: 6, heal: 4 }, use: { ability: 'r88u_op_rumble' }, desc: 'トナカイの船医が作った、ふしぎな薬の玉。使うと、少しの間、攻撃力が上がる。' },
  r88_op_soul: { ...weapon('staff', 'mei'), ...O, name: 'ソウルソリッド', fx: [{ k: 'el_ice', v: 6 }], bonus: { mag: 8, agi: 4 }, look: 'cane', desc: 'ほねの音楽家の、つえの中にかくした細い剣。つめたい冷気をまとう。つえと同じあつかい。ふつうの攻撃が氷になる。' },
  r88_op_sogeking: { ...head('fu3'), ...O, name: 'そげキングの仮面', fx: [{ k: 'crit', v: 4 }], desc: '「そげキの島」から来たという、正義のヒーローの仮面。マントつき。会心の一撃が出やすい。' },
  r88_op_kabuto: { ...weapon('boomerang', 'mei'), ...O, name: 'カブト', fx: [{ k: 'el_fire', v: 6 }], look: 'crescent', desc: '空島の貝を組みこんだ、大きなパチンコ。火の鳥の形の玉もうてる。ふつうの攻撃が炎になる。かじ屋できたえると……？' },
  r88_op_kurokabuto: { ...weapon('boomerang', 'mei'), ...O, name: '黒カブト', fx: [{ k: 'el_fire', v: 6 }, { k: 'chase', v: 5 }], bonus: { str: 6 }, look: 'wing', desc: '植物のたねを組みこんだ、黒い大きなパチンコ。にぎると大きくなる。ふつうの攻撃が炎になり、ときどきもう1回攻撃する。' },
  r88_op_impact: { ...shield('fu3'), ...O, name: 'しょうげき貝', fx: [{ k: 'counter', v: 4 }], look: 'shell', desc: '空島の貝。受けた力をためて、そのままうち返す。ときどきやりかえす。' },
  r88_op_reject: { ...acc('mei'), ...O, name: 'はいげき貝', bonus: { str: 8 }, use: { ability: 'r88u_op_reject', hpCost: 0.1 }, desc: '空島の、とても強い貝。ためた力を10倍にして返すが、使う人の体にもひびく。使うと、自分のHPを少し使って、敵1体に大きな一げき。' },
  r88_op_jet: { ...acc('fu3'), ...O, name: 'ふん風貝', bonus: { agi: 16 }, desc: '空島の、風をふき出す貝。くつにつければ、空も走れそう。素早さが上がる。' },
  r88_op_logpose: { ...acc('fu3'), ...O, name: '記録指針', bonus: { agi: 10, mag: 4 }, desc: '次の島の方角をさす、うで時計のような道具。グランドラインの旅にかかせない。素早さが上がる。' },
  r88_op_vivre: { ...acc('fu3'), ...O, fx: [{ k: 'regen', v: 4 }], name: 'ビブルカード', bonus: { hp: 16 }, desc: '持ち主のいる方へ、少しずつ動く紙。持ち主が元気だと、紙も元気。行動するたびにHPが少し回復する。' },
  // ───── ナミの 天候棒（4だんに 生まれ変わる）─────
  r88_op_tact1: { ...weapon('staff', 'fu3'), ...O, name: '天候棒', fx: [{ k: 'el_bolt', v: 4 }], bonus: { mag: 6 }, use: tact('r88u_op_cyclone', false), look: 'clima', desc: '航海士のために、仲間が作った3本の棒。風や雷のまねができる。ふつうの攻撃が雷になる。使うと、敵1体に風。天候の職業が持つと、今の天気で使う技がかわる。' },
  r88_op_tact2: { ...weapon('staff', 'mei'), ...O, name: '完成版天候棒', fx: [{ k: 'el_bolt', v: 6 }], bonus: { mag: 12 }, use: tact('r88u_op_thunderbolt', true), look: 'clima', desc: '空島の貝を入れて作り直した天候棒。本物の雲が作れる。ふつうの攻撃が雷になる。使うと、敵1グループに雷。天候の職業が持つと、今の天気で使う技がかわる。' },
  r88_op_tact3: { ...weapon('staff', 'mei'), ...O, name: '魔法の天候棒', fx: [{ k: 'el_bolt', v: 6 }], bonus: { mag: 18, agi: 6 }, use: tact('r88u_op_raiun', true), look: 'clima', desc: '空にうかぶ天気の研究所で、天気の科学を組みこんだ天候棒。天気のたまごを出す。ふつうの攻撃が雷になる。使うと、敵全体に雷。天候の職業が持つと、今の天気で使う技がかわる。' },
  r88_op_tact4: { ...weapon('staff', 'den'), ...O, name: 'ゼウスの天候棒', fx: [{ k: 'el_bolt', v: 8 }], bonus: { mag: 26, agi: 8, heal: 10 }, use: tact('r88u_op_zeus', true), look: 'clima', desc: 'しゃべる雷雲ゼウスが、航海士の仲間になって1つになった天候棒。ふつうの攻撃が雷になる。使うと、敵全体に大きな雷。天候の職業が持つと、今の天気で使う技がかわる。' },
  // ───── ライバル・海軍の 品 ─────
  r88_op_amenohabakiri: { ...weapon('sword', 'mei'), ...O, name: '天羽々斬', fx: [{ k: 'crit', v: 6 }], bonus: { agi: 4 }, look: 'katana', desc: 'ワノ国の大名がのこした、2本の名刀の1本。今はその子どもが受けついでいる。会心の一撃が出やすい。' },
  r88_op_yoru: { ...weapon('sword', 'den'), ...O, name: '黒刀・夜', fx: [{ k: 'crit', v: 8 }], bonus: { str: 20, agi: 6 }, look: 'yoru', desc: '世界一の剣士がせおう、十字の形の大きな黒い刀。剣の中で、いちばんの名刀。会心の一撃がとても出やすい。' },
  r88_op_murakumo: { ...weapon('spear', 'den'), ...O, name: 'むら雲切', reach: 'group', bonus: { str: 22, hp: 40 }, use: { ability: 'r88u_op_murakumo' }, look: 'halberd', desc: '白いひげの大海賊の、大きななぎなた。ふつうの攻撃が、同じ種類の敵みんなにとどく。使うと、大地をゆらして敵全体を打つ。' },
  r88_op_hassaikai: { ...weapon('bat', 'den'), ...O, name: '八さいかい', fx: [{ k: 'el_bolt', v: 8 }], bonus: { str: 24, hp: 50 }, look: 'spiked', desc: '空をとぶ竜の大海賊の、トゲのついた金棒。ふり下ろすと、雷がとどろく。ふつうの攻撃が雷になる。' },
  r88_op_griffon: { ...weapon('sword', 'mei'), ...O, name: 'グリフォン', fx: [{ k: 'crit', v: 6 }], bonus: { str: 4 }, look: 'scimitar', desc: '赤いかみの大海賊の、少しまがった刀。会心の一撃が出やすい。' },
  r88_op_kikoku: { ...weapon('sword', 'mei'), ...O, name: 'きこく', reach: 'group', bonus: { str: 4 }, look: 'great', desc: '外科医とよばれる海賊の、とても長い大太刀。ふつうの攻撃が、同じ種類の敵みんなにとどく。' },
  r88_op_napoleon: { ...weapon('sword', 'mei'), ...O, name: 'ナポレオン', fx: [{ k: 'chase', v: 6 }], bonus: { str: 6 }, look: 'great', desc: '大きなお母さん海賊のぼうしに入っている、しゃべる剣。大きな剣に変身する。ときどきもう1回攻撃する。' },
  r88_op_claw: { ...weapon('claw', 'mei'), ...O, name: 'クロコダイルのかぎづめ', fx: [{ k: 'poison', v: 6 }], bonus: { agi: 4 }, look: 'claw', desc: '砂の国をねらった海賊の、左手の金のかぎづめ。先に毒がある。ときどき敵を毒にする。' },
  r88_op_kiribachi: { ...weapon('axe', 'fu3'), ...O, name: 'キリバチ', fx: [{ k: 'crit', v: 4 }], look: 'pirate', desc: 'のこぎりのような歯がならんだ、大きなノコギリザメの形の刀。オノと同じあつかい。会心の一撃が出やすい。' },
  r88_op_ace: { ...head('mei'), ...O, name: 'エースのぼうし', fx: [{ k: 'res_fire', v: 6 }], bonus: { agi: 4 }, desc: '火の体をもつ兄の、オレンジ色のテンガロンハット。赤いかざりつき。炎に強い。' },
  r88_op_jitte: { ...weapon('dagger', 'mei'), ...O, name: '十手', fx: [{ k: 'mana', v: 6 }], bonus: { def: 6 }, look: 'stiletto', desc: '白いけむりの海軍の、大きな十手。先に、ふしぎな力を弱める石がついている。攻撃が当たるとMPが回復する。' },
  r88_op_shigure: { ...weapon('sword', 'fu3'), ...O, name: 'たしぎの時雨', fx: [{ k: 'chase', v: 4 }], look: 'katana', desc: 'めがねの海軍の女剣士の刀。ときどきもう1回攻撃する。' },
  r88_op_shikomi: { ...weapon('staff', 'mei'), ...O, name: '仕こみづえ', fx: [{ k: 'atk', v: 5 }], bonus: { mag: 8 }, use: { ability: 'r88u_op_shikomi' }, look: 'cane', desc: '目をとじた海軍の大将の、つえにかくした名刀。使うと、空から重さをかけて、同じ種類の敵みんなの素早さを下げる。' },
  r88_op_justice: { ...armor('cloth', 'fu3'), ...O, name: '正義のコート', fx: [{ k: 'def', v: 4 }], desc: 'せなかに大きく「正義」と書かれた、海軍の白いコート。だれでも装備できる。守備力が上がる。' },
  r88_op_kairo: { ...acc('fu3'), ...O, name: '海ろう石の手じょう', bonus: { def: 14, mag: -8 }, desc: '海のふしぎな石でできた手じょう。ふしぎな力を弱める。守備力が上がるが、攻撃魔力が下がる。' },
  r88_op_akuma: { ...acc('mei'), ...O, name: '悪魔の実', bonus: { str: 18, mag: 10 }, resist: { ice: 1.3 }, desc: 'うずまきもようの、ふしぎな実。食べるとふしぎな力が身につくが、とてもまずい。力が大きく上がるが、氷に弱くなる（物語では、海に弱くなる）。' },
};
priceUp(GEAR);

export const ITEMS_R88_ONEPIECE = GEAR;

// 生まれ変わり（天候棒の 4だん・カブト → 黒カブト）
//   ゼウスの 天候棒へは、ビッグ・マムの まぼろしに 勝って いる こと（need.rivals。shared/gear-r88.js の rebirthNeedLack）
export const R88_REBIRTH_ONEPIECE = {
  r88_op_tact1: { to: 'r88_op_tact2', at: 3, gold: 8000, mats: [['star_shard', 6], ['wind_feather', 5]] },
  r88_op_tact2: { to: 'r88_op_tact3', at: 4, gold: 12000, mats: [['star_shard', 8], ['magic_powder', 5]] },
  r88_op_tact3: { to: 'r88_op_tact4', keep: true, gold: 30000, mats: [['star_shard', 12], ['dragon_scale', 5], ['limit_stone', 2]], need: { rivals: ['op_bigmom'] } },
  r88_op_kabuto: { to: 'r88_op_kurokabuto', gold: 20000, mats: [['star_shard', 10], ['beast_fang', 5]] },
};
// 今 ある 品に 作品を つける（強さ・手に入れ方は かえない。items-r88.js の tagR88Works）
export const R88_TAG_ONEPIECE = { straw_hat: 'onepiece' };

export const R88_ONEPIECE_KANA = {
  r88_op_vest: 'あかいべすと', r88_op_wado: 'わどういちもんじ', r88_op_kitetsu: 'さんだいおにてつ', r88_op_yubashiri: 'ゆばしり', r88_op_shusui: 'しゅうすい',
  r88_op_enma: 'えんま', r88_op_kuroashi: 'くろあしのくつ', r88_op_raid: 'れいどすーつ', r88_op_pink: 'ぴんくのぼうし', r88_op_rumble: 'らんぶるぼーる',
  r88_op_soul: 'そうるそりっど', r88_op_sogeking: 'そげきんぐのかめん', r88_op_kabuto: 'かぶと', r88_op_kurokabuto: 'くろかぶと', r88_op_impact: 'しょうげきがい',
  r88_op_reject: 'はいげきがい', r88_op_jet: 'ふんぷうがい', r88_op_logpose: 'きろくししん', r88_op_vivre: 'びぶるかーど',
  r88_op_tact1: 'てんこうぼう', r88_op_tact2: 'かんせいばんてんこうぼう', r88_op_tact3: 'まほうのてんこうぼう', r88_op_tact4: 'ぜうすのてんこうぼう',
  r88_op_amenohabakiri: 'あめのはばきり', r88_op_yoru: 'こくとうよる', r88_op_murakumo: 'むらくもぎり', r88_op_hassaikai: 'はっさいかい', r88_op_griffon: 'ぐりふぉん',
  r88_op_kikoku: 'きこく', r88_op_napoleon: 'なぽれおん', r88_op_claw: 'くろこだいるのかぎづめ', r88_op_kiribachi: 'きりばち', r88_op_ace: 'えーすのぼうし',
  r88_op_jitte: 'じって', r88_op_shigure: 'たしぎのしぐれ', r88_op_shikomi: 'しこみづえ', r88_op_justice: 'せいぎのこーと', r88_op_kairo: 'かいろうせきのてじょう',
  r88_op_akuma: 'あくまのみ',
};
