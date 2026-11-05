// 第66回 E1班の 技: 上級職で 終わっていた 3つの 系統の 先（docs/plan-r66-legend.md の E1班）
//   警察官＋忍者 → 公安ゼロ（超級職）→ トリプルフェイス（伝説）
//   消防士＋パラディン → ハイパーレスキュー（超級職）→ 火消しの神（伝説）
//   人気配信者＋スーパースター → 登録者1000万人（超級職）→ 世界一の配信者（伝説）
//
// 家族の ねがい
// ・トリプルフェイス: 3つの 顔を もつ 警察官（すがたを かえて 敵を 調べ、弱らせる・ボクシングの 速い 攻撃）
// ・火消しの神: 仲間を 助け出す・炎に とても 強い（jobs-r66e1.js の passive.resist）・水で 敵全体を 攻撃
// ・世界一の配信者: 見ている 人の 声えんで 強く なる・コメントの 嵐で 敵全体
// きまりは abilities-jobs10.js・abilities-r41a.js と おなじ
//  ・攻撃技は 2つ いじょう
//  ・みんなに かける 補助は ランクの 上限まで（1つの 強さ 1.4倍。いくつもの 強さは 超級職 1.3倍・伝説 1.35倍）
//  ・Lv10 の 技が いちばん MPを 使う
//  ・看板の 技は <職業の id>_sig（anim も 同じ 名前。エフェクトは client/render/battlefx-r66e1.js）
//  ・自分や 仲間に かける 技の えんしゅつは 前から ある 物（camera・buff・guard・heal2 など）

const STATUS_ALL = ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'];
const WATER = { element: 'water', vsElement: { fire: 1.5 } };
const WATER2 = { element: 'water', vsElement: { fire: 1.6 } };

