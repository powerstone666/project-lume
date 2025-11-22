import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './Home/home';
import Navbar from './Navbar/navbar';
import Footer from './Footer/footer';
import Stream from './Stream/stream';
import Search from './Search/search';
import Shows from './Shows/shows';
import Movies from './Movies/movies';
import NewPopular from './NewPopular/newPopular';
import { Analytics } from "@vercel/analytics/react"

function App() {
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Prevent PWA navigation from appearing in Chrome history
  useEffect(() => {
    // Check if running as PWA (standalone mode)
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  window.navigator.standalone || 
                  document.referrer.includes('android-app://');

    if (isPWA) {
      // Replace current history entry to prevent adding to Chrome history
      const currentPath = location.pathname + location.search + location.hash;
      window.history.replaceState(null, '', currentPath);
    }
  }, [location]);

  return (
    <>
      <Analytics />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shows" element={<Shows />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/new" element={<NewPopular />} />
        <Route path="/stream/:mediaType/:id" element={<Stream />} />
        <Route path="/search" element={<Search />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
