// 学校・公務員・町の みかた・スーパースターの 先の 職業の 技
// （小学生・中学生・高校生／地方公務員・国家公務員・キャリア組／警察官・消防士／フルーツジッパー・アラシ／運転士・京急の運転士）
//
// 書きかたは abilities.js と おなじ。新しい 効き目は ない（いまの 効き目を くみあわせる）
// ねらい: enemy=敵1体 group=敵1グループ enemies=敵全体 ally=仲間1人 allies=仲間全員 self=自分 deadAlly=死んだ仲間1人
// アイドルの 技の 名前は、どれも この ゲームの ための オリジナル

export const JOB2_ABILITIES = {
  // ───────────── 小学生（すばやさ・運・げんき） ─────────────
  es_randoseru: {
    name: 'ランドセルアタック', kana: 'らんどせるあたっく', kind: 'skill', job: 'schoolkid', mp: 1, target: 'enemy',
    effect: { type: 'phys', mult: 1.4, acc: 0.95 },
    desc: 'ランドセルをせおったまま、敵1体に体当たり。教科書がつまっていて重い。', cast: '{a}のランドセルアタック！', anim: 'tackle',
  },
  es_aisatsu: {
    name: '元気なあいさつ', kana: 'げんきなあいさつ', kind: 'skill', job: 'schoolkid', mp: 4, target: 'allies',
    effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.1, dur: 30 },
    desc: '「おはようございます！」大きな声のあいさつで、仲間全員の攻撃力と素早さが少し上がる。', cast: '「おはようございます！」{a}の元気なあいさつがひびきわたった！', anim: 'warcry',
  },
  es_recorder: {
    name: 'リコーダー', kana: 'りこーだー', kind: 'skill', job: 'schoolkid', mp: 3, target: 'group',
    effect: { type: 'status', status: 'sleep', chance: 0.45, turns: [1, 3] },
    desc: 'ピーヒャラ〜♪ちょっぴり音のはずれたリコーダー。同じ種類の敵がねむくなる。', cast: '{a}はリコーダーをふいた！ピーヒャラ〜♪', anim: 'notes',
  },
  es_kyushoku: {
    name: '給食パワー', kana: 'きゅうしょくぱわー', kind: 'skill', job: 'schoolkid', mp: 6, target: 'allies', field: true,
    effect: { type: 'heal', base: [22, 30], thr: 18 },
    desc: '「いただきます！」みんなで給食を食べて、仲間全員のHPを少し回復する。', cast: '「いただきます！」{a}たちは給食をもりもり食べた！', anim: 'heal_dance',
  },
  es_kakekko: {
    name: 'かけっこ', kana: 'かけっこ', kind: 'skill', job: 'schoolkid', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.2, atbAfter: 70 },
    desc: '全力で走って、敵1体に体当たり。すぐに次の順番が回ってくる。', cast: '「よーい、ドン！」{a}は全力で走り出した！', anim: 'tackle',
  },
  es_janken: {
    name: 'じゃんけん', kana: 'じゃんけん', kind: 'skill', job: 'schoolkid', mp: 5, target: 'self',
    effect: { type: 'random', options: ['es_j_gu', 'es_j_choki', 'es_j_pa'] },
    desc: 'グーは敵1体に大ダメージ、チョキは敵に3回切りつけ、パーは仲間全員を回復。何が出るかは運しだい。', cast: '「じゃんけん…ぽん！」', anim: 'dance',
  },
  es_odama: {
    name: '大玉ころがし', kana: 'おおだまころがし', kind: 'skill', job: 'schoolkid', mp: 7, target: 'enemies',
    effect: { type: 'phys', mult: 1.0 },
    desc: '運動会の大玉を力いっぱいころがして、敵全体をまとめてふっとばす。', cast: '{a}は運動会の大玉をころがした！', anim: 'odama',
  },
  es_dodge: {
    name: 'ドッジボール', kana: 'どっじぼーる', kind: 'skill', job: 'schoolkid', mp: 4, target: 'enemy',
    effect: { type: 'phys', mult: 1.8, critBonus: 0.1 },
    desc: 'ボールを思いきり投げつける。敵1体に大きなダメージ。会心が出やすい。', cast: '{a}はボールを思いきり投げた！', anim: 'ball',
  },
  es_yume: {
    name: '将来の夢', kana: 'しょうらいのゆめ', kind: 'skill', job: 'schoolkid', mp: 14, target: 'self',
    effect: { type: 'random', options: ['es_y_hero', 'es_y_doctor', 'es_y_space'] },
    desc: '「大きくなったら、何になる？」夢をさけぶと、すごいことのどれか1つが起こる。どれも強い。', cast: '{a}は将来の夢を大きな声でさけんだ！', anim: 'dance',
  },
  // じゃんけん・将来の夢で 起こる こと（おぼえる 技では ない）
  es_j_gu: {
    name: 'グー', kana: 'ぐー', kind: 'skill', mp: 0, target: 'enemy', hidden: true,
    effect: { type: 'phys', mult: 2.2, critBonus: 0.1 }, desc: '', cast: 'グー！{a}は力いっぱいのげんこつをくり出した！', anim: 'punch',
  },
  es_j_choki: {
    name: 'チョキ', kana: 'ちょき', kind: 'skill', mp: 0, target: 'enemies', hidden: true,
    effect: { type: 'phys', mult: 0.75, hits: 3, random: true }, desc: '', cast: 'チョキ！{a}はチョキチョキと3回切りつけた！', anim: 'slash_multi',
  },
  es_j_pa: {
    name: 'パー', kana: 'ぱー', kind: 'skill', mp: 0, target: 'allies', hidden: true,
    effect: { type: 'heal', base: [40, 55], thr: 20 }, desc: '', cast: 'パー！{a}はみんなとハイタッチした！', anim: 'heal_dance',
  },
  es_y_hero: {
    name: '夢は勇者', kana: 'ゆめはゆうしゃ', kind: 'skill', mp: 0, target: 'enemy', hidden: true,
    effect: { type: 'phys', mult: 3.0, element: 'light', ignoreDef: 0.3 }, desc: '', cast: '「勇者になる！」{a}の手に光の剣があらわれた！', anim: 'strash',
  },
  es_y_doctor: {
    name: '夢はお医者さん', kana: 'ゆめはおいしゃさん', kind: 'skill', mp: 0, target: 'allies', hidden: true,
    effect: { type: 'heal', base: [90, 120], thr: 40 }, desc: '', cast: '「お医者さんになる！」{a}はみんなのキズを手当てした！', anim: 'heal2',
  },
  es_y_space: {
    name: '夢は宇宙飛行士', kana: 'ゆめはうちゅうひこうし', kind: 'skill', mp: 0, target: 'enemies', hidden: true,
    effect: { type: 'magic', element: 'light', base: [70, 95], thr: 30 }, desc: '', cast: '「宇宙飛行士になる！」星のシャワーがふりそそいだ！', anim: 'meteor',
  },

  // ───────────── 中学生（成長する アタッカーと チームプレー） ─────────────
  jh_bukatsu: {
    name: '部活の特訓', kana: 'ぶかつのとっくん', kind: 'skill', job: 'middleschooler', mp: 4, target: 'self',
    effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.3, dur: 35 },
    desc: '放課後の部活で特訓！自分の攻撃力と素早さが上がる。', cast: '{a}は部活の特訓を始めた！「あと10周！」', anim: 'charge',
  },
  jh_test: {
    name: 'テスト勉強', kana: 'てすとべんきょう', kind: 'skill', job: 'middleschooler', mp: 4, target: 'enemy',
    effect: { type: 'debuff', stat: 'def', mult: 0.7, dur: 40, chance: 0.9 },
    desc: 'テストに出るところをさがすように、敵1体をよく調べる。弱いところが分かって、守備力が下がる。', cast: '{a}は{t}のことを、テスト勉強のように調べあげた！', anim: 'debuff',
  },
  jh_hankou: {
    name: '反こう期', kana: 'はんこうき', kind: 'skill', job: 'middleschooler', mp: 7, target: 'enemies',
    effect: { type: 'phys', mult: 0.75, hits: 4, random: true },
    desc: '「うるさいなあ！」手当たりしだいにあばれる。4回、敵にランダムで当たる。', cast: '「うるさいなあ！」{a}は手当たりしだいにあばれ出した！', anim: 'punch_multi',
  },
  jh_gassho: {
    name: '合唱コンクール', kana: 'がっしょうこんくーる', kind: 'skill', job: 'middleschooler', mp: 10, target: 'allies', field: true,
    effect: { type: 'heal', base: [55, 70], thr: 40 },
    desc: 'クラスみんなで声を合わせて歌う。仲間全員のHPを回復する。', cast: '{a}の指揮で、みんなの歌声がひとつになった！', anim: 'heal_dance',
  },
  jh_zenkoku: {
    name: '全国大会', kana: 'ぜんこくたいかい', kind: 'skill', job: 'middleschooler', mp: 14, target: 'enemies',
    effect: { type: 'phys', mult: 1.7 },
    desc: '部活の練習の成果を、全部ぶつける。敵全体に大きなダメージ。', cast: 'ついに全国大会！{a}は練習の成果を出しきった！', anim: 'rock_smash',
  },

  // ───────────── 高校生（青春の オールラウンダー） ─────────────
  hs_seishun: {
    name: '青春アタック', kana: 'せいしゅんあたっく', kind: 'skill', job: 'highschooler', mp: 6, target: 'enemy',
    effect: { type: 'phys', mult: 2.0, critBonus: 0.15, element: 'light' },
    desc: '夕日に向かって走るような、まっすぐな一撃。敵1体に光のダメージ。会心が出やすい。', cast: '「青春だー！」{a}の青春アタック！', anim: 'strash',
  },
  hs_bunkasai: {
    name: '文化祭', kana: 'ぶんかさい', kind: 'skill', job: 'highschooler', mp: 9, target: 'allies',
    effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.3, dur: 40 },
    desc: 'みんなで出し物をもり上げる。仲間全員の攻撃力と素早さが上がる。', cast: '文化祭が始まった！{a}たちのクラスは大にぎわい！', anim: 'stage',
  },
  hs_shuugaku: {
    name: '修学旅行', kana: 'しゅうがくりょこう', kind: 'skill', job: 'highschooler', mp: 10, target: 'enemies',
    effect: { type: 'phys', mult: 0.95, status: { status: 'sleep', chance: 0.35, turns: [1, 2] } },
    desc: '修学旅行の夜は、まくら投げ大会！敵全体にまくらをぶつけて、ねむらせることがある。', cast: '修学旅行の夜だ！{a}のまくら投げ！', anim: 'pillow',
  },
  hs_yuujou: {
    name: '友情パワー', kana: 'ゆうじょうぱわー', kind: 'skill', job: 'highschooler', mp: 14, target: 'allies', field: true,
    effect: { type: 'heal', base: [80, 100], thr: 60 },
    desc: '友だちのきずなが力になる。仲間全員のHPを大きく回復する。', cast: '{a}たちの友情パワーが光りかがやいた！', anim: 'heal2',
  },
  hs_mirai: {
    name: '未来へダッシュ', kana: 'みらいへだっしゅ', kind: 'skill', job: 'highschooler', mp: 20, target: 'enemies',
    effect: { type: 'phys', mult: 2.2, element: 'light' },
    desc: '夢に向かって、全力で走りぬける。敵全体に光の大ダメージ。', cast: '{a}は未来に向かって走り出した！', anim: 'strash',
  },

  // ───────────── 地方公務員（町を 守る ささえ役） ─────────────
  lc_madoguchi: {
    name: '窓口対応', kana: 'まどぐちたいおう', kind: 'skill', job: 'civil_local', mp: 2, target: 'enemy',
    effect: { type: 'atbSet', sub: 50, chance: 0.6, msg: '{t}は番号札を持って待っている…', failMsg: '{t}は順番を待たなかった！' },
    desc: '「番号札をお取りください」敵1体を待たせて、行動ゲージをへらす（ボスには効きにくい）。', cast: '{a}はていねいに窓口対応をした！', anim: 'cards',
  },
  lc_bousai: {
    name: '防災訓練', kana: 'ぼうさいくんれん', kind: 'skill', job: 'civil_local', mp: 5, target: 'allies',
    effect: { type: 'buff', stats: ['def', 'breath'], mult: 1.12, dur: 30 },
    desc: '「おさない、かけない、しゃべらない！」仲間全員の守備力が少し上がり、炎やふぶきの息のダメージが半分になる。', cast: '{a}の防災訓練！「おさない、かけない、しゃべらない！」', anim: 'guard',
  },
  lc_josetsu: {
    name: '除雪作業', kana: 'じょせつさぎょう', kind: 'skill', job: 'civil_local', mp: 4, target: 'group',
    effect: { type: 'phys', mult: 1.1, element: 'ice', status: { status: 'paralyze', chance: 0.2, turns: [1, 1] } },
    desc: 'スコップで雪をどさっ！同じ種類の敵をまとめて氷のダメージ。こおりついて動けなくなることがある。', cast: '{a}はスコップで雪をどさっとかけた！', anim: 'ice2',
  },
  lc_jumin: {
    name: '住民サービス', kana: 'じゅうみんさーびす', kind: 'skill', job: 'civil_local', mp: 3, target: 'ally', field: true,
    effect: { type: 'heal', base: [45, 58], thr: 18 },
    desc: '町のみんなのために、ていねいにお世話する。仲間1人のHPを50ほど回復する。', cast: '{a}は{t}のお世話をした！', anim: 'heal1',
  },
  lc_tsuukou: {
    name: '通行止め', kana: 'つうこうどめ', kind: 'skill', job: 'civil_local', mp: 5, target: 'group',
    effect: { type: 'status', status: 'paralyze', chance: 0.4, turns: [1, 2] },
    desc: '「この先、通行止め！」同じ種類の敵を足止めして、動けなくすることがある。', cast: '{a}は通行止めのかんばんを立てた！', anim: 'debuff',
  },
  lc_yurukyara: {
    name: 'ゆるキャラ', kana: 'ゆるきゃら', kind: 'skill', job: 'civil_local', mp: 6, target: 'enemies',
    effect: { type: 'status', status: 'confuse', chance: 0.35, turns: [1, 3] },
    desc: '町のゆるキャラがおうえんに来る。あまりのかわいさに、敵全体が混乱することがある。', cast: '町のゆるキャラがかけつけた！「がんばるゆる〜」', anim: 'dance',
  },
  lc_takidashi: {
    name: 'たき出し', kana: 'たきだし', kind: 'skill', job: 'civil_local', mp: 8, target: 'allies', field: true,
    effect: { type: 'heal', base: [35, 45], thr: 30 },
    desc: '温かいおにぎりと、とんじるを配る。仲間全員のHPを回復する。', cast: '{a}は温かいおにぎりととんじるを配った！', anim: 'heal_dance',
  },
  lc_shorui: {
    name: '書類の山', kana: 'しょるいのやま', kind: 'skill', job: 'civil_local', mp: 5, target: 'enemy',
    effect: { type: 'phys', mult: 1.9, ignoreDef: 0.2 },
    desc: '山づみの書類を、どさっと落とす。敵1体に大きなダメージ。', cast: '{a}は山づみの書類を{t}の上に落とした！', anim: 'cards',
  },
  lc_machiokoshi: {
    name: '町おこし', kana: 'まちおこし', kind: 'skill', job: 'civil_local', mp: 12, target: 'allies',
    effect: { type: 'buff', stats: ['atk', 'def', 'agi'], mult: 1.12, dur: 30 },
    desc: '町じゅうで大もり上がり！仲間全員の攻撃力・守備力・素早さが少し上がる。', cast: '{a}の町おこし！町じゅうがお祭りさわぎだ！', anim: 'warcry',
  },

  // ───────────── 国家公務員（ルールと 予算で 戦いを ととのえる） ─────────────
  nc_houritsu: {
    name: '法律の力', kana: 'ほうりつのちから', kind: 'skill', job: 'civil_national', mp: 6, target: 'enemies',
    effect: { type: 'status', status: 'silence', chance: 0.55, turns: [3, 5] },
    desc: '「ここで呪文を使うのは、法律で禁止です！」敵全体の呪文をふうじることがある。', cast: '{a}は分厚い法律の本をかかげた！', anim: 'debuff',
  },
  nc_yosan: {
    name: '予算会議', kana: 'よさんかいぎ', kind: 'skill', job: 'civil_national', mp: 0, target: 'allies',
    effect: { type: 'mpHeal', base: [6, 10] },
    desc: '予算を仲間に配る。仲間全員のMPが少し回復する。', cast: '{a}は予算会議を開いた！みんなに予算が配られた！', anim: 'heal1',
  },
  nc_kisha: {
    name: '記者会見', kana: 'きしゃかいけん', kind: 'skill', job: 'civil_national', mp: 6, target: 'enemies',
    effect: { type: 'status', status: 'blind', chance: 0.6, turns: [3, 5] },
    desc: 'カメラのフラッシュがピカピカ！敵全体の目がくらんで、攻撃が外れやすくなる。', cast: '{a}の記者会見！カメラのフラッシュが光る！', anim: 'camera',
  },
  nc_hanko: {
    name: 'ハンコ連打', kana: 'はんこれんだ', kind: 'skill', job: 'civil_national', mp: 6, target: 'enemy',
    effect: { type: 'phys', mult: 0.65, hits: 4 },
    desc: 'ポン、ポン、ポン、ポン！ハンコをすばやくおしまくる。敵1体に4回続けて攻撃。', cast: '{a}のハンコ連打！ポンポンポンポン！', anim: 'stamp',
  },
  nc_project: {
    name: '国家プロジェクト', kana: 'こっかぷろじぇくと', kind: 'skill', job: 'civil_national', mp: 14, target: 'allies',
    effect: { type: 'buff', stats: ['atk', 'def', 'agi'], mult: 1.2, dur: 40 },
    desc: '国をあげての大仕事。仲間全員の攻撃力・守備力・素早さが上がる。', cast: '{a}の国家プロジェクトが動き出した！', anim: 'warcry',
  },

  // ───────────── キャリア組（国を 動かす 司令塔） ─────────────
  cr_seisaku: {
    name: '政策決定', kana: 'せいさくけってい', kind: 'skill', job: 'career', mp: 10, target: 'allies',
    effect: { type: 'buff', stats: ['atk', 'def'], mult: 1.3, dur: 45 },
    desc: '「この方針でいきます！」仲間全員の攻撃力と守備力が上がる。', cast: '「この方針でいきます！」{a}の政策決定！', anim: 'warcry',
  },
  cr_nemawashi: {
    name: '根回し', kana: 'ねまわし', kind: 'skill', job: 'career', mp: 10, target: 'enemies',
    effect: { type: 'debuff', stat: 'atk', mult: 0.7, dur: 40, chance: 0.9 },
    desc: '先に、こっそり話をつけておく。敵全体の攻撃力が下がる。', cast: '{a}は先回りして根回しをしておいた！', anim: 'debuff',
  },
  cr_kiki: {
    name: '危機管理', kana: 'ききかんり', kind: 'skill', job: 'career', mp: 8, target: 'self',
    effect: { type: 'cover', dur: 25, all: true, defMult: 1.6 },
    desc: 'もしもにそなえる。しばらく仲間全員への攻撃を代わりに受け、守備力も大きく上がる。', cast: '「責任は、わたしが取ります！」', anim: 'guard',
  },
  cr_houkaisei: {
    name: '法改正', kana: 'ほうかいせい', kind: 'skill', job: 'career', mp: 12, target: 'enemies',
    effect: { type: 'debuff', stat: 'def', mult: 0.65, dur: 40, chance: 0.9 },
    desc: 'ルールを新しくする。敵全体の守備力が下がる。', cast: '{a}の法改正！ルールが新しくなった！', anim: 'debuff',
  },
  cr_daikaikaku: {
    name: '大改革', kana: 'だいかいかく', kind: 'skill', job: 'career', mp: 24, target: 'enemies',
    effect: { type: 'magic', element: 'blast', base: [140, 170], thr: 80 },
    desc: '古いものを全部ひっくり返す、国の大改革。敵全体を大爆発でふきとばす。', cast: '{a}の大改革！国じゅうがひっくり返る！', anim: 'blast2',
  },

  // ───────────── 警察官（町の 平和を 守る） ─────────────
  po_taiho: {
    name: 'たいほだ！', kana: 'たいほだ', kind: 'skill', job: 'police', mp: 4, target: 'enemy',
    effect: { type: 'status', status: 'paralyze', chance: 0.6, turns: [1, 2] },
    desc: '敵1体にてじょうをかけて、動けなくすることがある。', cast: '「たいほだ！」{a}は{t}にてじょうをかけた！', anim: 'debuff',
  },
  po_shokumu: {
    name: '職務質問', kana: 'しょくむしつもん', kind: 'skill', job: 'police', mp: 3, target: 'enemy',
    effect: { type: 'steal', chance: 0.7 },
    desc: '「ちょっといいですか？」敵1体の持ち物を調べて、あずかる（ぬすむ）。1体から1回だけ。', cast: '「ちょっといいですか？」{a}は{t}に職務質問をした！', anim: 'cards',
  },
  po_koutsuu: {
    name: '交通整理', kana: 'こうつうせいり', kind: 'skill', job: 'police', mp: 6, target: 'allies',
    effect: { type: 'buff', stat: 'agi', mult: 1.25, dur: 40 },
    desc: 'ピピーッ！道がすいすい進めるようになる。仲間全員の素早さが上がる。', cast: 'ピピーッ！{a}は交通整理を始めた！', anim: 'buff',
  },
  po_patocar: {
    name: 'パトカー出動', kana: 'ぱとかーしゅつどう', kind: 'skill', job: 'police', mp: 9, target: 'enemies',
    effect: { type: 'phys', mult: 1.2 },
    desc: 'ウーウー！パトカーが走りぬけて、敵全体にダメージ。', cast: 'ウーウー！パトカーが出動した！', anim: 'siren',
  },
  po_seigi: {
    name: '正義の一撃', kana: 'せいぎのいちげき', kind: 'skill', job: 'police', mp: 12, target: 'enemy',
    effect: { type: 'phys', mult: 2.8, ignoreDef: 0.3, element: 'light' },
    desc: '町の平和を守る、正義の心をこめた一撃。敵1体に光の大ダメージ。', cast: '{a}の正義の一撃！', anim: 'slash_light',
  },

  // ───────────── 消防士（火事と 事故から 町を 守る） ─────────────
  ff_housui: {
    name: '放水', kana: 'ほうすい', kind: 'skill', job: 'firefighter', mp: 3, target: 'group',
    effect: { type: 'phys', mult: 1.15, element: 'ice', vsElement: { fire: 1.5 } },
    desc: 'ホースで水をかける。同じ種類の敵をまとめて水びたしにする。炎の敵によく効く。', cast: '{a}はホースで放水した！', anim: 'water',
  },
  ff_teate: {
    name: '救急手当', kana: 'きゅうきゅうてあて', kind: 'skill', job: 'firefighter', mp: 6, target: 'ally', field: true,
    effect: { type: 'heal', base: [110, 130], thr: 40 },
    desc: 'すばやく手当てをする。仲間1人のHPを120ほど回復する。', cast: '{a}は{t}をすばやく手当てした！', anim: 'heal2',
  },
  ff_kyujo: {
    name: '救助', kana: 'きゅうじょ', kind: 'skill', job: 'firefighter', mp: 10, target: 'deadAlly', field: true,
    effect: { type: 'revive', hpRatio: 0.5 },
    desc: '死んでしまった仲間1人を助け出して、HP半分で生き返らせる。', cast: '{a}は{t}を助け出した！', anim: 'revive',
  },
  ff_hinoyoujin: {
    name: '火の用心', kana: 'ひのようじん', kind: 'skill', job: 'firefighter', mp: 8, target: 'allies',
    effect: { type: 'buff', stat: 'def', mult: 1.25, dur: 40 },
    desc: 'カチ、カチ！火の用心！仲間全員の守備力が上がる。', cast: 'カチ、カチ！「火の用心！」', anim: 'guard',
  },
  ff_issei: {
    name: 'いっせい放水', kana: 'いっせいほうすい', kind: 'skill', job: 'firefighter', mp: 14, target: 'enemies',
    effect: { type: 'phys', mult: 1.7, element: 'ice', vsElement: { fire: 1.5 } },
    desc: '消防車がそろっていっせいに放水！敵全体に大きなダメージ。炎の敵によく効く。', cast: '消防車がかけつけた！{a}たちのいっせい放水！', anim: 'water',
  },

  // ───────────── フルーツジッパー（カラフル・かわいい・ポップ） ─────────────
  fz_juice: {
    name: 'ミックスジュース', kana: 'みっくすじゅーす', kind: 'skill', job: 'fruit_idol', mp: 10, target: 'allies', field: true,
    effect: { type: 'heal', base: [65, 85], thr: 50 },
    desc: 'いろんなフルーツをまぜたジュースでかんぱい！仲間全員のHPを回復する。', cast: '{a}の特製ミックスジュース！「かんぱーい！」', anim: 'heal_dance',
  },
  fz_banana: {
    name: 'バナナのかわ', kana: 'ばななのかわ', kind: 'skill', job: 'fruit_idol', mp: 10, target: 'enemies',
    effect: { type: 'atbSet', sub: 60, chance: 0.6, msg: '{t}はすってんころりん！', failMsg: '{t}はバナナをよけた！' },
    desc: 'バナナのかわをステージにばらまく。敵全体がすべって、行動ゲージがへる（ボスには効きにくい）。', cast: '{a}はバナナのかわをばらまいた！', anim: 'fruits',
  },
  fz_basket: {
    name: 'フルーツバスケット', kana: 'ふるーつばすけっと', kind: 'skill', job: 'fruit_idol', mp: 10, target: 'enemies',
    effect: { type: 'status', status: 'confuse', chance: 0.55, turns: [1, 3] },
    desc: '「フルーツバスケット！」敵全体が席を探して大さわぎ。混乱させることがある。', cast: '「フルーツバスケット！」{a}の声がひびいた！', anim: 'fruits',
  },
  fz_tropical: {
    name: 'トロピカルステージ', kana: 'とろぴかるすてーじ', kind: 'skill', job: 'fruit_idol', mp: 16, target: 'allies',
    effect: { type: 'buff', stats: ['atk', 'def', 'agi'], mult: 1.3, dur: 45 },
    desc: '南の島みたいにカラフルなステージ。仲間全員の攻撃力・守備力・素早さが上がる。', cast: '{a}のトロピカルステージ！色とりどりの光があふれる！', anim: 'stage',
  },
  fz_meteor: {
    name: 'フルーツメテオ', kana: 'ふるーつめてお', kind: 'skill', job: 'fruit_idol', mp: 26, target: 'enemies',
    effect: { type: 'magic', element: 'light', base: [150, 180], thr: 80 },
    desc: '空から色とりどりのフルーツがふってくる。敵全体に光の大ダメージ。', cast: '{a}が空を指さすと、フルーツの流れ星がふってきた！', anim: 'fruits_big',
  },

  // ───────────── アラシ（かっこいい・嵐と 風・5人の ハーモニー） ─────────────
  ar_senpu: {
    name: '旋風ステップ', kana: 'せんぷうすてっぷ', kind: 'skill', job: 'storm_idol', mp: 12, target: 'enemies',
    effect: { type: 'magic', element: 'wind', base: [70, 90], thr: 60 },
    desc: 'キレのあるステップからつむじ風が生まれる。敵全体を風で切りさく。', cast: '{a}の旋風ステップ！つむじ風がまき起こった！', anim: 'storm',
  },
  ar_manazashi: {
    name: 'クールなまなざし', kana: 'くーるなまなざし', kind: 'skill', job: 'storm_idol', mp: 10, target: 'enemies',
    effect: { type: 'status', status: 'paralyze', chance: 0.4, turns: [1, 2] },
    desc: 'ふりむきざまのクールなまなざし。敵全体が見とれて、動けなくなることがある。', cast: '{a}はクールなまなざしを向けた！', anim: 'stage',
  },
  ar_harmony: {
    name: '5人のハーモニー', kana: 'ごにんのはーもにー', kind: 'skill', job: 'storm_idol', mp: 12, target: 'allies', field: true,
    effect: { type: 'heal', base: [80, 100], thr: 60 },
    desc: '5つの声がひとつに重なる、やさしいハーモニー。仲間全員のHPを大きく回復する。', cast: '5つの声が重なって、やさしいハーモニーがひびいた！', anim: 'heal_dance',
  },
  ar_stage: {
    name: '嵐を呼ぶステージ', kana: 'あらしをよぶすてーじ', kind: 'skill', job: 'storm_idol', mp: 12, target: 'allies',
    effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.3, dur: 40 },
    desc: 'ステージが嵐のようにもり上がる。仲間全員の攻撃力と素早さが上がる。', cast: '{a}のステージに、嵐のような声えんがわき起こった！', anim: 'stage',
  },
  ar_live: {
    name: '雷鳴ライブ', kana: 'らいめいらいぶ', kind: 'skill', job: 'storm_idol', mp: 26, target: 'enemies',
    effect: { type: 'magic', element: 'bolt', base: [150, 180], thr: 80 },
    desc: '空が光り、雷鳴とともに最後のライブが始まる。敵全体に雷の大ダメージ。', cast: '空が光った！{a}の雷鳴ライブが始まる！', anim: 'bolt2',
  },

  // ───────────── 運転士（鉄道員の 上級職） ─────────────
  dv_kiteki: {
    name: '警笛', kana: 'けいてき', kind: 'skill', job: 'train_driver', mp: 4, target: 'enemies',
    effect: { type: 'debuff', stat: 'agi', mult: 0.75, dur: 35, chance: 0.8 },
    desc: 'ファーン！大きな警笛で敵全体をおどろかせ、素早さを下げる。', cast: '{a}は警笛を鳴らした！ファーン！', anim: 'horn',
  },
  dv_anzen: {
    name: '安全運転', kana: 'あんぜんうんてん', kind: 'skill', job: 'train_driver', mp: 8, target: 'allies',
    effect: { type: 'buff', stat: 'def', mult: 1.25, dur: 40 },
    desc: '「安全第一！」ていねいな運転で、仲間全員の守備力が上がる。', cast: '「安全第一！」{a}は安全運転を心がけた！', anim: 'buff',
  },
  dv_tsuuka: {
    name: '通過列車', kana: 'つうかれっしゃ', kind: 'skill', job: 'train_driver', mp: 7, target: 'enemy',
    effect: { type: 'phys', mult: 1.9, atbAfter: 60 },
    desc: '駅を通過する列車のように、敵1体にするどく体当たり。すぐに次の順番が回ってくる。', cast: '列車が通過します！{a}がかけぬけた！', anim: 'train',
  },
  dv_renketsu: {
    name: '連結', kana: 'れんけつ', kind: 'skill', job: 'train_driver', mp: 10, target: 'enemies',
    effect: { type: 'phys', mult: 0.95, hits: 4, random: true },
    desc: '車両をつぎつぎつないで体当たり。4回、敵にランダムで当たる。', cast: 'ガッチャン！{a}は車両を連結した！', anim: 'train',
  },
  dv_saikou: {
    name: '最高速度', kana: 'さいこうそくど', kind: 'skill', job: 'train_driver', mp: 15, target: 'enemies',
    effect: { type: 'phys', mult: 1.9, ignoreDef: 0.25 },
    desc: '最高速度で走りぬけ、敵全体をはねとばす。守りの固い敵にもよく効く。', cast: '{a}は最高速度で走りだした！', anim: 'train',
  },

  // ───────────── 京急の運転士（運転士の 超級職） ─────────────
  kq_doremi: {
    name: 'ドレミファ発車', kana: 'どれみふぁはっしゃ', kind: 'skill', job: 'keikyu_driver', mp: 8, target: 'allies',
    effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.3, dur: 40 },
    desc: '「ドレミファソラシド〜♪」歌う電車の音で、仲間全員の攻撃力と素早さが上がる。', cast: '♪ドレミファソラシド〜♪{a}の電車が歌いながら走りだした！', anim: 'notes',
  },
  kq_120: {
    name: '120キロ運転', kana: 'ひゃくにじっきろうんてん', kind: 'skill', job: 'keikyu_driver', mp: 9, target: 'enemy',
    effect: { type: 'phys', mult: 2.4, atbAfter: 80, critBonus: 0.1 },
    desc: 'ものすごい速さで走りぬける一撃。敵1体に大ダメージをあたえ、すぐに次の順番が回ってくる。', cast: 'びゅーん！{a}の120キロ運転！', anim: 'redtrain',
  },
  kq_sentou: {
    name: 'がんじょうな先頭車', kana: 'がんじょうなせんとうしゃ', kind: 'skill', job: 'keikyu_driver', mp: 8, target: 'self',
    effect: { type: 'cover', dur: 25, all: true, defMult: 1.8 },
    desc: '重くてじょうぶな先頭車で前に立ち、仲間全員への攻撃を引き受ける。守備力も上がる。', cast: '{a}はがんじょうな先頭車で、みんなの前に立ちはだかった！', anim: 'guard',
  },
  kq_daiya: {
    name: 'ダイヤ回復', kana: 'だいやかいふく', kind: 'skill', job: 'keikyu_driver', mp: 12, target: 'allies',
    effect: { type: 'atbSet', add: 60, msg: '{t}はおくれを取りもどした！' },
    desc: 'みだれたダイヤを、すばやく立て直す。仲間全員の行動ゲージを大きくためる。', cast: '「おくれを取りもどすぞ！」{a}はダイヤを立て直した！', anim: 'buff',
  },
  kq_kaitoku: {
    name: '赤い快特', kana: 'あかいかいとく', kind: 'skill', job: 'keikyu_driver', mp: 20, target: 'enemies',
    effect: { type: 'phys', mult: 2.4, ignoreDef: 0.3 },
    desc: '赤い電車が、ものすごい速さで駅を通過する。敵全体に大ダメージ。守りの固い敵にもよく効く。', cast: '{a}の赤い快特が、ものすごい速さでかけぬけた！', anim: 'redtrain',
  },
};
