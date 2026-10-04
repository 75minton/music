// Run with Node.js and Playwright installed; uses the local Edge browser.
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const hits = [];
const server = http.createServer((req, res) => {
  const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  hits.push(name);
  const file = path.join(__dirname, name === '/' ? 'index.html' : name);
  const types = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png'};
  fs.readFile(file, (error, data) => {
    res.writeHead(error ? 404 : 200, {'Content-Type': types[path.extname(file)] || 'application/octet-stream'});
    res.end(error ? 'Not found' : data);
  });
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({headless:true, channel:'msedge'});
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route(/https:\/\//, route => route.abort());
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() => navigator.serviceWorker.controller);
    await page.evaluate(() => document.querySelector('[data-tab="player"]').click());
    for (const [width, height] of [[390,844],[844,390],[1024,600],[1366,768],[1920,1080],[390,844]]) {
      await page.setViewportSize({width,height});
      await page.waitForTimeout(150);
      const compact = await page.evaluate(() => isMobileEqLayout());
      if (compact && !await page.locator('#eqPanel').evaluate(el => el.classList.contains('expanded'))) await page.locator('#eqToggle').click();
      for (const button of await page.locator('.eq-preset').all()) {
        await button.scrollIntoViewIfNeeded();
        assert(await button.isVisible(), `Hidden preset at ${width}x${height}`);
        await button.click({trial:true});
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Horizontal overflow');
      console.log('EQ reachable', width, height, compact);
      if (compact) await page.locator('#eqClose').click();
    }
    const imageUrl = '/icons/icon-192.png';
    const covers = await page.evaluate(() => songs.map(song => song.cover).filter(url => url && !url.startsWith('data:')));
    await page.evaluate(urls => Promise.all(urls.map(url => fetch(url).then(r => r.blob()))), covers);
    const imageHits = () => hits.filter(x => /\.(png|jpg|jpeg|webp|svg|ico)$/i.test(x)).length;
    await page.evaluate(url => fetch(url).then(r => r.blob()), imageUrl);
    const before = hits.filter(x => x === imageUrl).length;
    const coversBefore = imageHits();
    const hitOffset = hits.length;
    await page.reload();
    await page.evaluate(url => fetch(url).then(r => r.blob()), imageUrl);
    await page.evaluate(urls => Promise.all(urls.map(url => fetch(url).then(r => r.blob()))), covers);
    await page.waitForTimeout(300);
    assert.equal(hits.filter(x => x === imageUrl).length, before, 'Cached image requested from network');
    assert.equal(imageHits(), coversBefore, 'Cached covers requested from network: ' + JSON.stringify(hits.slice(hitOffset).filter(x => /\.(png|jpg|jpeg|webp|svg|ico)$/i.test(x))));
    await context.setOffline(true);
    assert(await page.evaluate(url => fetch(url).then(r => r.ok), imageUrl));
    await page.reload();
    assert(await page.locator('#eqToggle').count());
    assert.deepEqual(errors, []);
    console.log('PASS: cache reuse after reload, offline image/app shell, no uncaught JavaScript errors');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
