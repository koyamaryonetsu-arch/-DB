// キャラクターの ドットえ（16×21）を プログラムで くみたてる
// みため（かみがた・いろ）と しょくぎょう（ふく・ぼうし）で かわる
import { Painter, shade } from './pixel.js';

export const CW = 16;
export const CH = 21;

export const SKIN = ['#f7d4ae', '#e0ae80', '#b27a50'];
export const HAIR = ['#2d2330', '#6b4226', '#e9c25e', '#c8452f', '#3c64c8', '#dcdcec', '#f08cc0', '#3fa066'];
export const CLOTH = ['#d9534f', '#3f7fd0', '#3fa35a', '#8a5ac8', '#e68a2e', '#2aa0a0', '#e46fa8', '#ececf2'];
export const HAIR_NAMES = ['みじかい', 'ながい', 'ツンツン', 'ひとつむすび'];

const OUT = '#1b1330';
const EYE = '#231a2e';

// しょくぎょうごとの ふく
const JOB_LOOK = {
  warrior: { outfit: 'armor', hat: 'helmet' },
  monk: { outfit: 'gi', hat: 'headband' },
  priest: { outfit: 'robe', hat: 'mitre', robeMain: '#f4f2fa', robeTrim: 'cloth' },
  mage: { outfit: 'robe', hat: 'wizard', robeMain: 'cloth', robeTrim: '#f2c14e' },
  performer: { outfit: 'jester', hat: 'jester' },
};

// NPCの みため
const NPC_LOOKS = {
  elder: { hair: 5, hairStyle: 'bun', skin: 0, outfit: 'robe', robeMain: '#7a6aa8', robeTrim: '#f2c14e', cane: true, hunch: true, female: true },
  luca: { hair: 1, hairStyle: 'spiky', skin: 1, outfit: 'gi', cloth: '#e68a2e', hat: 'headband' },
  merchant: { hair: 1, hairStyle: 'short', skin: 0, outfit: 'apron', cloth: '#5a8a3a', beard: false },
  priest: { hair: 5, hairStyle: 'short', skin: 0, outfit: 'robe', robeMain: '#f4f2fa', robeTrim: '#8a5ac8', hat: 'mitre' },
  priestess: { hair: 2, hairStyle: 'long', skin: 0, outfit: 'robe', robeMain: '#ffffff', robeTrim: '#3f7fd0', female: true, hat: 'veil' },
  guard: { hair: 0, skin: 1, outfit: 'armor', cloth: '#3f7fd0', hat: 'helmet', spear: true },
  farmer: { hair: 1, hairStyle: 'short', skin: 1, outfit: 'tunic', cloth: '#8a6a3a', hat: 'straw' },
  girl: { hair: 3, hairStyle: 'twin', skin: 0, outfit: 'dress', cloth: '#e46fa8', female: true, small: true },
  boy: { hair: 1, hairStyle: 'short', skin: 0, outfit: 'tunic', cloth: '#3f7fd0', small: true },
  oldman: { hair: 5, hairStyle: 'bald', skin: 0, outfit: 'tunic', cloth: '#7a6a5a', beard: true, cane: true, hunch: true },
  woman: { hair: 1, hairStyle: 'bun', skin: 0, outfit: 'dress', cloth: '#2aa0a0', female: true },
  mayor: { hair: 5, hairStyle: 'bald', skin: 0, outfit: 'robe', robeMain: '#c83a3a', robeTrim: '#f2c14e', beard: true },
  sage: { hair: 5, hairStyle: 'long', skin: 0, outfit: 'robe', robeMain: '#3a4a8a', robeTrim: '#f2c14e', beard: true, hat: 'wizard', hatColor: '#3a4a8a', cane: true },
  bartender: { hair: 0, hairStyle: 'short', skin: 1, outfit: 'vest', cloth: '#2d2330', beard: true },
  carpenter: { hair: 1, hairStyle: 'short', skin: 1, outfit: 'tunic', cloth: '#b8773a', hat: 'bandana', hatColor: '#3f7fd0', beard: true },
  cook: { hair: 1, hairStyle: 'short', skin: 0, outfit: 'apron', cloth: '#f4f4f4', hat: 'chef' },
  bard: { hair: 2, hairStyle: 'short', skin: 0, outfit: 'tunic', cloth: '#3fa35a', hat: 'feather' },
  zarba: { hair: 0, skin: 2, outfit: 'robe', robeMain: '#2a1a3a', robeTrim: '#8a2a5a', hat: 'hood', hatColor: '#2a1a3a', glowEyes: true },
  shadow: { hair: 0, skin: 2, outfit: 'shadow', hat: 'hood', hatColor: '#1a1026', glowEyes: true },
};

