// 2026年10月（第43回）の 新しい 職業の 技: 配管工 → ひげおやじ → マリオ（女の子は ももの姫 → おてんば姫 → ピーチ）
//   docs/plan-r43-jobs.md。職業の データは 女の子の 名前、男の子は masc で 名前だけ かわる（雪の女王／雪の王 と おなじ）
//
// 家族の ねがい「配管工 → ひげおやじ → マリオ。女の子は 桃の姫 → おてんば姫 → ピーチ」
// ・強さの むきは 力と すばやさ（ジャンプ・ふみつけ）。技の 名前は 男女 おなじ
// ・基本職: ジャンプふみつけ・スパナで配管なおし（仲間の 回復 小）・土管ワープ（にげる）
// ・上級職: ファイアボール・スーパーキノコ（自分の 攻撃力と HP）・こうらなげ（敵全体）
// ・超級職: スター（しばらく むてきに ちかい 守り）・ヒップドロップ（大ダメージ・ときどき 気ぜつ）・看板の 技 スーパースターラッシュ（敵全体に 連続ジャンプ）
// ・名前の 字: 「桃」は 習わない 字なので「もも」。姫・竜は ゲームで 使って よい 字
// きまりは abilities-jobs9.js・abilities-r41b.js と おなじ
//  ・攻撃技は 基本職 3つ いじょう、上級職・超級職 2つ いじょう
//  ・みんなに かける 補助は ランクの 上限まで（基本職 1.15倍・上級職 1.25倍・超級職 1.4倍）。1人に かける 補助は 基本職 1.3倍・上級職 1.4倍まで
//  ・Lv10 の 技が いちばん MPを 使う
//  ・看板の 技は <職業の id>_sig（anim も 同じ 名前。エフェクトは client/render/battlefx-r43j.js）

