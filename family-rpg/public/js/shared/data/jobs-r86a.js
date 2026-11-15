// 第86回 A班: 幻の職業 2つ（docs/plan-jobs-r79.md の 4・11。docs/plan-r86-phantom-a.md）
//   人とようかいのかけ橋（ばくりゅうはの大よう ＋ おにの手のじごく先生）・竜神の剣士（竜神けんのサムライ ＋ 八竜の炎術士・烈火）
//
// ・なり方は 今の 幻の職業と おなじ: req の 2つを きわめる ＋ やりこみの 条件（shared/data/phantom.js の PHANTOM_JOBS）。reqSuper は 使わない
// ・能力の 合計は 幻の はんい（10.85〜11.9）。技は 8こ（看板 こみ。abilities-r86a.js）・ひらめき技は 1つずつ（hirameki-r86a.js）
// ・この 職業だけの しくみは shared/battle-r86a.js（戦いの 中だけ。キャラにも セーブにも 項目を 足さない）
//   人とようかいのかけ橋 … 守るほど 強い（かばって 受けた ダメージの 半分を「ためた力」に して 次の 攻撃に のせる）・
//                          弱った 仲間を 自動で かばう（passive.r86aGuard。じごく先生と おなじ 8わり）・
//                          きずなの力（ようかい化と おにの手の 力を、命令できる まま・HP が へらずに）
//   竜神の剣士           … 2つの 属性の 剣（今の 玉の 属性 と 炎 の、敵に よく 効く 方）・玉がえ（YAIBA と おなじ 画面）・
//                          火竜を 4ひきに しぼって よぶ（烈火と おなじ メニュー）
// jobs.js が JOBS に まぜて、PHANTOM_ORDER に 2つ 足す（R86A_PHANTOM）。うわさは JOB_HINTS に（HINTS_R86A）

export const JOBS_R86A = {
  // ばくりゅうはの大よう ＋ おにの手のじごく先生 → 人とようかいのかけ橋
  yokai_bridge: {
    id: 'yokai_bridge', name: '人とようかいのかけ橋', kana: 'ひととようかいのかけはし', short: 'かけ橋', tier: 4, req: ['bakuryuha', 'jigoku_sensei'], family: 'phys', color: '#e8e4f0',
    desc: '人の心とようかいの力を、どちらも大切にする者。ばくりゅうはの大ようとおにの手のじごく先生をきわめ、仲間をたくさん守った者だけがなれる。かばって受けた力をためて、風にして敵に返す。',
    mods: { hp: 2.05, mp: 1.2, str: 2.0, def: 1.85, agi: 1.55, mag: 0.95, heal: 1.3 },
    weapons: ['sword', 'claw', 'staff', 'none'], shield: true, armor: ['cloth', 'gi', 'robe'], helm: false,
    perLv: { hp: 1.5, str: 1, def: 1 },
    // r86aGuard … 弱った 仲間への 攻撃を 自動で かばう わりあい（じごく先生の passive.protect と おなじ 0.8。shared/battle-r86a.js）
    passive: { r86aGuard: 0.8 },
    learn: [[1, 'kb_kaze'], [2, 'kb_kabau'], [3, 'kb_onizume'], [5, 'kb_kizuna'], [6, 'kb_chikai'], [7, 'kb_rengeki'], [8, 'kb_kaeshi'], [10, 'yokai_bridge_sig']],
  },
  // 竜神けんのサムライ ＋ 八竜の炎術士・烈火 → 竜神の剣士
  ryujin_kenshi: {
    id: 'ryujin_kenshi', name: '竜神の剣士', kana: 'りゅうじんのけんし', short: '竜神剣士', tier: 4, req: ['ryujin_samurai', 'rekka'], family: 'phys', color: '#3a7ae8',
    desc: '雷の竜と火の竜を、1本の刀にやどした剣士。竜神けんのサムライと八竜の炎術士・烈火をきわめ、雷と火竜の技をたくさん使った者だけがなれる。刀は、今の玉の力と炎の、敵によく効く方で切る。',
    mods: { hp: 1.8, mp: 1.45, str: 2.1, def: 1.5, agi: 1.9, mag: 0.95, heal: 1.15 },
    weapons: ['sword', 'dagger', 'none'], shield: false, armor: ['cloth', 'gi', 'heavy'], helm: true,
    perLv: { str: 1.5, agi: 1, hp: 0.5 },
    learn: [[1, 'rs_futae'], [2, 'rs_tamagae'], [3, 'rs_ryu'], [5, 'rs_senpu'], [6, 'rs_kokoro'], [7, 'rs_raien'], [8, 'rs_rengeki'], [10, 'ryujin_kenshi_sig']],
  },
};

// 幻の職業の ならびに 足す（jobs.js の PHANTOM_ORDER の おわり。B班の 2つは この あと）
export const R86A_PHANTOM = ['yokai_bridge', 'ryujin_kenshi'];

// 神殿の うわさ（片方を きわめた 人に。名前は 出さない・物語の 先は 書かない）
export const HINTS_R86A = {
  yokai_bridge: 'ようかいの力をおさえた半ようと、おにの手の先生。2人の道をきわめて仲間を守りぬいた者は、人とようかいをつなぐ者になれるらしい…',
  ryujin_kenshi: '7つの玉のサムライと、8ひきの火竜の炎術士。2つの道をきわめて雷と火竜をあやつった者は、2ひきの竜を刀にやどせるらしい…',
};

// 乗り物（data/vehicles.js に まぜる。その 幻の職業に なった 人の たなに だけ。絵は client/render/vehicle-r86a.js）
export const R86A_VEHICLES = {
  white_dog: { name: '大きな白い犬', price: 26000, jobs: ['yokai_bridge'], phantom: true, desc: 'ふさふさの白い毛の、大きな犬。赤いかざりひもをなびかせて、風のように走る。' },
  twin_dragons: { name: '雷と炎の二ひきの竜', price: 29000, jobs: ['ryujin_kenshi'], phantom: true, desc: '青い雷の竜と、赤い炎の竜。長い体をより合わせて、空をうねりながら進む。' },
};
