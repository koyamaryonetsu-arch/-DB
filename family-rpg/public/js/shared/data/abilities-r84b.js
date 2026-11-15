// 第84回 B班: らんま1/2 の 系統の 技（無差別格闘流の門下生 → 早おとめ乱馬 → 飛竜しょう天はの達人。docs/plan-r84-jobs-b.md）
//
// きまりは abilities-r83a.js（封神演義の 系統）と おなじ
//  ・Lv1〜10 で 6こ（Lv10 が 看板の 技 <職業の id>_sig。いちばん MPを 使う）。伝説は Lv1・3・5・7・8・10
//  ・自分に かける 補助は 段の 上限まで
// この 系統だけの しくみ（shared/battle-r84b.js。どれも 戦いの 中だけ）
//  ・type 'r84bForm'     … 水をかぶる／お湯をかぶる（cmd.form: 'mizu' 水 ／ 'oyu' お湯。すばやい: 次の 番が すぐ 来る）
//  ・type 'r84bHiryu'    … 飛竜しょう天は（かまえ。次の 自分の 番までに 敵の 攻撃を 受けると、風で 敵全体へ 返す）
//  ・type 'r84bKakehiki' … かけひき（敵を おこらせる: 攻撃力が 少し 上がり、守備力が 大きく 下がる）
//  ・type 'r84bToubou'   … 敵前だい逃亡（仲間全員が 1回 行動する 間 よけやすい ＋ 自分の 次の 番が 早い）
//  ・type 'r84bKokoro'   … 心の水（left 回 行動する 間、水と お湯の 両方の よい 所）
//  ・effect.r84b … phys の 技の しるし（battle.js の 'phys' の はじめで battle-r84b.js へ）
//      'midare' … 乱れ打ち（水の すがた 8回／お湯の すがた 重い 1回／すがた なし 4回。mult・hits は すがた なしの 数）
//      'te'     … 手数の 技（水の すがたで 回数が ふえる）
//      'jishin' … 自信の気だん（自分の HP が 多いほど 強い）
//  ・effect.vsBuff84 … 敵が 自分を 強化して いる 数（battle-r84b.js の boostCount）1つごとに この ぶん 強い
// えんしゅつ（anim）は client/render/battlefx-r84b.js（r84b_… と 看板の 技）

// 水をかぶる／お湯をかぶる の あとの 行動ゲージ（すばやい）
export const R84B_FORM_ATB = 80;

