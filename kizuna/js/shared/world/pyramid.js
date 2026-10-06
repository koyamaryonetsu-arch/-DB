// 王家のピラミッドの きまり（第4章 Step 4）
// ・のろいの宝「王家の黄金の剣」を とると、のろい（char.pyrCurse）。ピラミッドの 中の 魔物が ふえて、遠くから おいかけて くる
// ・ピラミッドの 外（ピラミッドで ない マップ）に 出ると のろいは とける（world.js の placeSession から notePyramidMove）
// ・みちびきの糸・帰り道の羽が 使えない マップ（map.noEscape）・呪文が ふうじられた マップ（map.noSpells）も ここで しらべる
import { MAPS } from '../maps/index.js?v=895729e9b2d0';

// のろいの ときの 魔物の 数（ばい）・あらわれる はやさ（ミリびょう。ふつうは 700）・おいかけて くる きょり（マス。ふつうは 4.5）
export const CURSE_SPAWN = 2;
export const CURSE_SPAWN_MS = 350;
export const CURSE_CHASE = 7;

export const isPyramidMap = (id) => !!MAPS[id]?.pyramid;
export const noEscapeMap = (id) => !!MAPS[id]?.noEscape;
export const noSpellsMap = (id) => !!MAPS[id]?.noSpells;

// その マップの だれかが のろわれているか（ピラミッドの 中だけ）
export function cursedOn(mapId, players) {
  return isPyramidMap(mapId) && players.some((p) => p.char?.pyrCurse);
}

// world.placeSession から: ピラミッドの 外へ 出たら のろいが とける
export function notePyramidMove(world, s, toMap) {
  if (!s?.char?.pyrCurse || isPyramidMap(toMap)) return;
  delete s.char.pyrCurse;
  world.send?.(s, { t: 'toast', text: '外の光をあびると、黒いもやが消えていった…。\n（のろいがとけた！）' });
}
