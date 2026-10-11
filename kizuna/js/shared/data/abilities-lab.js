// 古竜オルドラの 技（abilities.js で まぜる。monsters-lab.js）
export const LAB_ABILITIES = {
  m_old_bite: {
    name: 'かみくだく', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.6 }, cast: '{a}は、大きな口で{t}にかみついた！', anim: 'bite',
    desc: '大きな口で、1人にかみつく。',
  },
  m_old_tail: {
    name: 'しっぽでなぎはらう', kind: 'monster', mp: 2, target: 'enemies',
    effect: { type: 'phys', mult: 0.72 }, cast: '{a}は、岩のようなしっぽで、みんなをなぎはらった！', anim: 'hit_all',
    desc: 'しっぽで、敵みんなをなぎはらう。',
  },
  m_old_breath: {
    name: '炎の息', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [46, 58], thr: 99, breath: true }, cast: '{a}は、あつい炎の息をはいた！', anim: 'breath',
    desc: '炎の息で、敵みんなにダメージ。',
  },
  m_old_inhale: {
    name: 'いにしえの炎の前ぶれ', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_old_flare' }, cast: '{a}は、大きく息をすいこんだ…！\n口のおくで、こはく色の炎がうずまいている…！', anim: 'charge',
    desc: '次の番に「いにしえの炎」。身を守ろう。',
  },
  m_old_flare: {
    name: 'いにしえの炎', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', element: 'fire', mult: 1.6, ignoreDef: 0.5 }, cast: '{a}の、いにしえの炎！\nねどこじゅうが、こはく色の炎につつまれた！', anim: 'fire_wave',
    desc: '大昔の竜の炎。敵みんなに、とても大きなダメージ。身を守ると半分になる。',
  },
  m_old_stance: {
    name: '反撃の構え', kind: 'monster', target: 'self',
    effect: { type: 'stance', stance: 'counter', mult: 1.5, ignoreDef: 0.2 }, cast: '{a}は、しっぽを高くかかげた！', anim: 'guard',
    desc: 'しっぽを高くかかげて、反撃の構え。次の番まで、物理で攻撃してきた相手に、しっぽで反撃する。',
  },
};
