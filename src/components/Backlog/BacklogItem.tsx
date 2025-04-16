import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { BacklogTask } from '../../types';
import { usePomodoro } from '../../contexts/PomodoroContext';
import { FiCheck, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import { IoSend } from 'react-icons/io5';

interface BacklogItemProps {
    task: BacklogTask;
}

export const BacklogItem: React.FC<BacklogItemProps> = ({ task }) => {
    const {
        updateBacklogTask,
        deleteBacklogTask,
        moveTaskToFocus,
        playSound,
        styles,
        debouncedPlayTypingSound,
        currentPhase,
    } = usePomodoro();

    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(task.text);
    const inputRef = useRef<HTMLInputElement>(null);

    const canMoveToFocus = currentPhase === 'Work';

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleEditStart = () => {
        setEditText(task.text);
        setIsEditing(true);
        playSound('click');
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditText(task.text);
        playSound('click');
    };

    const handleSave = () => {
        const trimmedText = editText.trim();
        if (trimmedText && trimmedText !== task.text) {
            updateBacklogTask(task.id, trimmedText);
        } else if (!trimmedText) {
            alert("A tarefa não pode ficar vazia.");
            inputRef.current?.focus();
            return;
        }
        setIsEditing(false);
    };

    const handleDelete = () => {
        deleteBacklogTask(task.id);
    };

    const handleMoveToFocus = () => {
        if (canMoveToFocus) {
            moveTaskToFocus(task.id);
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        debouncedPlayTypingSound();
        if (event.key === 'Enter') {
            handleSave();
        } else if (event.key === 'Escape') {
            handleCancel();
        }
    };

    const textStyle = "flex-grow break-words mr-2 text-sm";
    const buttonStyle = "p-1 rounded hover:opacity-100 transition-opacity flex-shrink-0 opacity-80";
    const iconStyle = "h-3.5 w-3.5";

    return (
        <li className={`flex items-center justify-between p-1.5 rounded bg-black/10 min-h-[36px] group ${styles.textColor}`}>
            {isEditing ? (
                <>
                    <input
                        ref={inputRef}
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleSave}
                        className={`flex-grow p-1 mx-1 rounded border border-white/20 focus:ring-1 focus:outline-none text-sm ${styles.inputBgColor} ${styles.textColor} focus:${styles.modalAccentColor}`}
                        aria-label="Editar tarefa"
                    />
                    <div className="flex items-center space-x-1">
                        <button onClick={handleSave} title="Salvar" aria-label="Salvar Tarefa" className={`${buttonStyle} text-green-400 hover:bg-green-500/20`}><FiCheck className={iconStyle} /></button>
                        <button onClick={handleCancel} title="Cancelar" aria-label="Cancelar Edição" className={`${buttonStyle} text-red-400 hover:bg-red-500/20`}><FiX className={iconStyle} /></button>
                    </div>
                </>
            ) : (
                <>
                    <span className={`${textStyle} cursor-pointer hover:opacity-75`} title="Clique para editar ou use os botões" onClick={handleEditStart}>
                        {task.text}
                    </span>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <button
                            onClick={handleMoveToFocus}
                            title={canMoveToFocus ? "Mover para Foco" : "Apenas durante fase de Foco"}
                            aria-label="Mover tarefa para pontos de foco"
                            className={`${buttonStyle} text-purple-300 hover:bg-purple-500/20 ${!canMoveToFocus ? 'opacity-30 cursor-not-allowed hover:bg-transparent' : ''}`}
                            disabled={!canMoveToFocus}
                        >
                            <IoSend className={iconStyle} />
                        </button>
                         <button
                             onClick={handleEditStart}
                             title="Editar"
                             aria-label="Editar Tarefa"
                             className={`${buttonStyle} text-blue-300 hover:bg-blue-500/20`}
                         >
                            <FiEdit2 className={iconStyle} />
                        </button>
                        <button
                            onClick={handleDelete}
                            title="Excluir"
                            aria-label="Excluir Tarefa"
                            className={`${buttonStyle} text-red-400 hover:bg-red-500/20`}
                         >
                             <FiTrash2 className={iconStyle} />
                         </button>
                    </div>
                </>
            )}
        </li>
    );
};