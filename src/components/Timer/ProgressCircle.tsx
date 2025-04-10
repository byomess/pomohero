// src/components/Timer/ProgressCircle.tsx
import React, { useMemo } from 'react';
import { usePomodoro } from '../../contexts/PomodoroContext';
import {
    EFFECT_FLASH_COLOR_1,
    HYPERFOCUS_PROGRESS, // e.g., 'bg-red-600'
    // Define or import the class names used in the context's style calculation
    WORK_PROGRESS_RUNNING, // e.g., 'bg-purple-600' <-- THIS IS THE KEY COLOR NEEDED
    WORK_PROGRESS_PAUSED,  // e.g., 'bg-slate-400'
    SHORT_BREAK_PROGRESS, // e.g., 'bg-cyan-500'
    LONG_BREAK_PROGRESS,  // e.g., 'bg-teal-500'
} from '../../utils/constants'; // Ensure these constants are defined correctly

// Map Tailwind class names to actual hex/color values for SVG
const tailwindToHexMap: Record<string, string> = {
    // Normal Work Progress
    [WORK_PROGRESS_RUNNING]: '#9333ea', // Example: purple-600
    [WORK_PROGRESS_PAUSED]: '#94a3b8',  // Example: slate-400

    // Hyperfocus Progress
    [HYPERFOCUS_PROGRESS]: '#dc2626', // Example: red-600

    // Break Progress Colors
    [SHORT_BREAK_PROGRESS]: '#06b6d4', // Example: cyan-500
    [LONG_BREAK_PROGRESS]: '#14b8a6',  // Example: teal-500

    // Effect Override Colors
    [EFFECT_FLASH_COLOR_1]: '#7e22ce', // Example: purple-800 for flash stroke

    // Fallback
    'fallback': '#ffffff',
};

export const ProgressCircle: React.FC = () => {
    const {
        timeLeft,
        initialDuration,
        // styles, // We'll use some base styles but calculate progress color directly here
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

    // Determine the correct stroke color class name FIRST
    const strokeColorClass = useMemo(() => {
        // --- 1. Handle Effect Override ---
        if (currentPhase === 'Work' && isEffectRunning && activeBgColorOverride) {
            if (activeBgColorOverride === EFFECT_FLASH_COLOR_1) {
                return EFFECT_FLASH_COLOR_1; // Specific flash color
            } else {
                // During pause/run transitions within the effect, show the target color
                return isHyperfocusActive ? HYPERFOCUS_PROGRESS : WORK_PROGRESS_RUNNING; // Show running color during effect transitions
            }
        }

        // --- 2. Handle Normal State (No Effect Override) ---
        if (currentPhase === 'Work') {
            if (isHyperfocusActive) {
                return HYPERFOCUS_PROGRESS; // Hyperfocus overrides running state for color
            } else {
                // **FIX:** Prioritize running state for normal work color
                return isRunning ? WORK_PROGRESS_RUNNING : WORK_PROGRESS_PAUSED;
            }
        } else if (currentPhase === 'Short Break') {
            return SHORT_BREAK_PROGRESS; // Use break-specific progress color class
        } else { // Long Break
            return LONG_BREAK_PROGRESS; // Use break-specific progress color class
        }

    }, [currentPhase, isRunning, isEffectRunning, activeBgColorOverride, isHyperfocusActive]); // Removed styles.progressColor dependency


    // Convert the determined class name to a hex color
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

// IMPORTANT: Ensure these constants are defined correctly in `src/utils/constants.ts`
// and match the classes your context would logically assign for progress color.
// Update the `tailwindToHexMap` accordingly.
//
// export const WORK_PROGRESS_RUNNING = 'bg-purple-600'; // Example
// export const WORK_PROGRESS_PAUSED = 'bg-slate-400';  // Example
// export const SHORT_BREAK_PROGRESS = 'bg-cyan-500';  // Example
// export const LONG_BREAK_PROGRESS = 'bg-teal-500';   // Example