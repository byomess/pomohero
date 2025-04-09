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
    setSettings: React.Dispatch<React.SetStateAction<PomodoroSettings>>;
    handleSettingChange: (key: keyof PomodoroSettings, value: number | boolean) => void;
    setCurrentFocusPoints: React.Dispatch<React.SetStateAction<string[]>>;
    addFocusPoint: (point: string, playSoundEffect?: boolean) => void;
    removeFocusPoint: (index: number) => void;
    setCurrentFeedbackNotes: React.Dispatch<React.SetStateAction<string>>;
    setNextFocusPlans: React.Dispatch<React.SetStateAction<string[]>>; // <<< ALTERADO PARA string[] >>>
    addNextFocusPlan: (plan: string) => void; // <<< NOVO >>>
    removeNextFocusPlan: (index: number) => void; // <<< NOVO >>>
    updateNextFocusPlan: (index: number, newText: string) => void; // <<< NOVO >>>
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
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

const defaultSettings: PomodoroSettings = {
    workDuration: DEFAULT_WORK_DURATION, shortBreakDuration: DEFAULT_SHORT_BREAK_DURATION,
    longBreakDuration: DEFAULT_LONG_BREAK_DURATION, cyclesBeforeLongBreak: DEFAULT_CYCLES_BEFORE_LONG_BREAK,
    soundEnabled: DEFAULT_SOUND_ENABLED,
};

interface PomodoroProviderProps {
    children: ReactNode;
}

