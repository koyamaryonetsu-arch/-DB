// モンスターのドット絵（完全オリジナル・手続き生成）
// デザイン原則: 動物/植物/鉱物/遺物/楽器/機械などを2要素以上組み合わせる。
// しずく型・顔だけの丸い体・既存作品の配色や輪郭は使わない。

import { Px } from './px';

const OUT = '#1a1424';

export function paintMonster(id: string): Px {
  switch (id) {
    case 'koketsuno':
      return koketsuno();
    case 'hanekinoko':
      return hanekinoko();
    case 'tsurukage':
      return tsurukage();
    case 'rinneko':
      return rinneko();
    case 'lampbat':
      return lampbat();
    case 'gansekimogura':
      return gansekimogura();
    case 'gearhound':
      return gearhound();
    case 'balgrow_root':
      return balgrowRoot();
    case 'balgrow':
      return balgrow();
    default:
      return unknown();
  }
}

function unknown(): Px {
  const p = new Px(24, 24);
  p.ellipse(12, 14, 7, 6, '#888');
  p.outline(OUT);
  return p;
}

// 苔+獣: 四足獣、額に枝分かれした木角、黄緑の目
function koketsuno(): Px {
  const p = new Px(24, 24);
  const moss = '#5a8a3a';
  const mossD = '#3d6428';
  const fur = '#8a6a42';
  // 角（枝分かれ）
  p.line(7, 7, 7, 3, '#7a5a34');
  p.line(7, 4, 5, 2, '#7a5a34');
  p.line(7, 5, 9, 2, '#7a5a34');
  p.line(9, 3, 10, 1, '#7a5a34');
  // 胴（苔に覆われる）
  p.ellipse(13, 14, 8, 5, moss);
  // 頭
  p.ellipse(7, 11, 4, 3.5, moss);
  // 苔の陰影
  p.speckle(6, 9, 15, 9, mossD, 0.25, 7);
  // 腹・脚は毛皮色
  p.rect(8, 17, 2, 4, fur);
  p.rect(12, 18, 2, 3, fur);
  p.rect(16, 18, 2, 3, fur);
  p.rect(19, 17, 2, 4, fur);
  // 尻尾
  p.line(21, 12, 23, 10, fur, 2);
  // 目（黄緑・縦長）
  p.rect(5, 10, 1, 2, '#d8f050');
  // 鼻先
  p.set(3, 12, '#3d2a1a');
  p.outline(OUT);
  return p;
}

// キノコ+蛾: 傘の裏に羽根、胞子
function hanekinoko(): Px {
  const p = new Px(24, 24);
  const cap = '#b06a50';
  const capD = '#8a4a38';
  const wing = '#e8d8b0';
  const wingD = '#c0aa78';
  const body = '#d8c8a0';
  // 羽根（左右非対称気味）
  p.ellipse(5, 13, 5, 4, wing);
  p.ellipse(19, 13, 5, 4, wing);
  p.ellipse(5, 17, 3.5, 2.5, wingD);
  p.ellipse(19, 17, 3.5, 2.5, wingD);
  // 胴
  p.ellipse(12, 15, 3, 5, body);
  p.speckle(10, 12, 5, 8, '#b0a078', 0.3, 3);
  // 傘
  p.ellipse(12, 8, 8, 4.5, cap);
  p.rect(4, 8, 16, 2, capD);
  // 傘の斑点
  p.set(8, 6, '#e8d8c0');
  p.set(14, 5, '#e8d8c0');
  p.set(11, 7, '#e8d8c0');
  p.set(16, 7, '#e8d8c0');
  // 触角
  p.line(10, 4, 8, 1, '#6a5a3a');
  p.line(14, 4, 16, 1, '#6a5a3a');
  // 小さな目（傘の下の胴に）
  p.set(10, 12, OUT);
  p.set(14, 12, OUT);
  p.outline(OUT);
  return p;
}

// 蔓+仮面: 蔓植物の獣、顔は木の仮面
function tsurukage(): Px {
  const p = new Px(24, 24);
  const vine = '#4a7a3a';
  const vineD = '#2f5426';
  const mask = '#c8a878';
  // 蔓の胴体（絡まる曲線）
  p.ellipse(13, 15, 8, 6, vine);
  p.line(5, 20, 2, 16, vine, 2);
  p.line(21, 20, 23, 15, vine, 2);
  p.line(6, 11, 3, 7, vine, 2);
  p.line(20, 11, 22, 6, vine, 2);
  p.speckle(5, 9, 17, 12, vineD, 0.35, 11);
  // 蔓の巻きひげ
  p.line(3, 7, 5, 5, vineD);
  p.line(22, 6, 20, 4, vineD);
  // 前脚
  p.rect(8, 19, 2, 4, vineD);
  p.rect(15, 19, 2, 4, vineD);
  // 木の仮面（縦長・スリット目）
  p.rect(9, 6, 7, 8, mask);
  p.rect(10, 5, 5, 1, mask);
  p.rect(11, 14, 3, 1, mask);
  p.rect(10, 8, 2, 1, OUT);
  p.rect(13, 8, 2, 1, OUT);
  p.rect(12, 11, 1, 2, '#8a6a48');
  p.outline(OUT);
  return p;
}

