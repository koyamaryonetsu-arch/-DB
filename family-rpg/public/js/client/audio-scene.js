// 第77回 C: 場面で かわる 音楽を ゲームに つなぐ（戦いの 曲えらび・ピンチ・ボスの だん・ダンジョンの 深さ・昼と 夜・まわりの音）。
//   上の 半分は「今の 場面 → 音の 設定」を きめる 純粋な 関数（node の テストで 表に できる。画面も 音も さわらない）。
//   下の SceneAudio は ゲームから まいフレーム よばれ、かわった 時だけ game.audio（GameAudio）を よぶ。
//   エンジンの 決まりは docs/plan-r77-audio.md の 5。きめた わりあては docs/plan-r77-audio-c.md

// ───────────── 戦いの 曲 ─────────────
// 第2部（第6〜8章・千年前の 世界）の 場所。マップに past（true … 千年前 / false … その 今の すがた）が ある 所と、この 名前で はじまる 所
const PART2_PREFIX = ['overworld_past', 'toki_shrine', 'toki_ruin', 'hoshimichi', 'tokei_', 'c7_', 'c7s_', 'c7i_', 'c8a_', 'c8b_', 'c8c_'];
// 第8章 第4幕「時のはざま」（時の広間・さいごの 場所は past が ない ので 名前で）
PART2_PREFIX.push('c8r_');

export function isPart2Map(mapId, map = null) {
  if (isPart3Map(mapId, map)) return false;
  if (map && typeof map.past === 'boolean') return true;
  const id = String(mapId || map?.id || '');
  return PART2_PREFIX.some((p) => id.startsWith(p));
}

// 第90回 Z班: 第3部（第3部 第1章〜。中の 名前は c9〜c11）の 場所。この 名前で はじまる マップ（c9a_forest・c9a_b1 など）
//   曲は F班が 作る（第1幕の 曲の id は maps/c9a-flags.js の C9A_TRACKS。どれも c9 で はじまる）。今は 第3部の マップが ない ので、鳴り方は かわらない
export const PART3_PREFIX = ['c9', 'c10', 'c11'];
export function isPart3Map(mapId, map = null) {
  const id = String(mapId || map?.id || '');
  return PART3_PREFIX.some((p) => id.startsWith(p));
}
// 第3部の 曲の id か（c9a_festival など）
export const isPart3Track = (id) => PART3_PREFIX.some((p) => String(id || '').startsWith(p));
// 第3部の ふつうの 戦いの 曲（F班が 作ったら TRACKS に 入る。まだ ない 間は 下の battleBgm が battle に もどす）
export const PART3_BATTLE = 'battle3';

// 強敵（ボスでは ない）: 宝の地図の 洞窟（tm_）・ひみつのダンジョン（sd_）・モンスター闘技場・
//   物語の きまった 戦い（闘技場の 試合・たのまれごとの 戦い・待ちぶせ など。サーバーの story）・ボスの しるしの ある 魔物が まざった 戦い
export function isStrongBattle({ mapId = '', boss = false, story = false, enemies = [], monsters = {} } = {}) {
  if (boss) return false;
  const id = String(mapId || '');
  if (id.startsWith('tm_') || id.startsWith('sd_') || id === 'monarena') return true;
  if (story) return true;
  return enemies.some((e) => {
    const m = monsters[e?.species];
    return !!(m && (m.boss || m.tmBoss || m.phases));
  });
}

// 戦いの 曲の id。snap.bgm が 'battle'（ふつうの 戦い。サーバーは フィールドでも 'battle' を 入れる）か ない 時だけ えらぶ。
//   battle_strong（強敵）→ battle3（第3部）→ battle2（第2部）→ battle。曲が まだ ない 時は battle に もどる（has(id) で 見る）
export function battleBgm({ snapBgm = null, boss = false, story = false, mapId = '', map = null, enemies = [], monsters = {}, has = () => true } = {}) {
  if (snapBgm && snapBgm !== 'battle') return snapBgm;
  if (!snapBgm && boss) return 'boss';
  if (isStrongBattle({ mapId, boss, story, enemies, monsters }) && has('battle_strong')) return 'battle_strong';
  // 第3部（曲が できるまでは battle。第2部の battle2 には しない）
  if (isPart3Map(mapId, map)) return has(PART3_BATTLE) ? PART3_BATTLE : 'battle';
  if (isPart2Map(mapId, map) && has('battle2')) return 'battle2';
  return 'battle';
}

// ───────────── ピンチ ─────────────
// 生きて いる 仲間の だれかが 25% を 切ったら ON、全員が 35% 以上に もどったら OFF（その 間は 前の まま）
export const PINCH_ON = 0.25;
export const PINCH_OFF = 0.35;

export function hpRate(c) {
  const hp = Number(c?.hp), max = Number(c?.maxHp);
  if (!Number.isFinite(hp) || !Number.isFinite(max) || max <= 0) return null;
  return Math.max(0, hp / max);
}

