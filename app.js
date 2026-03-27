
// 🐰 외부 이미지 파일 없이 HTML 자체에서 그려내는 75+토끼+셔틀콕 고화질 SVG 이미지 리소스입니다.
const defaultCover = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 500'%3E%3Cdefs%3E%3CradialGradient id='bg' cx='50%25' cy='50%25' r='50%25'%3E%3Cstop offset='0%25' stop-color='%232c2d30'/%3E%3Cstop offset='100%25' stop-color='%23121316'/%3E%3C/radialGradient%3E%3ClinearGradient id='gold' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23F2D06B'/%3E%3Cstop offset='50%25' stop-color='%23D4AF37'/%3E%3Cstop offset='100%25' stop-color='%23997A15'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='500' height='500' fill='url(%23bg)'/%3E%3Ccircle cx='250' cy='250' r='230' fill='none' stroke='rgba(255,255,255,0.03)' stroke-width='2'/%3E%3Ccircle cx='250' cy='250' r='190' fill='none' stroke='rgba(255,255,255,0.05)' stroke-width='1'/%3E%3Ccircle cx='250' cy='250' r='150' fill='none' stroke='rgba(255,255,255,0.02)' stroke-width='4'/%3E%3Ccircle cx='250' cy='250' r='130' fill='%231a1a1a' stroke='url(%23gold)' stroke-width='4'/%3E%3Cpath d='M220 160 Q200 90 230 110 Q240 130 240 160' fill='url(%23gold)'/%3E%3Cpath d='M280 160 Q300 90 270 110 Q260 130 260 160' fill='url(%23gold)'/%3E%3Cpath d='M225 330 L275 330 L260 360 L240 360 Z' fill='url(%23gold)'/%3E%3Ccircle cx='250' cy='365' r='10' fill='%23fff'/%3E%3Ctext x='250' y='285' font-family='Arial, sans-serif' font-weight='900' font-size='100' fill='url(%23gold)' text-anchor='middle' letter-spacing='-5'%3E75%3C/text%3E%3Ctext x='250' y='145' font-family='Arial' font-weight='bold' font-size='14' fill='%23aaa' text-anchor='middle' letter-spacing='4'%3ERABBIT CLUB%3C/text%3E%3Ctext x='250' y='315' font-family='Arial' font-weight='bold' font-size='12' fill='%23aaa' text-anchor='middle' letter-spacing='6'%3EMINTON%3C/text%3E%3C/svg%3E";

const SONGS_JSON_URL = './songs.json';
const SONGS_POLL_MS = 60000;
const STORAGE_SONGS_HASH_KEY = '75minton_songs_hash_v1';
const STORAGE_SONGS_SNAPSHOT_KEY = '75minton_songs_snapshot_v1';

// songs.json 이 없거나 읽기 실패할 때를 위한 기본 곡 목록
const FALLBACK_SONGS = [
  {
    id: 'we-are-75-rabbits',
    title: "함께하는 75 민턴 (Intro)",
    artist: "Tony.Park",
    cover: "./sound/함께하는 75 민턴 (Intro).png",
    url: "./sound/함께하는 75 민턴 (Intro).mp3",
    lrc: "./sound/함께하는 75 민턴 (Intro).lrc",
    youtube: "#"
  },
  {
    id: 'we-are-one-teen-days',
    title: "우리는 하나 (10대 그 시절)",
    artist: "Tony.Park",
    cover: "./sound/우리는 하나 (10대 그 시절).png",
    url: "./sound/우리는 하나 (10대 그 시절).mp3",
    lrc: "./sound/우리는 하나 (10대 그 시절).lrc",
    youtube: "#"
  }
];

let songs = [...FALLBACK_SONGS];
const DEFAULT_VOLUME = 0.8;
const APP_SCOPE_URL = new URL('./', window.location.href);
const APP_SCOPE_PATH = APP_SCOPE_URL.pathname;
const APP_STORAGE_KEYS = [STORAGE_SONGS_HASH_KEY, STORAGE_SONGS_SNAPSHOT_KEY];

/* ── IndexedDB 설정 ── */
const IDB_NAME = 'minton_rabbits_music';
const IDB_VERSION = 1;
const IDB_STORE = 'local_songs';

function openIDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveLocalSongToDB(songData) {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(songData);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) { console.warn('IDB save fail', err); }
}

async function removeLocalSongFromDB(id) {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) { console.warn('IDB delete fail', err); }
}

async function clearLocalSongsInDB() {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) { console.warn('IDB clear fail', err); }
}

async function getAllLocalSongsFromDB() {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const request = tx.objectStore(IDB_STORE).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (err) { 
    console.warn('IDB get fail', err);
    return [];
  }
}

const state = {
  cur: 0,
  lyrics: [],
  shuffle: false,
  repeat: false,
  activeLyricIndex: -1
};

let songsPollTimer = null;
let swRegistrationPromise = null;
let currentLoadToken = 0;
let songsUpdateInFlight = null;
let lyricsLineElements = [];
let statusTimer = null;

