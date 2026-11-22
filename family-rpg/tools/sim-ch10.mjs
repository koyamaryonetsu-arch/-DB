// 第94回 B班: 第3部 第2章 第1幕「赤と緑」の 2人の 中ボスの 強さを 見る（docs/plan-part3-c10a.md の 13-5）
//   ドクター・タマゴン と グルグルドリル号（c10r_boss。Lv107。tamagon）・カビだんしゃく モルド と カビカビ号（c10g_boss。Lv108。mold）
//   わくは tools/sim-ch9.mjs の ch9Run（人が 画面で できる 動き … えらぶ 時間 REACT=2000・ブラウザの 速さ・前ぶれの 間は 待つ）
// つかいかた: node tools/sim-ch10.mjs [回数] [tamagon|mold|all]
//   PARTY=p4,k1npc,… … 人数の やり方（PARTY=all … 全部。sim-ch9.mjs の PARTIES9）・REACT=2000,5000 … えらぶ 時間（いくつでも）
//   ORDER=red|green|both … どちらを 先に したか（先に 取った 音の スピカの ごほうびを 入れる。ない ときは both）
//     red（赤 → 緑）… タマゴンは ごほうび なし・モルドは 赤の 音（ほのかな光 9%）
//     green（緑 → 赤）… モルドは ごほうび なし・タマゴンは 緑の 音（てらすが 3回で たまる）
//   LOG=1 BOSS=tamagon MODE=know SEED=1 PARTY=p4 … 1回だけ ようすを 出す
//   TAC=aggressive・SUPTAC=heal … 作戦を えらんで はかる（第96回 T班。人が 動かす キャラ／自動の 仲間。sim-ch9.mjs の ch9Run）
//   めやす（13-5）: 2秒と 5秒の 両方で 人4人の 知って いる 人 6〜7わり（5秒でも 6わり 近く）・知らない 人 3わり いか・完全オート 5% いか・
//     1人＋酒場3人 5わり いじょう・1人＋魔物3 5わり 近く・2人＋自動 2人 5〜7わり・ひとり 3わり いじょう（ひとりの 完全オートより 高い）・
//     5人 9わりを こえない・勝った 時 8分 いない。赤 → 緑 と 緑 → 赤 の 差が 1わりを こえない
import { CH9_IDS, LV9, CH9_KIT, NEED9_HOOKS, STATS9_HOOKS, ch9Run, PARTIES9, EXTRA_PARTIES9, MODES9, summary9 } from './sim-ch9.mjs';
import { C10A_BATTLE, C10A_B as C10A } from '../public/js/shared/maps/c10a-flags.js';
import { c10State, c10Boss, c10Conf, wallUp } from '../public/js/shared/battle-c10a.js';
import { C10R_TAMAGON } from '../public/js/shared/data/monsters-c10a.js';
// 第95回 B班: 第2章 第2幕
import { C10B_BATTLE_B as C10B_BATTLE, C10B_B as C10B } from '../public/js/shared/maps/c10b-flags.js';
import { c10bState, geckoOf, litNow10b } from '../public/js/shared/battle-c10b.js';
import { dualPlan } from './sim-ch6.mjs';
// 第97回 B班: 第2章 第3幕
import { C10C_BATTLE_B as C10C_BATTLE } from '../public/js/shared/maps/c10c-flags.js';
import { c10cState, c10cBoss, onLit, litStones, tightOf } from '../public/js/shared/battle-c10c.js';
import { TACTICS } from '../public/js/shared/ai.js';
// 第99回 B班: 第2章 第4幕
import { C10D_BATTLE_B as C10D_BATTLE } from '../public/js/shared/maps/c10d-flags.js';
import { c10dState, mirrorOf10d, copyOf10d, neededColors } from '../public/js/shared/battle-c10d.js';
import { ch9Allies } from './sim-ch9.mjs';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { computeStats, learnedAbilities, mpCost } from '../public/js/shared/stats.js';
import { powScaleOf } from '../public/js/shared/pow-scale.js';

// 第101回 R2班: 3人＋酒場 1人（few の 3人目。めやす 5〜7わり）
EXTRA_PARTIES9.k3npc = { label: '3人＋酒場1人', humans: 3, npc: 1, mon: 0 };
CH9_IDS.tamagon = C10A_BATTLE.red;
CH9_IDS.mold = C10A_BATTLE.green;
export const CH10A_LV = { tamagon: 107, mold: 108 };
Object.assign(LV9, CH10A_LV);
// その ころの ★装備（第1章 第4幕の ころ ＋ ムウの ブローチ ＋ その 道の 宝箱の ★5。先に 行った 方の ★5 は 入れない … じゅんばんの 差は スピカの ごほうびだけで 見る）
const BROOCH = 'c9db_star_brooch';
CH9_KIT.tamagon = {
  hero: ['c8s_star_sword', 'c10rt_lava_mail', 'c9dt_twin_shield', 'c10rt_road_helm', BROOCH],
  daikenja: ['c9b_owl_staff', 'c9ct_star_robe', null, 'c9dt_echo_hat', BROOCH],
  god_hand: ['c9at_star_claw', 'c9dt_valley_gi', null, 'c7it_bear_hat', BROOCH],
  high_priest: ['c9b_owl_staff', 'c9ct_star_robe', 'c9dt_twin_shield', 'c7l_kingdom_crown', BROOCH],
};
CH9_KIT.mold = {
  hero: ['c8s_star_sword', 'c9dt_sleep_mail', 'c10gt_tree_shield', 'c9ct_upside_helm', BROOCH],
  daikenja: ['c9b_owl_staff', 'c10gt_root_robe', null, 'c9dt_echo_hat', BROOCH],
  god_hand: ['c9at_star_claw', 'c9dt_valley_gi', null, 'c7it_bear_hat', BROOCH],
  high_priest: ['c9b_owl_staff', 'c10gt_root_robe', 'c10gt_tree_shield', 'c7l_kingdom_crown', BROOCH],
};
// どちらを 先に したか → その 中ボスの 戦いで リーダーが 持って いる フラグ
export const ORDER_FLAGS = {
  red: { tamagon: [], mold: [C10A.noteRe] },
  green: { tamagon: [C10A.noteFa], mold: [] },
};

