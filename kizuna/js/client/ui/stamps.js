// 第50回 N7: 「スタンプを変える」まど（HUD の スタンプの さいごの 行・設定 から。ことばは shared/data/stamps.js）
//   ばしょ（1〜12）を えらぶ →「ことばを選ぶ」（なかまわけの 一覧）・「自分で書く」・ひとつ前へ／うしろへ・はずす
//   「もとにもどす」で はじめの スタンプへ。かえる たびに サーバーへ おくる（menuAction の 'stamps'）
//   タッチ・マウス・キーボード・コントローラー どれでも（ListMenu・askText・confirmBox）
import { el, ListMenu, askText, confirmBox } from './dom.js?v=b006a21bc0e3';
import {
  STAMP_SLOTS, STAMP_LEN, STAMP_PRESETS, DEFAULT_STAMPS, stampsOf, cleanStampText, putStamp, dropStamp, moveStamp,
} from '../../shared/data/stamps.js?v=b006a21bc0e3';

const Z = 8; // メニューの えらぶ まど（4・5）より 前、たしかめる まど（20）より うしろ

// 小さな えらぶ まど（えらんだ value。やめる なら null）
function pickBox(g, title, items, { cols = 1, start = -1 } = {}) {
  return new Promise((resolve) => {
    const sfx = (x) => g.audio?.sfx(x);
    const back = el('div', { class: 'modal-back', style: { zIndex: Z + 2 }, onclick: () => { sfx('cancel'); done(null); } });
    const box = el('div', { class: 'win panel center-panel stamp-pick', style: { width: cols > 1 ? 'min(94vw, 460px)' : 'min(86vw, 360px)', zIndex: Z + 3, background: 'var(--win-solid)' } },
      el('div', { class: 'small gold', text: title }));
    const m = new ListMenu(g.input, { items, cols, sound: sfx, back: 'もどる', start, onSelect: (it) => done(it.value), onCancel: () => done(null) });
    box.append(m.root);
    document.getElementById('ui').append(back, box);
    m.focus();
    const done = (v) => {
      m.blur();
      back.remove();
      box.remove();
      resolve(v ?? null);
    };
  });
}

// ことばを 選ぶ（なかまわけ → ことば）。えらんだ ことば（やめる なら null）
async function pickPreset(g, now) {
  for (;;) {
    const cat = await pickBox(g, 'どんなことば？', STAMP_PRESETS.map((p, i) => ({ label: p.name, right: `${p.list.length}こ`, value: i })));
    if (cat === null) return null;
    const list = STAMP_PRESETS[cat].list;
    const v = await pickBox(g, STAMP_PRESETS[cat].name, list.map((s) => ({ label: s, value: s })), { cols: 2, start: list.indexOf(now) });
    if (v !== null) return v;
  }
}

// まどを 開く。とじたら おわる Promise
export function openStampEditor(g) {
  return new Promise((resolve) => {
    const sfx = (x) => g.audio?.sfx(x);
    let list = stampsOf(g.me);
    const save = (next) => {
      list = next;
      // 先に 自分の 画面へ（サーバーの 返事 self でも おなじに なる）
      if (g.me) {
        if (next.length === DEFAULT_STAMPS.length && next.every((s, i) => s === DEFAULT_STAMPS[i])) delete g.me.stamps;
        else g.me.stamps = next.slice();
      }
      g.net.send({ t: 'menu', action: 'stamps', list: next });
    };
    const rows = () => {
      const items = [];
      for (let i = 0; i < STAMP_SLOTS; i++) {
        const s = list[i];
        // あいている ところは 1つだけ えらべる（つぎに うまる ところ）
        items.push(s ? { label: s, right: `${i + 1}`, value: i } : { label: '（あき）', right: `${i + 1}`, value: i, cls: 'muted', disabled: i > list.length });
      }
      items.push({ label: 'もとにもどす', value: 'reset', cls: 'stamp-edit' });
      return items;
    };
    const back = el('div', { class: 'modal-back', style: { zIndex: Z }, onclick: () => { sfx('cancel'); close(); } });
    const box = el('div', { class: 'win panel center-panel stamp-editor', style: { width: 'min(94vw, 460px)', zIndex: Z + 1, background: 'var(--win-solid)' } },
      el('div', { class: 'small gold', text: 'スタンプを変える（変えたいところを選ぶ）' }));
    const m = new ListMenu(g.input, {
      items: rows(),
      cols: 2,
      fit: true,
      back: '閉じる',
      sound: sfx,
      onSelect: (it, idx) => act(it.value, idx),
      onCancel: () => close(),
    });
    const note = el('div', { class: 'detail small', text: `チャットのスタンプを${STAMP_SLOTS}こまで選べる。自分で書くときは${STAMP_LEN}文字まで。` });
    box.append(m.root, note);
    document.getElementById('ui').append(back, box);
    m.focus();
    const again = (idx) => {
      if (!box.isConnected) return;
      m.setItems(rows());
      if (idx >= 0 && idx < m.items.length && !m.items[idx].disabled) {
        m.idx = idx;
        m.render();
      }
      m.focus();
    };
    const close = () => {
      m.blur();
      back.remove();
      box.remove();
      resolve();
    };
    const act = async (v, idx) => {
      m.blur();
      if (v === 'reset') {
        const ok = await confirmBox(g.input, 'スタンプを、最初のスタンプにもどしますか？', 'もどす', 'やめる', sfx);
        if (ok) save(DEFAULT_STAMPS.slice());
        return again(idx);
      }
      const i = v;
      const now = list[i];
      const opts = [{ label: 'ことばを選ぶ', value: 'preset' }, { label: '自分で書く', value: 'write' }];
      if (now) {
        opts.push({ label: 'ひとつ前へ', value: 'up', disabled: i === 0 },
          { label: 'ひとつうしろへ', value: 'down', disabled: i >= list.length - 1 },
          { label: 'はずす', value: 'drop', disabled: list.length <= 1 });
      }
      const what = await pickBox(g, now ? `${i + 1}ばんめ「${now}」` : `${i + 1}ばんめ（あき）`, opts);
      let at = idx;
      if (what === 'preset') {
        const s = await pickPreset(g, now);
        if (s) save(putStamp(list, i, s));
      } else if (what === 'write') {
        const s = cleanStampText(await askText(g.input, { title: `スタンプのことば（${STAMP_LEN}文字まで）`, max: STAMP_LEN, initial: now || '', placeholder: 'がんばろう！' }) || '');
        if (s) save(putStamp(list, i, s));
        // 決めた Enter が この まどの 決定に ならないように、すこし まってから もどる
        await new Promise((r) => setTimeout(r, 80));
      } else if (what === 'up' || what === 'down') {
        const d = what === 'up' ? -1 : 1;
        save(moveStamp(list, i, d));
        at = idx + d; // カーソルも いっしょに うごく
      } else if (what === 'drop') {
        save(dropStamp(list, i));
      }
      again(at);
    };
  });
}
