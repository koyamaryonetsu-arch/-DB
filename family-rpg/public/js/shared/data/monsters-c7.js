// 第2部 第7章 第1幕「緑の王国」（Step 1・2）の 魔物と、ボス 2体（B: 戦い。docs/plan-ch7.md の 1〜3）
// monsters.js（MONSTERS）・loot.js（MAT_DROPS）が まぜる。ここは ほかの データを import しない（じゅんかんを さける）
// え は client/render/c7-art.js。ボスの しかけは shared/battle-c7.js（battle-ch6.js から よぶ）
//
// 出現表（encounters-c7.js）: t7_kingdom＝千年前の コガネ地方の フィールド（Lv68〜70）・t7_temple＝みどりの水の神殿（Lv70〜72）
// 手下の 魔物 10しゅ（どれも 仲間に なる）。家族が えらんだ 出どころ: ディズニーの ヴィランの 手下・マリオの 敵・アニメの 敵の 手下
//   配合で 足りない 系統・ランク（docs/plan-r53-breed-more.md の 1。第6章 Step 6 で うまった 所は のぞく）に 入れる
//   新しい 絵 5しゅ: ノコノコ（ドラゴン F）・パックンフラワー（植物 E）・トランプの兵（物質 E）・行進のほうき（せいれい D）・ゲッソー（スライム D）
//   今の 絵の 色がえ 5しゅ: 使いのカラス（悪魔 F。大ガラス）・うずしおウツボ（ドラゴン E。海へび）・テレサ（ゾンビ C。さびしさのゆうれい）・
//     水のようま（せいれい B。水の精）・のろいだま（ゾンビ A。たましいすい）
//   ランクは 出やすさ（encounters-c7.js の 重み）と 仲間に なりやすさ（companions-c7.js の rate）で きまる（tools/gen-monster-ranks.mjs）
//   region: 6 … ふつうの 魔物が まれに 落とす「空の レア装備」の 地方（data/rare-loot.js の regionOf。第6章と おなじ）
//
// ・水門の ウツボきょうだい（c7_gate ＋ c7_gate_b。Step 1 の さいごの 中ボス。Lv70）… battle-c7.js の twin
//   2ひきで 1組。かたほうが たおれると、もう かたほうが call 回 動いた ところで よびもどす（HP callHp・2ひきとも 少し 強く なる）
//   2ひきとも 生きている 間は、どちらかが 動く たびに「いき」が 1つ たまり、sync で「ふたごの大うずしお」（みんなに 物理の 大技。身を 守ると 半分）
//   経験値・お金・落とす物は 兄（c7_gate）に まとめる（弟は exp 0）
// ・うずの魔女オクタリア（c7_temple。神殿の ボス。Lv72。2だん）… battle-c7.js の witch
//   every 回 動く たびに「声うばいの歌」（1人の 声を 声の貝に すいこむ … 呪文が 使えない）。声が chorusAt いじょう たまると かわりに
//   「うばった声の大合唱」（みんなに 大きな 呪文。たまった 声が 多いほど 強い）。声の貝（c7_shell。べつの 敵）を こわすと 声が もどり、
//   魔女は よろめく（ゲージ 0・守り↓）。貝は regrow 回 魔女が 動くと また できる。HP が p2At より へると every が p2Every に
// ・声の貝は 数えない 形（図鑑・魔物の 数・配合に 出ない。addC7Hidden）

const BOSS_STATUS = { sleep: 0, poison: 0.3, confuse: 0, blind: 0.3, silence: 0.2, paralyze: 0 };
export const C7_GATE = 'c7_gate';
export const C7_GATE_B = 'c7_gate_b';
export const C7_TEMPLE = 'c7_temple';
export const C7_SHELL = 'c7_shell';
export const C7_BOSSES = [C7_GATE, C7_TEMPLE];
// 第7章の 手下の 魔物（仲間に なる 10しゅ）
export const C7_MINIONS = ['nokonoko', 'pakkun', 'card_soldier', 'crow_messenger', 'uzu_eel', 'march_broom', 'gesso', 'teresa', 'water_youma', 'curse_lump'];

