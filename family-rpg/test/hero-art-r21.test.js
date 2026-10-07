// 主人公の え（render/hero*.js）: ニート・中二病・ダ天使・サイヤ人・設備屋・ryonetsu・ゴム人間・ニカ・配信者・ゲーマー・魔王の 服と、
// 新しい ぶき・たて・ぼうし・よろい、技の エフェクト（render/battlefx-jobs2.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ITEMS } from '../public/js/shared/data/items.js';
import { paintHero } from '../public/js/client/render/hero.js';
import { outfitOf, jobBody } from '../public/js/client/render/hero-outfit.js';
import { weaponOf, shieldOf, headOf, isLongSide } from '../public/js/client/render/hero-gear.js';
import { HAIR_STYLE_IDS } from '../public/js/client/render/hero-hair.js';
import { lookToOpts } from '../public/js/client/render/chars.js';
import { weaponLook, playWeapon } from '../public/js/client/render/weaponfx.js';
import { Effects, BW, BH } from '../public/js/client/render/battlefx.js';
import { JOB_FINE, playJobFx } from '../public/js/client/render/battlefx-jobs.js';
import { JOB2_FINE, JOB2_SFX, PARTY_ANIMS, playJob2Fx } from '../public/js/client/render/battlefx-jobs2.js';

const DIRS = ['down', 'left', 'up', 'right'];
const JOBS16 = ['neet', 'chuuni', 'datenshi', 'saiyan', 'super_saiyan', 'ss2', 'ss3', 'setsubiya', 'ryonetsu', 'rubber', 'nika', 'youtuber', 'streamer', 'gamer', 'pro_gamer', 'maou'];
const ANIMS13 = ['kamehameha', 'ki_blast', 'super_aura', 'gomu_punch', 'gomu_gatling', 'nika_drum', 'dark_wings', 'chuuni_flame', 'flame_up', 'glitch', 'aircon', 'maou_dark', 'superchat'];
// そうびの データが まだ ない ときの かわり（ある ときは そのまま つかう）
const STUB = {
  pillow: { name: 'まくら', type: 'weapon', cat: 'fan', rank: 1, atk: 5 },
  selfie_stick: { name: '自どり棒', type: 'weapon', cat: 'staff', rank: 2, atk: 10 },
  game_controller: { name: 'ゲームコントローラー', type: 'weapon', cat: 'boomerang', rank: 3, atk: 18 },
  chuuni_bokken: { name: '漆黒の木刀', type: 'weapon', cat: 'sword', rank: 3, atk: 20 },
  monkey_wrench: { name: 'モンキーレンチ', type: 'weapon', cat: 'axe', rank: 2, atk: 14 },
  gaming_keyboard: { name: 'ゲーミングキーボード', type: 'weapon', cat: 'axe', rank: 4, atk: 30 },
  pipe_wrench: { name: 'パイプレンチ', type: 'weapon', cat: 'axe', rank: 4, atk: 32 },
  dark_feather_staff: { name: '黒い羽根の杖', type: 'weapon', cat: 'staff', rank: 5, atk: 36 },
  battle_suit: { name: '戦闘服', type: 'armor', armorType: 'gi', rank: 4, def: 24 },
  gold_button: { name: '金の盾', type: 'shield', rank: 5, def: 20 },
  straw_hat: { name: '麦わらぼうし', type: 'head', rank: 1, def: 2 },
};
const OLD_IDS = new Set(Object.keys(ITEMS));
for (const [id, it] of Object.entries(STUB)) if (!ITEMS[id]) ITEMS[id] = it;
const SHAPES = { pillow: 'pillow', selfie_stick: 'selfie', game_controller: 'pad', chuuni_bokken: 'bokken', monkey_wrench: 'monkey', gaming_keyboard: 'keyboard', pipe_wrench: 'pipewrench', dark_feather_staff: 'darkfeather' };

// 不透明な ピクセルの かず と、ふちに さわって いないか（オーラの すける ピクセルも かぞえる）
function inspect(img) {
  const { w, h, rgba } = img;
  let n = 0, semi = 0;
  let edge = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = rgba[(y * w + x) * 4 + 3];
      if (a === 0) continue;
      n++;
      if (a < 255) semi++;
      if (y === 0 || x === 0 || x === w - 1) edge = true;
    }
  }
  return { n, semi, edge };
}
const key = (img) => Buffer.from(img.rgba).toString('base64');

