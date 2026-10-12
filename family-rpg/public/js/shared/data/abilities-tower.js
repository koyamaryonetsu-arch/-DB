// 第5章 Step 2「星の塔」の 魔物と 星の番人アルゴスの 技（B: 戦い。abilities.js で まぜる）
// 呪文の ダメージは base（thr: 99 で 魔力に よらない）。レベル22から 0.7倍に なる（battle.js の enemyFixedScale）
// とくべつな こうか（foresee … 見通しの目）は shared/battle-ch5.js の towerEffect
export const TOWER_ABILITIES = {
  // ── 1〜4階（石の塔）──
  // 石のガーゴイル
  m_garg_dive: {
    name: '石のつばさ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.45, acc: 0.9 }, cast: '{a}は、石のつばさを広げて、{t}にまいおりてきた！', anim: 'garg_dive',
    desc: '石のつばさで、空から1人におそいかかる。',
  },
  m_stone_skin: {
    name: '石の体', kind: 'monster', target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.5, dur: 25 }, cast: '{a}の体が、ただの石像のようにかたまった！', anim: 'guard',
    desc: '体を石にして、守りを大きく上げる。',
  },
  // からくりの守り手
  m_gear_cutter: {
    name: '歯車カッター', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.35, acc: 0.95 }, cast: '{a}は、回る歯車を、{t}に投げつけた！', anim: 'gear_cut',
    desc: '回る歯車で、1人を切りつける。',
  },
  m_clock_stance: {
    name: '反撃の構え', kind: 'monster', target: 'self',
    effect: { type: 'stance', stance: 'counter', mult: 1.3, ignoreDef: 0.1 }, cast: '{a}は、カチリと音を立てて、うでの歯車を止めた！', anim: 'guard',
    desc: '反撃の構え。次の番まで、物理で攻撃してきた相手に反撃する。',
  },
  m_clock_wind: {
    name: 'ぜんまいをまく', kind: 'monster', target: 'self',
    effect: { type: 'buff', stat: 'agi', mult: 1.4, dur: 25 }, cast: '{a}は、せなかのぜんまいを、ギリギリとまいた！', anim: 'buff',
    desc: 'ぜんまいをまいて、素早さを上げる。',
  },
  // 塔のつむじ風
  m_tower_gust: {
    name: 'ふきあげる風', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', element: 'wind', base: [40, 50], thr: 99 }, cast: '{a}は、塔のかいだんを、ごうっとふき上がった！', anim: 'tower_gust',
    desc: '下からふきあげる風で、敵みんなにダメージ。',
  },
  m_wind_cut: {
    name: '風のやいば', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'magic', element: 'wind', base: [66, 80], thr: 99 }, cast: '{a}は、{t}に、するどい風のやいばをとばした！', anim: 'wind2',
    desc: 'するどい風のやいばで、1人にダメージ。',
  },

  // ── 5〜8階（星空）──
  // 星くらげ
  m_jelly_heal: {
    name: '星のしずく', kind: 'monster', mp: 6, target: 'ally',
    effect: { type: 'heal', base: [120, 150], thr: 99 }, cast: '{a}は、星のしずくを、{t}にふりかけた！', anim: 'heal1',
    desc: '星のしずくで、仲間のキズを回復する。',
  },
  m_jelly_sting: {
    name: 'しびれる足', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 0.9, status: { status: 'paralyze', chance: 0.3, turns: [1, 1] } }, cast: '{a}は、光る足で、{t}をちくりとさした！', anim: 'bite',
    desc: '光る足でさして、しびれさせることがある。',
  },
  // ほうき星の鳥
  m_comet_dive: {
    name: 'ほうき星アタック', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', element: 'fire', mult: 1.5, acc: 0.88 }, cast: '{a}は、星のしっぽを引いて、{t}につっこんできた！', anim: 'comet_dive',
    desc: 'ほうき星のように、もえながら1人につっこむ。',
  },
  m_comet_tail: {
    name: 'ほうき星のしっぽ', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [36, 46], thr: 99 }, cast: '{a}は、もえる星のしっぽを、ぐるりとふり回した！', anim: 'comet_tail',
    desc: 'もえる星のしっぽで、敵みんなにダメージ。',
  },
  // 星見の目玉
  m_eye_beam: {
    name: '目からの光線', kind: 'monster', mp: 5, target: 'enemy',
    effect: { type: 'magic', element: 'light', base: [64, 78], thr: 99 }, cast: '{a}の大きな目から、{t}に光線がとんだ！', anim: 'eye_beam',
    desc: '大きな目から光線を出して、1人にダメージ。',
  },
  m_eye_seal: {
    name: '呪文を見やぶる', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'status', status: 'silence', chance: 0.4, turns: [2, 3] }, cast: '{a}は、{t}の口もとを、じっと見つめた…！', anim: 'eye_gaze',
    desc: 'じっと見つめて、呪文をふうじることがある。',
  },

  // ── 星の番人アルゴス（8階）──
  // 見通しの目: 1人（HPが へると 2人）の 次の 行動の 種類（攻撃・呪文・回復・防御）を 読む（battle-ch5.js）
  m_argos_gaze: {
    name: '見通しの目', kind: 'monster', target: 'enemy',
    effect: { type: 'foresee' }, cast: '{a}の3つの目が、ぎょろりと動いた…！', anim: 'foresee',
    desc: '3つの目で、だれかの次の行動の種類を読む。読まれた種類の行動をそのまま使うと、かわされたり、はね返されたりする。行動を変えれば外れる。',
  },
  m_argos_starlight: {
    name: '星の光', kind: 'monster', mp: 8, target: 'enemies',
    effect: { type: 'magic', element: 'light', base: [46, 56], thr: 99 }, cast: '{a}の体の星もようが、いっせいに光った！\n星の光が、みんなをつらぬく！', anim: 'star_light',
    desc: '体の星もようを光らせて、敵みんなにダメージ。',
  },
  m_argos_gravity: {
    name: '重力', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'phys', mult: 0.9, debuff: { stat: 'agi', mult: 0.6, dur: 30, chance: 0.9 } }, cast: '{a}は、{t}の上の空気を、ずしりと重くした！', anim: 'gravity',
    desc: '重い空気でおしつぶす。素早さが下がる。',
  },
  // 第32回: HPが 25%より へると 使う（monsters-ch5.js の phases の addActions）
  m_argos_meteor: {
    name: '流星群', kind: 'monster', mp: 10, target: 'enemies',
    effect: { type: 'magic', element: 'light', base: [60, 72], thr: 99 }, cast: '{a}は、3つの目で、夜空をにらみつけた！\n流れ星が、雨のようにふりそそぐ！', anim: 'star_light',
    desc: '夜空から流れ星をふらせて、敵みんなに大きなダメージ。',
  },
  m_argos_beam: {
    name: '三つ目の光線', kind: 'monster', mp: 5, target: 'enemy',
    effect: { type: 'magic', element: 'light', base: [84, 100], thr: 99 }, cast: '{a}の3つの目から、{t}に光線がとんだ！', anim: 'eye_beam',
    desc: '3つの目から光線を出して、1人に大きなダメージ。',
  },
  // 前ぶれ「目に 星の光が 集まり始めた」→ つぎの 番に 星のさばき（物理・守り5わりむし・身を 守ると 半分）
  m_argos_charge: {
    name: '星のさばきの前ぶれ', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_argos_judge' }, cast: '{a}の3つの目に、星の光が集まり始めた…！\n塔のてっぺんが、ふるえている…！', anim: 'judge_charge',
    desc: '次の番に「星のさばき」。身を守ろう。',
  },
  m_argos_judge: {
    name: '星のさばき', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', element: 'light', mult: 1.45, ignoreDef: 0.5 }, cast: '{a}の、星のさばき！\n空から、星の光の柱がふりそそいだ！', anim: 'star_judge',
    desc: '空から星の光の柱をふらせる。敵みんなに、とても大きなダメージ。身を守ると半分になる。',
  },
};
