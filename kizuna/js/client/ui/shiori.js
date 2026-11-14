// 第78回: メニューの「冒険のしおり」（docs/plan-r78-shiori.md）
//   つぎに 何を すれば いいか・何が のこって いるかを、画面を 大きく 使う まど 1まいで 見せる。
//   中みは shared/world/shiori.js の shioriOf（キャラだけで 決まる。サーバーでも ひとりモードでも おなじ）
//   ・物語（今の 部・章・幕と つぎの 目標）／おすすめ（3つまで）／のこって いる こと（しくみごとの 数と 棒）
//   ・えらぶと くわしい 一覧（のこって いる 物の 名前と 場所）。もどるで もとの 場所に もどる
//   ・キーボード・ゲームパッド（上下左右・決定・もどる）・タップの どれでも（dom.js の ListMenu）
import { el, ListMenu, esc } from './dom.js?v=283f9a2c8227';
import './r78-shiori-css.js?v=283f9a2c8227';
import { shioriOf, trackCount, trackRate } from '../../shared/world/shiori.js?v=283f9a2c8227';

const NL = (s) => esc(s).replace(/\n/g, '<br>');
const whereHtml = (w) => (w ? `<div class="sh-where">${esc(w)}</div>` : '');

function storyTitle(st) {
  const t = [st.title ? `「${st.title}」` : '', st.actTitle].filter(Boolean).join(' ');
  return t;
}

function storyHtml(st) {
  const title = storyTitle(st);
  const clear = st.cleared ? '<span class="sh-st-clear">クリア！</span>' : '';
  const obj = st.objective ? `<div class="sh-st-obj">${NL(st.objective)}</div>` : '';
  const hint = st.bossHints?.length ? '<div class="sh-where">ボスのヒントがあるよ（選ぶと見られる）</div>' : '';
  return `<div class="sh-st-label">${esc(st.label)}${clear}</div>${title ? `<div class="sh-st-title">${esc(title)}</div>` : ''}${obj}${whereHtml(st.where)}${hint}`;
}

function recHtml(r) {
  const tag = r.kind === 'story' ? '物語' : 'より道';
  return `<span class="sh-rec-tag">${tag}</span><span class="sh-rec-text">${esc(r.text)}</span>${whereHtml(r.where)}`;
}

function barHtml(t) {
  if (!t.total) return '';
  return `<div class="sh-bar"><i style="width:${Math.round(trackRate(t) * 100)}%"></i></div>`;
}

function trackHtml(t) {
  const note = String(t.note || '').split('\n')[0];
  return `<div class="sh-tr-top"><span class="sh-tr-name">${esc(t.name)}</span><span class="sh-tr-num">${esc(trackCount(t))}</span></div>${barHtml(t)}<div class="sh-tr-note">${esc(note)}</div>`;
}
// ひみつのダンジョンは 終わりが ない ので、つぎの 番人の 階に ついても みどりに しない
const isFull = (t) => !!t.total && t.now >= t.total && t.id !== 'sd';

// メニューの 右の 見本（カーソルを あわせた だけ。えらぶと 大きな まど）
export function shioriPreview(menu) {
  const s = shioriOf(menu.game.me, { missions: menu.game.missionSum });
  const box = el('div', { class: 'sh-pv' });
  box.append(el('div', { class: 'muted', text: 'つぎに何をすればいいか、何がのこっているかを、1まいで見る。\n選ぶと、大きく開く。' }));
  box.append(el('div', { class: 'sh-pv-story', text: [s.story.label, storyTitle(s.story)].filter(Boolean).join(' ') }));
  for (const r of s.recs) box.append(el('div', { class: 'sh-pv-rec', text: `・${r.text}` }));
  return box;
}

