// 第67回 C班: モンスター闘技場の「その場で家族と対戦」（リアルタイムの 家族対戦）。docs/plan-r67-monster-arena.md
//
// 受付の はじめの えらびしに 足す（ui/monarena.js の MONARENA_EXTRA。value 'live'）。サーバーの 窓口は svc kind:'monlive'（shared/world/monarena-live.js）
//   申しこむ 人: 受付 →「その場で家族と対戦」→ 闘技場に いる 家族を 選ぶ → 強さ（そのままの強さ／レベルをそろえる）→ へんじを 待つ（やめられる）
//              → うけて もらえたら 4ひきを 選ぶ → 相手を 待つ（選びなおす・やめる）→ 2人とも 決まったら 戦い
//   申しこまれた 人: どこに いても（闘技場の 中の 原っぱ・メニュー・受付の 画面）まどが 出る →「うける！」か「ことわる」
//              → うけると その場で 受付の まど（カウンター）が 開いて 4ひきを 選ぶ → 相手を 待つ → 戦い
//   戦いの 画面は ふだんと おなじ（相手の 画面は サーバーが 敵と みかたを 入れかえて 送る。自分の 魔物が 下に 出る）
//   サーバーからの 知らせ { t:'monLive', id, role, state:'ask'|'pick'|'go'|'battle'|'end', opp, even, meReady, oppReady, left, text } は game.js → onMonLive
import { el, ListMenu, toast, CONFIRM_Z } from './dom.js?v=3b960a0fc297';
import { Counter } from './counter.js?v=3b960a0fc297';
import { request } from './shop.js?v=3b960a0fc297';
import { faceURL } from '../field.js?v=3b960a0fc297';
import { boardIconURL } from '../render/boards.js?v=3b960a0fc297';
import { MONARENA_EXTRA, monArenaPickTeam, monArenaTeamCards, monArenaCss } from './monarena.js?v=3b960a0fc297';

const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
const evenText = (even) => (even ? 'レベルをそろえる' : 'そのままの強さ');
const EVEN_NOTE = '「そのままの強さ」…おたがい、今のレベルのままで戦う。\n「レベルをそろえる」…両方の魔物が、みんな同じレベルになって戦う。小さい子の魔物でも、いい勝負！';
const HINT = '家族と2人で闘技場に来て、その場で対戦を申しこむ。\n相手が「受ける」と、おたがいに4ひきを選んで、コマンドを選んで戦うよ。\n（「めいれいさせろ」の魔物は、自分でコマンドを選ぶ）';
// 知らせが こない 時間（これより 長いと 通信が とぎれたと 見る。サーバーは 2.5びょうごとに 送る）
const LOST_MS = 9000;

// 今の 対戦の ようす（いちばん 新しい 知らせ）。ver … ようすが かわった 回数（待っている 画面を 先へ すすめる）
export const live = { cur: null, ver: 0, at: 0, recv: null, prompt: null, flow: null, asked: new Set() };

// サーバーの 窓口（ほかの 窓口の へんじと まざらない ように、前の へんじを 待ってから）
async function svcQ(game, msg) {
  for (let i = 0; i < 60 && game.svcWaiter; i++) await wait(50);
  return request(game, msg);
}
const svcLive = (game, msg) => svcQ(game, { kind: 'monlive', ...msg });
// へんじの いらない とりやめ（画面を とじた 時）
function quietCancel(game, id) {
  if (!id) return;
  try { game.net.send({ t: 'svc', kind: 'monlive', op: 'cancel', id, quiet: true }); } catch { /* きれた */ }
}

const curOf = (id) => (live.cur && live.cur.id === id ? live.cur : null);
const ended = (id) => {
  const c = curOf(id);
  return !c || c.state === 'end' || c.state === 'battle';
};

// ───────────── サーバーからの 知らせ（game.js）─────────────
export function onMonLive(game, m) {
  if (!m || !m.id) return;
  const prev = live.cur;
  live.at = Date.now();
  if (!prev || prev.id !== m.id || prev.state !== m.state) live.ver++;
  live.cur = m;
  if (m.state === 'end') {
    live.asked.delete(m.id);
    if (live.prompt?.id === m.id) {
      live.prompt.close();
      if (m.text) toast(m.text, 4500);
    } else if (live.flow !== m.id && m.text) toast(m.text, 4500);
    return;
  }
  if (m.state === 'ask' && m.role === 'b' && !live.asked.has(m.id)) {
    live.asked.add(m.id);
    askBox(game, m).catch((e) => console.error(e));
  }
  if (m.state === 'pick' && prev?.id === m.id && m.oppReady && !prev.oppReady && live.flow === m.id) toast(`${m.opp}のチームが決まったよ！`);
}

