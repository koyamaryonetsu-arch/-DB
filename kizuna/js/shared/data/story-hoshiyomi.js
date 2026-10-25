// 第5章 Step 5「星読みの里と、選ばれなかった子」の だいほん（data/story-ch5.js で まぜる）
// ※ ネタバレ注意: 第4幕の 中みが 書いてある（docs/plan-ch5.md の 14 の 実装メモ）
// ・守り星の かけらの あと（c5_shard）→ しずみゆく島の 北西の 風見の石3で 風の道を 開ける → 西の 小島の 星読みの里（c5_village）
// ・星読みのじいさま カナタ: 昔の 星読み「ひとりは選ばれ、ひとりは選ばれぬ」→ 本当は「ひとりは、選ぶ」。もうひとりの 紋章の 子の 名は ノクト（c5_kanata）
// ・ホシミばあちゃんが 星の竜アステルに 乗って 来る。紋章の ぎしきの 日の こと（c5_grandma）→ カナタが 星読みの ランプを くれる
// ・星読みの 水しょうから ノクトの 思い出の 迷宮へ（c5_memory。6階・5さい〜今）。光と 影・思い出の かけら（各階 1つ）・
//   階ごとに 同じ 夜に 生まれた 主人公（{name}）の 思い出も 少し
// ・6階の ノクトの 影（きまった 戦い nocto_shadow。B）→ c5_nshadow → 水しょうの 前に もどると 本物の ノクト（c5_nocto。「第5章の続きはアップデートで！」）
// ・思い出の かけらを 6つ 全部 拾っていると、ノクトの 影の さいごの 場面と、ノクトの ことばが かわる（第6幕でも MEMORY_SHARD_FLAGS を 使う）
// 里の まわりと 迷宮の 魔物・きまった 戦い nocto_shadow・里の 店の 品・迷宮の 宝箱の 品は B（戦い・品）が 作る（plan-ch5.md の 14）
import { K5, KUMOI_POS, KUMOI_ROADS, KUMOI_VANES } from '../maps/kumoi.js?v=2551bc2b5aab';
import {
  K6, HOSHIYOMI_POS, PRACTICE_ORDER, PRACTICE_FLAGS, PRACTICE_DONE, PRACTICE_PRIZE,
} from '../maps/hoshiyomi.js?v=2551bc2b5aab';
import {
  MEMORY_FLOORS, MEMORY_POS, MEMORY_REST, MEMORY_BOSS, MF, LAMP, MSHARD, MEMORY_SHARD_FLAGS, memoryShardCount, memoryShardsAll,
  memoryMapId, memoryArrive,
} from '../maps/memory.js?v=2551bc2b5aab';
import { innSteps } from './inn.js?v=2551bc2b5aab';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);

// ───── 物語の すすみかた（CH5_STEPS の c5_shard の うしろ。plan-ch5.md の 14 の 名前の 約束）─────
export const HOSHIYOMI_STEPS = [K6.village, K6.kanata, K6.grandma, K6.memory, K6.nshadow, K6.nocto];

// ───── 目標 ─────
// c5_shard の あとの 目標（KUMOI_OBJ.shard）は story-kumoi.js（前の 文は story-ch5.js の OLD_C5_OBJ.shard）
export const HOSHIYOMI_OBJ = {
  village: '里のおくの大きな家にいる、星読みのじいさまカナタをたずねよう',
  kanata: 'カナタの家の外へ出てみよう（大きな羽の音が聞こえる…）',
  grandma: 'カナタの家の「星読みの水しょう」に手をかざして、ノクトの思い出の中へ入ろう',
  // memory・m2〜m6 は その 階に 来た しるし（c5_memory・c5_mf2〜c5_mf6）の あとの 目標
  memory: 'ランプ台を調べて、星読みのランプの光をうつそう。柱の影の中にだけ、道が見える',
  m2: '2階。影の道を2本つないで、北のへやの下りかいだんへ進もう',
  m3: '3階は休み所。星のいずみで、ひと休みしよう',
  m4: '4階。まん中の柱の影は、ランプ台を変えると、向きが変わる',
  m5: '5階。2つ目のへやの3つのランプ台を、使い分けて進もう',
  m6: 'いちばん下の階…。大広間で、だれかが待っている。準備を整えてから進もう',
  nshadow: '星読みの里の、星読みの水しょうの前へもどろう',
  // 本物の ノクトに 会った あと（Step 6 で かえた。前の「第5章の続きはアップデートで！…」の 文は story-ch5.js の OLD_C5_OBJ.nocto。repairObjective で なおる）
  nocto: 'ハネノの町の長ソラネに、大地の神殿のことを聞こう',
};
const OBJ = HOSHIYOMI_OBJ;
const FLOOR_OBJ = { 1: 'memory', 2: 'm2', 3: 'm3', 4: 'm4', 5: 'm5', 6: 'm6' };

// パーティー全員で 見る イベント（リーダーの 世界で すすむ）
export const HOSHIYOMI_STORY_SCRIPTS = [
  'c5_y_arrive', 'c5_kanata', 'c5_grandma_event', 'c5_y_crystal', 'c5_nshadow_event',
  ...Object.keys(KUMOI_ROADS).map((k) => `c5_kroad_${k}`),
  ...Array.from({ length: MEMORY_FLOORS }, (_, i) => `c5_mf${i + 1}`),
  ...Array.from({ length: MEMORY_FLOORS }, (_, i) => `c5_mshard${i + 1}`),
  ...Array.from({ length: MEMORY_FLOORS }, (_, i) => Object.keys(MEMORY_POS[i + 1].lamps).map((k) => `c5_mlamp_${i + 1}_${k}`)).flat(),
];

