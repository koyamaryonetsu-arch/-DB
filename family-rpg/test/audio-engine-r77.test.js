// 第77回 A・D: 音楽の エンジン（music-engine.js・music-inst.js・music-amb.js）と 音楽を聞く（audio-names.js・ui/soundtest.js）
//   楽譜の 読み方（新しい 書き方・前の 書き方は 同じ 結果）・楽器の わりあて・形（区切り）の くりかえし・
//   自動アレンジ（同じ 入力なら 同じ）・場面で かわる 音楽（次の 小節で 効く）・曲の 名前・前の音は そのまま
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { _TRACKS, _parse, TRACK_IDS, GameAudio } from '../public/js/client/audio.js';
import {
  parseNotes, legacyParse, freqOf, compileTrack, expandPass, formWalk, nextPos, AdaptiveState, nextTempo, phaseOf,
  swingPos, beatAccent, MusicEngine, legacyChannels, blipFreq, DRUMS, DEFAULT_PHASES,
} from '../public/js/client/music-engine.js';
import { INSTRUMENTS, INSTRUMENT_NAMES, defaultInstrument, WAVE_LEVEL } from '../public/js/client/music-inst.js';
import { AMBIENCES } from '../public/js/client/music-amb.js';
import { TRACK_NAMES, trackName, AMBIENCE_NAMES } from '../public/js/client/audio-names.js';
import { TRACK_TRIM } from '../public/js/client/audio-trim.js';
import { checkText, gameFiles } from '../tools/kanji-check.mjs';

const src = (p) => readFileSync(new URL(`../public/js/client/${p}`, import.meta.url), 'utf8');

// 第77回 B: 作りなおした 曲（battle・boss など）は 区切りの 曲に なった。前の データ（legacy）だけの 曲を 作って 見る
const legacyOnly = (id) => ({ bpm: _TRACKS[id].legacy?.bpm ?? _TRACKS[id].bpm, ch: _TRACKS[id].legacy?.ch ?? _TRACKS[id].ch });
const OLD_BATTLE = legacyOnly('battle');
const OLD_BOSS = legacyOnly('boss');

// ───── 小さな にせの AudioContext（ノードを 作った ことと 時間の 予約だけ おぼえる）─────
class FakeParam {
  constructor(v = 0) { this.value = v; this.calls = []; }
  setValueAtTime(v, t) { this.calls.push(['set', v, t]); return this; }
  linearRampToValueAtTime(v, t) { this.calls.push(['lin', v, t]); return this; }
  exponentialRampToValueAtTime(v, t) { this.calls.push(['exp', v, t]); return this; }
  setTargetAtTime(v, t, k) { this.calls.push(['target', v, t, k]); return this; }
  setValueCurveAtTime(c, t, d) { this.calls.push(['curve', c.length, t, d]); return this; }
  cancelScheduledValues() { return this; }
}
class FakeNode {
  constructor(ctx, kind) {
    this.ctx = ctx; this.kind = kind; this.outs = [];
    for (const p of ['gain', 'frequency', 'detune', 'Q', 'pan', 'threshold', 'knee', 'ratio', 'attack', 'release']) this[p] = new FakeParam(p === 'gain' ? 1 : 0);
    ctx.made.push(this);
  }
  connect(n) { this.outs.push(n); return n; }
  disconnect() { this.outs = []; }
  start(t) { this.startT = t; }
  stop(t) { this.stopT = t; }
  setPeriodicWave(w) { this.wave = w; }
}
class FakeCtx {
  constructor() { this.made = []; this.currentTime = 0; this.sampleRate = 8000; this.destination = new FakeNode(this, 'dest'); }
  createGain() { return new FakeNode(this, 'gain'); }
  createOscillator() { return new FakeNode(this, 'osc'); }
  createBiquadFilter() { return new FakeNode(this, 'filter'); }
  createBufferSource() { return new FakeNode(this, 'buffer'); }
  createStereoPanner() { return new FakeNode(this, 'pan'); }
  createConvolver() { return new FakeNode(this, 'conv'); }
  createWaveShaper() { return new FakeNode(this, 'shaper'); }
  createDynamicsCompressor() { return new FakeNode(this, 'comp'); }
  createPeriodicWave(re, im) { return { re, im }; }
  createBuffer(ch, len) { const d = [...Array(ch)].map(() => new Float32Array(len)); return { getChannelData: (i) => d[i], length: len }; }
}

