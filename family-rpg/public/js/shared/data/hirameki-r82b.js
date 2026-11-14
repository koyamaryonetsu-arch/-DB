// 第82回 B班: YAIBA の 系統の ひらめき技（雷神けんの剣士に 1つ・ヤイバに 1つ・竜神けんのサムライに 2つ。第29回の るろうに剣士の 道と おなじ）
// ・しくみは hirameki-r29.js と おなじ
//   job … その 職業か、その 職業から 進んだ 職業の とき だけ ひらめく（stats.js の hiraAllowed）
//   from … その 道の 技を 使った 回数
//   強さは その 職業の 同じくらいの MPの 技と おなじくらい。effect.yb は abilities-r82b.js と おなじ（この 系統の 剣の 技）
// ・id は hi_ で はじめる

const sk = (job, o) => ({ kind: 'skill', job, hirameki: true, ...o });

export const HIRA_R82B_ABILITIES = {
  // 雷神けんの剣士: 雷を まとって まっすぐ つく
  hi_raijin_tsuki: sk('raijin_sword', {
    name: '雷神づき', kana: 'らいじんづき', mp: 9, target: 'enemy',
    effect: { type: 'phys', mult: 2.6, element: 'bolt', yb: 'fix', ignoreDef: 0.15 },
    desc: '雷をまとって、いなずまのように敵1体をまっすぐつく。雷のダメージ。守りの固い敵にも少し効く。', cast: '{a}の雷神づき！', anim: 'r82b_bolt',
  }),
  // ヤイバ: 雷光斬りと せんぷう剣を 1つに
  hi_raikou_senpu: sk('yaiba', {
    name: '雷光せんぷう', kana: 'らいこうせんぷう', mp: 15, target: 'enemies',
    effect: { type: 'phys', mult: 1.6, element: 'bolt', yb: 'fix' },
    desc: '雷の光のつむじ風で、敵全体を切る。雷のダメージ。', cast: '{a}の雷光せんぷう！', anim: 'r82b_whirl',
  }),
  // 竜神けんのサムライ: 竜神の 光が 空から おりる
  hi_ryujin_kourin: sk('ryujin_samurai', {
    name: '竜神こうりん', kana: 'りゅうじんこうりん', mp: 24, target: 'enemies',
    effect: { type: 'phys', mult: 1.9, element: 'light', yb: 'fix' },
    desc: '空から竜神の光がおりてきて、敵全体を切る。光の大ダメージ。', cast: '{a}「竜神よ、おりてこい！」', anim: 'r82b_slash',
  }),
  // 竜神けんのサムライ: 大きな トラに のって、小ぞうの ころの「めん！」
  hi_tora_men: sk('ryujin_samurai', {
    name: 'トラにのってめん！', kana: 'とらにのってめん', mp: 20, target: 'enemy',
    effect: { type: 'phys', mult: 3.6, critBonus: 0.1, yb: 'tama' },
    desc: '大きなトラにとびのって、いきおいよく敵1体の頭を打つ。今の玉の属性の大ダメージ。会心も出やすい。', cast: '{a}は大きなトラにとびのった！「めーーん！」', anim: 'r82b_slash',
  }),
};

// ひらめきの じょうけん（技 → 使った 回数）
export const HIRAMEKI_R82B = {
  hi_raijin_tsuki: { from: { rj_raikou: 12, rj_shibire: 6 } },
  hi_raikou_senpu: { from: { yb_senpu: 8, rj_inazuma: 10 } },
  hi_ryujin_kourin: { from: { ry_tachi: 10, ry_ikari: 6 } },
  hi_tora_men: { from: { ry_tamashii: 6, kk_men: 30 } },
};
