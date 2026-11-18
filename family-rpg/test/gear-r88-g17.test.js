// 第88回 G17班: フリーレン（千年の大魔法使い）・さいきくすお
//   品の 数・名前が かぶらない・全部の 品に 手に入れ方が ある・服従のてんびん（魔力が 上／下・ボス）・鏡れん華の指輪と うでわの そろい（2人だけ）・
//   頭の制御装置（つけると 魔力↓守り↑・使うと 魔力↑）・支配の石の輪（混乱に かかりやすい）・使う 品・とびら 2まいと ライバル（4人ずつ）・
//   ガチャ・試練の ごほうび・セーブと 引っこし
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../public/js/shared/data/items.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { GEAR_SETS } from '../public/js/shared/data/gear-sets.js';
import { WORKS } from '../public/js/shared/data/works.js';
import { REBIRTH } from '../public/js/shared/data/items-alchemy.js';
import { SHOPS, shopItems } from '../public/js/shared/data/shops.js';
import { ITEMS_R88_FRIEREN, TENBIN, HERO_SWORD, KAGAMI_RENGE } from '../public/js/shared/data/items-r88-frieren.js';
import { ITEMS_R88_SAIKI, SEIGYO } from '../public/js/shared/data/items-r88-saiki.js';
import { Battle } from '../public/js/shared/battle.js';
import { newCharacter, gainExp, expForLevel, fullHeal, addItem, itemCount, computeStats } from '../public/js/shared/stats.js';
import { gachaBlock, gachaPool, gachaWorks, trialGiftOf, TM_R88_DEN, GACHA_PRICE } from '../public/js/shared/data/gacha-r88.js';
import { RIVAL_DOORS, RIVAL_BY_ID, rivalsOf, rivalTier, rivalEnc, doorOf } from '../public/js/shared/data/rivals-r88.js';
import { workOwned, doorOpen } from '../public/js/shared/rivals-r88.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { ROOM_STYLES } from '../public/js/shared/maps/rivals-r88.js';
import { MAPS } from '../public/js/shared/maps/index.js';
import { JOBS } from '../public/js/shared/data/jobs.js';
import { R88_BOARD_ICONS } from '../public/js/client/render/boards-r88.js';
import { playR88Fx, R88_ANIMS } from '../public/js/client/render/battlefx-r88.js';
import { exportCode, parseCode, splitCode } from '../public/js/shared/world/transfer.js';
import { repairChar } from '../public/js/shared/world/save.js';
import { makeRng } from '../public/js/shared/rng.js';

const MY = ['frieren', 'saiki'];
const ids = (work) => Object.keys(ITEMS).filter((id) => ITEMS[id].work === work && !ITEMS[id].base);
const newIds = (work) => ids(work).filter((id) => ITEMS[id].src === 'r88');
const mineAll = () => [...newIds('frieren'), ...newIds('saiki')];
function hero(job = 'warrior', lv = 70) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job });
  c.job = job;
  gainExp(c, expForLevel(lv));
  fullHeal(c);
  c.items = [];
  c.equip = { weapon: null, armor: null, shield: null, head: null, acc: null };
  return c;
}
function fight(chars, enemies = ['rockman', 'rockman', 'pururin'], opts = {}) {
  const b = new Battle({ rng: makeRng(17), allies: chars.map((char, i) => ({ char, controller: `s${i}` })), enemies, canFlee: true, ...opts });
  for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 99999; }
  return b;
}
const useGear = (b, me, slot, target) => {
  const ev = { lines: [], upd: [] };
  b.perform(me, { type: 'item', id: `gear:${slot}`, ...(target ? { target } : {}) }, ev);
  return ev;
};

