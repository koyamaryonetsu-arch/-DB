// 第3部 第1章 第1幕「星ふるえの夜」の 魔物と、中ボス「3人組と スイトール1号」・幕の ボス「ホシモリの ともしびの ためし」（B: 戦い。docs/plan-part3.md の 9-3）
// monsters.js（MONSTERS）・loot.js（MAT_DROPS）が まぜる。ここは ほかの データを import しない（じゅんかんを さける）
// え は client/render/c9a-art.js。ボスの しかけは shared/battle-c9a.js（battle-c8r.js から よぶ）
//
// 出現表（encounters-c9a.js）: t9a_forest＝星ふるえの森（Lv96〜97）・t9a_b1〜t9a_b4＝星の石の地下道 地下1〜4階（Lv97〜98）
// ふつうの 魔物 6しゅ（どれも 仲間に なる）
//   森 3しゅ … 第1章の ささやきの森の 魔物が、ながれ星の 光で 強く なった すがた（今の 絵の 色がえ ＋ 星の きらめき。c9a-art.js の sparkled）
//     星くずウルフ（けもの。はぐれウルフ）・星くずキノコ（植物。ねむりキノコ）・星くずランプの精（せいれい。ランプの精）
//   地下道 3しゅ … 新しい 絵
//     くらやみ虫（けもの。darkOnly … 暗い マスだけを 歩く〈A班の フィールドの 動き〉。B3 から）・
//     こけ玉（植物。mossGlow … たおすと まわりの こけが 光る〈A班〉）・石の子ども（物質。ホシモリの 小さい 石像）
//   ランクは 出やすさ（encounters-c9a.js の 重み）と 仲間に なりやすさ（companions-c9a.js の rate）で きまる（tools/gen-monster-ranks.mjs）
//   region: 6 … ふつうの 魔物が まれに 落とす「空の レア装備」の 地方（第6章〜第8章と おなじ）
//
// ・中ボス「3人組と スイトール1号」（c9a_trio。Lv96）… battle-c9a.js の trio
//   ホシドロ一味（リーダー キラジョ・メカ作り ボヤッチ・力持ち ズラッカ）が、そうじきの 形の メカに 乗って 星の子の 光を ねらう
//   aim 回 動く ごとに すいこみ口を 星の子に 向ける（前ぶれ）→ 次の 番で すいこむ。「ぼうぎょ」・「かばう」の 人が いると 代わりに 受ける
//   すいこみ口（c9a_suikomi。べつの 的・HP 少なめ）を こわすと すいこみは 止まり、メカは 1回 休む（fix 回 動くと 直る）
//   守れないと 星の子の 光が 1つ へり、メカが 回復して 攻撃が 強く なる。3つ へると 負け
// ・幕の ボス「ホシモリの ともしびの ためし」（c9a_trial。Lv98。石の ふくろう）… battle-c9a.js の trial
//   味方 全員が「ともしび」を 持つ。やみの いぶき（前ぶれ・ねらう 人が 出る）で 消える。消えた 人は 与える ダメージと 回復が 半分
//   「明かりをわける」（ともしびが ある 人だけ）で 仲間の ともしびを つけ直す。夜明けの めもり（動く たびに 1・大きな ダメージの 番は もう 1）が dawn で 勝ち
//   全員の ともしびが 消えると「まっくら」で 負け。めもりが 半分を こえると いぶきは 2人に。たおす ボスでは ない（HP は 1 より 下がらない）
// ・ボスの え は 今までの ボスの 2倍の こまかさ（size は 2倍・artScale: 0.5。docs/plan-ch7.md の 4-4）

const BOSS_STATUS = { sleep: 0, poison: 0.3, confuse: 0, blind: 0.3, silence: 0.2, paralyze: 0 };
const PART_RESIST = { sleep: 0, poison: 0, confuse: 0, blind: 0, silence: 0, paralyze: 0 };
export const C9A_SUITORU = 'c9a_suitoru';
export const C9A_HOSHIMORI = 'c9a_hoshimori';
export const C9A_NOZZLE = 'c9a_suikomi';
export const C9A_BOSSES = [C9A_SUITORU, C9A_HOSHIMORI];
// 第3部 第1章 第1幕の ふつうの 魔物（仲間に なる 6しゅ。森 3しゅ・地下道 3しゅ）
export const C9A_FOREST_MON = ['c9a_star_wolf', 'c9a_star_kinoko', 'c9a_star_lamp'];
export const C9A_CAVE_MON = ['c9a_yamimushi', 'c9a_kokedama', 'c9a_ishinoko'];
export const C9A_MINIONS = [...C9A_FOREST_MON, ...C9A_CAVE_MON];
// 森の 魔物の もと（第1章 ささやきの森の 魔物）
export const C9A_FOREST_BASE = { c9a_star_wolf: 'wolf', c9a_star_kinoko: 'nemuri', c9a_star_lamp: 'lamp' };
export const SUITORU_NAME = 'スイトール1号';
export const HOSHIMORI_NAME = 'ホシモリ';
// 3人組（ホシドロ一味）の 名前
export const TRIO = { group: 'ホシドロ一味', leader: 'キラジョ', maker: 'ボヤッチ', strong: 'ズラッカ' };

