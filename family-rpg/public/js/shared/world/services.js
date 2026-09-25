// お店・やどや・きょうかい・転職・酒場・でんごんばん・メニュー操作
import { SHOPS, STAR_TRADES, revivePrice, CURE_PRICE } from '../data/shops.js';
import { ITEMS, sellPrice, SLOTS } from '../data/items.js';
import { JOBS, ALL_JOBS, jobReqText } from '../data/jobs.js';
import { ABILITIES } from '../data/abilities.js';
import { addItem, removeItem, itemCount, canEquip, canEquipChar, changeJob, computeStats, learnedAbilities, mpCost, penaltyFor, fullHeal } from '../stats.js';
import { TACTICS } from '../ai.js';
import { tavernInfo, recruitNpc, companionJoin, companionWait, companionRelease, companionRename, companionOf, ensureCompanions, partyOf } from './party.js';
import { breedMonsters, breedPreview } from './breed.js';
import { MONSTERS } from '../data/monsters.js';
import { PLACES } from '../maps/overworld.js';
import { POS } from '../maps/index.js';

export function openService(world, s, kind, arg) {
  switch (kind) {
    case 'shop': {
      const shop = SHOPS[arg];
      if (!shop) return null;
      s.openShop = arg;
      return { shop: arg, name: shop.name, items: shop.items };
    }
    case 'jobChange': return { jobs: ALL_JOBS };
    case 'tavern': return tavernInfo(world, s);
    case 'board': return { posts: world.data.board || [] };
    case 'starTrade': return { trades: STAR_TRADES };
    case 'church': return churchInfo(world, s);
    default: return null;
  }
}

function churchInfo(world, s) {
  const p = partyOf(world, s);
  const dead = [];
  const poisoned = [];
  for (const sid of p?.members || []) {
    const m = world.sessions.get(sid);
    if (!m) continue;
    if (m.char.hp <= 0) dead.push({ ref: 'sid:' + sid, name: m.char.name, price: revivePrice(m.char.level) });
    else if (m.char.status?.poison) poisoned.push({ ref: 'sid:' + sid, name: m.char.name, price: CURE_PRICE });
  }
  for (const sup of p?.supports || []) {
    if (sup.char.hp <= 0) dead.push({ ref: 'sup:' + sup.key, name: sup.char.name, price: revivePrice(sup.char.level) });
    else if (sup.char.status?.poison) poisoned.push({ ref: 'sup:' + sup.key, name: sup.char.name, price: CURE_PRICE });
  }
  for (const g of p?.guests || []) {
    if (g.char.hp <= 0) dead.push({ ref: 'guest:' + g.id, name: g.char.name, price: revivePrice(g.char.level) });
    else if (g.char.status?.poison) poisoned.push({ ref: 'guest:' + g.id, name: g.char.name, price: CURE_PRICE });
  }
  return { dead, poisoned };
}

function refChar(world, s, ref) {
  if (!ref || ref === 'self') return s.char;
  if (ref.startsWith('sid:')) {
    const p = partyOf(world, s);
    const sid = ref.slice(4);
    if (!p?.members.includes(sid)) return null;
    return world.sessions.get(sid)?.char || null;
  }
  if (ref.startsWith('sup:')) {
    const p = partyOf(world, s);
    return p?.supports.find((x) => x.key === ref.slice(4))?.char || null;
  }
  if (ref.startsWith('guest:')) {
    const p = partyOf(world, s);
    return p?.guests.find((x) => x.id === ref.slice(6))?.char || null;
  }
  return null;
}

// じぶん か じぶんの なかま（そうび・転職・じゅもん など）。家族の サポートは えらべない
function ownChar(s, who) {
  if (!who || who === 'self') return s.char;
  const e = companionOf(ensureCompanions(s.char), who);
  return e ? e.char : null;
}

