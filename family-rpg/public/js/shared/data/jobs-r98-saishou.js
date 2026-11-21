// 第98回 K3班: きずなの職業「国を動かす名さいしょう」（docs/plan-kizuna-jobs.md の 3〈3〉・7。実装メモは おなじ 文書の 10）
//   ほう神の大軍師（新しい 系統〈封神演義〉の 伝説）＋ 総理大臣（地方公務員 → 国家公務員 → キャリア組 → 総理大臣 の いちばん 上）
//   作戦が 仲間全員に 長く きき（ほう神計画が 5回 つづく・作戦は 伝説と おなじ 25%）、会議で 敵の 番を おくらせる
//   （設計の 表の「キャリア組」は 超級職。いちばん 上は 伝説の 総理大臣 なので、そちらに した。docs の 10）
//
// 形は jobs-r98-kuuchou.js と おなじ（1つ 1ファイル。data/kizuna.js の 一覧に 1行）
// 新しい 戦いの しくみは 作らない（親の しくみ: 作戦〈r83aSakusen〉・太極図〈r83aTaikyoku〉・先読みの策〈r83aSaki〉・ほう神計画〈r83aKeikaku〉・
//   行動ゲージ〈atbSet。解散総選挙・サミットと おなじ〉）。作戦の えらべる 物と 効き目は 職業の データ（sakusenSet・sakusenPct。混とんの大軍師と おなじ 書き方）

