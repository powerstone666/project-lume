import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { useNavigate } from 'react-router-dom';
import { fetchDiscoverMedia, fetchTrendingTodayMedia } from '../Api-services/tmbd';
const year=new Date().getFullYear();
export const ROWS = [
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
      'primary_release_date.gte':`${year-1}-01-01`,
    },
  },
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
  const navigate = useNavigate();
  const [rowsData, setRowsData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadRows() {
      const today = new Date().toISOString().slice(0, 10);

      const promises = rows.map(async (row) => {
        let items;

        if (row.source === 'trending-today') {
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

    const type =
      item.media_type ||
      row.mediaType ||
      (item.first_air_date && !item.release_date ? 'tv' : 'movie');

    navigate(`/stream/${type}/${item.id}`);
  };

  return (
    <div className="bg-black text-white px-4 md:px-8 pt-4 pb-16 space-y-8">
      {loading && (
        <>
          {Array.from({ length: 3 }).map((_, rowIndex) => (
            <section key={`skeleton-row-${rowIndex}`} className="space-y-3">
              <div className="h-5 w-40 bg-zinc-800/80 rounded-md animate-pulse" />
              <div className="flex gap-3">
                {Array.from({ length: 6 }).map((__, cardIndex) => (
                  <div
                    key={`skeleton-card-${rowIndex}-${cardIndex}`}
                    className="flex-shrink-0 w-32 md:w-56 aspect-[3/4] md:aspect-video bg-zinc-800/80 rounded-md animate-pulse"
                  />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
      {rows.map((row) => {
        const items = rowsData[row.id] || row.items || [];
        const isTrendingToday = row.source === 'trending-today';
        const rowItems = isTrendingToday ? items.slice(0, 10) : items;

        if (!rowItems || rowItems.length === 0) {
          return null;
        }

        return (
          <section key={row.id} className="space-y-4">
            <h2 className="text-lg md:text-xl font-semibold">
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
                        className="group relative w-full aspect-[3/4] md:aspect-video bg-zinc-800 rounded-md overflow-hidden hover:scale-105 hover:z-10 transition-transform cursor-pointer"
                        onClick={() => handleCardClick(row, item)}
                      >
                        {poster || backdrop ? (
                          <>
                            <img
                              src={poster || backdrop}
                              alt={title}
                              className="h-full w-full object-cover md:hidden"
                            />
                            <img
                              src={backdrop || poster}
                              alt={title}
                              className="hidden md:block h-full w-full object-cover"
                            />
                          </>
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xs text-zinc-300 px-2 text-center">
                            {title}
                          </div>
                        )}
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2 pb-2 pt-6 hidden md:block">
                          <p className="text-[11px] md:text-xs font-medium truncate">
                            {title}
                          </p>
                        </div>
                        {rank && (
                          <div className="pointer-events-none absolute -left-1 bottom-1 hidden md:block">
                            <span className="text-4xl lg:text-5xl font-black text-transparent stroke-[3px] stroke-white drop-shadow-[0_0_10px_rgba(0,0,0,0.9)]">
                              {rank}
                            </span>
                          </div>
                        )}
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-[#9146FF] flex items-center justify-center shadow-lg shadow-black/40">
                            <span className="ml-0.5 text-white text-lg md:text-xl">
                              ▶
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="mt-1 text-[11px] sm:text-xs font-medium truncate md:hidden">
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