// エンジンの 1音・たいこを 記録する（音は 作らない）
function spyEngine(opts = {}) {
  const ctx = new FakeCtx();
  const eng = new MusicEngine(ctx, ctx.destination, { offline: true, ...opts });
  const log = [];
  eng.voice = (f, t, dur, inst, vel, dest, o = {}) => log.push({ kind: 'v', f, t, dur, inst, vel, dest, layer: o });
  eng.drum = (d, t, vel, dest) => log.push({ kind: 'd', d, t, vel, dest });
  eng.legacyNote = (f, t, dur, w, v) => log.push({ kind: 'ln', f, t, dur, w, v });
  eng.legacyDrum = (d, t, v) => log.push({ kind: 'ld', d, t, v });
  return { ctx, eng, log };
}

// ───────────── 楽譜 ─────────────
test('第77回: 新しい 読み方は ぜんぶの 曲の 前の 書き方で 前と 同じ 結果（f・len・drum）', () => {
  let n = 0;
  for (const [id, tr] of Object.entries(_TRACKS)) {
    for (const c of tr.ch) {
      const old = _parse(c.n);
      const now = parseNotes(c.n).map((e) => (e.drum ? { drum: e.drum, len: e.len } : { f: e.f, len: e.len }));
      assert.deepEqual(now, old, id);
      // 前の 書き方には 新しい しるしが 出ない
      assert.ok(parseNotes(c.n).every((e) => !e.acc && !e.stac && !e.leg && !e.fs), id);
      n++;
    }
  }
  assert.ok(n > 300);
  // _parse は 前の 読み方そのもの
  assert.equal(_parse, legacyParse);
});

test('第77回: 新しい 書き方（アクセント・ゴースト・タイ・スタッカート・和音・ふえた たいこ）', () => {
  const ev = parseNotes('C5:4! D5:2? E5:2. F5:4~ F5:4 G5:2~ A5:2 [C4 E4 G4]:8 [D4 F4]:4! r:2 B4');
  assert.equal(ev[0].acc, 1.35);
  assert.equal(ev[1].acc, 0.5);
  assert.equal(ev[2].stac, true);
  // 同じ 音の タイは 1つに（長さを たす）
  assert.equal(ev[3].f, freqOf('F5'));
  assert.equal(ev[3].len, 8);
  // ちがう 音の ~ は レガート
  assert.equal(ev[4].f, freqOf('G5'));
  assert.equal(ev[4].leg, true);
  assert.equal(ev[5].f, freqOf('A5'));
  assert.deepEqual(ev[6].fs, ['C4', 'E4', 'G4'].map(freqOf));
  assert.equal(ev[6].len, 8);
  assert.equal(ev[6].f, freqOf('C4'));
  assert.equal(ev[7].acc, 1.35);
  assert.equal(ev[7].fs.length, 2);
  assert.deepEqual(ev[8], { f: 0, len: 2 });
  assert.deepEqual(ev[9], { f: freqOf('B4'), len: 4 });
  // 長さの 合計は かわらない（タイで まとめても）
  assert.equal(ev.reduce((a, e) => a + e.len, 0), 4 + 2 + 2 + 8 + 2 + 2 + 8 + 4 + 2 + 4);
  // たいこ
  const d = parseNotes('k:2! s:2? h:1 o:1 c:4 p:2 t:1 th:1 tl:2 R:1 rim:1 r:2');
  assert.deepEqual(d.map((e) => e.drum || 'rest'), ['k', 's', 'h', 'o', 'c', 'p', 't', 'th', 'tl', 'R', 'R', 'rest']);
  for (const x of DRUMS) assert.ok(d.some((e) => e.drum === x), x);
  assert.equal(d[0].acc, 1.35);
  // さいごの ~ は レガート（くりかえしで つながる）
  assert.equal(parseNotes('C5:4 D5:4~').at(-1).leg, true);
});

// ───────────── 楽器 ─────────────
test('第77回: 楽器の プリセット（10しゅるい 以上・ファミコンふう・1音の オシレーターは 2つまで）', () => {
  for (const k of ['lead', 'soft_lead', 'bell', 'pluck', 'strings', 'pad', 'brass', 'flute', 'bass', 'sub_bass', 'organ']) assert.ok(INSTRUMENTS[k], k);
  assert.ok(INSTRUMENT_NAMES.filter((k) => k.startsWith('chip_')).length >= 3);
  for (const [k, p] of Object.entries(INSTRUMENTS)) {
    for (const f of ['a', 'd', 's', 'r', 'gain']) assert.ok(Number.isFinite(p[f]), `${k}.${f}`);
    assert.ok(p.s >= 0 && p.s <= 1, k);
    assert.ok(!(p.osc2 && p.fm), `${k}: osc2 と fm は どちらか 1つ`);
    assert.ok(!p.alt || INSTRUMENTS[p.alt], `${k}.alt`);
    if (p.vib) assert.ok(p.vib.depth <= 30 && p.vib.rate > 0, k);
  }
});