// お店などの そうさ
export function serviceAction(world, s, msg) {
  const c = s.char;
  const reply = (ok, text, extra = {}) => {
    world.send(s, { t: 'svcRes', ok, text, ...extra });
    world.sendSelf(s);
    world.markDirty();
  };
  switch (msg.kind) {
    case 'shop': {
      const shop = SHOPS[s.openShop];
      if (msg.action === 'buy') {
        const it = ITEMS[msg.id];
        const qty = Math.max(1, Math.min(99, Math.floor(msg.qty || 1)));
        if (!shop || !shop.items.includes(msg.id) || !it) return reply(false, 'その しなものは ありません');
        const cost = it.price * qty;
        if (c.gold < cost) return reply(false, 'ゴールドが たりないよ');
        c.gold -= cost;
        addItem(c, msg.id, qty);
        let text = `${it.name}を ${qty > 1 ? qty + 'こ ' : ''}かった！`;
        if (msg.equip && canEquip(c.job, msg.id)) {
          equipItem(c, msg.id);
          text = `${it.name}を かって そうびした！`;
        }
        return reply(true, text);
      }
      if (msg.action === 'sell') {
        const it = ITEMS[msg.id];
        const qty = Math.max(1, Math.min(99, Math.floor(msg.qty || 1)));
        if (!it || it.type === 'key') return reply(false, 'それは うれないよ');
        if (itemCount(c, msg.id) < qty) return reply(false, 'もっていないよ');
        const price = sellPrice(msg.id);
        removeItem(c, msg.id, qty);
        c.gold += price * qty;
        return reply(true, `${it.name}を ${price * qty}ゴールドで うった！`);
      }
      return reply(false, '');
    }
    case 'jobChange': {
      if (!JOBS[msg.job]) return reply(false, '');
      const who = ownChar(s, msg.who);
      if (!who || who.species) return reply(false, 'モンスターは 転職できない');
      if (who.job === msg.job) return reply(false, 'いまの しょくぎょうと おなじです');
      const r = changeJob(who, msg.job);
      if (r.locked) return reply(false, `まだ ${JOBS[msg.job].name}には なれない…\n（${jobReqText(msg.job)}が ひつよう）`);
      if (!r.ok) return reply(false, '');
      // なかまが はずした そうびは ふくろへ
      if (who !== c) {
        for (const e of who.items || []) addItem(c, e.id, e.n);
        who.items = [];
      }
      const removed = r.removed.map((id) => ITEMS[id]?.name).filter(Boolean);
      world.sendParty(partyOf(world, s));
      return reply(true, `${who.name}は ${JOBS[msg.job].name}に なった！${removed.length ? `\n（${removed.join('・')}は そうびできないので はずした）` : ''}`, { jobChanged: true, who: msg.who || 'self' });
    }
    case 'tavern': {
      let r;
      let text = '';
      switch (msg.action) {
        case 'recruit':
          r = recruitNpc(world, s, String(msg.key || ''), { swap: msg.swap, join: msg.join !== false });
          if (r.ok) text = r.joined ? `${r.name}が なかまに くわわった！` : `${r.name}が なかまに なった！\n（いまは 酒場で まっている）`;
          break;
        case 'join':
          r = companionJoin(world, s, String(msg.key || ''), msg.swap);
          if (r.ok) text = `${r.name}が パーティーに くわわった！${r.benchedName ? `\n${r.benchedName}は 酒場で まっている。` : ''}`;
          break;
        case 'wait':
          r = companionWait(world, s, String(msg.key || ''));
          if (r.ok) text = `${r.name}は 酒場で まっている。`;
          break;
        case 'release':
          r = companionRelease(world, s, String(msg.key || ''));
          if (r.ok) text = `${r.name}と わかれた。\n「いままで ありがとう！」`;
          break;
        case 'rename':
          r = companionRename(world, s, String(msg.key || ''), msg.name);
          if (r.ok) text = `${r.old}の なまえを ${r.name}に かえた！`;
          break;
        case 'breedPreview': {
          // みるだけ（なにも かわらない）
          const pv = breedPreview(ensureCompanions(s.char), String(msg.a || ''), String(msg.b || ''));
          world.send(s, { t: 'svcRes', ok: pv.ok, text: pv.ok ? '' : pv.reason, preview: pv.ok ? pv : null });
          return;
        }
        case 'breed':
          r = breedMonsters(world, s, { a: String(msg.a || ''), b: String(msg.b || ''), inherit: Array.isArray(msg.inherit) ? msg.inherit.map(String) : null, name: msg.name });
          if (r.ok) text = `${r.name}（${MONSTERS[r.species].name}＋${r.plus}）が うまれた！${r.joined ? '' : `\n${r.name}は 酒場で まっている。`}`;
          break;
        default:
          return;
      }
      if (!r.ok) return reply(false, r.reason || 'できません', { full: !!r.full, tavern: tavernInfo(world, s) });
      return reply(true, text, { tavern: tavernInfo(world, s) });
    }
    case 'board': {
      if (msg.action === 'post') {
        const text = String(msg.text || '').replace(/[<>]/g, '').slice(0, 120).trim();
        if (!text) return reply(false, 'メッセージを いれてね');
        world.data.board = world.data.board || [];
        world.data.board.unshift({ from: c.name, text, time: Date.now() });
        world.data.board = world.data.board.slice(0, 40);
        world.broadcast({ t: 'board', posts: world.data.board });
        return reply(true, 'でんごんばんに かきこんだ！', { posts: world.data.board });
      }
      return;
    }
    case 'starTrade': {
      const tr = STAR_TRADES[msg.index];
      if (!tr) return reply(false, '');
      if (itemCount(c, 'star_shard') < tr.shards) return reply(false, 'ほしのかけらが たりないねえ');
      removeItem(c, 'star_shard', tr.shards);
      addItem(c, tr.item, 1);
      return reply(true, `ほしのかけら ${tr.shards}こと ${ITEMS[tr.item].name}を こうかんした！`);
    }
    case 'church': {
      if (msg.action === 'record') {
        c.spawn = { map: s.map, x: s.x, y: s.y };
        return reply(true, 'かみの ごかごが ありますように。\nここを いのりの ばしょとして きろくしました。');
      }
      const target = refChar(world, s, msg.ref);
      if (!target) return reply(false, '');
      if (msg.action === 'revive') {
        if (target.hp > 0) return reply(false, 'その ひとは いきています');
        const price = revivePrice(target.level);
        if (c.gold < price) return reply(false, 'ゴールドが たりないようですね');
        c.gold -= price;
        target.hp = computeStats(target).maxHp;
        const info = churchInfo(world, s);
        world.sendParty(partyOf(world, s));
        for (const sid of partyOf(world, s)?.members || []) world.sendSelf(world.sessions.get(sid));
        return reply(true, `おお かみよ… ${target.name}を いきかえらせたまえ！\n${target.name}は いきかえった！`, { church: info });
      }
      if (msg.action === 'cure') {
        if (!target.status?.poison) return reply(false, 'どくには かかっていません');
        if (c.gold < CURE_PRICE) return reply(false, 'ゴールドが たりないようですね');
        c.gold -= CURE_PRICE;
        target.status = {};
        world.sendParty(partyOf(world, s));
        return reply(true, `${target.name}の どくが きえた！`, { church: churchInfo(world, s) });
      }
      return;
    }
    default:
  }
}

