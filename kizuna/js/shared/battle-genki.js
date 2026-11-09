// 第72回: 元気玉（家族の ことば「魔力というより、みんなのHPを10%もらって、もらったHPとダメージ倍率の方が原作と比べてしっくりきます」）
//   ・となえた 人の がわの 生きている みんな（自分・家族・酒場の 仲間・魔物の 仲間・ゲストも）から、今の HPの 10%（GENKI.rate。小数は 切りすて）を もらう
//     HPが 2 いじょう ある 人は 1 より 少なく しない。だれも HP 1 より 下に ならない（HPが 1 の 人は 出さない）
//   ・敵 みんなに「もらった HPの 合計 × 倍率（effect.mult）」の 光の ダメージ。魔力・攻撃力は 関係ない
//     転職の ペナルティ・職業レベルの 威力（powMult。ほかの 技と おなじ。スーパーサイヤ人3 は Lv10 で ×1.36）は かける。
//     技の ランク（skill-tier.js）は 補助・回復の 技 だけ なので かけない
//     ふりはば ±5%・相手の 耐性・ぼうぎょ（×0.75）・れんけいは 呪文（calcMagic）と おなじ。ボスの ダメージの きまりも battle.js の damage の まま
//   ・敵が 使う とき（鏡のうつし身・職業の試練の まぼろし）は、1人に 最大HPの GENKI.foeCap まで（ボスの HPは とても 大きいので）
// 倍率（mult 2.4。Lv10 の スーパーサイヤ人3 で 集めたHP×3.3）は tools/sim-genki.mjs で きめた:
//   Lv60〜80 の 4人パーティ・HP満タンで 約890〜1210。幻の職業も 入れた いちばん 強い 全体攻撃の 約1.2〜1.3倍・伝説の 職業の 約1.3〜1.6倍。HP半分なら その 半分
// テスト: test/genki-r72.test.js
// （import なし: skill-power.js からも 使う。まぼろしの 分身〈battle-ch4.js の mirageHit〉は battle.js から もらう）

export const GENKI = { rate: 0.1, foeCap: 0.4 };

// 1人が 出す HP（今の HP から）
export function genkiShare(hp, rate = GENKI.rate) {
  const h = Math.floor(Number(hp) || 0);
  if (h < 2) return 0;
  return Math.min(h - 1, Math.max(1, Math.floor(h * rate)));
}

// みんなの HP（数の ならび）から 集まる HPの 合計
export const genkiTotal = (hps, rate = GENKI.rate) => (hps || []).reduce((s, h) => s + genkiShare(h, rate), 0);

// 集めた HP から 1体への ダメージ（estimate: ふりはば・れんけい なし）
export function genkiDamage(b, c, t, eff, got, powMult = 1, estimate = false) {
  let d = got * (eff.mult || 1) * powMult * (estimate ? 1 : b.rng.float(0.95, 1.05));
  const r = eff.element ? (t.resist?.[eff.element] ?? 1) : 1;
  d *= r;
  if (t.defending) d *= 0.75;
  if (!estimate) d *= b.comboMult(c);
  if (c.side === 'enemy' && t.side === 'ally') d = Math.min(d, (t.maxHp || 1) * GENKI.foeCap);
  return { dmg: Math.max(0, Math.round(d)), resisted: r === 0 };
}

// battle.js の applyAbility（type: 'genki'）
export function genkiAct(b, c, eff, ev, powMult, targets, mirageHit = () => false) {
  const rate = eff.rate ?? GENKI.rate;
  let got = 0;
  const give = [];
  for (const x of b.sideOf(c, true)) {
    if (!x.alive) continue;
    const n = genkiShare(x.hp, rate);
    if (n <= 0) continue;
    x.hp -= n;
    got += n;
    give.push({ id: x.id, hp: n });
    ev.upd.push(x);
  }
  if (!got) {
    ev.lines.push('しかし、元気が集まらなかった…');
    return;
  }
  // 画面: 出した 人の HPの 数を 小さく（client/battle.js の presentBody）
  ev.genki = give;
  ev.lines.push(`みんなから元気が集まった！（HP${got}）`);
  for (const t of targets) {
    if (!t.alive || mirageHit(b, c, t, ev)) continue;
    const res = genkiDamage(b, c, t, eff, got, powMult);
    if (res.resisted || res.dmg <= 0) {
      ev.lines.push(t.side === 'enemy' ? `しかし${t.name}には効かなかった！` : `${t.name}はダメージを受けない！`);
      ev.results = ev.results || [];
      ev.results.push({ id: t.id, miss: true, element: eff.element, aff: b.noteTried(t, eff.element) || undefined });
      continue;
    }
    b.damage(c, t, res.dmg, ev, { element: eff.element });
  }
  b.afterDamage(c, ev, eff.element);
}
