import React, { useEffect, useState, useRef } from 'react';

export type VisemeMouth = 'closed' | 'open_small' | 'open_wide' | 'o' | 'smirk';
export type VisemeEye = 'open' | 'blink' | 'half';

interface LarryPortraitVisemesProps {
    isSpeaking: boolean;
    mood?: 'neutral' | 'talking' | 'smirk' | 'surprised' | 'concerned';
    className?: string;
}

export const LarryPortraitVisemes: React.FC<LarryPortraitVisemesProps> = ({
    isSpeaking,
    mood = 'neutral',
    className = 'w-32 h-32'
}) => {
    const [mouth, setMouth] = useState<VisemeMouth>('closed');
    const [eye, setEye] = useState<VisemeEye>('open');

    // Natural eye blink timer (every 3 to 6 seconds)
    useEffect(() => {
        let blinkTimeout: NodeJS.Timeout;
        const triggerBlink = () => {
            setEye('half');
            setTimeout(() => {
                setEye('blink');
                setTimeout(() => {
                    setEye('half');
                    setTimeout(() => {
                        setEye('open');
                        const nextDelay = 3000 + Math.random() * 3500;
                        blinkTimeout = setTimeout(triggerBlink, nextDelay);
                    }, 40);
                }, 80);
            }, 30);
        };

        const initialDelay = 2000 + Math.random() * 2000;
        blinkTimeout = setTimeout(triggerBlink, initialDelay);

        return () => clearTimeout(blinkTimeout);
    }, []);

    // Mouth flap cycle when speech typewriter is active
    useEffect(() => {
        if (!isSpeaking) {
            setMouth(mood === 'smirk' ? 'smirk' : 'closed');
            return;
        }

        const mouthCycle: VisemeMouth[] = ['open_small', 'open_wide', 'o', 'open_small', 'closed', 'open_wide'];
        let cycleIdx = 0;

        const interval = setInterval(() => {
            cycleIdx = (cycleIdx + 1) % mouthCycle.length;
            setMouth(mouthCycle[cycleIdx]);
        }, 110);

        return () => clearInterval(interval);
    }, [isSpeaking, mood]);

    return (
        <div className={`relative flex items-center justify-center select-none overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-cyan-950 border-2 border-cyan-400/60 shadow-[0_0_25px_rgba(6,182,212,0.3)] ${className}`}>
            {/* Tech grid backdrop */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:8px_8px]" />

            {/* Hand-Drawn Cel-Shaded 2D Illustrated Bust */}
            <svg
                viewBox="0 0 200 200"
                className="w-full h-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="larrySkin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffd8bd" />
                        <stop offset="100%" stopColor="#e5a882" />
                    </linearGradient>
                    <linearGradient id="larryShirt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#cbd5e1" />
                    </linearGradient>
                    <linearGradient id="larryTie" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#991b1b" />
                    </linearGradient>
                    <linearGradient id="larryHair" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#452a1a" />
                        <stop offset="100%" stopColor="#24140e" />
                    </linearGradient>
                </defs>

                {/* --- 1. Shoulders & White Collared Dress Shirt --- */}
                {/* Back Collar */}
                <path
                    d="M 68 140 Q 100 132 132 140 L 140 160 L 60 160 Z"
                    fill="#94a3b8"
                    stroke="#0f172a"
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                />
                {/* Shoulders / Torso */}
                <path
                    d="M 30 200 L 45 160 Q 100 148 155 160 L 170 200 Z"
                    fill="url(#larryShirt)"
                    stroke="#0f172a"
                    strokeWidth="4"
                    strokeLinejoin="round"
                />

                {/* --- 2. Red Power Tie Blade & Collar Wings --- */}
                {/* Left Collar Wing */}
                <path
                    d="M 65 145 L 94 158 L 82 178 L 56 154 Z"
                    fill="#ffffff"
                    stroke="#0f172a"
                    strokeWidth="3"
                    strokeLinejoin="round"
                />
                {/* Right Collar Wing */}
                <path
                    d="M 135 145 L 106 158 L 118 178 L 144 154 Z"
                    fill="#ffffff"
                    stroke="#0f172a"
                    strokeWidth="3"
                    strokeLinejoin="round"
                />
                {/* Windsor Knot */}
                <path
                    d="M 93 158 L 107 158 L 104 172 L 96 172 Z"
                    fill="url(#larryTie)"
                    stroke="#0f172a"
                    strokeWidth="3"
                    strokeLinejoin="round"
                />
                {/* Main Tie Blade */}
                <path
                    d="M 95 172 L 105 172 L 108 200 L 92 200 Z"
                    fill="url(#larryTie)"
                    stroke="#0f172a"
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                />

                {/* --- 3. Neck & Head (Flesh Golem) --- */}
                {/* Neck */}
                <path
                    d="M 82 120 L 82 152 Q 100 156 118 152 L 118 120 Z"
                    fill="#e5a882"
                    stroke="#0f172a"
                    strokeWidth="3.5"
                />

                {/* Ears */}
                <circle cx="56" cy="104" r="11" fill="#f0bba0" stroke="#0f172a" strokeWidth="3" />
                <circle cx="144" cy="104" r="11" fill="#f0bba0" stroke="#0f172a" strokeWidth="3" />

                {/* Head Silhouette */}
                <path
                    d="M 62 90 C 62 60 76 46 100 46 C 124 46 138 60 138 90 C 138 122 125 140 100 140 C 75 140 62 122 62 90 Z"
                    fill="url(#larrySkin)"
                    stroke="#0f172a"
                    strokeWidth="4"
                    strokeLinejoin="round"
                />

                {/* --- 4. Chestnut Hair (Neat IT Cut) --- */}
                <path
                    d="M 58 84 C 54 52 74 34 100 34 C 126 34 146 52 142 84 C 138 66 128 54 106 52 C 90 50 72 58 58 84 Z"
                    fill="url(#larryHair)"
                    stroke="#0f172a"
                    strokeWidth="3.5"
                />
                {/* Forehead fringe locks */}
                <path
                    d="M 68 56 Q 85 64 96 54 Q 108 66 126 56 Q 134 68 136 78 Q 120 60 102 62 Q 82 62 68 76 Z"
                    fill="#361f14"
                />

                {/* --- 5. Eyebrows --- */}
                {mood === 'concerned' ? (
                    <>
                        <path d="M 74 80 Q 86 74 94 78" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                        <path d="M 106 78 Q 114 74 126 80" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                    </>
                ) : (
                    <>
                        <path d="M 74 76 Q 86 72 94 74" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                        <path d="M 106 74 Q 114 72 126 76" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                    </>
                )}

                {/* --- 6. Eyes with Blinking Visemes --- */}
                {eye === 'open' && (
                    <>
                        {/* Eye whites */}
                        <ellipse cx="83" cy="89" rx="7.5" ry="6.5" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
                        <ellipse cx="117" cy="89" rx="7.5" ry="6.5" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
                        {/* Dark amber irises */}
                        <circle cx="84" cy="89" r="4.2" fill="#0f172a" />
                        <circle cx="118" cy="89" r="4.2" fill="#0f172a" />
                        {/* Specular highlights */}
                        <circle cx="82.5" cy="87.5" r="1.5" fill="#ffffff" />
                        <circle cx="116.5" cy="87.5" r="1.5" fill="#ffffff" />
                    </>
                )}
                {eye === 'half' && (
                    <>
                        <path d="M 76 89 Q 83 94 90 89" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                        <path d="M 110 89 Q 117 94 124 89" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                    </>
                )}
                {eye === 'blink' && (
                    <>
                        <path d="M 76 90 Q 83 91 90 90" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                        <path d="M 110 90 Q 117 91 124 90" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                    </>
                )}

                {/* --- 7. Nose --- */}
                <path d="M 100 87 L 97 104 L 104 104" stroke="#c28464" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

                {/* --- 8. Animated Mouth Visemes --- */}
                {mouth === 'closed' && (
                    <path d="M 91 119 Q 100 120 109 119" stroke="#0f172a" strokeWidth="3.2" strokeLinecap="round" fill="none" />
                )}
                {mouth === 'smirk' && (
                    <path d="M 91 120 Q 100 122 111 115" stroke="#0f172a" strokeWidth="3.2" strokeLinecap="round" fill="none" />
                )}
                {mouth === 'open_small' && (
                    <ellipse cx="100" cy="120" rx="6" ry="4" fill="#641e16" stroke="#0f172a" strokeWidth="2.5" />
                )}
                {mouth === 'open_wide' && (
                    <ellipse cx="100" cy="121" rx="8" ry="7" fill="#641e16" stroke="#0f172a" strokeWidth="2.5" />
                )}
                {mouth === 'o' && (
                    <circle cx="100" cy="120" r="5" fill="#641e16" stroke="#0f172a" strokeWidth="2.5" />
                )}
            </svg>

            {/* Speaking Audio Equalizer Pulse Indicator */}
            {isSpeaking && (
                <div className="absolute bottom-1.5 right-2 flex items-end gap-0.5 h-3">
                    <span className="w-1 bg-cyan-400 rounded-full animate-bounce h-2" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 bg-cyan-400 rounded-full animate-bounce h-3" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 bg-cyan-400 rounded-full animate-bounce h-1.5" style={{ animationDelay: '300ms' }} />
                </div>
            )}
        </div>
    );
};
