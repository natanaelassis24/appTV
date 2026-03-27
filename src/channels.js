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
  },
  {
    name: 'Box Kids FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/24000.ts',
    number: '8',
    category: 'Canais',
    logoImage: 'https://imgs.search.brave.com/VhMVTdU06jbk7nfeDvU2_WWmKXnDsfnu1DYuBmbutNo/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvY29tbW9ucy8x/LzE4L0JveGtpZHN0/di5wbmc',
    logo: 'SM',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Box Kids HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/24001.ts',
    number: '9',
    category: 'Canais',
    logoImage: 'https://imgs.search.brave.com/VhMVTdU06jbk7nfeDvU2_WWmKXnDsfnu1DYuBmbutNo/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvY29tbW9ucy8x/LzE4L0JveGtpZHN0/di5wbmc',
    logo: 'SM',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Box Kids SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/24002.ts',
    number: '10',
    category: 'Canais',
    logoImage: 'https://imgs.search.brave.com/VhMVTdU06jbk7nfeDvU2_WWmKXnDsfnu1DYuBmbutNo/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvY29tbW9ucy8x/LzE4L0JveGtpZHN0/di5wbmc',
    logo: 'SM',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Paramount+ 1',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/19071.ts',
    number: '11',
    category: 'Canais | Esportes PPV',
    logoImage: 'https://www.fontedecanais.org/logos/canais/paramountplus.png',
    logo: 'PM',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Paramount+ 2',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/19072.ts',
    number: '12',
    category: 'Canais | Esportes PPV',
    logoImage: 'https://www.fontedecanais.org/logos/canais/paramountplus.png',
    logo: 'PM',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Paramount+ 3',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/19073.ts',
    number: '13',
    category: 'Canais | Esportes PPV',
    logoImage: 'https://www.fontedecanais.org/logos/canais/paramountplus.png',
    logo: 'PM',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Paramount+ 4',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/19074.ts',
    number: '14',
    category: 'Canais | Esportes PPV',
    logoImage: 'https://www.fontedecanais.org/logos/canais/paramountplus.png',
    logo: 'PM',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Paramount+ 5',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/19075.ts',
    number: '15',
    category: 'Canais | Esportes PPV',
    logoImage: 'https://www.fontedecanais.org/logos/canais/paramountplus.png',
    logo: 'PM',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Paramount+ 6',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/19076.ts',
    number: '16',
    category: 'Canais | Esportes PPV',
    logoImage: 'https://www.fontedecanais.org/logos/canais/paramountplus.png',
    logo: 'PM',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'SPORTV alternativo HD3',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/21001.ts',
    number: '17',
    category: 'Canais | SPORTV',
    logoImage: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg6B8xI6yIIbHsw_r3Ntr-US2ZCZ7s_a1PyDMTyXUrK9otZ_VAiLS5-cf6TIEc7ZZo-7az6AZV6YnBTHUeO6TdCC2T4RpTfClfzQkMdQ6wMoIE1j1Ojab8x6vZnjPJTKFF9x4-MQzjejnPYgaFX42C66j_FtM6whoOtQv_GDYmj5sd8JemsBrFHVuVWROs/s1600/sportv.webp',
    logo: 'SP',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'SPORTV HD',
    url: 'http://46.151.196.223:14286',
    number: '18',
    category: 'Canais | SPORTV',
    logoImage: 'http://smartvtcl.site:8080/images/43c36900b0aa86ded24077870df74926.png',
    logo: 'SP',
    sourceType: 'hls',
    playbackTransport: 'direct',
    description: 'Canal SPORTV HD.'
  },
  {
    name: 'SPORTV 2 alternativo HD3',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/21004.ts',
    number: '19',
    category: 'Canais | SPORTV',
    logoImage: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg6B8xI6yIIbHsw_r3Ntr-US2ZCZ7s_a1PyDMTyXUrK9otZ_VAiLS5-cf6TIEc7ZZo-7az6AZV6YnBTHUeO6TdCC2T4RpTfClfzQkMdQ6wMoIE1j1Ojab8x6vZnjPJTKFF9x4-MQzjejnPYgaFX42C66j_FtM6whoOtQv_GDYmj5sd8JemsBrFHVuVWROs/s1600/sportv.webp',
    logo: 'SP',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'SPORTV 2 HD',
    url: 'http://2025easy.lat:80/live/rc8zew5u/21231sw2/1487667.ts',
    number: '20',
    category: 'Canais | SPORTV',
    logoImage: 'http://smartvtcl.site:8080/images/86a8beda27c8e9d69d82f55e77e225d0.jpg',
    logo: 'SP',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'SPORTV 3 alternativo HD3',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/21007.ts',
    number: '21',
    category: 'Canais | SPORTV',
    logoImage: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg6B8xI6yIIbHsw_r3Ntr-US2ZCZ7s_a1PyDMTyXUrK9otZ_VAiLS5-cf6TIEc7ZZo-7az6AZV6YnBTHUeO6TdCC2T4RpTfClfzQkMdQ6wMoIE1j1Ojab8x6vZnjPJTKFF9x4-MQzjejnPYgaFX42C66j_FtM6whoOtQv_GDYmj5sd8JemsBrFHVuVWROs/s1600/sportv.webp',
    logo: 'SP',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'SPORTV 3 HD',
    url: 'http://79.127.243.211:14473',
    number: '22',
    category: 'Canais | SPORTV',
    logoImage: 'http://smartvtcl.site:8080/images/43c36900b0aa86ded24077870df74926.png',
    logo: 'SP',
    sourceType: 'hls',
    playbackTransport: 'direct',
    description: 'Canal SPORTV 3 HD.'
  },
  {
    name: 'PREMIERE CLUBES alternativo HD3',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/20001.ts',
    number: '23',
    category: 'Canais | PREMIERE',
    logoImage: 'https://i.imgur.com/VlFYLLm.jpg',
    logo: 'PR',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'PREMIERE CLUBES HD',
    url: 'http://2025easy.lat:80/live/rc8zew5u/21231sw2/608078.ts',
    number: '24',
    category: 'Canais | PREMIERE',
    logoImage: 'http://smartvtcl.site:8080/images/7420e409343fec2e3daad2f96051ece1.png',
    logo: 'PR',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'PREMIERE 2 alternativo HD3',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/20004.ts',
    number: '25',
    category: 'Canais | PREMIERE',
    logoImage: 'https://prostore.app/logos/premiere.png',
    logo: 'PR',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'PREMIERE 2 HD',
    url: 'http://2025easy.lat:80/live/rc8zew5u/21231sw2/608085.ts',
    number: '26',
    category: 'Canais | PREMIERE',
    logoImage: 'http://smartvtcl.site:8080/images/d8112913629b11433d5cee3c8630fe35.png',
    logo: 'PR',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'PREMIERE 3 alternativo HD3',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/20007.ts',
    number: '27',
    category: 'Canais | PREMIERE',
    logoImage: 'https://prostore.app/logos/premiere.png',
    logo: 'PR',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'PREMIERE 3 HD',
    url: 'http://2025easy.lat:80/live/rc8zew5u/21231sw2/608092.ts',
    number: '28',
    category: 'Canais | PREMIERE',
    logoImage: 'http://smartvtcl.site:8080/images/07bad40c2d6c237f403735d64e78ac5b.png',
    logo: 'PR',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'PREMIERE 4 alternativo HD3',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/20010.ts',
    number: '29',
    category: 'Canais | PREMIERE',
    logoImage: 'https://prostore.app/logos/premiere.png',
    logo: 'PR',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'PREMIERE 4 HD',
    url: 'http://2025easy.lat:80/live/rc8zew5u/21231sw2/608099.ts',
    number: '30',
    category: 'Canais | PREMIERE',
    logoImage: 'http://smartvtcl.site:8080/images/bfb9ac115c00dbfcba0dd0042c157d08.png',
    logo: 'PR',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'PREMIERE 5 alternativo HD3',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/20013.ts',
    number: '31',
    category: 'Canais | PREMIERE',
    logoImage: 'https://prostore.app/logos/premiere.png',
    logo: 'PR',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'PREMIERE 5 HD',
    url: 'http://2025easy.lat:80/live/rc8zew5u/21231sw2/608106.ts',
    number: '32',
    category: 'Canais | PREMIERE',
    logoImage: 'http://smartvtcl.site:8080/images/a6880809da2699ed61ad10ab34ab91f6.png',
    logo: 'PR',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'PREMIERE 6 alternativo HD3',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/20016.ts',
    number: '33',
    category: 'Canais | PREMIERE',
    logoImage: 'https://prostore.app/logos/premiere.png',
    logo: 'PR',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'PREMIERE 6 HD',
    url: 'http://2025easy.lat:80/live/rc8zew5u/21231sw2/608119.ts',
    number: '34',
    category: 'Canais | PREMIERE',
    logoImage: 'http://smartvtcl.site:8080/images/8e44ad550752a2fc57ec40db15039815.png',
    logo: 'PR',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'PREMIERE 7 alternativo HD3',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/20019.ts',
    number: '35',
    category: 'Canais | PREMIERE',
    logoImage: 'https://prostore.app/logos/premiere.png',
    logo: 'PR',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'PREMIERE 7 HD',
    url: 'http://2025easy.lat:80/live/rc8zew5u/21231sw2/608126.ts',
    number: '36',
    category: 'Canais | PREMIERE',
    logoImage: 'http://smartvtcl.site:8080/images/83ff9d5d3718c0ec268ae1ef48e70188.png',
    logo: 'PR',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'PREMIERE 8 alternativo HD3',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/20022.ts',
    number: '37',
    category: 'Canais | PREMIERE',
    logoImage: 'https://prostore.app/logos/premiere.png',
    logo: 'PR',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'PREMIERE 8 HD',
    url: 'http://2025easy.lat:80/live/rc8zew5u/21231sw2/608131.ts',
    number: '38',
    category: 'Canais | PREMIERE',
    logoImage: 'http://smartvtcl.site:8080/images/46d3879f79cb515460c45a9fee4c88b5.png',
    logo: 'PR',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'ESPN1 alternativo HD3',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/22001.ts',
    number: '39',
    category: 'ESPN',
    logoImage: 'https://i.imgur.com/hJr0Ay6.png',
    logo: 'ES',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'ESPN HD',
    url: 'http://46.151.196.223:14432',
    number: '40',
    category: 'ESPN',
    logoImage: 'http://smartvtcl.site:8080/images/865c0c0b4ab0e063e5caa3387c1a8741.png',
    logo: 'ES',
    sourceType: 'hls',
    playbackTransport: 'direct',
    description: 'Canal ESPN HD.'
  },
  {
    name: 'ESPN 2 alternativo HD3',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/22004.ts',
    number: '41',
    category: 'ESPN',
    logoImage: 'https://i.imgur.com/hJr0Ay6.png',
    logo: 'ES',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'ESPN 2 HD',
    url: 'http://46.151.196.223:14438',
    number: '42',
    category: 'ESPN',
    logoImage: 'http://smartvtcl.site:8080/images/865c0c0b4ab0e063e5caa3387c1a8741.png',
    logo: 'ES',
    sourceType: 'hls',
    playbackTransport: 'direct',
    description: 'Canal ESPN 2 HD.'
  },
  {
    name: 'ESPN 3 alternativo HD3',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/22007.ts',
    number: '43',
    category: 'ESPN',
    logoImage: 'https://i.imgur.com/hJr0Ay6.png',
    logo: 'ES',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'ESPN 3 HD',
    url: 'http://46.151.196.223:14444',
    number: '44',
    category: 'ESPN',
    logoImage: 'http://smartvtcl.site:8080/images/865c0c0b4ab0e063e5caa3387c1a8741.png',
    logo: 'ES',
    sourceType: 'hls',
    playbackTransport: 'direct',
    description: 'Canal ESPN 3 HD.'
  },
  {
    name: 'ESPN 4 alternativo HD3',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/22010.ts',
    number: '45',
    category: 'ESPN',
    logoImage: 'https://i.imgur.com/hJr0Ay6.png',
    logo: 'ES',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'ESPN 4 HD',
    url: 'http://46.151.196.223:14450',
    number: '46',
    category: 'ESPN',
    logoImage: 'http://smartvtcl.site:8080/images/865c0c0b4ab0e063e5caa3387c1a8741.png',
    logo: 'ES',
    sourceType: 'hls',
    playbackTransport: 'direct',
    description: 'Canal ESPN 4 HD.'
  },
  {
    name: 'ESPN 5 HD3',
    url: 'http://46.151.196.223:14456',
    number: '47',
    category: 'ESPN',
    logoImage: 'https://i.imgur.com/hJr0Ay6.png',
    logo: 'ES',
    sourceType: 'hls',
    playbackTransport: 'direct',
    description: 'Canal ESPN 5 HD.'
  },
  {
    name: 'ESPN 5 alternativo HD3',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/22013.ts',
    number: '48',
    category: 'ESPN',
    logoImage: 'https://i.imgur.com/hJr0Ay6.png',
    logo: 'ES',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'ESPN 6 alternativo HD3',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/22016.ts',
    number: '49',
    category: 'ESPN',
    logoImage: 'https://i.imgur.com/hJr0Ay6.png',
    logo: 'ES',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'ESPN 6 HD',
    url: 'http://hls1.sua.tv:80/live/espnextrafhd/s.m3u8',
    number: '50',
    category: 'ESPN',
    logoImage: 'http://smartvtcl.site:8080/images/865c0c0b4ab0e063e5caa3387c1a8741.png',
    logo: 'ES',
    sourceType: 'hls',
    playbackTransport: 'direct',
    description: 'Canal ESPN 6 HD.'
  },
  {
    name: 'A&E FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12000.ts',
    number: '51',
    category: 'Canais | Variedades',
    logoImage: 'http://www.fontedecanais.tv/logos/canais/ae.png',
    logo: 'AE',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'A&E HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12001.ts',
    number: '52',
    category: 'Canais | Variedades',
    logoImage: 'http://www.fontedecanais.tv/logos/canais/ae.png',
    logo: 'AE',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'A&E SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12002.ts',
    number: '53',
    category: 'Canais | Variedades',
    logoImage: 'http://www.fontedecanais.tv/logos/canais/ae.png',
    logo: 'AE',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'BIS FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12003.ts',
    number: '54',
    category: 'Canais | Variedades',
    logoImage: 'http://www.fontedecanais.tv/logos/canais/bis.png',
    logo: 'BI',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'BIS HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12004.ts',
    number: '55',
    category: 'Canais | Variedades',
    logoImage: 'http://www.fontedecanais.tv/logos/canais/bis.png',
    logo: 'BI',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'BIS SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12005.ts',
    number: '56',
    category: 'Canais | Variedades',
    logoImage: 'http://www.fontedecanais.tv/logos/canais/bis.png',
    logo: 'BI',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Discovery H&H FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12012.ts',
    number: '57',
    category: 'Canais | Variedades',
    logoImage: 'http://www.fontedecanais.tv/logos/canais/discoveryhh.png',
    logo: 'DH',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Discovery H&H HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12013.ts',
    number: '58',
    category: 'Canais | Variedades',
    logoImage: 'http://www.fontedecanais.tv/logos/canais/discoveryhh.png',
    logo: 'DH',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Discovery H&H SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12014.ts',
    number: '59',
    category: 'Canais | Variedades',
    logoImage: 'http://www.fontedecanais.tv/logos/canais/discoveryhh.png',
    logo: 'DH',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Discovery Turbo FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12015.ts',
    number: '60',
    category: 'Canais | Variedades',
    logoImage: 'http://www.fontedecanais.tv/logos/canais/discoveryturbo.png',
    logo: 'DT',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Discovery Turbo HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12016.ts',
    number: '61',
    category: 'Canais | Variedades',
    logoImage: 'http://www.fontedecanais.tv/logos/canais/discoveryturbo.png',
    logo: 'DT',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Discovery Turbo SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12017.ts',
    number: '62',
    category: 'Canais | Variedades',
    logoImage: 'http://www.fontedecanais.tv/logos/canais/discoveryturbo.png',
    logo: 'DT',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'E! FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12018.ts',
    number: '63',
    category: 'Canais | Variedades',
    logoImage: 'http://www.fontedecanais.tv/logos/canais/e.png',
    logo: 'E!',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'E! HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12019.ts',
    number: '64',
    category: 'Canais | Variedades',
    logoImage: 'http://www.fontedecanais.tv/logos/canais/e.png',
    logo: 'E!',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'E! SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12020.ts',
    number: '65',
    category: 'Canais | Variedades',
    logoImage: 'http://www.fontedecanais.tv/logos/canais/e.png',
    logo: 'E!',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Food Network FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12024.ts',
    number: '66',
    category: 'Canais | Variedades',
    logoImage: 'http://www.fontedecanais.tv/logos/canais/foodnetwork.png',
    logo: 'FN',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Food Network HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12025.ts',
    number: '67',
    category: 'Canais | Variedades',
    logoImage: 'http://www.fontedecanais.tv/logos/canais/foodnetwork.png',
    logo: 'FN',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Food Network SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12026.ts',
    number: '68',
    category: 'Canais | Variedades',
    logoImage: 'http://www.fontedecanais.tv/logos/canais/foodnetwork.png',
    logo: 'FN',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'GNT FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12027.ts',
    number: '69',
    category: 'Canais | Variedades',
    logoImage: 'http://www.fontedecanais.tv/logos/canais/gnt.png',
    logo: 'GN',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'GNT HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12028.ts',
    number: '70',
    category: 'Canais | Variedades',
    logoImage: 'http://www.fontedecanais.tv/logos/canais/gnt.png',
    logo: 'GN',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'GNT SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12029.ts',
    number: '71',
    category: 'Canais | Variedades',
    logoImage: 'http://www.fontedecanais.tv/logos/canais/gnt.png',
    logo: 'GN',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Multishow FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12045.ts',
    number: '72',
    category: 'Canais | Variedades',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Multishow HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12046.ts',
    number: '73',
    category: 'Canais | Variedades',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Multishow SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12047.ts',
    number: '74',
    category: 'Canais | Variedades',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Off FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12048.ts',
    number: '75',
    category: 'Canais | Variedades',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Off HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12049.ts',
    number: '76',
    category: 'Canais | Variedades',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Off SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12050.ts',
    number: '77',
    category: 'Canais | Variedades',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'TLC FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12051.ts',
    number: '78',
    category: 'Canais | Variedades',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'TLC HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12052.ts',
    number: '79',
    category: 'Canais | Variedades',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'TLC SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12053.ts',
    number: '80',
    category: 'Canais | Variedades',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Globoplay Novelas FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12060.ts',
    number: '81',
    category: 'Canais | Variedades',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Globoplay Novelas HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12061.ts',
    number: '82',
    category: 'Canais | Variedades',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Globoplay Novelas SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12062.ts',
    number: '83',
    category: 'Canais | Variedades',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'AMC FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13000.ts',
    number: '84',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'AMC HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13001.ts',
    number: '85',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'AMC SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13002.ts',
    number: '86',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'AXN FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13003.ts',
    number: '87',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'AXN HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13004.ts',
    number: '88',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'AXN SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13005.ts',
    number: '89',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Cinemax FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13009.ts',
    number: '90',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Cinemax HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13010.ts',
    number: '91',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Cinemax SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13011.ts',
    number: '92',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Megapix FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13015.ts',
    number: '93',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Megapix HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13016.ts',
    number: '94',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Megapix SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13017.ts',
    number: '95',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Sony Channel FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13021.ts',
    number: '96',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Sony Channel HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13022.ts',
    number: '97',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Sony Channel SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13023.ts',
    number: '98',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Sony Movies FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13024.ts',
    number: '99',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Sony Movies HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13025.ts',
    number: '100',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Sony Movies SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13026.ts',
    number: '101',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Space FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13027.ts',
    number: '102',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Space HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13028.ts',
    number: '103',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Space SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13029.ts',
    number: '104',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'TNT Novelas FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13036.ts',
    number: '105',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'TNT Novelas HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13037.ts',
    number: '106',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'TNT Novelas SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13038.ts',
    number: '107',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'TNT FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13039.ts',
    number: '108',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'TNT HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13040.ts',
    number: '109',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'TNT SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13041.ts',
    number: '110',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'TNT Séries FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13042.ts',
    number: '111',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'TNT Séries HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13043.ts',
    number: '112',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'TNT Séries SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13044.ts',
    number: '113',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Universal TV FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13045.ts',
    number: '114',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Universal TV HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13046.ts',
    number: '115',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Universal TV SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13047.ts',
    number: '116',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Studio Universal FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13048.ts',
    number: '117',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Studio Universal HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13049.ts',
    number: '118',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Studio Universal SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13050.ts',
    number: '119',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Warner Channel FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13051.ts',
    number: '120',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Warner Channel HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13052.ts',
    number: '121',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Warner Channel SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13053.ts',
    number: '122',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'TCM FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13054.ts',
    number: '123',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'TCM HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13055.ts',
    number: '124',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'TCM SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13056.ts',
    number: '125',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Film & Arts FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13057.ts',
    number: '126',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Film & Arts HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13058.ts',
    number: '127',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Film & Arts SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13059.ts',
    number: '128',
    category: 'Canais | Filmes e Séries',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'HBO FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/14000.ts',
    number: '129',
    category: 'Canais | HBO',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'HBO HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/14001.ts',
    number: '130',
    category: 'Canais | HBO',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'HBO SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/14002.ts',
    number: '131',
    category: 'Canais | HBO',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'HBO 2 FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/14003.ts',
    number: '132',
    category: 'Canais | HBO',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'HBO 2 HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/14004.ts',
    number: '133',
    category: 'Canais | HBO',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'HBO 2 SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/14005.ts',
    number: '134',
    category: 'Canais | HBO',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'HBO Family FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/14006.ts',
    number: '135',
    category: 'Canais | HBO',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'HBO Family HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/14007.ts',
    number: '136',
    category: 'Canais | HBO',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'HBO Family SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/14008.ts',
    number: '137',
    category: 'Canais | HBO',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'HBO Mundi FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/14009.ts',
    number: '138',
    category: 'Canais | HBO',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'HBO Mundi HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/14010.ts',
    number: '139',
    category: 'Canais | HBO',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'HBO Mundi SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/14011.ts',
    number: '140',
    category: 'Canais | HBO',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'HBO Plus FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/14012.ts',
    number: '141',
    category: 'Canais | HBO',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'HBO Plus HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/14013.ts',
    number: '142',
    category: 'Canais | HBO',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'HBO Plus SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/14014.ts',
    number: '143',
    category: 'Canais | HBO',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'HBO Pop FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/14015.ts',
    number: '144',
    category: 'Canais | HBO',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'HBO Pop HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/14016.ts',
    number: '145',
    category: 'Canais | HBO',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'HBO Pop SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/14017.ts',
    number: '146',
    category: 'Canais | HBO',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'HBO Signature FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/14018.ts',
    number: '147',
    category: 'Canais | HBO',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'HBO Signature HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/14019.ts',
    number: '148',
    category: 'Canais | HBO',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'HBO Signature SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/14020.ts',
    number: '149',
    category: 'Canais | HBO',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'HBO Xtreme FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/14021.ts',
    number: '150',
    category: 'Canais | HBO',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'HBO Xtreme HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/14022.ts',
    number: '151',
    category: 'Canais | HBO',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'HBO Xtreme SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/14023.ts',
    number: '152',
    category: 'Canais | HBO',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Telecine Action FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/15000.ts',
    number: '153',
    category: 'Canais | Telecine',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Telecine Action HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/15001.ts',
    number: '154',
    category: 'Canais | Telecine',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Telecine Action SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/15002.ts',
    number: '155',
    category: 'Canais | Telecine',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Telecine Cult FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/15003.ts',
    number: '156',
    category: 'Canais | Telecine',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Telecine Cult HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/15004.ts',
    number: '157',
    category: 'Canais | Telecine',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Telecine Cult SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/15005.ts',
    number: '158',
    category: 'Canais | Telecine',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Telecine Fun FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/15006.ts',
    number: '159',
    category: 'Canais | Telecine',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Telecine Fun HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/15007.ts',
    number: '160',
    category: 'Canais | Telecine',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Telecine Fun SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/15008.ts',
    number: '161',
    category: 'Canais | Telecine',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Telecine Pipoca FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/15009.ts',
    number: '162',
    category: 'Canais | Telecine',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Telecine Pipoca HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/15010.ts',
    number: '163',
    category: 'Canais | Telecine',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Telecine Pipoca SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/15011.ts',
    number: '164',
    category: 'Canais | Telecine',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Telecine Premium FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/15012.ts',
    number: '165',
    category: 'Canais | Telecine',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Telecine Premium HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/15013.ts',
    number: '166',
    category: 'Canais | Telecine',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Telecine Premium SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/15014.ts',
    number: '167',
    category: 'Canais | Telecine',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Telecine Touch FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/15015.ts',
    number: '168',
    category: 'Canais | Telecine',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Telecine Touch HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/15016.ts',
    number: '169',
    category: 'Canais | Telecine',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Telecine Touch SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/15017.ts',
    number: '170',
    category: 'Canais | Telecine',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Cultura FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/17003.ts',
    number: '171',
    category: 'Canais | Abertos',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Cultura HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/17004.ts',
    number: '172',
    category: 'Canais | Abertos',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Cultura SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/17005.ts',
    number: '173',
    category: 'Canais | Abertos',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Futura FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/17006.ts',
    number: '174',
    category: 'Canais | Abertos',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Futura HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/17007.ts',
    number: '175',
    category: 'Canais | Abertos',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Futura SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/17008.ts',
    number: '176',
    category: 'Canais | Abertos',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'RedeTV! FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/17036.ts',
    number: '177',
    category: 'Canais | Abertos',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'RedeTV! HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/17037.ts',
    number: '178',
    category: 'Canais | Abertos',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'RedeTV! SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/17038.ts',
    number: '179',
    category: 'Canais | Abertos',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'SBT FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/17039.ts',
    number: '180',
    category: 'Canais | Abertos',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'SBT HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/17040.ts',
    number: '181',
    category: 'Canais | Abertos',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'SBT SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/17041.ts',
    number: '182',
    category: 'Canais | Abertos',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Combate FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/19006.ts',
    number: '183',
    category: 'Canais | Esportes',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Combate HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/19007.ts',
    number: '184',
    category: 'Canais | Esportes',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Combate SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/19008.ts',
    number: '185',
    category: 'Canais | Esportes',
    logoImage: '',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  }
];

export const CHANNELS = PRIMARY_CHANNELS;
