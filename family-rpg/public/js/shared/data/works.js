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
};

export const workName = (id) => WORKS[id]?.name || '';

// 第88回 G8班: らんま1/2・地獄先生ぬ〜べ〜（ほかの 係の 行と ぶつからない ように、ファイルの さいごで まぜる。ならびは この あと）
//   試練の ごほうび: 早おとめ乱馬 → 赤い中国服（乱馬の 名品）・れい能力教師ぬ〜べ〜 → 白衣観音経（ぬ〜べ〜の 名品）
Object.assign(WORKS, {
  ranma: { name: 'らんま1/2', trialGift: { ranma: 'r88_rm_china' } },
  nube: { name: 'じごく先生ぬ〜べ〜', trialGift: { nube: 'r88_nb_kannon' } },
});
