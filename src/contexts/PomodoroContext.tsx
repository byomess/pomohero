// src/contexts/PomodoroContext.tsx
import React, {
    createContext,
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
    useContext,
    ReactNode,
} from 'react';
import { HistoryEntry, Phase, PomodoroSettings, DynamicStyles, HistoryUpdateData, ManualHistoryEntryData } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useSounds, SoundName } from '../hooks/useSounds';
import {
    DEFAULT_WORK_DURATION,
    DEFAULT_SHORT_BREAK_DURATION,
    DEFAULT_LONG_BREAK_DURATION,
    DEFAULT_CYCLES_BEFORE_LONG_BREAK,
    DEFAULT_SOUND_ENABLED,
    HISTORY_STORAGE_KEY,
    SETTINGS_STORAGE_KEY,
    WORK_BG_PAUSED,
    WORK_BG_RUNNING,
    SHORT_BREAK_BG_PAUSED,
    SHORT_BREAK_BG_RUNNING,
    LONG_BREAK_BG_PAUSED,
    LONG_BREAK_BG_RUNNING,
    EFFECT_FLASH_COLOR_1,
    FOCUS_START_EFFECT_DURATION,
    FOCUS_BEEP_TIMINGS,
    FOCUS_START_EFFECT_BEEP_DURATION,
} from '../utils/constants';

// --- Context Interface ---
interface PomodoroContextType {
    // State
    settings: PomodoroSettings;
    currentPhase: Phase;
    timeLeft: number;
    isRunning: boolean;
    cycleCount: number;
    initialDuration: number;
    currentFocusPoints: string;
    currentFeedbackNotes: string;
    history: HistoryEntry[];
    isSettingsOpen: boolean;
    isEffectRunning: boolean;
    styles: DynamicStyles;

    // Setters & Actions
    setSettings: React.Dispatch<React.SetStateAction<PomodoroSettings>>;
    handleSettingChange: (key: keyof PomodoroSettings, value: number | boolean) => void;
    setCurrentFocusPoints: React.Dispatch<React.SetStateAction<string>>;
    setCurrentFeedbackNotes: React.Dispatch<React.SetStateAction<string>>;
    startPauseTimer: () => void;
    resetTimer: () => void;
    skipPhase: () => void;
    clearHistory: () => void; // Clears ALL history
    openSettingsModal: () => void;
    closeSettingsModal: () => void;
    playSound: (soundName: SoundName) => void;
    debouncedPlayTypingSound: () => void;
    updateLastHistoryFeedback: () => void;
    adjustTimeLeft: (newSeconds: number) => void;
    updateHistoryEntry: (id: string, updatedData: HistoryUpdateData) => void;
    deleteHistoryEntry: (id: string) => void;
    addManualHistoryEntry: (entryData: ManualHistoryEntryData) => void;
}

// --- Create Context ---
const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

// --- Default Values ---
const defaultSettings: PomodoroSettings = {
    workDuration: DEFAULT_WORK_DURATION,
    shortBreakDuration: DEFAULT_SHORT_BREAK_DURATION,
    longBreakDuration: DEFAULT_LONG_BREAK_DURATION,
    cyclesBeforeLongBreak: DEFAULT_CYCLES_BEFORE_LONG_BREAK,
    soundEnabled: DEFAULT_SOUND_ENABLED,
};

// --- Provider Component ---
interface PomodoroProviderProps {
    children: ReactNode;
}

