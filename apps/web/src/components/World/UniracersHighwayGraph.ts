// apps/web/src/components/World/UniracersHighwayGraph.ts
import * as THREE from 'three';

export interface JunctionNode {
    t: number;                  // Normalized position on parent branch (0..1)
    targetBranchId: string;     // Branch to switch to
    targetT: number;            // Initial t on target branch
    steerDirection: -1 | 1;     // -1 for left exit, +1 for right exit
    label: string;              // Directional road sign text
    pillarIndex?: number;
}

export interface HighwayBranch {
    id: string;
    name: string;
    type: 'roundabout' | 'spoke' | 'arterial' | 'track';
    pillarIndex: number;
    pillarName: string;
    curve: THREE.CatmullRomCurve3;
    length: number;
    isClosed: boolean;
    isRibbon: boolean;
    roadWidth: number;
    tubeRadius: number;
    junctions: JunctionNode[];
    color: string;
}

export const PILLAR_NAMES = [
    'Self (◉)',
    'Thought (✧)',
    'Logic (∴)',
    'Unity (⚭)',
    'Existence (⬡)',
    'Improvement (⇈)',
    'Mastery (❂)',
    'Resonance (∿)',
    'Transcendence (⍟)',
    'Omniscience (۞)'
];

export const PILLAR_COLORS = [
    '#FF5722', // Self
    '#BA68C8', // Thought
    '#29B6F6', // Logic
    '#66BB6A', // Unity
    '#8D6E63', // Existence
    '#FFA726', // Improvement
    '#FFD700', // Mastery
    '#00E5FF', // Resonance
    '#D500F9', // Transcendence
    '#7C4DFF'  // Omniscience
];

// GTA-Scale Dimensions
export const HUB_RADIUS = 1200;
export const CITY_DISTANCE = 4200;
export const CITY_ARTERIAL_RADIUS = 650;
export const TOWN_TRACK_RADIUS = 260;

export class UniracersHighwayGraph {
    public branches: Map<string, HighwayBranch> = new Map();

    constructor() {
        this.buildCentralRoundabout();
        this.buildSpokesAndCities();
    }

    private buildCentralRoundabout() {
        const points: THREE.Vector3[] = [];
        const numPoints = 32;
        const elev = 45;

        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const x = Math.cos(angle) * HUB_RADIUS;
            const z = Math.sin(angle) * HUB_RADIUS;
            // Subtle super-speed banking wave
            const y = elev + Math.sin(angle * 5) * 8;
            points.push(new THREE.Vector3(x, y, z));
        }

        const curve = new THREE.CatmullRomCurve3(points, true, 'centripetal');
        const length = curve.getLength();

        // 10 Junction Exits to the 10 Spoke Highways (Tangential Slipway Off-Ramps)
        const junctions: JunctionNode[] = [];
        for (let k = 0; k < 10; k++) {
            const angle = (k / 10) * Math.PI * 2;
            const startAngle = (angle - 0.28 + Math.PI * 2) % (Math.PI * 2);
            const junctionT = startAngle / (Math.PI * 2);
            junctions.push({
                t: junctionT,
                targetBranchId: `spoke_${k}`,
                targetT: 0.01,
                steerDirection: 1, // Exit right onto spoke off-ramp
                label: `EXIT ${k + 1}: ${PILLAR_NAMES[k]} OFF-RAMP`,
                pillarIndex: k
            });
        }

        const roundaboutBranch: HighwayBranch = {
            id: 'hub_roundabout',
            name: 'Central Roundabout Hub Highway',
            type: 'roundabout',
            pillarIndex: -1,
            pillarName: 'The Nexus Core',
            curve,
            length,
            isClosed: true,
            isRibbon: true,
            roadWidth: 60,
            tubeRadius: 24,
            junctions,
            color: '#FFE500'
        };