// ───────────── 品 ─────────────
test('G17: 品の 数（フリーレン 18・さいきくすお 14）・作品の 名前・名前が かぶらない', () => {
  assert.equal(Object.keys(ITEMS_R88_FRIEREN).length, 18);
  assert.equal(Object.keys(ITEMS_R88_SAIKI).length, 14);
  assert.equal(newIds('frieren').length, 18);
  assert.equal(newIds('saiki').length, 14);
  assert.equal(WORKS.frieren.name, 'フリーレン');
  assert.equal(WORKS.saiki.name, 'さいきくすお');
  for (const w of MY) assert.deepEqual(ids(w).filter((id) => ITEMS[id].src !== 'r88'), [], `${w}: 今 ある 品は つけて いない`);
  for (const id of mineAll()) {
    const it = ITEMS[id];
    assert.ok(it.name && it.desc, id);
    if (it.use) assert.ok(ABILITIES[it.use.ability]?.hidden, `${id}: ${it.use.ability}`);
  }
  // 名前が かぶらない（今 ある 品・技とも。2作品の 中でも）
  const mine = new Set(mineAll());
  const others = new Set(Object.entries(ITEMS).filter(([id, it]) => !it.base && !mine.has(id)).map(([, it]) => it.name));
  const abNames = new Set(Object.entries(ABILITIES).filter(([id]) => !/^r88u_(fr|sk)_/.test(id)).map(([, a]) => a.name));
  const names = [...mine].map((id) => ITEMS[id].name);
  assert.equal(new Set(names).size, names.length);
  for (const n of names) assert.ok(!others.has(n) && !abNames.has(n), n);
  const myAb = Object.keys(ABILITIES).filter((id) => /^r88u_(fr|sk)_/.test(id)).map((id) => ABILITIES[id].name);
  assert.equal(myAb.length, 2);
  for (const n of myAb) assert.ok(!others.has(n) && !names.includes(n) && !abNames.has(n), `技 ${n}`);
  // 職業の 技と まぎれない 名前（花畑を出す魔法 → 魔導書・制御装置をはずす → 全部外す）
  assert.equal(ITEMS.r88_fr_hanabatake.name, '花畑を出す魔法の魔導書');
  assert.notEqual(ABILITIES.r88u_sk_seigyo.name, ABILITIES.ksu_seigyo.name);
  // 数珠は ぬ〜べ〜の 念じゅと べつ・ステッキは マジックステッキと べつ
  assert.equal(ITEMS.r88_sk_juzu.name, '鳥束の数じゅ');
  assert.ok(ITEMS.r88_sk_stick.name !== ITEMS.magic_stick?.name && !/^マジック/.test(ITEMS.r88_sk_stick.name));
  // 伝説
  assert.deepEqual(newIds('frieren').filter((id) => ITEMS[id].grade === 'den').sort(), [HERO_SWORD, TENBIN].sort());
  assert.deepEqual(newIds('saiki').filter((id) => ITEMS[id].grade === 'den'), [SEIGYO]);
  // 勇者の剣は あくまキラー・剣で いちばんと ならぶ
  assert.ok(ITEMS[HERO_SWORD].fx.some((x) => x.k === 'slay_demon'));
  assert.equal(ITEMS[HERO_SWORD].cat, 'sword');
  // 子どもに 合わない 名前は 使わない
  for (const id of mineAll()) assert.ok(!/殺|自害|あやつ|黄金郷|ゾルトラーク/.test(ITEMS[id].name + ITEMS[id].desc), id);
  for (const id of ['r88u_fr_tenbin']) assert.ok(!/あやつ|自害/.test(ABILITIES[id].desc + ABILITIES[id].cast), id);
});

