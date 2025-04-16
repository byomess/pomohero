import React from 'react';
import { usePomodoro } from '../../contexts/PomodoroContext';

export const FeedbackInput: React.FC = () => {
    const {
        currentFeedbackNotes,
        setCurrentFeedbackNotes,
        history,
        styles,
        debouncedPlayTypingSound,
        isEffectRunning
    } = usePomodoro();

    const lastEntryHadFeedback = history.length > 0 && history[0]?.feedbackNotes !== '';
    const isRequired = history.length > 0 && !lastEntryHadFeedback && !isEffectRunning;

    const getLabel = () => {
        if (lastEntryHadFeedback) return 'Feedback da sessão anterior: (Salvo)';
        if (isRequired) return 'Feedback da sessão anterior: (Editável - Obrigatório)';
        return 'Feedback da sessão anterior:';
    };

    const getPlaceholder = () => {
        if (lastEntryHadFeedback) return history[0].feedbackNotes;
        if (isRequired) return "Como foi a última sessão de foco? (Obrigatório)";
        return "Como foi a última sessão de foco?";
    };

    return (
        <div>
            <label htmlFor="feedbackNotes" className="block text-sm font-medium opacity-90 mb-1">
                {getLabel()}
            </label>
            <textarea
                id="feedbackNotes"
                rows={2}
                value={currentFeedbackNotes}
                onChange={(e) => setCurrentFeedbackNotes(e.target.value)}
                placeholder={getPlaceholder()}
                onKeyDown={debouncedPlayTypingSound}
                className={`w-full p-2 rounded-lg border-none focus:ring-2 focus:outline-none text-sm custom-scrollbar ${styles.inputBgColor} ${styles.textColor} transition-colors duration-500`}
                aria-required={isRequired}
            />
        </div>
    );
};
export default FeedbackInput;