const $  = id => document.getElementById(id);
const audio = $('audio');
const titleEl = $('title');
const artistEl = $('artist');
const coverEl = $('cover');
const progressEl = $('progress');
const progFill = $('progFill');
const playBtn = $('playBtn');
const volumeEl = $('volume');
const volFill = $('volFill');
const lyricsInner = $('lyricsInner');
const artFrame = $('artFrame');
const lyricsCol = document.querySelector('.lyrics-col');
const lyricsViewport = document.querySelector('.lyrics-viewport');
const lyricsExpandBtn = $('lyricsExpandBtn');
const statusEl = $('playerStatus');
const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));

const fmt = s => !Number.isFinite(s) ? '0:00' : `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const escAttr = s => String(s)
  .replace(/&/g,'&amp;')
  .replace(/"/g,'&quot;')
  .replace(/</g,'&lt;')
  .replace(/>/g,'&gt;');

function applyVolume(value) {
  const safeValue = Math.min(1, Math.max(0, Number(value)));
  audio.volume = safeValue;
  volumeEl.value = String(safeValue);
  renderVolumeFill();
}

function setToggleButtonState(button, isOn) {
  if (!button) return;
  button.classList.toggle('lit', isOn);
  button.setAttribute('aria-pressed', String(isOn));
}

function hideStatus() {
  if (!statusEl) return;
  if (statusTimer) {
    clearTimeout(statusTimer);
    statusTimer = null;
  }
  statusEl.classList.remove('show', 'is-error');
  statusEl.textContent = '';
}

function showStatus(message, { tone = 'info', duration = 3200 } = {}) {
  if (!statusEl || !message) return;
  if (statusTimer) clearTimeout(statusTimer);

  statusEl.textContent = message;
  statusEl.classList.add('show');
  statusEl.classList.toggle('is-error', tone === 'error');

  if (duration > 0) {
    statusTimer = window.setTimeout(() => {
      hideStatus();
    }, duration);
  } else {
    statusTimer = null;
  }
}

function getRandomTrackIndex(excludeIndex = state.cur) {
  if (songs.length <= 1) return 0;

  let nextIndex = excludeIndex;
  while (nextIndex === excludeIndex) {
    nextIndex = Math.floor(Math.random() * songs.length);
  }
  return nextIndex;
}

function resetLyricsViewportPosition() {
  lyricsInner.style.top = '0px';
}

function renderLyricsMarkup(lines, emptyMessage = '가사가 없습니다') {
  state.activeLyricIndex = -1;

  const isUnsynced = lines.length > 0 && lines[0].time === -1;
  document.body.classList.toggle('lyrics-unsynced', isUnsynced);

  if (!lines.length) {
    state.lyrics = [];
    lyricsInner.innerHTML = `<div class=\"lyric-line\">${esc(emptyMessage)}</div>`;
    lyricsLineElements = [];
    resetLyricsViewportPosition();
    return;
  }

  state.lyrics = lines;
  lyricsInner.innerHTML = lines
    .map((line, index) => `<div class=\"lyric-line\" id=\"ln${index}\">${esc(line.content)}</div>`)
    .join('');
  lyricsLineElements = Array.from(lyricsInner.querySelectorAll('.lyric-line'));
  lyricsLineElements.forEach((element, index) => {
    element.addEventListener('click', () => {
      if (state.lyrics[index] && state.lyrics[index].time !== -1) {
        audio.currentTime = state.lyrics[index].time;
      }
    });
  });
  resetLyricsViewportPosition();
}


function getLrcCandidates(lrcPath = '') {
  if (!lrcPath) return [];

  const trimmed = String(lrcPath).trim();
  if (!trimmed) return [];

  const absolute = new URL(trimmed, window.location.href).toString();
  const encoded = encodeURI(absolute);
  return [...new Set([absolute, encoded])];
}

function decodeLyricsBuffer(buffer) {
  const decoders = ['utf-8', 'euc-kr'];

  for (const encoding of decoders) {
    try {
      const decoded = new TextDecoder(encoding).decode(buffer).replace(/^\uFEFF/, '').trim();
      if (!decoded) continue;

      const looksBroken = decoded.includes(' ') && encoding === 'utf-8';
      if (!looksBroken || encoding === decoders[decoders.length - 1]) {
        return decoded;
      }
    } catch (err) {
      console.warn(`가사 디코딩 실패 (${encoding})`, err);
    }
  }

  return '';
}

function isLikelyHtmlDocument(text) {
  if (!text) return false;
  const sample = text.slice(0, 300).toLowerCase();
  return sample.includes('<!doctype html') || sample.includes('<html') || sample.includes('<body');
}

async function fetchLyricsText(song) {
  const candidates = getLrcCandidates(song?.lrc);

  for (const candidateUrl of candidates) {
    try {
      const response = await fetch(candidateUrl, { cache: 'no-store' });
      if (!response.ok) {
        console.warn('LRC 응답 오류', response.status, candidateUrl);
        continue;
      }

      const buffer = await response.arrayBuffer();
      const decoded = decodeLyricsBuffer(buffer);
      if (!decoded || isLikelyHtmlDocument(decoded)) {
        console.warn('LRC 응답이 가사 파일 형식이 아닙니다.', candidateUrl);
        continue;
      }

      return decoded;
    } catch (err) {
      console.warn('LRC loading failed', candidateUrl, err);
    }
  }

  return '';
}

