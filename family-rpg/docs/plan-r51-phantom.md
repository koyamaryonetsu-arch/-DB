# 第51回（予定）: 幻の職業と、家族の掲示板

第50回の作業（10班）が おわってから 作る。家族が 決めた こと（2026-10-29）。

## 1. 幻の職業（伝説の 上。12しゅ 全部 作る）

- なる 条件 = 「きわめた 職業 2つ」＋「やりこみの 条件」。伝説を 何こ きわめたら、という 条件には しない
- やりこみの 条件は「自分が 使った 技の 回数」と「自分が 与えた ダメージ・回復の 量」だけ
  - ほかの キャラや 敵の 強さで かわる 物（何体 たおす・生き返らせる・とどめ・敵を 止める）は 使わない
- 数える 時: どの 職業の 時でも 数える（ほかの 職業で 使った 技も 入る）
- 数えはじめは 作った 日から（前の 分は 入らない）
- 数の きびしさ: 下の 表の まま（家族が「このくらい」を えらんだ）
- メニューに「幻の書」: すすみぐあいの メーター。はじめは「？？？」で、片方の 職業を きわめると 条件が 見える
- 酒場などで ヒントの うわさ

| 幻の職業 | きわめておく職業 | 条件 |
|---|---|---|
| 海賊王 | ニカ＋海賊 | ゴムゴムの技を500回使う。与えたダメージ合計20万 |
| 伝説の超勇者 | ロトの勇者＋スーパーサイヤ人3 | 雷の呪文とかめはめ波の仲間を合わせて300回。ダメージ合計30万 |
| 日の火影 | 日の呼吸の使い手＋七代目火影 | ヒノカミ神楽の技と忍術を、それぞれ200回。炎のダメージ合計20万 |
| 天才施設管理者AI | 天才しせつ管理者＋クリエイター | 補助の技を1500回。回復量の合計5万 |
| 名探てい王 | 名探てい＋おしり探てい | 推理・調べる技を500回。ダメージ合計10万 |
| 銀河の女王 | ネオ・クイーン・セレニティ＋第5のせいれい | 回復の呪文を1000回。回復量の合計30万 |
| 大魔導王 | 大魔道士＋ハリーポッター | 攻撃の呪文を1000回。呪文のダメージ合計50万 |
| 天下無双の剣聖 | 飛天御剣流けい承者＋暴れんぼう将軍 | 剣の技を1000回。会心の一撃を300回 |
| 宇宙一のおかん | 最強のおかん＋3年B組の担任 | 敵を弱くする技（しかる など）を1000回。回復量の合計5万 |
| 破壊と創造の神 | はかい神＋クリエイター | 1回で5000以上のダメージを50回 |
| 夢のスタジアム鉄道 | 京急の社長＋野球界の殿堂入り | 電車の技と速球の技を、それぞれ300回。ダメージ合計20万 |
| 天候の神 | 天候をあやつる者＋天地雷鳴士 | 晴れ・雨・かみなりの技を、それぞれ200回 |

- 天候の神の ため、新しい 職業の 流れ「気象予報士 → お天気キャスター → 天候をあやつる者」も 作る
- 職業の 中み（技・えんしゅつ）の 案:
  - 海賊王: 仲間が 多いほど 強い。敵を 笑わせて 動けなくする「自由の技」
  - 伝説の超勇者: 気を ためる、雷を まとった かめはめ波「かめはめデイン」
  - 日の火影: 分身が それぞれ ヒノカミ神楽を まう
  - 天才施設管理者AI: 毎ターン 味方全員を 自動で 最適化
  - 名探てい王: 敵の 次の 行動を 先読みして つぶす
  - 銀河の女王: 全員を 回復して バリア
  - 大魔導王: 2つの 呪文を 同時に（メドローア×エクスペリアームス）
  - 天下無双の剣聖: 会心が 出るほど 強くなる
  - 宇宙一のおかん: しかられた 敵が 反省して しばらく 動かない
  - 破壊と創造の神: 敵を 消して、味方の 装備を 作りかえる
  - 夢のスタジアム鉄道: 満員の 観客電車が 球場ごと つっこむ
  - 天候の神: 天気を かえると 味方と 敵の 属性の 強さが 入れかわる

## 2. 家族の掲示板（新しく 作る）

- のせる 物（どれも 自動で のる）:
  - だれが 何の 職業に なったか（「ママが 海賊王に なった！」）
  - 幻の職業の 条件（だれかが 条件を 見つけたり、なれたり した 時）
  - ひらめき技・合体技の 覚えかた（だれかが 覚えた 時）
- 家族の ひとことは 作らない（家族が えらばなかった）
- ネタバレ: 見出しだけ 出して、条件は「見る」を おした 時だけ 出す

## 3. つくりかたの とりきめ（第51回の 班。名前は かえない）

