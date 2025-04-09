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
// *** Certifique-se de importar BacklogTask de ../types ***
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
    BACKLOG_STORAGE_KEY, // *** Importar a nova chave ***
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

const TIMER_UI_UPDATE_INTERVAL_MS = 500;

interface PomodoroContextType {
    // Pomodoro State & Settings
    settings: PomodoroSettings;
    currentPhase: Phase;
    timeLeft: number;
    isRunning: boolean;
    cycleCount: number;
    initialDuration: number;
    isSettingsOpen: boolean;
    isEffectRunning: boolean;
    styles: DynamicStyles;

    // Focus & History
    currentFocusPoints: string[];
    currentFeedbackNotes: string;
    history: HistoryEntry[];

    // Backlog State
    backlogTasks: BacklogTask[]; // <--- NOVO ESTADO

    // Pomodoro Setters & Actions
    setSettings: React.Dispatch<React.SetStateAction<PomodoroSettings>>;
    handleSettingChange: (key: keyof PomodoroSettings, value: number | boolean) => void;
    setCurrentFocusPoints: React.Dispatch<React.SetStateAction<string[]>>;
    addFocusPoint: (point: string) => void;
    removeFocusPoint: (index: number) => void;
    setCurrentFeedbackNotes: React.Dispatch<React.SetStateAction<string>>;
    startPauseTimer: () => void;
    resetTimer: () => void;
    skipPhase: () => void;
    clearHistory: () => void;
    openSettingsModal: () => void;
    closeSettingsModal: () => void;
    adjustTimeLeft: (newSeconds: number) => void;

    // History Actions
    updateLastHistoryFeedback: () => void;
    updateHistoryEntry: (id: string, updatedData: HistoryUpdateData) => void;
    deleteHistoryEntry: (id: string) => void;
    addManualHistoryEntry: (entryData: ManualHistoryEntryData) => void;

    // Backlog Actions // <--- NOVAS AÇÕES
    addBacklogTask: (text: string) => void;
    updateBacklogTask: (id: string, newText: string) => void;
    deleteBacklogTask: (id: string) => void;
    clearBacklog: () => void;
    // Poderíamos adicionar: toggleBacklogTaskCompletion, reorderBacklogTasks no futuro

