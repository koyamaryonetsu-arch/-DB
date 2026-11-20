// 第90回 F: 第3部 第1章 第1幕「星ふるえの夜」の 曲（audio-c9a.js）と 第3部の ふつうの 戦い（battle3）
//   6曲と battle3 が ある・id が 約束どおり・区切りの 長さ・ひとまわりの 秒・音の 高さ・強拍の ぶつかり・大きさの そろえ・
//   くりかえしの つなぎ目・名前・場面の えらび方（地下道の 強さ・ためしの だん・第3部の 戦い）・今の 曲が かわって いない
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { _TRACKS, TRACK_IDS } from '../public/js/client/audio.js';
import { C9A_TRACKS, C9A_IDS, C9A_SEVEN } from '../public/js/client/audio-c9a.js';
import { C9A_TRACK_IDS, C9A_MAP_IDS } from '../public/js/shared/maps/c9a-flags.js';
import { R77A_TRACKS } from '../public/js/client/audio-r77a.js';
import { C8R_TRACKS } from '../public/js/client/audio-c8r.js';
import { compileTrack, legacyChannels, midiOf, formOfPhase, phaseOf, nextPos, MusicEngine } from '../public/js/client/music-engine.js';
import { INSTRUMENTS } from '../public/js/client/music-inst.js';
import { TRACK_NAMES } from '../public/js/client/audio-names.js';
import { TRACK_TRIM } from '../public/js/client/audio-trim.js';
import { checkText } from '../tools/kanji-check.mjs';
import { SceneAudio, battleBgm, battlePhase, FORM_KEYS, PART3_BATTLE, depthIntensity, buildFloorIndex, floorOf, C9A_CAVE_TRACK } from '../public/js/client/audio-scene.js';

const IDS = ['c9a_festival', 'c9a_forest', 'c9a_child', 'c9a_cave', 'c9a_trio', 'c9a_trial', 'battle3'];
const secOf = (c, nm) => (c.segs[nm].steps * 60) / (c.segs[nm].bpm || c.bpm) / 4;
const loopSec = (c, f = c) => f.form.slice(f.loopFrom).reduce((a, n) => a + secOf(c, n), 0);
const notesOf = (evs) => evs.filter((e) => e.f).map((e) => Math.round(midiOf(e.f)));

// ───── 小さな にせの AudioContext（audio-c8r-r80.test.js と 同じ）─────
class FakeParam {
  constructor(v = 0) { this.value = v; }
  setValueAtTime() { return this; }
  linearRampToValueAtTime() { return this; }
  exponentialRampToValueAtTime() { return this; }
  setTargetAtTime() { return this; }
  setValueCurveAtTime() { return this; }
  cancelScheduledValues() { return this; }
}
class FakeNode {
  constructor() {
    for (const p of ['gain', 'frequency', 'detune', 'Q', 'pan', 'threshold', 'knee', 'ratio', 'attack', 'release']) this[p] = new FakeParam(p === 'gain' ? 1 : 0);
  }
  connect(n) { return n; }
  disconnect() {}
  start() {}
  stop() {}
  setPeriodicWave() {}
}
class FakeCtx {
  constructor() { this.currentTime = 0; this.sampleRate = 8000; this.destination = new FakeNode(); }
  createGain() { return new FakeNode(); }
  createOscillator() { return new FakeNode(); }
  createBiquadFilter() { return new FakeNode(); }
  createBufferSource() { return new FakeNode(); }
  createStereoPanner() { return new FakeNode(); }
  createConvolver() { return new FakeNode(); }
  createWaveShaper() { return new FakeNode(); }
  createDynamicsCompressor() { return new FakeNode(); }
  createPeriodicWave(re, im) { return { re, im }; }
  createBuffer(ch, len) { const d = [...Array(ch)].map(() => new Float32Array(len)); return { getChannelData: (i) => d[i], length: len }; }
}
function spyEngine() {
  const ctx = new FakeCtx();
  const eng = new MusicEngine(ctx, ctx.destination, { offline: true });
  const log = [];
  eng.voice = (f, t, dur, inst, vel, dest) => log.push({ kind: 'v', f, t, inst, dest });
  eng.drum = (d, t, vel, dest) => log.push({ kind: 'd', d, t, dest });
  return { eng, log };
}
const partOf = (eng, x) => eng.player.strips.findIndex((s) => s.g === x.dest);

