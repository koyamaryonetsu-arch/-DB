// 第67回 B: モンスター闘技場の きまり（ランク・開く 時・相手・ごほうび・記録）。docs/plan-r67-monster-arena.md
//
// ・戦うのは 自分の 魔物 1〜4ひき だけ（人は 戦わない。world/monarena.js）
// ・ランク戦: F・E・D・C・B・A・S（物語が 進むと 開く）＋ 伝説の部 SS・SSS・EX（第68回 C。第7章クリア）・EX2（第74回 C。第8章 第2幕クリア）。
//   1つ前の ランクを 勝ちぬくと 次へ
//   1つの ランクは 休みなしの 3連戦（サファラ闘技場と おなじ。戦いの 前に 闘技場が HP・MPを 満タンに して くれる・戦いの 間は 回復しない・
//   にげられない・道具は 使える）。3戦目は 王者（色ちがいの 強い 魔物 ＋ おとも）
//   相手は ふつうの 魔物を ランクの レベル（lv）に そろえた もの（data/treasure.js の scaleEnemy。宝の洞窟と おなじ 強さの のび）
//   負けても お金は へらない・ゲームオーバーにも ならない
// ・ごほうび（キャラごと）: はじめて 勝ちぬいた 時 … first の 品と 小さなメダル。2回目から … repeatGold ゴールド（ランク C から 小さなメダル 1まいも）
//   魔物たちは 1戦ごとに 少しだけ 経験値を もらう（ふつうの 戦いの MON_EXP_RATE 倍）
// ・家族の 登録チームとの 対戦: 記録だけ（勝ち・負け）。はじめて その 家族に 勝った 時だけ 小さなメダル 1まい（くりかえして もらえる 品は ない）
// ・キャラに のこす もの（なくても よい。むかしの セーブも そのまま）
//   c.monArena = { r: { [ランク]: { n: 勝ちぬいた 回数, at: はじめての 時こく } }, team: [key…]（前回）, reg: [key…]（登録）,
//                  regSnap: [写し…]（battle-monarena.js の monSnapshot）, regAt, fam: { [charId]: { w, l } }, rep: 2回目からの メダルの 通し番号 }
import { registerVariant } from './variants.js?v=9a8a9aaa43ce';
import { MONSTERS } from './monsters.js?v=9a8a9aaa43ce';

// 登録チームの 写しに のこす もの（stats.js の monsterCompanionStats・monsterAbilities・戦いの 作戦が 使う もの。battle-monarena.js）
export const SNAP_KEYS = ['species', 'name', 'level', 'plus', 'color', 'bonus', 'seeds', 'equip', 'gearFx', 'inherit', 'tactics', 'autoOff', 'ranked'];

// 開く フラグ（魔物が 仲間に なる ころ。第1章の 森の主の あと）
export const MONARENA_OPEN_FLAG = 'monster_bond';
// 1つの チームの 数
export const MONARENA_TEAM_MAX = 4;
// 魔物が もらう 経験値（ふつうの 戦いの 何倍か。人が いない ぶん 少なめ）
export const MON_EXP_RATE = 0.5;

// 王者（色ちがい）。モジュールを 読みこんだ 時に とうろく（サーバーと 画面の 両方で おなじ ID。data/encounters.js から 読む）
const V = (sp, kind) => registerVariant(sp, kind) || sp;

