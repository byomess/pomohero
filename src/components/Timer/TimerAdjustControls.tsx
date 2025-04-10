// src/components/Timer/TimerAdjustControls.tsx
import React from 'react';
import { FiMinus, FiPlus, FiZap, FiFastForward } from 'react-icons/fi';
import { usePomodoro } from '../../contexts/PomodoroContext';
import { formatTime } from '../../utils/formatters';

export const TimerAdjustControls: React.FC = () => {
    const {
        timeLeft,
        initialDuration,
        adjustTimeLeft,
        isRunning,
        isEffectRunning,
        currentPhase,
        styles,
        showExtensionOptions,
        extendFocusSession,
        settings,
        hasExtendedCurrentFocus, // <<< Get the state
    } = usePomodoro();

    const FIVE_MINUTES_SECONDS = 5 * 60;
    const HYPERFOCUS_SECONDS = settings.workDuration;

    const showAdjustControls = currentPhase === 'Work' && !isRunning && !isEffectRunning;
    const showDurationInfo = isRunning && currentPhase !== 'Work';
    const showExtensionControls = isRunning && currentPhase === 'Work' && showExtensionOptions && timeLeft > 0;

    const handleDecrement = () => adjustTimeLeft(Math.max(0, timeLeft - 60));
    const handleIncrement = () => adjustTimeLeft(Math.min(timeLeft + 60, 99 * 60 + 59));
    const handleExtend5Min = () => extendFocusSession(FIVE_MINUTES_SECONDS);
    const handleExtendHyperfocus = () => extendFocusSession(initialDuration);

    const isDecrementDisabled = timeLeft === 0;
    const isIncrementDisabled = timeLeft >= (99 * 60 + 59);
    const isExtensionDisabled = hasExtendedCurrentFocus; // <<< Determine if extensions are disabled

    const adjustButtonStyle = `
        p-2 rounded-full transition-all duration-150 ease-in-out transform active:scale-90
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/30 focus:ring-white/60
        disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
        ${styles.buttonColor} hover:bg-white/25
    `;

    const extensionButtonStyle = `
        px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5
        transition-all duration-150 ease-in-out transform active:scale-95
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/30
        ${styles.buttonColor} hover:bg-white/25 focus:ring-white/60
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:active:scale-100
    `;

    return (
        <div className="flex flex-col justify-center items-center min-h-[44px] mt-2 mb-[-10px] relative z-10 px-4">

            {showAdjustControls && (
                <div className="flex justify-center items-center space-x-4 animate-fade-in-down">
                    <button
                        onClick={handleDecrement} aria-label="Diminuir 1 minuto" title="Diminuir 1 minuto"
                        className={adjustButtonStyle}
                        disabled={isDecrementDisabled}
                    >
                        <FiMinus className="h-4 w-4" />
                    </button>
                    <span className="text-xs opacity-75 font-medium tracking-wide select-none">
                        Ajustar Tempo
                    </span>
                    <button
                        onClick={handleIncrement} aria-label="Aumentar 1 minuto" title="Aumentar 1 minuto"
                        className={adjustButtonStyle}
                        disabled={isIncrementDisabled}
                    >
                        <FiPlus className="h-4 w-4" />
                    </button>
                </div>
            )}

            {showDurationInfo && (
                <div className="flex justify-center items-center animate-fade-in">
                    <span className="text-xs opacity-75 font-medium tracking-wide select-none" title="Tempo configurado para esta sessão">
                        Sessão de {formatTime(initialDuration)}
                    </span>
                </div>
            )}

            {showExtensionControls && (
                <div className="flex justify-center items-center space-x-3 animate-fade-in-up">
                     <button
                        onClick={handleExtend5Min}
                        className={extensionButtonStyle}
                        title={isExtensionDisabled ? "Extensão já utilizada nesta sessão" : "Adicionar 5 minutos à sessão atual"}
                        disabled={isExtensionDisabled} // <<< Use the disabled state
                    >
                        <FiFastForward className="h-3.5 w-3.5 opacity-80" />
                        <span>+5 min</span>
                    </button>
                     <button
                        onClick={handleExtendHyperfocus}
                        className={extensionButtonStyle}
                        title={isExtensionDisabled ? "Extensão já utilizada nesta sessão" : `Adicionar ${Math.round(HYPERFOCUS_SECONDS / 60)} minutos (hiperfoco)`}
                        disabled={isExtensionDisabled} // <<< Use the disabled state
                    >
                        <FiZap className="h-3.5 w-3.5 opacity-80" />
                        <span>Hiperfoco</span>
                    </button>
                </div>
            )}
        </div>
    );
};