// ───────────── 風見の石3（しずみゆく島の 北西。かけらの あと、北の 星読みの里へ 風の道を 開ける）─────────────
function roadSteps(x, key) {
  const R = KUMOI_ROADS[key];
  if (!x.flag(K5.shard)) return N('風見の石だ。', '矢じるしが、くるくると回りつづけている…。\n（北の風があれていて、石が止まらない）');
  const on = x.flag(R.flag);
  return [
    ...N('風見の石だ。', on ? '石の上の矢じるしは、北を指している。\n北の雲の上に、風の道がふいている。' : '石の上の矢じるしが、北をさしたがっている…。'),
    ['choice', '風見の石を回す？', ['回す', 'やめる'], [
      [['sfx', 'door'], ['toggle', R.flag], ['sync'], ['sfx', 'wind'],
        ...(on ? N('ゴオオ…。\n北の風の道が、雲の中へ消えた。') : N('ゴオオ…！\n北の雲の上に、風の道が開いた！', '（風の道は、北の雲の向こうの小島へつづいている）'))],
      [],
    ]],
  ];
}

// ───────────── 星読みの里（弟子の あいさつ・カナタ・ばあちゃん）─────────────
function villageArrive() {
  return [
    ...S('星読みの弟子', 'ようこそ、星読みの里へ。', '…その手の紋章。あなたたちが、紋章の子ですね。'),
    ...S('星読みの弟子', 'カナタさまが、ゆうべ星を読んで、「今日、紋章の子が来る」と言っていました。'),
    ...S('星読みの弟子', 'カナタさまの家は、里のおく。北の大きな家です。'),
    ['flag', K6.village], ['sync'],
    ...N('（星の竜アステルで、星読みの里の島の上も飛べるようになった！）'),
    ['objective', OBJ.village],
  ];
}

function kanataScene() {
  return [
    ['bgm', null],
    ...S('星読みのカナタ', '…待っておったぞ、紋章の子よ。', 'わしは、星読みのカナタ。\n星の光を読み、明日を読む者じゃ。'),
    ...S('星読みのカナタ', 'そなた、大地の守り星のかけらを持っておるな。', 'その光の中で、泣いている子の思い出を、見たのじゃろう。'),
    ...S('星読みのカナタ', '昔の星読みには、こう書かれておる。'),
    ...N('『星祭りの夜、紋章の子が2人生まれる。\nひとりは選ばれ、ひとりは選ばれぬ』'),
    ...S('星読みのカナタ', '地上の者も、この里の者も、そう読んだ。', '…じゃが、それは、まちがいじゃった。'),
    ...S('星読みのカナタ', '本当は、こうじゃ。\n『ひとりは選ばれ、ひとりは、選ぶ』', '…自分で道を選ぶ子、という意味じゃった。'),
    ...S('星読みのカナタ', 'わしが、それに気づいた時には…もう、おそかった。'),
    ...S('星読みのカナタ', 'もうひとりの紋章の子。\nその名は…ノクト。'),
    ...N('（ノクト…！\nピピが言っていた、フードの子の名前だ…）'),
    ['sfx', 'wind'], ['shake'],
    ...N('バサッ…バサッ…！', '外で、大きな羽の音がする…！'),
    ...S('星読みのカナタ', '…む。来たようじゃな。', '外へ出てみなされ。'),
    ['flag', K6.kanata], ['sync'],
    ['bgm', 'resume'],
    ['objective', OBJ.kanata],
  ];
}
function kanata(x) {
  if (!x.flag(K6.kanata)) return kanataScene();
  if (!x.flag(K6.grandma)) return S('星読みのカナタ', '外へ出てみなされ。\n…待ち人が、来ておる。');
  if (!x.flag(K6.nshadow)) {
    return S('星読みのカナタ', '水しょうに手をかざせば、あの子の思い出の中へ入れる。',
      'ランプ台に光をうつせば、柱の影がのびる。\n影の中にこそ、見える道があるのじゃ。');
  }
  if (!x.flag(K6.nocto)) return S('星読みのカナタ', '…水しょうが、ざわめいておる。\n水しょうの前へ、行ってみなされ。');
  const all = memoryShardsAll(x.flag);
  return S('星読みのカナタ', 'あの子は、まだ、選ぶとちゅうなのじゃ。',
    all ? 'そなたは、あの子の思い出を、全部見たのじゃな…。\nその思い出は、きっと、あの子に、とどいておる。'
      : `思い出の中には、まだ拾っていないかけらがあるようじゃ。（${memoryShardCount(x.flag)}/${MEMORY_FLOORS}）\n水しょうから、いつでも入れるぞ。`);
}

