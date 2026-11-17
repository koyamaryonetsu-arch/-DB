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
