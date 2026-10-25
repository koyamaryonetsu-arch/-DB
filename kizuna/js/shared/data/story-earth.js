// 第5章 Step 6・7「大地の神殿」「ノクト（1回目）・影の城がうかぶ・みんなが集まる」の だいほん（data/story-ch5.js で まぜる）
// ※ ネタバレ注意: 第5幕の 中みが 書いてある（docs/plan-ch5.md の 16 の 実装メモ）
// ・本物の ノクトに 会った あと（c5_nocto）→ ハネノの 長ソラネ「大地の 神殿は、ハネノの 南の 根の島から 下へ」。ピピ「ぼくも 行く！」→ ソラネが 止める。
//   ソラネが 長の 羽の しるしで 神殿の 入口の 根を ほどく（c5_root）。根の島へは ハネノの島の 南の 風見の石4（風の道 w9）か 竜で
// ・大地の 神殿 8階（c5_etemple。根の道・土の守り手・2つに 分かれる 道・休み所と 近道・ゴーレムの 足場・大地の こどう）
// ・5階: こっそり ついてきて 根に はさまれた ピピを 助ける → ピピの 手紙（大事な物 pipi_letter）→ アステルが ピピを ハネノへ（c5_pipi_save）
// ・8階: 大地の 守り星の 祭だんで ノクト（1回目。きまった 戦い nocto_1。B）→ c5_nocto1。戦いの あとの ことばは ピピの 手紙で かわる
//   → ノクトが 祭だんに 紋章を かざし、守り星を 持ったまま 影の 中へ → 神殿の 外へ → 雲の 海から 影の城が うかぶ（c5_castle。クモイ地方が かわる）
// ・ハネノに これまでの 人たち（女王ネフィ・かしらバルガ・水のみこミラ・サラ・ユキナ・ルカ・ホシミばあちゃん）が 集まる。1人ずつ 話すと 力を くれる
//   （ネフィ・バルガ・ミラ・サラ … B の GATHER_GIFTS の 装備 / ルカ … 道具 / ユキナ … いのりの歌 / ばあちゃん … 星の石の かけら）
//   → 7人 ぜんぶで ソラネ「影の城へ 行く 風の道を、ハネビト みんなで つくります」（c5_gather。「第5章の続きはアップデートで！」）
// 根の島と 神殿の 魔物・きまった 戦い nocto_1・ランク9の 店の 品・神殿の 宝箱の 品・みんなの 装備は B（戦い・品）が 作る（plan-ch5.md の 16）
import { KUMOI_POS, KUMOI_ROADS, KUMOI_VANES, HANONO_POS } from '../maps/kumoi.js?v=b4e31baa770b';
import {
  K7, EF, JAR, GOLEM_LOST, PIT_FLAG, LIFT_FLAG, DROP_FLAG, SWITCH_WAIT, DOOR4_FLAG, LETTER_FLAG, GATHER, GATHER_FLAG,
  EARTH_FLOORS, EARTH_POS, EARTH_GOLEMS, EARTH_OUT, EARTH_REST, golemState, golemCellKind, earthMapId,
} from '../maps/earth.js?v=b4e31baa770b';
import { GATHER_GIFTS } from './items-earth.js?v=b4e31baa770b';
// Step 8: みんなと 話した あとの 長ソラネ（影の城への 風の道。story-castle.js）
import { soraneCastle } from './story-castle.js?v=b4e31baa770b';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);

// ───── 物語の すすみかた（CH5_STEPS の c5_nocto の うしろ。plan-ch5.md の 16 の 名前の 約束）─────
export const EARTH_STEPS = [K7.root, K7.etemple, K7.pipi, K7.nocto1, K7.castle, K7.gather];

// ───── 目標 ─────
// c5_nocto の あとの 目標は story-hoshiyomi.js の HOSHIYOMI_OBJ.nocto（前の「第5章の続きは…」の 文は story-ch5.js の OLD_C5_OBJ.nocto）
export const EARTH_OBJ = {
  root: 'ハネノの島の南の風見の石を回して、南の風の道で「根の島」へ。根の島の大地の神殿に入ろう（竜でも行ける）',
  // etemple・e2〜e8 は その 階に 来た しるし（c5_etemple・c5_ef2〜c5_ef8）の あとの 目標
  etemple: '大地の神殿を、下へ下へ進もう。根の水がめを調べると、大きな根がのびる（5階に休み所があるらしい）',
  e2: '2階。水がめで根をのばすと、べつの根がちぢむ。わたった先の島の水がめも、使ってみよう',
  e3: '3階。石板を調べると、土の守り手が前へ1歩ずつ歩く。石の道のあなを、守り手でうめよう',
  e4: '4階。左右の道のおくの「ふむ石」を、2つ同時にふもう（家族で分かれるか、仲間に待っていてもらおう）',
  e5: '5階は休み所。大地のいずみで休もう。…おくから、だれかの声が聞こえる',
  pipi: '5階の北のへやのおくの下りかいだんから、さらに下へ。ピピの手紙を、ノクトにとどけよう',
  e6: '6階。土の守り手を根の橋でわたらせて、根のすきまから下の階へ落とそう。下の階の足場になる',
  e7: '7階。地面がふるえ始めたら、立ち止まろう。北の谷の、守り手の足場をわたって進もう',
  e8: 'いちばん下の階…。大地の守り星の祭だんで、ノクトが待っている。準備を整えてから進もう',
  nocto1: '大地の神殿のいちばん下の、祭だんを調べよう',
  castle: 'ハネノの町の広場に、地上からなつかしい人たちが来た。みんなと話そう',
  // Step 7 の さいご（Step 8 で 長ソラネへの 文に かえた。前の「第5章の続きは…」の 文は story-ch5.js の OLD_C5_OBJ.gather）
  gather: 'ハネビトたちが、影の城への風の道をつくっている。準備ができたら、ハネノの町の長ソラネに話しかけよう',
};
const OBJ = EARTH_OBJ;
const FLOOR_OBJ = { 1: 'etemple', 2: 'e2', 3: 'e3', 4: 'e4', 5: 'e5', 6: 'e6', 7: 'e7', 8: 'e8' };

// パーティー全員で 見る イベント（リーダーの 世界で すすむ）
const JAR_IDS = Array.from({ length: EARTH_FLOORS }, (_, i) => Object.keys(EARTH_POS[i + 1].jars).map((k) => `c5_ejar_${i + 1}_${k}`)).flat();
export const EARTH_STORY_SCRIPTS = [
  'c5_kroad_w9', 'c5_pipi_e5', 'c5_nocto1_event', 'c5_e_altar', 'c5_eswitch_a', 'c5_eswitch_b',
  ...Array.from({ length: EARTH_FLOORS }, (_, i) => `c5_ef${i + 1}`),
  ...JAR_IDS,
  ...Object.keys(EARTH_GOLEMS).flatMap((n) => [`c5_eslab_${n}`, `c5_eundo_${n}`]),
  ...GATHER.map((k) => `c5_gather_${k}`),
];

