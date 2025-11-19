import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchMediaDetails,
  fetchRecommendations,
  fetchSeasonDetails,
} from '../Api-services/tmbd';

function Stream() {
  const { mediaType = 'movie', id } = useParams();
  const navigate = useNavigate();

  const [details, setDetails] = useState(null);
  const [trailerKey, setTrailerKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [seasonEpisodes, setSeasonEpisodes] = useState({});
  const [activeTvTab, setActiveTvTab] = useState('episodes'); // 'episodes' | 'similar'
  const [selectedEpisodeNumber, setSelectedEpisodeNumber] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerLoading, setIsPlayerLoading] = useState(false);

  // Ensure we start at the top whenever this page mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, []);

  // Lock scroll when video player is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isPlaying) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isPlaying]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

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

  // Load recommendations once details are available
  useEffect(() => {
    let cancelled = false;

    async function loadRecommendations() {
      if (!details || !id) return;
      try {
        const recs = await fetchRecommendations(mediaType, id);
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
    if (mediaType !== 'tv' || !details) return;

    const seasonsArr = Array.isArray(details.seasons) ? details.seasons : [];
    const defaultSeason =
      seasonsArr.find((s) => s.season_number > 0) || seasonsArr[0];

    if (defaultSeason && defaultSeason.season_number !== selectedSeason) {
      setSelectedSeason(defaultSeason.season_number);
    }
  }, [mediaType, details, selectedSeason]);

  // Load episodes for selected season (TV only)
  useEffect(() => {
    if (mediaType !== 'tv' || !id || selectedSeason == null) return;
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

  const score =
    typeof details?.vote_average === 'number'
      ? details.vote_average.toFixed(1)
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
  } else if (mediaType === 'tv' && details?.content_ratings?.results) {
    const results = details.content_ratings.results;
    const byCountry = (code) =>
      results.find((r) => r.iso_3166_1 === code && r.rating);

    const ratingEntry = byCountry('IN') || byCountry('US') || results[0];

    if (ratingEntry && ratingEntry.rating) {
      ageRating = ratingEntry.rating;
    }
  }

  let seasonsLabel = null;
  let episodesLabel = null;

  if (mediaType === 'tv') {
    const seasons = details?.number_of_seasons;
    const firstSeason =
      Array.isArray(details?.seasons) && details.seasons.length > 0
        ? details.seasons[0]
        : null;

    if (seasons) {
      seasonsLabel = `${seasons} season${seasons > 1 ? 's' : ''}`;
    }

    if (firstSeason && typeof firstSeason.episode_count === 'number') {
      episodesLabel = `${firstSeason.episode_count} in Season 1`;
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
    mediaType === 'tv' && selectedSeason != null
      ? (seasonEpisodes[selectedSeason] || []).filter((ep) => {
          if (!ep.air_date) return false;
          const todayStr = new Date().toISOString().slice(0, 10);
          return ep.air_date <= todayStr;
        })
      : [];

  const cinemaOsBaseUrl = 'https://cinemaos.tech/player';
  let playerSrc = null;
  if (id) {
    if (mediaType === 'tv') {
      const seasonNum = selectedSeason || 1;
      const firstEpisodeNumber =
        (tvEpisodes[0] && tvEpisodes[0].episode_number) || 1;
      const episodeNumber = selectedEpisodeNumber || firstEpisodeNumber;
      playerSrc = `${cinemaOsBaseUrl}/${id}/${seasonNum}/${episodeNumber}`;
    } else {
      playerSrc = `${cinemaOsBaseUrl}/${id}`;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="relative w-full h-[60vh] bg-zinc-900 animate-pulse" />
        <div className="px-6 py-6 space-y-3">
          <div className="h-7 w-40 bg-zinc-800 rounded-md" />
          <div className="h-4 w-64 bg-zinc-800 rounded-md" />
          <div className="h-4 w-56 bg-zinc-800 rounded-md" />
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
        <p className="mb-4 text-red-400 text-sm">{error || 'Not found.'}</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-full bg-[#9146FF] hover:bg-[#772ce8] text-sm font-semibold"
        >
          ← Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative w-screen h-[60vh] lg:h-[70vh] overflow-hidden left-1/2 -translate-x-1/2">
        {isPlaying && playerSrc ? (
          <div className="absolute inset-0">
            <iframe
              title={title}
              src={playerSrc}
              className="h-full w-full border-0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              onLoad={() => setIsPlayerLoading(false)}
            />
            {isPlayerLoading && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black">
                <div className="h-10 w-10 rounded-full border-4 border-[#9146FF] border-t-transparent animate-spin" />
              </div>
            )}
          </div>
        ) : (
          backdropUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${backdropUrl})` }}
            />
          )
        )}

        {!isPlaying && (
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
        )}

        {!isPlaying && (
          <button
            type="button"
            onClick={() => navigate('/')}
            className="absolute left-4 top-4 z-20 rounded-full bg-black/70 px-3 py-1 text-sm hover:bg-black cursor-pointer"
          >
            ← Back
          </button>
        )}

        {!isPlaying ? (
          <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-4 md:px-12 md:pb-6 space-y-3 max-w-4xl">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold">
              {title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-gray-300">
              {year && <span>{year}</span>}
              {runtime && (
                <span>
                  {runtime}
                  min
                </span>
              )}
              {mediaType === 'tv' && <span>Series</span>}
            </div>
            <p className="max-w-2xl text-sm md:text-base text-gray-200 line-clamp-3 md:line-clamp-none">
              {details.overview}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <button
                type="button"
                className="inline-flex items-center px-5 py-2 rounded-full text-sm md:text-base font-semibold bg-[#9146FF] hover:bg-[#772ce8] transition-colors shadow-lg shadow-black/40 cursor-pointer"
                onClick={() => {
                  setIsPlayerLoading(true);
                  setIsPlaying(true);
                }}
              >
                <span className="mr-2 inline-flex items-center justify-center">
                  <span className="w-0 h-0 border-t-4 border-b-4 border-l-6 border-t-transparent border-b-transparent border-l-white" />
                </span>
                Play
              </button>
              {score && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-black/60 text-sm font-semibold">
                  <span className="mr-2 text-yellow-400 text-base">★</span>
                  Score
                  {' '}
                  {score}
                </span>
              )}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setIsPlayerLoading(false);
            }}
            className="absolute right-4 top-4 z-20 rounded-full bg-black/70 px-3 py-1 text-sm hover:bg-black cursor-pointer"
          >
            ✕ Close
          </button>
        )}
      </div>

      {cast.length > 0 && (
        <section className="px-4 md:px-8 pt-2 pb-6 space-y-4">
          {(genresLabel || ageRating || seasonsLabel) && (
            <>
              <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-300 mb-1">
                {genresLabel && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 text-[11px] md:text-xs truncate max-w-full md:max-w-lg">
                    {genresLabel}
                  </span>
                )}
                {ageRating && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-gray-600 bg-black/40 text-[11px] md:text-xs text-gray-100">
                    {ageRating}
                  </span>
                )}
                {seasonsLabel && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/5 text-[11px] md:text-xs">
                    {seasonsLabel}
                  </span>
                )}
              </div>
              <p className="text-[10px] md:text-[11px] text-gray-500 mb-3 max-w-full md:max-w-lg">
                Note: Audio language may vary by cloud server selected. If no official Hindi server
                is available, try switching to the Flix server.
              </p>
            </>
          )}
          <h2 className="text-lg md:text-xl font-semibold">Actors</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {cast.map((person) => (
              <div
                key={person.id}
                className="flex-shrink-0 w-24 md:w-32 bg-zinc-900 rounded-lg overflow-hidden"
              >
                {person.profile_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                    alt={person.name}
                    className="h-28 w-full object-cover"
                  />
                ) : (
                  <div className="h-28 w-full flex items-center justify-center text-xs text-gray-400">
                    {person.name}
                  </div>
                )}
                <div className="px-2 py-1">
                  <p className="text-[11px] font-semibold truncate">
                    {person.name}
                  </p>
                  {person.character && (
                    <p className="text-[10px] text-gray-400 truncate">
                      as
                      {' '}
                      {person.character}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Full-screen player overlay */}
      {isPlaying && playerSrc && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          <div className="relative w-full h-full md:w-[90vw] md:h-[90vh]">
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setIsPlayerLoading(false);
              }}
              className="absolute right-4 top-4 z-10 rounded-full bg-black/70 px-3 py-1 text-sm hover:bg-black cursor-pointer"
            >
              ✕ Close
            </button>
            <div className="absolute inset-0">
              <iframe
                title={title}
                src={playerSrc}
                className="w-full h-full border-0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                onLoad={() => setIsPlayerLoading(false)}
              />
              {isPlayerLoading && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black">
                  <div className="h-12 w-12 rounded-full border-4 border-[#9146FF] border-t-transparent animate-spin" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Movie: More like this (poster grid) */}
      {mediaType !== 'tv' && recommended.length > 0 && (
        <section className="px-4 md:px-8 pb-10 space-y-3">
          <h2 className="text-lg md:text-xl font-semibold">
            More Like This
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
            {recommended.slice(0, 18).map((item) => {
              const img = item.poster_path
                ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
                : item.backdrop_path
                  ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}`
                  : null;
              const recTitle =
                item.title || item.name || item.original_title || 'Untitled';

              return (
                <button
                  type="button"
                  key={item.id}
                  className="bg-zinc-900 rounded-lg overflow-hidden text-left hover:scale-[1.02] hover:z-10 transition-transform cursor-pointer"
                  onClick={() => navigate(`/stream/${mediaType}/${item.id}`)}
                >
                  {img ? (
                    <img
                      src={img}
                      alt={recTitle}
                      className="w-full aspect-[2/3] object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] flex items-center justify-center text-xs text-gray-300 px-2 text-center">
                      {recTitle}
                    </div>
                  )}
                  <div className="px-2 py-1">
                    <p className="text-[11px] md:text-xs font-semibold truncate">
                      {recTitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* TV: Episodes / Similar */}
      {mediaType === 'tv' && (
        <section className="px-4 md:px-8 pb-10 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
            <div className="flex w-full md:w-auto md:min-w-[260px] text-sm md:text-base rounded-full border border-gray-700 bg-black/40 overflow-hidden">
              <button
                type="button"
                className={`flex-1 py-1.5 md:py-2 text-center ${
                  activeTvTab === 'episodes'
                    ? 'bg-[#9146FF] text-white'
                    : 'bg-transparent text-gray-400'
                }`}
                onClick={() => setActiveTvTab('episodes')}
              >
                Episodes
              </button>
              <button
                type="button"
                className={`flex-1 py-1.5 md:py-2 text-center ${
                  activeTvTab === 'similar'
                    ? 'bg-[#9146FF] text-white'
                    : 'bg-transparent text-gray-400'
                }`}
                onClick={() => setActiveTvTab('similar')}
              >
                Similar
              </button>
            </div>

            {activeTvTab === 'episodes' &&
              Array.isArray(details.seasons) &&
              details.seasons.length > 0 && (
                <select
                  value={selectedSeason ?? ''}
                  onChange={(e) => {
                    setSelectedSeason(Number(e.target.value));
                    setSelectedEpisodeNumber(null);
                  }}
                  className="ml-4 rounded-md border border-gray-700 bg-gray-900 px-2 py-1 text-xs md:text-sm"
                >
                  {details.seasons
                    .filter((s) => s.season_number > 0)
                    .map((s) => (
                      <option
                        key={s.id || s.season_number}
                        value={s.season_number}
                      >
                        Season
                        {' '}
                        {s.season_number}
                      </option>
                    ))}
                </select>
            )}
          </div>

          {activeTvTab === 'episodes' ? (
            <div className="space-y-3">
              {tvEpisodes.map((ep) => {
                const still = ep.still_path
                  ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
                  : null;
                const isSelected =
                  selectedEpisodeNumber === ep.episode_number;

                return (
                  <div
                    key={ep.id}
                    className={`group flex gap-3 rounded-lg p-2 md:p-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-zinc-800' : 'bg-zinc-900/60 hover:bg-zinc-800/80'
                    }`}
                    onClick={() => {
                      setSelectedEpisodeNumber(ep.episode_number);
                      setIsPlayerLoading(true);
                      setIsPlaying(true);
                    }}
                  >
                    {still && (
                      <div className="relative h-20 w-32 rounded-md overflow-hidden">
                        <img
                          src={still}
                          alt={ep.name}
                          className="h-full w-full object-cover"
                        />
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#9146FF] text-white text-xs font-bold">
                            ▶
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-xs md:text-sm text-gray-200">
                        <span className="font-semibold">
                          {ep.episode_number}
                          .&nbsp;
                          {ep.name}
                        </span>
                        {ep.runtime && (
                          <span className="text-gray-400">
                            {ep.runtime}
                            min
                          </span>
                        )}
                      </div>
                      {ep.overview && (
                        <p className="text-[11px] md:text-xs text-gray-300 line-clamp-2">
                          {ep.overview}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {tvEpisodes.length === 0 && (
                <p className="text-xs text-gray-400">
                  No episode information available for this season.
                </p>
              )}
            </div>
          ) : (
            recommended.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
                {recommended.slice(0, 18).map((item) => {
                  const img = item.poster_path
                    ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
                    : item.backdrop_path
                      ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}`
                      : null;
                  const recTitle =
                    item.title || item.name || item.original_title || 'Untitled';

                  return (
                    <button
                      type="button"
                      key={item.id}
                      className="bg-zinc-900 rounded-lg overflow-hidden text-left hover:scale-[1.02] hover:z-10 transition-transform cursor-pointer"
                      onClick={() => navigate(`/stream/tv/${item.id}`)}
                    >
                      {img ? (
                        <img
                          src={img}
                          alt={recTitle}
                          className="w-full aspect-[2/3] object-cover"
                        />
                      ) : (
                        <div className="w-full aspect-[2/3] flex items-center justify-center text-xs text-gray-300 px-2 text-center">
                          {recTitle}
                        </div>
                      )}
                      <div className="px-2 py-1">
                        <p className="text-[11px] md:text-xs font-semibold truncate">
                          {recTitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          )}
        </section>
      )}
    </div>
  );
}

export default Stream;
