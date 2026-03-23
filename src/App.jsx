import { useEffect, useMemo, useRef, useState } from 'react';
import Hls from 'hls.js';
import { CHANNELS } from './channels';
import { PUBLIC_RUNTIME_CONFIG } from './runtime-config';
import { PUBLIC_PLANS } from '../lib/plans.js';

const ACCESS_CACHE_KEY = 'app-tv-access-cache-v1';
const ACTIVE_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const INACTIVE_CACHE_TTL_MS = 15 * 60 * 1000;
const ACCESS_STATUS_LABELS = {
  active: 'Acesso ativo',
  pending: 'Pagamento pendente',
  blocked: 'Acesso bloqueado'
};

function getAccessCacheTtl(status) {
  return status === 'active' ? ACTIVE_CACHE_TTL_MS : INACTIVE_CACHE_TTL_MS;
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
    if (!parsed?.accessId || !parsed?.status || !parsed?.checkedAt) {
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

function buildEmbedUrl(channel) {
  const url = channel?.url || '';

  if (channel?.sourceType !== 'embed') {
    return url;
  }

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

function isDirectMediaSource(channel) {
  if (channel?.sourceType === 'file') {
    return true;
  }

  const url = channel?.url || '';
  return /\.mp4($|\?)/i.test(url) || /\.mp3($|\?)/i.test(url);
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

function loadMercadoPagoSdk() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Mercado Pago indisponivel nesta sessao.'));
  }

  if (window.MercadoPago) {
    return Promise.resolve(window.MercadoPago);
  }

  if (window.__mercadoPagoSdkPromise) {
    return window.__mercadoPagoSdkPromise;
  }

  window.__mercadoPagoSdkPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-mercadopago-sdk="true"]');

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.MercadoPago));
      existingScript.addEventListener('error', () => {
        reject(new Error('Nao foi possivel carregar o checkout do Mercado Pago.'));
      });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    script.dataset.mercadopagoSdk = 'true';
    script.onload = () => resolve(window.MercadoPago);
    script.onerror = () => reject(new Error('Nao foi possivel carregar o checkout do Mercado Pago.'));
    document.head.appendChild(script);
  });

  return window.__mercadoPagoSdkPromise;
}

