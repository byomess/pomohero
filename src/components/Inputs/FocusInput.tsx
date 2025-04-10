import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { usePomodoro } from '../../contexts/PomodoroContext';
import { FiPlus, FiTrash2, FiCheck, FiX } from 'react-icons/fi';

const readOnlyInputStyle = 'read-only:bg-black/20 read-only:opacity-70 read-only:cursor-not-allowed focus:read-only:ring-0 disabled:opacity-50 disabled:cursor-not-allowed';
const buttonDisabledStyle = 'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent';
const listItemBaseStyle = 'flex items-center justify-between text-sm bg-black/10 p-1.5 rounded-lg min-h-[38px]';
const itemActionButtonStyle = 'p-1 rounded hover:bg-white/15 transition-colors flex-shrink-0';
const itemSaveButtonStyle = `${itemActionButtonStyle} text-green-400 hover:text-green-300`;
const itemCancelButtonStyle = `${itemActionButtonStyle} text-red-400 hover:text-red-300`;
const itemDeleteButtonStyle = `${itemActionButtonStyle} text-red-400 hover:text-red-300 ${buttonDisabledStyle}`;
const itemTextStyle = `break-words mr-2 flex-grow`;


export const FocusInput: React.FC = () => {
    const {
        currentFocusPoints, setCurrentFocusPoints, addFocusPoint, removeFocusPoint,
        isRunning, isEffectRunning, styles, debouncedPlayTypingSound, playSound
    } = usePomodoro();

    const [newPoint, setNewPoint] = useState('');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editText, setEditText] = useState('');
    const editInputRef = useRef<HTMLInputElement>(null);

    const isReadOnly = isRunning || isEffectRunning;

    useEffect(() => { if (editingIndex !== null && editInputRef.current) { editInputRef.current.focus(); editInputRef.current.select(); } }, [editingIndex]);
    const handleAddClick = () => { if (newPoint.trim() && !isReadOnly) { addFocusPoint(newPoint.trim()); setNewPoint(''); } };
    const handleAddKeyDown = (event: KeyboardEvent<HTMLInputElement>) => { debouncedPlayTypingSound(); if (event.key === 'Enter' && !isReadOnly) { event.preventDefault(); handleAddClick(); } };
    const handleRemoveClick = (index: number) => { if (!isReadOnly) removeFocusPoint(index); };
    const handleEditStart = (index: number) => { if (isReadOnly) return; setEditingIndex(index); setEditText(currentFocusPoints[index]); playSound('click'); };
    const handleEditCancel = () => { setEditingIndex(null); setEditText(''); playSound('click'); };
    const handleEditSave = () => {
        if (editingIndex === null) return; const trimmedText = editText.trim();
        if (trimmedText === '') { handleEditCancel(); alert("O ponto de foco não pode ser vazio."); return; }
        const updatedPoints = currentFocusPoints.map((point, index) => index === editingIndex ? trimmedText : point);
        setCurrentFocusPoints(updatedPoints); playSound('confirm');
        setEditingIndex(null); setEditText('');
    };
    const handleEditKeyDown = (event: KeyboardEvent<HTMLInputElement>) => { debouncedPlayTypingSound(); if (event.key === 'Enter') { event.preventDefault(); handleEditSave(); } else if (event.key === 'Escape') { handleEditCancel(); } };

    const inputBaseStyle = `p-2 rounded-lg border-none focus:ring-2 focus:outline-none text-sm ${styles.inputBgColor} ${styles.textColor} focus:${styles.modalAccentColor}`;
    const addButtonStyle = `p-2 rounded-lg ${styles.buttonColor} hover:bg-white/25 transition-colors ${buttonDisabledStyle} flex-shrink-0`;

    return (
        <div className="space-y-2 flex flex-col h-full"> {/* Reduced space-y */}
            <label htmlFor="newFocusPoint" className="block text-sm font-medium opacity-90 flex-shrink-0">
                Pontos de foco: {isReadOnly ? '(Em andamento)' : '(Editável)'}
            </label>

            <div className="flex items-center space-x-2 flex-shrink-0">
                <input
                    type="text" id="newFocusPoint" value={newPoint}
                    onChange={(e) => setNewPoint(e.target.value)} onKeyDown={handleAddKeyDown}
                    placeholder="Adicionar novo ponto..."
                    className={`flex-grow ${inputBaseStyle} ${readOnlyInputStyle}`}
                    readOnly={isReadOnly} aria-readonly={isReadOnly} disabled={isReadOnly}
                />
                <button
                    type="button" onClick={handleAddClick} className={addButtonStyle}
                    disabled={isReadOnly || !newPoint.trim()} aria-label="Adicionar ponto de foco" title="Adicionar"
                > <FiPlus className="h-5 w-5" /> </button>
            </div>

            {/* List Container: Takes remaining space, scrolls internally */}
            {/* Removed relative, added overflow-auto directly here */}
            <div className="flex-1 min-h-0 mt-1 overflow-y-auto custom-scrollbar pr-1 pb-1"> {/* Use flex-1 to grow, min-h-0 to allow shrinking, overflow-auto for scroll */}
                 {currentFocusPoints.length > 0 ? (
                    <ul className="space-y-1.5"> {/* No absolute positioning needed */}
                        {currentFocusPoints.map((point, index) => (
                            <li key={`focus-${index}-${point}`} className={listItemBaseStyle}>
                                {editingIndex === index ? (
                                    <>
                                        <input
                                            ref={editInputRef} type="text" value={editText}
                                            onChange={(e) => setEditText(e.target.value)} onKeyDown={handleEditKeyDown}
                                            className={`flex-grow p-1 mr-1 rounded border border-white/20 focus:ring-1 focus:outline-none text-sm ${styles.inputBgColor} ${styles.textColor} focus:${styles.modalAccentColor}`}
                                            aria-label={`Editar ponto: ${point}`}
                                        />
                                        <div className="flex items-center space-x-0.5">
                                            <button type="button" onClick={handleEditSave} className={itemSaveButtonStyle} aria-label="Salvar" title="Salvar"> <FiCheck className="h-4 w-4" /> </button>
                                            <button type="button" onClick={handleEditCancel} className={itemCancelButtonStyle} aria-label="Cancelar" title="Cancelar"> <FiX className="h-4 w-4" /> </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <span
                                            className={`${itemTextStyle} ${!isReadOnly ? 'cursor-pointer hover:opacity-75' : 'cursor-default'}`}
                                            onClick={() => handleEditStart(index)}
                                            title={isReadOnly ? point : "Clique para editar"}
                                        > {point} </span>
                                        <button type="button" onClick={() => handleRemoveClick(index)} className={itemDeleteButtonStyle} disabled={isReadOnly} aria-label={`Remover ponto: ${point}`} title="Remover"> <FiTrash2 className="h-4 w-4" /> </button>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                 ) : (
                     !isReadOnly && (
                         <div className="flex justify-center items-center h-full">
                            <p className="text-xs text-center opacity-60 italic">Nenhum ponto de foco adicionado.</p>
                         </div>
                     )
                 )}
            </div>
        </div>
    );
};
