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

export function isHdChannel(channel) {
  const normalizedName = String(channel?.name || '').toLowerCase();

  if (!normalizedName) {
    return false;
  }

  return normalizedName.includes('hd')
    && !normalizedName.includes('fhd')
    && !normalizedName.includes('sd');
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
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/9/98/The_Simpsons_yellow_logo.svg',
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
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Naruto_logo.svg/1280px-Naruto_logo.svg.png',
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
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Logo_Naruto_Shipp%C5%ABden.svg/1280px-Logo_Naruto_Shipp%C5%ABden.svg.png',
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
    logoImage: 'https://img.observatoriodatv.com.br/wp-content/uploads/2016/05/Dois-Homens-e-Meio.png',
    logo: 'SM',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Cartoon Network HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/24004.ts',
    number: '5',
    category: 'Canais',
    logoImage: 'https://yt3.googleusercontent.com/K4BGYVFPK9QWZiLLP49cRkxl-QtR8gLvmjLTkiRS1e97fnrAfdmIjdFj4mmIgarHySptEdAs=s160-c-k-c0x00ffffff-no-rj',
    logo: 'SM',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Box Kids HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/24001.ts',
    number: '6',
    category: 'Canais',
    logoImage: 'https://boxbrazil.tv.br/assets/images/pages/boxKids/images/imgTitle.png',
    logo: 'SM',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'SPORTV HD',
    url: 'http://46.151.196.223:14286',
    number: '7',
    category: 'Canais | SPORTV',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Sport_TV1_%282023%29.svg',
    logo: 'SP',
    sourceType: 'hls',
    playbackTransport: 'direct',
    description: 'Canal SPORTV HD.'
  },
  {
    name: 'SPORTV 2 HD',
    url: 'http://2025easy.lat:80/live/rc8zew5u/21231sw2/1487667.ts',
    number: '8',
    category: 'Canais | SPORTV',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Sport_TV2_%282023%29.svg',
    logo: 'SP',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'SPORTV 3 HD',
    url: 'http://79.127.243.211:14473',
    number: '9',
    category: 'Canais | SPORTV',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Sport_TV3_%282023%29.svg',
    logo: 'SP',
    sourceType: 'hls',
    playbackTransport: 'direct',
    description: 'Canal SPORTV 3 HD.'
  },
  {
    name: 'PREMIERE CLUBES HD',
    url: 'http://2025easy.lat:80/live/rc8zew5u/21231sw2/608078.ts',
    number: '10',
    category: 'Canais | PREMIERE',
    logoImage: 'https://s3.glbimg.com/v1/AUTH_36abb2af534644878388f516c38b89ac/prod/home-share-1b75cdaa.png',
    logo: 'PR',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'PREMIERE 2 HD',
    url: 'http://2025easy.lat:80/live/rc8zew5u/21231sw2/608085.ts',
    number: '11',
    category: 'Canais | PREMIERE',
    logoImage: 'https://s3.glbimg.com/v1/AUTH_36abb2af534644878388f516c38b89ac/prod/home-share-1b75cdaa.png',
    logo: 'PR',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'PREMIERE 3 HD',
    url: 'http://2025easy.lat:80/live/rc8zew5u/21231sw2/608092.ts',
    number: '12',
    category: 'Canais | PREMIERE',
    logoImage: 'https://s3.glbimg.com/v1/AUTH_36abb2af534644878388f516c38b89ac/prod/home-share-1b75cdaa.png',
    logo: 'PR',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'PREMIERE 4 HD',
    url: 'http://2025easy.lat:80/live/rc8zew5u/21231sw2/608099.ts',
    number: '13',
    category: 'Canais | PREMIERE',
    logoImage: 'https://s3.glbimg.com/v1/AUTH_36abb2af534644878388f516c38b89ac/prod/home-share-1b75cdaa.png',
    logo: 'PR',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'PREMIERE 5 HD',
    url: 'http://2025easy.lat:80/live/rc8zew5u/21231sw2/608106.ts',
    number: '14',
    category: 'Canais | PREMIERE',
    logoImage: 'https://s3.glbimg.com/v1/AUTH_36abb2af534644878388f516c38b89ac/prod/home-share-1b75cdaa.png',
    logo: 'PR',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'PREMIERE 6 HD',
    url: 'http://2025easy.lat:80/live/rc8zew5u/21231sw2/608119.ts',
    number: '15',
    category: 'Canais | PREMIERE',
    logoImage: 'https://s3.glbimg.com/v1/AUTH_36abb2af534644878388f516c38b89ac/prod/home-share-1b75cdaa.png',
    logo: 'PR',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'PREMIERE 7 HD',
    url: 'http://2025easy.lat:80/live/rc8zew5u/21231sw2/608126.ts',
    number: '16',
    category: 'Canais | PREMIERE',
    logoImage: 'https://s3.glbimg.com/v1/AUTH_36abb2af534644878388f516c38b89ac/prod/home-share-1b75cdaa.png',
    logo: 'PR',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'PREMIERE 8 HD',
    url: 'http://2025easy.lat:80/live/rc8zew5u/21231sw2/608131.ts',
    number: '17',
    category: 'Canais | PREMIERE',
    logoImage: 'https://s3.glbimg.com/v1/AUTH_36abb2af534644878388f516c38b89ac/prod/home-share-1b75cdaa.png',
    logo: 'PR',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'ESPN HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/22001.ts',
    number: '18',
    category: 'ESPN',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_wordmark.svg/1280px-ESPN_wordmark.svg.png',
    logo: 'ES',
    sourceType: 'hls',
    playbackTransport: 'direct',
    description: 'Canal ESPN HD.'
  },
  {
    name: 'ESPN 2 HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/22004.ts',
    number: '19',
    category: 'ESPN',
    logoImage: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ99S46AptMJtnVRIcGopBYycpJwTS6AeYcrQ&s',
    logo: 'ES',
    sourceType: 'hls',
    playbackTransport: 'direct',
    description: 'Canal ESPN 2 HD.'
  },
  {
    name: 'ESPN 3 HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/22007.ts',
    number: '20',
    category: 'ESPN',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/5/51/ESPN3_Logo.png',
    logo: 'ES',
    sourceType: 'hls',
    playbackTransport: 'direct',
    description: 'Canal ESPN 3 HD.'
  },
  {
    name: 'ESPN 4 HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/22010.ts',
    number: '21',
    category: 'ESPN',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/ESPN_4_logo.svg/3840px-ESPN_4_logo.svg.png',
    logo: 'ES',
    sourceType: 'hls',
    playbackTransport: 'direct',
    description: 'Canal ESPN 4 HD.'
  },
  {
    name: 'ESPN 5 HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/22013.ts',
    number: '22',
    category: 'ESPN',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/ESPN_5_logo.svg/500px-ESPN_5_logo.svg.png',
    logo: 'ES',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Canal ESPN 5 HD.'
  },
  {
    name: 'ESPN 6 HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/22016.ts',
    number: '24',
    category: 'ESPN',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/ESPN_6_logo.svg/1280px-ESPN_6_logo.svg.png',
    logo: 'ES',
    sourceType: 'hls',
    playbackTransport: 'direct',
    description: 'Canal ESPN 6 HD.'
  },
  {
    name: 'A&E HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12001.ts',
    number: '23',
    category: 'Canais | Variedades',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Logo_AE_Germany.svg',
    logo: 'AE',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'BIS HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12004.ts',
    number: '24',
    category: 'Canais | Variedades',
    logoImage: 'https://static.wikia.nocookie.net/tvpediabrasil/images/7/7a/CanalBIS.png/revision/latest?cb=20180708003851&path-prefix=pt-br',
    logo: 'BI',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Discovery H&H HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12013.ts',
    number: '25',
    category: 'Canais | Variedades',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Discovery_H%26H_Logo_2022.webp',
    logo: 'DH',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Discovery Turbo HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12016.ts',
    number: '26',
    category: 'Canais | Variedades',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Discovery_Turbo_logo.svg/3840px-Discovery_Turbo_logo.svg.png',
    logo: 'DT',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'E! HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12019.ts',
    number: '27',
    category: 'Canais | Variedades',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/E%21_Logo.svg',
    logo: 'E!',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Food Network HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12025.ts',
    number: '28',
    category: 'Canais | Variedades',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/f/f4/Food_Network_-_Logo_2016.png',
    logo: 'FN',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'GNT HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12028.ts',
    number: '29',
    category: 'Canais | Variedades',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/a/a4/GNT_logo-roxo.svg',
    logo: 'GN',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Multishow HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12046.ts',
    number: '30',
    category: 'Canais | Variedades',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/3/34/Multishow_logo_red_2012.svg',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Off HD',
    url: 'https://logodownload.org/wp-content/uploads/2017/08/canal-off-logo-5.png',
    number: '31',
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
    number: '32',
    category: 'Canais | Variedades',
    logoImage: 'https://logodownload.org/wp-content/uploads/2016/09/tcl-logo-1.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Globoplay Novelas HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/12061.ts',
    number: '33',
    category: 'Canais | Variedades',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Logo_Globoplay.jpg',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'AMC HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13001.ts',
    number: '34',
    category: 'Canais | Filmes e Séries',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Amc_logo_2013.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'AXN HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13004.ts',
    number: '35',
    category: 'Canais | Filmes e Séries',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/3/37/AXN_Logo.PNG',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Cinemax HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13010.ts',
    number: '36',
    category: 'Canais | Filmes e Séries',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Cinemax_LA.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Megapix HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13016.ts',
    number: '37',
    category: 'Canais | Filmes e Séries',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Megapix_logo_2011.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Sony Channel HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13022.ts',
    number: '38',
    category: 'Canais | Filmes e Séries',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Sony_Channel_Logo.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Sony Movies HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13025.ts',
    number: '39',
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
    number: '40',
    category: 'Canais | Filmes e Séries',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Sony_Movies_Logo.svg',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'TNT Novelas HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13037.ts',
    number: '41',
    category: 'Canais | Filmes e Séries',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Logo_TNT_Novelas.png/250px-Logo_TNT_Novelas.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'TNT HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13040.ts',
    number: '42',
    category: 'Canais | Filmes e Séries',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/TNT_TV_logo.svg/3840px-TNT_TV_logo.svg.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'TNT Séries HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13043.ts',
    number: '43',
    category: 'Canais | Filmes e Séries',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/7/75/TNT_Series_Logo_2016.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Universal TV HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13046.ts',
    number: '44',
    category: 'Canais | Filmes e Séries',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Universal_TV_logo.svg/3840px-Universal_TV_logo.svg.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Studio Universal HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13049.ts',
    number: '45',
    category: 'Canais | Filmes e Séries',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Logo_Studio_Universal.svg/960px-Logo_Studio_Universal.svg.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Warner Channel HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13052.ts',
    number: '46',
    category: 'Canais | Filmes e Séries',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Warner2018LA.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'TCM HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13055.ts',
    number: '47',
    category: 'Canais | Filmes e Séries',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Turner_Classic_Movies_%28TCM%2C_Latin_America%29_-_2015_logo.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Film & Arts HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/13058.ts',
    number: '48',
    category: 'Canais | Filmes e Séries',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/c/c4/FILMANDARTS.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'HBO HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/14001.ts',
    number: '49',
    category: 'Canais | HBO',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/5/51/HBO_HD_logo.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'HBO 2 HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/14004.ts',
    number: '50',
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
    number: '51',
    category: 'Canais | HBO',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/HBO2_logo.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'HBO Mundi HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/14010.ts',
    number: '52',
    category: 'Canais | HBO',
    logoImage: 'https://static.wikia.nocookie.net/tvpediabrasil/images/d/d3/Hbomundi.png/revision/latest?cb=20200216144600&path-prefix=pt-br',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'HBO Plus HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/14013.ts',
    number: '53',
    category: 'Canais | HBO',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/3/3d/HBO_Plus.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'HBO Pop HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/14016.ts',
    number: '54',
    category: 'Canais | HBO',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/HBO_Pop.svg/960px-HBO_Pop.svg.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'HBO Signature HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/14019.ts',
    number: '55',
    category: 'Canais | HBO',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/a/af/HBO_Signature_Asia.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'HBO Xtreme HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/14022.ts',
    number: '56',
    category: 'Canais | HBO',
    logoImage: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyfzy_zryHCA8eh6XVhjEB3jjVQZ5W4qUmRA&s',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Telecine Action HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/15001.ts',
    number: '57',
    category: 'Canais | Telecine',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/3/37/Telecine_Action_2.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Telecine Cult HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/15004.ts',
    number: '58',
    category: 'Canais | Telecine',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Telecine_Cult_2019.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Telecine Fun HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/15007.ts',
    number: '59',
    category: 'Canais | Telecine',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Telecine_Fun_2.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Telecine Pipoca HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/15010.ts',
    number: '60',
    category: 'Canais | Telecine',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Telecine_Pipoca.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Telecine Premium HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/15013.ts',
    number: '61',
    category: 'Canais | Telecine',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/0/09/Telecine_Premium.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Telecine Touch HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/15016.ts',
    number: '62',
    category: 'Canais | Telecine',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/a/a1/Telecine_Touch.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Cultura HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/17004.ts',
    number: '63',
    category: 'Canais | Abertos',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Cultura_logo_2013.svg',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Futura HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/17007.ts',
    number: '64',
    category: 'Canais | Abertos',
    logoImage: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbs5fDt3_R5MWuWs5lKaXbtVwvyh04ng8u1A&s',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'RedeTV! HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/17037.ts',
    number: '65',
    category: 'Canais | Abertos',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/1/11/RedeTV%21_2019_logo.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'SBT HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/17040.ts',
    number: '66',
    category: 'Canais | Abertos',
    logoImage: 'https://upload.wikimedia.org/wikipedia/pt/4/41/Logotipo_do_SBT.svg',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Combate HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/19007.ts',
    number: '67',
    category: 'Canais | Esportes',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/e/ed/Canal-combate-logo.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'CazeTV 01',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/19068.ts',
    number: '68',
    category: 'Canais | Esportes',
    logoImage: 'https://upload.wikimedia.org/wikipedia/pt/2/22/Logotipo_da_Caz%C3%A9TV.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Animal Planet HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/23001.ts',
    number: '69',
    category: 'Canais | Documentários',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/2/20/2018_Animal_Planet_logo.svg',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'H2 HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/23022.ts',
    number: '70',
    category: 'Canais | Documentários',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/d/d1/H2_channel_logo.PNG',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'HGTV HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/23025.ts',
    number: '71',
    category: 'Canais | Documentários',
    logoImage: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5FcbVxagO9-gqhZ3tlZ2L4IOpd7XF-_UGiQ&s',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'History HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/23028.ts',
    number: '72',
    category: 'Canais | Documentários',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/History_Logo.svg/960px-History_Logo.svg.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'ID: Investigação Discovery HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/23031.ts',
    number: '73',
    category: 'Canais | Documentários',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/InvestigationDiscoveryLogo2020.svg/250px-InvestigationDiscoveryLogo2020.svg.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Cartoonito HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/24007.ts',
    number: '74',
    category: 'Canais | Infantis',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Cartoonito_-_Logo_2021.svg',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Discovery Kids HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/24010.ts',
    number: '75',
    category: 'Canais | Infantis',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/6/62/Discovery_kids_logo.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Gloob HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/24016.ts',
    number: '76',
    category: 'Canais | Infantis',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Gloob_logo.svg/1280px-Gloob_logo.svg.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Gloobinho HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/24019.ts',
    number: '77',
    category: 'Canais | Infantis',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Gloobinho_logo.svg/1280px-Gloobinho_logo.svg.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Tooncast HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/24028.ts',
    number: '78',
    category: 'Canais | Infantis',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/6/66/Tooncast.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Band News HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/25001.ts',
    number: '79',
    category: 'Canais | Notícias',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/2/27/BandNews_TV_logo_2010.svg',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'CNN Brasil HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/25004.ts',
    number: '80',
    category: 'Canais | Notícias',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/CNN_Brasil.svg/1280px-CNN_Brasil.svg.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Globo News HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/25007.ts',
    number: '81',
    category: 'Canais | Notícias',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Logotipo_da_GloboNews.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Record News HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/25013.ts',
    number: '82',
    category: 'Canais | Notícias',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/4/46/Record_News_logo_2023.svg',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'CNN Money HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/25016.ts',
    number: '83',
    category: 'Canais | Notícias',
    logoImage: 'https://images.seeklogo.com/logo-png/61/2/cnn-brasil-money-logo-png_seeklogo-612480.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'SBT News HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/25022.ts',
    number: '84',
    category: 'Canais | Notícias',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/SBT_News_logo.svg/1280px-SBT_News_logo.svg.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Band Sao Paulo HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/28022.ts',
    number: '85',
    category: 'Canais | Band',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Rede_Bandeirantes_logo_2011.svg/500px-Rede_Bandeirantes_logo_2011.svg.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Record TV São Paulo HD',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/27061.ts',
    number: '93',
    category: 'Canais | Record TV',
    logoImage: 'http://www.fontedecanais.tv/logos/canais/record.png',
    logo: '',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
    {
    name: 'Filmes Comédia 24H',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/38030.ts',
    number: '86',
    category: 'Canais | 24H',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Logo_canal_24h.svg/960px-Logo_canal_24h.svg.png',
    logo: 'FC',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Futurama 24H',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/38023.ts',
    number: '87',
    category: 'Canais | 24H',
    logoImage: 'https://pngimg.com/d/futurama_PNG26.png',
    logo: 'FA',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Boku no Hero Academia 24H',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/38019.ts',
    number: '88',
    category: 'Canais | 24H',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/1/18/My_Hero_Academia_logo_in_Japan_20150106.png',
    logo: 'BHA',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Big Bang Theory 24H',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/38018.ts',
    number: '89',
    category: 'Canais | 24H',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/TBBT_logo.svg/500px-TBBT_logo.svg.png',
    logo: 'BBT',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Dragon boll Z 24H',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/38015.ts',
    number: '90',
    category: 'Canais | 24H',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Dragon_Ball_Z_logo.svg',
    logo: 'DBZ',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Bob Esponja 24H',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/38005.ts',
    number: '91',
    category: 'Canais | 24H',
    logoImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Bob_esponja_logotipo.svg/960px-Bob_esponja_logotipo.svg.png',
    logo: 'BE',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Chaves 24H',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/38001.ts',
    number: '92',
    category: 'Canais | 24H',
    logoImage: 'https://static.wikia.nocookie.net/chespirito/images/9/93/Chaves_Logo_SBT_1993.png/revision/latest?cb=20180922203713&path-prefix=pt',
    logo: 'CS',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  },
];

export const CHANNELS = PRIMARY_CHANNELS;
