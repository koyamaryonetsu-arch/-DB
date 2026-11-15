// 第86回 B班: 幻の職業「天下一の格闘王」「混とんの大軍師」の 技（docs/plan-r86-phantom-b.md）
//
// きまりは 今の 幻の職業（abilities-phantom-a〜c.js）と おなじ
//  ・1つの 職業に 8こ（Lv1・2・3・5・6・7・8・10。Lv10 が 看板の 技 <職業の id>_sig で いちばん MPを 使う）
//  ・伝説の 技より 1わり強 強い（1体の 物理 3.5倍 いじょう・全体の 物理 2.4倍 いじょう・全体の 呪文 125 いじょう）
//  ・攻撃の 呪文は kind: 'spell'（呪文ふうじで うてない）。食べる 技・となえる・補助は kind: 'skill'
// もとの 伝説の しくみを そのまま 使う 技（こうかの type は もとの まま。shared/battle-r84a.js・r84b.js・r83a.js・r85a.js）
//  ・rei（れい丸を 使う phys）・r84aCharge（れい丸が もどる）… 格闘王は 8発（jobs-r86b.js の reiMax）
//  ・r84bForm（水と お湯の すがた）・r84bKakehiki（かけひき）・effect.r84b 'te'（水の すがたで 手数が ふえる）
//  ・stance 'counter'（今 ある 反撃の 構え）
//  ・r83aSakusen（作戦を立てる。大軍師は 4つ目「大魔法の時間」も えらべる）・r85aChant（となえる）・r85aBig／r85aPierce（大砲の 呪文）
// この 職業だけの しくみ（shared/battle-r86b.js。どれも 戦いの 中だけ）
//  ・type 'r86bReiHiryu' … れい丸・しょう天は（カウンターの かまえ。攻撃を 受けると、竜巻に れい丸を のせて 敵全体へ。
//      れい丸を rei 発 使い、1発ごとに reiAdd 倍 強く なる。たりなければ ふつうの 飛竜しょう天は。攻撃が 来なければ 弱い 風の 一ふり ＋ MP 半分）
//  ・type 'r86bChantAll' … みんなでとなえる（仲間全員を「となえている」に する）
//  ・magic の しるし r86bTaiGiga … 太極・ギガ・スレイブ（敵全体の ふつうの 強化を 消して から、のこりの MP を 全部 使う 最大の 呪文。
//      上限は ギガ・スレイブと おなじ: 1体 4000・ボスは 最大HP の 3わり）。r85aGiga も つけて おく（ドラまたの オートが ギガ・スレイブと おなじ
//      きまり〈とどめ・敵が 多くて MP が たっぷり〉で うつ。battle.js の 'magic' では battle-r86b.js が 先に うけとる）
// えんしゅつ（anim）は client/render/battlefx-r86b.js（r86b_… と 看板の 技）

