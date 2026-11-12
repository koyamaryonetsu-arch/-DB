# 第77回 音楽の エンジン（A）と 音楽を聞く（D）― チーム B・C との やくそく

> 設計は `docs/plan-design-r77.md` の 1。ここは できた もの と、つぎの チームが つかう 決まり（曲の 書き方・楽器・場面で かわる 音楽の API・はかり方）。

## 0. まとめ
- 83曲の データは そのまま。エンジンだけ 新しく した（楽器・残きょう・左右・コンプ・ドラム・強弱・自動アレンジ）
- 設定に「音楽の音：新しい音／前の音」「音の重さ：きれい／かるい」「音楽を聞く」
- 「前の音」は 第76回までと まったく 同じ 鳴らし方（`LegacyPlayer`。テストで 全曲の 予約を くらべて いる）
- 場面で かわる 音楽の API（強さ・ピンチ・だん・昼夜・まわりの音・文字の音）は エンジンに だけ ある。ゲームの できごとに つなぐのは チーム C

## 1. ファイル
| ファイル | 中み |
|---|---|
| `public/js/client/music-engine.js` | 楽譜の 読み方・曲の 組み立て（役わり・形・自動アレンジ）・`NewPlayer`（新しい音）・`LegacyPlayer`（前の音）・音の 通り道（コンプ・リミッター・残きょう）・たいこ・`AdaptiveState` |
| `public/js/client/music-inst.js` | 楽器の プリセット `INSTRUMENTS`・古い チャンネルの わりあて `defaultInstrument`・音量の ものさし `WAVE_LEVEL` |
| `public/js/client/music-amb.js` | まわりの音（波・風・市場・たき火・洞窟の しずく・雨） |
| `public/js/client/audio.js` | 曲の データ（今まで どおり）＋ `GameAudio`（ゲームから よぶ 所。中で `MusicEngine` を つかう） |
| `public/js/client/audio-trim.js` | 曲ごとの 音量の そろえ（dB・新しい音だけ）。**どうぐが 書く。手で なおさない** |
| `public/js/client/audio-names.js` | 曲の 名前 `TRACK_NAMES`（音楽を聞く） |
| `public/js/client/ui/soundtest.js` | 設定 →「音楽を聞く」 |
| `tools/audio-render.mjs` | 耳の かわりに はかる どうぐ（OfflineAudioContext で 書き出し） |
| `test/audio-engine-r77.test.js` | テスト |

`MusicEngine` は どの `BaseAudioContext` でも 動く（`new MusicEngine(ctx, destNode, { mode, quality, adaptive, trims, seed, offline })`）。`window` は さわらない ので node でも 読みこめる（AudioContext が なければ `GameAudio` は 何も 鳴らさない）。

## 2. 曲の 書き方（チーム B）

### 2-1. 今までの 書き方（そのまま 使える）
```js
battle: {
  bpm: 152,
  ch: [
    { w: 'pulse', v: 0.1, n: 'E5:2 E5:2 B4:2 …' },      // さいしょの メロディ = リード
    { w: 'triangle', v: 0.24, n: 'E2:2 E3:2 …' },       // いちばん 低い = ベース
    { w: 'square', v: 0.03, n: 'B4:16 G4:16 …' },       // そのほか = ハーモニー
    { drums: true, v: 0.55, n: 'k:2 h:2 s:2 h:2 …' },
  ],
},
```
`n` の 長さは 16分音符 いくつ分。`r` は やすみ。たいこの パートの `r` も やすみ。

### 2-2. 新しい 書き方（音符）
| 書き方 | いみ |
|---|---|
| `C5:4!` | アクセント（×1.35） |
| `C5:4?` | ゴースト・弱く（×0.5） |
| `C5:4~ C5:4` | タイ（同じ 音は 1つに つなぐ → 長さ 8） |
| `C5:4~ D5:4` | レガート（つぎの 音と すきま なし・立ち上がり やわらか） |
| `C5:4.` | スタッカート（長さの 45%） |
| `[C4 E4 G4]:8` | 和音（4音まで。音量は √音の数 で わる） |
| `C5:4!.` | しるしは いくつでも 重ねられる |

