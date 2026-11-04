// 第2部 第7章 第2幕「海の紋章」（Step 3・4）の 魔物と、ボス 2体（B: 戦い。docs/plan-ch7.md の 4）
// monsters.js（MONSTERS）・loot.js（MAT_DROPS）が まぜる。ここは ほかの データを import しない（じゅんかんを さける）
// え は client/render/c7s-art.js。ボスの しかけは shared/battle-c7s.js（battle-c7.js から よぶ）
//
// 出現表（encounters-c7s.js）: t7_sea＝千年前の クモイの 海の フィールド（Lv72〜74）・t7_light＝しずむ前の島の灯台（Lv74〜76）
// 手下の 魔物 5しゅ（どれも 仲間に なる）。家族が えらんだ 出どころ: ディズニーの ヴィランの 手下・マリオの 敵・アニメの 敵の 手下
//   配合で 足りない 系統・ランク（docs/plan-r53-breed-more.md の 1。第7章 第1幕までで うまった 所は のぞく）に 入れる
//   新しい 絵 2しゅ: ジュゲム（せいれい D）・魚人の海賊（ドラゴン C）
//   今の 絵の 色がえ 3しゅ: プクプク（ドラゴン F。トビウオン）・カロン（ゾンビ E。がいこつ剣士）・海賊オウム（悪魔 A。ストームバード）
//   ランクは 出やすさ（encounters-c7s.js の 重み）と 仲間に なりやすさ（companions-c7s.js の rate）で きまる（tools/gen-monster-ranks.mjs）
//   region: 6 … ふつうの 魔物が まれに 落とす「空の レア装備」の 地方（第6章・第7章 第1幕と おなじ）
//
// ・海賊船ジョリーホック号（c7_reef。Step 3 の さいごの 中ボス。Lv74）… battle-c7s.js の tide「しおの満ち引き」
//   満ち潮（high 回 動く 間）は 船が 自由に 動き、さいごに「いっせいほうげき」（みんなに 物理の 大技。身を 守ると 半分）。
//   ほうげきの はんどうで 引き潮に なり、船は サンゴしょうに のり上げる（low 回 動く 間。動けず、受ける ダメージが aground ばい）→ また 満ち潮。
//   HP が p2At より へると 満ち潮が p2High 回に（ほうげきが はやく 来る）
// ・ホック船長（c7_light。灯台の ボス。Lv76。2だん）… battle-c7s.js の captain「板わたり」
//   every 回 動く たびに「板わたりの号令」: 1人を 船の 板の 先へ 歩かせる（動けない・回復も とどかない）。
//   次に 船長が 動くと（steps 歩め）海へ ドボン（戦えなくなる）・大波が みんなを おそう（身を 守ると 半分）。仲間が「手をのばす」と すぐ もどる。
//   HP が p2At より へると every が p2Every に
// ・ボスの え は 今までの ボスの 2倍の こまかさ（size は 2倍・artScale: 0.5 で 見た目は 今までと おなじ。docs/plan-ch7.md の 4-4）

const BOSS_STATUS = { sleep: 0, poison: 0.3, confuse: 0, blind: 0.3, silence: 0.2, paralyze: 0 };
export const C7_REEF = 'c7_reef';
export const C7_LIGHT = 'c7_light';
export const C7S_BOSSES = [C7_REEF, C7_LIGHT];
// 第7章 第2幕の 手下の 魔物（仲間に なる 5しゅ）
export const C7S_MINIONS = ['pukupuku', 'karon', 'jugemu', 'fish_pirate', 'pirate_parrot'];

