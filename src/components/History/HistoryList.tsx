// src/components/History/HistoryList.tsx
import React, { useState } from 'react';
import { usePomodoro } from '../../contexts/PomodoroContext';
import { HistoryItem } from './HistoryItem';
import { ManualHistoryEntryForm } from './ManualHistoryEntryForm';
import { FiPlusCircle } from 'react-icons/fi';

export const HistoryList: React.FC = () => {
    const { history, styles } = usePomodoro();
    const [showManualForm, setShowManualForm] = useState(false);

    return (
        // Ensure flex column structure and give it a reasonable minimum height
        <div className={`w-full max-w-md p-5 md:p-6 rounded-3xl shadow-xl backdrop-blur-sm bg-black/25 ${styles.textColor} flex flex-col min-h-[400px] max-h-[calc(100vh-80px)]`}> {/* Added max-h for overall constraint */}
            {/* Header */}
            <div className="flex justify-between items-center mb-5 border-b border-white/10 pb-3 flex-shrink-0"> {/* Prevent header shrinking */}
                <h2 className="text-xl font-semibold opacity-95">Histórico de Foco</h2>
                <button
                    onClick={() => setShowManualForm(!showManualForm)}
                    aria-label={showManualForm ? "Fechar adição manual" : "Adicionar entrada manual"}
                    title={showManualForm ? "Fechar adição manual" : "Adicionar entrada manual"}
                    className={`p-1.5 rounded-full ${styles.buttonColor} hover:bg-white/30 text-white/80 hover:text-white transition-all duration-200 ease-in-out transform focus:outline-none focus:ring-1 focus:ring-white/50 ${
                        showManualForm ? 'rotate-[135deg] bg-white/25' : 'rotate-0'
                    }`}
                >
                    <FiPlusCircle className="h-5 w-5" />
                </button>
            </div>

            {/* Manual Entry Form Container */}
            {showManualForm && (
                <div className="mb-5 p-4 bg-black/20 rounded-lg shadow-md border border-white/5 animate-fade-in-down flex-shrink-0"> {/* Prevent form shrinking */}
                    <ManualHistoryEntryForm onClose={() => setShowManualForm(false)} />
                </div>
            )}

            {/* --- History Items List Container - FIXED SCROLL --- */}
            {/*
               - flex-1: Takes remaining space.
               - overflow-y-auto: Enables vertical scrolling *on this container*.
               - custom-scrollbar: Applies custom scrollbar style.
               - pr-2 pb-4: Padding moved here from ul.
               - mask-image: Fade effect moved here.
               - Removed overflow-hidden and relative (relative might not be needed here anymore).
            */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4 [mask-image:linear-gradient(to_bottom,black_95%,transparent_100%)]">
                {history.length > 0 ? (
                    // UL only needs spacing between items now.
                    <ul className="space-y-3">
                        {history.map((entry) => (
                            <HistoryItem key={entry.id} entry={entry} />
                        ))}
                    </ul>
                ) : (
                     // Centered empty state message (ensure it's visible if container shrinks too much)
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-60 px-4 min-h-[150px]"> {/* Added min-h */}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mb-4 opacity-30">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        <p className="text-base font-medium">Histórico Vazio</p>
                        <p className="text-sm mt-1">Conclua sessões de foco ou adicione manualmente para ver seu progresso.</p>
                    </div>
                )}
            </div>
        </div>
    );
};