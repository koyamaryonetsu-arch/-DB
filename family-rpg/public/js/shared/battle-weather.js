// 第51回 C3: 戦いの 天気（天候の神。W 班の 天気の 技〈weather: 'sun'|'rain'|'thunder'〉も これを 使って よい）
//
// ・天気は 戦いに 1つだけ（battle.weather = { kind, side, left, by }）。かけた 側（side）の 味方に なる
//   up の 属性  … かけた 側が 使うと ×WEATHER_UP（1.3）、相手の 側が 使うと ×WEATHER_DOWN（0.7）
//   down の 属性 … 相手の 側が 使うと ×WEATHER_DOWN（かけた 側は かわらない）
//   heal        … かけた 側の 回復が この 倍率（雨）
//   → 天気を かえると（相手の 天気を うばうと）、味方と 敵の 属性の 強さが 入れかわる
// ・のこり（left）は かけた 側の 行動の 回数。かけた 側の だれかが 行動する たびに 1 へる（weatherTick）。0 で 元の 空に もどる
// ・使いかた（ほかの ファイルから）:
//     setWeather(battle, 'sun', 12, 'ally', c.id)  … 天気を かえる（もどりち: 天気。しらない kind は null）
//     weatherMult(battle, 'ally', 'fire')          … その 側の その 属性（'heal' は 回復）の 倍率（天気が なければ 1）
//     WEATHER_KINDS                                 … 天気の 表
// ・技の 効果（applyAbility の 中から weatherEffect）:
//     { type: 'weather', kind: 'sun'|'rain'|'thunder', turns }  … 天気を かえる（target は self か allies）
//     { type: 'weatherStrike', base, thr, turns, first }         … 天候反転: 相手の 天気なら うばう・ちがえば 晴れ→雨→かみなり→晴れ の つぎ。
//                                                                   その 天気の いちばんの 属性（炎・水・雷）で 敵に 魔力の ダメージ
// サーバーでも ブラウザでも 使う（canvas・DOM なし）

export const WEATHER_UP = 1.3;
export const WEATHER_DOWN = 0.7;
// かけた 側の 行動の 回数（turns を 書かない とき）
export const WEATHER_TURNS = 10;
export const WEATHER_KINDS = {
  sun: { name: '晴れ', up: ['fire', 'light'], down: ['water', 'ice'], line: '空が、からりと晴れわたった！' },
  rain: { name: '雨', up: ['water'], down: ['fire'], heal: 1.25, line: '空が雲におおわれ、ざあざあと雨がふりだした！' },
  thunder: { name: 'かみなり', up: ['bolt', 'wind'], down: [], line: '空に黒い雲がうずまき、ゴロゴロとかみなりが鳴りだした！' },
};
// 天候反転の じゅん
export const WEATHER_CYCLE = ['sun', 'rain', 'thunder'];
const EL_NAMES = { fire: '炎', ice: '氷', water: '水', wind: '風', blast: '爆発', bolt: '雷', light: '光', dark: '闇' };
const SIDE_NAMES = { ally: '味方', enemy: '敵' };
const other = (side) => (side === 'enemy' ? 'ally' : 'enemy');

// 天気を かえる。turns … かけた 側の 行動の 回数
export function setWeather(battle, kind, turns = WEATHER_TURNS, side = 'ally', by = null) {
  if (!battle || !WEATHER_KINDS[kind]) return null;
  const left = Math.max(1, Math.round(Number.isFinite(turns) ? turns : WEATHER_TURNS));
  battle.weather = { kind, side: side === 'enemy' ? 'enemy' : 'ally', left, by };
  return battle.weather;
}

export function clearWeather(battle) {
  if (battle) battle.weather = null;
}

// その 側（'ally'|'enemy'）の その 属性（'heal' … 回復）の 倍率
export function weatherMult(battle, side, element) {
  const w = battle?.weather;
  if (!w || !element || element === 'phys') return 1;
  const k = WEATHER_KINDS[w.kind];
  if (!k) return 1;
  const mine = side === w.side;
  if (element === 'heal') return mine && k.heal ? k.heal : 1;
  if (k.up.includes(element)) return mine ? WEATHER_UP : WEATHER_DOWN;
  if (k.down.includes(element)) return mine ? 1 : WEATHER_DOWN;
  return 1;
}

