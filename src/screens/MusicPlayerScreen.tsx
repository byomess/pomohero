import React from 'react';
// import { BacklogList } from '../components/Backlog/BacklogList';
import { usePomodoro } from '../contexts/PomodoroContext';
import { MusicPlayer } from '../components/MusicPlayer/MusicPlayer';

export const MusicPlayerScreen: React.FC = () => {
    const { styles } = usePomodoro();
    return (
        <div className={`w-full h-full ${styles.textColor}`}>
            <MusicPlayer />
        </div>
    );
};
