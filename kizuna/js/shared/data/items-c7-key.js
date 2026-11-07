// 第7章 Step 1・2（A: 世界と物語）の 大事な物（items-ch6-key.js で まぜる。data/items.js は かえない）
// ・c7_miko_letter … みこの手紙（神殿 4階の みこサラサが 書いてくれる。5階の 千年前の 番人の 石の 箱に 入れると なくなる。時をこえる手紙）
// 第7章 Step 3・4（第2幕）:
// ・c7s_keeper_letter … 灯台守の手紙（灯台 4階の 灯台守ゲンじいが 書いてくれる。5階の 千年前の 戸だなに 入れると なくなる。時をこえる手紙）
// ふつうの 道具・装備・宝箱の 中み・手紙の ごほうびは B（data/items-c7.js・items-c7s.js）
import { MIKO_LETTER } from '../maps/c7-flags.js?v=1804b2cae177';
import { KEEPER_LETTER } from '../maps/c7s-flags.js?v=1804b2cae177';

export const C7_KEY_ITEMS = {
  [MIKO_LETTER]: {
    name: 'みこの手紙', type: 'key',
    desc: '神殿のみこサラサが書いた手紙。「未来から来た子らを、通してあげて」。5階の番人の石像がかかえる石の箱に入れると、千年先までとどくという。',
  },
  [KEEPER_LETTER]: {
    name: '灯台守の手紙', type: 'key',
    desc: '灯台守のゲンじいが書いた手紙。からくりのとびらの合言葉が書いてある。5階のとびらのよこの戸だなに入れると、千年先までのこるという。',
  },
};
export const C7_KEY_KANA = {
  [MIKO_LETTER]: 'みこのてがみ',
  [KEEPER_LETTER]: 'とうだいもりのてがみ',
};
