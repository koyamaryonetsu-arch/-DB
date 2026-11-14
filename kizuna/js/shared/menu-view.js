// 第78回 3-6: メニューの「かんたん表示」（docs/plan-r78.md の 2・docs/plan-r78-simple.md）
//   技の しくみが 4つ（お気に入り・オートで 使う 技・命令の 一覧に 出す 技・並び／種類・職業の 切りかえ）に ふえて、子どもには むずかしい。
//   設定の「メニューの表示：くわしい／かんたん」。キャラごと（サーバーの キャラの データ c.menuView。ひとりモードも おなじ）。
//   ふだんは くわしい（今の キャラも 新しい キャラも。家族の 決定）。
//   かんたん は「かくす」だけ。autoOff・cmdOff・お気に入りの 並びは さわらない（戦いの 一覧・オートの 動きは かわらない）
//
// 保存: かんたん の 時だけ c.menuView = 'simple'。くわしい（ふだん）は 項目を 消す。
//   → 引っこしコード（shared/world/transfer.js）は キャラを そのまま 入れるので、ふだんの 値は コードに 入らない（長く ならない）
import { skillStdPower, skillStdMp } from './skill-sort.js?v=283f9a2c8227';
import { ABILITIES } from './data/abilities.js?v=283f9a2c8227';

export const MENU_VIEWS = { full: 'くわしい', simple: 'かんたん' };
// 技の 画面の すみに 出す ひとこと
export const SIMPLE_NOTE = 'かんたん表示（設定で変えられます）';

// かんたん表示か（知らない 値・ない 時は くわしい）
export function menuSimple(c) {
  return c?.menuView === 'simple';
}

// 'simple' | 'full'
export function menuViewOf(c) {
  return menuSimple(c) ? 'simple' : 'full';
}

// サーバー（world/services.js の settings）: とどいた 値を 入れる。くわしい・知らない 値は 項目を 消す。かわったら true
export function setMenuView(c, v) {
  if (!c || typeof c !== 'object') return false;
  const before = menuViewOf(c);
  if (v === 'simple') c.menuView = 'simple';
  else delete c.menuView;
  return before !== menuViewOf(c);
}

// かんたん の 覚えた技: 強い じゅんの 1つの 一覧
//   ダメージ・回復の ある 技が さき（強い じゅん）。その あと 強くする・弱くする・そのほか（MPの 多い じゅん）。おなじ 時は 覚えた じゅん
//   （くわしい の「種類で見る／職業で見る」の 中は 弱い じゅん〈shared/skill-sort.js の sortByStdPower〉）
export function simpleLearnOrder(ids) {
  const rows = (ids || []).map((id, i) => ({ id, i, known: !!ABILITIES[id], pow: skillStdPower(id), mp: skillStdMp(id) }));
  rows.sort((x, y) => {
    if (x.known !== y.known) return x.known ? -1 : 1;
    const px = x.pow > 0, py = y.pow > 0;
    if (px !== py) return px ? -1 : 1;
    if (px && x.pow !== y.pow) return y.pow - x.pow;
    if (x.mp !== y.mp) return y.mp - x.mp;
    return x.i - y.i;
  });
  return rows.map((r) => r.id);
}

// 第78回 3-6 追加（メインの 設計）: かんたん の 覚えた技は「今の職業の技」（強い じゅん）→「ほかの職業の技」（強い じゅん）。
//   1つの 一覧だと 職業を たくさん きわめた キャラで 800こ ほどに なり、上に ほかの 職業の 技が ならんで 分かりにくい。
//   今の 職業の 技 … 戦いの「今の職業」の タブと おなじ きまり（技の job が 今の 職業。shared/skill-tabs.js）
//   もどりち: [{ key: 'now'|'other'|'all', label, ids }]（空の ものは 出さない）。職業の ない 魔物は 見出し なしの 1つ（key: 'all'）
export const SIMPLE_GROUPS = { now: '今の職業の技', other: 'ほかの職業の技' };
export function simpleLearnGroups(ids, job, abs = (id) => ABILITIES[id]) {
  const order = simpleLearnOrder(ids);
  if (!job) return order.length ? [{ key: 'all', label: '', ids: order }] : [];
  const isNow = (id) => abs(id)?.job === job;
  return [
    { key: 'now', label: SIMPLE_GROUPS.now, ids: order.filter(isNow) },
    { key: 'other', label: SIMPLE_GROUPS.other, ids: order.filter((id) => !isNow(id)) },
  ].filter((g) => g.ids.length);
}