// ランク: rank … 名前（'F' など）/ title … 部の 名前 / lv … おすすめの レベル（自分の 魔物の）/ foeLv … 相手の レベル（tools/sim-monarena.mjs で 合わせた）/
//   need … 開く フラグ / legend … 伝説の部
//   fights … 3連戦の 相手（3戦目が 王者）/ champ … 王者の 魔物 / champPow … 王者の 強さの 倍率（おともは 1）/ champLv … 王者の レベルの 上のせ
//   first … はじめての ごほうび（items: [[品, 数]]・medals）/ repeatGold・repeatMedal … 2回目から / hint … 王者の とくちょう
export const MONARENA_RANKS = [
  {
    rank: 'F', title: 'はじまりの部', lv: 10, foeLv: 11, need: MONARENA_OPEN_FLAG,
    fights: [['pururin', 'pururin', 'frog'], ['wolf', 'goblin', 'dark_bat'], [V('pururin_knight', 'red'), 'pururin', 'fuwari']],
    champPow: 1.25, champLv: 2,
    first: { items: [['seed_hp', 1], ['seed_str', 1], ['friend_powder', 1]], medals: 1 }, repeatGold: 150,
    hint: 'レッドぷるりん騎士は、力が強い。まわりのぷるりんたちを先にたおそう。',
  },
  {
    rank: 'E', title: '森と野原の部', lv: 15, foeLv: 21, need: 'c1_clear',
    fights: [['crow', 'karamizuta', 'fuwari'], ['coconut', 'coin_rabbit', 'ghost_pirate'], [V('king_pururin', 'gold'), 'fuwari', 'fuwari']],
    champPow: 1.25, champLv: 2,
    first: { items: [['seed_agi', 1], ['seed_def', 1], ['seed_mag', 1]], medals: 1 }, repeatGold: 300,
    hint: 'ゴールドキングぷるりんは、体がとてもかたい。呪文や特技で、少しずつHPをけずろう。',
  },
  {
    rank: 'D', title: '海と嵐の部', lv: 22, foeLv: 27, need: 'c2_clear',
    fights: [['coral_golem', 'storm_bird', 'mandra'], ['mimic', 'snow_wisp', 'fairy_dragon'], [V('great_dragon', 'dark'), 'fairy_dragon', 'fairy_dragon']],
    champPow: 1.2, champLv: 2,
    first: { items: [['seed_str', 2], ['seed_agi', 2], ['thunder_stone', 1]], medals: 2 }, repeatGold: 500,
    hint: 'ダークヴァルドラゴンは、やみの力に強く、光に弱い。はげしいブレスにそなえて、HPを高く保とう。',
  },
  {
    rank: 'C', title: '火と氷の部', lv: 30, foeLv: 37, need: 'c3_clear',
    fights: [['magma_slime', 'gargoyle', 'fire_imp'], ['kiba_walrus', 'petit_devil', 'aurora_spirit'], [V('obsidian_knight', 'shadow'), 'gargoyle', 'gargoyle']],
    champPow: 1.25, champLv: 2, repeatMedal: true,
    first: { items: [['color_stone', 1], ['seed_hp', 2], ['moon_stone', 1]], medals: 2 }, repeatGold: 800,
    hint: 'シャドウ黒曜の騎士は、とても素早い。先に動かれても負けないように、守りをかためよう。',
  },
  {
    rank: 'B', title: '砂の王国の部', lv: 40, foeLv: 39, need: 'c4_clear',
    fights: [['toge_saboten', 'sand_vulture', 'mummy_soldier'], ['lantern_ghost', 'cursed_pot', 'lamp_genie'], [V('castle_armor', 'dark'), 'trick_mirror', 'trick_mirror']],
    champPow: 1.25, champLv: 2, repeatMedal: true,
    first: { items: [['color_stone', 1], ['seed_str', 2], ['seed_def', 2], ['fire_stone', 1]], medals: 3 }, repeatGold: 1200,
    hint: 'ダーク古城のよろいは、HPも守りも高い。おともの鏡を先にたおして、みんなでいっせいに攻撃しよう。',
  },
  {
    rank: 'A', title: '空と雲の部', lv: 48, foeLv: 44, need: 'c5_gaia',
    fights: [['clockwork_guard', 'cloud_sheep', 'thunder_puff'], ['sky_serpent', 'stardust_slime', 'black_agent'], [V('killer_karakuri', 'red'), 'clockwork_guard', 'thunder_puff']],
    champPow: 1.15, champLv: 2, repeatMedal: true,
    first: { items: [['color_stone', 2], ['seed_agi', 2], ['seed_mag', 2], ['water_stone', 1]], medals: 3 }, repeatGold: 1700,
    hint: 'レッドキラーからくりの攻撃は、とてもいたい。炎に強く、氷に弱いぞ。',
  },
  {
    rank: 'S', title: '星の王者の部', lv: 56, foeLv: 46, need: 'c5_clear',
    fights: [['faceless_shade', 'mill_keeper', 'ember_wolf'], ['mirror_jelly', 'glass_scorpion', 'soul_eater'], [V('sky_serpent', 'gold'), 'ember_wolf', 'ember_wolf']],
    champPow: 1.1, champLv: 2, repeatMedal: true,
    first: { items: [['color_stone', 3], ['seed_hp', 3], ['seed_str', 2], ['seed_agi', 2], ['star_shard', 5]], medals: 4 }, repeatGold: 2500,
    hint: 'ゴールド雲海へびは、HPがとても多い。回復のできる魔物を入れて、長い戦いにそなえよう。',
  },
  {
    rank: 'SS', title: '伝説の部・時の部', lv: 68, foeLv: 54, need: 'c6_clear', legend: true,
    lock: '（千年前の、大きな時計の戦いを乗りこえると、開くらしい）',
    fights: [['toki_hare', 'rewind_ghost', 'dust_mole'], ['toki_owl', 'cog_roller', 'second_sprite'], [V('clock_golem', 'gold'), 'second_sprite', 'second_sprite']],
    champPow: 1.0, champLv: 2, repeatMedal: true,
    first: { items: [['color_stone', 3], ['limit_stone', 2], ['seed_def', 3], ['seed_mag', 3]], medals: 5 }, repeatGold: 3500,
    hint: 'ゴールド大時計の番人は、とてもかたくて、HPも多い。秒針の精たちを先にたおそう。',
  },
  {
    rank: 'SSS', title: '伝説の部・王者の中の王者', lv: 76, foeLv: 76, need: 'c7_karim', legend: true,
    lock: '（緑の王国の、水の神殿の戦いを乗りこえると、開くらしい）',
    fights: [['pakkun', 'march_broom', 'water_youma'], ['karon', 'pirate_parrot', 'clock_bones'], [V('ryuou_grandson', 'dark'), 'water_youma', 'pirate_parrot']],
    champPow: 1.8, champLv: 2, repeatMedal: true,
    first: { items: [['color_stone', 5], ['limit_stone', 3], ['seed_hp', 3], ['seed_agi', 3]], medals: 6 }, repeatGold: 5000,
    hint: 'ダーク竜王のまごは、やみの力に強い。光の技と、回復のできる魔物でいどもう。',
  },
  // 第68回 C: 伝説の部の つづき EX（第7章クリア〈c7_clear〉で 開く。おすすめ Lv84）。相手は 第7章（緑の王国・神殿・カイの 島・灯台）の 魔物。
  //   ごほうびは SS・SSS と おなじ 形（色の石・限界の石・種。くりかえして もらえる 装備は ない）
  {
    rank: 'EX', title: '伝説の部・星のかなたの部', lv: 84, foeLv: 82, need: 'c7_clear', legend: true,
    lock: '（千年前の、雪と氷の山の戦いを乗りこえると、開くらしい）',
    fights: [['fish_pirate', 'jugemu', 'pukupuku'], ['card_soldier', 'pirate_parrot', 'teresa'], [V('uzu_eel', 'shadow'), 'gesso', 'water_youma']],
    champPow: 1.45, champLv: 2, repeatMedal: true,
    first: { items: [['color_stone', 5], ['limit_stone', 4], ['seed_str', 3], ['seed_def', 3], ['seed_mag', 3]], medals: 8 }, repeatGold: 6500,
    hint: 'シャドウうずしおウツボは、とても素早い。大うずしおで、みんなをまきこむぞ。雷がよく効く。回復のできる魔物でいどもう。',
  },
  // 第74回 C: 伝説の部の つづき EX2（第8章 第2幕クリア〈c8_hades〉で 開く。おすすめ Lv88）。相手は 第7章 第3幕（いばらの城）と
  //   第8章 第1幕（月の王宮の 地下迷宮）の 魔物。ごほうびは SS・SSS・EX と おなじ 形（色の石・限界の石・種。くりかえして もらえる 装備は ない）
  {
    rank: 'EX2', title: '伝説の部・千年の月の部', lv: 88, foeLv: 86, need: 'c8_hades', legend: true,
    lock: '（千年前の、海の底の青い火の戦いを乗りこえると、開くらしい）',
    fights: [['ice_bro', 'thorn_goblin', 'ice_mirror'], ['palace_guard', 'cobrar', 'lamp_smoke'], [V('moon_scarab', 'gold'), 'sanbo', 'palace_guard']],
    champPow: 1.45, champLv: 2, repeatMedal: true,
    first: { items: [['color_stone', 5], ['limit_stone', 5], ['seed_hp', 3], ['seed_str', 3], ['seed_agi', 3]], medals: 10 }, repeatGold: 8000,
    hint: 'ゴールド月のスカラベは、体がとてもかたい。月の光は、とても強いぞ。銀色にかがやくと、攻撃が当たりにくくなる。雷がよく効く。',
  },
];
export const MONARENA_RANK_IDS = MONARENA_RANKS.map((R) => R.rank);
export const monRankInfo = (id) => MONARENA_RANKS.find((R) => R.rank === id) || null;
export const monRankLabel = (id) => (monRankInfo(id)?.legend ? `伝説の部・ランク${id}` : `ランク${id}`);
// 王者（3戦目の さいしょの 魔物）
export const monChampOf = (R) => R?.fights?.[2]?.[0] || null;
export const monChampName = (R) => MONSTERS[monChampOf(R)]?.name || '';

