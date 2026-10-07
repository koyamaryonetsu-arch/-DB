// 第4章の たたかいの しかけ（battle.js・ai.js から よぶ。ほかの たたかいは かわらない）
//
// ・まぼろしの分身（Step 5 の 大臣ザイード。Step 7 の モルガナでも 使える）
//   おなじ しゅるいの 魔物が 2体いじょう いて、その しゅるいに mirage が ある とき、1体だけが 本物（shade … 足もとに 小さな 影）、
//   のこりは 分身（clone）。3体とも 名前も すがたも おなじ（A・B・C は ならびの じゅん）
//   ・分身に 攻撃・呪文・特技が 当たると「まぼろしだった！」と 消える（たおした ことには ならない。経験値も ない）。
//     そのたびに 本物の「まぼろしのわらい」で、当てた 人の MPが へる
//   ・分身は 本物より 弱い 攻撃しか しない（mirage.cloneAtk・cloneActions）。HPは 本物と おなじに 見せる
//   ・本物は、分身が 消えてから mirage.cycle 回 動くと、まぼろしを 作りなおす（分身が もどり、3体の ならびが いれかわる）。
//     もどる 1つ前の 番に 前ぶれ（空気が ゆらゆら）
//   ・月の鏡（道具の コマンド。パーティーが 持っている）: 分身が ぜんぶ 消え、本物は つぎの 番 動けない（まぶしい）。
//     本物が mirage.mirror 回 動くまで、鏡の 光は もどらない（「3ターンに1回」）
//   ・本物が たおれると、分身も 消える
// ・そうびしたまま 使える 道具（items の equipUse。魔神のランプ）: 道具の コマンドで 1回の たたかいに 1回 使える
import { MONSTERS } from './data/monsters.js?v=140b3d4eb1e5';
import { ITEMS } from './data/items.js?v=140b3d4eb1e5';

export const MIRROR_ID = 'moon_mirror';
const LETTERS = 'ABCDEFGH';

// ───────────── まぼろしの分身 ─────────────
// たたかいの はじめ（Battle の constructor）。分身の いる たたかいなら b.mirage を 作る
export function setupMirage(b) {
  const groups = new Map();
  for (const e of b.enemies) {
    if (!MONSTERS[e.species]?.mirage) continue;
    if (!groups.has(e.species)) groups.set(e.species, []);
    groups.get(e.species).push(e);
  }
  const list = [...groups.values()].find((g) => g.length >= 2);
  if (!list) return;
  const conf = MONSTERS[list[0].species].mirage;
  const real = b.rng.pick(list);
  real.shade = true;
  for (const e of list) {
    if (e === real) continue;
    e.clone = true;
    e.atk = Math.round(e.atk * (conf.cloneAtk ?? 0.5));
    e.actions = (conf.cloneActions || [{ w: 1, id: 'attack' }]).map((a) => ({ ...a }));
  }
  b.mirage = {
    species: list[0].species, real: real.id, clones: list.filter((e) => e !== real).map((e) => e.id),
    // cycle … 分身が 消えてから もどるまでの 本物の 番。mirror … 月の鏡の 光が もどるまでの 本物の 番。cd … のこり
    cycle: conf.cycle ?? 3, count: 0, mirror: conf.mirror ?? 3, cd: 0, laugh: conf.laugh || [10, 16],
  };
  if (conf.intro) b.emit({ t: 'msg', lines: conf.intro.slice(), dur: 1500 });
}

const cloneList = (b) => (b.mirage ? b.mirage.clones.map((id) => b.get(id)).filter(Boolean) : []);

// 消える（たおれた ことには しない。killed に 入れない）
function vanish(b, t) {
  Object.assign(t, {
    alive: false, hp: 0, ready: false, queued: false, defending: false, cover: null,
    status: {}, buffs: {}, debuffs: {}, telegraph: null, stance: null, chant: null,
  });
  b.queue = b.queue.filter((q) => q.id !== t.id);
}

// 分身に 当たった（c … 当てた 人）。消えたら true（その 当たりは そこで おしまい）
// battle.js の physHit・magicHit・damage・tryStatus・applyDebuff・trySteal・banish・drainMp の はじめで よぶ
export function mirageHit(b, c, t, ev) {
  if (!t?.clone || !t.alive || !b.mirage || !c || c.side === t.side) return false;
  vanish(b, t);
  ev.lines.push(`まぼろしだった！${t.name}は、すうっと消えた…！`);
  (ev.results = ev.results || []).push({ id: t.id, vanish: true });
  ev.upd.push(t);
  laugh(b, c, ev);
  return true;
}

