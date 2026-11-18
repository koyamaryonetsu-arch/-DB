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

// 第88回 G8班: らんま1/2・地獄先生ぬ〜べ〜（ほかの 係の 行と ぶつからない ように、ファイルの さいごで まぜる。ならびは この あと）
//   試練の ごほうび: 早おとめ乱馬 → 赤い中国服（乱馬の 名品）・れい能力教師ぬ〜べ〜 → 白衣観音経（ぬ〜べ〜の 名品）
Object.assign(WORKS, {
  ranma: { name: 'らんま1/2', trialGift: { ranma: 'r88_rm_china' } },
  nube: { name: 'じごく先生ぬ〜べ〜', trialGift: { nube: 'r88_nb_kannon' } },
});

// 第88回 G10班: ナルト・きめつのやいば（ファイルの さいごで まぜる）
//   試練の ごほうび: 木の葉の忍び → 初代火影の首かざり（ナルトの 名品）・炎柱 → 日の耳かざり（主人公の 名品）
Object.assign(WORKS, {
  naruto: { name: 'ナルト', trialGift: { konoha: 'r88_nr_kubikazari' } },
  kimetsu: { name: 'きめつのやいば', trialGift: { enbashira: 'r88_km_mimikazari' } },
});

// 第88回 G9班: ドラゴンボール・ワンピース（ファイルの さいごで まぜる）
//   試練の ごほうび: スーパーサイヤ人3 → せん豆のふくろ（悟空が 食べて 力を とりもどす 名品）・ゴム人間 → エースのぼうし（兄の 名品）
//   どちらの 主人公も 表に 自分の 名品が ないので、いちばん 近い 名品に した（設計書の「実装メモ（G9班）」）
Object.assign(WORKS, {
  dragonball: { name: 'ドラゴンボール', trialGift: { ss3: 'r88_db_senzu' } },
  onepiece: { name: 'ワンピース', trialGift: { rubber: 'r88_op_ace' } },
});

// 第88回 G11班: るろうに剣心・名探ていコナン・まじっく快と（ファイルの さいごで まぜる）
//   試練の ごほうび: ひ村ばっ刀さい → 赤い着物（剣心の 品）・名探てい → うで時計型ますいじゅう・かいとうキッド → モノクル
//   コナンと 快とは まぼろしの回ろうの とびらを 1まいに まとめた（data/rivals-r88.js の g11Doors。品は 作品ごと）
Object.assign(WORKS, {
  kenshin: { name: 'るろうに剣心', trialGift: { himura: 'r88_ks_kimono' } },
  conan: { name: '名探ていコナン', trialGift: { meitantei: 'r88_cn_masui' } },
  kaito: { name: 'まじっく快と', trialGift: { kaito_kid: 'r88_kt_monocle' } },
});

// 第88回 G12班: ドラえもん・セーラームーン（ファイルの さいごで まぜる）
//   試練の ごほうび: ドラえもん → ひらりマント（ドラえもんの 名品の たて）・セーラームーン → うさぎのムーンスティック（5だんに 生まれ変わる はじめの スティック）
Object.assign(WORKS, {
  doraemon: { name: 'ドラえもん', trialGift: { doraemon: 'r88_dr_hirari' } },
  sailormoon: { name: 'セーラームーン', trialGift: { sailor_moon: 'r88_sm_stick1' } },
});

// 第88回 G14班: 鋼のれん金術師・アナと雪の女王（ファイルの さいごで まぜる）
//   試練の ごほうび: はがねのれん金術師 → 赤いコート（主人公の 名品）・雪の女王 → 氷のドレス（主人公の 名品）
//   アナと雪の女王の 伝説「第5のせいれいのドレス」は、4つの せいれいの しるしを 持って 氷の石の台へ（world/frozen-r88.js）
Object.assign(WORKS, {
  hagaren: { name: '鋼のれん金術師', trialGift: { fullmetal: 'r88_hg_coat' } },
  frozen: { name: 'アナと雪の女王', trialGift: { snow_queen: 'r88_fz_icedress' } },
});

// 第88回 G15班: ダイの大冒険・ドラゴンクエスト（ファイルの さいごで まぜる）
//   試練の ごほうび: 竜の騎士（ダイの 職業）→ アバンのしるし・青・魔王 → 大魔王の白い衣・ロトの勇者 → ロトの聖なる守り（ロトのしるし。技の 名前と かぶるので かえた）
//   ダイの大冒険は まぼろしの回ろうの とびらが 2まい（「ダイの大冒険」と「大魔王の城」。data/rivals-r88.js の g15Doors）。作品は 1つ（ガチャも 1つ）
Object.assign(WORKS, {
  dai: { name: 'ダイの大冒険', trialGift: { dragon_knight: 'r88_da_mark_blue', maou: 'r88_da_white' } },
  dq: { name: 'ドラゴンクエスト', trialGift: { loto_hero: 'r88_dq_roto_mark' } },
});

// 第88回 G13班: ハリー・ポッター・マリオ（ファイルの さいごで まぜる）
//   試練の ごほうび: ハリーポッター → ひいらぎのつえ（主人公の 名品）・マリオ → マリオのぼうし（主人公の 品。表では ふつう）
Object.assign(WORKS, {
  harrypotter: { name: 'ハリー・ポッター', trialGift: { harry: 'r88_hp_holly' } },
  mario: { name: 'マリオ', trialGift: { mario: 'r88_mr_cap' } },
});

// 第88回 G16班: ポケモン（ファイルの さいごで まぜる）
//   試練の ごほうび: ポケモンマスター → サトシのぼうし（サトシの 品）
//   まぼろしの回ろうの ジムリーダーは 曜日で かわる（data/rivals-r88.js の g16Rivals）
Object.assign(WORKS, {
  pokemon: { name: 'ポケモン', trialGift: { poke_master: 'r88_pk_cap' } },
});
