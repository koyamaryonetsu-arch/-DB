// 第67回 A班: モンスター闘技場の 人の だいほん（story.js で まぜる。マップは maps/monarena-a.js）
//
// ・受付（3人）… monster_bond の 前は「魔物の心に まだ 目覚めていない」と 言うだけ。
//   あとは 受付の 画面（['ui', 'monarena', { mode }]。client/ui/monarena.js）を 開く
//   mode: 'rank'（ランク戦）/ 'family'（家族の 登録チームと 対戦）/ 'reg'（チームの 登録）
//   画面の 中で サーバーの 窓口（svc kind:'monarena'。B班）を よぶ
// ・ひとりずつ（物語の だいほんでは ない。パーティーの みんなで 見ない）
export const MONARENA_BOND_FLAG = 'monster_bond';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);

// 受付の 画面を 開く（だいほんの 'call' から。ほかの 画面と 同じく 一度 送ってから）
export function openMonArena(mode) {
  return async (run) => {
    const r = await run.flush();
    if (r.aborted) return run.abort();
    run.batch.push(['ui', 'monarena', { mode, name: 'モンスター闘技場', keeper: KEEPERS[mode] || KEEPERS.rank }]);
    const r2 = await run.flush();
    if (r2.aborted) run.abort();
  };
}
const KEEPERS = { rank: 'ランク戦の受付', family: '家族対戦の係', reg: 'チーム登録の係' };

// 魔物の 心に 目覚める 前（第1章の 森の主の あとで 目覚める）
const notYet = (who) => S(who,
  'ようこそ、モンスター闘技場へ！\nここは、仲間にした魔物どうしが、力をくらべあう場所なんだ。',
  'でも、きみはまだ、魔物の心に目覚めていないみたいだね。\n魔物と心を通わせて、仲間にできるようになったら、また来てね！');

const desk = (mode, who, hello) => (x) => (x.flag(MONARENA_BOND_FLAG)
  ? [...S(who, hello), ['call', openMonArena(mode)]]
  : notYet(who));

export const MONARENA_A_SCRIPTS = {
  monarena_desk: desk('rank', 'ランク戦の受付', 'ようこそ、モンスター闘技場へ！\nランク戦は、休みなしの3連戦。\n自分が育てた魔物4ひきで、ちょうせんだ！'),
  monarena_family: desk('family', '家族対戦の係', 'ここでは、家族が登録したチームと戦えるよ。\n相手が遊んでいない時でも、だいじょうぶ！'),
  monarena_reg: desk('reg', 'チーム登録の係', '自分のチームを登録しておくと、\n家族が、いつでもきみのチームと戦えるようになるよ。'),
  // 戦いの 場で けいこを している 子と 魔物（monster_bond の あと）
  monarena_trainer: () => S('魔物使いのタクト',
    'ぼくはタクト。この子たちと、毎日ここでけいこしてるんだ。',
    'チームを選ぶ時は「おまかせ」を使うと、強い順に4ひき選んでくれるよ。\n「前回のチーム」なら、この前と同じチームで、すぐ戦える！'),
  monarena_mon_a: () => S('ぷるりん', 'ぷるぷるっ！\n（やる気まんまんだ！）'),
  monarena_mon_b: () => S('ツノうさぎ', 'ぴょん！ぴょん！\n（ツノをふって、けいこをしている…）'),
  // 観客
  monarena_fan1: (x) => S('観客のおじいさん', x.flag(MONARENA_BOND_FLAG)
    ? 'わしは、ここで魔物たちの戦いを見るのが楽しみでのう。\n人は戦わん。魔物だけが、自分の力で戦うのじゃ。'
    : 'ここは、魔物どうしが戦う闘技場じゃよ。\nおまえさんも、いつか魔物の仲間ができたら、来るといい。'),
  monarena_fan2: () => S('観客の女の子', 'ランクは、FからSまであるんだって！\n物語が進むと、上のランクが開くんだよ。'),
  monarena_fan3: () => S('観客のおじさん', '家族の登録チームと戦う時は、「レベルをそろえる」もできるぞ。\nそうすれば、小さい子の魔物でも、いい勝負になる！'),
};
