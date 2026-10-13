# 33回目：新しい職業（2026-10-13 家族と決めたこと）

技・ひらめき・合体技・絵・必殺技のえんしゅつは、これまでの職業と同じきまり（第26回・第29回 るろうに剣士の系統と同じ作り方）。
「錬」「怪」「盗」などは使えない漢字なので、名前はひらがなにする。

## 職業と条件（A と B の 名前の 約束）

| ID | 名前 | ランク（tier） | 条件 |
|---|---|---|---|
| `magician` | 手品師 | 基本職（0） | なし |
| `kaito` | かいとう | 上級職（1） | 手品師＋スパイ（`magician`＋`spy`） |
| `kaito_kid` | かいとうキッド | 超級職（2） | かいとう（`kaito`） |
| `wizard_student` | 魔法学校の生徒 | 上級職（1） | 小学生＋魔法使い（`schoolkid`＋`mage`） |
| `harry` | ハリーポッター | 超級職（2） | 魔法学校の生徒（`wizard_student`） |
| `homeroom_3b` | 3年B組の担任 | 伝説職（3） | 高校生＋地方公務員（`highschooler`＋`civil_local`） |
| `alchemist` | れん金術師 | 基本職（0） | なし |
| `state_alchemist` | 国家れん金術師 | 上級職（1） | れん金術師（`alchemist`） |
| `fullmetal` | はがねのれん金術師 | 超級職（2） | 国家れん金術師（`state_alchemist`） |
| `sailor_soldier` | 美少女戦士 | 上級職（1） | 中学生＋アイドル（`middleschooler`＋`idol`） |
| `sailor_moon` | セーラームーン | 超級職（2） | 美少女戦士（`sailor_soldier`） |

## 職業の味（案。A が 技に する）
- 手品師 → かいとう → かいとうキッド：トランプ銃・へんそう・ハンググライダーで にげる/かわす・敵の 道具を ぬすむ・目くらまし。名探ての系統との合体技。
- 魔法学校の生徒 → ハリーポッター：武器を うばう 呪文・守護の 呪文（光）・ほうきで とぶ（すばやさ）・いなずまの きず。
- 3年B組の担任：説教で 敵を 止める・「人という字は…」で 仲間を 強くする・学校の 職業の 仲間が いると もっと 強い。
- れん金術師 → 国家れん金術師 → はがねのれん金術師：手を 合わせて 地面から やり・かべ（守り）・機械の うで。この職業の人が パーティーに いると、れん金がまの 完成までの 歩数が 半分。
- 美少女戦士 → セーラームーン：月の 光の 必殺技・「月に かわって おしおきよ！」・仲間を 守る・ティアラ。
  - 男の子は タキシード仮面ふう（家族が 決めた。黒い えんび服・黒い マント・シルクハット・白い 仮面・赤い バラ。女の子は セーラー服・ティアラの まま。絵は hero-r33.js の `R33_MASC`）

## 担当
- A（データと 戦い）：jobs.js・技（abilities-*.js）・ひらめき・合体技・装備品・職業の 話・README・テスト
- B（絵）：キャラの 絵（職業の 見た目・装備の 見た目）・必殺技の えんしゅつ（battlefx-*）。技の ID は A が きめて、 docs のこの 下の「技の ID」に 書く。B は きまるまで 仮の ID で 作り、さいごに あわせる

## 技の ID（A）

きまり（A が きめた こと）
- 看板の 技（必殺技）は `<職業の id>_sig`（第26回・第29回と おなじ）。A の データでは `anim` に 今 ある 型を 入れて ある（下の「今の anim」）。
  B が 看板の 技の エフェクトを 作ったら、`anim` を `<職業の id>_sig` に かえる か、第26回の `sigAnim`（技の id で えらぶ）と おなじ しくみで よい。まとめる 時に どちらかに そろえる
- 看板の 技 いがいは 今 ある anim の まま（新しい エフェクトは いらない）。B が 作りたい 技が あれば「えんしゅつの 希望」を 見て
- ひらめき技の id は `hi_`。合体技の id は `dt_`。合体技の えんしゅつ（render/dualfx.js の DUAL_FX。テストで 全部の 合体技に いる）は、A が 今 ある とどめの 型で 1行ずつ 入れて おく

### 看板の 技（必殺技）

