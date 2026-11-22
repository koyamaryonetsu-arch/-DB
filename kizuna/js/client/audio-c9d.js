// 第93回 F: 第3部 第1章 第4幕「星のはかば」の 曲（audio.js が 前の 曲の 上に かぶせる。書き方は docs/plan-r77-audio.md の 2）
// 曲の せつめい（キー・形・はやさ・つなぐ 所）は docs/plan-part3-c9d.md の「実装メモ（第4幕 F班）」。
// 曲は すべて オリジナル（ほかの 作品の 曲を まねて いない。魔人の 曲も もとの 作品の メロディを 借りて いない）。
//   c9d_song（スピカの歌）は 星の子の 曲（c9a_child）の ふし〈ド・レ・ミ → ファ・ソ・ラ → シ、さいごは シ → ド〉を 中に もつ
//
// ・c9d_lane … ふたごの道（ニ短調 92。2本の 笛が 左右で よび合う かけ合い）。
//     画面の 状態 apartStage（0 スピカと いっしょ・1 はなれて いる）で、はなれると 右の 笛が 休み、ふしは 片方だけ（さびしく）
// ・c9d_grave … 星のはかば（ヘ長調 60。とても 静か。ベルが ぽつぽつ・オルゴールが かすかに こたえる。たいこ なし）
// ・c9d_mu … あそび歌のおいかけっこ（ト長調 128。オルゴールの あそび歌で 始まり、だんだん はげしく なる ボスの 曲。にくめない）。
//     戦いの 状態 muStage（0 1体・1 2体に 分かれた）で、ふしが 2つの 声の おいかけっこ（カノン。2小節 おくれ）に なる
// ・c9d_song … スピカの歌（ハ長調 76。7つの ふし〈1ふし 4小節〉で 1つの 歌）。画面の 状態 songStage（1〜7）の 数だけ 歌い、のこりは 伴そうだけ
// ・c9d_end … おちてきた星の子（ハ長調 72。第1章の おわり。53 秒。くり返さない。スピカの歌の 1ふしめ → あたたかく 広がる → シで 止まる ＝ 問いを のこす）
//
// メロディは 手で 書く。ベース・きざみ・和音・アルペジオは audio-c9a.js と 同じ 小さな 道具（C9A_TOOLS）で 作る
import { C9A_TOOLS } from './audio-c9a.js?v=8db07833986d';
import { C9C_TOOLS } from './audio-c9c.js?v=8db07833986d';

const { FLAT, bassLine, comp, arp, guide, pad, drums, rest, bars, oldView, FILL } = C9A_TOOLS;
const { shift, midiOfName } = C9C_TOOLS;

// ───────────── 小さな 道具 ─────────────
// どの 音も 弱く（ゴースト）
const ghost = (str) => str.trim().split(/\s+/).map((t) => (t.startsWith('r:') ? t : t.replace(/[!?]*$/, '?'))).join(' ');
// 小節の ならびを k 小節 回す（おいかけっこ: 2小節 おくれの 声。わの 形 ＝ くり返しても つながる）
const rotate = (list, k) => list.map((_, i) => list[(i - k + list.length) % list.length]);
// 小節の さいしょ・さいごの 音の 名前
const firstNote = (bar) => bar.trim().split(/\s+/).find((t) => !t.startsWith('r:')).split(':')[0];
const lastNote = (bar) => bar.trim().split(/\s+/).filter((t) => !t.startsWith('r:')).pop().split(':')[0];
const up = (n, d = 12) => {
  const m = midiOfName(n) + d;
  return `${FLAT[m % 12]}${Math.floor(m / 12) - 1}`;
};
const F = { sp: FLAT };

