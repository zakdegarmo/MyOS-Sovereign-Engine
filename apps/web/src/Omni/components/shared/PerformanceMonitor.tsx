import React, { useEffect, useState } from 'react';

export const PerformanceMonitor: React.FC = () => {
    const [fps, setFps] = useState(0);

    useEffect(() => {
        let frameCount = 0;
        let lastTime = performance.now();
        let animationFrameId: number;

        const loop = () => {
            const now = performance.now();
            frameCount++;

            if (now - lastTime >= 1000) {
                setFps(Math.round(frameCount * 1000 / (now - lastTime)));
                frameCount = 0;
                lastTime = now;
            }

            animationFrameId = requestAnimationFrame(loop);
        };

        loop();

        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    return (
        <div className="fixed top-2 right-2 z-50 pointer-events-none mix-blend-difference">
            <div className={`text-xs font-mono font-bold ${fps < 30 ? 'text-red-500' : fps < 55 ? 'text-yellow-500' : 'text-green-500'}`}>
                FPS: {fps}
            </div>
        </div>
    );
};