test('第21回の 職業の 服: 男女・4方向・かみがた・2コマで かけて、はみ出さない', () => {
  for (const job of JOBS16) {
    // かみがたが きまって いる 職業（スーパーサイヤ人・ニカ）は どの かみがたでも おなじ なので 1つで よい
    const styles = jobBody(job)?.hair ? ['short'] : ['short', 'afro', 'long', 'mohawk', 'twin', 'bun'];
    for (const body of [0, 1]) {
      for (const dir of DIRS) {
        for (const style of styles) {
          for (const res of [4, 8]) {
            const img = paintHero({ body, style, hcol: 'black' }, job, undefined, dir, res === 4 ? 1 : 0, res);
            const r = inspect(img);
            assert.ok(r.n > img.w * img.h * 0.12, `${job} ${body} ${dir} ${style} res${res} が かけている`);
            assert.ok(!r.edge, `${job} ${body} ${dir} ${style} res${res} が ふちに さわる`);
          }
        }
      }
    }
  }
});

test('第21回の 職業の 服: どれも ちがう え（にている いまの 職業とも ちがう）', () => {
  const LIKE = ['warrior', 'monk', 'holyfist', 'god_hand', 'tatakiage', 'loto_hero', 'dragon_knight', 'archmage', 'middleschooler', 'highschooler', 'ninja', 'pirate', 'parttimer'];
  for (const body of [0, 1]) {
    for (const dir of DIRS) {
      const seen = new Map();
      for (const job of [...LIKE, ...JOBS16]) {
        const k = key(paintHero({ body, style: 'short' }, job, job === 'warrior' ? '' : undefined, dir, 0, 4));
        assert.ok(!seen.has(k), `${job} body${body} ${dir} が ${seen.get(k)} と おなじ え`);
        seen.set(k, job);
      }
    }
  }
});

test('第21回の 職業の 服: 服の しゅるいと ぼうし（布の服の とき）', () => {
  const Lk = { cloth: '#3f7fd0', skin: 0 };
  const kind = (job, fem = false) => outfitOf(Lk, job, 'cloth', fem).kind;
  const KIND = {
    neet: 'jersey', chuuni: 'coat', datenshi: 'robe', saiyan: 'saiyan', super_saiyan: 'gi', ss2: 'gi', ss3: 'gi',
    setsubiya: 'work', ryonetsu: 'work', rubber: 'rubber', nika: 'rubber', youtuber: 'hoodie', streamer: 'hoodie',
    gamer: 'gamer', pro_gamer: 'esports', maou: 'plate',
  };
  for (const [job, k] of Object.entries(KIND)) {
    assert.equal(kind(job), k, job);
    assert.equal(kind(job, true), k, `${job} 女性`);
  }
  assert.ok(outfitOf(Lk, 'maou', 'cloth', false).cape, '魔王の マント');
  assert.equal(outfitOf(Lk, 'ryonetsu', 'cloth', false).spec.mark, 'diamond', 'ryonetsu の ひしがたの しるし');
  // ぼうし（布の服 か よろい なし の とき）
  const hat = (job) => headOf(null, job, 'cloth', outfitOf(Lk, job, 'cloth', false))?.kind || null;
  const HAT = {
    datenshi: 'halo', setsubiya: 'hardhat', ryonetsu: 'hardhat', rubber: 'straw', youtuber: 'revcap',
    streamer: 'gameset', pro_gamer: 'gameset', maou: 'demoncrown',
    neet: null, chuuni: null, saiyan: null, super_saiyan: null, ss2: null, ss3: null, nika: null, gamer: null,
  };
  for (const [job, h] of Object.entries(HAT)) assert.equal(hat(job), h, job);
  assert.equal(headOf(null, 'ryonetsu', 'cloth', null).mark, 'diamond');
  // よろいを きると ぼうしは なくなる（いまの 職業と おなじ）
  assert.equal(headOf(null, 'ryonetsu', 'iron_armor', null), null);
  assert.equal(headOf(null, 'maou', 'iron_armor', null), null);
  // 古い え（chars.js）でも 職業の 服（戦士の 服に ならない）
  const warrior = lookToOpts({}, 'warrior', ',cloth,,');
  for (const job of JOBS16) {
    const o = lookToOpts({}, job, ',cloth,,');
    assert.ok(o.outfit, `${job} の 古い え`);
    assert.notDeepEqual(o, warrior, `${job} の 古い え`);
  }
});

