// 第2部 第8章「千年の約束」第4幕「時のはざま」Step 7・8（A: 世界と物語）の だいほん（story-c8.js で まぜる。applyCh8r）
// ※ ネタバレ注意（docs/plan-ch8.md の 7-3・9）
// Step 7: 第3幕クリア（c8_bowser）の あと、今の ほしみの丘の トキネ「砂時計が、どこでもない 所で 鳴っている」（c8_rift）
//   → ほしみの丘の 時の さけめ → 時の広間（c8_hall。リオン・ミナモ・カリム・カイの 4人 そろう）
//   → 4つの つばさ（各 2階。好きな 順。家族は 分かれて 同時に）→ その さいごの「心の ためし」→ つばさの しるし（c8w_*）
//   → 広間に もどると 時の門番フリーゾンが 追いかけて くる（つばさ 1つの あと・3つの あと）→ 4つの あと 本当の 戦い（c8_gatekeeper。Step 7 の さいご）
// Step 8: 大とびらの おくの 最後の 回廊（c8_corridor。3階）→ さいごの 場所（ソリトゥスの 本当の すがたが 目を さます・第1部の 仲間が かけつける c8_gather）
//   → ソリトゥス（きまった 戦い c8_solitus。3だん。B）→ ふういんと 千年の約束 → 今の ほしみの丘（4人の 勇者の 像・トキネは 砂時計の 中へ）→ 第2部 完（c8_solitus）
// 魔物・きまった 戦い・品・ゲストの 強さ・戦いの 中の えんしゅつは B（plan-ch8.md の 9-2）
import './c8r-stub.js';
import { C8C } from '../maps/c8c-flags.js';
import {
  C8R, WINGS, WING_MARK, WING_NAME, HERO_GUEST, wingCount, ARRIVE8R, GATE_DUE8R, WIN_GATE8R, CORE8R, WIN_SOL8R, SEAL8R, TRIAL_SEEN8R, FLOOR_SEEN8R,
  MIR8R, FIRE8R, DEV8R, CHASE8R, STAR8R, MISS8R, HALL_ID, NOW_FIELD_ID, lastMapId,
} from '../maps/c8r-flags.js';
import { FLOOR_SPECS } from '../maps/c8r-wings.js';
import { floorPos } from '../maps/c8r-floor.js';
import { FIRE2_CHASE, FIRE2_CATCH } from '../maps/c8r-rows.js';
import { HALL_POS, HALL_DOORS, CORE_POS } from '../maps/c8r-hall.js';
import { RIFT8R, STATUES8R, HALL_ENTER8R } from '../maps/c8r-field.js';
import { TOKINE_SPOT } from '../maps/ch6c-side.js';
import { MAPS } from '../maps/index.js';
import { FIXED_ENCOUNTERS } from './encounters.js';
import { MONSTERS } from './monsters.js';
import { shiftPeople } from '../world/time-glass.js';
import { lightFire8r } from '../world/c8r-steps.js';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);
// 物語の 敵（フリーザが もと。名前は もじり。「見くだす心」）
export const GATE8R = '時の門番フリーゾン';
export const GATE8R_SHORT = 'フリーゾン';
export const SOLITUS8R = 'ソリトゥス';
// きまった 戦いの 魔物の 絵（showMon）: その id の 魔物が いれば それ、いなければ B の むれの はじめの 魔物
export const monOf8r = (id) => (MONSTERS[id] ? id : FIXED_ENCOUNTERS[id]?.group?.[0]?.[0] || id);

// ───── 第8章 第4幕の すすみかた（CH8_STEPS の c8_bowser の うしろ。plan-ch8.md の 9-2 の 名前の 約束）─────
export const CH8R_STEPS = [C8R.rift, C8R.hall, C8R.wings1, C8R.wings2, C8R.wings3, C8R.wings4, C8R.gatekeeper, C8R.corridor, C8R.gather, C8R.solitus];

// ───── 目標（ネタバレしない。つばさの 名前と しくみだけ）─────
export const C8R_OBJ = {
  rift: 'ほしみの丘の、トキネのそばにあいた「時のさけめ」に入ろう',
  hall: '時の広間から、4つのつばさへ。どの順でもいい（家族なら、1人1つずつ分かれると早い）',
  due: 'つばさのしるしが光った！時の広間へもどろう',
  wings1: 'つばさのためしは、あと3つ。時の広間から、のこりのつばさへ',
  wings2: 'つばさのためしは、あと2つ。時の広間から、のこりのつばさへ',
  wings3: 'つばさのためしは、あと1つ。時の広間から、のこりのつばさへ',
  wings4: '4つのしるしがそろった！時の広間の大とびらの前の、時の門番フリーゾンと戦おう',
  gateWin: '時の広間で、続きを見よう（大とびらの前に行こう）',
  gatekeeper: '大とびらが開いた！おくの階段から、最後のかいろうへ',
  corridor: '最後のかいろう。休み所で、じゅんびを整えよう。しかけをといて、上の階へ',
  last2: '最後のかいろう2階。青い火と、くろがねのしかけ。上の階へ',
  last3: '最後のかいろう3階。すべる氷と、時の砂の浅せ。いちばんおくへ',
  core: '時のはざまのおくへ進もう（じゅんびを整えてから）',
  gather: '最後の戦い。千年前と今のみんなの力で、立ち向かおう',
  win: '時のはざまのおくで、続きを見よう',
  seal: '今のほしみの丘で、続きを見よう',
  // 第8章 クリア・第2部 完（あとの 部が できたら、この 文は story-c8.js の OLD_C8_OBJ に のこす）
  solitus: '第2部　完！第3部へ（続きはアップデートで！）',
};

// パーティー全員で 見る イベント（ためし・しかけ・浅せは ひとりでも〈家族が 分かれて 同時に〉できる ように 入れない）
export const CH8R_STORY_SCRIPTS = ['c8r_hall_arrive', 'c8r_gate_event', 'c8r_gate_after', 'c8r_core_in', 'c8r_final_event', 'c8r_final_after'];

// ───────────── 今の ほしみの丘の トキネ（c8_rift）─────────────
function tokineCh8r() {
  const R = RIFT8R;
  return [
    ...S('トキネ', '{name}、おかえりなさい。', 'ミナモを、助けられたのね。…よかった。'),
    ['sfx', 'rumble'], ['shake'],
    ...S('トキネ', '…聞こえる？\n砂時計が、鳴っているの。'),
    ...S('トキネ', 'でも、こんどは…千年前でも、今でもない。', 'どこでもない所で、鳴っているわ。'),
    ...S('トキネ', '千年前と、今の、あいだ。\n時の砂が、川のように流れる場所…「時のはざま」。'),
    ...S('トキネ', '…わたしが、生まれた場所よ。'),
    ...S('トキネ', 'ふういんの日は、あした。\n黒い星のかけらは、きっと、そこにいる。'),
    ['sfx', 'spell'], ['flash'],
    ['look', R.x + 0.5, R.y + 0.5],
    ...N('トキネが砂時計をかかげると、丘の上の空気が、ぐにゃりと、ゆがんだ…！', '時の砂がうずまく「さけめ」が、口をあけた。'),
    ['flag', C8R.rift], ['sync'],
    ['look'],
    ...S('トキネ', 'あの「さけめ」から、時のはざまへ行けるわ。', 'わたしも、声で、ついていく。…行きましょう、{name}。'),
    ['objective', C8R_OBJ.rift],
  ];
}

// ───────────── 時の さけめ（今の ほしみの丘 → 時の広間）─────────────
function riftEnterSteps() {
  const H = HALL_ENTER8R;
  return [['call', async (run) => {
    const ids = [run.init.id];
    await run.runSteps([
      ['sfx', 'spell'],
      ['timeShift', 'in', ids, 'past'],
      ['teleport', H.map, H.x, H.y, 'up'],
      ['timeShift', 'out', ids, 'past'],
    ]);
  }]];
}

