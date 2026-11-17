// 第88回 M1班: 魔王の ひらめき技「天地魔闘の構え」（docs/plan-r88-anime-gear.md の 11・12-2）
// ・しくみは hirameki-r86a.js と おなじ
//   job … その 職業の とき だけ ひらめく（stats.js の hiraAllowed。魔王と、魔王から 進んだ 職業）
//   from … その 職業の 技を 使った 回数（Lv8 闇の衣・Lv10 カラミティウォール。Lv7 いじょうの 技から ひらめく）
// ・中みは shared/battle-r88m.js（type 'r88mTenchi'。戦いの 中だけ）
//   cut … かまえの 間に 受ける ダメージの 倍（地: フェニックスウィング）
//   hand … 攻撃や 呪文を 受けた 時の 手刀の 反撃（天: カラミティエンド。物理の mult 倍。1回の かまえで max 回まで）
//   bird … かまえが とける 時、さいごに 攻撃して きた 敵に 火の 鳥（魔: カイザーフェニックス。炎の 呪文。Lv1 の 技より 弱い）

const sk = (job, o) => ({ kind: 'skill', job, hirameki: true, ...o });

export const HIRA_R88M_ABILITIES = {
  hi_tenchi_matou: sk('maou', {
    name: '天地魔闘の構え', kana: 'てんちまとうのかまえ', mp: 20, target: 'self', role: 'sup',
    effect: { type: 'r88mTenchi', cut: 0.5, hand: { mult: 1.3, max: 3 }, bird: { base: [110, 140], thr: 60 } },
    desc: '次の自分の番まで、自分からはしかけずにかまえる。受けるダメージが半分になり、攻撃されるたびに手刀で反撃する（3回まで）。かまえがとける時、最後に攻撃してきた敵に火の鳥をはなつ。',
    cast: '{a}は、両手を大きく広げて、しずかにかまえた…', anim: 'r88m_tenchi',
  }),
};

// ひらめきの じょうけん（技 → 使った 回数）
export const HIRAMEKI_R88M = {
  hi_tenchi_matou: { from: { mo_koromo: 8, mo_hametsu: 8 } },
};