test('第21回の 職業の からだ: かみがた・かみの色・目・オーラは 職業で きまり、よろいを きても のこる', () => {
  assert.deepEqual(['super_saiyan', 'ss2', 'ss3', 'nika'].map((j) => jobBody(j).hair), ['ssj', 'ssj2', 'ssj3', 'nika']);
  assert.equal(jobBody('super_saiyan').aura, 'gold');
  assert.equal(jobBody('nika').aura, 'cloud');
  assert.equal(jobBody('maou').aura, 'dark');
  assert.ok(jobBody('ss2').spark && jobBody('ss3').noBrow && jobBody('nika').grin);
  assert.ok(jobBody('saiyan').tail && jobBody('datenshi').wings && jobBody('chuuni').eyepatch && jobBody('rubber').scar);
  for (const job of ['warrior', 'neet', 'gamer', 'cook']) assert.equal(jobBody(job), null, job);
  // とくべつな かみがたは びよういんでは えらべない
  for (const id of ['ssj', 'ssj2', 'ssj3', 'nika']) assert.ok(!HAIR_STYLE_IDS.includes(id), id);
  for (const job of ['super_saiyan', 'ss2', 'ss3', 'nika']) {
    for (const eq of [undefined, ',iron_armor,,', ',battle_suit,,iron_helm']) {
      for (const dir of DIRS) {
        const a = paintHero({ body: 1, style: 'short', hcol: 'black' }, job, eq, dir, 0, 4);
        const b = paintHero({ body: 1, style: 'twin', hcol: 'pink' }, job, eq, dir, 0, 4);
        assert.equal(key(a), key(b), `${job} ${eq} ${dir}: じぶんの かみがた・いろに かかわらず おなじ`);
      }
    }
  }
  // スーパーサイヤ人 1・2・3 は それぞれ ちがう
  const ss = ['super_saiyan', 'ss2', 'ss3'].map((j) => key(paintHero({ body: 0, style: 'short' }, j, undefined, 'down', 0, 8)));
  assert.equal(new Set(ss).size, 3);
  // ふつうの 職業は じぶんの かみがた
  for (const job of ['saiyan', 'rubber', 'maou']) {
    assert.notEqual(key(paintHero({ body: 0, style: 'short' }, job, undefined, 'down', 0, 4)), key(paintHero({ body: 0, style: 'long' }, job, undefined, 'down', 0, 4)), job);
  }
  // オーラ（すける ピクセル）は オーラの ある 職業だけ。よろいを きても でる
  for (const job of ['super_saiyan', 'ss2', 'ss3', 'nika', 'maou']) {
    for (const eq of [undefined, ',iron_armor,,']) assert.ok(inspect(paintHero({ body: 0, style: 'short' }, job, eq, 'down', 0, 4)).semi > 200, `${job} ${eq} の オーラ`);
  }
  for (const job of ['warrior', 'saiyan', 'datenshi', 'rubber', 'streamer']) assert.equal(inspect(paintHero({ body: 0, style: 'short' }, job, undefined, 'down', 0, 4)).semi, 0, job);
  // ぼうし・かぶとを かぶっても はみ出さない
  for (const job of ['super_saiyan', 'ss3', 'nika', 'datenshi']) {
    for (const head of ['straw_hat', 'iron_helm', null]) {
      for (const dir of DIRS) {
        for (const res of [4, 8]) {
          const img = paintHero({ body: 0, style: 'afro' }, job, { weapon: null, armor: 'cloth', shield: null, head }, dir, 1, res);
          assert.ok(!inspect(img).edge, `${job} ${head} ${dir} res${res}`);
        }
      }
    }
  }
});

test('第21回の ぶき: それぞれ ちがう かたちで、4方向とも はみ出さない', () => {
  const pics = new Set([key(paintHero({ body: 0, style: 'short' }, 'warrior', { weapon: null, armor: 'cloth' }, 'down', 0, 4))]);
  for (const [id, shape] of Object.entries(SHAPES)) {
    const W = weaponOf(id);
    assert.ok(W, `${id} の え`);
    assert.equal(W.shape, shape, id);
    assert.equal(weaponOf(`${id}+2`).shape, shape, `${id}+2 は もとの え`);
    assert.equal(isLongSide(W), ['selfie_stick', 'dark_feather_staff'].includes(id), `${id} の もちかた`);
    for (const body of [0, 1]) {
      for (const dir of DIRS) {
        for (const res of [4, 8]) {
          const img = paintHero({ body, style: 'short', hcol: 'brown' }, 'warrior', { weapon: id, armor: 'cloth' }, dir, body, res);
          assert.ok(!inspect(img).edge, `${id} ${body} ${dir} res${res} が ふちに さわる`);
        }
      }
    }
    const k = key(paintHero({ body: 0, style: 'short' }, 'warrior', { weapon: id, armor: 'cloth' }, 'down', 0, 4));
    assert.ok(!pics.has(k), `${id} が ほかの ぶきと おなじ え`);
    pics.add(k);
  }
  // 新しい 職業が もっても はみ出さない
  const PAIRS = [['neet', 'pillow'], ['youtuber', 'selfie_stick'], ['gamer', 'game_controller'], ['chuuni', 'chuuni_bokken'], ['setsubiya', 'monkey_wrench'], ['pro_gamer', 'gaming_keyboard'], ['ryonetsu', 'pipe_wrench'], ['datenshi', 'dark_feather_staff']];
  for (const [job, w] of PAIRS) {
    for (const dir of DIRS) assert.ok(!inspect(paintHero({ body: 1, style: 'afro' }, job, { weapon: w, armor: 'cloth' }, dir, 0, 4)).edge, `${job} ${w} ${dir}`);
  }
});

