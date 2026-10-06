// 美容室（かみがた・かみの色・目もと・はだの色を 変える）
// ・変えて よいのは style・hcol・face・tone だけ（体の 形・服の 色・職業は そのまま）
// ・代金は 1回 SALON_FEE ゴールド。何も 変えない ときは いらない
import { SALON_FEE, salonLook } from '../data/looks.js?v=882bfcc52306';
import { partyOf } from './party.js?v=882bfcc52306';

// 店に 入った とき（ui に わたす）
export function salonInfo(world, s) {
  s.openSalon = true;
  return { fee: SALON_FEE, keeper: '美容師のアンナ', look: s.char?.look || null };
}

// 変える（reply(ok, text, extra)）
export function salonAction(world, s, msg, reply) {
  const c = s.char;
  if (!c || c.species) return reply(false, '');
  if (!s.openSalon) return reply(false, '');
  const req = msg.look && typeof msg.look === 'object' ? msg.look : {};
  const r = salonLook(c.look, { style: req.style, hcol: req.hcol, face: req.face, tone: req.tone });
  if (!r.ok) return reply(false, r.reason);
  if (!r.changed) return reply(false, '今と同じ見た目ですね。', { look: c.look });
  if ((c.gold || 0) < SALON_FEE) return reply(false, 'おや？ゴールドが足りないようですね。', { look: c.look });
  c.gold -= SALON_FEE;
  c.look = r.look;
  // 家族の サポート仲間として 連れていかれている うつしも 新しい すがたに
  for (const p of world.parties?.values?.() || []) {
    let changed = false;
    for (const x of p.supports || []) {
      if (x.kind === 'family' && x.char && (x.char.id === c.id || x.char.ownerId === c.id)) { x.char.look = { ...c.look }; changed = true; }
    }
    if (changed) world.sendParty(p);
  }
  // まわりの 人には いつもの いち（snap）で 新しい すがたが とどく
  const p = partyOf(world, s);
  if (p) world.sendParty(p);
  return reply(true, 'はい、できあがり！\nよくお似合いですよ。', { look: c.look, fee: SALON_FEE });
}
