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
  if (map && typeof map.past === 'boolean') return true;
  const id = String(mapId || map?.id || '');
  return PART2_PREFIX.some((p) => id.startsWith(p));
}

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
//   battle_strong（強敵）→ battle2（第2部）→ battle。曲が まだ ない 時は battle に もどる（has(id) で 見る）
export function battleBgm({ snapBgm = null, boss = false, story = false, mapId = '', map = null, enemies = [], monsters = {}, has = () => true } = {}) {
  if (snapBgm && snapBgm !== 'battle') return snapBgm;
  if (!snapBgm && boss) return 'boss';
  if (isStrongBattle({ mapId, boss, story, enemies, monsters }) && has('battle_strong')) return 'battle_strong';
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

// 形態の しるしが ない 魔物は null
function formStage(c) {
  let n = null;
  for (const k of FORM_KEYS) {
    const v = Number(c[k]);
    if (Number.isFinite(v) && v >= 1) n = Math.max(n ?? 0, v - 1);
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
    this.phase = battlePhase({ boss, enemies: list.filter((c) => c.side === 'enemy'), monsters: this.monsters, prev: this.phase });
    this.send('pinch', this.pinch, (v) => this.audio.setPinch(v));
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
    else if (map.kind === 'dungeon' && areaTrack === map.bgm) {
      const fl = floorOf(mapId, map, this.floors());
      if (fl) intensity = depthIntensity(fl.floor, fl.floors);
    }
    let area = '';
    try { area = f.areaName(); } catch { /* */ }
    let weather = null;
    try { weather = f.weatherKind(); } catch { /* */ }
    const indoor = !!map.indoor || (!sky?.flying && underRoof(map, f.me.x, f.me.y));
    return {
      areaTrack,
      intensity,
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
