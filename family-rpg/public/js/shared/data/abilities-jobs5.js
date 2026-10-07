// 2026年10月（第22回）の 新しい 職業の 技
//  おかん → 最強のおかん、会社員 → 社ちく → ブラックきぎょうの星、天才しせつ管理者（伝説）、はかい神（伝説）
//
// きまりは abilities-jobs4.js と おなじ（どの 職業にも 攻撃技・補助の 強さは ランクで そろえる）
// 新しい こうか（battle.js）
//  ・overtime … 自分の HPを けずって、すぐに もう一度 動く（サービス残業・休日出勤。HPは 1より へらない）
//  ・destroy … 敵を けしさる（たおした ことに なる）。ボスと メタルには 効かず、かわりに 大きな ダメージ（はかい）
//  ・scan … 敵の 弱点と 効かない 属性が ぜんぶ わかる（見える化。図鑑にも のこる）
// 職業の とくせい（jobs.js の passive）
//  ・grit … HPが 少ないほど 攻撃が 強く なる（社ちく・ブラックきぎょうの星）
//  ・foresee … 敵の 大技（ためてから 出す 技）の ダメージが 小さく なる（天才しせつ管理者が 戦っている あいだ、仲間 みんな）

const STATUS_ALL = ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'];

export const JOB5_ABILITIES = {
  // ───────────── おかん（基本職） ─────────────
  ok_otama: {
    name: 'おたまでポカリ', kana: 'おたまでぽかり', kind: 'skill', job: 'okan', mp: 1, target: 'enemy',
    effect: { type: 'phys', mult: 1.35 },
    desc: 'おたまで、敵1体の頭をポカリとたたく。', cast: '{a}はおたまで{t}をポカリ！', anim: 'okan_otama',
  },
  ok_gohan: {
    name: 'ごはんできたよ', kana: 'ごはんできたよ', kind: 'skill', job: 'okan', mp: 5, target: 'allies', role: 'heal', field: true,
    effect: { type: 'heal', base: [22, 30], thr: 14 },
    desc: '温かいごはんで、仲間全員のHPを回復する。', cast: '{a}「ごはんできたよー！」', anim: 'gohan',
  },
  ok_nenasai: {
    name: '早くねなさい！', kana: 'はやくねなさい', kind: 'skill', job: 'okan', mp: 4, target: 'group',
    effect: { type: 'status', status: 'sleep', chance: 0.45, turns: [2, 3] },
    desc: '同じ種類の敵をしかりつけて、ねむらせることがある。', cast: '{a}「いつまで起きてるの！早くねなさい！」', anim: 'oyasumi',
  },
  ok_negiri: {
    name: '値切り', kana: 'ねぎり', kind: 'skill', job: 'okan', mp: 3, target: 'enemy',
    effect: { type: 'debuff', stat: 'def', mult: 0.85, dur: 30, chance: 0.8 },
    desc: '「もうちょっとまけて！」敵1体の守備力を下げる。', cast: '{a}「なあ、もうちょっとまけてくれへん？」', anim: 'debuff',
  },
  ok_slipper: {
    name: 'スリッパではたく', kana: 'すりっぱではたく', kind: 'skill', job: 'okan', mp: 5, target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 1.75 }, { type: 'atbSet', sub: 30, chance: 0.4, msg: '{t}は、びっくりして動きが止まった！', failMsg: '{t}は、平気な顔をしている。' }] },
    desc: 'スリッパで敵1体をパーンとはたく。びっくりして動きが止まることもある（ボスには効きにくい）。', cast: '{a}はスリッパをぬいだ！パーン！', anim: 'slipper_smack',
  },
  ok_bentou: {
    name: 'お弁当', kana: 'おべんとう', kind: 'skill', job: 'okan', mp: 6, target: 'allies', role: 'heal',
    effect: { type: 'regen', base: [6, 9], thr: 14, dur: 24 },
    desc: '手作りのお弁当。仲間全員のHPが、しばらく少しずつ回復する。', cast: '{a}はお弁当を配った！「残さず食べるんよ」', anim: 'gohan',
  },
  ok_katazuke: {
    name: '片付けなさい！', kana: 'かたづけなさい', kind: 'skill', job: 'okan', mp: 5, target: 'enemies',
    effect: { type: 'dispel' },
    desc: '敵全体をしかりつけて、強くなる効果を消す。', cast: '{a}「出したら片付ける！何回言うたらわかるの！」', anim: 'wind1',
  },
  ok_ame: {
    name: 'あめちゃん', kana: 'あめちゃん', kind: 'skill', job: 'okan', mp: 1, target: 'ally', role: 'heal',
    effect: { type: 'mpHeal', base: [5, 8] },
    desc: '仲間1人にあめちゃんをあげる。MPが少し回復する。', cast: '{a}「{t}、あめちゃんあげよか？」', anim: 'heal1',
  },
  ok_ikari: {
    name: 'おかんのいかり', kana: 'おかんのいかり', kind: 'skill', job: 'okan', mp: 10, target: 'enemies',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 1.1 }, { type: 'atbSet', sub: 25, chance: 0.4, msg: '{t}は、こわくて動けない！', failMsg: '{t}は、なんとかたえた！' }] },
    desc: '本気でおこったおかんが、敵全体をしかりとばす。動きが止まることもある（ボスには効きにくい）。', cast: '{a}「ええかげんにしなさい！！」', anim: 'okan_kaminari',
  },

  // ───────────── 最強のおかん（上級職） ─────────────
  so_kaminari: {
    name: 'おかんの雷', kana: 'おかんのかみなり', kind: 'skill', job: 'saikyo_okan', mp: 9, target: 'enemies',
    effect: { type: 'magic', element: 'bolt', base: [58, 72], thr: 40 },
    desc: '敵全体に、大きな雷を落とす（しかる）。雷のダメージ。', cast: '{a}の雷が落ちた！「コラーッ！！」', anim: 'okan_kaminari',
  },
  so_okawari: {
    name: 'ごはんおかわり', kana: 'ごはんおかわり', kind: 'skill', job: 'saikyo_okan', mp: 10, target: 'allies', role: 'heal', field: true,
    effect: { type: 'multi', parts: [{ type: 'heal', base: [55, 70], thr: 40 }, { type: 'cure', statuses: STATUS_ALL }] },
    desc: 'おかわり自由のごはん。仲間全員のHPを回復して、悪いじょうたいも治す。', cast: '{a}「おかわりもあるよー！」', anim: 'gohan',
  },
  so_osouji: {
    name: '大そうじ', kana: 'おおそうじ', kind: 'skill', job: 'saikyo_okan', mp: 12, target: 'enemies',
    effect: { type: 'phys', mult: 1.2, dispel: true },
    desc: 'ほうきで敵全体をはたく大そうじ。敵の強くなる効果も消す。', cast: '{a}「今日は大そうじや！」', anim: 'wind2',
  },
  so_slipper: {
    name: '最強のスリッパ', kana: 'さいきょうのすりっぱ', kind: 'skill', job: 'saikyo_okan', mp: 12, target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 2.6 }, { type: 'atbSet', sub: 40, chance: 0.5, msg: '{t}は、びっくりして動きが止まった！', failMsg: '{t}は、なんとかたえた！' }] },
    desc: '目にもとまらぬスリッパで、敵1体をはたく。動きが止まることもある（ボスには効きにくい）。', cast: '{a}のスリッパがうなる！スパーン！！', anim: 'slipper_smack',
  },
  so_ai: {
    name: 'おかんの愛', kana: 'おかんのあい', kind: 'skill', job: 'saikyo_okan', mp: 18, target: 'deadAlly', role: 'heal', field: true,
    effect: { type: 'revive', hpRatio: 0.5 },
    desc: 'たおれた仲間1人を、おかんの愛で生き返らせる（HPは半分）。', cast: '{a}「こんな所でねてたらあかん！起きなさい！」', anim: 'revive',
  },
  so_kaji: {
    name: '家事全力', kana: 'かじぜんりょく', kind: 'skill', job: 'saikyo_okan', mp: 14, target: 'allies', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'def'], mult: 1.2, dur: 40 },
    desc: 'せんたく・そうじ・料理を全力で。仲間全員の攻撃力と守備力が上がる。', cast: '{a}は家事を全力で終わらせた！みんなの体が軽い！', anim: 'buff',
  },
  so_binta: {
    name: '最強のおかんビンタ', kana: 'さいきょうのおかんびんた', kind: 'skill', job: 'saikyo_okan', mp: 20, target: 'enemy',
    effect: { type: 'phys', mult: 3.4, ignoreDef: 0.2 },
    desc: '最強のおかんの、最強のビンタ。敵1体にとても大きなダメージ。守りが固い敵にも強い。', cast: '{a}「歯を食いしばりなさい！」', anim: 'slipper_smack',
  },

  // ───────────── 社ちく（上級職。HPが 少ないほど 強い） ─────────────
  sk_tsukin: {
    name: '通勤ラッシュ', kana: 'つうきんらっしゅ', kind: 'skill', job: 'shachiku', mp: 6, target: 'enemies',
    effect: { type: 'phys', mult: 0.9 },
    desc: '朝の通勤ラッシュのいきおいで、敵全体にぶつかる。', cast: '{a}は満員電車からおし出された！', anim: 'manin_densha',
  },
  sk_zangyou: {
    name: 'サービス残業', kana: 'さーびすざんぎょう', kind: 'skill', job: 'shachiku', mp: 2, target: 'self', role: 'sup', noAuto: true,
    effect: { type: 'overtime', hpCost: 0.12, msg: '{a}は、すぐに次の仕事に取りかかった！' },
    desc: '自分のHPを少しけずって、すぐにもう一度行動する。HPが少ないほど強い社ちくには、ちょうどいい（オートでは使わない）。', cast: '{a}「今日も終電かな…」', anim: 'zangyou',
  },
  sk_eiyou: {
    name: '栄養ドリンク', kana: 'えいようどりんく', kind: 'skill', job: 'shachiku', mp: 0, target: 'self', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [45, 60], thr: 25 }, { type: 'mpHeal', base: [3, 5] }] },
    desc: '栄養ドリンクを一気に飲む。自分のHPとMPが少し回復する。', cast: '{a}は栄養ドリンクを一気に飲んだ！「よし、もうひとふんばり！」', anim: 'heal1',
  },
  sk_kaigi: {
    name: '長い会議', kana: 'ながいかいぎ', kind: 'skill', job: 'shachiku', mp: 7, target: 'enemies',
    effect: { type: 'status', status: 'sleep', chance: 0.35, turns: [2, 3] },
    desc: '終わらない会議で、敵全体をねむくさせる。ねむってしまうことがある。', cast: '{a}「…というわけで、次の議題ですが」', anim: 'sleep',
  },
  sk_iji: {
    name: '社ちくの意地', kana: 'しゃちくのいじ', kind: 'skill', job: 'shachiku', mp: 8, target: 'enemy',
    effect: { type: 'phys', mult: 2.3 },
    desc: 'どんなにつかれても負けない意地の一撃。敵1体に大きなダメージ。HPが少ないほど強い。', cast: '{a}「ここで休むわけにはいかない！」', anim: 'black_star',
  },
  sk_pekopeko: {
    name: 'ぺこぺこ', kana: 'ぺこぺこ', kind: 'skill', job: 'shachiku', mp: 6, target: 'enemies',
    effect: { type: 'debuff', stat: 'atk', mult: 0.85, dur: 30, chance: 0.7 },
    desc: 'ぺこぺことあやまって、敵全体の攻撃力を下げる。', cast: '{a}「たいへん申しわけございません！」', anim: 'debuff',
  },
  sk_shuuden: {
    name: '終電ダッシュ', kana: 'しゅうでんだっしゅ', kind: 'skill', job: 'shachiku', mp: 14, target: 'enemies',
    effect: { type: 'phys', mult: 0.85, hits: 4, random: true },
    desc: '終電に間に合うように全力で走る。敵にランダムで4回体当たり。', cast: '{a}「終電、待ってー！」', anim: 'manin_densha',
  },

  // ───────────── ブラックきぎょうの星（超級職。HPが 少ないほど とても 強い） ─────────────
  bk_kyujitsu: {
    name: '休日出勤', kana: 'きゅうじつしゅっきん', kind: 'skill', job: 'black_star', mp: 3, target: 'self', role: 'sup', noAuto: true,
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'atk', mult: 1.3, dur: 40 }, { type: 'overtime', hpCost: 0.15, msg: '{a}は休みの日も会社へ向かった！' }] },
    desc: '休みの日も会社へ。自分のHPをけずって攻撃力を上げ、すぐにもう一度行動する（オートでは使わない）。', cast: '{a}「休みの日？なにそれ？」', anim: 'zangyou',
  },
  bk_tomari: {
    name: '会社にとまりこみ', kana: 'かいしゃにとまりこみ', kind: 'skill', job: 'black_star', mp: 8, target: 'self', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [140, 170], thr: 40 }, { type: 'cure', statuses: STATUS_ALL }] },
    desc: '会社のゆかでひとねむり。自分のHPを大きく回復して、悪いじょうたいも治す。', cast: '{a}は会社のゆかでねむった…。朝だ！', anim: 'heal2',
  },
  bk_norma: {
    name: 'ノルマ達成', kana: 'のるまたっせい', kind: 'skill', job: 'black_star', mp: 14, target: 'enemy',
    effect: { type: 'phys', mult: 2.8 },
    desc: 'どんなノルマも達成する。敵1体に大きなダメージ。HPが少ないほど強い。', cast: '{a}「今月のノルマ、達成です！」', anim: 'black_star',
  },
  bk_24h: {
    name: '24時間戦えますか', kana: 'にじゅうよじかんたたかえますか', kind: 'skill', job: 'black_star', mp: 14, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'atk', mult: 1.3, dur: 40 }, { type: 'hurt', base: [8, 16], msg: '{t}は少しつかれた…' }] },
    desc: '仲間全員の攻撃力が上がる。でも、みんな少しつかれてHPがへる（HPは1より下がらない）。', cast: '{a}「24時間、戦えますか！」', anim: 'black_aura',
  },
  bk_ichigan: {
    name: '全員出社アタック', kana: 'ぜんいんしゅっしゃあたっく', kind: 'skill', job: 'black_star', mp: 18, target: 'enemies',
    effect: { type: 'phys', mult: 1.55 },
    desc: '会社のみんなで、敵全体に重い一撃。HPが少ないほど強い。', cast: '{a}「今日は、全員出社です！」', anim: 'manin_densha',
  },
  bk_star: {
    name: 'ブラックきぎょうの星', kana: 'ぶらっくきぎょうのほし', kind: 'skill', job: 'black_star', mp: 26, target: 'enemy',
    effect: { type: 'phys', mult: 4.0, ignoreDef: 0.3 },
    desc: '会社のために、すべてをささげた一撃。敵1体にとても大きなダメージ。守りが固い敵にも強い。', cast: '{a}は、ブラックきぎょうの星になった！', anim: 'black_star',
  },

  // ───────────── 天才しせつ管理者（伝説の職業。予兆保全で 大技を 先読みする） ─────────────
  fg_mieruka: {
    name: '見える化', kana: 'みえるか', kind: 'skill', job: 'facility_genius', mp: 3, target: 'enemies', role: 'sup',
    effect: { type: 'scan' },
    desc: '敵全体をセンサーで見える化する。弱点と、効かない属性がすべてわかる（図鑑にものこる）。', cast: '{a}は、すべてを見える化した！', anim: 'mieruka',
  },
  fg_yochou: {
    name: '予兆保全・極', kana: 'よちょうほぜんきわみ', kind: 'skill', job: 'facility_genius', mp: 16, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'def', mult: 1.35, dur: 45 }, { type: 'regen', base: [14, 18], thr: 50, dur: 30 }] },
    desc: 'こわれる前に、すべて手を打つ。仲間全員の守備力が上がり、HPがしばらく少しずつ回復する。', cast: '{a}は、予兆をひとつものがさない！', anim: 'yochou_shield',
  },
  fg_kuuchou: {
    name: '全館空調', kana: 'ぜんかんくうちょう', kind: 'skill', job: 'facility_genius', mp: 22, target: 'allies', role: 'heal', field: true,
    effect: { type: 'multi', parts: [{ type: 'heal', base: [130, 160], thr: 70 }, { type: 'cure', statuses: STATUS_ALL }] },
    desc: '建物じゅうを、いちばん快てきな空気に。仲間全員のHPを大きく回復して、悪いじょうたいも治す。', cast: '{a}は全館の空調を最高のじょうたいにした！', anim: 'aircon',
  },
  fg_demand: {
    name: 'デマンド制御', kana: 'でまんどせいぎょ', kind: 'skill', job: 'facility_genius', mp: 18, target: 'enemies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'atbSet', sub: 45, chance: 0.65, msg: '{t}の動きが、おさえこまれた！', failMsg: '{t}は、むりやり動いている！' }, { type: 'debuff', stat: 'agi', mult: 0.8, dur: 30, chance: 0.7 }] },
    desc: 'ピークをおさえるデマンド制御。敵全体の動きを止めて、素早さも下げる（ボスには効きにくい）。', cast: '{a}「ピークは、おさえさせてもらいます」', anim: 'mieruka',
  },
  fg_hirameki: {
    name: '天才のひらめき', kana: 'てんさいのひらめき', kind: 'skill', job: 'facility_genius', mp: 26, target: 'enemies',
    effect: { type: 'magic', element: 'light', base: [185, 220], thr: 90 },
    desc: '天才的なひらめきが、光になって敵全体をうつ。光のダメージ。', cast: '{a}「ひらめいた！」', anim: 'holy',
  },
  fg_saiteki: {
    name: '最適制御', kana: 'さいてきせいぎょ', kind: 'skill', job: 'facility_genius', mp: 38, target: 'enemies', role: 'dmg',
    effect: { type: 'multi', parts: [{ type: 'magic', element: 'ice', base: [225, 265], thr: 95 }, { type: 'heal', target: 'allies', base: [110, 140], thr: 70 }, { type: 'mpHeal', target: 'allies', base: [8, 12] }] },
    desc: '建物のすべてを天才的に最適化する。敵全体に冷たい風のダメージをあたえ、仲間全員のHPとMPも回復する。', cast: '{a}は建物のすべてを、天才的に最適化した！', anim: 'aircon',
  },

  // ───────────── はかい神（伝説の職業） ─────────────
  hk_hakai: {
    name: 'はかい', kana: 'はかい', kind: 'skill', job: 'hakaishin', mp: 14, target: 'enemy',
    effect: { type: 'destroy', chance: 0.75, bossMult: 2.4 },
    desc: '敵1体を、ちりにして消し去る（たおしたことになる）。ボスとメタルには効かず、かわりに大きなダメージ。', cast: '{a}「はかい！」', anim: 'hakai',
  },
  hk_kimagure: {
    name: '気まぐれ', kana: 'きまぐれ', kind: 'skill', job: 'hakaishin', mp: 4, target: 'self',
    effect: { type: 'random', options: ['hk_k_punch', 'hk_k_hakai', 'hk_k_nap'] },
    desc: '何が起こるかは、はかい神の気分しだい（運しだい）。', cast: '{a}は、気まぐれに動いた…', anim: 'charge',
  },
  hk_k_punch: {
    name: '気まぐれパンチ', kana: 'きまぐれぱんち', kind: 'skill', job: 'hakaishin', mp: 0, target: 'enemy', hidden: true,
    effect: { type: 'phys', mult: 3.2 },
    desc: '気まぐれに、敵1体を思いきりなぐる。', cast: '{a}「なんだか、なぐりたい気分だ」', anim: 'punch',
  },
  hk_k_hakai: {
    name: '気まぐれはかい', kana: 'きまぐれはかい', kind: 'skill', job: 'hakaishin', mp: 0, target: 'enemy', hidden: true,
    effect: { type: 'destroy', chance: 0.75, bossMult: 2.0 },
    desc: '気まぐれに、敵1体を消し去る。', cast: '{a}「…はかいしておこう」', anim: 'hakai',
  },
  hk_k_nap: {
    name: '気まぐれ昼ね', kana: 'きまぐれひるね', kind: 'skill', job: 'hakaishin', mp: 0, target: 'self', hidden: true,
    effect: { type: 'multi', parts: [{ type: 'heal', base: [9999, 9999], fixed: true }, { type: 'status', status: 'sleep', chance: 1, turns: [1, 2] }] },
    desc: '気まぐれに昼ねをする。自分のHPが全回復するが、ねむってしまう。', cast: '{a}「…ねむくなってきた」', anim: 'hirune',
  },
  hk_hirune: {
    name: '昼ね', kana: 'ひるね', kind: 'skill', job: 'hakaishin', mp: 0, target: 'self', role: 'heal', noAuto: true,
    effect: { type: 'multi', parts: [{ type: 'heal', base: [9999, 9999], fixed: true }, { type: 'mpHeal', base: [30, 40] }, { type: 'status', status: 'sleep', chance: 1, turns: [1, 2] }] },
    desc: 'その場で昼ねをする。自分のHPが全回復してMPも回復するが、少しの間ねむってしまう（オートでは使わない）。', cast: '{a}は、ごろりと横になった…', anim: 'hirune',
  },
  hk_kami: {
    name: '神の気', kana: 'かみのき', kind: 'skill', job: 'hakaishin', mp: 16, target: 'enemies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'dispel' }, { type: 'debuff', stat: 'atk', mult: 0.8, dur: 30, chance: 0.75 }] },
    desc: '神の気をはなって、敵全体の強くなる効果を消し、攻撃力も下げる。', cast: '{a}の神の気が、あたりをおおった！', anim: 'maou_dark',
  },
  hk_ikari: {
    name: 'はかい神のいかり', kana: 'はかいしんのいかり', kind: 'skill', job: 'hakaishin', mp: 12, target: 'self', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'mag'], mult: 1.5, dur: 45 },
    desc: 'はかい神が本気でおこる。自分の攻撃力と魔力がとても上がる。', cast: '{a}の体から、むらさきの気がふき上がった！', anim: 'hakai_aura',
  },
  hk_hakaidama: {
    name: 'はかい玉', kana: 'はかいだま', kind: 'skill', job: 'hakaishin', mp: 38, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [255, 295], thr: 95 },
    desc: '太陽のような大きな玉で、敵全体をはかいする。炎のダメージ。', cast: '{a}の指先に、太陽のような玉が生まれた…！', anim: 'hakai_ball',
  },
};