    // Sound Actions
    playSound: (soundName: SoundName) => void;
    playAlarmLoop: () => void;
    stopAlarmLoop: () => void;
    debouncedPlayTypingSound: () => void;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

const defaultSettings: PomodoroSettings = {
    workDuration: DEFAULT_WORK_DURATION,
    shortBreakDuration: DEFAULT_SHORT_BREAK_DURATION,
    longBreakDuration: DEFAULT_LONG_BREAK_DURATION,
    cyclesBeforeLongBreak: DEFAULT_CYCLES_BEFORE_LONG_BREAK,
    soundEnabled: DEFAULT_SOUND_ENABLED,
};

interface PomodoroProviderProps {
    children: ReactNode;
}

export const PomodoroProvider: React.FC<PomodoroProviderProps> = ({ children }) => {
    // Pomodoro State
    const [settings, setSettings] = useLocalStorage<PomodoroSettings>(SETTINGS_STORAGE_KEY, defaultSettings);
    const { workDuration, shortBreakDuration, longBreakDuration, cyclesBeforeLongBreak, soundEnabled } = settings;
    const [history, setHistory] = useLocalStorage<HistoryEntry[]>(HISTORY_STORAGE_KEY, []);
    const [currentPhase, setCurrentPhase] = useState<Phase>('Work');
    const [timeLeft, setTimeLeft] = useState<number>(settings.workDuration);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [cycleCount, setCycleCount] = useState<number>(0);
    const [initialDuration, setInitialDuration] = useState<number>(settings.workDuration);
    const [currentFocusPoints, setCurrentFocusPoints] = useState<string[]>([]);
    const [currentFeedbackNotes, setCurrentFeedbackNotes] = useState<string>('');
    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
    const [activeBgColorOverride, setActiveBgColorOverride] = useState<string | null>(null);
    const [currentSessionStartTime, setCurrentSessionStartTime] = useState<number | null>(null);

    // Backlog State // <--- NOVO
    const [backlogTasks, setBacklogTasks] = useLocalStorage<BacklogTask[]>(BACKLOG_STORAGE_KEY, []);

    // Refs
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const focusStartEffectTimeouts = useRef<NodeJS.Timeout[]>([]);
    const timerDeadlineRef = useRef<number | null>(null);
    const nextPhaseTriggeredRef = useRef<boolean>(false);

    // Hooks
    const { playSound, debouncedPlayTypingSound, playAlarmLoop, stopAlarmLoop } = useSounds(soundEnabled);

    // Derived State
    const isEffectRunning = focusStartEffectTimeouts.current.length > 0;

    // --- Focus Point Actions ---
    const addFocusPoint = useCallback((point: string) => {
        const trimmedPoint = point.trim();
        if (trimmedPoint) {
            setCurrentFocusPoints(prev => [...prev, trimmedPoint]);
            playSound('click');
        }
    }, [setCurrentFocusPoints, playSound]);

    const removeFocusPoint = useCallback((index: number) => {
        setCurrentFocusPoints(prev => prev.filter((_, i) => i !== index));
        playSound('click');
    }, [setCurrentFocusPoints, playSound]);


    // --- History Actions ---
    const saveFocusToHistory = useCallback(() => {
        if (currentSessionStartTime === null) return;
        const newEntry: HistoryEntry = {
            id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            startTime: currentSessionStartTime, endTime: Date.now(), duration: initialDuration,
            focusPoints: currentFocusPoints, feedbackNotes: '',
        };
        setHistory((prevHistory) => [newEntry, ...prevHistory].sort((a, b) => b.startTime - a.startTime));
    }, [currentFocusPoints, initialDuration, setHistory, currentSessionStartTime]);

    const updateLastHistoryFeedback = useCallback(() => {
        setHistory((prevHistory) => {
            if (prevHistory.length === 0 || currentFeedbackNotes.trim() === '') return prevHistory;
            const lastEntry = prevHistory[0];
            if (lastEntry && lastEntry.feedbackNotes === '' && lastEntry.feedbackNotes !== currentFeedbackNotes) {
                return [{ ...lastEntry, feedbackNotes: currentFeedbackNotes }, ...prevHistory.slice(1)];
            }
            return prevHistory;
        });
    }, [currentFeedbackNotes, setHistory]); // Removed history dependency as per React Hook rules (using setter form)

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

    const clearHistory = useCallback(() => {
        playSound('buttonPress');
        if (window.confirm("Tem certeza que deseja limpar todo o histórico de foco?")) {
            setHistory([]);
            alert("Histórico limpo.");
        }
     }, [playSound, setHistory]);

    // --- Backlog Actions --- // <--- NOVO
    const addBacklogTask = useCallback((text: string) => {
        const trimmedText = text.trim();
        if (!trimmedText) return;
        const newTask: BacklogTask = {
            id: `backlog-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            text: trimmedText,
        };
        setBacklogTasks(prev => [newTask, ...prev]);
        playSound('click');
    }, [setBacklogTasks, playSound]);

    const updateBacklogTask = useCallback((id: string, newText: string) => {
        const trimmedText = newText.trim();
        if (!trimmedText) {
             alert("A tarefa não pode ficar vazia."); // Ou deletar? Decidimos alertar por enquanto.
             return;
         }
        setBacklogTasks(prev => prev.map(task =>
            task.id === id ? { ...task, text: trimmedText } : task
        ));
        playSound('click');
    }, [setBacklogTasks, playSound]);

    const deleteBacklogTask = useCallback((id: string) => {
        // Sem confirmação por enquanto para agilidade
        setBacklogTasks(prev => prev.filter(task => task.id !== id));
        playSound('buttonPress'); // Som diferente para delete
    }, [setBacklogTasks, playSound]);

    const clearBacklog = useCallback(() => {
        playSound('buttonPress');
        if (window.confirm("Tem certeza que deseja limpar todas as tarefas do backlog?")) {
            setBacklogTasks([]);
             alert("Backlog limpo.");
        }
    }, [playSound, setBacklogTasks]);


    // --- Pomodoro Phase & Timer Control ---
    const clearFocusStartEffect = useCallback(() => {
        focusStartEffectTimeouts.current.forEach(clearTimeout);
        focusStartEffectTimeouts.current = [];
        setActiveBgColorOverride(null);
    }, []);

    const handleNextPhase = useCallback((timerFinished: boolean) => {
        if (nextPhaseTriggeredRef.current) return;
        nextPhaseTriggeredRef.current = true;

        clearFocusStartEffect();
        setIsRunning(false);
        timerDeadlineRef.current = null;
        stopAlarmLoop();

        if (timerFinished) {
            if (document.hidden) playAlarmLoop();
            else playSound('alarm');
        }

        let nextPhase: Phase; let nextDuration: number; let nextCycleCount = cycleCount;
        if (currentPhase === 'Work') {
            saveFocusToHistory();
            setCurrentFocusPoints([]);
            setCurrentSessionStartTime(null);
            nextCycleCount++; setCycleCount(nextCycleCount);
            nextPhase = (nextCycleCount > 0 && nextCycleCount % cyclesBeforeLongBreak === 0) ? 'Long Break' : 'Short Break';
            nextDuration = nextPhase === 'Long Break' ? longBreakDuration : shortBreakDuration;
        } else {
            if (currentFeedbackNotes.trim() !== '') updateLastHistoryFeedback();
            setCurrentFeedbackNotes('');
            nextPhase = 'Work'; nextDuration = workDuration;
        }

        setCurrentPhase(nextPhase);
        setTimeLeft(nextDuration);
        setInitialDuration(nextDuration);

        setTimeout(() => { nextPhaseTriggeredRef.current = false; }, 100);

    }, [
        currentPhase, cycleCount, saveFocusToHistory, workDuration, shortBreakDuration, longBreakDuration,
        cyclesBeforeLongBreak, playSound, playAlarmLoop, stopAlarmLoop, clearFocusStartEffect,
        currentFeedbackNotes, updateLastHistoryFeedback, setCurrentFocusPoints,
        setCurrentFeedbackNotes, setCycleCount, setCurrentPhase, setTimeLeft, setInitialDuration,
        setCurrentSessionStartTime, setIsRunning
        // Todas as dependências parecem estáveis ou são gerenciadas corretamente
    ]);

    const startPauseTimer = useCallback(() => {
        stopAlarmLoop(); playSound('buttonPress');
        const effectIsCurrentlyActive = focusStartEffectTimeouts.current.length > 0;

        if (!isRunning && !effectIsCurrentlyActive) { // STARTING
            if (currentPhase === 'Work' && currentFocusPoints.length === 0) { alert('Por favor, adicione pelo menos um ponto de foco.'); return; }
            const requiresFeedback = (currentPhase === 'Short Break' || currentPhase === 'Long Break') && history.length > 0 && history[0]?.feedbackNotes === '';
            if (requiresFeedback && currentFeedbackNotes.trim() === '') { alert('Por favor, adicione seu feedback.'); return; }
            else if (requiresFeedback && currentFeedbackNotes.trim() !== '') { updateLastHistoryFeedback(); }

            setInitialDuration(timeLeft);
            timerDeadlineRef.current = Date.now() + timeLeft * 1000;
            nextPhaseTriggeredRef.current = false;

            if (currentPhase === 'Work') {
                setCurrentSessionStartTime(Date.now()); playSound('focusStart');
                setActiveBgColorOverride(null); clearFocusStartEffect();
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
            } else { setIsRunning(true); }
        } else if (isRunning || effectIsCurrentlyActive) { // PAUSING
            clearFocusStartEffect(); setIsRunning(false);
        }
    }, [
        stopAlarmLoop, isRunning, currentPhase, currentFocusPoints, currentFeedbackNotes, history, timeLeft, playSound,
        clearFocusStartEffect, updateLastHistoryFeedback, setInitialDuration, setCurrentSessionStartTime,
        setActiveBgColorOverride, setIsRunning, settings.workDuration, settings.shortBreakDuration, settings.longBreakDuration // Incluído settings para consistência se workDuration etc fossem usados diretamente
    ]);

    const resetTimer = useCallback(() => {
        stopAlarmLoop(); playSound('buttonPress'); clearFocusStartEffect();
        setIsRunning(false); setCurrentSessionStartTime(null); timerDeadlineRef.current = null; nextPhaseTriggeredRef.current = false;
        let duration: number;
        switch (currentPhase) {
            case 'Work': duration = workDuration; break;
            case 'Short Break': duration = shortBreakDuration; break;
            case 'Long Break': duration = longBreakDuration; break;
            default: duration = workDuration;
        }
        setTimeLeft(duration); setInitialDuration(duration);
        if (currentPhase === 'Work') { setCurrentFocusPoints([]); }
    }, [
        stopAlarmLoop, playSound, clearFocusStartEffect, currentPhase, workDuration, shortBreakDuration, longBreakDuration,
        setCurrentSessionStartTime, setIsRunning, setTimeLeft, setInitialDuration, setCurrentFocusPoints
    ]);

    const skipPhase = useCallback(() => {
        stopAlarmLoop(); playSound('buttonPress'); clearFocusStartEffect();
        if ((currentPhase === 'Short Break' || currentPhase === 'Long Break')) {
             const requiresFeedback = history.length > 0 && history[0]?.feedbackNotes === '';
             if (requiresFeedback && currentFeedbackNotes.trim() === '') { alert('Por favor, adicione seu feedback da sessão de foco anterior antes de pular a pausa.'); return; }
        }
        timerDeadlineRef.current = null; nextPhaseTriggeredRef.current = false;
        handleNextPhase(false);
    }, [ stopAlarmLoop, playSound, clearFocusStartEffect, currentPhase, handleNextPhase, history, currentFeedbackNotes ]);

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
            if (validatedSeconds !== timeLeft) { setTimeLeft(validatedSeconds); playSound('click'); }
        }
     }, [currentPhase, isRunning, isEffectRunning, playSound, timeLeft, setTimeLeft]);

     

    // --- Dynamic Styling --- (Inalterado)
    const styles = useMemo((): DynamicStyles => {
        let baseBg: string; let txt = '', prog = '', btn = '', btnAct = '', inputBg = '', histBorder = '', phase = '', modalAcc = '';
        if (currentPhase === 'Work') {
            baseBg = isRunning ? WORK_BG_RUNNING : WORK_BG_PAUSED;
            txt = 'text-slate-100'; prog = 'bg-slate-400'; btn = 'bg-white/10 hover:bg-white/20 text-slate-100'; btnAct = 'bg-white/25 text-white'; inputBg = 'bg-black/30 placeholder-slate-400/70 focus:ring-slate-400'; phase = "Foco"; modalAcc = 'ring-slate-500';
            histBorder = isRunning ? 'border-purple-600/50' : 'border-slate-600/50';
        } else if (currentPhase === 'Short Break') {
            baseBg = isRunning ? SHORT_BREAK_BG_RUNNING : SHORT_BREAK_BG_PAUSED;
            txt = 'text-cyan-100'; prog = 'bg-cyan-500'; btn = 'bg-white/10 hover:bg-white/20 text-cyan-100'; btnAct = 'bg-white/25 text-white'; inputBg = 'bg-black/30 placeholder-cyan-600/70 focus:ring-cyan-500'; histBorder = 'border-cyan-600/50'; phase = "Pausa Curta"; modalAcc = 'ring-cyan-500';
        } else {
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
        // Pomodoro
        settings, currentPhase, timeLeft, isRunning, cycleCount, initialDuration,
        isSettingsOpen, isEffectRunning, styles,
        setSettings, handleSettingChange, openSettingsModal, closeSettingsModal,
        startPauseTimer, resetTimer, skipPhase, adjustTimeLeft,

        // Focus & History
        currentFocusPoints, currentFeedbackNotes, history,
        setCurrentFocusPoints, addFocusPoint, removeFocusPoint, setCurrentFeedbackNotes,
        updateLastHistoryFeedback, updateHistoryEntry, deleteHistoryEntry, addManualHistoryEntry, clearHistory,

        // Backlog // <--- NOVO
        backlogTasks,
        addBacklogTask,
        updateBacklogTask,
        deleteBacklogTask,
        clearBacklog,

        // Sounds
        playSound, playAlarmLoop, stopAlarmLoop, debouncedPlayTypingSound,
    };

    return (
        <PomodoroContext.Provider value={contextValue}>
            {children}
        </PomodoroContext.Provider>
    );
};

// --- Custom Hook ---
export const usePomodoro = (): PomodoroContextType => {
    const context = useContext(PomodoroContext);
    if (!context) {
        throw new Error('usePomodoro must be used within a PomodoroProvider');
    }
    return context;
};
