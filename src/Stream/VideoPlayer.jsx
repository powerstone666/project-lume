import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { fetchMediaDetails, fetchSeasonDetails } from '../Api-services/tmbd';

const cinemaOsBaseUrl = 'https://cinemaos.tech/player';

function VideoPlayer() {
  const { mediaType, id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // --- Synchronous Initial Data Retrieval ---
  const getInitialData = () => {
    // 1. Try location state
    if (location.state && String(location.state.id) === String(id)) {
      return location.state;
    }
    // 2. Try session storage
    if (typeof sessionStorage !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('currentWatchData');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (String(parsed.id) === String(id)) {
            return parsed;
          }
        }
      } catch (e) {
        console.error("Failed to parse session data", e);
      }
    }
    return null;
  };

  const initialData = getInitialData() || {};

  // Data State - Initialized synchronously
  const [details, setDetails] = useState(initialData.details || null);
  const [tvEpisodes, setTvEpisodes] = useState(initialData.tvEpisodes || []);
  const [selectedSeason, setSelectedSeason] = useState(initialData.selectedSeason || (mediaType === 'tv' || mediaType === 'anime' ? 1 : null));
  const [selectedEpisodeNumber, setSelectedEpisodeNumber] = useState(initialData.selectedEpisodeNumber || (mediaType === 'tv' || mediaType === 'anime' ? 1 : null));
  const [title, setTitle] = useState(initialData.title || initialData.details?.title || initialData.details?.name || '');
  
  // If we have minimal data (like just ID but no details), we might need to load.
  // But if we have details, we are not loading.
  const [isPlayerLoading, setIsPlayerLoading] = useState(!initialData.details);

  // UI State
  const [controlsVisible, setControlsVisible] = useState(false);
  const [showEpisodeList, setShowEpisodeList] = useState(false);
  const [showNextButton, setShowNextButton] = useState(false);
  const [interactionToggle, setInteractionToggle] = useState(0);
  
  const iframeRef = useRef(null);
  const lastMoveTime = useRef(0);

  // --- Fetch Data if Missing ---
  useEffect(() => {
    const fetchData = async () => {
      // Only fetch if we don't have details
      if (!details) {
        try {
            setIsPlayerLoading(true);
            const data = await fetchMediaDetails(mediaType, id);
            setDetails(data);
            setTitle(data.title || data.name);
            
            if (mediaType === 'tv' || mediaType === 'anime') {
                const seasonNum = 1;
                setSelectedSeason(seasonNum);
                const seasonData = await fetchSeasonDetails(id, seasonNum);
                setTvEpisodes(seasonData.episodes || []);
                setSelectedEpisodeNumber(seasonData.episodes?.[0]?.episode_number || 1);
            }
            setIsPlayerLoading(false);
        } catch (err) {
            console.error("Failed to fetch media details", err);
        }
      }
    };

    fetchData();
  }, [mediaType, id, details]); // Depend on details so it doesn't re-run if we have them

  // --- Player Source Construction ---
  const playerSrc = useMemo(() => {
    if (!id) return '';

    if (mediaType === 'tv' || mediaType === 'anime') {
        if (selectedSeason && selectedEpisodeNumber) {
            return `${cinemaOsBaseUrl}/${id}/${selectedSeason}/${selectedEpisodeNumber}?autoplay=1&sidebar=0&mix=0`;
        }
        return '';
    } else {
        return `${cinemaOsBaseUrl}/${id}?autoplay=1&sidebar=0&mix=0`;
    }
  }, [mediaType, id, selectedSeason, selectedEpisodeNumber]);

  // --- Fullscreen & Orientation ---
  const enterFullscreenAndLockLandscape = async () => {
    try {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      }

      if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock('landscape');
      }
    } catch (err) {
      console.warn('Fullscreen or orientation lock failed:', err);
    }
  };

  const exitFullscreenAndUnlock = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }

      if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
    } catch (err) {
      console.warn('Exit fullscreen or orientation unlock failed:', err);
    }
  };

  // On mount, try entering fullscreen
  useEffect(() => {
    enterFullscreenAndLockLandscape();
    return () => {
      exitFullscreenAndUnlock();
    };
  }, []);

  // --- Scroll Locking ---
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // --- Control Visibility ---
  const handlePlayerClick = () => {
    setControlsVisible(true);
    setInteractionToggle((prev) => prev + 1);
  };

  const handleMouseMove = () => {
    const now = Date.now();
    if (now - lastMoveTime.current > 500) {
      setControlsVisible(true);
      setInteractionToggle((prev) => prev + 1);
      lastMoveTime.current = now;
    }
  };

  useEffect(() => {
    let timer;
    if (controlsVisible && !showEpisodeList) {
      timer = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [controlsVisible, showEpisodeList, interactionToggle]);

  // Detect iframe focus
  useEffect(() => {
    const handleBlur = () => {
      setTimeout(() => {
        if (document.activeElement === iframeRef.current) {
          setControlsVisible(true);
          setInteractionToggle((prev) => prev + 1);
        }
      }, 100);
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, []);

  // Timer for Next Episode button
  useEffect(() => {
    let timer;
    // Show next button after 30 seconds
    timer = setTimeout(() => {
      setShowNextButton(true);
    }, 30000); 
    return () => clearTimeout(timer);
  }, [selectedEpisodeNumber]);


  // --- Helper for Next Episode Logic ---
  const renderNextEpisodeButton = () => {
    if (mediaType !== 'tv' && mediaType !== 'anime') return null;
    if (!tvEpisodes.length) return null;
    
    const currentEpIndex = tvEpisodes.findIndex(e => e.episode_number === selectedEpisodeNumber);
    const hasNextInSeason = currentEpIndex !== -1 && currentEpIndex < tvEpisodes.length - 1;
    const hasNextSeason = details?.seasons?.some(s => s.season_number === (selectedSeason || 1) + 1);

    if ((hasNextInSeason || hasNextSeason) && showNextButton) {
      return (
        <div 
          className={`absolute bottom-20 right-8 z-20 transition-opacity duration-300 ${
            controlsVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setInteractionToggle(prev => prev + 1);
              setShowNextButton(false);
              setIsPlayerLoading(true);

              if (hasNextInSeason) {
                const nextEp = tvEpisodes[currentEpIndex + 1];
                setSelectedEpisodeNumber(nextEp.episode_number);
              } else if (hasNextSeason) {
                const nextSeasonNum = (selectedSeason || 1) + 1;
                setSelectedSeason(nextSeasonNum);
                setSelectedEpisodeNumber(null);
                
                fetchSeasonDetails(id, nextSeasonNum).then(data => {
                    setTvEpisodes(data.episodes || []);
                    setSelectedEpisodeNumber(data.episodes?.[0]?.episode_number || 1);
                    setIsPlayerLoading(false); // Done loading new season
                });
                return; // Return early as fetch is async
              }
              // If simple episode swap, we are "loading" until iframe loads
            }}
            className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-black/60 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white text-xs md:text-sm font-medium shadow-lg transition-all"
          >
            Next Episode <span className="text-base md:text-lg">→</span>
          </button>
        </div>
      );
    }
    return null;
  };

  const handleClose = () => {
      exitFullscreenAndUnlock();
      navigate(-1); // Go back
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div 
        className={`relative w-full h-full group/player ${!controlsVisible ? 'cursor-none' : ''}`}
        onClick={handlePlayerClick}
        onMouseMove={handleMouseMove}
      >
        {/* Top controls */}
        <div 
          className={`absolute top-4 left-4 z-20 flex items-center gap-3 transition-opacity duration-300 ${
            controlsVisible || showEpisodeList ? 'opacity-100' : 'opacity-0'
          }`}
        >
           <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="rounded-full bg-black/60 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm hover:bg-black/80 cursor-pointer backdrop-blur-md border border-white/10 text-white transition-colors shadow-lg"
          >
            ✕ Close
          </button>
          {(mediaType === 'tv' || mediaType === 'anime') && (
             <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setInteractionToggle(prev => prev + 1);
                setShowEpisodeList(!showEpisodeList);
              }}
              className="rounded-full bg-black/60 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm hover:bg-black/80 cursor-pointer backdrop-blur-md border border-white/10 text-white transition-colors shadow-lg"
            >
              ☰ Episodes
            </button>
          )}
        </div>

        {/* Episode List Overlay */}
        {showEpisodeList && (mediaType === 'tv' || mediaType === 'anime') && (
          <div 
            className="absolute top-16 left-4 bottom-4 w-80 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl z-30 flex flex-col overflow-hidden animate-in slide-in-from-left-4 fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-900/50">
              <h3 className="font-bold text-white">Episodes</h3>
              <button 
                onClick={() => setShowEpisodeList(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {tvEpisodes.map((ep) => (
                <button
                  key={ep.id}
                  type="button"
                  onClick={() => {
                    setInteractionToggle(prev => prev + 1);
                    setShowNextButton(false);
                    setSelectedEpisodeNumber(ep.episode_number);
                    setIsPlayerLoading(true);
                    setShowEpisodeList(false);
                  }}
                  className={`w-full text-left p-3 rounded-lg flex gap-3 transition-colors ${
                    selectedEpisodeNumber === ep.episode_number
                      ? 'bg-[#9146FF] text-white'
                      : 'hover:bg-white/10 text-gray-300'
                  }`}
                >
                  <div className="text-sm font-medium truncate flex-1">
                    {ep.episode_number}. {ep.name}
                  </div>
                  {ep.runtime && (
                    <div className="text-xs opacity-60 whitespace-nowrap self-center">
                      {ep.runtime}m
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Next Episode Button */}
        {renderNextEpisodeButton()}

        <div className="absolute inset-0">
          {playerSrc && (
            <iframe
                ref={iframeRef}
                title={title || 'Video Player'}
                src={playerSrc}
                className="w-full h-full border-0"
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                sandbox="allow-same-origin allow-scripts allow-forms"
                referrerPolicy="no-referrer"
                onLoad={() => setIsPlayerLoading(false)}
                loading="eager"
                fetchpriority="high"
                importance="high"
                data-block-popups="true"
                style={{
                WebkitOverflowScrolling: 'touch',
                transform: 'scale(1.02)', // Zoom slightly to crop sidebar/edges
                }}
            />
          )}
          
          {/* Transparent click capture layer */}
          <div 
            className={`absolute inset-x-0 top-0 bottom-28 z-10 transition-opacity duration-200 ${
              controlsVisible || showEpisodeList 
                ? 'pointer-events-none opacity-0' 
                : 'pointer-events-auto opacity-0 cursor-none'
            }`}
            onClick={handlePlayerClick}
            onTouchStart={handlePlayerClick}
          />
          
          {isPlayerLoading && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black z-20">
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 md:h-16 md:w-16 rounded-full border-4 border-[#9146FF] border-t-transparent animate-spin" />
                <p className="text-white text-sm md:text-base">Loading player...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;
