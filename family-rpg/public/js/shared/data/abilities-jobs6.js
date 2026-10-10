// 2026年10月（第26回）の 新しい 職業の 技（20この 職業）
//  楽天カードマン、きさつ隊 → 炎柱 → 日の呼吸の使い手（伝説）、スパイ → 殺し屋 → 黒の組織、超能力者、
//  少年探てい団 → おしり探てい → 名探てい、クリエイター、ネコ型ロボット → 耳無しネコ型ロボット → ドラえもん、
//  カッパ → はなかっぱ → はなかっぱ（筋肉ニンニク）、忍者 → 木の葉の忍び → 七代目火影（伝説）
//
// きまりは abilities-jobs4.js・abilities-jobs5.js と おなじ
//  ・どの 職業にも 攻撃技（基本職は 3つ いじょう、ほかは 2つ いじょう）
//  ・みんなに かける 補助は ランクで そろえる（基本職 1.15倍・上級職 1.25倍・超級職と 伝説 1.4倍まで）
//  ・全体・グループの 技は、同じ くらいの MPの 1体の 技より 1体あたり 弱く
//  ・それぞれの 職業に「看板の 技」が 1つ（id は <職業の id>_sig。anim も 同じ 名前で、絵の 人が エフェクトを 作る）
// 新しい こうか（battle.js）
//  ・phys の points … ポイントバック（楽天カード！）。当てた 敵が 持っている お金の points 倍が、たおさなくても もらえる
//  ・deduce … 推理（探てい）。敵の いちばんの 弱点を 見ぬいて、その 属性の 攻撃に なる（弱点が なければ 属性なし）
//  ・random の autoRandom … オートの 仲間も、運しだいの 技を 使う（ひみつ道具・あたまの花。中みの 攻撃の 強さで えらぶ）

// 属性の じゅん（abilities.js の ELEMENT_ORDER と おなじ。abilities.js と おたがいに 読みこまない ように ここにも 書く）
const ELEMENT_ORDER = ['fire', 'ice', 'wind', 'blast', 'bolt', 'light', 'dark'];

const STATUS_ALL = ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'];

// 推理（deduce）で ねらう 属性: 敵が いちばん 苦手な 属性（1.2倍 いじょう効く もの）。なければ null（属性なし）
export function deduceElement(t) {
  let best = null, bestR = 1.2 - 1e-9;
  for (const el of ELEMENT_ORDER) {
    const r = t?.resist?.[el] ?? 1;
    if (r > bestR) { best = el; bestR = r; }
  }
  return best;
}

