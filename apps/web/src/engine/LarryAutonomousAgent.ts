import * as THREE from 'three';
import { SECTOR_404_MAP, OfficeSectorExtruder, type InteractivePrinter, type InteractiveServer } from './OfficeSectorExtruder';
import { type GuardEntity } from '../store/usePrinterPanicStore';

export interface AutonomousDecision {
    type: 'move' | 'interact' | 'evade';
    targetPos: [number, number, number];
    actionId?: string;
    actionType?: 'service_printer' | 'reboot_server' | 'vending' | 'water_cooler' | 'slick' | 'memo';
    statusText: string;
    targetName: string | null;
    isSprinting: boolean;
}

const CELL_SIZE = 3.0;
const ROWS = SECTOR_404_MAP.length;
const COLS = SECTOR_404_MAP[0].length;
const HALF_W = (COLS * CELL_SIZE) / 2;
const HALF_H = (ROWS * CELL_SIZE) / 2;

// Convert world X, Z to grid Column, Row
export function worldToGrid(wx: number, wz: number): { col: number; row: number } {
    return {
        col: Math.max(0, Math.min(COLS - 1, Math.floor((wx + HALF_W) / CELL_SIZE))),
        row: Math.max(0, Math.min(ROWS - 1, Math.floor((wz + HALF_H) / CELL_SIZE)))
    };
}

// Convert grid Column, Row to world X, Z center
export function gridToWorld(col: number, row: number): { x: number; z: number } {
    return {
        x: (col + 0.5) * CELL_SIZE - HALF_W,
        z: (row + 0.5) * CELL_SIZE - HALF_H
    };
}

// Check if a tile is walkable by Larry's pathfinder
function isWalkableTile(col: number, row: number, allowInteractables = false): boolean {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false;
    const tile = SECTOR_404_MAP[row][col];
    if (tile === '#' || tile === 'G' || tile === 'C' || tile === 'S') return false;
    if (!allowInteractables && (tile === 'P' || tile === 'V' || tile === 'W')) return false;
    return true;
}

// BFS Grid Pathfinder
export function findPath(
    startPos: THREE.Vector3,
    targetPos: THREE.Vector3
): Array<[number, number]> {
    const start = worldToGrid(startPos.x, startPos.z);
    const end = worldToGrid(targetPos.x, targetPos.z);

    if (start.col === end.col && start.row === end.row) {
        return [[targetPos.x, targetPos.z]];
    }

    // Target might be an interactive object tile (e.g. 'P' or 'S') which is impassable itself.
    // Find walkable neighbor closest to start or target.
    let targetCol = end.col;
    let targetRow = end.row;

    if (!isWalkableTile(targetCol, targetRow, false)) {
        const neighbors = [
            { c: end.col + 1, r: end.row },
            { c: end.col - 1, r: end.row },
            { c: end.col, r: end.row + 1 },
            { c: end.col, r: end.row - 1 }
        ].filter(n => isWalkableTile(n.c, n.r, false));

        if (neighbors.length > 0) {
            neighbors.sort((a, b) => {
                const da = Math.hypot(a.c - start.col, a.r - start.row);
                const db = Math.hypot(b.c - start.col, b.r - start.row);
                return da - db;
            });
            targetCol = neighbors[0].c;
            targetRow = neighbors[0].r;
        }
    }

    const queue: Array<{ c: number; r: number; path: Array<[number, number]> }> = [];
    const visited = new Set<string>();

    queue.push({ c: start.col, r: start.row, path: [] });
    visited.add(`${start.col}_${start.row}`);

    const directions = [
        { dc: 0, dr: -1 },
        { dc: 0, dr: 1 },
        { dc: -1, dr: 0 },
        { dc: 1, dr: 0 }
    ];

    while (queue.length > 0) {
        const current = queue.shift()!;

        if (current.c === targetCol && current.r === targetRow) {
            // Reconstructed path to target
            const waypoints: Array<[number, number]> = current.path.map(([c, r]) => {
                const w = gridToWorld(c, r);
                return [w.x, w.z];
            });
            waypoints.push([targetPos.x, targetPos.z]);
            return waypoints;
        }

        for (const dir of directions) {
            const nc = current.c + dir.dc;
            const nr = current.r + dir.dr;
            const key = `${nc}_${nr}`;

            if (!visited.has(key) && isWalkableTile(nc, nr, nc === end.col && nr === end.row)) {
                visited.add(key);
                queue.push({
                    c: nc,
                    r: nr,
                    path: [...current.path, [nc, nr]]
                });
            }
        }
    }

    // Fallback: direct line if path blocked
    return [[targetPos.x, targetPos.z]];
}

