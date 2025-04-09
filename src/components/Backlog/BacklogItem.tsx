// src/components/Backlog/BacklogItem.tsx
import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { BacklogTask } from '../../types';
import { usePomodoro } from '../../contexts/PomodoroContext';
import { FiCheck, FiEdit2, FiTrash2, FiX } from 'react-icons/fi'; // Added FiSend
import { IoSend } from 'react-icons/io5';

interface BacklogItemProps {
    task: BacklogTask;
}

export const BacklogItem: React.FC<BacklogItemProps> = ({ task }) => {
    const {
        updateBacklogTask,
        deleteBacklogTask,
        moveTaskToFocus, // <<< Get the move function from context
        playSound,
        styles,
        debouncedPlayTypingSound,
        currentPhase,   // <<< Get Pomodoro state
        isRunning,      // <<< Get Pomodoro state
        isEffectRunning // <<< Get Pomodoro state
    } = usePomodoro();

    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(task.text);
    const inputRef = useRef<HTMLInputElement>(null);

    // Determine if the "Move to Focus" action is allowed
    const canMoveToFocus = currentPhase === 'Work' && !isRunning && !isEffectRunning;

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
            // Sound is played by moveTaskToFocus itself
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
    const buttonStyle = "p-1 rounded hover:opacity-100 transition-opacity flex-shrink-0 opacity-80"; // Added default opacity
    const iconStyle = "h-3.5 w-3.5";
    const disabledButtonStyle = "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent";

    return (
        <li className={`flex items-center justify-between p-1.5 rounded bg-black/10 min-h-[36px] group ${styles.textColor}`}>
            {isEditing ? (
                // --- Editing State ---
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
                // --- Display State ---
                <>
                    <span className={`${textStyle} ${canMoveToFocus ? 'cursor-pointer hover:opacity-75' : ''}`} title={canMoveToFocus ? "Clique para editar ou use os botões" : task.text} onClick={canMoveToFocus ? handleEditStart : undefined}>
                        {task.text}
                    </span>
                    {/* Action buttons appear on hover/focus-within */}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        {/* Move to Focus Button */}
                        <button
                            onClick={handleMoveToFocus}
                            title={canMoveToFocus ? "Mover para Foco" : "Apenas durante fase de Foco (Pausado)"}
                            aria-label="Mover tarefa para pontos de foco"
                            className={`${buttonStyle} text-purple-300 hover:bg-purple-500/20 ${disabledButtonStyle}`} // Purple color for move action
                            disabled={!canMoveToFocus} // Disable based on context state
                        >
                            <IoSend className={iconStyle} />
                        </button>
                        {/* Edit Button */}
                         <button
                             onClick={handleEditStart}
                             title={canMoveToFocus ? "Editar" : "Edição desabilitada durante timer"} // Reuse canMoveToFocus as it represents editability too
                             aria-label="Editar Tarefa"
                             className={`${buttonStyle} text-blue-300 hover:bg-blue-500/20 ${disabledButtonStyle}`}
                             disabled={!canMoveToFocus}
                         >
                            <FiEdit2 className={iconStyle} />
                        </button>
                        {/* Delete Button */}
                        <button
                            onClick={handleDelete}
                            title="Excluir"
                            aria-label="Excluir Tarefa"
                            className={`${buttonStyle} text-red-400 hover:bg-red-500/20 ${disabledButtonStyle}`}
                             disabled={!canMoveToFocus} // Also disable delete while running for consistency? Optional.
                        >
                             <FiTrash2 className={iconStyle} />
                         </button>
                    </div>
                </>
            )}
        </li>
    );
};