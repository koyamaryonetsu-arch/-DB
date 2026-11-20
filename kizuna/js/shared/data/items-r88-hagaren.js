// 第88回 G14班: 鋼のれん金術師の 品（docs/plan-r88-anime-gear.md の 3-10）
//   作品の 職業（れん金術師・国家れん金術師・はがねのれん金術師・真理のとびらをひらく者）は つえ・やり・ツメ・剣・服・ローブ・道着
//   ・発火布の手ぶくろ（伝説）… 使うと 指を ならして 敵全体に 炎。雨の 時は しめって 火が 出ない
//     （何も 起きず、その 戦いの 1回は へらない。品の use.wet。shared/battle-r88.js の useWet）
//   ・最強のほこ … ふつうの 攻撃が 1グループに とどく（reach）。最強のたては 守りが 大きく 上がる
//   ・今 ある チョーク（れん金術師の はじめの 武器）・はがねの機械のうで・賢者の石にも 作品を つけた
//     （R88_TAG_HAGAREN。強さ・手に入れ方は かえない）
//   ・入れない 品: 本物の 銃（ホークアイの 銃 など）
//   作品の 字は 使える 字に 直した（錬 → れん・鎧 → よろい・矛 → ほこ・盾 → たて・眼帯 → がんたい・陣 → じん。設計書の「実装メモ（G14班）」）
import { weapon, armor, shield, head, acc, priceUp } from './items-r88-kit.js?v=dd9bfc47ef83';

const H = { work: 'hagaren' };