export const MONSTERS_C9A = {
  // ── 星ふるえの森（Lv96〜97）──
  // 星くずウルフ: ながれ星の 光を あびた はぐれウルフ（色がえ ＋ 星の きらめき）
  c9a_star_wolf: {
    name: '星くずウルフ', lv: 96, hp: 2680, mp: 120, str: 364, def: 300, agi: 300, mag: 140, exp: 5500, gold: 1820,
    race: 'beast', size: 'm', hit: 'bite', region: 6,
    resist: { fire: 1.35, ice: 0.7, wind: 1.0, bolt: 1.0, light: 0.8, dark: 1.0, poison: 0.4, sleep: 0.4, confuse: 0.4 }, drops: { common: ['jou_herb', 10], rare: ['c7i_snow_boomerang', 80] },
    actions: [{ w: 3, id: 'm9n_wf_fang' }, { w: 2, id: 'm9n_wf_dash', cond: 'notRecent:m9n_wf_dash' }, { w: 1, id: 'm9n_wf_howl', cond: 'notRecent:m9n_wf_howl' }, { w: 1, id: 'attack' }],
    desc: 'ながれ星の光をあびた、はぐれウルフ。毛なみに、星くずがきらきら光る。炎がよく効く。',
  },
  // 星くずキノコ: 星の 光で 大きく なった ねむりキノコ
  c9a_star_kinoko: {
    name: '星くずキノコ', lv: 96, hp: 2760, mp: 200, str: 340, def: 320, agi: 220, mag: 300, exp: 5520, gold: 1830,
    race: 'plant', size: 'm', hit: 'claw', region: 6,
    resist: { fire: 1.35, ice: 0.9, wind: 1.0, bolt: 1.0, light: 1.0, dark: 1.0, poison: 0.3, sleep: 0, confuse: 0.4 }, drops: { common: ['moon_drop', 18], rare: ['c7i_snow_hat', 80] },
    actions: [{ w: 3, id: 'm9n_kn_bonk' }, { w: 2, id: 'm9n_kn_spore', cond: 'notRecent:m9n_kn_spore' }, { w: 1, id: 'm9n_kn_glow', cond: 'hpBelow:0.6' }, { w: 1, id: 'attack' }],
    desc: 'ながれ星の光で、大きくなったねむりキノコ。かさの星もようが、ちかちか光る。炎がよく効く。',
  },
  // 星くずランプの精: 星の 光を すいこんで 明るく なった ランプの精
  c9a_star_lamp: {
    name: '星くずランプの精', lv: 97, hp: 2150, mp: 360, str: 280, def: 270, agi: 290, mag: 440, exp: 5600, gold: 1860,
    race: 'spirit', size: 'm', flying: true, hit: 'claw', region: 6,
    resist: { fire: 0.3, ice: 1.35, wind: 1.0, bolt: 1.0, light: 0.8, dark: 1.0, poison: 0, sleep: 0.3, confuse: 0.3 }, drops: { common: ['magic_water', 12], rare: ['c7i_snow_robe', 80] },
    actions: [{ w: 3, id: 'm9n_lp_fire' }, { w: 2, id: 'm9n_lp_flare', cond: 'notRecent:m9n_lp_flare' }, { w: 1, id: 'm9n_lp_dazzle', cond: 'notRecent:m9n_lp_dazzle' }, { w: 1, id: 'attack' }],
    desc: 'ながれ星の光をすいこんだ、ランプの精。ほのおの中に、小さな星がまたたく。氷がよく効く。',
  },

  // ── 星の石の地下道（Lv97〜98）──
  // くらやみ虫: 暗い 所に だけ いる 虫。目だけが 光って 見える（darkOnly … A班の フィールドで 暗い マスだけを 歩く）
  c9a_yamimushi: {
    name: 'くらやみ虫', lv: 97, hp: 2620, mp: 160, str: 372, def: 310, agi: 280, mag: 200, exp: 5650, gold: 1880,
    race: 'beast', size: 'm', hit: 'bite', region: 6, darkOnly: true,
    resist: { light: 1.4, dark: 0.5, fire: 1.0, ice: 1.0, wind: 1.0, bolt: 1.0, poison: 0.3, sleep: 0.4, confuse: 0.4 }, drops: { common: ['antidote', 14], rare: ['c7i_snow_shield', 80] },
    actions: [{ w: 3, id: 'm9n_ym_bite' }, { w: 2, id: 'm9n_ym_dust', cond: 'notRecent:m9n_ym_dust' }, { w: 1, id: 'm9n_ym_drain', cond: 'notRecent:m9n_ym_drain' }, { w: 1, id: 'attack' }],
    desc: '暗いところにだけすむ、大きな虫。目だけが光って見える。明るいところには、入ってこない。光がよく効く。',
  },
  // こけ玉: 光る こけが 丸まった 魔物（mossGlow … たおすと まわりの こけが 光る〈A班〉）
  c9a_kokedama: {
    name: 'こけ玉', lv: 97, hp: 2300, mp: 220, str: 330, def: 340, agi: 200, mag: 320, exp: 5700, gold: 1900,
    race: 'plant', size: 'm', hit: 'claw', region: 6, mossGlow: true,
    resist: { fire: 1.4, ice: 0.8, wind: 1.0, bolt: 1.0, light: 0.8, dark: 1.0, poison: 0.3, sleep: 0.4, confuse: 0.4 }, drops: { common: ['toku_herb', 10], rare: ['c7i_snow_mail', 80] },
    actions: [{ w: 3, id: 'm9n_kd_roll' }, { w: 2, id: 'm9n_kd_moss', cond: 'notRecent:m9n_kd_moss' }, { w: 1, id: 'm9n_kd_glow', cond: 'allyHurt' }, { w: 1, id: 'attack' }],
    desc: '光るこけが、まんまるにかたまった魔物。ころころ転がってくる。たおすと、まわりのこけが光る。炎がよく効く。',
  },
  // 石の子ども: 星の石の 根を 守る ホシモリの、小さい 石像。めったに 見ない
  c9a_ishinoko: {
    name: '石の子ども', lv: 98, hp: 2350, mp: 200, str: 384, def: 380, agi: 220, mag: 240, exp: 5900, gold: 1960,
    race: 'material', size: 'm', flying: true, hit: 'bite', region: 6,
    resist: { bolt: 1.35, fire: 0.8, ice: 0.9, wind: 1.0, light: 0.8, dark: 1.0, poison: 0, sleep: 0, confuse: 0.3 }, drops: { common: ['elf_drink', 30], rare: ['c7i_snow_sword', 80] },
    actions: [{ w: 3, id: 'm9n_is_peck' }, { w: 2, id: 'm9n_is_harden', cond: 'notRecent:m9n_is_harden' }, { w: 1, id: 'm9n_is_gaze', cond: 'notRecent:m9n_is_gaze' }, { w: 1, id: 'attack' }],
    desc: '星の石の根を守る、ホシモリの小さな石像。小さなはねで、ぱたぱた飛ぶ。めったに姿を見せない。雷がよく効く。',
  },

  // ── 中ボス: 3人組と スイトール1号（くぼ地。Lv96）──
  // c9a … しかけ（battle-c9a.js の trio）
  //   aim … すいこみ口を 向けるまでの 行動 / suck … 守った 人への すいこみ（mult）/ lost … 光を とられた ときの メカの 回復（heal）と 強く なる ばい（up）/
  //   fix … すいこみ口を こわされてから 直るまでの 行動 / light … 星の子の 光の 数（0 で 負け）
  [C9A_SUITORU]: {
    name: SUITORU_NAME, short: 'スイトール', lv: 96, hp: 61600, mp: 6000, str: 1700, def: 330, agi: 230, mag: 900, exp: 99000, gold: 33000,
    race: 'material', size: 'xl', boss: true, turns: 1, speed: 1.0, hit: 'claw', artScale: 0.5,
    drops: { boss: ['c9b_trio_badge'], bonus: ['limit_stone'], rare: ['c9b_kirajo_fan', 1] },
    resist: { ...BOSS_STATUS, bolt: 1.2, fire: 1.0, ice: 1.0, wind: 0.9, light: 1.0, dark: 1.0 },
    c9a: {
      kind: 'trio', aim: 3, suck: { mult: 2.1 }, lost: { heal: 0.2, up: 1.4 }, fix: 3, light: 3,
      // 人数（家族の キャラの 数）で 合わせる [1人, 2人, 3人, 4人, 5人]: guard … 家族の キャラが 受けとめる すいこみの ばい /
      //   nozzle … すいこみ口の HP の ばい / wait … すいこみ口を 向けてから すいこむまでに ふつうに 動く 回数
      //   第101回 R1班: 人 1人ずつ べつの 手の 物さし（docs/plan-sim-vs-real.md）で 2人め〜5人めを 合わせ直した（1人めは もとの まま）
      //     前: guard [0.55, 0.6, 0.8, 1, 1.3]・nozzle [0.7, 0.75, 0.9, 1, 1.3]・wait [2, 2, 1, 1, 1]・hp [0.6, 0.75, 0.95, 1, 1.1]・atk [0.6, 1.25, 0.97, 1, 1.1]
      //   bare … 仲間なしの 2人・3人（[2人, 3人]。味方が みんな 家族の キャラ。few より 先。battle-c9a.js の pickPeople）
      //   第101回 R1班 2便: 人が えらぶ 間 ずっと 待つ 形（b.tellAll）に した ので、時間を 短く（HP を 下げて 攻撃を 上げた）。前（1便）: wait [2,2,2,2,2]・hp [0.6,0.65,0.82,1,0.95]・atk [0.6,0.9,0.85,0.75,0.85]
      few: { guard: [0.55, 0.6, 0.72, 0.85, 0.85], nozzle: [0.7, 0.75, 0.8, 0.85, 0.9], wait: [2, 2, 2, 1, 1], hp: [0.6, 0.6, 0.55, 0.4, 0.4], atk: [0.6, 0.85, 1.25, 1.4, 1.65] },
      //   第101回 R3班: かんたんな 人（docs/plan-sim-vs-real.md の 12）が めやすに とどく ように 仲間なしの 2人・3人を 弱く。前: bare hp [0.38, 0.45]・atk [0.72, 1]
      bare: { hp: [0.27, 0.38], atk: [0.58, 0.85], guard: [0.45, 0.6], nozzle: [0.5, 0.7], wait: [3, 3] },
      solo: { hp: 0.1, atk: 0.3, guard: 0.4, nozzle: 0.3, wait: 0, aim: 4 },
      monK: { hp: 0.05, atk: 0.45 },
    },
    actions: [{ w: 3, id: 'm9t_punch' }, { w: 2, id: 'm9t_hose' }, { w: 2, id: 'm9t_bomb', cond: 'notRecent:m9t_bomb' }, { w: 1, id: 'm9t_pochi', cond: 'notRecent:m9t_pochi' }],
    desc: 'ホシドロ一味のキラジョ・ボヤッチ・ズラッカが乗る、そうじきの形の大きなメカ。星の光を、すいこもうとねらっている。',
  },

  // ── 幕の ボス: ホシモリの ともしびの ためし（星の石の地下道 地下4階。Lv98）──
  // c9a … しかけ（battle-c9a.js の trial）
  //   dawn … 夜明けまでの めもり / every … やみの いぶきまでの 行動 / big … ホシモリの 番の 間に この ダメージを 与えると めもりが もう 1 /
  //   half … 与える ダメージと 回復（ともしびが 消えた 人）/ spicaEvery … 星の子の ほのかな光の この 回に 1回 ともしびを つける /
  //   two … めもりが この わりあいを こえると いぶきは 2人に / breath … やみの いぶきの 強さ
  //   ゆっくり（speed 0.55）だが、1つの 番に 2回 動く（turns: 2。めもりと いぶきは 番ごとに 1回。4〜6分で 夜明け）
  [C9A_HOSHIMORI]: {
    name: HOSHIMORI_NAME, short: 'ホシモリ', lv: 98, hp: 120000, mp: 9999, str: 1665, def: 340, agi: 240, mag: 960, exp: 108000, gold: 36000,
    race: 'material', size: 'xl', boss: true, turns: 2, speed: 0.55, hit: 'claw', artScale: 0.5,
    drops: { boss: ['c9b_dawn_feather'], bonus: ['limit_stone'], rare: ['c9b_owl_staff', 1] },
    resist: { ...BOSS_STATUS, light: 0.8, dark: 0.6, fire: 1.0, ice: 1.0, wind: 1.0, bolt: 1.0 },
    c9a: {
      kind: 'trial', dawn: 16, every: 1, big: 9000, half: 0.5, spicaEvery: 6, two: 0.5, breath: [420, 450],
      // 人数（家族の キャラの 数）で 合わせる [1人, 2人, 3人, 4人, 5人]: dawn … 夜明けまでの めもり / every … やみの いぶきまでの 行動 /
      //   two … いぶきが 2人に なる めもりの わりあい（5人は はじめから 2人）
      //   人が 少ない ときは めもりを みじかく・いぶきを 多く（いぶきの 番は ほかの 攻撃を しない ので、HP の けずりあいより しくみの 戦いに なる）
      //   第101回 R1班: 人 1人ずつ べつの 手の 物さしで 3人め〜5人めを 合わせ直した（1人め・2人めは もとの まま）
      //     前: every [1, 1, 2, 1, 1]・two [0.5, 0.5, 0.5, 0.25, 0.25]・atk [1, 1.1, 0.97, 1, 1.7]（人4人 93%・知らない 人 47% … やさしすぎた）
      //   bare … 仲間なしの 2人・3人（[2人, 3人]。few より 先）。2人は いぶきを はじめから 2人に（two 0 … 完全オートでは 勝てない）・めもり みじかく
      //   第101回 R1班 2便: ずっと 待つ 形（b.tellAll）で 時間が のびた ので めもりを 短く。前（1便）: dawn [9, 11, 15, 16, 16]・two [0.5, 0.5, 0, 0.25, 0]・bwait [0, 0, 1, 1, 1]・atk [1, 1.1, 1.1, 1.4, 1.9]
      few: { dawn: [9, 11, 13, 12, 11], every: [1, 1, 1, 1, 1], two: [0.5, 0.5, 0, 0, 0], bwait: [0, 0, 1, 1, 2], atk: [1, 1.1, 1.2, 1.6, 3.2] },
      bare: { dawn: [8, 13], every: [1, 1], two: [0, 0.5], bwait: [2, 1], atk: [0.6, 0.9] },
      solo: { atk: 0.45, dawn: 10, every: 2 },
      monK: { atk: 0.15 },
    },
    actions: [{ w: 3, id: 'm9h_wing' }, { w: 1, id: 'm9h_hoot' }, { w: 1, id: 'm9h_gaze', cond: 'notRecent:m9h_gaze' }, { w: 1, id: 'attack' }],
    desc: '千年のあいだ、星の石の根を守ってきた、石のふくろう。明かりを消さずに夜明けまでたえられるか、ためしてくる。',
  },
};

