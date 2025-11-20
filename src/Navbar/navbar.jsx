import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import TextField from "@mui/material/TextField";
import HomeIcon from "@mui/icons-material/Home";
import TvIcon from "@mui/icons-material/Tv";
import MovieIcon from "@mui/icons-material/Movie";
import TheaterIcon from "@mui/icons-material/TheaterComedy";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InputAdornment from "@mui/material/InputAdornment";
import CastIcon from "@mui/icons-material/Cast";
import GetAppIcon from "@mui/icons-material/GetApp";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchText, setSearchText] = React.useState("");

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
      console.log('PWA standalone display mode:', displayMedia.matches || window.navigator.standalone === true);
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
      console.log('Service worker controller:', controller?.scriptURL || null);
    };
    updateControl();
    navigator.serviceWorker.addEventListener('controllerchange', updateControl);
    return () => navigator.serviceWorker.removeEventListener('controllerchange', updateControl);
  }, []);

  // Listen for PWA install prompt
  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      console.log('👋 PWA Install Prompt fired!');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
      console.log('beforeinstallprompt captured; install button enabled');
    };

    const handleAppInstalled = () => {
      console.log('✅ App installed successfully');
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
    console.log('PWA install button visible:', showInstallButton, '| deferredPrompt available:', Boolean(deferredPrompt));
  }, [showInstallButton, deferredPrompt]);

  React.useEffect(() => {
    // If we have SW control and are not installed, make the CTA visible even if the prompt hasn't fired yet.
    if (!isStandalone && swControlled) {
      setShowInstallButton(true);
      console.log('Install button forced visible because SW controls the page.');
    }
  }, [isStandalone, swControlled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.warn('Install prompt not available. If incognito or prompt suppressed, use a normal window or the browser menu to install.');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstallButton(false);
    }
    
    setDeferredPrompt(null);
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
          {/* Mobile: show search icon + hamburger (Material UI) */}
          <div className="flex items-center gap-2 sm:hidden">
            <IconButton
              size="medium"
              aria-label="open search"
              onClick={toggleSearch(true)}
              sx={{ color: '#9146ff', '&:hover': { color: '#b097ff' }, p: 0.5 }}
            >
              <SearchIcon fontSize="medium" color="inherit" sx={{ fontSize: 20 }} />
            </IconButton>
            <IconButton
              size="medium"
              aria-label="open menu"
              onClick={toggleMenu(true)}
              sx={{ color: '#9146ff', '&:hover': { color: '#b097ff' }, p: 0.5 }}
            >
              <MenuIcon fontSize="medium" color="inherit" sx={{ fontSize: 22 }} />
            </IconButton>
          </div>

          {/* Desktop: full search input */}
          <div className="relative hidden sm:block">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center" aria-hidden>
              <SearchIcon fontSize="small" className="text-gray-400" />
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
            <IconButton
              onClick={handleInstallClick}
              size="medium"
              aria-label="Install app"
              sx={{
                color: '#9146ff', // Twitch-like purple
                border: '1px solid #9146ff55',
                borderRadius: '12px',
                cursor: 'pointer',
                '&:hover': { color: '#b097ff', borderColor: '#9146ff' },
                p: 0.5
              }}
              title={deferredPrompt ? 'Install AnyWatch' : 'Install from your browser menu'}
            >
              <GetAppIcon fontSize="medium" />
            </IconButton>
          )}

          <IconButton
            size="medium"
            aria-label="cast"
            className="hidden sm:inline-flex"
            sx={{ color: '#9146ff', '&:hover': { color: '#b097ff' }, p: 0.5 }}
          >
            <CastIcon fontSize="medium" />
          </IconButton>
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
    { text: "Home", icon: <HomeIcon color="inherit" /> },
    { text: "Shows", icon: <TvIcon color="inherit" /> },
    { text: "Movies", icon: <MovieIcon color="inherit" /> },
    { text: "New & popular", icon: <TrendingUpIcon color="inherit" /> },
  ];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      transitionDuration={300}
      PaperProps={{ sx: { height: '100vh', width: 256, bgcolor: '#0a0a0a', backdropFilter: 'blur(20px)', borderLeft: '1px solid rgba(255,255,255,0.1)' } }}
    >
  <List className="h-full w-64 bg-gradient-to-br from-black via-zinc-950 to-black px-3 flex flex-col justify-center space-y-3">
        {items.map((item) => (
          <ListItem key={item.text} disablePadding className="shrink-0">
            <ListItemButton
              onClick={() => {
                if (item.text === "Home") {
                  navigate("/");
                }
                onClose();
              }}
              className="py-4 px-4 rounded-xl hover:bg-white/10 transition-all duration-300 border border-transparent hover:border-[#9146ff]/30 hover:shadow-lg hover:shadow-[#9146ff]/10"
            >
              <ListItemIcon sx={{ color: '#9146ff' }} className="min-w-11">
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} className="text-white" primaryTypographyProps={{ fontWeight: 600, fontSize: '1rem' }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
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
          <IconButton onClick={onClose} sx={{ color: '#9146ff', '&:hover': { color: '#b097ff' } }} aria-label="back">
            <ArrowBackIcon />
          </IconButton>
          <TextField
            autoFocus
            fullWidth
            placeholder="Search movies, shows..."
            variant="outlined"
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
            slotProps={{
              input: { className: 'text-white' },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setValue("")}
                    sx={{ color: value ? '#9146ff' : '#6b7280' }}
                    aria-label="clear"
                    size="small"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '9999px',
                bgcolor: 'rgba(17,24,39,0.8)',
                '& fieldset': {
                  borderColor: '#374151',
                },
                '&:hover fieldset': {
                  borderColor: '#7c3aed',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#9146ff',
                  boxShadow: '0 0 0 6px rgba(145,70,255,0.12)',
                },
              },
              input: { color: '#fff' },
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default Navbar;
