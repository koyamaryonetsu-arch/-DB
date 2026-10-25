// 第5章 Step 3「雲の上の町ハネノ」の 人の え（render/chars.js が まぜる）
// ・ハネビト … せなかに 白い 羽の ある 人々（o.wings … 羽の 色。o.wingSize 'small' … 小さな 羽〈ピピ・子ども〉）
//   羽は まえ・よこ むきでは からだの うしろ、うしろ むきでは せなかの 上に かく。歩く コマで 少し ゆれる
// ・長ソラネ（白い ころもと 空色の かざり・大きな 羽）・ハネビトの子ピピ（飛べない 小さな 羽）・町の ハネビト
import { shade } from './pixel.js?v=c5a1851e14d9';

export const KUMOI_NPC_LOOKS = {
  sorane: { hair: 5, hairStyle: 'long', skin: 0, outfit: 'robe', robeMain: '#f0f4fc', robeTrim: '#5aa0d8', female: true, hat: 'circlet', hatGem: '#8ad0f8', wings: '#ffffff' },
  pipi: { hair: 3, hairStyle: 'short', skin: 0, outfit: 'tunic', cloth: '#7ac0e8', small: true, wings: '#f8f4e8', wingSize: 'small' },
  hanebito_m: { hair: 1, hairStyle: 'short', skin: 0, outfit: 'tunic', cloth: '#5a8ac8', wings: '#eef2fa' },
  hanebito_f: { hair: 0, hairStyle: 'bun', skin: 0, outfit: 'dress', cloth: '#8ac0e8', female: true, wings: '#f4f6ff' },
  hanebito_f2: { hair: 6, hairStyle: 'pony', skin: 1, outfit: 'apron', cloth: '#c88ab8', female: true, wings: '#f8f0f8' },
  hanebito_old: { hair: 5, hairStyle: 'bald', skin: 1, outfit: 'robe', robeMain: '#a8b4c8', robeTrim: '#f0f0f0', beard: true, cane: true, hunch: true, wings: '#d0d4dc' },
  hanebito_kid: { hair: 3, hairStyle: 'twin', skin: 0, outfit: 'dress', cloth: '#f0a8c0', female: true, small: true, wings: '#ffffff', wingSize: 'small' },
  hanebito_guard: { hair: 0, skin: 1, outfit: 'armor', cloth: '#7aa8d8', hat: 'helmet', hatColor: '#d8e4f4', spear: true, wings: '#eef2fa' },
  hanebito_priest: { hair: 5, hairStyle: 'short', skin: 0, outfit: 'robe', robeMain: '#f8f8ff', robeTrim: '#e8c050', hat: 'mitre', wings: '#ffffff' },
};

// 羽（32×42 の からだの え の 上に かく。肩の あたり〈y 21〉から 外へ 広がる）
// dir: 'down' / 'up' / 'side'、f: 歩く コマ（0・1。羽が 少し ゆれる）
export function drawWings(p, dir, f, o) {
  const c = o.wings, cD = shade(c, -0.2), cL = shade(c, 0.08), cE = shade(c, -0.35);
  const small = o.wingSize === 'small';
  const n = small ? 7 : 10; // 羽の はば
  const lift = f ? 1 : 0;
  const tag = p.tag;
  p.tag = 'cloth';
  const wing = (x0, s, k) => {
    for (let i = 0; i < n; i++) {
      const x = x0 + s * i;
      const top = Math.round(20 - i * (small ? 0.9 : 1.3) - lift * (i > n / 2 ? 1 : 0));
      const bot = Math.round((small ? 27 : 32) - i * (small ? 0.6 : 1.1) * k);
      if (bot <= top) continue;
      p.vline(x, top, bot, c);
      p.set(x, top, cL);
      // 羽の すじ（下の はしが ぎざぎざ）
      p.set(x, bot, i % 2 ? cE : cD);
      if (i % 3 === 2) p.vline(x, top + 2, bot - 1, cD);
    }
  };
  if (dir === 'side') {
    // よこ むき: せなかの 1まい（右へ のびる。左むきの え）
    wing(20, 1, 1);
  } else {
    wing(small ? 10 : 9, -1, 1);
    wing(small ? 21 : 22, 1, 1);
  }
  p.tag = tag;
}
