// 第3部 第1章 第1幕「星ふるえの夜」: 3人組と スイトール1号（c9a_trio。中ボス Lv96）・ホシモリの ともしびの ためし（c9a_trial。幕の ボス Lv98）の 強さを 見る
// 第90回 Z班: わく（sim-ch8.mjs と おなじ 作り）。B班: 中の 戦い方（知っている・知らない の 動き）と 星の子（shared/battle-c9a.js）
// 第91回 B班: 第2幕の ボス「デデドン大王」（c9b_king。Lv100。king）。皿を 先に こわす・まっ暗で てらす・大ジャンプで 身を 守る（shared/battle-c9b.js）
// 第92回 B班: 第3幕の 中ボス「なぞの番人 ナゾカケ」（c9c_riddle。Lv101。riddle）・ボス「ヒックリカエール2号」（c9c_trio2。Lv102。trio2）
//   なぞに 答える・砂が 少なく なったら ひっくり返す・ポチッとねで 身を 守る（shared/battle-c9c.js）
//   REACT=ミリびょう … 人が 動かす キャラが 自分の 番に なってから コマンドを えらぶまでの 時間（ブラウザの 人に 近づける。11-4 の さいご）
// つかいかた: node tools/sim-ch9.mjs [回数] [trio|trial|king|riddle|trio2|all] [lv,…]
//   めやす（docs/plan-part3.md の 9-3）: 超級職 4人（勇者・大賢者・ゴッドハンド・大神官。職業Lv10）・その ころの ★装備で
//     知っている 人 … 6〜7わり・知らない 人 … 3わり いか・完全オート … 0わり 近く。長さは 4〜6分
//   3つの やり方（MODES9）:
//     auto  … 完全オート（ふつうの オート。しくみを 使わない ＝「ぼうぎょ」も「明かりをわける」も えらばない）
//     blind … 知らない 人（しくみを 知らない。合体技は する）
//     know  … 知っている 人（しくみを 知って 戦う）
//   PARTY=k1npc,solo … 人数の やり方（PARTIES9。PARTY=all … 全部。人4人 いがいは おすすめの レベルで 完全オートと 知っている 人）
//     めやす: 1人＋自動 3人 … 5わり いじょう・2人＋自動 2人 … 5〜7わり・5人 … 9わりを こえない・完全オート … 0わり 近く
//     （人数で 合わせる 表は monsters-c9a.js の c9a.few。ひとりだけ〈仲間 なし〉は 勝てない … ノクトの ヒントの 3回目）
//   LOG=1 … 1回だけ ようすを 出す（BOSS=trio・MODE=know・LV・SEED・PARTY）
//   第96回 T班: 作戦を えらんで はかる（ai.js の TACTICS の キー。ない 時は 今まで どおり）
//     TAC=aggressive … 人が 動かす キャラの オートの 作戦（完全オートの 時の 作戦。知って いる 人が AI に まかせる 番も）
//     SUPTAC=heal … 自動の 仲間（酒場・家族の 仲間・魔物）の 作戦を みんな これに（ない 時は その 仲間の 作戦）
//     ch9Run(…, { tactics, supTac }) でも えらべる
//   HPK・ATKK・MAGK・SPD … 敵の 強さを かけて ためす
import { Battle } from '../public/js/shared/battle.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { fullHeal, computeStats, canEquip } from '../public/js/shared/stats.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { C9A_BATTLE } from '../public/js/shared/maps/c9a-flags.js';
import { addSpica, mechaOf, hoshimoriOf, nozzleOf, guardOf, unlitAllies } from '../public/js/shared/battle-c9a.js';
import { kingOf, c9bBusy, kingVisible, litNow, teruReady } from '../public/js/shared/battle-c9b.js';
import { C9B_BATTLE } from '../public/js/shared/maps/c9b-flags.js';
import { C9B_SHOP_WEAPONS, C9B_SHOP_ARMOR } from '../public/js/shared/data/items-c9b.js';
import { nazoOf, mechaOf9c, sandConf } from '../public/js/shared/battle-c9c.js';
import { C9C_BATTLE } from '../public/js/shared/maps/c9c-flags.js';
// 第93回 B班: 第4幕の ボス（下の「第4幕」の かたまり）
import { muState, okashiOf, songReady } from '../public/js/shared/battle-c9d.js';
import { C9D_BATTLE } from '../public/js/shared/maps/c9d-flags.js';
import { jobChar } from './sim-jobs.mjs';
import { dualPlan, CH6_JOBS } from './sim-ch6.mjs';
import { monsterChar } from './sim-monster-party.mjs';
import { NPC_SUPPORTS } from '../public/js/shared/data/shops.js';
import { makeNpcSupportChar } from '../public/js/shared/world/party.js';
import './sim-ch8.mjs';