// ═════════════ c9d_lane: ふたごの道（ニ短調 92）═════════════
// 暗い ダンジョン。左の 笛（ふし）と 右の 笛（こたえ）が 1小節ずつ よび合う。7・8小節めだけ 2人 そろって（3度・6度で）歌う。
//   A よび合い → B 8分で さがす よび合い（ヘ長調の 明るさ）→ A2 左右が 入れかわる（右が よび、左が こたえる）
//   はなれて いる 時（apartStage 1）: 右の 笛は 休み。左の 笛だけが よびかけ、こたえの 小節は のばしの 和音だけ（返事が ない）。
//   ハープの しずくも 休み、たいこは リムだけ
const LANE = {
  intro: ['Dm', 'A'],
  A: ['Dm', 'Dm', 'Bb', 'C', 'Gm', 'A7', 'Dm', 'A7'],
  B: ['Bb', 'C', 'Am', 'Dm', 'Gm', 'C', 'F', 'A7'],
};
const LANE_A_CALL = [
  'D5:4! F5:4 A5:6 G5:2', 'r:16', 'F5:4! D5:4 Bb5:6 A5:2', 'r:16',
  'Bb5:4! A5:4 G5:4 D5:4', 'r:16', 'D5:4! F5:4 A5:8', 'E5:8! A5:8',
];
const LANE_A_ANS = [
  'r:16', 'A5:4! F5:4 D5:6 E5:2', 'r:16', 'G5:4! E5:4 C6:6 Bb5:2',
  'r:16', 'C#6:4! A5:4 E5:4 G5:4', 'F5:4 A5:4 D6:8', 'C#6:8 E5:8',
];
const LANE_B_CALL = [
  'D6:2! C6:2 Bb5:2 F5:2 D5:4 F5:4', 'r:16', 'C6:2! B5:2 A5:2 E5:2 C5:4 E5:4', 'r:16',
  'Bb5:2! A5:2 G5:2 D5:2 Bb4:4 D5:4', 'r:16', 'A5:4! C6:4 F6:8', 'E6:4! C#6:4 A5:8',
];
const LANE_B_ANS = [
  'r:16', 'E5:2! G5:2 C6:2 E6:2 G5:4 E5:4', 'r:16', 'D5:2! F5:2 A5:2 D6:2 A5:4 F5:4',
  'r:16', 'C5:2! E5:2 G5:2 C6:2 G5:4 E5:4', 'F5:4 A5:4 C6:8', 'C#6:4 A5:4 E5:8',
];
const LANE_DR = 'k:4! r:4 R:4? r:2 h:2?';
const LANE_DR_APART = 'R:4? r:12';

const c9dLane = {
  bpm: 92, bar: 16, reverb: 0.42, night: {},
  parts: [
    { i: 'flute', v: 0.1, role: 'lead', pan: -0.4 },
    { i: 'bass', v: 0.16, role: 'bass' },
    { i: 'flute', v: 0.085, role: 'harmony', minIntensity: 0, pan: 0.4 },
    { i: 'pluck', v: 0.04, role: 'harmony', minIntensity: 0, pan: -0.2 },
    { i: 'pad', v: 0.045, role: 'harmony', minIntensity: 0, pan: -0.05 },
    { drums: true, v: 0.3, minIntensity: 0 },
  ],
  sections: {
    // ── スピカと いっしょ（apartStage 0）──
    intro: [
      bars(['D5:8? r:8', 'r:16']),
      bassLine(LANE.intro, '1:16', { lo: 38, ...F }),
      bars(['r:16', 'r:8 A5:8?']),
      rest(2),
      pad(LANE.intro, { center: 58, ...F }),
      drums(2, 'r:16', { last: 'r:8 R:4? R:4' }),
    ],
    A: [
      bars(LANE_A_CALL),
      bassLine(LANE.A, '1:6! 5:2 1:8', { lo: 38, ...F }),
      bars(LANE_A_ANS),
      arp(LANE.A, '0:4? 1:4? 2:4? 1:4?', { center: 60, ...F }),
      pad(LANE.A, { center: 58, ...F }),
      drums(8, LANE_DR, { last: 'k:4! r:4 R:2 R:2 t:2 tl:2' }),
    ],
    // 8分で さがす
    B: [
      bars(LANE_B_CALL),
      bassLine(LANE.B, '1:4! 5:4 1:4 5:4', { lo: 38, ...F }),
      bars(LANE_B_ANS),
      arp(LANE.B, '0:2? 1:2? 2:2? 1:2? 0:2? 1:2? 2:2? 3:2?', { center: 60, ...F }),
      pad(LANE.B, { center: 60, ...F }),
      drums(8, 'k:4! h:2? h:2? R:4 h:2? h:2?', { last: 'k:4! h:2? R:2 R:2 R:2 t:2 tl:2' }),
    ],
    // 左右が 入れかわる
    A2: [
      bars(LANE_A_ANS),
      bassLine(LANE.A, '1:8! 5:8', { lo: 38, ...F }),
      bars(LANE_A_CALL),
      arp(LANE.A, '2:4? 1:4? 0:4? 1:4?', { center: 60, ...F }),
      pad(LANE.A, { center: 60, ...F }),
      drums(8, 'k:4! h:4? R:4? h:4?', { last: 'k:4! r:4 R:2 R:2 R:4' }),
    ],
    // ── はなれて いる（apartStage 1）: 右の 笛・ハープは 休み ──
    ai: [
      bars(['D5:8? r:8', 'r:16']),
      bassLine(LANE.intro, '1:16', { lo: 38, ...F }),
      rest(2),
      rest(2),
      pad(LANE.intro, { center: 58, mods: '?', ...F }),
      drums(2, 'r:16', { last: 'r:8 R:4? r:4' }),
    ],
    aA: [
      bars(LANE_A_CALL),
      bassLine(LANE.A, '1:16', { lo: 38, ...F }),
      rest(8),
      rest(8),
      pad(LANE.A, { center: 58, ...F }),
      drums(8, LANE_DR_APART),
    ],
    aB: [
      bars(LANE_B_CALL),
      bassLine(LANE.B, '1:8! 5:8', { lo: 38, ...F }),
      rest(8),
      rest(8),
      pad(LANE.B, { center: 60, ...F }),
      drums(8, LANE_DR_APART),
    ],
    // ひとりで 歩く（よびかけの ふしを もう一度。ハープの しずくが 1つぶずつ）
    aA2: [
      bars(LANE_A_CALL),
      bassLine(LANE.A, '1:16', { lo: 38, ...F }),
      rest(8),
      arp(LANE.A, 'r:12 2:4?', { center: 72, ...F }),
      pad(LANE.A, { center: 60, mods: '?', ...F }),
      drums(8, LANE_DR_APART),
    ],
  },
  form: ['intro', 'A', 'B', 'A2'],
  loopFrom: 1,
  // だん 0 ＝ スピカと いっしょ・だん 1 ＝ はなれて いる（テンポと 調は かえない。形だけ かわる）
  phases: [
    { transpose: 0, tempo: 1 },
    { transpose: 0, tempo: 1, form: ['ai', 'aA', 'aB', 'aA2'], loopFrom: 1 },
  ],
};

