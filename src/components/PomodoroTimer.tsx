import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Howl } from 'howler';
import { FiPlay, FiPause, FiRotateCw, FiSkipForward, FiSettings, FiX, FiTrash2 } from 'react-icons/fi';
import debounce from 'lodash.debounce';

// --- Constants ---
const DEFAULT_WORK_DURATION = 25 * 60;
const DEFAULT_SHORT_BREAK_DURATION = 5 * 60;
const DEFAULT_LONG_BREAK_DURATION = 15 * 60;
const DEFAULT_CYCLES_BEFORE_LONG_BREAK = 4;
const DEFAULT_SOUND_ENABLED = true;
const TYPING_SOUND_DEBOUNCE_MS = 150;
const FOCUS_START_EFFECT_DURATION = 2000; // ms, should match sound length
const FOCUS_START_EFFECT_BEEP_DURATION = 200; // ms, approx duration of each beep visual flash
const FOCUS_BEEP_TIMINGS = [0, 500, 1000, 1500]; // Approximate start times (ms) of each beep in focusStart sound

// Define specific background colors used in effects/states for easier reference
const WORK_BG_PAUSED = 'bg-slate-800';
const WORK_BG_RUNNING = 'bg-purple-800';
const EFFECT_FLASH_COLOR_1 = 'bg-purple-950'; // Darker purple flash

const HISTORY_STORAGE_KEY = 'pomodoroHistory_v1';
const SETTINGS_STORAGE_KEY = 'pomodoroSettings_v1';

// --- Types ---
type Phase = 'Work' | 'Short Break' | 'Long Break';
interface HistoryEntry { id: string; endTime: number; duration: number; focusPoints: string; feedbackNotes: string; }
interface PomodoroSettings { workDuration: number; shortBreakDuration: number; longBreakDuration: number; cyclesBeforeLongBreak: number; soundEnabled: boolean; }

// --- Helpers ---
const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};
const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('pt-BR', {
        timeStyle: 'short',
        hour12: false,
    });
};
const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
    try {
        const storedValue = localStorage.getItem(key);
        if (storedValue) {
            const parsedValue = JSON.parse(storedValue);
            if (typeof parsedValue === typeof defaultValue && parsedValue !== null) {
                if (typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue)) {
                    const defaultKeys = Object.keys(defaultValue);
                    const parsedKeys = Object.keys(parsedValue);
                    if (defaultKeys.every(key => parsedKeys.includes(key))) {
                        return { ...defaultValue, ...parsedValue };
                    }
                } else if (!Array.isArray(defaultValue)) {
                    return parsedValue;
                } else if (Array.isArray(defaultValue) && Array.isArray(parsedValue)) {
                    return parsedValue;
                }
            }
        }
    } catch (error) {
        console.error(`Error loading ${key} from localStorage:`, error);
        localStorage.removeItem(key);
    }
    return defaultValue;
};

// --- Sounds ---
const soundMap = {
    click: new Howl({ src: ['/sounds/small_beep.ogg', '/sounds/small_beep.wav'], volume: 0.7 }),
    buttonPress: new Howl({ src: ['/sounds/small_beep.ogg', '/sounds/small_beep.wav'], volume: 0.7 }),
    typing: new Howl({ src: ['/sounds/typing.wav', '/sounds/typing.mp3'], volume: 0.4 }),
    alarm: new Howl({ src: ['/sounds/alarm_1.ogg', '/sounds/alarm_1.wav'], volume: 0.8 }),
    focusStart: new Howl({ src: ['/sounds/focus_start.ogg', '/sounds/focus-start.wav'], volume: 0.8 }),
};

