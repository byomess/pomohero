import React from 'react';
import { usePomodoro } from '../../contexts/PomodoroContext';

const readOnlyInputStyle = 'read-only:bg-black/20 read-only:opacity-70 read-only:cursor-default focus:read-only:ring-0';

export const FeedbackInput: React.FC = () => {
    const {
        currentFeedbackNotes,
        setCurrentFeedbackNotes,
        isRunning,
        history,
        styles,
        debouncedPlayTypingSound,
        isEffectRunning // Feedback also read-only during effect
    } = usePomodoro();

    const lastEntryHadFeedback = history.length > 0 && history[0]?.feedbackNotes !== '';
    const isReadOnly = isRunning || isEffectRunning || lastEntryHadFeedback;
    const isRequired = history.length > 0 && !lastEntryHadFeedback && !isRunning && !isEffectRunning; // Required only if previous session exists, has no feedback yet, and timer isn't running/effecting

    const getLabel = () => {
        if (lastEntryHadFeedback) return 'Feedback da sessão anterior: (Salvo)';
        if (isRunning || isEffectRunning) return 'Feedback da sessão anterior: (Em andamento)';
        if (isRequired) return 'Feedback da sessão anterior: (Editável - Obrigatório)';
        return 'Feedback da sessão anterior:'; // Default case (e.g., first break ever)
    };

    const getPlaceholder = () => {
        if (lastEntryHadFeedback) return history[0].feedbackNotes; // Show saved feedback
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
                onChange={(e) => { if (!isReadOnly) setCurrentFeedbackNotes(e.target.value); }}
                placeholder={getPlaceholder()}
                onKeyDown={debouncedPlayTypingSound}
                className={`w-full p-2 rounded-lg border-none focus:ring-2 focus:outline-none text-sm custom-scrollbar ${styles.inputBgColor} ${styles.textColor} transition-colors duration-500 ${readOnlyInputStyle}`}
                readOnly={isReadOnly}
                aria-readonly={isReadOnly}
                aria-required={isRequired}
            />
        </div>
    );
};
