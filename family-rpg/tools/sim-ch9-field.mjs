// 第92回 B班: ふつうの 戦いの 長さを はかる（docs/plan-part3.md の 11-4）
// 勇者 Lv100（第2幕の ころの ★装備）＋ 酒場の 仲間 3人（ポポロ・リン・ミーナ。ゲームの 酒場と おなじ 作り … world/party.js の makeNpcSupportChar。
//   ものがたりで 入る ときと おなじ 勇者の 1つ下の Lv99・はじめの 職業〈魔法使い・武闘家・僧侶〉・その レベルの 店の 装備）。みんな オート。
//   SUPER=1 … 酒場の 仲間を 転職した 超級職（tools/sim-ch9.mjs の k1npc と おなじ）に する
// ブラウザの はじめの 設定（戦いの 速さ 0.85・文字の 速さ 0.8）で、出る 表の 重みの とおりに むれを えらんで 戦う。長さは えんしゅつの 時間も ふくむ
// 第3部（第1幕から）の 表は スピカが いる（ほのかな光。リーダーが c9_child を 持つ ころ）。てらすは オートでは 使わない
// つかいかた: node tools/sim-ch9-field.mjs [回数] [表,…]   ONLY=sp … その 魔物 1ぴきだけ
//   TAC=… 勇者の 作戦・SUPTAC=… 酒場の 仲間 みんなの 作戦（第96回 T班。ない 時は バッチリがんばれ・その 仲間の 作戦）
// のぞく 魔物（11-4 の 合わせ直しに 入れない）: ボス・くらやみ虫・大ミミズ・大王の 手下（もぐら兵）
import { Battle } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { ENCOUNTER_TABLES, FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { addSpica } from '../public/js/shared/battle-c9a.js';
import { ch9Allies, ch9Party } from './sim-ch9.mjs';
// 第94回: 第2章の ★装備（CH9_KIT.tamagon・mold）を 入れる
import './sim-ch10.mjs';
// 第101回 B班: 第3部 第3章 第1幕の ★装備（CH9_KIT.beast）
import './sim-ch11.mjs';
import { makeNpcSupportChar } from '../public/js/shared/world/party.js';
import { NPC_SUPPORTS } from '../public/js/shared/data/shops.js';

export const FIELD_TABLES = {
  c8r: ['t8r_wing', 't8r_last'],
  c9a: ['t9a_forest', 't9a_b1', 't9a_b2', 't9a_b3', 't9a_b4'],
  c9b: ['t9b_shaft', 't9b_light', 't9b_hall'],
  c9c: ['t9c_river', 't9c_pyr', 't9c_pyr2'],
  // 第93回 B班: 第4幕 ふたごの道（勇者 Lv102・その ころの ★装備 CH9_KIT.mu・酒場の 仲間 Lv101）
  c9d: ['t9d_lane', 't9d_lane2'],
  // 第94回 B班: 第3部 第2章 第1幕 赤（古い 道。勇者 Lv105・CH9_KIT.tamagon）・緑（根の国。勇者 Lv107・CH9_KIT.mold）。tools/sim-ch10.mjs を 読む
  c10a: ['t10r_1', 't10r_2', 't10g_1', 't10g_2'],
  // 第95回 B班: 第3部 第2章 第2幕 青（水鏡の うら。勇者 Lv109・CH9_KIT.gecko）
  c10b: ['t10b_blue_wet', 't10b_blue_dry'],
  // 第97回 B班: 第3部 第2章 第3幕 空の 小島（勇者 Lv113・CH9_KIT.colonel）・少年の とりで（勇者 Lv115・CH9_KIT.algol）
  c10c: ['t10c_isles', 't10c_fort'],
  // 第101回 B班: 第3部 第3章 第1幕 星の海（勇者 Lv118）・星座の 島（Lv119〜120）。CH9_KIT.beast。めやす（17-4）… 超級職 4人で 30〜50秒（SUPER=1）
  c11a: ['t11a_sea', 't11a_isle1', 't11a_isle2', 't11a_isle3'],
};
// 決まった 戦い（見はりに 見つかった 時。白の 道。勇者 Lv111・CH9_KIT.owl。めやす 120秒 いない）。node tools/sim-ch9-field.mjs 20 c10b_watch1,…
export const FIELD_FIXED = { c10b_watch1: ['owl', 111], c10b_watch2: ['owl', 111], c10b_watch3: ['owl', 111] };
// 表ごとの 勇者の ★装備と レベル（ない 表は 第2幕の ころ … king・Lv100）
export const FIELD_HERO = { t9d_lane: ['mu', 102], t9d_lane2: ['mu', 102], t10r_1: ['tamagon', 105], t10r_2: ['tamagon', 105], t10g_1: ['mold', 107], t10g_2: ['mold', 107], t10b_blue_wet: ['gecko', 109], t10b_blue_dry: ['gecko', 109], t10c_isles: ['colonel', 113], t10c_fort: ['algol', 115], t11a_sea: ['beast', 118], t11a_isle1: ['beast', 119], t11a_isle2: ['beast', 119], t11a_isle3: ['beast', 120] };
export const FIELD_SKIP = new Set(['c9a_yamimushi', 'c9b_mimizu', 'c9b_mole_spear', 'c9b_mole_pot', 'c9d_kage']);

function roll(rng, table) {
  const rows = ENCOUNTER_TABLES[table];
  const tot = rows.reduce((s, r) => s + r.w, 0);
  let x = rng.float(0, tot);
  const row = rows.find((r) => (x -= r.w) < 0) || rows[rows.length - 1];
  return row.group.flatMap(([sp, lo, hi]) => Array(rng.int(lo, hi)).fill(sp));
}

export function fieldRun(enemies, seed, { spica = true, speed = 0.85, textSpeed = 0.8, hero = ['king', 100] } = {}) {
  const [kit, lv] = hero;
  const list = process.env.SUPER ? ch9Allies(kit, lv, 'k1npc') : [
    { char: ch9Party(kit, lv).find((c) => c.job === 'hero'), know: true },
    ...['npc_poporo', 'npc_rin', 'npc_mina'].map((id) => ({ char: makeNpcSupportChar(NPC_SUPPORTS.find((n) => n.id === id), lv - 1), know: false })),
  ];
  const allies = list.map((x) => (x.know
    ? { char: x.char, kind: 'player', controller: 'sim', auto: true, tactics: process.env.TAC || 'balanced' }
    : { char: x.char, kind: 'support', auto: true, tactics: process.env.SUPTAC || x.char.tactics || 'balanced' }));
  const b = new Battle({ rng: makeRng(seed), allies, enemies, speed, textSpeed });
  if (spica) addSpica(b);
  let real = 0;
  while (!b.over && real < 15 * 60 * 1000) {
    b.tick(50);
    real += 50;
  }
  return { sec: real / 1000, win: b.result?.outcome === 'win' };
}

// 1つの 表の 長さ（のぞく 魔物が 入った むれは かぞえない）
export function tableLength(table, N = 30, seed0 = 1) {
  const rng = makeRng(seed0 * 977 + table.length);
  const res = [];
  let tries = 0;
  while (res.length < N && tries < N * 20) {
    tries++;
    const g = roll(rng, table);
    if (!g.length || g.some((sp) => FIELD_SKIP.has(sp))) continue;
    const r = fieldRun(g, seed0 * 7919 + tries, { spica: !table.startsWith('t8r'), hero: FIELD_HERO[table] });
    res.push({ ...r, n: g.length, g });
  }
  const wins = res.filter((r) => r.win);
  const avg = wins.reduce((s, r) => s + r.sec, 0) / Math.max(1, wins.length);
  const sorted = wins.map((r) => r.sec).sort((a, b) => a - b);
  return { table, n: res.length, win: wins.length / Math.max(1, res.length), avg, p90: sorted[Math.floor(sorted.length * 0.9)] || 0, max: sorted[sorted.length - 1] || 0 };
}

// 決まった 戦いの 長さ（FIELD_FIXED。むれは 決まって いる）
export function fixedLength(id, N = 30, seed0 = 1) {
  const g = FIXED_ENCOUNTERS[id].group.flatMap(([sp, lo, hi]) => Array(hi ?? lo).fill(sp));
  const res = [...Array(N).keys()].map((i) => fieldRun(g, seed0 * 7919 + i * 13, { hero: FIELD_FIXED[id] }));
  const wins = res.filter((r) => r.win);
  const sorted = wins.map((r) => r.sec).sort((a, b) => a - b);
  return { table: id, n: res.length, win: wins.length / Math.max(1, res.length), avg: wins.reduce((s, r) => s + r.sec, 0) / Math.max(1, wins.length), p90: sorted[Math.floor(sorted.length * 0.9)] || 0, max: sorted[sorted.length - 1] || 0 };
}

if (process.argv[1]?.endsWith('sim-ch9-field.mjs')) {
  const N = Number(process.argv[2] || 20);
  if (process.env.ONLY) {
    const sp = process.env.ONLY;
    const hero = sp.startsWith('c9d_') ? ['mu', 102] : sp.startsWith('c10r_') ? ['tamagon', 105] : sp.startsWith('c10g_') ? ['mold', 107] : sp.startsWith('c10b_') ? (['c10b_iceowl', 'c10b_wolf', 'c10b_armor'].includes(sp) ? ['owl', 111] : ['gecko', 109]) : sp.startsWith('c10c_') ? (['c10c_carrier', 'c10c_mole', 'c10c_lamp', 'c10c_haniwa'].includes(sp) ? ['algol', 115] : ['colonel', 113]) : undefined;
    const res = [...Array(N).keys()].map((i) => fieldRun(sp.startsWith('c9d_') ? [sp, ...(sp === 'c9d_twins' ? [sp] : [])] : [sp], 100 + i * 13, { spica: !sp.startsWith('toki'), hero }));
    const w = res.filter((r) => r.win);
    console.log(`${MONSTERS[sp]?.name || sp} 1ぴき: 平均 ${(w.reduce((s, r) => s + r.sec, 0) / Math.max(1, w.length)).toFixed(0)}秒（勝ち ${w.length}/${N}）`);
  } else {
    const tables = process.argv[3] ? process.argv[3].split(',') : Object.values(FIELD_TABLES).flat();
    for (const t of tables) {
      const r = FIELD_FIXED[t] ? fixedLength(t, N) : tableLength(t, N);
      console.log(`${t.padEnd(11)} ${String(r.n).padStart(3)}回  勝ち ${(r.win * 100).toFixed(0).padStart(3)}%  平均 ${r.avg.toFixed(0).padStart(4)}秒  9わりが ${r.p90.toFixed(0).padStart(4)}秒まで  いちばん長い ${r.max.toFixed(0)}秒`);
    }
  }
}
