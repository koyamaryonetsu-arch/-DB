// 第96回 T班: 作戦ごとの 動き（家族の 声: ガンガンは 最強の技や 弱点・バッチリは バフ・デバフ・回復も・いのちだいじには 8わりで 回復・
//   MPせつやくは MP を 切らさない）と、新しい 作戦の キー（savemp）が こわれない こと（ai.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { mpCost } from '../public/js/shared/stats.js';
import { decideAlly, TACTICS, LEGACY_TACTICS, tacticsOf, mpReserve, saveFloor, prim, tacticsItemHtml } from '../public/js/shared/ai.js';
import { exportCode, parseCode } from '../public/js/shared/world/transfer.js';
import { checkText } from '../tools/kanji-check.mjs';
import { jobChar } from '../tools/sim-jobs.mjs';

// 1人（＋仲間）で 敵と 戦う。敵は 何も しない・HP は 多い
function mk({ job = 'daikenja', lv = 60, tac = 'balanced', abilities, enemies = ['rockman'], boss = false, mates = [], seed = 1, hp = 99999, resist } = {}) {
  const me = jobChar(job, lv, 7, 'me');
  const allies = [{ char: me, auto: true, kind: 'support', tactics: tac }];
  for (const [i, j] of mates.entries()) allies.push({ char: jobChar(j, lv, 7, `m${i}`), auto: true, kind: 'support', tactics: tac });
  const b = new Battle({ rng: makeRng(seed), allies, enemies, boss, canFlee: false });
  for (const e of b.enemies) {
    e.actions = [{ w: 1, id: 'm_nothing' }];
    e.hp = e.maxHp = hp;
    e.resist = { ...(resist || {}) };
  }
  const c = b.allies[0];
  if (abilities) c.abilities = abilities.slice();
  c.autoOff = [];
  return { b, c };
}
const pick = (o, n = 20) => {
  const cnt = {};
  for (let s = 1; s <= n; s++) {
    const { b, c } = mk({ ...o, seed: s });
    o.prep?.(b, c);
    const cmd = decideAlly(b, c);
    const k = cmd.type === 'ability' ? cmd.id : cmd.type;
    cnt[k] = (cnt[k] || 0) + 1;
  }
  return cnt;
};

test('作戦の 一覧: キーと 名前は 前の まま・新しい MPせつやく・せつめいは 漢字の きまり', () => {
  assert.deepEqual(Object.keys(TACTICS), ['balanced', 'aggressive', 'heal', 'savemp', 'nomp', 'manual']);
  assert.equal(TACTICS.balanced.name, 'バッチリがんばれ');
  assert.equal(TACTICS.aggressive.name, 'ガンガンいこうぜ');
  assert.equal(TACTICS.heal.name, 'いのちだいじに');
  assert.equal(TACTICS.nomp.name, 'じゅもんせつやく');
  assert.equal(TACTICS.manual.name, 'めいれいさせろ');
  assert.equal(TACTICS.savemp.name, 'MPせつやく');
  for (const [k, x] of Object.entries(TACTICS)) {
    assert.ok(x.desc && x.desc.length < 50, `${k}: 1行の せつめい`);
    const bad = checkText(`${x.name}${x.desc}`).filter((p) => p.kind !== 'kana');
    assert.equal(bad.length, 0, `${k}: ${JSON.stringify(bad)}`);
    assert.ok(!/\s/.test(x.desc), `${k}: スペース なし`);
    assert.ok(tacticsItemHtml(x).includes(x.desc));
  }
});

test('ガンガンいこうぜ: いちばん 強い 技（中くらいの 技を 使わない）・弱点の 技・敵の 数に 合った 技', () => {
  // 1体: メラゾーマ（いちばん 強い）。前の えらび方では メラミ なども まざった
  const one = pick({ tac: 'aggressive', abilities: ['mera', 'merami', 'merazoma'] });
  assert.equal(one.merazoma, 20, JSON.stringify(one));
  // 炎が きかない・氷が 弱点: 氷の 技
  const weak = pick({ tac: 'aggressive', abilities: ['merazoma', 'hyado', 'hyadaruko'], resist: { fire: 0, ice: 2 } });
  assert.equal((weak.hyado || 0) + (weak.hyadaruko || 0), 20, JSON.stringify(weak));
  assert.ok(!weak.merazoma);
  // 敵が 多い: 全体の 技
  const many = pick({ tac: 'aggressive', abilities: ['merazoma', 'iora'], enemies: ['rockman', 'rockman', 'rockman', 'rockman'] });
  assert.equal(many.iora, 20, JSON.stringify(many));
  // バフ・デバフは 使わない（ボスでも）
  const boss = pick({ tac: 'aggressive', abilities: ['merazoma', 'rukani', 'baikiruto', 'piorimu'], boss: true }, 40);
  assert.equal(boss.merazoma, 40, JSON.stringify(boss));
  // 回復は だれかが 3わり いか の 時だけ
  const hurt = (r) => ({ prep: (b, c) => { c.hp = Math.floor(c.maxHp * r); } });
  assert.ok(!pick({ tac: 'aggressive', abilities: ['merazoma', 'behoimi'], ...hurt(0.4) }).behoimi, '4わりでは 回復しない');
  assert.equal(pick({ tac: 'aggressive', abilities: ['merazoma', 'behoimi'], ...hurt(0.25) }).behoimi, 20, '3わり いかで 回復');
});

