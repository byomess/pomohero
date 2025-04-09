// src/components/MusicPlayer/SeekBar.tsx
import React, { ChangeEvent } from 'react';
import { formatTime } from '../../utils/formatters'; // <<< Import formatTime
import { usePomodoro } from '../../contexts/PomodoroContext';

interface SeekBarProps {
    currentTime: number;
    duration: number;
    onSeek: (time: number) => void;
    disabled?: boolean;
}

export const SeekBar: React.FC<SeekBarProps> = ({ currentTime, duration, onSeek, disabled = false }) => {
    const { styles } = usePomodoro();

    const handleSeekChange = (event: ChangeEvent<HTMLInputElement>) => {
        onSeek(Number(event.target.value));
    };

    const validDuration = duration && !isNaN(duration) && duration > 0;
    // <<< Use Math.floor to remove decimals before formatting >>>
    const formattedCurrentTime = formatTime(Math.floor(currentTime));
    const formattedDuration = validDuration ? formatTime(Math.floor(duration)) : '00:00';

    const accentColor = styles.modalAccentColor.replace('ring-', '');
    const rangeStyle = `accent-${accentColor}`;

    return (
        <div className="w-full flex items-center gap-3">
            {/* <<< Display formatted current time >>> */}
            <span className="text-xs font-mono opacity-70 w-10 text-right tabular-nums">
                 {formattedCurrentTime}
            </span>
            <input
                type="range"
                min="0"
                max={validDuration ? duration : 100}
                value={currentTime} // Keep value as number for range input
                onChange={handleSeekChange}
                disabled={disabled || !validDuration}
                className={`w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 ${rangeStyle}`}
                aria-label="Barra de progresso da música"
            />
             {/* <<< Display formatted duration >>> */}
            <span className="text-xs font-mono opacity-70 w-10 text-left tabular-nums">
                 {formattedDuration}
            </span>
        </div>
    );
};