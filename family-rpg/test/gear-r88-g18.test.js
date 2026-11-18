// 第88回 G18班: はなかっぱ・おしり探てい・暴れんぼう将軍・3年B組
//   品の 数・名前が かぶらない・今 ある 品に 作品・全部の 品に 手に入れ方が ある・頭のつぼみの 生まれ変わり・
//   スーツの「使う」（しつれい、こかせていただきます）・とびら 2まい（2作品ずつ まとめる）と ライバル・ガチャ・試練の ごほうび・はじめの 品
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../public/js/shared/data/items.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { WORKS } from '../public/js/shared/data/works.js';
import { REBIRTH } from '../public/js/shared/data/items-alchemy.js';
import { SHOPS, shopItems } from '../public/js/shared/data/shops.js';
import { ITEMS_R88_KIDS } from '../public/js/shared/data/items-r88-kids.js';
import { ITEMS_R88_JIDAI } from '../public/js/shared/data/items-r88-jidai.js';
import { rebirthOf, upgradeCost } from '../public/js/shared/data/forge.js';
import { upgradeId } from '../public/js/shared/data/items-forge.js';
import { Battle } from '../public/js/shared/battle.js';
import { newCharacter, gainExp, expForLevel, fullHeal, canEquipChar } from '../public/js/shared/stats.js';
import { gachaBlock, gachaPool, gachaWorks, trialGiftOf, r88ShopItems, TM_R88_DEN, GACHA_PRICE } from '../public/js/shared/data/gacha-r88.js';
import { RIVAL_DOORS, RIVAL_BY_ID, rivalsOf, rivalTier, rivalEnc, doorWorks } from '../public/js/shared/data/rivals-r88.js';
import { workOwned, doorOpen, rivalPaper, rivalTrack } from '../public/js/shared/rivals-r88.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { ROOM_STYLES, hallLayout } from '../public/js/shared/maps/rivals-r88.js';
import { MAPS } from '../public/js/shared/maps/index.js';
import { R88_BOARD_ICONS, R88_BOARD_COLORS } from '../public/js/client/render/boards-r88.js';
import { playR88Fx, R88_ANIMS } from '../public/js/client/render/battlefx-r88.js';
import { r88DetailLines } from '../public/js/shared/gear-r88-view.js';
import { JOBS } from '../public/js/shared/data/jobs.js';
import { makeRng } from '../public/js/shared/rng.js';

const WS = ['hanakappa', 'oshiri', 'abarenbo', 'class3b'];
const ids = (work) => Object.keys(ITEMS).filter((id) => ITEMS[id].work === work && !ITEMS[id].base && !ITEMS[id].r88Tag);
const ALL = () => WS.flatMap(ids);
function hero(job = 'warrior', lv = 70) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job });
  c.job = job;
  gainExp(c, expForLevel(lv));
  fullHeal(c);
  c.items = [];
  c.equip = { weapon: null, armor: null, shield: null, head: null, acc: null };
  return c;
}
function fight(chars, enemies = ['pururin', 'pururin', 'rockman'], seed = 88, boss = false) {
  const b = new Battle({ rng: makeRng(seed), boss, allies: chars.map((char, i) => ({ char, controller: `s${i}` })), enemies, canFlee: !boss });
  for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 99999; }
  return b;
}