// 第101回 B班: 時計の おしつけ合い（battle-c11a.js）… 生きて いる 味方が 持つ 時計の 数が 2 いか
export const CLOCK_PINCH = 2;
export function clockPinch(list) {
  return (list || []).some((c) => c && c.side === 'ally' && c.alive !== false && Number.isInteger(c.clock11) && c.clock11 <= CLOCK_PINCH);
}
// 第102回 B班: わすれの 衣（battle-c11b.js）… スピカの 思い出が あと 1（オボロの pub の forget11b・forgetMax11b）
export function forgetPinch(list) {
  return (list || []).some((c) => c && c.side === 'enemy' && c.alive !== false && Number.isInteger(c.forget11b) && !c.c11bDown && (c.forgetMax11b || 3) - c.forget11b <= 1);
}
export function nextPinch(prev, allies) {
  const rates = (allies || []).filter((c) => c && c.alive !== false && !c.dead && !c.fled).map(hpRate).filter((r) => r !== null);
  if (!rates.length) return false;
  if (rates.some((r) => r < PINCH_ON)) return true;
  if (rates.every((r) => r >= PINCH_OFF)) return false;
  return !!prev;
}

// ───────────── ボスの だん ─────────────
// 形態の しるし（サーバーの pub。1 が はじめ）→ だん（0〜3）
//   第80回: 新しい ボスの しるしは addFormKey(名前) で 足せる（第8章 第4幕の 門番・最後の ボスの 段の しるしは B班が きめる）
export const FORM_KEYS = ['slPhase', 'zen', 'c7form', 'c8form', 'c8hform', 'bwForm', 'kmForm', 'impForm'];
export function addFormKey(...keys) {
  for (const k of keys) if (typeof k === 'string' && k && !FORM_KEYS.includes(k)) FORM_KEYS.push(k);
  return FORM_KEYS;
}
// 第8章 第4幕（B班の 戦いの しるし）: 門番の 形態 gForm（1〜4）・最後の ボスの 段 slStage（1〜3）
addFormKey('gForm', 'slStage');
// 第90回 F: ともしびの ためし（c9a_trial）の 夜明けの めもりの 段 dawnStage（1 夜 → 2 夜明け前 → 3 夜明け → 4 夜明けを 2つ 上で）。
//   B班が 戦いの pub に この 名前で 出すと だん 0〜3 に なる（出さない 間は 曲の 形が 時間で 進む）。くわしくは docs/plan-part3.md の「実装メモ（F班）」
addFormKey('dawnStage');
// 第90回 F: 星の石の地下道（c9a_cave）は「ダンジョンの 深さ」の まま（c9a_b1〜c9a_b4 → 0.4・0.6・0.8・1.0。曲の パートが 1つずつ ふえる）
export const C9A_CAVE_TRACK = 'c9a_cave';
// 第91回 F: 大地の下（c9b_under）は 水晶の 柱を ともした 数 pillarStage（0〜6）で 楽器が ふえる（強さ 0.4 + 0.1 × 数）。
//   A班が 画面の 状態 pillarStage を 出せば それを（field.pillarStage・game.pillarStage。数 でも 関数 でも よい）、
//   出て いない 間は 柱の フラグ c9_pillar1〜6 の 数を 使う。名前は addFormKey にも 入れて おく（戦いの pub に 出ても こまらない 段の 名前）
addFormKey('pillarStage');
// 第91回 A班（つなぐ 時）: デデドン大王（c9b_king）の 段 kingStage（B班の pub。1 ふつう・2 まっ暗・3 HP 2わり いか・4 すわりこんだ）→ だん 0〜3
addFormKey('kingStage');
export const C9B_UNDER_TRACK = 'c9b_under';
export const C9B_PILLAR_FLAGS = ['c9_pillar1', 'c9_pillar2', 'c9_pillar3', 'c9_pillar4', 'c9_pillar5', 'c9_pillar6'];
export function pillarIntensity(stage) {
  const n = Math.max(0, Math.min(C9B_PILLAR_FLAGS.length, Math.floor(Number(stage) || 0)));
  return Math.round((DEPTH_MIN + ((1 - DEPTH_MIN) * n) / C9B_PILLAR_FLAGS.length) * 1000) / 1000;
}
export function pillarStageOf(game, hasFlag = () => false) {
  for (const src of [game?.field, game]) {
    let v = src?.pillarStage;
    try { if (typeof v === 'function') v = v.call(src); } catch { v = null; }
    if (v !== null && v !== undefined && Number.isFinite(Number(v))) return Math.max(0, Math.min(C9B_PILLAR_FLAGS.length, Math.floor(Number(v))));
  }
  let n = 0;
  for (const f of C9B_PILLAR_FLAGS) {
    try { if (hasFlag(f)) n++; } catch { /* */ }
  }
  return n;
}

// 第92回 F: さかさのピラミッド（c9c_pyramid）は 画面の 状態 flipStage（0 ふつう・1 さかさ）で 楽器が かわる（曲の だん 0・1。
//   だん 1 は さかさの 形〈オルゴールの ふし・ベースの のばし・リムと オープンハット〉。次の 小節から かわり、もどる 時は イントロから）。
//   A班が 画面の 状態 flipStage を 出す（field.flipStage・game.flipStage。数・true/false・関数 どれでも よい）。出て いない 間は 0（ふつう）。
//   名前は addFormKey にも 入れて おく（戦いの pub に 出ても こまらない 段の 名前）
addFormKey('flipStage');
export const C9C_PYRAMID_TRACK = 'c9c_pyramid';
export function flipStageOf(game) {
  for (const src of [game?.field, game]) {
    let v = src?.flipStage;
    try { if (typeof v === 'function') v = v.call(src); } catch { v = null; }
    if (v === true) return 1;
    if (v === false) return 0;
    if (v !== null && v !== undefined && Number.isFinite(Number(v))) return Number(v) >= 1 ? 1 : 0;
  }
  return 0;
}

