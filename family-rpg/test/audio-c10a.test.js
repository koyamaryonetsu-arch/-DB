// 第94回 F: 第3部 第2章 第1幕「赤と緑」の 曲（audio-c10a.js）
//   6曲が ある・id が 約束どおり・区切りの 長さ・ひとまわりの 秒・音の 高さ・強拍の ぶつかり・大きさの そろえ・名前・
//   古い 道と かけ上がる 道が 炎の山の ふし（おそい ／ 速い）・lavaStage で たいこと 低い 音が ふえる・
//   ふたつの道しるべの スピカの歌と 赤と 緑・根の国の 森の 頭・2つの ボスの 曲・今の 曲が かわって いない
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { _TRACKS, TRACK_IDS } from '../public/js/client/audio.js';
import { C10A_TRACKS, C10A_IDS, C10A_LINES, LAVA_INTENSITY } from '../public/js/client/audio-c10a.js';
import { C9D_TRACKS, C9D_SONG } from '../public/js/client/audio-c9d.js';
import { C9C_TRACKS } from '../public/js/client/audio-c9c.js';
import { compileTrack, legacyChannels, midiOf, MusicEngine, parseNotes, formOfPhase } from '../public/js/client/music-engine.js';
import { INSTRUMENTS } from '../public/js/client/music-inst.js';
import { TRACK_NAMES } from '../public/js/client/audio-names.js';
import { TRACK_TRIM } from '../public/js/client/audio-trim.js';
import { checkText } from '../tools/kanji-check.mjs';
import {
  SceneAudio, battleBgm, battlePhase, FORM_KEYS, FORM_KEYS0, isPart3Track,
  C10R_RUN_TRACK, lavaStageOf, lavaIntensity,
} from '../public/js/client/audio-scene.js';

const IDS = ['c10_fork', 'c10r_road', 'c10r_run', 'c10r_boss', 'c10g_roots', 'c10g_boss'];
const LOOPED = IDS.filter((id) => id !== 'c10_fork');
const secOf = (c, nm) => (c.segs[nm].steps * 60) / (c.segs[nm].bpm || c.bpm) / 4;
const loopSec = (c, f = c) => f.form.slice(f.loopFrom).reduce((a, n) => a + secOf(c, n), 0);
const notesOf = (evs) => evs.filter((e) => e.f).map((e) => Math.round(midiOf(e.f)));
const barNotes = (ev, bar = 16) => {
  const out = [];
  let t = 0;
  for (const e of ev) {
    const b = Math.floor(t / bar);
    (out[b] ||= []);
    if (e.f) out[b].push(Math.round(midiOf(e.f)));
    t += e.len;
  }
  return out;
};
// 炎の山の 低い うなり（c10r_run の sub_bass。ベースの 1オクターブ下）だけは 低くて よい
const LOW_PART = { c10r_run: 3 };

// ───── 小さな にせの AudioContext（audio-c9d.test.js と 同じ）─────
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
const run = (id, { phase = 0, intensity = 1 } = {}, sec) => {
  const { eng, log } = spyEngine();
  eng.start(id, _TRACKS[id], 0);
  eng.adaptive.setPhase(phase);
  eng.adaptive.setIntensity(intensity);
  eng.pump(sec);
  return { log, eng };
};

test('第94回 F: 6曲（約束の id）が 区切りで 書いて あり、ゲームの 曲に 入って いる・名前・大きさの そろえ', () => {
  assert.deepEqual(C10A_IDS, IDS);
  for (const id of IDS) {
    const tr = _TRACKS[id];
    assert.equal(tr.parts, C10A_TRACKS[id].parts, `${id}: 入って いる`);
    assert.ok(tr.sections && tr.form, id);
    assert.ok(TRACK_IDS.includes(id), id);
    assert.ok(isPart3Track(id), `${id}: 第3部の 曲`);
    assert.ok(TRACK_NAMES[id], `${id}: 名前`);
    assert.deepEqual(checkText(TRACK_NAMES[id]).filter((p) => p.kind !== 'kana'), [], id);
    assert.ok(!/\s/.test(TRACK_NAMES[id]), `${id}: スペース なし`);
    assert.ok(Number.isFinite(TRACK_TRIM[id]) && Math.abs(TRACK_TRIM[id]) <= 3, `${id}: 大きさの そろえ ${TRACK_TRIM[id]}`);
    // 中ボスの 名前・もとの 作品・少年の 名前は 出さない
    assert.ok(!/タマゴン|ドリル|モルド|カビ|だんしゃく|科学者|エッグ|バイキン|アルゴル|ソリトゥス/.test(TRACK_NAMES[id]), `${id}: ネタバレ ${TRACK_NAMES[id]}`);
  }
  for (const id of LOOPED) assert.ok(!_TRACKS[id].once && _TRACKS[id].loopFrom >= 1, `${id}: くり返す`);
  assert.equal(_TRACKS.c10_fork.once, true, '2つの 方向の 場面は くり返さない');
  assert.equal(new Set(Object.values(TRACK_NAMES)).size, Object.keys(TRACK_NAMES).length, '名前が かさならない');
});

