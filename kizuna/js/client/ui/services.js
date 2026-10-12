// お店・転職・酒場・でんごんばん・ほしのかけら・きょうかい の がめん
import { el, ListMenu, toast, askText, confirmBox, esc } from './dom.js?v=20d81aa120cb';
import { ITEMS } from '../../shared/data/items.js?v=20d81aa120cb';
import { JOBS, SUPER_ORDER, LEGEND_ORDER, TIER_ORDERS, TIER_NAMES, JOB_MAX_LEVEL, jobReqText, jobReqSets, jobBodyOk, BODY_NAMES, JOB_HINTS, superMasteredCount } from '../../shared/data/jobs.js?v=20d81aa120cb';
import { ABILITIES } from '../../shared/data/abilities.js?v=20d81aa120cb';
import { salonUI } from './salon.js?v=20d81aa120cb';
import { itemCount, learnedAbilities, jobUnlocked, jobProgress, jobKnown, jobMastered, canEquip } from '../../shared/stats.js?v=20d81aa120cb';
import { MONSTERS } from '../../shared/data/monsters.js?v=20d81aa120cb';
import { MONSTER_FRIENDS, BREED_MIN_LEVEL, RACE_NAMES, breedOutcome, breedRumors } from '../../shared/data/companions.js?v=20d81aa120cb';
import { TACTICS } from '../../shared/ai.js?v=20d81aa120cb';
import { itemDetail, gearText } from './info.js?v=20d81aa120cb';
import { playerSprite, followerSprite, faceURL } from '../field.js?v=20d81aa120cb';
import { shopUI, churchUI } from './shop.js?v=20d81aa120cb';
import { bankUI } from './bank.js?v=20d81aa120cb';
import { forgeUI } from './forge.js?v=20d81aa120cb';
import { tavernWagonItems, tavernWagonOpts, tavernWagonAct, tavernPlace, arrangeUI } from './wagon.js?v=20d81aa120cb';
import { casinoUI } from './casino.js?v=20d81aa120cb';
import { sdBoardUI } from './secret.js?v=20d81aa120cb';
import { shownEquip } from '../../shared/look-equip.js?v=20d81aa120cb';
import { jobAskText } from '../../shared/data/job-talk.js?v=20d81aa120cb';
import { sortRoster, rosterSortName, nextRosterSort } from '../../shared/roster-sort.js?v=20d81aa120cb';
import { rosterSortPref, setRosterSortPref } from '../prefs.js?v=20d81aa120cb';

export function openServiceUI(game, kind, data) {
  switch (kind) {
    case 'shop': return shopUI(game, data);
    case 'jobChange': return jobUI(game);
    case 'tavern': return tavernUI(game, data);
    case 'salon': return salonUI(game, data);
    case 'board': return boardUI(game, data);
    case 'starTrade': return starUI(game, data);
    case 'church': return churchUI(game, data);
    case 'bank': return bankUI(game, data);
    case 'forge': return forgeUI(game, data);
    // カジノ・メダル王（ui/casino.js）
    case 'casino': case 'medalKing': return casinoUI(game, kind, data);
    // ひみつのダンジョンの 家族の記録の板（ui/secret.js）
    case 'sdBoard': return sdBoardUI(game, data);
    default: return Promise.resolve();
  }
}

// サーバーの へんじを まつ
function request(game, msg) {
  return new Promise((resolve) => {
    game.svcWaiter = resolve;
    game.net.send({ t: 'svc', ...msg });
    setTimeout(() => {
      if (game.svcWaiter === resolve) {
        game.svcWaiter = null;
        resolve({ ok: false, text: '通信がおくれています' });
      }
    }, 6000);
  });
}

// お店などの まど。みぎうえの「✕ とじる」と そとの タップで とじる（s.onClose を よぶ）
function shell(title, extraCls = '') {
  const backdrop = el('div', { class: 'modal-back' });
  const root = el('div', { class: `panel center-panel svc-panel ${extraCls}` });
  const right = el('span', { class: 'svc-right' });
  const s = { root, right, onClose: null };
  const userClose = () => {
    if (!s.onClose) return;
    s.game?.audio.sfx('cancel');
    s.onClose();
  };
  const closeBtn = el('button', { class: 'btn closebtn', text: '✕ 閉じる', 'aria-label': '閉じる', onclick: userClose });
  const head = el('div', { class: 'win svc-head' }, el('span', { class: 'gold', text: title }), right, closeBtn);
  const body = el('div', { class: 'fmenu' });
  root.append(head, body);
  backdrop.addEventListener('click', userClose);
  document.getElementById('ui').append(backdrop, root);
  // s.root.remove() で うしろの まくも いっしょに けす
  const removeRoot = root.remove.bind(root);
  root.remove = () => {
    backdrop.remove();
    removeRoot();
  };
  return Object.assign(s, { head, body });
}

