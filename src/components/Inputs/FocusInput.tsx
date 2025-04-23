import React, { useState, KeyboardEvent, useRef, useEffect, useMemo } from 'react';
import { usePomodoro } from '../../contexts/PomodoroContext';
import { FiPlus, FiTrash2, FiCheck, FiX } from 'react-icons/fi';

// Estilos base para reutilização e organização
const baseStyles = {
    buttonDisabled: 'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent',
    listItemBase: 'flex items-center justify-between text-sm bg-black/10 p-1.5 rounded-lg min-h-[38px]',
    itemActionButton: 'p-1 rounded hover:bg-white/15 transition-colors flex-shrink-0',
    itemSaveButton: 'text-green-400 hover:text-green-300',
    itemCancelButton: 'text-red-400 hover:text-red-300',
    itemDeleteButton: 'text-red-400 hover:text-red-300',
    itemText: 'break-words mr-2 flex-grow',
    inputBase: 'p-2 rounded-lg border-none focus:ring-2 focus:outline-none text-sm',
    addButton: 'p-2 rounded-lg hover:bg-white/25 transition-colors flex-shrink-0',
};

const focusLabelMessages = [
    "Devagar, ok? O que precisa de foco agora?",
    "No que você quer focar agora?",
    "Vamos com calma. Qual a prioridade?",
    "O que te chama agora?",
    "Onde você quer colocar energia?",
    "O que merece sua atenção agora?",
    "Um de cada vez. Por onde começamos?",
    "Foca só no que importa agora.",
    "Sem pressa. Qual é o primeiro passo?",
    "Seja gentil. O que precisa de atenção?",
    "Vai dar certo. O que você quer focar?",
    "Estou com você. Por onde começamos?",
    "Vamos juntos. O que precisa de foco?",
    "Um passo de cada vez. Qual a prioridade?",
    "Respira fundo. O que precisa de atenção?",
    "Vai valer a pena. Qual é o foco?",
];

const FocusInput: React.FC = () => {
    const {
        currentFocusPoints, setCurrentFocusPoints, addFocusPoint, removeFocusPoint,
        styles, debouncedPlayTypingSound, playSound
    } = usePomodoro();

    const randomLabel = useMemo(() => {
        const index = Math.floor(Math.random() * focusLabelMessages.length);
        return focusLabelMessages[index];
    }, []);

    const [newPoint, setNewPoint] = useState('');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editText, setEditText] = useState('');
    const editInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editingIndex !== null && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingIndex]);

    const handleAddClick = () => {
        if (newPoint.trim()) {
            addFocusPoint(newPoint.trim());
            setNewPoint('');
        }
    };

    const handleAddKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        debouncedPlayTypingSound();
        if (event.key === 'Enter') {
            event.preventDefault();
            handleAddClick();
        }
    };

    const handleRemoveClick = (index: number) => {
        removeFocusPoint(index);
    };

    const handleEditStart = (index: number) => {
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
            handleEditCancel();
            alert("O ponto de foco não pode ser vazio.");
            return;
        }
        const updatedPoints = currentFocusPoints.map((point, index) => index === editingIndex ? trimmedText : point);
        setCurrentFocusPoints(updatedPoints);
        playSound('confirm');
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
        <div className="space-y-2 flex flex-col h-full">
            <label htmlFor="newFocusPoint" className="block text-sm font-medium opacity-90 flex-shrink-0">
                {randomLabel}
            </label>

            <div className="flex items-center space-x-2 flex-shrink-0">
                <input
                    type="text" id="newFocusPoint" value={newPoint}
                    onChange={(e) => setNewPoint(e.target.value)} onKeyDown={handleAddKeyDown}
                    placeholder="Adicionar novo ponto..."
                    className={`flex-grow ${baseStyles.inputBase} ${styles.inputBgColor} ${styles.textColor}`}
                // readOnly e disabled removidos
                />
                <button
                    type="button" onClick={handleAddClick} className={`${baseStyles.addButton} ${styles.buttonColor} ${!newPoint.trim() ? baseStyles.buttonDisabled : ''}`}
                    // disabled removido da condição isReadOnly, mantendo apenas para input vazio
                    aria-label="Adicionar ponto de foco" title="Adicionar"
                    disabled={!newPoint.trim()} // Mantém desabilitado se o input estiver vazio
                >
                    <FiPlus className="h-5 w-5" />
                </button>
            </div>

            <div className="flex-1 min-h-0 mt-1 overflow-y-auto custom-scrollbar pr-1 pb-1">
                {currentFocusPoints.length > 0 ? (
                    <ul className="space-y-1.5">
                        {currentFocusPoints.map((point, index) => (
                            <li key={`focus-${index}-${point}`} className={baseStyles.listItemBase}>
                                {editingIndex === index ? (
                                    <>
                                        <input
                                            ref={editInputRef} type="text" value={editText}
                                            onChange={(e) => setEditText(e.target.value)} onKeyDown={handleEditKeyDown}
                                            className={`flex-grow p-1 mr-1 rounded border border-white/20 focus:ring-1 focus:outline-none text-sm ${styles.inputBgColor} ${styles.textColor} focus:${styles.modalAccentColor}`}
                                            aria-label={`Editar ponto: ${point}`}
                                        />
                                        <div className="flex items-center space-x-0.5">
                                            <button type="button" onClick={handleEditSave} className={`${baseStyles.itemActionButton} ${baseStyles.itemSaveButton}`} aria-label="Salvar" title="Salvar"> <FiCheck className="h-4 w-4" /> </button>
                                            <button type="button" onClick={handleEditCancel} className={`${baseStyles.itemActionButton} ${baseStyles.itemCancelButton}`} aria-label="Cancelar" title="Cancelar"> <FiX className="h-4 w-4" /> </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <span
                                            className={`${baseStyles.itemText} cursor-pointer hover:opacity-75`} // Removido condição !isReadOnly para sempre ser editável
                                            onClick={() => handleEditStart(index)}
                                            title="Clique para editar" // Simplificado title
                                        > {point} </span>
                                        <button
                                            type="button" onClick={() => handleRemoveClick(index)}
                                            className={`${baseStyles.itemActionButton} ${baseStyles.itemDeleteButton}`} // Removido condição isReadOnly de buttonDisabled
                                            // disabled e condição isReadOnly removidos, sempre habilitado para remover
                                            aria-label={`Remover ponto: ${point}`} title="Remover"
                                        > <FiTrash2 className="h-4 w-4" /> </button>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex justify-center items-center h-full">
                        <p className="text-xs text-center opacity-60 italic">Nenhum ponto de foco adicionado.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
export { FocusInput };