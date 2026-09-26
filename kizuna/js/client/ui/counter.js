// お店・教会の カウンター（ドラクエ風: 店の人の ことばと「はい／いいえ」で すすむ）
//
// まどの ならび:
//   うえ: 店の なまえ・所持金・✕閉じる
//   まんなか: ひだり＝品物や コマンド、みぎ＝せつめいと「だれが どう かわるか」
//   した: 店の人の ことば（はい／いいえ は ここの みぎに 出る）
import { el, ListMenu } from './dom.js?v=5d38639d0719';
import { ITEMS, sellPrice } from '../../shared/data/items.js?v=5d38639d0719';
import { MONSTERS } from '../../shared/data/monsters.js?v=5d38639d0719';
import { JOBS } from '../../shared/data/jobs.js?v=5d38639d0719';
import { computeStats, canEquipChar, itemCount } from '../../shared/stats.js?v=5d38639d0719';
import { itemStats, whoCanEquip } from './info.js?v=5d38639d0719';
import { faceURL } from '../field.js?v=5d38639d0719';
import { boardIconURL } from '../render/boards.js?v=5d38639d0719';

const TYPE_MS = 18;
export const EQUIP_TYPES = ['weapon', 'armor', 'shield', 'head', 'acc'];

export class Counter {
  constructor(game, { title, keeper, icon, cls = '' }) {
    this.game = game;
    this.keeper = keeper;
    this.closed = false;
    this.waiters = new Set(); // とじた とき に とく まち
    this.hooks = new Set(); // とじた とき に よぶ かたづけ
    this.back = el('div', { class: 'modal-back', onclick: () => this.userClose() });
    this.goldEl = el('span', { class: 'ct-gold' });
    const titleEl = el('span', { class: 'gold ct-title' }, icon ? el('img', { class: 'ct-icon', src: icon, alt: '' }) : null, title);
    this.head = el('div', { class: 'win svc-head' }, titleEl, this.goldEl,
      el('button', { class: 'btn closebtn', text: '✕ 閉じる', 'aria-label': '閉じる', onclick: () => this.userClose() }));
    this.listBox = el('div', { class: 'win ct-list scroll' });
    this.infoBox = el('div', { class: 'win ct-info scroll' });
    this.speaker = el('div', { class: 'ct-speaker', text: keeper });
    this.text = el('div', { class: 'ct-text' });
    this.choiceBox = el('div', { class: 'ct-choice' });
    this.msg = el('div', { class: 'win ct-msg', onclick: () => this.skipType?.() }, this.speaker, this.text, this.choiceBox);
    this.root = el('div', { class: `panel counter-panel ${cls}` }, this.head, el('div', { class: 'ct-body' }, this.listBox, this.infoBox), this.msg);
    document.getElementById('ui').append(this.back, this.root);
    this.updGold();
  }

  updGold() {
    this.goldEl.textContent = `所持金 ${this.game.me?.gold ?? 0} G`;
  }

  // とじる ときの かたづけを とうろく（もどりちで けせる）
  hook(fn) {
    this.hooks.add(fn);
    return () => this.hooks.delete(fn);
  }

  // まつ（とじたら すぐ とける）
  wait(fn) {
    if (this.closed) return Promise.resolve(fn(null));
    return new Promise((resolve) => {
      const done = (v) => {
        if (!this.waiters.has(done)) return;
        this.waiters.delete(done);
        resolve(v);
      };
      this.waiters.add(done);
      fn(done);
    });
  }

  // 店の人の ことば（すこしずつ 出る。タップで すぐ ぜんぶ）。narr: 店の人で なく ナレーション
  say(text, { narr = false } = {}) {
    clearInterval(this.typing);
    this.speaker.hidden = narr;
    this.choiceBox.innerHTML = '';
    if (this.closed) return Promise.resolve();
    const chars = [...text];
    let i = 0;
    this.text.textContent = '';
    return this.wait((done) => {
      if (!done) return;
      // A・B で すぐに ぜんぶ 出す
      const h = { onNav: (a) => { if (a === 'a' || a === 'b') finish(); } };
      const unhook = this.hook(() => finish());
      const finish = () => {
        unhook();
        this.game.input.pop(h);
        clearInterval(this.typing);
        this.typing = null;
        this.skipType = null;
        this.text.textContent = text;
        done();
      };
      this.game.input.push(h);
      this.skipType = finish;
      this.typing = setInterval(() => {
        i += 2;
        this.text.textContent = chars.slice(0, i).join('');
        if (i % 6 === 0) this.game.audio.sfx('talk');
        if (i >= chars.length) finish();
      }, TYPE_MS);
    });
  }

  // ボタンか タップで すすむ（ms たつと じどうで すすむ）
  tap(ms = 0) {
    return this.wait((done) => {
      if (!done) return;
      const more = el('div', { class: 'ct-more', text: '▼' });
      this.msg.append(more);
      let t = null;
      const h = { onNav: (a) => { if (a === 'a' || a === 'b') end(); } };
      const unhook = this.hook(() => end());
      const end = () => {
        unhook();
        clearTimeout(t);
        this.game.input.pop(h);
        this.msg.removeEventListener('click', end);
        more.remove();
        done();
      };
      this.game.input.push(h);
      this.msg.addEventListener('click', end);
      if (ms) t = setTimeout(end, ms);
    });
  }

