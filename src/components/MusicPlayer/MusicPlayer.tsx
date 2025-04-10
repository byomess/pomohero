// src/components/MusicPlayer/MusicPlayer.tsx
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import playlists from '../../data/playlists.json';
import { Track, MusicCategory } from '../../types';
import { usePomodoro } from '../../contexts/PomodoroContext';
import { FiPlay, FiPause, FiSkipBack, FiSkipForward, FiVolume2, FiVolumeX } from 'react-icons/fi';
import { SeekBar } from './SeekBar';
import AudioMotionAnalyzer from 'audiomotion-analyzer';
import { FOCUS_TARGET_VOLUME, BREAK_TARGET_VOLUME, DEFAULT_MUSIC_VOLUME } from '../../utils/constants';

const categories: { id: MusicCategory; name: string }[] = [
    { id: 'music', name: 'Músicas' }, { id: 'ambient', name: 'Ambiente' }, { id: 'noise', name: 'Ruídos' },
];

export const MusicPlayer: React.FC = () => {
    const { styles, playSound, targetMusicVolume, isRunning: isPomodoroRunning } = usePomodoro(); // Renamed isRunning to avoid conflict
    const [selectedCategory, setSelectedCategory] = useState<MusicCategory>('music');
    const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(DEFAULT_MUSIC_VOLUME);
    const [isMuted, setIsMuted] = useState(false);
    const [lastVolume, setLastVolume] = useState(0.7);
    const [isVolumeSliderVisible, setIsVolumeSliderVisible] = useState(false);

    const audioRef = useRef<HTMLAudioElement>(null);
    const volumeControlRef = useRef<HTMLDivElement>(null);
    const visualizerContainerRef = useRef<HTMLDivElement>(null);
    const audioMotionAnalyzerRef = useRef<AudioMotionAnalyzer | null>(null);
    const previousTrackRef = useRef<Track | null>(null);
    const wasPomodoroRunningRef = useRef<boolean>(isPomodoroRunning); // Track previous Pomodoro running state

    const activePlaylist = useMemo(() => (playlists as Record<MusicCategory, Track[]>)[selectedCategory] || [], [selectedCategory]);
    const currentTrack: Track | null = useMemo(() => (
        currentTrackIndex !== null && activePlaylist[currentTrackIndex]
            ? activePlaylist[currentTrackIndex]
            : null
    ), [currentTrackIndex, activePlaylist]);

    const onLoadedMetadata = useCallback(() => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    }, []);

    const onTimeUpdate = useCallback(() => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    }, []);

    const playTrack = useCallback((index: number) => {
        if (index >= 0 && index < activePlaylist.length) {
            playSound('buttonPress');
            if (currentTrackIndex !== index) {
                setCurrentTrackIndex(index);
            }
            setIsPlaying(true);
        } else {
            setCurrentTrackIndex(null);
            setIsPlaying(false);
        }
    }, [activePlaylist, playSound, currentTrackIndex, setCurrentTrackIndex, setIsPlaying]);

    const playNext = useCallback(() => {
        if (activePlaylist.length === 0) return;
        const nextIndex = currentTrackIndex === null ? 0 : (currentTrackIndex + 1) % activePlaylist.length;
        playTrack(nextIndex);
    }, [currentTrackIndex, activePlaylist.length, playTrack]);

    const onEnded = useCallback(() => {
        playNext();
    }, [playNext]);

    const togglePlayPause = useCallback(() => {
        if (!audioRef.current || currentTrackIndex === null) return;
        playSound('buttonPress');
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().catch(e => {
                console.error("Error playing audio:", e);
                setIsPlaying(false);
            });
            setIsPlaying(true);
        }
    }, [isPlaying, currentTrackIndex, playSound, setIsPlaying]);

    const playPrevious = useCallback(() => {
        if (activePlaylist.length === 0) return;
        if (audioRef.current && audioRef.current.currentTime > 3 && currentTrackIndex !== null) {
             playSound('buttonPress');
             audioRef.current.currentTime = 0;
             setCurrentTime(0);
             if (!isPlaying) setIsPlaying(true);
        } else {
            const prevIndex = currentTrackIndex === null
                ? activePlaylist.length - 1
                : (currentTrackIndex - 1 + activePlaylist.length) % activePlaylist.length;
            playTrack(prevIndex);
        }
    }, [currentTrackIndex, activePlaylist.length, playTrack, playSound, isPlaying, setIsPlaying]);


    const handleSeek = (time: number) => {
        if (audioRef.current && currentTrackIndex !== null) {
            playSound('buttonPress');
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(event.target.value);
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
        if (newVolume > 0) {
            setLastVolume(newVolume);
        }
    };

    const toggleVolumeSlider = (event: React.MouseEvent) => {
        playSound('buttonPress');
        event.stopPropagation();
        setIsVolumeSliderVisible(prev => !prev);
    };

    const toggleMute = (event: React.MouseEvent) => {
        event.stopPropagation();
        playSound('buttonPress');
        const currentlyMuted = isMuted || volume === 0;
        if (currentlyMuted) {
            const targetVolume = lastVolume > 0 ? lastVolume : 0.5;
            setVolume(targetVolume);
            setIsMuted(false);
        } else {
            setLastVolume(volume);
            setIsMuted(true);
        }
    };

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);

    useEffect(() => {
        if (isPomodoroRunning && !wasPomodoroRunningRef.current) {
            if (isPlaying && !isMuted && audioRef.current) {
                const currentInternalVolume = volume;
                if (targetMusicVolume === FOCUS_TARGET_VOLUME && currentInternalVolume > FOCUS_TARGET_VOLUME) {
                    setLastVolume(currentInternalVolume);
                    setVolume(FOCUS_TARGET_VOLUME);
                }
                else if (targetMusicVolume === BREAK_TARGET_VOLUME && currentInternalVolume < BREAK_TARGET_VOLUME) {
                    setVolume(BREAK_TARGET_VOLUME);
                }
            }
        }
        wasPomodoroRunningRef.current = isPomodoroRunning;
    }, [isPomodoroRunning, isPlaying, isMuted, targetMusicVolume, volume]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        let playPromise: Promise<void> | undefined;

        if (currentTrack && currentTrack !== previousTrackRef.current) {
            audio.src = currentTrack.src;
            audio.load();
            previousTrackRef.current = currentTrack;
            setCurrentTime(0);
            setDuration(0);
        } else if (!currentTrack && previousTrackRef.current) {
             audio.pause();
             audio.src = '';
             setCurrentTime(0);
             setDuration(0);
             previousTrackRef.current = null;
        }

        if (currentTrack) {
            if (isPlaying) {
                 if (audio.paused) {
                    playPromise = audio.play();
                 }
            } else {
                if (!audio.paused) {
                     audio.pause();
                }
            }
        } else {
             if (!audio.paused) {
                audio.pause();
             }
        }

        if (playPromise) {
            playPromise.catch(error => {
                if (error.name !== 'AbortError') {
                    console.error("Error attempting to play audio:", error);
                    setIsPlaying(false);
                }
            });
        }
    }, [currentTrack, isPlaying]);


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
    }, [isVolumeSliderVisible]);

    useEffect(() => {
        let analyzer: AudioMotionAnalyzer | null = null;
        if (audioRef.current && visualizerContainerRef.current && !audioMotionAnalyzerRef.current) {
            try {
                analyzer = new AudioMotionAnalyzer(
                    visualizerContainerRef.current,
                    {
                        source: audioRef.current, mode: 10, lineWidth: 1.5, fillAlpha: 0.6,
                        smoothing: 0.5, gradient: 'prism', lumiBars: false, reflexAlpha: 0.5,
                        reflexBright: 0.5, showScaleY: false, showScaleX: false, roundBars: true,
                        overlay: true, bgAlpha: 0
                    }
                );
                audioMotionAnalyzerRef.current = analyzer;
            } catch (error) {
                console.error("Failed to initialize AudioMotionAnalyzer:", error);
            }
        }
        return () => {
            if (audioMotionAnalyzerRef.current) {
                try {
                   // Consider if destroy method exists and is needed
                   // audioMotionAnalyzerRef.current.destroy();
                } catch (cleanupError) {
                    console.error("Error cleaning up AudioMotionAnalyzer:", cleanupError);
                }
            }
            audioMotionAnalyzerRef.current = null;
        };
    }, []);

    useEffect(() => {
        const handleResize = () => {
             if (audioMotionAnalyzerRef.current) { /* Potential resize logic */ }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleCategorySelect = (category: MusicCategory) => {
        if (category === selectedCategory) return;
        setSelectedCategory(category);
        setCurrentTrackIndex(null);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        playSound('buttonPress');
        setIsVolumeSliderVisible(false);
    };

    const categoryTabBase = "px-4 py-2 rounded-t-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/30";
    const categoryTabInactive = `bg-black/10 hover:bg-black/20 opacity-70 hover:opacity-100 ${styles.textColor}`;
    const categoryTabActive = `bg-black/30 shadow-inner ${styles.textColor} ${styles.modalAccentColor}`;
    const playerControlBtn = `p-2.5 rounded-full ${styles.buttonColor} hover:bg-white/20 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/30 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed`;
    const accentColor = useMemo(() => {
        const match = styles.modalAccentColor.match(/ring-([a-z]+(?:-\d+)?)/);
        return match ? match[1] : 'gray-500';
    }, [styles.modalAccentColor]);

    return (
        <div className={`w-full max-w-md mx-auto h-full p-4 sm:p-6 rounded-3xl shadow-xl backdrop-blur-xs bg-black/35 ${styles.textColor} flex flex-col overflow-hidden`}>
            <audio
                ref={audioRef}
                onLoadedMetadata={onLoadedMetadata}
                onTimeUpdate={onTimeUpdate}
                onEnded={onEnded}
                preload="metadata"
                crossOrigin="anonymous"
            />
            <div className="flex space-x-1 border-b border-white/10 mb-4 flex-shrink-0">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat.id)}
                        className={`${categoryTabBase} ${selectedCategory === cat.id ? categoryTabActive : categoryTabInactive}`}
                        aria-pressed={selectedCategory === cat.id}
                    >
                        {cat.name}
                    </button>
                ))}
                <div className="flex-grow border-b border-white/10"></div>
            </div>
            <div className="relative flex flex-col items-center justify-center flex-shrink-0 mb-4 rounded-xl overflow-hidden bg-black/15 shadow-lg">
                <div
                    className="absolute inset-0 w-full h-full bg-cover bg-center blur-[4px] scale-110 opacity-20 transition-all duration-500 ease-in-out z-0"
                    style={{ backgroundImage: `url(${currentTrack?.coverArtSrc || ''})` }}
                    aria-hidden="true"
                ></div>
                <div
                    ref={visualizerContainerRef}
                    className="absolute blur-xs inset-0 w-full h-full z-10 opacity-50"
                    aria-hidden="true"
                ></div>
                <div className="relative z-20 w-full h-full flex flex-col items-center justify-center p-3 space-y-2 text-shadow-sm">
                    <div className="text-center h-12 mb-1">
                        <h3
                            className="text-base font-semibold truncate w-60 sm:w-72"
                            title={currentTrack?.title ?? 'Nenhuma faixa selecionada'}
                        >
                            {currentTrack?.title ?? 'Nenhuma faixa selecionada'}
                        </h3>
                        {currentTrack?.artist && (
                            <p className="text-xs opacity-80 truncate w-60 sm:w-72">{currentTrack.artist}</p>
                        )}
                    </div>
                    <div className="flex items-center justify-center space-x-3 w-full mt-2">
                        <button onClick={playPrevious} disabled={activePlaylist.length === 0} className={playerControlBtn} aria-label="Faixa anterior">
                            <FiSkipBack className="h-5 w-5" />
                        </button>
                        <button
                            onClick={togglePlayPause}
                            disabled={currentTrackIndex === null}
                            className={`p-3 rounded-full text-xl ${styles.buttonActiveColor} hover:opacity-90 transition-opacity duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/30 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed`}
                            aria-label={isPlaying ? "Pausar" : "Reproduzir"}
                        >
                            {isPlaying ? <FiPause className="h-5 w-5" /> : <FiPlay className="h-5 w-5" />}
                        </button>
                        <button onClick={playNext} disabled={activePlaylist.length === 0} className={playerControlBtn} aria-label="Próxima faixa">
                            <FiSkipForward className="h-5 w-5" />
                        </button>
                    </div>
                    <SeekBar
                        currentTime={currentTime}
                        duration={duration}
                        onSeek={handleSeek}
                        disabled={currentTrackIndex === null || duration === 0}
                    />
                </div>
                <div
                    ref={volumeControlRef}
                    className="absolute top-3 right-3 z-30"
                >
                    <button
                        onClick={toggleVolumeSlider}
                        onDoubleClick={toggleMute}
                        title={isMuted ? "Ativar som (Duplo Clique)" : "Desativar som (Duplo Clique) / Ajustar"}
                        className={`p-1.5 rounded ${styles.buttonColor} hover:bg-white/15 transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-white/30`}
                        aria-label={isMuted ? "Ativar som" : "Desativar som ou ajustar volume"}
                    >
                        {isMuted ? <FiVolumeX className="h-4 w-4" /> : <FiVolume2 className="h-4 w-4" />}
                    </button>
                    {isVolumeSliderVisible && (
                        <div
                            className={`absolute right-full top-1/2 -translate-y-1/2 mr-2 p-2 rounded-lg shadow-lg ${styles.inputBgColor} z-40`}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <input
                                type="range" min="0" max="1" step="0.01"
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className={`w-20 h-1.5 appearance-none cursor-pointer bg-white/20 rounded-full accent-${accentColor}`}
                                aria-label="Controle de volume"
                            />
                        </div>
                    )}
                </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 pb-1 [mask-image:linear-gradient(to_bottom,black_95%,transparent_100%)]">
                {activePlaylist.length > 0 ? (
                    <ul className="space-y-1">
                        {activePlaylist.map((track, index) => (
                            <li
                                key={track.id}
                                onClick={() => playTrack(index)}
                                className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors duration-150 ${currentTrackIndex === index
                                        ? `bg-black/30 ${styles.textColor} shadow-sm`
                                        : `bg-black/10 hover:bg-black/20 ${styles.textColor} opacity-80 hover:opacity-100`
                                    }`}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && playTrack(index)}
                            >
                                <span className="text-sm truncate flex-grow mr-2" title={track.title}>
                                    {track.title}
                                </span>
                                {currentTrackIndex === index && isPlaying && (
                                    <FiVolume2 className="h-4 w-4 text-green-400 ml-auto flex-shrink-0 animate-pulse" aria-label="Reproduzindo" />
                                )}
                                {currentTrackIndex === index && !isPlaying && duration > 0 && (
                                    <FiPause className="h-4 w-4 text-yellow-400 ml-auto flex-shrink-0" aria-label="Pausado" />
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
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