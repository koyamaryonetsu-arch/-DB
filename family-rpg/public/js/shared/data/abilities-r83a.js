// 第83回 A班: 封神演義の 系統の 技（つりをする道士 → せん人界の道士 → 太公望 → ほう神の大軍師。docs/plan-r83-jobs-a.md）
//
// きまりは abilities-r82b.js（YAIBA の 系統）と おなじ
//  ・Lv1〜10 で 6こ（Lv10 が 看板の 技 <職業の id>_sig。いちばん MPを 使う）。伝説は Lv1・3・5・7・8・10
//  ・自分に かける 補助は 段の 上限まで（基本職 1.25倍・上級職 1.3倍・超級職と 伝説 1.3倍〈2だんかいで 1.6倍〉）
// この 系統だけの しくみ（shared/battle-r83a.js。どれも 戦いの 中だけ）
//  ・type 'r83aSakusen' … 作戦を立てる（cmd.sakusen: 'seme' 攻め ／ 'mamori' 守り ／ 'sokkou' 速攻〈太公望から〉）
//  ・type 'r83aSeal'    … 強化ふうじ（敵の ふつうの 強化を 消して、turns 回 行動する 間 強化できなく する）
//  ・type 'r83aTaikyoku' … 太極図（敵全体に 強化ふうじ ＋ 仲間全員の 弱体と 状態異常を 治す）
//  ・type 'r83aHata'    … 守りの旗（仲間全員、次に 受ける 1回の ダメージが 半分）
//  ・type 'r83aGorei'   … 軍師の号令（仲間 1人が すぐ 動ける）
//  ・type 'r83aSaki'    … 先読みの策（次の 自分の 番まで、前ぶれの ある 大技の ダメージが 仲間全員 半分）
//  ・effect.r83aHoshin  … ほう神（magic の 技の しるし。敵の HPが 少ないほど 大ダメージ。たおすと 仲間全員の MPが 回復。
//                         オートは ふつうの 呪文と して えらぶ。battle.js の 'magic' の はじめで battle-r83a.js へ）
//  ・type 'r83aKeikaku' … ほう神計画（3回の 行動の 間 作戦の 効き目が 2倍 ＋ 仲間全員が すぐ 動ける）
// えんしゅつ（anim）は client/render/battlefx-r83a.js（r83a_… と 看板の 技）

