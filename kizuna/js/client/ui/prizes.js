// 第50回 D3: 景品の まど（カジノの 景品コーナー・メダル王・星のかけらの こうかんの 見せかた）
//   ・なかまの 絵と 名札（装備・見た目・便利・魔物。shared/data/prizes-r50.js の prizeCatOf）
//   ・NEW … 前に 開いた ときに なかった 品（サーバーが きめる。world/prizes-r50.js の takeFresh）
//   ・装備は「▲12」… 自分か 仲間が 装備すると いちばん 強くなる ぶん（くわしくは みぎの まどの くらべ）
//   ・こうかんの えんしゅつ（きらきら ＋ ファンファーレ）。乱数・コインの 計算は サーバー（shared/world/casino.js）
//   カジノの まどの 部品（CasinoCounter など）は ui/casino.js から（この ファイルは ui/casino.js が あとから 読む）
import { el, esc } from './dom.js?v=a8edacfcfd44';
import { itemInfo, compareTeam } from './counter.js?v=a8edacfcfd44';
import { request } from './shop.js?v=a8edacfcfd44';
import { boardIconURL } from '../render/boards.js?v=a8edacfcfd44';
import { prizeIconURL } from '../render/prize-icons.js?v=a8edacfcfd44';
import { monsterCanvas } from '../render/monsters.js?v=a8edacfcfd44';
import { ITEMS } from '../../shared/data/items.js?v=a8edacfcfd44';
import { MONSTERS } from '../../shared/data/monsters.js?v=a8edacfcfd44';
import { MONSTER_FRIENDS, RACE_NAMES, rankOf } from '../../shared/data/companions.js?v=a8edacfcfd44';
import { VEHICLES } from '../../shared/data/vehicles.js?v=a8edacfcfd44';
import { itemCount } from '../../shared/stats.js?v=a8edacfcfd44';
import { coinsOf, medalsHeld, medalsGiven } from '../../shared/data/casino.js?v=a8edacfcfd44';
import { PRIZE_CATS, prizeCatOf } from '../../shared/data/prizes-r50.js?v=a8edacfcfd44';
import { CasinoCounter, fmt, sendClose, ensureStyle } from './casino.js?v=a8edacfcfd44';

const itemsText = (items) => items.map(([id, n]) => `${ITEMS[id]?.name || id}${n > 1 ? `×${n}` : ''}`).join('と');
const CAT_ORDER = ['gear', 'look', 'tool', 'monster'];
const CAT_HEAD = { gear: '強い装備', look: '見た目が変わる物', tool: '便利な道具', monster: 'めずらしい魔物' };
const EQUIP = ['weapon', 'armor', 'shield', 'head', 'acc'];

// ───────────── 一覧の 1行 ─────────────
// 持っている（乗り物券は その 乗り物を もう 持っている）
export function prizeHaveLocal(me, id) {
  const eff = ITEMS[id]?.effect;
  if (eff?.type === 'prizeRide') return (Array.isArray(me?.vehicles) && me.vehicles.includes(eff.vehicle)) || itemCount(me, id) > 0;
  return itemCount(me, id) > 0;
}
// 装備すると いちばん 強くなる ぶん（自分と 自分の 仲間。上がらなければ 0）
export function bestUp(game, id) {
  if (!EQUIP.includes(ITEMS[id]?.type)) return 0;
  try {
    return Math.max(0, ...compareTeam(game, id).filter((r) => r.can && !r.same).map((r) => r.main?.d || 0));
  } catch {
    return 0;
  }
}
// 名前の まわり（絵・名前・NEW・持っている・▲）
export function prizeRowHtml(game, id, { fresh = false, have = false } = {}) {
  const cat = prizeCatOf(ITEMS[id]);
  const up = bestUp(game, id);
  return `<img class="pz-ico" src="${prizeIconURL(PRIZE_CATS[cat]?.cls || 'tool')}" alt="" title="${esc(PRIZE_CATS[cat]?.name)}">`
    + `<span class="pz-nm">${esc(ITEMS[id]?.name || id)}</span>`
    + `${fresh ? '<span class="pz-tag pz-new">NEW</span>' : ''}`
    + `${have ? '<span class="pz-tag pz-have">持っている</span>' : ''}`
    + `${up > 0 ? `<span class="pz-up">▲${up}</span>` : ''}`;
}
// なかまごとに 見出しを つけて ならべる（NEW は いちばん 上に まとめる）
//   list … [{ id, price, … }]。row(x) … ListMenu の 1行
export function groupRows(list, fresh, row) {
  const out = [];
  const newOnes = list.filter((x) => fresh.has(x.id));
  if (newOnes.length) {
    out.push({ header: true, label: `★ 新しく入った品（${newOnes.length}）`, cls: 'pz-hdr-new' });
    for (const x of newOnes) out.push(row(x, true));
  }
  for (const cat of CAT_ORDER) {
    const xs = list.filter((x) => !fresh.has(x.id) && prizeCatOf(ITEMS[x.id]) === cat).sort((a, b) => a.price - b.price);
    if (!xs.length) continue;
    out.push({ header: true, label: CAT_HEAD[cat] });
    for (const x of xs) out.push(row(x, false));
  }
  return out;
}

