import React, { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface EliteAvatarProps {
    id: string;
    assetUrl?: string; // Standardized: pass direct URL from manifest
    assetPrefix?: string; // Legacy/Fallback
    position?: [number, number, number];
    velocity?: [number, number, number];
    scale?: number;
    chromaSimilarity?: number;
}

/**
 * EliteAvatar.tsx
 * 
 * Logic: Decodes high-fidelity GIFs or loads static sprites.
 * Renders with a Pro Chroma-Key Shader for transparency management.
 */
export const EliteAvatar: React.FC<EliteAvatarProps> = ({
    id,
    assetUrl,
    assetPrefix,
    position: initialPosition = [0, 0, 0],
    velocity = [0, 0, 0],
    scale = 1.5,
    chromaSimilarity = 0.7,
}) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [frames, setFrames] = useState<THREE.Texture[]>([]);
    const [aspect, setAspect] = useState(1);
    const [flipX, setFlipX] = useState(1);

    const targetUrl = useMemo(() => assetUrl || `/assets/${assetPrefix}_walk_pro.gif`, [assetUrl, assetPrefix]);
    const isGif = useMemo(() => targetUrl.toLowerCase().endsWith('.gif'), [targetUrl]);

    // ASSET LOADER
    useEffect(() => {
        if (!isGif) {
            // Load static sprite
            const loader = new THREE.TextureLoader();
            loader.load(targetUrl, (tex) => {
                tex.magFilter = THREE.NearestFilter;
                tex.minFilter = THREE.NearestFilter;
                setAspect(tex.image.width / tex.image.height);
                setFrames([tex]);
            });
            return;
        }

        // GIF EXTRACTOR
        const fetchGif = async (url: string) => {
            try {
                const response = await fetch(url);
                const buffer = await response.arrayBuffer();
                if (!(window as any).GifReader) {
                    console.error("GifReader not found in window.");
                    return [];
                }
                const gifReader = new (window as any).GifReader(new Uint8Array(buffer));
                const extractedFrames: THREE.Texture[] = [];
                const pixelData = new Uint8ClampedArray(gifReader.width * gifReader.height * 4);
                
                setAspect(gifReader.width / gifReader.height);
                
                for (let i = 0; i < gifReader.numFrames(); i++) {
                    if (gifReader.frameInfo(i).disposal === 2) pixelData.fill(0);
                    const canvas = document.createElement('canvas');
                    canvas.width = gifReader.width;
                    canvas.height = gifReader.height;
                    gifReader.decodeAndBlitFrameRGBA(i, pixelData);
                    canvas.getContext('2d')!.putImageData(new ImageData(pixelData, gifReader.width, gifReader.height), 0, 0);
                    
                    const tex = new THREE.CanvasTexture(canvas);
                    tex.magFilter = THREE.NearestFilter;
                    tex.minFilter = THREE.NearestFilter;
                    tex.needsUpdate = true;
                    extractedFrames.push(tex);
                }
                return extractedFrames;
            } catch (e) {
                console.error(`Failed to decode GIF: ${url}`, e);
                return [];
            }
        };

        fetchGif(targetUrl).then(setFrames);
    }, [targetUrl, isGif]);

    // PRO-GRADE CHROMA-KEY SHADER
    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uMap: { value: new THREE.Texture() },
                uFlipX: { value: 1.0 },
                uKeyColor: { value: new THREE.Color(0xffffff) },
                uSimilarity: { value: chromaSimilarity },
                uSmoothness: { value: 0.05 },
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                uniform sampler2D uMap;
                uniform float uFlipX;
                uniform vec3 uKeyColor;
                uniform float uSimilarity;
                uniform float uSmoothness;

                void main() {
                    vec2 uv = vec2(uFlipX > 0.0 ? vUv.x : 1.0 - vUv.x, vUv.y);
                    vec4 texColor = texture2D(uMap, uv);
                    float d = distance(texColor.rgb, uKeyColor);
                    float alpha = smoothstep(uSimilarity, uSimilarity + uSmoothness, d);
                    if (alpha < 0.1) discard;
                    gl_FragColor = vec4(texColor.rgb, texColor.a * alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false
        });
    }, [chromaSimilarity]);

    useFrame((state) => {
        if (!meshRef.current || frames.length === 0) return;

        const isMoving = Math.abs(velocity[0]) > 0.1 || Math.abs(velocity[2]) > 0.1;
        const animFPS = 12;

        if (isMoving && frames.length > 1) {
            const frame = Math.floor(state.clock.elapsedTime * animFPS) % frames.length;
            material.uniforms.uMap.value = frames[frame];
            if (velocity[0] > 0.1) setFlipX(1);
            else if (velocity[0] < -0.1) setFlipX(-1);
        } else {
            material.uniforms.uMap.value = frames[0];
        }

        // Strictly Y-axis billboard
        meshRef.current.lookAt(state.camera.position.x, meshRef.current.position.y, state.camera.position.z);
        material.uniforms.uFlipX.value = flipX;
        meshRef.current.scale.setScalar(scale);
    });

    const geometry = useMemo(() => {
        const geo = new THREE.PlaneGeometry(aspect, 1);
        geo.translate(0, 0.5, 0); 
        return geo;
    }, [aspect]);

    return (
        <group position={initialPosition}>
            <mesh ref={meshRef} material={material} geometry={geometry} />
        </group>
    );
};