// 待っている 間に 知らせが くる（または とぎれる）と、カウンターの 待ちを とく
async function guarded(ct, id, fn) {
  const v0 = live.ver;
  const iv = setInterval(() => {
    const c = curOf(id);
    if (c && c.state !== 'end' && c.state !== 'battle' && Date.now() - live.at > LOST_MS) {
      live.cur = { ...c, state: 'end', text: '通信がとぎれてしまったみたい…' };
      live.ver++;
    }
    if (live.ver !== v0) for (const f of [...ct.hooks]) f();
  }, 80);
  try {
    return await fn();
  } finally {
    clearInterval(iv);
  }
}

async function endSay(ct, id) {
  const text = curOf(id)?.text || '対戦は、なしになった…';
  ct.list(null);
  ct.info(null);
  await ct.say(text);
  await ct.tap(2600);
}

function vsBox(game, st, team, oppName, even, note) {
  const box = el('div', { class: 'ct-item' });
  box.append(el('div', { class: 'mona-vs small' }, el('span', { class: 'who', text: `相手: ${oppName}` }), `（${evenText(even)}）`));
  if (team?.length) box.append(el('div', { class: 'mona-h', text: `${game.me?.name || ''}のチーム` }), monArenaTeamCards(team, st.monsters || []));
  if (note) box.append(el('div', { class: 'mona-note small', text: note }));
  return box;
}

// ───────────── 4ひきを 選んで 相手を 待つ（2人 おなじ）─────────────
// もどりち: 'go'（戦いが はじまる）/ 'end'（なしに なった）/ 'closed'（画面が とじた）
async function teamStage(ctx, id) {
  const { game, ct, st } = ctx;
  const info0 = curOf(id);
  const opp = info0?.opp || '相手';
  const even = !!info0?.even;
  const title = `${opp}との対戦`;
  ct.list(null);
  ct.info(vsBox(game, st, null, opp, even, even ? `この対戦は、みんなレベル${info0?.evenLv || 50}にそろえて戦う。` : 'この対戦は、おたがい今のレベルのままで戦う。'));
  await guarded(ct, id, async () => {
    await ct.say(`${opp}との対戦だ！\n強さは「${evenText(even)}」。戦う4ひきを選んでね。`);
    await ct.tap(1800);
  });
  for (;;) {
    if (ct.closed) return 'closed';
    if (ended(id)) return 'end';
    const team = await guarded(ct, id, () => ctx.pickTeam({ purpose: 'fight', title }));
    if (ct.closed) return 'closed';
    if (ended(id)) return 'end';
    if (!team) {
      const a = await guarded(ct, id, () => ct.ask('対戦をやめる？', ['やめる', '続ける']));
      if (ct.closed) return 'closed';
      if (ended(id)) return 'end';
      if (a === 0) {
        await svcLive(game, { op: 'cancel', id });
        live.cur = { ...(curOf(id) || { id }), state: 'end', text: '対戦をやめたよ。' };
        return 'end';
      }
      continue;
    }
    const r = await svcLive(game, { op: 'team', id, team });
    if (ct.closed) return 'closed';
    if (r?.go || r?.me?.state === 'go') return 'go';
    if (!r?.ok) {
      if (!r?.me) {
        if (!ended(id)) live.cur = { ...(curOf(id) || { id }), state: 'end', text: r?.text || '対戦は、なしになった…' };
        return 'end';
      }
      ct.list(null);
      await ct.say(r.text || 'そのチームでは戦えないみたい');
      await ct.tap(2000);
      continue;
    }
    st.team = [...team];
    // 相手を 待つ（選びなおす・やめる）
    let again = false;
    while (!again) {
      ct.info(vsBox(game, st, team, opp, even, curOf(id)?.oppReady ? `${opp}のチームも決まったよ！` : `${opp}は、まだチームを選んでいるところ。\n決まったら、すぐに戦いが始まるよ。`));
      const it = await guarded(ct, id, async () => {
        await ct.say(`${opp}がチームを選ぶのを待っているよ…`);
        return ct.pick([{ value: 're', label: 'チームを選びなおす' }, { value: 'stop', label: '対戦をやめる' }], { back: null });
      });
      if (ct.closed) return 'closed';
      if (curOf(id)?.state === 'go') return 'go';
      if (ended(id)) return 'end';
      if (!it) continue;
      if (it.value === 'stop') {
        await svcLive(game, { op: 'cancel', id });
        live.cur = { ...(curOf(id) || { id }), state: 'end', text: '対戦をやめたよ。' };
        return 'end';
      }
      const u = await svcLive(game, { op: 'unready', id });
      if (u?.me?.state === 'go' || curOf(id)?.state === 'go') return 'go';
      again = true;
    }
  }
}