// ───────────── 風見の石4（ハネノの島の 南。長ソラネの 話の あと、南の 根の島へ 風の道を 開ける）─────────────
function road9(x) {
  const R = KUMOI_ROADS.w9;
  if (!x.flag(K7.root)) return N('風見の石だ。', '矢じるしが、南を指したまま、ぴくりとも動かない…。\n（南の雲の下に、何かあるのだろうか）');
  const on = x.flag(R.flag);
  return [
    ...N('風見の石だ。', on ? '石の上の矢じるしは、南を指している。\n南の雲の上に、風の道がふいている。' : '石の上の矢じるしが、南をさしたがっている…。'),
    ['choice', '風見の石を回す？', ['回す', 'やめる'], [
      [['sfx', 'door'], ['toggle', R.flag], ['sync'], ['sfx', 'wind'],
        ...(on ? N('ゴオオ…。\n南の風の道が、雲の中へ消えた。') : N('ゴオオ…！\n南の雲の上に、風の道が開いた！', '（風の道は、南の「根の島」へつづいている）'))],
      [],
    ]],
  ];
}

// ───────────── ハネノの 長ソラネ（c5_nocto の あと。story-kumoi.js の sorane から）─────────────
function rootScene() {
  const D = { x: 23.5, y: 9.5 };
  return [
    ['bgm', null],
    ...S('長ソラネ', '…ノクトが、大地の神殿で待つ、と…？'),
    ...S('長ソラネ', '大地の神殿は、島々のまん中の、ずっと下にあります。', '島々をささえる大きな木の根が、神殿を、ゆりかごのようにつつんでいるのです。'),
    ...S('長ソラネ', '入口は、ハネノの島の南の「根の島」。\nハネノの島の南の風見の石を回せば、根の島へ、風の道が開くはずです。'),
    ['actor', 'pipi_root', { sprite: 'pipi', x: D.x, y: D.y, dir: 'up' }],
    ['move', 'pipi_root', [[D.x, D.y - 2]]],
    ...S('ピピ', 'ノクト兄ちゃんに、会いに行くの！？', 'ぼくも行く！\nぼくが行けば、兄ちゃん、きっと…！'),
    ...S('長ソラネ', 'なりません、ピピ。', '神殿の中には、魔物がうろついています。\n…それに、あなたの羽では、谷をこえられません。'),
    ...S('ピピ', '……。', '…わかったよ。'),
    ['move', 'pipi_root', [[D.x, D.y]]],
    ['remove', 'pipi_root'],
    ...N('ピピは、うつむいたまま、出ていった…。'),
    ...S('長ソラネ', '…あの子の気持ちは、わかるのです。', 'ですが、わたしは、もう、だれもうしないたくない…。'),
    ...S('長ソラネ', '神殿の入口の根のとびらは、ハネビトの長の羽のしるしでしか、ほどけません。', '…今、風にのせて、しるしを送ります。'),
    ['sfx', 'wind'],
    ...N('ソラネが白い羽を広げると、やわらかな風が、南の空へふいていった…。'),
    ['flag', K7.root], ['sync'],
    ...S('長ソラネ', '根の島のとびらが、ほどけたはずです。', '紋章の子よ。\n…どうか、ノクトを。'),
    ['bgm', 'resume'],
    ['objective', OBJ.root],
  ];
}
export function soraneEarth(x) {
  if (!x.flag(K7.root)) return rootScene();
  if (!x.flag(K7.etemple)) return S('長ソラネ', '根の島へは、ハネノの島の南の風見の石から、風の道で。\n星の竜アステルさまでも、行けるでしょう。', '神殿の入口の根は、もう、ほどけているはずです。');
  if (!x.flag(K7.pipi)) return S('長ソラネ', '…ピピのすがたが、どこにも見えないのです。', 'まさか、あの子…。');
  if (!x.flag(K7.nocto1)) return S('長ソラネ', 'ピピを助けてくださって、ありがとうございました…！', '…あの子ったら。\n…でも、あの子の気持ちも、わかるのです。');
  if (!x.flag(K7.gather)) return S('長ソラネ', '影の城が…。\n雲の海の底に、あんなものがねむっていたなんて…。', '広場に、地上から、たくさんの方々が来てくださいました。\nどうか、みなさんと、話してあげてください。');
  // みんなと 話した あと（Step 8。影の城への 風の道）
  return soraneCastle(x);
}

// ───────────── ハネノの ピピ（c5_nocto の あと。story-kumoi.js の pipi から）─────────────
export function pipiEarth(x) {
  if (!x.flag(K7.root)) return S('ピピ', '…ノクト兄ちゃんに、会ったの！？', '兄ちゃん、元気だった？\n…そっか。…ぼく、待ってるって、伝えてくれた？', 'いつか、羽が大きくなったら、ぼくが兄ちゃんをむかえに行くんだ！');
  if (!x.flag(K7.nocto1)) return S('ピピ', 'ごめんなさい…。\n長さまに、すっごくおこられちゃった。', '…手紙、ノクト兄ちゃんに、わたしてね。');
  if (x.flag(LETTER_FLAG)) {
    return S('ピピ', '兄ちゃんに、手紙…わたしてくれたんだね。', '…兄ちゃん、読んでくれた？\n…そっか。…そっか。', 'ぼく、ここで待ってる。\n兄ちゃんが帰ってくるまで、ずっと。');
  }
  return S('ピピ', '兄ちゃん…あの黒いお城に、いるの？', '…ぼく、ここで待ってる。');
}

// ───────────── ホシミばあちゃん（ホシフル村。c5_root の あと。story-ch5.js の elderCh5 から）─────────────
export function elderEarth(x) {
  if (!x.flag(K7.etemple)) return S('ホシミばあちゃん', '大地の神殿…。', '{name}。ノクトのことを、たのんだよ。\n…わしも、何かできることを、探してみる。');
  if (!x.flag(K7.castle)) return S('ホシミばあちゃん', '大地の神殿の、いちばん下に、ノクトが…。', '{name}、むりはせんでな。\n5階の休み所で、しっかり休むんじゃよ。');
  if (!x.flag(GATHER_FLAG('grandma'))) return S('ホシミばあちゃん', '雲の上に、黒い城が見える…。', 'わしも、アステルさまに乗せてもらって、ハネノへ行っておるよ。\n{name}、ハネノの広場で、待っておる。');
  return S('ホシミばあちゃん', '星の石のかけらは、持っておるかい？', '…いつか、あの子に、わたしておくれ。');
}

