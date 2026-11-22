// 第3部 第1章 第2幕「鉱山の底の先」の 魔物と、幕の ボス「デデドン大王」（B: 戦い。docs/plan-part3.md の 10-3）
// monsters.js（MONSTERS）・loot.js（MAT_DROPS）が まぜる。ここは ほかの データを import しない（じゅんかんを さける）
// え は client/render/c9b-art.js。ボスの しかけは shared/battle-c9b.js（battle-c9a.js から よぶ）
//
// 出現表（encounters-c9b.js）: t9b_shaft＝たてあな（Lv98）・t9b_light＝大地の下（明るい 所 Lv98〜99。暗い 所の 大ミミズも）・t9b_hall＝大王の やしき（Lv99）
// ふつうの 魔物 6しゅ（どれも 仲間に なる。region: 6）
//   大地の下 3しゅ … 今 いる 魔物の 色ちがい（c9b-art.js）: すいしょうのカニ（星座ガニ）・光るキノコ（ねむりキノコ）・どうくつコウモリ（つららコウモリ）
//   くらやみの大ミミズ … 新しい 絵。darkOnly（A班の フィールドで 暗い マスだけを 歩く）。
//     戦いでは「見えにくい」（c9b.hide … こちらの 物理の 攻撃が 外れやすい）。スピカの「てらす」で 消える（battle-c9b.js）
//   もぐら兵（やり）・もぐら兵（なべ）… 新しい 絵（1つの かき方の 2つの すがた）。大王の 手下。にくめない
//
// ・幕の ボス「デデドン大王」（c9b_dededon。Lv100）… battle-c9b.js
//   しくみ「ごちそうを 先に 取り上げる」: テーブルの 皿 3つ（c9b_dish_meat・c9b_dish_cake・c9b_dish_soup。べつの 的・HP 少なめ）
//   watch 回 動く ごとに 1つの 皿を じっと 見る（前ぶれ）→ 次の 番で 食べる（にく … 攻撃が 強く なる・ケーキ … HPを 大きく 回復・からいスープ … 次の 番に 全体へ 炎）
//   食べる 前に 皿を こわすと 食べられず 1回 しょんぼり 休む。こわした（食べた）皿は back 回 動くと 手下が 新しい 皿を 持って くる
//   HPが 半分を 切ると 広間の 明かりを 食べて まっ暗（見て いる 皿が 出なく なる。スピカの「てらす」で 3回の 番の 間 見える）
//   大づちの 大ジャンプ（jump 回 動く ごとに 前ぶれ → 次の 番に 全体へ 大きな ダメージ。身を 守ると へる）
//   食料庫の はこ（c9_box1〜3）1つに つき はじめの 皿が 1つ へる（late 回 動くと 持って くる）
//   勝つと たおれずに、おなかを 鳴らして すわりこむ（え の コマ 2・3）
// ・ボスの え は 今までの ボスの 2倍の こまかさ（size は 2倍・artScale: 0.5。docs/plan-ch7.md の 4-4）
// ・もとの 作品の 絵・名前・せりふは 使わない（大きな もぐらの 王さま・赤い マント・木の 大づち・小さな かんむり）

const BOSS_STATUS = { sleep: 0, poison: 0.3, confuse: 0, blind: 0.3, silence: 0.2, paralyze: 0 };
const PART_RESIST = { sleep: 0, poison: 0, confuse: 0, blind: 0, silence: 0, paralyze: 0 };
export const C9B_DEDEDON = 'c9b_dededon';
export const C9B_DISHES = { meat: 'c9b_dish_meat', cake: 'c9b_dish_cake', soup: 'c9b_dish_soup' };
export const C9B_DISH_IDS = Object.values(C9B_DISHES);
export const C9B_MIMIZU = 'c9b_mimizu';
export const C9B_BOSSES = [C9B_DEDEDON];
export const DEDEDON_NAME = 'デデドン大王';
// 第3部 第1章 第2幕の ふつうの 魔物（仲間に なる 6しゅ）
export const C9B_UNDER_MON = ['c9b_crab', 'c9b_kinoko', 'c9b_bat'];
export const C9B_HALL_MON = ['c9b_mole_spear', 'c9b_mole_pot'];
export const C9B_MINIONS = [...C9B_UNDER_MON, C9B_MIMIZU, ...C9B_HALL_MON];
// 色ちがいの もと（今 いる 魔物の 絵）
export const C9B_RECOLOR_BASE = { c9b_crab: 'crab_star', c9b_kinoko: 'nemuri', c9b_bat: 'ice_bat' };