function waitForMetadata() {
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const done = () => {
      audio.removeEventListener('loadedmetadata', done);
      audio.removeEventListener('error', done);
      resolve();
    };
    audio.addEventListener('loadedmetadata', done, { once: true });
    audio.addEventListener('error', done, { once: true });
    window.setTimeout(done, 1200);
  });
}

async function safePlay({ blockedMessage = '브라우저 정책으로 자동 재생이 차단되었습니다. 재생 버튼을 눌러주세요.', silent = false } = {}) {
  try {
    await audio.play();
    return true;
  } catch (err) {
    console.warn('오디오 재생 실패', err);
    if (!silent && blockedMessage) {
      showStatus(blockedMessage, { tone: 'info' });
    }
    return false;
  }
}


function isMobileViewport() {
  return window.matchMedia('(max-width: 768px)').matches;
}

function updateLyricsExpandButton() {
  if (!lyricsExpandBtn) return;
  const expanded = document.body.classList.contains('lyrics-expanded');
  lyricsExpandBtn.textContent = expanded ? '가사 축소' : '가사 확대';
  lyricsExpandBtn.setAttribute('aria-expanded', String(expanded));
  lyricsExpandBtn.setAttribute('aria-pressed', String(expanded));
}

function closeLyricsExpanded() {
  document.body.classList.remove('lyrics-expanded');
  updateLyricsExpandButton();
}

function toggleLyricsExpanded() {
  if (!isMobileViewport()) return;
  document.body.classList.toggle('lyrics-expanded');
  updateLyricsExpandButton();
}

function getTrackSignature(song) {
  return song?.id || song?.url || `${song?.title || ''}|${song?.artist || ''}`;
}

function normalizeSongEntry(raw, index) {
  if (!raw || typeof raw !== 'object') return null;

  const title = String(raw.title || raw.name || `Track ${index + 1}`).trim();
  const artist = String(raw.artist || 'Unknown Artist').trim();
  const url = String(raw.url || raw.src || '').trim();
  if (!url) return null;

  const lrc = raw.lrc ? String(raw.lrc).trim() : '';
  const cover = raw.cover ? String(raw.cover).trim() : '';
  const youtube = raw.youtube ? String(raw.youtube).trim() : '';
  const id = raw.id ? String(raw.id).trim() : url;

  return { id, title, artist, url, lrc, cover, youtube };
}

function normalizeSongsList(input) {
  const list = Array.isArray(input) ? input : (input && Array.isArray(input.songs) ? input.songs : []);
  const normalized = list.map(normalizeSongEntry).filter(Boolean);
  return normalized.length ? normalized : [...FALLBACK_SONGS];
}

function getSongsFingerprint(list) {
  return JSON.stringify(
    list.map(({ id, title, artist, url, lrc, cover, youtube }) => ({
      id, title, artist, url, lrc, cover, youtube
    }))
  );
}

function getStoredSongsSnapshot() {
  try {
    const raw = localStorage.getItem(STORAGE_SONGS_SNAPSHOT_KEY);
    if (!raw) return null;
    return normalizeSongsList(JSON.parse(raw));
  } catch (err) {
    console.warn('저장된 곡 스냅샷을 읽지 못했습니다.', err);
    return null;
  }
}

function persistSongsSnapshot(list) {
  try {
    const safeList = list.filter(song => !song.url.startsWith('blob:'));
    localStorage.setItem(STORAGE_SONGS_HASH_KEY, getSongsFingerprint(safeList));
    localStorage.setItem(STORAGE_SONGS_SNAPSHOT_KEY, JSON.stringify(safeList));
  } catch (err) {
    console.warn('곡 스냅샷 저장 실패', err);
  }
}

function getTrackIndexFromUrl(totalCount = songs.length) {
  const params = new URLSearchParams(window.location.search);
  const no = parseInt(params.get('no') || '', 10);
  if (Number.isFinite(no) && no >= 1 && no <= totalCount) return no - 1;

  const idx = parseInt(params.get('idx') || '', 10);
  if (Number.isFinite(idx) && idx >= 0 && idx < totalCount) return idx;

  return 0;
}

function shouldAutoplayFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const value = (params.get('autoplay') || '').toLowerCase();
  return value === '1' || value === 'true' || params.has('no');
}

function updateUrlForCurrentTrack() {
  if (!songs.length) return;
  const url = new URL(window.location.href);
  url.searchParams.set('no', String(state.cur + 1));
  window.history.replaceState({}, '', url);
}

