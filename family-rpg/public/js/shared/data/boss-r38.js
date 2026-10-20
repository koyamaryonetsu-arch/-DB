// 第38回 C: バフ・デバフが「3回行動のあいだ」に なった ぶんの ボスの 調整（docs/plan-r38.md の C・実装メモ）
//
// 前の 版では 補助（スクルト・スカラ・アイギスの守り など）が 30〜45びょう（仲間の 行動で 10回くらい）つづいていた。
// 3回行動に なると、守備力の 補助が かかっている 時間が へって、補助を あてに していた 強い ボス（第5章の 後半）の
// 勝率が 大きく 下がった（tools/sim-*.mjs）。補助の 強さを 上げても もどらなかった ので（3倍でも 足りない）、
// その ボスが 仲間に あたえる ダメージを 少し へらす（ボスの 強さの データは そのまま。戦いの はじめの 敵で きまる）
//
// 値 … 仲間が 受ける ダメージの 倍率（1 より 小さいほど やさしい）。ここに ない ボスは 1（かわらない）
export const R38_BOSS_DMG = {
  // 第5章 Step 4: ガイアイーター（頭・体・しっぽ）
  gaia_eater: 0.82, gaia_body: 0.82, gaia_tail: 0.82,
  // 第5章 Step 5: ノクトの影
  nocto_shadow: 0.92,
  // 第5章 Step 6・7: ノクト（1回目）
  nocto_1: 0.85,
  // 第5章 Step 8: モルガナのまぼろし（ストルム・イグニアは かわらない）
  phantom_morgana: 0.87,
  // 第5章 Step 9: ノクト（本気）・魔王ソリトゥス
  nocto_2: 0.9, solitus: 0.97,
  // 古代の大迷宮の 古竜オルドラ
  old_dragon: 0.93,
  // 第4章 Step 7: 砂の底の神殿の モルガナ（はじめの 3人と 本気の モルガナ）
  morgana: 0.85, morgana_true: 0.85,
  // サファラ闘技場の 王者（3戦目。1・2戦目の 魔物は かわらない）: ランク5・伝説の部 ランク6〜8
  ar_king: 0.92, ar_sharkking: 0.65, ar_prism: 0.72, ar_legend: 0.55, ar_disciple1: 0.55, ar_disciple2: 0.55,
  // 宝の洞窟の 主（ひみつのダンジョンの 番人にも 出る）
  tm_golem: 0.94, tm_king: 0.94, tm_dragon: 0.94, tm_knight: 0.94, tm_serpent: 0.94, tm_panther: 0.94,
};

// 戦いの はじめの 敵（species の 一覧）から、その 戦いの 倍率（いちばん 小さい もの）
export function bossDmgRate(speciesList) {
  let r = 1;
  for (const sp of speciesList || []) if (R38_BOSS_DMG[sp] !== undefined) r = Math.min(r, R38_BOSS_DMG[sp]);
  return r;
}
