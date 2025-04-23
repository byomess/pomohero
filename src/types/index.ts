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
  showNavbarLabels: boolean;
}

export interface DynamicStyles {
  textPrimaryColor: string;
  primaryColor: string;
  borderPrimaryColor: string;
  baseBgColor: string;
  finalHistoryBorderColor: string;
  timerHighlightBorderColor: string;
  textColor: string;
  progressColor: string;
  buttonColor: string;
  buttonActiveColor: string;
  inputBgColor: string;
  phaseText: string;
  modalAccentColor: string;
  finalBgColor: string;
}

export type HistoryUpdateData = Partial<Omit<HistoryEntry, 'id'>>;

export type ManualHistoryEntryData = Omit<HistoryEntry, 'id' | 'nextFocusPlans'> & {
  focusPoints?: string[];
  feedbackNotes?: string;
};

export type MusicCategory = 'music' | 'ambient' | 'noise';

export interface Track {
  id: string;
  title: string;
  artist?: string;
  src: string;
  coverArtSrc: string;
  category: MusicCategory;
}
