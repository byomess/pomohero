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
import { formatTime } from '../utils/formatters';

// --- Constants for Timer Logic ---
const TIMER_UI_UPDATE_INTERVAL_MS = 500; // How often to update UI display (ms)

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
    clearHistory: () => void;
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
    const timerDeadlineRef = useRef<number | null>(null); // Stores Unix timestamp for timer end
    const nextPhaseTriggeredRef = useRef<boolean>(false); // Prevents double phase change triggers

    // --- Hooks ---
    const { playSound, debouncedPlayTypingSound } = useSounds(soundEnabled);

    // --- Derived State ---
    const isEffectRunning = focusStartEffectTimeouts.current.length > 0;

    // --- Effects ---
    // Effect to update initialDuration/timeLeft based on setting changes when PAUSED
    useEffect(() => {
        if (!isRunning && !isEffectRunning) {
            const durationSettingKeyMap: Record<Phase, keyof PomodoroSettings> = {
                'Work': 'workDuration', 'Short Break': 'shortBreakDuration', 'Long Break': 'longBreakDuration'
            };
            const relevantSettingKey = durationSettingKeyMap[currentPhase];
            const currentSettingDuration = settings[relevantSettingKey] as number;

            if (currentSettingDuration !== initialDuration) {
                if (timeLeft === initialDuration) { setTimeLeft(currentSettingDuration); }
                setInitialDuration(currentSettingDuration);
            }
        }
    }, [settings.workDuration, settings.shortBreakDuration, settings.longBreakDuration, currentPhase, isRunning, isEffectRunning, initialDuration, timeLeft]);


    // --- Clear Focus Start Effect ---
    const clearFocusStartEffect = useCallback(() => {
        focusStartEffectTimeouts.current.forEach(clearTimeout);
        focusStartEffectTimeouts.current = [];
        setActiveBgColorOverride(null);
    }, []);


    // --- History Management ---
    const saveFocusToHistory = useCallback(() => {
        if (currentSessionStartTime === null) {
             console.warn("Attempted to save history without a start time."); return;
        }
        const newEntry: HistoryEntry = {
            id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            startTime: currentSessionStartTime, endTime: Date.now(), duration: initialDuration,
            focusPoints: currentFocusPoints, feedbackNotes: '',
        };
        setHistory((prevHistory) => [newEntry, ...prevHistory].sort((a, b) => b.startTime - a.startTime));
    }, [currentFocusPoints, initialDuration, setHistory, currentSessionStartTime]);

    const updateLastHistoryFeedback = useCallback(() => {
        if (history.length > 0 && currentFeedbackNotes.trim() !== '') {
            setHistory((prevHistory) => {
                if (prevHistory.length === 0) return prevHistory;
                const lastEntry = prevHistory[0];
                if (lastEntry && lastEntry.feedbackNotes === '' && lastEntry.feedbackNotes !== currentFeedbackNotes) {
                    const updatedEntry = { ...lastEntry, feedbackNotes: currentFeedbackNotes };
                    return [updatedEntry, ...prevHistory.slice(1)];
                }
                return prevHistory;
            });
        }
    }, [currentFeedbackNotes, history, setHistory]);

    const updateHistoryEntry = useCallback((id: string, updatedData: HistoryUpdateData) => {
        setHistory(prevHistory => prevHistory.map(entry => entry.id === id ? { ...entry, ...updatedData } : entry).sort((a, b) => b.startTime - a.startTime));
        playSound('click');
    }, [setHistory, playSound]);

    const deleteHistoryEntry = useCallback((id: string) => {
        if (window.confirm("Tem certeza que deseja remover esta entrada do histórico?")) {
            setHistory(prevHistory => prevHistory.filter(entry => entry.id !== id));
            playSound('buttonPress');
        }
    }, [setHistory, playSound]);

    const addManualHistoryEntry = useCallback((entryData: ManualHistoryEntryData) => {
        const newEntry: HistoryEntry = { ...entryData, id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}` };
        setHistory(prevHistory => [newEntry, ...prevHistory].sort((a, b) => b.startTime - a.startTime));
        playSound('click');
    }, [setHistory, playSound]);


    // --- Phase Logic ---
    // Must be defined before useEffect that uses it. Ensure dependencies are complete.
    const handleNextPhase = useCallback((timerFinished: boolean) => {
        if (nextPhaseTriggeredRef.current) return; // Prevent double trigger
        nextPhaseTriggeredRef.current = true;

        clearFocusStartEffect();
        setIsRunning(false); // Stop timer state
        timerDeadlineRef.current = null; // Clear deadline

        if (timerFinished) { playSound('alarm'); }

        let nextPhase: Phase; let nextDuration: number; let nextCycleCount = cycleCount;

        if (currentPhase === 'Work') {
            saveFocusToHistory();
            setCurrentFocusPoints('');
            setCurrentSessionStartTime(null); // Reset start time after saving
            nextCycleCount++; setCycleCount(nextCycleCount);
            nextPhase = (nextCycleCount > 0 && nextCycleCount % cyclesBeforeLongBreak === 0) ? 'Long Break' : 'Short Break';
            nextDuration = nextPhase === 'Long Break' ? longBreakDuration : shortBreakDuration;
        } else { // Coming from a break
            if (currentFeedbackNotes.trim() !== '') { updateLastHistoryFeedback(); }
            setCurrentFeedbackNotes('');
            nextPhase = 'Work'; nextDuration = workDuration;
        }

        setCurrentPhase(nextPhase);
        setTimeLeft(nextDuration);
        setInitialDuration(nextDuration);

        // Reset trigger flag after state updates likely processed
        setTimeout(() => { nextPhaseTriggeredRef.current = false; }, 100);

    }, [ // Ensure ALL dependencies are listed
        currentPhase, cycleCount, saveFocusToHistory, workDuration, shortBreakDuration, longBreakDuration,
        cyclesBeforeLongBreak, playSound, clearFocusStartEffect, history, currentFeedbackNotes,
        updateLastHistoryFeedback, setHistory, setCurrentFocusPoints, setCurrentFeedbackNotes,
        setCycleCount, setCurrentPhase, setTimeLeft, setInitialDuration, setCurrentSessionStartTime, setIsRunning // Include setters
    ]);

    // --- Timer Interval Effect (Deadline-based) ---
    useEffect(() => {
        const tick = () => {
            if (!timerDeadlineRef.current || !isRunning) return; // Check isRunning state too

            const now = Date.now();
            const remainingMs = timerDeadlineRef.current - now;
            const newTimeLeft = Math.max(0, Math.round(remainingMs / 1000));

            // Update timeLeft state ONLY if it changed
            setTimeLeft(currentTime => (currentTime !== newTimeLeft ? newTimeLeft : currentTime));

            // Check if timer reached zero
            if (remainingMs <= 0 && !nextPhaseTriggeredRef.current) {
                 if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
                 handleNextPhase(true); // Timer finished naturally
             }
        };

        if (isRunning) {
            // Ensure deadline is set if somehow missing (e.g., after pause/resume)
             if (!timerDeadlineRef.current) {
                 console.warn("Timer running but deadline missing. Setting based on timeLeft.");
                 timerDeadlineRef.current = Date.now() + timeLeft * 1000;
             }
             // Clear any existing interval
            if (intervalRef.current) clearInterval(intervalRef.current);
            // Run tick immediately for instant UI update
            tick();
            // Set up new interval for periodic UI updates
            intervalRef.current = setInterval(tick, TIMER_UI_UPDATE_INTERVAL_MS);
            nextPhaseTriggeredRef.current = false; // Reset trigger flag when timer starts/resumes
        } else {
            // Clear interval if timer is stopped
            if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
            // Deadline is kept if paused, cleared if reset/skipped (in those functions)
        }

        // Cleanup
        return () => {
            if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
        };
        // handleNextPhase is stable; timeLeft included for initial deadline calculation if missing
    }, [isRunning, timeLeft, handleNextPhase]);


     // --- Visibility Change Effect ---
     useEffect(() => {
        const handleVisibilityChange = () => {
            // Check visibility, if timer should be running, and if a deadline exists
            if (document.visibilityState === 'visible' && isRunning && timerDeadlineRef.current) {
                 const now = Date.now();
                 const remainingMs = timerDeadlineRef.current - now;
                 const correctedTimeLeft = Math.max(0, Math.round(remainingMs / 1000));

                 // Correct the state immediately if needed
                 setTimeLeft(currentTime => {
                    if (currentTime !== correctedTimeLeft) {
                        console.log(`Timer corrected on visibility change from ${currentTime} to ${correctedTimeLeft}`);
                        return correctedTimeLeft;
                    }
                    return currentTime;
                  });

                 // Check if the timer should have finished while hidden
                 if (remainingMs <= 0 && !nextPhaseTriggeredRef.current) {
                     console.log("Timer finished while tab was hidden. Triggering next phase.");
                     if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
                     handleNextPhase(true);
                 }
             }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
        // handleNextPhase is stable due to useCallback
     }, [isRunning, handleNextPhase]);

     useEffect(() => {
        const baseTitle = "PomoHero";
        if (isRunning) {
            document.title = `${formatTime(timeLeft)} - ${baseTitle}`;
        } else {
            document.title = baseTitle;
        }

        return () => {
            document.title = baseTitle;
        };
    }, [isRunning, timeLeft]);


     // --- Control Handlers ---
    const startPauseTimer = useCallback(() => {
        playSound('buttonPress');
        const effectIsCurrentlyActive = focusStartEffectTimeouts.current.length > 0;

        if (!isRunning && !effectIsCurrentlyActive) { // ---> STARTING
            // Pre-start checks...
            if (currentPhase === 'Work' && currentFocusPoints.trim() === '') { alert('...'); return; }
            const requiresFeedback = (currentPhase === 'Short Break' || currentPhase === 'Long Break') && history.length > 0 && history[0]?.feedbackNotes === '';
            if (requiresFeedback && currentFeedbackNotes.trim() === '') { alert('...'); return; }
            else if (requiresFeedback && currentFeedbackNotes.trim() !== '') { updateLastHistoryFeedback(); }

            // Set initialDuration for display/saving, calculate and set the DEADLINE
            setInitialDuration(timeLeft);
            timerDeadlineRef.current = Date.now() + timeLeft * 1000;
            nextPhaseTriggeredRef.current = false;

            if (currentPhase === 'Work') {
                setCurrentSessionStartTime(Date.now()); // Capture start time NOW
                playSound('focusStart');
                setActiveBgColorOverride(null); clearFocusStartEffect();

                // Start Focus Effect (simplified logic)
                const flashColor = EFFECT_FLASH_COLOR_1; const pausedBaseColor = WORK_BG_PAUSED; const runningColor = WORK_BG_RUNNING;
                const effectTimeouts: NodeJS.Timeout[] = [];
                FOCUS_BEEP_TIMINGS.forEach((timing, index) => {
                    const isLastBeep = index === FOCUS_BEEP_TIMINGS.length - 1;
                    effectTimeouts.push(setTimeout(() => setActiveBgColorOverride(isLastBeep ? runningColor : flashColor), timing));
                    if (!isLastBeep) { effectTimeouts.push(setTimeout(() => setActiveBgColorOverride(pausedBaseColor), timing + FOCUS_START_EFFECT_BEEP_DURATION)); }
                });
                const runTimeout = setTimeout(() => {
                    if (focusStartEffectTimeouts.current.length > 0) { setIsRunning(true); focusStartEffectTimeouts.current = []; }
                    else { setActiveBgColorOverride(null); }
                }, FOCUS_START_EFFECT_DURATION);
                effectTimeouts.push(runTimeout);
                focusStartEffectTimeouts.current = effectTimeouts;

            } else { // Starting a break
                 setIsRunning(true); // Directly trigger timer effect
            }

        } else if (isRunning || effectIsCurrentlyActive) { // ---> PAUSING
            clearFocusStartEffect();
            setIsRunning(false); // Stops timer effect, keeps deadline
        }
    }, [ // Ensure all dependencies are listed
        isRunning, currentPhase, currentFocusPoints, currentFeedbackNotes, history, timeLeft,
        playSound, clearFocusStartEffect, updateLastHistoryFeedback, setInitialDuration,
        setCurrentSessionStartTime, setActiveBgColorOverride, setIsRunning, settings // Include settings if used by updateLastHistoryFeedback
    ]);

    const resetTimer = useCallback(() => {
        playSound('buttonPress');
        clearFocusStartEffect();
        setIsRunning(false);
        setCurrentSessionStartTime(null);
        timerDeadlineRef.current = null; // Clear deadline
        nextPhaseTriggeredRef.current = false;

        let duration: number;
        switch (currentPhase) {
            case 'Work': duration = workDuration; break;
            case 'Short Break': duration = shortBreakDuration; break;
            case 'Long Break': duration = longBreakDuration; break;
            default: duration = workDuration;
        }
        setTimeLeft(duration);
        setInitialDuration(duration);
        if (currentPhase === 'Work') { setCurrentFocusPoints(''); }
    }, [
        playSound, clearFocusStartEffect, currentPhase, workDuration, shortBreakDuration, longBreakDuration,
        setCurrentSessionStartTime, setIsRunning, setTimeLeft, setInitialDuration, setCurrentFocusPoints // Include setters
    ]);

    const skipPhase = useCallback(() => {
        playSound('buttonPress');
        clearFocusStartEffect();

        // Feedback check...
        if ((currentPhase === 'Short Break' || currentPhase === 'Long Break')) { /* ... */ }

        // Clear deadline before triggering next phase
        timerDeadlineRef.current = null;
        nextPhaseTriggeredRef.current = false;

        handleNextPhase(false);

    }, [ playSound, clearFocusStartEffect, currentPhase, handleNextPhase, history, currentFeedbackNotes ]);

    const clearHistory = useCallback(() => {
        playSound('buttonPress');
        if (window.confirm("Tem certeza que deseja limpar todo o histórico de foco?")) {
            setHistory([]); alert("Histórico limpo.");
        }
     }, [playSound, setHistory]);

    const openSettingsModal = useCallback(() => { playSound('click'); setIsSettingsOpen(true); }, [playSound, setIsSettingsOpen]);
    const closeSettingsModal = useCallback(() => { playSound('click'); setIsSettingsOpen(false); }, [playSound, setIsSettingsOpen]);

    const handleSettingChange = useCallback((settingKey: keyof PomodoroSettings, value: number | boolean) => {
         if (typeof value === 'boolean') { playSound('click'); }
         setSettings(prevSettings => {
             const newSettings = { ...prevSettings, [settingKey]: value };
             if (!isRunning && !isEffectRunning) {
                 const durationSettingKeyMap: Record<Phase, keyof PomodoroSettings> = { 'Work': 'workDuration', 'Short Break': 'shortBreakDuration', 'Long Break': 'longBreakDuration' };
                 const relevantSettingKey = durationSettingKeyMap[currentPhase];
                 if (settingKey === relevantSettingKey) {
                     const newPhaseDuration = newSettings[relevantSettingKey] as number;
                     if (timeLeft === initialDuration) { setTimeLeft(newPhaseDuration); }
                     setInitialDuration(newPhaseDuration);
                 }
             }
             return newSettings;
         });
     }, [playSound, setSettings, isRunning, isEffectRunning, currentPhase, initialDuration, timeLeft, setTimeLeft, setInitialDuration]);

    const adjustTimeLeft = useCallback((newSeconds: number) => {
        if (currentPhase === 'Work' && !isRunning && !isEffectRunning) {
            const validatedSeconds = Math.max(0, Math.min(newSeconds, 99 * 60 + 59));
            if (validatedSeconds !== timeLeft) {
                 setTimeLeft(validatedSeconds);
                 playSound('click');
                 // No deadline update needed here, it happens on resume
            }
        }
     }, [currentPhase, isRunning, isEffectRunning, playSound, timeLeft, setTimeLeft]);


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