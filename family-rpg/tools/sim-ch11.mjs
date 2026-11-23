// 第101回 B班: 第3部 第3章 第1幕「星の船と、星座の島」の 中ボスと 幕の ボスの 強さを 見る（docs/plan-part3-c11a.md の 17-4）
//   星座のけもの（c11a_beast。Lv119。beast）・いかり船長 イバリー（c11a_pirate。Lv120。pirate）
//   わくは tools/sim-ch9.mjs の ch9Run（人が 画面で できる 動き … えらぶ 時間 REACT=2000・ブラウザの 速さ・人が えらぶ 間は 待つ）
//   前の 幕の 道具（tools/sim-ch10.mjs）と おなじ 使い方:
//   node tools/sim-ch11.mjs [回数] [beast|pirate|act1]
//     PARTY=p4,k1npc,k1fam,k1mon,k2npc,solo,p5 … 人数の やり方（sim-ch9.mjs の PARTIES9・EXTRA_PARTIES9）・REACT=2000,5000 … えらぶ 時間
//     PARTY=p2,p3 … 人2人だけ・人3人だけ（仲間なし。ボスの 表は bare）。道具は 直した ch9Run（人ごとに べつの 手）。前の 物さしは LEGACY=1
//     MODES=know,blind,auto … やり方・TACTICS=balanced,… … 完全オートの 作戦（ない ときは shared/ai.js の TACTICS の ぜんぶ。めいれいさせろ は のぞく）
//     TAC=… 人が 動かす キャラの 作戦・SUPTAC=… 自動の 仲間 みんなの 作戦（sim-ch9.mjs の ch9Run）
//     LOG=1 BOSS=pirate MODE=know SEED=1 PARTY=p4 … 1回だけ ようすを 出す
//   一本道 … 第2章の 7つの 音（スピカの ごほうび 6つ ＋ 金の 音）は いつも 入れる。この 幕の ごほうび（c11_act1）は まだ ない
//   めやす（17-4）: 中ボス … 超級職 4人で 知って いる 人 7〜8わり・完全オート 3わり いか・3〜4分
//     ボス … 2秒と 5秒の 両方で 人4人の 知って いる 人 6〜7わり・知らない 人 3わり いか・完全オート 5% いか（どの 作戦でも）・5〜7分
//     人が 少ない 時 … 1人＋酒場3人 5わり いじょう・1人＋家族の仲間3 5わり いじょう（完全オート 0）・1人＋魔物3 5わり 近く・
//       2人＋自動 2人 5〜7わり・5人 9わりを こえない・ひとり 3わり いじょう（ひとりの 完全オート 2わり いか）・勝った 時 8分 いない
import { CH9_IDS, LV9, CH9_KIT, NEED9_HOOKS, STATS9_HOOKS, MODES9, PARTIES9, EXTRA_PARTIES9, ch9Run } from './sim-ch9.mjs';
import { ORDER_FLAGS, ORDER_LABEL, ORDERS_OF, c10Batch, tacticsOf } from './sim-ch10.mjs';
import { dualPlan } from './sim-ch6.mjs';
import { C11A_BATTLE_B as C11A_BATTLE } from '../public/js/shared/maps/c11a-flags.js';
import { c11aState, captainOf, starsOf, clocksOf } from '../public/js/shared/battle-c11a.js';
import { TACTICS } from '../public/js/shared/ai.js';
// 第102回 B班: 第3部 第3章 第2幕「月の都と、名前のランプ」の ランプの番人（keeper。Lv121）・月のむかえ オボロ（oboro。Lv122）
import { C11B_BATTLE_B as C11B_BATTLE, C11B_B as C11B } from '../public/js/shared/data/c11b-names-b.js';
import { c11bState, keeperOf, oboroOf, tenninUp } from '../public/js/shared/battle-c11b.js';
// かんたんな 人（MODES9.easy・easy0。HUMAN=easy の 道具 … ch9Run(…, 'easy')）
import './sim-easy.mjs';

