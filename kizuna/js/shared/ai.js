// たたかいの AI（モンスター と サポートなかま）
import { ABILITIES, isAttackSpell, isSwordSkill } from './data/abilities.js?v=068632fa6d51';
// 推理（deduce）の 属性・運しだいの 技を オートで 使う（第26回）
import { deduceElement } from './data/abilities-jobs6.js?v=068632fa6d51';
import { mpCost, penaltyFor, weaponOk, comboAllowed } from './stats.js?v=068632fa6d51';
import { skillMods } from './skill-tier.js?v=068632fa6d51';
// 第87回 A班: 回復の 魔力の 伸び（battle.js の heal と おなじ。pow-scale.js）
import { powScaleFor } from './pow-scale.js?v=068632fa6d51';
// 第4章の まぼろしの分身と 月の鏡（battle-ch4.js）
import { mirageAction, mirrorPlan } from './battle-ch4.js?v=068632fa6d51';
// 第4章 Step 6 の 砂に もぐる 魔物（battle-ch4.js）
import { burrowSurface, burrowPlan } from './battle-ch4.js?v=068632fa6d51';
// 第4章 Step 7 の 砂の底の神殿と モルガナ（battle-temple.js）
import { templeAction, templeCond, templePlan, templeAdjust, veilBolt, waveIgnored } from './battle-temple.js?v=068632fa6d51';
import { labPlan, labIgnored } from './battle-lab.js?v=068632fa6d51';
// 第5章 Step 2 の 星の番人アルゴス（見通しの目。battle-ch5.js）
import { towerCond, towerPlan } from './battle-ch5.js?v=068632fa6d51';
// 第5章 Step 5 の ノクトの影（職業の まね。battle-nocto.js）
import { noctoAction } from './battle-nocto.js?v=068632fa6d51';
// 第5章 Step 6・7 の ノクト（1回目。合体技の 前ぶれ）と「手をのばす」（battle-earth.js）
import { earthAction, reachPlan } from './battle-earth.js?v=068632fa6d51';
// 第5章 Step 9 の 魔王ソリトゥス（きずなを食べる・終わらない夜の 前ぶれ。battle-final.js）
import { finalAction } from './battle-final.js?v=068632fa6d51';
// 第37回 A: 闘技場の 王者の しかけを 知っている 人（シミュレーター。battle-arena.js）
import { arenaPlan, arenaAdjust } from './battle-arena.js?v=068632fa6d51';
// 第2部 第6章 Step 5: カリヨンの 時のかねが 近い ときは 強くする 技を 使わない（鳴ると 消える。battle-tokei.js）
import { tokeiQuiet } from './battle-tokei.js?v=068632fa6d51';
// 第82回 A: 犬夜叉の 系統の オート（おすわり！・ばくりゅうはの かまえ・風の技。battle-r82a.js）
import { r82aPlan } from './battle-r82a.js?v=068632fa6d51';
// 第82回 B班: YAIBA の 系統の 玉がえ・かみなり雲・きょだい化（battle-r82b.js）
import { r82bPlan } from './battle-r82b.js?v=068632fa6d51';
// 第83回 B班: ぬ〜べ〜の 系統の オート（おにの手を 出す・ふういんしなおす・かんのんきょう・おふだ。battle-r83b.js）
import { r83bPlan, r83bSeal } from './battle-r83b.js?v=068632fa6d51';
// 第83回 A班: 封神演義の 系統の 作戦・先読みの策・強化ふうじ・太極図・軍師の号令・ほう神計画（battle-r83a.js）
import { r83aPlan } from './battle-r83a.js?v=068632fa6d51';
// 第84回 B班: らんま1/2 の 系統の すがた・飛竜しょう天は・かけひき・心の水・敵前だい逃亡・手数の 技（battle-r84b.js）
import { r84bPlan } from './battle-r84b.js?v=068632fa6d51';
// 第84回 A班: 幽☆遊☆白書の 系統の れい丸（ざこに 使わない・ぜんぶ うつ 技は まんたんの 時・0 なら ためる）・仲間のために（battle-r84a.js）
import { r84aPlan, r84aAdjust, reiOk } from './battle-r84a.js?v=068632fa6d51';
// 第85回 B班: 烈火の炎の 系統の 火竜をよぶ（たおれた 仲間 ＝ れっしん・前ぶれ ＝ まどか・ボス ＝ こくう／さいは・敵が 多い ＝ なだれ・強い 敵 1体 ＝ ほむら）・姫を守る忍び（battle-r85b.js）
import { r85bPlan } from './battle-r85b.js?v=068632fa6d51';
// 第85回 A班: スレイヤーズの 系統の となえる・大砲の 呪文・定食（battle-r85a.js）
import { r85aPlan, r85aLocked } from './battle-r85a.js?v=068632fa6d51';
// 第86回 B班: 幻の職業 天下一の格闘王（れい丸・しょう天は・かけひき・見切りのかまえ）・混とんの大軍師（大魔法の時間・太極・ギガ・スレイブ・みんなでとなえる。battle-r86b.js）
import { r86bPlan } from './battle-r86b.js?v=068632fa6d51';
// 第86回 A班: 幻の職業 2つの オート（この 2つの 職業の 技だけを 見る。battle-r86a.js）
import { r86aPlan } from './battle-r86a.js?v=068632fa6d51';
// 第98回: きずなの職業の オート（職業ごとの 計画の 一覧は battle-kizuna.js）
import { kizunaPlan } from './battle-kizuna.js?v=068632fa6d51';
// 第88回 M1班: 魔王の 天地魔闘の構え（敵の 大技の 前ぶれが ある 時に ときどき。battle-r88m.js）
import { r88mPlan } from './battle-r88m.js?v=068632fa6d51';
// 第96回 T班 第2便: 人が 自分で えらんで いるか（第2章 第1幕と 同じ 見分け。battle-c10a.js）
import { someoneChooses } from './battle-c10a.js?v=068632fa6d51';
// 第96回 T班 第2便: ヒントの 3だんが ある ボス（第6〜8章 など。data/boss-hints.js の キー ＝ 決まった 戦いの id）
import { BOSS_HINTS } from './data/boss-hints.js?v=068632fa6d51';
import { FIXED_ENCOUNTERS } from './data/encounters.js?v=068632fa6d51';

