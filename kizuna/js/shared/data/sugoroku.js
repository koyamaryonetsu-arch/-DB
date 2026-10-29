// 第37回 B: すごろく場（カモメ港の カジノの 地下）の すごろく盤
//
// ・すごろく券（コインか 小さなメダルで 買う）で 1回 あそべる。大きな すごろくほど 券を たくさん 使う
// ・自分の こまが さいころで 進む。さいころを ふれる 回数（rolls）が なくなると おわり
// ・宝の地図の クリア数の 段（data/casino-tier.js）ごとに、すごろくそのものが 豪華に なる（景品だけでは ない）
//     段0「はじまりのすごろく」… まっすぐ 20マス。かんたんな マスだけ
//     段1「砂ばくのすごろく」… 30マスあまり。分かれ道・戦いの マス・宝箱の マス
//     段2「空のすごろく」… ワープ・スイッチで 道が かわる・とくべつな さいころ（2こ ふる・数を 選ぶ）
//     段3「黄金のすごろく」… 50マスあまり。スロットの マス・ボスの マス・宝部屋・お店の マス
//     段4「伝説のすごろく」… いちばん 大きい。段3までの しかけ 全部と、星のかけら・竜の背・時の砂・金のさいころ。ゴールは ★5
//   上の 段に なっても、下の 段の すごろくも 選べる
// ・さいころ・マスの できごとの 乱数は ぜんぶ サーバー（world/sugoroku.js）。ここは 盤の 形と きまりだけ
// ・第50回 D2: マスを 8しゅるい ふやした（ボーナスチャンス・ルーレット・宝探し・すごろく商人・魔物のおみやげ・家族のおうえん・
//   落とし穴→地下の道・はしご）。種（seed_〜・星の木の実・黄金の木の実）は もう すごろくでは 手に入らない（かわりに
//   すごろくだけの 装備・進化の石・めずらしい 素材・コイン・すごろく券）。すごろくだけの 装備は data/items-sugoroku-r50.js にも
//
// 盤の かき方（lanes）: いちばん はじめの 道（from なし）は at の マスから。分かれ道は from の マスの となりから
//   dirs … R 右・L 左・D 下・U 上 に 1マスずつ / sq … マスの しゅるい（下の SQ の 文字。1文字 1マス）
//   to … その 道の さいごの マスから つながる マス（合流）/ マスの 名前は「道の id ＋ ばんごう」（'a12'）
//   params … マスごとの 中み（ワープ先 to・進む／もどる 数 n・スイッチで かわる 分かれ道 gate など）

// ───────────── マスの しゅるい ─────────────
export const SQ = {
  O: { t: 'start', name: 'スタート' },
  Z: { t: 'goal', name: 'ゴール' },
  '.': { t: 'none', name: 'ひと休み' },
  G: { t: 'gold', name: 'ゴールド' },
  I: { t: 'item', name: '道具' },
  H: { t: 'inn', name: '宿屋' },
  T: { t: 'trap', name: 'わな' },
  F: { t: 'fwd', name: '前へ' },
  B: { t: 'back', name: '後ろへ' },
  W: { t: 'warp', name: 'ワープ' },
  '?': { t: 'event', name: '？？？' },
  X: { t: 'battle', name: '戦い' },
  C: { t: 'chest', name: '宝箱' },
  S: { t: 'switch', name: 'スイッチ' },
  D: { t: 'dice', name: 'さいころ' },
  L: { t: 'slot', name: 'スロット' },
  K: { t: 'boss', name: 'ボス' },
  V: { t: 'vault', name: '宝部屋' },
  M: { t: 'shop', name: 'お店' },
  '*': { t: 'star', name: '星のかけら' },
  R: { t: 'dragon', name: '竜の背' },
  P: { t: 'sand', name: '時の砂' },
  // 第50回 D2
  '+': { t: 'bonus', name: 'ボーナスチャンス' },
  U: { t: 'wheel', name: 'ルーレット' },
  Q: { t: 'hunt', name: '宝探し' },
  N: { t: 'merchant', name: 'すごろく商人' },
  Y: { t: 'gift', name: '魔物のおみやげ' },
  A: { t: 'cheer', name: '家族のおうえん' },
  J: { t: 'hole', name: '落とし穴' },
  E: { t: 'ladder', name: 'はしご' },
};
export const SQ_TYPES = Object.values(SQ).map((s) => s.t);
export const SQ_NAME = Object.fromEntries(Object.values(SQ).map((s) => [s.t, s.name]));
// ふむと こまが うごく マス（うごいた 先では つづけて うごかない＝ワープの くりかえしに ならない）
//   はしご（地下の 道の さいご）は 前へ・ワープで 来ても のぼる（行き止まりなので）
export const MOVE_TYPES = ['fwd', 'back', 'warp', 'dragon', 'hole', 'ladder'];
// 止まる マス（とおりすぎない）: ボス（まだ たおしていない）・ゴール・はしご（その先に 道が ない）
// 星のかけらは とおるだけで 拾える

