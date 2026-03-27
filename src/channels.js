export const CHANNEL_TEMPLATE = {
  name: 'Nome do Canal',
  url: 'https://seu-link.m3u8?token=seu_token',
  number: '0',
  category: 'Canais',
  logoImage: 'https://sua-logo.png',
  logo: 'NC',
  sourceType: 'hls',
  playbackTransport: 'direct',
  description: 'Descricao curta do canal.',
  note: 'Para adicionar um canal novo, copie um bloco existente e troque nome, numero, logo e link. URLs HLS com token, como .m3u8?token=..., funcionam. Se precisar de proxy, mude playbackTransport para proxy.'
};

export function isHlsUrl(url) {
  const normalizedUrl = String(url || '').trim().toLowerCase();
  if (!normalizedUrl) {
    return false;
  }

  try {
    const parsed = new URL(normalizedUrl);
    const pathname = parsed.pathname.toLowerCase();
    return pathname.endsWith('.m3u8') || pathname.endsWith('.m3u');
  } catch {
    return /\.m3u8($|\?)/i.test(normalizedUrl) || /\.m3u($|\?)/i.test(normalizedUrl);
  }
}

export function isMediaFileUrl(url) {
  const normalizedUrl = String(url || '').trim().toLowerCase();
  if (!normalizedUrl) {
    return false;
  }

  try {
    const parsed = new URL(normalizedUrl);
    const pathname = parsed.pathname.toLowerCase();
    return pathname.endsWith('.mp4') || pathname.endsWith('.mp3') || pathname.endsWith('.ts');
  } catch {
    return /\.(mp4|mp3|ts)($|\?)/i.test(normalizedUrl);
  }
}

export function isTransportStreamUrl(url) {
  const normalizedUrl = String(url || '').trim().toLowerCase();
  if (!normalizedUrl) {
    return false;
  }

  try {
    const parsed = new URL(normalizedUrl);
    return parsed.pathname.toLowerCase().endsWith('.ts');
  } catch {
    return /\.ts($|\?)/i.test(normalizedUrl);
  }
}

function inferSourceType(url, sourceType) {
  const explicitType = String(sourceType || '').trim();
  if (explicitType) {
    return explicitType;
  }

  const normalizedUrl = String(url || '').trim().toLowerCase();
  if (normalizedUrl.includes('youtu.be') || normalizedUrl.includes('youtube.com')) {
    return 'embed';
  }

  if (isMediaFileUrl(normalizedUrl)) {
    return 'file';
  }

  if (isHlsUrl(normalizedUrl)) {
    return 'hls';
  }

  return 'hls';
}

function inferPlaybackTransport(playbackTransport) {
  const explicitTransport = String(playbackTransport || '').trim().toLowerCase();
  if (
    explicitTransport === 'proxy' ||
    explicitTransport === 'page' ||
    explicitTransport === 'browser' ||
    explicitTransport === 'direct'
  ) {
    return explicitTransport;
  }

  return 'direct';
}

export function createChannel(overrides = {}) {
  const base = { ...CHANNEL_TEMPLATE, ...overrides };

  return {
    name: String(base.name || '').trim(),
    url: String(base.url || '').trim(),
    number: String(base.number || '').trim(),
    category: String(base.category || 'Canais').trim(),
    logoImage: String(base.logoImage || '').trim(),
    logo: String(base.logo || '').trim(),
    sourceType: inferSourceType(base.url, base.sourceType),
    playbackTransport: inferPlaybackTransport(base.playbackTransport),
    description: String(base.description || '').trim(),
    note: String(base.note || CHANNEL_TEMPLATE.note).trim()
  };
}

export function createHlsChannel(overrides = {}) {
  return createChannel({
    sourceType: 'hls',
    ...overrides
  });
}

export function createEmbedChannel(overrides = {}) {
  return createChannel({
    sourceType: 'embed',
    ...overrides
  });
}

// Para adicionar um canal novo:
// 1. copie um item abaixo
// 2. troque nome, link, numero e logo
// 3. se for .m3u8, .m3u8?token=... ou YouTube, o app detecta sozinho
// 4. se quiser, deixe sourceType somente para casos especiais
const PRIMARY_CHANNELS = [
  {
    name: 'Os Simpsons 24h',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/38000.ts',
    number: '1',
    category: 'Canais',
    logoImage: '',
    logo: 'SM',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Naruto Uzumaki 24h',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/38006.ts',
    number: '2',
    category: 'Canais',
    logoImage: 'https://imgs.search.brave.com/8ag6mmvosBO2gjO1Q8IgJblkUmJ7kQnvALOAUZS1QL8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvMTMvTmFy/dXRvLUxvZ28tUE5H/LVBob3Rvcy5wbmc',
    logo: 'SM',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Naruto Shippuden 24h',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/38007.ts',
    number: '3',
    category: 'Canais',
    logoImage: 'https://imgs.search.brave.com/1V9shWGc8xHRTTCyZM0CjNkCc97NHGxKF0Tww_th7-c/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cG5nYWxsLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvMTUvTmFy/dXRvLVNoaXBwdWRlbi1Mb2dvLVBORy1J/bWFnZS1IRC5wbmc',
    logo: 'SM',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Dois Homens e Meio 24h',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/38004.ts',
    number: '4',
    category: 'Canais',
    logoImage: 'https://upload.wikimedia.org/wikipedia/pt/thumb/f/ff/Two_and_a_half_men_logo.jpg/250px-Two_and_a_half_men_logo.jpg',
    logo: 'SM',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Cartoon Network FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/24003.ts',
    number: '5',
    category: 'Canais',
    logoImage: 'https://yt3.googleusercontent.com/K4BGYVFPK9QWZiLLP49cRkxl-QtR8gLvmjLTkiRS1e97fnrAfdmIjdFj4mmIgarHySptEdAs=s160-c-k-c0x00ffffff-no-rj',
    logo: 'SM',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Cartoon Network HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/24004.ts',
    number: '6',
    category: 'Canais',
    logoImage: 'https://yt3.googleusercontent.com/K4BGYVFPK9QWZiLLP49cRkxl-QtR8gLvmjLTkiRS1e97fnrAfdmIjdFj4mmIgarHySptEdAs=s160-c-k-c0x00ffffff-no-rj',
    logo: 'SM',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Cartoon Network SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/24005.ts',
    number: '7',
    category: 'Canais',
    logoImage: 'https://yt3.googleusercontent.com/K4BGYVFPK9QWZiLLP49cRkxl-QtR8gLvmjLTkiRS1e97fnrAfdmIjdFj4mmIgarHySptEdAs=s160-c-k-c0x00ffffff-no-rj',
    logo: 'SM',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  }
];

export const CHANNELS = PRIMARY_CHANNELS;