// さくせん
// 第96回 T班（家族の 声）: 作戦ごとに 技の えらび方（mode）を 分けた。キーと 名前は かえない（セーブに 入って いる）。
//   mode … 'aggressive' いちばん 大きな ダメージ（MPは 見ない）／'balanced' よく きく 技 ＋ バフ・デバフ・回復／
//          'heal' HP 8わり いかの 仲間が いたら 回復を 先に（ほかは balanced と 同じ）／'savemp' とって おく MP を 切らさない／
//          'legacy' 前の えらび方（mpWeight で MP を 重く 見る。じゅもんせつやく・敵の がわの うつし身）
//   healAt … HP の わりあいが これ いか の 仲間を 回復する
//   costK … ふつうの 戦いで ダメージ ÷ MP を 見る 強さ（MP は 最大MP との わりあい）
//   hardMp … ボスなど 長い 戦い（fightWeight の hard）では MP を 前と 同じ 重さ（mpWeight）で 見る。
//            （第3部の ボスは「完全オートでは 勝てない」ように 作って ある。ボスでも MP を どんどん 使うと 完全オートの 勝ちやすさが
//             大きく 上がった〈docs/plan-r96-tactics.md〉ので、長い 戦いでは MP を 切らさない 前の 重さに した）
//   buffs … バフ・ねむり などを 使う／debuffs … 敵を 弱く する 技も 使う
//   desc … 作戦を えらぶ 画面の 1行の せつめい（menu.js・battle.js）
export const TACTICS = {
  balanced: { name: 'バッチリがんばれ', desc: 'よく効く技を使いながら、強くする技・弱くする技・回復もする', mode: 'balanced', healAt: 0.5, mpWeight: 0.04, costK: 3, hardMp: true, buffs: true, debuffs: true },
  aggressive: { name: 'ガンガンいこうぜ', desc: '回復しない。いちばん大きなダメージの攻撃だけ（弱点もねらう）。MPは気にしない', mode: 'aggressive', healAt: 0, mpWeight: 0, buffs: false },
  heal: { name: 'いのちだいじに', desc: 'HPが8わり以下の仲間がいたら回復を先にする。ほかはバッチリがんばれと同じ', mode: 'heal', healAt: 0.8, mpWeight: 0.04, costK: 3, hardMp: true, buffs: true, debuffs: true, healFirst: true },
  // 第96回 T班: 新しい 作戦（MP を 切らさない）
  savemp: { name: 'MPせつやく', desc: '回復の分のMPをのこして、少ないMPでよく効く技を使う。長い戦いでもMPを切らさない', mode: 'savemp', healAt: 0.5, mpWeight: 0.04, buffs: true, debuffs: true },
  nomp: { name: 'じゅもんせつやく', desc: 'MPをほとんど使わない', mode: 'legacy', healAt: 0.4, mpWeight: 0.5, buffs: false },
  // なかま だけ: じぶんで コマンドを えらぶ（オートの ときは バッチリがんばれ）
  manual: { name: 'めいれいさせろ', desc: '自分でコマンドを選ぶ（仲間だけ）', mode: 'balanced', healAt: 0.5, mpWeight: 0.04, costK: 3, hardMp: true, buffs: true, debuffs: true, manual: true },
};
// 第96回 T班: 前の 作戦（敵の がわで 仲間の AI を 使う うつし身〈鏡のうつし身・ノクトの影・ライバル・職業の 試練〉は 前の まま。ボスの 強さを かえない）
export const LEGACY_TACTICS = {
  balanced: { mode: 'legacy', healAt: 0.5, mpWeight: 0.04, buffs: true },
  aggressive: { mode: 'legacy', healAt: 0.33, mpWeight: 0.015, buffs: false },
  heal: { mode: 'legacy', healAt: 0.68, mpWeight: 0.05, buffs: true },
  nomp: { mode: 'legacy', healAt: 0.4, mpWeight: 0.5, buffs: false },
};
// 第96回 T班: MPせつやく の きまり
//   reserveRate … とって おく MP は 最大MP の この わりあい か、いちばん だいじな 回復・生き返らせる 技の 分の 大きい 方（reserveCap まで）
//   pace … ボスなど 長い 戦いでは、のこす MP を 敵の のこりの HP に 合わせて ふやす（はじめは 使える 分の この わりあいを のこす）
//   costK … ダメージ ÷ MP を 見る 強さ（ほかの 作戦は TACTICS の costK）
export const SAVEMP = { reserveRate: 0.25, reserveCap: 0.5, pace: 0.7, costK: 8, easyCostK: 14 };
// 作戦を えらぶ 一覧の 1行（名前 ＋ 小さな せつめい。menu.js・battle.js の ListMenu の html）
const escHtml = (t) => String(t ?? '').replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
export function tacticsItemHtml(x) {
  return `${escHtml(x.name)}<span class="tac-desc" style="display:block;font-size:0.72em;line-height:1.35;opacity:0.82;white-space:normal">${escHtml(x.desc)}</span>`;
}
// 知らない キー（古い セーブ・新しい サーバーで 足した キー）は バッチリがんばれ
export const isTactic = (k) => typeof k === 'string' && Object.hasOwn(TACTICS, k);
export function tacticsOf(c, b = null) {
  if (c?.mirrorOf || c?.mimic) return (typeof c.tactics === 'string' && Object.hasOwn(LEGACY_TACTICS, c.tactics)) ? LEGACY_TACTICS[c.tactics] : LEGACY_TACTICS.balanced;
  // 第96回 T班 第2便: しくみの ある ボスで みんな オート（人が 1人も 自分で えらんで いない）の 時は、どの 作戦でも 前の バッチリがんばれ
  if (b && c?.side === 'ally' && mechBoss(b) && !someoneChooses(b)) return LEGACY_TACTICS.balanced;
  return isTactic(c?.tactics) ? TACTICS[c.tactics] : TACTICS.balanced;
}
// 第96回 T班 第2便: しくみの ある ボスの 戦いか（「しくみを 知らないと 勝てない」ように 強さを 合わせた ボス）
//   第3部の ボスの 状態（battle-c9a.js の c9aAfter が 見る しるしと 同じ）・前ぶれの しるしを 全員に 出す ボス（b.tellAll）・
//   これから 作る ボスは b.mechBoss = true を 立てるか、MECH_BOSS_KEYS に その ボスの 状態の キーを 足す
//   ヒントの 3だんが ある ボス（BOSS_HINTS。第6〜8章の ボスは その 戦いの はじめの 魔物の しゅるいで 見る）も 入れる
//   （第7・8章の ボスは MPせつやく・ガンガンの 完全オートで 勝てる ように なって いた。docs/plan-r96-tactics.md）
export const MECH_BOSS_KEYS = ['c9trio', 'c9trial', 'c9king', 'c9nazo', 'c9sand', 'c9mu', 'c10', 'c10b', 'c10c'];
let hintBossSp = null;
const hintBossSpecies = () => {
  if (!hintBossSp) {
    hintBossSp = new Set();
    for (const id of Object.keys(BOSS_HINTS)) {
      hintBossSp.add(id);
      const sp = FIXED_ENCOUNTERS[id]?.group?.[0]?.[0];
      if (sp) hintBossSp.add(sp);
    }
  }
  return hintBossSp;
};
export function mechBoss(b) {
  if (!b?.boss) return false;
  if (b.mechBoss || b.tellAll || MECH_BOSS_KEYS.some((k) => !!b[k])) return true;
  const sp = hintBossSpecies();
  return b.enemies.some((e) => e.boss !== false && sp.has(e.species));
}

