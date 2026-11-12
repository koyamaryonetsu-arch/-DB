// 第77回 D: 設定 →「音楽を聞く」（聞いた ことの ある 曲の 一覧。新しい音 ／ 前の音 の 聞きくらべ。場面で かわる 音楽を ためす）
//   曲を えらぶと 鳴る。強さ・ピンチ・だん・昼と夜・まわりの音は 新しい音で 次の 小節から かわる
//   タッチ・マウス・キーボード・コントローラー どれでも（ListMenu。左右で 強さ・だんを かえる）
//   とじると ためした 場面の 音楽を もとに もどして、今の 場所の 曲に もどる
import { el, ListMenu } from './dom.js?v=9a5805f1f322';
import { TRACK_IDS } from '../audio.js?v=9a5805f1f322';
import { trackName, AMBIENCE_NAMES } from '../audio-names.js?v=9a5805f1f322';
import { AMBIENCES } from '../music-amb.js?v=9a5805f1f322';

const Z = 8;
const INT_STEPS = [0, 0.25, 0.5, 0.75, 1];

const CSS = `
.sound-test { width: min(94vw, 520px); }
.sound-test .menu { overflow-y: auto; min-height: 0; }
.sound-test .item.st-ctl > .l { color: var(--accent); }
.sound-test .item.st-now > .r { color: var(--accent); }
.sound-test .st-note { white-space: pre-line; }
`;

function addCss() {
  if (typeof document === 'undefined' || document.getElementById('soundtest-css')) return;
  const st = document.createElement('style');
  st.id = 'soundtest-css';
  st.textContent = CSS;
  document.head.append(st);
}

export function openSoundTest(g) {
  addCss();
  return new Promise((resolve) => {
    const au = g.audio;
    const sfx = (x) => au?.sfx(x);
    const before = { amb: au.ambience, tod: au.adaptive.want.tod, autoResume: au.autoResume };
    // ジングルの あとに 前の 曲へ もどらない（えらんだ 曲だけ 鳴らす）
    au.autoResume = false;
    const st = { intensity: 1, pinch: false, phase: 0, tod: before.tod, amb: null };
    let playing = null;
    const heard = () => au.heardTracks();
    const ids = () => TRACK_IDS.filter((id) => id in heard());
    const bars = (v) => '■'.repeat(Math.round(v * 4)) + '□'.repeat(4 - Math.round(v * 4));
    const rows = () => {
      const h = heard();
      const list = ids();
      const items = [
        { label: playing ? `止める（${trackName(playing, h)}）` : '止める', value: 'stop', cls: 'st-ctl' },
        { label: `音：${au.engineMode === 'old' ? '前の音' : '新しい音'}`, right: '聞きくらべ', value: 'mode', cls: 'st-ctl' },
        { label: `強さ：${bars(st.intensity)}`, right: '◀▶', value: 'int', cls: 'st-ctl' },
        { label: `ピンチ：${st.pinch ? 'ON' : 'OFF'}`, value: 'pinch', cls: 'st-ctl' },
        { label: `だん：${st.phase + 1}`, right: '◀▶', value: 'phase', cls: 'st-ctl' },
        { label: `昼と夜：${st.tod === 'night' ? '夜' : '昼'}`, value: 'tod', cls: 'st-ctl' },
        { label: `まわりの音：${st.amb ? AMBIENCE_NAMES[st.amb] : 'なし'}`, right: '◀▶', value: 'amb', cls: 'st-ctl' },
        { header: true, label: `曲（${list.length}/${TRACK_IDS.length}曲）` },
      ];
      if (!list.length) items.push({ label: 'まだ聞いた曲がない', value: 'none', disabled: true });
      for (const id of list) items.push({ label: trackName(id, h), right: id === playing ? '♪' : '', value: `tr:${id}`, cls: id === playing ? 'st-now' : '' });
      return items;
    };
    const back = el('div', { class: 'modal-back', style: { zIndex: Z }, onclick: () => { sfx('cancel'); close(); } });
    const box = el('div', { class: 'win panel center-panel sound-test', style: { zIndex: Z + 1, background: 'var(--win-solid)' } },
      el('div', { class: 'small gold', text: `音楽を聞く（${ids().length}/${TRACK_IDS.length}曲）` }));
    const apply = () => {
      au.setIntensity(st.intensity);
      au.setPinch(st.pinch);
      au.setPhase(st.phase);
      au.setTimeOfDay(st.tod);
    };
    const play = (id) => {
      playing = id;
      au.play(id, { force: true });
      // 曲が かわると ピンチ・だんは もとに もどるので、えらんで いる 値を もう一度
      apply();
    };
    const change = (v, d) => {
      if (v === 'int') st.intensity = INT_STEPS[Math.max(0, Math.min(INT_STEPS.length - 1, INT_STEPS.indexOf(st.intensity) + d))];
      else if (v === 'phase') st.phase = Math.max(0, Math.min(3, st.phase + d));
      else if (v === 'amb') {
        const list = [null, ...AMBIENCES];
        st.amb = list[(list.indexOf(st.amb) + d + list.length) % list.length];
        au.playAmbience(st.amb);
      } else return false;
      apply();
      return true;
    };
    const m = new ListMenu(g.input, {
      items: rows(),
      back: '閉じる',
      sound: sfx,
      onSelect: (it) => act(it.value),
      onCancel: () => close(),
      onSide: (d) => {
        const it = m.items[m.idx];
        if (it && change(it.value, d)) {
          sfx('cursor');
          refresh();
        }
      },
    });
    const note = el('div', { class: 'detail small st-note', text: '曲を選ぶと鳴る（聞いたことのある曲だけ）。「音」で新しい音と前の音を聞きくらべられる。\n強さ・ピンチ・だん・昼と夜・まわりの音は、新しい音で次の小節から変わる（ゲームの場面で変わる音楽のためし）。' });
    box.append(m.root, note);
    document.getElementById('ui').append(back, box);
    m.focus();
    const refresh = () => {
      if (!box.isConnected) return;
      const idx = m.idx;
      m.setItems(rows());
      m.idx = Math.min(idx, m.items.length - 1);
      m.render();
    };
    const act = (v) => {
      if (v === 'stop') {
        playing = null;
        au.stop(0.3);
      } else if (v === 'mode') {
        au.setEngineMode(au.engineMode === 'old' ? 'new' : 'old');
        if (playing) apply();
      } else if (v === 'pinch') {
        st.pinch = !st.pinch;
        apply();
      } else if (v === 'tod') {
        st.tod = st.tod === 'night' ? 'day' : 'night';
        apply();
      } else if (!change(v, 1) && typeof v === 'string' && v.startsWith('tr:')) {
        play(v.slice(3));
      }
      refresh();
    };
    const close = () => {
      m.blur();
      back.remove();
      box.remove();
      // ためした ことを もとに もどす
      au.adaptive.byTrack.clear();
      au.setTimeOfDay(before.tod);
      au.setIntensity(1);
      au.setPinch(false);
      au.setPhase(0);
      au.playAmbience(before.amb);
      au.autoResume = before.autoResume;
      au.resumeTrack = null;
      let bgm = null;
      try { bgm = g.field?.areaBgm?.(); } catch { /* */ }
      if (bgm) au.play(bgm, { force: true });
      else au.stop(0.3);
      resolve();
    };
  });
}