async function fetchSongsList({ forceNetwork = false } = {}) {
  const requestUrl = forceNetwork
    ? `${SONGS_JSON_URL}${SONGS_JSON_URL.includes('?') ? '&' : '?'}_=${Date.now()}`
    : SONGS_JSON_URL;

  const response = await fetch(requestUrl, {
    cache: forceNetwork ? 'no-store' : 'default',
    headers: { 'Accept': 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`songs.json 응답 오류: ${response.status}`);
  }

  const data = await response.json();
  return normalizeSongsList(data);
}

function syncSongMeta(song) {
  titleEl.textContent = $('miniTitle').textContent = song.title;
  artistEl.textContent = $('miniArtist').textContent = song.artist;
  $('lrcTrackName').textContent = song.title;
  coverEl.src = $('miniCover').src = song.cover || defaultCover;
}

function resetProgressUi() {
  progressEl.value = 0;
  progFill.style.width = $('miniFill').style.width = '0%';
  $('currentTime').textContent = '0:00';
  $('duration').textContent = '0:00';
}

/* ── UI 탭 이동 로직 ── */
function setActiveTab(tabName, { focus = false } = {}) {
  tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === tabName;
    const panel = document.getElementById('tab-' + button.dataset.tab);

    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', String(isActive));
    button.setAttribute('tabindex', isActive ? '0' : '-1');

    if (panel) {
      panel.classList.toggle('active', isActive);
      panel.hidden = !isActive;
    }

    if (isActive && focus) button.focus();
  });

  document.body.classList.toggle('on-player-tab', tabName === 'player');
  if (tabName !== 'player') closeLyricsExpanded();
}

tabButtons.forEach((button, index) => {
  const tabName = button.dataset.tab;
  const panel = document.getElementById('tab-' + tabName);

  button.id = button.id || `tab-btn-${tabName}`;
  button.setAttribute('aria-controls', `tab-${tabName}`);
  button.setAttribute('aria-selected', String(button.classList.contains('active')));
  button.setAttribute('tabindex', button.classList.contains('active') ? '0' : '-1');

  if (panel) {
    panel.setAttribute('aria-labelledby', button.id);
    panel.hidden = !button.classList.contains('active');
  }

  button.addEventListener('click', () => setActiveTab(tabName));
  button.addEventListener('keydown', (event) => {
    const key = event.key;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', ' '].includes(key)) return;

    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      setActiveTab(tabName, { focus: true });
      return;
    }

    event.preventDefault();
    let targetIndex = index;
    if (key === 'ArrowRight') targetIndex = (index + 1) % tabButtons.length;
    if (key === 'ArrowLeft') targetIndex = (index - 1 + tabButtons.length) % tabButtons.length;
    if (key === 'Home') targetIndex = 0;
    if (key === 'End') targetIndex = tabButtons.length - 1;
    setActiveTab(tabButtons[targetIndex].dataset.tab, { focus: true });
  });
});

$('miniGoPlayer').addEventListener('click', () => setActiveTab('player'));

lyricsExpandBtn?.addEventListener('click', toggleLyricsExpanded);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeLyricsExpanded();
});

window.addEventListener('resize', () => {
  if (!isMobileViewport()) closeLyricsExpanded();
});


/* ── 렌더링 ── */
function renderPlaylist() {
  const pl = $('playlist');
  pl.innerHTML = '';

  songs.forEach((song, index) => {
    const btn = document.createElement('button');
    btn.className = 'track-btn' + (index === state.cur ? ' active' : '');
    const isLocal = song.id && song.id.startsWith('local-');

    btn.innerHTML = `<img class="t-thumb" src="${escAttr(song.cover || defaultCover)}" alt="">
      <div style="min-width:0; flex-grow: 1; text-align: left;">
        <div class="t-name">${esc(song.title)}</div>
        <div class="t-by">${esc(song.artist)}</div>
      </div>
      ${isLocal ? `<div class="t-del" data-id="${song.id}" aria-label="삭제">❌</div>` : ''}`;
      
    btn.addEventListener('click', (e) => {
      if (e.target.closest('.t-del')) {
        e.stopPropagation();
        deleteLocalTrack(song.id);
      } else {
        loadTrack(index, true);
      }
    });

    pl.appendChild(btn);
  });
}

async function deleteLocalTrack(id) {
  const idx = songs.findIndex(s => s.id === id);
  if (idx < 0) return;
  
  songs.splice(idx, 1);
  await removeLocalSongFromDB(id);
  persistSongsSnapshot(songs);
  
  if (state.cur === idx) {
    if (songs.length) {
      state.cur = Math.min(state.cur, songs.length - 1);
      loadTrack(state.cur, true);
    } else {
      audio.pause();
      audio.src = '';
      resetProgressUi();
    }
  } else if (state.cur > idx) {
    state.cur--;
    updateUrlForCurrentTrack();
  }
  
  renderPlaylist();
  renderLinks();
}

function renderLinks() {
  const lk = $('trackLinks');
  lk.innerHTML = '';

  songs.forEach((song, index) => {
    const buttons = [
      `<a class="lk-btn" href="${escAttr(song.url)}" download>MP3</a>`
    ];

    if (song.lrc) buttons.push(`<a class="lk-btn" href="${escAttr(song.lrc)}" download>가사</a>`);
    if (song.youtube && song.youtube !== '#') buttons.push(`<a class="lk-btn" href="${escAttr(song.youtube)}" target="_blank" rel="noopener">YouTube</a>`);

    const div = document.createElement('div');
    div.className = 'lk-card';
    div.innerHTML = `<div class="lk-grow">
        <div class="lk-num">TRACK ${String(index + 1).padStart(2, '0')}</div>
        <div class="lk-title">${esc(song.title)}</div>
      </div>
      <div class="lk-btns">${buttons.join('')}</div>`;
    lk.appendChild(div);
  });
}

