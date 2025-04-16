// src/components/Timer/PhaseIndicator.tsx
import React from 'react'; // Não precisa mais de useState
import { usePomodoro } from '../../contexts/PomodoroContext';
import { FiCoffee, FiBriefcase, FiAward, FiZap } from 'react-icons/fi';
// SOSFocusModal não é mais importado ou renderizado aqui

// Define a interface para as props que o componente espera receber
interface PhaseIndicatorProps {
    onShowSOSModal: () => void; // Função recebida do componente pai para mostrar o modal
}

export const PhaseIndicator: React.FC<PhaseIndicatorProps> = ({ onShowSOSModal }) => {
    // O estado local 'showSOSFocusModal' foi removido

    // Obtém dados e estilos do contexto Pomodoro
    const {
        currentPhase,
        cycleCount,
        settings,
        styles,
    } = usePomodoro();
    const { cyclesBeforeLongBreak } = settings; // Quantidade de ciclos antes de uma pausa longa

    // Estilo do botão SOS Foco (incluindo estilos do contexto)
    const extensionButtonStyle = `
        px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 /* Adicionado gap */
        transition-all duration-150 ease-in-out transform active:scale-95
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/30
        ${styles.buttonColor} hover:bg-white/25 focus:ring-white/60
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:active:scale-100
    `;

    // Calcula quantos ciclos foram completados no conjunto atual para a pausa longa
    const completedInSet = (cycleCount > 0 && cycleCount % cyclesBeforeLongBreak === 0 && currentPhase !== 'Work')
        ? cyclesBeforeLongBreak
        : cycleCount % cyclesBeforeLongBreak;

    // Cria um array para renderizar os pontos de progresso
    const dots = Array.from({ length: cyclesBeforeLongBreak });

    // Determina o ícone apropriado para a fase atual
    let PhaseIcon;
    switch (currentPhase) {
        case 'Work': PhaseIcon = FiBriefcase; break;
        case 'Short Break': PhaseIcon = FiCoffee; break;
        case 'Long Break': PhaseIcon = FiAward; break;
        default: PhaseIcon = FiBriefcase; // Padrão para garantir que sempre haja um ícone
    }

    // Obtém classes de cor e texto do contexto
    const textColorClass = styles.textColor;
    const phaseText = styles.phaseText; // Texto da fase atual (ex: "Foco", "Pausa Curta")

    return (
        <div className="w-full flex flex-col items-center justify-center">
            <div className="w-full">
                <div className="flex items-center justify-between gap-x-4 px-1">
                    {/* Lado Esquerdo: Ícone e Texto da Fase */}
                    <div className={`flex items-center gap-2 text-base sm:text-lg font-semibold tracking-wide uppercase ${textColorClass} flex-1`}>
                        <PhaseIcon className="w-4 h-4 sm:w-5 sm:h-5 opacity-80" aria-hidden="true" />
                        {/* Pode ser útil adicionar um aria-label aqui se o texto não for autoexplicativo */}
                        <span className="px-3 py-0.5 rounded-full text-xs font-medium">
                            {phaseText}
                        </span>
                    </div>

                    {/* Centro: Botão SOS Foco */}
                    <button
                        onClick={onShowSOSModal} // Chama a função passada pelo pai ao clicar
                        className={extensionButtonStyle}
                        title="Precisa de ajuda para focar? Ative o modo SOS!" // Tooltip informativo
                        aria-label="Ativar modo SOS Foco" // Boa prática de acessibilidade
                    >
                        <FiZap className="h-3.5 w-3.5 opacity-80" aria-hidden="true" />
                        <span>SOS Foco</span>
                    </button>

                    {/* Lado Direito: Pontos de Progresso para Pausa Longa */}
                    {/* Só mostra os pontos se houver mais de 1 ciclo e não estiver na pausa longa */}
                    {cyclesBeforeLongBreak > 1 && currentPhase !== 'Long Break' ? (
                        <div
                            className="flex justify-end space-x-1.5 flex-1"
                            title={`Progresso para pausa longa (${completedInSet}/${cyclesBeforeLongBreak})`}
                            aria-label={`Progresso para pausa longa: ${completedInSet} de ${cyclesBeforeLongBreak} ciclos completos.`}
                            role="img" // Indica que representa visualmente uma informação
                        >
                            {dots.map((_, index) => (
                                <span
                                    key={`cycle-dot-${index}`}
                                    className={`
                                block w-2 h-2 rounded-full border border-white/10
                                transition-colors duration-300 ease-in-out
                                ${index < completedInSet
                                            ? `${styles.primaryColor} shadow-sm` // Usa cor primária para pontos completos
                                            : 'bg-white/20 opacity-50' // Estilo padrão para pontos incompletos
                                        }
                                `}
                                ></span>
                            ))}
                        </div>
                    ) : (
                        // Adiciona um elemento vazio para manter o alinhamento quando os pontos não são mostrados
                        <div className="flex justify-end flex-1" aria-hidden="true">
                            <div className="w-px h-2"></div>
                        </div>
                    )}
                </div>
            </div>
            {/* O SOSFocusModal não é mais renderizado aqui */}
        </div>
    );
};