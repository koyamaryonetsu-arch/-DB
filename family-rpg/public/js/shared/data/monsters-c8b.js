// 第2部 第8章 第2幕「よみの 青い火」（Step 3・4）の 魔物と、ボス 2組（B: 戦い。docs/plan-ch8.md の 6）
// monsters.js（MONSTERS）・loot.js（MAT_DROPS）が まぜる。ここは ほかの データを import しない（じゅんかんを さける）
// え は client/render/c8b-art.js。ボスの しかけは shared/battle-c8b.js（battle-c8a.js から よぶ）
//
// 出現表（encounters-c8b.js）: t8b_temple＝よみの 海底神殿 1〜4階（Lv83〜85）・t8b_deep＝5〜8階（Lv85〜87）
// 手下の 魔物 5しゅ（どれも 仲間に なる）。家族が えらんだ 出どころ: ディズニーの ヴィランの 手下（ヘラクレスの よみの国）・マリオの 敵
//   配合で 足りない 系統・ランク（docs/plan-r53-breed-more.md の 1）に 入れる
//   新しい 絵 3しゅ: ケロベロス（悪魔 F。よみの国の 番犬が もと。頭が 3つの 子犬）・ホネギョ（ゾンビ E。マリオの ホネの 魚が もと）・
//     青火のたましい（せいれい C。よみの国を さまよう 青い 火の たましい）
//   今の 絵の 色がえ 2しゅ: ビリクラゲ（スライム D。マリオの しびれる クラゲが もと。鏡くらげの 色がえ）・
//     ヒドラン（ドラゴン A。ヘラクレスの 頭の 多い 大へびが もと。雲海へびの 色がえ）
//   ランクは 出やすさ（encounters-c8b.js の 重み）と 仲間に なりやすさ（companions-c8b.js の rate）で きまる（tools/gen-monster-ranks.mjs）
//   region: 6 … ふつうの 魔物が まれに 落とす「空の レア装備」の 地方（第6章・第7章・第8章 第1幕と おなじ）
//
// ・ペイニックと パニクル（c8_painpanic ＋ c8_panicle。Step 3 の さいごの 中ボス。Lv84。よみの王の 手下の 小おに 2ひき）… battle-c8b.js の imps
//   2ひきとも 生きている 間は、どちらかが 1回 動く たびに「ばけばけ」の しるし（b.c8imps.left。はじめは imps.every）が 1つ へる。
//   のこり imps.plot いかで「ひそひそ相談」。その 間に どちらかに 大きな ダメージ（その 魔物の HP の imps.breakAt いじょう）を 1回で 当てると、
//   作戦が ばれて「けんか」（2ひきとも 1回 動けない・しるしは もどる）。しるしが なくなると「ばけばけ大がったい」（みんなに 物理の 大技。身を 守ると 半分）
//   かたほうが たおれると、のこった ほうは「パニック」（panic.turns 回 動く 間、あたふた して 受ける ダメージ panic.k ばい）。
//   その 間に たおせないと「カンカン」（攻撃力 rage.atk ばい・はやさ rage.spd ばい・rage.every 回ごとに ひとりで ばけばけ）
// ・よみの王ハデロス（c8_hades。第2幕の さいごの ボス。Lv86。2だん）… battle-c8b.js の hades
//   1だんめ（青い 炎。氷に 弱い・炎に 強い）: contract.every 回 動く たびに「たましいのけいやく」… 1人に けいやくしょ。
//     ハデロスが 動く たびに その 人の HP を すいとり、contract.turns 回 動くと「たましいを いただく」（その 人は たおれる）。
//     けいやくの 間に ハデロスに 炎を 当てると（炎は あまり 効かないが）、けいやくしょが もえる（その 人は 助かる・ハデロスは あちちっと 1回 動けない）
//   HP が p2At より へると、かみの毛の 炎が 赤く ちらちら（前ぶれ）→ 次の 番に「おこったハデロス」。それまで HP は p2At より 下がらない
//   2だんめ（赤い 炎。炎に 弱い・氷に 強い。弱点が ひっくりかえる）: erupt.every 回 動く たびに「よみの大ふん火」（みんなに 炎の 大技。身を 守ると 半分）。
//     ふん火の 前ぶれの 間に 氷を 当てると（氷は あまり 効かないが）、頭が ひえて ふん火が しぼむ（その 番は 動けない）
// ・ボスの え は 今までの ボスの 2倍の こまかさ（size は 2倍・artScale: 0.5。docs/plan-ch7.md の 4-4）。
//   ハデロスの おこった すがたは おなじ え の コマ 2・3。小おにの パニックの すがたは コマ 2・3（client/battle-c8b.js の c8bSprite）

