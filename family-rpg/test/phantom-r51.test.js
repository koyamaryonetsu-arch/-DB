// 第51回 F: 幻の職業の 土台（docs/plan-r51-phantom.md）
//   1. 職業の ランク（tier 4）・条件の 表・うわさ・技の ランク（skill-tier.js）
//   2. 技の タグ（data/phantom.js）
//   3. 戦いで 数える（技の タグ・ダメージ・呪文・炎・会心・5000以上・回復。家族の キャラだけ）
//   4. セーブ・データ合わせ・引っこしコード
//   5. なれる しくみ（ためしの 幻の職業を 入れて）・掲示板への 知らせ・幻の書
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ABILITIES } from '../public/js/shared/data/abilities.js';

// 天気の 技（W 班が つける weather）の ためし: タグを 作る 前に 入れる
ABILITIES.zz_sun_test = { name: 'ためしの晴れ', kind: 'spell', mp: 1, target: 'allies', effect: { type: 'buff', stat: 'atk', mult: 1.1 }, weather: 'sun', anim: 'buff' };

const { JOBS, PHANTOM_ORDER, PHANTOM_LIVE, ALL_JOBS, TIER_NAMES, TIER_ORDERS, JOB_HINTS, JOB_MAX_LEVEL, jobBattlesForLevel } = await import('../public/js/shared/data/jobs.js');
const {
  PHANTOM_JOBS, PHANTOM_TAGS, FEAT_STATS, BIG_HIT, abilityTags, tagMembers, condNow, phantomCondsMet, phantomSeen, phantomReady,
  phantomBook, phantomRumors, phantomCondText, bigNum, newFeat,
} = await import('../public/js/shared/data/phantom.js');
const { addFeats, repairFeats, mergeFeats, packFeats, unpackFeats, toFeats, phantomAfterBattle, phantomGot } = await import('../public/js/shared/world/phantom.js');
const { tierMods, TIER_MODS } = await import('../public/js/shared/skill-tier.js');
const { BUFF_ACTS } = await import('../public/js/shared/buff-acts.js');
const { Battle } = await import('../public/js/shared/battle.js');
const { newCharacter, gainExp, expForLevel, fullHeal, jobUnlocked, jobKnown, changeJob, addItem } = await import('../public/js/shared/stats.js');
const { makeRng } = await import('../public/js/shared/rng.js');
const { repairChar } = await import('../public/js/shared/world/save.js');
const { mergeChars } = await import('../public/js/shared/world/merge.js');
const { exportCode, parseCode, slimChar, unslimChar, slimChar4, unslimChar4, LINE_MAX } = await import('../public/js/shared/world/transfer.js');
const { GameWorld } = await import('../public/js/shared/world/world.js');
const { startFieldBattle } = await import('../public/js/shared/world/battles.js');
const { recruitNpc, partyOf, addMonsterEntry, noteSeen } = await import('../public/js/shared/world/party.js');
const { afterRosterChange } = await import('../public/js/shared/world/party.js');
const { ROSTER_MAX } = await import('../public/js/shared/data/companions.js');
const { MONSTERS } = await import('../public/js/shared/data/monsters.js');
const { ITEMS } = await import('../public/js/shared/data/items.js');
const { STORY_STEPS } = await import('../public/js/shared/data/story.js');
const { checkFile } = await import('../tools/kanji-check.mjs');
const { Bot, tickN } = await import('./helpers.js');
// 読みこんだ ときに 定義の あった 幻の職業（下で ためしの 職業を 入れる 前）
const LIVE_AT_LOAD = PHANTOM_ORDER.filter((id) => JOBS[id]);

// ───────────── 1. ランク・条件の 表 ─────────────
test('幻の職業: 12この id・tier 4 の 名前・一覧（定義の ない 職業は 入れない）', () => {
  assert.deepEqual(PHANTOM_ORDER, ['pirate_king', 'super_hero', 'sun_hokage', 'facility_ai', 'detective_king', 'galaxy_queen',
    'grand_magus', 'sword_saint', 'cosmic_okan', 'chaos_creator', 'dream_stadium', 'weather_god']);
  assert.deepEqual(Object.keys(PHANTOM_JOBS), PHANTOM_ORDER, '条件の 表も おなじ じゅん');
  assert.equal(TIER_NAMES[4], '幻の職業');
  assert.equal(TIER_ORDERS.length, 5);
  assert.equal(TIER_ORDERS[4], PHANTOM_LIVE);
  assert.deepEqual(PHANTOM_LIVE, LIVE_AT_LOAD);
  // 定義が ある 幻の職業は ALL_JOBS に 1回だけ・tier 4・req は きわめておく 職業 2つ（各班が まぜた あとも こわれない）
  for (const id of PHANTOM_LIVE) {
    assert.equal(ALL_JOBS.filter((x) => x === id).length, 1, id);
    assert.equal(JOBS[id].tier, 4, id);
    assert.deepEqual([...JOBS[id].req].sort(), [...PHANTOM_JOBS[id].masters].sort(), `${id} の req`);
    assert.ok(!JOBS[id].reqSuper && !JOBS[id].reqAlt, `${id}: reqSuper・reqAlt は 使わない`);
  }
  for (const id of ALL_JOBS) assert.ok(JOBS[id], id);
  // 職業レベルの 上がりかた（tier 4 は 伝説より 少し 多い）
  assert.ok(jobBattlesForLevel(5, 4) > jobBattlesForLevel(5, 3));
});

