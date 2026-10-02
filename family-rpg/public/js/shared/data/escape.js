// みちびきの糸: 洞窟や 塔の 中で 使うと、入ってきた 入り口の 外まで いっきに もどれる 道具
//   つかいかたの きまりは world/escape.js（どの 出口か は ワープを たどって きめる）
//   ・ふつうの 道具屋（ホシフル村・ルミナの町・カモメ港）で 売っている
//   ・フィールドの メニューの「道具」から 使う（洞窟・塔・宝の洞窟の 中だけ。たてものの 中では 使えない）

export const ESCAPE_ITEM = 'guide_thread';

export const ESCAPE_ITEMS = {
  [ESCAPE_ITEM]: {
    name: 'みちびきの糸', type: 'use', price: 70, target: 'self', battle: false, field: true,
    effect: { type: 'exit' },
    desc: '洞窟や塔の中で使うと、入り口まで一気にもどれる。いっしょにいる仲間も外へ出られる。',
  },
};

export const ESCAPE_KANA = {
  guide_thread: 'みちびきのいと',
};
