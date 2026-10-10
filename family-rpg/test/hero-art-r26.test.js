// 主人公の え（render/hero*.js・hero-r26.js）: 第26回の 新しい 職業 20この 服・ぼうし・もちもの・からだと、
// 看板の技（'<職業の id>_sig'）の エフェクト（render/battlefx-jobs4.js）と 音（sfx-r26.js）
// 職業の データ（data/jobs.js・技）は べつの 人が つくるので、ここでは 職業の id を ちょくせつ わたして 絵だけを たしかめる
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JOBS } from '../public/js/shared/data/jobs.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { paintHero } from '../public/js/client/render/hero.js';
import { outfitOf, jobBody } from '../public/js/client/render/hero-outfit.js';
import { headOf } from '../public/js/client/render/hero-gear.js';
import { R26_OUTFIT, R26_BODY, R26_HAT, R26_BODY_HAT, R26_OLD_LOOK } from '../public/js/client/render/hero-r26.js';
import { lookToOpts } from '../public/js/client/render/chars.js';
import { Effects, BW, BH } from '../public/js/client/render/battlefx.js';
import { JOB_FINE, playJobFx } from '../public/js/client/render/battlefx-jobs.js';
import { JOB2_FINE, JOB2_SFX, PARTY_ANIMS, playJob2Fx } from '../public/js/client/render/battlefx-jobs2.js';
import { JOB3_FINE, JOB3_SFX, PARTY_ANIMS3, playJob3Fx } from '../public/js/client/render/battlefx-jobs3.js';
import { JOB4_FINE, JOB4_SFX, SIG4, SIG4_JOBS, sigAnim, playJob4Fx } from '../public/js/client/render/battlefx-jobs4.js';
import { playCh4Fx } from '../public/js/client/render/battlefx-ch4.js';
import { SFX_R26 } from '../public/js/client/sfx-r26.js';

const DIRS = ['down', 'left', 'up', 'right'];
// 職業の id（データの 人との やくそく。ならびも この とおり）
const JOBS20 = ['rakuten_cardman', 'kisatsu', 'enbashira', 'hinokami', 'spy', 'assassin', 'black_org', 'esper', 'shonen_tantei', 'oshiri_tantei',
  'meitantei', 'creator', 'neko_robot', 'mimi_robot', 'doraemon', 'kappa', 'hanakappa', 'kinniku_kappa', 'konoha', 'hokage'];
const SIGS = JOBS20.map((j) => `${j}_sig`);
// オーラ（すける ピクセル）が ある 職業
const AURA = new Set(['esper', 'hokage']);
const OUTLINE = 0x1b1330;

// 不透明な ピクセルの かず・ふちに さわるか・すける ピクセル・いろの かず・りんかくの いろの わりあい
function inspect(img) {
  const { w, h, rgba } = img;
  let n = 0, semi = 0, edge = false, rim = 0, rimOut = 0;
  const cols = new Set();
  const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && rgba[(y * w + x) * 4 + 3] === 255;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, a = rgba[i + 3];
      if (a === 0) continue;
      n++;
      if (y === 0 || x === 0 || x === w - 1) edge = true;
      if (a < 255) { semi++; continue; }
      const c = (rgba[i] << 16) | (rgba[i + 1] << 8) | rgba[i + 2];
      cols.add(c);
      if (!solid(x - 1, y) || !solid(x + 1, y) || !solid(x, y - 1) || !solid(x, y + 1)) { rim++; if (c === OUTLINE) rimOut++; }
    }
  }
  return { n, semi, edge, colors: cols.size, rimOut: rim ? rimOut / rim : 0 };
}
const key = (img) => Buffer.from(img.rgba).toString('base64');
// 1まいの えの きまり（かけている・はみ出さない・パレット）
function checkImg(img, job, what) {
  const r = inspect(img);
  assert.ok(r.n > img.w * img.h * 0.12, `${what} が かけている`);
  assert.ok(!r.edge, `${what} が ふちに さわる`);
  // パレット: いろは 120しょく まで（いまの 職業の いちばん おおい えは 111しょく）、そとの ふちは りんかくの いろ
  assert.ok(r.colors <= 120, `${what} の いろが おおすぎる（${r.colors}）`);
  assert.ok(r.rimOut >= 0.45, `${what} の りんかくが たりない（${r.rimOut.toFixed(2)}）`);
  // すける ピクセルは オーラの ある 職業だけ
  if (!AURA.has(job)) assert.equal(r.semi, 0, `${what} に すける ピクセル`);
  return r;
}

