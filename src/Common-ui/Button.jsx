import { forwardRef } from 'react';

/*
 * Shared Netflix-style buttons. Every button gets: pointer cursor, dual-tone hover, bouncy
 * press (.press in index.css), a visible focus ring, and a loading state that
 * disables the control, sets aria-busy and blocks double clicks.
 */

const VARIANT_CLASSES = {
  filled: 'bg-secondary text-on-secondary hover:bg-secondary/75',
  tonal: 'bg-secondary-container text-on-secondary-container hover:bg-secondary-container/60',
  brand: 'bg-primary text-on-primary hover:bg-primary-container',
  outlined: 'border border-outline text-on-surface hover:border-on-surface hover:bg-white/10',
  text: 'text-on-surface hover:bg-white/10',
};

const SIZE_CLASSES = {
  md: 'h-10 px-5 text-sm gap-2',
  lg: 'h-12 px-7 text-lg gap-2.5',
};

const ICON_SIZE_CLASSES = {
  md: 'size-10',
  lg: 'size-12',
};

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

export const Button = forwardRef(function Button(
  { variant = 'filled', size = 'md', icon, loading = false, disabled = false, className = '', children, onClick, ...rest },
  ref,
) {
  const handleClick = (event) => {
    if (loading || disabled) return;
    onClick?.(event);
  };

  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      aria-busy={loading || undefined}
      onClick={handleClick}
      className={`press inline-flex shrink-0 items-center justify-center rounded-md font-bold whitespace-nowrap disabled:opacity-40 aria-busy:opacity-80 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
});

/** Icon-only button. `label` is required: it is the accessible name and the tooltip. */
export const IconButton = forwardRef(function IconButton(
  { label, variant = 'text', size = 'md', loading = false, disabled = false, className = '', children, onClick, ...rest },
  ref,
) {
  const handleClick = (event) => {
    if (loading || disabled) return;
    onClick?.(event);
  };

  const variantClasses = {
    ...VARIANT_CLASSES,
    text: 'text-on-surface hover:bg-white/10',
  };

  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      aria-busy={loading || undefined}
      onClick={handleClick}
      className={`press inline-flex shrink-0 items-center justify-center rounded-full disabled:opacity-40 ${variantClasses[variant]} ${ICON_SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
});
