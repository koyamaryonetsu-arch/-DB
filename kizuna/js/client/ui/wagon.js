// 馬車の がめん: たたかいの「いれかえ」「総入れかえ」・メニューの「仲間」→「総入れかえ」「馬車」・酒場の 乗りかえ
//   きまりは shared/data/wagon.js と shared/world/wagon.js
import { el, esc, toast, ListMenu } from './dom.js?v=35500ffb819e';
import { WAGON_SLOTS } from '../../shared/data/wagon.js?v=35500ffb819e';
import { COMPANION_SLOTS } from '../../shared/data/companions.js?v=35500ffb819e';
import { MAPS } from '../../shared/maps/index.js?v=35500ffb819e';
import { JOBS } from '../../shared/data/jobs.js?v=35500ffb819e';
import { MONSTERS } from '../../shared/data/monsters.js?v=35500ffb819e';
import { computeStats } from '../../shared/stats.js?v=35500ffb819e';
import { faceURL } from '../field.js?v=35500ffb819e';
import { wagonSprite } from '../render/wagon.js?v=35500ffb819e';
import { request } from './shop.js?v=35500ffb819e';

const isFam = (k) => String(k || '').startsWith('fam:');
const BATTLE_MAX = 1 + COMPANION_SLOTS; // 戦う 仲間（自分を ふくめて）

// ───────────── みため ─────────────
let styled = false;
export function wagonStyles() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  const css = `
.b-mem.wagon-in { animation: wagonIn 0.55s cubic-bezier(.2,1.4,.4,1); }
@keyframes wagonIn { 0% { transform: translateY(-70%) scale(0.85); opacity: 0; } 60% { opacity: 1; } 100% { transform: translateY(0) scale(1); } }
.b-stage .wagon-fx { position: absolute; left: 3%; bottom: 3%; height: 24%; width: auto; image-rendering: pixelated; pointer-events: none; z-index: 3; animation: wagonFx 1.5s ease-in-out forwards; }
@keyframes wagonFx { 0% { transform: translateX(-120%); opacity: 1; } 30% { transform: translateX(0); } 42% { transform: translateY(-5%); } 52% { transform: translateY(0); } 75% { opacity: 1; } 100% { transform: translateX(8%); opacity: 0; } }
.wagon-view .wv-note { font-size: var(--fs-small, 0.9em); color: var(--muted); white-space: pre-line; margin: 0.4em 0; }
.wagon-view h3 { display: flex; align-items: center; gap: 0.5em; }
.wagon-view .wv-pic { height: 1.7em; width: auto; image-rendering: pixelated; }
.wagon-row .face { height: 1.8em; width: auto; vertical-align: middle; margin-right: 0.35em; image-rendering: pixelated; }
.b-cmd .menu .hdr.wg-sum { grid-column: 1 / -1; color: var(--text); border-bottom: none; padding: 0.1em 0.3em 0; font-size: var(--fs-small); white-space: normal; }
.b-cmd .menu .item.k-all .l { color: var(--accent); }
/* 総入れかえ（arrangeUI） */
.arr-back { z-index: 6; }
.arr-panel { z-index: 7; left: 50%; top: calc(var(--safe-t) + max(6px, 2vh)); transform: translateX(-50%); width: min(96vw, 760px); max-height: calc(100% - 12px - var(--safe-t) - var(--safe-b) - var(--pad-h)); background: var(--win-solid); }
.arr-panel .arr-head { position: relative; display: flex; align-items: center; gap: 0.5em; min-height: 2.4em; padding-right: 7.4em; }
.arr-panel .arr-head img { height: 1.6em; width: auto; image-rendering: pixelated; }
.arr-panel .arr-body { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: 10px; min-height: 0; flex: 1 1 auto; }
.arr-board { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 0.25em 0.6em; align-content: start; }
.arr-col { display: flex; flex-direction: column; gap: 0.22em; min-width: 0; }
.arr-col .arr-h { color: var(--accent); font-size: var(--fs-small); border-bottom: 1px dashed rgba(255, 214, 107, 0.35); padding-bottom: 0.05em; white-space: nowrap; }
.arr-col.wg .arr-h { color: #9ad8ff; border-bottom-color: rgba(154, 216, 255, 0.4); }
.arr-slot { display: flex; align-items: center; gap: 0.3em; min-height: 2.05em; padding: 0.05em 0.3em; border: 1px solid rgba(255, 255, 255, 0.16); border-radius: 7px; min-width: 0; background: rgba(255, 255, 255, 0.03); }
.arr-slot .arr-no { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 1.35em; height: 1.35em; border-radius: 50%; border: 1px solid currentColor; font-size: 0.78em; color: var(--accent); }
.arr-col.wg .arr-slot .arr-no { color: #9ad8ff; }
.arr-slot .face { height: 1.75em; width: auto; image-rendering: pixelated; flex: none; }
.arr-slot .arr-nm { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.arr-slot .arr-nm.me { color: var(--good); }
.arr-slot.empty .arr-nm { color: #6d6c88; }
.arr-slot.next { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent) inset; animation: arrNext 1s ease-in-out infinite alternate; }
@keyframes arrNext { from { background: rgba(255, 214, 107, 0.05); } to { background: rgba(255, 214, 107, 0.2); } }
.arr-q { grid-column: 1 / -1; white-space: pre-line; color: var(--text); margin: 0.35em 0 0.1em; min-height: 1.5em; }
.arr-q .hint { color: var(--muted); font-size: var(--fs-small); }
.arr-list { min-height: 0; overflow-y: auto; }
.arr-list .menu .item { min-height: 2.15em; }
.arr-list .menu .item .r.gold { color: var(--accent); }
.arr-left { display: flex; flex-direction: column; min-height: 0; }
.arr-list .menu .item .l .muted, .tavern-panel .menu .item .l .muted, .wagon-view .menu .item .l .muted { margin-left: 0.4em; }
@media (max-width: 700px) {
  .arr-panel .arr-head { min-height: 2em; padding-right: 6.6em; }
  .arr-panel .arr-body { grid-template-columns: 1fr; grid-template-rows: auto minmax(0, 1fr); gap: 4px; }
  .arr-board { gap: 0.12em 0.4em; }
  .arr-col { gap: 0.14em; }
  .arr-slot { min-height: 1.55em; padding: 0 0.25em; font-size: 0.86em; }
  .arr-slot .face { height: 1.3em; }
  .arr-q { margin: 0.15em 0 0; font-size: 0.95em; line-height: 1.35; }
  .arr-list .menu .item { min-height: 1.9em; }
  .arr-list .menu .item .face { height: 1.55em; }
}
@media (max-height: 520px) and (orientation: landscape) {
  .arr-panel { top: calc(var(--safe-t) + 4px); }
  .arr-panel .arr-body { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); grid-template-rows: none; }
  .arr-slot { min-height: 1.75em; }
  .arr-slot .face { height: 1.45em; }
  .arr-list .menu .item { min-height: 1.95em; }
}
`;
  document.head.append(el('style', { id: 'wagon-css', text: css }));
}

