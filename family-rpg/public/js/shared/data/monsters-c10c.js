// 第3部 第2章 第3幕「紫と、うばわれた音」の 魔物・中ボス・幕の ボス（B: 戦い。docs/plan-part3-c10c.md の 15-3）
// monsters.js（MONSTERS）・loot.js（MAT_DROPS）が まぜる。ここは ほかの データを import しない（じゅんかんを さける）
// え は client/render/c10c-art.js。ボスの しかけは shared/battle-c10c.js（battle-c9b.js から よぶ）
//
// 出現表（encounters-c10c.js）: t10c_isles（空の 小島。Lv113〜114）・t10c_fort（少年の とりでの ベルトの 工場。Lv114〜115）
// ふつうの 魔物 8しゅ（どれも 仲間に なる。region: 6。新しい 絵は 合わせて 3つ）
//   空 … むらさき雲ひつじ（雲ひつじの 色ちがい）・よぞらエイ（空とびエイの 色ちがい）・ゴロゴロぐも（かみなりぐもの 色ちがい）・うき石クラゲ（新しい 絵）
//   とりで … ほしくずはこび（新しい 絵。星の かけらを 運ぶ 小さな 働き者）・ほしほりモグラ（岩もぐらの 色ちがい）・
//            みはりランタン（新しい 絵。見はり）・とりでのはにわ兵（はにわ兵の 色ちがい。見はり）
//
// ・空の 中ボス「たいさムスカリ」（c10c_muscari。Lv114）… battle-c10c.js の しくみ「立つ 石を うつる」
// ・幕の ボス「アルゴル」（星くいの少年。c10c_algol。Lv116）… しくみ「光を 食べさせない」。HPが 3わりに なると 戦いが 終わる
// ・ボスの え は 2倍の こまかさ（size は 2倍・artScale: 0.5）。勝っても 2人とも たおれない（え の コマ 2・3 … しょんぼり・ひざを つく）
// ・もとの 作品の 絵・名前・せりふ・決まり文句は 使わない（むらさきの 軍服・丸い ゴーグル・花の しるしの ぼうし・雷の 石ばん。
//   サングラス・茶色の スーツ・小さな 銃・光る 石の ペンダントは 使わない）

const BOSS_STATUS = { sleep: 0, poison: 0.3, confuse: 0, blind: 0.3, silence: 0.2, paralyze: 0 };
export const C10C_COLONEL = 'c10c_muscari';
export const C10C_ALGOL = 'c10c_algol';
export const C10C_BOSSES = [C10C_COLONEL, C10C_ALGOL];
export const COLONEL_NAME = 'たいさムスカリ';
export const ALGOL_NAME = 'アルゴル';
// ふつうの 魔物（仲間に なる 8しゅ）
export const C10C_ISLE_MON = ['c10c_sheep', 'c10c_ray', 'c10c_puff', 'c10c_jelly'];
export const C10C_FORT_MON = ['c10c_carrier', 'c10c_mole', 'c10c_lamp', 'c10c_haniwa'];
export const C10C_MINIONS = [...C10C_ISLE_MON, ...C10C_FORT_MON];
// 色ちがいの もと（今 いる 魔物の 絵）
export const C10C_RECOLOR_BASE = { c10c_sheep: 'cloud_sheep', c10c_ray: 'sky_ray', c10c_puff: 'thunder_puff', c10c_mole: 'rock_mole', c10c_haniwa: 'haniwa_soldier' };
// 新しい 絵（合わせて 4しゅまで）
export const C10C_NEW_ART = ['c10c_jelly', 'c10c_carrier', 'c10c_lamp'];

