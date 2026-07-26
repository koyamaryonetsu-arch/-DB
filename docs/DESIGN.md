# 星環の継承者 ―アストラル・レガシー― 設計ドキュメント

HEIRS OF THE ASTRAL RING — 16bit風・完全オリジナル・ブラウザRPG

本ドキュメントは開発指示書セクション34「最初の回答で行うこと」に対応する。

---

## 1. ゲーム仕様の理解

- 1990年代の家庭用機で遊ばれた王道ファンタジーRPGの**手触り**（テンポ・画面構成・ターン制コマンドバトル・職業/熟練度制）を、**完全オリジナルの世界観・名称・ビジュアル**で再構成する。
- 世界観: 空に浮かぶ光の輪「星環」が砕けて生まれた七つの「環晶」を巡り、辺境の島育ちの主人公が黒天帝国、そして真の黒幕「無貌の観測者」と対峙する物語。
- システムの柱:
  - 職業（基本職→専門職→融合職→伝説職）と 8 段階の熟練度ランク（見習い〜極星）
  - 技の継承（戦闘持込 8 枠、現職最低 4 枠、継承最大 4 枠、パッシブ最大 4）
  - 奥義ゲージ、連携技、環装（属性付与）→複合奥義
  - 昼夜サイクル、仲間モンスター、天候 等
- **今回の成果物は「縦切り版」**（セクション24）: タイトル→主人公作成→ルミナ村→ワールドマップ→星影の森→ボス「森喰いのバルグロウ」→最初の環晶が反応し北の帝国を目指すエンディングイベントまで。30〜60分。
  - パーティー: 主人公・ミレア・ガルドの3人
  - 基本職6種（環剣士/重装兵/星術師/生命官/気鋼闘士/影走り）+ 転職体験
  - 雑魚6種 + ボス1体、装備・道具・セーブ/ロード・レベル/熟練度/奥義ゲージ・連携技1種（双星交差）

## 2. 著作権上の類似を避ける方針

- **名称**: 呪文・特技・職業・モンスター・地名・人名はすべて本仕様書内の独自名称、または本実装で新規に作った名称のみを使う。既存作品の固有名詞（呪文名・技名・モンスター名等）は grep による自主検査対象とし、発見時は置換する。
- **ビジュアル**: 画像アセットは一切外部から持ち込まず、**全てコード内のパレット+ドット定義から実行時に生成**する。しずく型モンスター、顔だけの丸い体、既存作品特有の目・口・配色・輪郭・紋章は使わない。モンスターは「動物+植物」「動物+鉱物」「遺物+機械」など指示書15章の組み合わせ原則でデザインする。
- **音**: 既存の音楽・効果音は使用しない。WebAudio でオシレーターから合成した完全オリジナルの短いジングル/効果音のみ。
- **文章**: シナリオ・会話文はすべて書き下ろし。
- **フォント**: OS標準の等幅フォントスタックのみ使用（既存ゲームのフォントを同梱しない）。
- **構造**: マップ・町・ダンジョンはオリジナルレイアウト。UI は紺基調+銀枠+円環意匠で独自構成。

## 3. 技術構成

| 項目 | 採用技術 |
|---|---|
| 言語 | TypeScript (strict) |
| ゲームエンジン | Phaser 3 (WebGL/Canvas 自動) |
| ビルド | Vite |
| テスト | Vitest（コアロジックは Phaser 非依存の純関数群として分離） |
| Lint/Format | ESLint (flat config) + Prettier |
| データ | `src/data/*.json`（コードとデータを分離） |
| 保存 | localStorage（スロット3+オート1、バージョン+移行+改ざん検知+JSONエクスポート/インポート） |
| 解像度 | 内部 320×240・整数倍スケーリング・補間無効（image-rendering: pixelated） |
| 入力 | キーボード / ゲームパッド / タッチ仮想パッド + キーコンフィグ |
| 乱数 | シード指定可能な決定的 RNG（mulberry32） |

アーキテクチャ方針: `src/core/`（純ロジック、DOM/Phaser 非依存・全て単体テスト可能）と `src/game/`（Phaser 表示層）を厳密に分離。戦闘はコマンド入力→`resolveRound()` が**イベント列**を返し、表示層はそれを再生するだけの構造にする（テスト容易性と演出分離のため）。

## 4. ディレクトリ構成

```
/
├── index.html
├── package.json / tsconfig.json / vite.config.ts / eslint.config.js
├── docs/DESIGN.md
├── README.md
├── scripts/smoke.mjs          # Playwright によるスモークテスト
└── src/
    ├── core/                  # 純ロジック（Vitest 対象）
    │   ├── types.ts  rng.ts  registry.ts  stats.ts  leveling.ts
    │   ├── mastery.ts  skills.ts  inventory.ts  party.ts  daynight.ts
    │   ├── save.ts  scout.ts  newgame.ts
    │   └── battle/ engine.ts  damage.ts  status.ts  ai.ts  types.ts
    ├── data/                  # ゲームデータ（JSON）
    │   ├── gameConfig.json  elements.json  statusEffects.json
    │   ├── classes.json  skills.json  spells.json  monsters.json
    │   ├── items.json  equipment.json  encounters.json  maps.json
    │   ├── actors.json  dialogues.json  quests.json
    ├── game/                  # Phaser 表示層
    │   ├── main.ts  config.ts
    │   ├── gfx/    palettes.ts  pixels.ts  textures.ts
    │   ├── audio/  sound.ts
    │   ├── input/  controls.ts  touch.ts
    │   ├── ui/     window.ts  menuList.ts  dialogue.ts
    │   └── scenes/ Boot.ts Title.ts CharCreate.ts Field.ts events.ts
    │               Battle.ts Menu.ts Shop.ts JobChange.ts Settings.ts
    │               SaveLoad.ts Ending.ts
    └── tests/                 # Vitest ユニットテスト
```