// 馬車の 絵（メニュー・酒場に かざる）
export function wagonPicURL(dir = 'left') {
  try { return wagonSprite(dir, 0).toDataURL(); } catch { return ''; }
}

const kindName = (x) => (x.species ? MONSTERS[x.species]?.name || '' : JOBS[x.job]?.name || '');
const faceOf = (x) => faceURL({ look: x.look, job: x.job, eq: x.equip, mon: x.species || undefined });

// じぶんの 仲間の じょうほう（key → 名前・HP など。game.me の companions から）
function mateInfo(me, key) {
  const e = (me.companions || []).find((x) => x.key === key);
  if (!e) return null;
  const ch = e.char;
  const st = computeStats(ch);
  return { key, name: ch.name, level: ch.level, job: ch.job, species: ch.species || null, look: ch.look, equip: ch.equip, hp: ch.hp, maxHp: st.maxHp, mp: ch.mp, maxMp: st.maxMp, charId: ch.id, plus: ch.plus || 0 };
}

// パーティー・馬車の 1人の じょうほう（'self'・自分の 仲間・家族の キャラ）。わからない 家族は null
export function memberInfo(g, key) {
  const me = g.me;
  if (key === 'self') {
    const st = computeStats(me);
    return { key, self: true, name: me.name, level: me.level, job: me.job, look: me.look, equip: me.equip, hp: me.hp, maxHp: st.maxHp, mp: me.mp, maxMp: st.maxMp };
  }
  if (!isFam(key)) return mateInfo(me, key);
  const id = key.slice(4);
  const x = [...(g.party?.supports || []), ...(g.party?.wagon || [])].find((m) => m.key === key);
  if (x) return { key, family: true, name: x.name, level: x.level, job: x.job, look: x.look, equip: x.equip, hp: x.hp, maxHp: x.maxHp, mp: x.mp, maxMp: x.maxMp };
  // 本人が パーティーに いる（うつしは 出ていない）か、パーティーに 入りきらず 待っている
  const m = (g.party?.members || []).find((p) => p.charId === id);
  if (m) return { key, family: true, here: true, name: m.name, level: m.level, job: m.job, look: m.look, equip: m.equip, hp: m.hp, maxHp: m.maxHp };
  const ch = (g.chars || []).find((c) => c.id === id);
  if (ch) return { key, family: true, name: ch.name, level: ch.level, job: ch.job, look: ch.look, equip: ch.equip, hp: null, maxHp: null };
  return null;
}