### 班
- **F（土台）**: 記録・条件・幻の書・転職の しくみ・うわさ。ファイル `shared/data/phantom.js`（条件の 表・タグ・文）、`shared/world/phantom.js`（記録の 足しこみ）、`client/ui/phantom-book.js`
- **B（掲示板）**: `shared/world/family-board.js`、`client/ui/family-board.js`
- **C1**: 海賊王・伝説の超勇者・日の火影・天才施設管理者AI → `jobs-phantom-a.js`・`abilities-phantom-a.js`・えんしゅつ o7
- **C2**: 名探てい王・銀河の女王・大魔導王・天下無双の剣聖 → `jobs-phantom-b.js`・`abilities-phantom-b.js`・えんしゅつ o8
- **C3**: 宇宙一のおかん・破壊と創造の神・夢のスタジアム鉄道・天候の神 → `jobs-phantom-c.js`・`abilities-phantom-c.js`・えんしゅつ o9
- **W（天気の職業）**: 気象予報士（基本）→ お天気キャスター（上級）→ 天候をあやつる者（超級）→ `jobs-weather.js`・`abilities-weather.js`・えんしゅつ o10

### 職業の id
| 職業 | id | きわめておく 職業 |
|---|---|---|
| 海賊王 | `pirate_king` | `nika` ＋ `pirate` |
| 伝説の超勇者 | `super_hero` | `loto_hero` ＋ `ss3` |
| 日の火影 | `sun_hokage` | `hinokami` ＋ `hokage` |
| 天才施設管理者AI | `facility_ai` | `facility_genius` ＋ `creator` |
| 名探てい王 | `detective_king` | `meitantei` ＋ `oshiri` |
| 銀河の女王 | `galaxy_queen` | `neo_queen` ＋ `fifth_spirit` |
| 大魔導王 | `grand_magus` | `daimadoushi` ＋ `harry` |
| 天下無双の剣聖 | `sword_saint` | `hiten` ＋ `abarenbo_shogun` |
| 宇宙一のおかん | `cosmic_okan` | `saikyo_okan` ＋ `homeroom_3b` |
| 破壊と創造の神 | `chaos_creator` | `hakaishin` ＋ `creator` |
| 夢のスタジアム鉄道 | `dream_stadium` | `keikyu_president` ＋ `hall_of_fame` |
| 天候の神 | `weather_god` | `tenkou_tsukai` ＋ `tenchi` |
| 気象予報士 / お天気キャスター / 天候をあやつる者 | `kishou` / `otenki_caster` / `tenkou_tsukai` | 基本 / 上級（kishou）/ 超級（otenki_caster） |

（`pirate`・`creator`・`meitantei`・`oshiri`・`daimadoushi`・`harry`・`saikyo_okan`・`tenchi` は 今の id に 合わせて F が 正しい id に なおす）

- 幻の職業は `tier: 4`。`jobs.js` に `PHANTOM_ORDER`、`TIER_NAMES[4] = '幻の職業'`、`TIER_ORDERS` に 足す（F）
- `req: [a, b]`（2つとも きわめる）と、`phantom.js` の 条件。`reqSuper` などは 使わない
- 幻の職業の 技の 強さ（skill-tier.js の tier 4）: MP −35%・6回行動・2段階・回復 ×1.25
- 職業の 定義: `jobs-phantom-<a|b|c>.js` が `PHANTOM_JOBS_<A|B|C>`（id → 職業）を export。`jobs-weather.js` は `WEATHER_JOBS`。jobs.js への 読みこみと ORDER への 追加は 各班が 1行ずつ 足す
- 技: `abilities-phantom-<a|b|c>.js` が `PHANTOM_ABILITIES_<A|B|C>`、`abilities-weather.js` が `WEATHER_ABILITIES`。abilities.js への 読みこみは 各班が 1行
- 天気の 技には `weather: 'sun' | 'rain' | 'thunder'` を つける（天候の神の 条件で 数える）
- えんしゅつ: 各班が 自分の グループ（o7〜o10）を `AX_GROUP_IDS` と 登録の 表に 1行ずつ 足す。`test/ax-time.test.js` の ためしの グループ名 'o9' は 'zz9' に かえる（C3）

### 記録（F）
- キャラの `c.feats`: `{ use: { タグ: 回数 }, dmg, dmgSpell, dmgFire, heal, crit, big5000 }` など。どの 職業の 時でも 数える
- タグ（`phantom.js`）: gomu・thunderSpell・kame・hinokami・ninjutsu・support・deduce・healSpell・attackSpell・sword・debuff・train・pitch・sun・rain・thunder
- 幻の書: 片方を きわめると 条件が 見える。メーター
- 掲示板への 知らせ: F は `world.boardPost?.({ kind, by, charId, job, text, detail })` を よぶ（kind: 'phantom_reveal' 条件が 見えた・'phantom_get' なれた）。B が `boardPost` を 作る
- 引っこしの コード（transfer.js）: 記録が 消えないように。入らなければ 版を 上げる（KIZUNA-4）

### 掲示板（B）
- のせる: 転職（tier 0〜3。B が 転職の ところで のせる）・幻の職業（F から）・ひらめき技／合体技を 覚えた（覚えかたの 文つき）
- 見出しだけ 出して、くわしくは「見る」で 開く