// 大きな まどを 開く。とじたら おわる Promise
export function openShiori(menu) {
  const g = menu.game;
  const sfx = (x) => g.audio?.sfx?.(x);
  return new Promise((resolve) => {
    const data = shioriOf(g.me, { missions: g.missionSum });
    const back = el('div', { class: 'modal-back', style: { zIndex: 4 }, onclick: () => { sfx('cancel'); finish(); } });
    const title = el('h2', { class: 'sh-title', text: '冒険のしおり' });
    const who = el('span', { class: 'sh-who', text: g.me?.name ? `${g.me.name}の冒険` : '' });
    const closeBtn = el('button', { class: 'btn sh-close', text: '✕ 閉じる', 'aria-label': 'しおりを閉じる', onclick: (e) => { e.stopPropagation(); sfx('cancel'); onBack(); } });
    const body = el('div', { class: 'sh-body' });
    const foot = el('div', { class: 'sh-foot', text: '決定で、くわしく見る。もどるで、閉じる。' });
    const box = el('div', { class: 'win shiori-pop', role: 'dialog', 'aria-label': '冒険のしおり' }, el('div', { class: 'sh-head' }, title, who, closeBtn), body, foot);
    let list = null;
    let detailOpen = false;
    let mainIdx = -1;
    let mainTop = 0;

    const finish = () => {
      list?.blur();
      back.remove();
      box.remove();
      menu.popupOpen = false;
      resolve();
    };
    function onBack() {
      if (detailOpen) showMain();
      else finish();
    }

    // ───── 1まい目: 物語・おすすめ・のこって いる こと ─────
    function showMain() {
      detailOpen = false;
      list?.blur();
      body.innerHTML = '';
      closeBtn.textContent = '✕ 閉じる';
      foot.textContent = '決定で、くわしく見る。もどるで、閉じる。';
      const st = data.story;
      const items = [
        { header: true, label: '物語' },
        { html: storyHtml(st), value: { go: 'story' }, cls: 'sh-story sh-wide' },
      ];
      if (data.recs.length) {
        items.push({ header: true, label: 'おすすめ' });
        for (const r of data.recs) items.push({ html: recHtml(r), value: { go: r.go }, cls: `sh-rec ${r.kind}` });
      }
      items.push({ header: true, label: 'のこっていること' });
      for (const t of data.tracks) items.push({ html: trackHtml(t), value: { go: t.id }, cls: `sh-track ${isFull(t) ? 'full' : ''}` });
      list = new ListMenu(g.input, {
        items,
        className: 'sh-list',
        sound: sfx,
        back: null,
        start: mainIdx,
        onSelect: (it, i) => {
          mainIdx = i;
          mainTop = body.scrollTop;
          showDetail(it.value.go);
        },
        onCancel: () => finish(),
      });
      body.append(list.root);
      body.scrollTop = mainTop;
      list.focus();
      list.scrollToSel();
    }

    // ───── くわしい 一覧 ─────
    function showDetail(go) {
      detailOpen = true;
      list?.blur();
      body.innerHTML = '';
      closeBtn.textContent = '← もどる';
      foot.textContent = 'もどるで、しおりにもどる。';
      const top = el('div', { class: 'sh-detail-top' });
      let items = [];
      if (go === 'story') {
        const st = data.story;
        top.append(el('div', { class: 'sh-tr-top' }, el('span', { class: 'sh-tr-name', text: `${st.label}${st.cleared ? '（クリア！）' : ''}` })));
        const t2 = storyTitle(st);
        if (t2) top.append(el('div', { class: 'sh-note', text: t2 }));
        if (st.objective) top.append(el('div', { class: 'sh-note', text: `つぎの目標：${st.objective}` }));
        if (st.where) top.append(el('div', { class: 'sh-where', text: `場所：${st.where}` }));
        if (st.hint) top.append(el('div', { class: 'sh-hint', text: `仲間のひとこと：${st.hint}` }));
        // 第80回 E班: ボスに 負けた 時に 出た ヒント（勝つと 消える）
        for (const b of st.bossHints || []) b.hints.forEach((h, i) => top.append(el('div', { class: 'sh-hint', text: `ボスのヒント${i + 1}：${h}` })));
        if (st.end) top.append(el('div', { class: 'sh-note', text: '物語の続きは、アップデートを待とう。それまでは、より道やいらいを楽しもう！' }));
      } else {
        const t = data.tracks.find((x) => x.id === go);
        if (!t) return showMain();
        top.append(el('div', { class: 'sh-tr-top' }, el('span', { class: 'sh-tr-name', text: t.name }), el('span', { class: 'sh-tr-num', text: trackCount(t) })));
        if (t.total) top.append(el('div', { class: 'sh-bar', html: `<i style="width:${Math.round(trackRate(t) * 100)}%"></i>` }));
        if (t.where) top.append(el('div', { class: 'sh-where', text: `場所：${t.where}` }));
        if (t.note) top.append(el('div', { class: 'sh-note muted', text: t.note }));
        items = t.items.map((x) => ({
          html: `<span class="sh-dname">${esc(x.name)}</span>${x.where ? `<span class="sh-dwhere">${esc(x.where)}</span>` : ''}`,
          right: x.right || '',
          value: x,
          cls: `st-${x.state}`,
        }));
        for (const x of t.extra || []) items.push({ html: `<span class="sh-dname">${esc(x.name)}</span>`, right: x.right, value: x, cls: 'st-now' });
      }
      if (!items.length) items.push({ label: 'しおりにもどる', value: null, cls: 'sh-backrow' });
      // カーソルは のこって いる 物の いちばん 上に（すんだ 物から 始めない）
      const first = items.findIndex((it) => it.value?.state && it.value.state !== 'done');
      list = new ListMenu(g.input, {
        items,
        className: 'sh-dlist',
        sound: sfx,
        back: null,
        start: first,
        onSelect: (it) => { if (it.value === null) showMain(); },
        onCancel: () => showMain(),
      });
      body.append(top, list.root);
      body.scrollTop = 0;
      list.focus();
    }

    document.getElementById('ui').append(back, box);
    menu.popupOpen = true;
    showMain();
  });
}
