// 第2部 第7章 Step 1・2（A: 世界と物語）の マップを まとめる（maps/ch6.js の attachCh6 の さいごから）
// ・maps/c7-field.js … 千年前の コガネ地方（c7_field）・緑の王国・神殿の 外がわと、今の コガネ地方（south）に たす もの（時の砂時計・手紙を 見つける 所）
// ・maps/c7-temple.js … みどりの水の神殿（千年前 c7_temple_1f〜8f・今 c7_temple_1f_now〜7f_now）
// ・maps/c7-flags.js … フラグ・マップの ID・だいじな 場所
import { attachC7Field, C7_FIELD_MAPS } from './c7-field.js';
import { buildC7TempleMaps, C7T_MAPS } from './c7-temple.js';

// 第7章 Step 1・2 の マップの ID（セーブに のこるので かえない）
export const CH7_MAPS = [...C7_FIELD_MAPS, ...C7T_MAPS];

export function attachCh7(maps) {
  Object.assign(maps, buildC7TempleMaps());
  attachC7Field(maps);
}
