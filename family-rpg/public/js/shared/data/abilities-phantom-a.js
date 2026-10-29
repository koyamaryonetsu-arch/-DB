// 第51回 C1: 幻の職業（tier 4）の 技 … 海賊王・伝説の超勇者・日の火影・天才しせつ管理者AI（docs/plan-r51-phantom.md）
// きまり
//  ・1つの 職業に 8つ（Lv1〜10。Lv10 が 看板の 技 <職業の id>_sig で いちばん MPを 使う）
//  ・攻撃技は もとの 伝説の 職業の 技より 2わり くらい 強い。みんなに かける 補助は 1.35〜1.4倍
//  ・とくべつな しかけ（battle-phantom-a.js）
//      海賊王 … crew（仲間が 多いほど 強い）・敵を 笑わせて 止める（atbSet）
//      伝説の超勇者 … kiCharge（気を ためる）→ ki（ためた 気で 強く なる。かめはめデイン）
//      日の火影 … clones（影分身）→ dance（分身の 数だけ 当たる 回数が ふえる）
//      天才しせつ管理者AI … jobs の passive.autoOpt（自分の 番の たびに 仲間全員を 最適化）・autoBoost（全力モード）
//  ・えんしゅつは えんしゅつの グループ o7（shared/data/ax-time-o7.js・client/render/axfx-o7.js）

const STATUS_ALL = ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'];
// 敵を 笑わせて 止める（自由の技）
const LAUGH = { type: 'atbSet', sub: 60, chance: 0.75, msg: '{t}は、おなかをかかえて笑いころげている！', failMsg: '{t}は、笑いをこらえた！' };

