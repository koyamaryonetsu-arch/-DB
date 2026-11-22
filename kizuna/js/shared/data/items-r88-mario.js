// 第88回 G13班: マリオの 品（docs/plan-r88-anime-gear.md の 4-1）
//   作品の 職業（配管工・ひげおやじ・マリオ・ギャラクシーマリオ）は オノ・ブーメラン・素手（ギャラクシーは つえ・おうぎも）・服と 道着と ローブ・かぶと
//   ・緑の1UPキノコ … 生まれつきの 効果「ふんばる」（1つの 戦いで 1回、たおれても HP1 で のこる。shared/battle-r88.js の r88Endure）
//   ・スーパースター（伝説）… 使うと 3回の 行動の 間、状態異常に ならず 攻撃力が 上がる（ライバルが くれないので 宝の洞窟の いちばん おく）
//   ・キャッピー … 使うと 敵1体を 混乱（ボスには きかない）。POWブロック・サンダーも「使う」
//   ・ファイアフラワー・アイスフラワーは 玉（ふつうの 攻撃が 炎・氷）
//   ・名前が ひげの 職業の 技（スーパーキノコ・1UPキノコ・ファイアフラワー・POWブロック・ヨッシーのたまご）・ひらめき技（グランドスター）・
//     今 ある 品（フライパン）と かぶる 品は 少し かえた（設計書の「実装メモ（G13班）」）
import { weapon, armor, shield, head, acc, priceUp } from './items-r88-kit.js?v=92b65651df0b';

const M = { work: 'mario' };

