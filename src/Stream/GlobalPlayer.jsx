import { useCallback, useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, matchPath } from 'react-router-dom';
import { fetchMediaDetails, fetchSeasonDetails } from '../Api-services/tmbd';
import { createCinemaOsPlayerUrl } from './cinemaOsUrl';

const MAX_SESSIONS = 1;
const POPUP_BLOCKER_FLAG = '__LUME_POPUP_BLOCKER_INSTALLED__';
const PLAYER_INTERACTION_FLAG = '__LUME_PLAYER_INTERACTION_OBSERVER_INSTALLED__';

const installPopupBlocker = (iframeWindow) => {
  if (!iframeWindow || iframeWindow[POPUP_BLOCKER_FLAG]) return;

  try {
    Object.defineProperty(iframeWindow, POPUP_BLOCKER_FLAG, {
      configurable: false,
      enumerable: false,
      writable: false,
      value: true,
    });
  } catch {
    // Continue installing the blocker if another script reserved the flag.
  }

  const blockedOpen = () => null;
  try {
    Object.defineProperty(iframeWindow, 'open', {
      configurable: false,
      enumerable: true,
      writable: false,
      value: blockedOpen,
    });
  } catch {
    try {
      iframeWindow.open = blockedOpen;
    } catch {
      // The proxy-injected blocker may already have locked this property.
    }
  }

  const iframeDocument = iframeWindow.document;
  iframeDocument.addEventListener('click', (event) => {
    const link = event.target.closest?.('a');
    if (!link) return;

    const target = link.target?.toLowerCase();
    let isExternal = false;
    try {
      isExternal = new URL(link.href, iframeWindow.location.href).origin !== iframeWindow.location.origin;
    } catch {
      isExternal = true;
    }

    if ((target && target !== '_self') || isExternal) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  iframeDocument.addEventListener('submit', (event) => {
    const form = event.target;
    const target = form.target?.toLowerCase();
    let isExternal = false;
    try {
      isExternal = new URL(form.action, iframeWindow.location.href).origin !== iframeWindow.location.origin;
    } catch {
      isExternal = true;
    }

    if ((target && target !== '_self') || isExternal) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
};

const observePlayerInteraction = (iframeWindow, onInteraction) => {
  if (!iframeWindow || iframeWindow[PLAYER_INTERACTION_FLAG]) return;

  try {
    Object.defineProperty(iframeWindow, PLAYER_INTERACTION_FLAG, {
      configurable: false,
      enumerable: false,
      writable: false,
      value: true,
    });
  } catch {
    return;
  }

  const iframeDocument = iframeWindow.document;
  let lastPointerMove = 0;

  iframeDocument.addEventListener('pointerdown', onInteraction, {
    capture: true,
    passive: true,
  });
  iframeDocument.addEventListener('pointermove', () => {
    const now = Date.now();
    if (now - lastPointerMove < 500) return;

    lastPointerMove = now;
    onInteraction();
  }, { capture: true, passive: true });
  iframeDocument.addEventListener('keydown', onInteraction, true);
};

function GlobalPlayer() {
  const location = useLocation();
  const navigate = useNavigate();

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

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    setInteractionToggle(previous => previous + 1);
  }, []);

  const stopPlayback = useCallback(() => {
    if (playerIframeRef.current) {
      playerIframeRef.current.src = 'about:blank';
    }

    setSessions([]);
    setActiveId(null);
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
                    updated[existingIdx] = { ...updated[existingIdx], lastUsed: Date.now(), loading: true };
                    return updated;
                }

                const isEpisodeMedia = mediaType === 'tv' || mediaType === 'anime';
                const initialSeason = isEpisodeMedia ? (Number(urlSeason) || 1) : null;
                const initialEpisode = isEpisodeMedia ? (Number(urlEpisode) || 1) : null;

                // Create new session
                const newSession = {
                    id,
                    mediaType,
                    details: null,
                    tvEpisodes: [],
                    selectedSeason: initialSeason,
                    selectedEpisodeNumber: initialEpisode,
                    title: '',
                    loaded: false,
                    lastUsed: Date.now(),
                    playerSrc: createCinemaOsPlayerUrl({
                        mediaType,
                        id,
                        season: initialSeason,
                        episode: initialEpisode,
                    }),
                    loading: true // Metadata loading
                };

                // Single session mode - replace instead of append
                return [newSession];
            });
        }, 0);
    }
  }, [mediaType, id, activeId, shouldBeActive, stopPlayback, urlSeason, urlEpisode]);

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

  const selectEpisode = (episodeNumber) => {
      setSessions(prev => prev.map(s => {
          if (s.id === activeId) {
             const src = createCinemaOsPlayerUrl({
                 mediaType: s.mediaType,
                 id: s.id,
                 season: s.selectedSeason,
                 episode: episodeNumber,
             });
              return {
                  ...s,
                  selectedEpisodeNumber: episodeNumber,
                  playerSrc: src,
              };
          }
          return s;
      }));

      const nextSearchParams = new URLSearchParams(location.search);
      const selectedSession = sessions.find(s => s.id === activeId);
      if (selectedSession?.selectedSeason) {
          nextSearchParams.set('season', String(selectedSession.selectedSeason));
      }
      nextSearchParams.set('episode', String(episodeNumber));
      navigate({ search: nextSearchParams.toString() }, { replace: true });
      setShowEpisodeList(false);
      setControlsVisible(true);
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
         const showTimer = setTimeout(() => {
            setControlsVisible(true);
         }, 0);
         return () => clearTimeout(showTimer);
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

  // A fixed full-viewport player must also lock the page behind it. Inline
  // playback keeps normal page scrolling until the user enters fullscreen.
  useEffect(() => {
    const shouldLockPageScroll = isVisible && (!isInlinePlay || isFullscreenMode);
    document.documentElement.classList.toggle('player-active', shouldLockPageScroll);

    return () => document.documentElement.classList.remove('player-active');
  }, [isVisible, isInlinePlay, isFullscreenMode]);


  useEffect(() => {
      if(controlsVisible && !showEpisodeList) {
          const t = setTimeout(() => setControlsVisible(false), 3000);
          return () => clearTimeout(t);
      }
  }, [controlsVisible, showEpisodeList, interactionToggle]);

  if (sessions.length === 0) return null;

  return (
    <div 
        className={`h-[100dvh] transition-all duration-300 ${isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
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
                        onLoad={(event) => {
                            try {
                                installPopupBlocker(event.currentTarget.contentWindow);
                                observePlayerInteraction(
                                    event.currentTarget.contentWindow,
                                    revealControls,
                                );
                            } catch {
                                // If an ad navigates the iframe off-origin, restore the player.
                                event.currentTarget.src = session.playerSrc;
                                return;
                            }
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
                 {/* Top Bar */}
                 <div className={`absolute left-3 right-3 top-[calc(env(safe-area-inset-top)+0.75rem)] flex items-center justify-between gap-2 transition-opacity duration-300 md:left-4 md:right-auto md:top-4 md:justify-start ${controlsVisible || showEpisodeList ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                    <div className="flex min-w-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={closePlayer}
                            className="min-h-11 rounded-full border border-white/15 bg-black/75 px-4 text-sm font-medium text-white transition-colors hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        >
                            ✕ Close
                        </button>
                        {(activeSession.mediaType === 'tv' || activeSession.mediaType === 'anime') && (
                            <button
                                type="button"
                                onClick={() => { setShowEpisodeList(true); setControlsVisible(true); }}
                                className="min-h-11 rounded-full border border-white/15 bg-black/75 px-4 text-sm font-medium text-white transition-colors hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                            >
                                Episodes
                            </button>
                        )}
                    </div>
                    {!isFullscreenMode && (
                        <button
                            type="button"
                            onClick={toggleFullscreen}
                            aria-label="Enter fullscreen"
                            className="min-h-11 min-w-11 rounded-full border border-white/15 bg-black/75 px-3 text-lg text-white transition-colors hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:px-4 md:text-sm md:font-medium"
                        >
                            <span className="md:hidden">⛶</span>
                            <span className="hidden md:inline">Fullscreen</span>
                        </button>
                    )}
                 </div>

                  {/* Episode List */}
                  {showEpisodeList && (
                      <>
                      <button
                          type="button"
                          aria-label="Close episode list"
                          onClick={() => setShowEpisodeList(false)}
                          className="absolute inset-0 bg-black/55 pointer-events-auto md:hidden"
                      />
                      <div className="absolute inset-x-0 bottom-0 max-h-[72dvh] rounded-t-3xl border-t border-white/10 bg-zinc-950 pointer-events-auto flex flex-col p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-2xl md:inset-x-auto md:top-16 md:left-4 md:bottom-4 md:w-96 md:max-h-none md:rounded-2xl md:border">
                          <div className="mb-3 flex items-center justify-between gap-4 text-white">
                              <div className="min-w-0">
                                  <h3 className="text-lg font-semibold">Episodes</h3>
                                  <p className="truncate text-xs text-zinc-400">Season {activeSession.selectedSeason}</p>
                              </div>
                              <button
                                  type="button"
                                  aria-label="Close episode list"
                                  onClick={() => setShowEpisodeList(false)}
                                  className="min-h-11 min-w-11 rounded-full text-lg text-zinc-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
                              >
                                  ✕
                              </button>
                          </div>
                          <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar space-y-1 pr-1">
                              {activeSession.tvEpisodes.map(ep => (
                                  <button 
                                     key={ep.id}
                                     type="button"
                                     onClick={() => selectEpisode(ep.episode_number)}
                                     className={`min-h-14 w-full rounded-2xl px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white ${ep.episode_number === activeSession.selectedEpisodeNumber ? 'bg-[#9146FF] text-white' : 'text-zinc-300 hover:bg-white/10'}`}
                                  >
                                      <div className="flex items-center gap-3">
                                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${ep.episode_number === activeSession.selectedEpisodeNumber ? 'bg-white/20' : 'bg-white/5'}`}>
                                              {ep.episode_number}
                                          </span>
                                          <span className="min-w-0 flex-1">
                                              <span className="block truncate text-sm font-medium">{ep.name || `Episode ${ep.episode_number}`}</span>
                                              {ep.runtime ? <span className="block text-xs opacity-65">{ep.runtime} min</span> : null}
                                          </span>
                                          {ep.episode_number === activeSession.selectedEpisodeNumber ? <span className="text-xs font-semibold">Playing</span> : null}
                                      </div>
                                  </button>
                              ))}
                          </div>
                      </div>
                      </>
                  )}

              </div>
         )}

          {/* Loading metadata before the real player iframe can be created. */}
          {isVisible && activeSession && !activeSession.playerSrc && (
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
               </div>
          )}
    </div>
  );
}

export default GlobalPlayer;