test('ガンガンいこうぜ: MP が 足りなく なったら、使える 中で いちばん 強い 物', () => {
  const r = pick({ tac: 'aggressive', abilities: ['mera', 'merami', 'merazoma'], prep: (b, c) => { c.mp = mpCost(c.penChar, 'merami') + 1; } });
  assert.equal(r.merami, 20, JSON.stringify(r));
});

test('バッチリがんばれ: 弱点の 技・ボスでは バフ・デバフも・HP 5わりで 回復', () => {
  const weak = pick({ tac: 'balanced', abilities: ['merami', 'hyadaruko'], resist: { fire: 0.5, ice: 2 } });
  assert.equal(weak.hyadaruko, 20, JSON.stringify(weak));
  // 強い 敵（長い 戦い）: 攻撃の あいまに 強くする 技・弱くする 技
  let buff = 0, deb = 0, all = 0;
  for (let s = 1; s <= 160; s++) {
    const { b, c } = mk({ tac: 'balanced', abilities: ['merazoma', 'rukani', 'baikiruto', 'piorimu'], mates: ['god_hand'], seed: s });
    const cmd = decideAlly(b, c);
    all++;
    const t = cmd.type === 'ability' ? prim(ABILITIES[cmd.id]).type : '';
    if (t === 'buff') buff++;
    if (t === 'debuff') deb++;
  }
  assert.ok(buff >= 5 && deb >= 5, `バフ ${buff}・デバフ ${deb} / ${all}`);
  assert.ok(buff + deb < all * 0.6, '攻撃も する');
  // ボス戦: バフは 使う・敵を 弱く する 技は 使わない（第3部の ボスの 完全オートの 勝ちやすさを かえない）
  let bossBuff = 0, bossDeb = 0;
  for (let s = 1; s <= 120; s++) {
    const { b, c } = mk({ tac: 'balanced', abilities: ['merazoma', 'rukani', 'baikiruto', 'piorimu'], boss: true, mates: ['god_hand'], seed: s });
    const t = ((cmd) => (cmd.type === 'ability' ? prim(ABILITIES[cmd.id]).type : ''))(decideAlly(b, c));
    if (t === 'buff') bossBuff++;
    if (t === 'debuff') bossDeb++;
  }
  assert.ok(bossBuff >= 5 && bossDeb === 0, `ボス: バフ ${bossBuff}・デバフ ${bossDeb}`);
  // デバフが きかない 敵（耐性 0）・もう かかって いる 敵には 使わない
  let deb0 = 0;
  for (let s = 1; s <= 80; s++) {
    const { b, c } = mk({ tac: 'balanced', abilities: ['merazoma', 'rukani'], seed: s, resist: { debuff: 0 } });
    if (decideAlly(b, c).id === 'rukani') deb0++;
    const r2 = mk({ tac: 'balanced', abilities: ['merazoma', 'rukani'], seed: s });
    r2.b.enemies[0].debuffs.def = { mult: 0.75, lv: 1, left: 3 };
    if (decideAlly(r2.b, r2.c).id === 'rukani') deb0++;
  }
  assert.equal(deb0, 0);
  // ふつうの 魔物には 使わない
  const field = pick({ tac: 'balanced', abilities: ['merazoma', 'rukani', 'baikiruto'], hp: 300 }, 40);
  assert.ok(!field.rukani && !field.baikiruto, JSON.stringify(field));
  // 回復: 5わり いか
  assert.equal(pick({ tac: 'balanced', abilities: ['merazoma', 'behoimi'], prep: (b, c) => { c.hp = Math.floor(c.maxHp * 0.45); } }).behoimi, 20);
  assert.ok(!pick({ tac: 'balanced', abilities: ['merazoma', 'behoimi'], prep: (b, c) => { c.hp = Math.floor(c.maxHp * 0.7); } }).behoimi);
});