async function goSay(ctx, id, team) {
  const { game, ct, st } = ctx;
  const c = curOf(id);
  ct.list(null);
  ct.info(vsBox(game, st, team || st.team, c?.opp || '相手', !!c?.even, ''));
  game.audio?.sfx('confirm');
  await ct.say(`${c?.opp || '相手'}との対戦、始め！\nがんばってね！`);
  await ct.tap(1000);
}

// ───────────── 申しこむ 人（受付の 画面から）─────────────
function personInfo(p, rec, note = '') {
  const box = el('div', { class: 'ct-item' });
  box.append(el('div', { class: 'hd' }, el('span', { class: 'gold', text: p.name }), el('span', { class: 'st', text: `Lv${p.level}` })));
  box.append(el('div', { class: 'bank-row' }, el('span', { text: '戦える魔物' }), el('span', { text: `${p.mons}ひき` })));
  const r = rec?.[p.charId];
  box.append(el('div', { class: 'bank-row' }, el('span', { text: 'その場の対戦の記録' }), el('span', { class: 'gold', text: r ? `${r.w}勝${r.l}敗` : 'まだ' })));
  if (!p.can) box.append(el('div', { class: 'mona-note small', text: `今は申しこめない（${p.why}）` }));
  if (note) box.append(el('div', { class: 'mona-note small', text: note }));
  return box;
}

function face(p) {
  try { return faceURL({ look: p.look, job: p.job }); } catch { return ''; }
}

async function waitAnswer(ctx, id, name) {
  const { game, ct } = ctx;
  ct.list(null);
  const left = el('span', { class: 'gold', text: '' });
  const tick = () => {
    const c = curOf(id);
    const ms = c?.left ? Math.max(0, c.left - (Date.now() - live.at)) : 0;
    left.textContent = ms ? `あと${Math.ceil(ms / 1000)}びょう` : '';
  };
  ct.info(el('div', { class: 'ct-item' }, el('div', { class: 'mona-h', text: `${name}のへんじを待っている…` }), el('div', { class: 'bank-row' }, el('span', { text: 'のこり' }), left),
    el('div', { class: 'mona-note small', text: `${name}の画面に、申しこみのまどが出ているよ。\n「受ける」を選んでもらってね。` })));
  tick();
  const iv = setInterval(tick, 500);
  try {
    let first = true;
    for (;;) {
      const it = await guarded(ct, id, async () => {
        if (first) await ct.say(`${name}に申しこんだよ！\nへんじを待っているね…`);
        first = false;
        return ct.pick([{ value: 'stop', label: '申しこみをやめる' }], { back: null });
      });
      if (ct.closed) return 'closed';
      const c = curOf(id);
      if (c?.state === 'pick') {
        game.audio?.sfx('join');
        ct.info(null);
        await ct.say(`${name}が、対戦を受けてくれた！`);
        await ct.tap(1400);
        return ct.closed ? 'closed' : 'pick';
      }
      if (ended(id)) {
        await endSay(ct, id);
        return 'end';
      }
      if (it?.value === 'stop') {
        await svcLive(game, { op: 'cancel', id });
        live.cur = { ...(curOf(id) || { id }), state: 'end', text: '申しこみをやめたよ。' };
        await endSay(ct, id);
        return 'end';
      }
    }
  } finally {
    clearInterval(iv);
  }
}

