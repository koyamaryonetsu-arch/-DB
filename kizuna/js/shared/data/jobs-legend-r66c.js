// 第66回 C班: 伝説の職業（tier 3。お仕事・なぞの組織）。docs/plan-r66-legend.md
//   総理大臣・会長・働き方改革の星・あの方
// ・jobs.js が JOBS に まぜる（ならびは LEGEND_R66C_ORDER。JOBS に ある 物だけ LEGEND_ORDER に 入る）
// ・技は abilities-r66c.js・ひらめき技は hirameki-r66c.js・戦いの とくべつな しくみ（お金の 守り・定時の 回復）は battle-r66c.js
// ・名前は 家族が 決めた（総理大臣・会長・働き方改革の星・あの方。字は ぜんぶ 使える 字）
//
//   総理大臣       … キャリア組（＋ほかの 超級職 1つ）。国を 動かす 号令で、仲間全員を 大きく 強く する
//   会長           … 社長 か たたき上げ社長（reqAlt。どちらか 1つ。表の とおり「ほかの 超級職」は いらない）。
//                    お金を 力に 変える（お金を 使って 敵全体に ダメージ・ボディーガードを やとって 守る。どちらも オートでは 使わない）
//   働き方改革の星 … ブラックきぎょうの星（＋ほかの 超級職 1つ）。「HPが 少ないほど 強い」を 卒業して、
//                    定時で 帰って しっかり 休む（passive.teiji … 自分の 番の たびに 最大HPの 5% 回復。battle-r66c.js）
//   あの方         … 黒の組織（＋ほかの 超級職 1つ）。なぞの 組織の ボス。敵を 弱らせる 技が 得意
export const LEGEND_R66C_ORDER = ['souri', 'kaichou', 'hatarakikata', 'ano_kata'];
export const LEGEND_R66C_JOBS = {
  // キャリア組 → 総理大臣（キャリア組と ほかの 超級職 1つ）
  souri: {
    id: 'souri', name: '総理大臣', kana: 'そうりだいじん', short: '総理', tier: 3, req: ['career'], reqSuper: 1, family: 'tech', color: '#3a2f6a',
    desc: '国のいちばん上に立って、みんなを引っぱるリーダー。キャリア組と、ほかの超級職を1つきわめた者だけがなれる。国を動かす号令で、仲間全員を大きく強くする。',
    mods: { hp: 1.55, mp: 1.5, str: 1.3, def: 1.5, agi: 1.2, mag: 1.4, heal: 1.35 },
    weapons: ['dagger', 'staff', 'spear', 'sword', 'fan', 'none'], shield: true, armor: ['cloth', 'robe', 'heavy'], helm: true,
    perLv: { def: 1, mp: 1, heal: 1 },
    learn: [[1, 'sor_enzetsu'], [2, 'sor_kakugi'], [3, 'sor_touben'], [5, 'sor_kyufu'], [7, 'sor_kaisan'], [8, 'sor_summit'], [10, 'souri_sig']],
  },
  // 社長 か たたき上げ社長 → 会長（どちらか 1つを きわめる）
  kaichou: {
    id: 'kaichou', name: '会長', kana: 'かいちょう', short: '会長', tier: 3, req: ['shacho', 'tatakiage'], family: 'tech', color: '#c89a2a',
    desc: 'いくつもの会社をたばねる、グループのいちばん上の人。社長とたたき上げ社長の両方をきわめた者だけがなれる。お金を力に変えて、お札で敵をけちらし、ボディーガードをやとって仲間を守る。戦いで手に入るお金もとてもふえる。',
    mods: { hp: 1.6, mp: 1.35, str: 1.5, def: 1.5, agi: 1.25, mag: 1.25, heal: 1.3 },
    weapons: ['dagger', 'staff', 'fan', 'sword', 'axe', 'none'], shield: true, armor: ['cloth', 'robe', 'heavy', 'gi'], helm: true,
    perLv: { hp: 1, str: 1, def: 1 },
    passive: { gold: 1.6 },
    learn: [[1, 'kch_hanko'], [2, 'kch_guard'], [3, 'kch_okotoba'], [5, 'kch_satsutaba'], [7, 'kch_bonus'], [8, 'kch_group'], [10, 'kaichou_sig']],
  },
  // ブラックきぎょうの星 → 働き方改革の星（ブラックきぎょうの星と ほかの 超級職 1つ）
  hatarakikata: {
    id: 'hatarakikata', name: '働き方改革の星', kana: 'はたらきかたかいかくのほし', short: '改革星', tier: 3, req: ['black_star'], reqSuper: 1, family: 'tech', color: '#3aa86a',
    desc: '「HPが少ないほど強い」を卒業して、定時でちゃんと帰る、働き方のお手本。ブラックきぎょうの星と、ほかの超級職を1つきわめた者だけがなれる。しっかり休むので、自分の番のたびにHPが少し回復する。',
    mods: { hp: 1.7, mp: 1.2, str: 1.65, def: 1.45, agi: 1.35, mag: 0.95, heal: 1.4 },
    weapons: ['dagger', 'staff', 'fan', 'axe', 'sword', 'none'], shield: true, armor: ['cloth', 'robe', 'heavy'], helm: true,
    perLv: { hp: 1.5, str: 1, heal: 0.5 },
    passive: { teiji: 0.05 },
    learn: [[1, 'hwk_teiji'], [2, 'hwk_nozan'], [3, 'hwk_refresh'], [5, 'hwk_telework'], [7, 'hwk_flex'], [8, 'hwk_buntan'], [10, 'hatarakikata_sig']],
  },
  // 黒の組織 → あの方（黒の組織と ほかの 超級職 1つ）
  ano_kata: {
    id: 'ano_kata', name: 'あの方', kana: 'あのかた', short: 'あの方', tier: 3, req: ['black_org'], reqSuper: 1, family: 'tech', color: '#2a1a2e',
    desc: 'だれも顔を知らない、なぞの組織のボス。黒の組織と、ほかの超級職を1つきわめた者だけがなれる。ひみつのメールで組織を動かし、あやしい薬やカラスの群れで、敵をどんどん弱らせる。',
    mods: { hp: 1.55, mp: 1.45, str: 1.6, def: 1.3, agi: 1.55, mag: 1.35, heal: 0.9 },
    weapons: ['dagger', 'sword', 'whip', 'staff', 'none'], shield: false, armor: ['cloth', 'gi', 'robe'], helm: true,
    perLv: { str: 1, agi: 1, mp: 1 },
    learn: [[1, 'ano_mail'], [2, 'ano_karasu'], [3, 'ano_kusuri'], [5, 'ano_shirei'], [7, 'ano_shotai'], [8, 'ano_kage'], [10, 'ano_kata_sig']],
  },
};

// 神殿の うわさ（jobs.js の JOB_HINTS に まぜる）
export const LEGEND_R66C_HINTS = {
  souri: 'キャリア組と、ほかの超級職を1つきわめた者は、国のいちばん上に立てるらしい…',
  kaichou: '社長とたたき上げ社長の両方をきわめた者は、いくつもの会社をたばねる会長になれるらしい…',
  hatarakikata: 'ブラックきぎょうの星と、ほかの超級職を1つきわめた者は、定時で帰る働き方の星になれるらしい…',
  ano_kata: '黒の組織と、ほかの超級職を1つきわめた者は、組織のボス「あの方」になれるらしい…',
};