// ばあちゃんが 星の竜アステルに 乗って 来る（カナタの 家の 前。c5_grandma）
function grandmaEvent() {
  const P = HOSHIYOMI_POS.plaza;
  const lx = 20.5, ly = P.y + 2.5;
  return [
    ['bgm', null],
    ['look', lx, ly],
    ['bgm', 'dragon'], ['sfx', 'wind'],
    ['actor', 'astel_hy', { sprite: 'star_dragon', x: lx, y: ly - 14, dir: 'down' }],
    ['move', 'astel_hy', [[lx, ly]]],
    ['actor', 'grandma_hy', { sprite: 'elder', x: lx + 1.5, y: ly, dir: 'up' }],
    ...S('星の竜アステル', '紋章の子らよ。', 'ホシミが、どうしても来たいと言うのでな。乗せてきた。'),
    ['move', 'grandma_hy', [[lx, ly - 3]]],
    ['look'],
    ...S('ホシミばあちゃん', '{name}…。', 'かけらの中の、泣いている子の話を聞いてから…\nずっと、気にかかっておった。'),
    ...S('ホシミばあちゃん', '…あれは、ノクトじゃ。', '{name}と同じ星祭りの夜に、ホシフル村で生まれた子じゃよ。'),
    ...S('ホシミばあちゃん', '5つの年の星祭りの夜。\n紋章のぎしきをしたのは、わしじゃ。'),
    ...S('ホシミばあちゃん', '{name}の紋章は、やさしく光った。', '…じゃが、ノクトの紋章は、光らなんだ。'),
    ...S('ホシミばあちゃん', '村の大人たちは、こわがった。\n「選ばれなかった子だ」「わざわいの子だ」と…。', 'わしは、それを、止められなんだ。'),
    ...S('ホシミばあちゃん', 'あの子は、だんだん、ひとりになって…\n9つの冬、だまって村を出ていった。'),
    ...S('ホシミばあちゃん', '…わしが、あの子をひとりにしたんじゃ…。'),
    ['actor', 'kanata_hy', { sprite: 'kanata', x: 20.5, y: 10.5, dir: 'down' }],
    ...S('星読みのカナタ', 'ホシミどの。', '光らなかったのは、あの子の紋章が、まだ目覚めていなかっただけじゃ。\nそなたのせいでは、ない。'),
    ...S('星読みのカナタ', 'わしの星読みの水しょうなら、あの子の思い出の中へ入れる。', '紋章の子よ。\nあの子の心に、ふれてきてはくれんか。'),
    ...S('星読みのカナタ', '思い出の中は、くらい。\nこのランプを、持っていきなされ。'),
    ['item', 'star_lamp'],
    ...S('星読みのカナタ', 'ランプ台に、このランプの光をうつすと、柱の影がのびる。', '…影の中にこそ、見える道があるのじゃ。'),
    ...S('ホシミばあちゃん', '{name}…たのんだよ。\nわしは、カナタどのの家で待っておる。'),
    ['move', 'astel_hy', [[lx, ly - 14]]],
    ['remove', 'astel_hy'], ['remove', 'grandma_hy'], ['remove', 'kanata_hy'],
    ['flag', K6.grandma], ['sync'],
    ['bgm', 'resume'],
    ['objective', OBJ.grandma],
  ];
}

// 星読みの 水しょう（思い出の 迷宮へ。ノクトの 影の あと、もどってきた ときは 本物の ノクト）
const enterMemory = () => {
  const a = memoryArrive(1);
  return [['sfx', 'spell'], ['flash'], ['fade', 'out'], ['teleport', a.map, a.x, a.y, 'up'], ['fade', 'in']];
};
function crystal(x) {
  if (!x.flag(K6.kanata)) return N('大きな水しょうだ。', '中で、たくさんの星の光が、ゆらゆらとゆれている…。\n（カナタに、話を聞いてみよう）');
  if (!x.flag(K6.grandma)) return N('水しょうの中に、だれかの思い出が、うかんでは消えていく…。', '（外で、大きな羽の音がする…）');
  if (x.flag(K6.nshadow) && !x.flag(K6.nocto)) return noctoScene();
  return [
    ...N('星読みの水しょうだ。', '中で、だれかの思い出が、ゆらゆらとゆれている…。'),
    ['choice', '水しょうに手をかざす？（ノクトの思い出の中へ）', ['かざす', 'やめる'], [enterMemory(), []]],
  ];
}

// ───────────── 本物の ノクト（水しょうの 前。c5_nocto）─────────────
function noctoScene() {
  const C = HOSHIYOMI_POS.crystalFront;
  const all = (x) => memoryShardsAll(x.flag);
  return [
    ['bgm', null],
    ['look', C.x, C.y + 1],
    ...N('…気がつくと、星読みの水しょうの前に、もどっていた。'),
    ['actor', 'nocto_real', { sprite: 'nocto', x: C.x, y: C.y + 3, dir: 'up' }],
    ['sfx', 'dark'],
    ...N('家の入口に、だれかが立っている…。', 'フードをはずした、黒いかみの少年――。'),
    ...S('ノクト', '…見たのか、ぼくの思い出を。'),
    ['if', all, [
      ...S('ノクト', '…ぼくの思い出を、全部…？'),
      ...N('{name}は、6つの思い出のかけらの光を、そっと見せた…。'),
      ...S('ノクト', '……。', '…同情なんかいらない。'),
      ...S('ノクト', '…でも。\n…ピピは、元気か。'),
      ...N('{name}がうなずくと、ノクトは、少しだけ目をふせた…。'),
    ], [
      ...S('ノクト', '…同情なんかいらない。'),
    ]],
    ...S('ホシミばあちゃん', 'ノクト…！\nわしは…わしは、あの日…。'),
    ...S('ノクト', '……。'),
    ...S('ノクト', '大地の守り星は、ぼくが持っている。', '返してほしければ…大地の神殿まで、来ればいい。'),
    ['sfx', 'dark'], ['flash'],
    ['remove', 'nocto_real'],
    ...N('ノクトのすがたは、影の中へ、すうっと消えた…。'),
    ...S('星読みのカナタ', '…あの子は、まだ、選ぶとちゅうなのじゃ。', '{name}よ。\nそなたの紋章の光が、いつか、あの子の道をてらすかもしれん。'),
    ['look'],
    ['flag', K6.nocto], ['sync'],
    // 第5章 Step 6 へ（大地の 神殿）
    ...N('（大地の神殿…。\nハネノの町の長ソラネなら、何か知っているかもしれない）'),
    ['bgm', 'resume'],
    ['objective', OBJ.nocto],
  ];
}

