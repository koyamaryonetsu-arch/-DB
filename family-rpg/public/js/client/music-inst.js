// 第77回 A: 楽器の プリセット（music-engine.js が つかう。Web Audio の ノードは ここでは 作らない）
//
// 1つの 楽器 = 1つの 音の 鳴り方。1音あたり オシレーターは 2つまで（osc と osc2）。
//   osc     … 'pulse25' | 'pulse12' | 'pulse50' | 'triangle' | 'sine' | 'sawtooth' | 'soft' | 'organ' | 'warm' | 'auto'
//             （'auto' … 古い チャンネルの w を そのまま つかう。pulse → pulse25、square → pulse50、saw → sawtooth）
//   osc2    … { type, detune（セント）, mix（0〜1）, oct（半音。12 = 1オクターブ上）} 厚み（ユニゾン）か 重ね（オクターブ・5度）
//   fm      … { ratio, index, decay } osc2 を かわりに 変調に つかう（ベル。osc2 と いっしょには つかわない）
//   a d s r … アタック・ディケイ（秒）・サステイン（0〜1）・リリース（秒）
//   vib     … { delay, rate（Hz）, depth（セント）} ビブラート（delay 秒 たってから かかる）
//   filter  … { type, f（Hz）, q, env（f に たす Hz）, decay（秒）, key（音の 高さに ついていく 割合 0〜1）}
//   gate    … 音の 長さの うち 鳴らす 割合（ふだん 0.92。スタッカートは 0.45 を かける）
//   gain    … 音量の そろえ（チャンネルの v に かける）
//   alt     … 自動アレンジの 3回目で つかう 楽器
//   ring    … true なら 音の 長さに かかわらず ディケイで 消える（ベル・はじく 音）

export const INSTRUMENTS = {
  // 歌う メロディ（パルス波 ＋ 少し ずらした 重ね ＋ ビブラート）
  lead: {
    osc: 'auto', osc2: { type: 'auto', detune: 8, mix: 0.6 },
    a: 0.008, d: 0.22, s: 0.72, r: 0.09,
    vib: { delay: 0.2, rate: 5.6, depth: 11 },
    filter: { type: 'lowpass', f: 3800, q: 0.7, env: 3000, decay: 0.2, key: 0.5 },
    gain: 1.8, alt: 'chip_lead',
  },
  // やわらかい メロディ（丸い 音 ＋ ゆれ）
  soft_lead: {
    osc: 'soft', osc2: { type: 'soft', detune: 6, mix: 0.5 },
    a: 0.025, d: 0.3, s: 0.78, r: 0.16,
    vib: { delay: 0.25, rate: 5.2, depth: 10 },
    gain: 0.8, alt: 'bell',
  },
  // ふえ（三角波 ＋ 1オクターブ上の 息）
  flute: {
    osc: 'triangle', osc2: { type: 'sine', oct: 12, mix: 0.22 },
    a: 0.035, d: 0.2, s: 0.86, r: 0.12,
    vib: { delay: 0.18, rate: 5.4, depth: 16 },
    gain: 0.97, alt: 'bell',
  },
  // ベル（FM。キラキラ のびて 消える）
  bell: {
    osc: 'sine', fm: { ratio: 3.5, index: 2.2, decay: 0.5 },
    a: 0.003, d: 1.1, s: 0, r: 0.5, ring: true, gate: 1,
    gain: 1.02, alt: 'soft_lead',
  },
  // オルゴール（高めの ベル。短い）
  musicbox: {
    osc: 'sine', fm: { ratio: 5, index: 1.2, decay: 0.25 },
    a: 0.002, d: 0.7, s: 0, r: 0.35, ring: true, gate: 1,
    gain: 1.28, alt: 'bell',
  },
  // マリンバ（木の 音）
  marimba: {
    osc: 'sine', fm: { ratio: 4, index: 0.9, decay: 0.06 },
    a: 0.002, d: 0.42, s: 0, r: 0.2, ring: true, gate: 1,
    gain: 1.64, alt: 'pluck',
  },
  // はじく 音（明るさが すぐ 下がる）
  pluck: {
    osc: 'auto', a: 0.002, d: 0.26, s: 0.12, r: 0.08,
    filter: { type: 'lowpass', f: 900, q: 1.2, env: 3600, decay: 0.12, key: 0.6 },
    gain: 3.37, alt: 'marimba',
  },
  // ストリングス（のこぎり波 2つ ＋ ゆっくり 立ち上がる）
  strings: {
    osc: 'sawtooth', osc2: { type: 'sawtooth', detune: 11, mix: 1 },
    a: 0.12, d: 0.5, s: 0.85, r: 0.35,
    vib: { delay: 0.3, rate: 5, depth: 6 },
    filter: { type: 'lowpass', f: 1500, q: 0.6, env: 500, decay: 0.4, key: 0.3 },
    gain: 0.86, alt: 'pad',
  },
  // パッド（やわらかい のばし）
  pad: {
    osc: 'warm', osc2: { type: 'warm', detune: 9, mix: 1 },
    a: 0.22, d: 0.6, s: 0.9, r: 0.5,
    filter: { type: 'lowpass', f: 1300, q: 0.5, env: 300, decay: 0.6, key: 0.2 },
    gain: 0.58, alt: 'strings',
  },
  // ブラス（ボス。ふくらむ 明るさ）
  brass: {
    osc: 'sawtooth', osc2: { type: 'sawtooth', detune: 6, mix: 0.8 },
    a: 0.035, d: 0.25, s: 0.8, r: 0.1,
    vib: { delay: 0.3, rate: 5.5, depth: 8 },
    filter: { type: 'lowpass', f: 700, q: 1, env: 2600, decay: 0.22, key: 0.5 },
    gain: 0.97, alt: 'saw_lead',
  },
  // シンセの リード（のこぎり波）
  saw_lead: {
    osc: 'sawtooth', osc2: { type: 'sawtooth', detune: 13, mix: 0.9 },
    a: 0.01, d: 0.2, s: 0.75, r: 0.1,
    vib: { delay: 0.22, rate: 5.8, depth: 12 },
    filter: { type: 'lowpass', f: 2200, q: 1.1, env: 1800, decay: 0.2, key: 0.4 },
    gain: 0.96, alt: 'lead',
  },
  // オルガン（ドローバーの 音を 1つの 波に）
  organ: {
    osc: 'organ', a: 0.012, d: 0.1, s: 0.95, r: 0.07,
    vib: { delay: 0.05, rate: 6.5, depth: 5 },
    gain: 0.86, alt: 'pad',
  },
  // ベース（しまった 低音）
  bass: {
    osc: 'triangle', osc2: { type: 'pulse50', mix: 0.32 },
    a: 0.005, d: 0.22, s: 0.72, r: 0.06,
    filter: { type: 'lowpass', f: 520, q: 1.4, env: 900, decay: 0.1, key: 0.4 },
    gain: 0.79, alt: 'sub_bass',
  },
  // サブベース（ひくく まるい）
  sub_bass: {
    osc: 'sine', osc2: { type: 'triangle', oct: 12, mix: 0.25 },
    a: 0.01, d: 0.3, s: 0.9, r: 0.08,
    gain: 0.76, alt: 'bass',
  },
  // ── ファミコンふう ──
  chip_lead: {
    osc: 'pulse25', a: 0.003, d: 0.12, s: 0.75, r: 0.03,
    vib: { delay: 0.16, rate: 6, depth: 18 },
    gain: 2.15, alt: 'lead',
  },
  chip_square: {
    osc: 'pulse50', a: 0.003, d: 0.12, s: 0.7, r: 0.03,
    gain: 0.84, alt: 'chip_lead',
  },
  chip_thin: {
    osc: 'pulse12', a: 0.003, d: 0.1, s: 0.7, r: 0.03,
    gain: 2.6, alt: 'chip_lead',
  },
  chip_tri: {
    osc: 'triangle', a: 0.003, d: 0.05, s: 1, r: 0.02,
    gain: 0.87, alt: 'bass',
  },
  chip_arp: {
    osc: 'pulse12', a: 0.002, d: 0.1, s: 0.3, r: 0.03,
    gain: 3.1, alt: 'pluck',
  },
};

