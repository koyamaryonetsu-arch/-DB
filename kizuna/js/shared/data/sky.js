// 空の 旅（第2章クリアの あと）と 移動の 呪文ルーラ の データ
// ・風の大鳥フウラ: カモメ港の 風のさいだんで「風の笛」を もらうと、フィールドで 呼べる（world/travel.js）
// ・ルーラ: 魔法使い・賢者が 覚える。行った ことの ある 町へ 仲間と いっしょに 飛ぶ（洞窟や 塔の 中では 使えない）
// ・第3章: シロガネ地方（北）へも 飛べる。星の竜アステルが 目覚めると（c3_dragon）竜に のって もっと はやく 飛べる
import { OW_W, OW_H } from '../maps/overworld.js?v=e28f090d0ad9';
import { SEA_W, SEA_H, PORT, SEA_POS } from '../maps/sea.js?v=e28f090d0ad9';
import { NORTH_W, NORTH_H, NORTH_LANDING, NORTH_ARRIVE } from '../maps/north.js?v=e28f090d0ad9';
import { SOUTH_W, SOUTH_H, SOUTH_LANDING, SOUTH_ARRIVE, SOUTH_SKY_ZAID } from '../maps/south.js?v=e28f090d0ad9';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);

export const SKY_BIRD = { name: 'フウラ', title: '風の大鳥' };
// 星の竜（第3章の さいご。c3_dragon）
export const SKY_DRAGON = { name: 'アステル', title: '星の竜' };
export const DRAGON_FLAG = 'c3_dragon';
// のりもの（竜が 目覚めたら 竜）
export function mountOf(flags) {
  return flags?.[DRAGON_FLAG] ? { ...SKY_DRAGON, btn: '竜' } : { ...SKY_BIRD, btn: '大鳥' };
}
// 空を とぶ はやさ（歩く はやさの この ばい。竜は 大鳥より すこし はやい）
export const FLY_MULT = 1.9;
export const DRAGON_FLY_MULT = 2.35;
export function flySpeed(flags) {
  return flags?.[DRAGON_FLAG] ? DRAGON_FLY_MULT : FLY_MULT;
}
// 笛を もらった しるし
export const SKY_FLAG = 'sky_flute';
export const FLUTE_ID = 'wind_flute';
// リーダーが 大鳥に 乗った とき、なかまに「いっしょに 乗る？」と きいて まつ じかん（ミリびょう。world/travel.js）
export const RIDE_ASK_MS = 60000;

export const SKY_ITEMS = {
  wind_flute: {
    name: '風の笛', type: 'key', flute: true,
    desc: '風の守り星の力がこもった笛。ふくと風の大鳥フウラ（星の竜が目覚めたあとは竜）が来て、空を飛べる。町の外で使う。',
  },
};
export const SKY_ITEM_KANA = {
  wind_flute: 'かぜのふえ',
};

// ───── 目標 ─────
export const SKY_HINT_OBJECTIVE = '風の守り星（カモメ港の風のさいだん）に、もう一度話しかけよう';
export const SKY_OBJECTIVE = '風の笛で大鳥フウラを呼んで、空の旅に出よう（続きはアップデートで！）';
// 第3章の 入り口（笛を もらった あと。story-ch3.js）
export const C3_LEAD_OBJECTIVE = '守り星の石が光っている…！ホシフル村のホシミばあちゃんに会いに行こう';
// 第4章の 入り口（第3章クリアの あと。story-ch4.js）
export const C4_LEAD_OBJECTIVE = '竜守りの村の長老ハクゲンに、もう一度話しかけてみよう';
export const SKY_OBJECTIVE_TARGETS = {
  [SKY_HINT_OBJECTIVE]: [{ npc: 'wind_star' }],
};

