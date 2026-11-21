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

// 1つの 遊び方を N回（order … 'red'・'green'・'blue'・'white'）
export function c10Batch(boss, mode, N, { party = 'p4', react, order = 'red', lv = LV9[boss], tactics } = {}) {
  const flags = ORDER_FLAGS[order][boss];
  const res = [...Array(N).keys()].map((i) => ch9Run(boss, lv, mode, 9090 + i * 7919, { party, flags, ...(react !== undefined ? { react } : {}), ...(tactics ? { tactics } : {}) }));
  return { res, ...summary9(res) };
}

if (process.argv[1]?.endsWith('sim-ch10.mjs')) {
  const N = Number(process.argv[2] || 30);
  const which = !process.argv[3] || process.argv[3] === 'all' ? ['tamagon', 'mold'] : process.argv[3] === 'act2' ? ['gecko', 'owl'] : process.argv[3] === 'act3' ? ['colonel', 'algol'] : process.argv[3].split(',');
  if (process.env.LOG) {
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
            const tacs = mode === 'auto' && ORDERS_OF[boss]?.[0] === 'act3' ? tacticsOf() : [null];
            for (const tactics of tacs) {
              for (const react of mode === 'auto' ? [reacts[0]] : reacts) {
                const r = c10Batch(boss, mode, N, { party, react, order, ...(tactics ? { tactics } : {}) });
                const tl = tactics ? `（${TACTICS[tactics].name}）` : '';
                console.log(`  ${(PARTIES9[party] || EXTRA_PARTIES9[party]).label} ${MODES9[mode].label}${tl} ${ORDER_LABEL[order]} ${mode === 'auto' ? '　　' : `${react / 1000}秒`} 勝率 ${String(Math.round(r.rate * 100)).padStart(3)}%（勝ち${r.sec.toFixed(0).padStart(4)}秒）${c10Text(r.res)}${c10bText(r.res)}${c10cText(r.res)}`);
              }
            }
          }
        }
      }
    }
  }
}
