// 第50回 N4: 困っている人（まだ 受けていない たのまれごと）の お知らせ
// 「一度 クリアした 町には 寄らないので、たのまれごとが 見つけにくい」→ クエストの 画面に「困っている人」・新しく 出たら 知らせ（toast）と メニューの ●
// ・ここに たのまれごと ぜんぶの「どこの・だれが・ひとこと」を ならべる（ネタばれ なし。ボスの 名前・ごほうびの 中み・お話の なぞは 書かない）
//   open … この フラグが ぜんぶ ある 時に 話を 聞ける（その 人が 町に 立つ・話すと たのまれる）
//   start … 受けた しるしの フラグ（関数の ときは c を 見る）、done … クリアの フラグ
//   npc … 地図の しるしの 人、auto … お話の 中で 自然に 始まる（ここには 出さない）
//   roots … お仕事いらい板の 職業の 系統（今の 職業で 解決できるか）
// ・知らせた・見た 印は キャラの subAsk（{ told: [...], seen: [...] }）。今 出ている id だけ のこす。
//   新しい 項目なので 版は 上げない（world/save.js の repairChar で 形を ととのえる）。引っこしの コードには 入れない（引っこし先で もう1回 知らせる）
// 新しい たのまれごとを 作ったら、ここにも 1行 足す（test/subquest-hints-r50.test.js が 調べる）
import { C6 } from '../maps/past.js?v=1ce6e2458180';
import { TC, RC, CT } from '../maps/ch6-side.js?v=1ce6e2458180';
import { ORN } from '../maps/ch6c-side.js?v=1ce6e2458180';
import { RS } from './sidequests-ch6d.js?v=1ce6e2458180';
import { C7, LETTER } from '../maps/c7-flags.js?v=1ce6e2458180';
import { C7S, LETTER7S } from '../maps/c7s-flags.js?v=1ce6e2458180';
import { C7I, LETTER7I } from '../maps/c7i-flags.js?v=1ce6e2458180';
// 第73回 D班: 第8章 第1幕の より道（千年前の 緑の王国）
import { C8D_OPEN, CAMEL8, MARKET8 } from '../maps/c8d-side.js?v=1ce6e2458180';
import { C8, LETTER8 } from '../maps/c8a-flags.js?v=1ce6e2458180';
// 第74回 D班: 第8章 第2幕の より道（千年前の クモイの 海）
import { C8BD_OPEN, TURTLE8, HIDE8 } from '../maps/c8bd-side.js?v=1ce6e2458180';
import { C8B, LETTER8B } from '../maps/c8b-flags.js?v=1ce6e2458180';
// 第75回 D班: 第8章 第3幕の より道（千年前の ミドリナ）
import { C8CD_OPEN, IMO8, BUB8 } from '../maps/c8cd-side.js?v=1ce6e2458180';
import { C8C, LETTER8C } from '../maps/c8c-flags.js?v=1ce6e2458180';
// 第80回 D班: 第8章 第4幕の より道（今の ホシフル村）
import { C8RD_OPEN, LAST9 } from '../maps/c8rd-side.js?v=1ce6e2458180';
import { FAMILY_QUESTS } from './sidequests-family.js?v=1ce6e2458180';
import { jobLine } from './fq-common.js?v=1ce6e2458180';

const has = (c, id) => (c?.keyItems || []).includes(id) || (c?.items || []).some((e) => e.id === id && e.n > 0);

