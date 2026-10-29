import React, { useState, useEffect, useRef } from 'react';

interface ResizableSplitterProps {
    direction: 'horizontal' | 'vertical';
    initialSize: number; // percentage or pixels? simpler to use percentage for responsive
    minSize?: number;
    maxSize?: number;
    onResize?: (newSize: number) => void;
    children: [React.ReactNode, React.ReactNode];
}

const ResizableSplitter: React.FC<ResizableSplitterProps> = ({
    direction,
    initialSize,
    minSize = 10,
    maxSize = 90,
    children
}) => {
    const [size, setSize] = useState(initialSize);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging || !containerRef.current) return;

            const containerRect = containerRef.current.getBoundingClientRect();
            let newSize;

            if (direction === 'horizontal') {
                // Width calculation
                const relativeX = e.clientX - containerRect.left;
                newSize = (relativeX / containerRect.width) * 100;
            } else {
                // Height calculation
                const relativeY = e.clientY - containerRect.top;
                newSize = (relativeY / containerRect.height) * 100;
            }

            // Clamp
            if (newSize < minSize) newSize = minSize;
            if (newSize > maxSize) newSize = maxSize;

            setSize(newSize);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
            document.body.style.userSelect = 'none';
        } else {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, direction, minSize, maxSize]);

    return (
        <div
            ref={containerRef}
            className={`flex h-full w-full overflow-hidden ${direction === 'horizontal' ? 'flex-row' : 'flex-col'}`}
        >
            <div style={{
                [direction === 'horizontal' ? 'width' : 'height']: `${size}%`,
                flexShrink: 0
            }} className="relative overflow-hidden">
                {children[0]}
                {/* Overlay while dragging to prevent iframe/input interference */}
                {isDragging && <div className="absolute inset-0 z-50 bg-transparent" />}
            </div>

            <div
                className={`
                    flex items-center justify-center shrink-0 z-10 transition-colors
                    ${direction === 'horizontal' ? 'w-1 hover:w-2 cursor-col-resize hover:bg-rose-500/50' : 'h-1 hover:h-2 cursor-row-resize hover:bg-rose-500/50'}
                    ${isDragging ? 'bg-rose-500 w-2 h-full' : 'bg-slate-800'}
                `}
                onMouseDown={handleMouseDown}
            >
                <div className={`bg-slate-600 rounded-full ${direction === 'horizontal' ? 'h-8 w-0.5' : 'w-8 h-0.5'}`} />
            </div>

            <div className="flex-1 overflow-hidden relative">
                {children[1]}
                {isDragging && <div className="absolute inset-0 z-50 bg-transparent" />}
            </div>
        </div>
    );
};

export default ResizableSplitter;
