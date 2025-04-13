// src/App.tsx
import React, { useState, useEffect, useRef } from 'react'; // Import useState, useEffect, useRef
import { PomodoroProvider, usePomodoro } from './contexts/PomodoroContext';
import { TimerDisplay } from './components/Timer/TimerDisplay';
import { ProgressCircle } from './components/Timer/ProgressCircle';
import { TimerControls } from './components/Timer/TimerControls';
import { PhaseIndicator } from './components/Timer/PhaseIndicator';
import { FocusInput } from './components/Inputs/FocusInput';
import { FeedbackInput } from './components/Inputs/FeedbackInput';
import { NextFocusInput } from './components/Inputs/NextFocusInput';
import { HistoryList } from './components/History/HistoryList';
import { SettingsButton } from './components/Settings/SettingsButton';
import { SettingsModal } from './components/Settings/SettingsModal';
import { TimerAdjustControls } from './components/Timer/TimerAdjustControls';
import { BacklogList } from './components/Backlog/BacklogList';
import { MusicPlayer } from './components/MusicPlayer/MusicPlayer';
import { AnimatePresence } from 'framer-motion'; // Import AnimatePresence
import { CongratsModal } from './components/Modals/CongratsModal'; // Import o novo Modal

const PomodoroLayout: React.FC = () => {
    const { currentPhase, styles, isRunning } = usePomodoro();
    const isBreakPhase = currentPhase === 'Short Break' || currentPhase === 'Long Break';

    // --- Lógica do Modal de Congratulação ---
    const [showCongratsModal, setShowCongratsModal] = useState(false);
    const previousIsRunning = useRef(isRunning); // Guarda o estado anterior de isRunning
    const modalTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref para o timeout

    useEffect(() => {
        const justStartedBreakTimer =
            isRunning &&                     // O timer está rodando AGORA
            !previousIsRunning.current &&    // O timer NÃO estava rodando ANTES
            isBreakPhase;                    // Estamos em uma fase de pausa

        if (justStartedBreakTimer) {
            setTimeout(() => {
                setShowCongratsModal(true);

                // Limpa qualquer timeout anterior (segurança extra)
                if (modalTimeoutRef.current) {
                    clearTimeout(modalTimeoutRef.current);
                }
    
                // Define um timeout para esconder o modal após 3 segundos
                modalTimeoutRef.current = setTimeout(() => {
                    setShowCongratsModal(false);
                    modalTimeoutRef.current = null; // Limpa a ref do timeout
                }, 5000); // 3000ms = 3 segundos
            }, 500);
        }

        // Atualiza o estado anterior de isRunning para a próxima renderização
        previousIsRunning.current = isRunning;

        // Função de limpeza: limpa o timeout se o componente desmontar
        // ou se as dependências (isRunning, currentPhase) mudarem antes do timeout terminar.
        return () => {
            if (modalTimeoutRef.current) {
                clearTimeout(modalTimeoutRef.current);
            }
        };
    // Monitora mudanças em isRunning e currentPhase
    }, [isRunning, currentPhase, isBreakPhase]);
    // --- Fim da Lógica do Modal ---

    return (
        <div className={`
            h-screen w-full flex flex-col items-center justify-start
            py-6 md:py-8 px-4
            ${styles.finalBgColor}
            transition-colors duration-200 ease-in-out
            relative font-sans overflow-hidden
        `}>
            <SettingsButton />
            <div className="w-full max-w-7xl flex-1 min-h-0 flex flex-col lg:flex-row justify-center items-stretch gap-6 md:gap-8 pt-4">

                {/* --- Coluna Esquerda --- */}
                <div className="w-full lg:flex-1 order-2 lg:order-none flex flex-col gap-6 md:gap-8 min-h-0">
                    <div className="flex-1 min-h-0"> <BacklogList /> </div>
                    <div className="flex-1 min-h-0"> <MusicPlayer /> </div>
                </div>

                {/* --- Coluna Central (Timer) --- */}
                 <div className={`
                    w-full lg:flex-1 p-6 md:p-8 rounded-3xl shadow-2xl backdrop-blur-sm bg-black/25
                    ${styles.textColor} order-first lg:order-none flex flex-col
                    border-2 ${styles.timerHighlightBorderColor} transition-colors duration-300 ease-in-out
                `}>
                    <PhaseIndicator />
                    <div className="relative mb-4">
                        <div className="w-64 h-64 md:w-72 md:h-72 mx-auto rounded-full flex items-center justify-center shadow-inner relative">
                            <ProgressCircle />
                            <div className="absolute w-[85%] h-[85%] bg-gradient-to-br from-[rgba(255,255,255,0.05)] to-[rgba(255,255,255,0.02)] rounded-full shadow-lg flex items-center justify-center">
                                 <TimerDisplay />
                            </div>
                        </div>
                         <TimerAdjustControls />
                    </div>
                     <div className="space-y-3 mb-6 flex-1 flex flex-col min-h-0">
                        {currentPhase === 'Work' && <FocusInput />}
                        {isBreakPhase && (
                            <>
                                <FeedbackInput />
                                <div className="flex-1 min-h-0">
                                    <NextFocusInput />
                                </div>
                            </>
                         )}
                    </div>
                    <TimerControls />
                </div>

                {/* --- Coluna Direita (Histórico) --- */}
                <div className="w-full lg:flex-1 order-3 lg:order-none">
                     <div className="h-full"> <HistoryList /> </div>
                </div>
            </div>
            <SettingsModal />

            {/* Renderização Condicional do Modal com Animação */}
            <AnimatePresence>
                {showCongratsModal && <CongratsModal />}
            </AnimatePresence>
        </div>
    );
};

const App: React.FC = () => {
    return ( <PomodoroProvider> <PomodoroLayout /> </PomodoroProvider> );
};

export default App;