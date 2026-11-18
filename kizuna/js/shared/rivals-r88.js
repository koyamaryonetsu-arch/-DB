// 第88回 G3班: まぼろしの回ろうの きまり（持ち物で とびらが 開くか・とびらの まどの 中み・冒険のしおり）
//   データは data/rivals-r88.js。サーバー（world/rivals-r88.js）・冒険のしおり（world/shiori.js）・画面（client/ui/rivals-r88.js）が 使う
//   持ち物の 数え方は G1 の そろいの own と おなじ（shared/gear-r88.js の ownedIds: ふくろ・預かり所・装備。同じ 品は 1つ）
import { ITEMS } from './data/items.js?v=a31118b071f7';
import { ownedIds } from './gear-r88.js?v=a31118b071f7';
import { workName } from './data/works.js?v=a31118b071f7';
import { RIVAL_DOORS, DOOR_NEED, rivalsOf, rivalWon, rivalOpen, rivalMembers, doorOf, doorFlag, doorWorks } from './data/rivals-r88.js?v=a31118b071f7';
import { rivalToday, dailyRivalOf, weekdayOf, WEEKDAY_NAMES } from './data/rivals-r88.js?v=a31118b071f7'; // G16班: 曜日で かわる ジムリーダー
import { GEAR_SETS } from './data/gear-sets.js?v=a31118b071f7'; // G15班: 竜王のひ孫の じょうけん（ロトの装備 5つ）

export const HALL_NAME = 'まぼろしの回ろう';

// その 作品の 品を いくつ 持って いるか（G11班: 2作品を まとめた とびら〈コナン・快と〉は 2作品の 合計）
export function workOwned(c, work) {
  const ws = doorWorks(work);
  let n = 0;
  for (const id of ownedIds(c)) if (ws.includes(ITEMS[id]?.work)) n++;
  return n;
}
// G11班: とびらの 名前（まとめた とびらは その 名前。ふつうは 作品の 名前）
export const doorName = (work) => doorOf(work)?.name || workName(work);
export const doorOpen = (c, work) => workOwned(c, work) >= DOOR_NEED;
// あと いくつで 開くか（開いて いれば 0）
export const doorLeft = (c, work) => Math.max(0, DOOR_NEED - workOwned(c, work));

// とびらの 光る しるしを 持ち物に 合わせる（回廊へ 入る 時・とびらを 調べた 時）。かわったら true
export function refreshDoorFlags(c) {
  if (!c || c.species) return false;
  c.flags = c.flags && typeof c.flags === 'object' ? c.flags : {};
  let changed = false;
  for (const d of RIVAL_DOORS) {
    const f = doorFlag(d.work);
    const open = doorOpen(c, d.work);
    if (open && !c.flags[f]) {
      c.flags[f] = true;
      changed = true;
    } else if (!open && c.flags[f]) {
      delete c.flags[f];
      changed = true;
    }
  }
  return changed;
}

// 品の 名前（ない 品は 書かない。あとの 係が 足す 品）
const itemName = (id) => ITEMS[id]?.name || '';
export const rewardIds = (rv) => (rv?.reward || []).filter((id) => ITEMS[id]);
// G6班: ごほうびの うち、まだ 持って いない 品（勝つと もらえる。持って いる 品は お金）
export function missingRewards(c, rv) {
  const own = ownedIds(c);
  return rewardIds(rv).filter((id) => !own.has(id));
}

