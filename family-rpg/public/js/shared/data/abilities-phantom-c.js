// 第51回 C3: 幻の職業（tier 4）の 技 — 宇宙一のおかん・はかいと創造の神・夢のスタジアム鉄道・天候の神（docs/plan-r51-phantom.md）
//
// きまり（abilities-jobs10.js の 伝説の 技より 1わり強 強く）
//  ・攻撃技は 伝説の 技の 1.1〜1.2倍（1体 3.7〜3.9倍・全体 2.4〜3.2倍・全体の 魔力 170〜200、看板は 300 こえ）
//  ・みんなに かける 補助は 1.35〜1.4倍。Lv10 の 技が いちばん MPを 使う
//  ・えんしゅつは o9（shared/data/ax-time-o9.js の AX_SKILLS_O9 が つなぐ。下の anim は もしもの ときの 前からの 絵）
// 新しい 効果（shared/battle-phantom-c.js・shared/battle-weather.js）
//  ・scold（しかる）… 敵は 反省して しばらく 動かない（行動ゲージが マイナスに）。攻撃力も 下がる
//  ・erase（消す）… ダメージの あと 弱った 敵（HPが 最大の below いか）を 消す。ボス・メタルは 消えない
//  ・regear（装備を 作りかえる）… 仲間 1人に 1つ、運しだいの 装備が 新しく なって その 強さが 上がる
//  ・crowd（観客）… 使った 人の 観客が ふえる（5まで）。技の crowd: 0.1 … 観客 1つで ダメージ ＋10%。spend で 使いきる
//  ・weather・weatherStrike（天気）… battle-weather.js。天気の 技には weather: 'sun'|'rain'|'thunder'（幻の書の 数える タグ）
// 名前の 字: 「援・壊・洪」は 習わない 字なので つかわない（エール・はかい・大ごう雨）

const STATUS_ALL = ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'];