test('第21回の ぶき: 名前で わかる 道具は その かたち。いまの ぶきの えは かわらない', () => {
  const T = {
    t_pillow: [{ name: 'ふかふかのまくら', type: 'weapon', cat: 'fan', rank: 2 }, 'pillow'],
    t_selfie: [{ name: '自撮り棒', type: 'weapon', cat: 'staff', rank: 2 }, 'selfie'],
    t_pad: [{ name: '光るコントローラー', type: 'weapon', cat: 'boomerang', rank: 3 }, 'pad'],
    t_spanner: [{ name: '銀のスパナ', type: 'weapon', cat: 'axe', rank: 3 }, 'monkey'],
    t_pipe: [{ name: '金のパイプレンチ', type: 'weapon', cat: 'axe', rank: 5 }, 'pipewrench'],
    t_key: [{ name: '光るキーボード', type: 'weapon', cat: 'axe', rank: 4 }, 'keyboard'],
  };
  try {
    for (const [id, [it]] of Object.entries(T)) ITEMS[id] = it;
    for (const [id, [, shape]] of Object.entries(T)) assert.equal(weaponOf(id).shape, shape, id);
  } finally {
    for (const id of Object.keys(T)) delete ITEMS[id];
  }
  const NEW = new Set(Object.values(SHAPES));
  for (const id of OLD_IDS) {
    // 新しい ぶき と、それを きたえた もの（'pillow+1' など）は のぞく
    if (ITEMS[id].type !== 'weapon' || STUB[id.replace(/\+\d+$/, '')]) continue;
    assert.ok(!NEW.has(weaponOf(id).shape), `${id}（${ITEMS[id].name}）の えが かわった`);
  }
});