const GEAR = {
  // ───── エドと アル・ウィンリィ ─────
  r88_hg_yari: { ...weapon('spear', 'shop'), ...H, name: 'れん成のやり', bonus: { mag: 2 }, look: 'spear2', desc: '両手を合わせて、地面かられん成したやり。れん金術師が、はじめに作る武器。' },
  r88_hg_coat: { ...armor('cloth', 'mei'), ...H, name: '赤いコート', fx: [{ k: 'hp', v: 6 }], bonus: { str: 4 }, desc: '兄の、せなかにしるしのついた赤いコート。だれでも装備できる。最大HPが上がる。' },
  r88_hg_kanrei: { ...acc('mei'), ...H, name: '寒冷地用の機械よろい', fx: [{ k: 'res_ice', v: 6 }], bonus: { def: 6 }, desc: '北のとりでの寒さでもこおらない、とくべつな機械のうでと足。氷に強い。' },
  r88_hg_watch: { ...acc('mei'), ...H, name: '国家れん金術師の銀時計', bonus: { mag: 16 }, desc: '国にみとめられたれん金術師のしるし。れん金術の力を強める。攻撃魔力が上がる。' },
  r88_hg_al: { ...armor('heavy', 'mei'), ...H, name: 'アルの大きなよろい', bonus: { hp: 30, agi: -4 }, resist: { poison: 0.4, sleep: 0.4, paralyze: 0.4 }, desc: '弟のたましいが入っていた、大きなよろい。中はからっぽなので、毒・ねむり・マヒにかかりにくい。' },
  r88_hg_spanner: { ...weapon('boomerang', 'fu3'), ...H, name: 'ウィンリィのスパナ', fx: [{ k: 'crit', v: 4 }], look: 'bone', desc: '機械よろいの整びしの、大きなスパナ。おこると、ものすごいいきおいでとんでくる。会心の一撃が出やすい。' },
  // ───── 軍の 人たち ─────
  r88_hg_hakka: { ...weapon('claw', 'den'), ...H, name: '発火布の手ぶくろ', fx: [{ k: 'el_fire', v: 8 }], bonus: { mag: 20, agi: 6 }, resist: { ice: 1.25 }, use: { ability: 'r88u_hg_snap', wet: true }, look: 'fist', desc: '火花の出る布でできた、白い手ぶくろ。ふつうの攻撃が炎になるが、氷に弱くなる。使うと、指を鳴らして敵全体を炎でつつむ。雨の日は、しめって火が出ない。' },
  r88_hg_hayate: { ...acc('fu3'), ...H, name: 'ブラックハヤテ号', fx: [{ k: 'chase', v: 4 }], desc: '目のいい女の軍人がかっている、黒くて小さな犬。ふつうの攻撃のあと、ときどきかみついてくれる。' },
  r88_hg_gauntlet: { ...weapon('claw', 'mei'), ...H, name: 'アームストロングの手こう', bonus: { str: 12 }, use: { ability: 'r88u_hg_toge' }, look: 'knuckle', desc: 'れん成じんのかかれた、大きな手こう。地面をなぐってれん成する。力が上がる。使うと、岩のとげが敵1グループをつき上げる。' },
  r88_hg_meito: { ...weapon('sword', 'mei'), ...H, name: 'アームストロング家の名刀', fx: [{ k: 'crit', v: 6 }], look: 'rapier', desc: '北のとりでの将軍が持つ、家に代々つたわる名刀。会心の一撃が出やすい。' },
  r88_hg_buccaneer: { ...weapon('claw', 'fu3'), ...H, name: 'バッカニアの機械のうで', fx: [{ k: 'chase', v: 4 }], look: 'beast', desc: '北のとりでの大男の、クマのツメのような機械のうで。ツメの先はダイヤモンド。ときどきもう1回攻撃する。' },
  r88_hg_apron: { ...armor('cloth', 'fu3'), ...H, name: '主婦のエプロン', bonus: { str: 10 }, desc: '兄弟の師しょうの、肉屋のおかみさんのエプロン。とても強い。だれでも装備できる。力が上がる。' },
  r88_hg_knife: { ...weapon('boomerang', 'fu3'), ...H, name: 'ヒューズの投げナイフ', fx: [{ k: 'crit', v: 4 }], look: 'cross', desc: '家族じまんの軍人の、そでにかくした投げナイフ。会心の一撃が出やすい。' },
  r88_hg_photo: { ...acc('fu3'), ...H, name: 'ヒューズの家族の写真', fx: [{ k: 'regen', v: 4 }], desc: 'おくさんとむすめの写真。見ると元気が出る。行動するたびにHPが少し回復する。' },
  r88_hg_suit: { ...armor('cloth', 'fu3'), ...H, name: 'キンブリーの白いスーツ', fx: [{ k: 'res_fire', v: 4 }], desc: 'ばく発のれん金術師の、まっ白なスーツ。だれでも装備できる。炎に強い。' },
  // ───── 東の 国の 人たち ─────
  r88_hg_rin: { ...weapon('sword', 'mei'), ...H, name: 'リンの刀', fx: [{ k: 'agi', v: 6 }], look: 'scimitar', desc: '東の国の王子の、はばの広い刀。素早さが上がる。' },
  r88_hg_mask: { ...head('fu3'), ...H, name: 'ランファンの仮面', fx: [{ k: 'evade', v: 4 }], desc: '王子を守る少女の、黒い仮面。敵の攻撃をかわしやすくなる。' },
  r88_hg_lankunai: { ...weapon('dagger', 'fu3'), ...H, name: 'ランファンのクナイ', fx: [{ k: 'chase', v: 4 }], look: 'kunai', desc: '王子を守る少女の、黒いクナイ。ときどきもう1回攻撃する。' },
  r88_hg_lanarm: { ...weapon('claw', 'mei'), ...H, name: 'ランファンの機械のうで', fx: [{ k: 'crit', v: 6 }], look: 'katar', desc: 'ひじにやいばがしこんである、機械の左うで。会心の一撃が出やすい。' },
  r88_hg_meikunai: { ...weapon('boomerang', 'fu3'), ...H, name: 'メイのクナイ', fx: [{ k: 'regen', v: 4 }], look: 'star', desc: '東の国の少女の、れんたん術のクナイ。はなれた所をれん成して、けがを治す。行動するたびにHPが少し回復する。' },
  r88_hg_xiaomei: { ...acc('fu3'), ...H, name: 'シャオメイ', fx: [{ k: 'evade', v: 4 }], desc: '東の国の少女の、小さな白黒のパンダ。敵の攻撃をかわしやすくなる。' },
  // ───── ライバルの 品 ─────
  r88_hg_scar: { ...weapon('claw', 'mei'), ...H, name: 'スカーの右うで', fx: [{ k: 'slay_material', v: 6 }], use: { ability: 'r88u_hg_bunkai' }, look: 'tiger', desc: 'もようのきざまれた右うで。ふれた物を分解する。物質系の敵に強い。使うと、敵1体を大きくうつ。' },
  r88_hg_tate: { ...shield('mei'), ...H, name: '最強のたて', fx: [{ k: 'def', v: 6 }], bonus: { def: 10 }, look: 'crest', desc: '体の中の炭素をかたくして作る、何も通さないたて。守備力が大きく上がる。' },
  r88_hg_hoko: { ...weapon('claw', 'mei'), ...H, name: '最強のほこ', reach: 'group', look: 'claw', desc: 'のびるツメ。何でもつらぬく。ふつうの攻撃が、同じ種類の敵みんなにとどく。' },
  r88_hg_saber: { ...weapon('sword', 'den'), ...H, name: '大総統のサーベル', fx: [{ k: 'crit', v: 8 }], bonus: { agi: 10, str: 6 }, look: 'saber', desc: '国でいちばんえらい人の、細いサーベル。2本を同時にあやつる。会心の一撃が出やすい。' },
  r88_hg_patch: { ...acc('mei'), ...H, name: '大総統のがんたい', fx: [{ k: 'evade', v: 6 }], bonus: { agi: 6 }, desc: 'どんな動きも見ぬく目を、かくしていた黒いがんたい。敵の攻撃をかわしやすくなる。' },
};
priceUp(GEAR, { r88_hg_yari: 80 });