// ───────────── 転職 ─────────────
function jobUI(game) {
  return new Promise((resolve) => {
    const s = shell('星の神殿 ― 転職', 'job-panel');
    s.game = game;
    const side = el('div', { class: 'win side scroll job-list' });
    const main = el('div', { class: 'win main scroll' });
    s.body.append(side, main);
    // だれが 転職する？（じぶん と 酒場の なかま。モンスターは 転職できない）
    let who = 'self';
    const mates = () => (game.party?.supports || []).filter((x) => x.kind === 'npc' && x.owner === game.me.id);
    const target = () => {
      if (who === 'self') return { name: game.me.name, job: game.me.job, jobs: game.me.jobs, look: game.me.look, equip: game.me.equip, lookEquip: game.me.lookEquip };
      return mates().find((x) => x.key === who) || null;
    };
    const whoRow = el('div', { class: 'who-list' });
    const renderWho = () => {
      whoRow.innerHTML = '';
      const list = [{ key: 'self', name: game.me.name }, ...mates()];
      if (list.length < 2) return;
      for (const m of list) {
        whoRow.append(el('button', {
          class: `btn ${who === m.key ? 'sel' : ''}`, text: m.name,
          onclick: () => { who = m.key; renderWho(); menu.setItems(render()); showJob(menu.current?.value || target().job); },
        }));
      }
    };
    const render = () => {
      if (!target()) who = 'self';
      const c = target();
      s.right.textContent = `${c.name}: ${JOBS[c.job]?.name || ''}`;
      const out = [];
      TIER_ORDERS.forEach((all, tier) => {
        // 体で なれない 職業（フルーツジッパー・アラシ）は 出さない
        const order = all.filter((j) => jobBodyOk(j, c.look));
        const open = order.filter((j) => jobUnlocked(c, j)).length;
        out.push({ header: true, label: tier ? `${TIER_NAMES[tier]}（なれる ${open}/${order.length}）` : TIER_NAMES[tier] });
        // 超級職は ヒントが 出るまで ひみつ
        const known = order.filter((j) => jobKnown(c, j));
        const secret = order.length - known.length;
        for (const j of known) {
          const ok = jobUnlocked(c, j);
          const lv = c.jobs?.[j]?.lv || 0;
          out.push({
            html: ok ? esc(JOBS[j].name) : `<span class="muted">🔒 ${esc(JOBS[j].name)}</span>`,
            right: !ok ? '' : lv >= JOB_MAX_LEVEL ? '★マスター' : lv ? `Lv${lv}` : '初めて',
            rightCls: lv >= JOB_MAX_LEVEL ? 'gold' : '',
            value: j,
            disabled: !ok,
            cls: j === c.job ? 'good' : '',
          });
        }
        if (secret) out.push({ html: `<span class="muted">？？？　×${secret}</span>`, right: 'ひみつ', value: '__secret', disabled: true });
      });
      return out;
    };
    const menu = new ListMenu(game.input, {
      items: render(),
      sound: (x) => game.audio.sfx(x),
      onMove: (it) => showJob(it.value),
      // 左右で せつめいの まどを スクロール（覚える技を 最後まで 見られる）
      onSide: (d) => { main.scrollBy({ top: d * main.clientHeight * 0.7, behavior: 'smooth' }); },
      onSelect: async (it) => {
        const c = target();
        if (!c) return;
        if (it.value === c.job) {
          toast('今の職業です');
          return;
        }
        menu.blur();
        // 第27回: かくにんは 1行（今の 職業の レベルが のこる ことは 下の せつめいに ある）
        const ok = await confirmBox(game.input, jobAskText(JOBS[it.value].name, who === 'self' ? null : c.name), 'はい', 'いいえ', (x) => game.audio.sfx(x));
        if (ok) {
          const r = await request(game, { kind: 'jobChange', job: it.value, who });
          if (r.ok) {
            game.audio.sfx('join');
            if (who === 'self') game.field.flashLocal?.();
          }
          toast(r.text || '');
          // なかまの じょうほうが とどくのを すこし まつ
          setTimeout(() => { menu.setItems(render()); showJob(it.value); }, 150);
        }
        menu.focus();
      },
      back: null,
      onCancel: () => close(),
    });
    const close = () => {
      menu.blur();
      s.root.remove();
      resolve();
    };
    s.onClose = close;
    side.append(menu.root);
    const showJob = (j) => {
      const c = target();
      if (j === '__secret' && c) {
        main.innerHTML = '';
        main.append(whoRow);
        renderWho();
        main.append(el('h3', { text: '？？？' }), el('div', { class: 'small gold', text: `${TIER_NAMES[2]}・${TIER_NAMES[3]}` }),
          el('div', { class: 'detail', text: 'まだだれも知らない、ひみつの職業。\n上級職をマスターすると、その先の職業のヒントがここに出てくる。' }));
        // うわさ: もとの 職業を はじめた ひみつの 職業だけ（名前は ださない）
        const rumors = [...SUPER_ORDER, ...LEGEND_ORDER].filter((s) => JOB_HINTS[s] && jobBodyOk(s, c.look) && !jobKnown(c, s)
          && jobReqSets(s).some((set) => set.some((r) => c.jobs?.[r])));
        if (rumors.length) {
          const box = el('div', { class: 'small job-rumor' }, el('div', { class: 'gold', text: '神殿のうわさ' }));
          for (const s of rumors) box.append(el('div', { class: 'jl-desc', text: `・${JOB_HINTS[s]}` }));
          main.append(box);
        }
        return;
      }
      const job = JOBS[j];
      if (!job || !c) return;
      const lv = c.jobs?.[j]?.lv || 0;
      const open = jobUnlocked(c, j);
      main.innerHTML = '';
      main.append(whoRow);
      renderWho();
      // その 職業で そうびできない ものは はずした すがた（転職した あとの みため）
      // 見た目装備は 職業に 関係なく そのまま（shared/look-equip.js）
      const eq = shownEquip({ equip: Object.fromEntries(Object.entries(c.equip || {}).map(([k, v]) => [k, v && canEquip(j, v) ? v : null])), lookEquip: c.lookEquip });
      const pv = playerSprite(c.look, j, 'down', 0, eq);
      const img = el('canvas', { width: pv.width, height: pv.height, style: { width: '64px', height: '84px', imageRendering: 'pixelated', float: 'right', opacity: open ? '1' : '0.45' } });
      img.getContext('2d').drawImage(pv, 0, 0);
      main.append(img, el('h3', { text: `${job.name}（${job.kana}）` }), el('div', { class: 'small gold', text: TIER_NAMES[job.tier || 0] }), el('div', { class: 'detail', text: job.desc }));
      // なる ための じょうけん・しゅぎょうの すすみぐあい
      // （まだ なれない 超級職は、マスターしていない じょうけんを ？？？？ に する）
      const secretReq = (job.tier || 0) >= 2 && !open;
      const reqName = (r) => (secretReq && !jobMastered(c, r) ? '？？？？' : JOBS[r].name);
      if (job.req) {
        const req = el('div', { class: 'small', style: { margin: '0.4em 0' } });
        req.append(el('div', { class: open ? 'good' : 'warn', text: open ? `なれる！（${jobReqText(j)}）` : `なるには: ${jobReqText(j, reqName)}` }));
        if (job.body !== undefined) req.append(el('div', { class: 'muted', text: `（${BODY_NAMES[job.body]}だけがなれる職業）` }));
        jobReqSets(j).forEach((set, i) => {
          if (i) req.append(el('div', { class: 'muted', text: '　または' }));
          for (const r of set) {
            const rl = c.jobs?.[r]?.lv || 0;
            const state = rl >= JOB_MAX_LEVEL ? '★マスター' : secretReq ? '' : rl ? `Lv${rl}/${JOB_MAX_LEVEL}` : 'まだなったことがない';
            req.append(el('div', { class: rl >= JOB_MAX_LEVEL ? 'good' : 'muted', text: `　${reqName(r)}　${state}` }));
          }
        });
        // 伝説の職業（ロトの勇者・スーパーサイヤ人3・ニカ）: ほかに マスターした 超級職の かず
        if (job.reqSuper) {
          const n = superMasteredCount(c.jobs, j);
          req.append(el('div', { class: n >= job.reqSuper ? 'good' : 'muted', text: `　ほかの超級職のマスター　${Math.min(n, job.reqSuper)}/${job.reqSuper}` }));
        }
        main.append(req);
      }
      if (open && lv) {
        const pg = jobProgress(c, j);
        main.append(el('div', { class: 'small', text: pg.done ? `職業レベル ${lv}（★マスター）` : `職業レベル ${lv}　次まであと${pg.next}回勝つ` }));
      }
      // のびざかり（学校の 職業）
      if (job.passive?.train > 1) main.append(el('div', { class: 'small good', text: `のびざかり：戦いに1回勝つと、${job.passive.train}回分の修行になる` }));
      // 覚える技（全部。どんな 技か 短い せつめいつき）→ 強さの かたむき の じゅん
      const learn = el('div', { class: 'small job-learn' });
      learn.append(el('div', { class: 'gold', text: `覚える技（職業レベル）　全${job.learn.length}こ` }));
      for (const [l, id] of job.learn) {
        const a = ABILITIES[id];
        const got = lv >= l;
        const row = el('div', { class: `jl-row ${got ? 'good' : 'muted'}` },
          el('span', { class: 'jl-lv', text: `Lv${l}` }),
          el('span', { class: 'jl-name', text: `${secretReq ? '？？？' : a.name}${got ? '（覚えた）' : ''}` }));
        if (!secretReq && a?.desc) row.append(el('div', { class: 'jl-desc', text: a.desc }));
        learn.append(row);
      }
      main.append(learn);
      const bars = el('div', { class: 'statbars', style: { margin: '0.5em 0' } });
      for (const [k, n] of [['hp', 'HP'], ['mp', 'MP'], ['str', '力'], ['def', '身の守り'], ['agi', '素早さ'], ['mag', '魔力'], ['heal', '回復']]) {
        const v = job.mods[k];
        bars.append(el('span', { text: n }), el('div', { class: 'b' }, el('i', { style: { width: `${Math.min(100, v / 1.5 * 100)}%` } })), el('span', { class: v > 1 ? 'up' : v < 1 ? 'down' : '', text: `${Math.round(v * 100)}%` }));
      }
      main.append(el('div', { class: 'small gold', text: '強さのかたむき' }), bars);
      main.append(el('div', { class: 'detail', text: `職業レベルは戦いに勝つと上がる（最大${JOB_MAX_LEVEL}）。職業ごとに別で、転職しても今の職業のレベルは残る。ただし、1回の攻撃で終わってしまう戦いでは、修行は半分しか進まない。\n基本職を2つマスターすると上級職、上級職をマスターすると超級職になれる（超級職は、上級職をマスターするとヒントが出る）。超級職をきわめた先には、伝説の職業もある（ロトの勇者・スーパーサイヤ人3・ニカ・魔王・天才しせつ管理者・はかい神・日の呼吸の使い手・七代目火影・暴れんぼう将軍・飛天御剣流けい承者）。\n呪文の掛け合わせは、元の職業を合わせ持つ上級職以上で使える。\n他の職業で覚えた技も使えるが、MPが増えたり威力が下がることがある（元になった職業の技はだいじょうぶ）。\n酒場の仲間もここで転職できる。\n（十字キーの左右で、このせつめいをスクロールできる）` }));
      // 下に つづく ときの しるし
      const more = el('div', { class: 'scroll-more', text: '▼ 下に続く' });
      main.append(more);
      const upd = () => { more.hidden = main.scrollTop + main.clientHeight >= main.scrollHeight - 4; };
      main.onscroll = upd;
      requestAnimationFrame(upd);
    };
    menu.focus();
  });
}

