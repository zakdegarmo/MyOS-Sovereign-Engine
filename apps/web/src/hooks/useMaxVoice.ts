import { useState, useEffect, useRef, useCallback } from 'react';

interface MaxVoiceState {
    isSpeaking: boolean;
    speak: (text: string) => void;
    stop: () => void;
}

export const useMaxVoice = (): MaxVoiceState => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const synth = useRef<SpeechSynthesis | null>(null);
    const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

    // Initialize Synth
    useEffect(() => {
        if (typeof window !== 'undefined') {
            synth.current = window.speechSynthesis;

            const loadVoices = () => {
                const voices = synth.current?.getVoices() || [];
                // Prefer deeper, robotic, or male voices
                voiceRef.current = voices.find(v =>
                    v.name.includes('Google US English') ||
                    v.name.includes('Microsoft David') ||
                    v.name.includes('Daniel')
                ) || voices[0];
            };

            loadVoices();
            if (synth.current.onvoiceschanged !== undefined) {
                synth.current.onvoiceschanged = loadVoices;
            }
        }
    }, []);

    // Clean Speak Function
    const speak = useCallback((text: string) => {
        if (!synth.current || !voiceRef.current) return;

        // Cancel previous
        synth.current.cancel();
        setIsSpeaking(true);

        // 1. Text Pre-processing (High Fidelity)
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = voiceRef.current;

        // 2. Clear Communication Parameters (No Glitch)
        utterance.pitch = 1.0; // Professional Neutral
        utterance.rate = 0.95; // Slightly slower for better articulation
        utterance.volume = 1.0;

        utterance.onend = () => {
            setIsSpeaking(false);
        };

        utterance.onerror = (e) => {
            console.error("Max Voice Error:", e);
            setIsSpeaking(false);
        };

        synth.current?.speak(utterance);
    }, []);

    const stop = useCallback(() => {
        synth.current?.cancel();
        setIsSpeaking(false);
    }, []);

    return { isSpeaking, speak, stop };
};