// 知って いる 人の しくみの 役（合体技を しない）: タマゴン … あつさが 高い（合体技で のぼせる）・ドリルの 前ぶれ／
//   モルド … 大カビばくだんの 前ぶれ・カビが 2つの 仲間に 星のうた・かべに てらす（1人）
NEED9_HOOKS.push((b, a, claim) => {
  const st = c10State(b);
  const m = c10Boss(b);
  if (!st || st.won || !m?.alive) return false;
  if (m.c10t) {
    const cf = c10Conf(C10R_TAMAGON, b);
    if ((a.c10heat || 0) + cf.heat.act >= cf.heat.max) return true;
    if (m.c10t.drillReady && !a.defending) return true;
    return false;
  }
  if (m.c10m) {
    if (m.c10m.bombReady && !a.defending) return true;
    const sp = b.c9sp || {};
    const kabi2 = b.aliveAllies().some((x) => (x.c10kabi || 0) >= 2);
    if (kabi2 && sp.song?.charge >= sp.song?.max && claim(b, `song10.${sp.song.uses}`)) return true;
    if (sp.teru?.charge >= sp.teru?.max && (wallUp(b) || kabi2) && claim(b, `teru10.${sp.teru.uses}`)) return true;
  }
  return false;
});
// 知って いる 人の 合体技: タマゴンの 戦いでは、さそう 仲間（人が 動かす キャラ）が のぼせそうな 時は さそわない
const knowAct = MODES9.know.act;
MODES9.know.act = (b, a, boss) => {
  const m = c10Boss(b);
  if (m?.c10t && !b.c10.won) {
    const cf = c10Conf(C10R_TAMAGON, b);
    if (b.aliveAllies().some((x) => x.knows9 && (x.c10heat || 0) + cf.heat.act >= cf.heat.max)) return false;
  }
  return knowAct(b, a, boss);
};
STATS9_HOOKS.push((b) => {
  const st = c10State(b);
  if (!st) return {};
  return { tNobose: st.nobose, tOver: st.overs, tDrill: st.drills, tDrillG: st.drillGuards, gMist: st.mists, gKinoko: st.kinoko, gBomb: st.bombs, gBombG: st.bombGuards, gClean: st.cleans, gTeru: b.c9sp?.teru?.uses || 0, gSong: b.c9sp?.song?.uses || 0 };
});
export function c10Text(res) {
  const avg = (k) => res.reduce((s, r) => s + (r[k] || 0), 0) / res.length;
  if (res.some((r) => r.tNobose !== undefined && (r.tOver || r.tDrill || r.tNobose))) return `  のぼせ${avg('tNobose').toFixed(1)} オーバーヒート${avg('tOver').toFixed(1)} ドリル${avg('tDrill').toFixed(1)}(守${avg('tDrillG').toFixed(1)})`;
  if (!res.some((r) => r.gMist !== undefined)) return '';
  return `  きり${avg('gMist').toFixed(1)} きのこ${avg('gKinoko').toFixed(1)} ばくだん${avg('gBomb').toFixed(1)}(守${avg('gBombG').toFixed(1)}) てらす${avg('gTeru').toFixed(1)} うた${avg('gSong').toFixed(1)}`;
}
// ───── 第95回 B班: 第3部 第2章 第2幕「青と白」の 2人の 中ボス（docs/plan-part3-c10b.md の 14-3）─────
//   サー・ゲッコー（c10b_gecko。Lv111。gecko）・かい盗 シロフクロウ（c10b_owl。Lv113。owl）
//   ORDER=blue|white|both … どちらを 先に したか（先に 取った 音の スピカの ごほうびを 入れる。第1幕の 2つの 音は いつも 入れる）
//     blue（青 → 白）… ゲッコーは 第1幕の ごほうびだけ・シロフクロウは ＋青の 音（星のうたが 4回で たまる）
//     white（白 → 青）… シロフクロウは 第1幕の ごほうびだけ・ゲッコーは ＋白の 音（てらすが はじめから たまって いる）
//   めやす（14-3）: 2秒と 5秒の 両方で 人4人の 知って いる 人 6〜7わり・知らない 人 3わり いか・完全オート 5% いか・4〜6分・
//     1人＋酒場3人 5わり いじょう・1人＋家族の仲間3 5わり いじょう（完全オート 0）・1人＋魔物3 5わり 近く・2人＋自動 2人 5〜7わり・
//     5人 9わりを こえない・ひとり 3わり いじょう（ひとりの 完全オートは 2わり いか）・勝った 時 8分 いない。青 → 白 と 白 → 青 の 差が 1わりを こえない
CH9_IDS.gecko = C10B_BATTLE.blue;
CH9_IDS.owl = C10B_BATTLE.white;
export const CH10B_LV = { gecko: 111, owl: 113 };
Object.assign(LV9, CH10B_LV);
// その ころの ★装備（第1幕の 中ボスの 品 ＋ 第1幕の 宝箱の ★5 ＋ その 道の 宝箱の ★5。先に 行った 方の ★5 は 入れない）
CH9_KIT.gecko = {
  hero: ['c8s_star_sword', 'c10rt_lava_mail', 'c10bt_mirror_shield', 'c10rt_road_helm', 'c10rb_goggles'],
  daikenja: ['c9b_owl_staff', 'c10bt_ripple_robe', null, 'c10gt_flower_hat', 'c10gb_monocle'],
  god_hand: ['c9at_star_claw', 'c10rt_vine_gi', null, 'c7it_bear_hat', 'c10rb_goggles'],
  high_priest: ['c9b_owl_staff', 'c10bt_ripple_robe', 'c10gt_tree_shield', 'c7l_kingdom_crown', 'c10gb_monocle'],
};
CH9_KIT.owl = {
  hero: ['c8s_star_sword', 'c10wt_moon_mail', 'c10gt_tree_shield', 'c10wt_quiet_helm', 'c10rb_goggles'],
  daikenja: ['c9b_owl_staff', 'c10gt_root_robe', null, 'c10gt_flower_hat', 'c10gb_monocle'],
  god_hand: ['c9at_star_claw', 'c10rt_vine_gi', null, 'c7it_bear_hat', 'c10rb_goggles'],
  high_priest: ['c9b_owl_staff', 'c10gt_root_robe', 'c10gt_tree_shield', 'c7l_kingdom_crown', 'c10gb_monocle'],
};
const ACT1_NOTES = [C10A.noteRe, C10A.noteFa];
Object.assign(ORDER_FLAGS, {
  blue: { gecko: [...ACT1_NOTES], owl: [...ACT1_NOTES, C10B.noteSo] },
  white: { gecko: [...ACT1_NOTES, C10B.noteLa], owl: [...ACT1_NOTES] },
});
export const ORDER_LABEL = { red: '赤→緑', green: '緑→赤', blue: '青→白', white: '白→青' };
export const ORDERS_OF = { tamagon: ['red', 'green'], mold: ['red', 'green'], gecko: ['blue', 'white'], owl: ['blue', 'white'] };
// 知って いる 人の しくみの 役（合体技を しない）: ゲッコー … 大かんそうの 前ぶれ・水が ない（1人が 鳴らす）／
//   シロフクロウ … いつも（合体技は ねらいを えらべない … 本物を ねらう ため ふつうの 攻撃と 技で）
NEED9_HOOKS.push((b, a, claim) => {
  const st = c10bState(b);
  if (!st || st.won) return false;
  // シロフクロウ: 本物が わからない 間・ぬすむの ねらいは しくみの 役（本物が わかって いれば 本物に 合体技 … 下の MODES9.know.act）
  if (st.kind === 'owl') return !owlKnown(b) || (st.stealReady && st.stealAim === a.id && !a.defending);
  const m = geckoOf(b);
  if (!m?.alive) return false;
  if (m.c10x.bigReady && !a.defending) return true;
  if (m.c10x.water <= 0 && claim(b, `ring10b.${st.rings}.${st.bigs}.${st.ticks}`)) return true;
  return false;
});
const owlKnown = (b) => { const st = c10bState(b); return !!st && st.kind === 'owl' && (st.seen === st.real || litNow10b(b)); };
// 知って いる 人の 合体技: シロフクロウの 戦いでは 本物を ねらう（わからない 間は しない … NEED9_HOOKS）
const knowAct10b = MODES9.know.act;
MODES9.know.act = (b, a, boss) => {
  const st = c10bState(b);
  if (st?.kind === 'owl' && !st.won) return need10b(b, a) ? false : dualPlan(b, a, b.get(st.real), null);
  return knowAct10b(b, a, boss);
};
const need10b = (b, a) => NEED9_HOOKS.some((f) => f(b, a, () => true));
STATS9_HOOKS.push((b) => {
  const st = c10bState(b);
  if (!st) return {};
  if (st.kind === 'gecko') return { xRings: st.rings, xElems: st.elems, xSand: st.sandTurns, xBig: st.bigs, xBigG: st.bigGuards, xStop: st.stops };
  return { oTease: st.teases, oShuffle: st.shuffles, oSteal: st.steals, oStealB: st.stealBlocked, oHalf: st.half ? 1 : 0, oTeru: b.c9sp?.teru?.uses || 0 };
});
export function c10bText(res) {
  const avg = (k) => res.reduce((s, r) => s + (r[k] || 0), 0) / res.length;
  if (res.some((r) => r.xRings !== undefined)) return `  鳴らす${avg('xRings').toFixed(1)} 水の技${avg('xElems').toFixed(1)} 砂の番${avg('xSand').toFixed(1)} 大かんそう${avg('xBig').toFixed(1)}(守${avg('xBigG').toFixed(1)}) 止め${avg('xStop').toFixed(1)}`;
  if (res.some((r) => r.oTease !== undefined)) return `  からかい${avg('oTease').toFixed(1)} シャッフル${avg('oShuffle').toFixed(1)} ぬすむ${avg('oSteal').toFixed(1)}(守${avg('oStealB').toFixed(1)}) 4人${avg('oHalf').toFixed(2)} てらす${avg('oTeru').toFixed(1)}`;
  return '';
}