test('第90回 F: 6曲（約束の id）と battle3 が 区切りで 書いて あり、ゲームの 曲に 入って いる・名前', () => {
  assert.deepEqual(C9A_IDS, IDS);
  assert.deepEqual(C9A_IDS.slice(0, 6), C9A_TRACK_IDS, 'c9a-flags.js の 曲の id と 同じ');
  assert.equal(C9A_IDS[6], PART3_BATTLE);
  for (const id of IDS) {
    const tr = _TRACKS[id];
    assert.equal(tr.parts, C9A_TRACKS[id].parts, `${id}: 入って いる`);
    assert.ok(tr.sections && tr.form && tr.loopFrom >= 1, id);
    assert.ok(TRACK_IDS.includes(id), id);
    assert.ok(TRACK_NAMES[id], `${id}: 名前`);
    assert.deepEqual(checkText(TRACK_NAMES[id]).filter((p) => p.kind !== 'kana'), [], id);
    assert.ok(!/\s/.test(TRACK_NAMES[id]), `${id}: スペース なし`);
    assert.ok(Number.isFinite(TRACK_TRIM[id]) && Math.abs(TRACK_TRIM[id]) <= 3, `${id}: 大きさの そろえ ${TRACK_TRIM[id]}`);
  }
  assert.equal(TRACK_NAMES.battle3, '戦い・その3');
  assert.equal(new Set(Object.values(TRACK_NAMES)).size, Object.keys(TRACK_NAMES).length, '名前が かさならない');
});

test('第90回 F: 区切りの 長さ・ひとまわり 60〜90秒・区切りごとに ちがう', () => {
  for (const id of IDS) {
    const c = compileTrack(_TRACKS[id]);
    assert.equal(c.bar, id === 'c9a_festival' ? 12 : 16, id);
    for (const [nm, s] of Object.entries(c.segs)) {
      const lens = s.parts.map((p) => p.reduce((a, e) => a + e.len, 0));
      assert.ok(lens.every((l) => l === s.steps), `${id} ${nm}: ${lens.join(',')}`);
      assert.equal(s.steps % c.bar, 0, `${id} ${nm}`);
      assert.ok(s.parts.some((p) => p.some((e) => e.f > 0)), `${id} ${nm}: 音が ある`);
    }
    const sec = loopSec(c);
    assert.ok(sec >= 60 && sec <= 90, `${id}: ひとまわり ${sec.toFixed(1)} 秒`);
    const loopNames = c.form.slice(c.loopFrom);
    const sig = (nm) => c.parts.map((p, i) => JSON.stringify(c.segs[nm].parts[i].slice(0, 24))).join('|');
    assert.equal(new Set(loopNames.map(sig)).size, new Set(loopNames).size, `${id}: 区切りが ちがう`);
  }
});

