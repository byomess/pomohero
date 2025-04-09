import React from 'react';
import { usePomodoro } from '../../contexts/PomodoroContext';
import { FiPlay, FiPause, FiRotateCw, FiSkipForward } from 'react-icons/fi';

export const TimerControls: React.FC = () => {
    const {
        isRunning,
        isEffectRunning,
        currentPhase,
        currentFocusPoints,
        currentFeedbackNotes,
        history,
        startPauseTimer,
        resetTimer,
        skipPhase,
        styles
    } = usePomodoro();

    // --- Button Disabled States --- (Derived inside the component for clarity)
    const isStartDisabled = isEffectRunning || (
        !isRunning && (
            (currentPhase === 'Work' && currentFocusPoints.trim() === '') ||
            (
                (currentPhase === 'Short Break' || currentPhase === 'Long Break') &&
                history.length > 0 &&
                history[0]?.feedbackNotes === '' && // Check actual history data
                currentFeedbackNotes.trim() === ''
            )
        )
    );

    const isSkipDisabled = isEffectRunning || (
        (currentPhase === 'Short Break' || currentPhase === 'Long Break') &&
        history.length > 0 &&
        history[0]?.feedbackNotes === '' && // Check actual history data
        currentFeedbackNotes.trim() === ''
    );

    const isResetDisabled = isEffectRunning;

    return (
        <div className="flex justify-center space-x-4">
            <button
                onClick={resetTimer}
                aria-label="Resetar timer"
                className={`p-3 rounded-full font-semibold ${styles.buttonColor} transition-all duration-200 ease-in-out transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-white/50 disabled:opacity-50`}
                disabled={isResetDisabled}
            >
                <FiRotateCw className="h-5 w-5 md:h-6 md:w-6" />
            </button>
            <button
                onClick={startPauseTimer}
                aria-label={isRunning || isEffectRunning ? "Pausar timer" : "Iniciar timer"}
                className={`px-8 py-3 rounded-full font-bold text-lg uppercase tracking-wider ${isRunning || isEffectRunning ? styles.buttonActiveColor : styles.buttonColor} transition-all duration-200 ease-in-out transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={isStartDisabled}
            >
                {isRunning || isEffectRunning ? <FiPause className="h-5 w-5 md:h-6 md:w-6 inline-block" /> : <FiPlay className="h-5 w-5 md:h-6 md:w-6 inline-block" />}
            </button>
            <button
                onClick={skipPhase}
                aria-label="Pular para próxima fase"
                className={`p-3 rounded-full font-semibold ${styles.buttonColor} transition-all duration-200 ease-in-out transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={isSkipDisabled}
            >
                <FiSkipForward className="h-5 w-5 md:h-6 md:w-6" />
            </button>
        </div>
    );
};