// しょくぎょう・みため → パーツの せってい
export function lookToOpts(look = {}, job = 'warrior') {
  const jl = JOB_LOOK[job] || JOB_LOOK.warrior;
  const cloth = CLOTH[look.color ?? 0];
  return {
    skin: SKIN[look.skin ?? 0],
    hair: HAIR[look.hairColor ?? 0],
    hairStyle: ['short', 'long', 'spiky', 'pony'][look.hair ?? 0],
    female: look.body === 1,
    cloth,
    outfit: jl.outfit,
    hat: jl.hat,
    robeMain: jl.robeMain === 'cloth' ? cloth : jl.robeMain,
    robeTrim: jl.robeTrim === 'cloth' ? cloth : jl.robeTrim,
    hatColor: job === 'mage' ? shade(cloth, -0.25) : null,
  };
}

export function npcOpts(kind) {
  const n = NPC_LOOKS[kind];
  if (!n) return null;
  return {
    skin: SKIN[n.skin ?? 0],
    hair: HAIR[n.hair ?? 0],
    hairStyle: n.hairStyle || 'short',
    female: !!n.female,
    cloth: n.cloth || '#7a6a5a',
    outfit: n.outfit,
    hat: n.hat || null,
    robeMain: n.robeMain,
    robeTrim: n.robeTrim,
    hatColor: n.hatColor || null,
    beard: n.beard,
    cane: n.cane,
    spear: n.spear,
    hunch: n.hunch,
    small: n.small,
    glowEyes: n.glowEyes,
  };
}