export const CH9_IDS = { trio: C9A_BATTLE.trio, trial: C9A_BATTLE.trial, king: C9B_BATTLE.king, riddle: C9C_BATTLE.riddle, trio2: C9C_BATTLE.trio2 };
// おすすめの レベル（plan-part3.md の 9-3: 中ボス Lv96・ボス Lv98）
export const CH9_LV = { trio: 96, trial: 98 };
// 第2幕の ボス（plan-part3.md の 10-3: Lv100）。CH9_LV は 第1幕の まま（test/ch9-base.test.js）
export const CH9B_LV = { king: 100 };
// 第3幕の 中ボス・ボス（plan-part3.md の 11-4: Lv101・Lv102）
export const CH9C_LV = { riddle: 101, trio2: 102 };
export const LV9 = { ...CH9_LV, ...CH9B_LV, ...CH9C_LV };
// その ころの ★装備（[武器, よろい, たて, 頭, アクセ]。null は 店の いちばん よい 品）
//   3人組 … 第8章 第4幕の さいごまでの ★（＋ ソリトゥスの 品）・星ふるえの森の 宝箱（星くずのツメ）
//   ためし … ＋ 3人組の 品（バッジ・キラジョのおうぎ）・星の石の地下道 地下1〜4階の 宝箱
export const CH9_KIT = {
  trio: {
    hero: ['c8s_star_sword', 'c8rt_ice_mail', 'c8rt_iron_shield', 'c8rt_moon_helm', 'c8s_promise_crest'],
    daikenja: ['c8rt_sand_staff', 'c8rt_star_robe', null, 'c8rt_last_hat', 'c8s_promise_crest'],
    god_hand: ['c9at_star_claw', 'c8rt_fire_gi', null, 'c7it_bear_hat', 'c8s_promise_crest'],
    high_priest: ['c8k_magic_staff', 'c7it_queen_robe', 'c8rt_iron_shield', 'c7l_kingdom_crown', 'c8s_promise_crest'],
  },
  trial: {
    hero: ['c8s_star_sword', 'c9at_dawn_mail', 'c9at_stone_shield', 'c8rt_moon_helm', 'c9b_trio_badge'],
    daikenja: ['c8rt_sand_staff', 'c9at_moss_robe', null, 'c9at_owl_hat', 'c9b_trio_badge'],
    god_hand: ['c9at_star_claw', 'c8rt_fire_gi', null, 'c7it_bear_hat', 'c9b_trio_badge'],
    high_priest: ['c8k_magic_staff', 'c9at_moss_robe', 'c9at_stone_shield', 'c7l_kingdom_crown', 'c9b_trio_badge'],
  },
  // 大王 … ＋ ホシモリの 品（夜明けのはね・ホシモリのつえ）・大地の下と やしきの 宝箱（水晶のやり・ヒカリゴケのぼうし・もぐらの大オノ・ごちそうの大皿のたて）
  king: {
    hero: ['c8s_star_sword', 'c9at_dawn_mail', 'c9bt_table_shield', 'c8rt_moon_helm', 'c9b_dawn_feather'],
    daikenja: ['c9b_owl_staff', 'c9at_moss_robe', null, 'c9bt_moss_hat', 'c9b_dawn_feather'],
    god_hand: ['c9at_star_claw', 'c8rt_fire_gi', null, 'c7it_bear_hat', 'c9b_dawn_feather'],
    high_priest: ['c9b_owl_staff', 'c9at_moss_robe', 'c9at_stone_shield', 'c7l_kingdom_crown', 'c9b_dawn_feather'],
  },
  // ナゾカケ … ＋ 大王の 品（大王のナプキン・大王の木づち）・地下の川の 宝箱（地下の川のムチ）
  riddle: {
    hero: ['c8s_star_sword', 'c9at_dawn_mail', 'c9bt_table_shield', 'c8rt_moon_helm', 'c9bb_king_bib'],
    daikenja: ['c9b_owl_staff', 'c9at_moss_robe', null, 'c9bt_moss_hat', 'c9bb_king_bib'],
    god_hand: ['c9at_star_claw', 'c8rt_fire_gi', null, 'c7it_bear_hat', 'c9bb_king_bib'],
    high_priest: ['c9b_owl_staff', 'c9at_moss_robe', 'c9at_stone_shield', 'c7l_kingdom_crown', 'c9bb_king_bib'],
  },
  // ヒックリカエール2号 … ＋ ナゾカケの 品（くびかざり・ブーメラン）・ピラミッドの 宝箱（こがねスカラベの道着・さかさ王のかぶと・さかさの星のローブ）
  trio2: {
    hero: ['c8s_star_sword', 'c9at_dawn_mail', 'c9bt_table_shield', 'c9ct_upside_helm', 'c9cb_riddle_charm'],
    daikenja: ['c9b_owl_staff', 'c9ct_star_robe', null, 'c9bt_moss_hat', 'c9cb_riddle_charm'],
    god_hand: ['c9at_star_claw', 'c9ct_scarab_gi', null, 'c7it_bear_hat', 'c9cb_riddle_charm'],
    high_priest: ['c9b_owl_staff', 'c9ct_star_robe', 'c9at_stone_shield', 'c7l_kingdom_crown', 'c9cb_riddle_charm'],
  },
};
// ───── 第93回 B班: 第4幕の ボス「あそびたい魔人 ムウ」（c9d_mu。Lv104。mu）─────
//   2体を 同じくらいに けずる（HPの 多い 方を ねらう）・おかしビームの ねらいは 身を 守る・いっしょに ドーンの 前は 身を 守る・
//   おかしの 仲間が いれば 星のうた（shared/battle-c9d.js の c9dPlan）。node tools/sim-ch9.mjs 20 mu
//   ★装備 … ＋ ヒックリカエール2号の 品（ゴーグル）・ふたごの道の 宝箱（こだまのぼうし・ふたご星のたて・谷かぜの道着・ねむり星のよろい）
CH9_IDS.mu = C9D_BATTLE.mu;
export const CH9D_LV = { mu: 104 };
Object.assign(LV9, CH9D_LV);
CH9_KIT.mu = {
  hero: ['c8s_star_sword', 'c9dt_sleep_mail', 'c9dt_twin_shield', 'c9ct_upside_helm', 'c9cb_trio_goggles'],
  daikenja: ['c9b_owl_staff', 'c9ct_star_robe', null, 'c9dt_echo_hat', 'c9cb_trio_goggles'],
  god_hand: ['c9at_star_claw', 'c9dt_valley_gi', null, 'c7it_bear_hat', 'c9cb_trio_goggles'],
  high_priest: ['c9b_owl_staff', 'c9ct_star_robe', 'c9dt_twin_shield', 'c7l_kingdom_crown', 'c9cb_trio_goggles'],
};
// 1回の 戦いの ムウの ようす（ch9Run の かえす 値に まぜる）
function muStats9(b) {
  const s = muState(b);
  if (!s) return {};
  return { mSplit: s.split ? 1 : 0, mWakes: s.wakes, mKos: s.kos, mAngers: s.angers, mBeams: s.beams, mBlocked: s.blocked, mOkashi: s.okashi, mDoons: s.doons, mDoonG: s.doonGuards, mSongs: b.c9sp?.song?.uses || 0 };
}
// 知って いる 人の 合体技の ねらい: 2体の うち HPの 多い 方（同じくらいに けずる）
function muTarget9(b) {
  const s = muState(b);
  if (!s) return null;
  const up = b.aliveEnemies().filter((e) => e.c9m);
  return up.sort((x, y) => y.hp / y.maxHp - x.hp / x.maxHp)[0]?.species || null;
}
function muText9(res) {
  if (!res.some((r) => r.mSplit !== undefined)) return '';
  const avg = (k) => res.reduce((s, r) => s + (r[k] || 0), 0) / res.length;
  return `  分かれ${avg('mSplit').toFixed(2)} ばたん${avg('mKos').toFixed(1)} 起こす${avg('mWakes').toFixed(1)} おこる${avg('mAngers').toFixed(1)} ビーム${avg('mBeams').toFixed(1)}(守${avg('mBlocked').toFixed(1)}/おかし${avg('mOkashi').toFixed(1)}) ドーン${avg('mDoons').toFixed(1)}(守${avg('mDoonG').toFixed(1)}) うた${avg('mSongs').toFixed(1)}`;
}

