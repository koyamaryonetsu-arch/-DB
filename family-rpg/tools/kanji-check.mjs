// ゲームの文字のチェック
//  1) 使ってよい漢字: 小学校で習う漢字（1〜6年）と、ゲームでおなじみの漢字（EXTRA_KANJI）だけ
//  2) 4年生までの漢字で書けることばが、ひらがなのまま残っていないか（目安）
//  3) ことばの間のスペース（ドラクエ風の分かち書き）が残っていないか
// 使い方:
//   node tools/kanji-check.mjs            … ゲームの文字をぜんぶ調べる
//   node tools/kanji-check.mjs a.js b.js  … 指定したファイルだけ
//   node tools/kanji-check.mjs --foreign  … 小学校で習わない漢字の一覧
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { KANJI_BY_GRADE } from './kanji-grades.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// 小学校で習わないが、このゲームでは使ってよい漢字（職業・技・場所の名前と、ゲームの基本のことば）
export const EXTRA_KANJI = [
  ...'魔呪剣竜僧侶賢闘紋拳忍賊占騎姫雷炎影闇嵐斬裂閃旋',
  ...'攻撃御威倒逃冒鑑掛殿沼滝塔超洞窟丘',
  ...'猛虎砕華烈爆滅',
].join('');

export const SCHOOL_KANJI = Object.values(KANJI_BY_GRADE).join('');
export const GRADE4_KANJI = [1, 2, 3, 4].map((g) => KANJI_BY_GRADE[g]).join('');
const ALLOWED = new Set([...SCHOOL_KANJI, ...EXTRA_KANJI, '々']);
const isKanji = (ch) => /[一-鿿]/.test(ch);
const JP = /[぀-ヿ一-鿿]/;

// 4年生までの漢字で書けるのに、ひらがなのまま残りやすいことば（目安）
export const MUST_WORDS = [
  ['なかま', '仲間'], ['どうぐ', '道具'], ['じゅもん', '呪文'], ['とくぎ', '特技'], ['そうび', '装備'],
  ['しょくぎょう', '職業'], ['てんしょく', '転職'], ['けいけんち', '経験値'], ['こうげき', '攻撃'], ['ぼうぎょ', '防御'],
  ['かいふく', '回復'], ['まほう', '魔法'], ['ゆうしゃ', '勇者'], ['まおう', '魔王'], ['でんせつ', '伝説'],
  ['せかい', '世界'], ['ぼうけん', '冒険'], ['たからばこ', '宝箱'], ['やくそう', '薬草'], ['もくひょう', '目標'],
  ['さくせん', '作戦'], ['つよさ', '強さ'], ['ずかん', '図鑑'], ['はいごう', '配合'], ['せってい', '設定'],
  ['あいことば', '合言葉'], ['ぜんいん', '全員'], ['みかた', '味方'], ['たたか', '戦'], ['あたらし', '新し'],
  ['なまえ', '名前'], ['じぶん', '自分'], ['かぞく', '家族'], ['ちから', '力'], ['すばやさ', '素早さ'],
  ['まりょく', '魔力'], ['しゅび', '守備'], ['まもの', '魔物'], ['しんでん', '神殿'], ['さかば', '酒場'],
  ['やどや', '宿屋'], ['きょうかい', '教会'], ['ぶきや', '武器屋'], ['ぼうぐや', '防具屋'], ['つかう', '使う'],
  ['つかえ', '使え'], ['つかっ', '使っ'], ['おぼえ', '覚え'], ['えらぶ', '選ぶ'], ['えらん', '選ん'],
  ['えらべ', '選べ'], ['しらべ', '調べ'], ['あがった', '上がった'], ['さがった', '下がった'], ['うけた', '受けた'],
  ['(?<![あ-ん])まって', '待って'], ['もって', '持って'], ['つづき', '続き'], ['はじめ', '始め／初め'], ['おわり', '終わり'],
  ['おわる', '終わる'], ['ひつよう', '必要'], ['さいご', '最後'], ['さいしょ', '最初'], ['ぜんぶ', '全部'],
  ['すこし', '少し'], ['つよい', '強い'], ['つよく', '強く'], ['よわい', '弱い'], ['よわく', '弱く'],
  ['おおきい', '大きい'], ['おおきな', '大きな'], ['ちいさい', '小さい'], ['ちいさな', '小さな'], ['ひかり', '光'],
  ['こころ', '心'], ['ひがし', '東'], ['みなみ', '南'], ['みぎ', '右'], ['ひだり', '左'],
  ['(?<!に[らぎ]?|ふ)みつけ', '見つけ'], ['はなし', '話'], ['たすけ', '助け'], ['まもる', '守る'], ['まもり', '守り'],
  ['あつめ', '集め'], ['さがし', '探し'], ['あるく', '歩く'], ['はしる', '走る'], ['ちず', '地図'],
  ['おかね', 'お金'], ['ねだん', '値段'], ['じかん', '時間'], ['こども', '子ども'], ['ともだち', '友だち'],
  ['いきかえ', '生き返'], ['しんで', '死んで'], ['(?<![あ-ん])まけ', '負け'], ['(?<![あ-んァ-ヶ一-龠])かった', '勝った／買った'],
  ['むら[のにへでは]', '村'], ['まち[のにへでは]', '町'], ['(?<!つ)もり[のにへでは]', '森'], ['うみ[のにへをで]', '海'],
  ['そら[のにへをで]', '空'], ['ほし[のをがに]', '星'], ['かぜ[のにをが]', '風'],
].map(([w, k]) => [new RegExp(w), w, k]);

