// 第5章 Step 5「星読みの里」の まわりと「ノクトの思い出の迷宮」の 魔物と、ボス ノクトの影（B: 戦い）
// monsters.js（MONSTERS）・loot.js（MAT_DROPS）が まぜる。ここは ほかの データを import しない（じゅんかんを さける）
// え は client/render/ch5-hoshiyomi-mon-art.js。たたかいの しかけ（職業の まね・合体技の よやくを こわす）は shared/battle-nocto.js
//
// 出現表（encounters-hoshiyomi.js）: t5_village＝星読みの里の まわり / t5_memory＝思い出の迷宮 1〜3階 / t5_memory_deep＝4〜6階
// おすすめ Lv47（第26回で 経験値を ×0.6 に した ことを 考えて 合わせた。docs/plan-ch5.md の「14」）
// region: 6 … ふつうの 魔物が まれに 落とす「空の レア装備」の 地方（data/rare-loot.js の regionOf）
//
// アニメの 敵ふう（docs/idea-r35.md の K。名前は そのままの 名前を 使わない）
//   黒ずくめの追っ手（黒の組織の 手下ふう。里の まわり）・さびしさのゆうれい（オリジナル）・
//   たましいすい（吸魂鬼ふう。光が とても よく 効く）・ひとがたの影（ホムンクルスふう。赤い石で じわじわ 回復する）
//
// ・ノクトの影（nocto_shadow）: 思い出の迷宮の いちばん 下の きまった 戦い。shared/battle-nocto.js
//   職業の まね … 戦いの はじめと、何回か 動く ごとに、パーティーの だれか 1人の すがたと 職業を まねる（第4章の 鏡のうつし身の 考え方）。
//                 まねて いる 間は、その 人の 技（回復を のぞく）を 使う ことが ある。まねられた 人の 攻撃は 見切られて、ダメージが 半分
//   合体技の よやくを こわす … 合体技を 見ると、前ぶれ「きずなを じっと にらんでいる」→ 次の 番に「きずなくだき」（みんなに とても 大きい）。
//                 合体技の よやくを して いる 組は、その 組の だれかが 身を 守って いれば 守れる。守れないと よやくが くだかれ、影が 強く なる

// ボスの じょうたい いじょうの 効きにくさ（ガイアイーターと おなじ）
const BOSS_STATUS = { sleep: 0.1, poison: 0.3, confuse: 0.1, blind: 0.3, silence: 0.2, paralyze: 0.1 };
export const NOCTO = 'nocto_shadow';

