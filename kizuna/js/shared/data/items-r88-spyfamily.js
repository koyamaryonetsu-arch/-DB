// 第88回 G19班: SPY×FAMILY の 品（docs/plan-r88-anime-gear.md の 4-11）
//   作品の 職業（スパイ・殺し屋）は 短剣・ムチ・ブーメラン・剣・素手／服・道着／頭は かぶとも ぼうしも
//   ・本物の 銃は 作らない。〈いばら姫〉は よび名と 服・かみかざり・スティレットの 形だけ（仕事の 中みは 書かない）
//   ・変装のマスク … 使うと 変装して、次に 受ける 1回の 攻撃（物理）を かならず かわす（shared/battle-r88-g19.js の r88Dodge）
//   ・スティレット（伝説）… 2本を さか手に 持つ。追撃。使うと 金色の スティレットが はなびらの ように まう（えんしゅつ r88_ibara）
//   ・超人外こっかく … 力が 大きく 上がり 素早さが 下がる。雷（トニト）… 力が 上がり 守りが 下がる（1-2 の「体に ひびく」）
//   ・ステラの そろい（data/gear-sets.js の imperial_scholar）… 星（ステラ）を 持って いて、SPY×FAMILYの 品を 合わせて 8つ いじょう
//     持つと しょう号「こうていの学徒」（同じ 品は 8こ 持てないので、表の「8つ」を この 形に した。メインの 設計）
//   作品の 字は 使える 字に 直した（梟 → ふくろう・骨格 → こっかく・警察 → けいさつ。設計書の「実装メモ（G19班）」）
import { weapon, armor, head, acc, priceUp } from './items-r88-kit.js?v=379ca0afcef1';

const S = { work: 'spyfamily', set: 'imperial_scholar' };