// JS の文字列（'…' "…" `…`）を取り出す。コメントと正規表現は読みとばす
export function jsStrings(src) {
  const out = [];
  let i = 0, line = 1;
  const n = src.length;
  let prev = '';
  const regexOk = () => !prev || /[(,=:[!&|?{};+\-*%<>~^]$/.test(prev) || /\b(return|typeof|case|of|in)$/.test(prev);
  const readStr = (q) => {
    const start = line;
    let s = '';
    i++;
    while (i < n && src[i] !== q) {
      if (src[i] === '\\') { s += src[i] + src[i + 1]; i += 2; continue; }
      if (src[i] === '\n') line++;
      s += src[i++];
    }
    i++;
    return { s, line: start };
  };
  const readTemplate = () => {
    const start = line;
    let s = '';
    i++;
    while (i < n && src[i] !== '`') {
      if (src[i] === '\\') { s += src[i] + src[i + 1]; i += 2; continue; }
      if (src[i] === '$' && src[i + 1] === '{') {
        // ${ … } の中は コードとして 読む（中の文字列も 取り出す）
        let depth = 1;
        i += 2;
        s += '${…}';
        while (i < n && depth > 0) {
          const c = src[i];
          if (c === '{') depth++;
          else if (c === '}') { depth--; if (depth === 0) { i++; break; } }
          else if (c === "'" || c === '"') { const r = readStr(c); out.push(r); continue; }
          else if (c === '`') { const r = readTemplate(); out.push(r); continue; }
          else if (c === '\n') line++;
          i++;
        }
        continue;
      }
      if (src[i] === '\n') line++;
      s += src[i++];
    }
    i++;
    return { s, line: start };
  };
  while (i < n) {
    const c = src[i];
    if (c === '\n') { line++; i++; continue; }
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') line++; i++; } i += 2; continue; }
    if (c === "'" || c === '"') { out.push(readStr(c)); prev = 'x'; continue; }
    if (c === '`') { out.push(readTemplate()); prev = 'x'; continue; }
    if (c === '/' && regexOk()) {
      // 正規表現
      i++;
      let cls = false;
      while (i < n && (cls || src[i] !== '/')) {
        if (src[i] === '\\') { i += 2; continue; }
        if (src[i] === '[') cls = true;
        else if (src[i] === ']') cls = false;
        else if (src[i] === '\n') break;
        i++;
      }
      i++;
      prev = 'x';
      continue;
    }
    if (!/\s/.test(c)) {
      if (/[A-Za-z0-9_$]/.test(c)) {
        let w = '';
        while (i < n && /[A-Za-z0-9_$]/.test(src[i])) w += src[i++];
        prev = w;
        continue;
      }
      prev = c;
    }
    i++;
  }
  return out;
}

// 1つの文字列を調べる
export function checkText(s) {
  const problems = [];
  const bad = [...new Set([...s].filter((ch) => isKanji(ch) && !ALLOWED.has(ch)))];
  if (bad.length) problems.push({ kind: 'kanji', detail: bad.join('') });
  if (/[぀-ヿ一-鿿！？…、。」』）] +[぀-ヿ一-鿿「『（]/.test(s)) problems.push({ kind: 'space', detail: '' });
  for (const [re, w, k] of MUST_WORDS) if (re.test(s)) problems.push({ kind: 'kana', detail: `${w}→${k}` });
  return problems;
}

// ゲームの画面に出る文字が入っているファイル
export function gameFiles() {
  const list = [
    'public/index.html',
    'public/js/main.js', 'public/sw.js',
    'public/js/client/game.js', 'public/js/client/battle.js', 'public/js/client/field.js', 'public/js/client/offline.js', 'public/js/client/net.js', 'public/js/client/cloudsave.js', 'public/js/client/links.js',
    'public/js/client/ui/dom.js', 'public/js/client/ui/hud.js', 'public/js/client/ui/info.js', 'public/js/client/ui/menu.js',
    'public/js/client/ui/script.js', 'public/js/client/ui/services.js', 'public/js/client/ui/title.js', 'public/js/client/ui/syncui.js',
    'public/js/client/ui/counter.js', 'public/js/client/ui/shop.js', 'public/js/shared/data/inn.js',
    // 美容室・主人公の え
    'public/js/shared/data/looks.js', 'public/js/shared/world/salon.js', 'public/js/client/ui/salon.js',
    'public/js/shared/ai.js', 'public/js/shared/battle.js', 'public/js/shared/stats.js',
    'public/js/shared/data/abilities.js', 'public/js/shared/data/abilities-adv.js', 'public/js/shared/data/abilities-jobs.js', 'public/js/shared/data/companions.js',
    // 学校・公務員・町の みかた・アイドルの 職業の 技
    'public/js/shared/data/abilities-jobs2.js', 'public/js/shared/data/abilities-jobs3.js', 'public/js/shared/data/abilities-jobs4.js', 'public/js/shared/data/abilities-jobs5.js', 'public/js/shared/data/abilities-jobs6.js', 'public/js/shared/data/abilities-jobs7.js', 'public/js/shared/data/abilities-jobs8.js',
    'public/js/shared/data/hirameki.js', 'public/js/shared/data/hirameki-jobs.js', 'public/js/shared/data/hirameki-r27.js', 'public/js/shared/data/hirameki-r29.js', 'public/js/shared/data/dual.js', 'public/js/shared/data/loot.js',
    'public/js/shared/data/encounters.js', 'public/js/shared/data/items.js', 'public/js/shared/data/jobs.js',
    'public/js/shared/data/monsters.js', 'public/js/shared/data/shops.js', 'public/js/shared/data/story.js',
    'public/js/shared/maps/index.js', 'public/js/shared/maps/overworld.js', 'public/js/shared/maps/ch2.js', 'public/js/shared/maps/sea.js',
    'public/js/shared/data/abilities-ch2.js', 'public/js/shared/data/companions-ch2.js', 'public/js/shared/data/items-ch2.js',
    'public/js/shared/data/monsters-ch2.js', 'public/js/shared/data/story-ch2.js', 'public/js/shared/data/quest-targets.js', 'public/js/client/prefs.js', 'public/js/shared/data/party-talk.js', 'public/js/shared/data/progress.js', 'public/js/shared/data/difficulty.js', 'public/js/shared/data/fieldchests.js', 'public/js/shared/world/fieldchests.js',
    'public/js/shared/world/battles.js', 'public/js/shared/world/breed.js', 'public/js/shared/world/monsters.js',
    'public/js/shared/world/party.js', 'public/js/shared/world/scripts.js', 'public/js/shared/world/services.js',
    'public/js/shared/world/world.js', 'public/js/shared/world/save.js', 'public/js/shared/world/transfer.js',
    'public/js/shared/world/sync.js', 'public/js/shared/world/merge.js', 'server/syncstore.js',
    'server/guard.js', 'server/funnel.js', 'server/funnel-cli.js',
    'server/index.js', 'server/main.js', 'server/update.js', 'server/storage.js', 'server/savedir.js',
    'server/supervisor.js', 'server/errlog.js', 'server/reqpath.js', 'server/power.js', 'public/js/client/downreason.js',
    // 宝の地図
    'public/js/shared/data/treasure.js', 'public/js/shared/data/items-tm.js', 'public/js/shared/data/monsters-tm.js', 'public/js/shared/data/story-tm.js',
    'public/js/shared/maps/treasure-cave.js', 'public/js/shared/world/treasure.js', 'public/js/client/ui/treasure.js', 'public/js/client/render/themes.js',
    'public/js/shared/data/treasure-hint.js', 'public/js/client/render/treasure-glow.js',
    // 昼と夜・ルーラ・空の旅
    'public/js/shared/world/clock.js', 'public/js/shared/world/travel.js', 'public/js/shared/data/night.js', 'public/js/shared/data/sky.js',
    'public/js/shared/maps/night-npcs.js', 'public/js/client/sky.js', 'public/js/client/ui/clock.js',
    'public/js/client/render/sky-art.js', 'public/js/client/render/night-art.js',
    // 預かり所・ふしぎなかじ屋
    'public/js/shared/data/items-forge.js', 'public/js/shared/data/forge.js', 'public/js/shared/data/facilities.js',
    'public/js/shared/world/bank.js', 'public/js/shared/world/forge.js',
    'public/js/client/ui/bank.js', 'public/js/client/ui/forge.js',
    // 馬車
    'public/js/shared/data/wagon.js', 'public/js/shared/world/wagon.js', 'public/js/client/ui/wagon.js', 'public/js/client/render/wagon.js',
    // 乗り物（第37回）
    'public/js/shared/data/vehicles.js', 'public/js/shared/world/vehicles.js', 'public/js/client/ui/vehicles.js', 'public/js/client/render/vehicle-art.js',
    // 魔物あずかり所（第43回 C）
    'public/js/shared/world/storage.js', 'public/js/client/ui/storage.js',
    // 家族に 道具を あげる（第50回 N6）
    'public/js/shared/world/gift.js', 'public/js/client/ui/gift.js',
    // チャットの スタンプを 変える（第50回 N7）
    'public/js/shared/data/stamps.js', 'public/js/client/ui/stamps.js',
    // ポケモンの 魔物・進化（第44回 ポケモン P1）
    'public/js/shared/data/monsters-pokemon.js', 'public/js/shared/data/companions-pokemon.js', 'public/js/shared/data/abilities-pokemon.js',
    'public/js/shared/data/items-pokemon.js', 'public/js/shared/world/evolve.js',
    // ドラクエふうの 魔物（第45回 ドラクエふう D1）
    'public/js/shared/data/monsters-dqm.js', 'public/js/shared/data/companions-dqm.js', 'public/js/shared/data/abilities-dqm.js',
    'public/js/shared/data/items-dqm.js',
    // 水の 属性（第47回）
    'public/js/shared/data/water.js',
    // みちびきの糸（洞窟から 入り口へ）
    'public/js/shared/data/escape.js', 'public/js/shared/world/escape.js',
    // カジノ・小さなメダル・メダル王
    'public/js/shared/data/casino.js', 'public/js/shared/data/items-casino.js', 'public/js/shared/data/story-casino.js',
    'public/js/shared/world/casino.js', 'public/js/shared/maps/casino.js',
    'public/js/client/ui/casino.js', 'public/js/client/render/casino.js',
    // 第37回 B: ルーレット・すごろく場・宝の地図の 段で ふえる 景品
    'public/js/shared/data/casino-tier.js', 'public/js/shared/data/roulette.js', 'public/js/shared/data/sugoroku.js',
    'public/js/shared/data/items-casino-r37.js', 'public/js/shared/world/sugoroku.js',
    'public/js/client/ui/roulette.js', 'public/js/client/ui/sugoroku.js', 'public/js/client/render/sugoroku.js',
    // めずらしい 強い 魔物（ぷるりん騎士・ヴァルドラゴン など）
    'public/js/shared/data/monsters-rare.js', 'public/js/client/render/rare-art.js',
    // たたかいの けっかの まど（ボタンで 1行ずつ）
    'public/js/client/ui/result.js',
    // 第3章「星の竜がねむる山」
    'public/js/shared/maps/north.js', 'public/js/shared/world/hazards.js', 'public/js/shared/maps/ch3.js',
    'public/js/shared/data/story-ch3.js', 'public/js/shared/data/monsters-ch3.js', 'public/js/shared/data/abilities-ch3.js',
    'public/js/shared/data/items-ch3.js', 'public/js/shared/data/companions-ch3.js', 'public/js/shared/data/encounters-ch3.js',
    // 第4章「砂の海にしずむ星」
    'public/js/shared/maps/south.js', 'public/js/shared/maps/ch4.js', 'public/js/shared/data/story-ch4.js',
    'public/js/shared/data/monsters-ch4.js', 'public/js/shared/data/abilities-ch4.js', 'public/js/shared/data/items-ch4.js',
    'public/js/shared/data/encounters-ch4.js',
    // 第4章 Step 4「王家のピラミッド」（のろいの宝・流れる砂・階の レイアウト）
    'public/js/shared/world/pyramid.js', 'public/js/shared/maps/flow.js', 'public/js/shared/maps/pyramid-rows.js',
    // 第4章 Step 5「月の鏡と大臣の正体」（まぼろしの分身・月の鏡・魔神のランプ）
    'public/js/shared/battle-ch4.js', 'public/js/client/battle-ch4.js',
    // 第4章 Step 6「砂の海賊と砂クジラ」（ドゥナ・砂の古城・すなかぜ号・砂の海・砂クジラ）
    'public/js/shared/data/story-ch4-duna.js', 'public/js/shared/maps/duna.js', 'public/js/shared/maps/duna-rows.js',
    // 第4章 Step 7「砂の底の神殿とモルガナ・エンディング」（A: 世界と物語）
    'public/js/shared/data/story-ch4-temple.js', 'public/js/shared/maps/temple.js', 'public/js/shared/maps/temple-rows.js',
    // 第4章 Step 7「砂の底の神殿とモルガナ」の 戦い（神殿の 魔物・鏡の騎士・うつし身・水のろう・モルガナ・水の守りの歌）
    'public/js/shared/battle-temple.js', 'public/js/client/battle-temple.js', 'public/js/shared/data/monsters-temple.js',
    'public/js/shared/data/abilities-temple.js', 'public/js/shared/data/items-temple.js', 'public/js/shared/data/encounters-temple.js',
    // 見た目装備
    'public/js/shared/look-equip.js',
    // あたらしい 仲間モンスターと 配合（どんぐりん・ぷるりんタワー・いかずちドラゴン など）
    'public/js/shared/data/monsters-r23.js', 'public/js/client/render/r23-art.js',
    // ひみつのダンジョン（終わりの ない ダンジョン・家族の記録の板）
    'public/js/shared/data/secret.js', 'public/js/shared/data/story-secret.js', 'public/js/shared/maps/secret-dungeon.js',
    'public/js/shared/world/secret.js', 'public/js/client/ui/secret.js', 'public/js/client/render/secret-art.js',
    // 第26回の 職業の 看板の技の エフェクト（「プゥ〜」などの ドットの もじ）
    'public/js/client/render/battlefx-jobs4.js',
    // 家族の 見なおし（第26回）: 第4章・夜の 魔物の 仲間・仲間の粉・上位の 技・戦いの 技の せつめい
    'public/js/shared/data/companions-ch4.js', 'public/js/shared/data/friend-powder.js', 'public/js/shared/world/powder.js',
    'public/js/shared/data/skill-ups.js', 'public/js/client/ui/skillinfo.js',
    // 第38回 C: バフ・デバフ・じわじわ回復の 回数と しるし・技の レベル
    'public/js/shared/buff-acts.js', 'public/js/client/battle-buffs.js',
    // 第50回 N1: 技の 威力の 目安（今の 魔力で）
    'public/js/shared/skill-power.js',
    // 合体技の 作り直し（2人・3人・4人の 合体技・カットイン）
    'public/js/shared/battle-dual.js', 'public/js/client/battle-dual.js', 'public/js/client/render/dualfx.js',
    // 第35回 C: 職業の タグ（合体技の 組）
    'public/js/shared/data/job-tags.js',
    // 第27回 B: 転職の せりふ（みじかく）
    'public/js/shared/data/job-talk.js',
    // 第27回 D: 仲間40ひき・酒場の ならび・リレミト・トヘロス・マモノヨセ・魔物よせの笛
    'public/js/shared/data/abilities-field27.js', 'public/js/shared/world/field27.js', 'public/js/shared/roster-sort.js',
    // 第27回: 暴れんぼう将軍の 看板の技「成敗！」の エフェクト
    'public/js/client/render/battlefx-jobs5.js',
    // 第29回: るろうに剣士の 道の 看板の技の エフェクト
    'public/js/client/render/battlefx-jobs6.js',
    // 第33回: 11この 職業の 技の えんしゅつ（説教の 文字・きめぜりふ）
    'public/js/client/render/battlefx-jobs7.js',
    // 第4章クリアの あとの より道: 砂の古代都市と 古代の大迷宮・たのまれごと（第27回）
    'public/js/shared/maps/labyrinth.js', 'public/js/shared/data/story-lab.js', 'public/js/shared/data/sidequests.js',
    'public/js/shared/data/items-lab.js', 'public/js/shared/data/monsters-lab.js', 'public/js/shared/data/abilities-lab.js',
    'public/js/shared/data/encounters-lab.js', 'public/js/shared/battle-lab.js',
    // 第5章 Step 2「星の塔」の 戦い（塔の 魔物・星の番人アルゴス・見通しの目）
    'public/js/shared/battle-ch5.js', 'public/js/client/battle-ch5.js', 'public/js/shared/data/monsters-ch5.js', 'public/js/shared/data/abilities-tower.js',
    'public/js/shared/data/items-tower.js', 'public/js/shared/data/encounters-ch5.js', 'public/js/shared/data/companions-ch5.js',
    // 第5章 Step 3・4「クモイ地方・しずみゆく島の古い神殿」の 戦いと 品（魔物・ガイアイーター・多部位の 戦い・ハネノの 店・神殿の 宝箱）
    'public/js/shared/data/monsters-kumoi.js', 'public/js/shared/data/abilities-kumoi.js', 'public/js/shared/data/items-kumoi.js', 'public/js/shared/data/encounters-kumoi.js',
    'public/js/shared/data/companions-kumoi.js', 'public/js/shared/battle-gaia.js', 'public/js/client/battle-gaia.js',
    // 第5章 Step 1・2（A: 世界と物語）: 星祭りの夜・フードの子・星の羽・天のとばり・星の塔（8階）・アルゴスの 台本
    'public/js/shared/data/story-ch5.js', 'public/js/shared/maps/tower.js', 'public/js/shared/maps/tower-rows.js',
    // 第31回 B: レベルアップの まとめ・しあわせのぼうし・こうふくのくつ
    'public/js/shared/world/growth.js', 'public/js/shared/data/items-r31.js', 'public/js/shared/world/perks.js',
    // 第31回 C: レア装備（レア度★1〜★5・宝の洞窟・ボス・ひみつのダンジョン）
    'public/js/shared/data/items-rare.js', 'public/js/shared/data/rare-loot.js', 'public/js/client/ui/rarity.js',
    // 第32回 B: ひみつのダンジョン（宿屋・お店の 階・お店だけの 回復薬）と 色ちがいの 魔物
    'public/js/shared/data/secret-shop.js', 'public/js/shared/data/items-secret.js', 'public/js/shared/data/variants.js',
    // 第32回 C: れん金がま・生まれ変わりの 武器
    'public/js/shared/data/items-alchemy.js', 'public/js/shared/data/alchemy.js', 'public/js/shared/world/alchemy.js', 'public/js/client/ui/alchemy.js',
    // 第33回: 11の 職業（技・ひらめき技・装備）
    'public/js/shared/data/abilities-jobs9.js', 'public/js/shared/data/hirameki-r33.js', 'public/js/shared/data/items-r33.js',
    // 第40回: 2つの 伝説の 職業（竜魔人・ネオ・クイーン・セレニティ）の 技・ひらめき技・えんしゅつ
    'public/js/shared/data/abilities-jobs10.js', 'public/js/shared/data/hirameki-r40.js', 'public/js/client/render/battlefx-jobs8.js',
    // 第41回 B: 雪の女王・第5のせいれいの 技・ひらめき技・えんしゅつ
    'public/js/shared/data/abilities-r41b.js', 'public/js/shared/data/hirameki-r41b.js', 'public/js/client/render/battlefx-r41b.js',
    // 第41回 A: 2つの 伝説の 職業（京急の社長・野球界の殿堂入り）の 技・ひらめき技・えんしゅつ
    'public/js/shared/data/abilities-r41a.js', 'public/js/shared/data/hirameki-r41a.js', 'public/js/client/render/battlefx-r41a.js',
    // 第43回 B: 魔物の 系統の 奥義
    'public/js/shared/data/abilities-ougi.js',
    // 第43回: 配管工 → ひげおやじ → マリオ（ももの姫 → おてんば姫 → ピーチ）の 技・ひらめき技・えんしゅつ
    'public/js/shared/data/abilities-r43j.js', 'public/js/shared/data/hirameki-r43j.js', 'public/js/client/render/battlefx-r43j.js',
    // 第5章 Step 3・4（A: 世界と物語）: クモイ地方・ハネノの町・しずみゆく島の古い神殿（7階）・ガイアイーターの 台本・守り星の かけら
    'public/js/shared/data/story-kumoi.js', 'public/js/shared/maps/kumoi.js', 'public/js/shared/maps/sink-ruin.js', 'public/js/shared/maps/sink-ruin-rows.js',
    'public/js/shared/data/shops-kumoi.js',
    // 第5章 Step 5（A: 星読みの里・ノクトの思い出の迷宮）
    'public/js/shared/data/story-hoshiyomi.js', 'public/js/shared/maps/hoshiyomi.js', 'public/js/shared/maps/memory.js', 'public/js/shared/maps/memory-rows.js',
    'public/js/shared/data/shops-hoshiyomi.js',
    // 第5章 Step 6・7（A: 大地の神殿・ノクト〈1回目〉・影の城・みんなが集まる）
    'public/js/shared/data/story-earth.js', 'public/js/shared/maps/earth.js', 'public/js/shared/maps/earth-rows.js',
    'public/js/shared/data/shops-earth.js', 'public/js/shared/world/tremor.js',
    // 第5章 Step 8（A8: 影の城）
    'public/js/shared/data/story-castle.js', 'public/js/shared/maps/castle.js', 'public/js/shared/maps/castle-rows.js',
    // 第35回 D: 配合の 作りなおし（ボス級の 仲間）・仲間が いっぱいの ときの さよなら
    'public/js/shared/data/monsters-boss.js', 'public/js/shared/world/farewell.js',
    // 第35回 A: 技の タブ・お知らせ
    'public/js/shared/skill-tabs.js', 'public/js/shared/data/news.js', 'public/js/client/ui/news.js', 'public/js/client/battle-pad.js', 'public/js/client/ui/padnav.js',
    // 第35回 B: かくし要素の ヒント（町の 人・本だな・宝箱の メモ・仲間の「はなす」）
    'public/js/shared/data/secret-hints.js',
    // 第5章 Step 5（B: 戦い・品）: 星読みの里の まわりと 思い出の迷宮の 魔物・ノクトの影（職業の まね・きずなくだき）・里の 店・迷宮の 宝箱・影の王
    'public/js/shared/data/monsters-hoshiyomi.js', 'public/js/shared/data/abilities-hoshiyomi.js', 'public/js/shared/data/items-hoshiyomi.js',
    'public/js/shared/data/encounters-hoshiyomi.js', 'public/js/shared/data/companions-hoshiyomi.js', 'public/js/shared/battle-nocto.js', 'public/js/client/battle-nocto.js',
    // 第5章 Step 6・7（B: 戦い・品）: 根の島と 大地の神殿の 魔物・ノクト（1回目。かげぶんしん・地われ・手をのばす）・ハネノの ランク9の 店・神殿の 宝箱・みんなが くれる 品・天空のきょ兵
    'public/js/shared/data/monsters-earth.js', 'public/js/shared/data/abilities-earth.js', 'public/js/shared/data/items-earth.js',
    'public/js/shared/data/encounters-earth.js', 'public/js/shared/data/companions-earth.js', 'public/js/shared/battle-earth.js', 'public/js/client/battle-earth.js',
    // 第5章 Step 9（B9: ノクト本気・ソリトゥス）: ノクト（本気）・魔王ソリトゥス（ひとりにする・よびかける・きずなを食べる・家族の きずな技）・ボスの 品・仲間の ノクト
    'public/js/shared/data/monsters-final.js', 'public/js/shared/data/abilities-final.js', 'public/js/shared/data/items-final.js',
    'public/js/shared/data/encounters-final.js', 'public/js/shared/data/companions-castle.js', 'public/js/shared/battle-final.js', 'public/js/client/battle-final.js',
    // 第5章 Step 8（B8: 影の城の 戦い・品）: 風・炎・水の 階の 魔物・3人の まぼろし（風のかべ・かげ火の力・水かさ）・影の城の 宝箱・まぼろしの 品・れん金
    'public/js/shared/data/monsters-phantom.js', 'public/js/shared/data/abilities-phantom.js', 'public/js/shared/data/items-castle.js',
    'public/js/shared/data/encounters-phantom.js', 'public/js/shared/data/companions-phantom.js', 'public/js/shared/battle-phantom.js', 'public/js/client/battle-phantom.js',
    // 第2部 第6章 Step 1・2（B: 戦い・品）: 千年前・時の祠・時の遺跡の 魔物・サンドクロック（砂が落ちきると…）・ギアドン（まき戻し）・ランク10の 店・宝箱・ミナモ
    'public/js/shared/data/monsters-past.js', 'public/js/shared/data/abilities-past.js', 'public/js/shared/data/items-past.js', 'public/js/shared/data/shops-past.js',
    'public/js/shared/data/encounters-past.js', 'public/js/shared/data/companions-past.js', 'public/js/shared/battle-ch6.js', 'public/js/client/battle-ch6.js',
    // 第2部 第6章 Step 3・4（B: 戦い・品）: 星めぐりの古道の 魔物・星くいのよる鳥（星くい）・ペンデュラ（時のふりこ）・古道の 宝箱
    'public/js/shared/data/monsters-road.js', 'public/js/shared/data/abilities-road.js', 'public/js/shared/data/items-road.js', 'public/js/shared/data/encounters-road.js',
    'public/js/shared/data/companions-road.js', 'public/js/shared/battle-road.js', 'public/js/client/battle-road.js',
    // 第2部 第6章 Step 5（B: 戦い・品）: 止まった時計塔の 魔物・カリヨン（時のかね）・時計塔の 宝箱・ゲストの リオン
    'public/js/shared/data/monsters-tokei.js', 'public/js/shared/data/abilities-tokei.js', 'public/js/shared/data/items-tokei.js', 'public/js/shared/data/encounters-tokei.js',
    'public/js/shared/data/companions-tokei.js', 'public/js/shared/battle-tokei.js', 'public/js/client/battle-tokei.js',
    // 第37回 A: サファラ闘技場（ランク戦の 3連戦・王者・ごほうび・かけ試合・王者のかべ）
    'public/js/shared/data/arena.js', 'public/js/shared/data/story-arena.js', 'public/js/shared/data/monsters-arena.js', 'public/js/shared/data/abilities-arena.js',
    'public/js/shared/data/items-arena.js', 'public/js/shared/data/encounters-arena.js', 'public/js/shared/battle-arena.js', 'public/js/shared/world/arena.js',
    'public/js/client/ui/arena.js',
    // 第5章 Step 9（A9: てっぺんと エンディング）: 星のない広間・ノクト（本気）と ソリトゥスの 台本・エンディング・クリアの あと
    'public/js/shared/data/story-castle-top.js', 'public/js/shared/maps/castle-top.js',
    // 第2部 第6章 Step 1・2（A: 世界と物語）: 6つ目の星・時のほこら・時の砂時計・千年前のミドリナ地方・星の木・泉の里・リオン・時のいせき
    'public/js/shared/data/story-ch6.js', 'public/js/shared/data/items-ch6-key.js', 'public/js/shared/maps/ch6.js', 'public/js/shared/maps/past.js',
    'public/js/shared/maps/toki-shrine.js', 'public/js/shared/maps/toki-ruin.js', 'public/js/shared/maps/toki-ruin-rows.js', 'public/js/shared/world/time-glass.js', 'public/js/shared/world/time-glass-use.js',
    'public/js/client/time-shift.js',
    // 第2部 第6章 Step 3・4（A: 世界と物語）: 星読みの社・星めぐりの古道・ミナモの星読み・ペンデュラと カナタの 台本・より道
    'public/js/shared/data/story-ch6b.js', 'public/js/shared/data/sidequests-ch6.js', 'public/js/shared/data/items-ch6-side.js',
    'public/js/shared/maps/hoshimichi.js', 'public/js/shared/maps/hoshimichi-rows.js', 'public/js/shared/maps/ch6-side.js', 'public/js/shared/world/star-sight.js',
    // 第2部 第6章 Step 5（A: 世界と物語）: 星の塔の かね・止まった時計塔・リオン・カリヨンの 台本・星読みの しおり・トキネの砂時計のかざり
    'public/js/shared/data/story-ch6c.js', 'public/js/shared/data/sidequests-ch6c.js', 'public/js/shared/data/items-ch6c.js',
    'public/js/shared/maps/tokei.js', 'public/js/shared/maps/tokei-rows.js', 'public/js/shared/maps/ch6c-side.js', 'public/js/shared/world/tokei.js', 'public/js/shared/world/tokei-use.js',
    // 第38回 B: 超級職からの 職業レベルの 上限と 職業の試練（試練の番人・修行・師しょうのまぼろし・しょうごう）
    'public/js/shared/data/job-trials.js', 'public/js/shared/data/story-trials.js', 'public/js/shared/data/monsters-trial.js',
    'public/js/shared/world/job-trials.js', 'public/js/shared/battle-trial.js', 'public/js/client/ui/job-trials.js',
    // 第39回 C: お仕事いらい板の たのまれごと（劇場の空調・おみやげ屋・料理大会・消えた教会のかね・鉱山トロッコの線路）
    'public/js/shared/data/sidequests-family.js', 'public/js/shared/maps/family-quests.js', 'public/js/shared/data/items-family.js', 'public/js/shared/data/vehicles-family.js', 'public/js/shared/data/encounters-family.js', 'public/js/client/render/family-art.js',
    // 第41回: お仕事いらい板を ふやす（歌のステージ・こわれた橋・子ども野球・名物動画・宿の大そうじ・手品ショー）
    'public/js/shared/data/sidequests-work.js', 'public/js/shared/maps/work-quests.js', 'public/js/shared/data/fq-common.js', 'public/js/shared/maps/fq-kit.js', 'public/js/client/render/work-art.js',
  ];
  return list.map((f) => join(ROOT, f));
}

// kana: 'よみがな' は ひらがなのままで よい
const SKIP_BEFORE = /\bkana\s*:\s*['"`]?$/;

export function checkFile(file) {
  const src = readFileSync(file, 'utf8');
  const res = [];
  if (file.endsWith('.html')) {
    src.split('\n').forEach((l, k) => {
      const t = l.replace(/<[^>]*>/g, ' ');
      if (JP.test(t)) for (const p of checkText(t)) res.push({ line: k + 1, text: t.trim(), ...p });
    });
    return res;
  }
  // よみがなの 表（ITEM_KANA = { … }）の 中は ひらがなのままで よい
  const lines = src.split('\n');
  const kanaBlock = new Set();
  lines.forEach((l, i) => {
    if (!/_KANA\s*=\s*\{\s*$/.test(l)) return;
    for (let j = i + 1; j < lines.length && !/^\};/.test(lines[j]); j++) kanaBlock.add(j + 1);
  });
  for (const { s, line } of jsStrings(src)) {
    if (!JP.test(s)) continue;
    const at = lines[line - 1] || '';
    if (kanaBlock.has(line)) {
      for (const p of checkText(s).filter((x) => x.kind === 'kanji')) res.push({ line, text: s, ...p });
      continue;
    }
    const before = at.slice(0, Math.max(0, at.indexOf(s.slice(0, 8))));
    const probs = checkText(s).filter((p) => !(SKIP_BEFORE.test(before) && p.kind !== 'kanji'));
    for (const p of probs) res.push({ line, text: s.length > 70 ? s.slice(0, 70) + '…' : s, ...p });
  }
  return res;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--foreign') {
    const count = new Map();
    for (const f of gameFiles()) {
      const src = readFileSync(f, 'utf8');
      const strs = f.endsWith('.html') ? [{ s: src }] : jsStrings(src);
      for (const { s } of strs) for (const ch of s) if (isKanji(ch) && !SCHOOL_KANJI.includes(ch)) count.set(ch, (count.get(ch) || 0) + 1);
    }
    console.log([...count].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}${EXTRA_KANJI.includes(k) ? '' : '×'}:${v}`).join(' '));
    process.exit(0);
  }
  const only = args.filter((a) => !a.startsWith('--'));
  const files = only.length ? only.map((f) => join(process.cwd(), f)) : gameFiles();
  const summary = { kanji: 0, space: 0, kana: 0 };
  for (const f of files) {
    const res = checkFile(f);
    if (!res.length) continue;
    console.log(`\n■ ${relative(ROOT, f)}`);
    for (const r of res) {
      summary[r.kind]++;
      if (!args.includes('--quiet')) console.log(`  ${r.line}: [${r.kind}${r.detail ? ' ' + r.detail : ''}] ${r.text.replace(/\n/g, '⏎')}`);
    }
  }
  console.log(`\n使えない漢字 ${summary.kanji}件 / スペース ${summary.space}件 / ひらがなのまま（目安） ${summary.kana}件`);
  process.exit(summary.kanji ? 1 : 0);
}
