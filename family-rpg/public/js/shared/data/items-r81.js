// 第81回: 全滅した 時に へる お金が 少なく なる アクセサリー（docs/plan-r81-gold-guard.md。items.js で まぜる）
//   家族の お願い「ボスに負けてもお金が減る量が少なくなるアクセサリーをつくって」
//
// ・ふだんの 全滅: 持っている お金が 半分に（world/bank.js の wipeGoldLoss。預かり所の お金は へらない）
// ・wipeDiv … 全滅で へる お金が「持っている お金 ÷ wipeDiv」（はしたは へる 方へ 切り上げ。ふだんは 2 ＝ 半分）
//     へそくりのさいふ 4（4分の1）・金庫番のお守り 10（10分の1）
// ・効くのは つけている その キャラ 自身の お金だけ。ボスでも ふつうの 戦いでも 効く（world/perks.js の wipeDivOf・world/battles.js）
//   もともと へらない 戦い（ひみつのダンジョン・闘技場・負けても よい 戦い）は そのまま
// ・強さは 上がらない（強い アクセサリーの かわりに つける。えらぶ 楽しみ）
// ・perk … メニュー・店の せつめいの「★」の 文（data/items-r31.js の PERK_TEXT に まぜる）。
//   perk が ある 品は みんなさいきょう装備で はずさない・分解できない（今の きまりの まま）
// ・見た目装備（look-equip.js）は アクセサリーを かえないので、本当に つけて いる 時だけ 効く
import { PERK_TEXT } from './items-r31.js';

export const PURSE_ID = 'r81_purse';
export const VAULT_ID = 'r81_vault';
// ふだんの 全滅で へる 分（÷2 ＝ 半分）
export const WIPE_DIV = 2;

export const ITEMS_R81 = {
  [PURSE_ID]: {
    name: 'へそくりのさいふ', type: 'acc', rank: 1, price: 150, perk: 'wipeQuarter', wipeDiv: 4, wipeWord: 'さいふ',
    desc: 'へそくりを、こっそりしまっておく小さなさいふ。つけていると、全滅した時にへるお金が、半分から4分の1になる。強さは上がらない。',
  },
  [VAULT_ID]: {
    name: '金庫番のお守り', type: 'acc', rank: 10, price: 15000, perk: 'wipeTenth', wipeDiv: 10, wipeWord: 'お守り',
    desc: 'お金を守る、金庫番の小さなお守り。つけていると、全滅した時にへるお金が、半分から10分の1になる。強さは上がらない。',
  },
};

export const R81_ITEM_KANA = { [PURSE_ID]: 'へそくりのさいふ', [VAULT_ID]: 'きんこばんのおまもり' };

Object.assign(PERK_TEXT, {
  wipeQuarter: '全滅した時にへるお金が、半分から4分の1になる',
  wipeTenth: '全滅した時にへるお金が、半分から10分の1になる',
});

// へる 分の 言いかた（4 → '4分の1'）
export const wipeShare = (div) => (div === WIPE_DIV ? '半分' : `${div}分の1`);

// 店に 置く 所（物語に 関係なく いつも ならぶ。more の show は から）
//   さいふ … ホシフル村のよろず屋（序章。アクセサリーの ネコのすずを 売る 店）・ルミナの道具屋（第1章の 町）
//   お守り … 第2部の 千年前の 町の 道具屋 4つ（里・緑の王国・ナギの村・白雪の里）
export const R81_SHOP_ADD = {
  village: [PURSE_ID],
  item: [PURSE_ID],
  past_item: [VAULT_ID],
  c7_item: [VAULT_ID],
  c7s_item: [VAULT_ID],
  c7i_item: [VAULT_ID],
};
// 店の 品ぞろえに 足す（items は ほかの 店と 同じ ならびを 使って いるので かえない。more に 足す）。何回 よんでも 1回だけ
export function addR81Shops(shops) {
  for (const [id, list] of Object.entries(R81_SHOP_ADD)) {
    const shop = shops?.[id];
    if (!shop || (shop.more || []).some((m) => m.r81)) continue;
    shop.more = [...(shop.more || []), { show: {}, items: [...list], r81: true }];
  }
}
