import React, { useMemo } from 'react';
import { usePomodoro } from '../../contexts/PomodoroContext';
import {
    PRIMARY_FOCUS_FLASHING,
    PRIMARY_HYPERFOCUS_RUNNING,
    PRIMARY_FOCUS_RUNNING,
    PRIMARY_FOCUS_PAUSED,
    PRIMARY_SHORT_BREAK_RUNNING,
    PRIMARY_LONG_BREAK_RUNNING
} from '../../utils/constants';

const tailwindToHexMap: Record<string, string> = {
    [PRIMARY_FOCUS_RUNNING]: '#9333ea',
    [PRIMARY_FOCUS_PAUSED]: '#94a3b8',
    [PRIMARY_HYPERFOCUS_RUNNING]: '#dc2626',
    [PRIMARY_SHORT_BREAK_RUNNING]: '#06b6d4',
    [PRIMARY_LONG_BREAK_RUNNING]: '#14b8a6',
    [PRIMARY_FOCUS_FLASHING]: '#7e22ce',
    'fallback': '#ffffff',
};

export const ProgressCircle: React.FC = () => {
    const {
        timeLeft,
        initialDuration,
        currentPhase,
        isRunning,
        isEffectRunning,
        activeBgColorOverride,
        isHyperfocusActive
    } = usePomodoro();

    const progressPercentage = useMemo(() => {
        if (initialDuration <= 0) return 0;
        const elapsed = initialDuration - timeLeft;
        const percentage = (elapsed / initialDuration) * 100;
        return Math.max(0, Math.min(percentage, 100));
    }, [initialDuration, timeLeft]);

    const strokeColorClass = useMemo(() => {
        if (currentPhase === 'Work' && isEffectRunning && activeBgColorOverride) {
            if (activeBgColorOverride === PRIMARY_FOCUS_FLASHING) {
                return PRIMARY_FOCUS_FLASHING;
            } else {
                return isHyperfocusActive ? PRIMARY_HYPERFOCUS_RUNNING : PRIMARY_FOCUS_RUNNING;
            }
        }

        if (currentPhase === 'Work') {
            if (isHyperfocusActive) {
                return PRIMARY_HYPERFOCUS_RUNNING;
            } else {
                return isRunning ? PRIMARY_FOCUS_RUNNING : PRIMARY_FOCUS_PAUSED;
            }
        } else if (currentPhase === 'Short Break') {
            return PRIMARY_SHORT_BREAK_RUNNING;
        } else {
            return PRIMARY_LONG_BREAK_RUNNING;
        }
    }, [currentPhase, isRunning, isEffectRunning, activeBgColorOverride, isHyperfocusActive]);

    const finalStrokeColor = useMemo(() => {
        return tailwindToHexMap[strokeColorClass] || tailwindToHexMap['fallback'];
    }, [strokeColorClass]);

    const radius = 85;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progressPercentage / 100) * circumference;
    const strokeWidth = 12;

    return (
        <svg
            className="absolute inset-0 w-full h-full transform -rotate-90"
            viewBox="0 0 200 200"
            aria-hidden="true"
        >
            <circle
                className="text-white/10"
                strokeWidth={strokeWidth - 2}
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="100"
                cy="100"
            />
            {(isRunning || isEffectRunning) && (
                <circle
                    stroke={finalStrokeColor}
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
