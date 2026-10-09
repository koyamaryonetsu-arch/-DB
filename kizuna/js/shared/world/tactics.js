// たたかいの 中で さくせんを かえる（なかまの つよさの まどを タップ → client/battle.js）
//   msg: { t: 'battle', actor: 戦っている 人の id, tactics: 'balanced' など（ai.js の TACTICS） }
//   かえられるのは じぶん（オートの ときの さくせん。めいれいさせろ は なし）と じぶんの なかま だけ。
//   家族の キャラ（ほかの 人が うごかす）・ほかの 人の なかま・ゲストは かえられない。
//   かえた さくせんは すぐ たたかいに つかい、キャラにも のこす（メニューの「作戦」と おなじ）
import { TACTICS } from '../ai.js?v=e28f090d0ad9';
import { partyOf, companionOf, ensureCompanions } from './party.js?v=e28f090d0ad9';

export function battleTactics(world, s, ctx, msg) {
  const b = ctx.battle;
  const no = (text) => {
    world.send(s, { t: 'menuRes', ok: false, text });
    return { ok: false, reason: text };
  };
  const t = TACTICS[msg.tactics] ? String(msg.tactics) : null;
  const a = b.get(String(msg.actor || ''));
  const who = a && ctx.actorMap[a.id];
  if (!t || !a || a.side !== 'ally' || a.fled || !who || b.over) return no('作戦は変えられない');
  const self = who.type === 'human' && who.sid === s.id;
  const own = who.type === 'support' && who.owner === s.char.id;
  if (!self && !own) return no(`${a.name}の作戦は変えられない`);
  if (self && t === 'manual') return no('自分の作戦に「めいれいさせろ」はない');
  // キャラに のこす（つぎの たたかいからも この さくせん）
  if (self) s.char.tactics = t;
  else {
    const e = companionOf(ensureCompanions(s.char), who.key);
    if (e) e.char.tactics = t;
    if (who.char) who.char.tactics = t;
    who.manual = t === 'manual' || ctx.wagonStandIn === who.key;
  }
  // たたかいの 中の すがたにも すぐ
  a.tactics = t === 'manual' ? 'balanced' : t;
  a.manualTac = t === 'manual';
  if (own) {
    // 自分の 代わりに 出ている 仲間は、さくせんが かわっても 自分が うごかす（world/wagon.js）
    const standIn = ctx.wagonStandIn === who.key;
    if (t === 'manual' && !a.controller) {
      // めいれいさせろ: これからは 自分が コマンドを えらぶ（オートの せっていは 自分と おなじ）
      a.controller = s.id;
      a.auto = !!s.char.battleSettings?.auto;
    } else if (t !== 'manual' && a.controller === s.id && !standIn) {
      // AIに まかせる（コマンドを まっていたら すぐ うごく）
      a.controller = null;
      b.setAuto(a.id, true);
    }
  }
  b.emit({ t: 'tactics', id: a.id, tactics: t, controller: a.controller || null, auto: !!a.auto });
  world.send(s, { t: 'menuRes', ok: true, text: `${a.name}の作戦を「${TACTICS[t].name}」にした。` });
  world.sendSelf(s);
  const p = partyOf(world, s);
  if (p) world.sendParty(p);
  world.markDirty();
  return { ok: true };
}
