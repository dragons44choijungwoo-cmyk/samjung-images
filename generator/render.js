// Renders post images with draw.js in headless Chromium, straight into the repo's posts/ folder.
// Usage (from this folder): NODE_PATH=$(npm root -g) node render.js [post-file-name ...]
// With no names it renders only images that don't exist yet. Name a post (e.g. 2026-10-05-blog-marketing)
// to redraw all of its images; bump the -v<번호> in its file names first so GitHub's cache doesn't serve old ones.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const HERE = __dirname, REPO = path.dirname(HERE);
// Logo and model photos choi supplied; kept in the project files, not in this public repo.
const ASSET_DIR = process.env.ASSET_DIR || '/mnt/project-files/blog/assets';
const ASSETS = { logo: 'logo-crop.png', front: 'model-front.png', thinking: 'model-thinking.jpg', pointing: 'model-pointing.jpg' };

(async () => {
  const names = process.argv.slice(2);
  const posts = fs.readdirSync(path.join(HERE, 'posts')).filter(f => f.endsWith('.json')).sort()
    .filter(f => !names.length || names.includes(f.replace(/\.json$/, '')))
    .map(f => JSON.parse(fs.readFileSync(path.join(HERE, 'posts', f), 'utf8')))
    .map(p => {
      if (names.length) return p;
      const images = Object.fromEntries(Object.entries(p.images).filter(([, s]) => !fs.existsSync(path.join(REPO, p.imgDir, s.file))));
      return { ...p, images };
    })
    .filter(p => Object.keys(p.images).length);
  if (!posts.length) { console.log('그릴 이미지가 없습니다.'); return; }

  const urls = {};
  for (const [k, f] of Object.entries(ASSETS)) {
    const mime = f.endsWith('.png') ? 'image/png' : 'image/jpeg';
    urls[k] = `data:${mime};base64,` + fs.readFileSync(path.join(ASSET_DIR, f)).toString('base64');
  }
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const p = await b.newPage();
  await p.setContent('<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap"><body>');
  await p.addScriptTag({ content: fs.readFileSync(path.join(HERE, 'draw.js'), 'utf8') });
  await p.waitForTimeout(1500);
  if (!await p.evaluate(() => document.fonts.check('900 40px "Noto Sans KR"'))) console.warn('경고: Noto Sans KR 글꼴을 불러오지 못했습니다.');
  const out = await p.evaluate(([posts, urls]) => renderAll(posts, urls), [posts, urls]);
  for (const [rel, u] of Object.entries(out)) {
    const f = path.join(REPO, rel); fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, Buffer.from(u.split(',')[1], 'base64'));
    console.log(rel);
  }
  await b.close();
})();
