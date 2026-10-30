// 第2部 第6章「時の砂時計」Step 6（A: 世界と物語）の だいほん（story-ch6.js の applyCh6 から まぜる）
// ※ ネタバレ注意（docs/plan-ch6.md の 13-3・17）
// c6_heart の あと: 5階の おくの 歯車の とびら → 止まった時計塔の 6〜10階（maps/tokei-high.js）
//   6階 休み所・時の すきまで 今の 星の塔 6階を 通って まわりこむ / 7階 ふりこの やいば × 針の 橋 / 8階 歯車の 大広間 / 9階 休み所
//   → 10階 時計塔の心臓: 影の時計師ゼンマイ（zenmai。B）→ c6_zenmai（北の 山の 灰色の 森が 動き出す）→ 大時計が 星の 光に
//   → てっぺんの 小べや: ★5の 武器の 宝箱（C6_CLEAR_WEAPONS。B）・からくりの 馬を トキネが よい心に もどす（ぜんまい馬。B）
//   → 塔の 外: 森が 動き出す・はじまりの星・リオン「ひとりじゃない」・ミナモは 未来の 酒場へ・砂時計の 力が 大きく なる → c6_clear
//   →「第2部 第7章へ つづく」
// クリアの あと: 9階の「止まった時の間」（toki_phantom。B。1日1回）・泉の里の リオンの けいこ（sidequests-ch6d.js）・酒場の ミナモ
// このファイルは story-ch6.js・story-ch6b.js を 読まない（story-ch6.js が ここを 読んで まぜる）
import { PAST_ID } from '../maps/past.js?v=66b0267ceac2';
import { TK_OUT, TF, tkMapId, CLOCKS } from '../maps/tokei.js?v=66b0267ceac2';
import {
  C6D, HOLD8, HAVE8, WEIGHT8, LOCK8, ZBOSS, ZSEEN, TOPSEEN, TROOM, TOP_CHEST, TH_POS, LINK6_TOWER, TOP_ID,
} from '../maps/tokei-high.js?v=66b0267ceac2';
import { C6C_OBJ, ELDER_LATE, handSteps } from './story-ch6c.js?v=66b0267ceac2';
import { ITEMS } from './items.js?v=66b0267ceac2';
import { VEHICLES } from './vehicles.js?v=66b0267ceac2';
import { NPC_SUPPORTS } from './shops.js?v=66b0267ceac2';
import { MINAMO_GUEST } from './companions-past.js?v=66b0267ceac2';
import { addItem, canEquipChar } from '../stats.js?v=66b0267ceac2';
import { CH6D_SIDE_STORY, applyCh6dSide } from './sidequests-ch6d.js?v=66b0267ceac2';
// クリアの ★5の 武器（B の data/items-tokei.js の C6_CLEAR_WEAPONS。まとめる 時に './items-tokei.js' から）
import { C6_CLEAR_WEAPONS } from './items-tokei.js?v=66b0267ceac2';
// 第53回: 時のまぼろしに 勝った 日（B の encounters-tokei6.js と おなじ 日の かぞえかた）
import { dayKeyOf } from './encounters-tokei6.js?v=66b0267ceac2';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);

// ───── 第6章 Step 6 の すすみかた（STORY_STEPS の c6_heart の うしろ。plan-ch6.md の 17 の 名前の 約束）─────
export const CH6D_STEPS = [C6D.zenmai, C6D.clear];
export const HORSE = 'zenmai_horse';

// ───── 目標 ─────
export const C6D_OBJ = {
  tf6: '6階の休み所。止まった歯車のかべは、千年前では動かない。光るゆか「時のすきま」から今の星の塔の6階を通って、かべの向こうへまわりこもう',
  tf7: '7階。ふりこのやいばは、かわりばんこに通路をふさぐ。あいだのゆかで待とう。大時計の針は、かべの絵の時こくに合わせよう',
  tf8: '8階。歯車のゆかは、ハンドルの上にだれかが立っている間だけ、北へ運んでくれる（ひとりなら、歯車のおもりをハンドルにのせよう）',
  gear8: '歯車のゆかを止めた！これで歩いて行き来できる。北の岸のかいだんから上へ',
  tf9: '9階の休み所。いずみで休んで、記録してから上へ。西の止まった部屋のおくに、最後の宝があるらしい',
  tf10: '10階。時計塔の心臓で、ゼンマイが待っている…（準備を整えてから進もう）',
  zenmai: 'てっぺんの小べやへ。宝箱を開けて、止まっているからくりの馬を調べよう',
  // 第6章の さいご（あとの 章が できたら、この 文は OLD_C6_OBJ に のこす）
  clear: '第6章クリア！千年前の泉の里のリオンや、時計塔の9階の「止まった時の間」をたずねてみよう（第2部第7章は、いつかのアップデートで）',
};

