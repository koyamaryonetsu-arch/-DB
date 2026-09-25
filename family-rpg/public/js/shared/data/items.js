// どうぐ・そうびの データ
// type: use(つかう どうぐ) weapon armor shield head acc key(だいじなもの)
// weapon.cat: sword dagger axe staff spear claw fan whip
// armor.armorType: cloth(だれでも) heavy(戦士) robe(僧侶/魔法使い/旅芸人) gi(武闘家/戦士/旅芸人)
// head.helm: true だと 戦士だけ

export const ITEMS = {
  // ───── つかう どうぐ ─────
  herb: {
    name: '薬草', type: 'use', price: 8, target: 'ally', battle: true, field: true,
    effect: { type: 'heal', base: [30, 40], fixed: true },
    desc: 'HPを35ほど回復する薬草。',
  },
  antidote: {
    name: '毒消し草', type: 'use', price: 10, target: 'ally', battle: true, field: true,
    effect: { type: 'cure', statuses: ['poison'] },
    desc: '毒を消す草。',
  },
  moonherb: {
    name: '満月草', type: 'use', price: 25, target: 'ally', battle: true, field: true,
    effect: { type: 'cure', statuses: ['paralyze', 'sleep', 'confuse'] },
    desc: 'マヒ・ねむり・混乱を治す不思議な草。',
  },
  magic_water: {
    name: '魔法の聖水', type: 'use', price: 0, sell: 75, target: 'ally', battle: true, field: true,
    effect: { type: 'mpHeal', base: [20, 28] },
    desc: 'MPを25ほど回復する。とても貴重。',
  },
  holy_water: {
    name: '聖水', type: 'use', price: 20, target: 'self', battle: false, field: true,
    effect: { type: 'repel', seconds: 120 },
    desc: 'しばらくの間、弱いモンスターが寄ってこなくなる。',
  },
  return_wing: {
    name: '帰り道の羽', type: 'use', price: 25, target: 'self', battle: false, field: true,
    effect: { type: 'warp' },
    desc: '一度行った町や村へひとっ飛びでもどれる羽。',
  },
  smoke_ball: {
    name: 'けむり玉', type: 'use', price: 30, target: 'self', battle: true, field: false,
    effect: { type: 'escape' },
    desc: '戦いから必ず逃げられる。ボスには効かない。',
  },
  revive_flower: {
    name: 'よみがえりの花', type: 'use', price: 0, sell: 200, target: 'deadAlly', battle: true, field: true,
    effect: { type: 'revive', hpRatio: 0.5 },
    desc: '死んでしまった仲間を生き返らせる不思議な花。',
  },
  jelly: {
    name: 'ぷるりんゼリー', type: 'use', price: 0, sell: 6, target: 'ally', battle: true, field: true,
    effect: { type: 'heal', base: [10, 14], fixed: true },
    desc: 'ぷるりんが落とすぷるぷるのゼリー。少しHPが回復する。',
  },
  star_shard: {
    name: '星のかけら', type: 'use', price: 0, sell: 0, target: 'self', battle: false, field: false,
    desc: 'きらきら光る星のかけら。ルミナの町の「星集めのおばあさん」が集めている。',
  },
  seed_str: {
    name: '力の種', type: 'use', price: 0, sell: 30, target: 'ally', battle: false, field: true,
    effect: { type: 'seed', stat: 'str', amount: [1, 2] }, desc: '食べると力が少し上がる。',
  },
  seed_def: {
    name: '守りの種', type: 'use', price: 0, sell: 30, target: 'ally', battle: false, field: true,
    effect: { type: 'seed', stat: 'def', amount: [1, 2] }, desc: '食べると身の守りが少し上がる。',
  },
  seed_agi: {
    name: '素早さの種', type: 'use', price: 0, sell: 30, target: 'ally', battle: false, field: true,
    effect: { type: 'seed', stat: 'agi', amount: [1, 2] }, desc: '食べると素早さが少し上がる。',
  },
  seed_mag: {
    name: 'かしこさの種', type: 'use', price: 0, sell: 30, target: 'ally', battle: false, field: true,
    effect: { type: 'seed', stat: 'mag', amount: [1, 2] }, desc: '食べると魔力が少し上がる。',
  },
  seed_hp: {
    name: '命の木の実', type: 'use', price: 0, sell: 30, target: 'ally', battle: false, field: true,
    effect: { type: 'seed', stat: 'hp', amount: [3, 5] }, desc: '食べると最大HPが上がる。',
  },

  // ───── ぶき ─────
  wood_sword: { name: '木の剣', type: 'weapon', cat: 'sword', atk: 6, price: 30, desc: '木でできたけいこ用の剣。' },
  bronze_sword: { name: '銅の剣', type: 'weapon', cat: 'sword', atk: 12, price: 110, desc: '銅でできた剣。' },
  iron_sword: { name: '鉄の剣', type: 'weapon', cat: 'sword', atk: 20, price: 420, desc: 'じょうぶな鉄の剣。' },
  stardust_sword: { name: '星くずの剣', type: 'weapon', cat: 'sword', atk: 27, bonus: { agi: 4 }, price: 0, sell: 600, desc: '星の光を宿した剣。軽くて素早くふれる。' },
  stone_axe: { name: '石のオノ', type: 'weapon', cat: 'axe', atk: 15, price: 160, desc: '重たい石のオノ。' },
  iron_axe: { name: '鉄のオノ', type: 'weapon', cat: 'axe', atk: 25, bonus: { agi: -3 }, price: 520, desc: '威力はあるが少し重い。' },
  bronze_knife: { name: '銅のナイフ', type: 'weapon', cat: 'dagger', atk: 8, price: 60, desc: '軽いナイフ。' },
  poison_knife: { name: '毒のナイフ', type: 'weapon', cat: 'dagger', atk: 12, price: 300, onHit: { status: 'poison', chance: 0.25 }, desc: '時々敵を毒にするナイフ。' },
  oak_staff: { name: 'かしのつえ', type: 'weapon', cat: 'staff', atk: 5, bonus: { mag: 4, heal: 4 }, price: 45, desc: '魔力を高める木のつえ。' },
  wizard_staff: { name: '魔道士のつえ', type: 'weapon', cat: 'staff', atk: 9, bonus: { mag: 10 }, price: 340, desc: '攻撃呪文の威力が上がるつえ。' },
  healing_staff: { name: 'いやしのつえ', type: 'weapon', cat: 'staff', atk: 8, bonus: { heal: 12 }, price: 340, desc: '回復呪文の効き目が上がるつえ。' },
  bronze_spear: { name: '銅のやり', type: 'weapon', cat: 'spear', atk: 12, price: 120, desc: '銅でできたやり。' },
  iron_spear: { name: '鉄のやり', type: 'weapon', cat: 'spear', atk: 19, price: 400, desc: '鉄のやり。' },
  bronze_knuckle: { name: 'ブロンズナックル', type: 'weapon', cat: 'claw', atk: 10, price: 90, desc: 'こぶしにはめる銅の武器。' },
  iron_claw: { name: '鉄のツメ', type: 'weapon', cat: 'claw', atk: 18, bonus: { agi: 2 }, price: 380, desc: 'するどい鉄のツメ。' },
  leather_whip: { name: '皮のムチ', type: 'weapon', cat: 'whip', atk: 10, price: 180, desc: 'しなやかな皮のムチ。魔物使いや旅芸人が使う。' },
  thorn_whip: { name: '茨のムチ', type: 'weapon', cat: 'whip', atk: 18, price: 460, desc: 'トゲの付いたムチ。' },
  flame_whip: { name: '炎のムチ', type: 'weapon', cat: 'whip', atk: 26, bonus: { mag: 4 }, price: 0, sell: 520, desc: '炎をまとったムチ。' },
  feather_fan: { name: '羽のおうぎ', type: 'weapon', cat: 'fan', atk: 7, bonus: { agi: 3 }, price: 70, desc: '軽い羽のおうぎ。' },
  dancer_fan: { name: 'おどり子のおうぎ', type: 'weapon', cat: 'fan', atk: 14, bonus: { agi: 5 }, price: 360, desc: 'おどり子が使う美しいおうぎ。' },

  // ───── よろい・ふく ─────
  cloth: { name: '布の服', type: 'armor', armorType: 'cloth', def: 4, price: 10, desc: 'ふつうの布の服。' },
  travel_clothes: { name: '旅人の服', type: 'armor', armorType: 'cloth', def: 7, price: 70, desc: '旅に向いたじょうぶな服。' },
  leather_armor: { name: '皮のよろい', type: 'armor', armorType: 'cloth', def: 11, price: 190, desc: 'なめし革のよろい。' },
  wind_clothes: { name: '風の服', type: 'armor', armorType: 'cloth', def: 10, bonus: { agi: 8 }, price: 0, sell: 300, desc: '風のように身軽に動ける服。' },
  chain_mail: { name: 'くさりかたびら', type: 'armor', armorType: 'heavy', def: 16, price: 280, desc: 'くさりを編んだよろい。' },
  iron_armor: { name: '鉄のよろい', type: 'armor', armorType: 'heavy', def: 23, bonus: { agi: -2 }, price: 560, desc: 'じょうぶな鉄のよろい。' },
  wizard_robe: { name: '魔道士のローブ', type: 'armor', armorType: 'robe', def: 8, bonus: { mag: 4 }, price: 130, desc: '魔力を高めるローブ。' },
  holy_robe: { name: '聖なるローブ', type: 'armor', armorType: 'robe', def: 12, bonus: { heal: 6 }, price: 360, desc: 'いやしの力が宿るローブ。' },
  martial_gi: { name: '武道着', type: 'armor', armorType: 'gi', def: 9, bonus: { agi: 2 }, price: 150, desc: '動きやすい武闘家の服。' },
  dragon_gi: { name: '竜の道着', type: 'armor', armorType: 'gi', def: 15, bonus: { agi: 4 }, price: 480, desc: '竜のししゅうがある道着。' },
  star_mail: { name: '星のよろい', type: 'armor', armorType: 'cloth', def: 18, bonus: { agi: 3, mag: 3 }, price: 0, sell: 700, desc: '星の布を織りこんだ不思議なよろい。だれでも装備できる。' },

  // ───── たて ─────
  leather_shield: { name: '皮のたて', type: 'shield', def: 4, price: 50, desc: '皮でできたたて。' },
  scale_shield: { name: 'うろこのたて', type: 'shield', def: 8, price: 190, desc: '魔物のうろこのたて。' },
  iron_shield: { name: '鉄のたて', type: 'shield', def: 12, price: 400, desc: '鉄のたて。' },

  // ───── かぶと・ぼうし ─────
  leather_hat: { name: '皮のぼうし', type: 'head', def: 2, price: 30, desc: '皮のぼうし。' },
  pointy_hat: { name: 'とんがりぼうし', type: 'head', def: 4, bonus: { mag: 3 }, price: 150, desc: '魔法使いに人気のぼうし。' },
  bandana: { name: 'バンダナ', type: 'head', def: 3, bonus: { agi: 2 }, price: 80, desc: '頭に巻く布。' },
  iron_helm: { name: '鉄かぶと', type: 'head', helm: true, def: 7, price: 300, desc: '鉄のかぶと。戦士だけが装備できる。' },

  // ───── アクセサリー ─────
  power_ring: { name: '力の指輪', type: 'acc', bonus: { str: 5 }, price: 0, sell: 150, desc: '力が5上がる指輪。' },
  guard_ring: { name: '守りの指輪', type: 'acc', bonus: { def: 6 }, price: 0, sell: 150, desc: '身の守りが6上がる指輪。' },
  swift_ring: { name: 'はやてのリング', type: 'acc', bonus: { agi: 10 }, price: 0, sell: 300, desc: '素早さが10上がる。行動の順番が早く来る！' },
  star_charm: { name: '星のお守り', type: 'acc', bonus: { hp: 10, mp: 5 }, resist: { sleep: 0.5, poison: 0.5 }, price: 0, sell: 200, desc: 'ねむりと毒にかかりにくくなるお守り。' },
  mage_earring: { name: '魔法のイヤリング', type: 'acc', bonus: { mp: 8, mag: 2 }, price: 0, sell: 200, desc: 'MPと魔力が上がるイヤリング。' },

  // ───── だいじなもの ─────
  star_flower: { name: '星の花', type: 'key', desc: '星見の丘にさく、星の光を吸った花。' },
  spirit_wood: { name: 'せいれいの木', type: 'key', desc: '森の主からもらった不思議な材木。' },
  cave_key: { name: '洞窟のカギ', type: 'key', desc: 'なげきの洞窟のおくのとびらを開くカギ。' },
  guardian_stone: { name: '守り星の石', type: 'key', desc: 'ホシフル村を守ってきた星の石。ヒビが入っている。' },
  mike_bell: { name: 'ミケのすず', type: 'key', desc: '迷子のねこミケの首輪に付いていたすず。' },
};

// そうび部位
export const SLOTS = ['weapon', 'armor', 'shield', 'head', 'acc'];
export const SLOT_NAMES = { weapon: '武器', armor: 'よろい', shield: 'たて', head: '頭', acc: 'アクセ' };
export const SLOT_OF_TYPE = { weapon: 'weapon', armor: 'armor', shield: 'shield', head: 'head', acc: 'acc' };

export const WEAPON_CAT_NAMES = {
  sword: '剣', dagger: '短剣', axe: 'オノ', staff: 'つえ', spear: 'やり', claw: 'ツメ', fan: 'おうぎ', whip: 'ムチ', none: '素手',
};

export function sellPrice(id) {
  const it = ITEMS[id];
  if (!it || it.type === 'key') return 0;
  if (it.sell !== undefined) return it.sell;
  return Math.floor((it.price || 0) * 3 / 4);
}