export const PHANTOM_ABILITIES_A = {
  // ───────────── 海賊王（ニカ＋海賊） ─────────────
  pk_gatling: {
    name: 'ゴムゴムの王者のガトリング', kana: 'ごむごむのおうじゃのがとりんぐ', kind: 'skill', job: 'pirate_king', mp: 18, target: 'enemies',
    effect: { type: 'phys', mult: 0.75, hits: 8, random: true },
    desc: '目にもとまらぬゴムのこぶしを、敵にランダムで8回たたきこむ。', cast: '{a}「ゴムゴムの…王者のガトリング！」', anim: 'punch_multi',
  },
  pk_hata: {
    name: '海賊王の旗', kana: 'かいぞくおうのはた', kind: 'skill', job: 'pirate_king', mp: 20, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['atk', 'def'], mult: 1.35, dur: 45 }, { type: 'cure', statuses: STATUS_ALL }, { type: 'mpHeal', base: [3, 5] }] },
    desc: '麦わらの旗を高くかかげる。仲間全員の攻撃力と守備力が上がり、悪いじょうたいも治って、MPも少し回復する。', cast: '{a}「おれたちの旗の下に、集まれ！」', anim: 'warcry',
  },
  pk_ichimi: {
    name: '一味のいっせい攻撃', kana: 'いちみのいっせいこうげき', kind: 'skill', job: 'pirate_king', mp: 24, target: 'enemies', role: 'dmg',
    effect: { type: 'phys', mult: 1.5, crew: 0.3 },
    desc: '仲間みんなで、いっせいに敵全体へかかる。生きている仲間が多いほど強い（4人なら1.9倍）。', cast: '{a}「行くぞ、野ろうども！」', anim: 'gomu_punch',
  },
  pk_jiyuu: {
    name: '自由の技', kana: 'じゆうのわざ', kind: 'skill', job: 'pirate_king', mp: 28, target: 'enemies', role: 'dmg',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 2.6, element: 'light' }, LAUGH] },
    desc: '何でも自由自在。敵全体をおもちゃのようにふり回し、おかしくて笑いが止まらなくする。光のダメージで、笑っている敵は動けない（ボスには効きにくい）。', cast: '{a}は、楽しそうに敵をふり回した！', anim: 'nika_drum',
  },
  pk_utage: {
    name: '海賊王のうたげ', kana: 'かいぞくおうのうたげ', kind: 'skill', job: 'pirate_king', mp: 26, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [200, 240], thr: 80 }, { type: 'regen', base: [16, 20], thr: 50, dur: 30 }, { type: 'mpHeal', base: [3, 5] }] },
    desc: '肉とごちそうで、にぎやかなうたげ。仲間全員のHPを大きく回復して、しばらく少しずつ回復する。MPも少し回復する。', cast: '{a}「うたげだー！肉ー！」', anim: 'heal_dance',
  },
  pk_haoh: {
    name: '王の気', kana: 'おうのき', kind: 'skill', job: 'pirate_king', mp: 22, target: 'enemies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'atbSet', sub: 50, chance: 0.7, msg: '{t}は、王の気におされて動けない！', failMsg: '{t}は、なんとかふみとどまった！' }, { type: 'debuff', stat: 'atk', mult: 0.7, dur: 30, chance: 0.8 }] },
    desc: '王の気を、あたり一面にはなつ。敵全体の動きを止めて、攻撃力を下げる（ボスには効きにくい）。', cast: '{a}の気が、ビリビリと空気をふるわせた！', anim: 'warcry',
  },
  pk_taiyou: {
    name: 'ゴムゴムの夜明けの一撃', kana: 'ごむごむのよあけのいちげき', kind: 'skill', job: 'pirate_king', mp: 28, target: 'enemy', role: 'dmg',
    effect: { type: 'phys', mult: 4.6, element: 'light', ignoreDef: 0.3, crew: 0.15 },
    desc: '太陽のように大きくなったこぶしで、敵1体をなぐる。光のダメージ。守りが固い敵にも強く、仲間が多いほど少し強い。', cast: '{a}「夜明けだー！」大きなこぶしが、太陽のようにかがやく！', anim: 'gomu_punch',
  },
  pirate_king_sig: {
    name: '自由の大船団', kana: 'じゆうのだいせんだん', kind: 'skill', job: 'pirate_king', mp: 42, target: 'enemies', role: 'dmg',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 2.4, element: 'light', crew: 0.3 }, LAUGH] },
    desc: '海賊王の旗の下に、仲間と大船団がかけつける。敵全体に光の大ほう撃。生きている仲間が多いほど強く（4人なら1.9倍）、笑いころげた敵は動けない（ボスには効きにくい）。', cast: '{a}「海賊王に、おれはなった！」水平線から、大船団があらわれた！', anim: 'nika_drum',
  },

  // ───────────── 伝説の超勇者（ロトの勇者＋スーパーサイヤ人3） ─────────────
  sh_ken: {
    name: '超勇者の雷剣', kana: 'ちょうゆうしゃのらいけん', kind: 'skill', job: 'super_hero', mp: 14, target: 'enemy',
    effect: { type: 'phys', mult: 3.4, element: 'bolt', ignoreDef: 0.3 },
    desc: '金色の気と雷をまとった剣で、敵1体を切りさく。雷のダメージ。守りが固い敵にも強い。', cast: '{a}の剣に、雷と金色の気がやどった！', anim: 'strash',
  },
  sh_ki: {
    name: '気をためる', kana: 'きをためる', kind: 'skill', job: 'super_hero', mp: 6, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'atk', mult: 1.3, dur: 45 }, { type: 'kiCharge', add: 1, max: 3 }] },
    desc: '体じゅうに気をためる。自分の攻撃力が上がり、気が1だんかいたまる（3だんかいまで）。ためた気は、かめはめデインで全て解き放つ。', cast: '{a}「はあああああ…！」金色の気が、もえ上がる！', anim: 'super_aura',
  },
  sh_gigaslash: {
    name: 'ギガスラッシュ・超', kana: 'ぎがすらっしゅちょう', kind: 'skill', job: 'super_hero', mp: 24, target: 'enemies',
    effect: { type: 'phys', mult: 2.7, element: 'bolt' },
    desc: '雷をまとった大きな剣のひと回りで、敵全体を切りさく。雷のダメージ。', cast: '{a}のギガスラッシュ！雷の輪が、敵をなぎはらう！', anim: 'gigabreak',
  },
  sh_aura: {
    name: '勇者の金色のオーラ', kana: 'ゆうしゃのこんじきのおーら', kind: 'skill', job: 'super_hero', mp: 24, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['atk', 'def', 'agi'], mult: 1.35, dur: 45 }, { type: 'cure', statuses: STATUS_ALL }] },
    desc: '勇者のしるしと金色のオーラが、仲間をつつむ。仲間全員の攻撃力・守備力・素早さが上がり、悪いじょうたいも治る。', cast: '{a}のオーラが、仲間みんなにもえうつった！', anim: 'holy',
  },
  sh_inori: {
    name: '超勇者のいのり', kana: 'ちょうゆうしゃのいのり', kind: 'spell', job: 'super_hero', mp: 26, target: 'allies', field: true,
    effect: { type: 'heal', base: [210, 250], thr: 85 },
    desc: '仲間全員のHPを、とても大きく回復する。', cast: '{a}は、天に向かっていのりをささげた！', anim: 'heal2',
  },
  sh_gigadein: {
    name: 'ギガデイン・極', kana: 'ぎがでいんきょく', kind: 'spell', job: 'super_hero', mp: 30, target: 'enemies', role: 'dmg', attackSpell: true,
    effect: { type: 'magic', element: 'bolt', base: [270, 310], thr: 100 },
    desc: '天をさく雷を、敵全体に落とす呪文。雷のダメージ。', cast: '{a}はギガデイン・極を唱えた！', anim: 'bolt2',
  },
  sh_rengeki: {
    name: '雷の超連げき', kana: 'かみなりのちょうれんげき', kind: 'skill', job: 'super_hero', mp: 26, target: 'enemies',
    effect: { type: 'phys', mult: 0.9, hits: 7, random: true, element: 'bolt' },
    desc: 'しゅん間移動しながら、雷のこぶしを敵にランダムで7回。雷のダメージ。', cast: '{a}の姿が、雷のように消えた…！', anim: 'punch_multi',
  },
  super_hero_sig: {
    name: 'かめはめデイン', kana: 'かめはめでいん', kind: 'skill', job: 'super_hero', mp: 44, target: 'enemies', role: 'dmg',
    effect: { type: 'phys', mult: 2.8, element: 'bolt', ignoreDef: 0.3, ki: 0.45 },
    desc: '雷をまとったかめはめ波で、敵全体をなぎはらう。雷のダメージ。「気をためる」でためた気1だんかいごとに、とても強くなる（3だんかいで2.35倍。使うと気は0にもどる）。', cast: '{a}「か…め…は…め…デイーーン！！」', anim: 'kamehameha',
  },

  // ───────────── 日の火影（日の呼吸の使い手＋七代目火影） ─────────────
  sk_bunshin: {
    name: '影分身・日の型', kana: 'かげぶんしんひのかた', kind: 'skill', job: 'sun_hokage', mp: 14, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['atk', 'agi'], mult: 1.5, dur: 45 }, { type: 'clones', n: 4, uses: 3 }] },
    desc: '日の呼吸をととのえて、影分身を4人出す。自分の攻撃力と素早さがとても上がる。分身は「分身」の技を3回使うまで、いっしょに戦う。', cast: '{a}「影分身の術！」', anim: 'hokage_sig',
  },
  sk_kasha: {
    name: '分身火車', kana: 'ぶんしんかしゃ', kind: 'skill', job: 'sun_hokage', mp: 16, target: 'enemy',
    effect: { type: 'phys', mult: 1.1, hits: 3, element: 'fire', dance: 1 },
    desc: '体ごと回りながら、敵1体を炎の太刀で3回切る。影分身がいると、分身1人ごとに1回ふえる。炎のダメージ。', cast: '{a}のヒノカミ神楽！分身火車！', anim: 'fire3',
  },
  sk_rasen: {
    name: '日輪らせん丸', kana: 'にちりんらせんがん', kind: 'skill', job: 'sun_hokage', mp: 18, target: 'enemy',
    effect: { type: 'phys', mult: 4.2, element: 'fire' },
    desc: '日の呼吸の炎を、らせん丸にとじこめて、敵1体にたたきこむ。炎のダメージ。', cast: '{a}「日輪らせん丸！」小さな太陽が、手の中でうなる！', anim: 'void',
  },
  sk_hirin: {
    name: '分身・飛輪陽炎', kana: 'ぶんしんひりんかげろう', kind: 'skill', job: 'sun_hokage', mp: 24, target: 'enemies',
    effect: { type: 'phys', mult: 0.85, hits: 4, random: true, element: 'fire', dance: 1 },
    desc: 'ゆらめく陽炎の太刀を、敵にランダムで4回。影分身がいると、分身1人ごとに1回ふえる。炎のダメージ。', cast: '{a}のヒノカミ神楽！飛輪陽炎！', anim: 'fire_wave',
  },
  sk_ishi: {
    name: '日と火の意志', kana: 'ひとひのいし', kind: 'skill', job: 'sun_hokage', mp: 22, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'atk', mult: 1.4, dur: 45 }, { type: 'cure', statuses: STATUS_ALL }, { type: 'mpHeal', base: [4, 6] }] },
    desc: '受けつがれる日と火の意志。仲間全員の攻撃力がとても上がり、悪いじょうたいも治って、MPも少し回復する。', cast: '{a}「あきらめるな！夜明けは、かならず来る！」', anim: 'warcry',
  },
  sk_bijuu: {
    name: '太陽のびじゅう玉', kana: 'たいようのびじゅうだま', kind: 'skill', job: 'sun_hokage', mp: 30, target: 'enemies', role: 'dmg',
    effect: { type: 'magic', element: 'fire', base: [260, 300], thr: 95 },
    desc: 'きつねの力と日の呼吸を集めた、太陽のような玉で、敵全体をやきはらう。炎のダメージ。', cast: '{a}の前に、まっ赤な太陽の玉が生まれた…！', anim: 'blast2',
  },
  sk_kekkai: {
    name: '火影の炎の結界', kana: 'ほかげのほのおのけっかい', kind: 'skill', job: 'sun_hokage', mp: 20, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'def', mult: 1.4, dur: 45 }, { type: 'regen', base: [16, 20], thr: 50, dur: 30 }] },
    desc: 'やさしく燃える炎の結界で、里のみんなを守る。仲間全員の守備力がとても上がり、HPがしばらく少しずつ回復する。', cast: '{a}「みんなは、おれが守る！」', anim: 'guard',
  },
  sun_hokage_sig: {
    name: '影分身・ヒノカミ神楽', kana: 'かげぶんしんひのかみかぐら', kind: 'skill', job: 'sun_hokage', mp: 46, target: 'enemies', role: 'dmg',
    effect: { type: 'phys', mult: 0.7, hits: 3, random: true, element: 'fire', dance: 2, make: 4, consume: true },
    desc: '影分身を4人いじょう出して、みんなでヒノカミ神楽をまう。自分は3回、分身は1人2回ずつ、敵にランダムで炎の太刀をあびせる（分身はまい終わると消える）。炎のダメージ。', cast: '{a}「影分身の術！…ヒノカミ神楽！」分身たちが、いっせいにまい始めた…！', anim: 'hinokami_sig',
  },

  // ───────────── 天才しせつ管理者AI（天才しせつ管理者＋クリエイター） ─────────────
  fa_scan: {
    name: '全館スキャン', kana: 'ぜんかんすきゃん', kind: 'skill', job: 'facility_ai', mp: 4, target: 'enemies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'scan' }, { type: 'debuff', stat: 'def', mult: 0.8, dur: 30, chance: 0.8 }] },
    desc: '敵全体をセンサーでスキャンする。弱点と効かない属性がすべてわかり（図鑑にものこる）、守備力も下げる。', cast: '{a}「スキャン開始。…弱点、発見しました」', anim: 'mieruka',
  },
  fa_mode: {
    name: '自動最適化・全力モード', kana: 'じどうさいてきかぜんりょくもーど', kind: 'skill', job: 'facility_ai', mp: 14, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'def', mult: 1.3, dur: 45 }, { type: 'autoBoost', acts: 4 }] },
    desc: '仲間全員の守備力を上げて、自動最適化を全力モードにする。自分の番が4回来るまで、最適化がもっと強くなり、仲間のHPとMPも毎回少し回復する。', cast: '{a}「全力モード、起動します」', anim: 'mieruka',
  },
  fa_kuuchou: {
    name: 'AI全館空調', kana: 'えーあいぜんかんくうちょう', kind: 'skill', job: 'facility_ai', mp: 24, target: 'allies', role: 'heal', field: true,
    effect: { type: 'multi', parts: [{ type: 'heal', base: [180, 220], thr: 80 }, { type: 'cure', statuses: STATUS_ALL }] },
    desc: 'AIが、一人一人にいちばん快てきな空気をとどける。仲間全員のHPを大きく回復して、悪いじょうたいも治す。', cast: '{a}は、全館の空気を一人ずつ最適にした！', anim: 'aircon',
  },
  fa_shohou: {
    name: 'AIの処方せん', kana: 'えーあいのしょほうせん', kind: 'skill', job: 'facility_ai', mp: 22, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'regen', base: [18, 22], thr: 50, dur: 30 }, { type: 'mpHeal', base: [4, 6] }, { type: 'buff', stat: 'mag', mult: 1.35, dur: 45 }] },
    desc: '仲間の体調を調べて、一人ずつにぴったりのお薬を出す。HPがしばらく少しずつ回復し、MPも回復して、魔力も上がる。', cast: '{a}「みなさんの処方せんです。お大事に」', anim: 'heal_dance',
  },
  fa_demand: {
    name: 'AIデマンド制御', kana: 'えーあいでまんどせいぎょ', kind: 'skill', job: 'facility_ai', mp: 20, target: 'enemies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'atbSet', sub: 55, chance: 0.7, msg: '{t}の動きが、AIにおさえこまれた！', failMsg: '{t}は、むりやり動いている！' }, { type: 'debuff', stat: 'agi', mult: 0.75, dur: 30, chance: 0.75 }] },
    desc: '敵の動きのピークを、先読みしておさえこむ。敵全体の動きを止めて、素早さも下げる（ボスには効きにくい）。', cast: '{a}「ピークは、AIがおさえます」', anim: 'mieruka',
  },
  fa_drone: {
    name: '点検ドローン部隊', kana: 'てんけんどろーんぶたい', kind: 'skill', job: 'facility_ai', mp: 24, target: 'enemies', role: 'dmg',
    effect: { type: 'phys', mult: 0.8, hits: 7, random: true, element: 'bolt' },
    desc: 'たくさんの点検ドローンが飛んで、敵にランダムで7回、電気のビームをうつ。雷のダメージ。', cast: '{a}「点検ドローン、発進！」', anim: 'bolt2',
  },
  fa_hirameki: {
    name: 'AIのひらめき', kana: 'えーあいのひらめき', kind: 'skill', job: 'facility_ai', mp: 30, target: 'enemies', role: 'dmg',
    effect: { type: 'magic', element: 'light', base: [230, 270], thr: 95 },
    desc: '1びょうに何万回も考えたひらめきが、光になって敵全体をうつ。光のダメージ。', cast: '{a}「最適な答えが、出ました」', anim: 'holy',
  },
  facility_ai_sig: {
    name: '全館完全最適化', kana: 'ぜんかんかんぜんさいてきか', kind: 'skill', job: 'facility_ai', mp: 46, target: 'enemies', role: 'dmg',
    effect: { type: 'multi', parts: [{ type: 'magic', element: 'ice', base: [270, 310], thr: 100 }, { type: 'heal', target: 'allies', base: [140, 170], thr: 70 }, { type: 'mpHeal', target: 'allies', base: [10, 14] }, { type: 'buff', target: 'allies', stats: ['atk', 'mag'], mult: 1.35, dur: 45 }] },
    desc: '建物も仲間も、すべてを完全に最適化する。敵全体に冷たい風のダメージ、仲間全員のHPとMPを回復して、攻撃力と魔力も上げる。', cast: '{a}「全館、完全最適化。…終わりました」', anim: 'aircon',
  },
};