const SLOTS = ['weapon', 'armor', 'shield', 'head', 'acc'];
// 第92回 第2便: その 幕で 買える くぼ地の 武具屋の 品（第2幕から）。★装備の ない 所・酒場の 仲間の 装備に えらんで よい
//   （前の 章の 計算の SHOP_GEAR には まぜない … tools/sim-jobs.mjs の jobChar の extra）
export const CRATER_SHOP9 = { king: [...C9B_SHOP_WEAPONS, ...C9B_SHOP_ARMOR], riddle: [...C9B_SHOP_WEAPONS, ...C9B_SHOP_ARMOR], trio2: [...C9B_SHOP_WEAPONS, ...C9B_SHOP_ARMOR] };
const shop9 = (boss) => CRATER_SHOP9[boss] || [];

export function ch9Party(boss, lv, kit = true) {
  return CH6_JOBS.map(([job, name]) => {
    const c = jobChar(job, lv, 10, name, shop9(boss));
    const k = kit ? CH9_KIT[boss]?.[job] || [] : [];
    SLOTS.forEach((sl, i) => {
      if (!k[i]) return;
      if (!ITEMS[k[i]]) throw new Error(k[i]);
      if (!canEquip(job, k[i])) throw new Error(`${job}: ${k[i]}`);
      c.equip[sl] = k[i];
    });
    fullHeal(c);
    return c;
  });
}
// ───── 人数の やり方（PARTIES9）─────
//   人 … 知って いる（または 知らない）人が 動かす キャラ。CH9_KIT の ★装備
//   npc … 酒場の 人の 仲間（NPC_SUPPORTS の ポポロ・リン・ミーナ。この ころには 転職して 大賢者・ゴッドハンド・大神官。
//         ★装備は 人が 持つので 店の いちばん よい 品。作戦は その 人の）。自動。人の 職業と かさなる 人は 出ない
//   mon … 魔物の 仲間（この ころの Sランク: キラーからくり・ヴァルドラゴン・せかいじゅの子〈回復〉。＋15・店の いちばん よい 品）。自動
//   人が 動かす キャラの じゅん: 勇者・大神官・大賢者・ゴッドハンド・（5人目）ガーディアン（店の 品）
const HUMAN_ORDER = ['hero', 'high_priest', 'daikenja', 'god_hand'];
const NPC9 = [['npc_poporo', 'daikenja'], ['npc_rin', 'god_hand'], ['npc_mina', 'high_priest']];
const MON9 = [['killer_karakuri', 'aggressive'], ['yggdra_child', 'heal'], ['great_dragon', 'balanced']];
export const PARTIES9 = {
  p4: { label: '人4人　　　　', humans: 4, npc: 0, mon: 0 },
  k1npc: { label: '1人＋酒場3人', humans: 1, npc: 3, mon: 0 },
  k1mon: { label: '1人＋魔物3', humans: 1, npc: 0, mon: 3 },
  k2npc: { label: '2人＋酒場2人', humans: 2, npc: 2, mon: 0 },
  solo: { label: 'ひとりだけ　', humans: 1, npc: 0, mon: 0 },
  p5: { label: '人5人　　　　', humans: 5, npc: 0, mon: 0 },
};
// 第92回: ゲームの 酒場と おなじ 作りの 仲間（world/party.js の makeNpcSupportChar。ものがたりで 入る ときと おなじ 勇者の 1つ下の レベル・
//   はじめの 職業〈魔法使い・武闘家・僧侶〉・その レベルの 店の 装備）。ブラウザで 人が 遊んだ ときと おなじ 顔ぶれ（11-4 の さいご）
//   PARTY=all には 入れない（PARTY=k1tav で えらぶ）
export const EXTRA_PARTIES9 = {
  k1tav: { label: '1人＋酒場3人(本物)', humans: 1, npc: 3, mon: 0, tavern: true },
  k1fam: { label: '1人＋家族の仲間3', humans: 1, npc: 3, mon: 0, fam: true },
  // 第100回 V1班: 家族 2人・3人だけ（仲間を 入れない）
  p2: { label: '人2人だけ　　', humans: 2, npc: 0, mon: 0 },
  p3: { label: '人3人だけ　　', humans: 3, npc: 0, mon: 0 },
};
const partyOf9 = (k) => PARTIES9[k] || EXTRA_PARTIES9[k];
function npcChar(id, job, lv, boss = null) {
  const d = NPC_SUPPORTS.find((n) => n.id === id);
  const c = jobChar(job, lv, 10, d.name, shop9(boss));
  c.tactics = d.tactics;
  return c;
}
// 1回 ぶんの 味方（{ char, know }。know … その キャラを 人が 動かすか）
export function ch9Allies(boss, lv, partyKey = 'p4', kit = true) {
  const P = partyOf9(partyKey);
  if (!P) throw new Error(`party: ${partyKey}`);
  const four = ch9Party(boss, lv, kit);
  // ならびは 人4人の ときと おなじ（先頭ほど ねらわれやすい）
  // 第103回 B班: SOLOJOB=god_hand など … ひとりだけ・1人＋仲間の 人の 職業を かえて はかる（ない ときは 勇者）
  const pick = process.env.SOLOJOB && P.humans === 1 ? [process.env.SOLOJOB] : HUMAN_ORDER.slice(0, Math.min(4, P.humans));
  const humans = four.filter((c) => pick.includes(c.job));
  if (P.humans >= 5) humans.push(jobChar('guardian', lv, 10, 'ガーディアン'));
  const out = humans.map((c) => ({ char: c, know: true }));
  // 第94回: 家族の 仲間（家族の キャラを 仲間に 入れた もの。超級職 ＋ ★装備。戦いでは 自動の 仲間 kind 'support'）
  if (P.fam) for (const c of four.filter((x) => !pick.includes(x.job)).slice(0, P.npc)) out.push({ char: c, know: false });
  else if (P.tavern) for (const [id] of NPC9.slice(0, P.npc)) out.push({ char: makeNpcSupportChar(NPC_SUPPORTS.find((n) => n.id === id), lv - 1), know: false });
  else for (const [id, job] of NPC9.filter(([, j]) => !pick.includes(j)).slice(0, P.npc)) out.push({ char: npcChar(id, job, lv, boss), know: false });
  for (const [sp, tac] of MON9.slice(0, P.mon)) {
    const c = monsterChar(sp, lv, 15, 10);
    c.tactics = tac;
    out.push({ char: c, know: false, monster: true });
  }
  return out;
}
// ためし用: PATCH='{"c9a_suitoru":{"c9a":{"few":{"wait":[0,0,0,0,0]}}}}' … 魔物の 数を かえて はかる（配列は おきかえ）
function deepMerge(t, p) {
  for (const [k, v] of Object.entries(p)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && t[k] && typeof t[k] === 'object') deepMerge(t[k], v);
    else t[k] = v;
  }
}
if (process.env.PATCH) deepMerge(MONSTERS, JSON.parse(process.env.PATCH));
if (process.env.PATCHF) {
  const { readFileSync } = await import('node:fs');
  deepMerge(MONSTERS, JSON.parse(readFileSync(process.env.PATCHF, 'utf8')));
}
const group = (boss) => FIXED_ENCOUNTERS[CH9_IDS[boss]].group.flatMap(([sp, n]) => Array(n).fill(sp));

