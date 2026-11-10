// 第2部 第8章 第1幕「月の王宮の うらぎり」（Step 1・2）の 魔物と、ボス 2体（B: 戦い。docs/plan-ch8.md の 5）
// monsters.js（MONSTERS）・loot.js（MAT_DROPS）が まぜる。ここは ほかの データを import しない（じゅんかんを さける）
// え は client/render/c8a-art.js。ボスの しかけは shared/battle-c8a.js（battle-c7i.js から よぶ）
//
// 出現表（encounters-c8a.js）: t8a_palace＝月の王宮の 地下迷宮 1〜4階（Lv80〜82）・t8a_deep＝5〜8階（Lv82〜84）
// 手下の 魔物 5しゅ（どれも 仲間に なる）。家族が えらんだ 出どころ: ディズニーの ヴィランの 手下・マリオの 敵（アラジンの 世界の 砂と 月の 宮殿）
//   配合で 足りない 系統・ランク（docs/plan-r53-breed-more.md の 1）に 入れる
//   新しい 絵 3しゅ: 宮殿の衛兵（悪魔 F。大臣に あやつられた 王宮の 衛兵）・サンボ（植物 E。マリオの 敵）・ランプのけむり（せいれい C。大臣の 黒い ランプから 出る けむり）
//   今の 絵の 色がえ 2しゅ: コブラー（ドラゴン D。マリオの 敵。水かげの大へびの 色がえ）・月のスカラベ（けもの A。アラジンの 金の スカラベ。黄金虫の 色がえ）
//   ランクは 出やすさ（encounters-c8a.js の 重み）と 仲間に なりやすさ（companions-c8a.js の rate）で きまる（tools/gen-monster-ranks.mjs）
//   region: 6 … ふつうの 魔物が まれに 落とす「空の レア装備」の 地方（第6章・第7章と おなじ）
//
// ・オウムのイアゴン（c8_vizier_pet。Step 1 の さいごの 中ボス。Lv81。大臣の かっている 大きな オウム）… battle-c8a.js の parrot「オウムがえし」
//   every 回 動く たびに「オウムがえし」（m8p_echo）。その 前の listen 回（しるしが のこり listen いか）の 間は「聞き耳」:
//   その 間に 味方が イアゴンに 当てた 呪文を 覚える（max まで。頭の 上の ふきだし）。オウムがえしで、覚えた 呪文を みんなに はね返す
//   （覚えた 数だけ 強い・さいごの 呪文の 属性。身を 守ると 半分）。何も 覚えて いないと、オウムがえしは しっぱいして 目を まわす
//   （次の 番は 動けない・守りが 下がる）。HP が p2At より へると every が p2Every に（はやく なる）
// ・大臣ジャハール（c8_jafar。第1幕の さいごの ボス。Lv83。3だん）… battle-c8a.js の vizier
//   1だんめ（へびの つえの 魔術師）: 横に「へびのつえ」（c8_staff。べつの 敵）。staff.every 回 動く たびに「さいみんじゅつ」（1人を あやつる … こんらん）。
//     つえを こわすと、あやつられた 人は 目を さまし、ジャハールは うろたえて 1回 動けない。つえは staff.regrow 回 動くと もどる
//   HP が p2At より へると、次の 番に「大へびの姿」（大きな コブラ）。それまで HP は p2At より 下がらない
//   2だんめ（大きな コブラ）: cobra.every 回 動く たびに「とぐろをまく」。とぐろの 間に 攻撃すると かみつかれる（カウンター）。
//     次の コブラの 番に「大へびのいちげき」（かみついた 数だけ 強い）。だれも 攻撃しなければ からぶりして のびきる（open.turns 回 ダメージ open.k ばい）
//   HP が p3At より へると、次の 番に「ランプの魔人」。横に「黒いランプ」（c8_lamp）が あらわれる
//   3だんめ（ランプの 魔人）: genie.every 回 動く たびに「むげんの魔力」（みんなに 闇の 大技。身を 守ると 半分）。
//     ランプを こわすと、魔人は 自分の ランプに すいこまれる（seal.turns 回 動けない・受ける ダメージ seal.k ばい）。出てくると ランプは また ともる
// ・ボスの え は 今までの ボスの 2倍の こまかさ（size は 2倍・artScale: 0.5。docs/plan-ch7.md の 4-4）。
//   ジャハールの コブラは おなじ え の コマ 2・3、魔人は コマ 4・5（client/battle-c8a.js の c8aSprite）

