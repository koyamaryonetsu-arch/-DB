// 第85回 B班: 烈火の炎の 系統（火の 道具箱）「忍者 → 炎術士 → 八竜の炎術士・烈火」
// （docs/plan-jobs-r79.md の 10-4・docs/plan-r85-jobs-b.md）
//
// ・今の 職業から 枝分かれ（忍者 → 木の葉の忍び → 七代目火影 と おなじ 形。新しい 職業は 2つ）
//   炎術士（超級職。忍者〈今の 上級職〉を きわめる）→ 八竜の炎術士・烈火（伝説。炎術士 ＋ ほかの 超級職 1つ ＝ reqSuper: 1）
//   忍者から 進める 超級職は 木の葉の忍び と 炎術士 の 2つに なる（どちらも 忍者Lv10。かぶらせない: 木の葉は 体術と 分身・炎術士は 火竜の 道具箱）
// ・この 系統だけの しくみ（火竜をよぶ〈えらぶ メニュー〉・晴れで 炎が ×1.3・姫を守る忍び）は shared/battle-r85b.js
//   （戦いの 中だけ。キャラにも セーブにも 項目を 足さない）
// ・名前の 字は 設計の まま（「炎」「術」「竜」「烈」は 使える 字）
// ・今の 火の 職業（炎柱・日の呼吸の使い手）は 攻めだけ。こちらは 守り・回復・じゃまも できる「火の 道具箱」
// ・技は abilities-r85b.js・ひらめき技は hirameki-r85b.js
// jobs.js が JOBS に まぜて、SUPER_ORDER・LEGEND_ORDER に 1つずつ 足す（R85B_ORDERS。基本職・上級職は ない）

export const JOBS_R85B = {
  enjutsushi: {
    id: 'enjutsushi', name: '炎術士', kana: 'えんじゅつし', short: '炎術', tier: 2, req: ['ninja'], family: 'tech', color: '#d8401c',
    desc: '体に火竜をやどした、炎をあやつる忍び。よぶ火竜を選んで、攻めにも守りにも使える「火の道具箱」。晴れの日は、炎がもっと強くなる。忍者をきわめるとなれる。',
    mods: { hp: 1.3, mp: 1.3, str: 1.4, def: 1.05, agi: 1.6, mag: 1.05, heal: 0.8 },
    weapons: ['dagger', 'claw', 'boomerang', 'none'], shield: false, armor: ['cloth', 'gi'], helm: true,
    perLv: { agi: 1, str: 0.5 },
    learn: [[1, 'ej_ryu'], [2, 'ej_hanabi'], [3, 'ej_kakure'], [5, 'ej_kaina'], [7, 'ej_shuriken'], [10, 'enjutsushi_sig']],
  },
  rekka: {
    id: 'rekka', name: '八竜の炎術士・烈火', kana: 'はちりゅうのえんじゅつしれっか', short: '烈火', tier: 3, req: ['enjutsushi'], reqSuper: 1, family: 'tech', color: '#e8301c',
    desc: '8ひきの火竜をしたがえる、伝説の炎術士。けっかい・まぼろし・光線・不死鳥まで、8つのちがう力をよび出せる。炎術士と、ほかの超級職を1つきわめた者だけがなれる。',
    mods: { hp: 1.7, mp: 1.4, str: 1.6, def: 1.4, agi: 1.65, mag: 0.95, heal: 0.9 },
    weapons: ['dagger', 'claw', 'boomerang', 'none'], shield: false, armor: ['cloth', 'gi'], helm: true,
    perLv: { hp: 1, agi: 1, str: 0.5 },
    learn: [[1, 'rk_ryu'], [3, 'rk_hime'], [5, 'rk_kiba'], [7, 'rk_renpatsu'], [8, 'rk_mezame'], [10, 'rekka_sig']],
  },
};

// 段ごとの ならび（[基本職, 上級職, 超級職, 伝説]。jobs.js が それぞれの ORDER に 足す。基本職・上級職は ない）
export const R85B_ORDERS = [[], [], ['enjutsushi'], ['rekka']];
export const R85B_JOBS = R85B_ORDERS.flat();

// 神殿の うわさ（超級職・伝説）
export const HINTS_R85B = {
  enjutsushi: '忍者をきわめた者の中には、体に火竜をやどし、炎をあやつる者がいるらしい…',
  rekka: '炎術士と、ほかの超級職を1つきわめた者は、8ひきの火竜をしたがえられるらしい…',
};