// ───── 3つの やり方 ─────
// act(b, a, boss) … その 人の 番に する こと。true を かえすと 自分で enqueue した（false … ふつうの オート〈'ai'〉に まかせる）
//   b.knowsCh9 … 'know' 知っている 人・'blind' 知らない 人（shared/battle-c9a.js の c9aPlan が 見る）。完全オートは なし
export const MODES9 = {
  // 完全オート: ふつうの オート（Battle の auto）。act は よばれない
  auto: { label: '完全オート　', know: false, act: null },
  // 知らない 人: しくみを 知らない（たまに 気づく … shared/battle-c9a.js の c9aPlan）。合体技は いつでも する
  blind: {
    label: '知らない　　', know: true,
    act: (b, a, boss) => dualPlan(b, a, bossSpecies(b, boss), 'trick'),
  },
  // 知っている 人: しくみを 知って 戦う（中ボス … 前ぶれで 1人が「防御」・すいこみ口が 向く 前後は すいこみ口を こわす・ふだんは 本体／
  //   ボス … ともしびが 消えた 仲間に「明かりをわける」・やみの いぶきで ねらわれた 人は 身を 守る。shared/battle-c9a.js の c9aPlan）
  //   合体技は しくみの 用が ない 時だけ（前ぶれの 間・消えた 仲間が いる 間は しない）
  know: {
    label: '知っている　', know: true,
    act: (b, a, boss) => (need9(b, a) ? false : dualPlan(b, a, muTarget9(b) || bossSpecies(b, boss), null)),
  },
};
function bossSpecies(b, boss) {
  void boss;
  const e = b.aliveEnemies().find((x) => x.boss) || b.aliveEnemies()[0];
  return e?.species;
}
// しくみの 用が ある 間（知っている 人は 合体技を しない）
function busy9(b) {
  const m = mechaOf(b);
  if (m?.c9t && (m.c9t.aim || (!m.c9t.broken && m.c9t.aimLeft <= 1))) return true;
  const h = hoshimoriOf(b);
  if (h?.c9h && (h.c9h.aim.length || b.aliveAllies().some((x) => !x.c9torch))) return true;
  return c9bBusy(b);
}

