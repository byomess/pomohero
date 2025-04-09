// src/components/History/ManualHistoryEntryForm.tsx
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { usePomodoro } from '../../contexts/PomodoroContext';
import { ManualHistoryEntryData } from '../../types';
import { FiSave, FiX } from 'react-icons/fi'; // Using FiX for cancel

interface ManualHistoryEntryFormProps {
    onClose: () => void; // Function to call when closing the form
}

// Helper to get current datetime-local string formatted for input type="datetime-local"
const getCurrentDateTimeLocal = (): string => {
    const now = new Date();
    // Adjust for timezone offset to get local time correctly formatted
    const timezoneOffset = now.getTimezoneOffset() * 60000; // Offset in milliseconds
    const localISOTime = new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 16);
    // Format is YYYY-MM-DDTHH:mm
    return localISOTime;
};

// Helper to convert datetime-local string (assumed local time) to UTC timestamp
const dateTimeLocalToTimestamp = (dateTimeString: string): number => {
     // new Date() parsing of "YYYY-MM-DDTHH:mm" assumes local time zone
     // getTime() returns milliseconds since UTC epoch, which is what we want for timestamp
    return new Date(dateTimeString).getTime();
};


export const ManualHistoryEntryForm: React.FC<ManualHistoryEntryFormProps> = ({ onClose }) => {
    const { addManualHistoryEntry, styles } = usePomodoro();
    // Initialize state with current local time
    const [startTimeStr, setStartTimeStr] = useState(getCurrentDateTimeLocal());
    const [endTimeStr, setEndTimeStr] = useState(getCurrentDateTimeLocal());
    const [focusPoints, setFocusPoints] = useState('');
    const [feedbackNotes, setFeedbackNotes] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        setError(null); // Clear previous errors

        const startTime = dateTimeLocalToTimestamp(startTimeStr);
        const endTime = dateTimeLocalToTimestamp(endTimeStr);

        // Basic Validation
        if (!startTimeStr || !endTimeStr || isNaN(startTime) || isNaN(endTime)) {
            setError("Datas de início e/ou fim inválidas ou não preenchidas.");
            return;
        }
        if (endTime <= startTime) {
            setError("A data/hora de fim deve ser posterior à data/hora de início.");
            return;
        }
        if (focusPoints.trim() === '') {
             setError("Os pontos de foco são obrigatórios.");
             return;
        }

        const duration = Math.round((endTime - startTime) / 1000); // Duration in seconds

        // Ensure duration is non-negative, although covered by endTime > startTime check
        if (duration < 0) {
             setError("Erro no cálculo da duração. Verifique as datas.");
             return;
        }


        const newEntryData: ManualHistoryEntryData = {
            startTime,
            endTime,
            duration,
            focusPoints: focusPoints.trim(),
            feedbackNotes: feedbackNotes.trim(),
        };

        try {
            addManualHistoryEntry(newEntryData);
            onClose(); // Close the form on successful submission
        } catch (e) {
            console.error("Error adding manual entry:", e);
            setError("Erro ao salvar a entrada no histórico.");
        }
    };

    // Base styles for inputs/textareas in this form
    const formInputStyle = `w-full p-2 rounded border border-white/10 focus:ring-1 focus:outline-none text-sm ${styles.inputBgColor} ${styles.textColor} focus:${styles.modalAccentColor}`;

    return (
        // Keep padding on the form itself for internal spacing
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Optional: Title inside the form if needed, otherwise HistoryList title is enough */}
            {/* <h3 className="text-base font-medium text-center opacity-80 mb-3">Nova Entrada Manual</h3> */}

             {error && (
                <p className="text-xs text-red-300 bg-red-900/60 p-2 rounded text-center border border-red-500/50 animate-fade-in-down">
                    {error}
                </p>
             )}

            {/* Date/Time Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="manualStartTime" className="block text-xs font-medium mb-1.5 opacity-80">Início:</label>
                    <input
                        type="datetime-local"
                        id="manualStartTime"
                        value={startTimeStr}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setStartTimeStr(e.target.value)}
                        required
                        className={formInputStyle}
                     />
                </div>
                 <div>
                    <label htmlFor="manualEndTime" className="block text-xs font-medium mb-1.5 opacity-80">Fim:</label>
                    <input
                        type="datetime-local"
                        id="manualEndTime"
                        value={endTimeStr}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setEndTimeStr(e.target.value)}
                        required
                        className={formInputStyle}
                    />
                </div>
            </div>

            {/* Focus Points */}
            <div>
                <label htmlFor="manualFocusPoints" className="block text-xs font-medium mb-1.5 opacity-80">
                    Pontos de Foco <span className="text-red-400">*</span>:
                </label>
                <textarea
                    id="manualFocusPoints"
                    rows={3}
                    value={focusPoints}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFocusPoints(e.target.value)}
                    required
                    className={`${formInputStyle} resize-none`}
                    placeholder="O que você focou?"
                />
            </div>

             {/* Feedback Notes */}
            <div>
                 <label htmlFor="manualFeedbackNotes" className="block text-xs font-medium mb-1.5 opacity-80">
                     Notas de Feedback (Opcional):
                </label>
                <textarea
                    id="manualFeedbackNotes"
                    rows={3}
                    value={feedbackNotes}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFeedbackNotes(e.target.value)}
                    className={`${formInputStyle} resize-none`}
                    placeholder="Como foi a sessão?"
                />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end items-center space-x-3 pt-2">
                 <button
                    type="button" // Prevents implicit form submission
                    onClick={onClose}
                    className={`px-4 py-1.5 rounded-md text-xs font-medium ${styles.buttonColor} hover:bg-white/15 transition-colors focus:outline-none focus:ring-1 focus:ring-white/40 flex items-center gap-1.5`}
                 >
                     <FiX className="h-4 w-4" /> Cancelar
                </button>
                 <button
                    type="submit"
                    className={`px-4 py-1.5 rounded-md text-xs font-semibold ${styles.buttonActiveColor} hover:opacity-95 transition-opacity flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-offset-2 focus:ring-offset-black/30 ${styles.modalAccentColor.replace('ring-','focus:ring-')}`} // Apply focus ring color properly
                 >
                     <FiSave className="h-4 w-4" /> Salvar Entrada
                 </button>
             </div>
        </form>
    );
};