test('第90回 F: テンポ・パートは 5つまで・楽器・音の 高さの はんい', () => {
  const range = { c9a_festival: [100, 124], c9a_forest: [92, 112], c9a_child: [66, 84], c9a_cave: [90, 110], c9a_trio: [136, 156], c9a_trial: [90, 110], battle3: [158, 176] };
  for (const id of IDS) {
    const tr = _TRACKS[id];
    const [lo, hi] = range[id];
    assert.ok(tr.bpm >= lo && tr.bpm <= hi, `${id}: bpm ${tr.bpm}`);
    assert.ok(tr.parts.filter((p) => !p.drums).length <= 5, `${id}: パートが 多い`);
    assert.ok(tr.parts.some((p) => p.drums), `${id}: たいこ`);
    for (const p of tr.parts) if (p.i) assert.ok(INSTRUMENTS[p.i], `${id}: 楽器 ${p.i}`);
    const c = compileTrack(tr);
    const lead = c.parts.findIndex((p) => p.role === 'lead');
    const bass = c.parts.findIndex((p) => p.role === 'bass');
    assert.equal(c.parts.filter((p) => p.role === 'lead').length, 1, id);
    assert.equal(c.parts.filter((p) => p.role === 'bass').length, 1, id);
    // 左右: ハーモニーの 左右の 合計が かたよらない
    const pans = c.parts.filter((p) => p.role === 'harmony').map((p) => p.pan);
    assert.ok(Math.abs(pans.reduce((a, b) => a + b, 0)) <= 0.35, `${id}: 左右 ${pans}`);
    // 高さ: メロディ G4〜A6・ベース G1〜D4・ほかの パートも C3〜E7（オルゴールの きらきらは 高い）
    const all = Object.values(c.segs);
    const mel = all.flatMap((s) => notesOf(s.parts[lead]));
    const bs = all.flatMap((s) => notesOf(s.parts[bass]));
    assert.ok(Math.min(...mel) >= 67 && Math.max(...mel) <= 93, `${id}: メロディ ${Math.min(...mel)}〜${Math.max(...mel)}`);
    assert.ok(Math.min(...bs) >= 31 && Math.max(...bs) <= 62, `${id}: ベース ${Math.min(...bs)}〜${Math.max(...bs)}`);
    for (let i = 0; i < c.parts.length; i++) {
      if (c.parts[i].drums || i === lead || i === bass) continue;
      const ns = all.flatMap((s) => notesOf(s.parts[i]));
      if (ns.length) assert.ok(Math.min(...ns) >= 48 && Math.max(...ns) <= 100, `${id} パート ${i}: ${Math.min(...ns)}〜${Math.max(...ns)}`);
    }
    // メロディの とびは 1オクターブまで
    for (const s of all) {
      const ns = notesOf(s.parts[lead]);
      for (let k = 1; k < ns.length; k++) assert.ok(Math.abs(ns[k] - ns[k - 1]) <= 12, `${id} ${s.name}: とび ${ns[k - 1]}→${ns[k]}`);
    }
  }
});

// 強拍（4/4 は 1拍目・3拍目、6/8 は 1つめ・2つめの 付点4分）: メロディと ベースが 短2度・増4度・長7度で ぶつからない。
// また 強拍で 鳴って いる パートどうしが 短2度（と 1オクターブ上）で にごらない
test('第90回 F: 強拍で ぶつからない・にごらない（0こ）', () => {
  for (const id of IDS) {
    const c = compileTrack(_TRACKS[id]);
    const lead = c.parts.findIndex((p) => p.role === 'lead');
    const bass = c.parts.findIndex((p) => p.role === 'bass');
    const strong = c.bar / 2;
    let n = 0;
    const bad = [];
    for (const [nm, s] of Object.entries(c.segs)) {
      const tl = s.parts.map((p) => {
        let t = 0;
        return p.map((e) => { const o = { t, len: e.len, m: e.f ? Math.round(midiOf(e.f)) : null }; t += e.len; return o; });
      });
      const at = (i, st) => tl[i].find((e) => st >= e.t && st < e.t + e.len && e.m !== null);
      for (let st = 0; st < s.steps; st += strong) {
        const m = at(lead, st), b = at(bass, st);
        if (m && b) {
          n++;
          const iv = (((m.m - b.m) % 12) + 12) % 12;
          if (iv === 1 || iv === 6 || iv === 11) bad.push(`${nm} ${st} ぶつかり`);
        }
        const ns = c.parts.map((p, i) => (p.drums ? null : at(i, st))).filter(Boolean);
        for (let a = 0; a < ns.length; a++) for (let b2 = a + 1; b2 < ns.length; b2++) {
          const d = Math.abs(ns[a].m - ns[b2].m);
          if (d === 1 || d === 13) bad.push(`${nm} ${st} にごり`);
        }
      }
    }
    assert.ok(n >= 40, `${id}: 強拍が すくない ${n}`);
    assert.deepEqual(bad, [], id);
  }
});