// SysAdmin IT Monologue Procedural Knowledge Base
const SYSADMIN_THOUGHTS = {
    printer: [
        "LaserJet 1 is spewing paper jams. Why does anyone print 500-page slide decks?",
        "Replacing the fuser roller before Corporate ICE notices the smell of burning toner.",
        "Error 13.01: Jam in tray 2. Classic Bob Jenkins using 32lb linen cardstock again.",
        "If I clear this duplex jam, the quarterly audit report will finish before lunch.",
        "Thermal fuser is 200°C. Careful with the polyester tie, Larry..."
    ],
    server: [
        "Glitch in Mainframe Blade 3. Time for the universal IT incantation: turning it off and on again.",
        "Packet collisions in the server farm. Corporate ICE doesn't even know what an IP address is.",
        "Rebooting the LDAP core. Don't worry users, your cloud files are safe in memory.",
        "Blade server fan sounds like a jet engine. Reboot sequence initiated."
    ],
    evade: [
        "Corporate Security Guard approaching! Dropping a thermal paper slick on the tile floor!",
        "Security has flashlights out. Keeping my badge lanyard tucked into my shirt...",
        "Deploying classified memo decoy. That'll keep Management distracted for 20 minutes!",
        "Slippery when wet: slick trap deployed. Let's see those oxford shoes handle 40lb coated paper."
    ],
    caffeine: [
        "Cold brew acquired. 140 BPM heart rate unlocked. +50% sprint velocity active.",
        "Espresso shot down the hatch. The entire floor grid is moving in slow motion.",
        "Quantum roast caffeine surge engaged. Let's fix these printers in record time."
    ],
    general: [
        "Sector-404 is holding steady. 5 printers, 3 guards, 1 technician. Easy day at the office.",
        "Just another Tuesday in corporate purgatory. P.A.T.C.H. has my back on the radio.",
        "Quiet footsteps on the low-pile carpet. Keep low, keep moving.",
        "Network latency is dropping. Throughput quota is within reach."
    ]
};

export class LarryAutonomousAgent {
    private static lastThoughtTime = 0;
    private static isQueryingOllama = false;
    private static currentWaypoints: Array<[number, number]> = [];
    private static currentTargetPos: THREE.Vector3 | null = null;
    private static lastTargetId: string | null = null;