export const PHANTOM_ABILITIES_C = {
  // ───────────── 宇宙一のおかん（最強のおかん＋3年B組の担任） ─────────────
  co_kora: {
    name: '宇宙のコラーッ！', kana: 'うちゅうのこらーっ', kind: 'skill', job: 'cosmic_okan', mp: 16, target: 'enemies',
    effect: { type: 'multi', parts: [{ type: 'magic', element: 'bolt', base: [125, 150], thr: 50 }, { type: 'scold', chance: 0.45, stop: 70 }] },
    desc: '宇宙のはてまでひびく声で、敵全体をしかる。雷のダメージ。しかられた敵は反省して、しばらく動けないこともある。', cast: '{a}「コラーーッ！！」声が宇宙のはてまでひびいた！', anim: 'okan_kaminari',
  },
  co_gohan: {
    name: '宇宙一の大もりごはん', kana: 'うちゅういちのおおもりごはん', kind: 'skill', job: 'cosmic_okan', mp: 20, target: 'allies', role: 'heal', field: true,
    effect: { type: 'multi', parts: [{ type: 'heal', base: [150, 180], thr: 60 }, { type: 'cure', statuses: STATUS_ALL }] },
    desc: '山のようにもったごはんを、家族みんなに。仲間全員のHPを大きく回復して、悪いじょうたいも治す。', cast: '{a}「さあ、いっぱい食べなさい！おかわりもあるよ！」', anim: 'gohan',
  },
  co_hansei: {
    name: '正座で反省タイム', kana: 'せいざではんせいたいむ', kind: 'skill', job: 'cosmic_okan', mp: 14, target: 'enemy', role: 'sup',
    effect: { type: 'scold', chance: 0.9, stop: 160, atk: 0.75, msg: '{t}は、正座して反省している…（しばらく動けない）', failMsg: '{t}は、正座から立ち上がってにげた！' },
    desc: '敵1体を正座させて、こんこんとお説教。反省した敵は、しばらく動けない。攻撃力も下がる（ボスには効きにくい）。', cast: '{a}「そこにすわりなさい！」', anim: 'debuff',
  },
  co_slipper: {
    name: '流れ星スリッパ', kana: 'ながれぼしすりっぱ', kind: 'skill', job: 'cosmic_okan', mp: 18, target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 3.9, ignoreDef: 0.25 }, { type: 'scold', chance: 0.4, stop: 80 }] },
    desc: '流れ星のように光るスリッパで、敵1体をはたく。大ダメージ。守りの固い敵にもよく効き、反省して止まることもある。', cast: '{a}のスリッパが、流れ星になった！スパーン！！', anim: 'slipper_smack',
  },
  co_bentou: {
    name: '愛情たっぷり宇宙弁当', kana: 'あいじょうたっぷりうちゅうべんとう', kind: 'skill', job: 'cosmic_okan', mp: 24, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [120, 145], thr: 60 }, { type: 'regen', base: [24, 30], thr: 30 }] },
    desc: '星の形のおかずがつまった、愛情たっぷりのお弁当。仲間全員のHPを回復して、少しずつ回復する力でつつむ。', cast: '{a}「はい、お弁当！のこさず食べるんやで！」', anim: 'heal_dance',
  },
  co_ai: {
    name: '宇宙一のおかんの愛', kana: 'うちゅういちのおかんのあい', kind: 'skill', job: 'cosmic_okan', mp: 30, target: 'deadAllies', role: 'heal',
    effect: { type: 'revive', hpRatio: 0.6 },
    desc: 'たおれた仲間全員を、おかんの愛で生き返らせる（HPは6わり）。', cast: '{a}「みんな、起きなさい！ごはんできてるよ！」', anim: 'revive',
  },
  co_kaji: {
    name: '宇宙の家事全力', kana: 'うちゅうのかじぜんりょく', kind: 'skill', job: 'cosmic_okan', mp: 22, target: 'allies', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'def', 'agi'], mult: 1.35, dur: 45 },
    desc: 'せんたくもそうじも料理も、光の速さで終わらせる。仲間全員の攻撃力・守備力・素早さが上がる。', cast: '{a}は、宇宙一の速さで家事を終わらせた！', anim: 'buff',
  },
  cosmic_okan_sig: {
    name: '宇宙一のカミナリ', kana: 'うちゅういちのかみなり', kind: 'skill', job: 'cosmic_okan', mp: 46, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', element: 'bolt', base: [300, 345], thr: 95 },
        { type: 'scold', chance: 0.55, stop: 110, atk: 0.8 },
        { type: 'heal', target: 'allies', base: [90, 110], thr: 60 },
      ],
    },
    desc: '銀河じゅうの雷を集めて落とす、宇宙一のおかんの最強の技。敵全体に雷の大ダメージ。しかられた敵は反省して止まり、攻撃力も下がる。そのあと家族みんなをぎゅっとして、HPを回復する。', cast: '{a}「いいかげんにしなさーーい！！」銀河じゅうの雷が落ちた！', anim: 'okan_kaminari',
  },

  // ───────────── はかいと創造の神（はかい神＋クリエイター） ─────────────
  cc_kesu: {
    name: 'まっさらに消す', kana: 'まっさらにけす', kind: 'skill', job: 'chaos_creator', mp: 16, target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 3.7, ignoreDef: 0.3 }, { type: 'erase', below: 0.3 }] },
    desc: '手をかざして、敵1体を白くぬりつぶす。大ダメージ。HPが3わりより少なくなった敵は、まっさらに消える（ボスとメタルは消えない）。', cast: '{a}が手をかざすと、まわりが白くぬりつぶされていく…！', anim: 'hakai',
  },
  cc_tsukurikae: {
    name: '装備つくりかえ', kana: 'そうびつくりかえ', kind: 'skill', job: 'chaos_creator', mp: 18, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [60, 75], thr: 50 }, { type: 'regear', mult: 1.4 }] },
    desc: '仲間全員の装備を、その場で新しく作りかえる。それぞれ、何かの力が大きく上がる（何が上がるかは運しだい）。キズも少し回復する。', cast: '{a}「古いものはこわして…新しく作る！」', anim: 'buff',
  },
  cc_kowashite: {
    name: 'こわしてつくる', kana: 'こわしてつくる', kind: 'skill', job: 'chaos_creator', mp: 20, target: 'enemies',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 2.5 }, { type: 'regear', target: 'self', mult: 1.3 }] },
    desc: '敵全体をこぶしでこわし、そのかけらで自分の装備を作りかえる。敵全体にダメージ。自分の何かの力が上がる。', cast: '{a}「こわれた物は、作りなおせばいい」', anim: 'hit_all',
  },
  cc_mu: {
    name: '無にかえす光', kana: 'むにかえすひかり', kind: 'skill', job: 'chaos_creator', mp: 26, target: 'enemies',
    effect: { type: 'multi', parts: [{ type: 'magic', element: 'void', base: [175, 205], thr: 80 }, { type: 'erase', below: 0.2 }] },
    desc: '何もかもを消す、まっ白な光。敵全体に消滅のダメージ。HPが2わりより少なくなった敵は、消えてしまう（ボスとメタルは消えない）。', cast: '{a}「すべて、最初からやりなおしだ」', anim: 'void',
  },
  cc_sagyoudai: {
    name: '創造神の作業台', kana: 'そうぞうしんのさぎょうだい', kind: 'skill', job: 'chaos_creator', mp: 26, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [150, 175], thr: 60 }, { type: 'regear', mult: 1.35 }] },
    desc: '大きな作業台で、仲間の体と装備をまとめて作りなおす。仲間全員のHPを大きく回復して、それぞれの装備も新しくなる。', cast: '{a}は、光る作業台の前で、カンカンとつちをふるった！', anim: 'heal2',
  },
  cc_dama: {
    name: 'はかいと創造の玉', kana: 'はかいとそうぞうのたま', kind: 'skill', job: 'chaos_creator', mp: 30, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [240, 280], thr: 90 },
    desc: 'すべてをこわし、そのあとに新しい星を生む、ふしぎな玉。敵全体に炎の大ダメージ。', cast: '{a}の手の上で、こわす力と作る力が1つの玉になった！', anim: 'fire3',
  },
  cc_rule: {
    name: '世界のルール書きかえ', kana: 'せかいのるーるかきかえ', kind: 'skill', job: 'chaos_creator', mp: 24, target: 'enemies', role: 'sup',
    effect: {
      type: 'multi',
      parts: [
        { type: 'dispel' },
        { type: 'debuff', stat: 'def', mult: 0.7, dur: 40, chance: 0.85 },
        { type: 'debuff', stat: 'atk', mult: 0.8, dur: 40, chance: 0.85 },
      ],
    },
    desc: '世界のルールを書きかえる。敵全体の強くなる効果を消して、守備力と攻撃力も下げる。', cast: '{a}は、世界の決まりを書きかえた！', anim: 'debuff',
  },
  chaos_creator_sig: {
    name: 'はかいと創造のビッグバン', kana: 'はかいとそうぞうのびっぐばん', kind: 'skill', job: 'chaos_creator', mp: 48, target: 'enemies', spellLike: true,
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', element: 'void', base: [330, 380], thr: 100 },
        { type: 'erase', below: 0.35 },
        { type: 'regear', target: 'allies', mult: 1.4 },
      ],
    },
    desc: '世界をいちどこわして、新しく作りなおす、はかいと創造の神の最強の技。敵全体に消滅の大ダメージ。弱った敵は消えてしまい（ボスとメタルは消えない）、仲間全員の装備も新しく作りかわる。', cast: '{a}「はかい…そして、創造！」まっ白な光の中で、新しい世界が生まれた！', anim: 'void',
  },

  // ───────────── 夢のスタジアム鉄道（京急の社長＋野球界の殿堂入り） ─────────────
  ds_manin: {
    name: '満員の観客電車', kana: 'まんいんのかんきゃくでんしゃ', kind: 'skill', job: 'dream_stadium', mp: 16, target: 'enemies', crowd: 0.1,
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 2.4 }, { type: 'crowd', target: 'self', add: 1 }] },
    desc: '観客をぎっしりのせた電車が、敵全体につっこむ。観客が多いほど強い。スタジアムの観客もふえる。', cast: '{a}の合図で、観客を満員にのせた電車が走ってきた！', anim: 'manin_densha',
  },
  ds_seien: {
    name: '大観衆のエール', kana: 'だいかんしゅうのえーる', kind: 'skill', job: 'dream_stadium', mp: 18, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['atk', 'agi'], mult: 1.4, dur: 45 }, { type: 'crowd', target: 'self', add: 2 }] },
    desc: 'スタンドいっぱいの大観衆が、声をそろえてエールを送る。仲間全員の攻撃力と素早さが上がり、観客も大きくふえる。', cast: 'スタンドから「かっとばせー！」の大合唱！', anim: 'warcry',
  },
  ds_kaisoku: {
    name: '快速ストレート', kana: 'かいそくすとれーと', kind: 'skill', job: 'dream_stadium', mp: 14, target: 'enemy', crowd: 0.1,
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 3.9, critBonus: 0.12 }, { type: 'crowd', target: 'self', add: 1 }] },
    desc: '快速電車より速い、うなるストレート。敵1体に大ダメージ。会心も出やすく、観客が多いほど強い。観客もふえる。', cast: '{a}の快速ストレート！スピードガンは…200キロ！？', anim: 'ball',
  },
  ds_wave: {
    name: 'スタンドのウェーブ', kana: 'すたんどのうぇーぶ', kind: 'skill', job: 'dream_stadium', mp: 22, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [140, 165], thr: 60 }, { type: 'crowd', target: 'self', add: 1 }] },
    desc: '観客席を、大きなウェーブが1周する。仲間全員のHPを大きく回復する。観客もふえる。', cast: 'スタンドに、大きなウェーブが起こった！', anim: 'heal_dance',
  },
  ds_chokutsu: {
    name: 'スタジアム直通特急', kana: 'すたじあむちょくつうとっきゅう', kind: 'skill', job: 'dream_stadium', mp: 24, target: 'enemies', crowd: 0.1,
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 0.85, hits: 7, random: true }, { type: 'crowd', target: 'self', add: 1 }] },
    desc: '駅からスタジアムまで止まらない、赤い特急。敵全体に、ランダムで7回ぶつかる。観客が多いほど強く、観客もふえる。', cast: '{a}「スタジアム直通特急、まもなく発車します！」', anim: 'train',
  },
  ds_makyu: {
    name: '通過列車と消える魔球', kana: 'つうかれっしゃときえるまきゅう', kind: 'skill', job: 'dream_stadium', mp: 22, target: 'enemy', crowd: 0.1,
    effect: {
      type: 'multi',
      parts: [
        { type: 'phys', mult: 3.5 },
        { type: 'atbSet', sub: 50, chance: 0.5, msg: '{t}は、電車と球を見うしなって止まった！', failMsg: '{t}は、なんとか球を目で追った！' },
        { type: 'crowd', target: 'self', add: 1 },
      ],
    },
    desc: '通過する電車のかげにかくれて、魔球が消える。敵1体に大ダメージ。止まることもある。観客が多いほど強く、観客もふえる。', cast: '電車が通りすぎると…球が消えた！？', anim: 'ball',
  },
  ds_lucky7: {
    name: 'ラッキーセブン', kana: 'らっきーせぶん', kind: 'skill', job: 'dream_stadium', mp: 26, target: 'allies', role: 'sup',
    effect: {
      type: 'multi',
      parts: [
        { type: 'heal', base: [100, 120], thr: 50 },
        { type: 'atbSet', add: 40, msg: '{t}は、7回の風船にのって元気になった！' },
        { type: 'crowd', target: 'self', add: 2 },
      ],
    },
    desc: 'ラッキーセブンの7回、風船がいっせいに空へ。仲間全員のHPを回復して、すぐ動けるようにする。観客も大きくふえる。', cast: 'ラッキーセブン！色とりどりの風船が空にまい上がった！', anim: 'warcry',
  },
  dream_stadium_sig: {
    name: '満員御礼スタジアム特急', kana: 'まんいんおんれいすたじあむとっきゅう', kind: 'skill', job: 'dream_stadium', mp: 46, target: 'enemies', crowd: 0.12,
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 3.2, ignoreDef: 0.3 }, { type: 'crowd', target: 'self', spend: true }] },
    desc: '満員の観客電車が、スタジアムごと敵につっこむ、夢のスタジアム鉄道の最強の技。敵全体に大ダメージ。守りの固い敵にもよく効き、観客が多いほどとても強い（観客はみんな帰っていく）。', cast: '{a}「満員御礼！スタジアムごと、出発進行！」', anim: 'train',
  },

  // ───────────── 天候の神（天候をあやつる者＋天地雷鳴士） ─────────────
  wg_hare: {
    name: '日本晴れ', kana: 'にっぽんばれ', kind: 'skill', job: 'weather_god', mp: 14, target: 'allies', role: 'sup', weather: 'sun',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['atk', 'mag'], mult: 1.3, dur: 45 }, { type: 'weather', target: 'self', kind: 'sun', turns: 12 }] },
    desc: '空を晴れにする。仲間全員の攻撃力と魔力が上がる。晴れの間は、味方の炎と光が強くなり、敵の炎・光・水・氷が弱くなる。', cast: '{a}が空を指さすと、雲がさっと晴れていく！', anim: 'holy',
  },
  wg_ame: {
    name: 'めぐみの雨', kana: 'めぐみのあめ', kind: 'skill', job: 'weather_god', mp: 20, target: 'allies', role: 'heal', weather: 'rain',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [130, 155], thr: 60 }, { type: 'weather', target: 'self', kind: 'rain', turns: 12 }] },
    desc: '空を雨にする。仲間全員のHPを回復する。雨の間は、味方の水と回復が強くなり、敵の水と炎が弱くなる。', cast: '{a}が手をひろげると、やさしい雨がふりだした！', anim: 'heal2',
  },
  wg_kaminari: {
    name: 'いかずちの空', kana: 'いかずちのそら', kind: 'skill', job: 'weather_god', mp: 18, target: 'enemies', weather: 'thunder',
    effect: { type: 'multi', parts: [{ type: 'magic', element: 'bolt', base: [150, 180], thr: 70 }, { type: 'weather', target: 'self', kind: 'thunder', turns: 12 }] },
    desc: '敵全体に雷を落として、空をかみなりにする。かみなりの間は、味方の雷と風が強くなり、敵の雷と風が弱くなる。', cast: '{a}が天をあおぐと、雷が落ちてきた！', anim: 'bolt2',
  },
  wg_manatsu: {
    name: '真夏の太陽', kana: 'まなつのたいよう', kind: 'skill', job: 'weather_god', mp: 22, target: 'enemies', weather: 'sun',
    effect: { type: 'magic', element: 'fire', base: [170, 200], thr: 75 },
    desc: 'ぎらぎらの太陽を、敵の上にもう1つ作る。敵全体に炎の大ダメージ。晴れの日はもっと強い。', cast: '{a}「太陽よ、もう1つ！」', anim: 'fire3',
  },
  wg_gouu: {
    name: '天の大ごう雨', kana: 'てんのだいごうう', kind: 'skill', job: 'weather_god', mp: 22, target: 'enemies', weather: 'rain',
    effect: { type: 'magic', element: 'water', base: [170, 200], thr: 75 },
    desc: 'たきのような大雨で、敵全体をおし流す。水の大ダメージ。雨の日はもっと強い。', cast: '{a}の合図で、空からたきのような雨が！', anim: 'water',
  },
  wg_raitei: {
    name: '天のいかずち', kana: 'てんのいかずち', kind: 'skill', job: 'weather_god', mp: 24, target: 'enemy', weather: 'thunder',
    effect: { type: 'magic', element: 'bolt', base: [290, 330], thr: 85 },
    desc: '天のいちばん高い所から、ふとい雷を1本落とす。敵1体に雷のとても大きなダメージ。かみなりの日はもっと強い。', cast: '{a}「天のいかずちよ！」', anim: 'bolt2',
  },
  wg_niji: {
    name: 'にじのかけ橋', kana: 'にじのかけはし', kind: 'skill', job: 'weather_god', mp: 28, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [150, 180], thr: 70 }, { type: 'cure', statuses: STATUS_ALL }, { type: 'buff', stat: 'def', mult: 1.3, dur: 40 }] },
    desc: '空に大きなにじをかける。仲間全員のHPを大きく回復して、悪いじょうたいを治し、守備力も上がる。', cast: '空に、7色のにじのかけ橋がかかった！', anim: 'heal_ring',
  },
  weather_god_sig: {
    name: '天候反転', kana: 'てんこうはんてん', kind: 'skill', job: 'weather_god', mp: 48, target: 'enemies', spellLike: true,
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', element: 'light', base: [150, 175], thr: 90 },
        { type: 'weatherStrike', base: [200, 235], thr: 100, turns: 14, first: 'thunder' },
      ],
    },
    desc: '空をひっくり返して、天気を思いのままにかえる、天候の神の最強の技。敵全体に光と天気の力の大ダメージ。敵の天気なら、うばいとって強さを入れかえる。晴れ→雨→かみなりの順にかわる。', cast: '{a}「空よ、ひっくり返れ！」', anim: 'meteor',
  },
};
