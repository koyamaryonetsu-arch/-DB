// 上級職・超級職の 呪文と 特技
// （書きかたは abilities.js と おなじ。ここで ふえた effect: buff の stats[]、mpHeal、random、phys の recoil、magic の status、deadAllies）
// 名前の一部は「ドラゴンクエスト」「ダイの大冒険」へのオマージュです。

export const ADV_ABILITIES = {
  // ───────────── バトルマスター ─────────────
  bm_moroba: {
    name: 'もろばぎり', kana: 'もろばぎり', kind: 'skill', job: 'battlemaster', mp: 0, target: 'enemy', weapon: 'blade',
    effect: { type: 'phys', mult: 2.0, recoil: 0.25 },
    desc: 'みを すてた いちげき。あたえた ダメージの 4ぶんの1を じぶんも うける。', cast: '{a}の もろばぎり！', anim: 'slash_heavy', sword: true,
  },
  bm_musou: {
    name: 'むそうぎり', kana: 'むそうぎり', kind: 'skill', job: 'battlemaster', mp: 4, target: 'enemy', weapon: 'blade',
    effect: { type: 'phys', mult: 0.95, hits: 2 },
    desc: 'めにも とまらぬ 2かいぎり。', cast: '{a}の むそうぎり！', anim: 'slash_multi', sword: true,
  },
  bm_otakebi: {
    name: 'おたけび', kana: 'おたけび', kind: 'skill', job: 'battlemaster', mp: 4, target: 'enemies',
    effect: { type: 'status', status: 'paralyze', chance: 0.35, turns: [1, 1] },
    desc: 'すさまじい さけびごえで てきを すくませる。', cast: '{a}の おたけび！', anim: 'warcry',
  },
  bm_tension: {
    name: 'テンションバーン', kana: 'てんしょんばーん', kind: 'skill', job: 'battlemaster', mp: 3, target: 'self',
    effect: { type: 'charge', mult: 3.0 },
    desc: 'きあいを ばくはつさせ、つぎの こうげきを 3ばいにする。', cast: '{a}の テンションが ばくはつした！', anim: 'charge',
  },
  bm_hakai: {
    name: 'はかいのいちげき', kana: 'はかいのいちげき', kind: 'skill', job: 'battlemaster', mp: 12, target: 'enemy',
    effect: { type: 'phys', mult: 3.2, ignoreDef: 0.4 },
    desc: 'かたい まもりも うちくだく さいきょうの いちげき。', cast: '{a}の はかいのいちげき！', anim: 'slash_heavy',
  },

  // ───────────── パラディン ─────────────
  pl_daibougyo: {
    name: 'だいぼうぎょ', kana: 'だいぼうぎょ', kind: 'skill', job: 'paladin', mp: 0, target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 2.6, dur: 12 },
    desc: 'しばらく しゅび力が とても たかくなる。', cast: '{a}は どっしりと かまえた！', anim: 'guard',
  },
  pl_hikari: {
    name: 'いやしのひかり', kana: 'いやしのひかり', kind: 'spell', job: 'paladin', mp: 5, target: 'ally', field: true,
    effect: { type: 'heal', base: [90, 110], thr: 40 },
    desc: 'なかま 1人の HPを 100ほど かいふくする。', cast: '{a}の てから いやしの ひかりが あふれた！', anim: 'heal2',
  },
  pl_grandcross: {
    name: 'グランドクロス', kana: 'ぐらんどくろす', kind: 'skill', job: 'paladin', mp: 8, target: 'enemies',
    effect: { type: 'phys', mult: 0.9, element: 'light', ignoreDef: 0.5, vsRace: { undead: 1.6, demon: 1.3 } },
    desc: 'せいなる じゅうじの ひかりで てき 全体を きる。ゆうれいや まぞくに とても つよい。', cast: '{a}の グランドクロス！', anim: 'slash_light',
  },
  pl_aegis: {
    name: 'アイギスのまもり', kana: 'あいぎすのまもり', kind: 'spell', job: 'paladin', mp: 8, target: 'allies',
    effect: { type: 'buff', stat: 'def', mult: 1.45, dur: 45 },
    desc: 'なかま 全員の しゅび力を おおきく あげる。', cast: '{a}は アイギスの まもりを となえた！', anim: 'guard',
  },
  pl_judgment: {
    name: 'ジャッジメント', kana: 'じゃっじめんと', kind: 'skill', job: 'paladin', mp: 10, target: 'enemy',
    effect: { type: 'phys', mult: 2.6, element: 'light', vsRace: { undead: 1.5, demon: 1.5 } },
    desc: 'せいなる さばきの いちげき。', cast: '{a}の ジャッジメント！', anim: 'strash',
  },

  // ───────────── 魔法戦士 ─────────────
  mk_kaengiri: {
    name: 'かえんぎり', kana: 'かえんぎり', kind: 'skill', job: 'magic_knight', mp: 3, target: 'enemy', weapon: 'blade',
    effect: { type: 'phys', mult: 1.3, element: 'fire' },
    desc: 'ほのおを まとった けんで きる。', cast: '{a}の かえんぎり！', anim: 'mahouken', sword: true,
  },
  mk_hyouketsu: {
    name: 'ひょうけつぎり', kana: 'ひょうけつぎり', kind: 'skill', job: 'magic_knight', mp: 3, target: 'enemy', weapon: 'blade',
    effect: { type: 'phys', mult: 1.3, element: 'ice' },
    desc: 'こおりを まとった けんで きる。', cast: '{a}の ひょうけつぎり！', anim: 'mahouken', sword: true,
  },
  mk_inazuma: {
    name: 'いなずまぎり', kana: 'いなずまぎり', kind: 'skill', job: 'magic_knight', mp: 4, target: 'enemy', weapon: 'blade',
    effect: { type: 'phys', mult: 1.45, element: 'bolt' },
    desc: 'いかずちを まとった けんで きる。', cast: '{a}の いなずまぎり！', anim: 'gigabreak', sword: true,
  },
  mk_forcebreak: {
    name: 'フォースブレイク', kana: 'ふぉーすぶれいく', kind: 'skill', job: 'magic_knight', mp: 5, target: 'enemy',
    effect: { type: 'debuff', stat: 'def', mult: 0.55, dur: 40, chance: 0.95 },
    desc: 'てきの まもりの ちからを うちくだく。しゅび力が おおきく さがる。', cast: '{a}の フォースブレイク！', anim: 'debuff',
  },
  mk_raiden: {
    name: 'ライデイン', kana: 'らいでいん', kind: 'spell', job: 'magic_knight', mp: 8, target: 'enemy',
    effect: { type: 'magic', element: 'bolt', base: [60, 75], thr: 45 },
    desc: 'てんから いかずちを おとす。', cast: '{a}は ライデインを となえた！', anim: 'bolt1', attackSpell: true,
  },
  mk_burst: {
    name: 'マジックバースト', kana: 'まじっくばーすと', kind: 'spell', job: 'magic_knight', mp: 20, target: 'enemies',
    effect: { type: 'magic', element: 'void', base: [90, 110], thr: 60 },
    desc: 'まりょくを ばくはつさせて てき 全体を ふきとばす。', cast: '{a}の まりょくが ばくはつした！ マジックバースト！', anim: 'blast2',
  },

  // ───────────── 海賊 ─────────────
  pr_kaizokugiri: {
    name: 'かいぞくぎり', kana: 'かいぞくぎり', kind: 'skill', job: 'pirate', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.4, debuff: { stat: 'atk', mult: 0.8, dur: 30, chance: 0.6 } },
    desc: 'あらっぽい いちげき。てきの こうげき力を さげる ことが ある。', cast: '{a}の かいぞくぎり！', anim: 'slash_heavy',
  },
  pr_uzushio: {
    name: 'うずしお', kana: 'うずしお', kind: 'skill', job: 'pirate', mp: 6, target: 'enemies', spellLike: true,
    effect: { type: 'magic', element: 'ice', base: [30, 40], thr: 30 },
    desc: 'おおきな うずしおで てき 全体を のみこむ。', cast: '{a}は うずしおを よびだした！', anim: 'ice2',
  },
  pr_ikari: {
    name: 'いかりのいっぱつ', kana: 'いかりのいっぱつ', kind: 'skill', job: 'pirate', mp: 5, target: 'enemy',
    effect: { type: 'phys', mult: 2.2, acc: 0.8 },
    desc: 'いかりを こめた おもい いっぱつ。すこし はずれやすい。', cast: '{a}の いかりの いっぱつ！', anim: 'slash_heavy',
  },
  pr_utage: {
    name: 'うたげのうた', kana: 'うたげのうた', kind: 'skill', job: 'pirate', mp: 7, target: 'allies',
    effect: { type: 'buff', stat: 'atk', mult: 1.3, dur: 35 },
    desc: 'ごうかいな うたで なかま 全員の こうげき力を あげる。', cast: '{a}は うたげの うたを うたった！', anim: 'dance',
  },
  pr_cannon: {
    name: 'たいほう', kana: 'たいほう', kind: 'skill', job: 'pirate', mp: 10, target: 'enemies', spellLike: true,
    effect: { type: 'magic', element: 'blast', base: [50, 65], thr: 40 },
    desc: 'ふねの たいほうを うちこむ。てき 全体に ばくはつの ダメージ。', cast: '{a}の あいずで たいほうが ひを ふいた！', anim: 'blast2',
  },

  // ───────────── 聖拳士 ─────────────
  hf_seikou: {
    name: 'せいこうけん', kana: 'せいこうけん', kind: 'skill', job: 'holyfist', mp: 3, target: 'enemy', weapon: 'fist',
    effect: { type: 'phys', mult: 1.6, element: 'light', vsRace: { undead: 1.5 } },
    desc: 'せいなる ひかりを こめた こぶし。', cast: '{a}の せいこうけん！', anim: 'holy_punch', fist: true,
  },
  hf_meisou: {
    name: 'めいそう', kana: 'めいそう', kind: 'skill', job: 'holyfist', mp: 4, target: 'self',
    effect: { type: 'heal', base: [90, 110], thr: 30 },
    desc: 'こころを しずめて じぶんの HPを おおきく かいふくする。', cast: '{a}は めいそうした！', anim: 'heal2',
  },
  hf_mikiri: {
    name: 'みきり', kana: 'みきり', kind: 'skill', job: 'holyfist', mp: 3, target: 'self',
    effect: { type: 'buff', stat: 'eva', add: 0.45, dur: 30 },
    desc: 'てきの うごきを みきって かわしやすくなる。', cast: '{a}は てきの うごきを みきった！', anim: 'buff',
  },
  hf_tenshou: {
    name: 'てんしょうれっぱ', kana: 'てんしょうれっぱ', kind: 'skill', job: 'holyfist', mp: 7, target: 'enemies',
    effect: { type: 'phys', mult: 0.95, element: 'light' },
    desc: 'てんに のぼる ひかりの なみで てき 全体を うつ。', cast: '{a}の てんしょうれっぱ！', anim: 'kick',
  },
  hf_hyakka: {
    name: 'せいなる百烈拳', kana: 'せいなるひゃくれつけん', kind: 'skill', job: 'holyfist', mp: 10, target: 'enemy', weapon: 'fist',
    effect: { type: 'phys', mult: 0.45, hits: 7, element: 'light' },
    desc: 'ひかりを まとった 7れんぞくの こぶし。', cast: '{a}の せいなる百烈拳！', anim: 'punch_multi', fist: true,
  },

  // ───────────── 忍者 ─────────────
  nj_shuriken: {
    name: 'しゅりけん', kana: 'しゅりけん', kind: 'skill', job: 'ninja', mp: 2, target: 'enemies',
    effect: { type: 'phys', mult: 0.55, hits: 3, random: true },
    desc: 'しゅりけんを 3まい なげる。あいては ランダム。', cast: '{a}は しゅりけんを なげた！', anim: 'shuriken',
  },
  nj_katon: {
    name: 'かとんのじゅつ', kana: 'かとんのじゅつ', kind: 'skill', job: 'ninja', mp: 4, target: 'group', spellLike: true,
    effect: { type: 'magic', element: 'fire', base: [26, 36], thr: 25 },
    desc: 'にんぽうの ほのおで おなじ しゅるいの てきを やく。', cast: '{a}の かとんの じゅつ！', anim: 'fire_wave',
  },
  nj_bunshin: {
    name: 'ぶんしんのじゅつ', kana: 'ぶんしんのじゅつ', kind: 'skill', job: 'ninja', mp: 4, target: 'self',
    effect: { type: 'buff', stat: 'eva', add: 0.5, dur: 30 },
    desc: 'ぶんしんを つくって てきの こうげきを とても かわしやすくする。', cast: '{a}は ぶんしんした！', anim: 'buff',
  },
  nj_kagenui: {
    name: 'かげぬい', kana: 'かげぬい', kind: 'skill', job: 'ninja', mp: 4, target: 'enemy',
    effect: { type: 'status', status: 'paralyze', chance: 0.55, turns: [1, 2] },
    desc: 'てきの かげを ぬいつけて うごけなくする。', cast: '{a}の かげぬい！', anim: 'debuff',
  },
  nj_fuujin: {
    name: 'ふうじんのじゅつ', kana: 'ふうじんのじゅつ', kind: 'skill', job: 'ninja', mp: 9, target: 'enemies', spellLike: true,
    effect: { type: 'magic', element: 'wind', base: [45, 60], thr: 40 },
    desc: 'かぜの かみを よび、てき 全体を きりさく。', cast: '{a}の ふうじんの じゅつ！', anim: 'wind2',
  },

  // ───────────── まもの使い ─────────────
  tm_shippu: {
    name: 'しっぷうのムチ', kana: 'しっぷうのむち', kind: 'skill', job: 'tamer', mp: 3, target: 'group', weapon: 'whip',
    effect: { type: 'phys', mult: 0.95 },
    desc: 'ムチで おなじ しゅるいの てきを まとめて うつ。', cast: '{a}の しっぷうのムチ！', anim: 'whip',
  },
  tm_beast: {
    name: 'ビーストモード', kana: 'びーすともーど', kind: 'skill', job: 'tamer', mp: 5, target: 'self',
    effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.3, dur: 35 },
    desc: 'けもののように たけりたち、こうげき力と すばやさを あげる。', cast: '{a}は ビーストモードに なった！', anim: 'warcry',
  },
  tm_kemono: {
    name: 'けもののさけび', kana: 'けもののさけび', kind: 'skill', job: 'tamer', mp: 4, target: 'enemies',
    effect: { type: 'debuff', stat: 'atk', mult: 0.8, dur: 30, chance: 0.75 },
    desc: 'てき 全体を おびえさせ、こうげき力を さげる。', cast: '{a}は けものの ように さけんだ！', anim: 'warcry',
  },
  tm_kizuna: {
    name: 'きずなのほえごえ', kana: 'きずなのほえごえ', kind: 'skill', job: 'tamer', mp: 8, target: 'allies',
    effect: { type: 'buff', stats: ['atk', 'def'], mult: 1.2, dur: 30 },
    desc: 'なかま 全員の こうげき力と しゅび力を あげる。まものの なかまが いると こころづよい。', cast: '{a}の ほえごえが ひびきわたった！', anim: 'warcry',
  },
  tm_majuu: {
    name: 'まじゅうのいちげき', kana: 'まじゅうのいちげき', kind: 'skill', job: 'tamer', mp: 9, target: 'enemy',
    effect: { type: 'phys', mult: 2.5 },
    desc: 'まじゅうの ちからを やどした いちげき。', cast: '{a}の まじゅうの いちげき！', anim: 'bite',
  },

  // ───────────── 賢者 ─────────────
  sg_behoma: {
    name: 'ベホマ', kana: 'べほま', kind: 'spell', job: 'sage', mp: 7, target: 'ally', field: true,
    effect: { type: 'heal', base: [230, 270], thr: 70 },
    desc: 'なかま 1人の HPを すっかり かいふくする。', cast: '{a}は ベホマを となえた！', anim: 'heal2',
  },
  sg_bagikurosu: {
    name: 'バギクロス', kana: 'ばぎくろす', kind: 'spell', job: 'sage', mp: 9, target: 'group',
    effect: { type: 'magic', element: 'wind', base: [60, 80], thr: 60 },
    desc: 'じゅうじの たつまきで おなじ しゅるいの てきを きりさく。', cast: '{a}は バギクロスを となえた！', anim: 'wind2', attackSpell: true,
  },
  sg_zaoral: {
    name: 'ザオラル', kana: 'ざおらる', kind: 'spell', job: 'sage', mp: 12, target: 'deadAlly', field: true,
    effect: { type: 'revive', hpRatio: 0.5 },
    desc: 'しんでしまった なかまを HPはんぶんで いきかえらせる。', cast: '{a}は ザオラルを となえた！', anim: 'revive',
  },
  sg_mahyado: {
    name: 'マヒャド', kana: 'まひゃど', kind: 'spell', job: 'sage', mp: 12, target: 'group',
    effect: { type: 'magic', element: 'ice', base: [72, 92], thr: 70 },
    desc: 'こおりの やいばで おなじ しゅるいの てきを こおりつかせる。', cast: '{a}は マヒャドを となえた！', anim: 'ice2', attackSpell: true,
  },
  sg_inori: {
    name: 'けんじゃのいのり', kana: 'けんじゃのいのり', kind: 'spell', job: 'sage', mp: 18, target: 'allies', field: true,
    effect: { type: 'heal', base: [95, 115], thr: 70 },
    desc: 'なかま 全員の HPを 100ほど かいふくする。', cast: '{a}は けんじゃの いのりを ささげた！', anim: 'heal2',
  },

  // ───────────── スーパースター ─────────────
  ss_stardance: {
    name: 'スターダンス', kana: 'すたーだんす', kind: 'skill', job: 'superstar', mp: 6, target: 'allies', field: true,
    effect: { type: 'heal', base: [34, 44], thr: 20 },
    desc: 'きらきらの おどりで なかま 全員を かいふくする。', cast: '{a}の スターダンス！', anim: 'heal_dance',
  },
  ss_spotlight: {
    name: 'スポットライト', kana: 'すぽっとらいと', kind: 'skill', job: 'superstar', mp: 4, target: 'self',
    effect: { type: 'cover', dur: 15, all: true, defMult: 1.3 },
    desc: 'てきの ちゅうもくを あつめ、なかまへの こうげきを ひきうける。', cast: '{a}に スポットライトが あたった！', anim: 'guard',
  },
  ss_charm: {
    name: 'みりょうのポーズ', kana: 'みりょうのぽーず', kind: 'skill', job: 'superstar', mp: 5, target: 'group',
    effect: { type: 'status', status: 'confuse', chance: 0.6, turns: [1, 3] },
    desc: 'みりょくてきな ポーズで てきを こんらんさせる。', cast: '{a}の みりょうの ポーズ！', anim: 'dance',
  },
  ss_happy: {
    name: 'ハッピーパレード', kana: 'はっぴーぱれーど', kind: 'skill', job: 'superstar', mp: 10, target: 'allies',
    effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.25, dur: 35 },
    desc: 'なかま 全員の こうげき力と すばやさを あげる。', cast: '{a}の ハッピーパレード！', anim: 'dance',
  },
  ss_encore: {
    name: 'アンコール', kana: 'あんこーる', kind: 'skill', job: 'superstar', mp: 8, target: 'allies',
    effect: { type: 'bondUp', amount: 40 },
    desc: 'かんせいに こたえて きずなゲージを たくさん ふやす。', cast: '{a}の アンコール！', anim: 'dance',
  },

  // ───────────── 占い師 ─────────────
  ft_sun: {
    name: 'タロット「たいよう」', kana: 'たろっとたいよう', kind: 'skill', job: 'fortune', mp: 7, target: 'allies', field: true,
    effect: { type: 'heal', base: [42, 56], thr: 30 },
    desc: 'たいようの カード。なかま 全員の HPを かいふくする。', cast: '{a}は「たいよう」の カードを ひいた！', anim: 'heal2',
  },
  ft_moon: {
    name: 'タロット「つき」', kana: 'たろっとつき', kind: 'skill', job: 'fortune', mp: 6, target: 'enemies',
    effect: { type: 'status', status: 'sleep', chance: 0.5, turns: [1, 3] },
    desc: 'つきの カード。てき 全体を ねむらせる ことが ある。', cast: '{a}は「つき」の カードを ひいた！', anim: 'sleep',
  },
  ft_star: {
    name: 'タロット「ほし」', kana: 'たろっとほし', kind: 'skill', job: 'fortune', mp: 7, target: 'enemies', spellLike: true,
    effect: { type: 'magic', element: 'light', base: [36, 46], thr: 35 },
    desc: 'ほしの カード。ほしの ひかりが てき 全体に ふりそそぐ。', cast: '{a}は「ほし」の カードを ひいた！', anim: 'meteor',
  },
  ft_tower: {
    name: 'タロット「とう」', kana: 'たろっととう', kind: 'skill', job: 'fortune', mp: 10, target: 'enemy', spellLike: true,
    effect: { type: 'magic', element: 'blast', base: [95, 115], thr: 50 },
    desc: 'とうの カード。いかずちが とうを うちくだくように てき 1体に だいばくはつ。', cast: '{a}は「とう」の カードを ひいた！', anim: 'blast1',
  },
  ft_fate: {
    name: 'タロット「うんめいのわ」', kana: 'たろっとうんめいのわ', kind: 'skill', job: 'fortune', mp: 12, target: 'self',
    effect: { type: 'random', options: ['ft_fate_heal', 'ft_fate_meteor', 'ft_fate_bond', 'ft_fate_power'] },
    desc: 'うんめいの カード。なにが おこるかは ひいてからの おたのしみ。どれも よい ことが おこる。', cast: '{a}は「うんめいの わ」の カードを ひいた！', anim: 'dance',
  },
  ft_fate_heal: {
    name: 'だいいやし', kana: 'だいいやし', kind: 'skill', job: 'fortune', mp: 0, target: 'allies', hidden: true,
    effect: { type: 'heal', base: [150, 180], thr: 60 }, cast: 'めがみの ほほえみ！ みんなの キズが いえていく！', anim: 'heal2',
  },
  ft_fate_meteor: {
    name: 'りゅうせい', kana: 'りゅうせい', kind: 'skill', job: 'fortune', mp: 0, target: 'enemies', hidden: true, spellLike: true,
    effect: { type: 'magic', element: 'light', base: [110, 140], thr: 60 }, cast: 'そらから ほしが ふってきた！', anim: 'meteor',
  },
  ft_fate_bond: {
    name: 'きずなのほし', kana: 'きずなのほし', kind: 'skill', job: 'fortune', mp: 0, target: 'allies', hidden: true,
    effect: { type: 'bondUp', amount: 60 }, cast: 'きずなの ほしが かがやいた！', anim: 'dance',
  },
  ft_fate_power: {
    name: 'ゆうきのほし', kana: 'ゆうきのほし', kind: 'skill', job: 'fortune', mp: 0, target: 'allies', hidden: true,
    effect: { type: 'buff', stats: ['atk', 'def', 'agi'], mult: 1.25, dur: 35 }, cast: 'ゆうきの ほしが みんなを つつんだ！', anim: 'buff',
  },

  // ───────────── 竜の騎士 ─────────────
  dk_aura: {
    name: '竜闘気', kana: 'どらごにっくおーら', kind: 'skill', job: 'dragon_knight', mp: 6, target: 'self',
    effect: { type: 'buff', stats: ['atk', 'def'], mult: 1.4, dur: 40 },
    desc: 'ドラゴニックオーラを まとい、こうげき力と しゅび力を おおきく あげる。', cast: '{a}の からだが 竜闘気に つつまれた！', anim: 'charge',
  },
  dk_gigabreak: {
    name: 'ギガブレイク', kana: 'ぎがぶれいく', kind: 'skill', job: 'dragon_knight', mp: 12, target: 'enemy', weapon: 'blade',
    effect: { type: 'phys', mult: 2.6, element: 'bolt' },
    desc: 'けんに いかずちを おとし、そのまま きりさく 竜の騎士の ひっさつけん。', cast: '{a}は けんを てんに かかげた…！ ギガブレイク！', anim: 'gigabreak', sword: true,
  },
  dk_crest: {
    name: '竜の紋章', kana: 'りゅうのもんしょう', kind: 'skill', job: 'dragon_knight', mp: 8, target: 'self',
    effect: { type: 'heal', base: [220, 260], thr: 50 },
    desc: 'ひたいの 竜の紋章が かがやき、じぶんの キズを いやす。', cast: '{a}の ひたいに 竜の紋章が うかびあがった！', anim: 'heal2',
  },
  dk_ikari: {
    name: '竜のいかり', kana: 'りゅうのいかり', kind: 'skill', job: 'dragon_knight', mp: 10, target: 'enemies',
    effect: { type: 'phys', mult: 1.2, element: 'fire' },
    desc: '竜の いかりの ほのおで てき 全体を なぎはらう。', cast: '{a}の 竜の いかり！', anim: 'fire_tornado',
  },
  dk_doruora: {
    name: 'ドルオーラ', kana: 'どるおーら', kind: 'skill', job: 'dragon_knight', mp: 28, target: 'enemy', spellLike: true,
    effect: { type: 'magic', element: 'void', base: [300, 360], thr: 80 },
    desc: '竜闘気を りょうての ひらに あつめて はなつ、竜の騎士 さいきょうの わざ。', cast: '{a}は りょうてを つきだした…！ ドルオーラ！', anim: 'dragon_beam',
  },

  // ───────────── 大魔道士 ─────────────
  am_begiragon: {
    name: 'ベギラゴン', kana: 'べぎらごん', kind: 'spell', job: 'archmage', mp: 14, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [80, 100], thr: 70 },
    desc: 'ほのおの なみで てき 全体を やきはらう。', cast: '{a}は ベギラゴンを となえた！', anim: 'fire_wave', attackSpell: true,
  },
  am_manaheal: {
    name: 'まりょくのいずみ', kana: 'まりょくのいずみ', kind: 'skill', job: 'archmage', mp: 0, target: 'self',
    effect: { type: 'mpHeal', base: [18, 26] },
    desc: 'まりょくを あつめて じぶんの MPを かいふくする。', cast: '{a}は しずかに まりょくを あつめた…', anim: 'buff',
  },
  am_ionazun: {
    name: 'イオナズン', kana: 'いおなずん', kind: 'spell', job: 'archmage', mp: 18, target: 'enemies',
    effect: { type: 'magic', element: 'blast', base: [105, 130], thr: 80 },
    desc: 'ちょうばくはつで てき 全体を ふきとばす。', cast: '{a}は イオナズンを となえた！', anim: 'blast2', attackSpell: true,
  },
  am_meragaia: {
    name: 'メラガイアー', kana: 'めらがいあー', kind: 'spell', job: 'archmage', mp: 20, target: 'enemy',
    effect: { type: 'magic', element: 'fire', base: [230, 270], thr: 90 },
    desc: 'たいようの ような きょだいな ほのおの たまを ぶつける。', cast: '{a}は メラガイアーを となえた！', anim: 'fire3', attackSpell: true,
  },
  am_medroa: {
    name: 'メドローア', kana: 'めどろーあ', kind: 'spell', job: 'archmage', mp: 30, target: 'enemy',
    effect: { type: 'magic', element: 'void', base: [320, 380], thr: 90 },
    desc: 'ほのおと こおりを まったく おなじ ちからで あわせた しょう消滅呪文の かんせいけい。大魔道士だけが つかえる。', cast: '{a}は ゆみを ひくように かまえた… メドローア！', anim: 'void',
  },

  // ───────────── 大神官 ─────────────
  hp_seinaru: {
    name: 'せいなるいのり', kana: 'せいなるいのり', kind: 'spell', job: 'high_priest', mp: 6, target: 'allies',
    effect: { type: 'cure', statuses: ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'] },
    desc: 'なかま 全員の どく・ねむり・まひ・こんらんなどを すべて なおす。', cast: '{a}は せいなる いのりを ささげた！', anim: 'heal1',
  },
  hp_zaoriku: {
    name: 'ザオリク', kana: 'ざおりく', kind: 'spell', job: 'high_priest', mp: 20, target: 'deadAlly', field: true,
    effect: { type: 'revive', hpRatio: 1.0 },
    desc: 'しんでしまった なかまを かんぜんに いきかえらせる。', cast: '{a}は ザオリクを となえた！', anim: 'revive',
  },
  hp_bagimuta: {
    name: 'バギムーチョ', kana: 'ばぎむーちょ', kind: 'spell', job: 'high_priest', mp: 18, target: 'enemies',
    effect: { type: 'magic', element: 'wind', base: [110, 130], thr: 80 },
    desc: 'きょだいな たつまきで てき 全体を きりさく。', cast: '{a}は バギムーチョを となえた！', anim: 'wind2', attackSpell: true,
  },
  hp_behomazun: {
    name: 'ベホマズン', kana: 'べほまずん', kind: 'spell', job: 'high_priest', mp: 30, target: 'allies', field: true,
    effect: { type: 'heal', base: [220, 260], thr: 80 },
    desc: 'なかま 全員の HPを すっかり かいふくする。', cast: '{a}は ベホマズンを となえた！', anim: 'heal2',
  },
  hp_tenshi: {
    name: 'てんしのうたごえ', kana: 'てんしのうたごえ', kind: 'spell', job: 'high_priest', mp: 30, target: 'deadAllies',
    effect: { type: 'revive', hpRatio: 0.5 },
    desc: 'てんしの うたごえで しんでしまった なかまを みんな いきかえらせる。', cast: 'てんしの うたごえが ひびきわたった…！', anim: 'revive',
  },

  // ───────────── ゴッドハンド ─────────────
  gh_shinsoku: {
    name: 'しんそくのけん', kana: 'しんそくのけん', kind: 'skill', job: 'god_hand', mp: 6, target: 'enemy',
    effect: { type: 'phys', mult: 1.8, atbAfter: 70 },
    desc: 'かみの はやさの いちげき。うったあと すぐに つぎの じゅんばんが くる。', cast: '{a}の しんそくの けん！', anim: 'punch',
  },
  gh_tenchi: {
    name: 'てんちのかまえ', kana: 'てんちのかまえ', kind: 'skill', job: 'god_hand', mp: 5, target: 'self',
    effect: { type: 'buff', stats: ['atk', 'def'], mult: 1.35, dur: 35 },
    desc: 'てんちの かまえで こうげき力と しゅび力を あげる。', cast: '{a}は てんちの かまえを とった！', anim: 'charge',
  },
  gh_musou: {
    name: 'むそうけん', kana: 'むそうけん', kind: 'skill', job: 'god_hand', mp: 10, target: 'enemy',
    effect: { type: 'phys', mult: 0.8, hits: 4 },
    desc: 'いきを つかせぬ 4れんげき。', cast: '{a}の むそうけん！', anim: 'punch_multi',
  },
  gh_ikazuchi: {
    name: 'いかずちのけん', kana: 'いかずちのけん', kind: 'skill', job: 'god_hand', mp: 12, target: 'enemies',
    effect: { type: 'phys', mult: 1.15, element: 'bolt' },
    desc: 'いかずちの ように てき 全体を うつ。', cast: '{a}の いかずちの けん！', anim: 'bolt2',
  },
  gh_godfist: {
    name: 'ゴッドハンド', kana: 'ごっどはんど', kind: 'skill', job: 'god_hand', mp: 16, target: 'enemy',
    effect: { type: 'phys', mult: 3.5, ignoreDef: 0.5, critBonus: 0.2, element: 'light' },
    desc: 'かみの こぶし。かたい てきも うちくだき、かいしんも でやすい。', cast: '{a}の こぶしが ひかりを はなった！ ゴッドハンド！', anim: 'holy_punch',
  },

  // ───────────── 天地雷鳴士 ─────────────
  sm_ifrit: {
    name: 'げんま「ほのおのまじん」', kana: 'ほのおのまじん', kind: 'spell', job: 'summoner', mp: 12, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [70, 90], thr: 60 },
    desc: 'ほのおの まじんを よびだし、てき 全体を やきはらう。', cast: '{a}は ほのおの まじんを よびだした！', anim: 'summon',
  },
  sm_undine: {
    name: 'げんま「みずのせいれい」', kana: 'みずのせいれい', kind: 'spell', job: 'summoner', mp: 12, target: 'allies', field: true,
    effect: { type: 'heal', base: [75, 95], thr: 60 },
    desc: 'みずの せいれいを よびだし、なかま 全員を いやす。', cast: '{a}は みずの せいれいを よびだした！', anim: 'heal_dance',
  },
  sm_raijin: {
    name: 'げんま「らいじん」', kana: 'らいじん', kind: 'spell', job: 'summoner', mp: 16, target: 'enemies',
    effect: { type: 'magic', element: 'bolt', base: [90, 115], thr: 70 },
    desc: 'かみなりの かみを よびだし、てき 全体に いかずちを おとす。', cast: '{a}は らいじんを よびだした！', anim: 'bolt2',
  },
  sm_kyojin: {
    name: 'げんま「だいちのきょじん」', kana: 'だいちのきょじん', kind: 'spell', job: 'summoner', mp: 14, target: 'allies',
    effect: { type: 'buff', stats: ['def', 'atk'], mult: 1.3, dur: 40 },
    desc: 'だいちの きょじんが なかま 全員を まもり、ちからを かしてくれる。', cast: '{a}は だいちの きょじんを よびだした！', anim: 'guard',
  },
  sm_jigo: {
    name: 'ジゴスパーク', kana: 'じごすぱーく', kind: 'spell', job: 'summoner', mp: 24, target: 'enemies',
    effect: { type: 'magic', element: 'dark', base: [130, 160], thr: 80, status: { status: 'paralyze', chance: 0.25, turns: [1, 2] } },
    desc: 'じごくの いかずちで てき 全体を うつ。まひさせる ことも ある。', cast: '{a}は ジゴスパークを はなった！', anim: 'dark1',
  },

  // ───────────── 魔剣士 ─────────────
  ms_dark: {
    name: 'ダークネスブレード', kana: 'だーくねすぶれーど', kind: 'skill', job: 'magic_swordsman', mp: 5, target: 'enemy', weapon: 'blade',
    effect: { type: 'phys', mult: 1.7, element: 'dark' },
    desc: 'やみの ちからを こめた けんで きる。', cast: '{a}の ダークネスブレード！', anim: 'dark_slash', sword: true,
  },
  ms_soul: {
    name: 'ソウルイーター', kana: 'そうるいーたー', kind: 'skill', job: 'magic_swordsman', mp: 6, target: 'enemy',
    effect: { type: 'drainHp', mult: 1.4 },
    desc: 'てきの いのちを すいとる けん。あたえた ダメージの はんぶん HPが かいふくする。', cast: '{a}の ソウルイーター！', anim: 'dark_slash',
  },
  ms_jubaku: {
    name: 'じゅばくのやいば', kana: 'じゅばくのやいば', kind: 'skill', job: 'magic_swordsman', mp: 6, target: 'enemy', weapon: 'blade',
    effect: { type: 'phys', mult: 1.2, status: { status: 'paralyze', chance: 0.45, turns: [1, 2] } },
    desc: 'のろいの やいばで きり、うごけなくする ことが ある。', cast: '{a}の じゅばくの やいば！', anim: 'dark_slash', sword: true,
  },
  ms_ankoku: {
    name: 'あんこくのころも', kana: 'あんこくのころも', kind: 'skill', job: 'magic_swordsman', mp: 6, target: 'self',
    effect: { type: 'buff', stat: 'atk', mult: 1.5, dur: 35 },
    desc: 'やみの ころもを まとい、こうげき力を おおきく あげる。', cast: '{a}は あんこくの ころもを まとった！', anim: 'charge',
  },
  ms_hades: {
    name: 'ハデスブレイド', kana: 'はですぶれいど', kind: 'skill', job: 'magic_swordsman', mp: 16, target: 'enemies', weapon: 'blade',
    effect: { type: 'phys', mult: 1.4, element: 'dark' },
    desc: 'めいかいの けんで てき 全体を なぎはらう。', cast: '{a}の ハデスブレイド！', anim: 'dark_slash', sword: true,
  },

  // ───────────── ガーディアン ─────────────
  gd_wall: {
    name: 'てっぺきのかまえ', kana: 'てっぺきのかまえ', kind: 'skill', job: 'guardian', mp: 4, target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 2.0, dur: 30 },
    desc: 'てっぺきの かまえで しゅび力を 2ばいに する。', cast: '{a}は てっぺきの かまえを とった！', anim: 'guard',
  },
  gd_bash: {
    name: 'シールドアタック', kana: 'しーるどあたっく', kind: 'skill', job: 'guardian', mp: 4, target: 'enemy',
    effect: { type: 'phys', mult: 1.5, status: { status: 'paralyze', chance: 0.3, turns: [1, 1] } },
    desc: 'たてで たいあたり。てきを しびれさせる ことが ある。', cast: '{a}の シールドアタック！', anim: 'tackle',
  },
  gd_protect: {
    name: 'みんなをまもる', kana: 'みんなをまもる', kind: 'skill', job: 'guardian', mp: 6, target: 'self',
    effect: { type: 'cover', dur: 25, all: true, defMult: 1.6 },
    desc: 'なかま 全員への こうげきを ひきうけ、しゅび力も あがる。', cast: '{a}は みんなの まえに たちはだかった！', anim: 'guard',
  },
  gd_iyashi: {
    name: 'いやしのたて', kana: 'いやしのたて', kind: 'spell', job: 'guardian', mp: 10, target: 'allies', field: true,
    effect: { type: 'heal', base: [55, 70], thr: 40 },
    desc: 'たてから あふれる ひかりで なかま 全員を いやす。', cast: '{a}の たてが やさしく ひかった！', anim: 'heal2',
  },
  gd_fortress: {
    name: 'ふどうのようさい', kana: 'ふどうのようさい', kind: 'skill', job: 'guardian', mp: 14, target: 'allies',
    effect: { type: 'buff', stat: 'def', mult: 1.6, dur: 45 },
    desc: 'なかま 全員の しゅび力を とても おおきく あげる。', cast: '{a}の まわりに ひかりの ようさいが あらわれた！', anim: 'guard',
  },

  // ───────────── 勇者 ─────────────
  hr_gigaslash: {
    name: 'ギガスラッシュ', kana: 'ぎがすらっしゅ', kind: 'skill', job: 'hero', mp: 14, target: 'enemies', weapon: 'blade',
    effect: { type: 'phys', mult: 1.5, element: 'bolt' },
    desc: 'いかずちを まとった けんで てき 全体を きりさく。', cast: '{a}の ギガスラッシュ！', anim: 'gigabreak', sword: true,
  },
  hr_kizuna: {
    name: 'きずなのちかい', kana: 'きずなのちかい', kind: 'skill', job: 'hero', mp: 8, target: 'allies',
    effect: { type: 'bondUp', amount: 55 },
    desc: 'なかまと ちかいを たて、きずなゲージを おおきく ふやす。', cast: '{a}は なかまと ちかいを たてた！', anim: 'dance',
  },
  hr_inori: {
    name: 'ゆうしゃのいのり', kana: 'ゆうしゃのいのり', kind: 'spell', job: 'hero', mp: 20, target: 'allies', field: true,
    effect: { type: 'heal', base: [130, 160], thr: 70 },
    desc: 'なかま 全員の HPを おおきく かいふくする。', cast: '{a}は ゆうしゃの いのりを ささげた！', anim: 'heal2',
  },
  hr_gigadein: {
    name: 'ギガデイン', kana: 'ぎがでいん', kind: 'spell', job: 'hero', mp: 20, target: 'enemies',
    effect: { type: 'magic', element: 'bolt', base: [125, 155], thr: 80 },
    desc: 'ゆうしゃ だけが つかえる てんの いかずち。てき 全体に ダメージ。', cast: '{a}は ギガデインを となえた！', anim: 'bolt2', attackSpell: true,
  },
  hr_kizunaken: {
    name: 'きずなのつるぎ', kana: 'きずなのつるぎ', kind: 'skill', job: 'hero', mp: 18, target: 'enemy',
    effect: { type: 'phys', mult: 3.2, element: 'light', ignoreDef: 0.3 },
    desc: 'きずなの紋章の ちからを けんに こめた ひっさつの いちげき。', cast: '{a}の 紋章が けんに ひかりを やどした！ きずなの つるぎ！', anim: 'strash',
  },

  // ───────────── モンスターマスター ─────────────
  mm_whip: {
    name: 'まじゅうのムチ', kana: 'まじゅうのむち', kind: 'skill', job: 'monster_master', mp: 6, target: 'enemies', weapon: 'whip',
    effect: { type: 'phys', mult: 1.1 },
    desc: 'ムチで てき 全体を うつ。', cast: '{a}の まじゅうの ムチ！', anim: 'whip',
  },
  mm_iyashi: {
    name: 'まもののいやし', kana: 'まもののいやし', kind: 'skill', job: 'monster_master', mp: 12, target: 'allies', field: true,
    effect: { type: 'heal', base: [75, 95], thr: 50 },
    desc: 'なかま 全員を いやす。まものたちも げんきに なる。', cast: '{a}は やさしく なかまを なでた！', anim: 'heal_dance',
  },
  mm_howl: {
    name: 'ワイルドハウル', kana: 'わいるどはうる', kind: 'skill', job: 'monster_master', mp: 10, target: 'enemies',
    effect: { type: 'status', status: 'paralyze', chance: 0.4, turns: [1, 1] },
    desc: 'やせいの ほえごえで てき 全体を すくませる。', cast: '{a}の ワイルドハウル！', anim: 'warcry',
  },
  mm_kizuna: {
    name: 'まもののきずな', kana: 'まもののきずな', kind: 'skill', job: 'monster_master', mp: 14, target: 'allies',
    effect: { type: 'buff', stats: ['atk', 'def', 'agi'], mult: 1.25, dur: 40 },
    desc: 'なかま 全員の こうげき力・しゅび力・すばやさを あげる。', cast: '{a}と まものたちの こころが ひとつに なった！', anim: 'dance',
  },
  mm_king: {
    name: 'けもののおう', kana: 'けもののおう', kind: 'skill', job: 'monster_master', mp: 16, target: 'enemy',
    effect: { type: 'phys', mult: 3.0 },
    desc: 'まものの おうの ような いちげき。', cast: '{a}の けものの おう！', anim: 'bite',
  },

  // ───────────── 星の歌姫 ─────────────
  sd_song: {
    name: 'ほしのうた', kana: 'ほしのうた', kind: 'skill', job: 'star_diva', mp: 10, target: 'allies', field: true,
    effect: { type: 'heal', base: [65, 85], thr: 50 },
    desc: '守り星の うたで なかま 全員を いやす。', cast: '{a}は ほしの うたを うたった！', anim: 'heal_dance',
  },
  sd_comet: {
    name: 'ほうきぼし', kana: 'ほうきぼし', kind: 'spell', job: 'star_diva', mp: 12, target: 'enemies',
    effect: { type: 'magic', element: 'light', base: [72, 92], thr: 60 },
    desc: 'ほうきぼしを よび、てき 全体に ひかりの ダメージ。', cast: '{a}は ほうきぼしを よんだ！', anim: 'meteor',
  },
  sd_lullaby: {
    name: 'ほしのこもりうた', kana: 'ほしのこもりうた', kind: 'skill', job: 'star_diva', mp: 8, target: 'enemies',
    effect: { type: 'status', status: 'sleep', chance: 0.6, turns: [2, 3] },
    desc: 'やさしい うたで てき 全体を ねむらせる。', cast: '{a}は ほしの こもりうたを うたった…', anim: 'sleep',
  },
  sd_blessing: {
    name: 'ほしのしゅくふく', kana: 'ほしのしゅくふく', kind: 'skill', job: 'star_diva', mp: 16, target: 'allies',
    effect: { type: 'buff', stats: ['atk', 'def', 'agi'], mult: 1.25, dur: 40 },
    desc: 'なかま 全員の こうげき力・しゅび力・すばやさを あげる。', cast: 'ほしの しゅくふくが なかまを つつんだ！', anim: 'dance',
  },
  sd_meteor: {
    name: 'りゅうせいぐん', kana: 'りゅうせいぐん', kind: 'spell', job: 'star_diva', mp: 26, target: 'enemies',
    effect: { type: 'magic', element: 'light', base: [150, 180], thr: 80 },
    desc: 'ほしぞらから りゅうせいを ふらせる さいごの うた。', cast: '{a}の うたごえに こたえて ほしが ふりそそぐ！', anim: 'meteor',
  },
};