// ───────────── みぎの まど（品の せつめい）─────────────
// 装備は パーティーの くらべ（itemInfo）。よびぶえは 魔物の 絵と ランク、乗り物券は 乗り物の せつめい
export function prizeInfo(game, id) {
  ensurePrizeStyle();
  const box = itemInfo(game, id) || el('div');
  const it = ITEMS[id];
  const cat = prizeCatOf(it);
  box.prepend(el('div', { class: `pz-cat pz-c-${PRIZE_CATS[cat]?.cls}` }, el('img', { class: 'pz-ico', src: prizeIconURL(PRIZE_CATS[cat]?.cls), alt: '' }), PRIZE_CATS[cat]?.name || ''));
  const eff = it?.effect;
  if (eff?.type === 'prizeMonster' && MONSTERS[eff.species]) {
    const m = MONSTERS[eff.species];
    const f = MONSTER_FRIENDS[eff.species];
    let src = '';
    try { src = monsterCanvas(eff.species, 0).toDataURL(); } catch { /* 絵が ない ときは 名前だけ */ }
    box.append(el('div', { class: 'pz-mon' },
      src ? el('img', { class: 'pz-mon-img', src, alt: '' }) : null,
      el('div', { class: 'pz-mon-tx' },
        el('div', { class: 'gold', text: `${m.name}（${RACE_NAMES[m.race] || ''}・ランク${rankOf(eff.species, MONSTERS)}）` }),
        el('div', { class: 'detail', text: f?.note || m.desc || '' }),
        el('div', { class: 'small', text: '配合の親にもなれる。仲間がいっぱいの時は、魔物あずかり所で待つ。' }))));
  } else if (eff?.type === 'prizeRide' && VEHICLES[eff.vehicle]) {
    const v = VEHICLES[eff.vehicle];
    const own = Array.isArray(game.me?.vehicles) && game.me.vehicles.includes(eff.vehicle);
    box.append(el('div', { class: 'pz-mon' }, el('div', { class: 'pz-mon-tx' },
      el('div', { class: 'gold', text: `乗り物「${v.name}」` }),
      el('div', { class: 'detail', text: v.desc }),
      el('div', { class: `small ${own ? 'good' : ''}`, text: own ? 'もう持っている' : '道具から使うと、メニューの「乗り物」で選べるようになる' }))));
  }
  return box;
}

// ───────────── こうかんの えんしゅつ（きらきら ＋ ファンファーレ）─────────────
// 魔物・高い 品（コイン1万枚・星のかけら30個 いじょう）は 大当たりの 曲
export function prizeFx(game, id, { big = false } = {}) {
  ensurePrizeStyle();
  const it = ITEMS[id];
  if (!it || typeof document === 'undefined') return;
  const cat = prizeCatOf(it);
  if (big || cat === 'monster') game.audio.play?.('jackpot');
  else {
    game.audio.sfx('item');
    setTimeout(() => game.audio.sfx('sparkle'), 160);
  }
  let pic = el('img', { class: 'pz-fx-ico', src: prizeIconURL(PRIZE_CATS[cat]?.cls), alt: '' });
  if (it.effect?.type === 'prizeMonster') {
    try { pic = el('img', { class: 'pz-fx-mon', src: monsterCanvas(it.effect.species, 0).toDataURL(), alt: '' }); } catch { /* 絵が ない */ }
  }
  const stars = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const r = 150 + (i % 3) * 40;
    stars.push(el('span', { class: 'pz-star', style: `--dx: ${Math.round(Math.cos(a) * r)}px; --dy: ${Math.round(Math.sin(a) * r)}px; --d: ${(i % 4) * 60}ms;` }));
  }
  const fx = el('div', { class: `pz-fx pz-c-${PRIZE_CATS[cat]?.cls}`, role: 'status', 'aria-live': 'polite' },
    el('div', { class: 'pz-burst' }),
    el('div', { class: 'pz-card' }, pic, el('div', { class: 'pz-fx-name', text: it.name }), el('div', { class: 'pz-fx-sub', text: 'こうかんした！' })),
    ...stars);
  const kill = () => fx.remove();
  fx.addEventListener('click', kill);
  document.getElementById('ui')?.append(fx);
  setTimeout(kill, 2300);
}