test('第94回 F: 区切りの 長さ・ひとまわりの 秒・区切りごとに ちがう', () => {
  const range = { c10r_road: [60, 90], c10r_run: [50, 70], c10r_boss: [55, 90], c10g_roots: [60, 90], c10g_boss: [55, 90] };
  for (const id of IDS) {
    const c = compileTrack(_TRACKS[id]);
    assert.equal(c.bar, 16, id);
    for (const [nm, s] of Object.entries(c.segs)) {
      const lens = s.parts.map((p) => p.reduce((a, e) => a + e.len, 0));
      assert.ok(lens.every((l) => l === s.steps), `${id} ${nm}: ${lens.join(',')}`);
      assert.equal(s.steps % c.bar, 0, `${id} ${nm}`);
      assert.ok(s.parts.some((p) => p.some((e) => e.f > 0)), `${id} ${nm}: 音が ある`);
    }
    if (id === 'c10_fork') {
      const sec = c.form.reduce((a, n) => a + secOf(c, n), 0);
      assert.ok(sec >= 20 && sec <= 30, `2つの 方向: ${sec.toFixed(1)} 秒`);
      continue;
    }
    const [lo, hi] = range[id];
    const sec = loopSec(c);
    assert.ok(sec >= lo && sec <= hi, `${id}: ひとまわり ${sec.toFixed(1)} 秒`);
    const loopNames = c.form.slice(c.loopFrom);
    const sig = (nm) => c.parts.map((p, i) => JSON.stringify(c.segs[nm].parts[i].slice(0, 24))).join('|');
    assert.equal(new Set(loopNames.map(sig)).size, new Set(loopNames).size, `${id}: 区切りが ちがう`);
  }
});

test('第94回 F: テンポ・パートは 5つまで・楽器・音の 高さの はんい', () => {
  const range = { c10_fork: [100, 116], c10r_road: [70, 84], c10r_run: [144, 160], c10r_boss: [126, 144], c10g_roots: [84, 100], c10g_boss: [116, 136] };
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
    const pans = c.parts.filter((p) => p.role === 'harmony').map((p) => p.pan);
    assert.ok(Math.abs(pans.reduce((a, b) => a + b, 0)) <= 0.35, `${id}: 左右 ${pans}`);
    const all = Object.values(c.segs);
    const mel = all.flatMap((s) => notesOf(s.parts[lead]));
    const bs = all.flatMap((s) => notesOf(s.parts[bass]));
    assert.ok(Math.min(...mel) >= 67 && Math.max(...mel) <= 93, `${id}: メロディ ${Math.min(...mel)}〜${Math.max(...mel)}`);
    assert.ok(Math.min(...bs) >= 31 && Math.max(...bs) <= 62, `${id}: ベース ${Math.min(...bs)}〜${Math.max(...bs)}`);
    for (let i = 0; i < c.parts.length; i++) {
      if (c.parts[i].drums || i === lead || i === bass) continue;
      const ns = all.flatMap((s) => notesOf(s.parts[i]));
      const [a, b] = LOW_PART[id] === i ? [26, 50] : [48, 100];
      if (ns.length) assert.ok(Math.min(...ns) >= a && Math.max(...ns) <= b, `${id} パート ${i}: ${Math.min(...ns)}〜${Math.max(...ns)}`);
    }
    for (const s of all) {
      const ns = notesOf(s.parts[lead]);
      // 炎の山の ふしは 第3章の まま（11小節めの 頭に 13 の とびが 1つ ある）
      const jump = ['c10r_road', 'c10r_run'].includes(id) ? 13 : 12;
      for (let k = 1; k < ns.length; k++) assert.ok(Math.abs(ns[k] - ns[k - 1]) <= jump, `${id} ${s.name}: とび ${ns[k - 1]}→${ns[k]}`);
    }
  }
});