// 馬車が この マップに いるか（洞窟・塔の 中は 入り口で 待つ）
export function wagonHereClient(game) {
  return MAPS[game.field?.mapId]?.kind === 'field';
}

// ───────────── たたかい ─────────────
// 戦っている 人が 自分の 仲間（家族の キャラも）なら その key。自分は 'self'
function ownKey(g, a) {
  const me = g.me;
  const cid = String(a.charId || '');
  if (a.kind === 'player') return cid === me.id ? 'self' : null;
  if (cid.startsWith(me.id + ':')) return cid.slice(me.id.length + 1);
  const fk = 'fam:' + cid;
  if ([...(g.party?.supports || []), ...(g.party?.wagon || [])].some((x) => x.key === fk && x.owner === me.id)) return fk;
  return null;
}

// いれかえ できる 人（自分と 自分の 仲間）と、馬車の 仲間。馬車が ない・リーダーでない ときは null
//   all … 総入れかえ（自分が 戦っている とき）: seats 戦っている 仲間・cands えらべる 人・max 戦える 仲間の 数
export function battleWagon(scene) {
  const g = scene.game;
  const me = g.me;
  if (!me?.wagon) return null;
  if (g.party && g.party.leader !== g.sid) return null;
  if (!wagonHereClient(g)) return null;
  const allies = scene.allies();
  const keyed = allies.map((a) => ({ a, key: ownKey(g, a) })).filter((x) => x.key);
  const outs = keyed.map((x) => x.a);
  const active = new Set(keyed.map((x) => x.key));
  const ins = [];
  if (!active.has('self')) {
    const st = computeStats(me);
    ins.push({ key: 'self', name: me.name, level: me.level, hp: me.hp, maxHp: st.maxHp, self: true });
  }
  for (const w of g.party?.wagon || []) {
    if (active.has(w.key)) continue;
    ins.push({ key: w.key, name: w.name, level: w.level, hp: w.hp, maxHp: w.maxHp, family: !!w.family, species: w.species, job: w.job });
  }
  let all = null;
  if (active.has('self')) {
    const seats = keyed.filter((x) => x.key !== 'self').map((x) => ({ key: x.key, id: x.a.id, name: x.a.name, hp: x.a.alive ? x.a.hp : 0, maxHp: x.a.maxHp, seat: true }));
    const humansAndMates = allies.filter((a) => a.kind !== 'guest').length;
    const room = Math.max(0, Math.min(COMPANION_SLOTS - (me.partyKeys || []).length, BATTLE_MAX - humansAndMates));
    const wagonIns = ins.filter((x) => x.key !== 'self');
    const max = Math.min(COMPANION_SLOTS, seats.length + room);
    if (max > 0 && wagonIns.some((x) => x.hp > 0)) all = { seats, cands: [...seats, ...wagonIns], room, max };
  }
  return { outs, ins, all };
}

// コマンドの「いれかえ」: 総入れかえ ／ だれを 馬車に もどす？ → 馬車から だれを 出す？
export function battleSwapMenu(scene) {
  const info = battleWagon(scene);
  if (!info) return scene.openCommand();
  wagonStyles();
  const hpText = (x) => `HP${Math.max(0, x.hp)}${x.maxHp ? `/${x.maxHp}` : ''}`;
  const items = [];
  if (info.all) items.push({ label: '総入れかえ', value: '#all', cls: 'k-all' });
  items.push(...info.outs.map((a) => ({ label: `${a.name}　${a.alive ? hpText(a) : '死んでいる'}`, value: a.id })));
  scene.showMenu(items, (it) => {
    if (it.value === '#all') return battleSwapAll(scene, info.all);
    const outId = it.value;
    const inItems = info.ins.map((x) => ({
      label: `${x.name}${x.self ? '（自分）' : ''}　Lv${x.level} ${x.hp > 0 ? hpText(x) : '死んでいる'}`,
      value: x.key, disabled: !(x.hp > 0),
    }));
    if (!inItems.length) inItems.push({ label: '（馬車にはだれもいない）', value: null, disabled: true });
    scene.showMenu(inItems, (it2) => {
      if (it2.value) scene.send({ type: 'swap', out: outId, key: it2.value });
    }, () => battleSwapMenu(scene), `${scene.c.get(outId)?.name || ''}と入れかわるのは？`);
  }, () => scene.openCommand(), info.all ? 'いれかえ: 総入れかえか、馬車にもどす人' : 'だれを馬車にもどす？');
}

