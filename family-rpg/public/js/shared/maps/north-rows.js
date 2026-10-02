// 第3章「星の竜がねむる山」の 町・村・神殿の レイアウト（1文字 = 1マス。文字の いみは tiles.js の LEGEND）
// a=雪 d=雪の道 N=ふかい雪 e=雪の もみの木 K=雪の岩山 m=火山の岩 ==土 (=温泉 1=レール 3=レールの はし 6=火の ついた かがり火

// 竜守りの村（32×25）: 長老の家（左上）・竜のほこら（右上。炎の守り星の 台）・宿屋（左下）・よろず屋（右下）
// 門: 北（星竜山・神殿へ）・南（雪原の広場へ）・西（白銀の湖へ）・東（鉱山の町へ）
export const VILLAGE3_ROWS = [
  'eeFFFFFFFFFFFFFddFFFFFFFFFFFFFee',
  'eaaaNaaaaaaaaaaddaaaaaaaaaaaaNae',
  'eWWWWWWWWWWaaaaddaaa###########e',
  'eWkk_f__kkWaNaaddaaa#z6zzXzz6z#e',
  'eW________WaaaaddaaN#zzzzzzzzz#e',
  'eW_tt____BWaaaaddaaa#zzzzrzzzz#e',
  'eW_cc____BWaaaaddaaa#zzzzrzzzz#e',
  'eWO______oWeaaaddaaa#zYzzrzzYz#e',
  'eWWWWDWWWWWaaaaddaaa#zzzzrzzzz#e',
  'eaaaadaaaaaaaaaddaaa#####D#####e',
  'eaaaaddddddddddddddddddddddaaaae',
  'eWWWWWWWaa;;;;;;;;;;;;aaWWWWWWWe',
  'eW_B_O_Waa;;w;;;;;;Y;;aaW_x_B_We',
  'eW_____Waa;;;;;;;;;;;;aaW_____We',
  'eW_tc_oWaa;;;;;;;;;;;;aaWo_tc_We',
  'eWWWDWWWaa;;;;;;;;;;;;aaWWWDWWWe',
  'dddddddddddddddddddddddddddddddd',
  'eWWWWWWWWWaaaaaddaaaaaWWWWWWWWWe',
  'eW__B_B_BWaaNaaddaaaaaWS_O_x_SWe',
  'eWCC_____WaaaaaddaaaaaWCCC____We',
  'eW_______WaaaaaddaaaNaW_______We',
  'eW_t_c__oWaaaaaddaaaaaWo__t_c_We',
  'eWWWWDWWWWaaaaaddaaaaaWWWWDWWWWe',
  'eaaaadddddddddddddddddddddaaaaae',
  'eeFFFFFFFFFFFFFddFFFFFFFFFFFFFee',
];

// 鉱山の町カナトコ（34×25）: 親方の家（左上）・武器屋（右上）・道具屋・防具屋・宿屋（大浴場つき）・教会・預かり所と かじ屋
// 北の 門から 鉱山へ レールが のびている。西の 門は 竜守りの村、南の 門は トンネル（温泉の里）へ
export const KANATOKO_ROWS = [
  'KKKKKKKKKKKKKKKKd1KKKKKKKKKKKKKKKK',
  'KaaaaaaaaaaaaaaNd1aaaaaaaaaaaaaaaK',
  'KWWWWWWWWWWaaaaad1aaaaa##########K',
  'KWkk_f__kkWaOaaad1aaaaa#S_S_S_S_#K',
  'KW________WaaaaNd1aaaaa#________#K',
  'KW__tt__B_Waaaaad1aaaaa#CCCC____#K',
  'KWO_cc__B_Waaaaad3aaaaa#________#K',
  'KWWWWDWWWWWaaaaadaaaaaa####D#####K',
  'KaaaadaaaaaaaaaadaaaaaaaaaadaaaaaK',
  'd::::::::::::::::::::::::::::::::K',
  'd::::::::::::::::::::::::::::::::K',
  'KaWWWWWWWa::;;;;;;;;;;;;::WWWWWWWK',
  'KaWS_S_kWa::;;;;;;;Y;;;;::WS_S_SWK',
  'KaWCCC__Wa::;;;;;;;;;;;;::W_____WK',
  'KaW_____Wa::;;;;;;;;;;;;::WCCC__WK',
  'KaWO____Wa::;;w;;;;;;;;;::Wo___OWK',
  'KaWWWDWWWa::;;;;;;;;;;;;::WWWDWWWK',
  'K::::::::::::::::::::::::::::::::K',
  'KWWWWWWWWWWWa::WWWWWWaWWWWWWWWWWWK',
  'KW_C_B_B(((Wa::W_A__WaW_O_xWS_S_WK',
  'KW_C____(((Wa::W____WaWCCC_WCCC_WK',
  'KWO_______oWa::Wc_c_WaW____W____WK',
  'KWWWWWDWWWWWa::WWDWWWaWWDWWWWDWWWK',
  'K::::::::::::::::::::::::::::::::K',
  'KKKKKKKKKKKKK::KKKKKKKKKKKKKKKKKKK',
];

// 温泉の里ユノハ（26×21）: 湯守りのおばばの 家（左上）・温泉宿（右上）・外の 温泉（左）・道具屋（右）・防具屋（左下）
// 地面は 温泉の 熱で 雪が とけている。北の 門は トンネル（鉱山の町）、東の 門は 炎の山へ
export const YUNOHA_ROWS = [
  'mmmmmmmmmmmmddmmmmmmmmmmmm',
  'm===========dd===========m',
  'm=WWWWWWWW==dd==WWWWWWWWWm',
  'm=W_k__f_W==dd==W_B_B_B_Wm',
  'm=W______W==dd==WCCC____Wm',
  'm=W_tt__oW==dd==W_______Wm',
  'm=WWWDWWWW==dd==WWWWDWWWWm',
  'm====d======dd======d====m',
  'm====dddddddddddddddd====m',
  'm========;;;;;;;;========m',
  'm=((((((=;;;;;;;;;=WWWWWWm',
  'm=((((((=;;;;;;;;;=WS_S_Wm',
  'm=((((((=;;;;Y;;;;=WCC__Wm',
  'm========;;;;;;;;;=W____Wm',
  'm=WWWWWW=;;;;;;;;;=WWDWWWm',
  'm=WS_S_W====;;=======d===m',
  'm=WCC__W=============ddddd',
  'm=W____W=================m',
  'm=WWDWWW=================m',
  'm========================m',
  'mmmmmmmmmmmmmmmmmmmmmmmmmm',
];

// 竜の試練の神殿の 外がわ（17×11）: 石の 神殿・竜の 像。とびらは 下の まん中
export const TEMPLE_ROWS = [
  'KKKKKKKKKKKKKKKKK',
  'KK#############KK',
  'K##+p+++++++p+##K',
  'K#+++++Y+Y+++++#K',
  'K#+p+++++++++p+#K',
  'K#+++++rrr+++++#K',
  'K#+p+++rrr+++p+#K',
  'K##++++rrr++++##K',
  'aK######D######Ka',
  'aaa^aaaaddaaaa^aa',
  'aaaaaaaaddaaaaaaa',
];
