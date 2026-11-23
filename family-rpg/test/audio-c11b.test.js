// 第102回 F: 第3部 第3章 第2幕「月の都と、名前のランプ」の 曲（audio-c11b.js）
//   7曲が ある・id が 約束どおり・区切りの 長さ・ひとまわりの 秒・音の 高さ・強拍の ぶつかり・大きさの そろえ・名前・
//   うらの 町が おもての ふしを 鏡で うら返した 形・塔が sideStage で 楽器が かわる（ふし・形・調は 同じ）・
//   広場の ランプが さいごに 1つ 足りない・よびかけが スピカの歌の はじめの 音・番人の 明るい／暗いが 4小節ごと・
//   月の 使いが しずかで だんで 速く なる・今の 曲が かわって いない
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { _TRACKS, TRACK_IDS } from '../public/js/client/audio.js';
import {
  C11B_TRACKS, C11B_IDS, C11B_LINES, C11B_CHORDS, MIRROR_SUM, invChord, TOWER_SIDE_FORM, PLAZA_LAMPS, PLAZA_LAST, CALL_NOTES,
  KEEPER_BLOCK, OBORO_TEMPOS,
} from '../public/js/client/audio-c11b.js';
import { C11A_TRACKS } from '../public/js/client/audio-c11a.js';
import { C9D_SONG } from '../public/js/client/audio-c9d.js';
import { compileTrack, legacyChannels, midiOf, MusicEngine, parseNotes, formOfPhase, phaseOf } from '../public/js/client/music-engine.js';
import { INSTRUMENTS } from '../public/js/client/music-inst.js';
import { TRACK_NAMES } from '../public/js/client/audio-names.js';
import { TRACK_TRIM } from '../public/js/client/audio-trim.js';
import { checkText, gameFiles } from '../tools/kanji-check.mjs';
import {
  SceneAudio, battleBgm, battlePhase, FORM_KEYS, FORM_KEYS0, isPart3Track,
  C11B_TOWER_TRACK, SIDE_STAGES, sideStageOf, conStageOf, gateStageOf, flipStageOf,
} from '../public/js/client/audio-scene.js';

const IDS = ['c11b_front', 'c11b_back', 'c11b_tower', 'c11b_plaza', 'c11b_call', 'c11b_keeper', 'c11b_oboro'];
const ONCE = ['c11b_plaza', 'c11b_call'];
const LOOPED = IDS.filter((id) => !ONCE.includes(id));
const secOf = (c, nm) => (c.segs[nm].steps * 60) / (c.segs[nm].bpm || c.bpm) / 4;
const formSec = (c, form, from = 0) => form.slice(from).reduce((a, n) => a + secOf(c, n), 0);
const notesOf = (evs) => evs.filter((e) => e.f).map((e) => Math.round(midiOf(e.f)));
const lensOf = (evs) => evs.map((e) => [e.f ? 'n' : 'r', e.len]);
const lineNotes = (list) => notesOf(parseNotes(list.join(' ')));
const pcOf = (m) => ((m % 12) + 12) % 12;
const timeline = (p) => {
  let t = 0;
  return p.map((e) => { const o = { t, len: e.len, m: e.f ? Math.round(midiOf(e.f)) : null, acc: e.acc, drum: e.drum }; t += e.len; return o; });
};

// ───── 小さな にせの AudioContext（audio-c11a.test.js と 同じ）─────
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
// その 曲の 区切りの ぜんぶ（だんの 形の 区切りも）
const allSegNames = (c) => Object.keys(c.segs);