// ───── 第97回 B班: 第3部 第2章 第3幕「紫と、うばわれた音」の 中ボスと 幕の ボス（docs/plan-part3-c10c.md の 15-3）─────
//   たいさムスカリ（c10c_colonel。Lv114。colonel）・アルゴル（c10c_algol。Lv116。algol）。一本道 … ORDER=act3（第1幕・第2幕の 4つの 音は いつも 入れる）
//   めやす（15-3）: 2秒と 5秒の 両方で 人4人の 知って いる 人 6〜7わり・知らない 人 3わり いか・完全オート 5% いか（どの 作戦でも）・
//     4〜6分（ボスは 5〜7分）・1人＋酒場3人 5わり いじょう・1人＋家族の仲間3 5わり いじょう（完全オート 0）・1人＋魔物3 5わり 近く・
//     2人＋自動 2人 5〜7わり・5人 9わりを こえない・ひとり 3わり いじょう（ひとりの 完全オートは 2わり いか）・勝った 時 8分 いない
//   TACTICS=balanced,aggressive,… … 完全オートの 作戦（ない ときは shared/ai.js の TACTICS の ぜんぶ。めいれいさせろ は のぞく）。
//     作戦の 係（第96回）が 作戦を 直した あとも、この まま はかり直せる（作戦の 名前は ai.js から 読む）
CH9_IDS.colonel = C10C_BATTLE.colonel;
CH9_IDS.algol = C10C_BATTLE.algol;
export const CH10C_LV = { colonel: 114, algol: 116 };
Object.assign(LV9, CH10C_LV);
// その ころの ★装備（第1幕・第2幕の 中ボスの 品 ＋ ★5 ＋ この 幕の その ころまでの ★5 と たいさの 品）
CH9_KIT.colonel = {
  hero: ['c8s_star_sword', 'c10wt_moon_mail', 'c10wt_melt_shield', 'c10it_cloud_helm', 'c10bb_hourglass'],
  daikenja: ['c9b_owl_staff', 'c10bt_ripple_robe', null, 'c10gt_flower_hat', 'c10bb_owl_plume'],
  god_hand: ['c9at_star_claw', 'c10it_bridge_gi', null, 'c10wt_quiet_helm', 'c10rb_goggles'],
  high_priest: ['c9b_owl_staff', 'c10gt_root_robe', 'c10bt_mirror_shield', 'c7l_kingdom_crown', 'c10gb_monocle'],
};
CH9_KIT.algol = {
  hero: ['c8s_star_sword', 'c10ft_belt_mail', 'c10ft_star_shield', 'c10it_cloud_helm', 'c10cb_badge'],
  daikenja: ['c9b_owl_staff', 'c10bt_ripple_robe', null, 'c10gt_flower_hat', 'c10bb_owl_plume'],
  god_hand: ['c9at_star_claw', 'c10it_bridge_gi', null, 'c10wt_quiet_helm', 'c10bb_hourglass'],
  high_priest: ['c9b_owl_staff', 'c10gt_root_robe', 'c10wt_melt_shield', 'c7l_kingdom_crown', 'c10gb_monocle'],
};
const ACT2_NOTES = [...ACT1_NOTES, C10B.noteSo, C10B.noteLa];
Object.assign(ORDER_FLAGS, { act3: { colonel: [...ACT2_NOTES], algol: [...ACT2_NOTES] } });
ORDER_LABEL.act3 = '一本道';
Object.assign(ORDERS_OF, { colonel: ['act3'], algol: ['act3'] });
// 完全オートの 作戦（shared/ai.js の TACTICS。めいれいさせろ は オートでは バッチリと おなじ なので のぞく）
export const AUTO_TACTICS = Object.keys(TACTICS).filter((k) => !TACTICS[k].manual);
export const tacticsOf = () => (process.env.TACTICS ? process.env.TACTICS.split(',').filter((k) => TACTICS[k]) : AUTO_TACTICS);
// 知って いる 人の しくみの 役（合体技を しない）: たいさ … 光った 石に いる（うつる・てらす）・光って いない 時に せまい／
//   アルゴル … 星の音の 前ぶれ（星のうた 1人・のこりは 防御）・とばりに てらす（1人）
NEED9_HOOKS.push((b, a, claim) => {
  const st = c10cState(b);
  if (!st || st.won) return false;
  const m = c10cBoss(b);
  if (!m?.alive) return false;
  if (st.kind === 'colonel') {
    if (onLit(b, a) && !st.dazzle) return true;
    if (!litStones(b).length && tightOf(b, a)) return true;
    return false;
  }
  const k = m.c10y;
  if (k.ringReady && !a.defending) return true;
  const sp = b.c9sp || {};
  if (k.veil > 0 && sp.teru?.charge >= sp.teru?.max && claim(b, `teru10c.${sp.teru.uses}`)) return true;
  return false;
});
STATS9_HOOKS.push((b) => {
  const st = c10cState(b);
  if (!st) return {};
  if (st.kind === 'colonel') return { kBolt: st.bolts, kHit: st.hits, kMiss: st.misses, kMove: st.moves, kCrack: st.cracks, kTight: st.tightHits, kDazzle: st.dazzles };
  return { yEat: st.eats, yEaten: st.eaten, yHeal: st.healed, yVeil: st.veils, yClear: st.clears, yRing: st.rings, yBlast: st.blasts, yBlastG: st.blastGuards, yStill: st.stills };
});
export function c10cText(res) {
  const avg = (k) => res.reduce((s, r) => s + (r[k] || 0), 0) / res.length;
  if (res.some((r) => r.kBolt !== undefined)) return `  雷${avg('kBolt').toFixed(1)}(当たり${avg('kHit').toFixed(1)}人・外れ${avg('kMiss').toFixed(1)}) うつる${avg('kMove').toFixed(1)} くずす${avg('kCrack').toFixed(1)} せまい${avg('kTight').toFixed(1)} まぶしい${avg('kDazzle').toFixed(1)}`;
  if (res.some((r) => r.yEat !== undefined)) return `  食べる${avg('yEat').toFixed(1)}(${avg('yEaten').toFixed(1)}こ・回復${avg('yHeal').toFixed(0)}) とばり${avg('yVeil').toFixed(1)}(てらす${avg('yClear').toFixed(1)}) 音${avg('yRing').toFixed(1)}(全体${avg('yBlast').toFixed(1)}・守${avg('yBlastG').toFixed(1)}・止め${avg('yStill').toFixed(1)})`;
  return '';
}