  // えらぶ（box: 'list' か 'info'）。もどる・B・とじる は null
  pick(items, { box = 'list', onMove, back = 'もどる', start = null } = {}) {
    return this.wait((done) => {
      if (!done) return null;
      const target = box === 'info' ? this.infoBox : this.listBox;
      const m = new ListMenu(this.game.input, {
        items,
        back,
        sound: (x) => this.game.audio.sfx(x),
        onMove: (it) => onMove?.(it),
        onSelect: (it) => finish(it),
        onCancel: () => finish(null),
      });
      if (start !== null && start >= 0 && start < items.length && !items[start].header) {
        m.idx = start;
        m.render();
      }
      const unhook = this.hook(() => finish(null));
      const finish = (v) => {
        unhook();
        m.blur();
        target.classList.remove('active');
        done(v);
      };
      target.innerHTML = '';
      target.classList.add('active');
      target.append(m.root);
      m.focus();
    });
  }

  // はい／いいえ など（ことばの みぎに 出る）。B は さいごの えらびし。とじたら -1
  async ask(text, options = ['はい', 'いいえ']) {
    await this.say(text);
    return this.wait((done) => {
      if (!done) return -1;
      const m = new ListMenu(this.game.input, {
        items: options.map((o, i) => ({ label: o, value: i })),
        back: null,
        sound: (x) => this.game.audio.sfx(x),
        onSelect: (it) => finish(it.value),
        onCancel: () => finish(options.length - 1),
      });
      const unhook = this.hook(() => finish(-1));
      const finish = (v) => {
        unhook();
        m.blur();
        this.choiceBox.innerHTML = '';
        done(v);
      };
      this.choiceBox.innerHTML = '';
      this.choiceBox.append(m.root);
      m.focus();
    }).then((v) => (v === null || v === undefined ? -1 : v));
  }

  // いくつ？（◀ ▶ か ＋－ で かえる）。やめる・とじる は 0
  async qty(text, max, price, note = '') {
    await this.say(text);
    return this.wait((done) => {
      if (!done) return 0;
      let q = 1;
      const val = el('div', { class: 'ct-qty-val' });
      const upd = () => { val.textContent = `◀ ${q}個 ▶　${price * q}G`; };
      const minus = el('button', { class: 'btn', text: '－', onclick: () => { q = q > 1 ? q - 1 : max; this.game.audio.sfx('cursor'); upd(); } });
      const plus = el('button', { class: 'btn', text: '＋', onclick: () => { q = q < max ? q + 1 : 1; this.game.audio.sfx('cursor'); upd(); } });
      const ok = el('button', { class: 'btn primary', text: '決定', onclick: () => finish(q) });
      const no = el('button', { class: 'btn', text: 'やめる', onclick: () => finish(0) });
      const h = {
        onNav: (a) => {
          if (a === 'a') return finish(q);
          if (a === 'b') return finish(0);
          if (a === 'left' || a === 'down') q = q > 1 ? q - 1 : max;
          else if (a === 'right' || a === 'up') q = q < max ? q + 1 : 1;
          else return;
          this.game.audio.sfx('cursor');
          upd();
        },
      };
      const unhook = this.hook(() => finish(0));
      const finish = (v) => {
        unhook();
        this.game.input.pop(h);
        this.choiceBox.innerHTML = '';
        this.choiceBox.classList.remove('wide');
        if (v) this.game.audio.sfx('confirm');
        done(v);
      };
      upd();
      this.choiceBox.innerHTML = '';
      this.choiceBox.classList.add('wide');
      this.choiceBox.append(el('div', { class: 'ct-qty' }, val, note ? el('div', { class: 'small muted', text: note }) : null,
        el('div', { class: 'row' }, minus, plus, no, ok)));
      this.game.input.push(h);
    }).then((v) => v || 0);
  }

  info(node) {
    this.infoBox.innerHTML = '';
    if (node) this.infoBox.append(node);
  }

  list(node) {
    this.listBox.innerHTML = '';
    if (node) this.listBox.append(node);
  }

  userClose() {
    if (this.closed) return;
    this.game.audio.sfx('cancel');
    this.close();
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    clearInterval(this.typing);
    for (const f of [...this.hooks]) f();
    this.hooks.clear();
    for (const w of [...this.waiters]) w(null);
    this.back.remove();
    this.root.remove();
  }
}

// ───────────── だれが どう かわるか ─────────────
const STAT_NAMES = [['atk', '攻撃力'], ['dfn', '守備力'], ['agi', '素早さ'], ['mag', '攻撃魔力'], ['heal', '回復魔力'], ['maxHp', '最大HP'], ['maxMp', '最大MP']];

