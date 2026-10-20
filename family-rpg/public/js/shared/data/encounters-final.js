// 第5章 Step 9（B9）の きまった 戦い: ノクト（本気）と 魔王ソリトゥス（encounters.js で まぜる）
// 名前の 約束（docs/plan-ch5.md の 17）: A9 が 台本で ['battle', 'nocto_2']・['battle', 'solitus'] と 使う。
//   曲は A9 が 作る（nocto_true … ノクト本気・solitus … ソリトゥス）。まだ ない ときは 音が 鳴らないだけ（client/audio.js の play）
//   背景は B9（render/ch5-final-bg.js）: castle_top … 星のない広間。ソリトゥスの 第2段階から solitus_void（ひとりぼっちの闇）に かわる（battle-final.js）
//   どちらも 勝つと 台本が つづく（負けた ときは 今までの ボスと おなじ。loseOk なし）
export const FIXED_FINAL = {
  nocto_2: { group: [['nocto_2', 1, 1]], bg: 'castle_top', bgm: 'nocto_true', canFlee: false, boss: true },
  solitus: { group: [['solitus', 1, 1]], bg: 'castle_top', bgm: 'solitus', canFlee: false, boss: true },
};