// 強拍（1・3拍め）: メロディと ベースが 短2度・増4度・長7度で ぶつからない。強拍で 鳴る パートどうしが 短2度（と 1オクターブ上）で にごらない
test('第94回 F: 強拍で ぶつからない・にごらない（0こ）', () => {
  const minN = { c10_fork: 18 };
  for (const id of IDS) {
    const c = compileTrack(_TRACKS[id]);
    const lead = c.parts.findIndex((p) => p.role === 'lead');
    const bass = c.parts.findIndex((p) => p.role === 'bass');
    let n = 0;
    const bad = [];
    for (const [nm, s] of Object.entries(c.segs)) {
      const tl = s.parts.map((p) => {
        let t = 0;
        return p.map((e) => { const o = { t, len: e.len, m: e.f ? Math.round(midiOf(e.f)) : null }; t += e.len; return o; });
      });
      const at = (i, st) => tl[i].find((e) => st >= e.t && st < e.t + e.len && e.m !== null);
      for (let st = 0; st < s.steps; st += c.bar / 2) {
        const m = at(lead, st), b = at(bass, st);
        if (m && b) {
          n++;
          const iv = (((m.m - b.m) % 12) + 12) % 12;
          if (iv === 1 || iv === 6 || iv === 11) bad.push(`${nm} ${st} ぶつかり ${m.m}/${b.m}`);
        }
        const ns = c.parts.map((p, i) => (p.drums ? null : at(i, st))).filter(Boolean);
        for (let a = 0; a < ns.length; a++) for (let b2 = a + 1; b2 < ns.length; b2++) {
          const d = Math.abs(ns[a].m - ns[b2].m);
          if (d === 1 || d === 13) bad.push(`${nm} ${st} にごり ${ns[a].m}/${ns[b2].m}`);
        }
      }
    }
    assert.ok(n >= (minN[id] ?? 40), `${id}: 強拍が すくない ${n}`);
    assert.deepEqual(bad, [], id);
  }
});

test('第94回 F: 古い 道と かけ上がる 道は 炎の山の ふし（行きは おそく・帰りは 速く）', () => {
  const volcano = _TRACKS.volcano;
  const vNotes = notesOf(parseNotes(volcano.ch[0].n));
  const vLens = parseNotes(volcano.ch[0].n).map((e) => e.len);
  assert.deepEqual(notesOf(parseNotes(C10A_LINES.volc.join(' '))), vNotes, '第3章の 炎の山の ふし 16小節');
  assert.deepEqual(parseNotes(C10A_LINES.volc.join(' ')).map((e) => e.len), vLens, '長さも 同じ');
  const road = compileTrack(_TRACKS.c10r_road);
  const runC = compileTrack(_TRACKS.c10r_run);
  for (const c of [road, runC]) {
    assert.deepEqual([...notesOf(c.segs.A.parts[0]), ...notesOf(c.segs.B.parts[0])], vNotes);
  }
  assert.deepEqual(notesOf(runC.segs.A2.parts[0]), notesOf(runC.segs.A.parts[0]), 'A2 も 同じ ふし');
  // 行きは 炎の山の 6わり より おそい・帰りは 行きの ちょうど 2倍（同じ 道の 行きと 帰り）
  assert.ok(road.bpm <= volcano.bpm * 0.6, `行き ${road.bpm}`);
  assert.equal(runC.bpm, road.bpm * 2, '帰りは 2倍');
  assert.ok(runC.bpm > volcano.bpm, '炎の山より 速い');
  // 静か: 行きの たいこは タムと リムだけ・帰りより ずっと 少ない
  const bar = (16 * 60) / road.bpm / 4;
  const a = run('c10r_road', {}, bar * 18).log.filter((x) => x.kind === 'd');
  assert.ok(a.every((x) => ['tl', 't', 'R'].includes(x.d)), `行きの たいこ ${[...new Set(a.map((x) => x.d))]}`);
  const b = run('c10r_run', {}, bar * 18).log.filter((x) => x.kind === 'd');
  assert.ok(a.length * 4 < b.length, `たいこ 行き ${a.length} 帰り ${b.length}`);
});