test('第26回の 職業: 20この 職業 すべてに 服・からだ・古い え が ある（データが なくても）', () => {
  assert.deepEqual(Object.keys(R26_OUTFIT), JOBS20);
  assert.deepEqual(SIG4_JOBS, JOBS20);
  for (const job of JOBS20) {
    assert.ok(R26_OLD_LOOK[job], `${job} の 古い え`);
    // ぼうしは 職業の ぼうし か からだの ぼうし の どちらか だけ
    assert.ok(!(R26_HAT[job] && R26_BODY_HAT[job]), `${job} の ぼうしが ふたつ`);
  }
  for (const job of Object.keys(R26_BODY)) assert.ok(JOBS20.includes(job), job);
  // まだ JOBS に ない 職業でも、ある 職業でも かける（データの 人が あとで たす）
  for (const job of JOBS20) {
    if (JOBS[job]) assert.equal(typeof JOBS[job].name, 'string', job);
    const img = paintHero({ body: 0, style: 'short' }, job, undefined, 'down', 0, 4);
    assert.ok(inspect(img).n > 500, job);
  }
  // しらない 職業は 戦士の 服（こわれない）
  const a = paintHero({ body: 0, style: 'short' }, 'no_such_job_r26', undefined, 'down', 0, 4);
  assert.ok(inspect(a).n > 500);
});

test('第26回の 職業の 服: 男女・4方向・かみがた・2コマ・2つの 大きさで かけて、はみ出さない（パレットの きまり）', () => {
  for (const job of JOBS20) {
    for (const body of [0, 1]) {
      for (const dir of DIRS) {
        for (const [style, f, tone] of [['short', 0, 'light'], ['twin', 1, 'deep']]) {
          for (const res of [4, 8]) {
            const img = paintHero({ body, style, hcol: 'brown', tone }, job, undefined, dir, f, res);
            checkImg(img, job, `${job} ${body} ${dir} ${style} f${f} res${res}`);
          }
        }
      }
    }
  }
});

test('第26回の 職業の 服: そうびを かえても はみ出さない（ぶき・たて・よろい・かぶと）', () => {
  const EQS = [',cloth,,', 'iron_sword,cloth,,', 'iron_sword,iron_armor,iron_shield,iron_helm', ',chain_mail,,leather_hat', 'iron_sword,cloth,iron_shield,'];
  for (const job of JOBS20) {
    for (const eq of EQS) {
      for (const body of [0, 1]) {
        for (const dir of DIRS) {
          const img = paintHero({ body, style: 'long', hcol: 'black' }, job, eq, dir, body, 4);
          checkImg(img, job, `${job} ${eq} ${body} ${dir}`);
        }
      }
      const big = paintHero({ body: 0, style: 'afro' }, job, eq, 'down', 0, 8);
      checkImg(big, job, `${job} ${eq} res8`);
    }
  }
});

test('第26回の 職業の 服: どれも ちがう え（にている いまの 職業とも ちがう）', () => {
  const LIKE = ['warrior', 'ninja', 'samurai', 'salaryman', 'bucho', 'shacho', 'schoolkid', 'middleschooler', 'chuuni', 'cook', 'okan', 'shachiku', 'hero', 'monk'];
  for (const body of [0, 1]) {
    for (const dir of DIRS) {
      const seen = new Map();
      for (const job of [...LIKE, ...JOBS20]) {
        const k = key(paintHero({ body, style: 'short' }, job, job === 'warrior' ? '' : ',cloth,,', dir, 0, 4));
        assert.ok(!seen.has(k), `${job} body${body} ${dir} が ${seen.get(k)} と おなじ え`);
        seen.set(k, job);
      }
    }
  }
});