export const KIZUNA_SAISHOU = {
  job: {
    id: 'kuni_saishou', name: '国を動かす名さいしょう', kana: 'くにをうごかすめいさいしょう', short: 'さいしょう', tier: 4, req: ['hoshin_gunshi', 'souri'], family: 'magic', color: '#2a3a8a',
    desc: '作戦と会議で国を動かす、伝説の大臣。ほう神の大軍師と総理大臣をきわめ、作戦と補助の技をたくさん使った者だけがなれる。立てた作戦は仲間全員に長く効き、ながーい会議で敵の番をおくらせる。',
    mods: { hp: 1.5, mp: 2.2, str: 0.95, def: 1.55, agi: 1.45, mag: 1.7, heal: 1.7 },
    weapons: ['staff', 'whip', 'fan', 'dagger', 'none'], shield: true, armor: ['cloth', 'robe', 'heavy'], helm: true,
    perLv: { mag: 1, mp: 1, agi: 0.5 },
    // 作戦（battle-r83a.js の sakusenSet・sakusenPct が 職業の データを 先に 見る）: 攻め・守り・速攻 を 伝説と おなじ 25% で
    sakusenSet: ['seme', 'mamori', 'sokkou'],
    sakusenPct: 0.25,
    learn: [[1, 'msj_sakusen'], [2, 'msj_enzetsu'], [3, 'msj_ten'], [4, 'msj_kaigi'], [5, 'msj_saki'], [6, 'msj_kyufu'], [7, 'msj_taikyoku'], [8, 'msj_summit'], [10, 'kuni_saishou_sig']],
  },
  phantom: {
    name: '国を動かす名さいしょう', masters: ['hoshin_gunshi', 'souri'],
    conds: [{ use: ['sakusen'], goal: 500, text: '作戦の技を500回使う' }, { use: ['support'], goal: 800, text: '補助の技を800回使う' }, { stat: 'dmg', goal: 100000, text: 'あたえたダメージの合計10万' }],
  },
  hint: '大きな戦いをみちびいた大軍師と、国のいちばん上に立つリーダー。2人の道をきわめて作戦を立てつづけた者は、国を動かせるらしい…',

  // 技（MP は 幻の 技なので 0.65倍で 使う）
  abilities: {
    // ── ほう神の大軍師から（作戦・太極図・先読み・打神べん）──
    msj_sakusen: {
      name: '国の作戦会議', kana: 'くにのさくせんかいぎ', kind: 'skill', job: 'kuni_saishou', mp: 6, target: 'self', role: 'sup',
      effect: { type: 'r83aSakusen' },
      desc: '大臣たちと会議をして、「攻め」「守り」「速攻」から作戦を1つ決める。作戦は、自分がたおれるか、作戦をかえるまで、仲間全員にずっと効く。',
      cast: '{a}「本日の作戦は、これで決まりです！」', anim: 'r83a_plan',
    },
    msj_ten: {
      name: '打神べん・国', kana: 'だしんべんくに', kind: 'skill', job: 'kuni_saishou', mp: 14, target: 'enemy',
      effect: { type: 'magic', element: 'wind', base: [165, 195], thr: 88 },
      desc: '国じゅうの風を集めたむちで、敵1体を打つ。風の大ダメージ。', cast: '{a}「打神べん・国！」', anim: 'r83a_whip',
    },
    msj_saki: {
      name: '先読みの答弁', kana: 'さきよみのとうべん', kind: 'skill', job: 'kuni_saishou', mp: 12, target: 'self', role: 'sup',
      effect: { type: 'r83aSaki' },
      desc: '敵の大技を先に読んで、答えを用意しておく。次の自分の番まで、前ぶれのある大技で、仲間全員が受けるダメージが半分になる。', cast: '{a}「そのご質問は、もう読んでおります」', anim: 'r83a_saki',
    },
    msj_taikyoku: {
      name: 'ふうじの太極図', kana: 'ふうじのたいきょくず', kind: 'skill', job: 'kuni_saishou', mp: 22, target: 'enemies', role: 'sup',
      effect: { type: 'r83aTaikyoku', turns: 4 },
      desc: '白と黒の太極図を、国の大きさに広げる。敵全体の強くなっていた力を消して、長いあいだ強化できなくする。仲間全員の弱くなっていた力と状態異常も元にもどす。', cast: '{a}「太極図よ、国じゅうを元にもどせ！」', anim: 'taikobo_sig',
    },
    // ── 総理大臣から（演説・会議・おくりもの・サミット）──
    msj_enzetsu: {
      name: '国をひとつにする演説', kana: 'くにをひとつにするえんぜつ', kind: 'skill', job: 'kuni_saishou', mp: 12, target: 'allies', role: 'sup',
      effect: { type: 'buff', stats: ['atk', 'mag'], mult: 1.35, dur: 45 },
      desc: 'みんなの前で、国の進む道を力強く話す。仲間全員の攻撃力と魔力が上がる。', cast: '{a}「みなさん、心をひとつにしましょう！」', anim: 'r66c_speech',
    },
    msj_kaigi: {
      name: 'ながーい会議', kana: 'ながーいかいぎ', kind: 'skill', job: 'kuni_saishou', mp: 18, target: 'enemies',
      effect: {
        type: 'multi',
        parts: [
          { type: 'magic', base: [90, 110], thr: 60 },
          { type: 'atbSet', sub: 45, chance: 0.6, msg: '{t}は、会議が長すぎて、番がおくれた！', failMsg: '{t}は、会議をこっそりぬけ出した！' },
        ],
      },
      desc: '敵を会議によんで、とても長い話をする。敵全体にダメージ。会議が長すぎて、番がおくれる敵もいる（ボスには効きにくい）。', cast: '{a}「えー、では、会議を始めます。まず一つ目の議題は…」', anim: 'debuff',
    },
    msj_kyufu: {
      name: '国からのおくりもの', kana: 'くにからのおくりもの', kind: 'skill', job: 'kuni_saishou', mp: 22, target: 'allies', role: 'heal',
      effect: { type: 'multi', parts: [{ type: 'heal', base: [110, 135], thr: 55 }, { type: 'mpHeal', base: [6, 10] }] },
      desc: '国から、仲間全員におくりものをとどける。仲間全員のHPとMPが回復する。', cast: '{a}「がんばるみなさんに、国からのおくりものです！」', anim: 'coins',
    },
    msj_summit: {
      name: '大サミット', kana: 'だいさみっと', kind: 'skill', job: 'kuni_saishou', mp: 20, target: 'allies', role: 'sup',
      effect: {
        type: 'multi',
        parts: [
          { type: 'atbSet', add: 40, msg: '{t}は、すぐに動けそうだ！' },
          { type: 'buff', stat: 'def', mult: 1.3, dur: 40 },
        ],
      },
      desc: '世界じゅうのリーダーと、かたく手を組む。仲間全員の行動ゲージがたまり、守備力も上がる。', cast: '{a}は、世界のリーダーたちと、がっちりあく手した！', anim: 'r66c_speech',
    },
    // ── かけ合わせの 技（看板）: 大会議で 敵の 番を おくらせ、ほう神計画で 作戦の 効き目を 長く 2倍に、仲間は すぐ 動ける ──
    kuni_saishou_sig: {
      name: '国を動かす大会議', kana: 'くにをうごかすだいかいぎ', kind: 'skill', job: 'kuni_saishou', mp: 44, target: 'enemies', role: 'dmg',
      effect: {
        type: 'multi',
        parts: [
          { type: 'magic', element: 'light', base: [215, 250], thr: 100 },
          { type: 'atbSet', sub: 50, chance: 0.7, msg: '{t}は、大会議にまきこまれて、番がおくれた！', failMsg: '{t}は、大会議をぬけ出した！' },
          { type: 'r83aKeikaku', target: 'allies', left: 5 },
        ],
      },
      desc: '国じゅうの大臣と軍師を集めた、大会議をひらく。敵全体に光の大ダメージ。番がおくれる敵もいる。しばらくのあいだ作戦の効き目が2倍になり、仲間全員がすぐに動ける。作戦がないときは、攻めの作戦から始める。',
      cast: '{a}「これより、国を動かす大会議を始めます！」', anim: 'kuni_saishou_sig',
    },
  },
  hira: {
    abilities: {
      hi_tenka_gorei: {
        name: '天下の大号令', kana: 'てんかのだいごうれい', kind: 'skill', job: 'kuni_saishou', hirameki: true, mp: 24, target: 'enemies',
        effect: { type: 'multi', parts: [{ type: 'magic', element: 'wind', base: [150, 175], thr: 85 }, { type: 'atbSet', target: 'allies', add: 25, msg: '{t}は、号令でやる気が出た！' }] },
        desc: '国じゅうにとどく大号令で、大風を起こす。敵全体に風のダメージ。仲間全員の行動ゲージも少したまる。', cast: '{a}「全員、前へ！」号令が、大風になった！', anim: 'kizuna_gorei',
      },
    },
    conds: { hi_tenka_gorei: { from: { msj_ten: 10, msj_kaigi: 6 } } },
  },
  tags: ['work', 'master', 'wind', 'magic'], // 国の 仕事・みんなを ひきいる・打神べんの 風・軍師の ふしぎな 力（炎・剣・こぶしの 組は いっぱい なので つけない）
  say: '「会議で決めて、国を動かします！」',
  trial: '作戦は、みんなのために長く使え。',
  vehicle: { id: 'kin_kaba', v: { name: '金の空飛ぶ大カバ', price: 27500, jobs: ['kuni_saishou'], phantom: true, desc: '金のふさかざりをつけた、大きな空飛ぶカバ。せなかに会議のつくえと、作戦の旗がのっている。' } },
  // 職業の試練の まぼろしの 強さ（tools/sim-trial-tune.mjs 10 0.75 HI=4 を SEED 500・900 で さがした 平均）
  trialAdj: [1, 1, 1],
  work: 'houshin',
};
