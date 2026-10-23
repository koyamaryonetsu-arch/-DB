// 第6章 Step 3・4（A: 世界と物語）の 品（items-ch6-key.js で まぜる。plan-ch6.md の 12-1・12-2）
// ・大事な物: ミナモの星読み（古道で 夜空を 見る。メニューの「道具」→「使う」。world/star-sight.js）・千年前のレシピ（より道）
// ・より道の ごほうび（src: 'gift'「たくされた品」。どれも ランク10の ★5・レア度 4）:
//   時のタイムカプセル … ホシフルの里のお守り・星読みのかみかざり（と めずらしい種）。3つ そろうと ばあちゃんから 時をこえたロケット
//   ちびアステルのたからもの … 星竜のうろこ（今の アステルから）
// ・千年前のレシピ … 星祭りのごちそう（戦いの 中で 仲間 みんなの HPを 回復。ルミナの町の 道具屋に ならぶ）
const ACC = { type: 'acc', rank: 10, rarity: 4, src: 'gift' };

export const CH6_SIDE_ITEMS = {
  c6s_star_reading: {
    name: 'ミナモの星読み', type: 'key', menuUse: 'starSight',
    desc: 'ミナモが星の声を聞く、星読みの力。ミナモといっしょの時に「使う」と、しばらくの間、昼でも夜空の星が見える。星めぐりの古道の星の道しるべが光る。',
  },
  c6s_old_recipe: {
    name: '千年前のレシピ', type: 'key',
    desc: '千年前の泉の里のおくさんに教わった、初めての星祭りのごちそうの作り方。今のルミナの町の酒場のコックにとどけよう。',
  },
  c6s_hoshi_charm: {
    ...ACC, name: 'ホシフルの里のお守り', bonus: { hp: 44, def: 16, heal: 16, agi: 10 }, resist: { dark: 0.8, sleep: 0.6 },
    desc: '千年前のホシフルの里の子どもがうめた、わらのお守り。千年分の星の力がたまっている。だれでも装備でき、HPと守りが上がる。',
  },
  c6s_star_hairpin: {
    ...ACC, name: '星読みのかみかざり', bonus: { hp: 30, mag: 20, heal: 20, agi: 10 }, resist: { confuse: 0.6, light: 0.8 },
    desc: '星読みの社の見習いがうめた、星の形のかみかざり。千年たっても、ほのかに光っている。呪文と回復の力が上がる。',
  },
  c6s_locket: {
    ...ACC, name: '時をこえたロケット', bonus: { hp: 56, str: 14, def: 14, mag: 14, agi: 14, heal: 14 }, resist: { dark: 0.8, blind: 0.7 },
    desc: 'ホシミばあちゃんの家に、千年前から伝わっていたロケット。中に、小さな星の木の葉が入っている。すべての力が上がる。',
  },
  c6s_astel_scale: {
    ...ACC, name: '星竜のうろこ', bonus: { hp: 60, def: 20, str: 12, agi: 8 }, resist: { fire: 0.7, ice: 0.7, bolt: 0.8, dark: 0.8 },
    desc: '星の竜アステルが、千年前の思い出といっしょにくれたうろこ。炎と氷にとても強く、守りが上がる。',
  },
  c6s_feast: {
    name: '星祭りのごちそう', type: 'use', price: 900, target: 'allies', battle: true, field: false,
    effect: { type: 'heal', base: [180, 200], fixed: true },
    desc: '千年前の初めての星祭りのごちそうを、今のコックが作りなおした料理。戦いの中で、仲間みんなのHPを190ほど回復する。',
  },
};
export const CH6_SIDE_KANA = {
  c6s_star_reading: 'みなものほしよみ', c6s_old_recipe: 'せんねんまえのれしぴ', c6s_hoshi_charm: 'ほしふるのさとのおまもり',
  c6s_star_hairpin: 'ほしよみのかみかざり', c6s_locket: 'ときをこえたろけっと', c6s_astel_scale: 'せいりゅうのうろこ', c6s_feast: 'ほしまつりのごちそう',
};
