// src/components/History/ManualHistoryEntryForm.tsx
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { usePomodoro } from '../../contexts/PomodoroContext';
import { ManualHistoryEntryData } from '../../types'; // Agora espera focusPoints: string[]
import { FiSave, FiX } from 'react-icons/fi';

interface ManualHistoryEntryFormProps {
    onClose: () => void;
}

// --- Helpers (mantidos) ---
const getCurrentDateTimeLocal = (): string => {
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 16);
    return localISOTime;
};

const dateTimeLocalToTimestamp = (dateTimeString: string): number => {
    // Previne erro se string for vazia
    if (!dateTimeString) return NaN;
    return new Date(dateTimeString).getTime();
};

// Helper para converter textarea string em focus points array (igual ao HistoryItem)
const stringToFocusPoints = (text: string): string[] => {
    return text.split('\n') // Divide por quebra de linha
               .map(p => p.trim()) // Remove espaços extras de cada linha
               .filter(p => p !== ''); // Remove linhas vazias
}
// --- Fim Helpers ---

export const ManualHistoryEntryForm: React.FC<ManualHistoryEntryFormProps> = ({ onClose }) => {
    const { addManualHistoryEntry, styles } = usePomodoro();
    const [startTimeStr, setStartTimeStr] = useState(getCurrentDateTimeLocal());
    const [endTimeStr, setEndTimeStr] = useState(getCurrentDateTimeLocal());
    // Estado para a textarea, ainda uma string
    const [focusPointsText, setFocusPointsText] = useState('');
    const [feedbackNotes, setFeedbackNotes] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        setError(null);

        const startTime = dateTimeLocalToTimestamp(startTimeStr);
        const endTime = dateTimeLocalToTimestamp(endTimeStr);

        // Validação de Datas
        if (!startTimeStr || !endTimeStr || isNaN(startTime) || isNaN(endTime)) {
            setError("Datas de início e/ou fim inválidas ou não preenchidas.");
            return;
        }
        if (endTime <= startTime) {
            setError("A data/hora de fim deve ser posterior à data/hora de início.");
            return;
        }

        // Converter texto da textarea para array de focus points
        const focusPointsArray = stringToFocusPoints(focusPointsText);

        // Validação dos Pontos de Foco (agora verifica se o array está vazio)
        if (focusPointsArray.length === 0) {
             setError("É necessário adicionar pelo menos um ponto de foco válido.");
             return;
        }

        // Cálculo da Duração
        const duration = Math.round((endTime - startTime) / 1000);
        if (duration < 0) { // Redundante se endTime > startTime, mas seguro ter
             setError("Erro no cálculo da duração. Verifique as datas.");
             return;
        }

        // Criar objeto com os dados corretos (focusPoints como array)
        const newEntryData: ManualHistoryEntryData = {
            startTime,
            endTime,
            duration,
            focusPoints: focusPointsArray, // Passa o array convertido
            feedbackNotes: feedbackNotes.trim(), // Feedback ainda é string
        };

        // Tentar adicionar e fechar
        try {
            addManualHistoryEntry(newEntryData);
            onClose();
        } catch (e) {
            console.error("Error adding manual entry:", e);
            setError("Erro ao salvar a entrada no histórico.");
        }
    };

    // Estilo do input (mantido)
    const formInputStyle = `w-full p-2 rounded border border-white/10 focus:ring-1 focus:outline-none text-sm ${styles.inputBgColor} ${styles.textColor} focus:${styles.modalAccentColor}`;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             {error && (
                <p className="text-xs text-red-300 bg-red-900/60 p-2 rounded text-center border border-red-500/50 animate-fade-in-down">
                    {error}
                </p>
             )}
            {/* Inputs de Data/Hora (mantidos) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="manualStartTime" className="block text-xs font-medium mb-1.5 opacity-80">Início:</label>
                    <input type="datetime-local" id="manualStartTime" value={startTimeStr} onChange={(e: ChangeEvent<HTMLInputElement>) => setStartTimeStr(e.target.value)} required className={formInputStyle} />
                </div>
                 <div>
                    <label htmlFor="manualEndTime" className="block text-xs font-medium mb-1.5 opacity-80">Fim:</label>
                    <input type="datetime-local" id="manualEndTime" value={endTimeStr} onChange={(e: ChangeEvent<HTMLInputElement>) => setEndTimeStr(e.target.value)} required className={formInputStyle} />
                </div>
            </div>
            {/* Textarea para Pontos de Foco */}
            <div>
                <label htmlFor="manualFocusPoints" className="block text-xs font-medium mb-1.5 opacity-80">
                    Pontos de Foco (um por linha) <span className="text-red-400">*</span>:
                </label>
                <textarea
                    id="manualFocusPoints"
                    rows={4} // Aumentado um pouco para mais espaço
                    value={focusPointsText} // Liga ao estado da string
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFocusPointsText(e.target.value)}
                    required
                    className={`${formInputStyle} resize-none`}
                    placeholder="Digite cada ponto de foco em uma nova linha..." // Placeholder atualizado
                />
            </div>
            {/* Textarea para Notas (mantida) */}
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
            {/* Botões (mantidos) */}
            <div className="flex justify-end items-center space-x-3 pt-2">
                 <button type="button" onClick={onClose} className={`px-4 py-1.5 rounded-md text-xs font-medium ${styles.buttonColor} hover:bg-white/15 transition-colors focus:outline-none focus:ring-1 focus:ring-white/40 flex items-center gap-1.5`}> <FiX className="h-4 w-4" /> Cancelar </button>
                 <button type="submit" className={`px-4 py-1.5 rounded-md text-xs font-semibold ${styles.buttonActiveColor} hover:opacity-95 transition-opacity flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-offset-2 focus:ring-offset-black/30 ${styles.modalAccentColor.replace('ring-','focus:ring-')}`}> <FiSave className="h-4 w-4" /> Salvar Entrada </button>
             </div>
        </form>
    );
};