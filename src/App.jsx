import { useEffect, useMemo, useRef, useState } from 'react';
import Hls from 'hls.js';
import { CHANNELS } from './channels';
import AdminPanel from './AdminPanel';
import { PUBLIC_RUNTIME_CONFIG, buildApiUrl } from './runtime-config';
import { PUBLIC_PLANS } from '../lib/plans.js';

const ACCESS_CACHE_KEY = 'app-tv-access-cache-v2';
const LAST_CHANNEL_CACHE_KEY = 'app-tv-last-channel-v1';
const ACTIVE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const INACTIVE_CACHE_TTL_MS = 15 * 60 * 1000;
const EXPIRY_WARNING_WINDOW_DAYS = 3;

function getAccessCacheTtl(accessGranted) {
  return accessGranted ? ACTIVE_CACHE_TTL_MS : INACTIVE_CACHE_TTL_MS;
}

function getCachedAccessTtl(payload) {
  if (!payload?.accessGranted) {
    return getAccessCacheTtl(false);
  }

  const expiresAt = parseLocalDate(payload.expiresAt);
  if (!expiresAt) {
    return getAccessCacheTtl(true);
  }

  const now = Date.now();
  const expiresAtMs = expiresAt.getTime();
  const daysUntilExpiry = Math.ceil((expiresAtMs - now) / (24 * 60 * 60 * 1000));

  if (daysUntilExpiry <= EXPIRY_WARNING_WINDOW_DAYS) {
    return Math.min(2 * 60 * 1000, Math.max(expiresAtMs - now, 30 * 1000));
  }

  return Math.min(ACTIVE_CACHE_TTL_MS, Math.max(expiresAtMs - now, 60 * 60 * 1000));
}

function readCachedAccess() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(ACCESS_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed?.accessId || typeof parsed?.accessGranted !== 'boolean' || !parsed?.checkedAt) {
      return null;
    }

    if (String(parsed.accessId || '').trim().toUpperCase() === 'PROVISORIO') {
      return null;
    }

    return parsed;
  } catch (_) {
    return null;
  }
}

function writeCachedAccess(payload) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(
    ACCESS_CACHE_KEY,
    JSON.stringify({
      ...payload,
      checkedAt: Date.now()
    })
  );
}

function clearCachedAccess() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(ACCESS_CACHE_KEY);
}

function readCachedChannelUrl() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(LAST_CHANNEL_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const cachedUrl = normalizeChannelUrl(raw);
    if (!cachedUrl) {
      return null;
    }

    return CHANNELS.some(channel => normalizeChannelUrl(channel.url) === cachedUrl) ? cachedUrl : null;
  } catch {
    return null;
  }
}

function writeCachedChannelUrl(url) {
  if (typeof window === 'undefined') {
    return;
  }

  const normalized = normalizeChannelUrl(url);
  if (!normalized || !CHANNELS.some(channel => normalizeChannelUrl(channel.url) === normalized)) {
    return;
  }

  window.localStorage.setItem(LAST_CHANNEL_CACHE_KEY, normalized);
}

function isCachedAccessExpired(access) {
  const expiresAt = String(access?.expiresAt || '').trim();
  if (!expiresAt) {
    return false;
  }

  const parsed = new Date(`${expiresAt}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const expiresStart = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());

  return todayStart.getTime() > expiresStart.getTime();
}

function parseLocalDate(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return null;
  }

  const parsed = new Date(`${raw}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeChannelUrl(url) {
  return String(url || '').trim();
}

function getExpiryRefreshDelay(expiresAt) {
  const date = parseLocalDate(expiresAt);
  if (!date) {
    return null;
  }

  const refreshAt = new Date(date);
  refreshAt.setDate(refreshAt.getDate() + 1);
  refreshAt.setHours(0, 0, 5, 0);

  return Math.max(refreshAt.getTime() - Date.now(), 60 * 1000);
}

function formatDaysRemaining(daysRemaining) {
  if (!Number.isFinite(daysRemaining)) {
    return '';
  }

  if (daysRemaining <= 0) {
    return 'vence hoje';
  }

  if (daysRemaining === 1) {
    return 'vence em 1 dia';
  }

  return `vence em ${daysRemaining} dias`;
}

function buildEmbedUrl(channel) {
  const url = channel?.url || '';

  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes('youtu.be')) {
      const videoId = parsed.pathname.replaceAll('/', '');
      return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0` : url;
    }

    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/embed/')) {
        return `${parsed.origin}${parsed.pathname}${parsed.search || '?autoplay=1&rel=0'}`;
      }

      if (parsed.pathname === '/watch') {
        const videoId = parsed.searchParams.get('v');
        return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0` : url;
      }
    }
  } catch (_) {
    return url;
  }

  return url;
}