export const MONSTERS_C9B = {
  // ── 大地の下（明るい 所 Lv98〜99）──
  // すいしょうのカニ: こうらに すいしょうが 生えた カニ（星座ガニの 色ちがい）
  c9b_crab: {
    name: 'すいしょうのカニ', lv: 98, hp: 3020, mp: 120, str: 392, def: 420, agi: 150, mag: 220, exp: 6000, gold: 1980,
    race: 'beast', size: 'l', hit: 'claw', region: 6,
    resist: { bolt: 1.35, ice: 0.7, fire: 0.9, wind: 1.0, light: 1.0, dark: 1.0, poison: 0.4, sleep: 0.4, confuse: 0.5 }, drops: { common: ['jou_herb', 10], rare: ['c7i_snow_shield', 80] },
    actions: [{ w: 3, id: 'm9u_cr_pinch' }, { w: 2, id: 'm9u_cr_bubble', cond: 'notRecent:m9u_cr_bubble' }, { w: 1, id: 'm9u_cr_shell', cond: 'notRecent:m9u_cr_shell' }, { w: 1, id: 'attack' }],
    desc: 'こうらに、すきとおったすいしょうが生えたカニ。とてもかたい。雷がよく効く。',
  },
  // 光るキノコ: 大地の下で ぼうっと 光る キノコ（ねむりキノコの 色ちがい）
  c9b_kinoko: {
    name: '光るキノコ', lv: 98, hp: 2960, mp: 220, str: 360, def: 340, agi: 230, mag: 330, exp: 6020, gold: 1990,
    race: 'plant', size: 'm', hit: 'claw', region: 6,
    resist: { fire: 1.35, ice: 0.9, wind: 1.0, bolt: 1.0, light: 0.8, dark: 1.0, poison: 0.3, sleep: 0, confuse: 0.4 }, drops: { common: ['moon_drop', 18], rare: ['c7i_snow_hat', 80] },
    actions: [{ w: 3, id: 'm9u_kn_bonk' }, { w: 2, id: 'm9u_kn_spore', cond: 'notRecent:m9u_kn_spore' }, { w: 1, id: 'm9u_kn_glow', cond: 'hpBelow:0.6' }, { w: 1, id: 'attack' }],
    desc: '大地の下で、ぼうっと光るキノコ。暗い道の、目じるしになる。炎がよく効く。',
  },
  // どうくつコウモリ: 大地の下の 空を とぶ 大きな コウモリ（つららコウモリの 色ちがい）
  c9b_bat: {
    name: 'どうくつコウモリ', lv: 99, hp: 2820, mp: 160, str: 400, def: 300, agi: 360, mag: 220, exp: 6100, gold: 2010,
    race: 'beast', size: 'm', flying: true, hit: 'bite', region: 6,
    resist: { light: 1.35, dark: 0.7, fire: 1.0, ice: 1.0, wind: 1.1, bolt: 1.0, poison: 0.4, sleep: 0.4, confuse: 0.3 }, drops: { common: ['antidote', 14], rare: ['c7i_snow_boomerang', 80] },
    actions: [{ w: 3, id: 'm9u_bt_fang' }, { w: 2, id: 'm9u_bt_wave', cond: 'notRecent:m9u_bt_wave' }, { w: 1, id: 'm9u_bt_dive' }, { w: 1, id: 'attack' }],
    desc: '大地の下の、暗い空をとぶ大きなコウモリ。音で、まわりを見ている。光がよく効く。',
  },

  // ── 大地の下の 暗い 所（Lv100）──
  // くらやみの大ミミズ: 暗い マスだけを 歩く（darkOnly）。戦いでは「見えにくい」（hide … こちらの 物理の 攻撃が 外れやすく なる わりあい）
  [C9B_MIMIZU]: {
    name: 'くらやみの大ミミズ', lv: 100, hp: 4800, mp: 180, str: 420, def: 340, agi: 210, mag: 260, exp: 6400, gold: 2100,
    race: 'beast', size: 'l', hit: 'bite', region: 6, darkOnly: true, c9b: { hide: 0.35 },
    resist: { light: 1.4, dark: 0.5, fire: 1.0, ice: 1.0, wind: 1.0, bolt: 1.0, poison: 0.3, sleep: 0.4, confuse: 0.4 }, drops: { common: ['elf_drink', 30], rare: ['c7i_snow_mail', 80] },
    actions: [{ w: 3, id: 'm9u_mz_wrap' }, { w: 2, id: 'm9u_mz_dust', cond: 'notRecent:m9u_mz_dust' }, { w: 1, id: 'm9u_mz_dig', cond: 'notRecent:m9u_mz_dig' }, { w: 1, id: 'attack' }],
    desc: '暗いところにだけいる、とても長いミミズ。暗やみにまぎれて、見えにくい。光がよく効く。',
  },

  // ── 大王の やしき（Lv99。大王の 手下。にくめない）──
  c9b_mole_spear: {
    name: 'もぐら兵（やり）', lv: 99, hp: 3040, mp: 140, str: 410, def: 360, agi: 260, mag: 200, exp: 6150, gold: 2030,
    race: 'beast', size: 'm', hit: 'claw', region: 6,
    resist: { fire: 1.0, ice: 1.0, wind: 1.25, bolt: 1.0, light: 1.2, dark: 0.9, poison: 0.4, sleep: 0.4, confuse: 0.4 }, drops: { common: ['toku_herb', 10], rare: ['c7i_snow_spear', 80] },
    actions: [{ w: 3, id: 'm9u_ms_poke' }, { w: 2, id: 'm9u_ms_line', cond: 'notRecent:m9u_ms_line' }, { w: 1, id: 'm9u_ms_ehhen', cond: 'notRecent:m9u_ms_ehhen' }, { w: 1, id: 'attack' }],
    desc: '大王さまの手下の、もぐらの兵隊。やりを持って、いばって歩く。本当は、こわがり。',
  },
  c9b_mole_pot: {
    name: 'もぐら兵（なべ）', lv: 99, hp: 3200, mp: 160, str: 380, def: 420, agi: 200, mag: 260, exp: 6200, gold: 2050,
    race: 'beast', size: 'm', hit: 'claw', region: 6,
    resist: { fire: 0.8, ice: 1.0, wind: 1.25, bolt: 1.0, light: 1.2, dark: 0.9, poison: 0.4, sleep: 0.4, confuse: 0.4 }, drops: { common: ['magic_water', 12], rare: ['c7i_snow_helm', 80] },
    actions: [{ w: 3, id: 'm9u_mp_ladle' }, { w: 2, id: 'm9u_mp_soup', cond: 'notRecent:m9u_mp_soup' }, { w: 1, id: 'm9u_mp_lid', cond: 'notRecent:m9u_mp_lid' }, { w: 1, id: 'attack' }],
    desc: 'なべをかぶった、もぐらの兵隊。大王さまのごちそうを作る係。おたまでたたいてくる。',
  },

  // ── 幕の ボス: デデドン大王（ごちそうの 間。Lv100）──
  // c9b … しかけ（battle-c9b.js の king）
  //   watch … 皿を じっと 見るまでの 行動 / back … こわされた（食べた）皿が もどるまでの 行動 / late … はこで へった 皿が 来るまでの 行動 /
  //   jump … 大ジャンプまでの 行動 / jumpMult … 大ジャンプの 強さ / guardCut … 身を 守った 人の 大ジャンプの ばい（身を 守る 半分と かける）/
  //   meat … にくで 強く なる ばい（max 回まで）/ cake … ケーキの 回復（最大HPの わりあい）/ soup … からいスープの 炎 / lit … てらすで 見える 番
  [C9B_DEDEDON]: {
    name: DEDEDON_NAME, short: '大王', lv: 100, hp: 77000, mp: 9999, str: 1800, def: 340, agi: 240, mag: 960, exp: 116000, gold: 39000,
    race: 'beast', size: 'xl', boss: true, turns: 1, speed: 1.0, hit: 'claw', artScale: 0.5,
    drops: { boss: ['c9bb_king_bib'], bonus: ['limit_stone'], rare: ['c9bb_king_mallet', 1] },
    resist: { ...BOSS_STATUS, wind: 1.2, light: 1.1, dark: 0.8, fire: 0.9, ice: 1.0, bolt: 1.0 },
    c9b: {
      kind: 'king', watch: 3, back: 3, late: 6, jump: 5, jumpMult: 1.7, guardCut: 0.5,
      meat: { up: 1.5, max: 4 }, cake: 0.35, soup: [600, 640], lit: 3,
      // 人数（家族の キャラの 数）で 合わせる [1人, 2人, 3人, 4人, 5人]: dish … 皿の HP の ばい / watch … 皿を 見るまでの 行動 /
      //   wait … 皿を 見てから 食べるまでに ふつうに 動く 回数（人が 少ない ときは こわす 間が 長い）/ jump … 大ジャンプまでの 行動 /
      //   hp・atk … 大王の HP・攻撃力の ばい（酒場・魔物の 仲間は しくみを あまり 使わない ので、人が 少ない ときは 弱く）
      //   solo … 仲間なしの ひとり（戦う 人が 1人だけ）の とき。few より 先に 見る
      //   第101回 R1班: 人 1人ずつ べつの 手の 物さし（docs/plan-sim-vs-real.md）で 3人め〜5人めを 合わせ直した
      //     （1人めと 2人めは もとの まま … 2人めは 1人＋魔物3 も 使う。魔物の 仲間は 半人ぶん）
      //     前: dish [0.45, 0.6, 0.9, 1, 1.25]・watch [5, 4, 3, 3, 3]・wait [3, 3, 3, 3, 2]・jump [7, 6, 5, 5, 4]・hp [0.55, 0.5, 0.92, 1, 1.12]・atk [0.9, 1.2, 0.96, 1, 1.04]
      //   bare … 仲間なしの 2人・3人（[2人, 3人]。few より 先。battle-c9a.js の pickPeople）
      //   第101回 R1班 2便: ずっと 待つ 形（b.tellAll）で 時間が のびた ので HP を 下げ・攻撃を 上げ・大ジャンプを 多く（知らない 人が 75% に なった）。
      //     前（1便）: jump [7, 6, 5, 5, 5]・hp [0.55, 0.5, 0.7, 0.9, 0.85]・atk [0.9, 1.2, 1, 0.85, 1]・bare hp [0.35, 0.7]・atk [0.8, 0.85]・jump [7, 6]
      few: { dish: [0.45, 0.6, 0.9, 0.8, 0.9], watch: [5, 4, 3, 2, 2], wait: [3, 3, 3, 3, 3], jump: [7, 6, 4, 4, 4], hp: [0.55, 0.5, 0.45, 0.4, 0.35], atk: [0.9, 1.2, 1.5, 1.9, 2.15] },
      bare: { hp: [0.25, 0.38], atk: [1.1, 1.2], watch: [4, 3], wait: [3, 3], jump: [7, 5], dish: [0.5, 0.7] },
      solo: { hp: 0.12, atk: 0.45, dish: 0.25, watch: 3, jump: 8, wait: 2 },
      // 魔物の 仲間 1体ごとの 大王の HP・攻撃力の 上げ（人数は 魔物の 仲間を 半人ぶんに 数えた うえで）
      monK: { hp: 0, atk: 0 },
    },
    actions: [{ w: 3, id: 'm9k_mallet' }, { w: 2, id: 'm9k_belly' }, { w: 1, id: 'm9k_ehhen', cond: 'notRecent:m9k_ehhen' }, { w: 1, id: 'm9k_spin', cond: 'notRecent:m9k_spin' }],
    desc: '大地の下の、大きなもぐらの王さま。赤いマントに、小さなかんむり。明かりとごちそうを、ひとりじめしている。',
  },
};