// ───────────── 大地の 神殿（階に 入った ときの ことば。1回だけ）─────────────
const ENTER = {
  1: () => [
    ['bgm', 'earth_temple'],
    ...N('根のとびらをくぐると――', '大きな木の根が、天井からも、かべからも、うねるようにのびている…。'),
    ...N('（大地の神殿は、8階まで、下へ下へつづいているらしい。\n5階に、休み所があるようだ）'),
    ['flag', K7.etemple],
  ],
  2: () => N('根と根の間に、谷がいくつも口を開けている…。', 'あちこちに、古い水がめが置かれている。'),
  3: () => N('ズン…ズン…。', '谷の向こうに、石でできた大きな人形が立っている…。\n（あれが、土の守り手…？）'),
  4: () => N('道が、左と右に分かれている…。', 'まん中の根のとびらは、かたくとざされている。'),
  5: () => [
    ['bgm', null],
    ...N('…だれか…。', '…だれか、助けて…。'),
    ...N('おくの方から、小さな声が聞こえる…！'),
    ...N('（この階には、休み所があるようだ）'),
    ['bgm', 'resume'],
  ],
  6: () => N('大きな谷の上に、根の橋が2本かかっている…。', 'こちらの島にも、土の守り手が立っている。'),
  7: () => [
    ...N('ドクン…ドクン…。', '足もとから、大地の音がひびいてくる…。'),
    ...N('（地面がふるえ始めたら、立ち止まった方がよさそうだ…）'),
    ['if', (y) => y.flag(DROP_FLAG), N('（北の谷に、6階で落とした土の守り手が、足場になっているはずだ）'), []],
  ],
  8: () => [
    ['bgm', null],
    ...N('ひんやりとした、大きな広間…。', 'おくの祭だんで、土色の光がまたたいている…。'),
    ['bgm', 'resume'],
  ],
};
const enterScript = (n) => () => [...ENTER[n](), ['flag', EF(n)], ['sync'], ['objective', OBJ[FLOOR_OBJ[n]]]];

// ───────────── 根の道（根の 水がめ。のびる 根と ちぢむ 根）─────────────
// ゴーレムが 立っている 根が ちぢむと、ゴーレムは 落ちる（6階の B は 下の 階へ・ほかは 谷の 底へ）
function golemFall(x, n, has) {
  const G = EARTH_GOLEMS[n];
  if (!G) return [];
  const st = golemState(n, x.flag);
  if (st.gone || st.i === 0) return [];
  const kind = golemCellKind(n, st.i, has);
  if (kind !== 'drop' && kind !== 'gap') return [];
  const off = ['unflag', G.flags[st.i]];
  if (kind === 'drop') {
    return [off, ['flag', DROP_FLAG], ['sync'], ['sfx', 'rumble'], ['shake'],
      ...N('足もとの根がちぢんで――', '土の守り手が、根のすきまから、下の階へ落ちていった…！', '…ズズーン…！\n（ずっと下の方で、何かが止まった音がした）')];
  }
  return [off, ['flag', GOLEM_LOST(n)], ['sync'], ['sfx', 'rumble'],
    ...N('足もとの根がちぢんで――', '土の守り手が、谷の底へ落ちてしまった…！', '（もとにもどす石板を調べると、もとの場所にもどせそうだ）')];
}
function jarSteps(x, n, k) {
  const J = EARTH_POS[n].jars[k];
  const on = !x.flag(J.flag);
  const has = (f) => (f === J.flag ? on : x.flag(f));
  const grow = (on ? J.short : J.long).length > 0;
  const shrink = (on ? J.long : J.short).length > 0;
  const text = grow && shrink ? 'ギギギ…！\n大きな根がのびて、谷に橋がかかった！\n（そのかわり、べつの根が、しゅるしゅるとちぢんでいった…）'
    : grow ? 'ギギギ…！\n大きな根がのびて、谷に橋がかかった！'
      : 'シュルシュル…。\n根がちぢんで、谷の向こうへ引っこんでいった…。';
  return [
    ['sfx', on ? 'heal' : 'door'],
    ...N(on ? '根の水がめの水が、根の方へ流れこんでいく…！' : '根の水がめの水が、すうっと引いていった…。'),
    // toggle … かわった マスに 立っている 人は となりへ よける（world/hazards.js）
    ['toggle', J.flag], ['sync'],
    ...N(text),
    ...golemFall(x, n, has),
  ];
}
const jarScript = (n, k) => Object.assign((x) => jarSteps(x, n, k), { sameMap: true });

// ───────────── 土の守り手（ゴーレム。石板で 1歩ずつ 歩く）─────────────
const DIR_NAME = { N: '北', E: '東', S: '南', W: '西' };
async function slabCheck(run, n) {
  const G = EARTH_GOLEMS[n];
  const has = run.world.hasFlagFn(run.owner);
  const st = golemState(n, has);
  if (st.done) {
    await run.runSteps(N('守り手の石板だ。', G.stays ? '土の守り手は、重りのゆかの上で、じっとしている…。'
      : G.drop ? '（土の守り手は、もう、下の階へ落ちていった）' : '土の守り手は、あなをうめて、しずかにねむっている…。'));
    return;
  }
  if (st.lost) {
    await run.runSteps(N('守り手の石板だ。', '…しかし、土の守り手は、谷の底へ落ちてしまった。\n（もとにもどす石板を調べよう）'));
    return;
  }
  const next = st.i + 1;
  const kind = golemCellKind(n, next, has);
  if (kind === 'wall') {
    await run.runSteps(N('ズ…ズ…。', '土の守り手は、かべの前で、動かなくなった。\n（もとにもどす石板で、もとの場所にもどせる）'));
    return;
  }
  const c = G.track[next];
  const { people } = run.partyNow();
  const front = people.filter((m) => m.inWorld && m.map === G.map && Math.floor(m.x) === c.x && Math.floor(m.y) === c.y);
  if (front.length) {
    await run.runSteps(N('土の守り手が、歩き出そうとした…。', `（${front[0].char.name}が、前に立っている。どかないと、歩けない）`));
    return;
  }
  const off = st.i ? [['toggle', G.flags[st.i]]] : [];
  const step = ['sfx', 'rumble'];
  const STEPS = {
    floor: [...off, ['toggle', G.flags[next]], ['sync'], step, ...N('ズシン…！\n土の守り手が、1歩前へ歩いた。')],
    plate: [...off, ['toggle', G.flags[next]], ['flag', LIFT_FLAG], ['sync'], step, ['shake'],
      ...N('ズシン…！\n土の守り手が、重りのゆかの上にのった！', 'ガコン…！\nゴゴゴゴ…。', 'こわれていた上り下りのゆかが、動き出した…！\n（1階と5階を、行き来できるようになった！）')],
    pit: [...off, ['flag', G.done], ['sync'], step, ['shake'],
      ...N('ズシン…ズズーン！', '土の守り手は、あなの中へ落ちて…\nぴったりと、あなをうめた！', '（石の道が、つながった！）')],
    drop: [...off, ['flag', DROP_FLAG], ['sync'], step, ['shake'],
      ...N('土の守り手が、1歩前へ――', '根のすきまから、下の階へ落ちていった…！', '…ズズーン…！\n（ずっと下の方で、何かが止まった音がした）')],
    gap: [...off, ['flag', GOLEM_LOST(n)], ['sync'], step,
      ...N('土の守り手が、1歩前へ――', 'ガラガラガラ…！\n土の守り手は、谷の底へ落ちてしまった…！', '（もとにもどす石板を調べると、もとの場所にもどせそうだ）')],
  };
  await run.runSteps([...N('守り手の石板に、手をあてた…。'), ...STEPS[kind]]);
}
const slabScript = (n) => Object.assign(() => [['call', (run) => slabCheck(run, n)]], { sameMap: true });
function undoSteps(x, n) {
  const G = EARTH_GOLEMS[n];
  const st = golemState(n, x.flag);
  if (st.done) return N('もとにもどす石板だ。', '（土の守り手は、もう、やくめをはたしたようだ）');
  if (!st.lost && st.i === 0) return N('もとにもどす石板だ。', '土の守り手は、もとの場所に立っている。');
  return [
    ...N('もとにもどす石板だ。'),
    ['choice', '土の守り手を、もとの場所にもどす？', ['もどす', 'やめる'], [
      [['sfx', 'spell'], ...(st.i ? [['toggle', G.flags[st.i]]] : []), ...(st.lost ? [['toggle', GOLEM_LOST(n)]] : []), ['sync'], ['flash'],
        ...N('石板が光った…！', '土の守り手が、もとの場所に、すうっとあらわれた！')],
      [],
    ]],
  ];
}
const undoScript = (n) => Object.assign((x) => undoSteps(x, n), { sameMap: true });
const golemLook = (n) => () => N('土の守り手だ。\n石でできた、大きなゴーレム…。', `${DIR_NAME[EARTH_GOLEMS[n].dir]}を向いて、じっと立っている。`, '（そばの守り手の石板を調べると、向いている方へ歩きそうだ）');

