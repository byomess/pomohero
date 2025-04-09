import React from 'react';
import { usePomodoro } from '../../contexts/PomodoroContext';

const readOnlyInputStyle = 'read-only:bg-black/20 read-only:opacity-70 read-only:cursor-default focus:read-only:ring-0';

export const FocusInput: React.FC = () => {
    const {
        currentFocusPoints,
        setCurrentFocusPoints,
        isRunning,
        isEffectRunning,
        styles,
        debouncedPlayTypingSound
    } = usePomodoro();

    const isReadOnly = isRunning || isEffectRunning;

    return (
        <div>
            <label htmlFor="focusPoints" className="block text-sm font-medium opacity-90 mb-1">
                Pontos de foco: {isReadOnly ? '(Em andamento)' : '(Editável)'}
            </label>
            <textarea
                id="focusPoints"
                rows={2}
                value={currentFocusPoints}
                onChange={(e) => setCurrentFocusPoints(e.target.value)}
                placeholder="Defina seus pontos de foco..."
                onKeyDown={debouncedPlayTypingSound}
                className={`w-full p-2 rounded-lg border-none focus:ring-2 focus:outline-none text-sm resize-none ${styles.inputBgColor} ${styles.textColor} transition-colors duration-500 ${readOnlyInputStyle}`}
                readOnly={isReadOnly}
                aria-readonly={isReadOnly}
            />
        </div>
    );
};
