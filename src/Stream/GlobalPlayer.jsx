import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, matchPath } from 'react-router-dom';
import { fetchMediaDetails, fetchSeasonDetails } from '../Api-services/tmbd';

const cinemaOsBaseUrl = 'https://cinemaos.tech/player';
const MAX_SESSIONS = 1;

function GlobalPlayer() {
  const location = useLocation();
  const navigate = useNavigate();

  // --- Route Parsing ---
  const streamMatch = matchPath('/stream/:mediaType/:id', location.pathname);
  const watchMatch = matchPath('/watch/:mediaType/:id', location.pathname);

  // Check for inline play signal
  const searchParams = new URLSearchParams(location.search);
  const isInlinePlay = !!streamMatch && searchParams.get('play') === '1';
  
  const currentMatch = watchMatch || (isInlinePlay ? streamMatch : null) || streamMatch; // Keep streamMatch for preloading if needed
  const isWatchPage = !!watchMatch;
  const isStreamPage = !!streamMatch;
  
  // Active if watch page OR inline play
  const shouldBeActive = isWatchPage || isInlinePlay;

  const mediaType = currentMatch?.params?.mediaType;
  const id = currentMatch?.params?.id;

  // --- State ---
  // sessions: Array of { id, mediaType, details, tvEpisodes, selectedSeason, selectedEpisodeNumber, title, loaded, lastUsed, playerSrc }
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null); 
  const [controlsVisible, setControlsVisible] = useState(false);
  const [showEpisodeList, setShowEpisodeList] = useState(false);
  const [interactionToggle, setInteractionToggle] = useState(0);

  // Refs
  const preloadTimeoutRef = useRef(null);

  // --- Optimization: Preconnect ---
  useEffect(() => {
    // Aggressive preconnect
    const domains = ['https://cinemaos.tech'];
    const nodes = [];
    domains.forEach(d => {
        const l1 = document.createElement('link');
        l1.rel = 'preconnect';
        l1.href = d;
        l1.crossOrigin = 'anonymous';
        document.head.appendChild(l1);
        nodes.push(l1);
        const l2 = document.createElement('link');
        l2.rel = 'dns-prefetch';
        l2.href = d;
        document.head.appendChild(l2);
        nodes.push(l2);
    });
    return () => nodes.forEach(n => n.remove());
  }, []);

  // --- Session Management ---
  useEffect(() => {
    // 1. If not in playback mode, clear session
    if (!shouldBeActive) {
        if (activeId) {
             setTimeout(() => setActiveId(null), 0);
        }
        return; // Don't create sessions unless actively playing
    }

    if (!mediaType || !id) return;

    // 2. If ID changed and should be active, switch or create session
    if (id !== activeId) {
        setTimeout(() => {
            setActiveId(id);
            setSessions(prev => {
                // Check if exists
                const existingIdx = prev.findIndex(s => s.id === id);
                if (existingIdx !== -1) {
                    // Update timestamp/priority
                    const updated = [...prev];
                    updated[existingIdx] = { ...updated[existingIdx], lastUsed: Date.now() };
                    return updated;
                }

                // Create new session
                const newSession = {
                    id,
                    mediaType,
                    details: null,
                    tvEpisodes: [],
                    selectedSeason: null,
                    selectedEpisodeNumber: null,
                    title: '',
                    loaded: false,
                    lastUsed: Date.now(),
                    playerSrc: '', // Computed later
                    loading: true // Metadata loading
                };

                // Single session mode - replace instead of append
                return [newSession];
            });
        }, 0);
    }
  }, [mediaType, id, activeId, shouldBeActive]);


  // --- Data Fetching for Active Session ---
  useEffect(() => {
      if (!activeId) return;

      const session = sessions.find(s => s.id === activeId);
      if (!session || !session.loading) return; // Already loaded or missing

      // Fetch function
      const loadData = async () => {
          try {
            let details = null;
            let tvEpisodes = [];
            let season = null;
            let episode = null;
            let title = '';

            // Try location state/session storage first? (Omitted for brevity/complexity in pool, prioritizing fetch/cache)
            // Simpler to just fetch or use location state if passed (re-implement if critical)
            
            // Just Fetch for robustness
            const d = await fetchMediaDetails(session.mediaType, session.id);
            details = d;
            title = d.title || d.name;

            if (session.mediaType === 'tv' || session.mediaType === 'anime') {
                season = 1;
                const sData = await fetchSeasonDetails(session.id, season);
                tvEpisodes = sData.episodes || [];
                episode = sData.episodes?.[0]?.episode_number || 1;
            }

            // Construct Src
            let src = '';
            if (session.mediaType === 'tv' || session.mediaType === 'anime') {
                 if (season && episode) {
                     src = `${cinemaOsBaseUrl}/${session.id}/${season}/${episode}?autoplay=1&sidebar=0&mix=0`;
                 }
            } else {
                 src = `${cinemaOsBaseUrl}/${session.id}?autoplay=1&sidebar=0&mix=0`;
            }

            // Update Session
            setSessions(prev => prev.map(s => {
                if (s.id === session.id) {
                    return {
                        ...s,
                        details,
                        tvEpisodes,
                        selectedSeason: season,
                        selectedEpisodeNumber: episode,
                        title,
                        playerSrc: src,
                        loading: false
                    };
                }
                return s;
            }));

          } catch (e) {
              console.error("Session load failed", e);
              // Remove failed session?
              setSessions(prev => prev.filter(s => s.id !== session.id));
              // Redirect back?
              navigate(-1);
          }
      };

      loadData();

  }, [activeId, sessions, navigate]); // Careful with dependency loops, but 'loading' flag guards it


  // --- Timeout Logic (Global) ---
  useEffect(() => {
      if (isStreamPage) {
           if (preloadTimeoutRef.current) clearTimeout(preloadTimeoutRef.current);
           preloadTimeoutRef.current = setTimeout(() => {
               console.log("Preload timeout - Clearing sessions to save resources");
               setSessions([]); // Clear all if timeout (user left it open)
               setActiveId(null);
           }, 300000);
      } else {
           if (preloadTimeoutRef.current) clearTimeout(preloadTimeoutRef.current);
      }
      return () => { if (preloadTimeoutRef.current) clearTimeout(preloadTimeoutRef.current); };
  }, [isStreamPage]);


  // --- Helper: Update current session selection ---
  const updateSessionEpisode = (epNum) => {
      setSessions(prev => prev.map(s => {
          if (s.id === activeId) {
             const src = `${cinemaOsBaseUrl}/${s.id}/${s.selectedSeason}/${epNum}?autoplay=1&sidebar=0&mix=0`;
             return { ...s, selectedEpisodeNumber: epNum, playerSrc: src };
          }
          return s;
      }));
  };

  const activeSession = sessions.find(s => s.id === activeId);
  const isVisible = shouldBeActive && !!activeSession;

  // --- Fullscreen State Listener ---
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);
  
  useEffect(() => {
    const handleFsChange = () => {
        const isFs = !!document.fullscreenElement || !!document.webkitFullscreenElement;
        setIsFullscreenMode(isFs);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
        document.removeEventListener('fullscreenchange', handleFsChange);
        document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // --- Inline Docking (Absolute Strategy) ---
  const [dockStyle, setDockStyle] = useState(null);
  
  useEffect(() => {
    if (isInlinePlay && !isFullscreenMode) {
        let resizeObserver;
        const updatePosition = () => {
            const slot = document.getElementById('video-slot');
            if (slot) {
                const rect = slot.getBoundingClientRect();
                const scrollTop = window.scrollY || document.documentElement.scrollTop;
                const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
                
                // Use absolute positioning relative to document
                setDockStyle({
                    position: 'absolute',
                    top: rect.top + scrollTop,
                    left: rect.left + scrollLeft,
                    width: rect.width,
                    height: rect.height,
                    zIndex: 50
                });
            }
        };

        // Initial update
        updatePosition();

        // Observer for layout changes (element size/position)
        const slot = document.getElementById('video-slot');
        if (slot) {
            resizeObserver = new ResizeObserver(updatePosition);
            resizeObserver.observe(slot);
        }
        
        // Window resize fallback
        window.addEventListener('resize', updatePosition);
        
        return () => {
            if (resizeObserver) resizeObserver.disconnect();
            window.removeEventListener('resize', updatePosition);
        };
    } else {
        setTimeout(() => setDockStyle(null), 0);
    }
  }, [isInlinePlay, isFullscreenMode, isVisible]); // Recalculate if visibility changes (page load)

  // Determine final style
  const playerStyle = (isInlinePlay && !isFullscreenMode && dockStyle) 
    ? { ...dockStyle, zIndex: 100 } // Boost Z-Index to be above Navbar
    : {
        position: 'fixed',
        inset: 0,
        zIndex: 100
    };

  // Auto-show controls on mount/change
  useEffect(() => {
     if (isVisible) {
         setTimeout(() => {
            setControlsVisible(true);
            const t = setTimeout(() => setControlsVisible(false), 3000);
            return () => clearTimeout(t);
         }, 0);
     }
  }, [isVisible, isFullscreenMode, isInlinePlay]);


  // --- Fullscreen & Orientation Logic ---
  const [isRotated, setIsRotated] = useState(false); // CSS rotation fallback for iOS/Mobile

  const toggleFullscreen = async () => {
    try {
      // 1. Try Native Fullscreen
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
         const el = document.documentElement;
         if (el.requestFullscreen) await el.requestFullscreen();
         else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
         
         // 2. Try Native Orientation Lock (Android/Desktop)
         if (screen.orientation?.lock) {
             await screen.orientation.lock('landscape').catch(() => {});
         } else {
             // 3. Fallback: CSS Rotation for iOS if not locked (optional auto-rotate?)
             // For now, let's just create a manual "Rotate" button functionality 
             // but we can also auto-toggle isRotated if we detect portrait?
             // No, manual is safer.
         }
      } else {
         if (document.exitFullscreen) await document.exitFullscreen();
         else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
         if (screen.orientation?.unlock) screen.orientation.unlock();
         setIsRotated(false); // Reset rotation on exit
      }
    } catch(e) { console.warn(e); }
  };
  
  // Clean up rotation/fullscreen on unmount/visibility change
  useEffect(() => {
    if (!isVisible) {
         if (document.fullscreenElement) document.exitFullscreen().catch(()=>{});
         setTimeout(() => setIsRotated(false), 0);
         document.body.style.overflow = '';
    } else {
         document.body.style.overflow = 'hidden';
         // Auto-fullscreen removed as per user request ("play here itself unless we click full screen")
    }
  }, [isVisible]);


  // Controls Visibility
  const showControls = () => {
      setControlsVisible(true);
      setInteractionToggle(p => p+1);
  };
  useEffect(() => {
      if(controlsVisible && !showEpisodeList) {
          const t = setTimeout(() => setControlsVisible(false), 3000);
          return () => clearTimeout(t);
      }
  }, [controlsVisible, showEpisodeList, interactionToggle]);

  if (sessions.length === 0) return null;

  return (
    <div 
        className={`transition-all duration-300 ${isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={playerStyle}
    >
        
        {/* Render ALL Sessions (Hidden or Visible) */}
        {sessions.map(session => (
            <div 
                key={session.id} 
                className={`absolute inset-0 w-full h-full transition-transform duration-300 ${session.id === activeId ? 'z-10 bg-black' : 'z-0 pointer-events-none opacity-0'} 
                ${session.id === activeId && isRotated ? 'rotate-90 origin-center w-[100vh] h-[100vw] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : ''}`}
                style={{ 
                    visibility: session.id === activeId ? 'visible' : 'hidden',
                }}
            >
                {session.playerSrc && (
                    <iframe 
                        src={session.playerSrc}
                        className="w-full h-full border-0"
                        allow="autoplay *; fullscreen *; encrypted-media *; picture-in-picture *"
                        sandbox="allow-same-origin allow-scripts allow-forms"
                        data-block-popups="true"
                    />
                )}
            </div>
        ))}

        {/* Global Controls Overlay (Only for Active Session) */}
        {isVisible && activeSession && (
             <div 
                className={`absolute inset-0 z-[101] pointer-events-none transition-transform duration-300 ${isRotated ? 'rotate-90 origin-center w-[100vh] h-[100vw] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : ''}`}
             >
                 {/* Interaction Zone (Top 25% relative to rotation) */}
                 <div 
                    className={`absolute top-0 inset-x-0 h-1/4 pointer-events-auto transition-opacity duration-200 ${controlsVisible ? 'opacity-0' : 'opacity-0 cursor-none'}`}
                    onMouseMove={showControls}
                    onClick={showControls}
                 />

                 {/* Top Bar */}
                 <div className={`absolute top-4 left-4 flex gap-3 pointer-events-auto transition-opacity duration-300 ${controlsVisible || showEpisodeList ? 'opacity-100' : 'opacity-0'}`}>
                    <button onClick={() => {
                        if (isFullscreenMode) {
                            toggleFullscreen();
                        } else if(isInlinePlay) {
                            // Clear session to unmount iframe and allow prefetching
                            setSessions([]);
                            setActiveId(null);
                            // Clear param
                            const newParams = new URLSearchParams(searchParams);
                            newParams.delete('play');
                            navigate({ search: newParams.toString() }, { replace: true });
                        } else {
                            // Clear session to unmount iframe
                            setSessions([]);
                            setActiveId(null);
                            navigate(-1);
                        }
                     }} className="bg-black/60 text-white px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
                        {isFullscreenMode ? '✕ Exit' : '✕ Close'}
                     </button>
                    {(activeSession.mediaType === 'tv' || activeSession.mediaType === 'anime') && (
                        <button onClick={() => { setShowEpisodeList(true); setControlsVisible(true); }} className="bg-black/60 text-white px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">☰ Episodes</button>
                    )}
                    {!isFullscreenMode && (
                        <button onClick={toggleFullscreen} className="bg-black/60 text-white px-4 py-2 rounded-full border border-white/10 backdrop-blur-md hidden md:block">Fullscreen</button>
                    )}
                    {/* Mobile Only Buttons */}
                    <div className="flex md:hidden gap-3">
                         {!isFullscreenMode && (
                             <button onClick={toggleFullscreen} className="bg-black/60 text-white px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">⛶</button>
                         )}
                    </div>
                 </div>

                 {/* Episode List */}
                 {showEpisodeList && (
                     <div className="absolute top-16 left-4 bottom-4 w-80 bg-black/95 border border-white/10 rounded-xl pointer-events-auto flex flex-col p-4 animate-in slide-in-from-left-5">
                         <div className="flex justify-between mb-4 text-white font-bold">
                             <h3>Episodes</h3>
                             <button onClick={() => setShowEpisodeList(false)}>✕</button>
                         </div>
                         <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                             {activeSession.tvEpisodes.map(ep => (
                                 <button 
                                    key={ep.id}
                                    onClick={() => {
                                        updateSessionEpisode(ep.episode_number);
                                        setShowEpisodeList(false);
                                    }}
                                    className={`w-full text-left p-3 rounded hover:bg-white/10 ${ep.episode_number === activeSession.selectedEpisodeNumber ? 'bg-[#9146FF] text-white' : 'text-gray-400'}`}
                                 >
                                     <div className="text-sm font-medium">{ep.episode_number}. {ep.name}</div>
                                 </button>
                             ))}
                         </div>
                     </div>
                 )}
                 
                 {/* Loading Indicator */}
                 {(activeSession.loading || !activeSession.playerSrc) && (
                     <div className="absolute inset-0 flex items-center justify-center bg-black">
                         <div className="animate-spin h-12 w-12 border-4 border-[#9146FF] border-t-transparent rounded-full" />
                     </div>
                 )}
             </div>
        )}
    </div>
  );
}

export default GlobalPlayer;
