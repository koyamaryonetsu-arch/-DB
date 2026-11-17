// 第88回: 作品を 思い出す 装備の「作品」（docs/plan-r88-anime-gear.md の 12-1）
//   品に work: '作品の id' を 書く。回廊の とびら・ガチャガチャ・そろいの 表示に 使う
//   name … ゲームで 見せる 名前（使える 漢字だけ。習わない 字は かな）
//   あとの 係は ここに 作品を 足す（id は 英小文字）
export const WORKS = {
  yaiba: { name: 'YAIBA' },
  houshin: { name: 'ほう神演義' },
  slayers: { name: 'スレイヤーズ' },
  rekka: { name: '烈火の炎' },
};

export const workName = (id) => WORKS[id]?.name || '';
