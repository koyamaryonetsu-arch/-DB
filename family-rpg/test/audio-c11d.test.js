// 第104回 F: 第3部 第3章 第4幕「かがやきの女王と、八つめの音」の 曲（audio-c11d.js）
//   8曲が ある・id が 約束どおり・区切りの 長さ・ひとまわりの 秒・音の 高さ・強拍の ぶつかり・大きさの そろえ・名前（ネタバレなし）・
//   塔が towerStage で 楽器が 1つずつ 足される（その 階の 幕の ふし）・中ボスが 鏡と 月の 使いの ふしを 4小節ずつ かわるがわる・
//   女王が 1つの 音の 上で 進む・八つめの 音の 場面が 第1部の エンディングの 頭と 和音に おさまる 高い レ・後半が スピカの歌 8ふし・
//   お祭りが おもてと うらの ふしを いっしょに・おわりの 曲が 8ふし さいごまで・今の 曲が かわって いない
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { _TRACKS, TRACK_IDS } from '../public/js/client/audio.js';
import {
  C11D_TRACKS, C11D_IDS, C11D_LINES, C11D_CHORDS, splitBars, TOWER_ISLE, TOWER_ISLE_SHIFT, TOWER_MOON, TOWER_MOON_SHIFT, TOWER_HALL_DR,
  TOWER_SONG, TOWER_INTENSITY, DUO_BLOCK, DUO_BLOCKS, DUO_MIRROR_SHIFT, QUEEN_STAR, QUEEN_TEMPOS, ENDING5_HEAD, EIGHT_LAST_CHORD, EIGHT_RUN,
  SONG8, SONG8_CHORDS, SONG_ALL, END_BPM,
} from '../public/js/client/audio-c11d.js';
import { C11C_TRACKS } from '../public/js/client/audio-c11c.js';
import { C11B_LINES, MIRROR_SUM } from '../public/js/client/audio-c11b.js';
import { C11A_LINES } from '../public/js/client/audio-c11a.js';
import { C9D_SONG } from '../public/js/client/audio-c9d.js';
import { MIRROR_LINES, EIGHTH_NOTE, BRIDGE_LAST } from '../public/js/client/audio-c10d.js';
import { compileTrack, legacyChannels, midiOf, MusicEngine, parseNotes, formOfPhase, phaseOf } from '../public/js/client/music-engine.js';
import { INSTRUMENTS } from '../public/js/client/music-inst.js';
import { TRACK_NAMES } from '../public/js/client/audio-names.js';
import { TRACK_TRIM } from '../public/js/client/audio-trim.js';
import { checkText, gameFiles } from '../tools/kanji-check.mjs';
import {
  SceneAudio, battleBgm, battlePhase, FORM_KEYS, FORM_KEYS0, isPart3Track,
  C11D_TOWER_TRACK, TOWER_STAGES, towerStageOf, towerIntensity, pairStageOf, conStageOf, gateStageOf, sideStageOf,
} from '../public/js/client/audio-scene.js';

const IDS = ['c11d_scale', 'c11d_tower', 'c11d_duo', 'c11d_queen', 'c11d_eight', 'c11d_queen2', 'c11d_lamps', 'c11d_end'];
const ONCE = ['c11d_eight', 'c11d_end'];
const LOOPED = IDS.filter((id) => !ONCE.includes(id));
const secOf = (c, nm) => (c.segs[nm].steps * 60) / (c.segs[nm].bpm || c.bpm) / 4;
const formSec = (c, form, from = 0) => form.slice(from).reduce((a, n) => a + secOf(c, n), 0);
const notesOf = (evs) => evs.filter((e) => e.f).map((e) => Math.round(midiOf(e.f)));
const lensOf = (evs) => evs.map((e) => [e.f ? 'n' : 'r', e.len]);
const lineNotes = (list) => notesOf(parseNotes([list].flat().join(' ')));
const lineLens = (list) => lensOf(parseNotes([list].flat().join(' ')));
const pcOf = (m) => ((m % 12) + 12) % 12;
const timeline = (p) => {
  let t = 0;
  return p.map((e) => { const o = { t, len: e.len, m: e.f ? Math.round(midiOf(e.f)) : null, acc: e.acc, drum: e.drum, fs: e.fs }; t += e.len; return o; });
};
const chordPcs = (e) => [...new Set((e.fs || [e.f]).map((f) => pcOf(Math.round(midiOf(f)))))].sort((a, b) => a - b);
const partOf = (c, inst) => c.parts.findIndex((p) => p.inst === inst);
// ある 区切りの パート i の 小節 b0〜b1（ふくまない）の 音
const barNotes = (c, nm, i, b0, b1) => timeline(c.segs[nm].parts[i]).filter((e) => e.m !== null && e.t >= b0 * c.bar && e.t < b1 * c.bar);

// ───── 小さな にせの AudioContext（audio-c11c.test.js と 同じ）─────
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
const run = (id, { phase = 0, intensity = 1, pinch = false } = {}, sec) => {
  const { eng, log } = spyEngine();
  eng.start(id, _TRACKS[id], 0);
  eng.adaptive.setPhase(phase);
  eng.adaptive.setIntensity(intensity);
  eng.adaptive.setPinch(pinch);
  eng.pump(sec);
  return { log, eng };
};

