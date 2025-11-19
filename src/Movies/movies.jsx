import Cards, { ROWS } from '../Common-ui/cards';

function Movies() {
  const movieRows = ROWS.filter((row) => row.mediaType === 'movie');
  return <Cards rows={movieRows} />;
}

export default Movies;
