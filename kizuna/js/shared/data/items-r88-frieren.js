// 第88回 G17班: 千年の大魔法使い（葬送のフリーレン。ゲームの 作品の 名前は「フリーレン」）の 品（docs/plan-r88-anime-gear.md の 4-6）
//   作品の 職業（千年の大魔法使い）は つえ・やり・短剣・素手・服・ローブ・たて
//   ・勇者の剣（伝説）… 剣の里の 岩に ささった 本物。あくまキラー。ライバルが くれないので 宝の洞窟の いちばん おく（TM_R88_DEN）
//   ・服従のてんびん（伝説）… 使うと、自分の 魔力が 相手より 上なら 敵1体が 1回 動けない（下だと 効かない・ボスは だめ。shared/battle-r88-fr.js）
//   ・支配の石の輪 … 魔力が 大きく 上がる。かわりに 混乱に かかりやすい（1-2 の「体に ひびく」形）
//   ・鏡れん華の指輪と 鏡れん華のうでわ … そろい kagami_renge（2人が 1つずつ つけると、2人とも 最大HPが 少し 上がる。battle-r88-fr.js）
//   入れない 物: 子どもに 合わない 名前の 魔法・黄金郷（4-6 の とおり）
//   名前の 直し（使える 字・かぶり）は 設計書の「実装メモ（G17班）」
import { weapon, shield, acc, priceUp } from './items-r88-kit.js?v=06a27cc70d31';

const F = { work: 'frieren' };
const KR = { work: 'frieren', set: 'kagami_renge' };

export const TENBIN = 'r88_fr_tenbin';
export const HERO_SWORD = 'r88_fr_yusha';
export const KAGAMI_RENGE = ['r88_fr_ring', 'r88_fr_bangle'];