/* ── 가사 파싱 ── */
async function parseLRC(song, requestToken = currentLoadToken) {
  if (requestToken !== currentLoadToken) return false;

  lyricsInner.innerHTML = '<div class="lyric-line">가사를 불러오는 중…</div>';
  lyricsLineElements = [];
  resetLyricsViewportPosition();
  document.body.classList.remove('lyrics-unsynced');

  if (!song) {
    renderLyricsMarkup([], '가사가 없습니다');
    return true;
  }

  let text = '';

  if (song.lrc) {
    text = await fetchLyricsText(song);
  }

  if (!text) {
    if (song.embeddedLyrics) {
      text = song.embeddedLyrics;
    } else if (window.jsmediatags && song.url && !song.id?.startsWith('local-')) {
      try {
        text = await new Promise((resolve) => {
          window.jsmediatags.read(song.url, {
            onSuccess: (tag) => resolve(tag.tags?.lyrics?.lyrics || tag.tags?.lyrics || ''),
            onError: () => resolve('')
          });
        });
        song.embeddedLyrics = text;
      } catch (err) { console.warn('ID3 Lyrics parsing failed', err); }
    }
  }

  if (requestToken !== currentLoadToken) return false;

  if (!text) {
    renderLyricsMarkup([], '가사를 불러오지 못했습니다');
    if (song.lrc) {
      showStatus(`가사 파일을 불러오지 못했습니다: ${song.lrc}`, { tone: 'error', duration: 4200 });
    }
    return true;
  }

  const lyrics = [];
  const syncTagRegex = /\[(\d{2}):(\d{2})(?:\.(\d{1,3}))?\]/g;
  const lines = text.split(/\r?\n/);
  const hasSync = syncTagRegex.test(text);

  if (hasSync) {
    for (const rawLine of lines) {
      const line = rawLine.trim();
      const matches = [...line.matchAll(syncTagRegex)];
      if (!matches.length) continue;

      const content = line.replace(syncTagRegex, '').trim();
      if (!content) continue;

      for (const match of matches) {
        const fraction = match[3] || '';
        const frac = fraction ? Number(fraction) / (10 ** fraction.length) : 0;
        lyrics.push({
          time: Number(match[1]) * 60 + Number(match[2]) + frac,
          content
        });
      }
    }
    lyrics.sort((a, b) => a.time - b.time);
  } else {
    for (const rawLine of lines) {
      const content = rawLine.trim();
      if (content) lyrics.push({ time: -1, content });
    }
  }

  if (requestToken !== currentLoadToken) return false;
  renderLyricsMarkup(lyrics, '가사가 없습니다');
  return true;
}

/* ── 재생 제어 ── */
function setPlaying(on) {
  const playSvg = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" style="transform: translateX(1.5px)"><path d="M8 5v14l11-7z"></path></svg>';
  const pauseSvg = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>';
  playBtn.innerHTML = $('miniPlay').innerHTML = on ? pauseSvg : playSvg;
  playBtn.setAttribute('aria-label', on ? '일시정지' : '재생');
  $('miniPlay').setAttribute('aria-label', on ? '일시정지' : '재생');

  if (on) artFrame.classList.add('playing');
  else artFrame.classList.remove('playing');

  renderPlaylist();
}

async function loadTrack(idx, auto = false) {
  if (!songs.length) return false;

  const requestToken = ++currentLoadToken;
  hideStatus();

  state.cur = Math.max(0, Math.min(idx, songs.length - 1));
  const song = songs[state.cur];

  updateUrlForCurrentTrack();
  syncSongMeta(song);

  audio.pause();
  audio.src = song.url;
  audio.load();
  resetProgressUi();

  artFrame.style.animation = 'none';
  artFrame.offsetHeight;
  artFrame.style.animation = null;

  renderPlaylist();
  const lyricsPromise = parseLRC(song, requestToken);
  setPlaying(false);

  if (auto) {
    await safePlay({ blockedMessage: '재생을 시작하지 못했습니다. 다시 한 번 눌러주세요.' });
  }

  await lyricsPromise;
  return requestToken === currentLoadToken;
}

function renderVolumeFill() {
  const pct = Number(volumeEl.value) * 100;
  volFill.style.width = pct + '%';
}

const toggle = () => {
  if (audio.paused) safePlay({ blockedMessage: '재생을 시작하지 못했습니다. 다시 시도해주세요.' });
  else audio.pause();
};

const next = () => {
  if (!songs.length) return;
  const nextIndex = state.shuffle
    ? getRandomTrackIndex(state.cur)
    : (state.cur + 1) % songs.length;
  loadTrack(nextIndex, true);
};

const prev = () => {
  if (!songs.length) return;
  const prevIndex = state.shuffle
    ? getRandomTrackIndex(state.cur)
    : (state.cur - 1 + songs.length) % songs.length;
  loadTrack(prevIndex, true);
};

playBtn.addEventListener('click', toggle);
$('miniPlay').addEventListener('click', toggle);
$('prevBtn').addEventListener('click', prev);
$('nextBtn').addEventListener('click', next);
$('miniNext').addEventListener('click', next);
artFrame.addEventListener('click', () => artFrame.classList.toggle('square'));

