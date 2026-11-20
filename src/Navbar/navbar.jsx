import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { usePrivateNavigate } from '../hooks/usePrivateNavigate';
import Home from '@mui/icons-material/Home';
import HomeOutlined from '@mui/icons-material/HomeOutlined';
import LiveTv from '@mui/icons-material/LiveTv';
import LiveTvOutlined from '@mui/icons-material/LiveTvOutlined';
import Movie from '@mui/icons-material/Movie';
import MovieOutlined from '@mui/icons-material/MovieOutlined';
import LocalFireDepartment from '@mui/icons-material/LocalFireDepartment';
import LocalFireDepartmentOutlined from '@mui/icons-material/LocalFireDepartmentOutlined';
import Animation from '@mui/icons-material/Animation';
import AnimationOutlined from '@mui/icons-material/AnimationOutlined';
import Search from '@mui/icons-material/Search';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import InstallMobileRounded from '@mui/icons-material/InstallMobileRounded';
import SearchField from '../Common-ui/SearchField';
import { IconButton } from '../Common-ui/Button';

const NAV_ITEMS = [
  { label: 'Home', path: '/', icon: HomeOutlined, activeIcon: Home },
  { label: 'Shows', path: '/shows', icon: LiveTvOutlined, activeIcon: LiveTv },
  { label: 'Movies', path: '/movies', icon: MovieOutlined, activeIcon: Movie },
  { label: 'Anime', path: '/anime', icon: AnimationOutlined, activeIcon: Animation },
  { label: 'New & Popular', path: '/new', icon: LocalFireDepartmentOutlined, activeIcon: LocalFireDepartment },
];

const MOBILE_NAV_ITEMS = [
  ...NAV_ITEMS,
  { label: 'Search', path: '/search', icon: SearchOutlined, activeIcon: Search },
];

function isActivePath(pathname, path) {
  return path === '/' ? pathname === '/' : pathname.startsWith(path);
}

/** Install-prompt state for the PWA install action. */
function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);

  useEffect(() => {
    const displayMedia = window.matchMedia('(display-mode: standalone)');
    const checkStandalone = () =>
      setIsStandalone(displayMedia.matches || window.navigator.standalone === true);

    checkStandalone();
    displayMedia.addEventListener('change', checkStandalone);
    return () => displayMedia.removeEventListener('change', checkStandalone);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };
    const handleAppInstalled = () => setDeferredPrompt(null);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt || isPrompting) return;
    setIsPrompting(true);
    try {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } finally {
      setDeferredPrompt(null);
      setIsPrompting(false);
    }
  };

  return { canInstall: Boolean(deferredPrompt) && !isStandalone, isPrompting, install };
}

function Brand() {
  return (
    <NavLink
      to="/"
      aria-label="Lume home"
      className="text-3xl font-black uppercase tracking-tight text-primary md:text-4xl"
    >
      Lume
    </NavLink>
  );
}

function DesktopLink({ item, pathname }) {
  const active = isActivePath(pathname, item.path);

  return (
    <NavLink
      to={item.path}
      aria-current={active ? 'page' : undefined}
      className={`text-sm transition-colors ${
        active ? 'font-bold text-on-surface' : 'text-on-surface/80 hover:text-on-surface/60'
      }`}
    >
      {item.label}
    </NavLink>
  );
}

function MobileTab({ item, pathname }) {
  const active = isActivePath(pathname, item.path);
  const Icon = active ? item.activeIcon : item.icon;

  return (
    <NavLink
      to={item.path}
      aria-current={active ? 'page' : undefined}
      className={`press flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] ${
        active ? 'font-bold text-on-surface' : 'text-on-surface-variant'
      }`}
    >
      <Icon fontSize="small" aria-hidden="true" />
      {item.label === 'New & Popular' ? 'New' : item.label}
    </NavLink>
  );
}

function Navbar() {
  const navigate = usePrivateNavigate();
  const location = useLocation();
  const { canInstall, isPrompting, install } = useInstallPrompt();
  const [scrolled, setScrolled] = useState(() => window.scrollY > 10);

  // Transparent over the billboard, solid once the page scrolls.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // The URL is the single source of truth for the query.
  const searchText = location.pathname.startsWith('/search')
    ? new URLSearchParams(location.search).get('q') || ''
    : '';

  const updateSearch = (value) => {
    const params = new URLSearchParams(location.search);
    if (value.trim()) params.set('q', value);
    else params.delete('q');
    // Typing on the results page replaces the entry so Back leaves search in one step.
    navigate(`/search?${params.toString()}`, { replace: location.pathname.startsWith('/search') });
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-30 transition-colors duration-300 ${
          scrolled ? 'bg-surface' : 'bg-gradient-to-b from-black/80 to-transparent'
        }`}
      >
        <nav
          aria-label="Primary"
          className="flex h-16 items-center gap-8 px-4 md:h-[4.5rem] md:px-12"
        >
          <Brand />

          <div className="hidden items-center gap-5 md:flex">
            {NAV_ITEMS.map((item) => (
              <DesktopLink key={item.path} item={item} pathname={location.pathname} />
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <SearchField
              value={searchText}
              onChange={updateSearch}
              onFocus={() => {
                if (!location.pathname.startsWith('/search')) navigate('/search');
              }}
              onClear={() => updateSearch('')}
              className="hidden w-64 md:block lg:w-80"
            />
            {canInstall && (
              <IconButton label="Install Lume app" onClick={install} loading={isPrompting}>
                <InstallMobileRounded fontSize="small" />
              </IconButton>
            )}
          </div>
        </nav>
      </header>

      {/* Compact screens: bottom tab bar replaces a menu drawer. */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-outline-variant bg-surface-lowest pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {MOBILE_NAV_ITEMS.map((item) => (
          <MobileTab key={item.path} item={item} pathname={location.pathname} />
        ))}
      </nav>
    </>
  );
}

export default Navbar;