async function liveRun(ctx) {
  const { game, ct } = ctx;
  let start = 0;
  let id = null;
  let flowId = null;
  try {
    for (;;) {
      if (ct.closed) return null;
      ct.list(null);
      ct.info(null);
      const r = await svcLive(game, { op: 'list' });
      if (ct.closed) return null;
      if (!r?.ok) {
        await ct.say(r?.text || '今は、その場の対戦の受付ができないみたい。');
        await ct.tap(2200);
        return null;
      }
      if (r.me) {
        await ct.say('今は、ほかの対戦の話をしているところみたい。');
        await ct.tap(2200);
        return null;
      }
      const people = r.people || [];
      if (!people.length) {
        ct.info(el('div', { class: 'ct-item' }, el('div', { class: 'mona-note small', text: HINT })));
        const a = await ct.ask('今、闘技場には、ほかの家族がいないみたい。\n家族にも闘技場に来てもらってから、申しこんでね。', ['もう一度さがす', 'もどる']);
        if (a === 0) continue;
        return null;
      }
      const items = people.map((p, i) => ({ value: i, label: p.name, face: face(p), right: p.can ? `Lv${p.level}` : p.why, rightCls: p.can ? '' : 'locked', disabled: !p.can }));
      items.push({ value: 'again', label: 'もう一度さがす' });
      start = Math.min(start, people.length - 1);
      if (!people[start]?.can) start = Math.max(0, people.findIndex((p) => p.can));
      ct.info(personInfo(people[start], r.rec));
      await ct.say('だれに対戦を申しこむ？\n（今、闘技場にいる家族だよ）');
      const it = await ct.pick(items, { start, onMove: (x) => ct.info(x?.value === 'again' ? null : personInfo(people[x.value], r.rec)) });
      if (ct.closed || !it) return null;
      if (it.value === 'again') continue;
      start = it.value;
      const p = people[it.value];
      ct.info(personInfo(p, r.rec, EVEN_NOTE));
      const ev = await ct.ask(`${p.name}に申しこむんだね。\n強さは、どうする？`, ['そのままの強さ', 'レベルをそろえる', 'やめる']);
      if (ct.closed) return null;
      if (ev !== 0 && ev !== 1) continue;
      const res = await svcLive(game, { op: 'invite', sid: p.sid, even: ev === 1 });
      if (ct.closed) {
        quietCancel(game, res?.me?.id);
        return null;
      }
      if (!res?.ok || !res.me) {
        ct.info(null);
        await ct.say(res?.text || 'うまく申しこめなかった…');
        await ct.tap(2400);
        continue;
      }
      id = res.me.id;
      live.cur = { ...res.me, left: res.me.left || 30000 };
      live.at = Date.now();
      live.flow = id;
      flowId = id;
      const ans = await waitAnswer(ctx, id, p.name);
      if (ans === 'closed') return null;
      if (ans !== 'pick') {
        id = null;
        continue;
      }
      const out = await teamStage(ctx, id);
      if (out === 'closed') return null;
      if (out === 'go') {
        id = null;
        await goSay(ctx, live.cur?.id);
        ct.close();
        return 'started';
      }
      await endSay(ct, id);
      id = null;
    }
  } finally {
    if (id && !ended(id)) quietCancel(game, id);
    if (flowId && live.flow === flowId) live.flow = null;
  }
}

// ───────────── 申しこまれた 人 ─────────────
// まどを 出せる 時（原っぱ・メニュー・闘技場の 受付の 画面。ほかの 人と 話している 間・戦いの 間は 待つ）
function canAsk(game) {
  if (game.state !== 'field' || game.battle || game.battleClosing) return false;
  if (!game.busy) return true;
  return !!(live.recv && !live.recv.ct.closed);
}