// たたかいの 総入れかえ: 戦う 仲間を 1人目から じゅんに えらぶ（自分は そのまま）→ これでいい？ → 1回で 入れかえ（番を 1回 使う）
function battleSwapAll(scene, A) {
  const me = scene.game.me;
  const picks = [];
  const hp = (x) => (x.hp > 0 ? `HP${x.hp}` : '死んでいる');
  const nameOf = (k) => A.cands.find((x) => x.key === k)?.name || '';
  const ask = () => {
    if (picks.length >= A.max) return confirm();
    const items = A.cands.map((x) => {
      const at = picks.indexOf(x.key);
      return {
        html: `${esc(x.name)}${x.seat ? '' : '<span class="tag gold">馬車</span>'}`,
        right: at >= 0 ? `${at + 1}人目` : hp(x), rightCls: at >= 0 ? 'gold' : '',
        value: x.key, disabled: at >= 0 || (!x.seat && !(x.hp > 0)),
      };
    });
    // あいている 場所が ある ときは 人数を へらさない ところで おわれる
    if (picks.length >= A.seats.length && picks.length > 0) items.push({ label: `これで決まり（${picks.length}人）`, value: '#ok' });
    scene.showMenu(items, (it) => {
      if (it.value === '#ok') return confirm();
      picks.push(it.value);
      ask();
    }, () => {
      if (!picks.length) return battleSwapMenu(scene);
      picks.pop();
      ask();
    }, `総入れかえ: ${picks.length + 1}人目に戦うのは？`);
  };
  const confirm = () => {
    const rest = A.cands.filter((x) => !picks.includes(x.key)).map((x) => x.name);
    scene.showMenu([
      { header: true, label: `戦う: ${[me.name, ...picks.map(nameOf)].join('・')}`, cls: 'wg-sum' },
      { header: true, label: `馬車: ${rest.join('・') || 'だれもいない'}`, cls: 'wg-sum' },
      { label: 'はい', value: 'yes' },
      { label: 'いいえ', value: 'no' },
    ], (it) => {
      if (it.value !== 'yes') {
        picks.length = 0;
        return ask();
      }
      const same = picks.length === A.seats.length && A.seats.every((x) => picks.includes(x.key));
      if (same) {
        toast('だれも入れかわらない');
        return scene.openCommand();
      }
      scene.send({ type: 'swap', all: picks.slice() });
    }, () => {
      picks.pop();
      ask();
    }, '総入れかえ: これでいい？');
  };
  ask();
}

// いれかえの できごとが とどいた: 自分が うごかす キャラだけ すぐ かえる（コマンドの じゅんばんが くるって しまわないように）
// まどが かわるのは メッセージを 見せる とき（wagonSwapFx）。まだ 見せて いない まえの できごとで もどらないように
// benched / pending は この 画面だけの しるし（サーバーの じょうほうで 上書き されない）
// 総入れかえ は ev.swap.list に 何人ぶんも（out が null なら あいている 場所に 入った）
export function applyBattleSwap(scene, ev) {
  const list = ev.swap.list || [{ out: ev.swap.out, in: ev.swap.in }];
  for (const j of ev.joined || []) if (!scene.c.has(j.id)) scene.c.set(j.id, { ...j, flash: 0, dead: j.alive ? 0 : 1, lunge: 0, pending: true });
  for (const { out, in: inId } of list) {
    const o = out ? scene.c.get(out) : null;
    if (o) Object.assign(o, { ready: false, queued: false });
    if (out) scene.mine = scene.mine.filter((id) => id !== out);
    const n = scene.c.get(inId);
    if (n && n.controller === scene.game.sid && !scene.mine.includes(n.id)) scene.mine.push(n.id);
  }
  scene.mine.sort((a, b) => (scene.c.get(a)?.kind === 'player' ? 0 : 1) - (scene.c.get(b)?.kind === 'player' ? 0 : 1));
  for (const { out } of list) if (out) scene.dropReady(out);
  scene.updateAutoBtn();
  if (!scene.cur && scene.menu == null) scene.renderCmdIdle();
}