// ───────────── カジノの 景品コーナー ─────────────
export async function prizesUI(game, data) {
  ensureStyle();
  ensurePrizeStyle();
  const ct = new CasinoCounter(game, { title: '景品コーナー', keeper: '景品係', icon: boardIconURL('casino'), purse: 'coins' });
  ct.root.classList.add('pz-counter');
  // 第37回 B: 宝の地図の クリア数の 段で 景品が ふえる（data/casino-tier.js）。たなに「あと〇こ」
  const t = data.tier;
  const shelf = t && t.left > 0 ? `\n（宝の地図をあと${t.left}こクリアすると、新しい景品が入ります）` : '';
  const AGAIN = `ほかにも何かこうかんしますか？${shelf}`;
  const fresh = new Set(data.fresh || []);
  const storyMore = data.story ?? data.more ? '\n（お話が進むと、景品がふえますよ）' : '';
  let line = fresh.size
    ? `いらっしゃいませ！\n新しい景品が${fresh.size}こ入りましたよ！${shelf || storyMore}`
    : `いらっしゃいませ！\nコインを、すてきな景品とこうかんいたします。${shelf || storyMore}`;
  let idx = -1;
  const list = (data.prizes || []).filter((p) => ITEMS[p.id]).map((p) => ({ id: p.id, price: p.coins }));
  while (!ct.closed) {
    await ct.say(line);
    const coins = coinsOf(game.me);
    const rows = groupRows(list, fresh, (x, isNew) => ({
      value: x.id, cls: 'pz-row', html: prizeRowHtml(game, x.id, { fresh: isNew, have: prizeHaveLocal(game.me, x.id) }),
      right: `${fmt(x.price)}枚`, rightCls: coins < x.price ? 'dis' : 'gold', coins: x.price,
    }));
    const start = idx >= 0 ? idx : rows.findIndex((r) => !r.header);
    const pick = await ct.pick(rows, { start, back: 'やめる', onMove: (x) => ct.info(x && !x.header ? prizeInfo(game, x.value) : null) });
    if (ct.closed || !pick) break;
    idx = rows.indexOf(pick);
    const it = ITEMS[pick.value];
    if (coinsOf(game.me) < pick.coins) {
      game.audio.sfx('buzz');
      await ct.say(`${it.name}は、コイン${fmt(pick.coins)}枚です。\nおや？コインが足りないようですね。`);
      await ct.tap(1800);
      line = AGAIN;
      continue;
    }
    const yes = await ct.ask(`${it.name}ですね。\nコイン${fmt(pick.coins)}枚とこうかんしますか？`);
    if (ct.closed) break;
    if (yes !== 0) {
      line = AGAIN;
      continue;
    }
    const r = await request(game, { kind: 'casino', action: 'prize', id: pick.value });
    ct.updGold();
    if (!r.ok) {
      game.audio.sfx('buzz');
      await ct.say(r.text || 'おや？何かおかしいようですね。');
      await ct.tap(1800);
      line = AGAIN;
      continue;
    }
    prizeFx(game, pick.value, { big: pick.coins >= 10000 });
    ct.info(prizeInfo(game, pick.value));
    const how = useHint(pick.value);
    await ct.say(`${r.text}\n（持っている数: ${itemCount(game.me, pick.value)}）${how}`, { narr: true });
    await ct.tap(2400);
    line = `おめでとうございます！\n${AGAIN}`;
  }
  if (!ct.closed) {
    ct.list(null);
    ct.info(null);
    await ct.say('またのおこしをお待ちしております。');
    await ct.tap(1400);
    ct.close();
  }
  sendClose(game);
}

