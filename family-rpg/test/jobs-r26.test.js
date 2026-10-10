// 2026年10月（第26回）の 新しい 職業 20こ
//  楽天カードマン、きさつ隊 → 炎柱 → 日の呼吸の使い手、スパイ → 殺し屋 → 黒の組織、超能力者、
//  少年探てい団 → おしり探てい → 名探てい、クリエイター、ネコ型ロボット → 耳無しネコ型ロボット → ドラえもん、
//  カッパ → はなかっぱ → はなかっぱ（筋肉ニンニク）、忍者 → 木の葉の忍び → 七代目火影
//  新しい こうか: ポイントバック（phys の points）・推理（deduce）・オートで 使う 運しだいの 技（autoRandom）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  JOBS, JOB_ORDER, ADVANCED_ORDER, SUPER_ORDER, LEGEND_ORDER, ALL_JOBS, JOB_MAX_LEVEL, JOB_HINTS, jobReqText,
} from '../public/js/shared/data/jobs.js';
import { ABILITIES, abilityRole } from '../public/js/shared/data/abilities.js';
import { deduceElement } from '../public/js/shared/data/abilities-jobs6.js';
import { ITEMS, ITEM_KANA } from '../public/js/shared/data/items.js';
import { SHOPS } from '../public/js/shared/data/shops.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { newCharacter, changeJob, jobUnlocked, jobKnown, gainExp, expForLevel, fullHeal, learnedAbilities, STARTER_EQUIP, computeStats } from '../public/js/shared/stats.js';
import { Battle } from '../public/js/shared/battle.js';
import { decideAlly, prim } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { checkText } from '../tools/kanji-check.mjs';

const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };
const masterChain = (c, jid) => {
  for (const r of JOBS[jid].req || []) { master(c, r); masterChain(c, r); }
};
// 家族と きめた 職業の 木（id・名前・ランク・なる じょうけんは 絵の 人との やくそく）
const TREE = [
  ['rakuten_cardman', '楽天カードマン', 1, ['salaryman', 'performer']],
  ['kisatsu', 'きさつ隊', 1, ['warrior', 'monk']],
  ['enbashira', '炎柱', 2, ['kisatsu']],
  ['hinokami', '日の呼吸の使い手', 3, ['enbashira'], 1],
  ['spy', 'スパイ', 0],
  ['assassin', '殺し屋', 1, ['spy']],
  ['black_org', '黒の組織', 2, ['assassin']],
  ['esper', '超能力者', 1, ['mage', 'schoolkid']],
  ['shonen_tantei', '少年探てい団', 0],
  ['oshiri_tantei', 'おしり探てい', 1, ['shonen_tantei']],
  ['meitantei', '名探てい', 1, ['oshiri_tantei']],
  ['creator', 'クリエイター', 1, ['parttimer', 'priest']],
  ['neko_robot', 'ネコ型ロボット', 0],
  ['mimi_robot', '耳無しネコ型ロボット', 1, ['neko_robot']],
  ['doraemon', 'ドラえもん', 2, ['mimi_robot']],
  ['kappa', 'カッパ', 0],
  ['hanakappa', 'はなかっぱ', 1, ['kappa']],
  ['kinniku_kappa', 'はなかっぱ（筋肉ニンニク）', 2, ['hanakappa']],
  ['konoha', '木の葉の忍び', 2, ['ninja']],
  ['hokage', '七代目火影', 3, ['konoha'], 1],
];
const NEW = TREE.map(([id]) => id);
const NEW_ITEMS = ['mushimegane', 'spy_glasses', 'kappa_sara', 'neko_suzu', 'nichirin', 'kunai', 'takecopter'];
const tierOf = (j) => JOBS[j].tier || 0;
const ORDERS = [JOB_ORDER, ADVANCED_ORDER, SUPER_ORDER, LEGEND_ORDER];