// パーティー全員で 見る イベント
export const CH6D_STORY_SCRIPTS = ['c6_zenmai_event', 'c6_tzhall', 'c6_thorse', 'c6_toki_mirror', 'c6_tf10'];

// ───── 星読みの しおり（world/tokei-use.js。その 階の ヒント）─────
export const TK6_HINTS = {
  6: {
    full: ['止まった歯車のかべは、千年前では動かないわ。', 'でも、千年ののちの星の塔では…かべは、もう、くずれているはず。', '島の光るゆかから今へ。はなれの光るゆかから千年前へ。\n…時をこえる、まわり道ね。'],
    short: '島のすきまから今へ。はなれのすきまから千年前へ',
  },
  7: {
    full: ['ふりこのやいばは、2つの組が、かわりばんこに通るの。', 'やいばとやいばのあいだのゆかは、どちらの時も通らないわ。\nそこで待って、すきに進んでね。', '大時計は、まず6時。まん中の台に着いたら、9時よ。'],
    short: 'やいばのあいだで待つ。針は6時、まん中から9時',
  },
  8: {
    full: ['歯車のゆかは、ふだんは南へ流れているわ。', 'ハンドルの上にだれかが立つと、北へ流れるの。\n家族なら、1人がハンドル、もう1人がわたって。', 'ひとりなら、西の小べやの歯車のおもりを、ハンドルにのせて。\nわたったら、北のレバーで歯車を止めておくといいわ。'],
    short: 'ハンドルに人かおもり。わたったら北のレバー',
  },
  9: {
    full: ['ここは休み所。いずみで休んで、記録しておいてね。', '西の止まった部屋のおくに、宝があるみたい。\n止まった水の上を、まっすぐ進んで。', '東のとびらは…今は、星も見えない。\nいつか、物語の終わりに、開く気がするの。'],
    short: 'いずみで休む。止まった部屋は水の上をまっすぐ',
  },
  10: {
    full: ['ゼンマイは、今までの家来の力を、じゅんばんに使ってくるわ。', '砂が落ちきる前、まきもどし、時のふりこ、時のかね…\nみんなで学んだことを、思い出して。', 'それから…大時計の針が12時をうつ前に、まわりの歯車をこわすの。\n歯車は、それぞれ弱点がちがうみたい。'],
    short: '家来の技は、学んだとおりに。12時の前に歯車をこわす',
  },
};

// ───── クリアの ★5の 武器（てっぺんの 宝箱。キャラごとに 1つ えらぶ）─────
// C6_CLEAR_WEAPONS は ならび か { なかま: [id…] }（B が 決める）。今の 職業で 使える 物だけ 出す（1つも なければ ぜんぶ）
const flat = (W) => (Array.isArray(W) ? W : Object.values(W || {}).flat());
export function clearWeaponList(c) {
  const all = [...new Set(flat(C6_CLEAR_WEAPONS))].filter((id) => ITEMS[id]);
  const can = all.filter((id) => canEquipChar(c, id));
  return (can.length ? can : all).slice(0, 6);
}
async function takeWeapon(run, id) {
  const c = run.init.char;
  if (c.chests[TOP_CHEST]) return;
  c.chests[TOP_CHEST] = true;
  addItem(c, id, 1);
  run.world.markDirty();
  await run.runSteps([['sfx', 'chest'], ['chestOpen', TOP_CHEST], ['say', null, `${c.name}は宝箱を開けた！\n${ITEMS[id].name}を手に入れた！`]]);
}
const topChest = () => [['call', async (run) => {
  const c = run.init.char;
  if (c.chests?.[TOP_CHEST]) {
    await run.runSteps(N('宝箱は空っぽだ。'));
    return;
  }
  const list = clearWeaponList(c);
  await run.runSteps([
    ...N('古い宝箱だ。ふたに、星と歯車のもようがきざまれている…。', '中で、ふしぎな光をまとった武器が、いくつもねむっている。\n（1人1つだけ、選んで持っていける）'),
    ['choice', 'どれを持っていく？', [...list.map((id) => ITEMS[id].name), 'やめる'], [...list.map((id) => [['call', (r) => takeWeapon(r, id)]]), []]],
  ]);
}]];

// ───── ぜんまい馬（パーティーの みんな。もう 持っていたら そのまま）─────
function giveHorse(run) {
  for (const m of run.everyone) {
    const c = m.char;
    if (!Array.isArray(c.vehicles)) c.vehicles = [];
    if (!c.vehicles.includes(HORSE)) c.vehicles.push(HORSE);
  }
  run.world.markDirty();
  run.batch.push(['sfx', 'key']);
  run.say(`${run.who()}は${VEHICLES[HORSE]?.name || 'ぜんまい馬'}をもらった！\n（メニューの「乗り物」で、走る時に乗れる。千年前の時代でも乗れる）`);
}

