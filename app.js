
// 75 Minton Music build: 2026-08-09-v1.5-desktop-home-card / assets: 20260809-v15-desktop-home-card
// 기본 커버 이미지 리소스입니다.
const defaultCover = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 500'%3E%3Cdefs%3E%3CradialGradient id='bg' cx='50%25' cy='50%25' r='50%25'%3E%3Cstop offset='0%25' stop-color='%232c2d30'/%3E%3Cstop offset='100%25' stop-color='%23121316'/%3E%3C/radialGradient%3E%3ClinearGradient id='gold' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23F2D06B'/%3E%3Cstop offset='50%25' stop-color='%23D4AF37'/%3E%3Cstop offset='100%25' stop-color='%23997A15'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='500' height='500' fill='url(%23bg)'/%3E%3Ccircle cx='250' cy='250' r='230' fill='none' stroke='rgba(255,255,255,0.03)' stroke-width='2'/%3E%3Ccircle cx='250' cy='250' r='190' fill='none' stroke='rgba(255,255,255,0.05)' stroke-width='1'/%3E%3Ccircle cx='250' cy='250' r='150' fill='none' stroke='rgba(255,255,255,0.02)' stroke-width='4'/%3E%3Ccircle cx='250' cy='250' r='130' fill='%231a1a1a' stroke='url(%23gold)' stroke-width='4'/%3E%3Cpath d='M220 160 Q200 90 230 110 Q240 130 240 160' fill='url(%23gold)'/%3E%3Cpath d='M280 160 Q300 90 270 110 Q260 130 260 160' fill='url(%23gold)'/%3E%3Cpath d='M225 330 L275 330 L260 360 L240 360 Z' fill='url(%23gold)'/%3E%3Ccircle cx='250' cy='365' r='10' fill='%23fff'/%3E%3Ctext x='250' y='285' font-family='Arial, sans-serif' font-weight='900' font-size='100' fill='url(%23gold)' text-anchor='middle' letter-spacing='-5'%3E75%3C/text%3E%3Ctext x='250' y='145' font-family='Arial' font-weight='bold' font-size='14' fill='%23aaa' text-anchor='middle' letter-spacing='4'%3ERABBIT CLUB%3C/text%3E%3Ctext x='250' y='315' font-family='Arial' font-weight='bold' font-size='12' fill='%23aaa' text-anchor='middle' letter-spacing='6'%3EMINTON%3C/text%3E%3C/svg%3E";

const APP_BUILD_VERSION = '2026-08-09-v1.5-desktop-home-card';
const ASSET_VERSION = '20260809-v15-desktop-home-card';
const SONGS_JSON_URL = './songs.json';
const SONGS_POLL_MS = 60000;
const TRACK_GAP_MS = 1000;
const SW_SCRIPT_URL = `./sw.js?v=${ASSET_VERSION}`;
const STORAGE_SONGS_HASH_KEY = '75minton_songs_hash_v2';
const STORAGE_SONGS_SNAPSHOT_KEY = '75minton_songs_snapshot_v2';
const STORAGE_PLAYER_STATE_KEY = '75minton_player_state_v1_1';
const STORAGE_FAVORITES_KEY = '75minton_favorites_v1_1';
const BACK_GUARD_STATUS_MESSAGE = '뒤로가기 버튼으로 앱이 바로 종료되지 않도록 보호 중입니다. 종료하려면 홈 버튼이나 최근 앱 화면을 이용해주세요.';
const BACK_GUARD_RETURN_PLAYER_MESSAGE = '뒤로가기 버튼으로 플레이어 화면으로 돌아왔습니다.';
const BACK_GUARD_CLOSE_LYRICS_MESSAGE = '뒤로가기 버튼으로 가사 확대 화면을 닫았습니다.';

