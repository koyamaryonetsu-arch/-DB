// 第2部 第6章 Step 1・2「千年前のミドリナ地方」「時のほこら」「時のいせき」の 魔物と、2体の ボス（B: 戦い。docs/plan-ch6.md の 9）
// monsters.js（MONSTERS）・loot.js（MAT_DROPS）が まぜる。ここは ほかの データを import しない（じゅんかんを さける）
// え は client/render/ch6-past-art.js。ボスの しかけ（砂が落ちきると…・まきもどし）は shared/battle-ch6.js
//
// 出現表（encounters-past.js）: t6_past_field＝千年前の フィールド（古い森と 時の ふしぎ）/ t6_shrine＝時のほこら（砂と 砂時計）/
//   t6_ruin_up＝時のいせき 1〜4階・t6_ruin_low＝5〜7階（からくり・いにしえの 番人・時の 魔物）
// おすすめ Lv: 時のほこら 56〜57・千年前の フィールド 57〜58・時のいせき 58〜60（plan-ch6.md の 8）。region: 6 … 空の レア装備の 地方（rare-loot.js の regionOf）
// 今の 魔物も 少し まぜる: 根っこのこびと（フィールド）・からくりの守り手と 石のガーゴイル（いせき。千年前に 作られた からくり）
//
// ・サンドクロック（sand_clock。時のほこらの いちばん 下。Lv58）… 砂時計の 体の 魔物。動く たびに 砂が 落ちていき、落ちきると「大砂流」
//   （前ぶれで 身を 守る）。氷の 攻撃を 当てると 砂が こおって 上に もどる。前ぶれの 間に 氷を 当てると 大砂流は 止まる
// ・ギアドン（geardon。時のいせきの 番人の間。Lv61）… ゼンマイの 番兵。ときどき「時を覚える」→ しばらくして「まきもどし」で、
//   おぼえた ときの HPまで キズが もとに もどる。覚えてから まきもどすまでの 間に 雷の 攻撃を 2回 当てると 歯車が こわれて 止まる

// ボスの じょうたい いじょうの 効きにくさ（第5章の ボスと おなじ）
const BOSS_STATUS = { sleep: 0, poison: 0.3, confuse: 0, blind: 0.3, silence: 0.2, paralyze: 0 };
export const SAND_CLOCK = 'sand_clock';
export const GEARDON = 'geardon';
export const PAST_BOSSES = [SAND_CLOCK, GEARDON];

