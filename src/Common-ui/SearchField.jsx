import SearchRounded from '@mui/icons-material/SearchRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import { IconButton } from './Button';

/** Search field: leading icon, label for screen readers, clear action when filled. */
function SearchField({ value, onChange, onFocus, onClear, placeholder = 'Search movies and shows', autoFocus = false, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <SearchRounded
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
      />
      <input
        type="search"
        role="searchbox"
        aria-label={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onFocus={onFocus}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full cursor-text rounded-sm border border-outline-variant bg-black/60 pl-11 pr-10 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-on-surface [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <IconButton
          label="Clear search"
          onClick={onClear}
          className="absolute right-0.5 top-1/2 size-9 -translate-y-1/2"
        >
          <CloseRounded fontSize="small" />
        </IconButton>
      )}
    </div>
  );
}

export default SearchField;
