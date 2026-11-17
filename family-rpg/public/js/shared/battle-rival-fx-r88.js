// 第88回 G3班: まぼろしの回廊の ライバルの 大技の こうか（battle.js の applyAbility が よぶ。ほかの ファイルを import しない）
//   eff: { type: 'r88Rival', hit, guard, element? }
//   その 人の 最大HP × hit（身を 守って いれば × guard）の ダメージ。前ぶれを 見て 身を 守れば たえられる 大技。
//   まぼろしの 与える ダメージの 倍率（dmgRate）は かけない（battle.js の damage が かけるので、ここで わって おく）
export function rivalSigEffect(b, c, a, eff, ev, targets) {
  for (const t of targets) {
    if (!t.alive) continue;
    const k = t.defending ? (eff.guard ?? 0.45) : (eff.hit ?? 1.15);
    const res = eff.element ? (t.resist?.[eff.element] ?? 1) : 1;
    let dmg = t.maxHp * k * res * b.rng.float(0.94, 1.06);
    if (c?.dmgRate > 0) dmg /= c.dmgRate;
    b.damage(c, t, Math.max(1, Math.round(dmg)), ev, { element: eff.element || 'phys' });
  }
  b.afterDamage(c, ev, eff.element || 'phys');
}
