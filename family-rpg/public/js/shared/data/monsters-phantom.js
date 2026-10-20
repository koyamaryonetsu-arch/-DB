// 第5章 Step 8「影の城」の 魔物と、3人の まぼろし（B8: 戦い。docs/plan-ch5.md の 17）
// monsters.js（MONSTERS）・loot.js（MAT_DROPS）が まぜる。ここは ほかの データを import しない（じゅんかんを さける）
// え は client/render/ch5-phantom-art.js。たたかいの しかけ（風のかべ・かげ火の力・水かさ）は shared/battle-phantom.js
//
// 出現表（encounters-phantom.js）: t5_castle_wind＝影の城 1〜4階（風の階）/ t5_castle_fire＝5〜8階（炎の階）/ t5_castle_water＝9〜12階（水の階）
// おすすめ Lv52〜54。region: 6 … ふつうの 魔物が まれに 落とす「空の レア装備」の 地方（data/rare-loot.js の regionOf）
// かおのない影（monsters-earth.js の faceless_shade）も 3つの 階に 少し 出る
//
// ・3人の まぼろし（きまった 戦い。前の 章の ボスを 影の城が 写した もの。前の しかけを 強くして、新しい しかけを 1つずつ）
//   phantom_storm（ストルムのまぼろし。Lv52）… 竜巻の 前ぶれ（身を 守る）・嵐の兵の まぼろしを 2回 よぶ・HP30%で よろいが くだける ＋
//                   新しい「風のかべ」（その 間は 物理の 攻撃が はね返される。呪文・合体技は とどく）
//   phantom_ignia（イグニアのまぼろし。Lv53）… かげ火を よぶ・大炎の 前ぶれ・かげろう ＋
//                   新しい「かげ火の力」（大炎の とき、のこっている かげ火を すいこんで、その 数だけ 大炎が 強く なる）
//   phantom_morgana（モルガナのまぼろし。Lv54）… まぼろしの 分身（当てると キズが いえる）・水の衣（雷で はじける）・鏡写し ＋
//                   新しい「水かさ」（モルガナが 動く たびに 水が 上がり、いっぱいに なると 大波。水の衣を 雷で はじくと 水かさが 下がる）

// ボスの じょうたい いじょうの 効きにくさ（ノクト（1回目）と おなじ）
const BOSS_STATUS = { sleep: 0.1, poison: 0.3, confuse: 0.1, blind: 0.3, silence: 0.2, paralyze: 0.1 };
export const PHANTOM_STORM = 'phantom_storm';
export const PHANTOM_IGNIA = 'phantom_ignia';
export const PHANTOM_MORGANA = 'phantom_morgana';
export const PHANTOMS = [PHANTOM_STORM, PHANTOM_IGNIA, PHANTOM_MORGANA];
export const PHANTOM_SOLDIER = 'phantom_soldier';
export const PHANTOM_FLAME = 'phantom_flame';