// 第92回 第3便: この 人の 番に しくみの 用が あるか（知っている 人は、自分の 用が ない ときは 前ぶれの 間でも 合体技を する）
//   前ぶれ 1つに つき、しくみの 役は 先に 番が 来た 人が 受けもつ（b.simClaim。こわす 的は NEEDHITS 人）。のこりの 人は ふだん どおり
//   自分が ねらわれて いる（いぶき・ポチッとね・大ジャンプ）ときは 自分で 身を 守る
const needHits = () => envNum('NEEDHITS', 1);
function claim(b, key, n = 1) {
  const m = (b.simClaim = b.simClaim || new Map());
  const k = m.get(key) || 0;
  if (k >= n) return false;
  m.set(key, k + 1);
  return true;
}
function need9(b, a) {
  const m = mechaOf(b);
  if (m?.alive && m.c9t) {
    const t = m.c9t;
    const nz = nozzleOf(b);
    if (t.aim && !guardOf(b) && claim(b, `guard${t.sucks}`)) return true;
    if (nz?.alive && (t.aim || t.aimLeft <= 1) && claim(b, `nozzle${t.sucks}.${t.breaks}`, needHits())) return true;
  }
  const h = hoshimoriOf(b);
  if (h?.alive && h.c9h && !h.c9h.won) {
    if (h.c9h.aim.includes(a.id) && !a.defending) return true;
    const un = unlitAllies(b);
    if (a.c9torch && un.length && claim(b, `share${h.c9h.outs}.${un.map((x) => x.id).join()}`, un.length)) return true;
  }
  const kg = kingOf(b);
  const k = kg?.alive ? kg.c9k : null;
  if (k && !k.down) {
    if (k.jumpReady && !a.defending) return true;
    if (k.watch && kingVisible(b) && b.get(k.watch)?.alive && claim(b, `dish${k.watch}.${k.eats}.${k.breaks}`, needHits())) return true;
    if (k.dark && !litNow(b) && teruReady(b) && claim(b, `teru${teruOfUses(b)}`)) return true;
  }
  const n = nazoOf(b);
  if (n?.alive && n.c9z?.riddle && claim(b, `riddle${n.c9z.asks}.${n.c9z.wrongs}.${n.c9z.timeouts}`)) return true;
  const mc = mechaOf9c(b);
  const s = mc?.alive ? mc.c9s : null;
  if (s) {
    if (s.grains <= sandConf(mc, b).dizzyAt && !(s.dizzy > 0) && claim(b, `flip${s.flips}.${s.booms}`)) return true;
    if (s.pochiAim === a.id && !a.defending) return true;
  }
  // 第93回 B班: 魔人ムウ … おかしビームの ねらいは 自分で 身を 守る・ドーンの 前は みんな 身を 守る・おかしの 仲間には 1人が 星のうた
  if (b.c9mu && !b.c9mu.won) {
    const mus = b.enemies.filter((e) => e.c9m && e.alive);
    const soon = (w) => !(w > 0) || b.allies.length > 1;
    if (mus.some((x) => x.c9m.beamAim === a.id && soon(x.c9m.beamWait)) && !a.defending) return true;
    if (mus.some((x) => x.c9m.doon && soon(x.c9m.doonWait)) && !a.defending) return true;
    const ok = b.aliveAllies().filter((x) => okashiOf(x));
    if (ok.length && songReady(b) && claim(b, `song${b.c9mu.okashi}.${b.c9sp?.song?.uses || 0}`)) return true;
  }
  // 第94回 B班: 第3部 第2章（tools/sim-ch10.mjs が 足す）
  for (const f of NEED9_HOOKS) if (f(b, a, claim)) return true;
  return false;
}
// あとの 章の しくみの 用（(b, a, claim) → true … この 人は しくみの 役。合体技を しない）
export const NEED9_HOOKS = [];
// あとの 章の 1回の 戦いの ようす（(b) → { … }。ch9Run の かえす 値に まぜる）
export const STATS9_HOOKS = [];
const teruOfUses = (b) => b.c9sp?.teru?.uses || 0;
void busy9;

