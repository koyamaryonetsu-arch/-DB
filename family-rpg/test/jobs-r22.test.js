// 2026年10月（第22回）の 新しい 職業
//  おかん → 最強のおかん、会社員 → 社ちく → ブラックきぎょうの星、天才しせつ管理者（伝説）、はかい神（伝説）
//  新しい こうか: HPが 少ないほど 強い（grit）・サービス残業（overtime）・はかい（destroy）・見える化（scan）・予兆保全（foresee）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  JOBS, JOB_ORDER, ADVANCED_ORDER, SUPER_ORDER, LEGEND_ORDER, ALL_JOBS, JOB_MAX_LEVEL, JOB_HINTS, jobReqText,
} from '../public/js/shared/data/jobs.js';
import { ABILITIES, abilityRole, ELEMENT_ORDER } from '../public/js/shared/data/abilities.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { SHOPS } from '../public/js/shared/data/shops.js';
import { newCharacter, changeJob, jobUnlocked, jobKnown, gainExp, expForLevel, fullHeal, learnedAbilities } from '../public/js/shared/stats.js';
import { Battle, gritMult } from '../public/js/shared/battle.js';
import { decideAlly, decideMonster } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { checkText } from '../tools/kanji-check.mjs';

const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };
const NEW = ['okan', 'saikyo_okan', 'shachiku', 'black_star', 'facility_genius', 'hakaishin'];
const NEW_ITEMS = ['slipper', 'leopard_shirt'];
const tierOf = (j) => JOBS[j].tier || 0;

// その 職業の キャラ（敵は なにも しない）。opts.lucky … 確率の こうかが かならず 決まる
function setup(job, enemies = ['rockman'], { lucky = false, seed = 1, prep, mateJob = 'priest' } = {}) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job: 'warrior' });
  gainExp(c, expForLevel(40));
  master(c, job);
  c.job = job;
  if (prep) prep(c);
  fullHeal(c);
  const mate = newCharacter({ id: 'm1', name: 'ミナ', job: 'priest' });
  gainExp(mate, expForLevel(30));
  if (mateJob !== 'priest') { master(mate, mateJob); mate.job = mateJob; }
  fullHeal(mate);
  const rng = makeRng(seed);
  if (lucky) rng.chance = () => true;
  const b = new Battle({ rng, allies: [{ char: c, controller: 's1' }, { char: mate, auto: true, kind: 'support' }], enemies, canFlee: true });
  for (const e of b.enemies) e.actions = [{ w: 1, id: 'm_nothing' }];
  return { b, c, me: b.allies[0], mate: b.allies[1] };
}
const use = (b, actor, id, target, pow = 1) => {
  const ev = { lines: [], upd: [] };
  b.applyAbility(actor, ABILITIES[id], { target }, ev, pow);
  return ev;
};
const masterChain = (c, jid) => {
  for (const r of JOBS[jid].req || []) { master(c, r); masterChain(c, r); }
};

