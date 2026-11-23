// 第88回 G2班: スレイヤーズの 品（docs/plan-r88-anime-gear.md の 2-3）
//   ガウリイの 剣と よろい・リナの 品・なかまと ライバルの 品・魔法の 道具・異界の 魔王の 5つの 武器（そろい igai_maou）
//   賢者の石は 今 ある 品（items-rare.js の philosopher_stone）に つなぐ: オリハルコンの像を きたえると 生まれ変わる（今の 品は かえない）
//   品の 形は items-r88-kit.js。作品の しくみ（fx・use・reach・orb・set）は shared/gear-r88.js
import { weapon, armor, shield, head, acc, priceUp } from './items-r88-kit.js?v=efa1b5f542af';

const S = { work: 'slayers' };
const IM = { work: 'slayers', set: 'igai_maou' };

const GEAR = {
  // ───── ガウリイの 剣と よろい ─────
  r88_gorun: { ...weapon('sword', 'den'), ...IM, name: '烈光の剣', fx: [{ k: 'el_light', v: 8 }], bonus: { str: 18, agi: 8 }, use: { ability: 'r88u_hikari' }, look: 'hikari', desc: 'ガブリエフ家の家宝の「光の剣」。つかから光のやいばが出て、魔族も切れる。むかし大きな魔物をたおした。ふつうの攻撃が光になる。' },
  r88_zanyo: { ...weapon('sword', 'den'), ...S, name: '斬よう剣', fx: [{ k: 'crit', v: 8 }], bonus: { str: 22 }, look: 'great', desc: 'まわりの魔力を切れ味にかえて、何でも切ってしまう魔剣。さやまで切れるので、さやに切れ味を落とす呪文をかけてある。会心の一撃がとても出やすい。' },
  r88_serpent: { ...armor('cloth', 'mei'), ...S, name: 'アイアンサーペントのよろい', fx: [{ k: 'def', v: 5 }], bonus: { hp: 20 }, desc: '大きなアイアンサーペントのうろこで作ったよろい。だれでも装備できる。守備力が上がる。' },
  // ───── リナの 品 ─────
  r88_demonblood: { ...acc('den'), ...S, name: '魔血玉のお守り', bonus: { hp: 100, mag: 48, mp: 40, heal: 30, def: 24, agi: 20 }, use: { ability: 'r88u_demonblood' }, desc: '4人の魔王の力をこめた、青・白・黒・赤の4つの玉のお守り。魔力がとても上がる。使うと、しばらく攻撃魔力が大きく上がる。' },
  r88_shortsword: { ...weapon('dagger', 'shop'), ...S, name: 'リナのショートソード', look: 'dirk', desc: '天才魔道士がこしにさげている、ふつうの短い剣。' },
  r88_lina_mantle: { ...armor('robe', 'fu3'), ...S, name: '黒いマントと大ガメのかたあて', fx: [{ k: 'res_dark', v: 4 }], bonus: { mag: 4 }, desc: '大ガメのこうらをけずったかたあてと、黒いマント。闇に強い。' },
  r88_bandana: { ...head('fu3'), ...S, name: '黒竜のバンダナ', bonus: { mag: 8 }, desc: '黒竜のひげをなめしておった布のバンダナ。ひたいのうらに小さな宝石のお守り。魔力が上がる。' },
  r88_jewels: { ...acc('shop'), ...S, name: 'ジュエルズアミュレット', bonus: { def: 3, mag: 2 }, desc: '魔法の力をふうじた宝石のお守り。きずのある宝石から作る。' },
  // ───── なかまと ライバルの 品 ─────
  r88_zel_wind: { ...weapon('sword', 'mei'), ...S, name: '魔風の魔力剣', fx: [{ k: 'el_wind', v: 5 }], bonus: { agi: 4 }, look: 'scimitar', desc: 'ゼルガディスの1本めの剣。魔風を出す、名前のない魔力剣。ふつうの攻撃が風になる。' },
  r88_zel_spell: { ...weapon('sword', 'mei'), ...S, name: '呪文をすう魔力剣', fx: [{ k: 'mana', v: 6 }], bonus: { mag: 6 }, look: 'crystal', desc: 'ゼルガディスの2本めの剣。呪文をすいこんで、はき出せる。攻撃が当たるとMPが回復する。' },
  r88_zel_hood: { ...head('fu3'), ...S, name: '白いフードとマスク', bonus: { def: 4, agi: 4 }, desc: 'ゼルガディスが顔をかくすのに使う、白いフードとマスク。' },
  r88_xellos: { ...weapon('staff', 'mei'), ...S, name: 'ゼロスのつえ', fx: [{ k: 'el_dark', v: 5 }], bonus: { mag: 16 }, look: 'ring', desc: 'なぞの神官のつえ。どこで手に入れたのかは「それはひみつです」。ふつうの攻撃が闇になる。' },
  r88_naga_spike: { ...armor('cloth', 'fu3'), ...S, name: 'トゲのかたあて', fx: [{ k: 'guard_confuse', v: 4 }], bonus: { str: 4 }, desc: '母の形見のトゲトゲのかたあて。高笑いすると、心がまよわない。混乱にかかりにくい。' },
  r88_naga_skull: { ...acc('fu3'), ...S, name: 'ドクロのかざり', fx: [{ k: 'guard_sleep', v: 4 }], bonus: { str: 4 }, desc: 'トゲのかたあてについているドクロのかざり。ねむりにかかりにくい。' },
  r88_filia_mace: { ...weapon('bat', 'fu3'), ...S, name: 'フィリアのメイス', fx: [{ k: 'crit', v: 4 }], look: 'spiked', desc: '竜の神官の少女が、からかわれるとふり回すメイス。会心の一撃が出やすい。' },
  r88_pokota: { ...weapon('sword', 'mei'), ...S, name: '光の剣のレプリカ', fx: [{ k: 'el_light', v: 5 }], look: 'hikari', desc: 'ポコタがおなかのファスナーの中にしまっている、光の剣のレプリカ。本物より少し弱い。ふつうの攻撃が光になる。' },
  r88_milina: { ...weapon('sword', 'fu3'), ...S, name: 'ミリーナの剣', fx: [{ k: 'evade', v: 4 }], bonus: { mag: 4 }, look: 'rapier', desc: '剣と魔法を使う魔法戦士の剣。敵の攻撃をかわしやすくなる。' },
  r88_zangulus: { ...weapon('sword', 'fu3'), ...S, name: 'ザングルスの剣', fx: [{ k: 'chase', v: 4 }], look: 'broad', desc: 'ガウリイに負けてから、ずっとガウリイをねらう剣士の剣。ときどきもう1回攻撃する。' },
  // ───── 魔法の 道具 ─────
  r88_orihalcon: { ...acc('fu3'), ...S, name: 'オリハルコンの像', bonus: { def: 8, hp: 20 }, desc: 'リナが持っていた、オリハルコンの小さな像。中に何かが入っているらしい。かじ屋できたえると……？' },
  r88_claire: { ...acc('mei'), ...S, name: '異界もくし録の写本', fx: [{ k: 'mpregen', v: 6 }], bonus: { mag: 10 }, desc: '異世界の魔道の知識が書かれた本を写したもの。行動するたびにMPが少し回復する。' },
  r88_zenafa: { ...armor('heavy', 'mei'), ...S, name: 'ゼナファアーマー', fx: [{ k: 'res_dark', v: 6 }], bonus: { mag: -20, hp: 40 }, desc: '竜族とエルフが作った、半分生きているよろい。闇にとても強いが、呪文が使いにくくなり、攻撃魔力が下がる。' },
  r88_shadow_mirror: { ...shield('mei'), ...S, name: '影の鏡', fx: [{ k: 'counter', v: 5 }], use: { ability: 'r88u_kage' }, look: 'mirror', desc: 'うつした物の「かげ」を生む、ふしぎなかがみのたて。ときどきやりかえす。使うと、敵のかげが敵をおそう。' },
  r88_regulus: { ...acc('fu3'), ...S, name: 'レグルスばん', fx: [{ k: 'guard_confuse', v: 4 }], bonus: { mag: 4 }, desc: '2まいで1組の、話ができる板。仲間の声がとどくので、混乱にかかりにくい。' },
  r88_rune_orb: { ...weapon('staff', 'mei'), ...S, name: '呪法球', fx: [{ k: 'el_bolt', v: 5 }], bonus: { mag: 14 }, use: { ability: 'r88u_juho' }, look: 'crystal', desc: '天気をいっときかえる、大きな宝の玉。ふつうの攻撃が雷になる。使うと、空をくもらせて雷を落とす。' },
  // ───── 異界の 魔王の 5つの 武器（烈光の剣と あわせて そろい）─────
  r88_galvaira: { ...weapon('boomerang', 'den'), ...IM, name: 'ガルヴェイラ', fx: [{ k: 'el_wind', v: 7 }], bonus: { agi: 14, str: 8 }, look: 'wing', desc: '異界の魔王の武器の1つ、光の矢をいる弓「ぐふう弓」。ふつうの攻撃が風になる。' },
  r88_nezard: { ...weapon('claw', 'den'), ...IM, name: 'ネザード', fx: [{ k: 'poison', v: 7 }], bonus: { str: 16, agi: 8 }, look: 'dragon', desc: '異界の魔王の武器の1つ、大きなツメ「毒きばツメ」。ときどき敵を毒にする。' },
  r88_bodigar: { ...weapon('axe', 'den'), ...IM, name: 'ボーディガー', fx: [{ k: 'slay_material', v: 7 }], bonus: { str: 20 }, look: 'hammer', desc: '異界の魔王の武器の1つ、つち「破神つち」。物質系の敵に大きなダメージ。' },
  r88_ragud: { ...weapon('spear', 'den'), ...IM, name: 'ラグドメゼギス', fx: [{ k: 'chase', v: 7 }], bonus: { str: 14, agi: 10 }, look: 'lance', desc: '異界の魔王の武器の1つ、やり「しゅんげきそう」。ときどきもう1回攻撃する。' },
};
priceUp(GEAR, { r88_shortsword: 80, r88_jewels: 120 });
// G5班: ライバルの まぼろしが きまったので、ガチャ・宝の 入れ物に 入れる（G2班の gacha: false を 外した。入らない 品は data/gacha-r88.js の gachaBlock が きめる）

