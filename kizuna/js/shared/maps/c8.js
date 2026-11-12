// 第2部 第8章「千年の約束」（A: 世界と物語）の マップを まとめる（maps/ch6.js の attachCh6 の さいご。第7章の あと）
// 第1幕「月の王宮のうらぎり」（Step 1・2）:
// ・maps/c8a-palace.js … 月の王宮の地下迷宮（千年前 c8a_palace_1f〜8f・今 c8a_palace_1f_now〜7f_now）
// ・maps/c8a-field.js … 千年前の コガネ地方（c7_field）の 緑の王国と、今の コガネ地方（south）の 王都サファラに たす もの（入口・人・時をこえる手紙）
// ・maps/c8a-flags.js … フラグ・マップの ID・だいじな 場所
// 第2幕「よみの青い火」（Step 3・4）:
// ・maps/c8b-temple.js … よみの海底神殿（千年前 c8b_temple_1f〜8f・今 c8b_temple_1f_now〜7f_now）
// ・maps/c8b-sea.js … 千年前の クモイの 海（c7s_sea）の うずしおの岩場と、今の クモイ地方（kumoi）の 雲から出てきた島に たす もの（入口・人・時をこえる手紙）
// ・maps/c8b-flags.js … フラグ・マップの ID・だいじな 場所
// 第3幕「くろがねの空中要塞」（Step 5・6）:
// ・maps/c8c-fort.js … くろがねの空中要塞（千年前 c8c_fort_1f〜8f・今 c8c_fort_1f_now〜7f_now）
// ・maps/c8c-field.js … 千年前の ミドリナ地方（overworld_past）の 森の いかりと、今の ミドリナ地方（overworld）の 森の 残がいに たす もの（入口・人・時をこえる手紙）
// ・maps/c8c-flags.js … フラグ・マップの ID・だいじな 場所
import { buildC8aPalaceMaps, C8A_MAPS } from './c8a-palace.js?v=433f1b51a50d';
import { attachC8aField } from './c8a-field.js?v=433f1b51a50d';
import { buildC8bTempleMaps, C8B_MAPS } from './c8b-temple.js?v=433f1b51a50d';
import { attachC8bSea } from './c8b-sea.js?v=433f1b51a50d';
import { buildC8cFortMaps, C8C_MAPS } from './c8c-fort.js?v=433f1b51a50d';
import { attachC8cField } from './c8c-field.js?v=433f1b51a50d';

// 第8章 第1幕の マップの ID（セーブに のこるので かえない）
export const CH8A_MAPS = [...C8A_MAPS];
// 第8章 第2幕の マップの ID（セーブに のこるので かえない）
export const CH8B_MAPS = [...C8B_MAPS];
// 第8章 第3幕の マップの ID（セーブに のこるので かえない）
export const CH8C_MAPS = [...C8C_MAPS];

export function attachCh8(maps) {
  // 第1幕（千年前の コガネ地方・今の コガネ地方を 作った あと）
  Object.assign(maps, buildC8aPalaceMaps());
  attachC8aField(maps);
  // 第2幕（千年前の クモイの 海・今の クモイ地方を 作った あと）
  Object.assign(maps, buildC8bTempleMaps());
  attachC8bSea(maps);
  // 第3幕（千年前の ミドリナ地方・今の ミドリナ地方を 作った あと）
  Object.assign(maps, buildC8cFortMaps());
  attachC8cField(maps);
}
