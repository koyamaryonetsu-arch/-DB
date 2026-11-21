// 第85回 B班: 烈火の炎の 系統の 戦いの 画面（shared/battle-r85b.js の 火竜をよぶ・まどかの けっかい・るいの まぼろし・姫を守る忍び）
//   ・ryuMenu … 「火竜をよぶ」を えらぶと、よべる 火竜の 一覧（色の しるし・名前・みじかい やくめ・MP）。
//     えらんだ 火竜に あいてが いれば（敵1体・同じ種類・たおれた 仲間）、つづけて あいてを えらぶ（今 ある pickFoe・pickAlly）。
//     おくる もの: { type: 'ability', id, ryu, target }（YAIBA の 玉がえ〈battle-r82b.js の tamaMenu〉と おなじ 画面）
//     MP が たりない 火竜は えらべない（うすく 出る）。二ひき同時は 技の MP だけ（もう 1ぴきは 運）
//   ・r85bMarks … 仲間の まどの 小さな 札（「けっかい3」・「かげろう3」）。battle-buffs.js の unitMarks。家族 みんなの 画面に 出る（pub の r85bMadoka・r85bRui）
//   ・r85bPresent … 二ひき同時の 2ひきめの えんしゅつ・けっかいと かげろうが かかった 人の まどが 光る
// css/style.css は ほかの 人も かえるので、CSS は ここで 入れる（battle-buffs.js と おなじ やりかた）
import { RYU } from '../shared/data/abilities-r85b.js?v=e423b0b228a9';
import { ABILITIES } from '../shared/data/abilities.js?v=e423b0b228a9';
import { ryuSetOf, ryuMp } from '../shared/battle-r85b.js?v=e423b0b228a9';
import { BW, BH } from './render/battlefx.js?v=e423b0b228a9';

const CSS = `
.menu .ryu-dot { display: inline-block; width: 0.85em; height: 0.85em; border-radius: 50% 50% 50% 0; margin-right: 0.35em; vertical-align: -0.05em; border: 2px solid var(--ryu2, #fff); transform: rotate(-45deg); }
.menu .ryu-tag { font-size: 0.78em; opacity: 0.85; margin-left: 0.4em; white-space: nowrap; }
`;
if (typeof document !== 'undefined' && !document.getElementById('r85b-ryu-css')) {
  const s = document.createElement('style');
  s.id = 'r85b-ryu-css';
  s.textContent = CSS;
  document.head.append(s);
}

// 1人ぶんの 札（a … pub）。{ text, cls }
export function r85bMarks(a) {
  const out = [];
  if (!a?.alive) return out;
  if (a.r85bMadoka) out.push({ text: `けっかい${a.r85bMadoka}`, cls: 'up' });
  if (a.r85bRui) out.push({ text: `かげろう${a.r85bRui}`, cls: 'up' });
  return out;
}

// メニューの 1行（view が なくても 作れる。テストも 使う）
export function ryuItems(a, id) {
  const set = ryuSetOf(id);
  const pc = a?.pc || { job: a?.job, jobs: {} };
  const twin = !!ABILITIES[id]?.effect?.twin;
  return set.map((k) => {
    const r = RYU[k];
    const mp = ryuMp(pc, id, k);
    return {
      html: `<span class="ryu-dot" style="background:${r.color};--ryu2:${r.color2}"></span>${r.name}<span class="ryu-tag">${r.tag}</span>`,
      right: twin ? '' : `MP${mp}`,
      value: k,
      mp,
      disabled: !twin && (a?.mp ?? 0) < mp,
    };
  });
}

// 火竜を えらぶ メニュー（view … client/battle.js の BattleScene、a … 自分の pub、id … 技、back … もどる）
export function ryuMenu(view, a, id, back) {
  const items = ryuItems(a, id);
  if (!items.length) return view.send({ type: 'ability', id });
  const twin = !!ABILITIES[id]?.effect?.twin;
  const again = () => ryuMenu(view, a, id, back);
  const start = Math.max(0, items.findIndex((it) => !it.disabled));
  view.showMenu(items, (it) => pickRyuTarget(view, id, it.value, again), back, twin ? 'どの火竜をよぶ？（もう1ぴきは運しだい）' : 'どの火竜をよぶ？', (it) => {
    if (!it) return;
    const r = RYU[it.value];
    view.info(`${r.name}：${r.short}。${twin ? 'もう1ぴきは、4ひきの中からやってくる。' : `MP${it.mp}${it.disabled ? '（MPが足りない）' : ''}`}`);
  }, start);
}

// 火竜の あいてを えらぶ（いらない 火竜は すぐ おくる）
function pickRyuTarget(view, id, k, back) {
  const r = RYU[k];
  const send = (tid) => view.send({ type: 'ability', id, ryu: k, target: tid });
  if (r.target === 'enemy' || r.target === 'group') return view.pickFoe(r.target, send, `${r.name}：だれをねらう？`, 'fire', back);
  // れっしん: たおれた 仲間が いれば えらぶ（いなければ 仲間全員を 回復）
  if (r.target === 'deadAlly' && view.allies().some((x) => !x.alive)) return view.pickAlly(send, true, `${r.name}：だれを生き返らせる？`, back);
  return send(undefined);
}

// 行動の えんしゅつ（client/battle.js の 行動の ところから。hitDelay … 1ぴきめが 当たる まで）
export function r85bPresent(view, ev, hitDelay = 0) {
  for (const u of ev.upd || []) {
    if (u?.r85bMadoka && ev.r85bRyu?.includes('madoka')) view.glowStatus(u.id, RYU.madoka.color);
    if (u?.r85bRui && ev.r85bRyu?.includes('rui')) view.glowStatus(u.id, RYU.rui.color);
  }
  // よんだ 人の 右うでに 炎（二ひき同時は 2ひきの 竜が より合わさる 看板の えんしゅつ）
  if (ev.r85bRyu?.length) {
    const twin = !!ABILITIES[ev.ability]?.effect?.twin;
    view.fx.play(twin ? 'enjutsushi_sig' : 'r85b_call', [{ x: BW / 2, y: BH * 0.62 }], 'fire', { fromAlly: true });
  }
  const fx2 = ev.r85bTwin;
  if (!fx2?.anim) return;
  const ids = fx2.targets || [];
  const foes = ids.map((id) => view.c.get(id)).filter((c) => c && c.side === 'enemy');
  view.fx.at(Math.max(260, (hitDelay || 0) - 120), () => {
    if (view.destroyed) return;
    const pts = foes.map((c) => view.center(c)).filter(Boolean);
    view.fx.play(fx2.anim, pts.length ? pts : [{ x: BW / 2, y: BH * 0.62 }], 'fire', { fromAlly: true });
    view.banner(`${RYU[ev.r85bRyu?.[1]]?.name || '火竜'}もやってきた！`, 'combo');
    view.game.audio.sfx('fire');
  });
}