export const ITEMS_R88_SLAYERS = GEAR;

// 生まれ変わり: オリハルコンの像（アクセ）を かじ屋で きたえると、中の 賢者の石（今 ある 品）が 出て くる
export const R88_REBIRTH_SLAYERS = {
  r88_orihalcon: { to: 'philosopher_stone', at: 0, gold: 8000, mats: [['star_shard', 4], ['magic_powder', 3]] },
};

export const R88_SLAYERS_KANA = {
  r88_gorun: 'れっこうのけん', r88_zanyo: 'ざんようけん', r88_serpent: 'あいあんさーぺんとのよろい',
  r88_demonblood: 'まけつぎょくのおまもり', r88_shortsword: 'りなのしょーとそーど', r88_lina_mantle: 'くろいまんとおおがめのかたあて',
  r88_bandana: 'こくりゅうのばんだな', r88_jewels: 'じゅえるずあみゅれっと',
  r88_zel_wind: 'まふうのまりょくけん', r88_zel_spell: 'じゅもんをすうまりょくけん', r88_zel_hood: 'しろいふーどとますく',
  r88_xellos: 'ぜろすのつえ', r88_naga_spike: 'とげのかたあて', r88_naga_skull: 'どくろのかざり', r88_filia_mace: 'ふぃりあのめいす',
  r88_pokota: 'ひかりのけんのれぷりか', r88_milina: 'みりーなのけん', r88_zangulus: 'ざんぐるすのけん',
  r88_orihalcon: 'おりはるこんのぞう', r88_claire: 'いかいもくしろくのしゃほん', r88_zenafa: 'ぜなふぁあーまー',
  r88_shadow_mirror: 'かげのかがみ', r88_regulus: 'れぐるすばん', r88_rune_orb: 'じゅほうきゅう',
  r88_galvaira: 'がるゔぇいら', r88_nezard: 'ねざーど', r88_bodigar: 'ぼーでぃがー', r88_ragud: 'らぐどめぜぎす',
};