// 道具の 使いかたの ひとこと（よびぶえ・乗り物券・本）
export function useHint(id) {
  const t = ITEMS[id]?.effect?.type;
  if (t === 'prizeMonster') return '\n道具から使うと、仲間になります。';
  if (t === 'prizeRide') return '\n道具から使うと、乗り物がもらえます。';
  if (t === 'jobBook' || t === 'expBook') return '\n道具から、だれかに使ってください。';
  return '';
}

// ───────────── メダル王 ─────────────
export async function medalKingUI(game, data) {
  ensureStyle();
  ensurePrizeStyle();
  const ct = new CasinoCounter(game, { title: 'メダル王の城', keeper: 'メダル王', icon: boardIconURL('medal'), purse: 'medals' });
  let info = data;
  const fresh = new Set((data.fresh || []).map(String));
  const held = () => medalsHeld(game.me);
  let line = held() ? `おお、小さなメダルを${held()}枚持っておるな！\nさあ、どうするかな？` : 'さあ、どうするかな？';
  if (fresh.size) line += '\n（ごほうびの一覧に、新しいほうびがふえたぞ）';
  while (!ct.closed) {
    await ct.say(line);
    ct.info(medalSummary(game, info));
    const cmd = await ct.pick([
      { label: 'メダルをわたす', value: 'give' },
      { label: 'ごほうびの一覧', value: 'list', html: fresh.size ? 'ごほうびの一覧<span class="pz-tag pz-new">NEW</span>' : undefined },
      { label: 'やめる', value: 'exit' },
    ], { back: null });
    if (ct.closed || !cmd || cmd.value === 'exit') break;
    if (cmd.value === 'list') {
      await rewardList(game, ct, info, fresh);
      line = 'ほかに何か用かな？';
      continue;
    }
    const n = held();
    // もう わたした 数で もらえる ごほうびが 残っている（あとから ふえた・お話が 進んで もらえる ように なった ごほうび）
    const pend = (info.rewards || []).some((x) => !x.got && !x.locked && x.at <= (info.given ?? medalsGiven(game.me)));
    if (!n && !pend) {
      await ct.say('おや、小さなメダルを持っておらんようじゃな。\nつぼやたる、井戸の中などを調べて探してみるのじゃ。');
      await ct.tap(2200);
      line = 'ほかに何か用かな？';
      continue;
    }
    const yes = n ? await ct.ask(`小さなメダルを${n}枚、わしにわたしてくれるかな？`) : 0;
    if (ct.closed) break;
    if (yes !== 0) {
      line = 'そうか。気が向いたら、いつでも持ってくるがよい。';
      continue;
    }
    const r = await request(game, { kind: 'medal', action: 'give' });
    ct.updGold();
    if (r.medal) info = r.medal;
    if (!r.ok) {
      await ct.say(r.text || 'おや？');
      await ct.tap(1800);
      line = 'ほかに何か用かな？';
      continue;
    }
    ct.info(medalSummary(game, info));
    if (r.gave) {
      game.audio.sfx('coin');
      await ct.say(`${r.gave}枚のメダル、たしかにうけとったぞ！\nこれで、わしにわたしたメダルは全部で${r.total}枚じゃな。`);
      await ct.tap(2400);
    } else {
      await ct.say('おお、そなたにはまだ、わたしていないほうびがあったのじゃ！');
      await ct.tap(1800);
    }
    for (const g of r.got || []) {
      game.audio.play('jackpot');
      await ct.say(`${g.at}枚のほうびとして、これをとらせよう！`);
      await ct.tap(1600);
      prizeFx(game, g.items[0][0], { big: true });
      await ct.say(`${game.me.name}は${itemsText(g.items)}を手に入れた！${useHint(g.items[0][0])}`, { narr: true });
      ct.info(prizeInfo(game, g.items[0][0]));
      await ct.tap(2600);
    }
    const next = info.rewards?.find((x) => !x.got && !x.locked);
    const lockedLeft = info.rewards?.some((x) => !x.got && x.locked);
    line = next ? `次は${next.at}枚で、${itemsText(next.items)}をやろう。\nがんばって探すのじゃぞ！`
      : lockedLeft ? 'そなたの旅がもっと進んだら、また来るがよい。\nとっておきのほうびを用意しておくぞ。'
        : 'わしのほうびは、これで全部じゃ！\nそなたこそ、真のメダル王じゃ！';
  }
  if (!ct.closed) {
    ct.list(null);
    ct.info(null);
    await ct.say('また小さなメダルを見つけたら、持ってくるのじゃぞ。');
    await ct.tap(1400);
    ct.close();
  }
  sendClose(game, 'medal');
}