// ═════════════ c9d_grave: 星のはかば（ヘ長調 60）═════════════
// 魔物の 出ない しずかな 場所。とても おそく、音は 少ない。ベルが 1小節に 1〜2つ ぽつぽつ と 鳴り、
//   オルゴールが その 音を 1オクターブ 上で かすかに こたえる（ねむる 星が こたえる）。こわく ない・かなしすぎない（長調の 和音が 多い）。
//   A ぽつぽつ → B 少し 高く（あたたかい）。たいこは なし
const GRAVE = {
  intro: ['F', 'F'],
  A: ['F', 'Dm', 'Bb', 'F', 'Gm', 'Dm', 'Bb', 'C'],
  B: ['Dm', 'Bb', 'F', 'C', 'Bb', 'F', 'Gm', 'C'],
};
const GRAVE_A = [
  'C6:8! r:8', 'A5:8! r:4 D6:4?', 'D6:8! r:8', 'C6:12! r:4',
  'Bb5:8! r:4 G5:4?', 'A5:8! r:8', 'F5:8! r:4 D5:4?', 'E5:12! r:4',
];
const GRAVE_B = [
  'D6:8! r:8', 'F6:8! r:4 D6:4?', 'C6:8! r:4 A5:4?', 'G5:12! r:4',
  'F5:8! r:4 Bb5:4?', 'A5:8! r:4 C6:4?', 'Bb5:8! r:4 G5:4?', 'E5:8! G5:8?',
];
// ねむる 星の こたえ（ベルの はじめの 音を 1オクターブ 上で。小節ごとに おそく / はやく）
const answer = (list) => list.map((b, i) => {
  const n = firstNote(b);
  const m = midiOfName(n);
  const a = m + 12 <= 96 ? up(n) : n;
  return i % 2 ? `r:10 ${a}:2? r:4` : `r:6 ${a}:2? r:8`;
});

const c9dGrave = {
  bpm: 60, bar: 16, reverb: 0.55, night: {},
  parts: [
    { i: 'bell', v: 0.09, role: 'lead' },
    { i: 'sub_bass', v: 0.14, role: 'bass' },
    { i: 'pad', v: 0.06, role: 'harmony', minIntensity: 0, pan: -0.1 },
    { i: 'musicbox', v: 0.032, role: 'harmony', minIntensity: 0, pan: 0.25 },
    { i: 'strings', v: 0.03, role: 'harmony', minIntensity: 0, pan: -0.15 },
  ],
  sections: {
    intro: [
      bars(['r:16', 'r:8 C6:8?']),
      bassLine(GRAVE.intro, '1:16', { lo: 33, ...F }),
      pad(GRAVE.intro, { center: 62, ...F }),
      bars(['r:4 A6:2? r:10', 'r:12 F6:2? r:2']),
      rest(2),
    ],
    A: [
      bars(GRAVE_A),
      bassLine(GRAVE.A, '1:16', { lo: 33, ...F }),
      pad(GRAVE.A, { center: 62, ...F }),
      bars(answer(GRAVE_A)),
      `${rest(4)} ${guide(GRAVE.A.slice(4), 'x:16', { center: 57, ...F })}`,
    ],
    B: [
      bars(GRAVE_B),
      bassLine(GRAVE.B, '1:16', { lo: 33, ...F }),
      pad(GRAVE.B, { center: 64, ...F }),
      bars(answer(GRAVE_B)),
      guide(GRAVE.B, 'x:16', { center: 57, ...F }),
    ],
  },
  form: ['intro', 'A', 'B'],
  loopFrom: 1,
};

