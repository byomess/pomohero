import React from 'react';
import { BacklogList } from '../components/Backlog/BacklogList';
import { usePomodoro } from '../contexts/PomodoroContext';

export const BacklogScreen: React.FC = () => {
    const { styles } = usePomodoro();
    return (
        <div className={`w-full h-full ${styles.textColor}`}>
            <BacklogList />
        </div>
    );
};
