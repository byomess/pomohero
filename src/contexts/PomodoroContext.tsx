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
import { HistoryEntry, Phase, PomodoroSettings, DynamicStyles, HistoryUpdateData, ManualHistoryEntryData, BacklogTask } from '../types';
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
    BACKLOG_STORAGE_KEY,
    CYCLE_COUNT_STORAGE_KEY, // Nova chave adicionada
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
    BREAK_TARGET_VOLUME,
    FOCUS_TARGET_VOLUME,
    HYPERFOCUS_BG_RUNNING,
    HYPERFOCUS_BG_PAUSED,
    HYPERFOCUS_BORDER,
    HYPERFOCUS_PROGRESS,
    HYPERFOCUS_ACCENT_RING,
    HYPERFOCUS_HIST_BORDER_RUNNING,
    HYPERFOCUS_HIST_BORDER_PAUSED,
    PRIMARY_FOCUS_PAUSED,
    PRIMARY_HYPERFOCUS_RUNNING,
    PRIMARY_HYPERFOCUS_PAUSED,
    PRIMARY_FOCUS_RUNNING,
    PRIMARY_SHORT_BREAK_RUNNING,
    PRIMARY_SHORT_BREAK_PAUSED,
    PRIMARY_LONG_BREAK_PAUSED,
    PRIMARY_LONG_BREAK_RUNNING,
    PRIMARY_FOCUS_FLASHING,
    CURRENT_PHASE_STORAGE_KEY,
    HAS_EXTENDED_CURRENT_FOCUS_STORAGE_KEY,
    INITIAL_DURATION_STORAGE_KEY,
    IS_HYPERFOCUS_ACTIVE_STORAGE_KEY,
    IS_RUNNING_STORAGE_KEY,
    SHOW_EXTENSION_OPTIONS_STORAGE_KEY,
    TIMER_STATE_STORAGE_KEY,
    CURRENT_SESSION_START_TIME_STORAGE_KEY,
    CURRENT_FEEDBACK_NOTES_STORAGE_KEY,
    CURRENT_FOCUS_POINTS_STORAGE_KEY,
    NEXT_FOCUS_PLANS_STORAGE_KEY,
    DEFAULT_MUSIC_VOLUME,
} from '../utils/constants';
import { formatTime } from '../utils/formatters';

const TIMER_UI_UPDATE_INTERVAL_MS = 500;

interface PomodoroContextType {
    settings: PomodoroSettings;
    currentPhase: Phase;
    timeLeft: number;
    isRunning: boolean;
    cycleCount: number;
    initialDuration: number;
    isSettingsOpen: boolean;
    isEffectRunning: boolean;
    styles: DynamicStyles;
    currentFocusPoints: string[];
    currentFeedbackNotes: string;
    nextFocusPlans: string[];
    activeBgColorOverride: string | null;
    history: HistoryEntry[];
    backlogTasks: BacklogTask[];
    targetMusicVolume: number;
    showExtensionOptions: boolean;
    hasExtendedCurrentFocus: boolean;
    isHyperfocusActive: boolean;
    preloadedIntroUrl: string | null;
    musicVolume: number;

