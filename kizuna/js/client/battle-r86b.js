// 第86回 B班: 幻の職業「天下一の格闘王」「混とんの大軍師」の 戦いの 画面（shared/battle-r86b.js）
//   札（れい丸の 数・水と お湯の すがた・作戦・となえる）は もとの 系統の 札を そのまま 使う（battle-r84a.js・r84b.js・r83a.js・r85a.js）
//   ・r86bPresent … れい丸が もどった 人の まどが 青く 光る・れい丸・しょう天は（竜巻に れい丸の 青い 光）・
//                   みんなでとなえる（全員の まどが 金色に 光る）・太極・ギガ・スレイブ（「太極・ギガ・スレイブ！（MP…）」）
import { CHANT_COLOR } from './battle-r85a.js?v=10ad7ced5cfe';

export const REI_COLOR = '#8ad8ff';

// 行動の えんしゅつ（client/battle.js の 行動の ところから。battle-r84b.js の r84bPresent の あと）
export function r86bPresent(view, ev, hitDelay = 0) {
  for (const id of ev.r86bReiBack || []) view.glowStatus(id, REI_COLOR);
  for (const id of ev.r86bChantAll || []) view.glowStatus(id, CHANT_COLOR);
  if (ev.r86bGiga) view.banner(`太極・ギガ・スレイブ！（MP${ev.r86bGiga.used}）`, 'combo');
  const R = ev.r86bReiHiryu;
  if (R) {
    // 竜巻（r84bPresent。見出しも「れい丸・しょう天は！」）に かさねて、れい丸の 青い 光の 玉
    view.fx.at((hitDelay || 0) + 460, () => {
      if (view.destroyed) return;
      const pts = (R.targets || []).map((id) => view.c.get(id)).filter(Boolean).map((c) => view.center(c)).filter(Boolean);
      if (pts.length) view.fx.play('r86b_reitornado', pts, 'wind', { fromAlly: true, rei: R.shots });
    });
  }
}