const BOSS_STATUS = { sleep: 0, poison: 0.3, confuse: 0, blind: 0.3, silence: 0.2, paralyze: 0 };
export const C8_PAIN = 'c8_painpanic';
export const C8_PANIC = 'c8_panicle';
export const C8_HADES = 'c8_hades';
export const C8B_BOSSES = [C8_PAIN, C8_HADES];
// 第8章 第2幕の 手下の 魔物（仲間に なる 5しゅ）
export const C8B_MINIONS = ['kerberos', 'bone_fish', 'biri_jelly', 'blue_soul', 'hydran'];
// ハデロスの 弱点（青い 炎 … 1だんめ。氷に 弱く 炎に 強い／赤い 炎 … 2だんめ。炎に 弱く 氷に 強い。炎と 氷が ひっくりかえる）
//   しかけを とめるのは「弱点でない ほう」: けいやくしょは 炎で もえる・ふん火は 氷で ひえる（オートは 弱点ばかり つかうので 気づかない）
export const HADES_BLUE = { fire: 0.5, ice: 1.5 };
export const HADES_RED = { fire: 1.5, ice: 0.5 };
// おこった ハデロスの 行動（変身した ときに 入れかわる）
export const RED_ACTIONS = [
  { w: 3, id: 'm8h_fist' }, { w: 2, id: 'm8h_flare', cond: 'notRecent:m8h_flare' }, { w: 1, id: 'm8h_shout', cond: 'notRecent:m8h_shout' }, { w: 1, id: 'attack' },
];

const IMPS = { every: 6, plot: 3, breakAt: 0.025, fuse: { mult: 1.3, ignoreDef: 0.3 }, panic: { turns: 2, k: 1.5 }, rage: { atk: 1.5, spd: 1.3, every: 2, mult: 0.9 } };