test('第26回の 職業の 服: 服の しゅるい・ぼうし・羽織・もちもの（布の服の とき）', () => {
  const Lk = { cloth: '#3f7fd0', skin: 0 };
  const O = (job, armor = 'cloth', fem = false) => outfitOf(Lk, job, armor, fem);
  const KIND = {
    rakuten_cardman: 'tights26', kisatsu: 'gakuran', enbashira: 'gakuran', hinokami: 'gakuran', spy: 'suit', assassin: 'suit', black_org: 'coat', esper: 'gakuran',
    shonen_tantei: 'kid', oshiri_tantei: 'suit', meitantei: 'suit', creator: 'work', neko_robot: 'mascot26', mimi_robot: 'mascot26', doraemon: 'mascot26',
    kappa: 'kappa26', hanakappa: 'kappa26', kinniku_kappa: 'kappa26', konoha: 'vest26', hokage: 'jump26',
  };
  for (const [job, k] of Object.entries(KIND)) {
    assert.equal(O(job).kind, k, job);
    assert.equal(O(job, null).kind, k, `${job} よろい なし`);
    assert.equal(O(job, 'cloth', true).kind, k, `${job} 女性`);
  }
  // 羽織（きさつ隊・炎柱・日の呼吸）と こしの 刀。よろいを きると なくなる
  for (const job of ['kisatsu', 'enbashira', 'hinokami']) {
    assert.ok(O(job).haori && O(job).sheath, job);
    assert.ok(!O(job, 'iron_armor').haori, `${job} てつの よろい`);
  }
  assert.ok(O('enbashira').haori.flame, '炎柱の 羽織の すそは ほのお');
  assert.ok(O('hokage').cape?.flame, '火影の マントの すそは ほのお');
  assert.ok(O('rakuten_cardman').cape, 'カードマンの マント');
  assert.ok(O('neko_robot').mascot && O('doraemon').mascot, 'ロボットの おなかと すず');
  assert.ok(O('creator').apron && O('creator').drug26, 'ドラッグストアの エプロン');
  assert.ok(O('meitantei').glasses, '名探ていの めがね');
  assert.ok(O('shonen_tantei').badge26, '少年探てい団の バッジ');
  // ぼうし（布の服 か よろい なし の とき）
  const hat = (job, armor = 'cloth') => headOf(null, job, armor, O(job, armor))?.kind || null;
  const HAT = { rakuten_cardman: 'cowl', black_org: 'fedora26', konoha: 'hitai26', hokage: 'hitai26', neko_robot: 'robohood26', mimi_robot: 'robohood26', doraemon: 'robohood26', kappa: 'sara26', hanakappa: 'flower26', kinniku_kappa: 'garlic26', spy: null, kisatsu: null };
  for (const [job, h] of Object.entries(HAT)) assert.equal(hat(job), h, job);
  assert.ok(headOf(null, 'neko_robot', 'cloth', O('neko_robot')).ears, 'ネコ型ロボットは みみ つき');
  assert.ok(!headOf(null, 'mimi_robot', 'cloth', O('mimi_robot')).ears, '耳無しは みみ なし');
  // よろいを きると 職業の ぼうしは なくなるが、からだの ぼうし（フード・おさら・花・ニンニク）は のこる。かぶとを かぶると かぶと
  for (const job of ['rakuten_cardman', 'black_org', 'konoha', 'hokage']) assert.equal(hat(job, 'iron_armor'), null, job);
  for (const job of ['neko_robot', 'doraemon', 'kappa', 'hanakappa', 'kinniku_kappa']) {
    assert.ok(hat(job, 'iron_armor'), `${job} てつの よろい`);
    assert.equal(headOf('iron_helm', job, 'iron_armor', O(job, 'iron_armor')).kind, 'helmet', `${job} かぶと`);
  }
  // 古い え（chars.js）でも 職業の 服（戦士の 服に ならない）
  const warrior = lookToOpts({}, 'warrior', ',cloth,,');
  for (const job of JOBS20) {
    const o = lookToOpts({}, job, ',cloth,,');
    assert.ok(o.outfit, `${job} の 古い え`);
    assert.notDeepEqual(o, warrior, `${job} の 古い え`);
  }
});