// ───── 空を とべる マップ（地方）と、となりの 地方 ─────
// edges: マップの はし（north/south）を こえると 行く 地方
// need: その 地方へ 行ける ように なる フラグ（世界の フラグ）
// box: 空を とべる 場所（{ x, y, w, h, until }）。until の フラグが たつまで、この 中だけ とべる
//      ならべて 書くと だんだん 広がる（さいしょの until が たつと つぎの box。ぜんぶ たつと どこでも）
//      シロガネ地方は 星の竜が 目覚めるまで ふぶきが はげしく、南の 雪原の 上しか とべない
//      コガネ地方（第4章）は 砂嵐が はげしく、北の海辺の 上しか とべない。大臣ザイードを たおすと（Step 5）王都・ドゥナの 近くまで、
//      モルガナを たおすと（Step 7）どこでも
// storm: とべない わけ（ことば）/ boxHint: よべる 場所（box ごとに hint が あれば そちら）/ lockedHint: まだ 行けない ときの ヒント（hint の フラグが ある 人だけ）
export const SKY_MAPS = {
  overworld: { name: 'ミドリナ地方', short: 'ミドリナ', edges: { south: 'sea', north: 'north' } },
  sea: { name: '風の海', short: '風の海', edges: { north: 'overworld', south: 'south' } },
  north: {
    name: 'シロガネ地方', short: 'シロガネ', edges: { south: 'overworld' }, need: 'c3_start', box: { ...NORTH_LANDING, until: DRAGON_FLAG },
    storm: 'ふぶき', boxHint: '南の雪原の広場', lockedHint: { flag: 'c2_clear', text: 'ホシフル村のホシミばあちゃんに、話を聞いてみよう' },
  },
  south: {
    name: 'コガネ地方', short: 'コガネ', edges: { north: 'sea' }, need: 'c4_start',
    box: [{ ...SOUTH_LANDING, until: 'c4_zaid', hint: '北の海辺' }, { ...SOUTH_SKY_ZAID, until: 'c4_morgana', hint: '王都サファラや北の海辺のあたり' }],
    storm: '砂嵐', boxHint: '北の海辺', lockedHint: { flag: 'c3_clear', text: '竜守りの村の長老ハクゲンに、話を聞いてみよう' },
  },
};
// 「別の地方へ飛ぶ」の じゅんばん（さいしょが ボタンの 行き先）
const REGION_ORDER = {
  overworld: ['sea', 'north', 'south'], sea: ['overworld', 'north', 'south'], north: ['overworld', 'sea', 'south'], south: ['sea', 'overworld', 'north'],
};
// 「別の地方へ飛ぶ」で 着く ところ（さんばしの 上の 空・雪原の 上の 空・北の海辺の 上の 空）
const ARRIVE = {
  sea: { x: SEA_POS.homePier.x + 1, y: 2.5, dir: 'down' },
  overworld: { x: 28, y: OW_H - 4.5, dir: 'up' },
  north: { ...NORTH_ARRIVE, dir: 'up' },
  south: { ...SOUTH_ARRIVE, dir: 'down' },
};
const SIZE = { overworld: [OW_W, OW_H], sea: [SEA_W, SEA_H], north: [NORTH_W, NORTH_H], south: [SOUTH_W, SOUTH_H] };

const okFlag = (hasFlag, f) => !f || (typeof hasFlag === 'function' ? hasFlag(f) : !!hasFlag?.[f]);

// その 地方へ 行けるか（hasFlag: フラグを しらべる かんすう か フラグの 表）
export function regionOpen(mapId, hasFlag) {
  const r = SKY_MAPS[mapId];
  return !!r && okFlag(hasFlag, r.need);
}

// 「別の地方へ飛ぶ」で 行ける 地方（行ける ように なった ものだけ）
export function regionsFrom(mapId, hasFlag) {
  return (REGION_ORDER[mapId] || []).filter((id) => id !== mapId && regionOpen(id, hasFlag));
}

// 空を とべる 場所（とべる ところ 全部なら null）。box が ならんで いる ときは、until が まだ たって いない さいしょの もの
export function skyBox(mapId, hasFlag) {
  const b = SKY_MAPS[mapId]?.box;
  if (!b) return null;
  return (Array.isArray(b) ? b : [b]).find((x) => !okFlag(hasFlag, x.until)) || null;
}
export function inSkyBox(box, x, y) {
  return !box || (x >= box.x && y >= box.y && x < box.x + box.w && y < box.y + box.h);
}
export function clampSkyBox(box, x, y) {
  if (!box) return { x, y };
  return { x: Math.max(box.x + 0.4, Math.min(box.x + box.w - 0.4, x)), y: Math.max(box.y + 0.6, Math.min(box.y + box.h - 0.3, y)) };
}