| 職業 | 技ID | 名前 | 今の anim | えんしゅつの 希望 |
|---|---|---|---|---|
| 手品師 `magician` | `magician_sig` | イリュージョン | `holy` | 大きな 幕が 下りて、上がると 光の ハトと 紙ふぶき（敵全体・光） |
| かいとう `kaito` | `kaito_sig` | 予告どおりにいただきます | `slash_fast` | 白い マントが ひるがえって 一閃、宝石が キラッ（敵1体） |
| かいとうキッド `kaito_kid` | `kaito_kid_sig` | トランプじゅうの嵐 | `cards` | トランプが 嵐の ように 8まい 飛ぶ（敵に ランダム 8回）。月と 白い シルエット |
| 魔法学校の生徒 `wizard_student` | `wizard_student_sig` | ステューピファイ | `void` | つえの 先から 赤い 光線（敵1体。止まる ことも） |
| ハリーポッター `harry` | `harry_sig` | 守護の呪文 | `holy` | 銀色に 光る しかが かけぬける（敵全体・光＋仲間を 少し 回復） |
| 3年B組の担任 `homeroom_3b` | `homeroom_3b_sig` | 愛のお説教 | `warcry` | 黒板と「人」の 字、ことばの ふきだしが 敵へ（敵全体。正座して 止まる ことも） |
| れん金術師 `alchemist` | `alchemist_sig` | 石の大男 | `quake` | 青い れん成の いなずま → 地面から 石の 大男が 出て なぎはらう（敵全体） |
| 国家れん金術師 `state_alchemist` | `state_alchemist_sig` | れん成大爆発 | `blast2` | 地面に まるい もよう → 大きな 爆発（敵全体・爆発） |
| はがねのれん金術師 `fullmetal` | `fullmetal_sig` | 大地のやり | `rock_smash` | 両手を パン！ → 地面から 何本もの 大きな やりが 2回 つき出す（敵全体） |
| 美少女戦士 `sailor_soldier` | `sailor_soldier_sig` | ムーン・ティアラ・アクション | `holy` | ティアラが 光の わに なって 飛ぶ（敵1体・光） |
| セーラームーン `sailor_moon` | `sailor_moon_sig` | ムーン・プリンセス・ハレーション | `holy` | 大きな 三日月と ピンクの 光の あふれ（敵全体・光） |

### 職業の 技（看板の 技 いがい。anim は 今 ある 型）

| 職業 | 技ID と 名前（覚える Lv） |
|---|---|
| 手品師 | `mg_card` トランプ投げ(1)・`mg_hato` ハトが出るよ(2)・`mg_hako` びっくり箱(3)・`mg_joshu` 助手さん、どうぞ(5)・`mg_ukabu` 空中ふゆう(7) |
| かいとう | `kt_card` トランプじゅう(1)・`kt_yokoku` 予告状(2)・`kt_surikae` すりかえトリック(3)・`kt_hensou` 変装の名人(5)・`kt_glider` ハンググライダー(7) |
| かいとうキッド | `kk_hato` ハトの大群(1)・`kk_smoke` けむり玉(2)・`kk_poker` ポーカーフェイス(3)・`kk_jewel` ダイヤのきらめき(5)・`kk_tsukiyo` 月夜のグライダー(7) |
| 魔法学校の生徒 | `ws_hikari` ルーモス(1)・`ws_uku` ふわふわ呪文(2)・`ws_kachikachi` カチコチ呪文(3)・`ws_houki` ほうきの練習(5)・`ws_honoo` インセンディオ(7) |
| ハリーポッター | `hy_buki` エクスペリアームス(1)・`hy_houki` ほうきで急上しょう(2)・`hy_quidditch` クィディッチの急こう下(3)・`hy_kizu` いなずまのきず(5)・`hy_dumbledore` ダンブルドア軍団(7) |
| 3年B組の担任 | `h3_hito` 人という字は(1)・`h3_shusseki` 出席をとる(3)・`h3_chalk` チョーク投げ(5)・`h3_katei` 家庭訪問(7)・`h3_taiiku` 体育の授業(8) |
| れん金術師 | `al_toge` 石のとげ(1)・`al_kabe` 土のかべ(2)・`al_bunkai` 分解(3)・`al_bakuhatsu` れん成反応(5)・`al_kusuri` 薬のれん成(7) |
| 国家れん金術師 | `sl_tsuchi` 土の大波(1)・`sl_gin` 銀時計(2)・`sl_yubi` 指ぱっちん(3)・`sl_toride` 石のとりで(5)・`sl_hashira` 石の柱(7) |
| はがねのれん金術師 | `fm_ude` 機械のうで(1)・`fm_yaiba` うでのやいば(2)・`fm_kabe` はがねのかべ(3)・`fm_koukan` 等価こうかん(5)・`fm_toge` とげの森(7) |
| 美少女戦士 | `bs_heel` ハイヒールキック(1)・`bs_henshin` メイクアップ！(2)・`bs_oshioki` 月にかわっておしおきよ！(3)・`bs_kizuna` 友情のきずな(5)・`bs_shabon` シャボンスプレー(7) |
| セーラームーン | `mn_stick` ムーンスティック(1)・`mn_bara` タキシード仮面のバラ(2)・`mn_luna` ルナのはげまし(3)・`mn_heal` ムーン・ヒーリング・エスカレーション(5)・`mn_inori` 銀水しょうのいのり(7) |

### ひらめき技（anim は 今 ある 型）

