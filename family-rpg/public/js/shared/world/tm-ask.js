// 第89回: 宝の地図が いっぱいの 時に「どれを 捨てるか えらんで いる」ことを サーバーが 知る しくみ
// 家族の 声:「宝の地図を捨てるタイミングがおかしいです。もらったタイミングで捨てるものを選ばせて。」
//   ・新しい 地図は「あずかり」（c.tmPending。world/treasure.js の grantTreasureMap）。もらった その 場で 聞く
//     （戦いの けっかの 中・だいほんの 'tmAsk'・ダイゴの 会話の 中。client/ui/treasure.js の askTreasureList）
//   ・聞いて いる 人は s.tmAsk。ほかに する ことが ない 時は s.busy = 'tmfull'（ほかの 人の 戦い・だいほんに まきこまれない。魔物にも 当たらない）
//   ・えらぶ（捨てる・あきらめる）と すぐ 動ける（world/treasure.js の treasureMenu から tmHold）
//   ・通信が 切れて のこった あずかりは、次に 世界に 入った すぐに 聞く（world.js の onPlay・resumeSession・resync）
//   ほかの ファイルを 読まない（scripts.js・battles.js・world.js から 使う。読みこみの わを 作らない）

export const hasPending = (s) => Array.isArray(s?.char?.tmPending) && s.char.tmPending.length > 0;

// 聞いて いる 人を「えらんで いる」に する（ひまな 時だけ）。あずかりが なくなったら 動ける ように もどす
//   quiet … 画面へ 'tmAsk' を 送らない（戦いの けっかの 中で 聞く 時。battles.js の finishBattle）
export function tmHold(world, s, { quiet = false } = {}) {
  if (!s) return false;
  if (!hasPending(s)) {
    s.tmAsk = false;
    if (s.busy === 'tmfull') s.busy = null;
    return false;
  }
  if (!s.tmAsk || !s.inWorld) return false;
  if (s.busy && s.busy !== 'tmfull') return false;
  const fresh = s.busy !== 'tmfull';
  s.busy = 'tmfull';
  s.moving = false;
  if (fresh && !quiet) world.send(s, { t: 'tmAsk', pend: s.char.tmPending });
  return true;
}

// あずかりが あれば 聞きはじめる（世界に 入った・つなぎなおした）。もう「えらんで いる」なら 聞きなおす
export function tmAskBegin(world, s) {
  if (!hasPending(s)) return tmHold(world, s);
  s.tmAsk = true;
  if (s.busy === 'tmfull') {
    world.send(s, { t: 'tmAsk', pend: s.char.tmPending });
    return true;
  }
  return tmHold(world, s);
}
