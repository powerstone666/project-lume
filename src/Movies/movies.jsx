import Cards, { ROWS } from '../Common-ui/cards';
import Banner from '../Common-ui/banner';

function Movies() {
  const movieRows = ROWS.filter((row) => row.mediaType === 'movie' && !row.isAnimeRow);
  
  return (
    <>
      <Banner category="trending-movies" />
      <Cards rows={movieRows} />
    </>
  );
}

export default Movies;
