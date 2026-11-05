// 第66回 C班の 伝説の職業 4つの 技（docs/plan-r66-legend.md の C班）
//   総理大臣（キャリア組＋ほかの 超級職 1つ）・会長（社長 か たたき上げ社長）・
//   働き方改革の星（ブラックきぎょうの星＋ほかの 超級職 1つ）・あの方（黒の組織＋ほかの 超級職 1つ）
//
// 家族の ねがい
// ・総理大臣: 国を 動かす 号令で、仲間全員を 大きく 強く する
// ・会長: お金を 力に 変える（お札を まいて 敵全体に ダメージ・ボディーガードを やとって 守る）。
//   お金を 使う 技は オートでは 使わない（noAuto。知らない うちに お金が へらない ように）。
//   お金は レベルに あわせて 少しだけ（Lv60 で 札束の雨 350G・ボディーガード 220G くらい）
// ・働き方改革の星: 「HPが 少ないほど 強い」を 卒業。定時で 帰って 休み、毎ターン 回復（jobs の passive.teiji）
// ・あの方: なぞの 組織の ボス。敵を 弱らせる 技が 得意（こわい ことばは 使わない）
// きまりは abilities-r41a.js と おなじ
//  ・攻撃技は 2つ いじょう・Lv10 の 技が いちばん MPを 使う・看板の 技は <職業の id>_sig（敵全体）
//  ・みんなに かける 補助は 伝説の 上限まで（1.4倍。いくつもの 強さは 1.35倍）
//  ・えんしゅつは client/render/battlefx-r66c.js（r66c_ で はじまる 名前と 看板の 技）
// 新しい 効き目（shared/battle-r66c.js）
//   goldGuard … お金を はらって（base＋レベル×perLv ゴールド）、then の 効き目を かける（たりない ときは あるだけ はらって 弱め）

