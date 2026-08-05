import { useCallback, useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, matchPath } from 'react-router-dom';
import { fetchMediaDetails, fetchSeasonDetails } from '../Api-services/tmbd';
import { createCinemaOsPlayerUrl } from './cinemaOsUrl';

const MAX_SESSIONS = 1;

function GlobalPlayer() {
  const location = useLocation();
  const navigate = useNavigate();

  // Detect mobile devices
  const [isMobile, setIsMobile] = useState(false);
  const [cinemaOSReady, setCinemaOSReady] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // --- Route Parsing ---
  const streamMatch = matchPath('/stream/:mediaType/:id', location.pathname);
  const watchMatch = matchPath('/watch/:mediaType/:id', location.pathname);

  // Check for inline play signal
  const searchParams = new URLSearchParams(location.search);
  const isInlinePlay = !!streamMatch && searchParams.get('play') === '1';
  const urlSeason = searchParams.get('season');
  const urlEpisode = searchParams.get('episode');
  
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
  const playerIframeRef = useRef(null);

  const stopPlayback = useCallback(() => {
    if (playerIframeRef.current) {
      playerIframeRef.current.src = 'about:blank';
    }

    setSessions([]);
    setActiveId(null);
    setCinemaOSReady(false);
    setShowEpisodeList(false);
  }, []);

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
        const cleanupTimer = setTimeout(stopPlayback, 0);
        return () => clearTimeout(cleanupTimer);
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
                    // Update timestamp/priority and mark as loading to refetch with new params
                    const updated = [...prev];
                    updated[existingIdx] = { ...updated[existingIdx], lastUsed: Date.now(), loading: true, playerReady: false };
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
                    loading: true, // Metadata loading
                    playerReady: false // Waiting for cinemaOS to signal ready
                };

                // Single session mode - replace instead of append
                return [newSession];
            });
        }, 0);
    }
  }, [mediaType, id, activeId, shouldBeActive, stopPlayback]);

  // --- Update episode when URL params change ---
  useEffect(() => {
    if (!activeId || !shouldBeActive) return;
    if (!urlSeason && !urlEpisode) return;
    
    const session = sessions.find(s => s.id === activeId);
    if (!session || session.loading) return;
    
    // Check if season or episode changed from current
    const seasonNum = urlSeason ? parseInt(urlSeason) : session.selectedSeason;
    const episodeNum = urlEpisode ? parseInt(urlEpisode) : session.selectedEpisodeNumber;
    
    if (seasonNum === session.selectedSeason && episodeNum === session.selectedEpisodeNumber) return;
    
    // Mark as loading to refetch
    setSessions(prev => prev.map(s => 
      s.id === activeId ? { ...s, loading: true } : s
    ));
  }, [urlSeason, urlEpisode, activeId, shouldBeActive, sessions]);

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
                season = urlSeason ? parseInt(urlSeason) : 1;
                const sData = await fetchSeasonDetails(session.id, season);
                tvEpisodes = sData.episodes || [];
                episode = urlEpisode ? parseInt(urlEpisode) : (sData.episodes?.[0]?.episode_number || 1);
            }

            const src = createCinemaOsPlayerUrl({
                mediaType: session.mediaType,
                id: session.id,
                season,
                episode,
            });

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
              // Ignore session load errors
              setSessions(prev => prev.filter(s => s.id !== session.id));
              // Redirect back?
              navigate(-1);
          }
      };

      loadData();

  }, [activeId, sessions, navigate, urlSeason, urlEpisode]);

  // Listen for cinemaOS PLAYER_EVENT to detect when video is actually playing
  useEffect(() => {
    const handleMessage = (event) => {
      const trustedOrigins = [window.location.origin, 'https://cinemaos.tech'];
      if (!trustedOrigins.includes(event.origin)) return;
      
      const data = event.data;
      if (data?.type === 'PLAYER_EVENT' && data?.data) {
        const eventData = data.data;
        
        // CinemaOS iframe is alive and ready
        setCinemaOSReady(true);
        
        // When we get timeupdate with playing=true, OR any play event, the video is streaming
        if ((eventData.event === 'timeupdate' && eventData.playing) || 
            eventData.event === 'play' || 
            eventData.event === 'playing') {
          setSessions(prev => prev.map(s => {
            if (s.id === activeId || String(s.id) === String(eventData.tmdbId)) {
              return { ...s, playerReady: true };
            }
            return s;
          }));
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeId]);

  // Reset cinemaOSReady when active session changes
  useEffect(() => {
    setCinemaOSReady(false);
  }, [activeId]);

  // --- Helper: Update current session selection ---
  const updateSessionEpisode = (epNum) => {
      setSessions(prev => prev.map(s => {
          if (s.id === activeId) {
             const src = createCinemaOsPlayerUrl({
                 mediaType: s.mediaType,
                 id: s.id,
                 season: s.selectedSeason,
                 episode: epNum,
             });
              return { ...s, selectedEpisodeNumber: epNum, playerSrc: src, playerReady: false };
          }
          return s;
      }));
  };

  const activeSession = sessions.find(s => s.id === activeId);
  const isVisible = shouldBeActive && !!activeSession;

  // Fallback: On mobile, hide loading screen after 3 seconds since autoplay is blocked
  useEffect(() => {
    if (!isVisible || !activeSession || activeSession.playerReady || !isMobile) return;
    
    const timer = setTimeout(() => {
      setSessions(prev => prev.map(s => {
        if (s.id === activeId) {
          return { ...s, playerReady: true };
        }
        return s;
      }));
    }, 3000); // 3 seconds for mobile

    return () => clearTimeout(timer);
  }, [isVisible, activeId, activeSession?.playerReady, isMobile]);

  // --- Fullscreen State Listener ---
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);
  
  useEffect(() => {
    const handleFsChange = () => {
        const isFs = !!document.fullscreenElement || !!document.webkitFullscreenElement;
        setIsFullscreenMode(isFs);
        if (isFs) {
            document.documentElement.classList.add('player-active');
        } else if (!isVisible) {
            document.documentElement.classList.remove('player-active');
        }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
        document.removeEventListener('fullscreenchange', handleFsChange);
        document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, [isVisible]);

  // --- Inline Docking (Absolute Strategy) ---
  const [dockStyle, setDockStyle] = useState(() => {
    // Try to restore last known position from sessionStorage
    try {
      const saved = sessionStorage.getItem('lume-inline-player-style');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return null;
  });
  
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
                const newStyle = {
                    position: 'absolute',
                    top: rect.top + scrollTop,
                    left: rect.left + scrollLeft,
                    width: rect.width,
                    height: rect.height,
                    zIndex: 50
                };
                setDockStyle(newStyle);
                // Save to sessionStorage for refresh persistence
                sessionStorage.setItem('lume-inline-player-style', JSON.stringify(newStyle));
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
        sessionStorage.removeItem('lume-inline-player-style');
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

  const closePlayer = async () => {
    stopPlayback();

    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      }
      if (screen.orientation?.unlock) screen.orientation.unlock();
    } catch {
      // Playback is already stopped; fullscreen cleanup is best effort.
    }

    setIsRotated(false);

    if (isInlinePlay) {
      const nextSearchParams = new URLSearchParams(location.search);
      nextSearchParams.delete('play');
      navigate({ search: nextSearchParams.toString() }, { replace: true });
      return;
    }

    navigate(-1);
  };

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
    } catch(e) { /* ignore */ }
  };
  
  // Clean up rotation/fullscreen on unmount/visibility change
  useEffect(() => {
    if (!isVisible) {
         if (document.fullscreenElement) document.exitFullscreen().catch(()=>{});
         setTimeout(() => setIsRotated(false), 0);
    }
  }, [isVisible]);

  // Hide scrollbar only when browser is in fullscreen mode
  useEffect(() => {
    if (isFullscreenMode) {
      document.documentElement.classList.add('player-active');
    } else {
      document.documentElement.classList.remove('player-active');
    }
  }, [isFullscreenMode]);


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
                        ref={session.id === activeId ? playerIframeRef : null}
                        src={session.playerSrc}
                        className="w-full h-full border-0"
                        allow="autoplay *; encrypted-media *; picture-in-picture *"
                        onLoad={() => {
                            setCinemaOSReady(true);
                            setSessions(prev => prev.map(s =>
                                s.id === session.id ? { ...s, playerReady: true } : s
                            ));
                        }}
                    />
                )}
            </div>
        ))}

        {/* Global Controls Overlay (Only for Active Session) */}
        {isVisible && activeSession && (
             <div 
                className={`absolute inset-0 z-[101] transition-transform duration-300 ${isRotated ? 'rotate-90 origin-center w-[100vh] h-[100vw] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : ''}`}
                style={{ pointerEvents: 'none' }}
             >
                 {/* Interaction Zone (Full Screen) - Shows controls on tap, passes through when visible */}
                 <div 
                    className={`absolute inset-0 transition-opacity duration-200 ${controlsVisible ? 'pointer-events-none' : 'pointer-events-auto cursor-pointer'}`}
                    onClick={() => !controlsVisible && showControls()}
                    onMouseMove={() => !controlsVisible && showControls()}
                 />

                 {/* Top Bar */}
                 <div className={`absolute top-4 left-4 flex gap-3 pointer-events-auto transition-opacity duration-300 ${controlsVisible || showEpisodeList ? 'opacity-100' : 'opacity-0'}`}>
                    <button onClick={closePlayer} className="bg-black/60 text-white px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
                        ✕ Close
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
              </div>
         )}

          {/* Loading Indicator - Shows until cinemaOS signals it's playing */}
          {isVisible && activeSession && (activeSession.loading || !activeSession.playerSrc || !activeSession.playerReady) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-[200] pointer-events-auto">
                  <button 
                      onClick={closePlayer}
                      className="absolute top-4 left-4 bg-black/60 text-white px-4 py-2 rounded-full border border-white/10 backdrop-blur-md z-[300]"
                  >
                      {isWatchPage ? '✕ Exit' : '✕ Close'}
                  </button>
                   <div className="animate-spin h-12 w-12 border-4 border-[#9146FF] border-t-transparent rounded-full mb-4" />
                   <p className="text-white text-lg font-medium mb-2">Loading your movie...</p>
                   <p className="text-gray-400 text-sm text-center max-w-xs mb-4">Initial playback may take a few moments.</p>
                   
                    {/* Mobile: Show "Tap to Play" only when cinemaOS iframe is ready */}
                    {isMobile && cinemaOSReady && (
                    <button 
                        onClick={() => {
                            setSessions(prev => prev.map(s => {
                                if (s.id === activeId) {
                                    return { ...s, playerReady: true };
                                }
                                return s;
                            }));
                        }}
                        className="mt-4 bg-[#9146FF] text-white px-6 py-3 rounded-full font-medium hover:bg-[#772ce8] transition-colors animate-pulse"
                    >
                        Tap to Play
                    </button>
                    )}
               </div>
          )}
    </div>
  );
}

export default GlobalPlayer;