// ───────────── モンスター ─────────────
export function decideMonster(b, m) {
  // 砂に もぐっていた: 出てくる（つぎは とび出す 技。battle-ch4.js）
  burrowSurface(b, m);
  // まぼろしの 分身の 本物: まぶしくて 動けない・まぼろしを 作りなおす（battle-ch4.js）
  const forced = mirageAction(b, m);
  if (forced) return forced;
  // 第88回 G3班: まぼろしの回廊の ライバル（大技の 前ぶれと 大技。shared/battle-rival-r88.js が つける）
  const rh = m.decideHook?.(b, m);
  if (rh) return rh;
  // 鏡のうつし身（仲間の オートの AI）・水の衣を また まとう・大波（battle-temple.js）
  const tf = templeAction(b, m);
  if (tf) return tf;
  // ノクトの影: まねる 人を かえる・まねた 人の 技（battle-nocto.js）
  const nf = noctoAction(b, m);
  if (nf) return nf;
  // ノクト（1回目）: 影が そろうと 合体技の 前ぶれ（battle-earth.js）
  const ef = earthAction(b, m);
  if (ef) return ef;
  // 魔王ソリトゥス: 第2段階から きずなを食べる・第3段階で 終わらない夜の 前ぶれ（battle-final.js）
  const ff = finalAction(b, m);
  if (ff) return ff;
  const foes = b.aliveAllies();
  if (m.telegraph) {
    const id = m.telegraph;
    m.telegraph = null;
    m.chant = null;
    // big … ためてから 出す 大技（天才しせつ管理者の 予兆保全で ダメージが へる。battle.js の foreseeCut）
    return { type: 'ability', id, target: pickFoe(b, foes)?.id, big: true };
  }
  const friends = b.aliveEnemies();
  const cands = m.actions.filter((a) => {
    if (a.limit && (m.used[a.id] || 0) >= a.limit) return false;
    if (a.id !== 'attack') {
      const ab = ABILITIES[a.id];
      if (!ab) return false;
      if (ab.kind !== 'monster' && (ab.mp || 0) > m.mp) return false;
      if ((ab.kind === 'spell') && (m.status.silence || b.noSpells)) return false;
    }
    if (!a.cond) return true;
    // cond は 1つ か ならべた もの（ぜんぶ あてはまる とき）
    return (Array.isArray(a.cond) ? a.cond : [a.cond]).every((cond) => condOk(b, m, friends, cond));
  });
  const choice = cands.length ? b.rng.weighted(cands) : { id: 'attack' };
  m.used[choice.id] = (m.used[choice.id] || 0) + 1;
  m.recent.push(choice.id);
  if (m.recent.length > 3) m.recent.shift();
  if (choice.id === 'attack') return { type: 'attack', target: pickFoe(b, foes)?.id };
  const ab = ABILITIES[choice.id];
  let target;
  if (ab.target === 'ally') {
    target = friends.slice().sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0]?.id;
  } else if (ab.target === 'enemy' || ab.target === 'group') {
    target = pickFoe(b, foes)?.id;
  }
  return { type: 'ability', id: choice.id, target };
}

// 魔物の こうどうの じょうけん
function condOk(b, m, friends, cond) {
  if (cond.startsWith('hpBelow:')) return m.hp / m.maxHp < parseFloat(cond.split(':')[1]);
  if (cond === 'allyHurt') return friends.some((f) => f.hp / f.maxHp < 0.7);
  if (cond === 'callHelp') return friends.length < 4 && (m.helpCalls || 0) < 2;
  if (cond.startsWith('notRecent:')) return !m.recent.includes(cond.split(':')[1]);
  // 't:…' … 砂の底の神殿の しかけの じょうけん（battle-temple.js）
  if (cond.startsWith('t:')) return templeCond(b, m, cond.slice(2));
  // 'c5:…' … 星の塔の しかけの じょうけん（battle-ch5.js）
  if (cond.startsWith('c5:')) return towerCond(b, m, cond.slice(3));
  // deadFriend:しゅるい … その しゅるいの なかまが たおれて いる（よみがえりの呪文）
  if (cond.startsWith('deadFriend:')) {
    const sp = cond.split(':')[1];
    return b.enemies.some((e) => e !== m && !e.alive && !e.fled && e.species === sp);
  }
  return true;
}

// 敵が ねらう 相手: ドラクエと おなじく 先頭ほど ねらわれやすい（ならびかえの 意味）
const FRONT_WEIGHT = [1.45, 1.15, 0.95, 0.8];
function pickFoe(b, foes) {
  if (!foes.length) return null;
  if (foes.length === 1 || foes[0].side !== 'ally') return b.rng.pick(foes);
  const row = foes.slice().sort((x, y) => (x.slot ?? 0) - (y.slot ?? 0));
  const ws = row.map((_, i) => FRONT_WEIGHT[Math.min(i, FRONT_WEIGHT.length - 1)]);
  let r = b.rng.next() * ws.reduce((a, x) => a + x, 0);
  for (let i = 0; i < row.length; i++) {
    r -= ws[i];
    if (r < 0) return row[i];
  }
  return row[row.length - 1];
}