// --- Component ---
const PomodoroTimer: React.FC = () => {
    // --- State ---
    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
    const [settings, setSettings] = useState<PomodoroSettings>(() => loadFromLocalStorage<PomodoroSettings>(SETTINGS_STORAGE_KEY, { workDuration: DEFAULT_WORK_DURATION, shortBreakDuration: DEFAULT_SHORT_BREAK_DURATION, longBreakDuration: DEFAULT_LONG_BREAK_DURATION, cyclesBeforeLongBreak: DEFAULT_CYCLES_BEFORE_LONG_BREAK, soundEnabled: DEFAULT_SOUND_ENABLED }));
    const { workDuration, shortBreakDuration, longBreakDuration, cyclesBeforeLongBreak, soundEnabled } = settings;
    const [currentPhase, setCurrentPhase] = useState<Phase>('Work');
    const [timeLeft, setTimeLeft] = useState<number>(settings.workDuration);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [cycleCount, setCycleCount] = useState<number>(0);
    const [initialDuration, setInitialDuration] = useState<number>(settings.workDuration);
    const [currentFocusPoints, setCurrentFocusPoints] = useState<string>('');
    const [currentFeedbackNotes, setCurrentFeedbackNotes] = useState<string>('');
    const [history, setHistory] = useState<HistoryEntry[]>(() => loadFromLocalStorage<HistoryEntry[]>(HISTORY_STORAGE_KEY, []));
    const [activeBgColorOverride, setActiveBgColorOverride] = useState<string | null>(null);

    // --- Refs ---
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const focusStartEffectTimeouts = useRef<NodeJS.Timeout[]>([]);

    // --- Derived State --- Check if effect is running
    const isEffectRunning = focusStartEffectTimeouts.current.length > 0;

    // --- Sound Playback ---
    const playSound = useCallback((soundName: keyof typeof soundMap) => {
        if (soundEnabled && soundMap[soundName]) {
            soundMap[soundName].play();
        }
    }, [soundEnabled]);

    const debouncedPlayTypingSound = useMemo(() => debounce(() => playSound('typing'), TYPING_SOUND_DEBOUNCE_MS), [playSound]);

    // --- Persistence Effects ---
    useEffect(() => { try { localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history)); } catch (error) { console.error("Error saving history:", error); } }, [history]);
    useEffect(() => { try { localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings)); } catch (error) { console.error("Error saving settings:", error); } }, [settings]);

    // --- Clear Focus Start Effect ---
    const clearFocusStartEffect = useCallback(() => {
        focusStartEffectTimeouts.current.forEach(clearTimeout);
        focusStartEffectTimeouts.current = [];
        setActiveBgColorOverride(null);
    }, []);

    // --- Settings Change ---
    const handleSettingChange = (settingKey: keyof PomodoroSettings, value: number | boolean) => {
        if (typeof value === 'boolean') { playSound('click'); }
        setSettings(prevSettings => {
            const newSettings = { ...prevSettings, [settingKey]: value };
            if (!isRunning && !isEffectRunning) {
                let needsTimerUpdate = false;
                let newPhaseDuration = timeLeft;
                if (settingKey === 'workDuration' && currentPhase === 'Work') { newPhaseDuration = newSettings.workDuration; needsTimerUpdate = true; }
                else if (settingKey === 'shortBreakDuration' && currentPhase === 'Short Break') { newPhaseDuration = newSettings.shortBreakDuration; needsTimerUpdate = true; }
                else if (settingKey === 'longBreakDuration' && currentPhase === 'Long Break') { newPhaseDuration = newSettings.longBreakDuration; needsTimerUpdate = true; }
                if (needsTimerUpdate) { setTimeLeft(newPhaseDuration); setInitialDuration(newPhaseDuration); }
            }
            return newSettings;
        });
    };

    // --- History Management ---
    const saveFocusToHistory = useCallback(() => {
        const newEntry: HistoryEntry = { id: `hist-${Date.now()}`, endTime: Date.now(), duration: workDuration, focusPoints: currentFocusPoints, feedbackNotes: '' };
        setHistory((prevHistory) => [newEntry, ...prevHistory]);
    }, [currentFocusPoints, workDuration]);

    const updateLastHistoryFeedback = useCallback(() => {
        if (history.length > 0 && currentFeedbackNotes.trim() !== '') {
            setHistory((prevHistory) => {
                if (prevHistory.length === 0) return prevHistory;
                const lastEntry = prevHistory[0];
                if (lastEntry && lastEntry.feedbackNotes !== currentFeedbackNotes) {
                    const updatedEntry = { ...lastEntry, feedbackNotes: currentFeedbackNotes };
                    return [updatedEntry, ...prevHistory.slice(1)];
                } return prevHistory;
            });
        }
    }, [currentFeedbackNotes, history.length]);

    // --- Phase Logic ---
    const handleNextPhase = useCallback((timerFinished: boolean) => {
        clearFocusStartEffect();
        setIsRunning(false);
        if (timerFinished) { playSound('alarm'); }
        let nextPhase: Phase; let nextDuration: number; let nextCycleCount = cycleCount;
        if (currentPhase === 'Work') {
            saveFocusToHistory(); setCurrentFocusPoints(''); nextCycleCount++; setCycleCount(nextCycleCount);
            if (nextCycleCount > 0 && nextCycleCount % cyclesBeforeLongBreak === 0) { nextPhase = 'Long Break'; nextDuration = longBreakDuration; }
            else { nextPhase = 'Short Break'; nextDuration = shortBreakDuration; }
        } else {
            if (!timerFinished && currentFeedbackNotes.trim() !== '') {
                const lastHistoryEntry = history[0];
                if (lastHistoryEntry && lastHistoryEntry.feedbackNotes === '') { updateLastHistoryFeedback(); }
            }
            setCurrentFeedbackNotes(''); nextPhase = 'Work'; nextDuration = workDuration;
        }
        setCurrentPhase(nextPhase); setTimeLeft(nextDuration); setInitialDuration(nextDuration);
    }, [currentPhase, cycleCount, saveFocusToHistory, updateLastHistoryFeedback, currentFeedbackNotes, history, workDuration, shortBreakDuration, longBreakDuration, cyclesBeforeLongBreak, playSound, clearFocusStartEffect]);

    // --- Timer Interval ---
    useEffect(() => {
        if (isRunning) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = setInterval(() => {
                setTimeLeft((prevTime) => {
                    if (prevTime <= 1) {
                        if (intervalRef.current) clearInterval(intervalRef.current);
                        handleNextPhase(true); return 0;
                    } return prevTime - 1;
                });
            }, 1000);
        } else { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isRunning, handleNextPhase]);


    // --- Control Handlers ---
    const handleStartPause = () => {
        playSound('buttonPress');
        const effectIsCurrentlyActive = focusStartEffectTimeouts.current.length > 0; // Check ref directly

        if (!isRunning && !effectIsCurrentlyActive) {
            if (currentPhase === 'Work' && currentFocusPoints.trim() === '') { alert('Por favor, defina seus pontos de foco antes de iniciar.'); return; }
            if ((currentPhase === 'Short Break' || currentPhase === 'Long Break') && history.length > 0 && history[0]?.feedbackNotes === '') {
                if (currentFeedbackNotes.trim() === '') { alert('Por favor, adicione seu feedback da sessão de foco anterior antes de iniciar a pausa.'); return; }
                else { updateLastHistoryFeedback(); }
            }

            if (currentPhase === 'Work') {
                playSound('focusStart');

                const flashColor = EFFECT_FLASH_COLOR_1;
                const pausedBaseColor = WORK_BG_PAUSED;
                const runningColor = WORK_BG_RUNNING;

                const t1_start = setTimeout(() => setActiveBgColorOverride(flashColor), FOCUS_BEEP_TIMINGS[0]);
                const t1_end = setTimeout(() => setActiveBgColorOverride(pausedBaseColor), FOCUS_BEEP_TIMINGS[0] + FOCUS_START_EFFECT_BEEP_DURATION);
                const t2_start = setTimeout(() => setActiveBgColorOverride(flashColor), FOCUS_BEEP_TIMINGS[1]);
                const t2_end = setTimeout(() => setActiveBgColorOverride(pausedBaseColor), FOCUS_BEEP_TIMINGS[1] + FOCUS_START_EFFECT_BEEP_DURATION);
                const t3_start = setTimeout(() => setActiveBgColorOverride(flashColor), FOCUS_BEEP_TIMINGS[2]);
                const t3_end = setTimeout(() => setActiveBgColorOverride(pausedBaseColor), FOCUS_BEEP_TIMINGS[2] + FOCUS_START_EFFECT_BEEP_DURATION);
                const t4_start = setTimeout(() => setActiveBgColorOverride(runningColor), FOCUS_BEEP_TIMINGS[3]);

                focusStartEffectTimeouts.current = [t1_start, t1_end, t2_start, t2_end, t3_start, t3_end, t4_start];

                const t_run = setTimeout(() => {
                    if (focusStartEffectTimeouts.current.length > 0) {
                        setIsRunning(true);
                        focusStartEffectTimeouts.current = []; // Clear refs *after* setting running
                    } else {
                        setActiveBgColorOverride(null); // Ensure reset if cancelled
                    }
                }, FOCUS_START_EFFECT_DURATION);

                focusStartEffectTimeouts.current.push(t_run);

            } else {
                setIsRunning(true);
            }

        } else if (isRunning || effectIsCurrentlyActive) {
            clearFocusStartEffect();
            setIsRunning(false);
        }
    };

    const handleReset = () => {
        playSound('buttonPress');
        clearFocusStartEffect();
        setIsRunning(false);
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
        let duration;
        switch (currentPhase) { case 'Work': duration = workDuration; break; case 'Short Break': duration = shortBreakDuration; break; case 'Long Break': duration = longBreakDuration; break; default: duration = workDuration; }
        setTimeLeft(duration); setInitialDuration(duration);
        if (timeLeft === initialDuration) { if (currentPhase === 'Work') setCurrentFocusPoints(''); }
    };

    const handleSkip = () => {
        playSound('buttonPress');
        clearFocusStartEffect();
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
        if (currentPhase === 'Work') { handleNextPhase(false); }
        else {
            if (history.length > 0 && history[0]?.feedbackNotes === '') {
                if (currentFeedbackNotes.trim() === '') { alert('Por favor, adicione seu feedback da sessão de foco anterior antes de pular a pausa.'); return; }
            } handleNextPhase(false);
        }
    };

    const handleClearHistory = () => {
        playSound('buttonPress');
        if (window.confirm("Tem certeza que deseja limpar todo o histórico de foco? Esta ação não pode ser desfeita.")) {
            setHistory([]); alert("Histórico limpo.");
        }
    };

    const openSettings = () => { playSound('click'); setIsSettingsOpen(true); }
    const closeSettings = () => { playSound('click'); setIsSettingsOpen(false); }

    const handleTextAreaKeyDown = useCallback(() => { debouncedPlayTypingSound(); }, [debouncedPlayTypingSound]);

    // --- Dynamic Styling ---
    const { baseBgColor, finalHistoryBorderColor, textColor, progressColor, buttonColor, buttonActiveColor, inputBgColor, phaseText, modalAccentColor } = useMemo(() => {
        let baseBg: string;
        let txt = 'text-gray-200'; let prog = 'bg-red-500'; let btn = 'bg-white/10 hover:bg-white/20 text-gray-200'; let btnAct = 'bg-white/25 text-white'; let inputBg = 'bg-black/30 placeholder-gray-500 focus:ring-red-500'; let histBorder = 'border-red-600/50'; let phase = "Foco"; let modalAcc = 'ring-red-500';

        // Determine Base Colors (excluding history border for now)
        if (currentPhase === 'Work') {
            baseBg = isRunning ? WORK_BG_RUNNING : WORK_BG_PAUSED;
            txt = 'text-slate-100'; prog = 'bg-slate-400'; btn = 'bg-white/10 hover:bg-white/20 text-slate-100'; btnAct = 'bg-white/25 text-white'; inputBg = 'bg-black/30 placeholder-slate-400/70 focus:ring-slate-400'; /* histBorder based on state below */ phase = "Foco"; modalAcc = 'ring-slate-500';
        } else if (currentPhase === 'Short Break') {
            baseBg = 'bg-gradient-to-br from-sky-900 to-cyan-950';
            txt = 'text-cyan-100'; prog = 'bg-cyan-500'; btn = 'bg-white/10 hover:bg-white/20 text-cyan-100'; btnAct = 'bg-white/25 text-white'; inputBg = 'bg-black/30 placeholder-cyan-600/70 focus:ring-cyan-500'; histBorder = 'border-cyan-600/50'; phase = "Pausa Curta"; modalAcc = 'ring-cyan-500';
        } else { // Long Break
            baseBg = 'bg-gradient-to-br from-emerald-900 to-teal-950';
            txt = 'text-teal-100'; prog = 'bg-teal-500'; btn = 'bg-white/10 hover:bg-white/20 text-teal-100'; btnAct = 'bg-white/25 text-white'; inputBg = 'bg-black/30 placeholder-teal-600/70 focus:ring-teal-500'; histBorder = 'border-teal-600/50'; phase = "Pausa Longa"; modalAcc = 'ring-teal-500';
        }

        // Determine finalHistoryBorderColor based on override or current state
        let finalHistBorder: string;
        if (activeBgColorOverride) {
            if (activeBgColorOverride === EFFECT_FLASH_COLOR_1) {
                finalHistBorder = 'border-purple-700/50'; // Darker purple accent during flash
            } else if (activeBgColorOverride === WORK_BG_PAUSED) {
                finalHistBorder = 'border-slate-600/50'; // Paused work accent
            } else if (activeBgColorOverride === WORK_BG_RUNNING) {
                finalHistBorder = 'border-purple-600/50'; // Running work accent
            } else {
                // Fallback if override is unexpected (shouldn't happen)
                finalHistBorder = currentPhase === 'Work' ? 'border-slate-600/50' : (currentPhase === 'Short Break' ? 'border-cyan-600/50' : 'border-teal-600/50');
            }
        } else { // No override, determine based on phase
            finalHistBorder = currentPhase === 'Work' ? 'border-slate-600/50' : (currentPhase === 'Short Break' ? 'border-cyan-600/50' : 'border-teal-600/50');
        }

        return { baseBgColor: baseBg, finalHistoryBorderColor: finalHistBorder, textColor: txt, progressColor: prog, buttonColor: btn, buttonActiveColor: btnAct, inputBgColor: inputBg, phaseText: phase, modalAccentColor: modalAcc };
    }, [currentPhase, isRunning, activeBgColorOverride]); // Added dependencies

    const readOnlyInputStyle = 'read-only:bg-black/20 read-only:opacity-70 read-only:cursor-default focus:read-only:ring-0';
    const finalBgColor = activeBgColorOverride ?? baseBgColor;

    // --- Button Disabled States ---
    const effectIsCurrentlyActive = focusStartEffectTimeouts.current.length > 0;
    const isStartDisabled = effectIsCurrentlyActive ||
        (!isRunning && ((currentPhase === 'Work' && currentFocusPoints.trim() === '') || ((currentPhase === 'Short Break' || currentPhase === 'Long Break') && history.length > 0 && history[0]?.feedbackNotes === '' && currentFeedbackNotes.trim() === '')));
    const isSkipDisabled = effectIsCurrentlyActive ||
        ((currentPhase === 'Short Break' || currentPhase === 'Long Break') && history.length > 0 && history[0]?.feedbackNotes === '' && currentFeedbackNotes.trim() === '');
    const isResetDisabled = effectIsCurrentlyActive;

    const progressPercentage = useMemo(() => {
        if (initialDuration === 0) return 0;
        const percentage = ((initialDuration - timeLeft) / initialDuration) * 100;
        return Math.min(percentage, 100); // Ensure it doesn't exceed 100%
    }
        , [initialDuration, timeLeft]);

    // --- Render ---
    return (
        <div className={`min-h-screen w-full flex flex-col items-center justify-start py-10 px-4 ${finalBgColor} transition-colors duration-200 ease-in-out relative font-sans`}> {/* Faster transition */}
            <button onClick={openSettings} aria-label="Abrir configurações" className={`absolute top-4 right-4 p-2 rounded-full ${buttonColor} transition-colors duration-200 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 z-20 disabled:opacity-50`} disabled={effectIsCurrentlyActive} >
                <FiSettings className="h-5 w-5" />
            </button>

            <div className="w-full max-w-6xl flex flex-col md:flex-row justify-center items-center md:items-start gap-8">
                {/* Timer Section */}
                <div className={`w-full max-w-md p-6 md:p-8 rounded-3xl shadow-2xl backdrop-blur-sm bg-black/20 ${textColor} md:flex-shrink-0`}>
                    <div className="text-center mb-6">
                        <span className={`text-2xl font-semibold tracking-wider uppercase transition-colors duration-500 ${textColor}`}>{phaseText}</span>
                        <p className="text-sm opacity-80 mt-1">Ciclos completos: {cycleCount}</p>
                    </div>
                    <div className="relative mb-8">
                        <div className="w-64 h-64 md:w-72 md:h-72 mx-auto bg-black/20 rounded-full flex items-center justify-center shadow-inner">
                            <div className="absolute top-0 left-0 w-full h-full rounded-full" style={{ background: `conic-gradient(${progressColor} ${progressPercentage * 3.6}deg, transparent ${progressPercentage * 3.6}deg)`, transition: 'background 0.3s linear' }} ></div>
                            <div className="absolute w-[85%] h-[85%] bg-gradient-to-br from-[rgba(255,255,255,0.05)] to-[rgba(255,255,255,0.02)] rounded-full shadow-lg"></div>
                            <div className={`relative z-10 text-6xl md:text-7xl font-mono font-bold transition-colors duration-500 ${textColor}`}>{formatTime(timeLeft)}</div>
                        </div>
                    </div>
                    <div className="space-y-4 mb-8 min-h-[80px]">
                        {currentPhase === 'Work' && (<div> <label htmlFor="focusPoints" className="block text-sm font-medium opacity-90 mb-1">Pontos de foco: {!isRunning && !effectIsCurrentlyActive && '(Editável)'} {(isRunning || effectIsCurrentlyActive) && '(Em andamento)'}</label> <textarea id="focusPoints" rows={2} value={currentFocusPoints} onChange={(e) => setCurrentFocusPoints(e.target.value)} placeholder="Defina seus pontos de foco..." onKeyDown={handleTextAreaKeyDown} className={`w-full p-2 rounded-lg border-none focus:ring-2 focus:outline-none text-sm resize-none ${inputBgColor} ${textColor} transition-colors duration-500 ${readOnlyInputStyle}`} readOnly={isRunning || effectIsCurrentlyActive} /> </div>)}
                        {(currentPhase === 'Short Break' || currentPhase === 'Long Break') && (<div> <label htmlFor="feedbackNotes" className="block text-sm font-medium opacity-90 mb-1">Feedback da sessão anterior: {history.length > 0 && history[0]?.feedbackNotes !== '' ? ' (Salvo)' : !isRunning ? ' (Editável - Obrigatório)' : ' (Em andamento)'}</label> <textarea id="feedbackNotes" rows={2} value={currentFeedbackNotes} onChange={(e) => { if (!isRunning && !(history.length > 0 && history[0]?.feedbackNotes !== '')) { setCurrentFeedbackNotes(e.target.value) } }} placeholder={history.length > 0 && history[0]?.feedbackNotes !== '' ? history[0].feedbackNotes : "Como foi a última sessão de foco? (Obrigatório)"} onKeyDown={handleTextAreaKeyDown} className={`w-full p-2 rounded-lg border-none focus:ring-2 focus:outline-none text-sm resize-none ${inputBgColor} ${textColor} transition-colors duration-500 ${readOnlyInputStyle}`} readOnly={isRunning || (history.length > 0 && history[0]?.feedbackNotes !== '')} /> </div>)}
                    </div>
                    <div className="flex justify-center space-x-4">
                        <button onClick={handleReset} aria-label="Resetar timer" className={`p-3 rounded-full font-semibold ${buttonColor} transition-all duration-200 ease-in-out transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-white/50 disabled:opacity-50`} disabled={isResetDisabled}> <FiRotateCw className="h-5 w-5 md:h-6 md:w-6" /> </button>
                        <button onClick={handleStartPause} aria-label={isRunning || effectIsCurrentlyActive ? "Pausar timer" : "Iniciar timer"} className={`px-8 py-3 rounded-full font-bold text-lg uppercase tracking-wider ${isRunning || effectIsCurrentlyActive ? buttonActiveColor : buttonColor} transition-all duration-200 ease-in-out transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed`} disabled={isStartDisabled}> {isRunning || effectIsCurrentlyActive ? <FiPause className="h-5 w-5 md:h-6 md:w-6 inline-block" /> : <FiPlay className="h-5 w-5 md:h-6 md:w-6 inline-block" />} </button>
                        <button onClick={handleSkip} aria-label="Pular para próxima fase" className={`p-3 rounded-full font-semibold ${buttonColor} transition-all duration-200 ease-in-out transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed`} disabled={isSkipDisabled}> <FiSkipForward className="h-5 w-5 md:h-6 md:w-6" /> </button>
                    </div>
                </div>

                {/* History Section */}
                <div className={`w-full max-w-md p-6 md:p-8 rounded-3xl shadow-xl backdrop-blur-sm bg-black/20 ${textColor}`}>
                    <h2 className="text-xl font-semibold mb-4 text-center opacity-90">Histórico de Foco</h2>
                    {history.length > 0 ? (
                        <ul className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                            {history.map((entry) => (
                                // Use finalHistoryBorderColor here
                                <li key={entry.id} className={`p-4 rounded-lg bg-black/20 border-l-4 ${finalHistoryBorderColor} transition-colors duration-200 ease-in-out`}> {/* Faster transition */}
                                    <div className="flex justify-between items-center mb-2 text-sm opacity-80">
                                        <span>{formatTime(entry.duration)} de Foco</span>
                                        <span>Concluído às: {formatTimestamp(entry.endTime)}</span>
                                    </div>
                                    {entry.focusPoints && (<div className="mb-2"> <p className="font-medium text-sm opacity-95">Foco:</p> <p className="text-sm whitespace-pre-wrap break-words opacity-80">{entry.focusPoints}</p> </div>)}
                                    {entry.feedbackNotes && (<div> <p className="font-medium text-sm opacity-95">Notas:</p> <p className="text-sm whitespace-pre-wrap break-words opacity-80">{entry.feedbackNotes}</p> </div>)}
                                    {!entry.focusPoints && !entry.feedbackNotes && (<p className="text-sm italic opacity-60">Nenhuma nota registrada para esta sessão.</p>)}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center opacity-70 py-8"> <p>Nenhuma sessão de foco concluída ainda.</p> <p className="text-sm mt-2">Complete uma sessão de Foco para vê-la aqui.</p> </div>
                    )}
                </div>
            </div>

            {/* Settings Modal */}
            {isSettingsOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeSettings} >
                    {/* Use baseBgColor derived from state for modal background */}
                    <div className={`relative w-full max-w-lg p-6 md:p-8 rounded-2xl shadow-xl ${baseBgColor} ${textColor} border border-white/10`} onClick={(e) => e.stopPropagation()} >
                        <button onClick={closeSettings} aria-label="Fechar configurações" className={`absolute top-3 right-3 p-2 rounded-full ${buttonColor} hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50`} >
                            <FiX className="h-5 w-5" />
                        </button>
                        <h2 className="text-2xl font-semibold mb-6 text-center">Configurações</h2>
                        <div className="space-y-5">
                            <h3 className="text-lg font-medium opacity-90 border-b border-white/10 pb-2 mb-3">Durações (minutos)</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label htmlFor="workDuration" className="block text-sm font-medium mb-1 opacity-80">Foco</label>
                                    <input type="number" id="workDuration" min="1" value={Math.round(settings.workDuration / 60)} onChange={(e) => handleSettingChange('workDuration', parseInt(e.target.value || '1', 10) * 60)} className={`w-full p-2 rounded-md border-none focus:ring-2 focus:outline-none text-sm ${inputBgColor} ${textColor} focus:${modalAccentColor}`} />
                                </div>
                                <div>
                                    <label htmlFor="shortBreakDuration" className="block text-sm font-medium mb-1 opacity-80">Pausa Curta</label>
                                    <input type="number" id="shortBreakDuration" min="1" value={Math.round(settings.shortBreakDuration / 60)} onChange={(e) => handleSettingChange('shortBreakDuration', parseInt(e.target.value || '1', 10) * 60)} className={`w-full p-2 rounded-md border-none focus:ring-2 focus:outline-none text-sm ${inputBgColor} ${textColor} focus:${modalAccentColor}`} />
                                </div>
                                <div>
                                    <label htmlFor="longBreakDuration" className="block text-sm font-medium mb-1 opacity-80">Pausa Longa</label>
                                    <input type="number" id="longBreakDuration" min="1" value={Math.round(settings.longBreakDuration / 60)} onChange={(e) => handleSettingChange('longBreakDuration', parseInt(e.target.value || '1', 10) * 60)} className={`w-full p-2 rounded-md border-none focus:ring-2 focus:outline-none text-sm ${inputBgColor} ${textColor} focus:${modalAccentColor}`} />
                                </div>
                            </div>
                            <h3 className="text-lg font-medium opacity-90 border-b border-white/10 pb-2 mb-3 pt-4">Ciclos</h3>
                            <div>
                                <label htmlFor="cyclesBeforeLongBreak" className="block text-sm font-medium mb-1 opacity-80">Ciclos de Foco antes da Pausa Longa</label>
                                <input type="number" id="cyclesBeforeLongBreak" min="1" value={settings.cyclesBeforeLongBreak} onChange={(e) => handleSettingChange('cyclesBeforeLongBreak', parseInt(e.target.value || '1', 10))} className={`w-full sm:w-1/3 p-2 rounded-md border-none focus:ring-2 focus:outline-none text-sm ${inputBgColor} ${textColor} focus:${modalAccentColor}`} />
                            </div>
                            <h3 className="text-lg font-medium opacity-90 border-b border-white/10 pb-2 mb-3 pt-4">Outros</h3>
                            <div className="flex items-center justify-between">
                                <label htmlFor="soundEnabled" className="text-sm font-medium opacity-80">Habilitar Som de Notificação</label>
                                <input type="checkbox" id="soundEnabled" checked={settings.soundEnabled} onChange={(e) => handleSettingChange('soundEnabled', e.target.checked)} className={`w-5 h-5 rounded text-${modalAccentColor.replace('ring-', '')} bg-gray-700 border-gray-600 focus:ring-${modalAccentColor.replace('ring-', '')} focus:ring-2`} />
                            </div>
                            <h3 className="text-lg font-medium opacity-90 border-b border-white/10 pb-2 mb-3 pt-4">Gerenciar Dados</h3>
                            <button onClick={handleClearHistory} className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md font-semibold text-sm bg-red-700/50 hover:bg-red-600/60 text-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500 transition-colors`} >
                                <FiTrash2 className="h-4 w-4" /> Limpar Histórico de Foco
                            </button>
                            <p className="text-xs text-center opacity-60 mt-2">Esta ação é irreversível.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PomodoroTimer;