// ───── 酒場の 仲間の ミナモ（ノクト・サラと おなじ 形。c6_clear で ならぶ）─────
export const MINAMO_SUPPORT = {
  ...MINAMO_GUEST, id: 'npc_minamo', unlock: C6D.clear,
  desc: '千年前の星読みのむすめ。星の光でみんなを回復し、ながれぼしで戦う。未来のルミナの町で、みんなの道をてらしてくれる。',
};
if (!NPC_SUPPORTS.some((n) => n.id === MINAMO_SUPPORT.id)) NPC_SUPPORTS.push(MINAMO_SUPPORT);

// ───────────── 時計塔 6〜10階 ─────────────
const TF_TEXT = {
  6: () => [
    ...N('ひんやりとした風が流れている…。', 'どこかで、時のいずみの水の音がする。'),
    ...S('リオン', 'ここで、ひと休みしていこう。', '…あれ？上へのかいだん、どこだろう。\n大きな歯車のかべで、ふさがってるみたいだ。'),
    ['flag', TF(6)], ['sync'], ['objective', C6D_OBJ.tf6],
  ],
  7: () => [
    ...N('ヒュン…ヒュン…。', '大きなふりこのやいばが、通路を行ったり来たりしている…！'),
    ...S('リオン', 'かわりばんこに動いてる…。\nやいばとやいばのあいだで待てば、通れそうだ。'),
    ['flag', TF(7)], ['sync'], ['objective', C6D_OBJ.tf7],
  ],
  8: () => [
    ...N('ゴウン、ゴウン…。', 'ゆかいっぱいの大きな歯車が、南へ向かって回っている…。'),
    ...S('リオン', 'このままじゃ、向こう岸へ行けないよ…。\nあの、針の形のハンドルは何だろう？'),
    ['flag', TF(8)], ['sync'], ['objective', C6D_OBJ.tf8],
  ],
  9: () => [
    ...N('しん…と静まりかえった部屋だ。', 'いずみの水の音だけが、さらさらと聞こえる。'),
    ...S('リオン', 'もうすぐ、てっぺんだね。\n…ここで、しっかり休んでいこう。'),
    ['flag', TF(9)], ['sync'], ['objective', C6D_OBJ.tf9],
  ],
  10: () => [
    ['bgm', 'zenmai'],
    ...N('カチ…カチ…カチ…。', '塔じゅうの時計の音が、この上に集まっていくようだ…。'),
    ...S('リオン', 'この上に、ゼンマイがいる…！', '…みんな、いっしょに行こう。'),
    ['flag', TF(10)], ['sync'], ['objective', C6D_OBJ.tf10],
  ],
};
// かべの 時計の 絵（[階][じゅんばん]。じゅんばんは 上の 行から、左から）
const PAINT = {
  6: [
    () => N('かべ画だ。歯車のかべの両がわに、光るゆかがえがかれている…。', '「時のすきまは、1つではない」'),
    () => N('かべ画だ。歯車のかべと、高い塔の絵…。', '「止まった歯車のかべも、千年ののちには、くずれて道になる」'),
    () => N('かべ画だ。砂時計を持った小さな女の子が、塔の中を、ぐるりと回っている。'),
  ],
  7: [
    () => N('かべに、時計の絵がかかっている。', '「ふりこのやいばは、ふた組。あいだのゆかで待て」'),
    () => N('かべに、時計の絵がかかっている。', '絵の中の時計の針は、9時をさしている。\n…絵のすみに、小さく「まん中の台から」と書いてある。'),
  ],
  8: [
    () => N('かべ画だ。針の形のハンドルの上に子どもが立ち、\nもう1人の子どもが、歯車のゆかをわたっている。'),
    () => N('かべ画だ。重いおもりを、ハンドルにのせる人の絵…。', '「ひとりの者は、おもりをのせよ。\nわたったら、北のレバーで歯車を止めよ」'),
  ],
  9: [
    () => N('かべ画だ。止まった部屋と、まっすぐな水の道の絵…。', '「止まった水の上を、まっすぐ行け。宝は、いちばんおくに」'),
    () => N('かべ画だ。むらさき色のとびらの絵…。', '「時の止まった間は、物語の終わりに開く」'),
  ],
  10: [
    () => N('かべ画だ。砂時計・歯車・ふりこ・かね…', 'ゼンマイの家来たちの絵が、ならんでいる。'),
    () => N('かべ画だ。大きな時計と、そのまわりの3つの歯車…。', '「針が12時をうつ前に、歯車をこわせ」'),
  ],
};

// 6階: 止まった 歯車の かべ
const wallSteps = () => [
  ...N('止まった大きな歯車が、かべのように道をふさいでいる。', 'おしても引いても、びくともしない…。'),
  ...S('トキネの声', '（千年ののちの星の塔なら、このかべは、もう、くずれているかも…。\n光るゆか「時のすきま」を探してみて）'),
];

