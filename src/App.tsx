// src/App.tsx
import React, { useState, useEffect, useRef } from 'react';
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
import { AnimatePresence } from 'framer-motion';
import { CongratsModal } from './components/Modals/CongratsModal';
import { BackToFocusModal } from './components/Modals/BackToFocusModal';
import { SOSFocusModal } from './components/Modals/SOSFocusModal';
import { INTRO_AUDIO_URL } from './utils/constants';
import usePreloadAudio from './hooks/usePreloadAudio';

const PomodoroLayout: React.FC = () => {
    // Desestruture isRunning aqui também
    const { currentPhase, styles, isRunning } = usePomodoro();
    const isBreakPhase = currentPhase === 'Short Break' || currentPhase === 'Long Break';
    const isFocusPhase = currentPhase === 'Work';

    // --- Estado dos Modais ---
    const [showCongratsModal, setShowCongratsModal] = useState(false);
    const [showBackToFocusModal, setShowBackToFocusModal] = useState(false);
    const [showSOSFocusModal, setShowSOSFocusModal] = useState(false);
    const [userInteracted, setUserInteracted] = useState(false);

    const previousIsRunning = useRef(isRunning);
    const modalTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // (useEffect para modais permanece o mesmo)
    useEffect(() => {
        const justEnteredBreakPhase = previousIsRunning.current && isBreakPhase;
        const justEnteredFocusPhase = previousIsRunning.current && isFocusPhase;

        if (modalTimeoutRef.current) {
            clearTimeout(modalTimeoutRef.current);
            modalTimeoutRef.current = null;
        }

        if (justEnteredBreakPhase) {
            const congratsTimer = setTimeout(() => {
                setShowCongratsModal(true);
                modalTimeoutRef.current = setTimeout(() => {
                    setShowCongratsModal(false);
                    modalTimeoutRef.current = null;
                }, 5000);
            }, 500);
             return () => clearTimeout(congratsTimer);
        } else if (justEnteredFocusPhase) {
            const backToFocusTimer = setTimeout(() => {
                setShowBackToFocusModal(true);
                modalTimeoutRef.current = setTimeout(() => {
                    setShowBackToFocusModal(false);
                    modalTimeoutRef.current = null;
                }, 5000);
            }, 500);
             return () => clearTimeout(backToFocusTimer);
        }

        previousIsRunning.current = isRunning;

        return () => {
            if (modalTimeoutRef.current) {
                clearTimeout(modalTimeoutRef.current);
            }
        };
    }, [isRunning, currentPhase, isBreakPhase, isFocusPhase]);

    const handleShowSOSModal = () => setShowSOSFocusModal(true);
    const handleCloseSOSModal = () => setShowSOSFocusModal(false);

    // --- LÓGICA CONDICIONAL PARA ANIMAÇÃO ---
    // Determina qual classe de animação usar com base no estado
    let backgroundAnimationClass = 'animate-soft-pulse'; // Animação padrão (lenta, suave)
    if (currentPhase === 'Work' && isRunning) {
        backgroundAnimationClass = 'animate-intense-pulse'; // Animação para Work ativo (rápida, intensa)
    }
    // -----------------------------------------

    return userInteracted ? (
        // 1. Container Principal
        <div className="h-screen w-full relative font-sans overflow-hidden">

            {/* 2. Elemento de Fundo Animado (Overlay) */}
            {/* Aplica a classe de animação determinada dinamicamente */}
            <div
                className={`
                    absolute inset-0 z-0
                    ${styles.finalBgColor}
                    ${backgroundAnimationClass} {/* <-- APLICANDO A CLASSE DINÂMICA AQUI */}
                    transition-colors duration-200 ease-in-out
                `}
            />

            {/* 3. Container de Conteúdo */}
            <div className="relative z-10 h-full w-full flex flex-col items-center justify-start py-6 md:py-8 px-4">
                <SettingsButton />
                <div className="w-full max-w-7xl flex-1 min-h-0 flex flex-col lg:flex-row justify-center items-stretch gap-6 md:gap-8 pt-4">

                    {/* Coluna Esquerda */}
                    <div className="w-full lg:flex-1 order-2 lg:order-none flex flex-col gap-6 md:gap-8 min-h-0">
                        <div className="flex-1 min-h-0"> <BacklogList /> </div>
                        <div className="flex-1 min-h-0"> <MusicPlayer /> </div>
                    </div>

                    {/* Coluna Central (Timer) */}
                    <div className={`
                        w-full lg:flex-1 p-6 md:p-8 rounded-3xl shadow-2xl backdrop-blur-sm bg-black/25
                        ${styles.textColor} order-first lg:order-none flex flex-col
                        border-2 ${styles.timerHighlightBorderColor} transition-colors duration-300 ease-in-out
                    `}>
                        <PhaseIndicator onShowSOSModal={handleShowSOSModal} />
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
                            {currentPhase !== 'Work' && !isBreakPhase && <div className="flex-1 min-h-[50px]"></div>}
                            {currentPhase === 'Work' && <div className="flex-1 min-h-[50px]"></div>}
                        </div>
                        <TimerControls />
                    </div>

                    {/* Coluna Direita */}
                    <div className="w-full lg:flex-1 order-3 lg:order-none">
                        <div className="h-full"> <HistoryList /> </div>
                    </div>
                </div>

                {/* Modais */}
                <SettingsModal />
                <AnimatePresence mode="wait">
                    {showCongratsModal && <CongratsModal key="congrats-modal" />}
                    {showBackToFocusModal && <BackToFocusModal key="backtofocus-modal" />}
                    {showSOSFocusModal && <SOSFocusModal key="sosfocus-modal" onExited={handleCloseSOSModal} />}
                </AnimatePresence>
            </div>
        </div>
    ) : (
        // Tela inicial
        <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-slate-900">
            <button
                className="text-white border-2 border-white/30 rounded-xl text-lg px-6 py-3 hover:bg-white/10 transition duration-300 ease-in-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-slate-900 shadow-lg"
                onClick={() => setUserInteracted(true)}
            >
                Iniciar PomoHero
            </button>
        </div>
    );
};

// Componente App e Provider (sem alterações necessárias aqui)
const App: React.FC = () => {
    const { preloadedUrl: preloadedIntroUrl, isLoading: isPreloadingIntro, error: preloadIntroError } = usePreloadAudio(INTRO_AUDIO_URL);

    useEffect(() => {
        if (isPreloadingIntro) console.log("Pré-carregando áudio de introdução...");
        if (preloadIntroError) console.error("Erro ao pré-carregar áudio:", preloadIntroError);
        if (preloadedIntroUrl) console.log("Áudio pré-carregado pronto!");
    }, [isPreloadingIntro, preloadIntroError, preloadedIntroUrl]);

    return (
        <PomodoroProvider preloadedIntroUrl={preloadedIntroUrl}>
            <PomodoroLayout />
        </PomodoroProvider>
    );
};

export default App;