export const MONSTERS_PHANTOM = {
  // ── 1〜4階「風の階」──
  // あらしガラス: 黒い 雲を まとった 大きな カラス。風の つばさで あおぎ、かみなりの 羽を とばす
  gale_crow: {
    name: 'あらしガラス', lv: 52, hp: 1180, mp: 120, str: 188, def: 138, agi: 150, mag: 190, exp: 1260, gold: 560,
    race: 'beast', size: 'm', flying: true, hit: 'claw', region: 6,
    resist: { bolt: 1.35, wind: 0.3, ice: 1.1, dark: 0.8, poison: 0.6, sleep: 0.6, confuse: 0.6 }, drops: { common: ['jou_herb', 10], rare: ['seed_agi', 36] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm_gc_wing', cond: 'notRecent:m_gc_wing' }, { w: 2, id: 'm_gc_dive' }, { w: 2, id: 'm_gc_feather' }],
    desc: '黒い雲をまとった、大きなカラス。風のつばさで、みんなをあおぐ。かみなりの羽にさされると、体がしびれる。雷がよく効く。',
  },
  // 風車の番人: 影の城の 風車を 守る、石と 木の 番人。風車の はねの うでで なぎはらう
  mill_keeper: {
    name: '風車の番人', lv: 52, hp: 1560, mp: 80, str: 206, def: 196, agi: 62, mag: 150, exp: 1320, gold: 600,
    race: 'material', size: 'l', hit: 'bash', region: 6,
    resist: { fire: 1.3, wind: 0.4, bolt: 0.9, dark: 0.7, poison: 0, sleep: 0.3, confuse: 0.3 }, drops: { common: ['magic_water', 12], rare: ['seed_def', 36] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm_mk_blade', cond: 'notRecent:m_mk_blade' }, { w: 2, id: 'm_mk_gust', cond: 'notRecent:m_mk_gust' }, { w: 1, id: 'm_mk_brace', cond: 'notRecent:m_mk_brace' }],
    desc: '影の城の風車を守る、石と木の番人。風車のはねのようなうでを、ぐるぐる回してなぎはらう。炎がよく効く。',
  },
  // かまいたち: つむじ風に のって 走る 小さな けもの。見えない 風の やいばで 切る
  wind_weasel: {
    name: 'かまいたち', lv: 52, hp: 980, mp: 90, str: 196, def: 120, agi: 196, mag: 130, exp: 1180, gold: 520,
    race: 'beast', size: 's', hit: 'claw', region: 6,
    resist: { wind: 0.2, fire: 1.3, ice: 1.1, poison: 0.7, sleep: 0.7, confuse: 0.6 }, drops: { common: ['herb', 4], rare: ['seed_str', 36] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm_ww_cut' }, { w: 1, id: 'm_ww_dance', cond: 'notRecent:m_ww_dance' }],
    desc: 'つむじ風にのって走る、小さなけもの。見えない風のやいばで、何回も切りつけてくる。とても素早い。炎がよく効く。',
  },

  // ── 5〜8階「炎の階」──
  // 火の粉オオカミ: もえる 毛なみの オオカミ。火の粉の いきを はく
  ember_wolf: {
    name: '火の粉オオカミ', lv: 53, hp: 1380, mp: 90, str: 222, def: 150, agi: 120, mag: 160, exp: 1340, gold: 600,
    race: 'beast', size: 'm', hit: 'bite', region: 6,
    resist: { fire: 0.1, ice: 1.4, wind: 1.1, poison: 0.6, sleep: 0.6, confuse: 0.6 }, drops: { common: ['jou_herb', 10], rare: ['seed_str', 36] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm_ew_breath', cond: 'notRecent:m_ew_breath' }, { w: 2, id: 'm_ew_fang' }, { w: 1, id: 'm_ew_howl', cond: 'notRecent:m_ew_howl' }],
    desc: 'もえる毛なみのオオカミ。火の粉のいきをはき、もえるキバでかみつく。氷がよく効く。',
  },
  // ろうそくおばけ: 影の城の ろうそくの 火に やどった おばけ。とけた ろうで 足を とめる
  candle_ghost: {
    name: 'ろうそくおばけ', lv: 53, hp: 1120, mp: 160, str: 170, def: 128, agi: 96, mag: 214, exp: 1300, gold: 640,
    race: 'undead', size: 's', flying: true, region: 6,
    resist: { fire: 0, ice: 1.3, light: 1.3, dark: 0.3, poison: 0, sleep: 0.4, confuse: 0.4 }, drops: { common: ['magic_water', 10], rare: ['seed_mag', 36] },
    actions: [{ w: 3, id: 'm_cg_flame' }, { w: 2, id: 'm_cg_wax', cond: 'notRecent:m_cg_wax' }, { w: 2, id: 'm_cg_sway', cond: 'notRecent:m_cg_sway' }, { w: 1, id: 'attack' }],
    desc: '影の城のろうそくの火にやどった、小さなおばけ。とけたろうをたらして、足をとめてくる。氷と光がよく効く。',
  },
  // 黒ほのおの騎士: 黒い 炎を まとった よろいの 騎士。イグニアの 城を 守る
  blackflame_knight: {
    name: '黒ほのおの騎士', lv: 53, hp: 1620, mp: 100, str: 232, def: 204, agi: 70, mag: 170, exp: 1400, gold: 660,
    race: 'demon', size: 'l', hit: 'slash', region: 6,
    resist: { fire: 0.2, ice: 1.3, dark: 0.5, light: 1.1, poison: 0.3, sleep: 0.3, confuse: 0.3 }, drops: { common: ['jou_herb', 10], rare: ['seed_def', 36] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm_bk_slash' }, { w: 2, id: 'm_bk_wall', cond: 'notRecent:m_bk_wall' }],
    desc: '黒い炎をまとった、よろいの騎士。黒い炎の剣で切りかかり、炎のかべでみんなをつつむ。氷がよく効く。',
  },

  // ── 9〜12階「水の階」──
  // 鏡くらげ: 鏡の ように 光る くらげ。体が 光ると 呪文を はね返す
  mirror_jelly: {
    name: '鏡くらげ', lv: 54, hp: 1240, mp: 160, str: 186, def: 150, agi: 90, mag: 210, exp: 1360, gold: 640,
    race: 'slime', size: 'm', flying: true, region: 6,
    resist: { bolt: 1.4, ice: 0.6, fire: 0.6, light: 0.6, poison: 0, sleep: 0.4, confuse: 0.3 }, drops: { common: ['magic_water', 12], rare: ['seed_mag', 36] },
    actions: [{ w: 3, id: 'm_mj_sting' }, { w: 2, id: 'm_mj_bubble', cond: 'notRecent:m_mj_bubble' }, { w: 2, id: 'attack' }, { w: 2, id: 'm_mj_glow', cond: ['notRecent:m_mj_glow', 't:noReflect'] }],
    desc: '鏡のように光る、すきとおったくらげ。体が光ったら、次の番まで呪文をはね返す。しびれる手にも気をつけよう。雷がよく効く。',
  },
  // 水かげの大へび: 水の 階の 水路に ひそむ 大きな へび
  shade_serpent: {
    name: '水かげの大へび', lv: 54, hp: 1680, mp: 90, str: 236, def: 176, agi: 92, mag: 160, exp: 1440, gold: 680,
    race: 'dragon', size: 'l', hit: 'bite', region: 6,
    resist: { bolt: 1.3, ice: 0.5, fire: 0.6, poison: 0.3, sleep: 0.5, confuse: 0.5 }, drops: { common: ['jou_herb', 10], rare: ['seed_hp', 40] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm_ss_bite' }, { w: 2, id: 'm_ss_coil', cond: 'notRecent:m_ss_coil' }, { w: 2, id: 'm_ss_tide', cond: 'notRecent:m_ss_tide' }],
    desc: '水の階の水路にひそむ、大きなへび。かみつき、しめつけて、うずしおをおこす。雷がよく効く。',
  },
  // あわの歌姫: 水の あわから 生まれた 歌姫。ねむりの 歌と いやしの 歌を うたう
  foam_siren: {
    name: 'あわの歌姫', lv: 54, hp: 1060, mp: 200, str: 160, def: 130, agi: 110, mag: 220, exp: 1380, gold: 700,
    race: 'spirit', size: 'm', region: 6,
    resist: { bolt: 1.3, ice: 0.5, fire: 0.7, dark: 0.8, poison: 0, sleep: 0, confuse: 0.4 }, drops: { common: ['magic_water', 12], rare: ['seed_mag', 36] },
    actions: [{ w: 3, id: 'm_fsi_shot' }, { w: 2, id: 'm_fsi_lull', cond: 'notRecent:m_fsi_lull' }, { w: 2, id: 'm_fsi_mend', cond: ['allyHurt', 'notRecent:m_fsi_mend'] }, { w: 1, id: 'attack' }],
    desc: '水のあわから生まれた、すきとおった歌姫。ねむりの歌で敵をねむらせ、いやしの歌で仲間を回復する。雷がよく効く。',
  },

  // ── 4階: ストルムのまぼろし（風の ふういんの とびらの 前）──
  // castle.wall … 風のかべ（cut … 物理の ダメージの ばい・back … はね返す ダメージ〈当てた 人の さいだいHPの わりあい〉・acts … ストルムが 何回 動くまで）
  [PHANTOM_STORM]: {
    name: 'ストルムのまぼろし', lv: 52, hp: 24200, mp: 3000, str: 617, def: 176, agi: 100, mag: 400, exp: 20000, gold: 7000,
    race: 'demon', size: 'xl', boss: true, turns: 2, speed: 0.68, hit: 'slash', phantom: true, drops: { boss: ['ph_storm_bangle'], rare: ['seed_agi', 3] },
    resist: { ...BOSS_STATUS, sleep: 0, confuse: 0, paralyze: 0, wind: 0.3, bolt: 0.6, light: 1.3, dark: 0.6 },
    castle: { kind: 'storm', wall: { cut: 0.2, back: 0.15, acts: 3 } },
    // たおれると 嵐の兵の まぼろしも 消える
    minionsFall: [PHANTOM_SOLDIER], fallMsg: '嵐の兵のまぼろしも、風になって消えていった…！',
    actions: [
      { w: 3, id: 'attack' }, { w: 3, id: 'm_ps_blade' }, { w: 2, id: 'm_ps_thunder', cond: 'notRecent:m_ps_thunder' },
      { w: 1, id: 'm_warcry', cond: 'notRecent:m_warcry' },
      { w: 2, id: 'm_ps_tornado_charge', cond: ['notRecent:m_ps_tornado_charge', 'c5:psCalm'] },
      // 風のかべ（かべが ない・竜巻の 前ぶれで ない とき。つづけては しない）
      { w: 2, id: 'm_ps_wall', cond: ['c5:psWall', 'notRecent:m_ps_wall', 'notRecent:m_ps_tornado_charge'] },
    ],
    phases: [
      { hpBelow: 0.7, msg: ['ストルムのまぼろし「出よ、嵐の兵たちよ！」'], summon: [PHANTOM_SOLDIER, PHANTOM_SOLDIER] },
      { hpBelow: 0.4, msg: ['ストルムのまぼろし「まだだ…嵐の兵よ、もう一度！」'], summon: [PHANTOM_SOLDIER, PHANTOM_SOLDIER] },
      {
        hpBelow: 0.25, msg: ['嵐のよろいのまぼろしが、くだけた！', 'ストルムのまぼろし「嵐は…ここからだ！」'], debuff: { def: 0.75 }, buff: { atk: 1.2 },
        addActions: [{ w: 2, id: 'm_ps_tornado_charge', cond: ['notRecent:m_ps_tornado_charge', 'c5:psCalm'] }],
      },
    ],
    desc: '影の城が写した、嵐の将軍ストルムのまぼろし。前よりずっと強い。マントがふくらんだら、大竜巻の前ぶれ。風のかべをまとうと、物理の攻撃ははね返される。そのときは呪文で戦おう。',
  },
  // ── 8階: イグニアのまぼろし（炎の ふういんの とびらの 前）──
  // castle.fuel … 大炎の とき すいこむ かげ火 1体ごとに 大炎が この ぶん 強く なる（per）。call … 1回に よぶ かげ火の 数・max … いっしょに いる 数
  [PHANTOM_IGNIA]: {
    name: 'イグニアのまぼろし', lv: 53, hp: 22500, mp: 3000, str: 624, def: 170, agi: 104, mag: 504, exp: 21000, gold: 7400,
    race: 'demon', size: 'xl', boss: true, turns: 2, speed: 0.68, phantom: true, drops: { boss: ['ph_ignia_earring'], rare: ['seed_mag', 3] },
    resist: { ...BOSS_STATUS, sleep: 0, confuse: 0, fire: 0, ice: 1.25, light: 1.2, dark: 0.5 },
    castle: { kind: 'ignia', fuel: { per: 0.8 }, call: 2, max: 4 },
    minionsFall: [PHANTOM_FLAME], fallMsg: 'かげ火のまぼろしも、ふっと消えていった…！',
    actions: [
      { w: 3, id: 'm_pi_fire' }, { w: 2, id: 'm_pi_hellfire', cond: 'notRecent:m_pi_hellfire' }, { w: 2, id: 'attack' },
      { w: 1, id: 'm_pi_haze', cond: 'notRecent:m_pi_haze' },
      // かげ火を よぶ（かげ火が 少ない とき）
      { w: 3, id: 'm_pi_call', cond: ['c5:piCall', 'notRecent:m_pi_call'] },
      // 大炎の 前ぶれ（かげ火が いる ときに よく ためる）
      { w: 1, id: 'm_pi_inferno_charge', cond: 'notRecent:m_pi_inferno_charge' },
      { w: 4, id: 'm_pi_inferno_charge', cond: ['c5:piFuel', 'notRecent:m_pi_inferno_charge', 'notRecent:m_pi_call'] },
    ],
    phases: [
      { hpBelow: 0.5, msg: ['イグニアのまぼろし「ふふ…この炎で、もやしつくしてあげる！」'], buff: { atk: 1.15 }, summon: [PHANTOM_FLAME, PHANTOM_FLAME] },
      { hpBelow: 0.2, msg: ['イグニアのまぼろしの炎のつばさが、ゆらぎ始めた…！', '守りが弱くなった！'], debuff: { def: 0.75 } },
    ],
    desc: '影の城が写した、炎の魔女イグニアのまぼろし。かげ火をよび出す。つばさを広げたら大炎の前ぶれ。そのとき、のこっているかげ火をすいこんで、大炎が強くなる。かげ火は氷がよく効く。',
  },
  // ── 12階: モルガナのまぼろし（水の ふういんの とびらの 前。3人の うち 1人が 本物）──
  // castle.tide … 水かさ（max … いっぱい・down … 水の衣を 雷で はじいた ときに 下がる ぶん）
  [PHANTOM_MORGANA]: {
    name: 'モルガナのまぼろし', lv: 54, hp: 23400, mp: 3000, str: 648, def: 176, agi: 100, mag: 504, exp: 22000, gold: 7800,
    race: 'demon', size: 'l', boss: true, turns: 2, speed: 0.8, hit: 'slash', phantom: true, drops: { boss: ['ph_morgana_pendant'], rare: ['seed_hp', 3] },
    resist: { ...BOSS_STATUS, sleep: 0, confuse: 0, bolt: 1.2, fire: 0.6, ice: 0.6, dark: 0.6 },
    // まぼろしの 分身（battle-ch4.js の mirage。分身に 当てると 本物の キズが いえる）。月の鏡の 光が もどるのは 本物が 10回 動いてから・
    // まぶしいのは 1回だけ（第4章の モルガナより 強い）
    mirage: {
      cycle: 6, mirror: 10, heal: 0.006, cloneAtk: 0.6, cloneActions: [{ w: 2, id: 'attack' }, { w: 2, id: 'm_pm_splash' }],
      remake: 'm_morgana_mirage', dazzled: 'm_pm_dazzled', laughBy: 'モルガナのまぼろしのわらい声',
      downMsg: 'まぼろしの分身も、水になって消えていった…！',
      intro: ['モルガナのまぼろしが、3人にふえた！', '（どれが本物…？よく見ると、何かがちがうような…）'],
    },
    veil: { cut: 0.8, block: ['fire'], breakBy: 'bolt', wait: 1 },
    mirrorCopy: true,
    castle: { kind: 'morgana', tide: { max: 6, down: 2 } },
    actions: [
      { w: 2, id: 'attack' }, { w: 3, id: 'm_pm_blade' }, { w: 3, id: 'm_pm_whirl', cond: 'notRecent:m_pm_whirl' }, { w: 1, id: 'm_pm_splash' },
      { w: 2, id: 'm_morgana_song', cond: 'notRecent:m_morgana_song' }, { w: 2, id: 'm_pm_heal', cond: ['hpBelow:0.6', 'notRecent:m_pm_heal'], limit: 2 },
      { w: 4, id: 'm_morgana_veil_charge', cond: ['t:noVeil', 'notRecent:m_morgana_veil_charge'] },
      // 水かさが いっぱい: かならず 大波の 前ぶれ（battle-phantom.js の phantomTurnStart が 出す。これは 出しそこねた ときの ため）
      { w: 99, id: 'm_pm_wave_charge', cond: 'c5:pmTide' },
    ],
    phases: [
      { hpBelow: 0.5, msg: ['モルガナのまぼろしの目が、あやしく青く光った！', '攻撃力が上がった！'], buff: { atk: 1.15 } },
      { hpBelow: 0.2, msg: ['モルガナのまぼろしのすがたが、ゆらぎ始めた…！', '守りが弱くなった！'], debuff: { def: 0.75 } },
    ],
    desc: '影の城が写した、水鏡の魔人モルガナのまぼろし。3人のうち1人が本物で、分身に当てるとキズがいえる。水の衣は雷で破れる。同じ呪文を続けると、はね返される。モルガナが動くたびに水かさが上がり、いっぱいになると大波。水の衣を雷ではじくと、水かさが下がる。',
  },
};

// 数えない 魔物（図鑑・魔物の 数・配合の 一覧に 出ない）: まぼろしが よぶ 手下
//   え は もとの 魔物（art）に 色の かえかた（tint）。render/monsters.js の artOf
export const PHANTOM_HIDDEN = {
  [PHANTOM_SOLDIER]: {
    name: '嵐の兵のまぼろし', lv: 51, hp: 2400, mp: 0, str: 330, def: 150, agi: 96, mag: 120, exp: 600, gold: 0,
    race: 'demon', size: 'm', hit: 'slash', noBefriend: true, art: 'storm_soldier', tint: { hueTo: 196, sat: 0.55, light: 0.95 },
    resist: { ...BOSS_STATUS, wind: 0.4, bolt: 0.8, light: 1.3 },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_pss_slash' }],
    desc: 'ストルムのまぼろしがよび出した、嵐の兵のまぼろし。風のやいばで切りかかる。',
  },
  [PHANTOM_FLAME]: {
    name: 'かげ火のまぼろし', lv: 52, hp: 1500, mp: 0, str: 220, def: 110, agi: 110, mag: 260, exp: 500, gold: 0,
    race: 'undead', size: 's', noBefriend: true, art: 'shadow_flame', tint: { hueTo: 292, sat: 0.9, light: 1.05 },
    resist: { ...BOSS_STATUS, fire: 0, dark: 0.3, light: 1.6, ice: 2 },
    actions: [{ w: 3, id: 'm_pf_fire' }, { w: 1, id: 'attack' }],
    desc: 'イグニアのまぼろしがよび出した、むらさきのかげ火。大炎のときに、すいこまれてしまう。氷がとてもよく効く。',
  },
};
export function addPhantomHidden(table) {
  for (const [id, m] of Object.entries(PHANTOM_HIDDEN)) {
    if (Object.prototype.hasOwnProperty.call(table, id)) continue;
    Object.defineProperty(table, id, { value: m, enumerable: false, configurable: true, writable: true });
  }
}

// 素材の ドロップ（loot.js の MAT_DROPS に まぜる）。影の城の 新しい 素材 3つ（れん金で 使う。items-castle.js）
//   黒い風の羽（風の階）・影火の石（炎の階）・黒しんじゅ（水の階）
export const PHANTOM_MAT_DROPS = {
  gale_crow: ['cs_wind_feather', 3],
  mill_keeper: ['cs_wind_feather', 4],
  wind_weasel: ['cs_wind_feather', 4],
  ember_wolf: ['cs_ember_stone', 3],
  candle_ghost: ['cs_ember_stone', 4],
  blackflame_knight: ['cs_ember_stone', 4],
  mirror_jelly: ['cs_black_pearl', 4],
  shade_serpent: ['cs_black_pearl', 3],
  foam_siren: ['cs_black_pearl', 4],
};
