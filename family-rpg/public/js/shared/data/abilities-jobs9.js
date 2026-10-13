// 2026年10月（第33回）の 新しい 職業の 技（11の 職業）
//   手品師 → かいとう → かいとうキッド／魔法学校の生徒 → ハリーポッター／3年B組の担任
//   れん金術師 → 国家れん金術師 → はがねのれん金術師／美少女戦士 → セーラームーン
//
// 家族と きめた こと（docs/plan-r33-jobs.md）: 技・ひらめき・合体技・必殺技は、これまでの 職業と おなじ きまり
// ・名前の 字: 「怪・盗・錬・銃・晶・換・鹿」は 習わない 字なので ひらがな（かいとう・れん金・トランプじゅう・銀水しょう・等価こうかん）
// きまりは abilities-jobs8.js と おなじ
//  ・攻撃技は 基本職 3つ いじょう、上級職・超級職・伝説 2つ いじょう
//  ・みんなに かける 補助は ランクの 上限まで（基本職 1.15倍・上級職 1.25倍・超級職と 伝説 1.4倍。いくつもの 強さは 1.12・1.2・1.3・1.35倍）
//    1人に かける 補助は 基本職 1.3倍・上級職 1.4倍まで。基本職の 補助は 弱め
//  ・Lv10 の 技が いちばん MPを 使う
//  ・看板の 技は <職業の id>_sig。anim は 今 ある 型（絵と えんしゅつの 担当が <職業の id>_sig の エフェクトを 作ったら かえる）
//  ・3年B組の担任は、学校の 職業の 仲間が いると 技が 強く なる（jobs.js の passive.classmates・shared/battle-r33.js）

const STATUS_ALL = ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'];