test('第90回 F: 1年後の 星祭りは お祭りの 曲の 編曲（同じ メロディ・6/8）。お祭りの 曲は かわって いない', () => {
  const fest = _TRACKS.festival;
  const tr = _TRACKS.c9a_festival;
  // 今の お祭りの 曲は そのまま（区切りも 楽器も ない・前の 書き方）
  assert.ok(!fest.sections && !fest.parts);
  assert.equal(fest.bpm, 120);
  assert.equal(TRACK_NAMES.festival, 'お祭り');
  // A の メロディ ＝ お祭りの メロディ（音も 長さも 同じ）
  const old = fest.ch[0].n.split(/\s+/);
  const a = tr.sections.A[0].split(/\s+/).map((t) => t.replace(/[!?.~]+$/, ''));
  assert.deepEqual(a, old);
  // A3 は 2つ 上（同じ 動き）
  const c = compileTrack(tr);
  const mA = notesOf(c.segs.A.parts[0]);
  const m3 = notesOf(c.segs.A3.parts[0]);
  assert.deepEqual(m3, mA.map((m) => m + 2));
  // 楽器が ふえる: A は 弦の のばし なし → A2・A3 は 弦と ベルが 入る
  const on = (nm, i) => c.segs[nm].parts[i].some((e) => e.f > 0);
  assert.ok(!on('A', 3) && on('A2', 3) && on('A2', 4) && on('A3', 3) && on('A3', 4));
  // 夜の 区切り（N）: たいこは リムだけ・ハープの きざみは やすみ
  const dr = c.parts.findIndex((p) => p.drums);
  assert.ok(c.segs.N.parts[dr].filter((e) => e.drum).every((e) => e.drum === 'R'));
  assert.ok(!on('N', 2));
  assert.deepEqual(tr.night, { lead: 'bell', pluck: 'marimba' });
  // 前の音 では お祭りの 曲が 鳴る
  const lc = legacyChannels(tr);
  assert.equal(lc.bpm, 120);
  assert.equal(lc.ch, fest.ch);
});

test('第90回 F: 星の子の テーマは ド〜シの 7つの 音を 1つずつ たどる（1回目は シで とまり、2回目は ドへ）', () => {
  const tr = _TRACKS.c9a_child;
  const c = compileTrack(tr);
  assert.deepEqual(C9A_SEVEN, ['C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5']);
  for (const nm of ['A', 'A2']) {
    const ns = notesOf(c.segs[nm].parts[0]);
    assert.deepEqual(ns.slice(0, 7), [72, 74, 76, 77, 79, 81, 83], `${nm}: ド〜シ`);
    // 後半も 同じく 7つ → その あと ド（とけて あたたかく）
    const half = ns.indexOf(72, 7);
    assert.ok(half > 0, nm);
    assert.deepEqual(ns.slice(half, half + 7), [72, 74, 76, 77, 79, 81, 83], `${nm}: 2回目`);
    assert.ok(ns.slice(half + 7).includes(84), `${nm}: さいごは 上の ド`);
    assert.equal(ns[ns.length - 1], 84, `${nm}: ドで おわる`);
  }
  // 1回目の シ（3小節め）は ホ短調の 和音（ミ・ソ・シ）＝ 少し さびしい・さいごの ドは ハ長調の 和音
  const padA = c.segs.A.parts[2].filter((e) => e.f);
  const pcsOf = (e) => [...new Set(e.fs.map((f) => Math.round(midiOf(f)) % 12))].sort((a, b) => a - b);
  assert.deepEqual(pcsOf(padA[2]), [4, 7, 11], 'シの 所は ホ短調');
  assert.deepEqual(pcsOf(padA[padA.length - 1]), [0, 4, 7], 'さいごの ドは ハ長調');
  // ためしの 夜明けと battle3 の サビも 7つの 音を のぼる（星の子の 光）
  const up7 = (ns) => ns.slice(1, 7).map((m, k) => m - ns[k]);
  const major = [2, 2, 1, 2, 2, 2];
  assert.deepEqual(up7(notesOf(compileTrack(_TRACKS.c9a_trial).segs.D1.parts[0])), major);
  assert.deepEqual(up7(notesOf(compileTrack(_TRACKS.battle3).segs.B.parts[0])), major);
  assert.deepEqual(up7(notesOf(c.segs.A.parts[0])), major);
});

