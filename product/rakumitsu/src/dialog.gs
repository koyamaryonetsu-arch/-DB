/** 対話フロー：メモ受信 → 下書き更新 → 聞き返し → 確認 → 発行 */

var STATE_SHEET = '_状態';

function emptyDraft_() {
  return { client: null, honorific: '様', items: [], taxIncluded: null };
}

function getStateSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(STATE_SHEET);
  if (!sh) {
    sh = ss.insertSheet(STATE_SHEET);
    sh.appendRow(['userId', 'stateJson', 'updated']);
    sh.hideSheet();
  }
  return sh;
}

function loadState_(userId) {
  var sh = getStateSheet_();
  var values = sh.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === userId) {
      try { return { row: i + 1, state: JSON.parse(values[i][1]) }; } catch (e) { break; }
    }
  }
  return { row: null, state: { draft: emptyDraft_(), lastDoc: null } };
}

function saveState_(userId, loaded) {
  var sh = getStateSheet_();
  var json = JSON.stringify(loaded.state);
  if (loaded.row) {
    sh.getRange(loaded.row, 2, 1, 2).setValues([[json, new Date()]]);
  } else {
    sh.appendRow([userId, json, new Date()]);
  }
}

var HELP_TEXT = [
  '【ラクミツの使い方】',
  'メモを送るだけで見積書・請求書PDFを作ります。',
  '',
  '例：',
  '田中様',
  'エアコンクリーニング 2台 15000ずつ',
  '出張費 3000',
  '',
  '↓ 確認が返ってきたら',
  '「OK」→ 見積書PDF',
  '「請求書にして」→ 請求書PDF',
  '',
  'その他のことば：',
  '・「◯◯様」…宛名を設定',
  '・「値引き 2000」…マイナス行',
  '・「※軽減」…その行を8%に',
  '・「税込」…金額を税込として扱う',
  '・「クリア」…下書きをやり直し',
  '・「設定」…事業者情報の確認',
  '',
  '事業者名・インボイス登録番号・振込先はスプレッドシートの「設定」タブで登録してください。'
].join('\n');

function handleText_(userId, text, replyToken) {
  var t = String(text || '').trim();
  var loaded = loadState_(userId);
  var state = loaded.state;
  if (!state.draft) state.draft = emptyDraft_();

  // --- コマンド ---
  if (/^(ヘルプ|へるぷ|help|使い方)$/i.test(t)) return replyText_(replyToken, HELP_TEXT);

  if (/^設定$/.test(t)) return replyText_(replyToken, configSummaryText_());

  if (/^(クリア|やり直し|リセット)$/.test(t)) {
    state.draft = emptyDraft_();
    saveState_(userId, loaded);
    return replyText_(replyToken, '下書きをクリアしました。新しいメモをどうぞ。');
  }

  if (/^(OK|ok|確定|はい|発行)$/.test(t)) {
    return issueAndReply_(userId, loaded, 'quote', replyToken);
  }

  if (/^請求書(にして|作成|発行)?$/.test(t)) {
    if (!state.draft.items.length && state.lastDoc && state.lastDoc.draft) {
      state.draft = state.lastDoc.draft; // 直近の見積を請求書に変換
    }
    return issueAndReply_(userId, loaded, 'invoice', replyToken);
  }

  if (/^見積書(にして|作成|発行)?$/.test(t)) {
    return issueAndReply_(userId, loaded, 'quote', replyToken);
  }

  // --- メモとして解析して下書きに反映 ---
  var parsed = RakuParser.parseMemo(t);
  if (!parsed.items.length && !parsed.client && parsed.taxIncluded === null) {
    return replyText_(replyToken, '読み取れませんでした。「ヘルプ」で使い方を表示します。');
  }
  if (parsed.client) { state.draft.client = parsed.client; state.draft.honorific = parsed.honorific; }
  if (parsed.taxIncluded !== null) state.draft.taxIncluded = parsed.taxIncluded;
  state.draft.items = state.draft.items.concat(parsed.items);
  saveState_(userId, loaded);

  var msgs = [RakuParser.summaryText(state.draft)];
  var unknown = RakuParser.unknownAmountItems(state.draft.items);
  if (unknown.length) {
    msgs.push('❓ 金額を教えてください：' + unknown.join('、') + '（例：' + unknown[0] + ' 5000）');
  } else if (!state.draft.client) {
    msgs.push('❓ 宛名がまだです（例：田中様）。このままでよければ「OK」で見積書を作成します。');
  } else {
    msgs.push('このままでよければ「OK」→見積書 ／ 「請求書にして」→請求書。追記はそのまま送信、やり直しは「クリア」。');
  }
  return replyText_(replyToken, msgs.join('\n\n'));
}

function issueAndReply_(userId, loaded, type, replyToken) {
  var state = loaded.state;
  var draft = state.draft;

  if (!draft.items.length) {
    return replyText_(replyToken, 'まだ明細がありません。メモを送ってください（「ヘルプ」で例を表示）。');
  }
  var unknown = RakuParser.unknownAmountItems(draft.items);
  if (unknown.length) {
    return replyText_(replyToken, '金額が未定の品目があります：' + unknown.join('、') + '\n「' + unknown[0] + ' 5000」のように金額を送ってください。金額の行を消したい場合は「クリア」でやり直せます。');
  }

  var result = issueDocument_(type, draft);

  state.lastDoc = { type: type, number: result.number, draft: draft };
  state.draft = emptyDraft_();
  saveState_(userId, loaded);

  var label = type === 'invoice' ? '請求書' : '見積書';
  var lines = [
    '✅ ' + label + 'を作成しました',
    '番号：' + result.number,
    '宛名：' + (draft.client ? draft.client + ' ' + (draft.honorific || '様') : '（未設定）'),
    '合計：¥' + RakuParser.yen(result.totals.total) + '（税込）',
    '',
    'PDF：' + result.url,
    '（リンクを知っている人が閲覧できます。そのままお客様に転送できます）'
  ];
  if (result.warnings.length) {
    lines.push('', '⚠️ 確認してください：', '・' + result.warnings.join('\n・'));
  }
  if (type === 'quote') {
    lines.push('', 'この内容で請求書にするには「請求書にして」と送ってください。');
  }
  return replyText_(replyToken, lines.join('\n'));
}
