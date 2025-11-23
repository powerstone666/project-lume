import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { usePrivateNavigate } from '../hooks/usePrivateNavigate';
import { fetchDiscoverMedia, fetchTrendingTodayMedia } from '../Api-services/tmbd';

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

  return (
    <div className="bg-black text-white px-4 md:px-8 pt-4 pb-16 space-y-8">
      {loading && (
        <>
          {Array.from({ length: 3 }).map((_, rowIndex) => (
            <section key={`skeleton-row-${rowIndex}`} className="space-y-4">
              {/* Enhanced title skeleton with gradient shimmer */}
              <div className="h-6 w-48 bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 rounded-lg overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-600/30 to-transparent animate-shimmer" />
              </div>
              <div className="flex gap-3">
                {Array.from({ length: 6 }).map((__, cardIndex) => (
                  <div
                    key={`skeleton-card-${rowIndex}-${cardIndex}`}
                    className="flex-shrink-0 w-32 md:w-56 aspect-[3/4] md:aspect-video bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-lg overflow-hidden relative shadow-lg"
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-600/20 to-transparent animate-shimmer" />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </>
      )}
      {rows.map((row) => {
        const rawItems = rowsData[row.id] || row.items || [];
        // Filter out Anime: Animation genre (16) + Japanese language ('ja')
        const items = rawItems.filter(item => {
          const isAnime = (item.genre_ids?.includes(16) || item.genres?.some(g => g.id === 16)) && item.original_language === 'ja';
          return !isAnime;
        });

        const isTrendingToday = row.source === 'trending-today';
        const rowItems = isTrendingToday ? items.slice(0, 10) : items;

        if (!rowItems || rowItems.length === 0) {
          return null;
        }

        return (
          <section key={row.id} className="space-y-4">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent drop-shadow-lg">
              {row.title}
            </h2>
            <Swiper
              modules={[Navigation]}
              navigation
              spaceBetween={12}
              className="cards-row-swiper"
              breakpoints={{
                0: {
                  slidesPerView: isTrendingToday ? 2.2 : 2.3,
                  slidesPerGroup: 2,
                },
                640: {
                  slidesPerView: isTrendingToday ? 3 : 3.2,
                  slidesPerGroup: 3,
                },
                1024: {
                  slidesPerView: isTrendingToday ? 5 : 'auto',
                  slidesPerGroup: isTrendingToday ? 5 : 6,
                },
              }}
            >
              {rowItems.map((item, index) => {
                const { poster, backdrop } = getImageUrls(item);
                const title =
                  item.title || item.name || item.original_title || 'Untitled';
                const rank = isTrendingToday ? index + 1 : null;

                return (
                  <SwiperSlide
                    key={item.id || item.value || item.title}
                    className={`!w-32 md:!w-56 ${
                      isTrendingToday ? 'md:!w-60 lg:!w-64' : ''
                    }`}
                  >
                    <div className="flex flex-col">
                      <div
                        className="group relative w-full aspect-[3/4] md:aspect-video bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 ease-out hover:scale-[1.08] hover:shadow-2xl hover:shadow-purple-500/20 hover:z-10"
                        onClick={() => handleCardClick(row, item)}
                        style={{
                          transformOrigin: 'center',
                        }}
                      >
                        {/* Animated gradient border on hover */}
                        <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-purple-500/50 via-pink-500/50 to-purple-500/50 blur-sm -z-10" />
                        
                        {poster || backdrop ? (
                          <>
                            <img
                              src={poster || backdrop}
                              alt={title}
                              className="h-full w-full object-cover md:hidden transition-all duration-300 group-hover:brightness-75"
                            />
                            <img
                              src={backdrop || poster}
                              alt={title}
                              className="hidden md:block h-full w-full object-cover transition-all duration-300 group-hover:brightness-75"
                            />
                          </>
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xs text-zinc-300 px-2 text-center">
                            {title}
                          </div>
                        )}
                        
                        {/* Enhanced gradient overlay with glassmorphism */}
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 pb-3 pt-8 hidden md:block backdrop-blur-[2px]">
                          <p className="text-sm md:text-base font-semibold truncate text-white drop-shadow-lg">
                            {title}
                          </p>
                        </div>
                        
                        {/* Enhanced rank badge with glow effect */}
                        {rank && (
                          <div className="pointer-events-none absolute -left-2 -bottom-1 hidden md:block">
                            <span 
                              className="text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400"
                              style={{
                                WebkitTextStroke: '3px white',
                                filter: 'drop-shadow(0 0 12px rgba(0,0,0,0.95)) drop-shadow(0 0 20px rgba(145,70,255,0.4))',
                              }}
                            >
                              {rank}
                            </span>
                          </div>
                        )}
                        
                        {/* Enhanced play button with Twitch color and glow */}
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <div className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-[#9146FF] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-300 relative">
                            {/* Glow effect */}
                            <div className="absolute inset-0 rounded-full bg-[#9146FF] opacity-75 blur-xl animate-pulse" />
                            <span className="ml-1 text-white text-xl md:text-2xl relative z-10 drop-shadow-lg font-bold">
                              ▶
                            </span>
                          </div>
                        </div>
                        
                        {/* Shimmer effect on hover */}
                        <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        </div>
                      </div>
                      <p className="mt-2 text-xs sm:text-sm font-semibold truncate md:hidden text-zinc-200">
                        {title}
                      </p>
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </section>
        );
      })}
    </div>
  );
}

export default Cards;
