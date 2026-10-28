import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useWorld } from '../../engine/WorldContext';
import { MonsterNPC } from './MonsterController';

import stone1 from '../../assets/lpc/stones (1).png';
import stone2 from '../../assets/lpc/stones (2).png';
import stone3 from '../../assets/lpc/stones (3).png';
import stone4 from '../../assets/lpc/stones (4).png';
import stone5 from '../../assets/lpc/stones (5).png';
import stone6 from '../../assets/lpc/stones (6).png';
import stone7 from '../../assets/lpc/stones (7).png';
import stone8 from '../../assets/lpc/stones (8).png';
import stone9 from '../../assets/lpc/stones (9).png';
import stone10 from '../../assets/lpc/stones (10).png';
import stone11 from '../../assets/lpc/stones (11).png';
import stone12 from '../../assets/lpc/stones (12).png';

export const STONE_ASSETS = [
    stone1, stone2, stone3, stone4, stone5, stone6,
    stone7, stone8, stone9, stone10, stone11, stone12
];

export const TREE_VARIANTS = [
    '/assets/cormanthor_oak_sprite_1775946357555.png',
    '/integrations/Images/Bgs/HDRPanoramas0044_8_350.jpg'
];

// --- LORE REGISTRY ---
export const SHADOWDALE_LANDMARKS = [
    {
        id: 'old_skull_inn',
        name: 'The Old Skull Inn',
        coordinate: 'C3',
        rawPosition: [35, 0, 35] as [number, number, number],
        type: 'hamlet_building',
        scale: 6.5,
        texturePath: '/assets/old_skull_inn_sprite_1775946319244.png'
    },
    {
        id: 'twisted_tower',
        name: 'The Tower of Ashaba',
        coordinate: 'B2',
        rawPosition: [120, 0, 85] as [number, number, number],
        type: 'monument',
        scale: 12.0,
        texturePath: '/assets/twisted_tower_sprite_1775946340954.png'
    }
];

interface WorldSpawnerProps {
    trackPos: { x: number; z: number };
    onSpawn: (props: any[]) => void;
    chunkSize?: number;
    drawDistance?: number;
}

export const WorldSpawner: React.FC<WorldSpawnerProps> = ({
    trackPos, onSpawn, chunkSize = 150, drawDistance = 250
}) => {
    const { persistentProps = [], currentDimension } = useWorld();

    const spawnerLogic = useMemo(() => {
        if (currentDimension === 'white_room') return { props: [], monsters: [] };

        const props: any[] = (currentDimension === 'faerun' || currentDimension?.includes('wilderness'))
            ? [...SHADOWDALE_LANDMARKS]
            : [];

        props.push(...persistentProps);

        const monsters: any[] = [];
        const isDangerous = currentDimension?.includes('wilderness');

        const chunkX = Math.floor(trackPos.x / chunkSize);
        const chunkZ = Math.floor(trackPos.z / chunkSize);

        for (let cx = -1; cx <= 1; cx++) {
            for (let cz = -1; cz <= 1; cz++) {
                const cKey = `${chunkX + cx}_${chunkZ + cz}`;
                const seed = 42 + (chunkX + cx) * 31 + (chunkZ + cz) * 17;

                const random = (s: number) => {
                    const x = Math.sin(s) * 10000;
                    return x - Math.floor(x);
                };

                // Spawn forest & stone elements
                for (let i = 0; i < 12; i++) {
                    const rx = random(seed + i * 2);
                    const rz = random(seed + i * 3);
                    const wx = (chunkX + cx) * chunkSize + (rx * chunkSize);
                    const wz = (chunkZ + cz) * chunkSize + (rz * chunkSize);

                    const dist = Math.sqrt((wx - trackPos.x) ** 2 + (wz - trackPos.z) ** 2);
                    if (dist > drawDistance) continue;
                    if (Math.abs(wx) < 25 && Math.abs(wz) < 25) continue;

                    // Trees
                    props.push({
                        id: `tree_${cKey}_${i}`,
                        name: 'Cormanthor Oak',
                        rawPosition: [wx, 0, wz] as [number, number, number],
                        type: 'tree',
                        scale: 3.5 + random(seed + i) * 3.5,
                        texturePath: '/assets/cormanthor_oak_sprite_1775946357555.png'
                    });

                    // Stones & Boulders Juice
                    const stoneIdx = Math.floor(random(seed + i * 5) * STONE_ASSETS.length);
                    const stoneScale = 1.0 + random(seed + i * 7) * 2.0;
                    props.push({
                        id: `stone_${cKey}_${i}`,
                        name: `Ancient Stone ${stoneIdx + 1}`,
                        rawPosition: [wx + (rx * 12 - 6), 0, wz + (rz * 12 - 6)] as [number, number, number],
                        type: 'prop',
                        geometryType: 'sprite',
                        scale: stoneScale,
                        texturePath: STONE_ASSETS[stoneIdx]
                    });

                    // SPAWN MONSTERS in dangerous chunks
                    if (isDangerous && i < 2) {
                        monsters.push({
                            id: `monster_${cKey}_${i}`,
                            type: i % 2 === 0 ? 'skeleton' : 'wolf',
                            pos: [wx + 5, 0.1, wz + 5],
                            danger: 1
                        });
                    }
                }
            }
        }

        return { props, monsters };
    }, [trackPos.x, trackPos.z, persistentProps, chunkSize, drawDistance, currentDimension]);

    useEffect(() => {
        onSpawn(spawnerLogic.props);
    }, [spawnerLogic.props, onSpawn]);

    return (
        <group name="MONSTER_CONTAINER">
            {spawnerLogic.monsters.map(m => (
                <MonsterNPC 
                    key={m.id} 
                    id={m.id} 
                    type={m.type} 
                    initialPosition={m.pos} 
                    dangerLevel={m.danger}
                    playerPosition={[trackPos.x, 0.1, trackPos.z]}
                />
            ))}
        </group>
    );
};