// クライアントに 見せる 天気（ない ときは null）
export function weatherSnap(battle) {
  const w = battle?.weather;
  return w ? { kind: w.kind, side: w.side, left: w.left } : null;
}

// 天気が かわった ときの ことば（[空の ようす, 強さの 説明]）
export function weatherLines(kind, side) {
  const k = WEATHER_KINDS[kind];
  if (!k) return [];
  const own = SIDE_NAMES[side] || '味方', opp = SIDE_NAMES[other(side)];
  const names = (list) => list.map((el) => EL_NAMES[el] || el).join('と');
  const weak = [...k.up, ...k.down];
  const out = [k.line, `${own}の${names(k.up)}の力が強くなり、${opp}の${names(weak)}の力が弱くなった！`];
  if (k.heal) out.push(`${own}の回復の力も上がった！`);
  return out;
}

// 行動の はじめ: かけた 側の 行動で のこりを 1 へらす
export function weatherTick(battle, c, ev) {
  const w = battle?.weather;
  if (!w || !c || c.side !== w.side) return;
  w.left--;
  if (w.left > 0) return;
  battle.weather = null;
  ev?.lines?.push(`${WEATHER_KINDS[w.kind]?.name || '天気'}がおさまり、空が元にもどった。`);
  if (ev) ev.weather = null;
}

// ダメージに 天気の 倍率（使った 人の 側・属性）
export function weatherDamage(battle, c, t, dmg, info = {}) {
  if (!(dmg > 0) || !c) return dmg;
  const m = weatherMult(battle, c.side, info.element);
  return m === 1 ? dmg : Math.max(1, Math.round(dmg * m));
}

// 天気を かえて ことばを 出す
function changeWeather(b, c, kind, turns, ev) {
  const w = b.weather;
  if (w && w.kind === kind && w.side === c.side) {
    w.left = Math.max(w.left, Math.round(turns ?? WEATHER_TURNS));
    ev.lines.push(`${WEATHER_KINDS[kind].name}の天気が、もっと長く続くようになった！`);
  } else {
    setWeather(b, kind, turns ?? WEATHER_TURNS, c.side, c.id);
    ev.lines.push(...weatherLines(kind, c.side));
  }
  ev.weather = weatherSnap(b);
}

// 天候反転の つぎの 天気（相手の 天気は うばう）
export function nextWeather(b, c, first = 'thunder') {
  const w = b?.weather;
  if (!w) return first;
  if (w.side !== c.side) return w.kind;
  return WEATHER_CYCLE[(WEATHER_CYCLE.indexOf(w.kind) + 1) % WEATHER_CYCLE.length];
}

// 技の 効果（battle.js の applyAbility の さいご。わからない type は false）
export function weatherEffect(b, c, a, eff, ev, targets = [], powMult = 1) {
  switch (eff.type) {
    case 'weather': {
      if (!WEATHER_KINDS[eff.kind]) return true;
      changeWeather(b, c, eff.kind, eff.turns, ev);
      return true;
    }
    case 'weatherStrike': {
      const stolen = b.weather && b.weather.side !== c.side;
      const kind = nextWeather(b, c, eff.first);
      if (stolen) ev.lines.push(`${SIDE_NAMES[other(c.side)]}の${WEATHER_KINDS[kind].name}を、${c.name}がうばいとった！`);
      changeWeather(b, c, kind, eff.turns, ev);
      const element = WEATHER_KINDS[kind].up[0];
      for (const t of targets) if (t.alive) b.magicHit(c, t, { ...eff, type: 'magic', element }, ev, powMult);
      b.afterDamage(c, ev, element);
      if (ev.fx) ev.fx.element = element;
      return true;
    }
    default: return false;
  }
}
