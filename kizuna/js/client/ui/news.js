// メニューの「お知らせ」（第35回。shared/data/news.js）
//   一覧（日付・題。まだ 読んでいない 物に ●）と、下に えらんだ 物の 中み。
//   開いた ときに 出ている 物は ぜんぶ 読んだ ことに する（1つずつ 開かなくて よい。● は この 画面の 間は 出した まま）
import { el } from './dom.js?v=a8edacfcfd44';
import { NEWS, newsReadOf, newsDate } from '../../shared/data/news.js?v=a8edacfcfd44';
import './r35-css.js?v=a8edacfcfd44';

// menu: FieldMenu（mkSub・back を 使う）。active: えらべる 画面か（false は 右の 見本）
export function newsView(menu, active) {
  const g = menu.game;
  const read = newsReadOf(g.me);
  const box = el('div', { class: 'items-view news-view' });
  const detail = el('div', { class: 'detail item-detail news-body' });
  const rows = NEWS.map((n) => ({
    html: `<span class="nd">${newsDate(n)}</span>${n.title}`,
    value: n.id,
    cls: `news-row ${read.has(n.id) ? '' : 'unread'}`,
  }));
  if (!active) {
    const fresh = NEWS.filter((n) => !read.has(n.id));
    box.append(el('div', { class: 'muted', text: fresh.length ? `新しいお知らせが${fresh.length}こあります。\n${fresh.slice(0, 3).map((n) => `・${n.title}`).join('\n')}` : 'ゲームの新しいしくみや、アップデートのお知らせを見る。' }));
    return box;
  }
  const show = (it) => {
    const n = NEWS.find((x) => x.id === it?.value);
    detail.innerHTML = '';
    if (n) detail.append(el('div', { class: 'nb-date', text: `${newsDate(n)}　${n.title}` }), el('div', { text: n.text }));
  };
  const m = menu.mkSub({ items: rows, onMove: (it) => show(it), onSelect: (it) => show(it) });
  box.append(m.root, detail);
  // 読んだ ことに する（サーバーに 記録。キャラごと）
  const fresh = NEWS.filter((n) => !read.has(n.id)).map((n) => n.id);
  if (fresh.length) g.net.send({ t: 'menu', action: 'newsRead', ids: fresh });
  return box;
}
