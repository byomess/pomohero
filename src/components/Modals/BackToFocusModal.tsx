// src/components/Modals/CongratsModal.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
// Voltando para BsAward ou pode escolher outro como BsStar ou BsTrophy
import { BsAward } from 'react-icons/bs';

// Lista de Títulos
const backToFocusTitles = [
    "Bem-vindo de volta!",
    "Aí vem o campeão",
    "Hora de brilhar",
    "Você voltou!",
    "Sem margem de erro",
    "Nova missão",
    "Traga o foco",
    "Vença aqui e agora",
    "Conquiste o dia",
    "Capacitado e pronto",
    "Sinto sua energia",
    "Melhor do que nunca",
    "Você consegue",
    "Voce pode sim",
    "A hora é agora",
    "Comece, continue e vença",
    "Começar é o primeiro passo",
    "Venha comigo",
    "Estou aqui com você",
    "Você é capaz",
    "Você é forte",
    "Você é incrível",
];

// Lista de Frases (mantida)
const motivationalPhrases = [
    "Lembre-se: a dor da disciplina é menor que a dor do arrependimento.",
    "Lembre-se: feito é melhor que perfeito.",
    "A disciplina é a ponte entre metas e realizações.",
    "Você é mais forte do que pensa. Traga mais esse foco pra conta.",
    "A disciplina é o caminho para a liberdade, e não uma prisão.",
    "Com a disciplina, você pode conquistar qualquer coisa.",
    "Vá em frente, você está no caminho certo.",
    "Seu eu do futuro vai agradecer por isso, acredite.",
    "Sua capacidade de foco é sua maior força. Use-a agora.",
    "Não vai ser um bicho de sete cabeças, você sabe disso.",
    "O caminho é este, e a hora é agora.",
    "Comece onde você está, use o que você tem, faça o que você pode.",
    "Avante, guereiro! O foco é seu aliado, e não seu inimigo.",
    "Você não está sozinho nessa jornada. Eu estou aqui com você.",
    "Você tem sonhos que anseia realizar, não esqueça disso.",
    "Traga mais essa vitória pra conta, você merece."
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