// 第5章 Step 9（てっぺんと エンディング）の 人の え（render/chars.js が まぜる）
// ・nocto_star … エンディングと クリアの あとの ノクト（フードを はずした 黒い かみ。マントは 夜空の 青、ふちは 紋章の 金色）
//   ふだんの ノクト（nocto。render/ch5-hoshiyomi-art.js）は こい あい色に 青白い ふち
// ・pipi_fly … 羽が 大きく 開いた ピピ（ふだんの ピピは 小さな 羽 wingSize 'small'。render/ch5-kumoi-art.js）
import { KUMOI_NPC_LOOKS } from './ch5-kumoi-art.js?v=cc4d7c14aec3';

const { wingSize: _small, ...PIPI } = KUMOI_NPC_LOOKS.pipi;
export const TOP_NPC_LOOKS = {
  nocto_star: { hair: '#24223a', hairStyle: 'short', skin: 1, outfit: 'robe', robeMain: '#2e3c78', robeTrim: '#f2d870', small: true, cape: '#3c4c94' },
  pipi_fly: { ...PIPI, wings: '#ffffff' },
};