// 馬車から 飛び出す えんしゅつ（馬車が 戦いの 場に 来て、まどが 入れかわる）
export function wagonSwapFx(scene, ev) {
  wagonStyles();
  const list = ev.swap?.list || [{ out: ev.swap?.out, in: ev.swap?.in }];
  for (const { out, in: inId } of list) {
    const o = out ? scene.c.get(out) : null;
    if (o) o.benched = true;
    const n = scene.c.get(inId);
    if (n) n.pending = false;
  }
  scene.renderStatus(true);
  scene.game.audio.sfx('join');
  const url = wagonPicURL('right');
  if (url && scene.stage) {
    const img = el('img', { class: 'wagon-fx', src: url, alt: '' });
    scene.stage.append(img);
    setTimeout(() => img.remove(), 1600);
  }
  for (const { in: inId } of list) {
    const s = scene.statusBoxes.get(inId);
    if (!s) continue;
    s.box.classList.remove('wagon-in');
    void s.box.offsetWidth;
    s.box.classList.add('wagon-in');
  }
}

// ───────────── 総入れかえ（メニュー・酒場）─────────────
// 今の パーティー（自分を ふくむ ならび）と 馬車の みんな
export function arrangeMembers(g) {
  const me = g.me;
  const pk = (me.partyKeys || []).slice();
  const pos = Math.max(0, Math.min(pk.length, Number.isInteger(me.selfPos) ? me.selfPos : 0));
  const order = [...pk.slice(0, pos), 'self', ...pk.slice(pos), ...(me.wagonKeys || [])];
  return order.map((k) => memberInfo(g, k)).filter(Boolean);
}

