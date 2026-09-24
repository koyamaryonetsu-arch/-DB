// セーブデータを ファイルに ほぞんする（こわれないように いちど べつの ファイルに かいてから おきかえる）
import fs from 'node:fs';
import path from 'node:path';

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
        if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'));
      } catch (e) {
        console.error(`セーブデータの よみこみに しっぱい: ${f}`, e.message);
      }
    }
    return {};
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
        const files = fs.readdirSync(this.backupDir).filter((f) => f.startsWith('save-')).sort();
        while (files.length > 24) fs.unlinkSync(path.join(this.backupDir, files.shift()));
      } catch { /* */ }
    }
  }
}
