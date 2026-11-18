// 第88回: そろいの 組（docs/plan-r88-anime-gear.md の 5-1・12-1）
//   作品の 中で もともと 組に なって いる 品だけ。品には set: '組の id' を 書く（1つの 品は 1つの 組）
//
//   GEAR_SETS[id] = { name, items: [品の id], rule, tiers: [{ n, rule?, bonus?, resist?, fx?, title?, text }] }
//     rule … 数え方（tier ごとに rule を 書けば、その 段だけ ちがう 数え方に できる）
//       'wear'  … 1人が つけて いる 数。とどいた 段の bonus・resist・fx が その 人に つく（強さの まどにも 出る）
//       'own'   … 持って いる 数（ふくろ・預かり所・装備して いる 物。同じ 品は 1つと 数える）。title（しょう号）の ため
//       'party' … パーティーで つけて いる 数（戦いの はじめの 仲間で 数える）。とどいた 段の bonus・resist・fx が 全員に（戦いの 中だけ）
//     tiers … n こ いじょうで その 段。同じ 数え方の 段は いちばん 上の 段 だけが 効く（足し算 しない）
//     bonus … { str, def, agi, mag, heal, hp, mp }（品の bonus と 同じ）・resist … { fire: 0.8 }・fx … [{ k, v }]（data/gear-fx.js の GEAR_FX の k）
//     title … しょう号（own の 段）。セーブは しない（持ち物から いつでも 数え直す）
//   計算は shared/gear-r88.js（wear・own）と shared/battle-r88.js（party）
export const GEAR_SETS = {
  // ── ほう神演義: スーパー宝貝 7つ ──
  super_paopei: {
    name: 'スーパー宝貝',
    items: ['r88_raikoben', 'r88_kinben', 'r88_taikyoku', 'r88_kinkosen', 'r88_keisei', 'r88_rokkon', 'r88_banko'],
    rule: 'own',
    tiers: [
      { n: 2, rule: 'wear', bonus: { mag: 10, mp: 20 }, text: '1人が2つつけると、攻撃魔力+10・最大MP+20' },
      { n: 3, rule: 'wear', bonus: { mag: 20, mp: 40 }, text: '1人が3つつけると、攻撃魔力+20・最大MP+40' },
      { n: 3, title: '宝貝の使い手', text: '3つ持つと、しょう号「宝貝の使い手」' },
      { n: 7, title: 'スーパー宝貝の主', text: '7つ全部持つと、しょう号「スーパー宝貝の主」' },
    ],
  },
  // ── YAIBA: 七つの玉（竜神の玉は 8こめ。組には 入らない）──
  seven_orbs: {
    name: '七つの玉',
    items: ['r88_orb_fire', 'r88_orb_water', 'r88_orb_ice', 'r88_orb_dark', 'r88_orb_gold', 'r88_orb_big', 'r88_orb_tou'],
    rule: 'own',
    tiers: [
      { n: 7, title: '七つの玉の主', text: '7つ全部持つと、しょう号「七つの玉の主」' },
    ],
  },
  // ── YAIBA: 風神剣 ＋ 雷神剣 ──
  fujin_raijin: {
    name: '風神と雷神',
    items: ['r88_fujin_sword', 'r88_raijin_sword'],
    rule: 'own',
    tiers: [
      { n: 2, title: '風と雷の剣士', text: '2本とも持つと、しょう号「風と雷の剣士」' },
    ],
  },
  // ───── G2班 ─────
  //   own の 段に 強さ（bonus・resist・fx）を 書くと「その 数 持って いて、組の 品を 1つでも つけて いる 人」に つく（shared/gear-r88.js の wearSetPower）
  //   武器や アクセは 1人 1つしか つけられないので、作品の「1人が 3つで」は「3つ 持って 1つ つけて いれば」に した
  // ── ほう神演義: 哪吒（なた）の 宝貝 ──
  nataku: {
    name: 'なたの宝貝',
    items: ['r88_kenkonken', 'r88_kontenryo', 'r88_kinsen', 'r88_kasenso', 'r88_fukarin'],
    rule: 'own',
    tiers: [
      { n: 3, bonus: { agi: 12 }, text: '3つ持って、1つでもつけていると、素早さ+12' },
      { n: 5, title: '宝貝の少年', text: '5つ全部持つと、しょう号「宝貝の少年」' },
    ],
  },
  // ── ほう神演義: 黄天化の 剣 ──
  kotenka: {
    name: '黄天化の剣',
    items: ['r88_bakuya', 'r88_bakuya2', 'r88_sanshin'],
    rule: 'own',
    tiers: [
      { n: 2, fx: [{ k: 'el_light', v: 3 }], text: '2つ持って、1つでもつけていると、光の力+3' },
    ],
  },
  // ── ほう神演義: 十天君の じん ──
  jutenkun: {
    name: '十天君のじん',
    items: ['r88_jin_kanpyo', 'r88_jin_retsuen', 'r88_jin_fuko', 'r88_jin_tenzetsu', 'r88_jin_kosa', 'r88_jin_kinko'],
    rule: 'own',
    tiers: [
      { n: 3, title: 'じんの使い手', text: '3つ持つと、しょう号「じんの使い手」' },
      { n: 6, title: '十天君', text: '6つ全部持つと、しょう号「十天君」' },
    ],
  },
  // ── スレイヤーズ: 異界の 魔王の 5つの 武器 ──
  igai_maou: {
    name: '異界の魔王の武器',
    items: ['r88_gorun', 'r88_galvaira', 'r88_nezard', 'r88_bodigar', 'r88_ragud'],
    rule: 'own',
    tiers: [
      { n: 3, title: '魔王の武器の使い手', text: '3つ持つと、しょう号「魔王の武器の使い手」' },
      { n: 5, title: '闇を打つ者', text: '5つ全部持つと、しょう号「闇を打つ者」' },
    ],
  },
  // ── 烈火の炎: 風神 ＋ 雷神（どちらも ツメなので 2人で つける）──
  rekka_fujin_raijin: {
    name: '風神と雷神（魔導具）',
    items: ['r88_fujin', 'r88_raijin'],
    rule: 'party',
    tiers: [
      { n: 2, bonus: { str: 10, mag: 10 }, text: '2人が1つずつつけると、戦いの間、みんなの攻撃力と攻撃魔力+10' },
      { n: 2, rule: 'own', title: '風と雷の魔導具使い', text: '2つとも持つと、しょう号「風と雷の魔導具使い」' },
    ],
  },
  // ── 烈火の炎: 影界玉 ＋ 光界玉 ──
  eikai_kokai: {
    name: '影界玉と光界玉',
    items: ['r88_eikai', 'r88_kokai'],
    rule: 'own',
    tiers: [
      { n: 2, resist: { dark: 0.8 }, text: '2つとも持って、どちらかをつけていると、闇に強い' },
    ],
  },
  // ── 烈火の炎: えん水 ＋ 氷魔えん ──
  enzui_hyoma: {
    name: 'えん水と氷魔えん',
    items: ['r88_ensui', 'r88_hyoma'],
    rule: 'own',
    tiers: [
      { n: 2, fx: [{ k: 'el_ice', v: 3 }], text: '2つとも持って、どちらかをつけていると、氷の力+3' },
    ],
  },
  // ── 烈火の炎: 石ちゅう ＋ 鉄丸（よろいと アクセなので 1人で つけられる）──
  sekichu_tetsugan: {
    name: '石ちゅうと鉄丸',
    items: ['r88_sekichu', 'r88_tetsugan'],
    rule: 'wear',
    tiers: [
      { n: 2, bonus: { def: 20 }, text: '1人が2つつけると、守備力+20' },
    ],
  },
  // ── 烈火の炎: 神りょしん刀（2本 1組。同じ 品を 2人で）──
  shinryo: {
    name: '神りょしん刀',
    items: ['r88_shinryo'],
    rule: 'party',
    tiers: [
      { n: 2, fx: [{ k: 'chase', v: 4 }], text: '2人が1本ずつつけると、戦いの間、みんな追撃+4' },
    ],
  },
  // ── G7班 犬夜しゃ: 四こんの玉の かけら 5つ（5つと 竜りんの 鉄さいがで、かけらを きたえると 四こんの玉）──
  shikon_kakera: {
    name: '四こんの玉のかけら',
    items: ['r88_iy_kakera1', 'r88_iy_kakera2', 'r88_iy_kakera3', 'r88_iy_kakera4', 'r88_iy_kakera5'],
    rule: 'own',
    tiers: [
      { n: 3, title: 'かけら集め', text: '3つ持つと、しょう号「かけら集め」' },
      { n: 5, title: '四こんの玉を集めし者', text: '5つ全部持つと、しょう号「四こんの玉を集めし者」。竜りんの鉄さいがを持ってかじ屋でかけらをきたえると、四こんの玉になる' },
    ],
  },
  // ── G7班 ゆう☆遊☆白書: 闇の三大秘宝（1人が 2つ いじょう → 2つ 持って、1つでも つけて いると 闇に 強い）──
  yami_hihou: {
    name: '闇の三大秘宝',
    items: ['r88_yh_goma', 'r88_yh_ankoku', 'r88_yh_gakidama'],
    rule: 'own',
    tiers: [
      { n: 2, resist: { dark: 0.8 }, text: '2つ持って、どれかをつけていると、闇に強い' },
      { n: 3, title: '闇の三大秘宝の主', text: '3つ全部持つと、しょう号「闇の三大秘宝の主」' },
    ],
  },
};