// ───────────── 2つに 分かれる 道（4階の ふむ石。同時に ふまれると 根の とびらが 開く）─────────────
// 家族で 2人 いじょう いる ときは 1人ずつ（どちらが 先でも よい）。ひとりの ときは 仲間（サポート・ゲスト・馬車の 仲間）に
// 片方の ふむ石で「ここで 待っていて」もらって、もう 片方を ふむ（星の塔の 上り下りの ゆかの「のってもらう」と おなじ 考え方）
function openDoor4(helperName) {
  return [
    ['sfx', 'rumble'],
    ...N('2つのふむ石が、同時にしずんだ…！', 'ゴゴゴゴ…！\nまん中の根のとびらが、ゆっくりと開いていく…！'),
    ['unflag', SWITCH_WAIT.a], ['unflag', SWITCH_WAIT.b],
    ['flag', DOOR4_FLAG], ['sync'],
    ['sfx', 'door'],
    ...N(`（根のとびらは、開いたまま止まった）${helperName ? `\n${helperName}が、ふむ石からもどってきた。` : ''}`),
  ];
}
export async function switchCheck(run, side) {
  const owner = run.owner.char;
  if (owner.flags[DOOR4_FLAG]) return;
  const P = EARTH_POS[4];
  const other = side === 'a' ? 'b' : 'a';
  const { people: all, helpers } = run.partyNow();
  const people = all.filter((m) => m.inWorld && m.map === earthMapId(4));
  const on = (p) => people.filter((m) => Math.floor(m.x) === p.x && Math.floor(m.y) === p.y);
  const here = side === 'a' ? P.switchA : P.switchB, there = side === 'a' ? P.switchB : P.switchA;
  const waitThere = !!owner.flags[SWITCH_WAIT[other]], waitHere = !!owner.flags[SWITCH_WAIT[side]];
  const helper = helpers[0];
  if (!on(here).length) return;
  if (on(there).length || waitThere) {
    await run.runSteps(openDoor4(waitThere ? helper?.name || '仲間' : null));
    return;
  }
  const sink = N('ふむ石が、ゴトン…としずんだ。', 'しかし、もう1つのふむ石は、上がったままだ…。');
  if (people.length >= 2) {
    await run.runSteps([...sink, ...N('（もう1つの道のおくのふむ石を、家族のだれかが、同時にふむと…？）')]);
    return;
  }
  if (!helper) {
    await run.runSteps([...sink, ...N('（ひとりでは、2つのふむ石を、同時にふめない…。\n仲間を連れてこよう。酒場や「仲間」のメニューで、仲間を集められるよ）')]);
    return;
  }
  if (waitHere) {
    await run.runSteps([...N(`${helper.name}が、ふむ石の上で待っている。`), ['choice', `${helper.name}に、もどってもらう？`, ['そのまま待ってもらう', 'もどってもらう'], [
      N('（もう1つの道のおくのふむ石を、ふみに行こう）'),
      [['unflag', SWITCH_WAIT[side]], ['sync'], ...N(`${helper.name}が、もどってきた。`)],
    ]]]);
    return;
  }
  await run.runSteps([
    ...sink,
    ['choice', `${helper.name}に、ここで待っていてもらう？`, ['待っていてもらう', 'やめる'], [
      [['flag', SWITCH_WAIT[side]], ['sync'], ['sfx', 'rumble'],
        ...S(helper.name, 'まかせて。\nここで、ふむ石をおさえているよ。'),
        ...N(`${helper.name}は、ふむ石の上で待っている…。\n（もう1つの道のおくのふむ石を、ふみに行こう）`)],
      [],
    ]],
  ]);
}
const switchScript = (side) => Object.assign(() => [['call', (run) => switchCheck(run, side)]], { sameMap: true });

// ───────────── 5階: ピピ（根に はさまれて 動けない。c5_pipi_save・ピピの 手紙）─────────────
function pipiScene() {
  const P = EARTH_POS[EARTH_REST].pipi;
  return [
    ['bgm', null],
    ['look', P.x + 0.5, P.y + 0.5],
    ...N('根のかべの前で、小さな羽の子が、うずくまっている…。'),
    ...S('ピピ', '…あっ！\n{name}たちだ…！'),
    ...S('ピピ', 'ごめんなさい…。\nぼく、ノクト兄ちゃんに会いたくて…こっそり、ついてきちゃったんだ。'),
    ...S('ピピ', 'でも、根っこのすきまに、足がはさまって…\nずっと、動けなかったの…。'),
    ...N('{name}たちは、力を合わせて、太い根をおし上げた――'),
    ['sfx', 'rumble'], ['shake'],
    ...N('メリメリ…ズズズ…！', '根のかべが、ゆっくりとほどけていく…！'),
    ...S('ピピ', '…ぬけた！\nありがとう…！'),
    ...S('ピピ', '…ねえ。これ、ノクト兄ちゃんに、わたしてほしいんだ。', 'ぼく、字を書くの、にがてだけど…\nいっしょうけんめい、書いたの。'),
    ['item', 'pipi_letter'],
    ...S('ピピ', '兄ちゃんに会ったら、もう一度、伝えて。\nピピが、待ってるって。'),
    ['fade', 'out'],
    ['if', (y) => y.flag(LIFT_FLAG),
      N('{name}たちは、直した上り下りのゆかで、ピピを神殿の入口まで送りとどけた。'),
      N('{name}たちは、来た道をもどって、ピピを神殿の入口まで送りとどけた。')],
    ...N('入口の外では、星の竜アステルが、待っていてくれた。', 'ピピは、アステルの背に乗って、ハネノの町へ帰っていった…。'),
    ['fade', 'in'],
    ['flag', K7.pipi], ['sync'],
    ...N('（根のかべがほどけて、おくの下りかいだんへ行けるようになった）'),
    ['look'],
    ['bgm', 'resume'],
    ['objective', OBJ.pipi],
  ];
}

