'use strict';
/* =====================================================================
 * events.js — story scripts & facilities (async, awaited by Field)
 * ===================================================================== */

const QUIZ = [
  {
    q: '「たびの とちゅう、 みちばたで こまっている ひとを みつけました。 あなたは どうしますか？」',
    a: [['すぐに たすける', { kind: 2, brave: 1 }], ['ようすを みる', { calm: 2, sharp: 1 }], ['そっと とおりすぎる', { nimble: 2, lucky: 1 }]],
  },
  {
    q: '「ふるい いせきの おくに ふたつの とびらが あります。 どちらへ すすみますか？」',
    a: [['あかい とびら', { hot: 2, brave: 1 }], ['あおい とびら', { sharp: 2, calm: 1 }], ['ひきかえす', { steady: 2, kind: 1 }]],
  },
  {
    q: '「さいごに ききます。 あなたが いちばん たいせつに したい ものは なんですか？」',
    a: [['ちから', { hot: 2, brave: 1 }], ['ちえ', { sharp: 2, calm: 1 }], ['なかま', { kind: 2, steady: 1 }], ['じゆう', { nimble: 2, lucky: 2 }]],
  },
];
const DEFAULT_NAMES = { m: ['ユウ', 'アルト', 'リク', 'ソラ', 'レイ'], f: ['ユウ', 'ミア', 'サラ', 'リナ', 'エル'] };

