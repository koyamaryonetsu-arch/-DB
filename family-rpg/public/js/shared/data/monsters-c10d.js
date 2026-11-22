// 第3部 第2章 第4幕「金の音と、星の橋」の 門の 番人・幕の ボス（B: 戦い。docs/plan-part3-c10d.md の 16-3）
// monsters.js（MONSTERS）・loot.js（MAT_DROPS）が まぜる。ここは ほかの データを import しない（じゅんかんを さける）
// え は client/render/c10d-art.js。しかけは shared/battle-c10d.js（battle-c9b.js から よぶ）
//
// ・門の 番人（星の 階段の 門 4つ。c10d_gate1〜4。Lv115〜117）… 鏡の かけらで できた 兵。「色の まく」を まとう（体の 色で わかる）
//   新しい 絵は 2しゅ（かがみの番兵・かがみのかけら）。のこりの 2しゅは かがみの番兵の 色ちがい（かざりの 色が ちがう）
//   1 かがみの番兵（c10d_shard）… 1体・色は まくが われた あとに かわる（れんしゅう）
//   2 かがみの門番（c10d_shard_w）… 2体・色が ちがう（どちらから わるか）
//   3 まどいの門番（c10d_shard_m）… 2体・まとい直す たびに 色が かわる（shift 回 動くと まとい直す）・「色を うつす」（仲間 1人に 色の しるし）
//   4 かがみのかけら（c10d_shard_s）… 小さい 3体・全体攻撃が 強い（早く わって 数を へらす）
//   どれも 仲間に ならない（ボスの 戦いだけに 出る）。落とす 品は よく 落とす 物と レア（ほかの 魔物と おなじ きまり）
// ・幕の ボス「光をはかる鏡 ミラーレ」（c10d_mirare。Lv118）… しくみ「2つの 色を そろえる」。勝つと ひびが 入って 帰る（たおれない）
//   金の ふちの 大きな 鏡に、ねむそうで いばった 顔・まわりに 小さな 手鏡。もとは 白雪姫の 魔法の 鏡だが、
//   もとの 絵・名前・せりふ・決まり文句は 使わない（緑の 顔だけが うかぶ 鏡・仮面の 顔は かかない）
//   うつし身（c10d_copy）… HPが 半分を 切ると 1体 出る。味方 1人の すがたを うつした 鏡の 兵（その 人の 技を 1つ。弱い）。
//     はじめは 見えない（たおれた かっこう）。スピカの「てらす」で 消える。経験値は ない
// ・ボスの え は 2倍の こまかさ（size は 2倍・artScale: 0.5）

const BOSS_STATUS = { sleep: 0, poison: 0.3, confuse: 0, blind: 0.3, silence: 0.2, paralyze: 0 };
const GATE_STATUS = { sleep: 0.15, poison: 0.4, confuse: 0.15, blind: 0.4, silence: 0.3, paralyze: 0.1 };
export const C10D_SHARD = 'c10d_shard';
export const C10D_SHARD_W = 'c10d_shard_w';
export const C10D_SHARD_M = 'c10d_shard_m';
export const C10D_SHARD_S = 'c10d_shard_s';
export const C10D_GUARDS = [C10D_SHARD, C10D_SHARD_W, C10D_SHARD_M, C10D_SHARD_S];
export const C10D_MIRARE = 'c10d_mirare';
export const C10D_COPY = 'c10d_copy';
export const MIRARE_NAME = 'ミラーレ';
export const MIRARE_TITLE = '光をはかる鏡';
// 色ちがいの もと（この 幕の 新しい 絵）
export const C10D_RECOLOR_BASE = { [C10D_SHARD_W]: C10D_SHARD, [C10D_SHARD_M]: C10D_SHARD };
// 新しい 絵（門の 番人は 2しゅまで）
export const C10D_NEW_ART = [C10D_SHARD, C10D_SHARD_S];

// 門の 番人の しかけ（c10d）
//   colors … はじめの まくの 色の 数（1体に 1色）・open … まくが われて ダメージが 通る 間（その 番人が 動く 回数）・
//   veilK … まくが ある 間の 受ける ダメージ・shift … この 回数 動くと まくを まとい直す（色が かわる。0 … しない）・
//   mark … この 回数 動く ごとに「色を うつす」（0 … しない）・markK … しるしの ついた 人の 番の 速さ
//   regen … まくが ある 間、動く たびに 最大HPの この わりあい 回復（鏡の ひびが なおる。鳴らさずに たたき続けても 勝ちにくい）
//   few … 人数（家族の キャラの 数）で 合わせる [1人, 2人, 3人, 4人, 5人]（hp・atk）。solo … 仲間なしの ひとり。monK … 魔物の 仲間 1体ごと
const GATE = (o) => ({ kind: 'gate', open: 3, veilK: 0.2, regen: 0.04, shift: 0, mark: 0, markK: 0.6, ...o });

