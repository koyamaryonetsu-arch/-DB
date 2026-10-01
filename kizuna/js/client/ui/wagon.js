// 馬車の がめん: たたかいの「いれかえ」・メニューの「仲間」→「馬車」・酒場の 乗りかえ
//   きまりは shared/data/wagon.js と shared/world/wagon.js
import { el, esc, toast } from './dom.js?v=e65131463bfb';
import { WAGON_SLOTS } from '../../shared/data/wagon.js?v=e65131463bfb';
import { COMPANION_SLOTS } from '../../shared/data/companions.js?v=e65131463bfb';
import { MAPS } from '../../shared/maps/index.js?v=e65131463bfb';
import { JOBS } from '../../shared/data/jobs.js?v=e65131463bfb';
import { MONSTERS } from '../../shared/data/monsters.js?v=e65131463bfb';
import { computeStats } from '../../shared/stats.js?v=e65131463bfb';
import { faceURL } from '../field.js?v=e65131463bfb';
import { wagonSprite } from '../render/wagon.js?v=e65131463bfb';

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
  return { key, name: ch.name, level: ch.level, job: ch.job, species: ch.species || null, look: ch.look, equip: ch.equip, hp: ch.hp, maxHp: st.maxHp, mp: ch.mp, maxMp: st.maxMp, charId: ch.id };
}

// 馬車が この マップに いるか（洞窟・塔の 中は 入り口で 待つ）
export function wagonHereClient(game) {
  return MAPS[game.field?.mapId]?.kind === 'field';
}

// ───────────── たたかい ─────────────
// いれかえ できる 人（自分と 自分の 仲間）と、馬車の 仲間。馬車が ない・リーダーでない ときは null
export function battleWagon(scene) {
  const g = scene.game;
  const me = g.me;
  if (!me?.wagon) return null;
  if (g.party && g.party.leader !== g.sid) return null;
  if (!wagonHereClient(g)) return null;
  const allies = scene.allies();
  const outs = allies.filter((a) => a.charId === me.id || String(a.charId || '').startsWith(me.id + ':'));
  const active = new Set(allies.map((a) => a.charId));
  const ins = [];
  if (!active.has(me.id)) {
    const st = computeStats(me);
    ins.push({ key: 'self', name: me.name, level: me.level, hp: me.hp, maxHp: st.maxHp, self: true });
  }
  for (const k of me.wagonKeys || []) {
    const m = mateInfo(me, k);
    if (m && !active.has(m.charId)) ins.push(m);
  }
  return { outs, ins };
}

// コマンドの「いれかえ」: だれを 馬車に もどす？ → 馬車から だれを 出す？
export function battleSwapMenu(scene) {
  const info = battleWagon(scene);
  if (!info) return scene.openCommand();
  const hpText = (x) => `HP${Math.max(0, x.hp)}${x.maxHp ? `/${x.maxHp}` : ''}`;
  const outItems = info.outs.map((a) => ({ label: `${a.name}　${a.alive ? hpText(a) : '死んでいる'}`, value: a.id }));
  scene.showMenu(outItems, (it) => {
    const outId = it.value;
    const inItems = info.ins.map((x) => ({
      label: `${x.name}${x.self ? '（自分）' : ''}　Lv${x.level} ${x.hp > 0 ? hpText(x) : '死んでいる'}`,
      value: x.key, disabled: !(x.hp > 0),
    }));
    if (!inItems.length) inItems.push({ label: '（馬車にはだれもいない）', value: null, disabled: true });
    scene.showMenu(inItems, (it2) => {
      if (it2.value) scene.send({ type: 'swap', out: outId, key: it2.value });
    }, () => battleSwapMenu(scene), `${scene.c.get(outId)?.name || ''}と入れかわるのは？`);
  }, () => scene.openCommand(), 'だれを馬車にもどす？');
}

// いれかえの できごとが とどいた: 自分が うごかす キャラだけ すぐ かえる（コマンドの じゅんばんが くるって しまわないように）
// まどが かわるのは メッセージを 見せる とき（wagonSwapFx）。まだ 見せて いない まえの できごとで もどらないように
// benched / pending は この 画面だけの しるし（サーバーの じょうほうで 上書き されない）
export function applyBattleSwap(scene, ev) {
  const { out, in: inId } = ev.swap;
  const o = scene.c.get(out);
  if (o) Object.assign(o, { ready: false, queued: false });
  for (const j of ev.joined || []) if (!scene.c.has(j.id)) scene.c.set(j.id, { ...j, flash: 0, dead: j.alive ? 0 : 1, lunge: 0, pending: true });
  const n = scene.c.get(inId);
  scene.mine = scene.mine.filter((id) => id !== out);
  if (n && n.controller === scene.game.sid && !scene.mine.includes(n.id)) scene.mine.push(n.id);
  scene.mine.sort((a, b) => (scene.c.get(a)?.kind === 'player' ? 0 : 1) - (scene.c.get(b)?.kind === 'player' ? 0 : 1));
  scene.dropReady(out);
  scene.updateAutoBtn();
  if (!scene.cur && scene.menu == null) scene.renderCmdIdle();
}

