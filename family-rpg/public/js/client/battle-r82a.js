// 第82回 A班: 犬夜叉の 系統の 戦いの 画面（shared/battle-r82a.js の しくみを 見せる）
//  ・ようかい化（pub の youkai 1）: 仲間の まどに 赤い「ようかい化」の 札。家族の ほかの 人の 画面にも 出る（pub は みんなに とどく）
//    「めいれいさせろ」の 人には、コマンドの かわりに「ようかい化して、命令が とどかない…」（renderCmdIdle）
//    はじまった 時は バナー「ようかい化！」と まどが 赤く 光る。もどった 時は まどが 白く 光る
//  ・大よう化・せいぎょ（youkai 2）: むらさきの「大よう化」の 札（命令は できる）
//  ・おすわり！（osuwari）: 「おすわり」の 札（次の ダメージが 半分）
//  ・ばくりゅうはの かまえ（stance 'bakuryu'）: 「かまえ」の 札
//  ・ばくりゅうはで 返した（ev.bakuryuRet）: 敵の 行動の あとで バナー「ばくりゅうは！」と うずの えんしゅつ（render/battlefx-r82a.js の r82a_bakuryu）、
//    そのあとで 敵の ダメージの 数（ev.results から ぬいて、えんしゅつに 合わせて 出す）
//  ・受けなかった かまえの 風の 一ふり（ev.bakuryuSwing）: 敵に 小さな 風の えんしゅつ
// client/battle.js の アクションの とちゅう（r82aPresent）・renderCmdIdle（youkaiWaitText）・battle-buffs.js の 札（r82aMarks）から よぶ

const CSS = `
.b-mem .sts .bm.yk { color: #ff8a8a; background: rgba(255, 40, 60, 0.22); }
.b-mem .sts .bm.yc { color: #e0b8ff; background: rgba(160, 80, 255, 0.2); }
.b-mem .sts .bm.os { color: #ffe08a; background: rgba(200, 150, 40, 0.2); }
`;
if (typeof document !== 'undefined' && !document.getElementById('r82a-css')) {
  const s = document.createElement('style');
  s.id = 'r82a-css';
  s.textContent = CSS;
  document.head.append(s);
}

// 仲間の まどの 札（battle-buffs.js の unitMarks）
export function r82aMarks(a) {
  const out = [];
  if (a?.side !== 'ally') return out;
  if (a.youkai === 1) out.push({ text: 'ようかい化', cls: 'yk' });
  else if (a.youkai === 2) out.push({ text: '大よう化', cls: 'yc' });
  if (a.osuwari) out.push({ text: 'おすわり', cls: 'os' });
  if (a.stance === 'bakuryu') out.push({ text: 'かまえ', cls: 'up' });
  return out;
}

// 「めいれいさせろ」の 人の コマンドの ところ（ようかい化の 間）
export function youkaiWaitText(a) {
  return a?.youkai === 1 ? 'ようかい化して、命令がとどかない…（HPが半分より上にもどるか「おすわり！」でもどる）' : '';
}

// アクションの えんしゅつ（client/battle.js の 表示の とちゅう。apply の 前に よぶ）
export function r82aPresent(view, ev, hitDelay = 0) {
  const g = view.game;
  if (ev.youkaiOn) {
    const who = view.c.get(ev.youkaiOn);
    view.glowStatus(ev.youkaiOn, '#ff3a4a');
    if (who?.youkai === 1) {
      view.banner(`${who.name}がようかい化した！`, 'danger');
      g.audio.sfx('warn');
    }
  }
  if (ev.youkaiOff) view.glowStatus(ev.youkaiOff, '#ffffff');
  if (ev.osuwari) {
    view.banner('おすわり！', 'combo');
    view.glowStatus(ev.osuwari, '#ffe08a');
  }
  if (ev.bakuryuSet) view.glowStatus(ev.bakuryuSet, '#7ad8ff');
  const enemyPts = () => [...view.c.values()].filter((c) => c.side === 'enemy' && (c.alive || c.r82keep)).map((c) => view.center(c)).filter(Boolean);
  if (ev.bakuryuSwing) {
    const pts = enemyPts();
    if (pts.length) view.fx.play('r82a_wind', pts, 'wind', { fromAlly: true });
  }
  const rets = ev.bakuryuRet;
  if (!rets?.length) return;
  // 返した ダメージの 数は、うずの えんしゅつが 敵に とどいた ときに 出す
  const ids = new Set(rets.flatMap((r) => r.targets));
  const mine = (ev.results || []).filter((r) => ids.has(r.id) && view.c.get(r.id)?.side === 'enemy' && !(r.heal > 0));
  ev.results = (ev.results || []).filter((r) => !mine.includes(r));
  // たおれた 敵は えんしゅつの あとで 消す（apply が 先に 消さない ように）
  const fell = [];
  for (const id of ids) {
    const c = view.c.get(id);
    if (c && !c.alive && !c.dead) { c.alive = true; c.r82keep = true; fell.push(c); }
  }
  const by = view.c.get(rets[0].by);
  const start = (hitDelay || 0) + 420;
  view.fx.at(start, () => {
    if (view.destroyed) return;
    view.banner('ばくりゅうは！', 'combo');
    const pts = [...ids].map((id) => view.c.get(id)).filter(Boolean).map((c) => view.center(c)).filter(Boolean);
    view.fx.play('r82a_bakuryu', pts, 'wind', { fromAlly: true, from: by ? view.allyPt(by) : undefined });
    g.audio.sfx('wind');
  });
  view.fx.at(start + 820, () => {
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
      delete c.r82keep;
      c.alive = false;
      c.dead = 1;
      g.audio.sfx('defeat');
    }
  });
}
