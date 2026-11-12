// 第2部 第8章 第4幕「時のはざま」（Step 7・8）の 魔物と、門番 4つの すがた・心の ためし・さいごの ボス（B: 戦い。docs/plan-ch8.md の 9）
// monsters.js（MONSTERS）・loot.js（MAT_DROPS）が まぜる。ここは ほかの データを import しない（じゅんかんを さける）
// え は client/render/c8r-art.js。ボスの しかけは shared/battle-c8r.js（battle-c8c.js から よぶ）
//
// 出現表（encounters-c8r.js）: t8r_wing＝4つの つばさ（Lv89〜91）・t8r_last＝最後の 回廊（Lv92〜94）
// 手下の 魔物 5しゅ（どれも 仲間に なる）。今まで 行った 場所の 魔物の「時の かげ」と、時のはざまに すむ 魔物
//   今の 絵の 色がえ 2しゅ: 時のたましい（せいれい F。よみの 海底神殿の 青火のたましいの 時の かげ。むらさき）・
//     時かげスカラベ（ゾンビ E。月の王宮の 月のスカラベの 時の かげ。すなの 色）
//   新しい 絵 3しゅ: 時くいガ（せいれい D。とけいの 文字ばんの はねの ガ）・チクタクワニ（ドラゴン C。おなかの 中で とけいが チクタク 鳴る ワニ）・
//     すなどけいの騎士（ゾンビ A。すなどけいの 体の、中が からっぽの よろい）
//   ランクは 出やすさ（encounters-c8r.js の 重み）と 仲間に なりやすさ（companions-c8r.js の rate）で きまる（tools/gen-monster-ranks.mjs）
//   region: 6 … ふつうの 魔物が まれに 落とす「空の レア装備」の 地方（第6章〜第8章と おなじ）
//
// ・時の門番フリーゾン（フリーザが もと。「見くだす心」。ていねいな ことばで 上から 話す）… battle-c8r.js の gate
//   c8_gate1（第1形態。広間の 1回目）: HP が leaveAt より へるか、leaveActs 回 動くと「ほう、少しは やるようですね」と 去る（とちゅうで 終わる 戦い）
//   c8_gate2（第2形態。広間の 2回目）: HP が leaveAt より へると 去る。「見くだしの かまえ」の おためし（かまえ・れんけいで くずす）
//   c8_gatekeeper（第3形態 → 最終形態。Step 7 の さいご。Lv92）: 本当の 戦い。
//     見くだしの かまえ … ばらばらの 攻撃は 指 1本で 受け流す（ダメージ stance.cut ばい）。れんけい（ちがう 仲間が つづけて 当てる）が
//       stance.need に とどくか、合体技が 当たると かまえが くずれる（stance.open 回 動く 間 ダメージ stance.weak ばい）
//     時の大玉 … orb.every 回 動く たびに 大玉を ためる（前ぶれ）→ 次の 番に はなつ（みんなに 大技。身を 守ると 半分）。
//       はなつ 時に かまえが くずれて いると、大玉は 消える
//     HP が finalAt より へると 最終形態（え は コマ 2・3。速く・強く・大玉が orbEvery に）。その とき リオンが「弱くても、ひとりじゃない」（れんけいが 1つ 少なくて よい）
// ・心の ためし（つばさの さいご）
//   c8_trial_guard（月のつばさ・カリム「守りぬく」）: やみの風（c8_trial_wind。たおせない）が winActs 回 ふくまで、ともしびを 守りきる
//     ふきけし小おに（c8_trial_puff）が ともしびを ねらう（たおすと、また 来る）。やみの風の「大風」は 前ぶれ → ともしびへ（身を 守る 人が いると 半分）
//   c8_trial_duel（氷のつばさ・リオン「一騎うち」）: リオン ひとりが 見くだす影（c8_trial_shadow）と 1対1。家族は「おうえん」
// ・ソリトゥスの 本当の すがた（c8_solitus。Lv95。3だん。この 章だけの オリジナルの 絵）… battle-c8r.js の solitus
//   ① くらい心（よくばり・いかり・ひとりじめ・見くだす）を かわるがわる まとう。HP が 心の さかいに なると 心が ゆらぐ → 「よびかける」で はがれる。
//      はがれるたびに 心の 持ち主（ジャハール・ハデロス・クッパード・フリーゾン）が 取りかえしに 来て、1回だけ 手を かす
//   ② ひとりぼっちの 星（ひとりに する・ひとりの 人が いる 間は かたい）③ 千年の約束（合体技で しめる）
// ・ボスの え は 今までの ボスの 2倍の こまかさ（size は 2倍・artScale: 0.5。docs/plan-ch7.md の 4-4）

