// 第3部 第1章 第4幕「星のはかば」の 魔物・幕の ボス「あそびたい魔人 ムウ」（B: 戦い。docs/plan-part3-c9d.md の 12-3）
// monsters.js（MONSTERS）・loot.js（MAT_DROPS）が まぜる。ここは ほかの データを import しない（じゅんかんを さける）
// え は client/render/c9d-art.js。ボスの しかけは shared/battle-c9d.js（battle-c9b.js から よぶ）
//
// 出現表（encounters-c9d.js）: t9d_lane＝ふたごの道 1階（Lv102）・t9d_lane2＝ふたごの道 2階（Lv102〜103）
// ふつうの 魔物 5しゅ（どれも 仲間に なる。region: 6。新しい 絵は 3つ … こだまのふたご・つりばしヤギ・かげぼうしネコ）
//   ふたごの道 … こだまのふたご（新しい 絵。2ひき 1組で 出る「ふたご」）・谷わたりグモ（とけいグモの 色ちがい）・
//     星あかりのガ（こはくのガの 色ちがい ＋ きらめき）・つりばしヤギ（新しい 絵）
//   暗い 所 … かげぼうしネコ（新しい 絵。darkOnly … A班の フィールドで 暗い マスだけを 歩く。戦いでは「見えにくい」… てらすで 消える）
//
// ・幕の ボス「あそびたい魔人 ムウ」（c9d_mu。Lv104）… battle-c9d.js の しくみ「ふたり 同時に」
//   はじめは 1体。HPが split（4分の3）を 切ると「ひとりあそびは、つまらないなあ」→ 2体に 分かれる（ムウ と ムウムウ。HPは それぞれ もとの part）
//   片方の HPが 0 に なると「ばたんきゅう」。もう 片方が 立って いると、その 番で「おきて、おきて！」と 起こす
//     （HP wake で もどる。起こす たびに 2体とも 攻撃が wakeUp ずつ 上がる）＝ 2体とも、もう 片方の 番が 来る 前に たおす
//   「仲間はずれは、いやだ！」: 2体の HPの 差が 最大の apart より 大きいと、多い 方が おこって 攻撃 angry ばい
//   おかしビーム（前ぶれ → wait 回 あとの 番に その 人を「おかし」に。turns 回 動けない・受ける ダメージ taken ばい。「ぼうぎょ」で ふせげる・「星のうた」で なおる）
//   いっしょに ドーン（2体が そろって いる 時、2体で every 回 動く ごとに 前ぶれ → 全体に 大きな ダメージ。「ぼうぎょ」で へらせる）
//   勝つと 2体は ならんで すわりこむ（たおれない。え の コマ 4・5）。ばたんきゅうは コマ 2・3
// ・ボスの え は 2倍の こまかさ（size は 2倍・artScale: 0.5）。2体 ならんでも 見分けが つく（ムウ … うす紫・黄色い 星の ぼうし／ムウムウ … ミント色・こい みどり青の 月の ぼうし）
// ・もとの 作品の 絵・名前・せりふは 使わない（丸くて うす紫、ねむそうな 目、星の ついた ナイトキャップ）

const BOSS_STATUS = { sleep: 0, poison: 0.3, confuse: 0, blind: 0.3, silence: 0.2, paralyze: 0 };
export const C9D_MU = 'c9d_mu';
export const C9D_MUMU = 'c9d_mumu';
export const C9D_BOSSES = [C9D_MU, C9D_MUMU];
export const MU_NAME = 'あそびたい魔人ムウ';
export const MUMU_NAME = 'ムウムウ';
// 第3部 第1章 第4幕の ふつうの 魔物（仲間に なる 5しゅ）
export const C9D_TWIN = 'c9d_twins';
export const C9D_KAGE = 'c9d_kage';
export const C9D_LANE_MON = [C9D_TWIN, 'c9d_spider', 'c9d_moth', 'c9d_goat'];
export const C9D_DARK_MON = [C9D_KAGE];
export const C9D_MINIONS = [...C9D_LANE_MON, ...C9D_DARK_MON];
// 色ちがいの もと（今 いる 魔物の 絵）
export const C9D_RECOLOR_BASE = { c9d_spider: 'clock_spider', c9d_moth: 'amber_moth' };
// 新しい 絵（3しゅまで）
export const C9D_NEW_ART = [C9D_TWIN, 'c9d_goat', C9D_KAGE];