// ───────────── 思い出の 迷宮（階に 入った ときの ことば。1回だけ。主人公の 思い出も 少し）─────────────
const ENTER = {
  1: () => [
    ['bgm', 'memory'],
    ...N('水しょうの光をぬけると――', 'あたりが、星祭りの夜の、村の広場に変わっていく…。\n（ここは…ノクトが5さいの時の、思い出…？）'),
    ...N('（同じ夜。5さいの{name}も、この広場にいた）'),
    ...N('（思い出の中は、くらい…。\n星読みのランプの光を、ランプ台にうつしてみよう）'),
    ['flag', K6.memory],
  ],
  2: () => N('星がよく見える、夜の丘…。\n（7さいの時の思い出のようだ）', '（7さいの{name}は、村の子どもたちと、日がくれるまで遊んでいた）'),
  3: () => N('しんしんと、雪がふっている…。\n（9さいの冬の思い出のようだ）', '（9さいの冬、{name}は、ホシミばあちゃんに、星の話を聞いていた）', '（この階は、しずかだ…。星のいずみで休めそうだ）'),
  4: () => N('くらい森の中…。木々が、ざわざわとゆれている。\n（11さいの時の思い出のようだ）', '（11さいの夏、{name}は、ルカと川で魚をとって、大さわぎしていた）'),
  5: () => N('白い雲の上…。ハネノの町の、見晴らし台だ。\n（13さいの時の思い出のようだ）', '（13さいの春、{name}は、ばあちゃんの手伝いで、守り星の石をみがいていた）'),
  6: () => [
    ['bgm', null],
    ...N('星祭りのちょうちんの光…。\n（ついこの前の、2回目の星祭りの夜…「今」の思い出だ）'),
    ...N('（この夜、{name}は、広場で、フードの子に出会った）'),
    ['bgm', 'resume'],
  ],
};
const enterScript = (n) => () => [...ENTER[n](), ['flag', MF(n)], ['sync'], ['objective', OBJ[FLOOR_OBJ[n]]]];

// ───────────── 光と 影（ランプ台。光る ランプ台は 1つの 階に 1つ）─────────────
function lampSteps(x, n, k) {
  const L = MEMORY_POS[n].lamps[k];
  if (x.flag(L.flag)) return N('ランプ台に、星読みのランプの光がついている。\n（ほかのランプ台を調べると、光をうつせる）');
  const others = Object.values(MEMORY_POS[n].lamps).filter((o) => o.flag !== L.flag && x.flag(o.flag));
  return [
    ['sfx', 'spell'],
    ...others.map((o) => ['unflag', o.flag]),
    // toggle … かわった マスに 立っている 人は となりへ よける（world/hazards.js）
    ['toggle', L.flag], ['sync'],
    ...N(`ランプ台に、星読みのランプの光をうつした！\n${others.length ? '（前のランプ台の光は、ふっと消えた）\n' : ''}柱の影が、すうっとのびていく…。`),
  ];
}
const lampScript = (n, k) => Object.assign((x) => lampSteps(x, n, k), { sameMap: true });

