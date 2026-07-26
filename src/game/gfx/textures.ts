// 全テクスチャの手続き生成（タイル・キャラクター・モンスター・UI・背景）。
// 既存作品の画像・フォント・素材は一切使用しない。

import Phaser from 'phaser';
import { Px } from './px';
import { paintMonster } from './monsters';

const OUT = '#1a1424';

export interface CharSpec {
  skin: string;
  hair: string;
  hairStyle: 'short' | 'long' | 'pony' | 'hood';
  cloth: string;
  clothD: string;
  legs: string;
}

/** 主人公の外見4種（性別で髪型が変わる） */
export function heroSpec(appearance: number, gender: 'a' | 'b'): CharSpec {
  const base: Omit<CharSpec, 'hair' | 'hairStyle'>[] = [
    { skin: '#f0c8a0', cloth: '#3a6ea5', clothD: '#28497a', legs: '#4a3a2a' },
    { skin: '#f0c8a0', cloth: '#a03a30', clothD: '#742a22', legs: '#3a3a3a' },
    { skin: '#e0b890', cloth: '#3a7a4a', clothD: '#2a5a35', legs: '#4a3a2a' },
    { skin: '#f0d0b0', cloth: '#5a4a7a', clothD: '#40355a', legs: '#3a3245' },
  ];
  const hairs = ['#7a4a2a', '#d8b04a', '#41597a', '#c8ccd8'];
  const styleA: CharSpec['hairStyle'][] = ['short', 'short', 'pony', 'hood'];
  const styleB: CharSpec['hairStyle'][] = ['long', 'pony', 'long', 'hood'];
  const i = Math.max(0, Math.min(3, appearance));
  return {
    ...base[i],
    hair: hairs[i],
    hairStyle: (gender === 'a' ? styleA : styleB)[i],
  };
}

const NPC_SPECS: Record<string, CharSpec> = {
  mirea: { skin: '#f0d0b0', hair: '#b8c8e0', hairStyle: 'long', cloth: '#6a5a9a', clothD: '#4a4070', legs: '#3a3245' },
  gald: { skin: '#d8a878', hair: '#5a4632', hairStyle: 'short', cloth: '#4a5a48', clothD: '#333f32', legs: '#2f2f2f' },
  elder: { skin: '#e0b890', hair: '#c8c8c8', hairStyle: 'short', cloth: '#8a6a3a', clothD: '#6a4f28', legs: '#4a3a2a' },
  priest: { skin: '#f0d0b0', hair: '#d8d8e8', hairStyle: 'long', cloth: '#e8e8f0', clothD: '#a8b0c8', legs: '#8890a8' },
  merchant: { skin: '#e8c098', hair: '#8a5a2a', hairStyle: 'short', cloth: '#c87a30', clothD: '#96591f', legs: '#4a3a2a' },
  innkeeper: { skin: '#f0c8a0', hair: '#a04a3a', hairStyle: 'long', cloth: '#b04a50', clothD: '#823238', legs: '#4a3a2a' },
  smith: { skin: '#d8a878', hair: '#3a3a3a', hairStyle: 'short', cloth: '#6a5a4a', clothD: '#4a3f32', legs: '#2f2f2f' },
  guard: { skin: '#e8c098', hair: '#4a5a7a', hairStyle: 'hood', cloth: '#4a5a8a', clothD: '#334066', legs: '#2f2f3a' },
  kid: { skin: '#f0c8a0', hair: '#c8842a', hairStyle: 'short', cloth: '#50a060', clothD: '#38784a', legs: '#4a3a2a' },
  villager_a: { skin: '#e8c098', hair: '#6a4a2a', hairStyle: 'short', cloth: '#7a8a5a', clothD: '#596a40', legs: '#4a3a2a' },
  villager_b: { skin: '#e0b890', hair: '#4a4a4a', hairStyle: 'short', cloth: '#5a7a8a', clothD: '#405a66', legs: '#3a3a3a' },
  soldier: { skin: '#d8b090', hair: '#2a2a3a', hairStyle: 'hood', cloth: '#3a3048', clothD: '#282136', legs: '#222' },
};

// ---- キャラクター描画（16×22 → 24×32 フレーム、4方向×3フレーム） ----

