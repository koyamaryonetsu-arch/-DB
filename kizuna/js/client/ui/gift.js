// 第50回 N6: 家族に 道具を あげる（メニューの 道具 → 品物 →「家族にあげる」。サーバーは shared/world/gift.js）
//   だれに？（同じ 家族サーバーの ほかの キャラ。今 遊んでいなくても よい）→ いくつ？（2こ 以上 ある 時）→「あげますか？」→ あげる
//   十字キー・タッチ どちらでも（menu.pick・confirmBox は ListMenu）
import { confirmBox } from './dom.js?v=acb97b73a32c';
import { ITEMS } from '../../shared/data/items.js?v=acb97b73a32c';
import { itemCount } from '../../shared/stats.js?v=acb97b73a32c';

// メニューに「家族にあげる」を 出すか（家族サーバーで、ほかの キャラが いて、あげられる 品の 時）
export function canGift(g, id) {
  const it = ITEMS[id];
  if (!it || it.type === 'key' || it.unique) return false;
  if (g.net?.mode === 'offline') return false;
  return (g.chars || []).some((c) => c && c.id !== g.me?.id);
}

// いくつ？ の えらびし（持っている 数まで。さいごは 全部）
function qtyChoices(have) {
  const out = [1, 2, 3, 5, 10, 20, 50].filter((n) => n < have).map((n) => ({ label: `${n}こ`, value: n }));
  out.push({ label: `全部（${have}こ）`, value: have });
  return out;
}

// menu … client/ui/menu.js の FieldMenu（pick・menuCall・sfx を 使う）
export async function giftFlow(menu, id) {
  const g = menu.game;
  const it = ITEMS[id];
  const res = await menu.menuCall({ t: 'menu', action: 'giftList' }, () => true);
  if (!menu.root) return;
  const fam = Array.isArray(res?.family) ? res.family : [];
  if (!fam.length) {
    await menu.pick(res && !res.ok && res.text ? res.text : 'あげられる家族がいない', [{ label: 'もどる', value: null }]);
    return;
  }
  const to = await menu.pick(`${it.name}をだれにあげる？`, [
    ...fam.map((f) => ({ label: `${f.name}　Lv${f.level}${f.online ? '（遊んでいる）' : ''}`, value: f.id })),
    { label: 'やめる', value: null },
  ]);
  if (!to || !menu.root) return;
  const who = fam.find((f) => f.id === to);
  const have = itemCount(g.me, id);
  if (have < 1) return;
  let n = 1;
  if (have > 1) {
    n = await menu.pick(`${it.name}をいくつあげる？（${have}こ持っている）`, [...qtyChoices(have), { label: 'やめる', value: null }]);
    if (!n || !menu.root) return;
  }
  const ask = `${who.name}に${it.name}を${n > 1 ? `${n}こ` : ''}あげますか？${who.online ? '' : `\n（${who.name}が次に遊ぶ時に知らせるよ）`}`;
  if (!(await confirmBox(g.input, ask, 'あげる', 'やめる', menu.sfx))) return;
  await menu.menuCall({ t: 'menu', action: 'gift', id, to, n });
}