test('第22回の 職業: ならびと なる じょうけん', () => {
  assert.ok(JOB_ORDER.includes('okan'), 'おかんは 基本職');
  for (const j of ['saikyo_okan', 'shachiku']) assert.ok(ADVANCED_ORDER.includes(j), `${j} は 上級職`);
  assert.ok(SUPER_ORDER.includes('black_star'), 'ブラックきぎょうの星は 超級職');
  for (const j of ['facility_genius', 'hakaishin']) assert.ok(LEGEND_ORDER.includes(j), `${j} は 伝説の職業`);
  assert.deepEqual(JOBS.saikyo_okan.req, ['okan']);
  assert.deepEqual(JOBS.shachiku.req, ['salaryman']);
  assert.deepEqual(JOBS.black_star.req, ['shachiku']);
  assert.deepEqual(JOBS.facility_genius.req, ['ryonetsu']);
  assert.equal(JOBS.facility_genius.reqSuper, 1);
  assert.deepEqual(JOBS.hakaishin.req, ['maou', 'god_hand']);
  assert.equal(JOBS.facility_genius.name, '天才しせつ管理者');
  assert.equal(JOBS.hakaishin.name, 'はかい神');
  assert.equal(JOBS.shachiku.name, '社ちく');
  assert.equal(JOBS.black_star.name, 'ブラックきぎょうの星');
  assert.match(jobReqText('facility_genius'), /ryonetsuLv10＋ほかの超級職1つLv10/);
  assert.match(jobReqText('hakaishin'), /魔王Lv10＋ゴッドハンドLv10/);
  for (const j of [...SUPER_ORDER, ...LEGEND_ORDER]) assert.ok(JOB_HINTS[j], `${j} の うわさ`);

  // おかん: はじめから えらべる → 最強のおかん
  const o = newCharacter({ id: 'o', name: 'かあさん', job: 'okan' });
  assert.equal(o.job, 'okan', '基本職なので はじめから');
  assert.equal(o.equip.weapon, 'ladle', 'おたまを 持って 旅立つ');
  assert.equal(jobUnlocked(o, 'saikyo_okan'), false);
  master(o, 'okan');
  assert.equal(jobUnlocked(o, 'saikyo_okan'), true);
  // 社ちく: 会社員 → 社ちく → ブラックきぎょうの星
  const s = newCharacter({ id: 's', name: 'たなか', job: 'salaryman' });
  master(s, 'salaryman');
  assert.equal(jobUnlocked(s, 'shachiku'), true);
  master(s, 'shachiku');
  assert.equal(jobKnown(s, 'black_star'), true, '社ちくを きわめると うわさ');
  assert.equal(jobUnlocked(s, 'black_star'), true);
  // 天才しせつ管理者: ryonetsu と ほかの 超級職 1つ
  const g = newCharacter({ id: 'g', name: 'こやま', job: 'salaryman' });
  master(g, 'ryonetsu');
  assert.equal(jobKnown(g, 'facility_genius'), true);
  assert.equal(jobUnlocked(g, 'facility_genius'), false, 'ryonetsu だけでは まだ');
  master(g, 'black_star');
  assert.equal(jobUnlocked(g, 'facility_genius'), true, 'ほかの 超級職 1つで なれる');
  assert.equal(changeJob(g, 'facility_genius').ok, true);
  // はかい神: 魔王 と ゴッドハンド
  const h = newCharacter({ id: 'h', name: 'ビル', job: 'warrior' });
  master(h, 'maou');
  assert.equal(jobUnlocked(h, 'hakaishin'), false);
  master(h, 'god_hand');
  assert.equal(jobUnlocked(h, 'hakaishin'), true);
});

