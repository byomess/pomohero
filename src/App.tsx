import React, { useEffect, useState } from 'react';
import { PomodoroProvider } from './contexts/PomodoroContext';
import { MainLayout } from './components/Layout/MainLayout'; // Importar o novo Layout
import { INTRO_AUDIO_URL } from './utils/constants';
import usePreloadAudio from './hooks/usePreloadAudio';

const App: React.FC = () => {
    const [userInteracted, setUserInteracted] = useState(false);
    const { preloadedUrl: preloadedIntroUrl, isLoading: isPreloadingIntro, error: preloadIntroError } = usePreloadAudio(INTRO_AUDIO_URL);

    useEffect(() => {
        if (isPreloadingIntro) console.log("Pré-carregando áudio de introdução...");
        if (preloadIntroError) console.error("Erro ao pré-carregar áudio:", preloadIntroError);
        if (preloadedIntroUrl) console.log("Áudio pré-carregado pronto!");
    }, [isPreloadingIntro, preloadIntroError, preloadedIntroUrl]);

    // Tela inicial antes da interação do usuário
    if (!userInteracted) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-slate-900">
                <button
                    className="text-white border-2 border-white/30 rounded-xl text-lg px-6 py-3 hover:bg-white/10 transition duration-300 ease-in-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-slate-900 shadow-lg"
                    onClick={() => setUserInteracted(true)}
                    disabled={isPreloadingIntro} // Desabilitar enquanto carrega
                >
                    {isPreloadingIntro ? 'Carregando...' : 'Iniciar PomoHero'}
                </button>
            </div>
        );
    }

    // Renderiza o app principal após interação
    return (
        <PomodoroProvider preloadedIntroUrl={preloadedIntroUrl}>
            <MainLayout />
        </PomodoroProvider>
    );
};

export default App;
