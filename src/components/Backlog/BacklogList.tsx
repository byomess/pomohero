// src/components/Backlog/BacklogList.tsx
import React, { useState, KeyboardEvent } from 'react';
import { usePomodoro } from '../../contexts/PomodoroContext';
import { BacklogItem } from './BacklogItem';
import { FiPlus, FiTrash } from 'react-icons/fi'; // Using FiTrash for clear all

export const BacklogList: React.FC = () => {
    const { backlogTasks, addBacklogTask, clearBacklog, styles, debouncedPlayTypingSound } = usePomodoro();
    const [newTaskText, setNewTaskText] = useState('');

    const handleAddTask = () => {
        if (newTaskText.trim()) {
            addBacklogTask(newTaskText);
            setNewTaskText('');
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        debouncedPlayTypingSound();
        if (event.key === 'Enter') {
            handleAddTask();
        }
    };

    return (
        // Container similar to HistoryList
        <div className={`w-full max-w-md p-5 md:p-6 rounded-3xl shadow-xl backdrop-blur-sm bg-black/25 ${styles.textColor} flex flex-col min-h-[400px] max-h-[calc(100vh-80px)]`}>

            {/* Header */}
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3 flex-shrink-0">
                <h2 className="text-xl font-semibold opacity-95">Backlog</h2>
                {backlogTasks.length > 0 && ( // Show clear button only if there are tasks
                    <button
                        onClick={clearBacklog}
                        aria-label="Limpar todo o backlog"
                        title="Limpar Backlog"
                        className={`p-1.5 rounded-md text-xs ${styles.buttonColor} hover:bg-red-600/50 text-red-400 hover:text-red-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-red-500 flex items-center gap-1`}
                    >
                        <FiTrash className="h-3.5 w-3.5" />
                        Limpar
                    </button>
                )}
            </div>

            {/* Add Task Input */}
            <div className="mb-4 flex items-center space-x-2 flex-shrink-0">
                <input
                    type="text"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Adicionar nova tarefa..."
                    className={`flex-grow p-2 rounded-lg border-none focus:ring-2 focus:outline-none text-sm ${styles.inputBgColor} ${styles.textColor} transition-colors duration-500`}
                    aria-label="Nova tarefa do backlog"
                />
                <button
                    type="button"
                    onClick={handleAddTask}
                    className={`p-2 rounded-lg ${styles.buttonColor} hover:bg-white/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    disabled={!newTaskText.trim()}
                    aria-label="Adicionar tarefa ao backlog"
                    title="Adicionar Tarefa"
                >
                    <FiPlus className="h-5 w-5" />
                </button>
            </div>

            {/* Task List Container - Scrollable */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4 [mask-image:linear-gradient(to_bottom,black_95%,transparent_100%)]">
                {backlogTasks.length > 0 ? (
                    <ul className="space-y-2">
                        {backlogTasks.map((task) => (
                            <BacklogItem key={task.id} task={task} />
                        ))}
                    </ul>
                ) : (
                     // Centered empty state message
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-60 px-4 min-h-[150px]">
                        {/* Simple list icon for empty backlog */}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mb-4 opacity-30">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h7.5M8.25 12h7.5m-7.5 5.25h7.5M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                        <p className="text-base font-medium">Backlog Vazio</p>
                        <p className="text-sm mt-1">Adicione tarefas que você precisa fazer.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