// ───────────── からだ ─────────────
function drawBody(p, dir, f, o) {
  const sk = o.skin, skD = shade(o.skin, -0.18);
  const main = o.outfit === 'robe' ? o.robeMain : o.cloth;
  const mainD = shade(main, -0.25);
  const pants = o.outfit === 'armor' ? '#4a4a5a' : o.outfit === 'gi' ? shade(o.cloth, -0.35) : '#4a3a2e';
  const shoe = '#5a3a22';
  const long = o.outfit === 'robe' || o.outfit === 'dress' || o.outfit === 'shadow';
  // あし
  const legY = 17;
  if (!long) {
    if (dir === 'side') {
      if (f === 0) {
        p.rect(4, legY, 2, 3, pants); p.rect(3, legY + 3, 3, 1, shoe);
        p.rect(9, legY, 2, 2, pants); p.rect(9, legY + 2, 3, 1, shoe);
      } else {
        p.rect(6, legY, 2, 3, pants); p.rect(5, legY + 3, 3, 1, shoe);
        p.rect(8, legY, 2, 2, pants); p.rect(8, legY + 2, 3, 1, shoe);
      }
    } else {
      const lUp = f === 1, rUp = f === 0;
      p.rect(5, legY, 2, lUp ? 2 : 3, pants); p.rect(5, legY + (lUp ? 2 : 3), 2, 1, shoe);
      p.rect(9, legY, 2, rUp ? 2 : 3, pants); p.rect(9, legY + (rUp ? 2 : 3), 2, 1, shoe);
    }
  } else {
    // ローブの すそから くつが のぞく
    if (dir === 'side') {
      p.rect(f === 0 ? 3 : 5, 19, 3, 1, shoe);
      p.rect(f === 0 ? 9 : 8, 19, 3, 1, shoe);
    } else {
      p.rect(5, f === 1 ? 19 : 20, 2, 1, shoe);
      p.rect(9, f === 0 ? 19 : 20, 2, 1, shoe);
    }
  }
  // どう
  if (dir === 'side') {
    p.rect(5, 11, 6, 6, main);
    p.vline(10, 11, 16, mainD);
    if (long) {
      p.rect(4, 15, 8, 4, main);
      p.hline(4, 11, 18, mainD);
    }
  } else {
    p.rect(5, 11, 6, 1, main);
    p.rect(4, 12, 8, 5, main);
    p.vline(11, 12, 16, mainD);
    if (long) {
      p.rect(4, 16, 8, 2, main);
      p.rect(3, 17, 10, 2, main);
      p.hline(3, 12, 18, mainD);
    }
  }
  // ふくの もよう
  const trim = o.robeTrim || '#f2c14e';
  switch (o.outfit) {
    case 'armor': {
      const m = '#b8bccb', mD = '#7d8194', mL = '#e2e5ef';
      if (dir === 'side') {
        p.rect(5, 11, 6, 4, m); p.vline(10, 11, 14, mD); p.hline(5, 9, 11, mL);
        p.rect(5, 15, 6, 2, o.cloth);
      } else {
        p.rect(4, 12, 8, 4, m); p.hline(4, 11, 12, mL); p.vline(11, 12, 15, mD);
        p.rect(5, 11, 6, 1, mL);
        if (dir === 'down') { p.set(7, 13, o.cloth); p.set(8, 13, o.cloth); p.set(7, 14, o.cloth); p.set(8, 14, o.cloth); }
        p.rect(4, 16, 8, 1, o.cloth);
      }
      break;
    }
    case 'gi': {
      if (dir === 'down') { p.set(7, 12, sk); p.set(8, 12, sk); p.set(7, 13, sk); p.set(6, 12, shade(main, 0.25)); p.set(9, 12, shade(main, 0.25)); }
      p.hline(dir === 'side' ? 5 : 4, dir === 'side' ? 10 : 11, 16, '#2a2a2a');
      break;
    }
    case 'robe': {
      if (dir === 'down') { p.vline(7, 12, 18, trim); p.vline(8, 12, 18, trim); p.hline(5, 10, 11, trim); }
      else if (dir === 'up') { p.hline(4, 11, 12, trim); }
      else p.vline(5, 12, 18, trim);
      break;
    }
    case 'jester': {
      const b = shade(o.cloth, 0.15);
      const c2 = '#f2c14e';
      if (dir !== 'side') {
        p.rect(4, 12, 4, 5, c2); p.rect(8, 12, 4, 5, o.cloth);
        p.set(5, 13, b); p.set(10, 14, b);
        p.hline(4, 11, 16, '#2a2a2a');
      } else {
        p.rect(5, 11, 3, 6, c2);
      }
      break;
    }
    case 'apron': {
      if (dir === 'down') { p.rect(5, 12, 6, 6, '#f4f4f4'); p.hline(5, 10, 12, '#d8d8d8'); }
      else if (dir === 'side') p.rect(5, 12, 3, 5, '#f4f4f4');
      break;
    }
    case 'vest': {
      if (dir === 'down') { p.rect(7, 12, 2, 5, '#f4f4f4'); p.set(7, 13, '#c83a3a'); p.set(8, 13, '#c83a3a'); }
      break;
    }
    case 'tunic': {
      p.hline(dir === 'side' ? 5 : 4, dir === 'side' ? 10 : 11, 16, '#5a3a22');
      break;
    }
    case 'dress': {
      if (dir === 'down') { p.rect(6, 11, 4, 1, '#f4f4f4'); p.hline(3, 12, 18, shade(main, 0.2)); }
      break;
    }
    case 'shadow': {
      break;
    }
    default:
  }
  // うで
  const sleeve = o.outfit === 'armor' ? '#9a9eb0' : o.outfit === 'robe' ? main : o.outfit === 'jester' ? '#f2c14e' : main;
  if (dir === 'side') {
    const ax = f === 0 ? 6 : 8;
    p.rect(ax, 12, 2, 3, sleeve);
    p.rect(ax, 15, 2, 1, sk);
  } else {
    const la = f === 0 ? 0 : -1, ra = f === 0 ? -1 : 0;
    p.rect(3, 12 + la, 1, 3, sleeve); p.set(3, 15 + la, sk);
    p.rect(12, 12 + ra, 1, 3, shade(sleeve, -0.15)); p.set(12, 15 + ra, skD);
  }
  // どうぐ
  if (o.cane) {
    const cx = dir === 'side' ? 2 : 13;
    p.vline(cx, 12, 20, '#7a4a22');
    p.set(cx, 11, '#9a6232');
  }
  if (o.spear) {
    const sx = dir === 'side' ? 3 : 13;
    p.vline(sx, 4, 20, '#7a4a22');
    p.rect(sx - (dir === 'side' ? 0 : 0), 1, 1, 3, '#d8dce8');
    p.set(sx, 0, '#ffffff');
  }
}