// ───── 第99回 B班: 第3部 第2章 第4幕「金の音と、星の橋」の 門の 番人 4つと 幕の ボス（docs/plan-part3-c10d.md の 16-3）─────
//   門の 番人（c10d_gate1〜4。Lv115〜117。gate1〜gate4）・光をはかる鏡 ミラーレ（c10d_mirror。Lv118。mirror）。一本道 … ORDER=act4（第1幕〜第3幕の 5つの 音は いつも 入れる）
//   node tools/sim-ch10.mjs 30 act4（gates … 門だけ）
//   めやす（16-3）: 門 … 知って いる 人 9わり・完全オート 2わり いか・1回 2〜3分／ボス … 2秒と 5秒の 両方で 人4人の 知って いる 人 6〜7わり・
//     知らない 人 3わり いか・完全オート 5% いか（どの 作戦でも）・5〜7分／人が 少ない 時は 前の 幕と おなじ 表（勝った 時 8分 いない）
//   連戦 ぜんたい（node tools/sim-ch10.mjs 30 chain）: 門 4つと ボスを HP と MP を 引きついで 1回の のぼりで。いずみ（WELL=smart,same,none）
//     smart … うまく えらぶ（たおれた 人が いる・HPが へって いる → いやし・MPが 少ない → ちえ・ほかは ちから）／same … いつも いやし／none … えらばない
//     戦いの あとは「まんたん」と おなじく 呪文で 回復する（MPを 使う。たおれた 人は 生き返らせる 呪文で）
//     めやす: 超級職 4人・いずみを うまく えらぶ … 6〜7わり（えらばない … 3わり いか）
Object.assign(CH9_IDS, { gate1: C10D_BATTLE.gate1, gate2: C10D_BATTLE.gate2, gate3: C10D_BATTLE.gate3, gate4: C10D_BATTLE.gate4, mirror: C10D_BATTLE.mirror });
export const CH10D_LV = { gate1: 115, gate2: 116, gate3: 116, gate4: 117, mirror: 118 };
Object.assign(LV9, CH10D_LV);
export const C10D_GATE_KEYS = ['gate1', 'gate2', 'gate3', 'gate4'];
// その ころの ★装備（前の 幕までの ★5 と ボスの 品 ＋ ボスは この 幕の ★5〈おどり場 2つと いただきの たて〉）
const GATE_KIT = {
  hero: ['c8s_star_sword', 'c10ft_belt_mail', 'c10ft_star_shield', 'c10it_cloud_helm', 'c10cb_gray_star'],
  daikenja: ['c9b_owl_staff', 'c10bt_ripple_robe', null, 'c10gt_flower_hat', 'c10cb_badge'],
  god_hand: ['c9at_star_claw', 'c10it_bridge_gi', null, 'c10wt_quiet_helm', 'c10bb_hourglass'],
  high_priest: ['c9b_owl_staff', 'c10gt_root_robe', 'c10wt_melt_shield', 'c7l_kingdom_crown', 'c10gb_monocle'],
};
for (const k of ['gate1', 'gate2', 'gate3', 'gate4']) CH9_KIT[k] = GATE_KIT;
CH9_KIT.mirror = {
  hero: ['c8s_star_sword', 'c10dt_stair_mail', 'c10dt_summit_shield', 'c10it_cloud_helm', 'c10cb_gray_star'],
  daikenja: ['c9b_owl_staff', 'c10dt_cloud_robe', null, 'c10gt_flower_hat', 'c10cb_badge'],
  god_hand: ['c9at_star_claw', 'c10it_bridge_gi', null, 'c10wt_quiet_helm', 'c10bb_hourglass'],
  high_priest: ['c9b_owl_staff', 'c10gt_root_robe', 'c10wt_melt_shield', 'c7l_kingdom_crown', 'c10gb_monocle'],
};
const ACT3_NOTES = [...ACT2_NOTES, 'c10_note_si'];
Object.assign(ORDER_FLAGS, { act4: Object.fromEntries([...C10D_GATE_KEYS, 'mirror'].map((k) => [k, [...ACT3_NOTES]])) });
ORDER_LABEL.act4 = '一本道';
for (const k of [...C10D_GATE_KEYS, 'mirror']) ORDERS_OF[k] = ['act4'];
// 知って いる 人の しくみの 役（合体技を しない）: 鳴らすと よい 色が ある（まだ だれも 鳴らそうと して いない）・光を はかるの ねらい・
//   うつし身に てらす（1人）・ミラーレの 2色に 星のうた（1人）
NEED9_HOOKS.push((b, a, claim) => {
  const st = c10dState(b);
  if (!st || st.won) return false;
  const m = mirrorOf10d(b);
  const v = m?.alive ? m.c10v : null;
  if (v?.measureReady && v.measureAim === a.id && !a.defending) return true;
  const sp = b.c9sp || {};
  if (copyOf10d(b)?.alive && sp.teru?.charge >= sp.teru?.max && claim(b, `teru10d.${sp.teru.uses}`)) return true;
  if (v && v.colors.length >= 2 && !v.rung.length && sp.song?.charge >= sp.song?.max && claim(b, `song10d.${sp.song.uses}`)) return true;
  if (neededColors(b, a.id).length) return true;
  return false;
});
STATS9_HOOKS.push((b) => {
  const st = c10dState(b);
  if (!st) return {};
  if (st.kind === 'gate') return { dRing: st.rings, dHit: st.hits, dMiss: st.misses, dBreak: st.breaks, dShift: st.shifts, dMark: st.marks, dAuto: st.autoRings };
  return { mRing: st.rings, mMiss: st.misses, mBreak: st.breaks, mBack: st.backs, mSong: st.songs, mMeas: st.measures, mMeasG: st.measureGuards, mCopy: st.copies, mCopyGone: st.copyGone, mAuto: st.autoRings };
});
export function c10dText(res) {
  const avg = (k) => res.reduce((s, r) => s + (r[k] || 0), 0) / res.length;
  if (res.some((r) => r.dRing !== undefined)) return `  鳴らす${avg('dRing').toFixed(1)}(当たり${avg('dHit').toFixed(1)}・外れ${avg('dMiss').toFixed(1)}・自動${avg('dAuto').toFixed(1)}) われた${avg('dBreak').toFixed(1)} かわる${avg('dShift').toFixed(1)} しるし${avg('dMark').toFixed(1)}`;
  if (res.some((r) => r.mRing !== undefined)) return `  鳴らす${avg('mRing').toFixed(1)}(外れ${avg('mMiss').toFixed(1)}・自動${avg('mAuto').toFixed(1)}) われた${avg('mBreak').toFixed(1)} もどる${avg('mBack').toFixed(1)} うた${avg('mSong').toFixed(1)} はかる${avg('mMeas').toFixed(1)}(守${avg('mMeasG').toFixed(1)}) うつし身${avg('mCopy').toFixed(2)}(消${avg('mCopyGone').toFixed(2)})`;
  return '';
}

