import { configureStore, createSlice } from '@reduxjs/toolkit';

const trendingSlice = createSlice({
  name: 'trending',
  initialState: {
    movies: [],
  },
  reducers: {
    setTrendingMovies(state, action) {
      state.movies = action.payload || [];
    },
  },
});

const store = configureStore({
  reducer: {
    trending: trendingSlice.reducer,
  },
});

export const { setTrendingMovies } = trendingSlice.actions;

export default store;
