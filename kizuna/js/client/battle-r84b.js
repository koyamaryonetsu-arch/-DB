// 第84回 B班: らんま1/2 の 系統の 戦いの 画面（shared/battle-r84b.js の 水と お湯の すがた・飛竜しょう天は・かけひき・敵前だい逃亡・心の水）
//   ・formMenu … 「水をかぶる／お湯をかぶる」を えらぶと、すがたの 一覧（今の すがたに「今」）。えらぶと { type: 'ability', id, form } を おくる
//     （YAIBA の 玉がえの メニュー〈battle-r82b.js の tamaMenu〉と おなじ 画面）
//   ・r84bMarks … 仲間の まどの 小さな 札（「水のすがた」「お湯のすがた」・心の水・よけ・かまえ）と 敵の 足もとの 札（おこった「いかり2」）。
//     battle-buffs.js の unitMarks。家族 みんなの 画面に 出る（pub の r84bForm・r84bKokoro・r84bDodge・r84bIkari・stance）
// css/style.css は ほかの 人も かえるので、CSS は ここで 入れる（battle-buffs.js と おなじ やりかた）
import { FORMS, FORM_ORDER, formPct } from '../shared/battle-r84b.js?v=28060a38724e';

const CSS = `
.b-mem .sts .bm.fm { color: var(--fm, #5ab8ff); background: rgba(20, 20, 40, 0.55); font-weight: bold; }
.menu .fm-dot { display: inline-block; width: 0.8em; height: 0.8em; border-radius: 50%; margin-right: 0.35em; vertical-align: -0.05em; border: 1px solid rgba(255,255,255,0.7); }
`;
if (typeof document !== 'undefined' && !document.getElementById('r84b-form-css')) {
  const s = document.createElement('style');
  s.id = 'r84b-form-css';
  s.textContent = CSS;
  document.head.append(s);
}

// 1人ぶんの 札（a … pub）。{ text, cls, color? }
export function r84bMarks(a) {
  const out = [];
  if (!a?.alive) return out;
  const f = FORMS[a.r84bForm];
  if (f) out.push({ text: f.name, cls: 'fm', color: f.color });
  if (a.r84bKokoro) out.push({ text: `心の水${a.r84bKokoro}`, cls: 'up' });
  if (a.r84bDodge) out.push({ text: 'よけ', cls: 'up' });
  if (a.stance === 'hiryu') out.push({ text: 'かまえ', cls: 'up' });
  if (a.r84bIkari) out.push({ text: `いかり${a.r84bIkari}`, cls: 'dn' });
  return out;
}

// すがたの 札の 色（battle-buffs.js の fillStatusRow。玉の 札と おなじ やりかた）
export function paintFormMarks(box, a) {
  const m = r84bMarks(a).find((x) => x.cls === 'fm');
  if (!m) return;
  for (const sp of box.querySelectorAll('.bm.fm')) sp.style.setProperty('--fm', m.color);
}

// 水をかぶる／お湯をかぶる の メニュー（view … client/battle.js の BattleScene、a … 自分の pub、id … 技、back … もどる）
export function formMenu(view, a, id, back) {
  const pct = Math.round(formPct(a) * 100);
  if (!pct) return view.send({ type: 'ability', id });
  const cur = a.r84bForm;
  const items = FORM_ORDER.map((k) => ({
    html: `<span class="fm-dot" style="background:${FORMS[k].color}"></span>${FORMS[k].pour}${k === cur ? '<span class="tag slv">今</span>' : ''}`,
    right: `${pct}%`,
    value: k,
  }));
  const start = Math.max(0, FORM_ORDER.indexOf(cur === 'mizu' ? 'oyu' : 'mizu'));
  view.showMenu(items, (it) => view.send({ type: 'ability', id, form: it.value }), back, 'どちらをかぶる？', (it) => {
    if (!it) return;
    view.info(`${FORMS[it.value].name}：${FORMS[it.value].desc}（${pct}%）。すぐに次の番が来る。`);
  }, start);
}

// 行動の えんしゅつ（client/battle.js の 行動の ところから。hitDelay … 攻撃が 当たる まで）
//   すがたが かわった（札が 光る）・かまえ・攻撃が 来なかった 風の 一ふり・竜巻で やり返した（数は 竜巻が とどいた ときに 出す）
export function r84bPresent(view, ev, hitDelay = 0) {
  const g = view.game;
  if (ev.r84bForm) {
    const f = FORMS[ev.r84bForm.form];
    if (f) view.glowStatus(ev.r84bForm.id, f.color);
  }
  if (ev.r84bHiryuSet) view.glowStatus(ev.r84bHiryuSet, '#8ae8d0');
  const enemyPts = () => [...view.c.values()].filter((c) => c.side === 'enemy' && (c.alive || c.r84keep)).map((c) => view.center(c)).filter(Boolean);
  if (ev.r84bSwing) {
    const pts = enemyPts();
    if (pts.length) view.fx.play('r84b_wind', pts, 'wind', { fromAlly: true });
  }
  const rets = ev.r84bHiryuRet;
  if (!rets?.length) return;
  const ids = new Set(rets.flatMap((r) => r.targets));
  const mine = (ev.results || []).filter((r) => ids.has(r.id) && view.c.get(r.id)?.side === 'enemy' && !(r.heal > 0));
  ev.results = (ev.results || []).filter((r) => !mine.includes(r));
  // たおれた 敵は えんしゅつの あとで 消す（apply が 先に 消さない ように）
  const fell = [];
  for (const id of ids) {
    const c = view.c.get(id);
    if (c && !c.alive && !c.dead) { c.alive = true; c.r84keep = true; fell.push(c); }
  }
  const start = (hitDelay || 0) + 420;
  view.fx.at(start, () => {
    if (view.destroyed) return;
    // 第86回 B班: れい丸・しょう天は（天下一の格闘王）は その 名前（shared/battle-r86b.js が banner を のせる）
    view.banner(rets.find((r) => r.banner)?.banner || '飛竜しょう天は！', 'combo');
    const pts = [...ids].map((id) => view.c.get(id)).filter(Boolean).map((c) => view.center(c)).filter(Boolean);
    view.fx.play('r84b_hiryu', pts, 'wind', { fromAlly: true });
    g.audio.sfx('wind');
  });
  view.fx.at(start + 420, () => {
    if (view.destroyed) return;
    for (const r of mine) {
      const t = view.c.get(r.id);
      if (!t) continue;
      if (r.dmg > 0) {
        t.flash = 320;
        view.floatNum(t, String(r.dmg), r.crit ? 'crit' : '');
        if (r.aff === 'weak') view.floatNum(t, '弱点！', 'weak');
      } else view.floatNum(t, 'ミス', 'miss');
    }
    g.audio.sfx('hit');
    for (const c of fell) {
      delete c.r84keep;
      c.alive = false;
      c.dead = 1;
      g.audio.sfx('defeat');
    }
  });
}
