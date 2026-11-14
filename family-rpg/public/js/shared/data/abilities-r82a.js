// 第82回 A班の 技: 犬夜叉の 系統（docs/plan-jobs-r79.md の 8-1。docs/plan-r82-jobs-a.md）
//   半ようの少年 → 鉄さいがの使い手 → 犬夜しゃ → ばくりゅうはの大よう
//
// ・武器で 戦い方が かわる: つめの 技は weapon: 'fist'（つめ・素手）、刀の 技は weapon: 'sword'（剣）。
//   合わない 技は 戦いの 一覧に 出ない（stats.js の battleAbilityOk）
// ・この 系統だけの こうか（shared/battle-r82a.js）
//   osuwari    … おすわり！ 仲間1人が 地面に めりこむ。次に 受ける ダメージが 半分・ようかい化が おさまる
//   youkaiCalm … ようかい化を おさめて、しばらく ようかい化しない
//   daiyoukai  … 大よう化・せいぎょ（turns 回の 行動の 間、命令できる まま ようかい化の 力）
//   bakuryu    … ばくりゅうはの かまえ（ret … 受けた ダメージの 何倍を 返すか / cap … 返す ダメージの 上限〈自分の 物理の 何倍〉/
//                swing … 受けなかった ときの 風の 一ふり〈敵全体・物理の 何倍〉/ phys … 物理の 大技も 返す）
//   phys の vsBuff … 風の技: 自分を 強くして いる 敵には この 倍（強くして いる 数が 多いと もう少し。battle-r82a.js の r82aPhysMult）
//   phys の youkaiMult … ようかい化（大よう化も）して いる 間は この 倍
// ・きまりは abilities-r66e1.js と おなじ（攻撃技は 2つ いじょう・みんなに かける 補助は ランクの 上限まで・Lv10 の 技が いちばん MP・
//   看板の 技は <職業の id>_sig。自分や 仲間に かける 技の えんしゅつは 前から ある 物）

const FIST = 'fist';
const SWORD = 'sword';
const WIND = { element: 'wind', vsBuff: 1.3 };