// ───────────── あたま ─────────────
function drawHead(p, dir, f, o) {
  const sk = o.skin, skD = shade(o.skin, -0.15);
  const hair = o.hair, hairD = shade(o.hair, -0.3), hairL = shade(o.hair, 0.25);
  const bald = o.hairStyle === 'bald';
  // かおの かたち
  if (dir === 'side') {
    p.rect(4, 3, 7, 7, sk);
    p.hline(5, 9, 2, sk);
    p.hline(5, 9, 10, sk);
    p.set(3, 7, sk); // はな
    p.vline(10, 4, 9, skD);
  } else {
    p.hline(5, 10, 2, sk);
    p.hline(4, 11, 3, sk);
    p.rect(3, 4, 10, 6, sk);
    p.hline(4, 11, 10, sk);
    p.vline(12, 4, 9, skD);
  }
  // かお
  if (dir === 'down') {
    const ec = o.glowEyes ? '#ff4a4a' : EYE;
    p.vline(5, 6, 7, ec); p.vline(10, 6, 7, ec);
    if (!o.glowEyes) { p.set(5, 6, '#4a3a5a'); p.set(10, 6, '#4a3a5a'); }
    if (o.female) { p.set(4, 8, '#f3a6a6'); p.set(11, 8, '#f3a6a6'); }
    if (!o.beard) p.set(7, 9, shade(sk, -0.25)), p.set(8, 9, shade(sk, -0.25));
  } else if (dir === 'side') {
    p.vline(4, 6, 7, o.glowEyes ? '#ff4a4a' : EYE);
    if (o.female) p.set(5, 8, '#f3a6a6');
  }
  // ひげ
  if (o.beard && dir !== 'up') {
    const bc = o.hair === HAIR[5] ? '#f0f0f6' : shade(hair, 0.1);
    if (dir === 'down') { p.rect(4, 8, 8, 3, bc); p.rect(5, 11, 6, 2, bc); p.set(7, 8, sk); p.set(8, 8, sk); }
    else { p.rect(3, 8, 5, 3, bc); p.rect(4, 11, 3, 1, bc); }
  }
  // かみ
  if (!bald) {
    if (dir === 'down') {
      p.hline(5, 10, 1, hair); p.rect(4, 2, 8, 2, hair); p.rect(3, 3, 10, 1, hair);
      p.hline(6, 9, 1, hairL);
      switch (o.hairStyle) {
        case 'spiky':
          p.set(4, 0, hair); p.set(7, 0, hair); p.set(10, 0, hair); p.set(3, 1, hair); p.set(12, 1, hair);
          p.rect(3, 4, 10, 1, hair); p.set(4, 5, hair); p.set(6, 5, hair); p.set(9, 5, hair); p.set(11, 5, hair);
          p.vline(3, 4, 7, hair); p.vline(12, 4, 7, hair);
          break;
        case 'long':
          p.rect(3, 4, 10, 1, hair); p.set(5, 5, hair); p.set(10, 5, hair);
          p.rect(2, 4, 2, 9, hair); p.rect(12, 4, 2, 9, hair); p.vline(2, 5, 12, hairD); p.vline(13, 5, 12, hairD);
          break;
        case 'pony':
        case 'twin':
          p.rect(3, 4, 10, 1, hair); p.set(4, 5, hair); p.set(11, 5, hair);
          p.vline(3, 4, 7, hair); p.vline(12, 4, 7, hair);
          p.rect(1, 5, 2, 5, hair); p.rect(13, 5, 2, 5, hair); p.set(1, 9, hairD); p.set(14, 9, hairD);
          break;
        case 'bun':
          p.rect(3, 4, 10, 1, hair); p.vline(3, 4, 6, hair); p.vline(12, 4, 6, hair);
          p.rect(6, 0, 4, 2, hair); p.hline(7, 8, 0, hairL);
          break;
        default:
          p.rect(3, 4, 10, 1, hair); p.set(4, 5, hair); p.set(7, 5, hair); p.set(8, 5, hair); p.set(11, 5, hair);
          p.vline(3, 4, 6, hair); p.vline(12, 4, 6, hair);
      }
    } else if (dir === 'up') {
      p.hline(5, 10, 1, hair); p.rect(4, 2, 8, 1, hair); p.rect(3, 3, 10, 7, hair); p.hline(4, 11, 10, hair);
      p.hline(6, 9, 1, hairL); p.hline(4, 11, 9, hairD);
      if (o.hairStyle === 'long') { p.rect(3, 10, 10, 3, hair); p.hline(3, 12, 12, hairD); }
      if (o.hairStyle === 'pony') { p.rect(7, 10, 2, 4, hair); }
      if (o.hairStyle === 'twin') { p.rect(1, 5, 2, 5, hair); p.rect(13, 5, 2, 5, hair); }
      if (o.hairStyle === 'bun') { p.rect(6, 0, 4, 2, hair); }
      if (o.hairStyle === 'spiky') { p.set(4, 0, hair); p.set(7, 0, hair); p.set(10, 0, hair); p.set(3, 1, hair); p.set(12, 1, hair); }
    } else {
      p.hline(5, 10, 1, hair); p.rect(4, 2, 7, 2, hair); p.rect(6, 4, 5, 1, hair);
      p.rect(8, 4, 3, 6, hair); p.set(4, 4, hair); p.set(5, 4, hair);
      p.hline(6, 9, 1, hairL);
      if (o.hairStyle === 'long') { p.rect(8, 4, 4, 9, hair); p.vline(11, 5, 12, hairD); }
      if (o.hairStyle === 'pony') { p.rect(11, 4, 2, 6, hair); p.set(12, 9, hairD); }
      if (o.hairStyle === 'twin') { p.rect(10, 5, 2, 6, hair); }
      if (o.hairStyle === 'bun') { p.rect(9, 0, 3, 3, hair); }
      if (o.hairStyle === 'spiky') { p.set(5, 0, hair); p.set(8, 0, hair); p.set(11, 1, hair); p.set(11, 3, hair); }
    }
  } else if (dir === 'up') {
    p.rect(3, 5, 10, 5, o.hair);
  } else if (dir === 'side') {
    p.rect(9, 5, 2, 4, o.hair);
  } else {
    p.vline(3, 5, 7, o.hair); p.vline(12, 5, 7, o.hair);
  }
}