// まぼろしの わらい: 当てた 人の MPが へる（1回の 行動で いくつ 消しても、ことばは 1回。へる MPは 消した 数だけ）
function laugh(b, c, ev) {
  const real = b.get(b.mirage.real);
  // 合体技の 2人の 力を 合わせた かげ（battle.js の dualProxy）でも、ほんとうの 人の MPを へらす
  const who = b.get(c.id) || c;
  if (!real?.alive || who.side !== 'ally') return;
  const [mn, mx] = b.mirage.laugh;
  const d = Math.min(who.mp, b.rng.int(mn, mx));
  who.mp -= d;
  ev.upd.push(who);
  const L = ev.laugh || (ev.laugh = {});
  L[who.id] = (L[who.id] || 0) + d;
  const text = (id, n) => {
    const w = b.get(id);
    return n > 0 ? `まぼろしのわらい！${w.name}のMPが${n}へった！` : `まぼろしのわらい！…しかし${w.name}のMPは、もうない。`;
  };
  ev.postLines = ev.postLines || [];
  if (!ev.laughAt) {
    ev.postLines.push(`どこからか、${MONSTERS[b.mirage.species].laughBy || 'わらい声'}がひびく…「フハハハ…！」`);
    ev.laughAt = {};
  }
  if (ev.laughAt[who.id] === undefined) {
    ev.laughAt[who.id] = ev.postLines.length;
    ev.postLines.push(text(who.id, L[who.id]));
  } else ev.postLines[ev.laughAt[who.id]] = text(who.id, L[who.id]);
}

// kill() の はじめ: 分身は 消える（たおした ことに ならない）。消えた ときの ことば（分身で なければ null）
export function mirageVanish(b, t, ev) {
  if (!t.clone) return null;
  vanish(b, t);
  if (ev) ev.upd.push(t);
  return [`まぼろしだった！${t.name}は、すうっと消えた…！`];
}

// 本物が たおれた: 分身も みんな 消える（kill() の おわりで よぶ。ことばの ならび）
export function mirageDown(b, t, ev) {
  if (!b.mirage || t.id !== b.mirage.real) return [];
  const gone = cloneList(b).filter((x) => x.alive);
  for (const x of gone) {
    vanish(b, x);
    if (ev) ev.upd.push(x);
  }
  return gone.length ? ['まぼろしの分身も、砂になって消えていった…！'] : [];
}

// 本物の HPが かわった: 分身の HPも おなじに 見せる（どれが 本物か、HPでは 分からない）
export function mirageSync(b, t) {
  if (!t.shade || !b.mirage) return;
  for (const x of cloneList(b)) if (x.alive) x.hp = t.hp;
}

// 魔物の 番の はじめ（ai.js の decideMonster）。本物の 番なら、まぶしくて 動けない・まぼろしを 作りなおす（ほかは null）
export function mirageAction(b, m) {
  const M = b.mirage;
  if (!M || m.id !== M.real) return null;
  const cur = b.cur;
  if (M.cd > 0) M.cd--;
  if (cur) cur.mirror = M.cd;
  const missing = cloneList(b).some((x) => !x.alive);
  if (missing) M.count++;
  // つぎの 番に まぼろしが もどる: 前ぶれ（月の鏡を 使う じゅんびを する じかん）
  const hint = () => {
    if (missing && M.count + 1 >= M.cycle && cur) cur.postLines = (cur.postLines || []).concat(`（${m.name}のまわりの空気が、ゆらゆらとゆれ始めた…）`);
  };
  // 月の鏡で まぶしい 番は、何も できない（まぼろしを 作りなおすのも つぎの 番）
  if (m.dazzled) {
    m.dazzled = false;
    hint();
    return { type: 'ability', id: 'm_mirage_dazzled' };
  }
  if (missing && M.count >= M.cycle) {
    M.count = 0;
    return { type: 'ability', id: MONSTERS[m.species].mirage.remake };
  }
  hint();
  return null;
}

// まぼろしを 作りなおす（技の 効果 { type: 'mirage' }。battle.js の applyAbility）
export function mirageRemake(b, c, ev) {
  const M = b.mirage;
  if (!M || c.id !== M.real) {
    ev.lines.push('しかし、何も起こらなかった…。');
    return;
  }
  const clones = cloneList(b);
  for (const x of clones) {
    if (x.alive) continue;
    Object.assign(x, { alive: true, hp: c.hp, maxHp: c.maxHp, ready: false, queued: false, status: {}, buffs: {}, debuffs: {}, telegraph: null, stance: null, chant: null });
    x.atb = b.rng.float(0, 30);
  }
  // ならびを いれかえる（本物が どこに いるか 分からなく なる）。名前の A・B・C は 左からの じゅん
  const group = [c, ...clones];
  const slots = group.map((x) => x.slot).sort((p, q) => p - q);
  b.rng.shuffle(group).forEach((x, i) => {
    x.slot = slots[i];
    x.letter = LETTERS[i];
    x.name = x.baseName + x.letter;
  });
  ev.lines.push(`${MONSTERS[M.species].name}は、まぼろしを作り出した！`, `${group.length}人の${MONSTERS[M.species].name}が、すばやく入れかわった…！`);
  ev.fx = { type: 'ability', anim: 'mirage', actor: c.id, targets: group.map((x) => x.id), side: c.side, mirage: true };
  ev.warn = true;
  for (const x of group) ev.upd.push(x);
}

