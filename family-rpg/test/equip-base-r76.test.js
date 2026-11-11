// 第76回: 装備の「もとの 強さ」（きたえる 前）・くらべる まど・お仕事いらい板の 大きな はり紙
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ITEMS } from '../public/js/shared/data/items.js';
import '../public/js/shared/data/forge.js';
import { upgradedItem, lbId, upgradeId, LB_MAX } from '../public/js/shared/data/items-forge.js';
import { maxPlus } from '../public/js/shared/data/forge.js';
import { newCharacter, gainExp, expForLevel, computeStats } from '../public/js/shared/stats.js';
import {
  gearBaseId, forgeLevel, forgeLabel, gearBaseStats, gearOwn, gearOwnBase, hasBoost, sameForgeId, gearCompare, baseStronger, withoutFx,
} from '../public/js/shared/gear-base.js';
import { gearRowHtml, itemDetail, gearOwnStats, statChanges } from '../public/js/client/ui/info.js';
import { FAMILY_QUESTS, boardPaper } from '../public/js/shared/data/sidequests-family.js';
import { checkText } from '../tools/kanji-check.mjs';

function warrior(weapon) {
  const c = newCharacter({ id: 'r76', name: 'ユイ', job: 'warrior' });
  gainExp(c, expForLevel(60) - c.exp);
  c.equip = { ...(c.equip || {}), weapon };
  return c;
}

test('第76回: もとの 装備の id・きたえた 回数（ふつう・きたえた・★・れん金・アクセサリー）', () => {
  assert.equal(gearBaseId('tenku_sword'), 'tenku_sword');
  assert.equal(gearBaseId('storm_sword+4'), 'storm_sword');
  assert.equal(gearBaseId('ancient_blade+5_lb2'), 'ancient_blade');
  assert.equal(gearBaseId(null), null);
  assert.equal(gearBaseId('nazo+3'), 'nazo+3', '表に ない 物は その まま');
  assert.equal(forgeLevel('tenku_sword'), 0);
  assert.equal(forgeLevel('storm_sword+4'), 4);
  assert.equal(forgeLevel('ancient_blade+5_lb2'), 7, '★も 1回に 数える（+5★2 は +7 と 同じ 強さ）');
  assert.equal(forgeLabel('ancient_blade+5_lb2'), '+5★2');
  assert.equal(forgeLabel('storm_sword+4'), '+4');
  assert.equal(forgeLabel('tenku_sword'), '');
  // もとの 数字は もとの 装備 その まま（きたえた 数字は 上がっている）
  const b = gearBaseStats('ancient_blade+5_lb2');
  assert.deepEqual(b, { id: 'ancient_blade', name: ITEMS.ancient_blade.name, atk: ITEMS.ancient_blade.atk, def: 0, bonus: { ...ITEMS.ancient_blade.bonus } });
  assert.ok(ITEMS['ancient_blade+5_lb2'].atk > b.atk);
  assert.equal(ITEMS['ancient_blade+5_lb2'].atk, upgradedItem('ancient_blade', ITEMS.ancient_blade, 7).atk);
  assert.equal(gearBaseStats('dragon_mail+3').def, ITEMS.dragon_mail.def);
  // れん金: 同じ 装備でも 効果が あれば「もとと ちがう」
  const c = warrior('tenku_sword');
  assert.equal(hasBoost(c, 'tenku_sword'), false);
  assert.equal(hasBoost(c, 'storm_sword+4'), true);
  c.gearFx = { tenku_sword: [{ k: 'atk', v: 4 }] };
  assert.equal(hasBoost(c, 'tenku_sword'), true);
  assert.equal(withoutFx(c, 'tenku_sword+2').gearFx.tenku_sword, undefined);
  assert.deepEqual(c.gearFx.tenku_sword, [{ k: 'atk', v: 4 }], 'もとの キャラは かえない');
});

test('第76回: 今の 強さと もとの 強さ（きたえ・★・れん金を ぬく）', () => {
  const c = warrior('ancient_blade+5_lb2');
  c.gearFx = { ancient_blade: [{ k: 'atk', v: 4 }] };
  const now = gearOwn(c, 'weapon', 'ancient_blade+5_lb2').find((x) => x.k === 'atk').v;
  const base = gearOwnBase(c, 'weapon', 'ancient_blade+5_lb2').find((x) => x.k === 'atk').v;
  // もと = れん金も ない もとの 装備を 持った 時
  const plain = { ...c, gearFx: {}, equip: { ...c.equip, weapon: 'ancient_blade' } };
  const off = computeStats({ ...c, equip: { ...c.equip, weapon: null } }).atk;
  assert.equal(base, computeStats(plain).atk - off);
  assert.ok(now > base, `${now} > ${base}`);
  // れん金の 攻撃力アップ（v に きたえた 分〈+3 ごとに 1〉を 足して ×2。+5★2 は 7回 → 4+2=6 → 12）が 今に 入っている
  const noFx = gearOwn({ ...c, gearFx: {} }, 'weapon', 'ancient_blade+5_lb2').find((x) => x.k === 'atk').v;
  assert.equal(now - noFx, 12);
  // info.js の gearOwnStats は おなじ 数字
  assert.deepEqual(gearOwnStats(c, 'weapon', 'ancient_blade+5_lb2'), gearOwn(c, 'weapon', 'ancient_blade+5_lb2'));
  // ふつうの 物は 今 = もと
  assert.deepEqual(gearOwn(c, 'weapon', 'tenku_sword'), gearOwnBase(c, 'weapon', 'tenku_sword'));
  // アクセサリー（きたえられない）も そのまま
  assert.deepEqual(gearOwn(c, 'acc', 'fang_charm'), gearOwnBase(c, 'acc', 'fang_charm'));
});

