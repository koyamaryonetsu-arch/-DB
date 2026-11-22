// 第98回 K3班: 伝説のPTA会長の オート（data/jobs-r98-pta.js。新しい 戦いの しくみは ない ので オートだけ）
//   ai.js の decideAlly が battle-kizuna.js の kizunaPlan から よぶ（この 職業の 技〈a.job〉を 持つ 人だけ）
//   弱った 仲間を かばうのは 親の しくみ（passive.protect。battle-r83b.js）が 自分で する。HP が へった 時の おにの手の ふういんは r83bSeal（ai.js）
//   ここでは かけ合わせの 技（おにの手・PTA総出動）・子どもたちを守るたて・おしかり・お弁当・おにの手・げんこつ
//   第96回の 作戦の きまり: ガンガンは 攻撃の 答えだけ 通る（ai.js の only）
import { oniPct } from './battle-r83b.js';

// オートの わりあい（tools/sim-r86a.mjs で 合わせた）
export const PTA_AI = { tate: 0.6, shikaru: 0.5, bentou: 0.6, onite: 0.7, sig: 0.5, genkotsu: 0.95, many: 0.3 };

const hurt = (x) => x.alive && x.hp < x.maxHp * 0.55;

export function ptaPlan(b, c, foes, mine, allies, fw) {
  const my = mine.filter(({ a }) => a.job === 'pta_kaichou');
  if (!my.length || !foes.length) return null;
  const find = (id) => my.find((x) => x.id === id);
  const sig = find('pta_kaichou_sig');
  const boss = foes.find((f) => f.boss);
  const tele = foes.some((f) => f.telegraph);
  const hp = c.maxHp > 0 ? c.hp / c.maxHp : 1;
  // 1) 前ぶれ: 子どもたちを守るたて（自分の HP に よゆうが ある 時）
  const tate = find('ptk_tate');
  if (tele) {
    if (tate && !c.teShield && hp >= 0.5 && b.rng.chance(PTA_AI.tate)) return { type: 'ability', id: tate.id };
    return null;
  }
  // 2) 仲間が 何人も 弱って いる ＝ お弁当
  const bentou = find('ptk_bentou');
  if (bentou && allies.filter(hurt).length >= 2 && b.rng.chance(PTA_AI.bentou)) return { type: 'ability', id: bentou.id };
  if (boss || fw?.hard) {
    const t = boss || foes[0];
    // 3) 敵の 攻撃が 下がって いない ＝ おしかり
    const shikaru = find('ptk_shikaru');
    if (shikaru && !t.debuffs?.atk && b.rng.chance(PTA_AI.shikaru)) return { type: 'ability', id: shikaru.id };
    // 4) おにの手を 出す（HP に よゆうが ある 時）
    const onite = find('ptk_onite');
    if (onite && !c.oni && hp >= 0.6 && b.rng.chance(PTA_AI.onite)) return { type: 'ability', id: onite.id };
    if (hp < 0.35) return null;
    // 5) 看板（ほかにも 敵が いる・おにの手が 強い 時）・げんこつ
    if (sig && (foes.length >= 2 || oniPct(c) >= 0.6) && b.rng.chance(PTA_AI.sig)) return { type: 'ability', id: sig.id };
    const gen = find('ptk_genkotsu');
    if (gen && b.rng.chance(PTA_AI.genkotsu)) return { type: 'ability', id: gen.id, target: t.id };
    return null;
  }
  // 6) 敵が 多い ＝ 会長の雷
  if (foes.length >= 3 && b.rng.chance(PTA_AI.many)) {
    const kami = find('ptk_kaminari');
    if (kami) return { type: 'ability', id: kami.id };
  }
  return null;
}
