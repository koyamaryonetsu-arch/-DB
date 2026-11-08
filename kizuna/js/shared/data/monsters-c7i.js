// 第2部 第7章 第3幕「ひとりぼっちの星」（Step 5・6）の 魔物と、ボス 2体（B: 戦い。docs/plan-ch7.md の 8）
// monsters.js（MONSTERS）・loot.js（MAT_DROPS）が まぜる。ここは ほかの データを import しない（じゅんかんを さける）
// え は client/render/c7i-art.js。ボスの しかけは shared/battle-c7i.js（battle-c7s.js から よぶ）
//
// 出現表（encounters-c7i.js）: t7_snow＝千年前の シロガネの フィールド（Lv76〜78）・t7_castle＝氷の竜の城（Lv78〜80）
// 手下の 魔物 5しゅ（どれも 仲間に なる）。家族が えらんだ 出どころ: ディズニーの ヴィランの 手下・マリオの 敵・アニメの 敵の 手下（雪と 氷）
//   配合で 足りない 系統・ランク（docs/plan-r53-breed-more.md の 1。第7章 第2幕までで うまった 所は のぞく）に 入れる
//   新しい 絵 3しゅ: アイスブロス（ドラゴン F。マリオの 敵）・氷の魔法鏡（物質 C。白雪姫の 女王の まほうの 鏡）・ブリザード（せいれい A。ダイの大冒険の 氷炎の 軍団の 手下）
//   今の 絵の 色がえ 2しゅ: こおりパックン（植物 E。パックンフラワー）・いばらゴブリン（悪魔 D。マレフィセントの 手下の ゴブリンたち。いたずらゴブリン）
//   ランクは 出やすさ（encounters-c7i.js の 重み）と 仲間に なりやすさ（companions-c7i.js の rate）で きまる（tools/gen-monster-ranks.mjs）
//   region: 6 … ふつうの 魔物が まれに 落とす「空の レア装備」の 地方（第6章・第7章 第1幕・第2幕と おなじ）
//
// ・いばらの魔女マレフィナ（c7_witch。Step 5 の さいごの 中ボス。Lv78。2だん）… battle-c7i.js の thorn「いばらのかべ」→ dragon「黒い竜」
//   1だんめ（魔女）: 前に「いばらのかべ」（c7_thorn。べつの 敵。炎が よく効く）が ある 間、魔女が 受ける ダメージは cut ばい。
//     かべを こわすと、魔女が regrow 回 動くまで かべは ない。curse 回 動く たびに「百年ねむりののろい」（身を 守って いない 人を ねむらせる）
//   HP が p2At より へると、次の 番に 黒い 竜に 変身する（それまでは HP が p2At より 下がらない）。かべは もえて なくなる
//   2だんめ（黒い 竜）: every 回 動く たびに「黒いほのおのいき」（みんなに 炎の 大技。身を 守ると 半分）。HP が p3At より へると p3Every に
// ・カイの影（c7_shadow。第7章の さいごの ボス。Lv80）… battle-c7i.js の shade「かげブーメラン」
//   every 回 動く たびに、1人を「ねらう」（頭の 上に ねらいの しるし）。lead 回 あとの 影の 番に、その 人へ「かげブーメラン」:
//   ねらわれた 人が 身を 守って いれば、ブーメランを はね返す（影に reflect の ダメージ・影は ふらつく … 次の 番は 動けない・守りが 下がる）。
//   守って いなければ、その 人に とても 大きな ダメージ・もどってくる ブーメランが ほかの みんなにも 当たる。
//   HP が p2At より へると「かげぶんしん」… 2人を いっしょに ねらう・every が p2Every に
// ・ボスの え は 今までの ボスの 2倍の こまかさ（size は 2倍・artScale: 0.5 で 見た目は 今までと おなじ。docs/plan-ch7.md の 4-4）。
//   マレフィナの 黒い 竜の すがたは おなじ え の コマ 2・3（client/battle-c7i.js の c7iSprite）

const BOSS_STATUS = { sleep: 0, poison: 0.3, confuse: 0, blind: 0.3, silence: 0.2, paralyze: 0 };
export const C7_WITCH = 'c7_witch';
export const C7_THORN = 'c7_thorn';
export const C7_SHADOW = 'c7_shadow';
export const C7I_BOSSES = [C7_WITCH, C7_SHADOW];
// 第7章 第3幕の 手下の 魔物（仲間に なる 5しゅ）
export const C7I_MINIONS = ['ice_bro', 'ice_pakkun', 'thorn_goblin', 'ice_mirror', 'blizzard'];
// 黒い 竜の すがたの 行動（変身した ときに 入れかわる）
export const DRAGON_ACTIONS = [
  { w: 3, id: 'm7d_claw' }, { w: 2, id: 'm7d_tail', cond: 'notRecent:m7d_tail' }, { w: 2, id: 'm7d_fire', cond: 'notRecent:m7d_fire' },
  { w: 1, id: 'm7d_roar', cond: 'notRecent:m7d_roar' }, { w: 1, id: 'attack' },
];

