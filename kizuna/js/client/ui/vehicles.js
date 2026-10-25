// 乗り物屋（カウンター）と メニューの「乗り物」（第37回。きまりは shared/data/vehicles.js）
//   乗り物屋: たなの 乗り物を えらぶと みぎに 見本（自分が 乗って くるくる 回る）→ 買う → 「さっそく乗る？」
//   メニュー: 持っている 乗り物 と「乗らない」から えらぶ（走ると 乗る。速さは 同じ）
import { el, esc } from './dom.js?v=f2f4be342cfa';
import { Counter } from './counter.js?v=f2f4be342cfa';
import { request } from './shop.js?v=f2f4be342cfa';
import { boardIconURL } from '../render/boards.js?v=f2f4be342cfa';
import { vehicleCanvas } from '../render/vehicle-art.js?v=f2f4be342cfa';
import { heroLookKey } from '../render/hero.js?v=f2f4be342cfa';
import { equipKey } from '../render/chars.js?v=f2f4be342cfa';
import { playerSprite } from '../field.js?v=f2f4be342cfa';
import { shownEquip } from '../../shared/look-equip.js?v=f2f4be342cfa';
import { VEHICLES, vehicleShelf, ownedVehicles, chosenVehicle } from '../../shared/data/vehicles.js?v=f2f4be342cfa';

const DIRS = ['down', 'left', 'up', 'right'];
const RIDE_NOTE = '走っている時だけ乗る（歩く時はいつもの絵）。速さは同じ。\n乗っている間は、仲間もいっしょに乗っている。';

let styled = false;
function styles() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  document.head.append(el('style', { id: 'vehicle-css', text: `
.veh-pv { display: flex; flex-direction: column; align-items: center; gap: 0.3em; }
.veh-pv canvas { width: 100%; max-width: 200px; image-rendering: pixelated; background: linear-gradient(#3d6b3a 0 70%, #335a31 70%); border-radius: 6px; }
.veh-pv .nm { color: #ffd66b; }
.veh-pv .ds { white-space: pre-wrap; font-size: var(--fs-small); }
.veh-pv .nt { white-space: pre-wrap; font-size: var(--fs-small); color: #a8a6c0; }
.menu .tag.veh-now { color: #9fe8a8; border-color: rgba(159, 232, 168, 0.6); }
.menu .tag.veh-job { color: #ffb0d8; border-color: rgba(255, 176, 216, 0.55); }
.menu .tag.veh-gift { color: #ffe08a; border-color: rgba(255, 224, 138, 0.6); }
.veh-view .detail { white-space: pre-wrap; }
` }));
}

// 見本（自分が 乗って くるくる 回る。id が null なら 歩く すがた）
export function vehiclePreview(game) {
  styles();
  const cv = el('canvas', { width: 240, height: 150 });
  const nm = el('div', { class: 'nm' });
  const ds = el('div', { class: 'ds' });
  const nt = el('div', { class: 'nt', text: RIDE_NOTE });
  const box = el('div', { class: 'veh-pv' }, cv, nm, ds, nt);
  let id = null, t = 0;
  const draw = () => {
    const me = game.me;
    if (!me) return;
    const eq = shownEquip(me);
    const dir = DIRS[Math.floor(t / 6) % 4];
    const x = cv.getContext('2d');
    x.clearRect(0, 0, cv.width, cv.height);
    x.imageSmoothingEnabled = false;
    const key = `${heroLookKey(me.look)}:${me.job}:${equipKey(eq, me.job)}`;
    const c = id ? vehicleCanvas(id, key, (d, f) => playerSprite(me.look, me.job, d, f, eq), dir, t % 3)
      : playerSprite(me.look, me.job, dir, t % 2, eq);
    if (!c) return;
    // res 4 の 絵を 1せかいドット＝3がめんドット で（はみ出す 時は ちぢめる）
    let k = 3 / (c.res || 4);
    k = Math.min(k, (cv.width - 8) / c.width, (cv.height - 8) / c.height);
    const w = c.width * k, h = c.height * k;
    x.fillStyle = 'rgba(0,0,0,0.28)';
    x.beginPath();
    x.ellipse(cv.width / 2, cv.height - 14, Math.max(14, w * 0.36), 5, 0, 0, Math.PI * 2);
    x.fill();
    x.drawImage(c, Math.round((cv.width - w) / 2), Math.round(cv.height - 12 - h + 3 * 3 / 2), Math.round(w), Math.round(h));
  };
  const timer = setInterval(() => { t++; draw(); }, 140);
  return {
    box,
    set(v) {
      id = v && VEHICLES[v] ? v : null;
      nm.textContent = id ? VEHICLES[id].name : '乗らない';
      ds.textContent = id ? VEHICLES[id].desc : 'いつものように、自分の足で走る。';
      draw();
    },
    stop() { clearInterval(timer); },
  };
}

// 職業に ちなんだ 乗り物の しるし
const jobTag = (id) => (VEHICLES[id]?.gift ? '<span class="tag veh-gift">もらった物</span>' : VEHICLES[id]?.jobs ? '<span class="tag veh-job">職業</span>' : '');