test('第77回: 古い チャンネル（w だけ）を 役わりで 新しい 楽器に（さいしょの メロディ = リード・いちばん 低い = ベース）', () => {
  assert.equal(defaultInstrument('pulse', 'lead'), 'lead');
  assert.equal(defaultInstrument('triangle', 'lead'), 'flute');
  assert.equal(defaultInstrument('sine', 'lead'), 'soft_lead');
  assert.equal(defaultInstrument('saw', 'lead'), 'brass');
  assert.equal(defaultInstrument('triangle', 'bass'), 'bass');
  assert.equal(defaultInstrument('sine', 'bass'), 'sub_bass');
  assert.equal(defaultInstrument('square', 'harmony', { style: 'long' }), 'strings');
  assert.equal(defaultInstrument('triangle', 'harmony', { style: 'long' }), 'pad');
  assert.equal(defaultInstrument('square', 'harmony', { style: 'short' }), 'pluck');
  assert.equal(defaultInstrument('triangle', 'harmony', { style: 'short', high: true }), 'musicbox');
  const b = compileTrack(OLD_BATTLE);
  assert.deepEqual(b.parts.map((p) => p.role), ['lead', 'bass', 'harmony', 'drums']);
  assert.deepEqual(b.parts.map((p) => p.inst), ['lead', 'bass', 'strings', null]);
  // 左右: リード・ベースは まん中、ハーモニーは 左右
  assert.equal(b.parts[0].pan, 0);
  assert.equal(b.parts[1].pan, 0);
  assert.notEqual(b.parts[2].pan, 0);
  // 音量: v に 古い 波の 大きさを かける（pulse は 小さい）
  assert.ok(Math.abs(b.parts[0].v - 0.1 * WAVE_LEVEL.pulse) < 1e-9);
  // ぜんぶの 曲: リードが 1つ・楽器が ある・たいこ以外は 音が ある
  for (const [id, tr] of Object.entries(_TRACKS)) {
    const c = compileTrack(tr);
    assert.equal(c.parts.filter((p) => p.role === 'lead').length, 1, id);
    assert.equal(c.parts[c.leadIdx], c.parts.find((p) => !p.drums), `${id}: さいしょの メロディが リード`);
    for (const p of c.parts) if (!p.drums) assert.ok(INSTRUMENTS[p.inst], `${id}: ${p.inst}`);
    assert.ok(c.bar === 16 || c.bar === 12, id);
    assert.ok(c.tonic >= 0 && c.tonic < 12, id);
  }
  // 6/8 の 曲は 1小節 12
  assert.equal(compileTrack(_TRACKS.sea).bar, 12);
  assert.equal(compileTrack(_TRACKS.festival).bar, 12);
  // i: で 楽器を えらべる・role / pan / layer も
  const c = compileTrack({ bpm: 120, ch: [{ i: 'bell', v: 0.1, n: 'C5:16' }, { w: 'triangle', role: 'bass', pan: 0.2, layer: 2, n: 'C2:16' }] });
  assert.equal(c.parts[0].inst, 'bell');
  assert.equal(c.parts[1].role, 'bass');
  assert.equal(c.parts[1].pan, 0.2);
  assert.equal(c.parts[1].minI, 0.5);
});

// ───────────── 形（区切り）─────────────
const SEC = {
  bpm: 120,
  parts: [{ i: 'lead', v: 0.1 }, { i: 'bass', v: 0.1 }, { drums: true, v: 0.4 }],
  sections: {
    intro: { ch: ['C5:16', 'C3:16', 'k:4 k:4 k:4 c:4'] },
    A: ['E5:8 G5:8 [C5 E5]:16', 'C3:32', 'k:4 s:4 '.repeat(4)],
    B: { ch: [{ n: 'A5:16 G5:16' }, 'F2:16 G2:16', null] },
  },
  form: ['intro', 'A', 'A', 'B'],
  loopFrom: 1,
};

