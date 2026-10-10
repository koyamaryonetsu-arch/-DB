// 新しい 職業の 技（料理人・アルバイト・お笑い芸人の 系統、大賢者、ロトの勇者）と、
// 攻撃技が 少なかった 職業に 足した 攻撃技（2026年10月 見なおし）
//
// 見なおしの きまり（README「職業と転職」）
//  ・どの 職業にも 攻撃技を（基本職は 3つ いじょう、上級職・超級職は 2つ いじょう）
//  ・補助の つよさは ランクで そろえる: みんなに かける 補助は 基本職 1.15倍・上級職 1.25倍・超級職 1.3倍まで（自分だけは もう少し 強い）
//  ・本職で ない 技で かける 補助は、転職ペナルティの ぶん 上がりかたも へる（battle.js の applyBuff）
//
// 新しい こうかの しゅるい（battle.js）
//   regen … じわじわ 回復（4びょうごと）/ dispel … 敵の 強く なる こうかを けす・仲間の 弱く なる こうかを けす
//   multi … いくつかの こうかを じゅんに（parts）/ allMp … マダンテ / gather … ミナデイン
//   magic の stat: 'heal' … 回復魔力で 強く なる / phys の atkFrom: 'def' … 攻撃力と 守備力の まんなかで なぐる
//   atbSet の chance・sub … 敵の 行動ゲージを へらす（ボスには 効きにくい）

