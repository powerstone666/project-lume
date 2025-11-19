import Cards, { ROWS } from '../Common-ui/cards';

const NEW_POPULAR_IDS = [
  'trending-today-movies',
  'trending-today-shows',
  'new-on-netflix',
  'bingeworthy-tv-shows',
  'bingeworthy-movies',
  'set-in-india',
];

function NewPopular() {
  const newPopularRows = ROWS.filter((row) => NEW_POPULAR_IDS.includes(row.id));
  return <Cards rows={newPopularRows} />;
}

export default NewPopular;
