// 第86回 A班: 幻の職業 2つの 技（人とようかいのかけ橋・竜神の剣士。docs/plan-r86-phantom-a.md）
// 職業は jobs-r86a.js。えんしゅつは client/render/battlefx-r86a.js（anim は r86a_… と 看板の 技）
// きまりは 今の 幻の職業（abilities-phantom-a/b/c.js）と おなじ
//  ・1つの 職業に 8つ（Lv1〜10）。Lv10 の 技（<職業の id>_sig）が いちばん MPを 使う
//  ・もとの 伝説の 職業の 技より 1〜2わり 強い。みんなに かける 補助は 1.4倍まで
// この 2つだけの こうか（shared/battle-r86a.js。どれも 戦いの 中だけ）
//  ・type 'r86aKabau'  … 仲間 1人を かばう ＋ 自分の 守備力が 上がる（かばって 受けた ダメージの 半分が「ためた力」に なる）
//  ・type 'r86aKizuna' … きずなの力: acts 回の 行動の 間、物理の 力が mult 倍（命令できる まま・HP は へらない）。
//                        ようかい化・大よう化・おにの手と 同時に かかっても 足し算・かけ算に しない（強い 方だけ）
//  ・type 'r86aSig'    … 人とようかいのきずな（2だん）: 次の 自分の 番まで 仲間全員を かばう（敵全体の 攻撃も。受ける ダメージは take 倍）→
//                        次の 自分の 番の はじめに、ためた力を 風に して 敵全体へ（物理の swing 倍 ＋ ためた力 × spread）
//  ・phys の tameAll   … ためた力を 当てた 敵 みんなに のせる（1体ごとに ためた力 × tameAll）。ふつうの 技は さいしょの 1回だけに のせる
//  ・phys の r86a: 'dual' … 竜神の剣士の 剣: 「今の 玉の 属性」と「炎」の、その 敵に よく 効く 方で 当たる（天気の 倍も 入れて くらべる）
//  ・phys の r86aSig   … 竜神・火竜 二重の太刀: 1回目は 玉の 属性・2回目は 炎（どちらも、もう 一方の 方が よく 効けば そちらで）
//  ・火竜をよぶ・竜神（type 'r85bRyu'・set 'kenshi'）… 烈火の 火竜から 4ひき（さいは・なだれ・まどか・れっしん）。メニューは 烈火と おなじ
//  ・玉がえ（type 'tamagae'）… YAIBA と おなじ 画面。竜神の剣士は 雷・水・氷・風・竜神の 5つ（炎は いつも 持って いるので 入れない）

import { RYU_SET } from './abilities-r85b.js?v=9c90184bf1d8';

// 竜神の剣士が よべる 火竜（攻めの 2ひき ＋ 守りの 1ぴき ＋ 生き返りの 1ぴき）
RYU_SET.kenshi = ['saiha', 'nadare', 'madoka', 'resshin'];

const GHOST = { spirit: 1.5, undead: 1.5, demon: 1.5 };
const WIND = { element: 'wind', vsBuff: 1.3 };

