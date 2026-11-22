// 第3部 第2章 第1幕「赤と緑」の 魔物・中ボス 2人（B: 戦い。docs/plan-part3-c10a.md の 13-5）
// monsters.js（MONSTERS）・loot.js（MAT_DROPS）が まぜる。ここは ほかの データを import しない（じゅんかんを さける）
// え は client/render/c10a-art.js。中ボスの しかけは shared/battle-c10a.js（battle-c9b.js から よぶ）
//
// 出現表（encounters-c10a.js）: t10r_1・t10r_2 … 炎の山の 下の 古い 道（Lv105〜106）／ t10g_1・t10g_2 … 大地の下の 根の国（Lv106〜107）
// ふつうの 魔物 8しゅ（どれも 仲間に なる。region: 6。新しい 絵は 合わせて 4つ）
//   赤 … 古道のマグマトカゲ（マグマトカゲの 色ちがい）・ねっぷうぷるりん（マグマぷるりんの 色ちがい）・
//        ようがんガメ（新しい 絵）・ほのおのつぼ（新しい 絵）
//   緑 … ほうしキノコ（ねむりキノコの 色ちがい ＋ 光る ほうし）・ねっこヅタ（からみヅタの 色ちがい）・
//        ねっこカブト（新しい 絵）・はっぱミノムシ（新しい 絵）
//
// ・赤の 中ボス「ドクター・タマゴン と グルグルドリル号」（c10r_tamagon。Lv107）… battle-c10a.js の しくみ「あつく なったら 休む」
// ・緑の 中ボス「カビだんしゃく モルド と カビカビ号」（c10g_mold。Lv108）… battle-c10a.js の しくみ「カビを てらす」
// ・中ボスの え は 2倍の こまかさ（size は 2倍・artScale: 0.5）。勝つと メカが 止まり、2人とも たおれない（え の コマ 2・3）
// ・もとの 作品の 絵・名前・せりふ・決まり文句は 使わない（たまごの 形の 体・大きな ゴーグル・ばねの ひげ ／
//   きのこの かさの ぼうし・しめった マント・小さな 丸い 飛ぶ メカ）

const BOSS_STATUS = { sleep: 0, poison: 0.3, confuse: 0, blind: 0.3, silence: 0.2, paralyze: 0 };
export const C10R_TAMAGON = 'c10r_tamagon';
export const C10G_MOLD = 'c10g_mold';
export const C10A_BOSSES = [C10R_TAMAGON, C10G_MOLD];
export const TAMAGON_NAME = 'ドクター・タマゴン';
export const MOLD_NAME = 'カビだんしゃくモルド';
export const DRILL_NAME = 'グルグルドリル号';
export const KABI_NAME = 'カビカビ号';
// ふつうの 魔物（仲間に なる 8しゅ）
export const C10R_MON = ['c10r_lizard', 'c10r_slime', 'c10r_turtle', 'c10r_pot'];
export const C10G_MON = ['c10g_spore', 'c10g_vine', 'c10g_beetle', 'c10g_bag'];
export const C10A_MINIONS = [...C10R_MON, ...C10G_MON];
// 色ちがいの もと（今 いる 魔物の 絵）
export const C10A_RECOLOR_BASE = { c10r_lizard: 'lava_lizard', c10r_slime: 'magma_slime', c10g_spore: 'nemuri', c10g_vine: 'karamizuta' };
// 新しい 絵（合わせて 4しゅまで）
export const C10A_NEW_ART = ['c10r_turtle', 'c10r_pot', 'c10g_beetle', 'c10g_bag'];

