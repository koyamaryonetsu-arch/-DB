// お店・やどや・きょうかい・転職・酒場・でんごんばん・メニュー操作
import { SHOPS, STAR_TRADES, revivePrice, CURE_PRICE, shopItems, shopHello } from '../data/shops.js';
import { normDifficulty } from '../data/difficulty.js';
import { ITEMS, sellPrice, SLOTS } from '../data/items.js';
import { JOBS, ALL_JOBS, jobReqText, BODY_NAMES } from '../data/jobs.js';
import { ABILITIES } from '../data/abilities.js';
import { addItem, removeItem, itemCount, canEquipChar, changeJob, computeStats, learnedAbilities, mpCost, penaltyFor, fullHeal } from '../stats.js';
import { TACTICS } from '../ai.js';
import { tavernInfo, recruitNpc, companionJoin, companionWait, companionRelease, companionRename, companionOf, ensureCompanions, partyOf, setPartyOrder } from './party.js';
import { salonInfo, salonAction } from './salon.js';
import { breedMonsters, breedPreview } from './breed.js';
import { MONSTERS } from '../data/monsters.js';
import { BATTLE_SPEEDS, TEXT_SPEEDS, normBattleSettings } from '../battle.js';
import { PLACES } from '../maps/overworld.js';
import { POS, SEA_PLACES } from '../maps/index.js';
import { castRura, warpParty, useTimeBell, warpPlaces, warpOwner } from './travel.js';
import { bankInfo, bankAction } from './bank.js';
import { forgeInfo, forgeAction } from './forge.js';
import { wagonChurch, wagonRefChar, wagonTavernAction, wagonMenuAction, wagonHere, wagonHealEntries } from './wagon.js';
import { casinoOpen, casinoAction } from './casino.js';
import { useEscapeItem } from './escape.js';
import { bestEquipPlan } from '../equip-plan.js';