// ───────────── サポートなかま・オート ─────────────
export function decideAlly(b, c) {
  const tac = tacticsOf(c, b);
  const allies = b.aliveAllies();
  const dead = b.allies.filter((x) => !x.alive && !x.fled);
  // b.knowsMirage … まぼろしの 分身を 見ぬける 人（足もとの 影を 見る。tools/sim.js の「知っている人」）
  // 砂に もぐった 敵は ねらえない（battle-ch4.js）
  const foes = b.aliveEnemies().filter((f) => !(b.knowsMirage && f.clone) && !f.burrow);
  // 砂に もぐった 敵が とび出す 前に 身を 守る（知っている 人）・空ぶり（知らない 人）。battle-ch4.js
  const bp = burrowPlan(b, c, foes);
  if (bp) return bp;
  // 大波の 前に 身を 守る（しかけを 知っている 人。battle-temple.js）
  const tp = templePlan(b, c, foes);
  if (tp) return tp;
  // 古竜の いにしえの炎の 前に 身を 守る（しかけを 知っている 人。battle-lab.js）
  const lp = labPlan(b, c);
  if (lp) return lp;
  // 闘技場の 王者の 大技の 前に 身を 守る（しかけを 知っている 人。battle-arena.js）
  const arp = arenaPlan(b, c);
  if (arp) return arp;
  // 見通しの目に 読まれた 種類を さける・星のさばきの 前に 身を 守る（battle-ch5.js）
  const fp = towerPlan(b, c, decideAlly);
  if (fp) return fp;
  if (!foes.length) return { type: 'defend' };
  // 第96回 T班: MPせつやく … とって おく MP を 切る 技（回復・生き返らせる・治す・MPを ためる いがい）は えらばない
  const paced = tac.mode === 'savemp';
  // （のこす MP は この 番の 間 かわらないので 1回だけ 出す。saveOk）
  c._r96floor = paced ? saveFloor(b, c) : null;
  const mine = paced ? usable(b, c).filter((x) => saveOk(b, c, x.id)) : usable(b, c);
  // 第96回 T班 第3便（家族の 声「ガンガンいこうぜは 回復しない。攻撃オンリー」）: ガンガンは 攻撃だけ
  //   回復・生き返らせる・治す・守る・MP を ためる・消す 技は えらばない。職業ごとの 計画（…Plan）も 攻撃の 答えだけ 通す（isAttackCmd）
  //   （しくみの ある ボスで みんな オートの 時は tacticsOf が 前の バッチリを かえす ので、ここには 来ない）
  const atkOnly = tac.mode === 'aggressive';
  const only = (cmd) => (atkOnly && cmd && !isAttackCmd(cmd) ? null : cmd);

  // 1) 水の衣を まとった 敵に 雷の 技（しかけを 知っている 人。battle-temple.js。第31回: 前の きずな技の かわり）
  const vb = veilBolt(b, c, foes, mine);
  if (vb) return vb;

  // 2) しんだ なかまを いきかえらせる（ふたり いじょうなら みんなを いきかえらせる わざ）
  if (dead.length && !atkOnly) {
    const revs = mine.filter(({ a }) => a.effect.type === 'revive');
    const all = revs.find(({ a }) => a.target === 'deadAllies');
    if (all && dead.length >= 2) return { type: 'ability', id: all.id };
    const one = revs.filter(({ a }) => a.target === 'deadAlly').sort((x, y) => (y.a.effect.hpRatio || 0) - (x.a.effect.hpRatio || 0))[0];
    if (one) return { type: 'ability', id: one.id, target: dead[0].id };
  }

  // 2.9) 第83回 B班: おにの手を 出して HP が 4わりを 切ったら、回復の 前に ふういんしなおす（battle-r83b.js）
  const oniSeal = only(r83bSeal(b, c, mine));
  if (oniSeal) return oniSeal;
  // 3) かいふく（地われ・のみこまれ の 人は 回復を 受けられない。battle-earth.js）
  const healCmd = atkOnly ? null : chooseHeal(b, c, tac, allies.filter((x) => !x.status?.rift), mine);
  if (healCmd) return healCmd;
  // 3.5) 地われ・のみこまれ の 仲間に「手をのばす」（第5章 Step 6・7。battle-earth.js）
  const rp = only(reachPlan(b, c));
  if (rp) return rp;

  // 4) じょうたい いじょうを なおす
  const cures = mine.filter(({ a }) => a.effect.type === 'cure');
  const needs = (a, st) => a.effect.statuses.includes(st);
  const stuck = allies.filter((a) => a !== c && (a.status.sleep || a.status.paralyze || a.status.confuse));
  if (stuck.length && !atkOnly) {
    const st = (x) => (x.status.sleep ? 'sleep' : x.status.paralyze ? 'paralyze' : 'confuse');
    const allCure = cures.find(({ a }) => a.target === 'allies' && stuck.every((x) => needs(a, st(x))));
    if (allCure && stuck.length >= 2) return { type: 'ability', id: allCure.id };
    const one = cures.find(({ a }) => a.target === 'ally' && needs(a, st(stuck[0])));
    if (one) return { type: 'ability', id: one.id, target: stuck[0].id };
    if (allCure) return { type: 'ability', id: allCure.id };
  }
  const poisoned = atkOnly ? null : allies.find((a) => a.status.poison && a.hp / a.maxHp < 0.8);
  if (poisoned && b.rng.chance(0.5)) {
    const cure = cures.find(({ a }) => a.target === 'ally' && needs(a, 'poison'));
    if (cure) return { type: 'ability', id: cure.id, target: poisoned.id };
  }

  // 4.5) 月の鏡（まぼろしの 分身を 知っている 人。光が もどったら すぐ 使う）
  if (b.knowsMirage) {
    const mc = mirrorPlan(b);
    if (mc) return mc;
  }

  // 4.78) 第98回: きずなの職業（熱と風の空調マスター・八竜の火影 など。その 職業の 技を 持つ 人だけ。親の 伝説の オート〈4.79〜4.96〉より 先に 見る）
  const kz = only(kizunaPlan(b, c, foes, mine, allies, fightWeight(b)));
  if (kz) return kz;
  // 4.79) 第86回 A班: 前ぶれに 人とようかいのきずな・ためた力を うつ・きずなの力／玉と 炎の よい 方の 玉に かえる・火竜・二重の太刀（battle-r86a.js）
  //   この 2つの 職業の 技を もつ 人だけ（もとの 伝説の 技も 覚えて いるので、その オート〈4.8〜4.96〉より 先に 見る。ほかの 職業は 何も かわらない）
  const r86a = only(r86aPlan(b, c, foes, mine, allies, fightWeight(b)));
  if (r86a) return r86a;
  // 4.795) 第88回 M1班: 敵の 大技の 前ぶれに 天地魔闘の構え（この 技を ひらめいた 人だけ。battle-r88m.js）
  const r88m = only(r88mPlan(b, c, foes, mine));
  if (r88m) return r88m;
  // 4.8) 第82回 A: 前ぶれに ばくりゅうはの かまえ・敵が 多ければ 風の技・つめで HP が へったら おすわり！（battle-r82a.js）
  const r82 = only(r82aPlan(b, c, foes, mine, allies));
  if (r82) return r82;
  // 4.85) 第86回 B班: 格闘王の れい丸・しょう天は・混とんの大軍師の 作戦（大魔法の時間）と 太極・ギガ・スレイブ（この 2つの 職業の 技だけを 見る。battle-r86b.js）
  const r86b = only(r86bPlan(b, c, foes, mine, allies, fightWeight(b)));
  if (r86b) return r86b;
  // 4.9) 第83回 B班: ボスで おにの手を 出す・HP 4わりで ふういんしなおす・状態異常に かんのんきょう・ゆうれいに おふだ（battle-r83b.js）
  const r83b = only(r83bPlan(b, c, foes, mine, allies, fightWeight(b).hard));
  if (r83b) return r83b;
  // 4.9) 第83回 A班: 前ぶれに 先読みの策・作戦を 立てる・敵の 強化に 太極図や 強化ふうじ・ボスで ほう神計画と 号令（battle-r83a.js）
  const r83 = only(r83aPlan(b, c, foes, mine, allies, fightWeight(b)));
  if (r83) return r83;
  // 4.95) 第84回 B班: はじめに すがたを えらぶ・前ぶれや 敵の 強化に 飛竜しょう天は・ボスに かけひき・敵が 多ければ 手数の 技（battle-r84b.js）
  const r84b = only(r84bPlan(b, c, foes, mine, allies, fightWeight(b)));
  if (r84b) return r84b;
  // 4.95) 第84回 A班: れい丸が 0 なら ためる・たおれた 仲間が いれば 仲間のために（battle-r84a.js）
  const r84 = only(r84aPlan(b, c, foes, mine, allies, fightWeight(b)));
  if (r84) return r84;
  // 4.96) 第85回 B班: 火竜を えらんで よぶ・弱った 仲間を かばう（この 系統の 技だけを 見る。battle-r85b.js）
  const r85b = only(r85bPlan(b, c, foes, mine, allies, fightWeight(b)));
  if (r85b) return r85b;
  // 4.97) 第85回 A班: となえて いれば 大砲・MP が 少なければ 定食・ボスや 強い 敵には となえる（前ぶれの 時は 下の 5 に まかせる。battle-r85a.js）
  const r85a = only(r85aPlan(b, c, foes, mine, allies, fightWeight(b)));
  if (r85a) return r85a;

  // 5) ボスの 大わざに そなえる
  // （砂に もぐった 敵の とび出しも。b.ignoreBurrow … 気づかない 人）
  const telegraphing = b.aliveEnemies().some((f) => f.telegraph && !(b.ignoreBurrow && f.burrow) && !waveIgnored(b, f) && !labIgnored(b, f));
  if (telegraphing && !atkOnly && c.hp / c.maxHp < 0.6 && b.rng.chance(0.75)) return { type: 'defend' };
  // 第38回 C: バフは 3回行動の あいだだけ。大わざの 前に、みんなの 守備力を 上げる 技（切れている・あと1回 の 人が 半分 いじょう）
  const quiet = tokeiQuiet(b);
  if (telegraphing && tac.buffs && !quiet) {
    const guard = mine.find(({ a }) => a.target === 'allies' && prim(a).type === 'buff' && (prim(a).stats || [prim(a).stat]).includes('def'));
    const need = allies.filter((x) => !x.buffs.def || (Number.isFinite(x.buffs.def.left) && x.buffs.def.left <= 1));
    if (guard && need.length >= Math.ceil(allies.length / 2) && b.rng.chance(GUARD_BUFF_CHANCE)) return { type: 'ability', id: guard.id };
  }

  // MPが へってきたら まりょくを あつめる
  if (c.maxMp && c.mp / c.maxMp < 0.25 && !atkOnly) {
    const mpUp = mine.find(({ a }) => a.effect.type === 'mpHeal' && a.target === 'self');
    if (mpUp && b.rng.chance(0.6)) return { type: 'ability', id: mpUp.id };
  }

  // 敵が つよく なっている（バイキルト・力ため）: 消す 技が あれば 消す（ツッコミ など）
  const pumped = foes.filter((f) => Object.keys(f.buffs || {}).some((k) => k !== 'eva') || f.charge > 1);
  if (pumped.length && !atkOnly && b.rng.chance(0.6)) {
    const dis = mine.find(({ a }) => (a.effect.type === 'dispel' || a.effect.dispel) && ['enemy', 'group', 'enemies'].includes(a.target));
    if (dis) return { type: 'ability', id: dis.id, target: pumped.sort((x, y) => (y.boss - x.boss))[0].id };
  }
  // 仲間が よわく されている（ルカナン など）: 元に もどす 技
  if (!atkOnly && allies.some((x) => Object.keys(x.debuffs || {}).length) && b.rng.chance(0.4)) {
    const fix = mine.find(({ a }) => a.effect.type === 'dispel' && ['ally', 'allies'].includes(a.target));
    if (fix) return { type: 'ability', id: fix.id, target: allies.find((x) => Object.keys(x.debuffs || {}).length)?.id };
  }

  // 5.5) 第82回 B班: 弱点の 玉に かえる・かみなり雲・きょだい化（battle-r82b.js）
  const ybp = only(r82bPlan(b, c, foes, mine, fightWeight(b).hard));
  if (ybp) return ybp;
  // 6) ほじょ（つよい てきの とき）
  // 第41回: 敵と 味方の 強さを くらべて きめる（前は 敵の HPの 合計 180 より 多いと いつも 補助を していた）
  const fw = fightWeight(b);
  if (tac.buffs && fw.hard) {
    const buff = chooseBuff(b, c, allies, mine, quiet);
    if (buff) return buff;
    // 第96回 T班: 敵を 弱く する 技（まだ かかって いない・きく 敵だけ。バッチリがんばれ・いのちだいじに・MPせつやく）
    //   強い 敵・長い 戦い（hard）の 時。ボス戦では 使わない（前と 同じ。第3部の ボスの 完全オートの 勝ちやすさが 上がった ため。docs/plan-r96-tactics.md）
    //   b.noAutoDebuff … 計算の かかし（tools/sim-jobs.mjs。職業の 強さの 物さしを 前と そろえる）
    const deb = tac.debuffs && !quiet && !b.boss && !b.noAutoDebuff ? chooseDebuff(b, c, foes, mine) : null;
    if (deb) return deb;
  }
  // てきが おおい ときは ねむらせたり こんらんさせたり
  if (tac.buffs && !b.boss && foes.length >= 3 && fw.hard && fw.rounds >= FIGHT_STATUS_ROUNDS && b.rng.chance(0.2)) {
    const st = mine.filter(({ a }) => a.effect.type === 'status' && ['enemies', 'group', 'enemy'].includes(a.target) && a.effect.status !== 'poison');
    // 第96回 T班: きかない 敵（その 状態の 耐性 0）には 使わない（前の えらび方は そのまま）
    const st2 = tac.mode === 'legacy' ? st : st.filter(({ a }) => foes.some((f) => (f.resist?.[a.effect.status] ?? 1) > 0));
    const t = foes.find((f) => !f.status.sleep && !f.status.confuse && !f.status.blind && !f.status.paralyze);
    if (st2.length && t) {
      const pick = st2.sort((x, y) => (y.a.target === 'enemies') - (x.a.target === 'enemies'))[0];
      return { type: 'ability', id: pick.id, target: t.id };
    }
  }

  // 7) こうげき
  return chooseAttack(b, c, tac, foes);
}

