# 第67回: モンスター闘技場（2026-11-07 家族が 決めた）

## 家族が 決めた こと

- **新しい 建物**「モンスター闘技場」。魔物が 仲間に なる ころから 遊べる（`monster_bond`。第1章の 森の主の あと）
- 戦うのは **自分が 育てた 魔物だけ**（人は 戦わない）。**4ひき**。動き方は ふだんと 同じ（その 魔物の 作戦。「めいれいさせろ」なら 自分で コマンドを 選ぶ）
- **ランク戦**: ランク F〜S（物語が 進むと 開く）＋ あとで 伝説の部。1つの ランクは 休みなしの 3連戦（サファラ闘技場と 同じ 形）
- **家族どうしの 対戦**（両方 作る）
  1. **登録チームと 戦う**: 家族が 登録した 4ひきと、いつでも 戦える（相手の 魔物は 作戦で 動く。相手が 遊んで いなくても よい）
  2. **その場の 対戦（リアルタイム）**: 2人とも 闘技場に 行って、申しこむ → 申しこまれた 人が うける → おたがい コマンドを 選んで 戦う
- **パーティー選びは ストレスなく**: 戦う 前に いつでも 4ひきを 選びなおせる。登録チーム・前回の チーム・おまかせ（強い 順）から 1回で 選べる。登録チームも 戦う 前に かえられる
- 家族対戦の 強さは **申しこむ 時に えらぶ**:「そのままの 強さ」か「レベルを そろえる（みんな 同じ レベル）」

## 作り方（班）

- **A班（建物と 画面）**: マップ・人・受付の 画面・チームを 選ぶ 画面・登録・ランクの 一覧・結果・王者のかべ（あれば）。サーバーの 窓口は B班の 約束（下）を 使う
- **B班（戦いと ランク）**: 魔物だけの 戦い・ランクの データと 強さ・ごほうび・記録・登録チームとの 戦い（相手は 作戦で 動く）・レベルを そろえる
- **C班（リアルタイム対戦）**: A・B を まとめた あとで 作る（申しこみ・うける・おたがいの コマンド・相手の 画面）

## 名前の 約束（A・B 共通。かえない）

- 建物の 中の マップ id: `monarena`（A）。入口は **ルミナの町**（A が 場所を 決めて 実装メモに 書く）
- 開く フラグ: `monster_bond`
- サーバーの 窓口（B が 作る。A は これを よぶ）: `svc` の `kind: 'monarena'`、`action` は
  - `'status'` → `{ ok, ranks: [{ rank, name, open, cleared, lv, hint }], team: [key…]（前回）, reg: [key…]（登録）, monsters: [{ key, name, species, level, hp, mp, atk, def, agi, where: 'party'|'wagon'|'storage' }], family: [{ charId, name, reg: [{ species, name, level }] }] }`
  - `'setTeam'` `{ team: [key ×1〜4] }`（前回の チームとして おぼえる）・`'register'` `{ team: [key ×1〜4] }`（登録チーム）
  - `'rank'` `{ rank, team: [key…] }` → ランク戦（3連戦）を はじめる
  - `'family'` `{ charId, team: [key…], even: true|false }` → 家族の 登録チームと 戦う（even … レベルを そろえる）
- 魔物の key: 仲間 `c.companions[].key`・あずかり所 `c.storage[].key`（どちらからも 選べる。B が たしかめる）
- キャラに のこす もの（B）: `c.monArena = { r: { [rank]: { n, at } }, team: [key…], reg: [key…], regSnap: [...], fam: { [charId]: { w, l } } }`（なくても よい。むかしの セーブも そのまま）
- ファイルの しるし: A は `monarena-a`（`maps/monarena.js`・`client/ui/monarena.js` など）、B は `monarena`（`data/monarena.js`・`world/monarena.js`・`shared/battle-monarena.js` など）
- お知らせ・README は さわらない（まとめる 時に 書く）。ほかの 人が 使う ファイルは **足すだけ**