export const MONSTERS_C7S = {
  // ── 千年前の クモイの 海（島と サンゴしょう。Lv72〜74）──
  // プクプク: 海から ピョーンと とび出す 赤い 魚（マリオの 敵。トビウオンの 絵の 色がえ）
  pukupuku: {
    name: 'プクプク', lv: 72, hp: 1760, mp: 80, str: 272, def: 210, agi: 196, mag: 200, exp: 2280, gold: 900,
    race: 'dragon', size: 's', flying: true, hit: 'bite', region: 6, art: 'tobiuo', artScale: 1.1, tint: { hueTo: 4, sat: 1.15, light: 1.0 },
    resist: { bolt: 1.35, fire: 0.85, ice: 1.0, poison: 0.5, sleep: 0.6, confuse: 0.6 }, drops: { common: ['jou_herb', 10], rare: ['c7s_island_dagger', 80] },
    actions: [{ w: 3, id: 'm7s_pk_jump' }, { w: 2, id: 'm7s_pk_splash', cond: 'notRecent:m7s_pk_splash' }, { w: 1, id: 'attack' }],
    desc: '海からピョーンととび出す、赤くてまるい魚。むれで、つぎつぎにとびかかってくる。雷がよく効く。',
  },
  // カロン: こうらを せおった ほねの カメ（マリオの 敵。がいこつ剣士の 絵の 色がえ）。たおれると バラバラに なるが、また 組み上がる
  karon: {
    name: 'カロン', lv: 72, hp: 1820, mp: 80, str: 284, def: 236, agi: 140, mag: 180, exp: 2300, gold: 910,
    race: 'undead', size: 'm', hit: 'slash', region: 6, art: 'skeleton', artScale: 1.05, tint: { hueTo: 40, sat: 0.3, light: 1.3 },
    resist: { light: 1.4, dark: 0.3, fire: 1.1, poison: 0, sleep: 0.3, confuse: 0.5 }, drops: { common: ['jou_herb', 10], rare: ['c7s_island_axe', 80] },
    actions: [{ w: 3, id: 'm7s_kr_bone' }, { w: 1, id: 'm7s_kr_crumble', cond: 'notRecent:m7s_kr_crumble' }, { w: 2, id: 'attack' }],
    desc: 'こうらをせおった、ほねのカメ。ほねをブーメランのように投げてくる。バラバラになっても、また組み上がる。光がよく効く。',
  },
  // ジュゲム: 雲に のって、上から トゲの たまを 落とす 子分（マリオの 敵）
  jugemu: {
    name: 'ジュゲム', lv: 73, hp: 1700, mp: 180, str: 250, def: 200, agi: 210, mag: 290, exp: 2320, gold: 920,
    race: 'spirit', size: 'm', flying: true, hit: 'bash', region: 6,
    resist: { wind: 1.35, bolt: 0.8, fire: 1.0, ice: 1.0, poison: 0.3, sleep: 0.5, confuse: 0.5 }, drops: { common: ['magic_water', 12], rare: ['c7s_island_staff', 80] },
    actions: [{ w: 3, id: 'm7s_jg_spiny' }, { w: 2, id: 'm7s_jg_rain', cond: 'notRecent:m7s_jg_rain' }, { w: 1, id: 'm7s_jg_cloud', cond: 'notRecent:m7s_jg_cloud' }, { w: 1, id: 'attack' }],
    desc: 'にこにこ顔の雲にのった、メガネのカメ。空の上から、トゲトゲのたまを落としてくる。風がよく効く。',
  },

  // ── しずむ前の島の灯台（Lv74〜76）──
  // 魚人の海賊: サメの 顔の 魚人の 海賊（アニメの 敵の 手下〈魚人の 海賊団〉）。サーベルと 魚人の からて
  fish_pirate: {
    name: '魚人の海賊', lv: 75, hp: 2060, mp: 120, str: 306, def: 240, agi: 150, mag: 200, exp: 2560, gold: 980,
    race: 'dragon', size: 'm', hit: 'slash', region: 6,
    resist: { bolt: 1.35, ice: 0.9, fire: 0.85, poison: 0.5, sleep: 0.5, confuse: 0.5 }, drops: { common: ['jou_herb', 10], rare: ['c7s_island_sword', 80] },
    actions: [{ w: 3, id: 'm7s_fp_saber' }, { w: 2, id: 'm7s_fp_karate', cond: 'notRecent:m7s_fp_karate' }, { w: 1, id: 'm7s_fp_shout', cond: 'notRecent:m7s_fp_shout' }, { w: 1, id: 'attack' }],
    desc: 'サメの顔の、魚人の海賊。サーベルと、水をはじく魚人のからてで戦う。雷がよく効く。',
  },
  // 海賊オウム: 船長の かたに のる、おしゃべりな オウム（ディズニーの ヴィランの 手下〈悪い 大臣の オウム〉。ストームバードの 絵の 色がえ）。めったに 見ない
  pirate_parrot: {
    name: '海賊オウム', lv: 76, hp: 1720, mp: 220, str: 262, def: 200, agi: 230, mag: 330, exp: 2700, gold: 1000,
    race: 'demon', size: 's', flying: true, hit: 'claw', region: 6, art: 'storm_bird', artScale: 0.95, tint: { hueTo: 356, sat: 1.25, light: 1.05 },
    resist: { light: 1.35, dark: 0.5, wind: 0.8, poison: 0.5, sleep: 0.5, confuse: 0.3 }, drops: { common: ['magic_water', 12], rare: ['c7s_island_fan', 80] },
    actions: [{ w: 3, id: 'm7s_pp_peck' }, { w: 2, id: 'm7s_pp_mimic', cond: 'notRecent:m7s_pp_mimic' }, { w: 2, id: 'm7s_pp_curse', cond: 'notRecent:m7s_pp_curse' }, { w: 1, id: 'attack' }],
    desc: '船長のかたにのる、赤いオウム。人の口まねをして、からかってくる。めったに姿を見せない。光がよく効く。',
  },

  // ── Step 3 の さいご: 海賊船ジョリーホック号（中ボス。Lv74）──
  // c7s.tide … しかけ（battle-c7s.js）
  //   high … 満ち潮の 間の 行動の 数（さいごが いっせいほうげき）/ low … 引き潮（のり上げ）の 間の 行動の 数 /
  //   p2At・p2High … 2だんめ（HP が へると 満ち潮が みじかく なる）/ broadside … いっせいほうげきの 強さ / aground … のり上げて いる 間に 受ける ダメージの ばい
  [C7_REEF]: {
    name: 'ジョリーホック号', lv: 74, hp: 66000, mp: 3000, str: 1380, def: 250, agi: 120, mag: 640, exp: 48000, gold: 14000,
    race: 'material', size: 'xl', boss: true, turns: 1, speed: 0.8, hit: 'bash', artScale: 0.5, drops: { boss: ['c7r_anchor_charm'], rare: ['c7r_anchor_axe', 1] },
    resist: { ...BOSS_STATUS, fire: 1.2, bolt: 1.0, ice: 0.9, light: 1.0, dark: 0.9, wind: 1.1 },
    c7s: { kind: 'tide', tide: { high: 4, low: 3, p2At: 0.5, p2High: 3, broadside: { mult: 1.2, ignoreDef: 0.3 }, aground: 1.5 } },
    actions: [{ w: 3, id: 'm7r_cannon' }, { w: 2, id: 'm7r_crew', cond: 'notRecent:m7r_crew' }, { w: 1, id: 'm7r_barrel', cond: 'notRecent:m7r_barrel' }, { w: 1, id: 'm7r_anchor', cond: 'notRecent:m7r_anchor' }],
    phases: [
      { hpBelow: 0.5, msg: ['手下たち「ホック船長に、しかられるぞ！」', '海賊たちが、たいほうに、どんどん火薬をつめこんだ！', '（いっせいほうげきが、はやくなった…！）'], buff: { atk: 1.08 } },
      { hpBelow: 0.2, msg: ['ジョリーホック号のマストが、ミシミシと音を立てた…！', '守りが弱くなった！'], debuff: { def: 0.85 } },
    ],
    desc: 'ホック船長の手下たちがのる、黒い海賊船。しおが満ちるとたいほうをうちまくり、しおが引くと、サンゴしょうにのり上げて動けなくなる。',
  },

  // ── Step 4 の さいご: ホック船長（灯台の ボス。Lv76。2だん）──
  // c7s.plank … しかけ（battle-c7s.js）
  //   every … 板わたりの号令までの 行動の 数 / p2At・p2Every … 2だんめ（はやく なる）/ steps … 板の 先までの 歩数（船長が 動く たびに 1歩。さいごの 1歩で ドボン）/
  //   wave … ドボンの 大波の 強さ
  [C7_LIGHT]: {
    name: 'ホック船長', lv: 76, hp: 86000, mp: 4000, str: 1650, def: 266, agi: 140, mag: 780, exp: 52000, gold: 15000,
    race: 'demon', size: 'xl', boss: true, turns: 1, speed: 1.1, hit: 'claw', artScale: 0.5, drops: { boss: ['c7l_hook_charm'], rare: ['c7l_gold_hook', 1] },
    resist: { ...BOSS_STATUS, light: 1.15, bolt: 1.1, dark: 0.75, ice: 0.95, fire: 0.95, wind: 1.0 },
    c7s: { kind: 'captain', plank: { every: 3, p2At: 0.5, p2Every: 2, steps: 1, wave: { mult: 1.35, ignoreDef: 0.3 } } },
    actions: [
      { w: 3, id: 'm7l_hook' }, { w: 2, id: 'm7l_saber', cond: 'notRecent:m7l_saber' }, { w: 2, id: 'm7l_cannon', cond: 'notRecent:m7l_cannon' },
      { w: 1, id: 'm7l_laugh', cond: 'notRecent:m7l_laugh' }, { w: 1, id: 'attack' },
    ],
    phases: [
      { hpBelow: 0.5, msg: ['…チクタク…チクタク…', 'ホック船長「こ、この音は…！ワニのやつめ、ここまで来たのか！」', 'ホック船長は、あわててサーベルをふり回し始めた！', '（板わたりの号令が、はやくなった…！）'], buff: { atk: 1.1 }, addActions: [{ w: 2, id: 'm7l_frenzy', cond: 'notRecent:m7l_frenzy' }] },
      { hpBelow: 0.2, msg: ['灯台の下で、チクタクワニが、大きな口を開けて待っている…！', 'ホック船長の足が、ガクガクふるえている！守りが弱くなった！'], debuff: { def: 0.85 } },
    ],
    desc: '千年前の海をあらす、海賊の船長。右手は金のかぎ。じゃまな者を「板わたり」で海へ落とし、大波をおこす。チクタクという時計の音が、大きらい。',
  },
};

// 素材の ドロップ（loot.js の MAT_DROPS に まぜる。今の 素材だけ。入手先の 画面に 出る）
// レアの ドロップは 島の 店の 装備
export const C7S_MAT_DROPS = {
  pukupuku: ['pretty_shell', 4],
  karon: ['silver_shard', 4],
  jugemu: ['cloud_cotton', 4],
  fish_pirate: ['dragon_scale', 3],
  pirate_parrot: ['cs_black_pearl', 3],
};