test('きわめておく 職業の id は 今の 職業（天候をあやつる者は W 班）', () => {
  const want = {
    pirate_king: ['nika', 'pirate'], super_hero: ['loto_hero', 'ss3'], sun_hokage: ['hinokami', 'hokage'],
    facility_ai: ['facility_genius', 'creator'], detective_king: ['meitantei', 'oshiri_tantei'], galaxy_queen: ['neo_queen', 'fifth_spirit'],
    grand_magus: ['archmage', 'harry'], sword_saint: ['hiten', 'abarenbo_shogun'], cosmic_okan: ['saikyo_okan', 'homeroom_3b'],
    chaos_creator: ['hakaishin', 'creator'], dream_stadium: ['keikyu_president', 'hall_of_fame'], weather_god: ['tenkou_tsukai', 'summoner'],
  };
  for (const [id, m] of Object.entries(want)) assert.deepEqual(PHANTOM_JOBS[id].masters, m, id);
  for (const p of Object.values(PHANTOM_JOBS)) {
    for (const r of p.masters) {
      if (r === 'tenkou_tsukai' && !JOBS[r]) continue;
      assert.ok(JOBS[r] && JOBS[r].tier >= 1, r);
    }
  }
  assert.equal(JOBS.archmage.name, '大魔道士');
  assert.equal(JOBS.summoner.name, '天地雷鳴士');
  assert.equal(JOBS.oshiri_tantei.name, 'おしり探てい');
});

test('条件の 表: 数は 家族が えらんだ まま', () => {
  const g = (id) => PHANTOM_JOBS[id].conds.map((x) => [x.use ? x.use.join('+') : x.stat, x.goal]);
  assert.deepEqual(g('pirate_king'), [['gomu', 500], ['dmg', 200000]]);
  assert.deepEqual(g('super_hero'), [['thunderSpell+kame', 300], ['dmg', 300000]]);
  assert.deepEqual(g('sun_hokage'), [['hinokami', 200], ['ninjutsu', 200], ['dmgFire', 200000]]);
  assert.deepEqual(g('facility_ai'), [['support', 1500], ['heal', 50000]]);
  assert.deepEqual(g('detective_king'), [['deduce', 500], ['dmg', 100000]]);
  assert.deepEqual(g('galaxy_queen'), [['healSpell', 1000], ['heal', 300000]]);
  assert.deepEqual(g('grand_magus'), [['attackSpell', 1000], ['dmgSpell', 500000]]);
  assert.deepEqual(g('sword_saint'), [['sword', 1000], ['crit', 300]]);
  assert.deepEqual(g('cosmic_okan'), [['debuff', 1000], ['heal', 50000]]);
  assert.deepEqual(g('chaos_creator'), [['big5000', 50]]);
  assert.deepEqual(g('dream_stadium'), [['train', 300], ['pitch', 300], ['dmg', 200000]]);
  assert.deepEqual(g('weather_god'), [['sun', 200], ['rain', 200], ['thunder', 200]]);
  assert.equal(BIG_HIT, 5000);
  for (const p of Object.values(PHANTOM_JOBS)) {
    for (const x of p.conds) {
      for (const t of x.use || []) assert.ok(PHANTOM_TAGS.includes(t), t);
      if (x.stat) assert.ok(FEAT_STATS.includes(x.stat), x.stat);
    }
  }
});

