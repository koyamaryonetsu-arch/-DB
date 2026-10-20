// 第5章 Step 9（B9）「星のない広間」の 最後の 戦い: ノクト（本気）と 魔王ソリトゥス（B: 戦い）
// monsters.js（MONSTERS）が まぜる。ここは ほかの データを import しない（じゅんかんを さける）
// え は client/render/ch5-final-mon-art.js。しかけは shared/battle-final.js（と、ノクトは battle-nocto.js・battle-earth.js の しかけを そのまま 使う）
// おすすめ Lv55（docs/plan-ch5.md の「17」）。超級職 4人・職業Lv10・その ころの ★装備で 完全オート 1〜2割・しかけを 知って 手で 戦う 7割くらい
//
// ・ノクト（本気。nocto_2）: 今までの ノクトの しかけを ぜんぶ まぜた 戦い（HP半分で 終わらない。たおすと 勝ち）
//   影のまね（nocto … ノクトの影と おなじ。まねられた 人の 攻撃は 半分）・かげぶんしん → ひとりぼっちの合体技（nocto1 … 1回目と おなじ。
//   こんどは 合体技が 合体技の よやくも くだく〈combo.bond〉）・地われ → 手をのばす・きずなくだき（合体技を 見ると 前ぶれ）
//   HPが 半分で ことばが かわる（思い出の かけら 6つ・ピピの 手紙を わたした。リーダーの フラグ。battle-final.js の noctoHeart）
// ・魔王ソリトゥス（solitus）: 3つの 段階（solitus の p2・p3 … その HPの わりあいで 次の 段階）
//   第1段階「ひとりぼっちの闇」… ひとりにする（1人を とじこめる。動けない・仲間の 回復と 補助が とどかない）→ 新しい コマンド「よびかける」
//   第2段階「きずなを食べる」… 背景が 闇に かわる。前ぶれ「みんなの きずなを、じっと 見つめている…」→ きずなを食べる
//                              （みんなに 大きい・合体技の よやくを こわす〈組の だれかが 身を 守れば 守れる〉・身を 守らない 人の 強くなる 力を 食べる）
//   第3段階「終わらない夜」… ノクトが 仲間に 加わる（ゲスト）。ノクトの 紋章が 光り、この 戦いだけ「家族の きずな技」（職業を 問わず みんなで 出す）
const BOSS_STATUS = { sleep: 0.1, poison: 0.3, confuse: 0.1, blind: 0.3, silence: 0.2, paralyze: 0.1 };
export const NOCTO2 = 'nocto_2';
export const SOLITUS = 'solitus';