    /**
     * Evaluates world state and chooses Larry's next autonomous action
     */
    public static decideNextAction(
        playerPos: THREE.Vector3,
        printers: InteractivePrinter[],
        printerStates: Record<string, boolean>,
        servers: InteractiveServer[],
        serverStates: Record<string, boolean>,
        vendingPos: [number, number, number],
        guards: GuardEntity[],
        thermalSlickCd: number,
        memoCd: number,
        caffeineRemaining: number
    ): AutonomousDecision {
        const pPos = playerPos;

        // 1. Check for immediate guard threat (< 7.5m with alert/investigate status)
        for (const g of guards) {
            const gPos = new THREE.Vector3(...g.position);
            const distToGuard = pPos.distanceTo(gPos);

            if (distToGuard < 7.5 && (g.state === 'alert' || g.state === 'investigating' || g.detectionLevel > 0.4)) {
                // Drop thermal slick trap if available
                if (thermalSlickCd <= 0) {
                    return {
                        type: 'evade',
                        targetPos: [pPos.x, pPos.y, pPos.z],
                        actionType: 'slick',
                        statusText: `⚠️ EVADING: Deploying paper slick against ${g.id}!`,
                        targetName: `Security Guard (${g.id})`,
                        isSprinting: true
                    };
                }

                // Drop memo decoy if available
                if (memoCd <= 0) {
                    return {
                        type: 'evade',
                        targetPos: [pPos.x, pPos.y, pPos.z],
                        actionType: 'memo',
                        statusText: `⚠️ DISTRACTING: Deploying memo decoy against ${g.id}!`,
                        targetName: `Security Guard (${g.id})`,
                        isSprinting: true
                    };
                }

                // Flee in opposite direction
                const fleeDir = new THREE.Vector3().subVectors(pPos, gPos).normalize();
                const fleeTarget = new THREE.Vector3(
                    pPos.x + fleeDir.x * 6.0,
                    0.1,
                    pPos.z + fleeDir.z * 6.0
                );

                return {
                    type: 'move',
                    targetPos: [fleeTarget.x, fleeTarget.y, fleeTarget.z],
                    statusText: `🚨 SPRINT EVASION: Evading ${g.id} pursuit!`,
                    targetName: `Safe Corridor`,
                    isSprinting: true
                };
            }
        }

        // 2. High Priority: Nearest Jammed Printer
        let closestJammedPrinter: InteractivePrinter | null = null;
        let minPrinterDist = 999;

        for (const p of printers) {
            if (printerStates[p.id]) {
                const dist = pPos.distanceTo(new THREE.Vector3(...p.position));
                if (dist < minPrinterDist) {
                    minPrinterDist = dist;
                    closestJammedPrinter = p;
                }
            }
        }

        if (closestJammedPrinter) {
            const pObjPos = new THREE.Vector3(...closestJammedPrinter.position);
            if (minPrinterDist < 2.3) {
                // Within service range!
                return {
                    type: 'interact',
                    targetPos: closestJammedPrinter.position,
                    actionId: closestJammedPrinter.id,
                    actionType: 'service_printer',
                    statusText: `🔧 SERVICING: ${closestJammedPrinter.name} (${closestJammedPrinter.jamCode.split(':')[0]})`,
                    targetName: closestJammedPrinter.name,
                    isSprinting: false
                };
            }

            return {
                type: 'move',
                targetPos: closestJammedPrinter.position,
                actionId: closestJammedPrinter.id,
                statusText: `🏃 NAVIGATING: ${closestJammedPrinter.name} [${Math.round(minPrinterDist)}m]`,
                targetName: closestJammedPrinter.name,
                isSprinting: minPrinterDist > 8.0
            };
        }

        // 3. Medium Priority: Nearest Glitching Server Rack
        let closestGlitchingServer: InteractiveServer | null = null;
        let minServerDist = 999;

        for (const s of servers) {
            if (serverStates[s.id]) {
                const dist = pPos.distanceTo(new THREE.Vector3(...s.position));
                if (dist < minServerDist) {
                    minServerDist = dist;
                    closestGlitchingServer = s;
                }
            }
        }

        if (closestGlitchingServer) {
            if (minServerDist < 2.3) {
                return {
                    type: 'interact',
                    targetPos: closestGlitchingServer.position,
                    actionId: closestGlitchingServer.id,
                    actionType: 'reboot_server',
                    statusText: `⚡ REBOOTING: ${closestGlitchingServer.rackName}`,
                    targetName: closestGlitchingServer.rackName,
                    isSprinting: false
                };
            }

            return {
                type: 'move',
                targetPos: closestGlitchingServer.position,
                actionId: closestGlitchingServer.id,
                statusText: `🏃 NAVIGATING: ${closestGlitchingServer.rackName} [${Math.round(minServerDist)}m]`,
                targetName: closestGlitchingServer.rackName,
                isSprinting: minServerDist > 8.0
            };
        }

        // 4. Low Priority: Grab Cold Brew if caffeine expired and nearby
        const vPosVec = new THREE.Vector3(...vendingPos);
        const distToVending = pPos.distanceTo(vPosVec);
        if (caffeineRemaining <= 0 && distToVending < 15.0) {
            if (distToVending < 2.3) {
                return {
                    type: 'interact',
                    targetPos: vendingPos,
                    actionId: 'vending',
                    actionType: 'vending',
                    statusText: `☕ ACQUIRING: Cold Brew Espresso Boost`,
                    targetName: 'Breakroom Vending',
                    isSprinting: false
                };
            }

            return {
                type: 'move',
                targetPos: vendingPos,
                actionId: 'vending',
                statusText: `🏃 BREAKROOM RUN: Cold Brew [${Math.round(distToVending)}m]`,
                targetName: 'Breakroom Vending',
                isSprinting: false
            };
        }

        // 5. Default: Patrol to center hallway
        const centerHallway: [number, number, number] = [-5.0, 0.1, -7.5];
        return {
            type: 'move',
            targetPos: centerHallway,
            statusText: `👁 PATROL: All devices online. Sweeping corridors.`,
            targetName: 'Central Hallway',
            isSprinting: false
        };
    }