// 8階: 歯車の おもり・ハンドル・止める レバー
const weightSteps = (x) => (x.flag(HAVE8) || x.flag(WEIGHT8) ? [] : [
  ...N('大きな歯車のおもりだ。ずっしりと重い…。', '（ハンドルにのせれば、ハンドルを、ずっとおさえておけそうだ）'),
  ['choice', 'おもりを持っていく？', ['持っていく', 'やめる'], [
    [['flag', HAVE8], ['sync'], ...N('歯車のおもりを、よいしょと持ち上げた！')],
    [],
  ]],
]);
function crankSteps(x) {
  if (x.flag(LOCK8)) return N('針の形のハンドルだ。', '歯車は止めてあるので、もう回らない。');
  if (x.flag(WEIGHT8)) return N('ハンドルに、歯車のおもりがのっている。', 'ギギギ…と、ハンドルが回りつづけている。');
  if (x.flag(HAVE8)) {
    return [
      ...N('針の形のハンドルだ。'),
      ['choice', '歯車のおもりをのせる？', ['のせる', 'やめる'], [
        [['unflag', HAVE8], ['flag', WEIGHT8], ['sfx', 'rumble'], ['sync'], ['shake'],
          ...N('ドスン！ハンドルに、歯車のおもりをのせた。', 'ギギギ…。ハンドルが回って、歯車のゆかが、北へ流れ始めた！')],
        [],
      ]],
    ];
  }
  return N('大きな針の形のハンドルだ。', '上に立つと、体の重さで、ハンドルが回るしかけのようだ。\n（だれかが立っている間だけ、歯車のゆかが北へ流れる）');
}
const lockSteps = (x) => (x.flag(LOCK8) ? N('歯車を止めるレバーだ。', '歯車のゆかは、止まっている。') : [
  ...N('歯車を止めるレバーだ。'),
  ['choice', 'レバーを引く？', ['引く', 'やめる'], [
    [['sfx', 'rumble'], ['flag', LOCK8], ['unflag', HOLD8], ['sync'], ['shake'],
      ...N('ガチャン！', '歯車のゆかが、ぴたりと止まった。\nこれで、歩いて行き来できる！'),
      ...(x.flag(TF(9)) ? [] : [['objective', C6D_OBJ.gear8]])],
    [],
  ]],
]);

// 9階: 止まった時の間（第6章クリアの あと。時のまぼろし toki_phantom は B。1日1回 勝てる）
const DAY = 86400000;
export const tokiDay = (now) => Math.floor((now + 9 * 3600000) / DAY); // 日本の 1日（0時で かわる）
// 勝った 時だけ 今日の しるし（負けても loseOk で 台本は つづく。勝ちは B の world/tokei-phantom.js が c.tokiPhantom.day に 書く。けいじ板も B）
function phantomWin(run) {
  const c = run.owner.char;
  const now = run.world.now();
  if (c.tokiPhantom?.day !== dayKeyOf(now)) return;
  c.tokiDay = tokiDay(now);
  run.world.markDirty();
}
function mirrorSteps() {
  return [['call', async (r) => {
    const c = r.owner.char;
    if (c.tokiDay === tokiDay(r.world.now())) {
      await r.runSteps(N('時のかがみは、しずかにくもっている…。', '（今日は、もう、まぼろしはあらわれない。また明日、来てみよう）'));
      return;
    }
    await r.runSteps([
      ...N('大きな時のかがみだ。', 'かがみの中で、これまでの時の番人たちの影が、ゆらゆらとゆれている…。'),
      ...S('トキネの声', '（時の止まった間には、時のまぼろしが、1日に1回だけあらわれるの。\n…とっても強いわよ。気をつけて）'),
      ['choice', '時のまぼろしと戦う？', ['戦う', 'やめる'], [
        [
          ['bgm', null], ['sfx', 'dark'], ['flash'],
          ...N('かがみの中から、まぼろしが、すうっと出てきた…！'),
          ['bgm', 'boss6'],
          ['battle', 'toki_phantom'],
          ['call', phantomWin],
          ['sfx', 'sparkle'],
          ...N('時のまぼろしは、光の砂になって、かがみの中へ帰っていった…。', '（また明日、あらわれるかもしれない）'),
          ['bgm', 'resume'],
        ],
        [],
      ]],
    ]);
  }]];
}

