// 第88回: 作品を 思い出す 装備の「作品」（docs/plan-r88-anime-gear.md の 12-1）
//   品に work: '作品の id' を 書く。回廊の とびら・ガチャガチャ・そろいの 表示に 使う
//   name … ゲームで 見せる 名前（使える 漢字だけ。習わない 字は かな）
//   あとの 係は ここに 作品を 足す（id は 英小文字）
export const WORKS = {
  yaiba: { name: 'YAIBA' },
  // trialGift … { 職業の id: 品の id }。その 職業の 一の試練を こえると もらえる（G4班の しくみ。data/gacha-r88.js の trialGiftOf）
  //   G5班: 太公望 → 太公望の打神べん・リナ → 黒いマントと大ガメのかたあて。烈火の炎は 烈火 本人の 品が ないので 入れない
  houshin: { name: 'ほう神演義', trialGift: { taikobo: 'r88_dashin' } },
  slayers: { name: 'スレイヤーズ', trialGift: { lina: 'r88_lina_mantle' } },
  rekka: { name: '烈火の炎' },
  // G7班: 犬夜しゃ → 火ねずみの衣・ゆう助 → れいげきリング（主人公の 名品）
  inuyasha: { name: '犬夜しゃ', trialGift: { inuyasha: 'r88_iy_hinezumi' } },
  yuhaku: { name: 'ゆう☆遊☆白書', trialGift: { yusuke: 'r88_yh_ring' } },
};

export const workName = (id) => WORKS[id]?.name || '';