// 総入れかえの まど（ドラクエ5ふう）: 1番目から じゅんに えらぶ。1〜4番目が 戦う 仲間（自分は かならず ここ）、5〜8番目が 馬車
//   send(party, wagon) … サーバーへ（Promise<{ ok, text }>）。もどりち: Promise（決めた ときは サーバーの へんじ、やめたら null）
export function arrangeUI(game, { send } = {}) {
  wagonStyles();
  const members = arrangeMembers(game);
  const me = game.me;
  const sfx = (x) => game.audio.sfx(x);
  return new Promise((resolve) => {
    let party = [], wagon = [], closed = false, busy = false;
    const back = el('div', { class: 'modal-back arr-back' });
    const pic = wagonPicURL();
    const closeBtn = el('button', { class: 'btn closebtn', text: '✕ 閉じる', 'aria-label': '閉じる', onclick: () => quit() });
    const head = el('div', { class: 'win arr-head' }, pic ? el('img', { src: pic, alt: '' }) : null, el('span', { class: 'gold', text: '総入れかえ' }),
      el('span', { class: 'small muted', text: `戦う仲間${BATTLE_MAX}人・馬車${WAGON_SLOTS}人` }), closeBtn);
    const board = el('div', { class: 'arr-board' });
    const q = el('div', { class: 'arr-q' });
    const listBox = el('div', { class: 'arr-list' });
    const left = el('div', { class: 'arr-left' }, board, q);
    const body = el('div', { class: 'win arr-body' }, left, listBox);
    const root = el('div', { class: 'panel arr-panel' }, head, body);
    document.getElementById('ui').append(back, root);

    const info = (k) => members.find((m) => m.key === k);
    const placed = (k) => party.includes(k) || wagon.includes(k);
    const partyPhase = () => !closed && party.length < BATTLE_MAX;
    const heroIn = () => party.includes('self');
    const rest = () => members.filter((m) => !placed(m.key));
    const done = () => rest().length === 0;
    const mustHero = () => partyPhase() && party.length === BATTLE_MAX - 1 && !heroIn();
    const canClose = () => partyPhase() && heroIn() && rest().length > 0 && rest().length <= WAGON_SLOTS - wagon.length;
    const nextNo = () => (done() ? 0 : partyPhase() ? party.length + 1 : BATTLE_MAX + wagon.length + 1);

    const slot = (no, k, isNext, emptyText = '') => {
      const m = k ? info(k) : null;
      const s = el('div', { class: `arr-slot ${m ? '' : 'empty'} ${isNext ? 'next' : ''}` }, el('span', { class: 'arr-no', text: String(no) }));
      if (m) s.append(el('img', { class: 'face', src: faceOf(m), alt: '' }), el('span', { class: `arr-nm ${m.self ? 'me' : ''}`, text: m.name }));
      else s.append(el('span', { class: 'arr-nm', text: emptyText }));
      return s;
    };
    const renderBoard = () => {
      board.innerHTML = '';
      const nn = nextNo();
      const pc = el('div', { class: 'arr-col' }, el('div', { class: 'arr-h', text: '戦う仲間（1〜4）' }));
      for (let i = 0; i < BATTLE_MAX; i++) pc.append(slot(i + 1, party[i], nn === i + 1, closed || done() ? '（あき）' : ''));
      const wc = el('div', { class: 'arr-col wg' }, el('div', { class: 'arr-h', text: '馬車（5〜8）' }));
      for (let i = 0; i < WAGON_SLOTS; i++) wc.append(slot(BATTLE_MAX + i + 1, wagon[i], nn === BATTLE_MAX + i + 1, done() ? '（あき）' : ''));
      board.append(pc, wc);
    };
    const hpOf = (m) => (m.maxHp ? (m.hp > 0 ? `HP${m.hp}/${m.maxHp}` : '死んでいる') : '');
    const rowOf = (m) => {
      const at = party.indexOf(m.key);
      const wt = wagon.indexOf(m.key);
      const no = at >= 0 ? at + 1 : wt >= 0 ? BATTLE_MAX + wt + 1 : 0;
      const tag = m.self ? '<span class="tag good">自分</span>' : m.family ? `<span class="tag gold">${m.here ? '本人がいっしょ' : '家族'}</span>` : '';
      return {
        face: faceOf(m),
        html: `${esc(m.name)}${m.plus ? `<span class="plus">+${m.plus}</span>` : ''} <span class="muted small">${esc(kindName(m))} Lv${m.level}</span>${tag}`,
        right: no ? `${no}番` : hpOf(m), rightCls: no ? 'gold' : m.hp <= 0 && m.maxHp ? 'down' : '',
        value: m.key, disabled: !!no || (mustHero() && !m.self),
      };
    };
    let menu = null;
    const render = (keep = false) => {
      renderBoard();
      const n = nextNo();
      let items;
      if (done()) {
        q.textContent = 'これでいい？';
        items = [
          { html: '<span class="good">はい</span> <span class="muted small">（このならびにする）</span>', value: '#ok' },
          { label: 'ひとつもどす', value: '#undo' },
          { label: '最初から選びなおす', value: '#reset' },
          { label: 'やめる', value: '#quit' },
        ];
      } else {
        q.innerHTML = '';
        if (mustHero()) q.append(`${n}番目は${me.name}（自分）。`, el('div', { class: 'hint', text: '自分はかならず戦う仲間（1〜4番目）に入るよ' }));
        else if (partyPhase()) {
          q.append(`${n}番目に戦うのはだれ？`);
          if (n === 1) q.append(el('div', { class: 'hint', text: '1〜4番目が戦う仲間、5〜8番目は馬車で待つ仲間' }));
        } else q.append(`${n}番目（馬車）に乗るのはだれ？`);
        items = members.map(rowOf);
        if (canClose()) items.push({ html: '<span class="gold">戦う仲間はここまで</span> <span class="muted small">（のこりは馬車へ）</span>', value: '#close' });
        if (party.length) items.push({ label: 'ひとつもどす', value: '#undo' });
        items.push({ label: 'やめる', value: '#quit' });
      }
      if (!menu) {
        menu = new ListMenu(game.input, { items, sound: sfx, back: null, onSelect: (it) => choose(it.value), onCancel: () => (party.length ? undo() : quit()) });
        listBox.append(menu.root);
        menu.focus();
      } else menu.setItems(items, keep);
    };
    const finish = (v) => {
      menu?.blur();
      back.remove();
      root.remove();
      resolve(v);
    };
    const quit = () => {
      if (busy) return;
      finish(null);
    };
    const undo = () => {
      if (wagon.length) wagon.pop();
      else if (closed) closed = false;
      else party.pop();
      render();
    };
    const choose = async (v) => {
      if (busy) return;
      if (v === '#quit') return quit();
      if (v === '#undo') return undo();
      if (v === '#reset') {
        party = [];
        wagon = [];
        closed = false;
        return render();
      }
      if (v === '#close') {
        closed = true;
        return render();
      }
      if (v === '#ok') {
        busy = true;
        const r = send ? await send(party.slice(), wagon.slice()) : { ok: true };
        busy = false;
        if (r?.text) toast(r.text);
        if (r?.ok) {
          sfx('join');
          finish(r);
        } else sfx('buzz');
        return;
      }
      if (placed(v)) return;
      if (partyPhase()) party.push(v);
      else wagon.push(v);
      render();
    };
    render();
  });
}