// 第93回 F: ふたごの道（c9d_lane）は 画面の 状態 apartStage（0 スピカと いっしょ・1 はなれて いる）で、はなれると ふしが 片方だけに なる（曲の だん 0・1）。
//   A班が 画面の 状態 apartStage を 出す（field.apartStage・game.apartStage。数・true/false・関数 どれでも よい）。出て いない 間は 0。
//   名前は addFormKey にも 入れて おく（戦いの pub に 出ても こまらない 段の 名前）
addFormKey('apartStage');
export const C9D_LANE_TRACK = 'c9d_lane';
export function apartStageOf(game) {
  for (const src of [game?.field, game]) {
    let v = src?.apartStage;
    try { if (typeof v === 'function') v = v.call(src); } catch { v = null; }
    if (v === true) return 1;
    if (v === false) return 0;
    if (v !== null && v !== undefined && Number.isFinite(Number(v))) return Number(v) >= 1 ? 1 : 0;
  }
  return 0;
}
// 第93回 F: スピカの歌（c9d_song）は 画面の 状態 songStage（1〜7。歌える ふしの 数）で だん 0〜6（のこりの ふしは 伴そうだけ）。
//   イベントの 曲でも よい（鳴って いる 曲が c9d_song なら、その 場所の 曲で なくても だんを 送る）。出て いない 間は 1
export const C9D_SONG_TRACK = 'c9d_song';
export const SONG_STAGES = 7;
export function songStageOf(game) {
  for (const src of [game?.field, game]) {
    let v = src?.songStage;
    try { if (typeof v === 'function') v = v.call(src); } catch { v = null; }
    if (v !== null && v !== undefined && v !== false && Number.isFinite(Number(v))) return Math.max(1, Math.min(SONG_STAGES, Math.floor(Number(v))));
  }
  return 1;
}
// 第93回 F: 0 から 数える 形態の しるし（0 が はじめ）。あそびたい魔人（c9d_mu）の muStage（B班の 戦いの pub。0 1体・1 2体に 分かれた）→ だん 0・1
export const FORM_KEYS0 = [];
export function addFormKey0(...keys) {
  for (const k of keys) if (typeof k === 'string' && k && !FORM_KEYS0.includes(k)) FORM_KEYS0.push(k);
  return FORM_KEYS0;
}
addFormKey0('muStage');
// 第94回 F: かけ上がる帰り道（c10r_run）は 画面の 状態 lavaStage（0〜3。ようがんが 近いほど 大きい）で、
//   強さ 0.4・0.6・0.8・1.0（たいこと 低い 音が ふえる）と だん 0〜3（テンポが 少し 上がる。形は かえない）。
//   A班が 画面の 状態 lavaStage を 出す（field.lavaStage・game.lavaStage。数・関数 どれでも よい。出て いない 間は 0）。
//   イベントの 曲でも よい（鳴って いる 曲が c10r_run なら、その 場所の 曲で なくても 送る）。
//   0 から 数える しるし なので addFormKey0 にも 入れて おく（戦いの pub に 出ても こまらない 段の 名前）
addFormKey0('lavaStage');
export const C10R_RUN_TRACK = 'c10r_run';
export const LAVA_STAGES = 4;
export function lavaStageOf(game) {
  for (const src of [game?.field, game]) {
    let v = src?.lavaStage;
    try { if (typeof v === 'function') v = v.call(src); } catch { v = null; }
    if (v === true) return LAVA_STAGES - 1;
    if (v === false) return 0;
    if (v !== null && v !== undefined && Number.isFinite(Number(v))) return Math.max(0, Math.min(LAVA_STAGES - 1, Math.floor(Number(v))));
  }
  return 0;
}
export function lavaIntensity(stage) {
  const n = Math.max(0, Math.min(LAVA_STAGES - 1, Math.floor(Number(stage) || 0)));
  return Math.round((DEPTH_MIN + ((1 - DEPTH_MIN) * n) / (LAVA_STAGES - 1)) * 1000) / 1000;
}

