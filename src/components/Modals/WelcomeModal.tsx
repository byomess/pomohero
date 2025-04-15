import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import { BsChatQuote } from 'react-icons/bs'; // Ou BsCloud

// --- Constantes ---
const STEP_DURATION_MS = 4080;
const WELCOME_BACK_DURATION_MS = 4500; // Usando 4800ms como no código fornecido
const TRANSITION_DURATION_S = 1;
const FINAL_BACKGROUND_OPACITY = 0.1; // Opacidade final do fundo
const INITIAL_TITLE_COLOR = "#eeeeee"; // Cor inicial H2 (slate-800)
const FINAL_TITLE_COLOR = "#ffffff";    // Cor final H2 (quase branco - slate-50)
const INITIAL_DESC_COLOR = "#eeeeee";  // Cor inicial P (slate-600)
const FINAL_DESC_COLOR = "#ffffff";     // Cor final P (mais suave - slate-300)
// const INITIAL_ICON_COLOR = "#0ea5e9"; // Cor inicial Ícone (sky-500)
// const FINAL_ICON_COLOR = "#7dd3fc";    // Cor final Ícone (sky-300) - Opcional

// --- Dados ---
const welcomeBacks = [
    { id: 'wb-1', title: "estive te esperando", description: "e eu sabia que voltaria" },
    { id: 'wb-2', title: "aí está você", description: "com vontade de vencer" },
    { id: 'wb-3', title: "o dever o chama", description: "mas não se preocupe, estou aqui" },
    { id: 'wb-4', title: "atordoado pela luta", description: "mas ainda disposto a lutar" },
    { id: 'wb-5', title: "você é forte", description: "e nada pode te parar" },
    { id: 'wb-6', title: "conte comigo", description: "mais uma vez" },
    { id: 'wb-7', title: "acredite", description: "você já está vencendo" },
];

const welcomeSteps = [
    { id: 'ws-1', title: "olá", description: "permita-me me apresentar..." },
    { id: 'ws-2', title: "muito prazer", description: "sou pomohero" },
    { id: 'ws-3', title: "confie em mim", description: "sou o herói do foco para muitos" },
    { id: 'ws-4', title: "e se me permitir", description: "posso ser o seu heroi também" },
];

// --- Funções Auxiliares ---
const getRandomElement = <T,>(arr: T[]): T => {
    if (arr.length === 0) return {} as T;
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
};

// --- Tipos de Props ---
interface WelcomeModalProps {
    isNewUser: boolean;
    onExited?: () => void;
}

