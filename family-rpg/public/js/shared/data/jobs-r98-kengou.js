// 第98回 K2班: きずなの職業「天下無そうの剣ごう」（docs/plan-kizuna-jobs.md の 3〈2〉・7。実装メモは おなじ 文書の おわり〈9〉）
//   竜神けんのサムライ（新しい 系統〈YAIBA〉の 伝説）＋ 飛天御剣流けい承者（るろうに剣士 → 人斬りばっ刀さい → ひ村ばっ刀さい → 飛天御剣流けい承者 の いちばん 上）
//   玉で 属性を かえる 剣 と はやい 剣。弱点を ついた 時に、はやい もう 一太刀（次の 番も 早く 来る）
//   名前の「豪」は 小学校で ならわない 字なので かな（剣ごう）。天下無そうの剣聖（飛天 ＋ 暴れんぼう将軍）とは べつ
//
// 形は jobs-r98-kuuchou.js と おなじ（1つ 1ファイル。data/kizuna.js の 一覧に 1行）
// 新しい 戦いの しくみは 作らない（親の しくみ: 玉がえ〈tamagae。持てる 玉は 7つ ＝ battle-r98-kengou.js で TAMA_BY_JOB に 入れる〉・
//   今の 玉の 属性に なる 剣〈yb 'tama'〉・玉を つぎつぎ はめかえる 剣〈yb 'strike'〉・雷神のいかり〈thunderMult〉・神速の 剣・マントを ぬぐ）
//   弱点の もう 一太刀（weakSlash・weakAtb）だけ、YAIBA の 剣の しくみ（battle-r82b.js の r82bPhys・strike）に 数を 2つ 足した（どの 職業の 剣の 技でも 書けば 使える）

const SWORD = ['sword']; // 条件の タグ（剣の 技。名前に 剣・斬・刀 が ない 技も 剣に 数える）

