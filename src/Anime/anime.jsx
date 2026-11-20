import Cards, { ROWS } from '../Common-ui/cards';
import Banner from '../Common-ui/banner';

function Anime() {
  const animeRows = ROWS.filter((row) => row.isAnimeRow);

  return (
    <>
      <Banner category="anime" />
      <Cards rows={animeRows} />
    </>
  );
}

export default Anime;