// ───────────── メニュー「仲間」→「馬車」 ─────────────
// menu … FieldMenu（mkSub・pick・focusSub を つかう）
export function wagonMenuView(menu, active) {
  wagonStyles();
  const g = menu.game;
  const me = g.me;
  const box = el('div', { class: 'wagon-view' });
  const wagon = (me.wagonKeys || []).map((k) => memberInfo(g, k)).filter(Boolean);
  const party = (me.partyKeys || []).map((k) => memberInfo(g, k)).filter(Boolean);
  const here = wagonHereClient(g);
  const lead = !g.party || g.party.leader === g.sid;
  const pic = wagonPicURL();
  box.append(el('h3', {}, pic ? el('img', { class: 'wv-pic', src: pic, alt: '' }) : '', `馬車（${wagon.length}/${WAGON_SLOTS}人）`));
  const row = (x) => ({
    face: faceOf(x),
    html: `${esc(x.name)} <span class="muted small">${esc(kindName(x))} Lv${x.level}</span>${x.family ? '<span class="tag gold">家族</span>' : ''}`,
    right: x.maxHp ? (x.hp > 0 ? `HP${x.hp}/${x.maxHp}` : '死んでいる') : '',
    rightCls: x.maxHp && !(x.hp > 0) ? 'down' : '',
    value: x.key,
  });
  const items = [];
  if (lead && here && wagon.length + party.length > 0) items.push({ html: '<span class="gold">総入れかえ</span> <span class="muted small">（まとめて決める）</span>', value: '#arrange' });
  items.push({ header: true, label: `馬車に乗っている仲間（${wagon.length}/${WAGON_SLOTS}）` });
  if (!wagon.length) items.push({ label: '（だれも乗っていない）', value: null, disabled: true });
  items.push(...wagon.map((x) => ({ ...row(x), sec: 'wagon', label: x.name })));
  items.push({ header: true, label: `いっしょに歩いている仲間（${party.length}/${COMPANION_SLOTS}）` });
  if (!party.length) items.push({ label: '（だれもいない）', value: null, disabled: true });
  items.push(...party.map((x) => ({ ...row(x), sec: 'party', label: x.name })));
  const note = !lead ? 'パーティーの馬車はリーダーのもの。自分の馬車の乗りかえは、自分がリーダーのときか酒場でできる。'
    : !here ? '馬車は入り口で待っている。\n洞窟や塔の中では乗りかえられない。'
      : '馬車の仲間は戦いに出なくても、経験値を半分もらえる。家族のキャラも乗れる。\n戦いの中でも「いれかえ」で入れかえられる。\n酒場で待っている仲間とは、ルミナの町の酒場で乗りかえる。';
  if (!active) {
    for (const it of items) {
      if (it.value === '#arrange') continue;
      box.append(it.header ? el('div', { class: 'small gold', text: it.label }) : el('div', { class: 'kv wagon-row' }, el('span', {}, it.face ? el('img', { class: 'face', src: it.face, alt: '' }) : '', it.html ? el('span', { html: it.html }) : it.label), el('span', { class: 'small muted', text: it.right || '' })));
    }
    box.append(el('div', { class: 'wv-note', text: note }));
    return box;
  }
  const m = menu.mkSub({
    items,
    onSelect: async (it) => {
      if (!it.value) return;
      if (!lead || !here) {
        toast(note.split('\n')[0]);
        g.audio.sfx('buzz');
        return;
      }
      menu.sub.blur();
      if (it.value === '#arrange') {
        await menuArrange(menu);
        setTimeout(() => { if (menu.root) menu.focusSub(wagonMenuView(menu, true)); }, 250);
        return;
      }
      const send = (op, key, other) => g.net.send({ t: 'menu', action: 'wagon', op, key, with: other || undefined });
      const nm = it.label || '';
      if (it.sec === 'wagon') {
        const full = party.length >= COMPANION_SLOTS;
        const opts = [];
        if (!full) opts.push({ label: 'パーティーに入れる', value: '#in' });
        for (const x of party) opts.push({ face: faceOf(x), label: `${x.name}と入れかえる`, value: x.key });
        opts.push({ label: 'やめる', value: null });
        const v = await menu.pick(`${nm}をどうする？`, opts, { wide: true });
        if (v === '#in') send('out', it.value);
        else if (v) send('out', it.value, v);
      } else {
        const full = wagon.length >= WAGON_SLOTS;
        const opts = [];
        if (!full) opts.push({ label: '馬車に乗ってもらう', value: '#in' });
        for (const x of wagon) opts.push({ face: faceOf(x), label: `${x.name}と入れかえる`, value: x.key });
        opts.push({ label: 'やめる', value: null });
        const v = await menu.pick(`${nm}をどうする？`, opts, { wide: true });
        if (v === '#in') send('in', it.value);
        else if (v) send('out', v, it.value);
      }
      setTimeout(() => { if (menu.root) menu.focusSub(wagonMenuView(menu, true)); }, 250);
    },
  });
  box.append(m.root, el('div', { class: 'wv-note', text: note }));
  return box;
}