function paintCharFrame(spec: CharSpec, dir: 'down' | 'up' | 'side', frame: number): Px {
  const p = new Px(16, 22);
  const legLift = frame === 0 ? [0, 0] : frame === 1 ? [-1, 0] : [0, -1];
  // 脚
  p.rect(4, 17 + legLift[0], 3, 4 - legLift[0], spec.legs);
  p.rect(9, 17 + legLift[1], 3, 4 - legLift[1], spec.legs);
  // 靴
  p.rect(4, 20, 3, 1, OUT);
  p.rect(9, 20, 3, 1, OUT);
  // 胴
  p.rect(3, 11, 10, 6, spec.cloth);
  p.rect(3, 16, 10, 1, spec.clothD);
  if (dir === 'side') {
    p.rect(3, 11, 10, 6, spec.cloth);
    p.rect(6, 12, 2, 4, spec.clothD); // 前面の陰
  }
  // 腕
  if (dir === 'down' || dir === 'up') {
    p.rect(2, 12, 1, 4, spec.clothD);
    p.rect(13, 12, 1, 4, spec.clothD);
    p.set(2, 16, spec.skin);
    p.set(13, 16, spec.skin);
  } else {
    p.rect(7, 12, 2, 4, spec.clothD);
    p.set(7, 16, spec.skin);
  }
  // 頭
  p.ellipse(8, 6.5, 4.5, 4.2, spec.skin);
  // 髪
  const H = spec.hair;
  if (spec.hairStyle === 'hood') {
    p.ellipse(8, 5, 5, 3.8, spec.cloth);
    p.rect(3, 5, 10, 2, spec.cloth);
    p.rect(4, 7, 8, 1, spec.clothD);
    if (dir === 'up') p.ellipse(8, 6, 4.5, 4, spec.cloth);
  } else {
    p.ellipse(8, 4.5, 4.6, 2.8, H);
    p.rect(3, 4, 10, 2, H);
    if (dir === 'up') {
      p.ellipse(8, 6, 4.4, 3.8, H);
    }
    if (spec.hairStyle === 'long') {
      p.rect(3, 5, 2, 7, H);
      p.rect(11, 5, 2, 7, H);
      if (dir === 'up') p.rect(4, 6, 8, 5, H);
    }
    if (spec.hairStyle === 'pony') {
      if (dir === 'up') p.rect(6, 8, 4, 6, H);
      if (dir === 'side') p.rect(11, 6, 3, 6, H);
    }
  }
  // 顔
  if (dir === 'down') {
    p.set(6, 7, OUT);
    p.set(10, 7, OUT);
  } else if (dir === 'side') {
    p.set(5, 7, OUT);
  }
  p.outline(OUT);
  return p;
}

export function generateCharTexture(scene: Phaser.Scene, key: string, spec: CharSpec): void {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const fw = 24;
  const fh = 32;
  const tex = scene.textures.createCanvas(key, fw * 12, fh);
  if (!tex) return;
  const ctx = tex.getContext();
  const dirs: ('down' | 'side' | 'side' | 'up')[] = ['down', 'side', 'side', 'up'];
  for (let d = 0; d < 4; d++) {
    for (let f = 0; f < 3; f++) {
      const px = paintCharFrame(spec, dirs[d], f);
      const frameIndex = d * 3 + f;
      const ox = frameIndex * fw + 4;
      const oy = 9;
      if (d === 1) {
        // left = 反転描画
        const flipped = new Px(px.w, px.h);
        for (let y = 0; y < px.h; y++)
          for (let x = 0; x < px.w; x++) {
            const c = px.grid[y][x];
            if (c) flipped.set(px.w - 1 - x, y, c);
          }
        flipped.drawTo(ctx, ox, oy);
      } else {
        px.drawTo(ctx, ox, oy);
      }
    }
  }
  tex.refresh();
  for (let i = 0; i < 12; i++) {
    tex.add(String(i), 0, i * fw, 0, fw, fh);
  }
}

// ---- タイル ----

