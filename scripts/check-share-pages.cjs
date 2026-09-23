// NODE_PATH may point to an existing Playwright installation.
const {chromium} = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const songs = JSON.parse(fs.readFileSync(path.join(root,'songs.json'),'utf8').replace(/^\uFEFF/, '')).songs;
const server = http.createServer((req,res) => {
  const file = path.join(root, decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  const size = fs.statSync(file).size;
  const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.png':'image/png','.mp3':'audio/mpeg'};
  const headers = {'Content-Type':mime[path.extname(file)]||'application/octet-stream','Accept-Ranges':'bytes'};
  const range = req.headers.range?.match(/bytes=(\d+)-(\d*)/);
  if(range){const start=Number(range[1]),end=range[2]?Math.min(Number(range[2]),size-1):size-1;res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1});fs.createReadStream(file,{start,end}).pipe(res);}
  else {res.writeHead(200,{...headers,'Content-Length':size});fs.createReadStream(file).pipe(res);}
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try {
    browser=await chromium.launch({channel:'msedge',headless:true});
    const page=await browser.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    // Never send test visits to the production analytics property.
    await page.route('https://**/*',route=>route.fulfill({status:200,contentType:'text/javascript',body:''}));
    for(let no=1;no<=13;no++){
      await page.setViewportSize({width:1440,height:1000});
      await page.goto(`http://127.0.0.1:${server.address().port}/share/${no}.html`);
      await page.waitForFunction(()=>Number.isFinite(document.getElementById('audio').duration));
      const song=songs[no-1];
      assert.equal(await page.locator('h1').textContent(),song.title);
      assert.equal(await page.locator('#audio').getAttribute('src'),song.url.replace('./','../'));
      assert(await page.locator('.cover img').evaluate(el=>el.complete&&el.naturalWidth>0));
      assert(await page.evaluate(()=>dataLayer.some(x=>x[0]==='config'&&x[1]==='G-EDL6TCGS9F')));
      await page.locator('#mainPlay').click();
      await page.waitForFunction(()=>!document.getElementById('audio').paused);
      await page.locator('#mainPlay').click();
      await page.locator('#lyricsBtn').click();
      assert(await page.locator('#lyricsModal').isVisible());
      await page.locator('.full-lyrics .line').nth(1).click();
      await page.waitForFunction(()=>document.querySelector('.full-lyrics .line.active'));
      await page.keyboard.press('Escape');
      assert(!await page.locator('#lyricsModal').isVisible());
      for(const width of [1440,390]){
        await page.setViewportSize({width,height:1000});
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow ${no}/${width}`);
        await page.locator('#shareBtn').click({trial:true});
        if(no===1||no===13){
          fs.mkdirSync(path.join(root,'.tmp-share-check'),{recursive:true});
          await page.screenshot({path:path.join(root,`.tmp-share-check/${no}-${width}.png`),fullPage:true});
        }
      }
      console.log(`PASS ${no}: title, cover, MP3 playback, lyrics, GA config, desktop/mobile`);
    }
    assert.deepEqual(errors,[]);
  } finally {if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
