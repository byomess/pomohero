// src/components/Inputs/NextFocusInput.tsx
import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { usePomodoro } from '../../contexts/PomodoroContext';
import { FiPlus, FiTrash2, FiCheck, FiX } from 'react-icons/fi';

const readOnlyInputStyle = 'read-only:bg-black/20 read-only:opacity-70 read-only:cursor-not-allowed focus:read-only:ring-0 disabled:opacity-50 disabled:cursor-not-allowed';
const buttonDisabledStyle = 'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent';

export const NextFocusInput: React.FC = () => {
    const {
        nextFocusPlans, // Agora é string[]
        addNextFocusPlan,
        removeNextFocusPlan,
        updateNextFocusPlan, // Usar a função específica para update
        isRunning,
        isEffectRunning,
        styles,
        debouncedPlayTypingSound,
        playSound
    } = usePomodoro();

    const [newPlan, setNewPlan] = useState('');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editText, setEditText] = useState('');
    const editInputRef = useRef<HTMLInputElement>(null);

    // Durante pausas, a edição é permitida a menos que o timer esteja rodando (o que não acontece normalmente)
    const isReadOnly = isRunning || isEffectRunning;

    useEffect(() => {
        if (editingIndex !== null && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingIndex]);

    const handleAddClick = () => {
        if (newPlan.trim() && !isReadOnly) {
            addNextFocusPlan(newPlan.trim());
            setNewPlan('');
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
            removeNextFocusPlan(index);
        }
    };

    const handleEditStart = (index: number) => {
        if (isReadOnly) return;
        setEditingIndex(index);
        setEditText(nextFocusPlans[index]);
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
        // Chama a função de update específica para planos
        updateNextFocusPlan(editingIndex, trimmedText);
        // updateNextFocusPlan já lida com texto vazio e toca som
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

    return (
        <div className="space-y-3">
            <label htmlFor="newNextPlan" className="block text-sm font-medium opacity-90">
                Planos para o próximo foco: {isReadOnly ? '(Timer em andamento)' : '(Editável)'}
            </label>

            <div className="flex items-center space-x-2">
                <input
                    type="text"
                    id="newNextPlan"
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value)}
                    onKeyDown={handleAddKeyDown}
                    placeholder="Adicionar novo plano..."
                    className={`flex-grow p-2 rounded-lg border-none focus:ring-2 focus:outline-none text-sm ${styles.inputBgColor} ${styles.textColor} ${styles.modalAccentColor} ${readOnlyInputStyle}`}
                    readOnly={isReadOnly}
                    aria-readonly={isReadOnly}
                    disabled={isReadOnly}
                />
                <button
                    type="button"
                    onClick={handleAddClick}
                    className={`p-2 rounded-lg ${styles.buttonColor} hover:bg-white/25 transition-colors ${buttonDisabledStyle}`}
                    disabled={isReadOnly || !newPlan.trim()}
                    aria-label="Adicionar plano para próximo foco"
                    title="Adicionar plano"
                >
                    <FiPlus className="h-5 w-5" />
                </button>
            </div>

            <div className="relative mt-2 max-h-30 min-h-30 overflow-y-scroll custom-scrollbar pr-1">
                {nextFocusPlans.length > 0 && (
                    <ul className="space-y-1.5">
                        {nextFocusPlans.map((plan, index) => (
                            <li key={`nextplan-${index}`} className="flex items-center justify-between text-sm bg-black/10 p-1.5 rounded min-h-[36px]">
                                {editingIndex === index ? (
                                    <>
                                        <input
                                            ref={editInputRef}
                                            type="text"
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            onKeyDown={handleEditKeyDown}
                                            className={`flex-grow p-1 mr-1 rounded border border-white/20 focus:ring-1 focus:outline-none text-sm ${styles.inputBgColor} ${styles.textColor} focus:${styles.modalAccentColor}`}
                                            aria-label={`Editar plano: ${plan}`}
                                        />
                                        <div className="flex items-center space-x-1 flex-shrink-0">
                                            <button
                                                type="button" onClick={handleEditSave}
                                                className={`p-1 rounded text-green-400 hover:bg-green-500/20 hover:text-green-300 transition-colors`}
                                                aria-label="Salvar alteração" title="Salvar"
                                            > <FiCheck className="h-3.5 w-3.5" /> </button>
                                            <button
                                                type="button" onClick={handleEditCancel}
                                                className={`p-1 rounded text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors`}
                                                aria-label="Cancelar edição" title="Cancelar"
                                            > <FiX className="h-3.5 w-3.5" /> </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <span
                                            className={`break-all mr-2 ${!isReadOnly ? 'cursor-pointer hover:opacity-75' : 'cursor-default'}`}
                                            onClick={() => handleEditStart(index)}
                                            title={isReadOnly ? plan : "Clique para editar"}
                                        > {plan} </span>
                                        <button
                                            type="button" onClick={() => handleRemoveClick(index)}
                                            className={`p-1 rounded text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors ${buttonDisabledStyle}`}
                                            disabled={isReadOnly}
                                            aria-label={`Remover plano: ${plan}`} title="Remover plano"
                                        > <FiTrash2 className="h-3.5 w-3.5" /> </button>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
                {(nextFocusPlans.length === 0 && !isReadOnly) ? (
                    <p className="absolute top-0 text-xs h-full w-full flex justify-center items-center opacity-60 italic">Nenhum plano definido ainda.</p>
                ) : (
                    <p className="absolute top-0 text-xs">{' '}</p>
                )}
            </div>
        </div>
    );
};