## 5. 縦切り版の実装計画（フェーズ）

指示書32章の順で進め、各フェーズ末に `typecheck + test` を通す。

1. **フェーズ1**: プロジェクト初期化 / ディレクトリ / Phaser 起動 / タイトル画面 / 入力管理 / データ読み込み
2. **フェーズ2**: マップ表示 / 移動 / 衝突 / NPC会話 / マップ遷移（村→ワールド→森）/ 昼夜
3. **フェーズ3**: 戦闘画面 / ターン管理 / ダメージ計算 / 敵AI / 勝敗処理 / 奥義ゲージ / 連携技
4. **フェーズ4**: レベルアップ / 職業 / 熟練度 / 技習得 / 転職 / 技セット（継承制限）
5. **フェーズ5**: アイテム / 装備 / 店 / セーブ・ロード / 設定（キーコンフィグ・アクセシビリティ・難易度）
6. **フェーズ6**: オープニング・ボス・エンディングイベント / バランス調整 / スモークテスト / README

## 6. データ設計（要点）

- `classes.json`: `ClassDefinition`（category / statModifiers% / allowedWeapons / learnableSkills[rank] / passiveSkills / unlockConditions）
- `skills.json` + `spells.json`: 種別(physical/magical/heal/support/debuff)・属性・威力・対象・MP・命中・状態異常付与・バフ段階・タグ（連携判定用）・`inheritable` / `ougi`（職固有奥義は継承不可）
- `monsters.json`: `MonsterDefinition`（stats / resistances(属性倍率) / statusResist / aiPattern(条件ルール+重み表) / drops / jobExp / scout）
- `maps.json`: ASCII タイル行 + 凡例 + エンティティ（NPC/宝箱/遷移/イベント/エンカウントゾーン）
- `statusEffects.json`: 13種をデータ駆動（dot% / 行動不能率 / 詠唱封じ / 命中補正 / 持続 / ボス用耐性蓄積）
- セーブ: `{ version, checksum, playTime, map, party, inventory, flags, chests, daynight, settings, zukan(図鑑), ... }`

## 7. 最初に作成するファイル一覧（フェーズ1）

`package.json` `tsconfig.json` `vite.config.ts` `eslint.config.js` `.prettierrc` `.gitignore` `index.html` `src/core/types.ts` `src/core/rng.ts` `src/core/registry.ts` `src/data/*.json（13ファイル）` `src/game/main.ts` `src/game/config.ts` `src/game/gfx/*` `src/game/input/controls.ts` `src/game/ui/window.ts` `src/game/scenes/Boot.ts` `src/game/scenes/Title.ts` `src/tests/rng.test.ts`

## 8. 実装上のリスク

| リスク | 対策 |
|---|---|
| 320×240 での日本語可読性 | 等幅フォント10px+ウィンドウ余白を確保、文字速度設定 |
| ドット絵の工数 | パレット+文字列グリッドによる宣言的スプライト定義と左右反転/フレーム合成の自動化 |
| Phaser とテストの結合 | core/ を Phaser 非依存にし、戦闘はイベント列駆動 |
| セーブ互換性 | version + migration 関数登録制 |
| バランス崩壊 | 数値は data JSON に集約し、シード付き RNG でシミュレーションテスト |
| 既存作品との類似の混入 | 禁止名称の grep 検査・オリジナル名称表の管理（本書§2） |
| モバイル操作 | タッチ仮想パッドと大きめの当たり判定 |

## 9. テスト方針

- Vitest によるユニットテスト（すべてシード付き RNG で決定的に）:
  ダメージ計算 / 回復計算 / 属性倍率 / 状態異常成功率(耐性蓄積含む) / レベルアップ /
  職業熟練度上昇(弱い敵の減衰含む) / 転職条件 / 技の継承制限(8枠・現職4・継承4) /
  セーブ・ロード(往復・移行・改ざん検知・エクスポート/インポート) / アイテム使用 /
  戦闘不能と蘇生 / 逃走確率 / ボスフェーズ移行(根破壊・光熱暴走) / 連携技発動条件 /
  仲間モンスタースカウト率
- `tsc --noEmit` で型エラー 0 を維持、ESLint を CI 相当のローカルゲートとする
- Playwright + プリインストール Chromium による起動スモークテスト（タイトル表示・コンソールエラー0・スクリーンショット取得）

## 実装上の仮定（README にも記載）

- 縦切り版の転職は村の「星環神殿の分社」で行い、基本職6種を体験可能とする。
- 通貨は「セラ」、仲間モンスター/天候/融合職などはデータ構造のみ先行して用意し、UI は次期フェーズ。
- 図鑑・スカウトはコアロジック+テストのみ実装（縦切り版UIには出さない）。