// 第95回 F: 水鏡のうらがわ（c10b_blue）は 画面の 状態 waterStage（0 水なし・1 中・2 上）で だん 0〜2（楽器と 調が かわる。
//   だんが かわると 次の 小節から その だんの イントロへ）。A班が 画面の 状態 waterStage を 出す
//   （field.waterStage・game.waterStage。数・関数 どれでも よい）。出て いない 間は 1（階に 入った 時と 同じ「中」）。
//   氷の下のしのび足（c10b_white）は 画面の 状態 alertStage（0 見はりが 遠い・1 近い・2 見つかった）で 強さ 0.4・0.7・1 と だん 0〜2
//   （1 は 低い 音が ふえる だけ ＝ ふしの とちゅうから 止まらない。2 は「見つかった！」の 形）。出て いない 間は 0。
//   どちらも イベントの 曲でも よい（鳴って いる 曲が それなら、その 場所の 曲で なくても 送る）。
//   0 から 数える しるし なので addFormKey0 にも 入れて おく（戦いの pub に 出ても こまらない 段の 名前）
addFormKey0('waterStage', 'alertStage');
export const C10B_BLUE_TRACK = 'c10b_blue';
export const C10B_WHITE_TRACK = 'c10b_white';
export const WATER_STAGES = 3;
export const ALERT_STAGES = 3;
function stageOf(game, key, n, dflt) {
  for (const src of [game?.field, game]) {
    let v = src?.[key];
    try { if (typeof v === 'function') v = v.call(src); } catch { v = null; }
    if (v === true) return n - 1;
    if (v === false) return 0;
    if (v !== null && v !== undefined && Number.isFinite(Number(v))) return Math.max(0, Math.min(n - 1, Math.floor(Number(v))));
  }
  return dflt;
}
export const waterStageOf = (game) => stageOf(game, 'waterStage', WATER_STAGES, 1);
export const alertStageOf = (game) => stageOf(game, 'alertStage', ALERT_STAGES, 0);
export function alertIntensity(stage) {
  const n = Math.max(0, Math.min(ALERT_STAGES - 1, Math.floor(Number(stage) || 0)));
  return [0.4, 0.7, 1][n];
}

// 第97回 F: 空にかかる音の橋（c10c_isles）は 画面の 状態 bridgeStage（かかって いる 音の 橋の 数 0〜5）で 強さ 0・0.2・0.4・0.6・0.8・1
//   （橋が 1本 ふえる ごとに 楽器が 1つ ふえる。形・調・テンポは かえない ＝ ふしの とちゅうから 止まらない。かわるのは 次の 小節の 頭から）。
//   A班が 画面の 状態 bridgeStage を 出す（field.bridgeStage・game.bridgeStage。数・関数 どれでも よい。true は 5）。出て いない 間は 0。
//   イベントの 曲でも よい（鳴って いる 曲が c10c_isles なら、その 場所の 曲で なくても 送る）。
//   ダンジョン（kind: 'dungeon'）の 階でも 深さの 強さより bridgeStage が 先。0 から 数える しるし なので addFormKey0 にも 入れて おく
addFormKey0('bridgeStage');
export const C10C_ISLES_TRACK = 'c10c_isles';
export const BRIDGE_STAGES = 6;
export const bridgeStageOf = (game) => stageOf(game, 'bridgeStage', BRIDGE_STAGES, 0);
export function bridgeIntensity(stage) {
  const n = Math.max(0, Math.min(BRIDGE_STAGES - 1, Math.floor(Number(stage) || 0)));
  return Math.round((n / (BRIDGE_STAGES - 1)) * 1000) / 1000;
}

// 第99回 F: 空への星の階段（c10d_stairs）は 画面の 状態 gateStage（開けた 門の 数 0〜4）で 強さ 0・0.25・0.5・0.75・1
//   （門を 1つ 開ける ごとに 楽器が 1つ ふえる）と だん 0〜4（調が 半音ずつ・テンポが 1% ずつ 上がる。形は かえない ＝
//   ふしの とちゅうから 止まらない。かわるのは 次の 小節の 頭から）。
//   A班が 画面の 状態 gateStage を 出す（field.gateStage・game.gateStage。数・関数 どれでも よい。true は 4）。出て いない 間は 0。
//   イベントの 曲でも よい（鳴って いる 曲が c10d_stairs なら、その 場所の 曲で なくても 送る）。
//   ダンジョン（kind: 'dungeon'）の 階でも 深さの 強さより gateStage が 先。0 から 数える しるし なので addFormKey0 にも 入れて おく
addFormKey0('gateStage');
export const C10D_STAIRS_TRACK = 'c10d_stairs';
export const GATE_STAGES = 5;
export const gateStageOf = (game) => stageOf(game, 'gateStage', GATE_STAGES, 0);
export function gateIntensity(stage) {
  const n = Math.max(0, Math.min(GATE_STAGES - 1, Math.floor(Number(stage) || 0)));
  return Math.round((n / (GATE_STAGES - 1)) * 1000) / 1000;
}

// 第101回 F: ひとふでの星座（c11a_isle）は 画面の 状態 conStage（その 島で できた 星座の 数 0〜2）で 強さ 0・0.5・1
//   （星座が 1つ できる ごとに 楽器が ふえる。形・調・テンポは かえない ＝ ふしの とちゅうから 止まらない。かわるのは 次の 小節の 頭から）。
//   A班が 画面の 状態 conStage を 出す（field.conStage・game.conStage。数・関数 どれでも よい。true は 2）。出て いない 間は 0。
//   イベントの 曲でも よい（鳴って いる 曲が c11a_isle なら、その 場所の 曲で なくても 送る）。だんは 送らない（bridgeStage と 同じ）。
//   ダンジョン（kind: 'dungeon'）の マップでも 深さの 強さより conStage が 先。0 から 数える しるし なので addFormKey0 にも 入れて おく
addFormKey0('conStage');
export const C11A_ISLE_TRACK = 'c11a_isle';
export const CON_STAGES = 3;
export const conStageOf = (game) => stageOf(game, 'conStage', CON_STAGES, 0);
export function conIntensity(stage) {
  const n = Math.max(0, Math.min(CON_STAGES - 1, Math.floor(Number(stage) || 0)));
  return Math.round((n / (CON_STAGES - 1)) * 1000) / 1000;
}