const BOSS_STATUS = { sleep: 0, poison: 0.3, confuse: 0, blind: 0.3, silence: 0.2, paralyze: 0 };
export const C8_PET = 'c8_vizier_pet';
export const C8_JAFAR = 'c8_jafar';
export const C8_STAFF = 'c8_staff';
export const C8_LAMP = 'c8_lamp';
export const C8A_BOSSES = [C8_PET, C8_JAFAR];
// 第8章 第1幕の 手下の 魔物（仲間に なる 5しゅ）
export const C8A_MINIONS = ['palace_guard', 'sanbo', 'cobrar', 'lamp_smoke', 'moon_scarab'];
// 大きな コブラの すがたの 行動（変身した ときに 入れかわる）
export const COBRA_ACTIONS = [
  { w: 3, id: 'm8c_bite' }, { w: 2, id: 'm8c_tail', cond: 'notRecent:m8c_tail' }, { w: 1, id: 'm8c_hiss', cond: 'notRecent:m8c_hiss' }, { w: 1, id: 'attack' },
];
// ランプの 魔人の すがたの 行動
export const GENIE_ACTIONS = [
  { w: 3, id: 'm8g_fist' }, { w: 2, id: 'm8g_fire', cond: 'notRecent:m8g_fire' }, { w: 1, id: 'm8g_wish', cond: 'notRecent:m8g_wish' }, { w: 1, id: 'attack' },
];