export const MONSTERS_C9D = {
  // ── ふたごの道（1階 Lv102・2階 Lv102〜103）──
  // こだまのふたご: 手を つないで ふわふわ とぶ、2ひき 1組の 小さな こだまの 精（新しい 絵。かならず 2ひきで 出る）
  [C9D_TWIN]: {
    name: 'こだまのふたご', lv: 102, hp: 1180, mp: 200, str: 400, def: 320, agi: 300, mag: 330, exp: 3500, gold: 1180,
    race: 'spirit', size: 's', flying: true, hit: 'magic', region: 6,
    resist: { light: 0.8, dark: 1.35, fire: 1.0, ice: 1.0, wind: 1.1, bolt: 1.0, poison: 0.3, sleep: 0.4, confuse: 0.4 }, drops: { common: ['moon_drop', 16], rare: ['c7i_snow_hat', 80] },
    actions: [{ w: 3, id: 'm9d_tw_bump' }, { w: 2, id: 'm9d_tw_echo', cond: 'notRecent:m9d_tw_echo' }, { w: 1, id: 'm9d_tw_hum', cond: 'notRecent:m9d_tw_hum' }, { w: 1, id: 'attack' }],
    desc: 'いつもふたりで手をつないでいる、こだまの精。片方が言ったことを、もう片方がまねをする。闇がよく効く。',
  },
  // 谷わたりグモ: 2本の 道の 間の 深い 谷に、糸の 橋を かける クモ（とけいグモの 色ちがい）
  c9d_spider: {
    name: '谷わたりグモ', lv: 102, hp: 2020, mp: 160, str: 428, def: 340, agi: 280, mag: 240, exp: 6760, gold: 2240,
    race: 'beast', size: 'm', hit: 'bite', region: 6,
    resist: { fire: 1.4, ice: 0.9, wind: 1.0, bolt: 1.0, light: 1.0, dark: 0.8, poison: 0.3, sleep: 0.4, confuse: 0.4 }, drops: { common: ['antidote', 14], rare: ['c7i_snow_spear', 80] },
    actions: [{ w: 3, id: 'm9d_sp_bite' }, { w: 2, id: 'm9d_sp_web', cond: 'notRecent:m9d_sp_web' }, { w: 1, id: 'm9d_sp_swing' }, { w: 1, id: 'attack' }],
    desc: 'ふたごの道の、深い谷に糸の橋をかけるクモ。橋の上から、ぶらんとおりてくる。炎がよく効く。',
  },
  // 星あかりのガ: はねの もようが 星空の ガ（こはくのガの 色ちがい ＋ きらめき）
  c9d_moth: {
    name: '星あかりのガ', lv: 102, hp: 1940, mp: 220, str: 404, def: 310, agi: 320, mag: 320, exp: 6720, gold: 2220,
    race: 'beast', size: 'm', flying: true, hit: 'claw', region: 6,
    resist: { fire: 1.4, wind: 1.2, ice: 0.9, bolt: 1.0, light: 0.8, dark: 1.0, poison: 0.3, sleep: 0.3, confuse: 0.4 }, drops: { common: ['jou_herb', 10], rare: ['c7i_snow_boomerang', 80] },
    actions: [{ w: 3, id: 'm9d_mt_wing' }, { w: 2, id: 'm9d_mt_dust', cond: 'notRecent:m9d_mt_dust' }, { w: 1, id: 'm9d_mt_light', cond: 'notRecent:m9d_mt_light' }, { w: 1, id: 'attack' }],
    desc: 'はねのもようが、星空のようなガ。暗い道で、スピカの光にあつまってくる。炎と風がよく効く。',
  },
  // つりばしヤギ: つのに 小さな かねを つけた 山の ヤギ。がけを ぴょんぴょん とぶ（新しい 絵）
  c9d_goat: {
    name: 'つりばしヤギ', lv: 103, hp: 2300, mp: 140, str: 446, def: 400, agi: 230, mag: 200, exp: 6980, gold: 2360,
    race: 'beast', size: 'l', hit: 'smash', region: 6,
    resist: { bolt: 1.35, ice: 0.8, fire: 1.0, wind: 0.9, light: 1.0, dark: 1.0, poison: 0.4, sleep: 0.4, confuse: 0.4 }, drops: { common: ['silver_shard', 12], rare: ['c7i_snow_shield', 80] },
    actions: [{ w: 3, id: 'm9d_gt_horn' }, { w: 2, id: 'm9d_gt_bell', cond: 'notRecent:m9d_gt_bell' }, { w: 1, id: 'm9d_gt_jump' }, { w: 1, id: 'attack' }],
    desc: 'つのに小さなかねをつけた、山のヤギ。がけからがけへ、ぴょんととんで、カランと鳴らす。雷がよく効く。',
  },

  // ── 暗い 所（Lv103。darkOnly … スピカと はなれた 人の 暗い 道だけ）──
  // かげぼうしネコ: 暗やみに とけこむ 黒い ネコ。光る 目だけ 見える。戦いでは「見えにくい」（てらすで 消える）
  [C9D_KAGE]: {
    name: 'かげぼうしネコ', lv: 103, hp: 2250, mp: 180, str: 440, def: 330, agi: 360, mag: 280, exp: 7050, gold: 2400,
    race: 'beast', size: 'm', hit: 'claw', region: 6, darkOnly: true, c9b: { hide: 0.25 },
    resist: { light: 1.4, dark: 0.5, fire: 1.0, ice: 1.0, wind: 1.0, bolt: 1.0, poison: 0.4, sleep: 0.3, confuse: 0.4 }, drops: { common: ['moon_drop', 16], rare: ['c7i_snow_sword', 80] },
    actions: [{ w: 3, id: 'm9d_kg_claw' }, { w: 2, id: 'm9d_kg_shadow', cond: 'notRecent:m9d_kg_shadow' }, { w: 1, id: 'm9d_kg_eyes', cond: 'notRecent:m9d_kg_eyes' }, { w: 1, id: 'attack' }],
    desc: '暗やみにとけこむ、黒いネコ。光る目だけが見える。暗い所にしか出てこない。光がよく効く。',
  },

  // ── 幕の ボス: あそびたい魔人 ムウ（星のはかばの まん中。Lv104）──
  // c9d … しかけ（battle-c9d.js の mu）
  //   split … 分かれる HPの わりあい / part … 分かれた あとの HP（もとの 最大HPの わりあい。2体とも）/
  //   wake … 起こされた 時の HP（最大の わりあい）/ wakeUp … 起こす たびに 上がる 攻撃（もとの わりあい。2体とも）/
  //   apart・angry … 「仲間はずれ」（HPの 差が 最大の apart より 大きいと 多い 方の 攻撃 angry ばい）/
  //   beam … おかしビーム（every … 前ぶれまでの 行動・wait … 前ぶれから うつまでに ふつうに 動く 回数・turns … おかしの 回数・taken … おかしの 人が 受ける ダメージ）/
  //   doon … いっしょに ドーン（every … 2体で 合わせて 動く 回数・wait・mult … 全体の 強さ・guardCut … 身を 守った 人の ばい）
  [C9D_MU]: {
    name: MU_NAME, short: 'ムウ', lv: 104, hp: 45600, mp: 9999, str: 2900, def: 360, agi: 230, mag: 1000, exp: 70000, gold: 23000,
    race: 'demon', size: 'xl', boss: true, turns: 1, speed: 0.6, hit: 'smash', artScale: 0.5,
    drops: { boss: ['c9db_star_brooch'], bonus: ['limit_stone'] },
    resist: { ...BOSS_STATUS, light: 1.0, dark: 0.9, fire: 1.0, ice: 1.0, wind: 1.1, bolt: 1.0 },
    c9d: {
      kind: 'mu', split: 0.75, part: 0.6, wake: 0.4, wakeUp: 0.2, apart: 0.25, angry: 1.5,
      beam: { every: 3, wait: 1, turns: 2, taken: 1.5 },
      doon: { every: 3, wait: 1, mult: 3.6, guardCut: 0.15 },
      // 人数（家族の キャラの 数）で 合わせる [1人, 2人, 3人, 4人, 5人]: hp・atk … ムウの HP・攻撃力の ばい
      //   solo … 仲間なしの ひとり（戦う 人が 1人だけ）の とき。few より 先に 見る（ドーンは なし ＝ doonEvery 99・おかしビームは 6回に 1回。
      //     ひとりでは 身を 守る 番が 足りない。かわりに 起こされた 時の HP と 攻撃の 上がり方を 大きく … 同じくらいに けずる 戦いに する）
      //   monK … 魔物の 仲間 1体ごとの HP・攻撃（魔物の 仲間は 半人ぶん。2人の 表が 強めな ので 少し 下げる）
      // tools/sim-ch9.mjs の「人が 画面で できる 動き」（REACT=2000・ブラウザの 速さ）で 合わせた（docs/plan-part3-c9d.md の 実装メモ）
      few: { hp: [0.4, 0.68, 1, 1, 1.26], atk: [0.72, 0.85, 1, 1, 1.1], doonK: [0.5, 0.5, 1, 1, 1] },
      solo: { hp: 0.11, atk: 0.3, beamEvery: 6, doonEvery: 99, wake: 0.6, wakeUp: 0.5 },
      monK: { hp: -0.12, atk: -0.03 },
    },
    actions: [{ w: 3, id: 'm9m_pat' }, { w: 2, id: 'm9m_bounce' }, { w: 1, id: 'm9m_yawn', cond: 'notRecent:m9m_yawn' }, { w: 1, id: 'm9m_spin', cond: 'notRecent:m9m_spin' }],
    desc: '星のはかばで、ひとりで遊んでいた魔人。丸くて、ねむそうな目をしている。ねむる星たちの夢から生まれたらしい。',
  },
  // 分かれた 方（はじめは いない。ムウが 分かれると 出る）
  [C9D_MUMU]: {
    name: MUMU_NAME, short: 'ムウムウ', lv: 104, hp: 27360, mp: 9999, str: 2900, def: 360, agi: 230, mag: 1000, exp: 64000, gold: 21000,
    race: 'demon', size: 'xl', boss: true, turns: 1, speed: 0.6, hit: 'smash', artScale: 0.5,
    // 第93回 A班: ボスは かならず 1つ 落とす きまり（test/loot.test.js）。ムウと 同じ 1人 1つの 品
    drops: { boss: 'c9db_star_brooch' },
    resist: { ...BOSS_STATUS, light: 1.0, dark: 0.9, fire: 1.0, ice: 1.0, wind: 1.1, bolt: 1.0 },
    c9d: { kind: 'mumu' },
    actions: [{ w: 3, id: 'm9m_pat' }, { w: 2, id: 'm9m_bounce' }, { w: 1, id: 'm9m_yawn', cond: 'notRecent:m9m_yawn' }, { w: 1, id: 'm9m_spin', cond: 'notRecent:m9m_spin' }],
    desc: 'ムウが、ぽんっと分かれて出てきた、もうひとりのムウ。ムウといっしょに遊ぶのが、大すき。',
  },
};

// 素材の ドロップ（loot.js の MAT_DROPS に まぜる。今の 素材だけ）
export const C9D_MAT_DROPS = {
  [C9D_TWIN]: ['magic_powder', 3],
  c9d_spider: ['beast_fang', 3],
  c9d_moth: ['star_sand', 3],
  c9d_goat: ['land_shard', 3],
  [C9D_KAGE]: ['silver_shard', 3],
};
