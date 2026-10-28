import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import {
  MYOS_PILLARS,
  type PillarNode
} from '../CognitiveMatrix/ontologyMatrix';
import { queryCognitiveMatrix, type CognitiveTelemetry } from '../MaxOverlay/localLlmService';
import {
  CausalFeedbackEngine,
  CFEPhase,
  type CFEState
} from '../CognitiveMatrix/causalFeedbackEngine';

interface HoloCortex4DProps {
  onClose?: () => void;
}

// ═════════════════════════════════════════════════════════════════════════
// 🌌 10 ORDERS OF COGNITIVE RESOLUTION (N^3: 1^3 TO 10^3)
// ═════════════════════════════════════════════════════════════════════════
export interface CognitiveLevel {
  level: number;
  name: string;
  glyph: string;
  color: string;
  voxels: number;
  description: string;
}

export const COGNITIVE_LEVELS: CognitiveLevel[] = [
  { level: 1, name: 'Self', glyph: '◉', color: '#FF5722', voxels: 1, description: 'The 1x1x1 Observer Core: Singularity perception watching through every sensor' },
  { level: 2, name: 'Thought', glyph: '✧', color: '#BA68C8', voxels: 8, description: 'The 2x2x2 Binary Dialectic: Minimal tension spark, thesis/antithesis/synthesis' },
  { level: 3, name: 'Logic', glyph: '∴', color: '#29B6F6', voxels: 27, description: 'The 3x3x3 Rubik Core: Axiomatic governance, rules, structural constraints' },
  { level: 4, name: 'Unity', glyph: '⚭', color: '#66BB6A', voxels: 64, description: 'The 4x4x4 Gestalt Integrator: Holistic synthesis across disparate domain signals' },
  { level: 5, name: 'Existence', glyph: '⬡', color: '#8D6E63', voxels: 125, description: 'The 5x5x5 Ground Reality: Base physical manifest coordinates and empirical facts' },
  { level: 6, name: 'Improvement', glyph: '⇈', color: '#26C6DA', voxels: 216, description: 'The 6x6x6 Autopoietic Alembic: Continuous refinement and distillation feedback loops' },
  { level: 7, name: 'Mastery', glyph: '❂', color: '#FFA726', voxels: 343, description: 'The 7x7x7 Magnum Opus: Sovereign execution and perfected cross-domain actualization' },
  { level: 8, name: 'Resonance', glyph: '∿', color: '#EC407A', voxels: 512, description: 'The 8x8x8 Harmonic Sphere: Multi-frequency sympathetic vibration and affinity' },
  { level: 9, name: 'Transcendence', glyph: '⍟', color: '#7E57C2', voxels: 729, description: 'The 9x9x9 Phoenix Lattice: Dissolving horizon boundaries and paradigm leaps' },
  { level: 10, name: 'Omniscience', glyph: '۞', color: '#FFD700', voxels: 1000, description: 'The 10x10x10 Total Manifold: Complete 100-point bidirectional crystalline totality' },
];

// ═════════════════════════════════════════════════════════════════════════
// 🎨 JIT PROCEDURAL SHADERS REGISTRY
// ═════════════════════════════════════════════════════════════════════════
export interface JITShaderDef {
  id: string;
  name: string;
  vibe: string;
  color: string;
  fragmentShader: string;
}

export const JIT_SHADERS: JITShaderDef[] = [
  {
    id: 'aurora_borealis',
    name: 'Arctic Aurora Wave',
    vibe: 'Resonance & Flow',
    color: '#00ffcc',
    fragmentShader: `
      uniform float u_time;
      varying vec2 vUv;
      void main() {
        vec2 uv = vUv;
        float wave = sin(uv.x * 5.0 + u_time * 1.5) * 0.15 + cos(uv.x * 10.0 - u_time * 0.8) * 0.08;
        float d = abs(uv.y - 0.5 - wave);
        float glow = smoothstep(0.35, 0.0, d);
        vec3 col = mix(vec3(0.01, 0.05, 0.2), vec3(0.0, 1.0, 0.65), glow);
        gl_FragColor = vec4(col + vec3(0.1, 0.0, 0.3) * sin(u_time), 0.88);
      }
    `
  },
  {
    id: 'synthwave_grid',
    name: 'Neon Cyber Chasm',
    vibe: 'Logic & Velocity',
    color: '#e879f9',
    fragmentShader: `
      uniform float u_time;
      varying vec2 vUv;
      void main() {
        vec2 uv = vUv * 2.0 - 1.0;
        float p = abs(uv.x) / (uv.y + 1.2 + 0.001);
        float gridX = step(0.92, fract(p * 6.0));
        float gridY = step(0.92, fract((1.0 / (uv.y + 1.2)) * 4.0 - u_time * 2.0));
        float grid = max(gridX, gridY) * step(-0.2, uv.y);
        vec3 col = mix(vec3(0.05, 0.0, 0.15), vec3(0.9, 0.1, 0.8), grid);
        gl_FragColor = vec4(col, 0.88);
      }
    `
  },
  {
    id: 'molten_magma',
    name: 'Basalt Pyroclast',
    vibe: 'Existence & Heat',
    color: '#ff4400',
    fragmentShader: `
      uniform float u_time;
      varying vec2 vUv;
      void main() {
        vec2 uv = vUv * 4.0;
        float n = sin(uv.x + sin(uv.y + u_time * 0.8)) * cos(uv.y + cos(uv.x + u_time * 0.6));
        float cracks = smoothstep(0.4, 0.45, abs(n));
        vec3 crust = vec3(0.08, 0.05, 0.05);
        vec3 magma = mix(vec3(1.0, 0.2, 0.0), vec3(1.0, 0.9, 0.1), cracks);
        gl_FragColor = vec4(mix(magma, crust, cracks), 0.88);
      }
    `
  },
  {
    id: 'neural_plasma',
    name: 'Omni Neural Storm',
    vibe: 'Thought & Recursion',
    color: '#38bdf8',
    fragmentShader: `
      uniform float u_time;
      varying vec2 vUv;
      void main() {
        vec2 p = vUv * 6.0 - 3.0;
        float len = length(p);
        float angle = atan(p.y, p.x);
        float v = sin(len * 3.0 - u_time * 3.0) + cos(angle * 5.0 + u_time * 2.0);
        vec3 col = 0.5 + 0.5 * cos(u_time + vec3(0.0, 2.0, 4.0) + v);
        gl_FragColor = vec4(col, 0.88);
      }
    `
  }
];

