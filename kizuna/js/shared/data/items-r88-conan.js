// 第88回 G11班: 名探ていコナンの 品（docs/plan-r88-anime-gear.md の 3-6）
//   作品の 職業（少年探てい団・名探てい・名探てい王 ほか）は ブーメラン・つえ・服と ローブ
//   ・博士の 発明は「使う」品（ちょうネクタイ型変声機 ＝ 混乱・うで時計型ますいじゅう ＝ ねむり〈作品どおり 1発〉）
//   ・キック力増強シューズ ＋ どこでもボール射出ベルト … 1人が 両方 つけると 追撃（そろい conan_kick）
//   ・今 ある 虫めがね・スパイのサングラス・名探ていのステッキ・スパイの万年筆・名探ていの金の虫めがね は こわさず、
//     作品の 品として 数える（R88_TAG_CONAN。強さ・手に入れ方は かえない）
//   ・入れない 品: 本物の 銃（設計書 3-6）
//   作品の 字は 使える 字に 直した（蝶 → ちょう／腕 → うで／麻酔 → ますい／携 → けい／偵 → てい／帽 → ぼう など）
import { weapon, armor, head, acc, priceUp } from './items-r88-kit.js?v=ae365c90037d';

const C = { work: 'conan' };
const KS = { work: 'conan', set: 'conan_kick' };

const GEAR = {
  // ───── 博士の 発明 ─────
  r88_cn_henseiki: { ...acc('mei'), ...C, name: '博士のちょうネクタイ型変声機', bonus: { mag: 8, agi: 4 }, use: { ability: 'r88u_cn_voice' }, desc: '博士の発明。うらのダイヤルを回すと、一度聞いた人の声が出せる。使うと、聞いたことのある声で敵1体をだまして、混乱させる。' },
  r88_cn_masui: { ...acc('mei'), ...C, name: 'うで時計型ますいじゅう', bonus: { agi: 8, mag: 6 }, use: { ability: 'r88u_cn_masui' }, desc: '博士の発明。うで時計のふたを開けると、ねむくなるはりが1本だけとび出す。使うと、敵1体をぐっすりねむらせる（1つの戦いで1発だけ）。' },
  r88_cn_shoes: { ...acc('mei'), ...KS, name: '博士のキック力増強シューズ', bonus: { str: 16 }, desc: '博士の発明。横のダイヤルを回すと、ける力がぐんと強くなるくつ。力が上がる。ボール射出ベルトといっしょにつけると……？' },
  r88_cn_belt: { ...weapon('boomerang', 'mei'), ...KS, name: 'どこでもボール射出ベルト', fx: [{ k: 'chase', v: 6 }], bonus: { agi: 4 }, look: 'star', desc: '博士の発明。ベルトのバックルから、サッカーボールがぽんととび出す。ブーメランと同じあつかい。ときどきもう1回攻撃する。' },
  r88_cn_suspender: { ...weapon('whip', 'fu3'), ...C, name: 'しん縮サスペンダー', fx: [{ k: 'paralyze', v: 4 }], look: 'whip', desc: '博士の発明。ボタンをおすと、ぐーんとのびて、ロープにもパチンコにもなる。ムチと同じあつかい。ときどき敵をマヒさせる。' },
  r88_cn_skate: { ...acc('mei'), ...C, name: 'ターボエンジン付きスケートボード', bonus: { agi: 22 }, desc: '博士の発明。太陽の光でエンジンが回り、車にも追いつくスケートボード。素早さが大きく上がる。' },
  r88_cn_megane: { ...head('fu3'), ...C, name: '犯人追跡メガネ', fx: [{ k: 'crit', v: 4 }], desc: '博士の発明。発信機の場所がわかって、遠くもよく見えるメガネ。会心の一撃が出やすい。' },
  r88_cn_badge: { ...acc('fu3'), ...C, name: '少年探てい団のバッジ', bonus: { hp: 30 }, desc: '博士が作った、少年探てい団のバッジ。はなれた仲間と話せる。最大HPが上がる。' },
  r88_cn_light: { ...acc('fu3'), ...C, name: 'うで時計型ライト', fx: [{ k: 'res_dark', v: 4 }], desc: '博士の発明。うで時計から、明るい光が出る。くらい所でもへっちゃら。闇に強い。' },
  r88_cn_fax: { ...acc('fu3'), ...C, name: '弁当型けい帯FAX', bonus: { mp: 30 }, desc: '博士の発明。お弁当箱の形のFAX。まん中の梅ぼしをおすと動く。最大MPが上がる。' },
  // ───── コナンと 仲間 ─────
  r88_cn_jacket: { ...armor('cloth', 'fu3'), ...C, name: '青いジャケットと赤いちょうネクタイ', bonus: { agi: 10 }, desc: '小さな名探ていの、いつもの服。青いジャケットに、赤いちょうネクタイ。だれでも装備できる。素早さが上がる。' },
  r88_cn_karate: { ...armor('gi', 'mei'), ...C, name: '空手部の道着', bonus: { str: 14 }, fx: [{ k: 'hp', v: 4 }], desc: '空手の大会で優勝した、高校生の空手部の道着。けりの一発で、電柱もへこむ。力が上がる。' },
  r88_cn_shinai: { ...weapon('bat', 'fu3'), ...C, name: '平次の竹刀', fx: [{ k: 'crit', v: 4 }], look: 'bamboo', desc: '西の高校生探ていの竹刀。剣道の全国大会に出るうでまえ。会心の一撃が出やすい。' },
  r88_cn_cap: { ...head('fu3'), ...C, name: '平次の野球ぼう', bonus: { agi: 10 }, desc: '西の高校生探ていの野球ぼう。ふだんは後ろ向き。推理を始める時に、つばを前にする。素早さが上がる。' },
  r88_cn_omamori: { ...acc('fu3'), ...C, name: '和葉のお守り', fx: [{ k: 'res_dark', v: 4 }], bonus: { hp: 12 }, desc: '合気道二段の女の子が、おさななじみとおそろいで持っているお守り。闇に強い。' },
  r88_cn_kyogoku: { ...armor('gi', 'mei'), ...C, name: '京極の空手着', fx: [{ k: 'counter', v: 6 }], bonus: { str: 6 }, desc: '空手の試合で400回戦って一度も負けなかった、「けりの貴公子」の空手着。ときどきやりかえす。' },
  r88_cn_knit: { ...head('mei'), ...C, name: '黒いニットぼう', fx: [{ k: 'crit', v: 6 }], bonus: { agi: 4 }, desc: 'ねらった所はのがさない、たよれるFBIの人の黒いニットぼう。会心の一撃が出やすい。' },
  r88_cn_apron: { ...armor('cloth', 'fu3'), ...C, name: 'ポアロのエプロン', fx: [{ k: 'regen', v: 4 }], desc: '探てい事務所の下のきっさ店「ポアロ」のエプロン。店員さんのサンドイッチは、とてもおいしい。行動するたびにHPが少し回復する。' },
  r88_cn_hakui: { ...armor('robe', 'fu3'), ...C, name: '灰原の白衣', bonus: { mag: 10 }, desc: '博士の家にくらす、ふしぎな女の子の白衣。薬にとてもくわしい。攻撃魔力が上がる。' },
  r88_cn_kuro: { ...armor('cloth', 'mei'), ...C, name: '黒ずくめの服', fx: [{ k: 'res_dark', v: 6 }], bonus: { agi: 6 }, desc: 'いつも黒い服を着た、なぞの組織の服。だれでも装備できる。闇に強い。' },
  r88_cn_apto: { ...acc('mei'), ...C, name: '小さくなる薬', fx: [{ k: 'evade', v: 6 }], bonus: { agi: 12, str: -10 }, desc: 'なぞの組織が作った、体が小さくなってしまうふしぎな薬。小さくなると敵の攻撃をかわしやすくなるが、力が下がる。' },
  r88_cn_unaju: { ...acc('fu3'), ...C, name: 'うな重', fx: [{ k: 'regen', v: 4 }], bonus: { hp: 10 }, desc: '探てい団の大きな男の子の大好物。うなぎがのったごはん。行動するたびにHPが少し回復する。' },
};
priceUp(GEAR);