// その 職業の キャラ（敵は なにも しない）。opts.lucky … 確率の こうかが かならず 決まる
function setup(job, enemies = ['rockman'], { lucky = false, seed = 1, prep, hooks } = {}) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job: 'warrior' });
  gainExp(c, expForLevel(40));
  master(c, job);
  c.job = job;
  if (prep) prep(c);
  fullHeal(c);
  const mate = newCharacter({ id: 'm1', name: 'ミナ', job: 'priest' });
  gainExp(mate, expForLevel(30));
  fullHeal(mate);
  const rng = makeRng(seed);
  if (lucky) rng.chance = () => true;
  const b = new Battle({ rng, allies: [{ char: c, controller: 's1' }, { char: mate, auto: true, kind: 'support' }], enemies, canFlee: true, hooks });
  for (const e of b.enemies) e.actions = [{ w: 1, id: 'm_nothing' }];
  return { b, c, me: b.allies[0], mate: b.allies[1] };
}
const use = (b, actor, id, target, pow = 1) => {
  const ev = { lines: [], upd: [] };
  b.applyAbility(actor, ABILITIES[id], { target }, ev, pow);
  return ev;
};

test('第26回の 職業: 職業の 木（id・名前・ランク・なる じょうけん）', () => {
  assert.equal(NEW.length, 20);
  for (const [id, name, tier, req, reqSuper] of TREE) {
    const j = JOBS[id];
    assert.ok(j, id);
    assert.equal(j.id, id);
    assert.equal(j.name, name, `${id} の 名前`);
    assert.equal(tierOf(id), tier, `${id} の ランク`);
    assert.ok(ORDERS[tier].includes(id), `${id} は ${['基本職', '上級職', '超級職', '伝説の職業'][tier]}の ならびに いる`);
    if (req) assert.deepEqual(j.req, req, `${id} の じょうけん`);
    else assert.equal(j.req, undefined, `${id} は はじめから なれる`);
    assert.equal(j.reqSuper, reqSuper, `${id} の reqSuper`);
    assert.equal(ALL_JOBS.filter((x) => x === id).length, 1);
    if (tier >= 2) assert.ok(JOB_HINTS[id], `${id} の 神殿の うわさ`);
  }
  assert.match(jobReqText('rakuten_cardman'), /会社員Lv10＋旅芸人Lv10/);
  assert.match(jobReqText('hinokami'), /炎柱Lv10＋ほかの超級職1つLv10/);
  assert.match(jobReqText('hokage'), /木の葉の忍びLv10＋ほかの超級職1つLv10/);
  assert.match(jobReqText('meitantei'), /おしり探ていLv10/);
});