たいこ: `k` キック・`s` スネア・`h` ハイハット・`o` オープンハイハット・`c` シンバル・`p` クラップ・`t` `th` `tl` タム（中・高・低）・`R`（= `rim`）リム。`k:2!` `s:2?` も できる。

### 2-3. チャンネルの 項目
| 項目 | いみ | ふだん |
|---|---|---|
| `n` | 音符 | （いる） |
| `i` | 楽器（3 の 表） | `w` と 役わりから 自動 |
| `w` | 古い 波（`pulse` `square` `triangle` `sine` `saw`）。前の音 では これで 鳴る。`i` が ない ときは 楽器の えらび方にも つかう | – |
| `v` | 音量。**ものさしは「square（四角い 波）で その v」**。`w` が ある チャンネルは 波の 大きさの ちがい（`WAVE_LEVEL`: square 1・triangle 0.92・sine 0.83・saw 0.61・pulse 0.36）を かけて そろえる。`i` だけの チャンネルは そのまま。メロディ 0.08〜0.12、ベース 0.15〜0.2、ハーモニー 0.03〜0.06 くらい | 0.1 |
| `drums: true` | たいこの チャンネル | – |
| `role` | `lead` `bass` `harmony`（自動を 上書き） | 自動 |
| `pan` | 左右（-1〜1） | リード・ベース・たいこ 0、ハーモニー -0.45・0.45・-0.3・0.3 |
| `send` | 残きょうへ おくる 量（曲の `reverb` に かける） | リード 1・ハーモニー 1.1・ベース 0.12・たいこ 0.3 |
| `layer` / `minIntensity` | 強さが この 値 以上で 鳴る（`layer: n` = `minIntensity: n × 0.25`） | リード・ベース 0、ハーモニー 0.3、たいこ 0.55 |
| `oct` | オクターブ ずらす（新しい音だけ） | 0 |

役わりの 自動: たいこ以外で さいしょの チャンネル = `lead`、のこりで 平均の 高さが いちばん 低く MIDI 57（A3）より 下 = `bass`、ほか = `harmony`。

### 2-4. 曲の 項目
| 項目 | いみ | ふだん |
|---|---|---|
| `bpm` | テンポ | 120 |
| `once` | くりかえさない（ジングル） | false |
| `bar` | 1小節の 16分音符の 数（16 = 4/4、12 = 6/8・3/4） | たいこの キックの 場所から 自動 |
| `swing` | 8分の うらを おくらせる（0〜0.3） | 0 |
| `reverb` | 残きょう（0〜1。ダンジョンは 深め・町は 浅め） | ジングル 0.3・bpm 150 以上 0.16・96 より 下 0.34・ほか 0.24 |
| `fill` | n小節ごとに 自動フィルイン（小節の 後ろ 半分を スネア・タムに） | なし |
| `auto` | 自動アレンジ（2-6）。`false` で 止める | ch だけの くりかえす 曲は true、区切りの ある 曲・ジングルは false |
| `night` | 夜の 楽器の かえ方。キーは チャンネル番号・楽器名・役わり（この じゅんに さがす）。例 `night: { lead: 'bell', 2: 'pad' }` | `{ lead: 'bell' }` |
| `pinch` | ピンチの 重ね。`{ n: 'E6:2 F6:2 …', i: 'chip_arp', v: 0.035 }`（くりかえす） | 主音と 半音上を 高い 音で 8分に きざむ |
| `phases` | だんごとの `{ transpose（半音）, tempo（倍） }` | `[{0,1},{1,1.06},{2,1.12},{3,1.16}]` |
| `transpose` | 曲 ぜんたいを 半音 ずらす | 0 |
| `legacy` | 前の音 で 鳴らす データ `{ bpm, ch }`（作りなおした 曲の 前の データを ここに うつす） | – |

