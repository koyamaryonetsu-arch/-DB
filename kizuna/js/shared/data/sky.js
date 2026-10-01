// 空の 旅（第2章クリアの あと）と 移動の 呪文ルーラ の データ
// ・風の大鳥フウラ: カモメ港の 風のさいだんで「風の笛」を もらうと、フィールドで 呼べる（world/travel.js）
// ・ルーラ: 魔法使い・賢者が 覚える。行った ことの ある 町へ 仲間と いっしょに 飛ぶ（洞窟や 塔の 中では 使えない）
import { OW_W, OW_H } from '../maps/overworld.js?v=98d662fd6fa3';
import { SEA_W, SEA_H, PORT, SEA_POS } from '../maps/sea.js?v=98d662fd6fa3';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);

export const SKY_BIRD = { name: 'フウラ', title: '風の大鳥' };
// 笛を もらった しるし
export const SKY_FLAG = 'sky_flute';
export const FLUTE_ID = 'wind_flute';

export const SKY_ITEMS = {
  wind_flute: {
    name: '風の笛', type: 'key', flute: true,
    desc: '風の守り星の力がこもった笛。ふくと風の大鳥フウラが来て、空を飛べる。町の外で使う。',
  },
};
export const SKY_ITEM_KANA = {
  wind_flute: 'かぜのふえ',
};

// ───── 目標 ─────
export const SKY_HINT_OBJECTIVE = '風の守り星（カモメ港の風のさいだん）に、もう一度話しかけよう';
export const SKY_OBJECTIVE = '風の笛で大鳥フウラを呼んで、空の旅に出よう（続きはアップデートで！）';
export const SKY_OBJECTIVE_TARGETS = {
  [SKY_HINT_OBJECTIVE]: [{ npc: 'wind_star' }],
};

// ───── 空を とべる マップと、となりの 地方 ─────
// overworld（ミドリナ地方）の 南の はしを こえると 風の海の 北の はしへ（その ぎゃくも）
export const SKY_MAPS = {
  overworld: { edge: 'south', to: 'sea', name: '風の海', short: '風の海' },
  sea: { edge: 'north', to: 'overworld', name: 'ミドリナ地方', short: 'ミドリナ' },
};
// 「別の地方へ飛ぶ」で 着く ところ（さんばしの 上の 空）
const ARRIVE = {
  sea: { x: SEA_POS.homePier.x + 1, y: 2.5, dir: 'down' },
  overworld: { x: 28, y: OW_H - 4.5, dir: 'up' },
};

// ホシフル村の さんばし（x=27.5）と 風の海の さんばし（x=10.5）が そろうように よこの いちを かえる
const PIER_OW = 27.5, PIER_SEA = SEA_POS.homePier.x + 0.5;
function owToSeaX(x) {
  return x <= PIER_OW ? (x / PIER_OW) * PIER_SEA : PIER_SEA + ((x - PIER_OW) / (OW_W - PIER_OW)) * (SEA_W - PIER_SEA);
}
function seaToOwX(x) {
  return x <= PIER_SEA ? (x / PIER_SEA) * PIER_OW : PIER_OW + ((x - PIER_SEA) / (SEA_W - PIER_SEA)) * (OW_W - PIER_OW);
}

// となりの 地方へ（edge: はしを こえた / そうでなければ さんばしの 上へ）
export function regionHop(mapId, x, y, edge = false) {
  const r = SKY_MAPS[mapId];
  if (!r) return null;
  if (!edge) return { map: r.to, ...ARRIVE[r.to] };
  if (mapId === 'overworld') return { map: 'sea', x: Math.max(0.5, Math.min(SEA_W - 0.5, owToSeaX(x))), y: 1.2, dir: 'down' };
  return { map: 'overworld', x: Math.max(0.5, Math.min(OW_W - 0.5, seaToOwX(x))), y: OW_H - 1.2, dir: 'up' };
}

// はしに いるか（その 地方の はしを こえようと している）
export function atEdge(mapId, y, h) {
  const r = SKY_MAPS[mapId];
  if (!r) return false;
  return r.edge === 'south' ? y >= h - 1.6 : y <= 1.6;
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
    ['objective', SKY_OBJECTIVE],
  ];
}

// むかしの セーブ: もう 第2章を クリアしていて 笛を まだ もらっていない 人には 目標で 知らせる
export function migrateSky(c) {
  if (!c?.flags?.c2_clear || c.flags[SKY_FLAG]) return;
  if (/続きはアップデート/.test(c.objective || '')) c.objective = SKY_HINT_OBJECTIVE;
}
