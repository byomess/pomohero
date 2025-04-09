// src/components/MusicPlayer/MusicPlayer.tsx
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import playlists from '../../data/playlists.json';
import { Track, MusicCategory } from '../../types';
import { usePomodoro } from '../../contexts/PomodoroContext';
import { FiPlay, FiPause, FiSkipBack, FiSkipForward, FiVolume2, FiVolumeX } from 'react-icons/fi';
import { SeekBar } from './SeekBar';

const categories: { id: MusicCategory; name: string }[] = [
    { id: 'music', name: 'Músicas' }, { id: 'ambient', name: 'Ambiente' }, { id: 'noise', name: 'Ruídos' },
];

export const MusicPlayer: React.FC = () => {
    const { styles, playSound } = usePomodoro();
    const [selectedCategory, setSelectedCategory] = useState<MusicCategory>('music');
    const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.1);
    const [isMuted, setIsMuted] = useState(false);
    const [lastVolume, setLastVolume] = useState(0.7);
    const [isVolumeSliderVisible, setIsVolumeSliderVisible] = useState(false); // State for slider visibility

    const audioRef = useRef<HTMLAudioElement>(null);
    const volumeControlRef = useRef<HTMLDivElement>(null); // Ref for the volume control container

    const activePlaylist = useMemo(() => (playlists as Record<MusicCategory, Track[]>)[selectedCategory] || [], [selectedCategory]);
    const currentTrack: Track | null = currentTrackIndex !== null ? activePlaylist[currentTrackIndex] : null;

    const onLoadedMetadata = () => { if (audioRef.current) setDuration(audioRef.current.duration); };
    const onTimeUpdate = () => { if (audioRef.current) setCurrentTime(audioRef.current.currentTime); };
    const onEnded = () => { playNext(); };

    const playTrack = useCallback((index: number) => {
        if (index >= 0 && index < activePlaylist.length) {
            setCurrentTrackIndex(index); setIsPlaying(true);
        } else {
            setCurrentTrackIndex(null); setIsPlaying(false);
            if(audioRef.current) audioRef.current.src = '';
        }
    }, [activePlaylist]);

    const togglePlayPause = useCallback(() => {
        if (!audioRef.current || currentTrackIndex === null) return;
        if (isPlaying) {
            audioRef.current.pause(); setIsPlaying(false); playSound('buttonPress');
        } else {
            audioRef.current.play().catch(e => console.error("Error playing audio:", e)); setIsPlaying(true); playSound('buttonPress');
        }
    }, [isPlaying, currentTrackIndex, playSound]);

    const playNext = useCallback(() => {
        if(activePlaylist.length === 0) return;
        const nextIndex = currentTrackIndex === null ? 0 : (currentTrackIndex + 1) % activePlaylist.length;
        playTrack(nextIndex); playSound('click');
    }, [currentTrackIndex, activePlaylist.length, playTrack, playSound]);

    const playPrevious = useCallback(() => {
         if(activePlaylist.length === 0) return;
        if(audioRef.current && audioRef.current.currentTime > 3) { audioRef.current.currentTime = 0; }
        else {
            const prevIndex = currentTrackIndex === null ? activePlaylist.length -1 : (currentTrackIndex - 1 + activePlaylist.length) % activePlaylist.length;
            playTrack(prevIndex);
        }
         playSound('click');
    }, [currentTrackIndex, activePlaylist.length, playTrack, playSound]);

    const handleSeek = (time: number) => {
        if (audioRef.current) { audioRef.current.currentTime = time; setCurrentTime(time); }
    };

    // Separate effect JUST for setting volume
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
            // Also update muted state based on volume for consistency
            setIsMuted(volume === 0);
        }
    }, [volume]);

    const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(event.target.value);
        setVolume(newVolume); // This will trigger the useEffect above
        if (newVolume > 0) setLastVolume(newVolume);
    };

     const toggleVolumeSlider = (event: React.MouseEvent) => {
        event.stopPropagation(); // Prevent click outside handler from closing immediately
        setIsVolumeSliderVisible(prev => !prev);
    };

    const toggleMute = (event: React.MouseEvent) => {
         event.stopPropagation(); // Prevent closing slider if open
         playSound('click');
         if(volume > 0) { // If currently not muted (volume > 0)
             setLastVolume(volume); // Store current volume
             setVolume(0); // Set volume to 0 (will trigger useEffect)
         } else { // If currently muted (volume === 0)
             const targetVolume = lastVolume > 0 ? lastVolume : 0.5; // Restore or set default
             setVolume(targetVolume); // Set volume back (will trigger useEffect)
         }
    };

    // Effect to load/play track - REMOVED volume from dependency array
    useEffect(() => {
        if (audioRef.current && currentTrack) {
            const wasPlaying = isPlaying; // Store if it was playing before src change
            audioRef.current.src = currentTrack.src;
            // audioRef.current.volume is handled by the separate volume effect
            if (wasPlaying) { // Only attempt to play if it should be playing
                 // Load is implicitly called by setting src, wait for canplay event or use timeout
                 const playPromise = audioRef.current.play();
                 if(playPromise !== undefined) {
                     playPromise.catch(e => {
                         console.error("Error playing after src change:", e);
                         // Maybe set isPlaying to false if auto-play fails
                         // setIsPlaying(false);
                     });
                 }
            }
        } else if (audioRef.current && !currentTrack) {
             audioRef.current.src = ''; audioRef.current.load();
             setIsPlaying(false); // Ensure playing state is false if no track
             setCurrentTime(0);
             setDuration(0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTrack]); // Depend only on the track itself

     // Effect to sync external play/pause state
      useEffect(() => {
        const audio = audioRef.current;
        const handlePlay = () => !isPlaying && setIsPlaying(true);
        const handlePause = () => isPlaying && setIsPlaying(false);
        audio?.addEventListener('play', handlePlay);
        audio?.addEventListener('pause', handlePause);
        return () => {
            audio?.removeEventListener('play', handlePlay);
            audio?.removeEventListener('pause', handlePause);
        };
    }, [isPlaying]); // Add isPlaying dependency

     // Effect to handle clicks outside the volume slider
     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isVolumeSliderVisible && volumeControlRef.current && !volumeControlRef.current.contains(event.target as Node)) {
                setIsVolumeSliderVisible(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isVolumeSliderVisible]); // Re-run when visibility changes


    const handleCategorySelect = (category: MusicCategory) => {
        setSelectedCategory(category); setCurrentTrackIndex(null); setIsPlaying(false);
         if (audioRef.current) {
             audioRef.current.pause(); audioRef.current.currentTime = 0; audioRef.current.src = '';
         }
         setCurrentTime(0); setDuration(0); playSound('click');
         setIsVolumeSliderVisible(false); // Close volume slider on category change
    };

    const categoryTabBase = "px-4 py-2 rounded-t-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/30";
    const categoryTabInactive = `bg-black/10 hover:bg-black/20 opacity-70 hover:opacity-100 ${styles.textColor}`;
    const categoryTabActive = `bg-black/30 shadow-inner ${styles.textColor} ${styles.modalAccentColor}`;
    const playerControlBtn = `p-2.5 rounded-full ${styles.buttonColor} hover:bg-white/20 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/30 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed`;
    const accentColor = styles.modalAccentColor.replace('ring-', ''); // For range input accent

    return (
        <div className={`w-full h-full p-6 md:p-8 rounded-3xl shadow-xl backdrop-blur-sm bg-black/25 ${styles.textColor} flex flex-col`}>
            <audio ref={audioRef} onLoadedMetadata={onLoadedMetadata} onTimeUpdate={onTimeUpdate} onEnded={onEnded} preload="metadata"/>

            <div className="flex space-x-1 border-b border-white/10 mb-4 flex-shrink-0">
                {categories.map((cat) => ( <button key={cat.id} onClick={() => handleCategorySelect(cat.id)} className={`${categoryTabBase} ${selectedCategory === cat.id ? categoryTabActive : categoryTabInactive}`}> {cat.name} </button> ))}
                 <div className="flex-grow border-b border-white/10"></div>
            </div>

             <div className="flex flex-col items-center justify-center flex-shrink-0 relative mb-4 p-3 rounded-xl overflow-hidden min-h-[180px] bg-black/10 shadow-lg">
                <div className="absolute inset-0 w-full h-full bg-cover bg-center blur-sm scale-110 opacity-30 transition-all duration-500 ease-in-out" style={{ backgroundImage: `url(${currentTrack?.coverArtSrc || ''})` }} ></div>
                 <div className="relative z-10 w-full flex flex-col items-center space-y-3">
                    <div className="text-center h-10">
                        <h3 className="text-base font-semibold truncate w-60" title={currentTrack?.title ?? 'Nenhuma faixa selecionada'}> {currentTrack?.title ?? 'Nenhuma faixa selecionada'} </h3>
                        {currentTrack?.artist && ( <p className="text-xs opacity-70 truncate w-60">{currentTrack.artist}</p> )}
                    </div>
                    <div className="flex items-center justify-center space-x-3">
                        <button onClick={playPrevious} disabled={activePlaylist.length === 0} className={playerControlBtn}><FiSkipBack className="h-5 w-5" /></button>
                        <button onClick={togglePlayPause} disabled={currentTrackIndex === null} className={`p-3 rounded-full text-xl ${styles.buttonActiveColor} hover:opacity-90 transition-opacity duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/30 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed`}>
                            {isPlaying ? <FiPause className="h-5 w-5"/> : <FiPlay className="h-5 w-5"/>}
                        </button>
                        <button onClick={playNext} disabled={activePlaylist.length === 0} className={playerControlBtn}><FiSkipForward className="h-5 w-5" /></button>
                    </div>
                    <SeekBar currentTime={currentTime} duration={duration} onSeek={handleSeek} disabled={currentTrackIndex === null}/>

                     {/* Volume Control Container */}
                     <div ref={volumeControlRef} className="relative flex items-center w-full max-w-xs justify-center">
                         {/* Vertical Slider (Conditionally Rendered) */}
                        {isVolumeSliderVisible && (
                             <div
                                className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 p-2 rounded-lg shadow-lg ${styles.inputBgColor}`}
                                // Prevent click inside slider from closing it via the outside handler
                                onMouseDown={(e) => e.stopPropagation()}
                             >
                                 <input
                                     type="range" min="0" max="1" step="0.01"
                                     value={volume}
                                     onChange={handleVolumeChange}
                                     // Style for vertical appearance using rotate
                                     className={`w-24 h-1.5 appearance-none cursor-pointer origin-center bg-white/10 rounded-full accent-${accentColor}`}
                                     aria-label="Controle de volume vertical"
                                 />
                             </div>
                         )}
                         {/* Volume Icon / Mute Toggle */}
                         <button
                            onClick={toggleVolumeSlider} // Click icon to toggle slider visibility
                            onDoubleClick={toggleMute} // Double click icon to mute/unmute
                            title={isMuted || volume === 0 ? "Ativar som (Duplo Clique)" : "Desativar som (Duplo Clique) / Ajustar"}
                            className={`p-1.5 rounded ${styles.buttonColor} hover:bg-white/15`}
                            aria-label={isMuted || volume === 0 ? "Ativar som" : "Desativar som ou ajustar volume"}
                         >
                             {isMuted || volume === 0 ? <FiVolumeX className="h-4 w-4"/> : <FiVolume2 className="h-4 w-4"/>}
                         </button>
                    </div>
                 </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2 pb-1 [mask-image:linear-gradient(to_bottom,black_95%,transparent_100%)]">
                 {activePlaylist.length > 0 ? (
                    <ul className="space-y-1.5">
                        {activePlaylist.map((track, index) => (
                            <li key={track.id} onClick={() => playTrack(index)}
                                className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors duration-150 ${ currentTrackIndex === index ? `bg-black/30 ${styles.textColor}` : `bg-black/10 hover:bg-black/20 ${styles.textColor} opacity-80 hover:opacity-100` }`}
                            >
                                <span className="text-sm truncate flex-grow" title={track.title}> {track.title} </span>
                                {currentTrackIndex === index && isPlaying && ( <FiVolume2 className="h-4 w-4 text-green-400 ml-2 flex-shrink-0"/> )}
                            </li>
                        ))}
                    </ul>
                 ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center opacity-60 px-4">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-3 opacity-30"> <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" /> </svg>
                         <p className="text-sm font-medium">Playlist Vazia</p>
                         <p className="text-xs mt-1">Nenhuma faixa encontrada.</p>
                     </div>
                 )}
            </div>
        </div>
    );
};