// ───────────── 時の広間に 着いた（c8_hall。4人 そろう）─────────────
function hallArrive() {
  const P = HALL_POS.stage;
  const [hx, hy] = [P.x + 0.5, P.y + 0.5];
  return [
    ['bgm', null],
    ['teleport', HALL_ID, hx, hy + 3, 'up'],
    ['chapter', '第8章　千年の約束', '第4幕　時のはざま'],
    ['flag', ARRIVE8R], ['sync'],
    ...N('足もとを、金色の砂が、さらさらと流れていく…。', 'あちこちに、見たことのある場所の「かけら」が、うかんでいる。\n月の王宮の柱、海の底の貝、くろがねのプロペラ、氷のかたまり…。'),
    ...S('トキネの声', '（ここが、時のはざま。\n千年前と今の、ちょうど、まん中よ）'),
    ['sfx', 'sparkle'], ['flash'],
    ['actor', 'rion_e', { sprite: 'rion', x: hx - 1.2, y: hy - 0.4, dir: 'down' }],
    ['actor', 'minamo_e', { sprite: 'minamo', x: hx - 0.4, y: hy - 0.8, dir: 'down' }],
    ['actor', 'karim_e', { sprite: 'karim', x: hx + 0.4, y: hy - 0.8, dir: 'down' }],
    ['actor', 'kai_e', { sprite: 'kai', x: hx + 1.2, y: hy - 0.4, dir: 'down' }],
    ...N('時の砂の光の中から、4人のすがたが、あらわれた！'),
    ...S('リオン', '{name}！', 'ふういんの日の朝、星の光にさそわれて…気がついたら、ここにいたんだ。'),
    ...S('カリム', 'わたしもだ。王国のつとめの、とちゅうだったのだが。\n…どうやら、ただごとではないらしい。'),
    ...S('カイ', 'へへっ、みんな、そろったな！\nおれ、こういうの、ワクワクするぜ！'),
    ...S('ミナモ', '星が、ここに集まれって、言っていたの。', '4人と、紋章の子たち。…みんなで、いっしょに行くために。'),
    ...S('トキネの声', '（この広間から、4つの「つばさ」が、のびているわ。\nつばさのおくには、それぞれ「心のためし」があるの）'),
    ...S('トキネの声', '（4つのためしを、全部こえれば、北の大とびらが開くはず。\nどの順でもいいわ。家族といっしょなら、1人1つずつ分かれても、いいのよ）'),
    ...S('リオン', 'よし。…行こう、みんな！'),
    ['remove', 'rion_e'], ['remove', 'minamo_e'], ['remove', 'karim_e'], ['remove', 'kai_e'],
    ['call', async (run) => {
      const g = run.owner.char.guests || [];
      const add = Object.values(HERO_GUEST).filter((id) => !g.includes(id));
      if (!add.length) return;
      await run.runSteps([...add.map((id) => ['guest', id]), ['sfx', 'join'], ...N('（リオン・ミナモ・カリム・カイが、パーティーに加わった！）')]);
    }],
    ['flag', C8R.hall], ['sync'],
    ['objective', C8R_OBJ.hall],
    ['bgm', 'resume'],
  ];
}

// ───────────── 時の広間の しらべる 物 ─────────────
const CREST_TEXT = {
  moon: ['月の紋章の台', 'カリム'], fire: ['青い火の紋章の台', 'カイ'], iron: ['星の紋章の台', 'ミナモ'], ice: ['氷の紋章の台', 'リオン'],
};
function crestSteps(w, x) {
  const [name, hero] = CREST_TEXT[w];
  if (x.flag(WING_MARK[w])) return N(`${name}だ。`, `${hero}の紋章が、ぽかぽかと光っている。`);
  return N(`${name}だ。まだ、光っていない…。`, `（となりの入口の先、${WING_NAME[w]}の「心のためし」をこえると、光るらしい）`);
}
function bigDoorSteps(x) {
  const n = WINGS.filter((w) => x.flag(WING_MARK[w])).length;
  return [
    ...N('大きな、時の大とびらだ。', `4つのくぼみのうち、${n}つが光っている。`),
    ...(n < 4 ? S('トキネの声', '（4つのつばさのしるしが、全部そろえば、開くはずよ）') : []),
  ];
}

// 休み所の いずみ（時の広間・最後の 回廊 1階）
const fontSteps = () => [
  ...N('星のいずみだ。時の砂が、きらきらと、光っている…。'),
  ['choice', 'いずみで休む？', ['休む', 'やめる'], [
    [['fade', 'out'], ['sfx', 'heal'], ['heal'], ['wait', 700], ['fade', 'in'], ...N('みんなのHPとMPが、すっかり回復した！'), ['church']],
    [],
  ]],
];

// ───────────── つばさの しるし（家族で 同時に）─────────────
// その 時 時のはざま（c8r_ の マップ）に いて c8_hall まで 進んで いる 家族 全員と、この だいほんの 世界の もちぬしに しるしを つける
const HERO_CREST_NAME = { moon: 'カリムの紋章', fire: 'カイの紋章', iron: 'ミナモの紋章', ice: 'リオンの紋章' };
export function markWing8r(run, w) {
  const f = WING_MARK[w];
  const world = run.world;
  const got = [];
  const give = (m) => {
    const c = m.char;
    if (!c?.flags || c.flags[f]) return;
    c.flags[f] = true;
    c.flags[GATE_DUE8R] = true;
    got.push(m);
  };
  give(run.owner);
  for (const m of world.sessions.values()) {
    if (m === run.owner || !m.inWorld || !String(m.map || '').startsWith('c8r_') || !m.char?.flags?.[C8R.hall]) continue;
    give(m);
    if (m.char.objective !== C8R_OBJ.wings4) m.char.objective = C8R_OBJ.due;
  }
  for (const m of got) {
    world.sendSelf(m);
    if (m !== run.owner && !run.everyone.includes(m)) world.send(m, { t: 'toast', text: `${HERO_CREST_NAME[w]}が光った！\n（${run.init.char.name}が、${WING_NAME[w]}のためしをこえた）` });
  }
  world.markDirty();
  return got.length;
}
const markSteps = (w) => [
  ['call', (run) => { markWing8r(run, w); }],
  ['sfx', 'item'], ['flash'],
  ...N(`${HERO_CREST_NAME[w]}が、光った！`, '（時の広間の、紋章の台にも、光がともったはず）'),
  ['sync'],
  ['objective', C8R_OBJ.due],
];

// ───────────── 時の砂の 浅せ（わたると その 階の 時代が 入れかわる）─────────────
function fordSteps() {
  return [['call', async (run) => {
    const s = run.init;
    const map = MAPS[s.map];
    if (!map?.timePair || !MAPS[map.timePair]) return;
    const to = map.timePair;
    const past = !!MAPS[to].past;
    const ids = [s.id];
    await run.runSteps([
      ['sfx', 'spell'],
      ['timeShift', 'in', ids, past ? 'past' : 'present'],
      ['call', (r) => shiftPeople(r, to, [s])],
      ['timeShift', 'out', ids, past ? 'past' : 'present'],
    ]);
  }]];
}

// ───────────── 階に 来た ときの ことば ─────────────
const isPast = (run) => !!MAPS[run.init.map]?.past;
const FLOOR_TEXT = {
  moon1: [
    ...N('白い月の光が、さしこんでいる…。', '大きな鏡と、光の橋のあとが、見える。'),
    ...S('カリム', 'これは…月の王宮の鏡だ。\n鏡が光をはねかえすと、橋がかかるのだったな。'),
    ...S('トキネの声', '（ここの鏡は、千年前でも、今でも、回せるみたい。\n鏡を回すと、どちらの時代に橋がかかるかが、かわるわ）'),
    ...S('トキネの声', '（それに、金色の「時の砂の浅せ」をわたると、時代が入れかわるの。\n砂時計を使わなくても、時をこえられるわ）'),
  ],
  moon2: [
    ...N('上のほうから、ふしぎな光がもれている…。'),
    ...S('カリム', 'あの光…わたしをよんでいる気がする。\n鏡を回して、上へ行こう。'),
  ],
  fire1: [
    ...N('青い火の台が、ぽつり、ぽつりと、ならんでいる…。', 'その先は、まっくらな空だ。'),
    ...S('カイ', 'よみの海の底の、青い火だ！\n火をともすと、見えない道が、うかぶんだよな。'),
    ...S('トキネの声', '（でも、気をつけて。ここの火は、歩くと消えてしまうわ。\n火が消える前に、わたりきってね。消えても、もう一度ともせばいいのよ）'),
  ],
  fire2: [
    ...N('上のほうで、青い光が、ちらちらと、おどっている…。'),
    ...S('カイ', '…なんだろ。\nだれかが、あそぼうって、よんでるみたいだ。'),
  ],
  iron1: [
    ...N('くろがねのプロペラが、ゴウンゴウンと、回っている…。'),
    ...S('ミナモ', 'くろがねのようさいの、しかけだわ。', '千年前で動かすと、今の形が、かわるのよね。'),
    ...S('トキネの声', '（しかけは、千年前の時代でしか動かせないわ。\n時の砂の浅せをわたって、今の時代の道をたしかめてね）'),
  ],
  iron2: [
    ...N('かべに、星の絵が、ちらばっている…。', '千年前と今で、見える星が、ちがうようだ。'),
    ...S('ミナモ', '星のことばが、聞こえる…。\n2つの時代の星を、全部読んでおきましょう。'),
  ],
  ice1: [
    ...N('ひやりとした風…。', 'ゆか一面が、つるつるの氷だ。'),
    ...S('リオン', '氷の竜の城みたいだ。\n氷の上は、止まるまで、すべっていくんだよね。'),
    ...S('トキネの声', '（ここの氷は、時代で、とけたり、こおったりするわ。\n千年前は水でも、今は氷…ということも、あるのよ）'),
  ],
  ice2: [
    ...N('氷の向こうに、しずかな部屋が見える…。'),
    ...S('リオン', '…なんだか、むねが、どきどきする。\nあの部屋で、何かが、待ってる気がするんだ。'),
  ],
  last1: [
    ...N('長い、長い、かいろうだ…。', '今まで通ってきた、いろいろな場所のかけらが、うかんでいる。'),
    ...S('トキネの声', '（ここが、最後のかいろう。\n今までのしかけが、1つずつ、もどってくるわ）'),
    ...S('トキネの声', '（入口に、休み所があるわ。\nいずみで休んで、じゅんびを整えてね）'),
  ],
  last2: [
    ...N('青い火の台と、くろがねのしかけ…。'),
    ...S('カイ', '火は、歩くと消える。\nしかけは、千年前で動かす。…よし、覚えてるぞ！'),
  ],
  last3: [
    ...N('氷のゆかの向こうから、大きな、大きな、気配がする…。'),
    ...S('リオン', 'この上が、いちばんおくだ。\n…みんな、いっしょに行こう。'),
  ],
};
function floorSteps(fk) {
  const steps = [...FLOOR_TEXT[fk], ['flag', FLOOR_SEEN8R(fk)]];
  if (fk === 'last1') steps.push(['flag', C8R.corridor], ['sync'], ['objective', C8R_OBJ.corridor]);
  else if (fk === 'last2' || fk === 'last3') steps.push(['sync'], ['objective', C8R_OBJ[fk]]);
  else steps.push(['sync']);
  return steps;
}

