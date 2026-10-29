import { useRef, Suspense, useCallback, useEffect, useState, useMemo } from 'react';
import { useTexture, TransformControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { DIOManifestation } from './DIOManifestation';
import { WorldSpawner } from './WorldSpawner';
import { PapercraftBuilding } from './PapercraftBuilding';
import { PapercraftHouse } from './PapercraftHouse';
import { useWorld } from '../../engine/WorldContext';
import { FacetHighlighter } from './FacetHighlighter';

interface AssetLayer {
    id: string;
    url: string;
    opacity: number;
    scale: number;
    offsetX: number;
    offsetY: number;
    rotation: number;
    visible: boolean;
    name: string;
}

interface PropData {
    id: string;
    coordinate?: string;
    rawPosition?: [number, number, number];
    texturePath?: string;
    textureUrl?: string;
    scale?: number;
    animation?: 'bob' | 'none';
    geometryType?: 'sprite' | 'box' | 'plane' | 'sphere' | 'tetrahedron' | 'cylinder' | 'torus' | 'cone' | 'torusKnot' | 'icosahedron' | 'octahedron' | 'dodecahedron' | 'ring' | 'procedural_mountain';
    color?: string;
    wireframe?: boolean;
    layers?: AssetLayer[];
    mass?: number;
    isVoxelized?: boolean;
    pixelScale?: number;
    initialPixelCount?: number;
    isClosing?: boolean;
    type?: 'prop' | 'agent' | 'object' | 'hyperObject';
    linkedPillar?: string;
    linkedResonance?: number;
    label?: string;
    isLocked?: boolean;
    uvOffset?: [number, number];
    uvScale?: [number, number];
    rotationSpeed?: number;
    rotation?: [number, number, number];
}

interface WorldPropsComponentProps {
    floorConfig: { width: number; depth: number };
    dynamicProps?: PropData[];
    onSelect?: (id: string | null) => void;
    onContextMenu?: (e: any, id: string) => void;
    selectedId?: string | null;
    overrides?: Record<string, any>;
    onUpdateOverride?: (id: string, changes: any) => void;
    transformMode?: 'translate' | 'scale';
    impactedPropId?: string | null;
    playerPosition?: [number, number, number];
    onPortalClosed?: (id: string | null, state: string) => void;
    getElevation?: (x: number, z: number) => number;
    liftFactor?: number;
    isFacetDebugActive?: boolean;
}

// --- WORLD CURVATURE SHADER ---
const CURVATURE = 0.00005;

export function WorldProps({
    floorConfig,
    dynamicProps = [],
    onSelect,
    onContextMenu,
    selectedId,
    overrides = {},
    onUpdateOverride,
    transformMode = 'translate',
    impactedPropId,
    playerPosition,
    onPortalClosed,
    getElevation,
    liftFactor,
    isFacetDebugActive = false
}: WorldPropsComponentProps) {
    const { swapDimension, currentDimension } = useWorld();
    const [spawnedProps, setSpawnedProps] = useState<any[]>([]);
    const materialRef = useRef<THREE.MeshStandardMaterial>(null);
    const { width, depth } = floorConfig;
    const { camera, scene, controls } = useThree();

    const battleshipToEuclidean = (coord: string): [number, number, number] => {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const rowChar = coord[0].toUpperCase();
        const colNum = parseInt(coord.substring(1), 10);
        const row = letters.indexOf(rowChar);
        const col = colNum - 1;
        const cellWidth = width / 10;
        const cellDepth = depth / 10;
        const x = -width / 2 + (col * cellWidth) + (cellWidth / 2);
        const z = -depth / 2 + (row * cellDepth) + (cellDepth / 2);
        return [x, 0, z];
    };

    const onBeforeCompile = (shader: any) => {
        // --- HORIZON CURVATURE & WHITE PURGE ---
        shader.uniforms.uCurvature = { value: 0.00005 };
        shader.uniforms.uCameraPos = { value: new THREE.Vector3() };

        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <map_fragment>',
            `
            #include <map_fragment>
            // WHITE PURGE INJECTION
            if (diffuseColor.r > 0.95 && diffuseColor.g > 0.95 && diffuseColor.b > 0.95) {
                discard;
            }
            `
        );
        (materialRef as any).current = shader;
    };

    useFrame(() => {
        // Shader uniforms update (for curvature and white purge only)
        if (materialRef.current) {
            (materialRef.current as any).uniforms.uCameraPos.value.copy(camera.position);
        }
    });

    const pPos = playerPosition ? new THREE.Vector3(...playerPosition) : new THREE.Vector3(0,0,0);
    const allProps = [...(dynamicProps || []), ...spawnedProps];

    const memoTrackPos = useMemo(() => ({ x: pPos.x, z: pPos.z }), [pPos.x, pPos.z]);
    const handleSpawn = useCallback((props: any[]) => setSpawnedProps(props), []);

    const selectedProp = useMemo(() => {
        if (!selectedId) return null;
        return allProps.find(p => p.id === selectedId);
    }, [selectedId, allProps]);

    return (
        <group name="WORLD_PROPS_SYSTEM">
            {isFacetDebugActive && selectedProp && (
                <FacetHighlighter target={scene.getObjectByName(`prop-wrapper-${selectedId}`)} />
            )}

            <WorldSpawner 
                trackPos={memoTrackPos} 
                onSpawn={handleSpawn} 
            />
            {allProps.map(prop => {
                const worldPos = overrides[prop.id]?.position || prop.rawPosition || battleshipToEuclidean(prop.coordinate || 'A1');
                
                // --- TERRAIN-AWARE GROUNDING ---
                const elevFunc = getElevation || ((x, z) => topographyRegistry.getElevation(x, z));
                const terrainElev = elevFunc(worldPos[0], worldPos[2]);
                
                const isSpherical = currentDimension === 'faerun';
                
                const scale = overrides[prop.id]?.scale || prop.scale || 1;
                
                const EMBED_CLIP_SMIDGE = 0.15;
                const relativePosition: [number, number, number] = [
                    worldPos[0] - (isSpherical ? pPos.x : 0),
                    terrainElev + (scale * 0.5) - EMBED_CLIP_SMIDGE,
                    worldPos[2] - (isSpherical ? pPos.z : 0)
                ];
                
                if (prop.type === 'hyperObject' || prop.type === 'building') {
                    const finalScale = scale * (prop.type === 'hyperObject' ? Math.pow(prop.mass || 1, 1 / 3) : 1);
                    
                    if (prop.type === 'building' || prop.texturePath?.includes('inn') || prop.texturePath?.includes('tower')) {
                        const isInn = prop.id === 'old_skull_inn' || prop.texturePath?.includes('inn');
                        
                        if (isInn) {
                            return (
                                <PapercraftHouse
                                    key={prop.id}
                                    id={prop.id}
                                    position={relativePosition}
                                    scale={finalScale * 2.2}
                                    facetUrl="/assets/inn_blueprint_sheet_1775978275170.png"
                                    linkedDimension="glitching_window"
                                    onTrigger={(dim) => swapDimension(dim)}
                                    isSelected={selectedId === prop.id}
                                    transformMode={transformMode}
                                    onUpdate={(changes) => onUpdateOverride?.(prop.id, changes)}
                                    playerPosition={playerPosition}
                                />
                            );
                        }

                        return (
                            <PapercraftBuilding 
                                key={prop.id}
                                id={prop.id}
                                position={relativePosition}
                                scale={finalScale * 1.5}
                                type={prop.texturePath?.includes('tower') ? 'tower' : 'house'}
                                linkedDimension={prop.linkedDimension || (prop.id === 'old_skull_inn' ? 'data_wilderness' : undefined)}
                                onTrigger={swapDimension}
                                playerPosition={playerPosition}
                                isSelected={selectedId === prop.id}
                                transformMode={transformMode}
                                onUpdate={(changes) => onUpdateOverride?.(prop.id, changes)}
                            />
                        );
                    }

                    return (
                        <Suspense key={prop.id} fallback={null}>
                            <HyperObject 
                                id={prop.id}
                                position={relativePosition}
                                scale={finalScale}
                                textureUrl={prop.textureUrl || prop.texturePath || '/assets/ZAMN_Assets/32191.png'}
                                linkedPillar={prop.linkedPillar}
                                linkedResonance={prop.linkedResonance}
                                label={prop.label}
                                playerPosition={playerPosition}
                                isLocked={prop.isLocked}
                                isClosing={prop.isClosing}
                                onTrigger={(data) => { console.log(data); }}
                                onAnimationComplete={onPortalClosed}
                                isSelected={selectedId === prop.id}
                                transformMode={transformMode}
                                onUpdate={(changes) => onUpdateOverride?.(prop.id, changes)}
                            />
                        </Suspense>
                    );
                }

                return (
                    <PropItem
                        key={prop.id}
                        {...prop}
                        {...(overrides[prop.id] || {})}
                        position={relativePosition} // Base relative position
                        isSelected={selectedId === prop.id}
                        onSelect={() => onSelect?.(prop.id)}
                        onContextMenu={(e) => onContextMenu?.(e.nativeEvent || e, prop.id)}
                        onUpdate={(changes) => onUpdateOverride?.(prop.id, changes)}
                        transformMode={transformMode}
                        impact={impactedPropId === prop.id}
                        onBeforeCompile={onBeforeCompile}
                        playerPosition={playerPosition} // Needed for sync math
                        isSpherical={isSpherical}
                    />
                );
            })}
        </group>
    );
}

