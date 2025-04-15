// src/components/Modals/BackToFocusModal.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PiLightningBold } from 'react-icons/pi'; // Using the specified icon

// --- Constantes (Matching previous modals) ---
const BACK_TO_FOCUS_DURATION_MS = 4800; // Duration for this modal's animation
const TRANSITION_DURATION_S = 0.5;
const FINAL_BACKGROUND_OPACITY = 0.1;

// Colors for Animation (Matching previous modals)
const INITIAL_TITLE_COLOR = "#eeeeee";
const FINAL_TITLE_COLOR = "#ffffff";
const INITIAL_DESC_COLOR = "#eeeeee";
const FINAL_DESC_COLOR = "#ffffff";
const INITIAL_ICON_COLOR = "#eeeeee"; // Start icon light gray
const FINAL_ICON_COLOR = "#ffffff";    // End icon white

// --- Dados (Text converted to lowercase) ---

// Lista de Títulos (lowercase)
const backToFocusTitles = [
    "bem-vindo de volta!",
    "aí vem o campeão",
    "hora de brilhar",
    "você voltou!",
    "sem margem de erro",
    "nova missão",
    "traga o foco",
    "vença aqui e agora",
    "conquiste o dia",
    "capacitado e pronto",
    "sinto sua energia",
    "melhor do que nunca",
    "você consegue",
    "voce pode sim",
    "a hora é agora",
    "comece, continue e vença",
    "começar é o primeiro passo",
    "venha comigo",
    "estou aqui com você",
    "você é capaz",
    "você é forte",
    "você é incrível",
];

// Lista de Frases (lowercase)
const motivationalPhrases = [
    "lembre-se: a dor da disciplina é menor que a dor do arrependimento.",
    "lembre-se: feito é melhor que perfeito.",
    "a disciplina é a ponte entre metas e realizações.",
    "você é mais forte do que pensa. traga mais esse foco pra conta.",
    "a disciplina é o caminho para a liberdade, e não uma prisão.",
    "com a disciplina, você pode conquistar qualquer coisa.",
    "vá em frente, você está no caminho certo.",
    "seu eu do futuro vai agradecer por isso, acredite.",
    "sua capacidade de foco é sua maior força. use-a agora.",
    "não vai ser um bicho de sete cabeças, você sabe disso.",
    "o caminho é este, e a hora é agora.",
    "comece onde você está, use o que você tem, faça o que você pode.",
    "avante, guereiro! o foco é seu aliado, e não seu inimigo.",
    "você não está sozinho nessa jornada. eu estou aqui com você.",
    "você tem sonhos que anseia realizar, não esqueça disso.",
    "traga mais essa vitória pra conta, você merece.",
    "não vai ser tão complicado assim, eu prometo.",
];

// Funções para obter valores aleatórios
const getRandomElement = <T,>(arr: T[]): T => {
    if (arr.length === 0) return {} as T;
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
};

// --- Tipos de Props ---
interface BackToFocusModalProps {
     onExited?: () => void; // Callback when exit animation completes
}

