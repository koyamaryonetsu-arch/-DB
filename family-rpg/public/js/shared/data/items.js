// どうぐ・そうびの データ
// type: use(つかう どうぐ) weapon armor shield head acc key(だいじなもの)
// weapon.cat: sword dagger axe staff spear claw fan whip
// armor.armorType: cloth(だれでも) heavy(戦士) robe(僧侶/魔法使い/旅芸人) gi(武闘家/戦士/旅芸人)
// head.helm: true だと 戦士だけ

export const ITEMS = {
  // ───── つかう どうぐ ─────
  herb: {
    name: 'やくそう', type: 'use', price: 8, target: 'ally', battle: true, field: true,
    effect: { type: 'heal', base: [30, 40], fixed: true },
    desc: 'HPを 35ほど かいふくする くすりくさ。',
  },
  antidote: {
    name: 'どくけしそう', type: 'use', price: 10, target: 'ally', battle: true, field: true,
    effect: { type: 'cure', statuses: ['poison'] },
    desc: 'どくを けす くさ。',
  },
  moonherb: {
    name: 'まんげつそう', type: 'use', price: 25, target: 'ally', battle: true, field: true,
    effect: { type: 'cure', statuses: ['paralyze', 'sleep', 'confuse'] },
    desc: 'まひ・ねむり・こんらんを なおす ふしぎな くさ。',
  },
  magic_water: {
    name: 'まほうのせいすい', type: 'use', price: 0, sell: 75, target: 'ally', battle: true, field: true,
    effect: { type: 'mpHeal', base: [20, 28] },
    desc: 'MPを 25ほど かいふくする。とても きちょう。',
  },
  holy_water: {
    name: 'せいすい', type: 'use', price: 20, target: 'self', battle: false, field: true,
    effect: { type: 'repel', seconds: 120 },
    desc: 'しばらくの あいだ、よわい モンスターが よってこなくなる。',
  },
  return_wing: {
    name: 'きかんのはね', type: 'use', price: 25, target: 'self', battle: false, field: true,
    effect: { type: 'warp' },
    desc: 'いちど いった 町や 村へ ひとっとびで もどれる はね。',
  },
  smoke_ball: {
    name: 'けむりだま', type: 'use', price: 30, target: 'self', battle: true, field: false,
    effect: { type: 'escape' },
    desc: 'たたかいから かならず にげられる。ボスには きかない。',
  },
  revive_flower: {
    name: 'よみがえりのはな', type: 'use', price: 0, sell: 200, target: 'deadAlly', battle: true, field: true,
    effect: { type: 'revive', hpRatio: 0.5 },
    desc: 'しんでしまった なかまを いきかえらせる ふしぎな はな。',
  },
  jelly: {
    name: 'ぷるりんゼリー', type: 'use', price: 0, sell: 6, target: 'ally', battle: true, field: true,
    effect: { type: 'heal', base: [10, 14], fixed: true },
    desc: 'ぷるりんが おとす ぷるぷるの ゼリー。すこし HPが かいふくする。',
  },
  star_shard: {
    name: 'ほしのかけら', type: 'use', price: 0, sell: 0, target: 'self', battle: false, field: false,
    desc: 'きらきら ひかる ほしの かけら。ルミナの町の「ほしあつめの おばあさん」が あつめている。',
  },
  seed_str: {
    name: 'ちからのたね', type: 'use', price: 0, sell: 30, target: 'ally', battle: false, field: true,
    effect: { type: 'seed', stat: 'str', amount: [1, 2] }, desc: 'たべると ちからが すこし あがる。',
  },
  seed_def: {
    name: 'まもりのたね', type: 'use', price: 0, sell: 30, target: 'ally', battle: false, field: true,
    effect: { type: 'seed', stat: 'def', amount: [1, 2] }, desc: 'たべると みのまもりが すこし あがる。',
  },
  seed_agi: {
    name: 'すばやさのたね', type: 'use', price: 0, sell: 30, target: 'ally', battle: false, field: true,
    effect: { type: 'seed', stat: 'agi', amount: [1, 2] }, desc: 'たべると すばやさが すこし あがる。',
  },
  seed_mag: {
    name: 'かしこさのたね', type: 'use', price: 0, sell: 30, target: 'ally', battle: false, field: true,
    effect: { type: 'seed', stat: 'mag', amount: [1, 2] }, desc: 'たべると まりょくが すこし あがる。',
  },
  seed_hp: {
    name: 'いのちのきのみ', type: 'use', price: 0, sell: 30, target: 'ally', battle: false, field: true,
    effect: { type: 'seed', stat: 'hp', amount: [3, 5] }, desc: 'たべると さいだいHPが あがる。',
  },

  // ───── ぶき ─────
  wood_sword: { name: 'きのけん', type: 'weapon', cat: 'sword', atk: 6, price: 30, desc: 'きで できた けいこよう の けん。' },
  bronze_sword: { name: 'どうのつるぎ', type: 'weapon', cat: 'sword', atk: 12, price: 110, desc: 'どうで できた けん。' },
  iron_sword: { name: 'てつのつるぎ', type: 'weapon', cat: 'sword', atk: 20, price: 420, desc: 'じょうぶな てつの けん。' },
  stardust_sword: { name: 'ほしくずのつるぎ', type: 'weapon', cat: 'sword', atk: 27, bonus: { agi: 4 }, price: 0, sell: 600, desc: 'ほしの ひかりを やどした けん。かるくて すばやく ふれる。' },
  stone_axe: { name: 'いしのオノ', type: 'weapon', cat: 'axe', atk: 15, price: 160, desc: 'おもたい いしの オノ。' },
  iron_axe: { name: 'てつのオノ', type: 'weapon', cat: 'axe', atk: 25, bonus: { agi: -3 }, price: 520, desc: 'いりょくは あるが すこし おもい。' },
  bronze_knife: { name: 'どうのナイフ', type: 'weapon', cat: 'dagger', atk: 8, price: 60, desc: 'かるい ナイフ。' },
  poison_knife: { name: 'どくのナイフ', type: 'weapon', cat: 'dagger', atk: 12, price: 300, onHit: { status: 'poison', chance: 0.25 }, desc: 'ときどき てきを どくに する ナイフ。' },
  oak_staff: { name: 'かしのつえ', type: 'weapon', cat: 'staff', atk: 5, bonus: { mag: 4, heal: 4 }, price: 45, desc: 'まりょくを たかめる きの つえ。' },
  wizard_staff: { name: 'まどうしのつえ', type: 'weapon', cat: 'staff', atk: 9, bonus: { mag: 10 }, price: 340, desc: 'こうげき呪文の いりょくが あがる つえ。' },
  healing_staff: { name: 'いやしのつえ', type: 'weapon', cat: 'staff', atk: 8, bonus: { heal: 12 }, price: 340, desc: 'かいふく呪文の ききめが あがる つえ。' },
  bronze_spear: { name: 'どうのやり', type: 'weapon', cat: 'spear', atk: 12, price: 120, desc: 'どうで できた やり。' },
  iron_spear: { name: 'てつのやり', type: 'weapon', cat: 'spear', atk: 19, price: 400, desc: 'てつの やり。' },
  bronze_knuckle: { name: 'ブロンズナックル', type: 'weapon', cat: 'claw', atk: 10, price: 90, desc: 'こぶしに はめる どうの ぶき。' },
  iron_claw: { name: 'てつのツメ', type: 'weapon', cat: 'claw', atk: 18, bonus: { agi: 2 }, price: 380, desc: 'するどい てつの ツメ。' },
  leather_whip: { name: 'かわのムチ', type: 'weapon', cat: 'whip', atk: 10, price: 180, desc: 'しなやかな かわの ムチ。まもの使いや 旅芸人が つかう。' },
  thorn_whip: { name: 'いばらのムチ', type: 'weapon', cat: 'whip', atk: 18, price: 460, desc: 'トゲの ついた ムチ。' },
  flame_whip: { name: 'ほのおのムチ', type: 'weapon', cat: 'whip', atk: 26, bonus: { mag: 4 }, price: 0, sell: 520, desc: 'ほのおを まとった ムチ。' },
  feather_fan: { name: 'はねのおうぎ', type: 'weapon', cat: 'fan', atk: 7, bonus: { agi: 3 }, price: 70, desc: 'かるい はねの おうぎ。' },
  dancer_fan: { name: 'おどりこのおうぎ', type: 'weapon', cat: 'fan', atk: 14, bonus: { agi: 5 }, price: 360, desc: 'おどりこが つかう うつくしい おうぎ。' },

  // ───── よろい・ふく ─────
  cloth: { name: 'ぬののふく', type: 'armor', armorType: 'cloth', def: 4, price: 10, desc: 'ふつうの ぬのの ふく。' },
  travel_clothes: { name: 'たびびとのふく', type: 'armor', armorType: 'cloth', def: 7, price: 70, desc: 'たびに むいた じょうぶな ふく。' },
  leather_armor: { name: 'かわのよろい', type: 'armor', armorType: 'cloth', def: 11, price: 190, desc: 'なめしがわの よろい。' },
  wind_clothes: { name: 'かぜのふく', type: 'armor', armorType: 'cloth', def: 10, bonus: { agi: 8 }, price: 0, sell: 300, desc: 'かぜの ように みがるに うごける ふく。' },
  chain_mail: { name: 'くさりかたびら', type: 'armor', armorType: 'heavy', def: 16, price: 280, desc: 'くさりを あんだ よろい。' },
  iron_armor: { name: 'てつのよろい', type: 'armor', armorType: 'heavy', def: 23, bonus: { agi: -2 }, price: 560, desc: 'じょうぶな てつの よろい。' },
  wizard_robe: { name: 'まどうしのローブ', type: 'armor', armorType: 'robe', def: 8, bonus: { mag: 4 }, price: 130, desc: 'まりょくを たかめる ローブ。' },
  holy_robe: { name: 'せいなるローブ', type: 'armor', armorType: 'robe', def: 12, bonus: { heal: 6 }, price: 360, desc: 'いやしの ちからが やどる ローブ。' },
  martial_gi: { name: 'ぶとうぎ', type: 'armor', armorType: 'gi', def: 9, bonus: { agi: 2 }, price: 150, desc: 'うごきやすい ぶとうか の ふく。' },
  dragon_gi: { name: 'りゅうのどうぎ', type: 'armor', armorType: 'gi', def: 15, bonus: { agi: 4 }, price: 480, desc: 'りゅうの ししゅうが ある どうぎ。' },
  star_mail: { name: 'ほしのよろい', type: 'armor', armorType: 'cloth', def: 18, bonus: { agi: 3, mag: 3 }, price: 0, sell: 700, desc: 'ほしの ぬのを おりこんだ ふしぎな よろい。だれでも そうびできる。' },

  // ───── たて ─────
  leather_shield: { name: 'かわのたて', type: 'shield', def: 4, price: 50, desc: 'かわで できた たて。' },
  scale_shield: { name: 'うろこのたて', type: 'shield', def: 8, price: 190, desc: 'まものの うろこの たて。' },
  iron_shield: { name: 'てつのたて', type: 'shield', def: 12, price: 400, desc: 'てつの たて。' },

  // ───── かぶと・ぼうし ─────
  leather_hat: { name: 'かわのぼうし', type: 'head', def: 2, price: 30, desc: 'かわの ぼうし。' },
  pointy_hat: { name: 'とんがりぼうし', type: 'head', def: 4, bonus: { mag: 3 }, price: 150, desc: 'まほうつかいに にんきの ぼうし。' },
  bandana: { name: 'バンダナ', type: 'head', def: 3, bonus: { agi: 2 }, price: 80, desc: 'あたまに まく ぬの。' },
  iron_helm: { name: 'てつかぶと', type: 'head', helm: true, def: 7, price: 300, desc: 'てつの かぶと。戦士 だけが そうびできる。' },

  // ───── アクセサリー ─────
  power_ring: { name: 'ちからのゆびわ', type: 'acc', bonus: { str: 5 }, price: 0, sell: 150, desc: 'ちからが 5 あがる ゆびわ。' },
  guard_ring: { name: 'まもりのゆびわ', type: 'acc', bonus: { def: 6 }, price: 0, sell: 150, desc: 'みのまもりが 6 あがる ゆびわ。' },
  swift_ring: { name: 'はやてのリング', type: 'acc', bonus: { agi: 10 }, price: 0, sell: 300, desc: 'すばやさが 10 あがる。こうどうの じゅんばんが はやく くる！' },
  star_charm: { name: 'ほしのおまもり', type: 'acc', bonus: { hp: 10, mp: 5 }, resist: { sleep: 0.5, poison: 0.5 }, price: 0, sell: 200, desc: 'ねむりと どくに かかりにくくなる おまもり。' },
  mage_earring: { name: 'まほうのイヤリング', type: 'acc', bonus: { mp: 8, mag: 2 }, price: 0, sell: 200, desc: 'MPと まりょくが あがる イヤリング。' },

  // ───── だいじなもの ─────
  star_flower: { name: '星の花', type: 'key', desc: 'ほしみの丘に さく、ほしの ひかりを すった はな。' },
  spirit_wood: { name: 'せいれいの木', type: 'key', desc: 'もりのぬしから もらった ふしぎな ざいもく。' },
  cave_key: { name: 'どうくつのカギ', type: 'key', desc: 'なげきの洞窟の おくの とびらを ひらく カギ。' },
  guardian_stone: { name: '守り星の石', type: 'key', desc: 'ホシフル村を まもってきた ほしの いし。ヒビが はいっている。' },
  mike_bell: { name: 'ミケのすず', type: 'key', desc: 'まいごの ねこ ミケの くびわに ついていた すず。' },
};

// そうび部位
export const SLOTS = ['weapon', 'armor', 'shield', 'head', 'acc'];
export const SLOT_NAMES = { weapon: 'ぶき', armor: 'よろい', shield: 'たて', head: 'あたま', acc: 'アクセ' };
export const SLOT_OF_TYPE = { weapon: 'weapon', armor: 'armor', shield: 'shield', head: 'head', acc: 'acc' };

export const WEAPON_CAT_NAMES = {
  sword: 'けん', dagger: 'たんけん', axe: 'オノ', staff: 'つえ', spear: 'やり', claw: 'ツメ', fan: 'おうぎ', whip: 'ムチ', none: 'すで',
};

export function sellPrice(id) {
  const it = ITEMS[id];
  if (!it || it.type === 'key') return 0;
  if (it.sell !== undefined) return it.sell;
  return Math.floor((it.price || 0) * 3 / 4);
}