export const MONSTERS_C8A = {
  // ── 月の王宮の 地下迷宮 1〜4階（Lv80〜82）──
  // 宮殿の衛兵: 大臣に あやつられた 王宮の 衛兵（ディズニーの ヴィランの 手下〈アラジンの 王宮の 衛兵たち〉。ターバンと 三日月の 刀）
  palace_guard: {
    name: '宮殿の衛兵', lv: 80, hp: 2080, mp: 100, str: 292, def: 262, agi: 170, mag: 200, exp: 3200, gold: 1150,
    race: 'demon', size: 'm', hit: 'slash', region: 6,
    resist: { light: 1.3, dark: 0.7, fire: 1.0, ice: 1.0, poison: 0.5, sleep: 0.6, confuse: 0.4 }, drops: { common: ['jou_herb', 10], rare: ['c7i_snow_sword', 80] },
    actions: [{ w: 3, id: 'm8n_pg_slash' }, { w: 2, id: 'm8n_pg_rush', cond: 'notRecent:m8n_pg_rush' }, { w: 1, id: 'm8n_pg_guard', cond: 'notRecent:m8n_pg_guard' }, { w: 1, id: 'attack' }],
    desc: '大臣にあやつられた、王宮の衛兵。ターバンをまき、三日月の形の刀をふり回す。目がぼんやりしている。光がよく効く。',
  },
  // サンボ: 砂の 中から のびる、まるい サボテンの つみかさね（マリオの 敵）
  sanbo: {
    name: 'サンボ', lv: 80, hp: 2140, mp: 120, str: 284, def: 250, agi: 110, mag: 240, exp: 3220, gold: 1160,
    race: 'plant', size: 'm', hit: 'bash', region: 6,
    resist: { fire: 1.4, ice: 0.9, bolt: 1.0, wind: 0.8, poison: 0.4, sleep: 0.6, confuse: 0.6 }, drops: { common: ['magic_water', 12], rare: ['c7i_snow_axe', 80] },
    actions: [{ w: 3, id: 'm8n_sb_needle' }, { w: 2, id: 'm8n_sb_roll', cond: 'notRecent:m8n_sb_roll' }, { w: 1, id: 'm8n_sb_grow', cond: 'notRecent:m8n_sb_grow' }, { w: 1, id: 'attack' }],
    desc: 'まるいサボテンが、いくつもつみかさなった魔物。とげで、ちくちくさしてくる。上の顔だけが本体らしい。炎がよく効く。',
  },
  // コブラー: つぼの 中や 砂の 中から とび出す へび（マリオの 敵。水かげの大へびの 絵の 色がえ。金色の へびと 砂だまり）
  cobrar: {
    name: 'コブラー', lv: 81, hp: 2060, mp: 140, str: 296, def: 240, agi: 200, mag: 260, exp: 3300, gold: 1180,
    race: 'dragon', size: 'm', hit: 'bite', region: 6, art: 'shade_serpent', artScale: 0.72, tint: { hueTo: 42, sat: 0.85, light: 1.4 },
    resist: { ice: 1.35, fire: 0.8, bolt: 1.0, wind: 1.0, poison: 0, sleep: 0.6, confuse: 0.6 }, drops: { common: ['antidote', 14], rare: ['c7i_snow_spear', 80] },
    actions: [{ w: 3, id: 'm8n_cb_bite' }, { w: 2, id: 'm8n_cb_jump', cond: 'notRecent:m8n_cb_jump' }, { w: 1, id: 'm8n_cb_glare', cond: 'notRecent:m8n_cb_glare' }, { w: 1, id: 'attack' }],
    desc: 'つぼや砂の中から、とつぜんとび出してくるへび。どくのキバでかみつく。氷がよく効く。',
  },

  // ── 月の王宮の 地下迷宮 5〜8階（Lv82〜84）──
  // ランプのけむり: 大臣の 黒い ランプから もれ出た、むらさきの けむりの 精（ディズニーの ヴィランの 手下〈大臣の まほうの けむり〉）
  lamp_smoke: {
    name: 'ランプのけむり', lv: 82, hp: 1900, mp: 300, str: 230, def: 220, agi: 220, mag: 390, exp: 3420, gold: 1200,
    race: 'spirit', size: 'm', flying: true, hit: 'claw', region: 6,
    resist: { wind: 1.4, light: 1.1, dark: 0.4, fire: 0.9, poison: 0, sleep: 0.3, confuse: 0.3 }, drops: { common: ['magic_water', 12], rare: ['c7i_snow_staff', 80] },
    actions: [{ w: 3, id: 'm8n_ls_smoke' }, { w: 2, id: 'm8n_ls_haze', cond: 'notRecent:m8n_ls_haze' }, { w: 2, id: 'm8n_ls_arm' }, { w: 1, id: 'attack' }],
    desc: '大臣の黒いランプから、もれ出たけむりの精。むらさきのけむりで、まわりをまどわせる。風でふきとびやすい。',
  },
  // 月のスカラベ: 2つに われる 金の スカラベ（ディズニー〈アラジンの 金の スカラベ〉。黄金虫の 絵の 色がえ。月の 光で 銀色）。めったに 見ない
  moon_scarab: {
    name: '月のスカラベ', lv: 83, hp: 2000, mp: 260, str: 300, def: 300, agi: 240, mag: 300, exp: 3600, gold: 1260,
    race: 'beast', size: 'm', flying: true, hit: 'bite', region: 6, art: 'gold_beetle', artScale: 1.1, tint: { hueTo: 222, sat: 0.45, light: 1.2 },
    resist: { bolt: 1.35, light: 0.6, dark: 1.1, fire: 1.0, ice: 1.0, poison: 0.3, sleep: 0.4, confuse: 0.4 }, drops: { common: ['moon_drop', 20], rare: ['c7i_snow_fan', 80] },
    actions: [{ w: 3, id: 'm8n_ms_beam' }, { w: 2, id: 'm8n_ms_split', cond: 'notRecent:m8n_ms_split' }, { w: 1, id: 'm8n_ms_shine', cond: 'notRecent:m8n_ms_shine' }, { w: 1, id: 'attack' }],
    desc: '月の光をあびて、銀色にかがやくスカラベ。2つにわれて、ひみつの場所へみちびくといわれる。めったに姿を見せない。雷がよく効く。',
  },

  // ── Step 1 の さいご: オウムのイアゴン（中ボス。Lv81）──
  // c8a.parrot … しかけ（battle-c8a.js）
  //   every … オウムがえしまでの 行動の 数 / listen … 聞き耳（しるしが のこり listen いかの 間に 当てた 呪文を 覚える）/ max … 覚える 数 /
  //   echo … はね返す 呪文の 強さ（base・per … 1つ ふえる ごとの ばい）/ p2At・p2Every … はやく なる / dizzy … しっぱいした ときの 守りの かけ算
  [C8_PET]: {
    name: 'オウムのイアゴン', lv: 81, hp: 83000, mp: 5000, str: 1545, def: 280, agi: 230, mag: 820, exp: 64000, gold: 18500,
    race: 'beast', size: 'xl', flying: true, boss: true, turns: 1, speed: 1.1, hit: 'claw', artScale: 0.5,
    drops: { boss: ['c8p_feather_charm'], bonus: ['limit_stone'], rare: ['c8p_parrot_fan', 1] },
    resist: { ...BOSS_STATUS, bolt: 1.25, wind: 0.7, ice: 1.1, fire: 1.0, light: 1.0, dark: 0.9 },
    c8a: {
      kind: 'parrot',
      parrot: { every: 4, listen: 2, max: 3, echo: { base: [290, 320], per: 1.0 }, p2At: 0.5, p2Every: 3, dizzy: 0.8 },
    },
    actions: [
      { w: 3, id: 'm8p_peck' }, { w: 2, id: 'm8p_gust', cond: 'notRecent:m8p_gust' }, { w: 2, id: 'm8p_jewel', cond: 'notRecent:m8p_jewel' },
      { w: 1, id: 'm8p_chatter', cond: 'notRecent:m8p_chatter' }, { w: 1, id: 'attack' },
    ],
    phases: [
      { hpBelow: 0.5, msg: ['イアゴン「ジャハールさまー！こいつら、しつこいよー！」', 'イアゴンが、あわててはばたき出した！（オウムがえしが、はやくなった…！）'], buff: { atk: 1.06 } },
      { hpBelow: 0.2, msg: ['イアゴンの羽が、ぼさぼさになってきた…！', '守りが弱くなった！'], debuff: { def: 0.85 } },
    ],
    desc: '大臣ジャハールがかっている、おしゃべりな大きなオウム。聞いた呪文を、そっくりそのまま、まねしてはね返す。',
  },

  // ── Step 2 の さいご: 大臣ジャハール（第1幕の さいごの ボス。Lv83。3だん）──
  // c8a … しかけ（battle-c8a.js）
  //   staff … へびのつえ（every … さいみんじゅつまでの 行動・regrow … こわれた つえが もどるまで・hypno … あやつる 人数と 番）
  //   p2At・cobra … 大きな コブラ（every … とぐろまで・counter … とぐろの 間の かみつき・strike … 大へびのいちげき〈per … かみついた 数ごとの ばい〉・
  //     open … からぶりで のびきった 間〈k … ダメージの ばい・turns … コブラの 行動の 数〉・atk … 変身で 上がる 攻撃力）
  //   p3At・genie … ランプの 魔人（every … むげんの魔力まで・p4At・p4Every … はやく なる・blast … 魔力の 強さ・
  //     seal … ランプに すいこまれる〈turns・k〉・lampGrow … また ともる ランプの HP の かけ算・atk）
  [C8_JAFAR]: {
    name: '大臣ジャハール', lv: 83, hp: 100000, mp: 6000, str: 1475, def: 290, agi: 210, mag: 900, exp: 72000, gold: 21000,
    race: 'demon', size: 'xl', boss: true, turns: 1, speed: 1.0, hit: 'bash', artScale: 0.5,
    drops: { boss: ['c8j_ruby_charm'], bonus: ['limit_stone'], rare: ['c8j_snake_staff', 1] },
    resist: { ...BOSS_STATUS, light: 1.2, dark: 0.6, fire: 1.0, ice: 1.0, bolt: 1.0, wind: 1.0 },
    minionsFall: [C8_STAFF, C8_LAMP], fallMsg: 'へびのつえも、黒いランプも、くだけちった！',
    c8a: {
      kind: 'vizier',
      staff: { every: 3, regrow: 4, hypno: { n: 1, turns: [2, 3] } },
      p2At: 0.67,
      cobra: { every: 3, counter: { mult: 0.85, ignoreDef: 0.3 }, strike: { mult: 0.9, per: 0.25, max: 2.0, ignoreDef: 0.3 }, open: { k: 1.5, turns: 2 }, atk: 1.06 },
      p3At: 0.34,
      genie: { every: 3, p4At: 0.15, p4Every: 2, blast: { base: [370, 400] }, seal: { turns: 4, k: 1.6 }, lampGrow: 1.15, atk: 1.04 },
    },
    actions: [
      { w: 3, id: 'm8j_ray' }, { w: 2, id: 'm8j_sand', cond: 'notRecent:m8j_sand' }, { w: 1, id: 'm8j_laugh', cond: 'notRecent:m8j_laugh' }, { w: 1, id: 'attack' },
    ],
    phases: [
      { hpBelow: 0.15, msg: ['魔人のけむりの体が、ゆらゆらとうすくなってきた…！', '守りが弱くなった！'], debuff: { def: 0.85 } },
    ],
    desc: '王のそばに仕える大臣ジャハール。へびのつえで人をあやつる。正体をあらわすと、大きなコブラ、そしてランプの魔人に姿をかえる。',
  },
};

