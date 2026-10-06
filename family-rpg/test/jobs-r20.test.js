// 2026年10月の 職業の 追加と 技の 見なおし
//  ・料理人 → パティシエ → 三ツ星シェフ、アルバイト → 正社員 → たたき上げ社長、旅芸人（遊び人）→ お笑い芸人 → M-1王者、大賢者、ロトの勇者
//  ・どの 職業にも 攻撃技。補助の 強さは ランクで そろえる（基本職の 補助が 強すぎない）
//  ・新しい こうか（じわじわ回復・強さを 消す・いくつかの こうか・マダンテ・ミナデイン・回復魔力の 光・守りの 一撃）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  JOBS, JOB_ORDER, ADVANCED_ORDER, SUPER_ORDER, LEGEND_ORDER, ALL_JOBS, TIER_NAMES, JOB_MAX_LEVEL, JOB_HINTS, jobReqText, jobBattlesForLevel,
} from '../public/js/shared/data/jobs.js';
import { ABILITIES, abilityRole } from '../public/js/shared/data/abilities.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { SHOPS } from '../public/js/shared/data/shops.js';
import { newCharacter, changeJob, jobUnlocked, jobKnown, gainExp, expForLevel, fullHeal, learnedAbilities, penaltyFor, STARTER_EQUIP } from '../public/js/shared/stats.js';
import { Battle } from '../public/js/shared/battle.js';
import { decideAlly, prim } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { checkText } from '../tools/kanji-check.mjs';

const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };
const NEW = ['cook', 'patissier', 'star_chef', 'parttimer', 'seishain', 'tatakiage', 'comedian', 'm1_champion', 'daikenja', 'loto_hero'];
const tierOf = (j) => JOBS[j].tier || 0;

// その 職業の キャラ（敵は なにも しない）。opts.lucky … 確率の こうかが かならず 決まる
function setup(job, enemies = ['rockman'], { lucky = false, seed = 1, prep } = {}) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job: 'warrior' });
  gainExp(c, expForLevel(40));
  master(c, job);
  c.job = job;
  if (prep) prep(c);
  fullHeal(c);
  const mate = newCharacter({ id: 'm1', name: 'なかま', job: 'priest' });
  gainExp(mate, expForLevel(30));
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

