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
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
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

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchText, setSearchText] = React.useState("");

  React.useEffect(() => {
    if (location.pathname.startsWith("/search")) {
      const params = new URLSearchParams(location.search);
      const q = params.get("q") || "";
      setSearchText(q);
    }
  }, [location.pathname, location.search]);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = React.useState(false);

  const toggleMenu = (open) => () => setMobileMenuOpen(open);
  const toggleSearch = (open) => () => setMobileSearchOpen(open);

  const isActivePath = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const navButtonClass = (active) =>
    `cursor-pointer px-1 py-1 transition-colors ${
      active
        ? "text-white border-b-2 border-[#9146ff]"
        : "text-gray-300 hover:text-[#9146ff]"
    }`;

  return (
    <nav className="sticky top-0 z-30 border-b border-gray-700 bg-black/70 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-8">
        {/* Logo - left */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-[#9146ff] to-[#b097ff] bg-clip-text text-transparent">
            Any<span className="ml-1 text-transparent">Watch</span>
          </h1>
        </div>

        {/* Center nav links - Netflix-style */}
        <div className="hidden items-center gap-6 text-sm font-medium md:flex">
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
            New &amp; popular
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
              placeholder="Search"
              className="w-full max-w-md rounded-full border border-gray-700 bg-gray-800 px-4 py-2 pl-10 text-sm text-white outline-none placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/60 cursor-text"
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
      PaperProps={{ sx: { height: '100vh', width: 224, bgcolor: 'black' } }}
    >
  <List className="h-full w-56 bg-black px-2 flex flex-col justify-center space-y-2">
        {items.map((item) => (
          <ListItem key={item.text} disablePadding className="shrink-0">
            <ListItemButton
              onClick={() => {
                if (item.text === "Home") {
                  navigate("/");
                }
                onClose();
              }}
              className="py-3 px-2 rounded-md hover:bg-white/5"
            >
              <ListItemIcon sx={{ color: '#9146ff' }} className="min-w-[40px]">
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} className="text-white" />
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

  return (
    <Dialog open={open} onClose={onClose} fullScreen transitionDuration={300}>
      <DialogContent className="bg-black flex flex-col p-4">
        {/* Top bar: back arrow */}
        <div className="flex items-center gap-2 mb-4">
          <IconButton onClick={onClose} sx={{ color: '#9146ff', '&:hover': { color: '#b097ff' } }} aria-label="back">
            <ArrowBackIcon color="inherit" />
          </IconButton>
          <div className="flex-1" />
        </div>

        <div className="flex items-center mb-4">
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
            className="flex-1"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default Navbar;
