const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const html = fs.readFileSync('/data/workspace/index.html', 'utf8');
const vocab = fs.readFileSync('/data/inputs/dse_vocab_data.js', 'utf8');
const enh = fs.readFileSync('/data/workspace/dse_vocab_enhance.js', 'utf8');

const errs = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => { if (!/CSS/.test(e.message)) errs.push(e.message); });

const dom = new JSDOM(html, {
  runScripts: 'dangerously', url: 'https://example.com/', pretendToBeVisual: true, virtualConsole: vc,
  beforeParse(w) {
    w.fetch = u => String(u).includes('enhance')
      ? Promise.resolve({ ok: true, text: () => Promise.resolve(enh) })
      : Promise.resolve({ ok: true, text: () => Promise.resolve(vocab) });
    w.matchMedia = () => ({ matches: false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
    w.requestAnimationFrame = cb => setTimeout(cb, 0);
  }
});
const w = dom.window;

setTimeout(() => {
  const res = [];
  const t = (n, c, e) => res.push([n, !!c, e || '']);
  const S = w.eval('Store'), SM = w.eval('SM2'), D = w.eval('Data'), M = w.eval('Mission'), F = w.eval('Flash'), U = w.eval('Utils');

  // ---------- 每日計數器
  const d0 = S.day();
  t('day object exists', d0 && d0.d === U.today(), JSON.stringify(d0));
  t('day starts at zero', d0.learn === 0 && d0.review === 0 && d0.quiz === 0);

  // ---------- 新學 vs 複習 分流
  const w1 = D.raw[0], w2 = D.raw[1];
  SM.review(w1, 5);
  t('first review counts as learn', S.day().learn === 1 && S.day().review === 0, JSON.stringify(S.day()));
  SM.review(w1, 5);
  t('second review counts as review', S.day().learn === 1 && S.day().review === 1, JSON.stringify(S.day()));
  SM.review(w2, 0);
  t('new word fail still learn', S.day().learn === 2 && S.day().review === 1);

  // ---------- 任務卡反映今日
  const m = M.list();
  t('mission learn = today learn', m[0].done === S.day().learn, m[0].done + '/' + m[0].goal);
  t('mission review = today review', m[1].done === S.day().review, m[1].done + '/' + m[1].goal);
  t('mission quiz = 0 today', m[2].done === 0);
  t('mission not auto-complete', M.doneCount() < 3, M.doneCount() + '/3');

  // ---------- 新詞配額
  t('newLeft decreases', SM.newLeft() === (S.state.goal - 2), 'newLeft=' + SM.newLeft() + ' goal=' + S.state.goal);
  const q1 = SM.duePool('all', 1);
  const newInQ = q1.filter(x => !S.state.sched[S.key(x)]).length;
  t('new words capped by quota', newInQ <= SM.newLeft() + 1, 'newInQueue=' + newInQ + ' quota=' + SM.newLeft());
  t('queue not flooded with 10k cards', q1.length < 200, 'queue=' + q1.length);

  // ---------- 到期上限
  const q2 = SM.duePool('all', 1);
  const dueInQ = q2.filter(x => { const s = S.state.sched[S.key(x)]; return s && s.due <= Date.now(); }).length;
  t('due capped by quota', dueInQ <= Math.max(30, S.state.goal * 5), 'due=' + dueInQ);

  // ---------- 唔會提前溫未到期嘅詞
  // 排一個 30 日後到期嘅詞
  const w3 = D.raw[500];
  S.state.sched[S.key(w3)] = { int: 30, rep: 3, due: Date.now() + 30 * 86400000, ef: 2.5 };
  S.state.wrong.delete(S.key(w3));
  const q3 = SM.duePool('all', 1);
  t('future-scheduled word excluded', q3.indexOf(w3) < 0, 'idx=' + q3.indexOf(w3));

  // ---------- 錯詞即時重溫
  const w4 = D.raw[600];
  S.state.sched[S.key(w4)] = { int: 10, rep: 2, due: Date.now() + 10 * 86400000, ef: 2.5 };
  S.state.wrong.add(S.key(w4));
  const q4 = SM.duePool('all', 1);
  t('wrong word re-enters queue', q4.indexOf(w4) >= 0, 'idx=' + q4.indexOf(w4));

  // ---------- 明日優先排最前
  const w5 = D.raw[700];
  S.state.sched[S.key(w5)] = { int: 5, rep: 1, due: Date.now() + 5 * 86400000, ef: 2.5 };
  S.state.tomo.add(S.key(w5));
  const q5 = SM.duePool('all', 1);
  const tomoIdx = q5.findIndex(x => S.state.tomo.has(S.key(x)));
  t('tomo first', tomoIdx === 0, 'idx=' + tomoIdx);

  // ---------- 卡片類型
  const wNew = D.raw.find(x => !S.state.sched[S.key(x)] && !S.state.tomo.has(S.key(x)));
  t('type: new', SM.type(wNew).t.indexOf('新學') >= 0, SM.type(wNew).t);
  t('type: tomo', SM.type(w5).t.indexOf('明日優先') >= 0, SM.type(w5).t);
  const wDue = D.raw[900];
  S.state.sched[S.key(wDue)] = { int: 1, rep: 1, due: Date.now() - 2 * 86400000, ef: 2.5 };
  S.state.wrong.delete(S.key(wDue)); S.state.tomo.delete(S.key(wDue));
  t('type: due with overdue days', /到期複習（逾期 \d+ 日）/.test(SM.type(wDue).t), SM.type(wDue).t);

  // ---------- 配額用完後新詞停止
  S.day().learn = S.state.goal;
  const q6 = SM.duePool('all', 1);
  const newInQ6 = q6.filter(x => !S.state.sched[S.key(x)]).length;
  t('no new words after quota used', newInQ6 === 0, 'newInQueue=' + newInQ6);

  // ---------- 複習目標跟到期量
  S.state.sched = {};
  for (let i = 0; i < 25; i++) {
    const x = D.raw[1000 + i];
    S.state.sched[S.key(x)] = { int: 1, rep: 1, due: Date.now() - 86400000, ef: 2.5 };
  }
  const st = SM.stats();
  t('stats.due counts overdue', st.due >= 25, 'due=' + st.due);
  const rGoal = M.list()[1].goal;
  t('review goal tracks due count', rGoal >= 25 && rGoal <= 30, 'goal=' + rGoal);

  // ---------- 跨日歸零
  S.state.day = { d: '2000-01-01', learn: 99, review: 99, quiz: 99 };
  const dNew = S.day();
  t('day resets on new date', dNew.learn === 0 && dNew.review === 0 && dNew.d === U.today(), JSON.stringify(dNew));

  // ---------- 介面
  w.eval('App').go('flash');
  const fh = w.document.querySelector('#flashWrap').innerHTML;
  t('flash shows card type badge', /新學|到期複習|明日優先|錯詞重溫/.test(fh), (fh.match(/m-badge[^>]*>([^<]+)/) || ['', ''])[1]);
  t('flash shows today progress', /今日 學 \d+\/\d+ · 複習 \d+/.test(fh.replace(/<[^>]*>/g, '')), (fh.replace(/<[^>]*>/g, ' ').match(/今日 學 \d+\/\d+ · 複習 \d+/) || [''])[0]);
  w.eval('App').go('home');
  const hh = w.document.querySelector('#view-home').innerHTML;
  t('home no undefined/NaN', !/undefined|NaN/.test(hh));
  t('no js errors', errs.length === 0, errs.slice(0, 3).join(' | '));

  let bad = 0;
  res.forEach(([n, ok, e]) => { if (!ok) bad++; console.log((ok ? 'PASS ' : 'FAIL ') + n + (e ? '  [' + e + ']' : '')); });
  console.log(bad ? '\n' + bad + ' FAILED' : '\nSRS ALL PASSED');
}, 2500);