export const R86B_ABILITIES = {
  // ───────────── 天下一の格闘王（魔界の王の子 ＋ 飛竜しょう天はの達人。れい丸 8発） ─────────────
  tkk_reigan: {
    name: '天下一のれい丸', kana: 'てんかいちのれいがん', kind: 'skill', job: 'tenkaichi_king', mp: 10, target: 'enemy', role: 'dmg',
    effect: { type: 'phys', mult: 4.4, rei: { use: 1 } },
    desc: '指先に、ありったけのれい気を集めてうつ。れい丸を1発使う。敵1体にとても大きなダメージ。', cast: '{a}「くらえ、れい丸！」', anim: 'r86b_reigan',
  },
  tkk_kaburu: {
    name: '水とお湯の早がわり', kana: 'みずとおゆのはやがわり', kind: 'skill', job: 'tenkaichi_king', mp: 2, target: 'self', role: 'sup',
    effect: { type: 'r84bForm' },
    desc: '水をかぶると素早くよけやすい水のすがたに、お湯をかぶると力と守りの強いお湯のすがたになる。すぐに次の番が来る。', cast: '{a}は、目にもとまらぬ速さでかぶった！', anim: 'r84b_form',
  },
  tkk_mikiri: {
    name: '見切りのかまえ', kana: 'みきりのかまえ', kind: 'skill', job: 'tenkaichi_king', mp: 6, target: 'self', role: 'sup',
    effect: { type: 'stance', stance: 'counter', mult: 2.2, ignoreDef: 0.2 },
    desc: '相手の動きを見切るかまえ。次の自分の番までに、自分をなぐってきた敵に強いこぶしを返す。カウンターが決まると、れい丸が1発もどる。', cast: '{a}は、しずかに相手の動きを見ている…', anim: 'r86b_mikiri',
  },
  tkk_amaguri: {
    name: 'あまぐり・れい光けん', kana: 'あまぐりれいこうけん', kind: 'skill', job: 'tenkaichi_king', mp: 16, target: 'enemy', role: 'dmg',
    effect: { type: 'phys', mult: 0.55, hits: 9, r84b: 'te' },
    desc: 'れい気で光るこぶしを、目にもとまらぬ速さで9回打ちこむ。水のすがたなら、もっと手数がふえる。', cast: '{a}のあまぐり・れい光けん！', anim: 'r86b_rush',
  },
  tkk_kakehiki: {
    name: '天下一のかけひき', kana: 'てんかいちのかけひき', kind: 'skill', job: 'tenkaichi_king', mp: 12, target: 'enemies', role: 'sup',
    effect: { type: 'r84bKakehiki', atk: 1.1, def: 0.6, left: 4, bossDef: 0.8, bossLeft: 2 },
    desc: '「天下一は、ここにいるぞ！」と、敵全体をおこらせる。敵の攻撃力が少し上がるが、守備力が大きく下がる。おこった敵は自分をねらいやすくなるので、カウンターで返そう。', cast: '{a}「天下一は、ここにいるぞ！かかってこい！」', anim: 'r84b_tease',
  },
  tkk_sandan: {
    name: 'れい丸・天下のさんだん', kana: 'れいがんてんかのさんだん', kind: 'skill', job: 'tenkaichi_king', mp: 22, target: 'enemies', role: 'dmg',
    effect: { type: 'phys', mult: 2.7, rei: { use: 2 } },
    desc: 'れい丸を空中ではじけさせて、光の雨をふらせる。れい丸を2発使う。敵全体に大ダメージ。', cast: '{a}「れい丸・天下のさんだん！」', anim: 'r86b_shotgun',
  },
  tkk_touki: {
    name: '天下一のとう気', kana: 'てんかいちのとうき', kind: 'skill', job: 'tenkaichi_king', mp: 20, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'r84aCharge', add: 2 }, { type: 'heal', base: [130, 160], thr: 60 }] },
    desc: '体じゅうの気を、ゆっくりねり上げる。れい丸が2発もどって、HPも回復する。', cast: '{a}は、しずかにとう気をねっている…', anim: 'r86b_charge',
  },
  tenkaichi_king_sig: {
    name: 'れい丸・しょう天は', kana: 'れいがんしょうてんは', kind: 'skill', job: 'tenkaichi_king', mp: 32, target: 'enemies', role: 'dmg',
    effect: { type: 'r86bReiHiryu', mult: 2.4, vsBuff: 0.25, water: 1.4, swing: 0.9, rei: 2, reiAdd: 1.0 },
    desc: 'うずをまくようにかまえて、次の自分の番まで待つ。敵の攻撃を受けると、竜巻にれい丸を2発のせて、敵全体にやり返す。れい丸がたりないときは、ふつうの飛竜しょう天はになる。敵が強くなっているほど、水のすがたなら、もっと強い。', cast: '{a}は、指先を光らせて、うずをまくようにかまえた…！', anim: 'tenkaichi_king_sig',
  },

  // ───────────── 混とんの大軍師（ドラまた ＋ ほう神の大軍師） ─────────────
  kon_sakusen: {
    name: '混とんの作戦', kana: 'こんとんのさくせん', kind: 'skill', job: 'chaos_gunshi', mp: 6, target: 'self', role: 'sup',
    effect: { type: 'r83aSakusen' },
    desc: '「攻め」「守り」「速攻」、または4つ目の「大魔法の時間」の作戦を立てる。大魔法の時間は、となえている仲間の受けるダメージが下がり、となえてうつ呪文が強くなる。作戦は、自分がたおれるか、作戦をかえるまで、ずっと効く。', cast: '{a}「よし、ここは大魔法でいこう！」', anim: 'r86b_plan',
  },
  kon_tonaeru: {
    name: '混とんのとなえ', kana: 'こんとんのとなえ', kind: 'skill', spellLike: true, job: 'chaos_gunshi', mp: 4, target: 'self', role: 'sup',
    effect: { type: 'r85aChant' },
    desc: 'じっくり呪文をとなえる。自分は「となえている」になり、いちばん強い呪文がうてる。ふつうの呪文をうつと、その呪文が強くなる。半分の確率で早口になり、すぐに動ける。3回動くと消える。', cast: '{a}は、白と黒の光の中で、呪文をとなえ始めた…', anim: 'r86b_chant',
  },
  kon_dashin: {
    name: '打神べん・爆風', kana: 'だしんべんばくふう', kind: 'spell', job: 'chaos_gunshi', mp: 18, target: 'enemies',
    effect: { type: 'magic', element: 'wind', base: [128, 148], thr: 90 },
    desc: '風のむちに、ばくはつの呪文をのせてふる。敵全体に風の大ダメージ。', cast: '{a}「打神べん・爆風！」', anim: 'r86b_whip',
  },
  kon_ragna: {
    name: '混とんのやいば', kana: 'こんとんのやいば', kind: 'spell', job: 'chaos_gunshi', mp: 34, target: 'enemy',
    effect: { type: 'magic', element: 'dark', base: [470, 530], thr: 92, r85aBig: true, r85aPierce: true },
    desc: '先に「となえる」と使える、白と黒の光のやいば。敵1体に、闇の特大のダメージ。敵の守りをむしする。うつと、となえた力は消える。', cast: '{a}「白と黒のあいだに生まれしやいばよ…！」', anim: 'r86b_blade',
  },
  kon_teishoku: {
    name: '軍師のまんぷく定食', kana: 'ぐんしのまんぷくていしょく', kind: 'skill', job: 'chaos_gunshi', mp: 0, target: 'self', role: 'heal', noAuto: true,
    effect: { type: 'multi', parts: [{ type: 'heal', base: [96, 116], fixed: true }, { type: 'mpHeal', base: [10, 14] }] },
    desc: '作戦を考えながら、定食をたいらげる。自分のHPとMPが回復する。MPはいらない。', cast: '{a}「腹がへっては、作戦も立たぬ！」', anim: 'r86b_food',
  },
  kon_dragslave: {
    name: 'ドラグ・スレイブ・大風', kana: 'どらぐすれいぶたいふう', kind: 'spell', job: 'chaos_gunshi', mp: 38, target: 'enemies',
    effect: { type: 'magic', element: 'blast', base: [300, 334], thr: 88, r85aBig: true },
    desc: '先に「となえる」と使える、大風をまきこんだ大ばくはつ。敵全体に特大のダメージ。うつと、となえた力は消える。', cast: '{a}「たそがれよりも暗きもの、大風とともに…ドラグ・スレイブ！」', anim: 'r86b_dragslave',
  },
  kon_minna: {
    name: 'みんなでとなえる', kana: 'みんなでとなえる', kind: 'skill', spellLike: true, job: 'chaos_gunshi', mp: 26, target: 'allies', role: 'sup',
    effect: { type: 'r86bChantAll' },
    desc: '軍師の号令で、仲間全員がいっしょに呪文をとなえる。仲間全員が「となえている」になる。いちばん強い呪文がうてたり、ふつうの呪文が強くなったりする。大魔法の時間なら、受けるダメージも下がる。', cast: '{a}「みんな、声を合わせて！」', anim: 'r86b_minna',
  },
  chaos_gunshi_sig: {
    name: '太極・ギガ・スレイブ', kana: 'たいきょくぎがすれいぶ', kind: 'spell', job: 'chaos_gunshi', mp: 46, target: 'enemies',
    effect: { type: 'magic', base: [1, 1], thr: 95, r85aBig: true, r85aGiga: true, r86bTaiGiga: true },
    desc: '先に「となえる」と使える、最後の呪文。白と黒の光で敵全体の強くなった力を消してから、のこりのMPを全部使って、敵全体に特大のダメージ。MPが多いほど強い。うつと、MPは0になる。', cast: '{a}「白と黒をひとつに…太極・ギガ・スレイブ！」', anim: 'chaos_gunshi_sig',
  },
};
