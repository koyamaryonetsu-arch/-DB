// 第5章 Step 6・7「根の島」と「大地の神殿」の 魔物と ノクト（1回目）の 技（B: 戦い。abilities.js で まぜる）
// 呪文の ダメージは base（thr: 99 で 魔力に よらない）。レベル22から 0.7倍に なる（battle.js の enemyFixedScale）
// とくべつな こうか（sgGuard … まもり兵が かばう・n1Rift … 地われ／のみこむ・n1Clones … かげぶんしん・n1Combo … ひとりぼっちの合体技）は
// shared/battle-earth.js の earthEffect
export const EARTH_ABILITIES = {
  // ── 根っこのこびと ──
  m_rs_root: {
    name: '根っこのわな', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.2, debuff: { stat: 'agi', mult: 0.75, dur: 20, chance: 0.6 } }, cast: '{a}の足もとから根っこがのびて、{t}の足にからみついた！', anim: 'rs_root',
    desc: '根っこをからみつかせて攻撃する。素早さを下げることがある。',
  },
  m_rs_rattle: {
    name: 'からからの音', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'status', status: 'confuse', chance: 0.25, turns: [1, 2] }, cast: '{a}は、頭をからからと鳴らした…！\nふしぎな音が、頭の中にひびく…', anim: 'rs_rattle',
    desc: 'ふしぎな音で、敵みんなを混乱させることがある。',
  },

  // ── 天空のまもり兵 ──
  m_sg_beam: {
    name: '目からビーム', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', element: 'blast', base: [74, 88], thr: 99 }, cast: '{a}の目が、赤く光った…！\nまっすぐな光が、あたりをなぎはらう！', anim: 'sg_beam',
    desc: '目から光を出して、敵みんなを爆発でなぎはらう。',
  },
  m_sg_arm: {
    name: '鉄のうで', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.45, ignoreDef: 0.1 }, cast: '{a}は、ぎこちなく、鉄のうでをふり下ろした！', anim: 'sg_arm',
    desc: '重い鉄のうでで、1人をなぐる。',
  },
  m_sg_guard: {
    name: '守る', kind: 'monster', target: 'self',
    effect: { type: 'sgGuard' }, cast: '{a}「…マ…モ…ル…」', anim: 'sg_guard',
    desc: 'こわれかけた体で、仲間の前に立ってかばう（1回だけ）。',
  },

  // ── 大地のダンゴムシ ──
  m_pb_roll: {
    name: 'ころがりアタック', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}は、まるくなって、ごろごろと転がってきた！', anim: 'pb_roll',
    desc: 'まるくなって転がり、1人にぶつかる。',
  },
  m_pb_curl: {
    name: 'まるくなる', kind: 'monster', target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.4, dur: 20 }, cast: '{a}は、まるくなった！\nこうらが、もっとかたくなった！', anim: 'pb_curl',
    desc: 'まるくなって、守りをかためる。',
  },
  m_pb_stomp: {
    name: 'たくさんの足', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'phys', mult: 0.7 }, cast: '{a}は、たくさんの足で、地面をふみならした！', anim: 'pb_stomp',
    desc: 'たくさんの足でふみならして、敵みんなを攻撃する。',
  },

  // ── かおのない影 ──
  m_fs_gold: {
    name: '金色のかけら', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'multi', parts: [{ type: 'magic', element: 'light', base: [46, 56], thr: 99 }, { type: 'status', status: 'confuse', chance: 0.22, turns: [1, 2] }] },
    cast: '{a}は、手のひらから、金色のかけらをばらまいた…！\nきらきら光って、目がくらむ…', anim: 'fs_gold',
    desc: '金色のかけらをばらまいて、敵みんなにダメージ。混乱させることがある。',
  },
  m_fs_grab: {
    name: 'つかむ手', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}の大きな手が、{t}をつかもうとした！', anim: 'fs_grab',
    desc: '大きな手で、1人をつかんで攻撃する。',
  },
  // のみこむ: 地われと おなじ（動けない・回復を 受けられない。仲間の「手をのばす」で もどる。battle-earth.js）
  m_fs_swallow: {
    name: 'のみこむ', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'n1Rift', kind: 'swallow', mult: 0.6 }, cast: '{a}は、大きな口をあけた…！', anim: 'fs_swallow',
    desc: '1人をのみこむ。のみこまれた人は動けず、回復も受けられない。仲間が「手をのばす」と助け出せる。',
  },

  // ── ノクト（1回目。shared/battle-earth.js）──
  m_n1_blade: {
    name: '紋章のつるぎ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}の手の紋章から、黒いつるぎがのびた！', anim: 'n1_blade',
    desc: '紋章からのびる黒いつるぎで、1人に切りかかる。',
  },
  m_n1_dark: {
    name: '黒い星のあらし', kind: 'monster', mp: 8, target: 'enemies',
    effect: { type: 'magic', element: 'dark', base: [116, 136], thr: 99 }, cast: '{a}が手をかざすと、黒い星が、あらしのようにふりそそいだ！', anim: 'n1_dark',
    desc: '黒い星のあらしで、敵みんなにダメージ。',
  },
  // かげぶんしん: 影が 2体に なるまで よぶ（nocto1.clones）
  m_n1_clones: {
    name: 'かげぶんしん', kind: 'monster', target: 'self',
    effect: { type: 'n1Clones' }, cast: '{a}の足もとの影が、ゆらりと立ち上がった…！', anim: 'n1_clones',
    desc: '自分の形をした影をよび出す。影が2体そろうと、ひとりぼっちの合体技をねらってくる。',
  },
  // 地われ: だれか 1人が 落ちる（動けない・回復を 受けられない。「手をのばす」で もどる。nocto1.rift 回 動くと 自分で もどる）
  m_n1_rift: {
    name: '地われ', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'n1Rift', kind: 'rift', mult: 0.8 }, cast: '{a}が地面に手をつくと、大地が、まっぷたつにさけた！', anim: 'n1_rift',
    desc: '大地をさいて、1人を地われに落とす。落ちた人は動けず、回復も受けられない。仲間が「手をのばす」と助けられる。',
  },
  // 前ぶれ（影が 2体 そろって いる とき。battle-earth.js の earthAction）→ 次の 番に ひとりぼっちの合体技。影を 1体でも たおすと くずれる
  m_n1_combo_ready: {
    name: '合体技のかまえ', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_n1_combo' }, cast: 'ノクトと影たちが、同じかまえをとった…！', anim: 'n1_combo_ready',
    desc: '次の番に「ひとりぼっちの合体技」。影を1体でもたおせば止められる。身を守るとダメージが半分になる。',
  },
  m_n1_combo: {
    name: 'ひとりぼっちの合体技', kind: 'monster', target: 'enemies',
    effect: { type: 'n1Combo' }, cast: '{a}と影たちの、ひとりぼっちの合体技！\n3つの影が、ひとつになって、おそいかかる！', anim: 'n1_combo',
    desc: 'ノクトと2体の影でくり出す、ひとりきりの合体技。敵みんなに、とても大きなダメージ。',
  },
  // ノクトの 分身
  m_n1c_claw: {
    name: '影のツメ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.25 }, cast: '{a}は、影のツメで、{t}をひっかいた！', anim: 'n1c_claw',
    desc: '影のツメで、1人をひっかく。',
  },
};
