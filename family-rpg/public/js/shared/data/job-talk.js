// 星の神殿の 転職の せりふ（第27回 家族の ねがい「神官の せりふが 長い。転職しますか？と かんたんに」）
//   くわしい こと（職業レベルは 職業ごとに のこる・ほかの 職業の 技・上級職への 道）は
//   転職の まど（client/ui/services.js の jobUI）の せつめいに ある。せりふは 1〜2行だけ
//   ・JOB_GREET … 神官セレナが 話しかけた とき（data/story.js の job_change）
//   ・jobAskText … えらんだ 職業の かくにん（はい／いいえ）
//   ・jobDoneText … 転職した あと（world/services.js の jobChange の 返事。トーストに 出る）

export const JOB_GREET = '星の神殿へようこそ。\nどの職業に転職しますか？';

// mate: 仲間を 転職させる ときの 名前（自分は null）
export function jobAskText(jobName, mate = null) {
  return mate ? `${mate}を${jobName}に転職させますか？` : `${jobName}に転職しますか？`;
}

// 第33回: 職業に ついた ときの ひとこと（1行。新しい 職業だけ。ない 職業は 何も 足さない）
export const JOB_SAY = {
  magician: '「タネも仕かけもございません！」',
  kaito: '「予告状は、もうとどけたよ」',
  kaito_kid: '「レディース・エーン・ジェントルメーン！」',
  wizard_student: '「入学のしるしに、つえをもらった！」',
  harry: '「おでこのきずが、ちくっといたんだ…」',
  homeroom_3b: '「さあ、授業を始めますよ」',
  alchemist: '「両手を合わせて…れん成！」',
  state_alchemist: '「国のしるし、銀時計をもらった！」',
  fullmetal: '「だれがチビだって！？」',
  sailor_soldier: '「メイクアップ！」',
  sailor_moon: '「月にかわっておしおきよ！」',
  // 第40回
  ryumajin: '「竜の紋章が、両手に…！」',
  neo_queen: '「未来の都は、わたしが守ります」',
  // 第41回 B
  snow_queen: '「もう、かくさない。これがわたし！」',
  fifth_spirit: '「だれかが、わたしをよんでいる…」',
  // 第41回 A
  keikyu_president: '「全線、出発進行！」',
  hall_of_fame: '「ありがとう、野球！」',
  // 第43回（女の子。男の子は JOB_SAY_MASC）
  plumber: '「ジャンプなら、まかせて！」',
  mustache: '「おひめさまだって、走るのよ！」',
  mario: '「キノコの国は、わたしが守ります」',
  // 第51回 W
  kishou: '「明日の天気は、晴れのち雨！」',
  otenki_caster: '「全国のお天気です！」',
  tenkou_tsukai: '「空よ、わたしの声を聞け！」',
  // 第51回 C3: 幻の職業
  cosmic_okan: '「宇宙のはてまで、見てるからね！」',
  chaos_creator: '「こわして、作る。それが世界だ」',
  dream_stadium: '「スタジアム行き、まもなく発車します！」',
  weather_god: '「あしたの天気は、わたしが決める！」',
  // 第51回 C1（幻の職業）
  pirate_king: '「海賊王に、おれはなった！」',
  super_hero: '「雷と気、両方まとめて解き放つ！」',
  sun_hokage: '「影分身も日の呼吸も、おれの忍道だ！」',
  facility_ai: '「全館、最適化を開始します」',
  // 第66回 B班（伝説の職業）
  new_kawaii: '「世界中を、かわいくしちゃう！」',
  smap: '「5人そろって、SMAPです！」',
  oogosho: '「ほな、今日もいっちょやりまひょか」',
  five_star_chef: '「最高のひと皿を、あなたに」',
  // 第66回 A（伝説の職業）
  guard_god: '「仲間には、指一本ふれさせない」',
  kenshin: '「光と闇、どちらもわたしの剣だ」',
  poke_master: '「ポケモンマスターに、なったぞ！」',
  sennen_mage: '「千年たっても、魔法は楽しい」',
  // 第66回 D班（伝説の職業。ロゼッタの 男の子は JOB_SAY_MASC）
  gekka: '「今夜も、月下のショーの始まりです」',
  nobu_dora: '「ぼく、ドラえもんです。ウフフ」',
  kappa_king: '「わしが、かっぱの大王じゃ！」',
  truth_gate: '「とびらの向こうに、答えがあった」',
  rosetta: '「星の子たち、行きましょう」',
  // 第66回 E1班
  koan_zero: '「この国は、ぼくが守る」',
  hyper_rescue: '「助けをまつ人の所へ、すぐ行くぞ！」',
  top_streamer: '「登録者、1000万人とっぱ！」',
  triple_face: '「ぼくには、顔が3つある」',
  hikeshi_god: '「どんな火事も、まかせとけ！」',
  world_streamer: '「世界のみんな、見てるー？」',
  // 第66回 E2
  esports_king: '「世界一のコンボ、見せてあげる！」',
  gold_cardman: '「楽天ゴールドカード！」',
  psychicer: '「きみの心の声、聞こえるよ」',
  game_god: '「セーブは、こまめにね！」',
  black_cardman: '「楽天ブラックカード！」',
  saiki: '「やれやれ…目立ちたくないんだが」',
};
// 第66回 C班（伝説の職業。jobs-legend-r66c.js）
Object.assign(JOB_SAY, {
  souri: '「国の未来は、わたしにまかせて！」',
  kaichou: '「うむ。全部、買い取ろう」',
  hatarakikata: '「定時なので、帰ります！」',
  ano_kata: '「…すべては、ひみつだよ」',
});
// 第82回 A: 犬夜叉の 系統（jobs-r82a.js）
Object.assign(JOB_SAY, {
  hanyo_boy: '「へっ、おれのつめをなめるなよ！」',
  tessaiga_user: '「この刀、おれにしかぬけねえ！」',
  inuyasha: '「行くぜ、鉄さいが！」',
  bakuryuha: '「まとめて、はね返してやる！」',
});
// 第82回 B班: YAIBA の 系統（jobs-r82b.js）
Object.assign(JOB_SAY, {
  samurai_kid: '「天下一のサムライになるぞ！」',
  raijin_sword: '「雷神けんよ、力をかせ！」',
  yaiba: '「どの玉で切ってやろうか！」',
  ryujin_samurai: '「7つの玉が、そろったぞ！」',
});
// 男の子（look.body が 1 で ない）の ときの ひとこと（タキシード仮面ふう。shared/ability-label.js）
export const JOB_SAY_MASC = {
  sailor_soldier: '「仮面のしんし、ただいま参上！」',
  sailor_moon: '「月の光が見ているぞ！」',
  neo_queen: '「地球の王として、みんなを守る」',
  snow_queen: '「もう、かくさない。これがぼくだ！」',
  // 第43回: 配管工・ひげおやじ・マリオ
  plumber: '「さあ、行くぞ！ヤッフー！」',
  mustache: '「このひげが、ぼくのじまんさ」',
  mario: '「ヒアウィーゴー！」',
  // 第66回 D班: ギャラクシーマリオ
  rosetta: '「星の世界へ、レッツゴー！」',
};

// removed: 装備できなく なって はずした 物の 名前（多い ときは 2つ と「など」）
// jobId: なった 職業（JOB_SAY の ひとことを 2行目に。はずした 物が ある ときは そちらを 出す。2行まで）
// masc: 男の子か（JOB_SAY_MASC が ある 職業は そちら）
export function jobDoneText(name, jobName, removed = [], jobId = null, masc = false) {
  const line = jobId && ((masc && JOB_SAY_MASC[jobId]) || JOB_SAY[jobId]);
  const say = line && !removed.length ? `\n${line}` : '';
  const off = removed.length ? `\n（${removed.slice(0, 2).join('・')}${removed.length > 2 ? 'など' : ''}を外した）` : '';
  return `${name}は${jobName}になった！${say}${off}`;
}
