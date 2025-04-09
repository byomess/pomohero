// src/components/History/HistoryItem.tsx
import React, { useState, ChangeEvent, KeyboardEvent, useMemo, useRef, useEffect } from 'react';
import { HistoryEntry, HistoryUpdateData } from '../../types';
import { formatTime, formatTimestamp } from '../../utils/formatters';
import { usePomodoro } from '../../contexts/PomodoroContext';
import {
    FiEdit2, FiTrash2, FiSave, FiX, // Using FiX for cancel in edit mode
    FiTarget, FiFileText, FiCalendar, FiClock
} from 'react-icons/fi';

interface HistoryItemProps {
    entry: HistoryEntry;
}

export const HistoryItem: React.FC<HistoryItemProps> = ({ entry }) => {
    const { styles, updateHistoryEntry, deleteHistoryEntry, playSound, debouncedPlayTypingSound } = usePomodoro();
    const [isEditing, setIsEditing] = useState(false);
    const [editedFocus, setEditedFocus] = useState('');
    const [editedFeedback, setEditedFeedback] = useState('');
    const focusTextAreaRef = useRef<HTMLTextAreaElement>(null); // Ref for focus textarea

    // --- Data Normalization (unchanged) ---
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
    // -------------------------

    // Focus the first textarea when editing starts
    useEffect(() => {
        if (isEditing) {
            focusTextAreaRef.current?.focus();
            focusTextAreaRef.current?.select();
        }
    }, [isEditing]);


    const focusPointsToString = (points: string[]): string => (points || []).join('\n');
    const stringToFocusPoints = (text: string): string[] => text.split('\n').map(p => p.trim()).filter(p => p !== '');

    const handleEditClick = () => {
        setEditedFocus(focusPointsToString(pointsArray));
        setEditedFeedback(entry.feedbackNotes || '');
        setIsEditing(true);
        playSound('click'); // Play sound on starting edit
    };

    const handleCancelClick = () => {
        setIsEditing(false);
        // No need to reset state here, it will be re-read on next edit
        playSound('click');
    };

    const handleSaveClick = () => {
        const updates: HistoryUpdateData = {};
        const newFocusArray = stringToFocusPoints(editedFocus);

        if (JSON.stringify(newFocusArray) !== JSON.stringify(pointsArray)) {
            updates.focusPoints = newFocusArray;
        }
        // Ensure comparison handles potential null/undefined from entry.feedbackNotes
        if (editedFeedback.trim() !== (entry.feedbackNotes?.trim() || '')) {
             // Save trimmed notes, or null/empty string if only whitespace
            updates.feedbackNotes = editedFeedback.trim() === '' ? '' : editedFeedback.trim();
        }

        if (Object.keys(updates).length > 0) {
            updateHistoryEntry(entry.id, updates); // Plays its own sound
        } else {
            playSound('click'); // Play click sound if no changes were saved
        }
        setIsEditing(false);
    };

    const handleDeleteClick = () => {
        deleteHistoryEntry(entry.id); // Plays its own sound
    };

    // Handle keydown in textareas for saving/canceling
    const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        debouncedPlayTypingSound();
        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
             // Save on Ctrl+Enter or Cmd+Enter
            event.preventDefault();
            handleSaveClick();
        } else if (event.key === 'Escape') {
            // Cancel on Escape
            event.preventDefault();
            handleCancelClick();
        }
    };


    // --- Reusable Styles ---
    const metadataItemStyle = "flex items-center gap-1"; // Reduced gap slightly
    const metadataIconStyle = "w-3 h-3 flex-shrink-0"; // Smaller metadata icons
    const sectionLabelStyle = "flex items-center gap-1.5 font-medium text-sm opacity-90 mb-1"; // Slightly less opacity
    const sectionIconStyle = "w-3.5 h-3.5"; // Consistent icon size for sections
    const contentTextStyle = "text-sm opacity-90 leading-relaxed"; // Increased opacity for readability
    const editTextAreaStyle = `w-full p-2 rounded-lg border-none focus:ring-2 focus:outline-none text-sm resize-none custom-scrollbar-thin ${styles.inputBgColor} ${styles.textColor} focus:${styles.modalAccentColor}`; // Consistent with other inputs
    const baseButtonStyle = `p-1.5 rounded-md transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-black/30`; // Base for action buttons
    const actionIconStyle = "h-4 w-4"; // Standard action icon size


    return (
        // Slightly larger rounding, adjusted hover brightness
        <li className={`p-4 rounded-2xl bg-black/30 border-l-4 ${styles.finalHistoryBorderColor} transition-all duration-200 ease-in-out group relative shadow-md hover:shadow-lg hover:bg-black/35`}>

            {/* --- Timestamp & Duration Row --- */}
            {/* Use grid for potentially better alignment on wrap */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-between items-center mb-4 text-xs opacity-80 gap-x-3 gap-y-1">
                 <div className={metadataItemStyle} title="Data"><FiCalendar className={metadataIconStyle} /><span>{new Date(entry.startTime).toLocaleDateString('pt-BR')}</span></div>
                 <div className={metadataItemStyle} title="Horário (Início-Fim)"><FiClock className={metadataIconStyle} /><span>{formatTimestamp(entry.startTime)}-{formatTimestamp(entry.endTime)}</span></div>
                 {/* Make duration slightly more prominent */}
                 <div className={`${metadataItemStyle} font-medium opacity-90`} title="Duração Foco"><FiTarget className={metadataIconStyle} /><span>{formatTime(entry.duration)}</span></div>
                 <div className="flex-grow hidden sm:block"></div> {/* Spacer for flex layout */}
            </div>

            {/* --- Content Sections --- */}
            <div className={`space-y-4 ${isEditing ? 'mb-2' : ''}`}> {/* Increased spacing between sections */}
                {/* Focus Points */}
                {(pointsArray.length > 0 || isEditing) && (
                    <div>
                        <label className={sectionLabelStyle} htmlFor={isEditing ? `edit-focus-${entry.id}` : undefined}>
                            <FiTarget className={`${sectionIconStyle} text-blue-400/80`} /><span>Foco</span>
                        </label>
                        {isEditing ? (
                            <textarea
                                ref={focusTextAreaRef} // Assign ref
                                id={`edit-focus-${entry.id}`}
                                value={editedFocus}
                                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditedFocus(e.target.value)}
                                onKeyDown={handleTextareaKeyDown}
                                rows={3}
                                className={editTextAreaStyle}
                                placeholder="Um ponto de foco por linha..."
                            />
                        ) : (
                            <ul className={`list-disc list-inside space-y-1 pl-1 ${contentTextStyle}`}>
                                {pointsArray.map((point, index) => (
                                    <li key={index} className="break-words">{point}</li>
                                ))}
                                {/* No need for N/A check here, empty list just renders nothing */}
                            </ul>
                        )}
                    </div>
                )}

                {/* Feedback Notes */}
                {/* Render if editing OR if feedback exists */}
                {(entry.feedbackNotes || isEditing) && (
                    <div>
                         <label className={sectionLabelStyle} htmlFor={isEditing ? `edit-feedback-${entry.id}` : undefined}>
                            <FiFileText className={`${sectionIconStyle} text-green-400/80`} /><span>Notas</span>
                         </label>
                         {isEditing ? (
                            <textarea
                                id={`edit-feedback-${entry.id}`}
                                value={editedFeedback}
                                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditedFeedback(e.target.value)}
                                onKeyDown={handleTextareaKeyDown}
                                rows={3}
                                className={editTextAreaStyle}
                                placeholder="Como foi a sessão?"
                            />
                        ) : (
                            // Render notes only if they exist and are not just whitespace
                             entry.feedbackNotes && entry.feedbackNotes.trim() !== '' ? (
                                <p className={`whitespace-pre-wrap break-words ${contentTextStyle}`}>
                                    {entry.feedbackNotes.trim()}
                                </p>
                             ) : (
                                !isEditing && <span className="text-xs italic opacity-60">Nenhuma nota adicionada.</span> // Show placeholder only if not editing and notes are empty
                             )
                        )}
                    </div>
                )}

                 {/* Overall Placeholder if empty and not editing */}
                 {pointsArray.length === 0 && !entry.feedbackNotes?.trim() && !isEditing && (
                     <p className="text-sm italic opacity-50 pt-1">Nenhum detalhe registrado.</p>
                 )}
            </div>

            {/* --- Action Buttons --- */}
            {/* Use consistent base styles, rely on icon color/hover bg */}
            <div className={`absolute top-2.5 right-2.5 flex items-center space-x-1 transition-opacity duration-150 ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'}`}>
                 {isEditing ? (
                    // Edit Mode Buttons
                    <>
                        <button onClick={handleSaveClick} aria-label="Salvar" title="Salvar (Ctrl+Enter)" className={`${baseButtonStyle} text-green-400 hover:bg-green-500/20 focus:ring-green-500`} > <FiSave className={actionIconStyle} /> </button>
                        <button onClick={handleCancelClick} aria-label="Cancelar" title="Cancelar (Esc)" className={`${baseButtonStyle} text-red-400 hover:bg-red-500/20 focus:ring-red-500`} > <FiX className={actionIconStyle} /> </button>
                    </>
                ) : (
                    // Display Mode Buttons
                    <>
                        <button onClick={handleEditClick} aria-label="Editar" title="Editar" className={`${baseButtonStyle} ${styles.buttonColor} text-white/70 hover:bg-white/15 hover:text-white focus:ring-white/50`} > <FiEdit2 className={actionIconStyle} /> </button>
                        <button onClick={handleDeleteClick} aria-label="Excluir" title="Excluir" className={`${baseButtonStyle} ${styles.buttonColor} text-red-400/80 hover:bg-red-600/40 hover:text-red-300 focus:ring-red-500`} > <FiTrash2 className={actionIconStyle} /> </button>
                    </>
                 )}
             </div>
        </li>
    );
};