// ───────────── 8階: ノクト（1回目。c5_nocto1）→ 影の城が うかぶ（c5_castle）─────────────
function castleScene() {
  const C = KUMOI_POS.castle;
  const O = EARTH_OUT.outside;
  return [
    ['look', C.x + 0.5, C.y + 0.5],
    ['sfx', 'rumble'], ['shake'],
    ...N('雲の海が、大きなうずをまいている…！'),
    ['flash'], ['sfx', 'dark'], ['shake'],
    ...N('雲の海のまん中から――', '黒い城が、ゆっくりと、うかび上がってくる…！'),
    ['flag', K7.castle], ['sync'],
    ['bgm', 'kumoi_dusk'],
    ...N('空が、夕ぐれのように、くらくなっていく…。', '城のまわりで、黒い風が、うずをまいている…。'),
    ['look', O.x, O.y],
    ['actor', 'messenger', { sprite: 'hanebito_m', x: O.x + 4, y: O.y - 6, dir: 'down' }],
    ['move', 'messenger', [[O.x + 1, O.y - 1]]],
    ...S('ハネビトの使い', '紋章の子さま…！\nごぶじでしたか！'),
    ...S('ハネビトの使い', '今、ハネノの町に、地上から、たくさんの方々が来ています！\n星の竜アステルさまが、乗せてきてくださったのです！'),
    ...S('ハネビトの使い', '長さまも、町へもどってほしいと…！\nわたしは、先にもどっています！'),
    ['move', 'messenger', [[O.x + 4, O.y - 8]]],
    ['remove', 'messenger'],
    ...N('（黒い風で、ハネノの島の西の船着き場の風の道が、とぎれてしまったようだ…）'),
    ['look'],
    ['objective', OBJ.castle],
  ];
}
// ノクトが 祭だんに 紋章を かざし、守り星を 持ったまま 影の 中へ → 神殿が ゆれて 外へ → 影の城
function afterNocto() {
  const B = EARTH_POS[8].nocto;
  const O = EARTH_OUT.outside;
  return [
    ['look', B.x + 0.5, B.y + 0.5],
    ['if', (y) => y.has('pipi_letter'), [
      ...N('ノクトの手の中で、ピピの手紙が、まだ、かすかに光っている…。'),
      ...S('ノクト', '…ピピの、字だ…。'),
      ...N('「にいちゃんをまってるね。\nぼく、とべなくても、にいちゃんと、いっしょにいたい」'),
      ...S('ノクト', '……。', '…ばかだな。\n…ほんとうに、ばかだ…。'),
      ['takeItem', 'pipi_letter'], ['flag', LETTER_FLAG],
      ...N('ノクトは、手紙を、そっと胸にしまった…。'),
      ...S('ノクト', '…でも、もう、おそいんだ。'),
    ], [
      ...S('ノクト', '…今のは、ほんの小手調べだ。'),
    ]],
    ['hideNpc', 'nocto_e8'],
    ['actor', 'nocto_e8b', { sprite: 'nocto', x: B.x + 0.5, y: B.y - 1.5, dir: 'up' }],
    ...N('ノクトは、祭だんの前に立ち、手の紋章をかざした――'),
    ['sfx', 'dark'], ['flash'],
    ...N('ノクトの紋章から、黒い光があふれ出す…！', '祭だんの大地の守り星が、ノクトの手の中へ、すいこまれていった…！'),
    ['sfx', 'rumble'], ['shake'],
    ...S('ノクト', '雲の海の底にねむる城よ…。\n目を覚ませ。'),
    ['shake'],
    ['face', 'nocto_e8b', 'down'],
    ...S('ノクト', '影の城で、待っている。', '…来たければ、来ればいい。'),
    ['sfx', 'dark'], ['flash'],
    ['remove', 'nocto_e8b'],
    ...N('ノクトは、守り星を持ったまま、影の中へ消えた…。'),
    ['flag', K7.nocto1], ['sync'],
    ['sfx', 'rumble'], ['shake'],
    ...N('ゴゴゴゴゴ…！', '神殿が、大きくゆれている…！\n天井から、根と石が、くずれ落ちてくる――！'),
    ['fade', 'out'],
    ['teleport', 'kumoi', O.x, O.y, 'down'],
    ['fade', 'in'],
    ...N('…気がつくと、{name}たちは、根の島の神殿の前に立っていた。'),
    ...castleScene(),
  ];
}
function noctoEvent() {
  const B = EARTH_POS[8].nocto;
  const [bx, by] = [B.x + 0.5, B.y + 0.5];
  return [
    ['bgm', null],
    ['look', bx, by],
    ...N('祭だんの前に、だれかが立っている…。'),
    ...S('ノクト', '…来たのか。'),
    ...N('ノクトの手の中で、土色の光が、またたいている…。\n大地の守り星だ…！'),
    ...S('ノクト', 'この星の力で、雲の海の底にねむる城を、目覚めさせる。', '…あの声が、そう言うんだ。\n城がうかべば、ぼくは、もう、ひとりじゃなくなる、って。'),
    ...N('（あの声…？）'),
    ...S('ノクト', 'きみには、わからないよ。', '選ばれた子には…わからない。'),
    ...S('ノクト', '…じゃまをするなら、たおすだけだ。'),
    ['showMon', 'nocto_1'],
    ['sfx', 'dark'], ['flash'],
    ['showMon', null],
    ['look'],
    ['bgm', 'nocto_1'],
    ['battle', 'nocto_1'],
    ['bgm', null],
    ...afterNocto(),
  ];
}
function altarSteps(x) {
  if (x.flag(K7.castle)) return N('大地の守り星の祭だんだ。', '守り星があったくぼみに、根が、さびしそうにからみついている…。');
  if (x.flag(K7.nocto1)) {
    // とちゅうで 切れた とき（ノクトの 戦いの あと、城が うかぶ 前）
    const O = EARTH_OUT.outside;
    return [
      ...N('大地の守り星の祭だんだ。', 'ゴゴゴゴ…！\n神殿が、大きくゆれている…！'),
      ['fade', 'out'], ['teleport', 'kumoi', O.x, O.y, 'down'], ['fade', 'in'],
      ...castleScene(),
    ];
  }
  return N('大地の守り星の祭だんだ。', '土色の光が、まだ、かすかにのこっている…。');
}

