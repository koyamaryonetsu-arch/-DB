// 家族サーバー: スマホと やりとりした キャラの 版を おぼえておく（kizuna-save/sync/<キャラのID>.json）
// （sync.js が「わかれる まえ」の キャラを さがす ときに つかう）
import fs from 'node:fs';
import path from 'node:path';
import { pruneEntries } from '../public/js/shared/world/sync.js';

const ID = /^[A-Za-z0-9_-]{1,40}$/;

export function fileSyncStore(dir, max = 12) {
  const cache = new Map();
  const file = (id) => path.join(dir, `${id}.json`);
  return {
    entries(id) {
      if (!ID.test(id)) return [];
      if (cache.has(id)) return cache.get(id);
      let list = [];
      try {
        list = JSON.parse(fs.readFileSync(file(id), 'utf8'));
      } catch { /* まだ ない */ }
      if (!Array.isArray(list)) list = [];
      cache.set(id, list);
      return list;
    },
    add(id, entry) {
      if (!ID.test(id)) return;
      const list = pruneEntries([entry, ...this.entries(id)], max);
      cache.set(id, list);
      try {
        fs.mkdirSync(dir, { recursive: true });
        const tmp = `${file(id)}.tmp`;
        fs.writeFileSync(tmp, JSON.stringify(list));
        fs.renameSync(tmp, file(id));
      } catch (e) {
        console.error('版の記録に失敗:', e.message);
      }
    },
  };
}
