// src/types/index.ts
export type Phase = 'Work' | 'Short Break' | 'Long Break';

export interface HistoryEntry {
    id: string;
    startTime: number;
    endTime: number;
    duration: number;
    focusPoints: string[]; // Deve ser sempre string[]
    feedbackNotes: string;
}

export interface PomodoroSettings {
    workDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
    cyclesBeforeLongBreak: number;
    soundEnabled: boolean;
}

export interface DynamicStyles {
    baseBgColor: string;
    finalHistoryBorderColor: string;
    textColor: string;
    progressColor: string;
    buttonColor: string;
    buttonActiveColor: string;
    inputBgColor: string;
    phaseText: string;
    modalAccentColor: string;
    finalBgColor: string;
}

// HistoryUpdateData: focusPoints é opcional e deve ser string[]
export type HistoryUpdateData = Partial<Omit<HistoryEntry, 'id' | 'focusPoints'> & { focusPoints?: string[] }>;

// ManualHistoryEntryData: focusPoints é obrigatório e deve ser string[]
export type ManualHistoryEntryData = Omit<HistoryEntry, 'id' | 'focusPoints'> & { focusPoints: string[] };

export interface BacklogTask {
    id: string;
    text: string;
}