test('第76回: 同じだけ きたえると（かじの 表から 出す。上限・★・店の 品）', () => {
  const c = warrior('ancient_blade+5_lb2');
  // ランク8（+5まで）を 7回 → +5★2
  assert.deepEqual(sameForgeId('tenku_sword', 7, c), { id: 'tenku_sword+5_lb2', level: 7, capped: false, none: false });
  assert.deepEqual(sameForgeId('scale_sword+2', 3, c), { id: 'scale_sword+3', level: 3, capped: false, none: false });
  // とどかない ときは いちばん上（上限＋★LB_MAX）
  const top = maxPlus('storm_sword', c);
  const s = sameForgeId('storm_sword', 20, c);
  assert.deepEqual(s, { id: lbId('storm_sword', top, LB_MAX), level: top + LB_MAX, capped: true, none: false });
  // れん金で きたえられる 回数を ふやした 人は ★なしで とどく
  c.alchemy = { cap: { tenku_sword: 2 } };
  assert.deepEqual(sameForgeId('tenku_sword', 7, c), { id: upgradeId('tenku_sword', 7), level: 7, capped: false, none: false });
  // 店の 品（★1）は きたえられない
  assert.deepEqual(sameForgeId('iron_sword', 3, c), { id: 'iron_sword', level: 0, capped: true, none: true });
  // ぜんぶ 本当に ある 装備（どの 武具・防具でも）
  for (const id of ['tenku_sword', 'dragon_mail', 'shell_mail', 'feather_hat', 'dragon_shield', 'akagane_sword']) {
    if (!ITEMS[id]) continue;
    for (let n = 0; n <= 12; n++) {
      const r = sameForgeId(id, n, c);
      assert.ok(ITEMS[r.id], `${id} ${n}: ${r.id}`);
      assert.equal(gearBaseId(r.id), id);
      assert.ok(r.level <= n);
    }
  }
  // 生まれ変わる 武器は ★なしで 上限を こえて
  const rb = sameForgeId('akagane_sword', 99, c);
  assert.ok(!rb.id.includes('_lb') && rb.capped, rb.id);
});

test('第76回: くらべる まどの 数字（今・もと・差・同じだけ きたえると）と「もとが強い」', () => {
  const c = warrior('ancient_blade+5_lb2');
  c.gearFx = { ancient_blade: [{ k: 'atk', v: 4 }] };
  const cmp = gearCompare(c, 'weapon', 'ancient_blade+5_lb2', 'tenku_sword');
  assert.equal(cmp.cur.label, '+5★2');
  assert.equal(cmp.cur.level, 7);
  assert.equal(cmp.cand.level, 0);
  assert.equal(cmp.cand.same.id, 'tenku_sword+5_lb2');
  const atk = cmp.rows.find((r) => r.k === 'atk');
  assert.ok(atk, '攻撃力の 行');
  assert.equal(atk.curNow, gearOwn(c, 'weapon', 'ancient_blade+5_lb2').find((x) => x.k === 'atk').v);
  assert.equal(atk.curBase, gearOwnBase(c, 'weapon', 'ancient_blade+5_lb2').find((x) => x.k === 'atk').v);
  assert.equal(atk.candNow, gearOwn(c, 'weapon', 'tenku_sword').find((x) => x.k === 'atk').v);
  assert.equal(atk.candBase, atk.candNow, 'きたえていない 物は 今 = もと');
  assert.equal(atk.dNow, atk.candNow - atk.curNow);
  assert.equal(atk.dBase, atk.candBase - atk.curBase);
  assert.ok(atk.dNow < 0 && atk.dBase > 0, '今は 弱いが もとは 強い（家族の ねがいの 場面）');
  assert.equal(atk.candSame, gearOwn(c, 'weapon', 'tenku_sword+5_lb2').find((x) => x.k === 'atk').v);
  assert.equal(atk.dSame, atk.candSame - atk.curNow);
  assert.ok(atk.dSame > 0, '同じだけ きたえれば 強い');
  assert.equal(baseStronger(c, 'weapon', 'ancient_blade+5_lb2', 'tenku_sword'), true);
  assert.equal(baseStronger(c, 'weapon', 'ancient_blade+5_lb2', 'iron_sword'), false);
  assert.equal(baseStronger(c, 'weapon', 'ancient_blade+5_lb2', 'ancient_blade'), false, '同じ もとの 装備は くらべない');
  // 店の 品: 同じだけ きたえる ことは できない
  assert.equal(gearCompare(c, 'weapon', 'ancient_blade+5_lb2', 'iron_sword').cand.same.none, true);
  // 今の 装備の ほうが きたえて いない ときは「同じだけ」は 出さない
  assert.equal(gearCompare(warrior('tenku_sword'), 'weapon', 'tenku_sword', 'storm_sword+4').cand.same, null);
  // 外す（cand が null）: えらぶ 物の 強さは 0
  const off = gearCompare(c, 'weapon', 'ancient_blade+5_lb2', null);
  assert.equal(off.cand, null);
  assert.ok(off.rows.every((r) => r.candNow === 0 && r.dNow === -r.curNow));
});

