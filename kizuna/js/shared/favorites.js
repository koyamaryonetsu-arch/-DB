// 第72回: 技の お気に入りの きまり（サーバー〈world/services.js の favorite〉と 画面〈client/ui/menu.js・client/battle.js〉で おなじ）
//   家族の ねがい「覚えた技からお気に入りにしても、お気に入りにならない」:
//   まえは 30こ まで で、いっぱいの ときは だまって 入れなかった（サーバーは「入れた」と 返事を していた）。
//   → 60こ まで に ふやし、いっぱいの ときは 入れられない ことと わけを 出す。
//     もう 覚えていない 技（数に 入るが 画面に 出ない）は、いっぱいの ときに さきに すてる。
import { ABILITIES } from './data/abilities.js?v=c3dbffbf9460';

export const FAV_MAX = 60;

// いっぱいの ときの 知らせ（画面と サーバーで おなじ）
export const FAV_FULL_TEXT = `お気に入りは${FAV_MAX}こまで。「お気に入り」のタブで、使わない技をはずしてから入れよう。`;

// 今の お気に入り（ある 技だけ・かさならない）
export function favClean(cur) {
  const out = [];
  for (const x of Array.isArray(cur) ? cur : []) if (typeof x === 'string' && ABILITIES[x] && !out.includes(x)) out.push(x);
  return out;
}

// これ以上 入れられないか（learned: 覚えている 技の Set。あれば 覚えていない 技は 数えない）
export function favFull(cur, learned = null) {
  const list = favClean(cur);
  return (learned ? list.filter((x) => learned.has(x)) : list).length >= FAV_MAX;
}

// お気に入りを かえる（op: add・remove・up・down）。もどりち: { ok, list, full }
//   ok が false の ときは list は 今の まま（いっぱい・ない 技）
export function favApply(cur, id, op, learned = null) {
  let list = favClean(cur);
  if (typeof id !== 'string' || !ABILITIES[id]) return { ok: false, list };
  const i = list.indexOf(id);
  if (op === 'add') {
    if (i >= 0) return { ok: true, list };
    if (list.length >= FAV_MAX && learned) list = list.filter((x) => learned.has(x));
    if (list.length >= FAV_MAX) return { ok: false, full: true, list: favClean(cur) };
    list.push(id);
  } else if (op === 'remove') {
    if (i >= 0) list.splice(i, 1);
  } else if (op === 'up' || op === 'down') {
    const j = op === 'up' ? i - 1 : i + 1;
    if (i >= 0 && j >= 0 && j < list.length) [list[i], list[j]] = [list[j], list[i]];
  } else return { ok: false, list };
  return { ok: true, list };
}
