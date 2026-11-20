// 第93回 F: 第3部 第1章 第4幕「星のはかば」の 曲（audio-c9d.js）
//   5曲が ある・id が 約束どおり・区切りの 長さ・ひとまわりの 秒・音の 高さ・強拍の ぶつかり・大きさの そろえ・名前・
//   ふたごの道の よび合いと apartStage・魔人の あそび歌と muStage の おいかけっこ・スピカの歌の 7ふしと songStage・
//   第1章の おわりの 長さと 止まり方・今の 曲が かわって いない
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { _TRACKS, TRACK_IDS } from '../public/js/client/audio.js';
import { C9D_TRACKS, C9D_IDS, C9D_SONG, C9D_MU_SONGS, songForm } from '../public/js/client/audio-c9d.js';
import { C9C_TRACKS } from '../public/js/client/audio-c9c.js';
import { C9B_TRACKS } from '../public/js/client/audio-c9b.js';
import { C9A_TRACKS, C9A_SEVEN } from '../public/js/client/audio-c9a.js';
import { compileTrack, legacyChannels, midiOf, MusicEngine, parseNotes, formOfPhase, AdaptiveState, MAX_PHASE } from '../public/js/client/music-engine.js';
import { INSTRUMENTS } from '../public/js/client/music-inst.js';
import { TRACK_NAMES } from '../public/js/client/audio-names.js';
import { TRACK_TRIM } from '../public/js/client/audio-trim.js';
import { checkText } from '../tools/kanji-check.mjs';
import {
  SceneAudio, battleBgm, battlePhase, FORM_KEYS, FORM_KEYS0, isPart3Track,
  C9D_LANE_TRACK, C9D_SONG_TRACK, apartStageOf, songStageOf,
} from '../public/js/client/audio-scene.js';

const IDS = ['c9d_lane', 'c9d_grave', 'c9d_mu', 'c9d_song', 'c9d_end'];
const LOOPED = IDS.filter((id) => id !== 'c9d_end');
const secOf = (c, nm) => (c.segs[nm].steps * 60) / (c.segs[nm].bpm || c.bpm) / 4;
const loopSec = (c, f = c) => f.form.slice(f.loopFrom).reduce((a, n) => a + secOf(c, n), 0);
const notesOf = (evs) => evs.filter((e) => e.f).map((e) => Math.round(midiOf(e.f)));
const mOf = (n) => ({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 })[n[0]] + (n.includes('#') ? 1 : 0) + 12 * (Number(n.slice(-1)) + 1);
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

// ───── 小さな にせの AudioContext（audio-c9c.test.js と 同じ）─────
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
const run = (id, phase, sec) => {
  const { eng, log } = spyEngine();
  eng.start(id, _TRACKS[id], 0);
  eng.adaptive.setPhase(phase);
  eng.pump(sec);
  return log;
};

test('第93回 F: 5曲（約束の id）が 区切りで 書いて あり、ゲームの 曲に 入って いる・名前・大きさの そろえ', () => {
  assert.deepEqual(C9D_IDS, IDS);
  for (const id of IDS) {
    const tr = _TRACKS[id];
    assert.equal(tr.parts, C9D_TRACKS[id].parts, `${id}: 入って いる`);
    assert.ok(tr.sections && tr.form, id);
    assert.ok(TRACK_IDS.includes(id), id);
    assert.ok(isPart3Track(id), `${id}: 第3部の 曲`);
    assert.ok(TRACK_NAMES[id], `${id}: 名前`);
    assert.deepEqual(checkText(TRACK_NAMES[id]).filter((p) => p.kind !== 'kana'), [], id);
    assert.ok(!/\s/.test(TRACK_NAMES[id]), `${id}: スペース なし`);
    assert.ok(Number.isFinite(TRACK_TRIM[id]) && Math.abs(TRACK_TRIM[id]) <= 3, `${id}: 大きさの そろえ ${TRACK_TRIM[id]}`);
    // ボスの 名前・少年・はかばの 先の 話（くぼみ・ながされた）は 出さない
    assert.ok(!/ムウ|魔人|アルゴル|くぼみ|ながさ|流さ/.test(TRACK_NAMES[id]), `${id}: ネタバレ ${TRACK_NAMES[id]}`);
  }
  for (const id of LOOPED) assert.ok(!_TRACKS[id].once && _TRACKS[id].loopFrom >= 1, `${id}: くり返す`);
  assert.equal(_TRACKS.c9d_end.once, true, '第1章の おわりは くり返さない');
  assert.equal(new Set(Object.values(TRACK_NAMES)).size, Object.keys(TRACK_NAMES).length, '名前が かさならない');
});

