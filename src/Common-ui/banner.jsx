import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { fetchTrendingMoviesInIndia, fetchTrendingShowsInIndia } from '../Api-services/tmbd';
import { setTrendingMovies } from '../StateManager/Context';

const TRENDING_INDIA_KEY = 'trending-in-india';

function Banner({ category = TRENDING_INDIA_KEY }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const trendingMovies = useSelector((state) => state.trending.movies);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shows, setShows] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadContent() {
      try {
        setLoading(true);
        setError(null);

        const [movies, tvShows] = await Promise.all([
          trendingMovies && trendingMovies.length > 0
            ? Promise.resolve(trendingMovies)
            : fetchTrendingMoviesInIndia(),
          shows && shows.length > 0
            ? Promise.resolve(shows)
            : fetchTrendingShowsInIndia(),
        ]);

        if (!isMounted) return;

        if (!trendingMovies || trendingMovies.length === 0) {
          dispatch(setTrendingMovies(movies));
        }

        if (!shows || shows.length === 0) {
          setShows(tvShows);
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || 'Failed to load banner.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (
      (!trendingMovies || trendingMovies.length === 0) ||
      (!shows || shows.length === 0)
    ) {
      loadContent();
    }

    return () => {
      isMounted = false;
    };
  }, [category, dispatch, trendingMovies, shows]);

  const isNotAnime = (item) => {
    return !((item.genre_ids?.includes(16) || item.genres?.some(g => g.id === 16)) && item.original_language === 'ja');
  };

  const movieSlides = (trendingMovies || [])
    .filter(isNotAnime)
    .slice(0, 5)
    .map((item) => ({
      ...item,
      _mediaType: 'movie',
    }));

  const showSlides = (shows || [])
    .filter(isNotAnime)
    .slice(0, 5)
    .map((item) => ({
      ...item,
      _mediaType: 'tv',
    }));

  // Filter slides based on category
  let slides = [];
  if (category === 'trending-movies') {
    slides = movieSlides;
  } else if (category === 'trending-shows') {
    slides = showSlides;
  } else {
    // trending-in-india or default - show both
    slides = [...movieSlides, ...showSlides];
  }

  if (loading && slides.length === 0) {
    return (
      <div className="relative w-full h-[55vh] lg:h-[75vh] overflow-hidden bg-black -mt-14">
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 to-zinc-800 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-600/20 to-transparent animate-shimmer" />
        </div>
        <div className="relative h-full flex flex-col justify-end px-4 sm:px-6 md:px-12 pb-10 sm:pb-12 space-y-4">
          <div className="h-10 sm:h-14 md:h-16 w-48 sm:w-80 md:w-96 bg-gradient-to-r from-zinc-700 via-zinc-600 to-zinc-700 rounded-lg overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-500/30 to-transparent animate-shimmer" />
          </div>
          <div className="hidden md:block h-5 w-full max-w-2xl bg-gradient-to-r from-zinc-700 via-zinc-600 to-zinc-700 rounded-md overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-500/30 to-transparent animate-shimmer" />
          </div>
          <div className="flex gap-3 mt-4">
            <div className="h-12 w-32 bg-gradient-to-r from-purple-900/50 to-purple-800/50 rounded-full overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-600/30 to-transparent animate-shimmer" />
            </div>
            <div className="h-12 w-36 bg-gradient-to-r from-zinc-700 via-zinc-600 to-zinc-700 rounded-full overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-500/30 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && slides.length === 0) {
    return (
      <div className="w-full h-[50vh] lg:h-[75vh] flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  if (slides.length === 0) {
    return <div className="w-full h-[50vh] lg:h-[75vh]" />;
  }

  return (
    <div className="relative w-full h-[55vh] lg:h-[75vh] text-white overflow-hidden ">
      <Swiper
        modules={[Autoplay, Pagination]}
        slidesPerView={1}
        loop
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        className="h-full banner-swiper"
      >
        {slides.map((item) => {
          const backdropUrl = item.backdrop_path
            ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
            : item.poster_path
              ? `https://image.tmdb.org/t/p/original${item.poster_path}`
              : null;

          const title = item.title || item.name || '';
          const score =
            typeof item.vote_average === 'number'
              ? item.vote_average.toFixed(1)
              : null;

          return (
            <SwiperSlide key={`${item._mediaType}-${item.id || title}`}>
              <div className="relative w-full h-full">
                {backdropUrl && (
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
                    style={{ backgroundImage: `url(${backdropUrl})` }}
                  />
                )}

                {/* Enhanced gradient overlay with better depth */}
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                <div className="relative h-full flex flex-col justify-end md:justify-center px-4 sm:px-6 md:px-12 lg:px-16 pb-12 sm:pb-16 md:pb-20 space-y-3 sm:space-y-4 md:space-y-6">
                  {/* Enhanced title with gradient */}
                  <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black mb-2 sm:mb-3 max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-4xl bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent drop-shadow-2xl leading-tight">
                    {title}
                  </h1>
                  {/* Enhanced overview text */}
                  <p className="hidden md:block max-w-xl lg:max-w-2xl text-base lg:text-lg text-gray-100 leading-relaxed drop-shadow-lg line-clamp-3">
                    {item.overview}
                  </p>
                  <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-4 overflow-x-auto no-scrollbar">
                    {score && (
                      <span className="inline-flex items-center px-2 py-1 md:px-4 md:py-2 rounded-full bg-black/70 backdrop-blur-sm text-xs md:text-base font-bold border border-white/10 shadow-xl shrink-0">
                        <span className="mr-1 md:mr-2 text-yellow-400 text-sm md:text-lg">★</span>
                        <span className="text-white">{score}</span>
                      </span>
                    )}
                    {/* Enhanced Play button */}
                    <button
                      type="button"
                      className="group inline-flex items-center px-3 py-1.5 md:px-8 md:py-3.5 rounded-full text-xs md:text-lg font-bold bg-[#9146FF] hover:bg-[#772ce8] transition-all duration-300 shadow-2xl shadow-purple-900/50 cursor-pointer hover:scale-105 hover:shadow-purple-500/50 shrink-0"
                      onClick={() => {
                        // Check for Anime: Animation genre (16) + Japanese language ('ja')
                        const isAnime = 
                          (item.genre_ids?.includes(16) || item.genres?.some(g => g.id === 16)) && 
                          item.original_language === 'ja';
                        
                        const type = (isAnime && item._mediaType === 'tv') ? 'anime' : item._mediaType;
                        navigate(`/stream/${type}/${item.id}`);
                      }}
                    >
                      <span className="mr-1.5 md:mr-3 text-base md:text-2xl transition-transform group-hover:scale-110">▶</span>
                      Play Now
                    </button>
                    {/* Enhanced More Info button */}
                    <button
                      type="button"
                      className="group inline-flex items-center px-3 py-1.5 md:px-8 md:py-3.5 rounded-full text-xs md:text-lg font-bold bg-black/50 hover:bg-white/20 backdrop-blur-sm transition-all duration-300 border-2 border-white/40 hover:border-white/60 cursor-pointer hover:scale-105 shadow-xl shrink-0"
                      onClick={() => {
                        // Check for Anime: Animation genre (16) + Japanese language ('ja')
                        const isAnime = 
                          (item.genre_ids?.includes(16) || item.genres?.some(g => g.id === 16)) && 
                          item.original_language === 'ja';
                        
                        const type = (isAnime && item._mediaType === 'tv') ? 'anime' : item._mediaType;
                        navigate(`/stream/${type}/${item.id}`);
                      }}
                    >
                      <span className="mr-1.5 md:mr-3 inline-flex h-4 w-4 md:h-6 md:w-6 items-center justify-center rounded-full bg-white/30 text-[10px] md:text-sm font-black transition-all group-hover:bg-white/50">
                        i
                      </span>
                      More Info
                    </button>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}

export default Banner;