$('shuffleBtn').addEventListener('click', () => {
  state.shuffle = !state.shuffle;
  setToggleButtonState($('shuffleBtn'), state.shuffle);
});
$('repeatBtn').addEventListener('click', () => {
  state.repeat = !state.repeat;
  setToggleButtonState($('repeatBtn'), state.repeat);
});

progressEl.addEventListener('input', () => {
  if (audio.duration) {
    audio.currentTime = (progressEl.value / 100) * audio.duration;
  }
});

volumeEl.addEventListener('input', () => {
  applyVolume(volumeEl.value);
});

audio.addEventListener('loadedmetadata', () => {
  $('duration').textContent = fmt(audio.duration);
});

audio.addEventListener('timeupdate', () => {
  const pct = audio.duration ? (audio.currentTime / audio.duration * 100) : 0;
  progressEl.value = pct;
  progFill.style.width = $('miniFill').style.width = pct + '%';
  $('currentTime').textContent = fmt(audio.currentTime);

  if (!state.lyrics.length || !lyricsLineElements.length) return;
  if (state.lyrics[0].time === -1) return;

  let activeIndex = -1;
  for (let i = 0; i < state.lyrics.length; i += 1) {
    if (
      audio.currentTime >= state.lyrics[i].time &&
      (!state.lyrics[i + 1] || audio.currentTime < state.lyrics[i + 1].time)
    ) {
      activeIndex = i;
      break;
    }
  }

  if (activeIndex === state.activeLyricIndex) return;

  if (state.activeLyricIndex >= 0 && lyricsLineElements[state.activeLyricIndex]) {
    lyricsLineElements[state.activeLyricIndex].classList.remove('active');
  }

  state.activeLyricIndex = activeIndex;

  if (activeIndex >= 0 && lyricsLineElements[activeIndex]) {
    const activeLine = lyricsLineElements[activeIndex];
    activeLine.classList.add('active');

    const viewportHeight = lyricsInner.parentElement.clientHeight;
    lyricsInner.style.top = `${viewportHeight / 2 - activeLine.offsetTop - (activeLine.clientHeight / 2)}px`;
  }
});

audio.addEventListener('ended', () => {
  if (state.repeat) {
    audio.currentTime = 0;
    safePlay({ blockedMessage: '반복 재생을 이어가지 못했습니다. 다시 눌러주세요.', silent: true });
    return;
  }
  next();
});

audio.addEventListener('error', () => {
  const song = songs[state.cur];
  const songTitle = song?.title ? `"${song.title}"` : '현재 곡';
  showStatus(`${songTitle} 음원을 불러오지 못했습니다. 파일 경로를 확인해주세요.`, { tone: 'error', duration: 0 });
  setPlaying(false);
});

audio.addEventListener('pause', () => setPlaying(false));
audio.addEventListener('play', () => {
  hideStatus();
  setPlaying(true);
});

/* ── PWA 설치 로직 ── */
let deferredPrompt;
const installBtn = document.getElementById('installBtn');
const clearCacheBtn = document.getElementById('clearCacheBtn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});

window.addEventListener('appinstalled', () => {
  installBtn.hidden = true;
  deferredPrompt = null;
  console.log('PWA가 성공적으로 설치되었습니다.');
});

async function clearPwaCaches() {
  const ok = window.confirm('앱 캐시와 저장 데이터를 정리한 뒤 새로고침합니다. 계속할까요?');
  if (!ok) return;

  clearCacheBtn.disabled = true;
  const originalLabel = clearCacheBtn.innerHTML;
  clearCacheBtn.innerHTML = '<span>정리 중…</span>';

  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      const targetRegs = regs.filter((reg) => {
        try {
          return new URL(reg.scope).pathname.startsWith(APP_SCOPE_PATH);
        } catch (err) {
          return false;
        }
      });
      await Promise.all(targetRegs.map((reg) => reg.unregister()));
    }

    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(async (cacheName) => {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        const appRequests = requests.filter((request) => {
          try {
            const url = new URL(request.url);
            return url.origin === window.location.origin && url.pathname.startsWith(APP_SCOPE_PATH);
          } catch (err) {
            return false;
          }
        });

        await Promise.all(appRequests.map((request) => cache.delete(request)));
      }));
    }

    APP_STORAGE_KEYS.forEach((key) => {
      try { localStorage.removeItem(key); } catch (err) { console.warn(`${key} 삭제 실패`, err); }
      try { sessionStorage.removeItem(key); } catch (err) { console.warn(`${key} 세션 삭제 실패`, err); }
    });

    try { await clearLocalSongsInDB(); } catch(err) { console.warn('IDB purge err', err); }

    showStatus('이 플레이어의 캐시를 정리했습니다. 새로고침합니다.', { tone: 'info' });
    const url = new URL(window.location.href);
    url.searchParams.set('cacheReset', Date.now().toString());
    window.location.replace(url.toString());
  } catch (err) {
    console.error(err);
    showStatus('캐시 정리 중 오류가 발생했습니다. 브라우저 설정에서도 확인해주세요.', { tone: 'error', duration: 0 });
    clearCacheBtn.disabled = false;
    clearCacheBtn.innerHTML = originalLabel;
  }
}

clearCacheBtn.addEventListener('click', clearPwaCaches);

