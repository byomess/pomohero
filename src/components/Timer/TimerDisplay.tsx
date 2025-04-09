// src/components/Timer/TimerDisplay.tsx
import React, { useState, useEffect, ChangeEvent, KeyboardEvent } from 'react';
import { usePomodoro } from '../../contexts/PomodoroContext';
import { formatTime } from '../../utils/formatters';

// Helper to parse MM:SS string to seconds
const parseTimeToSeconds = (timeString: string): number | null => {
    if (!/^\d{1,2}:\d{1,2}$/.test(timeString)) {
        // Basic format check (allows 1:5, 01:05, 10:30)
        return null;
    }
    const parts = timeString.split(':');
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);

    if (isNaN(minutes) || isNaN(seconds) || minutes < 0 || seconds < 0 || seconds > 59) {
        return null; // Invalid numbers or seconds out of range
    }
    return minutes * 60 + seconds;
};


export const TimerDisplay: React.FC = () => {
    const { timeLeft, styles, adjustTimeLeft, isRunning, isEffectRunning, currentPhase } = usePomodoro();
    const [inputValue, setInputValue] = useState(formatTime(timeLeft));
    const [isFocused, setIsFocused] = useState(false);

    const isEditable = currentPhase === 'Work' && !isRunning && !isEffectRunning;

    // Update local input value when timeLeft changes externally (e.g., reset, +/- buttons)
    // Only update if the input is NOT currently focused to avoid interrupting user typing
    useEffect(() => {
        if (!isFocused) {
            setInputValue(formatTime(timeLeft));
        }
    }, [timeLeft, isFocused]); // Re-run if timeLeft changes OR focus state changes

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
        // Basic validation could happen here, but parsing is complex on every keystroke.
        // We will parse on blur or Enter.
    };

    const handleInputBlur = () => {
         setIsFocused(false);
         const parsedSeconds = parseTimeToSeconds(inputValue);
         if (parsedSeconds !== null) {
             adjustTimeLeft(parsedSeconds); // Update context state
             // The useEffect will update inputValue back to formatted time if adjustTimeLeft was successful
         } else {
             // Invalid input, revert to the last valid time
             setInputValue(formatTime(timeLeft));
         }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent form submission if applicable
            const parsedSeconds = parseTimeToSeconds(inputValue);
            if (parsedSeconds !== null) {
                adjustTimeLeft(parsedSeconds);
                event.currentTarget.blur(); // Remove focus after Enter
            } else {
                // Optionally provide feedback for invalid format
                console.warn("Invalid time format entered:", inputValue);
                setInputValue(formatTime(timeLeft)); // Revert
                 event.currentTarget.blur(); // Remove focus
            }
        } else if (event.key === 'Escape') {
             event.preventDefault();
             setInputValue(formatTime(timeLeft)); // Revert on Escape
             event.currentTarget.blur();
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
    }

    return (
        <div className={`relative z-10 text-6xl md:text-7xl font-mono font-bold transition-colors duration-500 w-full text-center ${styles.textColor}`}>
            {isEditable ? (
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    onFocus={handleFocus}
                    onKeyDown={handleKeyDown}
                    className="bg-transparent border-none outline-none text-center w-full p-0 m-0 inherit font-inherit text-inherit"
                    // Add pattern for basic guidance, though validation is manual
                    // pattern="\d{1,2}:\d{2}"
                    title="Edite o tempo no formato MM:SS"
                    aria-label="Tempo restante editável"
                />
            ) : (
                <span>{formatTime(timeLeft)}</span>
            )}
        </div>
    );
};