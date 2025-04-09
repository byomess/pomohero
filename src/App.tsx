// src/App.tsx
import React from 'react';
import { PomodoroProvider, usePomodoro } from './contexts/PomodoroContext';
import { TimerDisplay } from './components/Timer/TimerDisplay';
import { ProgressCircle } from './components/Timer/ProgressCircle';
import { TimerControls } from './components/Timer/TimerControls';
import { PhaseIndicator } from './components/Timer/PhaseIndicator';
import { FocusInput } from './components/Inputs/FocusInput';
import { FeedbackInput } from './components/Inputs/FeedbackInput';
import { HistoryList } from './components/History/HistoryList';
import { SettingsButton } from './components/Settings/SettingsButton';
import { SettingsModal } from './components/Settings/SettingsModal';
import { TimerAdjustControls } from './components/Timer/TimerAdjustControls';
import { BacklogList } from './components/Backlog/BacklogList';

const PomodoroLayout: React.FC = () => {
    const { currentPhase, styles } = usePomodoro();

    return (
        <div className={`min-h-screen w-full flex flex-col items-center justify-start py-10 px-4 ${styles.finalBgColor} transition-colors duration-200 ease-in-out relative font-sans`}>
            <SettingsButton />

            {/* Container Principal Flexível */}
            <div className="w-full max-w-7xl flex flex-col lg:flex-row justify-center items-stretch lg:items-start gap-6 md:gap-8">
                 {/* ^^ Alterado para items-stretch para que as colunas preencham a altura se necessário */}

                {/* Backlog Section (Left) */}
                {/* Adicionado lg:flex-1 */}
                <div className="w-full lg:flex-1 order-2 lg:order-none">
                    {/* Adicionado h-full para que o BacklogList possa usar flex-1 internamente */}
                    <div className="h-full">
                         <BacklogList />
                    </div>
                </div>

                {/* Timer Section (Center) */}
                {/* Adicionado lg:flex-1 e removido max-w-md, flex-shrink-0 */}
                <div className={`w-full lg:flex-1 p-6 md:p-8 rounded-3xl shadow-2xl backdrop-blur-sm bg-black/20 ${styles.textColor} order-first lg:order-none`}>
                    {/* Conteúdo do Timer permanece o mesmo */}
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
                    <div className="space-y-4 mb-6 min-h-[80px]">
                        {currentPhase === 'Work' ? <FocusInput /> : <FeedbackInput />}
                    </div>
                    <TimerControls />
                </div>

                {/* History Section (Right) */}
                {/* Adicionado lg:flex-1 */}
                <div className="w-full lg:flex-1 order-3 lg:order-none">
                     {/* Adicionado h-full para que o HistoryList possa usar flex-1 internamente */}
                     <div className="h-full">
                        <HistoryList />
                     </div>
                </div>
            </div>

            <SettingsModal />
        </div>
    );
};

// App component remains the same
const App: React.FC = () => {
    return (
        <PomodoroProvider>
            <PomodoroLayout />
        </PomodoroProvider>
    );
};

export default App;