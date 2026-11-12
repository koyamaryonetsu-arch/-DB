# 第77回 B2: フィールド・町・洞窟・千年前の フィールド・第7章 第8章の ダンジョンの 曲の 作りなおし

> 曲は `public/js/client/audio-r77b.js`（`R77B_TRACKS`）。`audio.js` の `overlayTracks` が 前の 曲の 上に かぶせる。前の データは `legacy`（設定「前の音」）と `ch` に そのまま のこる。
> 設計は `docs/plan-design-r77.md` の 1。書き方の きまりは `docs/plan-r77-audio.md` の 2。曲は すべて オリジナル（ある ゲームの 曲を まねて いない）。

## 1. 書き方
- メロディは 手で 書く（1小節 = 16）。前の 曲の 動機（はじめの 2小節）を A の 頭に のこした
- ベース・きざみ・和音・アルペジオ・対旋律は 和音の ならび（1小節に `'D'` か `'Em A'`）から 小さな 道具で 作る（`bassLine`・`comp`・`arp`・`guide`・`pad`・`drums`）
- 形は どれも イントロ（1回だけ）→ A → A2（A'）→ B（サビ）→ br（つなぎ）→ A …（`loopFrom: 1`）
- 区切りごとに メロディ・和音の 進み・ベースの 型・たいこの 型・厚みを かえた。A2 は 頭の 3〜4小節だけ A と 同じ（動機を くりかえして かえる）
- 強拍（1拍目・3拍目）で メロディと ベースが 短2度・増4度・長7度で ぶつかる 所は 0（8曲 ぜんぶ）

## 2. 曲ごと
| id | 場所 | キー・音階 | bpm | 小節（イントロ / A / A2 / B / br） | ひとまわり | 楽器（メロディ ／ きざみ ／ そのほか） |
|---|---|---|---|---|---|---|
| field | ミドリナ地方 | ニ長調（サビに Gm の かり和音） | 132（前 132） | 4 / 16 / 16 / 12 / 4 | 87.3秒 | lead ／ pluck の うら打ち ／ strings・bell・たいこ。夜: flute・marimba・pad・musicbox |
| town | ルミナの町 ほか | ト長調（B7・E7・G7 の 寄り道）・スイング 0.12 | 120（前 116） | 2 / 8 / 8 / 16 / 4 | 72.0秒 | flute ／ pluck ／ marimba・organ。夜: bell・marimba・pad |
| cave | なげきの洞窟・海鳴りの洞窟・井戸 など | イ短調（Bb の ふしぎな 和音・E の 導音） | 108（前 84） | 2 / 8 / 8 / 12 / 4 | 71.1秒 | chip_square ／ marimba ／ bell・strings |
| past_field | 千年前の ミドリナ地方 | ニ長調（C の 古い ひびき） | 120（前 104） | 4 / 8 / 8 / 16 / 4 | 72.0秒 | flute ／ pluck の ハープ ／ strings・brass の 角笛。夜: soft_lead・bell・pad・flute |
| c7_temple | みどりの水の神殿 | ト長調 | 112（前 90） | 2 / 8 / 8 / 12 / 4 | 68.6秒 | lead ／ marimba の 16分（流れる 水）・はねる ベース（3+3+2） ／ bell・pad |
| c7i_castle | 氷の竜の城 | ロ短調（F# の 和音で 和声の 短音階） | 116（前 84） | 2 / 8 / 8 / 12 / 4 | 66.2秒 | saw_lead ／ musicbox の スタッカート（氷の つぶ）・走る ベース（ギャロップ） ／ brass・strings |
| c8a_palace | 月の王宮の地下迷宮 | ニ短調の 和声の 短音階（A の 上で Bb–C# の 増2度 ＝ 砂の 国の 音階・サビに Eb） | 108（前 88） | 2 / 8 / 8 / 12 / 4 | 71.1秒 | chip_lead（チャルメラの ような 鼻の 音）／ pluck（ウード）・ダルブッカふうの タム と リム ／ strings・pad |
| c8b_temple | よみの海底神殿 | ホ短調（B の 和音） | 104（前 84） | 2 / 8 / 8 / 12 / 4 | 73.8秒 | soft_lead ／ 低い pluck の きざみ・オルガンの 和音 ／ bell（青い 火） |

### 和音の 進み（A / B）
- field A: D G A D Bm G Em-A A ｜ D G A F#m-Bm G A D D。A2 は 6小節目 F#m。B: G A F#m Bm Em A D D G Gm Em7-A A。br: D Em G A
- town A: G Em C D G Em Am-D G。A2 は 5小節目 B7。B: C D Bm Em Am D G G7 C D Bm E7 Am D G G。br: G C Am D
- cave A: Am F C Dm Bb Am E Am。A2: Am F C G F Dm E E。B: Dm Am Bb F Dm Am Bb E F G E Am。br: Am Am F E
- past_field A: D G D A Bm G Em-A D。A2: D C G D Bm F#m G-A D。B: G A F#m Bm G A D D Em F#m G D G A Bm A。br: D C G A
- c7_temple A: G D Em C G Bm C D。A2: G D Em C Am D G G。B: C D Bm Em C D G G Am Bm C D。br: Em C Am D
- c7i_castle A: Bm G D A Bm Em F# F#。A2: Bm G D A G A F# Bm。B: G A F#m Bm G A D D Em F# Bm F#。br: Bm G Em F#
- c8a_palace A: Dm Bb A Dm Gm Dm Bb-A A。A2: Dm C Bb A Gm A Dm Dm。B: Bb C A Dm Bb C F A Gm Eb A A。br: Dm Dm Bb A
- c8b_temple A: Em C Am B Em C D B。A2: Em C Am B C D B Em。B: G D Em C Am B Em C Am D B B。br: Em Em C B

