import * as THREE from 'three';

export interface DungeonTileMap {
    name: string;
    width: number;
    height: number;
    tileSize: number; // 3.048m (10ft)
    grid: string[];   // ASCII strings ('W' = Wall, '.' = Floor, 'D' = Door, 'T' = Torch, 'P' = Pillar)
}

export interface ExtrudedDungeonResult {
    wallMesh: THREE.InstancedMesh;
    floorMesh: THREE.Mesh;
    colliders: Set<string>; // 'x_z' coordinate strings
    torches: Array<[number, number, number]>;
    doors: Array<{ x: number; z: number; isOpen: boolean }>;
}

/**
 * BlobberDungeonExtruder: Doom/Wolfenstein 3D Style Tilemap Extruder Engine.
 * Converts 2D grid maps into 3D instanced stone walls, floors, torches, and colliders.
 */
export class BlobberDungeonExtruder {
    public static extrudeMap(
        map: DungeonTileMap,
        wallMaterial: THREE.Material,
        floorMaterial: THREE.Material
    ): ExtrudedDungeonResult {
        const tileSize = map.tileSize || 3.048; // 10 feet
        const wallHeight = 3.65; // 12 feet tall walls
        
        const wallGeo = new THREE.BoxGeometry(tileSize, wallHeight, tileSize);
        const floorGeo = new THREE.PlaneGeometry(map.width * tileSize, map.height * tileSize);
        floorGeo.rotateX(-Math.PI / 2);

        // Count wall tiles to size InstancedMesh
        let wallCount = 0;
        const colliders = new Set<string>();
        const torches: Array<[number, number, number]> = [];
        const doors: Array<{ x: number; z: number; isOpen: boolean }> = [];

        const halfW = (map.width * tileSize) / 2;
        const halfH = (map.height * tileSize) / 2;

        for (let r = 0; r < map.grid.length; r++) {
            const row = map.grid[r];
            for (let c = 0; c < row.length; c++) {
                const char = row[c];
                if (char === 'W' || char === '#') {
                    wallCount++;
                }
            }
        }

        const wallMesh = new THREE.InstancedMesh(wallGeo, wallMaterial, wallCount);
        wallMesh.castShadow = true;
        wallMesh.receiveShadow = true;

        const dummy = new THREE.Object3D();
        let wallIndex = 0;

        for (let r = 0; r < map.grid.length; r++) {
            const row = map.grid[r];
            for (let c = 0; c < row.length; c++) {
                const char = row[c];
                const x = (c * tileSize) - halfW + (tileSize / 2);
                const z = (r * tileSize) - halfH + (tileSize / 2);

                if (char === 'W' || char === '#') {
                    dummy.position.set(x, wallHeight / 2, z);
                    dummy.updateMatrix();
                    wallMesh.setMatrixAt(wallIndex++, dummy.matrix);

                    // Grid cell key for 2D collision lookup (snapped to nearest integer tile)
                    const tileX = Math.floor(x / tileSize);
                    const tileZ = Math.floor(z / tileSize);
                    colliders.add(`${tileX}_${tileZ}`);
                } else if (char === 'T') {
                    torches.push([x, 2.5, z]);
                } else if (char === 'D') {
                    doors.push({ x, z, isOpen: false });
                }
            }
        }

        wallMesh.instanceMatrix.needsUpdate = true;

        const floorMesh = new THREE.Mesh(floorGeo, floorMaterial);
        floorMesh.receiveShadow = true;

        return {
            wallMesh,
            floorMesh,
            colliders,
            torches,
            doors
        };
    }
}