test('新しい 職業: ならびと なる じょうけん（伝説の職業は 勇者＋ほかの 超級職 2つ）', () => {
  for (const j of ['cook', 'parttimer']) assert.ok(JOB_ORDER.includes(j), j);
  for (const j of ['patissier', 'seishain', 'comedian']) assert.ok(ADVANCED_ORDER.includes(j), j);
  for (const j of ['star_chef', 'tatakiage', 'm1_champion', 'daikenja']) assert.ok(SUPER_ORDER.includes(j), j);
  assert.deepEqual(LEGEND_ORDER, ['loto_hero']);
  assert.equal(TIER_NAMES[3], '伝説の職業');
  assert.equal(tierOf('loto_hero'), 3);
  assert.ok(jobBattlesForLevel(5, 3) > jobBattlesForLevel(5, 2), '伝説の 職業は 職業レベルが 上がりにくい');
  assert.deepEqual(JOBS.patissier.req, ['cook']);
  assert.deepEqual(JOBS.star_chef.req, ['patissier']);
  assert.deepEqual(JOBS.seishain.req, ['parttimer']);
  assert.deepEqual(JOBS.tatakiage.req, ['seishain']);
  assert.deepEqual(JOBS.comedian.req, ['performer']);
  assert.deepEqual(JOBS.comedian.reqAlt, [['jester']]);
  assert.deepEqual(JOBS.m1_champion.req, ['comedian']);
  assert.deepEqual(JOBS.daikenja.req, ['sage']);
  assert.match(jobReqText('loto_hero'), /勇者Lv10＋ほかの超級職2つLv10/);
  // 料理の 道: 料理人 → パティシエ → 三ツ星シェフ
  const c = newCharacter({ id: 'a', name: 'ミナ', job: 'cook' });
  assert.equal(c.job, 'cook', '基本職なので はじめから えらべる');
  assert.equal(c.equip.weapon, 'kitchen_knife', 'はじめの 武器は 包丁');
  assert.equal(STARTER_EQUIP.parttimer.weapon, 'mop');
  assert.equal(jobUnlocked(c, 'patissier'), false);
  master(c, 'cook');
  assert.equal(jobUnlocked(c, 'patissier'), true);
  assert.equal(jobKnown(c, 'star_chef'), false, '超級職は ヒントが 出るまで ひみつ');
  master(c, 'patissier');
  assert.equal(jobKnown(c, 'star_chef'), true);
  assert.equal(jobUnlocked(c, 'star_chef'), true);
  // お笑い芸人: 旅芸人か 遊び人
  const d = newCharacter({ id: 'b', name: 'リク', job: 'jester' });
  master(d, 'jester');
  assert.equal(jobUnlocked(d, 'comedian'), true, '遊び人だけでも なれる');
  // ロトの勇者: 勇者だけでは なれない
  const h = newCharacter({ id: 'h', name: 'ユウ', job: 'warrior' });
  master(h, 'hero');
  assert.equal(jobKnown(h, 'loto_hero'), true, '勇者を マスターすると ヒントが 出る');
  assert.equal(jobUnlocked(h, 'loto_hero'), false);
  master(h, 'sage');
  assert.equal(jobUnlocked(h, 'loto_hero'), false, '上級職は かぞえない');
  master(h, 'archmage');
  assert.equal(jobUnlocked(h, 'loto_hero'), false, '超級職 1つでは まだ');
  master(h, 'daikenja');
  assert.equal(jobUnlocked(h, 'loto_hero'), true, '勇者＋超級職 2つ');
  assert.equal(changeJob(h, 'loto_hero').ok, true);
  for (const j of [...SUPER_ORDER, ...LEGEND_ORDER]) assert.ok(JOB_HINTS[j], `${j} の うわさ`);
});