## 3. 強さの 段（ダンジョン・洞窟。チーム C との やくそく）
C は 最初の 階で 0.4、最後の 階で 1.0 を 送る。
| 強さ | 鳴る パート |
|---|---|
| 0 から | メロディ・ベース・きざみ（marimba / musicbox / pluck）・軽い たいこ（ハイハット・リム。c8a は タムと リムの ダルブッカふう）。c8b は オルガンの 和音も |
| 0.55 から | しっかりした たいこ（キック・スネア・クラップ。区切りの はじめに シンバル、さいごの 小節に フィル） |
| 0.8 から | 対旋律（bell・brass・strings の ガイドトーンの 線）・厚い 和音（pad・strings） |
- たいこは 2つの チャンネル（軽い ＝ 0、しっかり ＝ 0.55）。`fill` は つかわず フィルを 手で 書いた（エンジンの 自動フィルは さいしょの たいこの チャンネルに 入る ため）
- ダンジョンの 中は 昼夜で 楽器を かえない（`night: {}`。たいこ 小さめ・残きょう 深めは エンジンの まま）
- フィールド・町・千年前の フィールドは どの パートも 強さ 0 から（いつも ぜんぶ）

## 4. はかった 数字（`node tools/audio-render.mjs`。音量は `--write-trim --target -19.6` を 2回）
| id | 前の音（明るさ Hz・出だし/s） | 前の データを 新しい音で | 作りなおし 強さ 1（peak・RMS・明るさ・出だし・ノード/s） | 強さ 0.4（RMS・明るさ・出だし・ノード/s） |
|---|---|---|---|---|
| field | 226・4.3 | 270 Hz（第77回 A の 表） | 0.559・-19.4・557・5.3・89 | – |
| town | 187・3.9 | – | 0.551・-19.4・370・4.2・73 | – |
| cave | 190・1.1 | – | 0.659・-19.4・439・4.0・70 | -19.8・444・4.2・49 |
| past_field | 398・1.9 | 537・2.9 | 0.578・-19.3・386・4.3・60 | – |
| c7_temple | 439・2.0 | 620・2.7 | 0.630・-19.5・539・5.4・84 | -19.9・552・5.5・61 |
| c7i_castle | 308・2.6 | 527・3.5 | 0.738・-19.1・368・5.2・93 | -19.9・386・5.1・62 |
| c8a_palace | 316・2.3 | 503・3.1 | 0.598・-19.4・436・4.6・74 | -19.8・426・4.6・52 |
| c8b_temple | 319・2.0 | 497・3.0 | 0.570・-19.4・381・4.1・70 | -19.6・353・3.9・50 |
- peak は どれも 0.98 より 下（最大 0.738）。音の 出だしは 8曲 ぜんぶ 前より ふえた（前の音 1.1〜4.3 → 4.0〜5.4／びょう）
- ノードは 最大 93/びょう（c7i_castle）。いちばん 重い 曲 phantom（105）を こえない
- 強さ 0.4 では ノードが 3割 へり（パートが へる）、出だしは ほぼ 同じ（1階でも 拍が ある）。RMS は コンプで 0.2〜0.6 dB しか 下がらない
- ダンジョンの 明るさは 前の データを 新しい音で 鳴らした 時（497〜620 Hz）より 下がった（高い オルゴールの アルペジオを やめた）。field は 557 Hz で 明るめ
- 「1回目と 2回目の にている 度合い」は イントロの ある 曲では どうぐが はからない（`-`）。くりかえしの 中で A・A2・B・br が ちがう ことは テストで 見て いる

## 5. エンジン・どうぐの 小さな なおし
- `music-engine.js`: たいこの チャンネルが 2つ ある とき、片方が 強さで 止まると ハイハット（共通の 通り道）も 止まって いた。どれか 1つでも 鳴って いれば ハイハットを 鳴らす ように（たいこが 1つの 曲は 前と 同じ）
- `audio.js`: `overlayTracks` が 第5章〜第8章の 曲を まぜる 前に よばれて いて、past_field・c7_temple などは かぶせても 上書きされて いた。ファイルの 終わり（ぜんぶ まぜた あと）で よぶ ように
- `tools/audio-render.mjs`: `--intensity 0.4`・`--night`・`--target -19.6`（`--write-trim` の 目標。えらんだ 曲だけで はかると 目標が かわる ため）
- `test/audio-engine-r77.test.js`: 前の音の くらべは `legacy` の テンポ・チャンネルで（町は テンポが かわった）

## 6. 気を つける こと
- 耳で 聞いて いない（数字と 楽典の きまりだけ）。家族に「音楽を聞く」で 聞きくらべて もらう
- 夜の 楽器（field・town・past_field）は 曲ごとに 書いた。ダンジョンは `night: {}`
- 町の 環境音は 曲に 入れて いない（チーム C）
