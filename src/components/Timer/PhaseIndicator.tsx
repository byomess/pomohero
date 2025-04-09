// src/components/Timer/PhaseIndicator.tsx
import React from 'react';
import { usePomodoro } from '../../contexts/PomodoroContext';

export const PhaseIndicator: React.FC = () => {
    const { cycleCount, styles } = usePomodoro();

    return (
        // Reduced bottom margin
        <div className="text-center mb-4">
            {/* Slightly smaller phase text */}
            <span className={`text-xl font-semibold tracking-wider uppercase transition-colors duration-500 ${styles.textColor}`}>
                {styles.phaseText}
            </span>
            {/* Smaller, less prominent cycle count */}
            <p className="text-xs opacity-70 mt-1">
                Ciclos: {cycleCount}
            </p>
        </div>
    );
};