export const SET_RULES = ['wear', 'own', 'party'];
export const tierRule = (set, tier) => tier.rule || set.rule;

// ───── G8班: らんま1/2・地獄先生ぬ〜べ〜（ほかの 係の 行と ぶつからない ように、ファイルの さいごで まぜる）─────
//   cancel … その 段の 品（お湯の やかん）を 持って いて（ふくろでも）、組の ほかの 品を つけて いる 人は、
//            つけた 品の 下がる 所（bonus の マイナス・resist の 1 より 大きい 所）が 消える（shared/gear-r88.js の cancelSetMinus）
Object.assign(GEAR_SETS, {
  // ── らんま1/2: 呪泉郷の 水 3つ ＋ お湯の やかん（アクセは 1人 1つなので、やかんは 持って いれば よい）──
  jusen: {
    name: '呪泉郷の水とお湯のやかん',
    items: ['r88_rm_nyan', 'r88_rm_panda', 'r88_rm_buta', 'r88_rm_yakan'],
    rule: 'own',
    tiers: [
      { n: 2, cancel: 'r88_rm_yakan', text: 'お湯のやかんを持っていて、水をつけていると、水の下がる所が消える' },
      { n: 4, title: '水とお湯の格闘家', text: '4つ全部持つと、しょう号「水とお湯の格闘家」' },
    ],
  },
  // ── らんま1/2: 止水おけ ＋ 開水つぼ（ジャコウ王朝の 1組の 秘宝。どちらも アクセ）──
  shisui_kaisui: {
    name: '止水おけと開水つぼ',
    items: ['r88_rm_shisui', 'r88_rm_kaisui'],
    rule: 'own',
    tiers: [
      { n: 2, fx: [{ k: 'guard_paralyze', v: 4 }, { k: 'guard_sleep', v: 4 }, { k: 'guard_confuse', v: 4 }], text: '2つとも持って、どちらかをつけていると、マヒ・ねむり・混乱にかかりにくい' },
    ],
  },
  // ── 地獄先生ぬ〜べ〜: 白衣観音経・れい水しょう・念じゅ（つえと アクセ 2つ）──
  nube_three: {
    name: 'ぬ〜べ〜の3つの道具',
    items: ['r88_nb_kannon', 'r88_nb_suisho', 'r88_nb_nenju'],
    rule: 'own',
    tiers: [
      { n: 3, fx: [{ k: 'slay_spirit', v: 5 }], text: '3つとも持って、1つでもつけていると、ゆうれいキラー+5' },
    ],
  },
});