// 星の子（戦いの わくを 使わない 味方。shared/battle-c9a.js）: 戦いを 作った すぐ あとに よぶ（3人組・ためしは 戦いが 自分で 入れる）
export function addSpica9(b, boss) {
  void boss;
  return addSpica(b);
}

// 第100回 V1班: 人が 画面で えらぶ コマンド（知って いる 人の オートの えらび方 … decideAlly。a.knows9 が あるので しくみの 動きも 入る）
//   'ai' や えらべない 時は null（そのときは 前と 同じく 動く 時に オートで 決める）
function pickNow(b, a) {
  const cmd = decideAlly(b, a);
  if (!cmd || cmd.type === 'ai') return null;
  return b.validate(a, cmd).ok ? cmd : null;
}
// 1回 戦う。mode … 'auto' | 'blind' | 'know'
//   第100回 V1班: 人 1人ずつ べつの 手・さそいに REACT で 答える・えらんだ 時に コマンドを 決める（本物の 流れと 合わせた。docs/plan-sim-vs-real.md）
// party … PARTIES9 の キー（人数の やり方。ない ときは 人4人）
// 第92回 第2便: 第3部の ボスの 物さしは「人が 画面で できる 動き」… 人が 動かす キャラは 番が 来てから 2びょうで えらぶ・ブラウザの はじめの 速さ
//   （前の 数字と くらべる ときは REACT=0 BSPEED=1 TSPEED=1）
export const REACT9 = 2000;
export const SPEED9 = [0.85, 0.8];
const envNum = (k, d) => (process.env[k] !== undefined && process.env[k] !== '' ? Number(process.env[k]) : d);
// react … 人が 動かす キャラが 番に なってから えらぶまでの ミリびょう（0 … すぐ。ブラウザの 人に 近づける とき 3000 など）
// speed・textSpeed … 戦いの 速さ（ない ときは 1。ブラウザの はじめの 設定は 0.85・0.8）
// flags … リーダーの フラグ（第94回: 先に 取った 音の スピカの ごほうび など。FLAGS=a,b でも）
// tactics … 人が 動かす キャラの 作戦（第97回: 完全オートの 作戦を えらべる ように。ない ときは バッチリがんばれ）
//   （第96回 T班: TAC=… でも。SUPTAC=… / supTac … 自動の 仲間 みんなの 作戦）
export function ch9Run(boss, lv, mode, seed, { log = false, kit = true, party = 'p4', react = envNum('REACT', REACT9), speed = envNum('BSPEED', SPEED9[0]), textSpeed = envNum('TSPEED', SPEED9[1]), flags = (process.env.FLAGS || '').split(',').filter(Boolean), tactics = process.env.TAC || 'balanced', supTac = process.env.SUPTAC || null, list: preList = null, moreHooks = null, onEnd = null, legacy = !!process.env.LEGACY, sameHand = legacy || !!process.env.SAMEHAND, pickLate = legacy || !!process.env.PICKLATE } = {}) {
  // 第100回 V1班: legacy … 前の 物さし（1つの 手で 人 みんなを 動かす・動く 時に オートで 決める）。LEGACY=1 でも。前の 数字の テストが 使う
  const M = MODES9[mode];
  if (!M) throw new Error(`mode: ${mode}`);
  // 第99回 B班: list … 前の 戦いから 引きつぐ 味方（連戦。HP・MPは char の まま）・moreHooks … 戦いの hooks に 足す・onEnd(b) … おわった 戦い
  const list = preList || ch9Allies(boss, lv, party, kit);
  // 人が 動かす キャラは 家族の キャラ（kind 'player'。完全オートの ときは その 人の「オート」）・のこりは 自動の 仲間
  // 第100回 V1班: 人が 動かす キャラは 1人ずつ べつの 人（本当の ゲームと 同じ。ほかの 人の 合体技は「さそい」に 答える・
  //   よやくで 自動では 待たない … battle-dual.js の needsAsk）。前の 数字（1つの 手で 4人 ぶんを 動かす）は SAMEHAND=1
  let hi = 0;
  const handOf = () => (sameHand || hi === 0 ? (hi++, 'sim') : `sim${hi++}`);
  const allies = list.map((x) => (x.know
    ? { char: x.char, kind: 'player', controller: handOf(), auto: !M.know, tactics }
    : { char: x.char, kind: x.monster ? 'monster' : 'support', auto: true, tactics: supTac || x.char.tactics || 'balanced' }));
  const hooks = flags.length || moreHooks ? { ...(flags.length ? { leaderFlag: (f) => flags.includes(f) } : {}), ...(moreHooks || {}) } : undefined;
  const b = new Battle({ rng: makeRng(seed), boss: true, canFlee: false, allies, enemies: group(boss), speed, textSpeed, hooks });
  addSpica9(b, boss);
  // 人が 動かす キャラだけ しくみを 知って いる（自動の 仲間は ふつうの オート）
  if (M.know) b.allies.forEach((a, i) => { if (list[i]?.know) a.knows9 = mode; });
  for (const e of b.enemies) {
    const k = (v) => Number(process.env[v] || 1);
    e.maxHp = e.hp = Math.round(e.maxHp * k('HPK'));
    e.atk = Math.round(e.atk * k('ATKK'));
    e.mag = Math.round(e.mag * k('MAGK'));
    if (e.boss) e.speed = (e.speed || 1) * k('SPD');
  }
  let real = 0;
  const n = { duals: 0, aims: 0, guards: 0, lost: 0, breaks: 0, breaths: 0, outs: 0, kept: 0, shares: 0, glows: 0, eats: 0, stops: 0, jumps: 0, teru: 0, asks: 0, rights: 0, wrongs: 0, timeouts: 0, booms: 0, flips: 0, dizzies: 0, early: 0, pochis: 0 };
  // なぞが 出てから 時間切れまでの 本当の 時間（ミリびょう。小さい 子が 読んで 答える 間）
  const riddleAt = [];
  let riddleT0 = null;
  const readyAt = new Map();
  const inviteAt = new Map();
  while (!b.over && real < 30 * 60 * 1000) {
    const evs = b.tick(50);
    real += 50;
    for (const e of evs) {
      if (log && (e.t === 'act' || e.t === 'msg')) console.log('  ' + [...(e.lines || []), ...(e.postLines || [])].join(' / '));
      if (e.t !== 'act') continue;
      if (e.dual) n.duals++;
      if (e.c9tAim) n.aims++;
      if (e.c9tSuck?.guard) n.guards++;
      if (e.c9tSuck && !e.c9tSuck.guard) n.lost++;
      if (e.c9tBreak) n.breaks++;
      if (e.c9hBreath) {
        n.breaths++;
        n.outs += e.c9hBreath.out.length;
        n.kept += e.c9hBreath.kept.length;
      }
      if (e.c9hShare) n.shares++;
      if (e.c9Spica?.glow) n.glows++;
      if (e.c9kEat) n.eats++;
      if (e.c9kBreak?.stop) n.stops++;
      if (e.c9kJump) n.jumps++;
      if (e.c9bTeru) n.teru++;
      if (e.c9zRiddle) { n.asks++; riddleT0 = real; }
      if (e.c9zAnswer) { if (e.c9zAnswer.ok) { n.rights++; riddleT0 = null; } else n.wrongs++; }
      if (e.c9zTimeout) { n.timeouts++; if (riddleT0 != null) riddleAt.push(real - riddleT0); }
      if (e.c9sBoom) n.booms++;
      if (e.c9sFlip) { n.flips++; if (e.c9sFlip.dizzy) n.dizzies++; else n.early++; }
      if (e.c9sPochi) n.pochis++;
    }
    if (!M.know) continue;
    // 第100回 V1班: ほかの 人から 合体技に さそわれた … 人は REACT で「はい」（さそわれて いる 間は 自分の コマンドを えらばない）
    for (const inv of [...b.invites.values()]) {
      for (const pid of [...inv.pending]) {
        const p = b.get(pid);
        if (!p?.knows9 || !p.alive) continue;
        const k = `${inv.id}:${pid}`;
        if (!inviteAt.has(k)) inviteAt.set(k, real);
        if (real - inviteAt.get(k) < react) continue;
        b.command(pid, { type: 'dualAnswer', invite: inv.id, ok: true }, p.controller);
      }
    }
    for (const a of b.allies) {
      if (!a.ready || !a.alive || a.kind === 'guest' || !a.knows9) { readyAt.delete(a.id); continue; }
      if (a.invited || a.inviting) continue;
      // 人が えらぶ 時間（REACT）
      if (react > 0) {
        if (!readyAt.has(a.id)) readyAt.set(a.id, real);
        if (real - readyAt.get(a.id) < react) continue;
        readyAt.delete(a.id);
      }
      if (!M.act || !M.act(b, a, boss)) {
        // 第100回 V1班: 人は えらんだ 時に コマンドを 決める（画面と 同じ。前は 動く 時に オートで 決めて いた … PICKLATE=1）
        const cmd = pickLate ? null : pickNow(b, a);
        if (cmd) b.command(a.id, cmd, a.controller);
        if (a.ready) {
          a.ready = false;
          b.enqueue(a, { type: 'ai' });
        }
      }
    }
  }
  onEnd?.(b);
  const al = b.allies;
  const foes = b.enemies.filter((e) => e.boss).length ? b.enemies.filter((e) => e.boss) : b.enemies;
  const h = hoshimoriOf(b);
  const kg = kingOf(b);
  return {
    kDark: kg?.c9k?.dark ? 1 : 0, timeoutMs: riddleAt.length ? Math.min(...riddleAt) : null, nazoLeft: nazoOf(b)?.alive ? 1 : 0, mechaLeft: mechaOf9c(b)?.alive ? 1 : 0,
    light: b.c9sp?.light ?? 0, dawn: h?.c9h?.dawn ?? 0, dark: h?.c9h?.dark ? 1 : 0, bigs: h?.c9h?.bigs ?? 0,
    ...muStats9(b),
    ...Object.assign({}, ...STATS9_HOOKS.map((f) => f(b))),
    outcome: b.result?.outcome || 'timeout', seconds: Math.round(real / 1000),
    hpLeft: al.reduce((s, x) => s + x.hp, 0) / al.reduce((s, x) => s + x.maxHp, 0), deaths: al.filter((x) => !x.alive).length,
    bossLeft: foes.reduce((s, e) => s + Math.max(0, e.hp), 0) / Math.max(1, foes.reduce((s, e) => s + e.maxHp, 0)), ...n,
  };
}

