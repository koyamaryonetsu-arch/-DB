// 第51回 W: 天気の 職業の 技（気象予報士 → お天気キャスター → 天候をあやつる者。職業は jobs-weather.js）
//
// 家族の ねがい「天候の神の ために、気象予報士 → お天気キャスター → 天候をあやつる者 も 作る」（docs/plan-r51-phantom.md）
// ・晴れ（日ざし・回復・炎）・雨（水の 攻撃・じわじわ回復・かさ）・かみなり（雷の 攻撃）・台風（風）・にじ・天気予報（補助）
// ・weather: 'sun' | 'rain' | 'thunder' … はっきり 晴れ・雨・かみなりの 技に つける。幻の職業「天候の神」の 条件
//   （晴れ・雨・かみなりの 技を それぞれ 200回）で 数える（F の phantom.js）。どの 職業でも 2つ いじょう、超級職だけでも 2つずつ
// ・setWeather … 空の 天気を かえる 技（天候をあやつる者）。C3 の shared/battle-weather.js の setWeather(battle, kind, turns) に
//   つなぐ ための しるし（まだ どこからも 読まない。つなぐ までは ふつうの 属性の 技として うごく）
// ・属性: かみなり＝bolt、雨＝water、晴れ＝fire（日ざし）、台風＝wind
// きまりは abilities-jobs9.js・abilities-r43j.js と おなじ
//  ・攻撃技は 基本職 3つ いじょう、上級職・超級職 2つ いじょう
//  ・みんなに かける 補助は ランクの 上限まで（基本職 1.15倍・上級職 1.25倍・超級職 1.4倍。いくつもの 強さは 1.12・1.2・1.3倍）
//    1人に かける 補助は 基本職 1.3倍・上級職 1.4倍まで
//  ・Lv10 の 技が いちばん MPを 使う
//  ・看板の 技は <職業の id>_sig。anim は 今 ある 型（えんしゅつは o10 の ox_〜 に つないで ある。shared/data/ax-time-o10.js）

const STATUS_ALL = ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'];

