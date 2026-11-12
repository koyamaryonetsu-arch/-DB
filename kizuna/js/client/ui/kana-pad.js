// 第62回: コントローラーだけで 名前などを 書く 文字ばん（ひらがな・カタカナ・英数）
//   askText（ui/dom.js）が、コントローラーが つながって いる ときに 出す。タップ・クリックでも おせる
//   十字キー … えらぶ　A … 入れる　B … 1文字 けす（何も 書いて いない ときは やめる）
//   「゛゜小」… さいごの 文字を が→か・は→ば→ぱ・つ→っ などに かえる
import { el } from './dom.js?v=d13bba1204d4';

const HIRA_ROWS = [
  'あかさたなはまやらわ',
  'いきしちにひみゆりを',
  'うくすつぬふむよるん',
  'えけせてねへめゃれー',
  'おこそとのほもゅろょ',
];
const toKata = (s) => s.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));
const KATA_ROWS = HIRA_ROWS.map(toKata);
const ABC_ROWS = [
  'ABCDEFGHIJ',
  'KLMNOPQRST',
  'UVWXYZ!?・ー',
  '0123456789',
  'abcdefghij',
];
const NUM_ROWS = ['12345', '67890'];
export const PAD_PAGES = { hira: HIRA_ROWS, kata: KATA_ROWS, abc: ABC_ROWS, num: NUM_ROWS };

// さいごの 文字の かわりかた（゛゜小）。ひとまわりで もとに もどる
const CYCLES = [
  'かが', 'きぎ', 'くぐ', 'けげ', 'こご', 'さざ', 'しじ', 'すず', 'せぜ', 'そぞ', 'ただ', 'ちぢ', 'つっづ', 'てで', 'とど',
  'はばぱ', 'ひびぴ', 'ふぶぷ', 'へべぺ', 'ほぼぽ', 'あぁ', 'いぃ', 'うぅゔ', 'えぇ', 'おぉ', 'やゃ', 'ゆゅ', 'よょ', 'わゎ',
];
const NEXT = new Map();
for (const c of [...CYCLES, ...CYCLES.map(toKata)]) {
  const a = [...c];
  a.forEach((ch, i) => NEXT.set(ch, a[(i + 1) % a.length]));
}
// 「゛゜小」を おした ときの さいごの 文字（かわらない 文字は そのまま）
export function cycleChar(ch) {
  return NEXT.get(ch) || ch;
}
export function cycleLast(text) {
  const a = [...String(text || '')];
  if (!a.length) return String(text || '');
  a[a.length - 1] = cycleChar(a[a.length - 1]);
  return a.join('');
}

// 文字ばんの キー（行ごと）。page: hira / kata / abc / num
export function padKeys(page, numeric = false) {
  const rows = (numeric ? NUM_ROWS : PAD_PAGES[page] || HIRA_ROWS).map((r) => [...r].map((ch) => ({ ch, label: ch })));
  const tools = numeric
    ? [{ act: 'del', label: '1字けす' }, { act: 'ok', label: '決定' }, { act: 'cancel', label: 'やめる' }]
    : [
      { act: 'page', page: page === 'hira' ? 'kata' : 'hira', label: page === 'hira' ? 'カナ' : 'ひら' },
      { act: 'page', page: page === 'abc' ? 'hira' : 'abc', label: page === 'abc' ? 'かな' : '英数' },
      { act: 'cycle', label: '゛゜小' },
      { act: 'del', label: '1字けす' },
      { act: 'ok', label: '決定' },
      { act: 'cancel', label: 'やめる' },
    ];
  return [...rows, tools];
}

// 十字キーの 動き（rows … キーの 行。r・c … 今の 場所）→ 新しい [r, c]（はしは 反対へ 回る）
export function padMove(rows, r, c, dir) {
  const n = rows.length;
  if (dir === 'left' || dir === 'right') {
    const len = rows[r].length;
    return [r, (c + (dir === 'right' ? 1 : -1) + len) % len];
  }
  const nr = (r + (dir === 'down' ? 1 : -1) + n) % n;
  // 行の 長さが ちがう ときは、同じ 横の 位置に ちかい キーへ
  const ratio = rows[r].length > 1 ? c / (rows[r].length - 1) : 0;
  const nc = rows[nr].length === rows[r].length ? c : Math.round(ratio * (rows[nr].length - 1));
  return [nr, Math.min(nc, rows[nr].length - 1)];
}

// 文字ばんを つくる。field … 書く input。max … 文字数。onDone(v) … 決定（文字）・やめる（null）
export function kanaPad(field, { max = 8, numeric = false, onDone, sound } = {}) {
  // はじめの 名前が カタカナなら カタカナの 面から（魔物の 名前など）
  let page = /[ァ-ヶ]/.test(field.value) ? 'kata' : 'hira';
  // はじめは「決定」の 上（そのままの 名前で よければ A だけで 決まる）
  let r = -1, c = 0;
  let rows = [];
  const root = el('div', { class: `kana-pad ${numeric ? 'num' : ''}` });
  const len = () => [...field.value].length;
  const put = (ch) => {
    if (len() >= max) { sound?.('buzz'); return; }
    field.value += ch;
    sound?.('cursor');
  };
  const act = (k) => {
    if (k.ch) return put(k.ch);
    if (k.act === 'page') { page = k.page; sound?.('cursor'); return draw(); }
    if (k.act === 'cycle') { field.value = cycleLast(field.value); sound?.('cursor'); return; }
    if (k.act === 'del') { field.value = [...field.value].slice(0, -1).join(''); sound?.('cancel'); return; }
    if (k.act === 'ok') return onDone?.(field.value.trim());
    if (k.act === 'cancel') return onDone?.(null);
  };
  const draw = () => {
    rows = padKeys(page, numeric);
    if (r < 0) { r = rows.length - 1; c = rows[r].findIndex((k) => k.act === 'ok'); }
    r = Math.min(r, rows.length - 1);
    c = Math.min(c, rows[r].length - 1);
    root.innerHTML = '';
    btns = rows.map((row, ri) => {
      const line = el('div', { class: `kp-row ${ri === rows.length - 1 ? 'kp-tools' : ''}` });
      const bs = row.map((k, ci) => el('button', { class: `btn kp-key ${k.act ? 'kp-act' : ''} ${k.act === 'ok' ? 'primary' : ''}`, text: k.label, onclick: (e) => { e?.preventDefault?.(); r = ri; c = ci; mark(); act(k); } }));
      line.append(...bs);
      root.append(line);
      return bs;
    });
    mark();
  };
  let btns = [];
  const mark = () => {
    for (const bs of btns) for (const b of bs) b.classList?.remove('cur');
    btns[r]?.[c]?.classList?.add('cur');
  };
  // コントローラー・キーボードの 矢印。true … つかった
  const nav = (a) => {
    if (a === 'up' || a === 'down' || a === 'left' || a === 'right') {
      [r, c] = padMove(rows, r, c, a);
      sound?.('cursor');
      mark();
      return true;
    }
    if (a === 'a') { act(rows[r][c]); return true; }
    if (a === 'b') {
      if (len()) act({ act: 'del' });
      else onDone?.(null);
      return true;
    }
    return false;
  };
  draw();
  return { root, nav, get page() { return page; }, get pos() { return [r, c]; } };
}