// ───────────── ぼうし ─────────────
function drawHat(p, dir, f, o) {
  const hc = o.hatColor;
  switch (o.hat) {
    case 'helmet': {
      const m = '#b8bccb', mD = '#7d8194', mL = '#eef0f6';
      if (dir === 'side') {
        p.rect(4, 1, 7, 4, m); p.hline(5, 9, 0, m); p.hline(5, 8, 1, mL); p.rect(4, 5, 7, 1, mD);
        p.rect(9, 5, 2, 3, m); p.set(12, 0, '#f2c14e'); p.set(11, 1, '#f2c14e');
      } else {
        p.rect(3, 1, 10, 4, m); p.hline(5, 10, 0, m); p.hline(5, 9, 1, mL); p.rect(3, 5, 10, 1, mD);
        if (dir === 'down') { p.vline(7, 0, 4, '#f2c14e'); p.vline(8, 0, 4, '#f2c14e'); }
        p.set(2, 1, '#f4f4f4'); p.set(1, 0, '#f4f4f4'); p.set(13, 1, '#f4f4f4'); p.set(14, 0, '#f4f4f4');
      }
      break;
    }
    case 'headband': {
      const c = '#d9534f';
      if (dir === 'side') { p.hline(4, 10, 4, c); p.set(11, 5, c); p.set(12, 6, c); p.set(12, 5, c); }
      else if (dir === 'down') p.hline(3, 12, 4, c);
      else { p.hline(3, 12, 4, c); p.set(7, 5, c); p.set(8, 6, c); p.set(6, 6, c); }
      break;
    }
    case 'mitre': {
      const w = '#f7f5ff', wD = '#d6d2ea', g = '#f2c14e';
      const x0 = dir === 'side' ? 4 : 5;
      p.rect(x0, 0, 6, 4, w); p.hline(x0 + 1, x0 + 4, -1, w);
      p.rect(dir === 'side' ? 4 : 3, 3, dir === 'side' ? 7 : 10, 2, w); p.hline(dir === 'side' ? 4 : 3, dir === 'side' ? 10 : 12, 4, wD);
      if (dir === 'down') { p.vline(7, 0, 3, g); p.vline(8, 0, 3, g); p.hline(6, 9, 1, g); }
      break;
    }
    case 'wizard': {
      const c = hc || '#5a3a8a', cD = shade(c, -0.25), g = '#f2c14e';
      if (dir === 'side') {
        p.hline(2, 12, 4, c); p.hline(2, 12, 5, cD);
        p.rect(5, 1, 5, 3, c); p.rect(7, -1, 3, 2, c); p.set(10, -1, c); p.set(11, 0, c);
        p.hline(5, 9, 3, g);
      } else {
        p.hline(1, 14, 4, c); p.hline(1, 14, 5, cD);
        p.rect(4, 2, 8, 2, c); p.rect(5, 0, 6, 2, c); p.rect(6, -1, 3, 1, c); p.set(9, -1, c); p.set(10, -1, c);
        p.hline(4, 11, 3, g);
      }
      break;
    }
    case 'jester': {
      const a = o.cloth, b = '#f2c14e', bell = '#ffe98a';
      if (dir === 'side') {
        p.rect(4, 1, 7, 3, a); p.rect(9, 0, 3, 2, b); p.set(12, 1, bell);
      } else {
        p.rect(3, 1, 5, 3, a); p.rect(8, 1, 5, 3, b);
        p.rect(1, 0, 3, 2, a); p.rect(12, 0, 3, 2, b);
        p.set(0, 1, bell); p.set(15, 1, bell);
        p.hline(3, 12, 4, '#f4f4f4');
      }
      break;
    }
    case 'veil': {
      const w = '#ffffff';
      if (dir === 'down') { p.rect(3, 1, 10, 3, w); p.vline(2, 3, 11, w); p.vline(13, 3, 11, w); p.set(7, 2, '#3f7fd0'); p.set(8, 2, '#3f7fd0'); }
      else if (dir === 'up') p.rect(3, 1, 10, 11, w);
      else { p.rect(4, 1, 7, 3, w); p.rect(9, 3, 3, 9, w); }
      break;
    }
    case 'hood': {
      const c = hc || '#2a1a3a', cD = shade(c, -0.3);
      if (dir === 'up') { p.rect(3, 1, 10, 10, c); p.hline(4, 11, 0, c); }
      else if (dir === 'down') {
        p.rect(3, 1, 10, 3, c); p.hline(4, 11, 0, c); p.vline(3, 4, 10, c); p.vline(12, 4, 10, c); p.vline(4, 4, 6, cD); p.vline(11, 4, 6, cD);
        p.rect(4, 4, 8, 6, '#120a18');
        p.set(5, 6, '#ff4a4a'); p.set(10, 6, '#ff4a4a'); p.set(5, 7, '#ff8a4a'); p.set(10, 7, '#ff8a4a');
      } else {
        p.rect(4, 1, 7, 3, c); p.rect(8, 4, 3, 7, c); p.rect(4, 4, 4, 6, '#120a18'); p.set(4, 6, '#ff4a4a');
      }
      break;
    }
    case 'straw': {
      const c = '#e8c86a', cD = '#c8a84a';
      p.hline(dir === 'side' ? 2 : 1, dir === 'side' ? 12 : 14, 3, c);
      p.rect(dir === 'side' ? 4 : 4, 0, dir === 'side' ? 6 : 8, 3, c);
      p.hline(dir === 'side' ? 4 : 4, dir === 'side' ? 9 : 11, 2, '#c83a3a');
      p.hline(dir === 'side' ? 2 : 1, dir === 'side' ? 12 : 14, 4, cD);
      break;
    }
    case 'bandana': {
      const c = hc || '#3f7fd0';
      p.rect(dir === 'side' ? 4 : 3, 1, dir === 'side' ? 7 : 10, 3, c);
      if (dir !== 'down') { p.set(11, 4, c); p.set(12, 5, c); }
      break;
    }
    case 'chef': {
      const w = '#ffffff', wD = '#dadae6';
      p.rect(4, -1, 8, 4, w); p.rect(3, 0, 10, 2, w); p.hline(4, 11, 3, wD); p.set(6, 0, wD); p.set(9, 1, wD);
      break;
    }
    case 'feather': {
      const c = '#8a3a3a';
      p.rect(dir === 'side' ? 4 : 3, 1, dir === 'side' ? 7 : 10, 3, c);
      p.hline(dir === 'side' ? 3 : 2, dir === 'side' ? 11 : 13, 3, shade(c, -0.2));
      p.set(11, 0, '#f4f4f4'); p.set(12, -1, '#f4f4f4'); p.set(12, 0, '#f4f4f4');
      break;
    }
    default:
  }
}