// 段ごとに はじめて 出る しかけ（テストと 遊び方の 説明で 使う）
export const TIER_FEATURES = [
  ['start', 'goal', 'none', 'gold', 'item', 'inn', 'trap', 'fwd', 'back', 'event', 'bonus', 'gift', 'cheer'],
  ['battle', 'chest', 'branch', 'wheel', 'hunt'],
  ['warp', 'switch', 'dice', 'merchant'],
  ['slot', 'boss', 'vault', 'shop', 'hole', 'ladder'],
  ['star', 'dragon', 'sand', 'goldDice'],
];

// ルーレットの マス（第50回 D2）: 8つの わく。t … 盤の 下の 文 / g … ルーレットの 絵の 文字 / w … 出やすさ
export const WHEEL = [
  { k: 'gold', t: 'ゴールド', g: 'G', w: 3 },
  { k: 'item', t: '道具', g: '道具', w: 2.5 },
  { k: 'fwd', t: '3マス進む', g: '→3', w: 2 },
  { k: 'roll', t: 'さいころ+1', g: '+1', w: 1.6 },
  { k: 'coins', t: 'コイン', g: 'コイン', w: 2 },
  { k: 'chest', t: '宝箱', g: '宝', w: 1.5 },
  { k: 'back', t: '2マスもどる', g: '←2', w: 1.2 },
  { k: 'jackpot', t: '大当たり', g: '★', w: 0.5 },
];
// 応援・ルーレットの コイン（段ごと）
export const SG_COINS = [20, 50, 100, 200, 400];
// すごろく商人は ぜんぶ 半がく
export const SALE_RATE = 0.5;
// 種は すごろくでは 手に入らない（第50回 D2。テストで しらべる）
export const NO_SEED = ['seed_str', 'seed_def', 'seed_agi', 'seed_mag', 'seed_hp', 'seed_mp', 'seed_heal', 'star_nut', 'gold_nut'];

// さいころ（normal 1〜6・double 2こ ふる・pick 1〜6 から 選ぶ・gold 1〜12 から 選ぶ）
export const DICE = {
  normal: { name: 'ふつうのさいころ' },
  double: { name: '2こふるさいころ', desc: 'さいころを2こふって、たした数だけ進む' },
  pick: { name: '数を選ぶさいころ', desc: '1〜6の好きな数だけ進める' },
  gold: { name: '金のさいころ', desc: '1〜12の好きな数だけ進める' },
};
export const DICE_MAX = 9; // 1しゅるい 持てる 数

// すごろく券（data/items-casino-r37.js の sugoroku_ticket）
export const TICKET_ITEM = 'sugoroku_ticket';
export const TICKET_COINS = 100; // 1まいの ねだん（コイン）
export const MEDAL_TICKETS = 2; // 小さなメダル 1まいで もらえる 券
export const TICKET_BUY_MAX = 20;
// すごろく場の マップ（maps/casino.js。カジノの 地下）
export const SUGOROKU_MAP = 'sugoroku_hall';