test('第77回: 区切り（sections・form・loopFrom）: イントロは 1回だけ、そのあと A A B を くりかえす', () => {
  const c = compileTrack(SEC);
  assert.deepEqual(c.form, ['intro', 'A', 'A', 'B']);
  assert.equal(c.loopFrom, 1);
  assert.equal(c.auto, false, '区切りの ある 曲は 自動アレンジ しない（チーム B が 作る）');
  assert.deepEqual(formWalk(c, 9), [['intro', 0], ['A', 0], ['A', 0], ['B', 0], ['A', 1], ['A', 1], ['B', 1], ['A', 2], ['A', 2]]);
  assert.equal(c.segs.intro.steps, 16);
  assert.equal(c.segs.A.steps, 32);
  assert.equal(c.segs.B.steps, 32);
  // 区切りに ない パートは やすみ
  assert.equal(c.segs.B.parts[2].length, 0);
  // once の 曲は さいごで おわる
  const once = compileTrack({ ...SEC, once: true });
  assert.equal(formWalk(once, 20).length, 4);
  assert.deepEqual(nextPos(once, 3, 0), { pos: 3, loop: 0, ended: true });
  // 前の 曲（ch）は main の 1つだけ
  const b = compileTrack(OLD_BATTLE);
  assert.deepEqual(formWalk(b, 3), [['main', 0], ['main', 1], ['main', 2]]);
  // 前の音で 鳴らす とき: 区切りを form の じゅんに つなげる
  const lc = legacyChannels(SEC);
  assert.equal(lc.ch.length, 3);
  assert.equal(lc.ch[0].n.split(/\s+/).filter(Boolean).length, 1 + 4 + 4 + 2);
  // legacy: が あれば 前の音は そちら
  const withLegacy = { ...SEC, legacy: { bpm: 90, ch: [{ w: 'pulse', v: 0.1, n: 'C5:4' }] } };
  assert.equal(legacyChannels(withLegacy).bpm, 90);
});

test('第77回: 区切りの 曲を 新しい音で 鳴らすと イントロ → A → A → B → A と 進む（時間も 正しい）', () => {
  const { eng, log } = spyEngine();
  eng.start('sec', SEC, 0);
  eng.pump(16 * 0.125 + 3 * 32 * 0.125 + 4); // イントロ ＋ A A B ＋ 少し
  const spb = 60 / 120 / 4;
  const leads = log.filter((x) => x.kind === 'v' && x.inst === 'lead' && !x.layer.layer);
  const t = (s) => Math.round(s / spb);
  // イントロ C5 → A の E5 G5 和音 → A → B の A5 G5 → A の E5
  const seq = leads.map((x) => [t(x.t), Math.round(12 * Math.log2(x.f / 440)) + 69]);
  assert.deepEqual(seq.slice(0, 13), [
    [0, 72], [16, 76], [24, 79], [32, 72], [32, 76], [48, 76], [56, 79], [64, 72], [64, 76], [80, 81], [96, 79], [112, 76], [120, 79],
  ]);
  // シンバル・クラップ など 新しい たいこ
  assert.ok(log.some((x) => x.kind === 'd' && x.d === 'c'));
});

// ───────────── 自動アレンジ ─────────────
test('第77回: 自動アレンジ: 短い 曲を 4回で ひとまわりに（2回目 重ね・3回目 うすく・4回目 フィル）。同じ 入力なら 同じ', () => {
  const tr = OLD_BATTLE;
  const c = compileTrack(tr);
  assert.equal(c.auto, true);
  const vs = [0, 1, 2, 3].map((v) => expandPass(c, 'main', v));
  // 同じ 入力なら 同じ（キャッシュを つかわず もう一度 作っても）
  const fresh = { ...tr };
  const c2 = compileTrack(fresh);
  for (let v = 0; v < 4; v++) assert.deepEqual(JSON.stringify(expandPass(c2, 'main', v)), JSON.stringify(vs[v]), `variant ${v}`);
  const flat = (x) => x.bars.flat();
  // 1回目 = 書いた とおり
  assert.ok(!flat(vs[0]).some((it) => it.layer));
  assert.ok(!flat(vs[0]).some((it) => it.drum === 'c'));
  // 2回目: メロディの オクターブの 重ね・シンバル・さいごの 小節に フィル・ハーモニーの 楽器が かわる
  const l1 = flat(vs[1]).filter((it) => it.layer);
  assert.equal(l1.length, flat(vs[0]).filter((it) => it.p === c.leadIdx).length);
  assert.ok(l1.every((it) => Math.abs(it.octShift) === 12));
  assert.ok(flat(vs[1]).some((it) => it.drum === 'c' && it.step === 0));
  const last = vs[1].bars.at(-1);
  assert.ok(last.some((it) => it.drum === 'th') && last.some((it) => it.drum === 'tl'), 'フィル');
  assert.ok(flat(vs[1]).filter((it) => it.p === 2).every((it) => it.inst === INSTRUMENTS.strings.alt));
  // 3回目: うすく（スネア → リム・ハーモニー 小さく・リードの 楽器が かわる）
  assert.ok(!flat(vs[2]).some((it) => it.drum === 's'));
  assert.ok(flat(vs[2]).some((it) => it.drum === 'R'));
  assert.ok(flat(vs[2]).filter((it) => it.p === c.leadIdx).every((it) => it.inst === INSTRUMENTS.lead.alt));
  const hv = (x) => flat(x).filter((it) => it.p === 2).reduce((a, it) => a + it.vel, 0);
  assert.ok(hv(vs[2]) < hv(vs[0]) * 0.6);
  // 4回目: 重ね・クラップ・フィル
  assert.ok(flat(vs[3]).some((it) => it.layer));
  assert.ok(flat(vs[3]).some((it) => it.drum === 'p'));
  assert.ok(vs[3].bars.at(-1).some((it) => it.drum === 'tl'));
  // 5回目は 1回目と 同じ（4回で ひとまわり）
  assert.deepEqual(JSON.stringify(expandPass(c, 'main', 4)), JSON.stringify(vs[0]));
  // auto: false なら いつも 書いた とおり
  const off = compileTrack({ ...tr, auto: false });
  assert.deepEqual(JSON.stringify(expandPass(off, 'main', 1)), JSON.stringify(expandPass(off, 'main', 0)));
  // ジングル（once）は 自動アレンジ しない
  assert.equal(compileTrack(_TRACKS.victory).auto, false);
  // fill: 4 … 4小節ごとに フィル
  const f4 = compileTrack({ ...tr, auto: false, fill: 4 });
  const e4 = expandPass(f4, 'main', 0);
  for (let b = 0; b < e4.bars.length; b++) assert.equal(e4.bars[b].some((it) => it.drum === 'tl'), (b + 1) % 4 === 0, `bar ${b}`);
});

