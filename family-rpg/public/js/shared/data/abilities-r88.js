// 第88回: 装備を「使う」と 出る かくし技（docs/plan-r88-anime-gear.md の 1-2・12-1）
//   品の use: { ability: 'この ファイルの id' }。戦いの 道具から、装備して いる 間 だけ・1つの 戦いで その 品 1回・MPなし
//   （shared/battle-gearfx.js の gearUse。つけた 人が 使った ものとして、技と 同じ 式で うごく）
//
// 書き方（あとの 係も 同じ）
//   ・id は r88u_<名前>。hidden: true（技の 一覧・ひらめき・図鑑・オートに 出ない）・mp: 0・job は 書かない
//   ・kind は 'skill'（宝貝・魔導具は 呪文では ない。呪文ふうじの 中でも 使える）
//   ・強さは 上級職の 技 くらい。伝説の 品は 超級職の 技 くらいまで
//       全体の 呪文 base 90〜115（上級）・140〜185（超級）／1体の 呪文 230〜270（超級）／全体の 物理 1.4〜2.0 倍／1体の 物理 3.5 倍まで
//   ・えんしゅつ（anim）は 今 ある 物を 使い回して よい（雷公べんだけ client/render/battlefx-r88.js の r88_raikou）
export const R88_ABILITIES = {
  // ── ほう神演義: スーパー宝貝 ──
  r88u_raikou: {
    name: '雷公べん・大いかずち', kana: 'らいこうべんおおいかずち', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'dmg',
    effect: { type: 'magic', element: 'bolt', base: [160, 190], thr: 85 },
    desc: '雷公べんをふるって、空いっぱいの大きな雷を敵全体に落とす。', cast: '{a}が雷公べんをふるうと、空がまっぷたつに裂けた！', anim: 'r88_raikou',
  },
  r88u_kinben: {
    name: '禁べん・百れん打', kana: 'きんべんひゃくれんだ', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'dmg',
    effect: { type: 'phys', mult: 0.5, hits: 4 },
    desc: '禁べんで、遠くの敵まで何回も打ちすえる。敵全体に4回攻撃。', cast: '{a}の禁べんが、うなりを上げた！', anim: 'r83a_whip',
  },
  r88u_taikyoku: {
    name: '太極図の光', kana: 'たいきょくずのひかり', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'sup',
    effect: { type: 'dispel' },
    desc: '太極図の巻物を広げて、敵全体の強くなっていた力を消す。', cast: '{a}は太極図の巻物を広げた！', anim: 'taikobo_sig',
  },
  r88u_kinko: {
    name: '金こうせん・七色の竜', kana: 'きんこうせんなないろのりゅう', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'dmg',
    effect: { type: 'phys', mult: 0.5, hits: 7, random: true },
    desc: '金こうせんから七色の竜をよび出して、敵に7回かみつかせる。', cast: '{a}の金こうせんから、七色の竜がとび出した！', anim: 'r83a_fire',
  },
  r88u_keisei: {
    name: 'けい世元じょうのまどわし', kana: 'けいせいげんじょうのまどわし', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'sup',
    effect: { type: 'status', status: 'confuse', chance: 0.55, turns: [1, 3] },
    desc: '羽衣をひるがえして、敵全体の心をまどわし、混乱させる。', cast: '{a}の羽衣が、ふしぎな光をはなった…！', anim: 'debuff',
  },
  r88u_rokkon: {
    name: '六こんばん・闇づつみ', kana: 'ろっこんばんやみづつみ', kind: 'skill', mp: 0, target: 'enemy', hidden: true, role: 'dmg',
    effect: { type: 'magic', element: 'dark', base: [230, 270], thr: 90 },
    desc: '六こんばんの黒い布で敵1体をつつみこみ、闇の大ダメージをあたえる。', cast: '{a}の六こんばんが、{t}をつつみこんだ！', anim: 'dark1',
  },
  r88u_banko: {
    name: 'ばん古ばん・重力', kana: 'ばんこばんじゅうりょく', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'sup',
    effect: { type: 'debuff', stat: 'agi', mult: 0.6, dur: 40, chance: 0.9 },
    desc: 'ばん古ばんで重力をあやつり、敵全体の素早さを大きく下げる。', cast: '{a}がばん古ばんをふると、ずしりと重くなった！', anim: 'debuff',
  },
  // ── YAIBA ──
  r88u_maou: {
    name: '魔王剣・三日月', kana: 'まおうけんみかづき', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'dmg',
    effect: { type: 'phys', mult: 1.7, element: 'dark' },
    desc: '魔王剣から黒い光のやいばをとばして、敵全体を闇で切りさく。', cast: '{a}の魔王剣が、黒い三日月の光をはなった！', anim: 'r82b_slash',
  },
  // ── G2班: ほう神演義（崑崙・金鰲の 宝貝）──
  r88u_dashin: {
    name: '打神べん・大気のうず', kana: 'だしんべんたいきのうず', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'dmg',
    effect: { type: 'magic', element: 'wind', base: [145, 175], thr: 80 },
    desc: '太極の打神べんで大気をまるごとあやつり、敵全体を大きな風でうつ。', cast: '{a}が打神べんをふると、大気がうなりを上げた！', anim: 'wind2',
  },
  r88u_kinsen: {
    name: '金せん・光線', kana: 'きんせんこうせん', kind: 'skill', mp: 0, target: 'enemy', hidden: true, role: 'dmg',
    effect: { type: 'magic', element: 'light', base: [170, 200], thr: 80 },
    desc: '金せんから光の光線を打ち出して、敵1体をうつ。', cast: '{a}のかたの金せんが、まぶしく光った！', anim: 'holy',
  },
  r88u_fuin: {
    name: '太極ふ印・元素', kana: 'たいきょくふいんげんそ', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'dmg',
    effect: { type: 'random', options: ['r88u_fuin_fire', 'r88u_fuin_ice', 'r88u_fuin_bolt'] },
    desc: '元素をあやつって、炎・氷・雷のどれかで敵全体をうつ。', cast: '{a}は太極ふ印に指をすべらせた！', anim: 'none',
  },
  r88u_fuin_fire: {
    name: '太極ふ印・炎', kana: 'たいきょくふいんほのお', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'dmg',
    effect: { type: 'magic', element: 'fire', base: [100, 115], thr: 70 },
    desc: '元素をあやつって、炎で敵全体をうつ。', cast: '{a}のまわりの元素が、炎にかわった！', anim: 'fire_wave',
  },
  r88u_fuin_ice: {
    name: '太極ふ印・氷', kana: 'たいきょくふいんこおり', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'dmg',
    effect: { type: 'magic', element: 'ice', base: [100, 115], thr: 70 },
    desc: '元素をあやつって、氷で敵全体をうつ。', cast: '{a}のまわりの元素が、氷にかわった！', anim: 'blizzard',
  },
  r88u_fuin_bolt: {
    name: '太極ふ印・雷', kana: 'たいきょくふいんかみなり', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'dmg',
    effect: { type: 'magic', element: 'bolt', base: [100, 115], thr: 70 },
    desc: '元素をあやつって、雷で敵全体をうつ。', cast: '{a}のまわりの元素が、雷にかわった！', anim: 'bolt2',
  },
  r88u_banten: {
    name: '番天印・しるしの光', kana: 'ばんてんいんしるしのひかり', kind: 'skill', mp: 0, target: 'enemy', hidden: true, role: 'dmg',
    effect: { type: 'magic', element: 'light', base: [190, 220], thr: 85 },
    desc: 'しるしをつけた敵1体に、光の大きなはんこを落とす。', cast: '{a}は番天印を空になげた！', anim: 'holy',
  },
  r88u_inyo: {
    name: 'いん陽鏡・光のあみ', kana: 'いんようきょうひかりのあみ', kind: 'skill', mp: 0, target: 'group', hidden: true, role: 'dmg',
    effect: { type: 'magic', element: 'light', base: [120, 140], thr: 75 },
    desc: 'いくつものかがみで光を集めて、同じ種類の敵みんなをうつ。', cast: '{a}のいん陽鏡が、光をはねかえした！', anim: 'mirror_glow',
  },
  r88u_kinto: {
    name: '混元金と・すいこみ', kana: 'こんげんきんとすいこみ', kind: 'skill', mp: 0, target: 'enemy', hidden: true, role: 'sup',
    effect: { type: 'status', status: 'paralyze', chance: 0.85, turns: [2, 2] },
    desc: 'つぼに敵1体をすいこんで、しばらく動けなくする（大きな敵にはききにくい）。', cast: '{a}が混元金とのふたを開けた！', anim: 'whirlpool',
  },
  r88u_jin_kanpyo: {
    name: '寒氷じん', kana: 'かんぴょうじん', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'dmg',
    effect: { type: 'magic', element: 'ice', base: [95, 110], thr: 70 },
    desc: '寒氷じんを開いて、ふぶきと氷のかたまりで敵全体をうつ。', cast: '{a}がお札をかかげると、あたりがこおりついた！', anim: 'blizzard',
  },
  r88u_jin_retsuen: {
    name: '烈炎じん', kana: 'れつえんじん', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'dmg',
    effect: { type: 'magic', element: 'fire', base: [95, 110], thr: 70 },
    desc: '烈炎じんを開いて、炎で敵全体をうつ。', cast: '{a}がお札をかかげると、あたりが炎につつまれた！', anim: 'fire3',
  },
  r88u_jin_fuko: {
    name: '風こうじん', kana: 'ふうこうじん', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'dmg',
    effect: { type: 'magic', element: 'wind', base: [95, 110], thr: 70 },
    desc: '風こうじんを開いて、たつまきで敵全体をうつ。', cast: '{a}がお札をかかげると、たつまきが起きた！', anim: 'wind2',
  },
  r88u_jin_tenzetsu: {
    name: '天絶じん', kana: 'てんぜつじん', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'dmg',
    effect: { type: 'phys', mult: 1.5 },
    desc: '天絶じんを開いて、いん石をふらせて敵全体をうつ。', cast: '{a}がお札をかかげると、空からいん石がふってきた！', anim: 'meteor',
  },
  r88u_jin_kosa: {
    name: '紅砂じん', kana: 'こうさじん', kind: 'skill', mp: 0, target: 'self', hidden: true, role: 'sup',
    effect: { type: 'buff', stat: 'eva', add: 0.4, dur: 30 },
    desc: '紅砂じんを開いて、砂の中を一しゅんで動き、敵の攻撃をかわしやすくなる。', cast: '{a}のまわりに、赤い砂がまい上がった！', anim: 'buff',
  },
  r88u_jin_kinko: {
    name: '金光じん', kana: 'きんこうじん', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'sup',
    effect: { type: 'status', status: 'confuse', chance: 0.5, turns: [1, 3] },
    desc: '金光じんを開いて、光をまげて敵全体の目をくらませ、混乱させる。', cast: '{a}がお札をかかげると、金色の光がうずまいた！', anim: 'debuff',
  },
  // ── G2班: スレイヤーズ ──
  r88u_hikari: {
    name: '光の剣・光のやいば', kana: 'ひかりのけんひかりのやいば', kind: 'skill', mp: 0, target: 'enemy', hidden: true, role: 'dmg',
    effect: { type: 'phys', mult: 3.4, element: 'light' },
    desc: '光のやいばを長くのばして、敵1体を切りさく。', cast: '{a}が「光よ！」とさけぶと、光のやいばがのびた！', anim: 'r88_hikari',
  },
  r88u_demonblood: {
    name: '魔血玉の力', kana: 'まけつぎょくのちから', kind: 'skill', mp: 0, target: 'self', hidden: true, role: 'sup',
    effect: { type: 'buff', stat: 'mag', mult: 1.5, dur: 30 },
    desc: '4つの玉の力をときはなって、しばらく攻撃魔力を大きく上げる。', cast: '{a}の4つの玉が、青・白・黒・赤に光った！', anim: 'buff',
  },
  r88u_kage: {
    name: '影の鏡・かげうち', kana: 'かげのかがみかげうち', kind: 'skill', mp: 0, target: 'enemy', hidden: true, role: 'dmg',
    effect: { type: 'magic', element: 'dark', base: [180, 210], thr: 80 },
    desc: '影の鏡に敵をうつして、その敵の「かげ」におそわせる。', cast: '{a}の影の鏡から、{t}のかげがとび出した！', anim: 'dark1',
  },
  r88u_juho: {
    name: '呪法球・雷雲', kana: 'じゅほうきゅうらいうん', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'dmg',
    effect: { type: 'magic', element: 'bolt', base: [105, 120], thr: 75 },
    desc: '空をくもらせて、敵全体に雷を落とす。', cast: '{a}が呪法球をかかげると、空がくもった！', anim: 'bolt2',
  },
  // ── G2班: 烈火の炎（魔導具）──
  r88u_kazetsume: {
    name: '風のツメ・かまいたち', kana: 'かぜのつめかまいたち', kind: 'skill', mp: 0, target: 'enemy', hidden: true, role: 'dmg',
    effect: { type: 'magic', element: 'wind', base: [140, 165], thr: 75 },
    desc: '風のやいばをとばして、敵1体を切りさく。', cast: '{a}のツメから、風のやいばがとんだ！', anim: 'wind1',
  },
  r88u_fujin: {
    name: '風神・風こん', kana: 'ふうじんふうこん', kind: 'skill', mp: 0, target: 'group', hidden: true, role: 'dmg',
    effect: { type: 'magic', element: 'wind', base: [150, 175], thr: 80 },
    desc: '風神で大きなつむじ風を起こし、風のやいばで同じ種類の敵みんなを切りさく。', cast: '{a}の風神が、うなりを上げた！', anim: 'r88_fujin',
  },
  r88u_ensui: {
    name: 'えん水・水のやいば', kana: 'えんすいみずのやいば', kind: 'skill', mp: 0, target: 'enemy', hidden: true, role: 'dmg',
    effect: { type: 'multi', parts: [{ type: 'magic', element: 'ice', base: [150, 175], thr: 75 }, { type: 'atbSet', sub: 35, chance: 0.6, msg: '{t}はこおりついて、動きがおそくなった！', failMsg: '{t}はこおらなかった！' }] },
    desc: '水のやいばで敵1体を切り、こおらせて動きをおそくする。', cast: '{a}のえん水から、水のやいばがのびた！', anim: 'ice2',
  },
  r88u_tetsugan: {
    name: '鉄丸・鉄の体', kana: 'てつがんてつのからだ', kind: 'skill', mp: 0, target: 'self', hidden: true, role: 'sup',
    effect: { type: 'buff', stat: 'def', mult: 1.8, dur: 30 },
    desc: '鉄丸をのみこんで、体を鉄のようにかたくする。守備力が大きく上がる。', cast: '{a}の体が、鉄のようにかたくなった！', anim: 'guard',
  },
  r88u_kuchibashi: {
    name: 'くちばし王・しばり', kana: 'くちばしおうしばり', kind: 'skill', mp: 0, target: 'enemy', hidden: true, role: 'dmg',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 1.8 }, { type: 'atbSet', sub: 40, chance: 0.65, msg: '{t}はくさりにしばられた！', failMsg: '{t}はくさりをふりほどいた！' }] },
    desc: 'くさりで敵1体をうってしばり、動きをおそくする。', cast: '{a}のくちばし王が、くさりをのばした！', anim: 'whip',
  },
  r88u_eikai: {
    name: '影界玉・かげわたり', kana: 'えいかいぎょくかげわたり', kind: 'skill', mp: 0, target: 'self', hidden: true, role: 'sup',
    effect: { type: 'escape' },
    desc: 'かげを通って、みんなで戦いからにげ出す（にげられない戦いはだめ）。', cast: '{a}の影界玉が、あやしく光った…！', anim: 'none',
  },
  r88u_shikigami: {
    name: '式がみ・かみしばり', kana: 'しきがみかみしばり', kind: 'skill', mp: 0, target: 'enemy', hidden: true, role: 'sup',
    effect: { type: 'status', status: 'paralyze', chance: 0.7, turns: [1, 2] },
    desc: 'かみの毛をのばして、敵1体をしばってマヒさせる。', cast: '{a}のかみの毛が、するするとのびた！', anim: 'debuff',
  },
  r88u_raijin: {
    name: '雷神・いかずち', kana: 'らいじんいかずち', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'dmg',
    effect: { type: 'magic', element: 'bolt', base: [160, 190], thr: 85 },
    desc: 'つけた人のHPを少し使って、敵全体に大きな雷を落とす。', cast: '{a}の雷神が、ばちばちと光った！', anim: 'r88_raijin',
  },
  r88u_hyoma: {
    name: '氷魔えん・氷のはしら', kana: 'ひょうまえんこおりのはしら', kind: 'skill', mp: 0, target: 'group', hidden: true, role: 'dmg',
    effect: { type: 'magic', element: 'ice', base: [140, 165], thr: 75 },
    desc: '氷のはしらを立てて、同じ種類の敵みんなをうつ。', cast: '{a}の氷魔えんが、つめたい声でわらった！', anim: 'ice2',
  },
  r88u_taishaku: {
    name: 'たいしゃくかい天・重力', kana: 'たいしゃくかいてんじゅうりょく', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'sup',
    effect: { type: 'atbSet', sub: 35, chance: 0.6, msg: '{t}は重くなって、動きがおそくなった！', failMsg: '{t}には重力がきかなかった！' },
    desc: '重力で敵全体を重くして、動きをおそくする。', cast: '{a}がほこをつき立てると、ずしりと重くなった！', anim: 'debuff',
  },
  r88u_gedoku: {
    name: '解毒丸をのむ', kana: 'げどくがんをのむ', kind: 'skill', mp: 0, target: 'self', hidden: true, role: 'sup',
    effect: { type: 'cure', statuses: ['poison'] },
    desc: '解毒丸をのんで、自分の毒を治す。', cast: '{a}は解毒丸をのみこんだ！', anim: 'heal1',
  },
  r88u_fukyo: {
    name: '不きょう和音・しょうげきは', kana: 'ふきょうわおんしょうげきは', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'dmg',
    effect: { type: 'phys', mult: 1.5 },
    desc: 'ためた音をしょうげきはにして、敵全体をうつ。', cast: '{a}のむね当てから、ものすごい音がひびいた！', anim: 'blast2',
  },
  r88u_kotodama: {
    name: '言だま・かつもく', kana: 'ことだまかつもく', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'sup',
    effect: { type: 'status', status: 'sleep', chance: 0.5, turns: [1, 3] },
    desc: '「かつもく！」の合図で敵全体にまぼろしを見せて、ねむらせる。', cast: '{a}は「かつもく！」とさけんだ！', anim: 'sleep',
  },
  r88u_mugen: {
    name: '夢幻・ちぢみ', kana: 'むげんちぢみ', kind: 'skill', mp: 0, target: 'enemy', hidden: true, role: 'sup',
    effect: { type: 'debuff', stat: 'atk', mult: 0.6, dur: 40, chance: 0.9 },
    desc: '敵1体をちぢめて、攻撃力を大きく下げる。', cast: '{a}のつえが光ると、{t}がちぢんでいく！', anim: 'debuff',
  },
  r88u_oboro: {
    name: 'おぼろ・すがた消し', kana: 'おぼろすがたけし', kind: 'skill', mp: 0, target: 'self', hidden: true, role: 'sup',
    effect: { type: 'buff', stat: 'eva', add: 0.45, dur: 30 },
    desc: '布をかぶってすがたを消し、敵の攻撃をかわしやすくなる。', cast: '{a}はおぼろをかぶって、すうっと消えた！', anim: 'buff',
  },
  r88u_jigen: {
    name: '次元界玉・次元とばし', kana: 'じげんかいぎょくじげんとばし', kind: 'skill', mp: 0, target: 'enemy', hidden: true, role: 'sup',
    effect: { type: 'banish', chance: 0.6, msg: '{t}はべつの次元へとばされた！', failMsg: '{t}は次元のすきまをふみこらえた！' },
    desc: '敵1体をべつの次元へとばして、戦いから外す（大きな敵にはきかない）。', cast: '{a}の次元界玉が、空間をゆがめた！', anim: 'void',
  },
  r88u_sekkon: {
    name: '石こん・岩なだれ', kana: 'せっこんいわなだれ', kind: 'skill', mp: 0, target: 'group', hidden: true, role: 'dmg',
    effect: { type: 'phys', mult: 1.6 },
    desc: '岩をあやつって、同じ種類の敵みんなに岩をぶつける。', cast: '{a}が石こんで地面をたたくと、岩がうき上がった！', anim: 'quake',
  },
  r88u_kokai: {
    name: '光界玉・光の無', kana: 'こうかいぎょくひかりのむ', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'dmg',
    effect: { type: 'magic', element: 'light', base: [160, 190], thr: 85 },
    desc: 'まぶしい光で敵全体をつつみこむ。', cast: '{a}の光界玉が、まっ白にかがやいた！', anim: 'holy',
  },
  r88u_shiko: {
    name: '神りょ思考・心あやつり', kana: 'しんりょしこうこころあやつり', kind: 'skill', mp: 0, target: 'enemy', hidden: true, role: 'sup',
    effect: { type: 'status', status: 'confuse', chance: 0.7, turns: [1, 3] },
    desc: '敵1体の心に入って、混乱させる。', cast: '{a}は{t}の心の中に入りこんだ…！', anim: 'debuff',
  },
  r88u_rinne: {
    name: '輪ね・年をとらせる', kana: 'りんねとしをとらせる', kind: 'skill', mp: 0, target: 'enemy', hidden: true, role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'debuff', stat: 'atk', mult: 0.75, dur: 40, chance: 0.9 }, { type: 'debuff', stat: 'agi', mult: 0.75, dur: 40, chance: 0.9 }] },
    desc: '敵1体の年をとらせて、攻撃力と素早さを下げる。', cast: '{a}の輪ねが回ると、{t}の時間が速くすすんだ！', anim: 'debuff',
  },
  // ── G7班: 犬夜しゃ ──
  r88u_iy_aka: {
    name: '赤い刀・けっかいやぶり', kana: 'あかいかたなけっかいやぶり', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'sup',
    effect: { type: 'dispel' },
    desc: '赤くそまった鉄さいがで、敵全体の強くなっていた力を消す。', cast: '{a}の鉄さいがが、まっ赤にそまった！', anim: 'r82a_red',
  },
  r88u_iy_meido: {
    name: '黒い鉄さいが・三日月の道', kana: 'くろいてっさいがみかづきのみち', kind: 'skill', mp: 0, target: 'group', hidden: true, role: 'dmg',
    effect: { type: 'magic', element: 'dark', base: [170, 200], thr: 85 },
    desc: '三日月の形の道をひらいて、同じ種類の敵みんなをのみこむ。', cast: '{a}が黒い鉄さいがをふると、空に三日月の道がひらいた！', anim: 'r82a_moon',
  },
  r88u_iy_tenseiga: {
    name: 'てんせいが・いのちの光', kana: 'てんせいがいのちのひかり', kind: 'skill', mp: 0, target: 'deadAlly', hidden: true, role: 'heal',
    effect: { type: 'revive', hpRatio: 0.5 },
    desc: 'たおれた仲間1人を、HPを半分にして生き返らせる。', cast: '{a}がてんせいがをふると、やさしい光があふれた！', anim: 'revive',
  },
  r88u_iy_kazaana: {
    name: '風あな・すいこみ', kana: 'かざあなすいこみ', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'sup',
    effect: { type: 'banish', chance: 0.6, msg: '{t}は風あなにすいこまれた！', failMsg: '{t}はすいこまれずにふみこらえた！' },
    desc: 'つけた人のHPを少し使って、風あなで敵みんなをすいこむ（大きな敵にはきかない）。', cast: '{a}が数じゅをほどくと、手のひらに大きな風がうずをまいた！', anim: 'wind2',
  },
  r88u_iy_ningyo: {
    name: '石の人形・おもし', kana: 'いしのにんぎょうおもし', kind: 'skill', mp: 0, target: 'enemy', hidden: true, role: 'sup',
    effect: { type: 'status', status: 'paralyze', chance: 0.7, turns: [1, 2] },
    desc: '石の人形をくっつけて、敵1体を重くしてマヒさせる。', cast: '{a}は石の人形を{t}になげつけた！', anim: 'debuff',
  },
  r88u_iy_ryuraisen: {
    name: 'ばん竜・竜雷せん', kana: 'ばんりゅうりゅうらいせん', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'dmg',
    effect: { type: 'magic', element: 'bolt', base: [100, 115], thr: 75 },
    desc: '雷を空にはなって、敵全体に落とす。', cast: '{a}がばん竜を空につき上げた！', anim: 'bolt2',
  },
  // ── G7班: ゆう☆遊☆白書 ──
  r88u_yh_mejirushi: {
    name: '目じるしール・ぺたり', kana: 'めじるしーるぺたり', kind: 'skill', mp: 0, target: 'enemy', hidden: true, role: 'sup',
    effect: { type: 'debuff', stat: 'agi', mult: 0.7, dur: 40, chance: 0.9 },
    desc: '敵1体に目じるしのシールをはって、素早さを下げる。', cast: '{a}は{t}に、ぺたりとシールをはった！', anim: 'debuff',
  },
  r88u_yh_jigento: {
    name: '次元刀・空間切り', kana: 'じげんとうくうかんぎり', kind: 'skill', mp: 0, target: 'enemy', hidden: true, role: 'dmg',
    effect: { type: 'phys', mult: 3.0, ignoreDef: 0.6 },
    desc: '空間ごと切りさいて、敵1体に守りをむしした大ダメージ。', cast: '{a}の次元刀が、空間をまっぷたつに切りさいた！', anim: 'r88_jigento',
  },
  r88u_yh_mafuukan: {
    name: 'おしゃぶり・ためた力', kana: 'おしゃぶりためたちから', kind: 'skill', mp: 0, target: 'allies', hidden: true, role: 'sup',
    effect: { type: 'buff', stat: 'def', mult: 1.4, dur: 30 },
    desc: 'おしゃぶりにためた力をはなって、仲間みんなの守備力を上げる。', cast: '{a}のおしゃぶりが、まぶしく光った！', anim: 'buff',
  },
  r88u_yh_tane: {
    name: '植物のつる・しばり', kana: 'しょくぶつのつるしばり', kind: 'skill', mp: 0, target: 'enemy', hidden: true, role: 'sup',
    effect: { type: 'status', status: 'paralyze', chance: 0.7, turns: [1, 2] },
    desc: 'たねからつるをのばして、敵1体をしばってマヒさせる。', cast: '{a}がたねをまくと、つるがぐんぐんのびた！', anim: 'debuff',
  },
  r88u_yh_zense: {
    name: '前世の実・むかしのすがた', kana: 'ぜんせのみむかしのすがた', kind: 'skill', mp: 0, target: 'self', hidden: true, role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'mag'], mult: 1.4, dur: 30 },
    desc: 'むかしのすがたにもどって、しばらく攻撃力と魔力が大きく上がる。', cast: '{a}は前世の実を食べた！むかしのすがたにもどっていく…！', anim: 'buff',
  },
  r88u_yh_ankoku: {
    name: '暗黒鏡・ねがい', kana: 'あんこくきょうねがい', kind: 'skill', mp: 0, target: 'ally', hidden: true, role: 'heal',
    effect: { type: 'heal', base: [99999, 99999], fixed: true },
    desc: 'つけた人のHPを半分使って、仲間1人のHPをすっかり回復する。', cast: '{a}は暗黒鏡にねがいをこめた…！', anim: 'heal1',
  },
  r88u_yh_kibidango: {
    name: 'き美団子・化け', kana: 'きびだんごばけ', kind: 'skill', mp: 0, target: 'self', hidden: true, role: 'sup',
    effect: { type: 'buff', stat: 'def', mult: 1.8, dur: 30 },
    desc: 'かたい体のすがたに化けて、守備力が大きく上がる。', cast: '{a}はき美団子を食べて、すがたをかえた！', anim: 'buff',
  },
};

