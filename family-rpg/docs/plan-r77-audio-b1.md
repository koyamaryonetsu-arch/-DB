# 第77回 B1 戦い・ボス・勝利の 曲の 作りなおし

> エンジンの やくそくは `docs/plan-r77-audio.md`（さわらない）。ここは B1 が 作った 5曲の 中み と はかった 数字。
> データ: `public/js/client/audio-r77a.js`（`R77A_TRACKS`）。テスト: `test/audio-r77b1.test.js`。

## 0. まとめ
- 同じ 13びょうを 何千回も 聞く のを やめる: 戦い 12.6びょう → 64びょう、ボス 11.7びょう → 61びょう で ひとまわり（イントロは 1回だけ）
- 戦いの 曲を 3つに: `battle`（第1部）・`battle2`（第2部 ＝ 第6〜8章）・`battle_strong`（強敵。ボスでは ない）。いつ 鳴らすかは チーム C
- 前の 動機を のこす: battle の A は 前の メロディ そのままの 頭（ミ ミ シ ミ ソ ファ# ミ シ）と 前の 和音（Em C D B）。boss の A は 前の「レ ファ ラ レ ド# …」。victory は 前の「ミ ソ ド … ミ … ド」
- 同じ 世界の 曲: battle・battle2・battle_strong の A は どれも「同じ 音 2つ → 4度 下 → もとの 音」の 頭。つなぎ（C）の 切った きざみ も 同じ 型
- 「前の音」では 前の データ（battle2・battle_strong は 前の battle）が 鳴る（`legacyOf: 'battle'`）
- オリジナル。ほかの ゲームや 作品の 曲は まねて いない

## 1. 曲ごとの 中み
形は みな イントロ →（A → A' → B（サビ）→ C（つなぎ））を くりかえす。`fill: 8`（8小節ごとに 自動フィル）。1小節 = 16（4/4）。

| id | キー | bpm | 形（小節） | ひとまわり | 楽器（パート） |
|---|---|---|---|---|---|
| battle | ホ短調 | 164（前 152） | intro 2 → A 8 → A' 8 → B 16 → C 12 | 64.4 びょう | lead（pulse）・bass・strings・chip_square（うら打ち）・pluck・たいこ |
| battle2 | ト短調 | 170 | intro 2 → A 8 → A' 8 → B 16 → C 12 | 62.1 びょう | lead（square）・bass・strings・chip_square・pluck（pulse）・たいこ |
| battle_strong | ハ短調 | 154 | intro 2 → A 8 → A' 8 → B 16（ハーフタイム）→ C 8 | 62.3 びょう | brass（メロディ）・bass・strings・brass（和音）・pluck（saw）・たいこ（タム 多め） |
| boss | ニ短調 | 172（前 164） | intro 4 → A 8 → A' 8 → B 16 → C 12 | 61.4 びょう | lead（pulse）・bass・brass（打ちこみ・うら打ち）・strings・pluck（saw）・たいこ |
| victory | ハ長調 | 144（前と 同じ） | main 2（`once`） | 3.33 びょう（前 3.33） | lead・brass（和音）・bass・musicbox（さいごの キラキラ）・たいこ（タム → シンバル） |

### 和音の 進み
- **battle**: intro Em B7 ／ A Em C D B7 Em Am C·D B（前の 曲と 同じ ならび）／ A' Em C Am B7 C D Em B7 ／ B C D Bm Em Am D G B7 ｜ C D B7 Em C Am B7 Em ／ C Em Em C C Am Am C C Am C B B
- **battle2**: intro Gm D ／ A Gm F Eb F Gm F Eb D（i VII VI VII … で 前へ 進む）／ A' Gm Eb Cm D Gm Bb Eb·D Gm ／ B Eb F Dm Gm Eb F Bb D ｜ Eb F Dm Gm Cm D Gm Gm ／ C Gm Gm Eb Eb Cm Cm Gm Gm Cm Eb D D
- **battle_strong**: intro Cm G ／ A Cm Cm Ab Bb Cm Cm Db G（Db = 半音上の 和音で きんちょう）／ A' Fm Cm Ab G Fm Cm Db G ／ B Ab Bb Eb Cm Ab Bb G G ｜ Fm G Eb Ab Fm Db G G ／ C Cm Cm Ab Ab Fm Fm G G
- **boss**: intro Dm Bb Eb A（ブラスの 打ちこみ）／ A Dm Bb Gm A Dm Bb Gm·A Dm（前の 曲と 同じ ならび）／ A' Dm Bb Gm A Eb C Bb A ／ B F C Dm Bb F C Bb A ｜ Gm A Dm Bb Gm Eb A A ／ C Dm Dm Bb Bb Gm Gm Eb Eb Dm Bb A A
- **victory**: C（Am）F G G7 C

### 区切りごとに かえた こと（ねむく ならない）
| | メロディ | ベース | たいこ | 厚み |
|---|---|---|---|---|
| A | 8分の きざみ（前の 動機） | 8分（battle オクターブ・battle2 3+3+2・strong 8分 同じ 音・boss 根音と 5度） | 8ビート（ロック） | うすい（和音か うら打ち 1つ） |
| A' | 同じ 頭で 上へ（boss は 1オクターブ上） | 8分 ＋ 4拍目に 16分 | こまかい ハイハット・ダブルの キック | はじく 音の アルペジオ（四分）・ブラスの 1拍目 |
| B（サビ） | のびる 歌（4小節の フレーズ・とんで もどる・フレーズの 終わりは 和音の 音） | 8分（strong は ハーフタイム） | ひらいた ハイハット・1小節目に シンバル（strong は ハーフタイム） | いちばん 厚い（和音 ＋ うら打ち ＋ アルペジオ） |
| C（つなぎ） | 短く 切った（スタッカート）頭の 動機 → さいごに かけあがる | ハーフタイム → 16分で もりあげる | タムの 型 → スネアの ロール | うすく して から ふやす |