// かけらの かべ画（今まで 行った 場所の 思い出）
const MURAL_TEXT = {
  moon1: ['月の王宮のかべのかけらだ。', '月の子守歌の、楽ふが、きざまれている…。'],
  moon2: ['緑の王国の、旗のかけらだ。', '「王を、ひとりにするな」…と、書いてある。'],
  fire1: ['よみの海底神殿の、石のかけらだ。', '青い火の絵の下に、「つながる心は、消えない」…と、ある。'],
  fire2: ['ナギの村の、貝がらのかざりのかけらだ。', 'なみの音が、かすかに聞こえる…。'],
  iron1: ['くろがねのようさいの、図面のかけらだ。', '「ようさいは、森のおくへ、そっとおろす」…と、書きたしてある。'],
  ice1: ['氷の竜の城の、かべのかけらだ。', '大きな竜の、やさしい目の絵…。'],
  ice2: ['シロガネ地方の、雪の村のかんばんのかけらだ。', '「ようこそ」の字が、まだ、読める。'],
  last1: ['時計塔の、歯車のかけらだ。', 'カチ、コチ…と、まだ、動いている。'],
  last3: ['星の塔の、まどのかけらだ。', 'まどの向こうに、なつかしい、ホシフル村の空が見えた気がした。'],
};
const muralSteps = (fk) => N(...(MURAL_TEXT[fk] || ['ふしぎなかけらだ。', '前に、どこかで見たような…。']));

// ───────────── 月の 鏡（どちらの 時代でも 回せる）─────────────
function mirrorSteps(fk, k) {
  const f = MIR8R(fk, k);
  return [['call', async (run) => {
    const moved = !!run.owner.char.flags[f];
    await run.runSteps([
      ...N(moved ? '月の鏡は、ななめ右を向いている。' : '月の鏡は、ななめ左を向いている。'),
      ['choice', '鏡を回す？', ['回す', 'やめる'], [
        [['sfx', 'door'], ['toggle', f], ...N('ギギ…！鏡が回って、月の光の向きが、かわった！'), ['sync'], ...N('（どこかの時代に、光の橋が、かかったかもしれない）')],
        [],
      ]],
    ]);
  }]];
}

// ───────────── 青い 火の 台（どちらの 時代でも ともせる。歩くと 消える）─────────────
function fireSteps(fk, k) {
  const f = FIRE8R(fk, k);
  return [['call', async (run) => {
    const lit = !!run.owner.char.flags[f];
    await run.runSteps([
      ...N(lit ? '青い火が、ゆらゆらと、燃えている。' : '火の消えた、青い火の台だ。'),
      ['choice', lit ? '火を、大きくする？' : '青い火を、ともす？', ['ともす', 'やめる'], [
        [['sfx', 'spell'], ['call', (r) => lightFire8r(r, f)], ['sync'], ...N('ボッ…！青い火が、ともった！', '（見えない道が、うかんだ。歩くと、火は、だんだん小さくなる）')],
        [],
      ]],
    ]);
  }]];
}

// ───────────── くろがねの しかけ（千年前だけ 動かせる）─────────────
const DEVICE_TEXT = {
  prop: ['プロペラ', 'ゴウンゴウンと、プロペラが回っている。', 'プロペラは、動いていない。', 'プロペラを止める？', 'プロペラを、また回す？'],
  cannon: ['たいほう', 'たいほうが、西を向いている。', 'たいほうが、東を向いている。', 'たいほうを、東へ向ける？', 'たいほうを、西へ向ける？'],
  shutter: ['シャッター', 'まどのシャッターが、開いている。', 'まどのシャッターが、しまっている。', 'シャッターを、しめる？', 'シャッターを、開ける？'],
};
const kindOf = (fk, k) => FLOOR_SPECS[fk]?.devKinds?.[k] || 'prop';
function devSteps(fk, k) {
  const f = DEV8R(fk, k);
  const D = DEVICE_TEXT[kindOf(fk, k)];
  return [['call', async (run) => {
    const moved = !!run.owner.char.flags[f];
    await run.runSteps([
      ...N(moved ? D[2] : D[1]),
      ['choice', moved ? D[4] : D[3], ['動かす', 'やめる'], [
        [['sfx', 'door'], ['toggle', f], ...N('ガコン！'), ['sync'], ...N('（今の時代の、かたむいた板の形が、かわったかもしれない）')],
        [],
      ]],
    ]);
  }]];
}
function devNowSteps() {
  return [['call', async (run) => {
    const map = MAPS[run.init.map];
    const fk = map?.c8rFloor;
    const P = FLOOR_SPECS[fk] ? floorPos(FLOOR_SPECS[fk].rows) : null;
    let k = 0;
    if (P) {
      let best = 1e9;
      P.devices.forEach((c, i) => { const d = Math.abs(c.x + 0.5 - run.init.x) + Math.abs(c.y + 0.5 - run.init.y); if (d < best) { best = d; k = i; } });
    }
    const D = DEVICE_TEXT[kindOf(fk, k)];
    await run.runSteps([
      ...N(`さびついた${D[0]}だ。びくともしない。`),
      ...S('トキネの声', '（千年前の時代なら、動かせるはずよ）'),
    ]);
  }]];
}

// ───────────── 心の ためし ─────────────
// ためしの 部屋に 入った（勇者の 見せ場・前）
const TRIAL_IN = {
  moon: () => [
    ...N('しずかな部屋のまん中に、小さな「ともしび」が、ゆれている…。'),
    ...S('カリム', '…わたしは、王を守る騎士の家に生まれた。', 'ずっと思っていた。\n守るとは、強くなって、敵をたおすことだと。'),
    ...S('カリム', 'でも、ジャハールの時、わかったのだ。\n守るとは…うしろにいる人を、しんじて、立ちつづけることだと。'),
    ...S('カリム', '{name}。このともしびを、守りぬこう。\n…わたしのたては、そのためにある！'),
  ],
  fire: () => [
    ['call', (run) => { run.owner.char.flags[CHASE8R(0)] = true; }],
    ['sync'],
    ...N('ぽっ…！', '部屋のまん中に、小さな青い火が、ぴょこんと、あらわれた！'),
    ...S('青い火', 'ふふっ。つかまえてごらん！'),
    ...S('カイ', 'あはは！\nこいつ、よみの海の、青い火の子どもだ！'),
    ...S('カイ', 'おれの村の海でも、よく、こうやって、追いかけっこしたんだ。', 'ひとりで遊んでる子がいたら、だれかが「まてー」って、追いかける。\nそしたら、もう、ひとりじゃないだろ？'),
    ...S('カイ', '{name}、3回つかまえようぜ！\n火の通った所だけ、道が見えるからな。何回でも、いいんだぜ！'),
  ],
  iron: () => [
    ...N('部屋のおくに、4本の星のレバーがならんでいる。', '赤・金・青・黄色…。'),
    ...S('ミナモ', '星読みは、いのりと同じ。', '星の声に、しずかに、耳をすますこと…。'),
    ...S('ミナモ', '2つの時代の星が、ヒントをくれているわ。\n星が目をさます順に、レバーを引きましょう。'),
  ],
  ice: () => [
    ...N('氷の部屋に、つめたい風が、ふいている…。'),
    ...S('リオン', '…ここは、ぼくのためしだ。わかるんだ。'),
    ...S('リオン', 'ぼく、ずっと、自分は弱いって思ってた。', 'でも、ミナモを助けた時、わかったんだ。\nこわくても、1歩、前に出ればいいって。'),
    ...S('リオン', '{name}、見ていてね。'),
  ],
};
function trialInSteps(w) {
  return [...TRIAL_IN[w](), ['flag', TRIAL_SEEN8R(w)], ['sync']];
}