export function canUse(b, c, id) {
  const a = ABILITIES[id];
  if (!a || !c.abilities.includes(id)) return false;
  if (a.hidden) return false;
  if ((a.kind === 'spell' || a.spellLike) && c.status.silence) return false;
  // 呪文が ふうじられた 場所（王家のピラミッド 2階）
  if ((a.kind === 'spell' || a.spellLike || a.effect?.type === 'mahouken') && b?.noSpells) return false;
  if (a.kind === 'combo' && c.side === 'ally' && c.penChar && !comboAllowed(c.penChar, id)) return false;
  if (!weaponOk(a, c.weaponCat)) return false;
  // 第84回 A班: れい丸が 足りない 技は 使えない（battle-r84a.js）
  if (!reiOk(c, a)) return false;
  // 第85回 A班: 大砲の 呪文は となえて いないと えらばない（battle-r85a.js）
  if (r85aLocked(c, a)) return false;
  return mpCost(c.penChar, id) <= c.mp;
}

// オートで 使って よい 技か（作戦の「オートで使う技」で「使わない」に した 技・noAuto の 技〈マダンテ など〉は えらばない）
// （同じ 名前の 技は battle.js の autoOffFor で autoOff に ひろげて ある。第41回）
const autoOk = (c, id) => !c.autoOff?.includes(id) && !ABILITIES[id]?.noAuto;

// 技の おもな こうか（いくつかの こうかを もつ 技〈multi〉は さいしょの こうかで えらぶ）
export const prim = (a) => (a?.effect?.type === 'multi' ? a.effect.parts?.[0] || a.effect : a?.effect || {});

// 第96回 T班 第3便: 攻撃の 行動か（ガンガンいこうぜ が えらんで よい 物。ふつうの 攻撃・魔法剣・ダメージを あたえる 技。
//   すい取る 攻撃〈drainHp〉・当てると 回復する 技〈multi の はじめが 攻撃〉も ふくむ。chooseAttack が くらべる 物と 同じ しゅるい）
const ATTACK_TYPES = new Set(['phys', 'magic', 'drainHp', 'destroy', 'deduce']);
export function isAttackCmd(cmd) {
  if (!cmd) return false;
  if (cmd.type === 'attack' || cmd.type === 'mahouken') return true;
  if (cmd.type !== 'ability') return false;
  const a = ABILITIES[cmd.id];
  if (!a) return false;
  const t = prim(a).type;
  return ATTACK_TYPES.has(t) || (t === 'random' && !!a.autoRandom);
}

// いま つかえる わざ（{ id, a }）
function usable(b, c) {
  const out = [];
  for (const id of c.abilities || []) if (autoOk(c, id) && canUse(b, c, id)) out.push({ id, a: ABILITIES[id] });
  return out;
}

// だいたい どれくらい かいふくするか
// x … { id, a }。第50回 D4: 上の 職業の 技は 回復が 多い（skill-tier.js）
function healAmount(c, x) {
  const e = prim(x.a);
  const [mn, mx] = e.base;
  const base = ((mn + mx) / 2) * skillMods(c.penChar, x.id).healMul;
  if (e.fixed) return base;
  return base * powScaleFor(c, c.healPow, e);
}