Object.assign(CH9_IDS, { beast: C11A_BATTLE.beast, pirate: C11A_BATTLE.pirate });
export const CH11A_LV = { beast: 119, pirate: 120 };
Object.assign(LV9, CH11A_LV);
// その ころの ★装備（前の 幕までの ★5 と ボスの 品 ＋ この 幕の ★5〈島 2 の よろい。ボスは ＋島 3 の ローブ・門の 前の たて・けものの 品〉）
CH9_KIT.beast = {
  hero: ['c8s_star_sword', 'c11at_isle_mail', 'c10dt_summit_shield', 'c10it_cloud_helm', 'c10db_hand_mirror'],
  daikenja: ['c9b_owl_staff', 'c10dt_cloud_robe', null, 'c10gt_flower_hat', 'c10cb_badge'],
  god_hand: ['c9at_star_claw', 'c10it_bridge_gi', null, 'c10wt_quiet_helm', 'c10cb_gray_star'],
  high_priest: ['c9b_owl_staff', 'c10gt_root_robe', 'c10wt_melt_shield', 'c7l_kingdom_crown', 'c10bb_hourglass'],
};
CH9_KIT.pirate = {
  hero: ['c8s_star_sword', 'c11at_isle_mail', 'c11at_gate_shield', 'c10it_cloud_helm', 'c11ab_star_collar'],
  daikenja: ['c9b_owl_staff', 'c11at_isle_robe', null, 'c10gt_flower_hat', 'c10db_hand_mirror'],
  god_hand: ['c9at_star_claw', 'c10it_bridge_gi', null, 'c10wt_quiet_helm', 'c10cb_gray_star'],
  high_priest: ['c9b_owl_staff', 'c10dt_cloud_robe', 'c10dt_summit_shield', 'c7l_kingdom_crown', 'c10cb_badge'],
};
// 第2章の 7つの 音（ごほうび 6つ）
export const CH10_NOTES = ['c10_note_re', 'c10_note_fa', 'c10_note_so', 'c10_note_la', 'c10_note_si', 'c10_note_do'];
Object.assign(ORDER_FLAGS, { c11a: { beast: [...CH10_NOTES], pirate: [...CH10_NOTES] } });
ORDER_LABEL.c11a = '一本道';
Object.assign(ORDERS_OF, { beast: ['c11a'], pirate: ['c11a'] });

// ───── 第102回 B班: 第2幕 ─────
Object.assign(CH9_IDS, { keeper: C11B_BATTLE.keeper, oboro: C11B_BATTLE.oboro });
export const CH11B_LV = { keeper: 121, oboro: 122 };
Object.assign(LV9, CH11B_LV);
// その ころの ★装備（前の 幕の ★5 と ボスの 品 ＋ この 幕の ★5〈塔への 道の うら の ローブ・塔 2階の よろい。ボスは ＋テラスの 前の たて・番人の 品〉）
CH9_KIT.keeper = {
  hero: ['c8s_star_sword', 'c11bt_tower_mail', 'c11at_gate_shield', 'c10it_cloud_helm', 'c11ab_anchor_badge'],
  daikenja: ['c9b_owl_staff', 'c11bt_back_robe', null, 'c10gt_flower_hat', 'c11ab_star_collar'],
  god_hand: ['c9at_star_claw', 'c10it_bridge_gi', null, 'c10wt_quiet_helm', 'c10cb_gray_star'],
  high_priest: ['c9b_owl_staff', 'c11at_isle_robe', 'c10dt_summit_shield', 'c7l_kingdom_crown', 'c10db_hand_mirror'],
};
CH9_KIT.oboro = {
  hero: ['c8s_star_sword', 'c11bt_tower_mail', 'c11bt_moon_shield', 'c10it_cloud_helm', 'c11bb_lamp_chain'],
  daikenja: ['c9b_owl_staff', 'c11bt_back_robe', null, 'c10gt_flower_hat', 'c11ab_star_collar'],
  god_hand: ['c9at_star_claw', 'c10it_bridge_gi', null, 'c10wt_quiet_helm', 'c11ab_anchor_badge'],
  high_priest: ['c9b_owl_staff', 'c11at_isle_robe', 'c11at_gate_shield', 'c7l_kingdom_crown', 'c10db_hand_mirror'],
};
// 一本道 … 第2章の 7つの 音 ＋ 第1幕の ながれ星（c11_act1）。この 幕の ごほうび（c11_act2）は まだ ない
Object.assign(ORDER_FLAGS, { c11b: { keeper: [...CH10_NOTES, C11B.act1], oboro: [...CH10_NOTES, C11B.act1] } });
ORDER_LABEL.c11b = '一本道';
Object.assign(ORDERS_OF, { keeper: ['c11b'], oboro: ['c11b'] });

