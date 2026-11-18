// 第88回 G19班: SPY×FAMILY の 変装のマスク（docs/plan-r88-anime-gear.md の 4-11）
//   使うと 変装して、次に 受ける 1回の 攻撃（物理。ふつうの 攻撃・物理の 技）を かならず かわす
//   技の r88Dodge（回数）→ 使った 人に c.r88Dodge。戦いの 中だけ（セーブしない）。ライバルの 大技（最大HPの わりあい）は 物理では ないので かわせない
//   よぶ 所: battle-gearfx.js の gearUse（使った あと 1行）・battle.js の calcPhys（当たりを きめる 前 1行）

// 使った あと: 変装する
export function r88g19AfterUse(b, c, a, ev) {
  if (!a?.r88Dodge || !c?.alive) return;
  c.r88Dodge = a.r88Dodge;
  ev.lines.push(`（${c.name}は、次に受ける攻撃を1回かわす）`);
}

// 物理の 当たりを きめる 前: 変装して いる 人は 1回 かならず かわす（かわしたら true。みつもりでは へらさない）
export function r88DodgeTake(c, t, estimate = false) {
  if (estimate || !t?.r88Dodge || !c || c.side === t.side) return false;
  t.r88Dodge -= 1;
  if (t.r88Dodge <= 0) delete t.r88Dodge;
  return true;
}