// 山猫+金属の輪: 首の輪が鳴る
function rinneko(): Px {
  const p = new Px(24, 24);
  const fur = '#7a8ab0';
  const furD = '#55628a';
  const ring = '#e8c860';
  // 尻尾（大きく曲がる）
  p.line(19, 16, 22, 10, fur, 2);
  p.line(22, 10, 20, 6, fur, 2);
  // 胴（座り姿勢）
  p.ellipse(13, 16, 6, 5, fur);
  // 頭
  p.ellipse(9, 8, 4, 3.5, fur);
  // 耳（三角）
  p.line(6, 5, 7, 2, fur, 2);
  p.line(12, 5, 11, 2, fur, 2);
  // 縞
  p.speckle(8, 12, 11, 8, furD, 0.2, 5);
  p.rect(14, 13, 1, 3, furD);
  p.rect(16, 14, 1, 3, furD);
  // 首の金属輪
  p.rect(6, 11, 7, 2, ring);
  p.set(9, 13, ring);
  // 目（細め）
  p.rect(7, 7, 1, 1, '#f0e090');
  p.rect(10, 7, 1, 1, '#f0e090');
  // 前脚
  p.rect(8, 17, 2, 4, fur);
  p.rect(11, 18, 2, 3, fur);
  p.outline(OUT);
  return p;
}

// コウモリ+ランプ: 尾が古いランプ
function lampbat(): Px {
  const p = new Px(24, 24);
  const wing = '#4a3a6a';
  const wingD = '#332a4a';
  const body = '#5a4a7a';
  const gold = '#c8a040';
  const glow = '#ffe070';
  // 翼（角張った幅広）
  p.line(2, 6, 9, 9, wing, 3);
  p.line(2, 6, 3, 12, wing, 2);
  p.line(3, 12, 9, 11, wing, 2);
  p.line(22, 6, 15, 9, wing, 3);
  p.line(22, 6, 21, 12, wing, 2);
  p.line(21, 12, 15, 11, wing, 2);
  p.rect(4, 7, 6, 4, wing);
  p.rect(14, 7, 6, 4, wing);
  p.speckle(3, 6, 18, 6, wingD, 0.3, 9);
  // 胴
  p.ellipse(12, 10, 3, 4, body);
  // 耳
  p.line(10, 5, 9, 3, body, 2);
  p.line(14, 5, 15, 3, body, 2);
  // 発光器官（胸）
  p.set(12, 9, glow);
  // 目
  p.set(11, 7, glow);
  p.set(13, 7, glow);
  // 尾ランプ
  p.line(12, 14, 12, 16, gold);
  p.rect(10, 16, 5, 5, gold);
  p.rect(11, 17, 3, 3, glow);
  p.set(12, 22, gold);
  p.outline(OUT);
  return p;
}

// モグラ+鉱物: 岩盤の背、水晶の爪
function gansekimogura(): Px {
  const p = new Px(24, 24);
  const fur = '#6a5244';
  const rock = '#8a8a92';
  const rockD = '#5f5f66';
  const crystal = '#9ad8e8';
  // 胴（ドーム）
  p.ellipse(12, 15, 9, 7, fur);
  // 背の岩盤
  p.rect(5, 8, 5, 3, rock);
  p.rect(10, 6, 6, 4, rock);
  p.rect(16, 8, 4, 3, rock);
  p.rect(8, 10, 9, 2, rockD);
  // 鼻先
  p.ellipse(4, 16, 2, 1.5, '#c88a80');
  // 目（小さい）
  p.set(7, 13, OUT);
  // 水晶の爪（大きな前脚）
  p.line(4, 19, 2, 22, crystal, 2);
  p.line(6, 20, 5, 23, crystal, 2);
  p.line(8, 20, 8, 23, crystal, 2);
  p.line(18, 20, 19, 23, crystal, 2);
  p.line(20, 19, 22, 22, crystal, 2);
  p.speckle(6, 12, 13, 8, '#55423a', 0.2, 13);
  p.outline(OUT);
  return p;
}

