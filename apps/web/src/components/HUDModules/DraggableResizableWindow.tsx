import React, { useState, useEffect, useRef } from 'react';

export interface DraggableResizableWindowProps {
    id: string;
    title: string;
    icon?: string;
    defaultPosition?: { x: number; y: number };
    defaultSize?: { width: number; height: number };
    minSize?: { width: number; height: number };
    isOpen: boolean;
    onClose?: () => void;
    children: React.ReactNode;
}

export const DraggableResizableWindow: React.FC<DraggableResizableWindowProps> = ({
    id,
    title,
    icon = '🪟',
    defaultPosition = { x: 40, y: 100 },
    defaultSize = { width: 360, height: 420 },
    minSize = { width: 240, height: 160 },
    isOpen,
    onClose,
    children
}) => {
    const [pos, setPos] = useState<{ x: number; y: number }>(() => {
        try {
            const saved = localStorage.getItem(`myos_win_pos_${id}`);
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return defaultPosition;
    });

    const [size, setSize] = useState<{ width: number; height: number }>(() => {
        try {
            const saved = localStorage.getItem(`myos_win_size_${id}`);
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return defaultSize;
    });

    const [isMinimized, setIsMinimized] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const windowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            localStorage.setItem(`myos_win_pos_${id}`, JSON.stringify(pos));
        } catch (e) {}
    }, [id, pos]);

    useEffect(() => {
        try {
            localStorage.setItem(`myos_win_size_${id}`, JSON.stringify(size));
        } catch (e) {}
    }, [id, size]);

    const handleHeaderMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).tagName === 'BUTTON') return;
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - pos.x,
            y: e.clientY - pos.y
        });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const newX = Math.max(10, Math.min(window.innerWidth - 100, e.clientX - dragOffset.x));
            const newY = Math.max(10, Math.min(window.innerHeight - 60, e.clientY - dragOffset.y));
            setPos({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            if (isDragging) setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    if (!isOpen) return null;

    return (
        <div
            ref={windowRef}
            style={{
                position: 'fixed',
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                width: `${size.width}px`,
                height: isMinimized ? 'auto' : `${size.height}px`,
                minWidth: `${minSize.width}px`,
                minHeight: isMinimized ? 'auto' : `${minSize.height}px`,
                zIndex: 99999,
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
                backdropFilter: 'blur(16px)',
                border: '1.5px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '12px',
                boxShadow: isDragging ? '0 25px 50px rgba(56, 189, 248, 0.4)' : '0 15px 35px rgba(0,0,0,0.7)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                resize: isMinimized ? 'none' : 'both',
                pointerEvents: 'auto',
                transition: isDragging ? 'none' : 'box-shadow 0.2s ease'
            }}
        >
            <div
                onMouseDown={handleHeaderMouseDown}
                style={{
                    padding: '8px 12px',
                    background: isDragging ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.8)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    userSelect: 'none'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '13px', color: '#38bdf8' }}>
                    <span>{icon}</span>
                    <span>{title}</span>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        title={isMinimized ? 'Expand' : 'Minimize'}
                        style={{
                            background: 'rgba(51, 65, 85, 0.8)',
                            color: '#94a3b8',
                            border: 'none',
                            borderRadius: '4px',
                            width: '20px',
                            height: '20px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {isMinimized ? '🗖' : '—'}
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            title="Close Window"
                            style={{
                                background: 'rgba(239, 68, 68, 0.8)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                width: '20px',
                                height: '20px',
                                fontSize: '11px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {!isMinimized && (
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {children}
                </div>
            )}
        </div>
    );
};
