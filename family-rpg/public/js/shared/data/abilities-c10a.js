// 第3部 第2章 第1幕「赤と緑」の 魔物・ドクター・タマゴン・カビだんしゃく モルド の 技（B: 戦い。abilities.js で まぜる）
// 呪文の ダメージは base（thr: 99 で 魔力に よらない）。レベル22から 0.7倍に なる（battle.js の enemyFixedScale）
// とくべつな こうか（c10tDrillUp … ドリルの 前ぶれ・c10tDrill … ドリルの 全体攻撃・c10tOver … オーバーヒート・c10tCool … 冷きゃく水・
//   c10mBombUp … 大カビばくだんの 前ぶれ・c10mBomb … 大カビばくだん）は shared/battle-c10a.js の c10aEffect
// desc は 1文めで 何を するか わかる ように（スマホの たて持ちは 1文めだけ 出る）
// anim は c10r_〜・c10g_〜（ふつうの 魔物）・c10t_〜（タマゴン）・c10m_〜（モルド）。client/render/battlefx-c10a.js
export const C10A_ABILITIES = {
  // ── 古道のマグマトカゲ ──
  m10r_lz_bite: {
    name: 'あつあつがみ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.38 }, cast: '{a}が、あつい口で、{t}にかみついた！', anim: 'c10r_bite',
    desc: 'あつい口でかみつき、1人に大きなダメージ。',
  },
  m10r_lz_spit: {
    name: 'ようがんはき', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'magic', base: [100, 114], thr: 99, element: 'fire' }, cast: '{a}が、ようがんを、ぺっとはき出した！', anim: 'c10r_spit',
    desc: 'ようがんをはいて、敵みんなに炎のダメージ。',
  },
  m10r_lz_tail: {
    name: '石だたみしっぽ', kind: 'monster', mp: 2, target: 'enemies',
    effect: { type: 'phys', mult: 0.58 }, cast: '{a}が、しっぽで、石だたみをバシンとたたいた！', anim: 'c10r_tail',
    desc: 'しっぽでたたいて、敵みんなにダメージ。',
  },
  // ── ねっぷうぷるりん ──
  m10r_sl_body: {
    name: 'あつあつたいあたり', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.32 }, cast: '{a}が、ぷるんと、{t}にぶつかった！', anim: 'c10r_body',
    desc: 'ぶつかって、1人に大きなダメージ。',
  },
  m10r_sl_wind: {
    name: 'ねっぷう', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'magic', base: [98, 112], thr: 99, element: 'fire' }, cast: '{a}から、あつい風が、ぶわっとふき出した！', anim: 'c10r_wind',
    desc: 'あつい風で、敵みんなに炎のダメージ。',
  },
  // ── ようがんガメ ──
  m10r_tt_bash: {
    name: 'こうらずつき', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.44 }, cast: '{a}が、石のこうらで、{t}にずつきをした！', anim: 'c10r_bash',
    desc: 'こうらでぶつかり、1人に大きなダメージ。',
  },
  m10r_tt_shell: {
    name: 'こうらにこもる', kind: 'monster', mp: 3, target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.3 }, cast: '{a}は、こうらに、首をひっこめた！', anim: 'c10r_shell',
    desc: 'こうらにこもって、守りを上げる。',
  },
  m10r_tt_quake: {
    name: 'ようがんじしん', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'phys', mult: 0.6 }, cast: '{a}が、足をドスンとふみ鳴らすと、地面がゆれた！', anim: 'c10r_quake',
    desc: '地面をゆらして、敵みんなにダメージ。',
  },
  // ── ほのおのつぼ ──
  m10r_pt_bonk: {
    name: 'つぼごっつん', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.3 }, cast: '{a}が、ころがって、{t}にごっつんとぶつかった！', anim: 'c10r_bonk',
    desc: 'ころがってぶつかり、1人にダメージ。',
  },
  m10r_pt_fire: {
    name: 'つぼのほのお', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'magic', base: [104, 118], thr: 99, element: 'fire' }, cast: '{a}の口から、ほのおが、ごおっとあふれ出した！', anim: 'c10r_fire',
    desc: 'ほのおをあふれさせて、敵みんなに炎のダメージ。',
  },
  m10r_pt_smoke: {
    name: 'もくもくけむり', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'status', status: 'blind', chance: 0.2, turns: [2, 3] }, cast: '{a}から、黒いけむりが、もくもく出てきた…', anim: 'c10r_smoke',
    desc: 'けむりで、敵みんなの目をくらませることがある。',
  },

  // ── ほうしキノコ ──
  m10g_sp_bump: {
    name: 'キノコずつき', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.3 }, cast: '{a}が、かさで、{t}にずつきをした！', anim: 'c10g_bump',
    desc: 'かさでぶつかり、1人にダメージ。',
  },
  m10g_sp_puff: {
    name: 'ねむりほうし', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'status', status: 'sleep', chance: 0.16, turns: [1, 2] }, cast: '{a}が、光るほうしを、ふわっとまいた…', anim: 'c10g_puff',
    desc: '光るほうしで、敵みんなをねむらせることがある。',
  },
  m10g_sp_glow: {
    name: 'ほうしの光', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'magic', base: [98, 112], thr: 99, element: 'light' }, cast: '{a}のほうしが、ぱちぱちと光った！', anim: 'c10g_glow',
    desc: '光るほうしで、敵みんなに光のダメージ。',
  },
  // ── ねっこヅタ ──
  m10g_vn_whip: {
    name: 'ねっこムチ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.38 }, cast: '{a}が、根のムチで、{t}をビシッとたたいた！', anim: 'c10g_whip',
    desc: '根のムチで、1人に大きなダメージ。',
  },
  m10g_vn_bind: {
    name: 'からみつく根', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'debuff', stat: 'agi', mult: 0.8, chance: 0.4 }, cast: '{a}の根が、みんなの足もとに、するするとからみついた！', anim: 'c10g_bind',
    desc: '根をからませて、敵みんなの素早さを下げることがある。',
  },
  m10g_vn_sap: {
    name: 'ねばねばじる', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'phys', mult: 0.56 }, cast: '{a}が、ねばねばのしるを、まきちらした！', anim: 'c10g_sap',
    desc: 'しるをまいて、敵みんなにダメージ。',
  },
  // ── ねっこカブト ──
  m10g_bt_horn: {
    name: 'ねっこづの', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.46 }, cast: '{a}が、根の形のつので、{t}をすくい上げた！', anim: 'c10g_horn',
    desc: 'つので、1人に大きなダメージ。',
  },
  m10g_bt_charge: {
    name: 'ぶんぶんとっしん', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'phys', mult: 0.62 }, cast: '{a}が、はねを広げて、ぶうーんと、とっしんしてきた！', anim: 'c10g_charge',
    desc: 'とんできて、敵みんなにダメージ。',
  },
  m10g_bt_guard: {
    name: 'かたいはね', kind: 'monster', mp: 3, target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.3 }, cast: '{a}は、かたいはねを、ぴたっととじた！', anim: 'c10g_guard',
    desc: 'はねをとじて、守りを上げる。',
  },
  // ── はっぱミノムシ ──
  m10g_bg_swing: {
    name: 'ゆらゆらアタック', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.34 }, cast: '{a}が、ゆらゆらゆれて、{t}にぶつかった！', anim: 'c10g_swing',
    desc: 'ゆれてぶつかり、1人に大きなダメージ。',
  },
  m10g_bg_leaf: {
    name: 'はっぱあらし', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'magic', base: [100, 114], thr: 99, element: 'wind' }, cast: '{a}のまわりの葉が、ぐるぐるとまい上がった！', anim: 'c10g_leaf',
    desc: '葉をまい上げて、敵みんなに風のダメージ。',
  },
  m10g_bg_hide: {
    name: 'みのがくれ', kind: 'monster', mp: 3, target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.3 }, cast: '{a}は、葉のみのに、すっぽりかくれた！', anim: 'c10g_hide',
    desc: 'みのにかくれて、守りを上げる。',
  },

  // ── 赤の 中ボス: ドクター・タマゴン と グルグルドリル号 ──
  m10t_arm: {
    name: 'アームパンチ', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 1.15 }, cast: '{a}「それっ、アームパンチ！」メカのうでが、{t}にのびてきた！', anim: 'c10t_arm',
    desc: 'メカのうでで、1人に大きなダメージ。',
  },
  m10t_steam: {
    name: 'ねっきのじょうき', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'magic', base: [190, 210], thr: 99, element: 'fire' }, cast: '{a}「スイッチ、オン！」メカから、あつい湯気が、ぶしゅーっとふき出した！', anim: 'c10t_steam',
    desc: 'あつい湯気で、敵みんなに炎のダメージ。',
  },
  m10t_flame: {
    name: 'ドリルのひばな', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'magic', base: [360, 390], thr: 99, element: 'fire' }, cast: '{a}のドリルが、岩をけずって、ひばなを{t}にとばした！', anim: 'c10t_flame',
    desc: 'ひばなをとばして、1人に炎の大きなダメージ。',
  },
  m10t_drillup: {
    name: 'ドリルのかまえ', kind: 'monster', target: 'self',
    effect: { type: 'c10tDrillUp' }, cast: '{a}「グルグルドリル、全開じゃ〜！」ドリルが、うなりを上げて回り始めた…！', anim: 'c10t_drillup',
    desc: '次に、ドリルの全体攻撃が来る。',
  },
  m10t_drill: {
    name: 'グルグルドリルアタック', kind: 'monster', target: 'enemies',
    effect: { type: 'c10tDrill' }, cast: '{a}「ゆけっ、グルグルドリルアタック！」', anim: 'c10t_drill',
    desc: 'ドリルで、敵みんなに大ダメージ。防御で、へらせる。',
  },
  m10t_over: {
    name: 'オーバーヒート', kind: 'monster', target: 'self',
    effect: { type: 'c10tOver' }, cast: '{a}「あちちち！メ、メカが、止まってしもうた〜！」', anim: 'c10t_over',
    desc: 'メカがあつくなりすぎて、止まっている。',
  },
  m10t_cool: {
    name: '冷きゃく水', kind: 'monster', target: 'self',
    effect: { type: 'c10tCool' }, cast: '{a}「ええい、冷きゃく水じゃ！」メカに、水が、ざばーっとかかった！', anim: 'c10t_cool',
    desc: 'メカのあつさを0にもどす。ここから、ドリルがふえる。',
  },

  // ── 緑の 中ボス: カビだんしゃく モルド と カビカビ号 ──
  m10m_cane: {
    name: 'ステッキつつき', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 1.15 }, cast: '{a}「ほれ、ほれ。」ステッキで、{t}をつついた！', anim: 'c10m_cane',
    desc: 'ステッキで、1人に大きなダメージ。',
  },
  m10m_prop: {
    name: 'プロペラかぜ', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'magic', base: [190, 210], thr: 99, element: 'wind' }, cast: '{a}のメカのプロペラが、しめった風を、ふきつけた！', anim: 'c10m_prop',
    desc: 'しめった風で、敵みんなに風のダメージ。',
  },
  m10m_damp: {
    name: 'じめじめパンチ', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 1.3 }, cast: '{a}のメカの、しめったうでが、{t}にのびてきた！', anim: 'c10m_damp',
    desc: 'しめったうでで、1人に大きなダメージ。',
  },
  m10m_bombup: {
    name: '大カビばくだんのじゅんび', kind: 'monster', target: 'self',
    effect: { type: 'c10mBombUp' }, cast: '{a}「ふっふっふ。とっておきを、ごらんにいれよう。」メカが、大きなカビの玉をふくらませている…！', anim: 'c10m_bombup',
    desc: '次に、大カビばくだんが来る。',
  },
  m10m_bomb: {
    name: '大カビばくだん', kind: 'monster', target: 'enemies',
    effect: { type: 'c10mBomb' }, cast: '{a}「それっ、大カビばくだん！」', anim: 'c10m_bomb',
    desc: '大きなカビの玉で、敵みんなに大ダメージ。防御で、へらせる。',
  },
};