export const INSTRUMENT_NAMES = Object.keys(INSTRUMENTS);

// 音量の ものさし: チャンネルの v は「square（50% の 四角い 波）で その v の 大きさ」。
// 古い チャンネルの w ごとの 大きさの ちがい（1音の RMS を はかった。pulse は 小さい）を v に かけて そろえる。
// 楽器の gain は、v = 0.1 で のびる 1音が square の 0.1 と 同じ RMS（-27 dBFS）に なる ように はかって きめた
// （ベル・はじく 音は 消えて いく ので 4〜5 dB 下。tools/audio-render.mjs --calib）
export const WAVE_LEVEL = { square: 1, triangle: 0.92, sine: 0.83, saw: 0.61, pulse: 0.36 };

// チャンネルの 役わり: lead（メロディ）・bass・harmony（それ以外）・drums
// 左右の ふり分け（-1 左 〜 1 右）。harmony は 順に 左・右・左…
export const ROLE_PAN = { lead: 0, bass: 0, drums: 0 };
export const HARMONY_PANS = [-0.45, 0.45, -0.3, 0.3];

// 残きょうへ おくる 量（役わりごと。曲の reverb に かける）
export const ROLE_SEND = { lead: 1, harmony: 1.1, bass: 0.12, drums: 0.3 };

// 古い チャンネル（w だけ）→ 新しい 楽器。role … 役わり、style … 'long'（のばし）・'short'（きざむ）・'mid'、high … 高い 音が 多い
export function defaultInstrument(w, role, { style = 'mid', high = false } = {}) {
  const wave = w || 'square';
  if (role === 'lead') {
    if (wave === 'pulse' || wave === 'square') return 'lead';
    if (wave === 'triangle') return 'flute';
    if (wave === 'sine') return 'soft_lead';
    if (wave === 'saw') return 'brass';
  }
  if (role === 'bass') {
    if (wave === 'sine') return 'sub_bass';
    return 'bass';
  }
  // harmony
  if (style === 'long') {
    if (wave === 'saw' || wave === 'square' || wave === 'pulse') return 'strings';
    return 'pad';
  }
  if (style === 'short') {
    if (wave === 'triangle' || wave === 'sine') return high ? 'musicbox' : 'marimba';
    return high ? 'chip_arp' : 'pluck';
  }
  if (wave === 'saw') return 'brass';
  if (wave === 'triangle' || wave === 'sine') return 'soft_lead';
  return 'organ';
}

// 夜の 楽器の かえかた（曲に night が ない ときに つかう）
export const DEFAULT_NIGHT = { lead: 'bell' };
