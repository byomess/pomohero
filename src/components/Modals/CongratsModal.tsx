// src/components/Modals/CongratsModal.tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BsAward } from 'react-icons/bs'; // Keeping BsAward

// --- Constantes ---
// Durations and Transitions (can be shared or specific)
const CONGRATS_DURATION_MS = 4800; // Duration for the congrats modal animation
const TRANSITION_DURATION_S = 0.5; // Quick fade/scale transitions
const FINAL_BACKGROUND_OPACITY = 0.1; // Target background opacity

// Colors for Animation (Matching WelcomeModal)
const INITIAL_TITLE_COLOR = "#eeeeee"; // Light gray start
const FINAL_TITLE_COLOR = "#ffffff";    // White end
const INITIAL_DESC_COLOR = "#eeeeee";  // Light gray start
const FINAL_DESC_COLOR = "#ffffff";     // White end
const INITIAL_ICON_COLOR = "#eeeeee"; // Light gray start for icon
const FINAL_ICON_COLOR = "#ffffff";    // White end for icon

// --- Dados (Text converted to lowercase) ---

// Lista de Títulos (lowercase)
const congratsTitles = [
    "foco concluído!",
    "mandou bem!",
    "pausa merecida!",
    "sucesso!",
    "ótimo trabalho!",
    "missão cumprida!",
    "hora de relaxar!",
    "excelente esforço!",
    "você conseguiu!",
    "etapa finalizada!",
    "bom descanso!",
    "ciclo completo!",
    "parabéns!",
    "recarregue as energias!",
    "que desempenho!",
    "tempo de pausa!",
    "conquista!",
    "muito bom!",
    "desconecte um pouco!",
    "objetivo atingido!",
];

// Lista de Frases (lowercase)
const motivationalPhrases = [
    "excelente trabalho! você merece esta pausa para recarregar.",
    "foco notável! hora de relaxar um pouco a mente.",
    "mandou bem! aproveite seu merecido descanso.",
    "sessão produtiva concluída! respire fundo.",
    "parabéns pelo esforço! sua pausa chegou.",
    "continue assim! pequenas pausas geram grandes resultados.",
    "impressionante! use este tempo para se reenergizar.",
    "o progresso é feito passo a passo.",
    "você está no caminho certo! aproveite a pausa.",
    "que concentração! agora, um momento para você.",
    "bom trabalho! pausar também é parte do processo.",
    "respire fundo, guerreiro, e sinta a glória da sua vitória.",
    "sua dedicação é notável. desfrute do intervalo.",
    "foco finalizado com sucesso! relaxe e celebre.",
    "energia bem gasta! hora de recuperar.",
    // "você está perto. continue assim!", // Removed for consistency if needed
    "seu cérebro agradece! aproveite este respiro.",
    "conquista desbloqueada: foco completo! descanse.",
];

// Funções para obter valores aleatórios
const getRandomElement = <T,>(arr: T[]): T => {
    if (arr.length === 0) return {} as T; // Handle empty array case
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
};

// --- Tipos de Props (Optional: Add onClose if needed) ---
interface CongratsModalProps {
     onExited?: () => void; // Callback when exit animation completes
     // Add other props if necessary, e.g., onClose handler
}

