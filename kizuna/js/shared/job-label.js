// 職業の 名前・説明を、その 人に 合わせて えらぶ（第33回 家族が きめた こと）
//
// 男の子（look.body が 1 で ない）の 美少女戦士は「仮面のしんし」、セーラームーンは「タキシード仮面」。
// 見た目（client/render/hero-r33.js の R33_MASC）と 技（ability-label.js の abilityFor）も 男の子 むけ。女の子は 今の まま。
// 強さ・じょうけん・ID は おなじで、名前・みじかい 名前・かな・説明・神殿の うわさ だけ かわる。
//
//  職業の データに masc: { name, short, kana, desc, hint } を 書くと、男の子には それで うわがきする
//
//  jobFor(id, 人)   … その 人 むけの 職業の データ（masc が なければ もとの まま。おなじ 物を かえす）
//  jobLabel(id, 人) … その 人 むけの 職業の 名前（職業の 名前を 出す 所は ぜんぶ これ か jobFor を 使う）
//  jobShort(id, 人) … みじかい 名前
//  jobHint(id, 人)  … 神殿の うわさ（JOB_HINTS か masc.hint）
//  人 … キャラ（char）・戦いの 人（combatant）・パーティーの 人（look を もつ もの）。
//       転職の 一覧などは「見ている 人（その 職業に なる 人）」で きめる
import { JOBS, JOB_HINTS } from './data/jobs.js?v=8370ffc103a5';

// 男の子か（見た目の look.body が 1 で ない）。モンスター（仲間の 魔物・敵）は ちがう。
// look の ない もの（職業だけの { job, jobs }・敵・古い データ）は もとの まま（ちがう 名前を 出さない ため）
// ability-label.js も これを 使う（男の子かの きめ方は ここ 1か所）
export function isMasc(who) {
  if (!who || typeof who !== 'object' || who.mon) return false;
  return !!who.look && typeof who.look === 'object' && who.look.body !== 1;
}

const cache = new WeakMap();
export function jobFor(jobId, who) {
  const j = JOBS[jobId];
  if (!j || !j.masc || !isMasc(who)) return j;
  let m = cache.get(j);
  if (!m) {
    m = { ...j, ...j.masc };
    delete m.masc;
    delete m.hint;
    cache.set(j, m);
  }
  return m;
}

export function jobLabel(jobId, who) {
  return jobFor(jobId, who)?.name || '';
}

export function jobShort(jobId, who) {
  const j = jobFor(jobId, who);
  return j?.short || j?.name || '';
}

export function jobHint(jobId, who) {
  return (isMasc(who) && JOBS[jobId]?.masc?.hint) || JOB_HINTS[jobId] || '';
}
