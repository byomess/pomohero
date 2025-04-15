export const DEFAULT_WORK_DURATION = 25 * 60;
export const DEFAULT_SHORT_BREAK_DURATION = 5 * 60;
export const DEFAULT_LONG_BREAK_DURATION = 15 * 60;
export const DEFAULT_CYCLES_BEFORE_LONG_BREAK = 4;
export const DEFAULT_SOUND_ENABLED = true;

export const TYPING_SOUND_DEBOUNCE_MS = 150;
export const FOCUS_START_EFFECT_DURATION = 2000;
export const FOCUS_START_EFFECT_BEEP_DURATION = 200;
export const FOCUS_BEEP_TIMINGS = [0, 500, 1000, 1500];

export const EFFECT_FLASH_COLOR_1 = 'bg-purple-950'; 

export const WORK_BG_PAUSED = 'bg-slate-800';
export const WORK_BG_RUNNING = 'bg-purple-800';
export const SHORT_BREAK_BG_PAUSED = 'bg-gradient-to-br from-sky-900 to-cyan-950';
export const SHORT_BREAK_BG_RUNNING = 'bg-gradient-to-br from-sky-800 to-cyan-900';
export const LONG_BREAK_BG_PAUSED = 'bg-gradient-to-br from-emerald-900 to-teal-950';
export const LONG_BREAK_BG_RUNNING = 'bg-gradient-to-br from-emerald-800 to-teal-900';

export const HISTORY_STORAGE_KEY = 'pomodoroHistory_v1';
export const SETTINGS_STORAGE_KEY = 'pomodoroSettings_v1';
export const BACKLOG_STORAGE_KEY = 'pomohero_backlog';
export const CYCLE_COUNT_STORAGE_KEY = 'pomohero_cycle_count';
export const TIMER_STATE_STORAGE_KEY = 'pomohero_timer_state';
export const CURRENT_PHASE_STORAGE_KEY = 'pomohero_current_phase';
export const IS_RUNNING_STORAGE_KEY = 'pomohero_is_running';
export const INITIAL_DURATION_STORAGE_KEY = 'pomohero_initial_duration';
export const SHOW_EXTENSION_OPTIONS_STORAGE_KEY = 'pomohero_show_extension_options';
export const HAS_EXTENDED_CURRENT_FOCUS_STORAGE_KEY = 'pomohero_has_extended_current_focus';
export const IS_HYPERFOCUS_ACTIVE_STORAGE_KEY = 'pomohero_is_hyperfocus_active';
export const CURRENT_SESSION_START_TIME_STORAGE_KEY = 'pomohero_current_session_start_time';
export const CURRENT_FOCUS_POINTS_STORAGE_KEY = 'pomohero_current_focus_points';
export const CURRENT_FEEDBACK_NOTES_STORAGE_KEY = 'pomohero_current_feedback_notes';
export const NEXT_FOCUS_PLANS_STORAGE_KEY = 'pomohero_next_focus_plans';

export const DEFAULT_LOCAL_STORAGE_SAVE_DEBOUNCE_MS = 3000; // Default debounce time for local storage saves
export const DEFAULT_MUSIC_VOLUME = 0.5; // Default volume for music player
export const MUSIC_VOLUME_STORAGE_KEY = 'pomohero_music_volume'; // Local storage key
export const MUSIC_VOLUME_DUCKED = 0.03; // Volume level when ducking (lower than default)
export const MUSIC_DUCKING_DURATION_MS = 800; // How long the music stays ducked after sound starts

export const FOCUS_TARGET_VOLUME = 0.1;
export const BREAK_TARGET_VOLUME = 0.5;

export const WORK_PROGRESS_RUNNING = 'bg-purple-600'; // Example
export const WORK_PROGRESS_PAUSED = 'bg-slate-400';  // Example
export const SHORT_BREAK_PROGRESS = 'bg-cyan-500';  // Example
export const SHORT_BREAK_RUNNING = 'bg-cyan-500';  // Example
export const SHORT_BREAK_PAUSED = 'bg-sky-500';   // Example
export const LONG_BREAK_PROGRESS = 'bg-teal-500';   // Example
export const LONG_BREAK_RUNNING = 'bg-teal-500';   // Example
export const LONG_BREAK_PAUSED = 'bg-emerald-500'; // Example

export const PRIMARY_FOCUS_PAUSED = 'bg-slate-600';
export const PRIMARY_FOCUS_RUNNING = 'bg-purple-600';
export const PRIMARY_FOCUS_FLASHING = 'bg-purple-500';
export const PRIMARY_HYPERFOCUS_RUNNING = 'bg-red-500';
export const PRIMARY_HYPERFOCUS_PAUSED = 'bg-red-600';
export const PRIMARY_SHORT_BREAK_PAUSED = 'bg-cyan-600';
export const PRIMARY_SHORT_BREAK_RUNNING = 'bg-cyan-500';
export const PRIMARY_LONG_BREAK_PAUSED = 'bg-emerald-600';
export const PRIMARY_LONG_BREAK_RUNNING = 'bg-emerald-500';

export const HYPERFOCUS_BG_RUNNING = 'bg-gradient-to-br from-red-900 to-rose-950'; // Darker red gradient
export const HYPERFOCUS_BG_PAUSED = 'bg-gradient-to-br from-red-950 to-rose-950'; // Even darker, leaning towards rose
export const HYPERFOCUS_BORDER = 'border-red-700';             // Darker border (700 instead of 600)
export const HYPERFOCUS_PROGRESS = 'bg-red-600';              // Slightly darker progress (600 instead of 500)
export const HYPERFOCUS_ACCENT_RING = 'ring-red-600';           // Slightly darker ring (600 instead of 500)
export const HYPERFOCUS_HIST_BORDER_RUNNING = 'border-red-700/50'; // Darker history border
export const HYPERFOCUS_HIST_BORDER_PAUSED = 'border-red-800/50'; // Even darker paused history border

export const INTRO_TRACK_ID = 'm-ploom-lab';
export const INTRO_START_TIME_NEW_USER = 124; // seconds
export const WELCOME_MODAL_DELAY_NEW_USER = 16500; // milliseconds
export const INTRO_START_TIME_RETURNING_USER = 136; // seconds
export const WELCOME_MODAL_DELAY_RETURNING_USER = 4800; // milliseconds
export const INTRO_INITIAL_VOLUME = 0.2; // 0.0 to 1.0
export const INTRO_NORMAL_VOLUME = 0.5; // 0.0 to 1.0