// ───── 連戦 ぜんたい ─────
// 戦いの あとの「まんたん」（呪文で。MPを 使う）: たおれた 人を 生き返らせる 呪文 → 回復の 呪文（MPの むだが 少ない じゅん）
const fieldSpells = (ch, type) => learnedAbilities(ch).filter((id) => ABILITIES[id]?.field && ABILITIES[id].effect?.type === type).map((id) => ({ id, a: ABILITIES[id], cost: mpCost(ch, id) }));
const maxHpOf = (ch) => computeStats(ch).maxHp;
const maxMpOf = (ch) => computeStats(ch).maxMp;
export function fieldHeal10d(chars) {
  let mp = 0;
  for (let guard = 0; guard < 20; guard++) {
    const dead = chars.find((c) => !(c.hp > 0));
    if (!dead) break;
    let best = null;
    for (const ch of chars.filter((c) => c.hp > 0)) for (const s of fieldSpells(ch, 'revive')) if (ch.mp >= s.cost && (!best || s.cost < best.cost || (s.cost === best.cost && (s.a.effect.hpRatio ?? 0.5) > (best.a.effect.hpRatio ?? 0.5)))) best = { ch, ...s };
    if (!best) break;
    best.ch.mp -= best.cost;
    mp += best.cost;
    dead.hp = Math.max(1, Math.round(maxHpOf(dead) * (best.a.effect.hpRatio ?? 0.5)));
  }
  for (let guard = 0; guard < 80; guard++) {
    const hurt = chars.filter((c) => c.hp > 0 && c.hp < maxHpOf(c)).sort((x, y) => (maxHpOf(y) - y.hp) - (maxHpOf(x) - x.hp));
    if (!hurt.length) break;
    const need = maxHpOf(hurt[0]) - hurt[0].hp;
    const total = hurt.reduce((t, h) => t + maxHpOf(h) - h.hp, 0);
    let best = null;
    for (const ch of chars.filter((c) => c.hp > 0)) {
      for (const s of fieldSpells(ch, 'heal')) {
        if (ch.mp < s.cost || !['ally', 'allies'].includes(s.a.target) || !s.a.effect.base) continue;
        if (s.a.target === 'allies' && hurt.length < 2) continue;
        let amt = (s.a.effect.base[0] + s.a.effect.base[1]) / 2;
        if (!s.a.effect.fixed) amt *= powScaleOf(computeStats(ch).heal, s.a.effect, true);
        const useful = s.a.target === 'allies' ? hurt.reduce((t, h) => t + Math.min(maxHpOf(h) - h.hp, amt), 0) : Math.min(need, amt);
        const enough = s.a.target === 'allies' ? useful >= total * 0.8 : amt >= need;
        const score = useful / Math.max(1, s.cost) + (enough ? 1000 / Math.max(1, s.cost) : 0);
        if (!best || score > best.score) best = { ch, ...s, amt, score };
      }
    }
    if (!best) break;
    best.ch.mp -= best.cost;
    mp += best.cost;
    for (const t of best.a.target === 'allies' ? hurt : [hurt[0]]) t.hp = Math.min(maxHpOf(t), Math.round(t.hp + best.amt));
  }
  return mp;
}
// 星の いずみの えらび方（smart … うまく・same … いつも いやし・none … えらばない）
export const WELL_LABEL = { smart: 'うまく えらぶ', same: 'いつも いやし', none: 'えらばない　' };
//   うまく えらぶ: たおれた 人が 2人 いじょう・HPが 半分 いか → いやし／MPが へって いる → ちえ（ボスの 前は 6わり、門の 間は 8わり）／
//   ほかは ちから（いずみは 戦いの 前。この あと 呪文で HPを もどす ので、のこりの MPを 見る）
export function pickWell10d(chars, how, beforeBoss = false) {
  if (how === 'none') return null;
  if (how === 'same') return 'heal';
  const dead = chars.filter((c) => !(c.hp > 0)).length;
  const hp = chars.reduce((t, c) => t + Math.max(0, c.hp), 0) / chars.reduce((t, c) => t + maxHpOf(c), 0);
  const mp = chars.reduce((t, c) => t + c.mp, 0) / Math.max(1, chars.reduce((t, c) => t + maxMpOf(c), 0));
  if (dead >= 2 || hp < 0.5) return 'heal';
  if (mp < (beforeBoss ? 0.6 : 0.8)) return 'mana';
  return 'power';
}
// 門 4つと ボスを 1回の のぼりで（HP と MP を 引きつぐ）。かえす 値: { outcome, at〈負けた 戦い〉, seconds, wells: [...] }
export function c10dChain(mode, seed, { party = 'p4', react, well = 'smart', tactics, log = false, lv = LV9.mirror } = {}) {
  // レベルは ボスの すすめ Lv（118。のぼる 前に ボスに 合わせて 来る）
  const list = ch9Allies('gate1', lv, party, true);
  const chars = list.map((x) => x.char);
  const wells = [];
  let seconds = 0;
  let power = false;
  const steps = [...C10D_GATE_KEYS, 'mirror'];
  for (let i = 0; i < steps.length; i++) {
    const key = steps[i];
    // 見つけた ★装備に つけかえる（いただきの 前に この 幕の ★5 … CH9_KIT.mirror）
    list.forEach((x) => {
      const k = x.know !== false && !x.monster ? CH9_KIT[key]?.[x.char.job] : null;
      if (k) ['weapon', 'armor', 'shield', 'head', 'acc'].forEach((sl, j) => { if (k[j]) x.char.equip[sl] = k[j]; });
    });
    for (const c of chars) { c.hp = Math.min(c.hp, maxHpOf(c)); c.mp = Math.min(c.mp, maxMpOf(c)); }
    const r = ch9Run(key, lv, mode, seed + i * 104729, {
      party, list, flags: ORDER_FLAGS.act4[key], ...(react !== undefined ? { react } : {}), ...(tactics ? { tactics } : {}),
      moreHooks: power ? { c10dPower: true } : null,
      onEnd: (b) => b.allies.forEach((a, j) => { chars[j].hp = a.alive ? a.hp : 0; chars[j].mp = a.mp; }),
    });
    power = false;
    seconds += r.seconds;
    if (log) console.log(`  ${key}: ${r.outcome} ${r.seconds}秒 HP ${chars.map((c) => c.hp).join('/')} MP ${chars.map((c) => c.mp).join('/')}`);
    if (r.outcome !== 'win') return { outcome: 'lose', at: key, seconds, wells, reached: i };
    if (i === steps.length - 1) break;
    // おどり場: いずみ → まんたん（呪文）
    const w = pickWell10d(chars, well, steps[i + 1] === 'mirror');
    wells.push(w || '-');
    if (w === 'heal') for (const c of chars) c.hp = maxHpOf(c);
    if (w === 'mana') for (const c of chars) c.mp = maxMpOf(c);
    if (w === 'power') power = true;
    fieldHeal10d(chars);
    if (log) console.log(`    いずみ ${w || 'なし'} → HP ${chars.map((c) => c.hp).join('/')} MP ${chars.map((c) => c.mp).join('/')}`);
  }
  return { outcome: 'win', at: null, seconds, wells, reached: steps.length };
}

