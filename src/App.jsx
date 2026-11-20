import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import Navbar from './Navbar/navbar';
import Footer from './Footer/footer';
import { Analytics } from "@vercel/analytics/react"

// Lazy load route components for better performance
const Home = lazy(() => import('./Home/home'));
const Stream = lazy(() => import('./Stream/stream'));
const Search = lazy(() => import('./Search/search'));
const Shows = lazy(() => import('./Shows/shows'));
const Movies = lazy(() => import('./Movies/movies'));
const Anime = lazy(() => import('./Anime/anime'));
const NewPopular = lazy(() => import('./NewPopular/newPopular'));
import GlobalPlayer from './Stream/GlobalPlayer';

function App() {
  const location = useLocation();
  

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);



  return (
    <>
      <Analytics />
      <Navbar />
      <Suspense fallback={
        <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Loading page">
          <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shows" element={<Shows />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/anime" element={<Anime />} />
          <Route path="/new" element={<NewPopular />} />
          <Route path="/stream/:mediaType/:id" element={<Stream />} />
          <Route path="/watch/:mediaType/:id" element={null} /> {/* Handled by GlobalPlayer */}
          <Route path="/search" element={<Search />} />
        </Routes>
      </Suspense>
      <Footer />
      <GlobalPlayer />
    </>
  );
}

export default App;