// ごほうびまで あと何枚（持っている メダルを わたせば とどく ときは そう 言う）
function rewardLeft(game, given, r) {
  if (r.got) return { text: 'もらった', cls: 'good' };
  if (r.locked) return { text: 'お話が進むと', cls: 'muted' };
  const left = r.at - given - medalsHeld(game.me);
  return left <= 0 ? { text: 'わたすともらえる', cls: 'gold' } : { text: `あと${left}枚`, cls: '' };
}

function medalSummary(game, info) {
  const given = info.given ?? medalsGiven(game.me);
  const next = info.rewards?.find((x) => !x.got && !x.locked);
  const box = el('div', { class: 'cs-medal-sum' });
  box.append(el('div', { class: 'kv' }, el('span', { class: 'k', text: '持っているメダル' }), el('span', { class: 'gold', text: `${medalsHeld(game.me)}枚` })));
  box.append(el('div', { class: 'kv' }, el('span', { class: 'k', text: 'メダル王にわたした数' }), el('span', { text: `${given}枚` })));
  if (next) box.append(el('div', { class: 'detail', text: `次のごほうび: ${next.at}枚で「${itemsText(next.items)}」（${rewardLeft(game, given, next).text}）` }));
  else if (info.rewards?.some((x) => !x.got)) box.append(el('div', { class: 'detail', text: '旅が進むと、もらえるごほうびがふえる。' }));
  else box.append(el('div', { class: 'detail good', text: 'ごほうびは全部もらった！' }));
  box.append(el('div', { class: 'detail', text: '小さなメダルは、つぼ・たる・本だな・井戸などを調べると見つかることがある。光っている地面や、宝箱に入っていることもある。' }));
  return box;
}

async function rewardList(game, ct, info, fresh = new Set()) {
  const given = info.given ?? medalsGiven(game.me);
  await ct.say('わしにわたしたメダルの数に合わせて、\nこれらのほうびをとらせよう。');
  const rows = (info.rewards || []).map((r) => {
    const left = rewardLeft(game, given, r);
    // 名前の とちゅうでは おりかえさない（品と 品の あいだだけ）。せまい 画面では みぎの じょうたいが 下の 行へ
    // お話が 進むまで もらえない ほうびは 名前を かくす（ネタバレに ならない ように）
    const names = r.locked ? '<span class="nw muted">？？？</span>'
      : r.items.map(([id, n]) => `<span class="nw">${esc(ITEMS[id]?.name || id)}${n > 1 ? `×${n}` : ''}</span>`).join('と<wbr>');
    const tag = fresh.has(String(r.at)) && !r.got ? '<span class="pz-tag pz-new">NEW</span>' : '';
    return { value: r.at, cls: 'cs-rw', html: `<span class="cs-at">${r.at}枚</span><span class="cs-rn">${names}${tag}</span>`, right: left.text, rightCls: left.cls, items: r.items, locked: r.locked };
  });
  await ct.pick(rows, {
    back: 'もどる',
    onMove: (x) => ct.info(!x ? null : x.locked ? el('div', { class: 'detail', text: 'そなたの旅がもっと進んだら、教えてやろう。' }) : prizeInfo(game, x.items[0][0])),
  });
}

// ───────────── 星のかけらの こうかん（ui/services.js の starUI が 使う）─────────────
// data … { trades: [{ shards, item }], fresh: [品ID], more }
export function starTradeRows(game, data) {
  ensurePrizeStyle();
  const fresh = new Set(data.fresh || []);
  const have = itemCount(game.me, 'star_shard');
  const list = (data.trades || []).filter((t) => ITEMS[t.item]).map((t) => ({ id: t.item, price: t.shards, t }));
  return groupRows(list, fresh, (x, isNew) => ({
    value: x.id, cls: 'pz-row', html: prizeRowHtml(game, x.id, { fresh: isNew, have: prizeHaveLocal(game.me, x.id) }),
    right: `★${x.price}`, rightCls: have < x.price ? 'dis' : 'gold', trade: x.t,
  }));
}