// 形態の しるしが ない 魔物は null
function formStage(c) {
  let n = null;
  for (const k of FORM_KEYS) {
    const v = Number(c[k]);
    if (Number.isFinite(v) && v >= 1) n = Math.max(n ?? 0, v - 1);
  }
  for (const k of FORM_KEYS0) {
    if (c[k] === null || c[k] === undefined || c[k] === '') continue;
    const v = Number(c[k]);
    if (Number.isFinite(v) && v >= 0) n = Math.max(n ?? 0, Math.floor(v));
  }
  if (c.p2) n = Math.max(n ?? 0, 1);
  return n;
}

// 1体の ボスの だん: 形態の しるし・その 魔物の 段階（MONSTERS の phases の hpBelow）・どちらも ない ときは HP 半分で 1
export function bossStage(c, monsters = {}) {
  if (!c) return 0;
  const form = formStage(c);
  const r = hpRate(c);
  const phases = monsters[c.species]?.phases;
  let hp = 0;
  if (r !== null) {
    if (Array.isArray(phases) && phases.length) hp = phases.filter((p) => Number.isFinite(p?.hpBelow) && r < p.hpBelow).length;
    else if (form === null) hp = r < 0.5 ? 1 : 0;
  }
  return Math.max(0, Math.min(3, Math.max(form ?? 0, hp)));
}

// 戦いの だん（ボス戦だけ）。ボスの しるしの ある 敵（なければ HP の いちばん 多い 敵）の だんの 大きい 方。
//   prev より 下げない（回復で テンポが 行ったり 来たり しない ように）
export function battlePhase({ boss = false, enemies = [], monsters = {}, prev = 0 } = {}) {
  if (!boss) return 0;
  const live = enemies.filter((e) => e && e.side !== 'ally' && e.alive !== false);
  let list = live.filter((e) => e.boss || monsters[e.species]?.boss);
  if (!list.length && live.length) list = [live.reduce((a, b) => ((Number(b.maxHp) || 0) > (Number(a.maxHp) || 0) ? b : a))];
  let n = 0;
  for (const e of list) n = Math.max(n, bossStage(e, monsters));
  return Math.max(prev || 0, n);
}

// ───────────── ダンジョンの 深さ ─────────────
// マップの id から 「なかま（同じ ダンジョン）」と 階の 番号を 出す。
//   cave_b1・tower_2f・mine3・peak_top・tokei_10f・c7_temple_3f_now など。てっぺん（top・boss）は いちばん 上の 階の つぎ
export function floorKey(id) {
  const s = String(id || '').replace(/_(now|past)$/, '');
  let m = /^(.*?)_(top|boss)$/.exec(s);
  if (m) return { group: m[1], n: Infinity };
  m = /^(.*?)_?b?(\d+)f?$/.exec(s);
  if (m && m[1]) return { group: m[1].replace(/_$/, ''), n: Number(m[2]) };
  return null;
}

// maps（{ id, kind, past } の ならび）→ Map(id → { floor（1から）, floors })。ダンジョンだけ。
//   千年前（past: true）と 今の すがたは べつの ダンジョン
export function buildFloorIndex(maps) {
  const groups = new Map();
  for (const m of maps || []) {
    if (!m || m.kind !== 'dungeon') continue;
    const k = floorKey(m.id);
    if (!k) continue;
    const g = `${k.group}|${m.past === true ? 'past' : 'now'}`;
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push({ id: m.id, n: k.n });
  }
  const out = new Map();
  for (const list of groups.values()) {
    const ns = [...new Set(list.map((x) => x.n))].sort((a, b) => a - b);
    for (const x of list) out.set(x.id, { floor: ns.indexOf(x.n) + 1, floors: ns.length });
  }
  return out;
}

// 階 → 強さ（最初の 階 0.4 → 最後の 階 1.0 を 直線で）。階が わからない・1〜2階しか ない 所は 1
//   B2 との やくそく: 0 … メロディ・ベース・軽い きざみ ／ 0.55 … しっかりした たいこ ／ 0.8 … 対旋律
export const DEPTH_MIN = 0.4;
export function depthIntensity(floor, floors) {
  const f = Number(floor), n = Number(floors);
  if (!Number.isFinite(f) || !Number.isFinite(n) || n <= 2 || f < 1) return 1;
  const v = DEPTH_MIN + ((1 - DEPTH_MIN) * (Math.min(f, n) - 1)) / (n - 1);
  return Math.round(v * 1000) / 1000;
}

// 第80回: 時の広間（c8r_hall）の 強さ ＝ クリアした つばさの 数（物語の しるし）。0こ 0.4 → 4こ 1.0
//   曲の 強さの 段（audio-c8r.js）: 0.4 ベル・きざみ ／ 0.55 ＋ 低音 ／ 0.7 ＋ のばし ／ 0.85 ＋ 笛 ／ 1.0 ＋ ハープ・たいこ
export const HALL_TRACK = 'c8r_hall';
export const HALL_WING_FLAGS = ['c8w_moon', 'c8w_fire', 'c8w_iron', 'c8w_ice'];
export function hallIntensity(hasFlag = () => false) {
  let n = 0;
  for (const f of HALL_WING_FLAGS) {
    try { if (hasFlag(f)) n++; } catch { /* */ }
  }
  return Math.round((DEPTH_MIN + ((1 - DEPTH_MIN) * n) / HALL_WING_FLAGS.length) * 1000) / 1000;
}

