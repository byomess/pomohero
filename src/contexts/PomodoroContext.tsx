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
// Make sure the path to useSounds is correct based on your project structure
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
// Make sure the path to formatters is correct
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
    playSound: (soundName: SoundName) => void; // Keep regular playSound
    playAlarmLoop: () => void; // Function to start alarm loop
    stopAlarmLoop: () => void; // Function to stop alarm loop
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
    // Get sound functions including loop handlers
    const { playSound, debouncedPlayTypingSound, playAlarmLoop, stopAlarmLoop } = useSounds(soundEnabled);

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
    // Defined before useEffect that uses it. Ensure all dependencies are listed.
    const handleNextPhase = useCallback((timerFinished: boolean) => {
        if (nextPhaseTriggeredRef.current) {
            console.log("handleNextPhase blocked, already triggered.");
            return;
        }
        console.log(`handleNextPhase called. timerFinished: ${timerFinished}`);
        nextPhaseTriggeredRef.current = true;

        clearFocusStartEffect();
        setIsRunning(false); // Stop timer state FIRST
        timerDeadlineRef.current = null; // Clear deadline

        // Stop any currently looping alarm immediately when phase changes
        stopAlarmLoop();

        if (timerFinished) {
            // Check visibility *after* stopping any previous loop
            if (document.hidden) {
                console.log("Timer finished while hidden, starting alarm loop.");
                playAlarmLoop(); // Start looping if tab is hidden
            } else {
                console.log("Timer finished while visible, playing alarm once.");
                playSound('alarm'); // Play once if tab is visible
            }
        }
        // Determine next phase logic...
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

        // Update state for the new phase
        setCurrentPhase(nextPhase);
        setTimeLeft(nextDuration);
        setInitialDuration(nextDuration);

        // Reset trigger flag after a short delay to allow state updates
        setTimeout(() => { nextPhaseTriggeredRef.current = false; }, 100);

    }, [ // Ensure ALL dependencies are listed correctly
        currentPhase, cycleCount, saveFocusToHistory, workDuration, shortBreakDuration, longBreakDuration,
        cyclesBeforeLongBreak, playSound, playAlarmLoop, stopAlarmLoop,
        clearFocusStartEffect, history, currentFeedbackNotes, updateLastHistoryFeedback,
        setHistory, setCurrentFocusPoints, setCurrentFeedbackNotes, setCycleCount, setCurrentPhase,
        setTimeLeft, setInitialDuration, setCurrentSessionStartTime, setIsRunning
    ]);

    // --- Timer Interval Effect (Deadline-based) ---
    useEffect(() => {
        const tick = () => {
            // Check if timer should be running and if a deadline exists
            if (!timerDeadlineRef.current || !isRunning) return;

            const now = Date.now();
            const remainingMs = timerDeadlineRef.current - now;
            const newTimeLeft = Math.max(0, Math.round(remainingMs / 1000));

            // Update timeLeft state only if the value actually changes
            setTimeLeft(currentTime => (currentTime !== newTimeLeft ? newTimeLeft : currentTime));

            // Check if timer reached zero and hasn't been triggered yet
            if (remainingMs <= 0 && !nextPhaseTriggeredRef.current) {
                 console.log("Timer reached zero in tick.");
                 if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
                 handleNextPhase(true); // Timer finished naturally
             }
        };

        if (isRunning) {
            // Ensure deadline is set if missing (e.g., after pause/resume)
             if (!timerDeadlineRef.current) {
                 console.warn("Timer running but deadline missing. Setting based on timeLeft.");
                 timerDeadlineRef.current = Date.now() + timeLeft * 1000;
             }
            // Clear previous interval, run tick immediately, set new interval
            if (intervalRef.current) clearInterval(intervalRef.current);
            tick();
            intervalRef.current = setInterval(tick, TIMER_UI_UPDATE_INTERVAL_MS);
            nextPhaseTriggeredRef.current = false; // Reset trigger flag when timer starts/resumes
            stopAlarmLoop(); // Stop any looping alarm when timer restarts/resumes
        } else {
            // Clear interval if timer is stopped
            if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
            // timerDeadlineRef is kept if paused, cleared if reset/skipped
        }

        // Cleanup function to clear interval on unmount or when isRunning changes
        return () => {
            if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
        };
        // Ensure handleNextPhase and stopAlarmLoop are stable callbacks
    }, [isRunning, timeLeft, handleNextPhase, stopAlarmLoop]);

     // --- Visibility Change Effect ---
     useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log("Tab became visible.");
                // Stop any looping alarm immediately when tab becomes visible
                stopAlarmLoop();

                // If the timer should be running and has a deadline, check for corrections
                if (isRunning && timerDeadlineRef.current) {
                    const now = Date.now();
                    const remainingMs = timerDeadlineRef.current - now;
                    const correctedTimeLeft = Math.max(0, Math.round(remainingMs / 1000));

                    // Correct the displayed time immediately if it drifted
                    setTimeLeft(currentTime => {
                       if (currentTime !== correctedTimeLeft) {
                           console.log(`Timer corrected on visibility change from ${currentTime} to ${correctedTimeLeft}`);
                           return correctedTimeLeft;
                       }
                       return currentTime;
                     });

                    // Check if timer should have finished while hidden *after* correcting state
                    // and if the next phase hasn't already been triggered
                    if (remainingMs <= 0 && !nextPhaseTriggeredRef.current) {
                        console.log("Timer finished while tab was hidden. Triggering next phase on visibility.");
                        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
                        handleNextPhase(true); // Trigger the missed phase transition
                    }
                }
            } else {
                 console.log("Tab became hidden.");
                 // Don't start looping alarm here, only when timer *finishes* while hidden
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        // Cleanup listener on unmount
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
        // Ensure handleNextPhase and stopAlarmLoop are stable callbacks
     }, [isRunning, handleNextPhase, stopAlarmLoop]);

    // --- Document Title Effect ---
    useEffect(() => {
        const baseTitle = "PomoHero";
        if (isRunning) {
            document.title = `${formatTime(timeLeft)} - ${baseTitle}`;
        } else {
            document.title = baseTitle;
            // Optional: Could add logic here to flash title if alarm is looping, but complex.
        }
        // No cleanup needed unless component unmounts, which resets title anyway.
    }, [isRunning, timeLeft]);


     // --- Control Handlers ---
    const startPauseTimer = useCallback(() => {
        stopAlarmLoop(); // Stop alarm loop on any interaction
        playSound('buttonPress');
        const effectIsCurrentlyActive = focusStartEffectTimeouts.current.length > 0;

        if (!isRunning && !effectIsCurrentlyActive) { // ---> STARTING
            // Pre-start checks...
            if (currentPhase === 'Work' && currentFocusPoints.trim() === '') { alert('Por favor, defina seus pontos de foco.'); return; }
            const requiresFeedback = (currentPhase === 'Short Break' || currentPhase === 'Long Break') && history.length > 0 && history[0]?.feedbackNotes === '';
            if (requiresFeedback && currentFeedbackNotes.trim() === '') { alert('Por favor, adicione seu feedback.'); return; }
            else if (requiresFeedback && currentFeedbackNotes.trim() !== '') { updateLastHistoryFeedback(); }

            setInitialDuration(timeLeft);
            timerDeadlineRef.current = Date.now() + timeLeft * 1000; // Set deadline NOW
            nextPhaseTriggeredRef.current = false; // Reset flag

            if (currentPhase === 'Work') {
                setCurrentSessionStartTime(Date.now()); // Capture start time NOW
                playSound('focusStart');
                setActiveBgColorOverride(null); clearFocusStartEffect();
                // Focus Effect logic...
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
                 setIsRunning(true); // Trigger timer effect directly
            }

        } else if (isRunning || effectIsCurrentlyActive) { // ---> PAUSING
            clearFocusStartEffect();
            setIsRunning(false); // Stops timer effect, keeps deadline
        }
    }, [ // Ensure all dependencies are listed
        stopAlarmLoop, isRunning, currentPhase, currentFocusPoints, currentFeedbackNotes, history, timeLeft,
        playSound, clearFocusStartEffect, updateLastHistoryFeedback, setInitialDuration,
        setCurrentSessionStartTime, setActiveBgColorOverride, setIsRunning, settings
    ]);

    const resetTimer = useCallback(() => {
        stopAlarmLoop(); // Stop alarm loop on reset
        playSound('buttonPress');
        clearFocusStartEffect();
        setIsRunning(false);
        setCurrentSessionStartTime(null);
        timerDeadlineRef.current = null; // Clear deadline
        nextPhaseTriggeredRef.current = false; // Reset flag

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
    }, [ // Ensure all dependencies are listed
        stopAlarmLoop, playSound, clearFocusStartEffect, currentPhase, workDuration, shortBreakDuration, longBreakDuration,
        setCurrentSessionStartTime, setIsRunning, setTimeLeft, setInitialDuration, setCurrentFocusPoints
    ]);

    const skipPhase = useCallback(() => {
        stopAlarmLoop(); // Stop alarm loop on skip
        playSound('buttonPress');
        clearFocusStartEffect();

        // Feedback check...
        if ((currentPhase === 'Short Break' || currentPhase === 'Long Break')) {
             const requiresFeedback = history.length > 0 && history[0]?.feedbackNotes === '';
             if (requiresFeedback && currentFeedbackNotes.trim() === '') {
                alert('Por favor, adicione seu feedback da sessão de foco anterior antes de pular a pausa.');
                return;
            }
        }

        timerDeadlineRef.current = null; // Clear deadline before triggering next phase
        nextPhaseTriggeredRef.current = false; // Reset flag

        handleNextPhase(false); // Trigger phase change

    }, [ stopAlarmLoop, playSound, clearFocusStartEffect, currentPhase, handleNextPhase, history, currentFeedbackNotes ]);

    const clearHistory = useCallback(() => {
        // No need to stop loop here unless clearHistory also stops the timer
        playSound('buttonPress');
        if (window.confirm("Tem certeza que deseja limpar todo o histórico de foco?")) {
            setHistory([]); alert("Histórico limpo.");
        }
     }, [playSound, setHistory]);

    const openSettingsModal = useCallback(() => {
        // No need to stop loop unless opening settings pauses the timer
        playSound('click'); setIsSettingsOpen(true);
    }, [playSound, setIsSettingsOpen]);

    const closeSettingsModal = useCallback(() => {
         // No need to stop loop
        playSound('click'); setIsSettingsOpen(false);
    }, [playSound, setIsSettingsOpen]);

    const handleSettingChange = useCallback((settingKey: keyof PomodoroSettings, value: number | boolean) => {
         // No need to stop loop, settings only affect paused state or next cycle
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
         // No need to stop loop, only works when paused
        if (currentPhase === 'Work' && !isRunning && !isEffectRunning) {
            const validatedSeconds = Math.max(0, Math.min(newSeconds, 99 * 60 + 59));
            if (validatedSeconds !== timeLeft) {
                 setTimeLeft(validatedSeconds);
                 playSound('click');
            }
        }
     }, [currentPhase, isRunning, isEffectRunning, playSound, timeLeft, setTimeLeft]);


    // --- Dynamic Styling Calculation --- (remains the same)
    const styles = useMemo((): DynamicStyles => {
        let baseBg: string; let txt = '', prog = '', btn = '', btnAct = '', inputBg = '', histBorder = '', phase = '', modalAcc = '';
        // Logic to determine styles based on currentPhase, isRunning, activeBgColorOverride...
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
        let finalBg = baseBg; let finalHistBorder = histBorder;
        if (activeBgColorOverride) {
            finalBg = activeBgColorOverride;
             if (currentPhase === 'Work') {
                if (activeBgColorOverride === EFFECT_FLASH_COLOR_1) finalHistBorder = 'border-purple-700/50';
                else if (activeBgColorOverride === WORK_BG_PAUSED) finalHistBorder = 'border-slate-600/50';
                else if (activeBgColorOverride === WORK_BG_RUNNING) finalHistBorder = 'border-purple-600/50';
             }
        }
        return { baseBgColor: baseBg, finalHistoryBorderColor: finalHistBorder, textColor: txt, progressColor: prog, buttonColor: btn, buttonActiveColor: btnAct, inputBgColor: inputBg, phaseText: phase, modalAccentColor: modalAcc, finalBgColor: finalBg, };
    }, [currentPhase, isRunning, activeBgColorOverride]);


    // --- Context Value ---
    const contextValue: PomodoroContextType = {
        settings, currentPhase, timeLeft, isRunning, cycleCount, initialDuration, currentFocusPoints,
        currentFeedbackNotes, history, isSettingsOpen, isEffectRunning, styles,
        setSettings, handleSettingChange, setCurrentFocusPoints, setCurrentFeedbackNotes, startPauseTimer,
        resetTimer, skipPhase, clearHistory, openSettingsModal, closeSettingsModal, playSound,
        playAlarmLoop, stopAlarmLoop, // Expose loop control functions
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