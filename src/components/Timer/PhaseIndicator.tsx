import React from 'react';
import { usePomodoro } from '../../contexts/PomodoroContext';
import { FiZap, FiCoffee, FiAward } from 'react-icons/fi';

interface PhaseIndicatorProps {
    onShowSOSModal: () => void;
}

export const PhaseIndicator: React.FC<PhaseIndicatorProps> = () => {
    const {
        phaseIndex,
        settings,
        styles,
    } = usePomodoro();

    const { cyclesBeforeLongBreak } = settings;
    const textColorClass = styles.textColor;
    const phaseText = styles.phaseText;

    const phaseSequence = React.useMemo(() => {
        const sequence: ('Work' | 'Short Break' | 'Long Break')[] = [];
        for (let i = 0; i < cyclesBeforeLongBreak; i++) {
            sequence.push('Work');
            if (i < cyclesBeforeLongBreak - 1) {
                sequence.push('Short Break');
            }
        }
        sequence.push('Long Break');
        return sequence;
    }, [cyclesBeforeLongBreak]);

    const phaseIcons = {
        'Work': FiZap,
        'Short Break': FiCoffee,
        'Long Break': FiAward,
    };

    const getInactiveColor = (phase: 'Work' | 'Short Break' | 'Long Break') => {
        switch (phase) {
            case 'Work':
                return 'text-purple-700 opacity-50';
            case 'Short Break':
                return 'text-blue-700 opacity-50';
            case 'Long Break':
                return 'text-green-700 opacity-50';
            default:
                return 'text-gray-500 opacity-50';
        }
    };

    return (
        <div className="flex flex-col w-full items-center justify-between gap-x-2 px-1 h-6 mb-4">
            {/* Stepper com cores por tipo de fase */}
            <div className="flex justify-end space-x-4 flex-1" aria-label="Progresso das fases do ciclo atual">
                {phaseSequence.map((phase, index) => {
                    const Icon = phaseIcons[phase];
                    const isCurrent = index === phaseIndex;

                    return (
                        <div
                            key={`stepper-${index}-${phase}`}
                            className={`rounded-full flex items-center justify-center transition-all duration-200
                                        ${isCurrent
                                    ? 'bg-blue-600 text-white shadow-lg p-2'
                                    : getInactiveColor(phase)
                                }`}
                            title={phase === 'Work' ? 'Foco' : phase === 'Short Break' ? 'Pausa Curta' : 'Pausa Longa'}
                            aria-current={isCurrent ? 'step' : undefined}
                        >
                            <Icon className="w-4 h-4" />
                        </div>
                    );
                })}
            </div>

            {/* Lado esquerdo: ícone + nome da fase */}
            <span className={`pl-2 text-xs font-semibold uppercase mt-2 ${textColorClass} ${phaseText}`}>
                {phaseText}
            </span>
        </div>
    );
};
