import { useEffect, useState } from 'react';
import { usePrivateNavigate } from '../hooks/usePrivateNavigate';
import { useDispatch, useSelector } from 'react-redux';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { fetchDiscoverMedia, fetchTrendingMoviesInIndia, fetchTrendingShowsInIndia } from '../Api-services/tmbd';
import { setTrendingMovies } from '../StateManager/Context';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { Button } from './Button';

const TRENDING_INDIA_KEY = 'trending-in-india';
const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function Banner({ category = TRENDING_INDIA_KEY }) {
  const navigate = usePrivateNavigate();
  const dispatch = useDispatch();
  const trendingMovies = useSelector((state) => state.trending.movies);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shows, setShows] = useState([]);
  const [animeItems, setAnimeItems] = useState([]);
  const [openingSlideKey, setOpeningSlideKey] = useState(null);

  // The anime page has its own featured titles: popular Japanese animation.
  useEffect(() => {
    if (category !== 'anime') return;
    let isMounted = true;
    setLoading(true);
    fetchDiscoverMedia({
      cacheKey: 'banner-anime',
      mediaType: 'tv',
      params: { sort_by: 'popularity.desc', with_genres: '16', with_original_language: 'ja', 'vote_count.gte': 100 },
    })
      .then((items) => {
        if (isMounted) setAnimeItems(items.filter((item) => item.backdrop_path).slice(0, 6));
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load banner.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [category]);

  useEffect(() => {
    if (category === 'anime') return undefined;
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
  if (category === 'anime') {
    slides = animeItems.map((item) => ({ ...item, _mediaType: 'tv' }));
  } else if (category === 'trending-movies') {
    slides = movieSlides;
  } else if (category === 'trending-shows') {
    slides = showSlides;
  } else {
    // trending-in-india or default - show both
    slides = [...movieSlides, ...showSlides];
  }

  const openTitle = (item, slideKey) => {
    // Animation genre (16) + Japanese language ('ja') means anime.
    const isAnime =
      (item.genre_ids?.includes(16) || item.genres?.some((g) => g.id === 16)) &&
      item.original_language === 'ja';
    const type = isAnime && item._mediaType === 'tv' ? 'anime' : item._mediaType;

    setOpeningSlideKey(slideKey);
    navigate(`/stream/${type}/${item.id}`);
  };

  const heroSize = 'h-[70vh] min-h-[28rem] lg:h-[85vh]';

  if (loading && slides.length === 0) {
    return (
      <div className={`skeleton w-full ${heroSize}`} aria-busy="true" aria-label="Loading featured titles" />
    );
  }

  if (error && slides.length === 0) {
    return (
      <div role="alert" className={`flex w-full items-center justify-center bg-error-container px-6 text-center text-on-error-container ${heroSize}`}>
        {error}
      </div>
    );
  }

  if (slides.length === 0) {
    return null;
  }

  return (
    <section aria-label="Featured titles">
      <Swiper
        modules={[Autoplay, Pagination]}
        slidesPerView={1}
        loop
        autoplay={prefersReducedMotion ? false : { delay: 7000, disableOnInteraction: true, pauseOnMouseEnter: true }}
        pagination={{ clickable: true }}
        className={`banner-swiper bg-surface-lowest ${heroSize}`}
      >
        {slides.map((item) => {
          const backdropUrl = item.backdrop_path
            ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
            : item.poster_path
              ? `https://image.tmdb.org/t/p/w780${item.poster_path}`
              : null;

          const title = item.title || item.name || '';
          const score =
            typeof item.vote_average === 'number' && item.vote_average > 0
              ? Math.round(item.vote_average * 10)
              : null;
          const releaseDate = item.release_date || item.first_air_date;
          const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
          const slideKey = `${item._mediaType}-${item.id || title}`;
          const isOpening = openingSlideKey === slideKey;

          return (
            <SwiperSlide key={slideKey}>
              <div className="relative h-full w-full">
                {backdropUrl && (
                  <img
                    src={backdropUrl}
                    alt=""
                    width="1920"
                    height="1080"
                    fetchPriority="high"
                    className="absolute inset-0 h-full w-full object-cover object-top"
                  />
                )}

                {/* Netflix billboard fades: left for text, bottom into the first row. */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-surface via-surface/60 to-transparent" />

                <div className="relative z-10 flex h-full flex-col justify-end gap-4 px-4 pb-24 md:max-w-2xl md:justify-center md:px-12 md:pb-16 lg:max-w-3xl">
                  <h2 className="text-4xl font-black leading-none text-on-surface drop-shadow-lg md:text-6xl lg:text-7xl">
                    {title}
                  </h2>
                  <p className="flex items-center gap-3 text-base font-medium">
                    {score && <span className="font-bold text-tertiary">{score}% match</span>}
                    {year && <span className="text-on-surface-variant">{year}</span>}
                    <span className="text-on-surface-variant">
                      {item._mediaType === 'tv' ? 'Series' : 'Movie'}
                    </span>
                  </p>
                  <p className="hidden line-clamp-3 text-lg leading-snug text-on-surface drop-shadow-md md:block">
                    {item.overview}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <Button
                      size="lg"
                      icon={<PlayArrowRounded fontSize="large" aria-hidden="true" />}
                      loading={isOpening}
                      onClick={() => openTitle(item, slideKey)}
                    >
                      Play
                    </Button>
                    <Button
                      size="lg"
                      variant="tonal"
                      icon={<InfoOutlined aria-hidden="true" />}
                      disabled={isOpening}
                      onClick={() => openTitle(item, slideKey)}
                    >
                      More Info
                    </Button>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </section>
  );
}

export default Banner;
