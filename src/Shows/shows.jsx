import Cards, { ROWS } from '../Common-ui/cards';
import Banner from '../Common-ui/banner';

function Shows() {
  const showRows = ROWS.filter((row) => row.mediaType === 'tv' && !row.isAnimeRow);
  
  return (
    <>
      <Banner category="trending-shows" />
      <Cards rows={showRows} />
    </>
  );
}

export default Shows;