// ボスの しかけの 部ひん（図鑑・配合には 出ない。monsters.js が addC9bHidden で まぜる）
const dish = (name, desc, extra = {}) => ({
  name, lv: 100, hp: 3200, mp: 0, str: 0, def: 260, agi: 1, mag: 0, exp: 0, gold: 0,
  race: 'material', size: 'm', speed: 0.00001, hit: 'claw', noBefriend: true,
  resist: { ...PART_RESIST, fire: 1.0, ice: 1.0, wind: 1.0, bolt: 1.0, light: 1.0, dark: 1.0 },
  drops: {}, actions: [{ w: 1, id: 'm9k_dish' }], desc, ...extra,
});
export const C9B_HIDDEN = {
  [C9B_DISHES.meat]: dish('にくの皿', '大王のごちそう。食べられると、大王の攻撃が強くなる。', { c9b: { dish: 'meat' } }),
  [C9B_DISHES.cake]: dish('ケーキの皿', '大王のごちそう。食べられると、大王のHPが大きく回復する。', { c9b: { dish: 'cake' } }),
  [C9B_DISHES.soup]: dish('からいスープの皿', '大王のごちそう。食べられると、次に炎をはかれる。', { c9b: { dish: 'soup' } }),
};
export const DISH_NAME = { meat: 'にく', cake: 'ケーキ', soup: 'からいスープ' };

// monsters.js が よぶ。何回 よんでも おなじ
export function addC9bHidden(table) {
  for (const [id, m] of Object.entries(C9B_HIDDEN)) {
    if (Object.prototype.hasOwnProperty.call(table, id)) continue;
    Object.defineProperty(table, id, { value: { ...m }, enumerable: false, configurable: true, writable: true });
  }
}

// 素材の ドロップ（loot.js の MAT_DROPS に まぜる。今の 素材だけ）
export const C9B_MAT_DROPS = {
  c9b_crab: ['silver_shard', 3],
  c9b_kinoko: ['magic_powder', 3],
  c9b_bat: ['beast_fang', 3],
  [C9B_MIMIZU]: ['land_shard', 3],
  c9b_mole_spear: ['land_shard', 3],
  c9b_mole_pot: ['star_sand', 3],
};
