// 第2部 第7章 Step 1・2（A: 世界と物語）の マップを まとめる（maps/ch6.js の attachCh6 の さいごから）
// ・maps/c7-field.js … 千年前の コガネ地方（c7_field）・緑の王国・神殿の 外がわと、今の コガネ地方（south）に たす もの（時の砂時計・手紙を 見つける 所）
// ・maps/c7-temple.js … みどりの水の神殿（千年前 c7_temple_1f〜8f・今 c7_temple_1f_now〜7f_now）
// ・maps/c7-flags.js … フラグ・マップの ID・だいじな 場所
import { attachC7Field, C7_FIELD_MAPS } from './c7-field.js?v=5e5310169c06';
import { buildC7TempleMaps, C7T_MAPS } from './c7-temple.js?v=5e5310169c06';
// 第7章 Step 3・4（第2幕）: 千年前の クモイの 海（c7s_sea）・ナギの村・しずむ前の島の灯台（千年前 c7s_light_1f〜8f・今 c7s_light_1f_now〜7f_now）
import { attachC7sSea, C7S_SEA_MAPS } from './c7s-sea.js?v=5e5310169c06';
import { buildC7sLightMaps, C7SL_MAPS } from './c7s-light.js?v=5e5310169c06';
// 第7章 Step 5・6（第3幕）: 千年前の シロガネ地方（c7i_snow）・白雪の里・氷の竜の城（千年前 c7i_castle_1f〜8f・今 c7i_castle_1f_now〜7f_now）
import { attachC7iSnow, C7I_SNOW_MAPS } from './c7i-snow.js?v=5e5310169c06';
import { buildC7iCastleMaps, C7IC_MAPS } from './c7i-castle.js?v=5e5310169c06';
import { attachC8dSide } from './c8d-side.js?v=5e5310169c06';
import { attachC8bdSide } from './c8bd-side.js?v=5e5310169c06';
import { attachC8cdSide } from './c8cd-side.js?v=5e5310169c06';
import { attachC8rdSide } from './c8rd-side.js?v=5e5310169c06';

// 第7章 Step 1・2 の マップの ID（セーブに のこるので かえない）
export const CH7_MAPS = [...C7_FIELD_MAPS, ...C7T_MAPS];
// 第7章 Step 3・4 の マップの ID
export const CH7S_MAPS = [...C7S_SEA_MAPS, ...C7SL_MAPS];
// 第7章 Step 5・6 の マップの ID
export const CH7I_MAPS = [...C7I_SNOW_MAPS, ...C7IC_MAPS];

export function attachCh7(maps) {
  Object.assign(maps, buildC7TempleMaps());
  attachC7Field(maps);
  // 第2幕（今の クモイ地方を 作った あと）
  Object.assign(maps, buildC7sLightMaps());
  attachC7sSea(maps);
  // 第3幕（今の シロガネ地方を 作った あと）
  Object.assign(maps, buildC7iCastleMaps());
  attachC7iSnow(maps);
  // 第73回 D班: 第8章 第1幕の より道（千年前の 緑の王国に 人を 足す。maps/c8d-side.js）
  attachC8dSide(maps);
  // 第74回 D班: 第8章 第2幕の より道（千年前の クモイの 海の ナギの村と 南の 浜に 人を 足す。maps/c8bd-side.js）
  attachC8bdSide(maps);
  // 第75回 D班: 第8章 第3幕の より道（千年前の ミドリナの ホシフルの里・泉の里に 人を 足す。maps/c8cd-side.js）
  attachC8cdSide(maps);
  // 第80回 D班: 第8章 第4幕の より道（今の ホシフル村に 人を 足す。maps/c8rd-side.js）
  attachC8rdSide(maps);
}