// ───────────── 思い出の かけら（各階 1つ。その 年の ノクトの 場面）─────────────
const MEM = {
  1: () => [
    ...N('星祭りの夜の広場…。\n守り星の石の前に、小さな子どもたちが、ならんでいる。'),
    ...N('紋章のぎしきだ。\nひとりずつ、手のこうの紋章を、石にかざしていく。'),
    ...N('{name}の紋章が、やさしく光った。\n大人たちが、手をたたいている…。'),
    ...N('つぎは、黒いかみの、小さな男の子。', '……紋章は、光らなかった。'),
    ...S('村の大人', '…光らない…？\n同じ夜に生まれた子なのに…。', '選ばれなかった子じゃ…。'),
    ...S('小さなノクト', '…どうして…。', '…どうして、ぼくだけ…。'),
    ...N('（しずみゆく島の、守り星のかけらで見た思い出と、同じだ…）'),
  ],
  2: () => [
    ...N('丘の上で、男の子がひとり、星を数えている…。'),
    ...S('ノクト', '…ひとつ、ふたつ…。', '星は、いいな。\nみんな、ひとりで光ってる。'),
    ...N('遠くで、子どもたちの声がする。'),
    ...S('村の子ども', 'ノクトとは遊んじゃだめって、\n母ちゃんが言ってた…。'),
    ...S('ノクト', '……。', '…いいよ。\nぼくには、星があるから。'),
  ],
  3: () => [
    ...N('雪の夜。\n村の門の前に、小さなにもつを持った男の子が立っている。'),
    ...N('男の子は、一度だけ、村をふり返った。'),
    ...S('ノクト', '…さよなら。'),
    ...N('雪の上の足あとは、すぐに消えていった…。', 'だれも、気がつかなかった…。'),
  ],
  4: () => [
    ...N('くらい森で、男の子がひざをかかえている。', '…どこからか、ひくい声がひびいた。'),
    ...S('ひくい声', '……ひとりぼっちの子よ……。'),
    ...S('ノクト', '…だれ…？'),
    ...S('ひくい声', '……わたしだけは、おまえを、ひとりにしない……。'),
    ...S('ノクト', '……ほんとう…？'),
    ...N('男の子の手の紋章に、黒いもやが、ゆっくりとしみこんでいった…。'),
  ],
  5: () => [
    ...N('見晴らし台で、小さな羽の子が、泣いている。'),
    ...S('小さなピピ', 'ぼく、また飛べなかった…。'),
    ...S('ノクト', '…飛べなくても、いいじゃないか。'),
    ...S('小さなピピ', '…ほんと？', '…ねえ。ノクト兄ちゃんは、どこにも行かないよね？'),
    ...S('ノクト', '……ああ。'),
    ...N('フードの下で、ノクトが、少しだけわらった…。'),
    ...S('ひくい声', '……その子も、いつか、おまえからはなれていく……。'),
    ...N('ノクトのわらい顔が、すっと消えた…。'),
  ],
  6: () => [
    ...N('広場のすみの、暗がり。\nフードの子が、祭りを見つめている。'),
    ...N('その目の先で、{name}が、仲間たちとわらっている…。'),
    ...S('ノクト', '…きみが、えらばれた子か。'),
    ...S('ノクト', '…ぼくは、選ばれなかった。', 'だから…ぼくは、自分で選ぶ。'),
    ...N('フードの子は、祭りのにぎわいに背を向けて、\n暗い道へ、ひとりで歩き出した…。'),
  ],
};
function shardSteps(x, n) {
  if (x.flag(MSHARD(n))) return [];
  const got = memoryShardCount(x.flag) + 1;
  const keep = Object.values(MEMORY_POS[n].lamps).some((L) => L.keep);
  return [
    ['bgm', null],
    ...N('思い出のかけらだ…。\n{name}が手をのばすと――'),
    ['sfx', 'sparkle'], ['flash'],
    ...MEM[n](),
    ['flash'],
    ['flag', MSHARD(n)], ['sync'],
    ['sfx', 'item'],
    ...N(`思い出のかけらを手に入れた！（${got}/${MEMORY_FLOORS}）${keep ? '\n（かけらの光で、ここへの影の道が、消えなくなった）' : ''}`),
    ['bgm', 'resume'],
  ];
}

// ───────────── 6階: ノクトの 影（c5_nshadow）→ 水しょうの 前へ → 本物の ノクト（c5_nocto）─────────────
function nshadowEvent() {
  const B = MEMORY_POS[MEMORY_BOSS].boss;
  const [bx, by] = [B.x + 0.5, B.y + 0.5];
  const all = (x) => memoryShardsAll(x.flag);
  const C = HOSHIYOMI_POS.crystalFront;
  return [
    ['bgm', null],
    ['look', bx, by],
    ...N('大広間のおくに、黒い影が立っている…。', 'フードをかぶった、子どもの形の影――。'),
    ...S('ノクトの影', '…見たんだろ。ぼくの思い出を。'),
    ...S('ノクトの影', 'ぼくは、ひとりでいい。', 'きみたちの「きずな」なんて…\nまねして、こわしてやる…！'),
    ['showMon', 'nocto_shadow'],
    ['sfx', 'dark'], ['flash'],
    ['showMon', null],
    ['look'],
    ['bgm', 'nocto_shadow'],
    ['battle', 'nocto_shadow'],
    ['bgm', null],
    ['look', bx, by],
    ['if', all, [
      ...S('ノクトの影', '…ほんとうは…。', '…だれかに、見つけてほしかったんだ…。'),
      ['sfx', 'sparkle'], ['flash'],
      ...N('6つの思い出のかけらが、いっせいに光った…！', 'ノクトの影は、光の中で、小さな男の子のすがたになって…\nふっと、ほほえんで、消えていった…。'),
    ], [
      ...S('ノクトの影', '…ひとりなら…\nもう、だれにも、きずつけられない…。'),
      ...N('ノクトの影は、しずかに、やみの中へとけていった…。'),
    ]],
    ['flag', K6.nshadow], ['sync'],
    ['objective', OBJ.nshadow],
    ...N('思い出の迷宮が、白い光につつまれていく――'),
    ['fade', 'out'],
    ['teleport', 'hoshiyomi', C.x, C.y, 'down'],
    ['fade', 'in'],
    ['look'],
    ...noctoScene(),
  ];
}

