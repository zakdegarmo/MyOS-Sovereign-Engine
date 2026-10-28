import * as THREE from 'three';

export interface TrackConfig {
    id?: string;
    name?: string;
    description?: string;
    radius: number;
    crossRadius?: number;
    tubeRadius: number;
    tubularSegments: number;
    radialSegments: number;
    p: number;
    q: number;
    trackColor: string;
    // 3-Modulator Procedural Engine parameters
    radialModFreq?: number; // n: radial frequency (expansions/contractions)
    radialModAmp?: number;  // A: radial amplitude
    heightModFreq?: number; // m: vertical elevation wave frequency
    heightModAmp?: number;  // H: vertical elevation separation amplitude
    heightPhase?: number;   // phase offset
}

export interface TrackPreset extends TrackConfig {
    id: string;
    name: string;
    description: string;
    theme: string;
}

export const TRACK_PRESETS: TrackPreset[] = [
    {
        id: 'scrap-yard-reunion',
        name: 'The Scrap Yard Reunion',
        description: 'Where Red gathers the old crew. Rolling hills, industrial overpasses, wide high-speed sweepers.',
        theme: 'Industrial Neon',
        trackColor: '#00ffcc',
        radius: 240,
        crossRadius: 80,
        tubeRadius: 24,
        tubularSegments: 500,
        radialSegments: 16,
        p: 2,
        q: 3,
        radialModFreq: 3,
        radialModAmp: 0.25,
        heightModFreq: 3,
        heightModAmp: 85,
        heightPhase: 0
    },
    {
        id: 'cycnet-citadel',
        name: 'CycNet Corporate Citadel',
        description: 'Sleek corporate megalopolis grid with towering multi-tier cloverleaf interchanges.',
        theme: 'Corporate Crimson',
        trackColor: '#ff0055',
        radius: 280,
        crossRadius: 70,
        tubeRadius: 22,
        tubularSegments: 550,
        radialSegments: 16,
        p: 3,
        q: 5,
        radialModFreq: 2,
        radialModAmp: 0.20,
        heightModFreq: 1,
        heightModAmp: 180,
        heightPhase: Math.PI
    },
    {
        id: 'outlaw-canyon',
        name: "Dead Man's Corkscrew",
        description: 'Illegal midnight drag race through sharp hairpin switchbacks and supersonic vertical plunges.',
        theme: 'Hazard Amber',
        trackColor: '#ffaa00',
        radius: 260,
        crossRadius: 75,
        tubeRadius: 22,
        tubularSegments: 600,
        radialSegments: 16,
        p: 3,
        q: 4,
        radialModFreq: 3,
        radialModAmp: 0.25,
        heightModFreq: 4,
        heightModAmp: 160,
        heightPhase: 0
    },
    {
        id: 'quantum-mobius',
        name: 'Quantum Mobius (Classic Tribute)',
        description: 'Pure flowing Figure-8 infinity circuit honoring the 1994 original high-cadence rhythm.',
        theme: 'Synthwave Violet',
        trackColor: '#bb33ff',
        radius: 220,
        crossRadius: 90,
        tubeRadius: 26,
        tubularSegments: 450,
        radialSegments: 16,
        p: 2,
        q: 1,
        radialModFreq: 2,
        radialModAmp: 0.20,
        heightModFreq: 2,
        heightModAmp: 75,
        heightPhase: 0
    }
];

export class ProceduralTrackCurve extends THREE.Curve<THREE.Vector3> {
    public radius: number;
    public crossRadius: number;
    public p: number;
    public q: number;
    public radialModFreq: number;
    public radialModAmp: number;
    public heightModFreq: number;
    public heightModAmp: number;
    public heightPhase: number;

    constructor(config: TrackConfig) {
        super();
        this.radius = config.radius || 240;
        this.crossRadius = config.crossRadius ?? (this.radius * 0.32);
        this.p = config.p || 2;
        this.q = config.q || 3;
        this.radialModFreq = config.radialModFreq ?? 3;
        this.radialModAmp = config.radialModAmp ?? 0.25;
        this.heightModFreq = config.heightModFreq ?? 3;
        this.heightModAmp = config.heightModAmp ?? 85;
        this.heightPhase = config.heightPhase ?? 0;
    }

    public getPoint(t: number, optionalTarget: THREE.Vector3 = new THREE.Vector3()): THREE.Vector3 {
        const u = ((t % 1) + 1) % 1;
        const PI2 = Math.PI * 2;

        const theta = this.p * PI2 * u;
        const phi = this.q * PI2 * u;

        // 1. Radial Modulator (varying radius along the track)
        const rModFactor = 1 + this.radialModAmp * Math.cos(this.radialModFreq * PI2 * u);
        const currentR = this.radius * rModFactor;

        // 2. Cross-section minor modulation
        const currentRMinor = this.crossRadius * (1 + 0.12 * Math.sin(this.radialModFreq * PI2 * u));

        // 3. Toroidal coords
        const planarR = currentR + currentRMinor * Math.cos(phi);
        const x = planarR * Math.cos(theta);
        const y = planarR * Math.sin(theta);

        // 4. Elevation Separation Modulator
        const z = currentRMinor * Math.sin(phi) + this.heightModAmp * Math.sin(this.heightModFreq * PI2 * u + this.heightPhase);

        return optionalTarget.set(x, y, z);
    }
}

