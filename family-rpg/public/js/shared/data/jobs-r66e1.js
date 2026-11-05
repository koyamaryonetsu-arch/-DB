// 第66回 E1班: 上級職で 終わっていた 職業の 先（警察官・消防士・人気配信者の 先）。docs/plan-r66-legend.md
//   超級職: 公安ゼロ・ハイパーレスキュー・登録者1000万人 / 伝説の職業: トリプルフェイス・火消しの神・世界一の配信者
// ・jobs.js が JOBS に まぜる（ならびは SUPER_/LEGEND_R66E1_ORDER。JOBS に ある 物だけ 一覧に 入る）
// ・家族が 決めた（2026-11-05）: 超級職は 上級職 2つを きわめる（今の 超級職と 同じ形）。伝説は 超級職を きわめる＋ほかの 超級職 1つ（reqSuper: 1。竜魔人と 同じ）
//   警察官＋忍者 → 公安ゼロ → トリプルフェイス（3つの 顔を もつ 警察官。すがたを かえて 敵を 調べ、弱らせる・ボクシングの 速い 攻撃）
//   消防士＋パラディン → ハイパーレスキュー → 火消しの神（仲間を 助け出す・炎に とても 強い・水で 敵全体を 攻撃）
//   人気配信者＋スーパースター → 登録者1000万人 → 世界一の配信者（見ている 人の 声えんで 強く なる・コメントの 嵐で 敵全体）
// ・技は abilities-r66e1.js・ひらめき技は hirameki-r66e1.js・見た目は client/render/hero-r66e1.js・えんしゅつは client/render/battlefx-r66e1.js
// ・強さ（mods の 合計）: 超級職 8.5〜8.7（今の 超級職の まん中 8.7 くらい）・伝説 9.8〜9.85（今の 伝説の まん中 9.8 くらい）
export const SUPER_R66E1_ORDER = ['koan_zero', 'hyper_rescue', 'top_streamer'];
export const LEGEND_R66E1_ORDER = ['triple_face', 'hikeshi_god', 'world_streamer'];
export const JOBS_R66E1 = {
  // ───────────── 警察官＋忍者 → 公安ゼロ（超級職） ─────────────
  koan_zero: {
    id: 'koan_zero', name: '公安ゼロ', kana: 'こうあんぜろ', short: '公安', tier: 2, req: ['police', 'ninja'], family: 'phys', color: '#4a5468',
    desc: '国の平和をかげから守る、ひみつのチームの警察官。警察官と忍者をきわめるとなれる。すがたを変えて敵を調べて弱らせ、目にもとまらないボクシングで動きを止める。',
    mods: { hp: 1.35, mp: 1.0, str: 1.55, def: 1.2, agi: 1.65, mag: 1.0, heal: 0.75 },
    weapons: ['claw', 'dagger', 'staff', 'sword', 'none'], shield: false, armor: ['cloth', 'gi', 'heavy'], helm: true,
    perLv: { agi: 1, str: 0.5 },
    learn: [[1, 'kz_jab'], [2, 'kz_hensou'], [3, 'kz_kakuho'], [5, 'kz_chase'], [7, 'kz_step'], [10, 'koan_zero_sig']],
  },
  // ───────────── 消防士＋パラディン → ハイパーレスキュー（超級職） ─────────────
  hyper_rescue: {
    id: 'hyper_rescue', name: 'ハイパーレスキュー', kana: 'はいぱーれすきゅー', short: 'レスキュー', tier: 2, req: ['firefighter', 'paladin'], family: 'phys', color: '#e8662a',
    desc: 'どんな大きな事故にもかけつける、とくべつな救助隊。消防士とパラディンをきわめるとなれる。体をはって仲間を守って助け出し、水で敵全体をうつ。炎にとても強い。',
    mods: { hp: 1.55, mp: 1.0, str: 1.35, def: 1.45, agi: 1.0, mag: 0.7, heal: 1.4 },
    weapons: ['axe', 'spear', 'staff', 'sword', 'none'], shield: true, armor: ['cloth', 'heavy'], helm: true,
    perLv: { hp: 1.5, def: 0.5, heal: 0.5 },
    passive: { resist: { fire: 0.5 } },
    learn: [[1, 'hr_jet'], [2, 'hr_kabau'], [3, 'hr_kyushutsu'], [5, 'hr_teate'], [7, 'hr_bouka'], [8, 'hr_suiryu'], [10, 'hyper_rescue_sig']],
  },
  // ───────────── 人気配信者＋スーパースター → 登録者1000万人（超級職） ─────────────
  top_streamer: {
    id: 'top_streamer', name: '登録者1000万人', kana: 'とうろくしゃいっせんまんにん', short: '1000万人', tier: 2, req: ['streamer', 'superstar'], family: 'tech', color: '#e83a8a',
    desc: '登録者が1000万人をこえた、大人気の配信者。人気配信者とスーパースターをきわめるとなれる。見ている人の声えんで強くなり、コメントの嵐で敵全体をおし流す。戦いで手に入るお金もふえる。',
    mods: { hp: 1.15, mp: 1.45, str: 1.0, def: 1.05, agi: 1.4, mag: 1.45, heal: 1.2 },
    weapons: ['staff', 'fan', 'whip', 'none'], shield: true, armor: ['cloth', 'robe'], helm: false,
    perLv: { mag: 1, mp: 0.5, agi: 0.3 },
    passive: { gold: 1.3 },
    learn: [[1, 'ts_live'], [2, 'ts_buzz'], [3, 'ts_ouen'], [5, 'ts_comment'], [7, 'ts_kinen'], [10, 'top_streamer_sig']],
  },

  // ───────────── 公安ゼロ → トリプルフェイス（伝説の職業。公安ゼロ＋ほかの 超級職 1つ） ─────────────
  triple_face: {
    id: 'triple_face', name: 'トリプルフェイス', kana: 'とりぷるふぇいす', short: 'トリプル', tier: 3, req: ['koan_zero'], reqSuper: 1, family: 'phys', color: '#2e3a5a',
    desc: '探てい・なぞの組織の一員・警察官、3つの顔をもつ伝説の警察官。公安ゼロと、ほかの超級職を1つきわめた者だけがなれる。すがたを変えて敵を調べて弱らせ、目にもとまらないボクシングで決める。',
    mods: { hp: 1.55, mp: 1.25, str: 1.75, def: 1.35, agi: 1.85, mag: 1.2, heal: 0.9 },
    weapons: ['claw', 'dagger', 'staff', 'sword', 'none'], shield: false, armor: ['cloth', 'gi', 'heavy'], helm: true,
    perLv: { agi: 1.5, str: 1, hp: 0.5 },
    learn: [[1, 'tf_jab'], [2, 'tf_tantei'], [3, 'tf_nazo'], [5, 'tf_keisatsu'], [7, 'tf_sandwich'], [8, 'tf_drive'], [10, 'triple_face_sig']],
  },
  // ───────────── ハイパーレスキュー → 火消しの神（伝説の職業。ハイパーレスキュー＋ほかの 超級職 1つ） ─────────────
  hikeshi_god: {
    id: 'hikeshi_god', name: '火消しの神', kana: 'ひけしのかみ', short: '火消し神', tier: 3, req: ['hyper_rescue'], reqSuper: 1, family: 'phys', color: '#c8282a',
    desc: 'どんな大火事もしずめる、火消しの神さま。ハイパーレスキューと、ほかの超級職を1つきわめた者だけがなれる。まといをふって仲間をはげまし、たおれた仲間を助け出し、大水で敵全体をおし流す。炎はほとんど効かない。',
    mods: { hp: 1.8, mp: 1.2, str: 1.6, def: 1.65, agi: 1.1, mag: 0.85, heal: 1.55 },
    weapons: ['axe', 'spear', 'staff', 'sword', 'none'], shield: true, armor: ['cloth', 'heavy'], helm: true,
    perLv: { hp: 2, def: 1, heal: 0.5 },
    passive: { resist: { fire: 0.25 } },
    learn: [[1, 'hg_matoi'], [2, 'hg_jet'], [3, 'hg_kyushutsu'], [5, 'hg_tate'], [7, 'hg_iyashi'], [8, 'hg_suiryu'], [10, 'hikeshi_god_sig']],
  },
  // ───────────── 登録者1000万人 → 世界一の配信者（伝説の職業。登録者1000万人＋ほかの 超級職 1つ） ─────────────
  world_streamer: {
    id: 'world_streamer', name: '世界一の配信者', kana: 'せかいいちのはいしんしゃ', short: '世界一', tier: 3, req: ['top_streamer'], reqSuper: 1, family: 'tech', color: '#d8a020',
    desc: '世界中の人が見ている、世界一の配信者。登録者1000万人と、ほかの超級職を1つきわめた者だけがなれる。世界中の声えんで自分も仲間もどんどん強くなり、コメントの大嵐で敵全体をのみこむ。戦いで手に入るお金もふえる。',
    mods: { hp: 1.4, mp: 1.65, str: 1.1, def: 1.2, agi: 1.6, mag: 1.65, heal: 1.25 },
    weapons: ['staff', 'fan', 'whip', 'none'], shield: true, armor: ['cloth', 'robe'], helm: false,
    perLv: { mag: 1.5, mp: 1, agi: 0.5 },
    passive: { gold: 1.4 },
    learn: [[1, 'ws_world'], [2, 'ws_honyaku'], [3, 'ws_ouen'], [5, 'ws_trend'], [7, 'ws_offkai'], [8, 'ws_dokkiri'], [10, 'world_streamer_sig']],
  },
};

// 神殿の うわさ（jobs.js の JOB_HINTS に まぜる。もとの 職業を はじめた 人に だけ、名前を ださずに 聞こえる）
export const HINTS_R66E1 = {
  koan_zero: '警察官と忍者、両方をきわめた者は、国をかげから守るひみつのチームに入れるらしい…',
  hyper_rescue: '消防士とパラディン、両方をきわめた者は、とくべつな救助隊に入れるらしい…',
  top_streamer: '人気配信者とスーパースター、両方をきわめた者は、登録者がもっともっとふえるらしい…',
  triple_face: '公安ゼロと、ほかの超級職を1つきわめた者は、3つの顔をもつ警察官になれるらしい…',
  hikeshi_god: 'ハイパーレスキューと、ほかの超級職を1つきわめた者は、火消しの神さまになれるらしい…',
  world_streamer: '登録者1000万人と、ほかの超級職を1つきわめた者は、世界中の人に見てもらえるらしい…',
};
