// 第3部 第1章 第3幕「さかさのピラミッド」の 魔物・中ボス「なぞの番人 ナゾカケ」・幕の ボス「ホシドロ一味と ヒックリカエール2号」
// （B: 戦い。docs/plan-part3.md の 11-4）
// monsters.js（MONSTERS）・loot.js（MAT_DROPS）が まぜる。ここは ほかの データを import しない（じゅんかんを さける）
// え は client/render/c9c-art.js。ボスの しかけは shared/battle-c9c.js（battle-c9b.js から よぶ）
//
// 出現表（encounters-c9c.js）: t9c_river＝地下の川（Lv100）・t9c_pyr＝さかさのピラミッド 1〜2階（Lv100）・t9c_pyr2＝3〜4階（Lv100〜101）
// ふつうの 魔物 6しゅ（どれも 仲間に なる。region: 6。新しい 絵は 2つ … 大なまず・砂時計ゴーレム）
//   川 … どうくつの大なまず（新しい 絵）・川べのガマ（第4章の ひからびガエルの 色ちがい）。暗いので「見えにくい」（c9b.hide。てらすで 消える）
//   ピラミッド … さかさコウモリ（ふりこコウモリの 色ちがい）・砂時計ゴーレム（新しい 絵）・こがねスカラベ（第4章の 黄金虫の 色ちがい）・
//     さかさミイラ（第4章の ミイラ兵の 色ちがい）
//
// ・中ボス「なぞの番人 ナゾカケ」（c9c_nazokake。Lv101）… battle-c9c.js の riddle
//   every 回 動く ごとに なぞを 1つ 出す（画面の 上に 出つづける）。なぞが 出て いる 間は「なぞの守り」（受ける ダメージ guard ばい）
//   「こたえる」で 正かい → 守りが 消え、1回 休む（つぎの なぞまで every 回）。はずれ → 答えた 人が 2回「さかさま」（こんらん）
//   limit 回 動いても 答えが ないと「時間切れ」（全体に 中くらいの ダメージ ＋ つぎの なぞ）。HPが 半分を 切ると むずかしい なぞ
//   なぞが 出て いる 間は ゆっくり 動く（slow。小さい 子が 読んで 答える 間）
// ・幕の ボス「ヒックリカエール2号」（c9c_hikkuri。Lv102）… battle-c9c.js の sand
//   砂の めもり（sand つぶ）。メカが 動く たびに 1つぶ 落ちる。0 で「砂が、落ちきった！」→ つぎの 番に 大ばくはつ（全体。身を 守ると へる）
//   「ひっくり返す」: めもりが 6 に もどる。dizzyAt つぶ いか なら 目が回る（1回 休み・受ける ダメージ dizzyMult ばい）、
//   それより 多いと「まだ早い！」（休まず、ひっくり返した 人に 反げき）。HPが 半分を 切ると「砂を 足す」（1回に 2つぶ）
//   ときどき「ポチッとね」（前ぶれ → つぎの 番に 1人に 大きな ダメージ）。勝つと メカは 自分で ひっくり返って 止まる（3人組は にげる）
// ・ボスの え は 2倍の こまかさ（size は 2倍・artScale: 0.5）
// ・もとの 作品の 絵・名前・せりふは 使わない（スフィンクスの 形の 石の けもの・大きな 砂時計の メカ）

const BOSS_STATUS = { sleep: 0, poison: 0.3, confuse: 0, blind: 0.3, silence: 0.2, paralyze: 0 };
export const C9C_NAZOKAKE = 'c9c_nazokake';
export const C9C_HIKKURI = 'c9c_hikkuri';
export const C9C_BOSSES = [C9C_NAZOKAKE, C9C_HIKKURI];
export const NAZOKAKE_NAME = 'なぞの番人ナゾカケ';
export const HIKKURI_NAME = 'ヒックリカエール2号';
// 第3部 第1章 第3幕の ふつうの 魔物（仲間に なる 6しゅ）
export const C9C_RIVER_MON = ['c9c_namazu', 'c9c_gama'];
export const C9C_PYR_MON = ['c9c_bat', 'c9c_golem', 'c9c_scarab', 'c9c_mummy'];
export const C9C_MINIONS = [...C9C_RIVER_MON, ...C9C_PYR_MON];
// 色ちがいの もと（今 いる 魔物の 絵）
export const C9C_RECOLOR_BASE = { c9c_gama: 'dry_frog', c9c_bat: 'pendulum_bat', c9c_scarab: 'gold_beetle', c9c_mummy: 'mummy_soldier' };
// 新しい 絵（3しゅまで）
export const C9C_NEW_ART = ['c9c_namazu', 'c9c_golem'];