const BOSS_STATUS = { sleep: 0, poison: 0.3, confuse: 0, blind: 0.3, silence: 0.2, paralyze: 0 };
const PART_RESIST = { sleep: 0, poison: 0, confuse: 0, blind: 0, silence: 0, paralyze: 0 };
export const C8_GATE1 = 'c8_gate1';
export const C8_GATE2 = 'c8_gate2';
export const C8_GATEKEEPER = 'c8_gatekeeper';
export const C8_TRIAL_GUARD = 'c8_trial_guard';
export const C8_TRIAL_DUEL = 'c8_trial_duel';
export const C8_SOLITUS = 'c8_solitus';
// 心の ためしの 敵（かくれた 魔物。図鑑・配合に 出ない）
export const C8_WIND = 'c8_trial_wind';
export const C8_PUFF = 'c8_trial_puff';
export const C8_SHADOW = 'c8_trial_shadow';
export const C8R_BOSSES = [C8_GATE1, C8_GATE2, C8_GATEKEEPER, C8_SOLITUS];
// 第8章 第4幕の 手下の 魔物（仲間に なる 5しゅ）
export const C8R_MINIONS = ['toki_soul', 'kage_scarab', 'toki_moth', 'chikutaku_wani', 'sand_knight'];
export const GATE_NAME = '時の門番フリーゾン';
export const FINAL_NAME = 'さいごのすがたのフリーゾン';
// 最終形態の 行動（へんしんすると 入れかわる）
export const GATE_FINAL_ACTIONS = [
  { w: 3, id: 'm8g_beam' }, { w: 2, id: 'm8g_fbarrage', cond: 'notRecent:m8g_fbarrage' }, { w: 2, id: 'm8g_tail' }, { w: 1, id: 'm8g_glare', cond: 'notRecent:m8g_glare' },
];
// ソリトゥスの くらい心（まとう じゅん）と、心ごとの 行動（その 心の 持ち主の 技が まじる）
export const HEARTS = ['greed', 'anger', 'hoard', 'scorn'];
export const HEART_ACTIONS = {
  greed: [{ w: 3, id: 'm8s_greed' }, { w: 2, id: 'm8s_dark' }, { w: 1, id: 'attack' }],
  anger: [{ w: 3, id: 'm8s_anger' }, { w: 2, id: 'm8s_dark' }, { w: 1, id: 'attack' }],
  hoard: [{ w: 3, id: 'm8s_hoard' }, { w: 2, id: 'm8s_dark' }, { w: 1, id: 'attack' }],
  scorn: [{ w: 3, id: 'm8s_scorn' }, { w: 2, id: 'm8s_dark' }, { w: 1, id: 'attack' }],
};
export const STAR_ACTIONS = [{ w: 3, id: 'm8s_comet' }, { w: 2, id: 'm8s_dark' }, { w: 1, id: 'attack' }];
export const PROMISE_ACTIONS = [{ w: 3, id: 'm8s_dark' }, { w: 2, id: 'm8s_comet' }, { w: 1, id: 'attack' }];