export const CongratsModal: React.FC<CongratsModalProps> = ({ onExited }) => {
    // Select random title and phrase on mount
    const [selectedTitle] = useState(() => getRandomElement(congratsTitles));
    const [selectedPhrase] = useState(() => getRandomElement(motivationalPhrases));
    // State to control visibility for exit animation
    const [showModal, setShowModal] = useState(true);

    // Optional: Add a timer to close the modal automatically after CONGRATS_DURATION_MS
    useEffect(() => {
        const timerId = setTimeout(() => {
            setShowModal(false); // Trigger exit animation
        }, CONGRATS_DURATION_MS);

        return () => clearTimeout(timerId); // Cleanup timer
    }, []); // Runs only once on mount

    // --- Animation Variants (Copied/adapted from WelcomeModal) ---

    const modalContainerVariants = {
        initial: { opacity: 0, y: 50, scale: 0.95 },
        animate: { // Removed 'custom' as duration is fixed here
            opacity: 1,
            y: [0, -30], // Uses a fixed upward movement (like welcome back)
            scale: 1,
            transition: {
                opacity: { duration: TRANSITION_DURATION_S, ease: "easeOut" },
                scale: { duration: TRANSITION_DURATION_S, ease: "easeOut" },
                y: {
                    duration: CONGRATS_DURATION_MS / 1000,
                    ease: "linear",
                    delay: TRANSITION_DURATION_S * 0.5
                }
            }
        },
        exit: {
            opacity: 0,
            y: -70,
            scale: 0.9,
            transition: {
                opacity: { duration: TRANSITION_DURATION_S * 0.8, ease: "easeIn" },
                y: { duration: TRANSITION_DURATION_S * 0.8, ease: "easeIn" },
                scale: { duration: TRANSITION_DURATION_S * 0.8, ease: "easeIn" }
            }
        }
    };

    const backgroundVariants = {
        initial: { opacity: 0.8 },
        animate: { // Removed 'custom'
            opacity: [0.8, FINAL_BACKGROUND_OPACITY],
            transition: {
                duration: CONGRATS_DURATION_MS / 1000,
                ease: "linear",
                delay: TRANSITION_DURATION_S * 0.5
            }
        },
        exit: { opacity: 0, transition: { duration: TRANSITION_DURATION_S * 0.8, ease: "easeIn" } }
    };

    const textAnimateProps = { // Removed 'custom' parameter
        transition: {
            duration: CONGRATS_DURATION_MS / 1000,
            ease: "linear",
            delay: TRANSITION_DURATION_S * 0.5
        }
    };

    const titleVariants = {
        initial: { color: INITIAL_TITLE_COLOR },
        animate: { // Removed 'custom'
            color: [INITIAL_TITLE_COLOR, FINAL_TITLE_COLOR],
            ...textAnimateProps
        },
        exit: { color: INITIAL_TITLE_COLOR }
    };

    const descriptionVariants = {
        initial: { color: INITIAL_DESC_COLOR },
        animate: { // Removed 'custom'
            color: [INITIAL_DESC_COLOR, FINAL_DESC_COLOR],
            ...textAnimateProps
        },
        exit: { color: INITIAL_DESC_COLOR }
    };

    const iconVariants = {
         initial: { color: INITIAL_ICON_COLOR },
         animate: { // Removed 'custom'
             color: [INITIAL_ICON_COLOR, FINAL_ICON_COLOR],
             ...textAnimateProps
         },
         exit: { color: INITIAL_ICON_COLOR }
     };

    // --- Renderização ---
    return (
         // Use AnimatePresence to handle the exit animation when showModal becomes false
        <AnimatePresence onExitComplete={onExited}>
            {showModal && (
                // Overlay (Matching WelcomeModal style)
                <motion.div
                    key="congrats-modal-overlay" // Unique key
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: TRANSITION_DURATION_S * 0.6, ease: 'linear' }}
                >
                    {/* Caixa Container do Modal (Matching WelcomeModal structure) */}
                    <motion.div
                        key="congrats-modal-container" // Unique key
                        className="relative max-w-sm w-full rounded-2xl shadow-lg text-center overflow-hidden"
                        variants={modalContainerVariants}
                        initial="initial"
                        animate="animate" // Animate runs automatically
                        exit="exit"
                        // Removed 'custom' prop as duration is now fixed
                    >
                        {/* Elemento de Fundo (Matching WelcomeModal structure) */}
                        <motion.div
                             key="congrats-modal-background" // Unique key
                             className="absolute inset-0 -z-10 rounded-2xl bg-white/30 backdrop-blur-md shadow-lg" // Classes from WelcomeModal
                             variants={backgroundVariants}
                             initial="initial"
                             animate="animate" // Animate runs automatically
                             exit="exit"
                             // Removed 'custom' prop
                        />

                        {/* Conteúdo Interno (Matching WelcomeModal structure) */}
                        <div className="p-4 pt-6 relative z-10">
                            {/* Ícone Animado */}
                            <motion.div
                                key="congrats-icon-wrapper"
                                variants={iconVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                            >
                                <BsAward
                                    // Removed color class, using variants now
                                    className="w-16 h-16 mx-auto mb-5 filter drop-shadow(0 2px 4px rgba(255,255,255,0.1))" // Adjusted shadow for light icon
                                />
                            </motion.div>

                            {/* Área de Texto (Matching WelcomeModal structure) */}
                            {/* No inner AnimatePresence needed as content doesn't change */}
                            <motion.div
                                key="congrats-content" // Unique key
                                initial={{ opacity: 1 }} // Start visible within the container
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }} // Fade out text slightly before container
                                transition={{ duration: 0.15 }}
                                className="min-h-[90px] flex flex-col justify-center"
                            >
                                {/* Título com animação de cor (lowercase) */}
                                <motion.h2
                                    className="text-2xl font-medium mb-2" // Matching WelcomeModal text size
                                    variants={titleVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                >
                                    {selectedTitle}
                                </motion.h2>

                                {/* Descrição com animação de cor (lowercase) */}
                                <motion.p
                                    className="text-md leading-relaxed font-light" // Matching WelcomeModal text size
                                    variants={descriptionVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                >
                                    {selectedPhrase}
                                </motion.p>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};