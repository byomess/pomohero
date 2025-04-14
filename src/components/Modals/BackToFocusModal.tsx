// src/components/Modals/CongratsModal.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
// Voltando para BsAward ou pode escolher outro como BsStar ou BsTrophy
import { BsAward } from 'react-icons/bs';

// Lista de Títulos
const backToFocusTitles = [
    "Bem-vindo de volta!",
    "Aí vem o campeão!",
    "Hora de brilhar!",
];

// Lista de Frases (mantida)
const motivationalPhrases = [
    "Lembre-se: a dor da disciplina é menor que a dor do arrependimento.",
];

// Funções para obter valores aleatórios
const getRandomElement = <T,>(arr: T[]): T => {
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
};

export const BackToFocusModal: React.FC = () => {
    // Seleciona um título e uma frase aleatórios na montagem
    const [selectedTitle] = useState(() => getRandomElement(backToFocusTitles));
    const [selectedPhrase] = useState(() => getRandomElement(motivationalPhrases));

    // Revertendo para o estilo elegante com fundo transparente/blur
    return (
        // Overlay
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-lg p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
        >
            {/* Caixa do Modal */}
            <motion.div
                className={
                    `relative max-w-xs w-full rounded-2xl shadow-2xl p-8 text-center overflow-hidden
                    border border-white/10
                    backdrop-blur-xl
                    ring-1 ring-inset ring-emerald-500/10`
                }
                initial={{ opacity: 0, scale: 0.9, y: 25 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 25 }}
                transition={{
                    type: 'spring',
                    stiffness: 90,
                    damping: 18,
                    delay: 0.1
                }}
            >
                 {/* Ícone */}
                <BsAward
                    className="w-16 h-16 text-emerald-300 mx-auto mb-5 filter drop-shadow(0 2px 4px rgba(16,185,129,0.3))"
                />
                {/* Título Aleatório */}
                <h2 className="text-xl font-normal text-neutral-100 mb-3 tracking-wider">
                    {selectedTitle}
                </h2>
                {/* Frase Aleatória */}
                <p className="text-neutral-300 text-sm leading-relaxed min-h-[42px] flex items-center justify-center font-light">
                    {selectedPhrase}
                </p>
            </motion.div>
        </motion.div>
    );
};