export const MONSTERS_C10D = {
  // ── 門 1: かがみの番兵（れんしゅう）──
  [C10D_SHARD]: {
    name: 'かがみの番兵', lv: 115, hp: 15000, mp: 999, str: 3500, def: 380, agi: 230, mag: 900, exp: 32000, gold: 9000,
    race: 'material', size: 'l', speed: 1.0, hit: 'slash', region: 6,
    resist: { ...GATE_STATUS, fire: 1.0, ice: 1.0, wind: 1.0, bolt: 1.0, light: 0.8, dark: 1.2 }, drops: { common: ['magic_water', 8], rare: ['c7i_snow_mail', 64] },
    actions: [{ w: 3, id: 'm10d_sd_slash' }, { w: 2, id: 'm10d_sd_flash', cond: 'notRecent:m10d_sd_flash' }, { w: 1, id: 'attack' }],
    c10d: GATE({ few: { hp: [0.7, 0.8, 1, 1, 1.1], atk: [0.85, 0.9, 1, 1, 1] }, solo: { hp: 0.18, atk: 0.4 }, monK: { hp: 0.03, atk: 0 } }),
    desc: '鏡のかけらを、よろいのようにまとった兵。色のまくをまとって、こうげきをはじく。同じ色の音で、まくがわれる。',
  },
  // ── 門 2: かがみの門番（2体・色が ちがう）──
  [C10D_SHARD_W]: {
    name: 'かがみの門番', lv: 116, hp: 6000, mp: 999, str: 2700, def: 390, agi: 240, mag: 920, exp: 22000, gold: 6400,
    race: 'material', size: 'l', speed: 0.8, hit: 'slash', region: 6,
    resist: { ...GATE_STATUS, fire: 1.0, ice: 1.0, wind: 1.0, bolt: 1.0, light: 0.8, dark: 1.2 }, drops: { common: ['elf_drink', 10], rare: ['c7i_snow_shield', 64] },
    actions: [{ w: 3, id: 'm10d_sd_slash' }, { w: 2, id: 'm10d_sw_cross', cond: 'notRecent:m10d_sw_cross' }, { w: 1, id: 'm10d_sd_flash', cond: 'notRecent:m10d_sd_flash' }],
    c10d: GATE({ few: { hp: [0.7, 0.8, 1, 1, 1.1], atk: [0.85, 0.9, 1, 1, 1] }, solo: { hp: 0.12, atk: 0.36, open: 5 }, monK: { hp: 0.03, atk: 0 } }),
    desc: '門を守る、鏡の兵。2人で、ちがう色のまくをまとう。どちらのまくから、わるか考えよう。',
  },
  // ── 門 3: まどいの門番（2体・まとい直す たびに 色が かわる・色を うつす）──
  [C10D_SHARD_M]: {
    name: 'まどいの門番', lv: 116, hp: 5600, mp: 999, str: 2700, def: 390, agi: 250, mag: 940, exp: 23000, gold: 6600,
    race: 'material', size: 'l', speed: 0.8, hit: 'slash', region: 6,
    resist: { ...GATE_STATUS, fire: 1.0, ice: 1.0, wind: 1.0, bolt: 1.0, light: 0.8, dark: 1.2 }, drops: { common: ['moon_drop', 10], rare: ['c7i_snow_helm', 64] },
    actions: [{ w: 3, id: 'm10d_sd_slash' }, { w: 2, id: 'm10d_sm_wave', cond: 'notRecent:m10d_sm_wave' }, { w: 1, id: 'attack' }],
    c10d: GATE({ shift: 3, mark: 3, few: { hp: [0.7, 0.8, 1, 1, 1.1], atk: [0.85, 0.9, 1, 1, 1] }, solo: { hp: 0.12, atk: 0.36, open: 5, mark: 0 }, monK: { hp: 0.03, atk: 0 } }),
    desc: 'まくの色を、くるくるかえる鏡の兵。仲間に色のしるしをつけて、動きをおそくする。しるしと同じ色の音で、消える。',
  },
  // ── 門 4: かがみのかけら（小さい 3体・全体攻撃が 強い）──
  [C10D_SHARD_S]: {
    name: 'かがみのかけら', lv: 117, hp: 3200, mp: 999, str: 2400, def: 360, agi: 270, mag: 960, exp: 13000, gold: 4000,
    race: 'material', size: 'm', speed: 0.7, flying: true, hit: 'magic', region: 6,
    resist: { ...GATE_STATUS, fire: 1.0, ice: 1.0, wind: 1.1, bolt: 1.0, light: 0.8, dark: 1.2 }, drops: { common: ['star_sand', 8], rare: ['c7i_snow_gi', 64] },
    actions: [{ w: 2, id: 'm10d_ss_rain' }, { w: 2, id: 'm10d_ss_poke' }, { w: 1, id: 'attack' }],
    c10d: GATE({ regen: 0.07, few: { hp: [0.7, 0.8, 1, 1, 1.1], atk: [0.8, 0.85, 1, 1, 1] }, solo: { hp: 0.17, atk: 0.3, open: 6, regen: 0.1 }, monK: { hp: 0.03, atk: 0 } }),
    desc: '星の階段のいちばん上を守る、小さな鏡のかけら。3つで、光の雨をふらせる。早くわって、数をへらそう。',
  },

  // ── 幕の ボス: ミラーレ（光をはかる鏡。いただき。Lv118）──
  // c10d … しかけ（battle-c10d.js の mirror）
  //   colors … まくの 色の 数（2色）・window … 1色めを 鳴らしてから、ミラーレが この 回数 動くまでに 2色めを 鳴らす（間に 合わないと もどる）・
  //   open … まくが われて ダメージが 通る 間（ミラーレが 動く 回数。はじめの 1回は 休む）・veilK … まくが ある 間の 受ける ダメージ
  //   measure … 光を はかる（every 回 動く ごとに 前ぶれ → 次の 番に いちばん HPが 多い 人へ。mult・guardCut … 身を 守ると）
  //   copy … うつし身（HPが at を 切ると 1体。hp・atk … うつした 人の 強さの ばい）
  [C10D_MIRARE]: {
    name: MIRARE_NAME, short: 'ミラーレ', lv: 118, hp: 31000, mp: 9999, str: 7300, def: 410, agi: 260, mag: 1160, exp: 94000, gold: 32000,
    race: 'material', size: 'xl', boss: true, turns: 1, speed: 1.2, hit: 'magic', artScale: 0.5, flying: true,
    drops: { boss: ['c10db_hand_mirror'], bonus: ['limit_stone'] },
    resist: { ...BOSS_STATUS, fire: 1.0, ice: 1.0, wind: 1.0, bolt: 1.0, light: 0.6, dark: 1.1 },
    c10d: {
      kind: 'mirror',
      colors: 2, window: 2, open: 4, veilK: 0.2,
      measure: { every: 4, first: 3, mult: 1.9, guardCut: 0.35 },
      copy: { at: 0.5, hp: 0.4, atk: 0.55 },
      // 人数で 合わせる [1人, 2人, 3人, 4人, 5人]: hp・atk・colors（まくの 色の 数）・window（2色めまでの ミラーレの 動く 回数）・measureK（光を はかるの 強さ）
      //   1人 … まくが 1色。2人 … 2色だが もどるまで 4回
      few: { hp: [0.82, 0.7, 1, 1, 1.15], atk: [0.81, 0.74, 1, 1, 1.03], colors: [1, 2, 2, 2, 2], window: [2, 4, 2, 2, 2], measureK: [1, 1, 1, 1, 1] },
      solo: { hp: 0.06, atk: 0.2, colors: 1, measureK: 2 },
      monK: { hp: 0.04, atk: 0.04 },
    },
    actions: [{ w: 3, id: 'm10d_mr_glare' }, { w: 2, id: 'm10d_mr_hands', cond: 'notRecent:m10d_mr_hands' }, { w: 2, id: 'm10d_mr_frame' }],
    desc: '金のふちの、大きな鏡。いつもねむそうで、いばっている。光の強さをはかって、弱い光をばかにする。',
  },
  // うつし身（ミラーレが 出す。はじめは 見えない。出る 時に うつした 人の 強さ・すがた・技 1つに かわる）
  [C10D_COPY]: {
    name: 'うつし身', lv: 118, hp: 3000, mp: 300, str: 2000, def: 300, agi: 200, mag: 600, exp: 0, gold: 0,
    race: 'material', size: 'm', hit: 'slash', region: 6, fake: true,
    resist: { ...GATE_STATUS, fire: 1.0, ice: 1.0, wind: 1.0, bolt: 1.0, light: 1.3, dark: 1.0 },
    drops: {},
    actions: [{ w: 1, id: 'attack' }],
    desc: '鏡にうつった、だれかのすがた。スピカの光で、消えてしまう。',
  },
};