// ───────────── 酒場 ─────────────
// 第31回: 入口で「人間の仲間／モンスターの仲間／モンスターの配合」を えらぶ（人間と モンスターを 同じ 一覧に しない）
//   人間の仲間 … いっしょに いる 人・馬車・酒場で 待つ 人・新しい 仲間（レベル1から）・家族の キャラ
//   モンスターの仲間 … いっしょに いる 魔物・馬車・酒場で 待つ 魔物
//   モンスターの配合 … 配合だけの 画面。1ぴきめを えらぶと しるしが つき、2ひきめを えらぶと 配合へ
//     （2ひきめ から あとで やめても 1ぴきめは えらんだ まま。もどる で 1ぴきめを はずす）
function tavernUI(game, data) {
  return new Promise((resolve) => {
    const s = shell('仲間の酒場', 'tavern-panel');
    s.game = game;
    const titleEl = s.head.firstChild;
    const side = el('div', { class: 'win side scroll tavern-list' });
    const main = el('div', { class: 'win main scroll' });
    s.body.append(side, main);
    let info = data;
    const sfx = (x) => game.audio.sfx(x);
    const face = (e) => faceURL({ look: e.look, job: e.job, eq: shownEquip(e), mon: e.species || undefined });
    const who = (e) => (e.species ? `${MONSTERS[e.species]?.name || ''} Lv${e.level}` : `${JOBS[e.job]?.name || ''} Lv${e.level}`);
    const plusTag = (e) => (e.plus ? `<span class="plus">+${e.plus}</span>` : '');
    const ARRANGE_KEY = '#arrange';
    const SORT_KEY = '#sort';
    const V_HUMAN = '#v-human', V_MON = '#v-monster', V_BREED = '#v-breed';
    const TITLES = { top: '仲間の酒場', human: '酒場 ― 人間の仲間', monster: '酒場 ― モンスターの仲間', breed: '酒場 ― モンスターの配合' };
    // いまの 画面（'top' 入口 / 'human' / 'monster' / 'breed'）と 配合の 1ぴきめ
    let view = 'top';
    let topIdx = -1;
    let parentA = null;
    let sortMode = rosterSortPref();
    const byKey = () => {
      const m = new Map();
      for (const e of info.roster) m.set(e.key, { ...e, sec: 'roster' });
      for (const e of info.family) m.set(e.key, { ...e, sec: 'family' });
      for (const e of info.recruits) m.set(e.key, { ...e, sec: 'recruit' });
      return m;
    };
    let entries = byKey();
    const partyKeys = () => [...entries.values()].filter((e) => e.inParty).map((e) => e.key);
    const mons = () => info.roster.filter((e) => e.species);
    const ready = () => mons().filter((e) => e.level >= BREED_MIN_LEVEL);
    // 人間（酒場の 仲間・家族の キャラ）か モンスターか で わけた 一覧
    const ofKind = (monster) => new Map([...entries].filter(([, e]) => !!e.species === monster));
    const rowOf = (e, tags = '') => ({ face: face(e), html: `${esc(e.name)}${plusTag(e)} <span class="muted small">${who(e)}</span>${tags}`, value: e.key });
    const sortRow = (n) => (n > 1 ? [{ html: `ならび：<span class="gold">${rosterSortName(sortMode)}</span> <span class="muted small">（選ぶと変わる）</span>`, value: SORT_KEY }] : []);
    // 馬車の 仲間（ui/wagon.js）。人間・モンスターの 画面ごとに その 人だけ
    const wagonRows = (map, label) => {
      const out = tavernWagonItems(info, map, { face, who, plusTag });
      if (out[0]?.header) out[0].label = `${label}（${[...map.values()].filter((e) => e.inWagon).length}）　馬車${info.wagon.keys.length}/${info.wagon.max}`;
      return out;
    };
    const topItems = () => {
      const humans = info.roster.filter((e) => !e.species).length + info.family.length;
      const out = [
        { html: '<span class="gold">人間の仲間</span>', right: `${humans}人${info.recruits.length ? '・NEW' : ''}`, value: V_HUMAN },
        { html: '<span class="gold">モンスターの仲間</span>', right: `${mons().length}ひき`, value: V_MON },
        { html: '<span class="gold">モンスターの配合</span>', right: `Lv${BREED_MIN_LEVEL}+ ${ready().length}ひき`, value: V_BREED },
      ];
      const inParty = [...entries.values()].filter((e) => e.inParty);
      // 総入れかえ（パーティーと 馬車の ならびを まとめて 決める。ui/wagon.js）
      if (info.wagon && info.isLeader && inParty.length + info.wagon.keys.length > 0) {
        out.push({ html: '総入れかえ <span class="muted small">（まとめて決める）</span>', value: ARRANGE_KEY });
      }
      return out;
    };
    const humanItems = () => {
      const map = ofKind(false);
      const list = [...map.values()];
      const out = [];
      const inParty = list.filter((e) => e.inParty);
      out.push({ header: true, label: `いっしょにいる人間の仲間（${inParty.length}）` });
      if (!inParty.length) out.push({ label: '（今はだれもいない）', value: null, disabled: true });
      for (const e of inParty) out.push(rowOf(e, `${e.family ? `<span class="tag gold">${e.here ? '本人がいっしょ' : '家族'}</span>` : ''}${!e.active && !e.here ? '<span class="tag muted">今は待つ</span>' : ''}`));
      out.push(...wagonRows(map, '馬車の人間の仲間'));
      const waiting = sortRoster(info.roster.filter((e) => !e.species && !e.inParty && !e.inWagon), sortMode);
      if (waiting.length) {
        out.push({ header: true, label: `酒場で待っている仲間（${waiting.length}）` }, ...sortRow(waiting.length));
        for (const e of waiting) out.push(rowOf(e, e.hp <= 0 ? '<span class="tag warn">休んでいる</span>' : ''));
      }
      if (info.recruits.length) {
        out.push({ header: true, label: '新しい仲間を探す（レベル1から）' });
        for (const e of info.recruits) out.push(rowOf(e, '<span class="tag good">NEW</span>'));
      }
      const fam = info.family.filter((e) => !e.inParty && !e.inWagon);
      if (fam.length) {
        out.push({ header: true, label: '家族のキャラクター（サポート）' });
        for (const e of fam) out.push(rowOf(e));
      }
      return out;
    };
    const monsterItems = () => {
      const map = ofKind(true);
      const list = [...map.values()];
      const out = [];
      const inParty = list.filter((e) => e.inParty);
      out.push({ header: true, label: `いっしょにいるモンスター（${inParty.length}）` });
      if (!inParty.length) out.push({ label: '（今はいない）', value: null, disabled: true });
      for (const e of inParty) out.push(rowOf(e, !e.active ? '<span class="tag muted">今は待つ</span>' : ''));
      out.push(...wagonRows(map, '馬車のモンスター'));
      const waiting = sortRoster(list.filter((e) => !e.inParty && !e.inWagon), sortMode);
      out.push({ header: true, label: `酒場で待っているモンスター（${waiting.length}）　仲間${info.roster.length}/${info.rosterMax || info.roster.length}` });
      if (!list.length) out.push({ label: '（まだモンスターの仲間はいない）', value: null, disabled: true });
      out.push(...sortRow(waiting.length));
      for (const e of waiting) out.push(rowOf(e, e.hp <= 0 ? '<span class="tag warn">休んでいる</span>' : ''));
      return out;
    };
    const breedItems = () => {
      const A = parentA && entries.get(parentA);
      if (parentA && !A) parentA = null;
      const all = sortRoster(mons(), sortMode);
      const out = [{ header: true, label: A ? `2ひきめ：${A.name}の相手を選んでね` : '1ぴきめの親を選んでね（子は1ぴきめの系統）' }];
      if (ready().length < 2) out.push({ label: `レベル${BREED_MIN_LEVEL}以上のモンスターが2ひき必要だよ`, value: null, disabled: true });
      for (const e of all) {
        const low = e.level < BREED_MIN_LEVEL;
        const isA = e.key === parentA;
        out.push({
          face: face(e), html: `${isA ? '<span class="good">●</span> ' : ''}${esc(e.name)}${plusTag(e)} <span class="muted small">${who(e)}</span>`, value: e.key,
          disabled: low, right: isA ? '1ぴきめ' : low ? `Lv${BREED_MIN_LEVEL}から` : '', rightCls: isA ? 'good' : '', cls: isA ? 'breed-a' : '',
        });
      }
      // ならびは いちばん 下（カーソルは さいしょの 魔物から）
      out.push(...sortRow(all.length));
      return out;
    };
    const items = () => (view === 'human' ? humanItems() : view === 'monster' ? monsterItems() : view === 'breed' ? breedItems() : topItems());
    const partyText = () => {
      const n = Math.min(4, (info.humans || 1) + info.used);
      const wg = info.wagon ? `　馬車 ${info.wagon.keys.length}/${info.wagon.max}人` : '';
      return `パーティー ${n}/4人${wg}${info.isLeader ? '' : '（リーダーの仲間がついてくる）'}`;
    };
    const breedRules = () => el('div', { class: 'detail', text: [
      `レベル${BREED_MIN_LEVEL}以上のモンスター2ひきを掛け合わせて、新しいモンスターを生み出す。`,
      '・生まれた子はレベル1から。でも親の技を4つまで受けつげる',
      '・親の強さを少し受けつぎ、「+」の数が多いほどよく育つ',
      '・生まれる子は1ぴきめの親の系統（スライム系・けもの系など）。親のレベルが高いほど、強い魔物が生まれる',
      '・図鑑にのっていない魔物ほど生まれやすい。全部仲間にしたことがあれば、1ぴきめと同じ種族',
      '・決まった組み合わせだと、配合でしか生まれない魔物が生まれる',
      '・親の2ひきは旅立っていく（装備はふくろにもどる）',
    ].join('\n') });
    // 配合の 画面の 右（スマホの たてでは 下）: 1ぴきめ・2ひきめ と 生まれる 子の みほん
    const showBreed = (key) => {
      const A = parentA && entries.get(parentA);
      const X = key && key !== parentA ? entries.get(key) : null;
      main.append(el('div', { class: 'breed-slots' },
        el('span', { class: A ? 'gold' : 'muted', text: `1ぴきめ：${A ? A.name : '？'}` }),
        el('span', { class: A && X ? 'gold' : 'muted', text: `2ひきめ：${A && X ? X.name : '？'}` })));
      if (A && X) {
        const top = el('div', { class: 'breed-pv' });
        main.append(top);
        if (X.level < BREED_MIN_LEVEL) top.append(el('div', { class: 'small muted', text: `${X.name}はレベル${BREED_MIN_LEVEL}になると配合できる` }));
        else breedPreviewBox(top, A, X);
        main.append(el('div', { class: 'small muted', text: '選ぶと配合する（受けつぐ技と名前を決める）。\n「もどる」で1ぴきめを選びなおせる。' }));
        return;
      }
      const e = (key && entries.get(key)) || A;
      if (e && e.species) {
        main.append(el('div', { class: 'small gold', text: `${e.name}${e.plus ? ` ＋${e.plus}` : ''}（${who(e)}）` }));
        const learned = e.abilities || learnedAbilities({ species: e.species, level: e.level });
        main.append(el('div', { class: 'small', text: `技: ${learned.map((id) => ABILITIES[id]?.name).filter(Boolean).join('・') || 'なし'}` }));
        if (e.parents) main.append(el('div', { class: 'small muted', text: `親: ${e.parents.join(' ＋ ')}` }));
        main.append(el('div', { class: 'small muted', text: A ? '2ひきめにカーソルを合わせると、生まれる子がここに出る' : '選ぶと1ぴきめになる' }));
      }
      if (!A) {
        main.append(breedRules());
        // 酒場の うわさ（まだ 見たことがない 配合だけの 魔物の ヒント）
        const rumors = breedRumors(game.me, MONSTERS, 3);
        if (rumors.length) main.append(el('div', { class: 'small gold', text: '酒場のうわさ' }), el('div', { class: 'small detail', text: rumors.map((h) => `・？？？ … ${h}`).join('\n') }));
      }
    };
    const TOP_TEXT = {
      [V_HUMAN]: '人間の仲間と家族のキャラクター。連れていく・待ってもらう・新しい仲間を探す（レベル1から）。',
      [V_MON]: '魔物の仲間。連れていく・待ってもらう・名前を変える・別れる。',
      [V_BREED]: `レベル${BREED_MIN_LEVEL}以上のモンスター2ひきを掛け合わせて、新しいモンスターを生み出す。\n1ぴきめを選んでから、2ひきめを選ぶ。`,
    };
    const show = (key) => {
      main.innerHTML = '';
      if (view === 'breed' && key !== SORT_KEY) return showBreed(key);
      if (TOP_TEXT[key]) {
        main.append(el('h3', { text: { [V_HUMAN]: '人間の仲間', [V_MON]: 'モンスターの仲間', [V_BREED]: 'モンスターの配合' }[key] }), el('div', { class: 'detail', text: TOP_TEXT[key] }));
        if (key === V_BREED) {
          const rumors = breedRumors(game.me, MONSTERS, 3);
          if (rumors.length) main.append(el('div', { class: 'small gold', text: '酒場のうわさ' }), el('div', { class: 'small detail', text: rumors.map((h) => `・？？？ … ${h}`).join('\n') }));
        }
        return;
      }
      if (key === ARRANGE_KEY) {
        main.append(el('h3', { text: '総入れかえ' }), el('div', { class: 'detail', text: [
          'パーティーと馬車にいるみんなを、1番目から順番に選びなおす。',
          '・1〜4番目が戦う仲間（自分はかならずここに入る）',
          '・5〜8番目は馬車で待つ仲間（戦わなくても経験値をもらえる。洞窟や塔の中では半分）',
          '・酒場で待っている仲間とは、ひとりずつ入れかえよう',
        ].join('\n') }));
        return;
      }
      if (key === SORT_KEY) {
        main.append(el('h3', { text: '待っている仲間のならび' }), el('div', { class: 'detail', text: `今は「${rosterSortName(sortMode)}」。\n選ぶたびに、仲間になった順→種類順→レベル順と変わる。\n・種類順は、魔物は図鑑の順で、同じ種類はレベルの高い順\n・仲間は${info.rosterMax || 40}人（ひき）まで。いっぱいの時は、酒場でだれかと別れると、また仲間になる` }));
        return;
      }
      const e = entries.get(key);
      if (!e) {
        main.append(el('div', { class: 'detail', text: view === 'monster'
          ? `モンスターの仲間も、連れていくといっしょに戦ってくれる。\n待っている間の装備はふくろにもどる。${info.wagon ? `\n馬車には${info.wagon.max}人（ひき）まで乗れる。` : ''}`
          : `仲間を連れていくといっしょに戦ってくれる。\n連れていけるのは3人まで。待っている仲間とはいつでも入れかえられる（待っている間の装備はふくろにもどる）。${info.wagon ? `\n馬車には${info.wagon.max}人まで乗れる（装備はそのまま。戦わなくても経験値をもらえる。洞窟や塔の中では半分）。家族のキャラも乗れる。\nパーティーがいっぱいの時は、連れていく仲間は馬車に乗る。` : ''}` }));
        return;
      }
      const pv = e.species ? followerSprite({ mon: e.species }, 'down', 0) : playerSprite(e.look, e.job, 'down', 0, shownEquip(e));
      const img = el('canvas', { width: pv.width, height: pv.height, class: e.species ? 'tv-face' : 'tv-face hero' });
      img.getContext('2d').drawImage(pv, 0, 0);
      main.append(img, el('h3', { text: `${e.name}${e.plus ? ` ＋${e.plus}` : ''}` }), el('div', { class: 'small gold', text: e.sec === 'recruit' ? `${who(e)}（仲間になるとこのレベル）` : who(e) }));
      if (e.maxHp) main.append(el('div', { class: 'small', text: `HP ${Math.max(0, e.hp)}/${e.maxHp}　MP ${e.mp}/${e.maxMp}${e.tactics ? `　作戦: ${TACTICS[e.tactics]?.name || ''}` : ''}` }));
      if (e.sec === 'roster' && e.species) {
        const learned = e.abilities || learnedAbilities({ species: e.species, level: e.level });
        main.append(el('div', { class: 'small', text: `技: ${learned.map((id) => ABILITIES[id]?.name).filter(Boolean).join('・') || 'なし'}` }));
        main.append(el('div', { class: 'small', text: `装備できる物: ${gearText(e.species)}` }));
        if (e.parents) main.append(el('div', { class: 'small muted', text: `親: ${e.parents.join(' ＋ ')}` }));
        if (e.level < BREED_MIN_LEVEL) main.append(el('div', { class: 'small muted', text: `レベル${BREED_MIN_LEVEL}になると配合できる` }));
      }
      main.append(el('div', { class: 'detail', text: e.desc || '' }));
      if (e.sec === 'roster' && e.inParty && !e.active) main.append(el('div', { class: 'detail', text: '今はパーティーの人数がいっぱいなので待っている。' }));
      if (e.inWagon) main.append(el('div', { class: 'detail', text: e.family ? '馬車に乗っている。本人にも経験値のおすそわけが少し届く。' : '馬車に乗っている。戦いに出なくても、戦った仲間と同じ経験値をもらえる（洞窟や塔の中では半分）。' }));
      if (e.here) main.append(el('div', { class: 'detail', text: '今は本人がいっしょに遊んでいるので、うつしは待っている。' }));
    };
    const menu = new ListMenu(game.input, {
      items: items(),
      sound: sfx,
      onMove: (it) => show(it?.value),
      onSelect: (it) => act(it.value),
      back: null,
      onCancel: () => back(),
    });
    const refresh = (r) => {
      if (r?.tavern) {
        info = r.tavern;
        entries = byKey();
      }
      menu.setItems(items());
      s.right.textContent = partyText();
      show(menu.current?.value);
    };
    // 画面を かえる（入口に もどる ときは 前に えらんだ 行に）
    const setView = (v) => {
      if (view === 'top') topIdx = menu.idx;
      view = v;
      if (v !== 'breed') parentA = null;
      titleEl.textContent = TITLES[v];
      menu.back = v === 'top' ? null : 'もどる';
      menu.setItems(items(), false);
      if (v === 'top' && topIdx >= 0 && topIdx < menu.items.length) {
        menu.idx = topIdx;
        menu.render();
      }
      side.scrollTop = 0;
      show(menu.current?.value);
    };
    // もどる: 配合の 1ぴきめを はずす → 入口 → とじる
    const back = () => {
      if (view === 'breed' && parentA) {
        parentA = null;
        refresh();
        return;
      }
      if (view !== 'top') return setView('top');
      close();
    };
    const ask = (title, opts) => choose(game, title, opts);
    const doReq = async (msg) => {
      const r = await request(game, { kind: 'tavern', ...msg });
      toast(r.text || '');
      if (r.ok) sfx(msg.action === 'wait' || msg.action === 'release' ? 'leave' : msg.action === 'breed' ? 'bond' : 'join');
      refresh(r);
      return r;
    };
    // パーティーも 馬車も いっぱいの ときは だれと いれかわるか えらぶ（その 人は 酒場へ）
    const pickSwap = async (name) => {
      const cur = partyKeys().map((k) => entries.get(k)).filter(Boolean);
      const wg = (info.wagon?.keys || []).map((k) => entries.get(k)).filter(Boolean);
      const where = (w) => (info.wagon ? `・${w}` : '');
      return ask(`${info.wagon ? 'パーティーも馬車もいっぱい！' : 'パーティーがいっぱい！'}\n${name}と入れかわりにだれが酒場で待つ？`, [
        ...cur.map((e) => ({ face: face(e), label: `${e.name}（${who(e)}${where('パーティー')}）`, value: e.key })),
        ...wg.map((e) => ({ face: face(e), label: `${e.name}（${who(e)}${where('馬車')}）`, value: e.key })),
        { label: 'やめる', value: null },
      ]);
    };
    // 総入れかえ（ui/wagon.js の arrangeUI。酒場からも サーバーの へんじを まつ）
    const arrange = async () => {
      const r = await arrangeUI(game, { send: (party, wagon) => request(game, { kind: 'tavern', action: 'arrange', party, wagon }) });
      if (r) refresh(r);
    };
    // はいごう: うまれる こを みる → うけつぐ わざ → なまえ
    const pickSkills = (pv) => new Promise((resolve) => {
      let sel = new Set(pv.auto);
      const back = el('div', { class: 'modal-back', style: { zIndex: 6 } });
      const box = el('div', { class: 'win panel center-panel choose-pop', style: { width: 'min(94vw, 480px)', zIndex: 7 } });
      const img = childImg(pv.child, pv.unseen, { style: { height: '3.6em', width: 'auto', imageRendering: 'pixelated', flex: 'none' } });
      // まだ 見たことがない 子は、生まれるまで ひみつ
      const own = pv.unseen ? '？？？' : (MONSTER_FRIENDS[pv.child]?.learn || []).map(([lv, id]) => `Lv${lv} ${ABILITIES[id]?.name || id}`).join('・');
      box.append(
        el('div', { style: { display: 'flex', gap: '0.6em', alignItems: 'flex-start' } },
          el('div', { style: { flex: '1', minWidth: '0' } },
            el('div', { class: 'small gold', style: { whiteSpace: 'pre-line' }, text: `生まれる子: ${childLabel(pv)}（${RACE_NAMES[MONSTERS[pv.child]?.race] || ''}）＋${pv.plus}${pv.unseen ? '\n★ まだ見たことがない魔物！' : ''}${pv.kind === 'special' || pv.kind === 'recipe' ? '\n★ めずらしい組み合わせ！' : ''}` }),
            el('div', { class: 'small muted', text: `自分で覚える技: ${own || 'なし'}` }),
            el('div', { class: 'small muted', text: `装備できる物: ${pv.unseen ? '？？？' : gearText(pv.child)}` })),
          img),
        el('div', { class: 'small', text: `親から受けつぐ技を${pv.max}つまで選んでね` }));
      const desc = el('div', { class: 'small detail', style: { minHeight: '2.4em' } });
      const rows = () => [
        { html: `これで決定 <span class="muted small">（${sel.size}/${pv.max}）</span>`, value: '#ok' },
        { label: 'おまかせにする', value: '#auto' },
        ...pv.skills.map((id) => ({ html: `${sel.has(id) ? '●' : '○'} ${esc(ABILITIES[id]?.name || id)}`, right: ABILITIES[id]?.mp ? `MP${ABILITIES[id].mp}` : '', value: id, cls: sel.has(id) ? 'good' : '' })),
        { label: 'やめる', value: null },
      ];
      const done = (v) => {
        m.blur();
        back.remove();
        box.remove();
        resolve(v);
      };
      const m = new ListMenu(game.input, {
        items: rows(),
        sound: sfx,
        back: null,
        onMove: (it) => { desc.textContent = ABILITIES[it?.value]?.desc || ''; },
        onSelect: (it) => {
          if (it.value === '#ok') return done([...sel]);
          if (it.value === '#auto') { sel = new Set(pv.auto); m.setItems(rows()); return; }
          if (it.value === null) return done(null);
          if (sel.has(it.value)) sel.delete(it.value);
          else if (sel.size < pv.max) sel.add(it.value);
          else { toast(`受けつげる技は${pv.max}つまで`); return; }
          m.setItems(rows());
        },
        onCancel: () => done(null),
      });
      back.onclick = () => { sfx('cancel'); done(null); };
      box.append(m.root, desc);
      document.getElementById('ui').append(back, box);
      m.focus();
    });
    // 生まれる 子の え（hidden … まだ 図鑑に のっていない 子は かげ だけ。ui/menu.js の 図鑑と おなじ いろ）
    const childImg = (sp, hidden, attrs) => {
      const cv = followerSprite({ mon: sp }, 'down', 0);
      const img = el('canvas', { width: cv.width, height: cv.height, ...attrs });
      const x = img.getContext('2d');
      x.drawImage(cv, 0, 0);
      if (hidden) {
        x.globalCompositeOperation = 'source-in';
        x.fillStyle = '#2a2440';
        x.fillRect(0, 0, img.width, img.height);
      }
      return img;
    };
    const childLabel = (pv) => (pv.unseen ? '？？？' : MONSTERS[pv.child]?.name || '');
    // 生まれる 子の みほん（図鑑〈game.me〉で きまる。サーバーの breedPreview と おなじ 計算: shared/data/companions.js の breedOutcome）
    const breedPreviewBox = (top, A0, B0) => {
      const o = breedOutcome(A0, B0, MONSTERS, game.me);
      const img = childImg(o.child, o.unseen, { class: 'breed-pv-img' });
      const rare = o.kind === 'special' || o.kind === 'recipe';
      top.append(img, el('div', { class: 'breed-pv-txt' },
        // 「（しゅぞく）＋3」は 行の とちゅうで わかれない ように
        el('div', { class: 'small gold' }, `生まれる子: ${childLabel(o)}`,
          el('span', { style: { whiteSpace: 'nowrap' }, text: `（${RACE_NAMES[MONSTERS[o.child]?.race] || ''}）＋${o.plus}` })),
        o.unseen ? el('div', { class: 'small good', text: '★ まだ見たことがない魔物！' })
          : o.firstFriend ? el('div', { class: 'small good', text: '★ 初めて仲間になる！' }) : null,
        rare ? el('div', { class: 'small good', text: '★ めずらしい組み合わせ！' }) : null,
        o.kind !== 'special' && o.count > 1 ? el('div', { class: 'small muted' }, `生まれる魔物 ${o.count}種`,
          el('span', { style: { whiteSpace: 'nowrap' }, text: `（図鑑にない ${o.unseenCount}種）` })) : null,
        o.unseen ? null : el('div', { class: 'small muted', text: `装備できる物: ${gearText(o.child)}` })));
    };
    // 2ひきを きめた あと: 受けつぐ 技 → 名前 → たしかめ → 配合。やめても 1ぴきめは えらんだ まま
    const breedWith = async (a, b) => {
      const r = await request(game, { kind: 'tavern', action: 'breedPreview', a, b });
      if (!r.ok || !r.preview) {
        toast(r.text || '配合できない');
        return null;
      }
      const pv = r.preview;
      const inherit = pv.skills.length ? await pickSkills(pv) : [];
      if (!inherit) return null;
      // まだ 見たことがない 子は 名前も ひみつ（空のままなら 種族の 名前。酒場で あとから 変えられる）
      const label = childLabel(pv);
      const nm = await askText(game.input, pv.unseen
        ? { title: '生まれる子の名前（空のままなら種族の名前）', max: 8, initial: '', placeholder: '？？？' }
        : { title: `生まれる${pv.childName}の名前`, max: 8, initial: pv.childName });
      if (nm === null) return null;
      const A = entries.get(a), B = entries.get(b);
      const ok = await confirmBox(game.input, `${A.name}と${B.name}を配合しますか？\n→ ${nm || label}（${label} ＋${pv.plus}）が生まれる\n※ ${A.name}と${B.name}は旅立っていく（装備はふくろにもどる）`, '配合する', 'やめる', sfx);
      if (!ok) return null;
      return doReq({ action: 'breed', a, b, inherit, name: nm || (pv.unseen ? '' : pv.childName) });
    };
    // 配合の 画面で えらんだ: 1ぴきめ → 2ひきめ（配合へ）。1ぴきめを もう一度 えらぶと はずす
    const breedPick = async (key) => {
      const x = entries.get(key);
      if (!x?.species) return;
      if (x.level < BREED_MIN_LEVEL) {
        sfx('buzz');
        toast(`レベル${BREED_MIN_LEVEL}になると配合できる`);
        return;
      }
      if (!parentA || parentA === key) {
        parentA = parentA === key ? null : key;
        refresh();
        return;
      }
      menu.blur();
      const r = await breedWith(parentA, key);
      if (r?.ok) parentA = null;
      refresh();
      menu.focus();
    };
    const act = async (key) => {
      if (key === V_HUMAN) return setView('human');
      if (key === V_MON) return setView('monster');
      if (key === V_BREED) return setView('breed');
      if (key === SORT_KEY) {
        // ならびを かえる（仲間に なった順 → 種類順 → レベル順）。カーソルは この 行の まま
        sortMode = nextRosterSort(sortMode);
        setRosterSortPref(sortMode);
        refresh();
        return;
      }
      if (key === ARRANGE_KEY) {
        menu.blur();
        await arrange();
        menu.focus();
        return;
      }
      if (view === 'breed') return breedPick(key);
      const e = entries.get(key);
      if (!e) return;
      menu.blur();
      // つれていく ところ: パーティー → 馬車 → どちらも いっぱいなら 入れかわり（ui/wagon.js）
      const place = tavernPlace(info, partyKeys().length);
      const full = place.full;
      if (e.sec === 'recruit') {
        const a = await ask(`${e.name}（${who(e)}）を仲間にする？`, [
          { label: full ? '仲間にして入れかわる' : `仲間にして連れていく${place.note}`, value: 'join' },
          { label: '仲間にして酒場で待ってもらう', value: 'wait' },
          { label: 'やめる', value: null },
        ]);
        if (a === 'join') {
          let swap = null;
          if (full) swap = await pickSwap(e.name);
          if (!full || swap) await doReq({ action: 'recruit', key, swap });
        } else if (a === 'wait') await doReq({ action: 'recruit', key, join: false });
      } else if (e.inWagon) {
        const opts = [...tavernWagonOpts(info, e)];
        if (e.sec === 'roster') opts.push({ label: '名前を変える', value: 'rename' });
        if (e.species) opts.push({ label: '別れる', value: 'release' });
        opts.push({ label: 'やめる', value: null });
        const a = await ask(`${e.name}をどうする？`, opts);
        if (a === 'rename') await rename(e);
        else if (a === 'release') {
          const ok = await confirmBox(game.input, `本当に${e.name}と別れますか？\n（もう会えなくなるよ。装備はふくろにもどる）`, '別れる', 'やめる', sfx);
          if (ok) await doReq({ action: 'release', key });
        } else if (a) await tavernWagonAct(wagonCtx(), e, a);
      } else if (e.inParty) {
        const opts = [...tavernWagonOpts(info, e), { label: '酒場で待っていてもらう', value: 'wait' }];
        if (e.sec === 'roster') opts.push({ label: '名前を変える', value: 'rename' });
        opts.push({ label: 'やめる', value: null });
        const a = await ask(`${e.name}をどうする？`, opts);
        if (a === 'wait') await doReq({ action: 'wait', key });
        else if (a === 'rename') await rename(e);
        else if (a) await tavernWagonAct(wagonCtx(), e, a);
      } else {
        const opts = [{ label: `連れていく${place.note}`, value: 'join' }, ...tavernWagonOpts(info, e)];
        if (e.sec === 'roster') opts.push({ label: '名前を変える', value: 'rename' });
        if (e.species) opts.push({ label: '別れる', value: 'release' });
        opts.push({ label: 'やめる', value: null });
        const a = await ask(`${e.name}をどうする？`, opts);
        if (a === 'join') {
          let swap = null;
          if (full) swap = await pickSwap(e.name);
          if (!full || swap) await doReq({ action: 'join', key, swap });
        } else if (a === 'rename') await rename(e);
        else if (a === 'release') {
          const ok = await confirmBox(game.input, `本当に${e.name}と別れますか？\n（もう会えなくなるよ。装備はふくろにもどる）`, '別れる', 'やめる', sfx);
          if (ok) await doReq({ action: 'release', key });
        } else if (a) await tavernWagonAct(wagonCtx(), e, a);
      }
      menu.focus();
    };
    const wagonCtx = () => ({ info, entries, ask, doReq, face, who });
    const rename = async (e) => {
      const nm = await askText(game.input, { title: `${e.name}の新しい名前`, max: 8, initial: e.name });
      if (nm) await doReq({ action: 'rename', key: e.key, name: nm });
    };
    const close = () => {
      menu.blur();
      s.root.remove();
      resolve();
    };
    s.onClose = close;
    side.append(menu.root);
    s.right.textContent = partyText();
    show(menu.current?.value);
    menu.focus();
  });
}