test('第26回の 職業の からだ: カッパの 緑の はだ・ロボットの ひげ・サングラス・もちものは よろいを きても のこる', () => {
  const look = { body: 0, style: 'short', hcol: 'black', tone: 'light' };
  const skinPx = (img) => {
    // かおの まんなか（はだ）の いろ
    const { w, rgba } = img, x = Math.round(w / 2), y = Math.round(img.h * 0.4);
    const i = (y * w + x) * 4;
    return [rgba[i], rgba[i + 1], rgba[i + 2]];
  };
  for (const job of ['kappa', 'hanakappa', 'kinniku_kappa']) {
    assert.ok(jobBody(job).skin, job);
    for (const eq of [undefined, ',iron_armor,,']) {
      const [r, g, b] = skinPx(paintHero(look, job, eq, 'down', 0, 8));
      assert.ok(g > r + 20 && g > b, `${job} ${eq} の はだが 緑（${r},${g},${b}）`);
    }
  }
  const [r0, g0] = skinPx(paintHero(look, 'warrior', undefined, 'down', 0, 8));
  assert.ok(r0 > g0, 'ふつうの はだ');
  assert.ok(jobBody('doraemon').whisker && jobBody('doraemon').nose && !jobBody('neko_robot').whisker, 'ドラえもんの ひげと はな');
  assert.ok(jobBody('spy').sun && jobBody('hinokami').hanafuda && jobBody('oshiri_tantei').cleft, 'サングラス・花札・われめ');
  assert.equal(jobBody('kinniku_kappa').armW > 1.3, true, 'きんにく');
  // かおの しるしは よろいを きても のこる（よろいの え どうし で くらべる）
  for (const job of ['spy', 'doraemon', 'hinokami', 'oshiri_tantei', 'kappa']) {
    for (const eq of [',iron_armor,,', 'iron_sword,cloth,,']) {
      assert.notEqual(key(paintHero(look, job, eq, 'down', 0, 4)), key(paintHero(look, 'warrior', eq, 'down', 0, 4)), `${job} ${eq}`);
    }
  }
  // もちもの（カード・スプーン・虫めがね・薬の はこ・きゅうり・まきもの・かい中電とう）は たての ない 手に。たてを もつと たて
  for (const job of ['rakuten_cardman', 'esper', 'oshiri_tantei', 'creator', 'kappa', 'konoha', 'shonen_tantei']) {
    assert.ok(jobBody(job).prop, job);
    const withProp = key(paintHero(look, job, 'iron_sword,iron_armor,,', 'down', 0, 4));
    const noProp = key(paintHero(look, job, 'iron_sword,iron_armor,iron_shield,', 'down', 0, 4));
    assert.notEqual(withProp, noProp, `${job} の もちもの`);
  }
  // おしり探てい・はなかっぱは かみが ない（じぶんの かみがたに かかわらず おなじ）
  for (const job of ['oshiri_tantei', 'hanakappa', 'kinniku_kappa', 'neko_robot', 'doraemon']) {
    for (const dir of DIRS) {
      assert.equal(key(paintHero({ body: 0, style: 'short', hcol: 'black' }, job, undefined, dir, 0, 4)), key(paintHero({ body: 0, style: 'afro', hcol: 'black' }, job, undefined, dir, 0, 4)), `${job} ${dir}: かみ なし`);
    }
  }
  // 炎柱・日の呼吸・カッパは かみの いろが きまって いる
  for (const job of ['enbashira', 'hinokami', 'kappa']) {
    assert.equal(key(paintHero({ body: 0, style: 'short', hcol: 'black' }, job, undefined, 'down', 0, 4)), key(paintHero({ body: 0, style: 'short', hcol: 'pink' }, job, undefined, 'down', 0, 4)), `${job}: かみの いろ`);
  }
  // オーラは 2コマで ゆらめく
  for (const job of AURA) {
    assert.ok(inspect(paintHero(look, job, undefined, 'down', 0, 4)).semi > 100, `${job} の オーラ`);
    assert.notEqual(key(paintHero(look, job, undefined, 'down', 0, 4)), key(paintHero(look, job, undefined, 'down', 1, 4)), `${job} の 2コマ`);
  }
});