export const MONSTERS_C10A = {
  // ── 赤: 炎の山の 下の 古い 道（Lv105〜106）──
  // 古道のマグマトカゲ: 第3章の マグマトカゲの 色ちがい。古い 道の 石の すきまに すむ
  c10r_lizard: {
    name: '古道のマグマトカゲ', lv: 105, hp: 2080, mp: 140, str: 452, def: 380, agi: 250, mag: 260, exp: 7120, gold: 2420,
    race: 'dragon', size: 'm', hit: 'bite', region: 6,
    resist: { fire: 0.3, ice: 1.4, wind: 1.0, bolt: 1.0, light: 1.0, dark: 1.0, poison: 0.4, sleep: 0.4, confuse: 0.4 }, drops: { common: ['toku_herb', 10], rare: ['c7i_snow_mail', 80] },
    actions: [{ w: 3, id: 'm10r_lz_bite' }, { w: 2, id: 'm10r_lz_spit', cond: 'notRecent:m10r_lz_spit' }, { w: 1, id: 'm10r_lz_tail' }, { w: 1, id: 'attack' }],
    desc: '古い道の、石のすきまにすむマグマトカゲ。せなかのひびが、むかしより赤く光っている。氷がよく効く。',
  },
  // ねっぷうぷるりん: マグマぷるりんの 色ちがい（だいだい色 → 明るい 黄色）
  c10r_slime: {
    name: 'ねっぷうぷるりん', lv: 105, hp: 1960, mp: 200, str: 420, def: 360, agi: 220, mag: 320, exp: 7040, gold: 2400,
    race: 'slime', size: 's', hit: 'smash', region: 6,
    resist: { fire: 0.2, ice: 1.4, wind: 1.1, bolt: 1.0, light: 1.0, dark: 1.0, poison: 0.4, sleep: 0.4, confuse: 0.4 }, drops: { common: ['jou_herb', 10], rare: ['c7i_snow_shield', 80] },
    actions: [{ w: 3, id: 'm10r_sl_body' }, { w: 2, id: 'm10r_sl_wind', cond: 'notRecent:m10r_sl_wind' }, { w: 1, id: 'behoimi', cond: 'allyHurt' }, { w: 1, id: 'attack' }],
    desc: 'あつい風をふき出す、黄色いぷるりん。仲間がきずつくと、ベホイミでなおす。氷がよく効く。',
  },
  // ようがんガメ: せなかに 黒い 石の こうら。こうらの すきまから ようがんが 光る（新しい 絵）
  c10r_turtle: {
    name: 'ようがんガメ', lv: 106, hp: 2400, mp: 120, str: 470, def: 470, agi: 150, mag: 220, exp: 7380, gold: 2520,
    race: 'beast', size: 'l', hit: 'smash', region: 6,
    resist: { fire: 0.4, ice: 1.35, wind: 0.9, bolt: 1.2, light: 1.0, dark: 1.0, poison: 0.3, sleep: 0.3, confuse: 0.4 }, drops: { common: ['land_shard', 12], rare: ['c7i_snow_spear', 80] },
    actions: [{ w: 3, id: 'm10r_tt_bash' }, { w: 2, id: 'm10r_tt_shell', cond: 'notRecent:m10r_tt_shell' }, { w: 1, id: 'm10r_tt_quake' }, { w: 1, id: 'attack' }],
    desc: 'せなかに、黒い石のこうらをしょったカメ。こうらのすきまから、ようがんが光っている。氷と雷がよく効く。',
  },
  // ほのおのつぼ: 昔の 人が 古い 道に 置いた 火の つぼ。中から 小さな 火の 顔が のぞく（新しい 絵）
  c10r_pot: {
    name: 'ほのおのつぼ', lv: 106, hp: 2200, mp: 240, str: 400, def: 420, agi: 200, mag: 360, exp: 7300, gold: 2500,
    race: 'material', size: 'm', hit: 'magic', region: 6,
    resist: { fire: 0.2, ice: 1.2, wind: 1.0, bolt: 1.0, blast: 1.35, light: 1.0, dark: 1.0, poison: 0, sleep: 0.3, confuse: 0.3 }, drops: { common: ['magic_water', 14], rare: ['c7i_snow_boomerang', 80] },
    actions: [{ w: 3, id: 'm10r_pt_bonk' }, { w: 2, id: 'm10r_pt_fire', cond: 'notRecent:m10r_pt_fire' }, { w: 1, id: 'm10r_pt_smoke', cond: 'notRecent:m10r_pt_smoke' }, { w: 1, id: 'attack' }],
    desc: '昔の人が、古い道においた火のつぼ。中から、小さな火の顔がのぞいている。ばくはつが効く。',
  },

  // ── 緑: 大地の下の 根の国（Lv106〜107）──
  // ほうしキノコ: ねむりキノコの 色ちがい ＋ 光る ほうし
  c10g_spore: {
    name: 'ほうしキノコ', lv: 106, hp: 2020, mp: 220, str: 420, def: 360, agi: 200, mag: 340, exp: 7220, gold: 2460,
    race: 'plant', size: 's', hit: 'smash', region: 6,
    resist: { fire: 1.4, ice: 1.0, wind: 1.1, bolt: 1.0, light: 1.0, dark: 0.8, poison: 0.2, sleep: 0, confuse: 0.4 }, drops: { common: ['moon_drop', 16], rare: ['c7i_snow_hat', 80] },
    actions: [{ w: 3, id: 'm10g_sp_bump' }, { w: 2, id: 'm10g_sp_puff', cond: 'notRecent:m10g_sp_puff' }, { w: 1, id: 'm10g_sp_glow', cond: 'notRecent:m10g_sp_glow' }, { w: 1, id: 'attack' }],
    desc: '根の国で、光るほうしをまきちらすキノコ。ほうしをすうと、ねむくなる。炎がよく効く。',
  },
  // ねっこヅタ: からみヅタの 色ちがい（大きな 根から のびる）
  c10g_vine: {
    name: 'ねっこヅタ', lv: 106, hp: 2120, mp: 160, str: 448, def: 380, agi: 230, mag: 240, exp: 7260, gold: 2480,
    race: 'plant', size: 'm', hit: 'slash', region: 6,
    resist: { fire: 1.4, ice: 0.9, wind: 1.2, bolt: 1.0, light: 1.0, dark: 1.0, poison: 0.4, sleep: 0.4, confuse: 0.4 }, drops: { common: ['antidote', 14], rare: ['c7i_snow_sword', 80] },
    actions: [{ w: 3, id: 'm10g_vn_whip' }, { w: 2, id: 'm10g_vn_bind', cond: 'notRecent:m10g_vn_bind' }, { w: 1, id: 'm10g_vn_sap' }, { w: 1, id: 'attack' }],
    desc: '大きな根からのびた、ツタの魔物。足もとから、するするとからみつく。炎と風がよく効く。',
  },
  // ねっこカブト: 根を かじる 大きな カブトムシ。つのは 木の 根の 形（新しい 絵）
  c10g_beetle: {
    name: 'ねっこカブト', lv: 107, hp: 2380, mp: 120, str: 476, def: 460, agi: 210, mag: 200, exp: 7460, gold: 2560,
    race: 'beast', size: 'l', hit: 'smash', region: 6,
    resist: { fire: 1.3, ice: 1.0, wind: 1.0, bolt: 1.3, light: 1.0, dark: 1.0, poison: 0.4, sleep: 0.4, confuse: 0.4 }, drops: { common: ['silver_shard', 12], rare: ['c7i_snow_axe', 80] },
    actions: [{ w: 3, id: 'm10g_bt_horn' }, { w: 2, id: 'm10g_bt_charge', cond: 'notRecent:m10g_bt_charge' }, { w: 1, id: 'm10g_bt_guard', cond: 'notRecent:m10g_bt_guard' }, { w: 1, id: 'attack' }],
    desc: '大きな根をかじって育った、カブトムシ。つのが、木の根のようにえだ分かれしている。炎と雷がよく効く。',
  },
  // はっぱミノムシ: 大きな 葉を まいて、根から ぶら下がる ミノムシ（新しい 絵）
  c10g_bag: {
    name: 'はっぱミノムシ', lv: 107, hp: 2160, mp: 200, str: 430, def: 400, agi: 240, mag: 320, exp: 7380, gold: 2520,
    race: 'beast', size: 'm', hit: 'smash', region: 6, flying: true,
    resist: { fire: 1.4, ice: 1.0, wind: 1.2, bolt: 1.0, light: 1.0, dark: 1.0, poison: 0.4, sleep: 0.4, confuse: 0.4 }, drops: { common: ['jou_herb', 10], rare: ['c7i_snow_robe', 80] },
    actions: [{ w: 3, id: 'm10g_bg_swing' }, { w: 2, id: 'm10g_bg_leaf', cond: 'notRecent:m10g_bg_leaf' }, { w: 1, id: 'm10g_bg_hide', cond: 'notRecent:m10g_bg_hide' }, { w: 1, id: 'attack' }],
    desc: '大きな葉をくるくるまいて、根からぶら下がるミノムシ。ゆらゆらゆれて、ぶつかってくる。炎と風がよく効く。',
  },

  // ── 赤の 中ボス: ドクター・タマゴン と グルグルドリル号（熱の 間。Lv107）──
  // c10 … しかけ（battle-c10a.js の tamagon）
  //   heat … 味方 1人ずつの あつさ（max … のぼせる 数・back … のぼせた あとの 数・act … こうげき・特技・じゅもん・strong … 強い 技・
  //     fire … 炎の 攻撃を 受けた・cool … 防御で 下がる 数・nobose … のぼせた 時の ダメージ〈最大HPの わりあい〉）
  //   mecha … メカの あつさ（max … オーバーヒートの 数・fire … 炎を 当てた・ice … 氷を 当てた・over … 止まって いる 間に 受ける ダメージの ばい）
  //   drill … ドリルの 全体攻撃（every … 前ぶれまでの 行動・half … HP 半分 いかの every・wait … 前ぶれから うつまでに ふつうに 動く 回数・mult・guardCut）
  //   coolAt … 冷きゃく水を 使う HPの わりあい
  [C10R_TAMAGON]: {
    name: TAMAGON_NAME, short: 'タマゴン', lv: 107, hp: 44000, mp: 9999, str: 5600, def: 380, agi: 230, mag: 1100, exp: 78000, gold: 26000,
    race: 'material', size: 'xl', boss: true, turns: 1, speed: 1.0, hit: 'smash', artScale: 0.5,
    drops: { boss: ['c10rb_goggles'], bonus: ['limit_stone'] },
    resist: { ...BOSS_STATUS, fire: 1.0, ice: 1.0, wind: 1.0, bolt: 1.2, light: 1.0, dark: 1.0 },
    c10: {
      kind: 'tamagon',
      heat: { max: 5, back: 2, act: 1, strong: 2, fire: 1, cool: 3, nobose: 0.12 },
      mecha: { max: 6, fire: 1, ice: -1, over: 1.5 },
      drill: { every: 5, half: 3, wait: 1, mult: 2.4, guardCut: 0.3 },
      coolAt: 0.5,
      // 人数（家族の キャラの 数）で 合わせる [1人, 2人, 3人, 4人, 5人]: hp・atk … HP・攻撃力の ばい・drillK … ドリルの 強さ
      //   solo … 仲間なしの ひとり（戦う 人が 1人だけ。nobose … のぼせた 時の ダメージを 大きく … 休まない オートとの 差）。monK … 魔物の 仲間 1体ごとの HP・攻撃
      //   tools/sim-ch10.mjs（人が 画面で できる 動き・2秒と 5秒・赤 → 緑 と 緑 → 赤）で 合わせた（docs/plan-part3-c10a.md の 実装メモ）
      //   中ボスの 戦いは いつも 人が えらぶのを 待つ（battle-c10a.js の tellAll）ので、HP・攻撃は 前の 幕より 大きい
      //   第101回 R2班: 3人〜5人を 合わせ直し（人が 1人ずつ べつの 手で はかる 道具。4人・5人は HPを 下げて 短く）
      few: { hp: [0.5, 0.62, 0.8, 0.6, 0.5], atk: [0.8, 1.05, 0.9, 1, 1.25], drillK: [0.6, 0.8, 1, 1, 1] },
      //   bare … 仲間なしの 家族 [2人, 3人]（few より 先に きく）
      bare: { hp: [0.35, 0.55], atk: [0.72, 0.85], drillK: [0.6, 0.8] },
      solo: { hp: 0.15, atk: 0.2, drillK: 0.5, nobose: 0.35 },
      // monK … 1人＋魔物3 は few の 2人目を 引く（魔物は 半人ぶん）ので、few の 2人目を かえた ぶん ここで もどす（hp 0.385・atk 1.183 の まま）
      monK: { hp: -0.1263, atk: 0.0422 },
    },
    actions: [{ w: 2, id: 'm10t_arm' }, { w: 3, id: 'm10t_steam' }, { w: 2, id: 'm10t_flame' }],
    desc: 'たまごの形の体に、大きなゴーグル。ばねのようなひげの科学者。ドリルのメカで、熱の間の岩をほっていた。',
  },

  // ── 緑の 中ボス: カビだんしゃく モルド と カビカビ号（かれた 大木の 前。Lv108）──
  // c10 … しかけ（battle-c10a.js の mold）
  //   kabi … 味方 1人ずつの カビ（max … きのこに なる 数・heal … 1つに つき 受ける 回復の へり・atk … 1つに つき 攻撃の へり）
  //   mist … カビの きり（n … 人数・half … HP 半分 いかの 人数）・wall … カビの かべ（受ける ダメージの ばい）
  //   bomb … 大カビばくだん（HP 半分 いか。every・wait・mult・guardCut）
  [C10G_MOLD]: {
    name: MOLD_NAME, short: 'モルド', lv: 108, hp: 30000, mp: 9999, str: 3400, def: 380, agi: 240, mag: 1100, exp: 80000, gold: 27000,
    race: 'demon', size: 'xl', boss: true, turns: 1, speed: 0.8, hit: 'smash', artScale: 0.5,
    drops: { boss: ['c10gb_monocle'], bonus: ['limit_stone'] },
    resist: { ...BOSS_STATUS, fire: 1.2, ice: 1.0, wind: 1.0, bolt: 1.0, light: 1.2, dark: 0.8 },
    c10: {
      kind: 'mold',
      kabi: { max: 3, heal: 0.25, atk: 0.1 },
      mist: { n: 2, half: 3 },
      wall: 0.5,
      bomb: { every: 4, wait: 1, mult: 2.2, guardCut: 0.35 },
      // 人数で 合わせる（タマゴンと おなじ 形。spd … はやさの ばい）。solo … mistN・mistHalf … きりは 1人・kinokoTurns … きのこの 番の 数・wall … カビの かべが とても かたい（てらさないと ほとんど 通らない … スピカの 技を 使わないと 勝てない）
      //   第101回 R2班: 3人〜5人を 合わせ直し（人が 1人ずつ べつの 手で はかる 道具）。4人・5人は HPを 下げ、かべを うすく（wall）、攻撃と 大カビばくだんを 強く して 短く
      few: { hp: [0.75, 0.9, 0.75, 0.6, 0.5], atk: [0.95, 1.3, 0.85, 1.4, 2.5], bombK: [0.6, 0.8, 1, 1.3, 1.2], spd: [0.875, 0.875, 1, 1, 0.875], wall: [0.5, 0.5, 0.5, 0.6, 0.6] },
      //   bare … 仲間なしの 家族 [2人, 3人]（few より 先に きく）: カビの きりは 1人ずつ（HPが 半分を 切ると 2人は 1人・3人は 2人）
      bare: { hp: [0.32, 0.6], atk: [0.7, 0.82], mistN: [1, 1], mistHalf: [1, 2], bombK: [0.6, 0.8], spd: [0.875, 0.875] },
      solo: { hp: 0.07, atk: 0.28, wall: 0.05, bombK: 0.6, mistN: 1, mistHalf: 1, kinokoTurns: 2, spd: 0.875 },
      monK: { hp: -0.17, atk: -0.09 },
    },
    actions: [{ w: 3, id: 'm10m_cane' }, { w: 2, id: 'm10m_prop', cond: 'notRecent:m10m_prop' }, { w: 2, id: 'm10m_damp' }],
    desc: 'きのこのかさのぼうしに、しめったマント。小さな丸い空とぶメカで、根の国の大木をカビだらけにしていた。',
  },
};

// 素材の ドロップ（loot.js の MAT_DROPS に まぜる。今の 素材だけ）
export const C10A_MAT_DROPS = {
  c10r_lizard: ['beast_fang', 3],
  c10r_slime: ['magic_powder', 3],
  c10r_turtle: ['land_shard', 3],
  c10r_pot: ['star_sand', 3],
  c10g_spore: ['magic_powder', 3],
  c10g_vine: ['land_shard', 3],
  c10g_beetle: ['silver_shard', 3],
  c10g_bag: ['beast_fang', 3],
};
