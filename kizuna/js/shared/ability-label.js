// 技の 名前・セリフ・説明・えんしゅつを、使う 人に 合わせて えらぶ（第33回 家族が きめた こと）
//
// 男の子（look.body が 1 で ない）の 美少女戦士・セーラームーンは、見た目が タキシード仮面ふう（client/render/hero-r33.js の R33_MASC）。
// なので 技も タキシード仮面の 技に する。強さ（効果・MP・ねらい）は おなじで、名前・セリフ・説明・えんしゅつ だけ かわる。
// 女の子は 今の まま。
//
//  技の データに masc: { name, kana, cast, desc, anim } を 書くと、男の子が 使う（メニューで 見る）ときは それで うわがきする
//  合体技（data/dual.js）は masc: { group, name, kana, desc, says } … group: need の どの 組の 人が 男の子なら かえるか、
//   says: { parts の 番号: 'セリフ' }
//
//  abilityFor(id か 技, 人) … その 人 むけの 技の データ（masc が なければ もとの まま。おなじ 物を かえす）
//  abilityLabel(id か 技, 人) … その 人 むけの 技の 名前（技の 名前を 出す 所は ぜんぶ これ か abilityFor を 使う）
//  dualFor(id か 合体技, 出す 人たち) / dualLabel … 合体技の おなじ しくみ
//  人 … キャラ（char）・戦いの 人（combatant。サーバーの c も、クライアントの pub(c) も look を もつ）
import { ABILITIES } from './data/abilities.js?v=751dd4575c23';
import { DUAL_TECHS, groupJobs } from './data/dual.js?v=751dd4575c23';
import { isMasc } from './job-label.js?v=751dd4575c23';

// 男の子か（見た目の look.body が 1 で ない）。モンスター（仲間の 魔物・敵）は ちがう。
// look の ない もの（職業だけの { job, jobs }・敵・古い データ）は もとの 技の まま（ちがう 名前を 出さない ため）
// きめ方は job-label.js の 1か所（職業の 名前も おなじ きめ方。jobLabel）
export { isMasc };

const cache = new WeakMap();
const merged = (base, over) => {
  let m = cache.get(base);
  if (!m) {
    m = { ...base, ...over };
    delete m.masc;
    cache.set(base, m);
  }
  return m;
};

export function abilityFor(ab, who) {
  const a = typeof ab === 'string' ? ABILITIES[ab] : ab;
  if (!a || !a.masc || !isMasc(who)) return a;
  return merged(a, a.masc);
}

export function abilityLabel(ab, who) {
  return abilityFor(ab, who)?.name || '';
}

// ───── 合体技 ─────
// members: 出す 人たち（キャラ・戦いの 人。job と look を 見る）。その 組（masc.group）を うけもつ 職業の 男の子が いれば masc
export function dualMasc(t, members) {
  if (!t?.masc) return false;
  const jobs = groupJobs(t.need[t.masc.group || 0] || []);
  return (members || []).some((m) => m && jobs.has(m.job) && isMasc(m));
}

export function dualFor(t0, members) {
  const t = typeof t0 === 'string' ? DUAL_TECHS[t0] : t0;
  if (!t || !dualMasc(t, members)) return t;
  let m = cache.get(t);
  if (!m) {
    const { says, group, ...over } = t.masc;
    m = { ...t, ...over, parts: says ? t.parts.map((p, i) => (says[i] && p.say ? { ...p, say: says[i] } : p)) : t.parts };
    delete m.masc;
    cache.set(t, m);
  }
  return m;
}

export function dualLabel(t, members) {
  return dualFor(t, members)?.name || '';
}

// メニューで 見る とき: 見ている キャラが その 組の 職業なら その キャラで、ちがう ときは パーティーの 人たちで きめる
export function dualForView(t0, viewer, party = []) {
  const t = typeof t0 === 'string' ? DUAL_TECHS[t0] : t0;
  if (!t?.masc) return t;
  const jobs = groupJobs(t.need[t.masc.group || 0] || []);
  return dualFor(t, viewer && jobs.has(viewer.job) ? [viewer] : [viewer, ...party]);
}