export const MONSTERS_FINAL = {
  // ── ノクト（本気）──
  [NOCTO2]: {
    name: 'ノクト', lv: 55, hp: 28000, mp: 4000, str: 450, def: 190, agi: 108, mag: 420, exp: 26000, gold: 9000,
    race: 'human', size: 'l', boss: true, turns: 2, speed: 0.68, hit: 'slash', drops: { boss: ['nocto2_twin_charm'] },
    resist: { ...BOSS_STATUS, sleep: 0, confuse: 0, light: 1.2, dark: 0.3 },
    // battle-nocto.js（ノクトの影と おなじ）: mimicEvery … 何回 動く ごとに まねる / mimicRate … まねた 人の 技を 使う わりあい /
    //   half … まねられた 人の 攻撃の ダメージ / bond … きずなくだき（物理 ばい・守り むし・くだいた ときの 強くなる ばい）
    nocto: { mimicEvery: 5, mimicRate: 0.3, half: 0.5, bond: { mult: 3.45, ignoreDef: 0.3, buff: 1.15 } },
    // battle-earth.js（1回目と おなじ）: clones … かげぶんしんの 影の 数 / combo … ひとりぼっちの合体技（bond … 合体技の よやくも くだく）/
    //   rift … 地われの 回数 / stopAt: 0 … HP半分で 終わらない（たおすと 勝ち）
    nocto1: { clones: 2, stay: true, combo: { mult: 1.6, ignoreDef: 0.3, bond: true }, rift: 3, stopAt: 0 },
    // battle-final.js: heartAt … この HPの わりあいで ことばが かわる（思い出の かけら・ピピの 手紙）
    nocto2: { heartAt: 0.5 },
    actions: [
      { w: 3, id: 'attack' }, { w: 3, id: 'm_n2_blade' }, { w: 2, id: 'm_n1_dark', cond: 'notRecent:m_n1_dark' },
      { w: 4, id: 'm_n1_clones', cond: ['c5:n1Clones', 'notRecent:m_n1_clones'] },
      { w: 2, id: 'm_n1_rift', cond: ['c5:n1Rift', 'notRecent:m_n1_rift'] },
      { w: 10, id: 'm_n1_rift', cond: ['c5:n1Rift', 'c5:nsBond'] },
      // まねる（m_ns_mimic）・きずなくだきの 前ぶれ（m_ns_bond_watch）は battle-nocto.js の noctoAction、
      // 合体技の 前ぶれ（m_n1_combo_ready）は battle-earth.js の earthAction が かならず 出す
    ],
    phases: [
      { hpBelow: 0.5, msg: ['ノクトの紋章が、黒く、強く光った…！', 'ノクトの攻撃力が上がった！'], buff: { atk: 1.12 } },
    ],
    desc: '星のない広間で待っていた、もうひとりの紋章の子。本気のノクト。まね・影・地われ・きずなくだき、今までの力をすべて使ってくる。',
  },

  // ── 魔王ソリトゥス（最後の ボス）──
  [SOLITUS]: {
    name: '魔王ソリトゥス', lv: 58, hp: 32000, mp: 9999, str: 600, def: 205, agi: 96, mag: 480, exp: 40000, gold: 12000,
    race: 'demon', size: 'xl', boss: true, turns: 2, speed: 0.9, hit: 'claw', drops: { boss: ['solitus_bond_star'], rare: ['solitus_dawn_sword', 1] },
    resist: { ...BOSS_STATUS, sleep: 0, confuse: 0, paralyze: 0, light: 1.3, dark: 0.1 },
    // battle-final.js
    //   p2・p3 … この HPの わりあいで 第2段階・第3段階（1回の 攻撃で 2つ とばない）
    //   alone … ひとりにする（turns … その 人の 番が 何回 来ると 自分で もどるか / hurt … ひとりの 人への ソリトゥスの ダメージ）
    //   eat … きずなを食べる（every … 第2段階からの 前ぶれの 間かく〈動いた 回数〉/ mult・ignoreDef … みんなに 物理 / heal … 食べた 力 1つで 回復する HPの わりあい〈1回で healCap まで〉）
    //   night … 終わらない夜（第3段階。every … 前ぶれの 間かく / base … 闇の 呪文の ダメージ）
    //   bond … 家族の きずな技（start … 第3段階の はじめの ゲージ / perAct … 仲間が 1回 動くと たまる / k … 強さ / cap … 1回で さいだいHPの この わりあいまで / heal・mp … みんなの HP・MPの 回復）
    solitus: {
      p2: 0.72, p3: 0.42,
      alone: { turns: 4, hurt: 1.25 },
      eat: { every: 6, mult: 1.5, ignoreDef: 0.3, heal: 0.008, healCap: 0.01 },
      night: { every: 3, base: [480, 540] },
      bond: { start: 100, perAct: 8, k: 2.4, cap: 0.1, heal: 0.35, mp: 0.15 },
    },
    actions: [
      { w: 3, id: 'attack' }, { w: 3, id: 'm_sl_claw' }, { w: 2, id: 'm_sl_wave', cond: 'notRecent:m_sl_wave' },
      // ひとりにする（だれも ひとりで ない・動ける 仲間が 2人いじょう）。合体技の よやくが ある ときは よく ねらう（よやくの 組の 人を ひとりに）
      { w: 4, id: 'm_sl_alone', cond: ['c5:slAlone', 'notRecent:m_sl_alone', 'c5:sl1'] },
      { w: 2, id: 'm_sl_alone', cond: ['c5:slAlone', 'notRecent:m_sl_alone', 'c5:sl23'] },
      { w: 10, id: 'm_sl_alone', cond: ['c5:slAlone', 'c5:nsBond'] },
      // 第2段階から: 闇の 口（1人に 大きい・強くなる 力を 消す）
      { w: 2, id: 'm_sl_maw', cond: ['c5:sl23', 'notRecent:m_sl_maw'] },
      // きずなを食べる の 前ぶれ（m_sl_eat_watch）・終わらない夜の 前ぶれ（m_sl_night_watch）は battle-final.js の finalAction が かならず 出す
    ],
    desc: 'ノクトの心のさびしさから生まれた、ひとりぼっちの魔王。人をひとりにし、きずなを食べる。けれど、つながった手は、闇よりも強い。',
  },
};