// ちいさな えらぶ まど（Promise で えらんだ value。やめたら null）
// top: タイトルの 下に 出す まど（えらぶ 前の みほん など）、onMove: カーソルを うごかした とき
export function choose(game, title, items, { top = null, onMove = null } = {}) {
  return new Promise((resolve) => {
    const back = el('div', { class: 'modal-back', style: { zIndex: 6 }, onclick: () => { game.audio.sfx('cancel'); done(null); } });
    const box = el('div', { class: 'win panel center-panel choose-pop', style: { width: 'min(90vw, 440px)', zIndex: 7 } }, el('div', { class: 'small gold', style: { whiteSpace: 'pre-line' }, text: title }), top);
    const hasCancel = items.some((i) => i.value === null);
    const m = new ListMenu(game.input, {
      items,
      sound: (x) => game.audio.sfx(x),
      back: hasCancel ? null : 'やめる',
      onMove: onMove ? (it) => onMove(it) : undefined,
      onSelect: (it) => done(it.value),
      onCancel: () => done(null),
    });
    box.append(m.root);
    document.getElementById('ui').append(back, box);
    m.focus();
    const done = (v) => {
      m.blur();
      back.remove();
      box.remove();
      resolve(v);
    };
  });
}

// ───────────── でんごんばん ─────────────
function boardUI(game, data) {
  return new Promise((resolve) => {
    const s = shell('家族の伝言板');
    s.game = game;
    const main = el('div', { class: 'win main scroll', style: { gridColumn: '1 / -1' } });
    s.body.append(main);
    let posts = data.posts || [];
    const render = () => {
      main.innerHTML = '';
      if (!posts.length) main.append(el('div', { class: 'muted', text: 'まだ何も書かれていない。' }));
      for (const p of posts.slice(0, 20)) {
        main.append(el('div', { class: 'combo-row' }, el('span', { class: 'gold', text: p.from }), el('span', { class: 'muted small', text: `　${ago(p.time)}` }), el('div', { text: p.text })));
      }
    };
    render();
    const menu = new ListMenu(game.input, {
      items: [{ label: '書きこむ', value: 'post' }, { label: '閉じる', value: 'close' }],
      cols: 2,
      sound: (x) => game.audio.sfx(x),
      onSelect: async (it) => {
        if (it.value === 'close') return close();
        menu.blur();
        const text = await askText(game.input, { title: '伝言板に書く', placeholder: '今日は洞窟まで行ったよ！', max: 120 });
        if (text) {
          const r = await request(game, { kind: 'board', action: 'post', text });
          toast(r.text || '');
          if (r.posts) posts = r.posts;
          render();
        }
        menu.focus();
      },
      back: null,
      onCancel: () => close(),
    });
    main.before(menu.root);
    const close = () => {
      menu.blur();
      s.root.remove();
      resolve();
    };
    s.onClose = close;
    menu.focus();
  });
}

