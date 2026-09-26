// セーブデータを ファイルに ほぞんする（こわれないように いちど べつの ファイルに かいてから おきかえる）
import fs from 'node:fs';
import path from 'node:path';
import { SAVE_VERSION } from '../public/js/shared/world/save.js';

export class FileStorage {
  constructor(dir) {
    this.dir = dir;
    this.file = path.join(dir, 'save.json');
    this.backupDir = path.join(dir, 'backups');
    this.lastBackup = 0;
    fs.mkdirSync(this.backupDir, { recursive: true });
  }

  load() {
    for (const f of [this.file, this.file + '.bak']) {
      try {
        if (!fs.existsSync(f)) continue;
        const text = fs.readFileSync(f, 'utf8');
        const data = JSON.parse(text);
        // むかしの 形の セーブは、新しい 形に する まえに まるごと とっておく（1回だけ）
        if (data?.characters && (Number(data.version) || 1) < SAVE_VERSION) this.backupOnce(`before-v${SAVE_VERSION}`, text);
        return data;
      } catch (e) {
        console.error(`セーブデータの読みこみに失敗: ${f}`, e.message);
      }
    }
    return {};
  }

  // その ときの バックアップ（引っこしコードで 入れかえる まえ など）
  backup(label, text) {
    try {
      const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
      fs.writeFileSync(path.join(this.backupDir, `save-${label}-${stamp}.json`), text);
      // スマホと 合わせる まえの バックアップは よく できるので、新しい 30こだけ のこす
      if (label === 'before-sync') {
        const files = fs.readdirSync(this.backupDir).filter((f) => f.startsWith('save-before-sync-')).sort();
        while (files.length > 30) fs.unlinkSync(path.join(this.backupDir, files.shift()));
      }
    } catch { /* */ }
  }

  // label の バックアップが まだ なければ つくる
  backupOnce(label, text) {
    try {
      if (fs.readdirSync(this.backupDir).some((f) => f.startsWith(`save-${label}`))) return;
      const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
      fs.writeFileSync(path.join(this.backupDir, `save-${label}-${stamp}.json`), text);
    } catch { /* */ }
  }

  save(data) {
    const json = JSON.stringify(data);
    const tmp = this.file + '.tmp';
    fs.writeFileSync(tmp, json);
    if (fs.existsSync(this.file)) {
      try { fs.copyFileSync(this.file, this.file + '.bak'); } catch { /* */ }
    }
    fs.renameSync(tmp, this.file);
    // 1じかんに 1かい バックアップ（さいしん 24こ）
    const now = Date.now();
    if (now - this.lastBackup > 60 * 60 * 1000) {
      this.lastBackup = now;
      const stamp = new Date(now).toISOString().replace(/[:T]/g, '-').slice(0, 16);
      try {
        fs.writeFileSync(path.join(this.backupDir, `save-${stamp}.json`), json);
        // じどうの バックアップ（save-2026-…）だけ 24こに へらす。ひっこし・バージョンアップ まえの ものは のこす
        const files = fs.readdirSync(this.backupDir).filter((f) => /^save-\d/.test(f)).sort();
        while (files.length > 24) fs.unlinkSync(path.join(this.backupDir, files.shift()));
      } catch { /* */ }
    }
  }
}
