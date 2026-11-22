// 第88回 G11班: まじっく快との 品（docs/plan-r88-anime-gear.md の 3-7）
//   作品の 職業（手品師・かいとう・かいとうキッド・月下のき術師）は 短剣・つえ・おうぎ（月下は ブーメランも）・服と ローブ
//   ・キッドの 道具は「使う」品（ハンググライダー ＝ にげる・さいみんスプレー ＝ ねむり・ダミー人形 ＝ 身がわり）
//   ・パンドラ（伝説）… 月の 夜の キッドの まぼろしに 勝つと もらえる
//   ・今 ある マジックステッキ・シルクハット・かいとうの白いマント は こわさず、作品の 品として 数える（R88_TAG_KAITO。強さ・手に入れ方は かえない）
//   作品の 字は 使える 字に 直した（快斗 → 快と／銃 → じゅう／催眠 → さいみん／懐中 → かいちゅう など）
import { weapon, armor, acc, priceUp } from './items-r88-kit.js?v=068632fa6d51';

const T = { work: 'kaito' };

const GEAR = {
  r88_kt_card: { ...weapon('boomerang', 'mei'), ...T, name: 'キッドのトランプじゅう', fx: [{ k: 'chase', v: 6 }], bonus: { agi: 6 }, look: 'cross', desc: '月夜の大どろぼうの、トランプをとばす道具。人をきずつけたことは一度もない。ブーメランと同じあつかい。ときどきもう1回攻撃する。' },
  r88_kt_monocle: { ...acc('mei'), ...T, name: 'モノクル', bonus: { def: 16, agi: 6 }, desc: '月夜の大どろぼうが、かた目につけるモノクル。とてもがんじょうで、四つ葉のかざりがゆれる。守備力が上がる。' },
  r88_kt_suit: { ...armor('cloth', 'mei'), ...T, name: '白いスーツ', fx: [{ k: 'evade', v: 6 }], bonus: { agi: 6 }, desc: '白いタキシードと、うらがむらさきのマント。初代の大どろぼうから受けついだ衣しょう。だれでも装備できる。敵の攻撃をかわしやすくなる。' },
  r88_kt_glider: { ...acc('mei'), ...T, name: 'キッドのハンググライダー', bonus: { agi: 12 }, use: { ability: 'r88u_kt_glider' }, desc: 'マントが一しゅんで白いつばさになる、おりたたみ式のハンググライダー。使うと、みんなで夜空へにげ出す（にげられない戦いはだめ）。' },
  r88_kt_spray: { ...acc('fu3'), ...T, name: 'さいみんスプレー', bonus: { mag: 6 }, use: { ability: 'r88u_kt_spray' }, desc: 'しゅっとひとふきで、ねむくなるスプレー。使うと、同じ種類の敵みんなをねむらせる。' },
  r88_kt_dummy: { ...acc('fu3'), ...T, name: 'ダミー人形', bonus: { def: 6 }, use: { ability: 'r88u_kt_dummy' }, desc: '自分そっくりの人形。いつの間にか入れかわっている。使うと、しばらく敵の攻撃をかわしやすくなる。' },
  r88_kt_hato: { ...acc('fu3'), ...T, name: 'キッドのハト', fx: [{ k: 'evade', v: 4 }], desc: 'マジックの仲間の白いハト。ぱっととび立って、敵の目をくらませる。敵の攻撃をかわしやすくなる。' },
  r88_kt_yokoku: { ...acc('fu3'), ...T, name: 'キッドの予告状', bonus: { agi: 14 }, desc: 'お宝をいただく前に、かならずとどける予告状。なぞなぞのような文と、にっこり顔の絵。素早さが上がる。' },
  r88_kt_watch: { ...acc('fu3'), ...T, name: 'かいちゅう時計', bonus: { agi: 10, mag: 4 }, desc: '高校生探ていのかいちゅう時計。1年に0.001秒しかくるわない。素早さが上がる。' },
  r88_kt_mirror: { ...acc('mei'), ...T, name: '紅子の魔法の鏡', bonus: { mag: 18 }, desc: '赤魔術の魔女が、こたえを聞く魔法の鏡。たずねると、ほんとうのことを教えてくれる。攻撃魔力が上がる。' },
  r88_kt_mop: { ...weapon('bat', 'fu3'), ...T, name: '青子のモップ', fx: [{ k: 'crit', v: 4 }], look: 'mop', desc: 'おさななじみの女の子が、ぶんぶんふり回すモップ。大どろぼうを追いかける時にも使う。会心の一撃が出やすい。' },
  r88_kt_pandora: { ...acc('den'), ...T, name: 'パンドラ', fx: [{ k: 'mpregen', v: 8 }], bonus: { mag: 50, hp: 100, agi: 30, def: 30, heal: 30, str: 20 }, desc: '月の光にかざすと、中にもう1つの赤い宝石が見えるという、ふしぎな大きな宝石。力・守り・魔力が大きく上がり、行動するたびにMPが少し回復する。' },
};
priceUp(GEAR);

export const ITEMS_R88_KAITO = GEAR;
export const R88_REBIRTH_KAITO = {};
// 今 ある 品を 作品の 品として 数える（強さ・手に入れ方は かえない。items-r88.js の tagR88Works）
export const R88_TAG_KAITO = { magic_wand: 'kaito', silk_hat: 'kaito', kid_mantle: 'kaito' };

export const R88_KAITO_KANA = {
  r88_kt_card: 'きっどのとらんぷじゅう', r88_kt_monocle: 'ものくる', r88_kt_suit: 'しろいすーつ', r88_kt_glider: 'きっどのはんぐぐらいだー',
  r88_kt_spray: 'さいみんすぷれー', r88_kt_dummy: 'だみーにんぎょう', r88_kt_hato: 'きっどのはと', r88_kt_yokoku: 'きっどのよこくじょう',
  r88_kt_watch: 'かいちゅうどけい', r88_kt_mirror: 'あかこのまほうのかがみ', r88_kt_mop: 'あおこのもっぷ', r88_kt_pandora: 'ぱんどら',
};