// はしに いるか（その 地方の はしを こえようと している）: 'north' / 'south' / null
export function edgeAt(mapId, y, h) {
  const r = SKY_MAPS[mapId];
  if (!r) return null;
  if (r.edges.south && y >= h - 1.6) return 'south';
  if (r.edges.north && y <= 1.6) return 'north';
  return null;
}
// むかしの よびかた（はしに いるか）
export function atEdge(mapId, y, h) {
  return !!edgeAt(mapId, y, h);
}
// はしを こえた 先の 地方（まだ 行けなければ null）
export function edgeTarget(mapId, edge, hasFlag) {
  const to = SKY_MAPS[mapId]?.edges?.[edge];
  return to && regionOpen(to, hasFlag) ? to : null;
}

// まだ 行けない 地方の はしで 出す ことば（ヒントは その 章の 入り口まで 来た 人だけ）
export function edgeLockedText(mapId, edge, hasFlag) {
  const r = SKY_MAPS[SKY_MAPS[mapId]?.edges?.[edge]];
  const storm = r?.storm || 'ふぶき';
  const hint = r?.lockedHint && okFlag(hasFlag, r.lockedHint.flag) ? `\n（${r.lockedHint.text}）` : '';
  return `この先の空は、はげしい${storm}で進めない…${hint}`;
}

// とべる 場所の 外で 笛を ふいた ときの ことば（box … 今 とべる 場所。hint が あれば その 場所を 言う）
export function boxLockedText(mapId, flute, mountName, box = null) {
  const r = SKY_MAPS[mapId];
  return `${flute}をふいた！\nしかし、はげしい${r?.storm || 'ふぶき'}で${mountName}はここまでおりてこられない…\n（${box?.hint || r?.boxHint || '南の雪原の広場'}でふこう）`;
}

// ホシフル村の さんばし（x=27.5）と 風の海の さんばし（x=10.5）が そろうように よこの いちを かえる
const PIER_OW = 27.5, PIER_SEA = SEA_POS.homePier.x + 0.5;
function owToSeaX(x) {
  return x <= PIER_OW ? (x / PIER_OW) * PIER_SEA : PIER_SEA + ((x - PIER_OW) / (OW_W - PIER_OW)) * (SEA_W - PIER_SEA);
}
function seaToOwX(x) {
  return x <= PIER_SEA ? (x / PIER_SEA) * PIER_OW : PIER_OW + ((x - PIER_SEA) / (SEA_W - PIER_SEA)) * (OW_W - PIER_OW);
}
// よこの いちを となりの 地方に うつす
function mapX(from, to, x) {
  if (from === 'overworld' && to === 'sea') return owToSeaX(x);
  if (from === 'sea' && to === 'overworld') return seaToOwX(x);
  return (x / SIZE[from][0]) * SIZE[to][0];
}

// となりの 地方へ（edge: こえた はし 'north'/'south'（true は むかしの よびかた）/ ないときは「別の地方へ飛ぶ」）
// to: 行き先（「別の地方へ飛ぶ」で えらんだ 地方。ないときは さいしょの 地方）
// hasFlag: 世界の フラグ（行き先の 空の box）
export function regionHop(mapId, x, y, edge = null, to = null, hasFlag = null) {
  const r = SKY_MAPS[mapId];
  if (!r) return null;
  if (edge === true) edge = edgeAt(mapId, y, SIZE[mapId][1]);
  if (!edge) {
    const dest = to || (REGION_ORDER[mapId] || [])[0];
    if (!dest || dest === mapId || !SKY_MAPS[dest]) return null;
    return { map: dest, ...ARRIVE[dest] };
  }
  const dest = r.edges[edge];
  if (!dest) return null;
  const [w, h] = SIZE[dest];
  const nx = Math.max(0.5, Math.min(w - 0.5, mapX(mapId, dest, x)));
  // 北へ こえたら 行き先の 南の はし、南へ こえたら 北の はし
  const ny = edge === 'north' ? h - 1.2 : 1.2;
  const p = clampSkyBox(skyBox(dest, hasFlag || (() => false)), nx, ny);
  return { map: dest, x: p.x, y: p.y, dir: edge === 'north' ? 'up' : 'down' };
}