// ───── G10班: ナルト・きめつのやいば（ファイルの さいごで まぜる）─────
Object.assign(GEAR_SETS, {
  // ── ナルト: 忍刀七人衆の 7本（持って いる 数で しょう号）──
  shinobi7: {
    name: '忍刀七人衆の刀',
    items: ['r88_nr_kubikiri', 'r88_nr_samehada', 'r88_nr_nuibari', 'r88_nr_kabutowari', 'r88_nr_shibuki', 'r88_nr_kiba', 'r88_nr_hiramekarei'],
    rule: 'own',
    tiers: [
      { n: 4, title: 'きりの里の刀集め', text: '4本持つと、しょう号「きりの里の刀集め」' },
      { n: 7, title: '忍刀七人衆', text: '7本全部持つと、しょう号「忍刀七人衆」' },
    ],
  },
  // ── ナルト: 六道せん人の 宝具 5つ（ふうじる 宝具を 3つ 持って つけると、マヒの力〈ふうじる 力〉）──
  rikudo_hougu: {
    name: '六道せん人の宝具',
    items: ['r88_nr_basho', 'r88_nr_benihyoutan', 'r88_nr_kohaku', 'r88_nr_koukin', 'r88_nr_shichisei'],
    rule: 'own',
    tiers: [
      { n: 3, fx: [{ k: 'paralyze', v: 4 }], text: '3つ持って、1つでもつけていると、マヒの力+4（ふうじる力が強くなる）' },
      { n: 5, title: '六道せん人の宝具の主', text: '5つ全部持つと、しょう号「六道せん人の宝具の主」' },
    ],
  },
  // ── ナルト: とつかの剣 ＋ スサノオのやたの鏡（剣と たて。1人が 両方 つけると 反撃）──
  totsuka_yata: {
    name: 'とつかの剣とやたの鏡',
    items: ['r88_nr_totsuka', 'r88_nr_yata'],
    rule: 'wear',
    tiers: [
      { n: 2, fx: [{ k: 'counter', v: 6 }], text: '1人が2つともつけると、反撃が出やすい' },
    ],
  },
  // ── きめつのやいば: 柱 9人の 刀（持って いる 数で しょう号）──
  hashira9: {
    name: '柱の刀',
    items: ['r88_km_mizu', 'r88_km_honoo', 'r88_km_mushi', 'r88_km_oto', 'r88_km_koi', 'r88_km_hebi', 'r88_km_kaze', 'r88_km_kasumi', 'r88_km_tekkyu'],
    rule: 'own',
    tiers: [
      { n: 3, title: '柱げいこの剣士', text: '3本持つと、しょう号「柱げいこの剣士」' },
      { n: 6, title: '柱にみとめられた剣士', text: '6本持つと、しょう号「柱にみとめられた剣士」' },
      { n: 9, title: '九人の柱の友', text: '9本全部持つと、しょう号「九人の柱の友」' },
    ],
  },
});