## A班の 実装メモ（建物と 画面）

- **入口**: ルミナの町の **東門を 出て すぐ 北**（町の かべ〈町の x=47〉と 森の あいだ）。石の たてもの 7×6・赤い やね・かんばん（ぶっちがいの 剣「モンスター闘技場」）。
  とびら … `MONARENA_DOOR`（フィールドの x=84, y=35。町の 左上から x+52, y+13）。とびらから 東門の 道（町の y=19）まで 石の 道。
  まわり（x 80〜88, y 27〜40）は 魔物が 出ない（`safe:monarena`）・場所の 名前は「ルミナの町」（町の 曲）。千年前の マップには 出さない（`attachCh6` の あとで たす）
- **中**（`maps/monarena-a.js`。マップ id `monarena`・26×16・曲は カジノと 同じ）: 上に 観客せき、まん中に さくで かこんだ 砂の 戦いの 場（魔物の 像 2つ）、
  下に 赤い じゅうたんと 出口。受付は 3人（カウンターごし）
  - 左 `mona_desk`「ランク戦の受付」（だいほん `monarena_desk` → 画面 mode `rank`）
  - 右上 `mona_family`「家族対戦の係」（`monarena_family` → mode `family`）・右下 `mona_reg`「チーム登録の係」（`monarena_reg` → mode `reg`）
  - どの 受付も 同じ 画面（はじめの カーソルだけ ちがう）。`monster_bond` の 前は「魔物の心に まだ 目覚めていない」と 話すだけ
  - ほか: 魔物使いのタクトと けいこ中の ぷるりん・ツノうさぎ（monster_bond の あと）、観客 3人、かんばん（出口の 左）
- **だいほん**: `data/story-monarena-a.js`（story.js の さいごで まぜる。ひとりずつ）。画面は `['call', openMonArena(mode)]` → `['ui', 'monarena', { mode, name, keeper }]`
- **画面**: `client/ui/monarena.js`（`ui/services.js` の `openServiceUI` に `case 'monarena'` を 足した）・きまりだけの `client/ui/monarena-team.js`（テストでも 読む）
  - はじめ: ランク戦にちょうせん / 家族の登録チームと戦う / チームを登録する / その場で家族と対戦（じゅんび中。えらべない）/ 闘技場のきまり / やめる
  - ランク戦: ランクの 一覧（★勝ちぬいた・Lv〇くらい・まだ）。右に 目安の レベル・ヒント。まだの ランクを 選ぶと ヒントを 話す
  - 家族対戦: `status.family` の 自分 いがいで 登録が ある 人 → 相手の 4ひき（絵・Lv）→「そのままの強さ／レベルをそろえる／やめる」→ 4ひきを 選ぶ
  - 4ひきを 選ぶ（戦う たびに かならず 出す）: わく 4つ（名前・Lv・HP 攻 守 速・いる所）＋ 1回で 選ぶ（★前回のチーム・★登録チーム・★おまかせ〈強い順〉）＋「このチームで戦う！」。
    はじめは 前回 → 登録 → おまかせ の 順で 入る（登録の 時は 登録 → 前回 → おまかせ）。そろって いれば カーソルは「戦う」に（A 1回で はじめられる）。
    わくを 選ぶと「↑1つ前にする／チームからはずす／入れかえる魔物（強い順。パーティー・馬車・あずかり所 ぜんぶ。チームの 魔物は『チーム2』の しるし）」。
    チームの 魔物を 選ぶと 場所の 入れかえ。キーボード・ゲームパッド（ListMenu）・タッチ どれでも
  - 登録: 4ひきを 選ぶ →「このチームを登録する」→ `register`