const GEAR = {
  // ───── マリオと ルイージ ─────
  r88_mr_cap: { ...head('fu3'), ...M, name: 'マリオのぼうし', bonus: { str: 10 }, desc: 'Mのマークがついた、赤いぼうし。世界一有名なひげの配管工のぼうし。力が上がる。' },
  r88_mr_lcap: { ...head('fu3'), ...M, name: 'ルイージのぼうし', bonus: { agi: 10 }, desc: 'Lのマークがついた、緑のぼうし。せの高い弟のぼうし。素早さが上がる。' },
  r88_mr_overall: { ...armor('cloth', 'shop'), ...M, name: 'オーバーオール', bonus: { hp: 10 }, desc: '青いつなぎの作業着。はたらき者の配管工のふだん着。最大HPが少し上がる。' },
  r88_mr_hammer: { ...weapon('axe', 'mei'), ...M, name: 'マリオのハンマー', fx: [{ k: 'crit', v: 6 }], bonus: { str: 6 }, look: 'hammer', desc: '大きな木のハンマー。思いきりふり下ろす。会心の一撃が出やすい。' },
  // ───── パワーアップ ─────
  r88_mr_super: { ...acc('fu3'), ...M, name: '赤いスーパーキノコ', bonus: { hp: 70 }, desc: '赤に白い水玉の、大きくなれるキノコ。最大HPが大きく上がる。' },
  r88_mr_fire: { ...acc('mei'), ...M, name: 'もえるファイアフラワー', orb: { el: 'fire', v: 6 }, bonus: { str: 6 }, desc: 'とると、火の玉を投げられるようになる花。武器のふつうの攻撃が炎になる。' },
  r88_mr_ice: { ...acc('mei'), ...M, name: 'アイスフラワー', orb: { el: 'ice', v: 6 }, bonus: { str: 6 }, desc: 'とると、当てた敵をこおらせる玉を投げられるようになる青い花。武器のふつうの攻撃が氷になる。' },
  r88_mr_star: { ...acc('den'), ...M, name: 'スーパースター', bonus: { str: 60, hp: 100, agi: 44, def: 36 }, use: { ability: 'r88u_mr_star' }, desc: 'ぴかぴか光る、ふしぎな星。とると、しばらくむてきになる。使うと、3回の行動の間、状態異常にならず、攻撃力が上がる。' },
  r88_mr_1up: { ...acc('mei'), ...M, name: '緑の1UPキノコ', fx: [{ k: 'endure', v: 1 }], bonus: { hp: 30 }, desc: '緑に白い水玉のキノコ。のこり人数が1人ふえる。1つの戦いで1回、たおれるダメージを受けても、HP1でふんばる。' },
  r88_mr_cape: { ...armor('cloth', 'fu3'), ...M, name: 'マント羽根', fx: [{ k: 'evade', v: 4 }], desc: 'とると黄色いマントがついて、空をとべる羽根。だれでも装備できる。敵の攻撃をかわしやすくなる。' },
  r88_mr_propeller: { ...head('fu3'), ...M, name: 'プロペラキノコ', fx: [{ k: 'evade', v: 4 }], desc: 'プロペラのついたキノコのぼうし。くるくる回って高くとび、ゆっくりおりる。敵の攻撃をかわしやすくなる。' },
  r88_mr_leaf: { ...acc('fu3'), ...M, name: 'スーパーこのは', fx: [{ k: 'evade', v: 4 }], desc: 'とるとしっぽがはえる、ふしぎな木の葉。しっぽでくるりとはらって、ゆっくりおりる。敵の攻撃をかわしやすくなる。' },
  r88_mr_penguin: { ...armor('robe', 'fu3'), ...M, name: 'ペンギンスーツ', fx: [{ k: 'res_ice', v: 4 }], desc: '氷の上でもすべらない、ペンギンのきぐるみ。ローブと同じあつかい。氷のダメージがへる。' },
  r88_mr_bell: { ...weapon('claw', 'mei'), ...M, name: 'ネコベル', fx: [{ k: 'chase', v: 6 }], look: 'claw', desc: 'とると、ネコのすがたになれる金のすず。ツメでひっかく。ときどきもう1回攻撃する。' },
  r88_mr_boomflower: { ...weapon('boomerang', 'mei'), ...M, name: 'ブーメランフラワー', fx: [{ k: 'atk', v: 6 }], look: 'boomer', desc: 'とると、ブーメランを投げられるようになる花。攻撃力が上がる。' },
  r88_mr_powerstar: { ...acc('mei'), ...M, name: 'パワースター', bonus: { str: 16 }, desc: 'お城の絵の中の世界にちらばった、大きな星。力が上がる。' },
  r88_mr_pow: { ...acc('mei'), ...M, name: '青いPOWブロック', bonus: { str: 8, def: 6 }, use: { ability: 'r88u_mr_pow' }, desc: 'POWと書かれた青いブロック。たたくと、まわりがゆれる。使うと、敵全体をゆらして、小さなダメージ。' },
  r88_mr_thunder: { ...acc('mei'), ...M, name: 'サンダー', bonus: { agi: 10 }, use: { ability: 'r88u_mr_thunder' }, desc: 'レースで使う、いなずまのアイテム。ほかのみんなを小さくする。使うと、敵全体の攻撃力を下げる。' },
  // ───── こうら ─────
  r88_mr_green: { ...weapon('boomerang', 'fu3'), ...M, name: '緑こうら', fx: [{ k: 'chase', v: 4 }], look: 'boomer', desc: 'まっすぐとんで、かべではね返るこうら。ブーメランと同じあつかい。ときどきもう1回攻撃する。' },
  r88_mr_red: { ...weapon('boomerang', 'mei'), ...M, name: '赤こうら', fx: [{ k: 'crit', v: 6 }], look: 'boomer', desc: '前の相手を追いかけて当たるこうら。ブーメランと同じあつかい。会心の一撃が出やすい。' },
  r88_mr_spiny: { ...weapon('boomerang', 'mei'), ...M, name: 'トゲゾーこうら', fx: [{ k: 'atk', v: 6 }], bonus: { str: 6 }, look: 'star', desc: 'つばさのはえた、とげとげの青いこうら。いちばん前を走る人を追いかける。ブーメランと同じあつかい。攻撃力が上がる。' },
  r88_mr_bshell: { ...shield('mei'), ...M, name: '大魔王のこうら', fx: [{ k: 'counter', v: 6 }], look: 'shell', desc: 'とげのついた、大魔王の大きなこうら。たてと同じあつかい。ときどきやりかえす。' },
  // ───── ピーチと ロゼッタ ─────
  r88_mr_parasol: { ...weapon('staff', 'mei'), ...M, name: 'ピーチのパラソル', fx: [{ k: 'evade', v: 6 }], bonus: { mag: 8 }, look: 'cane', desc: 'おひめさまのピンクのパラソル。ひらくと、ふわりとうかぶ。つえと同じあつかい。敵の攻撃をかわしやすくなる。' },
  r88_mr_crown: { ...head('mei'), ...M, name: '姫のかんむり', fx: [{ k: 'regen', v: 6 }], bonus: { heal: 6 }, desc: 'キノコの国のおひめさまの、宝石のついた金のかんむり。行動するたびにHPが少し回復する。' },
  r88_mr_pan: { ...weapon('bat', 'fu3'), ...M, name: 'ピーチのフライパン', fx: [{ k: 'crit', v: 4 }], look: 'pan', desc: 'おひめさまがふり回すフライパン。テニスラケットやゴルフクラブより、いちばん強い一打が出る。会心の一撃が出やすい。' },
  r88_mr_starrod: { ...weapon('staff', 'mei'), ...M, name: 'ロゼッタの星のつえ', fx: [{ k: 'el_light', v: 6 }], bonus: { mag: 10 }, look: 'star', desc: '星の世界の女王の、先に星がついたつえ。ふつうの攻撃が光になる。' },
  r88_mr_chiko: { ...acc('fu3'), ...M, name: 'チコ', fx: [{ k: 'chase', v: 4 }], desc: '星の世界の女王といっしょにいる、小さな星の子。いっしょに戦ってくれる。ときどきもう1回攻撃する。' },
  r88_mr_grand: { ...acc('den'), ...M, name: 'かがやくグランドスター', fx: [{ k: 'mpregen', v: 8 }], bonus: { mag: 46, hp: 90, agi: 34, def: 34, heal: 30 }, desc: 'パワースターより、ずっと大きな力をもつ星。行動するたびにMPが少し回復する。' },
  r88_mr_poltergust: { ...weapon('staff', 'mei'), ...M, name: 'オバキューム', fx: [{ k: 'slay_spirit', v: 6 }], bonus: { mag: 8 }, look: 'ring', desc: 'はかせが作った、ゆうれいをすいこむそうじ機。ライトを当てて止めてから、すいこむ。つえと同じあつかい。ゆうれい系の敵に大きなダメージ。' },
  r88_mr_cappy: { ...head('mei'), ...M, name: 'キャッピー', bonus: { agi: 8, str: 4 }, use: { ability: 'r88u_mr_cappy' }, desc: '目のついた、生きているぼうし。投げると、当たった相手にのりうつれる。使うと、敵1体を混乱させる（ボスにはきかない）。' },
  // ───── 仲間と ライバルの 品 ─────
  r88_mr_egg: { ...weapon('boomerang', 'fu3'), ...M, name: 'ヨッシーの緑のたまご', fx: [{ k: 'chase', v: 4 }], look: 'boomer', desc: '緑のてんてんもようのたまご。緑のきょうりゅうが投げる。ブーメランと同じあつかい。ときどきもう1回攻撃する。' },
  r88_mr_barrel: { ...weapon('axe', 'fu3'), ...M, name: 'ドンキーのたる', fx: [{ k: 'crit', v: 4 }], look: 'hammer', desc: 'ジャングルの大ザルが投げる、木のたる。オノと同じあつかい。会心の一撃が出やすい。' },
  r88_mr_banana: { ...acc('fu2'), ...M, name: 'ドンキーのバナナ', fx: [{ k: 'regen', v: 4 }], desc: 'ジャングルの大ザルの大好物。行動するたびにHPが少し回復する。' },
  r88_mr_garlic: { ...acc('fu3'), ...M, name: 'ワリオのニンニク', bonus: { str: 16, agi: -8 }, desc: '黄色いぼうしの、よくばりな男の大好物。食べると力がわく。力が大きく上がるが、素早さが下がる。' },
};
priceUp(GEAR, { r88_mr_overall: 70 });

