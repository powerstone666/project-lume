import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Simple icon components to replace MUI icons
const MenuIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ArrowBackIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const HomeIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const TvIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const MovieIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const CastIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
  </svg>
);

const GetAppIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchText, setSearchText] = React.useState("");
  const [isPrompting, setIsPrompting] = React.useState(false);

  React.useEffect(() => {
    if (location.pathname.startsWith("/search")) {
      const params = new URLSearchParams(location.search);
      const q = params.get("q") || "";
      setSearchText(q);
    } else {
      // Clear search box when navigating away from search page
      setSearchText("");
    }
  }, [location.pathname, location.search]);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = React.useState(false);
  const [deferredPrompt, setDeferredPrompt] = React.useState(null);
  const [showInstallButton, setShowInstallButton] = React.useState(false);
  const [isStandalone, setIsStandalone] = React.useState(false);
  const [swControlled, setSwControlled] = React.useState(false);

  const toggleMenu = (open) => () => setMobileMenuOpen(open);
  const toggleSearch = (open) => () => setMobileSearchOpen(open);

  // Track whether the app is already installed to decide if the install CTA should render.
  React.useEffect(() => {
    const displayMedia = window.matchMedia("(display-mode: standalone)");
    const checkStandalone = () => {
      setIsStandalone(displayMedia.matches || window.navigator.standalone === true);
    };

    checkStandalone();
    displayMedia.addEventListener("change", checkStandalone);
    return () => displayMedia.removeEventListener("change", checkStandalone);
  }, []);

  // Track service worker control status.
  React.useEffect(() => {
    if (!navigator.serviceWorker) return;
    const updateControl = () => {
      const controller = navigator.serviceWorker.controller;
      setSwControlled(Boolean(controller));
    };
    updateControl();
    navigator.serviceWorker.addEventListener('controllerchange', updateControl);
    return () => navigator.serviceWorker.removeEventListener('controllerchange', updateControl);
  }, []);

  // Listen for PWA install prompt
  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    const handleAppInstalled = () => {
      setShowInstallButton(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  React.useEffect(() => {
    // If we have SW control and are not installed, make the CTA visible even if the prompt hasn't fired yet.
    if (!isStandalone && swControlled) {
      setShowInstallButton(true);
    }
  }, [isStandalone, swControlled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt || isPrompting) return;

    setIsPrompting(true);
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallButton(false);
      }
    } finally {
      setDeferredPrompt(null);
      setIsPrompting(false);
    }
  };

  const isActivePath = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const navButtonClass = (active) =>
    `cursor-pointer px-3 py-2 transition-all duration-300 ${
      active
        ? "text-white border-b-2 border-[#9146ff]"
        : "text-gray-300 hover:text-white"
    }`;

  return (
    <nav className="sticky top-0 z-30 bg-black/75 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/50">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
        {/* Logo - left */}
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => navigate("/")}
        >
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-[#9146ff] via-[#b097ff] to-[#9146ff] bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(145,70,255,0.5)] transition-all group-hover:drop-shadow-[0_0_15px_rgba(145,70,255,0.8)]">
            Any<span className="ml-0.5 text-transparent">Watch</span>
          </h1>
        </div>

        {/* Center nav links - Netflix-style */}
        <div className="hidden items-center gap-3 text-sm font-semibold md:flex">
          <button
            type="button"
            className={navButtonClass(isActivePath("/"))}
            aria-current="page"
            onClick={() => navigate("/")}
          >
            Home
          </button>
          <button
            type="button"
            className={navButtonClass(isActivePath("/shows"))}
            onClick={() => navigate("/shows")}
          >
            Shows
          </button>
          <button
            type="button"
            className={navButtonClass(isActivePath("/movies"))}
            onClick={() => navigate("/movies")}
          >
            Movies
          </button>
          <button
            type="button"
            className={navButtonClass(isActivePath("/new"))}
            onClick={() => navigate("/new")}
          >
            New &amp; Popular
          </button>
        </div>

        {/* Right controls - search & region */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile: show search icon + hamburger */}
          <div className="flex items-center gap-2 sm:hidden">
            <button
              type="button"
              aria-label="open search"
              onClick={toggleSearch(true)}
              className="p-2 rounded-lg text-[#9146ff] hover:text-[#b097ff] hover:bg-white/5 transition-all cursor-pointer"
            >
              <SearchIcon />
            </button>
            <button
              type="button"
              aria-label="open menu"
              onClick={toggleMenu(true)}
              className="p-2 rounded-lg text-[#9146ff] hover:text-[#b097ff] hover:bg-white/5 transition-all cursor-pointer"
            >
              <MenuIcon />
            </button>
          </div>

          {/* Desktop: full search input */}
          <div className="relative hidden sm:block">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center" aria-hidden>
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Search movies, shows..."
              className="w-full max-w-md rounded-full border border-white/20 bg-white/5 backdrop-blur-sm px-4 py-2.5 pl-10 text-sm text-white outline-none placeholder:text-gray-400 focus:border-[#9146ff] focus:ring-2 focus:ring-[#9146ff]/40 focus:bg-white/10 transition-all cursor-text shadow-lg"
              value={searchText}
              onFocus={() => {
                const params = new URLSearchParams(location.search);
                if (!params.get("q") && searchText.trim()) {
                  params.set("q", searchText.trim());
                }
                const queryString = params.toString();
                navigate(`/search${queryString ? `?${queryString}` : ""}`);
              }}
              onChange={(e) => {
                const value = e.target.value;
                setSearchText(value);
                const params = new URLSearchParams(location.search);
                if (value.trim()) {
                  params.set("q", value);
                } else {
                  params.delete("q");
                }
                navigate(`/search?${params.toString()}`);
              }}
            />
          </div>

          {/* PWA Install Button */}
          {!isStandalone && showInstallButton && deferredPrompt && (
            <button
              type="button"
              onClick={handleInstallClick}
              aria-label="Install app"
              className="p-2 rounded-xl text-[#9146ff] border border-[#9146ff]/30 hover:text-[#b097ff] hover:border-[#9146ff] transition-all cursor-pointer"
              title={deferredPrompt ? 'Install AnyWatch' : 'Install from your browser menu'}
            >
              <GetAppIcon />
            </button>
          )}

          <button
            type="button"
            aria-label="cast"
            className="hidden sm:inline-flex p-2 rounded-lg text-[#9146ff] hover:text-[#b097ff] hover:bg-white/5 transition-all cursor-pointer"
          >
            <CastIcon />
          </button>
        </div>

        {/* Mobile widgets: Drawer + Dialog */}
        <MobileCategoryDrawer open={mobileMenuOpen} onClose={toggleMenu(false)} />
        <MobileSearchDialog open={mobileSearchOpen} onClose={toggleSearch(false)} />
      </div>
    </nav>
  );
}

