// 第7章 Step 1・2 の 人の え と とくべつな え（render/ch6-art.js が まぜる）
// 人（C7_NPC_LOOKS）: カリム（千年前の 若い 騎士。みどりの マントと 金の ふちの たて）・緑の王・大臣・城の 兵士・騎士団長・王女ナディア・
//   王国の 人たち（c7_*）・神殿の みこサラサ・うずの魔女オクタリア（場面の すがた）
// とくべつな え（paintC7Special）: うずの魔女オクタリア（神殿の 広間の 大きな すがた）・神殿の 門番（オクタリアの 手下。黒い 水の 大ウナギ 2ひき）
import { Painter } from './pixel.js';

const person = (o) => o;
export const C7_NPC_LOOKS = {
  karim: person({
    hair: '#2a1a10', hairStyle: 'short', skin: 2, outfit: 'armor', cloth: '#2e8a5a', cape: '#e8d070',
    shield: { main: '#2e7a5a', rim: '#d8b040', boss: '#f0e080', metal: true }, weapon: { cat: 'sword', blade: '#dfe4f0', guard: '#c8a040' },
  }),
  c7_king: person({ hair: 5, hairStyle: 'short', skin: 2, outfit: 'robe', robeMain: '#2e7a4a', robeTrim: '#f2c14e', beard: true, hat: 'crown' }),
  c7_minister: person({ hair: 5, hairStyle: 'short', skin: 2, outfit: 'robe', robeMain: '#3a5a7a', robeTrim: '#d8c8a0', beard: true, hat: 'turban', hatColor: '#e8e0c8' }),
  c7_soldier: person({ hair: 0, skin: 2, outfit: 'armor', cloth: '#2e7a5a', hat: 'helmet', spear: true }),
  c7_captain: person({ hair: 1, hairStyle: 'short', skin: 2, outfit: 'armor', cloth: '#1e5a3e', hat: 'helmet', cape: '#c83a3a', beard: true }),
  c7_princess: person({ hair: '#2a1a14', hairStyle: 'long', skin: 2, outfit: 'dress', cloth: '#5ab88a', female: true, hat: 'tiara', hatGem: '#7ad8ff' }),
  c7_man: person({ hair: 0, hairStyle: 'short', skin: 2, outfit: 'tunic', cloth: '#4a8a5a', hat: 'headband', hatColor: '#e8d8a0' }),
  c7_woman: person({ hair: 1, hairStyle: 'bun', skin: 2, outfit: 'dress', cloth: '#3a9a8a', female: true }),
  c7_woman2: person({ hair: 0, hairStyle: 'pony', skin: 2, outfit: 'apron', cloth: '#6a9a3a', female: true }),
  c7_girl: person({ hair: 3, hairStyle: 'twin', skin: 2, outfit: 'dress', cloth: '#7ac8a8', female: true, small: true }),
  c7_kid: person({ hair: 1, hairStyle: 'spiky', skin: 2, outfit: 'tunic', cloth: '#5aa8c8', small: true }),
  c7_oldman: person({ hair: 5, hairStyle: 'short', skin: 2, outfit: 'robe', robeMain: '#5a7a5a', robeTrim: '#d8e8c8', beard: true, cane: true }),
  c7_priest: person({ hair: 5, hairStyle: 'short', skin: 2, outfit: 'robe', robeMain: '#e8f6f4', robeTrim: '#3aa8a0', hat: 'mitre', hatColor: '#e8f6f4' }),
  c7_miko: person({ hair: '#1a3a4a', hairStyle: 'long', skin: 1, outfit: 'robe', robeMain: '#eefaf6', robeTrim: '#3ab8a0', female: true, hat: 'veil', cape: '#5ad8c8' }),
  c7_witch: person({ hair: '#f0f0f8', hairStyle: 'long', skin: '#c8b0e0', outfit: 'robe', robeMain: '#3a1a4a', robeTrim: '#5ad8c8', female: true, hat: 'circlet', hatGem: '#f2c14e', cape: '#1a0a2a' }),
};

