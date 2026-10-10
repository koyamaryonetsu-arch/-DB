// ひみつのダンジョンの「家族の記録の板」（入口の 広間。world/secret.js の boardData）
//   data.rows … 深い じゅん（家族サーバーでは 家族みんな、ひとりの サイトでは 自分の キャラたち）
//   data.me   … 自分の 記録
import { el, ListMenu } from './dom.js?v=0136232bcf56';
import { sdDate } from '../../shared/data/secret.js?v=0136232bcf56';

export function sdBoardUI(game, data) {
  return new Promise((resolve) => {
    const back = el('div', { class: 'modal-back' });
    const root = el('div', { class: 'panel center-panel svc-panel sd-board-panel' });
    const close = () => {
      menu.blur();
      back.remove();
      root.remove();
      resolve();
    };
    const closeBtn = el('button', { class: 'btn closebtn', text: '✕ 閉じる', 'aria-label': '閉じる', onclick: () => { game.audio?.sfx('cancel'); close(); } });
    const title = data.offline ? '記録の板（このスマホのキャラ）' : `家族の記録の板${data.family ? `（${data.family}）` : ''}`;
    root.append(el('div', { class: 'win svc-head' }, el('span', { class: 'gold', text: title }), el('span', { class: 'svc-right' }), closeBtn));
    const main = el('div', { class: 'win main scroll sd-board' });
    root.append(main);
    main.append(el('div', { class: 'sd-board-lead muted small', text: 'ひみつのダンジョンで、いちばん深く行けた階' }));
    const rows = Array.isArray(data.rows) ? data.rows : [];
    if (!rows.length) main.append(el('div', { class: 'muted', text: 'まだだれも記録がない。\n1番乗りをめざそう！' }));
    const list = el('div', { class: 'sd-rows' });
    for (const r of rows) {
      const me = r.id === data.me?.id;
      const withText = r.with?.length ? `${r.with.join('・')}といっしょ` : 'ひとりで';
      list.append(el('div', { class: `sd-row ${me ? 'me' : ''} rank${r.rank}` },
        el('span', { class: 'sd-rank', text: `${r.rank}位` }),
        el('span', { class: 'sd-name', text: r.name }),
        el('span', { class: 'sd-floor gold', text: `地下${r.best}階` }),
        el('span', { class: 'sd-sub muted small', text: `${sdDate(r.at)}　${withText}` })));
    }
    main.append(list);
    main.append(el('div', { class: 'sd-me', text: `${data.me?.name || ''}の記録: ${data.me?.text || 'まだ記録がない'}${data.me?.tries ? `（ちょうせん${data.me.tries}回）` : ''}` }));
    main.append(el('div', { class: 'detail small', text: '5階ごとの休み所に初めて着くと、大きなごほうび。\nパーティーで入ると、いっしょにいた家族みんなの記録になります。' }));
    const menu = new ListMenu(game.input, {
      items: [{ label: '閉じる', value: 'close' }],
      sound: (x) => game.audio?.sfx(x),
      onSelect: () => close(),
      onCancel: () => close(),
      back: null,
    });
    root.append(menu.root);
    back.addEventListener('click', close);
    document.getElementById('ui').append(back, root);
    menu.focus();
  });
}
