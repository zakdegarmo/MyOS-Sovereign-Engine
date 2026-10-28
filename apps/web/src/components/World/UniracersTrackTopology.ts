// apps/web/src/components/World/UniracersTrackTopology.ts
import * as THREE from 'three';

export interface FrenetFrame {
    tangent: THREE.Vector3;
    normal: THREE.Vector3;
    binormal: THREE.Vector3;
}

export interface BellEndConfig {
    startT: number;
    endT: number;
    baseRadius: number;
    flaredRadius: number;
    isIngress?: boolean; // True if opening up into junction
}

export interface CrossSectionParams {
    t: number;
    u: number; // 0..1 around the track circumference / width
    lambda: number; // 0 = Pure Tube, 1 = Pure Planar Ribbon
    tubeRadius: number;
    ribbonWidth: number;
    ribbonThickness?: number;
}

/**
 * Quintic smoothstep for C^2 continuous differential curvature
 */
export function quinticSmoothstep(t: number): number {
    const x = Math.max(0, Math.min(1, t));
    return x * x * x * (x * (x * 6 - 15) + 10);
}

/**
 * Calculates local flared radius for a Bell-End Manifold transition
 */
export function calculateBellEndRadius(
    t: number,
    baseRadius: number,
    bellConfigs: BellEndConfig[] = []
): number {
    for (const bell of bellConfigs) {
        if (t >= bell.startT && t <= bell.endT) {
            const span = bell.endT - bell.startT;
            const progress = span > 0 ? (t - bell.startT) / span : 0;
            const factor = bell.isIngress 
                ? quinticSmoothstep(progress) 
                : 1 - quinticSmoothstep(progress);
            return baseRadius + (bell.flaredRadius - baseRadius) * factor;
        }
    }
    return baseRadius;
}

/**
 * Evaluates 3D surface point blending from a cylindrical tube into a planar multi-lane ribbon
 */
export function evaluateBlendedCrossSection(
    centerPoint: THREE.Vector3,
    frame: FrenetFrame,
    params: CrossSectionParams
): THREE.Vector3 {
    const { u, lambda, tubeRadius, ribbonWidth, ribbonThickness = 2.0 } = params;
    const { normal, binormal } = frame;

    // 1. Cylindrical Profile (Tube: u in 0..1 maps to 0..2PI)
    const angle = u * Math.PI * 2;
    const tubeOffset = normal.clone().multiplyScalar(Math.cos(angle) * tubeRadius)
        .add(binormal.clone().multiplyScalar(Math.sin(angle) * tubeRadius));

    // 2. Planar Ribbon Profile (Flat Highway Deck: u in 0..1 maps to lateral -W/2 .. +W/2)
    const lateralOffset = (u - 0.5) * ribbonWidth;
    // Add subtle raised curb on outer edges
    const isEdge = u < 0.08 || u > 0.92;
    const verticalElevation = isEdge ? ribbonThickness * 1.5 : 0;
    const ribbonOffset = binormal.clone().multiplyScalar(lateralOffset)
        .add(normal.clone().multiplyScalar(verticalElevation));

    // 3. Smooth Topological Blend
    const blendedOffset = tubeOffset.clone().lerp(ribbonOffset, lambda);
    return centerPoint.clone().add(blendedOffset);
}

/**
 * Computes robust Frenet-Serret frames along a CatmullRomCurve3 using parallel transport
 */
export function computeRobustFrenetFrames(
    curve: THREE.CatmullRomCurve3,
    segments: number
): { tangents: THREE.Vector3[]; normals: THREE.Vector3[]; binormals: THREE.Vector3[] } {
    const tangents: THREE.Vector3[] = [];
    const normals: THREE.Vector3[] = [];
    const binormals: THREE.Vector3[] = [];

    // Sample tangents
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        tangents.push(curve.getTangentAt(t).normalize());
    }

    // Initial normal reference
    let initialNormal = new THREE.Vector3(0, 1, 0);
    if (Math.abs(tangents[0].dot(initialNormal)) > 0.9) {
        initialNormal = new THREE.Vector3(1, 0, 0);
    }
    const initialBinormal = new THREE.Vector3().crossVectors(tangents[0], initialNormal).normalize();
    initialNormal.crossVectors(initialBinormal, tangents[0]).normalize();

    normals.push(initialNormal);
    binormals.push(initialBinormal);

    // Parallel transport along the curve to prevent unwanted twisting
    for (let i = 1; i <= segments; i++) {
        const prevT = tangents[i - 1];
        const curT = tangents[i];
        let curN = normals[i - 1].clone();

        const crossVec = new THREE.Vector3().crossVectors(prevT, curT);
        if (crossVec.length() > 1e-6) {
            const angle = Math.acos(Math.max(-1, Math.min(1, prevT.dot(curT))));
            curN.applyAxisAngle(crossVec.normalize(), angle);
        }

        const curB = new THREE.Vector3().crossVectors(curT, curN).normalize();
        curN.crossVectors(curB, curT).normalize();

        normals.push(curN);
        binormals.push(curB);
    }

    return { tangents, normals, binormals };
}