const pct = (w, n) => `${String(Math.round((w / n) * 100)).padStart(3)}%`;
export function summary9(res) {
  const w = res.filter((r) => r.outcome === 'win').length;
  const avg = (k) => res.reduce((s, r) => s + (r[k] || 0), 0) / res.length;
  const wins = res.filter((r) => r.outcome === 'win');
  const wsec = wins.length ? wins.reduce((s, r) => s + r.seconds, 0) / wins.length : 0;
  return {
    rate: w / res.length, sec: wsec,
    text: `勝率 ${pct(w, res.length)}  平均${avg('seconds').toFixed(0).padStart(4)}秒（勝ち${wsec.toFixed(0).padStart(4)}秒）  HP残${(avg('hpLeft') * 100).toFixed(0).padStart(3)}%  ボスの残${(avg('bossLeft') * 100).toFixed(0).padStart(3)}%  死者${avg('deaths').toFixed(2)}  合体技${avg('duals').toFixed(1)}`
      + `  光${avg('light').toFixed(1)} 守${avg('guards').toFixed(1)} こわす${avg('breaks').toFixed(1)}  夜明け${avg('dawn').toFixed(1)} いぶき${avg('breaths').toFixed(1)}(消${avg('outs').toFixed(1)}/守${avg('kept').toFixed(1)}) わける${avg('shares').toFixed(1)} 大${avg('bigs').toFixed(1)} まっくら${avg('dark').toFixed(2)}`
      + `  食べ${avg('eats').toFixed(1)} 止め${avg('stops').toFixed(1)} ジャンプ${avg('jumps').toFixed(1)} てらす${avg('teru').toFixed(1)} まっ暗${avg('kDark').toFixed(2)}`
      + `  なぞ${avg('asks').toFixed(1)}(正${avg('rights').toFixed(1)}/ちがう${avg('wrongs').toFixed(1)}/時間切れ${avg('timeouts').toFixed(1)})  ばくはつ${avg('booms').toFixed(1)} ひっくり${avg('flips').toFixed(1)}(目回し${avg('dizzies').toFixed(1)}/早い${avg('early').toFixed(1)}) ポチッ${avg('pochis').toFixed(1)}`
      + muText9(res),
  };
}

