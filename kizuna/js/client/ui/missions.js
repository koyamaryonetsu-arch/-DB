// 第78回 3-10: メニューの「家族ミッション」と「家族の記録」（docs/plan-r78-mission.md）
//   ・数えるのは サーバー（shared/world/missions.js）。ここは 見せるだけ（{ t: 'mission', action } で 聞く・受けとる）
//   ・画面を 大きく 使う まど 1まい（冒険のしおりと おなじ 考え。たて画面は 1列、よこ画面・PC は 2〜3列）
//   ・キーボード・ゲームパッド（上下左右・決定・もどる）・タップの どれでも（dom.js の ListMenu）
//   ・ひとりで遊ぶサイトでは「家族サーバーでいっしょに遊ぶと進みます」だけ（エラーに しない）
import { el, ListMenu, esc, toast } from './dom.js?v=2e6dc0959ea0';
import './r78-mission-css.js?v=2e6dc0959ea0';
import { request } from './syncui.js?v=2e6dc0959ea0';

const OFFLINE_TEXT = '家族サーバーでいっしょに遊ぶと進みます';
const HOW = '人間のキャラが2人いじょう、同じパーティーで遊んだ時だけ進む。ひとりの時は進まない。';

// サーバーに 聞く（ひとりモードでも この ブラウザの 世界が { offline: true } と こたえる）
export async function fetchMissions(g, msg = { action: 'view' }) {
  if (!g?.net) return null;
  const m = await request(g, { t: 'mission', ...msg }, 'mission', 8000);
  if (m && !m.timeout) g.missionSum = m;
  return m;
}

// メニューを 開いた 時に 先に 聞いて おく（冒険のしおりの「家族ミッション」の 行。とどかなくても よい）
//   とどいた 時に 見本を 出して いれば かきなおす
export function prefetchMissions(menu) {
  fetchMissions(menu.game).then(() => {
    if (menu.root && menu.current === 'mission' && menu.menu?.active) menu.preview('mission');
  }).catch(() => {});
}

const rewardText = (r) => `${r.gold}G・${r.items.map((x) => `${x.name}×${x.n}`).join('・')}`;
const pct = (a, b) => Math.round(Math.max(0, Math.min(1, b ? a / b : 0)) * 100);

function missionHtml(x) {
  const st = x.done ? (x.got ? '<span class="ms-tag got">受けとりずみ</span>' : '<span class="ms-tag ok">達成！</span>') : '';
  return `<div class="ms-top"><span class="ms-text">${esc(x.text)}</span>${st}</div>`
    + `<div class="ms-bar ${x.done ? 'done' : ''}"><i style="width:${pct(x.now, x.need)}%"></i></div>`
    + `<div class="ms-sub"><span class="ms-num">${x.now}/${x.need}</span>${x.mine ? `<span class="ms-mine">自分も${x.mine}</span>` : ''}</div>`
    + `<div class="ms-rew">ごほうび：${esc(rewardText(x.reward))}</div>`;
}

// メニューの 右の 見本（カーソルを あわせた だけ）
export function missionsPreview(menu) {
  const g = menu.game;
  const box = el('div', { class: 'ms-pv' });
  box.append(el('div', { class: 'muted', text: `週がわりの、家族みんなのミッション。\n${HOW}\n選ぶと、大きく開く。` }));
  const m = g.missionSum;
  if (m?.offline) box.append(el('div', { class: 'ms-pv-off', text: OFFLINE_TEXT }));
  else if (m?.week) {
    box.append(el('div', { class: 'ms-pv-days', text: `今週のミッション（のこり${m.week.days}日）` }));
    for (const x of m.week.list) box.append(el('div', { class: 'ms-pv-row' }, el('span', { text: `${x.done ? '★' : '・'}${x.text}` }), el('span', { class: 'ms-pv-num', text: `${x.now}/${x.need}` })));
  }
  return box;
}