// ───────────── みんなが 集まる（ハネノの 広場。c5_castle の あと）─────────────
// gift … B の GATHER_GIFTS の 装備（ネフィ・バルガ・ミラ・サラ）・ルカは 道具・ユキナと ばあちゃんは 大事な物
const GIFT = {
  nefi: {
    talk: [
      ...S('女王ネフィ', '{name}さん…！\nごぶじで、よかった…。'),
      ...S('女王ネフィ', 'アステルさまに乗せていただいて、ホシミさまたちと、ここまで来ました。', '影の城…。\n王家の古い書物にも、のっていない城です。'),
      ...S('女王ネフィ', 'これは、王家に代々つたわる、守りの品。\n…どうか、持っていってください。'),
    ],
    give: () => [['item', GATHER_GIFTS.nefi]],
    after: S('女王ネフィ', 'わたしは、もう、あやつられて何もできなかった女王では、ありません。', 'あなたたちの帰りを、ここで待ちます。\n…王国の女王として。'),
    again: S('女王ネフィ', 'ノクトという子も、ひとりで、何かをせおっているのですね。', '…わたしにも、少しだけ、分かる気がします。'),
  },
  barga: {
    talk: [
      ...S('かしらバルガ', 'よう。\n…空の上ってのは、砂の海より、風が冷てえな。'),
      ...S('かしらバルガ', 'おまえたちには、でかい借りがある。\n砂の海賊は、借りは必ず返す。'),
      ...S('かしらバルガ', '持っていけ。\n…砂の海賊の、とっておきだ。'),
    ],
    give: () => [['item', GATHER_GIFTS.barga]],
    after: S('かしらバルガ', '…ガキが、ひとりで城に、とじこもったんだってな。', 'ひとりぼっちのつらさなら、おれにも、少しは分かる。\n…たのんだぜ。'),
    again: S('かしらバルガ', 'ミラとサラを、たのむ…と言いてえところだが、\nあいつらは、おれより強えからな。'),
  },
  mira: {
    talk: [
      ...S('水のみこミラ', '{name}さん。'),
      ...S('水のみこミラ', '水の神殿で、わたしは長い間、ひとりで、水のろうの中にいました。', '…ひとりの時間は、心を、少しずつ、こおらせていくのです。'),
      ...S('水のみこミラ', 'その子の心も、きっと、こごえているのでしょうね。', 'これを。\n水の守り星の、いのりをこめました。'),
    ],
    give: () => [['item', GATHER_GIFTS.mira]],
    after: S('水のみこミラ', 'こおった心をとかすのは、いつだって、だれかのぬくもり、なのです。', '…あなたたちなら、きっと。'),
    again: S('水のみこミラ', 'サラったら、ハネビトの子どもたちに、ムチの使い方を教えているのよ。\n…ふふ。'),
  },
  sara: {
    talk: [
      ...S('サラ', 'あ、来た来た！'),
      ...S('サラ', '見て、これ！\nすなかぜ号の古い「ほ」の布で、ぬってもらったんだ。'),
      ...S('サラ', '風をうけて、砂の海を、どこまでも走った布だよ。\n…あんたに、あげる！'),
    ],
    give: () => [['item', GATHER_GIFTS.sara]],
    after: S('サラ', 'あたしも、母さんに会えるまで、ずっとひとりで、がんばってたんだ。', 'ノクトってやつにも、言ってやりなよ。\n「ひとりで、がんばらなくていい」って！'),
    again: S('サラ', '雲の上って、ふわふわして、歩きにくいね！\n…でも、ちょっと楽しいかも。'),
  },
  yukina: {
    talk: [
      ...S('ユキナ', '{name}さん…！\nアステルさまに乗せていただいて、来ちゃいました。'),
      ...S('ユキナ', '竜のみこには、古くから伝わる、いのりの歌があります。', 'やみにとざされたとびらも、この歌を聞けば、心を開くと言われています。'),
      ...S('ユキナ', '{name}さんに、教えますね。'),
      ['sfx', 'sparkle'],
      ...N('ユキナのすんだ歌声が、雲の上に、ひびいていく…。'),
    ],
    give: () => [['item', 'yukina_song']],
    after: S('ユキナ', 'わすれないでくださいね。', '…わたしの歌は、いつも、{name}さんといっしょです。'),
    again: S('ユキナ', 'アステルさま、地上とここを、何度も行ったり来たりしてくださって…。\n少し、つかれたお顔でした。'),
  },
  luca: {
    talk: [
      ...S('ルカ', '{name}！\nおそいぞ、まったく。'),
      ...S('ルカ', '…へへ。おれも、来ちゃった。', 'ばあちゃんがアステルに乗るって言うからさ、\nむりやり、くっついてきたんだ。'),
      ...S('ルカ', 'ほら、ホシフル村のみんなからだ。\n弁当…っていうか、薬とか、いろいろつめてきた！'),
    ],
    give: () => [['item', 'kumo_wataame', 6], ['item', 'hoshi_konpeito', 3], ['item', 'revive_flower', 2]],
    after: S('ルカ', '…なあ、{name}。', 'ノクトってやつのこと、ばあちゃんから聞いたよ。\nおれ、小さいころ、そいつのこと…ちゃんと見てなかった。', '…今度会ったら、あやまりたいんだ。\nだから、ぜったい、つれて帰ってこいよな！'),
    again: S('ルカ', '雲の上の町か…。\n村のみんなに、なんて話そうかな！'),
  },
  grandma: {
    talk: [
      ...S('ホシミばあちゃん', '{name}…。\nノクトに、会ったんじゃな。'),
      ...S('ホシミばあちゃん', 'あの子が生まれた夜も、空には、たくさんの星がふっておった…。\n{name}が生まれた、あの夜と、同じ星が。'),
      ...S('ホシミばあちゃん', 'これは、ホシフル村の守り星の石の、小さなかけらじゃ。', '村を出る前の日、あの子は、この石を、ひとりでずっとながめておった…。'),
    ],
    give: () => [['item', 'hoshifuru_stone']],
    after: S('ホシミばあちゃん', '…いつか、あの子に、わたしておくれ。', '「帰る場所は、ここにある」と。'),
    again: S('ホシミばあちゃん', 'わしは、ここで待っておるよ。\n{name}と、ノクトの帰りをな。'),
  },
};
// 7人 ぜんぶと 話した: 長ソラネ「影の城へ 行く 風の道を、ハネビト みんなで つくります」（c5_gather）
function gatherFinale() {
  const P = HANONO_POS.statue;
  return [
    ['bgm', null],
    ['actor', 'sorane_g', { sprite: 'sorane', x: P.x + 0.5, y: P.y - 3.5, dir: 'down' }],
    ['move', 'sorane_g', [[P.x + 0.5, P.y + 1.5]]],
    ['look', P.x + 0.5, P.y + 1.5],
    ...S('長ソラネ', 'みなさん…。\n遠い地上から、本当に、ありがとうございます。'),
    ...S('長ソラネ', '影の城は、黒い風のかべに、守られています。\n竜の羽でも、わたしたちの羽でも、こえられません。'),
    ...S('長ソラネ', '…ですが、ハネビトみんなの羽を合わせれば、\n城へわたる風の道を、つくれるはずです。'),
    ...S('長ソラネ', '弱った羽でも、みんなで合わせれば、きっと。', 'ハネビトみんなで、風の道をつくります。\n…少しだけ、時間をください。'),
    ['remove', 'sorane_g'],
    ['look'],
    ['flag', K7.gather], ['sync'],
    ...N('（準備ができたら、長ソラネに話しかけよう）'),
    ['bgm', 'resume'],
    ['objective', OBJ.gather],
  ];
}
function gatherSteps(x, key) {
  const G = GIFT[key];
  if (x.flag(GATHER_FLAG(key))) return G.again;
  const count = GATHER.filter((k) => k !== key && x.flag(GATHER_FLAG(k))).length + 1;
  return [
    ...G.talk,
    ...G.give(),
    ['flag', GATHER_FLAG(key)], ['sync'],
    ...G.after,
    ['if', (y) => GATHER.every((k) => y.flag(GATHER_FLAG(k))), gatherFinale(), N(`（集まった人たちと話した：${count}/${GATHER.length}）`)],
  ];
}