test('第77回: 強弱（拍の 頭を 少し 強く）・スイング', () => {
  assert.ok(beatAccent(0, 16) > beatAccent(8, 16));
  assert.ok(beatAccent(8, 16) > beatAccent(4, 16));
  assert.ok(beatAccent(4, 16) > beatAccent(2, 16));
  assert.ok(beatAccent(2, 16) > beatAccent(1, 16));
  assert.equal(swingPos(2, 0), 2);
  assert.equal(swingPos(4, 0.2), 4);
  assert.ok(Math.abs(swingPos(2, 0.2) - 2.4) < 1e-9);
  assert.ok(swingPos(3, 0.2) > swingPos(2, 0.2) && swingPos(3, 0.2) < 4);
  const c = compileTrack({ bpm: 120, swing: 0.9, ch: [{ w: 'pulse', n: 'C5:16' }] });
  assert.equal(c.swing, 0.3, 'スイングは 0〜0.3');
});

// ───────────── 場面で かわる 音楽 ─────────────
test('第77回: 場面で かわる 音楽の じょうたい（次の 小節の 頭で 効く・強さは 曲ごとに おぼえる）', () => {
  const a = new AdaptiveState();
  a.onTrack('dungeon');
  a.setIntensity(0.3);
  a.setPinch(true);
  a.setPhase(2);
  a.setTimeOfDay('night');
  // latch まで 今の 値は かわらない
  assert.equal(a.cur.intensity, 1);
  assert.equal(a.cur.pinch, false);
  const cur = a.latch();
  assert.deepEqual(cur, { intensity: 0.3, pinch: true, phase: 2, tod: 'night' });
  // 戦いの 曲へ: 強さは 1・ピンチと だんは もとに・昼夜は そのまま
  a.onTrack('battle');
  assert.deepEqual(a.cur, { intensity: 1, pinch: false, phase: 0, tod: 'night' });
  // ダンジョンの 曲に もどると 強さは 0.3
  a.onTrack('dungeon');
  assert.equal(a.cur.intensity, 0.3);
  // へんな 値
  a.setIntensity(7);
  assert.equal(a.want.intensity, 1);
  a.setIntensity(-1);
  assert.equal(a.want.intensity, 0);
  a.setIntensity('x');
  assert.equal(a.want.intensity, 1);
  a.setPhase(9);
  assert.equal(a.want.phase, 3);
  a.setTimeOfDay('dusk');
  assert.equal(a.want.tod, 'day');
  // テンポは 1小節ごとに 1/3 ずつ 近づく
  let t = 1;
  const steps = [];
  for (let i = 0; i < 12 && t !== 1.12; i++) steps.push((t = nextTempo(t, 1.12)));
  assert.equal(t, 1.12);
  assert.ok(steps.length >= 3, 'いっぺんには かわらない');
  for (let i = 1; i < steps.length; i++) assert.ok(steps[i] > steps[i - 1]);
  assert.deepEqual(phaseOf(compileTrack(OLD_BOSS), 1), DEFAULT_PHASES[1]);
  assert.equal(phaseOf(compileTrack({ ...SEC, phases: [{ transpose: 0, tempo: 1 }, { transpose: 5, tempo: 1.2 }] }), 3).transpose, 5);
});