// ───────────── 乗り物屋 ─────────────
export async function vehicleShopUI(game, data) {
  const ct = new Counter(game, { title: data.name || '乗り物屋', keeper: data.keeper || '乗り物屋', icon: boardIconURL('vehicle'), cls: 'vehicle-panel' });
  const pv = vehiclePreview(game);
  ct.hook(() => pv.stop());
  let shelf = data.shelf || vehicleShelf(game.me);
  let owned = new Set(data.owned || ownedVehicles(game.me));
  let line = data.hello || 'いらっしゃい！';
  let last = 0;
  const AGAIN = 'ほかにも見ていくかい？';
  while (!ct.closed) {
    await ct.say(line);
    const items = [
      ...shelf.map((id) => ({
        value: id,
        label: VEHICLES[id].name,
        html: `${esc(VEHICLES[id].name)}${jobTag(id)}`,
        right: owned.has(id) ? (VEHICLES[id].gift ? 'もらった物' : '持っている') : `${VEHICLES[id].price}G`,
        rightCls: owned.has(id) ? 'muted' : 'gold',
      })),
      { label: 'やめる', value: 'exit' },
    ];
    pv.set(shelf[Math.min(last, shelf.length - 1)] || null);
    ct.info(pv.box);
    const pick = await ct.pick(items, { back: null, start: last, onMove: (it) => { if (it?.value && it.value !== 'exit') pv.set(it.value); } });
    if (ct.closed) return;
    if (!pick || pick.value === 'exit') break;
    last = items.findIndex((x) => x.value === pick.value);
    const id = pick.value, v = VEHICLES[id];
    pv.set(id);
    if (owned.has(id)) {
      const yes = await ct.ask(`${v.name}は、もう持っているね。\n今から、これに乗っていくかい？`);
      if (ct.closed) return;
      if (yes === 0) {
        const res = await request(game, { kind: 'vehicles', action: 'ride', id });
        line = res.ok ? `よし、${v.name}だね！\n走ると乗れるよ。${AGAIN}` : res.text || AGAIN;
      } else line = AGAIN;
      continue;
    }
    if ((game.me.gold || 0) < v.price) {
      await ct.say(`${v.name}は${v.price}ゴールドだよ。\nおや？ゴールドが足りないみたいだね。`);
      await ct.tap(1800);
      line = AGAIN;
      continue;
    }
    const yes = await ct.ask(`${v.name}は${v.price}ゴールドだよ。\n買っていくかい？`);
    if (ct.closed) return;
    if (yes !== 0) { line = AGAIN; continue; }
    const res = await request(game, { kind: 'vehicles', action: 'buy', id });
    ct.updGold();
    if (!res.ok) {
      await ct.say(res.text || 'おや？何かおかしいみたいだね。');
      await ct.tap(1800);
      line = AGAIN;
      continue;
    }
    game.audio.sfx('buff');
    if (res.shelf) shelf = res.shelf;
    if (res.owned) owned = new Set(res.owned);
    const ride = await ct.ask(`まいどあり！${v.name}は、ずっと君の物だよ。\nさっそく乗っていくかい？`);
    if (ct.closed) return;
    if (ride === 0) {
      const r2 = await request(game, { kind: 'vehicles', action: 'ride', id });
      line = r2.ok ? `いってらっしゃい！\n走ると${v.name}に乗れるよ。\nメニューの「乗り物」で、いつでも乗りかえられるからね。` : r2.text || AGAIN;
    } else line = 'メニューの「乗り物」で、いつでも乗れるからね。\nほかにも見ていくかい？';
  }
  if (ct.closed) return;
  ct.list(null);
  ct.info(null);
  await ct.say('またおいで！安全運転でね。');
  await ct.tap(1400);
  ct.close();
}

// ───────────── メニューの「乗り物」 ─────────────
// fm … FieldMenu。active … えらべる（false なら せつめいだけ）
export function vehicleMenuView(fm, active) {
  styles();
  const g = fm.game;
  const c = g.me;
  const box = el('div', { class: 'veh-view' });
  const own = ownedVehicles(c);
  const now = chosenVehicle(c);
  if (!active) {
    box.append(el('div', { class: 'muted', text: `走る時に乗る乗り物を選ぶ。\n今：${now ? VEHICLES[now].name : '乗らない'}${own.length ? '' : '\n（まだ乗り物を持っていない。ルミナの町の乗り物屋で買える）'}` }));
    return box;
  }
  const pv = vehiclePreview(g);
  const stop = () => pv.stop();
  const items = [
    { value: '__none', label: '乗らない', html: `乗らない${now ? '' : '<span class="tag veh-now">今</span>'}` },
    ...own.map((id) => ({ value: id, label: VEHICLES[id].name, html: `${esc(VEHICLES[id].name)}${id === now ? '<span class="tag veh-now">今</span>' : ''}${jobTag(id)}` })),
  ];
  if (!own.length) items.push({ header: true, label: '（まだ乗り物を持っていない。ルミナの町の乗り物屋で買える）' });
  const m = fm.mkSub({
    items,
    start: Math.max(0, items.findIndex((x) => x.value === (now || '__none'))),
    onMove: (it) => { if (it?.value) pv.set(it.value === '__none' ? null : it.value); },
    onSelect: async (it) => {
      const id = it.value === '__none' ? null : it.value;
      if (id === now) return;
      fm.sub.blur();
      await fm.menuCall({ t: 'menu', action: 'vehicle', id });
      stop();
      fm.redraw();
    },
    onCancel: () => { stop(); fm.back(); },
  });
  pv.set(now);
  box.append(m.root, pv.box);
  // メニューを とじた ときも 止める
  const obs = setInterval(() => { if (!box.isConnected) { stop(); clearInterval(obs); } }, 1000);
  return box;
}
