// three.js の つかう ぶぶん だけを 1つの ファイルに まとめる（かいはつ むけ）
// つかいかた:
//   npm i --no-save three@0.186.1 esbuild@0.25.10
//   node tools/build-three.mjs
// → public/vendor/three.min.js（ゲームは この ファイルだけで うごく。インターネットは いらない）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entry = `export {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, InstancedMesh, BufferGeometry, BufferAttribute, Float32BufferAttribute,
  MeshBasicMaterial, CanvasTexture, NearestFilter, SRGBColorSpace, RepeatWrapping, ClampToEdgeWrapping, Fog, Color, Vector3, Matrix4, Object3D,
  Sprite, SpriteMaterial, IcosahedronGeometry, ConeGeometry, BoxGeometry, CylinderGeometry, CircleGeometry, PlaneGeometry,
  DoubleSide, FrontSide, Quaternion, Euler, REVISION,
} from 'three';`;

const out = await build({
  stdin: { contents: entry, resolveDir: ROOT, loader: 'js' },
  bundle: true, format: 'esm', minify: true, legalComments: 'none', write: false,
});
const header = '/* three.js r186 (https://threejs.org) — MIT License, Copyright 2010-2026 three.js authors.\n   このゲームで つかう ぶぶん だけを esbuild で まとめた もの（tools/build-three.mjs） */\n';
const file = path.join(ROOT, 'public', 'vendor', 'three.min.js');
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, header + out.outputFiles[0].text);
console.log('wrote', path.relative(ROOT, file), Math.round(fs.statSync(file).size / 1024) + 'KB');