// ───────────── 盤 ─────────────
// lv … 戦いの 魔物の 強さの 下かぎり（自分の レベルが 高いと それに 合わせる。world/sugoroku.js）
// gold … ゴールドの マスの 金がく / items・chest … 道具・宝箱の 中み（[id, おもさ]）
// battles … 戦いの マスの 魔物の 組（[[id, 数], …]）/ bosses … ボスの マス（param の boss）
// goal … ゴールの ごほうび（gold・pool から 1つ・first … はじめて ゴールした ときだけ・stars … 星を ぜんぶ 集めた ときの おまけ）
// 第50回 D2: gifts … 魔物のおみやげ / sale … すごろく商人の 品（もとの ねだん。半がくで 売る）/ vault … 宝部屋の 大当たり（装備で ない とき）
//   goal.coins … ゴールの コイン / goal.extra … ゴールの おまけ（毎回 1つ）/ goal.firstBonus … はじめての ゴールの おまけ（[id, 数]）
//   lanes の under … 地下の 道（落とし穴から 落ちる。はしごで 地上へ もどる）
export const BOARDS_SRC = [
  {
    id: 'b0', tier: 0, name: 'はじまりのすごろく', theme: 'grass', tickets: 1, rolls: 7, lv: 1,
    desc: 'まっすぐな20マス。初めての人にぴったり。ボーナスチャンスや魔物のおみやげもある。',
    lanes: [{ id: 'a', at: [0, 0], dirs: 'RRRRDDLLLLDDRRRRDDL', sq: 'OGI+?GTIHFGAIBGYTI?Z' }],
    params: { a9: { n: 2 }, a13: { n: 2 } },
    gold: [30, 80],
    items: [['herb', 5], ['antidote', 2], ['magic_water', 2], ['holy_water', 2], ['revive_flower', 1], ['jou_herb', 1.5], ['iron_shard', 1.5], ['magic_powder', 1]],
    gifts: [['herb', 2], ['jou_herb', 2], ['iron_shard', 2], ['beast_fang', 2], ['pretty_shell', 1.5], ['magic_water', 1], ['silver_shard', 0.5]],
    giftMons: ['pururin', 'frog', 'wolf'],
    traps: ['hurt', 'rest', 'pit'],
    events: ['gold', 'item', 'rollUp', 'rollDown', 'heal', 'hurt', 'fwd', 'back', 'coins', 'nothing'],
    goal: {
      gold: 300, coins: 30,
      pool: [['sg_koma_hat', 1], ['sg_dice_dagger', 1], ['sg_start_vest', 1], ['revive_flower', 1], ['magic_water', 1], ['silver_shard', 0.8]],
      extra: [['jou_herb', 1], ['magic_water', 1], ['iron_shard', 1]],
      first: 'lucky_dice', firstBonus: [['sugoroku_ticket', 1], ['revive_flower', 1]],
    },
  },
  {
    id: 'b1', tier: 1, name: '砂ばくのすごろく', theme: 'desert', tickets: 1, rolls: 9, lv: 26,
    desc: '30マスあまりの砂ばく。分かれ道・戦い・宝箱・ルーレット・宝探しのマスがある。',
    lanes: [
      { id: 'a', at: [0, 0], dirs: 'RRRRRRDDLLLLLLDDRRRRRRDDLLLLLL', sq: 'OGI?+CTUIXHGYFIXQTC?AXIHBGC?XGZ' },
      // 魔物の 近道（戦いの マス 1つで 6マス 近い）
      { id: 'b', from: 'a3', dirs: 'D', sq: 'X', to: 'a11' },
      // 宝の 近道（戦い・宝箱・戦い）
      { id: 'c', from: 'a19', dirs: 'DRR', sq: 'XCX', to: 'a25' },
    ],
    params: { a13: { n: 3 }, a24: { n: 3 } },
    gold: [120, 300],
    items: [['jou_herb', 4], ['magic_water', 3], ['moon_drop', 2], ['revive_flower', 2], ['silver_shard', 1.5], ['iron_shard', 1.5], ['pretty_shell', 1], ['sugoroku_ticket', 0.3]],
    chest: [['elf_drink', 1.5], ['revive_flower', 2], ['moon_drop', 2], ['silver_shard', 2], ['dragon_scale', 1], ['sugoroku_ticket', 1], ['fire_stone', 0.5], ['water_stone', 0.5],
      ['oasis_ring', 0.4], ['desert_wind_claw', 0.4], ['sg_dune_axe', 0.3], ['sg_sandglass_shield', 0.3], ['sg_scarab_charm', 0.3]],
    gifts: [['silver_shard', 2], ['dragon_scale', 1], ['flame_stone', 1.5], ['moon_drop', 1.5], ['jou_herb', 2], ['fire_stone', 0.3]],
    giftMons: ['sand_slime', 'dry_frog', 'sand_crab'],
    traps: ['hurt', 'rest', 'pit', 'poison'],
    events: ['gold', 'item', 'rollUp', 'rollDown', 'heal', 'hurt', 'fwd', 'back', 'coins', 'battle', 'nothing'],
    battles: [
      [['sand_slime', 3]], [['scorpion_soldier', 1], ['sand_vulture', 2]], [['dry_frog', 2], ['toge_saboten', 1]], [['mummy_soldier', 2]], [['sand_crab', 1], ['sand_slime', 1]],
    ],
    battleGold: 400, bg: 'desert',
    goal: {
      gold: 1200, coins: 60,
      pool: [['oasis_ring', 1.5], ['desert_wind_claw', 1.5], ['sg_dune_axe', 1.5], ['sg_sandglass_shield', 1.5], ['sg_scarab_charm', 1.5], ['fire_stone', 1], ['water_stone', 1]],
      extra: [['elf_drink', 1], ['dragon_scale', 1], ['silver_shard', 1]],
      first: 'sand_turban', firstBonus: [['sugoroku_ticket', 2], ['thunder_stone', 1]],
    },
  },
  {
    id: 'b2', tier: 2, name: '空のすごろく', theme: 'sky', tickets: 2, rolls: 12, lv: 34,
    desc: '雲の上のすごろく。ワープの雲・スイッチで変わる道・とくべつなさいころ・すごろく商人。',
    lanes: [
      { id: 'a', at: [0, 0], dirs: 'RRRRRRRDDLLLLLLLDDRRRRRRRDDLLLLLLLDDRRRRRRR', sq: 'OGI?SDUCXWYHI?QTXFGC?ADXNGIH+XCW?TBDSXIGWC?Z' },
      // 雲の より道（1マス 遠い かわりに 宝箱）
      { id: 'e', from: 'a2', dirs: 'DRR', sq: 'C?G', to: 'a4' },
      // スイッチを おすと 開く 道（はじめは しまっている）
      { id: 'g', from: 'a13', dirs: 'D', sq: 'G', to: 'a21' },
      // スイッチを おすと しまる 道（はじめは 開いている）
      { id: 'h', from: 'a24', dirs: 'D', sq: '?', to: 'a28' },
    ],
    params: {
      a9: { to: 'a25' }, a31: { to: 'a39' }, a40: { to: 'a29' },
      a13: { gate: 1 }, a24: { gate: 0 }, a17: { n: 3 }, a34: { n: 3 },
    },
    gold: [250, 600],
    items: [['toku_herb', 3], ['moon_drop', 3], ['hoshi_konpeito', 2], ['revive_flower', 2], ['cloud_cotton', 2], ['wind_feather', 1.5], ['sugoroku_ticket', 0.4]],
    chest: [['elf_drink', 2], ['hoshi_konpeito', 2], ['revive_flower', 1.5], ['cloud_cotton', 2], ['dragon_scale', 1.5], ['sugoroku_ticket', 1.2], ['thunder_stone', 0.6], ['water_stone', 0.6],
      ['sky_robe', 0.3], ['wind_cutter', 0.3], ['sky_dice_staff', 0.3], ['sg_rainbow_fan', 0.3], ['sg_cloud_shield', 0.3], ['sg_thunder_band', 0.3]],
    gifts: [['cloud_cotton', 2], ['wind_feather', 2], ['hoshi_konpeito', 1], ['dragon_scale', 1], ['thunder_stone', 0.3]],
    giftMons: ['cloud_sheep', 'thunder_puff', 'pegasus'],
    sale: [['elf_drink', 1500], ['hoshi_konpeito', 840], ['revive_flower', 1000], ['sugoroku_ticket', 3000], ['thunder_stone', 6000], ['water_stone', 6000], ['sg_cloud_shield', 30000], ['sky_robe', 36000]],
    traps: ['hurt', 'rest', 'pit', 'poison', 'thief'],
    events: ['gold', 'item', 'rollUp', 'rollDown', 'heal', 'hurt', 'fwd', 'back', 'coins', 'battle', 'dice', 'warp', 'nothing'],
    battles: [
      [['pegasus', 1], ['storm_bird', 2]], [['cloud_sheep', 3]], [['sky_ray', 1], ['thunder_puff', 2]], [['comet_bird', 1], ['fairy_dragon', 1]], [['sky_serpent', 1], ['cloud_sheep', 1]],
    ],
    battleGold: 900, bg: 'kumoi',
    dice: ['double', 'pick'],
    goal: {
      gold: 2500, coins: 120,
      pool: [['sky_dice_staff', 1], ['wind_cutter', 1], ['sky_robe', 1], ['sg_rainbow_fan', 1], ['sg_cloud_shield', 1], ['sg_thunder_band', 1], ['thunder_stone', 0.6], ['moon_stone', 0.6]],
      extra: [['elf_drink', 1], ['cloud_cotton', 1], ['dragon_scale', 1], ['hoshi_konpeito', 1]],
      first: 'cloud_boots', firstBonus: [['sugoroku_ticket', 2], ['moon_stone', 1]],
    },
  },
  {
    id: 'b3', tier: 3, name: '黄金のすごろく', theme: 'gold', tickets: 2, rolls: 15, lv: 40,
    desc: '金色の大きなすごろく。スロット・ボス・宝部屋・お店・落とし穴の下の地下の道がある。',
    lanes: [
      { id: 'a', at: [0, 0], dirs: 'RRRRRRRRDDLLLLLLLLDDRRRRRRRRDDLLLLLLLLDDRRRRRRRRDDLLLL', sq: 'OGISXCL+?DHUXIFTCW?YXJQC?GXMHAI?DXLNWCTHKBCX?MILXUC?GXZ' },
      // 宝部屋への 道
      { id: 'r', from: 'a13', dirs: 'D', sq: 'V', to: 'a25' },
      // スイッチで 開く 近道
      { id: 'q', from: 'a46', dirs: 'D', sq: 'G', to: 'a52' },
      // 地下の 道（a21 の 落とし穴から。はしごで a31 へ）
      { id: 'u', at: [0, 12], under: true, dirs: 'RRRRR', sq: 'GCXGCE' },
    ],
    params: {
      a17: { to: 'a23' }, a36: { to: 'a28' }, a46: { gate: 1 }, a40: { boss: 0 }, a14: { n: 3 }, a41: { n: 2 },
      a21: { to: 'u0' }, u5: { to: 'a31' },
    },
    gold: [500, 1200],
    items: [['toku_herb', 3], ['elf_drink', 3], ['panacea', 2], ['sd_phoenix', 1], ['silver_shard', 1.5], ['dragon_scale', 1.5], ['star_sand', 1], ['sugoroku_ticket', 0.5]],
    chest: [['elf_drink', 2], ['sd_phoenix', 1.5], ['sugoroku_ticket', 1.2], ['star_iron', 0.6], ['dragon_scale', 2], ['star_sand', 1.5], ['fire_stone', 0.5], ['thunder_stone', 0.5], ['moon_stone', 0.5],
      ['golden_whip', 0.25], ['midas_axe', 0.25], ['golden_gi', 0.25], ['sg_jackpot_bat', 0.25], ['sg_golden_robe', 0.25], ['sg_lucky_cat', 0.2]],
    gifts: [['star_sand', 2], ['dragon_scale', 2], ['silver_shard', 2], ['elf_drink', 1], ['star_iron', 0.3]],
    giftMons: ['gold_beetle', 'kirakira', 'lamp_genie'],
    traps: ['hurt', 'rest', 'pit', 'poison', 'thief'],
    events: ['gold', 'item', 'rollUp', 'rollDown', 'heal', 'hurt', 'fwd', 'back', 'coins', 'battle', 'dice', 'warp', 'ticket', 'nothing'],
    battles: [
      [['gold_golem', 1], ['gold_beetle', 2]], [['lamp_genie', 1], ['mimic', 1]], [['hoseki_game', 2], ['kirakira', 1]], [['gold_beetle', 3]], [['silver_king', 1], ['gold_golem', 1]],
    ],
    battleGold: 1600, bg: 'sd_gold',
    bosses: [{ group: [['tm_golem', 1]], pow: 1.1, lv: 3, gold: 6000, name: '黄金のゴーレム', bg: 'sd_gold' }],
    dice: ['double', 'pick'],
    shop: [['elf_drink', 1500], ['sd_phoenix', 2000], ['sugoroku_ticket', 3000], ['star_iron', 8000], ['fire_stone', 6000], ['moon_stone', 6000], ['gambler_hat', 45000], ['sg_lucky_cat', 60000]],
    sale: [['elf_drink', 1500], ['sd_phoenix', 2000], ['sugoroku_ticket', 3000], ['star_iron', 8000], ['thunder_stone', 6000], ['water_stone', 6000], ['gambler_hat', 45000], ['sg_golden_robe', 60000]],
    vault: [['star_iron', 2], ['moon_stone', 1], ['sugoroku_ticket', 1]],
    slot: { coins: 300 },
    goal: {
      gold: 5000, coins: 250,
      pool: [['midas_axe', 1], ['golden_whip', 1], ['golden_gi', 1], ['gambler_hat', 1], ['sg_jackpot_bat', 1], ['sg_golden_robe', 1], ['sg_lucky_cat', 1]],
      extra: [['sd_phoenix', 1], ['star_iron', 0.6], ['elf_drink', 1], ['dragon_scale', 1]],
      first: 'gold_dice', firstBonus: [['sugoroku_ticket', 3], ['star_iron', 1]],
    },
  },
  {
    id: 'b4', tier: 4, name: '伝説のすごろく', theme: 'legend', tickets: 3, rolls: 19, lv: 46,
    desc: 'いちばん大きな伝説のすごろく。2ひきのボス・星のかけら・竜の背・時の砂・金のさいころ。ゴールの景品は★5。',
    lanes: [
      { id: 'a', at: [0, 0], dirs: 'RRRRRRRRRDDLLLLLLLLLDDRRRRRRRRRDDLLLLLLLLLDDRRRRRRRRRDDLLLLLLLLLDDRRRR', sq: 'OGI?DC+*XLUHM?PYXICTGW?XQCINS*XLHKAC?IXJMWTD*XGRC?LGIXHGC?X+PMXCYHK?*CZ' },
      // 魔物の 近道（星のかけらを 1つ 通らない）
      { id: 'b', from: 'a5', dirs: 'D', sq: 'X', to: 'a15' },
      // 宝部屋への 道
      { id: 'v', from: 'a17', dirs: 'D', sq: 'V', to: 'a25' },
      // スイッチで 開く 近道（星のかけらを 1つ 通らない）
      { id: 'g', from: 'a37', dirs: 'D', sq: 'G', to: 'a49' },
      // スイッチで しまる 近道
      { id: 'h', from: 'a52', dirs: 'D', sq: '?', to: 'a56' },
      // 星のかけらの より道
      { id: 's', from: 'a57', dirs: 'DLLL', sq: '*GIC', to: 'a60' },
      // 地下の 道（a39 の 落とし穴から。はしごで a49 へ）
      { id: 'u', at: [0, 14], under: true, dirs: 'RRRRRR', sq: 'GCXG?CE' },
    ],
    params: {
      a21: { to: 'a27' }, a41: { to: 'a34' }, a37: { gate: 1 }, a52: { gate: 0 },
      a33: { boss: 0 }, a66: { boss: 1 }, a47: { to: ['a51', 'a56', 'a60'] },
      a39: { to: 'u0' }, u6: { to: 'a49' },
    },
    gold: [700, 1600],
    items: [['elf_drink', 3], ['sd_phoenix', 2], ['sd_heal_bell', 2], ['panacea', 2], ['star_sand', 1.5], ['dragon_scale', 1.5], ['star_iron', 0.4], ['sugoroku_ticket', 0.6]],
    chest: [['sd_phoenix', 1.5], ['sd_heal_bell', 1.5], ['sugoroku_ticket', 1.5], ['star_iron', 1.2], ['p6_time_sand', 1], ['moon_stone', 0.5], ['fire_stone', 0.5], ['water_stone', 0.5], ['thunder_stone', 0.5],
      ['heaven_dice_sword', 0.12], ['star_road_mail', 0.12], ['goal_flag_spear', 0.12], ['lucky_star_staff', 0.12], ['rainbow_dice_shield', 0.12],
      ['sg_dragon_dice_claw', 0.12], ['sg_comet_boomerang', 0.12], ['sg_legend_cape', 0.12]],
    gifts: [['star_iron', 1], ['p6_time_sand', 1.5], ['star_sand', 2], ['dragon_scale', 2], ['sd_phoenix', 1]],
    giftMons: ['fairy_dragon', 'star_wyvern', 'comet_bird'],
    traps: ['hurt', 'rest', 'pit', 'poison', 'thief'],
    events: ['gold', 'item', 'rollUp', 'rollDown', 'heal', 'hurt', 'fwd', 'back', 'coins', 'battle', 'dice', 'warp', 'ticket', 'sand', 'nothing'],
    battles: [
      [['great_dragon', 1], ['fairy_dragon', 1]], [['phoenix', 1], ['star_wyvern', 1]], [['thunder_dragon', 1], ['frost_drake', 1]], [['bone_dragon', 2], ['star_wyvern', 1]], [['cloud_wyvern', 1], ['comet_bird', 2]],
    ],
    battleGold: 2500, bg: 'sd_star',
    bosses: [
      { group: [['tm_king', 1]], pow: 1.15, lv: 3, gold: 8000, name: '宝石のキングぷるりん', bg: 'sd_gold' },
      { group: [['tm_dragon', 1]], pow: 1.35, lv: 5, gold: 15000, name: '炎の竜ガルドラ', bg: 'sd_crimson' },
    ],
    dice: ['double', 'pick', 'gold'],
    shop: [['star_iron', 6000], ['sd_phoenix', 1800], ['sd_heal_bell', 1500], ['sugoroku_ticket', 2500], ['moon_stone', 5000], ['seven_ring', 90000], ['fortune_cape', 95000], ['sg_legend_cape', 80000]],
    sale: [['star_iron', 6000], ['sd_phoenix', 1800], ['sd_heal_bell', 1500], ['sugoroku_ticket', 2500], ['fire_stone', 5000], ['seven_ring', 90000], ['sg_comet_boomerang', 80000]],
    vault: [['star_iron', 2], ['p6_time_sand', 1], ['sugoroku_ticket', 1]],
    slot: { coins: 600 },
    goal: {
      gold: 10000, coins: 400,
      pool: [['heaven_dice_sword', 1], ['star_road_mail', 1], ['goal_flag_spear', 1], ['lucky_star_staff', 1], ['rainbow_dice_shield', 1],
        ['sg_dragon_dice_claw', 1], ['sg_comet_boomerang', 1], ['sg_legend_cape', 1]],
      extra: [['sd_phoenix', 1], ['star_iron', 1], ['sd_heal_bell', 1]],
      first: 'sugoroku_crown', firstBonus: [['sugoroku_ticket', 5], ['star_iron', 2]],
      stars: {
        pool: [['heaven_dice_sword', 1], ['star_road_mail', 1], ['goal_flag_spear', 1], ['lucky_star_staff', 1], ['rainbow_dice_shield', 1],
          ['sg_dragon_dice_claw', 1], ['sg_comet_boomerang', 1], ['sg_legend_cape', 1]],
        extra: 'star_iron',
      },
    },
  },
];