test('G17: 手に 入らない 品は ない（店・ガチャ・ライバル・試練・宝の洞窟の いちばん おく）', () => {
  const shop = new Set(Object.values(SHOPS).flatMap((s) => shopItems(s, () => true)));
  const trial = new Set(Object.values(WORKS).flatMap((w) => Object.values(w.trialGift || {})));
  for (const w of MY) {
    const pool = new Set(gachaPool(w).all);
    const rival = new Set(rivalsOf(w).flatMap((rv) => rv.reward));
    for (const id of newIds(w)) {
      const how = [shop.has(id) && '店', pool.has(id) && 'ガチャ', rival.has(id) && 'ライバル', trial.has(id) && '試練',
        TM_R88_DEN.includes(id) && '宝', Object.values(REBIRTH).some((r) => r.to === id) && '生まれ変わり'].filter(Boolean);
      assert.ok(how.length, `${id}: 手に入れ方が ない`);
      if (ITEMS[id].grade === 'den') assert.ok(how.some((h) => ['ライバル', '宝'].includes(h)), `${id}: ${how}`);
    }
  }
  assert.ok(TM_R88_DEN.includes(HERO_SWORD), '勇者の剣は 宝の洞窟の いちばん おく');
  assert.ok(!TM_R88_DEN.includes(TENBIN) && !TM_R88_DEN.includes(SEIGYO), 'ライバルが くれる 伝説は 入れない');
  assert.ok(shop.has('r88_sk_uniform'), 'PK学園の制服は 店に');
});

// ───────────── 服従のてんびん ─────────────
test('G17: 服従のてんびん … 魔力が 相手より 上なら 敵1体が 1回 動けない。下だと 効かない。ボスは だめ（1回・MPなし）', () => {
  // 魔力が 上
  const c = hero('sennen_mage', 80);
  c.equip.acc = TENBIN;
  let b = fight([c, hero('warrior')]);
  let me = b.allies[0];
  const foe = b.enemies[0];
  foe.mag = 10;
  foe.atb = 90;
  const u = me.gearUses.find((x) => x.id === TENBIN);
  assert.ok(u, 'てんびんが 道具に ならぶ');
  const mp = me.mp;
  let ev = useGear(b, me, u.slot, foe.id);
  assert.equal(ev.ability, 'r88u_fr_tenbin');
  assert.ok(me.mp >= mp, 'MPは 使わない');
  assert.ok(u.used, '使った');
  assert.equal(foe.atb, 0, '行動ゲージが 0 に もどる（1回 動けない）');
  assert.ok(ev.lines.join('').includes('1回動けない'), ev.lines.join('/'));
  assert.ok(useGear(b, me, u.slot, foe.id).lines.join('').includes('何も起こらなかった'), '2回めは だめ');
  // 魔力が 下（同じも 効かない）
  for (const add of [0, 500]) {
    b = fight([c, hero('warrior')]);
    me = b.allies[0];
    const f2 = b.enemies[0];
    f2.mag = me.mag + add;
    f2.atb = 90;
    ev = useGear(b, me, me.gearUses.find((x) => x.id === TENBIN).slot, f2.id);
    assert.equal(f2.atb, 90, `魔力が 下（+${add}）なら 効かない`);
    assert.ok(ev.lines.join('').includes('ぴくりとも動かない'), ev.lines.join('/'));
  }
  // 強化した 魔力で くらべる
  b = fight([c]);
  me = b.allies[0];
  const f3 = b.enemies[0];
  f3.mag = me.mag + 1;
  f3.atb = 80;
  me.buffs = { ...(me.buffs || {}), mag: { mult: 1.5, dur: 30 } };
  useGear(b, me, me.gearUses.find((x) => x.id === TENBIN).slot, f3.id);
  assert.equal(f3.atb, 0, '強化した 魔力が 上なら 効く');
  // ボスには 効かない
  b = fight([c], ['rockman'], { boss: true });
  me = b.allies[0];
  const boss = b.enemies[0];
  boss.boss = true;
  boss.mag = 0;
  boss.atb = 90;
  ev = useGear(b, me, me.gearUses.find((x) => x.id === TENBIN).slot, boss.id);
  assert.equal(boss.atb, 90);
  assert.ok(ev.lines.join('').includes('大きすぎて'), ev.lines.join('/'));
});