    /**
     * Retrieves the next navigation waypoint along the BFS path towards the target
     */
    public static getNextWaypoint(
        currentPos: THREE.Vector3,
        targetPos: [number, number, number]
    ): THREE.Vector3 {
        const destVec = new THREE.Vector3(...targetPos);

        // If target changed or no waypoints, recalculate
        if (!this.currentTargetPos || destVec.distanceTo(this.currentTargetPos) > 1.5 || this.currentWaypoints.length === 0) {
            this.currentTargetPos = destVec.clone();
            this.currentWaypoints = findPath(currentPos, destVec);
        }

        // If close to current waypoint, advance to next
        if (this.currentWaypoints.length > 0) {
            const nextWp = new THREE.Vector3(this.currentWaypoints[0][0], 0.1, this.currentWaypoints[0][1]);
            if (currentPos.distanceTo(nextWp) < 1.4) {
                this.currentWaypoints.shift();
            }
        }

        if (this.currentWaypoints.length > 0) {
            return new THREE.Vector3(this.currentWaypoints[0][0], 0.1, this.currentWaypoints[0][1]);
        }

        return destVec;
    }

    /**
     * Async query to local Ollama model (gemma4 on localhost:11434)
     * Falls back immediately to procedural sysadmin humor if offline or delayed (>2s)
     */
    public static async fetchInternalMonologue(
        category: 'printer' | 'server' | 'evade' | 'caffeine' | 'general'
    ): Promise<string> {
        const now = Date.now();
        if (now - this.lastThoughtTime < 14000 || this.isQueryingOllama) {
            // Pick random procedural thought from category
            const pool = SYSADMIN_THOUGHTS[category] || SYSADMIN_THOUGHTS.general;
            return pool[Math.floor(Math.random() * pool.length)];
        }

        this.lastThoughtTime = now;
        this.isQueryingOllama = true;

        const fallback = () => {
            const pool = SYSADMIN_THOUGHTS[category] || SYSADMIN_THOUGHTS.general;
            return pool[Math.floor(Math.random() * pool.length)];
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2200);

            const prompt = `Give a single concise, humorous, gritty 1-sentence IT sysadmin internal thought for Larry, a flesh golem technician in a 1990s corporate office fixing printers and dodging security guards. Topic: ${category}. Max 20 words.`;

            const res = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    model: 'gemma4:26b',
                    prompt,
                    stream: false,
                    options: {
                        temperature: 0.8,
                        num_predict: 40
                    }
                })
            });

            clearTimeout(timeoutId);
            this.isQueryingOllama = false;

            if (res.ok) {
                const data = await res.json();
                const thought = data.response?.trim()?.replace(/^["']|["']$/g, '');
                if (thought && thought.length > 5) {
                    return thought;
                }
            }
            return fallback();
        } catch (e) {
            this.isQueryingOllama = false;
            return fallback();
        }
    }
}