// 月のつばさ: 守りぬく（カリム）
function trialMoon(x) {
  if (x.flag(WING_MARK.moon)) return N('ともしびが、ぽかぽかと、ゆれている…。');
  return [
    ...(x.flag(TRIAL_SEEN8R('moon')) ? [] : trialInSteps('moon')),
    ['bgm', null],
    ...N('ともしびに、手をかざした、その時…！'),
    ['sfx', 'dark'], ['shake'],
    ...N('部屋のすみの、くらがりから、かげが、わき出してきた！', 'かげは、ともしびを、ふき消そうとしている…！'),
    ...S('カリム', 'このともしびには、指一本、ふれさせない！\nみんな、わたしのうしろへ！'),
    ['showMon', monOf8r('c8_trial_guard')],
    ['sfx', 'dark'], ['flash'],
    ['showMon', null],
    ['bgm', 'boss6'],
    ['battle', 'c8_trial_guard'],
    ['bgm', null],
    ...N('かげは、ともしびの光にとけて、消えていった…。'),
    ...S('カリム', '…守りぬいたぞ。', 'みんなが、うしろで、しんじてくれていたからだ。\nありがとう、{name}。'),
    ...markSteps('moon'),
    ['bgm', 'resume'],
  ];
}
// 氷のつばさ: 一騎うち（リオン）
function trialIce(x) {
  if (x.flag(WING_MARK.ice)) return N('しずかな氷の部屋だ。', 'リオンの足あとが、まっすぐ、のこっている。');
  return [
    ...(x.flag(TRIAL_SEEN8R('ice')) ? [] : trialInSteps('ice')),
    ['bgm', null],
    ['sfx', 'dark'], ['flash'],
    ...N('氷のかべに、リオンにそっくりな「かげ」が、うつった…！'),
    ...S('見くだす影', 'ふふ…。弱いリオン。\nおまえは、ひとりでは、何もできない。'),
    ...S('見くだす影', '紋章の勇者？わらわせる。\nいつも、だれかに、助けてもらってばかりではないか。'),
    ...S('リオン', '…そうだよ。ぼくは、ひとりじゃ、弱い。'),
    ...S('リオン', 'でも、ぼくは、ひとりじゃない。', 'みんなの声が、ぼくの、勇気になるんだ！'),
    ...S('カイ', 'そうだ、いけーっ！リオン！'),
    ...S('ミナモ', 'リオン、がんばって！'),
    ['showMon', monOf8r('c8_trial_duel')],
    ['sfx', 'dark'], ['flash'],
    ['showMon', null],
    ['bgm', 'boss6'],
    ['battle', 'c8_trial_duel'],
    ['bgm', null],
    ...N('かげは、氷のかけらになって、くだけちった。'),
    ...S('リオン', 'はあ、はあ…。\n…みんなの声、ちゃんと、聞こえてたよ。'),
    ...S('リオン', 'ぼく、もう、こわくないわけじゃない。\nでも…前に、進める！'),
    ...markSteps('ice'),
    ['bgm', 'resume'],
  ];
}

// 青火のつばさ: 追いかけっこ（カイ）。戦い なし・ばつ なし・何回でも
const CHASE_LAST = FIRE2_CHASE.length - 1;
const nextChase = (j) => (j < CHASE_LAST ? CHASE8R(j + 1) : WING_MARK.fire);
const toast = (text) => ['call', (run) => run.world.send(run.init, { t: 'toast', text })];
const HOP_TEXT = ['ぴょーん！\n青い火が、にげた！', 'まてまてー！\n青い火が、ぴょんと、にげた！', 'するり！\n青い火は、すばしっこい！'];
function hopSteps(j) {
  return [['sfx', 'spell'], ['flag', nextChase(j)], toast(HOP_TEXT[j % HOP_TEXT.length]), ['sync']];
}
function catchSteps(j) {
  const n = FIRE2_CATCH.indexOf(j) + 1;
  if (n < FIRE2_CATCH.length) {
    return [
      ['sfx', 'item'],
      ...N(`つかまえた！（${n}回め）`),
      ...S('青い火', 'きゃはは！くすぐったい！\nでも、まだまだ！'),
      ['sfx', 'spell'], ['flag', nextChase(j)], ['sync'],
      ...N(`青い火は、するりと、ぬけ出した！（あと${FIRE2_CATCH.length - n}回）`),
      ...(n === 1 ? S('カイ', 'へへっ、やるじゃん！\nもう1回だ！') : S('カイ', 'あと1回！\nはさみうちだ、{name}！')),
    ];
  }
  return [
    ['sfx', 'item'],
    ...N('つかまえた！（3回め）'),
    ...S('青い火', 'あーあ、つかまっちゃった。', '…でも、楽しかった！\nずっと、ひとりで、あそんでたんだ。'),
    ...S('カイ', 'そっか。…もう、ひとりじゃないぜ。\nまた、いつでも、あそぼうな！'),
    ...N('青い火は、カイのまわりを、くるくると回って、きらきらの光になった。'),
    ...S('カイ', '…なあ、{name}。', 'おれさ、つながる心って、むずかしいことじゃないと思うんだ。\n「いっしょに、あそぼう」って、言うことなんだよな。'),
    ...markSteps('fire'),
  ];
}

// くろがねのつばさ: 星読みの なぞ（ミナモ）。まちがえたら やり直し・2回 まちがえると ミナモが ヒント
// レバー（左から）: 0 赤・1 金・2 青・3 黄。答え: 金 → 青 → 黄 → 赤
export const STAR_COLORS8R = ['赤', '金', '青', '黄色'];
export const STAR_ANSWER8R = [1, 2, 3, 0];
// 星の ヒント（くろがねのつばさ 2階の 星の 絵。* … どちらの 時代・S … 千年前だけ・Z … 今だけ。上の 行から・左から）
export const STAR_HINTS8R = {
  iron2: [
    ['4つの星の、レバー。', '「星が目をさます順に、引きなさい。ヒントは、2つの時代に、ちらばっている」'],
    ['千年前の星の絵だ。', '「赤い星は、いちばん最後に、目をさます」'],
    ['今の星の絵だ。', '「黄色い星は、赤い星の、すぐ前に、目をさます」'],
    ['今の星の絵だ。', '「青い星は、金の星の、すぐあとに、目をさます」'],
    ['千年前の星の絵だ。', '「最初に目をさますのは、金の星」'],
  ],
};
const missCount = (flags) => [1, 2, 3].filter((n) => flags[MISS8R(n)]).length;
function leverSteps(k) {
  return [['call', async (run) => {
    const fl = run.owner.char.flags;
    if (fl[WING_MARK.iron]) { await run.runSteps(N(`${STAR_COLORS8R[k]}の星のレバーが、光っている。`)); return; }
    if (fl[STAR8R(k)]) { await run.runSteps(N(`${STAR_COLORS8R[k]}の星は、もう、光っている。`)); return; }
    const done = STAR_ANSWER8R.filter((i) => fl[STAR8R(i)]).length;
    const steps = [['choice', `${STAR_COLORS8R[k]}の星のレバーを引く？`, ['引く', 'やめる'], [[], [['call', (r) => { r.cancel8r = true; }]]]]];
    await run.runSteps(steps);
    if (run.cancel8r) { run.cancel8r = false; return; }
    if (STAR_ANSWER8R[done] === k) {
      fl[STAR8R(k)] = true;
      if (done + 1 < 4) { await run.runSteps([['sfx', 'sparkle'], ['sync'], ...N(`${STAR_COLORS8R[k]}の星が、ぽうっと、光った！`)]); return; }
      await run.runSteps([
        ['sfx', 'sparkle'], ['sync'],
        ...N('4つの星が、いっせいに、光りだした…！'),
        ['flash'],
        ...S('ミナモ', '…星が、歌っているわ。', '星読みはね、答えを知ることじゃないの。\n星の声を、しんじて、待つことなの。'),
        ...S('ミナモ', 'みんなが、2つの時代の星を、ちゃんと、読んでくれた。\n…わたし、うれしい。'),
        ...markSteps('iron'),
      ]);
      return;
    }
    // まちがえた: ぜんぶ もどす
    for (const i of STAR_ANSWER8R) delete fl[STAR8R(i)];
    const m = missCount(fl) + 1;
    if (m <= 3) fl[MISS8R(m)] = true;
    const hint = m >= 3
      ? S('ミナモ', '星の声を、そのまま、伝えるわね。', '金、青、黄色、赤…の順よ。')
      : m === 2 ? S('ミナモ', '…ヒントを、1つ。', '最初に目をさますのは、金の星。\nそのすぐあとが、青い星よ。') : S('ミナモ', 'だいじょうぶ。\n2つの時代の星の絵を、もう一度、読んでみましょう。');
    await run.runSteps([['sfx', 'leave'], ['sync'], ...N('ブブー…。', '星の光が、全部、消えてしまった。\n（最初から、やり直し）'), ...hint]);
  }]];
}