// メニューから 総入れかえ（サーバーの へんじを まつ。services.js の 'wagon'）
export function menuArrange(menu) {
  const g = menu.game;
  menu.popupOpen = true;
  return arrangeUI(g, {
    send: (party, wagon) => request(g, { kind: 'wagon', op: 'arrange', party, wagon }),
  }).finally(() => { menu.popupOpen = false; });
}

// ───────────── 酒場 ─────────────
// 酒場の リスト（馬車の みだしと 仲間）。e … 酒場の じょうほうの 仲間
export function tavernWagonItems(info, entries, fmt) {
  wagonStyles();
  if (!info.wagon) return [];
  const list = [...entries.values()].filter((e) => e.inWagon);
  const out = [{ header: true, label: `馬車の仲間（${list.length}/${info.wagon.max}）` }];
  if (!list.length) out.push({ label: '（まだだれも乗っていない）', value: null, disabled: true });
  for (const e of list) out.push({ face: fmt.face(e), html: `${esc(e.name)}${fmt.plusTag(e)} <span class="muted small">${fmt.who(e)}</span><span class="tag gold">${e.family ? '家族・' : ''}馬車</span>${e.hp <= 0 ? '<span class="tag warn">死んでいる</span>' : ''}`, value: e.key });
  return out;
}

// 酒場で えらんだ 仲間の 馬車の えらびかた（opts に たす。家族の キャラも 乗れる）
export function tavernWagonOpts(info, e) {
  if (!info.wagon || !['roster', 'family'].includes(e.sec)) return [];
  if (e.inWagon) return [{ label: 'パーティーに入れる', value: '#fromWagon' }, { label: '馬車をおりて酒場で待っていてもらう', value: '#wagonWait' }];
  return [{ label: info.wagon.keys.length >= info.wagon.max ? '馬車に乗ってもらう（入れかわる）' : '馬車に乗ってもらう', value: '#toWagon' }];
}

// 酒場で 馬車の えらびかたを えらんだ とき。ctx: { info, entries, ask, doReq, face, who }
export async function tavernWagonAct(ctx, e, a) {
  const { info, entries, ask, doReq, face, who } = ctx;
  const inWagon = [...entries.values()].filter((x) => x.inWagon);
  const pickFrom = (title, list) => ask(title, [...list.map((x) => ({ face: face(x), label: `${x.name}（${who(x)}）`, value: x.key })), { label: 'やめる', value: null }]);
  if (a === '#toWagon') {
    let swap = null;
    if (info.wagon.keys.length >= info.wagon.max) {
      swap = await pickFrom(`馬車がいっぱい！\n${e.name}と入れかわるのはだれ？${e.inParty ? '\n（その仲間がパーティーに入る）' : '\n（その仲間は酒場で待つ）'}`, inWagon);
      if (!swap) return;
    }
    await doReq({ action: 'toWagon', key: e.key, swap });
  } else if (a === '#fromWagon') {
    const party = [...entries.values()].filter((x) => x.inParty);
    let swap = null;
    if (party.length >= info.slots) {
      swap = await pickFrom(`パーティーがいっぱい！\n${e.name}と入れかわって馬車に乗るのはだれ？`, party);
      if (!swap) return;
    }
    await doReq({ action: 'fromWagon', key: e.key, swap });
  } else if (a === '#wagonWait') {
    await doReq({ action: 'wagonWait', key: e.key });
  }
}

// 酒場で つれていく ときの いく ところ（パーティー → 馬車 → 入れかわり）。ことばと いっぱいか
export function tavernPlace(info, partyCount) {
  const partyFull = partyCount >= info.slots;
  const wagonFull = !info.wagon || info.wagon.keys.length >= info.wagon.max;
  if (!partyFull) return { full: false, where: 'party', note: '' };
  if (!wagonFull) return { full: false, where: 'wagon', note: '（馬車に乗る）' };
  return { full: true, where: null, note: '（入れかわる）' };
}