// ───────────── 盤を くみたてる ─────────────
const DX = { R: 1, L: -1, D: 0, U: 0 };
const DY = { R: 0, L: 0, D: 1, U: -1 };

export function buildBoard(src) {
  const sq = [];
  const byKey = {};
  const err = (m) => { throw new Error(`${src.id}: ${m}`); };
  const place = (key, ch, x, y, under = false) => {
    const def = SQ[ch];
    if (!def) err(`unknown square ${ch} (${key})`);
    const s = { i: sq.length, key, t: def.t, x, y, next: [], ...(under ? { under: true } : {}) };
    sq.push(s);
    byKey[key] = s.i;
    return s;
  };
  for (const lane of src.lanes) {
    const dirs = [...lane.dirs], chars = [...lane.sq];
    let x, y, prev = null, k = 0;
    if (lane.from) {
      prev = sq[byKey[lane.from]];
      if (!prev) err(`lane ${lane.id}: no from ${lane.from}`);
      ({ x, y } = prev);
      if (chars.length !== dirs.length) err(`lane ${lane.id}: squares ${chars.length} vs dirs ${dirs.length}`);
    } else {
      [x, y] = lane.at;
      if (chars.length !== dirs.length + 1) err(`lane ${lane.id}: squares ${chars.length} vs dirs ${dirs.length}`);
      prev = place(`${lane.id}0`, chars[0], x, y, lane.under);
      k = 1;
    }
    let n = 0;
    for (const d of dirs) {
      if (DX[d] === undefined) err(`${lane.id}: 向き ${d}`);
      x += DX[d];
      y += DY[d];
      const cur = place(`${lane.id}${lane.from ? n : n + 1}`, chars[k++], x, y, lane.under || prev.under);
      prev.next.push(cur.i);
      prev = cur;
      n++;
    }
    if (lane.to) {
      const t = byKey[lane.to];
      if (t === undefined) err(`lane ${lane.id}: no to ${lane.to}`);
      prev.next.push(t);
    }
  }
  // マスの 中み
  for (const [key, p] of Object.entries(src.params || {})) {
    const s = sq[byKey[key]];
    if (!s) err(`params: no square ${key}`);
    if (p.n !== undefined) s.n = p.n;
    if (p.gate !== undefined) s.gate = p.gate;
    if (p.boss !== undefined) s.boss = p.boss;
    if (p.to !== undefined) s.to = Array.isArray(p.to) ? p.to.map((k2) => byKey[k2]) : byKey[p.to];
  }
  for (const s of sq) {
    if ((s.t === 'fwd' || s.t === 'back') && !s.n) s.n = 3;
  }
  const start = sq.findIndex((s) => s.t === 'start');
  const goalAt = sq.findIndex((s) => s.t === 'goal');
  const xs = sq.map((s) => s.x), ys = sq.map((s) => s.y);
  const stars = sq.filter((s) => s.t === 'star').map((s) => s.i);
  return {
    ...src, sq, byKey, start, goalAt, stars,
    w: Math.max(...xs) + 1, h: Math.max(...ys) + 1,
  };
}