test('G18: 品の 数（はなかっぱ 11・おしり探てい 10・暴れんぼう将軍 7・3年B組 7）。作品・読みがな・名前が かぶらない', () => {
  const want = { hanakappa: 11, oshiri: 10, abarenbo: 7, class3b: 7 };
  for (const [w, n] of Object.entries(want)) assert.equal(ids(w).length, n, w);
  assert.equal(Object.keys(ITEMS_R88_KIDS).length, 21);
  assert.equal(Object.keys(ITEMS_R88_JIDAI).length, 14);
  // 作品の 名前は 職業の 名前に 合わせる
  assert.equal(WORKS.hanakappa.name, JOBS.hanakappa.name);
  assert.equal(WORKS.oshiri.name, JOBS.oshiri_tantei.name);
  assert.equal(WORKS.abarenbo.name, JOBS.abarenbo_shogun.name);
  assert.equal(WORKS.class3b.name, '3年B組');
  for (const id of ALL()) {
    const it = ITEMS[id];
    assert.equal(it.src, 'r88', id);
    assert.ok(it.name && it.desc, id);
    if (it.use) assert.ok(ABILITIES[it.use.ability]?.hidden, `${id}: ${it.use.ability}`);
  }
  // 伝説: はなかっぱ 1（わかランの花）・おしり探てい 1（風のみちしるべ）・暴れんぼう将軍と 3年B組は なし
  assert.deepEqual(ALL().filter((id) => ITEMS[id].grade === 'den').sort(), ['r88_hk_wakaran', 'r88_os_michishirube']);
  // 名前が かぶらない（今 ある 品・技。ワリオのニンニク・かいとうの白いマント・ぬ〜べ〜の 出席ぼ・ひまわりの花〈技〉など）
  const names = ALL().map((id) => ITEMS[id].name);
  assert.equal(new Set(names).size, names.length);
  const others = new Map();
  for (const [id, it] of Object.entries(ITEMS)) if (!it.base && !ALL().includes(id)) others.set(it.name, id);
  const abs = new Set(Object.entries(ABILITIES).filter(([id]) => !id.startsWith('r88u_')).map(([, a]) => a.name));
  for (const n of names) {
    assert.ok(!others.has(n), `${n}: ${others.get(n)}`);
    assert.ok(!abs.has(n), `${n}: 技`);
  }
  for (const n of ['にんにく', 'かいとうのマント', '出席ぼ', 'ひまわりの花', 'ミカン']) assert.ok(!names.includes(n), n);
  assert.ok(!names.some((x) => x.includes('ミカン')), 'くさったミカンは 作らない');
  assert.ok(names.includes('ムキムキにんにく') && names.includes('かいとうUのマント') && names.includes('3年B組の出席ぼ'));
});

test('G18: 今 ある 品（カッパのお皿・熱血先生のジャージ・指し棒）は 作品の 品として 数える。チョークは 鋼のれん金術師の まま', () => {
  const want = { kappa_sara: 'hanakappa', nekketsu_jersey: 'class3b', pointer_stick: 'class3b' };
  for (const [id, w] of Object.entries(want)) {
    assert.equal(ITEMS[id].work, w, id);
    assert.ok(ITEMS[id].r88Tag, id);
    assert.ok(!ITEMS[id].grade, id);
    assert.equal(gachaBlock(id), 'grade', id);
  }
  assert.equal(ITEMS.kappa_sara.price, 50);
  assert.equal(ITEMS.pointer_stick.atk, 15);
  assert.equal(ITEMS.nekketsu_jersey.src, 'tm');
  assert.equal(ITEMS.chalk.work, 'hagaren');
  assert.ok(r88DetailLines('kappa_sara', hero()).join('\n').includes('作品：はなかっぱ'));
  assert.ok(r88DetailLines('pointer_stick', hero()).join('\n').includes('作品：3年B組'));
});

test('G18: 全部の 品に 手に入れ方が ある（店・ガチャ・ライバル・試練・生まれ変わり・宝の洞窟の いちばん おく）', () => {
  const shop = new Set(Object.values(SHOPS).flatMap((s) => shopItems(s, () => true)));
  const trial = new Set(Object.values(WORKS).flatMap((w) => Object.values(w.trialGift || {})));
  const rival = new Set(RIVAL_DOORS.filter((d) => ['hanakappa', 'abarenbo'].includes(d.work)).flatMap((d) => rivalsOf(d.work)).flatMap((rv) => rv.reward));
  for (const id of ALL()) {
    const pool = new Set(gachaPool(ITEMS[id].work).all);
    const how = [shop.has(id) && '店', pool.has(id) && 'ガチャ', rival.has(id) && 'ライバル', trial.has(id) && '試練',
      TM_R88_DEN.includes(id) && '宝', Object.values(REBIRTH).some((r) => r.to === id) && '生まれ変わり'].filter(Boolean);
    assert.ok(how.length, `${id}: 手に入れ方が ない`);
    if (ITEMS[id].grade === 'den') assert.ok(how.includes('ライバル'), `${id}: ${how}`);
  }
  assert.ok(shop.has('r88_3b_seifuku'), '桜中学の制服は 店');
});