test('いのちだいじに: HP 8わり いかで 回復を 先に・2人 いじょうは 全体の 回復・たおれた 仲間は 生き返らせる', () => {
  const ab = ['merazoma', 'behoimi', 'behomara', 'zaoraru_x'].filter((id) => ABILITIES[id]);
  const at = (r) => ({ prep: (b, c) => { c.hp = Math.floor(c.maxHp * r); } });
  assert.equal(pick({ tac: 'heal', abilities: ab, ...at(0.79) }).behoimi, 20, '8わり いか');
  assert.equal(pick({ tac: 'heal', abilities: ab, ...at(0.8) }).behoimi, 20, 'ちょうど 8わり');
  assert.ok(!pick({ tac: 'balanced', abilities: ab, ...at(0.79) }).behoimi, 'バッチリは まだ 回復しない');
  // 2人 へって いる: 全体の 回復
  const two = pick({ tac: 'heal', abilities: ab, mates: ['god_hand'], prep: (b) => { for (const a of b.allies) a.hp = Math.floor(a.maxHp * 0.7); } });
  assert.equal(two.behomara, 20, JSON.stringify(two));
  // 1人を 回復する 技が 無くても 全体の 回復で
  assert.equal(pick({ tac: 'heal', abilities: ['merazoma', 'behomara'], ...at(0.75) }).behomara, 20);
  // たおれた 仲間: 生き返らせるのが 先
  const rev = Object.keys(ABILITIES).find((id) => ABILITIES[id].effect?.type === 'revive' && ABILITIES[id].target === 'deadAlly' && !ABILITIES[id].hidden && (ABILITIES[id].mp || 0) <= 20);
  const dead = pick({ tac: 'heal', abilities: ['merazoma', 'behoimi', rev], mates: ['god_hand'], prep: (b, c) => { c.hp = Math.floor(c.maxHp * 0.5); const m = b.allies[1]; m.hp = 0; m.alive = false; } });
  assert.equal(dead[rev], 20, JSON.stringify(dead));
});

test('いのちだいじに: みんな 8わりより 多い 時は バッチリがんばれと 同じ 行動', () => {
  let same = 0, n = 0;
  for (let s = 1; s <= 60; s++) {
    const o = { abilities: ['merami', 'merazoma', 'iora', 'rukani', 'baikiruto', 'piorimu', 'behoimi'], boss: s % 2 === 0, mates: ['god_hand', 'high_priest'], enemies: ['rockman', 'rockman'], seed: s };
    const x = mk({ ...o, tac: 'heal' });
    const y = mk({ ...o, tac: 'balanced' });
    for (const [b, c] of [[x.b, x.c], [y.b, y.c]]) for (const a of b.allies) a.hp = Math.ceil(a.maxHp * 0.85);
    n++;
    if (JSON.stringify(decideAlly(x.b, x.c)) === JSON.stringify(decideAlly(y.b, y.c))) same++;
  }
  assert.equal(same, n);
});

test('MPせつやく: とって おく MP を 攻撃・バフで 切らない（回復は 使って よい）', () => {
  const { c } = mk({ job: 'high_priest', tac: 'savemp' });
  const R = mpReserve(c);
  assert.ok(R >= c.maxMp / 4 - 1e-9, `とって おく MP ${R} / ${c.maxMp}`);
  // MP が とって おく 分の 少し 上: メラゾーマは 使わない
  const r = pick({ tac: 'savemp', abilities: ['merazoma', 'mera', 'behoimi', 'baikiruto'], boss: false, prep: (b, x) => { x.mp = Math.ceil(mpReserve(x)) + mpCost(x.penChar, 'merazoma') - 1; } });
  assert.ok(!r.merazoma, JSON.stringify(r));
  // 回復は とって おいた 分で
  const h = pick({ tac: 'savemp', abilities: ['merazoma', 'behoimi'], prep: (b, x) => { x.mp = mpCost(x.penChar, 'behoimi'); x.hp = Math.floor(x.maxHp * 0.4); } });
  assert.equal(h.behoimi, 20);
  // 弱い 敵（ふつうの 攻撃で たおせる）には ふつうの 攻撃
  const easy = pick({ job: 'hero', tac: 'savemp', abilities: ['merazoma', 'iora'], hp: 30 });
  assert.equal(easy.attack, 20, JSON.stringify(easy));
  // 知らない キーでも
  assert.equal(tacticsOf({ tactics: 'savemp' }), TACTICS.savemp);
});

