import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HomeIcon from "@mui/icons-material/Home";
import TvIcon from "@mui/icons-material/LiveTv";
import MovieIcon from "@mui/icons-material/Movie";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CastIcon from "@mui/icons-material/Cast";
import GetAppIcon from "@mui/icons-material/GetApp";

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
  const previousOverflow = React.useRef("");

  const toggleMenu = (open) => () => {
    if (open) setMobileSearchOpen(false);
    setMobileMenuOpen(open);
  };
  const toggleSearch = (open) => () => {
    if (open) setMobileMenuOpen(false);
    setMobileSearchOpen(open);
  };

  // Keep background from scrolling when mobile layers are open and allow escape key to close them.
  React.useEffect(() => {
    const shouldLock = mobileSearchOpen; // Drawer handles its own locking

    if (shouldLock) {
      previousOverflow.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = previousOverflow.current || "";
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMobileSearchOpen(false);
      }
    };

    if (shouldLock) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = previousOverflow.current || "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileSearchOpen]);

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

  const drawerItems = [
    { text: "Home", icon: <HomeIcon />, path: "/" },
    { text: "Shows", icon: <TvIcon />, path: "/shows" },
    { text: "Movies", icon: <MovieIcon />, path: "/movies" },
    { text: "New & popular", icon: <TrendingUpIcon />, path: "/new" },
  ];

  return (
    <nav className="sticky top-0 z-30 bg-black/75 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/50">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate("/")}
          >
            <h1 className="text-3xl font-black tracking-wide bg-gradient-to-r from-purple-400 via-[#9146FF] to-purple-300 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(145,70,255,0.5)] transition-all duration-500 group-hover:drop-shadow-[0_0_30px_rgba(145,70,255,0.7)] group-hover:tracking-wider">
              Lume
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
              title={deferredPrompt ? 'Install Lume' : 'Install from your browser menu'}
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
        <Drawer
          anchor="left"
          open={mobileMenuOpen}
          onClose={toggleMenu(false)}
          PaperProps={{
            sx: {
              width: "82vw",
              maxWidth: "320px",
              background: "linear-gradient(to bottom right, #000000, #09090b, #000000)",
              borderRight: "1px solid rgba(255, 255, 255, 0.1)",
              color: "white",
            },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 3, pb: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div className="text-lg font-black tracking-tight text-white">
                Lume
              </div>
              <IconButton
                onClick={toggleMenu(false)}
                sx={{ color: '#9146ff', '&:hover': { color: '#b097ff', bgcolor: 'rgba(255, 255, 255, 0.1)' } }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
            <List sx={{ flex: 1, px: 1.5, py: 2 }}>
              {drawerItems.map((item) => {
                const active = isActivePath(item.path);
                return (
                  <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                    <ListItemButton
                      onClick={() => {
                        navigate(item.path);
                        toggleMenu(false)();
                      }}
                      sx={{
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: active ? 'rgba(145, 70, 255, 0.6)' : 'transparent',
                        bgcolor: active ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                        boxShadow: active ? '0 4px 6px -1px rgba(145, 70, 255, 0.2)' : 'none',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                          borderColor: 'rgba(145, 70, 255, 0.3)',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ color: '#9146ff', minWidth: 40 }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          fontWeight: 600,
                          fontSize: '1rem',
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        </Drawer>
        <MobileSearchDialog open={mobileSearchOpen} onClose={toggleSearch(false)} />
      </div>
    </nav>
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
