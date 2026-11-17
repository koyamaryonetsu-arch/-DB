// 第88回 M1班: 天地魔闘の構えの 戦いの 画面（shared/battle-r88m.js）
//   ・r88mMarks … 仲間の まどの 小さな 札（「天地魔闘3」… のこりの 手刀の 回数）。battle-buffs.js の unitMarks。
//     家族 みんなの 画面に 出る（pub の r88mTenchi・r88mLeft）
//   ・r88mPresent … かまえた（バナー）・手刀の 反撃（カラミティエンド。敵の 攻撃が 当たった あとに 手刀の え と 数）・
//     かまえが とけて 火の 鳥（カイザーフェニックス。行動の はじめ）。
//     反撃と 火の 鳥の ダメージの 数（results の r88m）は ふつうの 数から のぞいて、えに 合わせて あとから 出す
//     （client/battle.js の 反撃の構え〈counterFx〉と おなじ 考え）

// 1人ぶんの 札（a … pub）。{ text, cls }
export function r88mMarks(a) {
  if (!a?.alive || !a.r88mTenchi) return [];
  return [{ text: `天地魔闘${a.r88mLeft || 0}`, cls: 'up' }];
}

// results を あとから 出す（t … 的、r … 結果）
function showRes(view, list) {
  const g = view.game;
  for (const r of list) {
    const t = view.c.get(r.id);
    if (!t) continue;
    if (r.dmg > 0) {
      if (t.side === 'enemy') t.flash = 320;
      view.floatNum(t, String(r.dmg), r.crit ? 'crit' : '');
      g.audio.sfx(r.crit ? 'crit' : 'hit');
    } else if (r.miss || r.dmg === 0) {
      view.floatNum(t, 'ミス', 'miss');
      g.audio.sfx('miss');
    }
  }
  for (const c of view.c.values()) if (c.side === 'enemy' && !c.alive && !c.dead) c.dead = 1;
}

// 行動の えんしゅつ（client/battle.js の 行動の ところから。hitDelay … 当たる まで）
export function r88mPresent(view, ev, hitDelay = 0) {
  const g = view.game;
  const mine = (ev.results || []).filter((r) => r.r88m);
  if (mine.length) ev.results = ev.results.filter((r) => !r.r88m);
  if (ev.r88mSet) view.banner('天地魔闘の構え！（次の番まで）', 'combo');
  // かまえが とけて 火の 鳥（行動の はじめ。この 行動の えより 先に とぶ）
  const bd = ev.r88mBird;
  if (bd) {
    const by = view.c.get(bd.by), t = view.c.get(bd.on);
    const pt = t && view.center(t);
    if (pt) view.fx.play('r88m_bird', [pt], 'fire', { fromAlly: true, from: by ? view.allyPt(by) : undefined });
    view.banner('カイザーフェニックス！', 'combo');
    g.audio.sfx('fire');
    const res = mine.filter((r) => r.r88m === 'bird');
    view.fx.at(560, () => { if (!view.destroyed) showRes(view, res); });
  }
  // 手刀の 反撃（敵の 攻撃が 当たった あと）
  const hands = ev.r88mHands || [];
  if (hands.length) {
    const at = Math.max(0, hitDelay) + 380;
    const res = mine.filter((r) => r.r88m === 'hand');
    view.fx.at(at, () => {
      if (view.destroyed) return;
      view.banner('カラミティエンド！', 'combo');
      const pts = hands.map((k) => view.c.get(k.on)).filter(Boolean).map((c) => view.center(c)).filter(Boolean);
      if (pts.length) view.fx.play('r88m_hand', pts, 'phys', { fromAlly: true });
      for (const k of hands) view.glowStatus(k.by, '#ffd060');
      g.audio.sfx('crit');
    });
    view.fx.at(at + 200, () => { if (!view.destroyed) showRes(view, res); });
  }
}