function getChannelPlaybackMode(channel) {
  const url = String(channel?.url || '').trim().toLowerCase();
  const explicitTransport = String(channel?.playbackTransport || '').trim().toLowerCase();

  if (url.includes('youtu.be') || url.includes('youtube.com')) {
    return 'embed';
  }

  if (explicitTransport === 'browser') {
    return 'browser';
  }

  if (explicitTransport === 'page') {
    return 'page';
  }

  if (
    channel?.sourceType === 'file' ||
    /\.mp4($|\?)/i.test(url) ||
    /\.mp3($|\?)/i.test(url)
  ) {
    return 'file';
  }

  return 'hls';
}

function buildStreamProxyUrl(streamUrl) {
  const normalizedUrl = String(streamUrl || '').trim();
  if (!normalizedUrl) {
    return '';
  }

  return buildApiUrl(`/api/stream-proxy?url=${encodeURIComponent(normalizedUrl)}`);
}

function shouldUseStreamProxy(channel) {
  const transport = String(channel?.playbackTransport || '').trim().toLowerCase();
  const url = String(channel?.url || '').trim().toLowerCase();

  if (transport === 'proxy') {
    return true;
  }

  return url.startsWith('http://');
}

function buildPlaybackUrl(channel) {
  const directUrl = String(channel?.url || '').trim();
  if (!directUrl) {
    return '';
  }

  if (!shouldUseStreamProxy(channel)) {
    return directUrl;
  }

  return buildStreamProxyUrl(directUrl) || directUrl;
}

function buildLogoThumb(channel, index) {
  const itemName = channel?.name || `Canal ${index + 1}`;

  if (channel.logoImage) {
    return (
      <span className="channel-thumb">
        <img className="channel-thumb-image" src={channel.logoImage} alt={`Logo ${itemName}`} />
      </span>
    );
  }

  return <span className="channel-thumb">{channel.logo || itemName.slice(0, 2).toUpperCase()}</span>;
}

async function readJsonResponse(response, fallbackMessage) {
  const raw = await response.text();

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (_) {
    return {
      error: fallbackMessage || raw
    };
  }
}

function tgLink(baseUrl, message) {
  const raw = String(baseUrl || '').trim() || 'https://t.me/natalinoprr';

  try {
    const normalized = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
    const url = new URL(normalized);
    if (message) {
      url.searchParams.set('text', message);
    }
    return url.toString();
  } catch (_) {
    return raw;
  }
}

