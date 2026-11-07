// ★ためし用（第67回 A班）: B班の サーバーの 窓口（svc kind:'monarena'）が まとまる 前に、受付の 画面を 見る ための にせの へんじ。
//   globalThis.__monarenaStub = true の 時だけ ui/monarena.js が 読む（ふだんは 読まない）。
//   B班の しょりを まとめたら、この ファイルと ui/monarena.js の svc() の 中の 2行を けす。
const MONS = [
  ['k1', 'プルル', 'pururin', 14, 96, 20, 38, 30, 34, 'party'],
  ['k2', 'ツノスケ', 'tsunousagi', 13, 88, 12, 44, 26, 40, 'party'],
  ['k3', 'キノピー', 'kobushi', 12, 102, 8, 41, 35, 22, 'wagon'],
  ['k4', 'コウモン', 'koumorin', 11, 70, 24, 33, 22, 52, 'wagon'],
  ['k5', 'ゴブ太', 'goblin', 15, 120, 10, 50, 38, 30, 'storage'],
  ['k6', 'ウルフィ', 'wolf', 16, 128, 6, 58, 34, 48, 'storage'],
  ['k7', 'ランプちゃん', 'lamp', 10, 64, 40, 28, 20, 36, 'storage'],
  ['k8', 'チビドラ', 'chibi_dragon', 18, 150, 30, 62, 44, 41, 'party'],
].map(([key, name, species, level, hp, mp, atk, def, agi, where]) => ({ key, name, species, level, hp, mp, atk, def, agi, where }));

const state = { team: ['k8', 'k1', 'k2', 'k3'], reg: ['k6', 'k5'] };

export function monarenaStub(game, msg) {
  const ok = (extra = {}) => Promise.resolve({ ok: true, text: '', ...extra });
  switch (msg.action) {
    case 'status':
      return ok({
        ranks: [
          { rank: 'F', name: 'ランクF', open: true, cleared: true, lv: 8, hint: '初めての人むけ。' },
          { rank: 'E', name: 'ランクE', open: true, cleared: false, lv: 14, hint: 'すばやい魔物が多い。' },
          { rank: 'D', name: 'ランクD', open: false, cleared: false, lv: 20, hint: '第2章の船を手に入れると開く。' },
          { rank: 'C', name: 'ランクC', open: false, cleared: false, lv: 28, hint: '第3章を進めると開く。' },
          { rank: 'B', name: 'ランクB', open: false, cleared: false, lv: 36, hint: '第4章を進めると開く。' },
          { rank: 'A', name: 'ランクA', open: false, cleared: false, lv: 45, hint: '第5章を進めると開く。' },
          { rank: 'S', name: 'ランクS', open: false, cleared: false, lv: 55, hint: '第1部をクリアすると開く。' },
        ],
        team: [...state.team], reg: [...state.reg], monsters: MONS.map((m) => ({ ...m })),
        family: [
          { charId: 'fam_papa', name: 'お父さん', reg: [{ species: 'golem', name: 'ゴーレム', level: 22 }, { species: 'wolf', name: 'ガルル', level: 20 }, { species: 'lamp', name: 'ランプ', level: 18 }, { species: 'crow', name: 'カーくん', level: 19 }] },
          { charId: 'fam_kid', name: 'ゆうと', reg: [{ species: 'pururin', name: 'ぷるちゃん', level: 9 }, { species: 'fuwari', name: 'ふわふわ', level: 8 }] },
          { charId: 'fam_none', name: 'お母さん', reg: [] },
          { charId: game.me?.id, name: game.me?.name || '自分', reg: [{ species: 'wolf', name: 'ウルフィ', level: 16 }] },
        ],
      });
    case 'setTeam': state.team = [...msg.team]; return ok();
    case 'register': state.reg = [...msg.team]; return ok({ text: 'チームを登録したよ！（ためし）' });
    case 'rank': case 'family':
      globalThis.__monarenaStubLast = { ...msg };
      return Promise.resolve({ ok: false, text: `（ためし）${msg.action}を送った: ${msg.team.join(',')}` });
    default: return Promise.resolve({ ok: false, text: '' });
  }
}