export const R83A_ABILITIES = {
  // ───────────── つりをする道士（基本職） ─────────────
  fd_tsurizao: {
    name: 'つりざおアタック', kana: 'つりざおあたっく', kind: 'skill', job: 'fishing_doshi', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.45 },
    desc: '長いつりざおを、ぶんぶんふり回して、敵1体をぴしゃりとたたく。', cast: '{a}のつりざおアタック！', anim: 'r83a_rod',
  },
  fd_nonbiri: {
    name: 'のんびりつり', kana: 'のんびりつり', kind: 'skill', job: 'fishing_doshi', mp: 0, target: 'self', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [22, 30], thr: 20 }, { type: 'mpHeal', base: [3, 6] }] },
    desc: '戦いの中でも、のんびりつり糸をたらす。自分のHPとMPが少し回復する。でも魚はつれない。', cast: '{a}は、のんびりつりを始めた…「魚はつれなかった…」', anim: 'heal1',
  },
  fd_ofuda: {
    name: '風のおふだ', kana: 'かぜのおふだ', kind: 'spell', job: 'fishing_doshi', mp: 4, target: 'enemy',
    effect: { type: 'magic', element: 'wind', base: [30, 40], thr: 26 },
    desc: '風の力をこめたおふだをとばす。敵1体に風の呪文のダメージ。', cast: '{a}は、風のおふだをとばした！', anim: 'r83a_ofuda',
  },
  fd_namake: {
    name: 'なまけるふり', kana: 'なまけるふり', kind: 'skill', job: 'fishing_doshi', mp: 3, target: 'self', role: 'sup',
    effect: { type: 'buff', stat: 'def', mult: 1.25, dur: 30 },
    desc: 'ごろんとねころんで、なまけるふりをする。じつはすきがない。自分の守備力が上がる。', cast: '{a}は、ごろんとねころんだ…（じつは、すきがない）', anim: 'guard',
  },
  fd_hattari: {
    name: 'はったり', kana: 'はったり', kind: 'skill', job: 'fishing_doshi', mp: 4, target: 'enemy', role: 'sup',
    effect: { type: 'debuff', stat: 'atk', mult: 0.75, dur: 30, chance: 0.8 },
    desc: '「じつは強い道士だぞ！」と、むねをはって言う。敵1体の攻撃力が下がる。', cast: '{a}「じつは、ものすごく強い道士だぞ！」', anim: 'debuff',
  },
  fishing_doshi_sig: {
    name: '大物がつれた！', kana: 'おおものがつれた', kind: 'skill', job: 'fishing_doshi', mp: 10, target: 'enemies', role: 'dmg',
    effect: { type: 'random', options: ['fd_catch_fish', 'fd_catch_fish', 'fd_catch_boot', 'fd_catch_box'] }, autoRandom: true,
    desc: '思いきりつりざおを引くと、何かがつれた！何がつれるかは運しだい。大きな魚なら、敵全体にダメージ。長ぐつなら何も起きない。宝箱ならお金が手に入る。', cast: '{a}「…む！大物の手ごたえ！」', anim: 'fishing_doshi_sig',
  },
  // 大物がつれた！の 中み（運で どれか。hidden … 技の 一覧には 出ない）
  fd_catch_fish: {
    name: '大きな魚', kana: 'おおきなさかな', kind: 'skill', job: 'fishing_doshi', mp: 0, target: 'enemies', hidden: true,
    effect: { type: 'magic', element: 'water', base: [36, 46], thr: 40 },
    cast: '大きな魚がとび出して、敵全体にたいあたり！', anim: 'fishing_doshi_sig',
  },
  fd_catch_boot: {
    name: '長ぐつ', kana: 'ながぐつ', kind: 'skill', job: 'fishing_doshi', mp: 0, target: 'self', hidden: true,
    effect: { type: 'nothing' },
    cast: 'つれたのは、古い長ぐつだった…。何も起きなかった。', anim: 'r83a_catch',
  },
  fd_catch_box: {
    name: '宝箱', kana: 'たからばこ', kind: 'skill', job: 'fishing_doshi', mp: 0, target: 'self', hidden: true,
    effect: { type: 'r83aTreasure', mult: 2 },
    cast: 'なんと、宝箱がつれた！', anim: 'r83a_catch',
  },

  // ───────────── せん人界の道士（上級職。作戦を立てる） ─────────────
  sd_dashin: {
    name: '打神べん', kana: 'だしんべん', kind: 'skill', job: 'sennin_doshi', mp: 6, target: 'group',
    effect: { type: 'magic', element: 'wind', base: [28, 36], thr: 36 },
    desc: '風の力をやどしたむち「打神べん」をふると、するどい風が起きる。同じ種類の敵をまとめて、風のダメージ。', cast: '{a}は、打神べんをふった！', anim: 'r83a_whip',
  },
  sd_sakusen: {
    name: '作戦を立てる', kana: 'さくせんをたてる', kind: 'skill', job: 'sennin_doshi', mp: 6, target: 'self', role: 'sup',
    effect: { type: 'r83aSakusen' },
    desc: '「攻め」か「守り」の作戦を立てる。作戦は、自分がたおれるか、作戦をかえるまで、仲間全員にずっと効く。攻めはあたえるダメージが上がり、守りは受けるダメージが下がる。',
    cast: '{a}「よし、作戦はこれでいこう！」', anim: 'r83a_plan',
  },
  sd_karyu: {
    name: '火竜ひょう', kana: 'かりゅうひょう', kind: 'skill', job: 'sennin_doshi', mp: 7, target: 'enemy',
    effect: { type: 'magic', element: 'fire', base: [72, 88], thr: 44 },
    desc: '竜の形をした、もえるほのおをとばす。敵1体に炎の大ダメージ。', cast: '{a}の火竜ひょう！', anim: 'r83a_fire',
  },
  sd_momo: {
    name: 'せん人のもも', kana: 'せんにんのもも', kind: 'skill', job: 'sennin_doshi', mp: 8, target: 'ally', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [58, 72], thr: 40 }, { type: 'cure', statuses: ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'] }] },
    desc: 'せん人界のあまいももを、仲間1人に食べさせる。HPが回復して、状態異常も治る。', cast: '{a}は、せん人のももを手わたした！', anim: 'heal1',
  },
  sd_fuuji: {
    name: '強化ふうじ', kana: 'きょうかふうじ', kind: 'skill', job: 'sennin_doshi', mp: 6, target: 'enemy', role: 'sup',
    effect: { type: 'r83aSeal', turns: 3 },
    desc: 'おふだで、敵1体の強くなっていた力を消す。そのあと、しばらく強化ができなくなる。', cast: '{a}は、ふうじのおふだをはりつけた！', anim: 'r83a_seal',
  },
  sennin_doshi_sig: {
    name: '打神べん・大風', kana: 'だしんべんおおかぜ', kind: 'skill', job: 'sennin_doshi', mp: 14, target: 'enemies',
    effect: { type: 'magic', element: 'wind', base: [54, 68], thr: 54 },
    desc: '打神べんを大きくふり回して、大風を起こす。敵全体に風の大ダメージ。', cast: '{a}「打神べん、大風！」', anim: 'sennin_doshi_sig',
  },

  // ───────────── 太公望（超級職。作戦に 速攻・太極図） ─────────────
  tk_yaiba: {
    name: '風のやいば・二れん', kana: 'かぜのやいばにれん', kind: 'skill', job: 'taikobo', mp: 10, target: 'enemy',
    effect: { type: 'magic', element: 'wind', base: [92, 112], thr: 56 },
    desc: '2つの風のやいばを、十字にかさねてとばす。敵1体に風の大ダメージ。', cast: '{a}の風のやいば！もう一つ！', anim: 'r83a_wind2',
  },
  tk_supu: {
    name: 'スープーに乗る', kana: 'すーぷーにのる', kind: 'skill', job: 'taikobo', mp: 8, target: 'self', role: 'sup',
    effect: { type: 'buff', stats: ['def', 'agi'], mult: 1.3, dur: 40 },
    desc: '空飛ぶカバのスープーに、ひょいととび乗る。自分の守備力と素早さが上がる。', cast: '{a}「スープー、たのむ！」空飛ぶカバに乗った！', anim: 'r83a_supu',
  },
  tk_hata: {
    name: '守りの旗', kana: 'まもりのはた', kind: 'skill', job: 'taikobo', mp: 12, target: 'allies', role: 'sup',
    effect: { type: 'r83aHata', left: 3 },
    desc: '大きな旗を立てる。仲間全員、次に受ける1回のダメージが半分になる。', cast: '{a}は、守りの旗を高くかかげた！', anim: 'r83a_flag',
  },
  tk_hakari: {
    name: 'はかりごと', kana: 'はかりごと', kind: 'skill', job: 'taikobo', mp: 14, target: 'enemies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'debuff', stat: 'atk', mult: 0.8, dur: 40, chance: 0.75 }, { type: 'debuff', stat: 'def', mult: 0.8, dur: 40, chance: 0.75 }] },
    desc: 'うその話を流して、敵をまよわせる。敵全体の攻撃力と守備力が下がる。', cast: '{a}「ふっふっふ…もう、わなにかかっておるぞ」', anim: 'debuff',
  },
  tk_momo: {
    name: 'もものえん', kana: 'もものえん', kind: 'skill', job: 'taikobo', mp: 18, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [72, 90], thr: 50 }, { type: 'mpHeal', base: [4, 8] }] },
    desc: 'ももを持ちよって、みんなで食べる。仲間全員のHPが回復して、MPも少し回復する。', cast: '{a}「さあ、みんなでももを食べよう！」', anim: 'heal2',
  },
  taikobo_sig: {
    name: '太極図', kana: 'たいきょくず', kind: 'skill', job: 'taikobo', mp: 24, target: 'enemies', role: 'sup',
    effect: { type: 'r83aTaikyoku', turns: 3 },
    desc: '白と黒の太極図を広げる。敵全体の強くなっていた力を消して、しばらく強化できなくする。仲間全員の弱くなっていた力と状態異常も、すべて元にもどす。', cast: '{a}「太極図よ、すべてを元にもどせ！」', anim: 'taikobo_sig',
  },

  // ───────────── ほう神の大軍師（伝説。太公望 ＋ ほかの 超級職 1つ） ─────────────
  hg_ten: {
    name: '打神べん・天', kana: 'だしんべんてん', kind: 'skill', job: 'hoshin_gunshi', mp: 14, target: 'enemy',
    effect: { type: 'magic', element: 'wind', base: [160, 188], thr: 86 },
    desc: '天までとどく風のむちで、敵1体を打つ。風の大ダメージ。', cast: '{a}「打神べん・天！」', anim: 'r83a_whip',
  },
  hg_gorei: {
    name: '軍師の号令', kana: 'ぐんしのごうれい', kind: 'skill', job: 'hoshin_gunshi', mp: 10, target: 'ally', role: 'sup',
    effect: { type: 'r83aGorei' },
    desc: '「今だ、行け！」と号令をかける。仲間1人が、すぐに動ける。', cast: '{a}「今だ、行け！」', anim: 'r83a_gorei',
  },
  hg_sakiyomi: {
    name: '先読みの策', kana: 'さきよみのさく', kind: 'skill', job: 'hoshin_gunshi', mp: 12, target: 'self', role: 'sup',
    effect: { type: 'r83aSaki' },
    desc: '敵の大技を先に読んで、よけ方を仲間につたえる。次の自分の番まで、前ぶれのある大技で、仲間全員が受けるダメージが半分になる。', cast: '{a}「その手は、もう読んでおる！」', anim: 'r83a_saki',
  },
  hg_utage: {
    name: 'せん人の大えん', kana: 'せんにんのだいえん', kind: 'skill', job: 'hoshin_gunshi', mp: 26, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [124, 150], thr: 60 }, { type: 'mpHeal', base: [8, 14] }] },
    desc: 'せん人界のごちそうを広げて、大きなえん会をひらく。仲間全員のHPが大きく回復して、MPも回復する。', cast: '{a}「今日は、大えん会じゃ！」', anim: 'heal2',
  },
  hg_hoshin: {
    name: 'ほう神', kana: 'ほうしん', kind: 'skill', job: 'hoshin_gunshi', mp: 20, target: 'enemy', role: 'dmg',
    effect: { type: 'magic', element: 'light', base: [110, 130], thr: 86, r83aHoshin: { low: 1.2, mpBack: [8, 14] } },
    desc: 'ほう神の光で、敵1体をつつむ。敵のHPが少ないほど大ダメージ。これでたおすと、仲間全員のMPが回復する。', cast: '{a}「ほう神！」', anim: 'r83a_hoshin',
  },
  hoshin_gunshi_sig: {
    name: 'ほう神計画', kana: 'ほうしんけいかく', kind: 'skill', job: 'hoshin_gunshi', mp: 36, target: 'allies', role: 'sup',
    effect: { type: 'r83aKeikaku', left: 3 },
    desc: 'ずっとあたためてきた、大きな計画を始める。しばらくのあいだ作戦の効き目が2倍になり、仲間全員がすぐに動ける。作戦がないときは、攻めの作戦から始める。', cast: '{a}「ほう神計画、始動じゃ！」', anim: 'hoshin_gunshi_sig',
  },
};
