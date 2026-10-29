// 第51回 C1: 幻の職業（海賊王・伝説の超勇者・日の火影・天才しせつ管理者AI）の ひらめき技
// ・1つの 職業に 1つ。しくみは hirameki-r41a.js と おなじ
//   job … その 職業の とき だけ ひらめく（stats.js の hiraAllowed）
//   from … その 職業の 技を 使った 回数（幻の 技は MPが 多いので、回数は 少なめ）
// ・とくべつな しかけ（crew・ki・dance）は battle-phantom-a.js。えんしゅつは o7（ax-time-o7.js の AX_SKILLS_O7）
// ・id は hi_ で はじめる

const sk = (job, o) => ({ kind: 'skill', job, hirameki: true, ...o });

export const HIRA_PHANTOM_A_ABILITIES = {
  // 海賊王: 雷を つかんで、仲間と いっしょに 投げつける
  hi_pk_raijin: sk('pirate_king', {
    name: 'ゴムゴムの王者の雷', kana: 'ごむごむのおうじゃのかみなり', mp: 24, target: 'enemies', role: 'dmg',
    effect: { type: 'phys', mult: 2.2, element: 'bolt', crew: 0.2 },
    desc: '空から雷をつかみとり、ゴムのうでで敵全体に投げつける。雷のダメージ。仲間が多いほど少し強い。', cast: '{a}は、雷をぐいっとつかみとった！', anim: 'bolt2',
  }),
  // 伝説の超勇者: ためた 気を 剣に こめて 2回 切る
  hi_sh_raikou: sk('super_hero', {
    name: '雷光かめはめ斬り', kana: 'らいこうかめはめぎり', mp: 26, target: 'enemy', role: 'dmg',
    effect: { type: 'phys', mult: 2.0, hits: 2, element: 'bolt', ki: 0.3 },
    desc: 'かめはめ波を剣にこめて、敵1体を2回切る。雷のダメージ。ためた気があると強くなる（使うと気は0にもどる）。', cast: '{a}の剣が、かめはめ波の光につつまれた！', anim: 'gigabreak',
  }),
  // 日の火影: 日の呼吸の 炎を らせん手裏剣に して 投げる
  hi_sk_shuriken: sk('sun_hokage', {
    name: 'ヒノカミらせん手裏剣', kana: 'ひのかみらせんしゅりけん', mp: 26, target: 'enemies', role: 'dmg',
    effect: { type: 'phys', mult: 2.3, element: 'fire' },
    desc: '日の呼吸の炎を、らせん手裏剣にして投げる。敵全体に炎のダメージ。', cast: '{a}「ヒノカミらせん手裏剣！」', anim: 'fire_wave',
  }),
  // 天才しせつ管理者AI: 仲間の デジタルツインで 先回りして 体調を ととのえる
  hi_fa_twin: sk('facility_ai', {
    name: 'デジタルツインAI', kana: 'でじたるついんえーあい', mp: 24, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [150, 180], thr: 70 }, { type: 'buff', stat: 'def', mult: 1.35, dur: 40 }] },
    desc: '仲間一人一人のデジタルツインで、先回りして体調をととのえる。仲間全員のHPを回復して、守備力も上がる。', cast: '{a}「みなさんの分身で、先に計算しておきました」', anim: 'aircon',
  }),
};

// ひらめきの じょうけん（技 → 使った 回数）
export const HIRAMEKI_PHANTOM_A = {
  hi_pk_raijin: { from: { pk_gatling: 10, pk_jiyuu: 6 } },
  hi_sh_raikou: { from: { sh_ken: 10, sh_ki: 8 } },
  hi_sk_shuriken: { from: { sk_rasen: 10, sk_kasha: 8 } },
  hi_fa_twin: { from: { fa_kuuchou: 8, fa_scan: 10 } },
};