### 2-5. 区切り（イントロ → A → A' → B）
```js
battle: {
  bpm: 168, reverb: 0.18, swing: 0, fill: 8,
  parts: [                                   // チャンネルの 決まり（n なし）
    { i: 'lead', w: 'pulse', v: 0.1 },
    { i: 'bass', w: 'triangle', v: 0.22 },
    { i: 'strings', w: 'square', v: 0.04, layer: 1 },
    { drums: true, v: 0.55 },
  ],
  sections: {
    intro: { ch: ['E5:8 r:8', 'E2:16', '[E4 G4 B4]:16', 'k:4 k:4 k:4 c:4'] },
    A:     ['E5:2! E5:2 B4:2 …', 'E2:2 E3:2 …', 'B4:16 …', 'k:2 h:2 s:2 h:2 …'],
    B:     { bpm: 172, ch: [{ n: 'G5:4 …' }, 'C2:2 …', null, 'k:2 …'] },   // null は やすみ
  },
  form: ['intro', 'A', 'A', 'B'],
  loopFrom: 1,                               // イントロは 1回だけ。そのあと A A B を くりかえす
  legacy: { bpm: 152, ch: [ /* 前の battle の ch を そのまま */ ] },
},
```
- 区切りの 中の チャンネルは `parts` と 同じ じゅん。文字（音符だけ）か `{ n }`（ほかの 項目も 上書き できるが、ふつうは n だけ）。`null` は やすみ
- 区切りの 長さ = いちばん 長い チャンネル。**どの チャンネルも 同じ 長さで、小節（`bar`）の きりの よい 長さに**（短い ものは さいごが やすみに なる）
- 区切りに `bpm` を 書くと その 区切りだけ テンポが かわる
- 前の音 では: `legacy` が あれば それ、なければ `ch`、それも なければ 区切りを `form` の じゅんに つなげて 前の 鳴らし方で 鳴らす

### 2-6. 自動アレンジ（`auto`。前の 短い 曲を 4回で ひとまわりに）
| 回 | かわる こと |
|---|---|
| 1回目 | 書いた とおり |
| 2回目 | メロディに 1オクターブ上の 重ね（高い 曲は 下）・ハーモニーの 楽器を `alt` に・はじめに シンバル・さいごの 小節に フィル |
| 3回目 | うすく: スネア → リム・ハイハット 小さく・ハーモニー ×0.55・ベースは 短く・メロディの 楽器を `alt` に |
| 4回目 | メロディの 重ね・スネアに クラップ・はじめに シンバル・さいごに フィル |

同じ 曲・同じ 回なら いつも 同じ（キャッシュ・らんすう なし。テストで たしかめて いる）。

### 2-7. チーム B が 曲を 作りなおす ときの 手じゅん
1. 前の データを `legacy: { bpm, ch }` に うつす（「前の音」で 聞きくらべ できる ように）
2. `test/audio.test.js` など 全曲を 見る テストは `tr.ch` と 前の 音符の 書き方（`/^(r|[A-G][#b]?\d):\d+$/`）を 前提に して いる。区切りや 新しい 書き方を つかったら、その テストを `compileTrack(tr)`（`segs[name].parts` の 長さ・音）と `legacyChannels(tr)` で 見る ように なおす
3. 新しい 曲には `TRACK_NAMES`（audio-names.js）にも 名前を 書く（テストで 全曲 見る）
4. `node tools/audio-render.mjs --write-trim <曲の id…>` を 2回（音量を そろえる。2回目で ほぼ 0.5 dB 以内）→ `node tools/audio-render.mjs <id…>` で peak・RMS・にている 度合いを 見る

