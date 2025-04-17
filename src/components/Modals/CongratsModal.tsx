// src/components/Modals/CongratsModal.tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BsAward } from 'react-icons/bs';
import { title } from 'process';

// --- Constantes ---
const CONGRATS_DURATION_MS = 4800;
const TRANSITION_DURATION_S = 0.5;
const FINAL_BACKGROUND_OPACITY = 0.1;

const INITIAL_TITLE_COLOR = "#eeeeee";
const FINAL_TITLE_COLOR = "#ffffff";
const INITIAL_DESC_COLOR = "#eeeeee";
const FINAL_DESC_COLOR = "#ffffff";
const INITIAL_ICON_COLOR = "#eeeeee";
const FINAL_ICON_COLOR = "#ffffff";

// --- Frases pós-foco ---
const afterFocusData = [
  { title: "é isso", phrase: "você venceu mais uma vez" },
  { title: "parabéns", phrase: "seu cérebro agradece esse esforço" },
  { title: "mais uma pra conta", phrase: "continue nesse ritmo, está perfeito" },
  { title: "foco concluído", phrase: "agora respire e aproveite o intervalo" },
  { title: "isso é vitória", phrase: "e você merece um momento só seu" },
  { title: "baita conquista", phrase: "e o mérito é todo seu" },
  { title: "surpreendente", phrase: "você tá indo longe com isso" },
  { title: "inacreditável", phrase: "o tamanho da sua vontade de vencer" },
  { title: "esforço notável", phrase: "e você tá colhendo os frutos disso" },
  { title: "respire fundo", phrase: "e sinta o orgulho de ter feito isso" },
  { title: "você fez", phrase: "aquilo acontecer" },
  { "title": "ritmo de campeão", "phrase": "cada foco seu é um passo a mais no pódio" },
  { "title": "respeito", "phrase": "você merece todo o crédito por esse foco" },
  { "title": "você é constante", "phrase": "e constância é o que muda tudo" },
  { "title": "orgulho puro", "phrase": "é lindo ver esse comprometimento" },
  { "title": "essa foi de mestre", "phrase": "você dominou o tempo como um herói" },
  { "title": "mais forte que a preguiça", "phrase": "isso sim é superpoder" },
  { "title": "você não falhou", "phrase": "você escolheu continuar" },
  { "title": "sua mente agradece", "phrase": "e seu futuro também" },
  { "title": "você mandou muito", "phrase": "agora vai lá e aproveita a pausa, você merece" },
  { "title": "olha só você", "phrase": "transformando foco em conquistas reais" },
  { "title": "imparável", "phrase": "só quem tá nesse ritmo entende" },
  { title: "mais forte", phrase: "mais focado, menos culpa" },
  { title: "isso é progresso", phrase: "mesmo que pareça pequeno" },
  { title: "isso foi um passo real", phrase: "e você deu ele com coragem" },
  { title: "ótimo trabalho", phrase: "é assim que se constrói constância" },
  { title: "você fez acontecer", phrase: "mesmo que ninguém tenha visto — eu vi" },
  { title: "isso é vitória", phrase: "não importa o tamanho da tarefa" },
  { title: "missão cumprida", phrase: "e a próxima começa com uma pausa" },
  { title: "você merece", phrase: "um respiro, um elogio e um gole d'água" },
  { title: "o esforço valeu", phrase: "mesmo que pareça pouco, ele soma" },
  { title: "mais foco, menos culpa", phrase: "você está reescrevendo sua rotina" },
  { title: "isso foi um treino mental", phrase: "e você tá ficando cada vez mais forte" },
  { title: "não é só produtividade", phrase: "é autocuidado em forma de ação" },
  { title: "o tempo passou", phrase: "e você permaneceu — isso importa" },
  { title: "você não desistiu", phrase: "e isso diz muito sobre você" },
  { title: "o foco é seu aliado", phrase: "e você tá aprendendo a trabalhar com ele" },
  { title: "foi uma boa escolha", phrase: "dar esse tempo ao que importa" },
  { title: "pode confiar nisso", phrase: "sua capacidade de focar está viva" },
  { title: "você me emociona", phrase: "com sua persistência e coragem" },
];

const getRandomElement = <T,>(arr: T[]): T => {
  if (arr.length === 0) return {} as T;
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
};

interface CongratsModalProps {
  onExited?: () => void;
}

export const CongratsModal: React.FC<CongratsModalProps> = ({ onExited }) => {
  const [selectedItem] = useState(() => getRandomElement(afterFocusData));
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setShowModal(false);
    }, CONGRATS_DURATION_MS);

    return () => clearTimeout(timerId);
  }, []);

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
    initial: { opacity: 1 },
    animate: {
      opacity: [0.8, FINAL_BACKGROUND_OPACITY],
      transition: {
        duration: CONGRATS_DURATION_MS / 1000,
        ease: "linear",
        delay: TRANSITION_DURATION_S * 0.5
      }
    },
    exit: { opacity: 0, transition: { duration: TRANSITION_DURATION_S * 0.8, ease: "easeIn" } }
  };

  const textAnimateProps = {
    transition: {
      duration: CONGRATS_DURATION_MS / 1000,
      ease: "linear",
      delay: TRANSITION_DURATION_S * 0.5
    }
  };

  const titleVariants = {
    initial: { color: INITIAL_TITLE_COLOR },
    animate: { color: [INITIAL_TITLE_COLOR, FINAL_TITLE_COLOR], ...textAnimateProps },
    exit: { color: INITIAL_TITLE_COLOR }
  };

  const descriptionVariants = {
    initial: { color: INITIAL_DESC_COLOR },
    animate: { color: [INITIAL_DESC_COLOR, FINAL_DESC_COLOR], ...textAnimateProps },
    exit: { color: INITIAL_DESC_COLOR }
  };

  const iconVariants = {
    initial: { color: INITIAL_ICON_COLOR },
    animate: { color: [INITIAL_ICON_COLOR, FINAL_ICON_COLOR], ...textAnimateProps },
    exit: { color: INITIAL_ICON_COLOR }
  };

  return (
    <AnimatePresence onExitComplete={onExited}>
      {showModal && (
        <motion.div
          key="congrats-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg p-4"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: TRANSITION_DURATION_S * 1, ease: 'linear' }}
        >
          <motion.div
            key="congrats-modal-container"
            className="relative max-w-sm w-full rounded-2xl shadow-lg text-center overflow-hidden"
            variants={modalContainerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <motion.div
              key="congrats-modal-background"
              className="absolute inset-0 -z-10 rounded-2xl bg-white/50 backdrop-blur-md shadow-lg"
              variants={backgroundVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            />

            <div className="p-4 pt-6 relative z-10">
              <motion.div
                key="congrats-icon-wrapper"
                variants={iconVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <BsAward className="w-16 h-16 mx-auto mb-5 filter drop-shadow(0 2px 4px rgba(255,255,255,0.1))" />
              </motion.div>

              <motion.div
                key="congrats-content"
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