// ───────────── 星読みの 練習（星見の 広場。里の 子どもの 小さな 星座の なぞ）─────────────
// 4つの 星を 上 → 右 → 下 → 左（時計回り）に ふむ。にせの 星や じゅんばんが ちがう 星を ふむと、光った 星が 消える
const practiceDone = (x) => PRACTICE_FLAGS.filter((f) => x.flag(f)).length;
function resetPractice(x, text) {
  return [['sfx', 'dark'], ...PRACTICE_FLAGS.filter((f) => x.flag(f)).map((f) => ['unflag', f]), ['sync'], ...N(text)];
}
function practiceStep(x, i) {
  if (x.flag(PRACTICE_DONE) || x.flag(PRACTICE_FLAGS[i])) return [];
  const done = practiceDone(x);
  if (i !== done) {
    return resetPractice(x, done ? '光っていた星が、ふっと消えてしまった…。\n（じゅんばんが、ちがったようだ）' : '星が一しゅん光って、すぐに消えた…。\n（じゅんばんが、ちがうようだ）');
  }
  const steps = [['sfx', 'sparkle'], ['flag', PRACTICE_FLAGS[i]], ['sync'], ...N(`足もとの星が、ぱっと光った！（${i + 1}/${PRACTICE_FLAGS.length}）`)];
  if (i === PRACTICE_FLAGS.length - 1) {
    steps.push(['flash'], ['sfx', 'item'], ['flag', PRACTICE_DONE], ['sync'],
      ...N('4つの星が、光のすじでつながった…！', '小さな羽の形の、星座だ！'),
      ...S('リゲル', 'やった！\nこっちに来て！ごほうびがあるんだ！'));
  }
  return steps;
}
function practiceFake(x) {
  if (x.flag(PRACTICE_DONE) || !practiceDone(x)) return [];
  return resetPractice(x, '光っていた星が、みんな消えてしまった…。\n（羽の星座の星では、なかったようだ）');
}

// ───────────── だいほん ─────────────
export const HOSHIYOMI_SCRIPTS = {
  // クモイ地方: 風見の石3（星読みの里への 風の道）
  ...Object.fromEntries(Object.keys(KUMOI_ROADS).map((k) => [`c5_kroad_${k}`, (x) => roadSteps(x, k)])),
  // 星読みの里
  c5_y_arrive: (x) => (x.flag(K6.village) ? [] : villageArrive()),
  c5_kanata: (x) => kanata(x),
  c5_grandma_event: (x) => (x.flag(K6.grandma) || !x.flag(K6.kanata) ? [] : grandmaEvent()),
  c5_y_crystal: (x) => crystal(x),
  c5_y_grandma: (x) => {
    if (!x.flag(K6.nocto)) return S('ホシミばあちゃん', 'あの子の思い出は、つらいものばかりかもしれん…。', '{name}、たのんだよ。\nわしは、ここで待っておる。');
    return S('ホシミばあちゃん', 'ノクトは…わしのことを、ゆるしてはくれんじゃろう。', 'それでも、わしは、あの子の帰る場所でいたいんじゃ。');
  },
  c5_inn_hoshiyomi: (x) => innSteps('宿屋のおかみ', 90, x),
  c5_shop_yw: () => [['shop', 'hoshiyomi_weapon']],
  c5_shop_ya: () => [['shop', 'hoshiyomi_armor']],
  c5_shop_yi: () => [['shop', 'hoshiyomi_item']],
  c5_y_deshi: (x) => (x.flag(K6.kanata)
    ? S('星読みの弟子', 'このところ、里のまわりに、黒い服の男たちがうろついているんです。', '…だれかを、探しているようでした。\nお気をつけて。')
    : S('星読みの弟子', 'カナタさまの家は、里のおく。北の大きな家です。')),
  c5_y_old: (x) => (x.flag(K6.nocto)
    ? S('星読みのおばあさん', 'カナタさまの家から、黒いかみの子が出ていくのを見たよ…。', 'さびしそうな目をした子だったねえ。')
    : S('星読みのおばあさん', 'この里ではね、生まれた子の星を読むのが、ならわしなんじゃよ。', '星は、その子の明日を、そっと教えてくれるのさ。')),
  c5_y_man: () => S('星見の男', '星は、うそをつかない。', 'まちがえるのは、いつも、読む者の方なのさ。'),
  c5_y_woman: (x) => (x.flag(K6.grandma)
    ? S('里のおくさん', 'さっきの大きな竜、すごかったわね！', '竜に乗ってきたおばあさん、カナタさまの古い友だちなんですって。')
    : S('里のおくさん', 'ここ何日か、夜空がにごっていて、星読みも大変なの。', '島がしずみ始めてから、星まで元気がないみたい…。')),
  c5_y_scope: (x) => (x.night
    ? N('大きな遠めがねだ。のぞいてみると…', '夜空いっぱいに、星がきらめいている。\nとなりあって光る、2つの小さな星が見える…。')
    : N('大きな遠めがねだ。のぞいてみると…', '昼の空は、まぶしいだけだ。\n（夜にのぞくと、星が見えそうだ）')),
  c5_y_chart2: () => N('カナタの星図だ。', '星祭りの夜の空に、2つの小さな星が、となりあってかかれている…。'),
  c5_y_stone: () => N('星の石ぶみだ。文字がきざまれている。', '「星は、ひとりで光るにあらず。\nとなりの星と、星座になる」'),
  // 星読みの 練習（星見の 広場の 子どもたち）
  c5_y_chart: () => N('子どもがかいた、星座の絵だ。', '「小さな羽の星座」…\nひし形にならんだ4つの星が、いちばん上の星から、時計回りに線でつながっている。'),
  ...Object.fromEntries(PRACTICE_ORDER.map((_, i) => [`c5_ystar${i + 1}`, (x) => practiceStep(x, i)])),
  c5_ystar_x: (x) => practiceFake(x),
  c5_y_kid1: (x) => (x.flag(PRACTICE_DONE)
    ? S('スピカ', 'すごい！羽の星座、できたね！', ...(x.flag(PRACTICE_PRIZE) ? [] : ['リゲルが、ごほうびをくれるよ！']))
    : S('スピカ', 'わたしたち、星読みの練習をしてるの！', 'ゆかの星を、星座のじゅんにふむと、星がつながるんだよ。', '夜になると、本物の星だけが光るの。\n昼は、広場のかどの絵を見てね！')),
  c5_y_kid2: (x) => (x.flag(PRACTICE_DONE)
    ? S('ベガ', 'いいなあ…。\nわたしも、がんばる！')
    : S('ベガ', 'わたし、まだ一度も、できたことないの…。', 'にせものの星をふむと、光った星が、みんな消えちゃうんだ。')),
  c5_y_kid3: (x) => {
    if (!x.flag(PRACTICE_DONE)) return S('リゲル', 'ぼくがかいた星座の絵、見た？', 'いちばん上の星から、時計の回るじゅんに、つなぐんだぜ！');
    if (x.flag(PRACTICE_PRIZE)) return S('リゲル', 'ほかの星座も、探してみるんだ！', '夜空って、星座だらけなんだぜ！');
    return [
      ...S('リゲル', 'やった！星がつながった！', 'これ、里の宝物なんだ。\n星読みの木になる、ふしぎな実だよ。'),
      ['item', 'seed_hp'], ['item', 'seed_mag'],
      ['flag', PRACTICE_PRIZE],
      ...S('リゲル', 'みんなには、ないしょだぞ！'),
    ];
  },
  // 思い出の 迷宮
  ...Object.fromEntries(Array.from({ length: MEMORY_FLOORS }, (_, i) => [`c5_mf${i + 1}`, enterScript(i + 1)])),
  ...Object.fromEntries(Array.from({ length: MEMORY_FLOORS }, (_, i) => Object.keys(MEMORY_POS[i + 1].lamps).map((k) => [`c5_mlamp_${i + 1}_${k}`, lampScript(i + 1, Number(k))])).flat()),
  ...Object.fromEntries(Array.from({ length: MEMORY_FLOORS }, (_, i) => [`c5_mshard${i + 1}`, (x) => shardSteps(x, i + 1)])),
  // 3階: 休み所の 星の いずみ（回復と 記録。夜まで・朝まで 休める）
  c5_m_rest: () => [
    ...N('星のいずみだ。', 'すきとおった水の中で、雪のような光が、きらきらとまっている…。'),
    ['choice', 'いずみで休む？', ['休む', '夜まで休む', '朝まで休む', 'やめる'], [
      [['fade', 'out'], ['sfx', 'heal'], ['heal'], ['wait', 700], ['fade', 'in'],
        ...N('いずみの光が、ふわりと広がった…。\nみんなのHPとMPが、すっかり回復した！'), ['church']],
      [['inn', 0, null, 'night'], ['church']],
      [['inn', 0, null, 'morning'], ['church']],
      [],
    ]],
  ],
  // 6階: ノクトの 影
  c5_nshadow_event: (x) => (x.flag(K6.nshadow) ? [] : nshadowEvent()),
};