// ───────────── 月の鏡 ─────────────
// 使えるか（validate）
export function mirrorCheck(b) {
  const M = b.mirage;
  if (!M) return { ok: false, reason: '今は使えない' };
  if (M.cd > 0) return { ok: false, reason: `月の鏡の光が、まだもどっていない…（あと${M.cd}）` };
  return { ok: true };
}

export function useMirror(b, c, ev) {
  ev.name = ITEMS[MIRROR_ID]?.name || '月の鏡';
  ev.lines.push(`${c.name}は、月の鏡を高くかかげた！`);
  const M = b.mirage;
  if (!M || M.cd > 0) {
    ev.lines.push('しかし、鏡の光は、まだ弱い…。');
    return;
  }
  ev.lines.push('月の光が、あたりをてらした…！');
  M.cd = M.mirror;
  ev.mirror = M.cd;
  const gone = cloneList(b).filter((x) => x.alive);
  ev.results = ev.results || [];
  for (const x of gone) {
    vanish(b, x);
    ev.upd.push(x);
    ev.results.push({ id: x.id, vanish: true });
  }
  if (gone.length) ev.lines.push(gone.length > 1 ? 'まぼろしの分身が、すべて消えた！' : 'まぼろしの分身が消えた！');
  else ev.lines.push('…まぼろしは、どこにもいない。');
  const real = b.get(M.real);
  if (real?.alive) {
    // つぎの 番は まぶしくて 動けない（もう ならんで いる 行動も とりやめ）
    real.dazzled = true;
    b.queue = b.queue.filter((q) => q.id !== real.id);
    real.queued = false;
    ev.lines.push(`${real.name}は、まぶしそうに目をおおった！`);
    ev.upd.push(real);
  }
  ev.fx = { type: 'mirror', actor: c.id, targets: [...gone.map((x) => x.id), ...(real?.alive ? [real.id] : [])], side: 'ally' };
}

// まぼろしを 知っている 人（tools/sim.js の「知っている人」。b.knowsMirage）: 月の鏡の コマンド（使わない ときは null）
export function mirrorPlan(b) {
  const M = b.mirage;
  if (!M || M.cd > 0) return null;
  const real = b.get(M.real);
  if (!real?.alive || real.dazzled) return null;
  return { type: 'item', id: MIRROR_ID };
}

// ───────────── そうびしたまま 使える 道具（魔神のランプ）─────────────
export function equipUseCheck(c, id) {
  if (c.acc !== id) return { ok: false, reason: '装備していない' };
  if ((c.equipUsed || []).includes(id)) return { ok: false, reason: 'この戦いでは、もう使った' };
  return { ok: true };
}

function useEquip(b, c, cmd, ev) {
  const it = ITEMS[cmd.id];
  const u = it.equipUse;
  ev.name = it.name;
  ev.lines.push(`${c.name}は${it.name}を使った！`);
  if (!equipUseCheck(c, cmd.id).ok) {
    ev.lines.push('しかし、何も起こらなかった！');
    return;
  }
  c.equipUsed = [...(c.equipUsed || []), cmd.id];
  if (u.msg) ev.lines.push(u.msg);
  const targets = b.sideOf(c, true).filter((x) => x.alive);
  ev.fx = { type: 'item', actor: c.id, targets: targets.map((x) => x.id), side: 'ally', anim: 'heal1' };
  for (const t of targets) {
    const d = Math.min(t.maxMp - t.mp, b.rng.int(u.base[0], u.base[1]));
    t.mp += d;
    ev.lines.push(d > 0 ? `${t.name}のMPが${d}回復した！` : `${t.name}のMPは満タンだ。`);
    ev.upd.push(t);
  }
  ev.upd.push(c);
}

// ───────────── 道具の コマンド（battle.js の validate・useItem の はじめ）─────────────
// 第4章の とくべつな 道具なら { ok, reason }（ほかは null で、ふつうの 道具の きまり）
export function ch4ItemCheck(b, c, id) {
  if (id === MIRROR_ID) return mirrorCheck(b);
  if (ITEMS[id]?.equipUse) return equipUseCheck(c, id);
  return null;
}

// 第4章の とくべつな 道具を 使った（ふつうの 道具なら false）
export function ch4UseItem(b, c, cmd, ev) {
  if (cmd.id === MIRROR_ID) {
    useMirror(b, c, ev);
    return true;
  }
  if (ITEMS[cmd.id]?.equipUse) {
    useEquip(b, c, cmd, ev);
    return true;
  }
  return false;
}

// クライアントへ おくる 月の鏡の ようす（まぼろしの いない たたかいは null）
export function mirrorSnap(b) {
  return b.mirage ? { cd: b.mirage.cd, max: b.mirage.mirror } : null;
}