export const MONSTERS_C8B = {
  // ── よみの 海底神殿 1〜4階（Lv83〜85）──
  // ケロベロス: よみの国の 番犬の 子ども（ディズニーの ヴィランの 手下〈ヘラクレスの よみの国の 頭が 3つの 番犬〉。まだ 子犬）
  kerberos: {
    name: 'ケロベロス', lv: 83, hp: 2180, mp: 120, str: 294, def: 268, agi: 190, mag: 210, exp: 3700, gold: 1290,
    race: 'demon', size: 'm', hit: 'bite', region: 6,
    resist: { ice: 1.3, fire: 0.6, dark: 0.8, light: 1.0, poison: 0.5, sleep: 0.6, confuse: 0.5 }, drops: { common: ['jou_herb', 10], rare: ['c7i_snow_axe', 80] },
    actions: [{ w: 3, id: 'm8n_kb_bite' }, { w: 2, id: 'm8n_kb_fire', cond: 'notRecent:m8n_kb_fire' }, { w: 1, id: 'm8n_kb_howl', cond: 'notRecent:m8n_kb_howl' }, { w: 1, id: 'attack' }],
    desc: 'よみの国の番犬の子ども。頭が3つあって、いつも3つの頭でけんかしている。青い火の息をはく。氷がよく効く。',
  },
  // ホネギョ: 海の 底を およぐ、ホネだけの 魚（マリオの 敵）
  bone_fish: {
    name: 'ホネギョ', lv: 83, hp: 2060, mp: 100, str: 300, def: 240, agi: 220, mag: 180, exp: 3720, gold: 1300,
    race: 'undead', size: 'm', flying: true, hit: 'bite', region: 6,
    resist: { light: 1.4, dark: 0.5, fire: 1.0, ice: 1.0, bolt: 1.0, poison: 0, sleep: 0.4, confuse: 0.6 }, drops: { common: ['holy_water', 12], rare: ['c7i_snow_sword', 80] },
    actions: [{ w: 3, id: 'm8n_bf_bite' }, { w: 2, id: 'm8n_bf_dash', cond: 'notRecent:m8n_bf_dash' }, { w: 1, id: 'm8n_bf_rattle', cond: 'notRecent:m8n_bf_rattle' }, { w: 1, id: 'attack' }],
    desc: '海の底を、ホネだけでおよぐ魚。目が青く光り、まっすぐにつっこんでくる。光がよく効く。',
  },
  // ビリクラゲ: しびれる 電気の クラゲ（マリオの 敵。鏡くらげの 絵の 色がえ。青白く 光る）
  biri_jelly: {
    name: 'ビリクラゲ', lv: 84, hp: 2120, mp: 240, str: 250, def: 250, agi: 160, mag: 360, exp: 3800, gold: 1320,
    race: 'slime', size: 'm', flying: true, hit: 'claw', region: 6, art: 'mirror_jelly', artScale: 1.0, tint: { hueTo: 190, sat: 0.9, light: 1.15 },
    resist: { fire: 1.35, bolt: 0.3, ice: 1.0, wind: 1.0, light: 1.0, poison: 0.3, sleep: 0.5, confuse: 0.5 }, drops: { common: ['antidote', 14], rare: ['c7i_snow_staff', 80] },
    actions: [{ w: 3, id: 'm8n_bj_zap' }, { w: 2, id: 'm8n_bj_sting', cond: 'notRecent:m8n_bj_sting' }, { w: 1, id: 'm8n_bj_glow', cond: 'notRecent:m8n_bj_glow' }, { w: 1, id: 'attack' }],
    desc: 'ふわふわとただよう、しびれるクラゲ。さわると、ビリビリとしびれる。炎がよく効く。',
  },

  // ── よみの 海底神殿 5〜8階（Lv85〜87）──
  // 青火のたましい: よみの国を さまよう 青い 火の たましい（ディズニーの ヴィランの 手下〈ヘラクレスの よみの国の たましい〉）
  blue_soul: {
    name: '青火のたましい', lv: 85, hp: 1960, mp: 320, str: 236, def: 226, agi: 240, mag: 410, exp: 3900, gold: 1340,
    race: 'spirit', size: 'm', flying: true, hit: 'claw', region: 6,
    resist: { ice: 1.0, fire: 0.3, light: 1.35, dark: 0.4, wind: 1.0, poison: 0, sleep: 0.3, confuse: 0.3 }, drops: { common: ['magic_water', 12], rare: ['c7i_snow_fan', 80] },
    actions: [{ w: 3, id: 'm8n_bs_flame' }, { w: 2, id: 'm8n_bs_wail', cond: 'notRecent:m8n_bs_wail' }, { w: 2, id: 'm8n_bs_drain' }, { w: 1, id: 'attack' }],
    desc: 'よみの国をさまよう、青い火のたましい。さびしそうな声で、人の元気をすいとる。光がよく効く。',
  },
  // ヒドラン: 頭が いくつも ある 大へび（ディズニー〈ヘラクレスの 大へび〉。雲海へびの 絵の 色がえ。深い 海の みどり）。めったに 見ない
  hydran: {
    name: 'ヒドラン', lv: 86, hp: 2240, mp: 260, str: 318, def: 290, agi: 200, mag: 300, exp: 4100, gold: 1400,
    race: 'dragon', size: 'm', hit: 'bite', region: 6, art: 'sky_serpent', artScale: 0.8, tint: { hueTo: 150, sat: 0.75, light: 0.85 },
    resist: { fire: 1.35, ice: 0.8, bolt: 1.0, wind: 1.0, dark: 0.9, poison: 0.3, sleep: 0.4, confuse: 0.4 }, drops: { common: ['moon_drop', 20], rare: ['c7i_snow_spear', 80] },
    actions: [{ w: 3, id: 'm8n_hy_bite' }, { w: 2, id: 'm8n_hy_heads', cond: 'notRecent:m8n_hy_heads' }, { w: 1, id: 'm8n_hy_regrow', cond: 'notRecent:m8n_hy_regrow' }, { w: 1, id: 'attack' }],
    desc: '頭がいくつもある、海の底の大へび。頭をたおしても、すぐにまた生えてくる。めったに姿を見せない。炎がよく効く。',
  },

  // ── Step 3 の さいご: ペイニックと パニクル（中ボス。Lv84。2ひきで 1組）──
  // c8b.imps … しかけ（battle-c8b.js）
  //   every … ばけばけ大がったいまでの 行動の 数（2ひきの 行動を あわせて）/ plot … ひそひそ相談に なる しるしの 数 /
  //   breakAt … 相談の 間に けんかに なる 1回の ダメージ（その 魔物の HP の わりあい）/ fuse … ばけばけ大がったいの 強さ /
  //   panic … かたほうが たおれた あとの パニック（turns … 動く 数・k … ダメージの ばい）/ rage … カンカン（atk・spd・every … ひとりばけばけまで・mult）
  [C8_PAIN]: {
    name: 'ペイニック', short: 'ペイニック', lv: 84, hp: 44000, mp: 3000, str: 1100, def: 300, agi: 150, mag: 700, exp: 70000, gold: 20000,
    race: 'demon', size: 'xl', boss: true, turns: 1, speed: 0.8, hit: 'bash', artScale: 0.5,
    drops: { boss: ['c8i_imp_charm'], bonus: ['limit_stone'], rare: ['c8i_imp_club', 1] },
    resist: { ...BOSS_STATUS, light: 1.2, dark: 0.7, fire: 0.9, ice: 1.1, bolt: 1.0, wind: 1.0 },
    c8b: { kind: 'imps', role: 'pain', partner: C8_PANIC, imps: IMPS },
    actions: [{ w: 3, id: 'm8i_pound' }, { w: 2, id: 'm8i_belly', cond: 'notRecent:m8i_belly' }, { w: 1, id: 'm8i_tease', cond: 'notRecent:m8i_tease' }, { w: 1, id: 'attack' }],
    desc: 'よみの王の手下の、ずんぐりした小おに。ちょっと気が弱い。パニクルといっしょに、なんにでも、ばけることができる。',
  },
  // パニクルの 経験値・お金・落とす物は ペイニックに まとめる（2ひきで 1組）
  [C8_PANIC]: {
    name: 'パニクル', short: 'パニクル', lv: 84, hp: 34000, mp: 3000, str: 970, def: 260, agi: 260, mag: 880, exp: 0, gold: 0,
    race: 'demon', size: 'xl', boss: true, turns: 1, speed: 1.1, hit: 'claw', artScale: 0.5, drops: {},
    resist: { ...BOSS_STATUS, light: 1.2, dark: 0.7, fire: 1.0, ice: 0.9, bolt: 1.1, wind: 1.0 },
    c8b: { kind: 'imps', role: 'panic', partner: C8_PAIN, imps: IMPS },
    actions: [{ w: 3, id: 'm8i_scratch' }, { w: 2, id: 'm8i_bluefire', cond: 'notRecent:m8i_bluefire' }, { w: 1, id: 'm8i_trip', cond: 'notRecent:m8i_trip' }, { w: 1, id: 'attack' }],
    desc: 'よみの王の手下の、ひょろりとした小おに。すぐにあわてて、さわぎ出す。ペイニックといっしょだと、ちょうしにのる。',
  },

  // ── Step 4 の さいご: よみの王ハデロス（第2幕の さいごの ボス。Lv86。2だん）──
  // c8b … しかけ（battle-c8b.js）
  //   contract … たましいのけいやく（every … けいやくまでの 行動・turns … たましいを いただくまでの 行動・drain … 1回に すいとる HP の わりあい・
  //     heal … すいとった ときに もどる ハデロスの HP の わりあい・soulHeal … たましいを いただいた ときに もどる HP の わりあい）
  //   p2At・red … おこった すがた（atk … 上がる 攻撃力）/ erupt … よみの大ふん火（every・p3At・p3Every … はやく なる・base … 呪文の ダメージ・
//     chillAt … しるしが のこり これ いかの 間は 氷で ひやせる〈かみの 毛が 高く もえる〉）
  [C8_HADES]: {
    name: 'よみの王ハデロス', lv: 86, hp: 115000, mp: 6000, str: 1550, def: 300, agi: 220, mag: 940, exp: 80000, gold: 24000,
    race: 'demon', size: 'xl', boss: true, turns: 1, speed: 1.0, hit: 'bash', artScale: 0.5,
    drops: { boss: ['c8h_flame_charm'], bonus: ['limit_stone'], rare: ['c8h_bident', 1] },
    // 水は ふつう（water.js の WATER_OVERRIDE。炎の 魔物の きまりで 水に 弱く ならない ように。しかけは 炎と 氷）
    resist: { ...BOSS_STATUS, ...HADES_BLUE, light: 1.15, dark: 0.6, bolt: 1.0, wind: 1.0 },
    c8b: {
      kind: 'hades',
      contract: { every: 3, turns: 3, drain: 0.12, heal: 0.008, soulHeal: 0.04 },
      p2At: 0.5,
      red: { atk: 1.08 },
      erupt: { every: 3, p3At: 0.2, p3Every: 2, base: [640, 680], chillAt: 2 },
    },
    actions: [
      { w: 3, id: 'm8h_bluefire' }, { w: 2, id: 'm8h_skull', cond: 'notRecent:m8h_skull' }, { w: 1, id: 'm8h_talk', cond: 'notRecent:m8h_talk' }, { w: 1, id: 'attack' },
    ],
    phases: [
      { hpBelow: 0.2, msg: ['ハデロスの炎のかみが、ぼうぼうと、もえさかる…！', 'よみの大ふん火が、はやくなった…！'], buff: { atk: 1.04 } },
    ],
    desc: 'よみの国の王。青い炎のかみをした、おしゃべりな王さま。おこると、かみの毛が赤くもえ上がり、弱点もかわる。',
  },
};

// 素材の ドロップ（loot.js の MAT_DROPS に まぜる。今の 素材だけ。入手先の 画面に 出る）
// レアの ドロップは 第7章 第3幕の 雪の 村の 店の 装備（ランク10。千年前の 海の 村の 店にも ない 品）
export const C8B_MAT_DROPS = {
  kerberos: ['beast_fang', 4],
  bone_fish: ['pretty_shell', 4],
  biri_jelly: ['cs_black_pearl', 5],
  blue_soul: ['shade_drop', 3],
  hydran: ['dragon_scale', 3],
};