- アクセント `!`・ゴースト `?`（ハイハット・つなぎの くりかえし音）・スタッカート `.`・和音 `[..]` を どの 曲にも つかう
- ベース・和音・アルペジオは 「和音の ならび × 1小節の 型」から 作る（`audio-r77a.js` の `gen`・`fillBar`。型の 中の 字 L H F X Y 0〜3）。強拍（0・8）は いつも 根音
- 強さ（`setIntensity`）: 戦いの 曲は 1 で 鳴る 前提。`layer` は つかって いない

### ボスの だん・ピンチ
- `phases`: 0 ニ短調 1.00 → 1 ホ短調（+2）1.04 → 2 ヘ短調（+3）1.07 → 3 ト短調（+5）1.10（172 → 189 bpm）。メロディの いちばん 上は F6 → だん 3 で Bb6
- `pinch`: ボス `D6 A5 D6 A5 Eb6 A5 D6 A5`（高い レ・ラを 8分で・半音上の ミb で ゆさぶる）。battle・battle2・battle_strong にも それぞれの キーで 書いた（主音と 5度・半音上・導音）

## 2. はかった 数字（`tools/audio-render.mjs`）
前 = 第77回 A の エンジンで 前の データ（作りなおす 前）。後 = 作りなおした 曲（`--write-trim` 2回の あと）。

| 曲 | | peak | RMS dB | 明るさ Hz | 出だし/s | 広がり | にてる | ノード/s |
|---|---|---|---|---|---|---|---|---|
| battle | 前 | 0.549 | -19.5 | 230 | 5.2 | 0.06 | 0.89 | 80 |
| | 後 | 0.618 | -18.1 | 245 | 6.3 | 0.05 | – | 88 |
| battle2 | 後 | 0.563 | -18.0 | 420 | 6.9 | 0.05 | – | 90 |
| battle_strong | 後 | 0.519 | -18.1 | 323 | 5.5 | 0.07 | – | 83 |
| boss | 前 | 0.431 | -19.5 | 176 | 6.2 | 0.03 | 0.90 | 89 |
| | 後 | 0.536 | -18.1 | 244 | 6.6 | 0.06 | – | 93 |
| victory | 前 | 0.421 | -22.9 | 334 | 3.9 | 0.10 | – | 22 |
| | 後 | 0.417 | -22.6 | 372 | 4.9 | 0.13 | – | 37 |

- peak は みな 0.98 より 下（いちばん 大きい battle 0.618）。`--adapt boss`（強さ → ピンチ → だん 1 → 夜 → 波）も peak 0.581
- 「にてる（1回目と 2回目）」は イントロの ある 曲では どうぐが はからない（–）。区切りは メロディ・ベース・たいこが みな ちがう（テストで たしかめる）
- ノード: `--nodes`（はじめの 20びょう）で 上位は phantom 101 ／ nocto_true 100 ／ battle 97 ／ boss 97。phantom を こえない。区切りごとでは boss の B（サビ）が いちばん 重い（にせの ctx で phantom の 1.1倍くらい。22びょう だけ）
- 明るさ: battle2 が 420 Hz と 高め（ト短調で メロディが G6 まで 上がる・square の リード）。うるさければ battle2 の lead の `w` を pulse に
- **音量（RMS）の 目標が -18.0 dB に なって いる**: `--write-trim` を この 5曲だけで 走らせると、目標は「えらんだ 曲の 前の音の 中央」（battle・boss の 前の音 = -18.0）に なる。ほかの 曲は -19.6 なので、戦いの 曲が 1.5 dB ほど 大きい。B2 と あわせた あとで メインが 全曲で `--write-trim`（2回）を すると -19.6 に そろう

## 3. たしかめた こと
- 区切りごとに 全チャンネルが 同じ 長さ（やすみの パートは 0）・小節の 倍数・ひとまわり 60〜90びょう・victory は 前と 同じ 3.33びょう
- 強拍（1拍目・3拍目）で メロディと ベースが 短2度・増4度・長7度に ならない: 5曲 とも 100%（4分ごとに 見ても 100%）
- キーから 外れた 音 なし（和声的短音階の 導音・ナポリの Db・ボスの Eb は 和音として 書いた 所だけ）
- 音の 高さ: メロディ G4〜G6、ベース G1〜F3、和音 Ab3〜A4、アルペジオ 〜D5、オルゴール 〜C7
- 「前の音」では 前の データ（`legacyChannels`）。battle2・battle_strong は 前の battle と 同じ
- battle2・battle_strong の `ch`（古い テスト用）は 自分の 楽譜を 前の 書き方に うつした もの（`oldView`。鳴らすのには つかわない）。前の battle と メロディが かさなる と「メロディーは ほかの 曲と ちがう」テスト（ch4〜ch5 の 11こ）が おちる ため
- `test/audio-engine-r77.test.js` は battle・boss が 区切りの 曲に なった ので、前の データだけの 曲（`legacyOnly`）で 見る ように なおした（中みは かえて いない）

## 4. 気を つける こと
- 耳で 聞いて いない（数字と 楽典の きまりだけ）。家族に「音楽を聞く」で 聞いて もらう
- `battle2`・`battle_strong` は まだ どこでも 鳴らない（つなぎこみは チーム C）。「音楽を聞く」に 出るのも 聞いた あと
- `audio-trim.js` は 2-の とおり 目標が ずれて いる ので、まとめた あとに 全曲で 書きなおす