// bag: どうぐを だしいれ する ふくろ（なかまの そうびは じぶんの ふくろから）
export function equipItem(c, id, bag = c) {
  const it = ITEMS[id];
  if (!it) return false;
  const slot = it.type;
  if (!SLOTS.includes(slot)) return false;
  if (!canEquipChar(c, id)) return false;
  if (itemCount(bag, id) < 1) return false;
  const old = c.equip[slot];
  removeItem(bag, id, 1);
  if (old) addItem(bag, old, 1);
  c.equip[slot] = id;
  const st = computeStats(c);
  c.hp = Math.min(c.hp, st.maxHp);
  c.mp = Math.min(c.mp, st.maxMp);
  return true;
}

// メニュー（フィールドで つかう どうぐ・じゅもん・そうび）
export function menuAction(world, s, msg) {
  const c = s.char;
  const reply = (ok, text) => {
    world.send(s, { t: 'menuRes', ok, text });
    world.sendSelf(s);
    const p = partyOf(world, s);
    if (p) world.sendParty(p);
    world.markDirty();
  };
  if (s.busy) return reply(false, 'いまは できません');
  switch (msg.action) {
    case 'equip': {
      const who = ownChar(s, msg.who);
      if (!who) return reply(false, '');
      if (!equipItem(who, msg.id, c)) return reply(false, who.species ? 'モンスターは アクセサリー だけ そうびできる' : 'その しょくぎょうでは そうびできない');
      return reply(true, `${who === c ? '' : who.name + 'は '}${ITEMS[msg.id].name}を そうびした！`);
    }
    case 'unequip': {
      const who = ownChar(s, msg.who);
      if (!who || !SLOTS.includes(msg.slot)) return reply(false, '');
      const id = who.equip[msg.slot];
      if (!id) return reply(false, '');
      who.equip[msg.slot] = null;
      addItem(c, id, 1);
      const st = computeStats(who);
      who.hp = Math.min(who.hp, st.maxHp);
      who.mp = Math.min(who.mp, st.maxMp);
      return reply(true, `${who === c ? '' : who.name + 'の '}${ITEMS[id].name}を はずした。`);
    }
    case 'discard': {
      const it = ITEMS[msg.id];
      if (!it || it.type === 'key') return reply(false, 'それは すてられない');
      if (!removeItem(c, msg.id, Math.max(1, msg.n || 1))) return reply(false, '');
      return reply(true, `${it.name}を すてた。`);
    }
    case 'useItem': {
      const it = ITEMS[msg.id];
      if (!it || it.type !== 'use' || !it.field) return reply(false, 'いまは つかえない');
      if (itemCount(c, msg.id) < 1) return reply(false, 'もっていない');
      const eff = it.effect;
      if (eff.type === 'repel') {
        removeItem(c, msg.id, 1);
        s.repelUntil = world.now() + eff.seconds * 1000;
        return reply(true, `${c.name}は せいすいを ふりまいた！\nしばらく よわい まものが よってこない。`);
      }
      if (eff.type === 'warp') {
        const dest = msg.place && PLACES[msg.place] && c.visited?.[msg.place] ? msg.place : null;
        if (!dest) return reply(false, 'どこへ いく？');
        if (s.map !== 'overworld' && world.mapKind(s.map) !== 'dungeon') return reply(false, '');
        removeItem(c, msg.id, 1);
        const pos = warpPos(dest);
        world.placeSession(s, 'overworld', pos[0], pos[1], 'down', true);
        return reply(true, `${c.name}は きかんのはねを そらに なげた！`);
      }
      const target = refChar(world, s, msg.ref);
      if (!target) return reply(false, '');
      const r = applyFieldEffect(world, c, target, eff);
      if (!r.ok) return reply(false, r.text);
      removeItem(c, msg.id, 1);
      return reply(true, `${c.name}は ${it.name}を つかった！\n${r.text}`);
    }
    case 'cast': {
      const caster = ownChar(s, msg.who);
      if (!caster) return reply(false, '');
      if (caster.hp <= 0) return reply(false, `${caster.name}は しんでいる…`);
      const a = ABILITIES[msg.id];
      if (!a || !a.field || !learnedAbilities(caster).includes(msg.id)) return reply(false, 'いまは つかえない');
      const cost = mpCost(caster, msg.id);
      if (caster.mp < cost) return reply(false, 'MPが たりない！');
      const pen = penaltyFor(caster, msg.id);
      const targets = a.target === 'allies' ? allRefs(world, s).map((r) => refChar(world, s, r)).filter(Boolean) : [refChar(world, s, msg.ref)].filter(Boolean);
      if (!targets.length) return reply(false, '');
      const texts = [];
      let any = false;
      for (const t of targets) {
        const r = applyFieldEffect(world, caster, t, a.effect, pen.powMult);
        if (r.ok) any = true;
        texts.push(r.text);
      }
      if (!any) return reply(false, texts[0] || 'こうかが なかった');
      caster.mp -= cost;
      return reply(true, `${caster.name}は ${a.name}を となえた！\n${texts.filter(Boolean).slice(0, 3).join('\n')}`);
    }
    case 'tactics': {
      const t = TACTICS[msg.tactics] ? msg.tactics : null;
      if (!t) return reply(false, '');
      if (msg.key === 'self') {
        if (t === 'manual') return reply(false, '');
        c.tactics = t;
        return reply(true, `さくせんを「${TACTICS[t].name}」に した。`);
      }
      const p = partyOf(world, s);
      const own = companionOf(ensureCompanions(c), msg.key);
      const sup = p?.supports.find((x) => x.key === msg.key && x.owner === c.id);
      const target = own?.char || sup?.char;
      if (!target) return reply(false, '');
      target.tactics = t;
      return reply(true, `${target.name}の さくせんを「${TACTICS[t].name}」に した。`);
    }
    case 'settings': {
      c.battleSettings = {
        speed: [0.75, 1, 1.35].includes(msg.speed) ? msg.speed : (c.battleSettings?.speed || 1),
        wait: !!msg.wait,
        auto: !!msg.auto,
      };
      return reply(true, 'せっていを かえた。');
    }
    default:
      return reply(false, '');
  }
}

