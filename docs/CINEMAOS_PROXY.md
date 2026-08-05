# CinemaOS Proxy and Popup Blocking

This document explains how Lume embeds CinemaOS without using an iframe `sandbox`, while blocking common popup and new-tab behavior.

## Why a proxy is used

CinemaOS detects restrictive iframe sandbox settings and replaces its player with an "Iframe Sandbox Detected" warning. Removing the sandbox allows the player to load, but it also allows embedded scripts to call `window.open()` and open links in new tabs.

Lume solves this by serving CinemaOS through a same-origin proxy and injecting popup-blocking code into the returned HTML.

```text
Browser iframe
    → Lume proxy
        → CinemaOS
        ← CinemaOS response
    ← rewritten response with popup blocker
```

## Player URLs

Player URLs are created in `src/Stream/cinemaOsUrl.js`.

- Movies use `/api/cinemaos/watch/movie/{tmdbId}`.
- TV and anime use `/api/cinemaos/watch/tv/{tmdbId}?season={season}&episode={episode}`.

The `/api/cinemaos` prefix keeps the iframe on Lume's origin. The proxy removes that prefix before requesting the corresponding resource from `https://cinemaos.tech`.

## Popup-blocking layers

The proxy prepends the blocker to CinemaOS's webpack runtime response. The runtime executes before the application chunks, so the blocker is active before CinemaOS code without adding elements to Next.js-managed HTML or causing hydration mismatches.

### Blocking `window.open()`

The injected script replaces `window.open()` with a function that returns `null`. The property is made non-configurable and non-writable so ordinary page scripts cannot restore it.

This blocks the most common scripted popup mechanism.

### Blocking new-window links

A capture-phase click listener checks clicked links. Links targeting `_blank` or another browsing context are prevented before the page's normal click handlers run.

### Blocking new-window form submissions

A capture-phase submit listener prevents forms whose `target` would open another window or tab.

## Resource and API forwarding

CinemaOS is a Next.js application. Once its HTML is served from Lume's origin, root-relative assets and APIs would otherwise resolve against Lume and fall into the React application.

The proxy therefore forwards these CinemaOS-owned routes:

- `/_next/*`
- `/api/cinemaosv2`
- `/api/moviebox/*`
- `/api/multi-movies`
- `/api/tmdb`

Only these known namespaces are forwarded. Other Lume API routes remain untouched.

## Development and production

Local development uses the middleware in `vite.config.js`. It intercepts the player, Next.js asset, and CinemaOS API routes before Vite's React fallback handles them.

Production uses:

- `api/cinemaos-proxy.js` as the stable Vercel proxy function.
- `vercel.json` rewrites player pages, root-relative assets, and internal APIs to
  that function before the React SPA fallback is evaluated.

The production rewrites pass the captured CinemaOS path through the
`upstreamPath` query parameter. This explicit function destination is important
for Vite deployments: without it, the SPA catch-all can return Lume's
`index.html` for `/api/cinemaos/...`, causing a second copy of Lume to render
inside the player iframe.

Both implementations perform the same HTML rewriting and popup-blocker injection.

## Player readiness

The old CinemaOS embed route emitted `PLAYER_EVENT` messages from `https://cinemaos.tech`. The current proxied `/watch` page may not emit that legacy handshake.

`GlobalPlayer.jsx` therefore marks the player ready when the iframe's `load` event fires. It also accepts valid player messages from Lume's current origin. This removes Lume's loading overlay and allows the user to interact with the player.

## What this does and does not block

This implementation blocks:

- Scripted `window.open()` popups.
- Links that attempt to open another tab or window.
- Forms that target another tab or window.

It does not automatically block:

- Ads rendered directly inside the iframe DOM.
- Ads embedded in a video stream.
- Network requests made for analytics or advertising.
- Top-level navigation performed without a popup.

Those behaviors require separate DOM filtering, request filtering, or additional navigation controls.

## Troubleshooting

### React receives a CinemaOS path

If React reports that no route matches `/api/cinemaos/...`, restart Vite so its proxy middleware is loaded:

```bash
npm run dev
```

### CinemaOS APIs return HTML instead of JSON

An `Unexpected token '<'` JSON error means an upstream API path fell through to `index.html`. Confirm that the API namespace is listed in both `vite.config.js` and `vercel.json`.

### Next.js chunks return 404

Requests to `/_next/*` must be forwarded to CinemaOS. Confirm the Vite middleware and Vercel rewrite are active.

### Streams load but the player remains covered

Confirm the iframe `onLoad` handler in `GlobalPlayer.jsx` sets `playerReady`. Browsers may still require a user click before playing video with sound.

## Important maintenance note

This integration depends on CinemaOS's routes and response structure. If CinemaOS changes its player path, asset paths, API namespaces, or HTML layout, update the URL builder and proxy allowlist together and re-test movie and episodic playback.
