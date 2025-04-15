// src/hooks/useSounds.ts
import { useCallback, useMemo, useRef, useEffect } from 'react';
import { Howl } from 'howler';
import debounce from 'lodash.debounce';
import { TYPING_SOUND_DEBOUNCE_MS } from '../utils/constants';

// Define sound map outside the hook
const soundMap = {
    click: new Howl({ src: ['/sounds/small_beep.ogg', '/sounds/small_beep.wav'], volume: 0.7 }),
    buttonPress: new Howl({ src: ['/sounds/small_beep.ogg', '/sounds/small_beep.wav'], volume: 0.7 }),
    typing: new Howl({ src: ['/sounds/typing.wav', '/sounds/typing.mp3'], volume: 0.4 }),
    alarm: new Howl({
        src: ['/sounds/alarm_1.ogg', '/sounds/alarm_1.wav'],
        volume: 0.8,
        loop: false // Default to not looping for single plays
    }),
    select: new Howl({ src: ['/sounds/select.ogg', '/sounds/select.mp3'], volume: 0.5 }),
    confirm: new Howl({ src: ['/sounds/confirm.ogg', '/sounds/confirm.wav'], volume: 0.5 }),
    remove: new Howl({ src: ['/sounds/remove.ogg', '/sounds/remove.mp3'], volume: 0.5 }),
    focusStart: new Howl({ src: ['/sounds/focus_start.ogg', '/sounds/focus_start.wav'], volume: 0.3 }),
    focusAlmostEnding: new Howl({ src: ['/sounds/focus_almost_ending.ogg', '/sounds/focus_almost_ending.mp3', '/sounds/focus_almost_ending.wav'], volume: 0.2 }),
    hyperfocus: new Howl({ src: ['/sounds/hyperfocus.ogg', '/sounds/hyperfocus.mp3'], volume: 0.5 }),
};

export type SoundName = keyof typeof soundMap;

export function useSounds(soundEnabled: boolean) {
    // Ref to store the ID of the currently looping alarm sound instance
    const loopingAlarmIdRef = useRef<number | null>(null);

    // Function to play a sound once
    const playSound = useCallback((soundName: SoundName) => {
        if (soundEnabled && soundMap[soundName]) {
            soundMap[soundName].play();
        }
    }, [soundEnabled]);

    // Function to start playing the alarm sound in a loop
    const playAlarmLoop = useCallback(() => {
        if (soundEnabled) {
            // Stop any previously looping alarm first
            if (loopingAlarmIdRef.current !== null) {
                soundMap.alarm.stop(loopingAlarmIdRef.current);
                console.log("Stopped previous looping alarm instance:", loopingAlarmIdRef.current);
            }
            // Play the alarm sound and enable loop for this instance
            const id = soundMap.alarm.play();
            soundMap.alarm.loop(true, id);
            loopingAlarmIdRef.current = id; // Store the ID of the looping instance
            console.log("Started looping alarm, ID:", id);
        }
    }, [soundEnabled]); // Dependency: only needs soundEnabled

    // Function to stop the currently looping alarm sound
    const stopAlarmLoop = useCallback(() => {
        if (loopingAlarmIdRef.current !== null) {
            console.log("Stopping looping alarm, ID:", loopingAlarmIdRef.current);
            soundMap.alarm.stop(loopingAlarmIdRef.current); // Stop the specific instance
            // NOTE: Howler doesn't easily let you turn off loop for just one ID. Stopping is sufficient.
            loopingAlarmIdRef.current = null; // Clear the stored ID
        }
    }, []); // No dependencies needed as it only interacts with the ref and soundMap

    // Debounced function for typing sound
    const debouncedPlayTypingSound = useMemo(
        () => debounce(() => playSound('typing'), TYPING_SOUND_DEBOUNCE_MS),
        [playSound] // Depends on the stable playSound function
    );

    // Cleanup effect: Ensure looping sound is stopped and debounce is cancelled on unmount
    useEffect(() => {
        return () => {
            stopAlarmLoop();
            debouncedPlayTypingSound.cancel();
        };
    }, [stopAlarmLoop, debouncedPlayTypingSound]); // Depend on the stable cleanup functions


    return { playSound, debouncedPlayTypingSound, playAlarmLoop, stopAlarmLoop };
}