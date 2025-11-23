const WATCHMODE_BASE_URL = 'https://api.watchmode.com/v1';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Source IDs
export const SOURCES = {
  NETFLIX: 203,
  PRIME: 26,
  DISNEY: 372,
  HOTSTAR: 371, // Disney+ Hotstar (includes JioCinema content)
  APPLE_TV: 387, // Apple TV+
  ZEE5: 358,
  SONYLIV: 353,
};

async function fetchJson(url) {
  const apiKey = import.meta.env.VITE_WATCHMODE_API_KEY;
  if (!apiKey) {
    console.warn('[Watchmode] Missing VITE_WATCHMODE_API_KEY. Watchmode features will be disabled.');
    return null;
  }

  const separator = url.includes('?') ? '&' : '?';
  const fullUrl = `${WATCHMODE_BASE_URL}${url}${separator}apiKey=${apiKey}`;

  console.log('[Watchmode] Fetching:', url);

  try {
    const response = await fetch(fullUrl);
    if (!response.ok) {
      if (response.status === 429) {
        console.error('[Watchmode] Rate limit exceeded.');
      } else {
        console.error('[Watchmode] API Error:', response.status, response.statusText);
      }
      throw new Error(`Watchmode API Error: ${response.status}`);
    }
    const data = await response.json();
    console.log('[Watchmode] Response:', data);
    return data;
  } catch (error) {
    console.error('[Watchmode] Fetch failed:', error);
    return null;
  }
}

// Cache helpers
function getFromCache(key, expiryMs = null) {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const parsed = JSON.parse(item);
    if (expiryMs && Date.now() - parsed.timestamp > expiryMs) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.data;
  } catch (e) {
    return null;
  }
}

function saveToCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch (e) {
    console.warn('Failed to save to localStorage (quota exceeded?)', e);
  }
}

// ID Mapping Cache (Indefinite)
const ID_MAP_KEY = 'wm_id_map';
function getCachedTmdbId(wmId) {
  const map = getFromCache(ID_MAP_KEY) || {};
  return map[wmId];
}

function saveCachedTmdbId(wmId, tmdbId, type) {
  const map = getFromCache(ID_MAP_KEY) || {};
  map[wmId] = { tmdbId, type };
  saveToCache(ID_MAP_KEY, map);
}

/**
 * Fetch list of titles from Watchmode
 * @param {number} sourceId - Watchmode source ID
 * @param {string} type - 'movie' or 'tv' (optional filter)
 */
export async function fetchTopContent(sourceId, type = null) {
  // Fetch from Watchmode
  // Endpoint: /list-titles/
  // Docs: https://api.watchmode.com/v1/docs/#list-titles
  // sourceId can be a single ID or comma-separated list
  // Using popularity_desc as release_date_desc causes 400 errors
  // Note: types parameter seems unsupported, API returns mixed content
  let url = `/list-titles/?source_ids=${sourceId}&sort_by=popularity_desc&limit=20`;
  // Don't use types parameter - it causes 400 errors
  // We'll filter by type client-side using media_type field

  const cacheKey = `wm_top_${sourceId}_${type || 'all'}`;
  const cached = getFromCache(cacheKey, ONE_DAY_MS);
  if (cached) {
    console.log(`[Watchmode] Serving ${cacheKey} from cache`);
    return cached;
  }

  console.log(`[Watchmode] Fetching: ${url}`);
  const data = await fetchJson(url);
  if (!data || !data.titles) return null;

  // Hydrate with TMDB IDs first to get media_type
  const hydratedRaw = await hydrateIds(data.titles);
  
  console.log(`[Watchmode] Hydrated ${hydratedRaw.length} items`);
  console.log(`[Watchmode] Media types:`, hydratedRaw.map(item => item.media_type));

  // Filter by type client-side since API doesn't support it
  let titles = hydratedRaw;
  if (type) {
    console.log(`[Watchmode] Filtering for type: ${type}`);
    titles = titles.filter(item => item.media_type === type);
    console.log(`[Watchmode] After filtering: ${titles.length} items of type ${type}`);
  }
  // Limit to 10 after filtering
  titles = titles.slice(0, 10);

  saveToCache(cacheKey, titles);
  return titles;
}

/**
 * Resolve TMDB IDs for a list of Watchmode items
 */
async function hydrateIds(items) {
  const hydrated = [];
  
  // Process sequentially to be gentle on rate limits if we have many misses
  // Or Promise.all if we are confident. Let's do sequential for safety on the 1000 limit.
  for (const item of items) {
    const wmId = item.id;
    let mapping = getCachedTmdbId(wmId);

    if (!mapping) {
      // Cache miss, fetch details
      // Endpoint: /title/{id}/details/
      const details = await fetchJson(`/title/${wmId}/details/`);
      if (details && details.tmdb_id) {
        mapping = { 
          tmdbId: details.tmdb_id, 
          type: details.tmdb_type === 'movie' ? 'movie' : 'tv' 
        };
        saveCachedTmdbId(wmId, mapping.tmdbId, mapping.type);
      }
    }

    if (mapping) {
      hydrated.push({
        ...item,
        tmdb_id: mapping.tmdbId,
        media_type: mapping.type,
        // Use Watchmode title/year if needed, or rely on TMDB later
        title: item.title,
        year: item.year,
      });
    }
  }

  return hydrated;
}