test('第77回: 強さ・だん・ピンチ・夜は 鳴らしている 曲の 次の 小節から 効く', () => {
  const { eng, log } = spyEngine();
  const tr = OLD_BATTLE; // 152 bpm、1小節 = 16
  const bar = (16 * 60) / 152 / 4;
  eng.start('battle', tr, 0);
  eng.pump(bar * 0.5); // 1小節目だけ 予約
  const n1 = log.length;
  assert.ok(log.some((x) => x.kind === 'd'), '1小節目は たいこも ある');
  // 強さを 下げても、もう 予約した 1小節目は そのまま。2小節目から ハーモニー・たいこが 消える
  eng.adaptive.setIntensity(0.2);
  eng.pump(bar * 1.5);
  const bar2 = log.slice(n1);
  assert.ok(bar2.length > 0);
  assert.ok(bar2.every((x) => x.kind === 'v'), 'たいこが ない');
  const strips = new Set(bar2.map((x) => x.dest));
  assert.equal(strips.size, 2, 'リードと ベースだけ');
  // だん 1: キーが 半音 上がり、テンポが 少しずつ 上がる
  eng.adaptive.setIntensity(1);
  eng.adaptive.setPhase(1);
  const n2 = log.length;
  eng.pump(bar * 2.5);
  const bar3 = log.slice(n2).filter((x) => x.kind === 'v' && x.inst === 'lead');
  // 3小節目の さいしょの 音 D5（バトルの 楽譜の 3小節目）が 半音 上
  assert.ok(Math.abs(bar3[0].f / freqOf('D5') - Math.pow(2, 1 / 12)) < 1e-6);
  const p = eng.player;
  assert.ok(p.tempo > 1 && p.tempo < 1.06, `テンポ ${p.tempo}`);
  // ピンチ: 高い 音の 重ね（chip_arp）が 入る
  eng.adaptive.setPinch(true);
  const n3 = log.length;
  eng.pump(bar * 3.5);
  const pin = log.slice(n3).filter((x) => x.inst === 'chip_arp');
  assert.equal(pin.length, 8, '8分で 1小節 8つ');
  assert.ok(pin.every((x) => x.f > 900));
  assert.equal(eng.tensionOn, true, 'ピンチの 明るさ（通り道の フィルター）');
  // 夜: リードが ベルに
  eng.adaptive.setPinch(false);
  eng.adaptive.setTimeOfDay('night');
  const n4 = log.length;
  eng.pump(bar * 4.5);
  assert.ok(log.slice(n4).filter((x) => x.kind === 'v' && x.dest === p.strips[0].g).every((x) => x.inst === 'bell'));
  // 曲が かわると ピンチ・だんは もとに
  eng.start('field', _TRACKS.field, 10);
  assert.equal(eng.adaptive.cur.phase, 0);
  assert.equal(eng.adaptive.cur.tod, 'night');
});

test('第77回: 予約が おくれた 小節は 鳴らさない（一度に たくさん 鳴らない）', () => {
  const { ctx, eng, log } = spyEngine({ offline: false });
  eng.start('battle', _TRACKS.battle, 0);
  ctx.currentTime = 10; // 10びょう ぶん タイマーが 止まって いた
  eng.pump(10.2);
  assert.ok(eng.lateBars > 0);
  assert.ok(log.every((x) => x.t >= 10), '前の 時間の 音は 予約しない');
});

test('第77回: 曲の そろえ（audio-trim.js）は ±12 dB の 中で、ある 曲の id だけ', () => {
  for (const [id, v] of Object.entries(TRACK_TRIM)) {
    assert.ok(_TRACKS[id], id);
    assert.ok(Math.abs(v) <= 12, id);
  }
});

// ───────────── 前の音 ─────────────
// 第76回までの schedule() の 中みを そのまま 写した もの（くらべる ため）
// （第77回 B で 作りなおした 曲は、前の データ legacy の テンポと チャンネルで くらべる）
function oldSchedule(tr, until, t0) {
  const L = tr.legacy?.ch ? tr.legacy : tr;
  const spb = 60 / (L.bpm || tr.bpm) / 4;
  const out = [];
  const chans = L.ch.map((c) => ({ ...c, seq: _parse(c.n), i: 0, t: t0 }));
  for (const ch of chans) {
    while (ch.t < until) {
      if (ch.i >= ch.seq.length) {
        if (tr.once) break;
        ch.i = 0;
      }
      const n = ch.seq[ch.i++];
      const dur = n.len * spb;
      if (ch.drums) { if (n.drum) out.push({ kind: 'ld', d: n.drum, t: ch.t, v: ch.v }); }
      else if (n.f) out.push({ kind: 'ln', f: n.f, t: ch.t, dur, w: ch.w, v: ch.v });
      ch.t += dur;
    }
  }
  return out;
}

