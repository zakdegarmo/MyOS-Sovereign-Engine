import React, { useRef, useState } from 'react';

export function AssetPreviewModal({ 
    textureUrl, 
    onApprove, 
    onCancel 
}: { 
    textureUrl: string, 
    onApprove: (url: string) => void, 
    onCancel: () => void 
}) {
    const [finalUrl, setFinalUrl] = useState(textureUrl);
    const [isPixelated, setIsPixelated] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    const applyPixelation = () => {
        if (!canvasRef.current || !imgRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = imgRef.current;
        
        if (!ctx) return;

        // Set dimensions
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        // The factor to scale down by (e.g. 1/4th the size)
        const scaleFactor = 0.20; 
        const scaledW = canvas.width * scaleFactor;
        const scaledH = canvas.height * scaleFactor;

        // Create an offscreen canvas to scale down
        const offscreen = document.createElement('canvas');
        offscreen.width = scaledW;
        offscreen.height = scaledH;
        const oCtx = offscreen.getContext('2d');
        if (!oCtx) return;

        // Scale down
        oCtx.drawImage(img, 0, 0, scaledW, scaledH);

        // Turn off smoothing to get the crisp pixel edges when scaling up
        ctx.imageSmoothingEnabled = false;
        
        // Scale back up to original size
        ctx.drawImage(offscreen, 0, 0, scaledW, scaledH, 0, 0, canvas.width, canvas.height);

        setFinalUrl(canvas.toDataURL('image/png'));
        setIsPixelated(true);
    };

    const resetImage = () => {
        setFinalUrl(textureUrl);
        setIsPixelated(false);
    };

    return (
        <div className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300">
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-lg shadow-2xl max-w-lg w-full flex flex-col items-center gap-6">
                <h2 className="text-xl font-bold text-white tracking-wider flex items-center gap-2">
                    <span className="text-blue-400">✧</span> Asset Preview
                </h2>
                
                {/* Hidden image used as source for the canvas pixelation filter */}
                <img 
                    ref={imgRef} 
                    src={textureUrl} 
                    crossOrigin="anonymous" 
                    className="hidden" 
                    alt="source" 
                />
                
                <div className="bg-slate-800 rounded-md p-4 w-full flex items-center justify-center min-h-[300px] border border-slate-700/50">
                    {isPixelated ? (
                        <canvas ref={canvasRef} className="max-w-full max-h-[300px] object-contain" style={{ imageRendering: 'pixelated' }} />
                    ) : (
                        <img src={finalUrl} className="max-w-full max-h-[300px] object-contain" alt="preview" />
                    )}
                </div>

                <div className="flex gap-4 w-full">
                    {isPixelated ? (
                        <button onClick={resetImage} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors text-sm font-semibold">
                            Undo Pixelation
                        </button>
                    ) : (
                        <button onClick={applyPixelation} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors text-sm font-semibold">
                            Apply 16-bit Filter
                        </button>
                    )}
                </div>

                <div className="flex gap-4 w-full mt-4">
                    <button onClick={onCancel} className="flex-1 px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800 rounded transition-colors font-bold">
                        Reject
                    </button>
                    <button onClick={() => onApprove(finalUrl)} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20 rounded transition-colors font-bold tracking-wide">
                        Approve & Place
                    </button>
                </div>
            </div>
        </div>
    );
}