export const R84B_ABILITIES = {
  // ───────────── 無差別格闘流の門下生（上級職。武闘家 ＋ 遊び人） ─────────────
  ms_amaguri: {
    name: 'あまぐりけん', kana: 'あまぐりけん', kind: 'skill', job: 'musabetsu_student', mp: 4, target: 'enemy',
    effect: { type: 'phys', mult: 0.4, hits: 5, r84b: 'te' },
    desc: '火の中のくりを拾うほどの速さで、敵1体を5回なぐる。水のすがたなら、もっと手数がふえる。', cast: '{a}のあまぐりけん！', anim: 'r84b_amaguri',
  },
  ms_mizu: {
    name: '水をかぶる／お湯をかぶる', kana: 'みずをかぶるおゆをかぶる', kind: 'skill', job: 'musabetsu_student', mp: 2, target: 'self', role: 'sup',
    effect: { type: 'r84bForm' },
    desc: '水をかぶると、素早くよけやすい水のすがたに。お湯をかぶると、力と守りの強いお湯のすがたになる。すぐに次の番が来る。', cast: '{a}は、頭からざぶんとかぶった！', anim: 'r84b_form',
  },
  ms_dogeza: {
    name: 'どげざ', kana: 'どげざ', kind: 'skill', job: 'musabetsu_student', mp: 3, target: 'enemy', role: 'sup',
    effect: { type: 'atbSet', sub: 60, chance: 0.75, msg: '{t}は、あやまられて手が止まった！', failMsg: '{t}は、ゆるしてくれなかった…' },
    desc: '「ごめんなさーい！」と、地面に頭をつけてあやまる。敵1体は、びっくりして番がおくれる。', cast: '{a}「ごめんなさーい！」いきおいよく、どげざした！', anim: 'r84b_dogeza',
  },
  ms_kawashi: {
    name: 'かわしてける', kana: 'かわしてける', kind: 'skill', job: 'musabetsu_student', mp: 4, target: 'self', role: 'sup',
    effect: { type: 'stance', stance: 'counter', mult: 1.2 },
    desc: 'ひらりとかわして、けり返すかまえ。次の自分の番までに、自分をなぐってきた敵にけり返す。', cast: '{a}は、ひらりとかまえた。', anim: 'guard',
  },
  ms_osage: {
    name: 'おさげキック', kana: 'おさげきっく', kind: 'skill', job: 'musabetsu_student', mp: 6, target: 'enemy',
    effect: { type: 'phys', mult: 1.8, atbAfter: 70 },
    desc: 'おさげをなびかせて、敵1体に強いけり。すぐに次の番が来る。', cast: '{a}のおさげキック！', anim: 'r84b_kick',
  },
  musabetsu_student_sig: {
    name: '無差別格闘流・乱れ打ち', kana: 'むさべつかくとうりゅうみだれうち', kind: 'skill', job: 'musabetsu_student', mp: 12, target: 'enemy',
    effect: { type: 'phys', mult: 0.55, hits: 4, r84b: 'midare' },
    desc: 'なんでもありの乱れ打ち。敵1体に、水のすがたなら8回、お湯のすがたなら重い1回、すがたがなければ4回。', cast: '{a}「無差別格闘流・乱れ打ち！」', anim: 'musabetsu_student_sig',
  },

  // ───────────── 早おとめ乱馬（超級職） ─────────────
  rm_kachuu: {
    name: '火中あまぐりけん', kana: 'かちゅうあまぐりけん', kind: 'skill', job: 'ranma', mp: 8, target: 'enemy',
    effect: { type: 'phys', mult: 0.45, hits: 7, r84b: 'te' },
    desc: 'もっと速いあまぐりけん。敵1体を7回なぐる。水のすがたなら、もっと手数がふえる。', cast: '{a}の火中あまぐりけん！', anim: 'r84b_amaguri',
  },
  rm_kakehiki: {
    name: 'かけひき', kana: 'かけひき', kind: 'skill', job: 'ranma', mp: 5, target: 'enemy', role: 'sup',
    effect: { type: 'r84bKakehiki', atk: 1.1, def: 0.6, left: 4, bossDef: 0.8, bossLeft: 2 },
    desc: '「へへーん、こっちだよ！」と、敵1体をからかっておこらせる。敵の攻撃力が少し上がるが、守備力が大きく下がる。おこった敵には、飛竜しょう天はがよく効く。', cast: '{a}「へへーん、こっちだよ！」', anim: 'r84b_tease',
  },
  rm_kidan: {
    name: '自信の気だん', kana: 'じしんのきだん', kind: 'skill', job: 'ranma', mp: 10, target: 'enemy',
    effect: { type: 'phys', mult: 2.6, r84b: 'jishin' },
    desc: '自信の気をこめた気だんを、敵1体にぶつける。自分のHPが多いほど強い。', cast: '{a}「自信の気だん！」', anim: 'r84b_kidan',
  },
  rm_itadaki: {
    name: 'こっそりいただき', kana: 'こっそりいただき', kind: 'skill', job: 'ranma', mp: 4, target: 'enemy',
    effect: { type: 'phys', mult: 1.3, steal: 0.7 },
    desc: 'すれちがいざまに敵1体をなぐって、持っている道具をこっそりいただく。', cast: '{a}は、すっとすれちがった！', anim: 'r84b_kick',
  },
  rm_panda: {
    name: 'パンダのおやじ', kana: 'ぱんだのおやじ', kind: 'skill', job: 'ranma', mp: 12, target: 'enemy', role: 'dmg',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 2.0 }, { type: 'heal', target: 'allies', base: [40, 52], thr: 24 }] },
    desc: '大きなパンダが出てきて、敵1体をなぐる。かんばんの「がんばれ」で、仲間全員のHPが少し回復する。', cast: 'パンダが、のっしのっしとあらわれた！', anim: 'r84b_panda',
  },
  ranma_sig: {
    name: '飛竜しょう天は', kana: 'ひりゅうしょうてんは', kind: 'skill', job: 'ranma', mp: 18, target: 'enemies', role: 'dmg',
    effect: { type: 'r84bHiryu', mult: 1.5, vsBuff: 0.25, water: 1.2, swing: 0.6 },
    desc: 'うずをまくようにかまえて、次の自分の番まで待つ。敵の攻撃を受けると、大きな竜巻で敵全体にやり返す。敵が強くなっているほど、水のすがたなら、もっと強い。', cast: '{a}は、うずをまくようにかまえた…！', anim: 'ranma_sig',
  },

  // ───────────── 飛竜しょう天はの達人（伝説） ─────────────
  hr_kidan: {
    name: '自信の気だん・極', kana: 'じしんのきだんきわみ', kind: 'skill', job: 'hiryu_master', mp: 14, target: 'enemy',
    effect: { type: 'phys', mult: 3.4, r84b: 'jishin' },
    desc: 'とても大きな自信の気だんを、敵1体にぶつける。自分のHPが多いほど強い。', cast: '{a}「これが、自信の気だん・極だ！」', anim: 'r84b_kidan',
  },
  hr_toubou: {
    name: '敵前だい逃亡', kana: 'てきまえだいとうぼう', kind: 'skill', job: 'hiryu_master', mp: 8, target: 'allies', role: 'sup',
    effect: { type: 'r84bToubou', add: 0.2, atb: 80 },
    desc: '「にげろー！」とにげるふりをして、敵の目をまどわせる。仲間全員が1回動くまで、よけやすくなる。自分はすぐに次の番が来る。戦いからはにげない。', cast: '{a}「にげろー！」…と見せかけた！', anim: 'r84b_toubou',
  },
  hr_kokoro: {
    name: '心の水', kana: 'こころのみず', kind: 'skill', job: 'hiryu_master', mp: 10, target: 'self', role: 'sup',
    effect: { type: 'r84bKokoro', left: 3 },
    desc: '心を、しずかな水のようにする。自分が3回動くまで、水のすがたとお湯のすがたの、両方のよい所を持つ。', cast: '{a}は、目をとじて、心をしずめた…', anim: 'r84b_kokoro',
  },
  hr_senju: {
    name: 'あまぐりけん・千手', kana: 'あまぐりけんせんじゅ', kind: 'skill', job: 'hiryu_master', mp: 22, target: 'enemies',
    effect: { type: 'phys', mult: 0.4, hits: 12, random: true, r84b: 'te' },
    desc: '手が千本あるような速さで、敵全体に、ばらばらに12回なぐる。水のすがたなら、もっと手数がふえる。', cast: '{a}のあまぐりけん・千手！', anim: 'r84b_amaguri',
  },
  hr_kakehiki: {
    name: 'かけひき・極', kana: 'かけひききわみ', kind: 'skill', job: 'hiryu_master', mp: 12, target: 'enemies', role: 'sup',
    effect: { type: 'r84bKakehiki', atk: 1.1, def: 0.6, left: 4, bossDef: 0.8, bossLeft: 2 },
    desc: '「みんなまとめて、かかってこい！」と、敵全体をおこらせる。敵の攻撃力が少し上がるが、守備力が大きく下がる。', cast: '{a}「みんなまとめて、かかってこい！」', anim: 'r84b_tease',
  },
  hiryu_master_sig: {
    name: '飛竜こうりんだん', kana: 'ひりゅうこうりんだん', kind: 'skill', job: 'hiryu_master', mp: 32, target: 'enemies',
    effect: { type: 'phys', mult: 1.9, element: 'wind', vsBuff84: 0.2 },
    desc: 'かまえなくても、空から大きな竜巻を落とす。敵全体に風のダメージ。敵が強くなっているほど強い。', cast: '{a}「飛竜こうりんだん！」', anim: 'hiryu_master_sig',
  },
};