// ───────────── 見た目（この ファイルだけの CSS）─────────────
let styled = false;
export function ensurePrizeStyle() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  const st = document.createElement('style');
  st.id = 'prize-style';
  st.textContent = `
.menu .item.pz-row .l { display: flex; align-items: center; gap: 0.3em; min-width: 0; flex-wrap: wrap; }
.pz-ico { width: 1.3em; height: 1.3em; image-rendering: pixelated; flex: none; }
.pz-nm { min-width: 0; }
.pz-tag { display: inline-block; font-size: 0.72em; line-height: 1.3; padding: 0 0.35em; border-radius: 3px; border: 1px solid; white-space: nowrap; margin-left: 0.2em; }
.pz-new { color: #fff; background: #e0304a; border-color: #ff8a9a; animation: pz-blink 1.2s ease-in-out infinite; }
.pz-have { color: #9ad8ff; border-color: rgba(154, 216, 255, 0.6); }
.pz-up { color: #7cf08a; font-size: 0.8em; white-space: nowrap; font-variant-numeric: tabular-nums; }
.menu .hdr.pz-hdr-new { color: #ff9aaa; }
@keyframes pz-blink { 50% { filter: brightness(1.35); } }
.pz-cat { display: inline-flex; align-items: center; gap: 0.3em; font-size: var(--fs-small); padding: 0.05em 0.5em; border-radius: 999px; margin-bottom: 0.25em; border: 1px solid currentColor; }
.pz-c-gear { color: #ffd66b; } .pz-c-look { color: #ff9ad0; } .pz-c-tool { color: #8ac4ff; } .pz-c-mon { color: #8af08a; }
.pz-mon { display: flex; gap: 0.6em; align-items: center; margin-top: 0.4em; padding-top: 0.4em; border-top: 1px dashed rgba(255, 214, 107, 0.35); }
.pz-mon-img { width: 72px; height: auto; image-rendering: pixelated; flex: none; }
.pz-mon-tx { min-width: 0; }
.pz-fx { position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; pointer-events: auto; animation: pz-fade 2.3s ease forwards; }
.pz-burst { position: absolute; width: 520px; height: 520px; max-width: 140vw; max-height: 140vw; border-radius: 50%;
  background: repeating-conic-gradient(rgba(255, 230, 140, 0.5) 0 10deg, rgba(255, 230, 140, 0) 10deg 22deg);
  -webkit-mask: radial-gradient(circle, #000 25%, transparent 70%); mask: radial-gradient(circle, #000 25%, transparent 70%);
  animation: pz-spin 2.3s linear forwards; }
.pz-card { position: relative; display: flex; flex-direction: column; align-items: center; gap: 0.3em; padding: 0.9em 1.4em; min-width: 12em; max-width: 86vw;
  background: var(--win-solid, #1a1630); border: 2px solid #ffd66b; border-radius: 10px; box-shadow: 0 0 24px rgba(255, 214, 107, 0.7);
  animation: pz-pop 0.45s cubic-bezier(0.2, 1.6, 0.4, 1) both; text-align: center; }
.pz-fx-ico { width: 48px; height: 48px; image-rendering: pixelated; }
.pz-fx-mon { width: 96px; height: auto; image-rendering: pixelated; }
.pz-fx-name { color: #ffd66b; font-size: 1.15em; }
.pz-fx-sub { color: #fff; font-size: var(--fs-small); }
.pz-star { position: absolute; z-index: 1; width: 14px; height: 14px; background: #fff6b0; filter: drop-shadow(0 0 3px #ffd66b); clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
  animation: pz-fly 1.4s ease-out var(--d) both; }
@keyframes pz-pop { from { transform: scale(0.2); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes pz-spin { from { transform: rotate(0) scale(0.6); opacity: 0; } 20% { opacity: 1; } to { transform: rotate(120deg) scale(1.1); opacity: 0.2; } }
@keyframes pz-fly { from { transform: translate(0, 0) scale(0.3); opacity: 1; } to { transform: translate(var(--dx), var(--dy)) scale(1.2) rotate(180deg); opacity: 0; } }
@keyframes pz-fade { 0%, 80% { opacity: 1; } 100% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .pz-new, .pz-burst, .pz-star { animation: none; }
  .pz-star { display: none; }
}
`;
  document.head.append(st);
}
