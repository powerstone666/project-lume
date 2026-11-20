import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { usePrivateNavigate } from '../hooks/usePrivateNavigate';
import { fetchDiscoverMedia, fetchTrendingTodayMedia } from '../Api-services/tmbd';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';

const year = new Date().getFullYear();
export const ROWS = [
  // Netflix
  {
    id: 'new-netflix',
    title: 'Newly Added on Netflix',
    mediaTypes: ['movie', 'tv'],
    source: 'tmdb',
    paramsByType: {
      movie: {
        sort_by: 'primary_release_date.desc',
        watch_region: 'IN',
        with_watch_providers: 8,
        'vote_count.gte': 10,
      },
      tv: {
        sort_by: 'first_air_date.desc',
        watch_region: 'IN',
        with_watch_providers: 8,
        'vote_count.gte': 10,
      },
    },
  },
  // Prime Video
  {
    id: 'new-prime',
    title: 'Newly Added on Prime Video',
    mediaTypes: ['movie', 'tv'],
    source: 'tmdb',
    paramsByType: {
      movie: {
        sort_by: 'primary_release_date.desc',
        watch_region: 'IN',
        with_watch_providers: 119,
        'vote_count.gte': 10,
      },
      tv: {
        sort_by: 'first_air_date.desc',
        watch_region: 'IN',
        with_watch_providers: 119,
        'vote_count.gte': 10,
      },
    },
  },
  // Existing rows (trending, etc.)
  {
    id: 'trending-today-movies',
    title: 'Trending Today – Movies',
    mediaType: 'movie',
    source: 'trending-today',
  },
  {
    id: 'trending-today-shows',
    title: 'Trending Today – Shows',
    mediaType: 'tv',
    source: 'trending-today',
  },
  {
    id: 'exciting-hindi-movies',
    title: 'Exciting Indian Movies',
    mediaType: 'movie',
    source: 'tmdb',
    params: {
      sort_by: 'popularity.desc',
      with_origin_country: 'IN',
      'primary_release_date.gte': `${year - 1}-01-01`,
    },
  },
  // Additional rows (keep existing ones after these if needed)
  {
    id: 'new-on-netflix',
    title: 'New on Anymovie',
    mediaType: 'movie',
    source: 'tmdb',
    params: {
      sort_by: 'popularity.desc',
      region: 'IN',
      // recent releases (approximate)
      'primary_release_date.gte': '2023-01-01',
    },
  },
  {
    id: 'bingeworthy-tv-shows',
    title: 'Bingeworthy TV Shows',
    mediaType: 'tv',
    source: 'tmdb',
    params: {
      sort_by: 'popularity.desc',
      'vote_average.gte': 7.5,
      'vote_count.gte': 300,
    },
  },
  {
    id: 'bingeworthy-movies',
    title: 'Bingeworthy Movies',
    mediaType: 'movie',
    source: 'tmdb',
    params: {
      sort_by: 'popularity.desc',
      'vote_average.gte': 7.2,
      'vote_count.gte': 500,
    },
  },
  {
    id: 'asian-movies-tv',
    title: 'Asian Movies & TV',
    mediaType: 'movie',
    source: 'tmdb',
    params: {
      sort_by: 'popularity.desc',
      with_origin_country: 'JP|KR|CN|HK|TW|TH',
      'vote_average.gte': 6.2,
    },
  },
  {
    id: 'set-in-india',
    title: 'Films & TV Series Set in India',
    mediaType: 'tv',
    source: 'tmdb',
    params: {
      sort_by: 'popularity.desc',
      with_origin_country: 'IN',
    },
  },
  {
    id: 'continue-watching',
    title: 'Continue Watching for You',
    mediaType: 'movie',
    source: 'personalized',
  },
  {
    id: 'because-you-watched',
    title: 'Because You Watched',
    mediaType: 'movie',
    source: 'personalized',
  },
  {
    id: 'we-think-you-might-like',
    title: 'We Think You Might Like',
    mediaType: 'movie',
    source: 'personalized',
  },
  {
    id: 'hollywood-action',
    title: 'Hollywood Action Movies',
    mediaType: 'movie',
    source: 'tmdb',
    params: {
      sort_by: 'popularity.desc',
      with_origin_country: 'US',
      with_genres: '28',
      'vote_average.gte': 6.5,
    },
  },
  {
    id: 'us-family',
    title: 'US Family Movies',
    mediaType: 'movie',
    source: 'tmdb',
    params: {
      sort_by: 'popularity.desc',
      with_origin_country: 'US',
      with_genres: '10751',
    },
  },
  {
    id: 'critically-acclaimed-comedies',
    title: 'Critically Acclaimed Comedies',
    mediaType: 'movie',
    source: 'tmdb',
    params: {
      with_genres: '35',
      sort_by: 'popularity.desc',
      'vote_count.gte': 200,
      'vote_average.gte': 7.5,
    },
  },
  {
    id: 'us-movies',
    title: 'US Movies',
    mediaType: 'movie',
    source: 'tmdb',
    params: {
      sort_by: 'popularity.desc',
      with_origin_country: 'US',
    },
  },
  {
    id: 'us-tv-shows',
    title: 'US TV Shows',
    mediaType: 'tv',
    source: 'tmdb',
    params: {
      sort_by: 'popularity.desc',
      with_origin_country: 'US',
    },
  },
  {
    id: 'tv-dramas',
    title: 'TV Dramas',
    mediaType: 'tv',
    source: 'tmdb',
    params: {
      sort_by: 'popularity.desc',
      with_genres: '18',
      without_origin_country: 'US',
    },
  },
  {
    id: 'indian-action',
    title: 'Indian Action',
    mediaType: 'movie',
    source: 'tmdb',
    params: {
      sort_by: 'popularity.desc',
      with_origin_country: 'IN',
      with_genres: '28',
    },
  },
  {
    id: 'rousing-action-adventure',
    title: 'Rousing Action & Adventure',
    mediaType: 'movie',
    source: 'tmdb',
    params: {
      sort_by: 'popularity.desc',
      with_genres: '28,12',
    },
  },
  {
    id: 'dont-watch-alone',
    title: "Don't Watch Alone",
    mediaType: 'movie',
    source: 'tmdb',
    params: {
      sort_by: 'popularity.desc',
      with_genres: '27',
    },
  },
  {
    id: 'sci-fi-movies',
    title: 'Sci-Fi Movies',
    mediaType: 'movie',
    source: 'tmdb',
    params: {
      sort_by: 'popularity.desc',
      with_genres: '878',
    },
  },
  {
    id: 'sci-fi-shows',
    title: 'Sci-Fi Shows',
    mediaType: 'tv',
    source: 'tmdb',
    params: {
      sort_by: 'popularity.desc',
      with_genres: '10765',
    },
  },
  {
    id: 'crowd-pleasers',
    title: 'Crowd Pleasers',
    mediaType: 'movie',
    source: 'tmdb',
    params: {
      sort_by: 'popularity.desc',
      'vote_average.gte': 7,
      'vote_count.gte': 1000,
    },
  },
  {
    id: 'tamil-telugu-hits',
    title: 'Tamil & Telugu Hits',
    mediaType: 'movie',
    source: 'tmdb',
    params: {
      sort_by: 'popularity.desc',
      with_original_language: 'ta|te',
    },
  },
  {
    id: 'animation-tv',
    title: 'Animation TV',
    mediaType: 'tv',
    source: 'tmdb',
    params: {
      sort_by: 'popularity.desc',
      with_genres: '16',
    },
  },
  {
    id: 'thrillers-mysteries',
    title: 'Thrillers & Mysteries',
    mediaType: 'movie',
    source: 'tmdb',
    params: {
      sort_by: 'popularity.desc',
      with_genres: '53,9648',
    },
  },
  {
    id: 'feel-good-comedy',
    title: 'Feel-Good Comedy Movies',
    mediaType: 'movie',
    source: 'tmdb',
    params: {
      sort_by: 'popularity.desc',
      with_genres: '35',
      'vote_average.gte': 6.8,
    },
  },
  {
    id: 'international-movies',
    title: 'International Movies',
    mediaType: 'movie',
    source: 'tmdb',
    params: {
      sort_by: 'popularity.desc',
      without_origin_country: 'US',
    },
  },
  {
    id: 'international-shows',
    title: 'International Shows',
    mediaType: 'tv',
    source: 'tmdb',
    params: {
      sort_by: 'popularity.desc',
      without_origin_country: 'US',
    },
  },
  // Anime: Animation genre (16) + Japanese original language.
  {
    id: 'anime-trending',
    title: 'Trending Anime',
    mediaType: 'tv',
    source: 'tmdb',
    isAnimeRow: true,
    params: {
      sort_by: 'popularity.desc',
      with_genres: '16',
      with_original_language: 'ja',
      'vote_count.gte': 100,
    },
  },
  {
    id: 'anime-top-rated',
    title: 'Top Rated Anime',
    mediaType: 'tv',
    source: 'tmdb',
    isAnimeRow: true,
    params: {
      sort_by: 'vote_average.desc',
      with_genres: '16',
      with_original_language: 'ja',
      'vote_average.gte': 8,
      'vote_count.gte': 500,
    },
  },
  {
    id: 'anime-new',
    title: 'New Anime',
    mediaType: 'tv',
    source: 'tmdb',
    isAnimeRow: true,
    params: {
      sort_by: 'popularity.desc',
      with_genres: '16',
      with_original_language: 'ja',
      'first_air_date.gte': `${year - 1}-01-01`,
      'vote_count.gte': 20,
    },
  },
  {
    id: 'anime-action-adventure',
    title: 'Action & Adventure Anime',
    mediaType: 'tv',
    source: 'tmdb',
    isAnimeRow: true,
    params: {
      sort_by: 'popularity.desc',
      with_genres: '16,10759',
      with_original_language: 'ja',
      'vote_count.gte': 100,
    },
  },
  {
    id: 'anime-fantasy',
    title: 'Fantasy & Sci-Fi Anime',
    mediaType: 'tv',
    source: 'tmdb',
    isAnimeRow: true,
    params: {
      sort_by: 'popularity.desc',
      with_genres: '16,10765',
      with_original_language: 'ja',
      'vote_count.gte': 100,
    },
  },
  {
    id: 'anime-movies',
    title: 'Anime Movies',
    mediaType: 'movie',
    source: 'tmdb',
    isAnimeRow: true,
    params: {
      sort_by: 'popularity.desc',
      with_genres: '16',
      with_original_language: 'ja',
      'vote_count.gte': 200,
    },
  },
];