function tilePainter(name: string): Px {
  const p = new Px(16, 16);
  const grass = (base: string, dark: string, seed: number) => {
    p.rect(0, 0, 16, 16, base);
    p.speckle(0, 0, 16, 16, dark, 0.18, seed);
  };
  switch (name) {
    case 'grass':
      grass('#4e8a4a', '#3d7039', 1);
      break;
    case 'flower':
      grass('#4e8a4a', '#3d7039', 2);
      p.set(4, 5, '#f0f0f0');
      p.set(5, 4, '#f0d060');
      p.set(11, 10, '#f0a0b0');
      p.set(12, 11, '#f0f0f0');
      break;
    case 'path':
      p.rect(0, 0, 16, 16, '#c0a070');
      p.speckle(0, 0, 16, 16, '#a08858', 0.2, 3);
      break;
    case 'water':
      p.rect(0, 0, 16, 16, '#3a6ab0');
      p.rect(2, 4, 5, 1, '#5a8ad0');
      p.rect(9, 9, 5, 1, '#5a8ad0');
      p.rect(5, 13, 4, 1, '#2f568e');
      break;
    case 'tree':
      grass('#4e8a4a', '#3d7039', 4);
      p.rect(6, 10, 4, 5, '#6a4a2a');
      p.ellipse(8, 6, 7, 6, '#2f6a35');
      p.speckle(1, 1, 14, 11, '#245428', 0.3, 5);
      p.ellipse(5, 4, 2, 1.5, '#3f7f45');
      break;
    case 'roof':
      p.rect(0, 0, 16, 16, '#a05a40');
      p.rect(0, 4, 16, 1, '#7a4230');
      p.rect(0, 9, 16, 1, '#7a4230');
      p.rect(0, 14, 16, 1, '#7a4230');
      p.rect(0, 0, 16, 1, '#c07a58');
      break;
    case 'wall':
      p.rect(0, 0, 16, 16, '#d8c8a0');
      p.rect(0, 0, 16, 1, '#b0a078');
      p.rect(0, 8, 16, 1, '#b0a078');
      p.rect(4, 0, 1, 16, '#c0b088');
      p.rect(11, 0, 1, 16, '#c0b088');
      break;
    case 'door':
      p.rect(0, 0, 16, 16, '#d8c8a0');
      p.rect(3, 3, 10, 13, '#7a5434');
      p.rect(4, 4, 8, 12, '#8a6440');
      p.set(11, 10, '#d8b04a');
      break;
    case 'templefloor':
      p.rect(0, 0, 16, 16, '#c8c8d8');
      p.rect(0, 7, 16, 1, '#a8a8bc');
      p.rect(7, 0, 1, 16, '#a8a8bc');
      p.speckle(0, 0, 16, 16, '#b8b8cc', 0.1, 6);
      break;
    case 'pillar':
      p.rect(0, 0, 16, 16, '#c8c8d8');
      p.rect(4, 0, 8, 16, '#e8e8f0');
      p.rect(4, 0, 2, 16, '#f8f8ff');
      p.rect(10, 0, 2, 16, '#a8a8c0');
      p.rect(3, 0, 10, 2, '#d8d8e8');
      p.rect(3, 14, 10, 2, '#d8d8e8');
      break;
    case 'sea':
      p.rect(0, 0, 16, 16, '#2a4a90');
      p.rect(1, 3, 4, 1, '#3f62aa');
      p.rect(8, 7, 5, 1, '#3f62aa');
      p.rect(3, 12, 4, 1, '#1f3a76');
      break;
    case 'mountain':
      p.rect(0, 0, 16, 16, '#7a6a58');
      p.line(2, 14, 8, 2, '#9a8a74');
      p.line(8, 2, 14, 14, '#5a4e40');
      p.speckle(0, 8, 16, 8, '#6a5c4c', 0.3, 7);
      p.set(8, 2, '#e8e8e8');
      p.set(7, 3, '#d8d8d8');
      break;
    case 'wgrass':
      grass('#5a9a52', '#4a8442', 8);
      break;
    case 'wforest':
      grass('#3f7a3d', '#2f5f2e', 9);
      p.ellipse(4, 5, 3, 2.5, '#2a5c2c');
      p.ellipse(11, 10, 3.5, 3, '#2a5c2c');
      p.set(4, 4, '#3f7f45');
      break;
    case 'wpath':
      p.rect(0, 0, 16, 16, '#c0a070');
      p.speckle(0, 0, 16, 16, '#a88f5e', 0.25, 10);
      break;
    case 'sand':
      p.rect(0, 0, 16, 16, '#e0d0a0');
      p.speckle(0, 0, 16, 16, '#c8b888', 0.2, 11);
      break;
    case 'forestgate':
      grass('#3f7a3d', '#2f5f2e', 12);
      p.ellipse(8, 5, 7, 4, '#234c24');
      p.rect(5, 8, 6, 8, '#122a14');
      p.rect(6, 9, 4, 7, '#0a1c0c');
      break;
    case 'villagetile':
      grass('#5a9a52', '#4a8442', 13);
      p.rect(4, 8, 8, 5, '#d8c8a0');
      p.line(3, 8, 8, 4, '#a05a40', 2);
      p.line(8, 4, 13, 8, '#a05a40', 2);
      p.rect(7, 10, 2, 3, '#7a5434');
      break;
    case 'dtree':
      p.rect(0, 0, 16, 16, '#243c26');
      p.rect(6, 11, 4, 5, '#3f2f1f');
      p.ellipse(8, 6, 7, 6, '#1c3a20');
      p.speckle(1, 0, 14, 12, '#142c18', 0.35, 14);
      break;
    case 'dfloor':
      p.rect(0, 0, 16, 16, '#33502f');
      p.speckle(0, 0, 16, 16, '#284024', 0.25, 15);
      p.set(4, 6, '#4a6a3a');
      p.set(12, 12, '#4a6a3a');
      break;
    case 'dwater':
      p.rect(0, 0, 16, 16, '#1f3a50');
      p.rect(2, 5, 5, 1, '#31536e');
      p.rect(9, 10, 5, 1, '#31536e');
      break;
    case 'clearing':
      p.rect(0, 0, 16, 16, '#4a6e3c');
      p.speckle(0, 0, 16, 16, '#3d5c32', 0.2, 16);
      p.set(5, 5, '#8ad870');
      p.set(11, 9, '#8ad870');
      break;
    case 'stairs_up':
      p.rect(0, 0, 16, 16, '#33502f');
      p.rect(2, 2, 12, 3, '#8a8a74');
      p.rect(3, 6, 10, 3, '#7a7a64');
      p.rect(4, 10, 8, 3, '#6a6a54');
      break;
    case 'stairs_down':
      p.rect(0, 0, 16, 16, '#33502f');
      p.rect(4, 2, 8, 3, '#2a2a24');
      p.rect(3, 6, 10, 3, '#222220');
      p.rect(2, 10, 12, 3, '#1a1a18');
      break;
    case 'dexit':
      p.rect(0, 0, 16, 16, '#33502f');
      p.rect(0, 10, 16, 6, '#4a6e46');
      p.rect(0, 13, 16, 3, '#6a9a62');
      break;
    case 'chest_closed':
      p.rect(2, 5, 12, 9, '#8a5a30');
      p.rect(2, 5, 12, 3, '#a06c3c');
      p.rect(2, 8, 12, 1, '#d8b04a');
      p.rect(7, 8, 2, 3, '#d8b04a');
      p.outline(OUT);
      break;
    case 'chest_open':
      p.rect(2, 8, 12, 6, '#8a5a30');
      p.rect(3, 9, 10, 4, '#3a2a18');
      p.rect(2, 3, 12, 3, '#a06c3c');
      p.rect(2, 6, 12, 1, '#d8b04a');
      p.outline(OUT);
      break;
    case 'sign':
      p.rect(7, 8, 2, 7, '#6a4a2a');
      p.rect(2, 2, 12, 6, '#a0805a');
      p.rect(3, 3, 10, 4, '#c8a878');
      p.rect(4, 4, 8, 1, '#6a4a2a');
      p.rect(4, 6, 6, 1, '#6a4a2a');
      p.outline(OUT);
      break;
    default:
      p.rect(0, 0, 16, 16, '#f0f');
  }
  return p;
}