// ───────────── だいほん ─────────────
export const EARTH_SCRIPTS = {
  // クモイ地方: 風見の石4（根の島への 風の道。story-hoshiyomi.js の c5_kroad_<…> を うわがき）・影の城
  c5_kroad_w9: (x) => road9(x),
  c5_castle_view: (x) => [
    ...N('雲の海のまん中に、黒い城がうかんでいる…。', '城のまわりでは、黒い風が、うずをまいている…。\n（今は、近づけそうにない）'),
    ...(x.flag(K7.gather) ? N('（ハネビトたちが、風の道をつくってくれるのを、待とう）') : []),
  ],
  // 大地の 神殿
  ...Object.fromEntries(Array.from({ length: EARTH_FLOORS }, (_, i) => [`c5_ef${i + 1}`, enterScript(i + 1)])),
  ...Object.fromEntries(Array.from({ length: EARTH_FLOORS }, (_, i) => Object.keys(EARTH_POS[i + 1].jars).map((k) => [`c5_ejar_${i + 1}_${k}`, jarScript(i + 1, Number(k))])).flat()),
  ...Object.fromEntries(Object.keys(EARTH_GOLEMS).flatMap((n) => [[`c5_eslab_${n}`, slabScript(Number(n))], [`c5_eundo_${n}`, undoScript(Number(n))], [`c5_egolem_${n}`, golemLook(Number(n))]])),
  c5_e_mural: () => [
    ...N('古いかべ画だ。', '大地の守り星の光が、大きな木の根に、ゆっくりとすいこまれていく…。'),
    ...N('根は、雲の海の上に、いくつもの島をささえ、\nその上で、羽のある人々がくらしている。'),
    ...N('かべ画のはしに、小さく、黒い城がえがかれている…。\n城は、雲の海の底に、しずんでいるようだ。'),
    ...N('かべ画の下に、文字がきざまれている。\n「大地の守り星は、影の城を雲の底にしずめ、島々を空にささえる」'),
  ],
  c5_e_lift1: () => N('こわれた上り下りのゆかだ。', 'ゆかをつるしていた重りが、なくなっている…。\n（ずっと下の階で、重りのかわりになるものをのせれば…？）'),
  c5_e_lift5: () => N('こわれた上り下りのゆかだ。', 'そばの重りのゆかに、何か重いものがのれば、動きそうだ…。\n（土の守り手なら、重さは十分だろう）'),
  c5_e_door4: () => N('根でできた、大きなとびらだ。', 'かたくとざされている…。\n（左右の道のおくの、ふむ石と、つながっているようだ）'),
  c5_eswitch_a: switchScript('a'),
  c5_eswitch_b: switchScript('b'),
  c5_e_rootwall: () => N('太い根が、かべのようにからみあっている…。', 'すきまの向こうに、下りかいだんが見える。'),
  c5_e_foothold: () => N('ふかい谷だ…。', '向こうがわへわたる足場があれば…。\n（上の階で、何か重いものを落とせないだろうか）'),
  // 5階: 休み所の 大地の いずみ（回復と 記録。夜まで・朝まで 休める）・古い 日記・ピピ
  c5_e_rest: () => [
    ...N('大地のいずみだ。', '根のすきまから、すきとおった水が、こんこんとわき出している…。'),
    ['choice', 'いずみで休む？', ['休む', '夜まで休む', '朝まで休む', 'やめる'], [
      [['fade', 'out'], ['sfx', 'heal'], ['heal'], ['wait', 700], ['fade', 'in'],
        ...N('いずみの水が、体にしみわたった…。\nみんなのHPとMPが、すっかり回復した！'), ['church']],
      [['inn', 0, null, 'night'], ['church']],
      [['inn', 0, null, 'morning'], ['church']],
      [],
    ]],
  ],
  c5_e_diary: () => [
    ...N('古い本だなだ。', '1さつの、古い日記がはさまっている…。'),
    ...N('「…根の水がめに水をそそげば、根はのびる。\nだが、根は水をわけあう。べつの根は、ちぢむ」'),
    ...N('「土の守り手は、石板の声で、前へ歩む。ふり返ることはできぬ。\nまちがえたら、もうひとつの石板で、もとにもどせ」'),
    ...N('「4階のとびらは、2つのふむ石が、同時にしずまねば開かぬ。\n友とともに来た者は、2つに分かれよ」'),
    ...N('「下の階では、大地がこどうする。\nふるえを感じたら、足を止めよ。石は、歩く者の上に落ちる」'),
    ...N('…日記は、そこで終わっている。'),
  ],
  c5_pipi_e5: (x) => (x.flag(K7.pipi) ? [] : pipiScene()),
  // 8階: ノクト（1回目）・祭だん
  c5_nocto1_event: (x) => (x.flag(K7.nocto1) ? [] : noctoEvent()),
  c5_e_altar: (x) => altarSteps(x),
  // ハネノの 広場: みんなが 集まる
  ...Object.fromEntries(GATHER.map((k) => [`c5_gather_${k}`, (x) => gatherSteps(x, k)])),
};

// ───── 目標の 行き先（quest-targets.js）─────
const kat = (p) => ({ map: 'kumoi', x: p.x, y: p.y });
const eat = (n, p) => ({ map: earthMapId(n), x: p.x, y: p.y });
const down = (n) => eat(n, EARTH_POS[n].down);
const jarAt = (n, k) => eat(n, EARTH_POS[n].jars[k].cells[0]);
export const EARTH_OBJECTIVE_TARGETS = {
  [OBJ.root]: [{ ...kat(KUMOI_POS.vane4), unless: KUMOI_VANES.v4 }, kat(EARTH_OUT.door)],
  [OBJ.etemple]: [{ ...jarAt(1, 1), unless: JAR(1, 1) }, down(1)],
  [OBJ.e2]: [jarAt(2, 1), down(2)],
  [OBJ.e3]: [{ ...eat(3, EARTH_POS[3].slab), unless: PIT_FLAG }, down(3)],
  [OBJ.e4]: [{ ...eat(4, EARTH_POS[4].switchA), unless: DOOR4_FLAG }, { ...eat(4, EARTH_POS[4].switchB), unless: DOOR4_FLAG }, down(4)],
  [OBJ.e5]: [eat(5, EARTH_POS[5].font), { npc: 'pipi_e5' }],
  [OBJ.pipi]: [down(5)],
  [OBJ.e6]: [{ ...eat(6, EARTH_POS[6].slab), unless: DROP_FLAG }, jarAt(6, 1), down(6)],
  [OBJ.e7]: [eat(7, EARTH_POS[7].foothold), down(7)],
  [OBJ.e8]: [{ npc: 'nocto_e8' }],
  [OBJ.nocto1]: [eat(8, EARTH_POS[8].altar[0])],
  [OBJ.castle]: GATHER.map((k) => ({ npc: `g_${k}`, unless: GATHER_FLAG(k) })),
  [OBJ.gather]: [{ npc: 'sorane' }],
};