test('第104回 F: 8曲（約束の id）が 区切りで 書いて あり、ゲームの 曲に 入って いる・名前（ネタバレなし）・大きさの そろえ・漢字の しらべ', () => {
  assert.deepEqual(C11D_IDS, IDS);
  for (const id of IDS) {
    const tr = _TRACKS[id];
    assert.equal(tr.parts, C11D_TRACKS[id].parts, `${id}: 入って いる`);
    assert.ok(tr.sections && tr.form, id);
    assert.ok(TRACK_IDS.includes(id), id);
    assert.ok(isPart3Track(id), `${id}: 第3部の 曲`);
    const name = TRACK_NAMES[id];
    assert.ok(name, `${id}: 名前`);
    assert.deepEqual(checkText(name).filter((p) => p.kind !== 'kana'), [], id);
    assert.ok(!/\s/.test(name), `${id}: スペース なし`);
    assert.ok(Number.isFinite(TRACK_TRIM[id]) && Math.abs(TRACK_TRIM[id]) <= 3, `${id}: 大きさの そろえ ${TRACK_TRIM[id]}`);
    // 前の 幕の きまり（ボスの 名前・もとの お話・物語の ひみつ）
    assert.ok(!/オボロ|おぼろ|朧|かぐや|竹|たけ|姫|ひめ|女王|じょおう|王女|むすめ|娘|わすれ|忘|むかえ|迎|天人|てんにん|衣|ころも|はかり|ながされ|流され|使い|番人|ばんにん|アルゴル|少年|ソリトゥス|カイ|ミラーレ|鏡|8つ|八つ|やっつ|足りない|たりない|ない$/.test(name), `${id}: ネタバレ ${name}`);
    assert.ok(!/アリス|ハート|トランプ|兵隊|へいたい|隊長|たいちょう|近衛|このえ|首|くび|はねよ|スペード|ダイヤ|クラブ|食べ|たべ|わけ|ひみつ|星の音|かげの台/.test(name), `${id}: ネタバレ（前の 幕） ${name}`);
    // この 幕の きまり（20-1）: 女王・ボスの 名前・カイ・ソリトゥス・第1部と 第2部の ひみつ・八つめ・「完」・トキネ・勇者・手放す 光の 正体
    assert.ok(!/ポラリス|北極|王さま|王様|ひとりぼっち|ひとり|のこった|残った|第1部|第2部|第3部|完|おわり|さいご|最後|エンディング|トキネ|勇者|像|八|８|ノクト|スピカ|魔王|勝|負け|たおす|倒/.test(name), `${id}: ネタバレ（この 幕） ${name}`);
    assert.ok(tr.night && !Object.keys(tr.night).length, `${id}: 夜の 楽器の かえは しない`);
  }
  for (const id of LOOPED) assert.ok(!_TRACKS[id].once && _TRACKS[id].loopFrom >= 1, `${id}: くり返す`);
  for (const id of ONCE) assert.equal(_TRACKS[id].once, true, `${id}: くり返さない`);
  assert.equal(new Set(Object.values(TRACK_NAMES)).size, Object.keys(TRACK_NAMES).length, '名前が かさならない');
  assert.ok(gameFiles().some((f) => f.endsWith('public/js/client/audio-c11d.js')), '漢字の しらべに 入って いる');
});

test('第104回 F: 区切りの 長さ・ひとまわりの 秒・区切りごとに ちがう・短い 曲と おわりの 曲の 長さ', () => {
  const range = { c11d_scale: [45, 80], c11d_tower: [45, 80], c11d_duo: [40, 70], c11d_queen: [50, 80], c11d_queen2: [45, 80], c11d_lamps: [45, 80] };
  for (const id of IDS) {
    const c = compileTrack(_TRACKS[id]);
    assert.equal(c.bar, 16, id);
    for (const [nm, s] of Object.entries(c.segs)) {
      const lens = s.parts.map((p) => p.reduce((a, e) => a + e.len, 0));
      assert.ok(lens.every((l) => l === s.steps), `${id} ${nm}: ${lens.join(',')}`);
      assert.equal(s.steps % c.bar, 0, `${id} ${nm}`);
      assert.ok(s.parts.some((p) => p.some((e) => e.f > 0)), `${id} ${nm}: 音が ある`);
    }
    if (ONCE.includes(id)) continue;
    const [lo, hi] = range[id];
    const sec = formSec(c, c.form, c.loopFrom);
    assert.ok(sec >= lo && sec <= hi, `${id}: ひとまわり ${sec.toFixed(1)} 秒`);
    const loopNames = c.form.slice(c.loopFrom);
    const sig = (nm) => c.parts.map((p, i) => JSON.stringify(c.segs[nm].parts[i].slice(0, 24))).join('|');
    assert.equal(new Set(loopNames.map(sig)).size, new Set(loopNames).size, `${id}: 区切りが ちがう`);
  }
  // 八つめの 音の 場面 12〜18 秒・おわりの 曲 45〜80 秒
  const want = { c11d_eight: [12, 18], c11d_end: [45, 80] };
  for (const id of ONCE) {
    const c = compileTrack(_TRACKS[id]);
    const sec = formSec(c, c.form);
    assert.ok(sec >= want[id][0] && sec <= want[id][1], `${id}: ${sec.toFixed(2)} 秒`);
    const { eng, log } = spyEngine();
    eng.start(id, _TRACKS[id], 0);
    eng.pump(200);
    assert.ok(eng.player.done(200), `${id}: おわる`);
    assert.ok(Math.abs(eng.player.endT - sec) < 1e-6, `${id}: ${sec.toFixed(1)} 秒`);
    assert.ok(Math.max(...log.map((x) => x.t)) < sec, `${id}: さいごの 音は おわりより 前`);
  }
});

test('第104回 F: テンポ・パートは 5つまで・楽器・音の 高さの はんい・とびすぎない', () => {
  const range = {
    c11d_scale: [56, 76], c11d_tower: [96, 116], c11d_duo: [140, 164], c11d_queen: [104, 126],
    c11d_eight: [76, 96], c11d_queen2: [116, 136], c11d_lamps: [96, 112], c11d_end: [96, 116],
  };
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
    const ml = all.flatMap((s) => notesOf(s.parts[lead]));
    const bs = all.flatMap((s) => notesOf(s.parts[bass]));
    assert.ok(Math.min(...ml) >= 67 && Math.max(...ml) <= 93, `${id}: メロディ ${Math.min(...ml)}〜${Math.max(...ml)}`);
    assert.ok(Math.min(...bs) >= 31 && Math.max(...bs) <= 62, `${id}: ベース ${Math.min(...bs)}〜${Math.max(...bs)}`);
    for (let i = 0; i < c.parts.length; i++) {
      if (c.parts[i].drums || i === lead || i === bass) continue;
      const ns = all.flatMap((s) => notesOf(s.parts[i]));
      if (ns.length) assert.ok(Math.min(...ns) >= 48 && Math.max(...ns) <= 100, `${id} パート ${i}: ${Math.min(...ns)}〜${Math.max(...ns)}`);
    }
    // 1小節 いじょう 休んだ あとは 新しい ふし。区切りを またいでも（form の じゅん・くり返しの もどりも）見る
    const order = [...c.form, ...c.form.slice(c.loopFrom ?? c.form.length)];
    let prev = null;
    let gap = 0;
    for (const nm of order) {
      for (const e of c.segs[nm].parts[lead]) {
        if (!e.f) { gap += e.len; continue; }
        const m = Math.round(midiOf(e.f));
        if (prev !== null && gap < c.bar) assert.ok(Math.abs(m - prev) <= 12, `${id} ${nm}: とび ${prev}→${m}`);
        prev = m;
        gap = 0;
      }
    }
  }
});