test('G18: 頭のつぼみ（はなかっぱの 試練の ごほうび）→ 3回 きたえた あと 大人の花に 生まれ変わる', () => {
  assert.equal(ITEMS.r88_hk_tsubomi.type, 'head');
  assert.equal(ITEMS.r88_hk_hana.type, 'head');
  assert.ok(!ITEMS.r88_hk_tsubomi.helm, 'はなかっぱは かぶとは だめ・ぼうしは よい');
  assert.ok(canEquipChar(hero('hanakappa'), 'r88_hk_tsubomi'));
  const rb = rebirthOf('r88_hk_tsubomi');
  assert.equal(rb.to, 'r88_hk_hana');
  assert.equal(rb.at, 3);
  const c = hero('hanakappa');
  assert.ok(!upgradeCost('r88_hk_tsubomi', c)?.reborn, 'はじめは ふつうに きたえる');
  const cost = upgradeCost(upgradeId('r88_hk_tsubomi', 3), c);
  assert.ok(cost?.reborn, '+3 の 次で 生まれ変わる');
  assert.equal(cost.to, 'r88_hk_hana');
  // 売っても もうからない
  assert.ok(ITEMS.r88_hk_hana.sell < ITEMS.r88_hk_tsubomi.sell + rb.gold);
  // 大人の花は ★4・いやしと 回復の 力が つぼみより 上
  assert.equal(ITEMS.r88_hk_hana.grade, 'mei');
  assert.ok(ITEMS.r88_hk_hana.bonus.heal > ITEMS.r88_hk_tsubomi.bonus.heal);
  // わかランの花（伝説）は いやしと 回復の 力が 大きい
  const w = ITEMS.r88_hk_wakaran;
  assert.ok(w.bonus.heal >= 60 && w.fx.some((f) => f.k === 'regen' && f.v >= 8));
});

test('G18: 名探ていのスーツの「使う」… しつれい、こかせていただきます（1グループを ねむらせる・1回・MPなし）。えんしゅつ', () => {
  const it = ITEMS.r88_os_suit;
  const a = ABILITIES[it.use.ability];
  assert.equal(a.target, 'group');
  assert.equal(a.effect.status, 'sleep');
  assert.ok(a.hidden && a.mp === 0 && !a.job);
  assert.equal(a.anim, 'r88_oshiri');
  assert.notEqual(a.name, ABILITIES.oshiri_tantei_sig.name, 'おしり探ていの 技とは べつの 名前');
  assert.ok(canEquipChar(hero('oshiri_tantei'), 'r88_os_suit'));
  const c = hero('oshiri_tantei');
  c.equip.armor = 'r88_os_suit';
  const b = fight([c]);
  const me = b.allies[0];
  const u = me.gearUses.find((x) => x.id === 'r88_os_suit');
  assert.ok(u);
  const mp = me.mp;
  const ev = { lines: [], upd: [] };
  b.perform(me, { type: 'item', id: `gear:${u.slot}` }, ev);
  assert.equal(me.mp, mp, 'MPなし');
  assert.ok(u.used, '1回');
  assert.ok(ev.lines.some((l) => l.includes('「しつれい、こかせていただきます」')), ev.lines.join('/'));
  assert.ok(b.enemies.filter((e) => e.status?.sleep).length >= 1, 'ねむる');
  assert.ok(!b.enemies[2].status?.sleep, 'ちがう 種類の 敵には とどかない');
  // ほかの 品の 使う では いつもの「の力が、はなたれた！」
  const k = hero('kaito_kid');
  k.equip.acc = 'r88_kt_spray';
  const b2 = fight([k]);
  const ev2 = { lines: [], upd: [] };
  b2.perform(b2.allies[0], { type: 'item', id: `gear:${b2.allies[0].gearUses[0].slot}` }, ev2);
  assert.ok(ev2.lines.some((l) => l.endsWith('の力が、はなたれた！')));
  // えんしゅつ
  const fake = new Proxy({}, { get: () => () => undefined });
  assert.ok(R88_ANIMS.has('r88_oshiri'));
  assert.equal(playR88Fx(fake, 'r88_oshiri', [{ x: 100, y: 60 }, { x: 150, y: 70 }], null, {}, 256, 144), true);
  // 使う 品は スーツ だけ
  assert.deepEqual(ALL().filter((id) => ITEMS[id].use), ['r88_os_suit']);
});