// 1つの 遊び方を N回（order … 'red'・'green'・'blue'・'white'）
export function c10Batch(boss, mode, N, { party = 'p4', react, order = 'red', lv = LV9[boss], tactics } = {}) {
  const flags = ORDER_FLAGS[order][boss];
  const res = [...Array(N).keys()].map((i) => ch9Run(boss, lv, mode, 9090 + i * 7919, { party, flags, ...(react !== undefined ? { react } : {}), ...(tactics ? { tactics } : {}) }));
  return { res, ...summary9(res) };
}

if (process.argv[1]?.endsWith('sim-ch10.mjs')) {
  const N = Number(process.argv[2] || 30);
  const which = !process.argv[3] || process.argv[3] === 'all' ? ['tamagon', 'mold'] : process.argv[3] === 'act2' ? ['gecko', 'owl'] : process.argv[3] === 'act3' ? ['colonel', 'algol'] : process.argv[3] === 'act4' ? [...C10D_GATE_KEYS, 'mirror'] : process.argv[3] === 'gates' ? C10D_GATE_KEYS : process.argv[3].split(',');
  if (process.argv[3] === 'chain') {
    // 第99回 B班: 連戦 ぜんたい（門 4つ ＋ ボス）。WELL=smart,same,none・MODES=know,blind,auto・PARTY・REACT
    const parties = (process.env.PARTY || 'p4').split(',');
    const reacts = (process.env.REACT || '2000,5000').split(',').map(Number);
    const modes = (process.env.MODES || 'know').split(',');
    const wellsOf = (process.env.WELL || 'smart,same,none').split(',');
    if (process.env.LOG) console.log(c10dChain(process.env.MODE || 'know', Number(process.env.SEED || 1), { party: parties[0], react: reacts[0], well: wellsOf[0], log: true, tactics: process.env.TACTICS?.split(',')[0] }));
    else {
      console.log(`■ 連戦 ぜんたい（門 4つ ＋ ミラーレ。HP と MP を 引きつぐ・${N}回）`);
      for (const party of parties) for (const mode of modes) for (const react of mode === 'auto' ? [reacts[0]] : reacts) for (const well of wellsOf) {
        const res = [...Array(N).keys()].map((i) => c10dChain(mode, 9090 + i * 7919, { party, react, well }));
        const w = res.filter((r) => r.outcome === 'win');
        const at = {};
        for (const r of res) if (r.at) at[r.at] = (at[r.at] || 0) + 1;
        const sec = w.length ? w.reduce((t, r) => t + r.seconds, 0) / w.length : 0;
        const ws = {};
        for (const r of w) for (const x of r.wells) ws[x] = (ws[x] || 0) + 1;
        console.log(`  ${(PARTIES9[party] || EXTRA_PARTIES9[party]).label} ${MODES9[mode].label} ${mode === 'auto' ? '　　' : `${react / 1000}秒`} いずみ ${WELL_LABEL[well]} 通せた ${String(Math.round((w.length / N) * 100)).padStart(3)}%（${(sec / 60).toFixed(1)}分）  負けた所 ${JSON.stringify(at)}  いずみ ${JSON.stringify(ws)}`);
      }
    }
  } else if (process.env.LOG) {
    const boss = process.env.BOSS || 'tamagon';
    const order = process.env.ORDER || ORDERS_OF[boss][0];
    console.log(ch9Run(boss, Number(process.env.LV || LV9[boss]), process.env.MODE || 'know', Number(process.env.SEED || 1), { log: true, party: process.env.PARTY || 'p4', flags: ORDER_FLAGS[order][boss], tactics: tacticsOf()[0] }));
  } else {
    const parties = !process.env.PARTY ? ['p4'] : process.env.PARTY === 'all' ? Object.keys(PARTIES9) : process.env.PARTY.split(',');
    const reacts = (process.env.REACT || '2000,5000').split(',').map(Number);
    const modes = process.env.MODES ? process.env.MODES.split(',') : Object.keys(MODES9);
    for (const boss of which) {
      const orders = !process.env.ORDER || process.env.ORDER === 'both' ? ORDERS_OF[boss] : [process.env.ORDER];
      console.log(`■ ${boss}（${CH9_IDS[boss]}。Lv${LV9[boss]}・${N}回）`);
      for (const party of parties) {
        for (const mode of modes) {
          if (party !== 'p4' && mode === 'blind') continue;
          for (const order of orders) {
            // 完全オートは 作戦ごと（第3幕から。前の 幕は バッチリがんばれ だけ … 前の 数字と おなじ）
            const tacs = mode === 'auto' && ['act3', 'act4'].includes(ORDERS_OF[boss]?.[0]) ? tacticsOf() : [null];
            for (const tactics of tacs) {
              for (const react of mode === 'auto' ? [reacts[0]] : reacts) {
                const r = c10Batch(boss, mode, N, { party, react, order, ...(tactics ? { tactics } : {}) });
                const tl = tactics ? `（${TACTICS[tactics].name}）` : '';
                console.log(`  ${(PARTIES9[party] || EXTRA_PARTIES9[party]).label} ${MODES9[mode].label}${tl} ${ORDER_LABEL[order]} ${mode === 'auto' ? '　　' : `${react / 1000}秒`} 勝率 ${String(Math.round(r.rate * 100)).padStart(3)}%（勝ち${r.sec.toFixed(0).padStart(4)}秒）${c10Text(r.res)}${c10bText(r.res)}${c10cText(r.res)}${c10dText(r.res)}`);
              }
            }
          }
        }
      }
    }
  }
}
