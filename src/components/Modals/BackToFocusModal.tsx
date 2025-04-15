// src/components/Modals/BackToFocusModal.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PiLightningBold } from 'react-icons/pi'; // Ícone específico

// --- Constantes (mantidas como no seu código original) ---
const BACK_TO_FOCUS_DURATION_MS = 4800; 
const TRANSITION_DURATION_S = 0.5;
const FINAL_BACKGROUND_OPACITY = 0.1;

// Cores de Animação
const INITIAL_TITLE_COLOR = "#eeeeee";
const FINAL_TITLE_COLOR = "#ffffff";
const INITIAL_DESC_COLOR = "#eeeeee";
const FINAL_DESC_COLOR = "#ffffff";
const INITIAL_ICON_COLOR = "#eeeeee"; 
const FINAL_ICON_COLOR = "#ffffff";    

// --- Agora, UMA só lista de objetos ---
const backToFocusData = [
  {
    title: "lembre-se",
    phrase: "a dor da disciplina é menor que a dor do arrependimento",
  },
  {
    title: "lembre-se",
    phrase: "feito é melhor que perfeito",
  },
  {
    title: "a disciplina",
    phrase: "é a ponte entre metas e realizações",
  },
  {
    title: "você",
    phrase: "é mais forte do que pensa",
  },
  {
    title: "traga",
    phrase: "mais esse foco pra conta"
  },
  {
    title: "a disciplina",
    phrase: "é o caminho para a liberdade, e não uma prisão",
  },
  {
    title: "com a disciplina",
    phrase: "você pode conquistar qualquer coisa",
  },
  {
    title: "vá em frente",
    phrase: "você está no caminho certo",
  },
  {
    title: "seu eu do futuro",
    phrase: "vai agradecer por isso, acredite",
  },
  {
    title: "sua maior força",
    phrase: "é a sua capacidade de foco",
  },
  {
    title: "não vai",
    phrase: "ser um bicho de sete cabeças, você sabe disso",
  },
  {
    title: "o caminho é este",
    phrase: "e a hora é agora",
  },
  {
    title: "comece onde você está",
    phrase: "use o que você tem, faça o que você pode",
  },
  {
    title: "avante, guereiro",
    phrase: "o foco é seu aliado, e não seu inimigo",
  },
  {
    title: "você não está sozinho",
    phrase: "nessa jornada. eu estou aqui com você",
  },
  {
    title: "você tem sonhos",
    phrase: "que anseia realizar, não esqueça disso",
  },
  {
    title: "traga",
    phrase: "mais essa vitória pra conta, você merece",
  },
  {
    title: "não vai",
    phrase: "ser tão complicado assim, eu prometo",
  },
  {
    title: "começar",
    phrase: "é o primeiro passo",
  }
];

// Função para obter valores aleatórios
const getRandomElement = <T,>(arr: T[]): T => {
    if (arr.length === 0) {
      return {} as T;
    }
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
};

// --- Tipos de Props ---
interface BackToFocusModalProps {
     onExited?: () => void; // Callback quando a animação de saída termina
}

export const BackToFocusModal: React.FC<BackToFocusModalProps> = ({ onExited }) => {
    // Seleciona UM objeto aleatório (title + phrase)
    const [selectedItem] = useState(() => getRandomElement(backToFocusData));

    // Controla visibilidade para animação de saída
    const [showModal, setShowModal] = useState(true);

    // Timer para fechar automaticamente
    useEffect(() => {
        const timerId = setTimeout(() => {
            setShowModal(false); 
        }, BACK_TO_FOCUS_DURATION_MS);

        return () => clearTimeout(timerId);
    }, []);

    // --- Animações ---
    const modalContainerVariants = {
        initial: { opacity: 0, y: 50, scale: 0.95 },
        animate: {
            opacity: 1,
            y: [0, -30], 
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
                <motion.div
                    key="backtofocus-modal-overlay"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: TRANSITION_DURATION_S * 0.6, ease: 'linear' }}
                >
                    <motion.div
                        key="backtofocus-modal-container"
                        className="relative max-w-sm w-full rounded-2xl shadow-lg text-center overflow-hidden"
                        variants={modalContainerVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    >
                        <motion.div
                             key="backtofocus-modal-background"
                             className="absolute inset-0 -z-10 rounded-2xl bg-white/30 backdrop-blur-md shadow-lg"
                             variants={backgroundVariants}
                             initial="initial"
                             animate="animate"
                             exit="exit"
                        />

                        <div className="p-4 pt-6 relative z-10">
                            <motion.div
                                key="backtofocus-icon-wrapper"
                                variants={iconVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                            >
                                <PiLightningBold
                                    className="w-16 h-16 mx-auto mb-5 filter drop-shadow(0 2px 4px rgba(255,255,255,0.1))"
                                />
                            </motion.div>

                            <motion.div
                                key="backtofocus-content"
                                initial={{ opacity: 1 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="min-h-[90px] flex flex-col justify-center"
                            >
                                <motion.h2
                                    className="text-2xl font-medium mb-2"
                                    variants={titleVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                >
                                    {selectedItem.title}
                                </motion.h2>

                                <motion.p
                                    className="text-md leading-relaxed font-light"
                                    variants={descriptionVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                >
                                    {selectedItem.phrase}
                                </motion.p>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