export const MONSTERS_PAST = {
  // ── 千年前の フィールド（古い 森と、時の ふしぎ。Lv57〜58）──
  // こけむしツノジカ: 千年前の 森の ぬし。こけの 生えた 大きな ツノ
  moss_deer: {
    name: 'こけむしツノジカ', lv: 57, hp: 1520, mp: 60, str: 242, def: 170, agi: 128, mag: 120, exp: 1500, gold: 640,
    race: 'beast', size: 'l', hit: 'bash', region: 6,
    resist: { fire: 1.3, wind: 0.8, poison: 0.6, sleep: 0.5, confuse: 0.6 }, drops: { common: ['jou_herb', 10], rare: ['seed_hp', 40] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm6_md_horn' }, { w: 2, id: 'm6_md_stomp', cond: 'notRecent:m6_md_stomp' }, { w: 1, id: 'm6_md_call', cond: 'notRecent:m6_md_call' }],
    desc: '千年前の森にすむ、大きなシカ。こけの生えたツノで、とっしんしてくる。森の仲間をよぶと、みんなの守りが上がる。炎がよく効く。',
  },
  // こはくのガ: こはく色の はねの ガ。こはくの 光で 時を とじこめる
  amber_moth: {
    name: 'こはくのガ', lv: 57, hp: 1080, mp: 160, str: 170, def: 128, agi: 150, mag: 222, exp: 1440, gold: 620,
    race: 'beast', size: 'm', flying: true, region: 6,
    resist: { wind: 1.35, fire: 1.1, light: 0.7, poison: 0.5, sleep: 0, confuse: 0.5 }, drops: { common: ['magic_water', 10], rare: ['seed_mag', 36] },
    actions: [{ w: 3, id: 'm6_am_amber' }, { w: 2, id: 'm6_am_wing', cond: 'notRecent:m6_am_wing' }, { w: 2, id: 'm6_am_dust', cond: 'notRecent:m6_am_dust' }, { w: 1, id: 'attack' }],
    desc: 'こはく色のはねのガ。こはくの光をあびると、時が止まったように体がかたまる。りんぷんでねむらせることも。風がよく効く。',
  },
  // 古木の子ども: 千年前の 森の 古い 木から 生まれた 木の 子。木の実で 仲間を 回復する
  elder_sprout: {
    name: '古木の子ども', lv: 58, hp: 1660, mp: 120, str: 222, def: 192, agi: 70, mag: 196, exp: 1560, gold: 660,
    race: 'plant', size: 'm', hit: 'bash', region: 6,
    resist: { fire: 1.4, ice: 0.9, wind: 0.6, bolt: 0.8, poison: 0.3, sleep: 0.6, confuse: 0.5 }, drops: { common: ['jou_herb', 10], rare: ['seed_def', 36] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm6_es_root' }, { w: 2, id: 'm6_es_leaf', cond: 'notRecent:m6_es_leaf' }, { w: 2, id: 'm6_es_nut', cond: ['allyHurt', 'notRecent:m6_es_nut'] }],
    desc: '千年前の森の、古い木から生まれた木の子ども。ねっこで足をしばり、木の実で仲間を回復する。炎がよく効く。',
  },
  // ときうさぎ: 首から 大きな 時計を さげた うさぎ。いつも いそいで いて、とても 素早い
  toki_hare: {
    name: 'ときうさぎ', lv: 58, hp: 1020, mp: 80, str: 214, def: 120, agi: 232, mag: 140, exp: 1480, gold: 700,
    race: 'beast', size: 's', hit: 'bash', region: 6,
    resist: { ice: 1.3, wind: 0.8, poison: 0.7, sleep: 0.7, confuse: 0.4 }, drops: { common: ['herb', 4], rare: ['seed_agi', 36] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm6_th_kick' }, { w: 1, id: 'm6_th_hurry', cond: 'notRecent:m6_th_hurry' }, { w: 2, id: 'm6_th_bell', cond: 'notRecent:m6_th_bell' }],
    desc: '首から大きな時計をさげた、白いうさぎ。「いそげ、いそげ」と、いつもあわてている。とても素早い。氷がよく効く。',
  },

  // ── 時のほこら（砂と 砂時計。Lv56〜57）。どれも 氷が よく 効く（砂が こおって かたまる）──
  // 砂つぶの精: さらさらの 砂で できた 小さな 精
  sand_sprite: {
    name: '砂つぶの精', lv: 56, hp: 980, mp: 160, str: 160, def: 120, agi: 162, mag: 214, exp: 1380, gold: 600,
    race: 'spirit', size: 's', flying: true, region: 6,
    resist: { ice: 1.3, wind: 0.6, fire: 0.8, poison: 0, sleep: 0.4, confuse: 0.4 }, drops: { common: ['magic_water', 10], rare: ['seed_mag', 36] },
    actions: [{ w: 3, id: 'm6_sp_flow' }, { w: 2, id: 'm6_sp_throw', cond: 'notRecent:m6_sp_throw' }, { w: 1, id: 'm6_sp_hide', cond: 'notRecent:m6_sp_hide' }, { w: 2, id: 'attack' }],
    desc: 'さらさらの砂でできた、小さな精。砂をかけて、前を見えなくする。砂の中にかくれると、攻撃が当たりにくい。氷がよく効く。',
  },
  // 砂時計サソリ: しっぽの 先が 小さな 砂時計の サソリ
  glass_scorpion: {
    name: '砂時計サソリ', lv: 57, hp: 1420, mp: 80, str: 234, def: 192, agi: 110, mag: 120, exp: 1480, gold: 640,
    race: 'beast', size: 'm', hit: 'claw', region: 6,
    resist: { ice: 1.3, fire: 0.7, wind: 0.8, poison: 0, sleep: 0.5, confuse: 0.5 }, drops: { common: ['antidote', 4], rare: ['seed_str', 36] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm6_gs_tail' }, { w: 2, id: 'm6_gs_claw' }, { w: 1, id: 'm6_gs_shell', cond: 'notRecent:m6_gs_shell' }],
    desc: 'しっぽの先が、小さな砂時計になったサソリ。どくばりでさし、はさみで2回はさむ。氷がよく効く。',
  },
  // 砂の番兵: ほこらを 守る、砂で できた 大きな 番兵。キズは 砂を あつめて なおす
  sand_golem: {
    name: '砂の番兵', lv: 57, hp: 1740, mp: 60, str: 248, def: 202, agi: 60, mag: 120, exp: 1560, gold: 680,
    race: 'material', size: 'l', hit: 'bash', region: 6,
    resist: { ice: 1.35, bolt: 0.7, fire: 0.8, wind: 0.7, poison: 0, sleep: 0.3, confuse: 0.3 }, drops: { common: ['jou_herb', 10], rare: ['seed_def', 36] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm6_sgl_fist' }, { w: 2, id: 'm6_sgl_pit', cond: 'notRecent:m6_sgl_pit' }, { w: 2, id: 'm6_sgl_mend', cond: ['hpBelow:0.5', 'notRecent:m6_sgl_mend'], limit: 2 }],
    desc: '時のほこらを守る、砂でできた大きな番兵。すなじごくで足をとる。キズは、まわりの砂を集めてなおしてしまう。氷がよく効く。',
  },

  // ── 時のいせき 1〜4階（からくりと いにしえの 番人。Lv58〜59）──
  // 歯車カブト: 背中に 歯車の ある カブトムシ。ぜんまいを まくと 強く なる
  gear_beetle: {
    name: '歯車カブト', lv: 58, hp: 1500, mp: 60, str: 242, def: 216, agi: 100, mag: 120, exp: 1560, gold: 680,
    race: 'beast', size: 'm', hit: 'bash', region: 6,
    resist: { bolt: 1.4, fire: 0.9, ice: 0.9, poison: 0.4, sleep: 0.5, confuse: 0.5 }, drops: { common: ['jou_herb', 10], rare: ['seed_str', 36] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm6_gb_horn' }, { w: 2, id: 'm6_gb_spin', cond: 'notRecent:m6_gb_spin' }, { w: 1, id: 'm6_gb_wind', cond: 'notRecent:m6_gb_wind' }],
    desc: '背中に歯車のある、大きなカブトムシ。ぜんまいをまくと、攻撃力が上がる。雷がよく効く。',
  },
  // いにしえの番兵: 千年前に 作られたばかりの 時の神殿を 守る 石の 番兵
  ruin_sentinel: {
    name: 'いにしえの番兵', lv: 59, hp: 1820, mp: 80, str: 254, def: 222, agi: 66, mag: 150, exp: 1640, gold: 720,
    race: 'material', size: 'l', hit: 'slash', region: 6,
    resist: { blast: 1.35, bolt: 1.1, fire: 0.8, ice: 0.8, dark: 0.7, poison: 0, sleep: 0.3, confuse: 0.3 }, drops: { common: ['magic_water', 12], rare: ['seed_def', 36] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm6_rsn_spear' }, { w: 2, id: 'm6_rsn_beam', cond: 'notRecent:m6_rsn_beam' }, { w: 1, id: 'm6_rsn_guard', cond: 'notRecent:m6_rsn_guard' }],
    desc: '時の神殿を守る、石の番兵。千年前は、まだ作られたばかり。石のやりでつき、目から光をはなつ。爆発がよく効く。',
  },
  // ふりこコウモリ: 時計の ふりこの ように 体を ゆらして とぶ コウモリ
  pendulum_bat: {
    name: 'ふりこコウモリ', lv: 58, hp: 1100, mp: 120, str: 202, def: 130, agi: 190, mag: 190, exp: 1500, gold: 660,
    race: 'beast', size: 's', flying: true, hit: 'claw', region: 6,
    resist: { fire: 1.3, light: 1.2, wind: 0.7, dark: 0.6, poison: 0.5, sleep: 0.5, confuse: 0.3 }, drops: { common: ['herb', 4], rare: ['seed_agi', 36] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm6_pdb_swing' }, { w: 2, id: 'm6_pdb_ring', cond: 'notRecent:m6_pdb_ring' }, { w: 2, id: 'm6_pdb_tick', cond: 'notRecent:m6_pdb_tick' }],
    desc: '時計のふりこのように、体を右へ左へゆらしてとぶコウモリ。キーンという音で、頭が混乱する。炎がよく効く。',
  },

  // ── 時のいせき 5〜7階（時の 魔物。Lv59〜60）──
  // ときの守り手: 時の神殿の おくを 守る よろいの からくり。動きを おそくする
  chrono_knight: {
    name: 'ときの守り手', lv: 60, hp: 2000, mp: 100, str: 282, def: 226, agi: 90, mag: 170, exp: 1720, gold: 760,
    race: 'material', size: 'l', hit: 'slash', region: 6,
    resist: { bolt: 1.35, dark: 0.7, ice: 0.8, wind: 0.8, poison: 0, sleep: 0.3, confuse: 0.3 }, drops: { common: ['jou_herb', 10], rare: ['seed_hp', 40] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm6_ck_blade' }, { w: 2, id: 'm6_ck_slow', cond: 'notRecent:m6_ck_slow' }, { w: 2, id: 'm6_ck_stop', cond: 'notRecent:m6_ck_stop' }],
    desc: '時の神殿のおくを守る、よろいのからくり。時の剣で切りかかり、みんなの動きをおそくする。雷がよく効く。',
  },
  // まきもどしのゆうれい: 時の 流れに まよいこんだ ゆうれい。仲間の キズを まきもどして なおす
  rewind_ghost: {
    name: 'まきもどしのゆうれい', lv: 59, hp: 1240, mp: 200, str: 180, def: 140, agi: 120, mag: 238, exp: 1620, gold: 720,
    race: 'undead', size: 'm', flying: true, region: 6,
    resist: { light: 1.5, dark: 0, ice: 0.8, poison: 0, sleep: 0.4, confuse: 0.4 }, drops: { common: ['magic_water', 12], rare: ['seed_mag', 36] },
    actions: [{ w: 3, id: 'm6_rg_hand' }, { w: 3, id: 'm6_rg_rewind', cond: ['allyHurt', 'notRecent:m6_rg_rewind'] }, { w: 2, id: 'm6_rg_song', cond: 'notRecent:m6_rg_song' }, { w: 1, id: 'attack' }],
    desc: '時の流れにまよいこんだ、ゆうれい。仲間のキズを「もとにもどれ」で、まきもどしてなおしてしまう。先にたおそう。光がよく効く。',
  },
  // とけいグモ: 体が 時計の 文字ばんの クモ。秒針の 糸で 足を とめる
  clock_spider: {
    name: 'とけいグモ', lv: 60, hp: 1520, mp: 100, str: 266, def: 182, agi: 130, mag: 170, exp: 1680, gold: 740,
    race: 'beast', size: 'm', hit: 'bite', region: 6,
    resist: { fire: 1.35, ice: 0.9, poison: 0, sleep: 0.5, confuse: 0.5 }, drops: { common: ['antidote', 4], rare: ['seed_agi', 36] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm6_cs_fang' }, { w: 2, id: 'm6_cs_web', cond: 'notRecent:m6_cs_web' }, { w: 2, id: 'm6_cs_jump' }],
    desc: '体が時計の文字ばんになっているクモ。秒針の糸で足をとめ、毒のキバでかみつく。炎がよく効く。',
  },

  // ── 時のほこらの いちばん 下: 砂時計の まもの サンドクロック（Lv58）──
  // ch6.sand … 砂（max … いっぱい・fast … HPが fastAt より へった あとの いっぱい・ice … 氷を 当てた ときに もどる 砂・stopTo … 大砂流を 止めた ときの 砂）
  [SAND_CLOCK]: {
    name: 'サンドクロック', lv: 58, hp: 19000, mp: 3000, str: 680, def: 190, agi: 104, mag: 520, exp: 24000, gold: 8000,
    race: 'material', size: 'xl', boss: true, turns: 2, speed: 0.95, hit: 'bash', drops: { boss: ['p6_sand_pendant'], rare: ['p6_sand_staff', 1] },
    resist: { ...BOSS_STATUS, ice: 0.8, fire: 0.8, wind: 0.6, bolt: 0.9, blast: 1.1, light: 1.1, dark: 0.8 },
    ch6: { kind: 'sand', sand: { max: 6, fast: 5, fastAt: 0.5, ice: 1, stopTo: 2 } },
    actions: [
      { w: 2, id: 'attack' }, { w: 3, id: 'm6_sc_spray' }, { w: 3, id: 'm6_sc_swing' },
      { w: 2, id: 'm6_sc_storm', cond: 'notRecent:m6_sc_storm' }, { w: 2, id: 'm6_sc_sink', cond: 'notRecent:m6_sc_sink' },
      // 砂が 落ちきった: かならず 大砂流の 前ぶれ（battle-ch6.js の ch6TurnStart が 出す。これは 出しそこねた ときの ため）
      { w: 99, id: 'm6_sc_fall_charge', cond: 'c5:scEmpty' },
    ],
    phases: [
      { hpBelow: 0.5, msg: ['サンドクロックのガラスが、ぎらりと光った！', '攻撃力が上がった！'], buff: { atk: 1.12 } },
      { hpBelow: 0.2, msg: ['サンドクロックのガラスに、ひびが入った！', '守りが弱くなった！'], debuff: { def: 0.75 } },
    ],
    desc: '影の時計師ゼンマイの家来。砂時計の体の魔物。動くたびに、中の砂が落ちていく。砂が落ちきると「大砂流」。そのときは身を守ろう。氷を当てると、砂がこおって上にもどる。前ぶれのときに氷を当てれば、大砂流を止められる。',
  },
  // ── 時のいせきの 番人の間: ゼンマイの 番兵 ギアドン（Lv61）──
  // ch6.gear … まきもどし（every … 何回 動くと 時を おぼえるか・fastEvery … HPが fastAt より へった あと・wind … 覚えてから まきもどすまでの 回数・
  //            need … 歯車を こわすのに いる 雷の 回数・cut … こわした あとの 守り）
  [GEARDON]: {
    name: 'ギアドン', lv: 61, hp: 29000, mp: 3000, str: 735, def: 230, agi: 108, mag: 540, exp: 28000, gold: 9000,
    race: 'material', size: 'xl', boss: true, turns: 2, speed: 0.7, hit: 'bash', drops: { boss: ['p6_gear_charm'], rare: ['p6_tick_sword', 1] },
    resist: { ...BOSS_STATUS, bolt: 1.0, blast: 1.15, ice: 0.8, fire: 0.9, wind: 0.8, light: 1.0, dark: 0.7 },
    ch6: { kind: 'gear', gear: { every: 4, fastEvery: 3, fastAt: 0.4, wind: 4, need: 2, cut: 0.75 } },
    actions: [
      { w: 2, id: 'attack' }, { w: 3, id: 'm6_gd_fist' }, { w: 2, id: 'm6_gd_cog', cond: 'notRecent:m6_gd_cog' },
      { w: 2, id: 'm6_gd_hand' }, { w: 2, id: 'm6_gd_steam', cond: 'notRecent:m6_gd_steam' },
      // ギアプレスの 前ぶれ（まきもどしの 間は しない。前ぶれは 1つずつ）
      { w: 1, id: 'm6_gd_press_charge', cond: ['c5:gdIdle', 'notRecent:m6_gd_press_charge'] },
    ],
    phases: [
      { hpBelow: 0.6, msg: ['ギアドンの歯車が、はやく回り始めた！'], buff: { atk: 1.1 } },
      { hpBelow: 0.4, msg: ['ギアドン「…ジカン…モドス…！」', '（時を覚えるのが、はやくなった…！）'] },
      { hpBelow: 0.2, msg: ['ギアドンの体から、ねじがはずれ始めた！', '守りが弱くなった！'], debuff: { def: 0.75 } },
    ],
    desc: '影の時計師ゼンマイの番兵。歯車とぜんまいの体。ときどき「時を覚える」と、しばらくして「まきもどし」で、キズがもとにもどってしまう。覚えている間に、雷の攻撃を2回当てると、むねの大歯車がこわれて止まる。大歯車をかかげたら、ギアプレスの前ぶれ。',
  },
};

// 素材の ドロップ（loot.js の MAT_DROPS に まぜる）。新しい 素材 2つ（れん金で 使う。items-past.js）
//   時の砂（時のほこら・千年前の フィールド）・古い歯車（時のいせき）
export const PAST_MAT_DROPS = {
  moss_deer: ['p6_time_sand', 5],
  amber_moth: ['p6_time_sand', 4],
  elder_sprout: ['p6_time_sand', 5],
  toki_hare: ['p6_time_sand', 4],
  sand_sprite: ['p6_time_sand', 3],
  glass_scorpion: ['p6_time_sand', 4],
  sand_golem: ['p6_time_sand', 3],
  gear_beetle: ['p6_old_gear', 3],
  ruin_sentinel: ['p6_old_gear', 4],
  pendulum_bat: ['p6_old_gear', 4],
  chrono_knight: ['p6_old_gear', 3],
  rewind_ghost: ['p6_old_gear', 4],
  clock_spider: ['p6_old_gear', 4],
};