export function ago(t) {
  const d = (Date.now() - t) / 1000;
  if (d < 60) return 'たった今';
  if (d < 3600) return `${Math.floor(d / 60)}分前`;
  if (d < 86400) return `${Math.floor(d / 3600)}時間前`;
  return `${Math.floor(d / 86400)}日前`;
}

// ───────────── ほしのかけら ─────────────
function starUI(game, data) {
  return new Promise((resolve) => {
    const s = shell('星のかけらこうかん');
    s.game = game;
    const main = el('div', { class: 'win main scroll', style: { gridColumn: '1 / -1' } });
    const detail = el('div', { class: 'detail' });
    s.body.append(main);
    const upd = () => { s.right.textContent = `星のかけら ${itemCount(game.me, 'star_shard')}個`; };
    upd();
    const menu = new ListMenu(game.input, {
      items: data.trades.map((t, i) => ({ label: ITEMS[t.item].name, right: `★${t.shards}`, value: i })),
      sound: (x) => game.audio.sfx(x),
      onMove: (it) => { detail.textContent = itemDetail(data.trades[it.value].item); },
      onSelect: async (it) => {
        const t = data.trades[it.value];
        menu.blur();
        if (await confirmBox(game.input, `星のかけら${t.shards}個で${ITEMS[t.item].name}とこうかんする？`, 'はい', 'いいえ', (x) => game.audio.sfx(x))) {
          const r = await request(game, { kind: 'starTrade', index: it.value });
          if (r.ok) game.audio.sfx('sparkle');
          toast(r.text || '');
          setTimeout(upd, 100);
        }
        menu.focus();
      },
      back: null,
      onCancel: () => close(),
    });
    const close = () => {
      menu.blur();
      s.root.remove();
      resolve();
    };
    s.onClose = close;
    main.append(menu.root, detail);
    menu.focus();
  });
}
