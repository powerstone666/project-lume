import { Readable } from 'node:stream';

const CINEMAOS_ORIGIN = 'https://cinemaos.tech';

const POPUP_BLOCKER_SCRIPT = `
(() => {
  const blockerFlag = '__LUME_POPUP_BLOCKER_INSTALLED__';
  if (window[blockerFlag]) return;

  try {
    Object.defineProperty(window, blockerFlag, {
      configurable: false,
      enumerable: false,
      writable: false,
      value: true,
    });
  } catch {}

  const blockedOpen = () => null;

  try {
    Object.defineProperty(window, 'open', {
      configurable: false,
      enumerable: true,
      writable: false,
      value: blockedOpen,
    });
  } catch {
    try {
      window.open = blockedOpen;
    } catch {}
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest?.('a');
    if (!link) return;

    const target = link.target?.toLowerCase();
    let isExternal = false;
    try {
      isExternal = new URL(link.href, window.location.href).origin !== window.location.origin;
    } catch {}

    if ((target && target !== '_self') || isExternal) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  document.addEventListener('submit', (event) => {
    const form = event.target;
    const target = form.target?.toLowerCase();
    let isExternal = false;
    try {
      isExternal = new URL(form.action, window.location.href).origin !== window.location.origin;
    } catch {}

    if ((target && target !== '_self') || isExternal) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
})();
`;

const rewriteCinemaOsUrls = (html) => html
  .replaceAll(`${CINEMAOS_ORIGIN}/`, '/api/cinemaos/')
  .replaceAll('//cinemaos.tech/', '/api/cinemaos/')
  .replace(/(["'(=\s])\/_next\//g, '$1/api/cinemaos/_next/');

const getFirstQueryValue = (value) => Array.isArray(value) ? value[0] : value;

const getUpstreamPath = (request) => {
  const upstreamPath = getFirstQueryValue(request.query.upstreamPath);

  if (typeof upstreamPath !== 'string' || upstreamPath.length === 0) {
    return null;
  }

  const normalizedPath = upstreamPath.replace(/^\/+/, '');
  if (!normalizedPath || normalizedPath.includes('\\')) return null;

  return `/${normalizedPath}`;
};

const copyUpstreamQuery = (request, upstreamUrl) => {
  for (const [key, value] of Object.entries(request.query)) {
    if (key === 'upstreamPath' || key === 'cinemaOsPath') continue;

    const queryValue = getFirstQueryValue(value);
    if (queryValue !== undefined) upstreamUrl.searchParams.set(key, queryValue);
  }
};

export default async function handler(request, response) {
  const upstreamPath = getUpstreamPath(request);

  if (!upstreamPath) {
    return response.status(400).json({ error: 'Missing CinemaOS upstream path' });
  }

  try {
    const upstreamUrl = new URL(upstreamPath, CINEMAOS_ORIGIN);
    copyUpstreamQuery(request, upstreamUrl);

    const upstreamResponse = await fetch(upstreamUrl, {
      headers: {
        accept: request.headers.accept || '*/*',
        ...(request.headers.range ? { range: request.headers.range } : {}),
        ...(request.headers['user-agent'] ? { 'user-agent': request.headers['user-agent'] } : {}),
      },
    });

    const contentType = upstreamResponse.headers.get('content-type') || 'application/octet-stream';
    const isHtml = contentType.includes('text/html');
    const isWebpackRuntime = upstreamUrl.pathname.includes('/_next/static/chunks/webpack-')
      && (contentType.includes('javascript') || upstreamUrl.pathname.endsWith('.js'));

    if (isHtml) {
      const upstreamHtml = await upstreamResponse.text();
      const html = rewriteCinemaOsUrls(upstreamHtml);

      response.status(upstreamResponse.status);
      response.setHeader('content-type', 'text/html; charset=utf-8');
      response.setHeader('cache-control', 'no-store');
      return response.send(html);
    }

    if (isWebpackRuntime) {
      const runtime = await upstreamResponse.text();
      response.status(upstreamResponse.status);
      response.setHeader('content-type', contentType);
      response.setHeader('cache-control', 'no-store');
      return response.send(`${POPUP_BLOCKER_SCRIPT}\n${runtime}`);
    }

    response.status(upstreamResponse.status);
    response.setHeader('content-type', contentType);

    for (const header of ['cache-control', 'content-range', 'accept-ranges', 'etag', 'last-modified']) {
      const value = upstreamResponse.headers.get(header);
      if (value) response.setHeader(header, value);
    }

    if (!upstreamResponse.body) return response.end();

    return Readable.fromWeb(upstreamResponse.body).pipe(response);
  } catch (error) {
    console.error('CinemaOS proxy request failed:', error);
    return response.status(502).json({ error: 'CinemaOS is unavailable' });
  }
}
