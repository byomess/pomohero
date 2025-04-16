import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import sosFocusRaw from "../../data/sos_focus.json";

// ---------------- Constantes ----------------
const STEP_DURATION_MS = 5000;
const TRANSITION_DURATION_S = 1;
const FINAL_BACKGROUND_OPACITY = 0.1;

const INITIAL_TITLE_COLOR = "#eeeeee";
const FINAL_TITLE_COLOR = "#ffffff";
const INITIAL_DESC_COLOR = "#eeeeee";
const FINAL_DESC_COLOR = "#ffffff";

// ---------------- Tipos ----------------
type Message = { primary: string; secondary: string };

// ---------------- Helpers ----------------
const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const getRandomSequence = (): Message[] => {
    const sequences = sosFocusRaw as Message[][];
    return getRandomElement(sequences);
};

// ---------------- Props ----------------
interface SOSFocusModalProps {
    onExited?: () => void;
}

// ---------------- Componente ----------------
export const SOSFocusModal: React.FC<SOSFocusModalProps> = ({ onExited }) => {
    const [showModal, setShowModal] = useState(true);
    const [sequence] = useState<Message[]>(() => getRandomSequence());
    const [currentStepIndex, setStepIdx] = useState(0);

    // Avança passos e fecha no fim
    useEffect(() => {
        if (!showModal) return;
        const timer = setTimeout(() => {
            if (currentStepIndex === sequence.length - 1) {
                setShowModal(false);
            } else {
                setStepIdx((i) => i + 1);
            }
        }, STEP_DURATION_MS);
        return () => clearTimeout(timer);
    }, [currentStepIndex, sequence.length, showModal]);

    const modalData = sequence[currentStepIndex];

    // ---------------- Variants ----------------
    const modalContainerVariants = {
        initial: { opacity: 0, y: 50, scale: 0.95 },
        animate: {
            opacity: 1,
            y: [-5, -30],
            scale: 1,
            transition: {
                opacity: { duration: TRANSITION_DURATION_S, ease: "easeOut" },
                y: { duration: STEP_DURATION_MS / 1000, ease: "linear", delay: TRANSITION_DURATION_S * 0.5 },
                scale: { duration: TRANSITION_DURATION_S, ease: "easeOut" },
            },
        },
        exit: {
            opacity: 0,
            y: -70,
            scale: 0.9,
            transition: { duration: TRANSITION_DURATION_S * 0.8, ease: "easeIn" },
        },
    };

    const backgroundVariants = {
        initial: { opacity: 1 },
        animate: {
            opacity: [0.8, FINAL_BACKGROUND_OPACITY],
            transition: {
                duration: STEP_DURATION_MS / 1000,
                ease: "linear",
                delay: TRANSITION_DURATION_S * 0.5,
            },
        },
        exit: { opacity: 0, transition: { duration: TRANSITION_DURATION_S * 0.8, ease: "easeIn" } },
    };

    // Texto (cor)
    const textTransition = {
        duration: STEP_DURATION_MS / 1000,
        ease: "linear",
        delay: TRANSITION_DURATION_S * 0.5,
    };

    const titleVariants = {
        initial: { color: INITIAL_TITLE_COLOR },
        animate: { color: [INITIAL_TITLE_COLOR, FINAL_TITLE_COLOR], transition: textTransition },
        exit: { color: INITIAL_TITLE_COLOR },
    };
    const descVariants = {
        initial: { color: INITIAL_DESC_COLOR },
        animate: { color: [INITIAL_DESC_COLOR, FINAL_DESC_COLOR], transition: textTransition },
        exit: { color: INITIAL_DESC_COLOR },
    };

    // ---------------- Render ----------------
    return (
        <AnimatePresence mode="wait" onExitComplete={onExited}>
            {showModal && modalData && (
                <motion.div
                    key="sos-focus-overlay"
                    className="absolute fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg p-4"
                    initial={{ opacity: 0.4 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: TRANSITION_DURATION_S, ease: "linear" }}
                >
                    <motion.div
                        key={`step-${currentStepIndex}`}
                        className="relative max-w-lg w-full rounded-2xl shadow-lg text-center overflow-hidden"
                        variants={modalContainerVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    >
                        {/* fundo blur/branco */}
                        <motion.div
                            className="absolute inset-0 -z-10 rounded-2xl bg-white/50 backdrop-blur-md shadow-lg"
                            variants={backgroundVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                        />
                        {/* conteúdo */}
                        <motion.div
                            key={`content-${currentStepIndex}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="p-6 min-h-[90px] flex flex-col justify-center"
                        >
                            <motion.h2
                                className="text-2xl font-medium mb-2"
                                variants={titleVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                            >
                                {modalData.primary}
                            </motion.h2>
                            <motion.p
                                className="text-md font-light leading-relaxed"
                                variants={descVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                            >
                                {modalData.secondary}
                            </motion.p>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