// たたかいの がめんに かく ための ブラウザの まね（よばれた かずと、NaN の かずを かぞえる）
function fakeCtx() {
  const log = { calls: 0, nan: [] };
  let ctx;
  const fn = (name) => (...args) => {
    log.calls++;
    if (args.some((a) => typeof a === 'number' && !Number.isFinite(a))) log.nan.push(name);
    return ctx;
  };
  ctx = new Proxy({}, {
    get: (o, k) => (k in o ? o[k] : typeof k === 'string' ? fn(k) : undefined),
    set: (o, k, v) => { if (typeof v === 'number' && !Number.isFinite(v)) log.nan.push(String(k)); o[k] = v; return true; },
  });
  return { ctx, log };
}
function withFakeDocument(fn) {
  const sprite = fakeCtx();
  const had = 'document' in globalThis, prev = globalThis.document;
  globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => sprite.ctx }) };
  try { return fn(); } finally { if (had) globalThis.document = prev; else delete globalThis.document; }
}
function runFx(fx, limit = 4000) {
  const { ctx, log } = fakeCtx();
  let t = 0;
  while (fx.parts.length && t < limit) {
    fx.update(16);
    t += 16;
    if (t % 48 === 0) fx.draw(ctx);
  }
  return { t, log };
}

test('第26回の 看板の技: 20この エフェクトが 単体・全体・みかた（がめんの した）で 出て、すぐ あたり、1.8びょうで おわる', () => {
  assert.deepEqual([...SIG4], SIGS);
  withFakeDocument(() => {
    for (const anim of SIGS) {
      const runs = [
        { ts: [{ x: 128, y: 70 }], foe: true },
        { ts: [{ x: 60, y: 70 }, { x: 128, y: 88 }, { x: 196, y: 70 }], foe: true, crit: true },
        { ts: [{ x: 228, y: 40 }], foe: true },
        // みかたに かける とき（battle.js と おなじ ばしょ）
        { ts: [{ x: BW / 2, y: BH * 0.62 }], foe: false },
      ];
      for (const { ts, foe, crit } of runs) {
        const fx = new Effects();
        fx.play(anim, ts, null, { crit: !!crit, fromAlly: true });
        assert.ok(fx.parts.length > 0, `${anim} の つぶ`);
        // 1ばんめの まとに すぐ あたる（ダメージの 数字と ずれない）
        let hit = Infinity;
        for (const p of fx.parts) if (typeof p.x === 'number' && Math.hypot(p.x - ts[0].x, p.y - ts[0].y) < 24) hit = Math.min(hit, p.delay || 0);
        assert.ok(hit <= 120, `${anim} ${ts.length} が あたるのが おそい ${hit}`);
        // つぶは がめんの 中か その すぐ そと
        for (const p of fx.parts) {
          if (typeof p.x !== 'number' || p.kind === 'flash' || p.kind === 'shake') continue;
          assert.ok(p.x > -60 && p.x < BW + 60 && p.y > -60 && p.y < BH + 60, `${anim} の つぶ ${p.kind} が とおい (${p.x},${p.y})`);
        }
        const { t, log } = runFx(fx);
        assert.ok(t <= 1800, `${anim} ${ts.length} が ながい ${t}ms`);
        assert.ok(log.calls > 100, `${anim} を かいた`);
        assert.deepEqual(log.nan, [], `${anim} の NaN`);
        void foe;
      }
    }
  });
});

