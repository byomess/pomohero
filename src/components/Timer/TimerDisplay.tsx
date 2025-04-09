// src/components/Timer/TimerDisplay.tsx
import React, { useState, useEffect, ChangeEvent, KeyboardEvent } from 'react';
import { usePomodoro } from '../../contexts/PomodoroContext';
import { formatTime } from '../../utils/formatters';

const parseTimeToSeconds = (timeString: string): number | null => {
    if (!/^\d{1,2}:\d{1,2}$/.test(timeString)) return null;
    const parts = timeString.split(':');
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    if (isNaN(minutes) || isNaN(seconds) || minutes < 0 || seconds < 0 || seconds > 59) return null;
    return minutes * 60 + seconds;
};

export const TimerDisplay: React.FC = () => {
    const { timeLeft, styles, adjustTimeLeft, isRunning, isEffectRunning, currentPhase } = usePomodoro();
    const [inputValue, setInputValue] = useState(formatTime(timeLeft));
    const [isFocused, setIsFocused] = useState(false);

    const isEditable = currentPhase === 'Work' && !isRunning && !isEffectRunning;

    useEffect(() => {
        if (!isFocused) {
            setInputValue(formatTime(timeLeft));
        }
    }, [timeLeft, isFocused]);

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
    };

    const handleInputBlur = () => {
         setIsFocused(false);
         const parsedSeconds = parseTimeToSeconds(inputValue);
         if (parsedSeconds !== null) {
             adjustTimeLeft(parsedSeconds);
         } else {
             setInputValue(formatTime(timeLeft));
         }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const parsedSeconds = parseTimeToSeconds(inputValue);
            if (parsedSeconds !== null) {
                adjustTimeLeft(parsedSeconds);
                event.currentTarget.blur();
            } else {
                console.warn("Invalid time format entered:", inputValue);
                setInputValue(formatTime(timeLeft));
                event.currentTarget.blur();
            }
        } else if (event.key === 'Escape') {
             event.preventDefault();
             setInputValue(formatTime(timeLeft));
             event.currentTarget.blur();
        }
    };

    const handleFocus = () => {
        if(isEditable) setIsFocused(true);
    }

    // Add a subtle text shadow using arbitrary values if text-shadow utility isn't configured
    const textShadowStyle = '[text-shadow:1px_1px_3px_rgba(0,0,0,0.15)]';

    return (
        <div className={`relative z-10 text-6xl md:text-7xl font-mono font-bold transition-colors duration-500 w-full text-center select-none ${styles.textColor} ${textShadowStyle}`}>
            {isEditable ? (
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    onFocus={handleFocus}
                    onKeyDown={handleKeyDown}
                    // Use current text color for the caret
                    className="bg-transparent border-none outline-none text-center w-full p-0 m-0 caret-current font-inherit text-inherit"
                    maxLength={5} // Limit input length (e.g., 99:59)
                    title="Edite o tempo (MM:SS)"
                    aria-label="Tempo restante editável"
                />
            ) : (
                // Add select-none to prevent text selection when not editable
                <span className="select-none">{formatTime(timeLeft)}</span>
            )}
        </div>
    );
};