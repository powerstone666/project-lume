import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePrivateNavigate } from '../hooks/usePrivateNavigate';
import { searchMulti } from '../Api-services/tmbd';
import SearchField from '../Common-ui/SearchField';

function Search() {
  const navigate = usePrivateNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('q') || '';
  
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

  const updateQuery = (value) => {
    const params = new URLSearchParams(location.search);
    if (value.trim()) params.set('q', value);
    else params.delete('q');
    navigate(`/search?${params.toString()}`, { replace: true });
  };

  return (
    <div className="min-h-screen px-4 pb-6 pt-24 md:px-12 md:pb-8 md:pt-28">
      {/* Compact screens have no navbar search field, so the page carries its own. */}
      <SearchField
        value={searchQuery}
        onChange={updateQuery}
        onClear={() => updateQuery('')}
        autoFocus
        className="mb-6 md:hidden"
      />

      {debouncedQuery && (
        <p className="mb-6 text-on-surface-variant">
          Results for <span className="font-bold text-on-surface">“{debouncedQuery}”</span>
        </p>
      )}

      {error && (
        <div role="alert" className="mb-6 rounded-sm bg-error-container p-4 text-sm text-on-error-container">
          {error}
        </div>
      )}

      {isIdle && (
        <div className="mt-16 flex flex-col items-center text-center">
          <h1 className="mb-2 text-2xl font-bold md:text-3xl">Find something to watch</h1>
          <p className="max-w-md text-on-surface-variant">
            Search for a movie or TV series by title.
          </p>
        </div>
      )}

      {!isIdle && !loading && !error && debouncedQuery && results.length === 0 && (
        <div className="mt-12 text-center">
          <p className="mb-1 text-lg">
            No results for <span className="font-bold">“{debouncedQuery}”</span>
          </p>
          <p className="text-sm text-on-surface-variant">Try different keywords or check the spelling.</p>
        </div>
      )}

      <div
        className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 md:gap-3 lg:grid-cols-6 xl:grid-cols-7"
        aria-busy={loading || undefined}
      >
        {loading && debouncedQuery &&
          Array.from({ length: 18 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="skeleton aspect-[2/3] w-full rounded-sm" />
          ))}

        {!loading && results.map((item) => {
          const title = item.title || item.name || item.original_title || 'Untitled';
          const poster = item.poster_path
            ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
            : null;
          const releaseDate = item.release_date || item.first_air_date;
          const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
          const mediaLabel = item.media_type === 'tv' ? 'Series' : 'Movie';

          return (
            <button
              type="button"
              key={`${item.media_type}-${item.id}`}
              onClick={() => handleResultClick(item)}
              className="group text-left"
            >
              <span className="relative block aspect-[2/3] w-full overflow-hidden rounded-sm bg-surface-container transition-transform duration-300 group-hover:scale-105 group-focus-visible:scale-105 group-focus-visible:ring-2 group-focus-visible:ring-on-surface">
                {poster ? (
                  <img
                    src={poster}
                    alt=""
                    width="342"
                    height="513"
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-on-surface-variant">
                    {title}
                  </span>
                )}
              </span>
              <span className="mt-2 block truncate text-sm font-medium">{title}</span>
              <span className="block text-xs text-on-surface-variant">
                {mediaLabel}
                {year ? ` · ${year}` : ''}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Search;
