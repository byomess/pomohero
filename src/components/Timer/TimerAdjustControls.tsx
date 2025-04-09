import React from 'react';
import { FiMinus, FiPlus } from 'react-icons/fi';
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
    } = usePomodoro();

    const showControls = currentPhase === 'Work' && !isRunning && !isEffectRunning;
    const showDurationInfo = isRunning;

    const handleDecrement = () => {
        adjustTimeLeft(Math.max(0, timeLeft - 60));
    };

    const handleIncrement = () => {
        adjustTimeLeft(Math.min(timeLeft + 60, 99 * 60 + 59));
    };

    const isDecrementDisabled = timeLeft === 0;
    const isIncrementDisabled = timeLeft >= (99 * 60 + 59);

    return (
        <div className="flex justify-center items-center h-9 mt-2 mb-[-10px] relative z-10">
            {showControls && (
                <div className="flex justify-center items-center space-x-3">
                    <button
                        onClick={handleDecrement}
                        aria-label="Diminuir 1 minuto"
                        title="Diminuir 1 minuto"
                        className={`p-2 rounded-full ${styles.buttonColor} transition-all duration-150 ease-in-out transform active:scale-90 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-transparent focus:ring-white/50 disabled:opacity-40 disabled:cursor-not-allowed`}
                        disabled={isDecrementDisabled}
                    >
                        <FiMinus className="h-4 w-4" />
                    </button>
                    <span className="text-xs opacity-70 font-mono select-none">Ajustar Tempo</span>
                    <button
                        onClick={handleIncrement}
                        aria-label="Aumentar 1 minuto"
                        title="Aumentar 1 minuto"
                        className={`p-2 rounded-full ${styles.buttonColor} transition-all duration-150 ease-in-out transform active:scale-90 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-transparent focus:ring-white/50 disabled:opacity-40 disabled:cursor-not-allowed`}
                        disabled={isIncrementDisabled}
                    >
                        <FiPlus className="h-4 w-4" />
                    </button>
                </div>
            )}

            {showDurationInfo && (
                <div className="flex justify-center items-center">
                    <span className="text-xs opacity-70 font-mono select-none" title="Tempo configurado para esta sessão">
                        Sessão de: {formatTime(initialDuration)}
                    </span>
                </div>
            )}

            {/* If neither condition is met (e.g., paused break), this will render an empty div maintaining the height */}
        </div>
    );
};