// ───── G9班: ドラゴンボール・ワンピース（ほかの 係の 行と ぶつからない ように、ファイルの さいごで まぜる）─────
Object.assign(GEAR_SETS, {
  // ── ドラゴンボール: 7つ（そろえて 星見の丘の さいだんで 神龍の ねがい。data/shenron-r88.js）──
  dragon_balls: {
    name: 'ドラゴンボール',
    items: ['r88_db_ball1', 'r88_db_ball2', 'r88_db_ball3', 'r88_db_ball4', 'r88_db_ball5', 'r88_db_ball6', 'r88_db_ball7'],
    rule: 'own',
    tiers: [
      { n: 7, title: 'ドラゴンボールを集めし者', text: '7つ全部持つと、しょう号「ドラゴンボールを集めし者」。星見の丘のさいだんで、ねがいを1つかなえてもらえる' },
    ],
  },
  // ── ドラゴンボール: ポタラ（2つで 1組。同じ 品を 2人で）──
  potara: {
    name: 'ポタラ',
    items: ['r88_db_potara'],
    rule: 'party',
    tiers: [
      { n: 2, bonus: { str: 20, mag: 20 }, text: '2人が1つずつつけると、戦いの間、みんなの攻撃力と攻撃魔力+20' },
    ],
  },
  // ── ワンピース: 三刀流（ゾロの 刀。3本 持って いると、どれを つけても 追撃）──
  santoryu: {
    name: '三刀流',
    items: ['r88_op_wado', 'r88_op_kitetsu', 'r88_op_yubashiri', 'r88_op_shusui', 'r88_op_enma'],
    rule: 'own',
    tiers: [
      { n: 3, fx: [{ k: 'chase', v: 6 }], text: '3本持って、どれかをつけていると、追撃+6' },
      { n: 5, title: '三刀流の剣士', text: '5本全部持つと、しょう号「三刀流の剣士」' },
    ],
  },
});

