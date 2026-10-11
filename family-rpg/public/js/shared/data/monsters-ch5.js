// 第5章 Step 2「星の塔」の 魔物と 星の番人アルゴス（B: 戦い）
// monsters.js（MONSTERS）・loot.js（MAT_DROPS）が まぜる。ここは ほかの データを import しない（じゅんかんを さける）
// え は client/render/ch5-tower-art.js。たたかいの しかけ（見通しの目）は shared/battle-ch5.js
//
// 出現表（encounters-ch5.js）: t5_tower_low＝1〜4階（石の 塔の 魔物）・t5_tower_high＝5〜8階（星空の 魔物）。昼と 夜の 区別は ない
// おすすめ Lv41〜42（第26回で 経験値を ×0.6 に した ことを 考えて 合わせた。docs/plan-ch5.md の「12」）
//
// ・星の番人アルゴス（argos）: 目が 3つの 守り手。2回行動。
//   見通しの目 … 「アルゴスの3つの目が、〇〇をじっと見ている…」で、その 人の 次の 行動の 種類（攻撃・呪文・回復・防御）を 読む。
//   読まれた 種類の 行動を そのまま 使うと、攻撃は かわして 反撃・呪文は はね返す・回復は かき消す・防御は 見ぬいて くずす。
//   ちがう 種類の 行動を すれば 外れて、アルゴスの 目が くらむ（つぎの 番が おそく なる）。HPが へると 2人を 同時に 読む（foresee.two）
//   星の光（みんな）・重力（1人の 素早さを 下げる）・三つ目の光線・前ぶれの ある 星のさばき（身を 守ると 半分）

// ボスの じょうたい いじょうの 効きにくさ（第3章・第4章の ボスと おなじ）
const BOSS_STATUS = { sleep: 0.1, poison: 0.3, confuse: 0.1, blind: 0.3, silence: 0.2, paralyze: 0.1 };