export default function App() {
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  if (currentPath.startsWith('/admin')) {
    return <AdminPanel />;
  }

  const telegramUrl = PUBLIC_RUNTIME_CONFIG.telegramUrl || 'https://t.me/natalinoprr';
    const isAndroidTv = useMemo(() => {
    const search =
      typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

    if (search?.get('tv') === '1') {
      return true;
    }

    if (typeof navigator === 'undefined') {
      return false;
    }

    const agent = `${navigator.userAgent} ${navigator.vendor || ''}`.toLowerCase();
    return (
      agent.includes('android tv') ||
      agent.includes('google tv') ||
      agent.includes('smart-tv') ||
      agent.includes('smarttv') ||
      agent.includes('aft') ||
      agent.includes('bravia') ||
      (agent.includes('android') && agent.includes('tv'))
    );
  }, []);

  const [accessIdInput, setAccessIdInput] = useState('');
  const [accessLookupState, setAccessLookupState] = useState('idle');
  const [accessLookupResult, setAccessLookupResult] = useState(null);
  const [accessLookupError, setAccessLookupError] = useState('');
  const [accessBootState, setAccessBootState] = useState(isAndroidTv ? 'booting' : 'idle');
  const [authorizedAccess, setAuthorizedAccess] = useState(null);
  const isPlaybackEnabled = isAndroidTv && authorizedAccess?.accessGranted === true;
  const filteredChannels = useMemo(() => {
    const collator = new Intl.Collator('pt-BR', {
      sensitivity: 'base',
      numeric: true,
    });

    return [...CHANNELS].sort((left, right) => collator.compare(left.name || '', right.name || ''));
  }, []);
  const initialChannelUrl = useMemo(() => {
    const cachedChannelUrl = readCachedChannelUrl();
    return cachedChannelUrl || filteredChannels[0]?.url || '';
  }, [filteredChannels]);

  const [guideDrawerOpen, setGuideDrawerOpen] = useState(false);
  const [selectedChannelUrl, setSelectedChannelUrl] = useState(initialChannelUrl);
  const [drawerChannelUrl, setDrawerChannelUrl] = useState(initialChannelUrl);
  const [status, setStatus] = useState('aguardando');
  const [statusError, setStatusError] = useState(false);
  const [embedUrl, setEmbedUrl] = useState('');
  const [playbackNonce, setPlaybackNonce] = useState(0);

  const playerRef = useRef(null);
  const guideStageRef = useRef(null);
  const channelListRef = useRef(null);
  const hlsRef = useRef(null);
  const expiryRefreshTimerRef = useRef(null);
  const cacheRevalidateTimerRef = useRef(null);
  const streamRefreshTimerRef = useRef(null);
  const recoveryRef = useRef({ network: 0, media: 0, fallbackTried: false });

  const selectedChannel = useMemo(() => {
    return (
      filteredChannels.find(channel => normalizeChannelUrl(channel.url) === normalizeChannelUrl(selectedChannelUrl)) ||
      filteredChannels[0] ||
      null
    );
  }, [filteredChannels, selectedChannelUrl]);

  const selectedIndex = useMemo(() => {
    return filteredChannels.findIndex(
      channel => normalizeChannelUrl(channel.url) === normalizeChannelUrl(selectedChannel?.url)
    );
  }, [filteredChannels, selectedChannel]);

  const isBrowserChannel = useMemo(() => {
    const mode = getChannelPlaybackMode(selectedChannel);
    return mode === 'browser' || mode === 'page';
  }, [selectedChannel]);

  const publicChannelLoop = useMemo(() => {
    return [...filteredChannels, ...filteredChannels];
  }, [filteredChannels]);

  function moveDrawerChannel(delta) {
    if (!filteredChannels.length) return;

    const currentIndex = filteredChannels.findIndex(
      channel => normalizeChannelUrl(channel.url) === normalizeChannelUrl(drawerChannelUrl)
    );
    const nextIndex =
      currentIndex >= 0
        ? (currentIndex + delta + filteredChannels.length) % filteredChannels.length
        : 0;

    setDrawerChannelUrl(filteredChannels[nextIndex].url);
  }

  function confirmDrawerChannel(channelUrl) {
    const normalizedUrl = normalizeChannelUrl(channelUrl);
    if (!normalizedUrl) {
      return;
    }

    if (normalizeChannelUrl(selectedChannelUrl) === normalizedUrl && !guideDrawerOpen) {
      return;
    }

    setSelectedChannelUrl(normalizedUrl);
    setDrawerChannelUrl(normalizedUrl);
    setGuideDrawerOpen(false);

    const selected = filteredChannels.find(channel => normalizeChannelUrl(channel.url) === normalizedUrl) || null;
    const playbackMode = getChannelPlaybackMode(selected);
    if (playbackMode === 'browser' || playbackMode === 'page') {
      window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
    }

    setPlaybackNonce(current => current + 1);
  }

  async function lookupAccessById(accessId, { persist = true } = {}) {
    const normalizedId = String(accessId || '')
      .trim()
      .toUpperCase();

    if (!normalizedId) {
      throw new Error('Informe um ID de acesso valido.');
    }

    const response = await fetch(buildApiUrl(`/api/access-status?id=${encodeURIComponent(normalizedId)}`), {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    });

    const contentType = String(response.headers.get('content-type') || '').toLowerCase();
    const rawBody = await response.text();
    let payload = null;

    if (rawBody) {
      if (contentType.includes('application/json')) {
        try {
          payload = JSON.parse(rawBody);
        } catch {
          payload = { error: rawBody };
        }
      } else if (rawBody.trim().startsWith('<')) {
        payload = {
          error: 'A API respondeu com HTML em vez de JSON. Verifique se a rota /api/access-status esta publicada e respondendo corretamente.'
        };
      } else {
        payload = { error: rawBody };
      }
    }

    if (!response.ok) {
      throw new Error(payload?.error || 'Nao foi possivel consultar o ID.');
    }

    if (!payload || payload.error) {
      throw new Error(payload?.error || 'ID invalido ou resposta invalida da API.');
    }

    if (typeof payload.accessGranted !== 'boolean') {
      throw new Error('ID invalido ou resposta invalida da API.');
    }

    if (persist) {
      writeCachedAccess(payload);
    }

      setAccessLookupResult(payload);
      setAccessLookupError('');
      setAuthorizedAccess(payload.accessGranted ? payload : null);
      return payload;
    }


  useEffect(() => {
    if (!filteredChannels.length) {
      return;
    }

    if (!filteredChannels.some(channel => normalizeChannelUrl(channel.url) === normalizeChannelUrl(selectedChannelUrl))) {
      setSelectedChannelUrl(filteredChannels[0].url);
    }

    if (!filteredChannels.some(channel => normalizeChannelUrl(channel.url) === normalizeChannelUrl(drawerChannelUrl))) {
      setDrawerChannelUrl(filteredChannels[0].url);
    }
  }, [drawerChannelUrl, filteredChannels, selectedChannelUrl]);

  useEffect(() => {
    if (!isPlaybackEnabled) {
      return;
    }

    const activeChannelUrl = selectedChannel?.url || selectedChannelUrl;
    if (activeChannelUrl) {
      writeCachedChannelUrl(activeChannelUrl);
    }
  }, [isPlaybackEnabled, selectedChannel?.url, selectedChannelUrl]);

  useEffect(() => {
    if (!isAndroidTv) {
      return;
    }

    if (cacheRevalidateTimerRef.current) {
      window.clearTimeout(cacheRevalidateTimerRef.current);
      cacheRevalidateTimerRef.current = null;
    }

    const cachedAccess = readCachedAccess();

    if (!cachedAccess) {
      setAccessBootState('ready');
      return;
    }

    setAccessIdInput(cachedAccess.accessId || '');
    setAccessLookupResult(cachedAccess);

    if (cachedAccess.accessGranted && isCachedAccessExpired(cachedAccess)) {
      clearCachedAccess();
      setAccessLookupState('error');
      setAccessLookupError('Seu acesso venceu.');
      setAccessLookupResult(null);
      setAuthorizedAccess(null);
      setAccessBootState('ready');
      return;
    }

    const cacheAge = Date.now() - Number(cachedAccess.checkedAt || 0);
    const cacheTtl = getCachedAccessTtl(cachedAccess);
    const isCacheFresh = cacheAge <= cacheTtl;

      if (cachedAccess.accessGranted) {
        setAuthorizedAccess(cachedAccess);
        setAccessLookupState('success');
      } else {
        setAuthorizedAccess(null);
        setAccessLookupState('success');
      }

    setAccessBootState('ready');

    if (isCacheFresh) {
      return;
    }

      const delayMs = cachedAccess.accessGranted ? 2 * 60 * 1000 : 5 * 60 * 1000;
      cacheRevalidateTimerRef.current = window.setTimeout(() => {
        lookupAccessById(cachedAccess.accessId)
          .then(result => {
            if (!result.accessGranted) {
              clearCachedAccess();
              setAuthorizedAccess(null);
              setAccessLookupResult(result);
              setAccessLookupState('success');
            setAccessLookupError('');
          }
        })
        .catch(error => {
          if (cachedAccess.accessGranted) {
            setAccessLookupError(error.message || 'Falha ao validar o ID salvo.');
          }
        });
    }, delayMs);

      return () => {
        if (cacheRevalidateTimerRef.current) {
          window.clearTimeout(cacheRevalidateTimerRef.current);
          cacheRevalidateTimerRef.current = null;
        }
      };
  }, [isAndroidTv]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    if (expiryRefreshTimerRef.current) {
      window.clearTimeout(expiryRefreshTimerRef.current);
      expiryRefreshTimerRef.current = null;
    }

    if (!isPlaybackEnabled || !authorizedAccess?.expiresAt) {
      return undefined;
    }

    const refreshDelay = getExpiryRefreshDelay(authorizedAccess.expiresAt);
    if (!Number.isFinite(refreshDelay) || refreshDelay <= 0) {
      return undefined;
    }

    expiryRefreshTimerRef.current = window.setTimeout(() => {
      lookupAccessById(authorizedAccess.accessId, { persist: true })
        .then(result => {
          if (!result.accessGranted) {
            clearCachedAccess();
            setAccessLookupState('error');
            setAccessLookupResult(null);
            setAccessLookupError(result.warningMessage || 'Seu acesso expirou.');
            setAuthorizedAccess(null);
          }
        })
        .catch(error => {
          clearCachedAccess();
          setAccessLookupState('error');
          setAccessLookupResult(null);
          setAccessLookupError(error.message || 'Falha ao revalidar o ID.');
          setAuthorizedAccess(null);
        });
    }, refreshDelay);

    return () => {
      if (expiryRefreshTimerRef.current) {
        window.clearTimeout(expiryRefreshTimerRef.current);
        expiryRefreshTimerRef.current = null;
      }
    };
  }, [authorizedAccess, isPlaybackEnabled]);

  useEffect(() => {
    if (isPlaybackEnabled || filteredChannels.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setSelectedChannelUrl(current => {
        const currentIndex = filteredChannels.findIndex(channel => channel.url === current);
        const nextIndex =
          currentIndex >= 0 ? (currentIndex + 1) % filteredChannels.length : 0;
        return filteredChannels[nextIndex].url;
      });
    }, 4500);

    return () => window.clearInterval(timer);
  }, [filteredChannels, isPlaybackEnabled]);

    useEffect(() => {
      if (!guideDrawerOpen || !channelListRef.current) {
        return;
      }

      const activeItem = channelListRef.current.querySelector('.guide-channel-item.active');
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
    }, [drawerChannelUrl, guideDrawerOpen]);

  useEffect(() => {
    const onKeyDown = event => {
      if (!isPlaybackEnabled || !filteredChannels.length) {
        return;
      }

      if ([' ', 'Spacebar'].includes(event.key)) {
        event.preventDefault();
      }

      if (guideDrawerOpen) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          moveDrawerChannel(1);
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          moveDrawerChannel(-1);
        } else if (event.key === 'Enter') {
          event.preventDefault();
          confirmDrawerChannel(drawerChannelUrl);
        } else if (event.key === 'ArrowLeft' || event.key === 'Escape' || event.key === 'Backspace') {
          event.preventDefault();
          setDrawerChannelUrl(selectedChannelUrl);
          setGuideDrawerOpen(false);
        }

        return;
      }

      if (event.key === 'ArrowRight' || event.key === 'Enter') {
        event.preventDefault();
        setDrawerChannelUrl(selectedChannelUrl);
        setGuideDrawerOpen(true);
      } else if (
        event.key === 'ArrowUp' ||
        event.key === 'ArrowDown' ||
        event.key === 'ArrowLeft' ||
        event.key === ' '
      ) {
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [drawerChannelUrl, filteredChannels, guideDrawerOpen, isPlaybackEnabled, selectedChannelUrl]);

  useEffect(() => {
    const player = playerRef.current;

    if (!isPlaybackEnabled) {
      setEmbedUrl('');
      setStatusError(false);
      setStatus('Disponivel apenas no app Android TV.');

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (player) {
        player.pause();
        player.removeAttribute('src');
        player.load();
      }

      return;
    }

    if (!player || !selectedChannel?.url) {
      return;
    }

    const playbackUrl = buildPlaybackUrl(selectedChannel);

    const setPlayerStatus = (text, isError = false) => {
      setStatus(text);
      setStatusError(isError);
    };

    const cleanupHls = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };

    const playWithNativeSource = (message, sourceUrl = playbackUrl) => {
      cleanupHls();
      recoveryRef.current.fallbackTried = true;
      player.pause();
      player.src = sourceUrl;
      player.load();
      setPlayerStatus(message);
      player.play().catch(() => {
        setPlayerStatus(
          'Nao foi possivel reproduzir o stream. A fonte pode estar offline ou bloqueada.',
          true
        );
      });
    };

    setEmbedUrl('');
    recoveryRef.current = { network: 0, media: 0, fallbackTried: false };
    cleanupHls();
    player.pause();
    player.removeAttribute('src');
    player.load();
    setPlayerStatus('Conectando transmissao...');

  if (selectedChannel.unavailable) {
    setPlayerStatus('Canal indisponivel no momento.', true);
    return;
  }

  const playbackMode = getChannelPlaybackMode(selectedChannel);

  if (playbackMode === 'embed') {
    setEmbedUrl(buildEmbedUrl(selectedChannel));
    setPlayerStatus('Embed carregado.');
    return;
  }

  if (playbackMode === 'browser' || playbackMode === 'page') {
    setEmbedUrl(String(selectedChannel.url || '').trim());
    setPlayerStatus('Browser carregado.');
    return;
  }

  if (playbackMode === 'file') {
    playWithNativeSource('Abrindo midia direta...');
    return;
  }

    const canPlayNativeHls =
      typeof player.canPlayType === 'function' &&
      (player.canPlayType('application/vnd.apple.mpegurl') ||
        player.canPlayType('application/x-mpegURL'));

    if (playbackMode === 'hls' && canPlayNativeHls) {
      playWithNativeSource('Abrindo stream diretamente...');
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false
      });

      hlsRef.current = hls;
      hls.loadSource(playbackUrl);
      hls.attachMedia(player);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        recoveryRef.current.network = 0;
        recoveryRef.current.media = 0;
        setPlayerStatus('Transmissao carregada.');
        player.play().catch(() => null);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal) {
          return;
        }

        if (data.type === Hls.ErrorTypes.NETWORK_ERROR && recoveryRef.current.network < 2) {
          recoveryRef.current.network += 1;
          setPlayerStatus(`Erro de rede. Tentando novamente (${recoveryRef.current.network}/2)...`);
          hls.startLoad();
          return;
        }

        if (data.type === Hls.ErrorTypes.MEDIA_ERROR && recoveryRef.current.media < 1) {
          recoveryRef.current.media += 1;
          setPlayerStatus('Erro de midia. Tentando recuperar...');
          hls.recoverMediaError();
          return;
        }

        if (!recoveryRef.current.fallbackTried) {
          playWithNativeSource('Tentando fallback nativo...');
          return;
        }

        setPlayerStatus(`Erro HLS: ${data.details || data.type}`, true);
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }

    playWithNativeSource('Abrindo stream com player nativo...');

    return () => {
      cleanupHls();
    };
  }, [isPlaybackEnabled, playbackNonce, selectedChannel]);

  useEffect(() => {
    if (streamRefreshTimerRef.current) {
      window.clearInterval(streamRefreshTimerRef.current);
      streamRefreshTimerRef.current = null;
    }

    if (!isPlaybackEnabled || !selectedChannel?.url) {
      return undefined;
    }

    const refreshIntervalMs = 10 * 60 * 1000;
    streamRefreshTimerRef.current = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }

      setPlaybackNonce(current => current + 1);
    }, refreshIntervalMs);

    return () => {
      if (streamRefreshTimerRef.current) {
        window.clearInterval(streamRefreshTimerRef.current);
        streamRefreshTimerRef.current = null;
      }
    };
  }, [isPlaybackEnabled, selectedChannel?.url]);

  async function handleAccessLookup(event) {
    event.preventDefault();

    const normalizedId = accessIdInput.trim().toUpperCase();
    if (!normalizedId) {
      setAccessLookupState('error');
      setAccessLookupResult(null);
      setAccessLookupError('Informe um ID de acesso valido.');
      return;
    }

    setAccessLookupState('loading');
    setAccessLookupResult(null);
    setAccessLookupError('');

    try {
      const payload = await lookupAccessById(normalizedId);
      setAccessLookupState('success');
    } catch (error) {
      setAccessLookupState('error');
      setAccessLookupResult(null);
      setAuthorizedAccess(null);
      setAccessLookupError(error.message || 'Falha ao consultar o ID.');
    }
  }

    return (
    <div className={`app-shell${isAndroidTv ? ' tv-mode' : ''}${!isPlaybackEnabled ? ' promo-mode' : ''}`}>
      {!isPlaybackEnabled ? (
        !isAndroidTv ? (
        <>
          <header className="promo-landing">
            <div className="promo-landing-topbar">
              <span className="promo-brand">App TV Android</span>
              <a
                className="secondary-btn promo-admin-trigger"
                href="/admin"
              >
                Admin
              </a>
            </div>
            <div className="promo-copy promo-copy-public">
              <span className="section-kicker">App TV Android</span>
              <h1>TV ao vivo no Android TV com acesso liberado por assinatura.</h1>
              <p>
                Este site apresenta o aplicativo, os canais disponiveis e os planos de acesso. A reproducao fica liberada somente no app Android TV, com interface adaptada para controle remoto e uso em tela cheia.
              </p>
              <div className="promo-cta-row">
                <a className="primary-btn" href="#planos">
                  Ver planos
                </a>
                <a className="secondary-btn" href="#como-funciona">Como funciona</a>
              </div>
              <ul className="promo-summary-list">
                <li>Uso exclusivo no app Android TV</li>
                <li>Canais organizados para controle remoto</li>
                <li>Planos mensal, trimestral e anual</li>
              </ul>
            </div>
          </header>

          <main className="content">
            <section className="shelf">
              <div className="section-head" id="como-funciona">
                <div>
                  <span className="section-kicker">Como funciona</span>
                  <h2>Assine aqui e use no aplicativo</h2>
                </div>
                <p>O fluxo e simples: escolha um plano, libere seu acesso e use o aplicativo na Android TV para assistir aos canais ao vivo.</p>
              </div>

              <div className="promo-info-grid">
                <article className="promo-info-card">
                  <strong>1. Escolha seu periodo</strong>
                  <p>Voce pode contratar acesso mensal, trimestral ou anual, de acordo com o tempo que pretende usar o aplicativo.</p>
                </article>
                <article className="promo-info-card">
                  <strong>2. Ative o app</strong>
                  <p>Depois da confirmacao da assinatura, o acesso fica liberado para uso dentro do aplicativo Android TV.</p>
                </article>
                <article className="promo-info-card">
                  <strong>3. Assista na TV</strong>
                  <p>No aplicativo, a navegacao e feita pelo controle remoto, com troca de canais rapida, gaveta lateral e tela cheia.</p>
                </article>
              </div>

              <div className="section-head">
                <div>
                  <span className="section-kicker">Canais disponiveis</span>
                  <h2>Conheca alguns dos canais incluidos no aplicativo</h2>
                </div>
                <p>Esta faixa mostra parte da grade disponivel para quem acessa pelo app Android TV.</p>
              </div>

              <div className="promo-channel-marquee" aria-label="Canais do aplicativo">
                <div className="promo-channel-track">
                  {publicChannelLoop.map((channel, index) => (
                    <article
                      key={`${channel.name}-${index}`}
                      className={`promo-channel-badge${channel.url === selectedChannel?.url ? ' active' : ''}`}
                    >
                      {buildLogoThumb(channel, index)}
                      <div className="promo-channel-copy">
                        <strong>{channel.name}</strong>
                        <span>{channel.category || 'Canal'}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="section-head plans-head" id="planos">
                <div>
                  <span className="section-kicker">Planos</span>
                  <h2>Escolha a assinatura</h2>
                </div>
                <p>Todos os planos liberam o acesso ao aplicativo Android TV. O plano trimestral oferece o melhor custo entre valor e periodo.</p>
              </div>

              <ul className="plans-grid">
                {PUBLIC_PLANS.map(plan => (
                  <li key={plan.id}>
                    <article className={`plan-card${plan.id === 'trimestral' ? ' featured' : ''}`}>
                      <span className="plan-badge">{plan.id === 'trimestral' ? 'Mais vendido' : 'Android TV'}</span>
                      <strong>{plan.name}</strong>
                      <div className="plan-price">
                        <span>{plan.price}</span>
                        <small>{plan.period}</small>
                      </div>
                      <p>{plan.description}</p>
                      <a
                        className="primary-btn plan-btn"
                        href={tgLink(telegramUrl, `Quero assinar o ${plan.name} do App TV Android.`)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Falar no Telegram
                      </a>
                    </article>
                  </li>
                ))}
              </ul>

              <div className="section-head" id="consulta-acesso">
                <div>
                  <span className="section-kicker">Consulta de acesso</span>
                  <h2>Verifique seu ID</h2>
                </div>
                <p>Consulte aqui se o acesso esta ativo, pendente ou bloqueado.</p>
              </div>

              <section className="access-check-panel">
                <form className="access-check-form" onSubmit={handleAccessLookup}>
                  <label className="access-check-field">
                    <span>ID de acesso</span>
                    <input
                      type="text"
                      value={accessIdInput}
                      onChange={event => setAccessIdInput(event.target.value.toUpperCase())}
                      placeholder="Ex.: ATV-0001"
                      autoComplete="off"
                    />
                  </label>

                  <button type="submit" className="primary-btn access-check-btn">
                    {accessLookupState === 'loading' ? 'Consultando...' : 'Verificar ID'}
                  </button>
                </form>

                <div className="access-check-result">
                  {accessLookupState === 'idle' ? (
                    <div className="access-result-card neutral">
                      <strong>Nenhuma consulta feita</strong>
                      <p>Digite o ID de acesso para consultar a situacao atual.</p>
                    </div>
                  ) : null}

                  {accessLookupState === 'error' ? (
                    <div className="access-result-card blocked">
                      <strong>Falha na consulta</strong>
                      <p>{accessLookupError}</p>
                    </div>
                  ) : null}

                  {accessLookupState === 'success' && accessLookupResult ? (
                    <div className={`access-result-card ${accessLookupResult.warning ? 'pending' : accessLookupResult.accessGranted ? 'active' : 'blocked'}`}>
                      <strong>{accessLookupResult.warning ? 'Vencimento proximo' : accessLookupResult.accessGranted ? 'Liberado' : 'Bloqueado'}</strong>
                      <p>{accessLookupResult.warning ? accessLookupResult.warningMessage : accessLookupResult.message}</p>
                      <dl className="access-result-grid">
                        <div>
                          <dt>ID</dt>
                          <dd>{accessLookupResult.accessId}</dd>
                        </div>
                        <div>
                          <dt>Plano</dt>
                          <dd>{accessLookupResult.planName}</dd>
                        </div>
                        <div>
                          <dt>Pagamento</dt>
                          <dd>{accessLookupResult.paymentLabel}</dd>
                        </div>
                        <div>
                          <dt>Validade</dt>
                          <dd>{accessLookupResult.expiresAtLabel}</dd>
                        </div>
                      </dl>
                    </div>
                  ) : null}
                </div>
              </section>

              <footer className="promo-footer">
                <div>
                  <strong>App TV Android</strong>
                  <p>Site oficial de apresentacao e assinatura do App TV Android. A exibicao dos canais acontece exclusivamente dentro do aplicativo.</p>
                </div>
                <div className="promo-footer-links">
                  <span>Mensal R$ 20</span>
                  <span>Trimestral R$ 45</span>
                  <span>Anual R$ 120</span>
                </div>
              </footer>
            </section>

          </main>
        </>
        ) : (
          <main className="tv-access-screen">
            <section className="tv-access-card">
              <span className="section-kicker">Ativacao do app</span>
              <h1>Informe seu ID de assinatura</h1>
              <p>
                Digite seu ID e toque em Entrar. Se ele estiver ativo, o app libera os canais automaticamente. Se nao estiver, mostramos a mensagem de bloqueio.
              </p>

              <form className="tv-access-form" onSubmit={handleAccessLookup}>
                <label className="tv-access-field">
                  <span>ID de acesso</span>
                  <input
                    type="text"
                    value={accessIdInput}
                    onChange={event => setAccessIdInput(event.target.value.toUpperCase())}
                    placeholder="ATA-0001"
                    autoComplete="off"
                  />
                </label>

                <div className="tv-access-actions">
                  <button type="submit" className="primary-btn">
                    {accessLookupState === 'loading' || accessBootState === 'booting'
                      ? 'Entrando...'
                      : 'Entrar'}
                  </button>
                </div>
              </form>

              <div className="tv-access-hint">
                <span>Sem ID?</span>
                <a
                  href={telegramUrl}
                  target={telegramUrl.startsWith('http') ? '_blank' : undefined}
                  rel={telegramUrl.startsWith('http') ? 'noreferrer' : undefined}
                >
                  Falar no Telegram
                </a>
              </div>

              {accessBootState === 'booting' ? (
                <div className="tv-access-result neutral">
                  <strong>Sincronizando acesso salvo</strong>
                  <p>O app esta conferindo o ultimo ID armazenado antes de liberar os canais.</p>
                </div>
              ) : null}

              {accessLookupState === 'error' ? (
                <div className="tv-access-result blocked">
                  <strong>Falha na validacao</strong>
                  <p>{accessLookupError}</p>
                </div>
              ) : null}

              {accessLookupState === 'success' && accessLookupResult ? (
                <div className={`tv-access-result ${accessLookupResult.warning ? 'pending' : accessLookupResult.accessGranted ? 'active' : 'blocked'}`}>
                  <strong>{accessLookupResult.warning ? 'Vencimento proximo' : accessLookupResult.accessGranted ? 'Liberado' : 'Bloqueado'}</strong>
                  <p>{accessLookupResult.warning ? accessLookupResult.warningMessage : accessLookupResult.message}</p>
                  <dl className="tv-access-meta">
                    <div>
                      <dt>ID</dt>
                      <dd>{accessLookupResult.accessId}</dd>
                    </div>
                    <div>
                      <dt>Plano</dt>
                      <dd>{accessLookupResult.planName}</dd>
                    </div>
                    <div>
                      <dt>Pagamento</dt>
                      <dd>{accessLookupResult.paymentLabel}</dd>
                    </div>
                    <div>
                      <dt>Validade</dt>
                      <dd>{accessLookupResult.expiresAtLabel}</dd>
                    </div>
                  </dl>
                </div>
              ) : null}
            </section>
          </main>
        )
        ) : (
          <header className="guide-hero guide-hero-fullscreen">
              <div className="guide-stage" ref={guideStageRef}>
                <button
                  type="button"
                  className={`guide-handle${guideDrawerOpen ? ' open' : ''}`}
                  onClick={() => {
                    if (guideDrawerOpen) {
                  setDrawerChannelUrl(selectedChannelUrl);
                  setGuideDrawerOpen(false);
                  return;
                }

                setDrawerChannelUrl(selectedChannelUrl);
                setGuideDrawerOpen(true);
              }}
              aria-label={guideDrawerOpen ? 'Fechar canais' : 'Abrir canais'}
              title={guideDrawerOpen ? 'Fechar canais' : 'Abrir canais'}
            >
              {guideDrawerOpen ? '<' : '>'}
            </button>

            <div className={`guide-stage-frame${guideDrawerOpen ? ' open' : ''}`}>
              <aside className={`guide-sidebar${guideDrawerOpen ? ' open' : ''}`}>
                <ul ref={channelListRef} className="guide-channel-list">
                  {filteredChannels.map((channel, index) => {
                    const currentDrawerUrl = guideDrawerOpen ? drawerChannelUrl : selectedChannel?.url;
                    const isActive =
                      normalizeChannelUrl(channel.url) === normalizeChannelUrl(currentDrawerUrl);

                    return (
                      <li key={`${channel.name}-${channel.url}`}>
                        <button
                          type="button"
                          className={`guide-channel-item${isActive ? ' active' : ''}`}
                          onFocus={() => {
                            setDrawerChannelUrl(channel.url);
                          }}
                          onKeyDown={event => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              confirmDrawerChannel(channel.url);
                            }
                          }}
                          onClick={() => {
                            confirmDrawerChannel(channel.url);
                          }}
                          aria-label={channel.name}
                          title={channel.name}
                        >
                          <span className="guide-channel-number">{channel.number || index + 1}</span>
                          {channel.logoImage ? (
                            <img
                              className="guide-channel-logo"
                              src={channel.logoImage}
                              alt={`Logo ${channel.name}`}
                            />
                          ) : (
                            <span className="guide-channel-fallback">{channel.logo || channel.name?.slice(0, 2)}</span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </aside>

              <div className={`guide-player-shell${isBrowserChannel ? ' browser-mode' : ''}`}>
                {!embedUrl ? (
                  <video
                    key={`video:${selectedChannel?.url || selectedChannelUrl}:${playbackNonce}`}
                    ref={playerRef}
                    id="tvPlayer"
                    autoPlay
                    playsInline
                    crossOrigin="anonymous"
                    controls={false}
                    disablePictureInPicture
                    controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
                    tabIndex={-1}
                  />
                ) : (
                  <iframe
                    key={`embed:${embedUrl}:${playbackNonce}`}
                    id="tvEmbed"
                    title="Player incorporado"
                    src={embedUrl}
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    tabIndex={-1}
                  />
                )}
                <div className="guide-overlay" />
                {authorizedAccess?.warning ? (
                  <div className="guide-expiry-banner">
                    <strong>Vencimento proximo</strong>
                    <span>{authorizedAccess.warningMessage}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>
      )}

    </div>
  );
}




