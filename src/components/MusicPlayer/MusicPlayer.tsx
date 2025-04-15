import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import playlists from '../../data/playlists.json';
import { Track, MusicCategory } from '../../types';
import { usePomodoro } from '../../contexts/PomodoroContext';
import { FiPlay, FiPause, FiSkipBack, FiSkipForward, FiVolume2, FiVolumeX, FiShuffle } from 'react-icons/fi';
import { SeekBar } from './SeekBar';
import AudioMotionAnalyzer from 'audiomotion-analyzer';
import { FOCUS_TARGET_VOLUME, BREAK_TARGET_VOLUME, DEFAULT_MUSIC_VOLUME } from '../../utils/constants';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { WelcomeModal } from '../Modals/WelcomeModal';

const categories: { id: MusicCategory; name: string }[] = [
    { id: 'music', name: 'Músicas' },
    { id: 'ambient', name: 'Ambiente' },
    { id: 'noise', name: 'Ruídos' },
];

const shuffleArray = <T,>(array: T[]): T[] => {
    let currentIndex = array.length;
    let randomIndex;
    const newArray = [...array];
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [newArray[currentIndex], newArray[randomIndex]] = [
            newArray[randomIndex],
            newArray[currentIndex],
        ];
    }
    return newArray;
};

const getRandomIndexExcept = (
    exclude: number | null,
    playlistLength: number
): number => {
    if (playlistLength <= 1) return 0;
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * playlistLength);
    } while (newIndex === exclude);
    return newIndex;
};

