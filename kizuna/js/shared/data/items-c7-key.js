// 第7章 Step 1・2（A: 世界と物語）の 大事な物（items-ch6-key.js で まぜる。data/items.js は かえない）
// ・c7_miko_letter … みこの手紙（神殿 4階の みこサラサが 書いてくれる。5階の 千年前の 番人の 石の 箱に 入れると なくなる。時をこえる手紙）
// ふつうの 道具・装備・宝箱の 中み・手紙の ごほうびは B（data/items-c7.js）
import { MIKO_LETTER } from '../maps/c7-flags.js?v=7040d8c7ec18';

export const C7_KEY_ITEMS = {
  [MIKO_LETTER]: {
    name: 'みこの手紙', type: 'key',
    desc: '神殿のみこサラサが書いた手紙。「未来から来た子らを、通してあげて」。5階の番人の石像がかかえる石の箱に入れると、千年先までとどくという。',
  },
};
export const C7_KEY_KANA = {
  [MIKO_LETTER]: 'みこのてがみ',
};
