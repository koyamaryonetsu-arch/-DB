// 第3部 第1章 第1幕「星ふるえの夜」の 魔物・スイトール1号（3人組）・ホシモリ・星の子の 技（B: 戦い。abilities.js で まぜる）
// 呪文の ダメージは base（thr: 99 で 魔力に よらない）。レベル22から 0.7倍に なる（battle.js の enemyFixedScale）
// とくべつな こうか（c9tAim … すいこみ口を 星の子に 向ける・c9tSuck … すいこむ・c9tRest … メカが 休む・c9tHum … すいこみ口〈動かない〉・
//   c9hBreath … やみの いぶき・c9hDawn … 夜明け・c9aShare … 明かりを わける）は shared/battle-c9a.js の c9aEffect
// desc は 1文めで 何を するか わかる ように（スマホの たて持ちは 1文めだけ 出る。client/ui/skillinfo.js の firstSentence）
// anim は c9n_〜（ふつうの 魔物）・c9t_〜（スイトール1号）・c9h_〜（ホシモリ）・c9a_〜（星の子・明かりを わける）。client/render/battlefx-c9a.js
export const SHARE = 'm9_share';
export const C9A_ABILITIES = {
  // ── 星くずウルフ ──
  m9n_wf_fang: {
    name: '星くずのキバ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}が、星のように光るキバで、{t}にかみついた！', anim: 'c9n_fang',
    desc: '光るキバで、1人に大きなダメージ。',
  },
  m9n_wf_dash: {
    name: 'ながれ星ダッシュ', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'phys', mult: 0.62 }, cast: '{a}が、ながれ星のように、走りぬけた！', anim: 'c9n_dash',
    desc: 'ながれ星のように走って、敵みんなにダメージ。',
  },
  m9n_wf_howl: {
    name: '星ふるとおぼえ', kind: 'monster', mp: 2, target: 'self',
    effect: { type: 'buff', stat: 'atk', mult: 1.25 }, cast: '{a}は、夜空にむかって、ウォーンとほえた！', anim: 'c9n_howl',
    desc: '夜空にほえて、自分の攻撃力を上げる。',
  },
  // ── 星くずキノコ ──
  m9n_kn_bonk: {
    name: '星キノコずつき', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.35 }, cast: '{a}が、かさをふって、{t}にずつきした！', anim: 'c9n_bonk',
    desc: 'かさでずつきして、1人に大きなダメージ。',
  },
  m9n_kn_spore: {
    name: 'きらきらほうし', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'status', status: 'sleep', chance: 0.2, turns: [1, 2] }, cast: '{a}が、きらきら光るほうしを、ふわっとまいた…', anim: 'c9n_spore',
    desc: '敵みんなを、ねむらせることがある。',
  },
  m9n_kn_glow: {
    name: 'キノコのあかり', kind: 'monster', mp: 4, target: 'self',
    effect: { type: 'heal', base: [300, 340], thr: 99 }, cast: '{a}のかさが、ぽうっと光った！', anim: 'c9n_glow',
    desc: 'かさを光らせて、自分のHPを回復する。',
  },
  // ── 星くずランプの精 ──
  m9n_lp_fire: {
    name: '星くずの火', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'magic', base: [140, 158], thr: 99, element: 'fire' }, cast: '{a}が、星のまじった火を、{t}にとばした！', anim: 'c9n_fire',
    desc: '星のまじった火で、1人に炎の大きなダメージ。',
  },
  m9n_lp_flare: {
    name: 'きらめきの光', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'magic', base: [92, 106], thr: 99, element: 'light' }, cast: '{a}が、まぶしい光を、ぱあっとはなった！', anim: 'c9n_flare',
    desc: 'まぶしい光で、敵みんなに光のダメージ。',
  },
  m9n_lp_dazzle: {
    name: 'ちかちかの光', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'status', status: 'blind', chance: 0.3, turns: [2, 3] }, cast: '{a}が、ちかちかと光った！', anim: 'c9n_dazzle',
    desc: '敵みんなの目を、くらませることがある。',
  },
  // ── くらやみ虫 ──
  m9n_ym_bite: {
    name: 'くらやみのアゴ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.42 }, cast: '{a}が、暗やみから、{t}にかみついた！', anim: 'c9n_bite',
    desc: '暗やみからかみついて、1人に大きなダメージ。',
  },
  m9n_ym_dust: {
    name: 'くらやみの粉', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 0.5 }, { type: 'status', status: 'blind', chance: 0.25, turns: [2, 3] }] },
    cast: '{a}が、まっ黒な粉を、ばさばさとまいた！', anim: 'c9n_dust',
    desc: '黒い粉で、敵みんなにダメージ。目がくらむことがある。',
  },
  m9n_ym_drain: {
    name: '光すい', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'magic', base: [118, 134], thr: 99, element: 'dark' }, cast: '{a}が、{t}のまわりの光を、すうっとすいとった！', anim: 'c9n_drain',
    desc: 'まわりの光をすいとって、1人に闇のダメージ。',
  },
  // ── こけ玉 ──
  m9n_kd_roll: {
    name: 'ころころアタック', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.32 }, cast: '{a}が、ころころ転がって、{t}にぶつかった！', anim: 'c9n_roll',
    desc: '転がってぶつかり、1人に大きなダメージ。',
  },
  m9n_kd_moss: {
    name: 'こけのじゅうたん', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'debuff', stat: 'agi', mult: 0.8, chance: 0.45 }, cast: '{a}が、足もとに、ふかふかのこけを広げた！', anim: 'c9n_moss',
    desc: '敵みんなの素早さを、下げることがある。',
  },
  m9n_kd_glow: {
    name: 'ひかりごけ', kind: 'monster', mp: 4, target: 'ally',
    effect: { type: 'heal', base: [320, 360], thr: 99 }, cast: '{a}のこけが、やさしく光った！', anim: 'c9n_mossglow',
    desc: '光るこけで、仲間1体のHPを回復する。',
  },
  // ── 石の子ども ──
  m9n_is_peck: {
    name: '石のくちばし', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.45 }, cast: '{a}が、石のくちばしで、{t}をつついた！', anim: 'c9n_peck',
    desc: '石のくちばしで、1人に大ダメージ。',
  },
  m9n_is_harden: {
    name: 'かちこち', kind: 'monster', mp: 2, target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.3 }, cast: '{a}は、石のように、かちこちになった！', anim: 'c9n_harden',
    desc: '体をかたくして、自分の守りを上げる。',
  },
  m9n_is_gaze: {
    name: '石のまなざし', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'debuff', stat: 'atk', mult: 0.8, chance: 0.4 }, cast: '{a}が、じっと見つめてきた…', anim: 'c9n_gaze',
    desc: '敵みんなの攻撃力を、下げることがある。',
  },

  // ── 中ボス: スイトール1号（3人組）──
  m9t_punch: {
    name: 'メカパンチ', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 1.3 }, cast: 'ズラッカ「力なら、まかせるだっぺ！」\n{a}の大きなうでが、{t}をなぐった！', anim: 'c9t_punch',
    desc: '大きなうでで、1人に大きなダメージ。',
  },
  m9t_hose: {
    name: 'ぐるぐるホース', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'phys', mult: 0.62 }, cast: '{a}の長いホースが、ぐるぐるとふり回された！', anim: 'c9t_hose',
    desc: '長いホースをふり回して、敵みんなにダメージ。',
  },
  m9t_bomb: {
    name: 'びっくりばくだん', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'magic', base: [330, 360], thr: 99, element: 'fire' }, cast: 'ボヤッチ「ポチッとね、でございマス！」\n{a}から、ばくだんが、ぽんぽんとび出した！', anim: 'c9t_bomb',
    desc: 'ばくだんで、敵みんなに炎のダメージ。',
  },
  m9t_pochi: {
    name: 'ビリビリこうせん', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'magic', base: [520, 560], thr: 99, element: 'bolt' }, cast: 'キラジョ「さあ、やっちゃいなさい！」\nボヤッチ「ポチッとね！」\n{a}の頭から、ビリビリ光線がとび出した！', anim: 'c9t_beam',
    desc: 'ビリビリ光線で、1人に雷の大ダメージ。',
  },
  m9t_aim: {
    name: 'すいこみ口をむける', kind: 'monster', target: 'self',
    effect: { type: 'c9tAim' }, cast: 'キラジョ「今よ！あの子の光を、ぜーんぶいただくのよ！」', anim: 'c9t_aim',
    desc: 'すいこみ口を、星の子にむける。次に、星の光をすいこむ。',
  },
  m9t_suck: {
    name: '星すいこみ', kind: 'monster', target: 'enemies',
    effect: { type: 'c9tSuck' }, cast: 'ボヤッチ「すいこみ、スイッチ・オーン！」\n{a}が、ゴオオオッと、すいこみ始めた！', anim: 'c9t_suck',
    desc: '星の子の光をすいこむ。だれかが身を守ると、代わりに受けとめる。',
  },
  m9t_rest: {
    name: 'プスプス', kind: 'monster', target: 'self',
    effect: { type: 'c9tRest' }, cast: '{a}は、プスプスとけむりを上げて、止まっている…', anim: 'c9t_rest',
    desc: 'すいこみ口がこわれて、メカが止まっている。何もできない。',
  },
  m9t_hum: {
    name: 'ブオーン', kind: 'monster', target: 'self',
    effect: { type: 'nothing' }, cast: '{a}は、ブオーンとうなっている。', anim: 'c9t_rest',
    desc: 'うなっているだけ。何もしない。',
  },

  // ── 幕の ボス: ホシモリ ──
  m9h_wing: {
    name: '石のつばさ', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 1.3 }, cast: '{a}が、石のつばさで、{t}を打った！', anim: 'c9h_wing',
    desc: '石のつばさで、1人に大きなダメージ。',
  },
  m9h_hoot: {
    name: 'ホウホウのこえ', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'magic', base: [540, 570], thr: 99, element: 'dark' }, cast: '{a}「ホウ…ホウ…」\nひくい声が、地下にひびきわたった！', anim: 'c9h_hoot',
    desc: 'ひくい声をひびかせて、敵みんなに闇のダメージ。',
  },
  m9h_gaze: {
    name: '千年のまなざし', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'debuff', stat: 'atk', mult: 0.8, chance: 0.4 }, cast: '{a}の大きな目が、しずかに光った…', anim: 'c9h_gaze',
    desc: '敵みんなの攻撃力を、下げることがある。',
  },
  m9h_breath: {
    name: 'やみのいぶき', kind: 'monster', target: 'enemies',
    effect: { type: 'c9hBreath' }, cast: '{a}が、ふうっと、つめたいやみのいぶきをはいた！', anim: 'c9h_breath',
    desc: 'ねらった人のともしびを消す。身を守ると、手でかこって消えない。',
  },
  m9h_dawn: {
    name: '夜明け', kind: 'monster', target: 'self',
    effect: { type: 'c9hDawn' }, cast: '地下のおくまで、夜明けの光が、すうっとさしこんできた…', anim: 'c9h_dawn',
    desc: '夜が明けて、ためしがおわる。',
  },

  // ── 星の子・ともしびの ためし（みんな）──
  [SHARE]: {
    name: '明かりをわける', kind: 'skill', mp: 0, target: 'ally', noAuto: true,
    effect: { type: 'c9aShare' }, cast: '{a}は、自分のともしびの火を、{t}にそっとわけた！', anim: 'c9a_share',
    desc: '自分のともしびの火を、仲間1人にわけてつけ直す。ともしびがある人だけ使える。',
  },
};