// 知って いる 人の しくみの 役（合体技を しない）: 番人 … 明かりが かわる 前ぶれ ／ オボロ … スピカに よびかける・わすれの光の 前ぶれ
NEED9_HOOKS.push((b, a) => {
  const st = c11bState(b);
  if (!st || st.won || st.lost) return false;
  if (st.kind === 'keeper') return st.warn && !a.defending;
  if (st.flashReady && !a.defending) return true;
  return (st.forget >= st.max - 1 || (st.forget >= 1 && st.robeReady)) && !b.queue.some((q) => q.cmd?.id === 'm11_yobikake');
});
STATS9_HOOKS.push((b) => {
  const st = c11bState(b);
  if (!st) return {};
  if (st.kind === 'keeper') return { kSw: st.switches, kWaveG: st.waveGuards, kWave: st.waves, kCut: st.cutHits, kGood: st.goodHits, kHp: keeperOf(b) ? Math.max(0, keeperOf(b).hp) / keeperOf(b).maxHp : 0 };
  return {
    oPeak: st.peak, oRobe: st.robes, oTwice: st.twice, oCall: st.calls, oWaste: st.wasted, oAuto: st.autoCalls, oCure: st.cures, oFlash: st.flashes, oFlashG: st.flashGuards,
    oForgot: st.forgotHits, oSong: st.songCures, oTKill: st.tKills, oTBack: st.tBacks, oLost: st.lost ? 1 : 0, oTen: tenninUp(b).length, oHp: oboroOf(b) ? oboroOf(b).hp / oboroOf(b).maxHp : 0,
  };
});
export function c11bText(res) {
  const avg = (k) => res.reduce((s, r) => s + (r[k] || 0), 0) / res.length;
  if (res.some((r) => r.kSw !== undefined)) return `  かわる${avg('kSw').toFixed(1)}(守${avg('kWaveG').toFixed(1)}) 効かない${avg('kCut').toFixed(0)} 効く${avg('kGood').toFixed(0)} 番人のこり${(avg('kHp') * 100).toFixed(0)}%`;
  if (res.some((r) => r.oRobe !== undefined)) return `  衣${avg('oRobe').toFixed(1)}(2回${avg('oTwice').toFixed(1)}) よぶ${avg('oCall').toFixed(1)}(むだ${avg('oWaste').toFixed(1)}・自動${avg('oAuto').toFixed(1)}・仲間${avg('oCure').toFixed(1)}) 光${avg('oFlash').toFixed(1)}(守${avg('oFlashG').toFixed(1)}・わすれ${avg('oForgot').toFixed(1)}・うた${avg('oSong').toFixed(1)}) 天人${avg('oTKill').toFixed(1)}/${avg('oTBack').toFixed(1)} 最大わすれ${avg('oPeak').toFixed(1)} つれていかれ${avg('oLost').toFixed(2)} オボロのこり${(avg('oHp') * 100).toFixed(0)}%`;
  return '';
}

