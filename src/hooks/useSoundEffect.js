import { useEffect, useRef } from 'react';
import * as Tone from 'tone';

export const useSoundEffect = () => {
    const clickSynth = useRef(null);
    const alarmSynth = useRef(null);

    useEffect(() => {
        // Synths ko create karna, lekin Tone.start() ke bina
        try {
            clickSynth.current = new Tone.Synth({
                oscillator: { type: "sine" },
                envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.05 },
                volume: -25
            }).toDestination();

            alarmSynth.current = new Tone.Synth({
                oscillator: { type: "square" },
                envelope: { attack: 0.1, decay: 0.5, sustain: 0.3, release: 1 }
            }).toDestination();
        } catch (e) {
            console.error("Failed to create Tone.js synths:", e);
        }

        return () => {
            if (clickSynth.current) clickSynth.current.dispose();
            if (alarmSynth.current) alarmSynth.current.dispose();
        };
    }, []);

    const startAudioContext = async () => {
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }
    };

    const playClick = () => {
        startAudioContext().then(() => {
            if (clickSynth.current) {
                clickSynth.current.triggerAttackRelease("C5", "16n");
            }
        });
    };

    const playAlarm = () => {
        startAudioContext().then(() => {
            if (alarmSynth.current) {
                alarmSynth.current.triggerAttackRelease("A4", "0.5n", Tone.now());
                alarmSynth.current.triggerAttackRelease("F4", "0.5n", Tone.now() + 0.5);
            }
        });
    };
    
    const stopAlarm = () => {
        if (alarmSynth.current) {
            alarmSynth.current.releaseAll();
        }
    };

    return { playClick, playAlarm, stopAlarm };
};
