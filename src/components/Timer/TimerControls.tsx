import React from 'react';
import { usePomodoro } from '../../contexts/PomodoroContext';
import { FiPlay, FiPause, FiRotateCw, FiSkipForward } from 'react-icons/fi';

export const TimerControls: React.FC = () => {
    const {
        isRunning,
        isEffectRunning,
        startPauseTimer,
        resetTimer,
        skipPhase,
        styles
    } = usePomodoro();

    // Simplificado: se o efeito estiver rodando, geralmente queremos desabilitar tudo.
    const isDisabled = isEffectRunning;

    // Ajuste de classes para os botões circulares (Reset e Skip)
    const circularButtonBaseClasses = `
        rounded-full font-semibold transition-all duration-200 ease-in-out
        transform active:scale-95 focus:outline-none focus:ring-2
        focus:ring-offset-2 focus:ring-offset-transparent focus:ring-white/50
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center
    `; // Adicionado flexbox para centralizar

    const circularButtonSizeClasses = `
        w-10 h-10 md:w-12 md:h-12
    `; // Tamanho explícito w/h

    // Classes para o botão principal (Play/Pause)
    const mainButtonClasses = `
        px-8 py-3 rounded-full font-bold text-lg uppercase tracking-wider
        transition-all duration-200 ease-in-out transform active:scale-95
        focus:outline-none focus:ring-2 focus:ring-offset-2
        focus:ring-offset-transparent focus:ring-white/50
        disabled:opacity-50 disabled:cursor-not-allowed
    `;

    return (
        <div className="flex justify-center items-center space-x-4"> {/* Adicionado items-center para alinhamento vertical */}
            <button
                onClick={resetTimer}
                aria-label="Resetar timer"
                title="Resetar"
                className={`
                    ${circularButtonBaseClasses}
                    ${circularButtonSizeClasses}
                    ${styles.buttonColor}
                `}
                disabled={isDisabled}
            >
                {/* Tamanho do ícone mantido */}
                <FiRotateCw className="h-5 w-5 md:h-6 md:w-6" />
            </button>

            <button
                onClick={startPauseTimer}
                aria-label={isRunning ? "Pausar timer" : "Iniciar timer"}
                title={isRunning ? "Pausar" : "Iniciar"}
                className={`
                    ${mainButtonClasses}
                    ${isRunning ? styles.buttonActiveColor : styles.buttonColor}
                `}
                 // O botão de start/pause pode ser habilitado mesmo durante o efeito (para pausar)
                 // Vamos desabilitar apenas se o efeito estiver rodando E o timer não estiver rodando
                disabled={isEffectRunning && !isRunning}
            >
                 {/* Ícone muda baseado em isRunning, ignorando isEffectRunning aqui */}
                 {/* Garantir que o ícone sempre tenha um tamanho consistente */}
                {isRunning ? <FiPause className="h-5 w-5 md:h-6 md:w-6 inline-block" /> : <FiPlay className="h-5 w-5 md:h-6 md:w-6 inline-block" />}
            </button>

            <button
                onClick={skipPhase}
                aria-label="Pular para próxima fase"
                title="Pular fase"
                className={`
                    ${circularButtonBaseClasses}
                    ${circularButtonSizeClasses}
                    ${styles.buttonColor}
                `}
                disabled={isDisabled}
            >
                {/* Tamanho do ícone mantido */}
                <FiSkipForward className="h-5 w-5 md:h-6 md:w-6" />
            </button>
        </div>
    );
};