export const KIZUNA_KENGOU = {
  job: {
    id: 'tenka_kengou', name: '天下無そうの剣ごう', kana: 'てんかむそうのけんごう', short: '剣ごう', tier: 4, req: ['ryujin_samurai', 'hiten'], family: 'phys', color: '#2a8ac8',
    desc: '7つの玉を1本の刀にやどし、神のような速さでふるう剣ごう。竜神けんのサムライと飛天御剣流けい承者をきわめ、剣と雷の技をたくさん使った者だけがなれる。弱点をつくと、目にもとまらないもう一太刀が出る。',
    mods: { hp: 2.05, mp: 1.55, str: 1.75, def: 1.75, agi: 1.7, mag: 0.9, heal: 1.15 },
    weapons: ['sword', 'dagger', 'none'], shield: false, armor: ['cloth', 'gi', 'robe'], helm: false,
    perLv: { str: 1.5, agi: 1.5, hp: 0.5 },
    learn: [[1, 'kg_shinsoku'], [2, 'kg_tamagae'], [3, 'kg_futatachi'], [4, 'kg_mantle'], [5, 'kg_tatsumaki'], [6, 'kg_yomi'], [7, 'kg_ikari'], [8, 'kg_kuzuryu'], [10, 'tenka_kengou_sig']],
  },
  phantom: {
    name: '天下無そうの剣ごう', masters: ['ryujin_samurai', 'hiten'],
    conds: [{ use: ['sword'], goal: 1000, text: '剣の技を1000回使う' }, { use: ['bolt'], goal: 300, text: '雷の技を300回使う' }, { stat: 'crit', goal: 300, text: '会心の一撃を300回出す' }],
  },
  hint: '7つの玉をそろえたサムライと、飛天御剣流のおく義を受けついだ剣士。2人の道をきわめた者は、どんな敵の弱点も、目にもとまらない速さで切れるらしい…',

  // 技（MP は 幻の 技なので 0.65倍で 使う）
  abilities: {
    // ── 竜神けんのサムライから（玉がえ・属性の 剣・風の玉・雷神のいかり）──
    kg_tamagae: {
      name: '神速の玉がえ', kana: 'しんそくのたまがえ', kind: 'skill', job: 'tenka_kengou', mp: 2, target: 'self', role: 'sup',
      effect: { type: 'tamagae' },
      desc: '刀にはめる玉を選んで、目にもとまらない速さではめかえる。雷・火・水・氷・風・竜神の6つから選べる。剣の技が、その玉の属性になる。すぐに次の番が来る。', cast: '{a}「玉がえ！」', anim: 'r82b_tamagae',
    },
    kg_futatachi: {
      name: '属性斬り・二の太刀', kana: 'ぞくせいぎりにのたち', kind: 'skill', job: 'tenka_kengou', mp: 8, target: 'enemy', phantomTags: SWORD,
      effect: { type: 'phys', mult: 2.0, yb: 'tama', weakSlash: 1.0, weakAtb: 50 },
      desc: '今の玉の力をこめて、敵1体を強く切る。今の玉の属性のダメージ。弱点に当たると、すかさずはやいもう一太刀が出て、次の番も早く来る。', cast: '{a}の属性斬り！', anim: 'r82b_slash',
    },
    kg_tatsumaki: {
      name: '風の玉・竜巻閃', kana: 'かぜのたまりゅうかんせん', kind: 'skill', job: 'tenka_kengou', mp: 16, target: 'enemies', phantomTags: SWORD,
      effect: { type: 'phys', mult: 1.6, element: 'wind', yb: 'fix', debuff: { stat: 'agi', mult: 0.8, dur: 30, chance: 0.6 } },
      desc: '風の玉の力で、体ごと回りながら大きな竜巻を起こす。敵全体に風のダメージ。敵の素早さが下がることがある。', cast: '{a}の風の玉・竜巻閃！', anim: 'r82b_whirl',
    },
    kg_ikari: {
      name: '雷神の神速ぎり', kana: 'らいじんのしんそくぎり', kind: 'skill', job: 'tenka_kengou', mp: 20, target: 'enemies', phantomTags: SWORD,
      effect: { type: 'phys', mult: 1.6, element: 'bolt', yb: 'fix', thunderMult: 1.5 },
      desc: '雷神のいかりを刀にまとって、雷のような速さで敵全体を切りぬける。雷のダメージ。味方の雷の天気だと、1.5倍になる。', cast: '{a}「雷神よ、刀に力を！」', anim: 'r82b_bolt',
    },
    // ── 飛天御剣流けい承者から（神速・マント・先読み・九頭竜）──
    kg_shinsoku: {
      name: '神速の玉の太刀', kana: 'しんそくのたまのたち', kind: 'skill', job: 'tenka_kengou', mp: 12, target: 'enemy', phantomTags: SWORD,
      effect: { type: 'phys', mult: 3.3, critBonus: 0.1, yb: 'tama' },
      desc: '神のような速さの一太刀。敵1体に、今の玉の属性の大きなダメージ。会心も出やすい。', cast: '{a}の姿が、ふっと消えた…！', anim: 'slash_heavy',
    },
    kg_mantle: {
      name: '重いマントをぬぐ', kana: 'おもいまんとをぬぐ', kind: 'skill', job: 'tenka_kengou', mp: 10, target: 'self', role: 'sup',
      effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.5, dur: 45 },
      desc: 'とても重い白いマントをぬぐ。体が軽くなって、自分の攻撃力と素早さがとても上がる。', cast: '{a}はマントをぬいだ。ドスン！7つの玉が、きらりと光った…', anim: 'charge',
    },
    kg_yomi: {
      name: '弱点を読む目', kana: 'じゃくてんをよむめ', kind: 'skill', job: 'tenka_kengou', mp: 10, target: 'enemies', role: 'sup',
      effect: { type: 'multi', parts: [{ type: 'scan' }, { type: 'debuff', stat: 'def', mult: 0.8, dur: 40, chance: 0.8 }] },
      desc: '敵の動きと体を、すべて先読みする。敵全体の弱点と効かない属性がわかり（図鑑にものこる）、守備力も下がる。', cast: '{a}には、敵の弱点が見えている…', anim: 'debuff',
    },
    kg_kuzuryu: {
      name: '九頭竜閃・玉', kana: 'くずりゅうせんたま', kind: 'skill', job: 'tenka_kengou', mp: 24, target: 'enemy', phantomTags: SWORD,
      effect: { type: 'phys', mult: 0.42, hits: 9, yb: 'tama' },
      desc: '9つの方向から、同時に打ちこむ大技。敵1体を9回切る。今の玉の属性のダメージ。', cast: '{a}の飛天御剣流！九頭竜閃！', anim: 'himura_sig',
    },
    // ── かけ合わせの 技（看板）: 7つの 玉を 神速で はめかえて 切る。弱点の 玉で 切ると 強く、弱点に 当たれば はやい もう 一太刀 ──
    tenka_kengou_sig: {
      name: '天かける七つ玉のひらめき', kana: 'あまかけるななつだまのひらめき', kind: 'skill', job: 'tenka_kengou', mp: 40, target: 'enemy', role: 'dmg', phantomTags: SWORD,
      effect: { type: 'phys', mult: 0.64, hits: 7, critBonus: 0.1, yb: 'strike', balls: ['bolt', 'fire', 'water', 'ice', 'wind', 'blast', 'light'], weakBonus: 1.25, weakSlash: 1.6, weakAtb: 60 },
      desc: '7つの玉を、神速ではめかえながら、敵1体を7回切る。弱点の玉で切ると、もっと大きなダメージ。弱点に当たると、最後にはやいもう一太刀が出て、次の番も早く来る。', cast: '{a}「7つの玉よ、天をかけろ！」', anim: 'tenka_kengou_sig',
    },
  },
  hira: {
    abilities: {
      hi_kengou: {
        name: '竜のひらめき・二の太刀', kana: 'りゅうのひらめきにのたち', kind: 'skill', job: 'tenka_kengou', hirameki: true, mp: 22, target: 'enemies', phantomTags: SWORD,
        effect: { type: 'phys', mult: 1.7, yb: 'tama', weakSlash: 0.8, weakAtb: 40 },
        desc: '今の玉の力で、敵全体を神速で切りぬける。今の玉の属性のダメージ。弱点の敵がいると、すかさずはやいもう一太刀が出る。', cast: '{a}の剣が、竜のようにひらめいた！', anim: 'kizuna_issen',
      },
    },
    conds: { hi_kengou: { from: { kg_shinsoku: 10, kg_futatachi: 6 } } },
  },
  tags: ['sword', 'bolt', 'wind', 'master'], // 剣・雷神・竜巻閃・2つの 道を きわめた（剣の 組は 第98回の わりふりで K2班が この 1つだけ）
  say: '「玉も剣も、目にもとまらないぞ！」',
  trial: '弱いところを見ぬく目こそ、いちばんの剣だ。',
  vehicle: { id: 'tenkakeru_ryu', v: { name: '七つ玉の天かける竜', price: 28500, jobs: ['tenka_kengou'], phantom: true, desc: '白と青の長い体の竜。まわりを7つの玉がくるくる回り、さくらの花びらをまきあげて、空をかける。' } },
  // 職業の試練の まぼろしの 強さ（tools/sim-trial-tune.mjs 10 0.75 HI=4 を SEED 500・900 で さがした 平均）
  trialAdj: [0.98, 0.84, 1.11],
  work: 'yaiba',
};