// ───────────── 10階: 影の時計師ゼンマイ（c6_zenmai）─────────────
const ZB = () => { const B = TH_POS[10].boss; return [B.x + 0.5, B.y + 0.5]; };
function zenmaiEvent() {
  const [bx, by] = ZB();
  return [
    ['bgm', null],
    ['look', bx, by - 3],
    ...N('広間のおくのかべ一面に、大きな時計の文字ばんがある…。', '長い針が、12時のすぐ手前で、ぶるぶるとふるえている。'),
    ['look', bx, by],
    ['bgm', 'zenmai'],
    ...S('影の時計師ゼンマイ', 'カチ、カチ。ようこそ、紋章の子らよ。', 'ここは、時計塔の心臓。\nこの大時計が12時をうてば、この地の時は、のこらず止まる。'),
    ...S('リオン', 'そんなこと、させない！'),
    ...S('影の時計師ゼンマイ', 'サンドクロック、ギアドン、ペンデュラ、カリヨン…。', 'わが家来たちの力、もう一度、全部見せてやろう。'),
    ...S('トキネの声', '（家来たちの技を、じゅんばんに使ってくるわ。\n思い出して！みんなで、どうやって勝ったか）'),
    ['showMon', 'zenmai'],
    ['sfx', 'dark'], ['flash'],
    ['showMon', null],
    ['look'],
    ['bgm', 'boss6'],
    ['battle', 'zenmai'],
    ['bgm', null],
    ['hideNpc', 'zenmai_npc'],
    ['flag', C6D.zenmai], ['sync'],
    ['objective', C6D_OBJ.zenmai],
    ...afterZenmai(),
  ];
}
// ゼンマイの あと: 大時計が 星の 光に（とちゅうで 切れたら、広間に 入ると 続き）
function afterZenmai() {
  const [bx, by] = ZB();
  return [
    ['look', bx, by - 1],
    ...S('影の時計師ゼンマイ', 'カチ…カ…チ…。', 'わたしは…星のかけらが作った、影の1つにすぎない…。'),
    ...S('影の時計師ゼンマイ', 'かけらは…もう、ある者の心の中に…。', 'その者が目ざめる時…また、会おう…紋章の子らよ…。'),
    ['sfx', 'sparkle'], ['flash'],
    ...N('ゼンマイのすがたは、黒い歯車のかけらになって、消えていった…。'),
    ...S('リオン', '…「ある者の心の中」…？'),
    ['look', bx, by - 4],
    ['sfx', 'rumble'], ['shake'],
    ...N('ゴウン…！', 'かべ一面の大時計が、まぶしく光り始めた…！'),
    ['flash'],
    ...N('文字ばんが、ひとつ、またひとつと、星の光になって、天じょうへのぼっていく…。'),
    ...S('トキネの声', '（時計塔の心臓が…星の光にかえっていく。\n止まっていた時が、動き出すわ！）'),
    ...N('大時計のあった所に、上へつづくかいだんがあらわれた。'),
    ...S('リオン', 'てっぺんへ、行ってみよう！'),
    ['look'],
    // ここまでを 見せてから（とちゅうで 切れたら、広間で 続き）
    ['sync'],
    ['flag', ZSEEN], ['sync'],
    ['bgm', 'resume'],
  ];
}