test('うわさ・文: 12こ ある・漢字の きまり（神殿の うわさは 数を 言わない）', () => {
  for (const id of PHANTOM_ORDER) {
    assert.ok(JOB_HINTS[id], `${id} の うわさ`);
    assert.ok(!/[0-9０-９]{2,}|万/.test(JOB_HINTS[id]), `${id}: うわさに 条件の 数を 書かない`);
  }
  for (const f of ['public/js/shared/data/phantom.js', 'public/js/shared/world/phantom.js', 'public/js/client/ui/phantom-book.js', 'public/js/shared/data/jobs.js']) {
    assert.deepEqual(checkFile(new URL(`../${f}`, import.meta.url).pathname).filter((p) => p.kind !== 'kana'), [], f);
  }
  assert.equal(phantomCondText('pirate_king'), 'ニカと海賊をきわめる。ゴムゴムの技を500回使う。あたえたダメージの合計20万');
  assert.match(phantomCondText('weather_god'), /^天候をあやつる者と天地雷鳴士をきわめる/);
  assert.equal(bigNum(9999), '9999');
  assert.equal(bigNum(200000), '20万');
  assert.equal(bigNum(123456), '12.3万');
});

test('技の ランク: 幻の職業は MP −35%・6回行動・2段階・回復 ×1.25（それより 上は 4 と おなじ）', () => {
  assert.deepEqual(tierMods(4), { mpMul: 0.65, acts: BUFF_ACTS + 3, stages: 2, healMul: 1.25 });
  assert.equal(TIER_MODS.length, 5);
  assert.equal(tierMods(9), tierMods(4));
  assert.deepEqual(tierMods(3), { mpMul: 0.7, acts: BUFF_ACTS + 2, stages: 2, healMul: 1.2 }, '伝説は かわらない');
});

// ───────────── 2. 技の タグ ─────────────
test('技の タグ: どの タグにも 技が ある（天気は W 班の 技が 入るまで 空でも よい）', () => {
  for (const t of PHANTOM_TAGS) {
    const m = tagMembers(t);
    if (['sun', 'rain', 'thunder'].includes(t)) {
      for (const id of m) assert.equal(ABILITIES[id].weather, t, id);
      continue;
    }
    assert.ok(m.length > 0, `${t} の 技が ない`);
    for (const id of m) assert.notEqual(ABILITIES[id].kind, 'monster', `${t}: ${id} は 魔物の 技`);
  }
  assert.ok(tagMembers('sun').includes('zz_sun_test'), 'weather: sun の 技');
});

test('技の タグ: 見本', () => {
  const has = (id, t) => assert.ok(abilityTags(id).includes(t), `${id}（${ABILITIES[id]?.name}）は ${t}`);
  const not = (id, t) => assert.ok(!abilityTags(id).includes(t), `${id}（${ABILITIES[id]?.name}）は ${t} で ない`);
  for (const id of ['go_pistol', 'go_gear2', 'nk_gear5', 'nk_taiyou']) has(id, 'gomu');
  not('pr_kaizokugiri', 'gomu');
  for (const id of ['mk_raiden', 'hr_gigadein', 'lt_minadein', 'hy_kizu']) has(id, 'thunderSpell');
  not('mk_inazuma', 'thunderSpell');
  not('mera', 'thunderSpell');
  for (const id of ['sy_kamehameha', 'sz_kame', 's2_final', 's3_kame']) has(id, 'kame');
  for (const id of ['hinokami_sig', 'hn_kasha', 'eb_rengoku']) has(id, 'hinokami');
  not('ks_minamo', 'hinokami');
  for (const id of ['konoha_sig', 'kh_bunshin', 'hokage_sig', 'hg_oodama']) has(id, 'ninjutsu');
  for (const id of ['hoimi', 'baikiruto', 'sukuruto', 'rukani']) has(id, 'support');
  not('mera', 'support');
  for (const id of ['os_suiri', 'tn_suiri', 'meitantei_sig', 'os_kunkun', 'mt_fukiya']) has(id, 'deduce');
  for (const id of ['hoimi', 'behomara', 'hp_behomazun', 'zao']) has(id, 'healSpell');
  not('ok_gohan', 'healSpell');
  for (const id of ['mera', 'merazoma', 'am_medroa', 'io']) has(id, 'attackSpell');
  not('hoimi', 'attackSpell');
  for (const id of ['daichi', 'dk_gigabreak', 'hiten_sig', 'sa_iai', 'ab_mineuchi', 'kisatsu_sig']) has(id, 'sword');
  for (const id of ['mera', 'nj_shuriken', 'sy_kamehameha', 'bb_hit']) not(id, 'sword');
  for (const id of ['rukani', 'ok_nenasai', 'ok_katazuke', 'so_kaminari', 'ok_ikari', 'tn_kikikomi']) has(id, 'debuff');
  not('mera', 'debuff');
  not('baikiruto', 'debuff');
  for (const id of ['rw_manin', 'kq_120', 'keikyu_president_sig', 'dv_tsuuka']) has(id, 'train');
  for (const id of ['bb_fastball', 'ml_160', 'hof_makyu', 'hi_100mile']) has(id, 'pitch');
  for (const id of ['bb_homerun', 'tn_ball']) not(id, 'pitch');
  assert.deepEqual(abilityTags('no_such_skill'), []);
  assert.deepEqual(abilityTags('@atk'), []);
});