test('第77回: 前の音は 第76回までと 同じ 音を 同じ 時間に 予約する（ぜんぶの 曲）', () => {
  for (const [id, tr] of Object.entries(_TRACKS)) {
    const { eng, log } = spyEngine({ mode: 'old' });
    eng.start(id, tr, 0.08);
    eng.pump(40);
    assert.deepEqual(log, oldSchedule(tr, 40, 0.08), id);
  }
});

test('第77回: 前の音の 1音・たいこの 作り方は 第76回までと 同じ（エンベロープ・波・フィルター）', () => {
  const s = src('music-engine.js');
  for (const line of [
    "if (wave === 'pulse') o.setPeriodicWave(this.pulseWave);",
    "else o.type = wave === 'saw' ? 'sawtooth' : wave || 'square';",
    'const len = Math.max(0.05, dur * 0.92);',
    'g.gain.linearRampToValueAtTime(vol, t + 0.01);',
    "g.gain.setTargetAtTime(vol * (wave === 'triangle' ? 0.8 : 0.55), t + 0.02, 0.08);",
    'g.gain.setTargetAtTime(0, t + len - 0.03, 0.02);',
    'lp.frequency.value = 1400;',
    'o.frequency.exponentialRampToValueAtTime(40, t + 0.12);',
    "f.frequency.value = kind === 'h' ? 7000 : 1800;",
    "g.gain.setValueAtTime(vol * (kind === 'h' ? 0.25 : 0.45), t);",
  ]) assert.ok(s.includes(line), line);
  // 前の音は 仕上げ（コンプ・残きょう）を 通らない（音量の ノードへ じかに）
  const ctx = new FakeCtx();
  const dest = ctx.createGain();
  const eng = new MusicEngine(ctx, dest, { mode: 'old', offline: true });
  eng.start('battle', _TRACKS.battle, 0);
  assert.equal(eng.bus, null);
  assert.ok(eng.player.m.out.outs.includes(dest));
  // 前の音では 環境音も 鳴らない
  eng.playAmbience('waves');
  assert.equal(eng.amb, null);
});

test('第77回: GameAudio は AudioContext が なくても こわれない（node）・音楽の 音と 重さを おぼえる', () => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); } };
  try {
    const g = new GameAudio();
    assert.equal(g.engineMode, 'new');
    assert.equal(g.quality, 'fine');
    g.unlock();
    g.play('battle');
    assert.equal(g.pending, 'battle');
    g.setIntensity(0.4);
    g.setPinch(true);
    g.setPhase(1);
    g.setTimeOfDay('night');
    g.playAmbience('waves');
    g.blip('タロウ');
    g.stopAmbience();
    g.schedule();
    g.setEngineMode('old');
    g.setQuality('light');
    assert.deepEqual(JSON.parse(store.kizuna_audio), { engine: 'old', quality: 'light' });
    const g2 = new GameAudio();
    assert.equal(g2.engineMode, 'old');
    assert.equal(g2.quality, 'light');
    // 聞いた 曲
    g2.placeOf = () => '冒険の野原';
    g2.markHeard('field');
    g2.markHeard('field');
    assert.deepEqual(g2.heardTracks(), { field: '冒険の野原' });
  } finally {
    delete globalThis.localStorage;
  }
});

test('第77回: 音を 本当に 落とした ときだけ 自動で「かるい」に（はじめの 10びょうは 見ない・設定は かえない）', () => {
  const g = new GameAudio();
  const eng = { lateBars: 0, dropped: 0, q: null, setQuality(q) { this.q = q; } };
  g.engine = eng;
  g.watchLate();
  // 読みこみ中（はじめの 10びょう）の 落としは 数えない
  for (let i = 0; i < 6; i++) { eng.dropped++; g.watchLate(); }
  assert.equal(g.autoLight, false);
  g.startedAt -= 20000;
  // 落とさない うちは 何も しない
  for (let i = 0; i < 50; i++) g.watchLate();
  assert.equal(g.autoLight, false);
  for (let i = 0; i < 3; i++) { eng.dropped++; g.watchLate(); }
  assert.equal(g.autoLight, false);
  eng.lateBars++;
  g.watchLate();
  assert.equal(g.autoLight, true);
  assert.equal(eng.q, 'light');
  assert.equal(g.quality, 'fine', '設定は かえない');
});

