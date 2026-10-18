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
};
export const SQ_TYPES = Object.values(SQ).map((s) => s.t);
export const SQ_NAME = Object.fromEntries(Object.values(SQ).map((s) => [s.t, s.name]));
// ふむと こまが うごく マス（うごいた 先では つづけて うごかない＝ワープの くりかえしに ならない）
export const MOVE_TYPES = ['fwd', 'back', 'warp', 'dragon'];
// 止まる マス（とおりすぎない）: ボス（まだ たおしていない）・ゴール
// 星のかけらは とおるだけで 拾える

// 段ごとに はじめて 出る しかけ（テストと 遊び方の 説明で 使う）
export const TIER_FEATURES = [
  ['start', 'goal', 'none', 'gold', 'item', 'inn', 'trap', 'fwd', 'back', 'event'],
  ['battle', 'chest', 'branch'],
  ['warp', 'switch', 'dice'],
  ['slot', 'boss', 'vault', 'shop'],
  ['star', 'dragon', 'sand', 'goldDice'],
];

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
export const BOARDS_SRC = [
  {
    id: 'b0', tier: 0, name: 'はじまりのすごろく', theme: 'grass', tickets: 1, rolls: 7, lv: 1,
    desc: 'まっすぐな20マス。初めての人にぴったり。',
    lanes: [{ id: 'a', at: [0, 0], dirs: 'RRRRDDLLLLDDRRRRDDL', sq: 'OGI.?GTIHFG?IBG.TI?Z' }],
    params: { a9: { n: 2 }, a13: { n: 2 } },
    gold: [30, 80],
    items: [['herb', 5], ['antidote', 2], ['magic_water', 3], ['holy_water', 2], ['revive_flower', 1], ['seed_hp', 0.6], ['seed_str', 0.4], ['seed_agi', 0.4]],
    traps: ['hurt', 'rest', 'pit'],
    events: ['gold', 'item', 'rollUp', 'rollDown', 'heal', 'hurt', 'fwd', 'back', 'coins', 'nothing'],
    goal: { gold: 300, pool: [['seed_str', 1], ['seed_def', 1], ['seed_agi', 1], ['seed_mag', 1], ['seed_hp', 1]], first: 'lucky_dice' },
  },
  {
    id: 'b1', tier: 1, name: '砂ばくのすごろく', theme: 'desert', tickets: 1, rolls: 9, lv: 26,
    desc: '30マスあまりの砂ばく。分かれ道・戦い・宝箱のマスがある。',
    lanes: [
      { id: 'a', at: [0, 0], dirs: 'RRRRRRDDLLLLLLDDRRRRRRDDLLLLLL', sq: 'OGI?GCTGIXHG?FIXGTC?GXIHBGC?XGZ' },
      // 魔物の 近道（戦いの マス 1つで 6マス 近い）
      { id: 'b', from: 'a3', dirs: 'D', sq: 'X', to: 'a11' },
      // 宝の 近道（戦い・宝箱・戦い）
      { id: 'c', from: 'a19', dirs: 'DRR', sq: 'XCX', to: 'a25' },
    ],
    params: { a13: { n: 3 }, a24: { n: 3 } },
    gold: [120, 300],
    items: [['jou_herb', 4], ['magic_water', 3], ['moon_drop', 2], ['revive_flower', 2], ['seed_hp', 1], ['seed_str', 0.7], ['seed_agi', 0.7], ['seed_def', 0.7], ['seed_mag', 0.7]],
    chest: [['seed_str', 2], ['seed_agi', 2], ['seed_def', 2], ['seed_mag', 2], ['seed_hp', 2], ['seed_mp', 1.5], ['seed_heal', 1.5], ['elf_drink', 1], ['oasis_ring', 0.4], ['desert_wind_claw', 0.4]],
    traps: ['hurt', 'rest', 'pit', 'poison'],
    events: ['gold', 'item', 'rollUp', 'rollDown', 'heal', 'hurt', 'fwd', 'back', 'coins', 'battle', 'nothing'],
    battles: [
      [['sand_slime', 3]], [['scorpion_soldier', 1], ['sand_vulture', 2]], [['dry_frog', 2], ['toge_saboten', 1]], [['mummy_soldier', 2]], [['sand_crab', 1], ['sand_slime', 1]],
    ],
    battleGold: 400, bg: 'desert',
    goal: { gold: 1200, pool: [['seed_mp', 2], ['seed_heal', 2], ['star_nut', 1], ['oasis_ring', 1.5], ['desert_wind_claw', 1.5]], first: 'sand_turban' },
  },
  {
    id: 'b2', tier: 2, name: '空のすごろく', theme: 'sky', tickets: 2, rolls: 12, lv: 34,
    desc: '雲の上のすごろく。ワープの雲・スイッチで変わる道・とくべつなさいころ。',
    lanes: [
      { id: 'a', at: [0, 0], dirs: 'RRRRRRRDDLLLLLLLDDRRRRRRRDDLLLLLLLDDRRRRRRR', sq: 'OGI?SDGCXWGHI?GTXFGC?GDX.GIHGXCW?TBDSXIGWC?Z' },
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
    items: [['toku_herb', 3], ['moon_drop', 3], ['hoshi_konpeito', 2], ['revive_flower', 2], ['seed_hp', 1], ['seed_mp', 0.8], ['seed_str', 0.6], ['seed_agi', 0.6], ['seed_def', 0.6], ['seed_mag', 0.6]],
    chest: [['seed_mp', 2], ['seed_heal', 2], ['star_nut', 1.2], ['elf_drink', 2], ['seed_hp', 2], ['sky_robe', 0.3], ['wind_cutter', 0.3], ['sky_dice_staff', 0.3]],
    traps: ['hurt', 'rest', 'pit', 'poison', 'thief'],
    events: ['gold', 'item', 'rollUp', 'rollDown', 'heal', 'hurt', 'fwd', 'back', 'coins', 'battle', 'dice', 'warp', 'nothing'],
    battles: [
      [['pegasus', 1], ['storm_bird', 2]], [['cloud_sheep', 3]], [['sky_ray', 1], ['thunder_puff', 2]], [['comet_bird', 1], ['fairy_dragon', 1]], [['sky_serpent', 1], ['cloud_sheep', 1]],
    ],
    battleGold: 900, bg: 'kumoi',
    dice: ['double', 'pick'],
    goal: { gold: 2500, pool: [['sky_dice_staff', 1], ['wind_cutter', 1], ['sky_robe', 1], ['star_nut', 1]], first: 'cloud_boots' },
  },
  {
    id: 'b3', tier: 3, name: '黄金のすごろく', theme: 'gold', tickets: 2, rolls: 15, lv: 40,
    desc: '金色の大きなすごろく。スロット・ボス・宝部屋・お店のマスがある。',
    lanes: [
      { id: 'a', at: [0, 0], dirs: 'RRRRRRRRDDLLLLLLLLDDRRRRRRRRDDLLLLLLLLDDRRRRRRRRDDLLLL', sq: 'OGISXCLG?DHGXIFTCW?GXIGC?GXMHGI?DXLGWCTHKBCX?MILXGC?GXZ' },
      // 宝部屋への 道
      { id: 'r', from: 'a13', dirs: 'D', sq: 'V', to: 'a25' },
      // スイッチで 開く 近道
      { id: 'q', from: 'a46', dirs: 'D', sq: 'G', to: 'a52' },
    ],
    params: {
      a17: { to: 'a23' }, a36: { to: 'a28' }, a46: { gate: 1 }, a40: { boss: 0 }, a14: { n: 3 }, a41: { n: 2 },
    },
    gold: [500, 1200],
    items: [['toku_herb', 3], ['elf_drink', 3], ['panacea', 2], ['sd_phoenix', 1], ['seed_hp', 1], ['seed_mp', 1], ['seed_heal', 0.8], ['seed_str', 0.8], ['seed_agi', 0.8], ['star_nut', 0.4]],
    chest: [['star_nut', 2], ['seed_mp', 1.5], ['seed_heal', 1.5], ['elf_drink', 2], ['sd_phoenix', 1.5], ['sugoroku_ticket', 1], ['gold_nut', 0.3], ['golden_whip', 0.25], ['midas_axe', 0.25], ['golden_gi', 0.25]],
    traps: ['hurt', 'rest', 'pit', 'poison', 'thief'],
    events: ['gold', 'item', 'rollUp', 'rollDown', 'heal', 'hurt', 'fwd', 'back', 'coins', 'battle', 'dice', 'warp', 'ticket', 'nothing'],
    battles: [
      [['gold_golem', 1], ['gold_beetle', 2]], [['lamp_genie', 1], ['mimic', 1]], [['hoseki_game', 2], ['kirakira', 1]], [['gold_beetle', 3]], [['silver_king', 1], ['gold_golem', 1]],
    ],
    battleGold: 1600, bg: 'sd_gold',
    bosses: [{ group: [['tm_golem', 1]], pow: 1.1, lv: 3, gold: 6000, name: '黄金のゴーレム', bg: 'sd_gold' }],
    dice: ['double', 'pick'],
    shop: [['star_nut', 9000], ['elf_drink', 1500], ['sd_phoenix', 2000], ['sugoroku_ticket', 3000], ['gold_nut', 30000], ['gambler_hat', 45000], ['seed_mp', 3000], ['seed_heal', 3000]],
    slot: { coins: 300 },
    goal: { gold: 5000, pool: [['midas_axe', 1], ['golden_whip', 1], ['golden_gi', 1], ['gambler_hat', 1], ['gold_nut', 1]], first: 'gold_dice' },
  },
  {
    id: 'b4', tier: 4, name: '伝説のすごろく', theme: 'legend', tickets: 3, rolls: 19, lv: 46,
    desc: 'いちばん大きな伝説のすごろく。2ひきのボス・星のかけら・竜の背・時の砂・金のさいころ。ゴールの景品は★5。',
    lanes: [
      { id: 'a', at: [0, 0], dirs: 'RRRRRRRRRDDLLLLLLLLLDDRRRRRRRRRDDLLLLLLLLLDDRRRRRRRRRDDLLLLLLLLLDDRRRR', sq: 'OGI?DCG*XLGHM?PGXICTGW?XGCIGS*XLHKGC?IXGMWTD*XGRC?LGIXHGC?XGPMXCGHK?*CZ' },
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
    ],
    params: {
      a21: { to: 'a27' }, a41: { to: 'a34' }, a37: { gate: 1 }, a52: { gate: 0 },
      a33: { boss: 0 }, a66: { boss: 1 }, a47: { to: ['a51', 'a56', 'a60'] },
    },
    gold: [700, 1600],
    items: [['elf_drink', 3], ['sd_phoenix', 2], ['sd_heal_bell', 2], ['panacea', 2], ['star_nut', 0.8], ['seed_mp', 1], ['seed_heal', 1], ['seed_hp', 1]],
    chest: [['star_nut', 2.5], ['gold_nut', 0.8], ['sd_phoenix', 1.5], ['sugoroku_ticket', 1.5], ['seed_mp', 1], ['seed_heal', 1],
      ['heaven_dice_sword', 0.12], ['star_road_mail', 0.12], ['goal_flag_spear', 0.12], ['lucky_star_staff', 0.12], ['rainbow_dice_shield', 0.12]],
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
    shop: [['gold_nut', 25000], ['star_nut', 7000], ['sd_phoenix', 1800], ['sd_heal_bell', 1500], ['sugoroku_ticket', 2500], ['seven_ring', 90000], ['fortune_cape', 95000]],
    slot: { coins: 600 },
    goal: {
      gold: 10000, pool: [['heaven_dice_sword', 1], ['star_road_mail', 1], ['goal_flag_spear', 1], ['lucky_star_staff', 1], ['rainbow_dice_shield', 1]], first: 'sugoroku_crown',
      stars: { pool: [['heaven_dice_sword', 1], ['star_road_mail', 1], ['goal_flag_spear', 1], ['lucky_star_staff', 1], ['rainbow_dice_shield', 1]], extra: 'gold_nut' },
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
  const place = (key, ch, x, y) => {
    const def = SQ[ch];
    if (!def) err(`unknown square ${ch} (${key})`);
    const s = { i: sq.length, key, t: def.t, x, y, next: [] };
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
      prev = place(`${lane.id}0`, chars[0], x, y);
      k = 1;
    }
    let n = 0;
    for (const d of dirs) {
      if (DX[d] === undefined) err(`${lane.id}: 向き ${d}`);
      x += DX[d];
      y += DY[d];
      const cur = place(`${lane.id}${lane.from ? n : n + 1}`, chars[k++], x, y);
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