export const R43J_ABILITIES = {
  // ───────────── 配管工／ももの姫（基本職） ─────────────
  pl_jump: {
    name: 'ジャンプふみつけ', kana: 'じゃんぷふみつけ', kind: 'skill', job: 'plumber', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.5 },
    desc: '高くジャンプして、敵1体を上からふみつける。', cast: '{a}は、ぴょーんと高くジャンプした！', anim: 'r43j_stomp',
  },
  pl_spanner: {
    name: 'スパナで配管なおし', kana: 'すぱなではいかんなおし', kind: 'skill', job: 'plumber', mp: 3, target: 'ally', role: 'heal',
    effect: { type: 'heal', base: [30, 38], thr: 25 },
    desc: 'スパナで、こわれた所をくるくるなおす。仲間1人のHPを少し回復する。', cast: '{a}は、スパナで{t}をくるくるなおした！', anim: 'r43j_wrench',
  },
  pl_dokan: {
    name: '土管ワープ', kana: 'どかんわーぷ', kind: 'skill', job: 'plumber', mp: 3, target: 'self', role: 'sup',
    effect: { type: 'escape' },
    desc: '地面から緑の土管を出して、みんなでもぐる。自分たちを、戦いからにがす（にげられない戦いもある）。', cast: '{a}「みんな、この土管に入って！」', anim: 'r43j_pipe',
  },
  pl_dash: {
    name: 'Bダッシュ', kana: 'びーだっしゅ', kind: 'skill', job: 'plumber', mp: 3, target: 'self', role: 'sup',
    effect: { type: 'buff', stat: 'agi', mult: 1.3, dur: 30 },
    desc: 'ボタンを長おしして、いきおいよく走り出す。自分の素早さが上がる。', cast: '{a}は、うでをふって走り出した！', anim: 'buff',
  },
  pl_hammer: {
    name: 'ハンマーなげ', kana: 'はんまーなげ', kind: 'skill', job: 'plumber', mp: 5, target: 'enemies',
    effect: { type: 'phys', mult: 0.75 },
    desc: '小さなハンマーを、くるくる回して投げる。敵全体に当たる。', cast: '{a}は、ハンマーをいくつも投げた！', anim: 'hit_all',
  },
  plumber_sig: {
    name: '三だんジャンプ', kana: 'さんだんじゃんぷ', kind: 'skill', job: 'plumber', mp: 10, target: 'enemies',
    effect: { type: 'phys', mult: 0.85, hits: 3, random: true },
    desc: 'ジャンプ、ジャンプ、大ジャンプ！敵の頭をつぎつぎにふみつける。敵にランダムで3回当たる。', cast: '{a}「それっ、それっ、それーっ！」', anim: 'plumber_sig',
  },

  // ───────────── ひげおやじ／おてんば姫（上級職。配管工を きわめる） ─────────────
  mu_fire: {
    name: 'ファイアボール', kana: 'ふぁいあぼーる', kind: 'skill', job: 'mustache', mp: 4, target: 'enemy',
    effect: { type: 'phys', element: 'fire', mult: 0.85, hits: 2 },
    desc: '花の力で、ぽんぽんはずむ火の玉を2つ投げる。敵1体に炎のダメージが2回。', cast: '{a}は、火の玉をぽんぽん投げた！', anim: 'r43j_fireball',
  },
  mu_kinoko: {
    name: 'スーパーキノコ', kana: 'すーぱーきのこ', kind: 'skill', job: 'mustache', mp: 6, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'atk', mult: 1.4, dur: 40 }, { type: 'heal', base: [40, 52], thr: 30 }] },
    desc: '赤いキノコを食べて、体がぐんと大きくなる。自分の攻撃力が上がり、HPも回復する。', cast: '{a}は、赤いキノコを食べた！ぐぐーん！', anim: 'r43j_mushroom',
  },
  mu_koura: {
    name: 'こうらなげ', kana: 'こうらなげ', kind: 'skill', job: 'mustache', mp: 7, target: 'enemies',
    effect: { type: 'phys', mult: 0.95 },
    desc: '緑のこうらをけり出す。こうらは地面をすべって、敵全体にぶつかる。', cast: '{a}は、こうらを思いきりけった！', anim: 'r43j_shell',
  },
  mu_pow: {
    name: 'POWブロック', kana: 'ぱうぶろっく', kind: 'skill', job: 'mustache', mp: 8, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'phys', mult: 0.6 },
        { type: 'atbSet', sub: 30, chance: 0.35, msg: '{t}は、ひっくり返って動けない！', failMsg: '{t}は、ふみとどまった！' },
      ],
    },
    desc: '青いブロックを下からたたくと、地面がドーンとゆれる。敵全体に当たり、ひっくり返って止まる敵もいる。', cast: '{a}は、青いブロックを下からたたいた！ドーン！', anim: 'quake',
  },
  mu_1up: {
    name: '1UPキノコ', kana: 'わんあっぷきのこ', kind: 'skill', job: 'mustache', mp: 12, target: 'deadAlly', role: 'heal',
    effect: { type: 'revive', hpRatio: 0.5 },
    desc: '緑のキノコで、たおれた仲間1人を生き返らせる。', cast: '{a}は、{t}に緑のキノコを食べさせた！', anim: 'revive',
  },
  mustache_sig: {
    name: 'ファイアフラワー', kana: 'ふぁいあふらわー', kind: 'skill', job: 'mustache', mp: 16, target: 'enemies',
    effect: { type: 'phys', element: 'fire', mult: 0.65, hits: 5, random: true },
    desc: '大きな花の力をうけて、火の玉をつぎつぎに投げる。敵にランダムで5回、炎のダメージ。', cast: '{a}の服が、白と赤にかわった！', anim: 'mustache_sig',
  },

  // ───────────── マリオ／ピーチ（超級職。ひげおやじを きわめる） ─────────────
  mr_hip: {
    name: 'ヒップドロップ', kana: 'ひっぷどろっぷ', kind: 'skill', job: 'mario', mp: 10, target: 'enemy',
    effect: {
      type: 'multi',
      parts: [
        { type: 'phys', mult: 2.8 },
        { type: 'atbSet', sub: 45, chance: 0.35, msg: '{t}は、目を回して気ぜつした！', failMsg: '{t}は、ふみとどまった！' },
      ],
    },
    desc: '空中でくるりと回って、おしりから落ちる。敵1体に大きなダメージ。気ぜつして止まることもある。', cast: '{a}は、空中でくるりと回った…ドスン！', anim: 'r43j_hipdrop',
  },
  mr_star: {
    name: 'スター', kana: 'すたー', kind: 'skill', job: 'mario', mp: 14, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'def', mult: 1.6, dur: 25 }, { type: 'buff', stat: 'eva', add: 0.3, dur: 25 }] },
    desc: 'ぴかぴか光るスターをとる。しばらくの間、自分の守備力がとても上がり、攻撃をかわしやすくなる。', cast: '{a}は、光るスターをつかまえた！ぴかぴかぴか！', anim: 'r43j_star',
  },
  mr_egg: {
    name: 'ヨッシーのたまご', kana: 'よっしーのたまご', kind: 'skill', job: 'mario', mp: 12, target: 'enemies',
    effect: { type: 'phys', mult: 1.3 },
    desc: '緑のきょうりゅうをよんで、もようのあるたまごを投げてもらう。敵全体にダメージ。', cast: '{a}「ヨッシー、おねがい！」', anim: 'r43j_egg',
  },
  mr_kinoko: {
    name: 'キノコ王国のおくりもの', kana: 'きのこおうこくのおくりもの', kind: 'skill', job: 'mario', mp: 18, target: 'allies', role: 'heal',
    effect: { type: 'heal', base: [85, 105], thr: 55 },
    desc: 'キノコの国のみんなが、おいしいキノコを持ってきてくれる。仲間全員のHPを回復する。', cast: 'キノコの国のみんなが、かけつけてくれた！', anim: 'heal2',
  },
  mr_kart: {
    name: 'カートでダッシュ', kana: 'かーとでだっしゅ', kind: 'skill', job: 'mario', mp: 16, target: 'allies', role: 'sup',
    effect: { type: 'buff', stat: 'agi', mult: 1.35, dur: 40 },
    desc: 'みんなで小さなカートに乗って、いっせいに走り出す。仲間全員の素早さが上がる。', cast: '{a}「シートベルトをしめて、出発！」', anim: 'buff',
  },
  mario_sig: {
    name: 'スーパースターラッシュ', kana: 'すーぱーすたーらっしゅ', kind: 'skill', job: 'mario', mp: 30, target: 'enemies',
    effect: { type: 'phys', mult: 0.78, hits: 3 },
    desc: 'スターの力でにじ色に光りながら、敵の頭の上をつぎつぎにジャンプでふみつける。敵全体に3回ずつ当たる。', cast: '{a}「行くぞ…スーパースターラッシュ！」', anim: 'mario_sig',
  },
};