// その マップの 階（宝の地図の 洞窟は map.tm に 階と 階の 数が ある）
export function floorOf(mapId, map, index) {
  if (map?.tm && Number.isFinite(map.tm.floor) && Number.isFinite(map.tm.floors)) return { floor: map.tm.floor, floors: map.tm.floors };
  return index?.get(mapId) || null;
}

// ───────────── 昼と 夜 ─────────────
// 屋外の フィールドだけ 夜に なる。ダンジョン・建物の 中・戦い・夜専用の 曲が ある 所（bgmAt で 夜に 曲が かわる）は 'day'
export function timeOfDayFor({ inBattle = false, kind = 'field', indoor = false, night = false, hasNightTrack = false } = {}) {
  if (inBattle || kind !== 'field' || indoor || hasNightTrack) return 'day';
  return night ? 'night' : 'day';
}

// 屋根の 下（家の 中）。field.js の drawRoof と 同じ きまり
export function underRoof(map, x, y) {
  for (const r of map?.roofs || []) {
    if (x >= r.x + 1 && x < r.x + r.w - 1 && y >= r.y + 1 && y < r.y + r.h) return true;
  }
  return false;
}

// ───────────── まわりの音 ─────────────
// 場所の 名前（areaName）で きめる 所
export const AMBIENCE_BY_AREA = {
  // 港・海辺の 町・村
  'カモメ港': 'waves', 'ナギの村': 'waves',
  // 市場の ある 大きな 町
  'ルミナの町': 'market', '王都サファラ': 'market', '緑の王国': 'market',
  // 雪・高い 所の 町・村
  '竜守りの村': 'wind', '温泉の里ユノハ': 'wind', '鉱山の町カナトコ': 'wind', '白雪の里': 'wind',
  'ハネノの町': 'wind', '星読みの里': 'wind', '砂の港ドゥナ': 'wind',
};

// マップごとに きめる 所（場所の 名前に ない 時）
export const AMBIENCE_BY_MAP = {
  // 野営・たき火（星竜山の 山小屋の だんろ）
  peak3: 'fire',
  sea: 'waves', c7s_sea: 'waves', sea_cave: 'waves',
  north: 'wind', c7i_snow: 'wind', kumoi: 'wind', hanono: 'wind', hoshiyomi: 'wind',
  peak1: 'wind', peak5: 'wind', peak_top: 'wind',
};

// 洞窟の しずく（くらい 洞窟・鉱山・古井戸・氷の 洞窟）
const DRIP_BGM = new Set(['cave', 'mine']);
const DRIP_MAPS = new Set(['north_well', 'ice_cave1', 'ice_cave2', 'peak2', 'peak4']);

// weather … 今の 天気（field.weatherKind()）。雨は 'rain'、ふぶき・砂あらしは 'wind'
export function ambienceFor({ mapId = '', map = null, area = '', weather = null } = {}) {
  if (area && Object.prototype.hasOwnProperty.call(AMBIENCE_BY_AREA, area)) return AMBIENCE_BY_AREA[area];
  if (weather === 'rain') return 'rain';
  if (Object.prototype.hasOwnProperty.call(AMBIENCE_BY_MAP, mapId)) return AMBIENCE_BY_MAP[mapId];
  if (weather === 'blizzard' || weather === 'sandstorm') return 'wind';
  if (map?.kind === 'dungeon' && !map.indoor && (DRIP_MAPS.has(mapId) || (DRIP_BGM.has(map.bgm) && !String(mapId).startsWith('fq_')))) return 'cave_drip';
  return null;
}

// ───────────── つなぐ（ゲームから よぶ）─────────────
// audio … GameAudio（または テストの にせもの）。deps … { tracks, maps, monsters }
//   どれも 同じ 値を 何度も 送らない。曲が かわった（audio.music が 新しく なった）ら 曲の 値は 送りなおす
export class SceneAudio {
  constructor(audio, { tracks = {}, maps = null, monsters = {} } = {}) {
    this.audio = audio;
    this.tracks = tracks;
    this.maps = maps;
    this.monsters = monsters;
    this.floorIndex = null;
    this.music = undefined;
    this.sent = {};
    this.amb = undefined;
    this.pinch = false;
    this.phase = 0;
    this.nextField = 0;
  }

  has(id) { return !!this.tracks?.[id]; }

  floors() {
    if (!this.floorIndex) this.floorIndex = buildFloorIndex(this.maps ? Object.values(this.maps) : []);
    return this.floorIndex;
  }

  // 曲が かわったら 送った 値を わすれる
  watchTrack() {
    const m = this.audio.music || null;
    if (m === this.music) return false;
    this.music = m;
    this.sent = {};
    return true;
  }

  send(key, value, call) {
    if (this.sent[key] === value) return;
    this.sent[key] = value;
    call(value);
  }

  setAmbience(id) {
    const v = id || null;
    if (this.amb === v) return;
    this.amb = v;
    if (v) this.audio.playAmbience(v);
    else this.audio.stopAmbience();
  }