test('第90回 F: 地下道は 強さで パートが ふえる（地下1階 0.4 → 地下4階 1.0）', () => {
  const tr = _TRACKS.c9a_cave;
  const c = compileTrack(tr);
  const on = (x) => c.parts.map((p, i) => i).filter((i) => x >= c.parts[i].minI - 1e-9);
  // 階の 強さ（今の「ダンジョンの 深さ」）
  const maps = Object.fromEntries(C9A_MAP_IDS.filter((id) => /_b\d$/.test(id)).map((id) => [id, { id, kind: 'dungeon', bgm: C9A_CAVE_TRACK }]));
  const idx = buildFloorIndex(Object.values(maps));
  const xs = Object.keys(maps).map((id) => { const f = floorOf(id, maps[id], idx); return depthIntensity(f.floor, f.floors); });
  assert.deepEqual(xs, [0.4, 0.6, 0.8, 1]);
  const counts = xs.map((x) => on(x).length);
  assert.deepEqual(counts, [3, 4, 5, 7], '1つずつ ふえる（1.0 は ベルと たいこ）');
  assert.deepEqual(on(0.4).map((i) => (c.parts[i].drums ? 'drums' : c.parts[i].inst)), ['flute', 'pluck', 'drums']);
  // 0.4 でも きざみ（リム）が 1小節に 1つ 以上・キックは 1.0 だけ
  const tick = c.parts.findIndex((p) => p.drums && p.minI === 0);
  for (const nm of c.form) {
    const s = c.segs[nm];
    assert.ok(s.parts[tick].filter((e) => e.drum === 'R').length >= s.steps / 16, nm);
    assert.ok(!s.parts[tick].some((e) => e.drum === 'k'), nm);
  }
  // にせの エンジン: 0.4 は 笛と しずくだけ・1.0 は 厚い
  const bar = (16 * 60) / c.bpm / 4;
  const run = (x) => {
    const { eng, log } = spyEngine();
    eng.start('c9a_cave', tr, 0);
    eng.adaptive.setIntensity(x);
    eng.pump(bar * 12);
    return log;
  };
  const a = run(0.4);
  assert.ok(a.filter((x) => x.kind === 'v').every((x) => ['flute', 'pluck', 'bell', 'marimba'].includes(x.inst)), '0.4 は 笛と ハープ（夜の かえ なし）');
  assert.ok(!a.some((x) => x.d === 'k'));
  const b = run(1);
  assert.ok(b.length > a.length * 1.5, `1.0 は 厚い ${a.length} → ${b.length}`);
  for (const inst of ['sub_bass', 'pad', 'bell']) assert.ok(b.some((x) => x.inst === inst), inst);
  // にせの ゲームで: 地下2階に 入ると 0.6
  const log = [];
  const au = {
    music: null,
    play(id) { au.music = { id }; },
    setIntensity: (x) => log.push(x),
    setPinch: () => {}, setPhase: () => {}, setTimeOfDay: () => {}, playAmbience: () => {}, stopAmbience: () => {},
  };
  const g = { sky: { isNight: () => false, flying: false }, field: { mapId: 'c9a_b2', map: maps.c9a_b2, me: { x: 1, y: 1 }, nightOverride: null, hasFlag: () => false, areaName: () => '', weatherKind: () => null, areaBgm: () => C9A_CAVE_TRACK } };
  const sa = new SceneAudio(au, { tracks: _TRACKS, maps });
  au.play(C9A_CAVE_TRACK);
  sa.syncField(g, 0, true);
  assert.deepEqual(log, [0.6]);
});