// ───────────── とくべつな え ─────────────
// うずの魔女オクタリア（44×48）: 白い 大きな かみ・むらさきの はだ・黒い ドレス・すその 青みどりの 水の うず・金の 貝の くびかざり
function paintWitch(f) {
  const W = 44, H = 48, p = new Painter(W, H);
  const SK = { d: '#8a6aa8', b: '#c8b0e0', l: '#e4d4f4' }, DR = { d: '#1a0a24', b: '#3a1a4a', l: '#5a2e6a' }, AQ = { d: '#1e6a6a', b: '#3aa8a0', l: '#8ae8d8' };
  p.ellipse(22, 46, 16, 2, '#140a1a');
  // すその 水の うず（コマで ゆれる）
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + f * 0.5;
    p.ellipse(22 + Math.cos(a) * 12, 40 + Math.sin(a) * 3, 5, 3, i % 2 ? AQ.d : AQ.b);
  }
  // ドレス
  for (let y = 18; y < 42; y++) { const w = 6 + Math.round((y - 18) * 0.38); p.hline(22 - w, 21 + w, y, DR.b); p.set(22 - w, y, DR.l); p.set(21 + w, y, DR.d); }
  // うで（大きく 広げる）
  p.rect(6, 18, 8, 4, SK.b); p.rect(30, 18, 8, 4, SK.b); p.rect(3, 14, 4, 6, SK.b); p.rect(37, 14, 4, 6, SK.b);
  // かお・かみ
  p.ellipse(22, 11, 9, 9, '#f0f0f8'); p.ellipse(22, 6, 8, 5, '#ffffff');
  p.ellipse(22, 13, 5, 5, SK.b); p.ellipse(21, 12, 2, 2, SK.l);
  p.set(20, 13, AQ.d); p.set(24, 13, AQ.d); p.hline(21, 23, 16, '#8a1a4a');
  // くびかざり（金の 貝）
  p.ellipse(22, 20, 2.5, 2, '#f2c14e'); p.set(22, 19, '#fff4b0');
  return { p, oc: '#0a0410' };
}
// 神殿の 門番（44×40）: 黒い 水の 大ウナギ 2ひき（光る 黄色い 目）
function paintGateEels(f) {
  const W = 44, H = 40, p = new Painter(W, H);
  const E = { d: '#0e2a24', b: '#1e4a3e', l: '#3a7a62' };
  p.ellipse(22, 37, 18, 3, '#0a1a1a');
  p.ellipse(22, 34, 16, 4, '#1e4a5a');
  for (const [cx, dir] of [[12, -1], [32, 1]]) {
    for (let y = 8; y < 35; y++) {
      const x = cx + Math.round(Math.sin(y * 0.35 + f * 0.6) * 3) * dir;
      p.hline(x - 3, x + 3, y, E.b); p.set(x - 3, y, E.l); p.set(x + 3, y, E.d);
      if (y % 4 === 0) p.set(x, y, E.l);
    }
    const hx = cx + Math.round(Math.sin(8 * 0.35 + f * 0.6) * 3) * dir;
    p.ellipse(hx, 7, 5, 4, E.b); p.ellipse(hx + dir, 6, 2, 1.5, E.l);
    p.set(hx - 2, 6, '#ffe040'); p.set(hx + 2, 6, '#ffe040'); p.hline(hx - 2, hx + 2, 9, '#081410');
  }
  return { p, oc: '#04100c' };
}

export function paintC7Special(kind, dir, f) {
  switch (kind) {
    case 'c7_witch_npc': return paintWitch(f);
    case 'c7_gate_npc': return paintGateEels(f);
    default: return null;
  }
}
export const C7_SPECIALS = ['c7_witch_npc', 'c7_gate_npc'];
