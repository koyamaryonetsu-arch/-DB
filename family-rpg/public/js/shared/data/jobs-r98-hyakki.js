// 第98回 K2班: きずなの職業「百きの大将」（docs/plan-kizuna-jobs.md の 3〈1〉・7。実装メモは おなじ 文書の おわり〈9〉）
//   ばくりゅうはの大よう（新しい 系統〈犬夜叉〉の 伝説）＋ かっぱの大王（カッパ → はなかっぱ → 筋肉ニンニク → かっぱの大王 の いちばん 上）
//   ようかいの 仲間を よんで 味方を 強く し、ばくりゅうはで 返した 力が 仲間にも のる（返すと 仲間全員の 攻撃力が 上がる）
//   名前の「鬼」は 小学校で ならわない 字なので かな（百きの大将）
//
// 形は jobs-r98-kuuchou.js と おなじ（1つ 1ファイル。data/kizuna.js の 一覧に 1行）
// 新しい 戦いの しくみは 作らない（親の しくみ: ばくりゅうは〈bakuryu〉・大よう化・せいぎょ〈daiyoukai〉・風の技〈vsBuff〉・
//   かっぱの大王の 運しだいの 技〈random。頭の 花の かわりに、よんだ ようかいで こうかが かわる〉）
//   ばくりゅうはの share だけ、返した 時に 仲間全員の 攻撃力を その 倍に する 数を 1つ 足した（battle-r82a.js の r82aResolve。どの 職業の 技でも 書けば 使える）