export const R86A_ABILITIES = {
  // ───────────── 人とようかいのかけ橋（ばくりゅうはの大よう ＋ おにの手のじごく先生） ─────────────
  kb_kaze: {
    name: '守りの風のきず', kana: 'まもりのかぜのきず', kind: 'skill', job: 'yokai_bridge', mp: 14, target: 'enemies',
    effect: { type: 'phys', mult: 1.6, ...WIND },
    desc: '仲間を守る心をこめた、風のきず。敵全体を風で切りさく。自分を強くしている敵には、もっとよく効く。', cast: '{a}「みんなには、指一本ふれさせねえ！」', anim: 'r86a_kaze',
  },
  kb_kabau: {
    name: 'きずなの守り', kana: 'きずなのまもり', kind: 'skill', job: 'yokai_bridge', mp: 6, target: 'ally', role: 'sup',
    effect: { type: 'r86aKabau', def: 1.4 },
    desc: '仲間1人のまえに立って、その仲間への攻撃をかばう。自分の守備力も上がる。かばって受けた力は、ためておける。', cast: '{a}「下がってな。おれがうける！」', anim: 'r86a_mamori',
  },
  kb_onizume: {
    name: 'おにの手のつめ', kana: 'おにのてのつめ', kind: 'skill', job: 'yokai_bridge', mp: 10, target: 'enemy',
    effect: { type: 'phys', mult: 3.8, vsRace: GHOST, oni: true },
    desc: 'おにの手と、ようかいのつめを重ねて、敵1体を大きく切りさく。ゆうれい・アンデッド・悪魔には、もっとよく効く。', cast: '{a}の左手が、赤く光った！', anim: 'r86a_onizume',
  },
  kb_kizuna: {
    name: 'きずなの力', kana: 'きずなのちから', kind: 'skill', job: 'yokai_bridge', mp: 14, target: 'self', role: 'sup',
    effect: { type: 'r86aKizuna', mult: 1.6, acts: 4 },
    desc: 'ようかいの力と、おにの手の力を、仲間とのきずなでおさえこむ。4回の行動の間、物理の攻撃がとても強くなる。命令もとどき、HPもへらない。', cast: '{a}「この力は…仲間を守るためにある！」', anim: 'r86a_kizuna',
  },
  kb_chikai: {
    name: 'みんなを守るちかい', kana: 'みんなをまもるちかい', kind: 'skill', job: 'yokai_bridge', mp: 22, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'def', mult: 1.35, dur: 45 }, { type: 'regen', base: [40, 50], thr: 50 }] },
    desc: '「だれも、たおれさせない」とちかう。仲間全員の守備力が上がり、少しずつ回復していく。', cast: '{a}「みんな、おれのうしろにいろ！」', anim: 'r86a_mamori',
  },
  kb_rengeki: {
    name: 'つめとおにの手の連げき', kana: 'つめとおにのてのれんげき', kind: 'skill', job: 'yokai_bridge', mp: 16, target: 'enemy',
    effect: { type: 'phys', mult: 1.45, hits: 3, vsRace: GHOST, oni: true },
    desc: 'ようかいのつめと、おにの手で、かわるがわる3回たたきこむ。ゆうれい・アンデッド・悪魔には、もっとよく効く。', cast: '{a}「つめと、おにの手だ！」', anim: 'r86a_onizume',
  },
  kb_kaeshi: {
    name: 'ためた力の返し風', kana: 'ためたちからのかえしかぜ', kind: 'skill', job: 'yokai_bridge', mp: 20, target: 'enemies',
    effect: { type: 'phys', mult: 1.25, ...WIND, tameAll: 0.6 },
    desc: 'かばって受けとめた力を、風にまぜて敵全体へ返す。ためた力が大きいほど、ダメージも大きい。', cast: '{a}「うけとめた分、まとめて返すぜ！」', anim: 'r86a_kaze',
  },
  yokai_bridge_sig: {
    name: '人とようかいのきずな', kana: 'ひととようかいのきずな', kind: 'skill', job: 'yokai_bridge', mp: 36, target: 'enemies', role: 'dmg',
    effect: { type: 'r86aSig', take: 0.55, swing: 1.7, spread: 0.75, cap: 4.0 },
    desc: '人とようかいのきずなの、最強の技。次の自分の番まで、仲間全員への攻撃を全部かばう（受けるダメージはへる）。次の番に、ためた力を大きな風にして、敵全体へ返す。', cast: '{a}「人も、ようかいも、みんなまとめて守ってやる！」', anim: 'yokai_bridge_sig',
  },

  // ───────────── 竜神の剣士（竜神けんのサムライ ＋ 八竜の炎術士・烈火） ─────────────
  rs_futae: {
    name: '二色の太刀', kana: 'ふたいろのたち', kind: 'skill', job: 'ryujin_kenshi', mp: 10, target: 'enemy', sword: true,
    effect: { type: 'phys', mult: 3.8, r86a: 'dual' },
    desc: '雷の玉の光と、火竜の炎を、1本の刀にまとって切る。敵1体に大きなダメージ。今の玉の属性と炎の、よく効く方で当たる。', cast: '{a}の刀が、青と赤に光った！', anim: 'r86a_futae',
  },
  rs_tamagae: {
    name: '竜神の玉がえ', kana: 'りゅうじんのたまがえ', kind: 'skill', job: 'ryujin_kenshi', mp: 2, target: 'self', role: 'sup',
    effect: { type: 'tamagae' },
    desc: '刀にはめる玉を選んで、はめかえる。雷・水・氷・風・竜神の玉から選べる。炎は、火竜がいつもやどしている。すばやいので、すぐに次の番が来る。', cast: '{a}「玉がえ！」', anim: 'r82b_tamagae',
  },
  rs_ryu: {
    name: '火竜をよぶ・竜神', kana: 'かりゅうをよぶりゅうじん', kind: 'skill', job: 'ryujin_kenshi', mp: 7, target: 'self', role: 'dmg',
    effect: { type: 'r85bRyu', set: 'kenshi', pow: 1.25 },
    desc: '刀にやどした火竜を1ぴきよび出す。さいは・なだれ・まどか・れっしんの4ひきから、自分で選ぶ。火竜ごとに、やくめとMPがちがう。', cast: '{a}の刀から、火竜がとび出した…！', anim: 'r85b_call',
  },
  rs_senpu: {
    name: '二色のせんぷう剣', kana: 'ふたいろのせんぷうけん', kind: 'skill', job: 'ryujin_kenshi', mp: 20, target: 'enemies', sword: true,
    effect: { type: 'phys', mult: 1.75, r86a: 'dual' },
    desc: '雷と炎のつむじ風をまきおこして、敵全体を切る。1体ずつ、今の玉の属性と炎の、よく効く方で当たる。', cast: '{a}は、刀を大きくふり回した！', anim: 'r86a_senpu',
  },
  rs_kokoro: {
    name: '竜の心', kana: 'りゅうのこころ', kind: 'skill', job: 'ryujin_kenshi', mp: 16, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['atk', 'agi'], mult: 1.4, dur: 45 }, { type: 'heal', base: [90, 110], thr: 45 }] },
    desc: '雷の竜と火の竜の心を、1つに合わせる。自分の攻撃力と素早さが大きく上がり、HPも回復する。', cast: '{a}「雷の竜よ、火の竜よ…力を1つに！」', anim: 'r86a_kokoro',
  },
  rs_raien: {
    name: '雷と炎のあらし', kana: 'かみなりとほのおのあらし', kind: 'skill', job: 'ryujin_kenshi', mp: 24, target: 'enemies', sword: true,
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 0.95, element: 'bolt' }, { type: 'phys', mult: 0.95, element: 'fire' }] },
    desc: 'いなずまと炎が、あらしのように敵全体をおそう。雷と炎のダメージを1回ずつ。', cast: '{a}「雷よ、炎よ、あれくるえ！」', anim: 'r86a_raien',
  },
  rs_rengeki: {
    name: '竜神の連続切り', kana: 'りゅうじんのれんぞくぎり', kind: 'skill', job: 'ryujin_kenshi', mp: 18, target: 'enemy', sword: true,
    effect: { type: 'phys', mult: 1.5, hits: 4, critBonus: 0.1, r86a: 'dual' },
    desc: '雷のはやさで、敵1体を4回切る。1回ずつ、今の玉の属性と炎の、よく効く方で当たる。会心も出やすい。', cast: '{a}の刀が、目にもとまらない！', anim: 'r86a_futae',
  },
  ryujin_kenshi_sig: {
    name: '竜神・火竜・二重の太刀', kana: 'りゅうじんかりゅうにじゅうのたち', kind: 'skill', job: 'ryujin_kenshi', mp: 44, target: 'enemy', sword: true,
    effect: { type: 'phys', mult: 3.1, hits: 2, ignoreDef: 0.2, r86a: 'sig' },
    desc: '雷の竜と火の竜を刀にやどして、敵1体を2回切る竜神の剣士の最強の技。1回目は今の玉の属性、2回目は炎。もう一方がよく効くときは、そちらで切る。', cast: '{a}「雷の竜、火の竜…二重の太刀！」', anim: 'ryujin_kenshi_sig',
  },
};
