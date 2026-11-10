// 第2部 第8章「千年の約束」（A: 世界と物語）の マップを まとめる（maps/ch6.js の attachCh6 の さいご。第7章の あと）
// 第1幕「月の王宮のうらぎり」（Step 1・2）:
// ・maps/c8a-palace.js … 月の王宮の地下迷宮（千年前 c8a_palace_1f〜8f・今 c8a_palace_1f_now〜7f_now）
// ・maps/c8a-field.js … 千年前の コガネ地方（c7_field）の 緑の王国と、今の コガネ地方（south）の 王都サファラに たす もの（入口・人・時をこえる手紙）
// ・maps/c8a-flags.js … フラグ・マップの ID・だいじな 場所
import { buildC8aPalaceMaps, C8A_MAPS } from './c8a-palace.js?v=d98770c628cf';
import { attachC8aField } from './c8a-field.js?v=d98770c628cf';

// 第8章 第1幕の マップの ID（セーブに のこるので かえない）
export const CH8A_MAPS = [...C8A_MAPS];

export function attachCh8(maps) {
  // 第1幕（千年前の コガネ地方・今の コガネ地方を 作った あと）
  Object.assign(maps, buildC8aPalaceMaps());
  attachC8aField(maps);
}