// ───── G8班: らんま1/2・地獄先生ぬ〜べ〜（ほかの 係の 行と ぶつからない ように、ファイルの さいごで まぜる）─────
Object.assign(R88_ABILITIES, {
  // ── らんま1/2 ──
  r88u_shisui: {
    name: '止水おけ・すがたかため', kana: 'しすいおけすがたかため', kind: 'skill', mp: 0, target: 'enemy', hidden: true, role: 'sup',
    effect: { type: 'status', status: 'paralyze', chance: 0.7, turns: [1, 2] },
    desc: '止水おけの水をかけて、敵1体のすがたをかため、マヒさせる。', cast: '{a}は止水おけの水を、{t}にざぶんとかけた！', anim: 'ice1',
  },
  r88u_kaisui: {
    name: '開水つぼ・お湯', kana: 'かいすいつぼおゆ', kind: 'skill', mp: 0, target: 'allies', hidden: true, role: 'sup',
    effect: { type: 'dispel' },
    desc: 'わかしたお湯をかけて、仲間みんなの弱くなっていた力を元にもどす。', cast: '{a}の開水つぼから、ほかほかのお湯がわき出した！', anim: 'heal2',
  },
  r88u_senpatsu: {
    name: 'わすれのつぼおし', kana: 'わすれのつぼおし', kind: 'skill', mp: 0, target: 'enemy', hidden: true, role: 'sup',
    effect: { type: 'status', status: 'confuse', chance: 0.7, turns: [1, 3] },
    desc: 'シャンプーとつぼおしで、敵1体に何をするのかわすれさせて、混乱させる。', cast: '{a}は{t}の頭を、あわあわにした！', anim: 'debuff',
  },
  r88u_shibire: {
    name: 'しびれ薬をまく', kana: 'しびれぐすりをまく', kind: 'skill', mp: 0, target: 'enemy', hidden: true, role: 'sup',
    effect: { type: 'status', status: 'paralyze', chance: 0.7, turns: [1, 2] },
    desc: 'しびれ薬をまいて、敵1体をマヒさせる。', cast: '{a}は花びらといっしょに、しびれ薬をまいた！', anim: 'debuff',
  },
  r88u_hanten: {
    name: '反転宝じゅ・さかさの心', kana: 'はんてんほうじゅさかさのこころ', kind: 'skill', mp: 0, target: 'enemy', hidden: true, role: 'sup',
    effect: { type: 'status', status: 'confuse', chance: 0.7, turns: [1, 3] },
    desc: 'ブローチをさかさにして、敵1体の心をさかさにし、混乱させる。', cast: '{a}は反転宝じゅを、くるりとさかさにした！', anim: 'debuff',
  },
  r88u_kaen: {
    name: '火炎じょう・竜の炎', kana: 'かえんじょうりゅうのほのお', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'dmg',
    effect: { type: 'magic', element: 'fire', base: [105, 120], thr: 75 },
    desc: 'つえで地面をつくと、竜が大きな炎をはいて、敵全体をつつむ。', cast: '{a}が火炎じょうで地面をつくと、竜が目をさました！', anim: 'r88_kaen',
  },
  r88u_houyou: {
    name: '熱愛ほうよう香・合言葉', kana: 'ねつあいほうようこうあいことば', kind: 'skill', mp: 0, target: 'enemy', hidden: true, role: 'sup',
    effect: { type: 'atbSet', sub: 60, chance: 0.8, msg: '{t}はお香にうっとりして、動きが止まった！', failMsg: '{t}は、はなをつまんだ！' },
    desc: 'お香をかがせて合言葉を言い、敵1体の動きを少しの間止める。', cast: '{a}はお香をかがせて、合言葉をとなえた！', anim: 'sleep',
  },
  r88u_horegusuri: {
    name: 'ほれ薬・一しゅん玉', kana: 'ほれぐすりいっしゅんだま', kind: 'skill', mp: 0, target: 'enemy', hidden: true, role: 'sup',
    effect: { type: 'atbSet', sub: 60, chance: 0.8, msg: '{t}はぽーっとなって、動きが止まった！', failMsg: '{t}は、首をぶんぶんとふった！' },
    desc: 'うで輪の一しゅん玉で、敵1体の動きを少しの間止める。', cast: '{a}は、うで輪の一しゅん玉をかざした！', anim: 'sleep',
  },
  r88u_nanban: {
    name: 'なんばんミラー・時わたり', kana: 'なんばんみらーときわたり', kind: 'skill', mp: 0, target: 'self', hidden: true, role: 'sup',
    effect: { type: 'escape' },
    desc: 'かがみの力で、みんなで戦いからにげ出す（にげられない戦いはだめ）。', cast: '{a}のなんばんミラーが、ぴかっと光った…！', anim: 'none',
  },
  r88u_happo: {
    name: '八宝大か輪・大花火', kana: 'はっぽうだいかりんおおはなび', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'dmg',
    effect: { type: 'magic', element: 'fire', base: [100, 115], thr: 70 },
    desc: '大きな花火玉を投げて、敵全体の上で、はでにはれつさせる。', cast: '{a}は、大きな花火玉に火をつけて投げた！', anim: 'r88_hanabi',
  },
  // ── 地獄先生ぬ〜べ〜 ──
  r88u_onite: {
    name: 'おにの手・本気の一げき', kana: 'おにのてほんきのいちげき', kind: 'skill', mp: 0, target: 'enemy', hidden: true, role: 'dmg',
    effect: { type: 'phys', mult: 3.4 },
    desc: '黒い手ぶくろを外して、おにの手で敵1体を思いきり打つ。形のないものにもとどく。', cast: '{a}は手ぶくろを外した！「生徒には、手出しさせん！」', anim: 'r88_onite',
  },
  r88u_suisho: {
    name: 'れい水しょう・正体あばき', kana: 'れいすいしょうしょうたいあばき', kind: 'skill', mp: 0, target: 'enemy', hidden: true, role: 'sup',
    effect: { type: 'debuff', stat: 'def', mult: 0.6, dur: 40, chance: 0.9 },
    desc: '水しょうの玉を投げつけて、敵1体の正体をあばき、守備力を大きく下げる。', cast: '{a}は、れい水しょうを{t}に投げつけた！', anim: 'debuff',
  },
  r88u_okiwa: {
    name: '御おに輪・おにの刀', kana: 'ぎょきりんおにのかたな', kind: 'skill', mp: 0, target: 'group', hidden: true, role: 'dmg',
    effect: { type: 'phys', mult: 1.8 },
    desc: 'おにの手を大きな刀の形にかえて、同じ種類の敵みんなを切る。', cast: '{a}のおにの手が、大きな刀の形にかわった！', anim: 'slash_heavy',
  },
  r88u_karin: {
    name: '火輪びの術・きつね火', kana: 'かりんびのじゅつきつねび', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'dmg',
    effect: { type: 'magic', element: 'fire', base: [100, 115], thr: 70 },
    desc: 'とても熱いきつね火をおこして、敵全体をつつむ。', cast: '{a}がお札をかかげると、青白いきつね火がうずを巻いた！', anim: 'fire3',
  },
});

