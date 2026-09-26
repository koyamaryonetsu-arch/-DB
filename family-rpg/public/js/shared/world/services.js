// お店・やどや・きょうかい・転職・酒場・でんごんばん・メニュー操作
import { SHOPS, STAR_TRADES, revivePrice, CURE_PRICE } from '../data/shops.js';
import { ITEMS, sellPrice, SLOTS } from '../data/items.js';
import { JOBS, ALL_JOBS, jobReqText } from '../data/jobs.js';
import { ABILITIES } from '../data/abilities.js';
import { addItem, removeItem, itemCount, canEquipChar, changeJob, computeStats, learnedAbilities, mpCost, penaltyFor, fullHeal } from '../stats.js';
import { TACTICS } from '../ai.js';
import { tavernInfo, recruitNpc, companionJoin, companionWait, companionRelease, companionRename, companionOf, ensureCompanions, partyOf } from './party.js';
import { breedMonsters, breedPreview } from './breed.js';
import { MONSTERS } from '../data/monsters.js';
import { PLACES } from '../maps/overworld.js';
import { POS, SEA_PLACES } from '../maps/index.js';

export function openService(world, s, kind, arg) {
  switch (kind) {
    case 'shop': {
      const shop = SHOPS[arg];
      if (!shop) return null;
      s.openShop = arg;
      return { shop: arg, name: shop.name, items: shop.items, keeper: shop.keeper, hello: shop.hello, kind: shop.kind };
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
  // へんじより さきに 新しい じょうたいを おくる（がめんの ゴールドや 装備が すぐ かわるように）
  const reply = (ok, text, extra = {}) => {
    world.sendSelf(s);
    world.send(s, { t: 'svcRes', ok, text, ...extra });
    world.markDirty();
  };
  switch (msg.kind) {
    case 'shop': {
      const shop = SHOPS[s.openShop];
      if (msg.action === 'buy') {
        const it = ITEMS[msg.id];
        const equipable = SLOTS.includes(it?.type);
        const qty = equipable ? 1 : Math.max(1, Math.min(99, Math.floor(msg.qty || 1)));
        if (!shop || !shop.items.includes(msg.id) || !it || !(it.price > 0)) return reply(false, 'その品物はありません');
        const cost = it.price * qty;
        if (c.gold < cost) return reply(false, 'おや？ゴールドが足りないようですね。');
        // だれが 装備する？（じぶん か じぶんの なかま。むかしの 'equip: true' は じぶん）
        const whoKey = msg.who || (msg.equip ? 'self' : null);
        const who = whoKey && equipable ? ownChar(s, whoKey) : null;
        if (whoKey && equipable && (!who || !canEquipChar(who, msg.id))) return reply(false, 'その人は装備できないようですね。');
        c.gold -= cost;
        addItem(c, msg.id, qty);
        const lines = [`${it.name}${qty > 1 ? `を${qty}個` : 'を'}買った！`];
        if (who) {
          const old = who.equip[it.type];
          equipItem(who, msg.id, c);
          lines.push(`${who.name}は${it.name}を装備した！`);
          if (old && msg.sellOld && sellPrice(old) > 0 && removeItem(c, old, 1)) {
            c.gold += sellPrice(old);
            lines.push(`今まで装備していた${ITEMS[old].name}を${sellPrice(old)}ゴールドで売った。`);
          } else if (old) {
            lines.push(`${ITEMS[old].name}は、ふくろに入れた。`);
          }
          if (who !== c) world.sendParty(partyOf(world, s));
        } else {
          lines.push(`${it.name}は、ふくろに入れた。`);
        }
        return reply(true, lines.join('\n'), { equipped: !!who });
      }
      if (msg.action === 'sell') {
        const it = ITEMS[msg.id];
        const qty = Math.max(1, Math.min(99, Math.floor(msg.qty || 1)));
        if (!it || it.type === 'key' || sellPrice(msg.id) <= 0) return reply(false, 'それは引き取れません。');
        if (itemCount(c, msg.id) < qty) return reply(false, '持っていないようですね。');
        const price = sellPrice(msg.id);
        removeItem(c, msg.id, qty);
        c.gold += price * qty;
        return reply(true, `${it.name}を${price * qty}ゴールドで売った！`);
      }
      return reply(false, '');
    }
    case 'jobChange': {
      if (!JOBS[msg.job]) return reply(false, '');
      const who = ownChar(s, msg.who);
      if (!who || who.species) return reply(false, 'モンスターは転職できない');
      if (who.job === msg.job) return reply(false, '今の職業と同じです');
      const r = changeJob(who, msg.job);
      if (r.locked) return reply(false, `まだ${JOBS[msg.job].name}にはなれない…\n（${jobReqText(msg.job)}が必要）`);
      if (!r.ok) return reply(false, '');
      // なかまが はずした そうびは ふくろへ
      if (who !== c) {
        for (const e of who.items || []) addItem(c, e.id, e.n);
        who.items = [];
      }
      const removed = r.removed.map((id) => ITEMS[id]?.name).filter(Boolean);
      world.sendParty(partyOf(world, s));
      return reply(true, `${who.name}は${JOBS[msg.job].name}になった！${removed.length ? `\n（${removed.join('・')}は装備できないので外した）` : ''}`, { jobChanged: true, who: msg.who || 'self' });
    }
    case 'tavern': {
      let r;
      let text = '';
      switch (msg.action) {
        case 'recruit':
          r = recruitNpc(world, s, String(msg.key || ''), { swap: msg.swap, join: msg.join !== false });
          if (r.ok) text = r.joined ? `${r.name}が仲間に加わった！` : `${r.name}が仲間になった！\n（今は酒場で待っている）`;
          break;
        case 'join':
          r = companionJoin(world, s, String(msg.key || ''), msg.swap);
          if (r.ok) text = `${r.name}がパーティーに加わった！${r.benchedName ? `\n${r.benchedName}は酒場で待っている。` : ''}`;
          break;
        case 'wait':
          r = companionWait(world, s, String(msg.key || ''));
          if (r.ok) text = `${r.name}は酒場で待っている。`;
          break;
        case 'release':
          r = companionRelease(world, s, String(msg.key || ''));
          if (r.ok) text = `${r.name}と別れた。\n「今までありがとう！」`;
          break;
        case 'rename':
          r = companionRename(world, s, String(msg.key || ''), msg.name);
          if (r.ok) text = `${r.old}の名前を${r.name}に変えた！`;
          break;
        case 'breedPreview': {
          // みるだけ（なにも かわらない）
          const pv = breedPreview(ensureCompanions(s.char), String(msg.a || ''), String(msg.b || ''));
          world.send(s, { t: 'svcRes', ok: pv.ok, text: pv.ok ? '' : pv.reason, preview: pv.ok ? pv : null });
          return;
        }
        case 'breed':
          r = breedMonsters(world, s, { a: String(msg.a || ''), b: String(msg.b || ''), inherit: Array.isArray(msg.inherit) ? msg.inherit.map(String) : null, name: msg.name });
          if (r.ok) text = `${r.name}（${MONSTERS[r.species].name}＋${r.plus}）が生まれた！${r.joined ? '' : `\n${r.name}は酒場で待っている。`}`;
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
        if (!text) return reply(false, 'メッセージを入れてね');
        world.data.board = world.data.board || [];
        world.data.board.unshift({ from: c.name, text, time: Date.now() });
        world.data.board = world.data.board.slice(0, 40);
        world.broadcast({ t: 'board', posts: world.data.board });
        return reply(true, '伝言板に書きこんだ！', { posts: world.data.board });
      }
      return;
    }
    case 'starTrade': {
      const tr = STAR_TRADES[msg.index];
      if (!tr) return reply(false, '');
      if (itemCount(c, 'star_shard') < tr.shards) return reply(false, '星のかけらが足りないねえ');
      removeItem(c, 'star_shard', tr.shards);
      addItem(c, tr.item, 1);
      return reply(true, `星のかけら${tr.shards}個と${ITEMS[tr.item].name}をこうかんした！`);
    }
    case 'church': {
      if (msg.action === 'record') {
        c.spawn = { map: s.map, x: s.x, y: s.y };
        reply(true, '神のご加護がありますように。\nここをいのりの場所として記録しました。');
        world.saveNow({ urgent: true });
        return;
      }
      const target = refChar(world, s, msg.ref);
      if (!target) return reply(false, '');
      if (msg.action === 'revive') {
        if (target.hp > 0) return reply(false, 'その人は生きています');
        const price = revivePrice(target.level);
        if (c.gold < price) return reply(false, 'ゴールドが足りないようですね');
        c.gold -= price;
        target.hp = computeStats(target).maxHp;
        const info = churchInfo(world, s);
        world.sendParty(partyOf(world, s));
        for (const sid of partyOf(world, s)?.members || []) world.sendSelf(world.sessions.get(sid));
        return reply(true, `おお神よ…${target.name}を生き返らせたまえ！\n${target.name}は生き返った！`, { church: info });
      }
      if (msg.action === 'cure') {
        if (!target.status?.poison) return reply(false, '毒にはかかっていません');
        if (c.gold < CURE_PRICE) return reply(false, 'ゴールドが足りないようですね');
        c.gold -= CURE_PRICE;
        target.status = {};
        world.sendParty(partyOf(world, s));
        return reply(true, `${target.name}の毒が消えた！`, { church: churchInfo(world, s) });
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
  if (s.busy) return reply(false, '今はできません');
  switch (msg.action) {
    case 'equip': {
      const who = ownChar(s, msg.who);
      if (!who) return reply(false, '');
      if (!equipItem(who, msg.id, c)) return reply(false, who.species ? 'モンスターはアクセサリーだけ装備できる' : 'その職業では装備できない');
      return reply(true, `${who === c ? '' : who.name + 'は'}${ITEMS[msg.id].name}を装備した！`);
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
      return reply(true, `${who === c ? '' : who.name + 'の'}${ITEMS[id].name}を外した。`);
    }
    case 'discard': {
      const it = ITEMS[msg.id];
      if (!it || it.type === 'key') return reply(false, 'それは捨てられない');
      if (!removeItem(c, msg.id, Math.max(1, msg.n || 1))) return reply(false, '');
      return reply(true, `${it.name}を捨てた。`);
    }
    case 'useItem': {
      const it = ITEMS[msg.id];
      if (!it || it.type !== 'use' || !it.field) return reply(false, '今は使えない');
      if (itemCount(c, msg.id) < 1) return reply(false, '持っていない');
      const eff = it.effect;
      if (eff.type === 'repel') {
        removeItem(c, msg.id, 1);
        s.repelUntil = world.now() + eff.seconds * 1000;
        return reply(true, `${c.name}は聖水をふりまいた！\nしばらく弱い魔物が寄ってこない。`);
      }
      if (eff.type === 'warp') {
        const dest = msg.place && (PLACES[msg.place] || SEA_PLACES[msg.place]) && c.visited?.[msg.place] ? msg.place : null;
        if (!dest) return reply(false, 'どこへ行く？');
        const kind = world.mapKind(s.map);
        if (kind !== 'field' && kind !== 'dungeon') return reply(false, '');
        removeItem(c, msg.id, 1);
        const to = warpDest(dest);
        world.placeSession(s, to.map, to.x, to.y, 'down', true);
        return reply(true, `${c.name}は帰り道の羽を空に投げた！`);
      }
      const target = refChar(world, s, msg.ref);
      if (!target) return reply(false, '');
      const r = applyFieldEffect(world, c, target, eff);
      if (!r.ok) return reply(false, r.text);
      removeItem(c, msg.id, 1);
      return reply(true, `${c.name}は${it.name}を使った！\n${r.text}`);
    }
    case 'cast': {
      const caster = ownChar(s, msg.who);
      if (!caster) return reply(false, '');
      if (caster.hp <= 0) return reply(false, `${caster.name}は死んでいる…`);
      const a = ABILITIES[msg.id];
      if (!a || !a.field || !learnedAbilities(caster).includes(msg.id)) return reply(false, '今は使えない');
      const cost = mpCost(caster, msg.id);
      if (caster.mp < cost) return reply(false, 'MPが足りない！');
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
      if (!any) return reply(false, texts[0] || '効果がなかった');
      caster.mp -= cost;
      return reply(true, `${caster.name}は${a.name}を唱えた！\n${texts.filter(Boolean).slice(0, 3).join('\n')}`);
    }
    case 'tactics': {
      const t = TACTICS[msg.tactics] ? msg.tactics : null;
      if (!t) return reply(false, '');
      if (msg.key === 'self') {
        if (t === 'manual') return reply(false, '');
        c.tactics = t;
        return reply(true, `作戦を「${TACTICS[t].name}」にした。`);
      }
      const p = partyOf(world, s);
      const own = companionOf(ensureCompanions(c), msg.key);
      const sup = p?.supports.find((x) => x.key === msg.key && x.owner === c.id);
      const target = own?.char || sup?.char;
      if (!target) return reply(false, '');
      target.tactics = t;
      return reply(true, `${target.name}の作戦を「${TACTICS[t].name}」にした。`);
    }
    case 'settings': {
      c.battleSettings = {
        speed: [0.75, 1, 1.35].includes(msg.speed) ? msg.speed : (c.battleSettings?.speed || 1),
        wait: !!msg.wait,
        auto: !!msg.auto,
      };
      return reply(true, '設定を変えた。');
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
      if (target.hp <= 0) return { ok: false, text: `${target.name}は死んでいる…` };
      if (target.hp >= st.maxHp) return { ok: false, text: `${target.name}のHPは満タンだ` };
      let amt = world.rng.int(eff.base[0], eff.base[1]);
      if (!eff.fixed) amt *= 1 + Math.max(0, Math.min(1, (computeStats(user).heal - (eff.thr ?? 20)) / 150));
      amt = Math.round(amt * powMult);
      const real = Math.min(st.maxHp - target.hp, amt);
      target.hp += real;
      return { ok: true, text: target.hp >= st.maxHp ? `${target.name}のキズがすっかり回復した！` : `${target.name}のHPが${real}回復した！` };
    }
    case 'mpHeal': {
      if (target.mp >= st.maxMp) return { ok: false, text: `${target.name}のMPは満タンだ` };
      const d = Math.min(st.maxMp - target.mp, world.rng.int(eff.base[0], eff.base[1]));
      target.mp += d;
      return { ok: true, text: `${target.name}のMPが${d}回復した！` };
    }
    case 'cure': {
      if (!target.status?.poison || !eff.statuses.includes('poison')) return { ok: false, text: 'しかし何も起こらなかった' };
      target.status = {};
      return { ok: true, text: `${target.name}の毒が消えた！` };
    }
    case 'revive': {
      if (target.hp > 0) return { ok: false, text: `${target.name}は生きている` };
      target.hp = Math.max(1, Math.round(st.maxHp * (eff.hpRatio || 0.25)));
      return { ok: true, text: `なんと${target.name}が生き返った！` };
    }
    case 'seed': {
      const n = world.rng.int(eff.amount[0], eff.amount[1]);
      target.seeds = target.seeds || {};
      target.seeds[eff.stat] = (target.seeds[eff.stat] || 0) + n;
      const names = { str: '力', def: '身の守り', agi: '素早さ', mag: '攻撃魔力', hp: '最大HP' };
      return { ok: true, text: `${target.name}の${names[eff.stat]}が${n}上がった！` };
    }
    default:
      return { ok: false, text: '今は使えない' };
  }
}

export function warpPos(place) {
  if (place === 'village') return [PLACES.village.x + 16.5, PLACES.village.y - 1.5];
  if (place === 'town') return [PLACES.town.x + 24, PLACES.town.y + 37];
  return POS.villagePlaza;
}

// 帰り道の羽の 行き先（マップと いち）
export function warpDest(place) {
  const sp = SEA_PLACES[place];
  if (sp) return { map: sp.map, x: sp.x + 0.5, y: sp.y + 0.5 };
  const [x, y] = warpPos(place);
  return { map: 'overworld', x, y };
}
