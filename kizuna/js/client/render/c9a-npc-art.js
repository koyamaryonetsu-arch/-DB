// 第3部 第1章 第1幕「星ふるえの夜」の 人の え と とくべつな え（render/c8r-npc-art.js が まぜる）
// ※ ネタバレ注意（docs/plan-part3.md の 9）
// 人（C9A_NPC_LOOKS）: 第1部の 仲間（ガルド・ミーナ・ポポロ・リン・ティナ。酒場の 仲間と 同じ 色）・3人組（キラジョ・ボヤッチ・ズラッカ）・
//   かけら買いの スズ・村の 子ども ラン
// とくべつな え（paintC9aSpecial）: 星の子 スピカ（小さな 光る 子。フィールドの 連れと くぼ地の 子。コマで 光が またたく）・
//   石の ふくろう ホシモリ（ためしの 場面。24×24）・光る 道しるべ（ささやきの森の 入口）
import { Painter } from './pixel.js?v=bb73dc4f9aca';

export const C9A_NPC_LOOKS = {
  c9a_gard: { hair: 3, hairStyle: 'short', skin: 1, outfit: 'armor', cloth: '#7a5a3a' },
  c9a_mina: { hair: 1, hairStyle: 'long', skin: 0, outfit: 'robe', robeMain: '#f4f2fa', robeTrim: '#3f7fd0', female: true, hat: 'cowl', hatColor: '#f4f2fa' },
  c9a_poporo: { hair: 5, hairStyle: 'short', skin: 0, outfit: 'robe', robeMain: '#3a5ab0', robeTrim: '#f2c14e', small: true, hat: 'wizard', hatColor: '#3a5ab0' },
  c9a_rin: { hair: 0, hairStyle: 'pony', skin: 1, outfit: 'gi', cloth: '#c83a3a', female: true, hat: 'headband', hatColor: '#f4f4f4' },
  c9a_tina: { hair: 6, hairStyle: 'long', skin: 0, outfit: 'dress', cloth: '#f08cc0', female: true, hat: 'feather' },
  c9a_kirajo: { hair: '#e8a0d8', hairStyle: 'long', skin: 0, outfit: 'dress', cloth: '#2a1a3a', female: true, glasses: true, hat: 'ribbon', hatColor: '#e83a8a' },
  c9a_boyacchi: { hair: 0, hairStyle: 'short', skin: 0, outfit: 'vest', cloth: '#5a6a3a', glasses: true, hat: 'cap' },
  c9a_zurakka: { hair: 1, hairStyle: 'bald', skin: 2, outfit: 'tunic', cloth: '#8a5a2a', beard: true },
  c9a_buyer: { hair: 4, hairStyle: 'bun', skin: 0, outfit: 'apron', cloth: '#f2c14e', female: true },
  c9a_kid: { hair: 3, hairStyle: 'short', skin: 1, outfit: 'tunic', cloth: '#3fa35a', small: true },
};

// 星の子 スピカ（16×21。白い ワンピース・金の 星の かみかざり・体の まわりに 光の つぶ）
const SPC = { skin: '#fff0e0', skinD: '#f0d0b8', hair: '#f8f0c8', hairD: '#e0c878', dress: '#f8fcff', dressD: '#c8dcf0', star: '#ffe060', glow: '#fff8c0' };
function paintSpica(dir, f) {
  const p = new Painter(16, 21);
  const k = f % 2;
  // 光の わ（足もと）
  p.ellipse(8, 19, 5, 1.2, '#fff4b0');
  // ワンピース
  for (let y = 11; y < 18; y++) { const w = 2 + Math.floor((y - 11) / 2); p.hline(8 - w, 8 + w, y, SPC.dress); }
  p.hline(5, 11, 17, SPC.dressD);
  p.vline(8, 12, 16, SPC.dressD);
  // 足
  p.set(6, 18, SPC.skinD); p.set(10, 18, SPC.skinD);
  // うで
  p.vline(4, 12, 14 + k, SPC.skin); p.vline(12, 12, 15 - k, SPC.skin);
  // 頭
  p.ellipse(8, 7, 4, 4, SPC.hair);
  if (dir !== 'up') {
    p.ellipse(8, 8, 3, 2.8, SPC.skin);
    if (dir === 'down') { p.set(7, 8, '#3a5a9a'); p.set(9, 8, '#3a5a9a'); p.set(8, 10, '#e89aa8'); }
    else { const ex = dir === 'left' ? 6 : 10; p.set(ex, 8, '#3a5a9a'); }
    p.hline(5, 11, 4, SPC.hair); p.set(5, 6, SPC.hair); p.set(11, 6, SPC.hair);
  } else {
    p.ellipse(8, 7, 3.5, 3.5, SPC.hairD);
  }
  // 星の かみかざり
  p.set(11, 3, SPC.star); p.set(10, 3, SPC.star); p.set(12, 3, SPC.star); p.set(11, 2, SPC.star); p.set(11, 4, SPC.star);
  // 光の つぶ（コマで またたく）
  const dots = k ? [[2, 5], [14, 9], [3, 15]] : [[13, 4], [1, 11], [14, 16]];
  for (const [x, y] of dots) p.set(x, y, SPC.glow);
  return { p, oc: '#8a7a3a' };
}