test('第102回 F: 7曲（約束の id）が 区切りで 書いて あり、ゲームの 曲に 入って いる・名前・大きさの そろえ・漢字の しらべ', () => {
  assert.deepEqual(C11B_IDS, IDS);
  for (const id of IDS) {
    const tr = _TRACKS[id];
    assert.equal(tr.parts, C11B_TRACKS[id].parts, `${id}: 入って いる`);
    assert.ok(tr.sections && tr.form, id);
    assert.ok(TRACK_IDS.includes(id), id);
    assert.ok(isPart3Track(id), `${id}: 第3部の 曲`);
    assert.ok(TRACK_NAMES[id], `${id}: 名前`);
    assert.deepEqual(checkText(TRACK_NAMES[id]).filter((p) => p.kind !== 'kana'), [], id);
    assert.ok(!/\s/.test(TRACK_NAMES[id]), `${id}: スペース なし`);
    assert.ok(Number.isFinite(TRACK_TRIM[id]) && Math.abs(TRACK_TRIM[id]) <= 3, `${id}: 大きさの そろえ ${TRACK_TRIM[id]}`);
    // ボスの 名前・もとの 昔話・物語の ひみつ・この 幕で 言わない ことは 出さない
    assert.ok(!/オボロ|おぼろ|朧|かぐや|竹|たけ|姫|ひめ|女王|じょおう|王女|むすめ|娘|わすれ|忘|むかえ|迎|天人|てんにん|衣|ころも|はかり|ながされ|流され|使い|番人|ばんにん|アルゴル|少年|ソリトゥス|カイ|ミラーレ|鏡|8つ|八つ|やっつ|足りない|たりない|ない$/.test(TRACK_NAMES[id]), `${id}: ネタバレ ${TRACK_NAMES[id]}`);
    assert.ok(tr.night && !Object.keys(tr.night).length, `${id}: 夜の 楽器の かえは しない`);
  }
  for (const id of LOOPED) assert.ok(!_TRACKS[id].once && _TRACKS[id].loopFrom >= 1, `${id}: くり返す`);
  for (const id of ONCE) assert.equal(_TRACKS[id].once, true, `${id}: くり返さない`);
  assert.equal(new Set(Object.values(TRACK_NAMES)).size, Object.keys(TRACK_NAMES).length, '名前が かさならない');
  assert.ok(gameFiles().some((f) => f.endsWith('public/js/client/audio-c11b.js')), '漢字の しらべに 入って いる');
});

test('第102回 F: 区切りの 長さ・ひとまわりの 秒・区切りごとに ちがう・短い 2曲の 長さ', () => {
  const range = { c11b_front: [40, 75], c11b_back: [45, 80], c11b_tower: [50, 80], c11b_keeper: [40, 70], c11b_oboro: [55, 80] };
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
  // 広場 10〜16 秒・よびかけ 1〜2 秒
  const pl = compileTrack(_TRACKS.c11b_plaza);
  const pls = formSec(pl, pl.form);
  assert.ok(pls >= 10 && pls <= 16, `広場 ${pls.toFixed(2)} 秒`);
  const ca = compileTrack(_TRACKS.c11b_call);
  const cas = formSec(ca, ca.form);
  assert.ok(cas >= 1 && cas <= 2, `よびかけ ${cas.toFixed(2)} 秒`);
  for (const id of ONCE) {
    const { eng, log } = spyEngine();
    eng.start(id, _TRACKS[id], 0);
    eng.pump(60);
    const c = compileTrack(_TRACKS[id]);
    const sec = formSec(c, c.form);
    assert.ok(eng.player.done(60), `${id}: おわる`);
    assert.ok(Math.abs(eng.player.endT - sec) < 1e-6, `${id}: ${sec.toFixed(1)} 秒`);
    assert.ok(Math.max(...log.map((x) => x.t)) < sec, `${id}: さいごの 音は おわりより 前`);
  }
});

