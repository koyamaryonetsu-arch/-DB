// 第98回 K4班: きずなの職業「おてんき格闘流の師はん」（docs/plan-kizuna-jobs.md の 3〈6〉・7。実装メモは おなじ 文書の おわり）
//   飛竜しょう天はの達人（新しい 系統〈らんま1/2〉の 伝説）＋ 天候をあやつる者（気象予報士 → お天気キャスター → 天候をあやつる者 の いちばん 上。
//   この 流れには 伝説が ない ＝ 超級職が いちばん 上〈その 上は 幻の 天候の神 だけ〉）
//   天気を 雨に すると、自分で 水の すがたに かわる（今までは 敵や 道具が 雨に した 時だけ）。晴れに すると お湯の すがたに もどる
//
// 形は jobs-r98-kuuchou.js と おなじ（1つ 1ファイル。data/kizuna.js の 一覧に 1行）
// 新しい 戦いの しくみは 作らない（親の しくみ: 水と お湯の すがた〈battle-r84b.js。formPct で 伝説と おなじ 25%。
//   雨で 水・晴れで お湯 に かわるのも 今 ある r84bTurnStart〉・飛竜しょう天は〈r84bHiryu〉・心の水〈r84bKokoro〉・
//   天気〈battle-weather.js の weather。雨で 水の 力・晴れで 炎の 力が 上がる〉）
export const KIZUNA_OTENKI = {
  job: {
    id: 'otenki_shihan', name: 'おてんき格闘流の師はん', kana: 'おてんきかくとうりゅうのしはん', short: 'おてんき', tier: 4, req: ['hiryu_master', 'tenkou_tsukai'], family: 'phys', color: '#2a8ad8',
    desc: '天気をあやつる格闘流の師はん。雨をよぶと自分で水のすがたに、晴れをよぶとお湯のすがたにもどる。雨の中では、水のこぶしがもっと強くなる。飛竜しょう天はの達人と天候をあやつる者をきわめ、素手の技と、雨と晴れの技をたくさん使った者だけがなれる。',
    mods: { hp: 1.8, mp: 1.6, str: 1.9, def: 1.35, agi: 1.95, mag: 1.0, heal: 1.4 },
    weapons: ['claw', 'none'], shield: false, armor: ['cloth', 'gi'], helm: false,
    perLv: { str: 1, agi: 1.5, mp: 0.5 },
    // formPct … 水と お湯の すがたの 効き目（battle-r84b.js の formPct が 見る。伝説と おなじ 25%。幻だからと 上げない）
    formPct: 0.25,
    learn: [[1, 'ot_kaburu'], [2, 'ot_niwaka'], [3, 'ot_amatsubu'], [4, 'ot_hare'], [5, 'ot_kokoro'], [6, 'ot_inazuma'], [7, 'ot_hiryu'], [8, 'ot_taifuu'], [10, 'otenki_shihan_sig']],
  },
  phantom: {
    name: 'おてんき格闘流の師はん', masters: ['hiryu_master', 'tenkou_tsukai'],
    conds: [{ use: ['fist'], goal: 500, text: '素手の技を500回使う' }, { use: ['rain'], goal: 200, text: '雨の技を200回使う' }, { use: ['sun'], goal: 200, text: '晴れの技を200回使う' }],
  },
  hint: '竜巻をあやつる格闘家と、空の天気をあやつる者。2人の道をきわめた者は、雨と晴れで、自分のすがたをかえられるらしい…',

  // 技（MP は 幻の 技なので 0.65倍で 使う）
  abilities: {
    // ── 飛竜しょう天はの達人から（すがた・手数・心の水・カウンター）──
    ot_kaburu: {
      name: 'じょうろとやかん', kana: 'じょうろとやかん', kind: 'skill', job: 'otenki_shihan', mp: 2, target: 'self', role: 'sup',
      effect: { type: 'r84bForm' },
      desc: 'じょうろの水をかぶると、素早くよけやすい水のすがたに。やかんのお湯をかぶると、力と守りの強いお湯のすがたになる。すぐに次の番が来る。', cast: '{a}は、頭からざぶんとかぶった！', anim: 'r84b_form',
    },
    ot_amatsubu: {
      name: '雨つぶけん', kana: 'あまつぶけん', kind: 'skill', job: 'otenki_shihan', mp: 10, target: 'enemy',
      effect: { type: 'phys', mult: 0.42, hits: 8, element: 'water', r84b: 'te' },
      desc: '雨つぶのような速さで、敵1体を8回なぐる。水のダメージ。水のすがたなら、もっと手数がふえる。雨の中では、もっと強い。', cast: '{a}の雨つぶけん！ぱらぱらぱらっ！', anim: 'r84b_amaguri',
    },
    ot_kokoro: {
      name: '心のお天気', kana: 'こころのおてんき', kind: 'skill', job: 'otenki_shihan', mp: 10, target: 'self', role: 'sup',
      effect: { type: 'r84bKokoro', left: 3 },
      desc: '心の中を、雨のち晴れにする。自分が3回動くまで、水のすがたとお湯のすがたの、両方のよい所を持つ。', cast: '{a}は、目をとじた…心の空に、にじがかかる。', anim: 'r84b_kokoro',
    },
    ot_hiryu: {
      name: 'お天気しょう天は', kana: 'おてんきしょうてんは', kind: 'skill', job: 'otenki_shihan', mp: 20, target: 'enemies', role: 'dmg',
      effect: { type: 'r84bHiryu', mult: 2.2, vsBuff: 0.25, water: 1.4, swing: 0.9 },
      desc: 'うずをまくようにかまえて、次の自分の番まで待つ。敵の攻撃を受けると、大きな竜巻で敵全体にやり返す。敵が強くなっているほど、水のすがたなら、もっと強い。', cast: '{a}は、空の風を集めて、かまえた…！', anim: 'ranma_sig',
    },
    // ── 天候をあやつる者から（雨・晴れ・かみなり・台風）──
    ot_niwaka: {
      name: 'にわか雨よほう', kana: 'にわかあめよほう', kind: 'skill', job: 'otenki_shihan', mp: 14, target: 'allies', role: 'heal', weather: 'rain',
      effect: { type: 'multi', parts: [{ type: 'weather', kind: 'rain', turns: 8 }, { type: 'heal', base: [50, 62], thr: 40 }] },
      desc: '「このあと、にわか雨です！」空を雨にかえる。雨の間は水の力が強くなり、自分は水のすがたになる。仲間全員のHPも少し回復する。', cast: '{a}「このあと、にわか雨です！」', anim: 'heal2',
    },
    ot_hare: {
      name: '晴れのち晴れよほう', kana: 'はれのちはれよほう', kind: 'skill', job: 'otenki_shihan', mp: 14, target: 'allies', role: 'sup', weather: 'sun',
      effect: { type: 'multi', parts: [{ type: 'weather', kind: 'sun', turns: 8 }, { type: 'buff', stat: 'atk', mult: 1.25, dur: 40 }] },
      desc: '「あしたも、あさっても晴れ！」空を晴れにかえる。晴れの間は炎の力が強くなり、自分はお湯のすがたにもどる。仲間全員の攻撃力も上がる。', cast: '{a}「あしたも、あさっても晴れです！」', anim: 'buff',
    },
    ot_inazuma: {
      name: 'いなずまかかと落とし', kana: 'いなずまかかとおとし', kind: 'skill', job: 'otenki_shihan', mp: 12, target: 'enemy', weather: 'thunder',
      effect: { type: 'phys', mult: 3.4, element: 'bolt' },
      desc: 'かみなりといっしょに、高くふり上げたかかとを落とす。敵1体に雷の大ダメージ。', cast: '{a}のいなずまかかと落とし！ゴロゴロ…ドーン！', anim: 'r84b_kick',
    },
    ot_taifuu: {
      name: '台風のまわしげり', kana: 'たいふうのまわしげり', kind: 'skill', job: 'otenki_shihan', mp: 16, target: 'enemies',
      effect: {
        type: 'multi',
        parts: [
          { type: 'phys', mult: 1.4, element: 'wind' },
          { type: 'atbSet', sub: 30, chance: 0.25, msg: '{t}は、風にとばされて目を回した！', failMsg: '{t}は、ふみとどまった！' },
        ],
      },
      desc: '台風のように、ぐるぐる回ってけとばす。敵全体に風のダメージ。風にとばされて止まる敵もいる。', cast: '{a}「台風、上陸します！」ぐるぐるぐるっ！', anim: 'wind2',
    },
    // ── かけ合わせの 技（看板）: 雨を よんで（自分は 水の すがたへ）、竜巻 ＋ 雨つぶの 水の 追いうち ──
    otenki_shihan_sig: {
      name: '雨ふり飛竜しょう天は', kana: 'あめふりひりゅうしょうてんは', kind: 'skill', job: 'otenki_shihan', mp: 36, target: 'enemies', role: 'dmg', weather: 'rain',
      effect: {
        type: 'multi',
        parts: [
          { type: 'weather', kind: 'rain', target: 'self', turns: 8 },
          { type: 'phys', mult: 2.1, element: 'wind', vsBuff84: 0.2 },
          { type: 'phys', mult: 0.6, hits: 4, random: true, element: 'water' },
        ],
      },
      desc: '空を雨にかえて、大きな竜巻を落とす。敵全体に風のダメージ。敵が強くなっているほど強い。さらに、雨つぶの竜巻が、敵にランダムで4回、水の追いうち。雨の間、自分は水のすがたになる。', cast: '{a}「本日の天気は…雨のち、竜巻です！」', anim: 'otenki_shihan_sig',
    },
  },
  hira: {
    abilities: {
      hi_niji: {
        name: '雨あがりのにじキック', kana: 'あめあがりのにじきっく', kind: 'skill', job: 'otenki_shihan', hirameki: true, mp: 20, target: 'enemy', weather: 'sun',
        effect: { type: 'multi', parts: [{ type: 'phys', mult: 2.4, element: 'light' }, { type: 'phys', mult: 1.0, element: 'water' }] },
        desc: '雨あがりの空に、にじをかけるようなけり。敵1体に光と水の、2つのダメージ。', cast: '{a}「雨あがりには…にじキック！」', anim: 'kizuna_niji',
      },
    },
    conds: { hi_niji: { from: { ot_amatsubu: 10, ot_niwaka: 6 } } },
  },
  tags: ['henshin', 'wind', 'ice', 'bolt'], // 水と お湯で すがたを かえる・竜巻と 台風・雨〈水〉・かみなり（剣・こぶしの 組は いっぱい〈test/dual-r31〉なので つけない。炎も つけない）
  say: '「本日の天気は、雨のち竜巻！」',
  trial: '空も心も、自分でかえてみせよ。',
  vehicle: { id: 'panda_amagumo', v: { name: 'パンダの雨雲', price: 27000, jobs: ['otenki_shihan'], phantom: true, desc: '雨雲にのった、大きなパンダ。かさをさして、空の上をのっしのっしと歩く。雨のあとには、にじが出る。' } },
  // 職業の試練の まぼろしの 強さ（tools/sim-trial-tune.mjs 10 0.75 HI=4 を SEED 500・900 で さがした 平均）
  trialAdj: [1.2, 1.2, 1.4],
  work: 'ranma',
};
