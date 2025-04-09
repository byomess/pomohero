export type Phase = 'Work' | 'Short Break' | 'Long Break';

export interface HistoryEntry {
    id: string;
    startTime: number; // <<< ADDED: Timestamp when the focus session started
    endTime: number;
    duration: number; // Duration in seconds (can be calculated or stored)
    focusPoints: string;
    feedbackNotes: string;
}

export interface PomodoroSettings {
    workDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
    cyclesBeforeLongBreak: number;
    soundEnabled: boolean;
}

// Represents the dynamic styles calculated based on phase/state
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
    finalBgColor: string; // Includes override logic
}

export type HistoryUpdateData = Partial<Pick<HistoryEntry, 'focusPoints' | 'feedbackNotes' | 'startTime' | 'endTime' | 'duration'>>;

export type ManualHistoryEntryData = Omit<HistoryEntry, 'id'>;