// ───────────── 記録 ─────────────
const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
const keyList = (x) => (Array.isArray(x) ? [...new Set(x.filter((k) => typeof k === 'string' && k))].slice(0, MONARENA_TEAM_MAX) : []);
const cnt = (v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);

// 写しの 1ぴき（こわれた ものは null）
function cleanSnap(s) {
  if (!s || typeof s !== 'object' || typeof s.species !== 'string' || !MONSTERS[s.species] || typeof s.key !== 'string') return null;
  const out = { key: s.key };
  for (const k of SNAP_KEYS) if (s[k] !== undefined && s[k] !== null) out[k] = s[k];
  out.level = Math.max(1, Math.floor(Number(s.level) || 1));
  out.name = typeof s.name === 'string' && s.name ? s.name.slice(0, 12) : MONSTERS[s.species].name;
  return out;
}

// キャラの 記録（ない ときは 空。こわれた データも 読める 形に。c は かえない）
export function monArenaRecord(c) {
  const a = obj(c?.monArena);
  const r = {};
  for (const [k, v] of Object.entries(obj(a.r))) {
    if (!monRankInfo(k) || !(cnt(v?.n) > 0)) continue;
    r[k] = { n: cnt(v.n), at: Number.isFinite(v.at) ? v.at : 0 };
  }
  const fam = {};
  for (const [id, v] of Object.entries(obj(a.fam))) {
    const w = cnt(v?.w), l = cnt(v?.l);
    if (w || l) fam[id] = { w, l, ...(v?.first ? { first: true } : {}) };
  }
  // 第67回 C: その場の 対戦（リアルタイム）の 記録（相手の キャラの id ごと。fam と おなじ 形）
  const live = {};
  for (const [id, v] of Object.entries(obj(a.live))) {
    const w = cnt(v?.w), l = cnt(v?.l);
    if (w || l) live[id] = { w, l, ...(v?.first ? { first: true } : {}) };
  }
  const regSnap = (Array.isArray(a.regSnap) ? a.regSnap : []).map(cleanSnap).filter(Boolean).slice(0, MONARENA_TEAM_MAX);
  return {
    r, team: keyList(a.team), reg: keyList(a.reg), regSnap, regAt: Number.isFinite(a.regAt) ? a.regAt : 0,
    fam, rep: cnt(a.rep), live,
  };
}

