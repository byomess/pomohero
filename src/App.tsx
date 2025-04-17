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
import { SOSFocusModal } from './components/Modals/SOSFocusModal'; // Importar SOSFocusModal
import { INTRO_AUDIO_URL } from './utils/constants';
import usePreloadAudio from './hooks/usePreloadAudio';

const PomodoroLayout: React.FC = () => {
    const { currentPhase, styles, isRunning } = usePomodoro();
    const isBreakPhase = currentPhase === 'Short Break' || currentPhase === 'Long Break';
    const isFocusPhase = currentPhase === 'Work';

    // --- Estado dos Modais ---
    const [showCongratsModal, setShowCongratsModal] = useState(false);
    const [showBackToFocusModal, setShowBackToFocusModal] = useState(false);
    const [showSOSFocusModal, setShowSOSFocusModal] = useState(false); // Estado para SOS Focus Modal
    const [userInteracted, setUserInteracted] = useState(false); // Estado para rastrear interação inicial

    const previousIsRunning = useRef(isRunning); // Guarda o estado anterior de isRunning
    const modalTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref para o timeout dos modais automáticos

    useEffect(() => {
        const justEnteredBreakPhase = previousIsRunning.current && isBreakPhase;
        const justEnteredFocusPhase = previousIsRunning.current && isFocusPhase;

        // Limpa timeout anterior ao reavaliar
        if (modalTimeoutRef.current) {
            clearTimeout(modalTimeoutRef.current);
            modalTimeoutRef.current = null;
        }

        if (justEnteredBreakPhase) {
            const congratsTimer = setTimeout(() => {
                setShowCongratsModal(true);
                // Define um novo timeout para fechar o modal de congrats
                modalTimeoutRef.current = setTimeout(() => {
                    setShowCongratsModal(false);
                    modalTimeoutRef.current = null;
                }, 5000);
            }, 500); // Delay para exibir o modal após a transição de fase
             return () => clearTimeout(congratsTimer); // Limpa o timer de exibição se o componente desmontar ou o efeito rodar novamente
        } else if (justEnteredFocusPhase) {
            const backToFocusTimer = setTimeout(() => {
                setShowBackToFocusModal(true);
                 // Define um novo timeout para fechar o modal de back-to-focus
                modalTimeoutRef.current = setTimeout(() => {
                    setShowBackToFocusModal(false);
                    modalTimeoutRef.current = null;
                }, 5000);
            }, 500); // Delay para exibir o modal após a transição de fase
             return () => clearTimeout(backToFocusTimer); // Limpa o timer de exibição
        }

        previousIsRunning.current = isRunning;

        // Cleanup geral do timeout de fechamento automático
        return () => {
            if (modalTimeoutRef.current) {
                clearTimeout(modalTimeoutRef.current);
            }
        };
    }, [isRunning, currentPhase, isBreakPhase, isFocusPhase]); // Dependências do efeito

    // Função para abrir o SOS Focus Modal (passada para PhaseIndicator)
    const handleShowSOSModal = () => {
        setShowSOSFocusModal(true);
    };

    // Função para fechar o SOS Focus Modal (passada para SOSFocusModal)
    const handleCloseSOSModal = () => {
        setShowSOSFocusModal(false);
    };

    // Renderização condicional baseada na interação inicial do usuário
    return userInteracted ? (
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
                    {/* Passa a função para abrir o modal SOS */}
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
                        {/* Placeholder para garantir espaço mínimo se não houver inputs */}
                        {currentPhase !== 'Work' && !isBreakPhase && <div className="flex-1 min-h-[50px]"></div>}
                         {currentPhase === 'Work' && <div className="flex-1 min-h-[50px]"></div>}
                    </div>
                    <TimerControls />
                </div>

                {/* --- Coluna Direita (Histórico) --- */}
                <div className="w-full lg:flex-1 order-3 lg:order-none">
                    <div className="h-full"> <HistoryList /> </div>
                </div>
            </div>

            {/* Modal de Configurações (geralmente controlado internamente ou por contexto) */}
            <SettingsModal />

            {/* Container para Modais animados */}
            <AnimatePresence mode="wait">
                {showCongratsModal && (
                    <CongratsModal
                        key="congrats-modal"
                    />
                )}
                {showBackToFocusModal && (
                    <BackToFocusModal
                        key="backtofocus-modal"
                    />
                )}
                {showSOSFocusModal && (
                    <SOSFocusModal
                        key="sosfocus-modal"
                        onExited={handleCloseSOSModal} // Fecha quando a animação de saída termina
                    />
                )}
            </AnimatePresence>
        </div>
    ) : (
        // Tela inicial antes da interação do usuário
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

// Componente App principal que fornece o contexto
const App: React.FC = () => {
    // Chame o hook aqui, no nível que renderiza o Provider
    const { preloadedUrl: preloadedIntroUrl, isLoading: isPreloadingIntro, error: preloadIntroError } = usePreloadAudio(INTRO_AUDIO_URL);

    // Você pode usar isLoading e error para mostrar feedback se desejar
    useEffect(() => {
        if (isPreloadingIntro) {
            console.log("Pré-carregando áudio de introdução...");
        }
        if (preloadIntroError) {
            console.error("Erro ao pré-carregar áudio de introdução:", preloadIntroError);
        }
        if (preloadedIntroUrl) {
            console.log("Áudio de introdução pré-carregado pronto!");
        }
    }, [isPreloadingIntro, preloadIntroError, preloadedIntroUrl]);


    // O valor do provider agora precisa incluir a URL pré-carregada
    // Você precisa pegar os outros valores do estado gerenciado pelo PomodoroProvider
    // A forma exata de fazer isso depende de como seu PomodoroProvider é implementado internamente.
    // Se PomodoroProvider já gerencia seu próprio estado, você pode precisar
    // modificar o PomodoroProvider para aceitar preloadedIntroUrl como prop
    // ou criar um wrapper.

    // *** OPÇÃO 1: Se PomodoroProvider gerencia seu próprio estado ***
    // (Esta é a abordagem mais comum e limpa)
    // Modifique PomodoroProvider para aceitar a URL como prop:
    /*
    interface PomodoroProviderProps {
         children: React.ReactNode;
         preloadedIntroUrl: string | null; // Adicione esta prop
    }
    const PomodoroProvider = ({ children, preloadedIntroUrl }: PomodoroProviderProps) => {
         // ... seu estado interno (useState, useReducer) ...
         const contextValue: PomodoroContextState = {
             // ... seus outros valores de estado ...
             preloadedIntroUrl: preloadedIntroUrl, // Use a prop aqui
         };
         return (
             <PomodoroContext.Provider value={contextValue}>
                 {children}
             </PomodoroContext.Provider>
         );
    }
    */
    // E então use assim no App:
    return (
        <PomodoroProvider preloadedIntroUrl={preloadedIntroUrl}>
            <PomodoroLayout />
        </PomodoroProvider>
    );

    // *** OPÇÃO 2: Se você monta o value manualmente aqui (menos comum) ***
    /*
    const providerValue: PomodoroContextState = {
         // ... você precisaria ter todos os outros valores do contexto aqui ...
         // Exemplo:
         currentPhase: 'Work', // Placeholder - Isso viria do estado real
         styles: { ... }, // Placeholder
         isRunning: false, // Placeholder
         playSound: (id) => console.log(id), // Placeholder
         targetMusicVolume: 0.5, // Placeholder
         // E o valor pré-carregado:
         preloadedIntroUrl: preloadedIntroUrl,
    };
    return (
        // CUIDADO: Se PomodoroProvider tem estado interno, esta abordagem sobrescreveria tudo.
        // Use a OPÇÃO 1 se possível.
        <PomodoroContext.Provider value={providerValue}>
             <PomodoroLayout />
        </PomodoroContext.Provider>
    );
    */
};

export default App;