// ───────────── 3. 戦いで 数える ─────────────
function hero(id, job) {
  const c = newCharacter({ id, name: id, job: 'warrior' });
  gainExp(c, expForLevel(40));
  c.job = job;
  c.jobs = { ...c.jobs, [job]: { lv: 10, b: 0 } };
  fullHeal(c);
  return c;
}
function setup({ kinds = ['player'], crit = false } = {}) {
  const chars = kinds.map((k, i) => hero('p' + i, 'warrior'));
  const rng = makeRng(51);
  if (crit) rng.chance = () => true;
  const b = new Battle({ rng, allies: chars.map((c, i) => ({ char: c, controller: 's' + i, kind: kinds[i] })), enemies: ['rockman'], canFlee: true });
  for (const e of b.enemies) {
    e.actions = [{ w: 1, id: 'm_nothing' }];
    e.hp = e.maxHp = 999999;
    e.dfn = 0;
    e.resist = {};
  }
  for (const a of b.allies) a.mp = a.maxMp = 9999;
  b.rollHirameki = () => null;
  return b;
}
function act(b, u, cmd) {
  b.queue = [];
  if (cmd.type === 'ability' && !u.abilities.includes(cmd.id)) u.abilities.push(cmd.id);
  b.enqueue(u, { target: b.enemies[0].id, ...cmd });
  b.executeNext();
  b.lock = 0;
  return b.flush().filter((e) => e.t === 'act').pop();
}

test('戦い: 技の タグの 回数・ダメージ・呪文・炎（家族の キャラだけ）', () => {
  const b = setup({ kinds: ['player', 'support', 'monster'] });
  const [me, sup, mon] = b.allies;
  const hp0 = b.enemies[0].hp;
  act(b, me, { type: 'ability', id: 'go_pistol' });
  assert.equal(me.feat.use.gomu, 1);
  const d1 = hp0 - b.enemies[0].hp;
  assert.ok(d1 > 0);
  assert.equal(me.feat.dmg, d1, 'ダメージの 合計');
  assert.equal(me.feat.dmgSpell, 0);
  // メラ: 呪文・炎・攻撃の 呪文
  const hp1 = b.enemies[0].hp;
  act(b, me, { type: 'ability', id: 'mera' });
  const d2 = hp1 - b.enemies[0].hp;
  assert.ok(d2 > 0);
  assert.equal(me.feat.use.attackSpell, 1);
  assert.equal(me.feat.dmgSpell, d2);
  assert.equal(me.feat.dmgFire, d2);
  assert.equal(me.feat.dmg, d1 + d2);
  // ふつうの 攻撃は タグなし（ダメージは 入る）
  act(b, me, { type: 'attack' });
  assert.ok(me.feat.dmg > d1 + d2);
  assert.deepEqual(Object.keys(me.feat.use).sort(), ['attackSpell', 'gomu']);
  // 仲間（人・魔物）は 数えない
  act(b, sup, { type: 'ability', id: 'go_pistol' });
  act(b, mon, { type: 'attack' });
  assert.equal(sup.feat, undefined);
  assert.equal(mon.feat, undefined);
  // 敵の 行動も 数えない
  for (const e of b.enemies) assert.equal(e.feat, undefined);
});

test('戦い: 会心の一撃・1回で 5000以上', () => {
  const b = setup({ crit: true });
  const [me] = b.allies;
  me.atk = 30000;
  act(b, me, { type: 'attack' });
  assert.equal(me.feat.crit, 1);
  assert.equal(me.feat.big5000, 1);
  me.atk = 50;
  act(b, me, { type: 'attack' });
  assert.equal(me.feat.crit, 2);
  assert.equal(me.feat.big5000, 1, '小さい ダメージは 数えない');
});

test('戦い: 回復量は 自分の 技・呪文で へっていた ぶんだけ（道具は 入らない）', () => {
  const b = setup({ kinds: ['player', 'player'] });
  const [me, mate] = b.allies;
  mate.hp = 1;
  act(b, me, { type: 'ability', id: 'hoimi', target: mate.id });
  const healed = mate.hp - 1;
  assert.ok(healed > 0);
  assert.equal(me.feat.heal, healed);
  assert.equal(me.feat.use.healSpell, 1);
  assert.equal(me.feat.use.support, 1);
  // まんたんの 人への 回復は 0
  mate.hp = mate.maxHp;
  act(b, me, { type: 'ability', id: 'hoimi', target: mate.id });
  assert.equal(me.feat.heal, healed);
  // 薬草（道具）は 入らない
  mate.hp = 1;
  act(b, me, { type: 'item', id: 'herb', target: mate.id });
  assert.ok(mate.hp > 1);
  assert.equal(me.feat.heal, healed);
});

