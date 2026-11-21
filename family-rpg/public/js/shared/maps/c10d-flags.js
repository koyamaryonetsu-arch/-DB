// 第3部 第2章「七つの星の音」第4幕「金の音と、星の橋」の フラグ・マップの ID・名前の 約束（第99回 A班 … はじめの 置き場）
// ※ ネタバレ注意（docs/plan-part3-c10d.md の 16）。フラグ・id は セーブに のこるので かえない（16-4 の 名前の 約束。係が かってに かえない）
// ほかの ファイルを 読まない（maps・data・world・client・tools の どこからでも 読める）
// A（世界と 物語）・B（戦いと 品）・F（曲）の 係は、ここの 名前を 使う
// ※ 一本道の 幕: 線の フラグは ぜんぶ 一本の 線（STORY_STEPS。c10_act3 の うしろ）に 入る。いずみの しるしは 線に 入れない

// ───── 物語の すすみぐあい（一本の 線。data/story-c10.js の CH10_STEPS。c10_act3 の うしろ）─────
export const C10D = {
  start: 'c10d_start', // くぼ地で 音さを 鳴らした（6つの 台の 光が 星の塔の てっぺんを 指す。幕が 始まった。題の 画面を 見た）
  top: 'c10d_top', // 星の塔の てっぺんで 音さを 鳴らした（光の 階段が 出た）
  gate1: 'c10d_gate1', // 1つめの 門の 番人に 勝った（門が 開いた。開いた まま）
  gate2: 'c10d_gate2',
  gate3: 'c10d_gate3',
  gate4: 'c10d_gate4',
  mirror: 'c10d_mirror', // 鏡に 勝った（幕の ボス）
  note: 'c10_note_do', // 金の 音（ド）
  bridge: 'c10d_bridge', // 星見の丘で 星の橋の 場面を 見た
  act4: 'c10_act4', // くぼ地の 8つめの 台（幕と 第2章の クリア）
};
// 第3幕 クリア（幕が 始まる 条件）
export const C10D_ACT3 = 'c10_act3';
export const C10D_LINE = [C10D.start, C10D.top, C10D.gate1, C10D.gate2, C10D.gate3, C10D.gate4, C10D.mirror, C10D.note, C10D.bridge, C10D.act4];
// 門の フラグ（じゅんばん。開いた 門は 開いた まま）
export const C10D_GATES = [C10D.gate1, C10D.gate2, C10D.gate3, C10D.gate4];

// ───── 星の いずみ（おどり場ごとに 1回きり。パーティーで 1つ。リーダーが えらぶ）─────
// えらんだ しるし（セーブする。線には 入れない）。門 4つと 合わせて 8こ
export const C10D_WELL = { w1: 'c10d_well1', w2: 'c10d_well2', w3: 'c10d_well3', w4: 'c10d_well4' };
export const C10D_WELLS = [C10D_WELL.w1, C10D_WELL.w2, C10D_WELL.w3, C10D_WELL.w4];
// 3つの めぐみ（えらぶ 問いの 答え）
export const C10D_BLESS = { heal: 'heal', mind: 'mind', power: 'power' };
export const C10D_BLESS_IDS = [C10D_BLESS.heal, C10D_BLESS.mind, C10D_BLESS.power];
export const C10D_BLESS_NAMES = { heal: 'いやしの水', mind: 'ちえの水', power: 'ちからの水' };
// ちからの水: 次の 戦いの 間、全員の 与える ダメージ 1.2倍（B班が 戦いの 側を 作る。A班は 下の しるしを 立てて わたす）
export const C10D_POWER_MULT = 1.2;
// ちからの水を えらんだ しるし（パーティーの 人の 戦いの 外の 状態。セーブしない。次の 戦いで 使うと 消える）
export const C10D_POWER_KEY = 'c10dPower';
// 3回 同じ 門で 負けると、その おどり場の いずみが もう 一度 だけ わく
export const C10D_REFILL_LOSSES = 3;
// くぼ地の 台に 置いた（小さな フラグ。幕の クリアで 消す。クリアの あとは c10_act4 で 光る）
export const C10D_PED = { do: 'c10_ped_do' };

