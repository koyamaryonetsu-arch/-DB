// 第70回: 作れる 魔物から 選ぶ（配合の さがし表。家族の ねがい「何が 生まれるか・その 配合が 何と 何かを 見て 選びたい」）
//   今 いる 親に なれる 魔物（仲間の 魔物 ＋ あずかり中。レベル10 いじょう）の 2ひきの 組を みんな ためして、
//   生まれる 子ごとに「どの 2ひきで 生まれるか」を まとめる。1つ 1つの 組は data/companions.js の breedCandidates と 同じ 計算
//   （ランクが 上がる 子・minLv・4体配合・素材配合〈ふくろの 品〉も 親の 本当の レベル・＋・血統で 見る）
//   サーバーの 酒場（world/breed.js の breedFinder・action 'breedFinder'）と テスト（test/breed-finder-r70.test.js）で 使う
import { BREED_MIN_LEVEL, RANKS, breedCandidates, breedPlus, bestiaryKnow, SPECIAL_KINDS } from './data/companions.js?v=d13bba1204d4';
import { breedTrend, breedTrendMemo } from './breed-calc.js?v=d13bba1204d4';
import { colorMon } from './data/variants.js?v=d13bba1204d4';

// 配合の しゅるいの つよさ（小さいほど めずらしい。子の 一覧の しるしに 使う）
const KIND_ORDER = { four: 0, material: 1, special: 2, recipe: 3, same: 4, mix: 5, parent: 6, family: 7 };
const TREND_ORDER = { up: 0, same: 1, down: 2 };
// 親が いる ところ（パーティーに いる 親は 下に。旅立つと こまる ので）
const WHERE_ORDER = { storage: 0, tavern: 1, wagon: 2, party: 3 };

// 親の 一覧（world/breed.js の parentOf と 同じ 形 ＋ key・where）
//   c … キャラ（companions・storage・partyKeys・wagonKeys）。レベル10 いじょうの 魔物だけ
export function breedParents(c) {
  const party = new Set(c?.partyKeys || []), wagon = new Set(c?.wagonKeys || []);
  const out = [];
  const add = (e, where) => {
    if (!e || e.kind !== 'monster' || !e.species || !e.char) return;
    if ((e.char.level || 0) < BREED_MIN_LEVEL) return;
    out.push({ ...e.char, species: e.species, key: e.key, where });
  };
  for (const e of c?.companions || []) add(e, party.has(e.key) ? 'party' : wagon.has(e.key) ? 'wagon' : 'tavern');
  for (const e of c?.storage || []) add(e, 'storage');
  return out;
}

// よい 組が 先: ランクが 下がらない → 育てると 強く なる（↑→↓）→ ＋が 大きい → パーティーに いない 親 → 親の ならび
const busy = (P) => WHERE_ORDER[P.where] || 0;
function pairCmp(x, y) {
  return (x.low - y.low) || (TREND_ORDER[x.trend] - TREND_ORDER[y.trend]) || (y.plus - x.plus)
    || (Math.max(busy(x.A), busy(x.B)) - Math.max(busy(y.A), busy(y.B))) || (busy(x.A) + busy(x.B) - busy(y.A) - busy(y.B))
    || (x.i - y.i) || (x.j - y.j);
}