test('第90回 F: ともしびの ためしは 時間で もりあがる（夜 → 夜明け前 → 夜明け）。だん 1〜3 は 夜明けの めもりで つなげる', () => {
  const tr = _TRACKS.c9a_trial;
  const c = compileTrack(tr);
  // はじめの 1回: 夜（intro・N1・N2）→ 夜明け前（T1・T2）→ 夜明け（D1〜Dx）。そのあと T2 から くりかえす（夜には もどらない）
  assert.deepEqual(c.form, ['intro', 'N1', 'N2', 'T1', 'T2', 'D1', 'D2', 'D3', 'Dx']);
  assert.equal(c.form[c.loopFrom], 'T2');
  assert.deepEqual(nextPos(c, c.form.length - 1, 0), { pos: c.loopFrom, loop: 1, ended: false });
  // だんだん 高く・明るく: 区切りごとの メロディの 高さの 平均が 上がる・夜は 短調（シb）・夜明けは 長調（シ）
  const avg = (nm) => { const ns = notesOf(c.segs[nm].parts[0]); return ns.reduce((a, b) => a + b, 0) / ns.length; };
  const order = ['N1', 'N2', 'T1', 'T2'];
  for (let k = 1; k < order.length; k++) assert.ok(avg(order[k]) > avg(order[k - 1]), `${order[k]} が 高い`);
  const mean = (list) => list.reduce((a, n) => a + avg(n), 0) / list.length;
  assert.ok(mean(['D1', 'D2', 'D3', 'Dx']) > mean(['T1', 'T2']), '夜明けが いちばん 高い');
  assert.ok(avg('Dx') > avg('D3') && avg('D3') > avg('T2'), '日の 出で いちばん 高く');
  const pcs = (nm) => new Set(notesOf(c.segs[nm].parts[0]).map((m) => m % 12));
  assert.ok(pcs('N1').has(10) && !pcs('N1').has(11), '夜は ト短調');
  assert.ok(pcs('D1').has(11) && !pcs('D1').has(10), '夜明けは ト長調');
  // 夜は 楽器が すくない（ブラス・ベルは やすみ）→ 夜明けは ぜんぶ
  const on = (nm, i) => c.segs[nm].parts[i].some((e) => e.f > 0);
  assert.ok(!on('N1', 3) && !on('N1', 4) && on('D1', 3) && on('D1', 4));
  // だん（夜明けの めもりの 段 dawnStage）
  assert.ok(FORM_KEYS.includes('dawnStage'));
  assert.equal(formOfPhase(c, 0), c);
  assert.deepEqual(formOfPhase(c, 1).form, ['T1', 'T2', 'D1', 'D2', 'D3', 'Dx']);
  assert.deepEqual(formOfPhase(c, 2).form, ['D1', 'D2', 'D3', 'Dx']);
  assert.deepEqual(formOfPhase(c, 3).form, ['D1', 'D2', 'D3', 'Dx']);
  assert.ok(phaseOf(c, 3).transpose === 2 && phaseOf(c, 2).transpose === 0);
  for (let n = 1; n <= 3; n++) {
    const s = loopSec(c, formOfPhase(c, n));
    assert.ok(s >= 60 && s <= 90, `だん ${n}: ${s}`);
  }
  // めもりの 段が 3 なら だん 2（夜明け）
  const boss = { species: 'c9a_hoshimori', boss: true, side: 'enemy', hp: 100, maxHp: 100, dawnStage: 3 };
  assert.equal(battlePhase({ boss: true, enemies: [boss] }), 2);
  // にせの エンジン: だん 2 で 次の 小節から 夜明け（ト長調の ソ・ラ・シ）
  const { eng, log } = spyEngine();
  eng.start('c9a_trial', tr, 0);
  eng.pump(10);
  const t1 = eng.player.t;
  eng.adaptive.setPhase(2);
  eng.pump(t1 + 12);
  const lead = log.filter((x) => x.t >= t1 && x.kind === 'v' && partOf(eng, x) === 0).slice(0, 3).map((x) => Math.round(midiOf(x.f)));
  assert.deepEqual(lead, [79, 81, 83]);
});