// ───── G11班: るろうに剣心・名探ていコナン（ほかの 係の 行と ぶつからない ように、ファイルの さいごで まぜる）─────
Object.assign(GEAR_SETS, {
  // ── るろうに剣心: ティンベー（たて）＋ ローチン（やり）。1人が 両方 つけると 反撃 ──
  tinbe_rochin: {
    name: 'ティンベーとローチン',
    items: ['r88_ks_tinbe', 'r88_ks_rochin'],
    rule: 'wear',
    tiers: [
      { n: 2, fx: [{ k: 'counter', v: 6 }], text: '1人が2つともつけると、反撃が出やすい' },
    ],
  },
  // ── 名探ていコナン: キック力増強シューズ（アクセ）＋ どこでもボール射出ベルト（ブーメラン）。1人が 両方 つけると 追撃 ──
  conan_kick: {
    name: 'シューズとボール射出ベルト',
    items: ['r88_cn_shoes', 'r88_cn_belt'],
    rule: 'wear',
    tiers: [
      { n: 2, fx: [{ k: 'chase', v: 6 }], text: '1人が2つともつけると、追撃が出やすい（ボールをけりこむ）' },
    ],
  },
});

// ───── G12班: セーラームーン（ファイルの さいごで まぜる）─────
Object.assign(GEAR_SETS, {
  // ── 4人の 戦士の 変身ペン（パーティーで 4本 つけると、戦いの 間 みんなの 攻撃魔力）──
  henshin_pen: {
    name: '変身ペン',
    items: ['r88_sm_pen_mercury', 'r88_sm_pen_mars', 'r88_sm_pen_jupiter', 'r88_sm_pen_venus'],
    rule: 'party',
    tiers: [
      { n: 4, bonus: { mag: 12 }, text: '4人が1本ずつつけると、戦いの間、みんなの攻撃魔力+12' },
    ],
  },
  // ── 3つの タリスマン（3つ 持って 鏡の湖の ほとりの 水しょうの台へ 行くと、聖はいが あらわれる。world/grail-r88.js）──
  talisman: {
    name: 'タリスマン',
    items: ['r88_sm_sword', 'r88_sm_mirror', 'r88_sm_orb'],
    rule: 'own',
    tiers: [
      { n: 3, title: 'タリスマンの守り手', text: '3つ全部持つと、しょう号「タリスマンの守り手」。鏡の湖のほとりの水しょうの台へ行くと、聖はいがあらわれる' },
    ],
  },
});

// ───── G14班: アナと雪の女王（ファイルの さいごで まぜる）─────
Object.assign(GEAR_SETS, {
  // ── 4つの せいれいの しるし（1人が 4つ 持つと しょう号。白銀の湖の 北の ほとりの 氷の石の台で、第5のせいれいのドレス。world/frozen-r88.js）──
  frozen_spirits: {
    name: '4つのせいれいのしるし',
    items: ['r88_fz_mark_wind', 'r88_fz_mark_fire', 'r88_fz_mark_water', 'r88_fz_mark_earth'],
    rule: 'own',
    tiers: [
      { n: 4, title: '第5のせいれい', text: '4つ全部持つと、しょう号「第5のせいれい」。白銀の湖の北のほとりの、氷の石の台へ行くと……？' },
    ],
  },
});