interface VoxelData {
  gridX: number;
  gridY: number;
  gridZ: number;
  worldPos: THREE.Vector3;
  pillarIndex: number;
  isSurface: boolean;
  isCore: boolean;
  activation: number;
  targetActivation: number;
  sprite?: THREE.Sprite;
}

// Glyph Sprite Texture Cache
const textureCache: Record<string, THREE.Texture> = {};
const getSpriteTexture = (text: string, color: string): THREE.Texture => {
  const cacheKey = `${text}-${color}`;
  if (!textureCache[cacheKey]) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = 'bold 72px "Segoe UI Symbol", "Apple Color Emoji", "Arial Unicode MS", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = color;
      ctx.shadowBlur = 16;
      ctx.fillText(text, 64, 66);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    textureCache[cacheKey] = texture;
  }
  return textureCache[cacheKey];
};

export const HoloCortex4D: React.FC<HoloCortex4DProps> = ({ onClose }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Resolution & Magnitude State (1^3 to 10^3)
  const [currentLevel, setCurrentLevel] = useState<number>(9); // Start on 9^3 or user choice
  const [isExploded, setIsExploded] = useState<boolean>(false);
  const [explosionFactor, setExplosionFactor] = useState<number>(0);
  const [isXRayMode, setIsXRayMode] = useState<boolean>(false);
  const [showGlyphs, setShowGlyphs] = useState<boolean>(true);
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(false); // OFF BY DEFAULT so user controls it!

  // Compiz Camera & Workspace State
  const [activeFaceIdx, setActiveFaceIdx] = useState<number>(0); // 0: Front, 1: Right, 2: Back, 3: Left
  const [isLockedIn, setIsLockedIn] = useState<boolean>(false);
  const [isGluedWindow, setIsGluedWindow] = useState<boolean>(false);
  const [activeShaderId, setActiveShaderId] = useState<string | null>(null);

  // Natural Language & Synthesis
  const [queryText, setQueryText] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisText, setSynthesisText] = useState<string | null>(null);

  // CFE Telemetry
  const cfeRef = useRef<CausalFeedbackEngine>(new CausalFeedbackEngine('⚭'));
  const [cfeDisplay, setCfeDisplay] = useState<CFEState>(cfeRef.current.getState());

  const [activeTelemetry, setActiveTelemetry] = useState<{
    dominant: string[];
    vectors: string[];
    spatialState: string;
    levelUsed: number;
    firingCount: number;
  } | null>(null);

  // Engine Refs
  const engine = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    rootPivot: THREE.Group;
    cubeGroup: THREE.Group;
    glyphGroup: THREE.Group;
    synapseGroup: THREE.Group;
    faceScreenMesh: THREE.Mesh | null;
    voxels: VoxelData[];
    instancedMesh: THREE.InstancedMesh | null;
    dummy: THREE.Object3D;
    colorHelper: THREE.Color;
    synapseLines: THREE.Line[];
    orbitSpherical: { radius: number; theta: number; phi: number };
    isDragging: boolean;
    prevMouse: { x: number; y: number };
    mouseOmega: number;
    currentYaw: number;
    targetYaw: number;
    targetCamPos: THREE.Vector3;
    targetCamLook: THREE.Vector3;
    currentCamLook: THREE.Vector3;
    shaderMaterial: THREE.ShaderMaterial;
    videoTexture: THREE.VideoTexture | null;
  }>({} as any);

  const activeLevelInfo = useMemo(() => {
    return COGNITIVE_LEVELS.find(l => l.level === currentLevel) || COGNITIVE_LEVELS[2];
  }, [currentLevel]);

  // Audio Synth
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playSound = useCallback((type: 'spin' | 'lock') => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      if (type === 'spin') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.25);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.setValueAtTime(840, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      }
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }, []);

  // Spin Workspace Face (Ctrl + Left/Right or 1-4)
  const setWorkspace = useCallback((idx: number) => {
    const wrapped = ((idx % 4) + 4) % 4;
    setActiveFaceIdx(wrapped);
    if (engine.current) {
      engine.current.targetYaw = -wrapped * (Math.PI / 2);
    }
    playSound('spin');
  }, [playSound]);

  // Toggle Spacebar Lock-In
  const toggleLockIn = useCallback(() => {
    setIsLockedIn(prev => {
      playSound('lock');
      return !prev;
    });
  }, [playSound]);

  // Rebuild the N^3 Voxel Cube with Concentric Shells & Holographic Pillar Glyphs
  const rebuildVoxelCube = useCallback((n: number, xRay: boolean, renderGlyphs: boolean) => {
    const eng = engine.current;
    if (!eng || !eng.scene || !eng.cubeGroup || !eng.glyphGroup) return;

    // Clear previous instanced mesh
    if (eng.instancedMesh) {
      eng.cubeGroup.remove(eng.instancedMesh);
      eng.instancedMesh.geometry.dispose();
      (eng.instancedMesh.material as THREE.Material).dispose();
      eng.instancedMesh = null;
    }

    // Clear previous glyph sprites
    while (eng.glyphGroup.children.length > 0) {
      const child = eng.glyphGroup.children[0];
      eng.glyphGroup.remove(child);
      if ((child as any).material) (child as any).material.dispose();
    }

    // Clear previous synapses
    while (eng.synapseGroup.children.length > 0) {
      const child = eng.synapseGroup.children[0];
      eng.synapseGroup.remove(child);
      if ((child as any).geometry) (child as any).geometry.dispose();
      if ((child as any).material) (child as any).material.dispose();
    }
    eng.synapseLines = [];

    const totalVoxels = n * n * n;
    const voxelList: VoxelData[] = [];
    const spacing = 1.35;
    const offset = (n - 1) / 2;

    const baseBoxGeo = new THREE.BoxGeometry(1.0, 1.0, 1.0);

    // Custom Translucent / Emissive PBR Glass Voxel
    const boxMat = new THREE.MeshPhysicalMaterial({
      roughness: 0.15,
      metalness: 0.1,
      transmission: xRay ? 0.9 : 0.55,
      thickness: 1.0,
      transparent: true,
      opacity: xRay ? 0.35 : 0.85,
      ior: 1.45,
      wireframe: false
    });

    const instancedMesh = new THREE.InstancedMesh(baseBoxGeo, boxMat, totalVoxels);
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    let idx = 0;
    const dummy = eng.dummy;
    const colorHelper = eng.colorHelper;

    for (let x = 0; x < n; x++) {
      for (let y = 0; y < n; y++) {
        for (let z = 0; z < n; z++) {
          const dx = x - offset;
          const dy = y - offset;
          const dz = z - offset;

          const isSurface = (x === 0 || x === n - 1 || y === 0 || y === n - 1 || z === 0 || z === n - 1);
          const isCore = !isSurface;

          // Assign topological Pillar based on Euclidean distance from observer center (Concentric Shells!)
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const maxDist = Math.sqrt(3 * offset * offset) || 1;
          const normalizedDist = dist / maxDist;
          const pillarIdx = Math.min(9, Math.floor(normalizedDist * 10));

          const basePillar = MYOS_PILLARS[pillarIdx] || MYOS_PILLARS[0];
          const worldPos = new THREE.Vector3(dx * spacing, dy * spacing, dz * spacing);

          // Create Holographic Glyph Sprite for Surface or Anchor Voxels
          let sprite: THREE.Sprite | undefined = undefined;
          if (renderGlyphs) {
            const shouldRenderSprite = (n <= 4) ? true : (isSurface && (x % 2 === 0 && y % 2 === 0 && z % 2 === 0));
            if (shouldRenderSprite) {
              const spriteMat = new THREE.SpriteMaterial({
                map: getSpriteTexture(basePillar.glyph, basePillar.color),
                transparent: true,
                opacity: 0.85,
                depthWrite: false
              });
              sprite = new THREE.Sprite(spriteMat);
              sprite.position.copy(worldPos);
              const spriteScale = Math.max(0.7, 1.25 - n * 0.05);
              sprite.scale.set(spriteScale, spriteScale, 1);
              eng.glyphGroup.add(sprite);
            }
          }

          const vData: VoxelData = {
            gridX: x,
            gridY: y,
            gridZ: z,
            worldPos,
            pillarIndex: pillarIdx,
            isSurface,
            isCore,
            activation: 0.25, // Keep concentric colors vividly visible at rest!
            targetActivation: 0.25,
            sprite
          };

          voxelList.push(vData);

          dummy.position.copy(worldPos);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          instancedMesh.setMatrixAt(idx, dummy.matrix);

          colorHelper.set(basePillar.color);
          instancedMesh.setColorAt(idx, colorHelper);

          idx++;
        }
      }
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;

    eng.instancedMesh = instancedMesh;
    eng.voxels = voxelList;
    eng.cubeGroup.add(instancedMesh);

    // Position the Active Facet Screen Plane flush with the front face of the N^3 Voxel Cube
    const halfSpan = ((n - 1) * spacing) / 2 + 0.55;
    const fullSpan = Math.max(1.35, n * spacing);
    if (eng.faceScreenMesh) {
      eng.faceScreenMesh.position.set(0, 0, halfSpan);
      eng.faceScreenMesh.scale.set(fullSpan, fullSpan * 0.75, 1); // 4:3 / 16:9 screen aspect on the facet
    }

    // Adjust Orbital Camera Radius based on N^3 Cube Size
    eng.orbitSpherical.radius = Math.max(10, n * 3.4);
  }, []);

  // Fire Synaptic Pathways between Voxels
  const fireSynapses = useCallback((level: number, dominantPillarIdxA: number, dominantPillarIdxB: number) => {
    const eng = engine.current;
    if (!eng || !eng.instancedMesh || eng.voxels.length === 0) return;

    while (eng.synapseGroup.children.length > 0) {
      const child = eng.synapseGroup.children[0];
      eng.synapseGroup.remove(child);
      if ((child as any).geometry) (child as any).geometry.dispose();
      if ((child as any).material) (child as any).material.dispose();
    }
    eng.synapseLines = [];

    const candidatesA = eng.voxels.filter(v => v.pillarIndex === dominantPillarIdxA);
    const candidatesB = eng.voxels.filter(v => v.pillarIndex === dominantPillarIdxB);

    const firingVoxels: VoxelData[] = [];

    eng.voxels.forEach(v => {
      if (v.pillarIndex === dominantPillarIdxA || v.pillarIndex === dominantPillarIdxB) {
        v.targetActivation = 1.0;
        if (v.sprite) {
          v.sprite.material.opacity = 1.0;
        }
        firingVoxels.push(v);
      } else {
        v.targetActivation = 0.2;
        if (v.sprite) v.sprite.material.opacity = 0.45;
      }
    });

    const sampleA = candidatesA.slice(0, Math.min(candidatesA.length, 8));
    const sampleB = candidatesB.slice(0, Math.min(candidatesB.length, 8));

    sampleA.forEach((vA, i) => {
      const vB = sampleB[i % sampleB.length] || sampleA[0];
      const pA = vA.worldPos;
      const pB = vB.worldPos;

      const mid = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);
      mid.y += (Math.random() - 0.5) * 2.5;
      mid.x += (Math.random() - 0.5) * 2.5;

      const curve = new THREE.QuadraticBezierCurve3(pA, mid, pB);
      const points = curve.getPoints(24);
      const geo = new THREE.BufferGeometry().setFromPoints(points);

      const mat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.95,
        linewidth: 2
      });

      const line = new THREE.Line(geo, mat);
      eng.synapseGroup.add(line);
      eng.synapseLines.push(line);
    });

    setActiveTelemetry(prev => ({
      dominant: prev?.dominant || ['Self', 'Omniscience'],
      vectors: prev?.vectors || ['Logic → Dimensionally Fold → Existence'],
      spatialState: prev?.spatialState || 'Hyper-Resonant',
      levelUsed: level,
      firingCount: firingVoxels.length
    }));
  }, []);

  // Three.js Mount Setup with holo_window.html Camera Rig + Morning Voxel Cortex
  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#030207');
    scene.fog = new THREE.FogExp2('#030207', 0.015);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    mountRef.current.appendChild(renderer.domElement);

    const rootPivot = new THREE.Group();
    const cubeGroup = new THREE.Group();
    const glyphGroup = new THREE.Group();
    const synapseGroup = new THREE.Group();

    rootPivot.add(cubeGroup);
    rootPivot.add(glyphGroup);
    rootPivot.add(synapseGroup);
    scene.add(rootPivot);

    // Front Facet Screen Overlay (for Glued Windows App or JIT Shader)
    const screenGeo = new THREE.PlaneGeometry(1, 1);
    const screenMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
      visible: false
    });
    const faceScreenMesh = new THREE.Mesh(screenGeo, screenMat);
    rootPivot.add(faceScreenMesh);

    // Deep Cosmic Starfield
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 1000;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
      starPositions[i] = (Math.random() - 0.5) * 250;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x818cf8, size: 0.8, transparent: true, opacity: 0.35 });
    const starPoints = new THREE.Points(starsGeo, starMat);
    scene.add(starPoints);

    // Studio Lighting for Glass Voxels
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const light1 = new THREE.DirectionalLight(0x38bdf8, 2.5);
    light1.position.set(15, 25, 20);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xe879f9, 2.0);
    light2.position.set(-20, -15, -15);
    scene.add(light2);

    const pointLight = new THREE.PointLight(0xffffff, 3.0, 50);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // Orbital Camera Parameters (from holo_window.html)
    const orbitSpherical = { radius: 28, theta: 0.45, phi: Math.PI / 2.4 };
    const targetCamPos = new THREE.Vector3();
    const targetCamLook = new THREE.Vector3(0, 0, 0);
    const currentCamLook = new THREE.Vector3(0, 0, 0);

    const updateOrbitalTarget = () => {
      targetCamPos.x = orbitSpherical.radius * Math.sin(orbitSpherical.phi) * Math.sin(orbitSpherical.theta);
      targetCamPos.y = orbitSpherical.radius * Math.cos(orbitSpherical.phi);
      targetCamPos.z = orbitSpherical.radius * Math.sin(orbitSpherical.phi) * Math.cos(orbitSpherical.theta);
    };
    updateOrbitalTarget();
    camera.position.copy(targetCamPos);

    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms: { u_time: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: JIT_SHADERS[0].fragmentShader,
      transparent: true
    });

    engine.current = {
      scene,
      camera,
      renderer,
      rootPivot,
      cubeGroup,
      glyphGroup,
      synapseGroup,
      faceScreenMesh,
      voxels: [],
      instancedMesh: null,
      dummy: new THREE.Object3D(),
      colorHelper: new THREE.Color(),
      synapseLines: [],
      orbitSpherical,
      isDragging: false,
      prevMouse: { x: 0, y: 0 },
      mouseOmega: 0,
      currentYaw: 0,
      targetYaw: 0,
      targetCamPos,
      targetCamLook,
      currentCamLook,
      shaderMaterial,
      videoTexture: null
    };

    // Mouse Drag Spherical Orbit
    const onMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).tagName !== 'INPUT') {
        engine.current.isDragging = true;
        engine.current.prevMouse = { x: e.clientX, y: e.clientY };
      }
    };
    const onMouseUp = () => {
      engine.current.isDragging = false;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!engine.current.isDragging || isLockedIn) return;
      const dx = e.clientX - engine.current.prevMouse.x;
      const dy = e.clientY - engine.current.prevMouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      engine.current.mouseOmega = Math.min(engine.current.mouseOmega + dist * 0.04, 4.0);
      orbitSpherical.theta -= dx * 0.006;
      orbitSpherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, orbitSpherical.phi - dy * 0.006));
      engine.current.prevMouse = { x: e.clientX, y: e.clientY };
      updateOrbitalTarget();
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Shift + Wheel changes N^3 cognitive resolution level (1^3 to 10^3)!
      if (e.shiftKey) {
        if (e.deltaY < 0) {
          setCurrentLevel(l => Math.min(10, l + 1));
        } else {
          setCurrentLevel(l => Math.max(1, l - 1));
        }
      } else if (!isLockedIn) {
        orbitSpherical.radius = Math.max(5.0, Math.min(65.0, orbitSpherical.radius + e.deltaY * 0.02));
        updateOrbitalTarget();
      }
    };
    const onResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    dom.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('resize', onResize);

    // Initial Build
    rebuildVoxelCube(currentLevel, isXRayMode, showGlyphs);

    // Animation Render Loop
    let animId: number;
    let lastTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - lastTime) * 0.001, 0.1);
      lastTime = now;

      const eng = engine.current;
      if (!eng || !eng.renderer) return;

      // Step CFE Physics
      const cfeState = cfeRef.current.step(dt);
      setCfeDisplay(cfeState);

      if (eng.shaderMaterial) {
        eng.shaderMaterial.uniforms.u_time.value = now * 0.001;
      }

      // Smooth Compiz Yaw Spin
      eng.currentYaw += (eng.targetYaw - eng.currentYaw) * 0.12;
      rootPivot.rotation.y = eng.currentYaw;

      // Optional Auto Rotation
      if (isAutoRotate && !eng.isDragging && !isLockedIn) {
        orbitSpherical.theta += dt * 0.2;
        updateOrbitalTarget();
      }

      // Kinetic Compiz Dolly & Camera Lock-In
      eng.mouseOmega *= 0.88;
      const yawDelta = Math.abs(eng.targetYaw - eng.currentYaw);
      const totalOmega = yawDelta * 3.8 + eng.mouseOmega;
      const dollyOffset = 3.5 * Math.tanh(totalOmega * 0.45);

      if (isLockedIn) {
        const spacing = 1.35;
        const halfSpan = ((currentLevel - 1) * spacing) / 2;
        const lockDist = halfSpan + Math.max(4.5, currentLevel * 1.45);
        const lockPullback = 2.0 * Math.tanh(yawDelta * 3.2);
        targetCamPos.set(0, 0, lockDist + lockPullback);
        targetCamLook.set(0, 0, 0);
      } else {
        const effectiveRadius = orbitSpherical.radius + dollyOffset;
        targetCamPos.x = effectiveRadius * Math.sin(orbitSpherical.phi) * Math.sin(orbitSpherical.theta);
        targetCamPos.y = effectiveRadius * Math.cos(orbitSpherical.phi);
        targetCamPos.z = effectiveRadius * Math.sin(orbitSpherical.phi) * Math.cos(orbitSpherical.theta);
        targetCamLook.set(0, 0, 0);
      }

      camera.position.lerp(targetCamPos, 0.08);
      currentCamLook.lerp(targetCamLook, 0.08);
      camera.lookAt(currentCamLook);

      // Voxel Matrix Updates (Explosion & Concentric Chromatic Colors)
      if (eng.instancedMesh && eng.voxels.length > 0) {
        const dummy = eng.dummy;
        const colorHelper = eng.colorHelper;
        const exp = explosionFactor;

        eng.voxels.forEach((v, i) => {
          v.activation = THREE.MathUtils.lerp(v.activation, v.targetActivation, 0.1);

          const targetPos = v.worldPos.clone().multiplyScalar(1 + exp * 1.5);
          dummy.position.copy(targetPos);

          const baseScale = v.activation > 0.4 ? (1.0 + Math.sin(now * 0.008) * 0.15) : 1.0;
          dummy.scale.setScalar(baseScale);
          dummy.updateMatrix();
          eng.instancedMesh!.setMatrixAt(i, dummy.matrix);

          if (v.sprite) {
            v.sprite.position.copy(targetPos);
          }

          const p = MYOS_PILLARS[v.pillarIndex];
          if (v.activation > 0.35) {
            colorHelper.set(p.color);
            colorHelper.offsetHSL(0, 0, v.activation * 0.35);
          } else {
            colorHelper.set(p.color).multiplyScalar(0.65); // Keep concentric shell colors rich and distinct!
          }
          eng.instancedMesh!.setColorAt(i, colorHelper);
        });

        eng.instancedMesh.instanceMatrix.needsUpdate = true;
        if (eng.instancedMesh.instanceColor) eng.instancedMesh.instanceColor.needsUpdate = true;
      }

      // Pulse Synapse Lines
      eng.synapseLines.forEach((line, i) => {
        const mat = line.material as THREE.LineBasicMaterial;
        mat.opacity = 0.5 + Math.sin(now * 0.006 + i) * 0.45;
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      if (mountRef.current && dom.parentNode === mountRef.current) {
        mountRef.current.removeChild(dom);
      }
      renderer.dispose();
    };
  }, [currentLevel, isAutoRotate, isLockedIn, explosionFactor, rebuildVoxelCube]);

  // Global Keyboard Controls (Spacebar Lock-In, Ctrl+Left/Right Spin)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }
      if (e.ctrlKey && e.key === 'ArrowRight') {
        e.preventDefault();
        setWorkspace(activeFaceIdx + 1);
      } else if (e.ctrlKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        setWorkspace(activeFaceIdx - 1);
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        toggleLockIn();
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        setWorkspace(parseInt(e.key) - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFaceIdx, setWorkspace, toggleLockIn]);

  // Re-run build when level, X-Ray, or glyph visibility changes
  useEffect(() => {
    rebuildVoxelCube(currentLevel, isXRayMode, showGlyphs);
  }, [currentLevel, isXRayMode, showGlyphs, rebuildVoxelCube]);

  // Handle Explosion Factor Animation
  useEffect(() => {
    let frameId: number;
    const target = isExploded ? 1.0 : 0.0;
    const updateExplosion = () => {
      setExplosionFactor(prev => {
        const next = THREE.MathUtils.lerp(prev, target, 0.1);
        if (Math.abs(next - target) < 0.005) return target;
        frameId = requestAnimationFrame(updateExplosion);
        return next;
      });
    };
    frameId = requestAnimationFrame(updateExplosion);
    return () => cancelAnimationFrame(frameId);
  }, [isExploded]);

  // Glue Windows App onto the Voxel Cube Front Surface
  const handleGlueWindowsApp = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'window' },
        audio: false
      });

      const video = document.createElement('video');
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      video.srcObject = stream;
      await video.play();

      const videoTex = new THREE.VideoTexture(video);
      videoTex.minFilter = THREE.LinearFilter;
      videoTex.magFilter = THREE.LinearFilter;

      engine.current.videoTexture = videoTex;
      setIsGluedWindow(true);
      setActiveShaderId(null);

      if (engine.current.faceScreenMesh) {
        const mesh = engine.current.faceScreenMesh;
        mesh.material = new THREE.MeshBasicMaterial({
          map: videoTex,
          side: THREE.DoubleSide
        });
        mesh.visible = true;
      }
      playSound('lock');
    } catch (err) {
      console.warn("Screen capture cancelled:", err);
    }
  };

  // Apply Procedural JIT Shader onto the Voxel Cube Front Surface
  const handleSelectShader = (shader: JITShaderDef) => {
    const eng = engine.current;
    if (!eng || !eng.faceScreenMesh) return;

    if (activeShaderId === shader.id) {
      // Toggle off if clicked again
      setActiveShaderId(null);
      eng.faceScreenMesh.visible = false;
      return;
    }

    setActiveShaderId(shader.id);
    setIsGluedWindow(false);
    eng.shaderMaterial.fragmentShader = shader.fragmentShader;
    eng.shaderMaterial.needsUpdate = true;
    eng.faceScreenMesh.material = eng.shaderMaterial;
    eng.faceScreenMesh.visible = true;
    playSound('lock');
  };

  // Submit Natural Language Query to Local Ollama & Trigger Adaptive Level
  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim() || isSynthesizing) return;

    setIsSynthesizing(true);
    setSynthesisText(null);

    try {
      const telemetry = await queryCognitiveMatrix(queryText, partial => {
        setSynthesisText(partial);
      });

      let idxA = 0; // Self
      let idxB = 2; // Logic
      if (telemetry.dominant && telemetry.dominant.length >= 2) {
        const foundA = MYOS_PILLARS.findIndex(p => p.name.toLowerCase() === telemetry.dominant[0].toLowerCase());
        const foundB = MYOS_PILLARS.findIndex(p => p.name.toLowerCase() === telemetry.dominant[1].toLowerCase());
        if (foundA !== -1) idxA = foundA;
        if (foundB !== -1) idxB = foundB;
      }

      let adaptiveLevel = currentLevel;
      if (queryText.length > 80 || (telemetry.vectors && telemetry.vectors.length > 2)) {
        adaptiveLevel = Math.min(10, Math.max(currentLevel, 6));
      } else if (queryText.length < 25) {
        adaptiveLevel = Math.max(1, Math.min(currentLevel, 3));
      }

      if (adaptiveLevel !== currentLevel) {
        setCurrentLevel(adaptiveLevel);
      }

      setTimeout(() => {
        fireSynapses(adaptiveLevel, idxA, idxB);
      }, 50);

      setActiveTelemetry({
        dominant: telemetry.dominant || ['Self', 'Logic'],
        vectors: telemetry.vectors || ['Self → Direct → Logic'],
        spatialState: telemetry.spatialState || 'Active Coherence',
        levelUsed: adaptiveLevel,
        firingCount: 0
      });
      setSynthesisText(telemetry.synthesis);
    } catch (err) {
      console.error("Adaptive Voxel Cortex Query Failed:", err);
      setSynthesisText("Cognitive synthesis failed. Check local Ollama status.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#030207] font-mono select-none">
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="absolute inset-0 z-0 pointer-events-auto cursor-grab active:cursor-grabbing" />

      {/* Spatial HUD Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none p-6 flex flex-col justify-between">
        {/* Top Control Header */}
        <div className="flex justify-between items-start gap-4">
          {/* Left Panel: Adaptive Voxel Cortex // N^3 Scale (1^3 to 10^3) */}
          <div className="bg-[#0b0914]/90 backdrop-blur-md p-5 rounded-2xl border border-purple-500/30 max-w-lg shadow-2xl pointer-events-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-widest font-extrabold bg-gradient-to-r from-orange-400 via-sky-400 to-pink-400 bg-clip-text text-transparent">
                Adaptive Voxel Cortex // N³ Scale
              </span>
              <span className="text-[11px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2.5 py-0.5 rounded-full font-bold">
                {activeLevelInfo.level}³ = {activeLevelInfo.voxels} Voxels
              </span>
            </div>

            <div className="flex items-center gap-3 my-2">
              <span className="text-3xl" style={{ color: activeLevelInfo.color }}>{activeLevelInfo.glyph}</span>
              <div>
                <div className="text-sm font-bold text-white">Level {activeLevelInfo.level}: {activeLevelInfo.name}</div>
                <div className="text-[11px] text-slate-400 leading-tight">{activeLevelInfo.description}</div>
              </div>
            </div>

            {/* Magnification Step Slider (1^3 to 10^3) */}
            <div className="mt-4 pt-3 border-t border-purple-500/20">
              <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-bold">
                <span>1³ (Self)</span>
                <span>5³ (Existence)</span>
                <span>10³ (Omniscience)</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={currentLevel}
                onChange={e => setCurrentLevel(parseInt(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
              />
            </div>

            {/* Row 1: Core Voxel Controls */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setIsExploded(prev => !prev)}
                className={`flex-1 text-xs py-1.5 px-3 rounded-lg border font-bold transition-all ${
                  isExploded
                    ? 'bg-sky-500/30 border-sky-400 text-sky-200'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                💥 {isExploded ? 'Implode Cube' : 'Explode Core'}
              </button>
              <button
                onClick={() => setIsXRayMode(prev => !prev)}
                className={`flex-1 text-xs py-1.5 px-3 rounded-lg border font-bold transition-all ${
                  isXRayMode
                    ? 'bg-purple-500/30 border-purple-400 text-purple-200'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                🔬 {isXRayMode ? 'Solid Mode' : 'X-Ray Glass'}
              </button>
              <button
                onClick={() => setShowGlyphs(prev => !prev)}
                className={`text-xs py-1.5 px-3 rounded-lg border font-bold transition-all ${
                  showGlyphs
                    ? 'bg-amber-500/30 border-amber-400 text-amber-200'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400'
                }`}
                title="Toggle Holographic Glyphs"
              >
                {showGlyphs ? '✨ Glyphs: ON' : '✨ Glyphs: OFF'}
              </button>
              <button
                onClick={() => setIsAutoRotate(prev => !prev)}
                className={`text-xs py-1.5 px-3 rounded-lg border font-bold transition-all ${
                  isAutoRotate
                    ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400'
                }`}
                title="Toggle Auto Rotation"
              >
                🔄
              </button>
            </div>

            {/* Row 2: Compiz Workspace Lock-In & Windows Glue Controls */}
            <div className="flex gap-2 mt-2.5 pt-2.5 border-t border-purple-500/20">
              <button
                onClick={handleGlueWindowsApp}
                className="flex-1 bg-emerald-500/25 border border-emerald-400/50 hover:bg-emerald-500/40 text-emerald-200 text-xs py-1.5 px-3 rounded-lg font-bold transition-all"
              >
                📎 {isGluedWindow ? 'Window Active' : 'Glue Windows App'}
              </button>
              <button
                onClick={toggleLockIn}
                className={`flex-1 text-xs py-1.5 px-3 rounded-lg border font-bold transition-all ${
                  isLockedIn
                    ? 'bg-sky-500 border-sky-300 text-slate-950 font-extrabold'
                    : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:border-sky-400'
                }`}
              >
                🔍 {isLockedIn ? 'Unlock Orbit' : 'Lock In (Space)'}
              </button>
            </div>
          </div>

          {/* Right Telemetry & Shader Panel */}
          <div className="bg-[#0b0914]/90 backdrop-blur-md p-5 rounded-2xl border border-sky-500/30 w-84 shadow-2xl pointer-events-auto flex flex-col gap-2.5">
            <div className="flex justify-between items-center text-xs border-b border-sky-500/20 pb-2">
              <span className="text-sky-400 font-bold tracking-wider">NEURAL ACTIVATION LOG</span>
              <span className="text-[10px] text-emerald-400 font-bold">LIVE GPU</span>
            </div>

            {activeTelemetry ? (
              <div className="text-xs flex flex-col gap-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Firing Anchor:</span>
                  <span className="text-pink-400 font-bold">{activeTelemetry.dominant.join(' ⟷ ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Active Voxels:</span>
                  <span className="text-emerald-400 font-bold">{activeTelemetry.firingCount} of {activeLevelInfo.voxels}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Causal Phase:</span>
                  <span className="text-amber-400 font-bold">{cfeDisplay.phase}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">
                Awaiting cognitive trigger. Use slider or Shift+Wheel to scale N³ resolution (1³ to 10³).
              </div>
            )}

            {/* JIT Shaders */}
            <div className="border-t border-sky-500/20 pt-2">
              <div className="text-[10px] text-sky-400 font-bold uppercase mb-1.5">JIT Procedural Shaders (Click to Toggle)</div>
              <div className="grid grid-cols-2 gap-1.5">
                {JIT_SHADERS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectShader(s)}
                    className={`text-left p-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                      activeShaderId === s.id
                        ? 'bg-sky-500/30 border-sky-400 text-white'
                        : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="truncate">{s.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-2 flex flex-col gap-0.5">
              <span><b>Shift + Wheel:</b> Change N³ Resolution (1³–10³)</span>
              <span><b>Spacebar:</b> Lock-In View | <b>Ctrl+←/→:</b> Spin Face</span>
            </div>
          </div>
        </div>

        {/* Bottom Dialogue / Thought Synthesis Input */}
        <div className="flex flex-col items-center gap-3 w-full max-w-3xl mx-auto pointer-events-auto">
          {synthesisText && (
            <div className="w-full bg-[#0b0914]/95 backdrop-blur-md p-4 rounded-2xl border border-pink-500/40 text-xs text-slate-200 shadow-2xl max-h-48 overflow-y-auto">
              <div className="text-[10px] font-bold text-pink-400 tracking-wider uppercase mb-1">
                Cognitive Synthesis (Resolution {activeLevelInfo.level}³):
              </div>
              <div className="whitespace-pre-wrap leading-relaxed">{synthesisText}</div>
            </div>
          )}

          <form onSubmit={handleQuery} className="w-full flex gap-2">
            <input
              type="text"
              value={queryText}
              onChange={e => setQueryText(e.target.value)}
              placeholder="Inject thought into Voxel Cortex (e.g. 'What is 2+2?' vs 'How does Self transcend into Omniscience?')"
              className="flex-1 bg-black/80 border border-purple-500/40 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 backdrop-blur-md shadow-inner"
            />
            <button
              type="submit"
              disabled={isSynthesizing}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-lg hover:shadow-purple-500/50"
            >
              {isSynthesizing ? 'Firing...' : 'Fire Synapse'}
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-3 rounded-xl text-sm transition-all"
              >
                Exit
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
