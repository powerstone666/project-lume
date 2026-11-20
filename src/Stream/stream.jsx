import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { usePrivateNavigate } from '../hooks/usePrivateNavigate';
import {
  fetchMediaDetails,
  fetchRecommendations,
  fetchSeasonDetails,
  fetchSimilar,
} from '../Api-services/tmbd';
import { createPlayerUrl } from './playerUrl';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import { Button, IconButton } from '../Common-ui/Button';

function Stream() {
  const { mediaType = 'movie', id } = useParams();
  const navigate = usePrivateNavigate();

  const [details, setDetails] = useState(null);
  const [trailerKey, setTrailerKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [seasonEpisodes, setSeasonEpisodes] = useState({});
  const [activeTvTab, setActiveTvTab] = useState('episodes'); // 'episodes' | 'similar'
  const [selectedEpisodeNumber, setSelectedEpisodeNumber] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const isPlaying = searchParams.get('play') === '1';
  // Ensure we start at the top whenever this page mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        setSelectedSeason(null);
        setSeasonEpisodes({});
        if (cancelled) return;

        const data = await fetchMediaDetails(mediaType, id);
        if (cancelled) return;

        setDetails(data);

        const videos = (data.videos && data.videos.results) || [];
        const best =
          videos.find(
            (v) =>
              v.site === 'YouTube' && v.type === 'Trailer' && v.official,
          ) ||
          videos.find(
            (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'),
          ) ||
          videos.find((v) => v.site === 'YouTube');

        setTrailerKey(best && best.key ? best.key : null);
      } catch (err) {
        if (cancelled) return;
        setError(err.message || 'Failed to load title.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (id) {
      load();
    }

    return () => {
      cancelled = true;
    };
  }, [id, mediaType]);

  // Load recommendations once details are available, fallback to similar if empty
  useEffect(() => {
    let cancelled = false;

    async function loadRecommendations() {
      if (!details || !id) return;
      try {
        // Try recommendations first
        let recs = await fetchRecommendations(mediaType, id);
        
        // If recommendations are empty, try similar content
        if (!recs || recs.length === 0) {
          recs = await fetchSimilar(mediaType, id);
        }
        
        if (cancelled) return;
        setRecommended(Array.isArray(recs) ? recs : []);
      } catch {
        if (!cancelled) {
          setRecommended([]);
        }
      }
    }

    loadRecommendations();

    return () => {
      cancelled = true;
    };
  }, [details, id, mediaType]);

  // For TV, set default season once details loaded
  useEffect(() => {
    if ((mediaType !== 'tv' && mediaType !== 'anime') || !details) return;

    const seasonsArr = Array.isArray(details.seasons) ? details.seasons : [];
    const defaultSeason =
      seasonsArr.find((s) => s.season_number > 0) || seasonsArr[0];

    if (defaultSeason && selectedSeason === null) {
      setSelectedSeason(defaultSeason.season_number);
    }
  }, [mediaType, details, selectedSeason]);

  // Load episodes for selected season (TV only)
  useEffect(() => {
    if ((mediaType !== 'tv' && mediaType !== 'anime') || !id || selectedSeason == null) return;
    if (seasonEpisodes[selectedSeason]) return;

    let cancelled = false;

    async function loadSeason() {
      try {
        const data = await fetchSeasonDetails(id, selectedSeason);
        if (cancelled) return;
        const eps = Array.isArray(data.episodes) ? data.episodes : [];
        setSeasonEpisodes((prev) => ({
          ...prev,
          [selectedSeason]: eps,
        }));
      } catch {
        // ignore, just no episodes
      }
    }

    loadSeason();

    return () => {
      cancelled = true;
    };
  }, [mediaType, id, selectedSeason, seasonEpisodes]);

  const isSeries = mediaType === 'tv' || mediaType === 'anime';

  const title =
    details?.title || details?.name || details?.original_title || 'Unknown';

  const backdropUrl = details?.backdrop_path
    ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
    : details?.poster_path
      ? `https://image.tmdb.org/t/p/w1280${details.poster_path}`
      : null;

  const year =
    details?.release_date || details?.first_air_date
      ? new Date(details.release_date || details.first_air_date).getFullYear()
      : null;

  const genresLabel = Array.isArray(details?.genres)
    ? details.genres.map((g) => g.name).filter(Boolean).join(' • ')
    : null;

  let ageRating = null;

  if (mediaType === 'movie' && details?.release_dates?.results) {
    const results = details.release_dates.results;
    const byCountry = (code) =>
      results.find((r) => r.iso_3166_1 === code && Array.isArray(r.release_dates));

    const countryBlock = byCountry('IN') || byCountry('US') || results[0];

    if (countryBlock && Array.isArray(countryBlock.release_dates)) {
      const withCert = countryBlock.release_dates.find(
        (r) => r.certification && r.certification.trim().length > 0,
      );
      if (withCert) {
        ageRating = withCert.certification;
      }
    }
  } else if ((mediaType === 'tv' || mediaType === 'anime') && details?.content_ratings?.results) {
    const results = details.content_ratings.results;
    const byCountry = (code) =>
      results.find((r) => r.iso_3166_1 === code && r.rating);

    const ratingEntry = byCountry('IN') || byCountry('US') || results[0];

    if (ratingEntry && ratingEntry.rating) {
      ageRating = ratingEntry.rating;
    }
  }

  let seasonsLabel = null;
  if (mediaType === 'tv' || mediaType === 'anime') {
    const seasons = details?.number_of_seasons;

    if (seasons) {
      seasonsLabel = `${seasons} season${seasons > 1 ? 's' : ''}`;
    }
  }

  const runtime =
    details?.runtime ||
    (Array.isArray(details?.episode_run_time) &&
      details.episode_run_time[0]);

  const cast =
    (details?.credits && Array.isArray(details.credits.cast)
      ? details.credits.cast.slice(0, 10)
      : []) || [];

  const tvEpisodes =
    (mediaType === 'tv' || mediaType === 'anime') && selectedSeason != null
      ? (seasonEpisodes[selectedSeason] || []).filter((ep) => {
          if (!ep.air_date) return false;
          const todayStr = new Date().toISOString().slice(0, 10);
          return ep.air_date <= todayStr;
        })
      : [];

  const firstEpisodeNumber =
    (tvEpisodes[0] && tvEpisodes[0].episode_number) || 1;
  const playerSrc = createPlayerUrl({
    mediaType,
    id,
    season: selectedSeason || 1,
    episode: selectedEpisodeNumber || firstEpisodeNumber,
  });

  const matchScore =
    typeof details?.vote_average === 'number' && details.vote_average > 0
      ? Math.round(details.vote_average * 10)
      : null;

  if (loading) {
    return (
      <div className="min-h-screen" aria-busy="true" aria-label="Loading title">
        <div className="skeleton h-[60vh] w-full" />
        <div className="space-y-3 px-4 py-6 md:px-12">
          <div className="skeleton h-7 w-48 rounded-sm" />
          <div className="skeleton h-4 w-72 rounded-sm" />
          <div className="skeleton h-4 w-64 rounded-sm" />
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p role="alert" className="text-on-surface-variant">{error || 'Not found.'}</p>
        <Button onClick={() => navigate('/')} icon={<ArrowBackRounded aria-hidden="true" />}>
          Go home
        </Button>
      </div>
    );
  }

  const posterGrid = (basePath) => (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:gap-3 lg:grid-cols-5 xl:grid-cols-6">
      {recommended.slice(0, 18).map((item) => {
        const img = item.poster_path
          ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
          : item.backdrop_path
            ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}`
            : null;
        const recTitle = item.title || item.name || item.original_title || 'Untitled';

        return (
          <button
            type="button"
            key={item.id}
            className="group text-left"
            onClick={() => navigate(`${basePath}/${item.id}`)}
          >
            <span className="block aspect-[2/3] w-full overflow-hidden rounded-sm bg-surface-container transition-transform duration-300 group-hover:scale-105 group-focus-visible:scale-105">
              {img ? (
                <img
                  src={img}
                  alt=""
                  width="342"
                  height="513"
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-on-surface-variant">
                  {recTitle}
                </span>
              )}
            </span>
            <span className="mt-2 block truncate text-sm font-medium">{recTitle}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen">
      <div className="relative left-1/2 h-[55vh] w-screen -translate-x-1/2 overflow-hidden md:h-[65vh] lg:h-[75vh]">
        {isPlaying ? (
          <div id="video-slot" className="absolute inset-0 z-20 bg-black" />
        ) : trailerKey ? (
          <div className="absolute inset-0 overflow-hidden">
            <iframe
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                width: '100vw',
                height: '56.25vw', // 16:9 aspect ratio
                minHeight: '100%',
                minWidth: '177.77vh', // 16:9 aspect ratio
              }}
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${trailerKey}&modestbranding=1`}
              title="Trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onError={() => setTrailerKey(null)}
            />
          </div>
        ) : (
          backdropUrl && (
            <img src={backdropUrl} alt="" className="absolute inset-0 h-full w-full object-cover object-top" />
          )
        )}

        {!isPlaying && (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-surface via-surface/70 to-transparent" />
          </>
        )}

        {!isPlaying && (
          <IconButton
            label="Go back"
            variant="tonal"
            onClick={() => navigate('/')}
            className="absolute left-4 top-20 z-20 md:left-12 md:top-24"
          >
            <ArrowBackRounded />
          </IconButton>
        )}

        {!isPlaying ? (
          <div className="relative z-10 flex h-full max-w-3xl flex-col justify-end gap-4 px-4 pb-8 md:px-12 md:pb-14">
            <h1 className="text-4xl font-black leading-none drop-shadow-lg md:text-6xl lg:text-7xl">
              {title}
            </h1>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base font-medium">
              {matchScore && <span className="font-bold text-tertiary">{matchScore}% match</span>}
              {year && <span className="text-on-surface-variant">{year}</span>}
              {ageRating && (
                <span className="rounded-sm border border-outline px-1.5 text-sm text-on-surface-variant">
                  {ageRating}
                </span>
              )}
              {runtime ? <span className="text-on-surface-variant">{runtime} min</span> : null}
              {seasonsLabel && <span className="text-on-surface-variant">{seasonsLabel}</span>}
            </p>
            <p className="line-clamp-3 max-w-2xl text-base leading-snug md:line-clamp-none md:text-lg">
              {details.overview}
            </p>
            <div className="mt-1 flex items-center gap-3">
              <Button
                size="lg"
                icon={<PlayArrowRounded fontSize="large" aria-hidden="true" />}
                onClick={() => setSearchParams({ play: '1' })}
              >
                Play
              </Button>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-black" />
        )}
      </div>

      {(genresLabel || cast.length > 0) && (
        <section className="grid gap-6 px-4 py-8 text-sm md:grid-cols-[1fr_auto] md:px-12">
          <div className="space-y-2">
            {cast.length > 0 && (
              <p>
                <span className="text-on-surface-variant">Cast: </span>
                {cast.map((person) => person.name).join(', ')}
              </p>
            )}
            {genresLabel && (
              <p>
                <span className="text-on-surface-variant">Genres: </span>
                {genresLabel}
              </p>
            )}
          </div>
          <p className="max-w-sm text-xs text-on-surface-variant">
            Audio language may vary by server. If an official Hindi server is not available, try
            switching to the Flix server.
          </p>
        </section>
      )}

      {/* Movie: More like this */}
      {!isSeries && recommended.length > 0 && (
        <section className="space-y-3 px-4 pb-6 md:px-12 md:pb-8">
          <h2 className="text-xl font-bold">More Like This</h2>
          {posterGrid(`/stream/${mediaType}`)}
        </section>
      )}

      {/* TV: Episodes / More like this */}
      {isSeries && (
        <section className="space-y-4 px-4 pb-6 md:px-12 md:pb-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant">
            <div role="tablist" aria-label="Series sections" className="flex gap-6">
              {[
                { id: 'episodes', label: 'Episodes' },
                { id: 'similar', label: 'More Like This' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTvTab === tab.id}
                  onClick={() => setActiveTvTab(tab.id)}
                  className={`-mb-px border-b-4 py-3 text-base font-bold transition-colors ${
                    activeTvTab === tab.id
                      ? 'border-primary text-on-surface'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTvTab === 'episodes' &&
              Array.isArray(details.seasons) &&
              details.seasons.length > 0 && (
                <select
                  aria-label="Season"
                  value={selectedSeason ?? ''}
                  onChange={(e) => {
                    setSelectedSeason(Number(e.target.value));
                    setSelectedEpisodeNumber(null);
                  }}
                  className="cursor-pointer rounded-sm border border-outline bg-surface-container px-3 py-2 text-sm font-medium text-on-surface"
                >
                  {details.seasons
                    .filter((s) => s.season_number > 0)
                    .map((s) => (
                      <option key={s.id || s.season_number} value={s.season_number}>
                        Season {s.season_number}
                      </option>
                    ))}
                </select>
              )}
          </div>

          {activeTvTab === 'episodes' ? (
            <ol className="divide-y divide-outline-variant">
              {tvEpisodes.map((ep) => {
                const still = ep.still_path
                  ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
                  : null;
                const isSelected = selectedEpisodeNumber === ep.episode_number;

                return (
                  <li key={ep.id}>
                    <button
                      type="button"
                      aria-label={`Play episode ${ep.episode_number}, ${ep.name}`}
                      className={`group flex w-full items-center gap-4 rounded-sm px-2 py-4 text-left transition-colors md:gap-6 md:px-4 ${
                        isSelected ? 'bg-surface-high' : 'hover:bg-surface-container'
                      }`}
                      onClick={() => {
                        setSelectedEpisodeNumber(ep.episode_number);
                        setSearchParams({
                          play: '1',
                          season: selectedSeason.toString(),
                          episode: ep.episode_number.toString(),
                        });
                      }}
                    >
                      <span className="w-6 shrink-0 text-center text-xl text-on-surface-variant md:w-10 md:text-2xl">
                        {ep.episode_number}
                      </span>
                      <span className="relative block aspect-video w-28 shrink-0 overflow-hidden rounded-sm bg-surface-container md:w-44">
                        {still && (
                          <img
                            src={still}
                            alt=""
                            width="300"
                            height="169"
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                          />
                        )}
                        <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                          <PlayArrowRounded />
                        </span>
                      </span>
                      <span className="min-w-0 flex-1 space-y-1">
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="truncate text-sm font-bold md:text-base">{ep.name}</span>
                          {ep.runtime ? (
                            <span className="shrink-0 text-sm text-on-surface-variant">{ep.runtime}m</span>
                          ) : null}
                        </span>
                        {ep.overview && (
                          <span className="line-clamp-2 block text-xs text-on-surface-variant md:text-sm">
                            {ep.overview}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
              {tvEpisodes.length === 0 && (
                <li className="py-6 text-sm text-on-surface-variant">
                  No episode information available for this season.
                </li>
              )}
            </ol>
          ) : (
            recommended.length > 0 && posterGrid(`/stream/${mediaType}`)
          )}
        </section>
      )}
    </div>
  );
}

export default Stream;