export const R66C_ABILITIES = {
  // ───────────── 総理大臣（伝説の職業。キャリア組＋ほかの 超級職 1つ） ─────────────
  sor_enzetsu: {
    name: '所信表明演説', kana: 'しょしんひょうめいえんぜつ', kind: 'skill', job: 'souri', mp: 12, target: 'allies', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'mag'], mult: 1.35, dur: 45 },
    desc: '国の進む道を、みんなの前で力強く話す。仲間全員の攻撃力と魔力が上がる。', cast: '{a}「みなさん、いっしょに前へ進みましょう！」', anim: 'r66c_speech',
  },
  sor_kakugi: {
    name: '閣議決定', kana: 'かくぎけってい', kind: 'skill', job: 'souri', mp: 14, target: 'allies', role: 'sup',
    effect: { type: 'buff', stats: ['def', 'agi'], mult: 1.35, dur: 45 },
    desc: '大臣たちと話し合って、すぐに決める。仲間全員の守備力と素早さが上がる。', cast: '{a}「全員そろって、決定します！」', anim: 'r66c_cabinet',
  },
  sor_touben: {
    name: 'ながーい国会答弁', kana: 'ながーいこっかいとうべん', kind: 'skill', job: 'souri', mp: 14, target: 'enemy',
    effect: { type: 'magic', base: [150, 180], thr: 80, status: { status: 'sleep', chance: 0.4, turns: [1, 2] } },
    desc: 'とても長い答弁で、敵1体にダメージ。話が長すぎて、ねむってしまう敵もいる。', cast: '{a}「えー、そのご質問につきましては、えー…」', anim: 'debuff',
  },
  sor_kyufu: {
    name: 'みんなに給付金', kana: 'みんなにきゅうふきん', kind: 'skill', job: 'souri', mp: 20, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [100, 125], thr: 50 }, { type: 'mpHeal', base: [6, 10] }] },
    desc: '国から、みんなにお金をくばる。仲間全員のHPとMPを回復する。', cast: '{a}「みなさんに、給付金をおとどけします！」', anim: 'coins',
  },
  sor_kaisan: {
    name: '解散総選挙', kana: 'かいさんそうせんきょ', kind: 'skill', job: 'souri', mp: 24, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', element: 'blast', base: [120, 145], thr: 70 },
        { type: 'atbSet', sub: 40, chance: 0.5, msg: '{t}は、選挙のじゅんびでいそがしい！', failMsg: '{t}は、選挙に出なかった！' },
      ],
    },
    desc: '「解散！」の一声で、国じゅうが大さわぎ。敵全体にダメージ。選挙のじゅんびで、行動がおくれる敵もいる。', cast: '{a}「ここに、解散を宣言します！」', anim: 'r66c_kaisan',
  },
  sor_summit: {
    name: 'サミット', kana: 'さみっと', kind: 'skill', job: 'souri', mp: 20, target: 'allies', role: 'sup',
    effect: {
      type: 'multi',
      parts: [
        { type: 'atbSet', add: 40, msg: '{t}は、すぐに動けそうだ！' },
        { type: 'buff', stat: 'atk', mult: 1.3, dur: 40 },
      ],
    },
    desc: '世界の国のリーダーと、力を合わせる。仲間全員の行動ゲージがたまり、攻撃力も上がる。', cast: '{a}は、世界のリーダーたちとかたく手を組んだ！', anim: 'r66c_speech',
  },
  souri_sig: {
    name: '日本列島大号令', kana: 'にほんれっとうだいごうれい', kind: 'skill', job: 'souri', mp: 44, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', element: 'light', base: [220, 260], thr: 100 },
        { type: 'buff', target: 'allies', stats: ['atk', 'def', 'agi'], mult: 1.3, dur: 40 },
      ],
    },
    desc: '北から南まで、国じゅうの人が力を合わせる、総理大臣の最強の技。敵全体に光の大ダメージ。仲間全員の攻撃力・守備力・素早さも上がる。', cast: '{a}「日本じゅうのみなさん、今こそ力を1つに！」', anim: 'souri_sig',
  },

  // ───────────── 会長（伝説の職業。社長 か たたき上げ社長） ─────────────
  kch_hanko: {
    name: '金のハンコ', kana: 'きんのはんこ', kind: 'skill', job: 'kaichou', mp: 10, target: 'enemy',
    effect: { type: 'phys', mult: 3.0, points: 0.5 },
    desc: '会長の金のハンコを、どーんとおす。敵1体に大ダメージ。当てた敵が持っているお金の一部も手に入る。', cast: '{a}「承認！」ぽーん！', anim: 'r66c_hanko',
  },
  kch_guard: {
    name: '黄金のボディーガード', kana: 'おうごんのぼでぃーがーど', kind: 'skill', job: 'kaichou', mp: 6, target: 'allies', role: 'sup', noAuto: true,
    effect: { type: 'goldGuard', base: 40, perLv: 3, then: { type: 'buff', stat: 'def', mult: 1.4, dur: 45 } },
    desc: 'お金でボディーガードをやとって、仲間全員の守備力を大きく上げる。お金（40＋レベル×3ゴールド）を使う（オートでは使わない）。', cast: '{a}「みんなを守ってくれたまえ！」', anim: 'r66c_guard',
  },
  kch_okotoba: {
    name: '会長のおことば', kana: 'かいちょうのおことば', kind: 'skill', job: 'kaichou', mp: 14, target: 'allies', role: 'sup',
    effect: {
      type: 'multi',
      parts: [
        { type: 'atbSet', add: 35, msg: '{t}は、背すじがぴんとのびた！' },
        { type: 'buff', stat: 'atk', mult: 1.4, dur: 40 },
      ],
    },
    desc: '会長のありがたいおことば。仲間全員の行動ゲージがたまり、攻撃力が大きく上がる。', cast: '{a}「うむ。みんな、がんばりたまえ」', anim: 'warcry',
  },
  kch_satsutaba: {
    name: '札束の雨', kana: 'さつたばのあめ', kind: 'skill', job: 'kaichou', mp: 0, target: 'enemies', noAuto: true,
    effect: { type: 'goldThrow', base: 50, perLv: 5, mult: 1.6 },
    desc: 'お札を空からばらまいて、敵全体に、まいたお金より大きいダメージ。守りは関係ない。お金（50＋レベル×5ゴールド）を使う（オートでは使わない）。', cast: '{a}は、札束を空いっぱいにばらまいた！', anim: 'r66c_bills',
  },
  kch_bonus: {
    name: '特別ボーナス', kana: 'とくべつぼーなす', kind: 'skill', job: 'kaichou', mp: 20, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [110, 135], thr: 50 }, { type: 'buff', stat: 'agi', mult: 1.3, dur: 40 }] },
    desc: 'がんばったみんなに、特別ボーナス！仲間全員のHPを回復して、素早さも上がる。', cast: '{a}「今年は、特別ボーナスだ！」', anim: 'coins',
  },
  kch_group: {
    name: 'グループ会社大集合', kana: 'ぐるーぷがいしゃだいしゅうごう', kind: 'skill', job: 'kaichou', mp: 22, target: 'enemies',
    effect: { type: 'phys', mult: 0.8, hits: 5, random: true },
    desc: 'グループの会社の社員たちが、いっせいにかけつける。敵全体に、ランダムで5回ぶつかる。', cast: '{a}「グループのみんな、集合！」', anim: 'r66c_group',
  },
  kaichou_sig: {
    name: '黄金の大判ぶるまい', kana: 'おうごんのおおばんぶるまい', kind: 'skill', job: 'kaichou', mp: 42, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'phys', mult: 2.7, ignoreDef: 0.3, points: 0.5 },
        { type: 'buff', target: 'allies', stat: 'def', mult: 1.25, dur: 30 },
      ],
    },
    desc: '金色の大判小判が、空からざくざくふりそそぐ、会長の最強の技。敵全体に大ダメージ。当てた敵のお金の一部が手に入り、仲間全員の守備力も上がる。', cast: '{a}「今日は、大ばんぶるまいだ！」', anim: 'kaichou_sig',
  },

  // ───────────── 働き方改革の星（伝説の職業。ブラックきぎょうの星＋ほかの 超級職 1つ） ─────────────
  hwk_teiji: {
    name: '定時退社パンチ', kana: 'ていじたいしゃぱんち', kind: 'skill', job: 'hatarakikata', mp: 10, target: 'enemy',
    effect: { type: 'phys', mult: 3.1 },
    desc: '時計のはりが定時をさした！帰る前に、敵1体にしっかり大ダメージ。', cast: '{a}「定時です！おつかれさまでした！」', anim: 'r66c_clock',
  },
  hwk_nozan: {
    name: 'ノー残業デー', kana: 'のーざんぎょうでー', kind: 'skill', job: 'hatarakikata', mp: 14, target: 'allies', role: 'heal',
    effect: { type: 'regen', base: [22, 28], thr: 30, dur: 24 },
    desc: '今日は、みんなで早く帰る日。仲間全員のHPが、しばらく少しずつ回復する。', cast: '{a}「今日は、ノー残業デーです！」', anim: 'r66c_home',
  },
  hwk_refresh: {
    name: '有給でリフレッシュ', kana: 'ゆうきゅうでりふれっしゅ', kind: 'skill', job: 'hatarakikata', mp: 12, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [150, 180], thr: 50 }, { type: 'buff', stat: 'atk', mult: 1.45, dur: 40 }] },
    desc: 'お休みをとって、しっかりリフレッシュ。自分のHPを大きく回復して、攻撃力も上がる。', cast: '{a}は、有給をとって温泉でのんびりした！', anim: 'r66c_home',
  },
  hwk_telework: {
    name: 'テレワーク', kana: 'てれわーく', kind: 'skill', job: 'hatarakikata', mp: 12, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'def', mult: 1.5, dur: 40 }, { type: 'buff', stat: 'eva', add: 0.25, dur: 40 }] },
    desc: '家から、画面ごしにお仕事。自分の守備力が上がり、敵の攻撃もかわしやすくなる。', cast: '{a}は、家からテレワークに切りかえた！', anim: 'buff',
  },
  hwk_flex: {
    name: 'フレックスタイム', kana: 'ふれっくすたいむ', kind: 'skill', job: 'hatarakikata', mp: 18, target: 'allies', role: 'sup',
    effect: {
      type: 'multi',
      parts: [
        { type: 'atbSet', add: 40, msg: '{t}は、自分のペースで動き出した！' },
        { type: 'buff', stat: 'agi', mult: 1.4, dur: 40 },
      ],
    },
    desc: '働く時間を、自分で決められる。仲間全員の行動ゲージがたまり、素早さも大きく上がる。', cast: '{a}「来る時間も帰る時間も、自由です！」', anim: 'r66c_clock',
  },
  hwk_buntan: {
    name: 'みんなで分担', kana: 'みんなでぶんたん', kind: 'skill', job: 'hatarakikata', mp: 22, target: 'enemies',
    effect: { type: 'phys', mult: 0.68, hits: 3 },
    desc: '仕事は、みんなで分けあえば早く終わる。敵全体に3回ダメージ。', cast: '{a}「1人でかかえこまないで、みんなでやろう！」', anim: 'hit_all',
  },
  hatarakikata_sig: {
    name: 'ホワイトきぎょうの星', kana: 'ほわいときぎょうのほし', kind: 'skill', job: 'hatarakikata', mp: 42, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'phys', mult: 2.7, ignoreDef: 0.3 },
        { type: 'heal', target: 'allies', base: [80, 100], thr: 40 },
      ],
    },
    desc: 'みんなが笑顔で働ける、まっ白にかがやく会社の光。働き方改革の星の最強の技。敵全体に大ダメージ。仲間全員のHPも回復する。', cast: '{a}「みんなで定時に帰って、明日もがんばろう！」', anim: 'hatarakikata_sig',
  },

  // ───────────── あの方（伝説の職業。黒の組織＋ほかの 超級職 1つ） ─────────────
  ano_mail: {
    name: 'なぞのメール', kana: 'なぞのめーる', kind: 'skill', job: 'ano_kata', mp: 10, target: 'enemies', role: 'sup',
    effect: { type: 'debuff', stat: 'agi', mult: 0.7, dur: 40, chance: 0.85 },
    desc: 'あの方から、ひみつのメールがとどく。ふしぎな音がひびいて、敵全体の素早さが下がる。', cast: 'ピ・ポ・パ…♪{a}は、ひみつのメールを送った。', anim: 'r66c_mail',
  },
  ano_karasu: {
    name: 'カラスの大群', kana: 'からすのたいぐん', kind: 'skill', job: 'ano_kata', mp: 14, target: 'enemies',
    effect: { type: 'phys', mult: 0.6, hits: 3, element: 'dark' },
    desc: '黒いカラスがむれになって、敵全体を3回つつく。闇のダメージ。', cast: 'カア、カア…{a}のまわりに、黒いカラスがむらがった！', anim: 'r66c_crow',
  },
  ano_kusuri: {
    name: 'なぞの黒い薬', kana: 'なぞのくろいくすり', kind: 'skill', job: 'ano_kata', mp: 16, target: 'enemy', role: 'sup',
    effect: {
      type: 'multi',
      parts: [
        { type: 'debuff', stat: 'atk', mult: 0.6, dur: 40, chance: 0.85 },
        { type: 'debuff', stat: 'mag', mult: 0.6, dur: 40, chance: 0.85 },
      ],
    },
    desc: '組織で作った、あやしい黒い薬。敵1体の攻撃力と魔力が大きく下がる。', cast: '{a}は、あやしい黒い薬のびんを取り出した…', anim: 'r66c_potion',
  },
  ano_shirei: {
    name: 'ボスの指令', kana: 'ぼすのしれい', kind: 'skill', job: 'ano_kata', mp: 14, target: 'allies', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.35, dur: 45 },
    desc: '組織のボスが、ひみつの指令を出す。仲間全員の攻撃力と素早さが上がる。', cast: '{a}「…指令だ。しっかりたのむよ」', anim: 'dark1',
  },
  ano_shotai: {
    name: '正体はひみつ', kana: 'しょうたいはひみつ', kind: 'skill', job: 'ano_kata', mp: 14, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'eva', add: 0.3, dur: 40 }, { type: 'buff', stat: 'agi', mult: 1.5, dur: 40 }] },
    desc: 'だれも顔を知らない。かげにかくれて、自分の素早さが上がり、敵の攻撃もかわしやすくなる。', cast: '{a}のすがたが、黒いかげにとけこんだ…', anim: 'r66c_shadow',
  },
  ano_kage: {
    name: '黒いかげのささやき', kana: 'くろいかげのささやき', kind: 'skill', job: 'ano_kata', mp: 20, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'phys', mult: 1.25, element: 'dark' },
        { type: 'status', status: 'confuse', chance: 0.4, turns: [1, 3] },
      ],
    },
    desc: '黒いかげが、そっとささやく。敵全体に闇のダメージ。こんらんする敵もいる。', cast: '{a}「…きみは、だれの味方かな？」', anim: 'r66c_shadow',
  },
  ano_kata_sig: {
    name: '七つの子のメロディー', kana: 'ななつのこのめろでぃー', kind: 'skill', job: 'ano_kata', mp: 44, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'phys', mult: 2.6, ignoreDef: 0.3, element: 'dark' },
        { type: 'debuff', stat: 'atk', mult: 0.75, dur: 40, chance: 0.8 },
      ],
    },
    desc: 'メールの音が「七つの子」のメロディーをかなでると、組織がいっせいに動き出す、あの方の最強の技。敵全体に闇の大ダメージ。敵の攻撃力も下がる。', cast: '♪からす、なぜなくの…{a}のメールが、闇にひびきわたった。', anim: 'ano_kata_sig',
  },
};
