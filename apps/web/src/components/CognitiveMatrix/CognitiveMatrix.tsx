import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import {
  MYOS_PILLARS,
  PILLAR_BY_ID,
  getStateForCoordinate,
  getRelationalVector,
  type PillarNode
} from './ontologyMatrix';
import { queryCognitiveMatrix, type CognitiveTelemetry } from '../MaxOverlay/localLlmService';
import {
  CausalFeedbackEngine,
  CFEPhase,
  type CFEState
} from './causalFeedbackEngine';

interface NodeUserData extends PillarNode {
  coord: [number, number, number];
  seed: number;
  isNode: boolean;
}

interface VectorUserData {
  isVector: boolean;
  verb: string;
  fromName: string;
  fromId: string;
  fromColor: string;
  toName: string;
  toId: string;
  toColor: string;
  baseColor: number;
}

interface CognitiveMatrixProps {
  onClose?: () => void;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#07060b',
    overflow: 'hidden',
    position: 'relative',
    fontFamily: '"JetBrains Mono", "Fira Code", monospace'
  },
  canvasContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%'
  },
  uiOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    padding: '24px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    zIndex: 10
  },
  header: {
    pointerEvents: 'auto',
    background: 'rgba(12, 10, 20, 0.92)',
    padding: '20px 24px',
    borderRadius: '12px',
    border: '1px solid rgba(138, 75, 255, 0.4)',
    maxWidth: '540px',
    maxHeight: '90vh',
    overflowY: 'auto',
    backdropFilter: 'blur(16px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7)'
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px'
  },
  title: {
    margin: 0,
    fontSize: '17px',
    fontWeight: 800,
    letterSpacing: '2.5px',
    textTransform: 'uppercase',
    background: 'linear-gradient(135deg, #a78bfa, #38bdf8, #f472b6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  badge: {
    fontSize: '10px',
    padding: '3px 8px',
    borderRadius: '999px',
    background: 'rgba(56, 189, 248, 0.15)',
    border: '1px solid rgba(56, 189, 248, 0.4)',
    color: '#38bdf8',
    fontWeight: 'bold'
  },
  paragraph: {
    margin: '0 0 10px 0',
    fontSize: '12px',
    color: '#cbd5e1',
    lineHeight: '1.5'
  },
  hud: {
    pointerEvents: 'auto',
    background: 'rgba(12, 10, 20, 0.92)',
    padding: '18px 22px',
    borderRadius: '12px',
    border: '1px solid rgba(56, 189, 248, 0.4)',
    alignSelf: 'flex-end',
    width: '380px',
    backdropFilter: 'blur(16px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7)'
  },
  strainGaugePanel: {
    marginTop: '12px',
    padding: '12px 14px',
    background: 'rgba(15, 23, 42, 0.9)',
    borderRadius: '8px',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'
  },
  controlsPanel: {
    marginTop: '12px',
    padding: '10px 14px',
    background: 'rgba(0, 0, 0, 0.5)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  controlsRow: {
    display: 'flex',
    gap: '6px',
    marginTop: '6px'
  },
  button: {
    flex: 1,
    background: 'rgba(167, 139, 250, 0.15)',
    border: '1px solid rgba(167, 139, 250, 0.4)',
    color: '#c4b5fd',
    padding: '6px 10px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '11px',
    borderRadius: '6px',
    transition: 'all 0.15s ease',
    fontWeight: 'bold'
  },
  buttonSecondary: {
    flex: 1,
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: '#94a3b8',
    padding: '5px 8px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '10px',
    borderRadius: '6px',
    transition: 'all 0.15s ease'
  },
  queryInput: {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(0, 0, 0, 0.65)',
    border: '1px solid rgba(56, 189, 248, 0.35)',
    borderRadius: '6px',
    color: '#f8fafc',
    fontSize: '12px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    outline: 'none',
    marginTop: '6px'
  },
  resolutionCard: {
    marginTop: '12px',
    padding: '14px 16px',
    background: 'rgba(15, 23, 42, 0.95)',
    border: '1px solid rgba(167, 139, 250, 0.5)',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.6)'
  }
};

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
      ctx.font = 'bold 64px "Segoe UI Symbol", "Apple Color Emoji", "Arial Unicode MS", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
      ctx.fillText(text, 64, 66);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    textureCache[cacheKey] = texture;
  }
  return textureCache[cacheKey];
};

