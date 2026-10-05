// Opens the built page in headless Chromium and prints, per post, what the copy button would paste.
// Usage (from this folder, after build.py): NODE_PATH=$(npm root -g) node verify.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const p = await b.newPage({ viewport: { width: 420, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(__dirname, 'out', 'samjung-cafe-post.html'));
  const ids = await p.evaluate(() => POSTS.map(x => x.id));
  for (const id of ids) {
    await p.selectOption('#postSel', id);
    const h = await p.evaluate(() => copyHTML(cur));
    const raw = (h.match(/raw\.githubusercontent\.com/g) || []).length;
    console.log(id, await p.textContent('#count'), '| 인용구', (h.match(/<blockquote>/g) || []).length,
      '| 사진', (h.match(/<img /g) || []).length, `(공개 주소 ${raw})`, '| 카톡 링크', (h.match(/sWb5ALAi/g) || []).length,
      '| 전화', h.includes('010-8076-5711'));
  }
  const w = await p.evaluate(() => document.documentElement.scrollWidth);
  console.log('page width at 420px:', w, errs.length ? errs : 'no errors');
  await b.close();
})();