test('G18: 将軍の名刀は マヒの力（みねうち）・め組のまといは 1グループに とどく', () => {
  assert.ok(ITEMS.r88_ab_meito.fx.some((f) => f.k === 'paralyze'));
  assert.equal(ITEMS.r88_ab_matoi.reach, 'group');
  for (const id of ['r88_ab_meito', 'r88_ab_matoi', 'r88_ab_shinobi', 'r88_ab_kinagashi']) assert.ok(canEquipChar(hero('abarenbo_shogun'), id), id);
  for (const id of ['r88_3b_shusseki', 'r88_ab_ougi', 'r88_3b_seifuku']) assert.ok(canEquipChar(hero('homeroom_3b'), id), id);
  assert.ok(canEquipChar(hero('oshiri_tantei'), 'r88_os_stick'));
});

test('G18: とびら 2まい（はなかっぱ・おしり探てい／暴れんぼう将軍・3年B組。2作品の 品の 合計で 開く）と ライバル', () => {
  const dk = RIVAL_DOORS.find((d) => d.work === 'hanakappa');
  const dj = RIVAL_DOORS.find((d) => d.work === 'abarenbo');
  assert.ok(dk && dj);
  for (const w of ['oshiri', 'class3b']) assert.ok(!RIVAL_DOORS.some((d) => d.work === w), `${w}は まとめた とびら`);
  assert.equal(RIVAL_DOORS.filter((d) => doorWorks(d.work).some((w) => WS.includes(w))).length, 2);
  assert.deepEqual(doorWorks('hanakappa'), ['hanakappa', 'oshiri']);
  assert.deepEqual(doorWorks('abarenbo'), ['abarenbo', 'class3b']);
  for (const d of [dk, dj]) {
    assert.ok(R88_BOARD_ICONS[d.mark] && R88_BOARD_COLORS[d.mark], d.mark);
    for (const row of R88_BOARD_ICONS[d.mark].rows) assert.equal(row.length, 9, d.mark);
    assert.ok(ROOM_STYLES[d.room], d.room);
    assert.ok(MAPS[`rival_room_${d.work}`], d.work);
    for (const j of d.jobs) assert.ok(JOBS[j], j);
  }
  const L = hallLayout();
  assert.ok(L.doors.some((d) => d.work === 'hanakappa') && L.doors.some((d) => d.work === 'abarenbo'));
  assert.ok(MAPS.rival_hall.boards.some((b) => b.name === 'はなかっぱ・おしり探ていのとびら'));
  assert.ok(MAPS.rival_hall.boards.some((b) => b.name === '暴れんぼう将軍・3年B組のとびら'));
  // 2作品の 品の 合計で 開く（カッパのお皿〈今 ある 品〉＋ おはぎ ＋ スイートポテト ＝ 3）
  const c = hero();
  c.items = [{ id: 'kappa_sara', n: 1 }, { id: 'r88_hk_ohagi', n: 1 }];
  assert.equal(workOwned(c, 'hanakappa'), 2);
  assert.equal(doorOpen(c, 'hanakappa'), false);
  c.items.push({ id: 'r88_os_potato', n: 1 });
  assert.equal(doorOpen(c, 'hanakappa'), true);
  assert.equal(rivalPaper(c, 'hanakappa').workName, 'はなかっぱ・おしり探てい');
  assert.ok(rivalTrack(c).items.some((x) => x.name === 'はなかっぱ・おしり探ていのとびら'));
  const j = hero();
  j.items = [{ id: 'pointer_stick', n: 1 }, { id: 'nekketsu_jersey', n: 1 }, { id: 'r88_ab_kura', n: 1 }];
  assert.equal(doorOpen(j, 'abarenbo'), true);
  // ライバル（弱い 順）
  const k = rivalsOf('hanakappa');
  assert.deepEqual(k.map((x) => x.id), ['hk_garizo', 'hk_chobee', 'os_kaitou', 'hk_wakaran', 'os_kaitou_moon']);
  assert.deepEqual(k.map((x) => x.lv), [60, 64, 80, 90, 100]);
  assert.deepEqual(k.map((x) => x.reward), [['r88_hk_megane'], ['r88_hk_ougi'], ['r88_os_hensou'], ['r88_hk_wakaran'], ['r88_os_michishirube']]);
  assert.equal(RIVAL_BY_ID.hk_wakaran.members.length, 2);
  const s = rivalsOf('abarenbo');
  assert.deepEqual(s.map((x) => x.id), ['ab_daikan', 'cb_kinpachi', 'ab_oyadama', 'ab_uesama']);
  assert.deepEqual(s.map((x) => x.lv), [60, 64, 70, 80]);
  assert.deepEqual(s.map((x) => x.reward), [['r88_ab_shinobi'], ['r88_3b_album'], ['r88_ab_ougi'], ['r88_ab_meito']]);
  assert.equal(RIVAL_BY_ID.ab_daikan.members.length, 2);
  assert.ok(RIVAL_BY_ID.ab_uesama.words.includes('余の顔'));
  assert.ok(RIVAL_BY_ID.cb_kinpachi.words.includes('人という字'));
  assert.equal(rivalsOf('oshiri').length + rivalsOf('class3b').length, 0);
  for (const list of [k, s]) {
    for (let i = 1; i < list.length; i++) assert.ok(list[i].lv >= list[i - 1].lv);
    for (const rv of list) {
      assert.ok(rv.tune?.hp > 0 && rv.sig?.charge && rv.sig?.cast, rv.id);
      assert.ok(rv.words.length <= 40, `${rv.id}: ひとことは みじかく`);
      assert.ok(FIXED_ENCOUNTERS[rivalEnc(rv.id)], rv.id);
      assert.ok(ABILITIES[`r88r_${rv.id}`], rv.id);
      for (const m of rv.members || [rv]) assert.ok(JOBS[m.job], `${rv.id}: ${m.job}`);
      for (const id of rv.reward) assert.ok(doorWorks(rv.work).includes(ITEMS[id].work), id);
    }
  }
  assert.equal(rivalTier(k[k.length - 1].lv), 100);
  assert.equal(rivalTier(s[s.length - 1].lv), 80, '伝説の ない とびらは Lv80 ごろ');
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('os_kaitou_moon')].bg, 'tower_top');
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('cb_kinpachi')].bg, 'grass');
});