// ───── G15班: ダイの大冒険・ドラゴンクエスト（ファイルの さいごで まぜる）─────
//   アバンのしるし … party（パーティーで つけた 数だけ、みんなが 状態異常に かかりにくい）
//   天地魔闘 … wear（1人が 3つで 反撃）・ロトの装備 … own（1人が 3つ つけると 力・5つ 持つと しょう号）・天空の装備 … own（1人が 4つ つけると 炎・氷）
//   天空の剣・天空のよろいは 今 ある 品（data/items-r88.js の R88_SET_TAGS で set が つく）
const ABAN_RES = (k) => Object.fromEntries(['sleep', 'poison', 'confuse', 'paralyze', 'blind', 'silence'].map((s) => [s, k]));
Object.assign(GEAR_SETS, {
  aban_mark: {
    name: 'アバンのしるし',
    items: ['r88_da_mark_blue', 'r88_da_mark_green', 'r88_da_mark_red', 'r88_da_mark_white', 'r88_da_mark_purple'],
    rule: 'party',
    tiers: [
      { n: 1, resist: ABAN_RES(0.9), text: 'パーティーで1つつけると、戦いの間、みんなが状態異常に少しかかりにくい' },
      { n: 2, resist: ABAN_RES(0.8), text: 'パーティーで2つつけると、もっとかかりにくい' },
      { n: 3, resist: ABAN_RES(0.7), text: 'パーティーで3つつけると、もっとかかりにくい' },
      { n: 4, resist: ABAN_RES(0.6), text: 'パーティーで4つつけると、とてもかかりにくい' },
      { n: 5, resist: ABAN_RES(0.5), text: 'パーティーで5つ全部つけると、いちばんかかりにくい' },
    ],
  },
  tenchi_matou: {
    name: '天地魔闘',
    items: ['r88_da_kouma', 'r88_da_kigan', 'r88_da_yami'],
    rule: 'wear',
    tiers: [
      { n: 3, fx: [{ k: 'counter', v: 8 }], text: '1人が3つともつけると、反撃が出やすい' },
    ],
  },
  roto: {
    name: 'ロトの装備',
    items: ['r88_dq_roto_sword', 'r88_dq_roto_armor', 'r88_dq_roto_shield', 'r88_dq_roto_helm', 'r88_dq_roto_mark'],
    rule: 'own',
    tiers: [
      { n: 3, rule: 'wear', bonus: { str: 10, mag: 10 }, text: '1人が3ついじょうつけると、攻撃力と攻撃魔力+10' },
      { n: 5, title: 'ロトの血をひく者', text: '5つ全部持つと、しょう号「ロトの血をひく者」。まぼろしの回ろうの、竜王のひ孫にちょうせんできる' },
    ],
  },
  tenku: {
    name: '天空の装備',
    items: ['tenku_sword', 'tenku_mail', 'r88_dq_tenku_shield', 'r88_dq_tenku_helm'],
    rule: 'own',
    tiers: [
      { n: 4, rule: 'wear', resist: { fire: 0.8, ice: 0.8 }, text: '1人が4つともつけると、炎と氷に強い' },
      { n: 4, title: '天空の勇者', text: '4つ全部持つと、しょう号「天空の勇者」' },
    ],
  },
});

// ───── G13班: ハリー・ポッター（ファイルの さいごで まぜる）─────
Object.assign(GEAR_SETS, {
  // ── 死の 秘宝（今 ある ニワトコのつえ〈武器〉・とうめいマント〈よろい〉＋ よみがえりの石〈アクセ〉。部位が ちがうので 1人で 3つ つけられる）──
  //   1人が 3つ つけると「ふんばる」（1つの 戦いで 1回、たおれても HP1 で のこる。shared/battle-r88.js の r88Endure）
  //   ニワトコのつえ・とうめいマントの set は items-r88.js の tagR88Sets が つける
  deathly_hallows: {
    name: '死の秘宝',
    items: ['elder_wand', 'invisible_cloak', 'r88_hp_stone'],
    rule: 'wear',
    tiers: [
      { n: 3, fx: [{ k: 'endure', v: 1 }], text: '1人が3つともつけると、1つの戦いで1回、たおれるダメージを受けてもHP1でのこる（ふんばる）' },
      { n: 3, rule: 'own', title: '死の秘宝の主', text: '3つ全部持つと、しょう号「死の秘宝の主」' },
    ],
  },
  // ── ホグワーツの 4つの 品（持って いる 数で しょう号）──
  hogwarts4: {
    name: 'ホグワーツの4つの品',
    items: ['r88_hp_gsword', 'r88_hp_diadem', 'r88_hp_cup', 'r88_hp_locket'],
    rule: 'own',
    tiers: [
      { n: 2, title: 'ホグワーツの品さがし', text: '2つ持つと、しょう号「ホグワーツの品さがし」' },
      { n: 4, title: '4つのりょうの友', text: '4つ全部持つと、しょう号「4つのりょうの友」' },
    ],
  },
});
