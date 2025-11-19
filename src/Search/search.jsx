import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { searchMulti } from '../Api-services/tmbd';

function Search() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlQuery = (searchParams.get('q') || '').trim();

  const [debouncedQuery, setDebouncedQuery] = useState(urlQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // When URL query changes, start / update debounce timer
    const next = urlQuery;
    const timer = setTimeout(() => {
      setDebouncedQuery(next);
    }, 400);
    return () => clearTimeout(timer);
  }, [urlQuery]);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    let active = true;

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await searchMulti(debouncedQuery);
        if (!active) return;
        const filtered = (data || []).filter(
          (item) => item.media_type === 'movie' || item.media_type === 'tv',
        );
        setResults(filtered);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to search titles.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [debouncedQuery]);

  const handleResultClick = (item) => {
    if (!item || !item.id) return;
    const type =
      item.media_type ||
      (item.first_air_date && !item.release_date ? 'tv' : 'movie');
    navigate(`/stream/${type}/${item.id}`);
  };

  const isIdle = !debouncedQuery && !loading && !error;

  return (
    <div className="min-h-screen bg-black text-white px-4 md:px-8 pt-4 pb-10">
      <div className="w-full max-w-7xl mx-auto">
        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

        {isIdle && (
          <div className="mt-24 mb-10 flex flex-col items-center text-center">
            <h2 className="text-xl md:text-2xl font-semibold mb-3">
              Try typing something
            </h2>
            <p className="text-sm md:text-base text-gray-400 max-w-xl mb-6">
              Search for a movie, series, actor, or genre in the bar above.
            </p>
            <div className="relative w-full max-w-md aspect-video rounded-3xl bg-gradient-to-br from-[#1f2937] via-[#111827] to-black overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)]">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_#9146FF_0,_transparent_55%),_radial-gradient(circle_at_bottom,_#6366F1_0,_transparent_55%)]" />
              <div className="relative h-full flex flex-col items-center justify-center gap-3 px-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-black/40">
                  <span className="text-2xl text-white">🔍</span>
                </div>
                <p className="text-sm md:text-base text-gray-200">
                  Discover trending and hidden gems instantly as you type.
                </p>
              </div>
            </div>
          </div>
        )}

        {!isIdle && !loading && !error && debouncedQuery && results.length === 0 && (
          <p className="text-sm text-gray-400 mb-4">
            No results found for
            {' '}
            <span className="font-semibold">{debouncedQuery}</span>
            .
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mt-2">
          {loading && debouncedQuery &&
            Array.from({ length: 18 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="w-full aspect-video rounded-lg bg-zinc-800/80 animate-pulse"
              />
            ))}

          {!loading && results.map((item) => {
            const title =
              item.title || item.name || item.original_title || 'Untitled';
            const backdrop = item.backdrop_path
              ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}`
              : null;
            const poster = item.poster_path
              ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
              : null;
            const imageUrl = backdrop || poster;

            return (
              <button
                type="button"
                key={`${item.media_type}-${item.id}`}
                className="bg-zinc-900 rounded-lg overflow-hidden text-left hover:scale-[1.02] hover:z-10 transition-transform cursor-pointer"
                onClick={() => handleResultClick(item)}
              >
                <div className="relative w-full aspect-video">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-sm md:text-base text-gray-200 px-4 text-center">
                      {title}
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-2 pt-8">
                    <p className="text-xs md:text-sm font-semibold truncate">
                      {title}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Search;