test('第93回 F: 区切りの 長さ・ひとまわりの 秒・区切りごとに ちがう', () => {
  const range = { c9d_lane: [60, 90], c9d_grave: [60, 90], c9d_mu: [55, 90], c9d_song: [60, 92] };
  for (const id of IDS) {
    const c = compileTrack(_TRACKS[id]);
    assert.equal(c.bar, 16, id);
    for (const [nm, s] of Object.entries(c.segs)) {
      const lens = s.parts.map((p) => p.reduce((a, e) => a + e.len, 0));
      assert.ok(lens.every((l) => l === s.steps), `${id} ${nm}: ${lens.join(',')}`);
      assert.equal(s.steps % c.bar, 0, `${id} ${nm}`);
      assert.ok(s.parts.some((p) => p.some((e) => e.f > 0)), `${id} ${nm}: 音が ある`);
    }
    if (id === 'c9d_end') {
      const sec = c.form.reduce((a, n) => a + secOf(c, n), 0);
      assert.ok(sec >= 40 && sec <= 60, `おわり: ${sec.toFixed(1)} 秒`);
      continue;
    }
    const [lo, hi] = range[id];
    // だんごとの 形も（はなれて いる・2体・歌える ふしの 数）
    const forms = [c, ...c.phaseForms.filter(Boolean)];
    for (const f of forms) {
      const sec = loopSec(c, f);
      assert.ok(sec >= lo && sec <= hi, `${id} ${f.form.join(',')}: ひとまわり ${sec.toFixed(1)} 秒`);
      const loopNames = f.form.slice(f.loopFrom);
      const sig = (nm) => c.parts.map((p, i) => JSON.stringify(c.segs[nm].parts[i].slice(0, 24))).join('|');
      assert.equal(new Set(loopNames.map(sig)).size, new Set(loopNames).size, `${id}: 区切りが ちがう`);
    }
  }
});

test('第93回 F: テンポ・パートは 5つまで・楽器・音の 高さの はんい', () => {
  const range = { c9d_lane: [84, 100], c9d_grave: [52, 66], c9d_mu: [120, 140], c9d_song: [68, 84], c9d_end: [64, 80] };
  for (const id of IDS) {
    const tr = _TRACKS[id];
    const [lo, hi] = range[id];
    assert.ok(tr.bpm >= lo && tr.bpm <= hi, `${id}: bpm ${tr.bpm}`);
    assert.ok(tr.parts.filter((p) => !p.drums).length <= 5, `${id}: パートが 多い`);
    // はかばと スピカの歌は たいこ なし（静か）
    assert.equal(tr.parts.some((p) => p.drums), !['c9d_grave', 'c9d_song'].includes(id), `${id}: たいこ`);
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
    for (const s of all) {
      const ns = notesOf(s.parts[lead]);
      for (let k = 1; k < ns.length; k++) assert.ok(Math.abs(ns[k] - ns[k - 1]) <= 12, `${id} ${s.name}: とび ${ns[k - 1]}→${ns[k]}`);
    }
  }
  // はかばは とても 静か: ふしの 音は 1小節に 2つまで
  const g = compileTrack(_TRACKS.c9d_grave);
  for (const nm of ['A', 'B']) for (const b of barNotes(g.segs[nm].parts[0])) assert.ok(b.length <= 2, `はかば ${nm}: ${b}`);
});

