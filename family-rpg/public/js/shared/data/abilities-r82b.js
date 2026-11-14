// 第82回 B班: YAIBA の 系統の 技（サムライ小ぞう → 雷神けんの剣士 → ヤイバ → 竜神けんのサムライ。docs/plan-r82-jobs-b.md）
//
// きまりは abilities-jobs8.js（るろうに剣士の 系統）と おなじ
//  ・Lv1〜10 で 6こ（Lv10 が 看板の 技 <職業の id>_sig。いちばん MPを 使う）
//  ・自分に かける 補助は 段の 上限まで（基本職 1.25倍・上級職 1.3倍・超級職と 伝説 1.3倍〈2だんかいで 1.6倍〉）
// この 系統だけの しくみ（shared/battle-r82b.js）
//  ・effect.yb … この 系統の 剣の 技の しるし
//      'tama'   … 今の 玉の 属性に なる（玉が ない 人〈サムライ小ぞう〉は 属性なし）
//      'fix'    … 属性は 技の まま（雷光斬り など。名前に 属性が ある 技）
//      'strike' … 玉の 数だけ 1回ずつ（四つ玉斬り・七つ玉。balls の 属性で 1回ずつ。弱点に 当たると weakBonus 倍）
//    どれも 金色の玉・きょだい化の 間は 敵全体に とどく
//  ・effect.thunderMult … 味方の 雷の 天気の とき、ぜんぶで この 倍（ふつうの 雷の 技は 天気の しくみで 1.3倍。雷神のいかりは 1.5倍）
//  ・type 'tamagae' … 玉を かえる（cmd.tama。すばやい: 次の 番が すぐ 来る）
//  ・type 'kyodai'  … 金色の玉・きょだい化（left 回 行動する 間）
//  ・type 'raiGuard' … 雷神の守り（left 回 行動する 間、雷の 攻撃を 受けると 回復）
// えんしゅつ（anim）は client/render/battlefx-r82b.js（玉の 色で 剣の 光が かわる）

export const YB_TAMAGAE_ATB = 80;

