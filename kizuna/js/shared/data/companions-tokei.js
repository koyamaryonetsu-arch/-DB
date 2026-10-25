// 第2部 第6章 Step 5「止まった時計塔」の 魔物の なかま（companions.js で まぜる）と、ゲストの リオン（RION_GUEST。名前の 約束 docs/plan-ch6.md の 15）
// 第26回の きまり（data/companions-road.js と おなじ）:
// ・ふつうの 魔物は 1/14〜1/18・強い 魔物は 1/20〜1/24
// ・growth の 合計は 今までの 仲間と おなじ はば（力の 魔物 5.8〜6.1・呪文の 魔物 6.8〜7.3）
// ・learn の 技は 味方が 使っても うごく もの（ボスの しかけの 技・なかまを よぶ 技は 入れない）
// ・familyPool に 入れない（noFamily: 系統配合の 子には ならない）。ランクは tools/gen-monster-ranks.mjs の 表（monster-ranks.js）
// ・ここは ほかの データを import しない（酒場・ゲストの 一覧からも 読む ため）
export const FRIENDS_TOKEI = {
  cog_roller: {
    rate: 1 / 20, names: ['ギアロ', 'コロコロ', 'ハグルン', 'ころすけ'],
    growth: { hp: 1.2, mp: 0.5, str: 1.15, def: 1.4, agi: 0.6, mag: 0.6, heal: 0.5 },
    learn: [[1, 'm_tackle'], [4, 'm6t_cg_roll'], [9, 'm6t_cg_lock'], [14, 'sukara'], [20, 'm6t_cg_spin']],
    gear: { weapons: [], armor: ['heavy'], shield: false, head: false },
    note: '顔のある大きな歯車。仲間になると、坂道を見つけるたびに、ころがっていきたがる。めったに仲間にならない。',
  },
  spring_box: {
    rate: 1 / 16, names: ['ビックリ', 'バネッタ', 'ピョコ', 'はこピエロ'],
    growth: { hp: 0.95, mp: 1.0, str: 1.05, def: 0.85, agi: 1.3, mag: 1.1, heal: 0.7 },
    learn: [[1, 'm_tackle'], [4, 'm6t_sb_punch'], [9, 'm6t_sb_scare'], [14, 'medapani'], [20, 'm6t_sb_jump']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: 'hat' },
    note: 'ばねでとび出すピエロの箱。仲間になると、ねている人をおどかして、起こしてくれる。',
  },
  killer: {
    rate: 1 / 18, names: ['キラッチ', 'ドーン', 'バレット', 'くろまる'],
    growth: { hp: 1.0, mp: 0.4, str: 1.35, def: 1.2, agi: 1.15, mag: 0.4, heal: 0.4 },
    learn: [[1, 'm_tackle'], [4, 'm6t_kl_rush'], [9, 'sukara'], [14, 'baikiruto'], [20, 'kabau']],
    gear: { weapons: [], armor: ['heavy'], shield: false, head: false },
    note: 'たいほうからとんでくる、黒いたま。仲間になると、まっすぐしか進めないので、曲がり角でいつもこまっている。',
  },
};

// 系統配合の 子には ならない（companions.js の familyPool）
for (const f of Object.values(FRIENDS_TOKEI)) f.noFamily = true;

// ───── ゲストの リオン（最初の 紋章の 勇者。剣士）─────
// A が 台本の ['guest', 'rion'] で 入れる（c6_clock で 入る・Step 5 の あいだ ずっと）。data/shops.js の GUESTS.rion
// world/party.js の guestChar → makeNpcSupportChar で、レベルは パーティーの いちばん 高い レベル（minLevel より 下には ならない）
// その子だけの 技（ひらめき技として 入る）: 紋章の光の剣（光の 剣の 技。abilities-tokei.js）。装備は 千年前の 里の 店の 品
export const RION_GUEST = {
  id: 'guest_rion', name: 'リオン', job: 'sword_master', tactics: 'balanced', minLevel: 64,
  look: { body: 0, hair: 2, hairColor: 1, skin: 1, color: 4, style: 'spiky', hcol: 'brown', tone: 'light', face: 'brave' },
  skills: ['rn6_crest'],
  gear: { weapon: 'p6_kodai_sword', armor: 'p6_kodai_mail', shield: 'p6_kodai_shield', head: 'p6_kodai_helm' },
};
