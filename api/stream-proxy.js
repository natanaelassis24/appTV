function applyCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Range');
}

function sendText(res, statusCode, payload, contentType = 'text/plain; charset=utf-8') {
  applyCors(res);
  res.status(statusCode).setHeader('Content-Type', contentType).send(payload);
}

function proxiedUrl(url) {
  return `/api/stream-proxy?url=${encodeURIComponent(url)}`;
}

function shouldRewriteAsPlaylist(responseUrl, contentType, requestedUrl) {
  const normalizedType = String(contentType || '').toLowerCase();
  return (
    normalizedType.includes('mpegurl') ||
    normalizedType.includes('vnd.apple.mpegurl') ||
    normalizedType.includes('application/x-mpegurl') ||
    /\.m3u8($|\?)/i.test(String(responseUrl || requestedUrl || ''))
  );
}

function rewritePlaylistBody(body, baseUrl) {
  return String(body || '')
    .split(/\r?\n/)
    .map(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        return line;
      }

      try {
        const resolved = new URL(trimmed, baseUrl).toString();
        return proxiedUrl(resolved);
      } catch {
        return line;
      }
    })
    .join('\n');
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    sendText(res, 204, '');
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendText(res, 405, 'Method Not Allowed');
    return;
  }

  const targetUrl = String(req.query?.url || '').trim();

  if (!targetUrl) {
    sendText(res, 400, 'Missing url parameter');
    return;
  }

  let parsedTarget;
  try {
    parsedTarget = new URL(targetUrl);
  } catch {
    sendText(res, 400, 'Invalid url parameter');
    return;
  }

  if (!['http:', 'https:'].includes(parsedTarget.protocol)) {
    sendText(res, 400, 'Unsupported url protocol');
    return;
  }

  const upstreamHeaders = {};
  const rangeHeader = req.headers?.range;
  if (rangeHeader) {
    upstreamHeaders.Range = rangeHeader;
  }

  const upstreamResponse = await fetch(parsedTarget.toString(), {
    method: req.method,
    headers: upstreamHeaders
  });

  const contentType = upstreamResponse.headers.get('content-type') || '';
  const responseUrl = upstreamResponse.url || parsedTarget.toString();

  if (shouldRewriteAsPlaylist(responseUrl, contentType, targetUrl)) {
    const text = await upstreamResponse.text();
    const rewritten = rewritePlaylistBody(text, responseUrl);

    applyCors(res);
    res.status(upstreamResponse.status);
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(rewritten);
    return;
  }

  const buffer = Buffer.from(await upstreamResponse.arrayBuffer());

  applyCors(res);
  res.status(upstreamResponse.status);

  for (const headerName of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control', 'etag', 'last-modified']) {
    const headerValue = upstreamResponse.headers.get(headerName);
    if (headerValue) {
      res.setHeader(headerName, headerValue);
    }
  }

  res.end(buffer);
}