export const KIZUNA_HYAKKI = {
  job: {
    id: 'hyakki_taishou', name: '百きの大将', kana: 'ひゃっきのたいしょう', short: '百き', tier: 4, req: ['bakuryuha', 'kappa_king'], family: 'phys', color: '#3a8a4a',
    desc: 'たくさんのようかいをしたがえる、ようかいたちの大将。ばくりゅうはの大ようとかっぱの大王をきわめ、ようかいの技と補助の技をたくさん使った者だけがなれる。仲間のようかいをよんで味方を強くし、敵の大技を返すと、その力が仲間にものる。',
    mods: { hp: 2.1, mp: 1.9, str: 1.85, def: 1.8, agi: 1.5, mag: 0.85, heal: 1.4 },
    weapons: ['sword', 'claw', 'axe', 'none'], shield: false, armor: ['cloth', 'gi', 'heavy'], helm: false,
    perLv: { hp: 1.5, str: 1, def: 0.5 },
    learn: [[1, 'hyk_kaze'], [2, 'hyk_yobu'], [3, 'hyk_harite'], [4, 'hyk_ryurin'], [5, 'hyk_himawari'], [6, 'hyk_daiyou'], [7, 'hyk_osara'], [8, 'hyk_bakuryu'], [10, 'hyakki_taishou_sig']],
  },
  phantom: {
    name: '百きの大将', masters: ['bakuryuha', 'kappa_king'],
    conds: [{ use: ['yokai'], goal: 500, text: 'つめ・風・おにの手の技を500回使う' }, { use: ['support'], goal: 800, text: '補助の技を800回使う' }, { stat: 'dmg', goal: 300000, text: 'あたえたダメージの合計30万' }],
  },
  hint: 'ようかいの力を自分のものにした半ようと、すべてのカッパの上に立つ大王。2人の道をきわめた者は、ようかいたちをしたがえる大将になれるらしい…',

  // 技（MP は 幻の 技なので 0.65倍で 使う）
  abilities: {
    // ── ばくりゅうはの大ようから（風・竜りん・大よう化・ばくりゅうは）──
    hyk_kaze: {
      name: '百きの風のきず', kana: 'ひゃっきのかぜのきず', kind: 'skill', job: 'hyakki_taishou', mp: 14, target: 'enemies',
      effect: { type: 'phys', mult: 1.45, element: 'wind', vsBuff: 1.3 },
      desc: 'ようかいたちのおこす風といっしょに、大きな風のきずを切る。敵全体に風のダメージ。自分を強くしている敵には、もっと効く。', cast: '{a}「風のきず！おめえらも、ふけ！」', anim: 'r82a_wind',
    },
    hyk_ryurin: {
      name: '竜りんの大きば', kana: 'りゅうりんのおおきば', kind: 'skill', job: 'hyakki_taishou', mp: 9, target: 'enemy',
      effect: { type: 'multi', parts: [{ type: 'phys', mult: 2.7 }, { type: 'drainMp', amount: [8, 16] }, { type: 'mpHeal', base: [8, 16], target: 'self' }] },
      desc: '竜のうろこのように光るきばで、敵1体に大きくかみつく。大ダメージ。敵のMPを少しすいとって、自分のMPにする。', cast: '{a}の、竜りんの大きば！', anim: 'r82a_fang',
    },
    hyk_daiyou: {
      name: '大よう化・百き', kana: 'だいようかひゃっき', kind: 'skill', job: 'hyakki_taishou', mp: 14, target: 'self', role: 'sup',
      effect: { type: 'daiyoukai', turns: 3, mult: 1.4 },
      desc: 'ようかいの大将の力を、心でおさえたまま引き出す。3回行動する間、命令を聞いたまま、攻撃力と素早さが上がる。', cast: '{a}の目が金色に光った…でも、心はそのままだ！', anim: 'charge',
    },
    hyk_bakuryu: {
      name: '百きのばくりゅうは', kana: 'ひゃっきのばくりゅうは', kind: 'skill', job: 'hyakki_taishou', mp: 26, target: 'enemies', role: 'dmg',
      effect: { type: 'bakuryu', ret: 1.1, cap: 3.4, swing: 0.9, phys: true, share: 1.25 },
      desc: 'かまえて、敵の大技を待つ。次の自分の番までに、敵の呪文・ブレス・ためた大技、物理の大技を受けると、風にまきこんで敵全体へ返し、その力が仲間全員にのって攻撃力が上がる。受けなかった時は、敵全体に風の一ふり。', cast: '{a}は、どっしりかまえた。「返して、みんなの力にしてやるぜ！」', anim: 'charge',
    },
    // ── かっぱの大王から（はり手・お皿の水・ひまわり・よぶ〈運しだい〉）──
    hyk_harite: {
      name: '大将のはり手', kana: 'たいしょうのはりて', kind: 'skill', job: 'hyakki_taishou', mp: 10, target: 'enemy',
      effect: { type: 'phys', mult: 3.0 },
      desc: '大きな手のひらで、思い切りつっぱる。敵1体に大ダメージ。', cast: '{a}「どすこーい！」', anim: 'r66d_harite',
    },
    hyk_osara: {
      name: 'お皿の大つなみ', kana: 'おさらのおおつなみ', kind: 'skill', job: 'hyakki_taishou', mp: 14, target: 'enemies',
      effect: { type: 'phys', mult: 1.6, element: 'water' },
      desc: '頭のお皿の水に、カッパたちの水も合わせて、大きななみにする。敵全体に水のダメージ。', cast: '{a}とカッパたちは、いっせいに頭をふった！', anim: 'r66d_splash',
    },
    hyk_himawari: {
      name: 'ひまわりの大号令', kana: 'ひまわりのだいごうれい', kind: 'skill', job: 'hyakki_taishou', mp: 20, target: 'allies', role: 'heal',
      effect: { type: 'multi', parts: [{ type: 'heal', base: [95, 120], thr: 50 }, { type: 'buff', stat: 'atk', mult: 1.3, dur: 40 }] },
      desc: '頭に大きなひまわりがさいて、大将の号令がひびく。仲間全員のHPを回復して、攻撃力も上がる。', cast: '{a}の頭に、ひまわりがさいた！「みんな、行くぞ！」', anim: 'heal_ring',
    },
    hyk_yobu: {
      name: '百きをよぶ', kana: 'ひゃっきをよぶ', kind: 'skill', job: 'hyakki_taishou', mp: 12, target: 'allies', role: 'sup', phantomTags: ['yokai'],
      effect: { type: 'random', options: ['hyk_y_kappa', 'hyk_y_inu', 'hyk_y_ishi'] },
      desc: 'ようかいの仲間をよんで、味方を強くする。だれが来るかは運しだい（カッパの子分たち・風の犬ようかい・石がきのようかい）。どのようかいも、仲間全員を強くする。', cast: '{a}「出てこい、ようかいども！」', anim: 'warcry',
    },
    // よばれた ようかい（hyk_yobu の 中み。一覧には 出ない）
    hyk_y_kappa: {
      name: 'カッパの子分たち', kana: 'かっぱのこぶんたち', kind: 'skill', job: 'hyakki_taishou', mp: 0, target: 'allies', role: 'sup', hidden: true,
      effect: { type: 'multi', parts: [{ type: 'buff', stat: 'atk', mult: 1.3, dur: 40 }, { type: 'heal', base: [40, 55], thr: 30 }] },
      desc: '仲間全員の攻撃力が上がり、HPも少し回復する。', cast: 'カッパの子分たちが、わらわら出てきた！「大将、力をかすぞ！」', anim: 'warcry',
    },
    hyk_y_inu: {
      name: '風の犬ようかい', kana: 'かぜのいぬようかい', kind: 'skill', job: 'hyakki_taishou', mp: 0, target: 'allies', role: 'sup', hidden: true,
      effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.25, dur: 40 },
      desc: '仲間全員の攻撃力と素早さが上がる。', cast: '白い犬のようかいが、風といっしょにかけてきた！みんなの体が軽くなる！', anim: 'warcry',
    },
    hyk_y_ishi: {
      name: '石がきのようかい', kana: 'いしがきのようかい', kind: 'skill', job: 'hyakki_taishou', mp: 0, target: 'allies', role: 'sup', hidden: true,
      effect: { type: 'multi', parts: [{ type: 'buff', stat: 'def', mult: 1.35, dur: 45 }, { type: 'regen', base: [14, 18], thr: 50, dur: 30 }] },
      desc: '仲間全員の守備力が上がり、HPがしばらく少しずつ回復する。', cast: '大きな石がきのようかいが、みんなの前にどすんと立った！', anim: 'guard',
    },
    // ── かけ合わせの 技（看板）: ようかいたちが 敵全体へ いっせいに かかり、味方を 強く して、そのまま ばくりゅうはの かまえ ──
    hyakki_taishou_sig: {
      name: '百き夜行・ばくりゅうは', kana: 'ひゃっきやこうばくりゅうは', kind: 'skill', job: 'hyakki_taishou', mp: 44, target: 'enemies', role: 'dmg',
      effect: {
        type: 'multi',
        parts: [
          { type: 'phys', mult: 0.5, hits: 6, random: true, element: 'wind', vsBuff: 1.3 },
          { type: 'buff', target: 'allies', stat: 'atk', mult: 1.25, dur: 40 },
          { type: 'bakuryu', target: 'self', ret: 1.2, cap: 3.6, swing: 1.0, phys: true, share: 1.3 },
        ],
      },
      desc: 'ようかいたちの大行列が、敵にばらばらに6回、風になってかかる。仲間全員の攻撃力が上がり、そのまま、ばくりゅうはのかまえになる。次の自分の番までに敵の大技を受けると、風にまきこんで返し、その力が仲間全員にものる。', cast: '{a}「百き夜行だ！ようかいども、ついてこい！」', anim: 'hyakki_taishou_sig',
    },
  },
  hira: {
    abilities: {
      hi_hyakki: {
        name: 'ようかい大行進', kana: 'ようかいだいこうしん', kind: 'skill', job: 'hyakki_taishou', hirameki: true, mp: 22, target: 'enemies',
        effect: { type: 'phys', mult: 1.75, element: 'wind', vsBuff: 1.3 },
        desc: 'よんだようかいたちといっしょに、敵全体をふみこえて大行進する。風のダメージ。自分を強くしている敵には、もっと効く。', cast: '{a}とようかいたちの、大行進！', anim: 'kizuna_hyakki',
      },
    },
    conds: { hi_hyakki: { from: { hyk_yobu: 8, hyk_kaze: 6 } } },
  },
  tags: ['monster', 'dark', 'wind', 'guard'], // ようかいの 大将・夜の 百き夜行（闇）・風のきず・ばくりゅうはで 仲間を 守る（剣・こぶしの 組は いっぱい なので つけない〈第98回の わりふり〉。闇は 光の 仲間と 合体技「光と闇」）
  say: '「ようかいどもも仲間だ！行くぜ！」',
  trial: '大将は、仲間のぶんまで受けとめる者だ。',
  vehicle: { id: 'hyakki_mikoshi', v: { name: '百きの大みこし', price: 27500, jobs: ['hyakki_taishou'], phantom: true, desc: 'カッパや犬のようかいたちが、わっしょいとかついで走る、赤い大きなみこし。まわりに、青白いおに火がゆれる。' } },
  // 職業の試練の まぼろしの 強さ（tools/sim-trial-tune.mjs 10 0.75 HI=4 を SEED 500・900 で さがした 平均）
  //   K5班: 一の試練は 1.05〜1.12 で 勝ちが 90% → 55% と 大きく かわる ので、sim-trial 20回で 6〜9わりに 入る 1.08 に した
  trialAdj: [1.08, 0.9, 1.05],
  work: 'inuyasha',
};