export const PomodoroProvider: React.FC<PomodoroProviderProps> = ({ children }) => {
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
    const [nextFocusPlans, setNextFocusPlans] = useState<string[]>([]); // <<< ALTERADO PARA string[] >>>
    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
    const [activeBgColorOverride, setActiveBgColorOverride] = useState<string | null>(null);
    const [currentSessionStartTime, setCurrentSessionStartTime] = useState<number | null>(null);
    const [backlogTasks, setBacklogTasks] = useLocalStorage<BacklogTask[]>(BACKLOG_STORAGE_KEY, []);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const focusStartEffectTimeouts = useRef<NodeJS.Timeout[]>([]);
    const timerDeadlineRef = useRef<number | null>(null);
    const nextPhaseTriggeredRef = useRef<boolean>(false);

    const { playSound, debouncedPlayTypingSound, playAlarmLoop, stopAlarmLoop } = useSounds(soundEnabled);

    const isEffectRunning = focusStartEffectTimeouts.current.length > 0;

    const addFocusPoint = useCallback((point: string, playSoundEffect = true) => {
        const trimmedPoint = point.trim();
        if (trimmedPoint) {
            setCurrentFocusPoints(prev => [...prev, trimmedPoint]);
            if (playSoundEffect) playSound('confirm');
        }
    }, [setCurrentFocusPoints, playSound]);

    const removeFocusPoint = useCallback((index: number) => {
        setCurrentFocusPoints(prev => prev.filter((_, i) => i !== index));
        playSound('remove');
    }, [setCurrentFocusPoints, playSound]);

    // <<< NOVAS FUNÇÕES CRUD para nextFocusPlans >>>
    const addNextFocusPlan = useCallback((plan: string) => {
        const trimmedPlan = plan.trim();
        if (trimmedPlan) {
            setNextFocusPlans(prev => [...prev, trimmedPlan]);
            playSound('confirm');
        }
    }, [setNextFocusPlans, playSound]);

    const removeNextFocusPlan = useCallback((index: number) => {
        setNextFocusPlans(prev => prev.filter((_, i) => i !== index));
        playSound('remove');
    }, [setNextFocusPlans, playSound]);

     const updateNextFocusPlan = useCallback((index: number, newText: string) => {
        const trimmedText = newText.trim();
         if (trimmedText === '') {
             alert("O plano não pode ficar vazio."); // Ou remover? Optamos por alertar.
             return;
         }
         setNextFocusPlans(prev => prev.map((plan, i) => i === index ? trimmedText : plan));
        playSound('confirm');
    }, [setNextFocusPlans, playSound]);
    // <<< FIM NOVAS FUNÇÕES CRUD >>>


    const saveFocusToHistory = useCallback(() => {
        if (currentSessionStartTime === null) return;
        const newEntry: HistoryEntry = {
            id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            startTime: currentSessionStartTime, endTime: Date.now(), duration: initialDuration,
            focusPoints: currentFocusPoints, feedbackNotes: '',
        };
        setHistory((prevHistory) => [newEntry, ...prevHistory].sort((a, b) => b.startTime - a.startTime));
    }, [currentFocusPoints, initialDuration, setHistory, currentSessionStartTime]);

    const updateBreakInfoInHistory = useCallback(() => {
        const feedback = currentFeedbackNotes.trim();
        // <<< USA o array de planos diretamente >>>
        const plans = nextFocusPlans.filter(p => p.trim() !== ''); // Garante que só salvemos planos válidos

        if (feedback === '' && plans.length === 0) return; // Só atualiza se houver feedback ou planos válidos

        setHistory((prevHistory) => {
            if (prevHistory.length === 0) return prevHistory;
            const lastEntry = prevHistory[0];

            const needsFeedbackUpdate = lastEntry.feedbackNotes === '' && feedback !== '';
            // <<< Compara arrays (verifica se são diferentes ou se um deles tem planos e o outro não) >>>
            const needsPlansUpdate = (!lastEntry.nextFocusPlans || lastEntry.nextFocusPlans.length === 0) && plans.length > 0 ||
                                      (lastEntry.nextFocusPlans && JSON.stringify(lastEntry.nextFocusPlans) !== JSON.stringify(plans));

            if (needsFeedbackUpdate || needsPlansUpdate) {
                const updates: HistoryUpdateData = {};
                if (needsFeedbackUpdate) updates.feedbackNotes = feedback;
                // <<< Salva o array de planos, ou undefined se estiver vazio >>>
                if (needsPlansUpdate) updates.nextFocusPlans = plans.length > 0 ? plans : undefined;

                return [{ ...lastEntry, ...updates }, ...prevHistory.slice(1)];
            }
            return prevHistory;
        });
    }, [currentFeedbackNotes, nextFocusPlans, setHistory]); // nextFocusPlans é array agora

    const updateHistoryEntry = useCallback((id: string, updatedData: HistoryUpdateData) => {
        // <<< Garante que nextFocusPlans seja undefined se for um array vazio ou só com strings vazias >>>
        if (updatedData.nextFocusPlans && updatedData.nextFocusPlans.filter(p => p.trim() !== '').length === 0) {
            updatedData.nextFocusPlans = undefined;
        }
        setHistory(prevHistory => prevHistory.map(entry => entry.id === id ? { ...entry, ...updatedData } : entry).sort((a, b) => b.startTime - a.startTime));
        playSound('confirm');
    }, [setHistory, playSound]);

    const deleteHistoryEntry = useCallback((id: string) => {
        playSound('select');
        setTimeout(() => {
            if (window.confirm("Tem certeza que deseja remover esta entrada do histórico?")) {
                setHistory(prevHistory => prevHistory.filter(entry => entry.id !== id));
                playSound('remove');
            }
        }, 0);
    }, [setHistory, playSound]);

    const addManualHistoryEntry = useCallback((entryData: ManualHistoryEntryData) => {
        const newEntry: HistoryEntry = { ...entryData, id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}` };
        setHistory(prevHistory => [newEntry, ...prevHistory].sort((a, b) => b.startTime - a.startTime));
        playSound('confirm');
    }, [setHistory, playSound]);

    const clearHistory = useCallback(() => {
        playSound('select');
        setTimeout(() => {
            if (window.confirm("Tem certeza que deseja limpar todo o histórico de foco?")) {
                setHistory([]);
                playSound('remove');
            }
        }, 0);
     }, [playSound, setHistory]);

    const addBacklogTask = useCallback((text: string) => {
        const trimmedText = text.trim();
        if (!trimmedText) return;
        const newTask: BacklogTask = { id: `backlog-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, text: trimmedText, };
        setBacklogTasks(prev => [newTask, ...prev]); playSound('confirm');
    }, [setBacklogTasks, playSound]);

    const updateBacklogTask = useCallback((id: string, newText: string) => {
        const trimmedText = newText.trim();
        if (!trimmedText) { alert("A tarefa não pode ficar vazia."); return; }
        setBacklogTasks(prev => prev.map(task => task.id === id ? { ...task, text: trimmedText } : task )); playSound('confirm');
    }, [setBacklogTasks, playSound]);

    const deleteBacklogTask = useCallback((id: string, playSoundEffect = true) => {
        setBacklogTasks(prev => prev.filter(task => task.id !== id));
        if (playSoundEffect) playSound('remove');
    }, [setBacklogTasks, playSound]);

    const clearBacklog = useCallback(() => {
        playSound('select');
        setTimeout(() => {
            if (window.confirm("Tem certeza que deseja limpar todas as tarefas do backlog?")) {
                setBacklogTasks([]);
                playSound('remove');
            }
        }, 0);
    }, [playSound, setBacklogTasks]);

    const moveTaskToFocus = useCallback((taskId: string) => {
        const taskToMove = backlogTasks.find(task => task.id === taskId);
        if (!taskToMove) { console.warn("Tarefa não encontrada para mover:", taskId); return; }
        addFocusPoint(taskToMove.text, false);
        deleteBacklogTask(taskId, false);
        playSound('confirm');
    }, [backlogTasks, addFocusPoint, deleteBacklogTask, playSound]);

    const clearFocusStartEffect = useCallback(() => {
        focusStartEffectTimeouts.current.forEach(clearTimeout);
        focusStartEffectTimeouts.current = []; setActiveBgColorOverride(null);
    }, []);

    const handleNextPhase = useCallback((timerFinished: boolean) => {
        if (nextPhaseTriggeredRef.current) return;
        nextPhaseTriggeredRef.current = true;
        clearFocusStartEffect(); setIsRunning(false); timerDeadlineRef.current = null; stopAlarmLoop();

        if (timerFinished) { if (document.hidden) playAlarmLoop(); else playSound('alarm'); }

        let nextPhase: Phase; let nextDuration: number; let nextCycleCount = cycleCount;
        if (currentPhase === 'Work') {
            saveFocusToHistory();
            setCurrentFocusPoints([]);
            setCurrentSessionStartTime(null);
            nextCycleCount++; setCycleCount(nextCycleCount);
            nextPhase = (nextCycleCount > 0 && nextCycleCount % cyclesBeforeLongBreak === 0) ? 'Long Break' : 'Short Break';
            nextDuration = nextPhase === 'Long Break' ? longBreakDuration : shortBreakDuration;
        } else {
            updateBreakInfoInHistory(); // Salva feedback e planos (array) no histórico
            setCurrentFeedbackNotes('');
            setNextFocusPlans([]); // <<< LIMPAR ARRAY DE PLANOS >>>

            nextPhase = 'Work'; nextDuration = workDuration;
        }

        setCurrentPhase(nextPhase); setTimeLeft(nextDuration); setInitialDuration(nextDuration);
        setTimeout(() => { nextPhaseTriggeredRef.current = false; }, 100);

    }, [
        currentPhase, cycleCount, saveFocusToHistory, workDuration, shortBreakDuration, longBreakDuration,
        cyclesBeforeLongBreak, playSound, playAlarmLoop, stopAlarmLoop, clearFocusStartEffect,
        updateBreakInfoInHistory, // Função atualizada
        setCurrentFocusPoints, setCurrentFeedbackNotes, setCycleCount, setCurrentPhase, setTimeLeft,
        setInitialDuration, setCurrentSessionStartTime, setIsRunning, setNextFocusPlans
    ]);

    const startPauseTimer = useCallback(() => {
        stopAlarmLoop(); playSound('buttonPress');
        const effectIsCurrentlyActive = focusStartEffectTimeouts.current.length > 0;
        if (!isRunning && !effectIsCurrentlyActive) {
            if (currentPhase === 'Work' && currentFocusPoints.length === 0) { alert('Por favor, adicione pelo menos um ponto de foco.'); return; }
            setInitialDuration(timeLeft); timerDeadlineRef.current = Date.now() + timeLeft * 1000; nextPhaseTriggeredRef.current = false;
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
        } else if (isRunning || effectIsCurrentlyActive) {
            clearFocusStartEffect(); setIsRunning(false);
        }
     }, [
        stopAlarmLoop, isRunning, currentPhase, currentFocusPoints, history, timeLeft, playSound,
        clearFocusStartEffect, setInitialDuration, setCurrentSessionStartTime,
        setActiveBgColorOverride, setIsRunning, settings
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
        if (currentPhase === 'Work') {
            setCurrentFocusPoints([]);
        } else {
             setNextFocusPlans([]); // <<< LIMPAR ARRAY >>>
             setCurrentFeedbackNotes('');
        }
    }, [
        stopAlarmLoop, playSound, clearFocusStartEffect, currentPhase, workDuration, shortBreakDuration, longBreakDuration,
        setCurrentSessionStartTime, setIsRunning, setTimeLeft, setInitialDuration, setCurrentFocusPoints,
        setNextFocusPlans, setCurrentFeedbackNotes
    ]);

    const skipPhase = useCallback(() => {
        stopAlarmLoop(); playSound('buttonPress'); clearFocusStartEffect();
        if (currentPhase === 'Short Break' || currentPhase === 'Long Break') {
            updateBreakInfoInHistory();
        }
        setCurrentFeedbackNotes('');
        setNextFocusPlans([]); // <<< LIMPAR ARRAY >>>

        timerDeadlineRef.current = null; nextPhaseTriggeredRef.current = false;
        handleNextPhase(false);
     }, [
        stopAlarmLoop, playSound, clearFocusStartEffect, currentPhase, handleNextPhase,
        updateBreakInfoInHistory, setCurrentFeedbackNotes, setNextFocusPlans
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
             }
             return newSettings;
         });
     }, [playSound, setSettings, isRunning, isEffectRunning, currentPhase, initialDuration, timeLeft, setTimeLeft, setInitialDuration]);

    const adjustTimeLeft = useCallback((newSeconds: number) => {
        if (currentPhase === 'Work' && !isRunning && !isEffectRunning) {
            const validatedSeconds = Math.max(0, Math.min(newSeconds, 99 * 60 + 59));
            if (validatedSeconds !== timeLeft) { setTimeLeft(validatedSeconds); playSound('buttonPress'); }
        }
     }, [currentPhase, isRunning, isEffectRunning, playSound, timeLeft, setTimeLeft]);

    useEffect(() => {
        if (!isRunning && !isEffectRunning) {
            const durationSettingKeyMap: Record<Phase, keyof PomodoroSettings> = { 'Work': 'workDuration', 'Short Break': 'shortBreakDuration', 'Long Break': 'longBreakDuration' };
            const relevantSettingKey = durationSettingKeyMap[currentPhase];
            const currentSettingDuration = settings[relevantSettingKey] as number;
            if (currentSettingDuration !== initialDuration) {
                if (timeLeft === initialDuration) { setTimeLeft(currentSettingDuration); }
                setInitialDuration(currentSettingDuration);
            }
        }
    }, [settings, currentPhase, isRunning, isEffectRunning, initialDuration, timeLeft, setTimeLeft, setInitialDuration]);

    useEffect(() => {
        const tick = () => {
            if (!timerDeadlineRef.current || !isRunning) return;
            const now = Date.now();
            const remainingMs = timerDeadlineRef.current - now;
            const newTimeLeft = Math.max(0, Math.round(remainingMs / 1000));
            setTimeLeft(currentTime => (currentTime !== newTimeLeft ? newTimeLeft : currentTime));
            if (remainingMs <= 0 && !nextPhaseTriggeredRef.current) {
                 if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
                 handleNextPhase(true);
             }
        };
        if (isRunning) {
             if (!timerDeadlineRef.current) { timerDeadlineRef.current = Date.now() + timeLeft * 1000; }
            if (intervalRef.current) clearInterval(intervalRef.current);
            tick();
            intervalRef.current = setInterval(tick, TIMER_UI_UPDATE_INTERVAL_MS);
            nextPhaseTriggeredRef.current = false;
            stopAlarmLoop();
        } else {
            if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
        }
        return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
     }, [isRunning, timeLeft, handleNextPhase, stopAlarmLoop]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                stopAlarmLoop();
                if (isRunning && timerDeadlineRef.current) {
                    const now = Date.now();
                    const remainingMs = timerDeadlineRef.current - now;
                    const correctedTimeLeft = Math.max(0, Math.round(remainingMs / 1000));
                    setTimeLeft(currentTime => currentTime !== correctedTimeLeft ? correctedTimeLeft : currentTime);
                    if (remainingMs <= 0 && !nextPhaseTriggeredRef.current) {
                        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
                        handleNextPhase(true);
                    }
                }
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
      }, [isRunning, handleNextPhase, stopAlarmLoop]);

    useEffect(() => {
        const baseTitle = "PomoHero";
        document.title = isRunning ? `${formatTime(timeLeft)} - ${baseTitle}` : baseTitle;
    }, [isRunning, timeLeft]);

    const styles = useMemo((): DynamicStyles => {
        let baseBg: string;
        let timerHighlightBorder = ''; // <<< Adicionar variável
        let txt = '', prog = '', btn = '', btnAct = '', inputBg = '', histBorder = '', phase = '', modalAcc = '';

        if (currentPhase === 'Work') {
            baseBg = isRunning ? WORK_BG_RUNNING : WORK_BG_PAUSED;
            txt = 'text-slate-100'; prog = 'bg-slate-400';
            btn = 'bg-white/10 hover:bg-white/20 text-slate-100'; btnAct = 'bg-white/25 text-white';
            inputBg = 'bg-black/30 placeholder-slate-400/70 focus:ring-slate-400';
            phase = "Foco"; modalAcc = 'ring-slate-500';
            histBorder = isRunning ? 'border-purple-600/50' : 'border-slate-600/50';
            timerHighlightBorder = isRunning ? 'border-purple-600' : 'border-slate-600'; // <<< Definir cor sem opacidade
        } else if (currentPhase === 'Short Break') {
            baseBg = isRunning ? SHORT_BREAK_BG_RUNNING : SHORT_BREAK_BG_PAUSED;
            txt = 'text-cyan-100'; prog = 'bg-cyan-500';
            btn = 'bg-white/10 hover:bg-white/20 text-cyan-100'; btnAct = 'bg-white/25 text-white';
            inputBg = 'bg-black/30 placeholder-cyan-600/70 focus:ring-cyan-500';
            histBorder = 'border-cyan-600/50'; phase = "Pausa Curta"; modalAcc = 'ring-cyan-500';
            timerHighlightBorder = isRunning ? 'border-cyan-500' : 'border-cyan-600'; // <<< Definir cor sem opacidade
        } else { // Long Break
            baseBg = isRunning ? LONG_BREAK_BG_RUNNING : LONG_BREAK_BG_PAUSED;
            txt = 'text-teal-100'; prog = 'bg-teal-500';
            btn = 'bg-white/10 hover:bg-white/20 text-teal-100'; btnAct = 'bg-white/25 text-white';
            inputBg = 'bg-black/30 placeholder-teal-600/70 focus:ring-teal-500';
            histBorder = 'border-teal-600/50'; phase = "Pausa Longa"; modalAcc = 'ring-teal-500';
            timerHighlightBorder = isRunning ? 'border-teal-500' : 'border-teal-600'; // <<< Definir cor sem opacidade
        }

        let finalBg = baseBg; let finalHistBorder = histBorder;

        if (activeBgColorOverride) {
            finalBg = activeBgColorOverride;
             if (currentPhase === 'Work') {
                if (activeBgColorOverride === EFFECT_FLASH_COLOR_1) {
                    finalHistBorder = 'border-purple-700/50';
                    timerHighlightBorder = 'border-purple-700'; // <<< Atualizar durante flash
                } else if (activeBgColorOverride === WORK_BG_PAUSED) {
                     finalHistBorder = 'border-slate-600/50';
                     timerHighlightBorder = 'border-slate-600'; // <<< Atualizar durante flash
                 } else if (activeBgColorOverride === WORK_BG_RUNNING) {
                     finalHistBorder = 'border-purple-600/50';
                     timerHighlightBorder = 'border-purple-600'; // <<< Atualizar durante flash
                 }
             }
        }
        return {
            baseBgColor: baseBg,
            finalHistoryBorderColor: finalHistBorder,
            timerHighlightBorderColor: timerHighlightBorder, // <<< Retornar nova propriedade
            textColor: txt, progressColor: prog, buttonColor: btn,
            buttonActiveColor: btnAct, inputBgColor: inputBg, phaseText: phase,
            modalAccentColor: modalAcc, finalBgColor: finalBg,
        };
    }, [currentPhase, isRunning, activeBgColorOverride]); // Dependencies kept

    const contextValue: PomodoroContextType = {
        settings, currentPhase, timeLeft, isRunning, cycleCount, initialDuration,
        isSettingsOpen, isEffectRunning, styles, currentFocusPoints,
        currentFeedbackNotes, nextFocusPlans, activeBgColorOverride, history, backlogTasks,
        setSettings, handleSettingChange, setCurrentFocusPoints, addFocusPoint, removeFocusPoint,
        setCurrentFeedbackNotes, setNextFocusPlans, addNextFocusPlan, removeNextFocusPlan, updateNextFocusPlan,
        startPauseTimer, resetTimer, skipPhase, clearHistory,
        openSettingsModal, closeSettingsModal, adjustTimeLeft,
        updateBreakInfoInHistory, updateHistoryEntry, deleteHistoryEntry, addManualHistoryEntry, addBacklogTask,
        updateBacklogTask, deleteBacklogTask, clearBacklog, moveTaskToFocus,
        playSound, playAlarmLoop, stopAlarmLoop, debouncedPlayTypingSound,
    };

    return (
        <PomodoroContext.Provider value={contextValue}>
            {children}
        </PomodoroContext.Provider>
    );
};

export const usePomodoro = (): PomodoroContextType => {
    const context = useContext(PomodoroContext);
    if (!context) {
        throw new Error('usePomodoro must be used within a PomodoroProvider');
    }
    return context;
};