test('第102回 F: テンポ・パートは 5つまで・楽器・音の 高さの はんい・とびすぎない', () => {
  const range = {
    c11b_front: [104, 120], c11b_back: [84, 100], c11b_tower: [80, 96], c11b_plaza: [76, 100], c11b_call: [120, 144], c11b_keeper: [144, 168], c11b_oboro: [72, 88],
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
    const mel = all.flatMap((s) => notesOf(s.parts[lead]));
    const bs = all.flatMap((s) => notesOf(s.parts[bass]));
    assert.ok(Math.min(...mel) >= 67 && Math.max(...mel) <= 93, `${id}: メロディ ${Math.min(...mel)}〜${Math.max(...mel)}`);
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

// 強拍（小節の 頭と まん中）: メロディと ベースが 短2度・増4度・長7度で ぶつからない。
//   強拍で 鳴る パートどうしが 短2度（と 1オクターブ上）で にごらない。だんの 形の 区切り（塔の うら）も 見る
test('第102回 F: 強拍で ぶつからない・にごらない（0こ）', () => {
  const minN = { c11b_call: 2, c11b_plaza: 8 };
  for (const id of IDS) {
    const c = compileTrack(_TRACKS[id]);
    const lead = c.parts.findIndex((p) => p.role === 'lead');
    const bass = c.parts.findIndex((p) => p.role === 'bass');
    // 塔の うらは 笛が ふし
    const mels = [lead, ...c.parts.map((p, i) => (p.inst === 'flute' && i !== lead && id === 'c11b_tower' ? i : -1)).filter((i) => i >= 0)];
    const beats = [0, c.bar / 2];
    let n = 0;
    const bad = [];
    for (const nm of allSegNames(c)) {
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

test('第102回 F: おもて通りは 上品で きっちり（琴の ような はじく 音・笙の ような のばし・リムは 2拍めと 4拍め・長調）', () => {
  const tr = _TRACKS.c11b_front;
  const c = compileTrack(tr);
  assert.equal(c.parts[0].inst, 'pluck', '琴の ような ふし');
  assert.ok(c.parts.some((p) => p.inst === 'organ'), '笙の ような のばし');
  const dr = c.parts.findIndex((p) => p.drums);
  for (const nm of ['A', 'B', 'A2']) {
    const tl = timeline(c.segs[nm].parts[dr]);
    // どの 小節も（フィルの さいごの 小節 いがい）リムは 2拍めと 4拍め
    for (let b0 = 0; b0 < c.segs[nm].steps - 16; b0 += 16) {
      const rims = tl.filter((e) => e.drum === 'R' && e.t >= b0 && e.t < b0 + 16).map((e) => e.t - b0);
      assert.deepEqual(rims, [4, 12], `${nm} ${b0}: リム`);
    }
  }
  // ベースは 8分の スタッカート（拍の 頭だけ。うらは 休み）
  for (const e of timeline(c.segs.A.parts[1])) if (e.m !== null) assert.equal(e.t % 4, 0, `ベース ${e.t}`);
  // ニ長調（ド# が ある・ドの ナチュラルが ない）
  const pcs = lineNotes([...C11B_LINES.frontA, ...C11B_LINES.frontB]).map(pcOf);
  assert.ok(pcs.includes(1) && !pcs.includes(0), 'ニ長調の 音だけ');
  assert.equal(pcOf(notesOf(c.segs.A.parts[0])[0]), 2, 'レから');
});

test('第102回 F: うら通りは おもての ふしを 鏡で うら返した 形（上がり下がりが 逆・長さは 同じ・ニ長調 → ロ短調・和音も 鏡）', () => {
  const front = compileTrack(_TRACKS.c11b_front);
  const back = compileTrack(_TRACKS.c11b_back);
  assert.equal(MIRROR_SUM % 12, 8, '鏡の 中心は ミ（と シb）');
  // ニ長調の 音の ならびは 鏡で そのまま
  const D_MAJ = [2, 4, 6, 7, 9, 11, 1];
  assert.deepEqual(D_MAJ.map((p) => pcOf(MIRROR_SUM - p)).sort((a, b) => a - b), [...D_MAJ].sort((a, b) => a - b));
  // 和音の 鏡: 長調 ↔ 短調
  assert.deepEqual(['D', 'G', 'A', 'Bm', 'Em', 'F#m'].map(invChord), ['Bm', 'F#m', 'Em', 'D', 'A', 'G']);
  for (const [f, b] of [['frontIntro', 'backIntro'], ['frontA', 'backA'], ['frontB', 'backB'], ['frontA2', 'backA2']]) {
    const fl = [C11B_LINES[f]].flat();
    const bl = [C11B_LINES[b]].flat();
    assert.deepEqual(lineNotes(bl), lineNotes(fl).map((m) => MIRROR_SUM - m), `${b}: 鏡`);
    assert.deepEqual(lensOf(parseNotes(bl.join(' '))), lensOf(parseNotes(fl.join(' '))), `${b}: 長さも 同じ`);
  }
  // 曲の 中の ふしも その まま（形も 同じ）
  assert.deepEqual(back.form, front.form);
  for (const nm of front.form) {
    assert.deepEqual(notesOf(back.segs[nm].parts[0]), notesOf(front.segs[nm].parts[0]).map((m) => MIRROR_SUM - m), `${nm}: ふし`);
    assert.equal(back.segs[nm].steps, front.segs[nm].steps);
    // 上がり下がりが 逆
    const df = notesOf(front.segs[nm].parts[0]).slice(1).map((m, i, a) => m - (i ? a[i - 1] : notesOf(front.segs[nm].parts[0])[0]));
    const db = notesOf(back.segs[nm].parts[0]).slice(1).map((m, i, a) => m - (i ? a[i - 1] : notesOf(back.segs[nm].parts[0])[0]));
    assert.deepEqual(db, df.map((x) => -x || 0), `${nm}: 逆`);
    // 和音も 鏡
    assert.deepEqual(C11B_CHORDS.back[nm], C11B_CHORDS.front[nm].map((b) => b.split(' ').map(invChord).join(' ')));
  }
  // ロ短調: ベースは シで 始まり シで おわる・ふしの さいごは シ
  assert.equal(pcOf(notesOf(back.segs.A.parts[1])[0]), 11);
  assert.equal(pcOf(notesOf(back.segs.A2.parts[1]).at(-1)), 11);
  assert.equal(pcOf(notesOf(back.segs.A2.parts[0]).at(-1)), 11, 'シで おわる');
  assert.equal(pcOf(notesOf(front.segs.A2.parts[1]).at(-1)), 2, 'おもては レ');
  // 小さく あたたかい: おもてより ゆっくり・笛・キックと スネアは 使わない・ランプは ときどき
  assert.ok(_TRACKS.c11b_back.bpm < _TRACKS.c11b_front.bpm);
  assert.equal(back.parts[0].inst, 'flute');
  const dr = back.parts.findIndex((p) => p.drums);
  for (const s of Object.values(back.segs)) assert.ok(s.parts[dr].every((e) => !e.drum || ['sh', 'tl'].includes(e.drum)), 'かるい たいこ');
  const mb = back.parts.findIndex((p) => p.inst === 'musicbox');
  const nb = notesOf(back.segs.A.parts[mb]).length;
  assert.ok(nb >= 3 && nb <= 6, `ランプ ${nb}`);
});

test('第102回 F: 塔は sideStage（0 おもて・1 うら）で 楽器が かわる（ふし・ベース・形・調・テンポは 同じ）', () => {
  const tr = _TRACKS.c11b_tower;
  const c = compileTrack(tr);
  assert.equal(formOfPhase(c, 0), c, 'だん 0 は おもての 形');
  assert.deepEqual(formOfPhase(c, 1).form, TOWER_SIDE_FORM);
  assert.deepEqual(TOWER_SIDE_FORM, c.form.map((n) => `u${n}`), '同じ 形');
  assert.equal(formOfPhase(c, 1).loopFrom, c.loopFrom);
  assert.equal(formOfPhase(c, 3).form[1], 'uA', 'だんが 大きくても うら');
  for (const ph of tr.phases) assert.deepEqual([ph.transpose, ph.tempo], [0, 1], 'テンポと 調は かえない');
  const lead = c.parts.findIndex((p) => p.role === 'lead');
  const flute = c.parts.findIndex((p) => p.inst === 'flute');
  const bass = c.parts.findIndex((p) => p.role === 'bass');
  assert.equal(c.parts[lead].inst, 'marimba');
  for (const nm of c.form) {
    const u = `u${nm}`;
    assert.equal(c.segs[u].steps, c.segs[nm].steps, `${u}: 長さ`);
    // おもての マリンバの ふし ＝ うらの 笛の ふし（音も 長さも）
    assert.deepEqual(c.segs[u].parts[flute], c.segs[nm].parts[lead], `${u}: ふし`);
    assert.deepEqual(c.segs[u].parts[bass], c.segs[nm].parts[bass], `${u}: ベース`);
    assert.ok(notesOf(c.segs[nm].parts[flute]).length === 0 && notesOf(c.segs[u].parts[lead]).length === 0, `${nm}: どちらか 1つ`);
  }
  // にせの エンジンで 鳴らす
  const sec = secOf(c, 'intro') + secOf(c, 'A');
  const a = run('c11b_tower', { phase: 0 }, sec).log;
  const b = run('c11b_tower', { phase: 1 }, sec).log;
  const insts = (log) => [...new Set(log.filter((e) => e.kind === 'v').map((e) => e.inst))].sort();
  assert.deepEqual(insts(a), ['bass', 'bell', 'marimba'], 'おもては かたい 音');
  assert.deepEqual(insts(b), ['bass', 'flute', 'strings'], 'うらは やわらかい 音');
  assert.ok(a.some((x) => x.d === 'R') && a.some((x) => x.d === 'k') && !a.some((x) => x.d === 'sh'), 'おもては リムと キック');
  assert.ok(b.some((x) => x.d === 'sh') && !b.some((x) => x.d === 'k' || x.d === 'R'), 'うらは シェイカーと タム');
  // ふしの 高さは 同じ（調を かえない）
  const firstOf = (log, inst) => log.filter((e) => e.inst === inst).map((e) => e.f);
  assert.deepEqual(firstOf(b, 'flute').slice(0, 10), firstOf(a, 'marimba').slice(0, 10));
  assert.equal(phaseOf(c, 1).transpose, 0);
});

test('第102回 F: 画面の sideStage を 読む・塔の 曲の 時だけ だんを 送る（ダンジョンでも 強さは 1）', () => {
  assert.ok(FORM_KEYS0.includes('sideStage') && !FORM_KEYS.includes('sideStage'), 'addFormKey0');
  assert.equal(C11B_TOWER_TRACK, 'c11b_tower');
  assert.equal(SIDE_STAGES, 2);
  assert.equal(sideStageOf({ field: {} }), 0, '出て いない 間は 0');
  assert.equal(sideStageOf(null), 0);
  assert.equal(sideStageOf({ field: { sideStage: 1 } }), 1);
  assert.equal(sideStageOf({ field: { sideStage: () => 1 } }), 1, '関数でも よい');
  assert.equal(sideStageOf({ field: { sideStage: true } }), 1);
  assert.equal(sideStageOf({ field: { sideStage: false } }), 0);
  assert.equal(sideStageOf({ field: { sideStage: 5 } }), 1);
  assert.equal(sideStageOf({ field: { sideStage: -1 } }), 0);
  assert.equal(sideStageOf({ field: {}, sideStage: 1 }), 1);
  assert.equal(sideStageOf({ field: { sideStage: 0 }, sideStage: 1 }), 0, '画面の field が 先');
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
    for (const id of ['c11b_tower1', 'c11b_tower2', 'c11b_tower3', 'c11b_towerb1', 'c11b_towerb2', 'c11b_towerb3']) maps[id] = { id, kind, bgm };
    maps[mapId] = map;
    const g = { sky: { isNight: () => false, flying: false }, field: { mapId, map, me: { x: 1, y: 1 }, nightOverride: null, hasFlag: () => false, areaName: () => '', weatherKind: () => null, areaBgm: () => bgm, ...extra } };
    const sa = new SceneAudio(au, { tracks: _TRACKS, maps });
    au.play(playing);
    sa.syncField(g, 0, true);
    return { log, sa, g, au };
  };
  // 塔の 1階（ダンジョン）でも 強さは 1・だんは おもて
  assert.deepEqual(mk('c11b_tower1', 'c11b_tower').log, [['i', 1], ['p', 0]]);
  const r = mk('c11b_towerb1', 'c11b_tower', { sideStage: 1 });
  assert.deepEqual(r.log, [['i', 1], ['p', 1]]);
  r.g.field.sideStage = 0;
  r.sa.syncField(r.g, 1000);
  assert.deepEqual(r.log.slice(2), [['p', 0]], '戸を くぐると 次の 小節から');
  // 戦いの あとに もどったら（曲が 新しく なったら）送りなおす
  r.g.field.sideStage = 1;
  r.au.play('c11b_tower');
  r.sa.syncField(r.g, 2000, true);
  assert.deepEqual(r.log.slice(3), [['i', 1], ['p', 1]]);
  // イベントの 曲でも 送る（場所の 曲が ちがっても 鳴って いる 曲が 塔なら）・ほかの 曲・ジングルの 間は 送らない
  assert.deepEqual(mk('c11b_front', 'c11b_front', { sideStage: 1 }, 'c11b_tower', 'field').log, [['p', 1]]);
  assert.deepEqual(mk('c11b_front', 'c11b_front', { sideStage: 1 }, 'c11b_front', 'field').log, [['i', 1]]);
  assert.deepEqual(mk('c11b_tower2', 'c11b_tower', { sideStage: 1 }, 'c11b_plaza').log, [], 'ジングルの 間は さわらない');
  // ほかの しるしとは まざらない
  assert.equal(conStageOf({ field: { sideStage: 1 } }), 0);
  assert.equal(gateStageOf({ field: { sideStage: 1 } }), 0);
  assert.equal(flipStageOf({ field: { sideStage: 1 } }), 0);
  assert.equal(sideStageOf({ field: { flipStage: 1, conStage: 2 } }), 0);
  // 戦いの pub に 出ても こまらない（0 から 数える しるし）
  const boss = (o) => battlePhase({ boss: true, enemies: [{ side: 'enemy', boss: true, hp: 90, maxHp: 100, ...o }] });
  assert.equal(boss({ sideStage: 0 }), 0);
});

test('第102回 F: 名前のランプの広場は ランプが 1小節に 6つ ずつ ともり、さいごの 小節だけ いちばん 上の 1つが ない', () => {
  const tr = _TRACKS.c11b_plaza;
  const c = compileTrack(tr);
  assert.equal(c.segs.S.steps / c.bar, 5, '5小節');
  const bell = c.parts.findIndex((p) => p.inst === 'bell');
  const tl = timeline(c.segs.S.parts[bell]).filter((e) => e.m !== null);
  const per = [0, 1, 2, 3, 4].map((b) => tl.filter((e) => e.t >= b * 16 && e.t < b * 16 + 16));
  assert.deepEqual(per.map((x) => x.length), [6, 6, 6, 6, 5]);
  for (const x of per) {
    // 下から 1つずつ ともる（同じ 場所）
    assert.ok(x.every((e, i) => i === 0 || e.m > x[i - 1].m), '下から');
    assert.deepEqual(x.map((e) => e.t % 16), [0, 2, 4, 6, 8, 10].slice(0, x.length));
  }
  // さいごの 小節は 6つめの 所が 休み
  assert.ok(!tl.some((e) => e.t === 64 + 10), '6つめが ない');
  assert.equal(PLAZA_LAMPS.split(' ').filter((t) => !t.startsWith('r')).length, 6);
  assert.equal(PLAZA_LAST.split(' ').filter((t) => !t.startsWith('r')).length, 5);
  // かなしく しすぎない: ト長調の 和音で おわる（ベースは ソ・ふしは シ）
  assert.equal(pcOf(notesOf(c.segs.S.parts[1]).at(-1)), 7);
  assert.equal(pcOf(notesOf(c.segs.S.parts[0]).at(-1)), 11);
  const str = c.parts.findIndex((p) => p.inst === 'strings');
  const lastPad = c.segs.S.parts[str].filter((e) => e.f).at(-1);
  assert.deepEqual((lastPad.fs || [lastPad.f]).map((f) => pcOf(Math.round(midiOf(f)))).sort((a, b) => a - b), [2, 7, 11], 'ト長調の 和音');
});

test('第102回 F: 名前をよぶ声は スピカの歌の はじめの 3つの 音（ミ・ソ・ラ）', () => {
  const tr = _TRACKS.c11b_call;
  const c = compileTrack(tr);
  assert.equal(c.segs.S.steps, 16, '1小節');
  const song = notesOf(parseNotes(C9D_SONG.phrases[0][0])).slice(0, 3);
  assert.deepEqual(CALL_NOTES.length, 3);
  assert.deepEqual(notesOf(c.segs.S.parts[0]), song, 'スピカの歌の はじめの 音');
  assert.deepEqual(song.map(pcOf), [4, 7, 9]);
  // 長さも 頭の 2つは 同じ（6・2）
  assert.deepEqual(c.segs.S.parts[0].slice(0, 2).map((e) => e.len), parseNotes(C9D_SONG.phrases[0][0]).slice(0, 2).map((e) => e.len));
  assert.equal(C11B_LINES.call.split(' ').length, 3, '3つの 音');
});

test('第102回 F: ひかってかげっては 4小節ごとに 明るい（イ長調・高い・ベル）と 暗い（イ短調・低い・弦）が かわる', () => {
  const tr = _TRACKS.c11b_keeper;
  const c = compileTrack(tr);
  assert.equal(KEEPER_BLOCK, 4);
  const bell = c.parts.findIndex((p) => p.inst === 'bell');
  const str = c.parts.findIndex((p) => p.inst === 'strings');
  const lead = c.parts.findIndex((p) => p.role === 'lead');
  let blocks = 0;
  for (const nm of c.form.slice(c.loopFrom)) {
    const s = c.segs[nm];
    assert.equal(s.steps, 8 * 16, nm);
    for (let k = 0; k < 2; k++) {
      const lo = k * 64, hi = lo + 64;
      const inB = (p) => timeline(s.parts[p]).filter((e) => e.m !== null && e.t >= lo && e.t < hi);
      const bright = k === 0;
      blocks++;
      assert.equal(inB(bell).length > 0, bright, `${nm} ${k}: ベル`);
      assert.equal(inB(str).length > 0, !bright, `${nm} ${k}: 弦`);
      const pcs = new Set(c.parts.flatMap((p, i) => (p.drums ? [] : inB(i).map((e) => pcOf(e.m)))));
      assert.equal(pcs.has(1), bright, `${nm} ${k}: ド#`);
      assert.equal(pcs.has(0), !bright, `${nm} ${k}: ドの ナチュラル`);
    }
    // 明るい 方が ふしが 高い
    const mel = timeline(s.parts[lead]).filter((e) => e.m !== null);
    const avg = (xs) => xs.reduce((a, e) => a + e.m, 0) / xs.length;
    assert.ok(avg(mel.filter((e) => e.t < 64)) > avg(mel.filter((e) => e.t >= 64)) + 2, `${nm}: 明るい 方が 高い`);
    // かわる 前の 小節は フィル（前ぶれ。16分か タム）
    const dr = timeline(s.parts[c.parts.findIndex((p) => p.drums)]);
    for (const b0 of [48, 112]) assert.ok(dr.some((e) => e.t >= b0 && e.t < b0 + 16 && ['t', 'th', 'tl'].includes(e.drum)), `${nm} ${b0}: 前ぶれ`);
  }
  assert.equal(blocks, 8);
  // きびきび: 速い・ピンチは 16分
  assert.ok(tr.bpm >= 144);
  assert.ok(parseNotes(tr.pinch.n).every((e) => e.len === 1));
  assert.equal(battleBgm({ snapBgm: 'c11b_keeper', mapId: 'c11b_tower3', has: (x) => !!_TRACKS[x] }), 'c11b_keeper');
});

test('第102回 F: しずかな月の雲は しずかに せまり、ボスの だんで テンポだけ 上がる（調は かえない）', () => {
  const tr = _TRACKS.c11b_oboro;
  const c = compileTrack(tr);
  // しずか: ゆっくり・はげしく たたかない（キック・スネア・シンバルを 使わない）
  assert.ok(tr.bpm <= 84);
  const dr = c.parts.findIndex((p) => p.drums);
  for (const [nm, s] of Object.entries(c.segs)) assert.ok(s.parts[dr].every((e) => !e.drum || ['tl', 't', 'th', 'R'].includes(e.drum)), `${nm}: しずかな たいこ`);
  // 雅な ひびき: 笛・琴（はじく 音）・笙（オルガンの のばし）。ニ短調に ミb（ナポリの 和音）
  assert.deepEqual(c.parts.filter((p) => !p.drums).map((p) => p.inst), ['flute', 'bass', 'organ', 'pluck', 'bell']);
  const pcs = lineNotes(C11B_LINES.oboroA).map(pcOf);
  assert.ok(pcs.includes(3), 'ミb');
  // ゆっくり せまる: B は ベースが 4分（A より 多い）
  const nBass = (nm) => notesOf(c.segs[nm].parts[1]).length;
  assert.ok(nBass('B') >= nBass('A') * 2, `せまる ${nBass('A')}→${nBass('B')}`);
  // だん: テンポだけ 上がる（1.15 いじょう）。調は かえない
  assert.deepEqual(OBORO_TEMPOS, [1, 1.15, 1.25, 1.3]);
  for (let n = 0; n < 4; n++) {
    assert.equal(phaseOf(c, n).transpose, 0);
    assert.equal(phaseOf(c, n).tempo, OBORO_TEMPOS[n]);
    assert.equal(formOfPhase(c, n), c, '形は かわらない');
  }
  // にせの エンジンで: だん 1 は 同じ 秒で 音が ふえる（速い）
  const sec = 20;
  const n0 = run('c11b_oboro', { phase: 0 }, sec).log.length;
  const n1 = run('c11b_oboro', { phase: 1 }, sec).log.length;
  assert.ok(n1 > n0, `速く なる ${n0}→${n1}`);
  // ピンチは 琴の 16分
  assert.equal(tr.pinch.i, 'pluck');
  assert.ok(parseNotes(tr.pinch.n).every((e) => e.len === 1));
  assert.equal(battleBgm({ snapBgm: 'c11b_oboro', mapId: 'c11b_tower3', has: (x) => !!_TRACKS[x] }), 'c11b_oboro');
});

test('第102回 F: 前の音 用の ch・今まで の 曲は かわって いない', () => {
  for (const id of IDS) {
    const tr = _TRACKS[id];
    assert.equal(tr.ch.length, tr.parts.length, id);
    for (const ch of tr.ch) for (const t of ch.n.split(/\s+/)) assert.match(t, ch.drums ? /^[kshr]:\d+$/ : /^(r|[A-G][#b]?\d):\d+$/, `${id}: ${t}`);
    const total = (ch) => ch.n.split(/\s+/).reduce((a, t) => a + Number(t.split(':')[1]), 0);
    assert.equal(new Set(tr.ch.map(total)).size, 1, `${id}: 前の音の チャンネルの 長さ`);
    assert.equal(legacyChannels(tr).ch, tr.ch, id);
  }
  for (const id of [...Object.keys(C11A_TRACKS), 'c9d_song', 'battle3', 'field']) {
    assert.ok(!(id in C11B_TRACKS), id);
    if (C11A_TRACKS[id]) assert.equal(_TRACKS[id].parts, C11A_TRACKS[id].parts, id);
  }
  for (const id of ['c11b_front', 'c11b_back', 'c11b_plaza', 'c11b_call', 'c11b_keeper']) {
    assert.equal(formOfPhase(compileTrack(_TRACKS[id]), 2), compileTrack(_TRACKS[id]), id);
  }
});