// ───────────── 時の門番フリーゾン（広間に 3回）─────────────
function gateArrive() {
  const G = HALL_POS.gate;
  const [gx, gy] = [G.x + 0.5, G.y + 2.5];
  return [
    ['bgm', null],
    ['sfx', 'dark'], ['shake'],
    ['look', gx, gy],
    ['actor', 'gate_e', { sprite: 'c8r_gate', x: gx, y: gy, dir: 'down' }],
  ];
}
function gate1() {
  return [
    ...gateArrive(),
    ...S('ひくい声', 'ほう…。'),
    ...N('広場のまん中に、白く、つやつやした、だれかが、すうっと、あらわれた。'),
    ...S(GATE8R, '初めまして、紋章の子のみなさん。', 'わたしは、この時のはざまの門番、フリーゾンと申します。'),
    ...S(GATE8R, 'つばさのためしを、1つ、こえたそうですね。\n…ほう。小さな子どもと、千年前の、おさない勇者たちで。'),
    ...S(GATE8R, 'ふふふ。ずいぶんと、かわいらしい。\n少し、お相手してさしあげましょう。'),
    ['showMon', monOf8r('c8_gate1')],
    ['sfx', 'dark'], ['flash'],
    ['showMon', null],
    ['look'],
    ['bgm', 'c8r_gate'],
    ['battle', 'c8_gate1'],
    ['bgm', null],
    ...S(GATE8R, 'ほう、少しは、やるようですね。'),
    ...S(GATE8R, 'ですが、これで、本気だとでも？\nのこりのつばさも、せいぜい、がんばってください。'),
    ['remove', 'gate_e'],
    ...N(`${GATE8R_SHORT}は、時の砂の中へ、すうっと、消えた…。`),
    ...S('カリム', '…なんという、いやな、目だ。\nわたしたちを、まるで、虫のように見ていた。'),
    ...S('トキネの声', '（あの門番…心の中に、黒い何かを、かかえているわ。\n気をつけて）'),
  ];
}
function gate2() {
  return [
    ...gateArrive(),
    ...S(GATE8R, 'おや、おや。また、お会いしましたね。', 'つばさを、3つも。…少し、おどろきました。'),
    ...S(GATE8R, 'では、ごほうびに、お見せしましょう。\nわたしの、2つめのすがたを。'),
    ['sfx', 'dark'], ['flash'], ['shake'],
    ...N(`${GATE8R_SHORT}の体が、ぐんぐん、大きくなっていく…！`),
    ['showMon', monOf8r('c8_gate2')],
    ['sfx', 'dark'], ['flash'],
    ['showMon', null],
    ['look'],
    ['bgm', 'c8r_gate'],
    ['battle', 'c8_gate2'],
    ['bgm', null],
    ...S(GATE8R, '…これは、これは。\nわたしに、ここまで、させるとは。'),
    ...S(GATE8R, 'よろしい。のこり1つ。\nその時は、わたしも、本気でお相手しましょう。'),
    ['remove', 'gate_e'],
    ...N(`${GATE8R_SHORT}は、また、時の砂の中へ消えた…。`),
    ...S('カイ', 'なんだよ、あいつ！\nいちいち、えらそうだな！'),
    ...S('ミナモ', '…でも、少しだけ、さびしそうな声だったわ。'),
  ];
}
function gateFinal() {
  const G = HALL_POS.gate;
  return [
    ['bgm', null],
    ['hideNpc', 'c8r_gate_npc'],
    ...gateArrive(),
    ...S(GATE8R, 'お見事です。4つのつばさを、すべて、こえるとは。'),
    ...S(GATE8R, 'ですが、この大とびらの先へは、行かせません。', 'わたしは、時の門番。\n弱い者を、通すわけには、いかないのですよ。'),
    ...S(GATE8R, '小さな子ども。千年前の、ちっぽけな勇者たち。\n…あなたがたは、ひとりひとりは、本当に、弱い。'),
    ...S('リオン', '…そうだよ。ぼくたちは、ひとりひとりは、弱いかもしれない。'),
    ...S('リオン', 'でも、弱くても、ひとりじゃない！', 'みんながいるから、ぼくは、何回でも、立ち上がれるんだ！'),
    ...S('カリム', 'そのとおりだ。'),
    ...S('カイ', 'へへっ、そういうこと！'),
    ...S('ミナモ', 'わたしたちは、いっしょよ。'),
    ...S(GATE8R, '…いいでしょう。\nでは、わたしの、本当のすがたを、お見せしましょう。'),
    ['sfx', 'dark'], ['flash'], ['shake'],
    ...N(`${GATE8R_SHORT}の体が、白く、まぶしく、かがやいた…！`),
    ['showMon', monOf8r('c8_gatekeeper')],
    ['sfx', 'dark'], ['flash'],
    ['showMon', null],
    ['look'],
    ['bgm', 'c8r_gate'],
    ['battle', 'c8_gatekeeper'],
    ['bgm', null],
    ['flag', WIN_GATE8R], ['sync'],
    ['objective', C8R_OBJ.gateWin],
    ...gateAfter(G),
  ];
}
// 門番に 勝った あと（見くだす心を かけらが うばう → 大とびらが 開く）。とちゅうで 切れたら 広場で 続き
function gateAfter(G = HALL_POS.gate) {
  const [gx, gy] = [G.x + 0.5, G.y + 2.5];
  return [
    ['actor', 'gate_e', { sprite: 'c8r_gate', x: gx, y: gy, dir: 'down' }],
    ['look', gx, gy],
    ...S(GATE8R, '…ば、ばかな。\nこのわたしが…弱い者たちに…。'),
    ['sfx', 'dark'], ['flash'],
    ...N(`そのとき、${GATE8R_SHORT}のむねから、小さな黒い星のかけらが、すうっと、ぬけ出した！`),
    ...S('黒い星のかけら', '…見くだす心…たしかに、いただいた…。', 'よくばり、いかり、ひとりじめ、見くだす心…。\nこれで、くらい心は、四つ…。'),
    ...S('黒い星のかけら', '…ふういんの日だ。\nいま、目をさます…！'),
    ['sfx', 'rumble'], ['shake'],
    ...N('黒い星のかけらは、大とびらのすきまへ、すいこまれていった…！'),
    ...S(GATE8R, '…わたしは、ずっと、ここで、ひとりで、門を守ってきました。', 'だれも、通らない門を、千年。\n…弱い者を見くだしていれば、自分が、少しだけ、強い気がしたのです。'),
    ...S('リオン', '…それなら、もう、ひとりじゃないよ。\nぼくたちが、ここを通ったんだから。'),
    ...S(GATE8R, '…ふん。\nまったく…あまい、子どもたちですね。'),
    ...S(GATE8R, '…行きなさい。大とびらは、開けておきます。', 'ただし。…負けたら、しょうちしませんよ。'),
    ['remove', 'gate_e'],
    ['sfx', 'door'], ['shake'],
    ['flag', C8R.gatekeeper], ['sync'],
    ...N('ゴゴゴゴ…！時の大とびらが、ゆっくりと、開いた！'),
    ['look'],
    ...S('トキネの声', '（大とびらの先が、最後のかいろう…。\nいちばんおくで、あの星が、目をさまそうとしている）'),
    ['objective', C8R_OBJ.gatekeeper],
    ['bgm', 'resume'],
  ];
}
// 広場に 入った（しるしが ふえていれば 門番。いちばん 先の 場面 だけ）
function gateEvent(x) {
  if (x.flag(C8R.gatekeeper) || !x.flag(C8R.hall)) return [];
  if (x.flag(WIN_GATE8R)) return gateAfter();
  const n = wingCount(x.flag);
  if (n >= 4) return [['flag', C8R.wings4], ['call', (run) => { delete run.owner.char.flags[GATE_DUE8R]; }], ['sync'], ['objective', C8R_OBJ.wings4], ...gateFinal()];
  const done = (f, obj) => [['flag', f], ['call', (run) => { delete run.owner.char.flags[GATE_DUE8R]; }], ['sync'], ['objective', obj], ['bgm', 'resume']];
  if (n >= 3 && !x.flag(C8R.wings3)) return [...gate2(), ...done(C8R.wings3, C8R_OBJ.wings3)];
  if (n >= 2 && !x.flag(C8R.wings2)) {
    if (!x.flag(C8R.wings1)) return [...gate1(), ...done(C8R.wings2, C8R_OBJ.wings2)];
    return [
      ['sfx', 'sparkle'],
      ...N('広間の紋章の台が、2つ、光っている。'),
      ...S('トキネの声', '（半分まで来たわ。\nあの門番の気配…どこかで、こっちを見ているわね）'),
      ...done(C8R.wings2, C8R_OBJ.wings2),
    ];
  }
  if (n >= 1 && !x.flag(C8R.wings1)) return [...gate1(), ...done(C8R.wings1, C8R_OBJ.wings1)];
  return [['call', (run) => { delete run.owner.char.flags[GATE_DUE8R]; }], ['sync']];
}