test('MPせつやく: 長い 戦い（ボス）でも はじめに 使い切らず、さいごまで 回復が できる', () => {
  const run = (tac) => {
    const lv = 60;
    const party = ['high_priest', 'daikenja', 'god_hand', 'hero'].map((j, i) => jobChar(j, lv, 7, `p${i}`));
    const b = new Battle({ rng: makeRng(5), allies: party.map((ch) => ({ char: ch, auto: true, kind: 'support', tactics: tac })), enemies: ['rockman'], boss: true, canFlee: false });
    const boss = b.enemies[0];
    boss.hp = boss.maxHp = 60000;
    boss.atk = Math.round(b.allies[0].dfn * 2.4);
    boss.resist = {};
    boss.actions = [{ w: 1, id: 'attack' }];
    const pr = b.allies[0];
    let minAtk = Infinity, lowest = Infinity;
    const mpOf = new Map();
    for (let t = 0; t < 240000 && !b.over; t += 50) {
      for (const a of b.allies) mpOf.set(a.id, a.mp);
      for (const e of b.tick(50)) {
        if (e.t !== 'act' || e.id !== pr.id) continue;
        const ab = e.ability && ABILITIES[e.ability];
        if (ab && !['heal', 'revive', 'cure', 'mpHeal'].includes(prim(ab).type)) minAtk = Math.min(minAtk, pr.mp - mpReserve(pr));
      }
      lowest = Math.min(lowest, pr.mp);
    }
    return { minAtk, lowest, mp: pr.mp, heal: mpCost(pr.penChar, 'behoimi'), R: mpReserve(pr), boss: boss.hp / boss.maxHp, over: b.over };
  };
  const s = run('savemp');
  assert.ok(s.minAtk >= -1, `攻撃・バフの あと とって おく MP を 切らない（${s.minAtk}）`);
  assert.ok(s.lowest > 0, `MP が 0 に ならない（いちばん 少ない 時 ${s.lowest}・とって おく ${s.R.toFixed(0)}）`);
  assert.ok(s.mp >= s.heal, `さいごまで 回復の MP（${s.mp}）`);
});

test('MPせつやく: ボスでは のこりの MP を 戦いの 長さに ならす（敵の HP が 多い 間は 多めに のこす）', () => {
  const { b, c } = mk({ job: 'daikenja', tac: 'savemp', boss: true });
  const full = saveFloor(b, c);
  b.enemies[0].hp = Math.round(b.enemies[0].maxHp * 0.2);
  b._fightW = null;
  const late = saveFloor(b, c);
  assert.ok(full > late && late >= mpReserve(c) - 1e-9, `${full.toFixed(0)} > ${late.toFixed(0)} ≧ ${mpReserve(c).toFixed(0)}`);
  assert.ok(full < c.maxMp, 'はじめから 少しは 使える');
});

test('知らない 作戦の キー・古い セーブ: こわれずに バッチリがんばれ（引っこしコードも そのまま）', () => {
  for (const k of ['zzz', undefined, null, '', 'constructor', '__proto__']) {
    const { b, c } = mk({ abilities: ['merazoma'] });
    c.tactics = k;
    assert.equal(tacticsOf(c), TACTICS.balanced, String(k));
    const cmd = decideAlly(b, c);
    assert.ok(cmd && cmd.type, String(k));
  }
  // 敵の がわの うつし身は 前の えらび方
  assert.equal(tacticsOf({ mirrorOf: 'x', tactics: 'aggressive' }), LEGACY_TACTICS.aggressive);
  assert.equal(tacticsOf({ mimic: {}, tactics: 'savemp' }), LEGACY_TACTICS.balanced);
  // 引っこしコード: 自分・仲間の 作戦 savemp が のこる
  const ch = jobChar('hero', 30, 5, 'ヒナ');
  ch.id = 'p_r96';
  ch.tactics = 'savemp';
  const mate = jobChar('priest', 20, 5, 'ミーナ');
  mate.tactics = 'savemp';
  ch.companions = [{ key: 'npc_mina', char: mate }];
  const r = parseCode(exportCode(ch));
  assert.ok(r.ok, r.reason);
  assert.equal(r.char.tactics, 'savemp');
  assert.equal(r.char.companions[0].char.tactics, 'savemp');
});

test('1回の 行動を きめる 計算は 重くない（2ミリ秒 いない）', () => {
  for (const tac of ['balanced', 'aggressive', 'heal', 'savemp']) {
    const { b, c } = mk({ tac, boss: true, mates: ['god_hand', 'high_priest', 'hero'], enemies: ['rockman', 'rockman', 'rockman', 'rockman'] });
    for (let i = 0; i < 50; i++) decideAlly(b, c);
    // ほかの テストと ならんで 動く ので、100回ずつ 3回 はかって いちばん 速い 物
    let ms = Infinity;
    for (let k = 0; k < 3; k++) {
      const t0 = performance.now();
      const N = 100;
      for (let i = 0; i < N; i++) { b._fightW = null; decideAlly(b, c); }
      ms = Math.min(ms, (performance.now() - t0) / N);
    }
    assert.ok(ms < 2, `${tac}: ${ms.toFixed(3)}ms`);
  }
});
