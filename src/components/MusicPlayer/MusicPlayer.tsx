// src/components/MusicPlayer/MusicPlayer.tsx
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import playlists from '../../data/playlists.json';
import { Track, MusicCategory } from '../../types';
import { usePomodoro } from '../../contexts/PomodoroContext';
import { FiPlay, FiPause, FiSkipBack, FiSkipForward, FiVolume2, FiVolumeX } from 'react-icons/fi';
import { SeekBar } from './SeekBar';
import AudioMotionAnalyzer from 'audiomotion-analyzer';

// Define available music categories
const categories: { id: MusicCategory; name: string }[] = [
    { id: 'music', name: 'Músicas' }, { id: 'ambient', name: 'Ambiente' }, { id: 'noise', name: 'Ruídos' },
];

export const MusicPlayer: React.FC = () => {
    // --- Hooks and State ---
    const { styles, playSound } = usePomodoro(); // Context for styling and sounds
    const [selectedCategory, setSelectedCategory] = useState<MusicCategory>('music'); // Current category
    const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null); // Index in the active playlist
    const [isPlaying, setIsPlaying] = useState(false); // Playback state
    const [currentTime, setCurrentTime] = useState(0); // Current playback time
    const [duration, setDuration] = useState(0); // Total duration of the current track
    const [volume, setVolume] = useState(0.1); // Volume level (0 to 1)
    const [isMuted, setIsMuted] = useState(false); // Mute state
    const [lastVolume, setLastVolume] = useState(0.7); // Store volume before muting
    const [isVolumeSliderVisible, setIsVolumeSliderVisible] = useState(false); // Volume slider visibility

    // --- Refs ---
    const audioRef = useRef<HTMLAudioElement>(null); // Reference to the <audio> element
    const volumeControlRef = useRef<HTMLDivElement>(null); // Ref for the volume control container (for outside click)
    const visualizerContainerRef = useRef<HTMLDivElement>(null); // Ref for the visualizer container
    const audioMotionAnalyzerRef = useRef<AudioMotionAnalyzer | null>(null); // Ref for the visualizer instance
    const previousTrackRef = useRef<Track | null>(null); // Ref to track the previously loaded track to prevent reload on pause

    // --- Memoized Values ---
    // Get the playlist based on the selected category
    const activePlaylist = useMemo(() => (playlists as Record<MusicCategory, Track[]>)[selectedCategory] || [], [selectedCategory]);
    // Get the current track object based on the index
    const currentTrack: Track | null = useMemo(() => (
        currentTrackIndex !== null && activePlaylist[currentTrackIndex]
            ? activePlaylist[currentTrackIndex]
            : null
    ), [currentTrackIndex, activePlaylist]);

    // --- Audio Event Handlers (Callbacks) ---
    const onLoadedMetadata = useCallback(() => {
        // Update duration state when metadata (including duration) is loaded
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    }, []);

    const onTimeUpdate = useCallback(() => {
        // Update current time state during playback
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    }, []);

    // --- Playback Control Functions (Callbacks) ---
    const playTrack = useCallback((index: number) => {
        if (index >= 0 && index < activePlaylist.length) {
            playSound('buttonPress');
            // Set state: This will trigger the main useEffect to handle src change and play
            if (currentTrackIndex !== index) {
                setCurrentTrackIndex(index); // Set the new index
            }
             // Always set isPlaying true when explicitly selecting/starting a track
            setIsPlaying(true);
        } else {
            // Handle case where index is invalid (e.g., playlist cleared)
            setCurrentTrackIndex(null);
            setIsPlaying(false);
             // Resetting audio element handled by main useEffect when currentTrack becomes null
        }
    // Ensure all dependencies are listed
    }, [activePlaylist, playSound, currentTrackIndex, /* Implicit: setCurrentTrackIndex, setIsPlaying */ ]);

    const playNext = useCallback(() => {
        // Calculate and play the next track index
        if (activePlaylist.length === 0) return;
        const nextIndex = currentTrackIndex === null ? 0 : (currentTrackIndex + 1) % activePlaylist.length;
        // Call playTrack to handle state update and trigger useEffect
        playTrack(nextIndex);
    }, [currentTrackIndex, activePlaylist.length, playTrack]); // playTrack added

    const onEnded = useCallback(() => {
        // Automatically play the next track when the current one finishes
        // console.log("Track ended, playing next.");
        playNext();
    }, [playNext]); // Dependency: playNext

    

    const togglePlayPause = useCallback(() => {
        if (!audioRef.current || currentTrackIndex === null) return; // Can't toggle if no track selected
        playSound('buttonPress');

        // Option 1: Directly control audio and set state (User's provided approach)
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false); // Update state to reflect action
        } else {
            // Attempt play directly
            audioRef.current.play().catch(e => {
                console.error("Error playing audio:", e);
                setIsPlaying(false); // Set state back if play fails
            });
             // Set state assuming play will succeed (catch handles failure)
            setIsPlaying(true);
        }

        // Option 2: Only toggle state (More idiomatic with the revised useEffect)
        // setIsPlaying(prevIsPlaying => !prevIsPlaying);

    // Dependencies based on direct control approach
    }, [isPlaying, currentTrackIndex, playSound, /* Implicit: setIsPlaying */]);


    const playPrevious = useCallback(() => {
        if (activePlaylist.length === 0) return;

        // If track played > 3s, restart it. Otherwise, go to previous.
        if (audioRef.current && audioRef.current.currentTime > 3 && currentTrackIndex !== null) {
             playSound('buttonPress');
             audioRef.current.currentTime = 0;
             setCurrentTime(0); // Keep UI state synced immediately
             // Ensure it stays playing if it was paused right before clicking previous
             if (!isPlaying) setIsPlaying(true);
        } else {
            const prevIndex = currentTrackIndex === null
                ? activePlaylist.length - 1 // Wrap around to last track
                : (currentTrackIndex - 1 + activePlaylist.length) % activePlaylist.length; // Wrap around correctly
            playTrack(prevIndex); // Let playTrack handle the state change
        }
    }, [currentTrackIndex, activePlaylist.length, playTrack, playSound, isPlaying, /* Implicit: setIsPlaying */]); // isPlaying needed for the restart logic


    const handleSeek = (time: number) => {
        // Handle seeking within the track
        if (audioRef.current && currentTrackIndex !== null) { // Ensure track is loaded
            playSound('buttonPress');
            audioRef.current.currentTime = time;
            setCurrentTime(time); // Update state immediately for slider responsiveness
        }
    };

    // --- Volume Control Functions ---
    const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // Update volume from the slider
        const newVolume = parseFloat(event.target.value);
        setVolume(newVolume);
        setIsMuted(newVolume === 0); // Mute if volume is 0
        if (newVolume > 0) {
            setLastVolume(newVolume); // Store non-zero volume
        }
    };

    const toggleVolumeSlider = (event: React.MouseEvent) => {
        // Show/hide the volume slider
        playSound('buttonPress');
        event.stopPropagation(); // Prevent triggering outside click listener
        setIsVolumeSliderVisible(prev => !prev);
    };

    const toggleMute = (event: React.MouseEvent) => {
        // Toggle mute state on double-click
        event.stopPropagation(); // Prevent triggering other clicks
        playSound('buttonPress');
        const currentlyMuted = isMuted || volume === 0;
        if (currentlyMuted) {
            // Unmute: restore last known volume or a default
            const targetVolume = lastVolume > 0 ? lastVolume : 0.5;
            setVolume(targetVolume);
            setIsMuted(false);
        } else {
            // Mute: save current volume before setting mute state
            setLastVolume(volume);
            setIsMuted(true);
            // The volume effect will handle setting audio.volume = 0
        }
    };

    // --- Effects ---

    // Effect to Sync Audio Volume/Mute State
    useEffect(() => {
        // Update the audio element's volume when state changes
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]); // Run when volume or mute state changes

    // *** MAIN Effect: Handles Track Changes AND Play/Pause State ***
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return; // Exit if audio element isn't ready

        let playPromise: Promise<void> | undefined;

        // 1. Handle Track Change (Load new source if track differs from previous)
        if (currentTrack && currentTrack !== previousTrackRef.current) {
            // console.log("Track changed, setting src:", currentTrack.src);
            audio.src = currentTrack.src;
            audio.load(); // Load the new source
            previousTrackRef.current = currentTrack; // Update the ref *after* setting src/load
            // Reset time/duration for the new track loading
            setCurrentTime(0);
            setDuration(0); // Duration will be updated by onLoadedMetadata
        } else if (!currentTrack && previousTrackRef.current) {
            // Handle track being deselected (e.g., category change, playlist empty)
             // console.log("Track removed, resetting audio.");
             audio.pause();
             audio.src = '';
             // Reset time/duration state manually when track is removed
             setCurrentTime(0);
             setDuration(0);
             previousTrackRef.current = null; // Clear the previous track ref
        }

        // 2. Handle Play/Pause State (Sync audio element to isPlaying state)
        // This runs *after* potential track change logic
        if (currentTrack) { // Only attempt play/pause if a track is selected/loaded
            if (isPlaying) {
                // State wants play: If audio is paused, play it.
                 if (audio.paused) {
                    // console.log("State wants play, audio is paused. Playing.");
                    playPromise = audio.play(); // play() returns a promise
                 }
            } else {
                // State wants pause: If audio is playing, pause it.
                if (!audio.paused) {
                     // console.log("State wants pause, audio is playing. Pausing.");
                     audio.pause();
                }
            }
        } else {
             // Ensure audio is paused if no track is selected
             if (!audio.paused) {
                audio.pause();
             }
        }

        // 3. Handle play() promise rejection (e.g., browser restrictions)
        if (playPromise) {
            playPromise.catch(error => {
                // Ignore AbortError - happens normally if user interacts quickly causing interruption
                if (error.name !== 'AbortError') {
                    console.error("Error attempting to play audio:", error);
                    setIsPlaying(false); // Crucial: Revert state if play fails unexpectedly
                } else {
                   // console.log("Audio play() aborted (likely rapid action).");
                }
            });
        }

    }, [currentTrack, isPlaying]); // Dependencies: Run when track reference or play state changes


    // Effect for Hiding Volume Slider on Outside Click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // If slider is visible and click is outside the volume control container
            if (isVolumeSliderVisible && volumeControlRef.current && !volumeControlRef.current.contains(event.target as Node)) {
                setIsVolumeSliderVisible(false); // Hide the slider
            }
        };
        // Use 'mousedown' to catch the event early
        document.addEventListener('mousedown', handleClickOutside);
        // Cleanup listener on component unmount or when slider visibility changes
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isVolumeSliderVisible]); // Re-run only if slider visibility changes

    // Effect for Audio Visualizer Initialization
    useEffect(() => {
        let analyzer: AudioMotionAnalyzer | null = null;
        // Initialize only if refs are available and analyzer isn't already created
        if (audioRef.current && visualizerContainerRef.current && !audioMotionAnalyzerRef.current) {
            try {
                analyzer = new AudioMotionAnalyzer(
                    visualizerContainerRef.current,
                    {
                        source: audioRef.current, // Connect to the audio element
                        mode: 10, // Example visualizer mode
                        lineWidth: 1.5,
                        fillAlpha: 0.6,
                        smoothing: 0.5,
                        gradient: 'prism', // Example gradient
                        lumiBars: false,
                        reflexAlpha: 0.5,
                        reflexBright: 0.5,
                        showScaleY: false, // Hide scales
                        showScaleX: false,
                        roundBars: true,
                        overlay: true, // Draw on top
                        bgAlpha: 0 // Transparent background
                    }
                );
                audioMotionAnalyzerRef.current = analyzer; // Store the instance
            } catch (error) {
                console.error("Failed to initialize AudioMotionAnalyzer:", error);
            }
        }

        // Cleanup function: Disconnect and clear ref on unmount
        return () => {
            if (audioMotionAnalyzerRef.current) { // Use the ref for cleanup
                try {
                    // audioMotionAnalyzerRef.current.destroy();
                } catch (cleanupError) {
                    console.error("Error cleaning up AudioMotionAnalyzer:", cleanupError);
                }
            }
            audioMotionAnalyzerRef.current = null; // Clear the ref
        };
        // Run only once on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array ensures this runs only once

    // Effect for Handling Window Resize (Optional: if visualizer needs manual resize)
    useEffect(() => {
        const handleResize = () => {
             if (audioMotionAnalyzerRef.current) {
                 // Example: Trigger internal resize if the library supports it
                 // Or manually set canvas size if needed based on container
             }
        };
        window.addEventListener('resize', handleResize);
        handleResize(); // Call once initially
        // Cleanup listener
        return () => window.removeEventListener('resize', handleResize);
    }, []); // Run once on mount

    // --- Category Selection Handler ---
    const handleCategorySelect = (category: MusicCategory) => {
        if (category === selectedCategory) return; // Do nothing if same category clicked

        setSelectedCategory(category);
        // Reset playback state for the new category
        setCurrentTrackIndex(null);
        setIsPlaying(false);
        // Audio element state (src, paused) will be reset by the main useEffect when currentTrack becomes null
        setCurrentTime(0); // Reset time display
        setDuration(0); // Reset duration display
        playSound('buttonPress');
        setIsVolumeSliderVisible(false); // Hide volume slider on category change
    };

    // --- Styles & Classes ---
    // Base classes for category tabs
    const categoryTabBase = "px-4 py-2 rounded-t-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/30";
    // Classes for inactive tabs
    const categoryTabInactive = `bg-black/10 hover:bg-black/20 opacity-70 hover:opacity-100 ${styles.textColor}`;
    // Classes for the active tab (uses accent color from context)
    const categoryTabActive = `bg-black/30 shadow-inner ${styles.textColor} ${styles.modalAccentColor}`; // ring-color defined here
    // Classes for standard player control buttons (prev, next)
    const playerControlBtn = `p-2.5 rounded-full ${styles.buttonColor} hover:bg-white/20 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/30 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed`;
    // Extract the color name (e.g., "blue-500") from the ring utility class for the range input accent
    const accentColor = useMemo(() => {
        const match = styles.modalAccentColor.match(/ring-([a-z]+(?:-\d+)?)/);
        return match ? match[1] : 'gray-500'; // Default fallback if parsing fails
    }, [styles.modalAccentColor]);


    // --- Render ---
    return (
        <div className={`w-full max-w-md mx-auto h-full p-4 sm:p-6 rounded-3xl shadow-xl backdrop-blur-xs bg-black/35 ${styles.textColor} flex flex-col overflow-hidden`}>
            {/* Audio Element - Handles the actual playback */}
            <audio
                ref={audioRef}
                onLoadedMetadata={onLoadedMetadata} // Update duration when ready
                onTimeUpdate={onTimeUpdate}         // Update time during playback
                onEnded={onEnded}                   // Play next track when finished
                preload="metadata"                  // Hint to browser to load metadata early
                crossOrigin="anonymous"             // Needed for visualizer if audio is from another origin
                // key={currentTrack?.id} // Using key might force remount, often better to manage state via useEffect
            />

            {/* Category Tabs */}
            <div className="flex space-x-1 border-b border-white/10 mb-4 flex-shrink-0">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat.id)}
                        className={`${categoryTabBase} ${selectedCategory === cat.id ? categoryTabActive : categoryTabInactive}`}
                        aria-pressed={selectedCategory === cat.id} // Accessibility: Indicate active tab
                    >
                        {cat.name}
                    </button>
                ))}
                {/* Fills remaining space and provides the underline effect */}
                <div className="flex-grow border-b border-white/10"></div>
            </div>

            {/* --- Central Player Area (Visualizer + Controls) --- */}
            <div className="relative flex flex-col items-center justify-center flex-shrink-0 mb-4 rounded-xl overflow-hidden bg-black/15 shadow-lg">

                {/* Layer 1: Blurred Background Cover Art */}
                <div
                    className="absolute inset-0 w-full h-full bg-cover bg-center blur-[4px] scale-110 opacity-20 transition-all duration-500 ease-in-out z-0"
                    style={{ backgroundImage: `url(${currentTrack?.coverArtSrc || ''})` }}
                    aria-hidden="true" // Decorative element
                ></div>

                {/* Layer 2: Audio Visualizer Container */}
                <div
                    ref={visualizerContainerRef}
                    className="absolute blur-xs inset-0 w-full h-full z-10 opacity-50" // Adjust opacity/blur as needed
                    aria-hidden="true" // Decorative element
                ></div>

                {/* Layer 3: Foreground Controls & Info */}
                <div className="relative z-20 w-full h-full flex flex-col items-center justify-center p-3 space-y-2 text-shadow-sm">

                    {/* Track Title & Artist */}
                    <div className="text-center h-12 mb-1"> {/* Fixed height prevents layout shifts */}
                        <h3
                            className="text-base font-semibold truncate w-60 sm:w-72"
                            title={currentTrack?.title ?? 'Nenhuma faixa selecionada'} // Tooltip for long titles
                        >
                            {currentTrack?.title ?? 'Nenhuma faixa selecionada'}
                        </h3>
                        {currentTrack?.artist && (
                            <p className="text-xs opacity-80 truncate w-60 sm:w-72">{currentTrack.artist}</p>
                        )}
                    </div>

                    {/* Playback Control Buttons */}
                    <div className="flex items-center justify-center space-x-3 w-full mt-2">
                        <button onClick={playPrevious} disabled={activePlaylist.length === 0} className={playerControlBtn} aria-label="Faixa anterior">
                            <FiSkipBack className="h-5 w-5" />
                        </button>
                        <button
                            onClick={togglePlayPause}
                            disabled={currentTrackIndex === null} // Disable if no track selected
                            className={`p-3 rounded-full text-xl ${styles.buttonActiveColor} hover:opacity-90 transition-opacity duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/30 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed`}
                            aria-label={isPlaying ? "Pausar" : "Reproduzir"}
                        >
                            {/* Show Pause icon when playing, Play icon when paused */}
                            {isPlaying ? <FiPause className="h-5 w-5" /> : <FiPlay className="h-5 w-5" />}
                        </button>
                        <button onClick={playNext} disabled={activePlaylist.length === 0} className={playerControlBtn} aria-label="Próxima faixa">
                            <FiSkipForward className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Seek Bar Component */}
                    <SeekBar
                        currentTime={currentTime}
                        duration={duration}
                        onSeek={handleSeek} // Pass the seek handler
                        disabled={currentTrackIndex === null || duration === 0} // Disable if no track or duration unknown
                    />

                </div> {/* End Foreground Layer */}

                {/* --- Volume Control Container (Absolutely Positioned) --- */}
                <div
                    ref={volumeControlRef} // Ref for outside click detection
                    className="absolute top-3 right-3 z-30" // Position top-right, high z-index
                >
                    {/* Volume/Mute Button */}
                    <button
                        onClick={toggleVolumeSlider} // Click to show/hide slider
                        onDoubleClick={toggleMute} // Double click to toggle mute
                        title={isMuted ? "Ativar som (Duplo Clique)" : "Desativar som (Duplo Clique) / Ajustar"}
                        className={`p-1.5 rounded ${styles.buttonColor} hover:bg-white/15 transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-white/30`}
                        aria-label={isMuted ? "Ativar som" : "Desativar som ou ajustar volume"}
                    >
                        {/* Show different icons based on mute state */}
                        {isMuted ? <FiVolumeX className="h-4 w-4" /> : <FiVolume2 className="h-4 w-4" />}
                    </button>

                    {/* Volume Slider (Conditionally Rendered) */}
                    {isVolumeSliderVisible && (
                        <div
                            // Position slider to the LEFT of the button, centered vertically
                            className={`absolute right-full top-1/2 -translate-y-1/2 mr-2 p-2 rounded-lg shadow-lg ${styles.inputBgColor} z-40`} // High z-index for slider
                            onMouseDown={(e) => e.stopPropagation()} // Prevent click inside slider from closing it immediately
                        >
                            <input
                                type="range" min="0" max="1" step="0.01" // Standard range for volume
                                value={isMuted ? 0 : volume} // Visually reflect muted state
                                onChange={handleVolumeChange} // Update state on change
                                // Dynamically apply accent color based on styles context
                                className={`w-20 h-1.5 appearance-none cursor-pointer bg-white/20 rounded-full accent-${accentColor}`}
                                aria-label="Controle de volume"
                            />
                        </div>
                    )}
                </div>
                {/* --- End Volume Control --- */}

            </div> {/* End Central Player Area */}

            {/* --- Playlist Display --- */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 pb-1 [mask-image:linear-gradient(to_bottom,black_95%,transparent_100%)]">
                {activePlaylist.length > 0 ? (
                    // List of tracks if playlist is not empty
                    <ul className="space-y-1">
                        {activePlaylist.map((track, index) => (
                            <li
                                key={track.id} // Use unique track ID for key
                                onClick={() => playTrack(index)} // Click to play this track
                                className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors duration-150 ${currentTrackIndex === index
                                        ? `bg-black/30 ${styles.textColor} shadow-sm` // Style for the currently selected track
                                        : `bg-black/10 hover:bg-black/20 ${styles.textColor} opacity-80 hover:opacity-100` // Style for other tracks
                                    }`}
                                role="button" // Semantically a button
                                tabIndex={0} // Make it focusable
                                onKeyDown={(e) => e.key === 'Enter' && playTrack(index)} // Allow playing with Enter key
                            >
                                {/* Track Title */}
                                <span className="text-sm truncate flex-grow mr-2" title={track.title}>
                                    {track.title}
                                </span>
                                {/* Indicator Icons for current track state */}
                                {currentTrackIndex === index && isPlaying && (
                                    <FiVolume2 className="h-4 w-4 text-green-400 ml-auto flex-shrink-0 animate-pulse" aria-label="Reproduzindo" />
                                )}
                                {currentTrackIndex === index && !isPlaying && duration > 0 && ( // Show pause icon only if it's this track and loaded/paused
                                    <FiPause className="h-4 w-4 text-yellow-400 ml-auto flex-shrink-0" aria-label="Pausado" />
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    // Placeholder message when the playlist for the category is empty
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-60 px-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-3 opacity-30" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                        </svg>
                        <p className="text-sm font-medium">Playlist Vazia</p>
                        <p className="text-xs mt-1">Nenhuma faixa encontrada nesta categoria.</p>
                    </div>
                )}
            </div>
        </div>
    );
};