export const MONSTERS_C7I = {
  // ── 千年前の シロガネの フィールド（雪の 山と 森。Lv76〜78）──
  // アイスブロス: こおりの たまを 投げる カメの 兄弟（マリオの 敵）
  ice_bro: {
    name: 'アイスブロス', lv: 76, hp: 1900, mp: 120, str: 264, def: 238, agi: 178, mag: 230, exp: 2680, gold: 1000,
    race: 'dragon', size: 'm', hit: 'bash', region: 6,
    resist: { fire: 1.35, ice: 0.5, bolt: 1.0, poison: 0.5, sleep: 0.6, confuse: 0.6 }, drops: { common: ['jou_herb', 10], rare: ['c7i_snow_spear', 80] },
    actions: [{ w: 3, id: 'm7n_ib_ball' }, { w: 2, id: 'm7n_ib_barrage', cond: 'notRecent:m7n_ib_barrage' }, { w: 1, id: 'attack' }],
    desc: 'ヘルメットをかぶった、カメの兄弟。こおりのたまを、ぽんぽん投げてくる。当たると、こおりつく。炎がよく効く。',
  },
  // こおりパックン: 雪の 中から 顔を 出す、青い パックンフラワー（マリオの 敵。パックンフラワーの 絵の 色がえ）
  ice_pakkun: {
    name: 'こおりパックン', lv: 76, hp: 1960, mp: 140, str: 268, def: 226, agi: 120, mag: 250, exp: 2700, gold: 1010,
    race: 'plant', size: 'm', hit: 'bite', region: 6, art: 'pakkun', artScale: 1.0, tint: { hueTo: 196, sat: 0.75, light: 1.18 },
    resist: { fire: 1.4, ice: 0.4, bolt: 0.9, poison: 0.6, sleep: 0.6, confuse: 0.6 }, drops: { common: ['magic_water', 12], rare: ['c7i_snow_staff', 80] },
    actions: [{ w: 3, id: 'm7n_ip_bite' }, { w: 2, id: 'm7n_ip_breath', cond: 'notRecent:m7n_ip_breath' }, { w: 1, id: 'attack' }],
    desc: '雪の中から顔を出す、青いパックンフラワー。こおった口でかみつき、つめたいいきをはく。炎がよく効く。',
  },
  // いばらゴブリン: マレフィナの 手下の ゴブリン（ディズニーの ヴィランの 手下〈いばらの 魔女の 手下の ゴブリンたち〉。いたずらゴブリンの 絵の 色がえ）
  thorn_goblin: {
    name: 'いばらゴブリン', lv: 77, hp: 1990, mp: 100, str: 276, def: 236, agi: 160, mag: 200, exp: 2760, gold: 1030,
    race: 'demon', size: 'm', hit: 'slash', region: 6, art: 'goblin', artScale: 1.15, tint: { hueTo: 100, sat: 0.55, light: 0.78 },
    resist: { light: 1.35, dark: 0.6, fire: 1.1, ice: 0.9, poison: 0.5, sleep: 0.5, confuse: 0.5 }, drops: { common: ['jou_herb', 10], rare: ['c7i_snow_axe', 80] },
    actions: [{ w: 3, id: 'm7n_tg_spear' }, { w: 2, id: 'm7n_tg_march', cond: 'notRecent:m7n_tg_march' }, { w: 1, id: 'm7n_tg_cheer', cond: 'notRecent:m7n_tg_cheer' }, { w: 1, id: 'attack' }],
    desc: 'いばらの魔女の手下の、ゴブリンたち。とがったやりを持って、わいわいさわぎながらせめてくる。光がよく効く。',
  },

  // ── 氷の竜の城（Lv78〜80）──
  // 氷の魔法鏡: 女王に こたえる、まほうの 鏡（ディズニーの ヴィランの 手下〈白雪姫の 女王の 鏡〉。氷の わくの 中に、白い お面の 顔が うかぶ）
  ice_mirror: {
    name: '氷の魔法鏡', lv: 78, hp: 2060, mp: 240, str: 240, def: 268, agi: 150, mag: 350, exp: 2900, gold: 1060,
    race: 'material', size: 'm', flying: true, hit: 'bash', region: 6,
    resist: { fire: 1.35, ice: 0.4, light: 0.8, dark: 1.1, poison: 0, sleep: 0.3, confuse: 0.4 }, drops: { common: ['magic_water', 12], rare: ['c7i_snow_shield', 80] },
    actions: [{ w: 3, id: 'm7n_im_beam' }, { w: 2, id: 'm7n_im_frost', cond: 'notRecent:m7n_im_frost' }, { w: 1, id: 'm7n_im_shine', cond: 'notRecent:m7n_im_shine' }, { w: 1, id: 'attack' }],
    desc: '女王のといかけにこたえる、魔法の鏡。氷のわくの中に、白いお面の顔がうかぶ。うつした者を、こおらせてしまう。炎がよく効く。',
  },
  // ブリザード: こおりの 体の せいれい（アニメの 敵の 手下〈ダイの大冒険の 氷炎の 軍団の ブリザード〉）。めったに 見ない
  blizzard: {
    name: 'ブリザード', lv: 79, hp: 1820, mp: 300, str: 234, def: 222, agi: 236, mag: 380, exp: 3100, gold: 1100,
    race: 'spirit', size: 'm', flying: true, hit: 'claw', region: 6,
    resist: { fire: 1.4, ice: 0, wind: 0.8, bolt: 1.0, poison: 0, sleep: 0.4, confuse: 0.4 }, drops: { common: ['magic_water', 12], rare: ['c7i_snow_fan', 80] },
    actions: [{ w: 3, id: 'm7n_bz_storm' }, { w: 2, id: 'm7n_bz_freeze', cond: 'notRecent:m7n_bz_freeze' }, { w: 2, id: 'm7n_bz_claw' }, { w: 1, id: 'attack' }],
    desc: 'こおりでできた体の、せいれい。うずまくふぶきをよびおこし、ふれたものをこおりつかせる。めったに姿を見せない。炎がよく効く。',
  },

  // ── Step 5 の さいご: いばらの魔女マレフィナ（中ボス。Lv78。2だん）──
  // c7i … しかけ（battle-c7i.js）
  //   thorn … いばらのかべ（cut … かべが ある 間に 魔女が 受ける ダメージの ばい・regrow … かべが また はえるまでの 魔女の 行動）
  //   curse … 百年ねむりののろいまでの 行動の 数（every）と ねむる 番（turns）
  //   p2At … 黒い 竜に 変身する HP の わりあい / dragon … 竜の すがた（every … 黒いほのおのいきまで・p3At・p3Every … はやく なる・
  //     breath … いきの 強さ・atk … 変身で 上がる 攻撃力・speed … 速さの かけ算）
  [C7_WITCH]: {
    name: 'マレフィナ', lv: 78, hp: 73000, mp: 4000, str: 1250, def: 270, agi: 142, mag: 820, exp: 56000, gold: 16000,
    race: 'demon', size: 'xl', boss: true, turns: 1, speed: 1.0, hit: 'bash', artScale: 0.5, drops: { boss: ['c7w_thorn_charm'], bonus: ['limit_stone'], rare: ['c7w_dragon_spear', 1] },
    resist: { ...BOSS_STATUS, light: 1.15, fire: 0.9, ice: 1.1, bolt: 1.0, dark: 0.7, wind: 1.0 },
    minionsFall: [C7_THORN], fallMsg: 'いばらのかべも、かれて消えた！',
    c7i: {
      kind: 'witch',
      thorn: { cut: 0.25, regrow: 5 },
      curse: { every: 5, turns: [2, 3] },
      p2At: 0.5,
      dragon: { every: 4, p3At: 0.25, p3Every: 3, breath: { mult: 1.6, ignoreDef: 0.3 }, atk: 1.08, speed: 1.0 },
    },
    actions: [
      { w: 3, id: 'm7m_whip' }, { w: 2, id: 'm7m_green', cond: 'notRecent:m7m_green' }, { w: 2, id: 'm7m_staff', cond: 'notRecent:m7m_staff' },
      { w: 1, id: 'm7m_laugh', cond: 'notRecent:m7m_laugh' }, { w: 1, id: 'attack' },
    ],
    phases: [
      { hpBelow: 0.2, msg: ['黒い竜のつばさが、ぼろぼろになってきた…！', '守りが弱くなった！'], debuff: { def: 0.85 } },
    ],
    desc: '氷の竜の城にすむ、いばらの魔女。いばらのかべにかくれて、百年ねむりののろいをかける。おこると、黒い竜に姿をかえる。',
  },

  // ── Step 6 の さいご: カイの影（第7章の さいごの ボス。Lv80）──
  // c7i.shade … しかけ（battle-c7i.js）
  //   every … ねらいまでの 行動の 数 / lead … ねらってから ブーメランまでの 影の 番 / p2At・p2Every … かげぶんしん（2人を ねらう・はやく なる）/
  //   hit … ねらった 人への ブーメランの 強さ / back … もどってくる ブーメラン（ほかの みんな）/ reflect … はね返した ときの 影への ダメージ（最大HPの わりあい）/
  //   stagger … はね返された あとの 守りの かけ算
  [C7_SHADOW]: {
    name: 'カイの影', lv: 80, hp: 78000, mp: 5000, str: 1360, def: 280, agi: 200, mag: 800, exp: 62000, gold: 18000,
    race: 'demon', size: 'xl', boss: true, turns: 1, speed: 1.05, hit: 'slash', artScale: 0.5, drops: { boss: ['c7h_shadow_charm'], bonus: ['limit_stone'], rare: ['c7h_shadow_boomerang', 1] },
    resist: { ...BOSS_STATUS, light: 1.25, dark: 0.5, fire: 1.0, ice: 1.0, bolt: 1.0, wind: 0.9 },
    c7i: {
      kind: 'shade',
      shade: { every: 3, lead: 2, p2At: 0.5, p2Every: 2, hit: { mult: 1.3, ignoreDef: 0.3 }, back: { mult: 0.3, ignoreDef: 0.2 }, reflect: 0.03, stagger: 0.8 },
    },
    actions: [
      { w: 3, id: 'm7h_star' }, { w: 2, id: 'm7h_boomerang', cond: 'notRecent:m7h_boomerang' }, { w: 2, id: 'm7h_stitch', cond: 'notRecent:m7h_stitch' },
      { w: 1, id: 'm7h_hide', cond: 'notRecent:m7h_hide' }, { w: 1, id: 'attack' },
    ],
    phases: [
      { hpBelow: 0.5, msg: ['カイの影「ひとりぼっちなら…何人いたって、同じことさ」', 'カイの影が、2つにわかれた！かげぶんしんの術だ！', '（2人を、いっしょにねらってくるようになった…！）'], buff: { atk: 1.08 }, addActions: [{ w: 2, id: 'm7h_dark', cond: 'notRecent:m7h_dark' }] },
      { hpBelow: 0.2, msg: ['どこかで、カイの声がした…「みんな、負けるな！」', 'カイの影の姿が、うすくなってきた！守りが弱くなった！'], debuff: { def: 0.85 } },
    ],
    desc: '星の光のとどかない所から、あらわれたカイの影。カイと同じ動きで、かげのブーメランを投げる。ねらわれた人が身を守ると、ブーメランをはね返せる。',
  },
};

