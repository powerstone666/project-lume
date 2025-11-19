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

  const movieSlides = (trendingMovies || []).slice(0, 5).map((item) => ({
    ...item,
    _mediaType: 'movie',
  }));

  const showSlides = (shows || []).slice(0, 5).map((item) => ({
    ...item,
    _mediaType: 'tv',
  }));

  const slides = [...movieSlides, ...showSlides];

  if (loading && slides.length === 0) {
    return (
      <div className="relative w-full h-[55vh] lg:h-[75vh] overflow-hidden bg-black">
        <div className="absolute inset-0 bg-zinc-800 animate-pulse" />
        <div className="relative h-full flex flex-col justify-end px-4 sm:px-6 md:px-12 pb-10 sm:pb-12 space-y-3">
          <div className="h-6 sm:h-8 w-40 sm:w-64 bg-zinc-700/80 rounded-md" />
          <div className="hidden md:block h-4 w-72 bg-zinc-700/70 rounded-md" />
          <div className="hidden md:block h-4 w-56 bg-zinc-700/60 rounded-md" />
          <div className="flex gap-3 mt-3">
            <div className="h-9 w-24 bg-zinc-700/80 rounded-full" />
            <div className="h-9 w-28 bg-zinc-700/60 rounded-full" />
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
    <div className="relative w-full h-[55vh] lg:h-[75vh] text-white overflow-hidden">
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
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${backdropUrl})` }}
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />

                <div className="relative h-full flex flex-col justify-end md:justify-center px-4 sm:px-6 md:px-12 pb-10 sm:pb-12 space-y-2 sm:space-y-3 md:space-y-4">
                  <h1 className="text-xl sm:text-2xl md:text-4xl font-bold mb-1 sm:mb-2 max-w-xs sm:max-w-md md:max-w-xl">
                    {title}
                  </h1>
                  <p className="hidden md:block max-w-xl text-sm text-gray-200 overflow-hidden">
                    {item.overview}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                    {score && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-black/60 text-sm font-semibold">
                        <span className="mr-2 text-yellow-400 text-base">★</span>
                        Score {score}
                      </span>
                    )}
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-1.5 md:px-5 md:py-2 rounded-full text-sm md:text-base font-semibold bg-[#9146FF] hover:bg-[#772ce8] transition-colors shadow-lg shadow-black/40 cursor-pointer"
                      onClick={() => navigate(`/stream/${item._mediaType}/${item.id}`)}
                    >
                      <span className="mr-2 inline-flex items-center justify-center">
                        <span className="w-0 h-0 border-t-4 border-b-4 border-l-6 border-t-transparent border-b-transparent border-l-white" />
                      </span>
                      Play
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-1.5 md:px-5 md:py-2 rounded-full text-sm md:text-base font-semibold bg-white/10 hover:bg-white/20 transition-colors border border-white/30 cursor-pointer"
                      onClick={() => navigate(`/stream/${item._mediaType}/${item.id}`)}
                    >
                      <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">
                        i
                      </span>
                      More info
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