test('新しい 職業: 技の 数・ねらい・文字・強さの かたむき', () => {
  const SCOPE = {
    enemy: /敵1体/, group: /同じ種類の敵/, enemies: /敵全体|敵に(ランダム|3回)/, ally: /仲間1人/, allies: /仲間全員/, self: /自分|仲間全員への|起こる|運しだい/, deadAlly: /仲間1人/,
  };
  const sum = (j) => Object.values(JOBS[j].mods).reduce((a, b) => a + b, 0);
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
    for (const [, id] of job.learn) {
      const a = ABILITIES[id];
      assert.ok(a, `${j}: ${id}`);
      assert.equal(a.job, j, `${id} の job`);
      assert.ok(a.desc && a.cast && a.anim && a.kana, `${id} の 文`);
      assert.match(a.desc, SCOPE[a.target], `${id}（${a.target}）の せつめい: ${a.desc}`);
      for (const s of [a.name, a.desc, a.cast]) assert.deepEqual(checkText(s), [], `${id}: ${s}`);
      assert.deepEqual(checkText(a.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
      // ランダムの 技の 中みは おぼえない 技で、{t} を 使わない
      if (a.effect.type === 'random') {
        for (const o of a.effect.options) {
          assert.ok(ABILITIES[o]?.hidden, o);
          assert.ok(!ABILITIES[o].cast.includes('{t}'), o);
          assert.deepEqual(checkText(ABILITIES[o].cast), [], o);
        }
      }
    }
    // つよさの 倍率の 合計は 同じ ランクの ほかの 職業の はんい（伝説の職業は 超級職より 上）
    const same = ALL_JOBS.filter((o) => !NEW.includes(o) && tierOf(o) === Math.min(2, tierOf(j))).map(sum);
    if (tierOf(j) < 3) assert.ok(sum(j) >= Math.min(...same) - 1e-9 && sum(j) <= Math.max(...same) + 1e-9, `${j}: 倍率の 合計 ${sum(j).toFixed(2)}`);
    else assert.ok(sum(j) > Math.max(...same), 'ロトの勇者は 超級職より 強い');
  }
  // 新しい 武器: お店で 買える・ランクに あった 強さ
  const sold = new Set(Object.values(SHOPS).flatMap((s) => [...(s.items || []), ...(s.more || []).flatMap((m) => m.items)]));
  for (const id of ['kitchen_knife', 'ladle', 'mop', 'frying_pan', 'deck_brush', 'whisk', 'center_mic', 'chinese_wok', 'gold_mic', 'chef_knife']) {
    const it = ITEMS[id];
    assert.equal(it.type, 'weapon', id);
    assert.ok(sold.has(id), `${id} は お店で 買える`);
    assert.ok(ITEMS[`${id}+1`], `${id} は きたえられる`);
    for (const s of [it.name, it.desc]) assert.deepEqual(checkText(s), [], `${id}: ${s}`);
  }
});

test('見なおし: どの 職業にも 攻撃技（基本職は 3つ いじょう、ほかは 2つ いじょう）', () => {
  for (const j of ALL_JOBS) {
    const atk = JOBS[j].learn.filter(([, id]) => abilityRole(ABILITIES[id]) === 'dmg').length;
    assert.ok(atk >= (tierOf(j) === 0 ? 3 : 2), `${JOBS[j].name}: 攻撃技 ${atk}こ`);
  }
});

test('見なおし: 補助の 強さは ランクで そろえる（基本職の 補助は 強すぎない）。敵を 止める 技には 効く わりあい', () => {
  // みんなに かける 補助（1つの 強さ／いくつもの 強さ）・1人に かける 補助 の いちばん 上（ランクごと。自分だけの 補助は のぞく）
  const ALL_CAP = [1.15, 1.25, 1.4, 1.4];
  const ALL_MULTI_CAP = [1.12, 1.2, 1.3, 1.35];
  const ONE_CAP = [1.3, 1.4, 1.5, 1.5];
  const buffsOf = (a) => (a.effect.type === 'multi' ? a.effect.parts.filter((p) => p.type === 'buff' && !p.target) : a.effect.type === 'buff' ? [a.effect] : []);
  let checked = 0;
  for (const j of ALL_JOBS) {
    const t = tierOf(j);
    for (const [, id] of JOBS[j].learn) {
      const a = ABILITIES[id];
      if (a.job !== j) continue; // ほかの 職業の 技（賢者の ルーラ など）は その 職業で しらべる
      for (const eff of buffsOf(a)) {
        const cap = (eff.stats || [eff.stat]).length > 1 ? ALL_MULTI_CAP[t] : ALL_CAP[t];
        if (a.target === 'allies') assert.ok(eff.mult <= cap + 1e-9, `${JOBS[j].name} ${a.name}: みんなに ${eff.mult}倍`);
        if (a.target === 'ally') assert.ok(eff.mult <= ONE_CAP[t] + 1e-9, `${JOBS[j].name} ${a.name}: 1人に ${eff.mult}倍`);
        checked++;
      }
      // 敵の 行動ゲージを へらす 技は、かならず 効くわけでは ない
      const parts = a.effect.type === 'multi' ? a.effect.parts : [a.effect];
      for (const p of parts) {
        if (p.type === 'atbSet' && ['enemy', 'group', 'enemies'].includes(p.target || a.target)) assert.ok(p.chance > 0 && p.chance < 1, `${a.name}: 効く わりあい`);
      }
    }
  }
  assert.ok(checked >= 40, `しらべた 補助 ${checked}`);
  // 基本職の 例: バイキルトは 1.3倍、スクルト・ピオリムは 1.15倍
  assert.equal(ABILITIES.baikiruto.effect.mult, 1.3);
  assert.equal(ABILITIES.sukuruto.effect.mult, 1.15);
  assert.equal(ABILITIES.piorimu.effect.mult, 1.15);
});

test('見なおし: 本職で ない 技で かける 補助は、上がりかたも へる', () => {
  const { b, me } = setup('performer');
  use(b, me, 'baikiruto', me.id, 1);
  assert.ok(Math.abs(me.buffs.atk.mult - 1.3) < 1e-9, '旅芸人なら 1.3倍');
  const { b: b2, me: m2 } = setup('warrior');
  use(b2, m2, 'baikiruto', m2.id, 0.7);
  assert.ok(Math.abs(m2.buffs.atk.mult - 1.21) < 1e-9, `ペンナルティ 0.7 で 1.21倍（${m2.buffs.atk.mult}）`);
  // 職業レベルが 高くても、決まった 上がりかたより 上には ならない
  const { b: b3, me: m3 } = setup('performer');
  use(b3, m3, 'baikiruto', m3.id, 1.36);
  assert.ok(Math.abs(m3.buffs.atk.mult - 1.3) < 1e-9);
  // じっさいの ペナルティ: 戦士が 旅芸人の 技を 使う
  const c = newCharacter({ id: 'x', name: 'x', job: 'warrior' });
  c.jobs.performer = { lv: 5, b: 99 };
  assert.ok(penaltyFor(c, 'baikiruto').powMult < 1);
});

test('新しい こうか: じわじわ回復・強さを 消す・いくつかの こうか', () => {
  // じわじわ回復: 4びょうごとに 少しずつ。時間が たつと 消える
  let { b, me, mate } = setup('cook');
  mate.hp = 10;
  use(b, me, 'ck_soup', mate.id);
  assert.ok(mate.regen && mate.regen.amt > 0, 'スープ');
  const hp0 = mate.hp;
  b.advance(4100);
  assert.ok(mate.hp > hp0, `回復した ${hp0} → ${mate.hp}`);
  b.advance(30000);
  assert.equal(mate.regen, null, '24びょうで 消える');
  // 強さを 消す（ツッコミ）: 敵の バフと 力ため
  ({ b, me } = setup('comedian', ['rockman'], { lucky: true }));
  const e = b.enemies[0];
  e.hp = e.maxHp = 99999;
  e.buffs.atk = { mult: 1.5, lv: 1, until: 1e12 };
  e.charge = 2;
  const ev = use(b, me, 'cm_tsukkomi', e.id);
  assert.ok(!e.buffs.atk && e.charge === 1, ev.lines.join(' / '));
  assert.ok(ev.lines.some((l) => l.includes('強くなっていた力が消えた')));
  // 仲間の 弱く なった 力を もどす（さとり）
  ({ b, me, mate } = setup('daikenja'));
  mate.debuffs.def = { mult: 0.6, lv: 1, until: 1e12 };
  mate.status.sleep = { turns: 3 };
  use(b, me, 'dz_satori');
  assert.deepEqual(mate.debuffs, {});
  assert.ok(!mate.status.sleep);
  // いくつかの こうか: スタミナ料理は 回復して 攻撃力も 上がる
  ({ b, me, mate } = setup('cook'));
  mate.hp = 10;
  use(b, me, 'ck_stamina');
  assert.ok(mate.hp > 10 && mate.buffs.atk, 'スタミナ料理');
  // 究極の一皿: 敵1体に 炎、仲間全員を 回復
  ({ b, me, mate } = setup('star_chef', ['rockman']));
  const hp1 = b.enemies[0].hp;
  mate.hp = 10;
  use(b, me, 'sc_kyuukyoku', b.enemies[0].id);
  assert.ok(b.enemies[0].hp < hp1 && mate.hp > 10);
});

test('新しい こうか: マダンテ・ミナデイン・回復魔力の 光・守りの 一撃', () => {
  // マダンテ: のこりの MPを ぜんぶ 使う。MPが 多いほど 強い
  let { b, me } = setup('daikenja', ['rockman', 'rockman']);
  for (const e of b.enemies) e.hp = e.maxHp = 99999;
  me.mp = 130;
  use(b, me, 'dz_madante');
  const dmg = 99999 - b.enemies[0].hp;
  assert.equal(me.mp, 0, 'MPは 0に');
  assert.ok(dmg >= (130 + 30) * 3 * 0.9 && dmg <= (130 + 30) * 3 * 1.1, `ダメージ ${dmg}`);
  // ミナデイン: 仲間から MPを 集めるほど 強い
  const mina = (mates) => {
    const r = setup('loto_hero', ['rockman'], { prep: (c) => master(c, 'hero') });
    r.b.enemies[0].hp = r.b.enemies[0].maxHp = 99999;
    r.mate.mp = mates ? 50 : 0;
    use(r.b, r.me, 'lt_minadein', r.b.enemies[0].id);
    return { dmg: 99999 - r.b.enemies[0].hp, mateMp: r.mate.mp };
  };
  const solo = mina(false), two = mina(true);
  assert.equal(two.mateMp, 38, '仲間の MPが 12 へる');
  assert.ok(two.dmg > solo.dmg, `集まると 強い ${solo.dmg} → ${two.dmg}`);
  // 回復魔力の 光（ホーリーライト）: 回復魔力が 高いほど 強い
  ({ b, me } = setup('high_priest', ['rockman']));
  const t = b.enemies[0];
  const lo = b.calcMagic({ ...me, healPow: 20, mag: 200 }, t, ABILITIES.hp_holy.effect, 1, true).dmg;
  const hi = b.calcMagic({ ...me, healPow: 200, mag: 20 }, t, ABILITIES.hp_holy.effect, 1, true).dmg;
  assert.ok(hi > lo * 1.5, `回復魔力 ${lo} → ${hi}`);
  // 守りの 一撃（ようさいの一撃）: 守備力が 高いほど 強い
  ({ b, me } = setup('guardian', ['rockman']));
  const g = b.enemies[0];
  const base = b.calcPhys(me, g, ABILITIES.gd_youzai.effect, 1, 'phys', true).dmg;
  me.buffs.def = { mult: 2, lv: 1, until: 1e12 };
  const guarded = b.calcPhys(me, g, ABILITIES.gd_youzai.effect, 1, 'phys', true).dmg;
  assert.ok(guarded > base, `守りを 上げると ${base} → ${guarded}`);
});

test('オートの 仲間: いくつかの こうかの 技も わかる。マダンテ・ミナデインは オートで 使わない', () => {
  assert.equal(prim(ABILITIES.ck_stamina).type, 'heal');
  assert.equal(prim(ABILITIES.daichi).type, 'phys');
  assert.ok(ABILITIES.dz_madante.noAuto && ABILITIES.lt_minadein.noAuto);
  // 大賢者の オート: マダンテは えらばない
  const { b, me } = setup('daikenja', ['rockman', 'rockman', 'skeleton']);
  me.abilities = ['dz_madante', 'dz_mahyadedos'];
  me.tactics = 'aggressive';
  for (let i = 0; i < 30; i++) assert.notEqual(decideAlly(b, me).id, 'dz_madante');
  // 敵が 強く なっていたら、消す 技を 使う
  const r = setup('comedian', ['rockman']);
  r.me.abilities = ['cm_tsukkomi'];
  r.b.enemies[0].buffs.atk = { mult: 1.5, lv: 1, until: 1e12 };
  let used = 0;
  for (let i = 0; i < 40; i++) if (decideAlly(r.b, r.me).id === 'cm_tsukkomi') used++;
  assert.ok(used >= 10, `ツッコミを 使った ${used}回`);
});

test('新しい 職業の 技は ぜんぶ たたかいで 使える（ロトの勇者も）', () => {
  let used = 0;
  for (const jid of NEW) {
    const prep = (c) => {
      for (const r of JOBS[jid].req || []) { master(c, r); for (const rr of JOBS[r].req || []) master(c, rr); }
      if (jid === 'loto_hero') master(c, 'archmage', 'daikenja');
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
      assert.ok(evs.some((e) => e.t === 'act' && e.id === me.id), `${aid} が じっこう された`);
      used++;
    }
  }
  assert.ok(used >= 60, `使った 技 ${used}`);
});