// ───────────── たのまれごとの 一らん ─────────────
// はじめて 使う 時に 作る（ほかの ファイルとの 読みこみの じゅんばんに よらない ように）
const build = () => [
  // 第1章（ルミナの町・ホシフル村）
  { id: 'mike', name: '迷子のねこミケ', open: ['c1_town'], start: 'q_mike_start', done: 'q_mike_done', place: 'ルミナの町', who: '女の子のリリ', npc: 'mike_girl', hint: 'かわいがっているねこが、帰ってこないらしい。' },
  { id: 'jelly', name: 'コックの特製ゼリー', open: ['c1_town'], start: 'q_jelly_start', done: 'q_jelly_done', place: 'ルミナの町', who: '酒場のコック', npc: 'cook', hint: '新しいおかしを作りたいのに、材料が足りないらしい。' },
  { id: 'wolf', name: 'ウルフ退治', open: ['c1_town'], start: 'q_wolf_start', done: 'q_wolf_done', place: 'ルミナの町', who: '牧場のおじさん', npc: 'farmer_wolf', hint: '牧場の羊が、魔物にねらわれているらしい。' },
  { id: 'ghost', name: 'ゆうれいのオルゴール', open: ['c1_town'], start: 'q_ghost_start', done: 'q_ghost_done', place: 'ホシフル村', who: 'ふしぎな女の子', npc: 'night_ghost', hint: '夜になると、村のはずれに、さびしそうな女の子があらわれるらしい。（宿屋で「夜まで休む」と、すぐ夜になる）' },
  // 第2章（カモメ港）: 小島の 宝箱の 手紙を 持った 時に 始まる
  { id: 'bottle', name: 'びんの手紙', open: ['c2_port'], start: (c) => has(c, 'bottle_letter'), done: 'q_bottle_done', place: 'カモメ港', who: '女の子のミナ', npc: 'mina', hint: 'むかし、おじいちゃんが海に流した手紙のことを、気にしているらしい。' },
  // 第3章（シロガネ地方）
  { id: 'fox', name: '子ギツネ探し', open: ['c3_village'], start: 'q_fox_start', done: 'q_fox_done', place: '竜守りの村', who: '女の子のコユキ', npc: 'c3_v_girl', hint: 'かわいがっている子ギツネが、帰ってこないらしい。' },
  { id: 'snow', name: '雪だるまコンテスト', open: ['c3_village'], start: 'q_snow_start', done: 'q_snow_done', place: '竜守りの村', who: '男の子のユタ', npc: 'c3_v_kid', hint: 'もうすぐ雪だるまコンテストなのに、雪だるまが小さくてなやんでいる。' },
  { id: 'smith', name: '伝説の星の鉄', open: ['c3_kanatoko'], start: 'q_smith_talk', done: 'q_star_done', place: '鉱山の町カナトコ', who: 'かじ屋のテツジイ', npc: 'tetsujii', hint: 'むかし空から落ちてきた、めずらしい鉄の話をしてくれるらしい。' },
  { id: 'ice', name: '氷のお守り', open: ['c3_onsen'], start: 'c3_onsen', done: 'c3_heatguard', place: '温泉の里ユノハ', who: '湯守りのおばば', npc: 'obaba', hint: '', auto: true },
  // 第4章クリアの あと（sidequests.js。ラクダだけ 第4章の とちゅうから）
  { id: 'camel', name: '迷子のラクダ', open: ['c4_scorpion'], start: 'q_camel_start', done: 'q_camel_done', place: 'ハミルの近くの小さなオアシス', who: 'ラクダ使いのハリド', npc: 'q_camel_owner', hint: 'キャラバンのラクダが、ゆうべから帰ってこないらしい。' },
  { id: 'star', name: '星読みの塔', open: ['c4_clear'], start: 'q_star_start', done: 'q_star_done2', place: 'コガネ砂丘の星読みの塔', who: '星読みのナジュム', npc: 'q_star_reader', hint: '望遠鏡のレンズがよごれて、星がよく見えないらしい。' },
  { id: 'ruin', name: '古代都市のなぞ', open: ['c4_clear'], start: 'q_ruin_start', done: 'q_ruin_done', place: '王都サファラ', who: '学者ハサン', npc: 'hassan', hint: '砂の古代都市にのこる、古い石板を調べたがっている。' },
  { id: 'wood', name: '船大工の鉄木', open: ['c4_clear'], start: 'q_wood_start', done: 'q_wood_done', place: '砂の港ドゥナ', who: '船大工のドック', npc: 'c4_d_wright', hint: '船を作るための、とてもかたい木を探している。' },
  { id: 'seed', name: '花の種のとどけ物', open: ['c4_clear'], start: 'q_seed_start', done: 'q_seed_done', place: 'ルミナの町', who: '花屋のポーラ', npc: 'q_flower_girl', hint: '遠くの里に、とどけたい物があるらしい。' },
  { id: 'kraken', name: 'あばれる大王イカ', open: ['c4_clear'], start: 'q_kraken_start', done: 'q_kraken_done', place: 'カモメ港', who: '漁師のカイ', npc: 'q_fisher', hint: '海があれて、魚がとれなくなってしまったらしい。' },
  { id: 'scale', name: '古竜のうろこ', open: ['c4_clear'], start: 'q_scale_start', done: 'q_scale_done', place: '鉱山の町カナトコ', who: 'かじ屋のテツジイ', npc: 'tetsujii', hint: 'もっとすごい物を作るための、めずらしい材料を探している。' },
  { id: 'riddle', name: '湯けむりのなぞなぞ', open: ['c4_clear'], start: 'q_riddle_start', done: 'q_riddle_done', place: '温泉の里ユノハ', who: 'なぞなぞじいさん', npc: 'q_riddle', hint: 'なぞなぞに答えてくれる人を、待っているらしい。' },
  { id: 'golem', name: 'はぐれマグマゴーレム', open: ['c4_clear'], start: 'q_golem_start', done: 'q_golem_done', place: 'ホシフル村', who: '見張りのドンク', npc: 'q_vguard', hint: '東の平原に、あばれる魔物が出てこまっている。' },
  { id: 'daigo', name: '迷宮の探検家', open: ['c4_clear'], start: 'q_daigo_start', done: 'q_daigo_done', place: '古代の大迷宮の地下6階', who: '宝探しのダイゴ', npc: 'q_daigo', hint: '大事な道具を、迷宮の中でなくしてしまったらしい。' },
  // 第1部クリアの あと: お仕事いらい板（sidequests-family.js・sidequests-work.js。下で 足す）
  // 第6章（千年前と 今）
  { id: 'tc1', name: '時のタイムカプセル（ホシフルの里）', open: [C6.flow], start: TC.start(1), done: TC.dug(1), place: '千年前のホシフルの里', who: '里の子ども', npc: 'p_vil2', hint: 'ずっと先の子どもたちのために、何かをのこしたいらしい。' },
  { id: 'tc2', name: '時のタイムカプセル（泉の里）', open: [C6.flow], start: TC.start(2), done: TC.dug(2), place: '千年前の泉の里', who: '泉の里の子ども', npc: 's_k1', hint: 'ずっと先の子どもたちのために、何かをのこしたいらしい。' },
  { id: 'tc3', name: '時のタイムカプセル（星読みの社）', open: [C6.flow], start: TC.start(3), done: TC.dug(3), place: '千年前の星読みの社', who: '社の見習いコトハ', npc: 'kotoha', hint: 'ずっと先の時代に、何かをのこしたいらしい。' },
  { id: 'tc', name: '時のタイムカプセル（ばあちゃんのごほうび）', open: [C6.flow], start: TC.dug(1), done: TC.done, place: 'ホシフル村', who: 'ホシミばあちゃん', npc: 'elder', hint: '', auto: true },
  { id: 'recipe', name: '千年前のレシピ', open: [C6.flow], start: RC.start, done: RC.done, place: 'ルミナの町', who: '酒場のコック', npc: 'cook', hint: 'この町に伝わる料理の、いちばん最初の味を知りたがっている。' },
  { id: 'chibi', name: 'ちびアステルのたからもの', open: [C6.flow], start: CT.start, done: CT.done, place: '千年前の泉の里', who: 'ちびアステル', npc: 'chibi_astel', hint: 'きらきらした物が大好きで、何かを集めたがっているみたい。' },
  { id: 'orn', name: 'トキネの砂時計のかざり', open: ['c6_kanata'], start: ORN.start, done: ORN.done, place: '今の星見の丘', who: 'トキネ', npc: 'tokine_c6', hint: '大事な物を、どこかに落としてしまったらしい。' },
  { id: 'rion_spar', name: 'リオンの剣のけいこ', open: ['c6_clear'], start: RS.start, done: RS.done, place: '千年前の泉の里', who: 'リオン', npc: 'rion_spar', hint: 'もっと強くなりたくて、けいこの相手を探しているらしい。' },
  // 第7章（千年前の コガネ地方と 今。時をこえる手紙。sidequests-c7.js）
  { id: 'c7l1', name: '時をこえる手紙（緑の王国の市場）', open: [C7.kingdom], start: LETTER.start(1), done: LETTER.found(1), place: '千年前の緑の王国', who: '王国の子ども', npc: 'c7_kid', hint: 'ずっと先の子どもたちに、とどけたい物があるらしい。' },
  { id: 'c7l2', name: '時をこえる手紙（ハミルの湖のほとり）', open: [C7.kingdom], start: LETTER.start(2), done: LETTER.found(2), place: '千年前のハミルの湖', who: '湖の漁師', npc: 'c7_fisher', hint: '湖のことを、ずっと先の人に伝えたいらしい。' },
  { id: 'c7l3', name: '時をこえる手紙（緑の城の庭）', open: [C7.kingdom], start: LETTER.start(3), done: LETTER.found(3), place: '千年前の緑の城', who: '王女ナディア', npc: 'c7_princess', hint: 'ずっと先の、自分の子どもたちに、のこしたい言葉があるらしい。' },
  // 第7章 第2幕（千年前の クモイの 海と 今。時をこえる手紙。sidequests-c7s.js）
  { id: 'c7sl1', name: '時をこえる手紙（ナギの村のはま）', open: [C7S.isle], start: LETTER7S.start(1), done: LETTER7S.found(1), place: '千年前のナギの村', who: 'ナギの村の子ども', npc: 'c7s_kid', hint: '千年先の子どもに、とどけたい手紙があるらしい。' },
  { id: 'c7sl2', name: '時をこえる手紙（貝がらの小島）', open: [C7S.isle], start: LETTER7S.start(2), done: LETTER7S.found(2), place: '千年前の貝がらの小島', who: '小島の漁師', npc: 'c7s_fisher', hint: '海のことを、ずっと先の人に伝えたいらしい。' },
  { id: 'c7sl3', name: '時をこえる手紙（星見の島）', open: [C7S.isle], start: LETTER7S.start(3), done: LETTER7S.found(3), place: '千年前の星見の島', who: '星見のおじいさん', npc: 'c7s_stargazer', hint: '千年先の、星を見る者へ、のこしたい言葉があるらしい。' },
  // 第7章 第3幕（千年前の シロガネ地方と 今。時をこえる手紙。sidequests-c7i.js）
  { id: 'c7il1', name: '時をこえる手紙（白雪の里）', open: [C7I.frost], start: LETTER7I.start(1), done: LETTER7I.found(1), place: '千年前の白雪の里', who: '白雪の里の子ども', npc: 'c7i_kid', hint: '千年先の子どもに、竜のことを伝えたいらしい。' },
  { id: 'c7il2', name: '時をこえる手紙（白銀の湖の岸）', open: [C7I.frost], start: LETTER7I.start(2), done: LETTER7I.found(2), place: '千年前の白銀の湖の岸', who: '湖の若い漁師', npc: 'c7i_fisher', hint: '千年先の漁師に、ないしょの話をのこしたいらしい。' },
  // 第8章 第1幕（千年前の 緑の王国の まわりと 今。時をこえる手紙。sidequests-c8a.js）
  { id: 'c8al1', name: '時をこえる手紙（騎士の訓練場）', open: [C8.kingdom], start: LETTER8.start(1), done: LETTER8.found(1), place: '千年前の緑の王国の騎士の訓練場', who: '騎士の見習い', npc: 'c7_knight1', hint: '千年先の騎士に、たいせつな言葉をのこしたいらしい。' },
  { id: 'c8al2', name: '時をこえる手紙（王家の森）', open: [C8.kingdom], start: LETTER8.start(2), done: LETTER8.found(2), place: '千年前の王家の森', who: '王家の森の番人', npc: 'c8a_ranger', hint: '千年先の人へ、森のことを伝えたいらしい。' },
  // 第8章 第2幕（千年前の クモイの 海と 今。時をこえる手紙。sidequests-c8b.js）
  { id: 'c8bl1', name: '時をこえる手紙（かもめの小島）', open: [C8B.abyss], start: LETTER8B.start(1), done: LETTER8B.found(1), place: '千年前のかもめの小島', who: 'かもめの好きな女の子', npc: 'c8b_gullgirl', hint: '千年先の人へ、かもめのことを伝えたいらしい。' },
  { id: 'c8bl2', name: '時をこえる手紙（大木の島）', open: [C8B.abyss], start: LETTER8B.start(2), done: LETTER8B.found(2), place: '千年前の大木の島', who: 'もぐり漁師', npc: 'c8b_diver', hint: '千年先の人へ、海の底の光のことをのこしたいらしい。' },
  // 第8章 第3幕（千年前の ミドリナ地方と 今。時をこえる手紙。sidequests-c8c.js）
  { id: 'c8cl1', name: '時をこえる手紙（鏡の湖のほとり）', open: [C8C.spring], start: LETTER8C.start(1), done: LETTER8C.found(1), place: '千年前の鏡の湖の東のほとり', who: '湖の絵かきの女の子', npc: 'c8c_painter', hint: '千年先の人へ、湖の色のことを伝えたいらしい。' },
  { id: 'c8cl2', name: '時をこえる手紙（森の入口）', open: [C8C.spring], start: LETTER8C.start(2), done: LETTER8C.found(2), place: '千年前の森の入口', who: '森のきこり', npc: 'c8c_woodcutter', hint: '千年先の人へ、森のことをのこしたいらしい。' },
  { id: 'c7il3', name: '時をこえる手紙（湯けむりの谷）', open: [C7I.frost], start: LETTER7I.start(3), done: LETTER7I.found(3), place: '千年前の湯けむりの谷', who: '湯けむりの旅人', npc: 'c7i_traveler', hint: '千年先の谷の人へ、ねがいをのこしたいらしい。' },
  // 第8章 第1幕（第73回 D班。千年前の 緑の王国の より道。sidequests-c8d.js）
  { id: 'c8d_camel', name: '王宮の子どもと、迷子の子ラクダ', open: [C8D_OPEN], start: CAMEL8.start, done: CAMEL8.done, place: '千年前の緑の王国', who: '王宮の子どもナシム', npc: 'c8d_camel_host', hint: 'かわいがっている子ラクダが、どこかへ行ってしまったらしい。' },
  { id: 'c8d_market', name: '市場のずるい分銅', open: [C8D_OPEN], start: MARKET8.start, done: MARKET8.done, place: '千年前の緑の王国', who: '布売りのハビブ', npc: 'c8d_mk_host', hint: '大事な布を売ったのに、お金が足りなかったらしい。' },
  // 第8章 第2幕（第74回 D班。千年前の クモイの 海の より道。sidequests-c8bd.js）
  { id: 'c8bd_turtle', name: '赤ちゃんウミガメの、初めての海', open: [C8BD_OPEN], start: TURTLE8.start, done: TURTLE8.done, place: '千年前のナギの島のはま', who: 'ウミガメ見守りの女の子ミオ', npc: 'c8bd_turtle_host', hint: 'もうすぐ生まれる赤ちゃんが、しんぱいらしい。' },
  { id: 'c8bd_hide', name: 'ナギの村の、かくれんぼ', open: [C8BD_OPEN], start: HIDE8.start, done: HIDE8.done, place: '千年前のナギの村', who: 'おにの子どもトト', npc: 'c8bd_hide_host', hint: 'かくれんぼで、ずっと「おに」のままらしい。' },
  // 第8章 第3幕（第75回 D班。千年前の ミドリナの より道。sidequests-c8cd.js）
  { id: 'c8cd_imo', name: 'ホシフルの里の、やきいも', open: [C8CD_OPEN], start: IMO8.start, done: IMO8.done, place: '千年前のホシフルの里', who: 'いも好きの男の子ポン', npc: 'c8cd_imo_host', hint: 'やきいもを焼いて、里のみんなを元気にしたいらしい。' },
  { id: 'c8cd_bub', name: '泉の里の、しゃぼん玉', open: [C8CD_OPEN], start: BUB8.start, done: BUB8.done, place: '千年前の泉の里', who: 'しゃぼん玉の好きな女の子ポポ', npc: 'c8cd_bub_host', hint: '里の空に、しゃぼん玉をとばしたいらしい。' },
  // 第8章 第4幕（第80回 D班。今の ホシフル村の より道。sidequests-c8rd.js）
  { id: 'c8rd_last', name: '時をこえる手紙の、最後の1通', open: [C8RD_OPEN], start: LAST9.start, done: LAST9.done, place: 'ホシフル村', who: '手紙をあずかるゆうびん屋さん', npc: 'c8rd_last_host', hint: '千年前からあずかっている手紙の、とどけ先を探しているらしい。' },
];