// ───────────── てっぺん: からくりの 馬 → 塔の 外で さいごの 場面（c6_clear）─────────────
const topArrive = () => [
  ...N('塔のてっぺんの小べやだ。', '星の窓から、夜明け前の空が見える…。'),
  ...N('すみに、からくりの馬が1頭、止まったまま立っている。\nまん中には、古い宝箱がある。'),
  ...S('トキネの声', '（あの宝箱から、星の力を感じるわ。\n1人1つずつ、選んで持っていけるみたい）'),
  ['flag', TOPSEEN], ['sync'],
];
function horseSteps(x) {
  if (x.flag(C6D.clear)) return [];
  const H = TH_POS.top.horse;
  const [hx, hy] = [H.x + 0.5, H.y + 0.5];
  return [['call', async (run) => {
    // さいごの 場面の 前に、ものがたりの もちぬしの 宝箱（てっぺんには、なかなか もどれないので）
    if (!run.owner.char.chests?.[TOP_CHEST]) {
      await run.runSteps([
        ...N('ゼンマイの家来の、からくりの馬だ。', 'ぜんまいが切れたように、ぴくりとも動かない…。'),
        ...S('トキネの声', `（その前に、まん中の宝箱を開けてみて。\n${run.owner.char.name}の分も、ちゃんとあるはずよ）`),
      ]);
      return;
    }
    await run.runSteps(endingSteps(hx, hy));
  }]];
}
function endingSteps(hx, hy) {
  const D = TK_OUT.door;
  const [dx, dy] = [D.x + 0.5, D.y + 0.5];
  return [
    ['bgm', null],
    ...N('ゼンマイの家来の、からくりの馬だ。', 'ぜんまいが切れたように、ぴくりとも動かない…。'),
    ['actor', 'tokine_e', { sprite: 'tokine', x: hx + 1.5, y: hy + 0.6, dir: 'left' }],
    ['sfx', 'sparkle'],
    ...S('トキネ', 'この子、ゼンマイに、ねじを、むりやりまかれていたのね。', 'わたしの砂で、ねじを、やさしい向きに、まきなおしてあげる。'),
    ['sfx', 'sparkle'], ['flash'],
    ...N('サラサラ…。', '光の砂が、馬のぜんまいに、すいこまれていく…。'),
    ['sfx', 'rumble'],
    ...N('カチ、カチ、カチ…ヒヒーン！', 'からくりの馬が、うれしそうに首をふった！'),
    ...S('トキネ', 'この子は「ぜんまい馬」。', '千年前の時代でも走れる、時のからくりの馬よ。\n…みんなのこと、気に入ったみたい！'),
    ['call', giveHorse],
    ['sync'],
    ...S('リオン', '…外が、明るくなってきた。\nみんな、塔の外へ出てみよう！'),
    // 塔の 外（千年前の 北の 山の ふもと）
    ['fade', 'out'],
    ['remove', 'tokine_e'],
    ['hideNpc', 'zenmai_horse_npc'],
    ['teleport', PAST_ID, dx, dy + 2, 'up'],
    ['actor', 'rion_e', { sprite: 'rion', x: dx - 1.2, y: dy + 2.2, dir: 'up' }],
    ['actor', 'tokine_e', { sprite: 'tokine', x: dx + 1.2, y: dy + 2.2, dir: 'up' }],
    ['fade', 'in'],
    ['look', dx, dy - 1],
    ...N('塔の外に出ると――', '灰色だった森に、色がもどっていた。'),
    ...N('風がふいて、木の葉がさらさらとゆれる。\n鳥の声が、あちこちから聞こえてくる…。'),
    ['look', dx, dy - 7],
    ['sfx', 'sparkle'], ['flash'],
    ...N('時計塔のてっぺんから、星の光が、すうっと空へのぼっていく…。', '光は、山の上の空で、1つの星になった。'),
    ...S('トキネ', 'あれは…「はじまりの星」。', '千年ののち、この場所に、星の塔が建てられるのね。\n…きっと、あの星を目じるしにして。'),
    ['look', dx, dy + 2],
    ['actor', 'minamo_e', { sprite: 'minamo', x: dx, y: dy + 6, dir: 'up' }],
    ['move', 'minamo_e', [[dx, dy + 3.4]]],
    ...S('ミナモ', 'リオン！みんな！', '時が…動き出したわ！\n星読みで、ちゃんと見えていたのよ。'),
    ['face', 'rion_e', 'down'],
    ...S('リオン', 'ミナモ…ただいま。'),
    ...S('リオン', 'ぼく、ずっと思ってたんだ。\n勇者は、ひとりで強くなきゃいけないって。'),
    ...S('リオン', 'でも、ちがった。', '未来の紋章の子たちと、ミナモと、トキネがいたから、\nここまで来られたんだ。'),
    ...S('リオン', 'ぼくが、勇者になる。\nでも、ひとりじゃない。', 'いっしょに戦ってくれる仲間を、探しに行くよ。'),
    ...S('ミナモ', 'うん。…それなら、わたしにも、できることがあるわ。'),
    ...S('ミナモ', '{name}。わたしの星読みでは、\nあなたたちの旅も、まだまだつづくって出ているの。', 'トキネ。わたしを、未来のルミナの町へ、つれていける？\n星読みで、みんなの道を、そばでてらしたいの。'),
    ...S('トキネ', 'ええ！砂時計の力が、すごく大きくなっているの。\n…ほら、見て！'),
    ['sfx', 'sparkle'], ['flash'],
    ...N('時の砂時計が、まぶしい光をはなった…！'),
    ...S('トキネ', 'ゼンマイが止めていた時の力が、砂時計にもどってきたみたい。', 'これなら…ミドリナ地方だけじゃない。\nほかの地方の、千年前にも、行けるかもしれない！'),
    ...S('リオン', 'ほかの地方の…千年前？', '…ぼくの仲間も、そこにいるのかな。'),
    ...S('ミナモ', 'わたしは、未来のルミナの町の酒場で待っているわ。\nいつでも、よんでね。'),
    ...S('リオン', 'ぼくは、泉の里で、剣のけいこをして待ってる。', '…また、いっしょに戦ってね。未来の紋章の子！'),
    ['unguest', 'rion'],
    ['flag', C6D.clear], ['sync'],
    ['sfx', 'join'],
    ...N('（ミナモが、ルミナの町の酒場の仲間になった！）'),
    ['objective', C6D_OBJ.clear],
    ['chapter', '第6章「時の砂時計」　完', '第2部　第7章へ　つづく'],
    ['fade', 'out'],
    ['remove', 'rion_e'], ['remove', 'tokine_e'], ['remove', 'minamo_e'],
    ['fade', 'in'],
    ['look'],
    ['bgm', 'resume'],
  ];
}