export const MONSTERS_C8R = {
  // ── 4つの つばさ（Lv89〜91）──
  // 時のたましい: 時のはざまを ただよう、むらさきの たましい（よみの 海底神殿の 青火のたましいの 時の かげ。色がえ）
  toki_soul: {
    name: '時のたましい', lv: 89, hp: 2300, mp: 320, str: 250, def: 236, agi: 252, mag: 420, exp: 4800, gold: 1600,
    race: 'spirit', size: 'm', flying: true, hit: 'claw', region: 6, art: 'blue_soul', tint: { hueTo: 280, sat: 0.9, light: 1.05 },
    resist: { light: 1.35, dark: 0.4, fire: 0.8, ice: 1.0, wind: 1.0, bolt: 1.0, poison: 0, sleep: 0.3, confuse: 0.3 }, drops: { common: ['magic_water', 12], rare: ['c7i_snow_hat', 80] },
    actions: [{ w: 3, id: 'm8n_ts_flame' }, { w: 2, id: 'm8n_ts_slow', cond: 'notRecent:m8n_ts_slow' }, { w: 1, id: 'm8n_ts_drain' }, { w: 1, id: 'attack' }],
    desc: '時のはざまをただよう、むらさきのたましい。むかし見た青い火に、にている。光がよく効く。',
  },
  // 時かげスカラベ: 時の すなを まとった スカラベの かげ（月の王宮の 月のスカラベの 時の かげ。色がえ）
  kage_scarab: {
    name: '時かげスカラベ', lv: 89, hp: 2360, mp: 220, str: 312, def: 300, agi: 230, mag: 260, exp: 4840, gold: 1610,
    race: 'undead', size: 'm', flying: true, hit: 'bite', region: 6, art: 'gold_beetle', artScale: 1.1, tint: { hueTo: 38, sat: 0.4, light: 0.82 },
    resist: { light: 1.35, fire: 1.1, dark: 0.6, ice: 1.0, wind: 1.0, bolt: 1.0, poison: 0, sleep: 0.4, confuse: 0.4 }, drops: { common: ['toku_herb', 10], rare: ['c7i_snow_boomerang', 80] },
    actions: [{ w: 3, id: 'm8n_ks_bite' }, { w: 2, id: 'm8n_ks_sand', cond: 'notRecent:m8n_ks_sand' }, { w: 1, id: 'm8n_ks_rewind', cond: 'notRecent:m8n_ks_rewind' }, { w: 1, id: 'attack' }],
    desc: '時のすなをまとった、スカラベのかげ。すなをまいて、時間をまきもどそうとする。光がよく効く。',
  },
  // 時くいガ: とけいの 文字ばんの もようの はねの 大きな ガ。時間を かじる
  toki_moth: {
    name: '時くいガ', lv: 90, hp: 2280, mp: 300, str: 270, def: 250, agi: 280, mag: 400, exp: 4900, gold: 1630,
    race: 'spirit', size: 'm', flying: true, hit: 'claw', region: 6,
    resist: { fire: 1.35, wind: 0.8, ice: 1.0, bolt: 1.0, light: 1.0, dark: 0.8, poison: 0.3, sleep: 0.4, confuse: 0.4 }, drops: { common: ['moon_drop', 18], rare: ['c7i_snow_shield', 80] },
    actions: [{ w: 3, id: 'm8n_tm_powder' }, { w: 2, id: 'm8n_tm_bite', cond: 'notRecent:m8n_tm_bite' }, { w: 1, id: 'm8n_tm_flutter', cond: 'notRecent:m8n_tm_flutter' }, { w: 1, id: 'attack' }],
    desc: 'とけいの文字ばんのもようの、はねを持つ大きなガ。時間をかじって、ねむくする粉をまく。炎がよく効く。',
  },

  // ── 最後の 回廊（Lv92〜94）──
  // チクタクワニ: おなかの 中で とけいが チクタク 鳴っている 大きな ワニ（ピーターパンの ワニが もと）
  chikutaku_wani: {
    name: 'チクタクワニ', lv: 92, hp: 2520, mp: 120, str: 338, def: 312, agi: 200, mag: 160, exp: 5100, gold: 1700,
    race: 'dragon', size: 'm', hit: 'bite', region: 6,
    resist: { ice: 1.35, fire: 0.9, bolt: 1.0, wind: 1.0, light: 1.0, dark: 1.0, poison: 0.4, sleep: 0.5, confuse: 0.5 }, drops: { common: ['holy_water', 12], rare: ['c7i_snow_mail', 80] },
    actions: [{ w: 3, id: 'm8n_cw_chomp' }, { w: 2, id: 'm8n_cw_tick', cond: 'notRecent:m8n_cw_tick' }, { w: 1, id: 'm8n_cw_tail', cond: 'notRecent:m8n_cw_tail' }, { w: 1, id: 'attack' }],
    desc: 'おなかの中で、とけいがチクタク鳴っている大きなワニ。音がすると、もうすぐそばにいる。氷がよく効く。',
  },
  // すなどけいの騎士: すなどけいの 体の、中が からっぽの よろい。めったに 見ない
  sand_knight: {
    name: 'すなどけいの騎士', lv: 93, hp: 2600, mp: 200, str: 350, def: 340, agi: 210, mag: 240, exp: 5300, gold: 1760,
    race: 'undead', size: 'l', hit: 'slash', region: 6,
    resist: { light: 1.35, blast: 1.2, dark: 0.6, fire: 1.0, ice: 1.0, wind: 1.0, bolt: 1.0, poison: 0, sleep: 0, confuse: 0.3 }, drops: { common: ['elf_drink', 30], rare: ['c7i_snow_sword', 80] },
    actions: [{ w: 3, id: 'm8n_sk_slash' }, { w: 2, id: 'm8n_sk_sand', cond: 'notRecent:m8n_sk_sand' }, { w: 1, id: 'm8n_sk_turn', cond: 'notRecent:m8n_sk_turn' }, { w: 1, id: 'attack' }],
    desc: 'すなどけいの体をした、中がからっぽのよろい。すなが落ちきるまで、たたかいをやめない。めったに姿を見せない。光がよく効く。',
  },

  // ── 追いかけて くる 時の門番フリーゾン（広間に 3回）──
  // c8r … しかけ（battle-c8r.js の gate）
  //   form … すがた（1 第1形態・2 第2形態・3 第3形態〈→ 4 最終形態〉）/ leaveAt … この HP より へると 去る / leaveActs … この 回数 動くと 去る /
  //   stance … 見くだしの かまえ（cut … 受け流した ときの ダメージ・need … くずす れんけいの 数・open … くずれて いる 回数・weak … くずれた ときの ダメージ）/
  //   orb … 時の大玉（every … ためるまでの 行動・base … 強さ）/ finalAt … 最終形態に なる HP / final … 最終形態（atk・speed・orbEvery）/ help … かけつけ（every … 何回 動く ごと）
  [C8_GATE1]: {
    name: GATE_NAME, short: 'フリーゾン', lv: 89, hp: 64000, mp: 6000, str: 1260, def: 300, agi: 230, mag: 920, exp: 0, gold: 0,
    race: 'demon', size: 'xl', boss: true, turns: 1, speed: 1.0, hit: 'claw', artScale: 0.5,
    drops: {},
    resist: { ...BOSS_STATUS, light: 1.15, dark: 0.7, fire: 1.0, ice: 1.0, wind: 1.0, bolt: 1.0 },
    c8r: { kind: 'gate', form: 1, leaveAt: 0.6, leaveActs: 6 },
    actions: [{ w: 3, id: 'm8g_finger' }, { w: 2, id: 'm8g_tail' }, { w: 1, id: 'm8g_glare', cond: 'notRecent:m8g_glare' }, { w: 1, id: 'attack' }],
    desc: '時のはざまの門番。ていねいな言葉で、人を見くだす。小さな体で、空にうかぶ乗り物にすわっている。',
  },
  [C8_GATE2]: {
    name: GATE_NAME, short: 'フリーゾン', lv: 91, hp: 72000, mp: 6000, str: 1330, def: 310, agi: 230, mag: 940, exp: 0, gold: 0,
    race: 'demon', size: 'xl', boss: true, turns: 1, speed: 1.0, hit: 'claw', artScale: 0.5,
    drops: {},
    resist: { ...BOSS_STATUS, light: 1.15, dark: 0.7, fire: 1.0, ice: 1.0, wind: 1.0, bolt: 1.0 },
    c8r: { kind: 'gate', form: 2, leaveAt: 0.5, stance: { cut: 0.3, need: 3, open: 2, weak: 1.4 } },
    actions: [{ w: 3, id: 'm8g_finger' }, { w: 2, id: 'm8g_horn' }, { w: 2, id: 'm8g_tail' }, { w: 1, id: 'attack' }],
    desc: '時の門番フリーゾンの、2つ目のすがた。体が大きくなり、つのがのびた。ばらばらの攻撃は、指1本で受け流してしまう。',
  },
  [C8_GATEKEEPER]: {
    name: GATE_NAME, short: 'フリーゾン', lv: 92, hp: 120000, mp: 6000, str: 1600, def: 320, agi: 240, mag: 960, exp: 96000, gold: 32000,
    race: 'demon', size: 'xl', boss: true, turns: 1, speed: 1.0, hit: 'claw', artScale: 0.5,
    drops: { boss: ['c8g_gate_charm'], bonus: ['limit_stone'], rare: ['c8g_gate_whip', 1] },
    resist: { ...BOSS_STATUS, light: 1.15, dark: 0.7, fire: 1.0, ice: 1.0, wind: 1.0, bolt: 1.0 },
    c8r: {
      kind: 'gate', form: 3,
      stance: { cut: 0.25, need: 3, open: 2, weak: 1.5 },
      orb: { every: 4, base: [940, 1000] },
      finalAt: 0.5,
      final: { atk: 1.08, speed: 1.12, orbEvery: 3, need: 4 },
      help: { every: 2, who: ['karim', 'kai', 'minamo', 'rion'] },
    },
    actions: [{ w: 3, id: 'm8g_finger' }, { w: 2, id: 'm8g_horn' }, { w: 2, id: 'm8g_tail' }, { w: 1, id: 'm8g_glare', cond: 'notRecent:m8g_glare' }],
    desc: '時の門番フリーゾンの、3つ目のすがた。頭がうしろに長くのびた。弱い者を見くだす心が、いちばん強いすがた。',
  },

  // ── Step 8 の さいご: ソリトゥスの 本当の すがた（第8章 クリア・第2部 完。Lv95。3だん）──
  // c8r … しかけ（battle-c8r.js の solitus）
  //   stages … だんごとの HP（だんが かわると HP が その 数に なる）/ heartAt … 心の さかい（くらい心 4つ）/ waver … 心が ゆらぐ 回数（その 間に よびかける）/
  //   harden … 心が かたまった ときに もどる HP / big … くらい心の 大技（every・base）/ alone … ひとりに する（every・turns・cut … ひとりの 人が いる 間の ダメージ）/
  //   tear … 星の なみだ（every・base）/ crack … 時の くずれ（every・base）/ promise … 千年の約束（per … 1回 動く ごと・help … かけつけ・dmg … ダメージ・heal）/
  //   help … かけつけ（every・who）
  [C8_SOLITUS]: {
    name: 'ソリトゥス', lv: 95, hp: 60000, mp: 9999, str: 1700, def: 330, agi: 250, mag: 1000, exp: 150000, gold: 50000,
    race: 'demon', size: 'xl', boss: true, turns: 1, speed: 1.0, hit: 'claw', artScale: 0.5,
    drops: { boss: ['c8s_promise_crest'], bonus: ['limit_stone'], rare: ['c8s_star_sword', 1] },
    resist: { ...BOSS_STATUS, light: 1.2, dark: 0.5, fire: 1.0, ice: 1.0, wind: 1.0, bolt: 1.0 },
    c8r: {
      kind: 'solitus',
      stages: [60000, 62000, 150000],
      heartAt: [0.75, 0.5, 0.25, 0],
      waver: 1, harden: 0.1, hardenUp: 1.12,
      big: { every: 4, base: [600, 650] },
      alone: { every: 2, turns: 4, cut: 0.3 },
      tear: { every: 3, base: [1050, 1120], per: 0.3 },
      crack: { every: 3, base: [1050, 1120] },
      promise: { per: 5, help: 12, dmg: 0.15, heal: 0.3 },
      help: { every: 2, who: ['karim', 'kai', 'minamo', 'rion', 'nocto', 'sara', 'luca', 'baba', 'astel'] },
    },
    actions: HEART_ACTIONS.greed,
    desc: 'ずっと昔、空からおちてきた星。ひとりぼっちのさびしさが、くらい心を集めて、大きな闇になった。',
  },
};