- **B班の 窓口の よびかた**（`svc kind:'monarena'`）
  - 画面を 開くと `status`（へんじが `ok` で ない 時は「今は受付のじゅんびをしているところ」と 話して とじる）
  - 戦う 前に `setTeam { team }`（前回の チーム）→ 受付の ことば → **画面を とじて、受付の だいほんが おわってから** `rank { rank, team }` / `family { charId, team, even }` を 送る
    （受付の だいほんの 間〈s.busy === 'script'〉に 戦いを はじめない ため。へんじが `ok: false` で `text` が あれば トーストで 出す）
  - `register { team }` の へんじの `text` を 受付の ことばに 出す（なければ「チームを登録したよ！」）。へんじに `reg` が あれば それを 使う
  - `status.monsters[]` は `{ key, name, species, level, hp, mp, atk, def, agi, where }`（`def` … 守備力。`where` … 'party'|'wagon'|'storage'）。`ranks[].rank` は そのまま `rank` で 返す
- **C班（リアルタイム対戦）の 入口**: `client/ui/monarena.js` の `MONARENA_EXTRA` に `{ value: 'live', label, hint, show?(ctx), run: async (ctx) => 'started' | undefined }` を 足すと、
  「その場で家族と対戦（じゅんび中）」の 行の かわりに 出る。`ctx` には `game, ct（Counter）, st（status）, svc(msg), pickTeam(opts), startFight(msg, line)` が ある
- **ためしの スタブ（まとめる 時に けす）**: `client/ui/monarena-a-stub.js` と、`client/ui/monarena.js` の `svc()` の 中の `if (globalThis.__monarenaStub) { … }`。
  `globalThis.__monarenaStub = true` の 時だけ 読む（ふだんは 読まない）。にせの ランク 7つ・魔物 8ひき・家族 2人
- **結果・王者のかべ**: 結果の 画面は 作っていない（戦いと ごほうびは B班の 戦いの 画面）。ランクの 一覧の「★勝ちぬいた」が 記録。王者のかべは なし
- テスト: `test/monarena-a.test.js`（入口まで 歩ける・とびら・中の 人と かんばん・受付の だいほん・チーム選びの きまり・窓口の よびかた）
- ブラウザで 見た（Playwright・スタブ）: 入口・中・受付・はじめの 画面・ランクの 一覧・まだの ランク・4ひきを 選ぶ・入れかえ・家族対戦（強さを 選ぶ）・おまかせ・登録・スマホ たて 390×844

## B班の 実装メモ（戦いと ランク）

- **ファイル**: `shared/battle-monarena.js`（魔物だけの 戦い・C班も 使う）・`shared/data/monarena.js`（ランク・ごほうび・記録）・`shared/world/monarena.js`（窓口・3連戦・家族の 対戦）・
  `tools/sim-monarena.mjs`（強さの シミュレーター）・`test/monarena.test.js`
- **ほかの ファイルに 足した もの**（少しだけ）: `world/services.js`（`case 'monarena'`）・`world/battles.js`（`battleTick`・`abortBattle` が `ctx.finish` が あれば それを よぶ）・
  `world/save.js`（`repairMonArena`）・`data/encounters.js`（`import './monarena.js'` … 王者の 色ちがいを 画面でも とうろく）・
  `data/variants.js`（`ensureVariantId` を 足した）・`client/battle.js`（戦いの はじめに 知らない 色ちがいの ID を とうろく。家族の 色ちがいの 仲間が 敵の がわに 出る 時）・`tools/kanji-check.mjs`
