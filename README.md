# 🌊 Lume

A modern, beautiful streaming web application for discovering and watching movies and TV shows. Built with React and powered by TMDB API, Lume delivers a premium entertainment experience with a stunning UI inspired by natural elements — breeze, water, and earth.

![Lume Banner](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Material UI](https://img.shields.io/badge/MUI-7.3.5-007FFF?style=for-the-badge&logo=mui&logoColor=white)

## ✨ Features

### 🎬 Content Discovery

- **Trending Content**: Browse weekly and daily trending movies and TV shows in India
- **Genre-based Discovery**: Explore content by specific genres and categories
- **Smart Search**: Multi-search functionality for movies, TV shows, and more
- **Personalized Recommendations**: Get similar content suggestions based on what you're watching

### 📺 Streaming Experience

- **Multi-season Support**: For TV shows, browse and stream different seasons and episodes
- **Video Player**: Custom video player with fullscreen support and landscape orientation lock
- **Cast Support**: Google Cast integration for streaming to compatible devices
- **Episode Navigation**: Easy navigation between episodes and seasons

### 🎨 User Experience

- **Responsive Design**: Beautiful UI that works seamlessly across desktop, tablet, and mobile
- **Progressive Web App (PWA)**: Install as a native app on any device
- **Dark Theme**: Eye-friendly dark mode with modern glassmorphism effects
- **Natural Aesthetics**: Design inspired by breeze, water, and earth elements
- **Smooth Animations**: Micro-interactions and transitions for enhanced UX

### 🚀 Performance

- **Smart Caching**: Intelligent API response caching to reduce network calls
- **Code Splitting**: Optimized bundle sizes for faster load times
- **Lazy Loading**: Images and components load on-demand

## 🛠️ Tech Stack

### Core

- **React 18.3.1** - UI library
- **Vite 5.4.0** - Build tool and dev server
- **React Router DOM 7.9.6** - Client-side routing

### UI & Styling

- **Material-UI (MUI) 7.3.5** - Component library
- **Emotion** - CSS-in-JS styling
- **Tailwind CSS 4.1.17** - Utility-first CSS framework
- **Swiper 12.0.3** - Touch slider component

### State Management

- **Redux Toolkit 2.10.1** - State management
- **React Redux 9.2.0** - React bindings for Redux

### APIs & Services

- **TMDB API** - Movie and TV show data
- **YouTube API** - Trailers and video content
- **Google Cast SDK** - Chromecast integration

### PWA & Optimization

- **Vite Plugin PWA** - Progressive Web App support
- **Service Worker** - Offline support and caching

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **TMDB API Key** (get one at [TMDB](https://www.themoviedb.org/settings/api))

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/powerstone666/project-lume.git
cd project-lume
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
VITE_TMDB_API_KEY=your_tmdb_api_key_here
```

### 4. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 📦 Build & Deployment

### Production Build

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

### Deploy to Vercel

The project includes a `vercel.json` configuration file. Simply:

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts

Or connect your GitHub repository to Vercel for automatic deployments.

## 📁 Project Structure

```
project-lume/
├── public/              # Static assets
│   ├── icons/          # PWA icons
│   └── manifest.webmanifest
├── src/
│   ├── Api-services/   # API integration
│   │   ├── tmbd.jsx    # TMDB API service
│   │   └── youtube.jsx # YouTube API service
│   ├── Common-ui/      # Reusable UI components
│   │   ├── banner.jsx  # Hero banner component
│   │   └── cards.jsx   # Card components
│   ├── Home/           # Home page
│   ├── Movies/         # Movies page
│   ├── Shows/          # TV Shows page
│   ├── NewPopular/     # New & Popular page
│   ├── Search/         # Search page
│   ├── Stream/         # Video streaming page
│   ├── Navbar/         # Navigation component
│   ├── StateManager/   # Redux store configuration
│   ├── contexts/       # React contexts
│   ├── App.jsx         # Main app component
│   ├── main.jsx        # App entry point
│   └── index.css       # Global styles
├── .env                # Environment variables
├── vite.config.js      # Vite configuration
└── package.json        # Dependencies
```

## 🔑 Key Components

### API Services (`src/Api-services/`)

- **tmbd.jsx**: Comprehensive TMDB API integration with caching
  - Trending content (movies/shows)
  - Discover by genre, rating, date
  - Search functionality
  - Media details, recommendations, similar content
  - Season and episode details for TV shows

### Pages

- **Home**: Curated content sections with trending and popular items
- **Movies**: Browse and discover movies
- **Shows**: Browse and discover TV shows
- **New & Popular**: Latest and most popular content
- **Search**: Multi-search across all content types
- **Stream**: Video player with episode/season navigation

## 🎨 Design Philosophy

Lume's design is inspired by natural elements:

- 🌊 **Water**: Fluid animations and smooth transitions
- 🌿 **Earth**: Organic color palettes and grounded aesthetics
- 💨 **Breeze**: Light, airy layouts with generous whitespace

## 🔧 Configuration Files

### `vite.config.js`

- React deduplication to prevent hook errors
- PWA manifest configuration
- Service worker setup
- Build optimization settings

### `vercel.json`

- Routing configuration for SPA
- Deployment settings

## 📱 PWA Features

Lume is a Progressive Web App that can be installed on any device:

- Offline support via service worker
- App-like experience in fullscreen mode
- Custom app icons and splash screens
- Fast loading with smart caching

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- **TMDB** for providing the comprehensive movie and TV database API
- **The React Team** for the amazing framework
- **Material-UI** for the beautiful component library

---

**Built with ❤️ by powerstone666**

_Enjoy your streaming experience with Lume!_ 🎬✨
