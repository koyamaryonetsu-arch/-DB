// 第88回 M1班: 魔王の ひらめき技「天地魔闘の構え」の 戦いの しくみ（data/hirameki-r88m.js。docs/plan-r88-anime-gear.md の 11・12-2）
// どれも 戦いの 中だけ（戦いの 人〈combatant〉に つける。キャラ・セーブ・引っこしコードには 何も 足さない）
//
// ■ 天地魔闘の構え（type 'r88mTenchi'。自分に かける）
//   c.r88mTenchi = { cut, hand, max, left, bird, last, name } … 次の 自分の 番の はじめ（r88mTurnStart）まで かまえる。札「天地魔闘」
//   1. 地（フェニックスウィング）: かまえの 間、敵から 受ける ダメージが cut 倍（半分）。前ぶれの ある 大技にも 効く。
//      作戦・まどか・身を 守る などと 重ねても、もとの ダメージ（身を 守らない 時）の FLOOR（4分の1）より 下げない（r88mMark・r88mCut。
//      身を 守る 0.5倍は ダメージの 前に かかって いるので、身を 守って いる 時の 下限は 来た ダメージの 半分）
//   2. 天（カラミティエンド）: 敵の 攻撃や 呪文で ダメージを 受けるたびに（1回の 敵の 行動で 1回）、その 敵に 手刀で 反撃する
//      （物理の hand 倍。1回の かまえで max〈3〉回まで。ねむり・マヒ・こんらんの 間は できない）。
//      反撃の構え（resolveCounters）と おなじく、敵の 行動の あとで まとめて やりかえす（r88mResolve）
//   3. 魔（カイザーフェニックス）: かまえが とける 時（次の 自分の 番の はじめ・身を 守るも 1回の 番）、さいごに 攻撃して きた 敵に
//      火の 鳥（炎の 呪文。bird の base・thr。Lv1 の カイザーフェニックス〈敵全体〉より 弱い 1体の 技）。だれにも 攻撃されなければ 出ない
//   ・えんしゅつ用に ev.r88mSet（かまえた）・ev.r88mHands（手刀 [{ by, on }]）・ev.r88mBird（火の 鳥 { by, on }）・
//     results の r88m（'hand' | 'bird'。client/battle-r88m.js が あとから 数を 出す）
//   ・試練の まぼろし・鏡の うつし身は この 技を 使わない（battle-trial.js の NO_USE・battle-temple.js の MIRROR_SKIP に 足す）。
//     敵が 持って いても 何も おきない（仲間だけの しくみ）
// battle.js から よぶ: r88mTurnStart（行動の はじめ・防御）・r88mEffect（switch）・r88mMark（作戦の 前）・r88mCut（下限の あと）・
//   r88mNote（damage の さいご）・r88mResolve（行動の おわり）・r88mPub（pub）
// ai.js から よぶ: r88mPlan（オート。敵の 大技の 前ぶれが ある 時に ときどき 使う）
// サーバーでも ブラウザでも 使う（canvas・DOM なし）

// 地: 重ねても 下げない 下限（もとの ダメージの 何倍）
export const R88M_FLOOR = 0.25;
// オートで 使う わりあい（敵の 大技の 前ぶれが ある 時だけ。tools/sim-jobs.mjs の 魔王の ボス戦で 合わせた）
export const R88M_AI = { tele: 0.6, minHp: 0.35 };

const busy = (x) => x.status?.sleep || x.status?.paralyze || x.status?.confuse || x.status?.rift || x.status?.prison;
const lineOnce = (ev, key, line) => {
  if (ev[key]) return;
  ev[key] = true;
  ev.lines.push(line);
};
// その 間に damage が ev.results に 足した ものに しるしを つける（えんしゅつで あとから 出す）
function tagResults(ev, n0, tag) {
  for (const r of (ev.results || []).slice(n0)) r.r88m = tag;
}

// ───────────── 技の こうか（applyAbility の switch） ─────────────
export const R88M_TYPES = ['r88mTenchi'];
export function r88mEffect(b, c, a, eff, ev) {
  if (eff.type !== 'r88mTenchi') return false;
  if (c.side !== 'ally') return true;
  c.r88mTenchi = {
    cut: eff.cut ?? 0.5, hand: eff.hand?.mult ?? 1.3, left: eff.hand?.max ?? 3,
    bird: { element: 'fire', base: eff.bird?.base || [110, 140], thr: eff.bird?.thr ?? 60 }, last: null, name: a.name,
  };
  ev.fx = { type: 'ability', anim: a.anim, actor: c.id, targets: [c.id], side: c.side };
  ev.lines.push(`${c.name}は、天地魔闘の構えをとった！（次の番まで、受けるダメージが半分・攻撃されると手刀で反撃）`);
  ev.r88mSet = c.id;
  ev.upd.push(c);
  return true;
}