// ───────────── 鏡れん華の指輪と うでわ ─────────────
test('G17: 鏡れん華の指輪と うでわ … 2人が 1つずつ つけると、2人だけ 最大HP+60（1人・同じ 品だけ・ほかの 人は 上がらない）', () => {
  assert.deepEqual(GEAR_SETS.kagami_renge.items, KAGAMI_RENGE);
  for (const id of KAGAMI_RENGE) {
    assert.equal(ITEMS[id].set, 'kagami_renge', id);
    assert.equal(ITEMS[id].type, 'acc', id);
    assert.ok(gachaPool('frieren').all.includes(id), `${id}: ガチャで 出る`);
  }
  const base = (chars) => fight(chars).allies.map((x) => x.maxHp);
  const mk = (acc) => { const c = hero('warrior'); c.equip.acc = acc; return c; };
  const plain = base([mk(null), mk(null), mk(null)]);
  // 2人が 1つずつ
  const hp2 = base([mk('r88_fr_ring'), mk('r88_fr_bangle'), mk(null)]);
  const ringHp = fight([mk('r88_fr_ring')]).allies[0].maxHp; // 指輪だけの 1人（指輪の HP+30 は ここに 入る）
  const bangleHp = fight([mk('r88_fr_bangle')]).allies[0].maxHp;
  assert.equal(hp2[0], ringHp + 60, '指輪の 人');
  assert.equal(hp2[1], bangleHp + 60, 'うでわの 人');
  assert.equal(hp2[2], plain[2], 'つけて いない 人は 上がらない');
  // 1人だけ・同じ 品を 2人
  assert.equal(base([mk('r88_fr_ring'), mk(null)])[0], ringHp);
  const same = base([mk('r88_fr_ring'), mk('r88_fr_ring')]);
  assert.deepEqual(same, [ringHp, ringHp], '同じ 品だけでは 組に ならない');
  // HPも ふえた 分 回復して はじまる
  const b = fight([mk('r88_fr_ring'), mk('r88_fr_bangle')]);
  assert.equal(b.allies[0].hp, fight([mk('r88_fr_ring')]).allies[0].hp + 60);
  assert.ok(GEAR_SETS.kagami_renge.tiers[0].text.includes('2人'));
});

// ───────────── 頭の制御装置・支配の石の輪 ─────────────
test('G17: 頭の制御装置 … つけると 攻撃魔力が 下がり 守りが 上がる。使うと しばらく 攻撃魔力が とても 上がる', () => {
  const c = hero('saiki', 90);
  const s0 = computeStats(c);
  c.equip.acc = SEIGYO;
  const s1 = computeStats(c);
  assert.ok(s1.mag < s0.mag, `魔力 ${s0.mag} → ${s1.mag}`);
  assert.ok(s1.def > s0.def, `守り ${s0.def} → ${s1.def}`);
  const b = fight([c]);
  const me = b.allies[0];
  const u = me.gearUses.find((x) => x.id === SEIGYO);
  assert.ok(u);
  const mp = me.mp;
  const ev = useGear(b, me, u.slot);
  assert.equal(ev.ability, 'r88u_sk_seigyo');
  assert.ok(me.mp >= mp);
  assert.ok(me.buffs?.mag?.mult >= 1.6, '攻撃魔力が とても 上がる');
  assert.ok(me.mag * me.buffs.mag.mult > s0.mag, 'はずすと、つけて いない 時より 強い');
  assert.ok(useGear(b, me, u.slot).lines.join('').includes('何も起こらなかった'), '2回めは だめ');
  // 支配の石の輪: 攻撃魔力が 大きく 上がる・混乱に かかりやすい
  const m = hero('sennen_mage', 80);
  const t0 = computeStats(m);
  m.equip.acc = 'r88_fr_sekirin';
  const t1 = computeStats(m);
  assert.ok(t1.mag >= t0.mag + 30);
  assert.ok(ITEMS.r88_fr_sekirin.resist.confuse > 1);
  assert.ok((t1.resist?.confuse ?? 1) > (t0.resist?.confuse ?? 1), '混乱に かかりやすい');
  // メガネは マヒ・リングは 混乱を 防ぐ。父のメガネは 素早さが 少し 下がる
  for (const id of ['r88_sk_megane', 'r88_sk_papa']) assert.ok(ITEMS[id].fx.some((x) => x.k === 'guard_paralyze'), id);
  assert.ok(ITEMS.r88_sk_germa.fx.some((x) => x.k === 'guard_confuse'));
  assert.ok(ITEMS.r88_sk_papa.bonus.agi < 0);
  // 顔の えんしゅつ 2つ
  const fake = new Proxy({}, { get: () => () => undefined });
  for (const a of ['r88_tenbin', 'r88_seigyo']) {
    assert.ok(R88_ANIMS.has(a), a);
    assert.equal(playR88Fx(fake, a, [{ x: 100, y: 60 }], null, {}, 256, 144), true, a);
  }
  assert.equal(ABILITIES.r88u_fr_tenbin.anim, 'r88_tenbin');
  assert.equal(ABILITIES.r88u_sk_seigyo.anim, 'r88_seigyo');
});