const Events = {
  /* ================= new game ================= */
  async newGame() {
    Sound.stopBGM(0);
    const voice = new VoiceBg();
    Scenes.push(voice);
    await fadeIn(30);
    await say('……きこえますか……？', { });
    await say('……わたしは この せかいを みまもる ほしの こえ……。');
    await say('あたらしき いのちよ……。 あなたの ことを すこし おしえてください……。');
    await say('あなたは おとこのこですか？ おんなのこですか？', { wait: false });
    let g = await choose(['おとこのこ', 'おんなのこ'], { cancel: false });
    const gender = g === 1 ? 'f' : 'm';
    Msg.close();
    const name = await nameEntry('あなたの なまえは？', pick(DEFAULT_NAMES[gender]), 4);
    await say('……' + name + '……。 すてきな なまえですね。');
    const score = {};
    for (const qq of QUIZ) {
      await say(qq.q, { wait: false });
      const r = await choose(qq.a.map(a => a[0]), { cancel: false, x: 120, y: 60 });
      for (const [k, v] of Object.entries(qq.a[r][1])) score[k] = (score[k] || 0) + v;
    }
    let best = 'steady', bv = -1;
    for (const k of shuffle(Object.keys(score))) if (score[k] > bv) { bv = score[k]; best = k; }
    Game.newGame(name, gender, best);
    await say('……ありがとう。 あなたは 『' + PERSONALITIES[best].name + '』 な こころの もちぬし なのですね。');
    await say('……さあ、 めざめの ときです。\n' + name + '…… あなたの たびが いま はじまります……。');
    Msg.close();
    await fadeOut(40);
    Scenes.remove(voice);
    Field = new FieldScene();
    Scenes.clear();
    Scenes.push(Field);
    Field.load('hero2f', 1, 2, 'up');
    Field.busy++;
    await fadeIn(40);
    await wait(20);
    try { await this.opening(); } finally { Field.busy--; Msg.close(); }
  },
  async opening() {
    const mom = Field.npcs.find(n => n.id === 'mother2f');
    if (mom) mom.dir = 'left';
    Field.p.dir = 'right';
    await say('「{hero}、 おきなさい。 きょうは あなたの 16さいの たんじょうび よ。」');
    await say('「おうさまに はじめて おめどおりする たいせつな ひ でしょう？」');
    await say('「おとうさんの レオンが たびだって もう 10ねん……。 あなたも りっぱに なったわね。」');
    await say('「さあ、 おしろへ いって おうさまに ごあいさつ してらっしゃい。 おしろは まちの 北よ。」');
    Msg.close();
    if (mom) { await npcWalk(mom, ['right', 'right', 'right', 'right', 'right', 'up']); Field.npcs = Field.npcs.filter(n => n !== mom); Sound.sfx('stairs'); }
    Game.setFlag('opening');
    Game.s.visited.soleia = true;
  },

  /* ================= soleia ================= */
  async king() {
    if (!Game.flag('metKing')) {
      Sound.playBGM('castle');
      await say('「おお {hero}！ よくぞ まいった。」');
      await say('「そなたの ちち 勇者レオンは 10ねんまえ、 魔王ガルヴァスを うつため この しまを たびだち…… それきり ゆくえが しれぬ。」');
      await say('「そして いま、 魔王の ちからは ますます つよまり、 せかいは やみに つつまれようと しておる。」');
      await say('「{hero}よ！ ちちの いしを つぎ、 魔王ガルヴァスを たおして まいれ！」');
      await say('「だが ひとりでは こころもとなかろう。 まちの 『マルタの さかば』で なかまを さがすが よい。」');
      await say('「そして この しまを でるには、 東の しるべの洞窟に ある 『旅の門』を くぐらねばならぬ。」');
      await say('「これは わしからの せんべつじゃ。 うけとるが よい。」');
      Game.s.gold += 50; Game.addItem('club', 1); Game.addItem('herb', 2);
      await Sound.playJingle('item');
      await say('{hero}は 50ゴールドと こんぼうと やくそう2こを うけとった！');
      await say('「こんぼうは 『そうび』しなければ いみが ないぞ。 わすれずにな。」');
      await say('「では ゆけ、 {hero}よ！ そなたに かみの ごかごが あらんことを！」');
      Game.setFlag('metKing');
      Game.s.respawn = { map: 'soleia', x: 19, y: 2, dir: 'up' };
      return;
    }
    await say('「おお {hero}よ！ よくぞ もどった。 なにか ようか？」', { wait: false });
    const r = await choose(['きろくする', 'つぎの レベル', 'やめる']);
    if (r === 0) {
      Msg.close();
      const slot = await chooseSaveSlot('どの ぼうけんのしょに きろくするか？');
      if (slot) { await Game.saveSlot(slot); Sound.sfx('confirm'); await say('「そなたの ぼうけんを ぼうけんのしょ' + slot + 'に きろくしたぞ。」'); }
    } else if (r === 1) {
      Msg.close();
      for (const m of Game.party) await say('「' + m.name + 'が つぎの レベルに なるには あと ' + Math.max(0, Game.nextExp(m) - m.exp) + 'ポイントの けいけんが ひつようじゃ。」');
    }
    await say('「では ゆけ、 {hero}よ！」');
  },
  async minister() {
    if (!Game.flag('metKing')) return say('「おうさまが おまちかねですぞ。 さあ、 まえへ。」');
    if (Game.party.length === 1) return say('「さかばで なかまを みつけるのです。 ひとりたびは きけんですぞ。」');
    if (Game.flag('boss')) return say('「なんと！ 旅の門への みちが ひらかれたと！？ さすがは レオンどのの ごしそく……！」');
    if (Game.flag('wallBroken')) return say('「ふさがれた 岩を ふきとばしたとな！？ 旅の門は しるべの洞窟の いちばん おくじゃ。」');
    if (Game.flag('gotOrb')) return say('「その ばくれつだまが あれば、 しるべの洞窟の 岩を こわせるはずじゃ！」');
    if (Game.flag('gotKey')) return say('「ふるびたカギ とな？ ならば ノルデ村の ドーランの いえにも はいれよう。」');
    await say('「しるべの洞窟の いりぐちは まものが はいりこまぬよう、 王の めいで 岩で ふさいだのです。」');
    await say('「あの 岩を こわせるのは ノルデ村に すむ ばくはつの めいじん ドーランくらい でしょうな。」');
  },
  async guardHint() {
    if (!Game.flag('gotKey')) return say('「ノルデ村は 城の 北、 川を こえた さきだ。 まものが つよく なるから そうびを ととのえて いけよ。」');
    return say('「つよい まものは よるに でる。 たびの つかれは やどやで いやすのだぞ。」');
  },
  async treasuryGuard() {
    if (Game.has('oldkey')) return say('「そのカギで たからものこを あけるつもりか？ …まあ 勇者どのなら 王も おゆるしに なるだろう。」');
    return say('「この さきは たからものこだ。 カギが なければ はいれんぞ。」');
  },
  async gateGuard() {
    if (!Game.flag('metKing')) return say('「まだ おうさまに あっていないのか？ まずは お城へ いきなさい。」');
    if (Field.isNightHere()) return say('「よるの まものは つよいぞ。 むりは するなよ。」');
    return say('「ここから さきは まものが でるぞ。 きを つけてな！」');
  },
  async mother() {
    await say('「{hero}、 おかえりなさい。 すこし やすんでいく？」', { wait: false });
    const r = await choose(['はい', 'いいえ']);
    if (r === 0) {
      Msg.close();
      await restFade();
      for (const m of Game.party) if (m.hp > 0) { m.hp = m.mhp; m.mp = m.mmp; }
      await say('「げんきに なったみたいね。 いってらっしゃい。 きを つけてね。」');
    } else await say('「おとうさんも きっと どこかで みまもって いるわ。」');
  },

  /* ================= facilities ================= */
  async church() {
    await say('「ようこそ かみの いえへ。 なんの ようですか？」', { wait: false });
    for (;;) {
      const r = await choose(['いきかえらせる', 'どくの ちりょう', 'おいのり(きろく)', 'やめる'], { x: 120 });
      if (r === 0) {
        const dead = Game.party.filter(m => m.hp <= 0);
        if (!dead.length) { await say('「だれも しんでは いないようですね。」', { wait: false }); continue; }
        const m = await chooseMember({ title: 'だれを？', members: dead, right: mm => 'Lv' + mm.level });
        if (!m) { await say('「ほかに ようは ありますか？」', { wait: false }); continue; }
        const cost = m.level * 10;
        await say('「' + m.name + 'を いきかえらせるには ' + cost + 'ゴールドの きふが ひつようです。 よろしいですか？」', { wait: false });
        if (await choose(['はい', 'いいえ']) === 0) {
          if (Game.s.gold < cost) await say('「おかねが たりないようですね。」');
          else {
            Game.s.gold -= cost; m.hp = m.mhp; m.status = {};
            Sound.sfx('heal'); Field.resetTrail();
            await say('「かみよ！ ' + m.name + 'に いまいちど いのちを！」');
            await say(m.name + 'は いきかえった！');
          }
        }
        await say('「ほかに ようは ありますか？」', { wait: false });
      } else if (r === 1) {
        const ps = Game.party.filter(m => m.hp > 0 && m.status.poison);
        if (!ps.length) { await say('「どくに おかされた ものは いないようですね。」', { wait: false }); continue; }
        const m = await chooseMember({ title: 'だれを？', members: ps });
        if (m) {
          if (Game.s.gold < 10) await say('「10ゴールドの きふが ひつようです。 おかねが たりないようですね。」');
          else { Game.s.gold -= 10; delete m.status.poison; Sound.sfx('heal'); await say('「かみよ、 このものの どくを きよめたまえ！」\n' + m.name + 'の どくが きえた！'); }
        }
        await say('「ほかに ようは ありますか？」', { wait: false });
      } else if (r === 2) {
        Msg.close();
        const slot = await chooseSaveSlot('どの ぼうけんのしょに きろくしますか？');
        if (slot) { await Game.saveSlot(slot); await Sound.playJingle('save'); await say('「あなたの ぼうけんを ぼうけんのしょ' + slot + 'に きろくしました。」'); }
        await say('「ほかに ようは ありますか？」', { wait: false });
      } else { await say('「あなたに かみの ごかごが ありますように。」'); return; }
    }
  },

  async inn(price, kind) {
    const n = Game.party.length, cost = price * n;
    if (kind === 'tower') await say('「こんな ところまで よう きたねえ。 やすんでいくかい？ ひとり ' + price + 'ゴールド、 ' + n + 'にんで ' + cost + 'ゴールドだよ。」', { wait: false });
    else await say('「たびびとの やどやへ ようこそ。 ひとばん ひとり ' + price + 'ゴールド、 ' + n + 'にんで ' + cost + 'ゴールドですが、 おとまりに なりますか？」', { wait: false });
    const r = await choose(['はい', 'いいえ']);
    if (r !== 0) { await say(kind === 'tower' ? '「そうかい。 きを つけて いきなよ。」' : '「またの おこしを おまちしております。」'); return; }
    if (Game.s.gold < cost) { await say('「おや、 おかねが たりないようですね。」'); return; }
    Game.s.gold -= cost;
    await say(kind === 'tower' ? '「ゆっくり おやすみ。」' : '「では ごゆっくり おやすみください。」');
    Msg.close();
    await restFade(true);
    for (const m of Game.party) if (m.hp > 0) { m.hp = m.mhp; m.mp = m.mmp; }
    await say(kind === 'tower' ? '「よく ねむれたかい？ きを つけてね。」' : '「おはようございます。 では いってらっしゃいませ。」');
  },

  async shop(id) {
    const shop = SHOPS[id];
    const weaponish = shop.items.some(i => ITEMS[i].kind !== 'use');
    await say('「いらっしゃい！ ここは ' + shop.title + 'だ。 なんの ようだい？」', { wait: false });
    for (;;) {
      const r = await choose(['かいにきた', 'うりにきた', 'やめる'], { x: 150 });
      if (r === 0) await shopBuy(shop, weaponish);
      else if (r === 1) await shopSell();
      else { await say('「また きてくれよな！」'); return; }
      await say('「ほかに ようは あるかい？」', { wait: false });
    }
  },

  async tavern() {
    await say('「ここは マルタの さかば。 たびびとが であい、 わかれる ところよ。 なんの ごようかしら？」', { wait: false });
    for (;;) {
      const r = await choose(['なかまを くわえる', 'なかまを はずす', 'あたらしく とうろく', 'やめる'], { x: 120 });
      if (r === 0) await tavernAdd();
      else if (r === 1) await tavernRemove();
      else if (r === 2) await tavernRegister();
      else { await say('「いい たびを ね。 また いつでも いらっしゃい。」'); return; }
      await say('「ほかに なにか ごようかしら？」', { wait: false });
    }
  },

  async well() {
    await say('いどの そこから かすかに あかりが もれている…。 おりてみますか？', { wait: false });
    if (await choose(['はい', 'いいえ']) !== 0) return;
    Msg.close();
    Sound.sfx('stairs');
    await Field.transition('well', 8, 1, 'left');
  },
  async collector() {
    const have = Game.count('star');
    if (!Game.flag('metCollector')) {
      Game.setFlag('metCollector');
      await say('「ほっほっ！ こんな ところまで よう きたのう。 わしは ほしの かけらを あつめて おる じいさんじゃ。」');
      await say('「ほしのかけらは この しまの あちこちに ねむって おる。 つぼや たる、 たからばこ…… そして あしもとにも な。」');
    }
    if (have > 0) {
      await say('「おお！ ほしのかけらを ' + have + 'こ もって おるな！ わしに ゆずって くれんかのう？」', { wait: false });
      if (await choose(['はい', 'いいえ']) === 0) {
        const before = Game.s.starsGiven;
        Game.removeItem('star', have);
        Game.s.starsGiven += have;
        await say('{hero}は ほしのかけらを ' + have + 'こ わたした。');
        for (const [need, item] of STAR_REWARDS) {
          if (before < need && Game.s.starsGiven >= need) {
            Game.addItem(item, 1);
            await Sound.playJingle('item');
            await say('「ほうびに これを やろう！」\n{hero}は ' + ITEMS[item].name + 'を もらった！');
          }
        }
      } else { await say('「そうか……。 きが かわったら また きておくれ。」'); return; }
    }
    const total = Game.s.starsGiven;
    await say('「これまでに ' + total + 'こ あつまった。 かけらは この しまに ぜんぶで ' + STAR_TOTAL + 'こ あるはずじゃ。」');
    const next = STAR_REWARDS.find(([need]) => need > total);
    if (next) await say('「あと ' + (next[0] - total) + 'こ あつめて きたら、 ' + ITEMS[next[1]].name + 'を やろう。」');
    else if (total >= STAR_TOTAL) await say('「すべての かけらが そろった！ おまえさんは ほんものの ほしの ゆうしゃじゃ！」');
    else await say('「のこりの かけらも たのしみに まっておるぞ。」');
  },

  /* ================= quest chain ================= */
  async towerArrive() {
    await say('かびくさい くうきの なか、 どこからか ささやくような かぜの おとが きこえる……。');
    await say('ここが ささやきの塔……。 その さいじょうかいには 賢者が すむと いう。');
  },
  async hermit() {
    if (!Game.flag('gotKey')) {
      await say('「……ほう。 ついに きたか。 ゆめで みた とおりじゃ。」');
      await say('「わしは この 塔で ほしを よむ もの。 ほしが おしえて くれた…… 勇者の こが ここへ くると。」');
      await say('「そなたの ちち レオンも かつて ここを おとずれた。 つよく、 そして やさしい おとこ じゃった……。」');
      await say('「これを もっていくが よい。 ふるい とびらなら たいていは ひらく 『ふるびたカギ』じゃ。」');
      Game.addItem('oldkey', 1); Game.setFlag('gotKey');
      await Sound.playJingle('item');
      await say('{hero}は ふるびたカギを てにいれた！');
      await say('「ノルデ村の ドーランは がんこな じじい じゃが…… その カギが あれば いえに はいれよう。 ほっほっほ。」');
      await say('「かえりは そこの かいだんを おりるか、 まちへ もどる すべを つかうが よい。」');
    } else {
      await say('「ほしは まだ おおくを かたらぬ……。 だが そなたの たびが ながく けわしい ものに なることは たしかじゃ。」');
    }
    await say('「つかれて おるようじゃな。 すこし やすんで いくが よい。」');
    Msg.close();
    await restFade();
    for (const m of Game.party) if (m.hp > 0) { m.hp = m.mhp; m.mp = m.mmp; }
    await say('{hero}たちの からだに ちからが みなぎった！');
  },
  async sentinel(npc) {
    await say('「……ワレハ コノ トウノ バンペイ……。 コノ サキヘ ススム モノノ チカラヲ タメス……。」');
    await say('「……タタカウ ジュンビハ ヨイカ？」', { wait: false });
    if (await choose(['はい', 'いいえ']) !== 0) { await say('「……ジュンビガ デキタラ クルガヨイ……。」'); return; }
    Msg.close();
    const res = await Battle.start([{ id: 'guard_golem', n: 1 }], { bg: 'tower', boss: true, bgm: 'boss' });
    if (res === 'win') {
      Game.setFlag('sentinel');
      Field.refreshNpcs();
      await say('「……ミゴト……。 トオルガ ヨイ……。」');
      Sound.sfx('explosion'); FX.doShake(16, 2);
      await say('いしの ばんぺいは がらがらと くずれおちた。');
    } else if (res === 'lose') await this.wipe();
  },
  async nordeVillager() {
    if (!Game.flag('gotKey')) return say('「ドーランじいさんなら いえに カギを かけて とじこもって しまったよ。 だれとも あいたく ないんだと。」');
    if (!Game.flag('gotOrb')) return say('「その ふるびたカギ…… ドーランじいさんの いえの とびらも あけられるかもね。」');
    return say('「しるべの洞窟は 島の 東の はずれ。 どくの ぬまを こえた さき だよ。」');
  },
  async doran() {
    if (!Game.flag('gotOrb')) {
      await say('「な、 なんじゃ おまえは！ カギを かけて おいた はずじゃが…… ふるびたカギ じゃと！？ ささやきの塔の じいさんの しわざか……。」');
      await say('「……なに？ しるべの洞窟の 岩を こわして 旅の門へ いきたい とな？」');
      await say('「……10ねんまえ、 勇者レオンも おなじ ことを いうて、 わしの ばくれつだまで 岩を ふきとばして いきおった。」');
      await say('「その あと 王は まものが はいりこまぬよう、 いりぐちを また 岩で ふさいだのじゃ。」');
      await say('「おまえ…… レオンの ' + (Game.hero().gender === 'f' ? 'むすめ' : 'むすこ') + 'か！ めが そっくりじゃ。 ……ならば これを もっていけ！」');
      Game.addItem('blastorb', 1); Game.setFlag('gotOrb');
      await Sound.playJingle('item');
      await say('{hero}は ばくれつだまを てにいれた！');
      await say('「その たまを ふさがれた 岩の まえで つかうのじゃ。 まきこまれんよう きを つけるんじゃぞ！」');
      return;
    }
    if (!Game.flag('wallBroken')) return say('「ばくれつだまは ふさがれた 岩の まえで 『つかう』のじゃ。 ほれ、 はよう いかんか！」');
    return say('「ほっほっ、 みごとに ふきとばした ようじゃな！ レオンの ときより はでな おとが しておったぞ！」');
  },
  async caveGuard() {
    if (Game.flag('gotOrb')) {
      await say('「そ、 それは ばくれつだま！？」');
      await say('「……ならば おれは なにも みなかった ことに しよう。 まきこまれないよう はなれて いるぞ！」');
      return;
    }
    await say('「この さきは 王の めいれいで 岩で ふさがれている。 あの 岩を こわせる ものなど おらんよ。」');
  },
  async sealedWall() {
    if (Game.flag('wallBroken')) return;
    if (!Game.has('blastorb')) { await say('おおきな 岩が みちを ふさいでいる。 びくとも しない……。'); return; }
    await say('おおきな 岩が みちを ふさいでいる。\nばくれつだまを つかいますか？', { wait: false });
    if (await choose(['はい', 'いいえ']) !== 0) return;
    Msg.close();
    await say('{hero}は ばくれつだまを 岩の まえに おき、 いそいで はなれた……。');
    Msg.close();
    await wait(40);
    Sound.sfx('explosion');
    FX.doFlash(10, '#fff'); FX.doShake(30, 4);
    await wait(12);
    Sound.sfx('explosion');
    await wait(30);
    Game.removeItem('blastorb', 1);
    Game.setFlag('wallBroken');
    const p = Field.p;
    Field.map = Maps.build(Field.map.id);
    Field.refreshNpcs();
    Field.p = p;
    await say('すさまじい ばくはつで 岩が こなごなに くだけちった！');
  },
  async bossApproach(fromTalk) {
    if (Game.flag('boss')) return;
    const boss = Field.npcs.find(n => n.id === 'boss');
    if (!fromTalk) Field.p.dir = 'up';
    Sound.stopBGM(0);
    await say('「……ほう。 ここまで きたか、 ちいさき ものよ。」');
    await say('「わが なは ボルザーク。 魔王ガルヴァスさまの めいにより、 この 旅の門を まもる もの。」');
    await say('「10ねんまえ…… おまえと おなじ めを した にんげんが ここを とおった。」');
    await say('「あの おとこは われの るすに まんまと とおりぬけて いったが…… こんどは そうは いかぬ！」');
    await say('「さあ、 かかってくるが よい！」');
    Msg.close();
    const res = await Battle.start([{ id: 'boss_knight', n: 1 }], { bg: 'cave', boss: true, bgm: 'boss' });
    if (res === 'win') {
      Game.setFlag('boss');
      if (boss) Field.npcs = Field.npcs.filter(n => n !== boss);
      await say('「ば、 ばかな…… この われが……。 ガルヴァスさま…… おゆるしを……。」');
      Sound.sfx('explosion'); FX.doFlash(8, '#a040f0');
      await wait(20);
      await say('やみの きしは くろい きりと なって きえていった……。');
      await say('おくの 旅の門が あおく かがやいている……。');
      Field.updateBgm(true);
    } else if (res === 'lose') await this.wipe();
  },
  async gate() {
    if (!Game.flag('boss')) return;
    if (Game.flag('clear1')) {
      await say('旅の門の むこうは、 まだ ふしぎな ちからで とざされている……。\n（第二章へ つづく）');
      Field.p.y += 1; Game.s.y = Field.p.y;
      return;
    }
    await say('旅の門が あおく うずまいている。\nとびこみますか？', { wait: false });
    if (await choose(['はい', 'いいえ']) !== 0) { Msg.close(); Field.p.y += 1; Game.s.y = Field.p.y; Field.p.dir = 'up'; return; }
    Msg.close();
    await this.ending();
  },
  async spring() {
    await say('すんだ いずみが こんこんと わいている。\nみずを のみますか？', { wait: false });
    if (await choose(['はい', 'いいえ']) !== 0) return;
    Msg.close();
    Sound.sfx('heal');
    FX.doFlash(8, '#80e0ff');
    for (const m of Game.party) if (m.hp > 0) { m.hp = m.mhp; m.mp = m.mmp; delete m.status.poison; }
    await say('つめたい みずが からだに しみわたる……。\n{hero}たちの きずが すっかり いえた！');
  },
  async shrineSage() {
    await say('「ようこそ、 いやしの ほこらへ。 ここの いずみは たびびとの つかれを いやします。」');
    await say('「ほしのかけらは この しまに ' + STAR_TOTAL + 'こ。 もりの こかげ、 さばくの すな、 みずうみの ちいさな しま…… いろいろな ところに ねむっています。」');
    if (!Game.flag('boss')) await say('「しるべの洞窟の おくには おそろしい けはいが します。 ほのおの じゅもんが ききにくい あいて のようです…… こおりや かぜ、 そして ちからで たちむかいなさい。」');
  },

  /* ================= battles / wipe / ending ================= */
  async randomBattle(zone, bg) {
    const night = Game.isNight() && !!Field.map.def.world;
    const table = ENCOUNTERS[zone];
    const list = (night && table.night) ? table.night : table.day;
    let groups;
    if (RARE_STAR[zone] && chance(RARE_STAR[zone])) groups = [{ id: 'star', n: 1 }];
    else {
      const total = list.reduce((a, f) => a + f[1], 0);
      let r = Math.random() * total, form = list[0][0];
      for (const f of list) { r -= f[1]; if (r <= 0) { form = f[0]; break; } }
      groups = form.map(([id, a, b]) => ({ id, n: rndInt(a, b) }));
    }
    const res = await Battle.start(groups, { bg });
    Field.encGrace = 4;
    if (res === 'lose') await this.wipe();
  },
  async wipe() {
    Msg.close();
    Sound.stopBGM(200);
    await fadeOut(40);
    await Sound.playJingle('gameover');
    for (const m of Game.party) { m.hp = m.mhp; m.mp = m.mmp; m.status = {}; }
    Game.s.gold = Math.floor(Game.s.gold / 2);
    const r = Game.flag('metKing') ? Game.s.respawn : { map: 'soleia', x: 4, y: 22, dir: 'down' };
    Field.load(r.map, r.x, r.y, r.dir);
    await fadeIn(40);
    if (Game.flag('metKing')) {
      await say('「おお {hero}よ！ ぶじで なにより じゃ。」');
      await say('「そなたたちは たおれて いた ところを はこばれて きたのだ。 しょじきんの はんぶんは ちりょうに つかわせて もらったぞ。」');
      await say('「ゆだんは きんもつじゃ。 じゅうぶんに そなえてから すすむのだぞ。」');
    } else await say('……ゆめ だったのだろうか……。');
  },
  async ending() {
    Game.setFlag('clear1');
    Sound.sfx('warp');
    await fadeOut(50, '#ffffff');
    const bg = new EndingScene();
    Scenes.push(bg);
    Sound.playBGM('ending');
    await fadeIn(60);
    await say('{hero}たちは 旅の門へ とびこんだ——。', { });
    await say('うずまく ひかりの むこうに まつのは、 まだ みぬ たいりく、 あらたな であい。');
    await say('そして 魔王ガルヴァスへと つづく、 ながい ながい たび……。');
    await say('ちちが のこした あしあとを たどり、 {hero}の ぼうけんは いま はじまったばかり だった——。');
    Msg.close();
    bg.showStats = true;
    await waitPress();
    bg.showStats = false;
    bg.showEnd = true;
    await waitPress();
    await say('ぼうけんのしょに きろくしますか？', { wait: false });
    // place the party back in front of the gate so the island can still be explored
    Game.s.map = 'shirube3'; Game.s.x = 9; Game.s.y = 4; Game.s.dir = 'down';
    if (await choose(['はい', 'いいえ']) === 0) {
      Msg.close();
      const slot = await chooseSaveSlot('どの ぼうけんのしょに きろくしますか？');
      if (slot) { await Game.saveSlot(slot); await Sound.playJingle('save'); await say('ぼうけんのしょ' + slot + 'に きろくしました。'); }
    }
    Msg.close();
    await say('このあとも ソレイア島の ぼうけんを つづけることが できます。\n（ほしのかけら あつめ などを どうぞ）');
    Msg.close();
    await fadeOut(40);
    Scenes.remove(bg);
    Field.load('shirube3', 9, 4, 'down');
    await fadeIn(40);
  },
};

