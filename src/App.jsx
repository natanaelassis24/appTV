import { useEffect, useMemo, useRef, useState } from 'react';
import Hls from 'hls.js';
import { CHANNELS } from './channels';
import { MOVIES } from './movies';
import { SERIES } from './series';

function formatClock() {
  return new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatFutureClock(minutesAhead = 90) {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutesAhead);
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
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

function getItemName(item, fallback = 'Canal sem nome') {
  return item?.name || item?.title || fallback;
}

function buildLogoThumb(channel, index) {
  const itemName = getItemName(channel, `Canal ${index + 1}`);

  if (channel.logoImage) {
    return (
      <span className="channel-thumb">
        <img
          className="channel-thumb-image"
          src={channel.logoImage}
          alt={`Logo ${itemName}`}
        />
      </span>
    );
  }

  return (
    <span className="channel-thumb">
      {channel.logo || itemName.slice(0, 2).toUpperCase()}
    </span>
  );
}

export default function App() {
  const [activeShelf, setActiveShelf] = useState('channels');
  const [guideDrawerOpen, setGuideDrawerOpen] = useState(false);
  const [selectedChannelUrl, setSelectedChannelUrl] = useState(CHANNELS[0]?.url || '');
  const [selectedMovieUrl, setSelectedMovieUrl] = useState(MOVIES[0]?.url || '');
  const [selectedSeriesId, setSelectedSeriesId] = useState('');
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState(1);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState('');
  const [status, setStatus] = useState('aguardando');
  const [statusError, setStatusError] = useState(false);
  const [nowTime, setNowTime] = useState(formatClock());
  const [embedUrl, setEmbedUrl] = useState('');
  const [playbackNonce, setPlaybackNonce] = useState(0);

  const playerRef = useRef(null);
  const channelListRef = useRef(null);
  const hlsRef = useRef(null);
  const recoveryRef = useRef({ network: 0, media: 0, fallbackTried: false });

  const filteredChannels = useMemo(() => CHANNELS, []);

  const movieChannels = useMemo(() => {
    return MOVIES;
  }, []);

  const selectedSeries = useMemo(() => {
    return SERIES.find(series => series.id === selectedSeriesId) || null;
  }, [selectedSeriesId]);

  const selectedSeason = useMemo(() => {
    return (
      selectedSeries?.seasons?.find(season => season.season === selectedSeasonNumber) ||
      selectedSeries?.seasons?.[0] ||
      null
    );
  }, [selectedSeasonNumber, selectedSeries]);

  const selectedEpisode = useMemo(() => {
    if (!selectedEpisodeId) {
      return null;
    }

    return selectedSeason?.episodes?.find(episode => episode.id === selectedEpisodeId) || null;
  }, [selectedEpisodeId, selectedSeason]);

  const selectedChannel = useMemo(() => {
    return (
      filteredChannels.find(channel => channel.url === selectedChannelUrl) ||
      filteredChannels[0] ||
      null
    );
  }, [filteredChannels, selectedChannelUrl]);

  const selectedMovie = useMemo(() => {
    return movieChannels.find(movie => movie.url === selectedMovieUrl) || movieChannels[0] || null;
  }, [movieChannels, selectedMovieUrl]);

  const selectedIndex = useMemo(() => {
    return filteredChannels.findIndex(channel => channel.url === selectedChannel?.url);
  }, [filteredChannels, selectedChannel]);

  const selectedMovieIndex = useMemo(() => {
    return movieChannels.findIndex(movie => movie.url === selectedMovie?.url);
  }, [movieChannels, selectedMovie]);

  const selectedSeriesIndex = useMemo(() => {
    return SERIES.findIndex(series => series.id === selectedSeries?.id);
  }, [selectedSeries]);

  const selectedMedia =
    activeShelf === 'series' ? selectedEpisode : activeShelf === 'movies' ? selectedMovie : selectedChannel;

  function moveSelectedChannel(delta) {
    if (!filteredChannels.length) return;

    const nextIndex =
      selectedIndex >= 0
        ? (selectedIndex + delta + filteredChannels.length) % filteredChannels.length
        : 0;

    setSelectedChannelUrl(filteredChannels[nextIndex].url);
  }

  const externalUrl = useMemo(() => {
    return selectedMedia?.externalUrl || selectedMedia?.url || '';
  }, [selectedMedia]);

  const guideEndTime = useMemo(() => formatFutureClock(90), [nowTime]);

  const heroStyle =
    activeShelf === 'series' && selectedSeries?.backdropImage
      ? {
          backgroundImage: `linear-gradient(90deg, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.66) 48%, rgba(0, 0, 0, 0.38) 100%), url("${selectedSeries.backdropImage}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }
      : activeShelf === 'movies' && (selectedMedia?.posterImage || selectedMedia?.logoImage)
        ? {
            backgroundImage: `linear-gradient(90deg, rgba(0, 0, 0, 0.92) 0%, rgba(0, 0, 0, 0.68) 48%, rgba(0, 0, 0, 0.48) 100%), url("${selectedMedia?.posterImage || selectedMedia?.logoImage}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }
      : undefined;

  useEffect(() => {
    if (!filteredChannels.length) {
      return;
    }

    const hasSelectedChannel = filteredChannels.some(channel => channel.url === selectedChannelUrl);
    if (!hasSelectedChannel) {
      setSelectedChannelUrl(filteredChannels[0].url);
    }
  }, [filteredChannels, selectedChannelUrl]);

  useEffect(() => {
    if (!movieChannels.length) {
      return;
    }

    const hasSelectedMovie = movieChannels.some(movie => movie.url === selectedMovieUrl);
    if (!hasSelectedMovie) {
      setSelectedMovieUrl(movieChannels[0].url);
    }
  }, [movieChannels, selectedMovieUrl]);

  useEffect(() => {
    if (!selectedSeries) {
      setSelectedEpisodeId('');
      return;
    }

    if (!selectedSeries.seasons?.some(season => season.season === selectedSeasonNumber)) {
      setSelectedSeasonNumber(selectedSeries.seasons?.[0]?.season || 1);
      return;
    }

    const season = selectedSeries.seasons.find(item => item.season === selectedSeasonNumber);
    if (!season?.episodes?.some(episode => episode.id === selectedEpisodeId)) {
      setSelectedEpisodeId('');
    }
  }, [selectedEpisodeId, selectedSeasonNumber, selectedSeries]);

  useEffect(() => {
    const player = playerRef.current;

    if (!player || selectedMedia?.url) {
      return;
    }

    setEmbedUrl('');
    setStatusError(false);
    setStatus(
      activeShelf === 'series'
        ? selectedSeries
          ? 'Selecione um episodio para reproduzir.'
          : 'Clique em uma serie para ver os episodios.'
        : 'aguardando'
    );

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    player.pause();
    player.removeAttribute('src');
    player.load();
  }, [activeShelf, selectedMedia?.url, selectedSeries]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowTime(formatClock()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!guideDrawerOpen || !channelListRef.current) {
      return;
    }

    const activeItem = channelListRef.current.querySelector('.guide-channel-item.active');
    if (activeItem) {
      activeItem.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [guideDrawerOpen, selectedChannelUrl]);

  useEffect(() => {
    function onKeyDown(event) {
      if (activeShelf === 'series') {
        if (!SERIES.length) return;

        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
          event.preventDefault();
          const nextIndex = selectedSeriesIndex >= 0 ? (selectedSeriesIndex + 1) % SERIES.length : 0;
          setSelectedSeriesId(SERIES[nextIndex].id);
          setSelectedSeasonNumber(SERIES[nextIndex].seasons?.[0]?.season || 1);
          setSelectedEpisodeId('');
        } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
          event.preventDefault();
          const nextIndex = selectedSeriesIndex >= 0 ? (selectedSeriesIndex - 1 + SERIES.length) % SERIES.length : 0;
          setSelectedSeriesId(SERIES[nextIndex].id);
          setSelectedSeasonNumber(SERIES[nextIndex].seasons?.[0]?.season || 1);
          setSelectedEpisodeId('');
        } else if (event.key === 'Enter') {
          event.preventDefault();
          if (!selectedSeries && SERIES[0]) {
            setSelectedSeriesId(SERIES[0].id);
            setSelectedSeasonNumber(SERIES[0].seasons?.[0]?.season || 1);
            setSelectedEpisodeId('');
          } else if (selectedEpisode) {
            setPlaybackNonce(current => current + 1);
          }
        }

        return;
      }

      if (activeShelf === 'movies') {
        if (!movieChannels.length) return;

        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
          event.preventDefault();
          const nextIndex = selectedMovieIndex >= 0 ? (selectedMovieIndex + 1) % movieChannels.length : 0;
          setSelectedMovieUrl(movieChannels[nextIndex].url);
        } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
          event.preventDefault();
          const nextIndex =
            selectedMovieIndex >= 0 ? (selectedMovieIndex - 1 + movieChannels.length) % movieChannels.length : 0;
          setSelectedMovieUrl(movieChannels[nextIndex].url);
        } else if (event.key === 'Enter') {
          event.preventDefault();
          setPlaybackNonce(current => current + 1);
        }

        return;
      }

      if (!filteredChannels.length) return;

      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        event.preventDefault();
        moveSelectedChannel(1);
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        event.preventDefault();
        moveSelectedChannel(-1);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        setPlaybackNonce(current => current + 1);
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [activeShelf, filteredChannels, movieChannels, selectedIndex, selectedMovieIndex, selectedSeriesIndex]);

  useEffect(() => {
    const player = playerRef.current;

    if (!player || !selectedMedia?.url) {
      return undefined;
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
      player.src = selectedMedia.url;
      player.load();
      setPlayerStatus(message);
      player.play().catch(() => {
        setPlayerStatus(
          'Nao foi possivel reproduzir o stream. A fonte deste canal pode estar offline, bloqueada ou exigir outro player.',
          true
        );
      });
    };

    const resetSurface = () => {
      setEmbedUrl('');
      recoveryRef.current = { network: 0, media: 0, fallbackTried: false };
      cleanupHls();

      player.pause();
      player.removeAttribute('src');
      player.load();
    };

    resetSurface();
    setPlayerStatus('Conectando transmissao...');

    if (selectedMedia.unavailable) {
      setPlayerStatus(
        'Este canal esta indisponivel no momento. Use "Abrir fora do app" se quiser tentar a fonte original.',
        true
      );
      return undefined;
    }

    if (selectedMedia.sourceType === 'embed') {
      setEmbedUrl(buildEmbedUrl(selectedMedia));
      setPlayerStatus('Embed carregado. Se o provedor bloquear a incorporacao, use "Abrir fora do app".');
      return undefined;
    }

    if (isDirectMediaSource(selectedMedia)) {
      playWithNativeSource('Abrindo midia direta no player nativo...');
      const onEnded = () => {
        if (activeShelf !== 'series' || !selectedSeason?.episodes?.length) {
          return;
        }

        const currentEpisodeIndex = selectedSeason.episodes.findIndex(episode => episode.id === selectedEpisode?.id);
        const nextEpisode = selectedSeason.episodes[currentEpisodeIndex + 1];
        if (nextEpisode) {
          setSelectedEpisodeId(nextEpisode.id);
        }
      };

      player.addEventListener('ended', onEnded);
      return () => {
        player.removeEventListener('ended', onEnded);
      };
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false
      });
      hlsRef.current = hls;
      hls.loadSource(selectedMedia.url);
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
          setPlayerStatus(
            `Erro de rede ao abrir o stream. Tentando novamente (${recoveryRef.current.network}/2)...`
          );
          hls.startLoad();
          return;
        }

        if (data.type === Hls.ErrorTypes.MEDIA_ERROR && recoveryRef.current.media < 1) {
          recoveryRef.current.media += 1;
          setPlayerStatus('Erro de midia detectado. Tentando recuperar a transmissao...');
          hls.recoverMediaError();
          return;
        }

        if (!recoveryRef.current.fallbackTried) {
          playWithNativeSource('Tentando abrir o stream com fallback nativo do navegador...');
          return;
        }

        setPlayerStatus(
          `Erro HLS: ${data.details || data.type}. A fonte deste canal pode estar indisponivel.`,
          true
        );
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }

    playWithNativeSource('Abrindo stream com player nativo do navegador...');

    return () => {
      cleanupHls();
    };
  }, [activeShelf, playbackNonce, selectedEpisode, selectedMedia, selectedSeason]);

  return (
    <div className="app-shell">
      {activeShelf === 'channels' ? (
        <header className="guide-hero">
          <div className="guide-topbar">
            <div className="section-head">
              <div>
                <span className="section-kicker">Catalogo ao vivo</span>
                <h2>Canais em destaque</h2>
              </div>
              <p>Use clique, setas do teclado ou Enter para trocar rapidamente.</p>
            </div>

            <div className="shelf-tabs">
              <button
                type="button"
                className={`shelf-tab${activeShelf === 'channels' ? ' active' : ''}`}
                onClick={() => setActiveShelf('channels')}
              >
                Canais
              </button>
              <button
                type="button"
                className={`shelf-tab${activeShelf === 'movies' ? ' active' : ''}`}
                onClick={() => setActiveShelf('movies')}
              >
                Filmes
              </button>
              <button
                type="button"
                className={`shelf-tab${activeShelf === 'series' ? ' active' : ''}`}
                onClick={() => setActiveShelf('series')}
              >
                Series
              </button>
            </div>
          </div>

          <div className="guide-stage">
            <button
              type="button"
              className={`guide-handle${guideDrawerOpen ? ' open' : ''}`}
              onClick={() => setGuideDrawerOpen(current => !current)}
              aria-label={guideDrawerOpen ? 'Fechar canais' : 'Abrir canais'}
              title={guideDrawerOpen ? 'Fechar canais' : 'Abrir canais'}
            >
              {guideDrawerOpen ? '<' : '>'}
            </button>

            <div className={`guide-stage-frame${guideDrawerOpen ? ' open' : ''}`}>
              <aside className={`guide-sidebar${guideDrawerOpen ? ' open' : ''}`}>
                <button
                  type="button"
                  className="guide-nav-button guide-nav-up"
                  onClick={() => moveSelectedChannel(-1)}
                  aria-label="Canal anterior"
                  title="Canal anterior"
                >
                  ^
                </button>

                <ul ref={channelListRef} className="guide-channel-list">
                  {filteredChannels.map((channel, index) => {
                    const isActive = channel.url === selectedChannel?.url;

                    return (
                      <li key={`${channel.name}-${channel.url}`}>
                        <button
                          type="button"
                          className={`guide-channel-item${isActive ? ' active' : ''}`}
                          onClick={() => {
                            setSelectedChannelUrl(channel.url);
                            setGuideDrawerOpen(false);
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

                <button
                  type="button"
                  className="guide-nav-button guide-nav-down"
                  onClick={() => moveSelectedChannel(1)}
                  aria-label="Proximo canal"
                  title="Proximo canal"
                >
                  v
                </button>
              </aside>

              <div className="guide-player-shell">
                {!embedUrl ? (
                  <video ref={playerRef} id="tvPlayer" controls autoPlay playsInline crossOrigin="anonymous" />
                ) : (
                  <iframe
                    id="tvEmbed"
                    title="Player incorporado"
                    src={embedUrl}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                )}
                <div className="guide-overlay" />
              </div>
            </div>
          </div>

          <div className="guide-footer">
            <div className="guide-footer-main">
              <div className="guide-footer-heading">
                <strong>{selectedChannel?.name || 'Canal ao vivo'}</strong>
                <span>{selectedChannel?.category || 'Canais'}</span>
              </div>
              <p className="guide-footer-description">
                {selectedChannel?.description || 'Canal ao vivo selecionado na gaveta lateral.'}
              </p>
            </div>
            <div className="guide-footer-meta">
              <span className="guide-meta-pill">{`Canal ${selectedChannel?.number || '-'}`}</span>
              <span className="guide-meta-pill">{selectedChannel?.sourceType === 'embed' ? 'Embed' : selectedChannel?.sourceType === 'file' ? 'Arquivo' : 'HLS'}</span>
              <span className="guide-meta-pill status">{status}</span>
            </div>
          </div>
        </header>
      ) : (
      <header className={`hero${activeShelf === 'series' ? ' hero-series' : ''}${activeShelf === 'movies' ? ' hero-movies' : ''}`} style={heroStyle}>
        <div className="hero-copy">
          <span className="hero-kicker">
            {activeShelf === 'movies' ? 'Filmes' : activeShelf === 'series' ? 'Series' : 'TV ao vivo'}
          </span>
          <h1>
            {activeShelf === 'series' ? selectedSeries?.title || 'Series' : getItemName(selectedMedia, 'TV ao vivo')}
          </h1>
          <p>
            {activeShelf === 'series'
              ? selectedSeries?.synopsis || 'Selecione uma serie e deixe o player seguir automaticamente para o proximo episodio.'
              : selectedMedia?.description ||
                'Uma interface inspirada em streaming para abrir canais ao vivo de forma simples e direta.'}
          </p>

          <div className="hero-actions">
            <button
              type="button"
              id="watchNowBtn"
              className="primary-btn"
              onClick={() => setPlaybackNonce(current => current + 1)}
            >
              Assistir agora
            </button>
              <span className="secondary-btn">
                {activeShelf === 'series' || activeShelf === 'movies' ? 'Catalogo estilo streaming' : 'Canais no codigo'}
              </span>
            {externalUrl ? (
              <a
                id="openExternalBtn"
                className="secondary-btn"
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir fora do app
              </a>
            ) : null}
          </div>

          <div className="hero-meta">
            <div className="meta-pill">
              <span className="meta-label">Status</span>
              <strong>
                {selectedMedia
                  ? activeShelf === 'series'
                    ? selectedEpisode
                      ? `Reproduzindo ${selectedSeries?.title} - ${getItemName(selectedEpisode)}`
                      : `Serie selecionada: ${selectedSeries?.title}`
                    : `Transmitindo ${getItemName(selectedMedia)}`
                  : 'Carregando catalogo...'}
              </strong>
            </div>
            <div className="meta-pill">
              <span className="meta-label">Horario</span>
              <strong>{nowTime}</strong>
            </div>
          </div>
        </div>

        <div className="hero-player">
          <div className="player-card">
            {!embedUrl ? (
              <video ref={playerRef} id="tvPlayer" controls autoPlay playsInline crossOrigin="anonymous" />
            ) : (
              <iframe
                id="tvEmbed"
                title="Player incorporado"
                src={embedUrl}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            )}
          </div>

          <div className="player-status">
            <div className="channel-info">
              <strong>{activeShelf === 'series' ? selectedSeries?.title || 'Serie sem nome' : getItemName(selectedMedia)}</strong>
              <div>
                {activeShelf === 'series'
                  ? [
                      selectedSeries?.title || '',
                      selectedSeason ? `Temporada ${selectedSeason.season}` : '',
                      selectedEpisode?.number ? `Episodio ${selectedEpisode.number}` : '',
                      selectedEpisode?.duration || ''
                    ]
                      .filter(Boolean)
                      .join(' | ')
                  : [selectedMedia?.number ? `Canal ${selectedMedia.number}` : '', selectedMedia?.category || '']
                      .filter(Boolean)
                      .join(' | ') || 'Transmissao ao vivo'}
              </div>
              <div>
                {activeShelf === 'series'
                  ? selectedEpisode?.description ||
                    selectedSeries?.synopsis ||
                    'Clique em uma serie para abrir a lista de episodios.'
                  : selectedMedia?.description || 'Canal embutido diretamente no codigo.'}
              </div>
            </div>
            <div className="status" style={{ color: statusError ? '#ffb3b3' : '#b8b8b3' }}>
              {`Status: ${selectedMedia?.url ? status : activeShelf === 'series' ? 'Clique em uma serie para ver os episodios.' : status}`}
            </div>
          </div>
        </div>
      </header>
      )}

      <main className="content">
        <section className="shelf">
          {activeShelf !== 'channels' ? (
            <>
              <div className="shelf-tabs">
                <button
                  type="button"
                  className={`shelf-tab${activeShelf === 'channels' ? ' active' : ''}`}
                  onClick={() => setActiveShelf('channels')}
                >
                  Canais
                </button>
                <button
                  type="button"
                  className={`shelf-tab${activeShelf === 'movies' ? ' active' : ''}`}
                  onClick={() => setActiveShelf('movies')}
                >
                  Filmes
                </button>
                <button
                  type="button"
                  className={`shelf-tab${activeShelf === 'series' ? ' active' : ''}`}
                  onClick={() => setActiveShelf('series')}
                >
                  Series
                </button>
              </div>

              <div className="section-head">
                <div>
                  <span className="section-kicker">
                    {activeShelf === 'movies' ? 'Catalogo de filmes' : 'Catalogo de series'}
                  </span>
                  <h2>{activeShelf === 'movies' ? 'Filmes em destaque' : 'Series em destaque'}</h2>
                </div>
                <p>Use clique, setas do teclado ou Enter para trocar rapidamente.</p>
              </div>
            </>
          ) : null}

          {activeShelf === 'series' ? (
            <>
              <div className="series-strip">
                <div className="series-strip-head">
                  <span className="section-kicker">Explorar series</span>
                  <p>Escolha um titulo e continue pelo destaque do topo.</p>
                </div>

                <ul className="series-row">
                  {SERIES.map((series, index) => (
                    <li
                      key={series.id}
                      className={`series-poster${index === selectedSeriesIndex ? ' active' : ''}`}
                      onClick={() => {
                        setSelectedSeriesId(series.id);
                        setSelectedSeasonNumber(series.seasons?.[0]?.season || 1);
                        setSelectedEpisodeId('');
                      }}
                    >
                      <div
                        className="series-poster-art"
                        style={
                          series.posterImage
                            ? { backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.5)), url("${series.posterImage}")` }
                            : undefined
                        }
                      >
                        <span className="series-poster-badge">{series.badge || 'Serie'}</span>
                      </div>
                      <strong>{series.title}</strong>
                      <span>{series.year || 'Catalogo'}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {selectedSeries ? (
                <div className="episodes-panel">
                  <div className="episodes-head">
                    <strong>{selectedSeries.title}</strong>
                    <span>Autoplay do proximo episodio ativado</span>
                  </div>

                  <div className="season-tabs">
                    {selectedSeries.seasons.map(season => (
                      <button
                        key={season.season}
                        type="button"
                        className={`season-tab${season.season === selectedSeason?.season ? ' active' : ''}`}
                        onClick={() => {
                          setSelectedSeasonNumber(season.season);
                          setSelectedEpisodeId('');
                        }}
                      >
                        {`Temporada ${season.season}`}
                      </button>
                    ))}
                  </div>

                  <ul className="episode-list episode-grid">
                    {selectedSeason?.episodes?.map(episode => (
                      <li
                        key={episode.id}
                        className={`episode-item episode-card${episode.id === selectedEpisodeId ? ' active' : ''}`}
                        onClick={() => setSelectedEpisodeId(episode.id)}
                      >
                        <div
                          className="episode-thumb"
                          style={
                            episode.thumbImage
                              ? {
                                  backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.56)), url("${episode.thumbImage}")`
                                }
                              : undefined
                          }
                        >
                          <span className="episode-play">{episode.id === selectedEpisodeId ? 'Assistindo' : 'Play'}</span>
                        </div>
                        <div className="episode-body">
                          <div className="episode-heading">
                            <span className="episode-number">{episode.number}</span>
                            <div className="episode-copy">
                              <strong>{episode.title}</strong>
                              <span>{episode.description || 'Episodio disponivel para reproducao.'}</span>
                            </div>
                          </div>
                          <span className="episode-duration">{episode.duration || '00:00'}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="episodes-panel episodes-empty">
                  <strong>Selecione uma serie</strong>
                  <span>Quando voce abrir uma serie, a pagina mostra temporadas, capa, resumo e os episodios em destaque.</span>
                </div>
              )}
            </>
          ) : activeShelf === 'movies' ? (
            <>
              <div className="series-strip">
                <div className="series-strip-head">
                  <span className="section-kicker">Explorar filmes</span>
                  <p>Escolha um titulo e continue pelo destaque do topo.</p>
                </div>

                <ul className="series-row">
                  {movieChannels.map(movie => {
                    const isActive = movie.url === selectedMovie?.url;
                    return (
                      <li
                        key={`${movie.name}-${movie.url}`}
                        className={`series-poster${isActive ? ' active' : ''}`}
                        onClick={() => setSelectedMovieUrl(movie.url)}
                      >
                        <div
                          className="series-poster-art"
                          style={
                            movie.posterImage || movie.logoImage
                              ? {
                                  backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.5)), url("${movie.posterImage || movie.logoImage}")`
                                }
                              : undefined
                          }
                        >
                          <span className="series-poster-badge">{movie.category || 'Filme'}</span>
                        </div>
                        <strong>{movie.name}</strong>
                        <span>{movie.sourceType === 'file' ? 'Arquivo direto' : movie.category || 'Filme'}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {!movieChannels.length ? (
                <div className="episodes-panel episodes-empty">
                  <strong>Nenhum filme cadastrado</strong>
                  <span>Adicione os filmes em [movies.js] usando o modelo MOVIE_TEMPLATE.</span>
                </div>
              ) : null}
            </>
          ) : null}
        </section>
      </main>
    </div>
  );
}
