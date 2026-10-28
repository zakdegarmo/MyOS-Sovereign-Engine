import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { BoneMesh } from './BoneFactory';

// --- Types ---
export const BODY_PARTS = [
    'Hips', 'Spine', 'Neck', 'Head',
    'L_Shoulder', 'R_Shoulder',
    'L_Arm_Top', 'L_Arm_Bot', 'L_Hand',
    'R_Arm_Top', 'R_Arm_Bot', 'R_Hand',
    'L_Leg_Top', 'L_Leg_Bot', 'L_Foot',
    'R_Leg_Top', 'R_Leg_Bot', 'R_Foot'
] as const;
export type BodyPartName = typeof BODY_PARTS[number];

export type AlgorithmType = 'Bone' | 'Joint' | 'Flesh' | 'Ghost' | 'Noise';

export interface PartGene {
    algorithm: AlgorithmType;
    width: number;
    height: number;
    depth: number;
    scale: number;
    density: number;
    noise: number;
    color: string;
    roughness: number;
    emission: number;
}

export type GenomeMatrix = Record<BodyPartName, PartGene>;

// Default Gene Factory
export const createDefaultGene = (overrides?: Partial<PartGene>): PartGene => ({
    algorithm: 'Joint',
    width: 0.4, height: 0.4, depth: 0.4,
    scale: 0.05, density: 1500, noise: 0.0,
    color: '#e2e8f0',
    roughness: 0.3, emission: 0,
    ...overrides
});

// Default Matrix Factory with Corrected Dimensions
export const createDefaultMatrix = (): GenomeMatrix => {
    return BODY_PARTS.reduce((acc, part) => {
        let algo: AlgorithmType = 'Joint';
        // Base dimensions (will be overridden)
        let width = 0.3;
        let height = 0.4;
        let density = 1500;

        // --- Head & Neck ---
        if (part === 'Head') {
            // Sphere: height is diameter. 0.22 is a reasonable head size (22cm).
            width = 0.22; height = 0.22; density = 2000;
        }
        if (part === 'Neck') {
            width = 0.08; height = 0.1; density = 800;
        }

        // --- Torso & Hips ---
        if (part === 'Hips') {
            // Trapezoid: width 0.25 (was 0.5 - too big), height 0.15
            width = 0.25; height = 0.15; density = 2500;
        }
        if (part === 'Spine') {
            // Torso Wedge: width 0.28, height 0.4
            width = 0.28; height = 0.45; density = 3000;
        }

        // --- Limbs ---
        if (part.includes('Shoulder')) {
            width = 0.12; height = 0.12; density = 800;
        }
        if (part.includes('Arm') || part.includes('Leg')) {
            algo = 'Bone'; width = 0.12; height = 0.5; density = 1200;
        }
        if (part.includes('Hand') || part.includes('Foot')) {
            width = 0.1; height = 0.15; density = 800;
        }

        acc[part] = createDefaultGene({ algorithm: algo as any, width, height, density, scale: 0.04 });
        return acc;
    }, {} as GenomeMatrix);
};

// --- Bone Mapping ---
const BONE_KEYS: Record<BodyPartName, string[]> = {
    Hips: ['Hips', 'getHips', 'mixamorigHips'],
    Spine: ['Spine1', 'Spine', 'mixamorigSpine1', 'mixamorigSpine'],
    Neck: ['Neck', 'mixamorigNeck'],
    Head: ['Head', 'mixamorigHead'],

    L_Shoulder: ['LeftShoulder', 'mixamorigLeftShoulder'],
    R_Shoulder: ['RightShoulder', 'mixamorigRightShoulder'],

    L_Arm_Top: ['LeftArm', 'mixamorigLeftArm'],
    L_Arm_Bot: ['LeftForeArm', 'mixamorigLeftForeArm'],
    L_Hand: ['LeftHand', 'mixamorigLeftHand'],

    R_Arm_Top: ['RightArm', 'mixamorigRightArm'],
    R_Arm_Bot: ['RightForeArm', 'mixamorigRightForeArm'],
    R_Hand: ['RightHand', 'mixamorigRightHand'],

    L_Leg_Top: ['LeftUpLeg', 'mixamorigLeftUpLeg'],
    L_Leg_Bot: ['LeftLeg', 'mixamorigLeftLeg'],
    L_Foot: ['LeftFoot', 'mixamorigLeftFoot'],

    R_Leg_Top: ['RightUpLeg', 'mixamorigRightUpLeg'],
    R_Leg_Bot: ['RightLeg', 'mixamorigRightLeg'],
    R_Foot: ['RightFoot', 'mixamorigRightFoot']
};

// Mapping for Visual Connectivity (LookAt Child)
const BONE_CHAINS: Partial<Record<BodyPartName, BodyPartName>> = {
    'Hips': 'Spine',
    'Spine': 'Neck',
    'Neck': 'Head',

    'L_Shoulder': 'L_Arm_Top',
    'L_Arm_Top': 'L_Arm_Bot',
    'L_Arm_Bot': 'L_Hand',

    'R_Shoulder': 'R_Arm_Top',
    'R_Arm_Top': 'R_Arm_Bot',
    'R_Arm_Bot': 'R_Hand',

    'L_Leg_Top': 'L_Leg_Bot',
    'L_Leg_Bot': 'L_Foot',

    'R_Leg_Top': 'R_Leg_Bot',
    'R_Leg_Bot': 'R_Foot',
};

