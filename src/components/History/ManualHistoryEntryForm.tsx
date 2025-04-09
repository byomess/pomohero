// src/components/History/ManualHistoryEntryForm.tsx
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { usePomodoro } from '../../contexts/PomodoroContext';
import { ManualHistoryEntryData } from '../../types';
import { FiSave, FiX } from 'react-icons/fi';

interface ManualHistoryEntryFormProps {
    onClose: () => void;
}

const getCurrentDateTimeLocal = (): string => {
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 16);
    return localISOTime;
};

const dateTimeLocalToTimestamp = (dateTimeString: string): number => {
    if (!dateTimeString) return NaN;
    return new Date(dateTimeString).getTime();
};

const stringToFocusPoints = (text: string): string[] => {
    return text.split('\n').map(p => p.trim()).filter(p => p !== '');
};

export const ManualHistoryEntryForm: React.FC<ManualHistoryEntryFormProps> = ({ onClose }) => {
    const { addManualHistoryEntry, styles } = usePomodoro();
    const [startTimeStr, setStartTimeStr] = useState(getCurrentDateTimeLocal());
    const [endTimeStr, setEndTimeStr] = useState(getCurrentDateTimeLocal());
    const [focusPointsText, setFocusPointsText] = useState('');
    const [feedbackNotes, setFeedbackNotes] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        setError(null);

        const startTime = dateTimeLocalToTimestamp(startTimeStr);
        const endTime = dateTimeLocalToTimestamp(endTimeStr);

        if (!startTimeStr || !endTimeStr || isNaN(startTime) || isNaN(endTime)) {
            setError("Datas de início e/ou fim inválidas ou não preenchidas.");
            return;
        }
        if (endTime <= startTime) {
            setError("A data/hora de fim deve ser posterior à data/hora de início.");
            return;
        }

        const focusPointsArray = stringToFocusPoints(focusPointsText);
        if (focusPointsArray.length === 0) {
             setError("É necessário adicionar pelo menos um ponto de foco válido.");
             return;
        }

        const duration = Math.round((endTime - startTime) / 1000);
        if (duration < 0) {
             setError("Erro no cálculo da duração. Verifique as datas.");
             return;
        }

        const newEntryData: ManualHistoryEntryData = {
            startTime,
            endTime,
            duration,
            focusPoints: focusPointsArray,
            feedbackNotes: feedbackNotes.trim(),
        };

        try {
            addManualHistoryEntry(newEntryData);
            onClose();
        } catch (e) {
            console.error("Error adding manual entry:", e);
            setError("Erro ao salvar a entrada no histórico.");
        }
    };

    const formElementStyle = `w-full p-2 rounded-lg border-none focus:ring-2 focus:outline-none text-sm custom-scrollbar-thin ${styles.inputBgColor} ${styles.textColor} ${styles.modalAccentColor}`;
    const labelStyle = "block text-xs font-medium mb-1 opacity-90";
    // Estilo inline para sugerir ícone claro para o date picker
    const dateInputStyle = { colorScheme: 'dark' };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             {error && (
                <p className="text-xs text-red-300 bg-red-900/60 p-2 rounded-lg text-center border border-red-500/50 animate-fade-in-down">
                    {error}
                </p>
             )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="manualStartTime" className={labelStyle}>Início:</label>
                    <input
                        type="datetime-local"
                        id="manualStartTime"
                        value={startTimeStr}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setStartTimeStr(e.target.value)}
                        required
                        className={`${formElementStyle} text-xs`} // Use consistent style
                        // Aplicar o estilo inline aqui
                        style={dateInputStyle}
                    />
                </div>
                 <div>
                    <label htmlFor="manualEndTime" className={labelStyle}>Fim:</label>
                    <input
                        type="datetime-local"
                        id="manualEndTime"
                        value={endTimeStr}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setEndTimeStr(e.target.value)}
                        required
                        className={`${formElementStyle} text-xs`} // Use consistent style
                         // Aplicar o estilo inline aqui
                        style={dateInputStyle}
                    />
                </div>
            </div>
            <div>
                <label htmlFor="manualFocusPoints" className={labelStyle}>
                    Pontos de Foco (um por linha) <span className="text-red-400">*</span>:
                </label>
                <textarea
                    id="manualFocusPoints"
                    rows={4}
                    value={focusPointsText}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFocusPointsText(e.target.value)}
                    required
                    className={`${formElementStyle} resize-none`}
                    placeholder="Digite cada ponto de foco em uma nova linha..."
                />
            </div>
            <div>
                 <label htmlFor="manualFeedbackNotes" className={labelStyle}>
                     Notas de Feedback (Opcional):
                </label>
                <textarea
                    id="manualFeedbackNotes"
                    rows={3}
                    value={feedbackNotes}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFeedbackNotes(e.target.value)}
                    className={`${formElementStyle} resize-none`}
                    placeholder="Como foi a sessão?"
                />
            </div>
            <div className="flex justify-end items-center space-x-3 pt-2">
                 <button
                    type="button"
                    onClick={onClose}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium ${styles.buttonColor} hover:bg-white/15 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black/30 flex items-center gap-1.5`}
                 >
                     <FiX className="h-4 w-4" /> Cancelar
                </button>
                 <button
                    type="submit"
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold ${styles.buttonActiveColor} hover:opacity-95 transition-opacity flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/30 ${styles.modalAccentColor}`}
                 >
                     <FiSave className="h-4 w-4" /> Salvar Entrada
                 </button>
             </div>
        </form>
    );
};