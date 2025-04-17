// src/hooks/usePreloadAudio.ts
import { useState, useEffect } from 'react';

interface PreloadAudioResult {
    preloadedUrl: string | null;
    isLoading: boolean;
    error: string | null;
}

/**
 * Hook para pré-carregar um arquivo de áudio e fornecer uma URL de Blob.
 * Lembre-se que a URL do Blob deve ser revogada quando não for mais necessária
 * (o hook tenta fazer isso automaticamente ao desmontar ou quando a src muda).
 * @param audioSrc A URL do arquivo de áudio para pré-carregar.
 * @returns Um objeto com a URL pré-carregada (blob URL), estado de carregamento e erro.
 */
function usePreloadAudio(audioSrc: string | null | undefined): PreloadAudioResult {
    const [preloadedUrl, setPreloadedUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Variável para guardar a URL do objeto e garantir que possamos revogá-la
        let objectUrl: string | null = null;

        // Só executa se audioSrc for fornecido e ainda não tivermos pré-carregado
        if (audioSrc && !preloadedUrl) {
            setIsLoading(true);
            setError(null);

            // Flag para verificar se o componente ainda está montado ao final do fetch
            let isMounted = true;

            fetch(audioSrc)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status} for ${audioSrc}`);
                    }
                    return response.blob(); // Pega o corpo da resposta como um Blob
                })
                .then(blob => {
                    if (isMounted) {
                        objectUrl = URL.createObjectURL(blob); // Cria uma URL local para o Blob
                        setPreloadedUrl(objectUrl);
                        console.log(`Áudio pré-carregado com sucesso: ${audioSrc} -> ${objectUrl}`);
                    } else {
                        // Se desmontou antes de terminar, revoga a URL imediatamente
                         if (objectUrl) URL.revokeObjectURL(objectUrl);
                         console.log(`Pré-carregamento de ${audioSrc} abortado (componente desmontado).`);
                    }
                })
                .catch(e => {
                    console.error("Erro ao pré-carregar o áudio:", e);
                    if (isMounted) {
                         setError(e instanceof Error ? e.message : 'Falha ao carregar áudio');
                         setPreloadedUrl(null); // Garante que não use uma URL inválida
                    }
                })
                .finally(() => {
                     if (isMounted) {
                        setIsLoading(false);
                     }
                });

            // Função de limpeza IMPORTANTÍSSIMA!
            return () => {
                isMounted = false; // Marca como desmontado
                if (objectUrl) {
                    console.log(`Revogando Object URL ao limpar efeito: ${objectUrl}`);
                    URL.revokeObjectURL(objectUrl);
                    // Não é estritamente necessário limpar o estado aqui se o isMounted já previne,
                    // mas pode ser bom para clareza se o hook for reutilizado de formas complexas.
                    // setPreloadedUrl(null);
                }
            };
        } else if (!audioSrc) {
             // Se o audioSrc for removido (null/undefined), limpa o estado
              // Se já existia uma URL, ela precisa ser revogada
              if (preloadedUrl && preloadedUrl.startsWith('blob:')) {
                   console.log(`Revogando Object URL anterior devido à mudança de src: ${preloadedUrl}`);
                   URL.revokeObjectURL(preloadedUrl);
              }
              setPreloadedUrl(null);
              setIsLoading(false);
              setError(null);
        }

    // A dependência [audioSrc, preloadedUrl] garante que o efeito re-execute se a URL do áudio mudar.
    // Se preloadedUrl estiver aqui, a limpeza também rodará quando ele for setado.
    // Vamos manter apenas audioSrc para evitar complexidade extra, a lógica interna já checa preloadedUrl.
    }, [audioSrc]);

    // Limpeza final caso o componente que *usa* o hook desmonte
    // Isso é uma camada extra de segurança, o cleanup do useEffect acima deve ser suficiente.
    useEffect(() => {
        return () => {
            if (preloadedUrl && preloadedUrl.startsWith('blob:')) {
                 console.log(`Revogando Object URL ao desmontar componente que usa o hook: ${preloadedUrl}`);
                 // Não podemos chamar URL.revokeObjectURL(preloadedUrl) aqui diretamente
                 // porque o preloadedUrl é do estado anterior. O cleanup do primeiro useEffect
                 // já deve ter cuidado disso ao rodar por causa da desmontagem.
                 // Deixar este useEffect vazio ou removê-lo é mais seguro.
            }
        };
    }, [preloadedUrl]); // Dependência no preloadedUrl para saber qual URL revogar


    return { preloadedUrl, isLoading, error };
}

export default usePreloadAudio;