// からだ ぜんたい
export function paintHuman(dir, f, o) {
  const p = new Painter(CW, CH);
  const vdir = dir === 'left' || dir === 'right' ? 'side' : dir;
  if (o.outfit === 'shadow') {
    const c = '#1a1026', cD = '#0a0612';
    p.ellipse(8, 6, 5, 5, c);
    p.rect(3, 10, 10, 9, c); p.rect(2, 15, 12, 4, cD);
    p.set(5 + (f ? 1 : 0), 18, cD);
    if (vdir !== 'up') { p.set(6, 6, '#ff4a4a'); p.set(10, 6, '#ff4a4a'); }
    p.outline('#6a3a8a');
  } else {
    drawBody(p, vdir, f, o);
    drawHead(p, vdir, f, o);
    drawHat(p, vdir, f, o);
    p.outline(OUT);
  }
  let out = p;
  if (dir === 'right') out = p.flipX();
  if (o.small) {
    // こどもは すこし ちいさく（したに よせる）
    const q = new Painter(CW, CH);
    for (let y = 0; y < CH; y++) {
      for (let x = 0; x < CW; x++) {
        const sx = Math.round(8 + (x - 8) / 0.88), sy = Math.round(20 - (20 - y) / 0.88);
        q.set(x, y, out.get(sx, sy));
      }
    }
    out = q;
  }
  return out;
}