// ───────────── 4. 世界: 戦いの おわり・セーブ・データ合わせ・引っこし ─────────────
async function solo(seed = 51) {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, 'ユイ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  return { world, bot, c };
}

test('戦いの おわりで キャラの c.feats に 足す（自分だけ。仲間は 足さない）・幻の職業の 知らせ', async () => {
  const { world, bot, c } = await solo();
  const posts = [];
  world.boardPost = (m) => posts.push(m);
  recruitNpc(world, bot.s, 'npc_gard', { force: true });
  afterRosterChange(world, bot.s);
  const gard = partyOf(world, bot.s).supports.find((x) => x.key === 'npc_gard').char;
  // ニカを きわめている（条件が 見える）
  c.jobs.nika = { lv: JOB_MAX_LEVEL, b: 999 };
  bot.s.map = 'overworld';
  const ctx = startFieldBattle(world, bot.s, { id: 'xx', sp: 'golem', group: ['golem'], zone: 'outskirts', table: 'outskirts', busy: false });
  const b = ctx.battle;
  b.rollHirameki = () => null;
  const me = b.allies.find((a) => ctx.actorMap[a.id]?.type === 'human');
  const sup = b.allies.find((a) => ctx.actorMap[a.id]?.type === 'support');
  for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 99999; e.dfn = 0; e.resist = {}; e.metal = false; }
  me.mp = 999;
  sup.mp = 999;
  act(b, me, { type: 'ability', id: 'go_pistol' });
  act(b, me, { type: 'ability', id: 'go_pistol' });
  act(b, sup, { type: 'ability', id: 'go_pistol' });
  const dealt = me.feat.dmg;
  assert.ok(dealt > 0);
  for (const e of b.enemies) { e.hp = 0; e.alive = false; b.killed.push(e.species); }
  b.checkEnd();
  for (let i = 0; i < 300 && world.battles.size; i++) await tickN(world, 1);
  assert.equal(c.feats.use.gomu, 2);
  assert.equal(c.feats.dmg, dealt);
  assert.equal(gard.feats, undefined, '仲間は 数えない');
  // 条件が 見えた: 1回だけ 知らせる（掲示板にも）
  const end = bot.msgs.filter((m) => m.t === 'battleEnd').pop();
  assert.ok(end.lines.some((l) => l.includes('幻の職業「海賊王」の条件を見つけた')), end.lines.join('/'));
  assert.equal(posts.length, 1);
  assert.deepEqual({ ...posts[0], detail: undefined }, { kind: 'phantom_reveal', by: c.name, charId: c.id, job: 'pirate_king', text: `${c.name}が、幻の職業「海賊王」の条件を見つけた！`, detail: undefined });
  assert.match(posts[0].detail, /ゴムゴムの技を500回使う/);
  assert.deepEqual(phantomAfterBattle(world, c), [], '2回めは 知らせない');
  assert.equal(posts.length, 1);
  // 掲示板が ない・こわれていても 止まらない
  delete world.boardPost;
  c.jobs.hiten = { lv: JOB_MAX_LEVEL, b: 999 };
  assert.equal(phantomAfterBattle(world, c).length, 1);
  world.boardPost = () => { throw new Error('x'); };
  c.jobs.creator = { lv: JOB_MAX_LEVEL, b: 999 };
  assert.equal(phantomAfterBattle(world, c).length, 2, '天才しせつ管理者AI・はかいと創造の神');
});

test('セーブ: c.feats を ととのえる（こわれた 数・みじかい 形・知らない タグも のこす）', () => {
  const c = hero('s1', 'warrior');
  c.feats = { use: { gomu: 12.7, sword: -3, bad: 'x', future_tag: 4, 'あ': 3 }, dmg: '9', heal: 300, crit: NaN, big5000: 2, rv: 3, junk: 1 };
  repairChar(c);
  assert.deepEqual(c.feats, { use: { gomu: 12, future_tag: 4 }, dmg: 0, dmgSpell: 0, dmgFire: 0, heal: 300, crit: 0, big5000: 2, rv: 3 });
  const again = JSON.parse(JSON.stringify(c));
  repairChar(again);
  assert.deepEqual(again.feats, c.feats, '何回 ととのえても おなじ');
  // 記録の ない 人は そのまま（つくらない）
  const n = hero('s2', 'warrior');
  repairChar(n);
  assert.equal(n.feats, undefined);
  // みじかい 形（引っこしの 古い 読みかたで のこった とき）
  const s = hero('s3', 'warrior');
  s.feats = packFeats({ use: { kame: 30 }, dmg: 123456 });
  repairChar(s);
  assert.equal(s.feats.use.kame, 30);
  assert.equal(s.feats.dmg, 123456);
  // 魔物は もたない
  const m = { id: 'm1', name: 'ぷるりん', species: 'slime', feats: { dmg: 3 } };
  repairFeats(m);
  assert.equal(m.feats, undefined);
});

