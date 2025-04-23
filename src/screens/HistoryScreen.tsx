import React from 'react';
import { HistoryList } from '../components/History/HistoryList';
import { usePomodoro } from '../contexts/PomodoroContext';

export const HistoryScreen: React.FC = () => {
    const { styles } = usePomodoro();
    return (
        <div className={`w-full h-full ${styles.textColor}`}>
            <HistoryList />
        </div>
    );
};