// Drawer for mobile categories
function MobileCategoryDrawer({ open, onClose }) {
  const navigate = useNavigate();

  const items = [
    { text: "Home", icon: <HomeIcon />, path: "/" },
    { text: "Shows", icon: <TvIcon />, path: "/shows" },
    { text: "Movies", icon: <MovieIcon />, path: "/movies" },
    { text: "New & popular", icon: <TrendingUpIcon />, path: "/new" },
  ];

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-64 bg-gradient-to-br from-black via-zinc-950 to-black border-l border-white/10 z-50 animate-in slide-in-from-right duration-300">
        <div className="h-full flex flex-col justify-center px-3 space-y-3">
          {items.map((item) => (
            <button
              key={item.text}
              type="button"
              onClick={() => {
                navigate(item.path);
                onClose();
              }}
              className="flex items-center gap-4 py-4 px-4 rounded-xl hover:bg-white/10 transition-all duration-300 border border-transparent hover:border-[#9146ff]/30 hover:shadow-lg hover:shadow-[#9146ff]/10 text-white cursor-pointer"
            >
              <span className="text-[#9146ff]">{item.icon}</span>
              <span className="font-semibold text-base">{item.text}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// Dialog for mobile search
function MobileSearchDialog({ open, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = React.useState("");

  React.useEffect(() => {
    if (location.pathname.startsWith("/search")) {
      const params = new URLSearchParams(location.search);
      const q = params.get("q") || "";
      setValue(q);
    }
  }, [location.pathname, location.search]);

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 top-16 z-20 bg-black/95 backdrop-blur-xl border-b border-white/10 shadow-2xl animate-in slide-in-from-top duration-300">
      <div className="p-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#9146ff] hover:text-[#b097ff] hover:bg-white/5 transition-all cursor-pointer"
            aria-label="back"
          >
            <ArrowBackIcon />
          </button>
          <div className="relative flex-1">
            <input
              type="text"
              autoFocus
              placeholder="Search movies, shows..."
              value={value}
              onChange={(e) => {
                const next = e.target.value;
                setValue(next);
                const params = new URLSearchParams();
                if (next.trim()) {
                  params.set("q", next);
                }
                navigate(`/search?${params.toString()}`);
              }}
              className="w-full rounded-full border border-gray-600 bg-gray-900/80 px-4 py-2.5 pr-12 text-white outline-none placeholder:text-gray-400 focus:border-[#9146ff] focus:ring-2 focus:ring-[#9146ff]/30 transition-all"
            />
            <button
              type="button"
              onClick={() => setValue("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-all cursor-pointer"
              style={{ color: value ? '#9146ff' : '#6b7280' }}
              aria-label="clear"
            >
              <CloseIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Navbar;
