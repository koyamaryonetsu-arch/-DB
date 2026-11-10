// 第7章 Step 1・2（A: 世界と物語）の 大事な物（items-ch6-key.js で まぜる。data/items.js は かえない）
// ・c7_miko_letter … みこの手紙（神殿 4階の みこサラサが 書いてくれる。5階の 千年前の 番人の 石の 箱に 入れると なくなる。時をこえる手紙）
// 第7章 Step 3・4（第2幕）:
// ・c7s_keeper_letter … 灯台守の手紙（灯台 4階の 灯台守ゲンじいが 書いてくれる。5階の 千年前の 戸だなに 入れると なくなる。時をこえる手紙）
// 第7章 Step 5・6（第3幕）:
// ・c7i_spirit_letter … 雪の精の手紙（城 4階の 雪の精が 書いてくれる。5階の 千年前の 氷の 箱に 入れると なくなる。時をこえる手紙）
// ふつうの 道具・装備・宝箱の 中み・手紙の ごほうびは B（data/items-c7.js・items-c7s.js・items-c7i.js）
import { MIKO_LETTER } from '../maps/c7-flags.js?v=b421f4c1530b';
import { KEEPER_LETTER } from '../maps/c7s-flags.js?v=b421f4c1530b';
import { SPIRIT_LETTER } from '../maps/c7i-flags.js?v=b421f4c1530b';
// 第8章 第1幕: 王女ナディアの手紙（地下迷宮 4階の 王女ナディアが 書いてくれる。5階の 千年前の 月の 箱に 入れると なくなる。時をこえる手紙）
import { NADIA_LETTER } from '../maps/c8a-flags.js?v=b421f4c1530b';

export const C7_KEY_ITEMS = {
  [MIKO_LETTER]: {
    name: 'みこの手紙', type: 'key',
    desc: '神殿のみこサラサが書いた手紙。「未来から来た子らを、通してあげて」。5階の番人の石像がかかえる石の箱に入れると、千年先までとどくという。',
  },
  [KEEPER_LETTER]: {
    name: '灯台守の手紙', type: 'key',
    desc: '灯台守のゲンじいが書いた手紙。からくりのとびらの合言葉が書いてある。5階のとびらのよこの戸だなに入れると、千年先までのこるという。',
  },
  [SPIRIT_LETTER]: {
    name: '雪の精の手紙', type: 'key',
    desc: '氷の竜の城の雪の精が書いた手紙。竜のほんとうの名前が書いてある。5階の竜のとびらのよこの氷の箱に入れると、千年先までとどくという。',
  },
  [NADIA_LETTER]: {
    name: '王女ナディアの手紙', type: 'key',
    desc: '王女ナディアが書いた手紙。王家の「月の子守歌」の最後の一行が書いてある。地下迷宮の5階の月の門のよこの、月の箱に入れると、千年先までのこるという。',
  },
};
export const C7_KEY_KANA = {
  [MIKO_LETTER]: 'みこのてがみ',
  [KEEPER_LETTER]: 'とうだいもりのてがみ',
  [SPIRIT_LETTER]: 'ゆきのせいのてがみ',
  [NADIA_LETTER]: 'おうじょナディアのてがみ',
};