test('第76回: 一覧の 行に「もと+68」・せつめいに もとの 強さ・くらべる まど', () => {
  const c = warrior('ancient_blade+5_lb2');
  const own = gearOwnStats(c, 'weapon', 'storm_sword+4');
  const html = gearRowHtml(own, statChanges(computeStats(c), computeStats({ ...c, equip: { ...c.equip, weapon: 'storm_sword+4' } })), gearOwnBase(c, 'weapon', 'storm_sword+4'));
  assert.match(html, /<span class="eq-own">攻撃力\+\d+<\/span><span class="eq-d down">↓\d+<\/span><span class="eq-base">もと\+\d+<\/span>/);
  // もとを わたさない ときは 第64回 の まま
  assert.ok(!gearRowHtml(own, []).includes('eq-base'));
  // せつめい（道具・装備の まど）にも もとの 強さ
  assert.match(itemDetail('storm_sword+4'), new RegExp(`もと：攻撃\\+${ITEMS.storm_sword.atk}.*（きたえる前）`));
  assert.ok(!itemDetail('storm_sword').includes('（きたえる前）'));
  // 装備を えらぶ まどは 大きく（よこ: 左に 一らん・右に くらべる まど／たて: 下に くらべる まど）
  const menu = readFileSync(new URL('../public/js/client/ui/menu.js', import.meta.url), 'utf8');
  assert.match(menu, /big: true, tapConfirm: touch/);
  assert.match(menu, /equipCompareHtml\(c, slot, cur,/);
  assert.match(menu, /eq-baseup">もとが強い/);
  const cmpSrc = readFileSync(new URL('../public/js/client/ui/equip-compare.js', import.meta.url), 'utf8');
  assert.match(cmpSrc, /きたえると/);
  const css = readFileSync(new URL('../public/css/style.css', import.meta.url), 'utf8');
  assert.match(css, /\.eq-pick\.big-pick \{/);
  assert.match(css, /grid-template-areas: "t t" "n c" "h c" "m c";/);
});

test('第76回: お仕事いらい板の はり紙は 大きな まど 1まい（中み・○いる／×いない・ごほうび・受ける／やめる）', () => {
  const x = (flags = {}, job = 'neet') => ({ flag: (k) => !!flags[k], c: { job }, party: [] });
  for (const q of FAMILY_QUESTS) {
    const p = boardPaper(x(), q);
    assert.equal(p.name, q.name);
    assert.equal(p.paper, q.paper);
    assert.equal(p.who, q.who);
    assert.equal(p.where, q.where);
    assert.ok(p.jobs.length >= 1 && p.has === false && p.state === null, q.id);
    assert.equal(p.gold, q.reward.gold);
    assert.equal(p.medals, q.reward.medals);
    for (const r of p.rewards) assert.ok(['acc', 'vehicle', 'goods'].includes(r.kind) && r.name && r.n >= 1, `${q.id}: ${JSON.stringify(r)}`);
    assert.equal(p.rewards.length, (q.reward.item ? 1 : 0) + (q.reward.vehicle ? 1 : 0) + (q.reward.goods || []).length, q.id);
    // 系統の 人が いる ときは 名前も
    const yes = boardPaper({ flag: () => false, c: { job: q.roots[0], name: 'ソラ' } }, q);
    assert.equal(yes.has, true, q.id);
    // 受けている・すんだ
    assert.equal(boardPaper(x({ [q.start]: true }), q).state, 'taken');
    assert.equal(boardPaper(x({ [q.done]: true }), q).state, 'done');
    assert.deepEqual(checkText(JSON.stringify(p)), [], q.id);
  }
  const src = readFileSync(new URL('../public/js/shared/data/sidequests-family.js', import.meta.url), 'utf8');
  assert.match(src, /'このいらいを、うける？', \['うける', 'やめる'\]/);
  const pop = readFileSync(new URL('../public/js/client/ui/paper-pop.js', import.meta.url), 'utf8');
  assert.match(pop, /○いる/);
  assert.match(pop, /×いない/);
  const script = readFileSync(new URL('../public/js/client/ui/script.js', import.meta.url), 'utf8');
  assert.match(script, /paperPop\(this, a\[3\], a\[1\]/);
});
