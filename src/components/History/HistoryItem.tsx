// src/components/History/HistoryItem.tsx
import React, { useState, ChangeEvent } from 'react';
import { HistoryEntry, HistoryUpdateData } from '../../types';
import { formatTime, formatTimestamp } from '../../utils/formatters';
import { usePomodoro } from '../../contexts/PomodoroContext';
import {
    FiEdit2, FiTrash2, FiSave, FiXCircle,
    FiTarget, FiFileText, FiCalendar, FiClock // Icons for labels
} from 'react-icons/fi';

interface HistoryItemProps {
    entry: HistoryEntry;
}

export const HistoryItem: React.FC<HistoryItemProps> = ({ entry }) => {
    const { styles, updateHistoryEntry, deleteHistoryEntry } = usePomodoro();
    const [isEditing, setIsEditing] = useState(false);
    const [editedFocus, setEditedFocus] = useState(entry.focusPoints);
    const [editedFeedback, setEditedFeedback] = useState(entry.feedbackNotes);

    const handleEditClick = () => {
        setEditedFocus(entry.focusPoints);
        setEditedFeedback(entry.feedbackNotes);
        setIsEditing(true);
    };

    const handleCancelClick = () => {
        setIsEditing(false);
    };

    const handleSaveClick = () => {
        const updates: HistoryUpdateData = {};
        if (editedFocus !== entry.focusPoints) updates.focusPoints = editedFocus;
        if (editedFeedback !== entry.feedbackNotes) updates.feedbackNotes = editedFeedback;

        if (Object.keys(updates).length > 0) {
            updateHistoryEntry(entry.id, updates);
        }
        setIsEditing(false);
    };

    const handleDeleteClick = () => {
        deleteHistoryEntry(entry.id);
    };

    // Base styles for text areas in edit mode
    const editTextAreaStyle = `w-full p-2 rounded border border-white/10 focus:ring-1 focus:outline-none text-sm resize-none ${styles.inputBgColor} ${styles.textColor} focus:${styles.modalAccentColor}`;

    return (
        // Increased padding, softer background, improved transition
        <li className={`p-4 rounded-xl bg-black/30 border-l-4 ${styles.finalHistoryBorderColor} transition-all duration-200 ease-in-out group relative shadow-sm hover:shadow-md hover:bg-black/40`}>

            {/* --- Timestamp & Duration Row (Improved Layout) --- */}
            <div className="flex flex-wrap justify-between items-center mb-3 text-xs opacity-75 gap-x-4 gap-y-1">
                 {/* Date Info */}
                 <div className="flex items-center gap-1.5" title="Data da Sessão">
                    <FiCalendar className="w-3.5 h-3.5 flex-shrink-0" />
                     <span>{new Date(entry.startTime).toLocaleDateString('pt-BR')}</span>
                </div>
                 {/* Time Info */}
                <div className="flex items-center gap-1.5" title="Horário (Início - Fim)">
                    <FiClock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{formatTimestamp(entry.startTime)} - {formatTimestamp(entry.endTime)}</span>
                </div>
                 {/* Duration */}
                <div className="flex items-center gap-1.5 font-medium" title="Duração da Sessão de Foco">
                    {/* Using FiTarget as a generic icon for duration */}
                     <FiTarget className="w-3.5 h-3.5 flex-shrink-0" />
                     <span>{formatTime(entry.duration)}</span>
                </div>
            </div>

            {/* Content Sections */}
            <div className={`space-y-3 ${isEditing ? 'pt-1 pb-2' : ''}`}>
                {/* Focus Points */}
                {(entry.focusPoints || isEditing) && (
                    <div>
                        {/* Label with Icon */}
                        <label className="flex items-center gap-1.5 font-medium text-sm opacity-95 mb-1.5">
                            <FiTarget className="w-4 h-4 text-blue-300/80" />
                            <span>Foco</span>
                        </label>
                        {isEditing ? (
                            <textarea
                                value={editedFocus}
                                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditedFocus(e.target.value)}
                                rows={3} // Slightly more space for editing
                                className={editTextAreaStyle}
                                placeholder="Descreva os pontos de foco..."
                            />
                        ) : (
                            <p className="text-sm whitespace-pre-wrap break-words opacity-85 pl-1 leading-relaxed">
                                {entry.focusPoints || <span className="italic opacity-60">N/A</span>}
                            </p>
                        )}
                    </div>
                )}

                {/* Feedback Notes */}
                {(entry.feedbackNotes || isEditing) && (
                    <div>
                        {/* Label with Icon */}
                         <label className="flex items-center gap-1.5 font-medium text-sm opacity-95 mb-1.5">
                            <FiFileText className="w-4 h-4 text-green-300/80" />
                            <span>Notas</span>
                        </label>
                        {isEditing ? (
                            <textarea
                                value={editedFeedback}
                                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditedFeedback(e.target.value)}
                                rows={3}
                                className={editTextAreaStyle}
                                placeholder="Adicione notas de feedback..."
                            />
                        ) : (
                            <p className="text-sm whitespace-pre-wrap break-words opacity-85 pl-1 leading-relaxed">
                                {entry.feedbackNotes || <span className="italic opacity-60">N/A</span>}
                            </p>
                        )}
                    </div>
                )}

                 {/* Placeholder if empty and not editing */}
                 {!entry.focusPoints && !entry.feedbackNotes && !isEditing && (
                     <p className="text-sm italic opacity-50 pt-2">Nenhuma descrição ou nota registrada.</p>
                 )}
            </div>


            {/* --- Action Buttons (Improved Styling & Positioning) --- */}
             {/* Adjusted position, increased padding, slightly softer background on hover */}
            <div className={`absolute bottom-3 right-3 flex items-center space-x-1.5 transition-opacity duration-150 ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-90 focus-within:opacity-90'}`}>
                 {isEditing ? (
                    <>
                        <button
                            onClick={handleSaveClick}
                            aria-label="Salvar alterações"
                            title="Salvar"
                            className={`p-2 rounded-md ${styles.buttonColor} bg-green-600/30 hover:bg-green-500/40 text-green-200 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-green-400`}
                        >
                            <FiSave className="h-4 w-4" />
                        </button>
                         <button
                            onClick={handleCancelClick}
                            aria-label="Cancelar edição"
                            title="Cancelar"
                            className={`p-2 rounded-md ${styles.buttonColor} bg-red-600/30 hover:bg-red-500/40 text-red-200 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-red-400`}
                        >
                            <FiXCircle className="h-4 w-4" />
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={handleEditClick}
                            aria-label="Editar entrada"
                             title="Editar"
                            className={`p-2 rounded-md ${styles.buttonColor} hover:bg-white/25 text-white/70 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-white/50`}
                         >
                            <FiEdit2 className="h-4 w-4" />
                        </button>
                        <button
                            onClick={handleDeleteClick}
                            aria-label="Excluir entrada"
                            title="Excluir"
                            className={`p-2 rounded-md ${styles.buttonColor} hover:bg-red-600/50 text-red-400 hover:text-red-200 transition-colors focus:outline-none focus:ring-1 focus:ring-red-500`}
                        >
                            <FiTrash2 className="h-4 w-4" />
                        </button>
                    </>
                 )}
             </div>
        </li>
    );
};