function askBox(game, m) {
  return (async () => {
    for (let i = 0; i < 400; i++) {
      if (ended(m.id)) return;
      if (canAsk(game)) break;
      await wait(150);
    }
    if (ended(m.id) || !canAsk(game)) return;
    game.audio?.sfx('join');
    const ok = await new Promise((resolve) => {
      const ui = document.getElementById('ui');
      const back = el('div', { class: 'modal-back', style: { zIndex: CONFIRM_Z } });
      const menu = new ListMenu(game.input, {
        items: [{ label: '受ける！', value: true }, { label: 'ことわる', value: false }],
        sound: (x) => game.audio?.sfx(x),
        back: null,
        onSelect: (it) => finish(it.value),
        onCancel: () => {},
      });
      const left = el('div', { class: 'small muted', text: '' });
      const box = el('div', { class: 'win panel center-panel mona-ask', style: { width: 'min(92vw, 520px)', zIndex: CONFIRM_Z + 1, background: 'var(--win-solid)' } },
        el('div', { class: 'gold', text: 'モンスター闘技場' }),
        el('div', { style: { whiteSpace: 'pre-line', margin: '0.3em 0 0.5em' }, text: `${m.opp}から、魔物の対戦の申しこみが来た！\n強さ:「${evenText(m.even)}」${m.even ? `（みんなレベル${m.evenLv || 50}）` : ''}\n受ける？` }),
        left, menu.root);
      const t0 = Date.now();
      const tick = () => {
        const c = curOf(m.id);
        const ms = c?.left ? Math.max(0, c.left - (Date.now() - live.at)) : Math.max(0, (m.left || 30000) - (Date.now() - t0));
        left.textContent = `（あと${Math.ceil(ms / 1000)}びょう）`;
      };
      tick();
      const iv = setInterval(tick, 500);
      let done = false;
      const finish = (v) => {
        if (done) return;
        done = true;
        clearInterval(iv);
        menu.blur();
        back.remove();
        box.remove();
        if (live.prompt?.id === m.id) live.prompt = null;
        resolve(v);
      };
      live.prompt = { id: m.id, close: () => finish(null) };
      ui.append(back, box);
      menu.focus();
    });
    if (ok === null || ended(m.id)) return;
    if (!ok) {
      await svcLive(game, { op: 'answer', id: m.id, ok: false });
      return;
    }
    const r = await svcLive(game, { op: 'answer', id: m.id, ok: true });
    if (!r?.ok) {
      toast(r?.text || '対戦は、なしになった…', 4000);
      return;
    }
    await acceptFlow(game, m.id);
  })();
}

async function acceptFlow(game, id) {
  live.flow = id;
  try {
    // メニュー・受付の 画面を とじて、闘技場の 司会の まどで 4ひきを 選ぶ
    if (game.menuOpen) {
      game.menu.close();
      game.closeFieldUI();
    }
    if (live.recv && !live.recv.ct.closed) live.recv.ct.close();
    for (let i = 0; i < 60 && (game.busy || game.script?.running); i++) await wait(50);
    if (ended(id)) return;
    monArenaCss();
    const ct = new Counter(game, { title: 'モンスター闘技場', keeper: '闘技場の司会', icon: boardIconURL('arena'), cls: 'monarena-panel' });
    ct.say('ちょっと待ってね…');
    const st = await svcQ(game, { kind: 'monarena', action: 'status' });
    if (ct.closed) return quietCancel(game, id);
    if (!st?.ok) {
      await svcLive(game, { op: 'cancel', id });
      await ct.say('ごめんね、今は受付のじゅんびをしているところなんだ。');
      await ct.tap(2400);
      ct.close();
      return;
    }
    for (const k of ['ranks', 'monsters', 'family', 'team', 'reg']) if (!Array.isArray(st[k])) st[k] = [];
    const ctx = { game, ct, st, data: {} };
    ctx.svc = (msg) => svcQ(game, { kind: 'monarena', ...msg });
    ctx.pickTeam = (opts) => monArenaPickTeam(ctx, opts);
    const out = await teamStage(ctx, id);
    if (out === 'closed') {
      if (!ended(id)) quietCancel(game, id);
      return;
    }
    if (out === 'go') {
      await goSay(ctx, id);
      ct.close();
      return;
    }
    await endSay(ct, id);
    ct.close();
  } finally {
    if (live.flow === id) live.flow = null;
  }
}

// ───────────── 受付の えらびしに 足す ─────────────
MONARENA_EXTRA.push({
  value: 'live',
  label: 'その場で家族と対戦',
  hint: HINT,
  // 受付の 画面を おぼえておく（申しこまれた 時に とじて、4ひきを 選ぶ まどに する）
  show: (ctx) => {
    live.recv = ctx;
    return true;
  },
  run: (ctx) => liveRun(ctx),
});
