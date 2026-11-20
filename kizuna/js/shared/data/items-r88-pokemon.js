// 第88回 G16班: ポケモンの 品（docs/plan-r88-anime-gear.md の 4-5）
//   作品の 職業（ポケモンマスター）は ブーメラン・つえ・アクセ。よろい・頭・アクセは なるべく だれでも
//   ・ボール（名前は ポケモンマスターの 技「モンスターボール」「マスターボール」と 分けた）… からのモンスターボール → スーパーボール → ハイパーボール と 生まれ変わる（ブーメラン）。品の befriend … 魔物が 仲間に なりやすい
//     （戦いの あとの 仲間に なりたがる わりあいに かける。魔物使い・モンスターマスター・ポケモンマスターの 力に かけ合わせる。world/battles.js）
//     むらさきのマスターボール（伝説）は いちばん 強い（チャンピオン・ワタルが くれる）
//   ・ジムバッジ 8つ（アクセ。1つずつ 小さな 力）… 持って いる 数で しょう号。8つ 持つ 人だけ チャンピオン・ワタルに ちょうせん できる
//   ・がくしゅうそうち（経験値 2わり ふえる）・おまもりこばん（お金 5わり ふえる）… つけた 人だけ・1人に 1つ分（shared/gear-r88-pokemon.js）
//   ・きあいのタスキ … HPが 満タンの 時だけ「ふんばる」（G13班の endure と 同じ 1人 1回。shared/battle-r88.js の r88Endure）
//   ・オボンのみ（HPが 半分を 切ると 1回 回復）・いのちのたま（攻撃の たびに HPが 少し へる）… shared/battle-r88-pokemon.js
//   ・しんかのきせき … 基本職・上級職の 人が つけると 守りが 大きく 上がる（shared/gear-r88-pokemon.js。強さの まどにも 出る）
//   ・こだわり 3つ・いのちのたま … 上がる 所と 下がる 所（bonus の マイナス）
//   ・今 ある 進化の 石 4つにも 作品を つけた（R88_TAG_POKEMON。強さ・手に入れ方は かえない）
//   作品の 字は 使える 字に 直した（設計書の「実装メモ（G16班）」）
import { weapon, armor, head, acc, priceUp } from './items-r88-kit.js?v=3e6a025be338';

const P = { work: 'pokemon' };
const B = { work: 'pokemon', set: 'gym_badge' };

// ジムバッジ（ジムリーダーの ならび。月〜日の 7人 ＋ サカキの グリーンバッジ）
export const GYM_BADGES = ['r88_pk_b_gray', 'r88_pk_b_blue', 'r88_pk_b_orange', 'r88_pk_b_rainbow', 'r88_pk_b_pink', 'r88_pk_b_gold', 'r88_pk_b_crimson', 'r88_pk_b_green'];
export const PK_BALLS = ['r88_pk_ball', 'r88_pk_superball', 'r88_pk_hyperball'];
export const PK_MASTERBALL = 'r88_pk_masterball';