// ── 数えない 形（図鑑・魔物の 数・配合に 出ない。MONSTERS[id] は ふつうに 引ける）──
const PART_RESIST = { sleep: 0, poison: 0, confuse: 0, blind: 0, silence: 0, paralyze: 0 };
export const C8A_HIDDEN = {
  // ジャハールの へびのつえ（1だんめ。こわすと さいみんじゅつが とける）
  [C8_STAFF]: {
    name: 'へびのつえ', lv: 83, hp: 3000, mp: 0, str: 0, def: 250, agi: 1, mag: 0, exp: 0, gold: 0,
    race: 'material', size: 'm', flying: true, speed: 0.001, hit: 'bash', noBefriend: true, c8staff: true,
    resist: { ...PART_RESIST, light: 1.6, dark: 0.5, fire: 1.0, ice: 1.0, bolt: 1.2, wind: 1.0 },
    drops: {}, actions: [{ w: 1, id: 'm8j_staff_glow' }],
    desc: 'ジャハールのへびのつえ。ルビーの目で見つめて、人をあやつる。こわすと、さいみんじゅつがとける。光がよく効く。',
  },
  // 魔人の 黒いランプ（3だんめ。こわすと 魔人が ランプに すいこまれる）
  [C8_LAMP]: {
    name: '黒いランプ', lv: 83, hp: 3600, mp: 0, str: 0, def: 270, agi: 1, mag: 0, exp: 0, gold: 0,
    race: 'material', size: 'm', flying: true, speed: 0.001, hit: 'bash', noBefriend: true, c8lamp: true,
    resist: { ...PART_RESIST, light: 1.5, dark: 0.5, fire: 1.0, ice: 1.0, bolt: 1.3, wind: 1.0 },
    drops: {}, actions: [{ w: 1, id: 'm8g_lamp_glow' }],
    desc: '魔人の力がつまった、黒いランプ。こわすと、魔人は自分のランプにすいこまれてしまう。光と雷がよく効く。',
  },
};

// monsters.js が よぶ。何回 よんでも おなじ
export function addC8aHidden(table) {
  for (const [id, m] of Object.entries(C8A_HIDDEN)) {
    if (Object.prototype.hasOwnProperty.call(table, id)) continue;
    Object.defineProperty(table, id, { value: { noBefriend: true, ...m }, enumerable: false, configurable: true, writable: true });
  }
}

// 素材の ドロップ（loot.js の MAT_DROPS に まぜる。今の 素材だけ。入手先の 画面に 出る）
// レアの ドロップは 第7章 第3幕の 雪の 村の 店の 装備（ランク10。千年前の 王国の 店にも ない 品）
export const C8A_MAT_DROPS = {
  palace_guard: ['iron_shard', 4],
  sanbo: ['earth_root', 4],
  cobrar: ['dragon_scale', 5],
  lamp_smoke: ['magic_powder', 3],
  moon_scarab: ['star_sand', 3],
};