export const ITEMS_R88_HAGAREN = GEAR;
export const R88_REBIRTH_HAGAREN = {};
// 今 ある 品を 作品の 品として 数える（強さ・手に入れ方は かえない。items-r88.js の tagR88Works）
//   チョークは れん金術師の はじめの 武器（stats.js の はじめの 装備・items-r33.js）なので この 作品に つけた
export const R88_TAG_HAGAREN = { chalk: 'hagaren', automail_arm: 'hagaren', philosopher_stone: 'hagaren' };

export const R88_HAGAREN_KANA = {
  r88_hg_yari: 'れんせいのやり', r88_hg_coat: 'あかいこーと', r88_hg_kanrei: 'かんれいちようのきかいよろい', r88_hg_watch: 'こっかれんきんじゅつしのぎんどけい',
  r88_hg_al: 'あるのおおきなよろい', r88_hg_spanner: 'うぃんりぃのすぱな', r88_hg_hakka: 'はっかふのてぶくろ', r88_hg_hayate: 'ぶらっくはやてごう',
  r88_hg_gauntlet: 'あーむすとろんぐのてこう', r88_hg_meito: 'あーむすとろんぐけのめいとう', r88_hg_buccaneer: 'ばっかにあのきかいのうで',
  r88_hg_apron: 'しゅふのえぷろん', r88_hg_knife: 'ひゅーずのなげないふ', r88_hg_photo: 'ひゅーずのかぞくのしゃしん', r88_hg_suit: 'きんぶりーのしろいすーつ',
  r88_hg_rin: 'りんのかたな', r88_hg_mask: 'らんふぁんのかめん', r88_hg_lankunai: 'らんふぁんのくない', r88_hg_lanarm: 'らんふぁんのきかいのうで',
  r88_hg_meikunai: 'めいのくない', r88_hg_xiaomei: 'しゃおめい', r88_hg_scar: 'すかーのみぎうで', r88_hg_tate: 'さいきょうのたて',
  r88_hg_hoko: 'さいきょうのほこ', r88_hg_saber: 'だいそうとうのさーべる', r88_hg_patch: 'だいそうとうのがんたい',
};