export const JOB6_ABILITIES = {
  // ───────────── 楽天カードマン（上級職。会社員＋旅芸人） ─────────────
  rk_card: {
    name: 'カードでシュッ', kana: 'かーどでしゅっ', kind: 'skill', job: 'rakuten_cardman', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.8 },
    desc: '赤いカードを、敵1体にするどく投げつける。', cast: '{a}はカードをシュッと投げた！', anim: 'cards',
  },
  rk_kangen: {
    name: 'ポイントバック', kana: 'ぽいんとばっく', kind: 'skill', job: 'rakuten_cardman', mp: 6, target: 'allies', role: 'heal',
    effect: { type: 'regen', base: [8, 11], thr: 25, dur: 24 },
    desc: 'ためたポイントを、みんなにお返し。仲間全員のHPが、しばらく少しずつ回復する。', cast: '{a}「ためたポイントは、みんなにお返し！」', anim: 'coins',
  },
  rk_ribo: {
    name: '分割ばらい', kana: 'ぶんかつばらい', kind: 'skill', job: 'rakuten_cardman', mp: 4, target: 'enemy',
    effect: { type: 'status', status: 'poison', chance: 0.7, turns: [3, 4] },
    desc: '敵1体に、なかなか終わらない分割ばらいをおしつける。毒のように、じわじわダメージを受ける。', cast: '{a}「お支はらいは、12回で！」', anim: 'debuff',
  },
  rk_tights: {
    name: '赤い全身タイツ', kana: 'あかいぜんしんたいつ', kind: 'skill', job: 'rakuten_cardman', mp: 6, target: 'self', role: 'sup',
    effect: { type: 'buff', stats: ['agi', 'def'], mult: 1.3, dur: 35 },
    desc: '赤い全身タイツで気合いを入れる。自分の素早さと守備力が上がる。', cast: '{a}は赤い全身タイツをぴしっとのばした！', anim: 'buff',
  },
  rk_dance: {
    name: 'カードマンダンス', kana: 'かーどまんだんす', kind: 'skill', job: 'rakuten_cardman', mp: 9, target: 'enemies',
    effect: { type: 'phys', mult: 1.0 },
    desc: 'おどりながら、敵全体にカードを投げる。', cast: '{a}はおどりながら、カードをばらまいた！', anim: 'cards',
  },
  rakuten_cardman_sig: {
    name: '楽天カード！', kana: 'らくてんかーど', kind: 'skill', job: 'rakuten_cardman', mp: 16, target: 'enemies',
    effect: { type: 'phys', mult: 1.3, points: 0.6 },
    desc: '大きな声でさけびながら、カードで敵全体を切りつける。ポイントバックで、当てた敵が持っているお金の一部がもらえる（たおさなくても）。', cast: '{a}「楽天カード！」', anim: 'rakuten_cardman_sig',
  },

  // ───────────── きさつ隊（上級職。戦士＋武闘家） ─────────────
  ks_minamo: {
    name: '水面斬り', kana: 'みなもぎり', kind: 'skill', job: 'kisatsu', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.8 },
    desc: '水の呼吸の一の型。水平に、敵1体を切りつける。', cast: '{a}の水の呼吸！水面斬り！', anim: 'slash_heavy',
  },
  ks_zenshuu: {
    name: '全集中の呼吸', kana: 'ぜんしゅうちゅうのこきゅう', kind: 'skill', job: 'kisatsu', mp: 5, target: 'self', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.3, dur: 35 },
    desc: '深く息をすって、体中に力をめぐらせる。自分の攻撃力と素早さが上がる。', cast: '{a}「全集中…！」', anim: 'charge',
  },
  ks_hyoutan: {
    name: 'ひょうたんふき', kana: 'ひょうたんふき', kind: 'skill', job: 'kisatsu', mp: 2, target: 'self', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [45, 60], thr: 25 }, { type: 'mpHeal', base: [3, 5] }] },
    desc: '大きなひょうたんをふいて、呼吸をととのえる。自分のHPとMPが少し回復する。', cast: '{a}はひょうたんを力いっぱいふいた！パーン！', anim: 'heal1',
  },
  ks_uchishio: {
    name: '打ち潮', kana: 'うちしお', kind: 'skill', job: 'kisatsu', mp: 7, target: 'group',
    effect: { type: 'phys', mult: 1.15 },
    desc: '水の呼吸の三の型。波のような太刀すじで、同じ種類の敵を切る。', cast: '{a}の水の呼吸！打ち潮！', anim: 'slash_multi',
  },
  ks_nejire: {
    name: 'ねじれうず', kana: 'ねじれうず', kind: 'skill', job: 'kisatsu', mp: 9, target: 'enemies',
    effect: { type: 'phys', mult: 0.95 },
    desc: '水の呼吸の六の型。体をねじって大きなうずを作り、敵全体を切る。', cast: '{a}の水の呼吸！ねじれうず！', anim: 'wind2',
  },
  kisatsu_sig: {
    name: '生生流転', kana: 'せいせいるてん', kind: 'skill', job: 'kisatsu', mp: 15, target: 'enemy',
    effect: { type: 'phys', mult: 0.8, hits: 4 },
    desc: '水の呼吸の十の型。回るほど強くなる水の竜で、敵1体を4回切りつける。', cast: '{a}の水の呼吸、十の型！生生流転！', anim: 'kisatsu_sig',
  },

  // ───────────── 炎柱（超級職。きさつ隊を きわめる） ─────────────
  eb_shiranui: {
    name: '不知火', kana: 'しらぬい', kind: 'skill', job: 'enbashira', mp: 6, target: 'enemy',
    effect: { type: 'phys', mult: 2.2, element: 'fire' },
    desc: '炎の呼吸の一の型。目にもとまらぬふみこみで、敵1体を炎の刀で切る。炎のダメージ。', cast: '{a}の炎の呼吸！不知火！', anim: 'fire2',
  },
  eb_umai: {
    name: 'うまい！', kana: 'うまい', kind: 'skill', job: 'enbashira', mp: 4, target: 'self', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [110, 135], thr: 40 }, { type: 'mpHeal', base: [5, 8] }] },
    desc: 'お弁当を食べて元気を取りもどす。自分のHPとMPが回復する。', cast: '{a}はお弁当を食べた！「うまい！うまい！うまい！」', anim: 'heal2',
  },
  eb_noboru: {
    name: 'のぼり炎天', kana: 'のぼりえんてん', kind: 'skill', job: 'enbashira', mp: 10, target: 'enemy',
    effect: { type: 'phys', mult: 2.9, element: 'fire' },
    desc: '炎の呼吸の二の型。下から上へ、敵1体を炎の刀で切り上げる。炎のダメージ。', cast: '{a}の炎の呼吸！のぼり炎天！', anim: 'fire3',
  },
  eb_uneri: {
    name: '盛炎のうねり', kana: 'せいえんのうねり', kind: 'skill', job: 'enbashira', mp: 16, target: 'enemies',
    effect: { type: 'phys', mult: 1.55, element: 'fire' },
    desc: '炎の呼吸の四の型。うずまく炎で、敵全体をなぎはらう。炎のダメージ。', cast: '{a}の炎の呼吸！盛炎のうねり！', anim: 'fire_wave',
  },
  enbashira_sig: {
    name: '心を燃やせ', kana: 'こころをもやせ', kind: 'skill', job: 'enbashira', mp: 16, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'atk', mult: 1.35, dur: 40 }, { type: 'heal', base: [55, 70], thr: 40 }] },
    desc: '「心を燃やせ！」と仲間をはげます。仲間全員の攻撃力が上がり、HPも少し回復する。', cast: '{a}「胸を張って生きろ！心を燃やせ！」', anim: 'enbashira_sig',
  },
  eb_rengoku: {
    name: '九の型・れんごく', kana: 'くのかたれんごく', kind: 'skill', job: 'enbashira', mp: 26, target: 'enemy',
    effect: { type: 'phys', mult: 4.0, element: 'fire', ignoreDef: 0.25 },
    desc: '炎の呼吸のおく義。すべてをかけた炎の一げきで、敵1体にとても大きなダメージ。炎のダメージ。', cast: '{a}の炎の呼吸、おく義！九の型・れんごく！', anim: 'fire_tornado',
  },

  // ───────────── 日の呼吸の使い手（伝説の職業。炎柱＋ほかの 超級職 1つ） ─────────────
  hn_kasha: {
    name: '火車', kana: 'かしゃ', kind: 'skill', job: 'hinokami', mp: 12, target: 'enemy',
    effect: { type: 'phys', mult: 3.3, element: 'fire' },
    desc: '体ごと前に回りながら、敵1体を真上から切る。炎のダメージ。', cast: '{a}のヒノカミ神楽！火車！', anim: 'fire3',
  },
  hn_sukitooru: {
    name: 'すきとおる世界', kana: 'すきとおるせかい', kind: 'skill', job: 'hinokami', mp: 12, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['atk', 'agi'], mult: 1.5, dur: 45 }, { type: 'buff', stat: 'eva', add: 0.3, dur: 45 }] },
    desc: '相手の体の中まですきとおって見える。自分の攻撃力と素早さがとても上がり、攻撃をかわしやすくなる。', cast: '{a}には、すべてがすきとおって見えた…', anim: 'charge',
  },
  hn_hirin: {
    name: '飛輪陽炎', kana: 'ひりんかげろう', kind: 'skill', job: 'hinokami', mp: 18, target: 'enemies',
    effect: { type: 'phys', mult: 1.75, element: 'fire' },
    desc: 'ゆらめく陽炎のような太刀すじで、敵全体を切る。炎のダメージ。', cast: '{a}のヒノカミ神楽！飛輪陽炎！', anim: 'fire_wave',
  },
  hn_koukyou: {
    name: '烈日紅鏡', kana: 'れつじつこうきょう', kind: 'skill', job: 'hinokami', mp: 16, target: 'group',
    effect: { type: 'phys', mult: 2.1, element: 'fire' },
    desc: '左右に2つの太陽をえがくように、同じ種類の敵を切る。炎のダメージ。', cast: '{a}のヒノカミ神楽！烈日紅鏡！', anim: 'slash_multi',
  },
  hn_aza: {
    name: '日の出のあざ', kana: 'ひのでのあざ', kind: 'skill', job: 'hinokami', mp: 14, target: 'self', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [160, 190], thr: 60 }, { type: 'cure', statuses: STATUS_ALL }, { type: 'buff', stat: 'def', mult: 1.4, dur: 40 }] },
    desc: 'ひたいに、日の出のようなあざがうかぶ。自分のHPを大きく回復して悪いじょうたいを治し、守備力も上がる。', cast: '{a}のひたいに、ほのおのようなあざがうかび上がった！', anim: 'heal2',
  },
  hinokami_sig: {
    name: 'ヒノカミ神楽', kana: 'ひのかみかぐら', kind: 'skill', job: 'hinokami', mp: 34, target: 'enemies',
    effect: { type: 'phys', mult: 0.8, hits: 8, random: true, element: 'fire' },
    desc: '日の呼吸の12の型を、夜明けまでつなげておどる。敵にランダムで8回、炎の太刀をあびせる。炎のダメージ。', cast: '{a}は、日の神にささげるかぐらをおどり始めた…！', anim: 'hinokami_sig',
  },

  // ───────────── スパイ（基本職） ─────────────
  spy_knife: {
    name: 'ナイフスロー', kana: 'ないふすろー', kind: 'skill', job: 'spy', mp: 1, target: 'enemy',
    effect: { type: 'phys', mult: 1.35 },
    desc: 'かくし持ったナイフを、敵1体に投げつける。', cast: '{a}はそでからナイフを投げた！', anim: 'shuriken',
  },
  spy_hensou: {
    name: '変装', kana: 'へんそう', kind: 'skill', job: 'spy', mp: 3, target: 'self', role: 'sup',
    effect: { type: 'buff', stat: 'eva', add: 0.3, dur: 30 },
    desc: 'まったくの別人に変装する。自分が攻撃をかわしやすくなる。', cast: '{a}は、べつの人に変装した！…だれ？', anim: 'buff',
  },
  spy_kimitsu: {
    name: '機密ぬすみ', kana: 'きみつぬすみ', kind: 'skill', job: 'spy', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.1, steal: 0.35 },
    desc: '敵1体にすばやく近づいて一げき。持ち物をぬすむこともある。', cast: '{a}は、音もなく{t}に近づいた…', anim: 'slash_fast',
  },
  spy_gas: {
    name: 'ペン型ねむりガス', kana: 'ぺんがたねむりがす', kind: 'skill', job: 'spy', mp: 4, target: 'group',
    effect: { type: 'status', status: 'sleep', chance: 0.45, turns: [2, 3] },
    desc: 'ペンに見せかけた道具から、ねむりガスをふき出す。同じ種類の敵をねむらせることがある。', cast: '{a}はボールペンのおしりをカチッとおした！', anim: 'sleep',
  },
  spy_action: {
    name: 'スパイアクション', kana: 'すぱいあくしょん', kind: 'skill', job: 'spy', mp: 6, target: 'enemies',
    effect: { type: 'phys', mult: 0.85 },
    desc: 'かべをけって宙を回り、敵全体にけりを入れる。', cast: '{a}は、かべをけってとび回った！', anim: 'kick',
  },
  spy_sig: {
    name: 'ミッション・コンプリート', kana: 'みっしょんこんぷりーと', kind: 'skill', job: 'spy', mp: 10, target: 'enemy',
    effect: { type: 'phys', mult: 2.3, ignoreDef: 0.25, critBonus: 0.15 },
    desc: 'ひみつの任務をしあげる、決めの一げき。敵1体に大きなダメージ。会心が出やすく、守りが固い敵にも強い。', cast: '{a}「ミッション、コンプリート」', anim: 'spy_sig',
  },

  // ───────────── 殺し屋（上級職。スパイを きわめる） ─────────────
  as_kyuusho: {
    name: '急所づき', kana: 'きゅうしょづき', kind: 'skill', job: 'assassin', mp: 4, target: 'enemy',
    effect: { type: 'phys', mult: 1.8, critBonus: 0.25 },
    desc: '敵1体の急所をねらってつく。会心がとても出やすい。', cast: '{a}は、{t}の急所をねらった！', anim: 'slash_fast',
  },
  as_kehai: {
    name: '気配を消す', kana: 'けはいをけす', kind: 'skill', job: 'assassin', mp: 4, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'eva', add: 0.35, dur: 30 }, { type: 'buff', stat: 'agi', mult: 1.3, dur: 30 }] },
    desc: 'すっと気配を消す。自分が攻撃をかわしやすくなり、素早さも上がる。', cast: '{a}の気配が、すうっと消えた…', anim: 'buff',
  },
  as_dokubari: {
    name: '毒ばり', kana: 'どくばり', kind: 'skill', job: 'assassin', mp: 5, target: 'enemy',
    effect: { type: 'phys', mult: 1.5, status: { status: 'poison', chance: 0.7, turns: [3, 4] } },
    desc: '細いはりで、敵1体をさす。毒になることが多い。', cast: '{a}は毒ばりを放った！', anim: 'shuriken',
  },
  as_ame: {
    name: 'ナイフの嵐', kana: 'ないふのあらし', kind: 'skill', job: 'assassin', mp: 12, target: 'enemies',
    effect: { type: 'phys', mult: 0.7, hits: 5, random: true },
    desc: '空からナイフをふらせる。敵にランダムで5回ささる。', cast: '{a}が手をふると、ナイフが雨のようにふってきた！', anim: 'shuriken',
  },
  assassin_sig: {
    name: '一撃必殺', kana: 'いちげきひっさつ', kind: 'skill', job: 'assassin', mp: 16, target: 'enemy',
    effect: { type: 'destroy', chance: 0.4, bossMult: 2.4, msg: '{t}は、音もなくたおれた…', failMsg: '{t}は、ぎりぎりでかわした！', bossMsg: '{t}には、急所が見つからない！' },
    desc: 'ねらった相手はのがさない。敵1体を一げきでたおすことがある（たおしたことになる）。ボスとメタルにはきかず、かわりに大きなダメージ。', cast: '{a}「…ねらった相手は、のがさない」', anim: 'assassin_sig',
  },

  // ───────────── 黒の組織（超級職。殺し屋を きわめる） ─────────────
  bo_yamiuchi: {
    name: '闇討ち', kana: 'やみうち', kind: 'skill', job: 'black_org', mp: 8, target: 'enemy',
    effect: { type: 'phys', mult: 2.5, element: 'dark' },
    desc: '黒いコートで闇にまぎれ、敵1体をうつ。闇のダメージ。', cast: '{a}は、闇の中から{t}をおそった！', anim: 'dark_slash',
  },
  bo_codename: {
    name: 'コードネーム', kana: 'こーどねーむ', kind: 'skill', job: 'black_org', mp: 8, target: 'self', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.4, dur: 40 },
    desc: 'ひみつのコードネームを名のる。自分の攻撃力と素早さがとても上がる。', cast: '{a}「おれのことは、コードネームでよべ」', anim: 'dark1',
  },
  bo_torihiki: {
    name: 'あやしい取り引き', kana: 'あやしいとりひき', kind: 'skill', job: 'black_org', mp: 2, target: 'enemy',
    effect: { type: 'drainMp', amount: [10, 18] },
    desc: '敵1体とあやしい取り引きをして、MPをうばう。', cast: '{a}は、黒いアタッシュケースを開けた…', anim: 'dark1',
  },
  bo_kuruma: {
    name: '黒い車', kana: 'くろいくるま', kind: 'skill', job: 'black_org', mp: 16, target: 'enemies',
    effect: { type: 'phys', mult: 1.5 },
    desc: '黒い車で、敵全体にのりこむ。', cast: '{a}の黒い車が、ものすごい速さでつっこんできた！', anim: 'tackle',
  },
  black_org_sig: {
    name: 'APTX4869', kana: 'えーぴーてぃーえっくすよんはちろくきゅう', kind: 'skill', job: 'black_org', mp: 18, target: 'enemy', role: 'sup',
    effect: { type: 'multi', parts: [
      { type: 'debuff', stat: 'atk', mult: 0.65, dur: 40, chance: 0.85 },
      { type: 'debuff', stat: 'def', mult: 0.7, dur: 40, chance: 0.85 },
    ] },
    desc: 'なぞの薬を、敵1体にのませる。体がちぢんで、攻撃力と守備力がとても下がる。', cast: '{a}は、なぞのカプセルを取り出した…', anim: 'black_org_sig',
  },
  bo_meirei: {
    name: 'あの方の命令', kana: 'あのかたのめいれい', kind: 'skill', job: 'black_org', mp: 26, target: 'enemies',
    effect: { type: 'phys', mult: 1.75, element: 'dark' },
    desc: '組織のボスの命令で、敵全体を闇にしずめる。闇のダメージ。', cast: '{a}「あの方の命令だ。…消えてもらう」', anim: 'dark1',
  },

  // ───────────── 超能力者（上級職。魔法使い＋小学生） ─────────────
  ep_spoon: {
    name: 'スプーンまげ', kana: 'すぷーんまげ', kind: 'skill', job: 'esper', mp: 3, target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'magic', base: [26, 34], thr: 25 }, { type: 'debuff', stat: 'atk', mult: 0.85, dur: 30, chance: 0.7 }] },
    desc: '敵1体の武器を、スプーンのようにぐにゃりとまげる。ダメージをあたえて、攻撃力を下げる。', cast: '{a}は{t}の武器をじっと見つめた…まがった！', anim: 'debuff',
  },
  ep_nenriki: {
    name: 'ねん力', kana: 'ねんりき', kind: 'skill', job: 'esper', mp: 5, target: 'enemy',
    effect: { type: 'magic', base: [55, 68], thr: 35 },
    desc: '心の力で、敵1体をぎゅっとおしつぶす。', cast: '{a}「むむむ…はっ！」', anim: 'void',
  },
  ep_yochi: {
    name: '予知', kana: 'よち', kind: 'skill', job: 'esper', mp: 5, target: 'self', role: 'sup',
    effect: { type: 'buff', stat: 'eva', add: 0.35, dur: 30 },
    desc: '少し先の未来が見える。自分が攻撃をかわしやすくなる。', cast: '{a}「…次に来るのは、右！」', anim: 'buff',
  },
  ep_teleport: {
    name: 'テレポート', kana: 'てれぽーと', kind: 'skill', job: 'esper', mp: 6, target: 'self', role: 'sup',
    effect: { type: 'escape' },
    desc: '自分たちを、しゅん間移動で戦いからにがす（にげられない戦いもある）。', cast: '{a}は、みんなの手をにぎった。「テレポート！」', anim: 'void',
  },
  ep_psycho: {
    name: 'サイコキネシス', kana: 'さいこきねしす', kind: 'skill', job: 'esper', mp: 10, target: 'enemies',
    effect: { type: 'magic', base: [48, 60], thr: 40 },
    desc: '見えない力で敵全体をもち上げて、たたきつける。', cast: '{a}が手をかざすと、敵がうき上がった！', anim: 'void',
  },
  esper_sig: {
    name: '超能力全開', kana: 'ちょうのうりょくぜんかい', kind: 'skill', job: 'esper', mp: 18, target: 'enemies', role: 'dmg',
    effect: { type: 'multi', parts: [
      { type: 'magic', base: [88, 106], thr: 65 },
      { type: 'atbSet', sub: 30, chance: 0.5, msg: '{t}は、宙にうかんで動けない！', failMsg: '{t}は、ふんばった！' },
    ] },
    desc: 'ありったけの超能力で、敵全体を宙にうかべてふり回す。動きが止まることもある（ボスには効きにくい）。', cast: '{a}「全部、うき上がれー！」', anim: 'esper_sig',
  },

  // ───────────── 少年探てい団（基本職） ─────────────
  tn_ball: {
    name: 'サッカーボールキック', kana: 'さっかーぼーるきっく', kind: 'skill', job: 'shonen_tantei', mp: 1, target: 'enemy',
    effect: { type: 'phys', mult: 1.35 },
    desc: 'サッカーボールを、敵1体に思いきりけりこむ。', cast: '{a}のシュート！', anim: 'ball',
  },
  tn_badge: {
    name: '探てい団バッジ', kana: 'たんていだんばっじ', kind: 'skill', job: 'shonen_tantei', mp: 4, target: 'allies', role: 'sup',
    effect: { type: 'atbSet', add: 25, msg: '{t}は、すぐに動けそうだ！' },
    desc: 'バッジで仲間に連らくする。仲間全員の行動ゲージが少したまる。', cast: '{a}「こちら探てい団！みんな、聞こえる？」', anim: 'buff',
  },
  tn_kikikomi: {
    name: '聞きこみ', kana: 'ききこみ', kind: 'skill', job: 'shonen_tantei', mp: 2, target: 'enemy',
    effect: { type: 'debuff', stat: 'def', mult: 0.85, dur: 30, chance: 0.8 },
    desc: 'あちこちで聞きこみをして、敵1体の弱いところを見つける。守備力が下がる。', cast: '{a}「すみません、ちょっとお聞きしたいんですけど！」', anim: 'debuff',
  },
  tn_suiri: {
    name: 'みんなで推理', kana: 'みんなですいり', kind: 'skill', job: 'shonen_tantei', mp: 3, target: 'enemy',
    effect: { type: 'deduce', base: [20, 27], thr: 15 },
    desc: 'みんなでアイデアを出し合う。敵1体の弱点を見ぬいて、その属性で攻撃する（弱点がなければ、ふつうの攻撃）。', cast: '{a}「わかった！あいつの弱点は…」', anim: 'holy',
  },
  tn_jitensha: {
    name: '自転車アタック', kana: 'じてんしゃあたっく', kind: 'skill', job: 'shonen_tantei', mp: 5, target: 'enemies',
    effect: { type: 'phys', mult: 0.8 },
    desc: '自転車で、敵全体の間をつっきる。', cast: '{a}は自転車をこいでつっこんだ！チリンチリン！', anim: 'tackle',
  },
  shonen_tantei_sig: {
    name: '少年探てい団、出動！', kana: 'しょうねんたんていだんしゅつどう', kind: 'skill', job: 'shonen_tantei', mp: 10, target: 'enemies',
    effect: { type: 'phys', mult: 0.45, hits: 5, random: true },
    desc: '団員みんなで、いっせいにとびかかる。敵にランダムで5回攻撃する。', cast: '{a}「少年探てい団、出動！」', anim: 'shonen_tantei_sig',
  },

  // ───────────── おしり探てい（上級職。少年探てい団を きわめる） ─────────────
  os_kunkun: {
    name: 'くんくん', kana: 'くんくん', kind: 'skill', job: 'oshiri_tantei', mp: 3, target: 'enemies', role: 'sup',
    effect: { type: 'scan' },
    desc: '鼻をくんくんさせて、敵全体のにおいをかぐ。弱点と、効かない属性がすべてわかる（図鑑にものこる）。', cast: '{a}「くんくん…においますね」', anim: 'buff',
  },
  os_pupu: {
    name: 'ププッ', kana: 'ぷぷっ', kind: 'skill', job: 'oshiri_tantei', mp: 4, target: 'self', role: 'sup',
    effect: { type: 'buff', stat: 'mag', mult: 1.35, dur: 35 },
    desc: '「ププッ」とわらって、頭をフル回転。自分の魔力（推理の力）が上がる。', cast: '{a}「ププッ。なるほど」', anim: 'buff',
  },
  os_suiri: {
    name: 'おしり推理', kana: 'おしりすいり', kind: 'skill', job: 'oshiri_tantei', mp: 5, target: 'enemy',
    effect: { type: 'deduce', base: [48, 60], thr: 30 },
    desc: 'するどい推理で、敵1体の弱点を見ぬいて、その属性で攻撃する（弱点がなければ、ふつうの攻撃）。', cast: '{a}「推理はすでに、おわっています」', anim: 'holy',
  },
  os_brown: {
    name: 'たのみましたよ', kana: 'たのみましたよ', kind: 'skill', job: 'oshiri_tantei', mp: 7, target: 'enemies',
    effect: { type: 'phys', mult: 0.95 },
    desc: '助手の犬に、たのむ。犬が敵全体にとびかかる。', cast: '{a}「ブラウン、たのみましたよ」「ワン！」', anim: 'bite',
  },
  os_oyatsu: {
    name: 'おやつの時間', kana: 'おやつのじかん', kind: 'skill', job: 'oshiri_tantei', mp: 8, target: 'allies', role: 'heal', field: true,
    effect: { type: 'heal', base: [44, 56], thr: 35 },
    desc: '大すきなおいもで、ひと休み。仲間全員のHPを回復する。', cast: '{a}「おやつの時間ですね。ププッ」', anim: 'heal2',
  },
  oshiri_tantei_sig: {
    name: 'しつれいこかせていただきます', kana: 'しつれいこかせていただきます', kind: 'skill', job: 'oshiri_tantei', mp: 16, target: 'enemies', role: 'dmg',
    effect: { type: 'multi', parts: [
      { type: 'magic', element: 'wind', base: [62, 76], thr: 45 },
      { type: 'status', status: 'confuse', chance: 0.4, turns: [2, 3] },
    ] },
    desc: 'ていねいにことわってから、大きなおならをする。敵全体に風のダメージ。くさくて、こんらんすることもある。', cast: '{a}「しつれい、こかせていただきます」ブッ！！', anim: 'oshiri_tantei_sig',
  },

  // ───────────── 名探てい（上級職。おしり探ていを きわめる） ─────────────
  mt_fukiya: {
    name: 'ねむりのふき矢', kana: 'ねむりのふきや', kind: 'skill', job: 'meitantei', mp: 4, target: 'enemy',
    effect: { type: 'status', status: 'sleep', chance: 0.7, turns: [2, 3] },
    desc: 'うで時計にかくしたふき矢で、敵1体をねむらせる。', cast: '{a}はうで時計のふたを開けた…プシュッ！', anim: 'sleep',
  },
  mt_kick: {
    name: 'キック力増強シューズ', kana: 'きっくりょくぞうきょうしゅーず', kind: 'skill', job: 'meitantei', mp: 6, target: 'enemy',
    effect: { type: 'phys', mult: 2.2 },
    desc: 'くつのダイヤルを回して、ボールを敵1体にけりこむ。', cast: '{a}はくつのダイヤルを回した…いっけえ！', anim: 'ball',
  },
  mt_henseiki: {
    name: 'ちょうネクタイ型変声機', kana: 'ちょうねくたいがたへんせいき', kind: 'skill', job: 'meitantei', mp: 5, target: 'group',
    effect: { type: 'status', status: 'confuse', chance: 0.45, turns: [2, 3] },
    desc: 'ほかの人の声で話しかけて、同じ種類の敵をまどわせる。こんらんすることがある。', cast: '{a}は、ちょうネクタイをそっと口に当てた…', anim: 'debuff',
  },
  mt_skate: {
    name: 'ターボエンジン付きスケボー', kana: 'たーぼえんじんつきすけぼー', kind: 'skill', job: 'meitantei', mp: 9, target: 'enemies',
    effect: { type: 'phys', mult: 1.0 },
    desc: 'エンジン付きのスケボーで、敵全体の間をかけぬける。', cast: '{a}のスケボーが、ものすごい速さで走り出した！', anim: 'tackle',
  },
  mt_hannin: {
    name: '犯人はあなたです', kana: 'はんにんはあなたです', kind: 'skill', job: 'meitantei', mp: 8, target: 'enemy', role: 'sup',
    effect: { type: 'multi', parts: [
      { type: 'debuff', stat: 'def', mult: 0.75, dur: 35, chance: 0.85 },
      { type: 'atbSet', sub: 25, chance: 0.6, msg: '{t}は、ぎくっとして動けない！', failMsg: '{t}は、しらんぷりをした。' },
    ] },
    desc: '敵1体をびしっと指さす。ぎくっとして守備力が下がり、動きが止まることもある（ボスには効きにくい）。', cast: '{a}「犯人は…あなたです！」', anim: 'debuff',
  },
  meitantei_sig: {
    name: '真実はいつもひとつ', kana: 'しんじつはいつもひとつ', kind: 'skill', job: 'meitantei', mp: 20, target: 'enemies',
    effect: { type: 'deduce', base: [95, 115], thr: 65 },
    desc: '見た目は子ども、頭脳は大人。敵全体それぞれの弱点を見ぬいて、その属性で攻撃する（弱点がなければ、ふつうの攻撃）。', cast: '{a}「真実は、いつもひとつ！」', anim: 'meitantei_sig',
  },

  // ───────────── クリエイター（上級職。アルバイト＋僧侶。薬局で 働く人） ─────────────
  ct_kago: {
    name: '買い物かごアタック', kana: 'かいものかごあたっく', kind: 'skill', job: 'creator', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.8 },
    desc: '品物でいっぱいの買い物かごを、敵1体にぶつける。', cast: '{a}は買い物かごをふり回した！', anim: 'tackle',
  },
  ct_kusuri: {
    name: 'お薬出しておきますね', kana: 'おくすりだしておきますね', kind: 'skill', job: 'creator', mp: 5, target: 'ally', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [62, 78], thr: 30 }, { type: 'cure', statuses: STATUS_ALL }] },
    desc: '仲間1人にぴったりのお薬をわたす。HPを回復して、悪いじょうたいも治す。', cast: '{a}「{t}さん、お薬出しておきますね」', anim: 'heal1',
  },
  ct_point: {
    name: 'ポイント2倍デー', kana: 'ぽいんとにばいでー', kind: 'skill', job: 'creator', mp: 2, target: 'allies', role: 'heal',
    effect: { type: 'mpHeal', base: [3, 6] },
    desc: '今日はポイント2倍！うれしくて、仲間全員のMPが少し回復する。', cast: '{a}「本日、ポイント2倍デーでーす！」', anim: 'coins',
  },
  ct_shoudoku: {
    name: '消毒スプレー', kana: 'しょうどくすぷれー', kind: 'skill', job: 'creator', mp: 6, target: 'group',
    effect: { type: 'magic', base: [42, 54], thr: 30 },
    desc: 'シュッシュッと消毒スプレー。同じ種類の敵をしみさせる。', cast: '{a}「しっかり消毒しましょう！」シュッシュッ！', anim: 'water',
  },
  ct_shohou: {
    name: '処方せん', kana: 'しょほうせん', kind: 'skill', job: 'creator', mp: 9, target: 'allies', role: 'heal',
    effect: { type: 'regen', base: [11, 15], thr: 35, dur: 24 },
    desc: 'みんなに合ったお薬を、ちゃんと処方。仲間全員のHPが、しばらく少しずつ回復する。', cast: '{a}は処方せんを、ていねいに読んだ！', anim: 'heal_ring',
  },
  creator_sig: {
    name: '本日の大安売り', kana: 'ほんじつのおおやすうり', kind: 'skill', job: 'creator', mp: 16, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [75, 95], thr: 45 }, { type: 'mpHeal', base: [4, 7] }] },
    desc: '店じゅうの品物を大安売り！仲間全員のHPを回復して、MPも少し回復する。', cast: '{a}「本日、全品大安売りでーす！」', anim: 'creator_sig',
  },

  // ───────────── ネコ型ロボット（基本職） ─────────────
  nr_punch: {
    name: 'まんまるパンチ', kana: 'まんまるぱんち', kind: 'skill', job: 'neko_robot', mp: 1, target: 'enemy',
    effect: { type: 'phys', mult: 1.35 },
    desc: 'まんまるの手で、敵1体をポカッとなぐる。', cast: '{a}のまんまるパンチ！', anim: 'punch',
  },
  nr_dorayaki: {
    name: 'どら焼き', kana: 'どらやき', kind: 'skill', job: 'neko_robot', mp: 3, target: 'ally', role: 'heal', field: true,
    effect: { type: 'heal', base: [34, 44], thr: 14 },
    desc: '大すきなどら焼きを、仲間1人に分けてあげる。HPが回復する。', cast: '{a}「{t}にも、どら焼き分けてあげる！」', anim: 'heal1',
  },
  nr_pocket: {
    name: 'ポケットをさぐる', kana: 'ぽけっとをさぐる', kind: 'skill', job: 'neko_robot', mp: 2, target: 'self',
    effect: { type: 'random', options: ['nr_p_hammer', 'nr_p_tea', 'nr_p_garakuta'] },
    desc: 'おなかのポケットをさぐる。何が出てくるかは運しだい。', cast: '{a}はポケットをごそごそさぐった…', anim: 'charge',
  },
  nr_p_hammer: {
    name: 'ピコピコハンマー', kana: 'ぴこぴこはんまー', kind: 'skill', job: 'neko_robot', mp: 0, target: 'enemy', hidden: true,
    effect: { type: 'phys', mult: 1.9 },
    desc: 'ピコピコハンマーで敵1体をたたく。', cast: 'ピコピコハンマーが出てきた！ピコッ！', anim: 'punch',
  },
  nr_p_tea: {
    name: 'あったかいお茶', kana: 'あったかいおちゃ', kind: 'skill', job: 'neko_robot', mp: 0, target: 'self', hidden: true,
    effect: { type: 'heal', base: [50, 65], thr: 14 },
    desc: '自分のHPを回復する。', cast: 'あったかいお茶が出てきた！ずずっ…ほっ。', anim: 'heal1',
  },
  nr_p_garakuta: {
    name: 'ガラクタ', kana: 'がらくた', kind: 'skill', job: 'neko_robot', mp: 0, target: 'self', hidden: true,
    effect: { type: 'nothing' },
    desc: '何も起こらない。', cast: '出てきたのは、ガラクタばかりだった…。', anim: 'charge',
  },
  nr_suzu: {
    name: 'ネコのすずの音', kana: 'ねこのすずのね', kind: 'skill', job: 'neko_robot', mp: 4, target: 'group',
    effect: { type: 'status', status: 'sleep', chance: 0.4, turns: [2, 3] },
    desc: '首のすずをチリンと鳴らす。同じ種類の敵をねむらせることがある。', cast: '{a}のすずが、チリン…と鳴った。', anim: 'sleep',
  },
  nr_tackle: {
    name: 'ロボットタックル', kana: 'ろぼっとたっくる', kind: 'skill', job: 'neko_robot', mp: 5, target: 'enemies',
    effect: { type: 'phys', mult: 0.8 },
    desc: 'まるい体で、敵全体に体当たりする。', cast: '{a}はころころと転がっていった！', anim: 'tackle',
  },
  neko_robot_sig: {
    name: 'ネコ型ロボット・フルパワー', kana: 'ねこがたろぼっとふるぱわー', kind: 'skill', job: 'neko_robot', mp: 10, target: 'enemies',
    effect: { type: 'phys', mult: 1.1 },
    desc: '未来のモーターを全開にして、敵全体にとっしんする。', cast: '{a}「フルパワーで、いっくぞー！」', anim: 'neko_robot_sig',
  },

  // ───────────── 耳無しネコ型ロボット（上級職。ネコ型ロボットを きわめる） ─────────────
  mr_zutsuki: {
    name: 'まんまる頭つき', kana: 'まんまるずつき', kind: 'skill', job: 'mimi_robot', mp: 4, target: 'enemy',
    effect: { type: 'phys', mult: 1.9 },
    desc: '耳のない、まんまるの頭で、敵1体に頭つき。', cast: '{a}の頭つき！ゴチン！', anim: 'tackle',
  },
  mr_naku: {
    name: '大泣き', kana: 'おおなき', kind: 'skill', job: 'mimi_robot', mp: 5, target: 'enemies', role: 'sup',
    effect: { type: 'atbSet', sub: 30, chance: 0.5, msg: '{t}は、あっけにとられて動けない！', failMsg: '{t}は、気にしていない。' },
    desc: '耳がないのが悲しくて、大泣きする。敵全体があっけにとられて、動きが止まることもある（ボスには効きにくい）。', cast: '{a}「ぼくの耳がー！うわーん！」', anim: 'debuff',
  },
  mr_ooguui: {
    name: 'どら焼き大食い', kana: 'どらやきおおぐい', kind: 'skill', job: 'mimi_robot', mp: 4, target: 'self', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [80, 100], thr: 30 }, { type: 'mpHeal', base: [4, 6] }] },
    desc: 'どら焼きを10こ食べる。自分のHPとMPが回復する。', cast: '{a}はどら焼きをつぎつぎに食べた！もぐもぐもぐ！', anim: 'heal2',
  },
  mr_shuuri: {
    name: 'ロボット修理', kana: 'ろぼっとしゅうり', kind: 'skill', job: 'mimi_robot', mp: 7, target: 'ally', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [75, 95], thr: 35 }, { type: 'cure', statuses: STATUS_ALL }] },
    desc: '未来の工具で、仲間1人をすっかり直す。HPを回復して、悪いじょうたいも治す。', cast: '{a}は、未来の工具をカチャカチャと動かした！', anim: 'heal1',
  },
  mimi_robot_sig: {
    name: 'ネズミこわい！', kana: 'ねずみこわい', kind: 'skill', job: 'mimi_robot', mp: 14, target: 'enemies',
    effect: { type: 'phys', mult: 0.7, hits: 5, random: true },
    desc: 'ネズミを見て大パニック！むちゃくちゃにあばれて、敵にランダムで5回ぶつかる。', cast: '{a}「ネ、ネ、ネズミー！！」', anim: 'mimi_robot_sig',
  },

  // ───────────── ドラえもん（超級職。耳無しネコ型ロボットを きわめる） ─────────────
  dr_kuuki: {
    name: '空気ほう', kana: 'くうきほう', kind: 'skill', job: 'doraemon', mp: 8, target: 'enemy',
    effect: { type: 'phys', mult: 2.4, element: 'blast' },
    desc: 'うでにはめた空気ほうで、敵1体をうつ。爆発のダメージ。', cast: '{a}「ドカン！」', anim: 'blast1',
  },
  dr_takecopter: {
    name: 'タケコプター', kana: 'たけこぷたー', kind: 'skill', job: 'doraemon', mp: 10, target: 'allies', role: 'sup',
    effect: { type: 'buff', stat: 'agi', mult: 1.3, dur: 40 },
    desc: '頭に小さなプロペラ。仲間全員の素早さが上がる。', cast: '{a}「タケコプター！」みんなの体がふわりとうかんだ！', anim: 'buff',
  },
  dr_smalllight: {
    name: 'スモールライト', kana: 'すもーるらいと', kind: 'skill', job: 'doraemon', mp: 7, target: 'enemy',
    effect: { type: 'debuff', stat: 'atk', mult: 0.75, dur: 35, chance: 0.85 },
    desc: '光を当てると体が小さくなる。敵1体の攻撃力がとても下がる。', cast: '{a}「スモールライト！」', anim: 'debuff',
  },
  dr_furoshiki: {
    name: 'タイムふろしき', kana: 'たいむふろしき', kind: 'skill', job: 'doraemon', mp: 18, target: 'deadAlly', role: 'heal', field: true,
    effect: { type: 'revive', hpRatio: 0.5 },
    desc: 'つつんだ物の時間をもどすふろしき。たおれた仲間1人を、たおれる前にもどす（HPは半分）。', cast: '{a}「タイムふろしき！」{t}をそっとつつんだ…', anim: 'revive',
  },
  doraemon_sig: {
    name: 'ひみつ道具', kana: 'ひみつどうぐ', kind: 'skill', job: 'doraemon', mp: 14, target: 'self', autoRandom: true,
    effect: { type: 'random', options: ['dr_h_korobashi', 'dr_h_moshimo', 'dr_h_kaban', 'dr_h_rensha'] },
    desc: '4次元ポケットから、ひみつ道具を出す。どの道具が出るかは運しだい（敵を止める・みんなを強くする・回復・空気ほう連発）。', cast: '{a}は、4次元ポケットに手を入れた…', anim: 'doraemon_sig',
  },
  dr_h_korobashi: {
    name: 'ころばし屋', kana: 'ころばしや', kind: 'skill', job: 'doraemon', mp: 0, target: 'enemies', hidden: true,
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 0.8 }, { type: 'atbSet', sub: 40, chance: 0.6, msg: '{t}は、すってんころりん！', failMsg: '{t}は、ころばなかった。' }] },
    desc: '敵全体をころばせる。', cast: 'ころばし屋！小さな人形が、敵をつぎつぎにころばせた！', anim: 'kick',
  },
  dr_h_moshimo: {
    name: 'もしもボックス', kana: 'もしもぼっくす', kind: 'skill', job: 'doraemon', mp: 0, target: 'allies', hidden: true,
    effect: { type: 'buff', stats: ['atk', 'def'], mult: 1.25, dur: 40 },
    desc: '仲間全員の攻撃力と守備力が上がる。', cast: 'もしもボックス！「もしもみんなが、もっと強かったら！」', anim: 'buff',
  },
  dr_h_kaban: {
    name: 'お医者さんカバン', kana: 'おいしゃさんかばん', kind: 'skill', job: 'doraemon', mp: 0, target: 'allies', hidden: true,
    effect: { type: 'multi', parts: [{ type: 'heal', base: [90, 110], thr: 50 }, { type: 'cure', statuses: STATUS_ALL }] },
    desc: '仲間全員のHPを回復して、悪いじょうたいも治す。', cast: 'お医者さんカバン！みんなをすっかりしんさつした！', anim: 'heal2',
  },
  dr_h_rensha: {
    name: '空気ほう連発', kana: 'くうきほうれんぱつ', kind: 'skill', job: 'doraemon', mp: 0, target: 'enemies', hidden: true,
    effect: { type: 'phys', mult: 1.5, element: 'blast' },
    desc: '敵全体に爆発のダメージ。', cast: '空気ほう！ドカン！ドカン！ドカーン！', anim: 'blast2',
  },
  dr_bakudan: {
    name: '地球はかいばくだん', kana: 'ちきゅうはかいばくだん', kind: 'skill', job: 'doraemon', mp: 28, target: 'enemies', role: 'dmg',
    effect: { type: 'multi', parts: [
      { type: 'magic', element: 'blast', base: [175, 205], thr: 85 },
      { type: 'hurt', target: 'allies', base: [10, 20], msg: '{t}も、爆風にふきとばされた…' },
    ] },
    desc: 'あわてて出したのは、とんでもない道具！敵全体に大きな爆発のダメージ。仲間も少しダメージを受ける（HPは1より下がらない）。', cast: '{a}「わあああ！どうしよう、どうしよう！」', anim: 'blast2',
  },

  // ───────────── カッパ（基本職） ─────────────
  kp_tsuppari: {
    name: 'つっぱり', kana: 'つっぱり', kind: 'skill', job: 'kappa', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 0.6, hits: 3 },
    desc: 'すもうのつっぱりで、敵1体を3回つく。', cast: '{a}「どすこい！どすこい！どすこーい！」', anim: 'punch_multi',
  },
  kp_kyuuri: {
    name: 'キュウリをかじる', kana: 'きゅうりをかじる', kind: 'skill', job: 'kappa', mp: 2, target: 'self', role: 'heal',
    effect: { type: 'heal', base: [36, 46], thr: 14 },
    desc: '大すきなキュウリをポリポリかじる。自分のHPを回復する。', cast: '{a}はキュウリをかじった！ポリポリ…', anim: 'heal1',
  },
  kp_mizu: {
    name: '水でっぽう', kana: 'みずでっぽう', kind: 'skill', job: 'kappa', mp: 3, target: 'group',
    effect: { type: 'magic', base: [16, 22], thr: 14 },
    desc: '口から水をピューッとふき出して、同じ種類の敵に当てる。', cast: '{a}の水でっぽう！ピューッ！', anim: 'water',
  },
  kp_osara: {
    name: 'お皿をぬらす', kana: 'おさらをぬらす', kind: 'skill', job: 'kappa', mp: 3, target: 'self', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'def'], mult: 1.2, dur: 30 },
    desc: '頭のお皿を水でぬらして、元気をとりもどす。自分の攻撃力と守備力が上がる。', cast: '{a}は頭のお皿に水をかけた！ピカピカ！', anim: 'buff',
  },
  kp_sumou: {
    name: 'カッパずもう', kana: 'かっぱずもう', kind: 'skill', job: 'kappa', mp: 5, target: 'enemy', role: 'dmg',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 1.6 }, { type: 'atbSet', sub: 25, chance: 0.4, msg: '{t}は、ひっくり返った！', failMsg: '{t}は、ふみとどまった！' }] },
    desc: '敵1体とがっぷりよつにくんで、なげとばす。動きが止まることもある（ボスには効きにくい）。', cast: '{a}「はっけよーい、のこった！」', anim: 'tackle',
  },
  kappa_sig: {
    name: 'カッパの川流れ', kana: 'かっぱのかわながれ', kind: 'skill', job: 'kappa', mp: 9, target: 'enemies', role: 'dmg',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 1.1 }, { type: 'atbSet', sub: 25, chance: 0.35, msg: '{t}は、川に流された！', failMsg: '{t}は、流されなかった！' }] },
    desc: '川の流れにのって、敵全体をおし流す。流されて動きが止まることもある（ボスには効きにくい）。', cast: '{a}「カッパの川流れ…いや、カッパの大波だー！」', anim: 'kappa_sig',
  },

  // ───────────── はなかっぱ（上級職。カッパを きわめる） ─────────────
  hkp_hanabira: {
    name: '花びらカッター', kana: 'はなびらかったー', kind: 'skill', job: 'hanakappa', mp: 3, target: 'enemy',
    effect: { type: 'magic', element: 'wind', base: [40, 50], thr: 25 },
    desc: '頭の花から、するどい花びらを飛ばす。敵1体に風のダメージ。', cast: '{a}の頭から、花びらがまい上がった！', anim: 'wind1',
  },
  hkp_kafun: {
    name: '花粉ではっくしょん', kana: 'かふんではっくしょん', kind: 'skill', job: 'hanakappa', mp: 4, target: 'group',
    effect: { type: 'status', status: 'blind', chance: 0.5, turns: [2, 3] },
    desc: '花粉をまきちらす。同じ種類の敵がくしゃみで前が見えなくなることがある。', cast: '{a}の花から、花粉がふわふわ…「はっくしょん！」', anim: 'wind1',
  },
  hkp_mitsu: {
    name: '花のみつ', kana: 'はなのみつ', kind: 'skill', job: 'hanakappa', mp: 6, target: 'allies', role: 'heal', field: true,
    effect: { type: 'heal', base: [38, 50], thr: 30 },
    desc: 'あまい花のみつを、みんなで分ける。仲間全員のHPを回復する。', cast: '{a}「みんな、花のみつをどうぞ！」', anim: 'heal2',
  },
  hkp_pakkan: {
    name: 'パッカーン', kana: 'ぱっかーん', kind: 'skill', job: 'hanakappa', mp: 7, target: 'enemies',
    effect: { type: 'phys', mult: 0.95 },
    desc: '頭の花をパッカーンとひらいて、敵全体をはじきとばす。', cast: '{a}「パッカーン！」', anim: 'blast1',
  },
  hkp_gattsu: {
    name: 'ガッツの花', kana: 'がっつのはな', kind: 'skill', job: 'hanakappa', mp: 9, target: 'allies', role: 'sup',
    effect: { type: 'buff', stat: 'atk', mult: 1.2, dur: 35 },
    desc: '元気が出る花をさかせる。仲間全員の攻撃力が上がる。', cast: '{a}の頭に、ガッツの花がさいた！', anim: 'buff',
  },
  hanakappa_sig: {
    name: 'あたまの花、さけ！', kana: 'あたまのはなさけ', kind: 'skill', job: 'hanakappa', mp: 14, target: 'self', autoRandom: true,
    effect: { type: 'random', options: ['hkp_s_himawari', 'hkp_s_tougarashi', 'hkp_s_sakura'] },
    desc: '何かを食べて、頭に花をさかせる。何の花がさくかは運しだい（ひまわりの光・トウガラシの炎・さくらの回復）。', cast: '{a}はお弁当をパクッと食べた…頭の花が、ふるえている！', anim: 'hanakappa_sig',
  },
  hkp_s_himawari: {
    name: 'ひまわりビーム', kana: 'ひまわりびーむ', kind: 'skill', job: 'hanakappa', mp: 0, target: 'enemies', hidden: true,
    effect: { type: 'magic', element: 'light', base: [72, 88], thr: 50 },
    desc: '敵全体に光のダメージ。', cast: '頭に、ひまわりがさいた！まぶしい光が敵をつつむ！', anim: 'holy',
  },
  hkp_s_tougarashi: {
    name: 'トウガラシファイヤー', kana: 'とうがらしふぁいやー', kind: 'skill', job: 'hanakappa', mp: 0, target: 'enemies', hidden: true,
    effect: { type: 'magic', element: 'fire', base: [76, 92], thr: 50 },
    desc: '敵全体に炎のダメージ。', cast: '頭に、トウガラシの花がさいた！からーい炎がふき出した！', anim: 'fire_wave',
  },
  hkp_s_sakura: {
    name: 'さくらふぶき', kana: 'さくらふぶき', kind: 'skill', job: 'hanakappa', mp: 0, target: 'allies', hidden: true,
    effect: { type: 'multi', parts: [{ type: 'heal', base: [60, 76], thr: 40 }, { type: 'cure', statuses: STATUS_ALL }] },
    desc: '仲間全員のHPを回復して、悪いじょうたいも治す。', cast: '頭に、さくらがさいた！花びらがみんなをやさしくつつむ…', anim: 'heal_ring',
  },

  // ───────────── はなかっぱ（筋肉ニンニク）（超級職。はなかっぱを きわめる） ─────────────
  kn_ninniku: {
    name: 'ニンニクパワー', kana: 'にんにくぱわー', kind: 'skill', job: 'kinniku_kappa', mp: 6, target: 'self', role: 'sup',
    effect: { type: 'buff', stat: 'atk', mult: 1.45, dur: 40 },
    desc: 'ニンニクを丸ごと食べる。自分の攻撃力がとても上がる。', cast: '{a}はニンニクを丸ごと食べた！むきむきっ！', anim: 'warcry',
  },
  kn_punch: {
    name: 'マッスルパンチ', kana: 'まっするぱんち', kind: 'skill', job: 'kinniku_kappa', mp: 8, target: 'enemy',
    effect: { type: 'phys', mult: 2.6 },
    desc: 'ムキムキの筋肉で、敵1体をなぐりとばす。', cast: '{a}のマッスルパンチ！', anim: 'punch',
  },
  kn_pose: {
    name: 'マッスルポーズ', kana: 'まっするぽーず', kind: 'skill', job: 'kinniku_kappa', mp: 8, target: 'enemies', role: 'sup',
    effect: { type: 'debuff', stat: 'atk', mult: 0.8, dur: 30, chance: 0.7 },
    desc: '筋肉を見せつけて、敵全体をびびらせる。攻撃力が下がる。', cast: '{a}はポーズを決めた！ムキッ！ムキムキッ！', anim: 'warcry',
  },
  kn_tackle: {
    name: 'ムキムキタックル', kana: 'むきむきたっくる', kind: 'skill', job: 'kinniku_kappa', mp: 16, target: 'enemies',
    effect: { type: 'phys', mult: 1.6 },
    desc: 'ぶあつい筋肉で、敵全体をはねとばす。', cast: '{a}は、ものすごいいきおいでつっこんだ！', anim: 'tackle',
  },
  kn_protein: {
    name: 'プロテイン', kana: 'ぷろていん', kind: 'skill', job: 'kinniku_kappa', mp: 6, target: 'self', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [130, 160], thr: 40 }, { type: 'mpHeal', base: [5, 8] }] },
    desc: 'プロテインを一気に飲む。自分のHPとMPが回復する。', cast: '{a}はプロテインを一気に飲んだ！「筋肉がよろこんでる！」', anim: 'heal2',
  },
  kinniku_kappa_sig: {
    name: 'マッスルあたまの花', kana: 'まっするあたまのはな', kind: 'skill', job: 'kinniku_kappa', mp: 26, target: 'enemy',
    effect: { type: 'phys', mult: 4.0, ignoreDef: 0.3 },
    desc: '頭にニンニクの花がさき、全身の筋肉がかがやく。敵1体にとても大きなダメージ。守りが固い敵にも強い。', cast: '{a}の頭に、ニンニクの花がさいた！マッスル！！', anim: 'kinniku_kappa_sig',
  },

  // ───────────── 木の葉の忍び（超級職。忍者を きわめる） ─────────────
  kh_kunai: {
    name: 'クナイ投げ', kana: 'くないなげ', kind: 'skill', job: 'konoha', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 2.0 },
    desc: 'するどいクナイを、敵1体に投げつける。', cast: '{a}はクナイを投げた！', anim: 'shuriken',
  },
  kh_bunshin: {
    name: '影分身の術', kana: 'かげぶんしんのじゅつ', kind: 'skill', job: 'konoha', mp: 8, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'eva', add: 0.35, dur: 35 }, { type: 'buff', stat: 'atk', mult: 1.3, dur: 35 }] },
    desc: '本物と同じ分身を作る。自分が攻撃をかわしやすくなり、攻撃力も上がる。', cast: '{a}「影分身の術！」ボボボン！', anim: 'buff',
  },
  konoha_sig: {
    name: 'らせん丸', kana: 'らせんがん', kind: 'skill', job: 'konoha', mp: 13, target: 'enemy',
    effect: { type: 'phys', mult: 3.0 },
    desc: '手のひらで回るチャクラの玉を、敵1体にたたきこむ。', cast: '{a}「らせん丸！」', anim: 'konoha_sig',
  },
  kh_sennin: {
    name: 'せん人モード', kana: 'せんにんもーど', kind: 'skill', job: 'konoha', mp: 14, target: 'self', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'def', 'agi'], mult: 1.35, dur: 40 },
    desc: '自然の力を体に取りこむ。自分の攻撃力・守備力・素早さが上がる。', cast: '{a}の目のまわりに、もようがうかんだ…', anim: 'charge',
  },
  kh_senpuu: {
    name: '木の葉旋風', kana: 'このはせんぷう', kind: 'skill', job: 'konoha', mp: 15, target: 'enemies',
    effect: { type: 'phys', mult: 1.45 },
    desc: 'つむじ風のような回しげりで、敵全体をけりとばす。', cast: '{a}の木の葉旋風！', anim: 'kick',
  },
  kh_shuriken: {
    name: 'らせん手裏剣', kana: 'らせんしゅりけん', kind: 'skill', job: 'konoha', mp: 24, target: 'enemies',
    effect: { type: 'phys', mult: 1.8, element: 'wind' },
    desc: '風の力をまとったらせん丸を、手裏剣のように投げる。敵全体に風のダメージ。', cast: '{a}「らせん手裏剣！」', anim: 'wind2',
  },

  // ───────────── 七代目火影（伝説の職業。木の葉の忍び＋ほかの 超級職 1つ） ─────────────
  hg_oodama: {
    name: '大玉らせん丸', kana: 'おおだまらせんがん', kind: 'skill', job: 'hokage', mp: 14, target: 'enemy',
    effect: { type: 'phys', mult: 3.5 },
    desc: '大きな大きならせん丸を、敵1体にたたきこむ。', cast: '{a}「大玉らせん丸！」', anim: 'void',
  },
  hg_kitsune: {
    name: 'きつねの衣', kana: 'きつねのころも', kind: 'skill', job: 'hokage', mp: 16, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['atk', 'def', 'agi'], mult: 1.5, dur: 45 }, { type: 'heal', base: [140, 170], thr: 60 }] },
    desc: '体の中のきつねと力を合わせ、金色の衣をまとう。自分の攻撃力・守備力・素早さがとても上がり、HPも回復する。', cast: '{a}の体が、金色のほのおにつつまれた！', anim: 'charge',
  },
  hg_mamori: {
    name: '火影の守り', kana: 'ほかげのまもり', kind: 'skill', job: 'hokage', mp: 18, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'def', mult: 1.35, dur: 45 }, { type: 'regen', base: [14, 18], thr: 50, dur: 30 }] },
    desc: '里のみんなを守るのが、火影の仕事。仲間全員の守備力が上がり、HPがしばらく少しずつ回復する。', cast: '{a}「みんなはおれが守る！それが火影だ！」', anim: 'guard',
  },
  hg_bijuu: {
    name: 'びじゅう玉', kana: 'びじゅうだま', kind: 'skill', job: 'hokage', mp: 30, target: 'enemies',
    effect: { type: 'magic', element: 'blast', base: [230, 270], thr: 90 },
    desc: 'きつねの力を集めた黒い玉で、敵全体をふきとばす。爆発のダメージ。', cast: '{a}の前に、大きな黒い玉が生まれた…！', anim: 'blast2',
  },
  hg_ishi: {
    name: '火の意志', kana: 'ひのいし', kind: 'skill', job: 'hokage', mp: 20, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'atk', mult: 1.35, dur: 45 }, { type: 'cure', statuses: STATUS_ALL }, { type: 'bondUp', amount: 25 }] },
    desc: '受けつがれる火の意志で、仲間全員の攻撃力を上げて、悪いじょうたいを治す。きずなゲージもふえる。', cast: '{a}「あきらめないど根性！それがおれの忍道だ！」', anim: 'warcry',
  },
  hokage_sig: {
    name: '多重影分身の術', kana: 'たじゅうかげぶんしんのじゅつ', kind: 'skill', job: 'hokage', mp: 36, target: 'enemies',
    effect: { type: 'phys', mult: 0.6, hits: 11, random: true },
    desc: '何百人もの影分身を出して、いっせいにかかる。敵にランダムで11回攻撃する。', cast: '{a}「多重影分身の術！」あたりが分身でうめつくされた！', anim: 'hokage_sig',
  },
};