// 強拍（1・3拍め）: メロディと ベースが 短2度・増4度・長7度で ぶつからない。強拍で 鳴る パートどうしが 短2度（と 1オクターブ上）で にごらない。
//   だんで かわる 区切り（はなれて いる・おいかけっこ・伴そうだけの ふし）も ぜんぶ 見る
test('第93回 F: 強拍で ぶつからない・にごらない（0こ）', () => {
  const minN = { c9d_grave: 14, c9d_end: 20 };
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

test('第93回 F: ふたごの道は 左右で よび合い、apartStage 1 で ふしが 片方だけに なる', () => {
  const tr = _TRACKS.c9d_lane;
  const c = compileTrack(tr);
  const lead = 0;
  const ans = c.parts.findIndex((p, i) => i !== lead && p.inst === 'flute');
  assert.ok(ans > 0, 'こたえの 笛');
  assert.ok(c.parts[lead].pan < -0.2 && c.parts[ans].pan > 0.2, '左と 右');
  // A・B: 1〜6小節は 1小節ずつ かわるがわる（どちらか 片方だけ）・7〜8小節は 2人 そろって
  for (const nm of ['A', 'B', 'A2']) {
    const L = barNotes(c.segs[nm].parts[lead]);
    const R = barNotes(c.segs[nm].parts[ans]);
    for (let b = 0; b < 6; b++) assert.ok(!!L[b].length !== !!R[b].length, `${nm} ${b + 1}小節: かけ合い`);
    assert.ok(L[0].length ? !!R[1].length : !!L[1].length, `${nm}: よんだら こたえる`);
    for (const b of [6, 7]) assert.ok(L[b].length && R[b].length, `${nm} ${b + 1}小節: いっしょに`);
  }
  // A2 は 左右が 入れかわる
  assert.deepEqual(notesOf(c.segs.A2.parts[lead]), notesOf(c.segs.A.parts[ans]));
  assert.deepEqual(notesOf(c.segs.A2.parts[ans]), notesOf(c.segs.A.parts[lead]));
  // だん 1 ＝ はなれて いる: こたえの 笛は 休み・ふしは 左の 笛の よびかけだけ
  assert.ok(FORM_KEYS.includes('apartStage'));
  assert.equal(C9D_LANE_TRACK, 'c9d_lane');
  assert.equal(formOfPhase(c, 0), c);
  assert.deepEqual(formOfPhase(c, 1).form, ['ai', 'aA', 'aB', 'aA2']);
  for (const ph of tr.phases) assert.deepEqual([ph.transpose, ph.tempo], [0, 1], 'テンポと 調は かえない');
  for (const nm of ['ai', 'aA', 'aB', 'aA2']) assert.equal(notesOf(c.segs[nm].parts[ans]).length, 0, `${nm}: こたえが ない`);
  assert.deepEqual(notesOf(c.segs.aA.parts[lead]), notesOf(c.segs.A.parts[lead]), 'よびかけは 同じ');
  // にせの エンジンで
  const bar = (16 * 60) / c.bpm / 4;
  const a = run('c9d_lane', 0, bar * 10);
  const b = run('c9d_lane', 1, bar * 10);
  const flutes = (log) => log.filter((x) => x.inst === 'flute').length;
  assert.ok(flutes(b) < flutes(a) * 0.7, `はなれると 笛が へる ${flutes(a)} → ${flutes(b)}`);
  assert.ok(b.filter((x) => x.kind === 'd').every((x) => x.d === 'R'), 'はなれると たいこは リムだけ');
});

test('第93回 F: 画面の apartStage・songStage を 読む・その 曲の 時だけ だんを 送る', () => {
  assert.equal(apartStageOf({ field: {} }), 0);
  assert.equal(apartStageOf({ field: { apartStage: 1 } }), 1);
  assert.equal(apartStageOf({ field: { apartStage: true } }), 1);
  assert.equal(apartStageOf({ field: { apartStage: () => 1 } }), 1, '関数でも よい');
  assert.equal(apartStageOf({ field: {}, apartStage: 1 }), 1);
  assert.equal(apartStageOf({ field: { apartStage: 0 }, apartStage: 1 }), 0, '画面の field が 先');
  assert.equal(apartStageOf(null), 0);
  assert.equal(songStageOf({ field: {} }), 1, '出て いない 間は 1ふし');
  assert.equal(songStageOf({ field: { songStage: 3 } }), 3);
  assert.equal(songStageOf({ field: { songStage: () => 7 } }), 7);
  assert.equal(songStageOf({ field: { songStage: 12 } }), 7);
  assert.equal(songStageOf({ field: { songStage: 0 } }), 1);
  assert.equal(songStageOf({ songStage: 2, field: {} }), 2);
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
  assert.deepEqual(mk('c9d_g1', 'c9d_lane').log, [['i', 1], ['p', 0]]);
  const r = mk('c9d_g1', 'c9d_lane', { apartStage: 1 });
  assert.deepEqual(r.log, [['i', 1], ['p', 1]]);
  r.g.field.apartStage = 0;
  r.sa.syncField(r.g, 1000);
  assert.deepEqual(r.log.slice(2), [['p', 0]], 'スピカの 所に もどると 次の 小節から');
  // スピカの歌は イベントの 曲でも（場所の 曲が ちがっても）歌える ふしの 数を 送る
  assert.equal(C9D_SONG_TRACK, 'c9d_song');
  const s = mk('c9d_grave', 'c9d_grave', { songStage: 4 }, 'c9d_song');
  assert.deepEqual(s.log, [['p', 3]]);
  assert.deepEqual(mk('c9d_grave', 'c9d_grave', {}, 'c9d_song').log, [['p', 0]]);
  // ほかの 曲は だんを 送らない
  assert.deepEqual(mk('c9d_grave', 'c9d_grave', { apartStage: 1, songStage: 3 }).log, [['i', 1]]);
  // だんの 上限は 7（戦いの だんは 0〜3 の まま）
  const ad = new AdaptiveState();
  ad.setPhase(6);
  assert.equal(ad.want.phase, 6);
  ad.setPhase(20);
  assert.equal(ad.want.phase, MAX_PHASE);
  assert.equal(battlePhase({ boss: true, enemies: [{ side: 'enemy', boss: true, hp: 1, maxHp: 100, c8form: 9 }] }), 3);
});

test('第93回 F: 魔人の 曲は オルゴールの あそび歌で 始まり、だんだん はげしく、muStage 1 で おいかけっこ', () => {
  const tr = _TRACKS.c9d_mu;
  const c = compileTrack(tr);
  const mb = c.parts.findIndex((p) => p.inst === 'musicbox');
  const dr = c.parts.findIndex((p) => p.drums);
  // イントロ: オルゴールだけが ふし・おそめ・たいこは さいごの 小節だけ
  assert.equal(notesOf(c.segs.intro.parts[0]).length, 0, 'イントロは 四角い 波が 休み');
  assert.deepEqual(notesOf(c.segs.intro.parts[mb]), notesOf(parseNotes(C9D_MU_SONGS.song.slice(0, 4).join(' '))));
  assert.ok(c.segs.intro.bpm < c.bpm, 'イントロは おそめ');
  // だんだん はげしく: たいこは A より C・D が 多い・ふしの 音の 数は A < D（8分で かけまわる）
  const hits = (nm) => c.segs[nm].parts[dr].filter((e) => e.drum).length;
  assert.ok(hits('A') * 1.5 < hits('C') && hits('A') * 1.5 < hits('D'), `たいこ ${hits('A')} ${hits('C')} ${hits('D')}`);
  assert.ok(notesOf(c.segs.A.parts[0]).length < notesOf(c.segs.D.parts[0]).length);
  // muStage（0 から 数える しるし）→ だん
  assert.ok(FORM_KEYS0.includes('muStage') && !FORM_KEYS.includes('muStage'));
  const boss = (o) => battlePhase({ boss: true, enemies: [{ side: 'enemy', boss: true, hp: 90, maxHp: 100, ...o }] });
  assert.equal(boss({ muStage: 0 }), 0, '1体');
  assert.equal(boss({ muStage: 0, hp: 40 }), 0, '1体の 間は HP が へっても 0');
  assert.equal(boss({ muStage: 1 }), 1, '2体に 分かれた');
  assert.equal(battlePhase({ boss: true, enemies: [{ side: 'enemy', boss: true, hp: 30, maxHp: 100, muStage: 1 }, { side: 'enemy', boss: true, hp: 60, maxHp: 100, muStage: 1 }] }), 1);
  assert.equal(boss({ hp: 40 }), 1, 'しるしが ない 時は HP 半分で');
  assert.equal(battleBgm({ snapBgm: 'c9d_mu', mapId: 'c9d_grave', has: (id) => !!_TRACKS[id] }), 'c9d_mu');
  assert.equal(battleBgm({ snapBgm: 'battle', mapId: 'c9d_g1', has: (id) => !!_TRACKS[id] }), 'battle3');
  // だん 1: おいかけっこ（オルゴールが 2小節 おくれ。くり返すと つながる わの 形）
  assert.deepEqual(formOfPhase(c, 1).form, ['cI', 'cA', 'cB', 'cC', 'cD']);
  assert.ok(tr.phases[1].tempo > 1 && tr.phases[1].tempo <= 1.06);
  const lag = C9D_MU_SONGS.lag;
  for (const [nm, front, back] of [['cA', 0, mb], ['cB', 0, mb], ['cC', mb, 0], ['cD', mb, 0]]) {
    const F = barNotes(c.segs[nm].parts[front]);
    const B = barNotes(c.segs[nm].parts[back]);
    for (let b = 0; b < 8; b++) assert.deepEqual(B[b], F[(b - lag + 8) % 8], `${nm} ${b + 1}小節: ${lag}小節 おくれで おいかける`);
  }
  // 和音は 2小節で 1まわり（おくれても にごらない）
  const bass = c.parts.findIndex((p) => p.role === 'bass');
  const roots = barNotes(c.segs.cA.parts[bass]).map((b) => b[0] % 12);
  for (let b = 2; b < 8; b++) assert.equal(roots[b], roots[b - 2]);
  // にせの エンジン: だん 1 は オルゴールが ずっと ふしを 鳴らす（だん 0 は イントロの あとは きらきら だけ）
  const bar = (16 * 60) / c.bpm / 4;
  const from = secOf(c, 'intro');
  const a = run('c9d_mu', 0, from + bar * 8).filter((x) => x.t >= from);
  const b = run('c9d_mu', 1, from + bar * 8).filter((x) => x.t >= from);
  const n = (log, inst) => log.filter((x) => x.inst === inst).length;
  assert.ok(n(b, 'musicbox') > n(a, 'musicbox') * 2, `おいかけっこ ${n(a, 'musicbox')} → ${n(b, 'musicbox')}`);
  assert.equal(tr.pinch.n.split(' ')[0], 'G6:2', 'ピンチは 主音から');
});

test('第93回 F: スピカの歌は 7つの ふし・songStage の 数だけ 歌う・星の子の ふしと つながる', () => {
  const tr = _TRACKS.c9d_song;
  const c = compileTrack(tr);
  const { phrases, chords } = C9D_SONG;
  assert.equal(phrases.length, 7);
  for (let k = 0; k < 7; k++) {
    assert.equal(phrases[k].length, 4, `${k + 1}ふしめ: 4小節`);
    assert.equal(chords[k].length, 4);
    assert.equal(c.segs[`s${k + 1}`].steps, 64);
    assert.deepEqual(notesOf(c.segs[`s${k + 1}`].parts[0]), notesOf(parseNotes(phrases[k].join(' '))), `${k + 1}ふしめを 笛が 歌う`);
    assert.equal(notesOf(c.segs[`a${k + 1}`].parts[0]).length, 0, `${k + 1}ふしめの 伴そうだけ`);
    // 伴そうは 歌う 時も 歌わない 時も 同じ（ベース・のばし・ハープ）
    for (const i of [1, 2, 3]) assert.deepEqual(c.segs[`a${k + 1}`].parts[i], c.segs[`s${k + 1}`].parts[i]);
  }
  // songStage n（だん n-1）: はじめの n ふしを 歌い、のこりは 伴そう
  for (let n = 1; n <= 7; n++) {
    const f = formOfPhase(c, n - 1);
    assert.deepEqual(f.form, songForm(n));
    assert.equal(f.form.filter((x) => x.startsWith('s')).length, n);
    assert.equal(f.form.length, 8);
    assert.equal(f.loopFrom, 1, 'くり返しは 1ふしめから');
  }
  assert.deepEqual(tr.form, songForm(1), 'この 幕は 1ふしめ だけ');
  for (const ph of tr.phases) assert.deepEqual([ph.transpose, ph.tempo], [0, 1]);
  // 1ふしめは ミから 始まる・ソで 止まる（問い）
  const p1 = notesOf(parseNotes(phrases[0].join(' ')));
  assert.equal(p1[0] % 12, 4, 'ミから');
  assert.equal(p1[p1.length - 1] % 12, 7);
  // 3ふしめは 星の子の 7つの 音（ド〜シ）を 1つずつ のぼる（c9a_child の はじめと 同じ）
  const p3 = notesOf(parseNotes(phrases[2].join(' ')));
  assert.deepEqual(p3.slice(0, 7), C9A_SEVEN.map(mOf));
  const child = notesOf(compileTrack(_TRACKS.c9a_child).segs.A.parts[0]);
  assert.deepEqual(p3.slice(0, 6), child.slice(0, 6), '星の子の ふしと 同じ 頭');
  // 7ふし そろうと 1つの 歌: ハ長調（5ふしめの ソ# だけ ホ長調の 和音）・さいごは シ → ド（星の子の 曲と 同じ とけ方）
  const whole = notesOf(parseNotes(phrases.flat().join(' ')));
  for (const m of whole) assert.ok([0, 2, 4, 5, 7, 9, 11].includes(m % 12) || m % 12 === 8, `ハ長調の 外 ${m}`);
  assert.equal(whole.filter((m) => m % 12 === 8).length, 1);
  assert.deepEqual(whole.slice(-2).map((m) => m % 12), [11, 0], 'シ → ド');
  for (let k = 0; k < 6; k++) assert.notEqual(notesOf(parseNotes(phrases[k].join(' '))).pop() % 12, 0, `${k + 1}ふしめは ドで 止まらない（つづく）`);
  // にせの エンジン: だんの 数だけ 笛が 歌う
  const bar = (16 * 60) / c.bpm / 4;
  const sung = (ph) => run('c9d_song', ph, bar * 30).filter((x) => x.inst === 'flute' && x.t < bar * 30).length;
  const counts = [0, 2, 6].map(sung);
  assert.ok(counts[0] > 0 && counts[0] < counts[1] && counts[1] < counts[2], `歌う ふしの 数 ${counts}`);
  assert.equal(counts[0], p1.length, '1ふしめ だけ');
});

test('第93回 F: 第1章の おわりは スピカの歌の 1ふしめ・53 秒・シで 止まる（終止を ぼかす）', () => {
  const c = compileTrack(_TRACKS.c9d_end);
  assert.equal(notesOf(c.segs.intro.parts[0]).length, 0, '静かに 始まる（のばしと ベル）');
  assert.deepEqual(notesOf(c.segs.S.parts[0]), notesOf(parseNotes(C9D_SONG.phrases[0].join(' '))), 'スピカの歌の 1ふしめ');
  assert.deepEqual(notesOf(c.segs.P.parts[0]), notesOf(c.segs.S.parts[0]).map((m) => m + 12), '1ふしめを 高く');
  const last = notesOf(c.segs.Q.parts[0]).pop();
  const bassLast = notesOf(c.segs.Q.parts[1]).pop();
  assert.equal(last % 12, 11, 'シで 止まる');
  assert.equal(bassLast % 12, 7, 'ソの 和音（ドへ 帰らない）');
  const { eng, log } = spyEngine();
  eng.start('c9d_end', _TRACKS.c9d_end, 0);
  eng.pump(90);
  assert.ok(eng.player.done(90), 'おわる');
  const sec = (16 * 16 * 60) / c.bpm / 4;
  assert.ok(Math.abs(eng.player.endT - sec) < 1e-6, `16小節 = ${sec.toFixed(1)} 秒 ${eng.player.endT}`);
  assert.ok(Math.max(...log.map((x) => x.t)) < sec, 'さいごの 音は おわりより 前');
});

test('第93回 F: 前の音 用の ch・今まで の 曲は かわって いない', () => {
  for (const id of IDS) {
    const tr = _TRACKS[id];
    assert.equal(tr.ch.length, tr.parts.length, id);
    for (const ch of tr.ch) for (const t of ch.n.split(/\s+/)) assert.match(t, ch.drums ? /^[kshr]:\d+$/ : /^(r|[A-G][#b]?\d):\d+$/, `${id}: ${t}`);
    const total = (ch) => ch.n.split(/\s+/).reduce((a, t) => a + Number(t.split(':')[1]), 0);
    assert.equal(new Set(tr.ch.map(total)).size, 1, `${id}: 前の音の チャンネルの 長さ`);
    assert.equal(legacyChannels(tr).ch, tr.ch, id);
  }
  for (const id of [...Object.keys(C9A_TRACKS), ...Object.keys(C9B_TRACKS), ...Object.keys(C9C_TRACKS), 'battle', 'field']) {
    assert.ok(!(id in C9D_TRACKS), id);
    if (C9A_TRACKS[id]) assert.equal(_TRACKS[id].parts, C9A_TRACKS[id].parts, id);
    if (C9B_TRACKS[id]) assert.equal(_TRACKS[id].parts, C9B_TRACKS[id].parts, id);
    if (C9C_TRACKS[id]) assert.equal(_TRACKS[id].parts, C9C_TRACKS[id].parts, id);
  }
});