export const MONSTERS_C9C = {
  // ── 地下の川（Lv100。暗いので 見えにくい）──
  // どうくつの大なまず: 大きな 口と 長い ひげの なまず。どろの 中から ぬっと 出る
  c9c_namazu: {
    name: 'どうくつの大なまず', lv: 100, hp: 2000, mp: 160, str: 412, def: 360, agi: 170, mag: 260, exp: 6450, gold: 2120,
    race: 'beast', size: 'l', hit: 'bite', region: 6, c9b: { hide: 0.25 },
    resist: { bolt: 1.4, ice: 0.8, fire: 1.0, wind: 1.0, light: 1.1, dark: 0.8, poison: 0.4, sleep: 0.4, confuse: 0.4 }, drops: { common: ['toku_herb', 10], rare: ['c7i_snow_mail', 80] },
    actions: [{ w: 3, id: 'm9c_nz_gulp' }, { w: 2, id: 'm9c_nz_quake', cond: 'notRecent:m9c_nz_quake' }, { w: 1, id: 'm9c_nz_mud', cond: 'notRecent:m9c_nz_mud' }, { w: 1, id: 'attack' }],
    desc: '地下の川の、どろの中にすむ大きななまず。暗い水にまぎれて、見えにくい。雷がよく効く。',
  },
  // 川べのガマ: 地下の 川べに すむ 大きな ガマガエル（ひからびガエルの 色ちがい）
  c9c_gama: {
    name: '川べのガマ', lv: 100, hp: 1900, mp: 200, str: 396, def: 330, agi: 220, mag: 300, exp: 6380, gold: 2100,
    race: 'beast', size: 'm', hit: 'bite', region: 6, c9b: { hide: 0.25 },
    resist: { fire: 1.35, ice: 0.8, wind: 1.0, bolt: 1.0, light: 1.0, dark: 1.0, poison: 0.3, sleep: 0.4, confuse: 0.4 }, drops: { common: ['moon_drop', 18], rare: ['c7i_snow_hat', 80] },
    actions: [{ w: 3, id: 'm9c_gm_tongue' }, { w: 2, id: 'm9c_gm_song', cond: 'notRecent:m9c_gm_song' }, { w: 1, id: 'm9c_gm_splash' }, { w: 1, id: 'attack' }],
    desc: '地下の川べで、ゲコゲコ歌う大きなガマ。暗い川べにまぎれて、見えにくい。炎がよく効く。',
  },

  // ── さかさのピラミッド（1〜2階 Lv100・3〜4階 Lv101）──
  // さかさコウモリ: 天じょうでは なく ゆかに ぶら下がる（さかさの 国の）コウモリ（ふりこコウモリの 色ちがい）
  c9c_bat: {
    name: 'さかさコウモリ', lv: 100, hp: 1850, mp: 160, str: 404, def: 300, agi: 370, mag: 230, exp: 6400, gold: 2110,
    race: 'beast', size: 'm', flying: true, hit: 'bite', region: 6,
    resist: { light: 1.35, dark: 0.7, fire: 1.0, ice: 1.0, wind: 1.1, bolt: 1.0, poison: 0.4, sleep: 0.4, confuse: 0.3 }, drops: { common: ['antidote', 14], rare: ['c7i_snow_boomerang', 80] },
    actions: [{ w: 3, id: 'm9c_bt_fang' }, { w: 2, id: 'm9c_bt_flip', cond: 'notRecent:m9c_bt_flip' }, { w: 1, id: 'm9c_bt_swoop' }, { w: 1, id: 'attack' }],
    desc: 'ゆかにぶら下がる、さかさまのコウモリ。上と下が、ぜんぜん気にならない。光がよく効く。',
  },
  // 砂時計ゴーレム: 体が 大きな 砂時計の 石の 人形。ときどき 自分を ひっくり返す
  c9c_golem: {
    name: '砂時計ゴーレム', lv: 101, hp: 2300, mp: 120, str: 430, def: 430, agi: 150, mag: 200, exp: 6600, gold: 2180,
    race: 'material', size: 'l', hit: 'smash', region: 6,
    resist: { ice: 1.35, blast: 1.3, fire: 0.7, wind: 0.9, bolt: 0.9, light: 1.0, dark: 1.0, poison: 0, sleep: 0.3, confuse: 0.3 }, drops: { common: ['silver_shard', 12], rare: ['c7i_snow_shield', 80] },
    actions: [{ w: 3, id: 'm9c_gl_punch' }, { w: 2, id: 'm9c_gl_sand', cond: 'notRecent:m9c_gl_sand' }, { w: 1, id: 'm9c_gl_turn', cond: 'notRecent:m9c_gl_turn' }, { w: 1, id: 'attack' }],
    desc: '体が大きな砂時計になった、石の人形。ときどき自分をひっくり返して、元気になる。氷と爆発がよく効く。',
  },
  // こがねスカラベ: 金色に 光る 大きな こがね虫（第4章の 黄金虫の 色ちがい）
  c9c_scarab: {
    name: 'こがねスカラベ', lv: 100, hp: 1950, mp: 200, str: 398, def: 380, agi: 240, mag: 300, exp: 6420, gold: 2300,
    race: 'beast', size: 's', hit: 'claw', region: 6,
    resist: { fire: 1.35, ice: 0.9, wind: 1.0, bolt: 1.0, light: 0.8, dark: 1.0, poison: 0.3, sleep: 0.4, confuse: 0.4 }, drops: { common: ['jou_herb', 10], rare: ['c7i_snow_spear', 80] },
    actions: [{ w: 3, id: 'm9c_sc_horn' }, { w: 2, id: 'm9c_sc_roll', cond: 'notRecent:m9c_sc_roll' }, { w: 1, id: 'm9c_sc_shine', cond: 'notRecent:m9c_sc_shine' }, { w: 1, id: 'attack' }],
    desc: '金色にかがやく、大きなこがね虫。砂の玉をころがして、ピラミッドをそうじしている。炎がよく効く。',
  },
  // さかさミイラ: さかさの ピラミッドを 守る ミイラ（第4章の ミイラ兵の 色ちがい）。ほうたいが 上へ なびく
  c9c_mummy: {
    name: 'さかさミイラ', lv: 101, hp: 2150, mp: 140, str: 424, def: 350, agi: 200, mag: 240, exp: 6550, gold: 2160,
    race: 'undead', size: 'm', hit: 'slash', region: 6,
    resist: { fire: 1.4, light: 1.4, dark: 0.4, poison: 0, ice: 0.9, wind: 1.0, bolt: 1.0, sleep: 0.3, confuse: 0.5 }, drops: { common: ['holy_water', 12], rare: ['c7i_snow_sword', 80] },
    actions: [{ w: 3, id: 'm9c_mm_grab' }, { w: 2, id: 'm9c_mm_bandage', cond: 'notRecent:m9c_mm_bandage' }, { w: 1, id: 'm9c_mm_upside', cond: 'notRecent:m9c_mm_upside' }, { w: 1, id: 'attack' }],
    desc: 'さかさのピラミッドを守るミイラ。ほうたいが、上へ上へとなびいている。炎と光がよく効く。',
  },

  // ── 中ボス: なぞの番人 ナゾカケ（さかさのピラミッド 2階の おく。Lv101）──
  // c9c … しかけ（battle-c9c.js の riddle）
  //   every … なぞを 出すまでの 行動 / limit … なぞが 出てから 時間切れまでの 行動 / guard … なぞの守りの ばい（受ける ダメージ）/
  //   wrong … はずれた 人の さかさま（こんらん）の 回数 / timeout … 時間切れの 全体の 攻撃の 強さ / hard … むずかしい なぞに なる HPの わりあい /
  //   slow … なぞが 出て いる 間の ゲージの 速さ（小さい 子が 読んで 答える 間。tmul）
  [C9C_NAZOKAKE]: {
    name: NAZOKAKE_NAME, short: 'ナゾカケ', lv: 101, hp: 82000, mp: 9999, str: 3800, def: 350, agi: 240, mag: 980, exp: 122000, gold: 41000,
    race: 'material', size: 'xl', boss: true, turns: 1, speed: 1.0, hit: 'claw', artScale: 0.5,
    drops: { boss: ['c9cb_riddle_charm'], bonus: ['limit_stone'], rare: ['c9cb_riddle_boomerang', 1] },
    resist: { ...BOSS_STATUS, light: 1.1, dark: 0.8, fire: 0.9, ice: 1.0, wind: 1.0, bolt: 1.1 },
    c9c: {
      kind: 'riddle', every: 3, limit: 2, guard: 0.3, wrong: 2, timeout: { mult: 0.95 }, hard: 0.5, slow: 0.5,
      // 人数（家族の キャラの 数）で 合わせる [1人, 2人, 3人, 4人, 5人]: hp・atk … ナゾカケの HP・攻撃力の ばい
      //   limit … 時間切れまでの 行動（人が 少ない ときは 答える 人の 番が 来る まで 長く）
      //   solo … 仲間なしの ひとり（戦う 人が 1人だけ）の とき。few より 先に 見る
      few: { hp: [0.74, 0.9, 0.95, 1, 1.05], atk: [0.81, 0.92, 0.96, 1, 1], limit: [2, 2, 2, 2, 2] },
      solo: { hp: 0.2, atk: 0.42, limit: 2 },
      monK: { hp: 0.03, atk: 0.02 },
    },
    actions: [{ w: 3, id: 'm9z_claw' }, { w: 2, id: 'm9z_tail' }, { w: 1, id: 'm9z_gaze', cond: 'notRecent:m9z_gaze' }, { w: 1, id: 'm9z_roar', cond: 'notRecent:m9z_roar' }],
    desc: 'さかさのピラミッドの、なぞの番人。天じょうから、さかさにすわっている石のけもの。なぞを出して、答えられない者を通さない。',
  },

  // ── 幕の ボス: ホシドロ一味と ヒックリカエール2号（音の 間。Lv102）──
  // c9c … しかけ（battle-c9c.js の sand）
  //   sand … 砂の めもりの つぶ / dizzyAt … ひっくり返して 目が回る めもり（これ いか）/ dizzyMult … 目が回って いる 間の 受ける ダメージ /
  //   boom … 大ばくはつ（全体 mult・身を 守った 人の ばい guardCut）/ counter … まだ早い の 反げき / addAt … 砂を 足す HPの わりあい（2つぶずつ）/
  //   pochi … ポチッとねの 前ぶれまでの 行動（every）と 強さ（mult）
  [C9C_HIKKURI]: {
    name: HIKKURI_NAME, short: 'ヒックリカエール', lv: 102, hp: 90000, mp: 9999, str: 3460, def: 360, agi: 240, mag: 1000, exp: 128000, gold: 43000,
    race: 'material', size: 'xl', boss: true, turns: 1, speed: 1.0, hit: 'claw', artScale: 0.5,
    drops: { boss: ['c9cb_trio_goggles'], bonus: ['limit_stone'], rare: ['c9cb_sand_dagger', 1] },
    resist: { ...BOSS_STATUS, bolt: 1.2, ice: 1.1, fire: 0.9, wind: 1.0, light: 1.0, dark: 1.0 },
    c9c: {
      kind: 'sand', sand: 6, dizzyAt: 2, dizzyMult: 1.5, boom: { mult: 1.25, guardCut: 0.5 }, counter: { mult: 1.5 }, addAt: 0.5,
      pochi: { every: 5, mult: 2.2 },
      // 人数で 合わせる [1人, 2人, 3人, 4人, 5人]: hp・atk … メカの HP・攻撃力の ばい / boom … 大ばくはつの ばい
      few: { hp: [0.8, 0.8, 0.95, 1, 1.08], atk: [0.86, 0.86, 0.96, 1, 1.03], boom: [1, 1, 1, 1, 1] },
      solo: { hp: 0.17, atk: 0.36, boom: 2.6 },
      monK: { hp: 0, atk: 0 },
    },
    actions: [{ w: 3, id: 'm9s_punch' }, { w: 2, id: 'm9s_sandgun' }, { w: 1, id: 'm9s_drill', cond: 'notRecent:m9s_drill' }],
    desc: 'ホシドロ一味のキラジョ・ボヤッチ・ズラッカが乗る、大きな砂時計のメカ。砂が落ちきると、ばくはつする。',
  },
};

// 素材の ドロップ（loot.js の MAT_DROPS に まぜる。今の 素材だけ）
export const C9C_MAT_DROPS = {
  c9c_namazu: ['land_shard', 3],
  c9c_gama: ['magic_powder', 3],
  c9c_bat: ['beast_fang', 3],
  c9c_golem: ['star_sand', 3],
  c9c_scarab: ['silver_shard', 3],
  c9c_mummy: ['magic_powder', 3],
};