if (process.argv[1]?.endsWith('sim-ch9.mjs')) {
  const N = Number(process.argv[2] || 40);
  const which = !process.argv[3] || process.argv[3] === 'all' ? ['trio', 'trial', 'king', 'riddle', 'trio2'] : process.argv[3].split(',');
  const seedOf = (i) => 9090 + i * 7919;
  if (process.env.LOG) {
    const boss = process.env.BOSS || 'trio';
    console.log(ch9Run(boss, Number(process.env.LV || LV9[boss]), process.env.MODE || 'know', Number(process.env.SEED || 1), { log: true, party: process.env.PARTY || 'p4' }));
  } else {
    for (const boss of which) {
      const base = LV9[boss];
      // 弱め（−5）・ふつう・強め（＋8）の 家族
      const lvs = process.argv[4] ? process.argv[4].split(',').map(Number) : [base - 5, base, base + 8];
      const mon = MONSTERS[FIXED_ENCOUNTERS[CH9_IDS[boss]].group[0][0]];
      console.log(`■ ${boss}（${CH9_IDS[boss]}・${mon?.name || '?'}。超級職 4人・職業Lv10・${N}回）`);
      for (const c of ch9Party(boss, base)) {
        const s = computeStats(c);
        console.log(`  ${c.name.padEnd(8, '　')} HP${s.maxHp} MP${s.maxMp} 攻${s.atk} 守${s.dfn} 魔${s.mag} 速${s.agi}  ${SLOTS.map((k) => ITEMS[c.equip[k]]?.name || '-').join('・')}`);
      }
      // PARTY=k1npc,solo … 人数の やり方（ない ときは 人4人で 3つの やり方。PARTY=all … 全部の 人数を おすすめの レベルで）
      const parties = !process.env.PARTY ? ['p4'] : process.env.PARTY === 'all' ? Object.keys(PARTIES9) : process.env.PARTY.split(',');
      for (const party of parties) {
        const plvs = party === 'p4' || process.argv[4] ? lvs : [base];
        for (const lv of plvs) {
          for (const mode of Object.keys(MODES9)) {
            if (party !== 'p4' && mode === 'blind') continue;
            const res = [...Array(N).keys()].map((i) => ch9Run(boss, lv, mode, seedOf(i), { party }));
            console.log(`  ${partyOf9(party).label} Lv${lv} ${MODES9[mode].label} ${summary9(res).text}`);
          }
        }
      }
    }
  }
}