export { SEA_H };

// ───── ルーラ ─────
export const TRAVEL_ABILITIES = {
  rura: {
    name: 'ルーラ', kana: 'るーら', kind: 'spell', job: 'mage', mp: 2, target: 'self', field: true, fieldOnly: true, hidden: true,
    effect: { type: 'warp' },
    desc: '一度行った町や村へ、仲間といっしょに飛んでいける移動の呪文。洞窟や塔の中では使えない。',
    cast: '{a}はルーラを唱えた！\nしかし、戦いの中では使えない！', anim: 'none',
  },
};

// ───── だいほん ─────
// 風のさいだん（story-ch2.js の wind_altar）に 笛の イベントを たす
export function skyScripts(base) {
  const altar = base.wind_altar;
  return {
    wind_altar: (x) => {
      if (x.flag('c2_clear') && !x.flag(SKY_FLAG)) return fluteEvent();
      const steps = altar(x);
      // 第2章クリアの だいほんの さいごに「もう一度 話しかけよう」
      if (!x.flag('c2_clear') && x.flag('c2_boss')) {
        return [...steps, ...N('……', '風の守り星が、まだ何か伝えたそうに光っている…'), ['objective', SKY_HINT_OBJECTIVE]];
      }
      return steps;
    },
  };
}

function fluteEvent() {
  const bx = PORT.x + 25.5, by = PORT.y + 0.5;
  return [
    ...N('風の守り星が、やさしく光った…'),
    ...S('風の守り星', '紋章の子らよ…嵐をしずめてくれて、ありがとう。',
      'お礼に、わたしの風の力を、この笛にこめました。',
      '笛をふけば、風の大鳥フウラが、あなたたちを乗せて空をかけるでしょう。'),
    ['sfx', 'sparkle'], ['flash'],
    ['item', FLUTE_ID, 1],
    ['flag', SKY_FLAG],
    ['actor', 'fuura', { sprite: 'sky_bird', x: bx, y: by, dir: 'left' }],
    ['move', 'fuura', [[PORT.x + 19.5, PORT.y + 3.8]]],
    ...S('風の守り星', 'この鳥がフウラ。風の島にすむ、やさしい大鳥です。',
      '空からなら、山も海もこえていけます。\nミドリナ地方へも、この風の海へも…。'),
    ['move', 'fuura', [[PORT.x + 8.5, PORT.y + 1.5], [PORT.x - 6, PORT.y - 6]]],
    ['remove', 'fuura'],
    ...N('（道具の「風の笛」か、画面の「大鳥」ボタンで、フウラを呼べる。\n町の外で使おう。空の上ではAボタンか「降りる」で降りる）'),
    // 第3章へ（ホシフル村の 守り星の石が 光りだす。story-ch3.js）
    ...N('……', 'そのころ、遠いホシフル村で、守り星の石がかすかに光り始めていた――'),
    ['objective', C3_LEAD_OBJECTIVE],
  ];
}

// むかしの セーブ: もう 第2章を クリアしていて 笛を まだ もらっていない 人には 目標で 知らせる
// 笛を もらって「続きはアップデートで！」の ままの 人は、第3章の 入り口（ホシミばあちゃん）へ
export function migrateSky(c) {
  if (!c?.flags?.c2_clear) return;
  if (!c.flags[SKY_FLAG]) {
    if (/続きはアップデート/.test(c.objective || '')) c.objective = SKY_HINT_OBJECTIVE;
    return;
  }
  if (!c.flags.c3_start && (/続きはアップデート/.test(c.objective || '') || !c.objective)) c.objective = C3_LEAD_OBJECTIVE;
}