test('G18: ガチャガチャ（4作品が ならぶ。ライバル・伝説・生まれ変わりの 先・店の 品・試練の ごほうびは 出ない）', () => {
  const want = { hanakappa: 6, oshiri: 7, abarenbo: 3, class3b: 4 };
  for (const [w, n] of Object.entries(want)) {
    assert.ok(gachaWorks().includes(w), w);
    const p = gachaPool(w);
    assert.equal(p.all.length, n, w);
    assert.equal(p.all.length * GACHA_PRICE, n * 20000);
    const all = new Set(p.all);
    const door = w === 'oshiri' ? 'hanakappa' : w === 'class3b' ? 'abarenbo' : w;
    for (const id of ids(w)) {
      const it = ITEMS[id];
      const out = it.grade === 'den' || it.grade === 'shop' || rivalsOf(door).some((rv) => rv.reward.includes(id)) || Object.values(REBIRTH).some((r) => r.to === id)
        || ['hanakappa', 'oshiri_tantei', 'abarenbo_shogun', 'homeroom_3b'].some((j) => trialGiftOf(j) === id);
      assert.equal(all.has(id), !out, `${id}: ${gachaBlock(id)}`);
    }
  }
});

test('G18: 試練の ごほうび（はなかっぱ → 頭のつぼみ・おしり探てい → しん士のステッキ・暴れんぼう将軍 → 白い着流し・3年B組の担任 → 3年B組の出席ぼ）と はじめの 品', () => {
  const want = { hanakappa: 'r88_hk_tsubomi', oshiri_tantei: 'r88_os_stick', abarenbo_shogun: 'r88_ab_kinagashi', homeroom_3b: 'r88_3b_shusseki' };
  for (const [job, id] of Object.entries(want)) {
    assert.ok(JOBS[job], job);
    assert.equal(trialGiftOf(job), id, job);
    assert.equal(gachaBlock(id), 'trial', id);
    assert.ok(canEquipChar(hero(job), id), `${job}: ${id}`);
  }
  assert.equal(ITEMS.r88_3b_seifuku.grade, 'shop');
  assert.ok(r88ShopItems().village.includes('r88_3b_seifuku'));
});
