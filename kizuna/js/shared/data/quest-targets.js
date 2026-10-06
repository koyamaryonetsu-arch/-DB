// 目標の 行き先（地図に 色を つける）
// ・メインの 目標は objective の 文から 行き先を きめる（前の セーブでも そのまま 使える）
// ・たのまれごとは 報告する 人（と さがす 物）
// 行き先の 書き方: { npc: 'NPCのID' }（その 人の いる 場所）か { map, x, y }
//   unless: 'フラグ' … その フラグが もう ある 人には 出さない（もう 話を 聞いた 人など。ぜんぶ 消えたら そのまま 出す）
// 新しい 目標を 作ったら、ここにも 行き先を 足す
import { MAPS } from '../maps/index.js?v=d2b7bf220f08';
import { SKY_OBJECTIVE_TARGETS, C3_LEAD_OBJECTIVE } from './sky.js?v=d2b7bf220f08';
import { CH3_OBJECTIVE_TARGETS, ch3SubQuests } from './story-ch3.js?v=d2b7bf220f08';
import { CH4_OBJECTIVE_TARGETS } from './story-ch4.js?v=d2b7bf220f08';

export const OBJECTIVE_TARGETS = {
  'ホシミばあちゃんの家（村の南東）へ行こう': [{ npc: 'elder' }],
  '星見の丘（村の東門の先）で星の花をつもう': [{ npc: 'star_flower' }],
  '村にもどってホシミばあちゃんに星の花をわたそう': [{ npc: 'elder' }],
  '北のルミナの町へ行き、町長に会おう': [{ npc: 'mayor' }],
  '町長の家（町の北西の建物）を訪ねよう': [{ npc: 'mayor' }],
  '大工のガンテツ（町の南東の家）に会おう': [{ npc: 'carpenter' }],
  '橋をわたって、東の「なげきの洞窟」へ向かおう': [{ map: 'overworld', x: 153, y: 50 }],
  'ささやきの森（町の東）のおくでせいれいの木を手に入れよう': [{ npc: 'treant' }],
  'ルミナの町の大工ガンテツにせいれいの木を届けよう': [{ npc: 'carpenter' }],
  '洞窟のおくへ進もう（地下2階にカギがあるらしい）': [{ map: 'cave_b2', x: 6, y: 26 }],
  'カギで、おくのとびらを開けよう': [{ npc: 'locked_door' }],
  'おくの部屋へ進もう（泉で回復してから行こう）': [{ npc: 'boss_rock' }],
  '守り星の石をホシフル村のホシミばあちゃんに届けよう（おくの宝箱も忘れずに）': [{ npc: 'elder' }],
  '第1章クリア！ホシミばあちゃんに話しかけると、第2章が始まるよ': [{ npc: 'elder' }],
  '村の南のさんばしで、船長さんに会おう': [{ npc: 'captain_pier' }],
  'さんばしの先の、しおかぜ号に話しかけて出航しよう。\nカモメ港は南西の「風の島」': [{ npc: 'ship' }],
  '港長の家（町のまん中の下）で、話を聞こう': [{ npc: 'harbor_master' }],
  '南の小島の「海鳴りの洞窟」で、光の玉を取りもどそう': [{ map: 'sea', x: 18, y: 61 }, { npc: 'squid_boss' }],
  '東の「灯台島」へ行って、灯台守に光の玉をわたそう': [{ npc: 'lh_keeper' }],
  '光の道（嵐の島の北がわ）から嵐の島へわたり、塔をのぼろう': [{ npc: 'storm_tower' }],
  '嵐の塔のてっぺんへのぼり、嵐の将軍をたおそう': [{ npc: 'storm_general_npc' }],
  '風の守り星を、カモメ港の北の「風のさいだん」にもどそう': [{ map: 'sea', x: 24, y: 29 }],
};
// 風の笛（sky.js）
Object.assign(OBJECTIVE_TARGETS, SKY_OBJECTIVE_TARGETS);
// 第3章（story-ch3.js）
OBJECTIVE_TARGETS[C3_LEAD_OBJECTIVE] = [{ npc: 'elder' }];
Object.assign(OBJECTIVE_TARGETS, CH3_OBJECTIVE_TARGETS);
// 第4章（story-ch4.js）
Object.assign(OBJECTIVE_TARGETS, CH4_OBJECTIVE_TARGETS);

