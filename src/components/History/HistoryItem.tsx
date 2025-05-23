import React, { useState, KeyboardEvent, useMemo, useRef, useEffect } from 'react';
import { HistoryEntry, HistoryUpdateData } from '../../types';
import { formatTime, formatTimestamp } from '../../utils/formatters';
import { usePomodoro } from '../../contexts/PomodoroContext';
import {
    FiEdit2, FiTrash2, FiSave, FiX,
    FiTarget, FiFileText, FiCalendar, FiClock, FiChevronsRight
} from 'react-icons/fi';

interface HistoryItemProps {
    entry: HistoryEntry;
}

export const HistoryItem: React.FC<HistoryItemProps> = ({ entry }) => {
    const { styles, updateHistoryEntry, deleteHistoryEntry, playSound, debouncedPlayTypingSound } = usePomodoro();
    const [isEditing, setIsEditing] = useState(false);
    const [editedFocus, setEditedFocus] = useState('');
    const [editedFeedback, setEditedFeedback] = useState('');
    const [editedNextPlans, setEditedNextPlans] = useState('');
    const [editedStartTime, setEditedStartTime] = useState('');
    const [editedEndTime, setEditedEndTime] = useState('');
    const focusTextAreaRef = useRef<HTMLTextAreaElement>(null);

    const timestampToDateTimeLocalString = (timestamp: number): string => {
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return '';
            const timezoneOffset = date.getTimezoneOffset() * 60000;
            const localISOTime = new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
            return localISOTime;
        } catch (e) {
            console.error("Error converting timestamp to datetime-local string:", e);
            return '';
        }
    };

    const dateTimeLocalStringToTimestamp = (dateTimeString: string): number | null => {
        try {
            if (!dateTimeString) return null;
            const date = new Date(dateTimeString);
            if (isNaN(date.getTime())) return null;
            return date.getTime();
        } catch (e) {
            console.error("Error converting datetime-local string to timestamp:", e);
            return null;
        }
    };

    const nextPlansArray: string[] = useMemo(() => {
        if (Array.isArray(entry.nextFocusPlans)) return entry.nextFocusPlans;
        if (typeof entry.nextFocusPlans === 'string') {
             const plansString = entry.nextFocusPlans as string;
             if (plansString.trim() !== '') {
                 return plansString.split('\n').map(p => p.trim()).filter(p => p !== '');
            }
        }
        return [];
    }, [entry.nextFocusPlans]);

    const pointsArray: string[] = useMemo(() => {
        if (Array.isArray(entry.focusPoints)) return entry.focusPoints;
        if (typeof entry.focusPoints === 'string') {
            const focusString = entry.focusPoints as string;
            if (focusString.trim() !== '') {
                 return focusString.split('\n').map(p => p.trim()).filter(p => p !== '');
            }
        }
        return [];
    }, [entry.focusPoints]);

    useEffect(() => {
        if (isEditing) {
            focusTextAreaRef.current?.focus();
            focusTextAreaRef.current?.select();
        }
    }, [isEditing]);

    const focusPointsToString = (points: string[]): string => (points || []).join('\n');
    const stringToFocusPoints = (text: string): string[] => text.split('\n').map(p => p.trim()).filter(p => p !== '');
    const nextPlansToString = (plans: string[]): string => (plans || []).join('\n');
    const stringToNextPlans = (text: string): string[] => text.split('\n').map(p => p.trim()).filter(p => p !== '');

    const handleEditClick = () => {
        setEditedFocus(focusPointsToString(pointsArray));
        setEditedFeedback(entry.feedbackNotes || '');
        setEditedNextPlans(nextPlansToString(nextPlansArray));
        setEditedStartTime(timestampToDateTimeLocalString(entry.startTime));
        setEditedEndTime(timestampToDateTimeLocalString(entry.endTime));
        setIsEditing(true);
        playSound('click');
    };

    const handleCancelClick = () => {
        setIsEditing(false);
        playSound('click');
    };

    const handleSaveClick = () => {
        const updates: HistoryUpdateData = {};
        const newFocusArray = stringToFocusPoints(editedFocus);
        const newNextPlansArray = stringToNextPlans(editedNextPlans);
        const newStartTime = dateTimeLocalStringToTimestamp(editedStartTime);
        const newEndTime = dateTimeLocalStringToTimestamp(editedEndTime);

        let hasChanges = false;

        if (JSON.stringify(newFocusArray) !== JSON.stringify(pointsArray)) {
            updates.focusPoints = newFocusArray;
            hasChanges = true;
        }
        if (editedFeedback.trim() !== (entry.feedbackNotes?.trim() || '')) {
            updates.feedbackNotes = editedFeedback.trim() === '' ? '' : editedFeedback.trim();
            hasChanges = true;
        }
        if (JSON.stringify(newNextPlansArray) !== JSON.stringify(nextPlansArray)) {
            updates.nextFocusPlans = newNextPlansArray.length > 0 ? newNextPlansArray : undefined;
            hasChanges = true;
        }
        if (newStartTime !== null && newStartTime !== entry.startTime) {
            updates.startTime = newStartTime;
            hasChanges = true;
        }
        if (newEndTime !== null && newEndTime !== entry.endTime) {
            // Basic validation: end time should not be before start time
            const effectiveStartTime = newStartTime ?? entry.startTime;
            if (newEndTime >= effectiveStartTime) {
                updates.endTime = newEndTime;
                hasChanges = true;
            } else {
                 console.warn("End time cannot be before start time. End time change ignored.");
                 // Optionally provide user feedback here
            }
        }

        if (hasChanges) {
            updateHistoryEntry(entry.id, updates);
        } else {
            playSound('click');
        }
        setIsEditing(false);
    };

    const handleDeleteClick = () => {
        deleteHistoryEntry(entry.id);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        if (event.target instanceof HTMLTextAreaElement) {
            debouncedPlayTypingSound();
        }
        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            handleSaveClick();
        } else if (event.key === 'Escape') {
            event.preventDefault();
            handleCancelClick();
        }
    };

    const metadataItemStyle = "flex items-center gap-1";
    const metadataIconStyle = "w-3 h-3 flex-shrink-0";
    const sectionLabelStyle = "flex items-center gap-1.5 font-medium text-sm opacity-90 mb-1";
    const sectionIconStyle = "w-3.5 h-3.5";
    const contentTextStyle = "text-sm opacity-90 leading-relaxed";
    const baseInputStyle = `w-full p-2 rounded-lg border-none focus:ring-2 focus:outline-none text-sm custom-scrollbar ${styles.inputBgColor} ${styles.textColor} focus:${styles.modalAccentColor}`;
    const editTextAreaStyle = `${baseInputStyle} resize-none`;
    const editInputStyle = `${baseInputStyle}`; // Style for date/time inputs
    const baseButtonStyle = `p-1.5 rounded-md transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-black/30`;
    const actionIconStyle = "h-4 w-4";

    return (
        <li className={`p-4 rounded-2xl bg-black/30 border-l-4 ${styles.finalHistoryBorderColor} transition-all duration-200 ease-in-out group relative shadow-md hover:shadow-lg hover:bg-black/35`}>
            <div className={`grid ${isEditing ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:flex sm:flex-wrap'} justify-between items-center mb-4 text-xs opacity-80 gap-x-3 gap-y-2`}>
                 {isEditing ? (
                     <>
                        <div className="space-y-1">
                            <label htmlFor={`edit-start-time-${entry.id}`} className={`${sectionLabelStyle} !text-xs !mb-0.5`}>
                                <FiCalendar className={metadataIconStyle} /><span>Início</span>
                            </label>
                            <input
                                type="datetime-local"
                                id={`edit-start-time-${entry.id}`}
                                value={editedStartTime}
                                onChange={(e) => setEditedStartTime(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className={editInputStyle}
                            />
                        </div>
                         <div className="space-y-1">
                             <label htmlFor={`edit-end-time-${entry.id}`} className={`${sectionLabelStyle} !text-xs !mb-0.5`}>
                                 <FiClock className={metadataIconStyle} /><span>Fim</span>
                             </label>
                            <input
                                type="datetime-local"
                                id={`edit-end-time-${entry.id}`}
                                value={editedEndTime}
                                onChange={(e) => setEditedEndTime(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className={editInputStyle}
                                min={editedStartTime || undefined} // Basic validation: end time cannot be before start time
                            />
                        </div>
                     </>
                 ) : (
                    <>
                        <div className={metadataItemStyle} title="Data"><FiCalendar className={metadataIconStyle} /><span>{new Date(entry.startTime).toLocaleDateString('pt-BR')}</span></div>
                        <div className={metadataItemStyle} title="Horário (Início-Fim)"><FiClock className={metadataIconStyle} /><span>{formatTimestamp(entry.startTime)}-{formatTimestamp(entry.endTime)}</span></div>
                        <div className={`${metadataItemStyle} font-medium opacity-90`} title="Duração Foco"><FiTarget className={metadataIconStyle} /><span>{formatTime(entry.duration)}</span></div>
                        <div className="flex-grow hidden sm:block"></div>
                    </>
                 )}
            </div>

            <div className={`space-y-4 ${isEditing ? 'mb-2' : ''}`}>
                {(pointsArray.length > 0 || isEditing) && (
                    <div>
                        <label className={sectionLabelStyle} htmlFor={isEditing ? `edit-focus-${entry.id}` : undefined}>
                            <FiTarget className={`${sectionIconStyle} text-blue-400/80`} /><span>Foco</span>
                        </label>
                        {isEditing ? (
                            <textarea
                                ref={focusTextAreaRef} id={`edit-focus-${entry.id}`} value={editedFocus}
                                onChange={(e) => setEditedFocus(e.target.value)} onKeyDown={handleKeyDown}
                                rows={3} className={editTextAreaStyle} placeholder="Um ponto de foco por linha..."
                            />
                        ) : (
                            <ul className={`list-disc list-inside space-y-1 pl-1 ${contentTextStyle}`}>
                                {pointsArray.map((point, index) => ( <li key={index} className="break-words">{point}</li> ))}
                            </ul>
                        )}
                    </div>
                )}

                {(entry.feedbackNotes || isEditing) && (
                    <div>
                         <label className={sectionLabelStyle} htmlFor={isEditing ? `edit-feedback-${entry.id}` : undefined}>
                            <FiFileText className={`${sectionIconStyle} text-green-400/80`} /><span>Notas</span>
                         </label>
                         {isEditing ? (
                            <textarea
                                id={`edit-feedback-${entry.id}`} value={editedFeedback}
                                onChange={(e) => setEditedFeedback(e.target.value)} onKeyDown={handleKeyDown}
                                rows={3} className={editTextAreaStyle} placeholder="Como foi a sessão?"
                            />
                        ) : (
                             entry.feedbackNotes && entry.feedbackNotes.trim() !== '' ? (
                                <p className={`whitespace-pre-wrap break-words ${contentTextStyle}`}>{entry.feedbackNotes.trim()}</p>
                             ) : ( !isEditing && <span className="text-xs italic opacity-60">Nenhuma nota adicionada.</span> )
                        )}
                    </div>
                )}

                {(nextPlansArray.length > 0 || isEditing) && (
                    <div>
                         <label className={sectionLabelStyle} htmlFor={isEditing ? `edit-next-plans-${entry.id}` : undefined}>
                            <FiChevronsRight className={`${sectionIconStyle} text-orange-400/80`} /><span>Planos Próx. Foco</span>
                         </label>
                         {isEditing ? (
                            <textarea
                                id={`edit-next-plans-${entry.id}`} value={editedNextPlans}
                                onChange={(e) => setEditedNextPlans(e.target.value)} onKeyDown={handleKeyDown}
                                rows={2} className={editTextAreaStyle}
                                placeholder="Planos para o próximo foco (um por linha)..."
                            />
                        ) : (
                             <ul className={`list-none space-y-1 pl-1 ${contentTextStyle} opacity-75`}>
                                 {nextPlansArray.map((plan, index) => (
                                     <li key={index} className="break-words before:content-['▹_'] before:mr-1">{plan}</li>
                                 ))}
                             </ul>
                        )}
                    </div>
                )}

                 {pointsArray.length === 0 && !entry.feedbackNotes?.trim() && nextPlansArray.length === 0 && !isEditing && (
                     <p className="text-sm italic opacity-50 pt-1">Nenhum detalhe registrado.</p>
                 )}
            </div>

            <div className={`absolute top-2.5 right-2.5 flex items-center space-x-1 transition-opacity duration-150 ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'}`}>
                 {isEditing ? (
                    <>
                        <button onClick={handleSaveClick} aria-label="Salvar" title="Salvar (Ctrl+Enter)" className={`${baseButtonStyle} text-green-400 hover:bg-green-500/20 focus:ring-green-500`} > <FiSave className={actionIconStyle} /> </button>
                        <button onClick={handleCancelClick} aria-label="Cancelar" title="Cancelar (Esc)" className={`${baseButtonStyle} text-red-400 hover:bg-red-500/20 focus:ring-red-500`} > <FiX className={actionIconStyle} /> </button>
                    </>
                ) : (
                    <>
                        <button onClick={handleEditClick} aria-label="Editar" title="Editar" className={`${baseButtonStyle} ${styles.buttonColor} text-white/70 hover:bg-white/15 hover:text-white focus:ring-white/50`} > <FiEdit2 className={actionIconStyle} /> </button>
                        <button onClick={handleDeleteClick} aria-label="Excluir" title="Excluir" className={`${baseButtonStyle} ${styles.buttonColor} text-red-400/80 hover:bg-red-600/40 hover:text-red-300 focus:ring-red-500`} > <FiTrash2 className={actionIconStyle} /> </button>
                    </>
                 )}
             </div>
        </li>
    );
};