test('データ合わせ: 両方で ふえた ぶんを たす（どちらの 数より 下に しない）・見つけた しるしは 両方', () => {
  const base = { use: { gomu: 10 }, dmg: 1000, rv: 1 };
  const ours = { use: { gomu: 15, sword: 2 }, dmg: 1500, crit: 3, rv: 1 };
  const theirs = { use: { gomu: 30 }, dmg: 1200, heal: 50, rv: 4 };
  const m = mergeFeats(base, ours, theirs);
  assert.equal(m.use.gomu, 35);
  assert.equal(m.use.sword, 2);
  assert.equal(m.dmg, 1700);
  assert.equal(m.crit, 3);
  assert.equal(m.heal, 50);
  assert.equal(m.rv, 5);
  // 前が わからない（はじめての 合わせ）: 多い ほう いじょう
  const m2 = mergeFeats(undefined, ours, theirs);
  assert.ok(m2.use.gomu >= 30 && m2.dmg >= 1500);
  assert.equal(mergeFeats(undefined, undefined, undefined), undefined);
  // キャラの データ合わせ（world/merge.js の mergeChars）
  const b = hero('mg', 'warrior');
  b.feats = toFeats(base);
  const a = JSON.parse(JSON.stringify(b));
  const t = JSON.parse(JSON.stringify(b));
  addFeats(a, { use: { gomu: 5 }, dmg: 500 });
  addFeats(t, { use: { gomu: 20, pitch: 1 }, dmg: 200, big5000: 1 });
  t.lastPlayed = (a.lastPlayed || 0) + 10;
  const out = mergeChars(b, a, t);
  const mc = out.char || out;
  assert.equal(mc.feats.use.gomu, 35);
  assert.equal(mc.feats.use.pitch, 1);
  assert.equal(mc.feats.dmg, 1700);
  assert.equal(mc.feats.big5000, 1);
});

const FULL = () => ({
  use: Object.fromEntries(PHANTOM_TAGS.map((t, i) => [t, 1234567 + i])),
  dmg: 987654321, dmgSpell: 87654321, dmgFire: 7654321, heal: 6543210, crit: 54321, big5000: 4321, rv: 4095, ok: 4095,
});

test('引っこしコード: 記録が もとどおり（KIZUNA-2・KIZUNA-3 の みじかい 形）', () => {
  const c = hero('t1', 'warrior');
  c.feats = toFeats(FULL());
  const s = packFeats(c.feats);
  assert.ok(s.length < 170, `みじかい 形 ${s.length}文字`);
  assert.deepEqual(unpackFeats(s), c.feats);
  const r = parseCode(exportCode(JSON.parse(JSON.stringify(c))));
  assert.ok(r.ok, r.reason);
  assert.deepEqual(r.char.feats, c.feats);
  // KIZUNA-3 の 形（slimChar → unslimChar）
  c.companions = [];
  const slim = slimChar(c);
  assert.equal(typeof slim.feats, 'string');
  assert.equal(typeof c.feats, 'object', 'もとの キャラは かえない');
  const back = unslimChar(JSON.parse(JSON.stringify(slim)));
  assert.deepEqual(back.feats, c.feats);
});

