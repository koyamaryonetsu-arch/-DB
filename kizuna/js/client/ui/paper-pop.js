// 第76回: お仕事いらい板の はり紙を 大きな まど 1まいで 見せる（家族の ねがい: もっと 大きく、見やすく わかりやすく）
//   中み（p）は shared/data/sidequests-family.js の boardPaper:
//     { name, paper, town, where, who, job, jobs: [系統の 職業の 名前], has, pro, rewards: [{ kind, id, name, n }], gold, medals, state, ask }
//   下の 大きな ボタン（うける／やめる など）で えらぶ。キーボード・ゲームパッド（左右・上下・決定・もどる）・タッチで うごく。
//   見ている だけの 人（spectator）は 少しの 間 はり紙を 見せて とじる
import { el, ListMenu, esc } from './dom.js?v=2e6dc0959ea0';
import { rareNameHtml } from './rarity.js?v=2e6dc0959ea0';
import { ITEMS } from '../../shared/data/items.js?v=2e6dc0959ea0';

const KIND_NAMES = { acc: 'アクセサリー', vehicle: '乗り物', goods: '道具・素材' };
const KIND_ICONS = { acc: '◆', vehicle: '▶', goods: '●' };

function section(cls, title, ...kids) {
  return el('section', { class: `pp-sec ${cls}` }, el('h3', { class: 'pp-h', text: title }), ...kids);
}

export function paperBody(p) {
  const top = el('div', { class: 'pp-top' },
    el('span', { class: 'pp-kind', text: 'お仕事いらい' }),
    p.town ? el('span', { class: 'pp-town', text: p.town }) : null,
    p.state ? el('span', { class: `pp-state ${p.state}`, text: p.state === 'done' ? 'すんだ' : '受けている' }) : null);
  const title = el('h2', { class: 'pp-title', text: `「${p.name}」` });
  const ask = el('div', { class: 'pp-paper', text: p.paper || '' });
  const where = section('pp-where', '会う人・場所',
    el('div', { class: 'pp-who', text: p.who || '' }),
    el('div', { class: 'pp-place', text: p.where || '' }));
  const has = el('span', { class: `pp-has ${p.has ? 'yes' : 'no'}`, text: p.has ? `○いる${p.pro ? `（${p.pro}）` : ''}` : '×いない' });
  const jobs = section('pp-job', '解決できそうな職業',
    el('div', { class: 'pp-jobline' }, el('span', { class: 'pp-jobname', text: `${p.job}の系統` }), has),
    el('div', { class: 'pp-chips' }, ...(p.jobs || []).map((n) => el('span', { class: 'pp-chip', text: n }))),
    el('div', { class: 'pp-note', text: p.has ? 'この職業の人が、パーティーにいる。だいじょうぶ！' : 'この職業の人が、パーティーにひとりいればだいじょうぶ（酒場の仲間や、家族の仲間でもいいよ）' }));
  const rows = (p.rewards || []).map((r) => {
    const name = r.kind === 'vehicle' || !ITEMS[r.id] ? esc(r.name) : rareNameHtml(r.id, r.name);
    return el('li', { class: `pp-rw ${r.kind}` },
      el('span', { class: `pp-ic ${r.kind}`, text: KIND_ICONS[r.kind] || '●' }),
      el('span', { class: 'pp-rn', html: `${name}${r.n > 1 ? `<span class="pp-n">×${r.n}</span>` : ''}` }),
      el('span', { class: 'pp-rk', text: KIND_NAMES[r.kind] || '' }));
  });
  rows.push(el('li', { class: 'pp-rw gold' }, el('span', { class: 'pp-ic gold', text: 'G' }), el('span', { class: 'pp-rn', text: `${p.gold}ゴールド` }), el('span', { class: 'pp-rk', text: '' })));
  rows.push(el('li', { class: 'pp-rw medal' }, el('span', { class: 'pp-ic medal', text: '★' }), el('span', { class: 'pp-rn', text: `小さなメダル${p.medals}まい` }), el('span', { class: 'pp-rk', text: '' })));
  const reward = section('pp-reward', 'ごほうび', el('ul', { class: 'pp-rws' }, ...rows));
  const body = el('div', { class: 'pp-body' }, section('pp-ask', 'たのみごと', ask), where, jobs, reward);
  // たて画面: 職業の 系統（○いる／×いない）を 題の 下にも（くわしい 一らんは 下の ほう。CSS で たて画面だけ 出す）
  const need = el('div', { class: 'pp-need' }, el('span', { class: 'pp-jobname', text: `必要な職業：${p.job}の系統` }), el('span', { class: `pp-has ${p.has ? 'yes' : 'no'}`, text: has.textContent }));
  return el('div', { class: 'pp-paperwrap' }, top, title, need, body);
}

// sp … ScriptPlayer・options … ボタンの 名前・かえす もの: えらんだ ばんごう
export function paperPop(sp, p, options, spectator, who) {
  const g = sp.game;
  return new Promise((resolve) => {
    const box = el('div', { class: `win paper-pop${spectator ? ' watch' : ''}` });
    box.append(paperBody(p));
    document.body.classList.add('big-choice');
    let menu = null;
    let timer = null;
    const finish = (v) => {
      clearTimeout(timer);
      menu?.blur();
      g.input.pop(watchH);
      box.remove();
      document.body.classList.remove('big-choice');
      if (sp.popClose === close) sp.popClose = null;
      resolve(v);
    };
    const close = () => finish(0);
    sp.popClose = close;
    // 見ている だけ: 「〜が読んでいます」。決定・もどる か 少し たつと とじる
    const watchH = { onNav: (a) => { if (a === 'a' || a === 'b') finish(0); } };
    if (spectator) {
      box.append(el('div', { class: 'pp-q muted', text: `（${who || '仲間'}が、はり紙を読んでいます…）` }));
      document.getElementById('ui').append(box);
      g.input.push(watchH);
      timer = setTimeout(() => finish(0), 6000);
      return;
    }
    const q = el('div', { class: 'pp-q', text: p.ask || '' });
    const last = options.length - 1;
    menu = new ListMenu(g.input, {
      items: options.map((o, i) => ({ label: o, value: i, cls: `pp-btn${i === 0 && options.length > 1 ? ' main' : ''}` })),
      cols: options.length > 1 ? 2 : 1,
      // 受けている はり紙は「つづける」に カーソル（まちがえて やめない ように）
      start: p.state === 'taken' ? last : -1,
      className: 'pp-btns',
      sound: (s) => g.audio.sfx(s),
      back: null,
      onSelect: (it) => finish(it.value),
      onCancel: () => { g.audio.sfx('cancel'); finish(last); },
    });
    box.append(el('div', { class: 'pp-foot' }, q, menu.root));
    document.getElementById('ui').append(box);
    menu.focus();
  });
}