test('第94回 F: かけ上がる 道は lavaStage（0〜3）で たいこと 低い 音が ふえ、テンポが 少し 上がる（形は かえない）', () => {
  const tr = _TRACKS.c10r_run;
  const c = compileTrack(tr);
  assert.deepEqual(LAVA_INTENSITY, [0.4, 0.6, 0.8, 1]);
  for (let n = 0; n < 4; n++) assert.equal(lavaIntensity(n), LAVA_INTENSITY[n]);
  assert.equal(lavaIntensity(9), 1);
  assert.equal(lavaIntensity(-1), 0.4);
  // ふし・ベース・弦・キックは いつも。低い うなり・スネア は 1 から・タムは 2 から・低い ブラスは 3 だけ
  const minI = c.parts.map((p) => p.minI);
  assert.deepEqual(minI, [0, 0, 0, 0.6, 1, 0, 0.6, 0.8]);
  // だんは テンポだけ（形が かわらない ＝ ふしの とちゅうから 始め直さない）
  assert.deepEqual(tr.phases.map((p) => p.tempo), [1, 1.02, 1.04, 1.06]);
  for (let n = 0; n < 4; n++) {
    assert.equal(formOfPhase(c, n), c, `だん ${n}: 形は 同じ`);
    assert.equal(tr.phases[n].transpose, 0);
  }
  // にせの エンジン: 近いほど たいこと 低い 音（低い うなり・低い ブラス）が ふえる
  const bar = (16 * 60) / c.bpm / 4;
  const sec = secOf(c, 'intro') + bar * 16;
  const counts = [0, 1, 2, 3].map((n) => {
    const { log } = run('c10r_run', { phase: n, intensity: lavaIntensity(n) }, sec);
    const drumsN = log.filter((x) => x.kind === 'd').length;
    const low = log.filter((x) => x.inst === 'sub_bass' || x.inst === 'brass').length;
    const lead = log.filter((x) => x.inst === 'lead').length;
    return { drumsN, low, lead };
  });
  assert.equal(counts[0].low, 0, '遠い 間は 低い うなりなし');
  assert.ok(counts[1].low > 0 && counts[3].low > counts[2].low && counts[2].low >= counts[1].low, `低い 音 ${counts.map((x) => x.low)}`);
  for (let n = 1; n < 3; n++) assert.ok(counts[n].drumsN > counts[n - 1].drumsN, `たいこ ${counts.map((x) => x.drumsN)}`);
  assert.ok(counts[3].drumsN >= counts[2].drumsN && counts[3].drumsN > counts[0].drumsN * 1.8, `たいこ ${counts.map((x) => x.drumsN)}`);
  assert.ok(counts[0].lead > 0 && counts[0].lead >= counts[3].lead * 0.9, 'ふしは いつも');
});

test('第94回 F: 画面の lavaStage を 読む・c10r_run の 時だけ 強さと だんを 送る', () => {
  assert.ok(FORM_KEYS0.includes('lavaStage') && !FORM_KEYS.includes('lavaStage'), 'addFormKey0');
  assert.equal(C10R_RUN_TRACK, 'c10r_run');
  assert.equal(lavaStageOf({ field: {} }), 0);
  assert.equal(lavaStageOf({ field: { lavaStage: 2 } }), 2);
  assert.equal(lavaStageOf({ field: { lavaStage: () => 3 } }), 3, '関数でも よい');
  assert.equal(lavaStageOf({ field: { lavaStage: 9 } }), 3);
  assert.equal(lavaStageOf({ field: { lavaStage: -2 } }), 0);
  assert.equal(lavaStageOf({ field: { lavaStage: 1.7 } }), 1);
  assert.equal(lavaStageOf({ field: {}, lavaStage: 2 }), 2);
  assert.equal(lavaStageOf({ field: { lavaStage: 0 }, lavaStage: 2 }), 0, '画面の field が 先');
  assert.equal(lavaStageOf(null), 0);
  const mk = (mapId, bgm, extra = {}, playing = bgm) => {
    const log = [];
    const au = {
      music: null,
      play(id) { au.music = { id }; },
      setIntensity: (x) => log.push(['i', x]),
      setPhase: (x) => log.push(['p', x]),
      setPinch: () => {}, setTimeOfDay: () => {}, playAmbience: () => {}, stopAmbience: () => {},
    };
    const map = { id: mapId, kind: 'dungeon', bgm };
    const g = { sky: { isNight: () => false, flying: false }, field: { mapId, map, me: { x: 1, y: 1 }, nightOverride: null, hasFlag: () => false, areaName: () => '', weatherKind: () => null, areaBgm: () => bgm, ...extra } };
    const sa = new SceneAudio(au, { tracks: _TRACKS, maps: { [mapId]: map } });
    au.play(playing);
    sa.syncField(g, 0, true);
    return { log, sa, g, au };
  };
  // その 場所の 曲が c10r_run（ダンジョンの 深さでは なく ようがんの 近さ）
  assert.deepEqual(mk('c10r_2', 'c10r_run').log, [['i', 0.4], ['p', 0]]);
  const r = mk('c10r_2', 'c10r_run', { lavaStage: 2 });
  assert.deepEqual(r.log, [['i', 0.8], ['p', 2]]);
  r.g.field.lavaStage = 3;
  r.sa.syncField(r.g, 1000);
  assert.deepEqual(r.log.slice(2), [['i', 1], ['p', 3]], 'ようがんが 近づくと');
  // イベントの 曲（場所の 曲は 古い 道）でも 送る
  assert.deepEqual(mk('c10r_2', 'c10r_road', { lavaStage: 1 }, 'c10r_run').log, [['i', 0.6], ['p', 1]]);
  // ほかの 曲は lavaStage を 見ない
  assert.deepEqual(mk('c10r_2', 'c10r_road', { lavaStage: 3 }).log.filter((x) => x[0] === 'p'), []);
  // 戦いの pub に 出ても こまらない（0 から 数える しるし）
  const boss = (o) => battlePhase({ boss: true, enemies: [{ side: 'enemy', boss: true, hp: 90, maxHp: 100, ...o }] });
  assert.equal(boss({ lavaStage: 0 }), 0);
  assert.equal(boss({ lavaStage: 2 }), 2);
});