export const JOB9_ABILITIES = {
  // ───────────── 手品師（基本職） ─────────────
  mg_card: {
    name: 'トランプ投げ', kana: 'とらんぷなげ', kind: 'skill', job: 'magician', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 0.7, hits: 2 },
    desc: '指の間から、トランプを2まいシュッと投げる。敵1体に2回当たる。', cast: '{a}は、トランプをシュッと投げた！', anim: 'r33_card_throw',
  },
  mg_hato: {
    name: 'ハトが出るよ', kana: 'はとがでるよ', kind: 'skill', job: 'magician', mp: 3, target: 'enemies', role: 'sup',
    effect: { type: 'status', status: 'blind', chance: 0.35, turns: [2, 3] },
    desc: 'シルクハットから、ハトがバサバサとび出す。敵全体の目の前が、まぼろしにつつまれることがある。', cast: '{a}がぼうしをとると…ハトがバサバサとび出した！', anim: 'r33_hat_trick',
  },
  mg_hako: {
    name: 'びっくり箱', kana: 'びっくりばこ', kind: 'skill', job: 'magician', mp: 4, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'phys', mult: 0.75 },
        { type: 'atbSet', sub: 25, chance: 0.3, msg: '{t}は、びっくりして動きが止まった！', failMsg: '{t}は、おどろかなかった。' },
      ],
    },
    desc: '小さな箱をあけると、バネのついた人形がとび出す。敵全体に当たり、びっくりして止まる敵もいる。', cast: '{a}は、小さな箱のふたをあけた。ビヨーン！', anim: 'hit_all',
  },
  mg_joshu: {
    name: '助手さん、どうぞ', kana: 'じょしゅさんどうぞ', kind: 'skill', job: 'magician', mp: 3, target: 'ally', role: 'sup',
    effect: { type: 'buff', stat: 'agi', mult: 1.2, dur: 30 },
    desc: '仲間1人を、マジックの助手に選ぶ。はりきった助手の素早さが少し上がる。', cast: '{a}「それでは、助手の{t}さん、どうぞ！」', anim: 'buff',
  },
  mg_ukabu: {
    name: '空中ふゆう', kana: 'くうちゅうふゆう', kind: 'skill', job: 'magician', mp: 5, target: 'enemy',
    effect: { type: 'phys', mult: 1.8 },
    desc: 'タネも仕かけもなく、敵1体をふわりとうかせて、ドスンと落とす。', cast: '{a}がステッキをふると、{t}の体がうき上がった！', anim: 'quake',
  },
  magician_sig: {
    name: 'イリュージョン', kana: 'いりゅーじょん', kind: 'skill', job: 'magician', mp: 12, target: 'enemies',
    effect: { type: 'magic', element: 'light', base: [42, 52], thr: 40 },
    desc: '大きな幕が下りて、上がると…光のハトと紙ふぶき！敵全体に光のダメージ。', cast: '{a}「さあ、世紀の大イリュージョン！」', anim: 'magician_sig',
  },

  // ───────────── かいとう（上級職。手品師＋スパイ） ─────────────
  kt_card: {
    name: 'トランプじゅう', kana: 'とらんぷじゅう', kind: 'skill', job: 'kaito', mp: 4, target: 'enemy',
    effect: { type: 'phys', mult: 0.8, hits: 3 },
    desc: 'トランプをうち出す、ふしぎなピストル。敵1体に3回当たる。', cast: '{a}は、トランプじゅうをかまえた！', anim: 'r33_card_throw',
  },
  kt_yokoku: {
    name: '予告状', kana: 'よこくじょう', kind: 'skill', job: 'kaito', mp: 4, target: 'enemies', role: 'sup',
    effect: { type: 'debuff', stat: 'def', mult: 0.8, dur: 35, chance: 0.8 },
    desc: '「今夜、お宝をいただきに参上します」予告状をとどけて、敵全体をあわてさせる。守備力が下がる。', cast: '{a}は、予告状をひらりと投げた！', anim: 'debuff',
  },
  kt_surikae: {
    name: 'すりかえトリック', kana: 'すりかえとりっく', kind: 'skill', job: 'kaito', mp: 4, target: 'enemy', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'steal', chance: 0.6 }, { type: 'dispel' }] },
    desc: '白い布をかぶせて、パッと取ると…。敵1体の持ち物をぬすんで、強くなった力もにせものとすりかえる。', cast: '{a}「ワン、ツー、スリー！」', anim: 'r33_steal',
  },
  kt_hensou: {
    name: '変装の名人', kana: 'へんそうのめいじん', kind: 'skill', job: 'kaito', mp: 6, target: 'enemies', role: 'sup',
    effect: { type: 'status', status: 'confuse', chance: 0.4, turns: [1, 2] },
    desc: '敵の仲間にそっくりに変装する。だまされた敵全体が、混乱することがある。', cast: '{a}は、あっというまに魔物のすがたに変装した！', anim: 'debuff',
  },
  kt_glider: {
    name: 'ハンググライダー', kana: 'はんぐぐらいだー', kind: 'skill', job: 'kaito', mp: 8, target: 'enemies',
    effect: { type: 'phys', mult: 1.2 },
    desc: '白いハンググライダーで、空から敵全体にとびげり。', cast: '{a}は、白いつばさを広げて空へまい上がった！', anim: 'tackle',
  },
  kaito_sig: {
    name: '予告どおりにいただきます', kana: 'よこくどおりにいただきます', kind: 'skill', job: 'kaito', mp: 14, target: 'enemy',
    effect: { type: 'phys', mult: 3.0, critBonus: 0.1, steal: 0.5 },
    desc: '予告どおりの時間に、目にもとまらぬ早わざ。敵1体に大きなダメージ。持ち物もぬすむ。', cast: '{a}「予告どおり、いただきます」', anim: 'kaito_sig',
  },

  // ───────────── かいとうキッド（超級職。かいとうを きわめる） ─────────────
  kk_hato: {
    name: 'ハトの大群', kana: 'はとのたいぐん', kind: 'skill', job: 'kaito_kid', mp: 8, target: 'enemies',
    effect: { type: 'phys', mult: 1.35, status: { status: 'blind', chance: 0.25, turns: [1, 2] } },
    desc: 'マントの中から、ハトの大群がとび出す。敵全体に当たり、目の前がまぼろしにつつまれる敵もいる。', cast: '{a}がマントを広げると、ハトの大群がとび出した！', anim: 'r33_hat_trick',
  },
  kk_smoke: {
    name: 'けむり玉', kana: 'けむりだま', kind: 'skill', job: 'kaito_kid', mp: 10, target: 'allies', role: 'sup',
    effect: { type: 'buff', stat: 'eva', add: 0.25, dur: 30 },
    desc: 'ポンッとけむり玉をわって、みんなのすがたをかくす。仲間全員が攻撃をかわしやすくなる。', cast: '{a}は、けむり玉を地面にたたきつけた！ポンッ！', anim: 'r33_smoke_flash',
  },
  kk_poker: {
    name: 'ポーカーフェイス', kana: 'ぽーかーふぇいす', kind: 'skill', job: 'kaito_kid', mp: 8, target: 'self', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.35, dur: 40 },
    desc: 'どんな時も、ポーカーフェイスをわすれない。自分の攻撃力と素早さが上がる。', cast: '{a}は、すずしい顔でほほえんだ。', anim: 'charge',
  },
  kk_jewel: {
    name: 'ダイヤのきらめき', kana: 'だいやのきらめき', kind: 'skill', job: 'kaito_kid', mp: 14, target: 'enemies',
    effect: { type: 'magic', element: 'light', base: [88, 108], thr: 60 },
    desc: '月の光に、ぬすんだ大きな宝石をかざす。敵全体に光のダメージ。', cast: '{a}は、大きな宝石を月にかざした…キラッ！', anim: 'holy',
  },
  kk_tsukiyo: {
    name: '月夜のグライダー', kana: 'つきよのぐらいだー', kind: 'skill', job: 'kaito_kid', mp: 14, target: 'enemy',
    effect: { type: 'phys', mult: 2.7, atbAfter: 50 },
    desc: '月を背に、ハンググライダーで急こう下。敵1体に大きなダメージ。すぐまた空へもどるので、早めに次の番が来る。', cast: '{a}は、月を背にして急こう下した！', anim: 'tackle',
  },
  kaito_kid_sig: {
    name: 'トランプじゅうの嵐', kana: 'とらんぷじゅうのあらし', kind: 'skill', job: 'kaito_kid', mp: 26, target: 'enemies',
    effect: { type: 'phys', mult: 0.6, hits: 8, random: true, critBonus: 0.05 },
    desc: 'トランプじゅうを、目にもとまらぬ速さでうちまくる。トランプの嵐が、敵にランダムで8回当たる。', cast: '{a}「レディース・エーン・ジェントルメーン！」', anim: 'kaito_kid_sig',
  },

  // ───────────── 魔法学校の生徒（上級職。小学生＋魔法使い。呪文） ─────────────
  ws_hikari: {
    name: 'ルーモス', kana: 'るーもす', kind: 'spell', job: 'wizard_student', mp: 3, target: 'enemy',
    effect: { type: 'magic', element: 'light', base: [22, 28], thr: 18 },
    desc: 'つえの先に、明るい光をともす呪文。敵1体に光のダメージ。', cast: '{a}「ルーモス！」つえの先が光った！', anim: 'r33_spell_ray',
  },
  ws_uku: {
    name: 'ふわふわ呪文', kana: 'ふわふわじゅもん', kind: 'spell', job: 'wizard_student', mp: 4, target: 'enemy',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', base: [26, 34], thr: 24 },
        { type: 'atbSet', sub: 30, chance: 0.4, msg: '{t}は、ふわふわうかんで動けない！', failMsg: '{t}は、すぐに着地した！' },
      ],
    },
    desc: '物をうかせる呪文の練習。敵1体をうかせて落とす。うかんだまま動けなくなることもある。', cast: '{a}は、つえをひゅっとふって、ポンとたたいた！', anim: 'void',
  },
  ws_kachikachi: {
    name: 'カチコチ呪文', kana: 'かちこちじゅもん', kind: 'spell', job: 'wizard_student', mp: 4, target: 'enemy', role: 'sup',
    effect: { type: 'status', status: 'paralyze', chance: 0.4, turns: [1, 2] },
    desc: '体をぼうのようにかたくする呪文。敵1体が、カチコチになって動けなくなることがある。', cast: '{a}「ペトリフィカス・トタルス！」', anim: 'debuff',
  },
  ws_houki: {
    name: 'ほうきの練習', kana: 'ほうきのれんしゅう', kind: 'skill', job: 'wizard_student', mp: 7, target: 'allies', role: 'sup',
    effect: { type: 'buff', stat: 'agi', mult: 1.2, dur: 35 },
    desc: '「上がれ！」ほうきにまたがって、みんなで空をとぶ練習。仲間全員の素早さが上がる。', cast: '{a}「みんな、ほうきに手をかざして…上がれ！」', anim: 'r33_broom',
  },
  ws_honoo: {
    name: 'インセンディオ', kana: 'いんせんでぃお', kind: 'spell', job: 'wizard_student', mp: 9, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [36, 46], thr: 45 },
    desc: 'つえの先から、ほのおをふき出す呪文。敵全体に炎のダメージ。', cast: '{a}「インセンディオ！」', anim: 'fire_wave',
  },
  wizard_student_sig: {
    name: 'ステューピファイ', kana: 'すてゅーぴふぁい', kind: 'spell', job: 'wizard_student', mp: 14, target: 'enemy',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', base: [105, 125], thr: 65 },
        { type: 'status', status: 'paralyze', chance: 0.35, turns: [1, 2] },
      ],
    },
    desc: 'つえの先から、赤い光線をうつ呪文。敵1体に大きなダメージ。体がしびれて動けなくなることもある。', cast: '{a}「ステューピファイ！」', anim: 'wizard_student_sig',
  },

  // ───────────── ハリーポッター（超級職。魔法学校の生徒を きわめる） ─────────────
  hy_buki: {
    name: 'エクスペリアームス', kana: 'えくすぺりあーむす', kind: 'spell', job: 'harry', mp: 8, target: 'enemy',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', base: [58, 72], thr: 50 },
        { type: 'debuff', stat: 'atk', mult: 0.7, dur: 40, chance: 0.85 },
      ],
    },
    desc: '相手の武器をはじき飛ばす呪文。敵1体にダメージをあたえて、攻撃力を下げる。', cast: '{a}「エクスペリアームス！」', anim: 'r33_disarm',
  },
  hy_houki: {
    name: 'ほうきで急上しょう', kana: 'ほうきできゅうじょうしょう', kind: 'skill', job: 'harry', mp: 8, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'agi', mult: 1.4, dur: 40 }, { type: 'buff', stat: 'eva', add: 0.2, dur: 40 }] },
    desc: '世界一速いほうきで、空高くまい上がる。自分の素早さが上がり、攻撃もかわしやすくなる。', cast: '{a}は、ほうきで空高くまい上がった！', anim: 'r33_broom',
  },
  hy_quidditch: {
    name: 'クィディッチの急こう下', kana: 'くぃでぃっちのきゅうこうか', kind: 'skill', job: 'harry', mp: 10, target: 'enemy',
    effect: { type: 'phys', mult: 2.3, atbAfter: 50 },
    desc: '金のスニッチを追いかけるいきおいで、ほうきごと急こう下。敵1体に大きなダメージ。早めに次の番が来る。', cast: '{a}は、ほうきで急こう下した！', anim: 'tackle',
  },
  hy_kizu: {
    name: 'いなずまのきず', kana: 'いなずまのきず', kind: 'spell', job: 'harry', mp: 16, target: 'enemies',
    effect: { type: 'magic', element: 'bolt', base: [80, 98], thr: 65 },
    desc: 'おでこのいなずまの形のきずが、光ってうずく。敵全体に雷のダメージ。', cast: '{a}のおでこのきずが、まぶしく光った！', anim: 'r33_lightning',
  },
  hy_dumbledore: {
    name: 'ダンブルドア軍団', kana: 'だんぶるどあぐんだん', kind: 'skill', job: 'harry', mp: 16, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['atk', 'def'], mult: 1.25, dur: 40 }, { type: 'mpHeal', base: [3, 5] }] },
    desc: 'ひみつの部屋で、みんなで呪文の練習。仲間全員の攻撃力と守備力が上がり、MPも少し回復する。', cast: '{a}「さあ、みんなで練習だ！」', anim: 'warcry',
  },
  harry_sig: {
    name: '守護の呪文', kana: 'しゅごのじゅもん', kind: 'spell', job: 'harry', mp: 28, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', element: 'light', base: [150, 180], thr: 85 },
        { type: 'heal', target: 'allies', base: [45, 60], thr: 50 },
      ],
    },
    desc: '「エクスペクト・パトローナム！」銀色に光るしかが、かけぬける。敵全体に光の大ダメージ。仲間全員のHPも少し回復する。', cast: '{a}「エクスペクト・パトローナム！」', anim: 'harry_sig',
  },

  // ───────────── 3年B組の担任（伝説の職業。高校生＋地方公務員） ─────────────
  h3_hito: {
    name: '人という字は', kana: 'ひとというじは', kind: 'skill', job: 'homeroom_3b', mp: 14, target: 'allies', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'def'], mult: 1.3, dur: 45 },
    desc: '「人という字は、ささえ合ってできているんです」仲間全員の攻撃力と守備力が上がる。', cast: '{a}「いいですか、人という字は…ささえ合って、できているんです」', anim: 'r33_hito_ji',
  },
  h3_shusseki: {
    name: '出席をとる', kana: 'しゅっせきをとる', kind: 'skill', job: 'homeroom_3b', mp: 12, target: 'enemies', role: 'sup',
    effect: { type: 'atbSet', sub: 40, chance: 0.6, msg: '{t}は、名前をよばれて「はい！」と立ち上がった！', failMsg: '{t}は、返事をしなかった…' },
    desc: '出席ぼを開いて、ひとりずつ名前をよぶ。敵全体が思わず返事をして、動きが止まることがある。', cast: '{a}「では、出席をとります」', anim: 'warcry',
  },
  h3_chalk: {
    name: 'チョーク投げ', kana: 'ちょーくなげ', kind: 'skill', job: 'homeroom_3b', mp: 12, target: 'enemy',
    effect: { type: 'phys', mult: 3.4, critBonus: 0.15 },
    desc: 'ねむっている生徒もとび起きる、ねらいすましたチョーク。敵1体に大きなダメージ。会心が出やすい。', cast: '{a}「こらっ！」チョークがまっすぐ飛んだ！', anim: 'shuriken',
  },
  h3_katei: {
    name: '家庭訪問', kana: 'かていほうもん', kind: 'skill', job: 'homeroom_3b', mp: 20, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [115, 140], thr: 60 }, { type: 'cure', statuses: STATUS_ALL }] },
    desc: 'ひとりひとりの家をたずねて、なやみを聞く。仲間全員のHPを回復して、悪いじょうたいも治す。', cast: '{a}「先生は、いつでも君たちの味方です」', anim: 'heal2',
  },
  h3_taiiku: {
    name: '体育の授業', kana: 'たいいくのじゅぎょう', kind: 'skill', job: 'homeroom_3b', mp: 18, target: 'enemies',
    effect: { type: 'phys', mult: 2.0 },
    desc: '「校庭を10周！」みんなで走って、敵全体をふみこえていく。', cast: '{a}「よーし、校庭を10周だ！」', anim: 'quake',
  },
  homeroom_3b_sig: {
    name: '愛のお説教', kana: 'あいのおせっきょう', kind: 'skill', job: 'homeroom_3b', mp: 36, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', base: [220, 260], thr: 90 },
        { type: 'atbSet', sub: 50, chance: 0.6, msg: '{t}は、正座して話を聞いている…', failMsg: '{t}は、耳をふさいだ！' },
      ],
    },
    desc: '心をこめた、長い長いお説教。敵全体の心にひびく大ダメージ。正座したまま動けなくなる敵もいる。', cast: '{a}「そこに、すわりなさい。いいですか…」', anim: 'homeroom_3b_sig',
  },

  // ───────────── れん金術師（基本職） ─────────────
  al_toge: {
    name: '石のとげ', kana: 'いしのとげ', kind: 'skill', job: 'alchemist', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 },
    desc: '地面に手をついてれん成。とがった石が、敵1体の足元からつき出す。', cast: '{a}が地面に手をつくと、とがった石がつき出した！', anim: 'r33_alchemy_spear',
  },
  al_kabe: {
    name: '土のかべ', kana: 'つちのかべ', kind: 'skill', job: 'alchemist', mp: 4, target: 'allies', role: 'sup',
    effect: { type: 'buff', stat: 'def', mult: 1.12, dur: 30 },
    desc: '地面の土をれん成して、低いかべを作る。仲間全員の守備力が少し上がる。', cast: '{a}の前に、土のかべがもり上がった！', anim: 'r33_alchemy_wall',
  },
  al_bunkai: {
    name: '分解', kana: 'ぶんかい', kind: 'skill', job: 'alchemist', mp: 4, target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 0.9 }, { type: 'debuff', stat: 'def', mult: 0.8, dur: 30, chance: 0.7 }] },
    desc: '敵1体のよろいにふれて、ばらばらに分解する。ダメージをあたえて、守備力を下げる。', cast: '{a}は、{t}にさわって分解した！', anim: 'debuff',
  },
  al_bakuhatsu: {
    name: 'れん成反応', kana: 'れんせいはんのう', kind: 'skill', job: 'alchemist', mp: 6, target: 'enemies',
    effect: { type: 'magic', element: 'blast', base: [22, 30], thr: 28 },
    desc: '空気をれん成して、小さな爆発を起こす。敵全体に爆発のダメージ。', cast: '{a}のまわりで、青いいなずまがはじけた！', anim: 'r33_alchemy',
  },
  al_kusuri: {
    name: '薬のれん成', kana: 'くすりのれんせい', kind: 'skill', job: 'alchemist', mp: 5, target: 'ally', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'regen', base: [10, 14], thr: 25, dur: 24 }, { type: 'cure', statuses: ['poison', 'paralyze'] }] },
    desc: '薬草をれん成して、ゆっくり効く薬を作る。仲間1人のHPがしばらく少しずつ回復して、毒とマヒも治る。', cast: '{a}は、薬草をれん成した！', anim: 'heal1',
  },
  alchemist_sig: {
    name: '石の大男', kana: 'いしのおおおとこ', kind: 'skill', job: 'alchemist', mp: 12, target: 'enemies',
    effect: { type: 'phys', mult: 0.95 },
    desc: '地面から、石の大男をれん成する。大男のうでが、敵全体をなぎはらう。', cast: '{a}が両手をつくと、地面から石の大男が立ち上がった！', anim: 'alchemist_sig',
  },

  // ───────────── 国家れん金術師（上級職。れん金術師を きわめる） ─────────────
  sl_tsuchi: {
    name: '土の大波', kana: 'つちのおおなみ', kind: 'skill', job: 'state_alchemist', mp: 5, target: 'enemies',
    effect: { type: 'phys', mult: 0.85 },
    desc: '地面を大波のようにうねらせて、敵全体をのみこむ。', cast: '{a}がれん成すると、地面が大波のようにうねった！', anim: 'quake',
  },
  sl_gin: {
    name: '銀時計', kana: 'ぎんどけい', kind: 'skill', job: 'state_alchemist', mp: 4, target: 'self', role: 'sup',
    effect: { type: 'buff', stat: 'mag', mult: 1.4, dur: 40 },
    desc: '国家れん金術師のしるし、銀時計をにぎる。れん成の力が高まり、自分の魔力が上がる。', cast: '{a}は、銀時計をぎゅっとにぎった。', anim: 'charge',
  },
  sl_yubi: {
    name: '指ぱっちん', kana: 'ゆびぱっちん', kind: 'skill', job: 'state_alchemist', mp: 6, target: 'enemy',
    effect: { type: 'magic', element: 'fire', base: [58, 72], thr: 40 },
    desc: '手ぶくろの指を、パチンと鳴らす。火花がほのおになって、敵1体に炎のダメージ。', cast: '{a}が指を鳴らした。パチン！', anim: 'fire2',
  },
  sl_toride: {
    name: '石のとりで', kana: 'いしのとりで', kind: 'skill', job: 'state_alchemist', mp: 8, target: 'allies', role: 'sup',
    effect: { type: 'buff', stat: 'def', mult: 1.25, dur: 40 },
    desc: 'まわりの岩をれん成して、石のとりでを作る。仲間全員の守備力が上がる。', cast: '{a}のまわりに、石のとりでがそびえ立った！', anim: 'r33_alchemy_wall',
  },
  sl_hashira: {
    name: '石の柱', kana: 'いしのはしら', kind: 'skill', job: 'state_alchemist', mp: 8, target: 'enemy',
    effect: { type: 'phys', mult: 2.2 },
    desc: '地面から太い石の柱をつき上げて、敵1体を空高くはね上げる。', cast: '{a}の足元から、石の柱がつき上がった！', anim: 'r33_alchemy_spear',
  },
  state_alchemist_sig: {
    name: 'れん成大爆発', kana: 'れんせいだいばくはつ', kind: 'skill', job: 'state_alchemist', mp: 18, target: 'enemies',
    effect: { type: 'magic', element: 'blast', base: [80, 96], thr: 62 },
    desc: '地面にまるいもようをかいて、大きなれん成反応を起こす。敵全体に爆発の大ダメージ。', cast: '{a}は両手で地面にふれた…れん成大爆発！', anim: 'state_alchemist_sig',
  },

  // ───────────── はがねのれん金術師（超級職。国家れん金術師を きわめる） ─────────────
  fm_ude: {
    name: '機械のうで', kana: 'きかいのうで', kind: 'skill', job: 'fullmetal', mp: 7, target: 'enemy',
    effect: { type: 'phys', mult: 2.3, ignoreDef: 0.25 },
    desc: 'はがねの機械のうでで、思い切りなぐる。敵1体に大きなダメージ。守りの固い敵にも効く。', cast: '{a}の、はがねのうでがうなる！', anim: 'r33_mech_arm',
  },
  fm_yaiba: {
    name: 'うでのやいば', kana: 'うでのやいば', kind: 'skill', job: 'fullmetal', mp: 6, target: 'self', role: 'sup',
    effect: { type: 'buff', stat: 'atk', mult: 1.4, dur: 40 },
    desc: '機械のうでを、するどいやいばにれん成する。自分の攻撃力が上がる。', cast: '{a}の機械のうでが、ジャキン！とやいばに変わった！', anim: 'charge',
  },
  fm_kabe: {
    name: 'はがねのかべ', kana: 'はがねのかべ', kind: 'skill', job: 'fullmetal', mp: 10, target: 'allies', role: 'sup',
    effect: { type: 'buff', stats: ['def', 'breath'], mult: 1.3, dur: 40 },
    desc: '地面から、はがねのかべをぐるりとれん成する。仲間全員の守備力が上がり、炎やふぶきの息のダメージが半分になる。', cast: '{a}「みんな、かべのうしろへ！」', anim: 'r33_alchemy_wall',
  },
  fm_koukan: {
    name: '等価こうかん', kana: 'とうかこうかん', kind: 'skill', job: 'fullmetal', mp: 4, target: 'allies', role: 'sup',
    effect: {
      type: 'multi',
      parts: [
        { type: 'hurt', target: 'self', base: [15, 25], msg: '{t}は、代価として体力をはらった…' },
        { type: 'mpHeal', base: [5, 8] },
      ],
    },
    desc: '何かを手に入れるには、同じだけの代価がいる。自分のHPをはらって、仲間全員のMPを回復する。', cast: '{a}「等価こうかんだ！」', anim: 'heal_ring',
  },
  fm_toge: {
    name: 'とげの森', kana: 'とげのもり', kind: 'skill', job: 'fullmetal', mp: 15, target: 'enemies',
    effect: { type: 'phys', mult: 1.5 },
    desc: 'あたり一面の地面から、とげをつき出す。敵全体にダメージ。', cast: '{a}が両手をパン！と合わせた。地面一面に、とげがはえた！', anim: 'r33_alchemy_spear',
  },
  fullmetal_sig: {
    name: '大地のやり', kana: 'だいちのやり', kind: 'skill', job: 'fullmetal', mp: 26, target: 'enemies',
    effect: { type: 'phys', mult: 1.15, hits: 2, ignoreDef: 0.2 },
    desc: '両手を合わせて、大地から何本もの大きなやりをつき出す。敵全体に2回当たる。守りの固い敵にも効く。', cast: '{a}は両手をパン！と合わせて、地面についた！', anim: 'fullmetal_sig',
  },

  // ───────────── 美少女戦士（上級職。中学生＋アイドル） ─────────────
  // 男の子（look.body が 1 で ない）は タキシード仮面ふう: masc の 名前・セリフ・説明・えんしゅつに なる（強さは おなじ。shared/ability-label.js）
  bs_heel: {
    name: 'ハイヒールキック', kana: 'はいひーるきっく', kind: 'skill', job: 'sailor_soldier', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.6 },
    desc: 'くるっと回って、ハイヒールでキック。敵1体にダメージ。', cast: '{a}の、ハイヒールキック！', anim: 'kick',
    masc: { name: 'タキシードキック', kana: 'たきしーどきっく', cast: '{a}の、タキシードキック！', desc: 'えんび服のすそをひるがえして、するどいキック。敵1体にダメージ。' },
  },
  bs_henshin: {
    name: 'メイクアップ！', kana: 'めいくあっぷ', kind: 'skill', job: 'sailor_soldier', mp: 5, target: 'self', role: 'sup',
    effect: { type: 'buff', stats: ['mag', 'def'], mult: 1.35, dur: 40 },
    desc: 'ブローチをかかげて、美少女戦士に変身！自分の魔力と守備力が上がる。', cast: '{a}「メイクアップ！」', anim: 'charge',
    masc: { name: '仮面のしんし', kana: 'かめんのしんし', cast: '{a}は白い仮面をつけた。「仮面のしんし、ただいま参上！」', desc: 'シルクハットと白い仮面で、タキシード仮面に変身！自分の魔力と守備力が上がる。' },
  },
  bs_oshioki: {
    name: '月にかわっておしおきよ！', kana: 'つきにかわっておしおきよ', kind: 'skill', job: 'sailor_soldier', mp: 6, target: 'enemies', role: 'sup',
    effect: {
      type: 'multi',
      parts: [
        { type: 'debuff', stat: 'atk', mult: 0.8, dur: 35, chance: 0.75 },
        { type: 'atbSet', sub: 30, chance: 0.4, msg: '{t}は、決めポーズに見とれている！', failMsg: '{t}は、ポーズを見ていなかった。' },
      ],
    },
    desc: 'びしっと決めポーズ。敵全体の攻撃力が下がり、見とれて止まる敵もいる。', cast: '{a}「愛と正義の美少女戦士！月にかわっておしおきよ！」', anim: 'r33_sailor_beam',
    masc: { name: '月の光が見ているぞ！', kana: 'つきのひかりがみているぞ', cast: '{a}「月の光が見ているぞ！悪さはそこまでだ！」', desc: '月を背に、バラを投げて決めゼリフ。敵全体の攻撃力が下がり、見とれて止まる敵もいる。', anim: 'r33_bara' },
  },
  bs_kizuna: {
    name: '友情のきずな', kana: 'ゆうじょうのきずな', kind: 'skill', job: 'sailor_soldier', mp: 9, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [40, 52], thr: 30 }, { type: 'buff', stat: 'agi', mult: 1.15, dur: 35 }] },
    desc: '手をつないで、心を1つに。仲間全員のHPを回復して、素早さも少し上がる。', cast: '{a}「みんな、力を合わせよう！」', anim: 'heal_dance',
  },
  bs_shabon: {
    name: 'シャボンスプレー', kana: 'しゃぼんすぷれー', kind: 'skill', job: 'sailor_soldier', mp: 9, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', element: 'ice', base: [36, 46], thr: 40 },
        { type: 'status', status: 'blind', chance: 0.3, turns: [1, 2] },
      ],
    },
    desc: 'つめたいシャボンのきりを、あたり一面にふきつける。敵全体に氷のダメージ。きりで目の前が見えなくなる敵もいる。', cast: '{a}「シャボンスプレー！」', anim: 'ice2',
  },
  sailor_soldier_sig: {
    name: 'ムーン・ティアラ・アクション', kana: 'むーんてぃあらあくしょん', kind: 'skill', job: 'sailor_soldier', mp: 16, target: 'enemy',
    effect: { type: 'magic', element: 'light', base: [128, 152], thr: 65 },
    desc: 'ひたいのティアラを、光のわにして投げる。敵1体に光の大ダメージ。', cast: '{a}「ムーン・ティアラ・アクション！」', anim: 'sailor_soldier_sig',
    masc: { name: 'ローズ・ブーメラン', kana: 'ろーずぶーめらん', cast: '{a}「ローズ・ブーメラン！」', desc: '光をまとった赤いバラを、ブーメランのように投げる。敵1体に光の大ダメージ。', anim: 'r33_bara_ring' },
  },

  // ───────────── セーラームーン（超級職。美少女戦士を きわめる） ─────────────
  mn_stick: {
    name: 'ムーンスティック', kana: 'むーんすてぃっく', kind: 'skill', job: 'sailor_moon', mp: 9, target: 'enemy',
    effect: { type: 'magic', element: 'light', base: [62, 76], thr: 50 },
    desc: '三日月のついたスティックから、月の光をうつ。敵1体に光のダメージ。', cast: '{a}は、ムーンスティックをかかげた！', anim: 'r33_sailor_beam',
    masc: { name: 'ステッキさばき', kana: 'すてっきさばき', cast: '{a}は、ステッキをくるりと回した！', desc: '月の光を宿したステッキで、するどく打つ。敵1体に光のダメージ。', anim: 'r33_cane' },
  },
  mn_bara: {
    name: 'タキシード仮面のバラ', kana: 'たきしーどかめんのばら', kind: 'skill', job: 'sailor_moon', mp: 8, target: 'enemy',
    effect: {
      type: 'multi',
      parts: [
        { type: 'phys', mult: 1.6 },
        { type: 'atbSet', sub: 40, chance: 0.55, msg: '{t}は、とつぜんのバラにおどろいた！', failMsg: '{t}は、バラをよけた！' },
      ],
    },
    desc: 'ピンチの時、どこからか赤いバラが飛んでくる。敵1体にささり、おどろいて止まることもある。', cast: 'どこからか、赤いバラが飛んできた！', anim: 'shuriken',
    masc: { name: '赤いバラの一撃', kana: 'あかいばらのいちげき', cast: '{a}は、赤いバラをシュッと投げた！', desc: 'むねにさした赤いバラを、すばやく投げる。敵1体にささり、おどろいて止まることもある。', anim: 'r33_bara' },
  },
  mn_luna: {
    name: 'ルナのはげまし', kana: 'るなのはげまし', kind: 'skill', job: 'sailor_moon', mp: 10, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'mpHeal', base: [4, 6] }, { type: 'buff', stat: 'mag', mult: 1.25, dur: 40 }] },
    desc: 'おでこに三日月のある黒ネコが、みんなをはげます。仲間全員のMPが少し回復して、魔力が上がる。', cast: '黒ネコのルナ「みんな、しっかりして！」', anim: 'buff',
  },
  mn_heal: {
    name: 'ムーン・ヒーリング・エスカレーション', kana: 'むーんひーりんぐえすかれーしょん', kind: 'skill', job: 'sailor_moon', mp: 18, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [95, 120], thr: 60 }, { type: 'cure', statuses: STATUS_ALL }] },
    desc: 'やさしい月の光で、みんなをつつむ。仲間全員のHPを回復して、悪いじょうたいも治す。', cast: '{a}「ムーン・ヒーリング・エスカレーション！」', anim: 'r33_moon_heal',
    masc: { name: 'いやしのバラ', kana: 'いやしのばら', cast: '{a}がバラをかかげると、月の光の花びらがふりそそいだ。', desc: '月の光を受けたバラの花びらで、みんなをつつむ。仲間全員のHPを回復して、悪いじょうたいも治す。' },
  },
  mn_inori: {
    name: '銀水しょうのいのり', kana: 'ぎんずいしょうのいのり', kind: 'skill', job: 'sailor_moon', mp: 18, target: 'deadAlly', role: 'heal',
    effect: { type: 'revive', hpRatio: 0.5 },
    desc: '銀水しょうにいのりをこめる。たおれた仲間1人を生き返らせる。', cast: '{a}は、銀水しょうをむねにいのった…', anim: 'revive',
  },
  sailor_moon_sig: {
    name: 'ムーン・プリンセス・ハレーション', kana: 'むーんぷりんせすはれーしょん', kind: 'skill', job: 'sailor_moon', mp: 32, target: 'enemies',
    effect: { type: 'magic', element: 'light', base: [150, 178], thr: 85 },
    desc: '月のプリンセスの力をときはなつ、月の光の必殺技。敵全体に光の大ダメージ。', cast: '{a}「ムーン・プリンセス・ハレーション！」', anim: 'sailor_moon_sig',
    masc: { name: 'タキシード・ラ・スマッシャー', kana: 'たきしーどらすまっしゃー', cast: '{a}「タキシード・ラ・スマッシャー！」', desc: '月を背に、ステッキから白い光の波をはなつ、月夜の必殺技。敵全体に光の大ダメージ。', anim: 'r33_tux_smash' },
  },
};
