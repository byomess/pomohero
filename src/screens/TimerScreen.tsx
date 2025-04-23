import React from 'react';
import { FiZap } from 'react-icons/fi';

import { usePomodoro } from '../contexts/PomodoroContext';
import { TimerDisplay } from '../components/Timer/TimerDisplay';
import { ProgressCircle } from '../components/Timer/ProgressCircle';
import { TimerControls } from '../components/Timer/TimerControls';
import { PhaseIndicator } from '../components/Timer/PhaseIndicator';
import { FocusInput } from '../components/Inputs/FocusInput';
import { FeedbackInput } from '../components/Inputs/FeedbackInput';
import { NextFocusInput } from '../components/Inputs/NextFocusInput';
import { TimerAdjustControls } from '../components/Timer/TimerAdjustControls';

import { formatTime } from '../utils/formatters';


interface TimerScreenProps {
    onShowSOSModal: () => void;
}

export const TimerScreen: React.FC<TimerScreenProps> = ({ onShowSOSModal }) => {
    const { currentPhase, styles, isRunning, initialDuration } = usePomodoro();

    const isBreakPhase = currentPhase === 'Short Break' || currentPhase === 'Long Break';
    const showDurationInfo = isRunning;
    const shouldShowSOSFocusButton = currentPhase === 'Work';

    const extensionButtonStyle = `
        mb-4 px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5
        transition-all duration-150 ease-in-out transform active:scale-95
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/30
        ${styles.buttonColor} hover:bg-white/25 focus:ring-white/60
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:active:scale-100
    `;

    return (
        <div className={`
            h-full w-full max-w-md mx-auto p-4 md:p-6 rounded-4xl shadow-xl backdrop-blur-sm bg-black/20
            ${styles.textColor} flex flex-col items-center
            border-3 ${styles.timerHighlightBorderColor} transition-colors duration-300 ease-in-out
        `}>
            <PhaseIndicator onShowSOSModal={onShowSOSModal} />

            {/* Container do Círculo Principal */}
            <div className="relative my-4">
                <div className="w-60 h-60 md:w-64 md:h-64 mx-auto rounded-full flex items-center justify-center shadow-inner relative">
                    <ProgressCircle />

                    {/* Círculo Interno (com Gradiente) */}
                    <div className={`
                        absolute w-[85%] h-[85%] bg-gradient-to-br from-[rgba(255,255,255,0.05)] to-[rgba(255,255,255,0.02)]
                        rounded-full shadow-lg
                        flex flex-col items-center justify-center /* Centraliza todo o bloco interno */
                    `}>
                        {/* Bloco de Conteúdo Reestruturado */}
                        <div className="relative flex flex-col items-center"> {/* Empilha verticalmente e centraliza horizontalmente */}
                            {/* 1. Tempo Principal */}
                            <div className="mt-2">
                                <TimerDisplay />
                            </div>

                            {/* 2. Duração da Sessão (Condicional) */}
                            {showDurationInfo && (
                                <div className="absolute animate-fade-in mt-16"> {/* Margem superior pequena */}
                                    <span className="text-xs opacity-75 font-medium tracking-wide select-none" title="Tempo configurado para esta sessão">
                                        Sessão de {formatTime(initialDuration)}
                                    </span>
                                </div>
                            )}

                            {/* 3. Controles de Ajuste */}
                            <div className="absolute h-full top-0 flex items-center"> {/* Margem superior pequena/média */}
                                <TimerAdjustControls />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inputs */}
            <div className="space-y-3 mb-4 flex-1 flex flex-col min-h-0 w-full">
                {currentPhase === 'Work' && <FocusInput />}
                {isBreakPhase && (
                    <>
                        <FeedbackInput />
                        <NextFocusInput />
                    </>
                )}
                {currentPhase !== 'Work' && !isBreakPhase && <div className="min-h-[50px]"></div>}
            </div>

            {/* Botão SOS Foco */}
            {shouldShowSOSFocusButton && <button
                onClick={onShowSOSModal}
                className={extensionButtonStyle}
                title="Precisa de ajuda para focar? Ative o modo SOS!"
                aria-label="Ativar modo SOS Foco"
            >
                <FiZap className="h-4 w-4 opacity-80" aria-hidden="true" />
                <span>SOS Foco</span>
            </button>}

            {/* Controles Principais */}
            <TimerControls />
        </div>
    );
};