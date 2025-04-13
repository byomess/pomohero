// src/components/Modals/CongratsModal.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
// Voltando para BsAward ou pode escolher outro como BsStar ou BsTrophy
import { BsAward } from 'react-icons/bs';

// Lista de Títulos
const congratsTitles = [
    "Foco Concluído!",
    "Mandou Bem!",
    "Pausa Merecida!",
    "Sucesso!",
    "Ótimo Trabalho!",
    "Missão Cumprida!",
    "Hora de Relaxar!",
    "Excelente Esforço!",
    "Você Conseguiu!",
    "Etapa Finalizada!",
    "Bom Descanso!",
    "Ciclo Completo!",
    "Parabéns!",
    "Recarregue as Energias!",
    "Que Desempenho!",
    "Tempo de Pausa!",
    "Conquista!",
    "Muito Bom!",
    "Desconecte um Pouco!",
    "Objetivo Atingido!",
];

// Lista de Frases (mantida)
const motivationalPhrases = [
    "Excelente trabalho! Você merece esta pausa para recarregar.",
    "Foco incrível! Hora de relaxar um pouco a mente.",
    "Mandou bem! Aproveite seu merecido descanso.",
    "Sessão produtiva concluída! Respire fundo.",
    "Parabéns pelo esforço! Sua pausa chegou.",
    "Continue assim! Pequenas pausas geram grandes resultados.",
    "Impressionante! Use este tempo para se reenergizar.",
    "O progresso é feito passo a passo. Descanse o seu.",
    "Você está no caminho certo! Aproveite a pausa.",
    "Que concentração! Agora, um momento para você.",
    "Bom trabalho! Pausar também é parte do processo.",
    "Missão cumprida! Recarregue para a próxima.",
    "Sua dedicação é notável. Desfrute do intervalo.",
    "Foco finalizado com sucesso! Relaxe e celebre.",
    "Energia bem gasta! Hora de recuperar.",
    "Mais um passo dado! Curta sua pausa.",
    "Ótimo desempenho! Um descanso agora cairá bem.",
    "Mantenha o ritmo! Mas antes, uma pausa estratégica.",
    "Seu cérebro agradece! Aproveite este respiro.",
    "Conquista desbloqueada: Foco Completo! Descanse.",
];

// Funções para obter valores aleatórios
const getRandomElement = <T,>(arr: T[]): T => {
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
};

export const CongratsModal: React.FC = () => {
    // Seleciona um título e uma frase aleatórios na montagem
    const [selectedTitle] = useState(() => getRandomElement(congratsTitles));
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