// ═════════════ c9d_mu: あそび歌のおいかけっこ（ト長調 128）═════════════
// 魔人は ねむる 星たちの 夢から 生まれた、あそびたい 子ども。にくめない。
//   イントロ … オルゴールが あそび歌を ひとりで（おそめ 104）
//   A あそび歌（四角い 波）→ B ホ短調の「もっと あそぼう」→ C あそび歌に オルゴールが 1オクターブ 下で かさなる・たいこ しっかり
//   → D 8分で かけまわる（いちばん はげしい）。A へ もどる
//   2体に 分かれた 時（muStage 1 → だん 1）: ふしが 2つの 声の おいかけっこ（カノン）。
//     オルゴールが 四角い 波を 2小節 おくれで おいかける。和音は 2小節で 1まわり（G ／ C D）なので、おくれても にごらない。
//     cI ぽんっと 分かれる → cA あそび歌の カノン → cB 2つめの あそび歌の カノン → cC・cD 前と 後ろが 入れかわる（はげしく）
const MU2 = ['G', 'C D', 'G', 'C D', 'G', 'C D', 'G', 'C D'];
const MU = {
  intro: MU2.slice(0, 4),
  A: MU2,
  B: ['Em', 'C', 'Am', 'B7', 'Em', 'C', 'D', 'D7'],
  D: ['G', 'Em', 'C', 'D', 'G', 'Em', 'Am D', 'G'],
  cI: ['G', 'D7'],
};
// あそび歌（8小節。奇数の 小節は G・偶数の 小節は C → D の 上で 書いた）
const MU_SONG = [
  'D5:2! G5:2 G5:2 B5:2 A5:4 G5:4', 'E5:2! G5:2 C6:2 E5:2 D5:2! F#5:2 A5:4',
  'D5:2! G5:2 B5:2 D6:2 C6:4 B5:4', 'C6:2! B5:2 A5:2 G5:2 F#5:4! A5:4',
  'B5:2! D6:2 B5:2 G5:2 D5:4 G5:4', 'E5:2! G5:2 E5:2 C5:2 D5:4 F#5:4',
  'G5:2! B5:2 D6:2 G6:2 D6:4 B5:4', 'C6:2! E6:2 C6:2 A5:2 A5:4! F#5:4',
];
// 2つめの あそび歌（「こっち、こっち」。8分で。同じ 和音の 上）
const MU_SONG2 = [
  'B5:2! A5:2 G5:2 A5:2 B5:2! D6:2 B5:2 G5:2', 'C6:2! E6:2 C6:2 G5:2 A5:2! F#5:2 D5:2 F#5:2',
  'G5:2! B5:2 D6:2 G6:2 D6:2! B5:2 G5:2 B5:2', 'E6:2! C6:2 G5:2 E5:2 F#5:2! A5:2 D6:2 A5:2',
  'D6:2! B5:2 G5:2 D5:2 G5:2! B5:2 D6:2 B5:2', 'C6:2! G5:2 E5:2 G5:2 D6:2! A5:2 F#5:2 A5:2',
  'B5:2! G5:2 D5:2 G5:2 B5:2! D6:2 G6:2 D6:2', 'E6:2! C6:2 A5:2 C6:2 D6:2! A5:2 F#5:2 D5:2',
];
const MU_B = [
  'B5:2! A5:2 G5:2 E5:2 G5:4! B5:4', 'C6:2! B5:2 A5:2 G5:2 E5:4! G5:4',
  'A5:2! C6:2 E6:2 C6:2 A5:4! E5:4', 'D#6:4! C6:2 B5:2 A5:4! F#5:4',
  'G5:2! B5:2 E6:2 B5:2 G5:4! E5:4', 'E5:2! G5:2 C6:2 G5:2 E6:4! C6:4',
  'D6:2! C6:2 B5:2 A5:2 F#5:4! A5:4', 'C6:4! A5:4 F#5:4 D5:4',
];
const MU_D = [
  'G5:2! B5:2 D6:2 B5:2 G5:2! D5:2 G5:2 B5:2', 'E5:2! G5:2 B5:2 G5:2 E6:2! B5:2 G5:2 E5:2',
  'C6:2! E6:2 G6:2 E6:2 C6:2! G5:2 E5:2 G5:2', 'D6:2! F#6:2 A6:2 F#6:2 D6:2! A5:2 F#5:2 A5:2',
  'B5:2! D6:2 G6:2 D6:2 B5:2! G5:2 D5:2 G5:2', 'G5:2! E5:2 B4:2 E5:2 G5:2! B5:2 E6:2 B5:2',
  'A5:2! C6:2 E6:2 C6:2 A5:2! F#5:2 D5:2 F#5:2', 'G5:4! D5:4 G5:4! r:4',
];
const MU_LAG = 2;
const OOMPAH = '1:4! 5:4 1:4 5:4';

