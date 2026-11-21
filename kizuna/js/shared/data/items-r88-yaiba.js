// 第88回 G1班: YAIBA の 品（docs/plan-r88-anime-gear.md の 2-2。26こ）
//   刃の 剣（木刀 → 雷神剣 → 竜神剣 → は王剣 の 生まれ変わり。R88_REBIRTH_YAIBA）・おに丸の 剣・七つの玉 ＋ 竜神の玉・ほかの 人の 品
//   品の 形は items-r88-kit.js。作品の しくみ（fx・use・reach・orb・set）は shared/gear-r88.js
import { weapon, armor, shield, head, acc, priceUp } from './items-r88-kit.js?v=7eefef6c1f45';

const Y = { work: 'yaiba' };

const GEAR = {
  // ───── 刃の 剣（1本が 生まれ変わる）─────
  r88_bokuto: { ...weapon('sword', 'shop'), ...Y, name: '木刀', atk: 7, bonus: { agi: 1 }, look: 'wood', desc: 'けいこに使う、かしの木の刀。しゅぎょうをつむと、何かが目をさますかもしれない。' },
  r88_raijin_sword: { ...weapon('sword', 'mei'), ...Y, name: '雷神剣', fx: [{ k: 'el_bolt', v: 5 }], bonus: { agi: 4 }, look: 'raijin', desc: '雷神がやどる魔剣。しゅぎょうして、やっと言うことを聞くようになった。ふつうの攻撃が雷になる。' },
  r88_ryujin_sword: { ...weapon('sword', 'den'), ...Y, name: '竜神剣', fx: [{ k: 'el_light', v: 6 }], bonus: { str: 16, hp: 40 }, look: 'raijin', desc: '雷神剣に竜神の玉をはめた、竜の神の剣。ふつうの攻撃が光になる。' },
  r88_haou_sword: { ...weapon('sword', 'den'), ...Y, name: 'は王剣', fx: [{ k: 'crit', v: 8 }], bonus: { str: 20, agi: 10 }, look: 'raijin', desc: '雷神剣と風神剣が1つになった剣。風雷剣ともよばれる。会心の一撃がとても出やすい。' },
  // ───── おに丸の 剣 ─────
  r88_fujin_sword: { ...weapon('sword', 'mei'), ...Y, name: '風神剣', fx: [{ k: 'el_wind', v: 5 }], bonus: { str: 12, def: -10 }, look: 'scimitar', desc: 'おに丸の家につたわる、風神がやどる、かた方だけが切れる魔剣。力が上がるが、身の守りが下がる。ふつうの攻撃が風になる。' },
  r88_maou_sword: { ...weapon('sword', 'den'), ...Y, name: '魔王剣', fx: [{ k: 'el_dark', v: 6 }], bonus: { str: 18, mag: 10 }, use: { ability: 'r88u_maou' }, look: 'scimitar', desc: '月で作られたという魔剣。三日月の形のあなが、だんだん満ちていく。ふつうの攻撃が闇になる。' },
  r88_oni_horn: { ...head('fu3'), ...Y, name: 'おにのつの', bonus: { str: 8 }, desc: 'おにのつのの形をしたかざり。つけると、力がわいてくる。' },
  // ───── 七つの玉（アクセ。そろいの 組）＋ 竜神の玉 ─────
  r88_orb_fire: { ...acc('mei'), ...Y, set: 'seven_orbs', name: '炎の玉', orb: { el: 'fire' }, bonus: { str: 6 }, desc: '火の山で見つかった玉。つけると、武器のふつうの攻撃が炎になる。' },
  r88_orb_water: { ...acc('mei'), ...Y, set: 'seven_orbs', name: '水の玉', fx: [{ k: 'res_fire', v: 6 }], bonus: { hp: 20 }, desc: '湖の底の岩にあった玉。水をあやつり、炎のダメージをへらす。' },
  r88_orb_ice: { ...acc('mei'), ...Y, set: 'seven_orbs', name: '氷の玉', orb: { el: 'ice' }, bonus: { str: 6 }, desc: '北の大地で見つかった玉。つけると、武器のふつうの攻撃が氷になる。' },
  r88_orb_dark: { ...acc('mei'), ...Y, set: 'seven_orbs', name: '闇の玉', orb: { el: 'dark' }, bonus: { str: 6 }, desc: '玉屋でふつうに売られていた、ふしぎな黒い玉。つけると、武器のふつうの攻撃が闇になる。' },
  r88_orb_gold: { ...acc('mei'), ...Y, set: 'seven_orbs', name: '金の玉', fx: [{ k: 'evade', v: 6 }], bonus: { agi: 6 }, desc: 'たぬきの化け玉。つけると、化けて敵の攻撃をかわしやすくなる。' },
  r88_orb_big: { ...acc('mei'), ...Y, set: 'seven_orbs', name: '大の玉', bonus: { hp: 80, str: 8, agi: -10 }, desc: '大仏の中にあった玉。体が大きくなってHPがとても上がるが、素早さが下がる。' },
  r88_orb_tou: { ...acc('mei'), ...Y, set: 'seven_orbs', name: '当の玉', bonus: { mag: 14, mp: 12 }, desc: 'しゃべる玉。ほかの玉のありかを知っているらしい。魔力が上がる。' },
  r88_ryujin_orb: { ...acc('den'), ...Y, name: '竜神の玉', fx: [{ k: 'res_fire', v: 4 }, { k: 'evade', v: 4 }], bonus: { hp: 110, str: 32, def: 28, mag: 30, agi: 30, heal: 22 }, resist: { ice: 0.9, dark: 0.9 }, desc: '七つの玉の力を少しずつ全部あわせた、8こめの玉。空もとべそうなほど体が軽くなる。' },
  // ───── ほかの 人の 品 ─────
  r88_monohoshi: { ...weapon('spear', 'mei'), ...Y, name: '物ほしざお', reach: 'group', bonus: { agi: 4 }, look: 'lance', desc: '剣の名人が使った、とても長い魔剣。ふつうの攻撃が、同じ種類の敵みんなにとどく。' },
  r88_kikuichi: { ...weapon('sword', 'mei'), ...Y, name: 'きく一文字', fx: [{ k: 'crit', v: 6 }], bonus: { agi: 6 }, look: 'katana', desc: '天才剣士が、殿様の前の試合で使った名刀。会心の一撃が出やすい。' },
  r88_niten: { ...weapon('dagger', 'mei'), ...Y, name: '二天一流の二刀', fx: [{ k: 'chase', v: 6 }], bonus: { agi: 6 }, look: 'dirk', desc: '二刀流の剣ごうの、大小2本の刀。ふつうの攻撃のあと、ときどきもう1回切りつける。' },
  r88_shinai: { ...weapon('bat', 'fu3'), ...Y, name: '竹刀', fx: [{ k: 'crit', v: 4 }], look: 'bamboo', desc: '剣道のけいこに使う竹の刀。会心の一撃が出やすい。' },
  r88_eyepatch: { ...acc('fu3'), ...Y, name: '眼帯', fx: [{ k: 'crit', v: 4 }], bonus: { str: 4 }, desc: 'かた目の剣士の眼帯。ねらいがさだまって、会心の一撃が出やすい。' },
  r88_snake_spear: { ...weapon('spear', 'mei'), ...Y, name: 'へび神のほこ', fx: [{ k: 'poison', v: 6 }], bonus: { str: 4 }, look: 'trident', desc: 'へびの神の力をもつ、三つまたのほこ。ときどき敵を毒にする。' },
  r88_frog_axe: { ...weapon('axe', 'fu3'), ...Y, name: 'カエル男のオノ', fx: [{ k: 'chase', v: 4 }], look: 'axe', desc: 'のびる舌といっしょに使うオノ。ふつうの攻撃のあと、ときどきもう1回攻撃する。' },
  r88_saber: { ...weapon('sword', 'mei'), ...Y, name: '西洋サーベル', fx: [{ k: 'chase', v: 6 }], bonus: { agi: 6 }, look: 'saber', desc: '空をとぶ速さで切りつける、細身の西洋の剣。ふつうの攻撃のあと、ときどきもう1回攻撃する。' },
  r88_kanabo: { ...weapon('bat', 'fu3'), ...Y, name: '金棒', fx: [{ k: 'crit', v: 4 }], bonus: { str: 4 }, look: 'spiked', desc: '大男のおぼうさんがふり回す、鉄のこん棒。会心の一撃が出やすい。' },
  r88_iron_kasa: { ...shield('fu3'), ...Y, name: '鉄のかさ', fx: [{ k: 'def', v: 4 }], look: 'round', desc: '大どろぼうが使った、鉄でできたかさ。開くとたてになる。' },
  r88_kusanagi: { ...weapon('sword', 'den'), ...Y, name: 'クサナギ', fx: [{ k: 'el_light', v: 6 }], bonus: { str: 18, agi: 10 }, look: 'holy', desc: '大きなへびのしっぽにあたる島の先で見つかった、神話の剣。ふつうの攻撃が光になる。' },
};
// 木刀は 店の 品の 強さ（★1）。まだ どの 店にも ならべない
priceUp(GEAR, { r88_bokuto: 50 });
// 雷神剣・風神剣は「風神と雷神」の 組（own）
GEAR.r88_raijin_sword.set = 'fujin_raijin';
GEAR.r88_fujin_sword.set = 'fujin_raijin';