// ───── G9班: ドラゴンボール・ワンピース（ほかの 係の 行と ぶつからない ように、ファイルの さいごで まぜる）─────
//   天候棒の 4つ（r88u_op_cyclone・thunderbolt・raiun・zeus）と、天候の 職業が 持つ 時の 晴れ（mirage）・雨（rain）は
//   品の use.weather で えらぶ（shared/battle-r88.js の useAbilityOf）
Object.assign(R88_ABILITIES, {
  // ── ドラゴンボール ──
  r88u_db_mafuba: {
    name: '魔ふうば', kana: 'まふうば', kind: 'skill', mp: 0, target: 'enemy', hidden: true, role: 'sup',
    effect: { type: 'status', status: 'paralyze', chance: 0.85, turns: [2, 2] },
    desc: 'うずまく風で敵1体をつつみ、電子ジャーにふうじこめて、少しの間動けなくする（大きな敵にはききにくい）。', cast: '{a}は両手をつき出した！「魔ふうば！」', anim: 'wind2',
  },
  r88u_db_senzu: {
    name: 'せん豆を食べる', kana: 'せんずをたべる', kind: 'skill', mp: 0, target: 'self', hidden: true, role: 'heal',
    effect: { type: 'heal', base: [99999, 99999], fixed: true },
    desc: 'せん豆を1つぶ食べて、自分のHPを全部回復する。', cast: '{a}は、せん豆を1つぶ、ぽりぽり食べた！', anim: 'heal1',
  },
  r88u_db_stop: {
    name: 'きん急停止スイッチ', kana: 'きんきゅうていしすいっち', kind: 'skill', mp: 0, target: 'enemy', hidden: true, role: 'sup',
    effect: { type: 'status', status: 'paralyze', chance: 0.75, turns: [1, 2] },
    desc: 'コントローラーのボタンをおして、敵1体をマヒさせる（大きな敵にはききにくい）。', cast: '{a}は、コントローラーのボタンをおした！', anim: 'debuff',
  },
  r88u_db_whis: {
    name: '時もどし', kana: 'ときもどし', kind: 'skill', mp: 0, target: 'self', hidden: true, role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [99999, 99999], fixed: true }, { type: 'mpHeal', base: [9999, 9999] }] },
    desc: 'つえで地面をこつんとついて、時を3分もどす。自分のHPとMPが、戦いの始めのように元にもどる。', cast: '{a}がつえで地面をこつんとつくと、時がさかさに流れ始めた…！', anim: 'r88_whis',
  },
  // ── ワンピース ──
  r88u_op_rumble: {
    name: 'ランブル', kana: 'らんぶる', kind: 'skill', mp: 0, target: 'self', hidden: true, role: 'sup',
    effect: { type: 'buff', stat: 'atk', mult: 1.4, dur: 30 },
    desc: 'ランブルボールをかじって、少しの間、攻撃力を上げる。', cast: '{a}は、ランブルボールをがりっとかじった！', anim: 'buff',
  },
  r88u_op_reject: {
    name: 'はいげき', kana: 'はいげき', kind: 'skill', mp: 0, target: 'enemy', hidden: true, role: 'dmg',
    effect: { type: 'phys', mult: 3.4 },
    desc: 'ためた力を10倍にして、敵1体に大きな一げき。使った人のHPも少しへる。', cast: '{a}は、はいげき貝を{t}におしあてた！', anim: 'blast2',
  },
  r88u_op_murakumo: {
    name: 'むら雲切・大地ゆらし', kana: 'むらくもぎりだいちゆらし', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'dmg',
    effect: { type: 'phys', mult: 1.8 },
    desc: 'なぎなたで大地をたたいて、地面ごとゆらし、敵全体を打つ。', cast: '{a}がむら雲切をふり下ろすと、大地が大きくゆれた！', anim: 'quake',
  },
  r88u_op_shikomi: {
    name: '重力の雨', kana: 'じゅうりょくのあめ', kind: 'skill', mp: 0, target: 'group', hidden: true, role: 'sup',
    effect: { type: 'debuff', stat: 'agi', mult: 0.6, dur: 40, chance: 0.9 },
    desc: '空から重さをかけて、同じ種類の敵みんなの素早さを大きく下げる。', cast: '{a}がつえをぬくと、空から見えない重さがのしかかった！', anim: 'debuff',
  },
  // 天候棒の 4だん（かみなりの 天気・天候の 職業で ない 人）
  r88u_op_cyclone: {
    name: 'サイクロン＝テンポ', kana: 'さいくろんてんぽ', kind: 'skill', mp: 0, target: 'enemy', hidden: true, role: 'dmg',
    effect: { type: 'magic', element: 'wind', base: [150, 175], thr: 70 },
    desc: 'つめたい風と暖かい風の玉をぶつけて、小さなたつまきをおこす。敵1体に風のダメージ。', cast: '{a}は天候棒から、つめたい玉と暖かい玉をとばした！', anim: 'wind2',
  },
  r88u_op_thunderbolt: {
    name: 'サンダーボルト＝テンポ', kana: 'さんだーぼるとてんぽ', kind: 'skill', mp: 0, target: 'group', hidden: true, role: 'dmg',
    effect: { type: 'magic', element: 'bolt', base: [120, 140], thr: 75 },
    desc: '天候棒で作った雷雲から、同じ種類の敵みんなに雷を落とす。', cast: '{a}の天候棒から、小さな雷雲がわき上がった！', anim: 'bolt2',
  },
  r88u_op_raiun: {
    name: 'ブラックボール・雷雲ロッド', kana: 'ぶらっくぼーるらいうんろっど', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'dmg',
    effect: { type: 'magic', element: 'bolt', base: [105, 120], thr: 75 },
    desc: '黒い雷雲の玉をいくつもうかべて、敵全体に雷を落とす。', cast: '{a}は天候棒から、黒い雲の玉をつぎつぎにうかべた！', anim: 'bolt2',
  },
  r88u_op_zeus: {
    name: '雷げき・ゼウス', kana: 'らいげきぜうす', kind: 'skill', mp: 0, target: 'enemies', hidden: true, role: 'dmg',
    effect: { type: 'magic', element: 'bolt', base: [160, 190], thr: 85 },
    desc: 'しゃべる雷雲ゼウスをよび出して、敵全体に大きな雷を落とす。', cast: '{a}「ゼウス！」天候棒の雷雲が、大きくふくれ上がった！', anim: 'r88_zeus',
  },
  // 天候の 職業が 持つ 時（晴れ・雨）
  r88u_op_mirage: {
    name: 'ミラージュ＝テンポ', kana: 'みらーじゅてんぽ', kind: 'skill', mp: 0, target: 'allies', hidden: true, role: 'sup',
    effect: { type: 'buff', stat: 'eva', add: 0.3, dur: 30 },
    desc: '晴れた空の熱で、しんきろうを作る。少しの間、仲間全員が敵の攻撃をかわしやすくなる。', cast: '{a}が天候棒をふると、あたりの景色がゆらゆらとゆれ始めた…！', anim: 'buff',
  },
  r88u_op_rain: {
    name: 'レイン＝テンポ', kana: 'れいんてんぽ', kind: 'skill', mp: 0, target: 'allies', hidden: true, role: 'heal',
    effect: { type: 'heal', base: [70, 90], thr: 40 },
    desc: '雨雲から、やさしい雨をふらせる。仲間全員のHPを少し回復する。', cast: '{a}の天候棒から、しとしとと雨がふりだした…', anim: 'heal2',
  },
});
