const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const trackCount = JSON.parse(fs.readFileSync(path.join(root, 'songs.json'), 'utf8').replace(/^\uFEFF/, '')).songs.length;
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (error, data) => {
    const headers = { 'Content-Type': ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.mp3': 'audio/mpeg' })[path.extname(file)] || 'application/octet-stream' };
    const range = !error && req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    if (range) {
      const start = Number(range[1]), end = range[2] ? Math.min(Number(range[2]), data.length - 1) : data.length - 1;
      if (start > end || start >= data.length) { res.writeHead(416, { 'Content-Range': `bytes */${data.length}` }); res.end(); return; }
      res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${data.length}`, 'Content-Length': end - start + 1, 'Accept-Ranges': 'bytes' });
      res.end(data.subarray(start, end + 1)); return;
    }
    res.writeHead(error ? 404 : 200, headers);
    res.end(error ? 'Not found' : data);
  });
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const context = await browser.newContext();
    await context.route('https://**/*', route => route.abort());
    await context.addInitScript(() => {
      window.lockCalls = 0;
      window.lockReleases = 0;
      Object.defineProperty(navigator, 'wakeLock', { value: { request: async () => {
        window.lockCalls++;
        const lock = new EventTarget();
        lock.released = false;
        lock.release = async () => { lock.released = true; window.lockReleases++; lock.dispatchEvent(new Event('release')); };
        window.testLock = lock;
        return lock;
      } } });
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const base = `http://127.0.0.1:${server.address().port}`;
    await page.goto(base);
    await page.waitForFunction(count => songs.length === count, trackCount);
    await page.getByRole('button', { name: '옵션 설정', exact: true }).click();
    for (const width of [320, 390, 844, 1366]) {
      await page.setViewportSize({ width, height: width === 844 ? 390 : 844 });
      assert(await page.locator('.playback-options').evaluate(el => el.scrollWidth <= el.clientWidth));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Page overflow ${width}`);
      await page.locator('#optionGap').selectOption('3');
    }
    await page.locator('#optionContinuous').uncheck();
    await page.locator('#optionEffects').uncheck();
    await page.getByRole('button', { name: '설정 닫기' }).click();
    await page.reload();
    await page.waitForFunction(count => songs.length === count, trackCount);
    assert(await page.evaluate(() => playbackOptions.gapSeconds === 3 && !playbackOptions.continuous && !playbackOptions.visualEffects));
    await page.getByRole('button', { name: '옵션 설정', exact: true }).click();
    await page.locator('#optionScreen').check();
    await page.evaluate(() => {
      Object.defineProperty(audio, 'paused', { configurable: true, value: false });
      audio.dispatchEvent(new Event('play'));
    });
    await page.waitForFunction(() => lockCalls === 1);
    await page.locator('#optionScreen').uncheck();
    await page.waitForFunction(() => lockReleases === 1);
    await page.locator('#optionScreen').check();
    await page.waitForFunction(() => lockCalls === 2);
    await page.evaluate(() => testLock.release());
    await page.locator('#screenRetry').click();
    await page.waitForFunction(() => lockCalls === 3);
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    await page.waitForFunction(() => lockReleases === 3);
    await page.evaluate(() => window.dispatchEvent(new Event('pageshow')));
    await page.waitForFunction(() => lockCalls === 4);
    await page.evaluate(() => { Object.defineProperty(audio, 'paused', { configurable: true, value: true }); audio.dispatchEvent(new Event('pause')); });
    await page.waitForFunction(() => lockReleases === 4);
    for (const seconds of [0, 1, 2, 3]) {
      const elapsed = await page.evaluate(seconds => new Promise(resolve => {
        playbackOptions.gapSeconds = seconds;
        const started = performance.now();
        scheduleAutoAdvance(() => resolve(performance.now() - started));
      }), seconds);
      assert(elapsed >= seconds * 1000 - 50 && elapsed < seconds * 1000 + 1500, `Gap ${seconds}: ${elapsed}`);
    }
    await page.evaluate(() => {
      playbackOptions.continuous = false;
      state.repeatMode = 'off';
      audio.dispatchEvent(new Event('ended'));
    });
    assert(await page.evaluate(() => autoAdvanceTimer === null));
    await page.evaluate(() => { playbackOptions.gapSeconds = 3; scheduleAutoAdvance(() => { window.unwantedAdvance = true; }); });
    await page.locator('#optionGap').selectOption('0');
    assert(await page.evaluate(() => autoAdvanceTimer === null && !window.unwantedAdvance));
    await page.keyboard.press('Escape');
    assert(!await page.locator('.playback-options').isVisible());
    await page.goto(base + '/m.html');
    await page.waitForFunction(count => songs.length === count, trackCount);
    assert(await page.locator('#tab-player').isVisible());
    if (await page.evaluate(() => songs.some(song => song.id === 'still-beautiful'))) {
      await page.evaluate(() => loadTrack(songs.findIndex(song => song.id === 'still-beautiful'), true));
      await page.waitForFunction(() => !audio.paused && Number.isFinite(audio.duration) && state.lyrics.length > 0);
      assert.equal(await page.locator('#title').textContent(), 'Still Beautiful');
      assert.equal(await page.locator('#artist').textContent(), 'TRINITY');
      await page.waitForFunction(() => document.getElementById('cover').naturalWidth > 0);
      assert(await page.evaluate(() => getTrackShareUrl().endsWith('/share/15.html')));
    }
    assert.deepEqual(errors, []);
    console.log('PASS: options layout, persistence, mocked wake-lock request/release/retry, 0–3 second timing, continuous stop, pending-gap cancellation, Escape and m.html entry');
  } finally { if (browser) await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