test('第77回: 本物に にた ctx で 新しい音を 鳴らしても こわれない（1音の オシレーターは 2つまで・かるい は 重ね なし）', () => {
  for (const quality of ['fine', 'light']) {
    const ctx = new FakeCtx();
    const eng = new MusicEngine(ctx, ctx.destination, { quality, offline: true });
    for (const id of ['battle', 'c8b_temple', 'victory', 'levelup', 'sea']) {
      eng.start(id, _TRACKS[id], 0);
      eng.pump(20);
    }
    eng.adaptive.setPinch(true);
    eng.adaptive.setTimeOfDay('night');
    eng.start('boss', _TRACKS.boss, 30);
    eng.pump(40);
    for (const a of AMBIENCES) {
      eng.playAmbience(a);
      eng.pump(45);
    }
    eng.stopAmbience();
    const convs = ctx.made.filter((n) => n.kind === 'conv').length;
    assert.equal(convs, quality === 'light' ? 0 : 1, '残きょうは 1つだけ（かるい では なし）');
    // 1音: osc の 数（FM の ベルは 2つ、かるい の ユニゾンは 1つ）
    const v = new FakeCtx();
    const e2 = new MusicEngine(v, v.destination, { quality, offline: true });
    for (const k of INSTRUMENT_NAMES) {
      const before = v.made.length;
      e2.voice(440, 0, 1, k, 0.1, v.destination, { light: quality === 'light', legacyW: 'pulse' });
      const made = v.made.slice(before);
      const oscs = made.filter((n) => n.kind === 'osc').length;
      assert.ok(oscs >= 1 && oscs <= 2, `${k}: ${oscs}`);
      assert.ok(made.length <= 5, `${k}: ノード ${made.length}`);
      if (quality === 'light' && INSTRUMENTS[k].osc2 && !INSTRUMENTS[k].osc2.oct) assert.equal(oscs, 1, k);
    }
  }
});

test('第77回: 会話の 文字の 音は 名前で 高さが きまる', () => {
  assert.equal(blipFreq('タロウ'), blipFreq('タロウ'));
  const fs = new Set(['タロウ', 'ハナコ', 'おとうさん', 'おかあさん', 'ノクト', 'アステル'].map(blipFreq));
  assert.ok(fs.size >= 3);
  for (const f of fs) assert.ok(f >= 500 && f <= 1700, f);
});

// ───────────── 音楽を聞く ─────────────
test('第77回 D: 曲の 名前は ぜんぶの 曲に あって、ゲームの 字の きまりに あう', () => {
  assert.equal(TRACK_IDS.length, Object.keys(_TRACKS).length);
  for (const id of TRACK_IDS) {
    assert.ok(TRACK_NAMES[id], `名前が ない: ${id}`);
    assert.deepEqual(checkText(TRACK_NAMES[id]).filter((p) => p.kind !== 'kana'), [], id);
  }
  for (const id of Object.keys(TRACK_NAMES)) assert.ok(_TRACKS[id], `曲が ない: ${id}`);
  assert.equal(new Set(Object.values(TRACK_NAMES)).size, Object.keys(TRACK_NAMES).length, '名前が かさならない');
  // 名前の ない 曲は 聞いた 場所の 名前
  assert.equal(trackName('new_song', { new_song: '星の塔' }), '星の塔');
  assert.equal(trackName('new_song'), 'new_song');
  for (const a of AMBIENCES) assert.ok(AMBIENCE_NAMES[a], a);
  const files = gameFiles().map((f) => f.replace(/\\/g, '/'));
  for (const f of ['audio-names.js', 'ui/soundtest.js', 'music-engine.js', 'music-amb.js']) assert.ok(files.some((x) => x.endsWith(`client/${f}`)), f);
});

test('第77回 D: 設定に「音楽の音」「音の重さ」「音楽を聞く」・音楽を聞くの 中み', () => {
  const m = src('ui/menu.js');
  assert.match(m, /音楽の音：\$\{g\.audio\.engineMode === 'old' \? '前の音' : '新しい音'\}/);
  assert.match(m, /音の重さ：/);
  assert.match(m, /label: '音楽を聞く', value: 'soundtest'/);
  assert.match(m, /openSoundTest\(g\)/);
  const s = src('ui/soundtest.js');
  for (const w of ['新しい音', '前の音', '強さ', 'ピンチ', 'だん', '昼と夜', 'まわりの音', '曲（', '/${TRACK_IDS.length}曲']) assert.ok(s.includes(w), w);
  // 聞いた 曲だけ
  assert.match(s, /TRACK_IDS\.filter\(\(id\) => id in heard\(\)\)/);
  // とじると 場面の 音楽を もとに もどす
  assert.match(s, /au\.adaptive\.byTrack\.clear\(\)/);
  assert.match(s, /au\.autoResume = before\.autoResume/);
});