test('第90回 F: 3人組の 曲（どたばた）・第3部の 戦い battle3（第3部の マップで 鳴る）', () => {
  const trio = compileTrack(_TRACKS.c9a_trio);
  // スタッカートが 多い（どたばた）
  const leadA = trio.segs.A.parts[0].filter((e) => e.f);
  assert.ok(leadA.filter((e) => e.stac).length / leadA.length >= 0.5, 'スタッカート');
  assert.ok(_TRACKS.c9a_trio.pinch?.n);
  // battle3: 第1部・第2部の 戦いと キーも テンポも ちがう
  const b3 = compileTrack(_TRACKS.battle3);
  const firstPc = (tr) => Math.round(midiOf(compileTrack(tr).segs.A.parts[0].find((e) => e.f).f)) % 12;
  assert.equal(firstPc(_TRACKS.battle3), 11, 'ロ短調');
  assert.notEqual(firstPc(_TRACKS.battle3), firstPc(R77A_TRACKS.battle));
  assert.notEqual(firstPc(_TRACKS.battle3), firstPc(R77A_TRACKS.battle2));
  assert.ok(_TRACKS.battle3.bpm !== R77A_TRACKS.battle.bpm && _TRACKS.battle3.bpm !== R77A_TRACKS.battle2.bpm);
  // ピンチは ロ短調の 主音（シ）から
  assert.equal(_TRACKS.battle3.pinch.n.split(' ')[0], 'B6:2');
  assert.ok(b3.segs.B && b3.parts.length === 6);
  // 第3部の マップでは battle3・今の マップは かわらない
  const has = (id) => !!_TRACKS[id];
  for (const id of C9A_MAP_IDS) assert.equal(battleBgm({ snapBgm: 'battle', mapId: id, has }), 'battle3', id);
  assert.equal(battleBgm({ snapBgm: 'battle', mapId: 'overworld', has }), 'battle');
  assert.equal(battleBgm({ snapBgm: 'battle', mapId: 'c8r_hall', has }), 'battle2');
  assert.equal(battleBgm({ snapBgm: 'battle', mapId: 'tm_45_1', has }), 'battle_strong');
});

test('第90回 F: 前の音 用の ch・今まで の 曲は かわって いない', () => {
  for (const id of IDS) {
    const tr = _TRACKS[id];
    assert.equal(tr.ch.length, tr.parts.length, id);
    for (const ch of tr.ch) for (const t of ch.n.split(/\s+/)) assert.match(t, ch.drums ? /^[kshr]:\d+$/ : /^(r|[A-G][#b]?\d):\d+$/, `${id}: ${t}`);
    const total = (ch) => ch.n.split(/\s+/).reduce((a, t) => a + Number(t.split(':')[1]), 0);
    assert.equal(new Set(tr.ch.map(total)).size, 1, `${id}: 前の音の チャンネルの 長さ`);
    if (id !== 'c9a_festival') assert.equal(legacyChannels(tr).ch, tr.ch, id);
  }
  // 今の 曲には かぶせない（battle・battle2・festival・第8章 第4幕の 曲）
  for (const id of ['battle', 'battle2', 'battle_strong', 'boss', 'festival', 'forest', 'cave', ...Object.keys(C8R_TRACKS)]) assert.ok(!(id in C9A_TRACKS), id);
  assert.equal(_TRACKS.battle.parts, R77A_TRACKS.battle.parts);
  assert.equal(_TRACKS.battle2.parts, R77A_TRACKS.battle2.parts);
  for (const id of Object.keys(C8R_TRACKS)) assert.equal(_TRACKS[id].parts, C8R_TRACKS[id].parts, id);
});
