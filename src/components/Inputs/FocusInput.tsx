// src/components/Inputs/FocusInput.tsx
import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { usePomodoro } from '../../contexts/PomodoroContext';
import { FiPlus, FiTrash2, FiCheck, FiX } from 'react-icons/fi'; // Add Check and X icons

const readOnlyInputStyle = 'read-only:bg-black/20 read-only:opacity-70 read-only:cursor-not-allowed focus:read-only:ring-0 disabled:opacity-50 disabled:cursor-not-allowed';
const buttonDisabledStyle = 'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent';

export const FocusInput: React.FC = () => {
    const {
        currentFocusPoints,
        setCurrentFocusPoints, // Need the setter directly to update items
        addFocusPoint,
        removeFocusPoint,
        isRunning,
        isEffectRunning,
        styles,
        debouncedPlayTypingSound,
        playSound // For save/cancel sounds
    } = usePomodoro();

    const [newPoint, setNewPoint] = useState('');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editText, setEditText] = useState('');
    const editInputRef = useRef<HTMLInputElement>(null); // Ref for focusing edit input

    const isReadOnly = isRunning || isEffectRunning;

    // Focus the input when editing starts
    useEffect(() => {
        if (editingIndex !== null && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select(); // Select text for easy replacement
        }
    }, [editingIndex]);


    const handleAddClick = () => {
        if (newPoint.trim() && !isReadOnly) {
            addFocusPoint(newPoint.trim());
            setNewPoint('');
        }
    };

    const handleAddKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        debouncedPlayTypingSound();
        if (event.key === 'Enter' && !isReadOnly) {
            event.preventDefault();
            handleAddClick();
        }
    };

    const handleRemoveClick = (index: number) => {
        if (!isReadOnly) {
            removeFocusPoint(index);
        }
    };

    // --- Edit Handlers ---
    const handleEditStart = (index: number) => {
        if (isReadOnly) return; // Don't allow editing if read-only
        setEditingIndex(index);
        setEditText(currentFocusPoints[index]);
        playSound('click');
    };

    const handleEditCancel = () => {
        setEditingIndex(null);
        setEditText('');
        playSound('click');
    };

    const handleEditSave = () => {
        if (editingIndex === null) return;

        const trimmedText = editText.trim();
        if (trimmedText === '') {
            // Option 1: Remove if empty
            // removeFocusPoint(editingIndex);
            // Option 2: Or just cancel edit if empty
             handleEditCancel();
             alert("O ponto de foco não pode ser vazio.");
             return;
        }

        // Create a new array with the updated item
        const updatedPoints = currentFocusPoints.map((point, index) =>
            index === editingIndex ? trimmedText : point
        );
        setCurrentFocusPoints(updatedPoints); // Update state via context setter
        playSound('click'); // Or a different sound for save?
        setEditingIndex(null);
        setEditText('');
    };

    const handleEditKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        debouncedPlayTypingSound();
        if (event.key === 'Enter') {
            event.preventDefault();
            handleEditSave();
        } else if (event.key === 'Escape') {
            handleEditCancel();
        }
    };
    // --- End Edit Handlers ---

    return (
        <div className="space-y-3">
            <label htmlFor="newFocusPoint" className="block text-sm font-medium opacity-90">
                Pontos de foco: {isReadOnly ? '(Em andamento)' : '(Editável)'}
            </label>

            {/* Input Row for Adding New Points */}
            <div className="flex items-center space-x-2">
                <input
                    type="text"
                    id="newFocusPoint"
                    value={newPoint}
                    onChange={(e) => setNewPoint(e.target.value)}
                    onKeyDown={handleAddKeyDown}
                    placeholder="Adicionar novo ponto de foco..."
                    className={`flex-grow p-2 rounded-lg border-none focus:ring-2 focus:outline-none text-sm ${styles.inputBgColor} ${styles.textColor} transition-colors duration-500 ${readOnlyInputStyle}`}
                    readOnly={isReadOnly}
                    aria-readonly={isReadOnly}
                    disabled={isReadOnly}
                />
                <button
                    type="button"
                    onClick={handleAddClick}
                    className={`p-2 rounded-lg ${styles.buttonColor} hover:bg-white/25 transition-colors ${buttonDisabledStyle}`}
                    disabled={isReadOnly || !newPoint.trim()}
                    aria-label="Adicionar ponto de foco"
                    title="Adicionar ponto de foco"
                >
                    <FiPlus className="h-5 w-5" />
                </button>
            </div>

            {/* List of Current Focus Points */}
            {currentFocusPoints.length > 0 && (
                <ul className="mt-2 space-y-1.5 max-h-24 overflow-y-auto custom-scrollbar-thin pr-1">
                    {currentFocusPoints.map((point, index) => (
                        <li key={index} className="flex items-center justify-between text-sm bg-black/10 p-1.5 rounded min-h-[36px]"> {/* Added min-height */}
                            {editingIndex === index ? (
                                // --- Editing State ---
                                <>
                                    <input
                                        ref={editInputRef}
                                        type="text"
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        onKeyDown={handleEditKeyDown}
                                        className={`flex-grow p-1 mr-1 rounded border border-white/20 focus:ring-1 focus:outline-none text-sm ${styles.inputBgColor} ${styles.textColor} focus:${styles.modalAccentColor}`}
                                        aria-label={`Editar ponto: ${point}`}
                                    />
                                    <div className="flex items-center space-x-1 flex-shrink-0 ml-1">
                                         <button
                                            type="button"
                                            onClick={handleEditSave}
                                            className={`p-1 rounded text-green-400 hover:bg-green-500/20 hover:text-green-300 transition-colors`}
                                            aria-label="Salvar alteração"
                                            title="Salvar"
                                        >
                                            <FiCheck className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleEditCancel}
                                            className={`p-1 rounded text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors`}
                                            aria-label="Cancelar edição"
                                            title="Cancelar"
                                        >
                                            <FiX className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                // --- Display State ---
                                <>
                                    <span
                                        className={`break-all mr-2 cursor-pointer ${isReadOnly ? 'cursor-default' : 'hover:opacity-75'}`} // Indicate clickability
                                        onClick={() => handleEditStart(index)} // Click text to edit
                                        title={isReadOnly ? point : "Clique para editar"}
                                    >
                                        {point}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveClick(index)}
                                        className={`p-1 rounded text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors ${buttonDisabledStyle}`}
                                        disabled={isReadOnly}
                                        aria-label={`Remover ponto: ${point}`}
                                        title="Remover ponto"
                                    >
                                        <FiTrash2 className="h-3.5 w-3.5" />
                                    </button>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            {currentFocusPoints.length === 0 && !isReadOnly && (
                 <p className="text-xs text-center opacity-60 italic mt-2">Nenhum ponto de foco adicionado ainda.</p>
            )}
        </div>
    );
};