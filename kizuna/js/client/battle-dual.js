// たたかいの 画面の 合体技（2人・3人・4人。client/battle.js から よぶ）
//  ・コマンドの「合体技」の 一覧（第31回: 行は 技の 名前だけ 大きく。だれと・何人で・よやくか・必要な 職業は 説明の まどに）
//  ・家族から さそわれた ときの「参加する！／ことわる」
//  ・出す ときの カットインと とどめの えんしゅつ（render/dualfx.js）
import { el, esc, ListMenu, toast } from './ui/dom.js?v=1dff4be9c13e';
import { ABILITIES, ELEMENT_NAMES } from '../shared/data/abilities.js?v=1dff4be9c13e';
import { comboAllowed, weaponOk } from '../shared/stats.js?v=1dff4be9c13e';
import { dualOptions, dualKnown, dualNeedText, dualNeedLabel } from '../shared/data/dual.js?v=1dff4be9c13e';
// 第33回: 男の子の 美少女戦士が 入る ときは 名前・説明が かわる（shared/ability-label.js）
import { dualFor } from '../shared/ability-label.js?v=1dff4be9c13e';
import { faceURL } from './field.js?v=1dff4be9c13e';
import { targetText } from './ui/info.js?v=1dff4be9c13e';
import { playDualCutin, playDualFinale, cutMs, dualFxOf, addDualCss } from './render/dualfx.js?v=1dff4be9c13e';
import { BW, BH } from './render/battlefx.js?v=1dff4be9c13e';

const SECRET = '効果は？？？（一度使うとわかる）';
// その くみあわせ（o.who … 出す 人の id）むけの 合体技
const techOf = (v, o) => dualFor(o.id, (o.who || [o.partner]).map((id) => v.c.get(id)));
const sizeLabel = (n) => `${n}人技`;

// 自分の キャラが 今 出せる 合体技（サーバーでも たしかめる）
export function myDualOptions(v, a) {
  if (!a) return [];
  const info = (x) => ({
    id: x.id, name: x.name, job: x.job, mon: x.mon, alive: x.alive, abilities: x.abilities || [], mp: x.mp, atb: x.atb, ready: x.ready, queued: !!x.queued, hold: !!x.dualHold,
    inviting: false, statuses: x.status || [], weaponCat: x.weaponCat,
    waiting: x.id !== a.id && (!!x.waitDual || (!!x.dualTarget && x.dualTarget !== a.id)),
    usable: (id) => {
      const ab = ABILITIES[id];
      return !!ab && (ab.kind !== 'combo' || comboAllowed(x.pc || { job: x.job, jobs: {} }, id)) && weaponOk(ab, x.weaponCat);
    },
  });
  // 第32回: モンスターの 仲間も（モンスターの 仲間の 組が ある 技だけ）
  const others = v.allies().filter((x) => x.id !== a.id);
  // 人数の 多い 技を 上に
  return dualOptions(info(a), others.map(info), weaponOk, { anyGauge: true }).sort((x, y) => y.size - x.size);
}

// 説明の まど（3行まで）: 人数・属性・相手・いっしょに 出す 人（よやく）／必要な 職業・MP／効果
export function dualInfo(v, o, more = 0) {
  const t = techOf(v, o);
  const tags = [sizeLabel(o.size || 2), ELEMENT_NAMES[o.element], targetText(t)].filter(Boolean).join('・');
  const when = o.now ? '' : '（よやく）';
  const others = more > 0 ? `（ほか${more}通り）` : '';
  const desc = dualKnown(v.game.me, o.id) ? t.desc : SECRET;
  return `【${tags}】${o.partnerName}といっしょに${when}${others}\n${dualNeedLabel(o.id)}：${dualNeedText(o.id, true, v.myActor)}　MP ${o.mp.join('＋')}\n${desc}`;
}

