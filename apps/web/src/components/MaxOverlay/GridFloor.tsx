import React, { useMemo } from 'react';
import { Text } from '@react-three/drei';
import type { FloorConfig } from './types';

// Original Battleship Grid Logic: 10x10
const GRID_SIZE = 10;

interface GridFloorProps {
    config: FloorConfig;
    showLabels?: boolean;
}

export const GridFloor: React.FC<GridFloorProps> = ({ config, showLabels = true }) => {
    const { width, depth } = config;

    // Cell Dimensions
    const cellWidth = width / GRID_SIZE;
    const cellDepth = depth / GRID_SIZE;

    // Generate Labels (A1, B2 style)
    const labels = useMemo(() => {
        const items = [];
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const label = `${letters[row]}${col + 1}`;

                const x = -width / 2 + (col * cellWidth) + (cellWidth / 2);
                const z = -depth / 2 + (row * cellDepth) + (cellDepth / 2);

                items.push({
                    text: label,
                    position: [x, 0.05, z] as [number, number, number]
                });
            }
        }
        return items;
    }, [width, depth, cellWidth, cellDepth]);

    return (
        <group>
            {/* Battleship Labels */}
            {showLabels && labels.map((label, idx) => (
                <Text
                    key={idx}
                    position={label.position}
                    rotation={[-Math.PI / 2, 0, 0]}
                    fontSize={Math.min(cellWidth, cellDepth) * 0.3}
                    color="rgba(255, 255, 255, 0.3)"
                    anchorX="center"
                    anchorY="middle"
                >
                    {label.text}
                </Text>
            ))}
        </group>
    );
};