        this.branches.set(roundaboutBranch.id, roundaboutBranch);
    }

    private buildSpokesAndCities() {
        for (let k = 0; k < 10; k++) {
            const angle = (k / 10) * Math.PI * 2;
            const startAngle = angle - 0.28;
            const dirX = Math.cos(angle);
            const dirZ = Math.sin(angle);
            const perpX = -Math.sin(angle);
            const perpZ = Math.cos(angle);

            // --- 1. Radiating Spoke Highway with Smooth Tangential Off-Ramp ---
            const spokePoints: THREE.Vector3[] = [];

            // Tangential Slipway Ramp (5 points peeling smoothly from roundabout perimeter)
            const numRampPoints = 5;
            for (let r = 0; r < numRampPoints; r++) {
                const u = r / (numRampPoints - 1); // 0 to 1
                const curA = startAngle + u * 0.28; // startAngle -> angle
                // Smooth quadratic flare outward from circle (zero radial velocity at start)
                const flareDist = HUB_RADIUS + u * u * 450;
                const rx = Math.cos(curA) * flareDist;
                const rz = Math.sin(curA) * flareDist;
                const ry = 45 + u * 12; // gentle rise
                spokePoints.push(new THREE.Vector3(rx, ry, rz));
            }

            // Remainder of spoke extending out to CITY_DISTANCE (4200)
            const remainingDist = CITY_DISTANCE - (HUB_RADIUS + 450);
            const numSpokeSegments = 10;
            for (let i = 1; i <= numSpokeSegments; i++) {
                const frac = i / numSpokeSegments;
                const dist = (HUB_RADIUS + 450) + frac * remainingDist;

                let y = 57 + frac * 20;
                if (i === 3) y += 85;   // Mega Parabolic Stunt Crest 1
                if (i === 4) y += 15;   // Compression dip
                if (i === 6) y += 110;  // Mega Parabolic Stunt Crest 2
                if (i === 7) y += 10;   // Deep canyon trough
                if (i === 9) y += 50;   // City approach bridge flyover

                // Gentle high-speed lateral S-curve sway
                const lateralSway = Math.sin(frac * Math.PI * 4) * 110;

                const x = dirX * dist + perpX * lateralSway;
                const z = dirZ * dist + perpZ * lateralSway;

                spokePoints.push(new THREE.Vector3(x, y, z));
            }

            const spokeCurve = new THREE.CatmullRomCurve3(spokePoints, false, 'catmullrom');
            const spokeLength = spokeCurve.getLength();

            const spokeJunctions: JunctionNode[] = [
                {
                    t: 0.05,
                    targetBranchId: 'hub_roundabout',
                    targetT: k / 10,
                    steerDirection: -1, // Steer left back onto roundabout
                    label: 'CENTRAL ROUNDABOUT HUB INTERCHANGE',
                    pillarIndex: k
                },
                {
                    t: 0.90,
                    targetBranchId: `arterial_${k}`,
                    targetT: 0.0,
                    steerDirection: 1, // Steer right into city arterial
                    label: `ENTER ${PILLAR_NAMES[k]} ARTERIAL`,
                    pillarIndex: k
                },
                {
                    t: 0.98,
                    targetBranchId: `track_${k}`,
                    targetT: 0.0,
                    steerDirection: -1, // Steer left into town stunt track
                    label: `OFF-RAMP: ${PILLAR_NAMES[k]} STUNT CIRCUIT`,
                    pillarIndex: k
                }
            ];

            const spokeBranch: HighwayBranch = {
                id: `spoke_${k}`,
                name: `${PILLAR_NAMES[k]} Spoke Superhighway`,
                type: 'spoke',
                pillarIndex: k,
                pillarName: PILLAR_NAMES[k],
                curve: spokeCurve,
                length: spokeLength,
                isClosed: false,
                isRibbon: true,
                roadWidth: 50,
                tubeRadius: 22,
                junctions: spokeJunctions,
                color: PILLAR_COLORS[k]
            };

            this.branches.set(spokeBranch.id, spokeBranch);

            // --- 2. City Arterial Loop ---
            const cityCenter = new THREE.Vector3(dirX * CITY_DISTANCE, 70, dirZ * CITY_DISTANCE);
            const arterialPoints: THREE.Vector3[] = [];
            const numArterialPoints = 20;

            for (let i = 0; i < numArterialPoints; i++) {
                const a = (i / numArterialPoints) * Math.PI * 2;
                // Asymmetric cloverleaf loop winding through skyscraper towers
                const r = CITY_ARTERIAL_RADIUS * (1.0 + 0.3 * Math.sin(a * 3));
                const x = cityCenter.x + Math.cos(a) * r;
                const z = cityCenter.z + Math.sin(a) * r;
                const y = cityCenter.y + Math.sin(a * 2) * 50; // Multi-level elevated flyovers
                arterialPoints.push(new THREE.Vector3(x, y, z));
            }

            const arterialCurve = new THREE.CatmullRomCurve3(arterialPoints, true, 'centripetal');
            const arterialLength = arterialCurve.getLength();

            const arterialBranch: HighwayBranch = {
                id: `arterial_${k}`,
                name: `${PILLAR_NAMES[k]} Metropolitan Arterial`,
                type: 'arterial',
                pillarIndex: k,
                pillarName: PILLAR_NAMES[k],
                curve: arterialCurve,
                length: arterialLength,
                isClosed: true,
                isRibbon: true,
                roadWidth: 45,
                tubeRadius: 20,
                junctions: [
                    {
                        t: 0.95,
                        targetBranchId: `spoke_${k}`,
                        targetT: 0.88,
                        steerDirection: -1,
                        label: `HIGHWAY ON-RAMP: RETURN TO SPOKE ${k + 1}`,
                        pillarIndex: k
                    }
                ],
                color: PILLAR_COLORS[k]
            };

            this.branches.set(arterialBranch.id, arterialBranch);

            // --- 3. Town Stunt Track (Classic 1994 Uniracer Tube Circuit) ---
            const trackCenter = new THREE.Vector3(
                dirX * (CITY_DISTANCE + 550) + perpX * 450,
                35,
                dirZ * (CITY_DISTANCE + 550) + perpZ * 450
            );
            const trackPoints: THREE.Vector3[] = [];
            const numTrackPoints = 16;

            for (let i = 0; i < numTrackPoints; i++) {
                const a = (i / numTrackPoints) * Math.PI * 2;
                // Classic undulating racetrack shape with corkscrews
                const r = TOWN_TRACK_RADIUS * (1.0 + 0.25 * Math.cos(a * 2));
                const x = trackCenter.x + Math.cos(a) * r;
                const z = trackCenter.z + Math.sin(a) * r;
                const y = trackCenter.y + (i === 4 ? 65 : i === 12 ? 80 : 0); // Jumps
                trackPoints.push(new THREE.Vector3(x, y, z));
            }

            const trackCurve = new THREE.CatmullRomCurve3(trackPoints, true, 'catmullrom');
            const trackLength = trackCurve.getLength();

            const trackBranch: HighwayBranch = {
                id: `track_${k}`,
                name: `${PILLAR_NAMES[k]} Town Stunt Circuit`,
                type: 'track',
                pillarIndex: k,
                pillarName: PILLAR_NAMES[k],
                curve: trackCurve,
                length: trackLength,
                isClosed: true,
                isRibbon: false, // Authentic 1994 360-degree cylindrical tube!
                roadWidth: 35,
                tubeRadius: 22,
                junctions: [
                    {
                        t: 0.98,
                        targetBranchId: `spoke_${k}`,
                        targetT: 0.95,
                        steerDirection: 1,
                        label: `EXIT STUNT PARK: REJOIN SPOKE ${k + 1}`,
                        pillarIndex: k
                    }
                ],
                color: '#FF1133' // Classic Racing Red / Yellow
            };

            this.branches.set(trackBranch.id, trackBranch);
        }
    }

    public getBranch(id: string): HighwayBranch | undefined {
        return this.branches.get(id);
    }

    public checkJunctionTransfer(
        currentBranchId: string,
        currentT: number,
        steerInput: number // -1 (Left), 0 (Straight), +1 (Right)
    ): { branch: HighwayBranch; targetT: number } | null {
        const current = this.branches.get(currentBranchId);
        if (!current || !current.junctions || current.junctions.length === 0) return null;

        for (const junc of current.junctions) {
            const dist = Math.abs(currentT - junc.t);
            // Within junction transition window (~2% of track length)
            if (dist < 0.035) {
                // If player is steering toward the exit lane
                if ((steerInput < -0.3 && junc.steerDirection === -1) ||
                    (steerInput > 0.3 && junc.steerDirection === 1)) {
                    const targetBranch = this.branches.get(junc.targetBranchId);
                    if (targetBranch) {
                        return { branch: targetBranch, targetT: junc.targetT };
                    }
                }
            }
        }
        return null;
    }
}