## 3. 楽器（`music-inst.js` の `INSTRUMENTS`）
1音の オシレーターは 2つまで（`osc` ＋ `osc2` か FM）。ビブラートは ノードを ふやさず detune の カーブ。

| 名前 | 音 | 向いている 所 | `alt` |
|---|---|---|---|
| `lead` | パルス波 ＋ 少し ずらした 重ね・ビブラート・明るさの 変化（波は `w` に したがう） | ふつうの メロディ | chip_lead |
| `soft_lead` | 丸い 波 ＋ ゆれ | やさしい メロディ | bell |
| `flute` | 三角波 ＋ 1オクターブ上の 息・ビブラート | ダンジョン・夜の メロディ | bell |
| `bell` | FM の ベル（のびて 消える） | 夜・キラキラ | soft_lead |
| `musicbox` | 高めの FM ベル（短い） | オルゴール・高い アルペジオ | bell |
| `marimba` | 木の 音（FM） | 低めの アルペジオ | pluck |
| `pluck` | はじく 音（明るさが すぐ 下がる） | アルペジオ・きざみ | marimba |
| `strings` | のこぎり波 2つ・ゆっくり 立ち上がる | のばしの 和音 | pad |
| `pad` | やわらかい のばし | 静かな 和音 | strings |
| `brass` | ふくらむ 明るさの のこぎり波 | ボス・ファンファーレ | saw_lead |
| `saw_lead` | シンセの リード | はげしい メロディ | lead |
| `organ` | ドローバーの オルガン | 町・教会・魔王 | pad |
| `bass` | 三角波 ＋ 四角い 波・しまった 低音 | ベース | sub_bass |
| `sub_bass` | ひくく まるい | 静かな 曲の ベース | bass |
| `chip_lead` | ファミコンの パルス（25%）・ビブラート | レトロな メロディ | lead |
| `chip_square` | ファミコンの 四角い 波（50%） | ハモリ | chip_lead |
| `chip_thin` | ほそい パルス（12.5%） | 高い ハモリ | chip_lead |
| `chip_tri` | ファミコンの 三角波 | ベース | bass |
| `chip_arp` | ほそい パルスの 短い 音 | 速い アルペジオ・ピンチの 重ね | pluck |

古い チャンネル（`w` だけ）の わりあて（`defaultInstrument`）:
- リード: pulse・square → `lead`、triangle → `flute`、sine → `soft_lead`、saw → `brass`
- ベース: sine → `sub_bass`、ほか → `bass`
- ハーモニー: 音の 長さの 平均 8 以上 → saw・square・pulse は `strings`、triangle・sine は `pad`／2.6 以下 → triangle・sine は `musicbox`（高い）か `marimba`、ほかは `chip_arp`（高い）か `pluck`／その間 → saw `brass`・triangle sine `soft_lead`・ほか `organ`

## 4. 仕上げ（音の 通り道）
曲 → チャンネル（音量・左右）→ ピンチの 明るさ（2.8 kHz のピーク）→ 明るさ（4.5 kHz から 上を +3 dB）→ コンプ（-20 dB・3:1）→ もどし → リミッター（-5 dB・20:1）→ やわらかい クリップ（0.97 まで）→ 音楽の 音量。
残きょうは 1つの ConvolverNode（その場で 作る 1.7びょうの ひびき）。まわりの音は コンプの 前に 入る。前の音は この 通り道を 通らず 音楽の 音量へ じかに（今までと 同じ）。

## 5. 場面で かわる 音楽の API（チーム C）
`game.audio`（`GameAudio`）を よぶ。**どれも 次の 小節の 頭で 効く**（音量の 変化は 40〜100ms の なめらかな ランプ・楽器の かえは 次の 音から なので プツッと ならない）。**「前の音」では 何も しない**（`blip` だけ いつもの `sfx('talk')`）。AudioContext が まだ ない ときも 値は おぼえて おく。