| 職業 | 技ID | 名前 |
|---|---|---|
| かいとう | `hi_joker` | ジョーカーのきりふだ |
| かいとうキッド | `hi_tsukika` | 月下のマジックショー |
| 魔法学校の生徒 | `hi_leviosa` | ウィンガーディアム・レヴィオーサ |
| ハリーポッター | `hi_gryffindor` | グリフィンドールの剣 |
| 3年B組の担任 | `hi_sotsugyou` | なみだの卒業式 |
| 3年B組の担任 | `hi_yuuhi` | 夕日に向かって走れ |
| 国家れん金術師 | `hi_honoo_uzu` | ほのおの大うず |
| はがねのれん金術師 | `hi_ryoute` | 両手でパン！ |
| 美少女戦士 | `hi_aqua` | シャイン・アクア・イリュージョン |
| セーラームーン | `hi_spiral` | ムーン・スパイラル・ハート・アタック |

### 合体技（DUAL_FX は 今 ある とどめの 型）

| 技ID | 名前 | 人数 | 組 | DUAL_FX の とどめ |
|---|---|---|---|---|
| `dt_tsukiyo` | 月夜のかけひき | 2人 | 手品・かいとう × 探てい | `spot` |
| `dt_reform` | 一晩で大リフォーム | 2人 | れん金術 × 設備 | `quake` |
| `dt_moonlight` | ムーンライト・ステージ | 2人 | 美少女戦士 × アイドル（アイドル・スーパースター・フルーツジッパー・アラシ） | `stage` |
| `dt_hippogriff` | ヒッポグリフの空の旅 | 2人 | 魔法学校 × 魔物使い | `storm` |
| `dt_sotsugyou` | 旅立ちの日に | 3人 | 3年B組の担任 × 学校の子ども × 学校の子ども | `heal` |

### 装備の ID（見た目は B）

| ID | 名前 | 種類 | 手に入る 所 |
|---|---|---|---|
| `magic_wand` | マジックステッキ | つえ（ランク1） | 手品師の はじめの 装備・ホシフル村のよろず屋 |
| `chalk` | チョーク | つえ（ランク1） | れん金術師の はじめの 装備・ホシフル村のよろず屋 |
| `silk_hat` | シルクハット | 頭（ランク2） | ルミナの防具屋 |
| `school_robe` | 魔法学校のローブ | ローブ（ランク3） | ルミナの防具屋（森の主の あと） |
| `tiara_boomerang` | ティアラ | ブーメラン（ランク4） | カモメ港（大王イカの あと） |
| `pointer_stick` | 指し棒 | つえ（ランク5） | カナトコの武器屋 |
| `kid_mantle` | かいとうの白いマント | 服（ランク7・★3） | 宝の洞窟「ひみつ」 |
| `invisible_cloak` | とうめいマント | 服（ランク6・★3） | 宝の洞窟「まぼろし」 |
| `elder_wand` | ニワトコのつえ | つえ（ランク8・★4） | ひみつのダンジョン |
| `automail_arm` | はがねの機械のうで | ツメ（ランク7・★3） | 宝の洞窟「大地・岩」 |
| `silver_crystal` | 銀水しょう | アクセ（ランク8・★4） | ひみつのダンジョン |
| `nekketsu_jersey` | 熱血先生のジャージ | 服（ランク7・★3） | 宝の洞窟「大地・岩」 |

## えんしゅつ（B）

えんしゅつは `client/render/battlefx-jobs7.js`。技の id では なく、技の データの `anim` の 名前で ひく。

- 看板の 技 11こ: `anim` は 技の id と おなじ `<職業の id>_sig`（abilities-jobs9.js の anim を かえた）
- ほかの 技（anim を `r33_…` に かえた もの）

| 技ID | anim |
|---|---|
| `mg_card`・`kt_card` | `r33_card_throw` |
| `mg_hato`・`kk_hato` | `r33_hat_trick` |
| `kt_surikae` | `r33_steal` |
| `kk_smoke` | `r33_smoke_flash`（みかた） |
| `ws_hikari` | `r33_spell_ray` |
| `ws_houki`・`hy_houki` | `r33_broom`（みかた） |
| `hy_buki` | `r33_disarm` |
| `hy_kizu` | `r33_lightning` |
| `h3_hito` | `r33_hito_ji`（みかた） |
| `al_toge`・`sl_hashira`・`fm_toge` | `r33_alchemy_spear` |
| `al_kabe`・`sl_toride`・`fm_kabe` | `r33_alchemy_wall`（みかた） |
| `al_bakuhatsu` | `r33_alchemy` |
| `fm_ude` | `r33_mech_arm` |
| `bs_oshioki`・`mn_stick` | `r33_sailor_beam` |
| `mn_heal` | `r33_moon_heal`（みかた） |

- まだ どの 技にも つけて いない えんしゅつ: `r33_glider`・`r33_patronus`・`r33_sekkyo`・`r33_watch`・`r33_sailor_guard`・`r33_moon_tiara`（ひらめき技や これからの 技に つかえる）
- 装備の 見た目（hero-r33.js）: `magic_wand`・`chalk`・`pointer_stick`・`elder_wand`・`tiara_boomerang`（ぶき）、`automail_arm`（はがねの ツメ）、`silk_hat`（シルクハット）、`school_robe`・`kid_mantle`・`invisible_cloak`・`nekketsu_jersey`（服）。`silver_crystal` は アクセなので 絵に 出ない