// とびらを 調べた 時の まど（client/ui/rivals-r88.js の rivalPop）
//   { kind: 'rival', work, workName, mark, own, need, rivals: [{ id, name, members, lv, state: 'won' | 'next' | 'open' | 'lock', use, rewards: [{ id, name }], words }], ask }
//   state … won: 勝った（何回でも ちょうせん できる）/ next: つぎの 相手 / lock: 前の 人に 勝つと ちょうせん できる
//   miss … G6班: 勝った 人の ごほうびで、まだ 持って いない 品の 名前（あとから 足した 太極図の巻物 など。もう一度 勝つと もらえる）
//   G16班: 曜日の ライバル（ジムリーダー）は その 日の 1人だけ 出す。notes … とびらの 上の 行（今日の ジムリーダー・持って いる バッジ）
export function rivalPaper(c, work, now = Date.now()) {
  const d = doorOf(work);
  const list = rivalsOf(work).filter((rv) => rivalToday(rv, now)).map((rv) => {
    const won = rivalWon(c, rv.id);
    // G15班: じょうけんの ある ライバル（竜王のひ孫）は、前の 人に 勝って いても、じょうけんが たりなければ 'need'
    const state = won ? 'won' : !rivalOpen(c, rv.id) ? 'lock' : rivalNeedLack(c, rv) ? 'need' : 'next';
    return {
      id: rv.id, name: rv.name, lv: rv.lv, state, members: rivalMembers(rv).length > 1 ? rivalMembers(rv).map((m) => m.name) : null,
      use: itemName(rv.use), rewards: rewardIds(rv).map((id) => ({ id, name: itemName(id) })),
      words: state === 'lock' ? '' : rv.words,
      miss: won ? missingRewards(c, rv).map(itemName) : [],
      need: rivalNeedText(c, rv),
    };
  });
  return {
    kind: 'rival', work, workName: doorName(work), goodsName: doorGoods(work), mark: d?.mark || '', own: workOwned(c, work), need: DOOR_NEED,
    rivals: list, ask: list.some((r) => r.state === 'next') ? 'だれにちょうせんする？' : 'もう一度、戦う？',
    notes: dailyNotes(c, work, now), // G16班
  };
}
// まどの ボタン（ちょうせん できる 人。つぎの 人が 先・やめる が さいご）。もどりち: [{ id, label }]
export function rivalButtons(paper) {
  const can = paper.rivals.filter((r) => r.state !== 'lock' && r.state !== 'need'); // G15班: じょうけんが たりない 人は ボタンを 出さない
  can.sort((a, b) => (a.state === 'next' ? -1 : 0) - (b.state === 'next' ? -1 : 0));
  return can.map((r) => ({ id: r.id, label: `${r.name}と戦う` }));
}

// ───────────── 冒険のしおり（world/shiori.js の TRACKS）─────────────
//   作品の 品を 1つでも 持って いるか、回廊を 知って いる（番人に 聞いた・勝った）人だけ。開いて いない とびらも 数に 入れる
export function rivalTrack(c) {
  const known = !!(c?.flags?.r88hall_seen || (c?.rivals && Object.keys(c.rivals).length) || RIVAL_DOORS.some((d) => workOwned(c, d.work) > 0));
  if (!known || c?.species) return null;
  const items = RIVAL_DOORS.map((d) => {
    const all = rivalsOf(d.work);
    const won = all.filter((r) => rivalWon(c, r.id)).length;
    const left = doorLeft(c, d.work);
    const state = won >= all.length ? 'done' : left ? 'wait' : 'open';
    return { name: `${doorName(d.work)}のとびら`, where: left ? `品をあと${left}つ集めると開く` : '', state, right: `${won}/${all.length}人` };
  });
  return {
    id: 'rival', name: HALL_NAME, now: items.reduce((s, x) => s + Number(x.right.split('/')[0]), 0),
    total: RIVAL_DOORS.reduce((s, d) => s + rivalsOf(d.work).length, 0), unit: '人',
    where: 'ルミナの町の星の神殿（試練の番人のとなりの階段）',
    note: `星の神殿に、まぼろしの回ろうがある。\n作品の品を${DOOR_NEED}つ集めると、その作品のとびらが開く。\nライバルのまぼろしに勝つと、その人の品がもらえる。`,
    items,
  };
}
// おすすめ（ちょうせん できる 人が いる とびら。なければ null）
export function rivalRec(c, now = Date.now()) {
  for (const d of RIVAL_DOORS) {
    if (!doorOpen(c, d.work)) continue;
    // G16班: 曜日の ライバル（ジムリーダー）は その 日の 人・前の 人に 勝って いる 人だけ
    const nx = rivalsOf(d.work).find((r) => !rivalWon(c, r.id) && (r.day === undefined || (rivalToday(r, now) && rivalOpen(c, r.id))));
    if (nx && !rivalNeedLack(c, nx)) return { text: `まぼろしの回ろうで、${doorName(d.work)}の${nx.name}にちょうせんできます`, where: 'ルミナの町の星の神殿' };
  }
  // G6班: 勝った 人の ごほうびに、あとから 品が 足された（太極図の巻物）。もう一度 勝つと もらえる
  for (const d of RIVAL_DOORS) {
    if (!doorOpen(c, d.work)) continue;
    for (const r of rivalsOf(d.work)) {
      const add = rivalWon(c, r.id) ? (r.added || []).filter((id) => missingRewards(c, r).includes(id)) : [];
      if (add.length) return { text: `まぼろしの回ろうで、${r.name}にもう一度勝つと、${add.map(itemName).join('と')}がもらえます`, where: 'ルミナの町の星の神殿' };
    }
  }
  return null;
}