const GEAR = {
  // ───── サトシ ─────
  r88_pk_cap: { ...head('fu3'), ...P, name: 'サトシのぼうし', fx: [{ k: 'agi', v: 4 }], desc: 'はがきを1000まい出して当てた、100こだけのとくべつなぼうし。素早さが上がる。' },
  r88_pk_glove: { ...acc('fu3'), ...P, name: 'サトシの手ぶくろ', bonus: { str: 8, agi: 4 }, desc: '緑色の、指の出る手ぶくろ。力が上がる。' },
  r88_pk_zring: { ...acc('mei'), ...P, name: 'Zリング', bonus: { str: 6, mag: 6 }, use: { ability: 'r88u_pk_z' }, desc: '手首につける、ふしぎな石のうでわ。使うと、全力の力をためて、次の攻撃がとても強くなる。' },
  // ───── ボール（生まれ変わる）─────
  r88_pk_ball: { ...weapon('boomerang', 'fu3'), ...P, name: 'からのモンスターボール', befriend: 1.3, look: 'ball', desc: '赤と白の、からっぽのボール。ふつうの攻撃が敵全体にとどく。たおした魔物が、仲間になりやすい。' },
  r88_pk_superball: { ...weapon('boomerang', 'mei'), ...P, name: 'スーパーボール', befriend: 1.6, fx: [{ k: 'crit', v: 4 }], look: 'ball', desc: '青いもようのボール。会心が出やすい。たおした魔物が、もっと仲間になりやすい。' },
  r88_pk_hyperball: { ...weapon('boomerang', 'mei'), ...P, name: 'ハイパーボール', befriend: 2, fx: [{ k: 'crit', v: 6 }], look: 'ball', desc: '黒と黄色のボール。会心が出やすい。たおした魔物が、とても仲間になりやすい。' },
  r88_pk_masterball: { ...weapon('boomerang', 'den'), ...P, name: 'むらさきのマスターボール', befriend: 3, fx: [{ k: 'crit', v: 8 }], bonus: { agi: 10 }, look: 'ball', desc: 'むらさきにかがやく、とくべつなボール。会心がとても出やすい。たおした魔物が、いちばん仲間になりやすい。' },
  // ───── 持たせる 道具 ─────
  r88_pk_zukan: { ...acc('mei'), ...P, name: 'ポケモン図かん', fx: [{ k: 'crit', v: 6 }], bonus: { mag: 6 }, desc: '出会った魔物のことが、なんでもわかる図かん。弱いところが見えて、会心が出やすい。' },
  r88_pk_denkidama: { ...acc('mei'), ...P, name: 'でんきだま', orb: { el: 'bolt', v: 6 }, bonus: { str: 6 }, desc: 'ぱちぱちと電気が走る玉。武器のふつうの攻撃が雷の属性になる。' },
  r88_pk_mokutan: { ...acc('fu3'), ...P, name: 'もくたん', orb: { el: 'fire', v: 4 }, desc: 'まっ黒な炭。武器のふつうの攻撃が炎の属性になる。' },
  r88_pk_tabenokoshi: { ...acc('mei'), ...P, name: 'たべのこし', fx: [{ k: 'regen', v: 6 }], desc: '食べのこしたごちそう。行動するたびに、少しずつ食べてHPが回復する。' },
  r88_pk_oboni: { ...acc('fu3'), ...P, name: 'オボンのみ', bonus: { hp: 20 }, pkBerry: 0.25, desc: '持たせておく木の実。HPが半分を切ると、自分で食べてHPが回復する（1つの戦いで1回）。' },
  r88_pk_rumu: { ...acc('fu3'), ...P, name: 'ラムのみ', fx: [{ k: 'guard_poison', v: 4 }, { k: 'guard_confuse', v: 3 }], desc: '持たせておく木の実。毒と混乱にかかりにくい。' },
  r88_pk_tasuki: { ...acc('mei'), ...P, name: 'きあいのタスキ', pkSash: true, bonus: { hp: 20 }, desc: '気あいの入ったタスキ。HPがまんたんの時に、たおれるダメージを受けても、HP1でもちこたえる（1つの戦いで1回）。' },
  r88_pk_hachimaki: { ...head('mei'), ...P, name: 'こだわりハチマキ', bonus: { str: 24, mag: -16 }, desc: 'ひとつのことに、こだわるハチマキ。力が大きく上がるが、魔力が下がる。' },
  r88_pk_megane: { ...head('mei'), ...P, name: 'こだわりメガネ', bonus: { mag: 24, str: -16 }, desc: 'ひとつのことに、こだわるメガネ。魔力が大きく上がるが、力が下がる。' },
  r88_pk_scarf: { ...acc('mei'), ...P, name: 'こだわりスカーフ', bonus: { agi: 30, str: -12 }, desc: 'ひとつのことに、こだわるスカーフ。素早さが大きく上がるが、力が下がる。' },
  r88_pk_inochi: { ...acc('mei'), ...P, name: 'いのちのたま', bonus: { str: 18, mag: 18 }, pkRecoil: 0.1, desc: '赤くあやしく光る玉。力と魔力が上がるが、敵に攻撃するたびに、HPが少しへる。' },
  r88_pk_gotsugotsu: { ...head('mei', true), ...P, name: 'ゴツゴツメット', fx: [{ k: 'counter', v: 6 }], desc: 'トゲトゲのかぶと。ふつうの攻撃をされると、ときどきやりかえす。' },
  r88_pk_chokki: { ...armor('cloth', 'mei'), ...P, name: 'とつげきチョッキ', bonus: { def: 4 }, resist: { fire: 0.85, ice: 0.85, bolt: 0.85, wind: 0.85 }, desc: 'じょうぶなチョッキ。炎・氷・雷・風の呪文のダメージがへる。' },
  r88_pk_kiseki: { ...acc('mei'), ...P, name: 'しんかのきせき', pkEvo: { def: 40, hp: 30 }, desc: 'まだ進化できる者を守る、ふしぎなかたまり。基本職と上級職の人がつけると、守備力が大きく上がる（それより上の職業では効かない）。' },
  r88_pk_tsume: { ...acc('mei'), ...P, name: 'せんせいのツメ', bonus: { agi: 22 }, desc: '持っていると、ときどき先に動けるツメ。素早さが上がる。' },
  r88_pk_pinto: { ...acc('mei'), ...P, name: 'ピントレンズ', fx: [{ k: 'crit', v: 6 }], desc: 'ねらいがぴたりと合うレンズ。会心が出やすい。' },
  r88_pk_suzu: { ...acc('mei'), ...P, name: 'かいがらのすず', fx: [{ k: 'drain', v: 6 }], desc: '海の音がするすず。あたえたダメージの一部だけHPが回復する。' },
  r88_pk_pippi: { ...acc('fu3'), ...P, name: 'ピッピにんぎょう', bonus: { agi: 6 }, use: { ability: 'r88u_pk_pippi' }, desc: 'ピンクのかわいい人形。使うと、人形に気を取られているうちに、かならずにげられる（にげられない戦いはだめ）。' },
  r88_pk_gakushu: { ...acc('mei'), ...P, name: 'がくしゅうそうち', pkExp: 1.2, desc: 'せなかにつける機械。つけた人が戦いでもらう経験値が、2わりふえる。' },
  r88_pk_oujya: { ...acc('fu3'), ...P, name: 'おうじゃのしるし', fx: [{ k: 'paralyze', v: 3 }], desc: '王さまの、かんむりの形のしるし。ふつうの攻撃で、ときどき敵が動けなくなる。' },
  r88_pk_megaring: { ...acc('den'), ...P, name: 'メガリング', bonus: { str: 40, def: 40, agi: 40, hp: 100, mag: 20, heal: 20 }, use: { ability: 'r88u_pk_mega' }, desc: 'キーストーンのはまったうでわ。使うと、メガシンカの光につつまれ、しばらく力・守り・素早さが大きく上がる。' },
  r88_pk_hai: { ...acc('den'), ...P, name: 'せいなる灰', bonus: { heal: 60, mag: 50, hp: 100, mp: 60 }, use: { ability: 'r88u_pk_hai' }, desc: 'にじ色の鳥がのこした、かがやく灰。使うと、たおれた仲間全員を生き返らせて、HPをまんたんにする。' },
  r88_pk_koban: { ...acc('fu3'), ...P, name: 'おまもりこばん', pkGold: 1.5, desc: '小さな金色のこばん。つけた人が戦いでもらうお金が、5わりふえる。' },
  r88_pk_uniform: { ...armor('cloth', 'fu3'), ...P, name: 'わるい団の制服', fx: [{ k: 'evade', v: 4 }], bonus: { agi: 6 }, desc: '白い服に、赤い大きな文字。にげ足がはやくなって、敵の攻撃をかわしやすい。' },
  // ───── ジムバッジ（1つずつ 小さな 力。持って いる 数で しょう号）─────
  r88_pk_b_gray: { ...acc('fu3'), ...B, name: 'グレーバッジ', bonus: { def: 8 }, desc: 'いわのジムのバッジ。守備力が少し上がる。ジムバッジを集めると……？' },
  r88_pk_b_blue: { ...acc('fu3'), ...B, name: 'ブルーバッジ', bonus: { mp: 20 }, desc: 'みずのジムのバッジ。最大MPが少し上がる。ジムバッジを集めると……？' },
  r88_pk_b_orange: { ...acc('fu3'), ...B, name: 'オレンジバッジ', bonus: { agi: 8 }, desc: 'でんきのジムのバッジ。素早さが少し上がる。ジムバッジを集めると……？' },
  r88_pk_b_rainbow: { ...acc('fu3'), ...B, name: 'レインボーバッジ', bonus: { heal: 8 }, desc: 'くさのジムのバッジ。回復魔力が少し上がる。ジムバッジを集めると……？' },
  r88_pk_b_pink: { ...acc('fu3'), ...B, name: 'ピンクバッジ', fx: [{ k: 'guard_poison', v: 4 }], desc: 'どくのジムのバッジ。毒にかかりにくい。ジムバッジを集めると……？' },
  r88_pk_b_gold: { ...acc('fu3'), ...B, name: 'ゴールドバッジ', bonus: { mag: 8 }, desc: 'エスパーのジムのバッジ。攻撃魔力が少し上がる。ジムバッジを集めると……？' },
  r88_pk_b_crimson: { ...acc('fu3'), ...B, name: 'クリムゾンバッジ', bonus: { str: 8 }, desc: 'ほのおのジムのバッジ。力が少し上がる。ジムバッジを集めると……？' },
  r88_pk_b_green: { ...acc('fu3'), ...B, name: 'グリーンバッジ', bonus: { hp: 40 }, desc: 'じめんのジムのバッジ。最大HPが少し上がる。ジムバッジを集めると……？' },
};
priceUp(GEAR);

