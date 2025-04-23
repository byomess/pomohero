// src/components/Layout/MainLayout.tsx
import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePomodoro } from '../../contexts/PomodoroContext';

import { TimerScreen } from '../../screens/TimerScreen';
import { BacklogScreen } from '../../screens/BacklogScreen';
import { HistoryScreen } from '../../screens/HistoryScreen';
import { MusicPlayerScreen } from '../../screens/MusicPlayerScreen';
import { SettingsScreen } from '../../screens/SettingsScreen';

import { BottomNavigationBar } from '../Navigation/BottomNavigationBar';
import { FloatingMusicButton } from '../MusicPlayer/FloatingMusicButton';
import { MusicPlayerModal } from '../MusicPlayer/MusicPlayerModal';
import { CongratsModal } from '../Modals/CongratsModal';
import { BackToFocusModal } from '../Modals/BackToFocusModal';
import { SOSFocusModal } from '../Modals/SOSFocusModal';

export type ScreenName = 'timer' | 'backlog' | 'history' | 'player' | 'settings';

const screenOrder: ScreenName[] = ['timer', 'backlog', 'history', 'player', 'settings'];

// Ajustes para suavidade e fade
const screenTransition = {
  type: "tween", // 'tween' para controle fino com 'ease'
  duration: 0.4, // Aumenta um pouco a duração para mais suavidade
  ease: [0.45, 0, 0.55, 1], // Curva de ease customizada (similar a easeInOut mais suave)
};

const screenVariants = {
  initial: (direction: 'left' | 'right') => ({
    opacity: 0, // Começa invisível
    x: direction === 'right' ? '10%' : '-10%', // Começa um pouco fora (ajustado de 100%)
  }),
  animate: {
    opacity: 1, // Fade in
    x: '0%', // Move para o centro
    transition: screenTransition,
  },
  exit: (direction: 'left' | 'right') => ({
    opacity: 0, // Fade out
    x: direction === 'right' ? '-10%' : '10%', // Sai um pouco para o lado oposto (ajustado de 100%)
    transition: { ...screenTransition, duration: screenTransition.duration * 0.8 }, // Saída um pouco mais rápida
  }),
};

export const MainLayout: React.FC = () => {
    const { currentPhase, styles, isRunning } = usePomodoro();
    const isBreakPhase = currentPhase === 'Short Break' || currentPhase === 'Long Break';
    const isFocusPhase = currentPhase === 'Work';

    const [activeScreen, setActiveScreen] = useState<ScreenName>('timer');
    const [transitionDirection, setTransitionDirection] = useState<'left' | 'right'>('right');
    const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
    const [showCongratsModal, setShowCongratsModal] = useState(false);
    const [showBackToFocusModal, setShowBackToFocusModal] = useState(false);
    const [showSOSFocusModal, setShowSOSFocusModal] = useState(false);

    const previousIsRunning = useRef(isRunning);
    const modalTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const justEnteredBreakPhase = previousIsRunning.current && isBreakPhase && !isRunning;
        const justEnteredFocusPhase = previousIsRunning.current && isFocusPhase && !isRunning;

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
             return () => { if(congratsTimer) clearTimeout(congratsTimer); };
        } else if (justEnteredFocusPhase) {
             const backToFocusTimer = setTimeout(() => {
                setShowBackToFocusModal(true);
                modalTimeoutRef.current = setTimeout(() => {
                    setShowBackToFocusModal(false);
                    modalTimeoutRef.current = null;
                }, 5000);
            }, 500);
             return () => { if(backToFocusTimer) clearTimeout(backToFocusTimer); };
        }

        previousIsRunning.current = isRunning;

        return () => {
            if (modalTimeoutRef.current) {
                clearTimeout(modalTimeoutRef.current);
            }
        };
    }, [isRunning, currentPhase, isBreakPhase, isFocusPhase]);

    const handleScreenChange = (nextScreen: ScreenName) => {
        const currentIndex = screenOrder.indexOf(activeScreen);
        const nextIndex = screenOrder.indexOf(nextScreen);

        if (nextIndex > currentIndex) {
            setTransitionDirection('right');
        } else if (nextIndex < currentIndex) {
            setTransitionDirection('left');
        }

        setActiveScreen(nextScreen);
    };


    const handleShowSOSModal = () => setShowSOSFocusModal(true);
    const handleCloseSOSModal = () => setShowSOSFocusModal(false);

    let backgroundAnimationClass = 'animate-soft-pulse';
    if (currentPhase === 'Work' && isRunning) {
        backgroundAnimationClass = 'animate-intense-pulse';
    }

    const renderScreen = () => {
        switch (activeScreen) {
            case 'timer':
                return <TimerScreen onShowSOSModal={handleShowSOSModal} />;
            case 'backlog':
                return <BacklogScreen />;
            case 'history':
                return <HistoryScreen />;
            case 'player':
                return <MusicPlayerScreen />;
            case 'settings':
                return <SettingsScreen />;
            default:
                return <TimerScreen onShowSOSModal={handleShowSOSModal}/>;
        }
    };

    return (
        <div className="h-screen w-full relative font-sans flex flex-col overflow-hidden">
            <div
                className={`
                    absolute inset-0 z-0
                    ${styles.finalBgColor}
                    ${backgroundAnimationClass}
                    transition-colors duration-200 ease-in-out
                `}
            />

            <div className="relative z-10 flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 relative">
                    <AnimatePresence mode="wait" initial={false} custom={transitionDirection}>
                        <motion.div
                            key={activeScreen}
                            custom={transitionDirection}
                            variants={screenVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="absolute inset-0 p-4 overflow-y-auto"
                        >
                            {renderScreen()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <div className="relative z-20">
                <BottomNavigationBar
                    activeScreen={activeScreen}
                    setActiveScreen={handleScreenChange}
                />
            </div>

            <FloatingMusicButton onClick={() => setIsMusicModalOpen(true)} />

            <MusicPlayerModal
                isOpen={isMusicModalOpen}
                onRequestClose={() => setIsMusicModalOpen(false)}
            />

            <AnimatePresence mode="wait">
                {showCongratsModal && <CongratsModal key="congrats-modal" />}
                {showBackToFocusModal && <BackToFocusModal key="backtofocus-modal" />}
                {showSOSFocusModal && <SOSFocusModal key="sosfocus-modal" onExited={handleCloseSOSModal} />}
            </AnimatePresence>
        </div>
    );
};