// ───────────── G15班: とびらの 品の 名前・ライバルごとの じょうけん ─────────────
// とびらの 品の 名前（大魔王の城の とびらは「ダイの大冒険の品」。ふつうは とびらの 名前）
export const doorGoods = (work) => doorOf(work)?.goods || doorName(work);
// ライバルごとの じょうけん（rv.needSet: { set, n, text }。その 組の 品を n こ 持って いる）。たりない 時は のこりの 数・ある 時は 0
export function rivalNeedLack(c, rv) {
  const ns = rv?.needSet;
  if (!ns) return 0;
  const own = ownedIds(c);
  const have = (GEAR_SETS[ns.set]?.items || []).filter((id) => own.has(id)).length;
  return Math.max(0, (ns.n || 0) - have);
}
// とびらの まどの じょうけんの 行（ない 人は ''）
export function rivalNeedText(c, rv) {
  const ns = rv?.needSet;
  if (!ns) return '';
  const n = ns.n || 0;
  const have = n - rivalNeedLack(c, rv);
  return `${ns.text || `${GEAR_SETS[ns.set]?.name || ''}を${n}つそろえると、ちょうせんできる`}（今は${have}/${n}）`;
}
// ちょうせん できるか（前の 人に 勝って いて、じょうけんも ある）
export const rivalReady = (c, rv, now = Date.now()) => !!rv && rivalOpen(c, rv.id) && !rivalNeedLack(c, rv) && rivalToday(rv, now); // G16班: 曜日

// ───────────── G16班: 曜日で かわる ライバル（ポケモンの ジムリーダー）─────────────
// とびらの まどの 上の 行（とびらの daily: { group, label, set }。ない とびらは []）
//   「今日のジムリーダー：マチス（水曜日）」・「持っているジムバッジ：グレー・ブルー（2/8）」
export function dailyNotes(c, work, now = Date.now()) {
  const dl = doorOf(work)?.daily;
  if (!dl) return [];
  const rv = dailyRivalOf(work, dl.group, now);
  const out = [`今日の${dl.label}：${rv ? rv.name : 'お休み'}（${WEEKDAY_NAMES[weekdayOf(now)]}曜日）`];
  const set = GEAR_SETS[dl.set];
  if (set) {
    const own = ownedIds(c);
    const have = set.items.filter((id) => own.has(id));
    out.push(`持っている${set.name}：${have.length ? have.map(itemName).join('・') : 'まだない'}（${have.length}/${set.items.length}）`);
  }
  return out;
}
