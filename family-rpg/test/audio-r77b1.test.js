// 第77回 B1: 作りなおした 戦いの 曲（battle・battle2・battle_strong・boss）と 勝利の ジングル（victory）
//   区切りの 長さ・ひとまわりの 秒・前の音・強拍で メロディと ベースが ぶつからない・音の 高さ・名前・前の 動機
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { _TRACKS, _parse, TRACK_IDS } from '../public/js/client/audio.js';
import { R77A_TRACKS } from '../public/js/client/audio-r77a.js';
import { compileTrack, legacyChannels, midiOf, parseNotes, formWalk } from '../public/js/client/music-engine.js';
import { INSTRUMENTS } from '../public/js/client/music-inst.js';
import { TRACK_NAMES } from '../public/js/client/audio-names.js';
import { checkText } from '../tools/kanji-check.mjs';

const LOOPS = ['battle', 'battle2', 'battle_strong', 'boss'];
const ALL = [...LOOPS, 'victory'];
// 前の データ（第76回まで）の bpm
const OLD_BPM = { battle: 152, boss: 164, victory: 144 };
const BPM_RANGE = { battle: [160, 168], battle2: [168, 176], battle_strong: [150, 160], boss: [165, 200] };

const secs = (steps, bpm) => (steps * 60) / bpm / 4;
const midis = (e) => (e.fs || (e.f ? [e.f] : [])).map((f) => Math.round(midiOf(f)));
// 1つの パートの 時間の ならび（[はじめ, 長さ, 音の 高さ…]）
function timeline(events) {
  let at = 0;
  return events.map((e) => {
    const x = { at, len: e.len, ms: e.drum ? [] : midis(e), drum: e.drum };
    at += e.len;
    return x;
  });
}
const noteAt = (tl, step) => tl.find((x) => x.at <= step && step < x.at + x.len);

test('第77回 B1: 5曲が 区切り（parts・sections・form）で 書いて あり、ほかの 曲と 同じ ように ある', () => {
  for (const id of ALL) {
    const tr = _TRACKS[id];
    assert.ok(tr && R77A_TRACKS[id], id);
    assert.ok(Array.isArray(tr.parts) && tr.sections && tr.form, `${id}: parts・sections・form`);
    assert.ok(TRACK_IDS.includes(id), id);
    const melodic = tr.parts.filter((p) => !p.drums);
    assert.ok(melodic.length <= 5, `${id}: メロディックな パートは 5つまで`);
    assert.equal(tr.parts.filter((p) => p.drums).length, 1, `${id}: たいこは 1つ`);
    for (const p of melodic) assert.ok(INSTRUMENTS[p.i], `${id}: 楽器 ${p.i}`);
    const c = compileTrack(tr);
    assert.equal(c.bar, 16, id);
    assert.equal(c.parts[0].role, 'lead', `${id}: さいしょの パートが メロディ`);
    assert.equal(c.parts.filter((p) => p.role === 'bass').length, 1, `${id}: ベースが 1つ`);
  }
  assert.equal(_TRACKS.victory.once, true);
  for (const id of LOOPS) {
    assert.equal(_TRACKS[id].form[0], 'intro', id);
    assert.equal(_TRACKS[id].loopFrom, 1, `${id}: イントロは 1回だけ`);
    const c = compileTrack(_TRACKS[id]);
    const walk = formWalk(c, c.form.length * 2).map(([nm]) => nm);
    assert.equal(walk.filter((nm) => nm === 'intro').length, 1, id);
  }
});

test('第77回 B1: 区切りごとに 全チャンネルが 同じ 長さで 小節の 倍数・ひとまわり 60〜90秒・テンポ', () => {
  for (const id of ALL) {
    const c = compileTrack(_TRACKS[id]);
    for (const nm of c.form) {
      const s = c.segs[nm];
      assert.equal(s.steps % c.bar, 0, `${id} ${nm}: 小節の 倍数`);
      s.parts.forEach((p, i) => {
        const len = p.reduce((a, e) => a + e.len, 0);
        // null（やすみ）の パートは 0。それ以外は みな 同じ 長さ
        assert.ok(len === 0 || len === s.steps, `${id} ${nm} パート${i}: ${len} / ${s.steps}`);
      });
      assert.ok(s.parts[0].length > 0, `${id} ${nm}: メロディが ある`);
    }
  }
  for (const id of LOOPS) {
    const c = compileTrack(_TRACKS[id]);
    const loop = c.form.slice(c.loopFrom).reduce((a, nm) => a + c.segs[nm].steps, 0);
    const sec = secs(loop, c.bpm);
    assert.ok(sec >= 60 && sec <= 90, `${id}: ひとまわり ${sec.toFixed(1)}びょう`);
    const [lo, hi] = BPM_RANGE[id];
    assert.ok(c.bpm >= lo && c.bpm <= hi, `${id}: bpm ${c.bpm}`);
  }
  assert.ok(_TRACKS.boss.bpm > OLD_BPM.boss, 'ボスは 前より 速い');
  // 勝利: 長さは 前の ±10%
  const v = _TRACKS.victory;
  const oldSteps = _parse(v.legacy.ch[0].n).reduce((a, n) => a + n.len, 0);
  const oldSec = secs(oldSteps, v.legacy.bpm);
  const c = compileTrack(v);
  const newSec = secs(c.segs.main.steps, c.bpm);
  assert.ok(Math.abs(newSec / oldSec - 1) <= 0.1, `victory ${newSec.toFixed(2)} / 前 ${oldSec.toFixed(2)} びょう`);
});