// ───────────── とびらと ライバル ─────────────
test('G17: とびら 2まいと ライバル（4人ずつ・弱い 順・さいごは Lv100）', () => {
  const df = doorOf('frieren'), ds = doorOf('saiki');
  assert.ok(df && ds);
  assert.equal(RIVAL_DOORS.filter((d) => MY.includes(d.work)).length, 2);
  assert.equal(new Set(RIVAL_DOORS.map((d) => d.work)).size, RIVAL_DOORS.length, 'とびらは 2重に ならない');
  for (const d of [df, ds]) {
    assert.ok(R88_BOARD_ICONS[d.mark], d.mark);
    assert.ok(ROOM_STYLES[d.room], d.room);
    assert.ok(MAPS[`rival_room_${d.work}`], d.work);
  }
  assert.deepEqual(df.jobs, ['sennen_mage']);
  assert.deepEqual(ds.jobs, ['saiki']);
  const f = rivalsOf('frieren');
  assert.deepEqual(f.map((x) => x.id), ['fr_mimic', 'fr_aura', 'fr_macht', 'fr_copy']);
  assert.deepEqual(f.map((x) => x.reward), [['r88_fr_chest'], [TENBIN], ['r88_fr_sekirin'], ['r88_fr_staff']]);
  assert.deepEqual(f.map((x) => x.lv), [60, 80, 90, 100]);
  const s = rivalsOf('saiki');
  assert.deepEqual(s.map((x) => x.id), ['sk_kaido', 'sk_haido', 'sk_teruhashi', 'sk_kusuke']);
  assert.deepEqual(s.map((x) => x.reward), [['r88_sk_houtai'], ['r88_sk_hachimaki'], ['r88_sk_aura'], [SEIGYO]]);
  for (const list of [f, s]) {
    assert.equal(list.length, 4);
    for (let i = 1; i < list.length; i++) assert.ok(list[i].lv >= list[i - 1].lv);
    assert.equal(rivalTier(list[list.length - 1].lv), 100);
    for (const rv of list) {
      assert.ok(JOBS[rv.job], `${rv.id}: ${rv.job}`);
      assert.ok(rv.tune?.hp > 0 && rv.sig?.charge && rv.sig?.cast, rv.id);
      assert.ok(rv.words.length <= 40, `${rv.id}: ひとことは みじかく`);
      assert.ok(!/こわい|暗いよ|殺|あやつ/.test(rv.words + rv.sig.charge + rv.sig.cast), `${rv.id}: こわく しない`);
      assert.ok(FIXED_ENCOUNTERS[rivalEnc(rv.id)], rv.id);
      assert.ok(ABILITIES[`r88r_${rv.id}`], rv.id);
      for (const id of rv.reward) assert.equal(ITEMS[id].work, rv.work, id);
      assert.equal(ITEMS[rv.use]?.work, rv.work, `${rv.id}: 使う 品`);
    }
  }
  assert.equal(RIVAL_BY_ID.fr_copy.job, 'sennen_mage', 'ふくせい体は 千年の大魔法使いの 技');
  assert.ok(RIVAL_BY_ID.fr_copy.name.includes('ふくせい体'));
  assert.ok(RIVAL_BY_ID.sk_teruhashi.words.includes('おっふ'));
  assert.ok(RIVAL_BY_ID.sk_kaido.words.includes('しっ黒のつばさ'));
});