// お仕事いらい板の たのみごと（第1部クリアの あと。はり紙の 1行目を ひとことに）。地図の 人は 一らんの npc（第65回 D2 で 一らんに 入れた）
// 第65回 D2: お仕事いらい板で 受けた（fq_take_<id>）ものも「受けた」（困っている人から 消えて、クエストの 画面の たのまれごとへ）
// 第68回 D班: 18〜23 は 第7章の カリムの あとから（はり紙の open）
let LIST = null;
let BY_ID = new Map();
export function subQuestHints() {
  if (LIST) return LIST;
  LIST = build();
  // 第6章の 前に 入れる
  LIST.splice(LIST.findIndex((q) => q.id === 'tc1'), 0, ...FAMILY_QUESTS.map((q) => ({
    id: `fq_${q.id}`, name: q.name, open: q.open || ['c5_clear'], start: (c) => !!(c?.flags?.[q.start] || c?.flags?.[`fq_take_${q.id}`]), done: q.done, place: q.town, who: q.who, npc: q.npc,
    hint: String(q.paper || '').split('\n')[0], roots: q.roots, job: q.job, board: true,
  })));
  BY_ID = new Map(LIST.map((q) => [q.id, q]));
  return LIST;
}
const byId = () => (subQuestHints(), BY_ID);
export const subQuestHint = (id) => byId().get(id) || null;