const localFileInput = document.getElementById('localFileInput');
if (localFileInput) {
  localFileInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const audioFiles = files.filter(f => f.type.startsWith('audio/'));
    const lyricFiles = files.filter(f => f.name.toLowerCase().endsWith('.lrc') || f.name.toLowerCase().endsWith('.srt'));

    if (!audioFiles.length) {
      showStatus('오디오 파일만 추가할 수 있습니다.', { tone: 'error' });
      return;
    }

    function extractTags(file) {
      return new Promise((resolve) => {
        let result = { title: file.name.replace(/\.[^/.]+$/, ""), artist: "로컬 파일", cover: "", coverBlob: null, embeddedLyrics: "" };
        if (!window.jsmediatags) return resolve(result);

        window.jsmediatags.read(file, {
          onSuccess: function(tag) {
            const t = tag.tags;
            if (t.title) result.title = t.title;
            if (t.artist) result.artist = t.artist;
            if (t.picture) {
              try {
                const data = t.picture.data;
                const format = t.picture.format;
                const u8arr = new Uint8Array(data);
                const blob = new Blob([u8arr], { type: format });
                result.coverBlob = blob;
                result.cover = URL.createObjectURL(blob);
              } catch(e) { console.warn("Cover extraction error", e); }
            }
            if (t.lyrics) {
               result.embeddedLyrics = t.lyrics.lyrics || t.lyrics || "";
            }
            resolve(result);
          },
          onError: function() {
            resolve(result);
          }
        });
      });
    }

    const startIndex = songs.length;
    let addedCount = 0;

    for (const file of audioFiles) {
      const tags = await extractTags(file);
      const songId = 'local-' + Date.now() + '-' + addedCount;
      const url = URL.createObjectURL(file);
      
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      const matchedLrcFile = lyricFiles.find(f => f.name.replace(/\.[^/.]+$/, "") === baseName);
      const matchedLrcText = matchedLrcFile ? await matchedLrcFile.text() : '';
      const resolvedLyrics = matchedLrcText || tags.embeddedLyrics || '';

      const songData = {
        id: songId,
        title: tags.title,
        artist: tags.artist,
        audioBlob: file,
        coverBlob: tags.coverBlob,
        embeddedLyrics: resolvedLyrics,
        lrcBlob: matchedLrcFile || null
      };
      
      await saveLocalSongToDB(songData);

      const newSong = {
        id: songId,
        title: tags.title,
        artist: tags.artist,
        url: url,
        cover: tags.cover,
        lrc: matchedLrcFile ? URL.createObjectURL(matchedLrcFile) : "",
        embeddedLyrics: resolvedLyrics,
        youtube: "#"
      };
      songs.push(newSong);
      addedCount++;
    }

    persistSongsSnapshot(songs);
    showStatus(`${addedCount}개의 로컬 오디오 파일을 추가했습니다.`, { tone: 'info' });
    renderPlaylist();
    renderLinks();
    
    localFileInput.value = '';
    loadTrack(startIndex, true);
  });
}

function getWarmCacheAssets() {
  const shellAssets = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    './songs.json',
    './icons/icon-180.png',
    './icons/icon-192.png',
    './icons/icon-512.png'
  ];
  const mediaAssets = songs.flatMap(song => [song.url, song.lrc, song.cover]).filter(Boolean);
  return [...new Set([...shellAssets, ...mediaAssets])];
}

async function registerOfflinePwa() {
  if (!('serviceWorker' in navigator)) return null;
  if (swRegistrationPromise) return swRegistrationPromise;

  swRegistrationPromise = navigator.serviceWorker.register('./sw.js', { scope: './' })
    .then((registration) => {
      console.log('Service Worker 등록 완료', registration.scope);

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        warmCacheWithCurrentAssets();
      });

      return registration;
    })
    .catch((err) => {
      console.warn('Service Worker 등록 실패', err);
      swRegistrationPromise = null;
      return null;
    });

  return swRegistrationPromise;
}

async function warmCacheWithCurrentAssets() {
  const registration = await registerOfflinePwa();
  if (!registration) return;

  const payload = { type: 'WARM_CACHE', assets: getWarmCacheAssets() };
  const sendWarmMessage = (sw) => {
    try {
      sw?.postMessage(payload);
    } catch (err) {
      console.warn('캐시 예열 메시지 전송 실패', err);
    }
  };

  if (registration.active) sendWarmMessage(registration.active);
  navigator.serviceWorker.ready.then((readyReg) => {
    sendWarmMessage(readyReg.active || readyReg.waiting || readyReg.installing);
  });
}

async function updateServiceWorkerIfPossible() {
  const registration = await registerOfflinePwa();
  if (!registration) return;
  try {
    await registration.update();
  } catch (err) {
    console.warn('Service Worker 업데이트 확인 실패', err);
  }
}