export const WEATHER_ABILITIES = {
  // ───────────── 気象予報士（基本職） ─────────────
  ks_kaminari: {
    name: 'かみなり注意報', kana: 'かみなりちゅういほう', kind: 'skill', job: 'kishou', mp: 2, target: 'enemy', weather: 'thunder',
    effect: { type: 'magic', element: 'bolt', base: [13, 17], thr: 12 },
    desc: '「かみなりに注意してください」と言ったとたん、小さなかみなりが落ちる。敵1体に雷のダメージ。', cast: '{a}「ただ今、かみなり注意報が出ています！」', anim: 'bolt1',
  },
  ks_niwaka: {
    name: 'にわか雨', kana: 'にわかあめ', kind: 'skill', job: 'kishou', mp: 3, target: 'group', weather: 'rain',
    effect: { type: 'magic', element: 'water', base: [11, 16], thr: 14 },
    desc: '急に雲がわいて、ざっと雨がふる。同じ種類の敵全部に水のダメージ。', cast: '{a}が空を指さすと、ざっと雨がふってきた！', anim: 'water',
  },
  ks_hinata: {
    name: 'ひなたぼっこ', kana: 'ひなたぼっこ', kind: 'skill', job: 'kishou', mp: 3, target: 'ally', role: 'heal', weather: 'sun',
    effect: { type: 'heal', base: [24, 32], thr: 12 },
    desc: '雲のすき間から、暖かい日ざしをとどける。仲間1人のHPを回復する。', cast: '{a}「{t}のところだけ、晴れ間が出ます！」', anim: 'heal1',
  },
  ks_yohou: {
    name: '明日の天気予報', kana: 'あしたのてんきよほう', kind: 'skill', job: 'kishou', mp: 5, target: 'allies', role: 'sup',
    effect: { type: 'buff', stat: 'agi', mult: 1.12, dur: 30 },
    desc: '天気がわかれば、じゅんびもばっちり。仲間全員の素早さが少し上がる。', cast: '{a}「明日の天気をお知らせします！」', anim: 'buff',
  },
  ks_manatsubi: {
    name: '真夏日', kana: 'まなつび', kind: 'skill', job: 'kishou', mp: 5, target: 'enemy', weather: 'sun',
    effect: { type: 'magic', element: 'fire', base: [34, 44], thr: 30 },
    desc: 'じりじりてりつける、夏の日ざしを集める。敵1体に炎のダメージ。', cast: '{a}「今日は30度をこえる真夏日です！」', anim: 'fire1',
  },
  ks_raiu: {
    name: '雷雨', kana: 'らいう', kind: 'skill', job: 'kishou', mp: 8, target: 'enemies', weather: 'thunder',
    effect: { type: 'magic', element: 'bolt', base: [32, 42], thr: 40 },
    desc: '黒い雲から、雨といっしょにかみなりがいくつも落ちる。敵全体に雷のダメージ。', cast: '{a}「ゴロゴロ…雷雨になるでしょう！」', anim: 'bolt2',
  },
  kishou_sig: {
    name: '予報大当たり！ゲリラ雷雨', kana: 'よほうおおあたりげりららいう', kind: 'skill', job: 'kishou', mp: 12, target: 'enemies', weather: 'rain',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', element: 'water', base: [22, 28], thr: 50 },
        { type: 'magic', element: 'bolt', base: [22, 28], thr: 50 },
      ],
    },
    desc: '予報がぴたりと当たって、とつぜんの大雨とかみなり。敵全体に水と雷のダメージ。', cast: '{a}「予報どおり…来ます！」', anim: 'bolt2',
  },

  // ───────────── お天気キャスター（上級職。気象予報士を きわめる） ─────────────
  oc_kaminari: {
    name: 'かみなりマーク', kana: 'かみなりまーく', kind: 'skill', job: 'otenki_caster', mp: 5, target: 'enemy', weather: 'thunder',
    effect: { type: 'magic', element: 'bolt', base: [52, 64], thr: 40 },
    desc: '天気図のかみなりマークをぺたりとはると、本物のかみなりが落ちる。敵1体に雷のダメージ。', cast: '{a}は、天気図にかみなりマークをはった！', anim: 'bolt1',
  },
  oc_kasa: {
    name: 'みんなでかさ', kana: 'みんなでかさ', kind: 'skill', job: 'otenki_caster', mp: 7, target: 'allies', role: 'sup', weather: 'rain',
    effect: { type: 'buff', stat: 'def', mult: 1.2, dur: 40 },
    desc: '「おでかけには、かさを持って行きましょう」。大きなかさで仲間を守る。仲間全員の守備力が上がる。', cast: '{a}「みなさん、かさをわすれずに！」', anim: 'guard',
  },
  oc_hizashi: {
    name: 'ぽかぽか日ざし', kana: 'ぽかぽかひざし', kind: 'skill', job: 'otenki_caster', mp: 8, target: 'allies', role: 'heal', weather: 'sun',
    effect: { type: 'heal', base: [40, 52], thr: 35 },
    desc: '雲がすっと消えて、暖かい日ざしがみんなをつつむ。仲間全員のHPを回復する。', cast: '{a}「午後からは、晴れてぽかぽかです！」', anim: 'heal2',
  },
  oc_atari: {
    name: '予報ズバリ的中', kana: 'よほうずばりてきちゅう', kind: 'skill', job: 'otenki_caster', mp: 6, target: 'ally', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'mag'], mult: 1.3, dur: 40 },
    desc: '予報が当たると、気分も上がる！仲間1人の攻撃力と魔力が上がる。', cast: '{a}「昨日の予報、ズバリ的中です！」', anim: 'buff',
  },
  oc_ooame: {
    name: '大雨けいほう', kana: 'おおあめけいほう', kind: 'skill', job: 'otenki_caster', mp: 8, target: 'enemies', weather: 'rain',
    effect: { type: 'magic', element: 'water', base: [40, 50], thr: 45 },
    desc: 'バケツをひっくり返したような大雨。敵全体に水のダメージ。', cast: '{a}「大雨けいほうが出ています！ご注意ください！」', anim: 'water',
  },
  oc_moushobi: {
    name: '猛暑日', kana: 'もうしょび', kind: 'skill', job: 'otenki_caster', mp: 8, target: 'group', weather: 'sun',
    effect: { type: 'magic', element: 'fire', base: [48, 58], thr: 50 },
    desc: '35度をこえる、とても暑い日ざし。同じ種類の敵全部に炎のダメージ。', cast: '{a}「今日は猛暑日！水分をとりましょう！」', anim: 'fire2',
  },
  otenki_caster_sig: {
    name: 'らい雨前線の生中けい', kana: 'らいうぜんせんのなまちゅうけい', kind: 'skill', job: 'otenki_caster', mp: 18, target: 'enemies', weather: 'thunder',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', element: 'water', base: [40, 50], thr: 60 },
        { type: 'magic', element: 'bolt', base: [40, 50], thr: 60 },
      ],
    },
    desc: '大きな天気図の前線が、そのまま空にあらわれる。雨とかみなりが敵全体をおそう。敵全体に水と雷のダメージ。', cast: '{a}「ここで、生中けいです！前線が近づいています！」', anim: 'bolt2',
  },

  // ───────────── 天候をあやつる者（超級職。お天気キャスターを きわめる） ─────────────
  tt_rakurai: {
    name: 'いかずち落とし', kana: 'いかずちおとし', kind: 'skill', job: 'tenkou_tsukai', mp: 7, target: 'enemy', weather: 'thunder',
    effect: { type: 'magic', element: 'bolt', base: [72, 88], thr: 55 },
    desc: '空にむけて指をはじくと、まっすぐなかみなりが落ちる。敵1体に雷のダメージ。', cast: '{a}が指をはじくと、空がピカッと光った！', anim: 'bolt2',
  },
  tt_megumi: {
    name: 'めぐみの雨', kana: 'めぐみのあめ', kind: 'skill', job: 'tenkou_tsukai', mp: 14, target: 'allies', role: 'heal', weather: 'rain',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [48, 60], thr: 40 }, { type: 'regen', base: [14, 18], thr: 30, dur: 24 }] },
    desc: 'やさしい雨が、かわいた大地をうるおす。仲間全員のHPを回復して、そのあとも少しずつ回復する。', cast: '{a}のまわりに、きらきら光る雨がふってきた…', anim: 'heal2',
  },
  tt_manatsu: {
    name: '真夏の太陽', kana: 'まなつのたいよう', kind: 'skill', job: 'tenkou_tsukai', mp: 12, target: 'enemies', weather: 'sun', setWeather: 'sun',
    effect: { type: 'magic', element: 'fire', base: [64, 78], thr: 60 },
    desc: '空の雲をはらって、大きな太陽をよぶ。敵全体に炎のダメージ。', cast: '{a}が両手を広げると、雲がさっと消えた！', anim: 'fire2',
  },
  tt_taifuu: {
    name: '台風', kana: 'たいふう', kind: 'skill', job: 'tenkou_tsukai', mp: 15, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', element: 'wind', base: [80, 96], thr: 60 },
        { type: 'atbSet', sub: 30, chance: 0.25, msg: '{t}は、風にとばされて目を回した！', failMsg: '{t}は、ふみとどまった！' },
      ],
    },
    desc: '海の上で大きくそだてた台風を、そのままつれてくる。敵全体に風のダメージ。風にとばされて止まる敵もいる。', cast: '{a}「台風、上陸します！」', anim: 'wind2',
  },
  tt_niji: {
    name: 'にじのかけ橋', kana: 'にじのかけはし', kind: 'skill', job: 'tenkou_tsukai', mp: 18, target: 'allies', role: 'sup', weather: 'sun',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['atk', 'def', 'mag'], mult: 1.2, dur: 40 }, { type: 'cure', statuses: STATUS_ALL }] },
    desc: '雨上がりの空に、大きなにじをかける。仲間全員の攻撃力・守備力・魔力が上がり、悪いじょうたいも治る。', cast: '{a}「雨上がりには…ほら、にじが出ました！」', anim: 'buff',
  },
  tt_gouu: {
    name: 'ゲリラごう雨', kana: 'げりらごうう', kind: 'skill', job: 'tenkou_tsukai', mp: 16, target: 'enemies', weather: 'rain', setWeather: 'rain',
    effect: { type: 'magic', element: 'water', base: [92, 110], thr: 65 },
    desc: '急に黒い雲がわいて、たきのような雨がふる。敵全体に水の大ダメージ。', cast: '{a}が空をにらむと、まっ黒な雲がわいてきた！', anim: 'water',
  },
  tt_sanrenpatsu: {
    name: 'かみなり三れん発', kana: 'かみなりさんれんぱつ', kind: 'skill', job: 'tenkou_tsukai', mp: 20, target: 'enemies', weather: 'thunder', setWeather: 'thunder',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', element: 'bolt', base: [36, 44], thr: 60 },
        { type: 'magic', element: 'bolt', base: [36, 44], thr: 60 },
        { type: 'magic', element: 'bolt', base: [36, 44], thr: 60 },
      ],
    },
    desc: 'ドン、ドン、ドーン！大きなかみなりを3回つづけて落とす。敵全体に雷のダメージが3回。', cast: '{a}「1、2の…3！」', anim: 'bolt2',
  },
  tenkou_tsukai_sig: {
    name: '空の大号令', kana: 'そらのだいごうれい', kind: 'skill', job: 'tenkou_tsukai', mp: 34, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', element: 'fire', base: [52, 62], thr: 85 },
        { type: 'magic', element: 'water', base: [52, 62], thr: 85 },
        { type: 'magic', element: 'bolt', base: [52, 62], thr: 85 },
      ],
    },
    desc: '晴れ・雨・かみなり、空のすべてに号令をかける。日ざし・大雨・かみなりが、つぎつぎに敵全体をおそう。敵全体に炎と水と雷のダメージ。', cast: '{a}「空よ…わたしの声を聞け！」', anim: 'meteor',
  },
};
