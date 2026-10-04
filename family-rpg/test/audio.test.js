import { test } from 'node:test';
import assert from 'node:assert/strict';
import { _TRACKS, _parse } from '../public/js/client/audio.js';
import { SOUTH_ARRIVE, SOUTH_PLACES, southBgmAt } from '../public/js/shared/maps/south.js';

test('きょくの パートの ながさが そろっている', () => {
  for (const [id, tr] of Object.entries(_TRACKS)) {
    const lens = tr.ch.map((c) => _parse(c.n).reduce((s, n) => s + n.len, 0));
    const bad = _parse(tr.ch[0].n).some((n) => n.f === 0 && n.drum === undefined && n.len === undefined);
    assert.ok(!bad);
    for (const c of tr.ch) for (const n of _parse(c.n)) assert.ok(Number.isFinite(n.len) && n.len > 0, `${id}: bad token`);
    for (const c of tr.ch) if (!c.drums) for (const n of _parse(c.n)) assert.ok(n.f === 0 || n.f > 20, `${id}: bad note`);
    if (!tr.once) assert.ok(lens.every((l) => l === lens[0]), `${id}: ${lens.join(',')}`);
  }
});

// 第3章の きょく（CH3-CONTRACT の ID。マップ・だいほんが つかう）
const CH3_TRACKS = ['snow', 'snowtown', 'mine', 'volcano', 'temple', 'boss3', 'dragon'];

test('第3章の きょく: けいやくの 7きょくが あって、くりかえしても パートが ずれない', () => {
  for (const id of CH3_TRACKS) {
    const tr = _TRACKS[id];
    assert.ok(tr, `${id} が ない`);
    assert.ok(!tr.once, `${id}: くりかえす きょく`);
    assert.ok(tr.bpm >= 60 && tr.bpm <= 200, `${id}: bpm`);
    assert.ok(tr.ch.length >= 3, `${id}: パートが すくない`);
    const lens = tr.ch.map((c) => _parse(c.n).reduce((s, n) => s + n.len, 0));
    assert.ok(lens.every((l) => l === lens[0]), `${id}: ${lens.join(',')}`);
    // 小節の きりの よい ながさ（4/4 は 16、ワルツは 12）で、ほかの きょくと おなじ くらいか ながい
    assert.ok(lens[0] % 16 === 0 || lens[0] % 12 === 0, `${id}: ${lens[0]}`);
    assert.ok(lens[0] >= 128, `${id}: みじかい ${lens[0]}`);
    // どの パートも 音が ある（やすみ だけの パートは ない）
    for (const c of tr.ch) assert.ok(_parse(c.n).some((n) => n.f > 0 || n.drum), `${id}: 音の ない パート`);
  }
  // 第3章の きょくは おたがいに ちがう
  const mel = CH3_TRACKS.map((id) => _TRACKS[id].ch[0].n);
  assert.equal(new Set(mel).size, CH3_TRACKS.length);
});

// 第4章の きょく（コガネ地方の マップが つかう ID。砂ばくの 昼・夜と、オアシスの村ハミル）
const CH4_TRACKS = ['desert', 'desert_night', 'oasis'];

test('第4章の きょく: 砂ばくの 昼・夜と ハミルの 3きょくが あって、くりかえしても パートが ずれない', () => {
  for (const id of CH4_TRACKS) {
    const tr = _TRACKS[id];
    assert.ok(tr, `${id} が ない`);
    assert.ok(!tr.once, `${id}: くりかえす きょく`);
    assert.ok(tr.bpm >= 60 && tr.bpm <= 200, `${id}: bpm`);
    assert.ok(tr.ch.length >= 3 && tr.ch.length <= 4, `${id}: パートの かず`);
    const lens = tr.ch.map((c) => _parse(c.n).reduce((s, n) => s + n.len, 0));
    assert.ok(lens.every((l) => l === lens[0]), `${id}: ${lens.join(',')}`);
    // 小節の きりの よい ながさで、第3章の きょくと おなじ くらいか ながい
    assert.ok(lens[0] % 16 === 0 || lens[0] % 12 === 0, `${id}: ${lens[0]}`);
    assert.ok(lens[0] >= 128, `${id}: みじかい ${lens[0]}`);
    for (const c of tr.ch) assert.ok(_parse(c.n).some((n) => n.f > 0 || n.drum), `${id}: 音の ない パート`);
    // たいこの パートの r は やすみに ならず「s」の 音が 出るので、つかわない
    for (const c of tr.ch) if (c.drums) assert.ok(_parse(c.n).every((n) => n.drum), `${id}: たいこに r が ある`);
  }
  // 第4章の きょくは おたがいに ちがい、第3章の きょくとも ちがう
  const mel = [...CH3_TRACKS, ...CH4_TRACKS].map((id) => _TRACKS[id].ch[0].n);
  assert.equal(new Set(mel).size, mel.length);
  // マップの ID と きょくが つながっている（まちがえると 音が 出ない）
  assert.equal(southBgmAt(SOUTH_ARRIVE.x, SOUTH_ARRIVE.y, false), 'desert');
  assert.equal(southBgmAt(SOUTH_ARRIVE.x, SOUTH_ARRIVE.y, true), 'desert_night');
  assert.equal(SOUTH_PLACES.hamil.bgm, 'oasis');
  for (const p of Object.values(SOUTH_PLACES)) assert.ok(_TRACKS[p.bgm], `${p.name}: ${p.bgm}`);
});

test('きょく: 音の なまえの かきまちがいが ない（まちがえると 音の 出ない やすみに なる）', () => {
  for (const [id, tr] of Object.entries(_TRACKS)) {
    for (const c of tr.ch) {
      for (const tok of c.n.trim().split(/\s+/)) {
        assert.match(tok, c.drums ? /^[kshr]:\d+$/ : /^(r|[A-G][#b]?\d):\d+$/, `${id}: ${tok}`);
      }
    }
  }
});