export const ITEMS_R88_YAIBA = GEAR;

// 生まれ変わり（data/forge.js の rebirthOf。data/items-alchemy.js の REBIRTH に まぜる）
//   at … この 回数まで きたえた あと、もう1回 きたえると 生まれ変わる（ない ときは 上限＋れん金で ふやせる 回数）
//   shop … 店の 品（★1。ふつうは きたえられない）でも 生まれ変わる
//   need … 生まれ変わる ための 条件（{ items: [持って いる 品], sets: { 組の id: 数 } }。shared/gear-r88.js の rebirthNeedLack）
//   keep … きたえた 回数を そのまま うけつぐ（伝説 → 伝説。+8 の 竜神剣は +8 の は王剣に）
export const R88_REBIRTH_YAIBA = {
  r88_bokuto: { to: 'r88_raijin_sword', shop: true, at: 0, gold: 6000, mats: [['star_shard', 5], ['thunder_stone', 1]] },
  r88_raijin_sword: { to: 'r88_ryujin_sword', gold: 20000, mats: [['star_shard', 10], ['limit_stone', 1]], need: { items: ['r88_ryujin_orb'] } },
  r88_ryujin_sword: { to: 'r88_haou_sword', keep: true, gold: 30000, mats: [['star_shard', 12], ['limit_stone', 2]], need: { items: ['r88_fujin_sword'] } },
};

export const R88_YAIBA_KANA = {
  r88_bokuto: 'ぼくとう', r88_raijin_sword: 'らいじんけん', r88_ryujin_sword: 'りゅうじんけん', r88_haou_sword: 'はおうけん',
  r88_fujin_sword: 'ふうじんけん', r88_maou_sword: 'まおうけん', r88_oni_horn: 'おにのつの',
  r88_orb_fire: 'ほのおのたま', r88_orb_water: 'みずのたま', r88_orb_ice: 'こおりのたま', r88_orb_dark: 'やみのたま',
  r88_orb_gold: 'きんのたま', r88_orb_big: 'だいのたま', r88_orb_tou: 'とうのたま', r88_ryujin_orb: 'りゅうじんのたま',
  r88_monohoshi: 'ものほしざお', r88_kikuichi: 'きくいちもんじ', r88_niten: 'にてんいちりゅうのにとう', r88_shinai: 'しない',
  r88_eyepatch: 'がんたい', r88_snake_spear: 'へびがみのほこ', r88_frog_axe: 'かえるおとこのおの', r88_saber: 'せいようさーべる',
  r88_kanabo: 'かなぼう', r88_iron_kasa: 'てつのかさ', r88_kusanagi: 'くさなぎ',
};