function getImageUrls(item) {
  const poster = item.poster_path
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
    : null;
  const backdrop = item.backdrop_path
    ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}`
    : null;

  return { poster, backdrop };
}

function Cards({ rows = ROWS }) {
  const navigate = usePrivateNavigate();
  const [rowsData, setRowsData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadRows() {
      const today = new Date().toISOString().slice(0, 10);

      const promises = rows.map(async (row) => {
        let items;
        try {

        if (Array.isArray(row.mediaTypes) && row.source === 'tmdb') {
          const combined = await Promise.all(
            row.mediaTypes.map(async (type) => {
              const params =
                row.paramsByType?.[type] ||
                row.params?.[type] ||
                row.params ||
                {};

              return fetchDiscoverMedia({
                cacheKey: `${row.id}-${type}`,
                mediaType: type,
                params,
              });
            }),
          );

          items = combined.flat().sort((a, b) => {
            const dateA = new Date(a.release_date || a.first_air_date || 0);
            const dateB = new Date(b.release_date || b.first_air_date || 0);
            return dateB - dateA;
          });

          if (!items.length) {
            const fallback = await Promise.all(
              row.mediaTypes.map(async (type) => {
                const baseParams =
                  row.paramsByType?.[type] ||
                  row.params?.[type] ||
                  row.params ||
                  {};

                return fetchDiscoverMedia({
                  cacheKey: `${row.id}-${type}-fallback`,
                  mediaType: type,
                  params: {
                    sort_by: 'popularity.desc',
                    'vote_count.gte': 1,
                    watch_region: baseParams.watch_region || 'IN',
                    with_watch_providers: baseParams.with_watch_providers,
                  },
                });
              }),
            );

            items = fallback.flat();
          }
        } else if (row.source === 'trending-today') {
          items = await fetchTrendingTodayMedia(row.mediaType);
        } else if (row.source === 'personalized') {
          if (typeof window !== 'undefined') {
            try {
              const raw = window.localStorage.getItem(row.id);
              const parsed = raw ? JSON.parse(raw) : [];
              items = Array.isArray(parsed) ? parsed : [];
            } catch {
              items = [];
            }
          } else {
            items = [];
          }
        } else {
          // Default to TMDB discover
          items = await fetchDiscoverMedia({
            cacheKey: row.id,
            mediaType: row.mediaType,
            params: row.params,
          });
        }

        if (Array.isArray(items)) {
          items = items.filter((item) => {
            const date = item.release_date || item.first_air_date;
            if (!date) return false;
            return date <= today;
          });
        }

        } catch {
          items = [];
        }

        return { id: row.id, items };
      });

      const results = await Promise.all(promises);
      if (cancelled) return;

      const next = {};
      results.forEach((row) => {
        next[row.id] = row.items;
      });

      setRowsData(next);
      setLoading(false);
    }

    loadRows();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCardClick = (row, item) => {
    if (!item || !item.id) return;

    let type =
      item.media_type ||
      row.mediaType ||
      (item.first_air_date && !item.release_date ? 'tv' : 'movie');

    // Check for Anime: Animation genre (16) + Japanese language ('ja')
    const isAnime = 
      (item.genre_ids?.includes(16) || item.genres?.some(g => g.id === 16)) && 
      item.original_language === 'ja';

    // If it's a TV show and looks like anime, use 'anime' type
    if (isAnime && type === 'tv') {
      type = 'anime';
    }

    navigate(`/stream/${type}/${item.id}`);
  };

  // A title shows up once per page: rows are filled in order, and anything an
  // earlier row already used is skipped. Movie and TV ids can collide, so the
  // key includes the media type.
  const seenTitles = new Set();
  const MIN_ROW_ITEMS = 4;
  const visibleRows = rows
    .map((row) => {
      const rawItems = rowsData[row.id] || row.items || [];
      const isTrendingToday = row.source === 'trending-today';

      const items = rawItems.filter((item) => {
        // Anime stays out of the regular rows; the anime rows are the place for it.
        const isAnime =
          (item.genre_ids?.includes(16) || item.genres?.some((g) => g.id === 16)) &&
          item.original_language === 'ja';
        if ((isAnime && !row.isAnimeRow) || !item.id) return false;

        const type =
          item.media_type ||
          (item.first_air_date && !item.release_date ? 'tv' : row.mediaType || 'movie');
        const key = `${type}-${item.id}`;
        if (seenTitles.has(key)) return false;
        seenTitles.add(key);
        return true;
      });

      return { row, isTrendingToday, items: isTrendingToday ? items.slice(0, 10) : items };
    })
    .filter(({ items }) => items.length >= MIN_ROW_ITEMS);

  return (
    <div className="relative z-10 -mt-20 space-y-8 px-4 pb-4 md:px-12 md:pb-8">
      {loading && (
        <div aria-busy="true" aria-label="Loading titles" className="space-y-8">
          {Array.from({ length: 3 }).map((_, rowIndex) => (
            <section key={`skeleton-row-${rowIndex}`} className="space-y-3">
              <div className="skeleton h-6 w-52 rounded-sm" />
              <div className="flex gap-2 overflow-hidden">
                {Array.from({ length: 7 }).map((__, cardIndex) => (
                  <div
                    key={`skeleton-card-${rowIndex}-${cardIndex}`}
                    className="skeleton aspect-[2/3] w-32 shrink-0 rounded-sm md:aspect-video md:w-56"
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {!loading && visibleRows.length === 0 && (
        <p className="py-16 text-center text-on-surface-variant">
          Nothing to show right now. Check your connection and try again.
        </p>
      )}

      {visibleRows.map(({ row, isTrendingToday, items }) => (
        <section key={row.id} aria-labelledby={`row-${row.id}`} className="space-y-2">
          <h2 id={`row-${row.id}`} className="text-lg font-bold text-on-surface md:text-xl">
            {row.title}
          </h2>
          <Swiper
            modules={[Navigation]}
            navigation
            spaceBetween={8}
            className="cards-row-swiper"
            breakpoints={{
              0: { slidesPerView: isTrendingToday ? 2.2 : 2.3, slidesPerGroup: 2 },
              640: { slidesPerView: isTrendingToday ? 3 : 3.2, slidesPerGroup: 3 },
              1024: {
                slidesPerView: isTrendingToday ? 5 : 'auto',
                slidesPerGroup: isTrendingToday ? 5 : 6,
              },
            }}
          >
            {items.map((item, index) => {
              const { poster, backdrop } = getImageUrls(item);
              const title = item.title || item.name || item.original_title || 'Untitled';
              const rank = isTrendingToday ? index + 1 : null;

              return (
                <SwiperSlide
                  key={item.id || item.value || item.title}
                  className={`!w-32 md:!w-56 ${isTrendingToday ? 'md:!w-60 lg:!w-64' : ''}`}
                >
                  <button
                    type="button"
                    onClick={() => handleCardClick(row, item)}
                    aria-label={rank ? `${rank}. ${title}` : title}
                    className="group relative block aspect-[2/3] w-full overflow-hidden rounded-sm bg-surface-container text-left transition-transform duration-300 hover:z-20 hover:scale-110 focus-visible:z-20 focus-visible:scale-110 md:aspect-video"
                  >
                    {poster || backdrop ? (
                      <>
                        <img
                          src={poster || backdrop}
                          alt=""
                          width="500"
                          height="750"
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover md:hidden"
                        />
                        <img
                          src={backdrop || poster}
                          alt=""
                          width="780"
                          height="439"
                          loading="lazy"
                          decoding="async"
                          className="hidden h-full w-full object-cover md:block"
                        />
                      </>
                    ) : (
                      <span className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-on-surface-variant">
                        {title}
                      </span>
                    )}

                    {rank && (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute bottom-0 left-2 hidden text-7xl font-black leading-none text-black md:block"
                        style={{ WebkitTextStroke: '2px #fff' }}
                      >
                        {rank}
                      </span>
                    )}

                    {/* Title appears on hover or keyboard focus, like Netflix. */}
                    <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black via-black/70 to-transparent px-3 pb-2 pt-8 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-on-surface text-surface">
                        <PlayArrowRounded fontSize="small" />
                      </span>
                      <span className="truncate text-sm font-bold text-on-surface">{title}</span>
                    </span>
                  </button>
                  <p className="mt-1.5 truncate text-xs font-medium text-on-surface-variant md:hidden">
                    {title}
                  </p>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </section>
      ))}
    </div>
  );
}

export default Cards;