// 馬車から 飛び出す えんしゅつ（馬車が 戦いの 場に 来て、まどが 入れかわる）
export function wagonSwapFx(scene, ev) {
  wagonStyles();
  const o = scene.c.get(ev.swap?.out);
  if (o) o.benched = true;
  const n = scene.c.get(ev.swap?.in);
  if (n) n.pending = false;
  scene.renderStatus(true);
  scene.game.audio.sfx('join');
  const url = wagonPicURL('right');
  if (url && scene.stage) {
    const img = el('img', { class: 'wagon-fx', src: url, alt: '' });
    scene.stage.append(img);
    setTimeout(() => img.remove(), 1600);
  }
  const s = scene.statusBoxes.get(ev.swap?.in);
  if (!s) return;
  s.box.classList.remove('wagon-in');
  void s.box.offsetWidth;
  s.box.classList.add('wagon-in');
}

// ───────────── メニュー「仲間」→「馬車」 ─────────────
// menu … FieldMenu（mkSub・pick・focusSub を つかう）
export function wagonMenuView(menu, active) {
  wagonStyles();
  const g = menu.game;
  const me = g.me;
  const box = el('div', { class: 'wagon-view' });
  const wagon = (me.wagonKeys || []).map((k) => mateInfo(me, k)).filter(Boolean);
  const party = (me.partyKeys || []).filter((k) => !k.startsWith('fam:')).map((k) => mateInfo(me, k)).filter(Boolean);
  const here = wagonHereClient(g);
  const lead = !g.party || g.party.leader === g.sid;
  const pic = wagonPicURL();
  box.append(el('h3', {}, pic ? el('img', { class: 'wv-pic', src: pic, alt: '' }) : '', `馬車（${wagon.length}/${WAGON_SLOTS}人）`));
  const row = (x) => ({
    face: faceOf(x),
    html: `${esc(x.name)} <span class="muted small">${esc(kindName(x))} Lv${x.level}</span>`,
    right: x.hp > 0 ? `HP${x.hp}/${x.maxHp}` : '死んでいる',
    rightCls: x.hp > 0 ? '' : 'down',
    value: x.key,
  });
  const items = [{ header: true, label: `馬車に乗っている仲間（${wagon.length}/${WAGON_SLOTS}）` }];
  if (!wagon.length) items.push({ label: '（だれも乗っていない）', value: null, disabled: true });
  items.push(...wagon.map((x) => ({ ...row(x), sec: 'wagon' })));
  items.push({ header: true, label: `いっしょに歩いている仲間（${party.length}/${COMPANION_SLOTS}）` });
  if (!party.length) items.push({ label: '（だれもいない）', value: null, disabled: true });
  items.push(...party.map((x) => ({ ...row(x), sec: 'party' })));
  const note = !lead ? 'パーティーの馬車はリーダーのもの。自分の馬車の乗りかえは、自分がリーダーのときか酒場でできる。'
    : !here ? '馬車は入り口で待っている。\n洞窟や塔の中では乗りかえられない。'
      : '馬車の仲間は戦いに出なくても、経験値を半分もらえる。\n戦いの中でも「いれかえ」で入れかえられる。\n酒場で待っている仲間とは、ルミナの町の酒場で乗りかえる。';
  if (!active) {
    for (const it of items) box.append(it.header ? el('div', { class: 'small gold', text: it.label }) : el('div', { class: 'kv wagon-row' }, el('span', {}, it.face ? el('img', { class: 'face', src: it.face, alt: '' }) : '', it.html ? el('span', { html: it.html }) : it.label), el('span', { class: 'small muted', text: it.right || '' })));
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
      const send = (op, key, other) => g.net.send({ t: 'menu', action: 'wagon', op, key, with: other || undefined });
      const nm = it.label || wagon.concat(party).find((x) => x.key === it.value)?.name || '';
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

// ───────────── 酒場 ─────────────
// 酒場の リスト（馬車の みだしと 仲間）。e … 酒場の じょうほうの 仲間
export function tavernWagonItems(info, entries, fmt) {
  if (!info.wagon) return [];
  const list = [...entries.values()].filter((e) => e.inWagon);
  const out = [{ header: true, label: `馬車の仲間（${list.length}/${info.wagon.max}）` }];
  if (!list.length) out.push({ label: '（まだだれも乗っていない）', value: null, disabled: true });
  for (const e of list) out.push({ face: fmt.face(e), html: `${esc(e.name)}${fmt.plusTag(e)} <span class="muted small">${fmt.who(e)}</span><span class="tag gold">馬車</span>${e.hp <= 0 ? '<span class="tag warn">死んでいる</span>' : ''}`, value: e.key });
  return out;
}

// 酒場で えらんだ 仲間の 馬車の えらびかた（opts に たす）
export function tavernWagonOpts(info, e) {
  if (!info.wagon || e.sec !== 'roster') return [];
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
    const party = [...entries.values()].filter((x) => x.inParty && !x.family && x.sec === 'roster');
    let swap = null;
    if ([...entries.values()].filter((x) => x.inParty).length >= info.slots) {
      swap = await pickFrom(`パーティーがいっぱい！\n${e.name}と入れかわって馬車に乗るのはだれ？`, party);
      if (!swap) return;
    }
    await doReq({ action: 'fromWagon', key: e.key, swap });
  } else if (a === '#wagonWait') {
    await doReq({ action: 'wagonWait', key: e.key });
  }
}