const c9dMu = {
  bpm: 128, bar: 16, reverb: 0.2, fill: 0,
  parts: [
    { i: 'lead', w: 'square', v: 0.075, role: 'lead', pan: -0.15 },
    { i: 'bass', v: 0.18, role: 'bass' },
    { i: 'musicbox', v: 0.075, role: 'harmony', minIntensity: 0, pan: 0.25 },
    { i: 'marimba', v: 0.045, role: 'harmony', minIntensity: 0, pan: -0.2 },
    { i: 'strings', v: 0.035, role: 'harmony', minIntensity: 0, pan: 0 },
    { drums: true, v: 0.42, minIntensity: 0 },
  ],
  sections: {
    // ── 1体（だん 0）──
    // オルゴールの あそび歌（ひとりで。おそめ）
    intro: {
      bpm: 104,
      ch: [
        rest(4),
        bassLine(MU.intro, '1:8? r:8', { lo: 43 }),
        bars(MU_SONG.slice(0, 4)),
        rest(4),
        pad(MU.intro, { center: 62, mods: '?' }),
        drums(4, 'r:16', { last: 'r:8 t:2? t:2? th:2 tl:2' }),
      ],
    },
    A: [
      bars(MU_SONG),
      bassLine(MU.A, OOMPAH, { lo: 43 }),
      arp(MU.A, 'r:8 2:2? 1:2? 0:4?', { center: 84 }),
      comp(MU.A, 'r:4 x:4. r:4 x:4.', { center: 66 }),
      pad(MU.A, { center: 60 }),
      drums(8, 'k:4! h:4? s:4 h:4?', { last: 'k:4! h:4? s:2 s:2 t:2 tl:2' }),
    ],
    // もっと あそぼう（ホ短調）
    B: [
      bars(MU_B),
      bassLine(MU.B, '1:2.! r:2 5:2. r:2 1:2.! r:2 5:2. r:2', { lo: 40 }),
      arp(MU.B, '0:2? 1:2? 2:2? r:2 0:2? 1:2? 2:2? r:2', { center: 79 }),
      comp(MU.B, 'x:2.! r:2 r:4 x:2.! r:2 r:4', { center: 64 }),
      guide(MU.B, 'x:8 x:8', { center: 64 }),
      drums(8, 'k:4! h:2 h:2 s:4 h:2 k:2', { last: 'k:2! r:2 k:2! r:2 s:2 s:2 c:4!' }),
    ],
    // あそび歌に オルゴールが かさなる（はげしく なって いく）
    C: [
      bars(MU_SONG),
      bassLine(MU.A, '1:2! 8:2 5:2 8:2 1:2! 8:2 5:2 8:2', { lo: 43 }),
      bars(MU_SONG.map((b) => ghost(shift(b, -12)))),
      comp(MU.A, 'r:2 x:2. r:2 x:2. r:2 x:2. r:2 x:2.', { center: 66 }),
      guide(MU.A, 'x:4 x:4 x:8', { center: 67 }),
      drums(8, 'k:2! h:2 s:2! h:2 k:2 k:2 s:2! h:2', { first: 'c:2! h:2 s:2! h:2 k:2 k:2 s:2! h:2', last: FILL }),
    ],
    // かけまわる（いちばん はげしい）
    D: [
      bars(MU_D),
      bassLine(MU.D, '1:2! 8:2 5:2 8:2 1:2! 8:2 5:2 8:2', { lo: 40 }),
      arp(MU.D, '2:4? r:4 1:4? r:4', { center: 84 }),
      comp(MU.D, 'x:2.! r:2 x:2. r:2 x:2.! r:2 x:2. r:2', { center: 64 }),
      pad(MU.D, { center: 62 }),
      drums(8, 'k:2! k:2 s:2! h:2 k:2! k:2 s:2! p:2', { first: 'c:2! k:2 s:2! h:2 k:2! k:2 s:2! p:2', last: 'k:2! k:2 s:2! s:2 t:2 t:2 tl:2 c:2!' }),
    ],
    // ── 2体（だん 1）: おいかけっこ ──
    // ぽんっと 分かれる
    cI: [
      bars(['G5:4! B5:4 D6:8', 'C6:4! A5:4 F#5:8']),
      bassLine(MU.cI, ['1:4! r:4 1:4 5:4', '1:2 1:2 1:2 1:2 5:8!'], { lo: 43 }),
      bars(['r:4 G5:4 B5:4 D6:4', 'r:4 C6:4 A5:4 F#5:4']),
      comp(MU.cI, 'x:2.! r:2 x:2.! r:2 x:4! r:4', { center: 64 }),
      pad(MU.cI, { center: 60 }),
      drums(2, 'c:4! r:4 k:4 r:4', { last: 'k:2! k:2 s:2 s:2 t:2 t:2 th:2 tl:2' }),
    ],
    cA: [
      bars(MU_SONG),
      bassLine(MU.A, OOMPAH, { lo: 43 }),
      bars(rotate(MU_SONG, MU_LAG)),
      comp(MU.A, 'r:4 x:4. r:4 x:4.', { center: 64 }),
      pad(MU.A, { center: 60 }),
      drums(8, 'k:4! h:2? h:2? s:4 h:2? h:2?', { last: 'k:4! h:2 h:2 s:2 s:2 t:2 tl:2' }),
    ],
    cB: [
      bars(MU_SONG2),
      bassLine(MU.A, '1:4! 5:2 8:2 1:4 5:4', { lo: 43 }),
      bars(rotate(MU_SONG2, MU_LAG)),
      comp(MU.A, 'x:2.! r:2 r:4 x:2.! r:2 r:4', { center: 64 }),
      guide(MU.A, 'x:8 x:8', { center: 64 }),
      drums(8, 'k:4! h:2 h:2 s:4 h:2 k:2', { last: 'k:2! r:2 k:2! r:2 s:2 s:2 c:4!' }),
    ],
    // 前と 後ろが 入れかわる（オルゴールが 前・四角い 波が おいかける）
    cC: [
      bars(rotate(MU_SONG, MU_LAG)),
      bassLine(MU.A, '1:2! 8:2 5:2 8:2 1:2! 8:2 5:2 8:2', { lo: 43 }),
      bars(MU_SONG),
      comp(MU.A, 'r:2 x:2. r:2 x:2. r:2 x:2. r:2 x:2.', { center: 64 }),
      pad(MU.A, { center: 62 }),
      drums(8, 'k:2! h:2 s:2! h:2 k:2 k:2 s:2! h:2', { first: 'c:2! h:2 s:2! h:2 k:2 k:2 s:2! h:2', last: FILL }),
    ],
    cD: [
      bars(rotate(MU_SONG2, MU_LAG)),
      bassLine(MU.A, '1:2! 1:2 8:2 1:2 5:2! 5:2 8:2 5:2', { lo: 43 }),
      bars(MU_SONG2),
      comp(MU.A, 'x:2.! r:2 x:2. r:2 x:2.! r:2 x:2. r:2', { center: 64 }),
      guide(MU.A, 'x:4 x:4 x:8', { center: 67 }),
      drums(8, 'k:2! k:2 s:2! h:2 k:2! k:2 s:2! p:2', { first: 'c:2! k:2 s:2! h:2 k:2! k:2 s:2! p:2', last: 'k:2! k:2 s:2! s:2 t:2 t:2 tl:2 c:2!' }),
    ],
  },
  form: ['intro', 'A', 'B', 'C', 'D'],
  loopFrom: 1,
  // だん 0 ＝ 1体・だん 1 ＝ 2体に 分かれた（おいかけっこ。テンポを 少し 上げる）
  phases: [
    { transpose: 0, tempo: 1 },
    { transpose: 0, tempo: 1.04, form: ['cI', 'cA', 'cB', 'cC', 'cD'], loopFrom: 1 },
  ],
  // ピンチ: 主音（ソ）と 半音上（こまって いるのに どこか おかしい）
  pinch: { n: 'G6:2 Ab6:2 G6:2 D6:2 G6:2 Ab6:2 G6:2 B6:2', i: 'chip_arp', v: 0.03 },
};

