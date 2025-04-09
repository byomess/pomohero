import React from 'react';
import { usePomodoro } from '../../contexts/PomodoroContext';

export const PhaseIndicator: React.FC = () => {
    const { cycleCount, styles } = usePomodoro();

    return (
        <div className="text-center mb-6">
            <span className={`text-2xl font-semibold tracking-wider uppercase transition-colors duration-500 ${styles.textColor}`}>
                {styles.phaseText}
            </span>
            <p className="text-sm opacity-80 mt-1">
                Ciclos completos: {cycleCount}
            </p>
        </div>
    );
};