/**
 * Generates physical Multi-Lane Ribbon Highway Geometry
 * Includes road deck, painted lane dividers, and glowing neon curbs
 */
export function createHighwayRibbonGeometry(
    curve: THREE.CatmullRomCurve3,
    segments: number = 600,
    roadWidth: number = 55,
    roadThickness: number = 3.0
): THREE.BufferGeometry {
    const { tangents, normals, binormals } = computeRobustFrenetFrames(curve, segments);
    const radialPoints = 8; // Cross-section vertices across width
    const totalVertices = (segments + 1) * radialPoints;
    const totalFaces = segments * (radialPoints - 1) * 2;

    const positions = new Float32Array(totalVertices * 3);
    const uvs = new Float32Array(totalVertices * 2);
    const normalsArr = new Float32Array(totalVertices * 3);
    const colors = new Float32Array(totalVertices * 3);
    const indices = new Uint32Array(totalFaces * 3);

    const curbCyan = new THREE.Color('#00E5FF');
    const roadDark = new THREE.Color('#1c2333');
    const roadShoulder = new THREE.Color('#28334a');
    const stripeYellow = new THREE.Color('#FFE500');
    const stripeWhite = new THREE.Color('#FFFFFF');

    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const center = curve.getPointAt(t);
        const norm = normals[i];
        const binorm = binormals[i];
        const isDashed = Math.floor(t * (curve.getLength() / 25)) % 2 === 0;

        for (let j = 0; j < radialPoints; j++) {
            const u = j / (radialPoints - 1);
            const lateralOffset = (u - 0.5) * roadWidth;
            const isCurb = j === 0 || j === radialPoints - 1;
            const heightOffset = isCurb ? roadThickness * 1.5 : 0;

            const pos = center.clone()
                .add(binorm.clone().multiplyScalar(lateralOffset))
                .add(norm.clone().multiplyScalar(heightOffset));

            const idx = (i * radialPoints + j) * 3;
            positions[idx] = pos.x;
            positions[idx + 1] = pos.y;
            positions[idx + 2] = pos.z;

            const uvIdx = (i * radialPoints + j) * 2;
            uvs[uvIdx] = u;
            uvs[uvIdx + 1] = t * (curve.getLength() / 30); // Repeats every 30 units

            normalsArr[idx] = norm.x;
            normalsArr[idx + 1] = norm.y;
            normalsArr[idx + 2] = norm.z;

            // Authentic Highway Neon Striping
            let col = roadDark;
            if (isCurb) {
                col = curbCyan;
            } else if (j === 1 || j === radialPoints - 2) {
                col = roadShoulder;
            } else if ((j === 3 || j === 4) && isDashed) {
                col = stripeYellow;
            } else if ((j === 2 || j === 5) && !isDashed) {
                col = stripeWhite;
            }

            colors[idx] = col.r;
            colors[idx + 1] = col.g;
            colors[idx + 2] = col.b;
        }
    }

    let faceIdx = 0;
    for (let i = 0; i < segments; i++) {
        for (let j = 0; j < radialPoints - 1; j++) {
            const a = i * radialPoints + j;
            const b = (i + 1) * radialPoints + j;
            const c = (i + 1) * radialPoints + (j + 1);
            const d = i * radialPoints + (j + 1);

            indices[faceIdx++] = a;
            indices[faceIdx++] = b;
            indices[faceIdx++] = d;

            indices[faceIdx++] = b;
            indices[faceIdx++] = c;
            indices[faceIdx++] = d;
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normalsArr, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();

    return geometry;
}

/**
 * Generates 1994 authentic Bell-End Tube Track Geometry
 * Supports slice intervals (startT..endT), flared trumpet openings, and alternating red/yellow color bands
 */
export function createBellEndTubeGeometry(
    curve: THREE.CatmullRomCurve3,
    segments: number = 500,
    radialSegments: number = 24,
    baseRadius: number = 24,
    bellConfigs: BellEndConfig[] = [],
    startT: number = 0.0,
    endT: number = 1.0
): THREE.BufferGeometry {
    const { tangents, normals, binormals } = computeRobustFrenetFrames(curve, segments);
    const totalVertices = (segments + 1) * (radialSegments + 1);
    const totalFaces = segments * radialSegments * 2;

    const positions = new Float32Array(totalVertices * 3);
    const uvs = new Float32Array(totalVertices * 2);
    const colors = new Float32Array(totalVertices * 3);
    const indices = new Uint32Array(totalFaces * 3);

    const yellow = new THREE.Color('#FFE500');
    const red = new THREE.Color('#FF1133');
    const white = new THREE.Color('#FFFFFF');
    const groove = new THREE.Color('#1A1A1A');

    for (let i = 0; i <= segments; i++) {
        const frac = i / segments;
        const t = startT + frac * (endT - startT);
        const center = curve.getPointAt(Math.max(0, Math.min(1, t)));
        const norm = normals[Math.floor(t * segments)] || normals[i];
        const binorm = binormals[Math.floor(t * segments)] || binormals[i];
        const radius = calculateBellEndRadius(t, baseRadius, bellConfigs);

        // Alternating 1994 color bands along tube length
        const bandIndex = Math.floor(t * (curve.getLength() / 40)) % 2;
        const baseColor = bandIndex === 0 ? yellow : red;

        for (let j = 0; j <= radialSegments; j++) {
            const u = j / radialSegments;
            const theta = u * Math.PI * 2;
            const cos = Math.cos(theta);
            const sin = Math.sin(theta);

            const pos = center.clone()
                .add(norm.clone().multiplyScalar(cos * radius))
                .add(binorm.clone().multiplyScalar(sin * radius));

            const idx = (i * (radialSegments + 1) + j) * 3;
            positions[idx] = pos.x;
            positions[idx + 1] = pos.y;
            positions[idx + 2] = pos.z;

            const uvIdx = (i * (radialSegments + 1) + j) * 2;
            uvs[uvIdx] = u;
            uvs[uvIdx + 1] = t * (curve.getLength() / 30);

            // Paint groove and centerline into vertex colors
            let vertColor = baseColor.clone();
            const angleDist = Math.abs(cos - 1.0); // Near top (theta ~ 0)
            if (angleDist < 0.05) {
                // Centerline guideline
                vertColor = white;
            } else if (j === 0 || j === radialSegments / 2 || j === radialSegments) {
                // Lateral boundary grooves
                vertColor = groove;
            }

            colors[idx] = vertColor.r;
            colors[idx + 1] = vertColor.g;
            colors[idx + 2] = vertColor.b;
        }
    }

    let faceIdx = 0;
    for (let i = 0; i < segments; i++) {
        for (let j = 0; j < radialSegments; j++) {
            const a = i * (radialSegments + 1) + j;
            const b = (i + 1) * (radialSegments + 1) + j;
            const c = (i + 1) * (radialSegments + 1) + (j + 1);
            const d = i * (radialSegments + 1) + (j + 1);

            indices[faceIdx++] = a;
            indices[faceIdx++] = b;
            indices[faceIdx++] = d;

            indices[faceIdx++] = b;
            indices[faceIdx++] = c;
            indices[faceIdx++] = d;
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();

    return geometry;
}

export interface SplitRibbonConfig {
    startT: number;
    endT: number;
    ribbonWidth?: number;
    baseSpread?: number;
    maxDivergence?: number;
    maxElevation?: number;
}

/**
 * Generates TWO SEPARATE physical ribbon tracks:
 * - Left Stunt Ribbon (Cyan neon curbs, elevated parabolic arc)
 * - Right Speed Ribbon (Amber neon curbs, low ground-hugging trough)
 * Emerging from a Flared Bell-End and converging into a Reverse Bell-End Funnel
 */
export function createSplitRibbonPairGeometries(
    curve: THREE.CatmullRomCurve3,
    segments: number = 300,
    config: SplitRibbonConfig
): { leftGeometry: THREE.BufferGeometry; rightGeometry: THREE.BufferGeometry } {
    const {
        startT,
        endT,
        ribbonWidth = 24,
        baseSpread = 22,
        maxDivergence = 34,
        maxElevation = 28
    } = config;

    const radialPoints = 8;
    const totalVertices = (segments + 1) * radialPoints;
    const totalFaces = segments * (radialPoints - 1) * 2;

    function buildSingleRibbon(isLeft: boolean): THREE.BufferGeometry {
        const positions = new Float32Array(totalVertices * 3);
        const uvs = new Float32Array(totalVertices * 2);
        const normalsArr = new Float32Array(totalVertices * 3);
        const colors = new Float32Array(totalVertices * 3);
        const indices = new Uint32Array(totalFaces * 3);

        const curbColor = isLeft ? new THREE.Color('#00F0FF') : new THREE.Color('#FF9900');
        const roadDark = new THREE.Color('#1a2130');
        const roadShoulder = new THREE.Color('#253046');
        const stripeColor = isLeft ? new THREE.Color('#FFE500') : new THREE.Color('#FFFFFF');

        for (let i = 0; i <= segments; i++) {
            const frac = i / segments;
            const t = startT + frac * (endT - startT);
            const center = curve.getPointAt(Math.max(0, Math.min(1, t)));
            const tangent = curve.getTangentAt(Math.max(0, Math.min(1, t))).normalize();
            
            // Generate robust normal/binormal perpendicular to tangent
            let norm = new THREE.Vector3(0, 1, 0);
            if (Math.abs(tangent.y) > 0.95) norm = new THREE.Vector3(0, 0, 1);
            const binorm = new THREE.Vector3().crossVectors(tangent, norm).normalize();
            norm.crossVectors(binorm, tangent).normalize();

            // Divergence hump: 0 at mouth, 1 at peak stunt crest, 0 at merge funnel
            const hump = Math.sin(frac * Math.PI);

            // Separate physical centerlines with open air between them
            const lateralOffset = isLeft
                ? (baseSpread + maxDivergence * hump)
                : -(baseSpread + maxDivergence * hump);

            const elevOffset = isLeft
                ? (maxElevation * hump)
                : -(maxElevation * 0.3 * hump);

            const ribbonCenter = center.clone()
                .add(binorm.clone().multiplyScalar(lateralOffset))
                .add(norm.clone().multiplyScalar(elevOffset));

            const isDashed = Math.floor(frac * 30) % 2 === 0;

            for (let j = 0; j < radialPoints; j++) {
                const u = j / (radialPoints - 1);
                const localLat = (u - 0.5) * ribbonWidth;
                const isCurb = j === 0 || j === radialPoints - 1;
                const curbHeight = isCurb ? 3.5 : 0;

                const pos = ribbonCenter.clone()
                    .add(binorm.clone().multiplyScalar(localLat))
                    .add(norm.clone().multiplyScalar(curbHeight));

                const idx = (i * radialPoints + j) * 3;
                positions[idx] = pos.x;
                positions[idx + 1] = pos.y;
                positions[idx + 2] = pos.z;

                const uvIdx = (i * radialPoints + j) * 2;
                uvs[uvIdx] = u;
                uvs[uvIdx + 1] = frac * 20;

                normalsArr[idx] = norm.x;
                normalsArr[idx + 1] = norm.y;
                normalsArr[idx + 2] = norm.z;

                let col = roadDark;
                if (isCurb) {
                    col = curbColor;
                } else if (j === 1 || j === radialPoints - 2) {
                    col = roadShoulder;
                } else if ((j === 3 || j === 4) && isDashed) {
                    col = stripeColor;
                }

                colors[idx] = col.r;
                colors[idx + 1] = col.g;
                colors[idx + 2] = col.b;
            }
        }

        let faceIdx = 0;
        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < radialPoints - 1; j++) {
                const a = i * radialPoints + j;
                const b = (i + 1) * radialPoints + j;
                const c = (i + 1) * radialPoints + (j + 1);
                const d = i * radialPoints + (j + 1);

                indices[faceIdx++] = a;
                indices[faceIdx++] = b;
                indices[faceIdx++] = d;

                indices[faceIdx++] = b;
                indices[faceIdx++] = c;
                indices[faceIdx++] = d;
            }
        }

        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        geom.setAttribute('normal', new THREE.BufferAttribute(normalsArr, 3));
        geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geom.setIndex(new THREE.BufferAttribute(indices, 1));
        geom.computeVertexNormals();
        return geom;
    }

    return {
        leftGeometry: buildSingleRibbon(true),
        rightGeometry: buildSingleRibbon(false)
    };
}

/**
 * Creates a gleaming metallic flange collar at a Bell-End Manifold mouth
 */
export function createBellEndCollarGeometry(
    curve: THREE.CatmullRomCurve3,
    t: number,
    outerRadius: number = 54,
    tubeThickness: number = 3.5
): THREE.BufferGeometry {
    const center = curve.getPointAt(Math.max(0, Math.min(1, t)));
    const tangent = curve.getTangentAt(Math.max(0, Math.min(1, t))).normalize();
    
    // Perpendicular plane
    let norm = new THREE.Vector3(0, 1, 0);
    if (Math.abs(tangent.y) > 0.95) norm = new THREE.Vector3(0, 0, 1);
    const binorm = new THREE.Vector3().crossVectors(tangent, norm).normalize();
    norm.crossVectors(binorm, tangent).normalize();

    const radialSegments = 24;
    const tubularSegments = 16;
    const totalVerts = (tubularSegments + 1) * (radialSegments + 1);
    const totalFaces = tubularSegments * radialSegments * 2;

    const positions = new Float32Array(totalVerts * 3);
    const normals = new Float32Array(totalVerts * 3);
    const indices = new Uint32Array(totalFaces * 3);

    for (let i = 0; i <= tubularSegments; i++) {
        const phi = (i / tubularSegments) * Math.PI * 2;
        const cosPhi = Math.cos(phi);
        const sinPhi = Math.sin(phi);

        for (let j = 0; j <= radialSegments; j++) {
            const theta = (j / radialSegments) * Math.PI * 2;
            const cosTheta = Math.cos(theta);
            const sinTheta = Math.sin(theta);

            // Torus around the rim of the bell mouth
            const rMajor = outerRadius;
            const rMinor = tubeThickness;

            const localX = (rMajor + rMinor * cosTheta) * cosPhi;
            const localY = (rMajor + rMinor * cosTheta) * sinPhi;
            const localZ = rMinor * sinTheta;

            const worldPos = center.clone()
                .add(binorm.clone().multiplyScalar(localX))
                .add(norm.clone().multiplyScalar(localY))
                .add(tangent.clone().multiplyScalar(localZ));

            const idx = (i * (radialSegments + 1) + j) * 3;
            positions[idx] = worldPos.x;
            positions[idx + 1] = worldPos.y;
            positions[idx + 2] = worldPos.z;

            normals[idx] = (binorm.x * cosPhi * cosTheta + norm.x * sinPhi * cosTheta + tangent.x * sinTheta);
            normals[idx + 1] = (binorm.y * cosPhi * cosTheta + norm.y * sinPhi * cosTheta + tangent.y * sinTheta);
            normals[idx + 2] = (binorm.z * cosPhi * cosTheta + norm.z * sinPhi * cosTheta + tangent.z * sinTheta);
        }
    }

    let faceIdx = 0;
    for (let i = 0; i < tubularSegments; i++) {
        for (let j = 0; j < radialSegments; j++) {
            const a = i * (radialSegments + 1) + j;
            const b = (i + 1) * (radialSegments + 1) + j;
            const c = (i + 1) * (radialSegments + 1) + (j + 1);
            const d = i * (radialSegments + 1) + (j + 1);

            indices[faceIdx++] = a;
            indices[faceIdx++] = b;
            indices[faceIdx++] = d;

            indices[faceIdx++] = b;
            indices[faceIdx++] = c;
            indices[faceIdx++] = d;
        }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geom.setIndex(new THREE.BufferAttribute(indices, 1));
    return geom;
}