// --- Componente WelcomeModal ---
export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isNewUser, onExited }) => {
    const [showModal, setShowModal] = useState(true);
    const [selectedWelcomeBack] = useState(() => getRandomElement(welcomeBacks));
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    // --- Efeito ---
    useEffect(() => {
        if (!showModal) return;
        const duration = isNewUser ? STEP_DURATION_MS : WELCOME_BACK_DURATION_MS;
        const timerId = setTimeout(() => {
            if (isNewUser) {
                if (currentStepIndex === welcomeSteps.length - 1) {
                    setShowModal(false);
                } else {
                    setCurrentStepIndex(prevIndex => prevIndex + 1);
                }
            } else {
                setShowModal(false);
            }
        }, duration);
        return () => clearTimeout(timerId);
    }, [isNewUser, currentStepIndex, showModal]);

    const modalData = isNewUser ? welcomeSteps[currentStepIndex] : selectedWelcomeBack;
    const currentDurationMs = isNewUser ? STEP_DURATION_MS : WELCOME_BACK_DURATION_MS;

    // --- Variantes de Animação ---

    // Container Principal (Posição, Escala, Presença Geral)
    const modalContainerVariants = {
        initial: { opacity: 0, y: 50, scale: 0.95 },
        animate: (custom: { durationMs: number, isWelcomeBack: boolean }) => ({
            opacity: 1,
            y: [0, custom.isWelcomeBack ? -30 : -20],
            scale: 1,
            transition: {
                opacity: { duration: TRANSITION_DURATION_S, ease: "easeOut" },
                scale: { duration: TRANSITION_DURATION_S, ease: "easeOut" },
                y: {
                    duration: custom.durationMs / 1000,
                    ease: "linear",
                    delay: TRANSITION_DURATION_S * 0.5
                }
            }
        }),
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

    // --- Animação para o FUNDO do Modal (Controla Opacidade do Fundo) ---
    const backgroundVariants = {
        initial: { opacity: 0.8 }, // Opacidade inicial do fundo
        animate: (custom: { durationMs: number }) => ({
             // Anima a opacidade do fundo durante a subida
            opacity: [0.8, FINAL_BACKGROUND_OPACITY],
            transition: {
                duration: custom.durationMs / 1000, // Mesma duração da subida
                ease: "linear", // Desvanecimento linear
                delay: TRANSITION_DURATION_S * 0.5 // Começa a desvanecer junto com a subida
            }
        }),
         // Garante que o fundo desapareça na saída também
        exit: { opacity: 0, transition: { duration: TRANSITION_DURATION_S * 0.8, ease: "easeIn" } }
    };


    // --- Variantes para o Texto (Animação de Cor) ---
    const textAnimateProps = (custom: { durationMs: number }) => ({
        transition: {
            duration: custom.durationMs / 1000,
            ease: "linear", // Mesmo easing da subida/fundo
            delay: TRANSITION_DURATION_S * 0.5 // Mesmo delay
        }
    });

    const titleVariants = {
        initial: { color: INITIAL_TITLE_COLOR }, // Cor inicial
        animate: (custom: { durationMs: number }) => ({
            color: [INITIAL_TITLE_COLOR, FINAL_TITLE_COLOR], // Anima de inicial para final
            ...textAnimateProps(custom) // Aplica a transição sincronizada
        }),
        exit: { color: INITIAL_TITLE_COLOR } // Opcional: resetar cor na saída
    };

    const descriptionVariants = {
        initial: { color: INITIAL_DESC_COLOR },
        animate: (custom: { durationMs: number }) => ({
            color: [INITIAL_DESC_COLOR, FINAL_DESC_COLOR],
            ...textAnimateProps(custom)
        }),
        exit: { color: INITIAL_DESC_COLOR }
    };

    // Opcional: Variantes para o Ícone
    // const iconVariants = {
    //     initial: { color: INITIAL_ICON_COLOR },
    //     animate: (custom: { durationMs: number }) => ({
    //         color: [INITIAL_ICON_COLOR, FINAL_ICON_COLOR],
    //         ...textAnimateProps(custom)
    //     }),
    //     exit: { color: INITIAL_ICON_COLOR }
    // };


    // --- Renderização ---
    return (
        <AnimatePresence mode="wait" onExitComplete={onExited}>
            {showModal && modalData && modalData.id && (
                // Overlay (Aumentado bg-black/60 como no código fornecido)
                <motion.div
                    key="welcome-modal-overlay"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: TRANSITION_DURATION_S * 0.6, ease: 'linear' }}
                >
                    {/* Caixa Container do Modal */}
                    <motion.div
                        key={modalData.id}
                        className="relative max-w-sm w-full rounded-2xl shadow-lg text-center overflow-hidden" // Removido text-slate-700 daqui
                        custom={{ durationMs: currentDurationMs, isWelcomeBack: !isNewUser }}
                        variants={modalContainerVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    >
                        {/* Elemento de Fundo */}
                        <motion.div
                             key={modalData.id + "-background"}
                             className="absolute inset-0 -z-10 rounded-2xl bg-white/30 backdrop-blur-md shadow-lg"
                             variants={backgroundVariants}
                             custom={{ durationMs: currentDurationMs }}
                             initial="initial"
                             animate="animate"
                             exit="exit"
                        />

                        {/* Conteúdo Interno */}
                        <div className="p-4 pt-6 relative z-10">
                            {/* Ícone (Removido do código fornecido, mas pode ser re-adicionado com animação opcional) */}
                            {/*
                            <motion.div // ou motion(BsChatQuote) se a lib suportar
                                variants={iconVariants}
                                custom={{ durationMs: currentDurationMs }}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                            >
                                <BsChatQuote
                                    className="w-12 h-12 mx-auto mb-5" // Cor removida, controlada por variants
                                />
                            </motion.div>
                            */}


                            {/* Área de Texto */}
                            <AnimatePresence mode="wait">
                                {/* Usamos um motion.div extra aqui SÓ para o fade de entrada/saída do CONTEÚDO */}
                                <motion.div
                                    key={modalData.id + "-content"}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className="min-h-[90px] flex flex-col justify-center"
                                >
                                    {/* Título com animação de cor */}
                                    <motion.h2
                                        className="text-2xl font-medium mb-2" // Removido text-slate-800
                                        variants={titleVariants}
                                        custom={{ durationMs: currentDurationMs }}
                                        initial="initial" // Herdado do AnimatePresence pai para cor, mas redundante aqui
                                        animate="animate"
                                        exit="exit" // Herdado para cor
                                    >
                                        {modalData.title}
                                    </motion.h2>

                                    {/* Descrição com animação de cor */}
                                    <motion.p
                                        className="text-md leading-relaxed font-light" // Removido text-slate-600
                                        variants={descriptionVariants}
                                        custom={{ durationMs: currentDurationMs }}
                                        initial="initial"
                                        animate="animate"
                                        exit="exit"
                                    >
                                        {modalData.description}
                                    </motion.p>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};