import React from 'react';
import { FiSettings } from 'react-icons/fi';
import { usePomodoro } from '../../contexts/PomodoroContext';

export const SettingsButton: React.FC = () => {
    const { openSettingsModal, styles, isEffectRunning } = usePomodoro();

    return (
        <button
            onClick={openSettingsModal}
            aria-label="Abrir configurações"
            className={`absolute top-4 right-4 p-2 rounded-full ${styles.buttonColor} transition-colors duration-200 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 z-20 disabled:opacity-50`}
            disabled={isEffectRunning} // Disable during effect
        >
            <FiSettings className="h-5 w-5" />
        </button>
    );
};