function getAppBaseUrl() {
  const scriptSrc = Array.from(document.scripts || [])
    .map((script) => script?.src)
    .find((src) => src && /(?:^|\/)app\.js(?:[?#].*)?$/i.test(src));

  if (scriptSrc) {
    try {
      return new URL('./', scriptSrc);
    } catch (err) {
      console.warn('app.js 湲곗? 寃쎈줈 怨꾩궛 ?ㅽ뙣', err);
    }
  }

  const manifestHref = document.querySelector('link[rel="manifest"]')?.href;
  if (manifestHref) {
    try {
      return new URL('./', manifestHref);
    } catch (err) {
      console.warn('manifest 湲곗? 寃쎈줈 怨꾩궛 ?ㅽ뙣', err);
    }
  }

  try {
    return new URL('./', window.location.href);
  } catch (err) {
    console.warn('window.location 湲곗? 寃쎈줈 怨꾩궛 ?ㅽ뙣', err);
    return new URL(window.location.origin + '/');
  }
}

// songs.json을 불러오지 못했을 때 사용할 기본 곡 목록
const FALLBACK_SONGS = [
  {
    id: 'we-are-75-rabbits',
    title: "함께하는 75 민턴 (Intro)",
    artist: "TONY / NIA",
    cover: "./sound/01.함께하는 75 민턴 (Intro).png",
    url: "./sound/01.함께하는 75 민턴 (Intro).mp3",
    lrc: "./sound/01.함께하는 75 민턴 (Intro).lrc",
    youtube: "#"
  },
  {
    id: 'we-are-one-teen-days',
    title: "우리는 하나 (10대 그 시절)",
    artist: "TONY / NIA",
    cover: "./sound/02.우리는 하나 (10대 그 시절).png",
    url: "./sound/02.우리는 하나 (10대 그 시절).mp3",
    lrc: "./sound/02.우리는 하나 (10대 그 시절).lrc",
    youtube: "#"
  }
];

let songs = [...FALLBACK_SONGS];
const DEFAULT_VOLUME = 0.8;
const APP_SCOPE_URL = getAppBaseUrl();
const APP_SCOPE_PATH = APP_SCOPE_URL.pathname;
const APP_STORAGE_KEYS = [STORAGE_SONGS_HASH_KEY, STORAGE_SONGS_SNAPSHOT_KEY];

function isAbsoluteLikeUrl(value = '') {
  return /^[a-z][a-z\d+.-]*:/i.test(value);
}

function resolveAssetUrl(assetPath = '') {
  const raw = String(assetPath || '').trim();
  if (!raw) return '';
  if (raw.startsWith('blob:') || raw.startsWith('data:') || isAbsoluteLikeUrl(raw)) {
    return raw;
  }

  try {
    return new URL(raw, APP_SCOPE_URL).toString();
  } catch (err) {
    console.warn('?먯뀑 寃쎈줈 ?댁꽍 ?ㅽ뙣', raw, err);
    return raw;
  }
}

function normalizeAssetPath(assetPath = '') {
  const resolved = resolveAssetUrl(assetPath);
  if (!resolved) return '';

  try {
    const url = new URL(resolved);
    if (url.origin === window.location.origin) {
      return `${url.pathname}${url.search}`;
    }
  } catch (err) {
    console.warn('?곷? 寃쎈줈 ?뺢퇋???ㅽ뙣', resolved, err);
  }

  return resolved;
}

/* ?? IndexedDB ?ㅼ젙 ?? */
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
  repeatMode: 'off',
  playlistQuery: '',
  favoritesOnly: false,
  favorites: new Set(),
  activeLyricIndex: -1,
  shuffleQueue: [],
  shuffleHistory: [],
  eqEnabled: false,
  eqGains: [0, 0, 0, 0, 0],
  eqPreset: 'flat',
  eqPanelOpen: false
};

let songsPollTimer = null;
let swRegistrationPromise = null;
let currentLoadToken = 0;
let songsUpdateInFlight = null;
let lyricsLineElements = [];
let statusTimer = null;
let autoAdvanceTimer = null;
let autoAdvanceCountdownTimer = null;
let eqAudioContext = null;
let eqSourceNode = null;
let eqFilters = [];
let reactiveAudioContext = null;
let reactiveAnalyser = null;
let reactiveStreamSource = null;
let reactiveSilentGain = null;
let reactiveDataArray = null;
let reactiveAnimationFrame = null;
let reactiveHues = { a: 220, b: 335, c: 42 };
let reactiveLevels = { energy: 0, bass: 0, mid: 0, high: 0 };
let lastPlayerStatePersistedAt = 0;

const backGuardState = {
  enabled: false,
  seeded: false,
  handlingPopstate: false
};

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
const playlistSearchEl = $('playlistSearch');
const favoritesFilterBtn = $('favoritesFilterBtn');
const lyricsInner = $('lyricsInner');
const artFrame = $('artFrame');
const homeGoPlayBtn = $('homeGoPlay');
const homeGoPlaylistBtn = $('homeGoPlaylist');
const homeMonthlyCoverEl = $('homeMonthlyCover');
const homeMonthlySongEl = $('homeMonthlySong');
const homeMonthlyArtistEl = $('homeMonthlyArtist');
const homeMonthlyDescEl = $('homeMonthlyDesc');
const homeMonthlyPlayBtn = $('homeMonthlyPlay');
const homeRecommendedCoverEl = $('homeRecommendedCover');
const homeRecommendedSongEl = $('homeRecommendedSong');
const homeRecommendedArtistEl = $('homeRecommendedArtist');
const homeRecommendedDescEl = $('homeRecommendedDesc');
const homeRecommendedPlayBtn = $('homeRecommendedPlay');
const homeNoticeListEl = $('homeNoticeList');
const lyricsCol = document.querySelector('.lyrics-col');
const lyricsViewport = document.querySelector('.lyrics-viewport');
const lyricsExpandBtn = $('lyricsExpandBtn');
const statusEl = $('playerStatus');
const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
const eqPanel = $('eqPanel');
const eqToggle = $('eqToggle');
const eqClose = $('eqClose');
const eqSliders = Array.from(document.querySelectorAll('.eq-slider'));
const eqPresetButtons = Array.from(document.querySelectorAll('.eq-preset'));

const EQ_FREQUENCIES = [60, 230, 910, 3600, 14000];
const EQ_PRESETS = {
  flat: [0, 0, 0, 0, 0],
  pop: [-1, 3, 4, 2, 3],
  bass: [6, 4, 1, 0, 2],
  vocal: [-2, 0, 4, 3, 1],
  rock: [4, 2, -1, 3, 5],
  dance: [5, 3, -2, 2, 4],
  acoustic: [2, 3, 2, 1, 3],
  night: [-3, -1, 1, -1, -3]
};

const EQ_PRESET_LABELS = {
  flat: 'Flat',
  pop: 'Pop',
  bass: 'Bass',
  vocal: 'Vocal',
  rock: 'Rock',
  dance: 'Dance',
  acoustic: 'Acoustic',
  night: 'Night',
  custom: 'Custom'
};

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
  persistPlayerState();
}

function setToggleButtonState(button, isOn) {
  if (!button) return;
  button.classList.toggle('lit', isOn);
  button.setAttribute('aria-pressed', String(isOn));
}

function loadStoredPreferences() {
  try {
    const favoriteList = JSON.parse(localStorage.getItem(STORAGE_FAVORITES_KEY) || '[]');
    state.favorites = new Set(Array.isArray(favoriteList) ? favoriteList : []);
  } catch (err) {
    console.warn('利먭꺼李얘린 蹂듭썝 ?ㅽ뙣', err);
    state.favorites = new Set();
  }

  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_PLAYER_STATE_KEY) || '{}');
    state.shuffle = Boolean(stored.shuffle);
    state.repeatMode = ['off', 'all', 'one'].includes(stored.repeatMode) ? stored.repeatMode : 'off';
    state.repeat = state.repeatMode !== 'off';
    state.eqEnabled = Boolean(stored.eqEnabled);
    state.eqPreset = EQ_PRESETS[stored.eqPreset] || stored.eqPreset === 'custom' ? stored.eqPreset : 'flat';
    if (Array.isArray(stored.eqGains) && stored.eqGains.length === state.eqGains.length) {
      state.eqGains = stored.eqGains.map((value) => Math.min(12, Math.max(-12, Number(value) || 0)));
    }
    if (Number.isFinite(stored.volume)) {
      volumeEl.dataset.restoreVolume = String(Math.min(1, Math.max(0, stored.volume)));
    }
    if (Number.isFinite(stored.currentTime)) {
      audio.dataset.restoreTime = String(Math.max(0, stored.currentTime));
    }
    if (stored.trackSig) {
      audio.dataset.restoreTrackSig = String(stored.trackSig);
    }
  } catch (err) {
    console.warn('?뚮젅?댁뼱 ?곹깭 蹂듭썝 ?ㅽ뙣', err);
  }
}

function persistFavorites() {
  try {
    localStorage.setItem(STORAGE_FAVORITES_KEY, JSON.stringify([...state.favorites]));
  } catch (err) {
    console.warn('利먭꺼李얘린 ????ㅽ뙣', err);
  }
}

function persistPlayerState() {
  try {
    const currentSong = songs[state.cur];
    localStorage.setItem(STORAGE_PLAYER_STATE_KEY, JSON.stringify({
      trackSig: getTrackSignature(currentSong),
      currentTime: Number.isFinite(audio.currentTime) ? audio.currentTime : 0,
      volume: Number.isFinite(audio.volume) ? audio.volume : DEFAULT_VOLUME,
      shuffle: state.shuffle,
      repeatMode: state.repeatMode,
      eqEnabled: state.eqEnabled,
      eqPreset: state.eqPreset,
      eqGains: state.eqGains
    }));
  } catch (err) {
    console.warn('?뚮젅?댁뼱 ?곹깭 ????ㅽ뙣', err);
  }
}

function updateRepeatButtonState() {
  const button = $('repeatBtn');
  const labels = {
    off: '반복 끔',
    all: '전체 반복',
    one: '한 곡 반복'
  };
  const isOn = state.repeatMode !== 'off';
  setToggleButtonState(button, isOn);
  button?.setAttribute('aria-label', labels[state.repeatMode] || labels.off);
  button?.setAttribute('title', labels[state.repeatMode] || labels.off);
  button?.setAttribute('data-repeat-mode', state.repeatMode);
}

function toggleFavorite(song) {
  const sig = getTrackSignature(song);
  if (!sig) return;

  if (state.favorites.has(sig)) state.favorites.delete(sig);
  else state.favorites.add(sig);

  persistFavorites();
  renderPlaylist();
}

function closeTrackActionMenus(exceptMenu = null) {
  document.querySelectorAll('.track-action-menu').forEach((menu) => {
    if (menu === exceptMenu) return;
    menu.hidden = true;
    menu.style.left = '';
    menu.style.top = '';
    const toggle = menu._trackToggle || menu.closest('.track-btn')?.querySelector('.track-more');
    toggle?.setAttribute('aria-expanded', 'false');
  });
}

function positionTrackActionMenu(menu, toggle) {
  if (!menu || !toggle) return;

  const toggleRect = toggle.getBoundingClientRect();
  const menuRect = menu.getBoundingClientRect();
  const viewportPadding = 10;
  const bottomSafeArea = 92;
  const width = menuRect.width || 150;
  const height = menuRect.height || 96;
  const left = Math.min(
    window.innerWidth - width - viewportPadding,
    Math.max(viewportPadding, toggleRect.right - width)
  );
  const belowTop = toggleRect.bottom + 8;
  const aboveTop = toggleRect.top - height - 8;
  const maxBottom = window.innerHeight - bottomSafeArea;
  const top = belowTop + height <= maxBottom
    ? belowTop
    : Math.max(viewportPadding, aboveTop);

  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
}

