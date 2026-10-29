import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// ═════════════════════════════════════════════════════════════════════════
// 🌊 SHADER 1: DEEP POLAR SKY & AURORA BOREALIS (Z: -80)
// ═════════════════════════════════════════════════════════════════════════
const AuroraSkyShader = {
    uniforms: {
        u_time: { value: 0 },
        u_aurora_intensity: { value: 1.2 },
        u_color_cyan: { value: new THREE.Color('#00e5ff') },
        u_color_green: { value: new THREE.Color('#00ff88') }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float u_time;
        uniform float u_aurora_intensity;
        uniform vec3 u_color_cyan;
        uniform vec3 u_color_green;
        varying vec2 vUv;

        // Simple hash for stars
        float hash(vec2 p) {
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
        }

        void main() {
            vec2 uv = vUv;

            // Deep Arctic Twilight Gradient
            vec3 skyColor = mix(vec3(0.01, 0.02, 0.05), vec3(0.03, 0.08, 0.16), uv.y);

            // Twinkling Polar Stars
            float starNoise = hash(floor(uv * 180.0));
            if (starNoise > 0.985 && uv.y > 0.35) {
                float twinkle = 0.5 + 0.5 * sin(u_time * 4.0 + starNoise * 6.28);
                skyColor += vec3(0.85, 0.95, 1.0) * twinkle * (uv.y - 0.35);
            }

            // Aurora Waveforms (Harmonic Domain Warping)
            if (uv.y > 0.25) {
                float wave1 = sin(uv.x * 4.0 + u_time * 0.45) * 0.12;
                float wave2 = cos(uv.x * 7.5 - u_time * 0.3) * 0.08;
                float wave3 = sin(uv.x * 12.0 + u_time * 0.8) * 0.04;
                float ribbonY = 0.65 + wave1 + wave2 + wave3;

                float dist = abs(uv.y - ribbonY);
                float glow = smoothstep(0.28, 0.0, dist) * u_aurora_intensity;

                // Color gradient along the ribbon height
                vec3 auroraColor = mix(u_color_green, u_color_cyan, sin(uv.x * 3.0 + u_time) * 0.5 + 0.5);
                skyColor += auroraColor * glow * (0.8 + 0.2 * sin(u_time * 2.0 + uv.x * 10.0));
            }

            gl_FragColor = vec4(skyColor, 1.0);
        }
    `
};

// ═════════════════════════════════════════════════════════════════════════
// 🌊 SHADER 2: DISTANT SWELLS & OCEAN HORIZON (Z: -40)
// ═════════════════════════════════════════════════════════════════════════
const DistantOceanShader = {
    uniforms: {
        u_time: { value: 0 },
        u_wave_scale: { value: 1.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float u_time;
        uniform float u_wave_scale;
        varying vec2 vUv;

        void main() {
            vec2 uv = vUv;
            
            // Rolling ocean swells
            float t = u_time * 0.6;
            float swell1 = sin(uv.x * 6.0 + t) * 0.08;
            float swell2 = cos(uv.x * 11.0 - t * 0.8) * 0.04;
            float horizon = 0.5 + (swell1 + swell2) * u_wave_scale;

            if (uv.y > horizon) {
                discard; // Transparent above the ocean silhouette
            }

            // Ocean depth gradient
            float depth = (horizon - uv.y) / horizon;
            vec3 deepWater = vec3(0.015, 0.04, 0.09);
            vec3 crestWater = vec3(0.04, 0.12, 0.22);
            vec3 waterColor = mix(crestWater, deepWater, depth);

            // Subtle crest foam
            float foam = smoothstep(0.02, 0.0, horizon - uv.y) * 0.4;
            waterColor += vec3(0.5, 0.7, 0.85) * foam;

            gl_FragColor = vec4(waterColor, 1.0);
        }
    `
};

// ═════════════════════════════════════════════════════════════════════════
// 🌊 SHADER 3: MIDGROUND CRASHING WAVES & WHITE CAPS (Z: -18)
// ═════════════════════════════════════════════════════════════════════════
const BreakerWaveShader = {
    uniforms: {
        u_time: { value: 0 },
        u_turbulence: { value: 1.5 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float u_time;
        uniform float u_turbulence;
        varying vec2 vUv;

        // Pseudo noise for turbulent froth
        float noise(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
            vec2 uv = vUv;
            float t = u_time * 1.2;

            // Chaotic Bering Sea wave crests
            float w1 = sin(uv.x * 8.0 + t * 1.5) * 0.12;
            float w2 = sin(uv.x * 16.0 - t * 2.0) * 0.06;
            float w3 = cos(uv.x * 24.0 + t * 3.0) * 0.03;
            float waveEdge = 0.48 + (w1 + w2 + w3) * (u_turbulence * 0.8);

            if (uv.y > waveEdge) {
                discard;
            }

            // Dark turbulent cold water
            vec3 water = mix(vec3(0.02, 0.06, 0.12), vec3(0.06, 0.18, 0.28), uv.y);

            // Heavy white froth crests
            float foamLine = smoothstep(0.06, 0.0, waveEdge - uv.y);
            float frothNoise = noise(uv * 40.0 + vec2(t * 2.0, 0.0));
            vec3 foamColor = vec3(0.75, 0.88, 0.95) * (0.7 + 0.3 * frothNoise);

            vec3 finalColor = mix(water, foamColor, foamLine * 0.85);
            gl_FragColor = vec4(finalColor, 0.95);
        }
    `
};

// ═════════════════════════════════════════════════════════════════════════
// 🚢 SHADER 4: CRAB BOAT BILLBOARD (INDEPENDENT PROCEDURAL SHADER) (Z: -10)
// ═════════════════════════════════════════════════════════════════════════
const CrabBoatShader = {
    uniforms: {
        u_time: { value: 0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float u_time;
        varying vec2 vUv;

        void main() {
            vec2 uv = vUv;
            
            // Silhouette mask of a rugged Bering Sea crab boat (trawler hull + wheelhouse + mast)
            float hull = 0.0;
            // Lower tapered hull
            if (uv.y > 0.15 && uv.y < 0.45 && uv.x > 0.15 && uv.x < 0.85) {
                float bowAngle = (uv.x < 0.3) ? (uv.x - 0.15) / 0.15 : 1.0;
                float sternAngle = (uv.x > 0.75) ? (0.85 - uv.x) / 0.1 : 1.0;
                if (uv.y < 0.15 + bowAngle * 0.28 && uv.y < 0.15 + sternAngle * 0.28) {
                    hull = 1.0;
                }
            }
            // Wheelhouse forward cabin
            if (uv.x > 0.25 && uv.x < 0.48 && uv.y >= 0.40 && uv.y < 0.68) {
                hull = 1.0;
            }
            // High aft rigging crane / crab pot launcher mast
            if (uv.x > 0.58 && uv.x < 0.61 && uv.y >= 0.40 && uv.y < 0.85) {
                hull = 1.0;
            }
            if (uv.x > 0.60 && uv.x < 0.78 && abs(uv.y - (0.85 - (uv.x - 0.6) * 0.8)) < 0.02) {
                hull = 1.0; // Angled crane boom
            }

            if (hull < 0.5) {
                discard;
            }

            // Weathered rusted steel base
            vec3 boatColor = vec3(0.08, 0.07, 0.06);

            // Wheelhouse Glowing Amber Radar/Cockpit window
            if (uv.x > 0.28 && uv.x < 0.44 && uv.y > 0.52 && uv.y < 0.62) {
                float flicker = 0.85 + 0.15 * sin(u_time * 8.0);
                boatColor = vec3(0.2, 0.85, 0.4) * flicker; // Cathode green radar screen
            }

            // Aft Halogen Deck Floodlights (Pulsing amber glow cut through the storm)
            vec2 lightPos = vec2(0.52, 0.65);
            float distToLight = length(uv - lightPos);
            if (distToLight < 0.18) {
                float flare = smoothstep(0.18, 0.0, distToLight);
                boatColor += vec3(1.0, 0.6, 0.15) * flare * 2.2;
            }

            gl_FragColor = vec4(boatColor, 1.0);
        }
    `
};

// ═════════════════════════════════════════════════════════════════════════
// ❄️ SHADER 5: FOREGROUND SEA SPRAY & ICY FROST VIGNETTE (Z: -2)
// ═════════════════════════════════════════════════════════════════════════
const ForegroundSprayShader = {
    uniforms: {
        u_time: { value: 0 },
        u_spray_intensity: { value: 0.75 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float u_time;
        uniform float u_spray_intensity;
        varying vec2 vUv;

        float noise(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
            vec2 uv = vUv;
            float t = u_time * 2.5;

            // Edge ice frost vignette
            vec2 centerDist = abs(uv - 0.5) * 2.0;
            float vignette = pow(length(centerDist), 2.2) * 0.45;

            // Fast blowing sea spray particles
            vec2 sprayUv = uv * vec2(25.0, 15.0) + vec2(t * 3.0, sin(t * 0.5));
            float sprayNoise = noise(floor(sprayUv));
            float particles = (sprayNoise > 0.94) ? 0.35 : 0.0;

            vec3 sprayColor = vec3(0.85, 0.95, 1.0);
            float alpha = (vignette + particles) * u_spray_intensity;

            gl_FragColor = vec4(sprayColor, alpha);
        }
    `
};

interface BeringSeaShaderLabProps {
    isActive?: boolean;
}

export const BeringSeaShaderLab: React.FC<BeringSeaShaderLabProps> = ({ isActive = true }) => {
    // Parallax plane refs
    const skyRef = useRef<THREE.Mesh>(null);
    const distantOceanRef = useRef<THREE.Mesh>(null);
    const midWaveRef = useRef<THREE.Mesh>(null);
    const boatBillboardRef = useRef<THREE.Group>(null);
    const sprayRef = useRef<THREE.Mesh>(null);

    // Interactive Lab Parameters
    const [auroraIntensity, setAuroraIntensity] = useState(1.4);
    const [turbulence, setTurbulence] = useState(1.6);
    const [sprayIntensity, setSprayIntensity] = useState(0.8);
    const [showHud, setShowHud] = useState(true);

    // Instantiate Materials with useMemo
    const skyMat = useMemo(() => new THREE.ShaderMaterial(AuroraSkyShader), []);
    const distantMat = useMemo(() => new THREE.ShaderMaterial(DistantOceanShader), []);
    const midMat = useMemo(() => new THREE.ShaderMaterial({ ...BreakerWaveShader, transparent: true }), []);
    const boatMat = useMemo(() => new THREE.ShaderMaterial({ ...CrabBoatShader, transparent: true }), []);
    const sprayMat = useMemo(() => new THREE.ShaderMaterial({ ...ForegroundSprayShader, transparent: true }), []);

    // 60fps Frame Animation & Smooth Mouse Parallax
    useFrame((state, delta) => {
        const t = state.clock.getElapsedTime();

        // Update Shader Uniform Times
        skyMat.uniforms.u_time.value = t;
        skyMat.uniforms.u_aurora_intensity.value = auroraIntensity;

        distantMat.uniforms.u_time.value = t;
        midMat.uniforms.u_time.value = t;
        midMat.uniforms.u_turbulence.value = turbulence;

        boatMat.uniforms.u_time.value = t;
        sprayMat.uniforms.u_time.value = t;
        sprayMat.uniforms.u_spray_intensity.value = sprayIntensity;

        // Smooth Mouse Parallax Offsets
        const mx = state.pointer.x; // -1 to 1
        const my = state.pointer.y; // -1 to 1

        // Parallax multipliers based on depth Z:
        // Foreground moves fast, background moves slow
        if (sprayRef.current) {
            sprayRef.current.position.x = THREE.MathUtils.lerp(sprayRef.current.position.x, mx * 0.8, 0.1);
            sprayRef.current.position.y = THREE.MathUtils.lerp(sprayRef.current.position.y, my * 0.4, 0.1);
        }

        if (boatBillboardRef.current) {
            boatBillboardRef.current.position.x = THREE.MathUtils.lerp(boatBillboardRef.current.position.x, mx * 2.2, 0.08);
            // Boat pitches and rolls with wave math
            const boatPitch = Math.sin(t * 1.8) * 0.12;
            const boatHeave = Math.cos(t * 1.5) * 0.6;
            boatBillboardRef.current.position.y = -1.5 + boatHeave + (my * 1.0);
            boatBillboardRef.current.rotation.z = boatPitch;
        }

        if (midWaveRef.current) {
            midWaveRef.current.position.x = THREE.MathUtils.lerp(midWaveRef.current.position.x, mx * 3.5, 0.06);
            midWaveRef.current.position.y = THREE.MathUtils.lerp(midWaveRef.current.position.y, my * 1.5 - 3.0, 0.06);
        }

        if (distantOceanRef.current) {
            distantOceanRef.current.position.x = THREE.MathUtils.lerp(distantOceanRef.current.position.x, mx * 6.0, 0.04);
            distantOceanRef.current.position.y = THREE.MathUtils.lerp(distantOceanRef.current.position.y, my * 2.5 - 2.0, 0.04);
        }

        if (skyRef.current) {
            skyRef.current.position.x = THREE.MathUtils.lerp(skyRef.current.position.x, mx * 1.5, 0.02);
            skyRef.current.position.y = THREE.MathUtils.lerp(skyRef.current.position.y, my * 0.8 + 4.0, 0.02);
        }
    });

    if (!isActive) return null;

    return (
        <group name="BeringSeaShaderLab">
            {/* ═══ LAYER 1: POLAR SKY & AURORA BOREALIS (Z = -80) ═══ */}
            <mesh ref={skyRef} position={[0, 4, -80]}>
                <planeGeometry args={[140, 75]} />
                <primitive object={skyMat} attach="material" />
            </mesh>

            {/* ═══ LAYER 2: DISTANT OCEAN SWELLS (Z = -45) ═══ */}
            <mesh ref={distantOceanRef} position={[0, -2, -45]}>
                <planeGeometry args={[100, 45]} />
                <primitive object={distantMat} attach="material" />
            </mesh>

            {/* ═══ LAYER 3: MIDGROUND CRASHING WAVES (Z = -20) ═══ */}
            <mesh ref={midWaveRef} position={[0, -3, -20]}>
                <planeGeometry args={[65, 30]} />
                <primitive object={midMat} attach="material" />
            </mesh>

            {/* ═══ LAYER 4: CRAB BOAT SILHOUETTE BILLBOARD (Z = -10) ═══ */}
            <group ref={boatBillboardRef} position={[0, -1.5, -10]}>
                <mesh>
                    <planeGeometry args={[12, 8]} />
                    <primitive object={boatMat} attach="material" />
                </mesh>
            </group>

            {/* ═══ LAYER 5: FOREGROUND SEA SPRAY & FROST VIGNETTE (Z = -2.5) ═══ */}
            <mesh ref={sprayRef} position={[0, 0, -2.5]}>
                <planeGeometry args={[12, 8]} />
                <primitive object={sprayMat} attach="material" />
            </mesh>

            {/* ═══ LAB HUD OVERLAY ═══ */}
            {showHud && (
                <Html position={[-4.5, 2.6, -3]} transform={false}>
                    <div className="bg-slate-950/85 backdrop-blur-md border border-cyan-500/40 p-4 rounded-lg shadow-2xl text-xs font-mono text-cyan-300 w-72 pointer-events-auto select-none">
                        <div className="flex justify-between items-center border-b border-cyan-500/30 pb-2 mb-3">
                            <span className="font-bold tracking-wider text-cyan-200">🌊 BERING SEA SHADER LAB</span>
                            <span className="text-[10px] bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-800">2.5D PARALLAX</span>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-[11px] mb-1">
                                    <span>Wave Turbulence</span>
                                    <span className="text-white">{turbulence.toFixed(1)}x</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.4"
                                    max="3.0"
                                    step="0.1"
                                    value={turbulence}
                                    onChange={(e) => setTurbulence(parseFloat(e.target.value))}
                                    className="w-full accent-cyan-400 cursor-pointer"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between text-[11px] mb-1">
                                    <span>Aurora Intensity</span>
                                    <span className="text-white">{auroraIntensity.toFixed(1)}x</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.0"
                                    max="2.5"
                                    step="0.1"
                                    value={auroraIntensity}
                                    onChange={(e) => setAuroraIntensity(parseFloat(e.target.value))}
                                    className="w-full accent-cyan-400 cursor-pointer"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between text-[11px] mb-1">
                                    <span>Sea Spray & Frost</span>
                                    <span className="text-white">{sprayIntensity.toFixed(1)}x</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.0"
                                    max="1.5"
                                    step="0.1"
                                    value={sprayIntensity}
                                    onChange={(e) => setSprayIntensity(parseFloat(e.target.value))}
                                    className="w-full accent-cyan-400 cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="mt-4 pt-2 border-t border-cyan-500/20 text-[10px] text-cyan-400/80 leading-relaxed">
                            Move cursor to drive 2.5D multiplane parallax. Independent procedural shaders active on 5 depth planes.
                        </div>
                    </div>
                </Html>
            )}
        </group>
    );
};

export default BeringSeaShaderLab;