const createTextSprite = (text: string, color: string): THREE.Sprite => {
  const material = new THREE.SpriteMaterial({
    map: getSpriteTexture(text, color),
    transparent: true,
    depthWrite: false
  });
  return new THREE.Sprite(material);
};

export const CognitiveMatrix: React.FC<CognitiveMatrixProps> = ({ onClose }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState<[number, number, number]>([0, 0, 0]);
  const [queryText, setQueryText] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisText, setSynthesisText] = useState<string | null>(null);

  // Causal Feedback Engine (CFE) Reactive State for HUD
  const cfeRef = useRef<CausalFeedbackEngine>(new CausalFeedbackEngine('⚭'));
  const [cfeDisplay, setCfeDisplay] = useState<CFEState>(cfeRef.current.getState());

  const [activeTelemetry, setActiveTelemetry] = useState<{
    dominant: string[];
    dominantIds: [string, string];
    vectors: string[];
    spatialState: string;
  } | null>(null);

  const engine = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    group: THREE.Group;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
    isDragging: boolean;
    prevMouse: { x: number; y: number };
    currentLookAt: THREE.Vector3;
    targetLookAt: THREE.Vector3;
    baseTargetCamPos: THREE.Vector3;
    targetCamPos: THREE.Vector3;
    activePillarIds: [string, string] | null;
    nodes: Array<{
      id: string;
      pos: THREE.Vector3;
      mesh: THREE.Mesh;
      sprite: THREE.Sprite;
      baseGlyph: string;
      baseColor: string;
    }>;
    lines: Array<{
      line: THREE.Line;
      fromId: string;
      toId: string;
      baseColor: number;
      posA: THREE.Vector3;
      posB: THREE.Vector3;
      segments: number;
    }>;
  } | null>(null);

  const updateHud = useCallback((data: any) => {
    if (!hudRef.current) return;
    if (!data) {
      hudRef.current.innerHTML = `
        <div style="font-size: 10px; color: #64748b; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 6px;">COGNITIVE LATENT FIELD</div>
        <div style="font-size: 13px; color: #94a3b8; font-style: italic;">Hover over a Pillar Node or Vector Beam to inspect...</div>
      `;
      return;
    }

    if (data.isVector) {
      hudRef.current.innerHTML = `
        <div style="font-size: 10px; color: #38bdf8; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px; font-weight: bold;">RELATIONAL VECTOR</div>
        <div style="font-size: 20px; font-weight: 900; color: #ffffff; margin-bottom: 8px;">${data.verb}</div>
        <div style="display: flex; align-items: center; gap: 8px; font-size: 13px;">
          <span style="color: ${data.fromColor}; font-weight: bold;">${data.fromName}</span>
          <span style="color: #64748b;">➔</span>
          <span style="color: ${data.toColor}; font-weight: bold;">${data.toName}</span>
        </div>
      `;
      return;
    }

    hudRef.current.innerHTML = `
      <div style="font-size: 10px; color: #a78bfa; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 6px;">
        NODE IDENTIFIER: [${data.coord[0]}, ${data.coord[1]}, ${data.coord[2]}]
      </div>
      <div style="display: flex; align-items: baseline; gap: 12px; margin-bottom: 8px;">
        <span style="font-size: 38px; color: ${data.color}; line-height: 1;">${data.glyph}</span>
        <div>
          <div style="font-size: 17px; font-weight: 800; color: #ffffff;">${data.name}</div>
          <div style="font-size: 11px; color: #38bdf8;">${data.aiRole}</div>
        </div>
      </div>
      <div style="font-size: 12px; color: #cbd5e1; line-height: 1.4; margin-bottom: 10px;">${data.desc}</div>
      <div style="font-size: 10px; color: #64748b; font-style: italic; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 6px;">
        Alchemical Analog: ${data.alchemicalEquiv || 'None'} • HASH: 0x${(data.seed >>> 0).toString(16).toUpperCase()}
      </div>
    `;
  }, []);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#07060b');
    scene.fog = new THREE.FogExp2('#07060b', 0.035);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const initialCamPos = new THREE.Vector3(18, 14, 22);
    camera.position.copy(initialCamPos);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // Starfield Background
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 600;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
      starPositions[i] = (Math.random() - 0.5) * 200;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMat = new THREE.PointsMaterial({
      color: 0x818cf8,
      size: 0.8,
      transparent: true,
      opacity: 0.4
    });
    const starField = new THREE.Points(starsGeo, starsMat);
    scene.add(starField);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const pointLight = new THREE.PointLight(0xa78bfa, 2.2, 80);
    pointLight.position.set(10, 20, 15);
    scene.add(pointLight);

    const raycaster = new THREE.Raycaster();
    raycaster.params.Line = { threshold: 0.6 };
    const mouse = new THREE.Vector2(-2, -2);
    let hoveredObject: THREE.Object3D | null = null;

    engine.current = {
      scene,
      camera,
      renderer,
      group,
      raycaster,
      mouse,
      isDragging: false,
      prevMouse: { x: 0, y: 0 },
      currentLookAt: new THREE.Vector3(0, 0, 0),
      targetLookAt: new THREE.Vector3(0, 0, 0),
      baseTargetCamPos: initialCamPos.clone(),
      targetCamPos: initialCamPos.clone(),
      activePillarIds: null,
      nodes: [],
      lines: []
    };

    const onMouseDown = (e: MouseEvent) => {
      if (engine.current) {
        engine.current.isDragging = true;
        engine.current.prevMouse = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseUp = () => {
      if (engine.current) engine.current.isDragging = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!engine.current || !mountRef.current) return;
      const rect = renderer.domElement.getBoundingClientRect();
      engine.current.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      engine.current.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (engine.current.isDragging) {
        const deltaX = e.clientX - engine.current.prevMouse.x;
        const deltaY = e.clientY - engine.current.prevMouse.y;
        group.rotation.y += deltaX * 0.005;
        group.rotation.x += deltaY * 0.005;
        engine.current.prevMouse = { x: e.clientX, y: e.clientY };
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.multiplyScalar(e.deltaY > 0 ? 1.05 : 0.95);
      if (engine.current) {
        engine.current.baseTargetCamPos.copy(camera.position);
        engine.current.targetCamPos.copy(camera.position);
      }
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    const onResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', onResize);

    let animationFrameId: number;
    let lastTime = performance.now();
    let lastUiSyncTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const eng = engine.current;
      if (!eng) return;

      const now = performance.now();
      const dt = Math.min(0.1, (now - lastTime) * 0.001);
      lastTime = now;
      const time = now * 0.001;

      // 1. Advance Causal Feedback Engine (CFE) Physics & Safeguards
      const cfe = cfeRef.current;
      const cfeState = cfe.step(dt);

      // Periodic throttle to sync CFE state with React HUD (10fps for HUD stability)
      if (now - lastUiSyncTime > 100) {
        setCfeDisplay(cfeState);
        lastUiSyncTime = now;
      }

      // 2. Idle rotation when not dragging
      if (!eng.isDragging) {
        group.rotation.y += 0.0006;
        group.rotation.x = Math.sin(time * 0.3) * 0.03;
      }

      // 3. Camera Spatial Lerp & Strain-Modulated Dolly Zoom
      if (eng.activePillarIds) {
        // High strain pulls the camera tighter toward the active tension corridor
        const dollyScale = 1.0 - (cfeState.sigma * 0.22);
        eng.targetCamPos.copy(eng.baseTargetCamPos).multiplyScalar(dollyScale);
      } else {
        eng.targetCamPos.copy(eng.baseTargetCamPos);
      }

      eng.currentLookAt.lerp(eng.targetLookAt, 0.045);
      camera.position.lerp(eng.targetCamPos, 0.045);
      camera.lookAt(eng.currentLookAt);

      // 4. Dynamic Node & Relational Vector Wave Dynamics
      if (eng.activePillarIds) {
        const [pA, pB] = eng.activePillarIds;

        // A. Node Transmutation Loop
        eng.nodes.forEach(n => {
          const isDominant = n.id === pA || n.id === pB;
          const boxMat = n.mesh.material as THREE.MeshBasicMaterial;

          if (isDominant) {
            const energy = CausalFeedbackEngine.getChromaticEnergy(
              n.baseColor,
              cfeState.phase,
              cfeState.sigma,
              time
            );

            boxMat.opacity = Math.min(1.0, 0.55 * energy.emissiveIntensity);
            boxMat.color.set(energy.color);
            boxMat.wireframe = true;

            // Transmute Glyph Sprite dynamically through intermediary operator states
            const activeGlyph = (cfeState.phase === CFEPhase.RESOLVED || cfeState.phase === CFEPhase.STABLE)
              ? n.baseGlyph
              : cfeState.currentGlyph;

            n.sprite.material.map = getSpriteTexture(activeGlyph, energy.color);
            n.sprite.material.needsUpdate = true;
            n.sprite.scale.set(
              3.4 * (1.0 + Math.sin(time * 6.0) * 0.15 * cfeState.sigma),
              3.4 * (1.0 + Math.sin(time * 6.0) * 0.15 * cfeState.sigma),
              1
            );
            n.sprite.material.opacity = energy.opacity;
          } else {
            // Dim non-active nodes to isolate attention
            boxMat.opacity = 0.02;
            boxMat.color.set(n.baseColor);
            n.sprite.material.map = getSpriteTexture(n.baseGlyph, n.baseColor);
            n.sprite.scale.set(2.2, 2.2, 1);
            n.sprite.material.opacity = 0.25;
          }
        });

        // B. Relational Vector Wave Perturbation Loop
        eng.lines.forEach(l => {
          const isTargetVector =
            (l.fromId === pA && l.toId === pB) || (l.fromId === pB && l.toId === pA);
          const lineMat = l.line.material as THREE.LineBasicMaterial;

          if (isTargetVector) {
            const energy = CausalFeedbackEngine.getChromaticEnergy(
              '#ffffff',
              cfeState.phase,
              cfeState.sigma,
              time
            );

            lineMat.opacity = energy.opacity;
            lineMat.color.set(energy.color);

            // Compute dynamic standing wave perturbation on line vertices
            const posAttr = l.line.geometry.getAttribute('position') as THREE.BufferAttribute;
            const dir = l.posB.clone().sub(l.posA).normalize();
            const up = Math.abs(dir.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
            const normal = new THREE.Vector3().crossVectors(dir, up).normalize();

            for (let s = 0; s <= l.segments; s++) {
              const normT = s / l.segments;
              const basePos = l.posA.clone().lerp(l.posB, normT);
              const disp = CausalFeedbackEngine.calculateWaveDisplacement(
                normT,
                time,
                cfeState.sigma,
                cfeState.activeFrequencyHz
              );
              posAttr.setXYZ(
                s,
                basePos.x + normal.x * disp,
                basePos.y + normal.y * disp,
                basePos.z + normal.z * disp
              );
            }
            posAttr.needsUpdate = true;
          } else {
            lineMat.opacity = 0.04;
            lineMat.color.set(l.baseColor);
          }
        });
      }

      // 5. Raycast Hover Inspection
      raycaster.setFromCamera(eng.mouse, camera);
      const intersects = raycaster.intersectObjects(group.children, false);

      if (intersects.length > 0) {
        const object = intersects[0].object;
        if (hoveredObject !== object) {
          if (hoveredObject) {
            if ((hoveredObject as any).userData?.isNode) {
              (hoveredObject as THREE.Mesh).material = (hoveredObject as any).userData.baseMaterial;
            } else if ((hoveredObject as any).userData?.isVector) {
              ((hoveredObject as THREE.Line).material as THREE.LineBasicMaterial).color.set(
                (hoveredObject as any).userData.baseColor
              );
            }
          }

          hoveredObject = object;
          if ((hoveredObject as any).userData?.isNode) {
            updateHud((hoveredObject as any).userData);
          } else if ((hoveredObject as any).userData?.isVector) {
            ((hoveredObject as THREE.Line).material as THREE.LineBasicMaterial).color.set('#ffffff');
            updateHud((hoveredObject as any).userData);
          }
        }
      } else if (hoveredObject) {
        if ((hoveredObject as any).userData?.isNode) {
          (hoveredObject as THREE.Mesh).material = (hoveredObject as any).userData.baseMaterial;
        } else if ((hoveredObject as any).userData?.isVector) {
          ((hoveredObject as THREE.Line).material as THREE.LineBasicMaterial).color.set(
            (hoveredObject as any).userData.baseColor
          );
        }
        hoveredObject = null;
        updateHud(null);
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [updateHud]);

  // Rebuild Matrix Nodes & Multi-Segment Vectors on Origin Shift
  useEffect(() => {
    if (!engine.current || !engine.current.group) return;
    const group = engine.current.group;

    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if ((child as any).geometry) (child as any).geometry.dispose();
      if ((child as any).material) (child as any).material.dispose();
    }

    const gridSize = 5;
    const spacing = 3.6;
    const offset = Math.floor(gridSize / 2);

    const boxGeo = new THREE.BoxGeometry(spacing * 0.65, spacing * 0.65, spacing * 0.65);
    const nodeList: Array<{
      id: string;
      pos: THREE.Vector3;
      mesh: THREE.Mesh;
      sprite: THREE.Sprite;
      baseGlyph: string;
      baseColor: string;
    }> = [];
    const lineList: Array<{
      line: THREE.Line;
      fromId: string;
      toId: string;
      baseColor: number;
      posA: THREE.Vector3;
      posB: THREE.Vector3;
      segments: number;
    }> = [];

    // 1. Populate Nodes
    for (let x = -offset; x <= offset; x++) {
      for (let y = -offset; y <= offset; y++) {
        for (let z = -offset; z <= offset; z++) {
          const absX = origin[0] + x;
          const absY = origin[1] + y;
          const absZ = origin[2] + z;

          const data = getStateForCoordinate(absX, absY, absZ);
          const posX = x * spacing;
          const posY = y * spacing;
          const posZ = z * spacing;

          const boxMat = new THREE.MeshBasicMaterial({
            color: data.color,
            wireframe: true,
            transparent: true,
            opacity: 0.08
          });

          const mesh = new THREE.Mesh(boxGeo, boxMat);
          mesh.position.set(posX, posY, posZ);

          const sprite = createTextSprite(data.glyph, data.color);
          sprite.scale.set(2.8, 2.8, 1);
          mesh.add(sprite);

          const userData: NodeUserData = {
            ...data,
            coord: [absX, absY, absZ],
            seed: data.seed,
            isNode: true
          };
          (mesh as any).userData = { ...userData, baseMaterial: boxMat };
          group.add(mesh);

          nodeList.push({
            id: data.id,
            pos: new THREE.Vector3(posX, posY, posZ),
            mesh,
            sprite,
            baseGlyph: data.glyph,
            baseColor: data.color
          });
        }
      }
    }

    // 2. Draw Multi-Segment Relational Vector Beams (Ready for Wave Perturbation)
    const maxConnectionDistance = spacing * 1.55;
    const segments = 24;

    for (let i = 0; i < nodeList.length; i++) {
      for (let j = i + 1; j < nodeList.length; j++) {
        const nodeA = nodeList[i];
        const nodeB = nodeList[j];

        if (nodeA.pos.distanceTo(nodeB.pos) <= maxConnectionDistance) {
          const verbForward = getRelationalVector(nodeA.id, nodeB.id);
          const verbBackward = getRelationalVector(nodeB.id, nodeA.id);

          if (verbForward || verbBackward) {
            const verb = verbForward || verbBackward!;
            const fromNode = verbForward ? nodeA : nodeB;
            const toNode = verbForward ? nodeB : nodeA;

            const fromPillar = PILLAR_BY_ID.get(fromNode.id)!;
            const toPillar = PILLAR_BY_ID.get(toNode.id)!;

            // Generate multi-point line geometry for smooth standing wave physics
            const positions = new Float32Array((segments + 1) * 3);
            for (let s = 0; s <= segments; s++) {
              const t = s / segments;
              positions[s * 3] = nodeA.pos.x + (nodeB.pos.x - nodeA.pos.x) * t;
              positions[s * 3 + 1] = nodeA.pos.y + (nodeB.pos.y - nodeA.pos.y) * t;
              positions[s * 3 + 2] = nodeA.pos.z + (nodeB.pos.z - nodeA.pos.z) * t;
            }

            const lineGeo = new THREE.BufferGeometry();
            lineGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            const colorA = new THREE.Color(fromPillar.color);
            const colorB = new THREE.Color(toPillar.color);
            const mixedColor = colorA.clone().lerp(colorB, 0.5);

            const lineMat = new THREE.LineBasicMaterial({
              color: mixedColor,
              transparent: true,
              opacity: 0.35
            });

            const line = new THREE.Line(lineGeo, lineMat);
            const vectorUserData: VectorUserData = {
              isVector: true,
              verb,
              fromName: fromPillar.name,
              fromId: fromPillar.id,
              fromColor: fromPillar.color,
              toName: toPillar.name,
              toId: toPillar.id,
              toColor: toPillar.color,
              baseColor: mixedColor.getHex()
            };
            line.userData = vectorUserData;
            group.add(line);

            lineList.push({
              line,
              fromId: fromPillar.id,
              toId: toPillar.id,
              baseColor: mixedColor.getHex(),
              posA: nodeA.pos.clone(),
              posB: nodeB.pos.clone(),
              segments
            });
          }
        }
      }
    }

    engine.current.nodes = nodeList;
    engine.current.lines = lineList;
  }, [origin]);

  const shiftOrigin = (axis: 0 | 1 | 2, amount: number) => {
    setOrigin(prev => {
      const next = [...prev] as [number, number, number];
      next[axis] += amount;
      return next;
    });
  };

  const resetOrigin = () => {
    setOrigin([0, 0, 0]);
    if (engine.current) {
      engine.current.targetLookAt.set(0, 0, 0);
      engine.current.baseTargetCamPos.set(18, 14, 22);
      engine.current.targetCamPos.set(18, 14, 22);
      engine.current.activePillarIds = null;
    }
    setActiveTelemetry(null);
    setSynthesisText(null);
  };

  // Query / Paradox Projector: Energizes CFE, Retargets Camera, & Streams local cortex
  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim() || isSynthesizing) return;

    // 1. Calculate semantic projection onto the 10 Topological Anchors
    const lower = queryText.toLowerCase();
    const scores = MYOS_PILLARS.map(p => {
      let score = 0;
      if (lower.includes(p.name.toLowerCase())) score += 12;
      if (lower.includes(p.id)) score += 12;
      p.desc.toLowerCase().split(' ').forEach(w => {
        if (w.length > 3 && lower.includes(w)) score += 2;
      });
      return { pillar: p, score };
    }).sort((a, b) => b.score - a.score);

    const dominant = [scores[0].pillar, scores[1].pillar];
    const vectorVerb = getRelationalVector(dominant[0].id, dominant[1].id) || 'Resonates With';

    // 2. Trigger Causal Feedback Engine (CFE) Divergence Phase
    cfeRef.current.startQuery(dominant[1].glyph);
    setCfeDisplay(cfeRef.current.getState());

    setActiveTelemetry({
      dominant: [dominant[0].name, dominant[1].name],
      dominantIds: [dominant[0].id, dominant[1].id],
      vectors: [`${dominant[0].name} ➔ ${vectorVerb} ➔ ${dominant[1].name}`],
      spatialState: `Non-equilibrium cognitive strain active between ${dominant[0].name} (${dominant[0].glyph}) and ${dominant[1].name} (${dominant[1].glyph}).`
    });

    // 3. Spatial Retargeting: Frame active vector tension corridor
    if (engine.current) {
      engine.current.activePillarIds = [dominant[0].id, dominant[1].id];

      const nodesA = engine.current.nodes.filter(n => n.id === dominant[0].id);
      const nodesB = engine.current.nodes.filter(n => n.id === dominant[1].id);

      if (nodesA.length > 0 && nodesB.length > 0) {
        let closestPair = [nodesA[0], nodesB[0]];
        let minD = nodesA[0].pos.distanceTo(nodesB[0].pos);

        for (const na of nodesA) {
          for (const nb of nodesB) {
            const d = na.pos.distanceTo(nb.pos);
            if (d < minD) {
              minD = d;
              closestPair = [na, nb];
            }
          }
        }

        const midPoint = closestPair[0].pos.clone().add(closestPair[1].pos).multiplyScalar(0.5);
        engine.current.targetLookAt.copy(midPoint);

        const lineDir = closestPair[1].pos.clone().sub(closestPair[0].pos).normalize();
        const camOffset = new THREE.Vector3(-lineDir.z, 0.6, lineDir.x).normalize().multiplyScalar(14);
        engine.current.baseTargetCamPos.copy(midPoint.clone().add(camOffset).add(new THREE.Vector3(0, 4, 0)));
      }
    }

    // 4. Live Output Synthesis from Local Cortex (myos-cortex on localhost:11434)
    setIsSynthesizing(true);
    setSynthesisText('Connecting to local cortex (myos-cortex on localhost:11434)...');

    try {
      let streamingBuffer = '';
      const result: CognitiveTelemetry = await queryCognitiveMatrix(
        queryText,
        (partial) => {
          streamingBuffer = partial;
          // Pulse the CFE with streaming data to drive the Operator Kernel phase
          cfeRef.current.streamPulse(partial.length);

          const display = partial
            .replace(/\[Telemetry\][\s\S]*?\[Synthesis\]/i, '')
            .replace(/\[Telemetry\][\s\S]*/i, '')
            .trim();
          setSynthesisText(display || 'Pondering latent tensions across the CFE...');
        },
        'myos-cortex'
      );

      const finalSynthesis = result.synthesis || streamingBuffer || 'Cognitive synthesis complete.';
      setSynthesisText(finalSynthesis);
      // Finalize CFE: Engages Safeguard 1 (Arbitration), Safeguard 2 (Entropy Sink), and locks into jewel tones
      cfeRef.current.finalizeQuery(true);
      setCfeDisplay(cfeRef.current.getState());
    } catch (err) {
      console.warn('Local Ollama query failed, resolving with deterministic cognitive synthesis:', err);
      cfeRef.current.finalizeQuery(true);
      setCfeDisplay(cfeRef.current.getState());
      setSynthesisText(
        `Through the operational lens of MyOS, ${dominant[0].name} (${dominant[0].glyph}) ${vectorVerb.toLowerCase()} ${dominant[1].name} (${dominant[1].glyph}). ` +
        `This query reveals that ${dominant[0].desc.toLowerCase()} is bounded and informed by ${dominant[1].desc.toLowerCase()}. ` +
        `The tension resolves not by choosing one over the other, but by holding the paradox in antigravity.`
      );
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Helper colors for HUD Strain Gauge
  const getPhaseBadgeColor = (phase: CFEPhase): string => {
    switch (phase) {
      case CFEPhase.STABLE: return '#38bdf8';
      case CFEPhase.DIVERGENCE: return '#f43f5e';
      case CFEPhase.OPERATOR_KERNEL: return '#fbbf24';
      case CFEPhase.CONVERGENCE: return '#34d399';
      case CFEPhase.RESOLVED: return '#a78bfa';
      default: return '#94a3b8';
    }
  };

  const getPhaseBadgeBg = (phase: CFEPhase): string => {
    switch (phase) {
      case CFEPhase.STABLE: return 'rgba(56, 189, 248, 0.15)';
      case CFEPhase.DIVERGENCE: return 'rgba(244, 63, 94, 0.15)';
      case CFEPhase.OPERATOR_KERNEL: return 'rgba(251, 191, 36, 0.18)';
      case CFEPhase.CONVERGENCE: return 'rgba(52, 211, 153, 0.15)';
      case CFEPhase.RESOLVED: return 'rgba(167, 139, 250, 0.18)';
      default: return 'rgba(255, 255, 255, 0.05)';
    }
  };

  const getStrainBarGradient = (phase: CFEPhase): string => {
    switch (phase) {
      case CFEPhase.STABLE: return 'linear-gradient(90deg, #38bdf8, #818cf8)';
      case CFEPhase.DIVERGENCE: return 'linear-gradient(90deg, #f43f5e, #fb7185)';
      case CFEPhase.OPERATOR_KERNEL: return 'linear-gradient(90deg, #f59e0b, #fbbf24, #ffffff)';
      case CFEPhase.CONVERGENCE: return 'linear-gradient(90deg, #10b981, #34d399)';
      case CFEPhase.RESOLVED: return 'linear-gradient(90deg, #8b5cf6, #ec4899, #06b6d4)';
      default: return '#38bdf8';
    }
  };

  return (
    <div style={styles.container}>
      <div ref={mountRef} style={styles.canvasContainer} />

      <div style={styles.uiOverlay}>
        {/* Header HUD */}
        <div style={styles.header}>
          <div style={styles.titleRow}>
            <h1 style={styles.title}>Antigravity Cognitive Matrix</h1>
            <span style={styles.badge}>CFE ACTIVE • 3 SAFEGUARDS</span>
          </div>

          <p style={styles.paragraph}>
            A spatial reasoning simulator with active non-equilibrium Causal Feedback Engine (CFE).
            Vectors vibrate under cognitive strain ($\Sigma$) and nodes transmute dynamically through operator glyphs.
          </p>

          <form onSubmit={handleQuerySubmit}>
            <input
              type="text"
              placeholder="Ask a question or project a thought into 3D space... (Press Enter)"
              value={queryText}
              onChange={e => setQueryText(e.target.value)}
              disabled={isSynthesizing}
              style={styles.queryInput}
            />
          </form>

          {/* Telemetry Projection */}
          {activeTelemetry && (
            <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 'bold', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <span>[TELEMETRY PROJECTION]</span>
                {isSynthesizing && <span style={{ color: '#f43f5e', animation: 'pulse 1s infinite' }}>● STREAMING GPU</span>}
              </div>
              <div style={{ fontSize: '11px', color: '#f8fafc' }}>
                <b>Dominant Nodes:</b> {activeTelemetry.dominant.join(', ')}
              </div>
              <div style={{ fontSize: '11px', color: '#a78bfa', marginTop: '2px' }}>
                <b>Active Vector:</b> {activeTelemetry.vectors[0]}
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', fontStyle: 'italic' }}>
                {activeTelemetry.spatialState}
              </div>
            </div>
          )}

          {/* Tensor Strain Gauge HUD (CFE Monitor with 3 Safeguards) */}
          <div style={styles.strainGaugePanel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 'bold', letterSpacing: '1px' }}>
                [TENSOR STRAIN GAUGE Σ]
              </span>
              <span style={{
                fontSize: '9px',
                padding: '2px 7px',
                borderRadius: '4px',
                fontWeight: 'bold',
                background: getPhaseBadgeBg(cfeDisplay.phase),
                color: getPhaseBadgeColor(cfeDisplay.phase),
                border: `1px solid ${getPhaseBadgeColor(cfeDisplay.phase)}`
              }}>
                {cfeDisplay.phase} • {cfeDisplay.currentGlyph}
              </span>
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{
                width: `${Math.round(cfeDisplay.sigma * 100)}%`,
                height: '100%',
                background: getStrainBarGradient(cfeDisplay.phase),
                transition: 'width 0.15s ease-out'
              }} />
            </div>

            {/* Metrics & 3 Ontological Safeguards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '10px', color: '#94a3b8' }}>
              <div><b>Strain (Σ):</b> <span style={{ color: '#f8fafc' }}>{(cfeDisplay.sigma * 100).toFixed(1)}%</span></div>
              <div><b>Wave Freq:</b> <span style={{ color: '#38bdf8' }}>{cfeDisplay.activeFrequencyHz.toFixed(1)} Hz</span></div>
              <div><b>Blindspot (Ω):</b> <span style={{ color: cfeDisplay.omegaUncertainty > 0.35 ? '#f43f5e' : '#34d399' }}>{(cfeDisplay.omegaUncertainty * 100).toFixed(0)}% (τ ≤ 35%)</span></div>
              <div><b>Observer Lock:</b> <span style={{ color: '#a78bfa' }}>{cfeDisplay.observerDepth}/3 {cfeDisplay.observerDepth >= 3 ? '🚨 TRIP' : '✓ OK'}</span></div>
            </div>

            <div style={{ fontSize: '10px', color: '#cbd5e1', fontStyle: 'italic', marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '4px' }}>
              {cfeDisplay.statusMessage}
            </div>
          </div>

          {/* Cognitive Resolution Card */}
          {synthesisText && (
            <div style={styles.resolutionCard}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '10px', color: '#c4b5fd', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  [COGNITIVE RESOLUTION]
                </span>
                <span style={{ fontSize: '9px', color: '#64748b' }}>myos-cortex (local)</span>
              </div>
              <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: '1.6', maxHeight: '180px', overflowY: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                {synthesisText}
              </div>
            </div>
          )}

          {/* Coordinate Frame Controls */}
          <div style={styles.controlsPanel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 'bold' }}>OBSERVATION FRAME (ORIGIN)</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#38bdf8' }}>
                [{origin[0]}, {origin[1]}, {origin[2]}]
              </div>
            </div>

            <div style={styles.controlsRow}>
              <button style={styles.button} onClick={() => shiftOrigin(0, 1)}>+X</button>
              <button style={styles.button} onClick={() => shiftOrigin(1, 1)}>+Y</button>
              <button style={styles.button} onClick={() => shiftOrigin(2, 1)}>+Z</button>
            </div>
            <div style={styles.controlsRow}>
              <button style={styles.buttonSecondary} onClick={() => shiftOrigin(0, -1)}>-X</button>
              <button style={styles.buttonSecondary} onClick={() => shiftOrigin(1, -1)}>-Y</button>
              <button style={styles.buttonSecondary} onClick={() => shiftOrigin(2, -1)}>-Z</button>
              <button style={{ ...styles.buttonSecondary, color: '#f43f5e', borderColor: 'rgba(244,63,94,0.3)' }} onClick={resetOrigin}>Reset</button>
            </div>
          </div>

          {onClose && (
            <div style={{ marginTop: '14px', textAlign: 'right' }}>
              <button
                onClick={onClose}
                style={{ ...styles.button, background: 'rgba(244,63,94,0.15)', borderColor: 'rgba(244,63,94,0.4)', color: '#fda4af' }}
              >
                Exit to Desktop [ESC]
              </button>
            </div>
          )}
        </div>

        {/* Hover Raycast HUD */}
        <div style={styles.hud} ref={hudRef}>
          <div style={{ fontSize: '10px', color: '#64748b', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
            COGNITIVE LATENT FIELD
          </div>
          <div style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
            Hover over a Pillar Node or Vector Beam to inspect...
          </div>
        </div>
      </div>
    </div>
  );
};

export default CognitiveMatrix;