// ───────────── さいごの 場所（第1部の 仲間が かけつける → ソリトゥス）─────────────
function coreIn() {
  return [
    ['bgm', null],
    ...N('しん…と、しずかだ。', '時の砂が、ここでは、流れていない…。'),
    ...S('トキネの声', '（ここが、時のはざまの、いちばんおく…）'),
    ['flag', CORE8R], ['sync'],
    ['objective', C8R_OBJ.core],
    ['bgm', 'resume'],
  ];
}
// 第1部の 仲間（かけつける）
const FRIENDS = [
  ['nocto_e', 'nocto', -3, 2.2], ['sara_e', 'sara', -2, 3], ['luca_e', 'luca', 2, 3], ['elder_e', 'elder', 3, 2.2],
];
function finalEvent(x) {
  if (x.flag(C8R.gather)) {
    return [
      ['bgm', null],
      ...S('トキネの声', '（みんなが、時のはざまを、ささえてくれているわ。\nもう一度、立ち向かいましょう！）'),
      ...S('リオン', 'みんな…行こう！'),
      ['bgm', 'solitus'],
      ['battle', 'c8_solitus'],
      ['bgm', null],
      ['flag', WIN_SOL8R], ['sync'],
      ['objective', C8R_OBJ.win],
      ...finalAfter(),
    ];
  }
  const P = CORE_POS;
  const [sx, sy] = [P.solitus.x + 0.5, P.solitus.y + 0.5];
  const [cx, cy] = [P.stage.x + 0.5, P.stage.y + 0.5];
  return [
    ['bgm', null],
    ['look', sx, sy + 1],
    ...N('いちばんおくに、黒い星のかけらが、うかんでいる…。'),
    ...S('黒い星のかけら', '…よく来た、紋章の子らよ。', 'よくばりな心。いかりの心。ひとりじめの心。見くだす心。\n…四つ、そろった。'),
    ['sfx', 'dark'], ['flash'], ['shake'],
    ...N('四つのくらい心が、黒いうずになって、かけらに、すいこまれていく…！'),
    ['sfx', 'rumble'], ['shake'],
    ['showMon', monOf8r('c8_solitus')],
    ...S(SOLITUS8R, 'われは、ソリトゥス。', 'この世界の、すべての光を、のみこむ者…。'),
    ['showMon', null],
    ['sfx', 'rumble'], ['shake'], ['flash'],
    ...N('時のはざまが、ぐらぐらと、ゆれ出した！', 'あちこちのかけらが、くずれて、砂になっていく…！'),
    ...S('トキネの声', '（だめ…！時のはざまが、くずれていく…！\nこのままじゃ、千年前も、今も…！）'),
    ...S('リオン', 'みんな、しっかり！'),
    ['bgm', null],
    ...N('…その時。'),
    ['sfx', 'sparkle'], ['flash'],
    ...S('なつかしい声', '――{name}！'),
    ...FRIENDS.map(([id, sprite, dx, dy]) => ['actor', id, { sprite, x: cx + dx, y: cy + dy, dir: 'up' }]),
    ['actor', 'astel_e', { sprite: 'star_dragon', x: cx, y: cy + 4, dir: 'up' }],
    ...N('光の中から、なつかしい顔が、つぎつぎと、あらわれた！'),
    ...S('ルカ', '{name}！やっと追いついたぜ！\n時の砂のにおいを、たどってきたんだ！'),
    ...S('サラ', 'わたしたちの時代まで、ゆれが、とどいていたの。\nだまって見ているなんて、できないわ！'),
    ...S('ホシミばあちゃん', 'ほっほっ。星読みのばばを、なめてもらっちゃ、こまるねえ。'),
    ...S('ノクト', '…おまえたちには、借りがある。\nそれを返しに来ただけだ。'),
    ...S('星の竜アステル', 'グオオオ…！', '（星の竜のつばさが、くずれかけた時のはざまを、ささえている…！）'),
    ...S('ミナモ', '千年後の…みなさん…？'),
    ...S('カイ', 'すげえ！\n千年前と今の人が、いっしょにいる！'),
    ...S('トキネの声', '（みんな…ありがとう。\n時のはざまが、少しだけ、もちこたえたわ！）'),
    ['flag', C8R.gather], ['sync'],
    ['objective', C8R_OBJ.gather],
    ...S('リオン', 'みんな…行こう！'),
    ...FRIENDS.map(([id]) => ['remove', id]), ['remove', 'astel_e'],
    ['look'],
    ['bgm', 'solitus'],
    ['battle', 'c8_solitus'],
    ['bgm', null],
    ['flag', WIN_SOL8R], ['sync'],
    ['objective', C8R_OBJ.win],
    ...finalAfter(),
  ];
}
// ソリトゥスに 勝った あと（ひとりぼっちの 星・ふういん・千年の約束）→ 今の ほしみの丘。とちゅうで 切れたら 広間・丘で 続き
function finalAfter() {
  const P = CORE_POS;
  const [sx, sy] = [P.solitus.x + 0.5, P.solitus.y + 0.5];
  const [cx, cy] = [P.stage.x + 0.5, P.stage.y + 0.5];
  return [
    ['look', sx, sy + 1],
    ['actor', 'rion_e', { sprite: 'rion', x: cx - 1.5, y: cy, dir: 'up' }],
    ['actor', 'minamo_e', { sprite: 'minamo', x: cx - 0.5, y: cy + 0.3, dir: 'up' }],
    ['actor', 'karim_e', { sprite: 'karim', x: cx + 0.5, y: cy + 0.3, dir: 'up' }],
    ['actor', 'kai_e', { sprite: 'kai', x: cx + 1.5, y: cy, dir: 'up' }],
    ['sfx', 'sparkle'],
    ...N('くらい心が、全部、はがれ落ちた…。', 'あとには、小さな、小さな星が、ひとつ。\nふるえるように、光っていた。'),
    ...S('小さな星', '…さむい。', '…くらい。\n…ずっと、ひとりぼっち。'),
    ...S('ミナモ', '…この星は、空から、おちてきたのね。', 'ずっと、ずっと、ひとりで…。\nだから、ほかの心を、ほしいと思っていたんだわ。'),
    ...S('リオン', '…ひとりにしないよ。', 'ぼくたちが、ここにいる。'),
    ...N('{name}も、そっと、手をのばした。\n――ひとりにしない。'),
    ['sfx', 'sparkle'], ['flash'],
    ...N('その時。\nカイのむねに、紋章が、初めて、光った。'),
    ...S('カイ', '…え？\nおれの…紋章…？'),
    ...S('カリム', 'えらばれなかったのでは、なかったのだ。', '…カイ。おまえは、わたしたちと、きずなで、えらばれたのだ。'),
    ...S('カイ', '…へへっ。\nなんだよ、それ。…泣いちゃうじゃんか。'),
    ['crest'],
    ...N('4つの紋章の光が、小さな星を、やさしく、つつんだ。'),
    ...S('ミナモ', '…でも、この時代では、まだ、この星を、全部は、救えない。', '星の声が、そう言っているの。'),
    ...S('リオン', 'じゃあ…ふういんしよう。', 'そして、約束するんだ。'),
    ...S('リオン', '千年後、きっと、だれかが――\nこの星を、ひとりぼっちのさびしさから、救いに来るって。'),
    ...N('{name}は、ハッとした。'),
    ...N('星の塔のてっぺん。\nひとりぼっちの星に、「ひとりにしない」と、よびかけた日のこと…。'),
    ...S('{name}', '…その約束。', 'ぼくたちが、はたしたよ。'),
    ...S('リオン', '…え？'),
    ...S('トキネの声', '（そうよ。\n千年後の、この子たちが、ちゃんと、その約束をはたすの）'),
    ...S('リオン', '…そっか。', 'そっかあ…！\nじゃあ、安心して、ふういんできるね。'),
    ['sfx', 'spell'], ['flash'],
    ...N('4人の紋章が、光の糸になって、小さな星を、そっと、ふういんした。'),
    ...N('――千年の約束が、むすばれた。'),
    ['remove', 'rion_e'], ['remove', 'minamo_e'], ['remove', 'karim_e'], ['remove', 'kai_e'],
    ['look'],
    ['flag', SEAL8R], ['sync'],
    ['objective', C8R_OBJ.seal],
    ...farewell(),
  ];
}
function farewell() {
  const P = CORE_POS;
  const [cx, cy] = [P.stage.x + 0.5, P.stage.y + 0.5];
  return [
    ['bgm', 'ending2'],
    ['actor', 'rion_e', { sprite: 'rion', x: cx - 1.5, y: cy - 1, dir: 'down' }],
    ['actor', 'minamo_e', { sprite: 'minamo', x: cx - 0.5, y: cy - 1.2, dir: 'down' }],
    ['actor', 'karim_e', { sprite: 'karim', x: cx + 0.5, y: cy - 1.2, dir: 'down' }],
    ['actor', 'kai_e', { sprite: 'kai', x: cx + 1.5, y: cy - 1, dir: 'down' }],
    ...N('時の砂が、しずかに、また流れ出した。', '千年前のみんなは、それぞれの時代へ、帰らなくてはいけない。'),
    ...S('カリム', '{name}。王国は、わたしが守る。', '…千年後の、王都サファラも、よろしくたのむ。'),
    ...S('カイ', 'なあ、千年後の海で、また、追いかけっこしような！\n…おれのこと、わすれんなよ！'),
    ...S('ミナモ', '星を見上げたら、思い出してね。\nわたしたちは、ずっと、そこにいるから。'),
    ...S('リオン', '{name}。…ありがとう。', 'ぼく、勇者になれたよ。\nきみたちが、いっしょだったから。'),
    ...S('リオン', 'さよならじゃないよ。\n…またね！'),
    ['sfx', 'sparkle'], ['flash'],
    ['remove', 'rion_e'], ['remove', 'minamo_e'], ['remove', 'karim_e'], ['remove', 'kai_e'],
    ['guest', null],
    ...N('4人は、光の砂になって、千年前へ、帰っていった…。'),
    ...hillEnding(),
  ];
}
// 今の ほしみの丘（4人の 勇者の 像・トキネは 砂時計の 中へ・第2部 完・つづく）
function hillEnding() {
  const T0 = TOKINE_SPOT;
  const [tx, ty] = [T0.x + 0.5, T0.y + 0.5];
  return [
    ['fade', 'out'],
    ['teleport', NOW_FIELD_ID, tx, ty + 2, 'up'],
    ['flag', C8R.solitus], ['sync'],
    ['hideNpc', 'tokine_c6'],
    ['actor', 'tokine_e', { sprite: 'tokine', x: tx, y: ty, dir: 'down' }],
    ['fade', 'in'],
    ...N('気がつくと、ほしみの丘に立っていた。', '朝の光が、やさしく、丘をてらしている。'),
    ['look', STATUES8R[0].x + 3.5, STATUES8R[0].y + 0.5],
    ...N('丘の上に、4つの石の像が、ならんでいた。', 'たてを持つ騎士。明るく笑う少年。星を見上げる少女。\nそして…まっすぐ前を見つめる、少年の勇者。'),
    ...S('トキネ', '…はじまりの勇者たちの像よ。', '千年の約束が、ちゃんと、ここまで、とどいたのね。'),
    ['look'],
    ...S('トキネ', '{name}。', 'わたしの役目も、これで、おしまい。'),
    ...S('トキネ', 'わたしは、時の砂時計の中へ、帰るわ。\n…でも、さよならじゃない。'),
    ...S('トキネ', '砂時計が鳴ったら、それは、わたしの声。', 'また、会えるわ。きっと。'),
    ['sfx', 'sparkle'], ['flash'],
    ['remove', 'tokine_e'],
    ...N('トキネは、さらさらと、金色の砂になって、時の砂時計の中へ、すいこまれていった。'),
    ...N('砂時計の中で、小さな砂が、一つぶ。\nきらりと、光った気がした。'),
    ['chapter', '第2部　千年の約束', '完'],
    ...N('――それから、少しの時がすぎた。'),
    ...N('ほしみの丘には、今日も、やさしい風がふいている。', '4人の勇者の像の前で、{name}は、空を見上げた。'),
    ...N('新しい旅が、また、はじまろうとしていた…。'),
    ['chapter', '第3部へ', 'つづく'],
    ['objective', C8R_OBJ.solitus],
    ['bgm', 'resume'],
  ];
}