export const ITEMS_R88_CONAN = GEAR;
export const R88_REBIRTH_CONAN = {};
// 今 ある 品を 作品の 品として 数える（とびら・ガチャの「持って いる」。強さ・手に入れ方は かえない。items-r88.js の tagR88Works）
export const R88_TAG_CONAN = { mushimegane: 'conan', spy_glasses: 'conan', detective_cane: 'conan', spy_pen: 'conan', fq_detective_glass: 'conan' };

export const R88_CONAN_KANA = {
  r88_cn_henseiki: 'はかせのちょうねくたいがたへんせいき', r88_cn_masui: 'うでどけいがたますいじゅう', r88_cn_shoes: 'はかせのきっくりょくぞうきょうしゅーず',
  r88_cn_belt: 'どこでもぼーるしゃしゅつべると', r88_cn_suspender: 'しんしゅくさすぺんだー', r88_cn_skate: 'たーぼえんじんつきすけーとぼーど',
  r88_cn_megane: 'はんにんついせきめがね', r88_cn_badge: 'しょうねんたんていだんのばっじ', r88_cn_light: 'うでどけいがたらいと', r88_cn_fax: 'べんとうがたけいたいふぁっくす',
  r88_cn_jacket: 'あおいじゃけっととあかいちょうねくたい', r88_cn_karate: 'からてぶのどうぎ', r88_cn_shinai: 'へいじのしない', r88_cn_cap: 'へいじのやきゅうぼう',
  r88_cn_omamori: 'かずはのおまもり', r88_cn_kyogoku: 'きょうごくのからてぎ', r88_cn_knit: 'くろいにっとぼう', r88_cn_apron: 'ぽあろのえぷろん',
  r88_cn_hakui: 'はいばらのはくい', r88_cn_kuro: 'くろずくめのふく', r88_cn_apto: 'ちいさくなるくすり', r88_cn_unaju: 'うなじゅう',
};