function getTrackShareUrl(index = state.cur) {
  const shareUrl = new URL(`./share/${index + 1}.html`, APP_SCOPE_URL);
  return shareUrl.toString();
}

function trackAnalyticsEvent(eventName, params = {}) {
  try {
    window.trackMintonEvent?.(eventName, params);
  } catch (err) {
    console.warn('Analytics event failed', eventName, err);
  }
}

function downloadTrack(song) {
  if (!song?.url) return;
  trackAnalyticsEvent('track_download', {
    track_title: song.title || '',
    track_artist: song.artist || '',
    track_index: songs.findIndex((item) => item === song) + 1
  });
  const link = document.createElement('a');
  link.href = resolveAssetUrl(song.url);
  link.download = `${song.title || '75minton-track'}.mp3`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function shareTrack(song, index) {
  if (!song) return;
  const url = getTrackShareUrl(index);
  const title = `${song.title} - ${song.artist}`;
  const text = `75민턴 추천곡: ${title}`;
  trackAnalyticsEvent('track_share', {
    track_title: song.title || '',
    track_artist: song.artist || '',
    track_index: index + 1
  });

  try {
    if (navigator.share) {
      await navigator.share({ title, text, url });
      return;
    }
  } catch (err) {
    if (err?.name === 'AbortError') return;
    console.warn('공유하기 실패', err);
  }

  try {
    await navigator.clipboard.writeText(`${title}\n${url}`);
    showStatus('공유 링크를 클립보드에 복사했습니다.', { tone: 'info' });
  } catch (err) {
    console.warn('공유 링크 복사 실패', err);
    window.prompt('공유 링크를 복사하세요.', `${title}\n${url}`);
  }
}

function updateFavoritesFilterButton() {
  if (!favoritesFilterBtn) return;
  favoritesFilterBtn.classList.toggle('active', state.favoritesOnly);
  favoritesFilterBtn.setAttribute('aria-pressed', String(state.favoritesOnly));
}

function setupMediaSession(song) {
  if (!('mediaSession' in navigator) || !song) return;

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      artwork: [
        { src: song.cover || defaultCover, sizes: '512x512', type: 'image/png' }
      ]
    });

    navigator.mediaSession.setActionHandler('play', () => safePlay({ silent: true }));
    navigator.mediaSession.setActionHandler('pause', () => audio.pause());
    navigator.mediaSession.setActionHandler('previoustrack', prev);
    navigator.mediaSession.setActionHandler('nexttrack', next);
    navigator.mediaSession.setActionHandler('seekbackward', () => seekBy(-10));
    navigator.mediaSession.setActionHandler('seekforward', () => seekBy(10));
  } catch (err) {
    console.warn('Media Session ?ㅼ젙 ?ㅽ뙣', err);
  }
}

function seekBy(seconds) {
  if (!Number.isFinite(audio.duration)) return;
  audio.currentTime = Math.min(audio.duration, Math.max(0, audio.currentTime + seconds));
  persistPlayerState();
}

function hashString(value = '') {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function updateMusicBackdrop(song) {
  const seed = hashString(`${song?.title || ''}|${song?.artist || ''}|${song?.id || ''}`);
  const hueA = seed % 360;
  const hueB = (hueA + 92 + (seed % 34)) % 360;
  const hueC = (hueA + 178 + (seed % 48)) % 360;
  reactiveHues = { a: hueA, b: hueB, c: hueC };

  document.documentElement.style.setProperty('--music-hue-a', String(hueA));
  document.documentElement.style.setProperty('--music-hue-b', String(hueB));
  document.documentElement.style.setProperty('--music-hue-c', String(hueC));
}

async function ensureReactiveBackdropAnalyzer() {
  if (reactiveAnalyser) {
    if (reactiveAudioContext?.state === 'suspended') await reactiveAudioContext.resume();
    return true;
  }

  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  const captureStream = audio.captureStream || audio.mozCaptureStream;
  if (!AudioContextCtor || !captureStream) return false;

  try {
    reactiveAudioContext = reactiveAudioContext || new AudioContextCtor();
    const stream = captureStream.call(audio);
    reactiveStreamSource = reactiveAudioContext.createMediaStreamSource(stream);
    reactiveAnalyser = reactiveAudioContext.createAnalyser();
    reactiveAnalyser.fftSize = 128;
    reactiveAnalyser.smoothingTimeConstant = 0.72;
    reactiveDataArray = new Uint8Array(reactiveAnalyser.frequencyBinCount);

    reactiveSilentGain = reactiveAudioContext.createGain();
    reactiveSilentGain.gain.value = 0;
    reactiveStreamSource.connect(reactiveAnalyser);
    reactiveAnalyser.connect(reactiveSilentGain);
    reactiveSilentGain.connect(reactiveAudioContext.destination);

    if (reactiveAudioContext.state === 'suspended') await reactiveAudioContext.resume();
    return true;
  } catch (err) {
    console.warn('음악 반응형 배경 초기화 실패', err);
    reactiveAnalyser = null;
    return false;
  }
}

function setReactiveBackdropVars({ energy = 0, bass = 0, mid = 0, high = 0 } = {}) {
  const root = document.documentElement;
  root.style.setProperty('--music-energy', energy.toFixed(3));
  root.style.setProperty('--music-bass', bass.toFixed(3));
  root.style.setProperty('--music-mid', mid.toFixed(3));
  root.style.setProperty('--music-high', high.toFixed(3));
  root.style.setProperty('--music-alpha-a', (0.18 + bass * 0.34).toFixed(3));
  root.style.setProperty('--music-alpha-b', (0.13 + mid * 0.28).toFixed(3));
  root.style.setProperty('--music-alpha-c', (0.10 + high * 0.24).toFixed(3));
}

function averageFrequencyRange(data, startRatio, endRatio) {
  if (!data?.length) return 0;
  const start = Math.max(0, Math.floor(data.length * startRatio));
  const end = Math.max(start + 1, Math.floor(data.length * endRatio));
  let total = 0;
  for (let i = start; i < Math.min(end, data.length); i += 1) total += data[i];
  return total / ((Math.min(end, data.length) - start) * 255);
}

function tickReactiveBackdrop() {
  if (!reactiveAnalyser || audio.paused || audio.ended) {
    reactiveAnimationFrame = null;
    return;
  }

  reactiveAnalyser.getByteFrequencyData(reactiveDataArray);
  const bass = averageFrequencyRange(reactiveDataArray, 0.02, 0.18);
  const mid = averageFrequencyRange(reactiveDataArray, 0.18, 0.55);
  const high = averageFrequencyRange(reactiveDataArray, 0.55, 0.92);
  const energy = Math.min(1, bass * 0.48 + mid * 0.34 + high * 0.28);

  reactiveLevels = {
    energy: reactiveLevels.energy * 0.72 + energy * 0.28,
    bass: reactiveLevels.bass * 0.68 + bass * 0.32,
    mid: reactiveLevels.mid * 0.74 + mid * 0.26,
    high: reactiveLevels.high * 0.76 + high * 0.24
  };

  const pulse = reactiveLevels.energy;
  const drift = performance.now() / 1000;
  const root = document.documentElement;
  root.style.setProperty('--music-hue-a', String(Math.round((reactiveHues.a + reactiveLevels.bass * 22 + drift * 1.4) % 360)));
  root.style.setProperty('--music-hue-b', String(Math.round((reactiveHues.b + reactiveLevels.mid * 18 + drift * 0.9) % 360)));
  root.style.setProperty('--music-hue-c', String(Math.round((reactiveHues.c + reactiveLevels.high * 26 + drift * 1.8) % 360)));
  setReactiveBackdropVars(reactiveLevels);
  document.body.classList.toggle('is-audio-reactive', pulse > 0.015);

  reactiveAnimationFrame = requestAnimationFrame(tickReactiveBackdrop);
}

async function startReactiveBackdrop() {
  const ready = await ensureReactiveBackdropAnalyzer();
  if (!ready) {
    document.body.classList.add('is-audio-reactive');
    setReactiveBackdropVars({ energy: 0.38, bass: 0.26, mid: 0.18, high: 0.14 });
    return;
  }

  if (!reactiveAnimationFrame) {
    reactiveAnimationFrame = requestAnimationFrame(tickReactiveBackdrop);
  }
}

function stopReactiveBackdrop() {
  if (reactiveAnimationFrame) {
    cancelAnimationFrame(reactiveAnimationFrame);
    reactiveAnimationFrame = null;
  }
  reactiveLevels = { energy: 0, bass: 0, mid: 0, high: 0 };
  setReactiveBackdropVars(reactiveLevels);
  document.body.classList.remove('is-audio-reactive');
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

function setEqUiEnabled(isEnabled) {
  if (!eqToggle) return;
  eqToggle.classList.toggle('lit', isEnabled);
  eqToggle.setAttribute('aria-pressed', String(isEnabled));
}

function isMobileEqLayout() {
  try {
    return window.matchMedia('(max-width: 768px), (max-height: 520px) and (pointer: coarse)').matches;
  } catch (err) {
    return window.innerWidth <= 768 || (window.innerHeight <= 520 && window.matchMedia('(pointer: coarse)').matches);
  }
}

function getEqDisplayName() {
  return EQ_PRESET_LABELS[state.eqPreset] || EQ_PRESET_LABELS.custom;
}

function updateEqToggleLabel() {
  if (!eqToggle) return;
  const displayName = getEqDisplayName();
  eqToggle.textContent = isMobileEqLayout() ? `EQ · ${displayName}` : 'EQ';
  eqToggle.setAttribute('aria-label', `EQ ${displayName}`);
  if (eqPanel) {
    eqPanel.setAttribute('data-eq-preset-label', displayName);
  }
}

function setEqPanelOpen(isOpen) {
  state.eqPanelOpen = Boolean(isOpen);
  if (!eqPanel) return;
  eqPanel.classList.toggle('expanded', state.eqPanelOpen);
  eqToggle?.setAttribute('aria-expanded', String(state.eqPanelOpen));
  eqClose?.toggleAttribute('hidden', !state.eqPanelOpen);
}

function updateEqPresetButtons(activePreset = state.eqPreset) {
  eqPresetButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.eqPreset === activePreset);
  });
}