export const PomodoroProvider: React.FC<PomodoroProviderProps> = ({ children }) => {
    // --- State ---
    const [settings, setSettings] = useLocalStorage<PomodoroSettings>(SETTINGS_STORAGE_KEY, defaultSettings);
    const { workDuration, shortBreakDuration, longBreakDuration, cyclesBeforeLongBreak, soundEnabled } = settings;
    const [history, setHistory] = useLocalStorage<HistoryEntry[]>(HISTORY_STORAGE_KEY, []);
    const [currentPhase, setCurrentPhase] = useState<Phase>('Work');
    const [timeLeft, setTimeLeft] = useState<number>(settings.workDuration);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [cycleCount, setCycleCount] = useState<number>(0);
    const [initialDuration, setInitialDuration] = useState<number>(settings.workDuration);
    const [currentFocusPoints, setCurrentFocusPoints] = useState<string>('');
    const [currentFeedbackNotes, setCurrentFeedbackNotes] = useState<string>('');
    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
    const [activeBgColorOverride, setActiveBgColorOverride] = useState<string | null>(null);
    const [currentSessionStartTime, setCurrentSessionStartTime] = useState<number | null>(null);

    // --- Refs ---
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const focusStartEffectTimeouts = useRef<NodeJS.Timeout[]>([]);

    // --- Hooks ---
    const { playSound, debouncedPlayTypingSound } = useSounds(soundEnabled);

    // --- Derived State ---
    const isEffectRunning = focusStartEffectTimeouts.current.length > 0;

    // --- Effects ---
    // Effect to update initialDuration/timeLeft based on setting changes when PAUSED
    useEffect(() => {
        if (!isRunning && !isEffectRunning) {
            const durationSettingKeyMap: Record<Phase, keyof PomodoroSettings> = {
                'Work': 'workDuration',
                'Short Break': 'shortBreakDuration',
                'Long Break': 'longBreakDuration'
            };
            const relevantSettingKey = durationSettingKeyMap[currentPhase];
            const currentSettingDuration = settings[relevantSettingKey] as number;

            if (currentSettingDuration !== initialDuration) {
                if (timeLeft === initialDuration) {
                    setTimeLeft(currentSettingDuration);
                }
                setInitialDuration(currentSettingDuration);
            }
        }
    }, [settings.workDuration, settings.shortBreakDuration, settings.longBreakDuration, currentPhase, isRunning, isEffectRunning, initialDuration, timeLeft]);

    // --- Timer Interval Effect ---
    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;
        if (isRunning) {
            intervalId = setInterval(() => {
                setTimeLeft((prevTime) => {
                    if (prevTime <= 1) {
                        if (intervalRef.current) clearInterval(intervalRef.current); // Ensure clear before next phase
                        intervalRef.current = null;
                        handleNextPhase(true); // Timer finished naturally
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);
            intervalRef.current = intervalId; // Store ref
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }
        // Cleanup function
        return () => {
            if (intervalRef.current) { // Check ref directly in cleanup
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
        // handleNextPhase MUST be memoized correctly for this dependency array to be stable
    }, [isRunning, /* handleNextPhase - see below where it's defined */ ]);


    // --- Clear Focus Start Effect ---
    const clearFocusStartEffect = useCallback(() => {
        focusStartEffectTimeouts.current.forEach(clearTimeout);
        focusStartEffectTimeouts.current = [];
        setActiveBgColorOverride(null);
    }, []);

    // --- History Management ---
    const saveFocusToHistory = useCallback(() => {
        // Ensure start time was captured
        if (currentSessionStartTime === null) {
             console.warn("Attempted to save history without a start time (should not happen).");
             return; // Prevent saving invalid entry
        }

        const newEntry: HistoryEntry = {
            id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // More unique ID
            startTime: currentSessionStartTime, // Use captured start time
            endTime: Date.now(),
            duration: initialDuration, // Duration the phase *started* with
            focusPoints: currentFocusPoints,
            feedbackNotes: '', // Added during break
        };
        // Add entry and sort the history by start time descending
        setHistory((prevHistory) =>
            [newEntry, ...prevHistory].sort((a, b) => b.startTime - a.startTime)
        );
        // Start time is reset in handleNextPhase after saving is complete

    }, [currentFocusPoints, initialDuration, setHistory, currentSessionStartTime]);

    const updateLastHistoryFeedback = useCallback(() => {
        if (history.length > 0 && currentFeedbackNotes.trim() !== '') {
            setHistory((prevHistory) => {
                if (prevHistory.length === 0) return prevHistory;
                const lastEntry = prevHistory[0];
                // Update only if feedback hasn't been set previously for this entry
                if (lastEntry && lastEntry.feedbackNotes === '' && lastEntry.feedbackNotes !== currentFeedbackNotes) {
                    const updatedEntry = { ...lastEntry, feedbackNotes: currentFeedbackNotes };
                    // Create a new array with the updated entry at the beginning
                    return [updatedEntry, ...prevHistory.slice(1)];
                }
                return prevHistory; // No change needed
            });
        }
    }, [currentFeedbackNotes, history, setHistory]);

    const updateHistoryEntry = useCallback((id: string, updatedData: HistoryUpdateData) => {
        setHistory(prevHistory =>
            prevHistory
                .map(entry =>
                    entry.id === id
                        ? { ...entry, ...updatedData } // Merge updates
                        : entry
                )
                .sort((a, b) => b.startTime - a.startTime) // Re-sort if times were edited
        );
        playSound('click'); // Feedback for update
    }, [setHistory, playSound]);

    const deleteHistoryEntry = useCallback((id: string) => {
        if (window.confirm("Tem certeza que deseja remover esta entrada do histórico?")) {
            setHistory(prevHistory => prevHistory.filter(entry => entry.id !== id));
            playSound('buttonPress'); // Feedback for delete
        }
    }, [setHistory, playSound]);

    const addManualHistoryEntry = useCallback((entryData: ManualHistoryEntryData) => {
        const newEntry: HistoryEntry = {
            ...entryData,
            id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // Generate unique ID
        };
        setHistory(prevHistory =>
            [newEntry, ...prevHistory].sort((a, b) => b.startTime - a.startTime) // Add and sort
        );
        playSound('click'); // Or a different sound like 'focusStart'? 'click' is safer.
    }, [setHistory, playSound]);


    // --- Phase Logic ---
    // IMPORTANT: Define handleNextPhase *before* the timer effect that depends on it.
    // Also, ensure all its dependencies are correctly listed for useCallback.
    const handleNextPhase = useCallback((timerFinished: boolean) => {
        clearFocusStartEffect(); // Ensure any running effect is stopped
        setIsRunning(false); // Stop the timer (also triggers interval cleanup)
        if (timerFinished) {
            playSound('alarm');
        }

        let nextPhase: Phase;
        let nextDuration: number;
        let nextCycleCount = cycleCount;

        if (currentPhase === 'Work') {
            saveFocusToHistory(); // Attempt to save the completed session
            setCurrentFocusPoints('');
            setCurrentSessionStartTime(null); // <<< Reset start time tracker HERE, after saving attempt
            nextCycleCount++;
            setCycleCount(nextCycleCount); // Update cycle count state

            if (nextCycleCount > 0 && nextCycleCount % cyclesBeforeLongBreak === 0) {
                nextPhase = 'Long Break';
                nextDuration = longBreakDuration;
            } else {
                nextPhase = 'Short Break';
                nextDuration = shortBreakDuration;
            }
        } else { // Coming from a break
             // Save feedback if entered but timer skipped/finished
             if (currentFeedbackNotes.trim() !== '') {
                const lastHistoryEntry = history[0];
                if (lastHistoryEntry && lastHistoryEntry.feedbackNotes === '') {
                    updateLastHistoryFeedback();
                }
            }
            setCurrentFeedbackNotes(''); // Clear feedback notes for next break
            nextPhase = 'Work';
            nextDuration = workDuration; // Use the SETTING for the next work duration
        }

        setCurrentPhase(nextPhase);
        setTimeLeft(nextDuration); // Start next phase with its configured duration
        setInitialDuration(nextDuration); // Set initial duration for the new phase

    }, [
        currentPhase, cycleCount, saveFocusToHistory, // saveFocusToHistory is now stable
        workDuration, shortBreakDuration, longBreakDuration, cyclesBeforeLongBreak, // Settings
        playSound, clearFocusStartEffect, history, currentFeedbackNotes, updateLastHistoryFeedback // Other dependencies
        // currentSessionStartTime is NOT needed here, as it's reset *within* this function after saveFocusToHistory uses it.
    ]);


     // --- Control Handlers ---
    const startPauseTimer = useCallback(() => {
        playSound('buttonPress');
        const effectIsCurrentlyActive = focusStartEffectTimeouts.current.length > 0;

        if (!isRunning && !effectIsCurrentlyActive) {
            // Pre-start checks
            if (currentPhase === 'Work' && currentFocusPoints.trim() === '') {
                alert('Por favor, defina seus pontos de foco antes de iniciar.'); return;
            }
            const requiresFeedback = (currentPhase === 'Short Break' || currentPhase === 'Long Break') && history.length > 0 && history[0]?.feedbackNotes === '';
            if (requiresFeedback && currentFeedbackNotes.trim() === '') {
                alert('Por favor, adicione seu feedback da sessão de foco anterior antes de iniciar a pausa.'); return;
            }
            else if (requiresFeedback && currentFeedbackNotes.trim() !== '') {
                 updateLastHistoryFeedback(); // Save entered feedback before starting break
            }

            // Set initialDuration based on current timeLeft *before* starting
            setInitialDuration(timeLeft);

            // Start logic
            if (currentPhase === 'Work') {
                // Capture start time IMMEDIATELY on user action
                setCurrentSessionStartTime(Date.now());

                playSound('focusStart');
                setActiveBgColorOverride(null); // Ensure clean slate
                clearFocusStartEffect(); // Clear any previous effect timeouts

                // Effect Timeout Logic (simplified)
                const flashColor = EFFECT_FLASH_COLOR_1;
                const pausedBaseColor = WORK_BG_PAUSED;
                const runningColor = WORK_BG_RUNNING;
                const effectTimeouts: NodeJS.Timeout[] = [];

                FOCUS_BEEP_TIMINGS.forEach((timing, index) => {
                    const isLastBeep = index === FOCUS_BEEP_TIMINGS.length - 1;
                     effectTimeouts.push(setTimeout(() => {
                         setActiveBgColorOverride(isLastBeep ? runningColor : flashColor);
                     }, timing));
                     if(!isLastBeep) {
                         effectTimeouts.push(setTimeout(() => {
                             setActiveBgColorOverride(pausedBaseColor);
                         }, timing + FOCUS_START_EFFECT_BEEP_DURATION));
                     }
                });

                const runTimeout = setTimeout(() => {
                    if (focusStartEffectTimeouts.current.length > 0) { // Check if not cancelled
                        setIsRunning(true);
                        focusStartEffectTimeouts.current = [];
                    } else {
                         setActiveBgColorOverride(null); // Reset if cancelled
                    }
                }, FOCUS_START_EFFECT_DURATION);

                 effectTimeouts.push(runTimeout);
                 focusStartEffectTimeouts.current = effectTimeouts;

            } else { // Starting a break (Short or Long)
                 setIsRunning(true); // No effect, just start
            }

        } else if (isRunning || effectIsCurrentlyActive) { // Pause logic
            clearFocusStartEffect(); // Stop effect if it's running
            setIsRunning(false);
            // Do NOT reset currentSessionStartTime on pause
        }
    }, [ // Ensure all dependencies used within are listed
        isRunning, currentPhase, currentFocusPoints, currentFeedbackNotes, history,
        playSound, clearFocusStartEffect, updateLastHistoryFeedback, timeLeft, initialDuration, // Added initialDuration although indirectly used via setInitialDuration
        cyclesBeforeLongBreak, longBreakDuration, shortBreakDuration, workDuration // Needed potentially by updateLastHistoryFeedback indirectly? safer to include
    ]);

    const resetTimer = useCallback(() => {
        playSound('buttonPress');
        clearFocusStartEffect();
        setIsRunning(false); // This stops the interval via useEffect
        setCurrentSessionStartTime(null); // <<< Reset start time tracker on reset

        let duration: number;
        // Reset to the *setting* duration for the current phase
        switch (currentPhase) {
            case 'Work': duration = workDuration; break;
            case 'Short Break': duration = shortBreakDuration; break;
            case 'Long Break': duration = longBreakDuration; break;
            default: duration = workDuration; // Fallback
        }
        setTimeLeft(duration);
        setInitialDuration(duration); // Also reset initial duration to the setting value

        if (currentPhase === 'Work') {
            setCurrentFocusPoints(''); // Clear focus points on work reset
        }
        // Feedback notes are cleared when the *next* work phase starts (in handleNextPhase)
    }, [
        playSound, clearFocusStartEffect, currentPhase, workDuration,
        shortBreakDuration, longBreakDuration, // Use settings for reset
        setCurrentFocusPoints, setTimeLeft, setInitialDuration, setIsRunning // Include setters used
    ]);

    const skipPhase = useCallback(() => {
        playSound('buttonPress');
        clearFocusStartEffect(); // Clear effect if running

        // Check if feedback is required before skipping a break
        if ((currentPhase === 'Short Break' || currentPhase === 'Long Break')) {
            const requiresFeedback = history.length > 0 && history[0]?.feedbackNotes === '';
             if (requiresFeedback && currentFeedbackNotes.trim() === '') {
                alert('Por favor, adicione seu feedback da sessão de foco anterior antes de pular a pausa.');
                return; // Don't skip if feedback is missing
            }
            // Note: handleNextPhase will save feedback if entered & required when skipping
        }

        // If skipping Work phase, handleNextPhase will attempt to save using the startTime
        // (which was set immediately) and then reset it.
        handleNextPhase(false); // Indicate timer didn't finish naturally

    }, [
        playSound, clearFocusStartEffect, currentPhase, handleNextPhase, // handleNextPhase is stable
        history, currentFeedbackNotes // Other dependencies
    ]);

    const clearHistory = useCallback(() => {
        playSound('buttonPress');
        if (window.confirm("Tem certeza que deseja limpar todo o histórico de foco? Esta ação não pode ser desfeita.")) {
            setHistory([]);
            alert("Histórico limpo.");
        }
     }, [playSound, setHistory]);

    const openSettingsModal = useCallback(() => { playSound('click'); setIsSettingsOpen(true); }, [playSound, setIsSettingsOpen]);
    const closeSettingsModal = useCallback(() => { playSound('click'); setIsSettingsOpen(false); }, [playSound, setIsSettingsOpen]);

    const handleSettingChange = useCallback((settingKey: keyof PomodoroSettings, value: number | boolean) => {
         if (typeof value === 'boolean') { playSound('click'); } // Sound for checkbox toggle

         setSettings(prevSettings => {
             const newSettings = { ...prevSettings, [settingKey]: value };

             // Adjust timer ONLY if NOT running and NOT during focus effect
             if (!isRunning && !isEffectRunning) {
                 const durationSettingKeyMap: Record<Phase, keyof PomodoroSettings> = {
                     'Work': 'workDuration',
                     'Short Break': 'shortBreakDuration',
                     'Long Break': 'longBreakDuration'
                 };
                 const relevantSettingKey = durationSettingKeyMap[currentPhase];

                 if (settingKey === relevantSettingKey) {
                     const newPhaseDuration = newSettings[relevantSettingKey] as number;
                     if (timeLeft === initialDuration) {
                         setTimeLeft(newPhaseDuration);
                     }
                     setInitialDuration(newPhaseDuration);
                 }
             }
             return newSettings;
         });
     }, [playSound, setSettings, isRunning, isEffectRunning, currentPhase, initialDuration, timeLeft, setTimeLeft, setInitialDuration]); // Include setters

    const adjustTimeLeft = useCallback((newSeconds: number) => {
        // Only allow adjustment during Work phase, when paused, and not during effect
        if (currentPhase === 'Work' && !isRunning && !isEffectRunning) {
            const validatedSeconds = Math.max(0, Math.min(newSeconds, 99 * 60 + 59));
            if (validatedSeconds !== timeLeft) {
                 setTimeLeft(validatedSeconds);
                 playSound('click');
            }
        }
     }, [currentPhase, isRunning, isEffectRunning, playSound, timeLeft, setTimeLeft]); // Include setters


    // --- Dynamic Styling Calculation ---
    const styles = useMemo((): DynamicStyles => {
        let baseBg: string;
        let txt = 'text-gray-200', prog = 'bg-red-500', btn = 'bg-white/10 hover:bg-white/20 text-gray-200', btnAct = 'bg-white/25 text-white', inputBg = 'bg-black/30 placeholder-gray-500 focus:ring-red-500', histBorder = 'border-red-600/50', phase = "Foco", modalAcc = 'ring-red-500';

        if (currentPhase === 'Work') {
            baseBg = isRunning ? WORK_BG_RUNNING : WORK_BG_PAUSED;
            txt = 'text-slate-100'; prog = 'bg-slate-400'; btn = 'bg-white/10 hover:bg-white/20 text-slate-100'; btnAct = 'bg-white/25 text-white'; inputBg = 'bg-black/30 placeholder-slate-400/70 focus:ring-slate-400'; phase = "Foco"; modalAcc = 'ring-slate-500';
            histBorder = isRunning ? 'border-purple-600/50' : 'border-slate-600/50';
        } else if (currentPhase === 'Short Break') {
            baseBg = isRunning ? SHORT_BREAK_BG_RUNNING : SHORT_BREAK_BG_PAUSED;
            txt = 'text-cyan-100'; prog = 'bg-cyan-500'; btn = 'bg-white/10 hover:bg-white/20 text-cyan-100'; btnAct = 'bg-white/25 text-white'; inputBg = 'bg-black/30 placeholder-cyan-600/70 focus:ring-cyan-500'; histBorder = 'border-cyan-600/50'; phase = "Pausa Curta"; modalAcc = 'ring-cyan-500';
        } else { // Long Break
            baseBg = isRunning ? LONG_BREAK_BG_RUNNING : LONG_BREAK_BG_PAUSED;
            txt = 'text-teal-100'; prog = 'bg-teal-500'; btn = 'bg-white/10 hover:bg-white/20 text-teal-100'; btnAct = 'bg-white/25 text-white'; inputBg = 'bg-black/30 placeholder-teal-600/70 focus:ring-teal-500'; histBorder = 'border-teal-600/50'; phase = "Pausa Longa"; modalAcc = 'ring-teal-500';
        }

        let finalBg = baseBg;
        let finalHistBorder = histBorder;

        if (activeBgColorOverride) {
            finalBg = activeBgColorOverride;
             if (currentPhase === 'Work') {
                if (activeBgColorOverride === EFFECT_FLASH_COLOR_1) finalHistBorder = 'border-purple-700/50';
                else if (activeBgColorOverride === WORK_BG_PAUSED) finalHistBorder = 'border-slate-600/50';
                else if (activeBgColorOverride === WORK_BG_RUNNING) finalHistBorder = 'border-purple-600/50';
             }
        }

        return {
            baseBgColor: baseBg, finalHistoryBorderColor: finalHistBorder, textColor: txt, progressColor: prog, buttonColor: btn,
            buttonActiveColor: btnAct, inputBgColor: inputBg, phaseText: phase, modalAccentColor: modalAcc, finalBgColor: finalBg,
        };
    }, [currentPhase, isRunning, activeBgColorOverride]);


    // --- Context Value ---
    const contextValue: PomodoroContextType = {
        settings, currentPhase, timeLeft, isRunning, cycleCount, initialDuration, currentFocusPoints,
        currentFeedbackNotes, history, isSettingsOpen, isEffectRunning, styles,
        setSettings, handleSettingChange, setCurrentFocusPoints, setCurrentFeedbackNotes, startPauseTimer,
        resetTimer, skipPhase, clearHistory, openSettingsModal, closeSettingsModal, playSound,
        debouncedPlayTypingSound, updateLastHistoryFeedback, adjustTimeLeft, updateHistoryEntry, deleteHistoryEntry, addManualHistoryEntry,
    };

    return (
        <PomodoroContext.Provider value={contextValue}>
            {children}
        </PomodoroContext.Provider>
    );
};

// --- Custom Hook for Consuming Context ---
export const usePomodoro = (): PomodoroContextType => {
    const context = useContext(PomodoroContext);
    if (!context) {
        throw new Error('usePomodoro must be used within a PomodoroProvider');
    }
    return context;
};