interface VoxelAvatarProps {
    genome: GenomeMatrix;
    animation?: string;
    showSkeleton?: boolean;
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: number;
}

export const VoxelAvatar: React.FC<VoxelAvatarProps> = ({ genome, animation = 'Idle', showSkeleton = false, position, rotation, scale = 1 }) => {
    const { scene, animations } = useGLTF('/models/max/walking.glb');
    const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
    const { actions } = useAnimations(animations, clone);

    useEffect(() => {
        Object.values(actions).forEach(a => a?.stop());
        const actionName = Object.keys(actions).find(name => name.toLowerCase().includes(animation.toLowerCase())) || Object.keys(actions)[0];
        if (actionName && actions[actionName]) actions[actionName]?.play();
    }, [animation, actions]);

    // Robust Bone Finder
    const boneMap = useMemo(() => {
        const map: Record<BodyPartName, THREE.Object3D | undefined> = {} as any;
        const allBones: Record<string, THREE.Object3D> = {};
        clone.traverse((obj) => { if (obj.type === 'Bone') allBones[obj.name] = obj; });

        BODY_PARTS.forEach(part => {
            const keys = BONE_KEYS[part];
            for (const k of keys) {
                if (allBones[k]) { map[part] = allBones[k]; break; }
            }
        });
        return map;
    }, [clone]);

    const getBone = (name: BodyPartName) => boneMap[name];

    return (
        <group position={position as any} rotation={rotation as any} scale={scale}>
            <primitive object={clone} visible={showSkeleton} />
            {BODY_PARTS.map(partName => (
                <VoxelPart
                    key={partName}
                    name={partName}
                    gene={genome[partName]}
                    bone={boneMap[partName]}
                    getBone={getBone}
                />
            ))}
        </group>
    );
};

// --- ALGORITHMS ---
const generatePoints = (gene: PartGene): { position: THREE.Vector3, scale: number }[] => {
    const points = [];
    const count = Math.min(gene.density, 50000);
    const rnd = (range: number) => (Math.random() - 0.5) * range;

    for (let i = 0; i < count; i++) {
        const p = new THREE.Vector3();
        p.set(rnd(gene.width), rnd(gene.height), rnd(gene.depth));
        points.push({ position: p, scale: gene.scale });
    }
    return points;
};

// Updated VoxelPart with LookAt Logic
const VoxelPart = ({ name, gene, bone, getBone }: { name: BodyPartName, gene: PartGene, bone?: THREE.Object3D, getBone: (n: BodyPartName) => THREE.Object3D | undefined }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const boneMeshRef = useRef<THREE.Group>(null);
    const particles = useMemo(() => generatePoints(gene), [gene]);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Helper Vectors (Stable ref)
    const vecA = useMemo(() => new THREE.Vector3(), []);
    const vecB = useMemo(() => new THREE.Vector3(), []);
    const quat = useMemo(() => new THREE.Quaternion(), []);

    const realLength = useMemo(() => {
        if (!bone) return undefined;
        const childName = BONE_CHAINS[name];
        if (childName) {
            const childBone = getBone(childName);
            if (childBone) {
                bone.getWorldPosition(vecA);
                childBone.getWorldPosition(vecB);
                return vecA.distanceTo(vecB);
            }
        }
        return undefined;
    }, [bone, getBone, name]);

    useFrame(() => {
        if (!bone) return;

        // 1. Update Flesh (Attached to Bone rigidly)
        if (meshRef.current) {
            meshRef.current.position.copy(bone.getWorldPosition(vecA));
            meshRef.current.quaternion.copy(bone.getWorldQuaternion(quat));
        }

        // 2. Update Skeleton (Procedural Link)
        if (boneMeshRef.current) {
            // Start at Parent Bone
            bone.getWorldPosition(vecA);
            boneMeshRef.current.position.copy(vecA);

            // Find End Point
            const childName = BONE_CHAINS[name];
            if (childName) {
                const childBone = getBone(childName);
                if (childBone) {
                    childBone.getWorldPosition(vecB);
                    // Point at Child
                    boneMeshRef.current.lookAt(vecB);
                    // Rotate X 90 to align Y-up Geometry to Z-Forward LookAt
                    boneMeshRef.current.rotateX(Math.PI / 2);
                }
            } else {
                // No child, use Bone rotation
                boneMeshRef.current.quaternion.copy(bone.getWorldQuaternion(quat));
            }
        }
    });

    useEffect(() => {
        if (!meshRef.current) return;
        particles.forEach((p, i) => {
            dummy.position.copy(p.position);
            dummy.scale.setScalar(p.scale);
            dummy.rotation.set(0, 0, 0);
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    }, [particles]);

    if (!bone) return null;

    return (
        <>
            {/* THE SKELETON (Rigid & Visible) */}
            <group ref={boneMeshRef} name={`${name}_Bone`}>
                <BoneMesh part={name} width={gene.width} height={gene.height} realLength={realLength} />
            </group>

            {/* THE FLESH (Voxel Cloud) - Visible by default now */}
            <instancedMesh ref={meshRef} name={name} args={[undefined, undefined, particles.length]} visible={true}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial
                    color={gene.color}
                    roughness={gene.roughness}
                    emissive={gene.color}
                    emissiveIntensity={gene.emission}
                    transparent
                    opacity={0.8}
                />
            </instancedMesh>
        </>
    );
};
