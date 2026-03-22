const fs = require('node:fs');
const path = require('node:path');

const inputPath = process.argv[2];

function printUsageAndExit(message) {
  if (message) {
    console.error(message);
    console.error('');
  }

  console.error('Uso: node verify-m3u.js <arquivo.m3u>');
  console.error('Exemplo: node verify-m3u.js lista-meutedio.m3u');

  const localM3uFiles = fs
    .readdirSync(process.cwd(), { withFileTypes: true })
    .filter(entry => entry.isFile() && /\.(m3u|m3u8|txt)$/i.test(entry.name))
    .map(entry => entry.name);

  if (localM3uFiles.length) {
    console.error('');
    console.error('Arquivos encontrados nesta pasta:');
    for (const file of localM3uFiles) {
      console.error(`- ${file}`);
    }
  }

  process.exit(1);
}

if (!inputPath) {
  printUsageAndExit();
}

const resolvedInputPath = path.resolve(inputPath);

if (!fs.existsSync(resolvedInputPath)) {
  printUsageAndExit(`Arquivo nao encontrado: ${resolvedInputPath}`);
}

const raw = fs.readFileSync(resolvedInputPath, 'utf8');
const lines = raw.split(/\r?\n/);
const entries = [];

let pendingMeta = null;

for (const line of lines) {
  const value = line.trim();
  if (!value) continue;

  if (value.startsWith('#EXTINF:')) {
    const name = value.split(',').slice(1).join(',').trim() || 'Canal sem nome';
    const groupMatch = value.match(/group-title="([^"]+)"/i);
    const logoMatch = value.match(/tvg-logo="([^"]+)"/i);

    pendingMeta = {
      name,
      category: groupMatch ? groupMatch[1] : 'Sem categoria',
      logoImage: logoMatch ? logoMatch[1] : ''
    };
    continue;
  }

  if (value.startsWith('#')) continue;

  if (pendingMeta && /^https?:\/\//i.test(value)) {
    entries.push({
      ...pendingMeta,
      url: value
    });
    pendingMeta = null;
  }
}

const uniqueEntries = [];
const seen = new Set();

for (const entry of entries) {
  const key = `${entry.name}::${entry.url}`;
  if (seen.has(key)) continue;
  seen.add(key);
  uniqueEntries.push(entry);
}

async function verifyEntry(entry) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(entry.url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 Codex M3U verifier'
      }
    });

    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    const isM3u =
      text.includes('#EXTM3U') ||
      /mpegurl|vnd\.apple\.mpegurl|audio\/mpegurl|application\/octet-stream/i.test(contentType);

    return {
      ...entry,
      status: response.status,
      ok: response.ok && isM3u,
      contentType
    };
  } catch (error) {
    return {
      ...entry,
      status: 'ERR',
      ok: false,
      contentType: '',
      error: error.name === 'AbortError' ? 'timeout' : error.message
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  console.log(`Verificando ${uniqueEntries.length} canais...`);

  const results = [];
  for (const entry of uniqueEntries) {
    const result = await verifyEntry(entry);
    results.push(result);
    const label = result.ok ? 'OK ' : 'BAD';
    const extra = result.error ? ` | ${result.error}` : ` | ${result.status}`;
    console.log(`${label} | ${result.name}${extra}`);
  }

  const working = results.filter(item => item.ok);
  const failing = results.filter(item => !item.ok);

  fs.writeFileSync(
    path.resolve('verified-working.json'),
    JSON.stringify(working, null, 2),
    'utf8'
  );

  fs.writeFileSync(
    path.resolve('verified-failing.json'),
    JSON.stringify(failing, null, 2),
    'utf8'
  );

  console.log('');
  console.log(`Funcionando: ${working.length}`);
  console.log(`Com falha: ${failing.length}`);
  console.log('Arquivos gerados: verified-working.json, verified-failing.json');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
