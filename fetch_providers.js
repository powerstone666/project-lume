import fetch from 'node-fetch';

const apiKey = process.env.VITE_TMDB_API_KEY;
const url = `https://api.themoviedb.org/3/watch/providers/movie?api_key=${apiKey}&watch_region=IN`;

async function getProviders() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    const zee5 = data.results.find(p => p.provider_name.toLowerCase().includes('zee5'));
    const sonyliv = data.results.find(p => p.provider_name.toLowerCase().includes('sony'));
    
    console.log('Zee5:', zee5);
    console.log('SonyLIV:', sonyliv);
  } catch (error) {
    console.error(error);
  }
}

getProviders();
