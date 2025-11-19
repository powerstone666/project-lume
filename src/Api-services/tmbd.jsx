const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

let trendingIndiaMoviesCache = {
  data: null,
  lastFetched: 0,
};

let trendingIndiaShowsCache = {
  data: null,
  lastFetched: 0,
};

const trendingTodayCache = {
  movie: { data: null, lastFetched: 0 },
  tv: { data: null, lastFetched: 0 },
};

const discoverCache = new Map();
const detailsCache = new Map();
const recommendationsCache = new Map();
const seasonCache = new Map();
const searchCache = new Map();

async function fetchJson(url) {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;

  if (!apiKey) {
    throw new Error('Missing TMDB API key. Set VITE_TMDB_API_KEY in your env.');
  }

  // TMDB expects all requests under /3. Build URL by simple string concat
  // to avoid accidentally dropping the `/3` path segment.
  const urlObj = new URL(`${TMDB_BASE_URL}${url}`);
  urlObj.searchParams.set('api_key', apiKey);

  const response = await fetch(urlObj.toString());

  if (!response.ok) {
    throw new Error('Failed to fetch from TMDB.');
  }

  const data = await response.json();
  return data;
}

export async function searchMulti(query, { page = 1 } = {}) {
  const trimmed = (query || '').trim();
  if (!trimmed) {
    return [];
  }

  const key = `${trimmed.toLowerCase()}:${page}`;
  const now = Date.now();
  const cached = searchCache.get(key);

  if (cached && now - cached.lastFetched < ONE_DAY_MS) {
    return cached.data;
  }

  const params = new URLSearchParams({
    query: trimmed,
    include_adult: 'false',
    page: String(page),
    language: 'en-IN',
  });

  const url = `/search/multi?${params.toString()}`;
  const data = await fetchJson(url);
  const results = Array.isArray(data.results) ? data.results : [];

  searchCache.set(key, {
    data: results,
    lastFetched: Date.now(),
  });

  return results;
}

export async function fetchTrendingMoviesInIndia({ forceRefresh = false } = {}) {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;

  if (!apiKey) {
    throw new Error('Missing TMDB API key. Set VITE_TMDB_API_KEY in your env.');
  }

  const now = Date.now();

  if (
    !forceRefresh &&
    trendingIndiaMoviesCache.data &&
    now - trendingIndiaMoviesCache.lastFetched < ONE_WEEK_MS
  ) {
    return trendingIndiaMoviesCache.data;
  }

  const url = `/trending/movie/week?language=en-IN&region=IN`;

  const data = await fetchJson(url);
  const results = Array.isArray(data.results) ? data.results : [];

  trendingIndiaMoviesCache = {
    data: results,
    lastFetched: Date.now(),
  };

  return results;
}

export async function fetchTrendingShowsInIndia({ forceRefresh = false } = {}) {
  const now = Date.now();

  if (
    !forceRefresh &&
    trendingIndiaShowsCache.data &&
    now - trendingIndiaShowsCache.lastFetched < ONE_WEEK_MS
  ) {
    return trendingIndiaShowsCache.data;
  }

  const url = `/trending/tv/week?language=en-IN&region=IN`;

  const data = await fetchJson(url);
  const results = Array.isArray(data.results) ? data.results : [];

  trendingIndiaShowsCache = {
    data: results,
    lastFetched: Date.now(),
  };

  return results;
}

export async function fetchDiscoverMedia({
  cacheKey,
  mediaType = 'movie',
  params = {},
} = {}) {
  const now = Date.now();
  const key =
    cacheKey ||
    `${mediaType}:${JSON.stringify(
      Object.keys(params)
        .sort()
        .reduce((acc, k) => {
          acc[k] = params[k];
          return acc;
        }, {}),
    )}`;

  const cached = discoverCache.get(key);

  if (cached && now - cached.lastFetched < ONE_WEEK_MS) {
    return cached.data;
  }

  const today = new Date().toISOString().slice(0, 10);

  const baseParams = {
    sort_by: params.sort_by || 'popularity.desc',
    include_adult: 'false',
    'vote_average.gte':
      params['vote_average.gte'] != null ? params['vote_average.gte'] : 5,
    'vote_count.gte':
      params['vote_count.gte'] != null
        ? params['vote_count.gte']
        : mediaType === 'movie'
          ? 50
          : 20,
    ...(mediaType === 'movie'
      ? {
          'primary_release_date.lte':
            params['primary_release_date.lte'] || today,
        }
      : {
          'first_air_date.lte': params['first_air_date.lte'] || today,
        }),
  };

  const mergedParams = {
    ...baseParams,
    ...params,
  };

  const search = new URLSearchParams(
    Object.entries(mergedParams).map(([k, v]) => [k, String(v)]),
  );

  const path = `/discover/${mediaType}?${search.toString()}`;
  const data = await fetchJson(path);
  const results = Array.isArray(data.results) ? data.results : [];

  discoverCache.set(key, {
    data: results,
    lastFetched: Date.now(),
  });

  return results;
}

export async function fetchTrendingTodayMedia(mediaType = 'movie', { forceRefresh = false } = {}) {
  const kind = mediaType === 'tv' ? 'tv' : 'movie';
  const now = Date.now();
  const cached = trendingTodayCache[kind];

  if (!forceRefresh && cached.data && now - cached.lastFetched < ONE_DAY_MS) {
    return cached.data;
  }

  const url = `/trending/${kind}/day?language=en-IN&region=IN`;
  const data = await fetchJson(url);
  const results = Array.isArray(data.results) ? data.results : [];

  trendingTodayCache[kind] = {
    data: results,
    lastFetched: Date.now(),
  };

  return results;
}

export async function fetchMediaDetails(mediaType = 'movie', id) {
  if (!id) {
    throw new Error('Missing media id.');
  }

  const kind = mediaType === 'tv' ? 'tv' : 'movie';
  const key = `${kind}:${id}`;
  const now = Date.now();
  const cached = detailsCache.get(key);

  if (cached && now - cached.lastFetched < ONE_WEEK_MS) {
    return cached.data;
  }

  const url = `/${kind}/${id}?language=en-IN&append_to_response=videos,credits,release_dates,content_ratings`;
  const data = await fetchJson(url);

  detailsCache.set(key, {
    data,
    lastFetched: Date.now(),
  });

  return data;
}

export async function fetchRecommendations(mediaType = 'movie', id) {
  if (!id) {
    throw new Error('Missing media id.');
  }

  const kind = mediaType === 'tv' ? 'tv' : 'movie';
  const key = `recs:${kind}:${id}`;
  const now = Date.now();
  const cached = recommendationsCache.get(key);

  if (cached && now - cached.lastFetched < ONE_WEEK_MS) {
    return cached.data;
  }

  const url = `/${kind}/${id}/recommendations?language=en-IN`;
  const data = await fetchJson(url);
  const results = Array.isArray(data.results) ? data.results : [];

  recommendationsCache.set(key, {
    data: results,
    lastFetched: Date.now(),
  });

  return results;
}

export async function fetchSeasonDetails(id, seasonNumber) {
  if (!id || seasonNumber == null) {
    throw new Error('Missing tv id or season number.');
  }

  const key = `season:${id}:${seasonNumber}`;
  const now = Date.now();
  const cached = seasonCache.get(key);

  if (cached && now - cached.lastFetched < ONE_WEEK_MS) {
    return cached.data;
  }

  const url = `/tv/${id}/season/${seasonNumber}?language=en-IN`;
  const data = await fetchJson(url);

  seasonCache.set(key, {
    data,
    lastFetched: Date.now(),
  });

  return data;
}
