// 預かり所 と ふしぎなかじ屋（ルミナの町・カモメ港）
// 人に 話しかけると ['bank', 'town'] / ['forge', 'town'] の まど（カウンター）が ひらく
//
// 預かり所 … お金と 道具を 預ける。全滅しても 預けた お金は へらない（持っている お金は 半分に なる）
//            どこの 預かり所でも おなじ 物が 出し入れできる

export const BANK_GOLD_MAX = 9999999;
// 預けられる 道具の しゅるい（1しゅるい 99個まで）
export const BANK_KINDS = 60;
export const BANK_STACK = 99;

export const BANKS = {
  town: {
    name: 'ルミナの預かり所', keeper: '預かり所のおねえさん',
    hello: 'ようこそ、預かり所へ。\nお金や道具を、大切にお預かりします。\nどんなご用でしょう？',
  },
  port: {
    name: 'カモメ港の預かり所', keeper: '預かり所のおじさん',
    hello: 'カモメ港の預かり所へ、ようこそ。\nルミナの町で預けた物も、ここで出し入れできますよ。\nどんなご用でしょう？',
  },
};

export const FORGES = {
  town: {
    name: 'ふしぎなかじ屋', keeper: 'かじ屋の親方',
    hello: 'おう、ここはふしぎなかじ屋だ。\n素材とゴールドがあれば、装備を作ったり、\nきたえたりできるぞ。今日は何をする？',
  },
  port: {
    name: 'カモメ港のかじ屋', keeper: 'かじ屋の弟子',
    hello: 'いらっしゃい！ルミナの親方に教わった、\nふしぎなかじの店です。\n今日は何をしますか？',
  },
};

// 人の だいほん（story.js で まぜる）
export const FACILITY_SCRIPTS = {
  bank_town: () => [['bank', 'town']],
  bank_port: () => [['bank', 'port']],
  forge_town: () => [['forge', 'town']],
  forge_port: () => [['forge', 'port']],
};
