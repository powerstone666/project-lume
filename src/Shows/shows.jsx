import Cards, { ROWS } from '../Common-ui/cards';

function Shows() {
  const showRows = ROWS.filter((row) => row.mediaType === 'tv');
  return <Cards rows={showRows} />;
}

export default Shows;
