// index.html に うめこむ 起動の しくみ（server/stamp.js の stampHtml が 入れる）
//
// 1. https（や この PC）で Service Worker が 使える 時だけ、SW に「版 v を 用意して」と たのむ
//    → SW は 持っていない ファイルだけを 取りに 行く（少なければ 1つずつ・多ければ パック 1本）
//    → 読みこみ中は「読みこみ中（42%）」を 出す
// 2. できたら（または だめでも）ふつうに js/main.js?v=<版> を 読む
//
// 安全の ための きまり（SW は 加速だけ。家族が 遊べなく なるのが 最悪）:
// ・SW が ない・http・はじめての 訪問で SW が すぐ 動かない・返事が 来ない・エラー → すぐ ふつうに 読む
// ・止める スイッチ: アドレスに ?nopack ／ localStorage.kizuna_nopack = '1'
// ・この 関数は 文字に して index.html に 入れるので、外の 変数を 使わない（c だけ）
export function kizunaBoot(c) {
  var w = window, d = document, started = false, timer = 0;
  // はかる ための しるし（tools/load-measure.mjs が 読む）
  var mark = w.__kzBoot = { at: performance.now(), how: 'plain', log: [] };
  function note(t) { mark.log.push(Math.round(performance.now()) + ' ' + t); }
  var box = d.getElementById('boot');
  function show(t) { if (box) box.textContent = t; }
  function start() {
    if (started) return;
    started = true;
    clearTimeout(timer);
    mark.start = performance.now();
    note('start');
    var s = d.createElement('script');
    s.type = 'module';
    s.src = 'js/main.js?v=' + c.v;
    s.onerror = function () { if (w.kizunaBootFail) w.kizunaBootFail(); };
    d.body.appendChild(s);
  }
  // 返事が 来なければ ふつうに 読む（ms の あいだ 何も 来ない 時）
  function wait(ms) { clearTimeout(timer); timer = setTimeout(start, ms); }
  try {
    var off = /[?&]nopack(=|&|$)/.test(location.search);
    try { off = off || localStorage.getItem('kizuna_nopack') === '1'; } catch (e) { /* */ }
    var sw = navigator.serviceWorker;
    if (!c.pack || !w.isSecureContext || !sw || !w.MessageChannel || !w.caches) return start();
    var ask = function (ctl) {
      var ch = new w.MessageChannel();
      ch.port1.onmessage = function (e) {
        var m = e.data || {};
        if (m.t !== 'kz-progress') note(m.t);
        if (m.t === 'kz-ack') wait(c.idle || 8000);
        else if (m.t === 'kz-progress') {
          wait(c.idle || 8000);
          if (m.total > 0) show('読みこみ中（' + Math.min(99, Math.floor((m.done / m.total) * 100)) + '%）');
        } else if (m.t === 'kz-done') { mark.how = m.off ? 'off' : m.ok ? 'pack' : 'fail'; start(); }
      };
      // 古い SW（この しくみが ない）だと 返事が 来ないので、すぐに あきらめる
      mark.how = 'wait';
      wait(c.ack || 1500);
      ctl.postMessage({ t: off ? 'kz-off' : 'kz-prepare', v: c.v }, [ch.port2]);
    };
    if (sw.controller) return ask(sw.controller);
    // SW が まだ ない: はじめての 訪問。登録して、すぐ 動けば たのむ（だめなら ふつうに）
    if (off || !c.sw) return start();
    wait(c.claim || 4000);
    sw.addEventListener('controllerchange', function () { note('controller'); if (!started && sw.controller) ask(sw.controller); });
    sw.register(c.sw).then(function (reg) {
      // もう 動いているのに この ページを 見ていない（強い 読みこみ直し など）: またない
      if (reg.active && !reg.installing && !reg.waiting && !sw.controller) start();
    }, start);
  } catch (e) {
    start();
  }
}