- **戦い**: 人は 戦わない。自分の 魔物（仲間・馬車・酒場・あずかり所 どこからでも）の **写し**（`monFighterChar`）で 戦う → もとの 仲間の HP・MPは へらない。
  ランク戦は 戦いの 前に 写しを 満タンに・3連戦の 間は 回復しない・にげられない・道具は 使える（めいれいさせろの 魔物が 自分の ふくろから）。家族の 対戦は 道具なし
  - 作戦で 動く。「めいれいさせろ」の 魔物だけ 自分で コマンドを えらぶ（`mine`）。戦いの 中で 作戦も かえられる（もとの 仲間に のこる）
  - ほかの 家族は とちゅうから 入れない・馬車の 入れかえ なし（`ctx.opts.solo`）。負けても お金は へらない・ゲームオーバーなし・その場で 受付の 話
  - 経験値: ランク戦で 勝つと 1戦ごとに 魔物たちが ふつうの 戦いの **0.5倍**（`MON_EXP_RATE`。あずかり中の 魔物も 育つ）。お金・落とし物・仲間に なる は なし。家族の 対戦は 経験値も なし
  - 戦いの 画面: `battleStart`（`story: true`）・`battleEnd` は ふつうと おなじ。人が いないので コマンドの まどは「仲間が戦っている…」（めいれいさせろが いれば その 魔物）
- **ランク**（相手は ふつうの 魔物を `foeLv` に そろえる〈宝の洞窟と おなじ のび〉。王者は 色ちがいで ＋2レベル・`champPow` 倍）

  | ランク | 部 | 開く | おすすめLv | 相手Lv | 王者 | はじめての ごほうび | 2回目から |
  |---|---|---|---|---|---|---|---|
  | F | はじまりの部 | monster_bond | 10 | 11 | レッドぷるりん騎士 ×1.25 | 命の木の実・力の種・仲間の粉・メダル1 | 150G |
  | E | 森と野原の部 | c1_clear | 15 | 21 | ゴールドキングぷるりん ×1.25 | 素早さ・守り・かしこさの種・メダル1 | 300G |
  | D | 海と嵐の部 | c2_clear | 22 | 27 | ダークヴァルドラゴン ×1.2 | 力の種2・素早さの種2・かみなりのいし・メダル2 | 500G |
  | C | 火と氷の部 | c3_clear | 30 | 37 | シャドウ黒曜の騎士 ×1.25 | 色の石・命の木の実2・つきのいし・メダル2 | 800G＋メダル1 |
  | B | 砂の王国の部 | c4_clear | 40 | 39 | ダーク古城のよろい ×1.25 | 色の石・力の種2・守りの種2・ほのおのいし・メダル3 | 1200G＋メダル1 |
  | A | 空と雲の部 | c5_gaia | 48 | 44 | レッドキラーからくり ×1.15 | 色の石2・素早さ2・かしこさ2・みずのいし・メダル3 | 1700G＋メダル1 |
  | S | 星の王者の部 | c5_clear | 56 | 46 | ゴールド雲海へび ×1.1 | 色の石3・命の木の実3・力2・素早さ2・星のかけら5・メダル4 | 2500G＋メダル1 |
  | SS（伝説） | 時の部 | c6_clear | 68 | 54 | ゴールド大時計の番人 ×1.0 | 色の石3・限界の石2・守り3・かしこさ3・メダル5 | 3500G＋メダル1 |
  | SSS（伝説） | 王者の中の王者 | c7_karim | 76 | 76 | ダーク竜王のまご ×1.8 | 色の石5・限界の石3・命の木の実3・素早さ3・メダル6 | 5000G＋メダル1 |

  1つ前の ランクを 勝ちぬくと 次へ。メダルは `c.medalSpots`（`monarena_<ランク>_<n>`・`monarena_rep_<n>`・`monarena_fam_<charId>`）
