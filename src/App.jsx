import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense, useState } from 'react';
import Navbar from './Navbar/navbar';
import Footer from './Footer/footer';
import { Analytics } from "@vercel/analytics/react"

// Lazy load route components for better performance
const Home = lazy(() => import('./Home/home'));
const Stream = lazy(() => import('./Stream/stream'));
const Search = lazy(() => import('./Search/search'));
const Shows = lazy(() => import('./Shows/shows'));
const Movies = lazy(() => import('./Movies/movies'));
const NewPopular = lazy(() => import('./NewPopular/newPopular'));

function App() {
  const location = useLocation();
  
  // Centralized search state (prop drilling to avoid URL spam)
  const [searchQuery, setSearchQuery] = useState('');

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <Analytics />
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <Suspense fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-white text-lg">Loading...</div>
        </div>
      }>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shows" element={<Shows />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/new" element={<NewPopular />} />
          <Route path="/stream/:mediaType/:id" element={<Stream />} />
          <Route path="/search" element={<Search searchQuery={searchQuery} />} />
        </Routes>
      </Suspense>
      <Footer />
    </>
  );
}

export default App;