// ───────────── 今 話を 聞ける 人 ─────────────
const flagOf = (c) => (k) => !!c?.flags?.[k];
export function subQuestStarted(c, q) {
  const f = flagOf(c);
  return f(q.done) || (typeof q.start === 'function' ? !!q.start(c) : f(q.start));
}
// まだ 受けていない たのまれごとで、今 話を 聞ける もの（お話で 始まる ものは 出さない）
export function availableSubQuests(c) {
  if (!c?.flags) return [];
  const f = flagOf(c);
  return subQuestHints().filter((q) => !q.auto && q.open.every(f) && !subQuestStarted(c, q));
}

// 「ルミナの町の、女の子のリリが困っている」
export const askLine = (q) => `${q.place}の、${q.who}が困っている`;
// お仕事いらい板: 今の 職業で 解決できるか（できない ときは さがしている 職業）
export function askJobNote(q, c) {
  if (!q.roots) return '';
  return jobLine(q.roots).has(c?.job) ? '（今の職業で、解決できそう！）' : `（${q.job}の職業の人を、探している）`;
}

// ───────────── 知らせた・見た 印 ─────────────
const KINDS = ['told', 'seen'];
function askMarks(c, kind) {
  const list = c?.subAsk?.[kind];
  return new Set(Array.isArray(list) ? list.filter((id) => byId().has(id)) : []);
}
// まだ 知らせていない（told）・まだ 見ていない（seen）
export function newAsks(c, kind) {
  const done = askMarks(c, kind);
  return availableSubQuests(c).filter((q) => !done.has(q.id));
}
export const hasNewAsk = (c) => !!c && newAsks(c, 'seen').length > 0;
// 印を つける（サーバー: world/services.js の menu → subAsk）。今 出ている id だけ のこす。もどりち: かわったか
export function markAsks(c, kind, ids) {
  if (!c || !KINDS.includes(kind)) return false;
  const live = new Set(availableSubQuests(c).map((q) => q.id));
  const before = JSON.stringify(c.subAsk?.[kind] || []);
  const set = askMarks(c, kind);
  for (const id of Array.isArray(ids) ? ids : [ids]) if (byId().has(id)) set.add(id);
  const next = subQuestHints().map((q) => q.id).filter((id) => set.has(id) && live.has(id));
  if (JSON.stringify(next) === before) return false;
  c.subAsk = { ...cleanAsk(c.subAsk), [kind]: next };
  return true;
}
// セーブの 形を ととのえる（world/save.js の repairChar。ない ときは そのまま）
export function cleanAsk(v) {
  if (!v || typeof v !== 'object') return {};
  const out = {};
  for (const k of KINDS) if (Array.isArray(v[k])) out[k] = [...new Set(v[k].filter((id) => typeof id === 'string'))].slice(0, 80);
  return out;
}
export function repairSubAsk(c) {
  if (!c || c.subAsk === undefined) return;
  c.subAsk = cleanAsk(c.subAsk);
}

// 知らせの 文（いくつか ある ときは「〇〇などで」）
export function askToastText(list) {
  if (!list.length) return '';
  const places = [...new Set(list.map((q) => q.place))];
  const where = places.length > 1 ? `${places[0]}などで` : `${places[0]}で`;
  return `${where}、だれかが困っているようです\n（メニューの「クエスト」で見られます）`;
}

// ───────────── 地図の しるし（クエストの 画面で えらんだ 人。この 画面だけの もの）─────────────
let pinId = null;
export function setAskPin(id) { pinId = id && byId().has(id) ? id : null; }
export const askPin = () => pinId;
// 今 しるしを つける 人（もう 受けた・まだ 聞けない ときは なし）
export function askPinQuest(c) {
  if (!pinId) return null;
  return availableSubQuests(c).find((q) => q.id === pinId) || null;
}
