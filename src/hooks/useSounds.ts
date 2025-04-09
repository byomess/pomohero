import { useCallback, useMemo } from 'react';
import { Howl } from 'howler';
import debounce from 'lodash.debounce';
import { TYPING_SOUND_DEBOUNCE_MS } from '../utils/constants';

// Define sound map outside the hook if it's static
const soundMap = {
    click: new Howl({ src: ['/sounds/small_beep.ogg', '/sounds/small_beep.wav'], volume: 0.7 }),
    buttonPress: new Howl({ src: ['/sounds/small_beep.ogg', '/sounds/small_beep.wav'], volume: 0.7 }),
    typing: new Howl({ src: ['/sounds/typing.wav', '/sounds/typing.mp3'], volume: 0.4 }),
    alarm: new Howl({ src: ['/sounds/alarm_1.ogg', '/sounds/alarm_1.wav'], volume: 0.8 }),
    focusStart: new Howl({ src: ['/sounds/focus_start.ogg', '/sounds/focus_start.wav'], volume: 0.7 }),
};

export type SoundName = keyof typeof soundMap;

export function useSounds(soundEnabled: boolean) {
    const playSound = useCallback((soundName: SoundName) => {
        if (soundEnabled && soundMap[soundName]) {
            soundMap[soundName].play();
        }
    }, [soundEnabled]);

    // Memoize the debounced function correctly
    const debouncedPlayTypingSound = useMemo(
        () => debounce(() => playSound('typing'), TYPING_SOUND_DEBOUNCE_MS),
        [playSound] // Dependency is playSound, which depends on soundEnabled
    );

    // Cleanup debounce on unmount
    /* // This is tricky with Howler/Debounce. If component unmounts mid-debounce,
       // sound might play after. Usually okay, but could add cleanup if needed:
       useEffect(() => {
           return () => {
               debouncedPlayTypingSound.cancel();
           };
       }, [debouncedPlayTypingSound]);
    */

    return { playSound, debouncedPlayTypingSound };
}