export const ITEMS_R88_MARIO = GEAR;
export const R88_REBIRTH_MARIO = {};

export const R88_MARIO_KANA = {
  r88_mr_cap: 'まりおのぼうし', r88_mr_lcap: 'るいーじのぼうし', r88_mr_overall: 'おーばーおーる', r88_mr_hammer: 'まりおのはんまー',
  r88_mr_super: 'あかいすーぱーきのこ', r88_mr_fire: 'もえるふぁいあふらわー', r88_mr_ice: 'あいすふらわー', r88_mr_star: 'すーぱーすたー',
  r88_mr_1up: 'みどりのわんあっぷきのこ', r88_mr_cape: 'まんとばね', r88_mr_propeller: 'ぷろぺらきのこ', r88_mr_leaf: 'すーぱーこのは',
  r88_mr_penguin: 'ぺんぎんすーつ', r88_mr_bell: 'ねこべる', r88_mr_boomflower: 'ぶーめらんふらわー', r88_mr_powerstar: 'ぱわーすたー',
  r88_mr_pow: 'あおいぱうぶろっく', r88_mr_thunder: 'さんだー', r88_mr_green: 'みどりこうら', r88_mr_red: 'あかこうら',
  r88_mr_spiny: 'とげぞーこうら', r88_mr_bshell: 'だいまおうのこうら', r88_mr_parasol: 'ぴーちのぱらそる', r88_mr_crown: 'ひめのかんむり',
  r88_mr_pan: 'ぴーちのふらいぱん', r88_mr_starrod: 'ろぜったのほしのつえ', r88_mr_chiko: 'ちこ', r88_mr_grand: 'かがやくぐらんどすたー',
  r88_mr_poltergust: 'おばきゅーむ', r88_mr_cappy: 'きゃっぴー', r88_mr_egg: 'よっしーのみどりのたまご', r88_mr_barrel: 'どんきーのたる',
  r88_mr_banana: 'どんきーのばなな', r88_mr_garlic: 'わりおのにんにく',
};