test('第26回の 職業: なれる じゅんばん（基本職は はじめから・上級職・超級職・伝説）', () => {
  // 基本職: はじめから えらべる
  for (const j of ['spy', 'shonen_tantei', 'neko_robot', 'kappa']) {
    const c = newCharacter({ id: j, name: 'テスト', job: j });
    assert.equal(c.job, j, `${j} は はじめから`);
  }
  // 少年探てい団 → おしり探てい → 名探てい（上級職から 上級職）
  const t = newCharacter({ id: 't', name: 'コナ', job: 'shonen_tantei' });
  assert.equal(jobUnlocked(t, 'oshiri_tantei'), false);
  master(t, 'shonen_tantei');
  assert.equal(jobUnlocked(t, 'oshiri_tantei'), true);
  assert.equal(jobUnlocked(t, 'meitantei'), false, 'おしり探ていを きわめないと なれない');
  assert.equal(jobKnown(t, 'meitantei'), true, '上級職なので 神殿に 見えている');
  master(t, 'oshiri_tantei');
  assert.equal(jobUnlocked(t, 'meitantei'), true);
  assert.equal(changeJob(t, 'meitantei').ok, true);
  // ネコ型ロボット → 耳無し → ドラえもん（超級職は ヒントが 出るまで ひみつ）
  const d = newCharacter({ id: 'd', name: 'ロボ', job: 'neko_robot' });
  master(d, 'neko_robot');
  assert.equal(jobUnlocked(d, 'mimi_robot'), true);
  assert.equal(jobKnown(d, 'doraemon'), false, 'ドラえもんは まだ ひみつ');
  master(d, 'mimi_robot');
  assert.equal(jobKnown(d, 'doraemon'), true);
  assert.equal(jobUnlocked(d, 'doraemon'), true);
  // 楽天カードマン: 会社員と 旅芸人の 両方
  const r = newCharacter({ id: 'r', name: 'カド', job: 'salaryman' });
  master(r, 'salaryman');
  assert.equal(jobUnlocked(r, 'rakuten_cardman'), false, '旅芸人も ひつよう');
  master(r, 'performer');
  assert.equal(jobUnlocked(r, 'rakuten_cardman'), true);
  // きさつ隊 → 炎柱 → 日の呼吸の使い手（炎柱＋ほかの 超級職 1つ）
  const k = newCharacter({ id: 'k', name: 'タン', job: 'warrior' });
  master(k, 'warrior', 'monk');
  assert.equal(jobUnlocked(k, 'kisatsu'), true);
  master(k, 'kisatsu', 'enbashira');
  assert.equal(jobKnown(k, 'hinokami'), true, '炎柱を きわめると うわさ');
  assert.equal(jobUnlocked(k, 'hinokami'), false, '炎柱だけでは まだ');
  master(k, 'kinniku_kappa');
  assert.equal(jobUnlocked(k, 'hinokami'), true, 'ほかの 超級職 1つで なれる');
  assert.equal(changeJob(k, 'hinokami').ok, true);
  // 忍者 → 木の葉の忍び → 七代目火影
  const n = newCharacter({ id: 'n', name: 'ナル', job: 'monk' });
  master(n, 'ninja');
  assert.equal(jobUnlocked(n, 'konoha'), true);
  master(n, 'konoha');
  assert.equal(jobUnlocked(n, 'hokage'), false);
  master(n, 'doraemon');
  assert.equal(jobUnlocked(n, 'hokage'), true);
  // 超能力者・クリエイター
  const e = newCharacter({ id: 'e', name: 'エス', job: 'mage' });
  master(e, 'mage', 'schoolkid');
  assert.equal(jobUnlocked(e, 'esper'), true);
  const cr = newCharacter({ id: 'c', name: 'クリ', job: 'priest' });
  master(cr, 'parttimer');
  assert.equal(jobUnlocked(cr, 'creator'), false);
  master(cr, 'priest');
  assert.equal(jobUnlocked(cr, 'creator'), true);
});

