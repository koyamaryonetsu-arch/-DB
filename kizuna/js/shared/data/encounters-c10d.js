// 第3部 第2章 第4幕「金の音と、星の橋」の きまった 戦い（B: 戦い。encounters.js で まぜる）
// 星の 階段は 魔物が 出ない（出現表は ない）。門の 前に 立つと 番人との 戦い（docs/plan-part3-c10d.md の 16-2・16-4）
//   c10d_gate1 … かがみの番兵 1体（Lv115。れんしゅう）
//   c10d_gate2 … かがみの門番 2体（Lv116。色が ちがう）
//   c10d_gate3 … まどいの門番 2体（Lv116。色が かわる・色を うつす）
//   c10d_gate4 … かがみのかけら 3体（Lv117。小さい・全体攻撃が 強い）
//   c10d_mirror … 光をはかる鏡 ミラーレ（いただき。Lv118）＋ うつし身（はじめは 見えない。HP 半分で 出る）
//   にげられない。スピカは かならず 出る（てらす・星のうた も）。曲は F班の c10d_gate・c10d_mirror（id だけ 先に つないだ）
import { C10D_SHARD, C10D_SHARD_W, C10D_SHARD_M, C10D_SHARD_S, C10D_MIRARE, C10D_COPY } from './monsters-c10d.js?v=98a59fb17475';
import { C10D_BATTLE_B as C10D_BATTLE, C10D_TRACKS_B as C10D_TRACKS } from '../maps/c10d-flags.js?v=98a59fb17475';
// 負けた 時の ヒントの 文（boss-hints-c10d.js が mergeBossHints を よぶ）
import './boss-hints-c10d.js?v=98a59fb17475';

const GATE = (group) => ({ group, bg: 'c10d_stair', bgm: C10D_TRACKS.gate, canFlee: false, boss: true });
export const FIXED_C10D = {
  [C10D_BATTLE.gate1]: GATE([[C10D_SHARD, 1, 1]]),
  [C10D_BATTLE.gate2]: GATE([[C10D_SHARD_W, 2, 2]]),
  [C10D_BATTLE.gate3]: GATE([[C10D_SHARD_M, 2, 2]]),
  [C10D_BATTLE.gate4]: GATE([[C10D_SHARD_S, 3, 3]]),
  [C10D_BATTLE.mirror]: { group: [[C10D_MIRARE, 1, 1], [C10D_COPY, 1, 1]], bg: 'c10d_summit', bgm: C10D_TRACKS.mirror, canFlee: false, boss: true },
};
// 門の 戦いの じゅん（16-3 の 1〜4）
export const C10D_GATE_ORDER = [C10D_BATTLE.gate1, C10D_BATTLE.gate2, C10D_BATTLE.gate3, C10D_BATTLE.gate4];