// ───────────── にげた 心が もどる（ソリトゥスの 1だん目。戦いの 中の 手だすけは B。ここは せりふ だけ）─────────────
// B が 戦いの 中で 使う: [だれ, ひと言, 手だすけの ことば]。笑える・短く
export const C8R_HEART_LINES = {
  jafar: ['大臣ジャハール', 'こらーっ！それは、わしの心じゃ！\nよくばりなのは、わし一人で、じゅうぶんじゃ！', 'ほれ、ランプの力じゃ。…一回だけじゃぞ！'],
  hades: ['よみの王ハデロス', 'おれの、いかりを、勝手に使うなーっ！\n…あっ、また頭が、青くなっちまった。', 'ええい、青い炎で、てらしてやる！'],
  bowser: ['初代大魔王クッパード', 'ガーッハッハ！わがはいの、ひとりじめの心を、返せい！\n…ついでに、おまんじゅうも返せ！', 'こうらで、守ってやる！ありがたく思え！'],
  gate: ['時の門番フリーゾン', '…見くだす心など、もう、いりませんよ。\n…ぶつぶつ…負けたら、しょうちしないと、言ったでしょう…。', 'ほんの少しだけ、時を止めてさしあげます。'],
};

// ───────────── 人と 物の ことば ─────────────
const LINES = {
  c8r_bigdoor: (x) => bigDoorSteps(x),
  c8r_statue: () => N('はじまりの勇者たちの、石の像だ。', '4人とも、どこか、うれしそうな顔をしている…。'),
};

// ───────────── だいほん ─────────────
const FLOOR_KEYS = Object.keys(FLOOR_SPECS);
export const CH8R_SCRIPTS = {
  ...LINES,
  c8r_rift_enter: (x) => (x.flag(C8R.rift) ? riftEnterSteps() : []),
  c8r_hall_arrive: (x) => (x.flag(C8R.hall) || !x.flag(C8R.rift) ? [] : hallArrive()),
  c8r_gate_event: (x) => gateEvent(x),
  c8r_gate_after: (x) => (x.flag(WIN_GATE8R) && !x.flag(C8R.gatekeeper) ? gateAfter() : []),
  c8r_font: () => fontSteps(),
  c8r_ford: () => fordSteps(),
  c8r_dev_now: () => devNowSteps(),
  ...Object.fromEntries(WINGS.map((w) => [`c8r_crest_${w}`, (x) => crestSteps(w, x)])),
  ...Object.fromEntries(FLOOR_KEYS.map((fk) => [`c8r_f_${fk}`, (x) => (x.flag(FLOOR_SEEN8R(fk)) ? [] : floorSteps(fk))])),
  ...Object.fromEntries(FLOOR_KEYS.map((fk) => [`c8r_mural_${fk}`, () => muralSteps(fk)])),
  ...Object.fromEntries(FLOOR_KEYS.flatMap((fk) => floorPos(FLOOR_SPECS[fk].rows).mirrors.map((_, k) => [`c8r_mirror_${fk}_${k}`, () => mirrorSteps(fk, k)]))),
  ...Object.fromEntries(FLOOR_KEYS.flatMap((fk) => floorPos(FLOOR_SPECS[fk].rows).fires.map((_, k) => [`c8r_fire_${fk}_${k}`, () => fireSteps(fk, k)]))),
  ...Object.fromEntries(FLOOR_KEYS.flatMap((fk) => floorPos(FLOOR_SPECS[fk].rows).devices.map((_, k) => [`c8r_dev_${fk}_${k}`, () => devSteps(fk, k)]))),
  ...Object.fromEntries(Object.entries(STAR_HINTS8R).flatMap(([fk, list]) => list.map((t, k) => [`c8r_star_${fk}_${k}`, () => N(...t)]))),
  ...Object.fromEntries([0, 1, 2, 3].map((k) => [`c8r_lever_${k}`, () => leverSteps(k)])),
  ...Object.fromEntries(WINGS.map((w) => [`c8r_trial_in_${w}`, (x) => (x.flag(TRIAL_SEEN8R(w)) || x.flag(WING_MARK[w]) ? [] : trialInSteps(w))])),
  c8r_trial_moon: (x) => trialMoon(x),
  c8r_trial_ice: (x) => trialIce(x),
  // 追いかけっこ: 近づくと にげる（hop）・つかまえられる 所で 近づくか しらべる（catch）
  ...Object.fromEntries(FIRE2_CHASE.map((_, j) => [`c8r_hop_${j}`, (x) => (x.flag(CHASE8R(j)) && !x.flag(nextChase(j)) ? hopSteps(j) : [])])),
  ...Object.fromEntries(FIRE2_CATCH.map((j) => [`c8r_catch_${j}`, (x) => (x.flag(CHASE8R(j)) && !x.flag(nextChase(j)) ? catchSteps(j) : [])])),
  ...Object.fromEntries(FIRE2_CHASE.map((_, j) => [`c8r_wisp_${j}`, (x) => {
    if (!x.flag(CHASE8R(j)) || x.flag(nextChase(j))) return [];
    return FIRE2_CATCH.includes(j) ? catchSteps(j) : hopSteps(j);
  }])),
  c8r_core_in: (x) => (x.flag(CORE8R) ? [] : coreIn()),
  c8r_final_event: (x) => (x.flag(WIN_SOL8R) || !x.flag(C8R.corridor) ? [] : finalEvent(x)),
  c8r_final_after: (x) => (x.flag(WIN_SOL8R) && !x.flag(SEAL8R) ? finalAfter() : x.flag(SEAL8R) && !x.flag(C8R.solitus) ? farewell() : []),
};

