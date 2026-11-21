// 第88回 G16班: ポケモンの 品の 戦いの しくみ（docs/plan-r88-anime-gear.md の 4-5。データは data/items-r88-pokemon.js）
//   どれも アクセ（味方の acc）。battle.js の 行動の おわり（gearRegen の あと）に r88pkActEnd を よぶ
//   ・オボンのみ（品の pkBerry）… HPが 半分を 切ると、行動の おわりに 自分で 食べて 最大HPの pkBerry 回復（1つの 戦いで 1回。だれの 行動の あとでも）
//   ・いのちのたま（品の pkRecoil）… つけた 人が 敵に ダメージを あたえた 行動の おわりに、最大HPの pkRecoil へる（HPは 1より 下がらない）
//   どれも 戦いの 中だけ（セーブしない）
import { ITEMS, baseItemId } from './data/items.js?v=52527b10ae8b';

const accOf = (a) => (a?.side === 'ally' ? ITEMS[baseItemId(a.acc)] : null);
const touch = (ev, a) => { if (!ev.upd.includes(a)) ev.upd.push(a); };

export function r88pkActEnd(b, c, ev) {
  // いのちのたま
  const me = accOf(c);
  if (me?.pkRecoil && c.alive && c.hp > 1) {
    const enemies = new Set(b.combatants.filter((x) => x.side !== 'ally').map((x) => x.id));
    if ((ev.results || []).some((r) => r.dmg > 0 && enemies.has(r.id))) {
      const d = Math.min(c.hp - 1, Math.max(1, Math.round(c.maxHp * me.pkRecoil)));
      c.hp -= d;
      ev.lines.push(`${c.name}は、${me.name}の力で、少しHPをけずられた…（HP-${d}）`);
      touch(ev, c);
    }
  }
  // オボンのみ
  for (const a of b.combatants) {
    const it = accOf(a);
    if (!it?.pkBerry || a.pkBerryUsed || !a.alive || a.hp <= 0 || a.hp * 2 >= a.maxHp) continue;
    a.pkBerryUsed = true;
    const n = Math.min(a.maxHp - a.hp, Math.max(1, Math.round(a.maxHp * it.pkBerry)));
    a.hp += n;
    ev.lines.push(`${a.name}は、${it.name}を食べた！`, `${a.name}のHPが${n}回復した！`);
    touch(ev, a);
  }
}