// ───────────── 行動の はじめ（executeNext・防御）: かまえが とける ＝ 魔（火の 鳥） ─────────────
export function r88mTurnStart(b, c, ev) {
  const s = c?.r88mTenchi;
  if (!s) return;
  delete c.r88mTenchi;
  ev.upd.push(c);
  const t = s.last ? b.get(s.last) : null;
  if (!c.alive || busy(c) || !t?.alive || t.side === c.side || t.fled) {
    if (c.alive) ev.lines.push(`${c.name}は、しずかに構えをといた。`);
    return;
  }
  ev.lines.push(`${c.name}の構えがとけた！カイザーフェニックス！火の鳥が、${t.name}へとんでいく！`);
  ev.r88mBird = { by: c.id, on: t.id };
  ev.results = ev.results || [];
  const n0 = ev.results.length;
  b.magicHit(c, t, s.bird, ev, 1);
  tagResults(ev, n0, 'bird');
}

// ───────────── ダメージ ─────────────
// 作戦・まどか などの 前: へらす 前の ダメージを おぼえる（地の 下限の ため）
export function r88mMark(c, t, dmg, info) {
  if (t?.r88mTenchi && c?.side === 'enemy' && dmg > 0 && !(info.r88mRaw > 0)) info.r88mRaw = dmg;
}
// 下限の あと: 地（フェニックスウィング）で cut 倍。ほかと 合わせても もとの R88M_FLOOR 倍
//   （身を 守って いる 時は 来た ダメージが もう 半分〈物理〉なので、来た ダメージの 半分まで）より 下げない
export function r88mCut(t, dmg, info = {}, ev = null) {
  const s = t?.r88mTenchi;
  if (!s || !(dmg > 0) || !(info.r88mRaw > 0) || !t.alive) return dmg;
  const floor = Math.round(info.r88mRaw * (t.defending ? 0.5 : R88M_FLOOR));
  const out = Math.max(1, Math.min(dmg, Math.max(Math.round(dmg * s.cut), floor)));
  if (ev && out < dmg) lineOnce(ev, `r88mCutMsg${t.id}`, `${t.name}のフェニックスウィング！攻撃をはじいて、ダメージを半分にした！`);
  return out;
}
// damage の さいご（HP を へらす 前）: 天（手刀の 反撃）の よやくと、さいごに 攻撃して きた 敵（魔）を おぼえる
export function r88mNote(b, c, t, dmg, info, ev) {
  const s = t?.r88mTenchi;
  if (!s || !(dmg > 0) || c?.side !== 'enemy' || t.side !== 'ally' || !c.alive) return;
  // この ダメージで たおれる 時は 何も しない（かまえも とける）
  if (dmg >= t.hp) {
    delete t.r88mTenchi;
    return;
  }
  s.last = c.id;
  if (s.left <= 0 || !ev) return;
  ev.r88mPend = ev.r88mPend || [];
  if (ev.r88mPend.some((k) => k.by === t.id)) return;
  ev.r88mPend.push({ by: t.id, on: c.id });
  s.left--;
}
// 行動の おわり（resolveCounters の あと）: 手刀で 反撃
export function r88mResolve(b, ev) {
  const list = ev.r88mPend;
  delete ev.r88mPend;
  for (const { by, on } of list || []) {
    const t = b.get(by), a = b.get(on);
    if (!t?.alive || !a?.alive || busy(t)) continue;
    const s = t.r88mTenchi;
    ev.lines.push(`${t.name}のカラミティエンド！手刀で反撃した！`);
    ev.r88mHands = (ev.r88mHands || []).concat({ by: t.id, on: a.id });
    ev.upd.push(t);
    const res = b.calcPhys(t, a, { mult: s?.hand ?? 1.3 }, 1, 'phys');
    ev.results = ev.results || [];
    if (res.miss) {
      ev.lines.push(`${a.name}は、ひらりと身をかわした！`);
      ev.results.push({ id: a.id, miss: true, r88m: 'hand' });
      continue;
    }
    if (res.crit) ev.lines.push('会心の一撃！');
    const n0 = ev.results.length;
    b.damage(t, a, res.dmg, ev, { crit: res.crit, element: 'phys', phys: true });
    tagResults(ev, n0, 'hand');
  }
}

// クライアントに 見せる（pub）: 札「天地魔闘」と のこりの 反撃の 回数
export function r88mPub(c) {
  if (c.side !== 'ally') return {};
  return { r88mTenchi: !!c.r88mTenchi, r88mLeft: c.r88mTenchi ? Math.max(0, c.r88mTenchi.left) : 0 };
}

// ───────────── オート（ai.js の decideAlly） ─────────────
// 敵の 大技の 前ぶれが ある 時だけ ときどき（使いすぎない。もう かまえて いる・HP が 少ない 時は 使わない）
// mine … 今 使える 技（ai.js の usable。MP・オートで 使わない 技は もう のぞいて ある）
export function r88mPlan(b, c, foes, mine) {
  if (c?.side !== 'ally' || c.r88mTenchi || !foes.length) return null;
  if (!foes.some((f) => f.telegraph)) return null;
  if (c.maxHp > 0 && c.hp / c.maxHp < R88M_AI.minHp) return null;
  const my = mine.find(({ a }) => a.effect?.type === 'r88mTenchi');
  if (!my || !b.rng.chance(R88M_AI.tele)) return null;
  return { type: 'ability', id: my.id };
}