// ───── 目標の 行き先（quest-targets.js）─────
const doorAt = (w) => ({ map: HALL_ID, x: HALL_DOORS[w].x, y: HALL_DOORS[w].y, unless: WING_MARK[w] });
const upOf = (n, now = false) => { const U = floorPos(FLOOR_SPECS[`last${n}`].rows).up; return { map: lastMapId(n, now), x: U.x, y: U.y }; };
const allDoors = () => WINGS.map(doorAt);
export const CH8R_OBJECTIVE_TARGETS = {
  [C8R_OBJ.rift]: [{ map: NOW_FIELD_ID, x: RIFT8R.x, y: RIFT8R.y }],
  [C8R_OBJ.hall]: allDoors(),
  [C8R_OBJ.due]: [{ map: HALL_ID, x: HALL_POS.font.x, y: HALL_POS.font.y }],
  [C8R_OBJ.wings1]: allDoors(),
  [C8R_OBJ.wings2]: allDoors(),
  [C8R_OBJ.wings3]: allDoors(),
  [C8R_OBJ.wings4]: [{ npc: 'c8r_gate_npc' }],
  [C8R_OBJ.gateWin]: [{ map: HALL_ID, x: HALL_POS.bigDoor.x, y: HALL_POS.bigDoor.y + 3 }],
  [C8R_OBJ.gatekeeper]: [{ map: HALL_ID, x: HALL_POS.up.x, y: HALL_POS.up.y }],
  [C8R_OBJ.corridor]: [upOf(1), upOf(1, true)],
  [C8R_OBJ.last2]: [upOf(2), upOf(2, true)],
  [C8R_OBJ.last3]: [upOf(3), upOf(3, true)],
  [C8R_OBJ.core]: [{ map: 'c8r_core', x: CORE_POS.solitus.x, y: CORE_POS.trigger.y }],
  [C8R_OBJ.gather]: [{ map: 'c8r_core', x: CORE_POS.solitus.x, y: CORE_POS.trigger.y }],
  [C8R_OBJ.win]: [{ map: 'c8r_core', x: CORE_POS.solitus.x, y: CORE_POS.trigger.y }],
  [C8R_OBJ.seal]: [{ map: 'c8r_core', x: CORE_POS.solitus.x, y: CORE_POS.trigger.y }],
  [C8R_OBJ.solitus]: [{ map: NOW_FIELD_ID, x: STATUES8R[1].x, y: STATUES8R[1].y + 1 }],
};

// ───── 仲間会話（party-talk.js。「はなす」の ヒント。どれも 9字 いじょう）─────
const T4 = (self, bold, kind, kid) => ({ self, bold, kind, kid });
const WING_TALK = T4('4つのつばさのためしを、こえよう。家族なら、1人1つずつ分かれると早い。', 'のこりのつばさも、どーんといくぞ！',
  'のこりのつばさへ、行きましょう。どの順でも、だいじょうぶです。', 'つばさへ、いってみよう！');
export const CH8R_OBJECTIVE_TALK = {
  [C8R_OBJ.rift]: T4('ほしみの丘の、トキネのそばの「時のさけめ」に入ろう。', 'さけめだ！とびこむぞ！',
    'トキネさんのそばの、時のさけめに入りましょう。', 'ときのさけめに、はいろう！'),
  [C8R_OBJ.hall]: T4('時の広間から、4つのつばさへ。どの順でもいい。家族なら分かれると早い。', 'どのつばさから行く？全部まとめて、行くぞ！',
    '4つのつばさに、それぞれ「心のためし」があるそうです。', 'すきな、つばさへ、いこう！'),
  [C8R_OBJ.due]: T4('つばさのしるしが光った。時の広間へもどろう。', '広間にもどるぞ！なんか、来そうだな！',
    '時の広間へ、もどりましょう。いやな気配がします。', 'ひろまに、もどろう！'),
  [C8R_OBJ.wings1]: WING_TALK,
  [C8R_OBJ.wings2]: WING_TALK,
  [C8R_OBJ.wings3]: T4('つばさのためしは、あと1つ。時の広間から、のこりのつばさへ。', 'あと1つだ！いっきにいくぞ！',
    'あと1つです。気をぬかずに、行きましょう。', 'あと、ひとつだよ！'),
  [C8R_OBJ.wings4]: T4('大とびらの前の、時の門番フリーゾンと戦おう。じゅんびを整えてから。', 'あのえらそうな門番、ぶっとばすぞ！',
    'いずみで休んでから、門番さんと向き合いましょう。', 'もんばんに、立ち向かおう！'),
  [C8R_OBJ.gateWin]: T4('大とびらの前に行くと、続きが見られる。', '大とびらの前に行こうぜ！',
    '大とびらの前へ、行ってみましょう。', 'おおとびらへ、いこう！'),
  [C8R_OBJ.gatekeeper]: T4('大とびらのおくの階段から、最後のかいろうへ。', '最後のかいろうだ！行くぞ！',
    'おくの階段から、最後のかいろうへ。いよいよです。', '最後の、かいろうへ！'),
  [C8R_OBJ.corridor]: T4('最後のかいろう。入口のいずみで休んで、鏡のしかけで上へ。', '鏡を回して、上だ上だ！',
    '入口のいずみで、しっかり休んでから進みましょう。', 'かがみを、まわそう！'),
  [C8R_OBJ.last2]: T4('青い火は歩くと消える。しかけは千年前で動かそう。', '火をつけて、ダッシュだ！',
    '青い火が消える前に、わたりましょう。しかけは千年前で。', 'あおいひを、ともそう！'),
  [C8R_OBJ.last3]: T4('すべる氷と、時の砂の浅せ。止まる所を考えて、すべろう。', 'つるつるすべって、おくへ行くぞ！',
    '氷の上は、止まる所を、よく見て進みましょう。', 'こおりを、すべろう！'),
  [C8R_OBJ.core]: T4('時のはざまのおくへ。じゅんびを整えてから進もう。', 'いよいよだな！いくぞ！',
    'いよいよ、最後です。みんなで、行きましょう。', 'みんなで、いこう！'),
  [C8R_OBJ.gather]: T4('千年前と今のみんなの力で、最後の戦いに立ち向かおう。', 'みんながいれば、負けねえ！',
    '千年前と今のみんなが、いっしょです。', 'みんなで、がんばろう！'),
  [C8R_OBJ.win]: T4('時のはざまのおくで、続きが見られる。', '続きを見に行こうぜ！',
    'おくへ行けば、続きが見られるそうです。', '続きを、見に行こう！'),
  [C8R_OBJ.seal]: T4('続きが見られる。時のはざまのおくへ。', 'もう少しだけ、続きがあるぞ！',
    'もう少しだけ、続きがあるそうです。', '続きを、見に行こう！'),
  [C8R_OBJ.solitus]: T4('第2部、完。ほしみの丘の、4人の勇者の像を見に行こう。', 'やったな！第2部、クリアだ！',
    '第2部、クリアです。ほんとうに、おつかれさまでした。', 'だい2ぶ、クリアだよ！'),
};

// ───── すすみぐあい（progress.js。story-c8.js の CH8_PROGRESS の うしろ）─────
const fl = (c) => (f) => !!c?.flags?.[f];
export const CH8R_PROGRESS = [
  [C8R.rift, C8R_OBJ.rift],
  [C8R.hall, C8R_OBJ.hall],
  [C8R.wings1, C8R_OBJ.wings1],
  [C8R.wings2, C8R_OBJ.wings2],
  [C8R.wings3, C8R_OBJ.wings3],
  [(c) => fl(c)(C8R.hall) && fl(c)(GATE_DUE8R) && !fl(c)(C8R.wings4), C8R_OBJ.due],
  [C8R.wings4, C8R_OBJ.wings4],
  [WIN_GATE8R, C8R_OBJ.gateWin],
  [C8R.gatekeeper, C8R_OBJ.gatekeeper],
  [C8R.corridor, C8R_OBJ.corridor],
  [FLOOR_SEEN8R('last2'), C8R_OBJ.last2],
  [FLOOR_SEEN8R('last3'), C8R_OBJ.last3],
  [CORE8R, C8R_OBJ.core],
  [C8R.gather, C8R_OBJ.gather],
  [WIN_SOL8R, C8R_OBJ.win],
  [SEAL8R, C8R_OBJ.seal],
  [C8R.solitus, C8R_OBJ.solitus],
];

// ───── story-c8.js の applyCh8 から: だいほんを まぜる（今の トキネ・パーティー全員で 見る イベント）─────
const wrap = (SCRIPTS, id, fn) => {
  const base = SCRIPTS[id] || (() => []);
  SCRIPTS[id] = Object.assign((x) => fn(x, base), base);
};
export function applyCh8r(SCRIPTS, STORY_SCRIPTS) {
  Object.assign(SCRIPTS, CH8R_SCRIPTS);
  for (const id of CH8R_STORY_SCRIPTS) STORY_SCRIPTS.add(id);
  // 今の ほしみの丘の トキネ: 第3幕クリアの あとは まず 第4幕の はじまり
  wrap(SCRIPTS, 'c6_tokine', (x, base) => {
    if (x.flag(C8C.bowser) && !x.flag(C8R.rift)) return tokineCh8r();
    if (x.flag(C8R.rift) && !x.flag(C8R.hall)) return S('トキネ', 'そばの「時のさけめ」から、時のはざまへ行けるわ。', 'わたしも、声で、ついていくわね。');
    if (x.flag(C8R.hall) && !x.flag(C8R.solitus)) return S('トキネ', '時のはざまへは、そばの「時のさけめ」から。', '{name}、たのんだわよ。');
    return base(x);
  });
}