// どうぶつ・とくべつな もの
export function paintSpecial(kind, dir, f) {
  const p = new Painter(CW, CH);
  switch (kind) {
    case 'dog': {
      const c = '#c8904a', cD = '#9a6a32';
      const side = dir === 'left' || dir === 'right';
      if (side) {
        p.rect(3, 13, 9, 4, c); p.rect(10, 10, 4, 4, c); p.set(13, 11, '#231a2e'); p.set(14, 12, '#231a2e');
        p.rect(10, 9, 2, 2, cD); p.vline(2, 11 + f, 13, c);
        p.rect(4, 17, 1, 3 - f, cD); p.rect(10, 17, 1, 2 + f, cD); p.rect(6, 17, 1, 2 + f, cD); p.rect(8, 17, 1, 3 - f, cD);
      } else {
        p.rect(4, 9, 8, 6, c); p.rect(5, 15, 6, 3, c); p.rect(3, 8, 2, 3, cD); p.rect(11, 8, 2, 3, cD);
        if (dir === 'down') { p.set(6, 11, '#231a2e'); p.set(9, 11, '#231a2e'); p.rect(7, 13, 2, 1, '#231a2e'); }
        p.rect(5, 18, 2, 2 - f, cD); p.rect(9, 18, 2, 1 + f, cD);
      }
      p.outline(OUT);
      break;
    }
    case 'cat': {
      const c = '#f4f0e8', cB = '#c8904a';
      p.rect(4, 12, 8, 5, c); p.rect(5, 8, 6, 5, c); p.set(5, 7, c); p.set(10, 7, c); p.rect(8, 12, 3, 3, cB); p.rect(5, 8, 2, 2, cB);
      if (dir === 'down') { p.set(6, 10, '#3a8a3a'); p.set(9, 10, '#3a8a3a'); p.set(7, 11, '#f3a6a6'); }
      p.vline(12, 10 + f, 14, c);
      p.rect(5, 17, 2, 2, c); p.rect(9, 17, 2, 2, c);
      p.outline(OUT);
      break;
    }
    case 'flower': {
      const g = '#3f8a3a', pet = f ? '#fff6b0' : '#ffe066';
      p.vline(8, 12, 19, g); p.set(7, 16, g); p.set(6, 15, g); p.set(9, 17, g); p.set(10, 16, g);
      for (const [dx, dy] of [[0, -2], [2, 0], [0, 2], [-2, 0], [1, -1], [1, 1], [-1, 1], [-1, -1]]) p.set(8 + dx, 10 + dy, pet);
      p.set(8, 10, '#ffffff');
      if (f) { p.set(3, 6, '#fff6b0'); p.set(13, 8, '#fff6b0'); }
      p.outline('#6a5a1a');
      break;
    }
    case 'starstone': {
      const a = '#9ad8ff', b = '#e6f6ff', c = '#5aa8e8';
      p.rect(6, 5, 4, 12, a); p.rect(5, 7, 6, 8, a); p.vline(7, 5, 15, b); p.vline(9, 7, 14, c);
      p.set(7, 4, a); p.set(8, 4, a); p.set(7, 3, b);
      if (f) { p.set(3, 4, '#ffffff'); p.set(12, 9, '#ffffff'); p.set(4, 14, '#fff6b0'); }
      p.outline('#2a4a7a');
      break;
    }
    case 'spring': {
      p.ellipse(8, 15, 7, 4, '#8a8aa0'); p.ellipse(8, 14.5, 6, 3, '#6ab8f0'); p.ellipse(8, 14, 3.5, 1.5, '#b8e4ff');
      if (f) { p.set(6, 11, '#e0f4ff'); p.set(10, 10, '#e0f4ff'); } else { p.set(8, 10, '#e0f4ff'); }
      p.outline(OUT);
      break;
    }
    case 'none':
      break;
    default:
      return null;
  }
  return p;
}