function PropItem(props: any) {
    const { id, position, texturePath, textureUrl, scale = 1, rotation, isSelected, onSelect, onContextMenu, onUpdate, transformMode, animation = 'none', geometryType = 'sprite', color, layers, isVoxelized, impact, onBeforeCompile, playerPosition, isSpherical } = props;
    const { controls, scene } = useThree();
    const [isDragging, setIsDragging] = useState(false);
    const groupRef = useRef<THREE.Group>(null);
    const validPath = (textureUrl || texturePath) || '/assets/cities/waterdeep.jpg';
    const texture = useTexture(validPath);

    if (texture) {
        texture.magFilter = texture.minFilter = THREE.NearestFilter;
    }

    const spriteRef = useRef<THREE.Group>(null);
    useFrame((state: any) => {
        if (spriteRef.current && animation === 'bob' && !isDragging) {
            spriteRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.5;
        }

        // --- CYLINDRICAL BILLBOARDING ---
        if (groupRef.current) {
            groupRef.current.lookAt(state.camera.position.x, groupRef.current.position.y, state.camera.position.z);
        }

        // --- DRAG ISOLATION ---
        if (groupRef.current && !isDragging) {
            groupRef.current.position.set(position[0], position[1], position[2]);
        }
    });

    const finalScale = scale;
    const innerContent = (
        <group ref={spriteRef}>
            {geometryType === 'sprite' ? (
                <group 
                    rotation={rotation ? [rotation[0], rotation[1], rotation[2]] : [0, 0, 0]}
                    scale={[finalScale, finalScale, 1]}
                >
                    <mesh castShadow receiveShadow>
                        <planeGeometry args={[1, 1]} />
                        <meshBasicMaterial 
                            map={texture || undefined} 
                            transparent={true} 
                            alphaTest={0.5}
                            depthWrite={true}
                            side={THREE.DoubleSide}
                            onBeforeCompile={onBeforeCompile}
                            color={isSelected ? "#00ffff" : "#fff"} 
                        />
                    </mesh>
                </group>
            ) : (
                <DIOManifestation
                    id={id}
                    position={[0, 0, 0]}
                    primitive={(geometryType as any) || 'box'}
                    textureUrl={textureUrl || texturePath || '/assets/lpc/Exterior Tiles.png'}
                    scale={finalScale}
                    color={isSelected ? "#00ffff" : (color || "#fff")}
                    uvOffset={props.uvOffset}
                    onBeforeCompile={onBeforeCompile}
                />
            )}
        </group>
    );

    return (
        <>
            {isSelected && (
                <TransformControls
                    object={groupRef.current || undefined}
                    mode={transformMode || 'translate'}
                    onMouseDown={() => {
                        setIsDragging(true);
                        if (controls) (controls as any).enabled = false;
                    }}
                    onMouseUp={() => {
                        setIsDragging(false);
                        if (controls) (controls as any).enabled = true;
                        
                        if (groupRef.current && playerPosition) {
                            // Ensure we don't 'autoshrink' by capturing the group's world scale
                            const worldScale = groupRef.current.scale.x;
                            onUpdate?.({
                                position: [
                                    groupRef.current.position.x + (isSpherical ? playerPosition[0] : 0),
                                    groupRef.current.position.y,
                                    groupRef.current.position.z + (isSpherical ? playerPosition[2] : 0)
                                ],
                                scale: worldScale
                            });
                        }
                    }}
                />
            )}
            <group
                ref={groupRef}
                key={id}
                name={`prop-wrapper-${id}`}
                position={position}
                onContextMenu={(e: any) => { e.stopPropagation(); onContextMenu?.(e); }}
                onClick={(e: any) => { e.stopPropagation(); onSelect?.(); }}
                onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
                onPointerOut={() => { document.body.style.cursor = 'default'; }}
            >
                {innerContent}
            </group>
        </>
    );
}

function LayerSprite({ layer, baseScale, isSelected, zIndex }: { layer: AssetLayer, baseScale: number, isSelected?: boolean, zIndex: number }) {
    const texture = useTexture(layer.url.startsWith('http') ? layer.url : (layer.url.startsWith('/') ? layer.url : `/${layer.url}`));
    
    if (texture) {
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
    }

    const s = layer.scale * baseScale;
    
    return (
        <sprite 
            scale={[s, s, 1]} 
            position={[layer.offsetX / 100, -layer.offsetY / 100, zIndex * 0.01]}
        >
            <spriteMaterial 
                map={texture} 
                transparent={true} 
                opacity={layer.visible ? layer.opacity : 0}
                depthTest={true} 
                depthWrite={false} 
                color={isSelected ? "#00ffff" : "#fff"}
                rotation={(layer.rotation * Math.PI) / 180}
            />
        </sprite>
    );
}
