// 星の神殿の 転職の せりふ（第27回 家族の ねがい「神官の せりふが 長い。転職しますか？と かんたんに」）
//   くわしい こと（職業レベルは 職業ごとに のこる・ほかの 職業の 技・上級職への 道）は
//   転職の まど（client/ui/services.js の jobUI）の せつめいに ある。せりふは 1〜2行だけ
//   ・JOB_GREET … 神官セレナが 話しかけた とき（data/story.js の job_change）
//   ・jobAskText … えらんだ 職業の かくにん（はい／いいえ）
//   ・jobDoneText … 転職した あと（world/services.js の jobChange の 返事。トーストに 出る）

export const JOB_GREET = '星の神殿へようこそ。\nどの職業に転職しますか？';

// mate: 仲間を 転職させる ときの 名前（自分は null）
export function jobAskText(jobName, mate = null) {
  return mate ? `${mate}を${jobName}に転職させますか？` : `${jobName}に転職しますか？`;
}

// 第33回: 職業に ついた ときの ひとこと（1行。新しい 職業だけ。ない 職業は 何も 足さない）
export const JOB_SAY = {
  magician: '「タネも仕かけもございません！」',
  kaito: '「予告状は、もうとどけたよ」',
  kaito_kid: '「レディース・エーン・ジェントルメーン！」',
  wizard_student: '「入学のしるしに、つえをもらった！」',
  harry: '「おでこのきずが、ちくっといたんだ…」',
  homeroom_3b: '「さあ、授業を始めますよ」',
  alchemist: '「両手を合わせて…れん成！」',
  state_alchemist: '「国のしるし、銀時計をもらった！」',
  fullmetal: '「だれがチビだって！？」',
  sailor_soldier: '「メイクアップ！」',
  sailor_moon: '「月にかわっておしおきよ！」',
};

// removed: 装備できなく なって はずした 物の 名前（多い ときは 2つ と「など」）
// jobId: なった 職業（JOB_SAY の ひとことを 2行目に）
export function jobDoneText(name, jobName, removed = [], jobId = null) {
  const say = jobId && JOB_SAY[jobId] ? `\n${JOB_SAY[jobId]}` : '';
  const off = removed.length ? `\n（${removed.slice(0, 2).join('・')}${removed.length > 2 ? 'など' : ''}を外した）` : '';
  return `${name}は${jobName}になった！${say}${off}`;
}