function renderEqControls() {
  eqSliders.forEach((slider, index) => {
    const gain = Number(state.eqGains[index] || 0);
    slider.value = String(gain);
    const output = slider.closest('.eq-band')?.querySelector('output');
    if (output) output.textContent = gain > 0 ? `+${gain}` : String(gain);
  });
  setEqUiEnabled(state.eqEnabled);
  updateEqPresetButtons();
  updateEqToggleLabel();
}

function applyEqGains() {
  if (!eqFilters.length) return;
  const now = eqAudioContext?.currentTime || 0;
  eqFilters.forEach((filter, index) => {
    const nextGain = state.eqEnabled ? Number(state.eqGains[index] || 0) : 0;
    try {
      filter.gain.cancelScheduledValues(now);
      filter.gain.setTargetAtTime(nextGain, now, 0.015);
    } catch (err) {
      filter.gain.value = nextGain;
    }
  });
}

async function ensureEqAudioGraph() {
  if (eqFilters.length) {
    if (eqAudioContext?.state === 'suspended') await eqAudioContext.resume();
    return true;
  }

  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    showStatus('이 브라우저는 EQ 기능을 지원하지 않습니다.', { tone: 'error' });
    return false;
  }

  try {
    eqAudioContext = eqAudioContext || new AudioContextCtor();
    eqSourceNode = eqSourceNode || eqAudioContext.createMediaElementSource(audio);
    eqFilters = EQ_FREQUENCIES.map((frequency) => {
      const filter = eqAudioContext.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = frequency;
      filter.Q.value = 1;
      filter.gain.value = 0;
      return filter;
    });

    eqSourceNode.connect(eqFilters[0]);
    for (let i = 0; i < eqFilters.length - 1; i += 1) {
      eqFilters[i].connect(eqFilters[i + 1]);
    }
    eqFilters[eqFilters.length - 1].connect(eqAudioContext.destination);

    if (eqAudioContext.state === 'suspended') await eqAudioContext.resume();
    applyEqGains();
    return true;
  } catch (err) {
    console.warn('EQ 초기화 실패', err);
    state.eqEnabled = false;
    setEqUiEnabled(false);
    showStatus('EQ를 초기화하지 못했습니다. 음원 출처 또는 브라우저 제한을 확인해주세요.', { tone: 'error', duration: 5200 });
    return false;
  }
}

async function setEqEnabled(isEnabled) {
  state.eqEnabled = Boolean(isEnabled);
  setEqUiEnabled(state.eqEnabled);

  if (state.eqEnabled) {
    const ready = await ensureEqAudioGraph();
    if (!ready) return false;
  }

  applyEqGains();
  return true;
}

async function setEqPreset(presetName) {
  const preset = EQ_PRESETS[presetName] || EQ_PRESETS.flat;
  state.eqPreset = EQ_PRESETS[presetName] ? presetName : 'flat';
  state.eqGains = [...preset];
  renderEqControls();

  if (state.eqPreset !== 'flat') {
    await setEqEnabled(true);
  } else {
    applyEqGains();
  }
}

function clearAutoAdvanceTimer() {
  if (autoAdvanceTimer) {
    window.clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }

  if (autoAdvanceCountdownTimer) {
    window.clearInterval(autoAdvanceCountdownTimer);
    autoAdvanceCountdownTimer = null;
  }
}

function formatAutoAdvanceMessage(baseMessage, remainingMs) {
  const seconds = Math.max(0, remainingMs / 1000);
  const spinnerFrames = ['.', '..', '...'];
  const spinner = spinnerFrames[Math.floor((TRACK_GAP_MS - remainingMs) / 250) % spinnerFrames.length];
  return `${baseMessage} ${seconds.toFixed(1)}s ${spinner}`;
}

function scheduleAutoAdvance(callback, { message = '잠시 후 다음 곡을 재생합니다' } = {}) {
  clearAutoAdvanceTimer();

  const startedAt = Date.now();
  showStatus(formatAutoAdvanceMessage(message, TRACK_GAP_MS), { tone: 'info', duration: 0 });

  autoAdvanceCountdownTimer = window.setInterval(() => {
    const elapsed = Date.now() - startedAt;
    const remainingMs = Math.max(0, TRACK_GAP_MS - elapsed);
    showStatus(formatAutoAdvanceMessage(message, remainingMs), { tone: 'info', duration: 0 });

    if (remainingMs <= 0) {
      window.clearInterval(autoAdvanceCountdownTimer);
      autoAdvanceCountdownTimer = null;
    }
  }, 100);

  autoAdvanceTimer = window.setTimeout(async () => {
    clearAutoAdvanceTimer();
    hideStatus();
    await callback();
  }, TRACK_GAP_MS);
}

