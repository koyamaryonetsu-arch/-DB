// 上級職・超級職の 呪文と 特技
// （書きかたは abilities.js と おなじ。ここで ふえた effect: buff の stats[]、mpHeal、random、phys の recoil、magic の status、deadAllies）
// 名前の一部は「ドラゴンクエスト」「ダイの大冒険」へのオマージュです。

export const ADV_ABILITIES = {
  // ───────────── バトルマスター ─────────────
  bm_moroba: {
    name: 'もろば斬り', kana: 'もろばぎり', kind: 'skill', job: 'battlemaster', mp: 0, target: 'enemy', weapon: 'blade',
    effect: { type: 'phys', mult: 2.0, recoil: 0.25 },
    desc: '身を捨てた一撃。あたえたダメージの4分の1を自分も受ける。', cast: '{a}のもろば斬り！', anim: 'slash_heavy', sword: true,
  },
  bm_musou: {
    name: 'むそうぎり', kana: 'むそうぎり', kind: 'skill', job: 'battlemaster', mp: 4, target: 'enemy', weapon: 'blade',
    effect: { type: 'phys', mult: 0.95, hits: 2 },
    desc: '目にも止まらぬ2回斬り。', cast: '{a}のむそうぎり！', anim: 'slash_multi', sword: true,
  },
  bm_otakebi: {
    name: 'おたけび', kana: 'おたけび', kind: 'skill', job: 'battlemaster', mp: 4, target: 'enemies',
    effect: { type: 'status', status: 'paralyze', chance: 0.35, turns: [1, 1] },
    desc: 'すさまじいさけび声で敵をすくませる。', cast: '{a}のおたけび！', anim: 'warcry',
  },
  bm_tension: {
    name: 'テンションバーン', kana: 'てんしょんばーん', kind: 'skill', job: 'battlemaster', mp: 3, target: 'self',
    effect: { type: 'charge', mult: 3.0 },
    desc: '気合いを爆発させ、次の攻撃を3倍にする。', cast: '{a}のテンションが爆発した！', anim: 'charge',
  },
  bm_hakai: {
    name: 'はかいの一撃', kana: 'はかいのいちげき', kind: 'skill', job: 'battlemaster', mp: 12, target: 'enemy',
    effect: { type: 'phys', mult: 3.2, ignoreDef: 0.4 },
    desc: '固い守りも打ち砕く最強の一撃。', cast: '{a}のはかいの一撃！', anim: 'slash_heavy',
  },

  // ───────────── パラディン ─────────────
  pl_daibougyo: {
    name: '大防御', kana: 'だいぼうぎょ', kind: 'skill', job: 'paladin', mp: 0, target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 2.6, dur: 12 },
    desc: 'しばらく守備力がとても高くなる。', cast: '{a}はどっしりと構えた！', anim: 'guard',
  },
  pl_hikari: {
    name: 'いやしの光', kana: 'いやしのひかり', kind: 'spell', job: 'paladin', mp: 5, target: 'ally', field: true,
    effect: { type: 'heal', base: [90, 110], thr: 40 },
    desc: '仲間1人のHPを100ほど回復する。', cast: '{a}の手からいやしの光があふれた！', anim: 'heal2',
  },
  pl_grandcross: {
    name: 'グランドクロス', kana: 'ぐらんどくろす', kind: 'skill', job: 'paladin', mp: 8, target: 'enemies',
    effect: { type: 'phys', mult: 0.9, element: 'light', ignoreDef: 0.5, vsRace: { undead: 1.6, demon: 1.3 } },
    desc: '聖なる十字の光で敵全体を斬る。ゆうれいや魔族にとても強い。', cast: '{a}のグランドクロス！', anim: 'slash_light',
  },
  pl_aegis: {
    name: 'アイギスの守り', kana: 'あいぎすのまもり', kind: 'spell', job: 'paladin', mp: 8, target: 'allies',
    effect: { type: 'buff', stat: 'def', mult: 1.45, dur: 45 },
    desc: '仲間全員の守備力を大きく上げる。', cast: '{a}はアイギスの守りを唱えた！', anim: 'guard',
  },
  pl_judgment: {
    name: 'ジャッジメント', kana: 'じゃっじめんと', kind: 'skill', job: 'paladin', mp: 10, target: 'enemy',
    effect: { type: 'phys', mult: 2.6, element: 'light', vsRace: { undead: 1.5, demon: 1.5 } },
    desc: '聖なる裁きの一撃。', cast: '{a}のジャッジメント！', anim: 'strash',
  },

  // ───────────── 魔法戦士 ─────────────
  mk_kaengiri: {
    name: '火炎斬り', kana: 'かえんぎり', kind: 'skill', job: 'magic_knight', mp: 3, target: 'enemy', weapon: 'blade',
    effect: { type: 'phys', mult: 1.3, element: 'fire' },
    desc: '炎をまとった剣で斬る。', cast: '{a}の火炎斬り！', anim: 'mahouken', sword: true,
  },
  mk_hyouketsu: {
    name: '氷結斬り', kana: 'ひょうけつぎり', kind: 'skill', job: 'magic_knight', mp: 3, target: 'enemy', weapon: 'blade',
    effect: { type: 'phys', mult: 1.3, element: 'ice' },
    desc: '氷をまとった剣で斬る。', cast: '{a}の氷結斬り！', anim: 'mahouken', sword: true,
  },
  mk_inazuma: {
    name: 'いなずま斬り', kana: 'いなずまぎり', kind: 'skill', job: 'magic_knight', mp: 4, target: 'enemy', weapon: 'blade',
    effect: { type: 'phys', mult: 1.45, element: 'bolt' },
    desc: 'いかずちをまとった剣で斬る。', cast: '{a}のいなずま斬り！', anim: 'gigabreak', sword: true,
  },
  mk_forcebreak: {
    name: 'フォースブレイク', kana: 'ふぉーすぶれいく', kind: 'skill', job: 'magic_knight', mp: 5, target: 'enemy',
    effect: { type: 'debuff', stat: 'def', mult: 0.55, dur: 40, chance: 0.95 },
    desc: '敵の守りの力を打ち砕く。守備力が大きく下がる。', cast: '{a}のフォースブレイク！', anim: 'debuff',
  },
  mk_raiden: {
    name: 'ライデイン', kana: 'らいでいん', kind: 'spell', job: 'magic_knight', mp: 8, target: 'enemy',
    effect: { type: 'magic', element: 'bolt', base: [60, 75], thr: 45 },
    desc: '天からいかずちを落とす。', cast: '{a}はライデインを唱えた！', anim: 'bolt1', attackSpell: true,
  },
  mk_burst: {
    name: 'マジックバースト', kana: 'まじっくばーすと', kind: 'spell', job: 'magic_knight', mp: 20, target: 'enemies',
    effect: { type: 'magic', element: 'void', base: [90, 110], thr: 60 },
    desc: '魔力を爆発させて敵全体をふき飛ばす。', cast: '{a}の魔力が爆発した！マジックバースト！', anim: 'blast2',
  },

  // ───────────── 海賊 ─────────────
  pr_kaizokugiri: {
    name: '海賊斬り', kana: 'かいぞくぎり', kind: 'skill', job: 'pirate', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.4, debuff: { stat: 'atk', mult: 0.8, dur: 30, chance: 0.6 } },
    desc: 'あらっぽい一撃。敵の攻撃力を下げることがある。', cast: '{a}の海賊斬り！', anim: 'slash_heavy',
  },
  pr_uzushio: {
    name: 'うずしお', kana: 'うずしお', kind: 'skill', job: 'pirate', mp: 6, target: 'enemies', spellLike: true,
    effect: { type: 'magic', element: 'ice', base: [30, 40], thr: 30 },
    desc: '大きなうずしおで敵全体を飲みこむ。', cast: '{a}はうずしおを呼び出した！', anim: 'ice2',
  },
  pr_ikari: {
    name: 'いかりの一発', kana: 'いかりのいっぱつ', kind: 'skill', job: 'pirate', mp: 5, target: 'enemy',
    effect: { type: 'phys', mult: 2.2, acc: 0.8 },
    desc: 'いかりをこめた重い一発。少し外れやすい。', cast: '{a}のいかりの一発！', anim: 'slash_heavy',
  },
  pr_utage: {
    name: 'うたげの歌', kana: 'うたげのうた', kind: 'skill', job: 'pirate', mp: 7, target: 'allies',
    effect: { type: 'buff', stat: 'atk', mult: 1.3, dur: 35 },
    desc: 'ごうかいな歌で仲間全員の攻撃力を上げる。', cast: '{a}はうたげの歌を歌った！', anim: 'dance',
  },
  pr_cannon: {
    name: 'たいほう', kana: 'たいほう', kind: 'skill', job: 'pirate', mp: 10, target: 'enemies', spellLike: true,
    effect: { type: 'magic', element: 'blast', base: [50, 65], thr: 40 },
    desc: '船のたいほうを撃ちこむ。敵全体に爆発のダメージ。', cast: '{a}の合図でたいほうが火をふいた！', anim: 'blast2',
  },

  // ───────────── 聖拳士 ─────────────
  hf_seikou: {
    name: '聖光拳', kana: 'せいこうけん', kind: 'skill', job: 'holyfist', mp: 3, target: 'enemy', weapon: 'fist',
    effect: { type: 'phys', mult: 1.6, element: 'light', vsRace: { undead: 1.5 } },
    desc: '聖なる光をこめた拳。', cast: '{a}の聖光拳！', anim: 'holy_punch', fist: true,
  },
  hf_meisou: {
    name: 'めいそう', kana: 'めいそう', kind: 'skill', job: 'holyfist', mp: 4, target: 'self',
    effect: { type: 'heal', base: [90, 110], thr: 30 },
    desc: '心を静めて自分のHPを大きく回復する。', cast: '{a}はめいそうした！', anim: 'heal2',
  },
  hf_mikiri: {
    name: '見切り', kana: 'みきり', kind: 'skill', job: 'holyfist', mp: 3, target: 'self',
    effect: { type: 'buff', stat: 'eva', add: 0.45, dur: 30 },
    desc: '敵の動きを見切ってかわしやすくなる。', cast: '{a}は敵の動きを見切った！', anim: 'buff',
  },
  hf_tenshou: {
    name: 'てんしょうれっぱ', kana: 'てんしょうれっぱ', kind: 'skill', job: 'holyfist', mp: 7, target: 'enemies',
    effect: { type: 'phys', mult: 0.95, element: 'light' },
    desc: '天に上る光の波で敵全体を打つ。', cast: '{a}のてんしょうれっぱ！', anim: 'kick',
  },
  hf_hyakka: {
    name: '聖なる百烈拳', kana: 'せいなるひゃくれつけん', kind: 'skill', job: 'holyfist', mp: 10, target: 'enemy', weapon: 'fist',
    effect: { type: 'phys', mult: 0.45, hits: 7, element: 'light' },
    desc: '光をまとった7連続の拳。', cast: '{a}の聖なる百烈拳！', anim: 'punch_multi', fist: true,
  },

  // ───────────── 忍者 ─────────────
  nj_shuriken: {
    name: '手裏剣', kana: 'しゅりけん', kind: 'skill', job: 'ninja', mp: 2, target: 'enemies',
    effect: { type: 'phys', mult: 0.55, hits: 3, random: true },
    desc: '手裏剣を3枚投げる。相手はランダム。', cast: '{a}は手裏剣を投げた！', anim: 'shuriken',
  },
  nj_katon: {
    name: 'かとんの術', kana: 'かとんのじゅつ', kind: 'skill', job: 'ninja', mp: 4, target: 'group', spellLike: true,
    effect: { type: 'magic', element: 'fire', base: [26, 36], thr: 25 },
    desc: '忍法の炎で同じ種類の敵を焼く。', cast: '{a}のかとんの術！', anim: 'fire_wave',
  },
  nj_bunshin: {
    name: '分身の術', kana: 'ぶんしんのじゅつ', kind: 'skill', job: 'ninja', mp: 4, target: 'self',
    effect: { type: 'buff', stat: 'eva', add: 0.5, dur: 30 },
    desc: '分身を作って敵の攻撃をとてもかわしやすくする。', cast: '{a}は分身した！', anim: 'buff',
  },
  nj_kagenui: {
    name: '影ぬい', kana: 'かげぬい', kind: 'skill', job: 'ninja', mp: 4, target: 'enemy',
    effect: { type: 'status', status: 'paralyze', chance: 0.55, turns: [1, 2] },
    desc: '敵の影をぬいつけて動けなくする。', cast: '{a}の影ぬい！', anim: 'debuff',
  },
  nj_fuujin: {
    name: '風神の術', kana: 'ふうじんのじゅつ', kind: 'skill', job: 'ninja', mp: 9, target: 'enemies', spellLike: true,
    effect: { type: 'magic', element: 'wind', base: [45, 60], thr: 40 },
    desc: '風の神を呼び、敵全体を切り裂く。', cast: '{a}の風神の術！', anim: 'wind2',
  },

  // ───────────── まもの使い ─────────────
  tm_shippu: {
    name: 'しっぷうのムチ', kana: 'しっぷうのむち', kind: 'skill', job: 'tamer', mp: 3, target: 'group', weapon: 'whip',
    effect: { type: 'phys', mult: 0.95 },
    desc: 'ムチで同じ種類の敵をまとめて打つ。', cast: '{a}のしっぷうのムチ！', anim: 'whip',
  },
  tm_beast: {
    name: 'ビーストモード', kana: 'びーすともーど', kind: 'skill', job: 'tamer', mp: 5, target: 'self',
    effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.3, dur: 35 },
    desc: 'けもののように猛り立ち、攻撃力と素早さを上げる。', cast: '{a}はビーストモードになった！', anim: 'warcry',
  },
  tm_kemono: {
    name: 'けもののさけび', kana: 'けもののさけび', kind: 'skill', job: 'tamer', mp: 4, target: 'enemies',
    effect: { type: 'debuff', stat: 'atk', mult: 0.8, dur: 30, chance: 0.75 },
    desc: '敵全体をおびえさせ、攻撃力を下げる。', cast: '{a}はけもののようにさけんだ！', anim: 'warcry',
  },
  tm_kizuna: {
    name: 'きずなのほえ声', kana: 'きずなのほえごえ', kind: 'skill', job: 'tamer', mp: 8, target: 'allies',
    effect: { type: 'buff', stats: ['atk', 'def'], mult: 1.2, dur: 30 },
    desc: '仲間全員の攻撃力と守備力を上げる。魔物の仲間がいると心強い。', cast: '{a}のほえ声がひびきわたった！', anim: 'warcry',
  },
  tm_majuu: {
    name: 'まじゅうの一撃', kana: 'まじゅうのいちげき', kind: 'skill', job: 'tamer', mp: 9, target: 'enemy',
    effect: { type: 'phys', mult: 2.5 },
    desc: 'まじゅうの力を宿した一撃。', cast: '{a}のまじゅうの一撃！', anim: 'bite',
  },

  // ───────────── 賢者 ─────────────
  sg_behoma: {
    name: 'ベホマ', kana: 'べほま', kind: 'spell', job: 'sage', mp: 7, target: 'ally', field: true,
    effect: { type: 'heal', base: [230, 270], thr: 70 },
    desc: '仲間1人のHPをすっかり回復する。', cast: '{a}はベホマを唱えた！', anim: 'heal2',
  },
  sg_bagikurosu: {
    name: 'バギクロス', kana: 'ばぎくろす', kind: 'spell', job: 'sage', mp: 9, target: 'group',
    effect: { type: 'magic', element: 'wind', base: [60, 80], thr: 60 },
    desc: '十字の竜巻で同じ種類の敵を切り裂く。', cast: '{a}はバギクロスを唱えた！', anim: 'wind2', attackSpell: true,
  },
  sg_zaoral: {
    name: 'ザオラル', kana: 'ざおらる', kind: 'spell', job: 'sage', mp: 12, target: 'deadAlly', field: true,
    effect: { type: 'revive', hpRatio: 0.5 },
    desc: '死んでしまった仲間をHP半分で生き返らせる。', cast: '{a}はザオラルを唱えた！', anim: 'revive',
  },
  sg_mahyado: {
    name: 'マヒャド', kana: 'まひゃど', kind: 'spell', job: 'sage', mp: 12, target: 'group',
    effect: { type: 'magic', element: 'ice', base: [72, 92], thr: 70 },
    desc: '氷のやいばで同じ種類の敵をこおりつかせる。', cast: '{a}はマヒャドを唱えた！', anim: 'ice2', attackSpell: true,
  },
  sg_inori: {
    name: '賢者のいのり', kana: 'けんじゃのいのり', kind: 'spell', job: 'sage', mp: 18, target: 'allies', field: true,
    effect: { type: 'heal', base: [95, 115], thr: 70 },
    desc: '仲間全員のHPを100ほど回復する。', cast: '{a}は賢者のいのりをささげた！', anim: 'heal2',
  },

  // ───────────── スーパースター ─────────────
  ss_stardance: {
    name: 'スターダンス', kana: 'すたーだんす', kind: 'skill', job: 'superstar', mp: 6, target: 'allies', field: true,
    effect: { type: 'heal', base: [34, 44], thr: 20 },
    desc: 'きらきらのおどりで仲間全員を回復する。', cast: '{a}のスターダンス！', anim: 'heal_dance',
  },
  ss_spotlight: {
    name: 'スポットライト', kana: 'すぽっとらいと', kind: 'skill', job: 'superstar', mp: 4, target: 'self',
    effect: { type: 'cover', dur: 15, all: true, defMult: 1.3 },
    desc: '敵の注目を集め、仲間への攻撃を引き受ける。', cast: '{a}にスポットライトが当たった！', anim: 'guard',
  },
  ss_charm: {
    name: 'みりょうのポーズ', kana: 'みりょうのぽーず', kind: 'skill', job: 'superstar', mp: 5, target: 'group',
    effect: { type: 'status', status: 'confuse', chance: 0.6, turns: [1, 3] },
    desc: 'みりょく的なポーズで敵を混乱させる。', cast: '{a}のみりょうのポーズ！', anim: 'dance',
  },
  ss_happy: {
    name: 'ハッピーパレード', kana: 'はっぴーぱれーど', kind: 'skill', job: 'superstar', mp: 10, target: 'allies',
    effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.25, dur: 35 },
    desc: '仲間全員の攻撃力と素早さを上げる。', cast: '{a}のハッピーパレード！', anim: 'dance',
  },
  ss_encore: {
    name: 'アンコール', kana: 'あんこーる', kind: 'skill', job: 'superstar', mp: 8, target: 'allies',
    effect: { type: 'bondUp', amount: 40 },
    desc: 'かんせいに応えてきずなゲージをたくさん増やす。', cast: '{a}のアンコール！', anim: 'dance',
  },

  // ───────────── 占い師 ─────────────
  ft_sun: {
    name: 'タロット「太陽」', kana: 'たろっとたいよう', kind: 'skill', job: 'fortune', mp: 7, target: 'allies', field: true,
    effect: { type: 'heal', base: [42, 56], thr: 30 },
    desc: '太陽のカード。仲間全員のHPを回復する。', cast: '{a}は「太陽」のカードを引いた！', anim: 'heal2',
  },
  ft_moon: {
    name: 'タロット「月」', kana: 'たろっとつき', kind: 'skill', job: 'fortune', mp: 6, target: 'enemies',
    effect: { type: 'status', status: 'sleep', chance: 0.5, turns: [1, 3] },
    desc: '月のカード。敵全体をねむらせることがある。', cast: '{a}は「月」のカードを引いた！', anim: 'sleep',
  },
  ft_star: {
    name: 'タロット「星」', kana: 'たろっとほし', kind: 'skill', job: 'fortune', mp: 7, target: 'enemies', spellLike: true,
    effect: { type: 'magic', element: 'light', base: [36, 46], thr: 35 },
    desc: '星のカード。星の光が敵全体に降り注ぐ。', cast: '{a}は「星」のカードを引いた！', anim: 'meteor',
  },
  ft_tower: {
    name: 'タロット「塔」', kana: 'たろっととう', kind: 'skill', job: 'fortune', mp: 10, target: 'enemy', spellLike: true,
    effect: { type: 'magic', element: 'blast', base: [95, 115], thr: 50 },
    desc: '塔のカード。いかずちが塔を打ち砕くように敵1体に大爆発。', cast: '{a}は「塔」のカードを引いた！', anim: 'blast1',
  },
  ft_fate: {
    name: 'タロット「運命の輪」', kana: 'たろっとうんめいのわ', kind: 'skill', job: 'fortune', mp: 12, target: 'self',
    effect: { type: 'random', options: ['ft_fate_heal', 'ft_fate_meteor', 'ft_fate_bond', 'ft_fate_power'] },
    desc: '運命のカード。何が起こるかは引いてからのお楽しみ。どれも良いことが起こる。', cast: '{a}は「運命の輪」のカードを引いた！', anim: 'dance',
  },
  ft_fate_heal: {
    name: '大いやし', kana: 'だいいやし', kind: 'skill', job: 'fortune', mp: 0, target: 'allies', hidden: true,
    effect: { type: 'heal', base: [150, 180], thr: 60 }, cast: '女神のほほ笑み！みんなのキズがいえていく！', anim: 'heal2',
  },
  ft_fate_meteor: {
    name: '流星', kana: 'りゅうせい', kind: 'skill', job: 'fortune', mp: 0, target: 'enemies', hidden: true, spellLike: true,
    effect: { type: 'magic', element: 'light', base: [110, 140], thr: 60 }, cast: '空から星が降ってきた！', anim: 'meteor',
  },
  ft_fate_bond: {
    name: 'きずなの星', kana: 'きずなのほし', kind: 'skill', job: 'fortune', mp: 0, target: 'allies', hidden: true,
    effect: { type: 'bondUp', amount: 60 }, cast: 'きずなの星がかがやいた！', anim: 'dance',
  },
  ft_fate_power: {
    name: '勇気の星', kana: 'ゆうきのほし', kind: 'skill', job: 'fortune', mp: 0, target: 'allies', hidden: true,
    effect: { type: 'buff', stats: ['atk', 'def', 'agi'], mult: 1.25, dur: 35 }, cast: '勇気の星がみんなを包んだ！', anim: 'buff',
  },

  // ───────────── 竜の騎士 ─────────────
  dk_aura: {
    name: '竜闘気', kana: 'どらごにっくおーら', kind: 'skill', job: 'dragon_knight', mp: 6, target: 'self',
    effect: { type: 'buff', stats: ['atk', 'def'], mult: 1.4, dur: 40 },
    desc: 'ドラゴニックオーラをまとい、攻撃力と守備力を大きく上げる。', cast: '{a}の体が竜闘気に包まれた！', anim: 'charge',
  },
  dk_gigabreak: {
    name: 'ギガブレイク', kana: 'ぎがぶれいく', kind: 'skill', job: 'dragon_knight', mp: 12, target: 'enemy', weapon: 'blade',
    effect: { type: 'phys', mult: 2.6, element: 'bolt' },
    desc: '剣にいかずちを落とし、そのまま切り裂く竜の騎士の必殺剣。', cast: '{a}は剣を天にかかげた…！ギガブレイク！', anim: 'gigabreak', sword: true,
  },
  dk_crest: {
    name: '竜の紋章', kana: 'りゅうのもんしょう', kind: 'skill', job: 'dragon_knight', mp: 8, target: 'self',
    effect: { type: 'heal', base: [220, 260], thr: 50 },
    desc: 'ひたいの竜の紋章がかがやき、自分のキズをいやす。', cast: '{a}のひたいに竜の紋章がうかび上がった！', anim: 'heal2',
  },
  dk_ikari: {
    name: '竜のいかり', kana: 'りゅうのいかり', kind: 'skill', job: 'dragon_knight', mp: 10, target: 'enemies',
    effect: { type: 'phys', mult: 1.2, element: 'fire' },
    desc: '竜のいかりの炎で敵全体をなぎはらう。', cast: '{a}の竜のいかり！', anim: 'fire_tornado',
  },
  dk_doruora: {
    name: 'ドルオーラ', kana: 'どるおーら', kind: 'skill', job: 'dragon_knight', mp: 28, target: 'enemy', spellLike: true,
    effect: { type: 'magic', element: 'void', base: [300, 360], thr: 80 },
    desc: '竜闘気を両手のひらに集めて放つ、竜の騎士最強の技。', cast: '{a}は両手をつき出した…！ドルオーラ！', anim: 'dragon_beam',
  },

  // ───────────── 大魔道士 ─────────────
  am_begiragon: {
    name: 'ベギラゴン', kana: 'べぎらごん', kind: 'spell', job: 'archmage', mp: 14, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [80, 100], thr: 70 },
    desc: '炎の波で敵全体を焼きはらう。', cast: '{a}はベギラゴンを唱えた！', anim: 'fire_wave', attackSpell: true,
  },
  am_manaheal: {
    name: '魔力の泉', kana: 'まりょくのいずみ', kind: 'skill', job: 'archmage', mp: 0, target: 'self',
    effect: { type: 'mpHeal', base: [18, 26] },
    desc: '魔力を集めて自分のMPを回復する。', cast: '{a}は静かに魔力を集めた…', anim: 'buff',
  },
  am_ionazun: {
    name: 'イオナズン', kana: 'いおなずん', kind: 'spell', job: 'archmage', mp: 18, target: 'enemies',
    effect: { type: 'magic', element: 'blast', base: [105, 130], thr: 80 },
    desc: '超爆発で敵全体をふき飛ばす。', cast: '{a}はイオナズンを唱えた！', anim: 'blast2', attackSpell: true,
  },
  am_meragaia: {
    name: 'メラガイアー', kana: 'めらがいあー', kind: 'spell', job: 'archmage', mp: 20, target: 'enemy',
    effect: { type: 'magic', element: 'fire', base: [230, 270], thr: 90 },
    desc: '太陽のようなきょだいな炎の玉をぶつける。', cast: '{a}はメラガイアーを唱えた！', anim: 'fire3', attackSpell: true,
  },
  am_medroa: {
    name: 'メドローア', kana: 'めどろーあ', kind: 'spell', job: 'archmage', mp: 30, target: 'enemy',
    effect: { type: 'magic', element: 'void', base: [320, 380], thr: 90 },
    desc: '炎と氷を全く同じ力で合わせた対消滅呪文の完成形。大魔道士だけが使える。', cast: '{a}は弓を引くように構えた…メドローア！', anim: 'void',
  },

  // ───────────── 大神官 ─────────────
  hp_seinaru: {
    name: '聖なるいのり', kana: 'せいなるいのり', kind: 'spell', job: 'high_priest', mp: 6, target: 'allies',
    effect: { type: 'cure', statuses: ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'] },
    desc: '仲間全員の毒・ねむり・マヒ・混乱などを全て治す。', cast: '{a}は聖なるいのりをささげた！', anim: 'heal1',
  },
  hp_zaoriku: {
    name: 'ザオリク', kana: 'ざおりく', kind: 'spell', job: 'high_priest', mp: 20, target: 'deadAlly', field: true,
    effect: { type: 'revive', hpRatio: 1.0 },
    desc: '死んでしまった仲間を完全に生き返らせる。', cast: '{a}はザオリクを唱えた！', anim: 'revive',
  },
  hp_bagimuta: {
    name: 'バギムーチョ', kana: 'ばぎむーちょ', kind: 'spell', job: 'high_priest', mp: 18, target: 'enemies',
    effect: { type: 'magic', element: 'wind', base: [110, 130], thr: 80 },
    desc: 'きょだいな竜巻で敵全体を切り裂く。', cast: '{a}はバギムーチョを唱えた！', anim: 'wind2', attackSpell: true,
  },
  hp_behomazun: {
    name: 'ベホマズン', kana: 'べほまずん', kind: 'spell', job: 'high_priest', mp: 30, target: 'allies', field: true,
    effect: { type: 'heal', base: [220, 260], thr: 80 },
    desc: '仲間全員のHPをすっかり回復する。', cast: '{a}はベホマズンを唱えた！', anim: 'heal2',
  },
  hp_tenshi: {
    name: '天使の歌声', kana: 'てんしのうたごえ', kind: 'spell', job: 'high_priest', mp: 30, target: 'deadAllies',
    effect: { type: 'revive', hpRatio: 0.5 },
    desc: '天使の歌声で死んでしまった仲間をみんな生き返らせる。', cast: '天使の歌声がひびきわたった…！', anim: 'revive',
  },

  // ───────────── ゴッドハンド ─────────────
  gh_shinsoku: {
    name: '神速の拳', kana: 'しんそくのけん', kind: 'skill', job: 'god_hand', mp: 6, target: 'enemy',
    effect: { type: 'phys', mult: 1.8, atbAfter: 70 },
    desc: '神の速さの一撃。打った後すぐに次の順番が来る。', cast: '{a}の神速の拳！', anim: 'punch',
  },
  gh_tenchi: {
    name: '天地の構え', kana: 'てんちのかまえ', kind: 'skill', job: 'god_hand', mp: 5, target: 'self',
    effect: { type: 'buff', stats: ['atk', 'def'], mult: 1.35, dur: 35 },
    desc: '天地の構えで攻撃力と守備力を上げる。', cast: '{a}は天地の構えを取った！', anim: 'charge',
  },
  gh_musou: {
    name: 'むそうけん', kana: 'むそうけん', kind: 'skill', job: 'god_hand', mp: 10, target: 'enemy',
    effect: { type: 'phys', mult: 0.8, hits: 4 },
    desc: '息をつかせぬ4連撃。', cast: '{a}のむそうけん！', anim: 'punch_multi',
  },
  gh_ikazuchi: {
    name: 'いかずちの拳', kana: 'いかずちのけん', kind: 'skill', job: 'god_hand', mp: 12, target: 'enemies',
    effect: { type: 'phys', mult: 1.15, element: 'bolt' },
    desc: 'いかずちのように敵全体を打つ。', cast: '{a}のいかずちの拳！', anim: 'bolt2',
  },
  gh_godfist: {
    name: 'ゴッドハンド', kana: 'ごっどはんど', kind: 'skill', job: 'god_hand', mp: 16, target: 'enemy',
    effect: { type: 'phys', mult: 3.5, ignoreDef: 0.5, critBonus: 0.2, element: 'light' },
    desc: '神の拳。固い敵も打ち砕き、会心も出やすい。', cast: '{a}の拳が光を放った！ゴッドハンド！', anim: 'holy_punch',
  },

  // ───────────── 天地雷鳴士 ─────────────
  sm_ifrit: {
    name: 'げんま「炎の魔神」', kana: 'ほのおのまじん', kind: 'spell', job: 'summoner', mp: 12, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [70, 90], thr: 60 },
    desc: '炎の魔神を呼び出し、敵全体を焼きはらう。', cast: '{a}は炎の魔神を呼び出した！', anim: 'summon',
  },
  sm_undine: {
    name: 'げんま「水のせいれい」', kana: 'みずのせいれい', kind: 'spell', job: 'summoner', mp: 12, target: 'allies', field: true,
    effect: { type: 'heal', base: [75, 95], thr: 60 },
    desc: '水のせいれいを呼び出し、仲間全員をいやす。', cast: '{a}は水のせいれいを呼び出した！', anim: 'heal_dance',
  },
  sm_raijin: {
    name: 'げんま「雷神」', kana: 'らいじん', kind: 'spell', job: 'summoner', mp: 16, target: 'enemies',
    effect: { type: 'magic', element: 'bolt', base: [90, 115], thr: 70 },
    desc: '雷の神を呼び出し、敵全体にいかずちを落とす。', cast: '{a}は雷神を呼び出した！', anim: 'bolt2',
  },
  sm_kyojin: {
    name: 'げんま「大地のきょじん」', kana: 'だいちのきょじん', kind: 'spell', job: 'summoner', mp: 14, target: 'allies',
    effect: { type: 'buff', stats: ['def', 'atk'], mult: 1.3, dur: 40 },
    desc: '大地のきょじんが仲間全員を守り、力を貸してくれる。', cast: '{a}は大地のきょじんを呼び出した！', anim: 'guard',
  },
  sm_jigo: {
    name: 'ジゴスパーク', kana: 'じごすぱーく', kind: 'spell', job: 'summoner', mp: 24, target: 'enemies',
    effect: { type: 'magic', element: 'dark', base: [130, 160], thr: 80, status: { status: 'paralyze', chance: 0.25, turns: [1, 2] } },
    desc: 'じごくのいかずちで敵全体を打つ。マヒさせることもある。', cast: '{a}はジゴスパークを放った！', anim: 'dark1',
  },

  // ───────────── 魔剣士 ─────────────
  ms_dark: {
    name: 'ダークネスブレード', kana: 'だーくねすぶれーど', kind: 'skill', job: 'magic_swordsman', mp: 5, target: 'enemy', weapon: 'blade',
    effect: { type: 'phys', mult: 1.7, element: 'dark' },
    desc: '闇の力をこめた剣で斬る。', cast: '{a}のダークネスブレード！', anim: 'dark_slash', sword: true,
  },
  ms_soul: {
    name: 'ソウルイーター', kana: 'そうるいーたー', kind: 'skill', job: 'magic_swordsman', mp: 6, target: 'enemy',
    effect: { type: 'drainHp', mult: 1.4 },
    desc: '敵の命を吸い取る剣。あたえたダメージの半分HPが回復する。', cast: '{a}のソウルイーター！', anim: 'dark_slash',
  },
  ms_jubaku: {
    name: 'じゅばくのやいば', kana: 'じゅばくのやいば', kind: 'skill', job: 'magic_swordsman', mp: 6, target: 'enemy', weapon: 'blade',
    effect: { type: 'phys', mult: 1.2, status: { status: 'paralyze', chance: 0.45, turns: [1, 2] } },
    desc: '呪いのやいばで斬り、動けなくすることがある。', cast: '{a}のじゅばくのやいば！', anim: 'dark_slash', sword: true,
  },
  ms_ankoku: {
    name: '暗黒の衣', kana: 'あんこくのころも', kind: 'skill', job: 'magic_swordsman', mp: 6, target: 'self',
    effect: { type: 'buff', stat: 'atk', mult: 1.5, dur: 35 },
    desc: '闇の衣をまとい、攻撃力を大きく上げる。', cast: '{a}は暗黒の衣をまとった！', anim: 'charge',
  },
  ms_hades: {
    name: 'ハデスブレイド', kana: 'はですぶれいど', kind: 'skill', job: 'magic_swordsman', mp: 16, target: 'enemies', weapon: 'blade',
    effect: { type: 'phys', mult: 1.4, element: 'dark' },
    desc: 'めいかいの剣で敵全体をなぎはらう。', cast: '{a}のハデスブレイド！', anim: 'dark_slash', sword: true,
  },

  // ───────────── ガーディアン ─────────────
  gd_wall: {
    name: 'てっぺきの構え', kana: 'てっぺきのかまえ', kind: 'skill', job: 'guardian', mp: 4, target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 2.0, dur: 30 },
    desc: 'てっぺきの構えで守備力を2倍にする。', cast: '{a}はてっぺきの構えを取った！', anim: 'guard',
  },
  gd_bash: {
    name: 'シールドアタック', kana: 'しーるどあたっく', kind: 'skill', job: 'guardian', mp: 4, target: 'enemy',
    effect: { type: 'phys', mult: 1.5, status: { status: 'paralyze', chance: 0.3, turns: [1, 1] } },
    desc: 'たてで体当たり。敵をしびれさせることがある。', cast: '{a}のシールドアタック！', anim: 'tackle',
  },
  gd_protect: {
    name: 'みんなを守る', kana: 'みんなをまもる', kind: 'skill', job: 'guardian', mp: 6, target: 'self',
    effect: { type: 'cover', dur: 25, all: true, defMult: 1.6 },
    desc: '仲間全員への攻撃を引き受け、守備力も上がる。', cast: '{a}はみんなの前に立ちはだかった！', anim: 'guard',
  },
  gd_iyashi: {
    name: 'いやしのたて', kana: 'いやしのたて', kind: 'spell', job: 'guardian', mp: 10, target: 'allies', field: true,
    effect: { type: 'heal', base: [55, 70], thr: 40 },
    desc: 'たてからあふれる光で仲間全員をいやす。', cast: '{a}のたてが優しく光った！', anim: 'heal2',
  },
  gd_fortress: {
    name: '不動のようさい', kana: 'ふどうのようさい', kind: 'skill', job: 'guardian', mp: 14, target: 'allies',
    effect: { type: 'buff', stat: 'def', mult: 1.6, dur: 45 },
    desc: '仲間全員の守備力をとても大きく上げる。', cast: '{a}の周りに光のようさいが現れた！', anim: 'guard',
  },

  // ───────────── 勇者 ─────────────
  hr_gigaslash: {
    name: 'ギガスラッシュ', kana: 'ぎがすらっしゅ', kind: 'skill', job: 'hero', mp: 14, target: 'enemies', weapon: 'blade',
    effect: { type: 'phys', mult: 1.5, element: 'bolt' },
    desc: 'いかずちをまとった剣で敵全体を切り裂く。', cast: '{a}のギガスラッシュ！', anim: 'gigabreak', sword: true,
  },
  hr_kizuna: {
    name: 'きずなのちかい', kana: 'きずなのちかい', kind: 'skill', job: 'hero', mp: 8, target: 'allies',
    effect: { type: 'bondUp', amount: 55 },
    desc: '仲間とちかいを立て、きずなゲージを大きく増やす。', cast: '{a}は仲間とちかいを立てた！', anim: 'dance',
  },
  hr_inori: {
    name: '勇者のいのり', kana: 'ゆうしゃのいのり', kind: 'spell', job: 'hero', mp: 20, target: 'allies', field: true,
    effect: { type: 'heal', base: [130, 160], thr: 70 },
    desc: '仲間全員のHPを大きく回復する。', cast: '{a}は勇者のいのりをささげた！', anim: 'heal2',
  },
  hr_gigadein: {
    name: 'ギガデイン', kana: 'ぎがでいん', kind: 'spell', job: 'hero', mp: 20, target: 'enemies',
    effect: { type: 'magic', element: 'bolt', base: [125, 155], thr: 80 },
    desc: '勇者だけが使える天のいかずち。敵全体にダメージ。', cast: '{a}はギガデインを唱えた！', anim: 'bolt2', attackSpell: true,
  },
  hr_kizunaken: {
    name: 'きずなの剣', kana: 'きずなのつるぎ', kind: 'skill', job: 'hero', mp: 18, target: 'enemy',
    effect: { type: 'phys', mult: 3.2, element: 'light', ignoreDef: 0.3 },
    desc: 'きずなの紋章の力を剣にこめた必殺の一撃。', cast: '{a}の紋章が剣に光を宿した！きずなの剣！', anim: 'strash',
  },

  // ───────────── モンスターマスター ─────────────
  mm_whip: {
    name: 'まじゅうのムチ', kana: 'まじゅうのむち', kind: 'skill', job: 'monster_master', mp: 6, target: 'enemies', weapon: 'whip',
    effect: { type: 'phys', mult: 1.1 },
    desc: 'ムチで敵全体を打つ。', cast: '{a}のまじゅうのムチ！', anim: 'whip',
  },
  mm_iyashi: {
    name: '魔物のいやし', kana: 'まもののいやし', kind: 'skill', job: 'monster_master', mp: 12, target: 'allies', field: true,
    effect: { type: 'heal', base: [75, 95], thr: 50 },
    desc: '仲間全員をいやす。魔物たちも元気になる。', cast: '{a}は優しく仲間をなでた！', anim: 'heal_dance',
  },
  mm_howl: {
    name: 'ワイルドハウル', kana: 'わいるどはうる', kind: 'skill', job: 'monster_master', mp: 10, target: 'enemies',
    effect: { type: 'status', status: 'paralyze', chance: 0.4, turns: [1, 1] },
    desc: '野生のほえ声で敵全体をすくませる。', cast: '{a}のワイルドハウル！', anim: 'warcry',
  },
  mm_kizuna: {
    name: '魔物のきずな', kana: 'まもののきずな', kind: 'skill', job: 'monster_master', mp: 14, target: 'allies',
    effect: { type: 'buff', stats: ['atk', 'def', 'agi'], mult: 1.25, dur: 40 },
    desc: '仲間全員の攻撃力・守備力・素早さを上げる。', cast: '{a}と魔物たちの心が一つになった！', anim: 'dance',
  },
  mm_king: {
    name: 'けものの王', kana: 'けもののおう', kind: 'skill', job: 'monster_master', mp: 16, target: 'enemy',
    effect: { type: 'phys', mult: 3.0 },
    desc: '魔物の王のような一撃。', cast: '{a}のけものの王！', anim: 'bite',
  },

  // ───────────── 星の歌姫 ─────────────
  sd_song: {
    name: '星の歌', kana: 'ほしのうた', kind: 'skill', job: 'star_diva', mp: 10, target: 'allies', field: true,
    effect: { type: 'heal', base: [65, 85], thr: 50 },
    desc: '守り星の歌で仲間全員をいやす。', cast: '{a}は星の歌を歌った！', anim: 'heal_dance',
  },
  sd_comet: {
    name: 'ほうき星', kana: 'ほうきぼし', kind: 'spell', job: 'star_diva', mp: 12, target: 'enemies',
    effect: { type: 'magic', element: 'light', base: [72, 92], thr: 60 },
    desc: 'ほうき星を呼び、敵全体に光のダメージ。', cast: '{a}はほうき星を呼んだ！', anim: 'meteor',
  },
  sd_lullaby: {
    name: '星の子守歌', kana: 'ほしのこもりうた', kind: 'skill', job: 'star_diva', mp: 8, target: 'enemies',
    effect: { type: 'status', status: 'sleep', chance: 0.6, turns: [2, 3] },
    desc: '優しい歌で敵全体をねむらせる。', cast: '{a}は星の子守歌を歌った…', anim: 'sleep',
  },
  sd_blessing: {
    name: '星の祝福', kana: 'ほしのしゅくふく', kind: 'skill', job: 'star_diva', mp: 16, target: 'allies',
    effect: { type: 'buff', stats: ['atk', 'def', 'agi'], mult: 1.25, dur: 40 },
    desc: '仲間全員の攻撃力・守備力・素早さを上げる。', cast: '星の祝福が仲間を包んだ！', anim: 'dance',
  },
  sd_meteor: {
    name: '流星群', kana: 'りゅうせいぐん', kind: 'spell', job: 'star_diva', mp: 26, target: 'enemies',
    effect: { type: 'magic', element: 'light', base: [150, 180], thr: 80 },
    desc: '星空から流星を降らせる最後の歌。', cast: '{a}の歌声に応えて星が降り注ぐ！', anim: 'meteor',
  },
};