test('第26回の 職業: 強さは 同じ ランクの 今の 職業と つり合う（伝説は 超級職より 上）', () => {
  const sum = (j) => Object.values(JOBS[j].mods).reduce((a, b) => a + b, 0);
  const OLD = ALL_JOBS.filter((o) => !NEW.includes(o));
  const sup = OLD.filter((o) => tierOf(o) === 2).map(sum);
  const legend = OLD.filter((o) => tierOf(o) === 3).map(sum);
  for (const j of NEW) {
    const t = tierOf(j);
    assert.deepEqual(Object.keys(JOBS[j].mods).sort(), ['agi', 'def', 'heal', 'hp', 'mag', 'mp', 'str']);
    if (t < 3) {
      const same = OLD.filter((o) => tierOf(o) === t).map(sum);
      assert.ok(sum(j) >= Math.min(...same) - 1e-9 && sum(j) <= Math.max(...same) + 1e-9, `${j}: 倍率の 合計 ${sum(j).toFixed(2)}`);
    } else {
      assert.ok(sum(j) > Math.max(...sup), `${j}: 伝説の職業は 超級職より 強い`);
      assert.ok(sum(j) >= Math.min(...legend) && sum(j) <= Math.max(...legend), `${j}: 今の 伝説の職業と 同じ くらい ${sum(j).toFixed(2)}`);
    }
    // 超級職は 今の 伝説の職業より 弱い（jobs-r20〜r22 の きまり）
    if (t === 2) assert.ok(sum(j) < Math.min(...legend), `${j}: 超級職は 伝説より 下`);
    // ずっと 残る ボーナス・装備
    assert.ok(Object.values(JOBS[j].perLv).reduce((a, b) => a + b, 0) <= [1.4, 1.5, 2, 3.5][t] + 1e-9, `${j}: perLv`);
    assert.ok(JOBS[j].weapons.length >= 2 && JOBS[j].armor.includes('cloth'), j);
    assert.match(JOBS[j].color, /^#[0-9a-f]{6}$/);
  }
});

test('第26回の 職業: 技の 数（4〜6こ）・看板の 技・攻撃技・せつめい・文字', () => {
  const SCOPE = {
    enemy: /敵1体/, group: /同じ種類の敵/, enemies: /敵全体|敵にランダム/, ally: /仲間1人/, allies: /仲間全員/, self: /自分|運しだい/, deadAlly: /仲間1人/,
  };
  const names = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (!a.hidden && a.kind === 'skill') names.set(a.name, [...(names.get(a.name) || []), id]);
  let sigs = 0;
  for (const j of NEW) {
    const job = JOBS[j];
    for (const s of [job.name, job.desc, JOB_HINTS[j] || '']) assert.deepEqual(checkText(s), [], `${j}: ${s}`);
    assert.deepEqual(checkText(job.kana).filter((p) => p.kind !== 'kana'), [], `${j} kana`);
    assert.ok(job.learn.length >= 4 && job.learn.length <= 6, `${j}: 技 ${job.learn.length}こ`);
    const lvs = job.learn.map(([l]) => l);
    assert.deepEqual(lvs, [...lvs].sort((a, b) => a - b), `${j}: レベルの じゅん`);
    assert.equal(lvs[0], 1);
    assert.equal(lvs[lvs.length - 1], 10);
    const mps = job.learn.map(([, id]) => ABILITIES[id].mp);
    assert.equal(Math.max(...mps), mps[mps.length - 1], `${j}: Lv10 の 技が いちばん MPを 使う`);
    // 看板の 技: <職業の id>_sig。anim も 同じ 名前（絵の 人が エフェクトを 作る）
    const sig = `${j}_sig`;
    assert.ok(ABILITIES[sig], `${j}: 看板の 技 ${sig}`);
    assert.ok(job.learn.some(([, id]) => id === sig), `${j}: 看板の 技を 覚える`);
    assert.equal(ABILITIES[sig].anim, sig, `${sig} の anim`);
    assert.ok(!ABILITIES[sig].hidden && !ABILITIES[sig].noAuto, sig);
    sigs++;
    // 攻撃技: 基本職は 3つ いじょう、ほかは 2つ いじょう
    const atk = job.learn.filter(([, id]) => abilityRole(ABILITIES[id]) === 'dmg').length;
    assert.ok(atk >= (tierOf(j) === 0 ? 3 : 2), `${j}: 攻撃技 ${atk}こ`);
    for (const [, id] of job.learn) {
      const a = ABILITIES[id];
      assert.equal(a.job, j, `${id} の job`);
      assert.equal(a.kind, 'skill', id);
      assert.ok(a.desc && a.cast && a.anim && a.kana, `${id} の 文`);
      assert.match(a.desc, SCOPE[a.target], `${id}（${a.target}）の せつめい: ${a.desc}`);
      for (const s of [a.name, a.desc, a.cast]) assert.deepEqual(checkText(s), [], `${id}: ${s}`);
      assert.deepEqual(checkText(a.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
      assert.equal(names.get(a.name).length, 1, `${a.name} が ほかの 技と おなじ 名前`);
      if (a.effect.type === 'random') {
        for (const o of a.effect.options) {
          assert.ok(ABILITIES[o]?.hidden, o);
          assert.equal(ABILITIES[o].job, j, o);
          assert.ok(!ABILITIES[o].cast.includes('{t}'), o);
          for (const s of [ABILITIES[o].name, ABILITIES[o].cast]) assert.deepEqual(checkText(s), [], `${o}: ${s}`);
        }
      }
    }
  }
  assert.equal(sigs, 20);
});

test('第26回の 職業: 補助の 強さは ランクの 上限まで・敵を 止める 技には 効く わりあい', () => {
  const ALL_CAP = [1.15, 1.25, 1.4, 1.4];
  const ALL_MULTI_CAP = [1.12, 1.2, 1.3, 1.35];
  const ONE_CAP = [1.3, 1.4, 1.5, 1.5];
  for (const j of NEW) {
    const t = tierOf(j);
    for (const [, id] of JOBS[j].learn) {
      const a = ABILITIES[id];
      const parts = a.effect.type === 'multi' ? a.effect.parts : [a.effect];
      for (const p of parts) {
        if (p.type === 'buff' && !p.target && ['allies', 'ally'].includes(a.target)) {
          if (p.stat === 'eva') assert.ok(p.add <= [0.25, 0.3, 0.35, 0.35][t] + 1e-9, `${a.name}: かいひ`);
          else if (a.target === 'allies') assert.ok(p.mult <= ((p.stats || [p.stat]).length > 1 ? ALL_MULTI_CAP[t] : ALL_CAP[t]) + 1e-9, `${a.name}: みんなに ${p.mult}倍`);
          else assert.ok(p.mult <= ONE_CAP[t] + 1e-9, `${a.name}: 1人に ${p.mult}倍`);
        }
        if (p.type === 'atbSet' && ['enemy', 'group', 'enemies'].includes(p.target || a.target)) assert.ok(p.chance > 0 && p.chance < 1, `${a.name}: 効く わりあい`);
      }
    }
  }
});

test('ポイントバック（楽天カード！）: 当てた 敵の お金が、たおさなくても もらえる', () => {
  const got = [];
  const hooks = { gainGold: (actor, species, mult) => { const g = Math.round((MONSTERS[species]?.gold || 0) * mult); got.push([actor.id, species, mult]); return g; } };
  const { b, me } = setup('rakuten_cardman', ['rockman', 'rockman'], { hooks });
  for (const e of b.enemies) e.hp = e.maxHp = 99999;
  const ev = use(b, me, 'rakuten_cardman_sig');
  assert.equal(got.length, 2, '敵 2体ぶん');
  assert.ok(got.every(([a, sp, m]) => a === me.id && sp === 'rockman' && m === ABILITIES.rakuten_cardman_sig.effect.points));
  assert.ok(b.enemies.every((e) => e.alive && e.hp < e.maxHp), 'ダメージも あたえる');
  const g = Math.round(MONSTERS.rockman.gold * ABILITIES.rakuten_cardman_sig.effect.points) * 2;
  assert.ok(ev.lines.includes(`ポイントバック！${g}ゴールドを手に入れた！`), ev.lines.join(' / '));
  for (const l of ev.lines) assert.deepEqual(checkText(l), [], l);
  // お金の しくみが ない 戦い（hooks なし）でも こわれない
  const s = setup('rakuten_cardman', ['rockman']);
  const ev2 = use(s.b, s.me, 'rakuten_cardman_sig');
  assert.ok(!ev2.lines.some((l) => l.includes('ポイントバック')));
  // ふつうの 攻撃技は もらえない
  got.length = 0;
  const p = setup('rakuten_cardman', ['rockman'], { hooks });
  use(p.b, p.me, 'rk_dance');
  assert.equal(got.length, 0);
  // オートの 仲間も ふつうの 攻撃技として 使う
  assert.equal(prim(ABILITIES.rakuten_cardman_sig).type, 'phys');
  assert.equal(JOBS.rakuten_cardman.passive.gold, 1.2, '戦いで 手に入る お金も ふえる');
});

test('推理（deduce）: 敵の いちばんの 弱点の 属性で 攻撃する（弱点が なければ 属性なし）', () => {
  // 骨の 魔物は 炎（1.5倍）より 光（2倍）が 苦手
  assert.equal(deduceElement({ resist: MONSTERS.skeleton.resist }), 'light');
  assert.equal(deduceElement({ resist: MONSTERS.rockman.resist }), 'blast');
  assert.equal(deduceElement({ resist: { fire: 1.1, ice: 0.5 } }), null, '1.2倍 より 小さい ものは 弱点では ない');
  assert.equal(deduceElement({}), null);
  const { b, me } = setup('meitantei', ['skeleton', 'rockman', 'skeleton']);
  for (const e of b.enemies) e.hp = e.maxHp = 99999;
  const ev = use(b, me, 'meitantei_sig');
  const hits = (ev.results || []).filter((r) => r.dmg > 0);
  assert.equal(hits.length, 3, '敵全体');
  for (const r of hits) {
    const e = b.enemies.find((x) => x.id === r.id);
    assert.equal(r.element, e.species === 'skeleton' ? 'light' : 'blast', `${e.species} の 弱点で 攻撃`);
    assert.equal(r.aff, 'weak');
  }
  assert.equal(ev.lines.filter((l) => l.includes('の弱点は…')).length, 2, 'ことばは 敵の しゅるいごとに 1回');
  assert.ok(ev.lines.some((l) => l.includes('光だ！')), ev.lines.join(' / '));
  for (const l of ev.lines) assert.deepEqual(checkText(l), [], l);
  // 弱点で 攻撃するので、属性なしで 当てるより 強い
  const plain = b.calcMagic(me, b.enemies[0], { ...ABILITIES.meitantei_sig.effect, type: 'magic' }, 1, true).dmg;
  const weak = b.calcMagic(me, b.enemies[0], { ...ABILITIES.meitantei_sig.effect, type: 'magic', element: 'light' }, 1, true).dmg;
  assert.ok(weak > plain * 1.5, `${plain} → ${weak}`);
  // 弱点の ない 敵: 属性なし（「弱点がない」と 言う）
  const none = Object.keys(MONSTERS).find((k) => !MONSTERS[k].boss && !MONSTERS[k].metal && MONSTERS[k].hp > 5 && deduceElement({ resist: MONSTERS[k].resist || {} }) === null && MONSTERS[k].resist?.light !== 0);
  assert.ok(none, '弱点の ない 魔物');
  const s = setup('shonen_tantei', [none]);
  s.b.enemies[0].hp = s.b.enemies[0].maxHp = 99999;
  const ev2 = use(s.b, s.me, 'tn_suiri', s.b.enemies[0].id);
  assert.ok(ev2.lines.some((l) => l.includes('弱点がない')), ev2.lines.join(' / '));
  assert.equal((ev2.results || []).find((r) => r.dmg > 0)?.element, undefined);
  assert.equal(abilityRole(ABILITIES.tn_suiri), 'dmg', '推理は 攻撃技');
});

test('オートの 仲間: 推理は 弱点の ある 敵に 使う・運しだいの 技（ひみつ道具・あたまの花）も 使う・一撃必殺', () => {
  // 推理: 弱点を つける 敵には ふつうの 攻撃より 推理
  let used = 0;
  for (let seed = 1; seed <= 20; seed++) {
    const s = setup('oshiri_tantei', ['skeleton'], { seed });
    s.b.enemies[0].hp = s.b.enemies[0].maxHp = 3000;
    s.me.abilities = ['os_suiri'];
    if (decideAlly(s.b, s.me).id === 'os_suiri') used++;
  }
  assert.ok(used >= 15, `推理 ${used}/20`);
  // ひみつ道具（運しだい）も、敵の むれには 使う（ガンガンいこうぜ）
  let dora = 0, plain = 0;
  for (let seed = 1; seed <= 20; seed++) {
    const s = setup('doraemon', ['skeleton', 'skeleton', 'rockman', 'rockman'], { seed });
    s.me.abilities = ['doraemon_sig'];
    s.me.tactics = 'aggressive';
    const cmd = decideAlly(s.b, s.me);
    if (cmd.id === 'doraemon_sig') dora++;
    // 中みに 攻撃の ない 運しだいの 技（autoRandom で ない もの）は 今までどおり 使わない
    const n = setup('neko_robot', ['skeleton'], { seed });
    n.b.enemies[0].hp = n.b.enemies[0].maxHp = 3000;
    n.me.abilities = ['nr_pocket'];
    if (decideAlly(n.b, n.me).id === 'nr_pocket') plain++;
  }
  assert.ok(dora >= 10, `ひみつ道具 ${dora}/20`);
  assert.equal(plain, 0, 'ポケットをさぐる は オートでは 使わない');
  assert.ok(ABILITIES.doraemon_sig.autoRandom && ABILITIES.hanakappa_sig.autoRandom);
  let hana = 0;
  for (let seed = 1; seed <= 20; seed++) {
    const s = setup('hanakappa', ['skeleton', 'skeleton', 'rockman', 'rockman'], { seed });
    s.me.abilities = ['hanakappa_sig'];
    s.me.tactics = 'aggressive';
    if (decideAlly(s.b, s.me).id === 'hanakappa_sig') hana++;
  }
  assert.ok(hana >= 10, `あたまの花 ${hana}/20`);
  // 殺し屋の 一撃必殺（destroy）: かたい 敵には 使う
  let kill = 0;
  for (let seed = 1; seed <= 20; seed++) {
    const s = setup('assassin', ['rockman', 'rockman'], { seed });
    for (const e of s.b.enemies) e.hp = e.maxHp = 4000;
    s.me.abilities = ['assassin_sig'];
    s.me.mp = 999;
    if (decideAlly(s.b, s.me).id === 'assassin_sig') kill++;
  }
  assert.ok(kill >= 15, `一撃必殺 ${kill}/20`);
  // オートで 戦っても こわれない（看板の 技を ふくむ 技を 全部 もった オートの 仲間）
  for (const j of NEW) {
    const s = setup(j, ['skeleton', 'rockman', 'skeleton'], { seed: 7, prep: (c) => { masterChain(c, j); if (JOBS[j].reqSuper) master(c, 'god_hand'); } });
    s.me.abilities = learnedAbilities(s.c);
    for (let i = 0; i < 10; i++) {
      const cmd = decideAlly(s.b, s.me);
      assert.ok(cmd && cmd.type, `${j}: ${JSON.stringify(cmd)}`);
      if (cmd.type === 'ability') assert.ok(ABILITIES[cmd.id] && !ABILITIES[cmd.id].hidden && !ABILITIES[cmd.id].noAuto, `${j}: ${cmd.id}`);
    }
  }
});

test('一撃必殺・運しだいの 技・APTX4869・地球はかいばくだん', () => {
  // 一撃必殺: ふつうの 敵は たおす（たおしたことに なる）。ボスと メタルは たえる
  const { b, me } = setup('assassin', ['rockman', 'rockman'], { lucky: true });
  const ev = use(b, me, 'assassin_sig', b.enemies[0].id);
  assert.equal(b.enemies[0].alive, false);
  assert.ok(b.killed.includes('rockman'));
  assert.ok(ev.lines.some((l) => l.includes('音もなくたおれた')), ev.lines.join(' / '));
  const bs = setup('assassin', ['dark_treant'], { lucky: true });
  const ev2 = use(bs.b, bs.me, 'assassin_sig', bs.b.enemies[0].id);
  assert.ok(bs.b.enemies[0].alive, 'ボスは たおれない');
  assert.ok(ev2.lines.some((l) => l.includes('急所が見つからない')), ev2.lines.join(' / '));
  // ひみつ道具・あたまの花・ポケット: どれが 出るかは 運しだい（全部 出る）
  for (const [job, id, n] of [['doraemon', 'doraemon_sig', 4], ['hanakappa', 'hanakappa_sig', 3], ['neko_robot', 'nr_pocket', 3]]) {
    const seen = new Set();
    for (let seed = 1; seed <= 60; seed++) {
      const s = setup(job, ['rockman', 'skeleton'], { seed });
      const e = use(s.b, s.me, id);
      seen.add(e.sub);
      for (const l of e.lines) assert.deepEqual(checkText(l), [], `${id}: ${l}`);
    }
    assert.equal(seen.size, n, `${id}: ${[...seen].join('・')}`);
  }
  // APTX4869: 敵の 攻撃力と 守備力が 大きく 下がる
  const ap = setup('black_org', ['rockman'], { lucky: true });
  use(ap.b, ap.me, 'black_org_sig', ap.b.enemies[0].id);
  assert.ok(ap.b.enemies[0].debuffs.atk && ap.b.enemies[0].debuffs.def, 'ちぢんだ');
  // 地球はかいばくだん: 仲間も 少し ダメージ（たおれない）
  const bomb = setup('doraemon', ['rockman']);
  bomb.b.enemies[0].hp = bomb.b.enemies[0].maxHp = 99999;
  bomb.mate.hp = 5;
  use(bomb.b, bomb.me, 'dr_bakudan');
  assert.ok(bomb.b.enemies[0].hp < 99999);
  assert.ok(bomb.mate.alive && bomb.mate.hp >= 1, '仲間は たおれない');
});

test('第26回の 職業の 技は ぜんぶ たたかいで 使える', () => {
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
  assert.ok(used >= 110, `使った 技 ${used}`);
});

test('はじめの 装備（スパイ・少年探てい団・ネコ型ロボット・カッパ）と 新しい 道具', () => {
  const want = {
    spy: { weapon: 'bronze_knife', head: 'spy_glasses' },
    shonen_tantei: { weapon: 'mushimegane' },
    neko_robot: { acc: 'neko_suzu' },
    kappa: { head: 'kappa_sara' },
  };
  for (const [job, eq] of Object.entries(want)) {
    assert.ok(STARTER_EQUIP[job], job);
    const c = newCharacter({ id: job, name: 'テスト', job });
    for (const [slot, id] of Object.entries(eq)) assert.equal(c.equip[slot], id, `${job} の ${slot}`);
    assert.equal(c.equip.armor, 'cloth');
    // 装備できる 物（武器の しゅるい）
    const w = c.equip.weapon;
    if (w) assert.ok(JOBS[job].weapons.includes(ITEMS[w].cat), `${job}: ${w}`);
    const st = computeStats(c);
    assert.ok(st.atk > 0 && st.dfn > 0, job);
  }
  // 新しい 道具: お店で 買える・きたえられる・ランクに あった 強さ・文字
  const sold = new Map();
  for (const [sid, s] of Object.entries(SHOPS)) for (const id of [...(s.items || []), ...(s.more || []).flatMap((m) => m.items)]) sold.set(id, sid);
  for (const id of NEW_ITEMS) {
    const it = ITEMS[id];
    assert.ok(it, id);
    assert.ok(sold.has(id), `${id} は お店で 買える`);
    assert.ok(ITEM_KANA[id], `${id} の よみがな`);
    if (it.type === 'weapon') assert.ok(ITEMS[`${id}+1`], `${id} は きたえられる`);
    for (const s of [it.name, it.desc]) assert.deepEqual(checkText(s), [], `${id}: ${s}`);
  }
  assert.equal(sold.get('mushimegane'), 'village');
  for (const id of ['spy_glasses', 'kappa_sara', 'neko_suzu']) assert.equal(sold.get(id), 'village', `${id} は 村で 買える`);
  // ランク: 同じ ランクの 剣と くらべて 強すぎない
  assert.ok(ITEMS.nichirin.atk <= ITEMS.silver_sword.atk && ITEMS.nichirin.rank === ITEMS.silver_sword.rank);
  assert.ok(ITEMS.kunai.atk <= ITEMS.steel_sword.atk && ITEMS.kunai.rank === 5);
  assert.ok(JOBS.kisatsu.weapons.includes('sword') && JOBS.konoha.weapons.includes('dagger'));
});