// ═════════════ c9d_song: スピカの歌（ハ長調 76）═════════════
// 7つの ふし（1ふし 4小節）で 1つの 歌。星の音を 1つ 集める たびに 1ふし ふえる（画面の 状態 songStage 1〜7 → だん 0〜6）。
//   歌える ふしは 笛（スピカの 声）が 歌い、まだ の ふしは 伴そう（ベース・のばし・ハープ）だけ。ベルが その ふしの はじめの 音を かすかに 鳴らす（まだ 歌えない ふしの かげ）。
//   1 ミから 始まる（ミ・ソ・ラ・ソ … ソで 止まる ＝ 問い）
//   2 こたえ（ミで やすむ）
//   3 星の子の ふし（c9a_child と 同じ ド・レ・ミ → ファ・ソ・ラ → シ。7つの 星の音を 1つずつ）
//   4 1 を 高く（シで 止まる ＝ c9a_child の「シで とまる」さびしさ）
//   5 ニ短調・ホ短調へ（「ながされたの…？」の かげ。ソ# で ホ長調の 和音に 止まる）
//   6 あたたかく のぼる（いちばん 高い ミ）
//   7 1 に もどり、さいごは シ → ド（c9a_child の「シ → ド」で とけて あたたかく おわる）
//   7つ そろうと 1つの 歌（28小節）。くり返しは 1ふしめから
const SONG = {
  intro: ['C', 'F'],
  chords: [
    ['C', 'Am', 'F', 'G'],
    ['C', 'Am', 'Dm G', 'C'],
    ['Am', 'F', 'Em', 'F G'],
    ['C', 'Am', 'F', 'G'],
    ['Dm', 'Em', 'F', 'E'],
    ['F', 'G', 'Em Am', 'Dm G'],
    ['C', 'Am', 'F G', 'C'],
  ],
  phrases: [
    ['E5:6! G5:2 A5:4 G5:4', 'E5:6! D5:2 C5:8', 'D5:4! E5:4 F5:4 A5:4', 'G5:12 r:4'],
    ['E5:6! G5:2 C6:4 B5:4', 'A5:6! G5:2 E5:8', 'F5:4! E5:4 D5:4 G5:4', 'E5:12 r:4'],
    ['C5:6! D5:2 E5:8', 'F5:6! G5:2 A5:8', 'B5:8! G5:4 E5:4', 'A5:4! G5:4 F5:4 D5:4'],
    ['E5:6! G5:2 C6:4 E6:4', 'D6:6! C6:2 A5:8', 'F5:4! A5:4 C6:4 A5:4', 'B5:12 r:4'],
    ['A5:6! F5:2 D5:8', 'G5:6! E5:2 B4:8', 'C5:4! F5:4 A5:4 C6:4', 'B5:12! G#5:4'],
    ['C6:6! A5:2 F5:8', 'D6:6! B5:2 G5:8', 'E6:4! D6:4 C6:4 B5:4', 'A5:4! F5:4 G5:4 D6:4'],
    ['E5:6! G5:2 A5:4 G5:4', 'E5:6! D5:2 C5:4 A5:4', 'A5:4! G5:4 D6:4 B5:4', 'C6:16'],
  ],
};
const SONG_N = SONG.phrases.length;
// 伴そう（歌う 時も 歌わない 時も 同じ）。ベルは 歌う 時は ふしの さいごの 音を 1オクターブ 上で こだま、歌わない 時は はじめの 音の かげ
const songAcc = (k, sung) => {
  const ch = SONG.chords[k];
  const ph = SONG.phrases[k];
  const bell = sung
    ? ['r:16', 'r:16', 'r:16', `r:8 ${up(lastNote(ph[3]))}:8?`]
    : [`${up(firstNote(ph[0]))}:4? r:12`, 'r:16', 'r:16', 'r:16'];
  return [
    bassLine(ch, k === 6 ? ['1:8! 5:8', '1:8! 5:8', '1:8! 5:8', '1:16'] : '1:8! 5:8', { lo: 36 }),
    pad(ch, { center: 62 }),
    arp(ch, '0:2 1:2 2:2 1:2 0:2 1:2 2:2 3:2', { center: 64 }),
    bars(bell),
  ];
};
const songSections = { intro: [
  rest(2),
  bassLine(SONG.intro, '1:16', { lo: 36 }),
  pad(SONG.intro, { center: 62 }),
  // ハープが 星の子の 7つの 音を 下から 1つずつ（c9a_child の イントロと 同じ 形）
  bars([arp(['C'], '0:2 1:2 2:2 3:2 4:2 3:2 2:2 1:2', { center: 64 }), 'C5:2 D5:2 E5:2 F5:2 G5:2 A5:2 B5:4']),
  bars(['r:16', 'r:8 E6:8?']),
] };
for (let k = 0; k < SONG_N; k++) {
  songSections[`s${k + 1}`] = [bars(SONG.phrases[k]), ...songAcc(k, true)];
  songSections[`a${k + 1}`] = [rest(4), ...songAcc(k, false)];
}
// songStage n（1〜7）の 形: イントロ → はじめの n ふしを 歌い、のこりは 伴そう → くり返しは 1ふしめから
export const songForm = (n) => {
  const s = Math.max(1, Math.min(SONG_N, Math.floor(Number(n) || 1)));
  return ['intro', ...Array.from({ length: SONG_N }, (_, k) => (k < s ? `s${k + 1}` : `a${k + 1}`))];
};