function shuffleArray(list) {
  const shuffled = [...list];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function buildShuffleQueue(excludeIndex = state.cur) {
  return shuffleArray(
    songs
      .map((_, index) => index)
      .filter((index) => index !== excludeIndex)
  );
}

function resetShufflePlaybackState(currentIndex = state.cur) {
  state.shuffleHistory = [];
  state.shuffleQueue = state.shuffle ? buildShuffleQueue(currentIndex) : [];
}

function getNextSequentialIndex({ allowWrap = true } = {}) {
  if (!songs.length) return null;
  if (state.cur < songs.length - 1) return state.cur + 1;
  return allowWrap ? 0 : null;
}

function getNextShuffleIndex({ allowWrap = true } = {}) {
  if (!songs.length) return null;
  if (songs.length === 1) return allowWrap ? 0 : null;

  if (!state.shuffleQueue.length) {
    if (!allowWrap) return null;
    state.shuffleQueue = buildShuffleQueue(state.cur);
  }

  const nextIndex = state.shuffleQueue.shift();
  state.shuffleHistory.push(state.cur);
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


function buildUrlVariants(assetPath = '') {
  const trimmed = String(assetPath || '').trim();
  if (!trimmed) return [];

  const variants = new Set();
  const pushVariant = (value) => {
    const next = String(value || '').trim();
    if (!next) return;
    variants.add(next);
    try {
      variants.add(encodeURI(next));
    } catch (err) {
      console.warn('URL ?몄퐫???ㅽ뙣', next, err);
    }
  };

  const resolved = resolveAssetUrl(trimmed);
  pushVariant(resolved);

  try {
    const url = new URL(resolved, APP_SCOPE_URL);
    const encodedPathname = url.pathname
      .split('/')
      .map((segment, index) => (index === 0 ? segment : encodeURIComponent(decodeURIComponent(segment))))
      .join('/');

    pushVariant(url.toString());
    pushVariant(`${url.origin}${encodedPathname}${url.search}`);

    if (url.search) {
      pushVariant(`${url.origin}${url.pathname}`);
      pushVariant(`${url.origin}${encodedPathname}`);
    }
  } catch (err) {
    console.warn('媛??URL ?꾨낫 ?앹꽦 ?ㅽ뙣', trimmed, err);
  }

  return [...variants];
}

function inferLrcPathFromSong(song) {
  const audioUrl = String(song?.url || '').trim();
  if (!audioUrl) return '';

  const withoutQuery = audioUrl.split('#')[0].split('?')[0];
  if (!withoutQuery) return '';

  return withoutQuery.replace(/\.[a-z0-9]+$/i, '.lrc');
}

function getLrcCandidates(songOrPath = '') {
  const song = songOrPath && typeof songOrPath === 'object' ? songOrPath : null;
  const candidates = new Set();

  const appendVariants = (value) => {
    for (const variant of buildUrlVariants(value)) {
      candidates.add(variant);
    }
  };

  if (song) {
    appendVariants(song.lrc);
    appendVariants(inferLrcPathFromSong(song));
  } else {
    appendVariants(songOrPath);
  }

  return [...candidates];
}

function decodeLyricsBuffer(buffer) {
  const decoders = ['utf-8', 'euc-kr', 'utf-16le', 'utf-16be'];

  for (const encoding of decoders) {
    try {
      const decoded = new TextDecoder(encoding).decode(buffer).replace(/^\uFEFF/, '').trim();
      if (!decoded) continue;

      const looksBroken = decoded.includes('\uFFFD') && encoding === 'utf-8';
      if (!looksBroken || encoding === decoders[decoders.length - 1]) {
        return decoded;
      }
    } catch (err) {
      console.warn(`媛???붿퐫???ㅽ뙣 (${encoding})`, err);
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
  const candidates = getLrcCandidates(song);

  for (const candidateUrl of candidates) {
    try {
      const response = await fetch(candidateUrl, { cache: 'no-store' });
      if (!response.ok) {
        console.warn('LRC ?묐떟 ?ㅻ쪟', response.status, candidateUrl);
        continue;
      }

      const buffer = await response.arrayBuffer();
      const decoded = decodeLyricsBuffer(buffer);
      if (!decoded || isLikelyHtmlDocument(decoded)) {
        console.warn('LRC ?묐떟??媛???뚯씪 ?뺤떇???꾨떃?덈떎.', candidateUrl);
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
    await ensureReactiveBackdropAnalyzer();
    if (state.eqEnabled) {
      await ensureEqAudioGraph();
    }
    await audio.play();
    const song = songs[state.cur];
    trackAnalyticsEvent('track_play', {
      track_title: song?.title || '',
      track_artist: song?.artist || '',
      track_index: state.cur + 1
    });
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

function isStandaloneDisplayMode() {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  } catch (err) {
    console.warn('standalone display-mode ?뺤씤 ?ㅽ뙣', err);
    return window.navigator.standalone === true;
  }
}

function shouldEnableStandaloneBackGuard() {
  if (!isStandaloneDisplayMode()) return false;

  try {
    return window.matchMedia('(pointer: coarse), (max-width: 1024px)').matches;
  } catch (err) {
    console.warn('諛?踰꾪듉 媛??viewport ?뺤씤 ?ㅽ뙣', err);
    return isMobileViewport();
  }
}

function restoreStandaloneBackGuardEntry() {
  if (!backGuardState.enabled) return;

  try {
    const currentUrl = new URL(window.location.href);
    const currentState = history.state && typeof history.state === 'object' ? history.state : {};
    history.replaceState({ ...currentState, __75BackBase: true }, '', currentUrl);
    history.pushState({ __75BackTrap: true, at: Date.now() }, '', currentUrl);
    backGuardState.seeded = true;
  } catch (err) {
    console.warn('諛?踰꾪듉 媛???곹깭 蹂듭썝 ?ㅽ뙣', err);
  }
}

function handleStandaloneBackNavigation() {
  if (document.body.classList.contains('lyrics-expanded')) {
    closeLyricsExpanded();
    showStatus(BACK_GUARD_CLOSE_LYRICS_MESSAGE, { tone: 'info' });
    return;
  }

  const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'player';
  if (activeTab !== 'player') {
    setActiveTab('player');
    showStatus(BACK_GUARD_RETURN_PLAYER_MESSAGE, { tone: 'info' });
    return;
  }

  showStatus(BACK_GUARD_STATUS_MESSAGE, { tone: 'info', duration: 2800 });
}

function setupStandaloneBackGuard() {
  backGuardState.enabled = shouldEnableStandaloneBackGuard();
  if (!backGuardState.enabled || backGuardState.seeded) return;

  updateUrlForCurrentTrack();
  restoreStandaloneBackGuardEntry();

  window.addEventListener('popstate', () => {
    if (!backGuardState.enabled || backGuardState.handlingPopstate) return;

    backGuardState.handlingPopstate = true;

    try {
      handleStandaloneBackNavigation();
      updateUrlForCurrentTrack();
      restoreStandaloneBackGuardEntry();
    } finally {
      window.setTimeout(() => {
        backGuardState.handlingPopstate = false;
      }, 0);
    }
  });
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
  if (state.eqPanelOpen) setEqPanelOpen(false);
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
  const rawUrl = String(raw.url || raw.src || '').trim();
  if (!rawUrl) return null;

  const url = normalizeAssetPath(rawUrl);
  const lrc = raw.lrc ? normalizeAssetPath(String(raw.lrc).trim()) : '';
  const cover = raw.cover ? normalizeAssetPath(String(raw.cover).trim()) : '';
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
    console.warn('??λ맂 怨??ㅻ깄?룹쓣 ?쎌? 紐삵뻽?듬땲??', err);
    return null;
  }
}

function persistSongsSnapshot(list) {
  try {
    const safeList = list.filter(song => !song.url.startsWith('blob:'));
    localStorage.setItem(STORAGE_SONGS_HASH_KEY, getSongsFingerprint(safeList));
    localStorage.setItem(STORAGE_SONGS_SNAPSHOT_KEY, JSON.stringify(safeList));
  } catch (err) {
    console.warn('怨??ㅻ깄??????ㅽ뙣', err);
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

  let url;
  try {
    url = new URL(window.location.href);
  } catch (err) {
    url = new URL(resolveAssetUrl('./index.html'));
  }

  const expectedPath = new URL('./index.html', APP_SCOPE_URL).pathname;
  if (!url.pathname.startsWith(APP_SCOPE_PATH)) {
    url.pathname = expectedPath;
  }

  url.searchParams.set('no', String(state.cur + 1));
  window.history.replaceState({}, '', url);
}

async function fetchSongsList({ forceNetwork = false } = {}) {
  const baseSongsUrl = resolveAssetUrl(SONGS_JSON_URL);
  const requestUrl = forceNetwork
    ? `${baseSongsUrl}${baseSongsUrl.includes('?') ? '&' : '?'}_=${Date.now()}`
    : baseSongsUrl;

  const response = await fetch(requestUrl, {
    cache: forceNetwork ? 'no-store' : 'default',
    headers: { 'Accept': 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`songs.json ?묐떟 ?ㅻ쪟: ${response.status}`);
  }

  const data = await response.json();
  return normalizeSongsList(data);
}

function syncSongMeta(song) {
  titleEl.textContent = $('miniTitle').textContent = song.title;
  artistEl.textContent = $('miniArtist').textContent = song.artist;
  $('lrcTrackName').textContent = song.title;
  coverEl.src = $('miniCover').src = song.cover || defaultCover;
  updateMusicBackdrop(song);
  setupMediaSession(song);
  persistPlayerState();
}

function resetProgressUi() {
  progressEl.value = 0;
  progFill.style.width = $('miniFill').style.width = '0%';
  $('currentTime').textContent = '0:00';
  $('duration').textContent = '0:00';
}

/* ?? UI ???대룞 濡쒖쭅 ?? */
function setActiveTab(tabName, { focus = false } = {}) {
  const prevTabName = document.querySelector('.tab-btn.active')?.dataset.tab || '';
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
  if (prevTabName !== tabName) {
    trackAnalyticsEvent('tab_view', { tab_name: tabName });
  }
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
homeGoPlayBtn?.addEventListener('click', () => setActiveTab('player'));
homeGoPlaylistBtn?.addEventListener('click', () => setActiveTab('playlist'));
homeMonthlyPlayBtn?.addEventListener('click', () => playHomeTrack(homeMonthlyPlayBtn));
homeRecommendedPlayBtn?.addEventListener('click', () => playHomeTrack(homeRecommendedPlayBtn));

lyricsExpandBtn?.addEventListener('click', toggleLyricsExpanded);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeLyricsExpanded();
    closeTrackActionMenus();
  }
});

document.addEventListener('click', (event) => {
  if (event.target.closest('.track-btn')) return;
  closeTrackActionMenus();
});

window.addEventListener('resize', () => {
  closeTrackActionMenus();
  if (!isMobileViewport()) closeLyricsExpanded();
});

document.querySelectorAll('.tab-panel').forEach((panel) => {
  panel.addEventListener('scroll', () => closeTrackActionMenus(), { passive: true });
});


/* ?? ?뚮뜑留??? */
function renderPlaylist() {
  const pl = $('playlist');
  closeTrackActionMenus();
  document.querySelectorAll('.track-action-menu').forEach((menu) => menu.remove());
  pl.innerHTML = '';

  const query = state.playlistQuery.trim().toLowerCase();
  let renderedCount = 0;

  songs.forEach((song, index) => {
    const sig = getTrackSignature(song);
    const isFavorite = state.favorites.has(sig);
    const haystack = `${song.title} ${song.artist}`.toLowerCase();
    if (query && !haystack.includes(query)) return;
    if (state.favoritesOnly && !isFavorite) return;

    const btn = document.createElement('div');
    btn.className = 'track-btn' + (index === state.cur ? ' active' : '');
    btn.setAttribute('role', 'button');
    btn.setAttribute('tabindex', '0');
    const isLocal = song.id && song.id.startsWith('local-');

    btn.innerHTML = `<img class="t-thumb" src="${escAttr(song.cover || defaultCover)}" alt="">
      <div style="min-width:0; flex-grow: 1; text-align: left;">
        <div class="t-name">${esc(song.title)}</div>
        <div class="t-by">${esc(song.artist)}</div>
      </div>
      ${isLocal ? `<span class="t-del" data-id="${song.id}" aria-label="삭제">×</span>` : ''}`;
    const favoriteToggle = document.createElement('button');
    favoriteToggle.type = 'button';
    favoriteToggle.className = 'fav-toggle' + (isFavorite ? ' active' : '');
    favoriteToggle.setAttribute('aria-label', isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가');
    favoriteToggle.textContent = isFavorite ? '★' : '☆';
    favoriteToggle.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeTrackActionMenus();
      toggleFavorite(song);
    });
    btn.appendChild(favoriteToggle);

    const moreToggle = document.createElement('button');
    moreToggle.type = 'button';
    moreToggle.className = 'track-more';
    moreToggle.setAttribute('aria-label', '상세 메뉴');
    moreToggle.setAttribute('aria-expanded', 'false');
    moreToggle.textContent = '⋮';
    moreToggle.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const willOpen = actionMenu.hidden;
      closeTrackActionMenus(actionMenu);
      actionMenu.hidden = !willOpen;
      if (willOpen) positionTrackActionMenu(actionMenu, moreToggle);
      moreToggle.setAttribute('aria-expanded', String(willOpen));
    });
    btn.appendChild(moreToggle);

    const actionMenu = document.createElement('div');
    actionMenu.className = 'track-action-menu';
    actionMenu.setAttribute('role', 'menu');
    actionMenu.id = `trackActionMenu-${index}`;
    actionMenu.hidden = true;
    actionMenu._trackToggle = moreToggle;
    moreToggle.setAttribute('aria-controls', actionMenu.id);
    actionMenu.innerHTML = `
      <button class="track-action-item" data-action="download" role="menuitem" type="button">MP3 다운로드</button>
      <button class="track-action-item" data-action="share" role="menuitem" type="button">공유하기</button>`;
    actionMenu.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const action = event.target.closest('.track-action-item')?.dataset.action;
      if (!action) return;

      actionMenu.hidden = true;
      actionMenu.style.left = '';
      actionMenu.style.top = '';
      moreToggle.setAttribute('aria-expanded', 'false');
      if (action === 'download') downloadTrack(song);
      if (action === 'share') shareTrack(song, index);
    });
    document.body.appendChild(actionMenu);

    btn.addEventListener('click', (e) => {
      if (e.target.closest('.t-del')) {
        e.stopPropagation();
        deleteLocalTrack(song.id);
      } else if (e.target.closest('.fav-toggle, .track-more, .track-action-menu')) {
        e.stopPropagation();
      } else {
        closeTrackActionMenus();
        loadTrack(index, true);
      }
    });

    btn.addEventListener('keydown', (e) => {
      if (e.target !== btn) return;
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      loadTrack(index, true);
    });

    pl.appendChild(btn);
    renderedCount += 1;
  });

  if (!renderedCount) {
    const empty = document.createElement('div');
    empty.className = 'playlist-empty';
    empty.textContent = state.favoritesOnly ? '즐겨찾기한 곡이 없습니다.' : '검색 결과가 없습니다.';
    pl.appendChild(empty);
  }

  updateFavoritesFilterButton();
}

function getHomeSongIndexes() {
  if (!songs.length) return { monthly: 0, recommended: 0 };
  const monthSeed = new Date().getMonth();
  const monthly = monthSeed % songs.length;
  const recommended = songs.length > 1 ? (monthly + 3) % songs.length : monthly;
  return { monthly, recommended };
}

function getHomeContentConfig() {
  const config = window.MINTON_HOME_CONTENT && typeof window.MINTON_HOME_CONTENT === 'object'
    ? window.MINTON_HOME_CONTENT
    : {};

  return {
    monthly: config.monthly || { title: '' },
    recommended: config.recommended || { title: '' },
    notices: Array.isArray(config.notices) ? config.notices : []
  };
}

function normalizeHomeTitle(value = '') {
  return String(value)
    .normalize('NFKC')
    .replace(/\s+/g, '')
    .toLowerCase();
}

function findHomeSongByTitle(title) {
  const target = normalizeHomeTitle(title);
  if (!target) return null;

  const exactIndex = songs.findIndex((song) => normalizeHomeTitle(song.title) === target);
  if (exactIndex >= 0) return { song: songs[exactIndex], index: exactIndex };

  const partialIndex = songs.findIndex((song) => {
    const normalizedTitle = normalizeHomeTitle(song.title);
    return normalizedTitle.includes(target) || target.includes(normalizedTitle);
  });
  if (partialIndex >= 0) return { song: songs[partialIndex], index: partialIndex };

  return null;
}

function setHomeTrackCard({ titleEl, artistEl, descEl, coverEl, playBtn, config, fallback }) {
  if (!titleEl || !artistEl || !coverEl || !playBtn) return;
  const matched = findHomeSongByTitle(config?.title) || fallback;
  const song = matched?.song;

  if (!song) {
    titleEl.textContent = config?.title || '곡 목록을 불러오는 중';
    artistEl.textContent = '75 Minton';
    if (descEl) descEl.textContent = config?.description || '';
    coverEl.src = defaultCover;
    coverEl.alt = config?.title || '75 Minton cover';
    playBtn.disabled = true;
    delete playBtn.dataset.trackIndex;
    return;
  }

  titleEl.textContent = song.title;
  artistEl.textContent = song.artist;
  if (descEl) descEl.textContent = config?.description || '';
  coverEl.src = song.cover || defaultCover;
  coverEl.alt = `${song.title} cover`;
  playBtn.disabled = false;
  playBtn.dataset.trackIndex = String(matched.index);
}

function renderHomeNotices(notices = []) {
  if (!homeNoticeListEl || !notices.length) return;
  homeNoticeListEl.innerHTML = notices
    .map((notice) => `<span>${esc(notice)}</span>`)
    .join('');
}

function renderHome() {
  if (!homeMonthlySongEl || !homeRecommendedSongEl) return;
  const homeContent = getHomeContentConfig();
  const { monthly, recommended } = getHomeSongIndexes();
  const monthlySong = songs[monthly];
  const recommendedSong = songs[recommended];

  setHomeTrackCard({
    titleEl: homeMonthlySongEl,
    artistEl: homeMonthlyArtistEl,
    descEl: homeMonthlyDescEl,
    coverEl: homeMonthlyCoverEl,
    playBtn: homeMonthlyPlayBtn,
    config: homeContent.monthly,
    fallback: monthlySong ? { song: monthlySong, index: monthly } : null
  });

  setHomeTrackCard({
    titleEl: homeRecommendedSongEl,
    artistEl: homeRecommendedArtistEl,
    descEl: homeRecommendedDescEl,
    coverEl: homeRecommendedCoverEl,
    playBtn: homeRecommendedPlayBtn,
    config: homeContent.recommended,
    fallback: recommendedSong ? { song: recommendedSong, index: recommended } : null
  });

  renderHomeNotices(homeContent.notices);
}

async function playHomeTrack(button) {
  const index = Number(button?.dataset.trackIndex);
  if (!Number.isInteger(index) || index < 0 || index >= songs.length) return;
  setActiveTab('player');
  await loadTrack(index, true);
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
    resetShufflePlaybackState(state.cur);
    updateUrlForCurrentTrack();
  }
  
  renderPlaylist();
  renderHome();
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

/* ?? 媛???뚯떛 ?? */
async function parseLRC(song, requestToken = currentLoadToken) {
  if (requestToken !== currentLoadToken) return false;

  lyricsInner.innerHTML = '<div class="lyric-line">가사를 불러오는 중...</div>';
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
    renderLyricsMarkup([], '가사를 불러오지 못했습니다.');
    if (song.lrc) {
      showStatus(`가사 파일을 불러오지 못했습니다: ${song.lrc}`, { tone: 'error', duration: 4200 });
    }
    return true;
  }

  const lyrics = [];
  const syncTagRegex = /\[(\d{1,3}):(\d{2})(?:[.,](\d{1,3}))?\]/g;
  const lines = text.split(/\r?\n/);
  const hasSync = /\[\d{1,3}:\d{2}(?:[.,]\d{1,3})?\]/.test(text);

  if (hasSync) {
    for (const rawLine of lines) {
      const line = rawLine.trim();
      syncTagRegex.lastIndex = 0;
      const matches = [...line.matchAll(syncTagRegex)];
      if (!matches.length) continue;

      syncTagRegex.lastIndex = 0;
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

/* 재생 제어 */
function setPlaying(on) {
  const playSvg = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" style="transform: translateX(1.5px)"><path d="M8 5v14l11-7z"></path></svg>';
  const pauseSvg = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>';
  playBtn.innerHTML = $('miniPlay').innerHTML = on ? pauseSvg : playSvg;
  playBtn.setAttribute('aria-label', on ? '일시정지' : '재생');
  $('miniPlay').setAttribute('aria-label', on ? '일시정지' : '재생');

  document.body.classList.toggle('is-playing', on);
  if (!on) stopReactiveBackdrop();
  if (on) artFrame.classList.add('playing');
  else artFrame.classList.remove('playing');

  renderPlaylist();
}

async function loadTrack(idx, auto = false, { keepShuffleState = false } = {}) {
  if (!songs.length) return false;

  clearAutoAdvanceTimer();

  const requestToken = ++currentLoadToken;
  hideStatus();

  state.cur = Math.max(0, Math.min(idx, songs.length - 1));
  const song = songs[state.cur];
  if (!keepShuffleState) resetShufflePlaybackState(state.cur);

  updateUrlForCurrentTrack();
  syncSongMeta(song);

  audio.pause();
  audio.src = resolveAssetUrl(song.url);
  audio.load();
  resetProgressUi();

  artFrame.style.animation = 'none';
  artFrame.offsetHeight;
  artFrame.style.animation = null;

  renderPlaylist();
  const lyricsPromise = parseLRC(song, requestToken);
  setPlaying(false);

  if (auto) {
    await safePlay({ blockedMessage: '재생을 시작하지 못했습니다. 다시 재생 버튼을 눌러주세요.' });
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

const next = ({ autoAdvance = false } = {}) => {
  if (!songs.length) return;
  const nextIndex = state.shuffle
    ? getNextShuffleIndex({ allowWrap: !autoAdvance || state.repeat })
    : getNextSequentialIndex({ allowWrap: !autoAdvance || state.repeat });

  if (nextIndex === null || nextIndex === undefined) {
    audio.currentTime = 0;
    resetProgressUi();
    setPlaying(false);
    return;
  }

  loadTrack(nextIndex, true, { keepShuffleState: true });
};

const prev = () => {
  if (!songs.length) return;
  const prevIndex = state.shuffle && state.shuffleHistory.length
    ? state.shuffleHistory.pop()
    : (state.cur - 1 + songs.length) % songs.length;
  loadTrack(prevIndex, true, { keepShuffleState: state.shuffle });
};

playBtn.addEventListener('click', toggle);
$('miniPlay').addEventListener('click', toggle);
$('prevBtn').addEventListener('click', prev);
$('nextBtn').addEventListener('click', next);
$('miniNext').addEventListener('click', next);
artFrame.addEventListener('click', () => artFrame.classList.toggle('square'));

$('shuffleBtn').addEventListener('click', () => {
  state.shuffle = !state.shuffle;
  resetShufflePlaybackState(state.cur);
  setToggleButtonState($('shuffleBtn'), state.shuffle);
  persistPlayerState();
});
$('repeatBtn').addEventListener('click', () => {
  const modes = ['off', 'all', 'one'];
  state.repeatMode = modes[(modes.indexOf(state.repeatMode) + 1) % modes.length];
  state.repeat = state.repeatMode !== 'off';
  updateRepeatButtonState();
  persistPlayerState();
});

playlistSearchEl?.addEventListener('input', () => {
  state.playlistQuery = playlistSearchEl.value;
  renderPlaylist();
});

favoritesFilterBtn?.addEventListener('click', () => {
  state.favoritesOnly = !state.favoritesOnly;
  renderPlaylist();
});

progressEl.addEventListener('input', () => {
  if (audio.duration) {
    audio.currentTime = (progressEl.value / 100) * audio.duration;
  }
});

volumeEl.addEventListener('input', () => {
  applyVolume(volumeEl.value);
});

eqToggle?.addEventListener('click', async () => {
  if (isMobileEqLayout()) {
    setEqPanelOpen(!state.eqPanelOpen);
    return;
  }

  await setEqEnabled(!state.eqEnabled);
});

eqClose?.addEventListener('click', () => {
  setEqPanelOpen(false);
  eqToggle?.focus();
});

eqPresetButtons.forEach((button) => {
  button.addEventListener('click', async () => {
    await setEqPreset(button.dataset.eqPreset || 'flat');
  });
});

eqSliders.forEach((slider) => {
  slider.addEventListener('input', async () => {
    const index = Number(slider.dataset.eqBand);
    if (!Number.isInteger(index)) return;

    state.eqGains[index] = Number(slider.value);
    state.eqPreset = 'custom';
    updateEqPresetButtons('custom');
    renderEqControls();
    await setEqEnabled(true);
  });
});

window.addEventListener('resize', () => {
  if (!isMobileEqLayout()) {
    setEqPanelOpen(false);
  }
  updateEqToggleLabel();
});

audio.addEventListener('loadedmetadata', () => {
  $('duration').textContent = fmt(audio.duration);
});

audio.addEventListener('timeupdate', () => {
  const pct = audio.duration ? (audio.currentTime / audio.duration * 100) : 0;
  progressEl.value = pct;
  progFill.style.width = $('miniFill').style.width = pct + '%';
  $('currentTime').textContent = fmt(audio.currentTime);

  const now = Date.now();
  if (now - lastPlayerStatePersistedAt > 5000) {
    lastPlayerStatePersistedAt = now;
    persistPlayerState();
  }

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
  if (state.repeatMode === 'one') {
    scheduleAutoAdvance(async () => {
      audio.currentTime = 0;
      await safePlay({ blockedMessage: '반복 재생을 이어가지 못했습니다. 다시 눌러주세요.', silent: true });
    }, { message: '같은 곡 다시 재생까지' });
    return;
  }

  scheduleAutoAdvance(async () => {
    next({ autoAdvance: true });
  }, { message: '다음 곡 재생까지' });
});

audio.addEventListener('error', () => {
  const song = songs[state.cur];
  const songTitle = song?.title ? `"${song.title}"` : '현재 곡';
  showStatus(`${songTitle} 음원을 불러오지 못했습니다. 파일 경로를 확인해주세요.`, { tone: 'error', duration: 0 });
  setPlaying(false);
});

audio.addEventListener('pause', () => {
  setPlaying(false);
  persistPlayerState();
});
audio.addEventListener('play', () => {
  hideStatus();
  setPlaying(true);
  startReactiveBackdrop();
});

/* ?? PWA ?ㅼ튂 濡쒖쭅 ?? */
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
  const ok = window.confirm('앱 캐시와 저장 데이터를 정리하고 새로고침합니다. 계속할까요?');
  if (!ok) return;

  clearCacheBtn.disabled = true;
  const originalLabel = clearCacheBtn.innerHTML;
  clearCacheBtn.innerHTML = '<span>정리 중...</span>';

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

    showStatus('앱 플레이어 캐시를 정리했습니다. 새로고침합니다.', { tone: 'info' });
    const url = new URL(window.location.href);
    url.searchParams.set('cacheReset', Date.now().toString());
    window.location.replace(url.toString());
  } catch (err) {
    console.error(err);
    showStatus('캐시 정리 중 오류가 발생했습니다. 브라우저 설정에서 다시 확인해주세요.', { tone: 'error', duration: 0 });
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
    `./styles.css?v=${ASSET_VERSION}`,
    `./home-content.js?v=${ASSET_VERSION}`,
    `./analytics-config.js?v=${ASSET_VERSION}`,
    `./analytics.js?v=${ASSET_VERSION}`,
    `./app.js?v=${ASSET_VERSION}`,
    './manifest.json',
    './songs.json',
    './icons/icon-180.png',
    './icons/icon-192.png',
    './icons/icon-512.png'
  ].map(resolveAssetUrl);
  const mediaAssets = songs
    .flatMap(song => [song.url, song.lrc, song.cover])
    .filter(Boolean)
    .map(resolveAssetUrl);
  const sharePages = songs.map((_, index) => resolveAssetUrl(`./share/${index + 1}.html`));
  return [...new Set([...shellAssets, ...sharePages, ...mediaAssets])];
}

async function registerOfflinePwa() {
  if (!('serviceWorker' in navigator)) return null;
  if (swRegistrationPromise) return swRegistrationPromise;

  swRegistrationPromise = navigator.serviceWorker.register(SW_SCRIPT_URL, { scope: './' })
    .then((registration) => {
      console.log('Service Worker ?깅줉 ?꾨즺', registration.scope);

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        warmCacheWithCurrentAssets();
      });

      return registration;
    })
    .catch((err) => {
      console.warn('Service Worker ?깅줉 ?ㅽ뙣', err);
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
    console.warn('Service Worker ?낅뜲?댄듃 ?뺤씤 ?ㅽ뙣', err);
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
  resetShufflePlaybackState(Math.min(state.cur, songs.length - 1));
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
  renderHome();
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
      console.warn('캐시 songs.json 로딩 실패, 저장된 곡 목록을 확인합니다.', cacheErr);
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
  document.documentElement.dataset.appVersion = APP_BUILD_VERSION;
  document.body.dataset.appVersion = APP_BUILD_VERSION;
  loadStoredPreferences();
  updateLyricsExpandButton();
  const initialAutoplay = shouldAutoplayFromUrl();
  setActiveTab(initialAutoplay ? 'player' : 'home');
  renderHome();
  setToggleButtonState($('shuffleBtn'), state.shuffle);
  updateRepeatButtonState();
  renderEqControls();
  applyVolume(Number(volumeEl.dataset.restoreVolume || DEFAULT_VOLUME));

  await registerOfflinePwa();
  const initialSongs = await getInitialSongsList();
  await applySongsList(initialSongs, { initial: true, keepCurrent: false });

  if (!initialAutoplay && audio.dataset.restoreTrackSig) {
    const restoredIndex = songs.findIndex((song) => getTrackSignature(song) === audio.dataset.restoreTrackSig);
    if (restoredIndex >= 0 && restoredIndex !== state.cur) {
      await loadTrack(restoredIndex, false);
    }
  }

  if (!initialAutoplay && audio.dataset.restoreTime) {
    await waitForMetadata();
    const restoreTime = Number(audio.dataset.restoreTime);
    if (Number.isFinite(restoreTime) && restoreTime > 0 && Number.isFinite(audio.duration)) {
      audio.currentTime = Math.min(audio.duration - 0.2, restoreTime);
    }
  }

  setupStandaloneBackGuard();

  if (initialAutoplay) {
    await safePlay({ blockedMessage: '브라우저 정책으로 자동 재생이 차단되었습니다. 재생 버튼을 눌러주세요.' });
  }

  startSongsPolling();
  updateServiceWorkerIfPossible();
  checkForSongsUpdates();
}

initializeApp();