const GEAR = {
  // ───── フリーレン ─────
  r88_fr_staff: { ...weapon('staff', 'mei'), ...F, name: '千年のつえ', fx: [{ k: 'mpregen', v: 6 }], bonus: { mag: 14 }, look: 'frieren', desc: '千年も旅をつづけてきた、エルフの魔法使いのつえ。攻撃魔力が上がる。行動するたびにMPが回復する。' },
  r88_fr_earring: { ...acc('fu3'), ...F, name: 'フリーレンの耳かざり', fx: [{ k: 'evade', v: 4 }], desc: 'エルフの魔法使いの、小さな耳かざり。敵の攻撃をかわしやすくなる。' },
  r88_fr_ring: { ...acc('mei'), ...KR, name: '鏡れん華の指輪', bonus: { hp: 30, mp: 20 }, desc: '旅のとちゅう、エルフの魔法使いがえらび、勇者がおくった指輪。花の言葉は「ずっとつづく愛」。最大HPと最大MPが上がる。鏡れん華のうでわと、2人が1つずつつけると……？' },
  r88_fr_bangle: { ...acc('mei'), ...KR, name: '鏡れん華のうでわ', fx: [{ k: 'evade', v: 5 }], desc: '戦士の少年が、弟子の魔法使いにおくったうでわ。敵の攻撃をかわしやすくなる。鏡れん華の指輪と、2人が1つずつつけると……？' },
  r88_fr_sougetsu: { ...acc('fu3'), ...F, name: 'そう月草', bonus: { heal: 10 }, desc: '勇者のふるさとにさいていた、青い花。回復の力が上がる。' },
  // ───── 民間の 魔法の 魔導書 ─────
  r88_fr_hanabatake: { ...acc('fu3'), ...F, name: '花畑を出す魔法の魔導書', fx: [{ k: 'regen', v: 4 }], desc: '師しょうの大魔法使いが、いちばん気に入っていた魔法の魔導書。行動するたびにHPが少し回復する。' },
  r88_fr_sabi: { ...acc('fu3'), ...F, name: '銅像のさびをとる魔法の魔導書', fx: [{ k: 'def', v: 4 }], desc: '勇者の銅像を、ぴかぴかにする魔法の魔導書。守備力が上がる。' },
  r88_fr_kakigori: { ...acc('fu3'), ...F, name: 'かき氷を出す魔法の魔導書', fx: [{ k: 'res_fire', v: 4 }], desc: 'あつい日に、つめたいかき氷を出す魔法の魔導書。炎に強い。' },
  // ───── 勇者の 一行 ─────
  r88_fr_yusha: { ...weapon('sword', 'den'), ...F, name: '剣の里の勇者の剣', fx: [{ k: 'slay_demon', v: 8 }], look: 'holy', desc: '剣の里の岩にささっている、本物の勇者の剣。だれもぬけなかった。あくま系の敵に大きなダメージ。' },
  r88_fr_himmel: { ...weapon('sword', 'mei'), ...F, name: 'ヒンメルの剣', fx: [{ k: 'crit', v: 6 }], look: 'broad', desc: '勇者がずっと使っていた剣。本物ではなかったけれど、「魔王をたおせば、本物もにせ物も関係ない」。会心の一撃が出やすい。' },
  r88_fr_stark: { ...weapon('axe', 'mei'), ...F, name: 'シュタルクの大オノ', fx: [{ k: 'slay_dragon', v: 5 }], look: 'battle', desc: 'こわがりだけど、とても強い戦士の少年の大オノ。竜系の敵に大きなダメージ。' },
  r88_fr_eisen: { ...weapon('axe', 'mei'), ...F, name: 'ドワーフのオノ', fx: [{ k: 'def', v: 5 }], look: 'axe', desc: '勇者の一行の、ドワーフの戦士のオノ。守備力が上がる。' },
  r88_fr_heiter: { ...acc('mei'), ...F, name: '僧侶の聖典', bonus: { heal: 16 }, desc: '勇者の一行の僧侶が持っていた聖典。回復の力が上がる。' },
  r88_fr_fern: { ...weapon('staff', 'mei'), ...F, name: 'フェルンのつえ', fx: [{ k: 'chase', v: 5 }], bonus: { mag: 8 }, look: 'wizard', desc: '早うちが得意な、弟子の魔法使いのつえ。ふつうの攻撃のあと、ときどきもう1回攻撃する。' },
  r88_fr_lawine: { ...weapon('staff', 'fu3'), ...F, name: 'ラヴィーネのつえ', fx: [{ k: 'el_ice', v: 4 }], look: 'wave', desc: '水をこおらせる魔法が得意な、魔法使いのつえ。ふつうの攻撃が氷になる。' },
  // ───── 魔族・魔物の 品（ライバル）─────
  r88_fr_tenbin: { ...acc('den'), ...F, name: '服従のてんびん', bonus: { mag: 60, mp: 60, hp: 60, def: 30, agi: 30, heal: 20 }, use: { ability: 'r88u_fr_tenbin' }, desc: '自分と相手の魔力をのせて、くらべる金のてんびん。攻撃魔力が上がる。使うと、自分の魔力が相手より上なら、てんびんがかたむいて、敵1体が1回動けない（魔力が下だと効かない。大きな敵には効かない）。' },
  r88_fr_sekirin: { ...acc('mei'), ...F, name: '支配の石の輪', bonus: { mag: 34 }, resist: { confuse: 1.5 }, desc: '心をしばる、石でできた輪。攻撃魔力が大きく上がるが、混乱にかかりやすい。' },
  r88_fr_chest: { ...shield('fu3'), ...F, name: '宝箱のたて', fx: [{ k: 'counter', v: 4 }], look: 'round', desc: '宝箱のふりをしていた魔物の、ふたのたて。ふつうの攻撃をされると、ときどきパクッとかみつきかえす。' },
};
priceUp(GEAR);

export const ITEMS_R88_FRIEREN = GEAR;
export const R88_REBIRTH_FRIEREN = {};
// 今 ある 品で この 作品の 物は ない（tag なし）
export const R88_TAG_FRIEREN = {};

export const R88_FRIEREN_KANA = {
  r88_fr_staff: 'せんねんのつえ', r88_fr_earring: 'ふりーれんのみみかざり', r88_fr_ring: 'かがみれんげのゆびわ', r88_fr_bangle: 'かがみれんげのうでわ',
  r88_fr_sougetsu: 'そうげつそう', r88_fr_hanabatake: 'はなばたけをだすまほうのまどうしょ', r88_fr_sabi: 'どうぞうのさびをとるまほうのまどうしょ',
  r88_fr_kakigori: 'かきごおりをだすまほうのまどうしょ', r88_fr_yusha: 'けんのさとのゆうしゃのけん', r88_fr_himmel: 'ひんめるのけん',
  r88_fr_stark: 'しゅたるくのおおおの', r88_fr_eisen: 'どわーふのおの', r88_fr_heiter: 'そうりょのせいてん', r88_fr_fern: 'ふぇるんのつえ',
  r88_fr_lawine: 'らゔぃーねのつえ', r88_fr_tenbin: 'ふくじゅうのてんびん', r88_fr_sekirin: 'しはいのいしのわ', r88_fr_chest: 'たからばこのたて',
};