test('引っこしコード: 仲間 40人と 記録 いっぱいでも LINE の 1回（入らない ときは KIZUNA-4。読むと もとどおり）', async () => {
  const { world, bot, c } = await solo(27);
  c.flags.monster_bond = true;
  for (const f of STORY_STEPS) c.flags[f] = true;
  for (const id of Object.keys(ITEMS).slice(0, 60)) addItem(c, id, 9);
  gainExp(c, expForLevel(40) - c.exp);
  for (const m of Object.keys(MONSTERS)) { c.kills[m] = 99; noteSeen(c, m); }
  for (let i = 0; i < 80; i++) c.chests['chest' + i] = true;
  for (const id of ['npc_gard', 'npc_mina', 'npc_rin', 'npc_tina', 'npc_luca']) recruitNpc(world, bot.s, id, { join: false });
  for (const sp of Object.keys(MONSTERS)) {
    if (c.companions.length >= ROSTER_MAX) break;
    addMonsterEntry(c, sp, 40);
  }
  assert.equal(c.companions.length, 40);
  c.flags.zz_count = 3;
  const before = exportCode(c);
  assert.ok(before.startsWith('KIZUNA-3-'), '記録なしは 今までどおり KIZUNA-3');
  c.feats = toFeats(FULL());
  const code = exportCode(c);
  assert.ok(code.length < LINE_MAX, `コードの 長さ ${code.length}（記録なし ${before.length}）`);
  assert.ok(/^KIZUNA-[34]-/.test(code));
  const r = parseCode(code);
  assert.ok(r.ok, r.reason);
  const want = repairChar(JSON.parse(JSON.stringify(c)));
  for (const k of ['feats', 'flags', 'chests', 'bestiary', 'kills', 'companions']) assert.deepEqual(r.char[k], want[k], k);
  // KIZUNA-4 の 形は いつも もとどおりに 読める（今の 長さに よらず）
  const s4 = slimChar4(c);
  assert.ok(Array.isArray(s4.flags) && Array.isArray(s4.chests) && Array.isArray(s4.bestiary));
  const back = unslimChar4(JSON.parse(JSON.stringify(s4)));
  for (const k of ['feats', 'flags', 'chests', 'bestiary', 'kills']) assert.deepEqual(back[k], want[k], k);
  assert.ok(JSON.stringify(s4).length < JSON.stringify(slimChar(c)).length - 1000, 'KIZUNA-4 は KIZUNA-3 より みじかい');
});

// ───────────── 5. なれる しくみ・幻の書 ─────────────
// ためしの 幻の職業（C1 の 海賊王が まだ ない ときだけ 入れる）
const FAKE = !JOBS.pirate_king;
if (FAKE) {
  JOBS.pirate_king = { ...JOBS.nika, id: 'pirate_king', name: '海賊王', kana: 'かいぞくおう', short: '海賊王', tier: 4, req: ['nika', 'pirate'], reqSuper: undefined, learn: [[1, 'go_pistol']] };
}

test('なれる しくみ: 2つを きわめて やりこみの 条件も（片方で 条件が 見える）', () => {
  const c = hero('u1', 'warrior');
  assert.equal(jobKnown(c, 'pirate_king'), false);
  assert.equal(phantomSeen(c, 'pirate_king'), false);
  c.jobs.nika = { lv: JOB_MAX_LEVEL, b: 999 };
  assert.equal(jobKnown(c, 'pirate_king'), true, '片方を きわめると 見える');
  assert.equal(phantomSeen(c, 'pirate_king'), true);
  assert.equal(jobUnlocked(c, 'pirate_king'), false);
  c.jobs.pirate = { lv: JOB_MAX_LEVEL, b: 999 };
  assert.equal(jobUnlocked(c, 'pirate_king'), false, '条件が まだ');
  assert.equal(phantomReady(c, 'pirate_king'), false);
  addFeats(c, { use: { gomu: 499 }, dmg: 200000 });
  assert.equal(condNow(c, PHANTOM_JOBS.pirate_king.conds[0]), 499);
  assert.equal(jobUnlocked(c, 'pirate_king'), false);
  addFeats(c, { use: { gomu: 1 } });
  assert.equal(phantomCondsMet(c, 'pirate_king'), true);
  assert.equal(jobUnlocked(c, 'pirate_king'), true);
  assert.equal(phantomReady(c, 'pirate_king'), true);
  // 条件だけ そろっても、2つ きわめて いないと なれない
  const d = hero('u2', 'warrior');
  d.feats = toFeats({ use: { gomu: 999 }, dmg: 999999 });
  d.jobs.nika = { lv: JOB_MAX_LEVEL, b: 999 };
  assert.equal(jobUnlocked(d, 'pirate_king'), false);
  assert.equal(changeJob(d, 'pirate_king').locked, true);
  // 合体した 条件（雷の呪文＋かめはめ波）
  const e = hero('u3', 'warrior');
  addFeats(e, { use: { thunderSpell: 100, kame: 200 } });
  assert.equal(condNow(e, PHANTOM_JOBS.super_hero.conds[0]), 300);
});