/* soleia: cannot leave town before meeting the king */
MAPDEFS.soleia.canExit = async () => {
  if (Game.flag('metKing')) return true;
  await say('「おっと、 {hero}！ まずは おしろで おうさまに ごあいさつ してからだ。」');
  return false;
};
/* gate trigger (walk onto the travel gate) */
MAPDEFS.shirube3.triggers['9,3'] = () => Events.gate();
delete MAPDEFS.shirube3.interact;

/* ---------- helpers ---------- */
async function restFade(inn) {
  Sound.stopBGM(300);
  await fadeOut(30);
  await Sound.playJingle(inn ? 'inn' : 'inn');
  if (inn) Game.setMorning();
  await wait(20);
  Field.spawnNpcs();
  await fadeIn(30);
  Field.updateBgm(true);
}
function waitPress() {
  return new Promise(res => {
    const sc = { update() { if (Input.pressed('a') || Input.pressed('b')) { Scenes.remove(this); res(); } }, render() {} };
    Scenes.push(sc);
  });
}
async function npcWalk(npc, dirs) {
  for (const d of dirs) {
    const [dx, dy] = DXY[d];
    npc.dir = d; npc.sx = npc.x; npc.sy = npc.y; npc.x += dx; npc.y += dy; npc.moving = true; npc.t = 0;
    await wait(16);
  }
}