test('第26回の 看板の技: 技の id から エフェクトが きまる（データが まだ ない id・target の ない 技でも こわれない）', () => {
  for (const job of JOBS20) {
    const id = `${job}_sig`;
    assert.equal(sigAnim(id), id);
    // データが ある ときは その 技の id
    const ab = ABILITIES[id];
    if (ab) assert.equal(typeof ab.name, 'string', id);
  }
  for (const id of [undefined, null, '', 'fire1', 'kisatsu', 'okan_otama', 'no_such_sig', 'hokage_sig2']) assert.equal(sigAnim(id), null, String(id));
  // まとが ない ときは なにも しない（false）
  const fx = new Proxy({}, { get: () => () => undefined });
  for (const anim of SIGS) {
    assert.equal(playJob4Fx(fx, anim, [], null, {}), false, `${anim} まと なし`);
    // ほかの ファイルの 技と かさならない
    assert.equal(playJobFx(fx, anim, [{ x: 100, y: 60 }], null, {}), false, `${anim} は battlefx-jobs.js に ない`);
    assert.equal(playJob2Fx(fx, anim, [{ x: 100, y: 60 }], null, {}), false, `${anim} は battlefx-jobs2.js に ない`);
    assert.equal(playJob3Fx(fx, anim, [{ x: 100, y: 60 }], null, {}), false, `${anim} は battlefx-jobs3.js に ない`);
    assert.equal(playCh4Fx(fx, anim, [{ x: 100, y: 60 }], null, {}), false, `${anim} は battlefx-ch4.js に ない`);
    assert.ok(!PARTY_ANIMS.has(anim) && !PARTY_ANIMS3.has(anim) && !(anim in JOB2_SFX) && !(anim in JOB3_SFX), anim);
  }
  for (const anim of ['fire1', 'slash', 'pillow', 'okan_otama', 'gohan', 'kamehameha', 'no_such_anim']) assert.equal(playJob4Fx(fx, anim, [{ x: 100, y: 60 }], null, {}), false, anim);
});

test('第26回の 看板の技: 音・battle.js と battlefx.js の つなぎ・つぶの なまえ', () => {
  assert.deepEqual(Object.keys(JOB4_SFX), SIGS);
  // 音は audio.js に ある ものか、sfx-r26.js の 新しい 音
  const audio = readFileSync(new URL('../public/js/client/audio.js', import.meta.url), 'utf8');
  for (const [anim, s] of Object.entries(JOB4_SFX)) assert.ok(audio.includes(`case '${s}':`) || typeof SFX_R26[s] === 'function', `${anim} の 音 ${s}`);
  for (const s of Object.keys(SFX_R26)) assert.ok(!audio.includes(`case '${s}':`), `新しい 音 ${s} が audio.js と かさなる`);
  assert.match(audio, /SFX_R26\[id\]\(this, T\)/);
  // 新しい 音を ならしても こわれない（Web Audio の まね）
  const calls = [];
  const a = { tone: (...x) => calls.push(['tone', ...x]), noise: (...x) => calls.push(['noise', ...x]) };
  for (const [s, f] of Object.entries(SFX_R26)) {
    calls.length = 0;
    f(a, a.tone);
    assert.ok(calls.length > 0, s);
    for (const c of calls) for (const v of c.slice(1)) if (typeof v === 'number') assert.ok(Number.isFinite(v), s);
  }
  const battle = readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');
  assert.match(battle, /sigAnim\(ev\.ability\)/);
  assert.match(battle, /SIG4\.has\(anim\)/);
  assert.match(battle, /\.\.\.JOB4_SFX/);
  const src = readFileSync(new URL('../public/js/client/render/battlefx.js', import.meta.url), 'utf8');
  assert.match(src, /playJob4Fx\(this, anim/);
  assert.match(src, /JOB4_FINE/);
  // つぶの なまえが いまの ものと かさならない
  const s0 = src.indexOf('const FINE = {');
  const fine = src.slice(s0, src.indexOf('\n};', s0));
  for (const k of Object.keys(JOB4_FINE)) {
    assert.ok(k.startsWith('j4'), k);
    assert.ok(!(k in JOB_FINE) && !(k in JOB2_FINE) && !(k in JOB3_FINE), k);
    assert.ok(!new RegExp(`^  ${k}\\(`, 'm').test(fine), `${k} が battlefx.js の FINE と かさなる`);
    assert.ok(!src.includes(`case '${k}':`), `${k} が battlefx.js の つぶと かさなる`);
  }
});
