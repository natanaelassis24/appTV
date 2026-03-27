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
    name: 'Caze TV',
    url: 'https://amg01391-amg01391c10-tcl-br-9630.playouts.now.amagi.tv/playlist.m3u8',
    number: '1',
    category: 'Canais',
    logoImage: 'https://www.cxtv.com.br/img/Tvs/Logo/webp-m/ed777683fdb619972ae85298a4925b40.webp',
    logo: 'CZ',
    sourceType: 'hls',
    description: 'Canal esportivo e eventos ao vivo.'
  },
  {
    name: 'SBT | interior de SP',
    url: 'https://cdn.jmvstream.com/w/LVW-10801/LVW10801_Xvg4R0u57n/chunklist.m3u8',
    number: '2',
    category: 'Canais',
    logoImage: 'https://i.imgur.com/srURmsi.png',
    logo: 'SB',
    sourceType: 'hls',
    description: 'Afiliada do SBT.'
  },
  {
    name: 'TV Cultura | Sao Paulo',
    url: 'https://player-tvcultura.stream.uol.com.br/live/tvcultura_lsd.m3u8',
    number: '3',
    category: 'Canais',
    logoImage: 'https://i.imgur.com/zmheeSl.png',
    logo: 'TC',
    sourceType: 'hls',
    description: 'Canal educativo e cultural.'
  },
  {
  name: 'Cartoonito',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/cartoonito.m3u8',
  number: '4',
  category: 'Canais',
  logoImage: 'https://i.pinimg.com/736x/27/a7/d3/27a7d36f3ac0a60c681d5cc295de819f.jpg',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Cartoon Network',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/cartoonnetwork.m3u8',
  number: '5',
  category: 'Canais',
  logoImage: 'https://yt3.googleusercontent.com/K4BGYVFPK9QWZiLLP49cRkxl-QtR8gLvmjLTkiRS1e97fnrAfdmIjdFj4mmIgarHySptEdAs=s160-c-k-c0x00ffffff-no-rj',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Discovery Kids',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/discoverykids.m3u8',
  number: '6',
  category: 'Canais',
  logoImage: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/i/afaaa8ee-bea2-45b3-9bb4-7096c9802384/dfr9d72-eba46bad-4916-4f69-981d-e4f948d8eb6c.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Cinemax',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/cinemax.m3u8',
  number: '7',
  category: 'Canais',
  logoImage: 'https://download.logo.wine/logo/Cinemax/Cinemax-Logo.wine.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'AXN',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/axn.m3u8',
  number: '8',
  category: 'Canais',
  logoImage: 'https://cdn.telaviva.com.br/wp-content/uploads/2016/02/Novo-logo-AXN.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Band',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/band.m3u8',
  number: '9',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/Band_Marca.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'CNN Brasil',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/cnnbrasil.m3u8',
  number: '10',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/CNN_International_logo.svg/3840px-CNN_International_logo.svg.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Combate',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/combate.m3u8',
  number: '11',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/e/ed/Canal-combate-logo.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'A&E',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/ae.m3u8',
  number: '12',
  category: 'Canais',
  logoImage: 'https://images.seeklogo.com/logo-png/21/1/ae-network-logo-png_seeklogo-219139.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Animal Planet',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/animalplanet.m3u8',
  number: '13',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/2018_Animal_Planet_logo.svg/960px-2018_Animal_Planet_logo.svg.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Comedy Central',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/comedycentral.m3u8',
  number: '14',
  category: 'Canais',
  logoImage: 'https://logodownload.org/wp-content/uploads/2021/05/comedy-central-logo-0.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Discovery Channel',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/discoverychannel.m3u8',
  number: '15',
  category: 'Canais',
  logoImage: 'https://logodownload.org/wp-content/uploads/2017/04/discovery-channel-logo-0.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Discovery H&H',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/discoveryhh.m3u8',
  number: '16',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Discovery_h%26h.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Discovery ID',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/discoveryid.m3u8',
  number: '17',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/ID_-_Investiga%C3%A7%C3%A3o_Discovery.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Discovery Science',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/discoveryscience.m3u8',
  number: '18',
  category: 'Canais',
  logoImage: 'https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/082015/discovery-science.png?itok=NDlWi00F',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Discovery Theater',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/discoverytheather.m3u8',
  number: '19',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/2015_Discovery_theater_HD_logo.svg/120px-2015_Discovery_theater_HD_logo.svg.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Discovery Turbo',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/discoveryturbo.m3u8',
  number: '20',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/1/11/Discovery_Turbo.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Espn',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/espn.m3u8',
  number: '21',
  category: 'Canais',
  logoImage: 'https://a1.espncdn.com/combiner/i?img=%2Fi%2Fespn%2Fespn_logos%2Fespn_red.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Espn 2',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/espn2.m3u8',
  number: '22',
  category: 'Canais',
  logoImage: 'https://i.pinimg.com/736x/97/d5/81/97d581566431fe83e4d8f390424b9987.jpg',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Food Network',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/foodnetwork.m3u8',
  number: '23',
  category: 'Canais',
  logoImage: 'https://logos-world.net/wp-content/uploads/2023/05/Food-Network-Logo-2003.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Gloob',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/gloob.m3u8',
  number: '24',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Gloob_logo.svg/1280px-Gloob_logo.svg.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'HBO',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/hbo.m3u8',
  number: '25',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/d/de/HBO_logo.svg',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'HBO 2',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/hbo2.m3u8',
  number: '26',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/6/6c/HBO2_logo.svg',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'HBO Family',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/hbofamily.m3u8',
  number: '27',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/3/3a/HBO_Family_logo.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'HBO Mundi',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/hbomundi.m3u8',
  number: '28',
  category: 'Canais',
  logoImage: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbAXp130AYAc4pXI_m-PqxrYip5VQCNRfUVA&s',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'HBO Plus',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/hboplus.m3u8',
  number: '29',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/3/3d/HBO_Plus.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'HBO POP',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/hbopop.m3u8',
  number: '30',
  category: 'Canais',
  logoImage: 'https://tvmap.com.br/images/ch/665.jpg',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'HBO Xtreme',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/hboxtreme.m3u8',
  number: '31',
  category: 'Canais',
  logoImage: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyfzy_zryHCA8eh6XVhjEB3jjVQZ5W4qUmRA&s',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'History',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/history.m3u8',
  number: '32',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/History_Logo.svg/960px-History_Logo.svg.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'History 2',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/history2.m3u8',
  number: '33',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/a/a3/History2Logo2019.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Megapix',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/megapix.m3u8',
  number: '34',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Megapix_logo_2011.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'MTV',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/mtv.m3u8',
  number: '35',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/6/68/MTV_2021_%28brand_version%29.svg',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Multishow',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/multishow.m3u8',
  number: '36',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/3/34/Multishow_logo_red_2012.svg',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'OFF',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/off.m3u8',
  number: '37',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Logo_Canal_OFF.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Sony Channel',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/sonychannel.m3u8',
  number: '38',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Sony_Channel_Logo_2019.svg',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Space',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/space.m3u8',
  number: '39',
  category: 'Canais',
  logoImage: 'https://logos-world.net/wp-content/uploads/2023/03/Space-Logo.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'PT – Sporttv 1',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/pt_sportv1.m3u8',
  number: '40',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Sport_TV1_%282023%29.svg',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'PT – Sporttv 3',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/pt_sportv3.m3u8',
  number: '41',
  category: 'Canais',
  logoImage: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTcmyMFb2fSC-c_ngRvLBnUzF-nxgyfVES3Nw&s',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'PT – Sporttv 2',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/pt_sportv2.m3u8',
  number: '42',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Sport_TV2_%282023%29.svg',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'PT – Sporttv 4',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/pt_sportv4.m3u8',
  number: '43',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Sport_TV4_%282023%29.svg',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'TCM',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/tcm.m3u8',
  number: '44',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Turner_Classic_Movies_%28TCM%2C_Latin_America%29_-_2015_logo.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Telecine Action',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/telecineaction.m3u8',
  number: '45',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Telecine_Action.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Telecine Cult',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/telecinecult.m3u8',
  number: '46',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Telecine_Cult.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Telecine Fun',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/telecinefun.m3u8',
  number: '47',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Telecine_Fun_2.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Telecine Pipoca',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/telecinepipoca.m3u8',
  number: '48',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Telecine_Pipoca.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Telecine Premium',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/telecinepremium.m3u8',
  number: '49',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/0/09/Telecine_Premium.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Telecine Touch',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/telecinetouch.m3u8',
  number: '50',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/a/a1/Telecine_Touch.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'TNT',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/tnt.m3u8',
  number: '51',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Warner_Bros_logo.svg/500px-Warner_Bros_logo.svg.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'TNT Novelas',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/tntnovelas.m3u8',
  number: '52',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/6/68/Logo_TNT_Series.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'TNT Series',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/tntseries.m3u8',
  number: '53',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/8/86/TNT_Series.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Universal',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/universaltv.m3u8',
  number: '54',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/b/b6/Universal_Pictures_logo.svg',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Warnerchannel',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/warnerchannel.m3u8',
  number: '55',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Warner_Bros_logo.svg/500px-Warner_Bros_logo.svg.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Globo SP',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/globosp.m3u8',
  number: '56',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/1/1f/TV_Globo_logo_%28April_2025%29.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Anime Tv HD',
  url: 'https://stmv1.srvif.com/loadingtv/loadingtv/playlist.m3u8',
  number: '57',
  category: 'Canais',
  logoImage: 'https://play-lh.googleusercontent.com/vpD-d5ZaBRTp38lfj99xqgBmaMUw7qBJvYifWUSyn-jUssDzzRgza9YXq8Eyq6zm-Duo',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Nickelodeon',
  url: 'http://s.webdosdeuses.top/live/gub233/68nz2p/235072.m3u8',
  number: '58',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Nickelodeon_2023_logo_%28outline%29.svg',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Geekdot',
  url: 'https://stream.ichibantv.com:3764/hybrid/play.m3u8',
  number: '59',
  category: 'Canais',
  logoImage: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEisfDkOTiFl-j8cbHNA8lWMrspWTIrAbWHk9jkbTWNXRZNPYS2vJBsqcgmzubXHdNvnhKawKjOkTZUEghsRY3v94XY4K6s985gd8BxsNTcnyQficUrh3MTtLyLSf9idPtMAIzN5CzM48s1336MbWti5uIDTM5Z69UAPAYA0IAqifcyZyhIxS_FiazpGSPg/w1200-h630-p-k-no-nu/GEEKDOT.webp',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Dragon Ball Z 24h',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/24h_dragonball.m3u8',
  number: '60',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Dragon_Ball_Z_Logo_A.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Os Simpsons 24h',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/24h_simpsons.m3u8',
  number: '61',
  category: 'Canais',
  logoImage: 'https://static.wikia.nocookie.net/logopedia/images/5/56/Os-simpsons.jpg/revision/latest?cb=20180130030411',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Band Sports',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/bandsports.m3u8',
  number: '61',
  category: 'Canais',
  logoImage: 'https://upload.wikimedia.org/wikipedia/commons/f/f7/BandSports_logo.svg',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Premiere 1',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/premiere.m3u8',
  number: '63',
  category: 'Canais',
  logoImage: 'https://iconape.com/wp-content/files/zc/279842/png/279842.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Premiere 2',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/premiere2.m3u8',
  number: '64',
  category: 'Canais',
  logoImage: 'https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/0023/3103/brand.gif?itok=8x9EKnHX',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Premiere 3',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/premiere3.m3u8',
  number: '65',
  category: 'Canais',
  logoImage: 'https://iconape.com/wp-content/files/kz/279837/png/279837.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Premiere 4',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/premiere4.m3u8',
  number: '66',
  category: 'Canais',
  logoImage: 'https://iconape.com/wp-content/files/qe/279774/png/279774.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Premiere 5',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/premiere5.m3u8',
  number: '67',
  category: 'Canais',
  logoImage: 'https://iconape.com/wp-content/files/ep/278491/png/278491.png',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Premiere 6',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/premiere6.m3u8',
  number: '68',
  category: 'Canais',
  logoImage: 'https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/0023/4412/brand.gif?itok=bS4_hURf',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
{
  name: 'Premiere 7',
  url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/premiere7.m3u8',
  number: '69',
  category: 'Canais',
  logoImage: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRV9H1moX_VI4fveLA9NkdWOr7F-kiNCechzw&s',
  logo: 'NC',
  sourceType: 'hls',
  description: 'Descricao curta do canal.'
},
  {
    name: 'Premiere 8',
    url: 'https://streamverde.s27-usa-cloudfront-net.online/fontes/streamverde/premiere8.m3u8',
    number: '70',
    category: 'Canais',
    logoImage: 'https://i.pinimg.com/736x/73/df/cd/73dfcdf4e6c88fdcc86e80a05cf13048.jpg',
    logo: 'NC',
    sourceType: 'hls',
    description: 'Descricao curta do canal.'
  },
  {
    name: 'South Park 24h',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/38010.ts',
    number: '71',
    category: 'Canais',
    logoImage: 'http://www.fontedecanais.tv/logos/canais/24h.png',
    logo: 'T1',
    sourceType: 'file',
    playbackTransport: 'direct',
    description: 'Stream TS direto compatível com VLC.'
  },
  {
    name: 'Os Simpsons 24h',
    url: 'http://sinalmycn.com:80/live/632035/GqGcFV4ntu/38000.ts',
    number: '72',
    category: 'Canais',
    logoImage: 'http://www.fontedecanais.tv/logos/canais/24h.png',
    logo: 'SM',
    sourceType: 'file',
    playbackTransport: 'proxy',
    description: 'Stream TS direto compatível com VLC.'
  }
];

export const CHANNELS = PRIMARY_CHANNELS;