class VoiceBg {   // dark starry backdrop for the opening voice
  constructor() { this.opaque = true; this.stars = Array.from({ length: 60 }, () => [rnd(SW), rnd(150), Math.random()]); }
  render() {
    fillRect(0, 0, SW, SH, '#020410');
    for (const [x, y, s] of this.stars) {
      const tw = (Math.sin(frameCount / 30 + s * 20) + 1) / 2;
      fillRect(x, y, 1, 1, tw > 0.5 ? '#f8f8ff' : '#6070a0');
    }
    const r = 10 + Math.sin(frameCount / 40) * 2;
    ctx.globalAlpha = 0.25; ctx.fillStyle = '#90b0ff';
    ctx.beginPath(); ctx.arc(SW / 2, 80, r * 2, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = '#e8f0ff';
    ctx.beginPath(); ctx.arc(SW / 2, 80, r * 0.5, 0, Math.PI * 2); ctx.fill();
  }
}
class EndingScene {
  constructor() { this.opaque = true; this.showStats = false; this.showEnd = false; this.stars = Array.from({ length: 90 }, () => [rnd(SW), rnd(SH), Math.random()]); }
  render() {
    const g = ctx.createLinearGradient(0, 0, 0, SH);
    g.addColorStop(0, '#050818'); g.addColorStop(1, '#1a2a58');
    ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
    for (const [x, y, s] of this.stars) { const tw = (Math.sin(frameCount / 25 + s * 30) + 1) / 2; fillRect(x, (y + frameCount * 0.05 * (s + 0.2)) % SH, 1, 1, tw > 0.6 ? '#ffffff' : '#7080b0'); }
    if (this.showStats) {
      drawWindow(24, 20, 208, 150, COL.white, 'ぼうけんの きろく');
      Game.party.forEach((m, i) => { drawText(m.name, 40, 38 + i * 16); drawText(JOBS[m.job].name, 100, 38 + i * 16, COL.gray); drawText('Lv ' + m.level, 214, 38 + i * 16, COL.white, 12, 'right'); });
      const t = Math.floor(Game.s.playTime);
      drawText('プレイじかん', 40, 110); drawText(`${Math.floor(t / 3600)}:${String(Math.floor(t / 60) % 60).padStart(2, '0')}`, 214, 110, COL.white, 12, 'right');
      drawText('ほしのかけら', 40, 126); drawText((Game.s.starsGiven + Game.count('star')) + ' / ' + STAR_TOTAL, 214, 126, COL.white, 12, 'right');
      drawText('ゴールド', 40, 142); drawText(String(Game.s.gold), 214, 142, COL.white, 12, 'right');
      if ((frameCount >> 4) % 2) drawDownArrow(SW / 2 - 3, 160);
    }
    if (this.showEnd) {
      drawText('第一章', SW / 2, 70, COL.gray, 12, 'center');
      drawText('はじまりの島', SW / 2, 90, COL.yellow, 16, 'center');
      drawText('― 完 ―', SW / 2, 118, COL.white, 12, 'center');
      drawText('第二章へ つづく…', SW / 2, 160, COL.white, 12, 'center');
      if ((frameCount >> 4) % 2) drawDownArrow(SW / 2 - 3, 190);
    }
  }
}

/* ---------- shop helpers ---------- */
async function shopBuy(shop, weaponish) {
  let idx = 0;
  for (;;) {
    let cur = null;
    const info = pushInfo(() => {
      drawGoldWindow(176, 8);
      if (!cur) return;
      const it = ITEMS[cur];
      if (it.kind === 'use') { drawHelp(it.desc || '', 202); return; }
      drawWindow(8, 148, 240, 86);
      Game.party.forEach((m, i) => {
        const y = 158 + i * 17;
        drawText(m.name, 18, y);
        if (!Game.canEquip(m, cur)) { drawText('そうびできない', 90, y, COL.dim); return; }
        const slot = it.kind, save = m.eq[slot];
        const before = slot === 'weapon' ? Game.atk(m) : Game.def(m);
        m.eq[slot] = cur; const after = slot === 'weapon' ? Game.atk(m) : Game.def(m); m.eq[slot] = save;
        const d = after - before;
        drawText((slot === 'weapon' ? 'こうげき ' : 'しゅび ') + before + ' → ' + after, 90, y, d > 0 ? COL.green : d < 0 ? COL.red : COL.white);
        if (save === cur) drawText('E', 230, y, COL.yellow);
      });
    });
    const items = shop.items.map(id => ({ label: ITEMS[id].name, right: ITEMS[id].price + 'G' }));
    const menu = new Menu({ items, x: 8, y: 8, w: 164, index: idx, rows: Math.min(8, items.length), onChange: i => { cur = shop.items[i]; } });
    const r = await menu.choose();
    if (r < 0) { menu.close(); Scenes.remove(info); return; }
    idx = r;
    const id = shop.items[r], it = ITEMS[id];
    let qty = 1;
    if (it.kind === 'use') {
      const max = Math.min(20, Math.floor(Game.s.gold / it.price));
      if (max < 1) { await say('「おっと、 おかねが たりないぜ。」'); Msg.close(); menu.close(); Scenes.remove(info); continue; }
      await say('「' + it.name + 'だね。 いくつ かうかい？」', { wait: false });
      qty = await chooseQty(max, it.price, 120, 100);
      Msg.close();
      if (!qty) { menu.close(); Scenes.remove(info); continue; }
    } else if (Game.s.gold < it.price) {
      await say('「おっと、 おかねが たりないぜ。」'); Msg.close(); menu.close(); Scenes.remove(info); continue;
    }
    const cost = it.price * qty;
    await say('「' + it.name + (qty > 1 ? 'を ' + qty + 'こ' : 'だね') + '。 ' + cost + 'ゴールドだが いいかい？」', { wait: false });
    const ok = await choose(['はい', 'いいえ']);
    if (ok === 0) {
      Game.s.gold -= cost; Game.addItem(id, qty); Sound.sfx('coin');
      if (it.kind !== 'use') {
        const can = Game.party.filter(m => Game.canEquip(m, id));
        if (can.length) {
          await say('「まいどあり！ いま そうび していくかい？」', { wait: false });
          if (await choose(['はい', 'いいえ']) === 0) {
            Msg.close();
            const m = await chooseMember({ title: 'だれが？', filter: mm => Game.canEquip(mm, id), right: mm => JOBS[mm.job].short });
            if (m) {
              const prev = Game.equip(m, id); Sound.sfx('equip');
              if (prev) {
                await say('「' + ITEMS[prev].name + 'は ' + Game.sellPrice(prev) + 'ゴールドで ひきとろうか？」', { wait: false });
                if (await choose(['はい', 'いいえ']) === 0) { Game.removeItem(prev, 1); Game.s.gold += Game.sellPrice(prev); Sound.sfx('coin'); }
              }
            }
          }
        } else await say('「まいどあり！」');
      } else await say('「まいどあり！」');
    }
    Msg.close();
    menu.close(); Scenes.remove(info);
  }
}
async function shopSell() {
  let idx = 0;
  for (;;) {
    const list = Game.bagList(it => it.kind !== 'key');
    if (!list.length) { await say('「うれる ものは なにも もって いないようだね。」'); Msg.close(); return; }
    const info = pushInfo(() => drawGoldWindow(176, 8));
    const items = list.map(id => ({ label: ITEMS[id].name, right: Game.sellPrice(id) + 'G ×' + Game.count(id) }));
    const menu = new Menu({ items, x: 8, y: 40, w: 200, index: Math.min(idx, items.length - 1), rows: Math.min(8, items.length) });
    const r = await menu.choose();
    if (r < 0) { menu.close(); Scenes.remove(info); return; }
    idx = r;
    const id = list[r], price = Game.sellPrice(id);
    await say('「' + ITEMS[id].name + 'なら ' + price + 'ゴールドで かいとろう。 いいかい？」', { wait: false });
    if (await choose(['はい', 'いいえ']) === 0) { Game.removeItem(id, 1); Game.s.gold += price; Sound.sfx('coin'); }
    Msg.close();
    menu.close(); Scenes.remove(info);
  }
}

/* ---------- tavern helpers ---------- */
function tavernPool() {
  const pool = Game.s.bench.map(m => ({ m }));
  for (const c of TAVERN_CANDIDATES) if (!Game.flag('cand:' + c.name)) pool.push({ cand: c });
  return pool;
}
async function tavernAdd() {
  if (Game.party.length >= MAX_PARTY) { await say('「あら、 もう なかまが いっぱいよ。 はずしてから また きてね。」', { wait: false }); return; }
  const pool = tavernPool();
  if (!pool.length) { await say('「いまは だれも いないわ。」', { wait: false }); return; }
  let cur = 0;
  Msg.close();
  const info = pushInfo(() => {
    const e = pool[cur]; if (!e) return;
    const job = e.m ? e.m.job : e.cand.job;
    drawWindow(8, 176, 240, 58);
    drawText(JOBS[job].name + (e.m ? '　Lv' + e.m.level : '　Lv1'), 20, 186, COL.yellow);
    const d = JOBS[job].desc;
    wrapText(d, 216).slice(0, 2).forEach((l, i) => drawText(l, 20, 202 + i * 14));
  });
  const items = pool.map(e => (e.m ? { label: e.m.name, right: JOBS[e.m.job].name } : { label: e.cand.name, right: JOBS[e.cand.job].name }));
  const menu = new Menu({ items, x: 16, y: 8, w: 180, rows: Math.min(9, items.length), title: 'だれを くわえる？', onChange: i => { cur = i; } });
  const r = await menu.choose();
  menu.close(); Scenes.remove(info);
  if (r < 0) { await say('「ほかに なにか ごようかしら？」', { wait: false }); return; }
  const e = pool[r];
  let m = e.m;
  if (!m) {
    m = Game.createMember(e.cand.name, e.cand.job, e.cand.gender, e.cand.pers);
    m.uid = Game.newUid();
    Game.setFlag('cand:' + e.cand.name);
  } else Game.s.bench.splice(Game.s.bench.indexOf(m), 1);
  Game.party.push(m);
  Field.resetTrail();
  await say('「' + m.name + '、 いってらっしゃい！」');
  await Sound.playJingle('join');
  await say(m.name + 'が なかまに くわわった！');
}
async function tavernRemove() {
  const cands = Game.party.filter(m => !m.isHero);
  if (!cands.length) { await say('「あなた ひとりじゃ ないの。」', { wait: false }); return; }
  const m = await chooseMember({ title: 'だれを はずす？', members: cands, right: mm => JOBS[mm.job].name });
  if (!m) return;
  Game.party.splice(Game.party.indexOf(m), 1);
  Game.s.bench.push(m);
  Field.resetTrail();
  await say('「' + m.name + 'は ここで まっているわね。」');
}
async function tavernRegister() {
  await say('「あたらしい なかまを とうろく するのね。 まずは しょくぎょうを えらんでちょうだい。」');
  Msg.close();
  let cur = 0;
  const info = pushInfo(() => { const j = JOB_ORDER[cur]; drawWindow(8, 176, 240, 58); wrapText(JOBS[j].desc, 216).slice(0, 2).forEach((l, i) => drawText(l, 20, 190 + i * 16)); });
  const menu = new Menu({ items: JOB_ORDER.map(j => JOBS[j].name), x: 16, y: 16, w: 110, onChange: i => { cur = i; } });
  const r = await menu.choose();
  menu.close(); Scenes.remove(info);
  if (r < 0) { await say('「ほかに なにか ごようかしら？」', { wait: false }); return; }
  const job = JOB_ORDER[r];
  await say('「' + JOBS[job].name + 'ね。 おとこ？ おんな？」', { wait: false });
  const g = await choose(['おとこ', 'おんな']);
  if (g < 0) return;
  Msg.close();
  const name = await nameEntry('なかまの なまえは？', '', 4);
  const pers = pick(Object.keys(PERSONALITIES));
  const m = Game.createMember(name, job, g === 1 ? 'f' : 'm', pers);
  m.uid = Game.newUid();
  Game.s.bench.push(m);
  await say('「' + name + '（' + JOBS[job].name + '）を とうろく したわ。 せいかくは 『' + PERSONALITIES[pers].name + '』 みたいね。」');
  if (Game.party.length < MAX_PARTY) {
    await say('「すぐに なかまに くわえる？」', { wait: false });
    if (await choose(['はい', 'いいえ']) === 0) {
      Game.s.bench.splice(Game.s.bench.indexOf(m), 1);
      Game.party.push(m); Field.resetTrail();
      await Sound.playJingle('join');
      await say(name + 'が なかまに くわわった！');
    }
  }
}