async function applySongsList(nextSongs, { initial = false, keepCurrent = true } = {}) {
  const normalized = normalizeSongsList(nextSongs);
  const prevSong = songs[state.cur];
  const prevSig = getTrackSignature(prevSong);
  const prevWasPlaying = !audio.paused && !!audio.src;
  const prevTime = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
  const prevVolume = Number.isFinite(audio.volume) ? audio.volume : DEFAULT_VOLUME;

  let localSongs = [];
  if (initial) {
    try {
      const dbLocals = await getAllLocalSongsFromDB();
      localSongs = dbLocals.map(loc => ({
        id: loc.id,
        title: loc.title,
        artist: loc.artist,
        url: URL.createObjectURL(loc.audioBlob),
        cover: loc.coverBlob ? URL.createObjectURL(loc.coverBlob) : "",
        lrc: loc.lrcBlob ? URL.createObjectURL(loc.lrcBlob) : "",
        embeddedLyrics: loc.embeddedLyrics || "",
        youtube: "#"
      }));
    } catch(e) { console.warn('Local load error', e); }
  } else {
    localSongs = songs.filter(s => s.id.startsWith('local-'));
  }

  songs = [...normalized, ...localSongs];
  persistSongsSnapshot(songs);

  let nextIndex = getTrackIndexFromUrl(songs.length);

  if (!initial && keepCurrent && prevSig) {
    const matchedIndex = songs.findIndex((song) => getTrackSignature(song) === prevSig);
    if (matchedIndex >= 0) nextIndex = matchedIndex;
    else nextIndex = Math.min(state.cur, songs.length - 1);
  }

  const nextSong = songs[nextIndex];
  const sameCurrentTrack = Boolean(
    prevSong &&
    nextSong &&
    getTrackSignature(nextSong) === prevSig &&
    nextSong.url === prevSong.url
  );

  renderPlaylist();
  renderLinks();
  applyVolume(prevVolume);

  if (!nextSong) return;

  if (sameCurrentTrack) {
    state.cur = nextIndex;
    updateUrlForCurrentTrack();
    syncSongMeta(nextSong);

    if (getTrackSignature(nextSong) !== getTrackSignature(prevSong) || (nextSong.lrc || '') !== (prevSong?.lrc || '')) {
      await parseLRC(nextSong, ++currentLoadToken);
    }
  } else {
    await loadTrack(nextIndex, false);

    if (!initial && keepCurrent && prevTime > 0) {
      await waitForMetadata();
      const restoreTime = audio.duration
        ? Math.min(prevTime, Math.max(audio.duration - 0.25, 0))
        : prevTime;
      try { audio.currentTime = restoreTime; } catch (err) { console.warn('재생 위치 복원 실패', err); }
    }

    if (!initial && keepCurrent && prevWasPlaying) {
      await safePlay({ blockedMessage: '업데이트 후 자동 재생을 복원하지 못했습니다. 재생 버튼을 눌러주세요.' });
    }
  }

  await warmCacheWithCurrentAssets();
}

async function getInitialSongsList() {
  try {
    return await fetchSongsList({ forceNetwork: true });
  } catch (networkErr) {
    console.warn('최신 songs.json 로딩 실패, 캐시 또는 저장본을 확인합니다.', networkErr);

    try {
      return await fetchSongsList({ forceNetwork: false });
    } catch (cacheErr) {
      console.warn('캐시된 songs.json 로딩 실패, 저장된 스냅샷을 확인합니다.', cacheErr);
      return getStoredSongsSnapshot() || [...FALLBACK_SONGS];
    }
  }
}

async function checkForSongsUpdates() {
  if (songsUpdateInFlight) return songsUpdateInFlight;

  songsUpdateInFlight = (async () => {
    try {
      const freshSongs = await fetchSongsList({ forceNetwork: true });
      const currentHash = getSongsFingerprint(songs);
      const freshHash = getSongsFingerprint(freshSongs);

      if (freshHash !== currentHash) {
        console.log('서버의 최신 곡 목록을 감지하여 자동 반영합니다.');
        showStatus('최신 곡 목록을 반영했습니다.', { tone: 'info' });
        await applySongsList(freshSongs, { initial: false, keepCurrent: true });
      }
    } catch (err) {
      console.warn('곡 목록 업데이트 확인 실패', err);
    } finally {
      songsUpdateInFlight = null;
    }
  })();

  return songsUpdateInFlight;
}

function startSongsPolling() {
  if (songsPollTimer) clearInterval(songsPollTimer);

  const checkForUpdates = () => {
    if (document.visibilityState !== 'visible') return;
    updateServiceWorkerIfPossible();
    checkForSongsUpdates();
  };

  songsPollTimer = window.setInterval(checkForUpdates, SONGS_POLL_MS);
  window.addEventListener('focus', checkForUpdates);
  window.addEventListener('online', checkForUpdates);
  document.addEventListener('visibilitychange', checkForUpdates);
}

async function initializeApp() {
  updateLyricsExpandButton();
  setActiveTab('player');
  setToggleButtonState($('shuffleBtn'), state.shuffle);
  setToggleButtonState($('repeatBtn'), state.repeat);
  applyVolume(DEFAULT_VOLUME);

  const initialAutoplay = shouldAutoplayFromUrl();

  await registerOfflinePwa();
  const initialSongs = await getInitialSongsList();
  await applySongsList(initialSongs, { initial: true, keepCurrent: false });

  if (initialAutoplay) {
    await safePlay({ blockedMessage: '브라우저 정책으로 자동 재생이 차단되었습니다. 재생 버튼을 눌러주세요.' });
  }

  startSongsPolling();
  updateServiceWorkerIfPossible();
  checkForSongsUpdates();
}

initializeApp();