const TILE_NAMES = [
  'grass', 'flower', 'path', 'water', 'tree', 'roof', 'wall', 'door', 'templefloor', 'pillar',
  'sea', 'mountain', 'wgrass', 'wforest', 'wpath', 'sand', 'forestgate', 'villagetile',
  'dtree', 'dfloor', 'dwater', 'clearing', 'stairs_up', 'stairs_down', 'dexit',
  'chest_closed', 'chest_open', 'sign',
];

// ---- 全テクスチャ生成 ----

export function generateAllTextures(scene: Phaser.Scene): void {
  // タイル
  for (const name of TILE_NAMES) {
    const key = `tile_${name}`;
    if (scene.textures.exists(key)) continue;
    const tex = scene.textures.createCanvas(key, 16, 16);
    if (!tex) continue;
    tilePainter(name).drawTo(tex.getContext(), 0, 0);
    tex.refresh();
  }
  // NPC キャラクター
  for (const [id, spec] of Object.entries(NPC_SPECS)) {
    generateCharTexture(scene, `char_${id}`, spec);
  }
  // 主人公デフォルト
  generateCharTexture(scene, 'char_hero', heroSpec(0, 'a'));
  // モンスター
  const monsterIds = [
    'koketsuno', 'hanekinoko', 'tsurukage', 'rinneko', 'lampbat',
    'gansekimogura', 'gearhound', 'balgrow_root', 'balgrow',
  ];
  for (const id of monsterIds) {
    const key = `mon_${id}`;
    if (scene.textures.exists(key)) continue;
    const px = paintMonster(id);
    const scale = 3;
    const tex = scene.textures.createCanvas(key, px.w * scale, px.h * scale);
    if (!tex) continue;
    px.drawTo(tex.getContext(), 0, 0, scale);
    tex.refresh();
  }
  // カーソル
  if (!scene.textures.exists('cursor')) {
    const tex = scene.textures.createCanvas('cursor', 8, 8);
    if (tex) {
      const p = new Px(8, 8);
      for (let i = 0; i < 4; i++) p.rect(i + 1, 1 + i, 1, 6 - i * 2, '#e8e8f0');
      p.outline('#3a3a55');
      p.drawTo(tex.getContext(), 0, 0);
      tex.refresh();
    }
  }
  // 星環エンブレム
  if (!scene.textures.exists('ringmark')) {
    const tex = scene.textures.createCanvas('ringmark', 64, 64);
    if (tex) {
      const ctx = tex.getContext();
      const cx = 32;
      const cy = 32;
      for (let a = 0; a < 360; a += 2) {
        if (a > 300 && a < 330) continue; // 欠けた環
        const rad = (a * Math.PI) / 180;
        const x = cx + Math.cos(rad) * 24;
        const y = cy + Math.sin(rad) * 24;
        ctx.fillStyle = a % 20 < 10 ? '#c8d0e8' : '#8a98c0';
        ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
      }
      // 七つの環晶
      const colors = ['#7ac858', '#e05050', '#50a0e0', '#e0d050', '#b070e0', '#e08a30', '#c8ccd8'];
      for (let i = 0; i < 7; i++) {
        const rad = ((i * 51 - 90) * Math.PI) / 180;
        const x = cx + Math.cos(rad) * 24;
        const y = cy + Math.sin(rad) * 24;
        ctx.fillStyle = colors[i];
        ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4);
      }
      tex.refresh();
    }
  }
  // 戦闘背景
  genBattleBg(scene, 'bg_plains', ['#88b8e0', '#a8d0e8', '#5a9a52', '#4a8442']);
  genBattleBg(scene, 'bg_forest', ['#24402c', '#2c4c34', '#33502f', '#284024']);
  genBattleBg(scene, 'bg_boss', ['#1c2c20', '#243828', '#4a6e3c', '#3d5c32']);
  genBattleBg(scene, 'bg_night', ['#101830', '#1a2440', '#2c4434', '#243824']);
}

function genBattleBg(scene: Phaser.Scene, key: string, colors: string[]): void {
  if (scene.textures.exists(key)) return;
  const w = 320;
  const h = 150;
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return;
  const ctx = tex.getContext();
  const [skyTop, skyBottom, ground, groundD] = colors;
  ctx.fillStyle = skyTop;
  ctx.fillRect(0, 0, w, 60);
  ctx.fillStyle = skyBottom;
  ctx.fillRect(0, 60, w, 30);
  ctx.fillStyle = ground;
  ctx.fillRect(0, 90, w, h - 90);
  ctx.fillStyle = groundD;
  let s = 12345;
  for (let i = 0; i < 260; i++) {
    s = (s * 1103515245 + 12345) >>> 0;
    const x = (s >>> 16) % w;
    s = (s * 1103515245 + 12345) >>> 0;
    const y = 90 + ((s >>> 16) % (h - 90));
    ctx.fillRect(x, y, 2, 1);
  }
  tex.refresh();
}