const c9dSong = {
  bpm: 76, bar: 16, reverb: 0.45, night: {},
  parts: [
    { i: 'flute', v: 0.11, role: 'lead' },
    { i: 'sub_bass', v: 0.15, role: 'bass' },
    { i: 'pad', v: 0.04, role: 'harmony', minIntensity: 0, pan: -0.2 },
    { i: 'pluck', v: 0.04, role: 'harmony', minIntensity: 0, pan: 0.25 },
    { i: 'bell', v: 0.035, role: 'harmony', minIntensity: 0, pan: -0.05 },
  ],
  sections: songSections,
  form: songForm(1),
  loopFrom: 1,
  // だん k ＝ songStage k + 1（テンポと 調は かえない。歌う ふしの 数だけ かわる）
  phases: Array.from({ length: SONG_N }, (_, k) => ({ transpose: 0, tempo: 1, form: songForm(k + 1), loopFrom: 1 })),
};

// ═════════════ c9d_end: おちてきた星の子（ハ長調 72。第1章の おわり。くり返さない）═════════════
// 16小節 = 53.3 秒。静かに 始まり（のばしと ベル）→ スピカの歌の 1ふしめ（笛）→ あたたかく 広がる（弦・タム）
//   → 1ふしめを 1オクターブ 上で（いちばん 大きく）→ ファ → ソの 和音で、ふしは シで 止まる（ドへ 帰らない ＝ 問いを のこす）
const END = {
  intro: ['Am', 'F'],
  S: SONG.chords[0],
  W: ['F', 'G', 'Em', 'Am'],
  P: SONG.chords[0],
  Q: ['F', 'G'],
};
const END_W = ['A5:6! G5:2 F5:4 A5:4', 'B5:6! A5:2 G5:4 D6:4', 'E6:6! D6:2 B5:8', 'C6:4! B5:4 A5:8'];
const END_Q = ['C6:8! A5:8', 'B5:16'];

