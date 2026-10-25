// 第6章 Step 1・2（A: 世界と物語）の 大事な物（data/items.js で まぜる。plan-ch6.md の 9 の 名前の 約束）
// ・toki_glass … 時の砂時計（時のほこらの いちばん 下で トキネに もらう。メニューの「道具」から 使う。world/time-glass.js）
// ・star_seedling … 星の木のなえ（千年前の ホシフルの里の ホシヨに もらう）
// ・star_dew … 星のしずく（千年前の 鏡の湖の ほとりで 手に 入れる）
// ふつうの 道具・装備は B（data/items-past.js）
// 第6章 Step 3・4（A）の 大事な物・より道の ごほうびは items-ch6-side.js（ここで まぜる。data/items.js は かえない）
import { CH6_SIDE_ITEMS, CH6_SIDE_KANA } from './items-ch6-side.js?v=2551bc2b5aab';
// 第6章 Step 5（A）の 大事な物・より道の ごほうびは items-ch6c.js（ここで まぜる）
import { CH6C_ITEMS, CH6C_KANA } from './items-ch6c.js?v=2551bc2b5aab';
export const CH6_KEY_ITEMS = {
  toki_glass: {
    name: '時の砂時計', type: 'key', hourglass: true,
    desc: '光の砂が流れる、ふしぎな砂時計。時の精トキネがやどっている。「時の組」がある場所で使うと、いる場所のまま、千年前と今を行き来できる。町や家の中では使えない。',
  },
  star_seedling: {
    name: '星の木のなえ', type: 'key',
    desc: '千年前のホシフルの里のホシヨにもらった、小さななえ。星のしずくをあげて、ほしみの丘のふもとに植えると、大きく育つという。',
  },
  star_dew: {
    name: '星のしずく', type: 'key',
    desc: '千年前の鏡の湖のほとりで見つけた、星の光をすったしずく。星の木のなえを育てる力がある。',
  },
};
export const CH6_KEY_KANA = {
  toki_glass: 'ときのすなどけい',
  star_seedling: 'ほしのきのなえ',
  star_dew: 'ほしのしずく',
};
// 第6章 Step 3・4（items-ch6-side.js）
Object.assign(CH6_KEY_ITEMS, CH6_SIDE_ITEMS);
Object.assign(CH6_KEY_KANA, CH6_SIDE_KANA);
// 第6章 Step 5（items-ch6c.js）
Object.assign(CH6_KEY_ITEMS, CH6C_ITEMS);
Object.assign(CH6_KEY_KANA, CH6C_KANA);