export default function App() {
  const telegramUrl = PUBLIC_RUNTIME_CONFIG.telegramUrl || '#planos';
  const apkDownloadUrl = PUBLIC_RUNTIME_CONFIG.apkDownloadUrl;
  const mercadoPagoPublicKey = PUBLIC_RUNTIME_CONFIG.mercadoPagoPublicKey;
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
  const isPlaybackEnabled = isAndroidTv && authorizedAccess?.status === 'active';
  const filteredChannels = useMemo(() => CHANNELS, []);

  const [guideDrawerOpen, setGuideDrawerOpen] = useState(false);
  const [selectedChannelUrl, setSelectedChannelUrl] = useState(CHANNELS[0]?.url || '');
  const [drawerChannelUrl, setDrawerChannelUrl] = useState(CHANNELS[0]?.url || '');
  const [drawerHandleTop, setDrawerHandleTop] = useState(null);
  const [status, setStatus] = useState('aguardando');
  const [statusError, setStatusError] = useState(false);
  const [embedUrl, setEmbedUrl] = useState('');
  const [playbackNonce, setPlaybackNonce] = useState(0);
  const [checkoutError, setCheckoutError] = useState('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentCheckout, setPaymentCheckout] = useState(null);
  const [paymentError, setPaymentError] = useState('');
  const [paymentResult, setPaymentResult] = useState(null);

  const playerRef = useRef(null);
  const guideStageRef = useRef(null);
  const channelListRef = useRef(null);
  const paymentBrickRef = useRef(null);
  const paymentBrickControllerRef = useRef(null);
  const hlsRef = useRef(null);
  const recoveryRef = useRef({ network: 0, media: 0, fallbackTried: false });

  const selectedChannel = useMemo(() => {
    return (
      filteredChannels.find(channel => channel.url === selectedChannelUrl) ||
      filteredChannels[0] ||
      null
    );
  }, [filteredChannels, selectedChannelUrl]);

  const selectedIndex = useMemo(() => {
    return filteredChannels.findIndex(channel => channel.url === selectedChannel?.url);
  }, [filteredChannels, selectedChannel]);

  const publicChannelLoop = useMemo(() => {
    return [...filteredChannels, ...filteredChannels];
  }, [filteredChannels]);

  function moveDrawerChannel(delta) {
    if (!filteredChannels.length) return;

    const currentIndex = filteredChannels.findIndex(channel => channel.url === drawerChannelUrl);
    const nextIndex =
      currentIndex >= 0
        ? (currentIndex + delta + filteredChannels.length) % filteredChannels.length
        : 0;

    setDrawerChannelUrl(filteredChannels[nextIndex].url);
  }

  function createCheckoutSessionId() {
    if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
      return `CHK-${window.crypto.randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`;
    }

    const randomPart = Math.random().toString(36).slice(2, 10).toUpperCase();
    return `CHK-${Date.now().toString(36).toUpperCase()}${randomPart}`;
  }

  function closePaymentModal() {
    try {
      paymentBrickControllerRef.current?.unmount?.();
    } catch (_) {
      // no-op
    }

    paymentBrickControllerRef.current = null;
    setPaymentModalOpen(false);
    setPaymentLoading(false);
    setPaymentCheckout(null);
    setPaymentError('');
    setPaymentResult(null);
  }

  async function startPaymentFlow(plan) {
    setCheckoutError('');
    setPaymentLoading(true);
    setPaymentError('');
    setPaymentResult(null);

    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          planId: plan.id
        })
      });

      const payload = await readJsonResponse(response, 'Falha ao iniciar o pagamento.');

      if (!response.ok) {
        throw new Error(payload?.error || `HTTP ${response.status}`);
      }

      if (!payload?.preferenceId) {
        throw new Error('Checkout sem preferenceId.');
      }

      setPaymentCheckout({
        checkoutSessionId: payload.checkoutSessionId || createCheckoutSessionId(),
        preferenceId: payload.preferenceId,
        publicKey: payload.publicKey || mercadoPagoPublicKey,
        amount: Number(payload.amount ?? plan.price),
        title: payload.title || plan.mercadopagoTitle,
        planId: payload.planId || plan.id
      });

      setPaymentModalOpen(true);
    } catch (error) {
      setCheckoutError(error?.message || 'Falha ao iniciar o pagamento.');
      setPaymentLoading(false);
      setPaymentModalOpen(false);
    }
  }

  async function lookupAccessById(accessId, { persist = true } = {}) {
    const normalizedId = String(accessId || '')
      .trim()
      .toUpperCase();

    if (!normalizedId) {
      throw new Error('Informe um ID de acesso valido.');
    }

    const response = await fetch(`/api/access-status?id=${encodeURIComponent(normalizedId)}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error || 'Nao foi possivel consultar o ID.');
    }

    if (persist) {
      writeCachedAccess(payload);
    }

    setAccessLookupResult(payload);
    setAccessLookupError('');
    setAuthorizedAccess(payload.status === 'active' ? payload : null);
    return payload;
  }

  useEffect(() => {
    if (!filteredChannels.length) {
      return;
    }

    if (!filteredChannels.some(channel => channel.url === selectedChannelUrl)) {
      setSelectedChannelUrl(filteredChannels[0].url);
    }

    if (!filteredChannels.some(channel => channel.url === drawerChannelUrl)) {
      setDrawerChannelUrl(filteredChannels[0].url);
    }
  }, [drawerChannelUrl, filteredChannels, selectedChannelUrl]);

  useEffect(() => {
    if (!isAndroidTv) {
      return;
    }

    const cachedAccess = readCachedAccess();

    if (!cachedAccess) {
      setAccessBootState('ready');
      return;
    }

    setAccessIdInput(cachedAccess.accessId || '');
    setAccessLookupResult(cachedAccess);

    const cacheAge = Date.now() - Number(cachedAccess.checkedAt || 0);
    const cacheTtl = getAccessCacheTtl(cachedAccess.status);
    const isCacheFresh = cacheAge <= cacheTtl;

    if (cachedAccess.status === 'active' && isCacheFresh) {
      setAuthorizedAccess(cachedAccess);
      setAccessLookupState('success');
      setAccessBootState('ready');
      return;
    }

    lookupAccessById(cachedAccess.accessId)
      .then(result => {
        setAccessLookupState('success');
        if (result.status !== 'active') {
          setAuthorizedAccess(null);
        }
      })
      .catch(error => {
        if (cachedAccess.status === 'active' && isCacheFresh) {
          setAuthorizedAccess(cachedAccess);
          setAccessLookupState('success');
        } else {
          setAccessLookupState('error');
          setAccessLookupError(error.message || 'Falha ao validar o ID salvo.');
          setAuthorizedAccess(null);
        }
      })
      .finally(() => {
        setAccessBootState('ready');
      });
  }, [isAndroidTv]);

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
      activeItem.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [drawerChannelUrl, guideDrawerOpen]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    if (!paymentModalOpen) {
      document.body.style.overflow = '';
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [paymentModalOpen]);

  useEffect(() => {
    if (!paymentModalOpen || !paymentCheckout || !paymentBrickRef.current) {
      return undefined;
    }

    let cancelled = false;

    const mountBrick = async () => {
      try {
        await loadMercadoPagoSdk();

        if (cancelled) {
          return;
        }

        if (!window.MercadoPago) {
          throw new Error('Checkout do Mercado Pago indisponivel.');
        }

        if (!paymentCheckout.publicKey) {
          throw new Error('Chave publica do Mercado Pago nao definida.');
        }

        if (paymentBrickControllerRef.current?.unmount) {
          paymentBrickControllerRef.current.unmount();
        }

        if (paymentBrickRef.current) {
          paymentBrickRef.current.innerHTML = '';
        }

        const mp = new window.MercadoPago(paymentCheckout.publicKey, {
          locale: 'pt-BR'
        });

        const bricksBuilder = mp.bricks();

        paymentBrickControllerRef.current = await bricksBuilder.create('payment', 'paymentBrick_container', {
          initialization: {
            amount: Number(paymentCheckout.amount),
            preferenceId: paymentCheckout.preferenceId
          },
          customization: {
            paymentMethods: {
              ticket: 'all',
              bankTransfer: 'all',
              creditCard: 'all',
              debitCard: 'all',
              prepaidCard: 'all',
              mercadoPago: 'all'
            }
          },
          callbacks: {
            onReady: () => {
              setPaymentLoading(false);
            },
            onSubmit: ({ formData }) => {
              return new Promise((resolve, reject) => {
                setPaymentLoading(true);
                setPaymentError('');

                fetch('/api/process-payment', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                  },
                  body: JSON.stringify({
                    checkoutSessionId: paymentCheckout.checkoutSessionId,
                    preferenceId: paymentCheckout.preferenceId,
                    planId: paymentCheckout.planId,
                    formData
                  })
                })
                  .then(async response => {
                    const payload = await readJsonResponse(response, 'Falha ao processar o pagamento.');

                    if (!response.ok) {
                      throw new Error(payload?.error || `HTTP ${response.status}`);
                    }

                    setPaymentResult(payload);
                    setPaymentLoading(false);
                    resolve();
                  })
                  .catch(error => {
                    setPaymentLoading(false);
                    setPaymentError(error?.message || 'Falha ao processar o pagamento.');
                    reject(error);
                  });
              });
            },
            onError: error => {
              setPaymentLoading(false);
              setPaymentError(error?.message || 'Nao foi possivel carregar a tela de pagamento.');
            }
          }
        });
      } catch (error) {
        if (!cancelled) {
          setPaymentLoading(false);
          setPaymentError(error?.message || 'Nao foi possivel abrir o checkout.');
        }
      }
    };

    mountBrick();

    return () => {
      cancelled = true;

      try {
        paymentBrickControllerRef.current?.unmount?.();
      } catch (_) {
        // no-op
      }

      paymentBrickControllerRef.current = null;

      if (paymentBrickRef.current) {
        paymentBrickRef.current.innerHTML = '';
      }
    };
  }, [paymentCheckout, paymentModalOpen]);

  useEffect(() => {
    if (!guideDrawerOpen || !guideStageRef.current || !channelListRef.current) {
      setDrawerHandleTop(null);
      return;
    }

    const updateDrawerHandlePosition = () => {
      const stageRect = guideStageRef.current?.getBoundingClientRect();
      const activeItem = channelListRef.current?.querySelector('.guide-channel-item.active');
      const itemRect = activeItem?.getBoundingClientRect();

      if (!stageRect || !itemRect) {
        return;
      }

      setDrawerHandleTop(itemRect.top + itemRect.height / 2 - stageRect.top);
    };

    const frame = requestAnimationFrame(updateDrawerHandlePosition);
    const list = channelListRef.current;

    list.addEventListener('scroll', updateDrawerHandlePosition, { passive: true });
    window.addEventListener('resize', updateDrawerHandlePosition);

    return () => {
      cancelAnimationFrame(frame);
      list.removeEventListener('scroll', updateDrawerHandlePosition);
      window.removeEventListener('resize', updateDrawerHandlePosition);
    };
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
          setSelectedChannelUrl(drawerChannelUrl);
          setGuideDrawerOpen(false);
          setPlaybackNonce(current => current + 1);
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

    const playWithNativeSource = message => {
      cleanupHls();
      recoveryRef.current.fallbackTried = true;
      player.pause();
      player.src = selectedChannel.url;
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

    if (selectedChannel.sourceType === 'embed') {
      setEmbedUrl(buildEmbedUrl(selectedChannel));
      setPlayerStatus('Embed carregado.');
      return;
    }

    if (isDirectMediaSource(selectedChannel)) {
      playWithNativeSource('Abrindo midia direta...');
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false
      });

      hlsRef.current = hls;
      hls.loadSource(selectedChannel.url);
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
                <a className="secondary-btn" href={apkDownloadUrl} download>
                  Baixar app
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

              {checkoutError ? (
                <div className="checkout-error-banner">
                  <strong>Falha ao iniciar o pagamento</strong>
                  <p>{checkoutError}</p>
                </div>
              ) : null}

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
                      <button
                        type="button"
                        className="primary-btn plan-btn"
                        onClick={() => startPaymentFlow(plan)}
                        disabled={paymentLoading}
                      >
                        {paymentLoading ? 'Abrindo...' : 'Assinar agora'}
                      </button>
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
                    <div className={`access-result-card ${accessLookupResult.status}`}>
                      <strong>{ACCESS_STATUS_LABELS[accessLookupResult.status] || 'Status desconhecido'}</strong>
                      <p>{accessLookupResult.message}</p>
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
                O acesso aos canais e liberado somente para IDs ativos. Depois da validacao, o app salva o status localmente e evita consultas repetidas ao Firebase.
              </p>

              <form className="tv-access-form" onSubmit={handleAccessLookup}>
                <label className="tv-access-field">
                  <span>ID de acesso</span>
                  <input
                    type="text"
                    value={accessIdInput}
                    onChange={event => setAccessIdInput(event.target.value.toUpperCase())}
                    placeholder="ATV-0001"
                    autoComplete="off"
                  />
                </label>

                <div className="tv-access-actions">
                  <button type="submit" className="primary-btn">
                    {accessLookupState === 'loading' || accessBootState === 'booting'
                      ? 'Validando...'
                      : 'Validar acesso'}
                  </button>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => {
                      clearCachedAccess();
                      setAccessIdInput('');
                      setAccessLookupState('idle');
                      setAccessLookupResult(null);
                      setAccessLookupError('');
                      setAuthorizedAccess(null);
                    }}
                  >
                    Limpar ID
                  </button>
                </div>
              </form>

              <div className="tv-access-hint">
                <span>Sem ID ativo?</span>
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
                  <p>O app esta validando o ultimo ID armazenado antes de liberar os canais.</p>
                </div>
              ) : null}

              {accessLookupState === 'error' ? (
                <div className="tv-access-result blocked">
                  <strong>Falha na validacao</strong>
                  <p>{accessLookupError}</p>
                </div>
              ) : null}

              {accessLookupState === 'success' && accessLookupResult ? (
                <div className={`tv-access-result ${accessLookupResult.status}`}>
                  <strong>{ACCESS_STATUS_LABELS[accessLookupResult.status] || 'Status desconhecido'}</strong>
                  <p>{accessLookupResult.message}</p>
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
              style={guideDrawerOpen && drawerHandleTop !== null ? { top: `${drawerHandleTop}px` } : undefined}
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
                    const isActive = channel.url === (guideDrawerOpen ? drawerChannelUrl : selectedChannel?.url);

                    return (
                      <li key={`${channel.name}-${channel.url}`}>
                        <button
                          type="button"
                          className={`guide-channel-item${isActive ? ' active' : ''}`}
                          onClick={() => {
                            setDrawerChannelUrl(channel.url);
                            setSelectedChannelUrl(channel.url);
                            setGuideDrawerOpen(false);
                            setPlaybackNonce(current => current + 1);
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

              <div className="guide-player-shell">
                {!embedUrl ? (
                  <video
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
                    id="tvEmbed"
                    title="Player incorporado"
                    src={embedUrl}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    tabIndex={-1}
                  />
                )}
                <div className="guide-overlay" />

                {authorizedAccess ? (
                  <div className="guide-access-summary">
                    <div className="guide-access-copy">
                      <strong>{authorizedAccess.planName || 'Acesso ativo'}</strong>
                      <span>{authorizedAccess.expiresAtLabel ? `Validade: ${authorizedAccess.expiresAtLabel}` : 'Validade nao definida'}</span>
                    </div>
                    <button
                      type="button"
                      className="guide-access-reset"
                      onClick={() => {
                        clearCachedAccess();
                        setGuideDrawerOpen(false);
                        setSelectedChannelUrl(CHANNELS[0]?.url || '');
                        setDrawerChannelUrl(CHANNELS[0]?.url || '');
                        setAuthorizedAccess(null);
                        setAccessLookupState('idle');
                        setAccessLookupResult(null);
                        setAccessLookupError('');
                        setAccessIdInput('');
                        setStatus('aguardando');
                        setStatusError(false);
                      }}
                    >
                      Trocar ID
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>
      )}

      {paymentModalOpen ? (
        <div className="payment-modal-backdrop" role="presentation" onClick={closePaymentModal}>
          <section
            className="payment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-modal-title"
            onClick={event => event.stopPropagation()}
          >
            <div className="payment-modal-header">
              <div>
                <span className="section-kicker">Pagamento seguro</span>
                <h2 id="payment-modal-title">
                  {paymentCheckout?.title || 'Escolha como pagar'}
                </h2>
                <p>
                  Selecione Pix ou cartão dentro desta tela. O acesso só será liberado depois da confirmação do pagamento.
                </p>
              </div>

              <button type="button" className="payment-modal-close" onClick={closePaymentModal}>
                Fechar
              </button>
            </div>

            <div className="payment-modal-grid">
              <div className="payment-brick-shell">
                <div id="paymentBrick_container" ref={paymentBrickRef} />
                {paymentLoading ? <div className="payment-loading">Carregando checkout...</div> : null}
              </div>

              <aside className="payment-summary">
                <div className="payment-summary-card">
                  <span className="payment-summary-label">Plano escolhido</span>
                  <strong>{paymentCheckout?.title || 'Plano'}</strong>
                  <p>
                    Valor total: <strong>{paymentCheckout?.amount ? `R$ ${paymentCheckout.amount}` : '-'}</strong>
                  </p>
                  <p>
                    Depois da confirmacao, o webhook cria o ID de acesso automaticamente no Firebase.
                  </p>
                </div>

                {paymentError ? (
                  <div className="payment-summary-card payment-summary-error">
                    <strong>Falha no checkout</strong>
                    <p>{paymentError}</p>
                  </div>
                ) : null}

                {paymentResult ? (
                  <div className="payment-summary-card payment-summary-success">
                    <strong>Pagamento iniciado</strong>
                    <p>Status: {paymentResult.status || 'aguardando'}</p>
                    {paymentResult.qrCodeBase64 ? (
                      <div className="payment-qr-block">
                        <img
                          src={`data:image/png;base64,${paymentResult.qrCodeBase64}`}
                          alt="QR Code do Pix"
                        />
                        <div>
                          <span>Use o QR Code no app do banco.</span>
                          {paymentResult.qrCode ? <code>{paymentResult.qrCode}</code> : null}
                        </div>
                      </div>
                    ) : null}

                    {paymentResult.ticketUrl ? (
                      <a className="secondary-btn payment-ticket-btn" href={paymentResult.ticketUrl} target="_blank" rel="noreferrer">
                        Abrir boleto/checkout
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </aside>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