| API | いみ | 決まり |
|---|---|---|
| `setIntensity(x)` | 強さ 0〜1。チャンネルの `minIntensity` 以上で 鳴る（ふだん: リード・ベース 0、ハーモニー 0.3、たいこ 0.55、自動アレンジの 重ね 0.8） | **曲ごとに おぼえる**（戦いの あと ダンジョンの 曲に もどると その 値）。ほかの 曲は 1 から。`play()` の **あと** に よぶ |
| `setPinch(bool)` | 高い 音の 重ね ＋ 明るさ +4.5 dB | 曲が かわると OFF |
| `setPhase(n)` | だん 0〜3: キーを 上げる（すぐ）・テンポを 上げる（1小節ごとに 1/3 ずつ 近づく） | 曲が かわると 0 |
| `setTimeOfDay('day' \| 'night')` | 夜は 楽器を `night` の とおりに かえる・残きょう 深め・たいこ 小さめ・明るさ 少し 下げる | 曲が かわっても そのまま |
| `playAmbience(id)` / `stopAmbience()` | まわりの音 `waves` `wind` `market` `fire` `cave_drip` `rain`（音楽の 音量に したがう。1.5びょうで 入れかわる） | 曲とは べつ。`null` で 止める |
| `blip(seed)` | 会話の 文字の 音。`seed`（話す 人の 名前）で 高さが きまる（ドレミソラの 9つ。`blipFreq(seed)`） | `sfx('talk')` の かわりに |

つなぎ方の 例（チーム C）:
```js
// 戦い: HP が 3割を 切ったら ピンチ、ボスの 2だんめで キーを 上げる
g.audio.setPinch(hpRate < 0.3);
if (boss.phase === 2) g.audio.setPhase(1);
// ダンジョン: 階で パートを ふやす（1〜3階 静か → ボスの 前 ぜんぶ）
g.audio.play(map.bgm); g.audio.setIntensity(Math.min(1, 0.2 + floor * 0.2));
// フィールド: 昼夜
g.audio.setTimeOfDay(g.sky.isNight() ? 'night' : 'day');
// 町: g.audio.playAmbience('market') ／ 海辺: 'waves' ／ 出る ときは g.audio.stopAmbience()
// 会話: ui/script.js の sfx('talk') を g.audio.blip(speakerName) に
```
エンジンの 中では `AdaptiveState`（`want` → 小節の 頭で `latch()` → `cur`）。`engine.start()` で `onTrack(id)`。

## 6. 設定・保存
- `localStorage.kizuna_audio` に `engine: 'new' | 'old'`・`quality: 'fine' | 'light'`（今までの `music`・`sfx`・`silentPlay` と 同じ 所）
- 予約が まにあわず 本当に 音を 落とした（鳴らせなかった 音・小節）ことが 20びょうに 4回 あると、その 回だけ 自動で「かるい」（設定には「きれい（今は自動でかるい）」と 出る）。はじめの 10びょう（読みこみ中）と 画面が かくれて いる 間は 見ない（かくれて いる 間は 1.5びょう 先まで 予約。ふだんは 0.3びょう 先まで）
- 聞いた 曲: `localStorage.kizuna_heard` = `{ 曲の id: はじめて 聞いた 場所の 名前 }`（いちばん かんたん。この 機械だけ）。「音楽を聞く」は ここに ある 曲だけ 出す（「○/83曲」）

## 7. 性能
- 1音: オシレーター 1〜2・ノード 2〜5。残きょうは 全部で 1つ。チャンネルごとに 音量・左右・残きょうへの おくり（3つ）
- いちばん いそがしい 曲（phantom）の 1びょうあたりの 作る ノード: 前の音 54 ／ 新しい音（きれい）105 ／（かるい）72
- 「かるい」: ユニゾンの 重ね（osc2 の ずらし）と 残きょうと スネアの 胴・キックの クリックを 止める（オクターブの 重ね・FM は のこす）

