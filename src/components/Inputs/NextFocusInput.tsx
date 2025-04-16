import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { usePomodoro } from '../../contexts/PomodoroContext';
import { FiPlus, FiTrash2, FiCheck, FiX } from 'react-icons/fi';

// Estilos base para reutilização e organização (mantendo para consistência e possível uso futuro)
const baseStyles = {
    readOnlyInput: 'read-only:bg-black/20 read-only:opacity-70 read-only:cursor-not-allowed focus:read-only:ring-0 disabled:opacity-50 disabled:cursor-not-allowed', // Removido do uso ativo
    buttonDisabled: 'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent', // Mantido para desabilitar o botão de adicionar quando o input está vazio
    listItemBase: 'flex items-center justify-between text-sm bg-black/10 p-1.5 rounded-lg min-h-[38px]',
    itemActionButton: 'p-1 rounded hover:bg-white/15 transition-colors flex-shrink-0',
    itemSaveButton: 'text-green-400 hover:text-green-300',
    itemCancelButton: 'text-red-400 hover:text-red-300',
    itemDeleteButton: 'text-red-400 hover:text-red-300',
    itemText: 'break-words mr-2 flex-grow',
    inputBase: 'p-2 rounded-lg border-none focus:ring-2 focus:outline-none text-sm',
    addButton: 'p-2 rounded-lg hover:bg-white/25 transition-colors flex-shrink-0',
};


export const NextFocusInput: React.FC = () => {
    const {
        nextFocusPlans, addNextFocusPlan, removeNextFocusPlan, updateNextFocusPlan, styles, debouncedPlayTypingSound, playSound
    } = usePomodoro();

    const [newPlan, setNewPlan] = useState('');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editText, setEditText] = useState('');
    const editInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { if (editingIndex !== null && editInputRef.current) { editInputRef.current.focus(); editInputRef.current.select(); } }, [editingIndex]);
    const handleAddClick = () => { if (newPlan.trim()) { addNextFocusPlan(newPlan.trim()); setNewPlan(''); } };
    const handleAddKeyDown = (event: KeyboardEvent<HTMLInputElement>) => { debouncedPlayTypingSound(); if (event.key === 'Enter') { event.preventDefault(); handleAddClick(); } };
    const handleRemoveClick = (index: number) => { removeNextFocusPlan(index); };
    const handleEditStart = (index: number) => { setEditingIndex(index); setEditText(nextFocusPlans[index]); playSound('click'); };
    const handleEditCancel = () => { setEditingIndex(null); setEditText(''); playSound('click'); };
    const handleEditSave = () => { if (editingIndex === null) return; const trimmedText = editText.trim(); updateNextFocusPlan(editingIndex, trimmedText); setEditingIndex(null); setEditText(''); };
    const handleEditKeyDown = (event: KeyboardEvent<HTMLInputElement>) => { debouncedPlayTypingSound(); if (event.key === 'Enter') { event.preventDefault(); handleEditSave(); } else if (event.key === 'Escape') { handleEditCancel(); } };

    const inputBaseStyle = `p-2 rounded-lg border-none focus:ring-2 focus:outline-none text-sm ${styles.inputBgColor} ${styles.textColor} focus:${styles.modalAccentColor}`;
    const addButtonStyle = `p-2 rounded-lg ${styles.buttonColor} hover:bg-white/25 transition-colors flex-shrink-0`;

    return (
        // Use flex-col and h-full to allow child elements to control height distribution
        <div className="space-y-2 flex flex-col h-full"> {/* Reduced space-y */}
            <label htmlFor="newNextPlan" className="block text-sm font-medium opacity-90 flex-shrink-0">
                Planos para o próximo foco:
            </label>

            <div className="flex items-center space-x-2 flex-shrink-0">
                <input
                    type="text" id="newNextPlan" value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value)} onKeyDown={handleAddKeyDown}
                    placeholder="Adicionar novo plano..."
                    className={`flex-grow ${inputBaseStyle}`} // Removido: ${readOnlyInputStyle}
                />
                <button
                    type="button" onClick={handleAddClick} className={`${addButtonStyle} ${!newPlan.trim() ? baseStyles.buttonDisabled : ''}`} // Mantido buttonDisabled para input vazio
                    disabled={!newPlan.trim()} aria-label="Adicionar plano" title="Adicionar"
                > <FiPlus className="h-5 w-5" /> </button>
            </div>

            <div className="flex-1 min-h-0 mt-1 overflow-y-auto custom-scrollbar pr-1 pb-1"> {/* Use flex-1 to grow, min-h-0 to allow shrinking, overflow-auto for scroll */}
                {nextFocusPlans.length > 0 ? (
                    <ul className="space-y-1.5"> {/* No absolute positioning needed */}
                        {nextFocusPlans.map((plan, index) => (
                            <li key={`nextplan-${index}-${plan}`} className={baseStyles.listItemBase}>
                                {editingIndex === index ? (
                                    <>
                                        <input
                                            ref={editInputRef} type="text" value={editText}
                                            onChange={(e) => setEditText(e.target.value)} onKeyDown={handleEditKeyDown}
                                            className={`flex-grow p-1 mr-1 rounded border border-white/20 focus:ring-1 focus:outline-none text-sm ${styles.inputBgColor} ${styles.textColor} focus:${styles.modalAccentColor}`}
                                            aria-label={`Editar plano: ${plan}`}
                                        />
                                        <div className="flex items-center space-x-0.5">
                                            <button type="button" onClick={handleEditSave} className={baseStyles.itemSaveButton} aria-label="Salvar" title="Salvar"> <FiCheck className="h-4 w-4" /> </button>
                                            <button type="button" onClick={handleEditCancel} className={baseStyles.itemCancelButton} aria-label="Cancelar" title="Cancelar"> <FiX className="h-4 w-4" /> </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <span
                                            className={`${baseStyles.itemText} cursor-default`}
                                            onClick={() => handleEditStart(index)}
                                            title="Clique para editar"
                                        > {plan} </span>
                                        <button type="button" onClick={() => handleRemoveClick(index)} className={baseStyles.itemDeleteButton} aria-label={`Remover plano: ${plan}`} title="Remover"> <FiTrash2 className="h-4 w-4" /> </button>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex justify-center items-center h-full">
                        <p className="text-xs text-center opacity-60 italic">Nenhum plano definido ainda.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
export default NextFocusInput;