// セーブの 手直し（world/save.js の repairChar。なくても よい・こわれていたら 読める 形に）
export function repairMonArena(c) {
  if (!c || c.monArena === undefined) return;
  if (!c.monArena || typeof c.monArena !== 'object' || Array.isArray(c.monArena)) {
    delete c.monArena;
    return;
  }
  const a = monArenaRecord(c);
  const out = {};
  if (Object.keys(a.r).length) out.r = a.r;
  if (a.team.length) out.team = a.team;
  if (a.reg.length) out.reg = a.reg;
  if (a.regSnap.length) {
    out.regSnap = a.regSnap;
    if (a.regAt) out.regAt = a.regAt;
  }
  if (Object.keys(a.fam).length) out.fam = a.fam;
  if (a.rep) out.rep = a.rep;
  if (Object.keys(a.live).length) out.live = a.live;
  c.monArena = out;
}

// 書きかえ（records を まとめて 新しい 形で c.monArena に）
//   （空の 項目は のこさない。セーブを 小さく）
export function setMonArena(c, patch) {
  c.monArena = { ...obj(c.monArena), ...patch };
  repairMonArena(c);
  return c.monArena;
}

export const monRankCleared = (c, id) => (monArenaRecord(c).r[id]?.n || 0) > 0;

// その ランクに 出られるか（flag … もちぬしの フラグ）。{ ok, why } why: 'none'・'story'（物語が まだ）・'prev'（1つ前を まだ 勝ちぬいていない）
export function monRankOpen(id, flag, c) {
  const R = monRankInfo(id);
  if (!R) return { ok: false, why: 'none' };
  if (!flag(MONARENA_OPEN_FLAG) || !flag(R.need)) return { ok: false, why: 'story' };
  const i = MONARENA_RANK_IDS.indexOf(id);
  if (i > 0 && !monRankCleared(c, MONARENA_RANK_IDS[i - 1])) return { ok: false, why: 'prev' };
  return { ok: true };
}