    setSettings: React.Dispatch<React.SetStateAction<PomodoroSettings>>;
    handleSettingChange: (key: keyof PomodoroSettings, value: number | boolean) => void;
    setCurrentFocusPoints: React.Dispatch<React.SetStateAction<string[]>>;
    addFocusPoint: (point: string, playSoundEffect?: boolean) => void;
    removeFocusPoint: (index: number) => void;
    setCurrentFeedbackNotes: React.Dispatch<React.SetStateAction<string>>;
    setNextFocusPlans: React.Dispatch<React.SetStateAction<string[]>>;
    addNextFocusPlan: (plan: string) => void;
    removeNextFocusPlan: (index: number) => void;
    updateNextFocusPlan: (index: number, newText: string) => void;
    startPauseTimer: () => void;
    resetTimer: () => void;
    skipPhase: () => void;
    clearHistory: () => void;
    openSettingsModal: () => void;
    closeSettingsModal: () => void;
    adjustTimeLeft: (newSeconds: number) => void;
    updateBreakInfoInHistory: () => void;
    updateHistoryEntry: (id: string, updatedData: HistoryUpdateData) => void;
    deleteHistoryEntry: (id: string) => void;
    addManualHistoryEntry: (entryData: ManualHistoryEntryData) => void;
    addBacklogTask: (text: string) => void;
    updateBacklogTask: (id: string, newText: string) => void;
    deleteBacklogTask: (id: string, playSoundEffect?: boolean) => void;
    clearBacklog: () => void;
    moveTaskToFocus: (taskId: string) => void;
    playSound: (soundName: SoundName) => void;
    playAlarmLoop: () => void;
    stopAlarmLoop: () => void;
    debouncedPlayTypingSound: () => void;
    extendFocusSession: (secondsToAdd: number) => void;
    setPreloadedIntroUrl: React.Dispatch<React.SetStateAction<string | null>>;
    setMusicVolume: React.Dispatch<React.SetStateAction<number>>;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

const defaultSettings: PomodoroSettings = {
    workDuration: DEFAULT_WORK_DURATION, shortBreakDuration: DEFAULT_SHORT_BREAK_DURATION,
    longBreakDuration: DEFAULT_LONG_BREAK_DURATION, cyclesBeforeLongBreak: DEFAULT_CYCLES_BEFORE_LONG_BREAK,
    soundEnabled: DEFAULT_SOUND_ENABLED,
};

interface PomodoroProviderProps {
    children: ReactNode;
    preloadedIntroUrl?: string | null | undefined;
}

export const PomodoroProvider: React.FC<PomodoroProviderProps> = ({ children, preloadedIntroUrl: initialPreloadedIntroUrl }) => {
    const [settings, setSettings] = useLocalStorage<PomodoroSettings>(SETTINGS_STORAGE_KEY, defaultSettings);
    const { workDuration, shortBreakDuration, longBreakDuration, cyclesBeforeLongBreak, soundEnabled } = settings;

    const [history, setHistory] = useLocalStorage<HistoryEntry[]>(HISTORY_STORAGE_KEY, []);
    const [currentPhase, setCurrentPhase] = useLocalStorage<Phase>(CURRENT_PHASE_STORAGE_KEY, 'Work');
    const [timeLeft, setTimeLeft] = useLocalStorage<number>(TIMER_STATE_STORAGE_KEY, workDuration);
    const [isRunning, setIsRunning] = useLocalStorage<boolean>(IS_RUNNING_STORAGE_KEY, false);
    const [cycleCount, setCycleCount] = useLocalStorage<number>(CYCLE_COUNT_STORAGE_KEY, 0);
    const [initialDuration, setInitialDuration] = useLocalStorage<number>(INITIAL_DURATION_STORAGE_KEY, workDuration);
    const [showExtensionOptions, setShowExtensionOptions] = useLocalStorage<boolean>(SHOW_EXTENSION_OPTIONS_STORAGE_KEY, false);
    const [hasExtendedCurrentFocus, setHasExtendedCurrentFocus] = useLocalStorage<boolean>(HAS_EXTENDED_CURRENT_FOCUS_STORAGE_KEY, false);
    const [isHyperfocusActive, setIsHyperfocusActive] = useLocalStorage<boolean>(IS_HYPERFOCUS_ACTIVE_STORAGE_KEY, false);
    const [backlogTasks, setBacklogTasks] = useLocalStorage<BacklogTask[]>(BACKLOG_STORAGE_KEY, []);
    const [currentSessionStartTime, setCurrentSessionStartTime] = useLocalStorage<number | null>(CURRENT_SESSION_START_TIME_STORAGE_KEY, null);
    const [currentFocusPoints, setCurrentFocusPoints] = useLocalStorage<string[]>(CURRENT_FOCUS_POINTS_STORAGE_KEY, []);
    const [currentFeedbackNotes, setCurrentFeedbackNotes] = useLocalStorage<string>(CURRENT_FEEDBACK_NOTES_STORAGE_KEY, '');
    const [nextFocusPlans, setNextFocusPlans] = useLocalStorage<string[]>(NEXT_FOCUS_PLANS_STORAGE_KEY, []);
    
    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
    const [activeBgColorOverride, setActiveBgColorOverride] = useState<string | null>(null);
    const [targetMusicVolume, setTargetMusicVolume] = useState<number>(FOCUS_TARGET_VOLUME);
    const [musicVolume, setMusicVolume] = useState(DEFAULT_MUSIC_VOLUME);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const focusStartEffectTimeouts = useRef<NodeJS.Timeout[]>([]);
    const timerDeadlineRef = useRef<number | null>(null);
    const nextPhaseTriggeredRef = useRef<boolean>(false);
    const almostEndingSoundPlayedRef = useRef<boolean>(false);

    const [preloadedIntroUrl, setPreloadedIntroUrl] = useState<string | null>(initialPreloadedIntroUrl ?? null);

    const { playSound, debouncedPlayTypingSound, playAlarmLoop, stopAlarmLoop } = useSounds(soundEnabled);

    const isEffectRunning = focusStartEffectTimeouts.current.length > 0;

    const addFocusPoint = useCallback((point: string, playSoundEffect = true) => {
        const trimmedPoint = point.trim(); if (trimmedPoint) { setCurrentFocusPoints(prev => [...prev, trimmedPoint]); if (playSoundEffect) playSound('confirm'); }
    }, [setCurrentFocusPoints, playSound]);

    const removeFocusPoint = useCallback((index: number) => {
        setCurrentFocusPoints(prev => prev.filter((_, i) => i !== index)); playSound('remove');
    }, [setCurrentFocusPoints, playSound]);

    const addNextFocusPlan = useCallback((plan: string) => {
        const trimmedPlan = plan.trim(); if (trimmedPlan) { setNextFocusPlans(prev => [...prev, trimmedPlan]); playSound('confirm'); }
    }, [setNextFocusPlans, playSound]);

    const removeNextFocusPlan = useCallback((index: number) => {
        setNextFocusPlans(prev => prev.filter((_, i) => i !== index)); playSound('remove');
    }, [setNextFocusPlans, playSound]);

    const updateNextFocusPlan = useCallback((index: number, newText: string) => {
        const trimmedText = newText.trim(); if (trimmedText === '') { alert("O plano não pode ficar vazio."); return; } setNextFocusPlans(prev => prev.map((plan, i) => i === index ? trimmedText : plan)); playSound('confirm');
    }, [setNextFocusPlans, playSound]);

    const saveFocusToHistory = useCallback(() => {
        if (currentSessionStartTime === null) return;
        const newEntry: HistoryEntry = {
            id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, startTime: currentSessionStartTime, endTime: Date.now(), duration: initialDuration,
            focusPoints: currentFocusPoints, feedbackNotes: '',
        };
        setHistory((prevHistory) => [newEntry, ...prevHistory].sort((a, b) => b.startTime - a.startTime));
    }, [currentFocusPoints, initialDuration, setHistory, currentSessionStartTime]);

    const updateBreakInfoInHistory = useCallback(() => {
        const feedback = currentFeedbackNotes.trim(); const plans = nextFocusPlans.filter(p => p.trim() !== ''); if (feedback === '' && plans.length === 0) return;
        setHistory((prevHistory) => { if (prevHistory.length === 0) return prevHistory; const lastEntry = prevHistory[0]; const needsFeedbackUpdate = lastEntry.feedbackNotes === '' && feedback !== ''; const needsPlansUpdate = (!lastEntry.nextFocusPlans || lastEntry.nextFocusPlans.length === 0) && plans.length > 0 || (lastEntry.nextFocusPlans && JSON.stringify(lastEntry.nextFocusPlans) !== JSON.stringify(plans)); if (needsFeedbackUpdate || needsPlansUpdate) { const updates: HistoryUpdateData = {}; if (needsFeedbackUpdate) updates.feedbackNotes = feedback; if (needsPlansUpdate) updates.nextFocusPlans = plans.length > 0 ? plans : undefined; return [{ ...lastEntry, ...updates }, ...prevHistory.slice(1)]; } return prevHistory; });
    }, [currentFeedbackNotes, nextFocusPlans, setHistory]);

    const updateHistoryEntry = useCallback((id: string, updatedData: HistoryUpdateData) => {
        if (updatedData.nextFocusPlans && updatedData.nextFocusPlans.filter(p => p.trim() !== '').length === 0) { updatedData.nextFocusPlans = undefined; } setHistory(prevHistory => prevHistory.map(entry => entry.id === id ? { ...entry, ...updatedData } : entry).sort((a, b) => b.startTime - a.startTime)); playSound('confirm');
    }, [setHistory, playSound]);

    const deleteHistoryEntry = useCallback((id: string) => {
        playSound('select'); setTimeout(() => { if (window.confirm("Tem certeza que deseja remover esta entrada do histórico?")) { setHistory(prevHistory => prevHistory.filter(entry => entry.id !== id)); playSound('remove'); } }, 0);
    }, [setHistory, playSound]);

    const addManualHistoryEntry = useCallback((entryData: ManualHistoryEntryData) => {
        const newEntry: HistoryEntry = {
            id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            startTime: entryData.startTime,
            endTime: entryData.endTime,
            duration: entryData.duration,
            focusPoints: entryData.focusPoints ?? [],
            feedbackNotes: entryData.feedbackNotes ?? '',
        };
        setHistory(prevHistory => [newEntry, ...prevHistory].sort((a, b) => b.startTime - a.startTime));
        playSound('confirm');
    }, [setHistory, playSound]);

    const clearHistory = useCallback(() => {
        playSound('select'); setTimeout(() => { if (window.confirm("Tem certeza que deseja limpar todo o histórico de foco?")) { setHistory([]); playSound('remove'); } }, 0);
    }, [playSound, setHistory]);

    const addBacklogTask = useCallback((text: string) => {
        const trimmedText = text.trim(); if (!trimmedText) return; const newTask: BacklogTask = { id: `backlog-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, text: trimmedText, }; setBacklogTasks(prev => [newTask, ...prev]); playSound('confirm');
    }, [setBacklogTasks, playSound]);

    const updateBacklogTask = useCallback((id: string, newText: string) => {
        const trimmedText = newText.trim(); if (!trimmedText) { alert("A tarefa não pode ficar vazia."); return; } setBacklogTasks(prev => prev.map(task => task.id === id ? { ...task, text: trimmedText } : task)); playSound('confirm');
    }, [setBacklogTasks, playSound]);

    const deleteBacklogTask = useCallback((id: string, playSoundEffect = true) => {
        setBacklogTasks(prev => prev.filter(task => task.id !== id)); if (playSoundEffect) playSound('remove');
    }, [setBacklogTasks, playSound]);

    const clearBacklog = useCallback(() => {
        playSound('select'); setTimeout(() => { if (window.confirm("Tem certeza que deseja limpar todas as tarefas do backlog?")) { setBacklogTasks([]); playSound('remove'); } }, 0);
    }, [playSound, setBacklogTasks]);

    const moveTaskToFocus = useCallback((taskId: string) => {
        const taskToMove = backlogTasks.find(task => task.id === taskId); if (!taskToMove) return; addFocusPoint(taskToMove.text, false); deleteBacklogTask(taskId, false); playSound('confirm');
    }, [backlogTasks, addFocusPoint, deleteBacklogTask, playSound]);

    const clearFocusStartEffect = useCallback(() => {
        focusStartEffectTimeouts.current.forEach(clearTimeout); focusStartEffectTimeouts.current = []; setActiveBgColorOverride(null);
    }, [setActiveBgColorOverride]);

    const handleNextPhase = useCallback((timerFinished: boolean) => {
        if (nextPhaseTriggeredRef.current) return; nextPhaseTriggeredRef.current = true;
        clearFocusStartEffect(); setIsRunning(false); timerDeadlineRef.current = null; stopAlarmLoop();
        setShowExtensionOptions(false); setHasExtendedCurrentFocus(false); setIsHyperfocusActive(false);
        almostEndingSoundPlayedRef.current = false;

        if (timerFinished) { if (document.hidden) playAlarmLoop(); else playSound('alarm'); }

        let nextPhase: Phase; let nextDuration: number; let nextCycleCount = cycleCount;
        if (currentPhase === 'Work') {
            saveFocusToHistory(); setCurrentFocusPoints([]); setCurrentSessionStartTime(null);
            nextCycleCount++; setCycleCount(nextCycleCount);
            nextPhase = (nextCycleCount > 0 && nextCycleCount % cyclesBeforeLongBreak === 0) ? 'Long Break' : 'Short Break';
            nextDuration = nextPhase === 'Long Break' ? longBreakDuration : shortBreakDuration;
            setTargetMusicVolume(BREAK_TARGET_VOLUME);
        } else {
            updateBreakInfoInHistory(); setCurrentFeedbackNotes(''); setNextFocusPlans([]);
            nextPhase = 'Work'; nextDuration = workDuration;
            setTargetMusicVolume(FOCUS_TARGET_VOLUME);
        }

        setCurrentPhase(nextPhase); setTimeLeft(nextDuration); setInitialDuration(nextDuration);
        setTimeout(() => { nextPhaseTriggeredRef.current = false; }, 100);

    }, [
        currentPhase, cycleCount, saveFocusToHistory, workDuration, shortBreakDuration, longBreakDuration, cyclesBeforeLongBreak,
        playSound, playAlarmLoop, stopAlarmLoop, clearFocusStartEffect, updateBreakInfoInHistory, setTargetMusicVolume,
        setCurrentFocusPoints, setCurrentFeedbackNotes, setCycleCount, setCurrentPhase, setTimeLeft, setInitialDuration,
        setCurrentSessionStartTime, setIsRunning, setNextFocusPlans, setShowExtensionOptions, setHasExtendedCurrentFocus, setIsHyperfocusActive
    ]);

    const extendFocusSession = useCallback((secondsToAdd: number) => {
        if (currentPhase === 'Work' && isRunning && timeLeft > 0 && timerDeadlineRef.current && !hasExtendedCurrentFocus) {
            const isHyperfocusExtension = secondsToAdd === initialDuration;
            playSound(isHyperfocusExtension ? 'hyperfocus' : 'confirm');

            const newDeadline = timerDeadlineRef.current + secondsToAdd * 1000; timerDeadlineRef.current = newDeadline;
            setTimeLeft(prevTime => prevTime + secondsToAdd); setInitialDuration(prevDuration => prevDuration + secondsToAdd);
            setShowExtensionOptions(false); setHasExtendedCurrentFocus(true);
            if (isHyperfocusExtension) { setIsHyperfocusActive(true); }
            almostEndingSoundPlayedRef.current = false;

            console.log(`Focus extended by ${secondsToAdd}s. New deadline: ${new Date(newDeadline).toLocaleTimeString()}`);
        } else {
            if (hasExtendedCurrentFocus) { playSound('remove'); console.warn("Cannot extend session: Session already extended."); }
            else { console.warn("Cannot extend session. Conditions not met:", { currentPhase, isRunning, timeLeft }); }
        }
    }, [currentPhase, isRunning, timeLeft, playSound, initialDuration, setTimeLeft, setInitialDuration, setShowExtensionOptions, hasExtendedCurrentFocus, setHasExtendedCurrentFocus, setIsHyperfocusActive]);


    useEffect(() => {
        if (!isRunning && !isEffectRunning) {
            const durationSettingKeyMap: Record<Phase, keyof PomodoroSettings> = { 'Work': 'workDuration', 'Short Break': 'shortBreakDuration', 'Long Break': 'longBreakDuration' };
            const relevantSettingKey = durationSettingKeyMap[currentPhase]; const currentSettingDuration = settings[relevantSettingKey] as number;
            if (currentSettingDuration !== initialDuration) { if (timeLeft === initialDuration) { setTimeLeft(currentSettingDuration); } setInitialDuration(currentSettingDuration); }
        }
    }, [settings, currentPhase, isRunning, isEffectRunning, initialDuration, timeLeft, setTimeLeft, setInitialDuration]);

    useEffect(() => {
        const tick = () => {
            if (!timerDeadlineRef.current || !isRunning) return;
            const now = Date.now(); const remainingMs = timerDeadlineRef.current - now; const newTimeLeft = Math.max(0, Math.round(remainingMs / 1000));
            if (currentPhase === 'Work' && isRunning) {
                const isLastMinute = newTimeLeft > 0 && newTimeLeft <= 60;
                if (isLastMinute && !showExtensionOptions && !hasExtendedCurrentFocus) {
                    if (!almostEndingSoundPlayedRef.current) { playSound('focusAlmostEnding'); almostEndingSoundPlayedRef.current = true; }
                    setShowExtensionOptions(true);
                } else if (!isLastMinute && showExtensionOptions) {
                    setShowExtensionOptions(false); almostEndingSoundPlayedRef.current = false;
                }
            }
            setTimeLeft(currentTime => currentTime !== newTimeLeft ? newTimeLeft : currentTime);
            if (remainingMs <= 0 && !nextPhaseTriggeredRef.current) { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } handleNextPhase(true); }
        };
        if (isRunning) {
            if (!timerDeadlineRef.current) { timerDeadlineRef.current = Date.now() + timeLeft * 1000; }
            if (intervalRef.current) clearInterval(intervalRef.current);
            tick(); intervalRef.current = setInterval(tick, TIMER_UI_UPDATE_INTERVAL_MS);
            nextPhaseTriggeredRef.current = false; stopAlarmLoop();
            almostEndingSoundPlayedRef.current = timeLeft <= 60;
            setShowExtensionOptions(currentPhase === 'Work' && timeLeft > 0 && timeLeft <= 60 && !hasExtendedCurrentFocus);
        } else {
            if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
            setShowExtensionOptions(false);
        }
        return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
    }, [isRunning, timeLeft, handleNextPhase, stopAlarmLoop, currentPhase, playSound, setShowExtensionOptions, showExtensionOptions, hasExtendedCurrentFocus]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                stopAlarmLoop();
                if (isRunning && timerDeadlineRef.current) {
                    const now = Date.now(); const remainingMs = timerDeadlineRef.current - now; const correctedTimeLeft = Math.max(0, Math.round(remainingMs / 1000));
                    const isNowLastMinute = correctedTimeLeft > 0 && correctedTimeLeft <= 60;
                    if (currentPhase === 'Work' && isRunning) {
                        if (isNowLastMinute && !showExtensionOptions && !hasExtendedCurrentFocus) {
                            if (!almostEndingSoundPlayedRef.current) { playSound('focusAlmostEnding'); almostEndingSoundPlayedRef.current = true; }
                            setShowExtensionOptions(true);
                        } else if (!isNowLastMinute && showExtensionOptions) {
                            setShowExtensionOptions(false); almostEndingSoundPlayedRef.current = false;
                        }
                    }
                    setTimeLeft(currentTime => currentTime !== correctedTimeLeft ? correctedTimeLeft : currentTime);
                    if (remainingMs <= 0 && !nextPhaseTriggeredRef.current) { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } handleNextPhase(true); }
                }
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isRunning, handleNextPhase, stopAlarmLoop, currentPhase, playSound, timeLeft, showExtensionOptions, setShowExtensionOptions, hasExtendedCurrentFocus]);

    useEffect(() => {
        const baseTitle = "PomoHero"; document.title = isRunning ? `${formatTime(timeLeft)} - ${baseTitle}` : baseTitle;
    }, [isRunning, timeLeft]);

    const startPauseTimer = useCallback(() => {
        stopAlarmLoop(); playSound('buttonPress');
        setShowExtensionOptions(false);
        almostEndingSoundPlayedRef.current = false;
        const effectIsCurrentlyActive = focusStartEffectTimeouts.current.length > 0;
        if (!isRunning && !effectIsCurrentlyActive) {
            setInitialDuration(timeLeft); timerDeadlineRef.current = Date.now() + timeLeft * 1000; nextPhaseTriggeredRef.current = false;
            if (currentPhase === 'Work') {
                setTargetMusicVolume(FOCUS_TARGET_VOLUME);
                if (!currentSessionStartTime) { setCurrentSessionStartTime(Date.now()); }
                playSound('focusStart');
                setActiveBgColorOverride(null); clearFocusStartEffect();

                const pausedBaseColor = isHyperfocusActive ? HYPERFOCUS_BG_PAUSED : WORK_BG_PAUSED;
                const runningColor = isHyperfocusActive ? HYPERFOCUS_BG_RUNNING : WORK_BG_RUNNING;
                const flashColor = EFFECT_FLASH_COLOR_1;
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
            } else {
                setTargetMusicVolume(BREAK_TARGET_VOLUME); setIsRunning(true);
            }
        } else if (isRunning || effectIsCurrentlyActive) {
            clearFocusStartEffect(); setIsRunning(false);
        }
    }, [
        stopAlarmLoop, isRunning, currentPhase, timeLeft, playSound, currentSessionStartTime, isHyperfocusActive,
        clearFocusStartEffect, setInitialDuration, setCurrentSessionStartTime,
        setActiveBgColorOverride, setIsRunning, setTargetMusicVolume, setShowExtensionOptions,
    ]);

    const resetTimer = useCallback(() => {
        stopAlarmLoop(); playSound('buttonPress'); clearFocusStartEffect();
        setIsRunning(false); setCurrentSessionStartTime(null); timerDeadlineRef.current = null; nextPhaseTriggeredRef.current = false;
        setShowExtensionOptions(false); setHasExtendedCurrentFocus(false); setIsHyperfocusActive(false);
        almostEndingSoundPlayedRef.current = false;
        let duration: number;
        switch (currentPhase) { case 'Work': duration = workDuration; break; case 'Short Break': duration = shortBreakDuration; break; case 'Long Break': duration = longBreakDuration; break; default: duration = workDuration; }
        setTimeLeft(duration); setInitialDuration(duration);
        if (currentPhase === 'Work') { setTargetMusicVolume(FOCUS_TARGET_VOLUME); setCurrentFocusPoints([]); }
        else { setTargetMusicVolume(BREAK_TARGET_VOLUME); setNextFocusPlans([]); setCurrentFeedbackNotes(''); }
    }, [
        stopAlarmLoop, playSound, clearFocusStartEffect, currentPhase, workDuration, shortBreakDuration, longBreakDuration,
        setCurrentSessionStartTime, setIsRunning, setTimeLeft, setInitialDuration, setCurrentFocusPoints,
        setNextFocusPlans, setCurrentFeedbackNotes, setTargetMusicVolume, setShowExtensionOptions, setHasExtendedCurrentFocus, setIsHyperfocusActive
    ]);

    const skipPhase = useCallback(() => {
        stopAlarmLoop(); playSound('buttonPress'); clearFocusStartEffect();
        setShowExtensionOptions(false); setHasExtendedCurrentFocus(false); setIsHyperfocusActive(false);
        almostEndingSoundPlayedRef.current = false;
        if (currentPhase === 'Short Break' || currentPhase === 'Long Break') { updateBreakInfoInHistory(); }
        setCurrentFeedbackNotes(''); setNextFocusPlans([]);
        timerDeadlineRef.current = null; nextPhaseTriggeredRef.current = false;
        handleNextPhase(false);
    }, [
        stopAlarmLoop, playSound, clearFocusStartEffect, currentPhase, handleNextPhase, updateBreakInfoInHistory,
        setCurrentFeedbackNotes, setNextFocusPlans, setShowExtensionOptions, setHasExtendedCurrentFocus, setIsHyperfocusActive
    ]);

    const openSettingsModal = useCallback(() => { playSound('buttonPress'); setIsSettingsOpen(true); }, [playSound, setIsSettingsOpen]);
    const closeSettingsModal = useCallback(() => { playSound('buttonPress'); setIsSettingsOpen(false); }, [playSound, setIsSettingsOpen]);

    const handleSettingChange = useCallback((settingKey: keyof PomodoroSettings, value: number | boolean) => {
        if (typeof value === 'boolean') { playSound('buttonPress'); }
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
            } return newSettings;
        });
    }, [playSound, setSettings, isRunning, isEffectRunning, currentPhase, initialDuration, timeLeft, setTimeLeft, setInitialDuration]);

    const adjustTimeLeft = useCallback((newSeconds: number) => {
        if (currentPhase === 'Work' && !isRunning && !isEffectRunning) {
            const validatedSeconds = Math.max(0, Math.min(newSeconds, 99 * 60 + 59));
            if (validatedSeconds !== timeLeft) { setTimeLeft(validatedSeconds); playSound('buttonPress'); }
        }
    }, [currentPhase, isRunning, isEffectRunning, playSound, timeLeft, setTimeLeft]);

    const styles = useMemo((): DynamicStyles => {
        let primaryColor: string = PRIMARY_FOCUS_PAUSED;
        let baseBg: string = '';
        let timerHighlightBorder: string = 'border-transparent';
        let txt: string = 'text-gray-200';
        let prog: string = 'bg-gray-500';
        let btn: string = 'bg-white/10 hover:bg-white/20 text-gray-200';
        let btnAct: string = 'bg-white/25 text-white';
        let inputBg: string = 'bg-black/30 placeholder-gray-500 focus:ring-gray-500';
        let histBorder: string = 'border-gray-600/50';
        let phase: string = '';
        let modalAcc: string = 'ring-gray-500';

        if (currentPhase === 'Work') {
            if (isHyperfocusActive) {
                primaryColor = isRunning ? PRIMARY_HYPERFOCUS_RUNNING : PRIMARY_HYPERFOCUS_PAUSED;
                baseBg = isRunning ? HYPERFOCUS_BG_RUNNING : HYPERFOCUS_BG_PAUSED;
                txt = 'text-red-100';
                prog = HYPERFOCUS_PROGRESS;
                btn = 'bg-red-400/10 hover:bg-red-400/20 text-red-100';
                btnAct = 'bg-red-500/40 text-white';
                inputBg = 'bg-black/30 placeholder-red-400/70 focus:ring-red-500';
                phase = "Hiper Foco";
                modalAcc = HYPERFOCUS_ACCENT_RING;
                histBorder = isRunning ? HYPERFOCUS_HIST_BORDER_RUNNING : HYPERFOCUS_HIST_BORDER_PAUSED;
                timerHighlightBorder = isRunning ? HYPERFOCUS_BORDER : HYPERFOCUS_BORDER.replace('600', '700');
            } else {
                primaryColor = isRunning ? PRIMARY_FOCUS_RUNNING : PRIMARY_FOCUS_PAUSED;
                baseBg = isRunning ? WORK_BG_RUNNING : WORK_BG_PAUSED;
                txt = 'text-slate-100';
                prog = 'bg-slate-400';
                btn = 'bg-white/10 hover:bg-white/20 text-slate-100';
                btnAct = 'bg-white/25 text-white';
                inputBg = 'bg-black/30 placeholder-slate-400/70 focus:ring-slate-400';
                phase = "Foco";
                modalAcc = 'ring-slate-500';
                histBorder = isRunning ? 'border-purple-600/50' : 'border-slate-600/50';
                timerHighlightBorder = isRunning ? 'border-purple-600' : 'border-slate-600';
            }
        } else if (currentPhase === 'Short Break') {
            primaryColor = isRunning ? PRIMARY_SHORT_BREAK_RUNNING : PRIMARY_SHORT_BREAK_PAUSED;
            baseBg = isRunning ? SHORT_BREAK_BG_RUNNING : SHORT_BREAK_BG_PAUSED;
            txt = 'text-cyan-100'; prog = 'bg-cyan-500';
            btn = 'bg-white/10 hover:bg-white/20 text-cyan-100'; btnAct = 'bg-white/25 text-white';
            inputBg = 'bg-black/30 placeholder-cyan-600/70 focus:ring-cyan-500'; histBorder = 'border-cyan-600/50'; phase = "Pausa Curta"; modalAcc = 'ring-cyan-500';
            timerHighlightBorder = isRunning ? 'border-cyan-500' : 'border-cyan-600';
        } else {
            primaryColor = isRunning ? PRIMARY_LONG_BREAK_RUNNING : PRIMARY_LONG_BREAK_PAUSED;
            baseBg = isRunning ? LONG_BREAK_BG_RUNNING : LONG_BREAK_BG_PAUSED;
            txt = 'text-teal-100'; prog = 'bg-teal-500';
            btn = 'bg-white/10 hover:bg-white/20 text-teal-100'; btnAct = 'bg-white/25 text-white';
            inputBg = 'bg-black/30 placeholder-teal-600/70 focus:ring-teal-500'; histBorder = 'border-teal-600/50'; phase = "Pausa Longa"; modalAcc = 'ring-teal-500';
            timerHighlightBorder = isRunning ? 'border-teal-500' : 'border-teal-600';
        }

        let finalBg = baseBg;
        let finalHistBorder = histBorder;
        let finalTimerHighlightBorder = timerHighlightBorder;

        if (activeBgColorOverride && !isHyperfocusActive) {
            finalBg = activeBgColorOverride;

            if (currentPhase === 'Work') {
                if (activeBgColorOverride === EFFECT_FLASH_COLOR_1) {
                    primaryColor = PRIMARY_FOCUS_FLASHING;
                    finalHistBorder = 'border-purple-700/50';
                    finalTimerHighlightBorder = 'border-purple-700';
                } else if (activeBgColorOverride === WORK_BG_PAUSED) {
                    primaryColor = PRIMARY_FOCUS_PAUSED;
                    finalHistBorder = 'border-slate-600/50';
                    finalTimerHighlightBorder = 'border-slate-600';
                } else if (activeBgColorOverride === WORK_BG_RUNNING) {
                    primaryColor = PRIMARY_FOCUS_RUNNING;
                    finalHistBorder = 'border-purple-600/50';
                    finalTimerHighlightBorder = 'border-purple-600';
                }
            }
        }

        return {
            primaryColor: primaryColor,
            baseBgColor: baseBg,
            finalHistoryBorderColor: finalHistBorder,
            timerHighlightBorderColor: finalTimerHighlightBorder,
            textColor: txt,
            progressColor: prog,
            buttonColor: btn,
            buttonActiveColor: btnAct,
            inputBgColor: inputBg,
            phaseText: phase,
            modalAccentColor: modalAcc,
            finalBgColor: finalBg,
        };
    }, [currentPhase, isRunning, activeBgColorOverride, isHyperfocusActive]);


    const contextValue: PomodoroContextType = {
        settings, currentPhase, timeLeft, isRunning, cycleCount, initialDuration, isSettingsOpen, isEffectRunning, styles,
        currentFocusPoints, currentFeedbackNotes, nextFocusPlans, activeBgColorOverride, history, backlogTasks,
        targetMusicVolume, showExtensionOptions, hasExtendedCurrentFocus, isHyperfocusActive,
        setSettings, handleSettingChange, setCurrentFocusPoints, addFocusPoint, removeFocusPoint, setCurrentFeedbackNotes,
        setNextFocusPlans, addNextFocusPlan, removeNextFocusPlan, updateNextFocusPlan, startPauseTimer, resetTimer, skipPhase,
        clearHistory, openSettingsModal, closeSettingsModal, adjustTimeLeft, updateBreakInfoInHistory, updateHistoryEntry,
        deleteHistoryEntry, addManualHistoryEntry, addBacklogTask, updateBacklogTask, deleteBacklogTask, clearBacklog,
        moveTaskToFocus, playSound, playAlarmLoop, stopAlarmLoop, debouncedPlayTypingSound, extendFocusSession, preloadedIntroUrl,
        setPreloadedIntroUrl, musicVolume, setMusicVolume
    };

    return (
        <PomodoroContext.Provider value={contextValue}>
            {children}
        </PomodoroContext.Provider>
    );
};

export const usePomodoro = (): PomodoroContextType => {
    const context = useContext(PomodoroContext);
    if (!context) { throw new Error('usePomodoro must be used within a PomodoroProvider'); }
    return context;
};
