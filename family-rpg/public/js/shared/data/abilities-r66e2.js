// 第66回 E2班の 技（data/jobs-r66e2.js。docs/plan-r66-legend.md）
//   プロゲーマー＋魔法戦士 → eスポーツ世界王者 → ゲームの神
//   楽天カードマン＋部長 → 楽天ゴールドカードマン → 楽天ブラックカードマン
//   超能力者＋賢者 → サイキッカー → さいきくすお
// きまりは abilities-r41a.js・abilities-r41b.js と おなじ
//  ・攻撃技は 超級職・伝説 2つ いじょう。Lv10 の 技が いちばん MPを 使う。看板の 技は <職業の id>_sig（敵全体）
//  ・みんなに かける 補助は ランクの 上限まで（1つの 強さは 1.4倍・いくつもの 強さは 超級職 1.3倍・伝説 1.35倍）
// 新しい こうか（shared/battle-r66e2.js）
//  ・savePoint … セーブ（今の みんなの HPを おぼえる）/ loadPoint … ロード（セーブした 時の HPに もどる。たおれた 人も 生き返る）
//  ・cardPoint … 楽天ポイントが たまる（add。cap まで）/ 物理の ptScale … ポイント 1つに つき その ぶん 強く なる
//  ・お金は へらない（ポイントバック points は 楽天カードマンと おなじ。当てた 敵の お金の 一部が もらえる）

const STATUS_ALL = ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'];
// 楽天ポイントの 上限（ゴールド 10・ブラック 15）
const GOLD_CAP = 10, BLACK_CAP = 15;
const pt = (add, cap) => ({ type: 'cardPoint', add, cap, target: 'self' });