// 勝ちぬいた ことを のこす。はじめて なら true
export function noteMonClear(c, id, now) {
  const a = monArenaRecord(c);
  const prev = a.r[id];
  const first = !(prev?.n > 0);
  setMonArena(c, { r: { ...a.r, [id]: first ? { n: 1, at: now } : { ...prev, n: prev.n + 1 } } });
  return first;
}

// 家族の 登録チームとの 勝ち負け。はじめて 勝った ときは true（小さなメダルの ため）
export function noteFamResult(c, charId, win) {
  const a = monArenaRecord(c);
  const prev = a.fam[charId] || { w: 0, l: 0 };
  const first = win && !prev.first && !(prev.w > 0);
  const next = { w: prev.w + (win ? 1 : 0), l: prev.l + (win ? 0 : 1), ...(prev.first || first ? { first: true } : {}) };
  setMonArena(c, { fam: { ...a.fam, [charId]: next } });
  return first;
}

// 第67回 C: その場の 対戦の 記録（はじめて 勝った 時だけ true … メダル 1まい）
export function noteLiveResult(c, charId, win) {
  const a = monArenaRecord(c);
  const prev = a.live[charId] || { w: 0, l: 0 };
  const first = win && !prev.first && !(prev.w > 0);
  const next = { w: prev.w + (win ? 1 : 0), l: prev.l + (win ? 0 : 1), ...(prev.first || first ? { first: true } : {}) };
  setMonArena(c, { live: { ...a.live, [charId]: next } });
  return first;
}
export const monLiveMedalId = (charId) => `monarena_live_${charId}`;

// 小さなメダルの 場所の id（c.medalSpots。world/casino.js）
export const monFirstMedalId = (id, i) => `monarena_${id}_${i}`;
export const monFamMedalId = (charId) => `monarena_fam_${charId}`;
export function nextMonRepeatMedal(c) {
  const a = monArenaRecord(c);
  setMonArena(c, { rep: a.rep + 1 });
  return `monarena_rep_${a.rep + 1}`;
}