test('第94回 F: ふたつの道しるべは スピカの歌の 1ふしめ → 赤（炎の山の 頭）と 緑（森の 頭）→ 高い ミで おわる', () => {
  const c = compileTrack(_TRACKS.c10_fork);
  assert.equal(notesOf(c.segs.intro.parts[0]).length, 0, 'はじめは ハープだけ');
  assert.deepEqual(notesOf(c.segs.S.parts[0]), notesOf(parseNotes(C9D_SONG.phrases[0].join(' '))), 'スピカの歌の 1ふしめ');
  const bars = barNotes(c.segs.D.parts[0]);
  // 赤 ＝ 炎の山の 頭（ド・ド・ミb・ソ）・緑 ＝ 森の 頭（ミ・ファ#・ソ#）
  const volcano = notesOf(parseNotes(_TRACKS.volcano.ch[0].n));
  assert.deepEqual(bars[0].slice(0, 4).map((m) => m % 12), volcano.slice(0, 4).map((m) => m % 12));
  const forest = notesOf(parseNotes(_TRACKS.forest.ch[0].n));
  assert.deepEqual(bars[1].slice(0, 2), forest.slice(0, 2), '森の 頭 ミ・ファ#');
  const last = notesOf(c.segs.E.parts[0]).pop();
  assert.equal(last, 88, '高い ミで おわる');
  const { eng, log } = spyEngine();
  eng.start('c10_fork', _TRACKS.c10_fork, 0);
  eng.pump(60);
  assert.ok(eng.player.done(60), 'おわる');
  const sec = (12 * 16 * 60) / c.bpm / 4;
  assert.ok(Math.abs(eng.player.endT - sec) < 1e-6, `12小節 = ${sec.toFixed(1)} 秒 ${eng.player.endT}`);
  assert.ok(Math.max(...log.map((x) => x.t)) < sec, 'さいごの 音は おわりより 前');
});

test('第94回 F: 根の国は ささやきの森の 頭で 始まり、明るく 広い（長い 音・たいこ 少し）', () => {
  const c = compileTrack(_TRACKS.c10g_roots);
  const forest = notesOf(parseNotes(_TRACKS.forest.ch[0].n));
  const head = notesOf(c.segs.A.parts[0]);
  assert.deepEqual(head.slice(0, 4), forest.slice(0, 4), '森の 頭 ミ・ファ#・ソ・ラ');
  assert.deepEqual(notesOf(c.segs.A2.parts[0]), head, 'A2 も 同じ ふし');
  // 明るい: ト長調の 音だけ（B の さいごの ド# だけ イ長調の 和音）・平均の 長さが 森の 曲より 長い（のびやか）
  const all = ['A', 'B', 'C'].flatMap((nm) => notesOf(c.segs[nm].parts[0]));
  for (const m of all) assert.ok([0, 2, 4, 6, 7, 9, 11].includes(m % 12) || m % 12 === 1, `ト長調の 外 ${m}`);
  const avg = (ev) => { const ns = ev.filter((e) => e.f); return ns.reduce((a, e) => a + e.len, 0) / ns.length; };
  const fAvg = avg(parseNotes(_TRACKS.forest.ch[0].n));
  const rAvg = avg(['A', 'B', 'C'].flatMap((nm) => c.segs[nm].parts[0]));
  assert.ok(rAvg > fAvg * 1.1, `のびやか ${rAvg.toFixed(1)} / ${fAvg.toFixed(1)}`);
  // C（ほうしが まう）は たいこ なし
  const dr = c.parts.findIndex((p) => p.drums);
  assert.ok(c.segs.C.parts[dr].filter((e) => e.drum).length <= 4);
});

