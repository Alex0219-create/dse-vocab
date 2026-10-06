/*
 * 模擬 30 日溫習：每日溫「到期 + 20 個新詞」，睇複習負荷會唔會失控
 * 對比修復前（無配額、無去重、會提前溫未到期詞）同修復後
 */
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const html = fs.readFileSync('/data/workspace/index.html', 'utf8');
const vocab = fs.readFileSync('/data/inputs/dse_vocab_data.js', 'utf8');
const enh = fs.readFileSync('/data/workspace/dse_vocab_enhance.js', 'utf8');

const vc = new VirtualConsole();
const dom = new JSDOM(html, {
  runScripts: 'dangerously', url: 'https://e.com/', virtualConsole: vc,
  beforeParse(w) {
    w.fetch = u => String(u).includes('enhance')
      ? Promise.resolve({ ok: true, text: () => Promise.resolve(enh) })
      : Promise.resolve({ ok: true, text: () => Promise.resolve(vocab) });
    w.matchMedia = () => ({ matches: false, addListener(){}, addEventListener(){}, removeEventListener(){} });
  }
});
const w = dom.window;

setTimeout(() => {
  const S = w.eval('Store'), SM = w.eval('SM2'), D = w.eval('Data'), U = w.eval('Utils');

  // ---- 固定「今日」以便逐日推進（要改 jsdom 自己嗰個 Date）
  const WD = w.eval('Date');
  let fake = WD.now();
  const RealNow = WD.now;
  WD.now = () => fake;
  const realToday = U.today;

  console.log('日 | 到期 | 今日溫 | 新學 | 累計已學 | 隊列');
  console.log('---+------+--------+------+----------+------');

  let totalLearned = 0;
  for (let day = 1; day <= 90; day++) {
    U.today = () => 'D' + day;
    w.eval('Utils').today = U.today;
    S.state.day = { d: 'D' + day, learn: 0, review: 0, quiz: 0 };
    S.tally = S.tally.bind(S);

    const st0 = SM.stats();
    const q = SM.duePool('all', 1);
    let done = 0;
    // 每日最多溫 200 張（模擬學生上限）
    for (const word of q.slice(0, 200)) {
      // 模擬 85% 答啱（溫過嘅詞記憶較穩）
      const isNew = !S.state.sched[S.key(word)];
      const ok = Math.random() < (isNew ? 0.7 : 0.85);
      SM.review(word, ok ? 5 : 0);
      if (ok) { S.state.known.add(S.key(word)); S.state.wrong.delete(S.key(word)); }
      else { S.state.wrong.add(S.key(word)); S.state.known.delete(S.key(word)); }
      done++;
    }
    totalLearned = Object.keys(S.state.sched).length;
    const d = S.state.day;
    console.log(
      String(day).padStart(3) + ' | ' +
      String(st0.due).padStart(4) + ' | ' +
      String(done).padStart(6) + ' | ' +
      String(d.learn).padStart(4) + ' | ' +
      String(totalLearned).padStart(8) + ' | ' +
      String(q.length).padStart(4)
    );
    fake += 86400000;   // 推進一日
  }
  const st = SM.stats();
  console.log('\n90 日後：已學 %d 詞，到期 %d，錯詞 %d', totalLearned, st.due, st.wrong);
  console.log('平均每日要溫：%.1f 張', (totalLearned * 1.0 / 90).toFixed(1));
  WD.now = RealNow;
  U.today = realToday;
  w.eval('Utils').today = realToday;
}, 2500);