  // ── 戦い ──
  battleTrack({ snap = {}, boss = false, story = false, mapId = '', map = null } = {}) {
    return battleBgm({ snapBgm: snap.bgm || null, boss, story, mapId, map, enemies: (snap.combatants || []).filter((c) => c.side === 'enemy'), monsters: this.monsters, has: (id) => this.has(id) });
  }

  // 戦いが はじまった（曲を 鳴らした あと）
  battleStart() {
    this.pinch = false;
    this.phase = 0;
    this.watchTrack();
    this.setAmbience(null);
    this.send('tod', 'day', (v) => this.audio.setTimeOfDay(v));
  }

  // 戦いの 間 まいフレーム。combatants … 戦いの 中の 人と 魔物（side・alive・hp・maxHp・形態の しるし）
  battleTick({ combatants = [], boss = false, ended = false } = {}) {
    this.watchTrack();
    if (ended) return this.battleEnd();
    const list = [...combatants];
    this.pinch = nextPinch(this.pinch, list.filter((c) => c.side === 'ally'));
    // 第101回 B班: 第3部 第3章 第1幕の いかり船長 … 味方が 持って いる 時計の 数が 2 いかの 時も ピンチと おなじ きざみ（pub の clock11）
    // 第102回 B班: 第3部 第3章 第2幕の オボロ … スピカの 思い出が あと 1 の 時も ピンチと おなじ きざみ
    const hot = clockPinch(list) || forgetPinch(list);
    this.phase = battlePhase({ boss, enemies: list.filter((c) => c.side === 'enemy'), monsters: this.monsters, prev: this.phase });
    this.send('pinch', this.pinch || hot, (v) => this.audio.setPinch(v));
    if (boss) this.send('phase', this.phase, (v) => this.audio.setPhase(v));
  }

  battleEnd() {
    this.pinch = false;
    this.send('pinch', false, (v) => this.audio.setPinch(v));
  }

  // ── フィールド・町・ダンジョン ──
  // st … fieldState() の 答え
  fieldApply(st) {
    this.watchTrack();
    const id = this.audio.music?.id || null;
    // 強さは 今 鳴っている 曲が その 場所の 曲の 時だけ（イベントの 曲・ジングルは さわらない）
    if (id && id === st.areaTrack) this.send('intensity', st.intensity, (v) => this.audio.setIntensity(v));
    // 第94回 F: かけ上がる帰り道は イベントの 曲でも ようがんの 近さで 強さを 送る
    else if (id === C10R_RUN_TRACK && st.lavaIntensity !== null && st.lavaIntensity !== undefined) this.send('intensity', st.lavaIntensity, (v) => this.audio.setIntensity(v));
    // 第95回 F: 氷の下のしのび足は イベントの 曲でも 見はりの 近さで 強さを 送る
    else if (id === C10B_WHITE_TRACK && st.alertIntensity !== null && st.alertIntensity !== undefined) this.send('intensity', st.alertIntensity, (v) => this.audio.setIntensity(v));
    // 第97回 F: 空にかかる音の橋は イベントの 曲でも 橋の 数で 強さを 送る
    else if (id === C10C_ISLES_TRACK && st.bridgeIntensity !== null && st.bridgeIntensity !== undefined) this.send('intensity', st.bridgeIntensity, (v) => this.audio.setIntensity(v));
    // 第99回 F: 空への星の階段は イベントの 曲でも 開けた 門の 数で 強さを 送る
    else if (id === C10D_STAIRS_TRACK && st.gateIntensity !== null && st.gateIntensity !== undefined) this.send('intensity', st.gateIntensity, (v) => this.audio.setIntensity(v));
    // 第101回 F: ひとふでの星座は イベントの 曲でも できた 星座の 数で 強さを 送る
    else if (id === C11A_ISLE_TRACK && st.conIntensity !== null && st.conIntensity !== undefined) this.send('intensity', st.conIntensity, (v) => this.audio.setIntensity(v));
    // 第92回 F: 場所で だんが かわる 曲（さかさのピラミッド・第93回 ふたごの道）
    if (id && id === st.areaTrack && st.phase !== null && st.phase !== undefined) this.send('phase', st.phase, (v) => this.audio.setPhase(v));
    // 第93回 F: スピカの歌は イベントの 曲でも 歌える ふしの 数を 送る
    else if (id === C9D_SONG_TRACK && st.songPhase !== null && st.songPhase !== undefined) this.send('phase', st.songPhase, (v) => this.audio.setPhase(v));
    else if (id === C10R_RUN_TRACK && st.lavaPhase !== null && st.lavaPhase !== undefined) this.send('phase', st.lavaPhase, (v) => this.audio.setPhase(v));
    // 第95回 F: 水鏡のうらがわ・氷の下のしのび足（イベントの 曲でも）
    else if (id === C10B_BLUE_TRACK && st.waterPhase !== null && st.waterPhase !== undefined) this.send('phase', st.waterPhase, (v) => this.audio.setPhase(v));
    else if (id === C10B_WHITE_TRACK && st.alertPhase !== null && st.alertPhase !== undefined) this.send('phase', st.alertPhase, (v) => this.audio.setPhase(v));
    // 第99回 F: 空への星の階段（イベントの 曲でも）
    else if (id === C10D_STAIRS_TRACK && st.gatePhase !== null && st.gatePhase !== undefined) this.send('phase', st.gatePhase, (v) => this.audio.setPhase(v));
    this.send('tod', st.tod, (v) => this.audio.setTimeOfDay(v));
    // まわりの音は その 場所の 曲が 鳴って いる 間だけ（イベントの 曲・ジングルの 間は 止める）
    this.setAmbience(id && id === st.areaTrack ? st.ambience : null);
  }