export class Track {
    public mesh: THREE.Mesh;
    public curve: ProceduralTrackCurve;
    public frenetFrames: any;
    public tubularSegments: number;
    public tubeRadius: number;
    private texture: THREE.CanvasTexture;

    constructor(scene: THREE.Scene, config: TrackConfig) {
        this.tubularSegments = config.tubularSegments || 500;
        this.tubeRadius = config.tubeRadius || 24;

        // --- 3-Modulator Procedural Curve ---
        this.curve = new ProceduralTrackCurve(config);

        // --- Tube Geometry derived directly from curve ---
        const geometry = new THREE.TubeGeometry(
            this.curve,
            this.tubularSegments,
            this.tubeRadius,
            config.radialSegments || 16,
            true
        );

        // --- Textures ---
        this.texture = this.createProceduralTexture(config.trackColor || '#00ffcc', this.tubularSegments, config.radialSegments || 16);

        const material = new THREE.MeshStandardMaterial({
            metalness: 0.45,
            roughness: 0.55,
            side: THREE.DoubleSide,
            map: this.texture,
        });

        this.mesh = new THREE.Mesh(geometry, material);
        scene.add(this.mesh);

        // --- Compute smooth parallel-transport frames ---
        this.frenetFrames = this.curve.computeFrenetFrames(this.tubularSegments, true);
    }

    private createProceduralTexture(baseColor: string, tubularSegments: number, radialSegments: number): THREE.CanvasTexture {
        const canvas = document.createElement('canvas');
        const size = 1024;
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d')!;

        // Background - Deep Void Carbon
        context.fillStyle = '#060212';
        context.fillRect(0, 0, size, size);

        // Synthwave glow
        context.shadowBlur = 12;
        context.shadowColor = baseColor;

        // Grid lines along the tube
        context.strokeStyle = baseColor;
        context.lineWidth = 4;
        context.beginPath();

        const longLines = 8;
        for (let i = 0; i <= size; i += (size / longLines)) {
            context.moveTo(i, 0);
            context.lineTo(i, size);
        }

        // Latitudinal lines (rings)
        const latLines = 16;
        for (let j = 0; j <= size; j += (size / latLines)) {
            context.moveTo(0, j);
            context.lineTo(size, j);
        }
        context.stroke();

        // Speed Stripes & Hazard segments
        context.fillStyle = '#ffffff';
        context.globalAlpha = 0.6;
        for (let k = 0; k < 24; k++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            context.fillRect(x, y, size / 24, size / 64);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(Math.floor(tubularSegments / 8), 4);
        texture.anisotropy = 16;
        return texture;
    }

    public update(delta: number, playerSpeed: number) {
        if (this.texture) {
            this.texture.offset.x -= (playerSpeed * 0.00008 * delta);
        }
    }

    public getPointAt(t: number): THREE.Vector3 {
        const u = ((t % 1) + 1) % 1;
        return this.curve.getPointAt(u).applyQuaternion(this.mesh.quaternion);
    }

    public getFrenetAt(t: number) {
        const tClamped = ((t % 1) + 1) % 1;
        const floatIndex = tClamped * this.tubularSegments;
        const index1 = Math.floor(floatIndex) % this.tubularSegments;
        const index2 = (index1 + 1) % this.tubularSegments;
        const interpolationFactor = floatIndex - Math.floor(floatIndex);

        const tangent1 = this.frenetFrames.tangents[index1].clone();
        const normal1 = this.frenetFrames.normals[index1].clone();
        const binormal1 = this.frenetFrames.binormals[index1].clone();

        const tangent2 = this.frenetFrames.tangents[index2].clone();
        const normal2 = this.frenetFrames.normals[index2].clone();
        const binormal2 = this.frenetFrames.binormals[index2].clone();

        // Anti-Flip Interpolation
        if (normal1.dot(normal2) < 0) normal2.negate();
        if (binormal1.dot(binormal2) < 0) binormal2.negate();
        if (tangent1.dot(tangent2) < 0) tangent2.negate();

        const q = this.mesh.quaternion;

        return {
            tangent: tangent1.lerp(tangent2, interpolationFactor).applyQuaternion(q).normalize(),
            normal: normal1.lerp(normal2, interpolationFactor).applyQuaternion(q).normalize(),
            binormal: binormal1.lerp(binormal2, interpolationFactor).applyQuaternion(q).normalize()
        };
    }

    public dispose() {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            if (Array.isArray(this.mesh.material)) {
                this.mesh.material.forEach(m => m.dispose());
            } else {
                (this.mesh.material as THREE.Material).dispose();
            }
        }
        if (this.texture) this.texture.dispose();
    }
}