export const MONSTERS_C10C = {
  // ── 空の 小島（Lv113〜114）──
  // むらさき雲ひつじ: 第5章の 雲ひつじの 色ちがい（うすむらさきの 雲の 毛）
  c10c_sheep: {
    name: 'むらさき雲ひつじ', lv: 113, hp: 1820, mp: 160, str: 480, def: 380, agi: 200, mag: 320, exp: 8500, gold: 2900,
    race: 'beast', size: 'm', flying: true, hit: 'bite', region: 6,
    resist: { wind: 1.35, bolt: 1.15, ice: 0.7, fire: 1.0, light: 1.0, dark: 1.0, poison: 0.5, sleep: 0.2, confuse: 0.6 }, drops: { common: ['moonherb', 10], rare: ['c7i_snow_robe', 80] },
    actions: [{ w: 3, id: 'm10c_sh_tackle' }, { w: 1, id: 'm10c_sh_mist', cond: 'notRecent:m10c_sh_mist' }, { w: 2, id: 'attack' }],
    desc: 'むらさきの光をあびて、毛がうすむらさきになった雲ひつじ。ねむり雲をはく。風がよく効く。',
  },
  // よぞらエイ: 第5章の 空とびエイの 色ちがい（夜空の こい 青に 星の もよう）
  c10c_ray: {
    name: 'よぞらエイ', lv: 113, hp: 1760, mp: 140, str: 500, def: 360, agi: 280, mag: 340, exp: 8560, gold: 2920,
    race: 'beast', size: 'm', flying: true, hit: 'slash', region: 6,
    resist: { bolt: 0.5, ice: 1.3, wind: 0.8, fire: 1.0, light: 1.0, dark: 1.0, poison: 0.6, sleep: 0.4, confuse: 0.5 }, drops: { common: ['jou_herb', 10], rare: ['c7i_snow_boomerang', 80] },
    actions: [{ w: 3, id: 'm10c_ry_glide' }, { w: 2, id: 'm10c_ry_sting', cond: 'notRecent:m10c_ry_sting' }, { w: 1, id: 'attack' }],
    desc: '夜空の色の、大きなエイ。うかぶ小島のあいだを、すいすいおよぐ。氷がよく効く。',
  },
  // ゴロゴロぐも: 第5章の かみなりぐもの 色ちがい（むらさきの 雷雲）
  c10c_puff: {
    name: 'ゴロゴロぐも', lv: 114, hp: 1640, mp: 240, str: 420, def: 340, agi: 260, mag: 380, exp: 8600, gold: 2940,
    race: 'spirit', size: 's', flying: true, region: 6,
    resist: { bolt: 0, wind: 1.4, ice: 1.1, fire: 0.8, light: 1.0, dark: 1.0, poison: 0, sleep: 0.4, confuse: 0.6 }, drops: { common: ['magic_water', 12], rare: ['c7i_snow_staff', 80] },
    actions: [{ w: 3, id: 'm10c_pf_bolt' }, { w: 2, id: 'm10c_pf_rain', cond: 'notRecent:m10c_pf_rain' }, { w: 1, id: 'attack' }],
    desc: 'むらさきにゴロゴロ鳴る、小さな雷雲。いなずまをおとしてくる。風がよく効き、雷はまったく効かない。',
  },
  // うき石クラゲ: 小石を かかえて 空に うかぶ クラゲ（新しい 絵）
  c10c_jelly: {
    name: 'うき石クラゲ', lv: 114, hp: 1880, mp: 120, str: 490, def: 400, agi: 220, mag: 300, exp: 8640, gold: 2960,
    race: 'beast', size: 'm', flying: true, hit: 'slash', region: 6,
    resist: { fire: 1.3, ice: 0.9, wind: 1.1, bolt: 1.2, light: 1.0, dark: 1.0, poison: 0, sleep: 0.4, confuse: 0.4 }, drops: { common: ['antidote', 12], rare: ['c7i_snow_shield', 80] },
    actions: [{ w: 3, id: 'm10c_jl_sting' }, { w: 2, id: 'm10c_jl_stone', cond: 'notRecent:m10c_jl_stone' }, { w: 1, id: 'm10c_jl_glow', cond: 'notRecent:m10c_jl_glow' }, { w: 1, id: 'attack' }],
    desc: '小さなうき石をかかえて、空にふわふわうかぶクラゲ。石を落としてくる。炎がよく効く。',
  },

  // ── 少年の とりで・ベルトの 工場（Lv114〜115）──
  // ほしくずはこび: 星の かけらの はこを せおう 小さな 働き者（新しい 絵。にくめない）
  c10c_carrier: {
    name: 'ほしくずはこび', lv: 114, hp: 1800, mp: 120, str: 490, def: 390, agi: 230, mag: 280, exp: 8680, gold: 2980,
    race: 'beast', size: 's', hit: 'smash', region: 6,
    resist: { fire: 1.0, ice: 1.2, wind: 1.0, bolt: 1.3, light: 0.8, dark: 1.0, poison: 0.5, sleep: 0.5, confuse: 0.5 }, drops: { common: ['star_sand', 12], rare: ['c7i_snow_dagger', 80] },
    actions: [{ w: 3, id: 'm10c_cr_box' }, { w: 2, id: 'm10c_cr_throw', cond: 'notRecent:m10c_cr_throw' }, { w: 1, id: 'm10c_cr_rest', cond: 'hpBelow:0.5' }, { w: 1, id: 'attack' }],
    desc: '星のかけらのはこを、せっせと運ぶ小さな働き者。ほめられると、すぐにやる気を出す。雷がよく効く。',
  },
  // ほしほりモグラ: 第5章の 岩もぐらの 色ちがい（星の かけらで きらきらの つめ）
  c10c_mole: {
    name: 'ほしほりモグラ', lv: 114, hp: 1860, mp: 60, str: 510, def: 420, agi: 210, mag: 200, exp: 8700, gold: 3000,
    race: 'beast', size: 's', hit: 'slash', region: 6,
    resist: { ice: 1.3, bolt: 1.2, blast: 0.8, fire: 1.0, wind: 1.0, light: 1.0, dark: 1.0, poison: 0.5, sleep: 0.4, confuse: 0.5 }, drops: { common: ['jou_herb', 10], rare: ['c7i_snow_gi', 80] },
    actions: [{ w: 3, id: 'm10c_ml_drill' }, { w: 2, id: 'm10c_ml_dust', cond: 'notRecent:m10c_ml_dust' }, { w: 1, id: 'attack' }],
    desc: '大地の下で、星のかけらをほり出すもぐら。つめが、きらきら光る。氷がよく効く。',
  },
  // みはりランタン: とりでを 見はる 目の ある ランタン（新しい 絵）
  c10c_lamp: {
    name: 'みはりランタン', lv: 115, hp: 1740, mp: 240, str: 440, def: 380, agi: 250, mag: 380, exp: 8780, gold: 3020,
    race: 'material', size: 'm', flying: true, hit: 'magic', region: 6,
    resist: { fire: 0.4, ice: 1.35, wind: 1.0, bolt: 1.0, light: 0.8, dark: 1.2, poison: 0, sleep: 0, confuse: 0.3 }, drops: { common: ['magic_water', 12], rare: ['c7i_snow_helm', 80] },
    actions: [{ w: 3, id: 'm10c_lp_beam' }, { w: 2, id: 'm10c_lp_flare', cond: 'notRecent:m10c_lp_flare' }, { w: 1, id: 'm10c_lp_alarm', cond: 'notRecent:m10c_lp_alarm' }],
    desc: 'とりでのろうかを見はる、大きな目のランタン。見つけると、ジリリリ！と鳴る。氷がよく効く。',
  },
  // とりでのはにわ兵: 第5章の はにわ兵の 色ちがい（こい むらさきの 土）
  c10c_haniwa: {
    name: 'とりでのはにわ兵', lv: 115, hp: 1960, mp: 80, str: 520, def: 460, agi: 180, mag: 220, exp: 8820, gold: 3040,
    race: 'material', size: 'm', hit: 'slash', region: 6,
    resist: { ice: 1.3, blast: 1.2, fire: 0.6, wind: 1.0, bolt: 1.0, light: 1.0, dark: 1.0, poison: 0, sleep: 0, confuse: 0.3 }, drops: { common: ['silver_shard', 12], rare: ['c7i_snow_mail', 80] },
    actions: [{ w: 3, id: 'm10c_hw_spear' }, { w: 2, id: 'm10c_hw_march', cond: 'notRecent:m10c_hw_march' }, { w: 1, id: 'm10c_hw_guard', cond: 'notRecent:m10c_hw_guard' }, { w: 1, id: 'attack' }],
    desc: '少年のとりでを守る、こいむらさきの土の人形の兵。かたいが、氷がよく効く。',
  },

  // ── 空の 中ボス: たいさムスカリ（うかぶ いせき。Lv114）──
  // c10c … しかけ（battle-c10c.js の colonel）
  //   lit … 雷の 前ぶれで 光る 石の 数（n … ふだん・half … HP 半分から）
  //   bolt … 大いなずま（光った 石に いる 人みんな。mult … 物理の 強さ・guardCut … 身を 守ると）
  //   tight … 同じ 石に この 人数 いじょうで「せまい！」（その 石の 人の 与える ダメージ tightK ばい）
  //   miss … 雷が 外れると 1回 休み・休む 番まで 受ける ダメージ taken ばい
  //   crack … 石を くずす（every 回の 雷ごとに 前ぶれ → 雷の 番に くずれる。turns … たいさが その 回数 動くまで 使えない）
  [C10C_COLONEL]: {
    name: COLONEL_NAME, short: 'ムスカリ', lv: 114, hp: 37000, mp: 9999, str: 5400, def: 390, agi: 240, mag: 1120, exp: 86000, gold: 30000,
    race: 'demon', size: 'xl', boss: true, turns: 1, speed: 1.32, hit: 'smash', artScale: 0.5,
    drops: { boss: ['c10cb_badge'], bonus: ['limit_stone'] },
    resist: { ...BOSS_STATUS, fire: 1.0, ice: 1.0, wind: 1.0, bolt: 0.5, light: 1.0, dark: 1.0 },
    c10c: {
      kind: 'colonel',
      lit: { n: 1, half: 2 },
      bolt: { mult: 0.7, guardCut: 0.3 },
      tight: 3, tightK: 0.5,
      miss: { taken: 1.5 },
      crack: { every: 3, turns: 2 },
      // 人数（家族の キャラの 数）で 合わせる [1人, 2人, 3人, 4人, 5人]: hp・atk … HP・与える ダメージの ばい・boltK … 大いなずまの 強さ・spd … はやさ
      //   solo … 仲間なしの ひとり。monK … 魔物の 仲間 1体ごとの HP・攻撃。tools/sim-ch10.mjs で 合わせた（docs/plan-part3-c10c.md の 実装メモ）
      //   第101回 R2班: 3人〜5人を 合わせ直し（人が 1人ずつ べつの 手で はかる 道具。4人・5人は HPを 下げ 攻撃を 上げて 短く）
      few: { hp: [0.6, 0.72, 0.7, 0.65, 0.55], atk: [0.65, 0.76, 0.85, 1.05, 1.1], boltK: [1.05, 1, 1, 1, 1], spd: [1, 1, 1, 1, 1] },
      //   bare … 仲間なしの 家族 [2人, 3人]（few より 先に きく）
      bare: { hp: [0.55, 0.62], atk: [0.6, 0.68] },
      //   ひとりは 光る 石が いつも 2つ（にげる 石は 1つ）・はやさ 0.7（光った あと、雷の 前に 1回 動ける ように）・大いなずまは 強い（当たると たおれる）
      solo: { hp: 0.15, atk: 0.3, boltK: 3, spd: 0.7, litN: 2, litHalf: 2 },
      monK: { hp: 0, atk: -0.06 },
    },
    actions: [{ w: 3, id: 'm10k_slab' }, { w: 2, id: 'm10k_spark', cond: 'notRecent:m10k_spark' }, { w: 2, id: 'm10k_flash' }],
    desc: 'むらさきの軍服に、丸いゴーグル。花のしるしのぼうしの、星くいの一族のたいさ。雷の石ばんで、うき石に雷を落とす。',
  },

  // ── 幕の ボス: アルゴル（星くいの少年。少年の 間。Lv116）──
  // c10c … しかけ（battle-c10c.js の algol）
  //   eat … 光を 食べる（every 回 動く ごとに。heal … 食べた 数 × 最大HPの わりあい・atkUp … 食べた 数 × 攻撃の 上がり・atkMax … 上がりの さい大）
  //   veil … やみの とばり（every 回 動く ごとに。前ぶれ なし・turns … アルゴルが その 回数 動くまで・k … 味方の 与える ダメージの ばい。てらすで 消える）
  //   ring … 星の音を かざす（every 回 動く ごとに 前ぶれ → 次の 番に 全体。mult・guardCut … 身を 守ると。前ぶれの 間に 星のうたで 止まる）
  //   end … HPが この わりあいに なると 戦いが 終わる（たおれない）
  [C10C_ALGOL]: {
    name: ALGOL_NAME, short: 'アルゴル', lv: 116, hp: 58000, mp: 9999, str: 6200, def: 400, agi: 260, mag: 1140, exp: 90000, gold: 31000,
    race: 'demon', size: 'xl', boss: true, turns: 1, speed: 1.25, hit: 'magic', artScale: 0.5, flying: true,
    drops: { boss: ['c10cb_gray_star'], bonus: ['limit_stone'] },
    resist: { ...BOSS_STATUS, fire: 1.0, ice: 1.0, wind: 1.0, bolt: 1.0, light: 1.1, dark: 0.5 },
    c10c: {
      kind: 'algol',
      eat: { every: 3, heal: 0.04, atkUp: 0.08, atkMax: 1.8 },
      veil: { every: 5, first: 2, turns: 3, k: 0.5 },
      ring: { every: 4, first: 3, mult: 0.65, guardCut: 0.3 },
      end: 0.3,
      // 人数で 合わせる（たいさと おなじ 形）。ringEvery … 星の音を かざす 回数（人が 少ない 時は 星のうたが 間に 合う ように 5回ごと）
      //   solo … 仲間なしの ひとり（星の音は 強い … 防御か 星のうたで ないと たおれる）
      few: { hp: [0.65, 0.7, 1, 1, 1], atk: [0.7, 0.74, 1, 1, 1], ringK: [1, 1, 1, 1, 1], ringEvery: [5, 5, 4, 4, 4], spd: [1, 1, 1, 1, 1] },
      solo: { hp: 0.15, atk: 0.3, ringK: 2 },
      monK: { hp: 0.02, atk: 0.01 },
    },
    actions: [{ w: 3, id: 'm10y_cold' }, { w: 2, id: 'm10y_shard', cond: 'notRecent:m10y_shard' }, { w: 2, id: 'm10y_mantle' }],
    desc: '銀のかみに、こい色のマント。ひたいに、小さな灰色の星。星の光を集める、ふしぎな少年。',
  },
};

// 素材の ドロップ（loot.js の MAT_DROPS に まぜる。今の 素材だけ）
export const C10C_MAT_DROPS = {
  c10c_sheep: ['cloud_cotton', 3],
  c10c_ray: ['cloud_cotton', 4],
  c10c_puff: ['magic_powder', 3],
  c10c_jelly: ['star_sand', 3],
  c10c_carrier: ['star_sand', 3],
  c10c_mole: ['land_shard', 3],
  c10c_lamp: ['magic_powder', 3],
  c10c_haniwa: ['land_shard', 3],
};