// ───── クリアの あとの ばあちゃん・今の 星の塔 1階の かべ画（はっきり 見える）─────
function elderLate(x) {
  if (x.flag(C6D.clear)) {
    return S('ホシミばあちゃん', 'ゆうべ、北の山の空に、見たことのない星が1つ、光っておった。', '…ふしぎじゃのう。\nずっと昔から、そこにあったような、なつかしい星じゃ。');
  }
  if (x.flag(C6D.zenmai)) return S('ホシミばあちゃん', '星の塔のかねが、やさしい音で鳴ったよ。', '…{name}たちが、がんばっておるんじゃな。');
  return null;
}
ELDER_LATE.fn = elderLate;
const muralClear = () => N(
  '星の塔のかべ画だ。', '前はうすかった1まいが、はっきり見えるようになっている…！',
  '大きな時計の前に、4人の子ども。\n剣を持った少年と、星のかざりの少女…。', '…となりの2人は、顔のところだけ、まだ、かすれている。',
);

// ───────────── だいほん ─────────────
export const CH6D_SCRIPTS = {
  ...Object.fromEntries(Object.keys(TF_TEXT).map((n) => [`c6_tf${n}`, () => TF_TEXT[n]()])),
  ...Object.fromEntries(Object.entries(PAINT).flatMap(([n, list]) => list.map((fn, i) => [`c6_tpaint_${n}_${i}`, () => fn()]))),
  c6_thand_7: (x) => handSteps(x, 7),
  c6_t6wall: () => wallSteps(),
  c6_t8weight: (x) => weightSteps(x),
  c6_t8crank: (x) => crankSteps(x),
  c6_t8lock: (x) => lockSteps(x),
  c6_ttimedoor: () => N('むらさき色の、ふしぎなとびらだ。', 'とびらの向こうは、時が止まったまま、こおりついている…。\n（今は、開かない）'),
  c6_ttimeroom: (x) => (x.flag(TROOM) ? [] : [
    ...N('「止まった時の間」だ…。', '大きなかがみの中で、時の番人たちの影が、ゆれている。'),
    ['flag', TROOM], ['sync'],
  ]),
  c6_toki_mirror: (x) => (x.flag(C6D.clear) ? mirrorSteps() : []),
  c6_zenmai_event: (x) => (x.flag(C6D.zenmai) ? [] : zenmaiEvent()),
  c6_tzboss: () => [...N('カチ…カチ…。', '広間のおくの大時計の音が、むねにひびいてくる…。'), ['flag', ZBOSS], ['sync']],
  c6_tzhall: (x) => (x.flag(C6D.zenmai) && !x.flag(ZSEEN) ? afterZenmai() : []),
  c6_tzface: () => N('かべ一面の、大きな時計の文字ばんだ。', '長い針が、12時のすぐ手前で、ふるえている…。'),
  c6_ttop: (x) => (x.flag(TOPSEEN) ? [] : topArrive()),
  c6_ttopwin: (x) => (x.flag(C6D.clear)
    ? N('星の窓だ。', '北の山の上の空に、「はじまりの星」が光っている。')
    : N('星の窓だ。', '夜明け前の空が、少しずつ明るくなっていく…。')),
  c6_thorse: (x) => horseSteps(x),
  c6_top_chest: () => topChest(),
};

// ───── 目標の 行き先（quest-targets.js）─────
const at = (n, p) => ({ map: tkMapId(n), x: p.x, y: p.y });
const P6 = TH_POS[6], P8 = TH_POS[8];
export const CH6D_OBJECTIVE_TARGETS = {
  [C6D_OBJ.tf6]: [at(6, P6.gapA[0]), { map: LINK6_TOWER, x: P6.gapB[0].x, y: P6.gapB[0].y }, at(6, P6.up)],
  [C6D_OBJ.tf7]: [{ map: tkMapId(7), x: CLOCKS[7].levers[0][0], y: CLOCKS[7].levers[0][1] }, at(7, TH_POS[7].up)],
  [C6D_OBJ.tf8]: [{ ...at(8, P8.weight), unless: HAVE8 }, { ...at(8, P8.crank), unless: WEIGHT8 }, { ...at(8, P8.lock), unless: LOCK8 }, at(8, P8.up)],
  [C6D_OBJ.gear8]: [at(8, P8.up)],
  [C6D_OBJ.tf9]: [at(9, TH_POS[9].font), at(9, TH_POS[9].up)],
  [C6D_OBJ.tf10]: [{ npc: 'zenmai_npc' }],
  [C6D_OBJ.zenmai]: [at(10, TH_POS[10].upper), { map: TOP_ID, x: TH_POS.top.chests[0].x, y: TH_POS.top.chests[0].y }, { npc: 'zenmai_horse_npc' }],
  [C6D_OBJ.clear]: [{ npc: 'rion_spar' }, at(9, TH_POS[9].door)],
};

