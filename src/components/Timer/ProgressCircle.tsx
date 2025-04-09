// src/components/Timer/ProgressCircle.tsx
import React, { useMemo } from 'react';
import { usePomodoro } from '../../contexts/PomodoroContext';
import {
    EFFECT_FLASH_COLOR_1,
    WORK_BG_PAUSED,
    WORK_BG_RUNNING
} from '../../utils/constants';

const colorMap: Record<string, string> = {
    'bg-cyan-500': '#06b6d4',
    'bg-teal-500': '#14b8a6',
    'work-paused': '#94a3b8',
    'work-running': '#a855f7',
    'work-flash': '#7e22ce',
    'fallback': '#ffffff',
};

export const ProgressCircle: React.FC = () => {
    const {
        timeLeft,
        initialDuration,
        styles,
        currentPhase,
        isRunning,
        isEffectRunning,
        activeBgColorOverride
    } = usePomodoro();

    const progressPercentage = useMemo(() => {
        if (initialDuration <= 0) return 0;
        const elapsed = initialDuration - timeLeft;
        const percentage = (elapsed / initialDuration) * 100;
        return Math.max(0, Math.min(percentage, 100));
    }, [initialDuration, timeLeft]);

    const strokeColor = useMemo(() => {
        if (currentPhase === 'Work') {
            if (isEffectRunning && activeBgColorOverride) {
                if (activeBgColorOverride === EFFECT_FLASH_COLOR_1) {
                    return colorMap['work-flash'];
                } else if (activeBgColorOverride === WORK_BG_PAUSED) {
                    return colorMap['work-paused'];
                } else if (activeBgColorOverride === WORK_BG_RUNNING) {
                    return colorMap['work-running'];
                }
            }
            // When not in effect, paused uses its color, running uses its color
            return isRunning ? colorMap['work-running'] : colorMap['work-paused'];
        } else {
            // For breaks, always use the running color associated with the break type
            return colorMap[styles.progressColor] || colorMap['fallback'];
        }
    }, [currentPhase, isRunning, isEffectRunning, activeBgColorOverride, styles.progressColor]);


    const radius = 85;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progressPercentage / 100) * circumference;
    const strokeWidth = 12;
    // Opacity is now handled by conditional rendering for the active bar

    return (
        <svg
            className="absolute inset-0 w-full h-full transform -rotate-90"
            viewBox="0 0 200 200"
            aria-hidden="true"
        >
            {/* Círculo de fundo (Track) - Always visible */}
            <circle
                className="text-white/10"
                strokeWidth={strokeWidth - 2}
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="100"
                cy="100"
            />
            {/* Círculo de Progresso - Renderizado apenas se isRunning ou isEffectRunning */}
            {(isRunning || isEffectRunning) && (
                <circle
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx="100"
                    cy="100"
                    style={{
                        transition: 'stroke-dashoffset 0.3s linear, stroke 0.2s ease-in-out',
                    }}
                />
            )}
        </svg>
    );
};