  // game から 今の 場所の ようすを 読む（Field と SkyClient を つかう）
  fieldState(game) {
    const f = game.field;
    const map = f.map;
    const mapId = f.mapId;
    const x = Math.floor(f.me.x), y = Math.floor(f.me.y);
    const hasFlag = (fl) => f.hasFlag(fl);
    const areaTrack = f.areaBgm();
    const sky = game.sky;
    const night = f.nightOverride !== null && f.nightOverride !== undefined ? !!f.nightOverride : !!sky?.isNight?.();
    let hasNightTrack = false;
    if (map.bgmAt) {
      try { hasNightTrack = map.bgmAt(x, y, true, hasFlag) !== map.bgmAt(x, y, false, hasFlag); } catch { /* */ }
    }
    let intensity = 1;
    if (areaTrack === HALL_TRACK) intensity = hallIntensity(hasFlag);
    else if (areaTrack === C9B_UNDER_TRACK) intensity = pillarIntensity(pillarStageOf(game, hasFlag));
    else if (areaTrack === C10R_RUN_TRACK) intensity = lavaIntensity(lavaStageOf(game));
    else if (areaTrack === C10B_WHITE_TRACK) intensity = alertIntensity(alertStageOf(game));
    else if (areaTrack === C10C_ISLES_TRACK) intensity = bridgeIntensity(bridgeStageOf(game));
    else if (areaTrack === C10D_STAIRS_TRACK) intensity = gateIntensity(gateStageOf(game));
    else if (areaTrack === C11A_ISLE_TRACK) intensity = conIntensity(conStageOf(game));
    else if (map.kind === 'dungeon' && areaTrack === map.bgm) {
      const fl = floorOf(mapId, map, this.floors());
      if (fl) intensity = depthIntensity(fl.floor, fl.floors);
    }
    // さかさの ピラミッドの 曲の 時だけ だん（ふつう 0・さかさ 1）。ほかの 曲では だんを 送らない
    let phase = areaTrack === C9C_PYRAMID_TRACK ? flipStageOf(game) : null;
    // 第93回 F: ふたごの道（いっしょ 0・はなれて いる 1）・スピカの歌（歌える ふしの 数 - 1）
    if (areaTrack === C9D_LANE_TRACK) phase = apartStageOf(game);
    else if (areaTrack === C9D_SONG_TRACK) phase = songStageOf(game) - 1;
    else if (areaTrack === C10R_RUN_TRACK) phase = lavaStageOf(game);
    else if (areaTrack === C10B_BLUE_TRACK) phase = waterStageOf(game);
    else if (areaTrack === C10B_WHITE_TRACK) phase = alertStageOf(game);
    else if (areaTrack === C10D_STAIRS_TRACK) phase = gateStageOf(game);
    const songPhase = songStageOf(game) - 1;
    // 第94回 F: かけ上がる帰り道（イベントの 曲の 時も 使う）
    const lavaPhase = lavaStageOf(game);
    // 第95回 F: 水の 高さ・見はりの 近さ（イベントの 曲の 時も 使う）
    const waterPhase = waterStageOf(game);
    const alertPhase = alertStageOf(game);
    // 第97回 F: かかって いる 音の 橋の 数（イベントの 曲の 時も 使う）
    const bridgePhase = bridgeStageOf(game);
    // 第99回 F: 開けた 門の 数（イベントの 曲の 時も 使う）
    const gatePhase = gateStageOf(game);
    let area = '';
    try { area = f.areaName(); } catch { /* */ }
    let weather = null;
    try { weather = f.weatherKind(); } catch { /* */ }
    const indoor = !!map.indoor || (!sky?.flying && underRoof(map, f.me.x, f.me.y));
    return {
      areaTrack,
      intensity,
      phase,
      songPhase,
      lavaPhase,
      lavaIntensity: lavaIntensity(lavaPhase),
      waterPhase,
      alertPhase,
      alertIntensity: alertIntensity(alertPhase),
      bridgeIntensity: bridgeIntensity(bridgePhase),
      gatePhase,
      gateIntensity: gateIntensity(gatePhase),
      // 第101回 F: その 島で できた 星座の 数（イベントの 曲の 時も 使う）
      conIntensity: conIntensity(conStageOf(game)),
      tod: timeOfDayFor({ kind: map.kind, indoor, night, hasNightTrack }),
      ambience: ambienceFor({ mapId, map, area, weather }),
    };
  }

  // まいフレーム（フィールドの 時）。now … ミリびょう。force … 曲を 鳴らした すぐ あと（つぎの 小節に まにあわせる）
  syncField(game, now = 0, force = false) {
    const changed = (this.audio.music || null) !== this.music;
    if (!force && !changed && now < this.nextField) return;
    this.nextField = now + 250;
    this.fieldApply(this.fieldState(game));
  }
}
