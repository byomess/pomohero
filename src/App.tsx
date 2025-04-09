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
import { TimerAdjustControls } from './components/Timer/TimerAdjustControls'; // <<< IMPORT ADDED

// This component now just arranges the UI using context values
const PomodoroLayout: React.FC = () => {
    const { currentPhase, styles } = usePomodoro();

    return (
        <div className={`min-h-screen w-full flex flex-col items-center justify-start py-10 px-4 ${styles.finalBgColor} transition-colors duration-200 ease-in-out relative font-sans`}>
            <SettingsButton />

            <div className="w-full max-w-6xl flex flex-col md:flex-row justify-center items-center md:items-start gap-8">
                {/* Timer Section */}
                <div className={`w-full max-w-md p-6 md:p-8 rounded-3xl shadow-2xl backdrop-blur-sm bg-black/20 ${styles.textColor} md:flex-shrink-0`}>
                    <PhaseIndicator />
                    <div className="relative mb-6"> {/* Reduced mb slightly */}
                        {/* Timer Circle Container */}
                        <div className="w-64 h-64 md:w-72 md:h-72 mx-auto bg-black/20 rounded-full flex items-center justify-center shadow-inner">
                            <ProgressCircle />
                             {/* Inner aesthetic overlay */}
                            <div className="absolute w-[85%] h-[85%] bg-gradient-to-br from-[rgba(255,255,255,0.05)] to-[rgba(255,255,255,0.02)] rounded-full shadow-lg flex items-center justify-center">
                                {/* TimerDisplay goes inside overlay for centering */}
                                 <TimerDisplay />
                            </div>
                             {/* Removed TimerDisplay from here */}
                        </div>
                         {/* Adjustment Controls below circle */}
                         <TimerAdjustControls /> {/* <<< COMPONENT ADDED HERE */}
                    </div>
                    {/* Input Area */}
                    <div className="space-y-4 mb-8 min-h-[80px]">
                        {currentPhase === 'Work' ? <FocusInput /> : <FeedbackInput />}
                    </div>
                    {/* Controls */}
                    <TimerControls />
                </div>

                {/* History Section */}
                <HistoryList />
            </div>

            {/* Settings Modal (conditionally rendered via context state) */}
            <SettingsModal />
        </div>
    );
};

// App component sets up the provider
const App: React.FC = () => {
    return (
        <PomodoroProvider>
            <PomodoroLayout />
        </PomodoroProvider>
    );
};

export default App;