export function openService(world, s, kind, arg) {
  switch (kind) {
    case 'shop': {
      const shop = SHOPS[arg];
      if (!shop) return null;
      s.openShop = arg;
      const has = world.hasFlagFn(s);
      return { shop: arg, name: shop.name, items: shopItems(shop, has), keeper: shop.keeper, hello: shopHello(shop, has), kind: shop.kind };
    }
    case 'jobChange': return { jobs: ALL_JOBS };
    case 'tavern': return tavernInfo(world, s);
    case 'salon': return salonInfo(world, s);
    case 'board': return { posts: world.data.board || [] };
    case 'starTrade': return { trades: STAR_TRADES };
    case 'church': return churchInfo(world, s);
    case 'bank': return bankInfo(world, s, arg);
    case 'forge': return forgeInfo(world, s, arg);
    // カジノ・メダル王（casino.js）
    case 'casino': case 'medalKing': return casinoOpen(world, s, kind, arg);
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
  // 馬車の 仲間も（world/wagon.js）
  wagonChurch(world, s, dead, poisoned, revivePrice, CURE_PRICE);
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
  if (ref.startsWith('wagon:')) return wagonRefChar(world, s, ref);
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
    case 'casino': case 'medal': return casinoAction(world, s, msg);
    case 'shop': {
      const shop = SHOPS[s.openShop];
      if (msg.action === 'buy') {
        const it = ITEMS[msg.id];
        const equipable = SLOTS.includes(it?.type);
        const qty = equipable ? 1 : Math.max(1, Math.min(99, Math.floor(msg.qty || 1)));
        if (!shop || !shopItems(shop, world.hasFlagFn(s)).includes(msg.id) || !it || !(it.price > 0)) return reply(false, 'その品物はありません');
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
      // 体で なれない 職業（フルーツジッパーは 女性、アラシは 男性だけ）
      if (r.body !== undefined) return reply(false, `${JOBS[msg.job].name}には、${BODY_NAMES[r.body]}しかなれない…`);
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
          // パーティー → 馬車 → 入れかわり（party.js の placeMember）
          r = recruitNpc(world, s, String(msg.key || ''), { swap: msg.swap ? String(msg.swap) : null, join: msg.join !== false });
          if (r.ok) text = r.joined ? `${r.name}が仲間に加わった！${r.where === 'wagon' ? `\n${r.name}は馬車に乗りこんだ。` : ''}${r.benchedName ? `\n${r.benchedName}は酒場で待っている。` : ''}${stowText(r.stowed)}` : `${r.name}が仲間になった！\n（今は酒場で待っている）`;
          break;
        case 'join':
          r = companionJoin(world, s, String(msg.key || ''), msg.swap ? String(msg.swap) : null);
          if (r.ok) text = `${r.where === 'wagon' ? `${r.name}が仲間に加わって、馬車に乗りこんだ！` : `${r.name}がパーティーに加わった！`}${r.benchedName ? `\n${r.benchedName}は酒場で待っている。` : ''}${stowText(r.stowed)}`;
          break;
        case 'wait':
          r = companionWait(world, s, String(msg.key || ''));
          if (r.ok) text = `${r.name}は酒場で待っている。${stowText(r.stowed)}`;
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
          // 馬車の 乗りかえ（world/wagon.js）
          r = wagonTavernAction(world, s, msg);
          if (!r) return;
          text = r.text;
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
    case 'salon': return salonAction(world, s, msg, reply);
    // 馬車の 総入れかえ（メニューから。へんじを まてるように お店と おなじ 形で。world/wagon.js）
    case 'wagon': {
      if (s.busy) return reply(false, '今はできません');
      const r = wagonMenuAction(world, s, msg);
      return reply(r.ok, r.ok ? r.text : r.reason, { same: !!r.same });
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
        // さそわれて 手伝っている ときは、自分の いのりの場所は そのまま（自分の 冒険は かわらない）
        const host = world.hostOf?.(s);
        if (host) reply(true, `神のご加護がありますように。\n今は${host.char.name}の冒険を手伝っているので、\nいのりの場所は${host.char.name}と同じです。`);
        else {
          c.spawn = { map: s.map, x: s.x, y: s.y };
          reply(true, '神のご加護がありますように。\nここをいのりの場所として記録しました。');
        }
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
    // 預かり所（bank.js）・ふしぎなかじ屋（forge.js）
    case 'bank': return bankAction(world, s, msg, reply);
    case 'forge': return forgeAction(world, s, msg, reply, { equipItem, ownChar });
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
// 酒場で まつ なかまの 装備を ふくろに しまった ことを 知らせる
function stowText(list) {
  return list?.length ? `\n（装備していた${list.slice(0, 3).join('・')}${list.length > 3 ? 'など' : ''}はふくろにしまった）` : '';
}

export function menuAction(world, s, msg) {
  const c = s.char;
  const reply = (ok, text) => {
    world.send(s, { t: 'menuRes', ok, text });
    world.sendSelf(s);
    const p = partyOf(world, s);
    if (p) world.sendParty(p);
    world.markDirty();
  };
  // お気に入りは 戦いの 中でも 変えられる
  if (s.busy && msg.action !== 'favorite') return reply(false, '今はできません');
  switch (msg.action) {
    case 'equip': {
      const who = ownChar(s, msg.who);
      if (!who) return reply(false, '');
      if (!equipItem(who, msg.id, c)) return reply(false, who.species ? `${who.name}には装備できない` : 'その職業では装備できない');
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
        // 行き先は リーダーと おなじ（パーティーで リーダーの 冒険に 来ている ときは リーダーの きろく。travel.js）
        const dest = msg.place && warpPlaces(warpOwner(world, s)).includes(msg.place) ? msg.place : null;
        if (!dest) return reply(false, 'どこへ行く？');
        const kind = world.mapKind(s.map);
        if (kind !== 'field' && kind !== 'dungeon') return reply(false, '');
        removeItem(c, msg.id, 1);
        // 「ついていく」なかまも いっしょに（travel.js。ルーラと おなじ）
        warpParty(world, s, warpDest(dest));
        return reply(true, `${c.name}は帰り道の羽を空に投げた！`);
      }
      // 夜明けのすず・夕焼けのすず（travel.js）
      if (eff.type === 'timeBell') return useTimeBell(world, s, msg.id, reply);
      // みちびきの糸（洞窟・塔から 入り口の 外へ。escape.js）
      if (eff.type === 'exit') return useEscapeItem(world, s, msg.id, reply);
      if (String(msg.ref || '').startsWith('wagon:') && !wagonHere(s.map)) return reply(false, '馬車は入り口で待っている…');
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
      // 馬車の 仲間が 唱えるのも、相手が 馬車の 仲間なのも、馬車が いっしょの ときだけ
      const inWagon = (c.wagonKeys || []).includes(msg.who) || String(msg.ref || '').startsWith('wagon:');
      if (inWagon && !wagonHere(s.map)) return reply(false, '馬車は入り口で待っている…');
      const a = ABILITIES[msg.id];
      if (!a || !a.field || !learnedAbilities(caster).includes(msg.id)) return reply(false, '今は使えない');
      // ルーラ（行った 町へ 仲間と 飛ぶ。travel.js）
      if (a.effect?.type === 'warp') return castRura(world, s, caster, msg.id, msg, reply);
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
    // さいきょう装備（ドラクエ風）: ふくろの 中から 攻撃力・守備力が いちばん 上がる ものを 装備する
    // モンスターの なかまも（しゅぞくで 装備できる 物だけ）
    case 'bestEquip': {
      const team = msg.who === 'all' ? ownTeamChars(world, s) : [ownChar(s, msg.who || 'self')].filter(Boolean);
      // equip-plan.js で 見こみを 出して、その とおりに 装備する（メニューの「何が 何に 変わるか」と おなじ 計算）
      const plan = bestEquipPlan(team.map((ch, i) => ({ key: i, char: ch })), c);
      const lines = [];
      for (const p of plan) {
        const who = team[p.key];
        const got = p.changes.filter((x) => equipItem(who, x.to, c)).map((x) => ITEMS[x.to].name);
        if (got.length) lines.push(`${who.name}: ${got.join('・')}`);
      }
      if (!lines.length) return reply(false, 'もういちばん強い装備をしている');
      return reply(true, `さいきょう装備にした！\n${lines.slice(0, 4).join('\n')}`);
    }
    // まんたん: 呪文で（MPの むだが 少ない じゅんに）か 道具で、みんなの HPを 満タンに
    case 'fullHeal': {
      const r = msg.mode === 'item' ? fullHealByItems(world, s) : fullHealBySpells(world, s);
      return reply(r.ok, r.text);
    }
    // 馬車の 乗りかえ（world/wagon.js）
    case 'wagon': {
      const r = wagonMenuAction(world, s, msg);
      return reply(r.ok, r.ok ? r.text : r.reason);
    }
    // パーティーの ならびかえ（先頭ほど 敵に ねらわれやすい）
    case 'order': {
      const r = setPartyOrder(world, s, msg.order);
      return reply(r.ok, r.ok ? 'ならびを変えた。' : r.reason);
    }
    // 技の お気に入り（ならびも おぼえる）。who: 'self' か 自分の 仲間
    case 'favorite': {
      const who = ownChar(s, msg.who || 'self');
      const id = msg.id;
      if (!who || who.species || !ABILITIES[id]) return reply(false, '');
      const list = Array.isArray(who.favorites) ? who.favorites.filter((x) => ABILITIES[x]) : [];
      const i = list.indexOf(id);
      if (msg.op === 'add' && i < 0) list.push(id);
      else if (msg.op === 'remove' && i >= 0) list.splice(i, 1);
      else if ((msg.op === 'up' || msg.op === 'down') && i >= 0) {
        const j = msg.op === 'up' ? i - 1 : i + 1;
        if (j >= 0 && j < list.length) [list[i], list[j]] = [list[j], list[i]];
      }
      who.favorites = list.slice(0, 30);
      return reply(true, msg.op === 'add' ? `${ABILITIES[id].name}をお気に入りに入れた。` : msg.op === 'remove' ? `${ABILITIES[id].name}をお気に入りからはずした。` : 'ならびを変えた。');
    }
    case 'settings': {
      const old = c.battleSettings || {};
      const cur = normBattleSettings(old);
      c.battleSettings = {
        ...old,
        sv: 2,
        speed: BATTLE_SPEEDS.includes(msg.speed) ? msg.speed : cur.speed,
        textSpeed: TEXT_SPEEDS.includes(msg.textSpeed) ? msg.textSpeed : cur.textSpeed,
        wait: msg.wait === undefined ? !!old.wait : !!msg.wait,
        auto: msg.auto === undefined ? !!old.auto : !!msg.auto,
      };
      // ゲームの むずかしさ（difficulty.js）。ぜんぶ ふつうなら のこさない
      if (msg.difficulty && typeof msg.difficulty === 'object') {
        const d = normDifficulty(c.difficulty, msg.difficulty);
        if (d) c.difficulty = d;
        else delete c.difficulty;
      }
      return reply(true, '設定を変えた。');
    }
    default:
      return reply(false, '');
  }
}

// ───── さいきょう装備 ─────
// 自分と 自分の 仲間（ならびの じゅん）
function ownTeamChars(world, s) {
  const p = partyOf(world, s);
  const sups = (p?.supports || []).filter((x) => x.owner === s.char.id && x.kind !== 'family').map((x) => x.char);
  const pos = Math.max(0, Math.min(sups.length, Number.isInteger(s.char.selfPos) ? s.char.selfPos : 0));
  return [...sups.slice(0, pos), s.char, ...sups.slice(pos)];
}

// ───── まんたん ─────
// 回復の 見こみ（applyFieldEffect と おなじ 式の まんなか）
function expectedHeal(user, eff, powMult = 1) {
  let amt = (eff.base[0] + eff.base[1]) / 2;
  if (!eff.fixed) amt *= 1 + Math.max(0, Math.min(1, (computeStats(user).heal - (eff.thr ?? 20)) / 150));
  return amt * powMult;
}

// HPが へっている 生きた 仲間
function hurtRefs(world, s) {
  return allRefs(world, s).map((ref) => ({ ref, ch: refChar(world, s, ref) })).filter(({ ch }) => ch && ch.hp > 0 && ch.hp < computeStats(ch).maxHp);
}
const lack = (ch) => computeStats(ch).maxHp - ch.hp;

function fullHealSummary(world, s, used) {
  const left = hurtRefs(world, s);
  const lines = [];
  if (used.length) lines.push(used.join('、'));
  if (!left.length) lines.push('みんなのHPが満タンになった！');
  else lines.push(`まだ回復しきれていない: ${left.slice(0, 3).map(({ ch }) => `${ch.name} ${ch.hp}/${computeStats(ch).maxHp}`).join('、')}`);
  return lines.join('\n');
}

function fullHealBySpells(world, s) {
  if (!hurtRefs(world, s).length) return { ok: false, text: 'みんなのHPは満タンだ' };
  const p = partyOf(world, s);
  const casters = [s.char, ...(p?.supports || []).filter((x) => x.owner === s.char.id && x.kind !== 'family').map((x) => x.char),
    ...wagonHealEntries(world, s, true).map((e) => e.char)].filter((ch) => ch.hp > 0);
  const count = new Map(); // 「名前|呪文」→ 回数
  const mpUsed = new Map();
  let any = false;
  for (let guard = 0; guard < 80; guard++) {
    const hurt = hurtRefs(world, s);
    if (!hurt.length) break;
    // 1ばん へっている 人から
    hurt.sort((a, b) => lack(b.ch) - lack(a.ch));
    const tgt = hurt[0];
    const need = lack(tgt.ch);
    const totalNeed = hurt.reduce((a, h) => a + lack(h.ch), 0);
    let best = null;
    for (const ch of casters) {
      for (const id of learnedAbilities(ch)) {
        const a = ABILITIES[id];
        if (!a?.field || a.effect?.type !== 'heal' || !['ally', 'allies'].includes(a.target)) continue;
        const cost = mpCost(ch, id);
        if (ch.mp < cost) continue;
        const pen = penaltyFor(ch, id);
        const amt = expectedHeal(ch, a.effect, pen.powMult);
        // 役に立つ 回復量（あふれた ぶんは むだ）
        const useful = a.target === 'allies' ? hurt.reduce((x, h) => x + Math.min(lack(h.ch), amt), 0) : Math.min(need, amt);
        if (a.target === 'allies' && hurt.length < 2) continue;
        // MPあたりの 回復が 多い もの。1回で たりる なら 少ない MPの ものを えらぶ
        const enough = a.target === 'allies' ? useful >= totalNeed * 0.8 : amt >= need;
        const score = useful / Math.max(1, cost) + (enough ? 1000 / Math.max(1, cost) : 0);
        if (!best || score > best.score) best = { ch, id, a, cost, pen, score };
      }
    }
    if (!best) break;
    const targets = best.a.target === 'allies' ? hurt.map((h) => h.ch) : [tgt.ch];
    let ok = false;
    for (const t of targets) if (applyFieldEffect(world, best.ch, t, best.a.effect, best.pen.powMult).ok) ok = true;
    if (!ok) break;
    best.ch.mp -= best.cost;
    any = true;
    const key = `${best.ch.name}|${best.a.name}`;
    count.set(key, (count.get(key) || 0) + 1);
    mpUsed.set(best.ch.name, (mpUsed.get(best.ch.name) || 0) + best.cost);
  }
  if (!any) return { ok: false, text: 'HPを回復できる呪文を使える人がいない…\n（MPが足りないか、回復の呪文を覚えていない）' };
  const byWho = new Map();
  for (const [k, n] of count) {
    const [who, sp] = k.split('|');
    if (!byWho.has(who)) byWho.set(who, []);
    byWho.get(who).push(`${sp}×${n}`);
  }
  const used = [...byWho].map(([who, list]) => `${who}: ${list.join('・')}（MP${mpUsed.get(who)}）`);
  return { ok: true, text: fullHealSummary(world, s, used) };
}

function fullHealByItems(world, s) {
  if (!hurtRefs(world, s).length) return { ok: false, text: 'みんなのHPは満タンだ' };
  const c = s.char;
  const count = new Map();
  let any = false;
  for (let guard = 0; guard < 99; guard++) {
    const hurt = hurtRefs(world, s);
    if (!hurt.length) break;
    hurt.sort((a, b) => lack(b.ch) - lack(a.ch));
    const tgt = hurt[0];
    const need = lack(tgt.ch);
    // たりる 中で いちばん 小さい 薬。たりなければ いちばん 大きい 薬
    const heals = c.items.filter((e) => e.n > 0 && ITEMS[e.id]?.type === 'use' && ITEMS[e.id].field && ITEMS[e.id].effect?.type === 'heal' && ITEMS[e.id].target === 'ally')
      .map((e) => ({ id: e.id, amt: expectedHeal(c, ITEMS[e.id].effect) }));
    if (!heals.length) break;
    const enough = heals.filter((h) => h.amt >= need).sort((a, b) => a.amt - b.amt);
    const pick = enough[0] || heals.sort((a, b) => b.amt - a.amt)[0];
    if (!applyFieldEffect(world, c, tgt.ch, ITEMS[pick.id].effect).ok) break;
    removeItem(c, pick.id, 1);
    any = true;
    count.set(pick.id, (count.get(pick.id) || 0) + 1);
  }
  if (!any) return { ok: false, text: 'HPを回復する道具を持っていない…' };
  const used = [`${[...count].map(([id, n]) => `${ITEMS[id].name}×${n}`).join('・')}を使った`];
  return { ok: true, text: fullHealSummary(world, s, used) };
}

function allRefs(world, s) {
  const p = partyOf(world, s);
  const refs = ['self'];
  for (const sid of p?.members || []) if (sid !== s.id) refs.push('sid:' + sid);
  for (const sup of p?.supports || []) refs.push('sup:' + sup.key);
  for (const g of p?.guests || []) refs.push('guest:' + g.id);
  // 馬車の 仲間（馬車が いっしょの とき）
  for (const e of wagonHealEntries(world, s)) refs.push('wagon:' + e.key);
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