## 8. はかり方（`tools/audio-render.mjs`）
ヘッドレスの chromium（Playwright）で `OfflineAudioContext` に 書き出して はかる。ゲームと 同じく 2びょう 先まで 予約しながら（`ctx.suspend`）。
```
node tools/audio-render.mjs                 # 全曲 前の音・新しい音（約3.5分）。われる・音が ない 曲が あれば exit 1
node tools/audio-render.mjs battle field    # えらんだ 曲
node tools/audio-render.mjs --wav <dir> battle   # WAV も
node tools/audio-render.mjs --write-trim    # 音量の そろえを 書く（2回）
node tools/audio-render.mjs --nodes         # ノードの かず（きれい・かるい）
node tools/audio-render.mjs --adapt battle  # 強さ → ピンチ → だん → 夜 → 波 を 1本に
node tools/audio-render.mjs --calib         # 楽器ごとの 1音の 大きさ
node tools/audio-render.mjs --raw …         # 仕上げを 通さない（しらべる とき）
node tools/audio-render.mjs --raw --solo 0 battle   # 1つの チャンネルだけ（前の音と 大きさを くらべる）
```
はかる もの: peak（0.98 より 下）・RMS（dBFS）・明るさ（スペクトルの 重心）・音の 出だしの 数／びょう（スペクトルの ながれ）・左右の 広がり（side/mid）・くりかえしの 1回目と 2回目の にている 度合い（帯の 強さの 相関。1 = 同じ）。

### 第77回の 結果（くりかえす 77曲。最小 ／ 中央 ／ 最大）
| | 前の音 | 新しい音 |
|---|---|---|
| peak | 0.26 ／ 0.55 ／ 0.79 | 0.31 ／ 0.43 ／ 0.68 |
| RMS dB | -22.5 ／ -19.6 ／ -16.9 | -19.8 ／ -19.6 ／ -19.5 |
| 明るさ Hz | 136 ／ 205 ／ 500 | 167 ／ 258 ／ 682 |
| 出だし／びょう | 0.9 ／ 3.0 ／ 8.4 | 1.5 ／ 3.3 ／ 8.6 |
| 広がり | 0 ／ 0 ／ 0 | 0.02 ／ 0.07 ／ 0.15 |
| 1回目と 2回目 | 0.90 ／ 0.98 ／ 1.00 | 0.80 ／ 0.91 ／ 0.94 |

われる 曲・音の ない 曲 0。ジングル 6曲は 前の音と ±0.1 dB。
例（前 → 新）: battle 明るさ 187→230 Hz・にている 0.92→0.89／field 225→270 Hz・0.95→0.90／c8b_temple 317→497 Hz・出だし 1.9→3.0・にている 0.99→0.84・広がり 0→0.15／c7_temple 436→619 Hz・0.99→0.87。
（新しい音の 音量は 前の音の 中央に そろえた。前の音の 曲の 音量の ばらつき 5.6 dB → 0.3 dB）

## 9. 気を つける こと
- 耳で 聞いて いない（数字だけ）。家族に「音楽を聞く」で 聞きくらべて もらう
- 明るさが いちばん 上がったのは 高い 音の 多い ダンジョン（c7_temple・c7i_castle・c8a_palace・c8b_temple・zenmai。オルゴール・マリンバの ハーモニー）。うるさければ その 曲に `i:` を 書いて 楽器を えらぶ（チーム B）
- `osc: 'auto'` の 楽器（lead・pluck）は 古い 波を そのまま つかう ので、音量は pulse で はかった gain に「pulse ÷ その 波の 大きさ」を かける（`v` の WAVE_LEVEL と 二重に ならない ように）
- `audio-trim.js` は エンジンや 曲を かえたら どうぐで 書きなおす
- 場面で かわる 音楽は「前の音」では 効かない（たしかめる ときは 新しい音で）