function chooseHeal(b, c, tac, allies, mine) {
  // 第96回 T班: 「いのちだいじに」は HP 8わり「いか」（前の えらび方は 今までどおり より 少ない 時）
  const hurt = allies.filter((a) => (tac.mode === 'legacy' ? a.hp / a.maxHp < tac.healAt : a.hp / a.maxHp <= tac.healAt));
  if (!hurt.length) return null;
  const heals = mine.filter(({ a }) => prim(a).type === 'heal');
  if (!heals.length) return null;
  const mpw = (x) => 1 + mpCost(c.penChar, x.id) * tac.mpWeight;
  const partyHeals = heals.filter(({ a }) => a.target === 'allies');
  if (hurt.length >= 2 && partyHeals.length) {
    const deficit = hurt.reduce((s, a) => s + (a.maxHp - a.hp), 0) / hurt.length;
    // たりなさに ちかい ものを えらぶ（むだに おおきい わざは つかわない）
    const best = partyHeals.slice().sort((x, y) => Math.abs(healAmount(c, x) - deficit) * mpw(x) - Math.abs(healAmount(c, y) - deficit) * mpw(y))[0];
    return { type: 'ability', id: best.id };
  }
  hurt.sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp);
  const t = hurt[0];
  const deficit = t.maxHp - t.hp;
  const singles = heals.filter(({ a }) => a.target === 'ally' || (a.target === 'self' && t === c));
  if (singles.length) {
    const enough = singles.filter((x) => healAmount(c, x) >= deficit * 0.6);
    const pool = enough.length ? enough : singles;
    const pick = pool.slice().sort((x, y) => (enough.length ? mpCost(c.penChar, x.id) - mpCost(c.penChar, y.id) : healAmount(c, y) - healAmount(c, x)))[0];
    return { type: 'ability', id: pick.id, target: t.id };
  }
  // いのちだいじに: 1人を 回復する 技が 無ければ、みんなを 回復する 技で（回復を 先に）
  if (partyHeals.length && (t.hp / t.maxHp < 0.35 || tac.healFirst)) return { type: 'ability', id: partyHeals[0].id };
  return null;
}

// ───── 第96回 T班: MPせつやく ─────
// とって おく MP: いちばん だいじな 回復・生き返らせる 技（1人を 生き返らせる 技 と いちばん よく 回復する 技）の 分 か、最大MP の 4分の1 の 大きい 方
export function mpReserve(c) {
  if (!c?.maxMp) return 0;
  const key = `${c.maxMp}:${(c.abilities || []).length}:${(c.autoOff || []).length}`;
  if (c._r96res?.key === key) return c._r96res.v;
  let rev = 0, heal = 0, healAmt = -1;
  for (const id of c.abilities || []) {
    const a = ABILITIES[id];
    if (!a || a.hidden || !autoOk(c, id)) continue;
    const cost = mpCost(c.penChar, id);
    if (a.effect?.type === 'revive' && a.target === 'deadAlly') rev = Math.max(rev, cost);
    else if (prim(a).type === 'heal' && ['ally', 'allies'].includes(a.target)) {
      const amt = healAmount(c, { id, a });
      if (amt > healAmt) { healAmt = amt; heal = cost; }
    }
  }
  const v = Math.min(c.maxMp * SAVEMP.reserveCap, Math.max(rev, heal, c.maxMp * SAVEMP.reserveRate));
  c._r96res = { key, v };
  return v;
}
// 敵の のこりの HP の わりあい（ボスが いれば ボスだけ）
function foeLeft(b) {
  const foes = b.aliveEnemies();
  const bosses = foes.filter((f) => f.boss);
  const pool = bosses.length ? bosses : foes;
  const max = pool.reduce((s, f) => s + (f.maxHp || 0), 0);
  return max > 0 ? pool.reduce((s, f) => s + Math.max(0, f.hp), 0) / max : 0;
}
// のこす MP（この 行動の あとに これ いじょう のこる こと）。とって おく MP。ボスなど 長い 戦いでは、敵の のこりの HP に 合わせて 多めに のこす
export function saveFloor(b, c) {
  const R = mpReserve(c);
  if (!c.maxMp || !fightWeight(b).hard) return R;
  return R + Math.max(0, c.maxMp - R) * SAVEMP.pace * foeLeft(b);
}
// MP を とって おく 分を 切らない 技か（回復・生き返らせる・治す・MP を ためる 技は とって おいた 分を 使って よい）
const SAVE_FREE = new Set(['heal', 'revive', 'reviveAll', 'cure', 'mpHeal']);
function saveOk(b, c, id, extra = 0) {
  const a = ABILITIES[id];
  if (!a) return false;
  if (SAVE_FREE.has(prim(a).type) || SAVE_FREE.has(a.effect?.type)) return true;
  const cost = mpCost(c.penChar, id) + extra;
  if (!cost) return true;
  return c.mp - cost >= (c._r96floor ?? saveFloor(b, c)) - 1e-9;
}

// 第96回 T班: 敵を 弱く する 技（守り・攻撃・魔力・すばやさを 下げる）。まだ かかって いない・きく（耐性 0 で ない）敵に。ボス・HP の 多い 敵から
//   1回の 番で 1つだけ ためす（DEBUFF_CHANCE。弱く する 技を たくさん 持って いても 攻撃の 番が へりすぎない ように）
export const DEBUFF_CHANCE = 0.06;
function chooseDebuff(b, c, foes, mine) {
  const ok = (f, st) => !f.debuffs?.[st] && (f.resist?.debuff ?? 1) > 0 && f.hp / f.maxHp > 0.25;
  for (const { id, a } of mine) {
    if (prim(a).type !== 'debuff' || !['enemy', 'group', 'enemies'].includes(a.target)) continue;
    const st = prim(a).stat;
    const pool = foes.filter((f) => ok(f, st));
    if (!pool.length) continue;
    if (a.target === 'enemies' && pool.length < Math.ceil(foes.length / 2)) continue;
    const t = pool.slice().sort((x, y) => (y.boss - x.boss) || (y.hp - x.hp))[0];
    return b.rng.chance(DEBUFF_CHANCE) ? { type: 'ability', id, target: t.id } : null;
  }
  return null;
}

// ほじょ: まだ かかっていない つよく なる わざを えらぶ
// 第38回 C: バフは かかった 人の 3回行動の あいだだけ（buff-acts.js）。何回も かけなおすと 回復・攻撃の 番が へるので、
// かける わりあいは 前より ひかえめ（みんなに 0.5→BUFF_CHANCE.allies・1人に 0.4→.ally・自分に 0.3→.self）
export const BUFF_CHANCE = { allies: 0.2, ally: 0.15, self: 0.12 };
// 大わざの 前ぶれ（telegraph）の ときに みんなの 守備力を 上げる わりあい（decideAlly）
export const GUARD_BUFF_CHANCE = 0.6;
// 第41回: 相手と こっちの 強さを くらべる（家族の 声:「ふつうの 魔物に バフ・デバフ やりすぎ」）
//   rounds … 味方 みんなが ふつうの 攻撃を 1回ずつ した ときに、敵 ぜんぶを たおすまでの 回数（みつもり。技を 使うと もっと はやいので 大きめに 出る）
//   threat … 敵 みんなが 1回ずつ こうげきした ときの ダメージ ÷ 味方の のこりHPの 合計（2回行動の 敵は 2回）
//   hard … ボス・すぐには たおせない（rounds が FIGHT_HARD.rounds 以上）・こわい（threat が FIGHT_HARD.threat 以上）
//   補助（バフ・じわじわ回復）と ねむり・こんらん などは hard の 時だけ（ねむり などは さらに rounds が FIGHT_STATUS_ROUNDS 以上）。
//   めやす（同じ レベルの フィールド・ダンジョン）: threat は 0.05〜0.11。ボスでは いつも hard
export const FIGHT_HARD = { rounds: 30, threat: 0.13 };
export const FIGHT_STATUS_ROUNDS = 6;
export function fightWeight(b) {
  const key = `${b.allyActs || 0}:${b.combatants.length}`;
  if (b._fightW?.key === key) return b._fightW;
  const allies = b.aliveAllies();
  const foes = b.aliveEnemies().filter((f) => !f.burrow);
  let dmg = 0, foeHp = 0, threat = 0, allyHp = 0;
  for (const c of allies) {
    allyHp += c.hp;
    if (!foes.length) continue;
    let sum = 0;
    for (const f of foes) {
      const r = b.calcPhys(c, f, { mult: 1 }, 1, 'phys', true);
      sum += Math.max(r.dmg * r.hit, c.mag ? c.mag * 0.25 : 0);
    }
    dmg += sum / foes.length;
  }
  for (const f of foes) {
    foeHp += f.hp;
    if (!allies.length) continue;
    let sum = 0;
    for (const a of allies) {
      const r = b.calcPhys(f, a, { mult: 1 }, 1, 'phys', true);
      // 呪文の 魔物は 魔力で ざっくり
      sum += Math.max(r.dmg * r.hit, (f.mag || 0) * 0.5);
    }
    threat += (sum / allies.length) * (f.turns || 1) * (f.dmgRate || 1);
  }
  const rounds = dmg > 0 ? foeHp / dmg : 99;
  const t = allyHp > 0 ? threat / allyHp : 1;
  const hard = !!b.boss || rounds >= FIGHT_HARD.rounds || t >= FIGHT_HARD.threat;
  b._fightW = { key, rounds, threat: t, hard };
  return b._fightW;
}

