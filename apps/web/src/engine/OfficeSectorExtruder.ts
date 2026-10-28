import * as THREE from 'three';

export interface OfficeTile {
    x: number;
    z: number;
    type: 'empty' | 'wall' | 'cubicle' | 'server' | 'printer' | 'vending' | 'water_cooler' | 'glass';
}

export interface InteractivePrinter {
    id: string;
    position: [number, number, number];
    isJammed: boolean;
    name: string;
    jamCode: string;
}

export interface InteractiveServer {
    id: string;
    position: [number, number, number];
    isGlitching: boolean;
    rackName: string;
}

export interface GuardPatrolRoute {
    id: string;
    waypoints: Array<[number, number, number]>;
}

export interface ExtrudedOfficeResult {
    wallMesh: THREE.InstancedMesh;
    cubicleMesh: THREE.InstancedMesh;
    deskMesh: THREE.InstancedMesh;
    serverMesh: THREE.InstancedMesh;
    floorMesh: THREE.Mesh;
    colliders: Set<string>; // 'x_z' coordinate strings
    printers: InteractivePrinter[];
    servers: InteractiveServer[];
    vendingPos: [number, number, number];
    waterCoolerPos: [number, number, number];
    playerSpawn: [number, number, number];
    guardRoutes: GuardPatrolRoute[];
    lights: Array<{ position: [number, number, number]; color: string; intensity: number }>;
}

/**
 * 30x36 Curated Corporate Grid Layout for Sector-404
 * Legend:
 * '#' = Solid Drywall Perimeter & Corridors
 * 'G' = Glass Partition
 * 'C' = Cubicle Divider & Desk
 * 'S' = Server Tower Cabinet
 * 'P' = Multifunction Industrial Printer
 * 'V' = Vending Machine
 * 'W' = Water Cooler
 * ' ' = Open Walkway / Low-pile Carpet
 * '@' = Player Start Spawn
 * '1', '2', '3' = Guard Patrol Waypoints
 */
export const SECTOR_404_MAP: string[] = [
    "####################################",
    "#SSSS  SSSS#        #C C  C C#    P#",
    "#SSSS  SSSS#        #C C  C C#     #",
    "#             1     #        #     #",
    "#SSSS  SSSS#        #C C  C C#     #",
    "#SSSS  SSSS#        #C C  C C#     #",
    "#####  ################  ###########",
    "#                 #        #       #",
    "#  @                2        P     #",
    "#                 #        #       #",
    "#####  ############        #########",
    "#        #      #C C  C C#   S S   #",
    "#   V    #      #C C  C C#   S S   #",
    "#               #        #         #",
    "#   W        3  #C C  C C#   S S   #",
    "#        #      #C C  C C#   S S   #",
    "#####  ##########        ###########",
    "#          #   1    #C C  C C#     #",
    "#   P               #C C  C C#     #",
    "#          #        #        #   P #",
    "#          #        #C C  C C#     #",
    "####################################"
];

export class OfficeSectorExtruder {
    public static isBlocked(worldX: number, worldZ: number, radius: number = 0.4): boolean {
        const cellSize = 3.0;
        const rows = SECTOR_404_MAP.length;
        const cols = SECTOR_404_MAP[0].length;
        const halfW = (cols * cellSize) / 2;
        const halfH = (rows * cellSize) / 2;

        const checkPoint = (px: number, pz: number): boolean => {
            const c = Math.floor((px + halfW) / cellSize);
            const r = Math.floor((pz + halfH) / cellSize);
            if (c < 0 || c >= cols || r < 0 || r >= rows) return true;
            const tile = SECTOR_404_MAP[r][c];
            return tile === '#' || tile === 'G' || tile === 'C' || tile === 'S' || tile === 'P' || tile === 'V' || tile === 'W';
        };

        if (checkPoint(worldX, worldZ)) return true;
        if (radius > 0) {
            if (checkPoint(worldX + radius, worldZ)) return true;
            if (checkPoint(worldX - radius, worldZ)) return true;
            if (checkPoint(worldX, worldZ + radius)) return true;
            if (checkPoint(worldX, worldZ - radius)) return true;
            const diag = radius * 0.7071;
            if (checkPoint(worldX + diag, worldZ + diag)) return true;
            if (checkPoint(worldX - diag, worldZ + diag)) return true;
            if (checkPoint(worldX + diag, worldZ - diag)) return true;
            if (checkPoint(worldX - diag, worldZ - diag)) return true;
        }
        return false;
    }

    public static hasLineOfSight(x1: number, z1: number, x2: number, z2: number, stepSize: number = 0.5): boolean {
        const dx = x2 - x1;
        const dz = z2 - z1;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.1) return true;

