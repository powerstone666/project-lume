import { Routes, Route } from 'react-router-dom';
import Home from './Home/home';
import Navbar from './Navbar/navbar';
import Stream from './Stream/stream';
import Search from './Search/search';
import Shows from './Shows/shows';
import Movies from './Movies/movies';
import NewPopular from './NewPopular/newPopular';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shows" element={<Shows />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/new" element={<NewPopular />} />
        <Route path="/stream/:mediaType/:id" element={<Stream />} />
        <Route path="/search" element={<Search />} />
      </Routes>
    </>
  );
}

export default App;