// 合体技の 一覧（コマンド → 合体技）。行は 技の 名前だけ（大きく）。おなじ 技を 出せる 仲間の くみあわせが いくつか ある ときは、
// えらんだ あとに「だれと出す？」を 聞く（1通りなら すぐ）
export function dualMenu(v, opts) {
  if (!opts.length) {
    toast('今は合体技を出せる仲間がいない');
    return v.openCommand();
  }
  addDualCss();
  const role = (t) => (t.parts.some((x) => x.type === 'power') ? 'dmg' : t.parts.some((x) => x.type === 'heal' || x.type === 'cure') ? 'heal' : 'sup');
  // 技ごとに まとめる（すぐ 出せる くみあわせを 先に）
  const groups = new Map();
  for (const o of opts) {
    if (!groups.has(o.id)) groups.set(o.id, []);
    groups.get(o.id).push(o);
  }
  for (const list of groups.values()) list.sort((x, y) => (y.now ? 1 : 0) - (x.now ? 1 : 0));
  const items = [...groups.values()].map((list) => {
    const o = list[0];
    const t = techOf(v, o);
    const n = o.size || 2;
    return { html: `<span class="dual-nm">${esc(t.name)}</span>`, right: `${o.mp[0]}`, value: list, cls: `k-${role(t)} k-dualopt n${n}${list.some((x) => x.now) ? '' : ' later'}` };
  });
  const fire = (o) => {
    const t = techOf(v, o);
    const go = (target) => v.send({ type: 'dual', id: o.id, partner: o.partner, partners: o.partners, target });
    if (t.target === 'enemy' || t.target === 'group') return v.pickFoe(t.target, (tid) => go(tid), t.name, o.element, () => dualMenu(v, myDualOptions(v, v.myActor)));
    return go();
  };
  v.showMenu(items, (it) => {
    const list = it.value;
    if (list.length === 1) return fire(list[0]);
    // だれと 出す？（いっしょに 出す 人の 名前だけ）
    const t = techOf(v, list[0]);
    v.showMenu(list.map((o) => ({ label: `${o.partnerName}${o.now ? '' : '（よやく）'}`, value: o, right: `${o.mp[0]}` })),
      (x) => fire(x.value), () => dualMenu(v, myDualOptions(v, v.myActor)), `「${t.name}」をだれと出す？`, (x) => { if (x) v.info(dualInfo(v, x.value)); });
  }, () => v.openCommand(), '合体技（いっしょに出す人の番を使う）', (it) => {
    if (!it) return;
    v.info(dualInfo(v, it.value[0], it.value.length - 1));
  });
}

// 合体技を えらんだ あとの「返事を待っている」（家族が いっしょなら）
export function askingName(v, cmd) {
  if (cmd.type !== 'dual') return null;
  const ids = cmd.partners?.length ? cmd.partners : [cmd.partner];
  const ask = ids.map((id) => v.c.get(id)).filter((p) => p && p.controller && !p.auto && !v.mine.includes(p.id));
  return ask.length ? ask.map((p) => p.name).join('・') : null;
}

// よやく中・まっている ときの ことば（コマンドの まど）
export function waitText(v, a) {
  if (a.waitDual) {
    const t = dualFor(a.waitDual.id, [a, ...(a.waitDual.partners || [a.waitDual.partner]).map((id) => v.c.get(id))]);
    const names = (a.waitDual.partners || [a.waitDual.partner]).map((id) => v.c.get(id)?.name || '仲間').join('・');
    // ダメージで 力あわせが みだれた（自分の ゲージを ためなおしている）
    if ((a.atb ?? 100) < 99.9) return `力あわせがみだれた！自分と${names}のゲージがたまったら「${t?.name || '合体技'}」を出す…`;
    return `${names}のゲージがたまったら「${t?.name || '合体技'}」を出す。力をためている…`;
  }
  if (a.dualHold) return `${v.c.get(a.dualTarget)?.name || '仲間'}の合体技に参加する。ほかの仲間を待っている…`;
  return null;
}

// サーバーからの できごと（合体技の よやく・まつ）
export function onDualWait(v, ev) {
  const c = v.c.get(ev.id);
  const ids = ev.partners || [ev.partner];
  if (c) { c.waitDual = { id: ev.tech, partner: ids[0], partners: ids }; c.ready = false; }
  for (const id of ids) {
    const p = v.c.get(id);
    if (p) p.dualTarget = ev.id;
  }
}
export function onDualWaitEnd(v, ev) {
  const c = v.c.get(ev.id);
  const ids = ev.partners?.length ? ev.partners : c?.waitDual?.partners || [c?.waitDual?.partner];
  if (c) c.waitDual = null;
  for (const id of ids || []) {
    const p = id && v.c.get(id);
    if (p && p.dualTarget === ev.id) { p.dualTarget = null; p.dualHold = false; }
  }
}
// よやくで まっていた 人が ダメージを 受けて、ゲージが 半分から やり直し（サーバーの battle-dual.js の dualHurt）
export function onDualBreak(v, ev) {
  for (const id of ev.dualBreak || []) {
    const c = v.c.get(id);
    if (!c) continue;
    c.dualHold = false;
    c.atb = Math.min(c.atb ?? 50, 50);
    v.banner(`${c.name}の力あわせがみだれた！`, 'danger');
    if (v.mine.includes(id) && !v.cur) v.renderCmdIdle();
  }
  v.renderStatus();
}

// 仲間が ほかの 仲間を まつ（ゲージは たまった まま）
export function onDualHold(v, ev) {
  const c = v.c.get(ev.id);
  if (c) { c.ready = false; c.dualHold = true; c.dualTarget = ev.by; }
  if (v.mine.includes(ev.id)) {
    v.dropReady(ev.id);
    if (!v.cur) v.renderCmdIdle();
  }
  v.renderStatus();
}