test('第21回の たて・ぼうし・よろい: 金の盾・麦わらぼうし・戦闘服', () => {
  assert.equal(shieldOf('gold_button').kind, 'plaque');
  const Lk = { cloth: '#3f7fd0', skin: 0 };
  const O = outfitOf(Lk, 'warrior', 'cloth', false);
  assert.equal(headOf('straw_hat', 'warrior', 'cloth', O).kind, 'straw');
  assert.equal(headOf('straw_hat', 'maou', 'cloth', O).kind, 'straw', 'ぼうしを かぶると 職業の ぼうしより さき');
  for (const job of ['warrior', 'priest', 'saiyan', 'super_saiyan']) assert.equal(outfitOf(Lk, job, 'battle_suit', false).kind, 'saiyan', job);
  assert.equal(outfitOf(Lk, 'warrior', 'battle_suit+3', true).kind, 'saiyan', 'きたえても おなじ');
  const base = key(paintHero({ body: 0, style: 'short' }, 'warrior', { weapon: null, armor: 'cloth' }, 'down', 0, 4));
  const seen = new Set([base]);
  for (const eq of [{ shield: 'gold_button' }, { head: 'straw_hat' }, { armor: 'battle_suit' }]) {
    for (const body of [0, 1]) {
      for (const dir of DIRS) {
        for (const res of [4, 8]) {
          const img = paintHero({ body, style: 'twin' }, 'warrior', { weapon: 'iron_sword', armor: 'cloth', ...eq }, dir, 1, res);
          assert.ok(!inspect(img).edge, `${JSON.stringify(eq)} ${body} ${dir} res${res}`);
        }
      }
    }
    const k = key(paintHero({ body: 0, style: 'short' }, 'warrior', { weapon: null, armor: 'cloth', ...eq }, 'down', 0, 4));
    assert.ok(!seen.has(k), `${JSON.stringify(eq)} の え`);
    seen.add(k);
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
// エフェクトが おわるまで うごかして かく（かかった じかんと、かいた かず）
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

test('第21回の ぶきの こうげき: まくら・レンチ・キーボード・自どり棒・羽根の つえの エフェクト', () => {
  assert.equal(weaponLook('pillow', 'fan').move, 'pillow');
  assert.equal(weaponLook('pillow', 'fan').trait, 'feather');
  for (const id of ['monkey_wrench', 'pipe_wrench']) assert.equal(weaponLook(id, 'axe').move, 'pan', id);
  assert.equal(weaponLook('gaming_keyboard', 'axe').move, 'bat');
  assert.equal(weaponLook('gaming_keyboard', 'axe').trait, 'rainbow');
  assert.equal(weaponLook('selfie_stick', 'staff').trait, 'flash');
  assert.equal(weaponLook('dark_feather_staff', 'staff').trait, 'blackfeather');
  assert.equal(weaponLook('game_controller', 'boomerang').mat, 'pad');
  assert.equal(weaponLook('chuuni_bokken', 'sword').mat, 'wood');
  // ほんものの エフェクトで うごかして かく
  withFakeDocument(() => {
    for (const id of Object.keys(SHAPES)) {
      for (const crit of [false, true]) {
        const fx = new Effects();
        const hit = playWeapon(fx, { x: 120, y: 60, w: 32, h: 32, foot: 80 }, weaponLook(id, ITEMS[id].cat), crit, 0);
        assert.ok(hit >= 0 && hit < 600, `${id} の あたる じかん ${hit}`);
        assert.ok(fx.parts.length > 3, `${id} の エフェクト`);
        const { t, log } = runFx(fx);
        assert.ok(t < 2500, `${id} が ながい ${t}ms`);
        assert.deepEqual(log.nan, [], `${id} の NaN`);
      }
    }
  });
});

test('第21回の 技の エフェクト: 13の 技が でて、すぐ あたり、1.8びょうで おわる', () => {
  withFakeDocument(() => {
    assert.deepEqual([...PARTY_ANIMS].sort(), ['aircon', 'nika_drum', 'super_aura']);
    for (const anim of ANIMS13) {
      assert.ok(JOB2_SFX[anim], `${anim} の 音`);
      for (const n of [1, 3]) {
        const fx = new Effects();
        const party = PARTY_ANIMS.has(anim);
        const ts = party ? [{ x: BW / 2, y: BH * 0.62 }] : Array.from({ length: n }, (_, i) => ({ x: 60 + i * 60, y: 90 }));
        fx.play(anim, ts, null, { crit: n === 3 });
        assert.ok(fx.parts.length > 0, `${anim} の つぶ`);
        // 敵に かける 技は すぐ あたる（ダメージの 数字と ずれない）
        if (!party) {
          let hit = Infinity;
          for (const p of fx.parts) if (typeof p.x === 'number' && Math.hypot(p.x - ts[0].x, p.y - ts[0].y) < 24) hit = Math.min(hit, p.delay || 0);
          assert.ok(hit <= 120, `${anim} が あたるのが おそい ${hit}`);
        }
        const { t, log } = runFx(fx);
        assert.ok(t <= 1800, `${anim} が ながい ${t}ms`);
        assert.ok(log.calls > 100, `${anim} を かいた`);
        assert.deepEqual(log.nan, [], `${anim} の NaN`);
      }
    }
  });
});

test('第21回の 技の エフェクト: ほかの 技・つぶの かきかたを じゃま しない', () => {
  const fx = new Proxy({}, { get: () => () => undefined });
  for (const anim of ANIMS13) assert.equal(playJobFx(fx, anim, [{ x: 100, y: 60 }], null, {}), false, `${anim} は battlefx-jobs.js に ない`);
  for (const anim of ['fire1', 'slash', 'pillow', 'idol_song', 'no_such_anim']) assert.equal(playJob2Fx(fx, anim, [{ x: 100, y: 60 }], null, {}), false, anim);
  // つぶの なまえが いまの ものと かさならない
  const src = readFileSync(new URL('../public/js/client/render/battlefx.js', import.meta.url), 'utf8');
  const s0 = src.indexOf('const FINE = {');
  const fine = src.slice(s0, src.indexOf('\n};', s0));
  for (const k of Object.keys(JOB2_FINE)) {
    assert.ok(!(k in JOB_FINE), `${k} が battlefx-jobs.js と かさなる`);
    assert.ok(!new RegExp(`^  ${k}\\(`, 'm').test(fine), `${k} が battlefx.js の FINE と かさなる`);
    assert.ok(!src.includes(`case '${k}':`), `${k} が battlefx.js の つぶと かさなる`);
  }
});
