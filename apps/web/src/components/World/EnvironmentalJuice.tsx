import React, { useMemo } from 'react';
import { Sparkles, Cloud, Sky, Environment, Stars } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface JuiceProps {
    biomeType?: 'magic_lab' | 'forest' | 'desert' | 'tundra';
    playerPos?: THREE.Vector3;
}

export const EnvironmentalJuice: React.FC<JuiceProps> = ({ biomeType = 'magic_lab', playerPos }) => {
    
    // Dynamic floating elements based on biome
    const particles = useMemo(() => {
        switch (biomeType) {
            case 'magic_lab':
                return <Sparkles count={400} scale={150} size={4} speed={0.4} color="#00ffff" opacity={0.6} noise={0.1} />;
            case 'forest':
                return <Sparkles count={800} scale={200} size={2} speed={0.2} color="#88ff88" opacity={0.4} noise={0.2} />;
            case 'desert':
                return <Sparkles count={500} scale={150} size={1.5} speed={0.8} color="#ffddaa" opacity={0.5} noise={0.4} />;
            case 'tundra':
                return <Sparkles count={1000} scale={200} size={3} speed={1.2} color="#ffffff" opacity={0.8} noise={0.05} />;
            default:
                return null;
        }
    }, [biomeType]);

    // Atmosphere
    const atmosphere = useMemo(() => {
        switch (biomeType) {
            case 'magic_lab':
                return (
                    <>
                        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                        <ambientLight intensity={0.4} color="#001133" />
                        <directionalLight position={[10, 20, 5]} intensity={1.5} color="#00aaff" />
                    </>
                );
            case 'forest':
                return (
                    <>
                        <Sky distance={4500} sunPosition={[0, 1, 0]} inclination={0.2} azimuth={0.25} />
                        <ambientLight intensity={0.6} color="#445544" />
                        <directionalLight position={[10, 50, -10]} intensity={2.0} color="#ffeedd" castShadow />
                    </>
                );
            default:
                return (
                    <>
                        <ambientLight intensity={0.5} />
                        <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
                    </>
                );
        }
    }, [biomeType]);

    return (
        <group>
            {particles}
            {atmosphere}
            {/* Adding an environment map gives PBR materials realistic reflections */}
            <Environment preset="night" />
        </group>
    );
};
