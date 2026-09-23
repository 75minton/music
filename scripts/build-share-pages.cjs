// Regenerate share/1.html through share/13.html from the 14.html design.
// Run: node scripts/build-share-pages.cjs
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8').replace(/^\uFEFF/, '');
const template = read('share/14.html');
const songs = JSON.parse(read('songs.json')).songs;
const base = 'https://75minton.github.io/music/';
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const json = value => JSON.stringify(value).replace(/</g, '\\u003c');
const descriptions = [
  ['함께 뛰는 순간, 우리의 이야기가 시작됩니다.', '셔틀콕과 라켓, 친구들의 웃음으로 채우는 75민턴의 시작. 코트 위에서 피어나는 우정과 함께하는 설렘을 담았습니다.'],
  ['라켓을 잡으면, 우리는 다시 하나.', '서로 밀어주고 끌어주는 친구들과 코트 위에서 만나는 시간. 땀방울 속에 되살아나는 우정과 그 시절의 마음을 노래합니다.'],
  ['오래 달려온 우리에게도, 아직 봄은 남아 있습니다.', '바쁜 일상과 지나가는 계절 사이에서 잠시 자신을 돌아보는 이야기. 잊고 지냈던 마음에 따뜻한 안부를 건넵니다.'],
  ['긴 하루를 내려놓고, 오늘 밤을 밝혀요.', '하루 동안 쌓인 스트레스를 털어내고 우리만의 시간을 맞이하는 노래. 코트에서 시작되는 밤의 활기를 만나보세요.'],
  ['말하지 않아도 알아주는 네가 있어.', '외로운 날에도 눈빛으로 마음을 알아주는 사람. 평범한 하루를 웃음으로 바꾸는 곁의 소중함을 담은 첫 번째 이야기입니다.'],
  ['언제나 곁에 있는 마음, 두 번째 이야기.', '함께 있으면 웃음이 되는 하루와 말없이 전해지는 위로. 「언제나 네가 있어」의 마음을 Part2로 이어갑니다.'],
  ['Seven Five Rabbits, 우리가 만나는 이름.', '문을 열고 라켓을 드는 순간, 서로의 눈빛으로 이어지는 우리. 함께 코트에 모인 친구들의 에너지를 담았습니다.'],
  ['코트의 불빛 아래, 다시 빛나는 우리.', '긴 하루 끝에 무거운 마음을 내려놓고 라켓을 잡는 시간. 불 켜진 코트에서 함께 시작하는 밤을 그립니다.'],
  ['오늘의 무게를 내려놓고, 코트 안으로.', '은은한 코트의 불빛과 가벼워지는 발걸음. 「Court Light」의 밤을 Part2의 흐름으로 만나보세요.'],
  ['네가 나타나면, 하루가 환해져.', '햇살과 미소, 함께 걷는 작은 발걸음으로 달라지는 하루. 서로의 일상을 밝히는 순간을 노래합니다.'],
  ['빛 사이에서, 나의 중심을 찾아.', '호흡을 고르고 한 걸음씩 자신에게 가까워지는 시간. 말없이도 선명해지는 마음과 내면의 빛을 담았습니다.'],
  ['괜찮아, 잠시 멈춰도 돼.', '긴 하루와 말하지 못한 눈물 곁에 머무는 목소리. 힘든 순간에도 혼자가 아니라는 다정한 마음을 전합니다.'],
  ['하루 끝에 만나, 우리는 함께 갑니다.', '익숙한 얼굴과 오래된 친구들이 모이는 코트. 점수 너머의 웃음과 함께하는 힘을 노래합니다.']
];
for (let i = 0; i < 13; i++) {
  const song = songs[i], no = i + 1;
  const bytes = fs.readFileSync(path.join(root, song.lrc.split('?')[0]));
  let lrc;
  try { lrc = new TextDecoder('utf-8', {fatal:true}).decode(bytes); }
  catch { lrc = new TextDecoder('euc-kr', {fatal:true}).decode(bytes); }
  const offset = Number(lrc.match(/\[offset:([+-]?\d+)\]/i)?.[1] || 0) / 1000;
  const lyrics = [];
  for (const line of lrc.split(/\r?\n/)) {
    const times = [...line.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)];
    const x = line.replace(/\[[^\]]*\]/g, '').trim();
    for (const time of times) lyrics.push({t: Math.max(0, Number(time[1]) * 60 + Number(time[2]) + offset), x});
  }
  lyrics.sort((a,b) => a.t-b.t);
  if (!lyrics.length || lrc.includes('\uFFFD')) throw new Error(`Invalid lyrics: ${song.lrc}`);
  const [headline, story] = descriptions[i];
  const description = `${song.title} — ${song.artist}. ${story}`;
  const cover = new URL(song.cover, base).href;
  const audio = new URL(song.url, base).href;
  const pageUrl = `${base}share/${no}.html`;
  let html = template.replace('<html lang="en">','<html lang="ko">');
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${json({
    '@context':'https://schema.org', '@type':'MusicRecording', name:song.title,
    byArtist:{'@type':'MusicGroup', name:song.artist}, url:pageUrl,
    audio:{'@type':'AudioObject', contentUrl:audio, encodingFormat:'audio/mpeg'}, image:cover
  })}</script>`);
  html = html.replace(/<meta (name|property)="(description|og:description|twitter:description)" content="[^"]*" \/>/g,
    (_, kind, name) => `<meta ${kind}="${name}" content="${escape(description)}" />`);
  html = html.replace(/  <meta property="og:image:(width|height)"[^>]*>\r?\n/g, '');
  html = html.replaceAll(`${base}share/14.html`, pageUrl)
    .replaceAll(`${base}share/the-tenth-season-og.jpg`, escape(cover))
    .replaceAll(`${base}sound/THE TENTH SEASON.mp3`, escape(song.url.replace(/^\.\//, '../')))
    .replace('src="the-tenth-season-cover.jpg"', `src="${escape(song.cover.replace(/^\.\//, '../'))}"`)
    .replaceAll('THE TENTH<br>SEASON', escape(song.title))
    .replaceAll('THE TENTH SEASON', escape(song.title)).replaceAll('YOUA', escape(song.artist))
    .replaceAll('English Version · 2026', `TRACK ${String(no).padStart(2,'0')} · 75 MINTON`)
    .replaceAll('English Version', '75 Minton Music')
    .replaceAll('index.html?no=14', `index.html?no=${no}`);
  // Social audio URLs must stay absolute; playback/download links stay local.
  html = html.replace(/(<meta property="og:audio" content=")[^"]*/, `$1${escape(audio)}`);
  html = html.replace(/<p class="story">[\s\S]*?<\/p>/, `<p class="story"><strong>${escape(headline)}</strong><br>${escape(story)}</p>`);
  html = html.replace(/<div class="quote">[\s\S]*?<\/div>/, `<div class="quote"><em>“${escape(lyrics.find(l=>l.x)?.x || song.title)}”</em><br>${escape(headline)}</div>`);
  html = html.replace(/<a class="btn" href="https:\/\/youtu.be\/3FtEy-0DMs4"[\s\S]*?<\/a>/,
    song.youtube ? `<a class="btn" href="${escape(song.youtube)}" target="_blank" rel="noopener">WATCH MV / 영상</a>` : `<a class="btn" href="../index.html?no=${no}">앱에서 듣기</a>`);
  html = html.replace('id="duration">3:02', 'id="duration">--:--').replace('aria-valuemax="182"','aria-valuemax="0"')
    .replace('id="lyricNext">If I move closer', `id="lyricNext">${escape(lyrics.find(l=>l.x)?.x || '')}`)
    .replaceAll('Press play to begin', '재생 버튼을 눌러주세요');
  html = html.replace(/const lyrics = \[[\s\S]*?\];/, `const lyrics = ${json(lyrics)};`);
  html = html.replace(/const data=\{title:[\s\S]*?,url:location.href\}/, `const data={title:${json(song.title+' – '+song.artist)},text:${json(description)},url:location.href}`);
  html = html.replaceAll('audio.duration||182.4','audio.duration||0');
  html = html.replace('p=Math.min(1,audio.currentTime/d)', 'p=d>0?Math.min(1,audio.currentTime/d):0');
  html = html.replace('function seekFromEvent(e){', 'function seekFromEvent(e){if(!Number.isFinite(audio.duration)||audio.duration<=0)return;');
  html = html.replace('if(e.key===\'ArrowRight\'||e.key===\'ArrowLeft\'){', 'if((e.key===\'ArrowRight\'||e.key===\'ArrowLeft\')&&Number.isFinite(audio.duration)){');
  html = html.replace('audio.play().catch(()=>{})', "audio.play().catch(()=>showToast('음원을 재생하지 못했습니다. 다시 시도해 주세요.'))");
  html = html.replace('let lastSection=', `const escapeText = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));\n    let lastSection=`)
    .replace('${l.s}</div>', '${escapeText(l.s)}</div>').replace('${l.x}</div>', '${escapeText(l.x)}</div>');
  html = html.replace('</style>', '  .content{min-width:0}h1{line-height:1.12;word-break:keep-all;overflow-wrap:anywhere;font-size:clamp(32px,4vw,60px)}.cover-fallback b{line-height:1.15;word-break:keep-all;overflow-wrap:anywhere}.brand{letter-spacing:.1em}\n  </style>');
  fs.writeFileSync(path.join(root, `share/${no}.html`), html);
  console.log(`${no}: ${song.title} (${lyrics.length} lyric lines)`);
}