// 石の ふくろう ホシモリ（24×24。ためしの とびらの 前で 目を さます）
function paintOwl(f) {
  const p = new Painter(24, 24);
  const k = f % 2;
  const S = { d: '#4a4038', b: '#7a6a5a', l: '#a8988a', hl: '#d0c4b4' };
  p.ellipse(12, 22, 9, 1.5, '#1a1410');
  p.ellipse(12, 15, 8, 7, S.d);
  p.ellipse(12, 14, 7, 6.5, S.b);
  p.ellipse(12, 16, 4, 4, S.l);
  for (let y = 14; y < 20; y += 2) p.hline(10, 14, y, S.b);
  // 頭と みみ
  p.ellipse(12, 7, 7, 5.5, S.b);
  p.set(6, 2, S.d); p.set(7, 3, S.d); p.set(18, 2, S.d); p.set(17, 3, S.d);
  // 目（星の 光）
  p.ellipse(9, 7, 2.5, 2.5, S.hl); p.ellipse(15, 7, 2.5, 2.5, S.hl);
  p.ellipse(9, 7, 1.5, 1.5, k ? '#ffe060' : '#f0b040'); p.ellipse(15, 7, 1.5, 1.5, k ? '#ffe060' : '#f0b040');
  p.set(9, 7, '#2a2014'); p.set(15, 7, '#2a2014');
  p.set(12, 10, '#c89a4a'); p.set(12, 11, '#a87a3a');
  // つばさ
  p.ellipse(4, 15, 2.5, 5, S.d); p.ellipse(20, 15, 2.5, 5, S.d);
  if (k) { p.set(2, 4, '#fff4b0'); p.set(21, 5, '#fff4b0'); }
  return { p, oc: '#1a1410' };
}

// 光る 道しるべ（12×21。木の 柱に 星の 光が ともる）
function paintSignpost(f) {
  const p = new Painter(12, 21);
  const k = f % 2;
  p.ellipse(6, 19, 4, 1.2, '#2a2014');
  p.rect(5, 6, 2, 13, '#6a4426'); p.vline(5, 6, 18, '#9a6a3a');
  // 森を 指す 板
  p.rect(2, 7, 9, 3, '#8a5a30'); p.hline(2, 10, 7, '#b88a50'); p.set(10, 8, '#b88a50'); p.set(11, 8, '#8a5a30');
  // 星の 光
  p.ellipse(6, 3, 2.5, 2.5, k ? '#fff8c0' : '#ffe060');
  p.set(6, 0, '#fff8c0'); p.set(6, 6, '#ffe060'); p.set(3, 3, '#ffe060'); p.set(9, 3, '#ffe060');
  if (k) { p.set(1, 1, '#fff8c0'); p.set(11, 12, '#fff8c0'); } else { p.set(10, 0, '#fff8c0'); p.set(0, 13, '#fff8c0'); }
  return { p, oc: '#3a2a14' };
}

export function paintC9aSpecial(kind, dir, f) {
  switch (kind) {
    case 'c9a_spica': return paintSpica(dir, f);
    case 'c9a_owl': return paintOwl(f);
    case 'c9a_signpost': return paintSignpost(f);
    default: return null;
  }
}
export const C9A_SPECIALS = ['c9a_spica', 'c9a_owl', 'c9a_signpost'];