export const BOARDS = BOARDS_SRC.map(buildBoard);
export const BOARD_BY_ID = Object.fromEntries(BOARDS.map((b) => [b.id, b]));

// その マスから 進める 先（スイッチで かわる 分かれ道は 1つだけ）
//   gate: 1 … スイッチを おすと（sw=1）分かれ道へ / gate: 0 … スイッチを おすと まっすぐへ
export function nextOptions(board, i, sw = 0) {
  const s = board.sq[i];
  if (!s || !s.next.length) return [];
  if (s.gate !== undefined && s.next.length > 1) {
    const open = (s.gate === 1) === !!sw;
    return [s.next[open ? 1 : 0]];
  }
  return s.next.slice();
}

// マスの 説明（盤の したの 文。client と テストで 使う）
export function squareText(board, s) {
  switch (s.t) {
    case 'start': return 'スタート。ここから出発！';
    case 'goal': return 'ゴール！大きな景品がもらえる。';
    case 'none': return 'ひと休みのマス。何もおこらない。';
    case 'gold': return 'ゴールドがもらえる。';
    case 'item': return '道具がもらえる。';
    case 'inn': return '宿屋のマス。みんなのHPとMPが回復する。';
    case 'trap': return 'わなのマス。何がおこるかな…？';
    case 'fwd': return `前へ${s.n}マス進む。`;
    case 'back': return `後ろへ${s.n}マスもどる。`;
    case 'warp': return `ワープのマス。遠くのマスへとぶ。`;
    case 'event': return '何がおこるかは、止まった時のおたのしみ！';
    case 'battle': return '魔物と戦う。勝つとゴールドがもらえる。負けるとすごろくは終わり。';
    case 'chest': return '宝箱のマス。よい品が入っている。';
    case 'switch': return 'スイッチのマス。止まると、道が切りかわる。';
    case 'dice': return 'とくべつなさいころがもらえる。';
    case 'slot': return 'スロットのマス。そろうとごほうび！';
    case 'boss': return `ボスのマス（${board.bosses?.[s.boss]?.name || 'ボス'}）。ここで止まり、戦う。勝つと大きなごほうび。`;
    case 'vault': return '宝部屋。3つの宝箱から1つ選べる。';
    case 'shop': return 'お店のマス。めずらしい品をゴールドで買える。';
    case 'star': return '星のかけら。通るだけで拾える。全部集めてゴールすると、おまけの景品！';
    case 'dragon': return '竜の背。竜に乗って、選んだマスまでひとっとび！';
    case 'sand': return '時の砂。さいころをふれる回数が2回ふえる。';
    case 'bonus': return 'ボーナスチャンス！もう1回さいころをふれて、次に止まったマスのごほうびが2倍になる。';
    case 'wheel': return 'ルーレットのマス。回して、止まったわくのごほうび！';
    case 'hunt': return '宝探しのマス。3つの宝箱から1つ選ぶ。からっぽの箱もあるかも…？';
    case 'merchant': return 'すごろく商人のマス。めずらしい品が、なんと半額！';
    case 'gift': return '魔物のおみやげのマス。仲よしの魔物が、何かくれる。';
    case 'cheer': return '家族のおうえんのマス。家族の声がとどいて、いいことがある！';
    case 'hole': return '落とし穴のマス。止まると、地下の道へ落ちる。地下には宝がいっぱい！';
    case 'ladder': return 'はしごのマス。ここで止まり、地上へのぼる。';
    default: return '';
  }
}

// その キャラが 選べる 盤（段まで）
export const boardsFor = (tier) => BOARDS.filter((b) => b.tier <= tier);

// ───────────── わな・できごとの 文 ─────────────
export const TRAP_TEXT = {
  hurt: 'わなだ！とげが飛び出した！\nみんなは少しダメージを受けた。',
  rest: 'わなだ！足がすべって、さいころを1つ落としてしまった…\n（さいころをふれる回数が1回へった）',
  pit: 'わなだ！落とし穴に落ちた！\n3マスもどされた…',
  poison: 'わなだ！毒のきりがふき出した！\nみんなは毒にかかった。',
  thief: 'わなだ！どろぼうがあらわれて、ゴールドをぬすんでいった…',
};

// サーバーと クライアントで つかう だいほんの しくみ（world/sugoroku.js が うめる）
export const SG_HOOKS = {};
