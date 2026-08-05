const CINEMAOS_ORIGIN = 'https://cinemaos.tech';

const POPUP_BLOCKER = `
<script>
(() => {
  const blockedOpen = () => null;

  try {
    Object.defineProperty(window, 'open', {
      configurable: false,
      enumerable: true,
      writable: false,
      value: blockedOpen,
    });
  } catch {
    window.open = blockedOpen;
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest?.('a');
    if (link && link.target && link.target !== '_self') {
      event.preventDefault();
      event.stopImmediatePropagation();
      link.target = '_self';
    }
  }, true);

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (form.target && form.target !== '_self') {
      event.preventDefault();
      event.stopImmediatePropagation();
      form.target = '_self';
    }
  }, true);
})();
</script>`;

const rewriteCinemaOsUrls = (html) => html
  .replaceAll(`${CINEMAOS_ORIGIN}/`, '/api/cinemaos/')
  .replaceAll('//cinemaos.tech/', '/api/cinemaos/')
  .replace(/(["'(=\s])\/_next\//g, '$1/api/cinemaos/_next/');

export default async function handler(request, response) {
  try {
    const path = request.query.path;
    const pathSegments = Array.isArray(path) ? path : [path].filter(Boolean);
    const upstreamUrl = new URL(`/${pathSegments.join('/')}`, CINEMAOS_ORIGIN);

    for (const [key, value] of Object.entries(request.query)) {
      if (key !== 'path') {
        upstreamUrl.searchParams.set(key, Array.isArray(value) ? value[0] : value);
      }
    }

    const upstreamResponse = await fetch(upstreamUrl, {
      headers: {
        accept: request.headers.accept || '*/*',
        ...(request.headers.range ? { range: request.headers.range } : {}),
        ...(request.headers['user-agent'] ? { 'user-agent': request.headers['user-agent'] } : {}),
      },
    });

    const contentType = upstreamResponse.headers.get('content-type') || 'application/octet-stream';
    const isHtml = contentType.includes('text/html');

    if (isHtml) {
      const upstreamHtml = await upstreamResponse.text();
      const html = rewriteCinemaOsUrls(upstreamHtml).replace('<head>', `<head>${POPUP_BLOCKER}`);

      response.status(upstreamResponse.status);
      response.setHeader('content-type', 'text/html; charset=utf-8');
      response.setHeader('cache-control', 'no-store');
      return response.send(html);
    }

    const body = Buffer.from(await upstreamResponse.arrayBuffer());
    response.status(upstreamResponse.status);
    response.setHeader('content-type', contentType);

    for (const header of ['cache-control', 'content-length', 'content-range', 'accept-ranges', 'etag']) {
      const value = upstreamResponse.headers.get(header);
      if (value) response.setHeader(header, value);
    }

    return response.send(body);
  } catch (error) {
    console.error('CinemaOS proxy request failed:', error);
    return response.status(502).json({ error: 'CinemaOS is unavailable' });
  }
}