test('第22回の 職業: 技の 数・ねらい・文字・強さの かたむき・道具', () => {
  const SCOPE = {
    enemy: /敵1体/, group: /同じ種類の敵/, enemies: /敵全体|敵にランダム/, ally: /仲間1人/, allies: /仲間全員/, self: /自分|起こる|運しだい/, deadAlly: /仲間1人/,
  };
  const sum = (j) => Object.values(JOBS[j].mods).reduce((a, b) => a + b, 0);
  const OLD = ALL_JOBS.filter((o) => !NEW.includes(o));
  for (const j of NEW) {
    const job = JOBS[j];
    for (const s of [job.name, job.desc, JOB_HINTS[j] || '']) assert.deepEqual(checkText(s), [], `${j}: ${s}`);
    assert.ok(job.weapons.length >= 2 && job.armor.includes('cloth'), j);
    const lvs = job.learn.map(([l]) => l);
    assert.deepEqual(lvs, [...lvs].sort((a, b) => a - b), `${j}: レベルの じゅん`);
    assert.equal(lvs[0], 1);
    assert.equal(lvs[lvs.length - 1], 10);
    const mps = job.learn.map(([, id]) => ABILITIES[id].mp);
    assert.equal(Math.max(...mps), mps[mps.length - 1], `${j}: Lv10 の 技が いちばん MPを 使う`);
    const atk = job.learn.filter(([, id]) => abilityRole(ABILITIES[id]) === 'dmg').length;
    assert.ok(atk >= (tierOf(j) === 0 ? 3 : 2), `${j}: 攻撃技 ${atk}こ`);
    for (const [, id] of job.learn) {
      const a = ABILITIES[id];
      assert.ok(a, `${j}: ${id}`);
      assert.equal(a.job, j, `${id} の job`);
      assert.ok(a.desc && a.cast && a.anim && a.kana, `${id} の 文`);
      assert.match(a.desc, SCOPE[a.target], `${id}（${a.target}）の せつめい: ${a.desc}`);
      for (const s of [a.name, a.desc, a.cast]) assert.deepEqual(checkText(s), [], `${id}: ${s}`);
      assert.deepEqual(checkText(a.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
      if (a.effect.type === 'random') {
        for (const o of a.effect.options) {
          assert.ok(ABILITIES[o]?.hidden, o);
          assert.deepEqual(checkText(ABILITIES[o].cast), [], o);
        }
      }
    }
    // つよさの 倍率の 合計は 同じ ランクの ほかの 職業の はんい（伝説の職業は 超級職より 上）
    if (tierOf(j) < 3) {
      const same = OLD.filter((o) => tierOf(o) === tierOf(j)).map(sum);
      assert.ok(sum(j) >= Math.min(...same) - 1e-9 && sum(j) <= Math.max(...same) + 1e-9, `${j}: 倍率の 合計 ${sum(j).toFixed(2)}`);
    } else {
      const sup = OLD.filter((o) => tierOf(o) === 2).map(sum);
      assert.ok(sum(j) > Math.max(...sup), `${j}: 伝説の職業は 超級職より 強い`);
    }
  }
  // 技の 名前は ほかの 技と かぶらない
  const names = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (!a.hidden && a.kind === 'skill') names.set(a.name, [...(names.get(a.name) || []), id]);
  for (const j of NEW) for (const [, id] of JOBS[j].learn) assert.equal(names.get(ABILITIES[id].name).length, 1, `${ABILITIES[id].name} が ほかの 技と おなじ 名前`);
  // 新しい 道具: お店で 買える・きたえられる・文字
  const sold = new Set(Object.values(SHOPS).flatMap((s) => [...(s.items || []), ...(s.more || []).flatMap((m) => m.items)]));
  for (const id of NEW_ITEMS) {
    const it = ITEMS[id];
    assert.ok(it, id);
    assert.ok(sold.has(id), `${id} は お店で 買える`);
    if (it.type === 'weapon') assert.ok(ITEMS[`${id}+1`], `${id} は きたえられる`);
    for (const s of [it.name, it.desc]) assert.deepEqual(checkText(s), [], `${id}: ${s}`);
  }
});

test('社ちく: HPが 少ないほど 攻撃が 強い（ほかの 職業は かわらない）', () => {
  const { b, me } = setup('shachiku', ['rockman']);
  const e = b.enemies[0];
  const full = b.calcPhys(me, e, { mult: 2 }, 1, 'phys', true).dmg;
  assert.equal(gritMult(me), 1);
  me.hp = Math.max(1, Math.round(me.maxHp * 0.1));
  const low = b.calcPhys(me, e, { mult: 2 }, 1, 'phys', true).dmg;
  assert.ok(low > full * 1.3, `HPが 少ないと 強い ${full} → ${low}`);
  assert.ok(gritMult(me) > 1.4 && gritMult(me) <= 1.5);
  // ブラックきぎょうの星は もっと 強く なる
  const bk = setup('black_star', ['rockman']).me;
  bk.hp = Math.max(1, Math.round(bk.maxHp * 0.1));
  assert.ok(gritMult(bk) > gritMult(me));
  // 戦士は HPが へっても かわらない
  const w = setup('warrior', ['rockman']).me;
  w.hp = 1;
  assert.equal(gritMult(w), 1);
});

test('サービス残業: HPを けずって すぐに もう一度 動ける（HPは 1より へらない）', () => {
  const { b, me } = setup('shachiku', ['rockman']);
  for (let i = 0; i < 600 && !me.ready; i++) b.tick(50);
  const hp0 = me.hp;
  assert.equal(b.command(me.id, { type: 'ability', id: 'sk_zangyou' }, 's1').ok, true);
  const evs = [];
  for (let i = 0; i < 200 && !evs.some((e) => e.t === 'act' && e.id === me.id); i++) evs.push(...b.tick(50));
  const act = evs.find((e) => e.t === 'act' && e.id === me.id);
  assert.ok(act, 'サービス残業を した');
  assert.ok(me.hp < hp0, `HPが へった ${hp0} → ${me.hp}`);
  assert.ok(act.lines.some((l) => l.includes('次の仕事')), act.lines.join(' / '));
  // すぐに また 自分の 番
  let ready = false;
  for (let i = 0; i < 40 && !ready; i++) { b.tick(50); ready = me.ready; }
  assert.ok(ready, 'すぐに 次の 番が 来る');
  // 何回 やっても たおれない。HPが 1 なら もう すぐには 動けない（ただで 何回も 動けない）
  me.hp = 2;
  for (let i = 0; i < 5; i++) use(b, me, 'sk_zangyou');
  assert.ok(me.alive && me.hp === 1);
  const tired = use(b, me, 'sk_zangyou');
  assert.equal(tired.atbAfter, undefined, 'HPが 1 では すぐに 動けない');
  assert.ok(tired.lines.some((l) => l.includes('へとへと')), tired.lines.join(' / '));
  for (const l of tired.lines) assert.deepEqual(checkText(l), [], l);
  assert.ok(ABILITIES.sk_zangyou.noAuto && ABILITIES.bk_kyujitsu.noAuto, 'オートでは 使わない');
});

test('はかい: 敵を 消し去る（たおした ことに なる）。ボスと メタルには 効かず、大きな ダメージ', () => {
  const { b, me } = setup('hakaishin', ['rockman', 'rockman'], { lucky: true });
  const e = b.enemies[0];
  const ev = use(b, me, 'hk_hakai', e.id);
  assert.equal(e.alive, false, '消えた');
  assert.ok(b.killed.includes(e.species), 'たおした ことに なる（経験値も 入る）');
  assert.ok(ev.lines.some((l) => l.includes('ちりとなって消えた')), ev.lines.join(' / '));
  // ボス: 消えないで ダメージ
  const bs = setup('hakaishin', ['dark_treant'], { lucky: true });
  const boss = bs.b.enemies[0];
  const hp0 = boss.hp;
  const ev2 = use(bs.b, bs.me, 'hk_hakai', boss.id);
  assert.ok(boss.alive, 'ボスは 消えない');
  assert.ok(boss.hp < hp0, 'かわりに ダメージ');
  assert.ok(ev2.lines.some((l) => l.includes('たえた')), ev2.lines.join(' / '));
  // メタル: 消えない
  const mt = setup('hakaishin', ['kirakira'], { lucky: true });
  use(mt.b, mt.me, 'hk_hakai', mt.b.enemies[0].id);
  assert.ok(mt.b.enemies[0].alive || mt.b.enemies[0].hp <= 1, 'メタルは 消し去れない');
  assert.equal(abilityRole(ABILITIES.hk_hakai), 'dmg', 'はかいは 攻撃技');
  // オートの はかい神も、ふつうの 攻撃では なかなか たおせない 敵には はかいを 使う（弱い 敵には MPを 使わない）
  let picked = 0, weak = 0;
  for (let seed = 1; seed <= 20; seed++) {
    const s = setup('hakaishin', ['rockman', 'rockman'], { seed });
    for (const e of s.b.enemies) { e.maxHp = 4000; e.hp = 4000; }
    s.me.abilities = ['hk_hakai'];
    s.me.mp = 999;
    if (decideAlly(s.b, s.me).id === 'hk_hakai') picked++;
    const w = setup('hakaishin', ['rockman'], { seed });
    w.b.enemies[0].hp = 5;
    w.me.abilities = ['hk_hakai'];
    w.me.mp = 999;
    if (decideAlly(w.b, w.me).id === 'hk_hakai') weak++;
  }
  assert.ok(picked >= 15, `かたい 敵に オートで はかい ${picked}/20`);
  assert.ok(weak <= 2, `弱い 敵には ふつうの 攻撃 ${weak}/20`);
});

test('見える化: 敵の 弱点と 効かない 属性が ぜんぶ わかる（図鑑にも のこる）', () => {
  const { b, me } = setup('facility_genius', ['rockman', 'skeleton']);
  const ev = use(b, me, 'fg_mieruka');
  for (const e of b.enemies) {
    for (const el of ELEMENT_ORDER) assert.ok(b.tried.has(`${e.species}|${el}`), `${e.species} ${el}`);
    assert.equal(ev.results.filter((r) => r.id === e.id && r.aff).length, ELEMENT_ORDER.length, `${e.species} の 画面に 出す ぶん`);
  }
  assert.ok(ev.lines.some((l) => l.includes('弱点')), ev.lines.join(' / '));
  for (const l of ev.lines) assert.deepEqual(checkText(l), [], l);
  assert.ok(b.enemies.every((e) => e.hp === e.maxHp), 'ダメージは ない');
});

test('予兆保全: 天才しせつ管理者が いると 敵の 大技の ダメージが へる', () => {
  const { b, mate } = setup('facility_genius', ['rockman']);
  const e = b.enemies[0];
  // ためてから 出す 技には big が つく
  e.telegraph = 'm_nothing';
  assert.equal(decideMonster(b, e).big, true);
  const hit = (big) => {
    mate.hp = mate.maxHp;
    const ev = { lines: [], upd: [], big };
    b.damage(e, mate, 100, ev);
    return { dmg: mate.maxHp - mate.hp, ev };
  };
  assert.equal(hit(false).dmg, 100, 'ふつうの 技は そのまま');
  const r = hit(true);
  assert.equal(r.dmg, 60, '大技は 6わり');
  assert.ok(r.ev.lines.some((l) => l.includes('予兆を見ぬいていた')), r.ev.lines.join(' / '));
  // 天才しせつ管理者が たおれていると へらない
  const g = b.allies[0];
  g.alive = false;
  g.hp = 0;
  assert.equal(hit(true).dmg, 100);
  // ほかの 職業では へらない
  const w = setup('warrior', ['rockman']);
  w.mate.hp = w.mate.maxHp;
  w.b.damage(w.b.enemies[0], w.mate, 100, { lines: [], upd: [], big: true });
  assert.equal(w.mate.maxHp - w.mate.hp, 100);
});

test('昼ね: HPが 全回復するが ねむって しまう', () => {
  const { b, me } = setup('hakaishin', ['rockman']);
  me.hp = 10;
  me.mp = 0;
  const ev = use(b, me, 'hk_hirune');
  assert.equal(me.hp, me.maxHp, 'HPが 全回復');
  assert.ok(me.mp > 0, 'MPも 回復');
  assert.ok(me.status.sleep, 'ねむった');
  assert.ok(ev.lines.some((l) => l.includes('ねむって')), ev.lines.join(' / '));
  assert.ok(ABILITIES.hk_hirune.noAuto);
});

test('運しだいの 技: 気まぐれ（パンチ・はかい・昼ね）', () => {
  const seen = new Set();
  for (let seed = 1; seed <= 40; seed++) {
    const { b, me } = setup('hakaishin', ['rockman'], { seed });
    const ev = use(b, me, 'hk_kimagure');
    seen.add(ev.sub);
  }
  assert.equal(seen.size, 3, [...seen].join('・'));
});

test('第22回の 職業の 技は ぜんぶ たたかいで 使える', () => {
  let used = 0;
  for (const jid of NEW) {
    const prep = (c) => {
      masterChain(c, jid);
      if (JOBS[jid].reqSuper) master(c, 'god_hand');
    };
    for (const [, aid] of JOBS[jid].learn) {
      const { b, c, me, mate } = setup(jid, ['rockman', 'rockman', 'skeleton'], { seed: used + 1, prep });
      assert.ok(jobUnlocked(c, jid), `${jid} に なれる`);
      assert.ok(learnedAbilities(c).includes(aid), `${jid}: ${aid} を 覚えている`);
      for (let i = 0; i < 600 && !me.ready; i++) b.tick(50);
      const a = ABILITIES[aid];
      if (a.target === 'deadAlly') { mate.alive = false; mate.hp = 0; }
      const target = ['ally', 'deadAlly'].includes(a.target) ? mate.id : b.enemies[0].id;
      const r = b.command(me.id, { type: 'ability', id: aid, target }, 's1');
      assert.equal(r.ok, true, `${jid}: ${aid} ${r.reason || ''}`);
      const evs = [];
      for (let i = 0; i < 200 && !evs.some((e) => e.t === 'act' && e.id === me.id); i++) evs.push(...b.tick(50));
      const act = evs.find((e) => e.t === 'act' && e.id === me.id);
      assert.ok(act, `${aid} が じっこう された`);
      for (const l of act.lines) assert.deepEqual(checkText(l), [], `${aid}: ${l}`);
      used++;
    }
  }
  assert.ok(used >= 40, `使った 技 ${used}`);
});
