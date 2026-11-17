/* 📖 取説（菱熱の画面だけ・2026-11-17）
 *  上の「📖 取説」→ 章と知りたいことを選ぶ → 実際の画面の上で、場所を光らせて順に案内する（チュートリアル）。
 *  案内の途中で編集パネルなどを開くが、保存はしない（最後に閉じる）。
 *  新しい章・項目を足したら GUIDE_VERSION を上げ、その項目に isNew: true を付ける（取説ボタンに「新」の印が付く）。
 */
(function () {
  const GUIDE_VERSION = 1;
  const SEEN_KEY = 'guideSeenV';
  const $ = (id) => document.getElementById(id);
  const vis = (el) => !!el && el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden';
  const q = (sel) => { const list = document.querySelectorAll(sel); for (const el of list) if (vis(el)) return el; return null; };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---- 画面を動かす小さな手順（保存はしない） ----
  const modalOpen = () => $('modal') && !$('modal').classList.contains('hidden');
  const A = {
    closeAll: async () => {
      document.querySelectorAll('.kt-overlay').forEach((x) => { if (x.id !== 'guideIndex') x.remove(); });
      if (modalOpen() && $('cancelBtn')) { $('cancelBtn').click(); await wait(150); }
      ['moreMenu', 'userMenu'].forEach((id) => { const m = $(id); if (m && !m.classList.contains('hidden')) m.classList.add('hidden'); });
    },
    openNew: async () => { await A.closeAll(); if ($('newCaseBtn')) $('newCaseBtn').click(); await wait(300); },
    openFirst: async () => {
      if (modalOpen()) return;
      await A.closeAll();
      const b = q('#casesBody .row-edit-btn');
      if (b) { b.click(); await wait(400); }
    },
    openMore: async () => { const m = $('moreMenu'); if (m && m.classList.contains('hidden')) $('moreMenuBtn').click(); await wait(150); },
    openUser: async () => { const m = $('userMenu'); if (m && m.classList.contains('hidden')) $('userMenuBtn').click(); await wait(150); }
  };

  // ---- 章と項目（steps: sel＝光らせる場所、t＝説明、before＝その前に画面を動かす） ----
  const STATUS_FLOW = '受付 → 見積り中 → 見積り提出済 → （日程調整中）→ 作業中 → 対応済み → 請求済 → 入金済';
  const CHAPTERS = [
    { id: 'flow', title: '🗂 案件の流れ（登録から完了まで）', items: [
      { id: 'new', title: '案件を新しく登録する', steps: [
        { sel: '#newCaseBtn', t: 'まず「＋ 新規登録」を押します。メール・LINE から AI が作ることもあります（「📨 自動取り込み」の章）。' },
        { before: A.openNew, sel: '#company', t: '会社を選びます。上の会社ボタンで1社に絞っていると、最初からその会社になっています。' },
        { sel: '#theater', t: '劇場名を打ちます。候補は選んだ会社の劇場だけ（閉館は出ません）。短い名前（例「日比谷」）でOK。保存の時に正式名にそろえます。一覧にない名前なら「新しい劇場として登録しますか？」と聞きます（新店の時）。' },
        { sel: '#rPerson', t: 'R担当者は、上の担当者ボタンの人から選びます。それ以外の名前は保存できません（担当者を足す時は ☰ その他 →「🗂 マスター編集」）。' },
        { sel: '#category', t: '種別を選びます。「修理」の時だけ、遅れの色（黄・赤）が付きます（「一覧の使い方」の章）。' },
        { sel: '#content', t: '内容は客先にも見えます。社内メモを書くと、AI が客先向けにまとめてここに入れます（紫の欄＝AI が入れる欄）。' },
        { sel: '#caseTitle', t: '案件名は「どこでどうなった」だけの短い名前です。空のまま保存すると AI が付けます。「🤖 内容から作る」でもすぐ作れます。' },
        { sel: '#memo', t: '社内メモは客先には見えません。「保留」と書くとステータスが保留になります。' },
        { sel: '#caseForm button[type="submit"]', t: '最後に「保存」。客先への通知メールの対象なら、5分後にまとめて送られます（今回は案内なので保存しません）。', after: A.closeAll }
      ] },
      { id: 'status', title: 'ステータスが変わっていく流れ', steps: [
        { t: 'ステータスは、日付を入れると自動で変わります。\n' + STATUS_FLOW + '\n入れる日付の順に見ていきます。' },
        { before: A.openNew, sel: '#surveyDate', t: '① 調査日を入れて、その日が来ると「見積り中」。（何も入っていない間は「受付」）' },
        { sel: '#quoteDate', t: '② 見積り提出日が来ると「見積り提出済」（一覧で青い文字）。' },
        { sel: '#workStartDate', t: '③ 作業開始日が来ると「作業中」。日にちが決まらない時は「0」と打つと「日程調整中」になります。' },
        { sel: '#workEndDate', t: '④ 作業完了日を入れると「対応済み」。見積りが0円（無償）なら「完了」。' },
        { sel: '#invoiceDate', t: '⑤ 請求書発行日を入れると「請求済」。' },
        { sel: '#paymentDate', t: '⑥ 入金日を入れると「入金済」（一覧の「予定／確認」で、確認済みの時だけ入金済）。' },
        { sel: '#memo', t: '社内メモか内容に「保留」と書くと、日付より先に「保留」になります。' },
        { before: A.closeAll, sel: '#casesBody .status-pick', t: '取り下げ・失注・完了などは、一覧のステータスを押して手で選びます（先頭の「自動」で自動に戻ります）。' },
        { sel: '#statusVisBtn', t: '完了・入金済などの終わった案件は、最初は一覧に出ません。「表示する状態」で出せます。' }
      ] }
    ] },
    { id: 'docs', title: '📎 見積書・作業申請書', items: [
      { id: 'quote', title: '見積書を案件に付けて客先に送る', isNew: true, steps: [
        { before: A.openFirst, sel: '#caseMailSec', t: '案件を ✎ で開くと、下の方に「書類・通知メール」の欄があります（菱熱だけ）。' },
        { sel: '#cmTo', t: 'ここに、だれに送るかが出ます（劇場のアドレス・案件の担当者・ベルを押した人）。テスト中は、テストの宛先だけに送ります。' },
        { sel: '#caseMailSec .cm-upload label:first-child', t: '「📎 見積書を付けて送る」でファイル（PDF・Excel など）を選びます。確かめのあと、5分後にまとめて客先に送ります（添付つき）。間違えたら、送る前なら 🗑 で外せば送りません。' },
        { sel: '#cmLog', t: '送ったメール・客先からの返信は「メールの記録」に残ります。返信はその案件の更新としても取り込みます。', after: A.closeAll }
      ] },
      { id: 'workapp', title: '作業申請書を付ける・完成にする', isNew: true, steps: [
        { before: A.openFirst, sel: '#caseMailSec .cm-upload label:last-child', t: '「📎 作業申請書を付ける」で入れると「作成中」になります。まだ客先には送りません。' },
        { sel: '#cmFiles', t: '直し終わったら「✅ 完成（客先に送る）」を押すと、5分後に客先に送ります。' },
        { before: A.closeAll, t: '劇場ごとの作業申請書の書式は、書類棚の「📝 作業申請書の書式」に、劇場を選んで入れておきます。\n（内容と調査日から、劇場の書式で自動で作るしくみは、これから作ります）' }
      ] }
    ] },
    { id: 'intake', title: '📨 メール・LINE の自動取り込み', items: [
      { id: 'intake', title: 'AI が案件を作る・直すしくみ', steps: [
        { t: '客先とのメール、LINE、Plaud の記録を AI が読んで、新しい案件を作ったり、今の案件を直したりします（5分ごと）。' },
        { before: A.openFirst, sel: '#memo', t: '取り込んだ中身は社内メモに足されていきます（客先には見えません）。' },
        { sel: '#content', t: '社内メモが変わると、AI が客先向けに「内容」をまとめ直します。紫の欄（🤖・📨）が、AI も入れる欄です。' },
        { before: A.closeAll, sel: '#intakeBtn', t: '新しい案件か、今の案件の続きか AI が迷った時は「🆕 登録確認」に入ります。ここで選んでください（無い時はボタンが出ません）。' },
        { sel: '#theaterPendingBtn', t: '劇場の情報（担当・設備など）が変わりそうな時は「🔎 劇場情報更新確認」に入ります（無い時はボタンが出ません）。' }
      ] }
    ] },
    { id: 'mail', title: '📨 通知メールとベル', items: [
      { id: 'mail', title: '客先への通知メールのしくみ', isNew: true, steps: [
        { sel: '#mailSetBtn', t: '「📨 メール通知設定」で、今テスト中か本番か、どのアドレスから送っているかが分かります。' },
        { t: '通知メールは、菱熱がアプリで次のことをした時に、5分後にまとめて1通で送ります。\n・内容を書いた ・作業開始日を入れた ・見積書を付けた ・作業申請書を完成にした\nメール・LINE の取り込み（AI）や客先のメモでは送りません。' },
        { t: '宛先は、①その劇場のアドレス（必ず）②案件の客先担当者と同じ担当者名のアドレス（必ず）③ベルを押した人。菱熱には送りません（LINE の通知があるため）。' },
        { t: '客先の画面では、✎ の横にベル 🔔 が出ます。本社の人などが押すと、その案件の通知が届くようになります。劇場・担当の案件は必ず届くので押せません。' },
        { sel: '#mailSetBtn', t: 'テスト中は、テスト劇場の案件だけを、テストの宛先だけに送ります。本番にするのは、客先アカウント（劇場のアドレス）を入れてからです。' }
      ] }
    ] },
    { id: 'list', title: '📋 一覧の使い方', items: [
      { id: 'filters', title: '絞り込み・色の意味・その場で直す', isNew: true, steps: [
        { before: A.closeAll, sel: '#rPersonBar', t: '担当者ボタンで、その人の案件だけにします（複数押せます）。異動・退職の人に未完了の案件があると「⚠ n件」のボタンが出ます。押して別の人に付け替えます。' },
        { sel: '#companyBar', t: '会社ボタンで会社を絞ります。列の絞り込みの候補も、その会社の案件の値だけになります。' },
        { sel: '#theadRow .th-filter[data-filter="theater"]', t: '列の名前を押すと、その列の値で絞り込めます（Excel と同じ）。値の文字を押すと、それだけに絞ります。見出しの 🤖・📨 は AI も入れる列です。' },
        { sel: '#casesBody tr[data-case-id]', t: '行の左の色: 黄＝修理で受付から3営業日たっても調査日が無い、黄緑＝見積り中、赤＝調査から3営業日たっても見積りが出ていない、青い文字＝見積り提出済・客先対応中。' },
        { sel: '#casesBody td.editable', t: 'セルをダブルクリックすると、その場で直せます。全部の項目は左の ✎ から。' },
        { sel: '#searchBox', t: '上の検索欄で、劇場名・担当者・内容などから探せます。' }
      ] }
    ] },
    { id: 'other', title: '🧰 マスター・その他の機能', items: [
      { id: 'other', title: 'マスター編集・客先アカウント・書類棚など', isNew: true, steps: [
        { before: A.openMore, sel: '#masterBtn', t: '「🗂 マスター編集」: R担当者（在籍・異動・退職・メールアドレス・並び）と、会社・劇場（客先マスター）を直します。' },
        { before: A.openMore, sel: '#custAccountsBtn', t: '「📧 客先アカウント」: 劇場のアドレスと担当者名を入れます（TOHO からの一覧を Excel・CSV で読み込めます）。通知メールの宛先になります。' },
        { before: A.openMore, sel: '#koteiBtn', t: '「📁 書類棚」: 工程表・写真台帳・空調負荷計算・作業申請書の書式を、会社・劇場ごとのフォルダにしまいます。' },
        { before: A.openMore, sel: '#planBtn', t: '「🗓 工事予定表」: 案件から工事の予定を引っ張って、Excel のように並べます。' },
        { before: A.openUser, sel: '#meetingBtn', t: '右上の 👤 →「🤝 打合せモード」: 客先と一緒に画面を見る時に、その会社の客先の見え方にします。終わる時はタブを閉じてもOKです。', after: A.closeAll }
      ] }
    ] }
  ];

  // ---- 取説ボタンの「新」の印 ----
  function seenVersion() { try { return Number(localStorage.getItem(SEEN_KEY) || 0); } catch (e) { return 0; } }
  function markSeen() { try { localStorage.setItem(SEEN_KEY, String(GUIDE_VERSION)); } catch (e) {} renderBadge(); }
  function renderBadge() { const b = $('guideNewBadge'); if (b) b.classList.toggle('hidden', seenVersion() >= GUIDE_VERSION); }

  // ---- 章を選ぶ画面 ----
  function openIndex() {
    document.querySelectorAll('#guideIndex').forEach((x) => x.remove());
    const isNewVer = seenVersion() < GUIDE_VERSION;
    const ov = document.createElement('div'); ov.className = 'kt-overlay'; ov.id = 'guideIndex';
    ov.innerHTML = `<div class="kt-dialog kt-dialog-mid gd-index"><div class="kt-dlg-head">📖 取説：知りたいことを選んでください<button type="button" class="close-btn" data-x>×</button></div>
      <div class="kt-dlg-body"><p class="gd-note">選ぶと、実際の画面の上で順に案内します（保存はしません）。途中で「終わる」を押せばいつでもやめられます。</p>
      ${CHAPTERS.map((c) => `<div class="gd-ch"><div class="gd-ch-t">${c.title}</div>${c.items.map((it) => `<button type="button" class="gd-item" data-gch="${c.id}" data-git="${it.id}">▶ ${it.title}${it.isNew && isNewVer ? ' <span class="gd-new">新</span>' : ''}<span class="gd-n">${it.steps.length} ステップ</span></button>`).join('')}</div>`).join('')}
      </div><div class="kt-dlg-foot"><button type="button" data-x>閉じる</button></div></div>`;
    document.body.appendChild(ov);
    ov.addEventListener('click', (e) => {
      if (e.target.closest('[data-x]') || e.target === ov) { ov.remove(); markSeen(); return; }
      const b = e.target.closest('[data-git]'); if (!b) return;
      const ch = CHAPTERS.find((c) => c.id === b.dataset.gch); const it = ch && ch.items.find((x) => x.id === b.dataset.git);
      ov.remove(); markSeen();
      if (it) setTimeout(() => start(it), 0);
    });
  }

  // ---- チュートリアル（場所を光らせて、吹き出しで案内） ----
  let T = null;
  function ensureLayer() {
    let spot = $('gdSpot'), tip = $('gdTip');
    if (!spot) { spot = document.createElement('div'); spot.id = 'gdSpot'; document.body.appendChild(spot); }
    if (!tip) { tip = document.createElement('div'); tip.id = 'gdTip'; document.body.appendChild(tip); }
    return { spot, tip };
  }
  async function start(item) {
    T = { item, i: 0 };
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', place);
    await show();
  }
  async function stop() {
    const it = T && T.item; T = null;
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('resize', place);
    ['gdSpot', 'gdTip'].forEach((id) => { const x = $(id); if (x) x.remove(); });
    if (it) await A.closeAll();
  }
  function onKey(e) {
    if (!T) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); stop(); }
    else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); go(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  }
  async function go(d) {
    if (!T) return;
    const cur = T.item.steps[T.i];
    if (d > 0 && cur && cur.after) await cur.after();
    if (!T) return;
    const n = T.i + d;
    if (n >= T.item.steps.length) { await stop(); return; }
    if (n < 0) return;
    T.i = n; await show();
  }
  async function show() {
    if (!T) return;
    const st = T.item.steps[T.i];
    const run = T;   // 途中で「終わる」・Esc が押されたら、ここで止める
    if (st.before) { try { await st.before(); } catch (e) {} }
    if (T !== run) return;
    const { tip } = ensureLayer();
    const n = T.item.steps.length;
    tip.innerHTML = `<div class="gd-tip-h">${T.item.title}<span>${T.i + 1} / ${n}</span></div>
      <div class="gd-tip-t">${String(st.t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>')}</div>
      <div class="gd-tip-f"><button type="button" data-gd="end">終わる</button><span></span>
        <button type="button" data-gd="prev"${T.i === 0 ? ' disabled' : ''}>← 前へ</button>
        <button type="button" class="primary" data-gd="next">${T.i === n - 1 ? '終わる ✓' : '次へ →'}</button></div>`;
    tip.onclick = (e) => {
      const b = e.target.closest('[data-gd]'); if (!b) return;
      // 押した「次へ」のクリックが終わってから進める（☰ などの開いたメニューが「外を押した」と思って閉じないように）
      const act = b.dataset.gd;
      setTimeout(() => { if (act === 'end') stop(); else go(act === 'next' ? 1 : -1); }, 0);
    };
    const el = st.sel ? q(st.sel) : null;
    T.el = el;
    if (el) { el.scrollIntoView({ block: 'center', inline: 'nearest' }); await wait(120); }
    if (T !== run) return;
    place();
    const nx = tip.querySelector('[data-gd="next"]'); if (nx) nx.focus();
  }
  function place() {
    if (!T) return;
    const { spot, tip } = ensureLayer();
    const el = T.el && document.body.contains(T.el) && vis(T.el) ? T.el : null;
    const W = window.innerWidth, H = window.innerHeight;
    if (!el) {
      spot.className = 'gd-spot gd-full';
      spot.style.cssText = '';
      tip.className = 'gd-tip gd-center';
      tip.style.left = Math.max(12, (W - Math.min(460, W - 24)) / 2) + 'px'; tip.style.top = Math.max(12, H / 2 - 120) + 'px';
      return;
    }
    const r = el.getBoundingClientRect(), pad = 6;
    spot.className = 'gd-spot';
    Object.assign(spot.style, { left: (r.left - pad) + 'px', top: (r.top - pad) + 'px', width: (r.width + pad * 2) + 'px', height: (r.height + pad * 2) + 'px' });
    tip.className = 'gd-tip';
    const tw = Math.min(420, W - 24); tip.style.width = tw + 'px';
    const th = tip.offsetHeight || 180;
    let top = r.bottom + 12; if (top + th > H - 8) top = r.top - th - 12; if (top < 8) top = Math.min(H - th - 8, Math.max(8, r.top + 12));
    let left = r.left; if (left + tw > W - 12) left = W - tw - 12; if (left < 12) left = 12;
    tip.style.left = left + 'px'; tip.style.top = top + 'px';
  }

  document.addEventListener('DOMContentLoaded', renderBadge);
  window.GUIDE = { open: openIndex, renderBadge, chapters: CHAPTERS, start: (ch, it) => { const c = CHAPTERS.find((x) => x.id === ch); const i = c && c.items.find((x) => x.id === it); if (i) start(i); }, stop };
})();
