# 第100回 V1班: はかる 道具（sim）と 本当の ゲームの ボス戦を くらべる（2026-11-22）

## 1. しらべた わけ
- 係が ブラウザで 本当の 戦いを 回すと、道具の 数字より よく 負けた（たいさ 0勝 4敗 ⇔ 道具 77%。いかり船長 1敗 ⇔ 67%）
- 「本当に 家族が ボスに 勝てるか」を 道具が 正しく 言えて いるかを たしかめる

## 2. 本当の 流れで はかる 道具（`tools/real-boss.mjs`）
- サーバーと 同じ `GameWorld`（`fixedWorld`）に テストの ボット（`test/helpers.js`）で 入り、本物の 入り口 `startFixedBattle`（`makeBattle`）で ボスと 戦う
- 仲間は 本物の 作り方: 家族の キャラは `companionJoin('fam:…')`（`famCopy`）、酒場は `recruitNpc`（本物の 酒場で やとう）。人4人は 4つの ボットが パーティーを 組む（`party invite/accept`）
- 人の ボットは **画面と 同じ 形の コマンド**（`{ t: 'battle', actor, cmd }`・合体技の さそいには `dualAnswer`）を `world.handle` で 送る。番が 来てから REACT（2秒）待って えらぶ
- えらび方（`HUMAN=`）: `know` … 道具の「知って いる 人」と 同じ きまり（`MODES9.know.act` の しくみの 役・合体技、ほかは 知って いる 人の オート〈`decideAlly`＋`knows9`〉の 答えを その 場で コマンドに して 送る）／`mech` … しくみの コマンドと「戦う」だけ／`idle` … 何も えらばない
- 時間は `world.tick(50)`（サーバーと 同じ 進め方）。自動の 仲間・前ぶれで 待つ・`tellAll` は 本物の まま
- つかいかた: `node tools/real-boss.mjs 30 colonel,mirror k1fam,k1npc,k1tav,p4`（`SIM=1` で 同じ 組を 道具でも・`SIMONLY=1` 道具だけ・`EACH=1` 1回ずつ・`LOG=1 SEED=…` ようす）
- 組: `k1fam`（1人＋家族の 仲間3）・`k1npc`（1人＋酒場3。道具と 同じ 転職ずみ・店の 品を 本物の 酒場で やとって 入れる）・`k1tav`（1人＋酒場3。本物の 酒場で やとった まま）・`p2`・`p3`・`p4`（人だけ）
  - `k1tav` の 仲間の 作り … `TAVLV`（レベル。ない 時は 勇者の 1つ下）・`TAVJOB=1`（超級職）／`TAVJOB=upper`（上級職）・`TAVGEAR=1`（店の いちばん よい 品）・`SUPTAC=`（作戦）

<!-- つづきは 下 -->