export const MONSTERS_CH5 = {
  // ── 1〜4階（石の塔）──
  // 石のガーゴイル: かべに とまった 石像。石の体で 守りを かためる（その 間は 呪文で）
  stone_gargoyle: {
    name: '石のガーゴイル', lv: 40, hp: 560, mp: 30, str: 150, def: 150, agi: 52, mag: 60, exp: 480, gold: 210,
    race: 'demon', size: 'm', flying: true, hit: 'slash',
    resist: { blast: 1.3, bolt: 1.2, fire: 0.6, ice: 0.7, poison: 0, sleep: 0.3, confuse: 0.4, blind: 0.5 }, drops: { common: ['moonherb', 8], rare: ['seed_def', 40] },
    actions: [{ w: 4, id: 'attack' }, { w: 3, id: 'm_garg_dive' }, { w: 1, id: 'm_stone_skin', cond: 'notRecent:m_stone_skin' }],
    desc: '星の塔のかべにとまっている、石のガーゴイル。人が通ると動き出す。石の体になると守りがとてもかたくなるので、呪文で戦おう。爆発がよく効く。',
  },
  // からくりの守り手: 昔の 勇者の 時代の からくり。反撃の構え（物理で なぐると 反撃）
  clockwork_guard: {
    name: 'からくりの守り手', lv: 41, hp: 640, mp: 20, str: 152, def: 160, agi: 44, mag: 40, exp: 520, gold: 240,
    race: 'material', size: 'm', hit: 'slash',
    resist: { bolt: 1.4, blast: 1.2, ice: 0.8, poison: 0, sleep: 0, confuse: 0.3, blind: 0.5 }, drops: { common: ['magic_water', 14], rare: ['seed_str', 40] },
    actions: [
      { w: 3, id: 'attack' }, { w: 3, id: 'm_gear_cutter' }, { w: 1, id: 'm_clock_stance', cond: 'notRecent:m_clock_stance' },
      { w: 1, id: 'm_clock_wind', cond: 'notRecent:m_clock_wind' },
    ],
    desc: '昔の勇者の時代に作られた、塔を守るからくり。歯車の音を止めたら、反撃の構え。雷がよく効く。',
  },
  // 塔のつむじ風: 塔の 中を ふきあがる 風の 魔物。風の 呪文
  tower_wind: {
    name: '塔のつむじ風', lv: 40, hp: 400, mp: 120, str: 110, def: 84, agi: 78, mag: 128, exp: 440, gold: 200,
    race: 'spirit', size: 's', flying: true,
    resist: { wind: 0.2, ice: 1.3, fire: 0.8, poison: 0, sleep: 0.4, confuse: 0.6 }, drops: { common: ['herb', 5], rare: ['seed_agi', 40] },
    actions: [{ w: 3, id: 'm_tower_gust', cond: 'notRecent:m_tower_gust' }, { w: 3, id: 'm_wind_cut' }, { w: 2, id: 'attack' }, { w: 1, id: 'piorimu', cond: 'notRecent:piorimu' }],
    desc: '星の塔のかいだんを、下から上へふきあがるつむじ風。風のやいばをとばしてくる。氷がよく効く。',
  },

  // ── 5〜8階（星空）──
  // 星くらげ: 星空を ただよう くらげ。仲間を 回復する（先に たおす）
  star_jelly: {
    name: '星くらげ', lv: 42, hp: 480, mp: 160, str: 100, def: 96, agi: 60, mag: 140, exp: 520, gold: 230,
    race: 'spirit', size: 'm', flying: true,
    resist: { light: 0.5, bolt: 1.3, dark: 1.2, poison: 0.3, sleep: 0.4, confuse: 0.5 }, drops: { common: ['magic_water', 10], rare: ['seed_mag', 44] },
    actions: [
      { w: 4, id: 'm_jelly_heal', cond: 'allyHurt' }, { w: 3, id: 'm_star_dust', cond: 'notRecent:m_star_dust' }, { w: 2, id: 'm_jelly_sting' }, { w: 2, id: 'attack' },
    ],
    desc: '塔の上の星空をただよう、光るくらげ。星のしずくで、仲間のキズを回復する。先にたおそう。雷がよく効く。',
  },
  // ほうき星の鳥: 星の 尾を 引いて とぶ 鳥。もえながら つっこむ
  comet_bird: {
    name: 'ほうき星の鳥', lv: 42, hp: 600, mp: 40, str: 160, def: 100, agi: 80, mag: 90, exp: 540, gold: 240,
    race: 'beast', size: 'm', flying: true, hit: 'bite',
    resist: { fire: 0.5, wind: 0.7, ice: 1.3, bolt: 1.2, sleep: 0.4, confuse: 0.5 }, drops: { common: ['moonherb', 8], rare: ['seed_agi', 44] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm_comet_dive' }, { w: 2, id: 'm_double_peck' }, { w: 1, id: 'm_comet_tail', cond: 'notRecent:m_comet_tail' }],
    desc: '星のしっぽを引いて夜空をとぶ鳥。もえながらつっこんでくる。氷がよく効き、炎は効きにくい。',
  },
  // 星見の目玉: アルゴスの 目に にた 目玉の 魔物。光線と、呪文を ふうじる まなざし
  gazer_eye: {
    name: '星見の目玉', lv: 43, hp: 520, mp: 140, str: 120, def: 104, agi: 64, mag: 136, exp: 560, gold: 260,
    race: 'demon', size: 's', flying: true,
    resist: { light: 0.5, dark: 1.3, blast: 1.2, poison: 0.4, sleep: 0.5, confuse: 0.5, blind: 0 }, drops: { common: ['star_shard', 24], rare: ['seed_mag', 48] },
    actions: [{ w: 3, id: 'm_eye_beam' }, { w: 2, id: 'm_glare', cond: 'notRecent:m_glare' }, { w: 1, id: 'm_eye_seal', cond: 'notRecent:m_eye_seal' }, { w: 2, id: 'attack' }],
    desc: '星の番人アルゴスの目からこぼれた、と言われる目玉の魔物。目から光線を出し、呪文を見やぶってふうじる。闇がよく効く。',
  },

  // ── ボス（8階・塔の てっぺん）──
  argos: {
    name: '星の番人アルゴス', lv: 44, hp: 9200, mp: 400, str: 174, def: 104, agi: 58, mag: 140, exp: 16000, gold: 6500,
    race: 'material', size: 'xl', boss: true, turns: 2, speed: 0.68, hit: 'slash', drops: { boss: ['argos_pendant'] },
    resist: { ...BOSS_STATUS, sleep: 0, confuse: 0, bolt: 1.3, dark: 1.15, light: 0.4, fire: 0.85 },
    // 見通しの目（battle-ch5.js）: two … HPが この わりあいより へると 2人を 同時に 読む。
    // counter … 攻撃を 見切った ときの 反撃の 強さ。bounce … はね返した 呪文の 強さ（となえた 人の さいだいHPの cap まで）。
    // daze … 読みが 外れた ときに へる アルゴスの こうどうゲージ
    foresee: { two: 0.45, counter: 0.6, bounce: 0.45, cap: 0.18, daze: 10 },
    actions: [
      { w: 2, id: 'attack' }, { w: 3, id: 'm_argos_gaze', cond: 'c5:gaze' },
      { w: 2, id: 'm_argos_starlight', cond: 'notRecent:m_argos_starlight' }, { w: 2, id: 'm_argos_gravity', cond: 'notRecent:m_argos_gravity' },
      { w: 2, id: 'm_argos_beam' }, { w: 2, id: 'm_argos_charge', cond: ['notRecent:m_argos_charge', 'notRecent:m_argos_judge'] },
    ],
    phases: [
      { hpBelow: 0.45, msg: ['アルゴスの3つの目が、すべて大きく開いた！', '（これからは、2人の行動を同時に読んでくる…！）'] },
      { hpBelow: 0.25, msg: ['アルゴスの体の星もようが、赤くかがやいた！', 'アルゴスの攻撃力が上がった！'], buff: { atk: 1.2 } },
    ],
    desc: '星の塔のてっぺんで「天のとばり」を守る、星の番人。3つの目で、次にだれが何をするかを見通す。目にじっと見られたら、読まれた種類（攻撃・呪文・回復・防御）とはちがう行動をしよう。目に星の光が集まったら「星のさばき」の前ぶれ。身を守ろう。雷がよく効き、光はほとんど効かない。',
  },
};

// 素材の ドロップ（loot.js の MAT_DROPS に まぜる）
export const CH5_MAT_DROPS = {
  stone_gargoyle: ['iron_shard', 4],
  clockwork_guard: ['iron_shard', 3],
  tower_wind: ['wind_feather', 4],
  star_jelly: ['magic_powder', 4],
  comet_bird: ['wind_feather', 3],
  gazer_eye: ['magic_powder', 5],
};