        const steps = Math.ceil(dist / stepSize);
        const invSteps = 1 / steps;
        for (let i = 1; i < steps; i++) {
            const t = i * invSteps;
            const px = x1 + dx * t;
            const pz = z1 + dz * t;
            if (OfficeSectorExtruder.isBlocked(px, pz, 0.15)) {
                return false; // Obstacle blocks line of sight
            }
        }
        return true;
    }

    public static extrudeMap(): ExtrudedOfficeResult {
        const cellSize = 3.0; // 3 meters per grid cell
        const wallHeight = 2.4; // 2.4 meters tall drywall (unobstructed top-down view)
        const cubicleHeight = 1.1; // 1.1 meters tall cubicle divider (desks & monitors visible)
        const serverHeight = 2.4; // 2.4 meters tall server rack

        const rows = SECTOR_404_MAP.length;
        const cols = SECTOR_404_MAP[0].length;
        const halfW = (cols * cellSize) / 2;
        const halfH = (rows * cellSize) / 2;

        let wallCount = 0;
        let cubicleCount = 0;
        let serverCount = 0;
        let deskCount = 0;

        const colliders = new Set<string>();
        const printers: InteractivePrinter[] = [];
        const servers: InteractiveServer[] = [];
        const lights: Array<{ position: [number, number, number]; color: string; intensity: number }> = [];

        let playerSpawn: [number, number, number] = [0, 0.1, 0];
        let vendingPos: [number, number, number] = [-15, 0, 10];
        let waterCoolerPos: [number, number, number] = [-15, 0, 14];

        const waypoints1: Array<[number, number, number]> = [];
        const waypoints2: Array<[number, number, number]> = [];
        const waypoints3: Array<[number, number, number]> = [];

        // Pre-count instances
        for (let r = 0; r < rows; r++) {
            const row = SECTOR_404_MAP[r];
            for (let c = 0; c < cols; c++) {
                const char = row[c];
                if (char === '#') wallCount++;
                if (char === 'C') {
                    cubicleCount++;
                    deskCount++;
                }
                if (char === 'S') serverCount++;
            }
        }

        // --- Instanced Geometries ---
        const wallGeo = new THREE.BoxGeometry(cellSize, wallHeight, cellSize);
        const cubicleGeo = new THREE.BoxGeometry(cellSize * 0.95, cubicleHeight, 0.15);
        const deskGeo = new THREE.BoxGeometry(cellSize * 0.85, 0.75, cellSize * 0.6);
        const serverGeo = new THREE.BoxGeometry(cellSize * 0.8, serverHeight, cellSize * 0.8);

        // --- Stylized PBR Office Materials (Crisp Modern Aesthetic) ---
        const wallMat = new THREE.MeshStandardMaterial({
            color: '#cbd5e1',
            roughness: 0.75,
            metalness: 0.1
        });

        const cubicleMat = new THREE.MeshStandardMaterial({
            color: '#475569',
            roughness: 0.95,
            metalness: 0.05
        });

        const deskMat = new THREE.MeshStandardMaterial({
            color: '#e2e8f0',
            roughness: 0.4,
            metalness: 0.1
        });

        const serverMat = new THREE.MeshStandardMaterial({
            color: '#0f172a',
            roughness: 0.25,
            metalness: 0.85,
            emissive: '#0284c7',
            emissiveIntensity: 0.5
        });

        const wallMesh = new THREE.InstancedMesh(wallGeo, wallMat, wallCount);
        const cubicleMesh = new THREE.InstancedMesh(cubicleGeo, cubicleMat, cubicleCount);
        const deskMesh = new THREE.InstancedMesh(deskGeo, deskMat, deskCount);
        const serverMesh = new THREE.InstancedMesh(serverGeo, serverMat, serverCount);

        wallMesh.castShadow = true;
        wallMesh.receiveShadow = true;
        cubicleMesh.castShadow = true;
        cubicleMesh.receiveShadow = true;
        deskMesh.castShadow = true;
        deskMesh.receiveShadow = true;
        serverMesh.castShadow = true;
        serverMesh.receiveShadow = true;

        const dummy = new THREE.Object3D();
        let wallIdx = 0;
        let cubicleIdx = 0;
        let deskIdx = 0;
        let serverIdx = 0;
        let printerIdx = 1;
        let serverNodeIdx = 1;

        for (let r = 0; r < rows; r++) {
            const row = SECTOR_404_MAP[r];
            for (let c = 0; c < cols; c++) {
                const char = row[c];
                const x = (c * cellSize) - halfW + (cellSize / 2);
                const z = (r * cellSize) - halfH + (cellSize / 2);

                const tileX = Math.round(x / cellSize);
                const tileZ = Math.round(z / cellSize);

                if (char === '#') {
                    dummy.position.set(x, wallHeight / 2, z);
                    dummy.scale.set(1, 1, 1);
                    dummy.rotation.set(0, 0, 0);
                    dummy.updateMatrix();
                    wallMesh.setMatrixAt(wallIdx++, dummy.matrix);
                    colliders.add(`${tileX}_${tileZ}`);
                } else if (char === 'C') {
                    // Cubicle acoustic partition
                    dummy.position.set(x, cubicleHeight / 2, z - (cellSize * 0.35));
                    dummy.scale.set(1, 1, 1);
                    dummy.rotation.set(0, 0, 0);
                    dummy.updateMatrix();
                    cubicleMesh.setMatrixAt(cubicleIdx++, dummy.matrix);

                    // Desk surface
                    dummy.position.set(x, 0.75 / 2, z);
                    dummy.updateMatrix();
                    deskMesh.setMatrixAt(deskIdx++, dummy.matrix);
                    colliders.add(`${tileX}_${tileZ}`);
                } else if (char === 'S') {
                    dummy.position.set(x, serverHeight / 2, z);
                    dummy.scale.set(1, 1, 1);
                    dummy.rotation.set(0, 0, 0);
                    dummy.updateMatrix();
                    serverMesh.setMatrixAt(serverIdx++, dummy.matrix);
                    colliders.add(`${tileX}_${tileZ}`);

                    if (serverNodeIdx <= 4) {
                        servers.push({
                            id: `server_${serverNodeIdx}`,
                            position: [x, 0, z],
                            isGlitching: serverNodeIdx % 2 === 1,
                            rackName: `RACK-SYS-0${serverNodeIdx}`
                        });
                        serverNodeIdx++;
                    }
                } else if (char === 'P') {
                    printers.push({
                        id: `printer_${printerIdx}`,
                        position: [x, 0, z],
                        isJammed: true,
                        name: `LaserJet Pro-X${printerIdx}`,
                        jamCode: printerIdx === 1 ? 'JAM 0x88F: ROLLER DESYNC' : printerIdx === 2 ? 'JAM 0xDE4D: BUFFER OVERFLOW' : 'JAM 0xCF1: CYAN HYSTERIA'
                    });
                    colliders.add(`${tileX}_${tileZ}`);
                    printerIdx++;
                } else if (char === '@') {
                    playerSpawn = [x, 0.1, z];
                } else if (char === 'V') {
                    vendingPos = [x, 0, z];
                    colliders.add(`${tileX}_${tileZ}`);
                } else if (char === 'W') {
                    waterCoolerPos = [x, 0, z];
                    colliders.add(`${tileX}_${tileZ}`);
                } else if (char === '1') {
                    waypoints1.push([x, 0.1, z]);
                } else if (char === '2') {
                    waypoints2.push([x, 0.1, z]);
                } else if (char === '3') {
                    waypoints3.push([x, 0.1, z]);
                }

                // Add fluorescent overhead ceiling troffer lights on selected intersections
                if (r % 5 === 2 && c % 6 === 3) {
                    lights.push({
                        position: [x, 3.2, z],
                        color: char === 'S' ? '#38bdf8' : '#e0f2fe',
                        intensity: char === 'S' ? 4.0 : 2.5
                    });
                }
            }
        }

        wallMesh.instanceMatrix.needsUpdate = true;
        cubicleMesh.instanceMatrix.needsUpdate = true;
        deskMesh.instanceMatrix.needsUpdate = true;
        serverMesh.instanceMatrix.needsUpdate = true;

        // --- Carpet Floor Geometry ---
        const floorGeo = new THREE.PlaneGeometry(cols * cellSize, rows * cellSize);
        floorGeo.rotateX(-Math.PI / 2);
        const floorMat = new THREE.MeshStandardMaterial({
            color: '#1e293b',
            roughness: 0.85,
            metalness: 0.1
        });
        const floorMesh = new THREE.Mesh(floorGeo, floorMat);
        floorMesh.position.set(0, 0.02, 0); // Elevated 2cm to prevent z-fighting with world floor
        floorMesh.receiveShadow = true;

        // Guard routes
        const guardRoutes: GuardPatrolRoute[] = [
            {
                id: 'guard_alpha',
                waypoints: [
                    [-18, 0.1, -15],
                    [-4, 0.1, -15],
                    [14, 0.1, -15],
                    [32, 0.1, -15],
                    [14, 0.1, -15],
                    [-4, 0.1, -15]
                ]
            },
            {
                id: 'guard_bravo',
                waypoints: [
                    [10, 0.1, -6],
                    [10, 0.1, 8],
                    [30, 0.1, 8],
                    [30, 0.1, 20],
                    [10, 0.1, 20],
                    [10, 0.1, -6]
                ]
            },
            {
                id: 'guard_charlie',
                waypoints: [
                    [-25, 0.1, 12],
                    [-10, 0.1, 12],
                    [-10, 0.1, 22],
                    [-25, 0.1, 22]
                ]
            }
        ];

        return {
            wallMesh,
            cubicleMesh,
            deskMesh,
            serverMesh,
            floorMesh,
            colliders,
            printers,
            servers,
            vendingPos,
            waterCoolerPos,
            playerSpawn,
            guardRoutes,
            lights
        };
    }
}