export const R66E1_ABILITIES = {
  // ───────────── 公安ゼロ（超級職。警察官＋忍者） ─────────────
  kz_jab: {
    name: 'ボクシングの連打', kana: 'ぼくしんぐのれんだ', kind: 'skill', job: 'koan_zero', mp: 6, target: 'enemy',
    effect: { type: 'phys', mult: 0.7, hits: 3 },
    desc: '目にもとまらない速さで、ジャブをつづけて打つ。敵1体に3回ダメージ。', cast: '{a}の、ボクシングの連打！', anim: 'r66e1_jab',
  },
  kz_hensou: {
    name: '変そう調査', kana: 'へんそうちょうさ', kind: 'skill', job: 'koan_zero', mp: 10, target: 'enemies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'scan' }, { type: 'debuff', stat: 'def', mult: 0.8, dur: 40, chance: 0.8 }] },
    desc: 'べつの人にすがたを変えて、敵の中にまぎれこむ。敵全体の弱点がわかり、守備力も下がる。', cast: '{a}は、すがたを変えて敵の中にまぎれこんだ…！', anim: 'r66e1_disguise',
  },
  kz_kakuho: {
    name: 'かくほだ！', kana: 'かくほだ', kind: 'skill', job: 'koan_zero', mp: 9, target: 'enemy',
    effect: { type: 'phys', mult: 1.9, status: { status: 'paralyze', chance: 0.35, turns: [1, 1] } },
    desc: 'すばやく回りこんで、敵1体をおさえこむ。時々、しびれて動けなくなる。', cast: '{a}「かくほだ！」', anim: 'hit',
  },
  kz_chase: {
    name: 'カーチェイス', kana: 'かーちぇいす', kind: 'skill', job: 'koan_zero', mp: 12, target: 'enemies',
    effect: { type: 'phys', mult: 1.3 },
    desc: '白いスポーツカーで、あいてを追いかける。敵全体にダメージ。', cast: '{a}の白いスポーツカーが、うなりを上げて走り出した！', anim: 'r66e1_car',
  },
  kz_step: {
    name: 'みきりのステップ', kana: 'みきりのすてっぷ', kind: 'skill', job: 'koan_zero', mp: 8, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'agi', mult: 1.4, dur: 40 }, { type: 'buff', stat: 'eva', add: 0.25, dur: 25 }] },
    desc: 'ボクシングの足さばきで、軽やかにステップをふむ。自分の素早さが上がり、攻撃をかわしやすくなる。', cast: '{a}は、軽やかにステップをふみ始めた！', anim: 'buff',
  },
  koan_zero_sig: {
    name: 'ゼロの正義ラッシュ', kana: 'ぜろのせいぎらっしゅ', kind: 'skill', job: 'koan_zero', mp: 30, target: 'enemies',
    effect: { type: 'phys', mult: 0.7, hits: 3, ignoreDef: 0.2 },
    desc: '国を守る正義の心を、こぶしにこめた連打。公安ゼロの最強の技。敵全体に3回ずつ当たり、守りの固い敵にも少し効く。', cast: '{a}「この国は、ぼくが守る！」ゼロの正義ラッシュ！', anim: 'koan_zero_sig',
  },

  // ───────────── トリプルフェイス（伝説の職業。公安ゼロ＋ほかの 超級職 1つ） ─────────────
  tf_jab: {
    name: 'いなずまのジャブ', kana: 'いなずまのじゃぶ', kind: 'skill', job: 'triple_face', mp: 10, target: 'enemy',
    effect: { type: 'phys', mult: 0.78, hits: 4, critBonus: 0.1 },
    desc: 'いなずまのような速さのジャブ。敵1体に4回ダメージ。会心も出やすい。', cast: '{a}の、いなずまのジャブ！', anim: 'r66e1_jab',
  },
  tf_tantei: {
    name: '探ていの顔', kana: 'たんていのかお', kind: 'skill', job: 'triple_face', mp: 14, target: 'enemies', role: 'sup',
    effect: {
      type: 'multi',
      parts: [
        { type: 'scan' },
        { type: 'debuff', stat: 'def', mult: 0.75, dur: 45, chance: 0.85 },
        { type: 'debuff', stat: 'atk', mult: 0.8, dur: 45, chance: 0.85 },
      ],
    },
    desc: 'きっさ店の店員の探ていになって、なぞを推理する。敵全体の弱点がわかり、攻撃力と守備力も下がる。', cast: '{a}「なるほど、そういうことか…」', anim: 'r66e1_disguise',
  },
  tf_nazo: {
    name: 'なぞの組織の顔', kana: 'なぞのそしきのかお', kind: 'skill', job: 'triple_face', mp: 16, target: 'enemies', role: 'sup',
    effect: {
      type: 'multi',
      parts: [
        { type: 'status', status: 'confuse', chance: 0.4, turns: [1, 2] },
        { type: 'atbSet', sub: 40, chance: 0.5, msg: '{t}は、なぞめいたほほえみに足を止めた！', failMsg: '{t}は、まどわされなかった！' },
      ],
    },
    desc: 'なぞの組織の一員の顔で、ふしぎにほほえむ。敵全体をこんらんさせ、止まる敵もいる。', cast: '{a}は、なぞめいたほほえみをうかべた…', anim: 'debuff',
  },
  tf_keisatsu: {
    name: '警察官の顔', kana: 'けいさつかんのかお', kind: 'skill', job: 'triple_face', mp: 18, target: 'allies', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.35, dur: 45 },
    desc: '本当のすがたの警察官にもどって、仲間をひきいる。仲間全員の攻撃力と素早さが上がる。', cast: '{a}「みんな、ぼくについてきてくれ！」', anim: 'buff',
  },
  tf_sandwich: {
    name: 'ハムサンドの差し入れ', kana: 'はむさんどのさしいれ', kind: 'skill', job: 'triple_face', mp: 20, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [110, 135], thr: 55 }, { type: 'cure', statuses: STATUS_ALL }] },
    desc: 'きっさ店で人気の、手作りのハムサンドをみんなにくばる。仲間全員のHPを回復して、悪いじょうたいも治す。', cast: '{a}「よかったら、どうぞ。自信作なんだ」', anim: 'heal2',
  },
  tf_drive: {
    name: '白いスポーツカー', kana: 'しろいすぽーつかー', kind: 'skill', job: 'triple_face', mp: 22, target: 'enemies',
    effect: { type: 'phys', mult: 1.6, ignoreDef: 0.25 },
    desc: '白いスポーツカーで、道なき道を走りぬける。敵全体に大ダメージ。守りの固い敵にも少し効く。', cast: '{a}の白いスポーツカーが、ものすごい速さで走りぬけた！', anim: 'r66e1_car',
  },
  triple_face_sig: {
    name: 'トリプル・ジャスティス', kana: 'とりぷるじゃすてぃす', kind: 'skill', job: 'triple_face', mp: 42, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'phys', mult: 0.95, hits: 3, ignoreDef: 0.3 },
        { type: 'debuff', stat: 'def', mult: 0.85, dur: 30, chance: 0.6 },
      ],
    },
    desc: '探てい・なぞの組織・警察官、3つの顔の力を1つにした、トリプルフェイスの最強の技。敵全体に3回ずつ大ダメージ。守りの固い敵にもよく効き、守備力も下がる。', cast: '{a}「3つの顔は、すべてこの国のために！」', anim: 'triple_face_sig',
  },

  // ───────────── ハイパーレスキュー（超級職。消防士＋パラディン） ─────────────
  hr_jet: {
    name: 'ジェット放水', kana: 'じぇっとほうすい', kind: 'skill', job: 'hyper_rescue', mp: 6, target: 'enemy',
    effect: { type: 'phys', mult: 2.3, ...WATER },
    desc: 'いきおいの強い水を、まっすぐにうつ。敵1体に水の大ダメージ。炎の敵によく効く。', cast: '{a}のジェット放水！', anim: 'water',
  },
  hr_kabau: {
    name: 'レスキューのたて', kana: 'れすきゅーのたて', kind: 'skill', job: 'hyper_rescue', mp: 6, target: 'self', role: 'sup',
    effect: { type: 'cover', dur: 25, all: true, defMult: 1.5 },
    desc: '体をはって、仲間全員の前に立つ。仲間への攻撃を自分が引き受け、自分の守備力も上がる。', cast: '{a}「ここは、まかせろ！」', anim: 'guard',
  },
  hr_kyushutsu: {
    name: 'ハイパー救出', kana: 'はいぱーきゅうしゅつ', kind: 'skill', job: 'hyper_rescue', mp: 12, target: 'deadAlly', role: 'heal', field: true,
    effect: { type: 'revive', hpRatio: 0.7 },
    desc: 'どんな所からでも、すばやく助け出す。たおれた仲間1人を、HPを多めにして生き返らせる。', cast: '{a}は、{t}をすばやく助け出した！', anim: 'revive',
  },
  hr_teate: {
    name: 'レスキュー手当て', kana: 'れすきゅーてあて', kind: 'skill', job: 'hyper_rescue', mp: 16, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [75, 95], thr: 50 }, { type: 'cure', statuses: STATUS_ALL }] },
    desc: '救助のプロの、すばやい手当て。仲間全員のHPを回復して、悪いじょうたいも治す。', cast: '{a}は、みんなをてきぱきと手当てした！', anim: 'heal2',
  },
  hr_bouka: {
    name: '防火のかべ', kana: 'ぼうかのかべ', kind: 'skill', job: 'hyper_rescue', mp: 14, target: 'allies', role: 'sup',
    effect: { type: 'buff', stat: 'def', mult: 1.35, dur: 40 },
    desc: '火にも強い、じょうぶなかべを作る。仲間全員の守備力が上がる。', cast: '{a}は、みんなの前に防火のかべを作った！', anim: 'guard',
  },
  hr_suiryu: {
    name: 'うずまき放水', kana: 'うずまきほうすい', kind: 'skill', job: 'hyper_rescue', mp: 16, target: 'enemies',
    effect: { type: 'phys', mult: 1.45, ...WATER },
    desc: 'ホースをぐるりと回して、うずまきの水をはなつ。敵全体に水のダメージ。炎の敵によく効く。', cast: '{a}のうずまき放水！', anim: 'r66e1_wave',
  },
  hyper_rescue_sig: {
    name: 'ハイパーウォーターキャノン', kana: 'はいぱーうぉーたーきゃのん', kind: 'skill', job: 'hyper_rescue', mp: 30, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'phys', mult: 1.9, ...WATER },
        { type: 'heal', target: 'allies', base: [40, 55], thr: 30 },
      ],
    },
    desc: 'とくべつな車の大きなノズルから、ものすごい水をはなつ、ハイパーレスキューの最強の技。敵全体に水の大ダメージ。炎の敵によく効き、水しぶきで仲間全員も少し回復する。', cast: '{a}「全開で、放水始め！」', anim: 'hyper_rescue_sig',
  },

  // ───────────── 火消しの神（伝説の職業。ハイパーレスキュー＋ほかの 超級職 1つ） ─────────────
  hg_matoi: {
    name: 'まといの号令', kana: 'まといのごうれい', kind: 'skill', job: 'hikeshi_god', mp: 14, target: 'allies', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'def'], mult: 1.35, dur: 45 },
    desc: '火消しのしるしの「まとい」を、高くふり回す。仲間全員の攻撃力と守備力が上がる。', cast: '{a}は、まといを高くふり回した！「火消し、ここにあり！」', anim: 'warcry',
  },
  hg_jet: {
    name: '水竜ジェット', kana: 'すいりゅうじぇっと', kind: 'skill', job: 'hikeshi_god', mp: 14, target: 'enemy',
    effect: { type: 'phys', mult: 3.1, ignoreDef: 0.2, ...WATER2 },
    desc: '竜のような形の水が、まっすぐにとびかかる。敵1体に水の大ダメージ。炎の敵にとてもよく効く。', cast: '{a}の水竜ジェット！', anim: 'water',
  },
  hg_kyushutsu: {
    name: '神の救出', kana: 'かみのきゅうしゅつ', kind: 'skill', job: 'hikeshi_god', mp: 20, target: 'deadAlly', role: 'heal', field: true,
    effect: { type: 'revive', hpRatio: 1 },
    desc: '火消しの神さまの大きな手で、そっとすくい上げる。たおれた仲間1人を、元気いっぱいに生き返らせる。', cast: '{a}は、{t}をそっとすくい上げた…！', anim: 'revive',
  },
  hg_tate: {
    name: '火消しの大たて', kana: 'ひけしのおおたて', kind: 'skill', job: 'hikeshi_god', mp: 12, target: 'self', role: 'sup',
    effect: { type: 'cover', dur: 25, all: true, defMult: 1.7 },
    desc: '大きなたてをかまえて、仲間全員の前に立ちはだかる。仲間への攻撃を自分が引き受け、自分の守備力もとても上がる。', cast: '{a}「みんなは、わたしの後ろに！」', anim: 'guard',
  },
  hg_iyashi: {
    name: 'いやしの清水', kana: 'いやしのしみず', kind: 'skill', job: 'hikeshi_god', mp: 24, target: 'allies', role: 'heal',
    effect: {
      type: 'multi',
      parts: [
        { type: 'heal', base: [125, 150], thr: 60 },
        { type: 'cure', statuses: STATUS_ALL },
        { type: 'regen', base: [20, 26], thr: 30, dur: 24 },
      ],
    },
    desc: 'すきとおった、冷たい水をふらせる。仲間全員のHPを大きく回復し、悪いじょうたいも治して、少しずつ回復していく。', cast: '{a}のまわりに、すんだ水がふりそそいだ…', anim: 'heal2',
  },
  hg_suiryu: {
    name: '大水竜', kana: 'だいすいりゅう', kind: 'skill', job: 'hikeshi_god', mp: 22, target: 'enemies',
    effect: { type: 'phys', mult: 1.65, ...WATER2 },
    desc: '大きな水の竜が、うねりながら敵をのみこむ。敵全体に水の大ダメージ。炎の敵にとてもよく効く。', cast: '{a}は、大きな水の竜をよび出した！', anim: 'r66e1_wave',
  },
  hikeshi_god_sig: {
    name: '天の川大放水', kana: 'あまのがわだいほうすい', kind: 'skill', job: 'hikeshi_god', mp: 42, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'phys', mult: 2.6, ignoreDef: 0.25, ...WATER2 },
        { type: 'heal', target: 'allies', base: [60, 80], thr: 40 },
      ],
    },
    desc: '空にかかる天の川の水を、まるごとふらせる、火消しの神の最強の技。敵全体に水の大ダメージ。炎の敵にとてもよく効き、仲間全員のHPも回復する。', cast: '{a}がまといを天にかかげると、天の川があふれ出した…！', anim: 'hikeshi_god_sig',
  },

  // ───────────── 登録者1000万人（超級職。人気配信者＋スーパースター） ─────────────
  ts_live: {
    name: '生配信スタート', kana: 'なまはいしんすたーと', kind: 'skill', job: 'top_streamer', mp: 8, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['mag', 'atk'], mult: 1.4, dur: 45 }, { type: 'mpHeal', base: [3, 5] }] },
    desc: 'カメラの前で、生配信を始める。見ている人の声えんで、自分の魔力と攻撃力が上がり、MPも少し回復する。', cast: '{a}「はい、どうも！今日も始めていきます！」', anim: 'camera',
  },
  ts_buzz: {
    name: '大バズりショート動画', kana: 'だいばずりしょーとどうが', kind: 'skill', job: 'top_streamer', mp: 10, target: 'enemy',
    effect: { type: 'magic', base: [130, 155], thr: 70 },
    desc: '世界中で話題の動画が、敵の前にとび出す。敵1体に大ダメージ。', cast: '{a}の動画が、大バズり！', anim: 'r66e1_comment',
  },
  ts_ouen: {
    name: '声えんチャット', kana: 'せいえんちゃっと', kind: 'skill', job: 'top_streamer', mp: 14, target: 'allies', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'mag'], mult: 1.3, dur: 40 },
    desc: '「がんばれ！」のコメントが、画面いっぱいに流れる。仲間全員の攻撃力と魔力が上がる。', cast: '「がんばれー！」「いけー！」声えんのコメントが止まらない！', anim: 'buff',
  },
  ts_comment: {
    name: 'コメントの嵐', kana: 'こめんとのあらし', kind: 'skill', job: 'top_streamer', mp: 16, target: 'enemies',
    effect: { type: 'multi', parts: [{ type: 'magic', base: [100, 120], thr: 60 }, { type: 'status', status: 'confuse', chance: 0.2, turns: [1, 1] }] },
    desc: '何万ものコメントが、嵐のように流れこむ。敵全体にダメージ。こんらんする敵もいる。', cast: '{a}の配信に、コメントの嵐がおしよせた！', anim: 'r66e1_comment',
  },
  ts_kinen: {
    name: '1000万人記念配信', kana: 'いっせんまんにんきねんはいしん', kind: 'skill', job: 'top_streamer', mp: 20, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [90, 110], thr: 50 }, { type: 'mpHeal', base: [3, 5] }] },
    desc: '登録者1000万人の記念配信。仲間全員のHPを回復し、MPも少し回復する。', cast: '{a}「1000万人、本当にありがとう！」', anim: 'heal_dance',
  },
  top_streamer_sig: {
    name: '同時接続1000万人', kana: 'どうじせつぞくいっせんまんにん', kind: 'skill', job: 'top_streamer', mp: 34, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', base: [150, 180], thr: 85 },
        { type: 'buff', target: 'allies', stats: ['atk', 'mag'], mult: 1.2, dur: 30 },
      ],
    },
    desc: '1000万人がいっしょに見ている！ハートとコメントが光になってふりそそぐ、登録者1000万人の最強の技。敵全体に大ダメージ。仲間全員の攻撃力と魔力も上がる。', cast: '同時接続、1000万人！画面のハートが、光になってふりそそぐ！', anim: 'top_streamer_sig',
  },

  // ───────────── 世界一の配信者（伝説の職業。登録者1000万人＋ほかの 超級職 1つ） ─────────────
  ws_world: {
    name: '世界同時配信', kana: 'せかいどうじはいしん', kind: 'skill', job: 'world_streamer', mp: 10, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['mag', 'atk'], mult: 1.5, dur: 45 }, { type: 'mpHeal', base: [4, 6] }] },
    desc: '世界中に同時に配信を始める。世界中の声えんで、自分の魔力と攻撃力がとても上がり、MPも少し回復する。', cast: '{a}「世界のみんな、こんにちは！」', anim: 'camera',
  },
  ws_honyaku: {
    name: '100か国語のコメント', kana: 'ひゃっかこくごのこめんと', kind: 'skill', job: 'world_streamer', mp: 16, target: 'enemies',
    effect: { type: 'magic', base: [120, 145], thr: 70 },
    desc: '世界中の言葉のコメントが、いっせいに流れこむ。敵全体に大ダメージ。', cast: '世界中から、いろいろな言葉のコメントがとどいた！', anim: 'r66e1_comment',
  },
  ws_ouen: {
    name: '世界中の声えん', kana: 'せかいじゅうのせいえん', kind: 'skill', job: 'world_streamer', mp: 22, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['atk', 'mag'], mult: 1.35, dur: 45 }, { type: 'regen', base: [20, 26], thr: 30, dur: 24 }] },
    desc: '世界中のファンが、声をそろえて声えんする。仲間全員の攻撃力と魔力が上がり、少しずつ回復していく。', cast: '世界中から「がんばれ！」の声がひびく！', anim: 'buff',
  },
  ws_trend: {
    name: '世界トレンド1位', kana: 'せかいとれんどいちい', kind: 'skill', job: 'world_streamer', mp: 16, target: 'enemy',
    effect: { type: 'magic', element: 'light', base: [165, 195], thr: 80 },
    desc: '世界でいちばんの話題が、光になって敵におちる。敵1体に光の大ダメージ。', cast: '{a}の配信が、世界トレンド1位になった！', anim: 'holy',
  },
  ws_offkai: {
    name: 'みんなでオフ会', kana: 'みんなでおふかい', kind: 'skill', job: 'world_streamer', mp: 24, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [125, 150], thr: 60 }, { type: 'cure', statuses: STATUS_ALL }] },
    desc: 'ファンのみんなと会って、楽しくすごす。仲間全員のHPを大きく回復して、悪いじょうたいも治す。', cast: '{a}「今日は来てくれて、ありがとう！」', anim: 'heal_dance',
  },
  ws_dokkiri: {
    name: '世界のドッキリ', kana: 'せかいのどっきり', kind: 'skill', job: 'world_streamer', mp: 18, target: 'enemies', role: 'sup',
    effect: {
      type: 'multi',
      parts: [
        { type: 'atbSet', sub: 50, chance: 0.55, msg: '{t}は、びっくりして動けない！', failMsg: '{t}は、ドッキリを見ぬいた！' },
        { type: 'status', status: 'confuse', chance: 0.3, turns: [1, 2] },
      ],
    },
    desc: '世界中が見ている、大がかりなドッキリをしかける。敵全体をびっくりさせて止め、こんらんする敵もいる（ボスには効きにくい）。', cast: '{a}「ドッキリ、大せいこう！」', anim: 'laugh',
  },
  world_streamer_sig: {
    name: 'コメントの大嵐', kana: 'こめんとのおおあらし', kind: 'skill', job: 'world_streamer', mp: 44, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', base: [230, 270], thr: 95 },
        { type: 'buff', target: 'allies', stats: ['atk', 'mag'], mult: 1.2, dur: 30 },
      ],
    },
    desc: '世界中のコメントとハートが、大きな嵐になってうずをまく、世界一の配信者の最強の技。敵全体に大ダメージ。仲間全員の攻撃力と魔力も上がる。', cast: '{a}「世界のみんな、力をかして！」コメントの大嵐！', anim: 'world_streamer_sig',
  },
};