// ───── 仲間会話（party-talk.js。「はなす」の ヒント）─────
const T4 = (self, bold, kind, kid) => ({ self, bold, kind, kid });
export const CH6D_OBJECTIVE_TALK = {
  [C6D_OBJ.tf6]: T4('止まった歯車のかべは、千年前では動かない。島の時のすきまから今の星の塔へ行って、はなれの時のすきまで千年前にもどろう。', '今の星の塔を通って、かべの向こうへ回りこむんだ！',
    '島の光るゆかで今へ。今の星の塔なら、かべはくずれているはずです。はなれの光るゆかで、千年前にもどりましょう。', 'ピカピカのゆかで、今の塔にいって、また千年前へ！'),
  [C6D_OBJ.tf7]: T4('ふりこのやいばは、ふた組がかわりばんこ。あいだのゆかで待って、すきに進もう。大時計は6時、まん中の台から9時。', 'やいばのすきを見て、ダッシュだ！針は6時、それから9時！',
    'やいばとやいばのあいだのゆかは、あんぜんです。大時計は、まず6時に。まん中の台からは9時です。', 'ふりこのあいだで待ってから、すすもう！'),
  [C6D_OBJ.tf8]: T4('ハンドルの上にだれかが立っていれば、歯車のゆかは北へ流れる。ひとりなら、西の小べやのおもりをハンドルにのせよう。わたったら、北のレバーで止めておこう。', 'おれがハンドルにのるから、わたれ！ひとりなら、おもりだ！',
    '家族なら、1人がハンドルの上に。ひとりなら、西の小べやの歯車のおもりを使いましょう。', 'ハンドルにのってると、ゆかが北にうごくよ！'),
  [C6D_OBJ.gear8]: T4('歯車のゆかを止めた。北の岸のかいだんから上へ。', '止めたぞ！上へ行こうぜ！',
    'これで、行き来も安心です。北のかいだんから、上へ。', 'ゆかが止まったよ！上にいこう！'),
  [C6D_OBJ.tf9]: T4('休み所のいずみで休んで、記録しよう。西の止まった部屋のおくに、最後の宝がある。止まった水の上を、まっすぐ。', 'いずみで休んでから、宝もいただきだ！',
    'ここで、しっかり休みましょう。止まった部屋の宝は、止まった水の上を、まっすぐ進めば、とどきます。', 'いずみでひと休み！おくに宝があるよ！'),
  [C6D_OBJ.tf10]: T4('ゼンマイは家来たちの技を、じゅんばんに使ってくる。これまでどおりに。大時計が12時になる前に、まわりの歯車をこわそう。', 'ゼンマイのやつ、ぶっとばしてやる！歯車からこわすんだ！',
    'これまでの家来の戦いを、思い出しましょう。大時計の針が12時に近づいたら、まわりの歯車を。', 'みんなで力を合わせて、ゼンマイをたおそう！'),
  [C6D_OBJ.zenmai]: T4('てっぺんの小べやへ。宝箱は1人1つ。それから、止まっているからくりの馬を調べよう。', 'てっぺんだ！宝箱、何が入ってるかな！',
    'てっぺんの小べやに、宝箱と、からくりの馬がいるそうです。', 'てっぺんに、おうまさんがいるって！'),
  [C6D_OBJ.clear]: T4('第6章クリア！千年前の泉の里で、リオンが剣のけいこの相手を待っている。時計塔9階の「止まった時の間」にも、行ってみよう。', 'やったな！リオンにけいこをつけてもらおうぜ！',
    'ミナモさんは、ルミナの町の酒場で待っていてくれます。リオンさんにも、会いに行きましょう。', 'ミナモお姉ちゃん、酒場にいるって！'),
};

// ───── すすみぐあい（progress.js の PROGRESS の うしろ。story-ch6.js の CH6_PROGRESS に まぜる）─────
export const CH6D_PROGRESS = [
  [TF(6), C6D_OBJ.tf6],
  [TF(7), C6D_OBJ.tf7],
  [TF(8), C6D_OBJ.tf8],
  [LOCK8, C6D_OBJ.gear8],
  [TF(9), C6D_OBJ.tf9],
  [TF(10), C6D_OBJ.tf10],
  [C6D.zenmai, C6D_OBJ.zenmai],
  [C6D.clear, C6D_OBJ.clear],
];

// ───── story-ch6.js の applyCh6 から: だいほんを まぜる ─────
export function applyCh6d(SCRIPTS, STORY_SCRIPTS) {
  Object.assign(SCRIPTS, CH6D_SCRIPTS);
  for (const id of CH6D_STORY_SCRIPTS) STORY_SCRIPTS.add(id);
  // 今の 星の塔 1階の 新しい かべ画（クリアの あとは はっきり 見える）
  const mural = SCRIPTS.c6_mural_new;
  if (mural) SCRIPTS.c6_mural_new = Object.assign((x) => (x.flag(C6D.clear) ? muralClear() : mural(x)), mural);
  // より道「リオンの剣のけいこ」（sidequests-ch6d.js）
  applyCh6dSide(SCRIPTS);
  for (const id of CH6D_SIDE_STORY) STORY_SCRIPTS.add(id);
}