export const MONSTERS_C7 = {
  // ── 千年前の コガネ地方（緑の王国の 川と 森。Lv68〜70）──
  // ノコノコ: みどりの こうらの カメ（マリオの 敵）。こうらに こもって ころがってくる
  nokonoko: {
    name: 'ノコノコ', lv: 68, hp: 1640, mp: 60, str: 250, def: 262, agi: 118, mag: 120, exp: 1980, gold: 800,
    race: 'dragon', size: 's', hit: 'bash', region: 6,
    resist: { ice: 1.3, fire: 0.9, bolt: 1.0, poison: 0.5, sleep: 0.6, confuse: 0.6 }, drops: { common: ['jou_herb', 10], rare: ['c7_kingdom_shield', 80] },
    actions: [{ w: 3, id: 'm7_nk_shell' }, { w: 1, id: 'm7_nk_hide', cond: 'notRecent:m7_nk_hide' }, { w: 2, id: 'attack' }],
    desc: 'みどりのこうらのカメ。こうらに頭と手足をしまい、くるくるころがって体当たりしてくる。氷がよく効く。',
  },
  // パックンフラワー: 土管の かわりに 川べの 草から 生えた、大きな 口の 花（マリオの 敵）。火の玉を はく
  pakkun: {
    name: 'パックンフラワー', lv: 68, hp: 1760, mp: 120, str: 268, def: 200, agi: 104, mag: 230, exp: 2020, gold: 820,
    race: 'plant', size: 'm', hit: 'bite', region: 6,
    resist: { fire: 0.7, ice: 1.35, wind: 1.1, poison: 0.3, sleep: 0.5, confuse: 0.5 }, drops: { common: ['jou_herb', 10], rare: ['c7_kingdom_whip', 80] },
    actions: [{ w: 3, id: 'm7_pk_bite' }, { w: 2, id: 'm7_pk_fire', cond: 'notRecent:m7_pk_fire' }, { w: 1, id: 'attack' }],
    desc: '大きな口の花。パクパクとかみついて、口から火の玉をはく。氷がよく効く。',
  },
  // トランプの兵: ハートの 女王の 手下の、トランプの 体の 兵（ディズニーの ヴィランの 手下）。ならんで やりを つく
  card_soldier: {
    name: 'トランプの兵', lv: 69, hp: 1620, mp: 60, str: 266, def: 226, agi: 142, mag: 140, exp: 2000, gold: 840,
    race: 'material', size: 'm', hit: 'slash', region: 6,
    resist: { fire: 1.35, wind: 1.2, dark: 0.9, poison: 0, sleep: 0.5, confuse: 0.6 }, drops: { common: ['magic_water', 12], rare: ['c7_kingdom_spear', 80] },
    actions: [{ w: 3, id: 'm7_cs_spear' }, { w: 2, id: 'm7_cs_march', cond: 'notRecent:m7_cs_march' }, { w: 1, id: 'attack' }],
    desc: 'トランプの体に、やりを持った兵。ハートの女王のめいれいで、ずらりとならんでつき進む。炎がよく効く。',
  },
  // 使いのカラス: 魔女の しらせを はこぶ 黒い カラス（ディズニーの ヴィランの 手下。大ガラスの 絵の 色がえ）
  crow_messenger: {
    name: '使いのカラス', lv: 68, hp: 1460, mp: 160, str: 240, def: 176, agi: 214, mag: 262, exp: 1960, gold: 800,
    race: 'demon', size: 's', flying: true, hit: 'claw', region: 6, art: 'crow', artScale: 1.15, tint: { hueTo: 150, sat: 0.55, light: 0.62 },
    resist: { light: 1.35, dark: 0.5, wind: 0.9, poison: 0.5, sleep: 0.5, confuse: 0.4 }, drops: { common: ['magic_water', 12], rare: ['c7_kingdom_fan', 80] },
    actions: [{ w: 3, id: 'm7_cw_peck' }, { w: 2, id: 'm7_cw_hex', cond: 'notRecent:m7_cw_hex' }, { w: 1, id: 'm7_cw_caw', cond: 'notRecent:m7_cw_caw' }, { w: 1, id: 'attack' }],
    desc: '魔女のしらせをはこぶ、黒いカラス。目が、あやしいみどり色に光る。光がよく効く。',
  },

  // ── みどりの水の神殿（Lv70〜72）──
  // うずしおウツボ: 海の 魔女の 手下の 大きな ウツボ（ディズニーの ヴィランの 手下。海へびの 絵の 色がえ）
  uzu_eel: {
    name: 'うずしおウツボ', lv: 70, hp: 1880, mp: 140, str: 282, def: 208, agi: 150, mag: 230, exp: 2120, gold: 860,
    race: 'dragon', size: 'l', hit: 'bite', region: 6, art: 'sea_serpent', artScale: 1.05, tint: { hueTo: 78, sat: 0.7, light: 0.82 },
    resist: { bolt: 1.35, fire: 0.8, ice: 1.0, poison: 0.4, sleep: 0.5, confuse: 0.5 }, drops: { common: ['jou_herb', 10], rare: ['c7_kingdom_mail', 80] },
    actions: [{ w: 3, id: 'm7_ue_bite' }, { w: 2, id: 'm7_ue_swirl', cond: 'notRecent:m7_ue_swirl' }, { w: 1, id: 'attack' }],
    desc: '神殿の水路にすむ、大きなウツボ。黄色い目で、じっと見つめてくる。雷がよく効く。',
  },
  // 行進のほうき: 水を くむ ために 魔法で 動き出した ほうき（ディズニー〈ファンタジア〉の 手下）。バケツの 水を ぶちまける。ふえる
  march_broom: {
    name: '行進のほうき', lv: 70, hp: 1680, mp: 120, str: 264, def: 198, agi: 168, mag: 220, exp: 2080, gold: 850,
    race: 'spirit', size: 'm', hit: 'bash', region: 6,
    resist: { fire: 1.4, wind: 0.9, bolt: 1.0, poison: 0, sleep: 0.3, confuse: 0.6 }, drops: { common: ['magic_water', 12], rare: ['c7_river_robe', 80] },
    actions: [{ w: 3, id: 'm7_mb_bucket' }, { w: 2, id: 'm7_mb_sweep', cond: 'notRecent:m7_mb_sweep' }, { w: 1, id: 'm7_mb_more', cond: 'notRecent:m7_mb_more' }, { w: 1, id: 'attack' }],
    desc: '魔法で動き出した、水くみのほうき。バケツを持って、ザッザッと行進する。わると、ふえることも。炎がよく効く。',
  },
  // ゲッソー: 水の 中を ふわふわ およぐ 白い イカ（マリオの 敵）。すみを はく
  gesso: {
    name: 'ゲッソー', lv: 70, hp: 1620, mp: 140, str: 256, def: 188, agi: 204, mag: 246, exp: 2060, gold: 850,
    race: 'slime', size: 's', flying: true, hit: 'bash', region: 6,
    resist: { bolt: 1.35, ice: 0.9, fire: 0.9, poison: 0.5, sleep: 0.5, confuse: 0.5 }, drops: { common: ['magic_water', 12], rare: ['c7_kingdom_hat', 80] },
    actions: [{ w: 3, id: 'm7_gs_dash' }, { w: 2, id: 'm7_gs_ink', cond: 'notRecent:m7_gs_ink' }, { w: 1, id: 'attack' }],
    desc: '水の中を、ふわっ、ふわっとおよぐ白いイカ。上からまっすぐおりてきて、すみをはく。雷がよく効く。',
  },
  // テレサ: まるい 白い おばけ（マリオの 敵。さびしさのゆうれいの 絵の 色がえ）。見られると はずかしがって 顔を かくす
  teresa: {
    name: 'テレサ', lv: 71, hp: 1700, mp: 160, str: 262, def: 200, agi: 182, mag: 280, exp: 2160, gold: 880,
    race: 'undead', size: 'm', flying: true, hit: 'claw', region: 6, art: 'lonely_ghost', artScale: 1.0, tint: { hueTo: 210, sat: 0.15, light: 1.35 },
    resist: { light: 1.4, dark: 0.3, ice: 0.9, poison: 0, sleep: 0.3, confuse: 0.5 }, drops: { common: ['magic_water', 12], rare: ['c7_kingdom_dagger', 80] },
    actions: [{ w: 3, id: 'm7_tr_boo' }, { w: 2, id: 'm7_tr_shy', cond: 'notRecent:m7_tr_shy' }, { w: 1, id: 'm7_tr_tongue', cond: 'notRecent:m7_tr_tongue' }, { w: 1, id: 'attack' }],
    desc: 'まるい白いおばけ。見られるとはずかしがって顔をかくすが、目をはなすと、うしろからおどかしてくる。光がよく効く。',
  },
  // 水のようま: 神殿の 水に ひそむ ようま（アニメの 敵の 手下。水の精の 絵の 色がえ）。人の 元気を すいとる
  water_youma: {
    name: '水のようま', lv: 71, hp: 1820, mp: 220, str: 248, def: 208, agi: 176, mag: 322, exp: 2200, gold: 900,
    race: 'spirit', size: 'm', flying: true, hit: 'claw', region: 6, art: 'water_spirit', artScale: 1.08, tint: { hueTo: 172, sat: 0.85, light: 0.7 },
    resist: { bolt: 1.3, light: 1.2, dark: 0.7, poison: 0.3, sleep: 0.4, confuse: 0.4 }, drops: { common: ['magic_water', 12], rare: ['c7_kingdom_staff', 80] },
    actions: [{ w: 3, id: 'm7_wy_lash' }, { w: 2, id: 'm7_wy_drain', cond: 'notRecent:m7_wy_drain' }, { w: 1, id: 'm7_wy_mist', cond: 'notRecent:m7_wy_mist' }, { w: 1, id: 'attack' }],
    desc: '神殿の水にひそむ、ようま。水のムチで打ち、人の元気をすいとる。雷がよく効く。',
  },
  // のろいだま: 人の いやな 思いが かたまった のろいの かたまり（アニメの 敵の 手下〈じゅれい〉。たましいすいの 絵の 色がえ）。めったに 見ない
  curse_lump: {
    name: 'のろいだま', lv: 72, hp: 2080, mp: 200, str: 288, def: 228, agi: 148, mag: 330, exp: 2600, gold: 980,
    race: 'undead', size: 'm', flying: true, hit: 'claw', region: 6, art: 'soul_eater', artScale: 1.12, tint: { hueTo: 290, sat: 1.1, light: 1.0 },
    resist: { light: 1.4, dark: 0.2, fire: 1.1, poison: 0, sleep: 0.3, confuse: 0.3 }, drops: { common: ['magic_water', 12], rare: ['c7_kingdom_sword', 80] },
    actions: [{ w: 3, id: 'm7_cl_hands' }, { w: 2, id: 'm7_cl_eye', cond: 'notRecent:m7_cl_eye' }, { w: 2, id: 'm7_cl_storm', cond: 'notRecent:m7_cl_storm' }, { w: 1, id: 'attack' }],
    desc: '人のいやな思いがかたまった、のろいのかたまり。たくさんの手と目がある。めったに姿を見せない。光がよく効く。',
  },

  // ── Step 1 の さいご: 水門の ウツボきょうだい（中ボス。Lv70。2ひきで 1組）──
  // c7.twin … しかけ（battle-c7.js）
  //   partner … もう 1ぴき / call … かたほうが たおれてから よびもどすまでの 行動の 数（その 行動で よびもどす）/ callHp … よびもどした HP
  //   rage … よびもどす たびに 2ひきの 攻撃力に かける 数（rageMax 回まで）/ sync … 大うずしおまでの いき / swirl … 大うずしおの 強さ
  [C7_GATE]: {
    name: 'ウツボのザブン', short: 'ザブン', lv: 70, hp: 29700, mp: 2000, str: 1340, def: 236, agi: 118, mag: 600, exp: 42000, gold: 12000,
    race: 'dragon', size: 'xl', boss: true, turns: 1, speed: 0.6, hit: 'bite', drops: { boss: ['c7g_twin_charm'], rare: ['c7g_eel_whip', 1] },
    resist: { ...BOSS_STATUS, bolt: 1.15, light: 1.0, dark: 0.9, ice: 0.95, fire: 0.85, wind: 1.0 },
    c7: { kind: 'twin', twin: { partner: C7_GATE_B, call: 4, callHp: 0.4, rage: 1.1, rageMax: 2, sync: 6, swirl: { mult: 1.0, ignoreDef: 0.35 } } },
    actions: [{ w: 3, id: 'm7g_bite' }, { w: 2, id: 'm7g_tail', cond: 'notRecent:m7g_tail' }, { w: 1, id: 'm7g_spark', cond: 'notRecent:m7g_spark' }, { w: 1, id: 'attack' }],
    phases: [{ hpBelow: 0.3, msg: ['ザブン「ドブン！負けるなよ…！」', 'ザブンの目が、ぎらりと光った！'], buff: { atk: 1.08 } }],
    desc: '水門を守る、ウツボのきょうだいの兄。かたほうがたおれても、もうかたほうが、すぐによびもどしてしまう。2ひきがそろうと、ぐるぐる回って、大うずしおをおこす。',
  },
  // 弟の 経験値・お金・落とす物は 兄に まとめる（2ひきで 1組。たおした ときの 数は 兄）
  [C7_GATE_B]: {
    name: 'ウツボのドブン', short: 'ドブン', lv: 70, hp: 29700, mp: 2000, str: 1340, def: 236, agi: 122, mag: 600, exp: 0, gold: 0,
    race: 'dragon', size: 'xl', boss: true, turns: 1, speed: 0.6, hit: 'bite', art: C7_GATE, tint: { hueTo: 180, sat: 0.8, light: 0.95 }, drops: {},
    resist: { ...BOSS_STATUS, bolt: 1.15, light: 1.0, dark: 0.9, ice: 0.95, fire: 0.85, wind: 1.0 },
    c7: { kind: 'twin', twin: { partner: C7_GATE, call: 4, callHp: 0.4, rage: 1.1, rageMax: 2, sync: 6, swirl: { mult: 1.0, ignoreDef: 0.35 } } },
    actions: [{ w: 3, id: 'm7g_bite' }, { w: 2, id: 'm7g_tail', cond: 'notRecent:m7g_tail' }, { w: 1, id: 'm7g_spark', cond: 'notRecent:m7g_spark' }, { w: 1, id: 'attack' }],
    phases: [{ hpBelow: 0.3, msg: ['ドブン「にいちゃん…まだまだ！」', 'ドブンの目が、ぎらりと光った！'], buff: { atk: 1.08 } }],
    desc: '水門を守る、ウツボのきょうだいの弟。兄とそっくりだが、しっぽの色が青い。2ひきは、いっしょにたおさないと、おたがいをよびもどす。',
  },

  // ── Step 2 の さいご: うずの魔女オクタリア（神殿の ボス。Lv72。2だん）──
  // c7.witch … しかけ（battle-c7.js）
  //   every … 声うばいの歌（または 大合唱）までの 行動の 数 / p2At・p2Every … 2だんめ（HP が へると はやく なる）
  //   chorusAt … 大合唱に なる 声の 数 / chorus … 大合唱の 強さ（base … 呪文の ダメージ・per … 声 1つで ふえる わりあい）
  //   regrow … 声の貝が こわれてから また できるまでの 魔女の 行動 / stagger … 貝が こわれた ときの よろめき（守りの かけ算）
  [C7_TEMPLE]: {
    name: 'オクタリア', lv: 72, hp: 77000, mp: 4000, str: 1280, def: 258, agi: 132, mag: 760, exp: 46000, gold: 13000,
    race: 'demon', size: 'xl', boss: true, turns: 1, speed: 1.0, hit: 'bash', drops: { boss: ['c7t_witch_charm'], rare: ['c7t_trident', 1] },
    resist: { ...BOSS_STATUS, light: 1.15, bolt: 1.1, dark: 0.7, ice: 0.95, fire: 0.95, wind: 1.0 },
    minionsFall: [C7_SHELL], fallMsg: '声の貝も、くだけて消えた！',
    c7: {
      kind: 'witch',
      witch: { every: 3, p2At: 0.5, p2Every: 2, chorusAt: 2, chorus: { base: [350, 380], per: 0.45 }, regrow: 4, stagger: 0.8 },
    },
    actions: [
      { w: 2, id: 'attack' }, { w: 3, id: 'm7t_arms' }, { w: 2, id: 'm7t_wave', cond: 'notRecent:m7t_wave' },
      { w: 1, id: 'm7t_ink', cond: 'notRecent:m7t_ink' }, { w: 1, id: 'm7t_curse', cond: 'notRecent:m7t_curse' },
    ],
    phases: [
      { hpBelow: 0.5, msg: ['オクタリア「…よくも、あたしの神殿で！」', 'オクタリアの体が、ぐんぐん大きくなった！', '（声をうばうのが、はやくなった…！）'], buff: { atk: 1.1 }, addActions: [{ w: 2, id: 'm7t_trident', cond: 'notRecent:m7t_trident' }] },
      { hpBelow: 0.2, msg: ['オクタリアの足が、ぐらりとよろけた…！', '守りが弱くなった！'], debuff: { def: 0.85 } },
    ],
    desc: 'みどりの水の神殿をのっとった、うずの魔女。人の声をうばって、首の「声の貝」にためこむ。声がたまると大合唱。貝をこわせば、声はもどる。',
  },
};