// 知って いる 人の しくみの 役（合体技を しない）: 船長 … 時計を 持って いる・いかりなげの ねらい／けもの … かみつきの ねらい
NEED9_HOOKS.push((b, a) => {
  const st = c11aState(b);
  if (!st || st.won) return false;
  if (st.kind === 'pirate') {
    if (clocksOf(b, a).length) return true;
    if (st.anchorReady && st.anchorAim === a.id && !a.defending) return true;
    return false;
  }
  return starsOf(b).some((e) => e.alive && e.c11s?.roarReady && e.c11s.aim === a.id) && !a.defending;
});
// 知って いる 人の 合体技: けもの … いちばん HPの わりあいが 多い 星（星が たおれて いる 間は のこりの HPの 少ない 星）
const knowAct11 = MODES9.know.act;
MODES9.know.act = (b, a, boss) => {
  const st = c11aState(b);
  if (st?.kind === 'beast' && !st.won) {
    if (NEED9_HOOKS.some((f) => f(b, a, () => true))) return false;
    const up = starsOf(b).filter((e) => e.alive);
    if (!up.length) return false;
    const down = starsOf(b).some((e) => !e.alive && e.c11s?.dead && e.c11s.left > 0);
    const t = down || b.allies.length === 1 ? up.slice().sort((x, y) => x.hp - y.hp)[0] : up.slice().sort((x, y) => y.hp / y.maxHp - x.hp / x.maxHp)[0];
    return dualPlan(b, a, t.species, null);
  }
  return knowAct11(b, a, boss);
};
STATS9_HOOKS.push((b) => {
  const st = c11aState(b);
  if (!st) return {};
  if (st.kind === 'beast') return { bKill: st.kills, bRev: st.revives, bStay: st.stayDead, bWarn: st.warns, bRoar: st.roars, bFang: st.fangs, bFangG: st.fangGuards, bMend: st.mends, bStar: b.c9sp?.starHits || 0 };
  return {
    pPass: st.passes, pEarly: st.early, pAuto: st.autoPasses, pThrow: st.throws, pCap: st.capBites, pAlly: st.allyBites, pAllyG: st.biteGuards,
    pAnchor: st.anchors, pAnchorG: st.anchorGuards, pSong: st.songs, pTwo: st.two ? 1 : 0, pCapHp: captainOf(b) ? captainOf(b).hp / captainOf(b).maxHp : 0,
  };
});
export function c11aText(res) {
  const avg = (k) => res.reduce((s, r) => s + (r[k] || 0), 0) / res.length;
  if (res.some((r) => r.bKill !== undefined)) return `  たおす${avg('bKill').toFixed(1)} よみがえる${avg('bRev').toFixed(1)}(前ぶれ${avg('bWarn').toFixed(1)}・光らない${avg('bStay').toFixed(1)}) かみつき${avg('bFang').toFixed(1)}(守${avg('bFangG').toFixed(1)}) 回復${avg('bMend').toFixed(1)}`;
  if (res.some((r) => r.pPass !== undefined)) return `  投げる${avg('pPass').toFixed(1)}(早い${avg('pEarly').toFixed(1)}・自動${avg('pAuto').toFixed(1)}) 船長が投げる${avg('pThrow').toFixed(1)} かまれる 船長${avg('pCap').toFixed(1)}・味方${avg('pAlly').toFixed(1)}(守${avg('pAllyG').toFixed(1)}) いかり${avg('pAnchor').toFixed(1)}(守${avg('pAnchorG').toFixed(1)}) うた${avg('pSong').toFixed(1)} 2つ${avg('pTwo').toFixed(2)} 船長のこり${(avg('pCapHp') * 100).toFixed(0)}%`;
  return '';
}

if (process.argv[1]?.endsWith('sim-ch11.mjs')) {
  const N = Number(process.argv[2] || 30);
  const which = !process.argv[3] || process.argv[3] === 'act1' || process.argv[3] === 'all' ? ['beast', 'pirate'] : process.argv[3] === 'act2' ? ['keeper', 'oboro'] : process.argv[3].split(',');
  if (process.env.LOG) {
    const boss = process.env.BOSS || 'pirate';
    console.log(ch9Run(boss, Number(process.env.LV || LV9[boss]), process.env.MODE || 'know', Number(process.env.SEED || 1), { log: true, party: process.env.PARTY || 'p4', flags: (ORDER_FLAGS.c11a[boss] || ORDER_FLAGS.c11b[boss]), tactics: tacticsOf()[0], ...(process.env.REACT ? { react: Number(process.env.REACT.split(',')[0]) } : {}) }));
  } else {
    const parties = !process.env.PARTY ? ['p4'] : process.env.PARTY === 'all' ? Object.keys(PARTIES9) : process.env.PARTY.split(',');
    const reacts = (process.env.REACT || '2000,5000').split(',').map(Number);
    // MODES=know,easy,blind,auto（easy … かんたんな 人。tools/sim-easy.mjs）
    const modes = process.env.MODES ? process.env.MODES.split(',') : Object.keys(MODES9);
    for (const boss of which) {
      console.log(`■ ${boss}（${CH9_IDS[boss]}。Lv${LV9[boss]}・${N}回）`);
      for (const party of parties) {
        for (const mode of modes) {
          if (party !== 'p4' && mode === 'blind') continue;
          // 完全オートは 作戦ごと
          const tacs = mode === 'auto' ? tacticsOf() : [null];
          for (const tactics of tacs) {
            for (const react of mode === 'auto' ? [reacts[0]] : reacts) {
              const r = c10Batch(boss, mode, N, { party, react, order: ORDERS_OF[boss][0], ...(tactics ? { tactics } : {}) });
              const tl = tactics ? `（${TACTICS[tactics].name}）` : '';
              console.log(`  ${(PARTIES9[party] || EXTRA_PARTIES9[party]).label} ${MODES9[mode].label}${tl} ${mode === 'auto' ? '　　' : `${react / 1000}秒`} 勝率 ${String(Math.round(r.rate * 100)).padStart(3)}%（勝ち${r.sec.toFixed(0).padStart(4)}秒）${c11aText(r.res)}${c11bText(r.res)}`);
            }
          }
        }
      }
    }
  }
}