// quiet … カリヨンの 時のかねが 近い（強くする 技は 使わない。じわじわ回復・力ため などは 使う。battle-tokei.js の tokeiQuiet）
function chooseBuff(b, c, allies, mine, quiet = false) {
  const rng = b.rng;
  const buffs = quiet ? [] : mine.filter(({ a }) => prim(a).type === 'buff');
  const stat = (a) => prim(a).stats || [prim(a).stat];
  // じわじわ 回復: 少し へっている 仲間が いて、まだ かかっていない とき
  const regen = mine.filter(({ a }) => prim(a).type === 'regen');
  for (const { id, a } of regen) {
    const pool = allies.filter((x) => !x.regen && x.hp / x.maxHp < 0.85);
    if (!pool.length || !rng.chance(0.35)) continue;
    if (a.target === 'allies' && pool.length >= 2) return { type: 'ability', id };
    if (a.target === 'ally') return { type: 'ability', id, target: pool.sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0].id };
    if (a.target === 'self' && pool.includes(c)) return { type: 'ability', id };
  }
  const lacking = (x, a) => stat(a).some((st) => !x.buffs[st]);
  for (const { id, a } of buffs.sort(() => rng.float(-1, 1))) {
    if (a.target === 'allies') {
      if (allies.filter((x) => lacking(x, a)).length >= Math.ceil(allies.length / 2) && rng.chance(BUFF_CHANCE.allies)) return { type: 'ability', id };
    } else if (a.target === 'ally') {
      const st = stat(a);
      const pool = allies.filter((x) => lacking(x, a));
      const t = st.includes('atk') ? pool.sort((x, y) => y.atk - x.atk)[0] : pool.sort((x, y) => x.dfn - y.dfn)[0];
      if (t && rng.chance(BUFF_CHANCE.ally) && (!st.includes('atk') || t.atk > 25)) return { type: 'ability', id, target: t.id };
    } else if (a.target === 'self') {
      if (lacking(c, a) && rng.chance(BUFF_CHANCE.self)) return { type: 'ability', id };
    }
  }
  // 仲間の 番を 早める 技（アンコール・伝説のきずな など。第31回: きずなゲージを ためる 技の かわり）
  const hurry = mine.find(({ a }) => a.target === 'allies' && (a.effect.type === 'multi' ? a.effect.parts || [] : [a.effect]).some((p) => p.type === 'atbSet' && p.add));
  // （時のかねの 前は、強くする こうかの ついた 技〈きずなのちかい など〉も 使わない）
  if (hurry && b.boss && !(quiet && prim(hurry.a).type === 'buff') && rng.chance(0.2)) return { type: 'ability', id: hurry.id };
  const charge = mine.find(({ a }) => a.effect.type === 'charge');
  if (charge && b.boss && c.charge <= 1 && rng.chance(0.25)) return { type: 'ability', id: charge.id };
  return null;
}

function strongestFoe(foes) {
  return foes.slice().sort((x, y) => (y.boss - x.boss) || (y.hp - x.hp))[0];
}

// 反撃の構えを している 敵（物理で こうげきすると 反撃される。battle.js の stance）
// b.ignoreStance: 構えを 気にしない（tools/sim.js で「気づかない 人」の つよさを はかる）
const countering = (t, b) => !b?.ignoreStance && t?.stance?.kind === 'counter';

// よみがえりの呪文を となえて いる 敵（ためた ダメージで 呪文が とぎれる。battle.js の chant）
// b.ignoreChant: 呪文に 気づかない（tools/sim.js で「気づかない 人」の つよさを はかる）
const chanting = (t, b) => !b?.ignoreChant && !!t?.chant;

