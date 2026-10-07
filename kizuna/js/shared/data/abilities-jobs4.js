// 2026年10月（第21回）の 新しい 職業の 技
//  ニート → 中二病 → ダ天使、サイヤ人 → スーパーサイヤ人 → スーパーサイヤ人2 → スーパーサイヤ人3、
//  会社員 → 設備屋 → ryonetsu、海賊 → ゴム人間 → ニカ、ユーチューバー → 人気配信者、ゲーマー → プロゲーマー、魔王
//
// きまり（abilities-jobs3.js の 見なおしと おなじ）
//  ・どの 職業にも 攻撃技（基本職は 3つ いじょう、上級職・超級職・伝説の職業は 2つ いじょう）
//  ・みんなに かける 補助は 基本職 1.15倍・上級職 1.25倍・超級職 1.3〜1.4倍まで（自分だけの 補助は もう少し 強い）
//  ・全体・グループの 技は、同じ くらいの MPの 1体の 技より 1体あたり 弱く
// 新しい こうか（battle.js）
//  ・buff の stat: 'mag' … 魔力（攻撃呪文の 威力）が 上がる
//  ・hurt … 自分たちも 少し ダメージ（炎上。HPは 1より へらない）

const STATUS_ALL = ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'];

export const JOB4_ABILITIES = {
  // ───────────── ニート（基本職。職業レベルが 上がりやすい） ─────────────
  ne_makura: {
    name: 'まくら投げ', kana: 'まくらなげ', kind: 'skill', job: 'neet', mp: 1, target: 'enemy',
    effect: { type: 'phys', mult: 1.3 },
    desc: 'お気に入りのまくらを、敵1体に全力で投げつける。', cast: '{a}のまくら投げ！', anim: 'pillow',
  },
  ne_gorogoro: {
    name: 'ゴロゴロする', kana: 'ごろごろする', kind: 'skill', job: 'neet', mp: 2, target: 'self', role: 'heal',
    effect: { type: 'heal', base: [32, 42], thr: 14 },
    desc: 'その場でゴロゴロして休む。自分のHPを回復する。', cast: '{a}はゴロゴロしている…', anim: 'heal1',
  },
  ne_potechi: {
    name: 'ポテチばらまき', kana: 'ぽてちばらまき', kind: 'skill', job: 'neet', mp: 3, target: 'group',
    effect: { type: 'magic', base: [12, 17], thr: 14, status: { status: 'blind', chance: 0.3, turns: [2, 3] } },
    desc: 'ポテチのふくろをやぶいて、同じ種類の敵に粉をまきちらす。時々、前が見えなくなる。', cast: '{a}はポテチをばらまいた！', anim: 'hit_all',
  },
  ne_yofukashi: {
    name: '夜ふかし', kana: 'よふかし', kind: 'skill', job: 'neet', mp: 0, target: 'self', role: 'heal',
    effect: { type: 'mpHeal', base: [6, 9] },
    desc: '夜ふかしで目がさえる。自分のMPを少し回復する。', cast: '{a}は夜ふかしをした。目がさえてきた！', anim: 'heal1',
  },
  ne_honki: {
    name: '明日から本気出す', kana: 'あしたからほんきだす', kind: 'skill', job: 'neet', mp: 2, target: 'self',
    effect: { type: 'random', options: ['ne_h_yaru', 'ne_h_ashita'] },
    desc: '本気を出すと決める。本当に出すかどうかは運しだい（出すと、次の攻撃の威力が3倍）。', cast: '{a}「明日から本気出す！」', anim: 'charge',
  },
  ne_guguru: {
    name: 'ネットで調べる', kana: 'ねっとでしらべる', kind: 'skill', job: 'neet', mp: 4, target: 'enemy',
    effect: { type: 'phys', mult: 1.5, ignoreDef: 0.35 },
    desc: '敵1体の弱いところをネットで調べて、そこをつく。守りが固い敵にも強い。', cast: '{a}はネットで{t}の弱点を調べた！', anim: 'hit',
  },
  ne_nidone: {
    name: '二度ね', kana: 'にどね', kind: 'skill', job: 'neet', mp: 5, target: 'self', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [70, 90], thr: 30 }, { type: 'regen', base: [7, 9], thr: 20, dur: 20 }] },
    desc: 'もう一度ねる。自分のHPを大きく回復して、しばらくの間、少しずつ回復する。', cast: '{a}は二度ねをした。ぐうぐう…', anim: 'sleep',
  },
  ne_jersey: {
    name: 'ジャージ旋風', kana: 'じゃーじせんぷう', kind: 'skill', job: 'neet', mp: 6, target: 'enemies',
    effect: { type: 'phys', mult: 0.8 },
    desc: 'ジャージのすそをはためかせて回り、敵全体にぶつかる。', cast: '{a}のジャージ旋風！', anim: 'wind2',
  },
  ne_ippatsu: {
    name: '一発ぎゃく転', kana: 'いっぱつぎゃくてん', kind: 'skill', job: 'neet', mp: 10, target: 'enemies',
    effect: { type: 'phys', mult: 1.15 },
    desc: 'ずっと休んでいたぶんの力を、いっきに出す。敵全体に大きなダメージ。', cast: '{a}「今こそ、本気を出す時！」', anim: 'quake',
  },

  // ───────────── 中二病（上級職） ─────────────
  cu_migite: {
    name: 'ふう印されし右手', kana: 'ふういんされしみぎて', kind: 'skill', job: 'chuuni', mp: 4, target: 'enemy',
    effect: { type: 'phys', mult: 1.8, element: 'dark' },
    desc: '包帯をまいた右手のふう印をとき、敵1体をなぐる。闇のダメージ。', cast: '{a}「くっ…右手がうずく…！」', anim: 'dark_slash',
  },
  cu_jakigan: {
    name: 'じゃ気眼', kana: 'じゃきがん', kind: 'skill', job: 'chuuni', mp: 4, target: 'enemy',
    effect: { type: 'status', status: 'confuse', chance: 0.5, turns: [2, 3] },
    desc: '眼帯の下のじゃ気眼で、敵1体をにらむ。わけが分からなくなることがある。', cast: '{a}は眼帯をずらした！「見るがいい…じゃ気眼！」', anim: 'debuff',
  },
  cu_kokuen: {
    name: 'しっ黒の炎', kana: 'しっこくのほのお', kind: 'spell', job: 'chuuni', mp: 8, target: 'group',
    effect: { type: 'magic', element: 'dark', base: [58, 72], thr: 50 },
    desc: 'しっ黒の炎（と自分でよんでいる）で、同じ種類の敵をつつむ。闇のダメージ。', cast: '{a}「もえろ、しっ黒の炎よ！」', anim: 'chuuni_flame',
  },
  cu_note: {
    name: '設定ノート', kana: 'せっていのーと', kind: 'skill', job: 'chuuni', mp: 5, target: 'self',
    effect: { type: 'random', options: ['cu_n_mahou', 'cu_n_tate', 'cu_n_mujun'] },
    desc: '自分で書いた設定ノートを読み上げる。何が起こるかは運しだい。', cast: '{a}は設定ノートを開いた…', anim: 'cards',
  },
  cu_kurorekishi: {
    name: '黒歴史', kana: 'くろれきし', kind: 'skill', job: 'chuuni', mp: 7, target: 'enemies',
    effect: { type: 'atbSet', sub: 40, chance: 0.55, msg: '{t}はあきれて動けない！', failMsg: '{t}は聞いていなかった。' },
    desc: '昔の黒歴史を語り出す。敵全体があきれて、動きが止まる（ボスには効きにくい）。', cast: '{a}は昔の話を始めた…', anim: 'laugh',
  },
  cu_wagana: {
    name: '我が名は', kana: 'わがなは', kind: 'skill', job: 'chuuni', mp: 6, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'mag', mult: 1.3, dur: 35 }, { type: 'buff', stat: 'eva', add: 0.2, dur: 35 }] },
    desc: 'かっこいい名乗りを上げる。自分の魔力が上がり、身をかわしやすくなる。', cast: '{a}「我が名は…やみの王！」', anim: 'warcry',
  },
  cu_judgment: {
    name: 'ジャッジメント・ブラック', kana: 'じゃっじめんとぶらっく', kind: 'spell', job: 'chuuni', mp: 16, target: 'enemies',
    effect: { type: 'magic', element: 'dark', base: [88, 106], thr: 70 },
    desc: '最強の技（と自分で決めた）。黒い光が敵全体をつらぬく。闇のダメージ。', cast: '{a}「ジャッジメント・ブラック！」', anim: 'chuuni_flame',
  },

  // ───────────── ダ天使（超級職） ─────────────
  dt_hane: {
    name: '黒い羽根', kana: 'くろいはね', kind: 'spell', job: 'datenshi', mp: 10, target: 'enemies',
    effect: { type: 'magic', element: 'dark', base: [78, 95], thr: 70 },
    desc: '黒い羽根をまきちらして、敵全体をきりさく。闇のダメージ。', cast: '{a}は黒い羽根をまきちらした！', anim: 'dark_wings',
  },
  dt_hohoemi: {
    name: '天使のほほえみ', kana: 'てんしのほほえみ', kind: 'spell', job: 'datenshi', mp: 12, target: 'allies', field: true,
    effect: { type: 'heal', base: [80, 100], thr: 60 },
    desc: 'まだ心にのこっている天使のほほえみで、仲間全員のHPを回復する。', cast: '{a}は天使のようにほほえんだ…', anim: 'heal2',
  },
  dt_keiyaku: {
    name: '禁断のけい約', kana: 'きんだんのけいやく', kind: 'skill', job: 'datenshi', mp: 6, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'mag', mult: 1.45, dur: 40 }, { type: 'charge', mult: 1, hpCost: 0.15 }] },
    desc: 'やみとの禁断のけい約。自分のHPを少しけずって、魔力が大きく上がる。', cast: '{a}はやみとけい約をむすんだ…！', anim: 'dark1',
  },
  dt_ochita: {
    name: '落ちた光', kana: 'おちたひかり', kind: 'spell', job: 'datenshi', mp: 16, target: 'enemy',
    effect: { type: 'magic', element: 'dark', base: [185, 220], thr: 80 },
    desc: '天から落ちた黒い光で、敵1体に大きなダメージ。闇のダメージ。', cast: '{a}は天をあおいだ…黒い光が落ちてくる！', anim: 'dark1',
  },
  dt_tsubasa: {
    name: '黒いつばさ', kana: 'くろいつばさ', kind: 'skill', job: 'datenshi', mp: 14, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'def', mult: 1.3, dur: 40 }, { type: 'buff', stat: 'eva', add: 0.1, dur: 40 }] },
    desc: '黒いつばさで仲間全員をつつむ。守備力が上がり、少し身をかわしやすくなる。', cast: '{a}は大きな黒いつばさを広げた！', anim: 'dark_wings',
  },
  dt_darkangel: {
    name: 'ダークエンジェル', kana: 'だーくえんじぇる', kind: 'spell', job: 'datenshi', mp: 28, target: 'enemies', role: 'dmg',
    effect: { type: 'multi', parts: [{ type: 'magic', element: 'dark', base: [165, 195], thr: 85 }, { type: 'debuff', stat: 'def', mult: 0.85, dur: 30, chance: 0.6 }] },
    desc: 'ダ天使の本気。闇の光が敵全体をつつみ、大きなダメージ。時々、守備力も下がる。', cast: '{a}の背中に、黒い光のつばさが広がった…！', anim: 'dark_wings',
  },

  // ───────────── サイヤ人（基本職） ─────────────
  sy_kidan: {
    name: '気だん', kana: 'きだん', kind: 'skill', job: 'saiyan', mp: 1, target: 'enemy',
    effect: { type: 'phys', mult: 1.25 },
    desc: '手のひらに気をためて、敵1体に気だんを打つ。', cast: '{a}の気だん！', anim: 'ki_blast',
  },
  sy_kiai: {
    name: '気を高める', kana: 'きをたかめる', kind: 'skill', job: 'saiyan', mp: 0, target: 'self',
    effect: { type: 'charge', mult: 2.0 },
    desc: '自分の体の中の気を高める。次の攻撃の威力が2倍になる。', cast: '{a}は気を高めている…！', anim: 'super_aura',
  },
  sy_renzoku: {
    name: '連続エネルギーだん', kana: 'れんぞくえねるぎーだん', kind: 'skill', job: 'saiyan', mp: 5, target: 'enemies',
    effect: { type: 'phys', mult: 0.45, hits: 5, random: true },
    desc: '気だんを、敵にランダムで5回打ちこむ。', cast: '{a}の連続エネルギーだん！', anim: 'ki_blast',
  },
  sy_taiyou: {
    name: '太陽拳', kana: 'たいようけん', kind: 'skill', job: 'saiyan', mp: 4, target: 'enemies',
    effect: { type: 'status', status: 'blind', chance: 0.5, turns: [2, 4] },
    desc: '太陽のようにまぶしい光で、敵全体の目をくらませる。', cast: '{a}「太陽拳！」', anim: 'holy',
  },
  sy_kamehameha: {
    name: 'かめはめ波', kana: 'かめはめは', kind: 'skill', job: 'saiyan', mp: 8, target: 'enemy',
    effect: { type: 'phys', mult: 2.2 },
    desc: 'りょう手に集めた気を、敵1体にいっきに放つ。', cast: '{a}「か…め…は…め…波ーっ！」', anim: 'kamehameha',
  },
  sy_bukuu: {
    name: 'ぶ空術', kana: 'ぶくうじゅつ', kind: 'skill', job: 'saiyan', mp: 4, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'eva', add: 0.2, dur: 30 }, { type: 'buff', stat: 'agi', mult: 1.2, dur: 30 }] },
    desc: '空にうかび上がる。自分の素早さが上がり、身をかわしやすくなる。', cast: '{a}は空にうかび上がった！', anim: 'buff',
  },
  sy_ozaru: {
    name: '大ザル変身', kana: 'おおざるへんしん', kind: 'skill', job: 'saiyan', mp: 6, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'atk', mult: 1.4, dur: 30 }, { type: 'buff', stat: 'def', mult: 1.2, dur: 30 }] },
    desc: 'まるい月を思いうかべて大ザルに！自分の攻撃力と守備力が上がる。', cast: '{a}は大ザルのような力をみなぎらせた！', anim: 'warcry',
  },
  sy_rush: {
    name: 'ラッシュ', kana: 'らっしゅ', kind: 'skill', job: 'saiyan', mp: 6, target: 'enemy',
    effect: { type: 'phys', mult: 0.6, hits: 4 },
    desc: '目にもとまらぬ連打で、敵1体に4回攻撃する。', cast: '{a}のラッシュ！', anim: 'punch_multi',
  },
  sy_bigbang: {
    name: 'ビッグバンアタック', kana: 'びっぐばんあたっく', kind: 'skill', job: 'saiyan', mp: 12, target: 'enemies',
    effect: { type: 'phys', mult: 1.2 },
    desc: '大きな気の玉を投げつけて、敵全体に大きなダメージ。', cast: '{a}のビッグバンアタック！', anim: 'kamehameha',
  },

  // ───────────── スーパーサイヤ人（上級職） ─────────────
  sz_kame: {
    name: '超かめはめ波', kana: 'ちょうかめはめは', kind: 'skill', job: 'super_saiyan', mp: 10, target: 'enemy',
    effect: { type: 'phys', mult: 2.3 },
    desc: '金色の気をこめたかめはめ波で、敵1体に大きなダメージ。', cast: '{a}「か…め…は…め…波ーっ！！」', anim: 'kamehameha',
  },
  sz_aura: {
    name: '金色のオーラ', kana: 'こんじきのおーら', kind: 'skill', job: 'super_saiyan', mp: 6, target: 'self', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.3, dur: 35 },
    desc: '金色のオーラをまとう。自分の攻撃力と素早さが上がる。', cast: '{a}の体から、金色のオーラがふき出した！', anim: 'super_aura',
  },
  sz_kikouha: {
    name: '気功波', kana: 'きこうは', kind: 'skill', job: 'super_saiyan', mp: 9, target: 'enemies',
    effect: { type: 'phys', mult: 1.1 },
    desc: '広く気を放って、敵全体にダメージ。', cast: '{a}の気功波！', anim: 'ki_blast',
  },
  sz_zanzou: {
    name: '残像拳', kana: 'ざんぞうけん', kind: 'skill', job: 'super_saiyan', mp: 4, target: 'self', role: 'sup',
    effect: { type: 'buff', stat: 'eva', add: 0.3, dur: 30 },
    desc: '速すぎて残像が見えるほど。自分が身をかわしやすくなる。', cast: '{a}の姿が、いくつにも見える！', anim: 'buff',
  },
  sz_ikari: {
    name: 'いかりのかくせい', kana: 'いかりのかくせい', kind: 'skill', job: 'super_saiyan', mp: 5, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'charge', mult: 2.5 }, { type: 'buff', stat: 'agi', mult: 1.2, dur: 30 }] },
    desc: 'いかりで力がかくせいする。次の攻撃の威力が2.5倍になり、自分の素早さも上がる。', cast: '{a}のいかりが、ばく発した！', anim: 'super_aura',
  },
  sz_final: {
    name: 'ファイナルフラッシュ', kana: 'ふぁいなるふらっしゅ', kind: 'skill', job: 'super_saiyan', mp: 15, target: 'enemy',
    effect: { type: 'phys', mult: 2.7, ignoreDef: 0.25 },
    desc: 'りょう手を前につき出し、敵1体にまぶしい気のビーム。守りが固い敵にも強い。', cast: '{a}「ファイナルフラッシュ！」', anim: 'kamehameha',
  },
  sz_renzoku: {
    name: 'れんぞく気功波', kana: 'れんぞくきこうは', kind: 'skill', job: 'super_saiyan', mp: 18, target: 'enemies',
    effect: { type: 'phys', mult: 0.6, hits: 7, random: true },
    desc: '気功波を、敵にランダムで7回打ちこむ。', cast: '{a}のれんぞく気功波！', anim: 'ki_blast',
  },

  // ───────────── スーパーサイヤ人2（超級職） ─────────────
  s2_spark: {
    name: 'スパーク', kana: 'すぱーく', kind: 'skill', job: 'ss2', mp: 8, target: 'enemy',
    effect: { type: 'phys', mult: 2.0, element: 'bolt' },
    desc: '体のまわりの青いいなずまごと、敵1体をなぐる。雷のダメージ。', cast: '{a}の体から、いなずまが走った！', anim: 'bolt2',
  },
  s2_kame: {
    name: 'かめはめ波・スパーク', kana: 'かめはめはすぱーく', kind: 'skill', job: 'ss2', mp: 14, target: 'enemy',
    effect: { type: 'phys', mult: 3.0, element: 'bolt' },
    desc: 'いなずまをまとったかめはめ波で、敵1体に大きなダメージ。雷のダメージ。', cast: '{a}「か…め…は…め…波ーっ！！」', anim: 'kamehameha',
  },
  s2_aura: {
    name: '黄金のスパーク', kana: 'おうごんのすぱーく', kind: 'skill', job: 'ss2', mp: 10, target: 'self', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'def', 'agi'], mult: 1.4, dur: 40 },
    desc: '黄金の気といなずまをまとう。自分の攻撃力・守備力・素早さが大きく上がる。', cast: '{a}の気が、さらにはね上がった！', anim: 'super_aura',
  },
  s2_rush: {
    name: 'いかりのラッシュ', kana: 'いかりのらっしゅ', kind: 'skill', job: 'ss2', mp: 12, target: 'enemy',
    effect: { type: 'phys', mult: 0.75, hits: 5 },
    desc: 'いかりの連打で、敵1体に5回攻撃する。', cast: '{a}のいかりのラッシュ！', anim: 'punch_multi',
  },
  s2_kiaihou: {
    name: '気合いほう', kana: 'きあいほう', kind: 'skill', job: 'ss2', mp: 14, target: 'enemies', role: 'dmg',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 0.9 }, { type: 'atbSet', sub: 35, chance: 0.55, msg: '{t}はふきとばされて動けない！', failMsg: '{t}はふみとどまった！' }] },
    desc: '気合いだけで敵全体をふきとばす。動きも止まる（ボスには効きにくい）。', cast: '{a}「はあああっ！」', anim: 'super_aura',
  },
  s2_final: {
    name: 'ファイナルかめはめ波', kana: 'ふぁいなるかめはめは', kind: 'skill', job: 'ss2', mp: 26, target: 'enemies',
    effect: { type: 'phys', mult: 1.9, element: 'bolt' },
    desc: 'ありったけの気をこめたかめはめ波で、敵全体に大きなダメージ。雷のダメージ。', cast: '{a}「これで終わりだ…！ファイナルかめはめ波！」', anim: 'kamehameha',
  },

  // ───────────── スーパーサイヤ人3（伝説の職業） ─────────────
  s3_ryuuken: {
    name: '竜拳', kana: 'りゅうけん', kind: 'skill', job: 'ss3', mp: 14, target: 'enemy',
    effect: { type: 'phys', mult: 3.2 },
    desc: '金色の竜のような気をまとって、敵1体をつらぬく。', cast: '{a}「竜拳！」金色の竜が、まいおどる！', anim: 'dragon_beam',
  },
  s3_kame: {
    name: 'かめはめ波・極', kana: 'かめはめはきょく', kind: 'skill', job: 'ss3', mp: 18, target: 'enemy',
    effect: { type: 'phys', mult: 3.6, ignoreDef: 0.3 },
    desc: '極めたかめはめ波で、敵1体にとても大きなダメージ。守りが固い敵にも強い。', cast: '{a}「か…め…は…め…波ーーっ！！！」', anim: 'kamehameha',
  },
  s3_aura: {
    name: '超サイヤ人3のオーラ', kana: 'ちょうさいやじんすりーのおーら', kind: 'skill', job: 'ss3', mp: 14, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['atk', 'def', 'agi'], mult: 1.5, dur: 45 }, { type: 'heal', base: [120, 150], thr: 60 }] },
    desc: '長い金色のかみが、さか立つ。自分の攻撃力・守備力・素早さがとても上がり、HPも回復する。', cast: '{a}の気が、大地をゆらしている…！', anim: 'super_aura',
  },
  s3_shunkan: {
    name: 'しゅん間移動', kana: 'しゅんかんいどう', kind: 'skill', job: 'ss3', mp: 12, target: 'enemy',
    effect: { type: 'phys', mult: 1.8, atbAfter: 60 },
    desc: 'しゅん間移動で後ろに回り、敵1体を攻撃する。すぐに次の番が来る。', cast: '{a}の姿が消えた…！', anim: 'slash_fast',
  },
  s3_rengeki: {
    name: '超サイヤ人3の連げき', kana: 'ちょうさいやじんすりーのれんげき', kind: 'skill', job: 'ss3', mp: 20, target: 'enemies',
    effect: { type: 'phys', mult: 0.85, hits: 6, random: true },
    desc: '目にもとまらぬ連げきを、敵にランダムで6回。', cast: '{a}の連げき！', anim: 'punch_multi',
  },
  s3_genki: {
    name: '元気玉', kana: 'げんきだま', kind: 'skill', job: 'ss3', mp: 30, target: 'enemies', noAuto: true, role: 'dmg',
    effect: { type: 'gather', element: 'light', base: [170, 200], per: 60, take: 8, thr: 70 },
    desc: '生きている仲間からMPを8ずつ集め、敵全体に大きな光の玉をぶつける。集まった仲間が多いほど強い（オートでは使わない）。', cast: '{a}「みんな、オラに元気を分けてくれ！」', anim: 'meteor',
  },

  // ───────────── 設備屋（上級職） ─────────────
  sb_spanner: {
    name: 'スパナアタック', kana: 'すぱなあたっく', kind: 'skill', job: 'setsubiya', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.7 },
    desc: '仕事道具のスパナで、敵1体をたたく。', cast: '{a}のスパナアタック！', anim: 'hit',
  },
  sb_tenken: {
    name: '点検', kana: 'てんけん', kind: 'skill', job: 'setsubiya', mp: 4, target: 'ally', role: 'heal', field: true,
    effect: { type: 'multi', parts: [{ type: 'cure', statuses: STATUS_ALL }, { type: 'heal', base: [40, 55], thr: 30 }] },
    desc: '仲間1人の体を点検して、悪いじょうたいを治し、HPも少し回復する。', cast: '{a}は{t}を点検した。「ここが悪いですね」', anim: 'heal1',
  },
  sb_haikan: {
    name: '配管修理', kana: 'はいかんしゅうり', kind: 'skill', job: 'setsubiya', mp: 8, target: 'allies', role: 'heal',
    effect: { type: 'regen', base: [8, 11], thr: 30, dur: 24 },
    desc: '仲間全員の体の配管を直す。しばらくの間、HPが少しずつ回復する。', cast: '{a}は配管をてきぱきと直した！', anim: 'heal_dance',
  },
  sb_aircon: {
    name: 'エアコン全開', kana: 'えあこんぜんかい', kind: 'skill', job: 'setsubiya', mp: 10, target: 'enemies',
    effect: { type: 'magic', element: 'ice', base: [52, 66], thr: 45 },
    desc: 'エアコンを全開にして、冷たい風で敵全体をこおらせる。氷のダメージ。', cast: '{a}はエアコンを全開にした！', anim: 'aircon',
  },
  sb_shiunten: {
    name: '試運転', kana: 'しうんてん', kind: 'skill', job: 'setsubiya', mp: 8, target: 'allies', role: 'sup',
    effect: { type: 'atbSet', add: 30, msg: '{t}の動きがよくなった！' },
    desc: '仲間全員の調子を試運転でたしかめる。行動の順番が少し早く来る。', cast: '{a}「試運転、始めます！」', anim: 'buff',
  },
  sb_duct: {
    name: 'ダクトそうじ', kana: 'だくとそうじ', kind: 'skill', job: 'setsubiya', mp: 6, target: 'enemies',
    effect: { type: 'status', status: 'blind', chance: 0.5, turns: [2, 4] },
    desc: 'ダクトをそうじして、たまったほこりを敵全体にまきちらす。前が見えなくなることがある。', cast: '{a}はダクトのほこりをはらった！', anim: 'wind1',
  },
  sb_kouji: {
    name: '大工事', kana: 'だいこうじ', kind: 'skill', job: 'setsubiya', mp: 16, target: 'enemies',
    effect: { type: 'phys', mult: 1.35, ignoreDef: 0.25 },
    desc: '大きな工事で、敵全体に重い一撃。守りが固い敵にも強い。', cast: '{a}「工事、開始！」', anim: 'quake',
  },

  // ───────────── ryonetsu（超級職。空調と省エネの プロ） ─────────────
  rn_koushin: {
    name: '空調こう新', kana: 'くうちょうこうしん', kind: 'skill', job: 'ryonetsu', mp: 12, target: 'allies', role: 'sup',
    effect: { type: 'buff', stats: ['def', 'agi'], mult: 1.25, dur: 40 },
    desc: '古い空調を新しくして、仲間全員を快てきに。守備力と素早さが上がる。', cast: '{a}は空調を新しくした！とても快てきだ！', anim: 'aircon',
  },
  rn_chiller: {
    name: 'GHPチラー', kana: 'じーえいちぴーちらー', kind: 'skill', job: 'ryonetsu', mp: 16, target: 'enemies',
    effect: { type: 'magic', element: 'ice', base: [118, 142], thr: 75 },
    desc: 'GHPチラーで作った冷たい水で、敵全体をこおりつかせる。氷のダメージ。', cast: '{a}はGHPチラーを動かした！', anim: 'ice2',
  },
  rn_kanki: {
    name: 'かん気改善', kana: 'かんきかいぜん', kind: 'skill', job: 'ryonetsu', mp: 10, target: 'allies', role: 'heal', field: true,
    effect: { type: 'multi', parts: [{ type: 'cure', statuses: STATUS_ALL }, { type: 'heal', base: [70, 90], thr: 50 }] },
    desc: '空気を入れかえて、仲間全員の悪いじょうたいを治し、HPも回復する。', cast: '{a}はかん気を改善した！さわやかな風がふく！', anim: 'heal_dance',
  },
  rn_shoene: {
    name: '省エネ提案', kana: 'しょうえねていあん', kind: 'skill', job: 'ryonetsu', mp: 6, target: 'allies', role: 'heal',
    effect: { type: 'mpHeal', base: [8, 12] },
    desc: 'むだを省くエコな提案。仲間全員のMPを回復する。', cast: '{a}は省エネを提案した！', anim: 'heal1',
  },
  rn_netsugen: {
    name: '熱源こう新', kana: 'ねつげんこうしん', kind: 'skill', job: 'ryonetsu', mp: 18, target: 'enemy',
    effect: { type: 'magic', element: 'fire', base: [215, 255], thr: 80 },
    desc: '新しい熱源の大きな炎で、敵1体を焼く。炎のダメージ。', cast: '{a}は新しい熱源に火を入れた！', anim: 'fire3',
  },
  rn_yochou: {
    name: '予兆保全', kana: 'よちょうほぜん', kind: 'skill', job: 'ryonetsu', mp: 16, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'regen', base: [12, 16], thr: 50, dur: 30 }, { type: 'buff', stat: 'def', mult: 1.2, dur: 30 }] },
    desc: 'こわれる前に手を打つ。仲間全員のHPがしばらく少しずつ回復し、守備力も上がる。', cast: '{a}は予兆をのがさなかった！', anim: 'heal_dance',
  },
  rn_saiteki: {
    name: '最適運転', kana: 'さいてきうんてん', kind: 'skill', job: 'ryonetsu', mp: 28, target: 'enemies', role: 'dmg',
    effect: { type: 'multi', parts: [{ type: 'magic', element: 'ice', base: [165, 195], thr: 85 }, { type: 'heal', target: 'allies', base: [80, 100], thr: 60 }] },
    desc: '建物の空調をすべて最適に動かす。敵全体に冷たい風のダメージをあたえ、仲間全員のHPも回復する。', cast: '{a}は建物のすべてを最適に動かした！', anim: 'aircon',
  },

  // ───────────── ゴム人間（超級職） ─────────────
  go_pistol: {
    name: 'ゴムゴムのピストル', kana: 'ごむごむのぴすとる', kind: 'skill', job: 'rubber', mp: 4, target: 'enemy',
    effect: { type: 'phys', mult: 1.9 },
    desc: 'うでをのばして、敵1体を遠くからなぐる。', cast: '{a}「ゴムゴムの…ピストル！」', anim: 'gomu_punch',
  },
  go_gatling: {
    name: 'ゴムゴムのガトリング', kana: 'ごむごむのがとりんぐ', kind: 'skill', job: 'rubber', mp: 10, target: 'enemies',
    effect: { type: 'phys', mult: 0.5, hits: 7, random: true },
    desc: 'のびるうでで、敵にランダムで7回パンチ。', cast: '{a}「ゴムゴムの…ガトリング！」', anim: 'gomu_gatling',
  },
  go_fusen: {
    name: 'ゴムゴムの風船', kana: 'ごむごむのふうせん', kind: 'skill', job: 'rubber', mp: 6, target: 'self', role: 'sup',
    effect: { type: 'buff', stat: 'def', mult: 1.5, dur: 35 },
    desc: '体を風船のようにふくらませる。自分の守備力が大きく上がる。', cast: '{a}の体が、ぷっくりふくらんだ！', anim: 'guard',
  },
  go_gear2: {
    name: 'ギア2', kana: 'ぎあせかんど', kind: 'skill', job: 'rubber', mp: 10, target: 'self', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.35, dur: 40 },
    desc: '体からゆげが上がるほど血のめぐりを速める。自分の攻撃力と素早さが上がる。', cast: '{a}「ギア2！」体から、ゆげが上がる！', anim: 'super_aura',
  },
  go_bazooka: {
    name: 'ゴムゴムのバズーカ', kana: 'ごむごむのばずーか', kind: 'skill', job: 'rubber', mp: 14, target: 'enemy',
    effect: { type: 'phys', mult: 3.0 },
    desc: 'りょう手をのばしてもどす力で、敵1体を大きくふきとばす。', cast: '{a}「ゴムゴムの…バズーカ！」', anim: 'gomu_punch',
  },
  go_gear3: {
    name: 'ギア3', kana: 'ぎあさーど', kind: 'skill', job: 'rubber', mp: 22, target: 'enemies',
    effect: { type: 'phys', mult: 1.9 },
    desc: 'ほねに空気をふきこんで、うでを大きくふくらませ、敵全体をなぎはらう。', cast: '{a}「ギア3！」大きなうでが、うなりを上げる！', anim: 'gomu_punch',
  },

  // ───────────── ニカ（伝説の職業） ─────────────
  nk_gear5: {
    name: 'ギア5', kana: 'ぎあふぃふす', kind: 'skill', job: 'nika', mp: 16, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['atk', 'def', 'agi'], mult: 1.5, dur: 45 }, { type: 'heal', base: [150, 180], thr: 60 }] },
    desc: '心ぞうが、解放のドラムを打ち鳴らす。自分の攻撃力・守備力・素早さがとても上がり、HPも回復する。', cast: 'ドンドットット♪ {a}の姿が、白くかがやいた！', anim: 'nika_drum',
  },
  nk_drum: {
    name: '解放のドラム', kana: 'かいほうのどらむ', kind: 'skill', job: 'nika', mp: 18, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['atk', 'agi'], mult: 1.3, dur: 45 }, { type: 'cure', statuses: STATUS_ALL }, { type: 'bondUp', amount: 30 }] },
    desc: '楽しいドラムのリズム。仲間全員の攻撃力と素早さが上がり、悪いじょうたいも治って、きずなゲージもふえる。', cast: 'ドンドットット♪ 楽しいリズムがひびきわたる！', anim: 'nika_drum',
  },
  nk_kaminari: {
    name: '雷をつかむ', kana: 'かみなりをつかむ', kind: 'skill', job: 'nika', mp: 20, target: 'enemies',
    effect: { type: 'phys', mult: 1.8, element: 'bolt' },
    desc: '空から雷をつかみとって、敵全体に投げつける。雷のダメージ。', cast: '{a}は空から雷をつかみとった！', anim: 'bolt2',
  },
  nk_taiyou: {
    name: 'ゴムゴムの太陽のパンチ', kana: 'ごむごむのたいようのぱんち', kind: 'skill', job: 'nika', mp: 22, target: 'enemy',
    effect: { type: 'phys', mult: 4.2, element: 'light' },
    desc: '太陽の神の力で大きくなった手で、敵1体をなぐる。光のダメージ。', cast: '{a}の手が、太陽のように大きくなった！', anim: 'gomu_punch',
  },
  nk_warai: {
    name: 'ニカの笑い声', kana: 'にかのわらいごえ', kind: 'skill', job: 'nika', mp: 22, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [150, 180], thr: 70 }, { type: 'regen', base: [14, 18], thr: 50, dur: 30 }] },
    desc: 'ニカの楽しそうな笑い声。仲間全員のHPを回復して、しばらく少しずつ回復する。', cast: '{a}「ししし！」笑い声に、みんなが元気になる！', anim: 'nika_drum',
  },
  nk_kaihou: {
    name: '解放の戦士', kana: 'かいほうのせんし', kind: 'skill', job: 'nika', mp: 30, target: 'enemies', role: 'dmg',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 2.4, element: 'light' }, { type: 'atbSet', sub: 40, chance: 0.6, msg: '{t}はふり回されて動けない！', failMsg: '{t}はたえた！' }] },
    desc: '太陽の神ニカの力で、敵全体を自由自在にふり回す。光のダメージで、動きも止まる（ボスには効きにくい）。', cast: '{a}は、敵をつかんで自由自在にふり回した！', anim: 'nika_drum',
  },

  // ───────────── ユーチューバー（基本職） ─────────────
  yt_jidori: {
    name: '自どり棒アタック', kana: 'じどりぼうあたっく', kind: 'skill', job: 'youtuber', mp: 1, target: 'enemy',
    effect: { type: 'phys', mult: 1.3 },
    desc: '自どり棒をのばして、敵1体をたたく。', cast: '{a}の自どり棒アタック！', anim: 'hit',
  },
  yt_live: {
    name: '生配信', kana: 'なまはいしん', kind: 'skill', job: 'youtuber', mp: 4, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'bondUp', amount: 10 }, { type: 'buff', stat: 'atk', mult: 1.1, dur: 30 }] },
    desc: '戦いを生配信。見ている人のおうえんで、仲間全員の攻撃力が少し上がり、きずなゲージもふえる。', cast: '{a}「生配信、始めまーす！」', anim: 'camera',
  },
  yt_samune: {
    name: 'つりサムネ', kana: 'つりさむね', kind: 'skill', job: 'youtuber', mp: 3, target: 'enemy',
    effect: { type: 'status', status: 'confuse', chance: 0.45, turns: [2, 3] },
    desc: '目立つサムネで、敵1体の気を引く。わけが分からなくなることがある。', cast: '{a}は、ものすごいサムネを見せた！', anim: 'debuff',
  },
  yt_kirinuki: {
    name: '切りぬき動画', kana: 'きりぬきどうが', kind: 'skill', job: 'youtuber', mp: 5, target: 'enemies',
    effect: { type: 'phys', mult: 0.5, hits: 4, random: true },
    desc: '見どころだけを切りぬいて、敵にランダムで4回攻撃する。', cast: '{a}の切りぬき動画！', anim: 'slash_multi',
  },
  yt_superchat: {
    name: 'スパチャ', kana: 'すぱちゃ', kind: 'skill', job: 'youtuber', mp: 0, target: 'self', role: 'heal',
    effect: { type: 'mpHeal', base: [5, 8] },
    desc: '見ている人からのおうえんで、自分のMPが少し回復する。', cast: '{a}にスパチャがとどいた！「ありがとうございます！」', anim: 'superchat',
  },
  yt_enjou: {
    name: '炎上', kana: 'えんじょう', kind: 'skill', job: 'youtuber', mp: 6, target: 'enemies', role: 'dmg',
    effect: { type: 'multi', parts: [{ type: 'magic', element: 'fire', base: [38, 50], thr: 30 }, { type: 'hurt', target: 'allies', base: [4, 8], msg: '{t}も少しやけどした…' }] },
    desc: 'わざと大さわぎを起こして、敵全体を炎で焼く。仲間全員も少しやけどする（HPは1よりへらない）。', cast: '{a}の動画が大炎上！', anim: 'flame_up',
  },
  yt_kikaku: {
    name: '大型きかく', kana: 'おおがたきかく', kind: 'skill', job: 'youtuber', mp: 6, target: 'self',
    effect: { type: 'random', options: ['yt_k_buzz', 'yt_k_collab', 'yt_k_hazure'] },
    desc: '大型きかくの動画をとる。バズるか、すべるかは運しだい。', cast: '{a}「今日は大型きかくです！」', anim: 'camera',
  },
  yt_touroku: {
    name: 'チャンネル登録よろしく', kana: 'ちゃんねるとうろくよろしく', kind: 'skill', job: 'youtuber', mp: 6, target: 'enemies',
    effect: { type: 'atbSet', sub: 40, chance: 0.55, msg: '{t}は思わずチャンネル登録している！', failMsg: '{t}は登録しなかった。' },
    desc: '「チャンネル登録よろしく！」敵全体の動きを止める（ボスには効きにくい）。', cast: '{a}「チャンネル登録、よろしくお願いします！」', anim: 'hearts',
  },
  yt_hyakuman: {
    name: '100万回再生', kana: 'ひゃくまんかいさいせい', kind: 'skill', job: 'youtuber', mp: 12, target: 'enemies',
    effect: { type: 'magic', base: [66, 80], thr: 50 },
    desc: '動画が100万回再生！もり上がったいきおいで、敵全体にダメージ。', cast: '{a}の動画が100万回再生された！', anim: 'superchat',
  },

  // ───────────── 人気配信者（上級職） ─────────────
  st_collab: {
    name: 'コラボ配信', kana: 'こらぼはいしん', kind: 'skill', job: 'streamer', mp: 8, target: 'allies', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.2, dur: 35 },
    desc: 'みんなでコラボ配信。仲間全員の攻撃力と素早さが上がる。', cast: '{a}「今日はすごいコラボです！」', anim: 'camera',
  },
  st_dokkiri: {
    name: 'ドッキリ', kana: 'どっきり', kind: 'skill', job: 'streamer', mp: 4, target: 'enemy',
    effect: { type: 'atbSet', sub: 55, chance: 0.6, msg: '{t}はびっくりして動けない！', failMsg: '{t}はドッキリを見ぬいた！' },
    desc: 'ドッキリをしかけて、敵1体をびっくりさせ、動きを止める（ボスには効きにくい）。', cast: '{a}はドッキリをしかけた！', anim: 'laugh',
  },
  st_daienjou: {
    name: '大炎上', kana: 'だいえんじょう', kind: 'skill', job: 'streamer', mp: 12, target: 'enemies', role: 'dmg',
    effect: { type: 'multi', parts: [{ type: 'magic', element: 'fire', base: [82, 100], thr: 60 }, { type: 'hurt', target: 'allies', base: [8, 14], msg: '{t}もやけどした…' }] },
    desc: 'ネット中が大さわぎ。敵全体を大きな炎で焼く。仲間全員も少しやけどする（HPは1よりへらない）。', cast: '{a}の配信が大炎上！', anim: 'flame_up',
  },
  st_kinen: {
    name: '100万人記念', kana: 'ひゃくまんにんきねん', kind: 'skill', job: 'streamer', mp: 12, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [72, 90], thr: 50 }, { type: 'bondUp', amount: 15 }] },
    desc: '登録者100万人の記念配信。仲間全員のHPを回復し、きずなゲージもふえる。', cast: '{a}「みなさん、本当にありがとう！」', anim: 'heal_dance',
  },
  st_kamikai: {
    name: '神回', kana: 'かみかい', kind: 'skill', job: 'streamer', mp: 8, target: 'self',
    effect: { type: 'random', options: ['st_k_kami', 'st_k_moriagari', 'st_k_jiko'] },
    desc: '伝説の神回をねらう。どうなるかは運しだい。', cast: '{a}「今日の配信は、何かが起こる…！」', anim: 'stage',
  },
  st_nagesen: {
    name: '投げせんの雨', kana: 'なげせんのあめ', kind: 'skill', job: 'streamer', mp: 14, target: 'enemies',
    effect: { type: 'magic', base: [92, 112], thr: 60 },
    desc: 'ふってくるほどの投げせんで、敵全体にコインをぶつける。', cast: '{a}の配信に、投げせんの雨がふる！', anim: 'superchat',
  },
  st_doujisetsuzoku: {
    name: '同時接続100万人', kana: 'どうじせつぞくひゃくまんにん', kind: 'skill', job: 'streamer', mp: 20, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['atk', 'agi'], mult: 1.2, dur: 40 }, { type: 'heal', base: [60, 78], thr: 50 }, { type: 'bondUp', amount: 25 }] },
    desc: '100万人がいっしょに見ている！仲間全員の攻撃力と素早さが上がり、HPも回復して、きずなゲージもふえる。', cast: '同時接続、100万人！コメントがものすごいいきおいで流れる！', anim: 'superchat',
  },

  // ───────────── ゲーマー（基本職） ─────────────
  ga_renda: {
    name: '連打', kana: 'れんだ', kind: 'skill', job: 'gamer', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 0.42, hits: 4 },
    desc: 'ボタン連打！敵1体に4回攻撃する。', cast: '{a}の連打！カチャカチャカチャ！', anim: 'punch_multi',
  },
  ga_save: {
    name: 'セーブポイント', kana: 'せーぶぽいんと', kind: 'skill', job: 'gamer', mp: 5, target: 'allies', role: 'heal',
    effect: { type: 'heal', base: [18, 24], thr: 20 },
    desc: 'セーブポイントでひと休み。仲間全員のHPを少し回復する。', cast: '{a}はセーブポイントを見つけた！', anim: 'heal1',
  },
  ga_bug: {
    name: 'バグ技', kana: 'ばぐわざ', kind: 'skill', job: 'gamer', mp: 4, target: 'self',
    effect: { type: 'random', options: ['ga_b_big', 'ga_b_freeze', 'ga_b_heal', 'ga_b_none'] },
    desc: 'ゲームのバグを使った、ひみつの技。何が起こるかは運しだい。', cast: '{a}はバグ技をためした…', anim: 'glitch',
  },
  ga_kakin: {
    name: '課金アイテム', kana: 'かきんあいてむ', kind: 'skill', job: 'gamer', mp: 4, target: 'self', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.25, dur: 30 },
    desc: '課金アイテムを使う。自分の攻撃力と素早さが上がる。', cast: '{a}は課金アイテムを使った！', anim: 'buff',
  },
  ga_controller: {
    name: 'コントローラーなげ', kana: 'こんとろーらーなげ', kind: 'skill', job: 'gamer', mp: 5, target: 'enemies',
    effect: { type: 'phys', mult: 0.8 },
    desc: 'コードをふり回してコントローラーを投げ、敵全体にぶつける。', cast: '{a}のコントローラーなげ！', anim: 'tackle',
  },
  ga_tetsuya: {
    name: 'てつ夜ゲーム', kana: 'てつやげーむ', kind: 'skill', job: 'gamer', mp: 0, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'charge', mult: 2.0, hpCost: 0.08 }, { type: 'buff', stat: 'agi', mult: 1.2, dur: 30 }] },
    desc: 'てつ夜で集中力が高まる。自分のHPが少しへるが、次の攻撃の威力が2倍になり、素早さも上がる。', cast: '{a}はてつ夜で、目がギラギラしている…', anim: 'charge',
  },
  ga_hame: {
    name: 'ハメ技', kana: 'はめわざ', kind: 'skill', job: 'gamer', mp: 6, target: 'enemy',
    effect: { type: 'atbSet', sub: 55, chance: 0.6, msg: '{t}は、はめられて動けない！', failMsg: '{t}は、ぬけ出した！' },
    desc: 'ハメ技で、敵1体を動けなくする（ボスには効きにくい）。', cast: '{a}のハメ技！', anim: 'glitch',
  },
  ga_combo: {
    name: 'れんぞくコンボ', kana: 'れんぞくこんぼ', kind: 'skill', job: 'gamer', mp: 8, target: 'enemy',
    effect: { type: 'phys', mult: 0.38, hits: 7 },
    desc: '練習した連続コンボで、敵1体に7回攻撃する。', cast: '{a}のれんぞくコンボ！', anim: 'punch_multi',
  },
  ga_lastboss: {
    name: 'ラスボスの倒し方', kana: 'らすぼすのたおしかた', kind: 'skill', job: 'gamer', mp: 12, target: 'enemy',
    effect: { type: 'phys', mult: 2.3, ignoreDef: 0.3 },
    desc: '何度も倒してきたラスボスの倒し方で、敵1体に大ダメージ。守りが固い敵にも強い。', cast: '{a}「このパターン、知ってる！」', anim: 'slash_heavy',
  },

  // ───────────── プロゲーマー（上級職） ─────────────
  pg_frame: {
    name: '1フレーム回ひ', kana: 'いちふれーむかいひ', kind: 'skill', job: 'pro_gamer', mp: 4, target: 'self', role: 'sup',
    effect: { type: 'buff', stat: 'eva', add: 0.3, dur: 30 },
    desc: 'わずかなすきまで、攻撃をよける。自分が身をかわしやすくなる。', cast: '{a}は1フレームの見切りで構えた！', anim: 'buff',
  },
  pg_keyboard: {
    name: 'キーボードクラッシュ', kana: 'きーぼーどくらっしゅ', kind: 'skill', job: 'pro_gamer', mp: 5, target: 'enemy',
    effect: { type: 'phys', mult: 1.9 },
    desc: 'ゲーミングキーボードを、敵1体にたたきつける。', cast: '{a}のキーボードクラッシュ！', anim: 'glitch',
  },
  pg_nyuuryoku: {
    name: '高速入力', kana: 'こうそくにゅうりょく', kind: 'skill', job: 'pro_gamer', mp: 9, target: 'enemy',
    effect: { type: 'phys', mult: 0.5, hits: 6 },
    desc: '目にもとまらぬ高速入力で、敵1体に6回攻撃する。', cast: '{a}の高速入力！', anim: 'punch_multi',
  },
  pg_meta: {
    name: 'メタ読み', kana: 'めたよみ', kind: 'skill', job: 'pro_gamer', mp: 8, target: 'enemies',
    effect: { type: 'debuff', stat: 'atk', mult: 0.85, dur: 30, chance: 0.7 },
    desc: '敵の作戦を読みきって、敵全体の攻撃力を下げる。', cast: '{a}「その動き、読めてるよ」', anim: 'debuff',
  },
  pg_kamiplay: {
    name: '神プレイ', kana: 'かみぷれい', kind: 'skill', job: 'pro_gamer', mp: 12, target: 'enemy',
    effect: { type: 'phys', mult: 2.8, critBonus: 0.2 },
    desc: '世界がおどろく神プレイで、敵1体に大きなダメージ。会心が出やすい。', cast: '{a}の神プレイ！', anim: 'slash_fast',
  },
  pg_team: {
    name: 'チームの作戦会議', kana: 'ちーむのさくせんかいぎ', kind: 'skill', job: 'pro_gamer', mp: 12, target: 'allies', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.2, dur: 35 },
    desc: 'チームで作戦会議。仲間全員の攻撃力と素早さが上がる。', cast: '{a}「よし、作戦通りに行こう！」', anim: 'warcry',
  },
  pg_yuushou: {
    name: '世界大会優勝', kana: 'せかいたいかいゆうしょう', kind: 'skill', job: 'pro_gamer', mp: 18, target: 'enemies', role: 'dmg',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 1.4 }, { type: 'bondUp', amount: 20 }] },
    desc: '世界大会で優勝した実力で、敵全体に大きなダメージ。きずなゲージもふえる。', cast: '{a}の世界大会優勝プレイ！', anim: 'meteor',
  },

  // ───────────── 魔王（伝説の職業） ─────────────
  mo_kokuen: {
    name: '暗黒の炎', kana: 'あんこくのほのお', kind: 'spell', job: 'maou', mp: 16, target: 'enemies',
    effect: { type: 'magic', element: 'dark', base: [150, 180], thr: 80 },
    desc: 'やみの底からわき上がる暗黒の炎で、敵全体を焼く。闇のダメージ。', cast: '{a}は暗黒の炎をよび出した！', anim: 'maou_dark',
  },
  mo_hadou: {
    name: 'いてつく波動', kana: 'いてつくはどう', kind: 'skill', job: 'maou', mp: 12, target: 'enemies', role: 'sup',
    effect: { type: 'dispel' },
    desc: '冷たい波動で、敵全体の強くなっていた力をすべて消す。', cast: '{a}は、いてつく波動を放った！', anim: 'aircon',
  },
  mo_tsume: {
    name: '魔王のつめ', kana: 'まおうのつめ', kind: 'skill', job: 'maou', mp: 14, target: 'enemy',
    effect: { type: 'phys', mult: 3.0, element: 'dark' },
    desc: 'するどい魔王のつめで、敵1体を引きさく。闇のダメージ。', cast: '{a}の魔王のつめ！', anim: 'dark_slash',
  },
  mo_iatsu: {
    name: '魔王の威圧', kana: 'まおうのいあつ', kind: 'skill', job: 'maou', mp: 16, target: 'enemies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'atbSet', sub: 50, chance: 0.6, msg: '{t}は、こわくて動けない！', failMsg: '{t}は、ふるえながらもこらえた！' }, { type: 'debuff', stat: 'atk', mult: 0.85, dur: 30, chance: 0.7 }] },
    desc: '魔王の威圧で、敵全体の動きを止め（ボスには効きにくい）、攻撃力も下げる。', cast: '{a}「…ひれふせ」', anim: 'maou_dark',
  },
  mo_koromo: {
    name: '闇の衣', kana: 'やみのころも', kind: 'skill', job: 'maou', mp: 14, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'def', mult: 1.5, dur: 45 }, { type: 'buff', stat: 'mag', mult: 1.4, dur: 45 }] },
    desc: '闇の衣をまとう。自分の守備力と魔力が大きく上がる。', cast: '{a}は、黒い闇の衣をまとった！', anim: 'dark1',
  },
  mo_hametsu: {
    name: '破滅の光', kana: 'はめつのひかり', kind: 'spell', job: 'maou', mp: 32, target: 'enemies',
    effect: { type: 'magic', element: 'dark', base: [220, 260], thr: 90 },
    desc: 'すべてをほろぼす破滅の光で、敵全体にとても大きなダメージ。闇のダメージ。', cast: '{a}「世界ごと、消えるがいい…！」', anim: 'maou_dark',
  },

  // ───────────── 運しだいの 技の 中み（おぼえない） ─────────────
  // ニート「明日から本気出す」
  ne_h_yaru: {
    name: '本気を出した', kana: 'ほんきをだした', kind: 'skill', job: 'neet', mp: 0, target: 'self', hidden: true,
    effect: { type: 'charge', mult: 3.0 }, desc: '', cast: 'なんと、本当に本気を出した！次の攻撃の威力が3倍！', anim: 'charge',
  },
  ne_h_ashita: {
    name: 'やっぱり明日', kana: 'やっぱりあした', kind: 'skill', job: 'neet', mp: 0, target: 'self', hidden: true,
    effect: { type: 'nothing' }, desc: '', cast: '…やっぱり、明日からにしよう。', anim: 'none',
  },
  // 中二病「設定ノート」
  cu_n_mahou: {
    name: 'やみの魔力の設定', kana: 'やみのまりょくのせってい', kind: 'skill', job: 'chuuni', mp: 0, target: 'self', hidden: true,
    effect: { type: 'buff', stat: 'mag', mult: 1.4, dur: 35 }, desc: '', cast: '「やみの魔力が、目ざめる」…本当に魔力が上がった！', anim: 'dark1',
  },
  cu_n_tate: {
    name: '見えないたての設定', kana: 'みえないたてのせってい', kind: 'skill', job: 'chuuni', mp: 0, target: 'self', hidden: true,
    effect: { type: 'buff', stat: 'def', mult: 1.4, dur: 35 }, desc: '', cast: '「見えないたてが、守っている」…本当に守備力が上がった！', anim: 'guard',
  },
  cu_n_mujun: {
    name: '設定のむじゅん', kana: 'せっていのむじゅん', kind: 'skill', job: 'chuuni', mp: 0, target: 'self', hidden: true,
    effect: { type: 'nothing' }, desc: '', cast: '…設定がむじゅんしていて、何も起こらなかった。', anim: 'none',
  },
  // ユーチューバー「大型きかく」
  yt_k_buzz: {
    name: '動画がバズった', kana: 'どうががばずった', kind: 'skill', job: 'youtuber', mp: 0, target: 'enemies', hidden: true,
    effect: { type: 'magic', base: [52, 64], thr: 30 }, desc: '', cast: '動画が大バズり！もり上がったいきおいで、敵にダメージ！', anim: 'superchat',
  },
  yt_k_collab: {
    name: '神コラボ', kana: 'かみこらぼ', kind: 'skill', job: 'youtuber', mp: 0, target: 'allies', hidden: true,
    effect: { type: 'heal', base: [30, 40], thr: 30 }, desc: '', cast: '神コラボが決まった！みんなのHPが回復した！', anim: 'heal_dance',
  },
  yt_k_hazure: {
    name: 'きかくがすべった', kana: 'きかくがすべった', kind: 'skill', job: 'youtuber', mp: 0, target: 'self', hidden: true,
    effect: { type: 'nothing' }, desc: '', cast: '…再生回数は、のびなかった。', anim: 'none',
  },
  // 人気配信者「神回」
  st_k_kami: {
    name: '伝説の神回', kana: 'でんせつのかみかい', kind: 'skill', job: 'streamer', mp: 0, target: 'enemies', hidden: true,
    effect: { type: 'magic', element: 'light', base: [110, 135], thr: 50 }, desc: '', cast: '伝説の神回！まぶしい光が敵をつつむ！', anim: 'holy',
  },
  st_k_moriagari: {
    name: 'コメントがもり上がる', kana: 'こめんとがもりあがる', kind: 'skill', job: 'streamer', mp: 0, target: 'allies', hidden: true,
    effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.2, dur: 35 }, desc: '', cast: 'コメントが大もり上がり！みんなの力がわいてくる！', anim: 'warcry',
  },
  st_k_jiko: {
    name: '放送事故', kana: 'ほうそうじこ', kind: 'skill', job: 'streamer', mp: 0, target: 'self', hidden: true,
    effect: { type: 'nothing' }, desc: '', cast: '…放送事故が起きた。画面がまっ白になっている。', anim: 'none',
  },
  // ゲーマー「バグ技」
  ga_b_big: {
    name: 'バグで大ダメージ', kana: 'ばぐでおおだめーじ', kind: 'skill', job: 'gamer', mp: 0, target: 'enemies', hidden: true,
    effect: { type: 'phys', mult: 1.6 }, desc: '', cast: 'バグで、ダメージの数字がおかしくなった！', anim: 'glitch',
  },
  ga_b_freeze: {
    name: 'バグで敵がかたまる', kana: 'ばぐでてきがかたまる', kind: 'skill', job: 'gamer', mp: 0, target: 'enemies', hidden: true,
    effect: { type: 'atbSet', sub: 50, chance: 0.6, msg: '{t}は、かたまって動けない！', failMsg: '{t}は、ふつうに動いている。' }, desc: '', cast: 'バグで、敵の動きがかたまった！', anim: 'glitch',
  },
  ga_b_heal: {
    name: 'バグでHPがふえる', kana: 'ばぐでえいちぴーがふえる', kind: 'skill', job: 'gamer', mp: 0, target: 'allies', hidden: true,
    effect: { type: 'heal', base: [30, 40], thr: 20 }, desc: '', cast: 'バグで、みんなのHPがふえた！', anim: 'heal1',
  },
  ga_b_none: {
    name: 'バグが直っていた', kana: 'ばぐがなおっていた', kind: 'skill', job: 'gamer', mp: 0, target: 'self', hidden: true,
    effect: { type: 'nothing' }, desc: '', cast: '…このバグは、もう直っていた。', anim: 'none',
  },
};
