// 新しい 職業の 技（遊び人・会社員・アイドル・鉄道員・プロ野球選手／サムライ・部長・メジャーリーガー／
// ソードマスター・将軍・社長・二刀流スター）と、海賊に ふやした 技
//
// おもしろい 技から 役に立つ 技まで。新しい 効き目:
//   atbSet  … 行動ゲージを かえる（value＝その かずに、add＝たす）。敵なら 行動が おくれる
//   banish  … 敵を 戦いから おいだす（ボスには 効かない。chance＝成功の しやすさ）
//   goldThrow … お金を 投げて 敵全体に ダメージ（お金を 使う）
//   steal   … 敵の 持ち物を ぬすむ（1体に 1回）
//   escape  … かならず 逃げられる（逃げられない 戦いは だめ）
//   phys の nonLethal … たおさずに HP を 1 のこす／steal … こうげきの あとで ぬすむ
//   charge の hpCost … HP を けずって 力を ためる

export const JOB_ABILITIES = {
  // ───────────── 遊び人 ─────────────
  js_asobu: {
    name: '遊ぶ', kana: 'あそぶ', kind: 'skill', job: 'jester', mp: 0, target: 'self',
    effect: { type: 'random', options: ['js_p_otedama', 'js_p_hirune', 'js_p_shiritori', 'js_p_dance', 'js_p_ishikeri', 'js_p_hirameki'] },
    desc: '思いっきり遊ぶ。何が起こるかはお楽しみ。たまにすごいことが起きる。', cast: '{a}は遊び始めた！', anim: 'dance',
  },
  js_gag: {
    name: 'ギャグ', kana: 'ぎゃぐ', kind: 'skill', job: 'jester', mp: 3, target: 'group',
    effect: { type: 'atbSet', value: 0, msg: '{t}は笑いころげている！' },
    desc: 'とっておきのギャグ。敵のグループが笑いころげて、行動がおくれる。', cast: '{a}はとっておきのギャグを言った！', anim: 'laugh',
  },
  js_lucky: {
    name: '運だめし', kana: 'うんだめし', kind: 'skill', job: 'jester', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 3.0, acc: 0.5, critBonus: 0.15 },
    desc: '一か八かの大ぶり。当たればとても大きいが、半分は外れる。', cast: '{a}は運にまかせて飛びかかった！', anim: 'slash_heavy',
  },
  js_neru: {
    name: 'ねる', kana: 'ねる', kind: 'skill', job: 'jester', mp: 0, target: 'self',
    effect: { type: 'heal', base: [60, 80], thr: 20 },
    desc: 'その場でぐうぐうねて、HPを大きく回復する。', cast: '{a}はその場でねてしまった！ぐうぐう…', anim: 'heal1',
  },
  js_kuchibue: {
    name: '口笛', kana: 'くちぶえ', kind: 'skill', job: 'jester', mp: 2, target: 'allies',
    effect: { type: 'cure', statuses: ['sleep', 'confuse'] },
    desc: 'ピーッと口笛をふいて、仲間のねむりと混乱をさます。', cast: '{a}は大きな音で口笛をふいた！', anim: 'buff',
  },
  js_bakuten: {
    name: 'バク転', kana: 'ばくてん', kind: 'skill', job: 'jester', mp: 3, target: 'self',
    effect: { type: 'buff', stats: ['eva', 'agi'], add: 0.25, mult: 1.3, dur: 30 },
    desc: 'くるくるバク転。自分の素早さと、身のかわしやすさが上がる。', cast: '{a}はくるくるとバク転した！', anim: 'buff',
  },
  js_kusuguri: {
    name: 'くすぐり', kana: 'くすぐり', kind: 'skill', job: 'jester', mp: 4, target: 'enemy',
    effect: { type: 'status', status: 'confuse', chance: 0.65, turns: [1, 3] },
    desc: 'こちょこちょくすぐって、敵1体を混乱させる。', cast: '{a}は{t}をこちょこちょくすぐった！', anim: 'laugh',
  },
  js_darts: {
    name: 'ダーツ', kana: 'だーつ', kind: 'skill', job: 'jester', mp: 5, target: 'enemies',
    effect: { type: 'phys', mult: 0.8, hits: 3, random: true, critBonus: 0.1 },
    desc: 'ダーツを3本、敵にめがけて投げる。どこに当たるかは運しだい。', cast: '{a}はダーツを投げた！', anim: 'shuriken',
  },
  js_miracle: {
    name: '超ラッキー', kana: 'ちょうらっきー', kind: 'skill', job: 'jester', mp: 12, target: 'self',
    effect: { type: 'random', options: ['js_m_heal', 'js_m_star', 'js_m_power', 'js_m_bond'] },
    desc: '遊びの天才の大ひらめき。すごいことのどれか1つが起こる。', cast: '{a}の頭に、すごい遊びがひらめいた！', anim: 'meteor',
  },
  // 遊ぶ・超ラッキーで 起こる こと（おぼえる 技では ない）
  js_p_otedama: {
    name: 'お手玉', kana: 'おてだま', kind: 'skill', mp: 0, target: 'self', hidden: true,
    effect: { type: 'nothing' }, desc: '', cast: '{a}はお手玉をして遊んでいる。', anim: 'none',
  },
  js_p_hirune: {
    name: 'ひるね', kana: 'ひるね', kind: 'skill', mp: 0, target: 'self', hidden: true,
    effect: { type: 'heal', base: [10, 20], thr: 99 }, desc: '', cast: '{a}はひるねを始めた…', anim: 'heal1',
  },
  js_p_shiritori: {
    name: 'しりとり', kana: 'しりとり', kind: 'skill', mp: 0, target: 'self', hidden: true,
    effect: { type: 'nothing' }, desc: '', cast: '{a}は一人しりとりをしている。「リンゴ…ゴリラ…ラッパ…」', anim: 'none',
  },
  js_p_dance: {
    name: '楽しいおどり', kana: 'たのしいおどり', kind: 'skill', mp: 0, target: 'allies', hidden: true,
    effect: { type: 'buff', stat: 'agi', mult: 1.15, dur: 20 }, desc: '', cast: '{a}の楽しいおどり！みんなも楽しくなってきた！', anim: 'dance',
  },
  js_p_ishikeri: {
    name: '石けり', kana: 'いしけり', kind: 'skill', mp: 0, target: 'enemy', hidden: true,
    effect: { type: 'phys', mult: 1.3 }, desc: '', cast: '{a}がけった石が、{t}に当たった！', anim: 'kick',
  },
  js_p_hirameki: {
    name: 'ひらめき', kana: 'ひらめき', kind: 'skill', mp: 0, target: 'enemies', hidden: true,
    effect: { type: 'magic', element: 'light', base: [30, 45], thr: 20 }, desc: '', cast: '{a}は遊びの中ですごい技をひらめいた！', anim: 'meteor',
  },
  js_m_heal: {
    name: 'みんなで大わらい', kana: 'みんなでおおわらい', kind: 'skill', mp: 0, target: 'allies', hidden: true,
    effect: { type: 'heal', base: [90, 120], thr: 40 }, desc: '', cast: 'みんなで大わらい！仲間全員が元気いっぱいになった！', anim: 'heal2',
  },
  js_m_star: {
    name: '流れ星', kana: 'ながれぼし', kind: 'skill', mp: 0, target: 'enemies', hidden: true,
    effect: { type: 'magic', element: 'light', base: [80, 110], thr: 30 }, desc: '', cast: '空から流れ星がふってきた！', anim: 'meteor',
  },
  js_m_power: {
    name: '本気モード', kana: 'ほんきもーど', kind: 'skill', mp: 0, target: 'allies', hidden: true,
    effect: { type: 'buff', stats: ['atk', 'def', 'agi'], mult: 1.3, dur: 40 }, desc: '', cast: '{a}の本気モード！みんなの力がみなぎる！', anim: 'warcry',
  },
  js_m_bond: {
    name: 'なかよしの輪', kana: 'なかよしのわ', kind: 'skill', mp: 0, target: 'self', hidden: true,
    effect: { type: 'bondUp', amount: 30 }, desc: '', cast: 'みんなで手をつないで輪になった！', anim: 'heal_dance',
  },

  // ───────────── 会社員 ─────────────
  sm_meishi: {
    name: 'めいしわたし', kana: 'めいしわたし', kind: 'skill', job: 'salaryman', mp: 2, target: 'enemy',
    effect: { type: 'debuff', stat: 'def', mult: 0.75, dur: 30, chance: 0.9 },
    desc: 'ていねいにめいしを差し出す。相手はゆだんして、守備力が下がる。', cast: '{a}はめいしを差し出した！「いつもお世話になっております」', anim: 'cards',
  },
  sm_horenso: {
    name: '報連相', kana: 'ほうれんそう', kind: 'skill', job: 'salaryman', mp: 5, target: 'allies',
    effect: { type: 'buff', stats: ['atk', 'def'], mult: 1.15, dur: 35 },
    desc: 'ほうこく・れんらく・そうだん。チームワークで、仲間全員の攻撃力と守備力が少し上がる。', cast: '{a}のほうこく・れんらく・そうだん！チームの息がぴったり合った！', anim: 'buff',
  },
  sm_zangyo: {
    name: '残業', kana: 'ざんぎょう', kind: 'skill', job: 'salaryman', mp: 0, target: 'self',
    effect: { type: 'charge', mult: 2.5, hpCost: 0.1 },
    desc: '体をけずってがんばる。HPが少し減るが、次の攻撃が2.5倍になる。', cast: '{a}は残業を始めた…「今日中に終わらせる！」', anim: 'charge',
  },
  sm_coffee: {
    name: 'コーヒーブレイク', kana: 'こーひーぶれいく', kind: 'skill', job: 'salaryman', mp: 0, target: 'self',
    effect: { type: 'mpHeal', base: [8, 12] },
    desc: 'ほっと一息。自分のMPが少し回復する。', cast: '{a}はコーヒーを一口飲んだ。ほっ…', anim: 'heal1',
  },
  sm_teiji: {
    name: '定時ダッシュ', kana: 'ていじだっしゅ', kind: 'skill', job: 'salaryman', mp: 3, target: 'self',
    effect: { type: 'escape' },
    desc: '定時になった！かならず戦いから逃げられる（逃げられない戦いはだめ）。', cast: '「お先に失礼します！」{a}は定時ダッシュをきめた！', anim: 'none',
  },
  sm_present: {
    name: 'プレゼン', kana: 'ぷれぜん', kind: 'skill', job: 'salaryman', mp: 6, target: 'enemies',
    effect: { type: 'status', status: 'sleep', chance: 0.45, turns: [1, 3] },
    desc: '長い長いプレゼン。敵全体がねむくなる。', cast: '{a}のとても長いプレゼン！', anim: 'sleep',
  },
  sm_nomikai: {
    name: '飲み会', kana: 'のみかい', kind: 'skill', job: 'salaryman', mp: 8, target: 'allies',
    effect: { type: 'heal', base: [35, 45], thr: 30 },
    desc: 'みんなでかんぱい！仲間全員のHPが回復する。（中身はジュースです）', cast: '「かんぱーい！」{a}たちは楽しく飲み会をした！', anim: 'heal_dance',
  },
  sm_eigyo: {
    name: '飛びこみ営業', kana: 'とびこみえいぎょう', kind: 'skill', job: 'salaryman', mp: 4, target: 'enemy',
    effect: { type: 'phys', mult: 1.8, acc: 0.9 },
    desc: 'アポなしで飛びこむ体当たり。', cast: '{a}の飛びこみ営業！「ごあいさつにうかがいました！」', anim: 'tackle',
  },
  sm_bonus: {
    name: 'ボーナス支給', kana: 'ぼーなすしきゅう', kind: 'skill', job: 'salaryman', mp: 12, target: 'allies',
    effect: { type: 'buff', stats: ['atk', 'def', 'agi'], mult: 1.2, dur: 40 },
    desc: '待ちに待ったボーナス！仲間全員の攻撃力・守備力・素早さが上がる。', cast: 'ボーナスが出た！みんなのやる気が大きく上がった！', anim: 'warcry',
  },

  // ───────────── アイドル ─────────────
  id_kiss: {
    name: '投げキッス', kana: 'なげきっす', kind: 'skill', job: 'idol', mp: 3, target: 'enemy',
    effect: { type: 'status', status: 'confuse', chance: 0.6, turns: [1, 3] },
    desc: '敵1体をメロメロにして混乱させる。', cast: '{a}の投げキッス！{t}はメロメロになった？', anim: 'hearts',
  },
  id_fansa: {
    name: 'ファンサ', kana: 'ふぁんさ', kind: 'skill', job: 'idol', mp: 3, target: 'ally', field: true,
    effect: { type: 'heal', base: [26, 36], thr: 12 },
    desc: 'ファンサービス。仲間1人のHPを回復する。', cast: '{a}は{t}に手をふった！', anim: 'heal1',
  },
  id_wink: {
    name: 'ウインク', kana: 'ういんく', kind: 'skill', job: 'idol', mp: 2, target: 'enemy',
    effect: { type: 'atbSet', value: 0, msg: '{t}はドキッとして動けなくなった！' },
    desc: 'ドキッとさせて、敵1体の行動をおくらせる。', cast: '{a}はパチッとウインクした！', anim: 'hearts',
  },
  id_hightouch: {
    name: 'ハイタッチ会', kana: 'はいたっちかい', kind: 'skill', job: 'idol', mp: 6, target: 'allies', field: true,
    effect: { type: 'heal', base: [20, 28], thr: 20 },
    desc: 'みんなとハイタッチ！仲間全員のHPを少し回復する。', cast: '{a}のハイタッチ会！みんな笑顔になった！', anim: 'heal_dance',
  },
  id_center: {
    name: 'センター', kana: 'せんたー', kind: 'skill', job: 'idol', mp: 5, target: 'self',
    effect: { type: 'cover', all: true, dur: 20, defMult: 1.4 },
    desc: 'ステージのまん中に立って、仲間全員への攻撃を代わりに受ける。守備力も上がる。', cast: '{a}がセンターに立った！', anim: 'guard',
  },
  id_penlight: {
    name: 'ペンライトの海', kana: 'ぺんらいとのうみ', kind: 'skill', job: 'idol', mp: 7, target: 'allies',
    effect: { type: 'buff', stat: 'atk', mult: 1.25, dur: 40 },
    desc: 'ペンライトの光の海。仲間全員の攻撃力が上がる。', cast: 'ペンライトの光が一面に広がった！', anim: 'dance',
  },
  id_encore: {
    name: 'もう1曲', kana: 'もういっきょく', kind: 'skill', job: 'idol', mp: 8, target: 'allies',
    effect: { type: 'atbSet', add: 50, msg: '{t}はすぐに動けそうだ！' },
    desc: 'アンコールにこたえて、もう1曲！仲間全員の行動ゲージを半分ためる。', cast: '「アンコール！アンコール！」{a}はもう1曲歌った！', anim: 'dance',
  },
  id_kami: {
    name: '神対応', kana: 'かみたいおう', kind: 'skill', job: 'idol', mp: 10, target: 'ally', field: true,
    effect: { type: 'heal', base: [130, 160], thr: 40 },
    desc: 'やさしさ100点満点。仲間1人のHPを大きく回復する。', cast: '{a}の神対応！{t}は感動した！', anim: 'heal2',
  },
  id_senkyo: {
    name: '総選挙', kana: 'そうせんきょ', kind: 'skill', job: 'idol', mp: 16, target: 'self',
    effect: { type: 'random', options: ['id_s_heal', 'id_s_power', 'id_s_star'] },
    desc: 'ファンの投票で、起こることが決まる。どれも強い。', cast: '総選挙の結果発表！', anim: 'dance',
  },
  id_s_heal: {
    name: '1位：みんなで元気', kana: 'みんなでげんき', kind: 'skill', mp: 0, target: 'allies', hidden: true,
    effect: { type: 'heal', base: [90, 120], thr: 40 }, desc: '', cast: '1位は「みんなで元気」！仲間全員が回復した！', anim: 'heal2',
  },
  id_s_power: {
    name: '1位：本気のステージ', kana: 'ほんきのすてーじ', kind: 'skill', mp: 0, target: 'allies', hidden: true,
    effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.3, dur: 40 }, desc: '', cast: '1位は「本気のステージ」！みんなの力と素早さが上がった！', anim: 'warcry',
  },
  id_s_star: {
    name: '1位：スターライト', kana: 'すたーらいと', kind: 'skill', mp: 0, target: 'enemies', hidden: true,
    effect: { type: 'magic', element: 'light', base: [70, 95], thr: 30 }, desc: '', cast: '1位は「スターライト」！光のシャワーがふりそそいだ！', anim: 'meteor',
  },

  // ───────────── 鉄道員 ─────────────
  rw_yubisashi: {
    name: '指さし確認', kana: 'ゆびさしかくにん', kind: 'skill', job: 'railman', mp: 0, target: 'self',
    effect: { type: 'charge', mult: 1.5 },
    desc: '「ヨシ！」次の攻撃の威力が1.5倍になる。', cast: '{a}は指をさして確認した！「前方、ヨシ！」', anim: 'charge',
  },
  rw_shuppatsu: {
    name: '出発進行', kana: 'しゅっぱつしんこう', kind: 'skill', job: 'railman', mp: 4, target: 'allies',
    effect: { type: 'buff', stat: 'agi', mult: 1.3, dur: 40 },
    desc: '「出発進行！」仲間全員の素早さが上がる。', cast: '「出発進行！」{a}の声がひびいた！', anim: 'buff',
  },
  rw_announce: {
    name: '車内アナウンス', kana: 'しゃないあなうんす', kind: 'skill', job: 'railman', mp: 3, target: 'allies',
    effect: { type: 'cure', statuses: ['sleep', 'confuse', 'paralyze'] },
    desc: 'はっきりしたアナウンスで、仲間のねむり・混乱・マヒを治す。', cast: '「次は、戦いの場、戦いの場です」', anim: 'buff',
  },
  rw_manin: {
    name: '満員電車', kana: 'まんいんでんしゃ', kind: 'skill', job: 'railman', mp: 5, target: 'enemies',
    effect: { type: 'phys', mult: 0.9, status: { status: 'paralyze', chance: 0.3, turns: [1, 2] } },
    desc: '敵全体をぎゅうぎゅうにおしこむ。身動きがとれなくなることがある。', cast: '満員電車だ！ぎゅうぎゅうおしこまれる！', anim: 'train',
  },
  rw_brake: {
    name: '非常ブレーキ', kana: 'ひじょうぶれーき', kind: 'skill', job: 'railman', mp: 5, target: 'group',
    effect: { type: 'atbSet', value: 0, msg: '{t}は急に止まった！' },
    desc: 'キキーッ！敵のグループの行動ゲージを0にもどす。', cast: 'キキーッ！{a}は非常ブレーキをかけた！', anim: 'quake',
  },
  rw_teikoku: {
    name: '定刻運転', kana: 'ていこくうんてん', kind: 'skill', job: 'railman', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.2, atbAfter: 70 },
    desc: '時間どおりの正確な一撃。すぐに次の順番が回ってくる。', cast: '{a}は時間ぴったりに攻撃した！', anim: 'tackle',
  },
  rw_kaisou: {
    name: '回送電車', kana: 'かいそうでんしゃ', kind: 'skill', job: 'railman', mp: 7, target: 'enemy',
    effect: { type: 'banish', chance: 0.55, msg: '{t}は回送電車に乗せられて、どこかへ行ってしまった！', failMsg: '{t}は電車に乗らなかった！' },
    desc: '「この電車は回送です」敵1体を戦いからおいだす。ボスには効かない。経験値はもらえない。', cast: '回送電車がやってきた！', anim: 'wind2',
  },
  rw_shinkansen: {
    name: '新幹線アタック', kana: 'しんかんせんあたっく', kind: 'skill', job: 'railman', mp: 8, target: 'enemy',
    effect: { type: 'phys', mult: 2.1, ignoreDef: 0.3 },
    desc: '新幹線のようなものすごい体当たり。守りの固い敵にもよく効く。', cast: 'びゅーん！{a}の新幹線アタック！', anim: 'train',
  },
  rw_shuuden: {
    name: '終電', kana: 'しゅうでん', kind: 'skill', job: 'railman', mp: 14, target: 'enemies',
    effect: { type: 'phys', mult: 1.7 },
    desc: '「乗りおくれるな！」最終電車が敵全体をはねとばす。', cast: '最終電車が、ものすごいいきおいで走ってきた！', anim: 'train',
  },

  // ───────────── プロ野球選手 ─────────────
  bb_hit: {
    name: 'ヒット', kana: 'ひっと', kind: 'skill', job: 'ballplayer', mp: 1, target: 'enemy', weapon: 'bat',
    effect: { type: 'phys', mult: 1.35, acc: 1.05 },
    desc: 'しっかりミートする、確実な一打。', cast: 'カキーン！{a}のヒット！', anim: 'bat_swing',
  },
  bb_bunt: {
    name: 'バント', kana: 'ばんと', kind: 'skill', job: 'ballplayer', mp: 0, target: 'enemy', weapon: 'bat',
    effect: { type: 'phys', mult: 0.7, atbAfter: 60 },
    desc: 'コツンと当てる小さな一打。すぐに次の順番が回ってくる。', cast: 'コツン。{a}のバント！', anim: 'hit',
  },
  bb_fastball: {
    name: 'ごう速球', kana: 'ごうそっきゅう', kind: 'skill', job: 'ballplayer', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.5, critBonus: 0.15, ignoreDef: 0.2 },
    desc: 'ズバッとものすごい速さの球を投げつける。会心が出やすい。', cast: '{a}のごう速球！', anim: 'ball',
  },
  bb_tourui: {
    name: 'とうるい', kana: 'とうるい', kind: 'skill', job: 'ballplayer', mp: 3, target: 'enemy',
    effect: { type: 'steal', chance: 0.65 },
    desc: 'すきをついて走り、敵の持ち物をぬすむ。1体から1回だけ。', cast: '{a}はとうるいをしかけた！', anim: 'slash_fast',
  },
  bb_ouenka: {
    name: 'おうえん歌', kana: 'おうえんか', kind: 'skill', job: 'ballplayer', mp: 5, target: 'allies',
    effect: { type: 'buff', stat: 'atk', mult: 1.25, dur: 40 },
    desc: 'ファンのおうえん歌がひびく。仲間全員の攻撃力が上がる。', cast: 'スタンドから、おうえん歌が聞こえてきた！', anim: 'dance',
  },
  bb_headslide: {
    name: 'ヘッドスライディング', kana: 'へっどすらいでぃんぐ', kind: 'skill', job: 'ballplayer', mp: 4, target: 'enemy',
    effect: { type: 'phys', mult: 2.0, recoil: 0.1 },
    desc: '頭から飛びこむ体当たり。自分も少しダメージを受ける。', cast: '{a}のヘッドスライディング！', anim: 'tackle',
  },
  bb_homerun: {
    name: 'ホームラン', kana: 'ほーむらん', kind: 'skill', job: 'ballplayer', mp: 6, target: 'enemy', weapon: 'bat',
    effect: { type: 'phys', mult: 4.2, acc: 0.4, critBonus: 0.1 },
    desc: 'かっとばせー！当たればものすごいが、からぶりしやすい。', cast: '{a}はフルスイングした！', anim: 'bat_swing',
  },
  bb_keien: {
    name: '敬遠', kana: 'けいえん', kind: 'skill', job: 'ballplayer', mp: 3, target: 'enemy',
    effect: { type: 'atbSet', value: 0, msg: '{t}は勝負をさけられた！' },
    desc: '勝負をさける。敵1体の行動ゲージを0にもどす。', cast: '{a}は{t}を敬遠した！', anim: 'none',
  },
  bb_sayonara: {
    name: 'サヨナラ打', kana: 'さよならだ', kind: 'skill', job: 'ballplayer', mp: 12, target: 'enemies', weapon: 'bat',
    effect: { type: 'phys', mult: 1.6 },
    desc: '試合を決める一打。敵全体をまとめてかっとばす。', cast: 'カキーン！{a}のサヨナラ打！', anim: 'bat_swing',
  },

  // ───────────── サムライ ─────────────
  sa_iai: {
    name: '居合斬り', kana: 'いあいぎり', kind: 'skill', job: 'samurai', mp: 3, target: 'enemy', weapon: 'blade',
    effect: { type: 'phys', mult: 1.5, critBonus: 0.35 },
    desc: '目にもとまらぬ一太刀。会心の一撃がとても出やすい。', cast: '{a}の居合斬り！', anim: 'slash_fast', sword: true,
  },
  sa_mineuchi: {
    name: 'みね打ち', kana: 'みねうち', kind: 'skill', job: 'samurai', mp: 2, target: 'enemy', weapon: 'blade',
    effect: { type: 'phys', mult: 1.6, nonLethal: true },
    desc: '刀のみねで打つ。強いが、敵をたおさずにHPを1のこす。', cast: '{a}のみね打ち！', anim: 'slash_heavy', sword: true,
  },
  sa_tsubame: {
    name: 'つばめ返し', kana: 'つばめがえし', kind: 'skill', job: 'samurai', mp: 6, target: 'enemy', weapon: 'blade',
    effect: { type: 'phys', mult: 1.1, hits: 2 },
    desc: 'つばめのように返す刀で、2回続けて斬る。', cast: '{a}のつばめ返し！', anim: 'slash_multi', sword: true,
  },
  sa_zeni: {
    name: 'ぜに投げ', kana: 'ぜになげ', kind: 'skill', job: 'samurai', mp: 0, target: 'enemies',
    effect: { type: 'goldThrow', base: 50, perLv: 10, mult: 1 },
    desc: 'お金を投げつけて、敵全体に投げたお金と同じダメージ。お金（50＋レベル×10ゴールド）を使う。', cast: '{a}は小判をばらまいた！', anim: 'coins',
  },
  sa_ittou: {
    name: '一刀両断', kana: 'いっとうりょうだん', kind: 'skill', job: 'samurai', mp: 12, target: 'enemy', weapon: 'blade',
    effect: { type: 'phys', mult: 3.0, acc: 0.9, ignoreDef: 0.3 },
    desc: '心をこめた、いのちがけの一太刀。敵1体に大ダメージ。', cast: '{a}の一刀両断！', anim: 'cross_slash', sword: true,
  },

  // ───────────── 部長 ─────────────
  bc_kaigi: {
    name: '会議招集', kana: 'かいぎしょうしゅう', kind: 'skill', job: 'bucho', mp: 6, target: 'enemies',
    effect: { type: 'status', status: 'sleep', chance: 0.6, turns: [1, 3] },
    desc: 'とても長い会議をひらく。敵全体がねむくなる。', cast: '{a}は会議を招集した！「ではまず前回のふりかえりから…」', anim: 'sleep',
  },
  bc_kessai: {
    name: '決さい', kana: 'けっさい', kind: 'skill', job: 'bucho', mp: 7, target: 'allies',
    effect: { type: 'buff', stat: 'atk', mult: 1.3, dur: 40 },
    desc: 'ハンコをポン！GOサインで仲間全員の攻撃力が上がる。', cast: '{a}はハンコをポンとおした！「GOだ！」', anim: 'buff',
  },
  bc_homeru: {
    name: '部下をほめる', kana: 'ぶかをほめる', kind: 'skill', job: 'bucho', mp: 4, target: 'ally',
    effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.4, dur: 40 },
    desc: '「よくやった！」仲間1人の攻撃力と素早さが大きく上がる。', cast: '{a}は{t}をほめた！「よくやったな！」', anim: 'buff',
  },
  bc_idou: {
    name: '異動命令', kana: 'いどうめいれい', kind: 'skill', job: 'bucho', mp: 8, target: 'enemy',
    effect: { type: 'banish', chance: 0.6, msg: '{t}は遠くの支店に異動になった！', failMsg: '{t}は異動をことわった！' },
    desc: '敵1体を遠くの支店へ異動させ、戦いからおいだす。ボスには効かない。経験値はもらえない。', cast: '{a}の異動命令！', anim: 'wind2',
  },
  bc_modoshi: {
    name: '差しもどし', kana: 'さしもどし', kind: 'skill', job: 'bucho', mp: 12, target: 'enemies',
    effect: { type: 'atbSet', value: 0, msg: '{t}はやり直しになった！' },
    desc: '「全部やり直し！」敵全体の行動ゲージを0にもどす。', cast: '「全部やり直し！」{a}は書類を差しもどした！', anim: 'quake',
  },

  // ───────────── メジャーリーガー ─────────────
  ml_160: {
    name: '160キロの速球', kana: 'ひゃくろくじっきろのそっきゅう', kind: 'skill', job: 'major_leaguer', mp: 5, target: 'enemy',
    effect: { type: 'phys', mult: 2.0, ignoreDef: 0.4, critBonus: 0.1 },
    desc: 'うなりを上げる160キロの球。守りの固い敵にもよく効く。', cast: '{a}の160キロの速球！', anim: 'ball',
  },
  ml_sweeper: {
    name: 'スイーパー', kana: 'すいーぱー', kind: 'skill', job: 'major_leaguer', mp: 6, target: 'group',
    effect: { type: 'phys', mult: 1.25 },
    desc: '大きく曲がる球が、敵のグループをまとめてなぎはらう。', cast: '{a}のスイーパー！球が大きく曲がった！', anim: 'wind2',
  },
  ml_challenge: {
    name: 'チャレンジ', kana: 'ちゃれんじ', kind: 'skill', job: 'major_leaguer', mp: 10, target: 'deadAlly',
    effect: { type: 'revive', hpRatio: 0.5 },
    desc: 'ビデオ判定をもとめる。判定がくつがえって、仲間1人が生き返る。', cast: '{a}はチャレンジをもとめた！判定がくつがえった！', anim: 'revive',
  },
  ml_grandslam: {
    name: 'グランドスラム', kana: 'ぐらんどすらむ', kind: 'skill', job: 'major_leaguer', mp: 12, target: 'enemies', weapon: 'bat',
    effect: { type: 'phys', mult: 1.3, hits: 4, random: true },
    desc: '満るいのホームラン！4回、敵にランダムで当たる。', cast: 'カキーン！{a}のグランドスラム！', anim: 'bat_swing',
  },
  ml_worldseries: {
    name: 'ワールドシリーズ', kana: 'わーるどしりーず', kind: 'skill', job: 'major_leaguer', mp: 14, target: 'allies',
    effect: { type: 'buff', stats: ['atk', 'def', 'agi'], mult: 1.25, dur: 40 },
    desc: '世界一をかけた大ぶたい。仲間全員の攻撃力・守備力・素早さが上がる。', cast: 'ワールドシリーズが始まった！みんなの力がみなぎる！', anim: 'warcry',
  },

  // ───────────── ソードマスター ─────────────
  swm_seiken: {
    name: '聖剣・光明斬', kana: 'せいけん・こうみょうざん', kind: 'skill', job: 'sword_master', mp: 6, target: 'enemy', weapon: 'blade',
    effect: { type: 'phys', mult: 2.0, element: 'light', vsRace: { undead: 1.5, demon: 1.2 } },
    desc: '聖なる光の剣。光に弱い敵やアンデッドに特によく効く。', cast: '{a}の聖剣・光明斬！', anim: 'strash', sword: true,
  },
  swm_haken: {
    name: '破剣・よろいくだき', kana: 'はけん・よろいくだき', kind: 'skill', job: 'sword_master', mp: 6, target: 'enemy', weapon: 'blade',
    effect: { type: 'phys', mult: 1.7, debuff: { stat: 'def', mult: 0.6, dur: 40, chance: 1 } },
    desc: '敵のよろいごと打ちくだく剣。守備力を大きく下げる。', cast: '{a}の破剣・よろいくだき！', anim: 'gigabreak', sword: true,
  },
  swm_ankoku: {
    name: '暗黒剣・命吸い', kana: 'あんこくけん・いのちすい', kind: 'skill', job: 'sword_master', mp: 8, target: 'enemy', weapon: 'blade',
    effect: { type: 'drainHp', mult: 2.0 },
    desc: '闇の剣で斬り、あたえたダメージの半分だけ自分のHPを回復する。', cast: '{a}の暗黒剣・命吸い！', anim: 'dark_slash', sword: true,
  },
  swm_raijin: {
    name: '雷神一閃', kana: 'らいじんいっせん', kind: 'skill', job: 'sword_master', mp: 12, target: 'enemies', weapon: 'blade',
    effect: { type: 'phys', mult: 1.8, element: 'bolt' },
    desc: '雷をまとった一閃が、敵全体をつらぬく。', cast: '{a}の雷神一閃！', anim: 'bolt2', sword: true,
  },
  swm_zenken: {
    name: '全剣技', kana: 'ぜんけんぎ', kind: 'skill', job: 'sword_master', mp: 20, target: 'enemies', weapon: 'blade',
    effect: { type: 'phys', mult: 1.25, hits: 2, ignoreDef: 0.3 },
    desc: 'あらゆる剣技を一度にふるう、剣聖のひっさつ技。敵全体を2回斬る。', cast: '{a}の全剣技！光と雷と闇の剣がおどる！', anim: 'slash_multi', sword: true,
  },

  // ───────────── 将軍 ─────────────
  sg_gorei: {
    name: '大号令', kana: 'だいごうれい', kind: 'skill', job: 'shogun', mp: 8, target: 'allies',
    effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.35, dur: 40 },
    desc: '「者ども、かかれ！」仲間全員の攻撃力と素早さが上がる。', cast: '「者ども、かかれ！」{a}の大号令！', anim: 'warcry',
  },
  sg_kagemusha: {
    name: '影武者', kana: 'かげむしゃ', kind: 'skill', job: 'shogun', mp: 6, target: 'self',
    effect: { type: 'buff', stat: 'eva', add: 0.45, dur: 25 },
    desc: 'そっくりの影武者があらわれる。しばらく攻撃をとてもかわしやすくなる。', cast: '{a}の影武者があらわれた！どっちが本物？', anim: 'buff',
  },
  sg_oniwaban: {
    name: 'お庭番', kana: 'おにわばん', kind: 'skill', job: 'shogun', mp: 8, target: 'enemies',
    effect: { type: 'phys', mult: 0.9, hits: 4, random: true, critBonus: 0.1 },
    desc: 'かくれていた忍びたちが、4回、敵にランダムでおそいかかる。', cast: '{a}の合図で、お庭番の忍びたちが飛び出した！', anim: 'shuriken',
  },
  sg_gunbai: {
    name: '軍配', kana: 'ぐんばい', kind: 'skill', job: 'shogun', mp: 10, target: 'allies',
    effect: { type: 'atbSet', add: 60, msg: '{t}はすぐに動けそうだ！' },
    desc: '軍配をふって指図する。仲間全員の行動ゲージを大きくためる。', cast: '{a}は軍配をふった！', anim: 'buff',
  },
  sg_tenka: {
    name: '天下一の太刀', kana: 'てんかいちのたち', kind: 'skill', job: 'shogun', mp: 18, target: 'enemies', weapon: 'blade',
    effect: { type: 'phys', mult: 2.5 },
    desc: '天下をおさめる者の一太刀。敵全体に大ダメージ。', cast: '{a}の天下一の太刀！', anim: 'gigabreak', sword: true,
  },

  // ───────────── 社長 ─────────────
  sh_tsuru: {
    name: 'ツルの一声', kana: 'つるのひとこえ', kind: 'skill', job: 'shacho', mp: 10, target: 'allies',
    effect: { type: 'atbSet', value: 100, msg: '{t}はすぐに動ける！' },
    desc: '社長の一声でみんながすぐ動く。仲間全員の行動ゲージを満タンにする。', cast: '「やろう！」{a}のツルの一声！', anim: 'warcry',
  },
  sh_meirei: {
    name: '社長命令', kana: 'しゃちょうめいれい', kind: 'skill', job: 'shacho', mp: 12, target: 'allies',
    effect: { type: 'buff', stats: ['atk', 'def', 'agi'], mult: 1.3, dur: 45 },
    desc: '社長じきじきの命令。仲間全員の攻撃力・守備力・素早さが上がる。', cast: '{a}の社長命令！全社一丸となった！', anim: 'warcry',
  },
  sh_kabunushi: {
    name: '株主総会', kana: 'かぶぬしそうかい', kind: 'skill', job: 'shacho', mp: 10, target: 'enemies',
    effect: { type: 'status', status: 'confuse', chance: 0.55, turns: [1, 3] },
    desc: 'しつもんぜめの株主総会。敵全体を混乱させる。', cast: '株主総会が始まった！しつもんの嵐だ！', anim: 'debuff',
  },
  sh_baishu: {
    name: '大型買収', kana: 'おおがたばいしゅう', kind: 'skill', job: 'shacho', mp: 16, target: 'enemies',
    effect: { type: 'banish', chance: 0.5, gold: 3, msg: '{t}は会社ごと買い取られた！', failMsg: '{t}は買収にこたえなかった！' },
    desc: '敵を会社ごと買い取って、戦いからおいだす。おいだした敵のお金の3倍が手に入る（経験値はもらえない）。ボスには効かない。', cast: '{a}の大型買収！', anim: 'coins',
  },
  sh_topdown: {
    name: 'トップダウン', kana: 'とっぷだうん', kind: 'skill', job: 'shacho', mp: 14, target: 'enemy',
    effect: { type: 'phys', mult: 3.2, ignoreDef: 0.5 },
    desc: '上から一気にふりおろす、社長の決めた一撃。敵1体に大ダメージ。', cast: '{a}のトップダウン！', anim: 'gigabreak',
  },

  // ───────────── 二刀流スター ─────────────
  nt_nitoryu: {
    name: '二刀流', kana: 'にとうりゅう', kind: 'skill', job: 'nitoryu', mp: 6, target: 'enemy',
    effect: { type: 'phys', mult: 1.4, atbAfter: 100 },
    desc: '投げて、打つ！攻撃したあと、すぐにもう一度動ける。', cast: '{a}の二刀流！', anim: 'slash_fast',
  },
  nt_5050: {
    name: 'フィフティ・フィフティ', kana: 'ふぃふてぃ・ふぃふてぃ', kind: 'skill', job: 'nitoryu', mp: 8, target: 'enemy',
    effect: { type: 'phys', mult: 1.6, steal: 0.7 },
    desc: 'ホームランも、とうるいも。攻撃したあと、敵の持ち物をぬすむ。', cast: '{a}のフィフティ・フィフティ！', anim: 'bat_swing',
  },
  nt_nemuri: {
    name: 'ねむりファースト', kana: 'ねむりふぁーすと', kind: 'skill', job: 'nitoryu', mp: 5, target: 'self',
    effect: { type: 'heal', base: [300, 400], thr: 40 },
    desc: 'たっぷりねむって、自分のHPを大きく回復する。', cast: '{a}はぐっすりねむった！すっきり！', anim: 'heal2',
  },
  nt_mvp: {
    name: '満票MVP', kana: 'まんぴょうえむぶいぴー', kind: 'skill', job: 'nitoryu', mp: 14, target: 'allies',
    effect: { type: 'buff', stats: ['atk', 'def', 'agi'], mult: 1.35, dur: 45 },
    desc: 'みんなが1位に選ぶ。仲間全員の攻撃力・守備力・素早さが大きく上がる。', cast: '{a}が満票でMVPにえらばれた！みんなの力がわいてくる！', anim: 'warcry',
  },
  nt_real: {
    name: 'リアル二刀流', kana: 'りあるにとうりゅう', kind: 'skill', job: 'nitoryu', mp: 20, target: 'enemies',
    effect: { type: 'phys', mult: 2.2, atbAfter: 100 },
    desc: '世界一の投げと打ち。敵全体に大ダメージをあたえ、すぐにもう一度動ける。', cast: '{a}のリアル二刀流！', anim: 'bat_swing',
  },

  // ───────────── 海賊（ふやした 技） ─────────────
  pr_dokuro: {
    name: 'ドクロの旗', kana: 'どくろのはた', kind: 'skill', job: 'pirate', mp: 4, target: 'enemies',
    effect: { type: 'debuff', stat: 'atk', mult: 0.8, dur: 35, chance: 0.8 },
    desc: 'ドクロの旗をかかげて、敵全体の攻撃力を下げる。', cast: '{a}はドクロの旗をかかげた！', anim: 'debuff',
  },
  pr_takara: {
    name: 'お宝探し', kana: 'おたからさがし', kind: 'skill', job: 'pirate', mp: 3, target: 'enemy',
    effect: { type: 'steal', chance: 0.7 },
    desc: '敵の持ち物からお宝を見つけて、ぬすむ。1体から1回だけ。', cast: '{a}は{t}のお宝を探した！', anim: 'slash_fast',
  },
};