// こうげきの えらびかた: きたいダメージ ÷ MPの おもさ
// 反撃の構えの 敵に 物理で あたる こうげきは えらばない（呪文・ほかの 敵。なければ 防御して まつ）
// 呪文を となえて いる 敵は、とぎれさせる ために ねらう（オートの 仲間も かしこく）
function chooseAttack(b, c, tac, foes) {
  const opts = [];
  const value = (t, dmg) => {
    const eff = Math.min(dmg, t.hp);
    const stop = chanting(t, b) ? Math.min(dmg, Math.max(0, t.chant.need - t.chant.dmg)) * 3 + 40 : 0;
    // b.focusBoss … ボスを ねらう（ボスが たおれると 手下も くずれる ことを 知っている 人。tools/sim.js）
    return eff + (dmg >= t.hp ? 8 + t.atk / 3 : 0) + (t.boss ? eff * (b.focusBoss ? 1.2 : 0.2) : 0) + stop;
  };
  // ふつうの こうげき（ムチは グループ、ブーメランは 全体に とどく。battle.js の attackPlan）
  for (const t of foes) {
    const plan = b.attackPlan ? b.attackPlan(c, t.id) : [{ t, mult: 1 }];
    let kills = false;
    const score = plan.reduce((s, p) => {
      const r = b.calcPhys(c, p.t, { mult: p.mult }, 1, 'phys', true);
      if (r.dmg * r.hit >= p.t.hp) kills = true;
      return s + value(p.t, r.dmg * r.hit);
    }, 0);
    opts.push({ cmd: { type: 'attack', target: t.id }, score, mp: 0, risky: plan.some((p) => countering(p.t, b)), plain: true, kills });
  }
  const save = tac.mode === 'savemp';
  for (const id of c.abilities) {
    const a = ABILITIES[id];
    if (!a || !autoOk(c, id) || !canUse(b, c, id)) continue;
    // 第96回 T班: MPせつやく … とって おく MP を 切る 技は 使わない
    if (save && !saveOk(b, c, id)) continue;
    const eff = prim(a);
    if (eff.type !== 'phys' && eff.type !== 'magic' && eff.type !== 'drainHp' && eff.type !== 'destroy' && eff.type !== 'deduce' && !(eff.type === 'random' && a.autoRandom)) continue;
    if (eff.recoil && c.hp / c.maxHp < 0.5) continue; // もろばぎりは HPが すくない ときは つかわない
    const mp = mpCost(c.penChar, id);
    const pow = penaltyFor(c.penChar, id).powMult;
    // はかい（destroy）: ボス・メタル いがいは けしさる（のこりの HP × 成功の わりあい）。ボス・メタルには 大きな ダメージ
    if (eff.type === 'destroy') {
      if (a.target !== 'enemy') continue;
      for (const t of foes) {
        let score;
        if (t.boss || t.metal) {
          const r = b.calcPhys(c, t, { mult: eff.bossMult || 2 }, pow, 'phys', true);
          score = value(t, r.dmg * r.hit);
        } else score = value(t, t.hp) * (eff.chance ?? 0.7);
        opts.push({ cmd: { type: 'ability', id, target: t.id }, score, mp, risky: (t.boss || t.metal) && countering(t, b) });
      }
      continue;
    }
    // 運しだいの 技（ひみつ道具・あたまの花。autoRandom の ものだけ）: 中みの 攻撃の ダメージの へいきんで えらぶ
    // （回復や 補助が 出る ときも むだには ならないので、攻撃の 中みの へいきんと 同じ くらいと みる。
    //   中みの 技は 自分の 番で あいてを えらぶので、敵 1体の 技は 敵の へいきん）
    if (eff.type === 'random') {
      const scores = [];
      for (const o of (eff.options || []).map((x) => ABILITIES[x]).filter(Boolean)) {
        const oe = prim(o);
        if ((oe.type !== 'phys' && oe.type !== 'magic') || !['enemy', 'group', 'enemies'].includes(o.target)) continue;
        const one = (t) => {
          if (oe.type === 'magic') return value(t, b.calcMagic(c, t, oe, pow, true).dmg);
          const r = b.calcPhys(c, t, oe, pow, oe.element || 'phys', true);
          return value(t, r.dmg * r.hit * (oe.hits || 1));
        };
        const sum = foes.reduce((s2, t) => s2 + one(t), 0);
        scores.push(o.target === 'enemies' ? sum : sum / foes.length);
      }
      if (scores.length) opts.push({ cmd: { type: 'ability', id }, score: scores.reduce((x, y) => x + y, 0) / scores.length, mp, risky: false });
      continue;
    }
    const est = (t) => {
      // 推理: 敵の いちばんの 弱点の 属性で 見つもる
      if (eff.type === 'deduce') return b.calcMagic(c, t, { ...eff, element: deduceElement(t) || undefined }, pow, true).dmg;
      if (eff.type === 'phys' || eff.type === 'drainHp') {
        const r = b.calcPhys(c, t, eff, pow, eff.element || 'phys', true);
        return r.dmg * r.hit * (eff.hits || 1);
      }
      return b.calcMagic(c, t, eff, pow, true).dmg;
    };
    const phys = eff.type === 'phys' || eff.type === 'drainHp';
    if (a.target === 'enemies') {
      let total = 0;
      if (eff.random) {
        // ランダムに あたる ので へいきん
        const per = foes.reduce((s, t) => s + est(t) / (eff.hits || 1), 0) / foes.length;
        total = per * (eff.hits || 1);
      } else {
        for (const t of foes) total += value(t, est(t));
      }
      opts.push({ cmd: { type: 'ability', id, target: foes[0].id }, score: total, mp, risky: phys && foes.some((t) => countering(t, b)) });
    } else if (a.target === 'group') {
      for (const t of foes) {
        const grp = foes.filter((x) => x.species === t.species);
        const total = grp.reduce((s, g) => s + value(g, est(g)), 0);
        opts.push({ cmd: { type: 'ability', id, target: t.id }, score: total, mp, risky: phys && grp.some((g) => countering(g, b)) });
      }
    } else if (a.target === 'enemy') {
      for (const t of foes) opts.push({ cmd: { type: 'ability', id, target: t.id }, score: value(t, est(t)), mp, risky: phys && countering(t, b) });
    }
  }
  // 魔法剣
  if (c.abilities.includes('mahouken') && autoOk(c, 'mahouken') && weaponOk({ weapon: 'blade' }, c.weaponCat) && !c.status.silence && !b.noSpells) {
    for (const sp of c.abilities.filter((id) => isAttackSpell(id) && autoOk(c, id))) {
      for (const sk of c.abilities.filter((id) => isSwordSkill(id) && autoOk(c, id))) {
        const mp = mpCost(c.penChar, sp) + mpCost(c.penChar, sk);
        if (mp > c.mp) continue;
        if (save && !saveOk(b, c, sk, mpCost(c.penChar, sp))) continue;
        const spA = ABILITIES[sp], skA = ABILITIES[sk];
        const spPow = penaltyFor(c.penChar, sp).powMult, skPow = penaltyFor(c.penChar, sk).powMult;
        for (const t of foes) {
          const r = b.calcPhys(c, t, { ...skA.effect, element: spA.effect.element }, skPow, spA.effect.element, true);
          const m = b.calcMagic(c, t, spA.effect, spPow, true);
          opts.push({ cmd: { type: 'mahouken', spell: sp, skill: sk, target: t.id }, score: value(t, r.dmg * r.hit + m.dmg * 0.6), mp, risky: countering(t, b) });
        }
      }
    }
  }
  const mpRatio = c.maxMp ? c.mp / c.maxMp : 0;
  const easy = save && !fightWeight(b).hard;
  // MPせつやく: ふつうの 攻撃で たおせる 敵が いる 弱い 戦いでは ふつうの 攻撃
  const easyKill = easy && opts.some((o) => o.plain && o.kills && !o.risky);
  // hardMp … ボスなど 長い 戦い（fightWeight の hard）では、MP を 前と 同じ 重さで 見る（tac.mpWeight。長い 戦いで MP を 切らさない）
  const oldWay = tac.mode === 'legacy' || (tac.hardMp && fightWeight(b).hard);
  for (const o of opts) {
    let w;
    if (oldWay) {
      // 前の えらび方: MPが すくない ときは より せつやく
      w = tac.mpWeight * (mpRatio < 0.3 ? 3 : 1);
      o.final = o.score / (1 + o.mp * w * 10) * b.rng.float(0.9, 1.1) * (o.risky ? 0.05 : 1);
      continue;
    }
    // 第96回 T班: MP は 最大MP との わりあいで 見る（レベルが 上がっても 同じ 見方）
    const frac = c.maxMp ? o.mp / c.maxMp : 0;
    if (tac.mode === 'aggressive') w = 0; // いちばん 大きな ダメージ（MP は 見ない）
    else if (save) w = easy ? SAVEMP.easyCostK : SAVEMP.costK;
    else w = (tac.costK ?? 3) * (mpRatio < 0.3 ? 3 : 1); // バッチリがんばれ・いのちだいじに: ダメージ ÷ MP も 少し 見る
    // ガンガンいこうぜ は ゆらぎを 小さく（中くらいの 技を なんとなく えらばない）
    const jit = tac.mode === 'aggressive' ? b.rng.float(0.98, 1.02) : b.rng.float(0.9, 1.1);
    o.final = o.score / (1 + frac * w) * jit * (o.risky ? 0.05 : 1) * (easyKill && o.plain && o.kills ? 3 : 1);
  }
  // 光っている 敵に 呪文を 使わない など（battle-temple.js）
  templeAdjust(b, c, opts);
  arenaAdjust(b, c, opts);
  // 第84回 A班: ざこに れい丸を 使わない・ぜんぶ うつ 技は まんたんの 時（battle-r84a.js）
  r84aAdjust(b, c, opts, fightWeight(b));
  opts.sort((x, y) => y.final - x.final);
  // 物理しか ない ときに 反撃の構えの 敵しか いない: 防御して 構えが とけるのを まつ
  //   （ガンガンいこうぜ は 守らずに 攻撃。第96回 T班 第3便）
  if (opts[0]?.risky && tac.mode !== 'aggressive') return { type: 'defend' };
  return opts[0]?.cmd || { type: 'attack', target: foes[0].id };
}