const GEAR = {
  // ───── ロイド〈たそがれ〉 ─────
  r88_sf_mask: { ...head('mei'), ...S, name: '変装のマスク', fx: [{ k: 'evade', v: 6 }], use: { ability: 'r88u_sf_hensou' }, desc: '変装の名人〈たそがれ〉の、顔そっくりのマスク。敵の攻撃をかわしやすくなる。使うと変装して、次に受ける1回の攻撃をかならずかわす。' },
  r88_sf_suit: { ...armor('cloth', 'mei'), ...S, name: '三つぞろいのスーツ', fx: [{ k: 'def', v: 6 }], desc: 'せびろとチョッキとズボンがそろった、きちんとしたスーツ。だれでも装備できる。守備力が上がる。' },
  r88_sf_order: { ...acc('fu3'), ...S, name: '〈ふくろう〉の指令書', fx: [{ k: 'crit', v: 4 }], desc: '「1週間で家族を作り、名門校の集まりに入れ」という、作戦〈ふくろう〉の指令書。会心の一撃が出やすい。' },
  // ───── ヨル〈いばら姫〉 ─────
  r88_sf_stiletto: { ...weapon('dagger', 'den'), ...S, name: 'スティレット', fx: [{ k: 'chase', v: 8 }], bonus: { agi: 10 }, use: { ability: 'r88u_sf_stiletto' }, look: 'stiletto', desc: '〈いばら姫〉が両手にさか手で持つ、金色の細い短剣。2本で、ふつうの攻撃のあと、ときどきもう1回攻撃する。使うと、金色のスティレットが、はなびらのようにまう。' },
  r88_sf_dress: { ...armor('cloth', 'mei'), ...S, name: 'いばら姫の黒いドレス', bonus: { agi: 18 }, desc: '〈いばら姫〉の、背中の大きく開いた黒いドレス。だれでも装備できる。素早さが大きく上がる。' },
  r88_sf_hairpin: { ...head('fu3'), ...S, name: '金色の花のかみかざり', fx: [{ k: 'crit', v: 4 }], desc: '〈いばら姫〉の、金色の花のかみかざり。会心の一撃が出やすい。' },
  // ───── アーニャ ─────
  r88_sf_horns: { ...head('mei'), ...S, name: 'つののかみかざり', fx: [{ k: 'evade', v: 6 }], desc: '人の心が読める女の子が、いつもつけている、つののようなかみかざり。敵の攻撃をかわしやすくなる。' },
  r88_sf_peanuts: { ...acc('fu3'), ...S, name: 'ピーナッツのふくろ', fx: [{ k: 'regen', v: 4 }], desc: 'アーニャの大好物、ピーナッツがいっぱい。行動するたびにHPが少し回復する。' },
  r88_sf_chimera: { ...acc('fu3'), ...S, name: 'キメラさん', fx: [{ k: 'guard_sleep', v: 4 }], desc: '家族になる前から、いつもいっしょのぬいぐるみ。ねむりにかかりにくい。' },
  r88_sf_penguin: { ...acc('fu3'), ...S, name: 'ペンギンのぬいぐるみ', fx: [{ k: 'hp', v: 4 }], desc: '父のロイドからのおくり物の、ペンギンのぬいぐるみ。やぶれたところは、ロイドがぬい直した。最大HPが上がる。' },
  r88_sf_stella: { ...acc('fu3'), ...S, name: '星（ステラ）', bonus: { mag: 10 }, desc: 'イーデン校で、よいことをした生徒がもらえる星のメダル。攻撃魔力が上がる。星を持って、SPY×FAMILYの品を8つそろえると……？' },
  r88_sf_tonitrus: { ...acc('fu3'), ...S, name: '雷（トニト）', bonus: { str: 14, def: -8 }, desc: 'イーデン校で、悪いことをするともらう、いなずまのばつ点。8つで学校をやめさせられる。力が上がるが、守備力が下がる。' },
  r88_sf_collar: { ...acc('mei'), ...S, name: 'ボンドの首わ', fx: [{ k: 'evade', v: 6 }], desc: '少し先の未来が見える、大きな白い犬の首わ。敵の攻撃をかわしやすくなる。' },
  // ───── ライバルの 品 ─────
  r88_sf_racket: { ...weapon('bat', 'mei'), ...S, name: 'テニスのラケット', fx: [{ k: 'crit', v: 6 }], look: 'club', desc: '〈よとばり〉が、地下のテニス大会で使ったラケット。打った玉は、ものすごく速い。会心の一撃が出やすい。' },
  r88_sf_exo: { ...armor('heavy', 'mei'), ...S, name: '超人外こっかく', bonus: { str: 24, agi: -12 }, desc: '情報屋の発明家が作った、着るだけで強くなる「はず」のきかい。力が大きく上がるが、重くて素早さが下がる。' },
  r88_sf_cap: { ...head('fu3'), ...S, name: '秘密けいさつのぼうし', fx: [{ k: 'def', v: 4 }], desc: '国の秘密けいさつの、かっちりしたぼうし。守備力が上がる。' },
};
priceUp(GEAR);

export const ITEMS_R88_SPYFAMILY = GEAR;
export const R88_REBIRTH_SPYFAMILY = {};
// ステラの そろいの「持って いる」品（data/gear-sets.js の imperial_scholar。星を 持って いる 時だけ しょう号）
export const STELLA = 'r88_sf_stella';
export const IMPERIAL_N = 8;

export const R88_SPYFAMILY_KANA = {
  r88_sf_mask: 'へんそうのますく', r88_sf_suit: 'みつぞろいのすーつ', r88_sf_order: 'ふくろうのしれいしょ', r88_sf_stiletto: 'すてぃれっと',
  r88_sf_dress: 'いばらひめのくろいどれす', r88_sf_hairpin: 'きんいろのはなのかみかざり', r88_sf_horns: 'つののかみかざり', r88_sf_peanuts: 'ぴーなっつのふくろ',
  r88_sf_chimera: 'きめらさん', r88_sf_penguin: 'ぺんぎんのぬいぐるみ', r88_sf_stella: 'すてら', r88_sf_tonitrus: 'とにと',
  r88_sf_collar: 'ぼんどのくびわ', r88_sf_racket: 'てにすのらけっと', r88_sf_exo: 'ちょうじんがいこっかく', r88_sf_cap: 'ひみつけいさつのぼうし',
};