export const R66E2_ABILITIES = {
  // ───────────── eスポーツ世界王者（超級職。プロゲーマー＋魔法戦士） ─────────────
  ek_renda: {
    name: '16れんしゃ', kana: 'じゅうろくれんしゃ', kind: 'skill', job: 'esports_king', mp: 10, target: 'enemy',
    effect: { type: 'phys', mult: 0.42, hits: 8 },
    desc: '1びょうに16回、ボタンをおす名人わざ。敵1体に8回攻撃する。', cast: '{a}の指が見えない！カチャカチャカチャ…！', anim: 'r66e2_combo',
  },
  ek_guard: {
    name: 'ガードキャンセル', kana: 'がーどきゃんせる', kind: 'skill', job: 'esports_king', mp: 8, target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 1.7 }, { type: 'buff', stat: 'def', mult: 1.35, dur: 30, target: 'self' }] },
    desc: '守りの構えから、すぐに反げき。敵1体を攻撃して、自分の守備力も上がる。せめながら守るプロのわざ。', cast: '{a}はガードから、すかさず切りかえした！', anim: 'slash_fast',
  },
  ek_mahouken: {
    name: '魔法剣コンボ', kana: 'まほうけんこんぼ', kind: 'skill', job: 'esports_king', mp: 12, target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 0.8, element: 'fire' }, { type: 'phys', mult: 0.8, element: 'ice' }, { type: 'phys', mult: 0.8, element: 'bolt' }] },
    desc: '炎・氷・いなずまの魔法剣を、コンボでつなぐ。敵1体に3回、炎と氷と雷のダメージ。', cast: '{a}「炎！氷！いなずま！コンボだ！」', anim: 'mahouken',
  },
  ek_bunseki: {
    name: 'リプレイ分せき', kana: 'りぷれいぶんせき', kind: 'skill', job: 'esports_king', mp: 10, target: 'enemies',
    effect: { type: 'debuff', stat: 'def', mult: 0.8, dur: 30, chance: 0.75 },
    desc: '前の戦いのリプレイを見て、敵のすきを見つける。敵全体の守備力を下げる。', cast: '{a}「このすき、リプレイで見たよ」', anim: 'debuff',
  },
  ek_voice: {
    name: 'ボイスチャットの作戦', kana: 'ぼいすちゃっとのさくせん', kind: 'skill', job: 'esports_king', mp: 14, target: 'allies', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'mag'], mult: 1.3, dur: 40 },
    desc: 'ヘッドセットで、みんなに作戦を伝える。仲間全員の攻撃力と魔力が上がる。', cast: '{a}「右から行くよ！合わせて！」', anim: 'warcry',
  },
  ek_gauge: {
    name: 'ゲージ全開の必殺技', kana: 'げーじぜんかいのひっさつわざ', kind: 'skill', job: 'esports_king', mp: 16, target: 'enemy',
    effect: { type: 'phys', mult: 3.3, critBonus: 0.15 },
    desc: 'ためておいた必殺技のゲージを、全部使う。敵1体に大ダメージ。会心が出やすい。', cast: '{a}「ゲージ、全開！」', anim: 'slash_heavy',
  },
  esports_king_sig: {
    name: 'ワールドチャンピオンコンボ', kana: 'わーるどちゃんぴおんこんぼ', kind: 'skill', job: 'esports_king', mp: 30, target: 'enemies',
    effect: { type: 'phys', mult: 0.58, hits: 4 },
    desc: '世界大会の決勝で見せた、つながりつづけるコンボ。敵全体に4回ずつ攻撃する。', cast: '{a}「これが、世界一のコンボだ！」', anim: 'esports_king_sig',
  },

  // ───────────── ゲームの神（伝説の職業。eスポーツ世界王者＋ほかの 超級職 1つ） ─────────────
  gg_save: {
    name: 'セーブ', kana: 'せーぶ', kind: 'skill', job: 'game_god', mp: 12, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'regen', base: [16, 20], thr: 30, dur: 24 }, { type: 'savePoint' }] },
    desc: '今のみんなのHPを、セーブして記録する。仲間全員のHPが、しばらく少しずつ回復する。あとでロードすると、セーブした時にもどれる。', cast: '{a}は、冒険の書にセーブした！', anim: 'r66e2_save',
  },
  gg_renda: {
    name: '神の連打', kana: 'かみのれんだ', kind: 'skill', job: 'game_god', mp: 16, target: 'enemy',
    effect: { type: 'phys', mult: 0.32, hits: 10 },
    desc: 'ボタンがこわれないぎりぎりの、神様の連打。敵1体に10回攻撃する。', cast: '{a}の連打！ボタンが光って見える！', anim: 'r66e2_combo',
  },
  gg_load: {
    name: 'ロード', kana: 'ろーど', kind: 'skill', job: 'game_god', mp: 24, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [70, 90], thr: 50 }, { type: 'loadPoint' }] },
    desc: '仲間全員のHPを回復して、セーブした時にもどる。その時よりHPがへっている仲間はその時までもどり、たおれた仲間も生き返る。1回ロードすると、セーブは消える。', cast: '{a}は、セーブしたところからロードした！', anim: 'r66e2_load',
  },
  gg_combo: {
    name: 'むげんコンボ', kana: 'むげんこんぼ', kind: 'skill', job: 'game_god', mp: 22, target: 'enemy',
    effect: {
      type: 'multi',
      parts: [
        { type: 'phys', mult: 0.45, hits: 7 },
        { type: 'atbSet', sub: 40, chance: 0.5, msg: '{t}は、コンボからぬけ出せない！', failMsg: '{t}は、コンボをぬけ出した！' },
      ],
    },
    desc: '終わらないコンボで、敵1体に7回攻撃する。動きが止まることもある（ボスには効きにくい）。', cast: '{a}のコンボが、ずっとつながっていく！', anim: 'r66e2_combo',
  },
  gg_guard: {
    name: 'パーフェクトガード', kana: 'ぱーふぇくとがーど', kind: 'skill', job: 'game_god', mp: 10, target: 'self', role: 'sup',
    effect: { type: 'buff', stats: ['def', 'eva'], mult: 1.5, add: 0.3, dur: 30 },
    desc: '攻撃が来るしゅん間に、ぴったりガードする。自分の守備力が上がり、攻撃をかわしやすくなる。', cast: '{a}「タイミング、ばっちり！」', anim: 'guard',
  },
  gg_command: {
    name: 'うらわざコマンド', kana: 'うらわざこまんど', kind: 'skill', job: 'game_god', mp: 24, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['atk', 'agi'], mult: 1.3, dur: 40 }, { type: 'atbSet', add: 40 }] },
    desc: '上上下下左右左右…ひみつのコマンドを入力する。仲間全員の攻撃力と素早さが上がり、すぐに動けるようになる。', cast: '{a}は、ひみつのコマンドを入力した！', anim: 'warcry',
  },
  gg_pico: {
    name: 'ピコピコ大ばくはつ', kana: 'ぴこぴこだいばくはつ', kind: 'skill', job: 'game_god', mp: 26, target: 'enemies',
    effect: { type: 'phys', mult: 1.55, element: 'blast' },
    desc: 'ドット絵のばくだんを、画面いっぱいにおく。敵全体に爆発のダメージ。', cast: 'ピコピコピコ…ドカーン！', anim: 'blast2',
  },
  game_god_sig: {
    name: 'パーフェクトクリア', kana: 'ぱーふぇくとくりあ', kind: 'skill', job: 'game_god', mp: 42, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'phys', mult: 0.66, hits: 4, ignoreDef: 0.2 },
        { type: 'buff', stat: 'def', mult: 1.3, dur: 40, target: 'allies' },
      ],
    },
    desc: 'ノーミスで、最後のステージまでクリアする、ゲームの神の最強の技。敵全体に4回ずつ攻撃して、仲間全員の守備力も上がる。せめながら守るのだ。', cast: '{a}「ノーミスで、クリアしてみせる！」', anim: 'game_god_sig',
  },

  // ───────────── 楽天ゴールドカードマン（超級職。楽天カードマン＋部長） ─────────────
  gcm_card: {
    name: 'ゴールドカードでシュッ', kana: 'ごーるどかーどでしゅっ', kind: 'skill', job: 'gold_cardman', mp: 6, target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 2.0, ptScale: 0.04 }, pt(1, GOLD_CAP)] },
    desc: '金色のカードを、敵1体にするどく投げる。楽天ポイントが1たまる。ポイントが多いほど強い。', cast: '{a}は金のカードをシュッと投げた！', anim: 'r66e2_card',
  },
  gcm_kaimono: {
    name: 'ポイントでお買い物', kana: 'ぽいんとでおかいもの', kind: 'skill', job: 'gold_cardman', mp: 10, target: 'allies', role: 'heal',
    effect: { type: 'heal', base: [50, 64], thr: 40 },
    desc: 'ためたポイントで、みんなのおやつを買ってくる。仲間全員のHPを回復する。お金はへらない。', cast: '{a}「ポイントで、おやつを買ってきたよ！」', anim: 'coins',
  },
  gcm_bonus: {
    name: 'ボーナスポイント', kana: 'ぼーなすぽいんと', kind: 'skill', job: 'gold_cardman', mp: 8, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'atk', mult: 1.3, dur: 30 }, pt(3, GOLD_CAP)] },
    desc: 'ゴールド会員だけの、ボーナスポイント。自分の攻撃力が上がり、楽天ポイントが3たまる。', cast: '{a}「ボーナスポイント、ゲット！」', anim: 'buff',
  },
  gcm_arashi: {
    name: 'ゴールドカードのあらし', kana: 'ごーるどかーどのあらし', kind: 'skill', job: 'gold_cardman', mp: 14, target: 'enemies',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 0.55, hits: 5, random: true, ptScale: 0.04, points: 0.3 }, pt(1, GOLD_CAP)] },
    desc: '金色のカードを、敵全体にばらまく。カードは敵にランダムで5回当たる。ポイントバックで、敵が持っているお金の一部がもらえる。楽天ポイントが1たまる。', cast: '{a}は金のカードを、ぱあっとばらまいた！', anim: 'r66e2_card',
  },
  gcm_tokuten: {
    name: 'ゴールド会員のとくてん', kana: 'ごーるどかいいんのとくてん', kind: 'skill', job: 'gold_cardman', mp: 16, target: 'allies', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'def'], mult: 1.3, dur: 40 },
    desc: 'ゴールド会員のとくてんを、みんなにも分けてあげる。仲間全員の攻撃力と守備力が上がる。', cast: '{a}「みんなも、ゴールド会員だ！」', anim: 'buff',
  },
  gold_cardman_sig: {
    name: '楽天ゴールドカード！', kana: 'らくてんごーるどかーど', kind: 'skill', job: 'gold_cardman', mp: 30, target: 'enemies',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 1.35, ptScale: 0.05, points: 0.8 }, pt(2, GOLD_CAP)] },
    desc: '金色にかがやくカードで、敵全体を切りつける。楽天ポイントが多いほど強い。ポイントバックで、当てた敵のお金の一部がもらえて、ポイントも2たまる。', cast: '{a}「楽天ゴールドカード！」', anim: 'gold_cardman_sig',
  },

  // ───────────── 楽天ブラックカードマン（伝説の職業。楽天ゴールドカードマン＋ほかの 超級職 1つ） ─────────────
  bcm_card: {
    name: 'ブラックカードでズバッ', kana: 'ぶらっくかーどでずばっ', kind: 'skill', job: 'black_cardman', mp: 12, target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 2.7, ptScale: 0.04 }, pt(1, BLACK_CAP)] },
    desc: '黒いカードで、敵1体をズバッと切る。楽天ポイントが1たまる。ポイントが多いほど強い。', cast: '{a}の黒いカードが、ズバッと光った！', anim: 'r66e2_card',
  },
  bcm_concierge: {
    name: 'コンシェルジュにおまかせ', kana: 'こんしぇるじゅにおまかせ', kind: 'skill', job: 'black_cardman', mp: 22, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [95, 115], thr: 60 }, { type: 'cure', statuses: STATUS_ALL }] },
    desc: 'ブラックカードの、何でも手つだってくれる係の人をよぶ。仲間全員のHPを回復して、悪いじょうたいも治す。', cast: '係の人「何でもおまかせください！」', anim: 'heal2',
  },
  bcm_gobai: {
    name: 'ポイント5倍デー', kana: 'ぽいんとごばいでー', kind: 'skill', job: 'black_cardman', mp: 14, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['atk', 'agi'], mult: 1.35, dur: 30 }, pt(5, BLACK_CAP)] },
    desc: '今日はポイント5倍の日！自分の攻撃力と素早さが上がり、楽天ポイントが5たまる。', cast: '{a}「今日は、ポイント5倍デー！」', anim: 'coins',
  },
  bcm_lounge: {
    name: 'ラウンジでひと休み', kana: 'らうんじでひとやすみ', kind: 'skill', job: 'black_cardman', mp: 18, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'regen', base: [20, 26], thr: 40, dur: 24 }, { type: 'mpHeal', base: [6, 10] }] },
    desc: 'ブラックカードの人だけが入れる、しずかなラウンジでひと休み。仲間全員のMPが回復して、HPもしばらく少しずつ回復する。', cast: '{a}「ちょっと、ラウンジで休んでいこう」', anim: 'heal1',
  },
  bcm_arashi: {
    name: 'ブラックカードの大あらし', kana: 'ぶらっくかーどのおおあらし', kind: 'skill', job: 'black_cardman', mp: 24, target: 'enemies',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 0.8, hits: 6, random: true, ptScale: 0.04, points: 0.4 }, pt(1, BLACK_CAP)] },
    desc: '黒いカードを、うずのようにまき上げて、敵全体にふらせる。カードは敵にランダムで6回当たる。ポイントバックで、敵のお金の一部がもらえる。楽天ポイントが1たまる。', cast: '{a}のまわりで、黒いカードがうずをまいた！', anim: 'r66e2_card',
  },
  bcm_kanshasai: {
    name: 'ポイント大かんしゃ祭', kana: 'ぽいんとだいかんしゃさい', kind: 'skill', job: 'black_cardman', mp: 26, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['atk', 'def'], mult: 1.35, dur: 40 }, { type: 'regen', base: [14, 18], thr: 40, dur: 24 }] },
    desc: 'いつもありがとうの、大かんしゃ祭。仲間全員の攻撃力と守備力が上がり、HPもしばらく少しずつ回復する。', cast: '{a}「みんな、いつもありがとう！大かんしゃ祭だ！」', anim: 'warcry',
  },
  black_cardman_sig: {
    name: '楽天ブラックカード！', kana: 'らくてんぶらっくかーど', kind: 'skill', job: 'black_cardman', mp: 42, target: 'enemies',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 1.7, ptScale: 0.04, points: 1.0, ignoreDef: 0.2 }, pt(2, BLACK_CAP)] },
    desc: '黒くかがやくカードで、敵全体をまとめて切りつける、ブラックカードマンの最強の技。楽天ポイントが多いほど強い。ポイントバックで、当てた敵のお金の一部がもらえて、ポイントも2たまる。', cast: '{a}「楽天ブラックカード！」', anim: 'black_cardman_sig',
  },

  // ───────────── サイキッカー（超級職。超能力者＋賢者） ─────────────
  psy_nenriki: {
    name: 'ちょう念力', kana: 'ちょうねんりき', kind: 'skill', job: 'psychicer', mp: 7, target: 'enemy',
    effect: { type: 'magic', base: [74, 90], thr: 55 },
    desc: 'ものすごい念力で、敵1体をぎゅうっとおしつぶす。', cast: '{a}「むむむむ…はあっ！」', anim: 'r66e2_psy',
  },
  psy_yomu: {
    name: '心を読む', kana: 'こころをよむ', kind: 'skill', job: 'psychicer', mp: 8, target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'magic', base: [40, 50], thr: 40 }, { type: 'yomi', mult: 1.5, chance: 0.7 }] },
    desc: '敵1体の心を読んで、ダメージをあたえる。読まれた敵が次に動こうとすると、先回りして止めて、反げきする（ボスには効きにくい）。', cast: '{a}「…きみが次に何をするか、聞こえるよ」', anim: 'void',
  },
  psy_teleport: {
    name: 'テレポートよけ', kana: 'てれぽーとよけ', kind: 'skill', job: 'psychicer', mp: 6, target: 'self', role: 'sup',
    effect: { type: 'buff', stats: ['agi', 'eva'], mult: 1.3, add: 0.35, dur: 30 },
    desc: '攻撃が当たる前に、しゅん間移動でよける。自分の素早さが上がり、攻撃をかわしやすくなる。', cast: '{a}のすがたが、ふっと消えた！', anim: 'buff',
  },
  psy_iyashi: {
    name: 'いやしの念', kana: 'いやしのねん', kind: 'skill', job: 'psychicer', mp: 12, target: 'allies', role: 'heal',
    effect: { type: 'heal', base: [60, 76], thr: 45 },
    desc: '賢者の呪文と超能力を合わせた、やさしい念をおくる。仲間全員のHPを回復する。', cast: '{a}は目をとじて、みんなに念をおくった…', anim: 'heal2',
  },
  psy_storm: {
    name: 'サイコストーム', kana: 'さいこすとーむ', kind: 'skill', job: 'psychicer', mp: 15, target: 'enemies',
    effect: { type: 'magic', base: [82, 98], thr: 60 },
    desc: '見えない力のあらしで、敵全体をふり回す。', cast: '{a}のまわりで、見えない力がうずをまいた！', anim: 'r66e2_psy',
  },
  psychicer_sig: {
    name: 'サイコキネシス・マックス', kana: 'さいこきねしすまっくす', kind: 'skill', job: 'psychicer', mp: 32, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', base: [150, 176], thr: 85 },
        { type: 'atbSet', sub: 30, chance: 0.35, msg: '{t}は、宙にうかんだまま動けない！', failMsg: '{t}は、念力をふりはらった！' },
      ],
    },
    desc: 'ありったけの念力で、敵全体を空高くもち上げて、地面にたたきつける。動きが止まる敵もいる（ボスには効きにくい）。', cast: '{a}「全部まとめて、うき上がれ！」', anim: 'psychicer_sig',
  },

  // ───────────── さいきくすお（伝説の職業。サイキッカー＋ほかの 超級職 1つ） ─────────────
  ksu_nenriki: {
    name: 'ちょっとだけ念力', kana: 'ちょっとだけねんりき', kind: 'skill', job: 'saiki', mp: 12, target: 'enemy',
    effect: { type: 'magic', base: [130, 155], thr: 70 },
    desc: '力をうんとおさえた、ちょっとだけの念力。それでも、敵1体に大ダメージ。', cast: '{a}「…ちょっとだけ、本当にちょっとだけだ」', anim: 'r66e2_psy',
  },
  ksu_teleport: {
    name: 'しゅん間テレポート', kana: 'しゅんかんてれぽーと', kind: 'skill', job: 'saiki', mp: 10, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'eva', add: 0.35, dur: 30 }, { type: 'atbSet', add: 50 }] },
    desc: '一しゅんで、べつの場所へテレポートする。自分が攻撃をかわしやすくなり、すぐにまた動ける。', cast: '{a}のすがたが消えて、すぐにあらわれた！', anim: 'buff',
  },
  ksu_telepathy: {
    name: 'テレパシー', kana: 'てれぱしー', kind: 'skill', job: 'saiki', mp: 20, target: 'enemies',
    effect: { type: 'multi', parts: [{ type: 'magic', base: [70, 84], thr: 60 }, { type: 'yomi', mult: 1.2, chance: 0.6 }] },
    desc: '敵全体の心の声を、全部聞いてしまう。敵全体にダメージ。読まれた敵が次に動こうとすると、先回りして止めて、反げきする（ボスには効きにくい）。', cast: '{a}「…みんな、考えていることがまる聞こえだ」', anim: 'void',
  },
  ksu_seigyo: {
    name: '制御装置をはずす', kana: 'せいぎょそうちをはずす', kind: 'skill', job: 'saiki', mp: 8, target: 'self', role: 'sup',
    effect: { type: 'buff', stats: ['mag', 'agi'], mult: 1.5, dur: 30 },
    desc: '頭の制御装置を、少しだけはずす。自分の魔力と素早さが大きく上がる。', cast: '{a}は、頭の制御装置にそっと手をのばした…', anim: 'r66e2_limiter',
  },
  ksu_medatanai: {
    name: 'めだたないように', kana: 'めだたないように', kind: 'skill', job: 'saiki', mp: 12, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['def', 'eva'], mult: 1.4, add: 0.3, dur: 30 }, { type: 'regen', base: [22, 28], thr: 50, dur: 24 }] },
    desc: 'ふつうの高校生のふりをして、目立たないようにする。自分の守備力が上がって、攻撃をかわしやすくなり、HPもしばらく少しずつ回復する。', cast: '{a}「…ぼくは、ごくふつうの高校生だ」', anim: 'guard',
  },
  ksu_modosu: {
    name: 'もとどおり', kana: 'もとどおり', kind: 'skill', job: 'saiki', mp: 26, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [130, 155], thr: 70 }, { type: 'cure', statuses: STATUS_ALL }] },
    desc: 'こわれた物を元にもどす超能力で、みんなのキズももとどおり。仲間全員のHPを大きく回復して、悪いじょうたいも治す。', cast: '{a}が手をかざすと、みんなのキズが消えていく…', anim: 'r66e2_load',
  },
  ksu_arashi: {
    name: 'ちょう能力のあらし', kana: 'ちょうのうりょくのあらし', kind: 'skill', job: 'saiki', mp: 22, target: 'enemies',
    effect: { type: 'magic', base: [110, 130], thr: 75 },
    desc: '念力もテレポートも全部まぜた、ちょう能力のあらし。敵全体にダメージ。', cast: '{a}「やれやれ…すぐに終わらせよう」', anim: 'r66e2_psy',
  },
  saiki_sig: {
    name: 'やれやれ、本気の超能力', kana: 'やれやれほんきのちょうのうりょく', kind: 'skill', job: 'saiki', mp: 42, target: 'enemies', spellLike: true,
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', element: 'void', base: [205, 240], thr: 95 },
        { type: 'atbSet', sub: 35, chance: 0.4, msg: '{t}は、時間が止まったように動けない！', failMsg: '{t}は、なんとか動けた！' },
      ],
    },
    desc: '頭の制御装置を全部はずして、本気の超能力を見せる、さいきくすおの最強の技。敵全体に大ダメージ。どんな敵にも効く。動きが止まる敵もいる（ボスには効きにくい）。', cast: '{a}「やれやれ…今回だけ、本気を出す」', anim: 'saiki_sig',
  },
};
