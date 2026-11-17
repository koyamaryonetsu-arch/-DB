// 第88回 G3班: まぼろしの回ろうの きまり（持ち物で とびらが 開くか・とびらの まどの 中み・冒険のしおり）
//   データは data/rivals-r88.js。サーバー（world/rivals-r88.js）・冒険のしおり（world/shiori.js）・画面（client/ui/rivals-r88.js）が 使う
//   持ち物の 数え方は G1 の そろいの own と おなじ（shared/gear-r88.js の ownedIds: ふくろ・預かり所・装備。同じ 品は 1つ）
import { ITEMS } from './data/items.js';
import { ownedIds } from './gear-r88.js';
import { workName } from './data/works.js';
import { RIVAL_DOORS, DOOR_NEED, rivalsOf, rivalWon, rivalOpen, rivalMembers, doorOf, doorFlag } from './data/rivals-r88.js';

export const HALL_NAME = 'まぼろしの回ろう';

// その 作品の 品を いくつ 持って いるか
export function workOwned(c, work) {
  let n = 0;
  for (const id of ownedIds(c)) if (ITEMS[id]?.work === work) n++;
  return n;
}
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

// とびらを 調べた 時の まど（client/ui/rivals-r88.js の rivalPop）
//   { kind: 'rival', work, workName, mark, own, need, rivals: [{ id, name, members, lv, state: 'won' | 'next' | 'open' | 'lock', use, rewards: [{ id, name }], words }], ask }
//   state … won: 勝った（何回でも ちょうせん できる）/ next: つぎの 相手 / lock: 前の 人に 勝つと ちょうせん できる
export function rivalPaper(c, work) {
  const d = doorOf(work);
  const list = rivalsOf(work).map((rv) => {
    const won = rivalWon(c, rv.id);
    const state = won ? 'won' : rivalOpen(c, rv.id) ? 'next' : 'lock';
    return {
      id: rv.id, name: rv.name, lv: rv.lv, state, members: rivalMembers(rv).length > 1 ? rivalMembers(rv).map((m) => m.name) : null,
      use: itemName(rv.use), rewards: rewardIds(rv).map((id) => ({ id, name: itemName(id) })),
      words: state === 'lock' ? '' : rv.words,
    };
  });
  return {
    kind: 'rival', work, workName: workName(work), mark: d?.mark || '', own: workOwned(c, work), need: DOOR_NEED,
    rivals: list, ask: list.some((r) => r.state === 'next') ? 'だれにちょうせんする？' : 'もう一度、戦う？',
  };
}
// まどの ボタン（ちょうせん できる 人。つぎの 人が 先・やめる が さいご）。もどりち: [{ id, label }]
export function rivalButtons(paper) {
  const can = paper.rivals.filter((r) => r.state !== 'lock');
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
    return { name: `${workName(d.work)}のとびら`, where: left ? `品をあと${left}つ集めると開く` : '', state, right: `${won}/${all.length}人` };
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
export function rivalRec(c) {
  for (const d of RIVAL_DOORS) {
    if (!doorOpen(c, d.work)) continue;
    const nx = rivalsOf(d.work).find((r) => !rivalWon(c, r.id));
    if (nx) return { text: `まぼろしの回ろうで、${workName(d.work)}の${nx.name}にちょうせんできます`, where: 'ルミナの町の星の神殿' };
  }
  return null;
}
