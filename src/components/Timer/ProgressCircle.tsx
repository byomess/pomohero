import React, { useMemo } from 'react';
import { usePomodoro } from '../../contexts/PomodoroContext';

export const ProgressCircle: React.FC = () => {
    const { timeLeft, initialDuration, styles } = usePomodoro();

    const progressPercentage = useMemo(() => {
        if (initialDuration === 0) return 0;
        const percentage = ((initialDuration - timeLeft) / initialDuration) * 100;
        return Math.max(0, Math.min(percentage, 100)); // Clamp between 0 and 100
    }, [initialDuration, timeLeft]);

    return (
        <div
            className="absolute top-0 left-0 w-full h-full rounded-full"
            style={{
                background: `conic-gradient(${styles.progressColor} ${progressPercentage * 3.6}deg, transparent ${progressPercentage * 3.6}deg)`,
                transition: 'background 0.3s linear' // Keep transition smooth
            }}
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
        ></div>
    );
};