test('転職: 神殿で 幻の職業に なる・はじめての 時だけ 掲示板（phantom_get）・まだの 時は 条件も 出す', async () => {
  const { world, bot, c } = await solo(52);
  const posts = [];
  world.boardPost = (m) => posts.push(m);
  const svc = (msg) => {
    bot.send({ t: 'svc', ...msg });
    return bot.msgs.filter((m) => m.t === 'svcRes').pop();
  };
  bot.s.busy = { kind: 'svc' };
  c.jobs.nika = { lv: JOB_MAX_LEVEL, b: 999 };
  c.jobs.pirate = { lv: JOB_MAX_LEVEL, b: 999 };
  let r = svc({ kind: 'jobChange', job: 'pirate_king' });
  assert.equal(r.ok, false);
  assert.match(r.text, /ゴムゴムの技を500回使う/);
  assert.deepEqual(checkTextOk(r.text), []);
  addFeats(c, { use: { gomu: 500 }, dmg: 200000 });
  r = svc({ kind: 'jobChange', job: 'pirate_king' });
  assert.equal(r.ok, true, r.text);
  assert.equal(c.job, 'pirate_king');
  assert.equal(posts.length, 1);
  assert.equal(posts[0].kind, 'phantom_get');
  assert.equal(posts[0].job, 'pirate_king');
  assert.equal(posts[0].charId, c.id);
  assert.equal(posts[0].text, `${c.name}が、幻の職業「海賊王」になった！`);
  assert.match(posts[0].detail, /ニカと海賊をきわめる/);
  // もう一度 なっても のせない
  svc({ kind: 'jobChange', job: 'warrior' });
  r = svc({ kind: 'jobChange', job: 'pirate_king' });
  assert.equal(r.ok, true);
  assert.equal(posts.length, 1);
  // 掲示板が なくても 転職できる
  delete world.boardPost;
  phantomGot(world, c, 'pirate_king');
});
const checkTextOk = (s) => (/[ 　](?=[぀-ヿ一-鿿])/.test(s.replace(/\n/g, '')) ? ['space'] : []);

test('なれるように なった 知らせ（戦いの おわり。1回だけ）', () => {
  const c = hero('n1', 'warrior');
  c.jobs.nika = { lv: JOB_MAX_LEVEL, b: 999 };
  c.jobs.pirate = { lv: JOB_MAX_LEVEL, b: 999 };
  addFeats(c, { use: { gomu: 500 }, dmg: 200000 });
  const notes = phantomAfterBattle(null, c);
  assert.ok(notes.some((l) => l.includes('幻の職業「海賊王」になれるようになった')), notes.join('/'));
  assert.ok(!phantomAfterBattle(null, c).some((l) => l.includes('なれるように')), '2回めは 出さない');
});

test('幻の書: はじめは ？？？・片方を きわめると 名前と 条件（✔ と メーター）', () => {
  const c = hero('b1', 'warrior');
  let rows = phantomBook(c);
  assert.equal(rows.length, 12);
  assert.ok(rows.every((r) => !r.known && r.name === '？？？' && !r.conds.length && !r.masters.length));
  c.jobs.creator = { lv: JOB_MAX_LEVEL, b: 999 };
  c.jobs.hakaishin = { lv: 3, b: 10 };
  addFeats(c, { use: { support: 40 }, heal: 90000, big5000: 7 });
  rows = phantomBook(c);
  const ai = rows.find((r) => r.id === 'facility_ai');
  const god = rows.find((r) => r.id === 'chaos_creator');
  assert.equal(ai.known, true);
  assert.equal(ai.name, '天才しせつ管理者AI');
  assert.deepEqual(ai.masters.map((m) => [m.id, m.done]), [['facility_genius', false], ['creator', true]]);
  assert.deepEqual(ai.conds.map((x) => [x.now, x.goal, x.done]), [[40, 1500, false], [50000, 50000, true]], 'メーターは めざす 数で 止める');
  assert.deepEqual(god.conds.map((x) => [x.now, x.goal]), [[7, 50]]);
  assert.equal(god.masters[0].name, 'はかい神');
  assert.equal(rows.filter((r) => r.known).length, 2);
  assert.equal(rows.find((r) => r.id === 'pirate_king').name, '？？？');
  // うわさ: きわめておく 職業を はじめた ときだけ（はかい神を はじめても、もう 見えて いる 物は 出さない）
  assert.deepEqual(phantomRumors(c), []);
  c.jobs.harry = { lv: 2, b: 3 };
  assert.deepEqual(phantomRumors(c), [JOB_HINTS.grand_magus]);
  // 天候の神（天候をあやつる者が まだ ない とき）も 名前が 出る
  c.jobs.summoner = { lv: JOB_MAX_LEVEL, b: 999 };
  const wg = phantomBook(c).find((r) => r.id === 'weather_god');
  assert.equal(wg.masters[0].name, JOBS.tenkou_tsukai ? JOBS.tenkou_tsukai.name : '天候をあやつる者');
});

test('記録の 入れもの: newFeat は 0 から', () => {
  assert.deepEqual(newFeat(), { use: {}, dmg: 0, dmgSpell: 0, dmgFire: 0, heal: 0, crit: 0, big5000: 0 });
  for (const k of FEAT_STATS) assert.equal(newFeat()[k], 0);
  assert.equal(FAKE ? JOBS.pirate_king.tier : 4, 4);
});