// ───── 仲間会話（party-talk.js。「はなす」の ヒント）─────
export const EARTH_OBJECTIVE_TALK = {
  [OBJ.root]: {
    self: 'ハネノの島の南の風見の石を回すと、南の根の島へ風の道が開く。竜で飛んでもいい。神殿の入口は、根の島のまん中の石がこいの南がわだ。',
    bold: '根の島だな！ハネノの島の南の風見の石を回して、風にのって行こうぜ！',
    kind: '大地の神殿は、根の島から入るそうです。ハネノの島の南の風見の石を回すか、アステルさまにたのみましょう。',
    kid: 'ピピ、すごくさびしそうだったね…。根の島へ、行こう！',
  },
  [OBJ.etemple]: {
    self: '根の水がめを調べると、谷に大きな根がのびて、橋になる。もう一度調べると、ちぢむ。',
    bold: '水がめに水をやれば、根がのびて橋になるんだろ？やってみようぜ！',
    kind: '根の水がめを調べてみましょう。根は、水をすってのびるようです。',
    kid: '根っこが、にょきにょきのびるよ！水がめを調べてみよう！',
  },
  [OBJ.e2]: {
    self: '水がめで根をのばすと、べつの根がちぢむ。まん中の島にも、同じ水がめがある。わたった先で、もう一度使えばいい。',
    bold: 'こっちがのびたら、あっちがちぢむのか！まん中の島の水がめも使おうぜ！',
    kind: '根は、水をわけあうのですね。わたった先の水がめで、もう一度切りかえましょう。',
    kid: 'シーソーみたいだね！のびたり、ちぢんだり！',
  },
  [OBJ.e3]: {
    self: '石板を調べると、土の守り手が南へ1歩ずつ歩く。根の橋をわたらせて、石の道のあなに落とせば、道がつながる。根をちぢめると、守り手は谷へ落ちる。その時は、もとにもどす石板だ。',
    bold: 'ゴーレムを歩かせて、あなをうめるんだな！根の橋は、のばしたままにしとけよ！',
    kind: '守り手が根の橋の上にいる時に、水がめを使うと、谷へ落ちてしまいます。落ちたら、もとにもどす石板を調べましょう。',
    kid: '石のおっきな人形が、ズシンズシン歩くの！あなに、すっぽり！',
  },
  [OBJ.e4]: {
    self: '左右の道のおくに、ふむ石がある。2つを同時にふむと、まん中のとびらが開く。家族なら2組に分かれる。ひとりなら、仲間に片方のふむ石で待っていてもらおう。',
    bold: '2つ同時か！おれが左に行く、おまえは右だ！…ひとりなら、仲間に待っててもらえばいいさ！',
    kind: '2組に分かれて、同時にふみましょう。ひとりの時は、仲間に、ふむ石の上で待っていてもらえますよ。',
    kid: 'いっせーので、ふむんだよ！ぼくは、こっちの道ね！',
  },
  [OBJ.e5]: {
    self: '5階は休み所だ。大地のいずみで回復と記録ができる。魔物も出ない。…おくから、小さな声が聞こえる。',
    bold: '休み所だ！…おい、今の声、聞こえたか？',
    kind: 'いずみで休みましょう。…あの声、子どもの声のようでしたね。北のへやの方です。',
    kid: 'だれか、助けてって言ってるよ！北の方！',
  },
  [OBJ.pipi]: {
    self: 'ピピの手紙をあずかった。北のへやのおくの下りかいだんから、さらに下へ。東のへやの土の守り手を重りのゆかにのせると、1階への近道になる。',
    bold: 'ピピの手紙、ぜったいノクトにとどけてやろうぜ！',
    kind: 'ピピさんの気持ち、ノクトさんに、とどくといいですね。東のへやの守り手で、上り下りのゆかも直せそうです。',
    kid: 'ピピの手紙、だいじにしようね！',
  },
  [OBJ.e6]: {
    self: '守り手を東へ歩かせる。1本目の根の橋は、水がめでのばしておく。その先の根がちぢんでいれば、守り手は下の階へ落ちて、7階の足場になる。',
    bold: 'ゴーレムを下の階に落とすのか！根の橋を、うまく切りかえようぜ！',
    kind: '水がめで、1つ目の根をのばすと、2つ目の根がちぢみます。守り手を、2つ目の根のすきまから落としましょう。',
    kid: 'ゴーレムさん、下に落っこちちゃうの？足場になってくれるんだね！',
  },
  [OBJ.e7]: {
    self: '地面がふるえ始めたら、立ち止まる。歩きつづけると、上から石が落ちてくる。北の谷は、6階で落とした守り手の足場でわたる。',
    bold: 'ゆれたら止まれ、だな！石なんか、当たってたまるか！',
    kind: '「ふるえを感じたら、足を止めよ」…日記のとおりですね。ゆれがおさまるまで、待ちましょう。',
    kid: 'ゆれたら、ぴたっと止まるんだよ！だるまさんがころんだ、みたい！',
  },
  [OBJ.e8]: {
    self: 'いちばん下の祭だんで、ノクトが待っている。準備を整えてから行こう。',
    bold: 'ノクトのやつ…。準備ができたら、行くぞ！',
    kind: 'ノクトさん…。ピピさんの手紙を、わたしましょう。準備を整えてから。',
    kid: 'ノクト兄ちゃん、いるのかな…。ピピの手紙、わたそうね。',
  },
  [OBJ.nocto1]: {
    self: '神殿のいちばん下の祭だんを、もう一度調べよう。',
    bold: '祭だんを調べてみようぜ！',
    kind: '祭だんを、もう一度調べてみましょう。',
    kid: '祭だん、まだ光ってるよ！',
  },
  [OBJ.castle]: {
    self: 'ハネノの町の広場に、地上からなつかしい人たちが来た。1人ずつ話すと、力をかしてくれる。',
    bold: 'ハネノに、みんなが来てるってよ！早く行こうぜ！',
    kind: '地上から、みなさんが来てくださったそうです。ハネノの町の広場で、ひとりずつ、話をしましょう。',
    kid: 'ルカもいるのかな？ハネノの広場に行こう！',
  },
  [OBJ.gather]: {
    self: 'ハネビトたちが、影の城へわたる風の道をつくってくれる。準備ができたら、ハネノの町の長ソラネに話しかけよう。',
    bold: '影の城…。待ってろよ、ノクト！',
    kind: 'みなさんの思いを、ノクトさんに、とどけましょう。',
    kid: 'みんな、来てくれたね！ノクト兄ちゃんも、いっしょに帰れるといいな。',
  },
};

// ───── すすみぐあい（progress.js。story-ch5.js の CH5_PROGRESS の うしろ）─────
export const EARTH_PROGRESS = [
  [K7.root, OBJ.root],
  [K7.etemple, OBJ.etemple],
  ...[2, 3, 4, 5].map((n) => [EF(n), OBJ[`e${n}`]]),
  [K7.pipi, OBJ.pipi],
  ...[6, 7, 8].map((n) => [EF(n), OBJ[`e${n}`]]),
  [K7.nocto1, OBJ.nocto1],
  [K7.castle, OBJ.castle],
  [K7.gather, OBJ.gather],
];