export const R82A_ABILITIES = {
  // ───────────── 半ようの少年（基本職） ─────────────
  hyb_sankon: {
    name: 'さんこんてっそう', kana: 'さんこんてっそう', kind: 'skill', job: 'hanyo_boy', mp: 3, target: 'enemy', weapon: FIST,
    effect: { type: 'phys', mult: 0.85, hits: 2 },
    desc: 'するどいつめで、2回つづけて引っかく。敵1体に2回ダメージ。つめか素手の時に使える。', cast: '{a}の、さんこんてっそう！', anim: 'r82a_claw',
  },
  hyb_hana: {
    name: '鼻がきく', kana: 'はながきく', kind: 'skill', job: 'hanyo_boy', mp: 3, target: 'enemies', role: 'sup',
    effect: { type: 'scan' },
    desc: '犬のような鼻で、においをかぎ分ける。敵全体の弱点がわかる。', cast: '{a}は、くんくんとにおいをかいだ…', anim: 'r82a_sniff',
  },
  hyb_hijin: {
    name: 'ひじんけっそう', kana: 'ひじんけっそう', kind: 'skill', job: 'hanyo_boy', mp: 4, target: 'enemies', weapon: FIST,
    effect: { type: 'multi', parts: [{ type: 'charge', mult: 1, hpCost: 0.05, target: 'self' }, { type: 'phys', mult: 1.0 }] },
    desc: '自分のHPを少し使って、赤い光のやいばを飛ばす。敵全体にダメージ。つめか素手の時に使える。', cast: '{a}の、ひじんけっそう！', anim: 'r82a_blade',
  },
  hyb_osuwari: {
    name: 'おすわり！', kana: 'おすわり', kind: 'skill', job: 'hanyo_boy', mp: 2, target: 'ally', role: 'sup',
    effect: { type: 'osuwari' },
    desc: '首かざりの力で、仲間1人を地面にめりこませる。次に受けるダメージが半分になり、ようかい化もおさまる。', cast: '{a}「おすわり！」', anim: 'guard',
  },
  hyb_renge: {
    name: 'つめの連げき', kana: 'つめのれんげき', kind: 'skill', job: 'hanyo_boy', mp: 7, target: 'enemy', weapon: FIST,
    effect: { type: 'phys', mult: 0.62, hits: 4 },
    desc: 'つめで、目にもとまらない速さで引っかきつづける。敵1体に4回ダメージ。つめか素手の時に使える。', cast: '{a}の、つめの連げき！', anim: 'r82a_claw',
  },
  hanyo_boy_sig: {
    name: 'あばれんぼうの大づめ', kana: 'あばれんぼうのおおづめ', kind: 'skill', job: 'hanyo_boy', mp: 10, target: 'enemy', weapon: FIST,
    effect: { type: 'phys', mult: 2.6, youkaiMult: 1.35 },
    desc: '大きくとび上がって、つめをふり下ろす。敵1体に大ダメージ。ようかい化している間は、さらに強い。つめか素手の時に使える。', cast: '{a}の、あばれんぼうの大づめ！', anim: 'hanyo_boy_sig',
  },

  // ───────────── 鉄さいがの使い手（上級職） ─────────────
  tsg_hitofuri: {
    name: '鉄さいがの一ふり', kana: 'てっさいがのひとふり', kind: 'skill', job: 'tessaiga_user', mp: 4, target: 'enemy', weapon: SWORD,
    effect: { type: 'phys', mult: 1.95 },
    desc: '大きな刀を、力いっぱいふり下ろす。敵1体に強い一撃。剣の時に使える。', cast: '{a}の、鉄さいがの一ふり！', anim: 'r82a_fang',
  },
  tsg_henge: {
    name: '変化する刀', kana: 'へんげするかたな', kind: 'skill', job: 'tessaiga_user', mp: 4, target: 'self', role: 'sup', weapon: SWORD,
    effect: { type: 'buff', stat: 'atk', mult: 1.4, dur: 40 },
    desc: 'さびた刀が、大きなきばの刀に変わる。自分の攻撃力が上がる。剣の時に使える。', cast: '{a}の刀が、大きなきばの形に変わった！', anim: 'charge',
  },
  tsg_kabau: {
    name: 'かばう心', kana: 'かばうこころ', kind: 'skill', job: 'tessaiga_user', mp: 3, target: 'ally', role: 'sup',
    effect: { type: 'cover' },
    desc: '「おれの後ろにいろ！」仲間1人を、自分の体でかばう。', cast: '{a}「おれの後ろにいろ！」', anim: 'guard',
  },
  tsg_kekkai: {
    name: 'けっかい斬り', kana: 'けっかいぎり', kind: 'skill', job: 'tessaiga_user', mp: 8, target: 'enemy', weapon: SWORD,
    effect: { type: 'phys', mult: 1.6, ignoreDef: 0.5, dispel: true },
    desc: '赤く光る刀で、守りのかべごと切る。敵1体にダメージ。守りの固い敵にもよく効き、敵の強くなる力も消す。剣の時に使える。', cast: '{a}の、けっかい斬り！', anim: 'r82a_red',
  },
  tsg_sankon: {
    name: 'さんこんてっそう・改', kana: 'さんこんてっそうかい', kind: 'skill', job: 'tessaiga_user', mp: 7, target: 'enemy', weapon: FIST,
    effect: { type: 'phys', mult: 0.8, hits: 3, atbAfter: 40 },
    desc: 'つめで3回、すばやく引っかく。敵1体に3回ダメージ。次の番が早く来る。つめか素手の時に使える。', cast: '{a}の、さんこんてっそう・改！', anim: 'r82a_claw',
  },
  tessaiga_user_sig: {
    name: '風のきず', kana: 'かぜのきず', kind: 'skill', job: 'tessaiga_user', mp: 16, target: 'enemies', weapon: SWORD,
    effect: { type: 'phys', mult: 1.3, ...WIND },
    desc: '風と風のぶつかる「きず」を切って、大きな風をおこす。敵全体に風のダメージ。自分を強くしている敵には、もっと効く。剣の時に使える。', cast: '{a}「風のきず！」', anim: 'tessaiga_user_sig',
  },

  // ───────────── 犬夜しゃ（超級職） ─────────────
  iny_kaze_ren: {
    name: '風のきず・連', kana: 'かぜのきずれん', kind: 'skill', job: 'inuyasha', mp: 18, target: 'enemies', weapon: SWORD,
    effect: { type: 'phys', mult: 0.8, hits: 2, ...WIND },
    desc: '風のきずを2回つづけて切る。敵全体に2回ずつ風のダメージ。自分を強くしている敵には、もっと効く。剣の時に使える。', cast: '{a}「風のきず、もう一発だ！」', anim: 'r82a_wind',
  },
  iny_akai: {
    name: '赤い鉄さいが', kana: 'あかいてっさいが', kind: 'skill', job: 'inuyasha', mp: 10, target: 'enemy', weapon: SWORD,
    effect: { type: 'phys', mult: 2.3, ignoreDef: 0.5, dispel: true },
    desc: '赤くそまった鉄さいがで、守りのかべをつらぬく。敵1体に大ダメージ。守りの固い敵にもよく効き、敵の強くなる力も消す。剣の時に使える。', cast: '{a}の鉄さいがが、赤くそまった！', anim: 'r82a_red',
  },
  iny_shinjiru: {
    name: '仲間を信じる', kana: 'なかまをしんじる', kind: 'skill', job: 'inuyasha', mp: 12, target: 'allies', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'def'], mult: 1.3, dur: 40 },
    desc: '「おめえらがいるから、おれは戦える！」仲間全員の攻撃力と守備力が上がる。', cast: '{a}「おめえらがいるから、おれは戦える！」', anim: 'warcry',
  },
  iny_kongou: {
    name: '金ごうそうは', kana: 'こんごうそうは', kind: 'skill', job: 'inuyasha', mp: 16, target: 'enemies', weapon: SWORD,
    effect: { type: 'phys', mult: 0.55, hits: 6, random: true, ignoreDef: 0.25 },
    desc: '刀からダイヤモンドのやりを6本飛ばす。敵全体のどれかに、ランダムで6回当たり、守りの固い敵にも少し効く。剣の時に使える。', cast: '{a}「金ごうそうは！」', anim: 'r82a_diamond',
  },
  iny_osaeru: {
    name: 'よう力をおさえる', kana: 'ようりょくをおさえる', kind: 'skill', job: 'inuyasha', mp: 8, target: 'self', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [80, 100], thr: 40 }, { type: 'youkaiCalm', acts: 3 }] },
    desc: '深く息をして、ようかいの血をしずめる。自分のHPが回復し、ようかい化がおさまって、しばらくようかい化しない。', cast: '{a}は、目をとじて、ようかいの血をしずめた…', anim: 'heal2',
  },
  inuyasha_sig: {
    name: 'ばくりゅうは', kana: 'ばくりゅうは', kind: 'skill', job: 'inuyasha', mp: 24, target: 'enemies', role: 'dmg', weapon: SWORD,
    effect: { type: 'bakuryu', ret: 1.0, cap: 3.0, swing: 0.8 },
    desc: '鉄さいがをかまえて、敵の大技を待つ。次の自分の番までに、敵の呪文・ブレス・ためた大技を受けると、風にまきこんで敵全体へ返す。受けなかった時は、敵全体に風の一ふり。剣の時に使える。', cast: '{a}は、鉄さいがをかまえた。「来やがれ！」', anim: 'charge',
  },

  // ───────────── ばくりゅうはの大よう（伝説の職業。犬夜しゃ＋ほかの 超級職 1つ） ─────────────
  bry_ryurin: {
    name: '竜りんの鉄さいが', kana: 'りゅうりんのてっさいが', kind: 'skill', job: 'bakuryuha', mp: 8, target: 'enemy', weapon: SWORD,
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 2.8 }, { type: 'drainMp', amount: [8, 16] }, { type: 'mpHeal', base: [8, 16], target: 'self' }] },
    desc: '竜のうろこのように光る刀で切る。敵1体に大ダメージ。敵のMPを少しすいとって、自分のMPにする。剣の時に使える。', cast: '{a}の、竜りんの鉄さいが！', anim: 'r82a_fang',
  },
  bry_meidou: {
    name: 'めいどうざんげつは', kana: 'めいどうざんげつは', kind: 'skill', job: 'bakuryuha', mp: 20, target: 'enemy', weapon: SWORD,
    effect: { type: 'destroy', chance: 0.4, bossMult: 3.4, msg: '{t}は、黒い月の形の道のむこうへ、すいこまれて消えた！', failMsg: 'しかし{t}は、黒い月の道にすいこまれなかった！', bossMsg: '{t}は、黒い月の道にたえた！' },
    desc: '黒い月の形の道を切りひらく。敵1体を、道のむこうへすいこんで消すことがある。ボスには大ダメージ。剣の時に使える。', cast: '{a}「めいどうざんげつは！」', anim: 'r82a_moon',
  },
  bry_daiyou: {
    name: '大よう化・せいぎょ', kana: 'だいようかせいぎょ', kind: 'skill', job: 'bakuryuha', mp: 14, target: 'self', role: 'sup',
    effect: { type: 'daiyoukai', turns: 3 },
    desc: 'ようかいの力を、自分の心でおさえたまま引き出す。3回行動する間、命令を聞いたまま、ようかい化の力で戦える。', cast: '{a}の目が赤く光った…でも、心はそのままだ！', anim: 'charge',
  },
  bry_kongou: {
    name: '金ごうそうは・乱', kana: 'こんごうそうはらん', kind: 'skill', job: 'bakuryuha', mp: 26, target: 'enemies', weapon: SWORD,
    effect: { type: 'phys', mult: 0.5, hits: 10, random: true, ignoreDef: 0.3 },
    desc: 'ダイヤモンドのやりを10本、雨のようにふらせる。敵全体のどれかに、ランダムで10回当たり、守りの固い敵にもよく効く。剣の時に使える。', cast: '{a}「金ごうそうは・乱！」', anim: 'r82a_diamond',
  },
  bry_chikai: {
    name: '守りぬくちかい', kana: 'まもりぬくちかい', kind: 'skill', job: 'bakuryuha', mp: 18, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'cover', all: true, defMult: 1.25, target: 'self' }, { type: 'regen', base: [35, 45], thr: 50 }] },
    desc: '「だれも、きずつけさせねえ！」仲間全員をかばうかまえになり、仲間全員が少しずつ回復する。', cast: '{a}「だれも、きずつけさせねえ！」', anim: 'guard',
  },
  bakuryuha_sig: {
    name: '真・ばくりゅうは', kana: 'しんばくりゅうは', kind: 'skill', job: 'bakuryuha', mp: 30, target: 'enemies', role: 'dmg', weapon: SWORD,
    effect: { type: 'bakuryu', ret: 1.2, cap: 3.6, swing: 1.0, phys: true },
    desc: '鉄さいがをかまえて、敵の大技を待つ。次の自分の番までに、敵の呪文・ブレス・ためた大技、物理の大技も受けると、風にまきこんで敵全体へ返す。受けなかった時は、敵全体に強い風の一ふり。剣の時に使える。', cast: '{a}は、鉄さいがをかまえた。「まとめて返してやるぜ！」', anim: 'charge',
  },
};
