import React, { useState, useRef } from 'react';
import { DraggableResizableWindow } from './DraggableResizableWindow';

export interface PixelArtInatorHudProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export const PixelArtInatorHud: React.FC<PixelArtInatorHudProps> = ({
    isOpen = true,
    onClose
}) => {
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [processedImage, setProcessedImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [gridSize, setGridSize] = useState<number>(64);
    const [colorCount, setColorCount] = useState<number>(16);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setOriginalImage(url);
            processPixelArt(url, gridSize, colorCount);
        }
    };

    const processPixelArt = (imageSrc: string, targetSize: number, colors: number) => {
        setIsProcessing(true);
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = imageSrc;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            canvas.width = targetSize;
            canvas.height = targetSize;

            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, 0, 0, targetSize, targetSize);

            const imgData = ctx.getImageData(0, 0, targetSize, targetSize);
            const data = imgData.data;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                if (r > 240 && g > 240 && b > 240) {
                    data[i + 3] = 0;
                } else {
                    const factor = 256 / Math.max(2, Math.floor(colors / 2));
                    data[i] = Math.floor(r / factor) * factor;
                    data[i + 1] = Math.floor(g / factor) * factor;
                    data[i + 2] = Math.floor(b / factor) * factor;
                }
            }

            ctx.putImageData(imgData, 0, 0);

            const previewCanvas = document.createElement('canvas');
            previewCanvas.width = 512;
            previewCanvas.height = 512;
            const pCtx = previewCanvas.getContext('2d');
            if (pCtx) {
                pCtx.imageSmoothingEnabled = false;
                pCtx.drawImage(canvas, 0, 0, 512, 512);
                setProcessedImage(previewCanvas.toDataURL('image/png'));
            }

            setIsProcessing(false);
        };
    };

    const handleSettingChange = (newSize: number, newColors: number) => {
        setGridSize(newSize);
        setColorCount(newColors);
        if (originalImage) {
            processPixelArt(originalImage, newSize, newColors);
        }
    };

    const handleExport = () => {
        if (!processedImage) return;
        const link = document.createElement('a');
        link.href = processedImage;
        link.download = `pixel_art_sprite_${gridSize}x${gridSize}.png`;
        link.click();
    };

    return (
        <DraggableResizableWindow
            id="pixel_art_inator_hud"
            title="🎨 Pixel Art -inator"
            icon="🎨"
            defaultPosition={{ x: 60, y: 140 }}
            defaultSize={{ width: 440, height: 480 }}
            minSize={{ width: 360, height: 380 }}
            isOpen={isOpen}
            onClose={onClose}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: '#f8fafc' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            flex: 1,
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '10px 16px',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '13px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        📁 Choose Image File to Pixelate
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />

                    {processedImage && (
                        <button
                            onClick={handleExport}
                            style={{
                                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '10px 16px',
                                color: '#fff',
                                fontWeight: 'bold',
                                fontSize: '13px',
                                cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            💾 Export PNG
                        </button>
                    )}
                </div>

                <div style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', color: '#94a3b8' }}>
                        <span>GRID RESOLUTION:</span>
                        <span style={{ color: '#10b981' }}>{gridSize} x {gridSize} px</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {[32, 64, 128].map(res => (
                            <button
                                key={res}
                                onClick={() => handleSettingChange(res, colorCount)}
                                style={{
                                    flex: 1,
                                    background: gridSize === res ? '#10b981' : '#1e293b',
                                    color: gridSize === res ? '#fff' : '#94a3b8',
                                    border: 'none',
                                    padding: '4px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                {res}x{res}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', marginTop: '4px' }}>
                        <span>PALETTE COLOR DEPTH:</span>
                        <span style={{ color: '#3b82f6' }}>{colorCount} Colors</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {[8, 16, 32].map(c => (
                            <button
                                key={c}
                                onClick={() => handleSettingChange(gridSize, c)}
                                style={{
                                    flex: 1,
                                    background: colorCount === c ? '#3b82f6' : '#1e293b',
                                    color: colorCount === c ? '#fff' : '#94a3b8',
                                    border: 'none',
                                    padding: '4px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                {c} Palette
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '10px',
                    height: '180px',
                    background: '#090d16',
                    borderRadius: '12px',
                    padding: '8px',
                    border: '1px solid rgba(255,255,255,0.08)'
                }}>
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRight: '1px solid rgba(255,255,255,0.1)',
                        paddingRight: '6px',
                        overflow: 'hidden'
                    }}>
                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>ORIGINAL INPUT</span>
                        {originalImage ? (
                            <img src={originalImage} alt="Original" style={{ maxWidth: '100%', maxHeight: '130px', objectFit: 'contain' }} />
                        ) : (
                            <span style={{ fontSize: '11px', color: '#475569' }}>No file selected</span>
                        )}
                    </div>

                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingLeft: '6px',
                        overflow: 'hidden',
                        backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)',
                        backgroundSize: '12px 12px'
                    }}>
                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#10b981', marginBottom: '4px' }}>PIXEL-ART-INATED PNG</span>
                        {isProcessing ? (
                            <span style={{ fontSize: '12px', color: '#10b981' }}>Processing...</span>
                        ) : processedImage ? (
                            <img src={processedImage} alt="Pixelated Output" style={{ maxWidth: '100%', maxHeight: '130px', objectFit: 'contain', imageRendering: 'pixelated' }} />
                        ) : (
                            <span style={{ fontSize: '11px', color: '#475569' }}>Output preview</span>
                        )}
                    </div>
                </div>
            </div>
        </DraggableResizableWindow>
    );
};