// じぶんと じぶんの なかま（いま パーティーに いる）。家族の キャラは じぶんで 買いものを する
export function myTeam(game) {
  const me = game.me;
  const out = [{ key: 'self', name: me.name, char: me, face: faceURL({ look: me.look, job: me.job, eq: me.equip }), kind: JOBS[me.job]?.name || '' }];
  for (const x of game.party?.supports || []) {
    if (x.owner !== me.id || x.kind === 'family') continue;
    const char = {
      name: x.name, level: x.level, job: x.job, jobs: x.jobs || {}, equip: x.equip || {}, seeds: x.seeds || {},
      species: x.species || undefined, plus: x.plus || 0, bonus: x.bonus || undefined,
    };
    out.push({
      key: x.key, name: x.name, char,
      face: faceURL({ look: x.look, job: x.job, eq: x.equip, mon: x.species || undefined }),
      kind: x.species ? MONSTERS[x.species]?.name || '' : JOBS[x.job]?.name || '',
    });
  }
  return out;
}

// 1人ぶん: 装備したら どう なるか
export function compareOne(member, id) {
  const it = ITEMS[id];
  const c = member.char;
  const slot = it.type;
  const can = canEquipChar(c, id);
  const cur = c.equip?.[slot] || null;
  if (!can) return { ...member, can: false, same: false, cur };
  const before = computeStats(c);
  const after = computeStats({ ...c, equip: { ...(c.equip || {}), [slot]: id } });
  const diffs = STAT_NAMES.map(([k, n]) => ({ k, n, b: before[k], a: after[k], d: after[k] - before[k] }));
  let mainKey = slot === 'weapon' ? 'atk' : 'dfn';
  if (slot === 'acc') mainKey = [...diffs].filter((x) => x.d).sort((p, q) => Math.abs(q.d) - Math.abs(p.d))[0]?.k || 'atk';
  const main = diffs.find((x) => x.k === mainKey);
  const extras = diffs.filter((x) => x.k !== mainKey && x.d);
  return { ...member, can: true, same: cur === id, cur, main, extras };
}

export function compareTeam(game, id) {
  return myTeam(game).map((m) => compareOne(m, id));
}

const arrow = (d) => (d > 0 ? `↑${d}` : d < 0 ? `↓${-d}` : '＝');
const arrowCls = (d) => (d > 0 ? 'up' : d < 0 ? 'down' : 'muted');

// ならびの 1行（みるだけ）: かお・なまえ・かわる 強さ（せまい ときは おりかえす）
function compareRow(r) {
  const top = el('div', { class: 'cmp-top' }, el('span', { class: 'nm', text: r.name }));
  if (!r.can) top.append(el('span', { class: 'muted', text: '装備できない' }));
  else if (r.same) top.append(el('span', { class: 'tag e', text: 'E' }), el('span', { class: 'muted', text: '装備している' }));
  else {
    top.append(el('span', { class: 'st', text: `${r.main.n} ${r.main.b}→${r.main.a}` }), el('span', { class: `ar ${arrowCls(r.main.d)}`, text: arrow(r.main.d) }));
    const sub = r.extras.map((x) => `${x.n}${x.d > 0 ? '+' : ''}${x.d}`);
    sub.push(`今: ${r.cur ? ITEMS[r.cur].name : 'なし'}`);
    top.append(el('span', { class: 'cmp-sub', text: sub.join('　') }));
  }
  return el('div', { class: `cmp-row ${r.can ? '' : 'dis'}` }, el('img', { class: 'face', src: r.face, alt: '' }), top);
}

// 品物の せつめい ＋ みんなの くらべ
export function itemInfo(game, id, { sell = false } = {}) {
  const it = ITEMS[id];
  if (!it) return null;
  const box = el('div', { class: 'ct-item' });
  box.append(el('div', { class: 'hd' }, el('span', { class: 'gold', text: it.name }), el('span', { class: 'st', text: itemStats(id) })));
  box.append(el('div', { class: 'detail', text: it.desc || '' }));
  if (EQUIP_TYPES.includes(it.type) && !sell) {
    const team = compareTeam(game, id);
    box.append(el('div', { class: 'cmp-head', text: '装備すると、こう変わる' }));
    for (const r of team) box.append(compareRow(r));
    if (!team.some((r) => r.can)) box.append(el('div', { class: 'detail', text: whoCanEquip(id) }));
  } else {
    box.append(el('div', { class: 'small', text: `持っている数: ${itemCount(game.me, id)}` }));
    if (sell && sellPrice(id) <= 0) box.append(el('div', { class: 'small warn', text: 'これは引き取ってもらえない' }));
  }
  return box;
}

// 「どなたが 装備しますか？」の えらびし
export function whoItems(rows) {
  return rows.map((r) => ({
    value: r.key,
    face: r.face,
    label: r.name,
    disabled: !r.can || r.same,
    right: !r.can ? '装備できない' : r.same ? 'E 装備している' : `${r.main.n} ${r.main.b}→${r.main.a} ${arrow(r.main.d)}`,
    rightCls: r.can && !r.same ? arrowCls(r.main.d) : '',
  }));
}

export { boardIconURL };
