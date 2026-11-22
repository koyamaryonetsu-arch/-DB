// 第88回 G17班: さいきくすお（斉木楠雄のΨ難。ゲームの 作品の 名前は「さいきくすお」）の 品（docs/plan-r88-anime-gear.md の 4-7）
//   作品の 職業（さいきくすお）は つえ・短剣・やり・素手・服・ローブ・たて（かぶとは だめ。メガネは ぼうしと 同じ 頭の 品）
//   ・頭の制御装置（伝説）… つけて いると 攻撃魔力が 下がり 守りが 上がる。使うと、はずして しばらく 攻撃魔力が 大きく 上がる
//     （「3回の 間」は 今の 強化の 長さ。兄の 空助の まぼろしが くれる）
//   ・緑のメガネ・父のメガネ … マヒを 防ぐ（作品の「石に する 力」は ゲームに ないので マヒに おきかえ。4-7 の とおり）
//   ・ゲルマニウムリング … 混乱を 防ぐ（テレパシーを 止める 指輪）
//   名前の 直し（使える 字・かぶり）は 設計書の「実装メモ（G17班）」
import { weapon, armor, head, acc, priceUp } from './items-r88-kit.js?v=8db07833986d';

const S = { work: 'saiki' };

export const SEIGYO = 'r88_sk_seigyo';

const GEAR = {
  // ───── さいきくすお ─────
  r88_sk_megane: { ...head('mei'), ...S, name: '緑のメガネ', fx: [{ k: 'guard_paralyze', v: 6 }], bonus: { mag: 6 }, desc: '見た物を石にしてしまう力を、ふうじるための緑のメガネ。マヒにかかりにくい。' },
  r88_sk_papa: { ...head('fu3'), ...S, name: '父のメガネ', fx: [{ k: 'guard_paralyze', v: 4 }], bonus: { agi: -6 }, desc: 'いそいでいた時に、かわりにかけたお父さんのメガネ。マヒにかかりにくいが、よく見えなくて素早さが少し下がる。' },
  r88_sk_seigyo: { ...acc('den'), ...S, name: '頭の制御装置', bonus: { def: 90, hp: 110, agi: 40, heal: 24, mp: 30, mag: -30 }, use: { ability: 'r88u_sk_seigyo' }, desc: '強すぎる超能力をおさえるために、兄が作った頭のかざり。つけていると、守備力が大きく上がるが、攻撃魔力が下がる。使うと、制御装置をはずして、しばらく攻撃魔力がとても上がる。' },
  r88_sk_germa: { ...acc('mei'), ...S, name: 'ゲルマニウムリング', fx: [{ k: 'guard_confuse', v: 6 }], bonus: { mag: 6 }, desc: 'まわりの心の声が聞こえないように、テレパシーを止める指輪。混乱にかかりにくい。' },
  r88_sk_coffee: { ...acc('fu3'), ...S, name: 'コーヒーゼリー', fx: [{ k: 'mpregen', v: 4 }], desc: 'いちばんの大好物。ひと口食べると、元気が出る。行動するたびにMPが少し回復する。' },
  r88_sk_uniform: { ...armor('cloth', 'shop'), ...S, name: 'PK学園の制服', desc: 'ふつうの高校の、ふつうの制服。だれでも装備できる。' },
  // ───── クラスの みんな ─────
  r88_sk_houtai: { ...acc('fu3'), ...S, name: '右手の包帯', bonus: { mag: 12 }, desc: '「しっ黒のつばさ」を名のる男の子が、右手にまいている包帯。中には、ふうじられた力が……あるらしい。攻撃魔力が上がる。' },
  r88_sk_ramen: { ...acc('fu3'), ...S, name: '燃堂のラーメン', fx: [{ k: 'guard_confuse', v: 4 }], desc: '何も考えていない友だちの、大好きなラーメン。心の声が聞こえないので、混乱にかかりにくい。' },
  r88_sk_aura: { ...acc('mei'), ...S, name: 'かがやくオーラ', fx: [{ k: 'evade', v: 6 }], desc: 'クラスのアイドルの、まぶしいオーラ。見た人はみんな「おっふ」とみとれてしまう。敵の攻撃をかわしやすくなる。' },
  r88_sk_hachimaki: { ...head('fu3'), ...S, name: '熱血のはちまき', bonus: { str: 10 }, desc: 'いつも全力の、熱血な学級委員のはちまき。力が上がる。' },
  r88_sk_juzu: { ...acc('fu3'), ...S, name: '鳥束の数じゅ', fx: [{ k: 'res_dark', v: 4 }], desc: 'ゆうれいが見える、お寺の子の数じゅ。闇に強い。' },
  r88_sk_suisho: { ...acc('fu3'), ...S, name: 'うらないの水しょう玉', fx: [{ k: 'evade', v: 4 }], desc: '人のオーラが見える、うらない師の水しょう玉。敵の攻撃をかわしやすくなる。' },
  r88_sk_stick: { ...weapon('staff', 'fu3'), ...S, name: 'ちょう野の手品のステッキ', fx: [{ k: 'crit', v: 4 }], look: 'cane', desc: '手品師をめざす男の子の、ふしぎなステッキ。会心の一撃が出やすい。' },
  r88_sk_memo: { ...acc('fu3'), ...S, name: 'あけちの推理メモ', fx: [{ k: 'crit', v: 4 }], desc: 'かんのするどい転校生の、推理のメモ。会心の一撃が出やすい。' },
};
priceUp(GEAR, { r88_sk_uniform: 90 });

export const ITEMS_R88_SAIKI = GEAR;
export const R88_REBIRTH_SAIKI = {};
// 今 ある 品で この 作品の 物は ない（tag なし）
export const R88_TAG_SAIKI = {};

export const R88_SAIKI_KANA = {
  r88_sk_megane: 'みどりのめがね', r88_sk_papa: 'ちちのめがね', r88_sk_seigyo: 'あたまのせいぎょそうち', r88_sk_germa: 'げるまにうむりんぐ',
  r88_sk_coffee: 'こーひーぜりー', r88_sk_uniform: 'ぴーけーがくえんのせいふく', r88_sk_houtai: 'みぎてのほうたい', r88_sk_ramen: 'ねんどうのらーめん',
  r88_sk_aura: 'かがやくおーら', r88_sk_hachimaki: 'ねっけつのはちまき', r88_sk_juzu: 'とりつかのじゅず', r88_sk_suisho: 'うらないのすいしょうだま',
  r88_sk_stick: 'ちょうののてじなのすてっき', r88_sk_memo: 'あけちのすいりめも',
};