// 大きな まどを 開く。とじたら おわる Promise
export function openMissions(menu) {
  const g = menu.game;
  const sfx = (x) => g.audio?.sfx?.(x);
  return new Promise((resolve) => {
    let data = g.missionSum || null;
    let page = 'main';
    let list = null;
    let mainIdx = -1;
    let busy = false;
    const back = el('div', { class: 'modal-back', style: { zIndex: 4 }, onclick: () => { sfx('cancel'); finish(); } });
    const title = el('h2', { class: 'ms-title', text: '家族ミッション' });
    const sub = el('span', { class: 'ms-days' });
    const closeBtn = el('button', { class: 'btn ms-close', text: '✕ 閉じる', 'aria-label': '家族ミッションを閉じる', onclick: (e) => { e.stopPropagation(); sfx('cancel'); onBack(); } });
    const body = el('div', { class: 'ms-body' });
    const foot = el('div', { class: 'ms-foot', text: HOW });
    const box = el('div', { class: 'win mission-pop', role: 'dialog', 'aria-label': '家族ミッション' }, el('div', { class: 'ms-head' }, title, sub, closeBtn), body, foot);

    const finish = () => {
      list?.blur();
      back.remove();
      box.remove();
      menu.popupOpen = false;
      resolve();
    };
    function onBack() {
      if (page !== 'main') show('main');
      else finish();
    }
    function makeList(items, start, onSelect) {
      list?.blur();
      body.innerHTML = '';
      list = new ListMenu(g.input, { items, className: 'ms-list', sound: sfx, back: null, start, onSelect, onCancel: () => onBack() });
      body.append(list.root);
      list.focus();
      list.scrollToSel?.();
    }

    async function act(v) {
      if (busy || !v) return;
      if (v.act === 'record') return show('record');
      if (v.act === 'wear') return show('wear');
      if (v.act === 'close') return finish();
      if (v.act === 'claim' || v.act === 'setWear') {
        busy = true;
        const r = await fetchMissions(g, v.act === 'claim' ? { action: 'claim', which: v.which } : { action: 'wear', n: v.n });
        busy = false;
        if (!box.isConnected) return;
        if (!r || r.timeout) {
          toast('通信がおくれています');
          sfx('buzz');
          return;
        }
        data = r;
        if (r.text) toast(r.text, 5000);
        sfx(r.ok ? 'item' : 'buzz');
        show(v.act === 'setWear' ? 'main' : page);
      }
    }

    // ───── 1まい目: 今週の 3つ・ごほうび・しょうごう・記録への 入口 ─────
    function mainItems() {
      const items = [];
      if (!data) {
        items.push({ html: '<div class="ms-note">読みこんでいます…</div>', value: null, cls: 'ms-wide' });
        return items;
      }
      if (data.timeout) {
        items.push({ html: '<div class="ms-note">通信がおくれています。もう一度開いてみてね。</div>', value: { act: 'close' }, cls: 'ms-wide' });
        return items;
      }
      if (data.offline) {
        items.push({ html: `<div class="ms-off">${esc(OFFLINE_TEXT)}</div><div class="ms-note">${esc(HOW)}\nこのサイトはひとりで遊ぶサイトなので、ミッションは進まない。</div>`, value: { act: 'close' }, cls: 'ms-wide' });
        return items;
      }
      const w = data.week;
      items.push({ header: true, label: `今週のミッション（のこり${w.days}日）` });
      w.list.forEach((x, i) => items.push({ html: missionHtml(x), value: { act: 'info', i }, cls: `ms-card ${x.done ? 'done' : ''}` }));
      items.push({ header: true, label: 'ごほうび' });
      if (w.claim) items.push({ html: `<div class="ms-big">ごほうびを受けとる（${w.claim}こ）</div>`, value: { act: 'claim', which: 'cur' }, cls: 'ms-claim' });
      else items.push({ html: `<div class="ms-note">${esc(w.joined ? 'ミッションを達成すると、ここで受けとれる。' : 'この週に、家族といっしょに遊ぶと受けとれる。')}</div>`, value: { act: 'info' }, cls: 'ms-info' });
      if (data.prev?.claim) items.push({ html: `<div class="ms-big">先週のごほうびを受けとる（${data.prev.claim}こ）</div><div class="ms-note">先週の分は、今週のうちに受けとろう。</div>`, value: { act: 'claim', which: 'prev' }, cls: 'ms-claim' });
      items.push({ header: true, label: 'しょうごう・スタンプ' });
      const me = data.me;
      const nx = me.next ? `つぎは、3つとも達成した週があと${me.next.left}週で「${me.next.title}」` : 'しょうごうを、全部集めた！';
      items.push({
        html: `<div class="ms-big">${esc(me.title ? `しょうごう：${me.title}` : 'しょうごう：なし')}</div><div class="ms-note">3つとも達成した週：${me.full}週\n${esc(nx)}${me.titles.length ? '\n選ぶと、つけるしょうごうを変えられる。' : ''}</div>`,
        value: me.titles.length ? { act: 'wear' } : { act: 'info' }, cls: 'ms-info',
      });
      items.push({ header: true, label: '家族の記録' });
      items.push({ html: `<div class="ms-big">家族の記録を見る</div><div class="ms-note">いっしょにたおした魔物・勝った戦い・今週のがんばり・先週の結果</div>`, value: { act: 'record' }, cls: 'ms-info' });
      return items;
    }

    // ───── 家族の 記録 ─────
    function recordItems() {
      const r = data.record;
      const items = [{ header: true, label: '家族の記録' }];
      const stat = (k, v) => ({ html: `<div class="ms-k">${esc(k)}</div><div class="ms-v">${esc(v)}</div>`, value: null, cls: 'ms-stat' });
      items.push(stat('いっしょにたおした魔物', `${r.kills}ひき`));
      items.push(stat('いっしょに勝った戦い', `${r.wins}回`));
      items.push(stat('3つとも達成した週', `${r.full}週`));
      items.push(stat('達成したミッション', `${r.done}こ`));
      items.push({ header: true, label: '今週のがんばり' });
      if (data.people.length) {
        for (const p of data.people) items.push({ html: `<div class="ms-k">${esc(p.name)}${p.me ? '（自分）' : ''}</div><div class="ms-note">いっしょの戦い${p.b}回・魔物${p.k}ひき・ミッション${p.sum}</div>`, value: null, cls: `ms-stat ${p.me ? 'me' : ''}` });
      } else items.push({ html: '<div class="ms-note">今週は、まだだれもいっしょに遊んでいない。</div>', value: null, cls: 'ms-stat ms-wide' });
      items.push({ header: true, label: '先週の結果' });
      const pv = data.prev;
      if (pv) {
        const n = pv.list.filter((x) => x.done).length;
        items.push({ html: `<div class="ms-big">${pv.full ? '3つとも達成！' : `${n}つ達成`}</div>`, value: null, cls: 'ms-stat ms-wide' });
        for (const x of pv.list) items.push({ html: `<div class="ms-k">${x.done ? '★' : '・'}${esc(x.text)}</div><div class="ms-note">${x.now}/${x.need}</div>`, value: null, cls: 'ms-stat' });
      } else items.push({ html: '<div class="ms-note">まだありません。</div>', value: null, cls: 'ms-stat ms-wide' });
      items.push({ header: true, label: 'いっしょにたおしたボス' });
      if (r.bosses.length) for (const b of r.bosses) items.push(stat(b.name, `${b.n}回`));
      else items.push({ html: '<div class="ms-note">まだいません。</div>', value: null, cls: 'ms-stat ms-wide' });
      items.push({ label: '← もどる', value: { act: 'back' }, cls: 'ms-backrow' });
      return items;
    }

    // ───── しょうごうを えらぶ ─────
    function wearItems() {
      const me = data.me;
      const items = [{ header: true, label: 'つけるしょうごうを選ぶ（チャットの名前の横に出る）' }];
      for (const t of me.titles) items.push({ html: `<div class="ms-big">${esc(t.title)}</div><div class="ms-note">${t.n}週でもらった。スタンプ「${esc(t.stamp)}」</div>`, right: me.wear === t.n ? 'つけている' : '', value: { act: 'setWear', n: t.n }, cls: 'ms-info' });
      items.push({ html: '<div class="ms-big">つけない</div>', right: me.wear ? '' : '今', value: { act: 'setWear', n: 0 }, cls: 'ms-info' });
      return items;
    }

    function show(p) {
      page = p;
      closeBtn.textContent = p === 'main' ? '✕ 閉じる' : '← もどる';
      title.textContent = p === 'record' ? '家族の記録' : '家族ミッション';
      sub.textContent = data?.week ? `のこり${data.week.days}日` : '';
      if (p === 'record' && data?.record) {
        makeList(recordItems(), -1, (it) => { if (it.value?.act === 'back') show('main'); });
        body.scrollTop = 0;
        return;
      }
      if (p === 'wear' && data?.me) {
        makeList(wearItems(), -1, (it) => act(it.value));
        return;
      }
      page = 'main';
      makeList(mainItems(), mainIdx, (it, i) => {
        mainIdx = i;
        act(it.value);
      });
    }

    document.getElementById('ui').append(back, box);
    menu.popupOpen = true;
    show('main');
    // いちばん 新しい ようすを 聞いて かきなおす
    fetchMissions(g).then((m) => {
      if (!box.isConnected) return;
      if (!m || m.timeout) {
        if (!data) {
          data = { timeout: true };
          show(page);
        }
        return;
      }
      data = m;
      show(page);
    });
  });
}