test('G17: とびらは その 作品の 品 3つで 開く', () => {
  const c = hero('warrior');
  for (const id of ['r88_fr_sougetsu', 'r88_fr_sabi']) addItem(c, id, 1);
  assert.equal(workOwned(c, 'frieren'), 2);
  assert.ok(!doorOpen(c, 'frieren'));
  addItem(c, 'r88_fr_kakigori', 1);
  assert.ok(doorOpen(c, 'frieren'));
  assert.ok(!doorOpen(c, 'saiki'));
  c.bank = { gold: 0, items: [{ id: 'r88_sk_ramen', n: 1 }, { id: 'r88_sk_memo', n: 1 }] };
  c.equip.head = 'r88_sk_megane';
  assert.ok(doorOpen(c, 'saiki'), '預かり所・装備でも よい');
});

// ───────────── ガチャ・試練の ごほうび ─────────────
test('G17: ガチャガチャ（2作品が ならぶ。ライバル・伝説・店・試練の ごほうびは 出ない）', () => {
  assert.ok(gachaWorks().includes('frieren') && gachaWorks().includes('saiki'));
  const pf = gachaPool('frieren'), ps = gachaPool('saiki');
  assert.equal(pf.all.length, 12);
  assert.equal(ps.all.length, 8);
  assert.equal(pf.all.length * GACHA_PRICE, 240000);
  assert.equal(ps.all.length * GACHA_PRICE, 160000);
  const trial = [trialGiftOf('sennen_mage'), trialGiftOf('saiki')];
  for (const [w, p] of [['frieren', pf], ['saiki', ps]]) {
    const all = new Set(p.all);
    const rivals = rivalsOf(w).flatMap((rv) => rv.reward);
    for (const id of newIds(w)) {
      const it = ITEMS[id];
      const out = it.grade === 'den' || it.grade === 'shop' || rivals.includes(id) || trial.includes(id) || Object.values(REBIRTH).some((x) => x.to === id);
      assert.equal(all.has(id), !out, `${id}: ${gachaBlock(id)}`);
    }
  }
  assert.ok(pf.mei.length > 0 && ps.mei.length > 0, '名品も 出る');
});

test('G17: 試練の ごほうび（千年の大魔法使い → 花畑を出す魔法の魔導書・さいきくすお → コーヒーゼリー）', () => {
  assert.equal(trialGiftOf('sennen_mage'), 'r88_fr_hanabatake');
  assert.equal(trialGiftOf('saiki'), 'r88_sk_coffee');
  assert.ok(JOBS.sennen_mage && JOBS.saiki);
  for (const id of ['r88_fr_hanabatake', 'r88_sk_coffee']) assert.equal(gachaBlock(id), 'trial', id);
  assert.equal(ITEMS.r88_sk_coffee.name, 'コーヒーゼリー');
});

// ───────────── セーブと 引っこし ─────────────
test('G17: セーブと 引っこしコード（ライバル・品）', () => {
  const c = hero('saiki', 90);
  c.rivals = { fr_aura: 1, sk_kusuke: 1 };
  for (const id of [TENBIN, ...KAGAMI_RENGE, 'r88_fr_sekirin', HERO_SWORD]) addItem(c, id, 1);
  c.equip.acc = SEIGYO;
  const code = exportCode(c, 1794488401253);
  const r = parseCode(code);
  assert.equal(r.ok, true, r.reason);
  const back = repairChar(r.char);
  assert.deepEqual(back.rivals, { fr_aura: 1, sk_kusuke: 1 });
  assert.equal(back.equip.acc, SEIGYO);
  assert.equal(itemCount(back, TENBIN), 1);
  assert.equal(itemCount(back, HERO_SWORD), 1);
  assert.ok(splitCode(code).length <= 1, 'ふつうの セーブは 1通');
});
