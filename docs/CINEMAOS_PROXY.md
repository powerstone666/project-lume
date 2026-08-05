# CinemaOS Proxy and Popup Blocking

This document explains how Lume embeds CinemaOS without using an iframe `sandbox`, while blocking common popup and new-tab behavior.

## Why a proxy is used

CinemaOS detects restrictive iframe sandbox settings and replaces its player with an "Iframe Sandbox Detected" warning. Removing the sandbox allows the player to load, but it also allows embedded scripts to call `window.open()` and open links in new tabs.

Lume solves this by serving CinemaOS through a same-origin proxy, hooking its webpack runtime, and reinforcing the blocker from the parent player after the iframe loads.

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

The proxy prepends an idempotent blocker only to CinemaOS's webpack runtime. Application chunks are returned byte-for-byte because changing their script prologue can break Next.js bootstrap globals such as `_N_E`. `GlobalPlayer.jsx` reapplies the blocker after the same-origin iframe loads, which covers browser-cached or renamed runtimes without changing Next.js-managed HTML.

### Blocking `window.open()`

The injected script replaces `window.open()` with a function that returns `null`. The property is made non-configurable and non-writable so ordinary page scripts cannot restore it.

This blocks the most common scripted popup mechanism.

### Blocking new-window links

A capture-phase click listener checks clicked links. Links targeting another browsing context or leaving Lume's proxied origin are prevented before the page's normal click handlers run.

### Blocking new-window form submissions

A capture-phase submit listener prevents forms that target another browsing context or submit to an external origin.

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

Both implementations perform the same HTML rewriting, runtime hook, and parent-side popup blocking.

## Player readiness

`GlobalPlayer.jsx` creates the CinemaOS iframe URL immediately from the route ID,
season, and episode. It does not wait for TMDB metadata, a timer, a player event,
or a custom "Tap to Play" prompt. The iframe receives pointer input directly;
its `load` event is used only to reinforce popup blocking.

## What this does and does not block

This implementation blocks:

- Scripted `window.open()` popups.
- Links that attempt to open another tab or window.
- Links that attempt to navigate the player to an external origin.
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

The active player has no custom readiness cover after `playerSrc` is created. If
the metadata loader remains visible, confirm session creation produced a valid
CinemaOS URL. Browsers may still require a direct click on CinemaOS's real play
control before playing video with sound.

## Important maintenance note

This integration depends on CinemaOS's routes and response structure. If CinemaOS changes its player path, asset paths, API namespaces, or HTML layout, update the URL builder and proxy allowlist together and re-test movie and episodic playback.