// たのまれごと（name … クエストの 名前、who … 報告する 人、ready … もう 報告できる）
export function subQuests(c) {
  const f = (k) => !!c.flags?.[k];
  const has = (id) => (c.items || []).some((e) => e.id === id && e.n > 0) || (c.keyItems || []).includes(id);
  const out = [];
  if (f('q_mike_start') && !f('q_mike_done')) {
    if (f('q_mike_found')) out.push({ name: '迷子のねこミケ', who: 'mike_girl', ready: true, text: 'リリに報告しよう' });
    else out.push({ name: '迷子のねこミケ', who: 'mike_girl', find: 'mike', ready: false, text: '星見の丘で探そう' });
  }
  if (f('q_jelly_start') && !f('q_jelly_done')) {
    const n = Math.min(3, (c.items || []).find((i) => i.id === 'jelly')?.n || 0);
    out.push({ name: 'コックの特製ゼリー', who: 'cook', ready: n >= 3, text: n >= 3 ? '酒場のコックに届けよう' : `ぷるりんゼリー ${n}/3` });
  }
  if (f('q_wolf_start') && !f('q_wolf_done')) {
    const n = Math.max(0, (c.kills?.wolf || 0) - (c.quests?.wolfBase || 0));
    out.push({ name: 'ウルフ退治', who: 'farmer_wolf', ready: n >= 5, text: n >= 5 ? '牧場のおじさんに報告しよう' : `${Math.min(5, n)}/5ひき` });
  }
  if (has('bottle_letter') && !f('q_bottle_done')) out.push({ name: 'びんの手紙', who: 'mina', ready: true, text: 'カモメ港のミナにわたそう' });
  // 夜だけの たのまれごと（night.js）
  if (f('q_ghost_start') && !f('q_ghost_done')) {
    if (has('music_box')) out.push({ name: 'ゆうれいのオルゴール', who: 'night_ghost', ready: true, text: '夜のホシフル村で、ゆうれいの女の子にわたそう' });
    else out.push({ name: 'ゆうれいのオルゴール', who: 'night_ghost', find: 'night_glint', ready: false, text: '夜の星見の丘で探そう' });
  }
  // 第3章（story-ch3.js）
  const count = (id) => (c.items || []).filter((i) => i.id === id).reduce((s, i) => s + (i.n || 0), 0);
  out.push(...ch3SubQuests(c, f, has, count));
  return out;
}

let npcIndex = null;
function npcPos(id) {
  if (!npcIndex) {
    npcIndex = new Map();
    for (const m of Object.values(MAPS)) for (const n of m.npcs || []) if (!npcIndex.has(n.id)) npcIndex.set(n.id, { map: m.id, x: Math.floor(n.x), y: Math.floor(n.y) });
  }
  return npcIndex.get(id) || null;
}

// unless の ついた 行き先を、もう すんだ ぶんだけ はぶく
export function liveTargets(c, specs) {
  const left = specs.filter((s) => !s.unless || !c?.flags?.[s.unless]);
  return left.length ? left : specs;
}

function resolve(spec) {
  if (spec.npc) return npcPos(spec.npc);
  return MAPS[spec.map] ? { map: spec.map, x: spec.x, y: spec.y } : null;
}

// マップの つながり（出入り口・船）
let links = null;
function mapLinks() {
  if (links) return links;
  links = [];
  for (const m of Object.values(MAPS)) for (const w of m.warps || []) if (w.to?.map) links.push({ from: m.id, x: w.x, y: w.y, to: w.to.map });
  // 船: さんばしの しおかぜ号 ⇔ カモメ港の 船長
  const ship = npcPos('ship');
  const cap = npcPos('port_captain');
  if (ship && cap) {
    links.push({ from: ship.map, x: ship.x, y: ship.y, to: cap.map });
    links.push({ from: cap.map, x: cap.x, y: cap.y, to: ship.map });
  }
  return links;
}

// いまの マップから 行き先の マップへ 行く ための 最初の 出口
function firstStep(fromMap, toMap) {
  if (fromMap === toMap) return null;
  const prev = new Map([[fromMap, null]]);
  const q = [fromMap];
  while (q.length) {
    const cur = q.shift();
    if (cur === toMap) break;
    for (const l of mapLinks()) {
      if (l.from !== cur || prev.has(l.to)) continue;
      prev.set(l.to, { map: cur, link: l });
      q.push(l.to);
    }
  }
  if (!prev.has(toMap)) return null;
  let node = toMap;
  let step = null;
  while (prev.get(node)) {
    step = prev.get(node).link;
    node = prev.get(node).map;
  }
  return step ? { x: step.x, y: step.y } : null;
}

// このマップに 出す しるし: kind は 'main'（次の 行き先）/ 'sub'（たのまれごと）/ 'subReady'（報告できる）
// via … 別の マップに ある ときの 出口（とちゅうの 道しるべ）
export function questMarks(c, mapId, objective = c?.objective) {
  const out = [];
  const add = (specs, kind, label) => {
    const spots = specs.map(resolve).filter(Boolean);
    if (!spots.length) return;
    const here = spots.filter((p) => p.map === mapId);
    if (here.length) {
      for (const p of here) out.push({ x: p.x, y: p.y, kind, label, via: false });
      return;
    }
    const step = firstStep(mapId, spots[0].map);
    if (step) out.push({ x: step.x, y: step.y, kind, label, via: true });
  };
  const main = OBJECTIVE_TARGETS[objective || ''];
  if (main) add(liveTargets(c, main), 'main', '次の行き先');
  for (const q of subQuests(c || {})) {
    if (q.find) add([{ npc: q.find }], 'sub', q.name);
    add([{ npc: q.who }], q.ready ? 'subReady' : 'sub', q.name);
  }
  // おなじ 場所は 1つに（メイン → 報告できる → たのまれごと の じゅん）
  const rank = { main: 0, subReady: 1, sub: 2 };
  const seen = new Map();
  for (const m of out) {
    const k = `${m.x},${m.y}`;
    if (!seen.has(k) || rank[m.kind] < rank[seen.get(k).kind]) seen.set(k, m);
  }
  return [...seen.values()];
}

// 目標の 場所の 名前（クエストの 画面に 出す）
export function whereName(spec) {
  const p = resolve(spec);
  const m = p && MAPS[p.map];
  if (!m) return '';
  // 村・町・港・森などの 名前（なければ マップの 名前）
  return m.areaName?.(Math.floor(p.x), Math.floor(p.y)) || m.name || '';
}