// ───── ホシミばあちゃん（ホシフル村。c5_shard の あと。story-ch5.js の elderCh5 から）─────
export function elderHoshiyomi(x) {
  if (!x.flag(K6.grandma)) {
    return S('ホシミばあちゃん', '守り星のかけらの中の、泣いている子…。', '……。', '{name}。\nわしにも、話さねばならんことがある。\nじゃが…もう少しだけ、待っておくれ。');
  }
  if (!x.flag(K6.nocto)) {
    return S('ホシミばあちゃん', 'ノクトの思い出の中は、どうじゃった…？', 'わしは、アステルさまに乗せてもらって、\n星読みの里と、この村を行ったり来たりしておるよ。');
  }
  return S('ホシミばあちゃん', 'ノクトは…わしのことを、ゆるしてはくれんじゃろう。', 'それでも、わしは、あの子の帰る場所でいたいんじゃ。');
}

// ───── 目標の 行き先（quest-targets.js）─────
const hat = (p) => ({ map: 'hoshiyomi', x: p.x, y: p.y });
const mat = (n, p) => ({ map: memoryMapId(n), x: p.x, y: p.y });
const down = (n) => mat(n, MEMORY_POS[n].down);
// その 階の ランプ台（光らせたら しるしは 消える）
const lampAt = (n, k) => ({ ...mat(n, MEMORY_POS[n].lamps[k]), unless: LAMP(n, k) });
export const HOSHIYOMI_OBJECTIVE_TARGETS = {
  [OBJ.village]: [{ npc: 'kanata' }],
  [OBJ.kanata]: [hat({ x: HOSHIYOMI_POS.doorFront.x + 3, y: HOSHIYOMI_POS.doorFront.y })],
  [OBJ.grandma]: [hat(HOSHIYOMI_POS.crystal)],
  [OBJ.memory]: [lampAt(1, 1), down(1)],
  [OBJ.m2]: [lampAt(2, 1), lampAt(2, 2), down(2)],
  [OBJ.m3]: [mat(3, MEMORY_POS[MEMORY_REST].font), down(3)],
  [OBJ.m4]: [lampAt(4, 2), down(4)],
  [OBJ.m5]: [lampAt(5, 1), lampAt(5, 2), down(5)],
  [OBJ.m6]: [{ npc: 'nocto_shade' }],
  [OBJ.nshadow]: [hat(HOSHIYOMI_POS.crystal)],
  [OBJ.nocto]: [{ npc: 'sorane' }],
};