// ── 数えない 形（図鑑・魔物の 数・配合に 出ない。MONSTERS[id] は ふつうに 引ける）──
export const C7_HIDDEN = {
  // オクタリアの 声の貝（うばった 声が 入る。こわすと 声が もどる。動かない）
  [C7_SHELL]: {
    name: '声の貝', lv: 72, hp: 3600, mp: 0, str: 0, def: 220, agi: 1, mag: 0, exp: 0, gold: 0,
    race: 'material', size: 's', speed: 0.001, hit: 'bash', noBefriend: true, c7shell: true,
    resist: { sleep: 0, poison: 0, confuse: 0, blind: 0, silence: 0, paralyze: 0 },
    drops: {}, actions: [{ w: 1, id: 'm7t_shell_glow' }],
    desc: 'オクタリアの首の、大きな貝のペンダント。うばった声が、中でないている。こわすと、声がもどる。',
  },
};

// monsters.js が よぶ。何回 よんでも おなじ
export function addC7Hidden(table) {
  for (const [id, m] of Object.entries(C7_HIDDEN)) {
    if (Object.prototype.hasOwnProperty.call(table, id)) continue;
    Object.defineProperty(table, id, { value: { noBefriend: true, ...m }, enumerable: false, configurable: true, writable: true });
  }
}

// 素材の ドロップ（loot.js の MAT_DROPS に まぜる）。第6章の 素材（時の砂・古い歯車。れん金で 使う）
// レアの ドロップは 緑の王国の 店の 装備（種は 第50回の 上限に とどいて いる）
export const C7_MAT_DROPS = {
  nokonoko: ['p6_old_gear', 4],
  pakkun: ['p6_time_sand', 4],
  card_soldier: ['p6_old_gear', 4],
  crow_messenger: ['p6_time_sand', 4],
  uzu_eel: ['p6_time_sand', 3],
  march_broom: ['p6_old_gear', 3],
  gesso: ['p6_time_sand', 3],
  teresa: ['p6_old_gear', 3],
  water_youma: ['p6_time_sand', 3],
  curse_lump: ['p6_old_gear', 2],
};