const c9dEnd = {
  bpm: 72, bar: 16, once: true, reverb: 0.5,
  parts: [
    { i: 'flute', v: 0.11, role: 'lead' },
    { i: 'sub_bass', v: 0.15, role: 'bass' },
    { i: 'pad', v: 0.045, role: 'harmony', minIntensity: 0, pan: -0.15 },
    { i: 'strings', v: 0.035, role: 'harmony', minIntensity: 0, pan: 0.2 },
    { i: 'bell', v: 0.035, role: 'harmony', minIntensity: 0, pan: -0.05 },
    { drums: true, v: 0.28, minIntensity: 0 },
  ],
  sections: {
    intro: [
      rest(2),
      bassLine(END.intro, '1:16', { lo: 33 }),
      pad(END.intro, { center: 60, mods: '?' }),
      rest(2),
      bars(['r:8 E6:8?', 'r:4 C6:4? r:8']),
      rest(2),
    ],
    // スピカの歌の 1ふしめ
    S: [
      bars(SONG.phrases[0]),
      bassLine(END.S, '1:8! 5:8', { lo: 36 }),
      pad(END.S, { center: 62 }),
      rest(4),
      bars(['r:16', 'r:16', 'r:16', 'r:8 G6:8?']),
      drums(4, 'r:16', { last: 'r:12 tl:2? tl:2' }),
    ],
    // あたたかく 広がる
    W: [
      bars(END_W),
      bassLine(END.W, '1:8! 5:4 8:4', { lo: 36 }),
      pad(END.W, { center: 62 }),
      guide(END.W, 'x:8 x:8', { center: 67 }),
      rest(4),
      drums(4, 'tl:4? r:12', { last: 'tl:4? r:4 t:2 t:2 th:2 tl:2' }),
    ],
    // 1ふしめを 高く（いちばん 大きく）
    P: [
      bars(SONG.phrases[0].map((b) => shift(b, 12))),
      bassLine(END.P, '1:4! 5:4 8:4 5:4', { lo: 36 }),
      pad(END.P, { center: 64 }),
      guide(END.P, 'x:4 x:4 x:8', { center: 69 }),
      bars(['C7:4? r:12', 'r:16', 'r:16', 'r:16']),
      drums(4, 'k:4? r:4 tl:4? r:4', { first: 'c:4! r:4 tl:4? r:4', last: 'k:4? r:4 tl:2 tl:2 c:4' }),
    ],
    // ソの 和音で 止まる（問い）
    Q: [
      bars(END_Q),
      bassLine(END.Q, '1:16', { lo: 36 }),
      pad(END.Q, { center: 62 }),
      guide(END.Q, 'x:16', { center: 67 }),
      bars(['r:16', 'r:8 B6:8?']),
      drums(2, 'r:16'),
    ],
  },
  form: ['intro', 'S', 'W', 'P', 'Q'],
};

for (const tr of [c9dLane, c9dGrave, c9dMu, c9dSong, c9dEnd]) tr.ch = oldView(tr);

// テストが 見る: スピカの歌の 7つの ふしと 和音・おいかけっこの ふしと おくれ・ふたごの道の よび合い
export const C9D_SONG = SONG;
export const C9D_MU_SONGS = { song: MU_SONG, song2: MU_SONG2, lag: MU_LAG };
export const C9D_LANE_LINES = { aCall: LANE_A_CALL, aAns: LANE_A_ANS, bCall: LANE_B_CALL, bAns: LANE_B_ANS };

// 曲の id は docs/plan-part3-c9d.md の 12-4（かえない）
export const C9D_TRACKS = {
  c9d_lane: c9dLane,
  c9d_grave: c9dGrave,
  c9d_mu: c9dMu,
  c9d_song: c9dSong,
  c9d_end: c9dEnd,
};
export const C9D_IDS = Object.keys(C9D_TRACKS);