export const BackToFocusModal: React.FC<BackToFocusModalProps> = ({ onExited }) => {
    // Select random title and phrase on mount
    const [selectedTitle] = useState(() => getRandomElement(backToFocusTitles));
    const [selectedPhrase] = useState(() => getRandomElement(motivationalPhrases));
    // State to control visibility for exit animation
    const [showModal, setShowModal] = useState(true);

    // Timer to close the modal automatically
    useEffect(() => {
        const timerId = setTimeout(() => {
            setShowModal(false); // Trigger exit animation
        }, BACK_TO_FOCUS_DURATION_MS);

        return () => clearTimeout(timerId); // Cleanup timer
    }, []); // Runs only once on mount

    // --- Animation Variants (Copied from previous modals) ---

    const modalContainerVariants = {
        initial: { opacity: 0, y: 50, scale: 0.95 },
        animate: {
            opacity: 1,
            y: [0, -30], // Fixed upward movement
            scale: 1,
            transition: {
                opacity: { duration: TRANSITION_DURATION_S, ease: "easeOut" },
                scale: { duration: TRANSITION_DURATION_S, ease: "easeOut" },
                y: {
                    duration: BACK_TO_FOCUS_DURATION_MS / 1000,
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
        animate: {
            opacity: [0.8, FINAL_BACKGROUND_OPACITY],
            transition: {
                duration: BACK_TO_FOCUS_DURATION_MS / 1000,
                ease: "linear",
                delay: TRANSITION_DURATION_S * 0.5
            }
        },
        exit: { opacity: 0, transition: { duration: TRANSITION_DURATION_S * 0.8, ease: "easeIn" } }
    };

    const textAnimateProps = {
        transition: {
            duration: BACK_TO_FOCUS_DURATION_MS / 1000,
            ease: "linear",
            delay: TRANSITION_DURATION_S * 0.5
        }
    };

    const titleVariants = {
        initial: { color: INITIAL_TITLE_COLOR },
        animate: {
            color: [INITIAL_TITLE_COLOR, FINAL_TITLE_COLOR],
            ...textAnimateProps
        },
        exit: { color: INITIAL_TITLE_COLOR }
    };

    const descriptionVariants = {
        initial: { color: INITIAL_DESC_COLOR },
        animate: {
            color: [INITIAL_DESC_COLOR, FINAL_DESC_COLOR],
            ...textAnimateProps
        },
        exit: { color: INITIAL_DESC_COLOR }
    };

    const iconVariants = {
         initial: { color: INITIAL_ICON_COLOR },
         animate: {
             color: [INITIAL_ICON_COLOR, FINAL_ICON_COLOR],
             ...textAnimateProps
         },
         exit: { color: INITIAL_ICON_COLOR }
     };

    // --- Renderização ---
    return (
        <AnimatePresence onExitComplete={onExited}>
            {showModal && (
                // Overlay (Matching style)
                <motion.div
                    key="backtofocus-modal-overlay" // Unique key
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: TRANSITION_DURATION_S * 0.6, ease: 'linear' }}
                >
                    {/* Caixa Container do Modal (Matching structure and style) */}
                    <motion.div
                        key="backtofocus-modal-container" // Unique key
                        className="relative max-w-sm w-full rounded-2xl shadow-lg text-center overflow-hidden"
                        variants={modalContainerVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    >
                        {/* Elemento de Fundo (Matching structure and style) */}
                        <motion.div
                             key="backtofocus-modal-background" // Unique key
                             className="absolute inset-0 -z-10 rounded-2xl bg-white/30 backdrop-blur-md shadow-lg"
                             variants={backgroundVariants}
                             initial="initial"
                             animate="animate"
                             exit="exit"
                        />

                        {/* Conteúdo Interno (Matching structure and style) */}
                        <div className="p-4 pt-6 relative z-10">
                            {/* Ícone Animado */}
                            <motion.div
                                key="backtofocus-icon-wrapper"
                                variants={iconVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                            >
                                <PiLightningBold // Using the specified icon
                                    className="w-16 h-16 mx-auto mb-5 filter drop-shadow(0 2px 4px rgba(255,255,255,0.1))" // Adjusted shadow
                                />
                            </motion.div>

                            {/* Área de Texto */}
                            <motion.div
                                key="backtofocus-content" // Unique key
                                initial={{ opacity: 1 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="min-h-[90px] flex flex-col justify-center"
                            >
                                {/* Título com animação de cor (lowercase) */}
                                <motion.h2
                                    className="text-2xl font-medium mb-2" // Matching style
                                    variants={titleVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                >
                                    {selectedTitle}
                                </motion.h2>

                                {/* Descrição com animação de cor (lowercase) */}
                                <motion.p
                                    className="text-md leading-relaxed font-light" // Matching style
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