test('第77回 B1: 「前の音」では 前の データが 鳴る（battle2・battle_strong は 前の battle）', () => {
  for (const id of ['battle', 'boss', 'victory']) {
    const lc = legacyChannels(_TRACKS[id]);
    assert.equal(lc.bpm, OLD_BPM[id], id);
    assert.equal(lc.ch, _TRACKS[id].legacy.ch, id);
    for (const ch of lc.ch) for (const tok of ch.n.trim().split(/\s+/)) assert.match(tok, ch.drums ? /^[kshr]:\d+$/ : /^(r|[A-G][#b]?\d):\d+$/, `${id}: 前の 書き方`);
  }
  for (const id of ['battle2', 'battle_strong']) {
    const lc = legacyChannels(_TRACKS[id]);
    assert.deepEqual(lc, legacyChannels(_TRACKS.battle), id);
    // 古い テスト用の ch は 自分の 楽譜（メロディが battle と かさならない）
    assert.notEqual(_TRACKS[id].ch[0].n, _TRACKS.battle.ch[0].n, id);
  }
  // 前の battle の メロディの 頭（第76回まで と 同じ）
  assert.match(legacyChannels(_TRACKS.battle).ch[0].n, /^E5:2 E5:2 B4:2 E5:2 G5:2 F#5:2 E5:2 B4:2 /);
});

test('第77回 B1: 強拍（1拍目・3拍目）で メロディと ベースが ぶつからない（短2度・増4度・長7度が 15% より 少ない）', () => {
  for (const id of ALL) {
    const c = compileTrack(_TRACKS[id]);
    const li = c.parts.findIndex((p) => p.role === 'lead');
    const bi = c.parts.findIndex((p) => p.role === 'bass');
    let n = 0;
    let bad = 0;
    for (const nm of new Set(c.form)) {
      const s = c.segs[nm];
      const L = timeline(s.parts[li]);
      const B = timeline(s.parts[bi]);
      for (let st = 0; st < s.steps; st += c.bar / 2) {
        const a = noteAt(L, st);
        const b = noteAt(B, st);
        if (!a?.ms.length || !b?.ms.length) continue;
        n++;
        const iv = (((a.ms[0] - b.ms[0]) % 12) + 12) % 12;
        if (iv === 1 || iv === 6 || iv === 11) bad++;
      }
    }
    assert.ok(n >= 4, id);
    assert.ok(1 - bad / n >= 0.85, `${id}: ぶつからない ${((1 - bad / n) * 100).toFixed(0)}%`);
  }
});

test('第77回 B1: 音の 高さが 楽器の 出せる 中（メロディ・ベース・ハーモニー）', () => {
  const RANGE = { lead: [55, 93], bass: [28, 55], harmony: [45, 100] };
  for (const id of ALL) {
    const c = compileTrack(_TRACKS[id]);
    for (const nm of Object.keys(c.segs)) {
      c.segs[nm].parts.forEach((evs, i) => {
        const p = c.parts[i];
        if (p.drums) return;
        const [lo, hi] = RANGE[p.role];
        for (const e of evs) for (const m of midis(e)) assert.ok(m >= lo && m <= hi, `${id} ${nm} ${p.role}: ${m}`);
      });
    }
    // ボスの いちばん 上の だんでも メロディは 高すぎない（A6 = 93 まで）
    if (_TRACKS[id].phases) {
      const top = Math.max(..._TRACKS[id].phases.map((ph) => ph.transpose));
      const hi = Math.max(...Object.values(c.segs).flatMap((s) => s.parts[0].flatMap(midis)));
      assert.ok(hi + top <= 94, `${id}: だん ${top} で ${hi + top}`);
    }
  }
});

test('第77回 B1: ねむく ならない（アクセント・ゴースト・スタッカート・和音・区切りごとに ちがう）', () => {
  for (const id of LOOPS) {
    const tr = _TRACKS[id];
    const all = Object.values(tr.sections).flat().filter(Boolean).join(' ');
    for (const mark of ['!', '?', '.', '[']) assert.ok(all.includes(mark), `${id}: ${mark}`);
    // 区切りごとに メロディ・ベース・たいこが ちがう
    const names = tr.form.slice(tr.loopFrom);
    for (const i of [0, 1, tr.parts.length - 1]) {
      const seen = new Set(names.map((nm) => tr.sections[nm][i]));
      assert.equal(seen.size, names.length, `${id}: パート${i} が 区切りごとに ちがう`);
    }
    // ベースは 8分 か 16分で 動く（ループの 中の 音の 半分 以上が 長さ 2 いか）
    const c = compileTrack(tr);
    const bi = c.parts.findIndex((p) => p.role === 'bass');
    const bassEv = names.flatMap((nm) => c.segs[nm].parts[bi]).filter((e) => e.f);
    assert.ok(bassEv.filter((e) => e.len <= 2).length / bassEv.length >= 0.5, `${id}: ベースが 動く`);
    // たいこの 型: 区切りの 中で 2しゅるい 以上の 小節
    const di = c.parts.findIndex((p) => p.drums);
    for (const nm of names) {
      const tl = timeline(c.segs[nm].parts[di]);
      const bars = new Set();
      for (let b = 0; b < c.segs[nm].steps / 16; b++) bars.add(tl.filter((x) => x.at >= b * 16 && x.at < b * 16 + 16).map((x) => `${x.at % 16}${x.drum}`).join());
      assert.ok(bars.size >= 2 || c.fill, `${id} ${nm}: たいこの 型`);
    }
    assert.ok(tr.fill, `${id}: fill`);
    // B（サビ）が いちばん 厚い（なる パートが いちばん 多い）
    const busy = (nm) => c.segs[nm].parts.filter((p) => p.length).length;
    for (const nm of names) assert.ok(busy('B') >= busy(nm), `${id}: B が いちばん 厚い（${nm}）`);
  }
});

test('第77回 B1: 前の 動機を 生かす（battle・boss・victory の メロディの 頭）・battle2 と battle_strong も 同じ 頭の 型', () => {
  const head = (n, k) => parseNotes(n).filter((e) => e.f).slice(0, k).map((e) => Math.round(midiOf(e.f)));
  const lead = (id, nm) => compileTrack(_TRACKS[id]).segs[nm].parts[0].filter((e) => e.f).map((e) => Math.round(midiOf(e.f)));
  assert.deepEqual(lead('battle', 'A').slice(0, 8), head(_TRACKS.battle.legacy.ch[0].n, 8));
  assert.deepEqual(lead('boss', 'A').slice(0, 4), head(_TRACKS.boss.legacy.ch[0].n, 4));
  assert.deepEqual(lead('victory', 'main').slice(0, 3), head(_TRACKS.victory.legacy.ch[0].n, 3));
  // 「同じ 音 2つ → 4度 下 → もとの 音」の 頭（battle と 同じ 世界の 曲）
  for (const id of ['battle', 'battle2', 'battle_strong']) {
    const [a, b, c2, d] = lead(id, 'A');
    assert.deepEqual([b - a, c2 - a, d - a], [0, -5, 0], id);
  }
  // キーは ぜんぶ ちがう（A の はじめの ベース: battle ミ・battle2 ソ・battle_strong ド・boss レ）
  const key = (id) => {
    const c = compileTrack(_TRACKS[id]);
    const e = c.segs.A.parts[c.parts.findIndex((p) => p.role === 'bass')].find((x) => x.f);
    return Math.round(midiOf(e.f)) % 12;
  };
  assert.deepEqual(LOOPS.map(key), [4, 7, 0, 2]);
});

test('第77回 B1: ボスの だん（キー・テンポ）と ピンチの 重ね', () => {
  for (const id of LOOPS) {
    const p = _TRACKS[id].pinch;
    assert.ok(p && p.n && INSTRUMENTS[p.i], id);
    const len = parseNotes(p.n).reduce((a, e) => a + e.len, 0);
    assert.equal(len % 16, 0, `${id}: ピンチは 小節の 倍数`);
  }
  const ph = _TRACKS.boss.phases;
  assert.equal(ph.length, 4);
  assert.deepEqual(ph[0], { transpose: 0, tempo: 1 });
  for (let i = 1; i < ph.length; i++) {
    assert.ok(ph[i].transpose > ph[i - 1].transpose, 'だんで キーが 上がる');
    assert.ok(ph[i].tempo > ph[i - 1].tempo && ph[i].tempo <= 1.15, 'だんで テンポが 少し 上がる');
  }
});

test('第77回 B1: 名前（ネタバレ なし・ゲームの 字の きまり）', () => {
  for (const id of ALL) {
    assert.ok(TRACK_NAMES[id], id);
    assert.deepEqual(checkText(TRACK_NAMES[id]).filter((p) => p.kind !== 'kana'), [], id);
  }
  assert.equal(new Set(Object.values(TRACK_NAMES)).size, Object.keys(TRACK_NAMES).length);
});
