export type Phase = 'Work' | 'Short Break' | 'Long Break';

export interface BacklogTask {
  id: string;
  text: string;
}

export interface HistoryEntry {
    id: string;
    startTime: number;
    endTime: number;
    duration: number;
    focusPoints: string[];
    feedbackNotes: string;
    nextFocusPlans?: string[];
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
    finalHistoryBorderColor: string; // e.g., border-purple-600/50
    timerHighlightBorderColor: string; // <<< NOVO: e.g., border-purple-600 >>>
    textColor: string;
    progressColor: string; // Class name like 'bg-slate-400'
    buttonColor: string;
    buttonActiveColor: string;
    inputBgColor: string;
    phaseText: string;
    modalAccentColor: string; // Ring class like 'ring-slate-500'
    finalBgColor: string;
}

export type HistoryUpdateData = Partial<Omit<HistoryEntry, 'id'>>;

export type ManualHistoryEntryData = Omit<HistoryEntry, 'id' | 'nextFocusPlans'>;

export type MusicCategory = 'music' | 'ambient' | 'noise';

export interface Track {
  id: string;
  title: string;
  artist?: string; // Optional artist
  src: string; // URL or path to audio file
  coverArtSrc: string; // URL or path to cover art
  category: MusicCategory; // Link to category
}