// ───── マップの ID ─────
export const C10D_MAP = {
  stair1: 'c10d_stair1', // 星の 階段 1（門 1・いずみ 1）
  stair2: 'c10d_stair2', // 星の 階段 2（門 2・3・いずみ 2・3）
  stair3: 'c10d_stair3', // 星の 階段 3（門 4・いずみ 4）
  summit: 'c10d_summit', // いただき（幕の ボス）
};
export const C10D_MAP_IDS = Object.values(C10D_MAP);
export const C10D_STAIR_MAPS = [C10D_MAP.stair1, C10D_MAP.stair2, C10D_MAP.stair3];

// ───── 決まった 戦い（台本は ['battle', id]）─────
export const C10D_BATTLE = { gate1: 'c10d_gate1', gate2: 'c10d_gate2', gate3: 'c10d_gate3', gate4: 'c10d_gate4', mirror: 'c10d_mirror' };
export const C10D_GATE_BATTLES = [C10D_BATTLE.gate1, C10D_BATTLE.gate2, C10D_BATTLE.gate3, C10D_BATTLE.gate4];
// 魔物の id（先頭 c10d_）
export const C10D_MON_PREFIX = 'c10d_';
export const C10D_MON = { shard: 'c10d_shard', shardS: 'c10d_shard_s', mirare: 'c10d_mirare', copy: 'c10d_copy' };
export const C10D_BOSS_MON = { mirror: 'c10d_mirare' };
export const C10D_MIRROR_NAME = '光をはかる鏡　ミラーレ';
export const C10D_MIRROR_SHORT = 'ミラーレ';

// ───── 宝箱の id（B班が 中みを 決める。★5 は 3つ: おどり場の わきと いただき）─────
export const C10D_CHEST_IDS = ['c10d_c1', 'c10d_c2', 'c10d_c3', 'c10d_c4', 'c10d_c5', 'c10d_c6'];

// ───── だいじな 物（星の音）─────
export const NOTE_DO = 'note_do'; // 星の音・ド（金）

// ───── 曲の id（F班。client/audio-c10d.js）─────
export const C10D_TRACKS = {
  stairs: 'c10d_stairs', // 星の 階段（field.gateStage 0〜4）
  gate: 'c10d_gate', // 門の 番人
  mirror: 'c10d_mirror', // 鏡
  bridge: 'c10d_bridge', // 星の橋（止まる 所で 曲も 止まりきらない）
  seven: 'c10d_seven', // 7つの 音（短い）
};
export const C10D_TRACK_IDS = Object.values(C10D_TRACKS);
// 画面の 状態（F班の 曲）: field.gateStage（開けた 門の 数 0〜4）
export const C10D_GATE_MAX = 4;

// ───── タイルの 番号（shared/tiles.js の T に A が C10D_ で 足す）。591〜620 を この 幕に とって おく ─────
export const C10D_TILE_FIRST = 591;
export const C10D_TILE_LAST = 620;

// ───── 「音を鳴らす」の 6つの 音（B班。レ赤・ミ黄・ファ緑・ソ青・ラ白・シむらさき）─────
export const C10D_RING_NOTES = { note_re: 'red', note_mi: 'yellow', note_fa: 'green', note_so: 'blue', note_la: 'white', note_si: 'purple' };
export const C10D_RING_COLORS = ['red', 'yellow', 'green', 'blue', 'white', 'purple'];

// ───── すすめ Lv（16-3）─────
export const C10D_LV = { gate1: 115, gate2: 116, gate3: 116, gate4: 117, mirror: 118 };

// ───── 幕の 切りかえ ─────
export const C10D_OPEN = 'PART3_C10D_OPEN'; // data/story-c10.js