// 強拍（小節の 頭と まん中）: ふし（メロディ。中ボスの 笛・お祭りの うら通りの 笛 も ふし として 見る）と ベースが
//   短2度・増4度・長7度で ぶつからない。強拍で 鳴る パートどうしが 短2度（と 1オクターブ上）で にごらない（塔の 足される 楽器・女王の 星も ふくめて）
test('第104回 F: 強拍で ぶつからない・にごらない（0こ）', () => {
  const minN = { c11d_eight: 8, c11d_scale: 30 };
  const extraMel = { c11d_duo: ['flute'], c11d_lamps: ['flute'] };
  for (const id of IDS) {
    const c = compileTrack(_TRACKS[id]);
    const lead = c.parts.findIndex((p) => p.role === 'lead');
    const bass = c.parts.findIndex((p) => p.role === 'bass');
    const mels = [lead, ...(extraMel[id] || []).map((n) => partOf(c, n))];
    const beats = [0, c.bar / 2];
    let n = 0;
    const bad = [];
    for (const nm of Object.keys(c.segs)) {
      const s = c.segs[nm];
      const tl = s.parts.map(timeline);
      const at = (i, st) => tl[i].find((e) => st >= e.t && st < e.t + e.len && e.m !== null);
      for (let b0 = 0; b0 < s.steps; b0 += c.bar) for (const off of beats) {
        const st = b0 + off;
        const b = at(bass, st);
        for (const mi of mels) {
          const m = at(mi, st);
          if (m && b) {
            n++;
            const iv = pcOf(m.m - b.m);
            if (iv === 1 || iv === 6 || iv === 11) bad.push(`${nm} ${st} ぶつかり ${m.m}/${b.m}`);
          }
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

test('第104回 F: 塔は towerStage（階 1〜4）で その 階の 幕の 楽器・ふしが 1つずつ 足される（ふし・形・調・テンポは 同じ）', () => {
  const tr = _TRACKS.c11d_tower;
  const c = compileTrack(tr);
  assert.deepEqual(TOWER_INTENSITY, [0, 0.25, 0.5, 0.75, 1]);
  assert.deepEqual(c.parts.map((p) => p.minI), [0, 0, 0.25, 0.5, 1, 0, 0.75]);
  assert.ok(!tr.phases, 'だんは ない ＝ イントロへ もどらない');
  assert.equal(formOfPhase(c, 3), c, '形は かわらない');
  const bell = partOf(c, 'bell');
  const mar = partOf(c, 'marimba');
  const fl = partOf(c, 'flute');
  // 1 階: 星座の島（c11a_isle の A の 頭 2小節。3つ 上）が ベルで A の 1・2小節め
  const isle = compileTrack(_TRACKS.c11a_isle);
  const isleHead = barNotes(isle, 'A', 0, 0, 2).map((e) => e.m);
  assert.equal(TOWER_ISLE_SHIFT, 3);
  assert.deepEqual(barNotes(c, 'A', bell, 0, 2).map((e) => e.m), isleHead.map((m) => m + 3), '星座の島の ふし');
  assert.deepEqual(lineLens(TOWER_ISLE), lineLens(C11A_LINES.isleA.slice(0, 2)), '長さも 同じ');
  // 2 階: 月の都の塔（c11b_tower の A の 頭 2小節。5つ 上）が マリンバ（おもての 楽器）で A の 5・6小節め
  const moon = compileTrack(_TRACKS.c11b_tower);
  assert.equal(moon.parts[0].inst, 'marimba');
  assert.equal(TOWER_MOON_SHIFT, 5);
  assert.deepEqual(barNotes(c, 'A', mar, 4, 6).map((e) => e.m), barNotes(moon, 'A', 0, 0, 2).map((e) => e.m + 5), '月の都の塔の ふし');
  assert.deepEqual(lineLens(TOWER_MOON), lineLens(C11B_LINES.towerA.slice(0, 2)));
  // 3 階: 回ろう（c11c_hall）の たいこと 同じ こちこち（リムと シェイカー）
  const hall = compileTrack(C11C_TRACKS.c11c_hall);
  const hdr = hall.parts.findIndex((p) => p.drums);
  const hallBar = timeline(hall.segs.A.parts[hdr]).filter((e) => e.t < 16 && e.drum).map((e) => [e.drum, e.t]);
  const mine = c.parts.findIndex((p) => p.drums && p.minI === 0.75);
  assert.deepEqual(timeline(c.segs.A.parts[mine]).filter((e) => e.t < 16 && e.drum).map((e) => [e.drum, e.t]), hallBar, '回ろうの こちこち');
  assert.deepEqual(timeline(parseNotes(TOWER_HALL_DR)).filter((e) => e.drum).map((e) => e.drum), ['R', 'sh', 'sh', 'R', 'sh', 'sh']);
  // 4 階: スピカの歌の 1ふしめの 頭 2小節が 笛で B の 5・6小節め
  assert.deepEqual(TOWER_SONG, C9D_SONG.phrases[0].slice(0, 2));
  assert.deepEqual(barNotes(c, 'B', fl, 4, 6).map((e) => e.m), lineNotes(C9D_SONG.phrases[0].slice(0, 2)), 'スピカの歌の 頭');
  // かけらの 所の 和音は もとの 曲の 和音を うつした 物
  assert.deepEqual(C11D_CHORDS.tower.A.slice(0, 2), ['C', 'F'], '星座の島 A・D を 3つ 上');
  assert.deepEqual(C11D_CHORDS.tower.A.slice(4, 6), ['Am', 'F'], '月の都の塔 Em・C を 5つ 上');
  assert.deepEqual(C11D_CHORDS.tower.B.slice(4, 6), C9D_SONG.chords[0].slice(0, 2));
  // にせの エンジンで 鳴らす: 階ごとに 楽器が 1つずつ ふえる。ブラスの ふしは どの 階も 同じ
  const sec = formSec(c, ['intro', 'A', 'B']);
  const kinds = TOWER_INTENSITY.map((x) => {
    const { log } = run('c11d_tower', { intensity: x }, sec);
    return {
      insts: [...new Set(log.filter((e) => e.kind === 'v').map((e) => e.inst))].sort(),
      drums: [...new Set(log.filter((e) => e.kind === 'd').map((e) => e.d))].sort(),
      brass: log.filter((e) => e.inst === 'brass').map((e) => [e.f, e.t]),
    };
  });
  assert.deepEqual(kinds[0].insts, ['bass', 'brass'], '0: 出て いない 間');
  assert.deepEqual(kinds[1].insts, ['bass', 'bell', 'brass'], '1 階: ＋ ベル');
  assert.deepEqual(kinds[2].insts, ['bass', 'bell', 'brass', 'marimba'], '2 階: ＋ マリンバ');
  assert.deepEqual(kinds[3].insts, kinds[2].insts, '3 階: 楽器は たいこ');
  assert.ok(!kinds[2].drums.includes('sh') && kinds[3].drums.includes('sh') && kinds[3].drums.includes('R'), '3 階: ＋ こちこち');
  assert.deepEqual(kinds[4].insts, ['bass', 'bell', 'brass', 'flute', 'marimba'], '4 階: ＋ 笛');
  for (const k of kinds) assert.deepEqual(k.brass, kinds[0].brass, 'ふしは 同じ（高さも 時も）');
  assert.equal(pcOf(notesOf(c.segs.A.parts[1])[0]), 0, 'イ短調（ハ長調の 和音から のぼる）');
});

test('第104回 F: 画面の towerStage を 読む・塔の 曲の 時だけ 強さを 送る（ダンジョンでも・だんは 送らない）', () => {
  assert.ok(FORM_KEYS0.includes('towerStage') && !FORM_KEYS.includes('towerStage'), 'addFormKey0');
  assert.equal(C11D_TOWER_TRACK, 'c11d_tower');
  assert.equal(TOWER_STAGES, 5);
  assert.equal(towerStageOf({ field: {} }), 0, '出て いない 間は 0');
  assert.equal(towerStageOf(null), 0);
  assert.equal(towerStageOf({ field: { towerStage: 2 } }), 2);
  assert.equal(towerStageOf({ field: { towerStage: () => 3 } }), 3, '関数でも よい');
  assert.equal(towerStageOf({ field: { towerStage: true } }), 4);
  assert.equal(towerStageOf({ field: { towerStage: 9 } }), 4);
  assert.equal(towerStageOf({ field: { towerStage: -1 } }), 0);
  assert.equal(towerStageOf({ field: {}, towerStage: 1 }), 1);
  assert.deepEqual([0, 1, 2, 3, 4].map(towerIntensity), TOWER_INTENSITY);
  const mk = (mapId, bgm, extra = {}, playing = bgm, kind = 'dungeon') => {
    const log = [];
    const au = {
      music: null,
      play(id) { au.music = { id }; },
      setIntensity: (x) => log.push(['i', x]),
      setPhase: (x) => log.push(['p', x]),
      setPinch: () => {}, setTimeOfDay: () => {}, playAmbience: () => {}, stopAmbience: () => {},
    };
    const map = { id: mapId, kind, bgm };
    const maps = {};
    for (const id of ['c11d_tower1', 'c11d_tower2', 'c11d_tower2b', 'c11d_tower3', 'c11d_tower4']) maps[id] = { id, kind, bgm };
    maps[mapId] = map;
    const g = { sky: { isNight: () => false, flying: false }, field: { mapId, map, me: { x: 1, y: 1 }, nightOverride: null, hasFlag: () => false, areaName: () => '', weatherKind: () => null, areaBgm: () => bgm, ...extra } };
    const sa = new SceneAudio(au, { tracks: _TRACKS, maps });
    au.play(playing);
    sa.syncField(g, 0, true);
    return { log, sa, g, au };
  };
  // 塔の 階（ダンジョン）: 階の しるしで 強さ（深さの 強さでは ない）
  assert.deepEqual(mk('c11d_tower1', 'c11d_tower', { towerStage: 1 }).log, [['i', 0.25]]);
  assert.deepEqual(mk('c11d_tower4', 'c11d_tower', { towerStage: 4 }).log, [['i', 1]]);
  assert.deepEqual(mk('c11d_tower3', 'c11d_tower').log, [['i', 0]], '出て いない 間は 0');
  const r = mk('c11d_tower2', 'c11d_tower', { towerStage: 2 });
  assert.deepEqual(r.log, [['i', 0.5]]);
  r.g.field.towerStage = 3;
  r.sa.syncField(r.g, 1000);
  assert.deepEqual(r.log.slice(1), [['i', 0.75]], '上の 階へ 行くと 次の 小節から');
  // 戦いの あとに もどったら（曲が 新しく なったら）送りなおす
  r.au.play('c11d_tower');
  r.sa.syncField(r.g, 2000, true);
  assert.deepEqual(r.log.slice(2), [['i', 0.75]]);
  assert.equal(r.log.filter((x) => x[0] === 'p').length, 0, 'だんは 送らない');
  // イベントの 曲でも 送る・ほかの 曲は ふつう・ジングルの 間は 送らない
  assert.deepEqual(mk('c11d_scale', 'c11d_scale', { towerStage: 2 }, 'c11d_tower', 'field').log, [['i', 0.5]]);
  assert.deepEqual(mk('c11d_scale', 'c11d_scale', { towerStage: 2 }, 'c11d_scale', 'field').log, [['i', 1]], 'はかりの 広間は ふつう');
  assert.deepEqual(mk('c11d_tower2', 'c11d_tower', { towerStage: 2 }, 'c11d_eight').log, [], 'ジングルの 間は さわらない');
  // ほかの しるしとは まざらない
  assert.equal(pairStageOf({ field: { towerStage: 1 } }), 0);
  assert.equal(conStageOf({ field: { towerStage: 1 } }), 0);
  assert.equal(gateStageOf({ field: { towerStage: 1 } }), 0);
  assert.equal(sideStageOf({ field: { towerStage: 1 } }), 0);
  assert.equal(towerStageOf({ field: { pairStage: 1, conStage: 2 } }), 0);
  const boss = (o) => battlePhase({ boss: true, enemies: [{ side: 'enemy', boss: true, hp: 90, maxHp: 100, ...o }] });
  assert.equal(boss({ towerStage: 0 }), 0);
});

test('第104回 F: 広間は おごそか・つめたい（かねの ふし・オルガンの のばし・ハ短調・たいこは 遠い タムだけ）', () => {
  const c = compileTrack(_TRACKS.c11d_scale);
  assert.equal(c.parts[0].inst, 'bell', 'かね');
  assert.ok(c.parts.some((p) => p.inst === 'organ'), 'オルガンの のばし');
  // ゆっくり・長い 音（ふしの 音の 平均の 長さ ≥ 6）
  const evs = [...C11D_LINES.scaleA, ...C11D_LINES.scaleB].flatMap((b) => parseNotes(b)).filter((e) => e.f);
  assert.ok(evs.reduce((a, e) => a + e.len, 0) / evs.length >= 6, 'ゆっくり');
  // ハ短調（ミb・ラb・シ）
  const pcs = lineNotes([...C11D_LINES.scaleA, ...C11D_LINES.scaleB]).map(pcOf);
  for (const p of [3, 8, 11]) assert.ok(pcs.includes(p), `音 ${p}`);
  // こわすぎない: キック・スネアなし
  const dr = c.parts.findIndex((p) => p.drums);
  for (const s of Object.values(c.segs)) assert.ok(s.parts[dr].every((e) => !e.drum || ['tl', 't', 'th', 'c'].includes(e.drum)));
  // B の おわりは ソの 和音（A の ドへ もどる）
  assert.equal(C11D_CHORDS.scale.B.at(-1), 'G');
});

test('第104回 F: 中ボスは 鏡の ふし（オルガン）と 月の 使いの ふし（笛）が 4小節ずつ かわるがわる（もとの ふしと くらべる）', () => {
  const tr = _TRACKS.c11d_duo;
  const c = compileTrack(tr);
  const org = partOf(c, 'organ');
  const fl = partOf(c, 'flute');
  assert.equal(c.parts[org].role, 'lead');
  assert.equal(DUO_BLOCK, 4);
  const mirror = compileTrack(_TRACKS.c10d_mirror);
  const oboro = compileTrack(_TRACKS.c11b_oboro);
  assert.equal(mirror.parts[0].inst, 'organ', '鏡の 曲の 楽器');
  assert.equal(oboro.parts[0].inst, 'flute', '月の 使いの 曲の 楽器');
  for (const nm of ['A', 'B']) {
    const blocks = DUO_BLOCKS[nm];
    assert.deepEqual(blocks.map((b) => b.who), ['mirror', 'oboro', 'mirror', 'oboro'], `${nm}: かわるがわる`);
    assert.equal(c.segs[nm].steps, 16 * c.bar);
    blocks.forEach((b, k) => {
      const o = barNotes(c, nm, org, k * 4, k * 4 + 4).map((e) => e.m);
      const f = barNotes(c, nm, fl, k * 4, k * 4 + 4).map((e) => e.m);
      if (b.who === 'mirror') {
        // 鏡の 曲の 問い（1〜4小節）か こたえ（5〜8小節）を 2つ 下（ホ短調 → ニ短調）
        const src = barNotes(mirror, nm, 0, k === 0 ? 0 : 4, k === 0 ? 4 : 8).map((e) => e.m + DUO_MIRROR_SHIFT);
        assert.deepEqual(o, src, `${nm} ${k}: 鏡の ふし`);
        assert.deepEqual(lineNotes(MIRROR_LINES[nm][k === 0 ? 'q' : 'a']).map((m) => m - 2), o);
        assert.deepEqual(f, [], `${nm} ${k}: 笛は 休み`);
      } else {
        // 月の 使いの 曲の 1〜4小節か 5〜8小節（同じ 音・同じ 長さ）
        const src = barNotes(oboro, nm, 0, k === 1 ? 0 : 4, k === 1 ? 4 : 8);
        const mine = barNotes(c, nm, fl, k * 4, k * 4 + 4);
        assert.deepEqual(mine.map((e) => [e.m, e.len, e.t - k * 64]), src.map((e) => [e.m, e.len, e.t - (k === 1 ? 0 : 64)]), `${nm} ${k}: 月の 使いの ふし`);
        assert.deepEqual(o, [], `${nm} ${k}: オルガンは 休み`);
      }
    });
    // かたまりの さいごの 小節は フィル（前ぶれ。タムか スネアの こまかい 音）
    const dr = c.parts.findIndex((p) => p.drums);
    for (let k = 0; k < 4; k++) {
      const fill = timeline(c.segs[nm].parts[dr]).filter((e) => e.drum && e.t >= (k * 4 + 3) * 16 && e.t < (k * 4 + 4) * 16);
      assert.ok(fill.filter((e) => ['t', 'th', 'tl', 's'].includes(e.drum)).length >= 5, `${nm} ${k}: 前ぶれ`);
    }
  }
  // 鏡の 小節は 3拍子 → 4拍子（さいごの 音を のばす。音の じゅんは そのまま）
  assert.deepEqual(lineLens(DUO_BLOCKS.A[0].bars[0]), [['n', 4], ['n', 2], ['n', 2], ['n', 8]]);
  // きびきび・ニ短調・ボスの だんで テンポだけ
  assert.ok(tr.bpm >= 140);
  for (let n = 0; n < 4; n++) assert.equal(phaseOf(c, n).transpose, 0);
  assert.ok(phaseOf(c, 3).tempo > 1);
  assert.equal(battleBgm({ snapBgm: 'c11d_duo', mapId: 'c11d_tower4', has: (x) => !!_TRACKS[x] }), 'c11d_duo');
});

test('第104回 F: 女王（前半）は 高い ソ 1つが ずっと 鳴りつづける 上で 進む・ボスの だんで テンポだけ 上がる', () => {
  const tr = _TRACKS.c11d_queen;
  const c = compileTrack(tr);
  assert.equal(QUEEN_STAR, 'G6');
  const st = partOf(c, 'organ');
  const starM = lineNotes('G6:1')[0];
  for (const nm of c.form) {
    const tl = timeline(c.segs[nm].parts[st]);
    assert.ok(tl.every((e) => e.m === starM), `${nm}: 1つの 音だけ（休みも ない）`);
    assert.equal(tl.reduce((a, e) => a + e.len, 0), c.segs[nm].steps, `${nm}: はじめから おわりまで`);
  }
  assert.equal(c.parts[0].inst, 'brass', '気高い ふし');
  // ハ短調（ミb・ラb・シ）
  const pcs = lineNotes([...C11D_LINES.queenA, ...C11D_LINES.queenB]).map(pcOf);
  for (const p of [3, 8, 11]) assert.ok(pcs.includes(p), `音 ${p}`);
  assert.equal(pcOf(notesOf(c.segs.A.parts[1])[0]), 0, 'ハ短調');
  // はげしすぎない: 速すぎない・ふしの 16分なし
  assert.ok(tr.bpm <= 126);
  for (const nm of c.form) assert.ok(c.segs[nm].parts[0].every((e) => e.len >= 2), `${nm}: 16分なし`);
  // ボスの だん: テンポだけ（調は かえない ＝ ゆるがない）
  assert.deepEqual(QUEEN_TEMPOS, [1, 1.06, 1.12, 1.18]);
  for (let n = 0; n < 4; n++) {
    assert.equal(phaseOf(c, n).transpose, 0);
    assert.equal(phaseOf(c, n).tempo, QUEEN_TEMPOS[n]);
    assert.equal(formOfPhase(c, n), c);
  }
  const n0 = run('c11d_queen', { phase: 0 }, 20).log.length;
  const n3 = run('c11d_queen', { phase: 3 }, 20).log.length;
  assert.ok(n3 > n0, `速く なる ${n0}→${n3}`);
  assert.ok(tr.pinch && parseNotes(tr.pinch.n).every((e) => e.len === 1));
  assert.equal(battleBgm({ snapBgm: 'c11d_queen', mapId: 'c11d_throne', has: (x) => !!_TRACKS[x] }), 'c11d_queen');
});

test('第104回 F: 八つめの 音の 場面は 第1部の エンディングの ふしの 頭 → 高い レが ソの 和音の 中に おさまる → 後半の ドへ', () => {
  const tr = _TRACKS.c11d_eight;
  const c = compileTrack(tr);
  // 第1部の エンディング（ending5）の はじめの 4小節（音も 長さも 同じ。強い しるし なし ＝ やさしく）
  const e5 = compileTrack(_TRACKS.ending5);
  const e5Head = timeline(e5.segs[e5.form[0]].parts[0]).filter((e) => e.t < 64);
  assert.equal(ENDING5_HEAD.length, 4);
  const lead = timeline(c.segs.S.parts[0]).filter((e) => e.t >= 16 && e.t < 80);
  assert.deepEqual(lead.map((e) => [e.m, e.len, e.t - 16]), e5Head.map((e) => [e.m, e.len, e.t]), '第1部の エンディングの ふしの 頭');
  assert.deepEqual(lineNotes(ENDING5_HEAD), e5Head.filter((e) => e.m !== null).map((e) => e.m));
  assert.ok(lead.every((e) => e.acc === undefined || e.acc < 1), 'やさしく（強い しるし なし）');
  assert.deepEqual(C11D_CHORDS.eight.head, ['C', 'G', 'Am', 'F'], 'エンディングと 同じ 和音');
  // しずかに 始まる: 1小節めは ふしも たいこも ない。オルゴールが 下から のぼる
  assert.equal(lead.length && timeline(c.segs.S.parts[0]).filter((e) => e.m !== null && e.t < 16).length, 0);
  const mb = partOf(c, 'musicbox');
  const rise = timeline(c.segs.S.parts[mb]).filter((e) => e.m !== null && e.t < 16).map((e) => e.m);
  assert.ok(rise.length >= 6 && rise.every((m, i) => i === 0 || m > rise[i - 1]), `のぼる 光 ${rise}`);
  // さいごの 小節: ベルが レ・ミ・ファ・ソ・ラ・シ・ド と のぼって 高い レ（c10d_seven の 8つめ）
  const bell = partOf(c, 'bell');
  const bt = timeline(c.segs.S.parts[bell]).filter((e) => e.m !== null);
  assert.ok(bt.every((e) => e.t >= 80), 'ベルは さいごの 小節だけ');
  assert.deepEqual(bt.map((e) => pcOf(e.m)), [2, 4, 5, 7, 9, 11, 0, 2], '7つの 音 ＋ 8つめ');
  assert.equal(EIGHTH_NOTE, 'D7');
  assert.equal(bt.at(-1).m, lineNotes('D7:1')[0], '高い レ');
  assert.ok(EIGHT_RUN.endsWith(`${EIGHTH_NOTE}:6!`));
  // こんどは 和音の 中に おさまる: 高い レが 鳴る 時の のばしは ソの 和音（ソ・シ・レ）・ベースは ソ・ふしも レ
  const lastT = bt.at(-1).t;
  const padP = partOf(c, 'pad');
  const padAt = timeline(c.segs.S.parts[padP]).find((e) => lastT >= e.t && lastT < e.t + e.len && e.m !== null);
  assert.deepEqual(chordPcs(padAt), [2, 7, 11], 'ソの 和音');
  assert.ok(chordPcs(padAt).includes(pcOf(bt.at(-1).m)), '8つめの 音は 和音の 音');
  assert.equal(pcOf(notesOf(c.segs.S.parts[1]).at(-1)), 7, 'ベースは ソ');
  assert.equal(pcOf(notesOf(c.segs.S.parts[0]).at(-1)), 2, 'ふしも レ');
  assert.equal(EIGHT_LAST_CHORD, 'G');
  // 後半の はじめは ドの 和音（ソ → ド で つながる）
  assert.equal(C11D_CHORDS.queen2.intro[0], 'C');
  const q2 = compileTrack(_TRACKS.c11d_queen2);
  assert.equal(pcOf(notesOf(q2.segs[q2.form[0]].parts[1])[0]), 0, '後半の ベースは ドから');
});

test('第104回 F: 女王（後半）は スピカの歌 7ふし（c9d_song と 同じ）＋ 新しい 8ふしめ・高い ソは のこる・ブラスは いっしょに 鳴る', () => {
  const tr = _TRACKS.c11d_queen2;
  const c = compileTrack(tr);
  assert.equal(c.parts[0].inst, 'flute', 'スピカの 声');
  // 1〜7ふしめは C9D_SONG と 同じ（音も 長さも）・和音も 同じ
  const song = timeline([...c.segs.S.parts[0], ...c.segs.T.parts[0]]);
  for (let k = 0; k < 7; k++) {
    const mine = song.filter((e) => e.t >= k * 64 && e.t < (k + 1) * 64);
    assert.deepEqual(mine.map((e) => [e.m, e.len]), timeline(parseNotes(C9D_SONG.phrases[k].join(' '))).map((e) => [e.m, e.len]), `${k + 1}ふしめ`);
  }
  assert.deepEqual(SONG_ALL.slice(0, 7), C9D_SONG.phrases);
  assert.deepEqual([...C11D_CHORDS.queen2.S, ...C11D_CHORDS.queen2.T].slice(0, 28), C9D_SONG.chords.flat());
  // 8ふしめ: 新しい（どの ふしとも ちがう）・4小節・ドで おわる・8つめの 音（レ）を ソの 和音の 強拍で
  assert.equal(SONG8.length, 4);
  assert.deepEqual(song.filter((e) => e.t >= 7 * 64).map((e) => [e.m, e.len]), timeline(parseNotes(SONG8.join(' '))).map((e) => [e.m, e.len]));
  for (const ph of C9D_SONG.phrases) assert.notDeepEqual(lineNotes(SONG8), lineNotes(ph));
  assert.equal(pcOf(lineNotes(SONG8).at(-1)), 0, 'ドで おわる');
  const t8 = timeline(parseNotes(SONG8.join(' ')));
  const dOnG = t8.filter((e) => e.m !== null && pcOf(e.m) === 2 && e.t % 8 === 0).filter((e) => {
    const bar = SONG8_CHORDS[Math.floor(e.t / 16)].split(' ');
    return bar[Math.min(bar.length - 1, Math.floor(((e.t % 16) * bar.length) / 16))] === 'G';
  });
  assert.ok(dOnG.length >= 1, 'レを ソの 和音の 強拍で');
  // いちばん 高い 所は 8ふしめ（7ふしの こたえ ＝ 広がる）
  assert.ok(Math.max(...lineNotes(SONG8)) > Math.max(...C9D_SONG.phrases.flatMap((p) => lineNotes(p))));
  // 前半の 動かない 星（高い ソ）が のこる
  const q1 = compileTrack(_TRACKS.c11d_queen);
  const starQ1 = notesOf(q1.segs.A.parts[partOf(q1, 'organ')])[0];
  const st = partOf(c, 'organ');
  for (const nm of c.form) {
    const tl = timeline(c.segs[nm].parts[st]);
    assert.ok(tl.every((e) => e.m === starQ1), `${nm}: 同じ 星`);
    assert.equal(tl.reduce((a, e) => a + e.len, 0), c.segs[nm].steps);
  }
  // 前半の ふしの 楽器（ブラス）は 和音（いっしょに 鳴る。主役では ない）
  const br = partOf(c, 'brass');
  assert.equal(c.parts[br].role, 'harmony');
  assert.ok(c.segs.S.parts[br].some((e) => e.fs && e.fs.length >= 3));
  // 7・8ふしめは 弦が ふしを 1オクターブ 下で（みんなで）
  const str = partOf(c, 'strings');
  assert.deepEqual(notesOf(c.segs.T.parts[str]).slice(-lineNotes([...C9D_SONG.phrases[6], ...SONG8]).length), lineNotes([...C9D_SONG.phrases[6], ...SONG8]).map((m) => m - 12));
  // 明るく 力強い（ハ長調・前半より 速い）
  assert.ok(tr.bpm > _TRACKS.c11d_queen.bpm);
  assert.equal(battleBgm({ snapBgm: 'c11d_queen2', mapId: 'c11d_throne', has: (x) => !!_TRACKS[x] }), 'c11d_queen2');
});

test('第104回 F: お祭りは おもて通りの ふしと うら通りの ふしが いっしょに 鳴る（たがいの うら返し）・ランプが ぜんぶ ともる', () => {
  const c = compileTrack(_TRACKS.c11d_lamps);
  const fl = partOf(c, 'flute');
  assert.equal(c.parts[0].inst, 'pluck', 'おもての 楽器（琴）');
  assert.equal(compileTrack(_TRACKS.c11b_front).parts[0].inst, 'pluck');
  assert.equal(compileTrack(_TRACKS.c11b_back).parts[0].inst, 'flute', 'うらの 楽器（笛）');
  const pairs = { intro: ['frontIntro', 'backIntro'], A: ['frontA', 'backA'], B: ['frontB', 'backB'], A2: ['frontA2', 'backA2'] };
  for (const [nm, [fk, bk]] of Object.entries(pairs)) {
    const fT = timeline(c.segs[nm].parts[0]);
    const bT = timeline(c.segs[nm].parts[fl]);
    assert.deepEqual(fT.filter((e) => e.m !== null).map((e) => e.m), lineNotes(C11B_LINES[fk]), `${nm}: おもて`);
    assert.deepEqual(bT.filter((e) => e.m !== null).map((e) => e.m), lineNotes(C11B_LINES[bk]), `${nm}: うら`);
    // 同じ 時に 鳴り、どの 音も 2つ 足すと MIRROR_SUM（うら返し）
    assert.deepEqual(fT.map((e) => [e.t, e.len]), bT.map((e) => [e.t, e.len]), `${nm}: いっしょに`);
    fT.forEach((e, i) => { if (e.m !== null) assert.equal(e.m + bT[i].m, MIRROR_SUM, `${nm} ${e.t}: うら返し`); });
  }
  // ニ長調で おわる（ベースは レ・のばしは D6〈レ・ファ#・ラ と うらの シ〉）
  assert.equal(pcOf(notesOf(c.segs.A2.parts[1]).at(-1)), 2);
  assert.equal(C11D_CHORDS.lamps.A2.at(-1), 'D');
  // ランプ: イントロは 1小節に 6つ、2小節とも ぜんぶ（c11b_plaza の さいごの ように 1つ 足りない ことは ない）
  const mb = partOf(c, 'musicbox');
  const lamps = [0, 1].map((b) => barNotes(c, 'intro', mb, b, b + 1).map((e) => e.m));
  for (const l of lamps) assert.ok(l.length === 6 && l.every((m, i) => i === 0 || m > l[i - 1]), `ランプ ${l}`);
  // あたたかい お祭り: おもての リムと うらの シェイカーが いっしょ
  const dr = c.parts.findIndex((p) => p.drums);
  const ds = new Set(timeline(c.segs.A.parts[dr]).map((e) => e.drum).filter(Boolean));
  assert.ok(ds.has('R') && ds.has('sh') && ds.has('k'));
});

test('第104回 F: おわりの 曲は スピカの歌を 8ふし さいごまで（第2章の 橋で 止まった ドの つづき）・しずかに 始まり やさしく おわる', () => {
  const tr = _TRACKS.c11d_end;
  const c = compileTrack(tr);
  assert.deepEqual(c.form, ['intro', 's12', 's34', 's56', 's7', 's8', 'outro']);
  // 8ふし ぜんぶ じゅんに（音も 長さも）
  const songParts = ['s12', 's34', 's56', 's7', 's8'].flatMap((nm) => c.segs[nm].parts[0]);
  assert.deepEqual(lensOf(songParts), lineLens(SONG_ALL.flat()), '長さ');
  assert.deepEqual(notesOf(songParts), lineNotes(SONG_ALL.flat()), '8ふし');
  // 橋（c10d_bridge）は 7ふしめの さいごの ド の 手前で 止まった。こんどは ド まで 行く
  assert.deepEqual(BRIDGE_LAST, C9D_SONG.phrases[6].slice(0, 3));
  const bridge = compileTrack(_TRACKS.c10d_bridge);
  const bridgeEnd = notesOf(bridge.segs[bridge.form.at(-1)].parts[0]);
  assert.notEqual(pcOf(bridgeEnd.at(-1)), 0, '橋は ドで おわらなかった');
  const s7 = timeline(c.segs.s7.parts[0]).filter((e) => e.m !== null);
  assert.equal(pcOf(s7.at(-1).m), 0, 'こんどは さいごの ド');
  assert.equal(s7.at(-1).len, 16);
  assert.deepEqual(notesOf(c.segs.s7.parts[0]).slice(0, lineNotes(BRIDGE_LAST).length), lineNotes(BRIDGE_LAST), '橋の つづき');
  // しずかに 始まる（はじめの ふしまで たいこ・弦なし）→ 大きく（たいこ・シンバル）→ やさしく（ゆっくり・たいこは タムだけ）
  const dr = c.parts.findIndex((p) => p.drums);
  const str = partOf(c, 'strings');
  for (const nm of ['intro', 's12']) {
    assert.equal(c.segs[nm].parts[dr].filter((e) => e.drum).length, 0, `${nm}: たいこ なし`);
    assert.equal(notesOf(c.segs[nm].parts[str]).length, 0, `${nm}: 弦 なし`);
  }
  assert.ok(c.segs.s7.parts[dr].some((e) => e.drum === 'c') && c.segs.s56.parts[dr].some((e) => e.drum === 'k'), '大きく');
  assert.ok(END_BPM.s8 < END_BPM.s7 && END_BPM.outro < END_BPM.s8, 'さいごは ゆっくり');
  for (const nm of ['s8', 'outro']) assert.ok(c.segs[nm].parts[dr].every((e) => !e.drum || e.drum === 'tl'), `${nm}: やさしく`);
  // さいごは ドの 和音
  const padP = str;
  assert.deepEqual(chordPcs(c.segs.outro.parts[padP].filter((e) => e.f).at(-1)), [0, 4, 7]);
  assert.equal(pcOf(notesOf(c.segs.outro.parts[1]).at(-1)), 0);
  // イントロの ベルは 8つの 音（レ〜ド ＋ 高い レ）
  const bell = partOf(c, 'bell');
  assert.deepEqual(notesOf(c.segs.intro.parts[bell]).map(pcOf), [2, 4, 5, 7, 9, 11, 0, 2]);
  assert.equal(notesOf(c.segs.intro.parts[bell]).at(-1), lineNotes(`${EIGHTH_NOTE}:1`)[0]);
  // 同じ なかまの 楽器（第2章の 橋と 同じ）
  assert.deepEqual(c.parts.map((p) => p.inst), bridge.parts.map((p) => p.inst));
});

test('第104回 F: 前の音 用の ch・今まで の 曲は かわって いない', () => {
  for (const id of IDS) {
    const tr = _TRACKS[id];
    assert.equal(tr.ch.length, tr.parts.length, id);
    for (const ch of tr.ch) for (const t of ch.n.split(/\s+/)) assert.match(t, ch.drums ? /^[kshr]:\d+$/ : /^(r|[A-G][#b]?\d):\d+$/, `${id}: ${t}`);
    const total = (ch) => ch.n.split(/\s+/).reduce((a, t) => a + Number(t.split(':')[1]), 0);
    assert.equal(new Set(tr.ch.map(total)).size, 1, `${id}: 前の音の チャンネルの 長さ`);
    assert.equal(legacyChannels(tr).ch, tr.ch, id);
  }
  for (const id of [...Object.keys(C11C_TRACKS), 'c10d_mirror', 'c11b_oboro', 'c11b_front', 'c11b_back', 'c9d_song', 'ending5', 'battle3', 'field']) {
    assert.ok(!(id in C11D_TRACKS), id);
    if (C11C_TRACKS[id]) assert.equal(_TRACKS[id].parts, C11C_TRACKS[id].parts, id);
  }
  // splitBars は 小節を またぐ 音を ゆるさない
  assert.throws(() => splitBars('C5:12 D5:8'));
  assert.deepEqual(splitBars('C5:8 D5:8 E5:16'), ['C5:8 D5:8', 'E5:16']);
});