test('第94回 F: 2つの ボスの 曲（機械の ガタゴト ／ はねる スウィング）・ピンチ・戦いの だん', () => {
  // 科学者: マリンバの 16分（ガタゴト）が A で ずっと・リムの 「ガタ・ゴト」
  const rb = compileTrack(_TRACKS.c10r_boss);
  const mar = rb.parts.findIndex((p) => p.inst === 'marimba');
  assert.equal(rb.segs.A.parts[mar].filter((e) => e.f).length, 16 * 8, 'ガタゴト 16分');
  const rbDr = rb.parts.findIndex((p) => p.drums);
  assert.ok(rb.segs.A.parts[rbDr].filter((e) => e.drum === 'R').length >= 20, 'リム');
  // ドリル: 同じ 音の 16分
  const b1 = notesOf(rb.segs.B.parts[0]).slice(0, 4);
  assert.equal(new Set(b1).size, 1, `ドリル ${b1}`);
  assert.equal(_TRACKS.c10r_boss.pinch.n.split(' ')[0], 'F6:2', 'ピンチは 主音から');
  // だんしゃく: はねる 8分・ピチカートの ふし・ブラス
  const gb = _TRACKS.c10g_boss;
  assert.ok(gb.swing >= 0.12 && gb.swing <= 0.25, `スウィング ${gb.swing}`);
  assert.equal(gb.parts[0].i, 'pluck');
  assert.ok(gb.parts.some((p) => p.i === 'brass'));
  assert.equal(gb.pinch.n.split(' ')[0], 'A6:2', 'ピンチは 主音から');
  // 戦いの 曲を ボスの bgm に するのは B班（snap.bgm を そのまま 使う）。ふつうの 戦いは battle3
  for (const id of ['c10r_boss', 'c10g_boss']) {
    assert.equal(battleBgm({ snapBgm: id, mapId: 'c10r_3', has: (x) => !!_TRACKS[x] }), id);
    assert.ok(!_TRACKS[id].phases, `${id}: ふつうの ボスの だん（HP 半分で）`);
  }
  assert.equal(battleBgm({ snapBgm: 'battle', mapId: 'c10g_1', has: (x) => !!_TRACKS[x] }), 'battle3');
});

test('第94回 F: 前の音 用の ch・今まで の 曲は かわって いない', () => {
  for (const id of IDS) {
    const tr = _TRACKS[id];
    assert.equal(tr.ch.length, tr.parts.length, id);
    for (const ch of tr.ch) for (const t of ch.n.split(/\s+/)) assert.match(t, ch.drums ? /^[kshr]:\d+$/ : /^(r|[A-G][#b]?\d):\d+$/, `${id}: ${t}`);
    const total = (ch) => ch.n.split(/\s+/).reduce((a, t) => a + Number(t.split(':')[1]), 0);
    assert.equal(new Set(tr.ch.map(total)).size, 1, `${id}: 前の音の チャンネルの 長さ`);
    assert.equal(legacyChannels(tr).ch, tr.ch, id);
  }
  for (const id of [...Object.keys(C9C_TRACKS), ...Object.keys(C9D_TRACKS), 'volcano', 'forest', 'battle', 'field']) {
    assert.ok(!(id in C10A_TRACKS), id);
    if (C9C_TRACKS[id]) assert.equal(_TRACKS[id].parts, C9C_TRACKS[id].parts, id);
    if (C9D_TRACKS[id]) assert.equal(_TRACKS[id].parts, C9D_TRACKS[id].parts, id);
  }
  assert.ok(Array.isArray(_TRACKS.volcano.ch) && !_TRACKS.volcano.sections, '炎の山の 曲は 前の まま');
});