// ボスの しかけの 部ひん（図鑑・配合には 出ない。monsters.js が addC9aHidden で まぜる）
export const C9A_HIDDEN = {
  // スイトール1号の すいこみ口（べつの 的。動かない。こわすと すいこみが 止まる）
  [C9A_NOZZLE]: {
    name: 'すいこみ口', lv: 96, hp: 9000, mp: 0, str: 0, def: 280, agi: 1, mag: 0, exp: 0, gold: 0,
    race: 'material', size: 'm', speed: 0.00001, hit: 'claw', noBefriend: true,
    resist: { ...PART_RESIST, bolt: 1.2, fire: 1.0, ice: 1.0, wind: 1.0, light: 1.0, dark: 1.0 },
    drops: {}, actions: [{ w: 1, id: 'm9t_hum' }],
    desc: 'スイトール1号の、大きなすいこみ口。こわすと、すいこみが止まる。',
  },
};

// monsters.js が よぶ。何回 よんでも おなじ
export function addC9aHidden(table) {
  for (const [id, m] of Object.entries(C9A_HIDDEN)) {
    if (Object.prototype.hasOwnProperty.call(table, id)) continue;
    Object.defineProperty(table, id, { value: { ...m }, enumerable: false, configurable: true, writable: true });
  }
}

// 素材の ドロップ（loot.js の MAT_DROPS に まぜる。今の 素材だけ。入手先の 画面に 出る）
export const C9A_MAT_DROPS = {
  c9a_star_wolf: ['beast_fang', 3],
  c9a_star_kinoko: ['magic_powder', 3],
  c9a_star_lamp: ['star_sand', 3],
  c9a_yamimushi: ['land_shard', 3],
  c9a_kokedama: ['magic_powder', 4],
  c9a_ishinoko: ['silver_shard', 3],
};
