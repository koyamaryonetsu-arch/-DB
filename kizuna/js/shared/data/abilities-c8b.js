// 第2部 第8章 第2幕「よみの 青い火」の 魔物・ペイニックと パニクル・よみの王ハデロス（おこった すがた）の 技（B: 戦い。abilities.js で まぜる）
// 呪文の ダメージは base（thr: 99 で 魔力に よらない）。レベル22から 0.7倍に なる（battle.js の enemyFixedScale）
// とくべつな こうか（c8bFuse … ばけばけ大がったい・c8bQuarrel … けんか・c8bPanic … あたふた・c8bRage … カンカン・c8bSolo … ひとりばけばけ・
//   c8bContract … たましいのけいやく・c8bSoul … たましいを いただく・c8bHot … あちちっ・c8bAnger … おこったハデロス・
//   c8bErupt … よみの大ふん火・c8bCool … ふん火が しぼんだ）は shared/battle-c8b.js の c8bEffect
// desc は 1文めで 何を するか わかる ように（スマホの たて持ちは 1文めだけ 出る。client/ui/skillinfo.js の firstSentence）
// anim は b8n_〜（手下）・b8i_〜（ペイニックと パニクル）・b8h_〜（ハデロス）。client/render/battlefx-c8b.js
export const C8B_ABILITIES = {
  // ── ケロベロス ──
  m8n_kb_bite: {
    name: 'みつごのかみつき', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 0.45, hits: 3 }, cast: '{a}の3つの頭が、じゅんばんに、{t}にかみついた！', anim: 'b8n_bite',
    desc: '3つの頭で、1人に3回かみつく。',
  },
  m8n_kb_fire: {
    name: '青い火の息', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'magic', base: [80, 94], thr: 99, element: 'fire' }, cast: '{a}は、3つの口から、青い火の息をはいた！', anim: 'b8n_fire',
    desc: '青い火の息で、敵みんなに炎のダメージ。',
  },
  m8n_kb_howl: {
    name: 'みつごの遠ぼえ', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'debuff', stat: 'atk', mult: 0.8, chance: 0.45 }, cast: '{a}「ワオーン！ワン！キャン！」', anim: 'b8n_howl',
    desc: '遠ぼえで、敵みんなの攻撃力を下げることがある。',
  },
  // ── ホネギョ ──
  m8n_bf_bite: {
    name: 'ホネのキバ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.3 }, cast: '{a}は、とがったホネのキバで、{t}にかみついた！', anim: 'b8n_fbite',
    desc: 'ホネのキバで、1人に大きなダメージ。',
  },
  m8n_bf_dash: {
    name: 'まっすぐとっしん', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'phys', mult: 1.5 }, cast: '{a}の目が青く光り、{t}めがけて、まっすぐにつっこんできた！', anim: 'b8n_dash',
    desc: 'まっすぐつっこんで、1人に大ダメージ。',
  },
  m8n_bf_rattle: {
    name: 'カタカタおどり', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'status', status: 'confuse', chance: 0.2, turns: [1, 2] }, cast: '{a}は、ホネをカタカタならして、おどり出した…', anim: 'b8n_rattle',
    desc: 'ホネをならしておどり、敵みんなをこんらんさせることがある。',
  },
  // ── ビリクラゲ ──
  m8n_bj_zap: {
    name: 'ビリビリ', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'magic', base: [90, 106], thr: 99, element: 'bolt' }, cast: '{a}の体が、青白く光って、ビリビリと電気がはしった！', anim: 'b8n_zap',
    desc: '電気をはなって、敵みんなに雷のダメージ。',
  },
  m8n_bj_sting: {
    name: 'しびれるしょく手', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 1.1 }, { type: 'status', status: 'paralyze', chance: 0.25, turns: [1, 1] }] },
    cast: '{a}は、長いしょく手で、{t}をぴしっと打った！', anim: 'b8n_sting',
    desc: 'しょく手で1人を打つ。しびれさせることがある。',
  },
  m8n_bj_glow: {
    name: 'ふわふわの光', kind: 'monster', mp: 3, target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.25 }, cast: '{a}が、ふわふわと、やさしく光った…', anim: 'b8n_glow',
    desc: '光につつまれて、自分の守りを上げる。',
  },
  // ── 青火のたましい ──
  m8n_bs_flame: {
    name: 'たましいの青火', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'magic', base: [136, 156], thr: 99, element: 'fire' }, cast: '{a}が、青い火を、{t}にとばした！', anim: 'b8n_flame',
    desc: '青い火をとばし、1人に炎の大きなダメージ。',
  },
  m8n_bs_wail: {
    name: 'さびしいなき声', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'debuff', stat: 'mag', mult: 0.8, chance: 0.45 }, cast: '{a}「さむいよう…さびしいよう…」', anim: 'b8n_wail',
    desc: 'なき声で、敵みんなの魔力を下げることがある。',
  },
  m8n_bs_drain: {
    name: '元気すい', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'drainHp', mult: 1.0 }, cast: '{a}が、{t}にまとわりついて、元気をすいとった！', anim: 'b8n_drain',
    desc: '1人にまとわりついて、元気をすいとる。',
  },
  // ── ヒドラン ──
  m8n_hy_bite: {
    name: '大へびのかみつき', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.35 }, cast: '{a}は、大きな口で、{t}にかみついた！', anim: 'b8n_hbite',
    desc: '大きな口で、1人に大きなダメージ。',
  },
  m8n_hy_heads: {
    name: 'たくさんの頭', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'phys', mult: 0.45, hits: 2 }, cast: '{a}の頭が、いくつも、いっせいにおそいかかった！', anim: 'b8n_heads',
    desc: 'たくさんの頭で、敵みんなを2回かむ。',
  },
  m8n_hy_regrow: {
    name: '頭がはえる', kind: 'monster', mp: 4, target: 'self',
    effect: { type: 'heal', base: [260, 300], thr: 99 }, cast: '{a}の頭が、にょきっと、また生えてきた！', anim: 'b8n_regrow',
    desc: '新しい頭が生えて、自分のHPを回復する。',
  },

  // ── ペイニック ──
  m8i_pound: {
    name: 'ずんぐりパンチ', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.35 }, cast: '{a}は、まるいこぶしで、{t}をなぐりつけた！', anim: 'b8i_pound',
    desc: 'まるいこぶしで、1人に大きなダメージ。',
  },
  m8i_belly: {
    name: 'おなかボヨーン', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', mult: 0.62 }, cast: '{a}は、まるいおなかで、ボヨーンととびはねた！', anim: 'b8i_belly',
    desc: 'おなかでとびはねて、敵みんなにダメージ。',
  },
  m8i_tease: {
    name: 'あっかんべー', kind: 'monster', target: 'enemies',
    effect: { type: 'debuff', stat: 'def', mult: 0.8, chance: 0.5 }, cast: '{a}「やーい、やーい！あっかんべー！」', anim: 'b8i_tease',
    desc: 'からかって、敵みんなの守りを下げることがある。',
  },
  // ── パニクル ──
  m8i_scratch: {
    name: 'ひっかきまくり', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 0.42, hits: 3 }, cast: '{a}は、ほそい手で、{t}をひっかきまくった！', anim: 'b8i_scratch',
    desc: 'ほそい手で、1人を3回ひっかく。',
  },
  m8i_bluefire: {
    name: '小おにの青い火', kind: 'monster', target: 'enemies',
    effect: { type: 'magic', base: [150, 172], thr: 99, element: 'fire' }, cast: '{a}の手のひらから、青い火が、ぽんぽんとび出した！', anim: 'b8i_bluefire',
    desc: '青い火をとばし、敵みんなに炎のダメージ。',
  },
  m8i_trip: {
    name: '足ひっかけ', kind: 'monster', target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 0.9 }, { type: 'status', status: 'paralyze', chance: 0.3, turns: [1, 1] }] },
    cast: '{a}は、{t}の足を、ひょいっとひっかけた！', anim: 'b8i_trip',
    desc: '1人の足をひっかけて、動けなくすることがある。',
  },
  m8i_fuse: {
    name: 'ばけばけ大がったい', kind: 'monster', target: 'enemies',
    effect: { type: 'c8bFuse' }, cast: '{a}「いくぞ、あいぼう！ばけばけ…大がったい！」', anim: 'b8i_fuse',
    desc: '2ひきで大きなおばけにばけ、敵みんなに大ダメージ。身を守ると半分になる。',
  },
  m8i_quarrel: {
    name: 'けんか', kind: 'monster', target: 'self',
    effect: { type: 'c8bQuarrel' }, cast: '{a}「おまえのせいだぞ！」「ちがうよ、おまえだよ！」', anim: 'b8i_quarrel',
    desc: '作戦がばれて、けんかしている。動けない。',
  },
  m8i_panic: {
    name: 'あたふた', kind: 'monster', target: 'self',
    effect: { type: 'c8bPanic' }, cast: '{a}「うわわわ！あいぼうが…！どうしよう、どうしよう！」', anim: 'b8i_panic',
    desc: 'あいぼうがたおれて、あわてている。何もできない。',
  },
  m8i_rage: {
    name: 'カンカン', kind: 'monster', target: 'self',
    effect: { type: 'c8bRage' }, cast: '{a}「よくも、あいぼうを…！もう、ゆるさないぞー！」', anim: 'b8i_rage',
    desc: 'カンカンにおこって、攻撃力と素早さが上がる。',
  },
  m8i_solo: {
    name: 'ひとりばけばけ', kind: 'monster', target: 'enemies',
    effect: { type: 'c8bSolo' }, cast: '{a}「ひとりでも、ばけてやる！ばけばけ…！」', anim: 'b8i_solo',
    desc: 'ひとりで大きくばけて、敵みんなに大ダメージ。',
  },

  // ── よみの王ハデロス（1だんめ: 青い 炎）──
  m8h_bluefire: {
    name: 'よみの青い炎', kind: 'monster', target: 'enemy',
    effect: { type: 'magic', base: [220, 248], thr: 99, element: 'fire' }, cast: '{a}が指を鳴らすと、{t}のまわりに、青い炎がうずまいた！', anim: 'b8h_bluefire',
    desc: '青い炎で、1人に炎の大ダメージ。',
  },
  m8h_skull: {
    name: 'ドクロのけむり', kind: 'monster', target: 'enemies',
    effect: { type: 'magic', base: [142, 164], thr: 99, element: 'dark' }, cast: '{a}の手から、ドクロの形のけむりが、ふわりとうかんだ…', anim: 'b8h_skull',
    desc: 'ドクロのけむりで、敵みんなに闇のダメージ。',
  },
  m8h_talk: {
    name: 'よみの王のおしゃべり', kind: 'monster', target: 'enemies',
    effect: { type: 'debuff', stat: 'agi', mult: 0.8, chance: 0.5 }, cast: '{a}「いやー、まいったね。よみの王ってのは、いそがしくてさ…」', anim: 'b8h_talk',
    desc: '長いおしゃべりで、敵みんなの素早さを下げることがある。',
  },
  m8h_contract: {
    name: 'たましいのけいやく', kind: 'monster', target: 'enemy',
    effect: { type: 'c8bContract' }, cast: '{a}「さあ、ここにサインを。だいじょうぶ、ちょっとした、けいやくさ…」', anim: 'b8h_contract',
    desc: '1人にけいやくしょをつけ、HPをすいとる。炎で、けいやくしょがもえる。',
  },
  m8h_soul: {
    name: 'たましいをいただく', kind: 'monster', target: 'enemy',
    effect: { type: 'c8bSoul' }, cast: '{a}「けいやくの時間だ。たましいを、いただくよ！」', anim: 'b8h_soul',
    desc: 'けいやくした人のたましいをとって、たおす。',
  },
  m8h_hot: {
    name: 'あちちっ', kind: 'monster', target: 'self',
    effect: { type: 'c8bHot' }, cast: '{a}「あちちちっ！けいやくしょが、もえちまった！」', anim: 'b8h_hot',
    desc: 'けいやくしょがもえて、あわてている。動けない。',
  },
  m8h_anger: {
    name: 'おこったハデロス', kind: 'monster', target: 'self',
    effect: { type: 'c8bAnger' }, cast: '{a}「…もう、がまんの、げんかいだーっ！！」', anim: 'b8h_anger',
    desc: 'おこって、かみの毛が赤くもえる。炎と氷の弱点がかわる。',
  },
  // ── おこった ハデロス（2だんめ: 赤い 炎）──
  m8h_fist: {
    name: 'いかりのげんこつ', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.45 }, cast: '{a}は、赤くもえるこぶしを、{t}にたたきつけた！', anim: 'b8h_fist',
    desc: 'もえるこぶしで、1人に大ダメージ。',
  },
  m8h_flare: {
    name: '赤い炎のうず', kind: 'monster', target: 'enemies',
    effect: { type: 'magic', base: [156, 178], thr: 99, element: 'fire' }, cast: '{a}のまわりに、赤い炎が、ごうごうとうずまいた！', anim: 'b8h_flare',
    desc: '炎をうずまかせ、敵みんなに炎のダメージ。',
  },
  m8h_shout: {
    name: 'よみの王のどなり声', kind: 'monster', target: 'enemies',
    effect: { type: 'debuff', stat: 'def', mult: 0.8, chance: 0.5 }, cast: '{a}「だれが、よみの王だと思ってるんだーっ！」', anim: 'b8h_shout',
    desc: 'どなり声で、敵みんなの守りを下げることがある。',
  },
  m8h_erupt: {
    name: 'よみの大ふん火', kind: 'monster', target: 'enemies',
    effect: { type: 'c8bErupt' }, cast: '{a}のかみの毛が、天井までもえ上がった…！\n「よみの炎を、思い知れーっ！」', anim: 'b8h_erupt',
    desc: 'かみの炎をふき上げ、敵みんなに炎の大ダメージ。身を守ると半分になる。',
  },
  m8h_cool: {
    name: '頭がひえた', kind: 'monster', target: 'self',
    effect: { type: 'c8bCool' }, cast: '{a}「ひえっ！つ、つめたい…！」', anim: 'b8h_cool',
    desc: '氷で頭がひえて、ふん火がしぼんだ。動けない。',
  },
};
