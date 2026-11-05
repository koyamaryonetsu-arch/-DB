// 第66回 E2班: 新しい 職業の 戦いの しかけ（data/jobs-r66e2.js・data/abilities-r66e2.js。docs/plan-r66-legend.md）
//
// ・セーブ（ゲームの神。こうか savePoint）: その 人の 側（味方なら 味方 みんな）の 今の HP を おぼえる（b.r66save[side]）。
//   セーブし直すと 新しい ほうに なる
// ・ロード（こうか loadPoint）: セーブした ときに もどる。その ときより HPが へっている 人は、その ときの HPまで もどる。
//   その ときは 生きていて、今 たおれている 人は 生き返る（HPは その ときの HP。ただし 最大HPの loadCap〈ふつう 半分〉まで）。
//   1回 ロードすると セーブは 消える（何回も 生き返らない ように）。セーブが なければ 何も おこらない
// ・楽天ポイント（楽天ゴールド・ブラックカードマン。こうか cardPoint・物理の ptScale）: カードの 技で c.cardPts が たまる（cap まで。
//   戦いが おわると 0。お金は つかわない）。ptScale の ある 物理の 技は、ポイント 1つに つき ptScale ぶん 強く なる
// battle.js から よぶ: r66e2Effect（applyAbility の こうか）・cardPtMult（calcPhys）

// ためられる ポイントの 上限（技に cap が ない とき）
export const CARD_PT_CAP = 10;
// ロードで 生き返る ときの HPの 上限（最大HPの わりあい）
export const LOAD_REVIVE_CAP = 0.5;

const sideOf = (b, c) => b.combatants.filter((x) => x.side === c.side);

// 楽天ポイントの 数
export const cardPtsOf = (c) => Math.max(0, Math.floor(c?.cardPts || 0));
// 物理の ダメージに かける 数（eff.ptScale … ポイント 1つに つき 強く なる ぶん）
export function cardPtMult(c, eff) {
  if (!eff?.ptScale) return 1;
  return 1 + cardPtsOf(c) * eff.ptScale;
}

// 技の こうか（savePoint・loadPoint・cardPoint）。ほかの こうかなら false
export function r66e2Effect(b, c, a, eff, ev) {
  switch (eff.type) {
    case 'savePoint': {
      const hp = {};
      for (const x of sideOf(b, c)) if (x.alive && !x.fled) hp[x.id] = x.hp;
      b.r66save = b.r66save || {};
      b.r66save[c.side] = { by: c.id, hp };
      ev.lines.push(eff.msg || 'ここまでの冒険を、セーブした！');
      return true;
    }
    case 'loadPoint': {
      const save = b.r66save?.[c.side];
      if (!save) {
        ev.lines.push('しかし、セーブしたデータがない！');
        return true;
      }
      delete b.r66save[c.side];
      ev.lines.push(eff.msg || 'セーブしたところから、ロードした！');
      const cap = eff.loadCap ?? LOAD_REVIVE_CAP;
      ev.results = ev.results || [];
      let any = false;
      for (const x of sideOf(b, c)) {
        const was = save.hp[x.id];
        if (!(was > 0) || x.fled) continue;
        if (!x.alive) {
          x.alive = true;
          x.hp = Math.max(1, Math.min(was, Math.round(x.maxHp * cap)));
          x.atb = 0;
          x.status = {};
          ev.lines.push(`なんと${x.name}が生き返った！`);
          ev.results.push({ id: x.id, heal: x.hp });
          ev.upd.push(x);
          any = true;
        } else if (x.hp < was) {
          const d = Math.min(x.maxHp, was) - x.hp;
          x.hp += d;
          ev.lines.push(`${x.name}のHPが、セーブした時までもどった！`);
          ev.results.push({ id: x.id, heal: d });
          ev.upd.push(x);
          any = true;
        }
      }
      if (!any) ev.lines.push('みんな、セーブした時より元気だ！');
      return true;
    }
    case 'cardPoint': {
      const cap = eff.cap || CARD_PT_CAP;
      const was = cardPtsOf(c);
      const now = Math.min(cap, was + (eff.add || 1));
      if (now === was) {
        ev.lines.push(`楽天ポイントは、もういっぱいだ！（${now}ポイント）`);
        return true;
      }
      c.cardPts = now;
      ev.lines.push(`楽天ポイントが${now - was}たまった！（${now}ポイント）`);
      ev.upd.push(c);
      return true;
    }
    default: return false;
  }
}
