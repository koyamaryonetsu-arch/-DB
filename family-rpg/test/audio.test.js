import { test } from 'node:test';
import assert from 'node:assert/strict';
import { _TRACKS, _parse } from '../public/js/client/audio.js';

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
