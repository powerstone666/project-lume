import { useEffect, useState } from 'react';
import { usePrivateNavigate } from '../hooks/usePrivateNavigate';
import { searchMulti } from '../Api-services/tmbd';

function Search({ searchQuery }) {
  const navigate = usePrivateNavigate();
  
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounce searchQuery prop changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    let active = true;

    const performSearch = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await searchMulti(debouncedQuery);
        if (!active) return;
        const filtered = (data || []).filter(
          (item) => {
            const isAnime = (item.genre_ids?.includes(16) || item.genres?.some(g => g.id === 16)) && item.original_language === 'ja';
            return (item.media_type === 'movie' || item.media_type === 'tv') && !isAnime;
          }
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
    };

    performSearch();

    return () => {
      active = false;
      controller.abort();
    };
  }, [debouncedQuery]);

  const handleResultClick = (item) => {
    if (!item || !item.id) return;
    let type =
      item.media_type ||
      (item.first_air_date && !item.release_date ? 'tv' : 'movie');

    // Check for Anime: Animation genre (16) + Japanese language ('ja')
    const isAnime = 
      (item.genre_ids?.includes(16) || item.genres?.some(g => g.id === 16)) && 
      item.original_language === 'ja';

    if (isAnime && type === 'tv') {
      type = 'anime';
    }

    navigate(`/stream/${type}/${item.id}`);
  };

  const isIdle = !debouncedQuery && !loading && !error;

  return (
    <div className="min-h-screen bg-black text-white px-4 md:px-8 pt-6 pb-12">
      <div className="w-full max-w-7xl mx-auto">
        {/* Search Results Header */}
        {debouncedQuery && !isIdle && (
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-2">
              Search Results
            </h1>
            <p className="text-sm md:text-base text-gray-400">
              Showing results for <span className="text-white font-semibold">"{debouncedQuery}"</span>
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Empty/Idle State */}
        {isIdle && (
          <div className="mt-16 sm:mt-24 mb-10 flex flex-col items-center text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-3">
              Discover Movies & Shows
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-400 max-w-2xl mb-8 px-4">
              Search for a movie, TV series, actor, or genre using the search bar above.
            </p>
            <div className="relative w-full max-w-lg aspect-video rounded-2xl sm:rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black overflow-hidden shadow-2xl border border-white/5">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_#9146FF_0,_transparent_60%),_radial-gradient(circle_at_bottom,_#ec4899_0,_transparent_60%)]" />
              <div className="relative h-full flex flex-col items-center justify-center gap-6 px-8">
                <div className="text-center space-y-3">
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                    Start Searching
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400 max-w-xs">
                    Discover trending movies, hidden gems, and your favorite shows instantly.
                  </p>
                </div>
                {/* Animated accent elements */}
                <div className="flex gap-2">
                  <div className="h-1 w-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" />
                  <div className="h-1 w-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 animate-pulse delay-75" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Results State */}
        {!isIdle && !loading && !error && debouncedQuery && results.length === 0 && (
          <div className="mt-12 text-center">
            <p className="text-base md:text-lg text-gray-400 mb-2">
              No results found for <span className="font-bold text-white">"{debouncedQuery}"</span>
            </p>
            <p className="text-sm text-gray-500">Try adjusting your search or use different keywords</p>
          </div>
        )}

        {/* Results Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {/* Loading Skeletons with Shimmer */}
          {loading && debouncedQuery &&
            Array.from({ length: 18 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="w-full aspect-[2/3] rounded-lg bg-gradient-to-br from-zinc-900 to-zinc-950 overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent animate-shimmer" />
              </div>
            ))}

          {/* Search Results */}
          {!loading && results.map((item) => {
            const title =
              item.title || item.name || item.original_title || 'Untitled';
            const poster = item.poster_path
              ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
              : null;
            const year = item.release_date || item.first_air_date
              ? new Date(item.release_date || item.first_air_date).getFullYear()
              : null;
            const mediaLabel = item.media_type === 'tv' ? 'TV' : 'Movie';

            return (
              <button
                type="button"
                key={`${item.media_type}-${item.id}`}
                className="group bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-lg overflow-hidden text-left hover:scale-105 hover:z-10 transition-all duration-300 cursor-pointer border border-white/5 hover:border-[#9146ff]/30 shadow-lg"
                onClick={() => handleResultClick(item)}
              >
                <div className="relative w-full aspect-[2/3]">
                  {poster ? (
                    <>
                      <img
                        src={poster}
                        alt={title}
                        className="h-full w-full object-cover"
                      />
                      {/* Media Type Badge */}
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-sm border border-white/20">
                        <span className="text-[10px] font-bold text-white uppercase">{mediaLabel}</span>
                      </div>
                    </>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs sm:text-sm text-gray-300 px-3 text-center bg-zinc-800">
                      {title}
                    </div>
                  )}
                  {/* Gradient Overlay */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent px-2 sm:px-3 pb-2 sm:pb-3 pt-8">
                    <p className="text-xs sm:text-sm font-semibold truncate text-white">
                      {title}
                    </p>
                    {year && (
                      <p className="text-[10px] sm:text-xs text-gray-400">
                        {year}
                      </p>
                    )}
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
