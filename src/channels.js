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
    logoImage: 'http://www.fontedecanais.tv/logos/canais/multishow.png',
    logo: 'MS',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Multishow HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12046.ts',
    number: '73',
    category: 'Canais | Variedades',
    logoImage: 'http://www.fontedecanais.tv/logos/canais/multishow.png',
    logo: 'MS',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Multishow SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12047.ts',
    number: '74',
    category: 'Canais | Variedades',
    logoImage: 'http://www.fontedecanais.tv/logos/canais/multishow.png',
    logo: 'MS',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Off FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12048.ts',
    number: '75',
    category: 'Canais | Variedades',
    logoImage: 'http://www.fontedecanais.tv/logos/canais/off.png',
    logo: 'OF',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Off HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12049.ts',
    number: '76',
    category: 'Canais | Variedades',
    logoImage: 'http://www.fontedecanais.tv/logos/canais/off.png',
    logo: 'OF',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Off SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12050.ts',
    number: '77',
    category: 'Canais | Variedades',
    logoImage: 'http://www.fontedecanais.tv/logos/canais/off.png',
    logo: 'OF',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'TLC FHD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12051.ts',
    number: '78',
    category: 'Canais | Variedades',
    logoImage: 'http://www.fontedecanais.tv/logos/canais/tlc.png',
    logo: 'TL',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'TLC HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12052.ts',
    number: '79',
    category: 'Canais | Variedades',
    logoImage: 'http://www.fontedecanais.tv/logos/canais/tlc.png',
    logo: 'TL',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'TLC SD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12053.ts',
    number: '80',
    category: 'Canais | Variedades',
    logoImage: 'http://www.fontedecanais.tv/logos/canais/tlc.png',
    logo: 'TL',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  }
];

export const CHANNELS = PRIMARY_CHANNELS;