export const MusicPlayer: React.FC = () => {
    const { styles, playSound, targetMusicVolume, isRunning: isPomodoroRunning, currentPhase } = usePomodoro();
    const [selectedCategory, setSelectedCategory] = useState<MusicCategory>('music');
    const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(DEFAULT_MUSIC_VOLUME);
    const [isMuted, setIsMuted] = useState(false);
    const [lastVolume, setLastVolume] = useState(0.7);
    const [isVolumeSliderVisible, setIsVolumeSliderVisible] = useState(false);
    const [isShuffleMode, setIsShuffleMode] = useState(false);
    const [displayedPlaylist, setDisplayedPlaylist] = useState<Track[]>([]);
    const [showedWelcomeModal, setShowedWelcomeModal] = useState(false);
    const [isNewUser, setIsNewUser] = useLocalStorage('isNewUser', true);

    const audioRef = useRef<HTMLAudioElement>(null);
    const volumeControlRef = useRef<HTMLDivElement>(null);
    const visualizerContainerRef = useRef<HTMLDivElement>(null);
    const audioMotionAnalyzerRef = useRef<AudioMotionAnalyzer | null>(null);
    const previousTrackRef = useRef<Track | null>(null);
    const wasPomodoroRunningRef = useRef<boolean>(isPomodoroRunning);

    const originalPlaylist = useMemo(
        () => (playlists as Record<MusicCategory, Track[]>)[selectedCategory] || [],
        [selectedCategory]
    );

    const getTrackById = useCallback(
        (id: string) => originalPlaylist.find((track) => track.id === id) || null,
        [originalPlaylist]
    );

    const getTrackIndexById = useCallback(
        (id: string) => originalPlaylist.findIndex((track) => track.id === id),
        [originalPlaylist]
    );

    const currentTrack: Track | null = useMemo(() => {
        if (currentTrackIndex !== null && displayedPlaylist[currentTrackIndex]) {
            return displayedPlaylist[currentTrackIndex];
        }
        return null;
    }, [currentTrackIndex, displayedPlaylist]);

    const onLoadedMetadata = useCallback(() => {
        if (audioRef.current) setDuration(audioRef.current.duration);
    }, []);

    const onTimeUpdate = useCallback(() => {
        if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
    }, []);

    const playTrack = useCallback(
        (index: number) => {
            if (index >= 0 && index < displayedPlaylist.length) {
                if (currentTrackIndex !== index || currentTrackIndex === null) {
                    playSound('buttonPress');
                }
                setCurrentTrackIndex(index);
                setIsPlaying(true);
            } else {
                setCurrentTrackIndex(null);
                setIsPlaying(false);
            }
        },
        [displayedPlaylist, playSound, currentTrackIndex]
    );

    const playNext = useCallback(() => {
        if (displayedPlaylist.length === 0) return;
        let nextIndex: number;
        if (isShuffleMode) {
            nextIndex = getRandomIndexExcept(currentTrackIndex, displayedPlaylist.length);
        } else {
            nextIndex =
                currentTrackIndex === null
                    ? 0
                    : (currentTrackIndex + 1) % displayedPlaylist.length;
        }
        playTrack(nextIndex);
    }, [currentTrackIndex, displayedPlaylist, isShuffleMode, playTrack]);

    const playPrevious = useCallback(() => {
        if (displayedPlaylist.length === 0) return;
        if (
            audioRef.current &&
            audioRef.current.currentTime > 3 &&
            currentTrackIndex !== null
        ) {
            playSound('buttonPress');
            audioRef.current.currentTime = 0;
            setCurrentTime(0);
            if (!isPlaying) setIsPlaying(true);
            return;
        }
        let prevIndex: number;
        if (isShuffleMode) {
            prevIndex = getRandomIndexExcept(currentTrackIndex, displayedPlaylist.length);
        } else {
            prevIndex =
                currentTrackIndex === null
                    ? displayedPlaylist.length - 1
                    : (currentTrackIndex - 1 + displayedPlaylist.length) %
                    displayedPlaylist.length;
        }
        playTrack(prevIndex);
    }, [
        currentTrackIndex,
        displayedPlaylist,
        isShuffleMode,
        playTrack,
        playSound,
        isPlaying,
    ]);

    const onEnded = useCallback(() => {
        playNext();
    }, [playNext]);

    const togglePlayPause = useCallback(() => {
        if (currentTrackIndex === null) {
            if (displayedPlaylist.length > 0) {
                playTrack(0);
            }
            return;
        }
        playSound('buttonPress');
        setIsPlaying((prev) => !prev);
    }, [currentTrackIndex, playSound, displayedPlaylist, playTrack]);

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
        if (newVolume > 0) setLastVolume(newVolume);
    };

    const toggleVolumeSlider = (event: React.MouseEvent) => {
        playSound('buttonPress');
        event.stopPropagation();
        setIsVolumeSliderVisible((prev) => !prev);
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

    const toggleShuffleMode = useCallback(() => {
        playSound('buttonPress');
        setIsShuffleMode((prev) => !prev);
    }, [playSound]);

    useEffect(() => {
        const playlistToDisplay = isShuffleMode
            ? shuffleArray(originalPlaylist)
            : originalPlaylist;
        setDisplayedPlaylist(playlistToDisplay);
        setCurrentTrackIndex(null);
        setIsPlaying(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
            setCurrentTime(0);
            setDuration(0);
            previousTrackRef.current = null;
        }
    }, [originalPlaylist, isShuffleMode]);

    useEffect(() => {
        if (audioRef.current && !showedWelcomeModal) {
            const introTrack = getTrackById('m-ploom-lab');
            const introTrackIndex = getTrackIndexById('m-ploom-lab');
            setCurrentTrackIndex(introTrackIndex);
            audioRef.current.volume = 0.2;
            if (isNewUser) {
                if (introTrack) {
                    audioRef.current.currentTime = 124;
                    setTimeout(() => {
                        setShowedWelcomeModal(true);
                        if (audioRef.current) {
                            audioRef.current.volume = 0.5;
                        }
                        localStorage.setItem('isNewUser', 'false');
                    }, 16500);
                }
            } else {
                audioRef.current.currentTime = 136;
                setTimeout(() => {
                    setShowedWelcomeModal(true);
                    if (audioRef.current) {
                        audioRef.current.volume = 0.5;
                    }
                }, 4800);
            }
            setIsPlaying(true);
        }
    }, [getTrackById, getTrackIndexById, isNewUser, playTrack, setIsNewUser, showedWelcomeModal]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);

    const adjustVolumeIfNeeded = useCallback(() => {
        if (!audioRef.current || !isPlaying || isMuted) return;

        const currentInternalVolume = volume;

        // Caso use targetMusicVolume pra decidir:
        if (
            targetMusicVolume === FOCUS_TARGET_VOLUME &&
            currentInternalVolume > FOCUS_TARGET_VOLUME
        ) {
            setLastVolume(currentInternalVolume);
            setVolume(FOCUS_TARGET_VOLUME);
        } else if (
            targetMusicVolume === BREAK_TARGET_VOLUME &&
            currentInternalVolume < BREAK_TARGET_VOLUME
        ) {
            setLastVolume(currentInternalVolume);
            setVolume(BREAK_TARGET_VOLUME);
        }
    }, [
        audioRef,
        isPlaying,
        volume,
        targetMusicVolume,
        isMuted,
    ]);

    useEffect(() => {
        const hasJustChangedRunningState = (isPomodoroRunning !== wasPomodoroRunningRef.current);

        // Se houve transição (começou a rodar ou parou de rodar), tenta ajustar volume
        if (hasJustChangedRunningState) {
            adjustVolumeIfNeeded();
        }

        // Atualiza a referência de "estado anterior"
        wasPomodoroRunningRef.current = isPomodoroRunning;
    }, [isPomodoroRunning, currentPhase, targetMusicVolume, isMuted, isPlaying, volume, adjustVolumeIfNeeded]);


    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        let playPromise: Promise<void> | undefined;

        if (currentTrack && audio.src !== currentTrack.src) {
            console.log('Effect: Loading new track source:', currentTrack.src);
            audio.src = currentTrack.src;
            audio.load();
            previousTrackRef.current = currentTrack;
            setCurrentTime(0);
            setDuration(0);
        } else if (!currentTrack && audio.src) {
            console.log('Effect: No track selected, resetting audio.');
            audio.pause();
            audio.src = '';
            previousTrackRef.current = null;
            setCurrentTime(0);
            setDuration(0);
            setIsPlaying(false);
        }

        if (currentTrack) {
            if (isPlaying) {
                if (audio.paused) {
                    console.log('Effect: State is Play=true, Audio is paused. Playing track:', currentTrack.title);
                    playPromise = audio.play();
                    playPromise?.catch((error) => {
                        if (error.name !== 'AbortError') {
                            console.error('Error attempting to play audio:', error);
                            setIsPlaying(false);
                        }
                    });
                }
            } else {
                if (!audio.paused) {
                    console.log('Effect: State is Play=false, Audio is playing. Pausing track:', currentTrack.title);
                    audio.pause();
                }
            }
        }
    }, [currentTrack, isPlaying]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                isVolumeSliderVisible &&
                volumeControlRef.current &&
                !volumeControlRef.current.contains(event.target as Node)
            ) {
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
                analyzer = new AudioMotionAnalyzer(visualizerContainerRef.current, {
                    source: audioRef.current,
                    mode: 10,
                    lineWidth: 1.5,
                    fillAlpha: 0.6,
                    smoothing: 0.5,
                    gradient: 'prism',
                    lumiBars: false,
                    reflexAlpha: 0.5,
                    reflexBright: 0.5,
                    showScaleY: false,
                    showScaleX: false,
                    roundBars: true,
                    overlay: true,
                    bgAlpha: 0,
                });
                audioMotionAnalyzerRef.current = analyzer;
            } catch (error) {
                console.error('Failed to initialize AudioMotionAnalyzer:', error);
            }
        }
        return () => {
            if (audioMotionAnalyzerRef.current) {
                try {
                    // pass
                } catch (e) {
                    console.error(e);
                }
            }
            audioMotionAnalyzerRef.current = null;
        };
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (audioMotionAnalyzerRef.current) {
                // pass
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleCategorySelect = (category: MusicCategory) => {
        if (category === selectedCategory) return;
        setSelectedCategory(category);
        setIsShuffleMode(false);
        playSound('buttonPress');
        setIsVolumeSliderVisible(false);
    };

    const categoryTabBase =
        'px-4 py-2 rounded-t-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/30';
    const categoryTabInactive = `bg-black/10 hover:bg-black/20 opacity-70 hover:opacity-100 ${styles.textColor}`;
    const categoryTabActive = `bg-black/30 shadow-inner ${styles.textColor} ${styles.modalAccentColor}`;
    const playerControlBtn = `p-2.5 rounded-full ${styles.buttonColor} hover:bg-white/20 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/30 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed`;
    const shuffleBtnStyle = `${playerControlBtn} ${isShuffleMode
        ? 'text-green-400 bg-white/15 ring-green-500/50 ring-1'
        : 'opacity-60 hover:opacity-100'
        }`;
    const accentColor = useMemo(() => {
        const match = styles.modalAccentColor.match(/ring-([a-z]+(?:-\d+)?)/);
        return match ? match[1] : 'gray-500';
    }, [styles.modalAccentColor]);

    return (
        <>
            <WelcomeModal isNewUser={isNewUser} />
            <div
                className={`w-full max-w-md mx-auto h-full p-4 sm:p-6 rounded-3xl shadow-xl backdrop-blur-xs bg-black/35 ${styles.textColor} flex flex-col overflow-hidden`}
            >
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
                            className={`${categoryTabBase} ${selectedCategory === cat.id ? categoryTabActive : categoryTabInactive
                                }`}
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
                                <p className="text-xs opacity-80 truncate w-60 sm:w-72">
                                    {currentTrack.artist}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center justify-center space-x-3 w-full mt-2">
                            <button
                                onClick={toggleShuffleMode}
                                className={shuffleBtnStyle}
                                aria-label="Ordem aleatória"
                                title={
                                    isShuffleMode
                                        ? 'Desativar ordem aleatória'
                                        : 'Ativar ordem aleatória'
                                }
                            >
                                <FiShuffle className="h-5 w-5" />
                            </button>
                            <button
                                onClick={playPrevious}
                                disabled={displayedPlaylist.length === 0}
                                className={playerControlBtn}
                                aria-label="Faixa anterior"
                            >
                                <FiSkipBack className="h-5 w-5" />
                            </button>
                            <button
                                onClick={togglePlayPause}
                                disabled={currentTrackIndex === null && displayedPlaylist.length === 0}
                                className={`p-3 rounded-full text-xl ${styles.buttonActiveColor} hover:opacity-90 transition-opacity duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/30 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed`}
                                aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
                            >
                                {isPlaying ? (
                                    <FiPause className="h-5 w-5" />
                                ) : (
                                    <FiPlay className="h-5 w-5" />
                                )}
                            </button>
                            <button
                                onClick={playNext}
                                disabled={displayedPlaylist.length === 0}
                                className={playerControlBtn}
                                aria-label="Próxima faixa"
                            >
                                <FiSkipForward className="h-5 w-5" />
                            </button>
                            <div className="w-[42px] h-[42px] opacity-0 pointer-events-none"></div>
                        </div>
                        <SeekBar
                            currentTime={currentTime}
                            duration={duration}
                            onSeek={handleSeek}
                            disabled={currentTrackIndex === null || duration === 0}
                        />
                    </div>
                    <div ref={volumeControlRef} className="absolute top-3 right-3 z-30">
                        <button
                            onClick={toggleVolumeSlider}
                            onDoubleClick={toggleMute}
                            title={
                                isMuted
                                    ? 'Ativar som (Duplo Clique)'
                                    : 'Desativar som (Duplo Clique) / Ajustar'
                            }
                            className={`p-1.5 rounded ${styles.buttonColor} hover:bg-white/15 transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-white/30`}
                            aria-label={
                                isMuted
                                    ? 'Ativar som'
                                    : 'Desativar som ou ajustar volume'
                            }
                        >
                            {isMuted ? (
                                <FiVolumeX className="h-4 w-4" />
                            ) : (
                                <FiVolume2 className="h-4 w-4" />
                            )}
                        </button>
                        {isVolumeSliderVisible && (
                            <div
                                className={`absolute right-full top-1/2 -translate-y-1/2 mr-2 p-2 rounded-lg shadow-lg ${styles.inputBgColor} z-40`}
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
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
                    {displayedPlaylist.length > 0 ? (
                        <ul className="space-y-1">
                            {displayedPlaylist.map((track, index) => (
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
                                    <span
                                        className="text-sm truncate flex-grow mr-2"
                                        title={track.title}
                                    >
                                        {track.title}
                                    </span>
                                    {currentTrackIndex === index && isPlaying && (
                                        <FiVolume2
                                            className="h-4 w-4 text-green-400 ml-auto flex-shrink-0 animate-pulse"
                                            aria-label="Reproduzindo"
                                        />
                                    )}
                                    {currentTrackIndex === index && !isPlaying && duration > 0 && (
                                        <FiPause
                                            className="h-4 w-4 text-yellow-400 ml-auto flex-shrink-0"
                                            aria-label="Pausado"
                                        />
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center opacity-60 px-4">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-12 h-12 mb-3 opacity-30"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z"
                                />
                            </svg>
                            <p className="text-sm font-medium">Playlist Vazia</p>
                            <p className="text-xs mt-1">Nenhuma faixa encontrada nesta categoria.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