// 歯車+猟犬型機械: 縦長センサーの顔
function gearhound(): Px {
  const p = new Px(24, 24);
  const metal = '#6a7282';
  const metalD = '#474e5c';
  const gear = '#8a929e';
  const sensor = '#20e0c8';
  // 胴（箱型）
  p.rect(6, 10, 12, 6, metal);
  p.rect(6, 10, 12, 2, gear);
  // 歯車関節（肩・腰）
  gearCircle(p, 7, 15, 2, gear, metalD);
  gearCircle(p, 16, 15, 2, gear, metalD);
  // 脚（角張り）
  p.line(6, 17, 4, 21, metalD, 2);
  p.line(9, 17, 9, 22, metalD, 2);
  p.line(15, 17, 15, 22, metalD, 2);
  p.line(18, 17, 20, 21, metalD, 2);
  // 首と頭（縦長センサー）
  p.rect(3, 6, 4, 6, metal);
  p.rect(3, 4, 4, 2, metalD);
  p.rect(4, 5, 2, 6, metalD);
  p.rect(4, 6, 2, 1, sensor);
  p.set(4, 8, sensor);
  // アンテナ尾
  p.line(18, 10, 21, 6, metalD);
  p.set(21, 5, '#e05050');
  p.outline(OUT);
  return p;
}

function gearCircle(p: Px, cx: number, cy: number, r: number, c: string, cD: string): void {
  p.ellipse(cx, cy, r, r, c);
  p.set(cx, cy, cD);
  p.set(cx + r, cy, cD);
  p.set(cx - r, cy, cD);
  p.set(cx, cy + r, cD);
  p.set(cx, cy - r, cD);
}

// ボスの根
function balgrowRoot(): Px {
  const p = new Px(24, 24);
  const root = '#7a5434';
  const rootD = '#553a22';
  const tip = '#7ac858';
  p.line(12, 23, 10, 14, root, 4);
  p.line(10, 14, 13, 6, root, 3);
  p.line(13, 6, 11, 2, root, 2);
  p.line(10, 16, 5, 12, root, 2);
  p.line(5, 12, 3, 8, root, 2);
  p.line(12, 12, 18, 10, root, 2);
  p.line(18, 10, 21, 5, root, 2);
  p.speckle(2, 2, 20, 21, rootD, 0.3, 17);
  // 先端の芽
  p.set(11, 1, tip);
  p.set(10, 2, tip);
  p.set(3, 7, tip);
  p.set(21, 4, tip);
  p.set(22, 5, tip);
  // 棘
  p.set(8, 17, rootD);
  p.set(14, 9, rootD);
  p.outline(OUT);
  return p;
}

// ボス: 巨大な鹿。枯れ木と菌類の大角、腹に空洞の森
function balgrow(): Px {
  const p = new Px(32, 32);
  const body = '#6a5a48';
  const bodyD = '#4a3e32';
  const antler = '#9a9282';
  const fungus = '#d88a3a';
  const hollow = '#1a2418';
  const glow = '#50e878';
  // 大角（左右非対称・枯れ木）
  p.line(10, 8, 6, 2, antler, 2);
  p.line(8, 5, 4, 4, antler);
  p.line(9, 3, 11, 1, antler);
  p.line(20, 8, 25, 1, antler, 2);
  p.line(23, 4, 27, 3, antler);
  p.line(24, 2, 22, 0, antler);
  p.line(26, 5, 29, 6, antler);
  // 角の菌類（オレンジの棚キノコ）
  p.set(6, 3, fungus);
  p.set(24, 3, fungus);
  p.set(27, 4, fungus);
  p.rect(25, 2, 2, 1, fungus);
  // 頭（下向きの長い顔）
  p.rect(13, 7, 6, 7, body);
  p.rect(14, 13, 4, 3, bodyD);
  // 目（緑の光・左右）
  p.set(13, 9, glow);
  p.set(18, 9, glow);
  // 首→胴
  p.rect(11, 13, 12, 5, body);
  p.ellipse(16, 21, 11, 7, body);
  p.speckle(6, 15, 21, 12, bodyD, 0.25, 23);
  // 腹の空洞（うつろな森 + 環晶の光）
  p.ellipse(16, 22, 6, 4, hollow);
  p.set(14, 21, glow);
  p.set(18, 23, glow);
  p.set(16, 20, '#2f4a2c');
  p.line(13, 24, 15, 21, '#2f4a2c');
  p.line(19, 25, 18, 21, '#2f4a2c');
  // 脚（長い4本）
  p.rect(7, 26, 2, 6, bodyD);
  p.rect(12, 27, 2, 5, bodyD);
  p.rect(19, 27, 2, 5, bodyD);
  p.rect(24, 26, 2, 6, bodyD);
  // 背の苔
  p.speckle(8, 14, 16, 3, '#4a6a3a', 0.4, 29);
  p.outline(OUT);
  return p;
}