// 家族から 合体技に さそわれた
export function showInvite(v, ev) {
  v.closeInvite();
  const t = dualFor(ev.tech, [ev.from, ...(ev.partners || [ev.to])].map((id) => v.c.get(id)));
  const n = (ev.partners?.length || 1) + 1;
  const bar = el('div', { class: 'di-bar' }, el('i', { style: { animationDuration: `${ev.ms || 7000}ms` } }));
  const who = n >= 3 ? `${ev.fromName}が${n}人技にさそっている！` : `${ev.fromName}が合体技にさそっている！`;
  const box = el('div', { class: 'win dual-invite' },
    el('div', { class: 'di-t', text: who }),
    el('div', { class: 'di-n', text: `「${t?.name || '合体技'}」` }),
    n >= 3 && ev.names ? el('div', { class: 'di-d', text: `いっしょに出す人：${ev.names.join('・')}` }) : null,
    el('div', { class: 'di-d', text: t && dualKnown(v.game.me, ev.tech) ? t.desc : SECRET }), bar);
  const answer = (ok) => {
    v.game.net.send({ t: 'battle', actor: ev.to, cmd: { type: 'dualAnswer', invite: ev.invite, ok } });
    v.closeInvite();
  };
  const m = new ListMenu(v.game.input, {
    items: [{ label: '参加する！', value: true }, { label: 'ことわる', value: false }],
    sound: (x) => v.game.audio.sfx(x),
    onSelect: (it) => answer(it.value),
    onCancel: () => answer(false),
  });
  box.append(m.root);
  v.stage.append(box);
  v.menu?.blur();
  m.focus();
  v.invite = { invite: ev.invite, box, menu: m };
  v.game.audio.sfx('dual');
}

// 合体技の さそいの 返事（ことわった・時間切れ・参加する）
export function onDualAnswer(v, ev) {
  if (v.invite?.invite === ev.invite && (!ev.ok || !ev.partial || v.mine.includes(ev.to))) v.closeInvite();
  if (!v.mine.includes(ev.from)) return;
  const who = v.c.get(ev.to)?.name || '仲間';
  if (ev.ok) {
    if (ev.partial) toast(`${who}が参加する！ほかの仲間の返事を待っている…`);
    return;
  }
  const why = { 'ことわった': `${who}は参加しなかった…`, '時間切れ': `${who}から返事がなかった…`, '出せなくなった': '合体技は出せなくなった…', '倒れた': '合体技は出せなくなった…' }[ev.reason];
  if (why) toast(why);
  const c = v.c.get(ev.from);
  if (c && c.alive && c.ready && !v.readyQ.includes(ev.from)) v.readyQ.unshift(ev.from);
  if (!v.cur) v.nextCommand();
}

// 合体技を 出す 前に 見せる 時間（ミリびょう）
export function dualPre(ev, speed = 1) {
  return cutMs(ev.dual?.n || 2) / speed;
}

// 合体技の カットイン（みんなの 顔と 技の 名前）と、とどめの えんしゅつ
export function dualFx(v, ev) {
  const d = ev.dual;
  const ids = d.m || [d.a, d.b];
  const people = ids.map((id) => v.c.get(id)).map((x) => ({ name: x?.name || '', face: x ? faceURL({ look: x.look, job: x.job, eq: x.eq, mon: x.mon }) : '' }));
  const tempo = v.fxSpeed || 1;
  const n = ids.length;
  const ms = playDualCutin(v.stage, { id: d.id, name: d.name, people, tempo, el });
  const au = v.game.audio;
  au.sfx('dual');
  if (n >= 3) setTimeout(() => au.sfx('bond'), 260 / tempo);
  setTimeout(() => au.sfx(n >= 4 ? 'thunder' : 'smash'), (ms * 0.4));
  v.fx.flash = 200;
  v.fx.flashColor = '#ffffff';
  setTimeout(() => v.shake?.(320 + 80 * n, 4 + 2 * n), ms * 0.4);
  for (const id of ids) v.glowStatus(id, '#ffd66b');
  // とどめ: カットインの あと、技の えんしゅつと いっしょに
  setTimeout(() => {
    if (v.destroyed) return;
    const targets = (ev.fx?.targets || []).map((id) => v.c.get(id)).filter(Boolean);
    const foes = targets.filter((x) => x.side === 'enemy').map((x) => v.center(x)).filter(Boolean);
    const pts = foes.length ? foes : [{ x: BW / 2, y: BH * 0.62 }];
    playDualFinale(v.fx, d.id, pts, n, BW, BH);
    const fin = { bolt: 'bolt', nova: 'blast', storm: 'wind', cross: 'crit', beam: 'blast', quake: 'smash', heal: 'heal', stage: 'buff', laugh: 'hirameki', siren: 'warn', spot: 'hirameki', gadgets: 'item', coins: 'coin', meteor: 'blast', matoi: 'crit' };
    au.sfx(fin[dualFxOf(d.id).finale] || (foes.length ? 'blast' : 'heal'));
  }, ms);
}
