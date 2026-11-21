// 第94回 B班: 第3部 第2章 第1幕「赤と緑」の 2人の 中ボスの 強さを 見る（docs/plan-part3-c10a.md の 13-5）
//   ドクター・タマゴン と グルグルドリル号（c10r_boss。Lv107。tamagon）・カビだんしゃく モルド と カビカビ号（c10g_boss。Lv108。mold）
//   わくは tools/sim-ch9.mjs の ch9Run（人が 画面で できる 動き … えらぶ 時間 REACT=2000・ブラウザの 速さ・前ぶれの 間は 待つ）
// つかいかた: node tools/sim-ch10.mjs [回数] [tamagon|mold|all]
//   PARTY=p4,k1npc,… … 人数の やり方（PARTY=all … 全部。sim-ch9.mjs の PARTIES9）・REACT=2000,5000 … えらぶ 時間（いくつでも）
//   ORDER=red|green|both … どちらを 先に したか（先に 取った 音の スピカの ごほうびを 入れる。ない ときは both）
//     red（赤 → 緑）… タマゴンは ごほうび なし・モルドは 赤の 音（ほのかな光 9%）
//     green（緑 → 赤）… モルドは ごほうび なし・タマゴンは 緑の 音（てらすが 3回で たまる）
//   LOG=1 BOSS=tamagon MODE=know SEED=1 PARTY=p4 … 1回だけ ようすを 出す
//   めやす（13-5）: 2秒と 5秒の 両方で 人4人の 知って いる 人 6〜7わり（5秒でも 6わり 近く）・知らない 人 3わり いか・完全オート 5% いか・
//     1人＋酒場3人 5わり いじょう・1人＋魔物3 5わり 近く・2人＋自動 2人 5〜7わり・ひとり 3わり いじょう（ひとりの 完全オートより 高い）・
//     5人 9わりを こえない・勝った 時 8分 いない。赤 → 緑 と 緑 → 赤 の 差が 1わりを こえない
import { CH9_IDS, LV9, CH9_KIT, NEED9_HOOKS, STATS9_HOOKS, ch9Run, PARTIES9, MODES9, summary9 } from './sim-ch9.mjs';
import { C10A_BATTLE, C10A_B as C10A } from '../public/js/shared/maps/c10a-flags.js';
import { c10State, c10Boss, c10Conf, wallUp } from '../public/js/shared/battle-c10a.js';
import { C10R_TAMAGON } from '../public/js/shared/data/monsters-c10a.js';

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
  return `  きり${avg('gMist').toFixed(1)} きのこ${avg('gKinoko').toFixed(1)} ばくだん${avg('gBomb').toFixed(1)}(守${avg('gBombG').toFixed(1)}) てらす${avg('gTeru').toFixed(1)} うた${avg('gSong').toFixed(1)}`;
}
// 1つの 遊び方を N回（order … 'red'・'green'）
export function c10Batch(boss, mode, N, { party = 'p4', react, order = 'red', lv = LV9[boss] } = {}) {
  const flags = ORDER_FLAGS[order][boss];
  const res = [...Array(N).keys()].map((i) => ch9Run(boss, lv, mode, 9090 + i * 7919, { party, flags, ...(react !== undefined ? { react } : {}) }));
  return { res, ...summary9(res) };
}

if (process.argv[1]?.endsWith('sim-ch10.mjs')) {
  const N = Number(process.argv[2] || 30);
  const which = !process.argv[3] || process.argv[3] === 'all' ? ['tamagon', 'mold'] : process.argv[3].split(',');
  if (process.env.LOG) {
    const boss = process.env.BOSS || 'tamagon';
    const order = process.env.ORDER || 'red';
    console.log(ch9Run(boss, Number(process.env.LV || LV9[boss]), process.env.MODE || 'know', Number(process.env.SEED || 1), { log: true, party: process.env.PARTY || 'p4', flags: ORDER_FLAGS[order][boss] }));
  } else {
    const parties = !process.env.PARTY ? ['p4'] : process.env.PARTY === 'all' ? Object.keys(PARTIES9) : process.env.PARTY.split(',');
    const reacts = (process.env.REACT || '2000,5000').split(',').map(Number);
    const orders = !process.env.ORDER || process.env.ORDER === 'both' ? ['red', 'green'] : [process.env.ORDER];
    const modes = process.env.MODES ? process.env.MODES.split(',') : Object.keys(MODES9);
    for (const boss of which) {
      console.log(`■ ${boss}（${CH9_IDS[boss]}。Lv${LV9[boss]}・${N}回）`);
      for (const party of parties) {
        for (const mode of modes) {
          if (party !== 'p4' && mode === 'blind') continue;
          for (const order of orders) {
            for (const react of mode === 'auto' ? [reacts[0]] : reacts) {
              const r = c10Batch(boss, mode, N, { party, react, order });
              console.log(`  ${PARTIES9[party].label} ${MODES9[mode].label} ${order === 'red' ? '赤→緑' : '緑→赤'} ${mode === 'auto' ? '　　' : `${react / 1000}秒`} 勝率 ${String(Math.round(r.rate * 100)).padStart(3)}%（勝ち${r.sec.toFixed(0).padStart(4)}秒）${c10Text(r.res)}`);
            }
          }
        }
      }
    }
  }
}