export const ITEMS_R88_POKEMON = GEAR;
// からのモンスターボール →（+3 で）スーパーボール →（+4 で）ハイパーボール。素材は 星のかけらと 魔法の粉・きれいな貝がら
export const R88_REBIRTH_POKEMON = {
  r88_pk_ball: { to: 'r88_pk_superball', at: 3, gold: 6000, mats: [['star_shard', 5], ['magic_powder', 4]] },
  r88_pk_superball: { to: 'r88_pk_hyperball', at: 4, gold: 12000, mats: [['star_shard', 8], ['pretty_shell', 5]] },
};
// 今 ある 進化の 石を 作品の 品として 数える（強さ・手に入れ方は かえない。items-r88.js の tagR88Works）
export const R88_TAG_POKEMON = { fire_stone: 'pokemon', water_stone: 'pokemon', thunder_stone: 'pokemon', moon_stone: 'pokemon' };

export const R88_POKEMON_KANA = {
  r88_pk_cap: 'さとしのぼうし', r88_pk_glove: 'さとしのてぶくろ', r88_pk_zring: 'ぜっとりんぐ', r88_pk_ball: 'からのもんすたーぼーる',
  r88_pk_superball: 'すーぱーぼーる', r88_pk_hyperball: 'はいぱーぼーる', r88_pk_masterball: 'むらさきのますたーぼーる', r88_pk_zukan: 'ぽけもんずかん',
  r88_pk_denkidama: 'でんきだま', r88_pk_mokutan: 'もくたん', r88_pk_tabenokoshi: 'たべのこし', r88_pk_oboni: 'おぼんのみ', r88_pk_rumu: 'らむのみ',
  r88_pk_tasuki: 'きあいのたすき', r88_pk_hachimaki: 'こだわりはちまき', r88_pk_megane: 'こだわりめがね', r88_pk_scarf: 'こだわりすかーふ', r88_pk_inochi: 'いのちのたま',
  r88_pk_gotsugotsu: 'ごつごつめっと', r88_pk_chokki: 'とつげきちょっき', r88_pk_kiseki: 'しんかのきせき', r88_pk_tsume: 'せんせいのつめ',
  r88_pk_pinto: 'ぴんとれんず', r88_pk_suzu: 'かいがらのすず', r88_pk_pippi: 'ぴっぴにんぎょう', r88_pk_gakushu: 'がくしゅうそうち',
  r88_pk_oujya: 'おうじゃのしるし', r88_pk_megaring: 'めがりんぐ', r88_pk_hai: 'せいなるはい', r88_pk_koban: 'おまもりこばん',
  r88_pk_uniform: 'わるいだんのせいふく', r88_pk_b_gray: 'ぐれーばっじ', r88_pk_b_blue: 'ぶるーばっじ', r88_pk_b_orange: 'おれんじばっじ',
  r88_pk_b_rainbow: 'れいんぼーばっじ', r88_pk_b_pink: 'ぴんくばっじ', r88_pk_b_gold: 'ごーるどばっじ', r88_pk_b_crimson: 'くりむぞんばっじ',
  r88_pk_b_green: 'ぐりーんばっじ',
};