// ボスの しかけの 部ひん（図鑑・配合には 出ない。monsters.js が addC8rHidden で まぜる）
export const C8R_HIDDEN = {
  // 月のつばさの 心の ためし: やみの風（たおせない。ふく 回数が ためしの のこり）
  [C8_WIND]: {
    name: 'やみの風', lv: 90, hp: 99999, mp: 999, str: 800, def: 9999, agi: 200, mag: 800, exp: 20000, gold: 6000,
    race: 'spirit', size: 'xl', boss: true, turns: 1, speed: 0.9, hit: 'claw', noBefriend: true,
    resist: { ...PART_RESIST, fire: 1.0, ice: 1.0, bolt: 1.0, wind: 1.0, light: 1.0, dark: 1.0 },
    c8r: { kind: 'wind', winActs: 8, gust: { every: 3 }, puffs: 2, respawn: 2, torch: { hp: 5000, def: 260 } },
    drops: {}, actions: [{ w: 1, id: 'm8t_breeze' }],
    desc: 'ともしびを消そうとする、やみの風。たおすことはできない。',
  },
  // ともしびを ねらう 小さな かげ（たおすと、また 来る）
  [C8_PUFF]: {
    name: 'ふきけし小おに', lv: 90, hp: 3400, mp: 0, str: 800, def: 240, agi: 230, mag: 0, exp: 0, gold: 0,
    race: 'spirit', size: 's', flying: true, hit: 'claw', noBefriend: true, art: 'lamp_smoke', tint: { hueTo: 260, sat: 0.5, light: 0.6 },
    resist: { ...PART_RESIST, fire: 1.0, ice: 1.0, bolt: 1.0, wind: 1.0, light: 1.3, dark: 0.5 },
    drops: {}, actions: [{ w: 1, id: 'm8t_puff' }],
    desc: 'ともしびを、ふーっとふき消そうとする小さなかげ。',
  },
  // 氷のつばさの 心の ためし: 見くだす影（リオンと 1対1。門番の え の かげ）
  [C8_SHADOW]: {
    name: '見くだす影', lv: 90, hp: 18000, mp: 999, str: 720, def: 280, agi: 220, mag: 700, exp: 20000, gold: 6000,
    race: 'demon', size: 'xl', boss: true, turns: 1, speed: 0.95, hit: 'claw', noBefriend: true, art: C8_GATE1, artScale: 0.5, tint: { hueTo: 260, sat: 0.25, light: 0.45 },
    resist: { ...BOSS_STATUS, fire: 1.0, ice: 1.0, bolt: 1.0, wind: 1.0, light: 1.2, dark: 0.6 },
    c8r: { kind: 'duel', big: { every: 3, mult: 1.9 }, courage: 3, power: 2.2 },
    drops: {}, actions: [{ w: 3, id: 'm8d_slash' }, { w: 2, id: 'm8d_mock', cond: 'notRecent:m8d_mock' }],
    desc: 'リオンの心の中の、見くだす影。「おまえなんか、ひとりでは何もできない」と言う。',
  },
};

// monsters.js が よぶ。何回 よんでも おなじ
export function addC8rHidden(table) {
  for (const [id, m] of Object.entries(C8R_HIDDEN)) {
    if (Object.prototype.hasOwnProperty.call(table, id)) continue;
    Object.defineProperty(table, id, { value: { ...m }, enumerable: false, configurable: true, writable: true });
  }
}

// 素材の ドロップ（loot.js の MAT_DROPS に まぜる。今の 素材だけ。入手先の 画面に 出る）
export const C8R_MAT_DROPS = {
  toki_soul: ['star_sand', 3],
  kage_scarab: ['land_shard', 3],
  toki_moth: ['magic_powder', 3],
  chikutaku_wani: ['iron_shard', 4],
  sand_knight: ['silver_shard', 3],
};