- **シミュレーター**（`node tools/sim-monarena.mjs 60`。その ころ 仲間に できる 4ひき・おすすめLv・完全オート・3連戦を 勝ちぬく わりあい）
  - ふつうに 育てた（＋ と C から 配合の 受けつぎ・その ころの 店の いちばん よい 装備）: F 97%・E 85%・D 98%・C〜SSS 100%（のこりHP 49〜72%）
  - べつの 4ひき（`ALT=1`）: F 90%・E 90%・D 95%・C〜SS 100%・**SSS 2%**（回復の できる 魔物が いない チーム。王者の ヒントで「回復のできる魔物で」と 言う）
  - あまり 育てて いない（`PLAIN=1`。＋なし・受けつぎ なし・装備 1つ 下）: F 95%・E 72%・D 85%・C 33%・B 53%・A 45%・S 38%・SS 47%・SSS 15%
  - 家族の 対戦（`FAMILY=1`。同じ 4ひき 同士・Lv50）: 自分の 勝ち 39〜68%（へいきん 52%）… 敵の がわの 作戦 AI も みかたと おなじ くらい 強い
- **家族の 登録チーム**: `register` で key と 写し（`regSnap`。`SNAP_KEYS` … しゅぞく・名前・レベル・＋・色・受けついだ 強さ・種・装備・れん金の 効果・受けついだ 技・作戦）。
  受付を 開く（`status`）・ランク戦の あとにも 今の すがたに なおす（いなく なった 魔物は 前の 写しの まま）。`family` は 相手が 遊んで いなくても 写しで 戦う。
  `even: true` … 両方 みんな `MON_EVEN_LV`（50）で 強さを 計算しなおす（技も その レベルで）。記録は `c.monArena.fam[charId] = { w, l, first }`（はじめて 勝った 時だけ メダル 1まい）
- **窓口の へんじ**: どの action も へんじに status と おなじ 項目を つける（`register` の へんじにも `reg`）。おまけの 項目: `ranks[]` に `champ`・`champSp`・`legend`・`lock`（出られない わけ）・`why`・`n`、
  `monsters[]` に `color`・`plus`・`tactics`、`family[]` に `rec: { w, l }`・`at`、ほかに `open`・`evenLv`・`teamMax`
  - **`monsters[].where` は 酒場で 待つ 魔物だけ `'tavern'`**（約束の 3つ いがい）。A班の `WHERE_LABEL` に `tavern: '酒場'` を 足すと「いる所」に 出る（今は「－」）
  - `rank`・`family` は へんじ（ok）の あとに 3連戦の だいほんを はじめる。だいほんの 外なら すぐ・受付の だいほんが おわりかけなら おわるのを まつ・
    画面（'ui'）を 開いて まっている 時は 画面を とじた あとに はさむ
- **C班へ（その場の 対戦に 使う もの。`shared/battle-monarena.js`）**
  - `new MonArenaBattle({ rng, allies, foes, canFlee: false, ... })` … Battle の 子。`foes: [{ char, controller, auto, owner, name }]` は 敵の がわに 入る 魔物の 仲間。
    controller を わたした 敵の がわの 魔物は、その 人が コマンドを えらぶ（`onReady` で `ready`・`command(id, cmd, controller)`）。わたさなければ 作戦の AI（`foeDecide` … ai.js の decideAlly を 敵と みかたを 入れかえて）
  - 敵の がわでも みかたと おなじ きまり: 会心・呪文と 回復の 強さ（enemyFixedScale を かけない）・魔物の 技の MP・グループの 技・ムチ／ブーメラン・れんけい・1回 起き上がる しゅぞくも 起き上がらない
  - `monFighterChar(char, { level, heal })` … 戦う 写し（level で レベルを そろえる）/ `monAllyInit(char, { controller, auto, owner })` … みかたの がわの 入れ方 /
    `addMonFoe(b, char, opts)` … 敵の がわに 1ぴき 足す / `monSnapshot(entry)`・`snapChar(snap, ownerId, { level })` … 登録チームの 写し / `MON_EVEN_LV`
  - 戦いの おわりを 自分で 作る 時は ctx に `finish(world, ctx)` を つける（battles.js の battleTick が よぶ）。`world/monarena.js` の `makeMonBattle`・`finishMon` が 見本
    （C班の 対戦では、相手の 人の 画面には 敵と みかたを 入れかえた snapshot が いる。pub の side を 入れかえて 送る など）