// ───── 仲間会話（party-talk.js。「はなす」の ヒント）─────
export const HOSHIYOMI_OBJECTIVE_TALK = {
  [OBJ.village]: {
    self: '星読みのじいさまカナタは、里のおくの北の大きな家にいるらしい。',
    bold: 'カナタってじいさんに会いに行こうぜ！北のでっかい家だ！',
    kind: 'カナタさまは、わたしたちが来ることを、星で読んでいたそうです。北の家へ行きましょう。',
    kid: '星読みのじいさまって、どんな人かな？北の家だって！',
  },
  [OBJ.kanata]: {
    self: '外で大きな羽の音がした。カナタの家の外へ出てみよう。',
    bold: '今の羽の音…竜か？外へ出てみようぜ！',
    kind: '外に、だれか来たようですね。出てみましょう。',
    kid: 'バサバサって音がしたよ！外を見てみよう！',
  },
  [OBJ.grandma]: {
    self: 'カナタの家の星読みの水しょうから、ノクトの思い出の中へ入れる。ランプ台に光をうつすと、柱の影の中に道ができるらしい。',
    bold: '水しょうに手をかざせば、思い出の中へ行けるんだな。準備ができたら行くぞ！',
    kind: 'ノクトさんの思い出の中へ…。宿屋とお店で、しっかり準備をしてから行きましょう。',
    kid: '思い出の中に入れるの！？ランプ、大事にしようね！',
  },
  [OBJ.memory]: {
    self: 'ランプ台を調べると、ランプの光がうつる。光の反対がわに柱の影がのびて、影の中にだけ道があらわれる。',
    bold: 'ランプ台に光をうつせば、影の道ができるんだろ？片っぱしからためそうぜ！',
    kind: '光るランプ台は、1つだけのようです。どのランプ台に光をうつすと、柱の影がどちらへのびるか、よく見ましょう。',
    kid: 'ランプをつけると、影がのびるよ！影の上を歩けるんだって！',
  },
  [OBJ.m2]: {
    self: 'まん中のへやへわたったら、そこのランプ台で次の影の道を作る。前の影の道は消えるが、北のへやのランプ台で西へもどれる。',
    bold: '影の道を2本つなぐのか！向こうのへやのランプ台を使うんだな！',
    kind: '影の道は、ランプの光をうつすたびに変わります。わたった先のランプ台も、ためしてみましょう。',
    kid: 'つぎのへやにも、ランプ台があるよ！',
  },
  [OBJ.m3]: {
    self: 'この階は休み所だ。星のいずみで回復と記録ができる。魔物も出ない。',
    bold: '休み所だ！いずみで休んでいこうぜ。',
    kind: 'しずかな雪の階ですね。いずみで、ゆっくり休みましょう。',
    kid: '雪がふってる…。いずみで休もう！',
  },
  [OBJ.m4]: {
    self: 'まん中の柱のまわりに、ランプ台が3つ。光をうつすランプ台によって、柱の影が北・東・西へ回る。下りかいだんは東の島だ。',
    bold: '影がぐるっと回るのか！東の島に行くには、西がわのランプ台だな！',
    kind: '光と反対のがわに、影はのびます。東へ行きたい時は、西のランプ台ですね。',
    kid: 'ランプをかえると、影がくるっと回るよ！',
  },
  [OBJ.m5]: {
    self: '2つ目のへやに、ランプ台が3つ。南へのびる影は下りかいだんへ、東はかけらのへやへ、西は最初のへやへもどる道になる。',
    bold: 'ランプ台が3つか…。南の影で下へ行けるな！',
    kind: '3つのランプ台を、使い分けましょう。かけらのへやは東のようです。',
    kid: 'ランプ台がいっぱい！どれから光らせる？',
  },
  [OBJ.m6]: {
    self: 'いちばん下の大広間に、だれかがいる。思い出のかけらを集めてから行くと、何かが変わるかもしれない。',
    bold: 'この先に、何かいるぜ…。準備ができたら、行くぞ！',
    kind: '大広間のおくに、だれかが待っています…。かけらは、集められましたか？',
    kid: 'くらい広間…。だれかいるよ…。',
  },
  [OBJ.nshadow]: {
    self: '思い出の迷宮から出た。星読みの水しょうの前へもどろう。',
    bold: '外に出られたな！水しょうの前へ行ってみようぜ。',
    kind: '水しょうの前に、もどりましょう。',
    kid: 'もどってこられたね！水しょうのところへ行こう！',
  },
  [OBJ.nocto]: {
    self: 'ノクトは、大地の守り星を持って、大地の神殿で待つと言った。ハネノの町の長ソラネに、神殿のことを聞いてみよう。',
    bold: 'ノクトのやつ…。大地の神殿、ぜったい行ってやる！まずはハネノのソラネさんだ！',
    kind: 'ノクトさん…。ひとりで、何を選ぼうとしているのでしょう。ハネノの長ソラネさまなら、大地の神殿を知っているはずです。',
    kid: 'ノクト兄ちゃん、ピピが待ってるのに…。ハネノに行って、長さまに聞いてみよう！',
  },
};

// ───── すすみぐあい（progress.js。story-ch5.js の CH5_PROGRESS の うしろ）─────
export const HOSHIYOMI_PROGRESS = [
  [K6.village, OBJ.village],
  [K6.kanata, OBJ.kanata],
  [K6.grandma, OBJ.grandma],
  [K6.memory, OBJ.memory],
  ...[2, 3, 4, 5, 6].map((n) => [MF(n), OBJ[FLOOR_OBJ[n]]]),
  [K6.nshadow, OBJ.nshadow],
  [K6.nocto, OBJ.nocto],
];

export { MEMORY_SHARD_FLAGS, KUMOI_POS, KUMOI_VANES };
