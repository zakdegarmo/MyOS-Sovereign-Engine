import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface DayNightCyclotronProps {
    playerPosition: THREE.Vector3;
    cycleDurationSeconds?: number; // Default 120 seconds for full day/night loop
    radius?: number;               // Radius of the sky dome (default 4000)
}

/**
 * DayNightCyclotron
 * 
 * Renders a large sky dome (radius 4000) with treadmilling rotation,
 * cross-fading day/night textures (morning_skybox.png <-> night_skybox.png),
 * and dynamic directional sun/moon lighting.
 */
export const DayNightCyclotron: React.FC<DayNightCyclotronProps> = ({
    playerPosition,
    cycleDurationSeconds = 120,
    radius = 4000
}) => {
    const domeRef = useRef<THREE.Mesh>(null);
    const sunLightRef = useRef<THREE.DirectionalLight>(null);

    const [morningSky, nightSky] = useTexture([
        '/assets/textures/skybox/morning_skybox.png',
        '/assets/textures/skybox/night_skybox.png'
    ]);

    useMemo(() => {
        morningSky.wrapS = morningSky.wrapT = THREE.RepeatWrapping;
        nightSky.wrapS = nightSky.wrapT = THREE.RepeatWrapping;
    }, [morningSky, nightSky]);

    // Shader material to smoothly blend morning & night skyboxes with treadmilling rotation
    const skyMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uDayTexture: { value: morningSky },
                uNightTexture: { value: nightSky },
                uMixFactor: { value: 0.0 }, // 0 = Day, 1 = Night
                uRotationOffset: { value: 0.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                uniform float uRotationOffset;
                void main() {
                    vUv = uv;
                    vUv.x = fract(vUv.x + uRotationOffset);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                uniform sampler2D uDayTexture;
                uniform sampler2D uNightTexture;
                uniform float uMixFactor;

                void main() {
                    vec4 dayColor = texture2D(uDayTexture, vUv);
                    vec4 nightColor = texture2D(uNightTexture, vUv);
                    vec4 finalColor = mix(dayColor, nightColor, uMixFactor);
                    gl_FragColor = finalColor;
                }
            `,
            side: THREE.BackSide,
            depthWrite: false
        });
    }, [morningSky, nightSky]);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        
        // Treadmilling rotation (slow 360 degree rotation)
        const rotationSpeed = 0.002;
        if (domeRef.current) {
            domeRef.current.position.copy(playerPosition);
            skyMaterial.uniforms.uRotationOffset.value = (time * rotationSpeed) % 1.0;
        }

        // Day/Night cycle mix factor: 0.0 = Midday, 1.0 = Midnight
        const cycleProgress = (time % cycleDurationSeconds) / cycleDurationSeconds;
        const nightFactor = 0.5 - 0.5 * Math.cos(cycleProgress * Math.PI * 2.0); // Smooth 0..1..0 sine wave
        skyMaterial.uniforms.uMixFactor.value = nightFactor;

        // Dynamic sun/moon light animation
        if (sunLightRef.current) {
            const angle = cycleProgress * Math.PI * 2.0;
            const sunDistance = 800;
            sunLightRef.current.position.set(
                Math.sin(angle) * sunDistance,
                Math.cos(angle) * sunDistance,
                200
            );

            // Sun color lerp: Warm amber/white at day -> Dim deep blue at night
            const dayColor = new THREE.Color("#fff2cc");
            const nightColor = new THREE.Color("#334466");
            sunLightRef.current.color.lerpColors(dayColor, nightColor, nightFactor);
            sunLightRef.current.intensity = THREE.MathUtils.lerp(1.2, 0.2, nightFactor);
        }
    });

    return (
        <group name="DayNightCyclotron">
            {/* Dynamic Directional Sun/Moon Light */}
            <directionalLight
                ref={sunLightRef}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
            />

            {/* Ambient Atmosphere Fill Light */}
            <ambientLight intensity={0.4} />

            {/* Giant Treadmilling Sky Dome (Radius 4000 for realistic horizon distance) */}
            <mesh ref={domeRef} material={skyMaterial}>
                <sphereGeometry args={[radius, 64, 64]} />
            </mesh>
        </group>
    );
};