export const JOB3_ABILITIES = {
  // ───────────── 料理人（基本職） ─────────────
  ck_houchou: {
    name: '包丁さばき', kana: 'ほうちょうさばき', kind: 'skill', job: 'cook', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 0.55, hits: 3 },
    desc: 'トントントン！敵1体に、すばやく3回切りつける。', cast: '{a}の包丁さばき！', anim: 'slash_multi',
  },
  ck_soup: {
    name: 'あったかスープ', kana: 'あったかすーぷ', kind: 'skill', job: 'cook', mp: 3, target: 'ally',
    effect: { type: 'regen', base: [7, 9], thr: 14, dur: 24 },
    desc: '仲間1人に、あったかいスープ。しばらくの間、HPが少しずつ回復する。', cast: '{a}は{t}にあったかスープを作った！', anim: 'heal1',
  },
  ck_tsuyobi: {
    name: '強火', kana: 'つよび', kind: 'skill', job: 'cook', mp: 4, target: 'group',
    effect: { type: 'magic', element: 'fire', base: [13, 19], thr: 14 },
    desc: 'フライパンから強い火を上げて、同じ種類の敵をまとめて焼く。', cast: '{a}は強火でいっきに焼き上げた！', anim: 'fire_wave',
  },
  ck_spice: {
    name: 'ピリからスパイス', kana: 'ぴりからすぱいす', kind: 'skill', job: 'cook', mp: 4, target: 'enemy',
    effect: { type: 'magic', element: 'fire', base: [22, 30], thr: 18, status: { status: 'confuse', chance: 0.3, turns: [1, 2] } },
    desc: '敵1体の口に、ピリッとからいスパイス。炎のダメージで、時々からすぎて混乱する。', cast: '{a}はピリからスパイスをふりかけた！', anim: 'fire1',
  },
  ck_stamina: {
    name: 'スタミナ料理', kana: 'すたみなりょうり', kind: 'skill', job: 'cook', mp: 7, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [22, 30], thr: 18 }, { type: 'buff', stat: 'atk', mult: 1.1, dur: 30 }] },
    desc: '仲間全員に、力のつく料理。HPを回復して、攻撃力も少し上がる。', cast: '{a}はスタミナ料理をふるまった！', anim: 'heal_dance',
  },
  ck_mijin: {
    name: 'みじん切り', kana: 'みじんぎり', kind: 'skill', job: 'cook', mp: 6, target: 'enemies',
    effect: { type: 'phys', mult: 0.45, hits: 5, random: true },
    desc: '敵にランダムで5回、目にもとまらぬ包丁さばき。', cast: '{a}のみじん切り！', anim: 'slash_multi',
  },
  ck_tsumami: {
    name: 'つまみ食い', kana: 'つまみぐい', kind: 'skill', job: 'cook', mp: 3, target: 'enemy', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'steal', chance: 0.6 }, { type: 'heal', target: 'self', base: [20, 28], thr: 14 }] },
    desc: '敵1体の持ち物をこっそりいただく。ついでに味見をして、自分のHPも少し回復する。', cast: '{a}は{t}の持ち物をつまみ食いした！', anim: 'none',
  },
  ck_flambe: {
    name: 'フランベ', kana: 'ふらんべ', kind: 'skill', job: 'cook', mp: 9, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [38, 50], thr: 44 },
    desc: 'ボワッ！大きな炎を上げて、敵全体を焼く。', cast: '{a}のフランベ！炎が大きく上がった！', anim: 'fire3',
  },
  ck_fullcourse: {
    name: 'フルコース', kana: 'ふるこーす', kind: 'skill', job: 'cook', mp: 16, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [48, 62], thr: 50 }, { type: 'regen', base: [5, 7], thr: 30, dur: 24 }] },
    desc: '仲間全員に、前菜からデザートまでのフルコース。HPを回復して、しばらく少しずつ回復する。', cast: '{a}はフルコースをふるまった！', anim: 'heal2',
  },

  // ───────────── パティシエ（上級職） ─────────────
  pa_cream: {
    name: 'クリームしぼり', kana: 'くりーむしぼり', kind: 'skill', job: 'patissier', mp: 4, target: 'group',
    effect: { type: 'status', status: 'blind', chance: 0.55, turns: [3, 5] },
    desc: '同じ種類の敵の顔に、ホイップクリーム。前が見えず、攻撃が外れやすくなる。', cast: '{a}はクリームをしぼり出した！', anim: 'debuff',
  },
  pa_candy: {
    name: 'キャンディシャワー', kana: 'きゃんでぃしゃわー', kind: 'skill', job: 'patissier', mp: 6, target: 'enemies',
    effect: { type: 'magic', element: 'light', base: [28, 38], thr: 30 },
    desc: 'キラキラのアメを、敵全体にふらせる。', cast: '{a}のキャンディシャワー！', anim: 'meteor',
  },
  pa_cake: {
    name: 'ケーキの差し入れ', kana: 'けーきのさしいれ', kind: 'skill', job: 'patissier', mp: 9, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [45, 60], thr: 35 }, { type: 'mpHeal', base: [3, 5] }] },
    desc: '仲間全員に、手作りのケーキ。HPを回復して、MPも少し回復する。', cast: '{a}はケーキを差し入れた！', anim: 'heal_dance',
  },
  pa_fondue: {
    name: 'チョコフォンデュ', kana: 'ちょこふぉんでゅ', kind: 'skill', job: 'patissier', mp: 9, target: 'enemy',
    effect: { type: 'magic', element: 'fire', base: [80, 100], thr: 50, debuff: { stat: 'agi', mult: 0.8, dur: 30, chance: 0.7 } },
    desc: '敵1体に、あつあつのチョコをたっぷり。炎のダメージで、べたべたになって素早さも下がる。', cast: '{a}のチョコフォンデュ！', anim: 'fire2',
  },
  pa_macaron: {
    name: 'マカロンボム', kana: 'まかろんぼむ', kind: 'skill', job: 'patissier', mp: 9, target: 'group',
    effect: { type: 'magic', element: 'blast', base: [55, 70], thr: 50 },
    desc: 'カラフルなマカロンが、同じ種類の敵の上でポンポン爆発する。', cast: '{a}のマカロンボム！', anim: 'blast2',
  },
  pa_sugar: {
    name: 'シュガーコート', kana: 'しゅがーこーと', kind: 'skill', job: 'patissier', mp: 12, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'def', mult: 1.2, dur: 35 }, { type: 'regen', base: [6, 8], thr: 30, dur: 20 }] },
    desc: '仲間全員を、さとうのまくでつつむ。守備力が上がって、しばらくHPが少しずつ回復する。', cast: '{a}のシュガーコート！', anim: 'buff',
  },
  pa_kaori: {
    name: 'あまいかおり', kana: 'あまいかおり', kind: 'skill', job: 'patissier', mp: 8, target: 'enemies',
    effect: { type: 'status', status: 'sleep', chance: 0.45, turns: [1, 3] },
    desc: '焼きたてのあまいかおりで、敵全体をうっとりねむらせる。', cast: '{a}のあまいかおり…', anim: 'sleep',
  },
  pa_wedding: {
    name: 'ウェディングケーキ', kana: 'うぇでぃんぐけーき', kind: 'skill', job: 'patissier', mp: 22, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [100, 125], thr: 60 }, { type: 'buff', stats: ['atk', 'def'], mult: 1.2, dur: 35 }] },
    desc: '仲間全員に、大きなウェディングケーキ。HPを大きく回復して、攻撃力と守備力が上がる。', cast: '{a}はウェディングケーキを作り上げた！', anim: 'heal2',
  },

  // ───────────── 三ツ星シェフ（超級職） ─────────────
  sc_tetsujin: {
    name: '鉄人の包丁', kana: 'てつじんのほうちょう', kind: 'skill', job: 'star_chef', mp: 8, target: 'enemy',
    effect: { type: 'phys', mult: 0.7, hits: 4, critBonus: 0.1 },
    desc: '敵1体に、鉄人の包丁さばき。4回すばやく切りつけ、会心が出やすい。', cast: '{a}の鉄人の包丁！', anim: 'slash_multi',
  },
  sc_ajimi: {
    name: '味見', kana: 'あじみ', kind: 'skill', job: 'star_chef', mp: 0, target: 'self',
    effect: { type: 'mpHeal', base: [16, 22] },
    desc: 'ひと口味見をして、自分のMPを回復する。', cast: '{a}はひと口味見をした。うん、おいしい！', anim: 'heal1',
  },
  sc_honoo: {
    name: '炎のフライパン', kana: 'ほのおのふらいぱん', kind: 'skill', job: 'star_chef', mp: 16, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [90, 112], thr: 70 },
    desc: '大きなフライパンから炎がふき上がり、敵全体を焼きつくす。', cast: '{a}の炎のフライパン！', anim: 'fire_tornado',
  },
  sc_osusume: {
    name: '本日のおすすめ', kana: 'ほんじつのおすすめ', kind: 'skill', job: 'star_chef', mp: 12, target: 'self',
    effect: { type: 'random', options: ['sc_o_steak', 'sc_o_soup', 'sc_o_dessert', 'sc_o_coffee'] },
    desc: '今日のおすすめを作る。何が出てくるかは、その日の運しだい。', cast: '{a}は本日のおすすめを作り始めた…', anim: 'cards',
  },
  sc_fullcourse: {
    name: '三ツ星のフルコース', kana: 'みつぼしのふるこーす', kind: 'skill', job: 'star_chef', mp: 26, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [125, 155], thr: 70 }, { type: 'buff', stats: ['atk', 'def'], mult: 1.3, dur: 40 }] },
    desc: '仲間全員に、三ツ星のフルコース。HPを大きく回復して、攻撃力と守備力が上がる。', cast: '{a}は三ツ星のフルコースをふるまった！', anim: 'heal2',
  },
  sc_kyuukyoku: {
    name: '究極の一皿', kana: 'きゅうきょくのひとさら', kind: 'skill', job: 'star_chef', mp: 28, target: 'enemy', role: 'dmg',
    effect: { type: 'multi', parts: [{ type: 'magic', element: 'fire', base: [280, 330], thr: 80 }, { type: 'heal', target: 'allies', base: [55, 70], thr: 50 }] },
    desc: '敵1体に、究極の一皿をおみまいする。大きな炎のダメージをあたえ、そのかおりで仲間全員のHPも回復する。', cast: '{a}の究極の一皿！', anim: 'fire3',
  },

  // ───────────── アルバイト（基本職） ─────────────
  ab_danboru: {
    name: 'ダンボールアタック', kana: 'だんぼーるあたっく', kind: 'skill', job: 'parttimer', mp: 1, target: 'enemy',
    effect: { type: 'phys', mult: 1.35 },
    desc: '重いダンボールを、敵1体に思いきりぶつける。', cast: '{a}のダンボールアタック！', anim: 'tackle',
  },
  ab_irasshai: {
    name: 'いらっしゃいませ！', kana: 'いらっしゃいませ', kind: 'skill', job: 'parttimer', mp: 3, target: 'enemies',
    effect: { type: 'debuff', stat: 'agi', mult: 0.85, dur: 30, chance: 0.75 },
    desc: '元気な大声で、敵全体をおどろかせる。敵の素早さが少し下がる。', cast: '{a}「いらっしゃいませ！」', anim: 'warcry',
  },
  ab_reji: {
    name: 'レジうち', kana: 'れじうち', kind: 'skill', job: 'parttimer', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 0.42, hits: 4 },
    desc: 'ピッピッピッピッ！敵1体に、すばやく4回打ちこむ。', cast: '{a}のレジうち！', anim: 'punch_multi',
  },
  ab_makanai: {
    name: 'まかない', kana: 'まかない', kind: 'skill', job: 'parttimer', mp: 3, target: 'ally', field: true,
    effect: { type: 'heal', base: [40, 52], thr: 18 },
    desc: 'お店のまかないで、仲間1人のHPを回復する。', cast: '{a}は{t}にまかないを出した！', anim: 'heal1',
  },
  ab_shift: {
    name: 'シフト交代', kana: 'しふとこうたい', kind: 'skill', job: 'parttimer', mp: 4, target: 'ally',
    effect: { type: 'atbSet', add: 35, msg: '{t}「交代します！」' },
    desc: '仲間1人とシフトを交代。その仲間の行動の順番が少し早く来る。', cast: '{a}は{t}にシフトを代わってもらった！', anim: 'buff',
  },
  ab_shinadashi: {
    name: '品出しダッシュ', kana: 'しなだしだっしゅ', kind: 'skill', job: 'parttimer', mp: 6, target: 'enemies',
    effect: { type: 'phys', mult: 0.8 },
    desc: '台車をおして、敵全体の間をかけぬける。', cast: '{a}の品出しダッシュ！', anim: 'hit_all',
  },
  ab_yakin: {
    name: '深夜勤務', kana: 'しんやきんむ', kind: 'skill', job: 'parttimer', mp: 0, target: 'self',
    effect: { type: 'charge', mult: 2.0, hpCost: 0.08 },
    desc: 'ねむい目をこすって、力をためる。自分のHPが少しへるが、次の攻撃の威力が2倍。', cast: '{a}は深夜勤務でがんばっている…', anim: 'charge',
  },
  ab_tenchou: {
    name: '店長をよぶ', kana: 'てんちょうをよぶ', kind: 'skill', job: 'parttimer', mp: 5, target: 'self',
    effect: { type: 'random', options: ['ab_t_help', 'ab_t_angry', 'ab_t_away'] },
    desc: '「店長！」とよぶ。助けてくれるか、おこられるか、休みの日かは運しだい。', cast: '{a}「店長ー！」', anim: 'none',
  },
  ab_kaikin: {
    name: 'かいきん賞', kana: 'かいきんしょう', kind: 'skill', job: 'parttimer', mp: 8, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['atk', 'def'], mult: 1.2, dur: 30 }, { type: 'heal', base: [40, 55], thr: 20 }] },
    desc: '1日も休まなかったごほうび。自分の攻撃力と守備力が上がり、HPも回復する。', cast: '{a}はかいきん賞をもらった！', anim: 'warcry',
  },
  ab_nenmatsu: {
    name: '年末の大いそがし', kana: 'ねんまつのおおいそがし', kind: 'skill', job: 'parttimer', mp: 10, target: 'enemies',
    effect: { type: 'phys', mult: 0.55, hits: 6, random: true },
    desc: '年末の大いそがし！敵にランダムで6回、休まず動き回って攻撃する。', cast: '{a}は年末の大いそがしで動き回った！', anim: 'punch_multi',
  },

  // ───────────── 正社員（上級職） ─────────────
  se_shainsho: {
    name: '社員証アタック', kana: 'しゃいんしょうあたっく', kind: 'skill', job: 'seishain', mp: 4, target: 'enemy',
    effect: { type: 'phys', mult: 1.6, critBonus: 0.1 },
    desc: '社員証を見せつけて、敵1体にするどい一撃。会心が出やすい。', cast: '{a}の社員証アタック！', anim: 'slash_fast',
  },
  se_chourei: {
    name: '朝礼', kana: 'ちょうれい', kind: 'skill', job: 'seishain', mp: 7, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'atk', mult: 1.2, dur: 35 }, { type: 'bondUp', amount: 10 }] },
    desc: '朝礼で気合いを入れる。仲間全員の攻撃力が上がり、きずなゲージも少しふえる。', cast: '{a}「本日もよろしくお願いします！」', anim: 'warcry',
  },
  se_yukyu: {
    name: '有給休か', kana: 'ゆうきゅうきゅうか', kind: 'skill', job: 'seishain', mp: 6, target: 'self', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [110, 135], thr: 40 }, { type: 'regen', base: [10, 12], thr: 30, dur: 20 }] },
    desc: '有給休かでしっかり休む。自分のHPを大きく回復して、しばらく少しずつ回復する。', cast: '{a}は有給休かをとった。', anim: 'heal2',
  },
  se_project: {
    name: 'プロジェクト始動', kana: 'ぷろじぇくとしどう', kind: 'skill', job: 'seishain', mp: 9, target: 'enemies',
    effect: { type: 'phys', mult: 1.15 },
    desc: '大きなプロジェクトを動かし、敵全体をまきこむ。', cast: '{a}のプロジェクト始動！', anim: 'hit_all',
  },
  se_fukuri: {
    name: '福利厚生', kana: 'ふくりこうせい', kind: 'skill', job: 'seishain', mp: 10, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'regen', base: [9, 12], thr: 40, dur: 24 }, { type: 'cure', statuses: ['poison'] }] },
    desc: '会社の福利厚生。仲間全員のHPがしばらく少しずつ回復し、毒も治る。', cast: '{a}は福利厚生を使った！', anim: 'heal_dance',
  },
  se_ookuchi: {
    name: '大口の注文', kana: 'おおぐちのちゅうもん', kind: 'skill', job: 'seishain', mp: 10, target: 'enemy',
    effect: { type: 'phys', mult: 2.4, ignoreDef: 0.2 },
    desc: '大口の注文をとってきた勢いで、敵1体に重い一撃。', cast: '{a}は大口の注文をとってきた！', anim: 'slash_heavy',
  },
  se_shusse: {
    name: '出世', kana: 'しゅっせ', kind: 'skill', job: 'seishain', mp: 12, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['atk', 'def', 'agi'], mult: 1.35, dur: 40 }, { type: 'mpHeal', base: [12, 18] }] },
    desc: 'ついに出世！自分の攻撃力・守備力・素早さが大きく上がり、MPも回復する。', cast: '{a}は出世した！', anim: 'warcry',
  },

  // ───────────── たたき上げ社長（超級職） ─────────────
  tk_genba: {
    name: '現場百回', kana: 'げんばひゃっかい', kind: 'skill', job: 'tatakiage', mp: 6, target: 'enemy',
    effect: { type: 'phys', mult: 2.0, ignoreDef: 0.3 },
    desc: '現場できたえた体で、敵1体に重い一撃。守りが固い敵にも強い。', cast: '{a}「現場百回！」', anim: 'slash_heavy',
  },
  tk_konjou: {
    name: 'どろんこ根性', kana: 'どろんこごんじょう', kind: 'skill', job: 'tatakiage', mp: 4, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'charge', mult: 2.5 }, { type: 'heal', base: [60, 80], thr: 40 }] },
    desc: 'どろんこになっても、あきらめない。自分のHPを回復して、次の攻撃の威力が2.5倍。', cast: '{a}はどろんこになっても立ち上がった！', anim: 'charge',
  },
  tk_zensha: {
    name: '全社一丸', kana: 'ぜんしゃいちがん', kind: 'skill', job: 'tatakiage', mp: 18, target: 'allies',
    effect: { type: 'buff', stats: ['atk', 'def', 'agi'], mult: 1.3, dur: 45 },
    desc: '会社が一つになる。仲間全員の攻撃力・守備力・素早さが上がる。', cast: '{a}「全社一丸で行くぞ！」', anim: 'warcry',
  },
  tk_satsutaba: {
    name: '札束ビンタ', kana: 'さつたばびんた', kind: 'skill', job: 'tatakiage', mp: 0, target: 'enemy',
    effect: { type: 'goldThrow', base: 80, perLv: 14, mult: 1.6 },
    desc: 'お金を使って、敵1体に大きなダメージ。守りは関係ない（お金が足りないと出せない）。', cast: '{a}の札束ビンタ！', anim: 'hit',
  },
  tk_ryokou: {
    name: '社員旅行', kana: 'しゃいんりょこう', kind: 'skill', job: 'tatakiage', mp: 18, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [90, 110], thr: 60 }, { type: 'mpHeal', base: [6, 10] }] },
    desc: 'みんなで社員旅行。仲間全員のHPとMPを回復する。', cast: '{a}は社員旅行に連れていった！', anim: 'heal_dance',
  },
  tk_tatakiage: {
    name: 'たたき上げの一撃', kana: 'たたきあげのいちげき', kind: 'skill', job: 'tatakiage', mp: 22, target: 'enemies',
    effect: { type: 'phys', mult: 1.9, ignoreDef: 0.3 },
    desc: 'アルバイトから社長までのぼりつめた力で、敵全体に重い一撃。', cast: '{a}のたたき上げの一撃！', anim: 'quake',
  },

  // ───────────── お笑い芸人（上級職） ─────────────
  cm_tsukkomi: {
    name: 'ツッコミ', kana: 'つっこみ', kind: 'skill', job: 'comedian', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.3, dispel: true },
    desc: '「なんでやねん！」敵1体にするどいツッコミ。敵の強くなっていた力も消す。', cast: '{a}「なんでやねん！」', anim: 'hit',
  },
  cm_boke: {
    name: 'ボケ', kana: 'ぼけ', kind: 'skill', job: 'comedian', mp: 3, target: 'self',
    effect: { type: 'random', options: ['cm_b_ukeru', 'cm_b_suberu', 'cm_b_konran', 'cm_b_heal'] },
    desc: 'とっておきのボケ。うけるか、すべるかは運しだい。', cast: '{a}はとっておきのボケをかました！', anim: 'laugh',
  },
  cm_gag: {
    name: '一発ギャグ', kana: 'いっぱつぎゃぐ', kind: 'skill', job: 'comedian', mp: 5, target: 'group',
    effect: { type: 'atbSet', sub: 45, chance: 0.6, msg: '{t}は笑いころげている！', failMsg: '{t}には、うけなかった…' },
    desc: '同じ種類の敵を笑わせて、動きを止める（ボスには効きにくい）。', cast: '{a}の一発ギャグ！', anim: 'laugh',
  },
  cm_conte: {
    name: 'コント', kana: 'こんと', kind: 'skill', job: 'comedian', mp: 7, target: 'enemies',
    effect: { type: 'phys', mult: 0.6, hits: 4, random: true },
    desc: 'ドタバタのコント。敵にランダムで4回ぶつかる。', cast: '{a}はドタバタのコントを始めた！', anim: 'hit_all',
  },
  cm_warai: {
    name: '笑いの力', kana: 'わらいのちから', kind: 'skill', job: 'comedian', mp: 12, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [60, 75], thr: 45 }, { type: 'bondUp', amount: 15 }] },
    desc: '笑う門には福来たる。仲間全員のHPを回復し、きずなゲージもふえる。', cast: '{a}の話で、みんな大笑い！', anim: 'heal_dance',
  },
  cm_monomane: {
    name: 'ものまね', kana: 'ものまね', kind: 'skill', job: 'comedian', mp: 6, target: 'self',
    effect: { type: 'random', options: ['cm_m_warrior', 'cm_m_mage', 'cm_m_priest'] },
    desc: 'いろいろな職業のものまね。だれのまねが出るかは運しだい。', cast: '{a}のものまね！', anim: 'dance',
  },
  cm_bakushou: {
    name: '爆笑のうず', kana: 'ばくしょうのうず', kind: 'skill', job: 'comedian', mp: 18, target: 'enemies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'atbSet', sub: 55, chance: 0.65, msg: '{t}は笑いころげている！', failMsg: '{t}には、うけなかった…' }, { type: 'heal', target: 'allies', base: [40, 55], thr: 40 }] },
    desc: '会場を爆笑のうずに。敵全体の動きを止めて（ボスには効きにくい）、仲間全員のHPも回復する。', cast: '{a}の話で、会場が爆笑のうずにつつまれた！', anim: 'laugh',
  },

  // ───────────── M-1王者（超級職） ─────────────
  m1_machinegun: {
    name: 'マシンガントーク', kana: 'ましんがんとーく', kind: 'skill', job: 'm1_champion', mp: 12, target: 'enemies',
    effect: { type: 'magic', base: [80, 100], thr: 60 },
    desc: 'しゃべってしゃべって、しゃべりたおす。敵全体にダメージ。', cast: '{a}のマシンガントーク！', anim: 'notes',
  },
  m1_densetsu: {
    name: '伝説のツッコミ', kana: 'でんせつのつっこみ', kind: 'skill', job: 'm1_champion', mp: 12, target: 'enemy', role: 'dmg',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 2.5, dispel: true }, { type: 'atbSet', sub: 40, chance: 0.7, msg: '{t}は、ツッコまれて動けない！', failMsg: '{t}は、こらえた！' }] },
    desc: '敵1体に伝説のツッコミ。大きなダメージをあたえ、強くなっていた力を消して、動きも止める（ボスには効きにくい）。', cast: '{a}の伝説のツッコミ！', anim: 'slash_heavy',
  },
  m1_neta: {
    name: '決勝のネタ', kana: 'けっしょうのねた', kind: 'skill', job: 'm1_champion', mp: 14, target: 'self',
    effect: { type: 'random', options: ['m1_n_bakushou', 'm1_n_ichigan', 'm1_n_manten', 'm1_n_suberi'] },
    desc: '決勝でしか出さない、とっておきのネタ。どうなるかは運しだい。', cast: '{a}は決勝のネタを始めた…', anim: 'stage',
  },
  m1_kansei: {
    name: '大かんせい', kana: 'だいかんせい', kind: 'skill', job: 'm1_champion', mp: 16, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['atk', 'agi'], mult: 1.3, dur: 40 }, { type: 'bondUp', amount: 30 }] },
    desc: '会場の大かんせい！仲間全員の攻撃力と素早さが上がり、きずなゲージもふえる。', cast: '会場から大かんせいがわき起こった！', anim: 'warcry',
  },
  m1_yuushou: {
    name: '優勝の時', kana: 'ゆうしょうのとき', kind: 'skill', job: 'm1_champion', mp: 28, target: 'enemies', role: 'dmg',
    effect: { type: 'multi', parts: [{ type: 'magic', element: 'light', base: [150, 180], thr: 80 }, { type: 'heal', target: 'allies', base: [75, 95], thr: 60 }] },
    desc: '優勝のかがやき！敵全体に光のダメージをあたえ、仲間全員のHPも回復する。', cast: '{a}の優勝が決まった！金色の紙ふぶきが会場をつつむ！', anim: 'meteor',
  },

  // ───────────── 大賢者（超級職） ─────────────
  dz_mahyadedos: {
    name: 'マヒャデドス', kana: 'まひゃでどす', kind: 'spell', job: 'daikenja', mp: 18, target: 'group',
    effect: { type: 'magic', element: 'ice', base: [120, 145], thr: 80 },
    desc: '大きな氷の山をおとして、同じ種類の敵をこおりつかせる。', cast: '{a}はマヒャデドスを唱えた！', anim: 'ice2',
  },
  dz_ishi: {
    name: '賢者の石', kana: 'けんじゃのいし', kind: 'skill', job: 'daikenja', mp: 4, target: 'allies', field: true,
    effect: { type: 'heal', base: [50, 65], thr: 40 },
    desc: '賢者の石をかかげて、仲間全員のHPを回復する。少ないMPで使える。', cast: '{a}は賢者の石をかかげた！', anim: 'heal2',
  },
  dz_zaoriku: {
    name: 'ザオリク', kana: 'ざおりく', kind: 'spell', job: 'daikenja', mp: 20, target: 'deadAlly', field: true,
    effect: { type: 'revive', hpRatio: 1 },
    desc: '死んでしまった仲間1人を、HPが満タンの元気な体で生き返らせる。', cast: '{a}はザオリクを唱えた！', anim: 'revive',
  },
  dz_iogurande: {
    name: 'イオグランデ', kana: 'いおぐらんで', kind: 'spell', job: 'daikenja', mp: 24, target: 'enemies',
    effect: { type: 'magic', element: 'blast', base: [135, 165], thr: 85 },
    desc: 'とても大きな爆発で、敵全体をふきとばす。', cast: '{a}はイオグランデを唱えた！', anim: 'blast2',
  },
  dz_behomazun: {
    name: 'ベホマズン', kana: 'べほまずん', kind: 'spell', job: 'daikenja', mp: 30, target: 'allies', field: true,
    effect: { type: 'heal', base: [220, 260], thr: 80 },
    desc: '仲間全員のHPを、大きく回復する。', cast: '{a}はベホマズンを唱えた！', anim: 'heal2',
  },
  dz_satori: {
    name: 'さとり', kana: 'さとり', kind: 'spell', job: 'daikenja', mp: 8, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'dispel' }, { type: 'cure', statuses: ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'] }] },
    desc: '心をすませて、仲間全員の弱くなっていた力と、悪いじょうたいをすべて元にもどす。', cast: '{a}は目をとじて、さとりをひらいた…', anim: 'heal_dance',
  },
  dz_madante: {
    name: 'マダンテ', kana: 'まだんて', kind: 'spell', job: 'daikenja', mp: 30, target: 'enemies', noAuto: true, role: 'dmg',
    effect: { type: 'allMp', mult: 3, paid: 30, min: 31, element: 'void' },
    desc: 'のこりのMPを全て解き放ち、敵全体に大きなダメージ（MPが多いほど強い。使うとMPが0になる。オートでは使わない）。', cast: '{a}はマダンテを唱えた！', anim: 'void',
  },

  // ───────────── ロトの勇者（伝説の職業） ─────────────
  lt_ken: {
    name: 'ロトの剣技', kana: 'ろとのけんぎ', kind: 'skill', job: 'loto_hero', mp: 10, target: 'enemy',
    effect: { type: 'phys', mult: 2.6, element: 'light', ignoreDef: 0.3 },
    desc: '伝説の勇者ロトの剣技。敵1体を光の剣で切りさく。', cast: '{a}のロトの剣技！', anim: 'strash',
  },
  lt_shirushi: {
    name: 'ロトのしるし', kana: 'ろとのしるし', kind: 'skill', job: 'loto_hero', mp: 22, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['atk', 'def', 'agi'], mult: 1.35, dur: 45 }, { type: 'cure', statuses: ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'] }] },
    desc: 'ロトのしるしがかがやく。仲間全員の攻撃力・守備力・素早さが上がり、悪いじょうたいも治る。', cast: 'ロトのしるしが、まぶしくかがやいた！', anim: 'holy',
  },
  lt_inori: {
    name: 'ロトのいのり', kana: 'ろとのいのり', kind: 'spell', job: 'loto_hero', mp: 24, target: 'allies', field: true,
    effect: { type: 'heal', base: [175, 215], thr: 80 },
    desc: '仲間全員のHPを、大きく回復する。', cast: '{a}はロトのいのりをささげた！', anim: 'heal2',
  },
  lt_gigacross: {
    name: 'ギガクロスブレイク', kana: 'ぎがくろすぶれいく', kind: 'skill', job: 'loto_hero', mp: 24, target: 'enemies',
    effect: { type: 'phys', mult: 2.3, element: 'bolt' },
    desc: '雷をまとった十字の剣で、敵全体を切りさく。', cast: '{a}のギガクロスブレイク！', anim: 'gigabreak',
  },
  lt_kizuna: {
    name: '伝説のきずな', kana: 'でんせつのきずな', kind: 'skill', job: 'loto_hero', mp: 16, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'bondUp', amount: 50 }, { type: 'atbSet', add: 50, msg: '{t}はすぐに動けそうだ！' }] },
    desc: '伝説の勇者のきずな。きずなゲージが大きくふえて、仲間全員の行動の順番も早く来る。', cast: '{a}の声が、仲間の心に強くひびいた！', anim: 'warcry',
  },
  lt_minadein: {
    name: 'ミナデイン', kana: 'みなでいん', kind: 'spell', job: 'loto_hero', mp: 28, target: 'enemy', noAuto: true, role: 'dmg',
    effect: { type: 'gather', element: 'bolt', base: [260, 300], per: 110, take: 12, thr: 90 },
    desc: '生きている仲間からMPを12ずつ集め、敵1体に大きな雷をおとす。集まった仲間が多いほど強い（オートでは使わない）。', cast: '{a}はミナデインを唱えた！', anim: 'bolt2',
  },

  // ───────────── 攻撃技を 足した 職業 ─────────────
  // 僧侶（回復魔力で 強く なる 光）
  sr_seikou: {
    name: '聖なる光', kana: 'せいなるひかり', kind: 'spell', job: 'priest', mp: 5, target: 'enemy',
    effect: { type: 'magic', element: 'light', base: [34, 42], thr: 30, stat: 'heal' },
    desc: '聖なる光で、敵1体をうつ。回復魔力が高いほど強い。', cast: '{a}は聖なる光を唱えた！', anim: 'holy',
  },
  // 旅芸人
  pf_hifuki: {
    name: '火ふき芸', kana: 'ひふきげい', kind: 'skill', job: 'performer', mp: 3, target: 'group',
    effect: { type: 'magic', element: 'fire', base: [10, 14], thr: 12 },
    desc: '口から火をふいて、同じ種類の敵をまとめて焼く。', cast: '{a}の火ふき芸！', anim: 'fire1',
  },
  pf_tamanori: {
    name: '玉のりアタック', kana: 'たまのりあたっく', kind: 'skill', job: 'performer', mp: 5, target: 'enemy',
    effect: { type: 'phys', mult: 1.8 },
    desc: '大玉にのって、敵1体に体当たりする。', cast: '{a}の玉のりアタック！', anim: 'ball',
  },
  // 遊び人
  js_pie: {
    name: 'パイなげ', kana: 'ぱいなげ', kind: 'skill', job: 'jester', mp: 4, target: 'enemy',
    effect: { type: 'phys', mult: 1.3, status: { status: 'blind', chance: 0.4, turns: [2, 4] } },
    desc: '敵1体の顔に、クリームのパイを投げつける。時々、前が見えなくなる。', cast: '{a}のパイなげ！', anim: 'hit',
  },
  // 会社員
  sm_kaban: {
    name: 'かばんアタック', kana: 'かばんあたっく', kind: 'skill', job: 'salaryman', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 },
    desc: '仕事の書類でぱんぱんのかばんで、敵1体をたたく。', cast: '{a}のかばんアタック！', anim: 'hit',
  },
  sm_nouki: {
    name: '納期ダッシュ', kana: 'のうきだっしゅ', kind: 'skill', job: 'salaryman', mp: 8, target: 'enemies',
    effect: { type: 'phys', mult: 1.05 },
    desc: 'しめきりに間に合わせる全力ダッシュで、敵全体にぶつかる。', cast: '{a}の納期ダッシュ！', anim: 'hit_all',
  },
  // アイドル
  id_beam: {
    name: 'キラキラビーム', kana: 'きらきらびーむ', kind: 'skill', job: 'idol', mp: 3, target: 'enemy',
    effect: { type: 'magic', element: 'light', base: [16, 22], thr: 14 },
    desc: 'ウインクから出るキラキラのビーム。敵1体に光のダメージ。', cast: '{a}のキラキラビーム！', anim: 'hearts',
  },
  id_shower: {
    name: 'ハートのシャワー', kana: 'はーとのしゃわー', kind: 'skill', job: 'idol', mp: 5, target: 'group',
    effect: { type: 'magic', element: 'light', base: [14, 20], thr: 24 },
    desc: 'たくさんのハートをふらせて、同じ種類の敵に光のダメージ。', cast: '{a}のハートのシャワー！', anim: 'hearts',
  },
  id_dome: {
    name: 'ドームライブ', kana: 'どーむらいぶ', kind: 'skill', job: 'idol', mp: 10, target: 'enemies',
    effect: { type: 'magic', element: 'light', base: [24, 32], thr: 40 },
    desc: '大きなドームでのライブ！光のステージで、敵全体にダメージ。', cast: '{a}のドームライブ！', anim: 'stage',
  },
  // 地方公務員
  lc_kouhou: {
    name: '広報車アタック', kana: 'こうほうしゃあたっく', kind: 'skill', job: 'civil_local', mp: 8, target: 'enemies',
    effect: { type: 'phys', mult: 1.05 },
    desc: '町の広報車で、敵全体の間を走りぬける。', cast: '{a}の広報車アタック！', anim: 'hit_all',
  },
  // スーパースター
  ss_stardust: {
    name: 'スターダスト', kana: 'すたーだすと', kind: 'skill', job: 'superstar', mp: 6, target: 'enemies',
    effect: { type: 'magic', element: 'light', base: [28, 38], thr: 30 },
    desc: '星のかけらをまきちらし、敵全体に光のダメージ。', cast: '{a}のスターダスト！', anim: 'meteor',
  },
  ss_nova: {
    name: 'スーパーノヴァ', kana: 'すーぱーのゔぁ', kind: 'skill', job: 'superstar', mp: 12, target: 'enemy',
    effect: { type: 'magic', element: 'light', base: [110, 135], thr: 60 },
    desc: '大スターのかがやきで、敵1体に大きな光のダメージ。', cast: '{a}のスーパーノヴァ！', anim: 'holy',
  },
  // 部長
  bc_golf: {
    name: 'ゴルフスイング', kana: 'ごるふすいんぐ', kind: 'skill', job: 'bucho', mp: 4, target: 'enemy',
    effect: { type: 'phys', mult: 1.7, critBonus: 0.1 },
    desc: 'きたえたゴルフのスイングで、敵1体をかっとばす。会心が出やすい。', cast: '{a}のゴルフスイング！ナイスショット！', anim: 'bat_swing',
  },
  bc_shucchou: {
    name: '出張ラッシュ', kana: 'しゅっちょうらっしゅ', kind: 'skill', job: 'bucho', mp: 9, target: 'enemies',
    effect: { type: 'phys', mult: 0.75, hits: 4, random: true },
    desc: 'あちこちへ出張！敵にランダムで4回攻撃する。', cast: '{a}の出張ラッシュ！', anim: 'hit_all',
  },
  // 国家公務員
  nc_roppou: {
    name: '六法全書', kana: 'ろっぽうぜんしょ', kind: 'skill', job: 'civil_national', mp: 4, target: 'enemy',
    effect: { type: 'phys', mult: 1.7 },
    desc: 'ぶあつい六法全書で、敵1体をたたく。', cast: '{a}の六法全書！', anim: 'hit',
  },
  // 警察官
  po_keibou: {
    name: 'けいぼう', kana: 'けいぼう', kind: 'skill', job: 'police', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.45, status: { status: 'paralyze', chance: 0.2, turns: [1, 1] } },
    desc: 'けいぼうで、敵1体を打つ。時々、しびれて動けなくなる。', cast: '{a}のけいぼう！', anim: 'hit',
  },
  // 魔物使い
  tm_ranbu: {
    name: 'ムチのらんぶ', kana: 'むちのらんぶ', kind: 'skill', job: 'tamer', mp: 6, target: 'enemies',
    effect: { type: 'phys', mult: 0.7, hits: 3, random: true },
    desc: 'ムチをふりまわして、敵にランダムで3回攻撃する。', cast: '{a}のムチのらんぶ！', anim: 'whip',
  },
  // パラディン
  pl_seiken: {
    name: '聖なるつるぎ', kana: 'せいなるつるぎ', kind: 'skill', job: 'paladin', mp: 4, target: 'enemy',
    effect: { type: 'phys', mult: 1.6, element: 'light', vsRace: { undead: 1.3 } },
    desc: '聖なる光をやどしたつるぎで、敵1体を切る。光の属性。', cast: '{a}の聖なるつるぎ！', anim: 'slash_light',
  },
  // 中学生
  jh_smash: {
    name: '部活のスマッシュ', kana: 'ぶかつのすまっしゅ', kind: 'skill', job: 'middleschooler', mp: 4, target: 'enemy',
    effect: { type: 'phys', mult: 1.6 },
    desc: '部活できたえたスマッシュを、敵1体にたたきこむ。', cast: '{a}の部活のスマッシュ！', anim: 'bat_swing',
  },
  // 消防士
  ff_hashigo: {
    name: 'はしご車アタック', kana: 'はしごしゃあたっく', kind: 'skill', job: 'firefighter', mp: 9, target: 'enemy',
    effect: { type: 'phys', mult: 2.1 },
    desc: 'はしご車ののびるはしごで、敵1体を大きくなぎはらう。', cast: '{a}のはしご車アタック！', anim: 'slash_heavy',
  },
  // 大神官（回復魔力で 強く なる 光の 技）
  hp_holy: {
    name: 'ホーリーライト', kana: 'ほーりーらいと', kind: 'spell', job: 'high_priest', mp: 12, target: 'group',
    effect: { type: 'magic', element: 'light', base: [65, 85], thr: 60, stat: 'heal' },
    desc: '聖なる光で、同じ種類の敵をつつむ。回復魔力が高いほど強い。', cast: '{a}はホーリーライトを唱えた！', anim: 'holy',
  },
  hp_sabaki: {
    name: '神のさばき', kana: 'かみのさばき', kind: 'spell', job: 'high_priest', mp: 22, target: 'enemies',
    effect: { type: 'magic', element: 'light', base: [120, 150], thr: 80, stat: 'heal' },
    desc: '天からの光が、敵全体をさばく。回復魔力が高いほど強い。', cast: '{a}は神のさばきを唱えた！', anim: 'meteor',
  },
  // ガーディアン（守りが かたいほど 強い 一撃）
  gd_youzai: {
    name: 'ようさいの一撃', kana: 'ようさいのいちげき', kind: 'skill', job: 'guardian', mp: 8, target: 'enemy',
    effect: { type: 'phys', mult: 1.9, atkFrom: 'def' },
    desc: 'ようさいのような体ごと、敵1体にぶつかる。守備力が高いほど強い。', cast: '{a}のようさいの一撃！', anim: 'tackle',
  },
  gd_daichi: {
    name: '大地のたて', kana: 'だいちのたて', kind: 'skill', job: 'guardian', mp: 14, target: 'enemies',
    effect: { type: 'phys', mult: 1.1, atkFrom: 'def', status: { status: 'paralyze', chance: 0.2, turns: [1, 1] } },
    desc: 'たてで大地を打ち、敵全体をゆらす。守備力が高いほど強く、時々しびれさせる。', cast: '{a}は大地をたてで打った！', anim: 'quake',
  },
  // 社長
  sh_jet: {
    name: 'プライベートジェット', kana: 'ぷらいべーとじぇっと', kind: 'skill', job: 'shacho', mp: 10, target: 'enemies',
    effect: { type: 'phys', mult: 1.3 },
    desc: '自分のジェットきで、敵全体の上をかすめる。', cast: '{a}のプライベートジェット！', anim: 'hit_all',
  },
  sh_oneman: {
    name: 'ワンマン経営', kana: 'わんまんけいえい', kind: 'skill', job: 'shacho', mp: 12, target: 'enemy',
    effect: { type: 'phys', mult: 2.6 },
    desc: 'だれの話も聞かない、強引な一撃。敵1体に大きなダメージ。', cast: '{a}のワンマン経営！', anim: 'slash_heavy',
  },
  // キャリア組
  cr_ronpa: {
    name: '論破', kana: 'ろんぱ', kind: 'skill', job: 'career', mp: 10, target: 'enemy',
    effect: { type: 'magic', base: [70, 90], thr: 60, status: { status: 'silence', chance: 0.5, turns: [2, 4] } },
    desc: '敵1体を言い負かす。ダメージをあたえ、時々呪文もふうじる。', cast: '{a}は{t}を論破した！', anim: 'debuff',
  },
  cr_hakusho: {
    name: 'ぶあつい白書', kana: 'ぶあついはくしょ', kind: 'skill', job: 'career', mp: 14, target: 'enemy',
    effect: { type: 'phys', mult: 2.5 },
    desc: '国のぶあつい白書で、敵1体を思いきりたたく。', cast: '{a}のぶあつい白書！', anim: 'slash_heavy',
  },
  // フルーツジッパー
  fz_cherry: {
    name: 'チェリーボム', kana: 'ちぇりーぼむ', kind: 'skill', job: 'fruit_idol', mp: 12, target: 'group',
    effect: { type: 'magic', element: 'blast', base: [65, 85], thr: 60 },
    desc: 'さくらんぼのばくだん。同じ種類の敵の上で爆発する。', cast: '{a}のチェリーボム！', anim: 'fruits',
  },
  fz_pine: {
    name: 'パイナップルアタック', kana: 'ぱいなっぷるあたっく', kind: 'skill', job: 'fruit_idol', mp: 12, target: 'enemy',
    effect: { type: 'phys', mult: 2.2 },
    desc: 'トゲトゲのパイナップルを、敵1体にぶつける。', cast: '{a}のパイナップルアタック！', anim: 'fruits',
  },
  // アラシ（フルーツジッパーと 同じ くらいの 強さに そろえる）
  ar_spin: {
    name: 'スピンキック', kana: 'すぴんきっく', kind: 'skill', job: 'storm_idol', mp: 12, target: 'enemy',
    effect: { type: 'phys', mult: 2.1 },
    desc: 'くるっと回ってからのキック。敵1体に大きなダメージ。', cast: '{a}のスピンキック！', anim: 'kick',
  },
  ar_inazuma: {
    name: 'いなずまステップ', kana: 'いなずますてっぷ', kind: 'skill', job: 'storm_idol', mp: 12, target: 'group',
    effect: { type: 'magic', element: 'bolt', base: [60, 78], thr: 60 },
    desc: 'いなずまのようなステップで、同じ種類の敵に雷をおとす。', cast: '{a}のいなずまステップ！', anim: 'bolt2',
  },
  // 将軍
  sg_ikkiuchi: {
    name: '一騎打ち', kana: 'いっきうち', kind: 'skill', job: 'shogun', mp: 8, target: 'enemy',
    effect: { type: 'phys', mult: 2.2, critBonus: 0.05 },
    desc: '敵1体と一騎打ち。まっすぐな太刀で大きなダメージ。', cast: '{a}「いざ、一騎打ち！」', anim: 'strash',
  },
  // 京急の運転士
  kq_renketsu: {
    name: '快特れんけつ', kana: 'かいとくれんけつ', kind: 'skill', job: 'keikyu_driver', mp: 14, target: 'enemies',
    effect: { type: 'phys', mult: 0.75, hits: 5, random: true },
    desc: '赤い車両がつぎつぎに、敵にランダムで5回ぶつかる。', cast: '{a}の快特れんけつ！', anim: 'redtrain',
  },
  // モンスターマスター
  mm_daikoushin: {
    name: '魔物の大行進', kana: 'まもののだいこうしん', kind: 'skill', job: 'monster_master', mp: 14, target: 'enemies',
    effect: { type: 'phys', mult: 1.35 },
    desc: '仲間の魔物たちと大行進！敵全体をふみならす。', cast: '{a}の魔物の大行進！', anim: 'quake',
  },

  // ───────────── ランダムの 技の 中み（おぼえない 技） ─────────────
  // 三ツ星シェフ「本日のおすすめ」
  sc_o_steak: {
    name: '本日のステーキ', kana: 'ほんじつのすてーき', kind: 'skill', job: 'star_chef', mp: 0, target: 'enemies', hidden: true,
    effect: { type: 'magic', element: 'fire', base: [100, 125], thr: 60 }, desc: '', cast: '本日のおすすめは、あつあつのステーキ！鉄板の炎が敵をおそう！', anim: 'fire_wave',
  },
  sc_o_soup: {
    name: '本日のスープ', kana: 'ほんじつのすーぷ', kind: 'skill', job: 'star_chef', mp: 0, target: 'allies', hidden: true,
    effect: { type: 'regen', base: [12, 15], thr: 50, dur: 28 }, desc: '', cast: '本日のおすすめは、とくせいスープ！体がぽかぽかしてきた！', anim: 'heal_dance',
  },
  sc_o_dessert: {
    name: '本日のデザート', kana: 'ほんじつのでざーと', kind: 'skill', job: 'star_chef', mp: 0, target: 'allies', hidden: true,
    effect: { type: 'heal', base: [90, 110], thr: 50 }, desc: '', cast: '本日のおすすめは、とくせいデザート！みんなのHPが回復した！', anim: 'heal2',
  },
  sc_o_coffee: {
    name: '本日のコーヒー', kana: 'ほんじつのこーひー', kind: 'skill', job: 'star_chef', mp: 0, target: 'allies', hidden: true,
    effect: { type: 'mpHeal', base: [8, 12] }, desc: '', cast: '本日のおすすめは、食後のコーヒー！みんなのMPが回復した！', anim: 'heal1',
  },
  // アルバイト「店長をよぶ」
  ab_t_help: {
    name: '店長の助け', kana: 'てんちょうのたすけ', kind: 'skill', job: 'parttimer', mp: 0, target: 'allies', hidden: true,
    effect: { type: 'heal', base: [35, 45], thr: 20 }, desc: '', cast: '店長がかけつけて、みんなを手当てしてくれた！', anim: 'heal_dance',
  },
  ab_t_angry: {
    name: '店長のげんこつ', kana: 'てんちょうのげんこつ', kind: 'skill', job: 'parttimer', mp: 0, target: 'enemies', hidden: true,
    effect: { type: 'phys', mult: 1.3 }, desc: '', cast: '店長「店であばれるな！」店長のげんこつが敵におちた！', anim: 'hit_all',
  },
  ab_t_away: {
    name: '店長はお休み', kana: 'てんちょうはおやすみ', kind: 'skill', job: 'parttimer', mp: 0, target: 'self', hidden: true,
    effect: { type: 'nothing' }, desc: '', cast: '…しかし店長は、今日はお休みだった。', anim: 'none',
  },
  // お笑い芸人「ボケ」
  cm_b_ukeru: {
    name: 'ボケが大うけ', kana: 'ぼけがおおうけ', kind: 'skill', job: 'comedian', mp: 0, target: 'enemies', hidden: true,
    effect: { type: 'atbSet', sub: 40, chance: 0.6, msg: '{t}は笑いころげている！', failMsg: '{t}は笑わなかった。' }, desc: '', cast: 'ボケが大うけ！敵が笑いころげた！', anim: 'laugh',
  },
  cm_b_suberu: {
    name: 'ボケがすべった', kana: 'ぼけがすべった', kind: 'skill', job: 'comedian', mp: 0, target: 'self', hidden: true,
    effect: { type: 'nothing' }, desc: '', cast: '…しーん。ボケは、すべってしまった。', anim: 'none',
  },
  cm_b_konran: {
    name: 'ボケにつられた', kana: 'ぼけにつられた', kind: 'skill', job: 'comedian', mp: 0, target: 'enemies', hidden: true,
    effect: { type: 'status', status: 'confuse', chance: 0.4, turns: [1, 2] }, desc: '', cast: 'ボケにつられて、敵がわけが分からなくなった！', anim: 'laugh',
  },
  cm_b_heal: {
    name: '仲間が笑った', kana: 'なかまがわらった', kind: 'skill', job: 'comedian', mp: 0, target: 'allies', hidden: true,
    effect: { type: 'heal', base: [30, 40], thr: 30 }, desc: '', cast: '仲間が大笑い！笑ってHPが回復した！', anim: 'heal_dance',
  },
  // お笑い芸人「ものまね」
  cm_m_warrior: {
    name: '戦士のものまね', kana: 'せんしのものまね', kind: 'skill', job: 'comedian', mp: 0, target: 'enemy', hidden: true,
    effect: { type: 'phys', mult: 1.8 }, desc: '', cast: '戦士のものまね！「大地斬！」…っぽい一撃！', anim: 'slash_heavy',
  },
  cm_m_mage: {
    name: '魔法使いのものまね', kana: 'まほうつかいのものまね', kind: 'skill', job: 'comedian', mp: 0, target: 'enemies', hidden: true,
    effect: { type: 'magic', element: 'fire', base: [40, 52], thr: 40 }, desc: '', cast: '魔法使いのものまね！なんと、本当に炎が出た！', anim: 'fire_wave',
  },
  cm_m_priest: {
    name: '僧侶のものまね', kana: 'そうりょのものまね', kind: 'skill', job: 'comedian', mp: 0, target: 'allies', hidden: true,
    effect: { type: 'heal', base: [45, 60], thr: 40 }, desc: '', cast: '僧侶のものまね！なんと、本当にみんなのキズが治った！', anim: 'heal2',
  },
  // M-1王者「決勝のネタ」
  m1_n_bakushou: {
    name: '会場が爆笑', kana: 'かいじょうがばくしょう', kind: 'skill', job: 'm1_champion', mp: 0, target: 'enemies', hidden: true,
    effect: { type: 'atbSet', sub: 70, chance: 0.75, msg: '{t}は笑いがとまらない！', failMsg: '{t}は、ぎりぎりこらえた！' }, desc: '', cast: 'ネタが大うけ！会場がゆれるほどの大爆笑！', anim: 'laugh',
  },
  m1_n_ichigan: {
    name: '会場が一つに', kana: 'かいじょうがひとつに', kind: 'skill', job: 'm1_champion', mp: 0, target: 'allies', hidden: true,
    effect: { type: 'buff', stats: ['atk', 'def', 'agi'], mult: 1.3, dur: 40 }, desc: '', cast: '会場が一つになった！みんなの力がわいてくる！', anim: 'warcry',
  },
  m1_n_manten: {
    name: 'しんさ員の満点', kana: 'しんさいんのまんてん', kind: 'skill', job: 'm1_champion', mp: 0, target: 'enemies', hidden: true,
    effect: { type: 'magic', element: 'light', base: [140, 170], thr: 70 }, desc: '', cast: 'しんさ員が全員満点！まばゆい光が敵をつつむ！', anim: 'meteor',
  },
  m1_n_suberi: {
    name: '大すべり', kana: 'おおすべり', kind: 'skill', job: 'm1_champion', mp: 0, target: 'self', hidden: true,
    effect: { type: 'nothing' }, desc: '', cast: '…まさかの大すべり。会場が、しーんとした。', anim: 'none',
  },
};