// ── 数えない 形（図鑑・魔物の 数・配合に 出ない。MONSTERS[id] は ふつうに 引ける）──
export const C7I_HIDDEN = {
  // マレフィナの いばらのかべ（魔女の 前に はえる。動かない。炎が よく効く）
  [C7_THORN]: {
    name: 'いばらのかべ', lv: 78, hp: 2600, mp: 0, str: 0, def: 240, agi: 1, mag: 0, exp: 0, gold: 0,
    race: 'plant', size: 'l', speed: 0.001, hit: 'bash', noBefriend: true, c7thorn: true,
    resist: { fire: 2.0, ice: 0.6, bolt: 0.8, wind: 1.2, light: 1.0, dark: 0.6, sleep: 0, poison: 0, confuse: 0, blind: 0, silence: 0, paralyze: 0 },
    drops: {}, actions: [{ w: 1, id: 'm7m_thorn_creak' }],
    desc: 'マレフィナの前にはえる、黒いいばらのかべ。ある間は、魔女にダメージがとどきにくい。炎でよくもえる。',
  },
};

// monsters.js が よぶ。何回 よんでも おなじ
export function addC7iHidden(table) {
  for (const [id, m] of Object.entries(C7I_HIDDEN)) {
    if (Object.prototype.hasOwnProperty.call(table, id)) continue;
    Object.defineProperty(table, id, { value: { noBefriend: true, ...m }, enumerable: false, configurable: true, writable: true });
  }
}

// 素材の ドロップ（loot.js の MAT_DROPS に まぜる。今の 素材だけ。入手先の 画面に 出る）
// レアの ドロップは 雪の 村の 店の 装備
export const C7I_MAT_DROPS = {
  ice_bro: ['ice_crystal', 4],
  ice_pakkun: ['white_snowball', 4],
  thorn_goblin: ['iron_shard', 4],
  ice_mirror: ['silver_shard', 3],
  blizzard: ['magic_powder', 3],
};