// さがし表（parents … breedParents の 形。MONSTERS … data/monsters.js。c … 図鑑と ふくろを もつ キャラ）
//   room … 配合して あける モード（あずかり中 どうしの 組は 仲間が あかないので 入れない）
//   かえす もの: { kids: Map(しゅぞく → { sp, rank, know, pairs: [{ a, b, kind, low, item, plus, trend }] }), pairs: 組の 数 }
//   pairs の a・b は 親の key（a が parents で 先の 方）。どちらを 1ぴきめに しても 同じ（breedCandidates）
//   trend（↑→↓）は shared/breed-calc.js の breedForecast と 同じ（breedTrend。親ごと・組ごとの 能力は 覚えて おく）
export function breedMatrix(parents, MONSTERS, c = null, { room = false } = {}) {
  const know = bestiaryKnow(c);
  const kids = new Map();
  const memo = breedTrendMemo();
  let pairs = 0;
  for (let i = 0; i < parents.length; i++) {
    for (let j = i + 1; j < parents.length; j++) {
      const A = parents[i], B = parents[j];
      if (room && A.where === 'storage' && B.where === 'storage') continue;
      pairs++;
      const cand = breedCandidates(A, B, MONSTERS, c);
      for (const it of cand.items) {
        let k = kids.get(it.sp);
        if (!k) kids.set(it.sp, (k = { sp: it.sp, rank: it.rank, know: know(it.sp), pairs: [] }));
        const plus = breedPlus(A, B, it.kind === 'same');
        k.pairs.push({ a: A.key, b: B.key, kind: it.kind, low: it.rank < cand.hi, item: it.item || null, plus, trend: breedTrend(A, B, it.sp, plus, memo), A, B, i, j });
      }
    }
  }
  for (const k of kids.values()) {
    k.pairs.sort(pairCmp);
    for (const p of k.pairs) { delete p.A; delete p.B; delete p.i; delete p.j; }
  }
  return { kids, pairs };
}

// 子の 一覧の 1行（showLow … ランクが 下がる 組も 数える）
//   kind・item … いちばん めずらしい 配合（4体・素材・特定配合 など）。best … いちばん よい 組（＋・↑→↓）
export function kidSummary(k, MONSTERS, showLow = false) {
  const up = k.pairs.filter((p) => !p.low);
  const use = up.length && !showLow ? up : k.pairs;
  let rare = use[0];
  for (const p of use) if (KIND_ORDER[p.kind] < KIND_ORDER[rare.kind]) rare = p;
  return {
    sp: k.sp, name: MONSTERS[k.sp]?.name || k.sp, rank: RANKS[k.rank], ri: k.rank, know: k.know, unseen: k.know === 0,
    kind: rare.kind, special: SPECIAL_KINDS.includes(rare.kind), item: rare.item || null,
    count: use.length, lowCount: k.pairs.length - up.length, lowOnly: !up.length,
    best: { plus: use[0].plus, trend: use[0].trend },
  };
}

// 子の 一覧（ならび: ランクの 高い じゅん → 図鑑に ない 子が 先 → 名前）。showLow で ないと ランクが 下がる 組だけの 子は のぞく
export function kidList(kids, MONSTERS, showLow = false) {
  const out = [];
  for (const k of kids.values()) {
    const s = kidSummary(k, MONSTERS, showLow);
    if (s.lowOnly && !showLow) continue;
    out.push(s);
  }
  return out.sort((x, y) => (y.ri - x.ri) || ((x.know === 0 ? 0 : 1) - (y.know === 0 ? 0 : 1))
    || x.name.localeCompare(y.name, 'ja') || (x.sp < y.sp ? -1 : x.sp > y.sp ? 1 : 0));
}

// その 子が 生まれる 組（よい じゅん）。showLow で ないと、ランクが 下がらない 組が ある ときは 下がる 組を のぞく
export function kidPairs(k, showLow = false) {
  if (!k) return [];
  const up = k.pairs.filter((p) => !p.low);
  return up.length && !showLow ? up : k.pairs;
}

// 第71回: さがし表の 絵（家族の ねがい「名前だけじゃなく、イラストも 見せて」。client/ui/services.js）
//   子 … { mon, hidden }。図鑑で まだ 見た ことが ない 子は かげ（名前も ？？？。いつもの きまり）
//   親 … { mon }（色ちがいの 色も）。しゅぞくが わからない 時は null
export const kidArt = (k) => (k?.sp ? { mon: k.sp, hidden: !!k.unseen } : null);
export const parentArt = (p) => (p?.species ? { mon: colorMon(p.species, p.color), hidden: false } : null);
