import { usePomodoro } from '../../contexts/PomodoroContext';
import { FiCoffee, FiBriefcase, FiAward } from 'react-icons/fi';

export const PhaseIndicator: React.FC = () => {
    const {
        currentPhase,
        cycleCount,
        settings,
        styles,             // Base styles (text, default progress)
    } = usePomodoro();
    const { cyclesBeforeLongBreak } = settings;

    const completedInSet = (cycleCount > 0 && cycleCount % cyclesBeforeLongBreak === 0 && currentPhase !== 'Work')
        ? cyclesBeforeLongBreak
        : cycleCount % cyclesBeforeLongBreak;

    const dots = Array.from({ length: cyclesBeforeLongBreak });

    let PhaseIcon;
    switch (currentPhase) {
        case 'Work': PhaseIcon = FiBriefcase; break;
        case 'Short Break': PhaseIcon = FiCoffee; break;
        case 'Long Break': PhaseIcon = FiAward; break;
        default: PhaseIcon = FiBriefcase;
    }

    const textColorClass = styles.textColor;
    const phaseText = styles.phaseText;

    return (
        <div className="w-full">
            <div className="flex items-center justify-between gap-x-4 px-1">
                {/* Left Side */}
                <div className={`flex items-center gap-2 text-base sm:text-lg font-semibold tracking-wide uppercase ${textColorClass} flex-1`}>
                    <PhaseIcon className="w-4 h-4 sm:w-5 sm:h-5 opacity-80" />
                    <span className="px-3 py-0.5 rounded-full text-xs font-medium">
                        {phaseText}
                    </span>
                </div>

                {/* Center */}
                {/* <div className={`flex justify-center flex-1`}>
                    <p className={`text-xs ${textColorClass} opacity-70 whitespace-nowrap`} aria-label={`Total de ciclos completos: ${cycleCount}`}>
                        Ciclo: {cycleCount}
                    </p>
                </div> */}

                {/* Right Side */}
                {cyclesBeforeLongBreak > 1 && currentPhase !== 'Long Break' ? (
                    <div
                        className="flex justify-end space-x-1.5 flex-1"
                        title={`Progresso para pausa longa (${completedInSet}/${cyclesBeforeLongBreak})`}
                        aria-label={`Progresso para pausa longa: ${completedInSet} de ${cyclesBeforeLongBreak} ciclos completos.`}
                    >
                        {dots.map((_, index) => (
                            <span
                                key={`cycle-dot-${index}`}
                                className={`
                        block w-2 h-2 rounded-full border border-white/10
                        transition-colors duration-300 ease-in-out
                        ${index < completedInSet
                                        ? `${styles.primaryColor} shadow-sm`
                                        : 'bg-white/20 opacity-50'
                                    }
                    `}
                            ></span>
                        ))}
                    </div>
                ) : (
                    <div className="flex justify-end flex-1" aria-hidden="true">
                        <div className="w-px h-2"></div>
                    </div>
                )}
            </div>
        </div>
    );
};