export const R82B_ABILITIES = {
  // ───────────── サムライ小ぞう（基本職） ─────────────
  kk_men: {
    name: 'めん！', kana: 'めん', kind: 'skill', job: 'samurai_kid', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.6, yb: 'tama' },
    desc: '「めーん！」と大きな声で、敵1体の頭を思いきり打つ。刀に玉があれば、その玉の属性になる。', cast: '{a}「めーーん！」', anim: 'r82b_slash',
  },
  kk_harahetta: {
    name: 'ハラへった', kana: 'はらへった', kind: 'skill', job: 'samurai_kid', mp: 3, target: 'self', role: 'heal',
    effect: { type: 'heal', base: [38, 48], thr: 20 },
    desc: 'おなかがすいて力が出ない。大きなおにぎりをほおばって、自分のHPを回復する。', cast: '{a}「ハラへった〜！」大きなおにぎりをほおばった！', anim: 'heal1',
  },
  kk_kazaguruma: {
    name: '風車', kana: 'かざぐるま', kind: 'skill', job: 'samurai_kid', mp: 5, target: 'group',
    effect: { type: 'phys', mult: 1.15, yb: 'tama' },
    desc: '刀をもったまま、くるくる回って、同じ種類の敵をまとめて切る。刀に玉があれば、その玉の属性になる。', cast: '{a}は、くるくる回った！風車！', anim: 'r82b_whirl',
  },
  kk_mushaburui: {
    name: 'むしゃぶるい', kana: 'むしゃぶるい', kind: 'skill', job: 'samurai_kid', mp: 4, target: 'self', role: 'sup',
    effect: { type: 'buff', stat: 'atk', mult: 1.25, dur: 30 },
    desc: '強い敵を前に、体がぶるぶるっとふるえる。こわいのではなく、わくわくしている。自分の攻撃力が上がる。', cast: '{a}は、むしゃぶるいした！「わくわくしてきたぞ！」', anim: 'charge',
  },
  kk_kabuto: {
    name: '大かぶと割り', kana: 'おおかぶとわり', kind: 'skill', job: 'samurai_kid', mp: 6, target: 'enemy',
    effect: { type: 'phys', mult: 1.4, yb: 'tama', debuff: { stat: 'def', mult: 0.75, dur: 30, chance: 0.7 } },
    desc: '高くとび上がって、敵1体を上から打つ。敵の守備力が下がることがある。刀に玉があれば、その玉の属性になる。', cast: '{a}は高くとび上がった！大かぶと割り！', anim: 'r82b_slash',
  },
  samurai_kid_sig: {
    name: '天下一の素ぶり', kana: 'てんかいちのすぶり', kind: 'skill', job: 'samurai_kid', mp: 10, target: 'enemy',
    effect: { type: 'phys', mult: 0.9, hits: 3, yb: 'tama' },
    desc: '毎日1000回の素ぶりでみがいた太刀すじで、敵1体を3回切る。刀に玉があれば、その玉の属性になる。', cast: '{a}「天下一のサムライの、素ぶりを見ろ！」', anim: 'samurai_kid_sig',
  },

  // ───────────── 雷神けんの剣士（上級職。サムライ小ぞうを きわめる。雷の玉だけ） ─────────────
  rj_raikou: {
    name: '雷光斬り', kana: 'らいこうぎり', kind: 'skill', job: 'raijin_sword', mp: 4, target: 'enemy',
    effect: { type: 'phys', mult: 1.9, element: 'bolt', yb: 'fix' },
    desc: '雷の光のような速さで、敵1体を切る。雷のダメージ。', cast: '{a}の雷光斬り！', anim: 'r82b_bolt',
  },
  rj_tame: {
    name: '雷の力をためる', kana: 'かみなりのちからをためる', kind: 'skill', job: 'raijin_sword', mp: 4, target: 'self', role: 'sup',
    effect: { type: 'charge', mult: 2.0 },
    desc: '刀に、ぱちぱちと雷の力をためる。次の攻撃の威力が2倍になる。', cast: '{a}の刀に、ぱちぱちと雷がたまっていく…！', anim: 'charge',
  },
  rj_inazuma: {
    name: 'いなずま風車', kana: 'いなずまかざぐるま', kind: 'skill', job: 'raijin_sword', mp: 7, target: 'group',
    effect: { type: 'phys', mult: 1.35, element: 'bolt', yb: 'fix' },
    desc: 'いなずまをまとって、くるくる回る。同じ種類の敵をまとめて切る。雷のダメージ。', cast: '{a}は、いなずまをまとって回った！', anim: 'r82b_whirl',
  },
  rj_shibire: {
    name: 'しびれ斬り', kana: 'しびれぎり', kind: 'skill', job: 'raijin_sword', mp: 7, target: 'enemy',
    effect: { type: 'phys', mult: 1.6, element: 'bolt', yb: 'fix', status: { status: 'paralyze', chance: 0.3, turns: [1, 2] } },
    desc: 'びりびりする刀で、敵1体を切る。雷のダメージ。ときどき、敵の体がしびれて動けなくなる。', cast: '{a}のしびれ斬り！びりびりっ！', anim: 'r82b_bolt',
  },
  rj_mamori: {
    name: '雷神の守り', kana: 'らいじんのまもり', kind: 'skill', job: 'raijin_sword', mp: 6, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'def', mult: 1.3, dur: 30 }, { type: 'raiGuard', left: 4 }] },
    desc: '雷神けんをかまえて、雷の力で身を守る。自分の守備力が上がり、しばらくのあいだ、雷の攻撃を受けるとHPが回復する。', cast: '{a}は、雷神けんをかまえた！', anim: 'guard',
  },
  raijin_sword_sig: {
    name: 'かみなり斬り', kana: 'かみなりぎり', kind: 'skill', job: 'raijin_sword', mp: 16, target: 'enemy',
    effect: { type: 'phys', mult: 3.2, element: 'bolt', critBonus: 0.05, yb: 'fix' },
    desc: '空のかみなりを刀に集めて、敵1体に打ち下ろす。雷の大ダメージ。雷の天気だと、もっと強い。', cast: '{a}「落ちろ、かみなり！」かみなり斬り！', anim: 'raijin_sword_sig',
  },

  // ───────────── ヤイバ（超級職。雷神けんの剣士を きわめる。雷・火・水・氷の玉） ─────────────
  yb_tamagae: {
    name: '玉がえ', kana: 'たまがえ', kind: 'skill', job: 'yaiba', mp: 2, target: 'self', role: 'sup',
    effect: { type: 'tamagae' },
    desc: '刀にはめる玉を選んで、はめかえる。この系統の剣の技が、その玉の属性になる。すばやいので、すぐに次の番が来る。', cast: '{a}「玉がえ！」', anim: 'r82b_tamagae',
  },
  yb_zokusei: {
    name: '属性斬り', kana: 'ぞくせいぎり', kind: 'skill', job: 'yaiba', mp: 6, target: 'enemy',
    effect: { type: 'phys', mult: 2.4, yb: 'tama' },
    desc: '今の玉の力をこめて、敵1体を強く切る。今の玉の属性のダメージ。', cast: '{a}の属性斬り！', anim: 'r82b_slash',
  },
  yb_senpu: {
    name: 'せんぷう剣', kana: 'せんぷうけん', kind: 'skill', job: 'yaiba', mp: 12, target: 'enemies',
    effect: { type: 'phys', mult: 1.4, yb: 'tama' },
    desc: '刀をふり回して、今の玉の力のつむじ風を起こす。敵全体に、今の玉の属性のダメージ。', cast: '{a}のせんぷう剣！', anim: 'r82b_whirl',
  },
  yb_juji: {
    name: '十字斬り', kana: 'じゅうじぎり', kind: 'skill', job: 'yaiba', mp: 9, target: 'enemy',
    effect: { type: 'phys', mult: 1.25, hits: 2, critBonus: 0.15, yb: 'tama' },
    desc: 'たてと横に、すばやく十字に切る。敵1体に2回。会心が出やすい。今の玉の属性になる。', cast: '{a}の十字斬り！', anim: 'r82b_cross',
  },
  yb_kaminarigumo: {
    name: 'かみなり雲よ来い', kana: 'かみなりぐもよこい', kind: 'skill', job: 'yaiba', mp: 10, target: 'self', role: 'sup',
    effect: { type: 'weather', kind: 'thunder', turns: 12 },
    desc: '刀を空につき上げて、かみなり雲をよぶ。天気が雷になって、味方の雷と風の力が強くなる。', cast: '{a}は、刀を空につき上げた！「かみなり雲よ、来い！」', anim: 'r82b_cloud',
  },
  yaiba_sig: {
    name: '四つ玉斬り', kana: 'よつだまぎり', kind: 'skill', job: 'yaiba', mp: 26, target: 'enemy',
    effect: { type: 'phys', mult: 0.85, hits: 4, yb: 'strike', balls: ['bolt', 'fire', 'water', 'ice'], weakBonus: 1.2 },
    desc: '雷・火・水・氷の玉を、つぎつぎにはめかえて、敵1体を4回切る。弱点の玉で切ると、もっと大きなダメージ。', cast: '{a}「4つの玉の力を見ろ！」四つ玉斬り！', anim: 'yaiba_sig',
  },

  // ───────────── 竜神けんのサムライ（伝説。ヤイバ ＋ ほかの 超級職 1つ。＋風・金・竜神の玉） ─────────────
  ry_tachi: {
    name: '竜神の太刀', kana: 'りゅうじんのたち', kind: 'skill', job: 'ryujin_samurai', mp: 12, target: 'enemy',
    effect: { type: 'phys', mult: 3.3, element: 'light', yb: 'fix' },
    desc: '竜神けんにやどる、竜神の光で切る。敵1体に光の大ダメージ。', cast: '{a}の竜神の太刀！', anim: 'r82b_slash',
  },
  ry_kyodai: {
    name: '金色の玉・きょだい化', kana: 'こんじきのたまきょだいか', kind: 'skill', job: 'ryujin_samurai', mp: 16, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['atk', 'def'], mult: 1.3, dur: 40 }, { type: 'kyodai', left: 4 }] },
    desc: '金色の玉の力で、体がぐんぐん大きくなる。自分の攻撃力と守備力が上がり、しばらくのあいだ、この系統の剣の技が敵全体にとどく。', cast: '{a}は、金色の玉をはめた！体がぐんぐん大きくなる！', anim: 'r82b_kyodai',
  },
  ry_tatsumaki: {
    name: '風の玉・たつまき斬り', kana: 'かぜのたまたつまきぎり', kind: 'skill', job: 'ryujin_samurai', mp: 18, target: 'enemies',
    effect: { type: 'phys', mult: 1.6, element: 'wind', yb: 'fix', debuff: { stat: 'agi', mult: 0.8, dur: 30, chance: 0.6 } },
    desc: '風の玉の力で、大きなたつまきを起こす。敵全体に風のダメージ。敵の素早さが下がることがある。', cast: '{a}の風の玉・たつまき斬り！', anim: 'r82b_whirl',
  },
  ry_tamashii: {
    name: 'サムライだましい', kana: 'さむらいだましい', kind: 'skill', job: 'ryujin_samurai', mp: 14, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['atk', 'agi'], mult: 1.3, dur: 40 }, { type: 'heal', base: [70, 90], thr: 40 }] },
    desc: '「サムライは、あきらめない！」心をもやして立ち上がる。自分の攻撃力と素早さが上がり、HPも少し回復する。', cast: '{a}「サムライは、ぜったいにあきらめない！」', anim: 'charge',
  },
  ry_ikari: {
    name: '雷神のいかり', kana: 'らいじんのいかり', kind: 'skill', job: 'ryujin_samurai', mp: 22, target: 'enemies',
    effect: { type: 'phys', mult: 1.65, element: 'bolt', yb: 'fix', thunderMult: 1.5 },
    desc: '雷神のいかりが、敵全体に落ちる。雷のダメージ。味方の雷の天気だと、1.5倍になる。', cast: '{a}「雷神よ、いかりの雷を！」', anim: 'r82b_bolt',
  },
  ryujin_samurai_sig: {
    name: '竜神けん・七つ玉', kana: 'りゅうじんけんななつだま', kind: 'skill', job: 'ryujin_samurai', mp: 38, target: 'enemy',
    effect: { type: 'phys', mult: 0.62, hits: 7, yb: 'strike', balls: ['bolt', 'fire', 'water', 'ice', 'wind', 'blast', 'light'], weakBonus: 1.25 },
    desc: '7つの玉の力をすべて竜神けんにこめて、敵1体を7回切る。弱点のある敵なら、どれかの玉がかならず弱点に当たる。弱点の玉で切ると、もっと大きなダメージ。', cast: '{a}「7つの玉よ、力をかせ！」竜神けん・七つ玉！', anim: 'ryujin_samurai_sig',
  },
};