export const MONSTERS_HOSHIYOMI = {
  // ── 星読みの里の まわり ──
  // 黒ずくめの追っ手: 黒い 服の 男。だれかを さがしている。けむり玉・しのびうち・あやしい くすり
  black_agent: {
    name: '黒ずくめの追っ手', lv: 47, hp: 860, mp: 60, str: 196, def: 138, agi: 92, mag: 90, exp: 760, gold: 420,
    race: 'demon', size: 'm', hit: 'slash', region: 6,
    resist: { bolt: 1.3, dark: 0.7, light: 1.0, poison: 0.4, sleep: 0.4, confuse: 0.5, blind: 0.5 }, drops: { common: ['smoke_ball', 10], rare: ['seed_agi', 120] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm_agent_shot' }, { w: 2, id: 'm_agent_smoke', cond: 'notRecent:m_agent_smoke' }, { w: 1, id: 'm_agent_drug', cond: 'notRecent:m_agent_drug' }],
    desc: '黒い服に黒いぼうしの、あやしい男。だれかを探して、星読みの里のまわりをうろついている。雷がよく効く。',
  },
  // 星読みフクロウ: 夜空を 見上げる 大きな フクロウ。星の まなざしで 混乱させる
  star_owl: {
    name: '星読みフクロウ', lv: 46, hp: 760, mp: 120, str: 176, def: 120, agi: 96, mag: 150, exp: 720, gold: 360,
    race: 'beast', size: 'm', flying: true, hit: 'slash', region: 6,
    resist: { fire: 1.3, wind: 0.6, dark: 0.8, poison: 0.5, sleep: 0.3, confuse: 0.3 }, drops: { common: ['moon_drop', 10], rare: ['seed_mag', 120] },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_owl_wind' }, { w: 2, id: 'm_owl_gaze', cond: 'notRecent:m_owl_gaze' }, { w: 2, id: 'm_owl_dive' }],
    desc: '星読みの里の夜空を見上げる、大きなフクロウ。星のまなざしで、頭をくらくらさせる。炎がよく効く。',
  },
  // 星くずスライム: 星くずを まとった スライム。きらきら 光る
  stardust_slime: {
    name: '星くずスライム', lv: 45, hp: 640, mp: 100, str: 160, def: 150, agi: 80, mag: 140, exp: 680, gold: 340,
    race: 'slime', size: 's', region: 6,
    resist: { dark: 1.3, light: 0.4, ice: 0.8, poison: 0.5, sleep: 0.4, confuse: 0.5 }, drops: { common: ['herb', 5], rare: ['seed_def', 120] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm_stardust_hop' }, { w: 2, id: 'm_stardust_shine', cond: 'notRecent:m_stardust_shine' }],
    desc: '流れ星のかけらをすいこんだスライム。体の中で星くずがきらきら光る。闇がよく効く。',
  },

  // ── ノクトの思い出の迷宮（1〜3階）──
  // さびしさのゆうれい: ひとりぼっちの きもちが 形に なった ゆうれい。なみだの しずく・しがみつく・さびしい 歌
  lonely_ghost: {
    name: 'さびしさのゆうれい', lv: 47, hp: 820, mp: 180, str: 150, def: 118, agi: 88, mag: 186, exp: 780, gold: 380,
    race: 'undead', size: 'm', flying: true, region: 6,
    resist: { light: 1.4, dark: 0.3, ice: 0.6, poison: 0, sleep: 0, confuse: 0.5 }, drops: { common: ['magic_water', 10], rare: ['seed_mag', 120] },
    actions: [{ w: 3, id: 'm_ghost_tear' }, { w: 2, id: 'm_ghost_cling' }, { w: 2, id: 'm_ghost_song', cond: 'notRecent:m_ghost_song' }, { w: 1, id: 'attack' }],
    desc: 'ひとりぼっちのさびしさが、形になったゆうれい。だれかにしがみついて、はなれようとしない。光がよく効く。',
  },
  // ひとりぼっちの人形: 思い出の 中に すてられた ぬいぐるみ。くるくる 回って ぶつかる
  lonely_doll: {
    name: 'ひとりぼっちの人形', lv: 46, hp: 780, mp: 60, str: 184, def: 130, agi: 84, mag: 100, exp: 740, gold: 360,
    race: 'material', size: 's', hit: 'slash', region: 6,
    resist: { fire: 1.3, ice: 0.9, dark: 0.7, poison: 0, sleep: 0.5, confuse: 0.4 }, drops: { common: ['moonherb', 8], rare: ['seed_def', 120] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm_doll_spin' }, { w: 1, id: 'm_doll_mend', cond: ['hpBelow:0.6', 'notRecent:m_doll_mend'] }, { w: 2, id: 'm_doll_stare', cond: 'notRecent:m_doll_stare' }],
    desc: '思い出の中にわすれられた、ぬいぐるみの人形。だれかにだきしめてほしくて、くるくる回る。炎がよく効く。',
  },
  // かげぼうし: 足もとの 影が ひとりで 歩きだした もの。影ふみで 動けなくする
  kage_boushi: {
    name: 'かげぼうし', lv: 47, hp: 760, mp: 100, str: 188, def: 112, agi: 108, mag: 130, exp: 780, gold: 370,
    race: 'spirit', size: 'm', region: 6,
    resist: { light: 1.35, dark: 0.2, bolt: 0.9, poison: 0, sleep: 0.3, confuse: 0.5, blind: 0.3 }, drops: { common: ['herb', 5], rare: ['seed_agi', 120] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm_shade_step' }, { w: 2, id: 'm_shade_melt', cond: 'notRecent:m_shade_melt' }],
    desc: '足もとの影が、ひとりで歩きだしたもの。影をふまれると、体が動かなくなる。光がよく効く。',
  },

  // ── ノクトの思い出の迷宮（4〜6階）──
  // たましいすい: ぼろぼろの マントの かげ。まわりの しあわせと 力を すいとる。光が とても よく 効く
  soul_eater: {
    name: 'たましいすい', lv: 48, hp: 1000, mp: 200, str: 184, def: 126, agi: 90, mag: 200, exp: 940, gold: 440,
    race: 'undead', size: 'm', flying: true, region: 6,
    resist: { light: 1.6, dark: 0.2, ice: 0.4, fire: 1.1, poison: 0, sleep: 0, confuse: 0.4, blind: 0.5 }, drops: { common: ['magic_water', 10], rare: ['seed_mag', 108] },
    actions: [{ w: 3, id: 'm_soul_kiss' }, { w: 2, id: 'm_soul_chill', cond: 'notRecent:m_soul_chill' }, { w: 2, id: 'm_soul_joy', cond: 'notRecent:m_soul_joy' }, { w: 1, id: 'attack' }],
    desc: 'ぼろぼろのマントをまとった、顔の見えないかげ。近づくと、こおりつくようにさむくなり、しあわせな気持ちがすいとられていく。光がとてもよく効く。',
  },
  // ひとがたの影: 人の 形を まねた 影。赤い 石の 力で キズが ふさがる
  homunculus_shade: {
    name: 'ひとがたの影', lv: 48, hp: 1060, mp: 120, str: 196, def: 140, agi: 86, mag: 150, exp: 960, gold: 450,
    race: 'demon', size: 'm', hit: 'slash', region: 6,
    resist: { light: 1.3, dark: 0.3, fire: 0.9, poison: 0.3, sleep: 0.3, confuse: 0.3 }, drops: { common: ['jou_herb', 10], rare: ['seed_str', 108] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm_homun_claw' }, { w: 2, id: 'm_homun_blades', cond: 'notRecent:m_homun_blades' }, { w: 1, id: 'm_homun_stone', cond: ['hpBelow:0.75', 'notRecent:m_homun_stone'] }],
    desc: '人の形をまねて生まれた影。むねの赤い石の力で、キズがじわじわとふさがっていく。光がよく効く。',
  },

  // ── ボス（思い出の迷宮の いちばん 下）: ノクトの影 ──
  [NOCTO]: {
    name: 'ノクトの影', lv: 49, hp: 25300, mp: 3000, str: 400, def: 160, agi: 92, mag: 230, exp: 14000, gold: 5000,
    race: 'demon', size: 'l', boss: true, turns: 2, speed: 0.66, hit: 'slash', drops: { boss: ['shade_pendant'] },
    resist: { ...BOSS_STATUS, sleep: 0, confuse: 0, light: 1.25, dark: 0.3 },
    // battle-nocto.js: mimicEvery … まねを かえる まで の 行動の 回数 / mimicRate … まねた 人の 技を 使う わりあい /
    //   half … まねられた 人の 攻撃は 見切られて half ばい / bond … きずなくだき（物理 mult ばい・守り ignoreDef むし・よやくを くだくと 攻撃力 buff ばい）
    nocto: { mimicEvery: 4, mimicRate: 0.45, half: 0.5, bond: { mult: 3.3, ignoreDef: 0.3, buff: 1.2 } },
    actions: [
      { w: 3, id: 'attack' }, { w: 3, id: 'm_ns_blade' }, { w: 2, id: 'm_ns_dark', cond: 'notRecent:m_ns_dark' },
      // 合体技の よやくが ある とき（よく ねらう）・ない ときも ときどき
      { w: 7, id: 'm_ns_bond_watch', cond: ['c5:nsBond', 'notRecent:m_ns_bond_watch', 'notRecent:m_ns_bond_break'] },
      { w: 1, id: 'm_ns_bond_watch', cond: ['notRecent:m_ns_bond_watch', 'notRecent:m_ns_bond_break'] },
      // まねる 人を かえる「影のまね」（m_ns_mimic）は mimicEvery 回 動くと かならず（battle-nocto.js の noctoAction）
    ],
    phases: [
      { hpBelow: 0.5, msg: ['ノクトの影が、こい闇をまとった！', 'ノクトの影の攻撃力が上がった！'], buff: { atk: 1.15 } },
    ],
    desc: '思い出の迷宮のいちばん下にいる、ノクトの影。向き合った人のすがたと職業をまねて、同じ技を使う。合体技をしようとすると、つながる手をこわしにくる。',
  },
};

// 素材の ドロップ（loot.js の MAT_DROPS に まぜる）。星の砂（里の まわり）・影のしずく（思い出の 迷宮の 影の 魔物）
export const HOSHIYOMI_MAT_DROPS = {
  black_agent: ['shade_drop', 6],
  star_owl: ['star_sand', 4],
  stardust_slime: ['star_sand', 3],
  lonely_ghost: ['shade_drop', 4],
  lonely_doll: ['star_sand', 5],
  kage_boushi: ['shade_drop', 3],
  soul_eater: ['shade_drop', 3],
  homunculus_shade: ['shade_drop', 3],
};