function allRefs(world, s) {
  const p = partyOf(world, s);
  const refs = ['self'];
  for (const sid of p?.members || []) if (sid !== s.id) refs.push('sid:' + sid);
  for (const sup of p?.supports || []) refs.push('sup:' + sup.key);
  for (const g of p?.guests || []) refs.push('guest:' + g.id);
  return refs;
}

function applyFieldEffect(world, user, target, eff, powMult = 1) {
  const st = computeStats(target);
  switch (eff.type) {
    case 'heal': {
      if (target.hp <= 0) return { ok: false, text: `${target.name}は しんでいる…` };
      if (target.hp >= st.maxHp) return { ok: false, text: `${target.name}の HPは まんたんだ` };
      let amt = world.rng.int(eff.base[0], eff.base[1]);
      if (!eff.fixed) amt *= 1 + Math.max(0, Math.min(1, (computeStats(user).heal - (eff.thr ?? 20)) / 150));
      amt = Math.round(amt * powMult);
      const real = Math.min(st.maxHp - target.hp, amt);
      target.hp += real;
      return { ok: true, text: target.hp >= st.maxHp ? `${target.name}の キズが すっかり かいふくした！` : `${target.name}の HPが ${real} かいふくした！` };
    }
    case 'mpHeal': {
      if (target.mp >= st.maxMp) return { ok: false, text: `${target.name}の MPは まんたんだ` };
      const d = Math.min(st.maxMp - target.mp, world.rng.int(eff.base[0], eff.base[1]));
      target.mp += d;
      return { ok: true, text: `${target.name}の MPが ${d} かいふくした！` };
    }
    case 'cure': {
      if (!target.status?.poison || !eff.statuses.includes('poison')) return { ok: false, text: 'しかし なにも おこらなかった' };
      target.status = {};
      return { ok: true, text: `${target.name}の どくが きえた！` };
    }
    case 'revive': {
      if (target.hp > 0) return { ok: false, text: `${target.name}は いきている` };
      target.hp = Math.max(1, Math.round(st.maxHp * (eff.hpRatio || 0.25)));
      return { ok: true, text: `なんと ${target.name}が いきかえった！` };
    }
    case 'seed': {
      const n = world.rng.int(eff.amount[0], eff.amount[1]);
      target.seeds = target.seeds || {};
      target.seeds[eff.stat] = (target.seeds[eff.stat] || 0) + n;
      const names = { str: 'ちから', def: 'みのまもり', agi: 'すばやさ', mag: 'こうげき魔力', hp: 'さいだいHP' };
      return { ok: true, text: `${target.name}の ${names[eff.stat]}が ${n} あがった！` };
    }
    default:
      return { ok: false, text: 'いまは つかえない' };
  }
}

export function warpPos(place) {
  if (place === 'village') return [PLACES.village.x + 16.5, PLACES.village.y - 1.5];
  if (place === 'town') return [PLACES.town.x + 24, PLACES.town.y + 37];
  return POS.villagePlaza;
}
