import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GlitchPass } from 'three/addons/postprocessing/GlitchPass.js';
import { MaxState } from '../types';

interface Max3DSceneProps {
  state: MaxState;
  audioLevel?: number;
}

export const Max3DScene: React.FC<Max3DSceneProps> = ({ state, audioLevel = 0 }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const jawRef = useRef<THREE.Group | null>(null);
  const headGroupRef = useRef<THREE.Group | null>(null);
  const eyesGroupRef = useRef<THREE.Group | null>(null);
  const backgroundGridRef = useRef<THREE.Group | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const glitchPassRef = useRef<GlitchPass | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetEyeRotation = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!mountRef.current) return;

    // --- SCENE & CAM ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050005);
    
    const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
    camera.position.set(0, 0, 9);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(256, 256);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const keyLight = new THREE.SpotLight(0xffddaa, 3.5);
    keyLight.position.set(3, 2, 6);
    keyLight.angle = 0.5;
    keyLight.penumbra = 0.5;
    keyLight.castShadow = true;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    const rimLight = new THREE.SpotLight(0xff00ff, 6.0);
    rimLight.position.set(-5, 4, -4);
    rimLight.lookAt(0, 0, 0);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0x00ffff, 0.5);
    fillLight.position.set(-4, -2, 4);
    scene.add(fillLight);

    // Eye catchlight
    const eyeLight = new THREE.PointLight(0xffffff, 1.5, 10);
    eyeLight.position.set(1, 1, 5);
    scene.add(eyeLight);

    // --- MATERIALS ---
    const skinMat = new THREE.MeshStandardMaterial({ 
      color: 0xffcc99, roughness: 0.4, metalness: 0.1, 
      emissive: 0x884433, emissiveIntensity: 0.1 
    });
    const suitMat = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.2, metalness: 0.5 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.4, metalness: 0.0 });
    
    // Adjusted Eye Materials (Less wet, more plastic)
    const scleraMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.2 });
    const irisMat = new THREE.MeshStandardMaterial({ color: 0x3377ff, roughness: 0.3, metalness: 0.1 });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    // Removed the complex glass cornea to reduce visual noise/melting artifacts

    // --- MESH CONSTRUCTION ---
    const maxGroup = new THREE.Group();
    scene.add(maxGroup);
    headGroupRef.current = maxGroup;

    const skullGroup = new THREE.Group();
    maxGroup.add(skullGroup);

    // Head Block
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.15, 1.25), skinMat);
    head.castShadow = true;
    head.receiveShadow = true;
    skullGroup.add(head);

    // Hair
    const hairGroup = new THREE.Group();
    hairGroup.position.set(0, 0.6, 0);
    hairGroup.rotation.x = -0.2;
    skullGroup.add(hairGroup);
    const hairBlock = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.45, 1.4), hairMat);
    hairGroup.add(hairBlock);

    // Features
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.65, 0.5), skinMat);
    nose.position.set(0, -0.1, 0.7);
    nose.castShadow = true;
    skullGroup.add(nose);

    const cheekGeo = new THREE.BoxGeometry(0.4, 0.4, 0.3);
    const cheekL = new THREE.Mesh(cheekGeo, skinMat);
    cheekL.position.set(-0.6, -0.2, 0.5);
    cheekL.rotation.y = 0.4;
    skullGroup.add(cheekL);
    const cheekR = new THREE.Mesh(cheekGeo, skinMat);
    cheekR.position.set(0.6, -0.2, 0.5);
    cheekR.rotation.y = -0.4;
    skullGroup.add(cheekR);

    // --- THE EYES (Adjusted) ---
    const eyesContainer = new THREE.Group();
    skullGroup.add(eyesContainer);
    eyesGroupRef.current = eyesContainer;

    const createEyeAssembly = (xPos: number) => {
        const assembly = new THREE.Group();
        assembly.position.set(xPos, 0.12, 0.65); // Moved forward to avoid Z-fighting with head (0.625 is head surface)

        // Eyelids (Frames) - Helps hide the intersection
        const lidGeo = new THREE.BoxGeometry(0.4, 0.05, 0.1);
        const topLid = new THREE.Mesh(lidGeo, skinMat);
        topLid.position.set(0, 0.14, 0.05);
        topLid.rotation.x = 0.1;
        assembly.add(topLid);

        const bottomLid = new THREE.Mesh(lidGeo, skinMat);
        bottomLid.position.set(0, -0.14, 0.05);
        bottomLid.rotation.x = -0.1;
        assembly.add(bottomLid);

        // The Eyeball Group (Rotates)
        const ballGroup = new THREE.Group();
        assembly.add(ballGroup);

        // Sclera
        const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 24), scleraMat);
        sclera.scale.set(1, 0.8, 0.5);
        ballGroup.add(sclera);

        // Iris
        const iris = new THREE.Mesh(new THREE.CircleGeometry(0.08, 24), irisMat);
        iris.position.z = 0.085;
        ballGroup.add(iris);

        // Pupil
        const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.035, 24), pupilMat);
        pupil.position.z = 0.086;
        ballGroup.add(pupil);

        return { assembly, ballGroup };
    };

    const leftEye = createEyeAssembly(-0.32);
    const rightEye = createEyeAssembly(0.32);
    eyesContainer.add(leftEye.assembly);
    eyesContainer.add(rightEye.assembly);

    // Jaw
    const jawGroup = new THREE.Group();
    jawGroup.position.set(0, -0.55, -0.2);
    maxGroup.add(jawGroup);
    jawRef.current = jawGroup;
    const jawMesh = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.6, 1.1), skinMat);
    jawMesh.position.set(0, -0.3, 0.2);
    jawGroup.add(jawMesh);

    // Suit
    const bodyGroup = new THREE.Group();
    bodyGroup.position.set(0, -2.1, 0);
    maxGroup.add(bodyGroup);
    const suit = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.6, 1.2), suitMat);
    bodyGroup.add(suit);
    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.2), new THREE.MeshStandardMaterial({color: 0xffffff}));
    shirt.position.set(0, 0.8, 0.55);
    bodyGroup.add(shirt);
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.1, 0.25), new THREE.MeshStandardMaterial({color: 0x111111}));
    tie.position.set(0, 0.4, 0.6);
    bodyGroup.add(tie);

    // --- BACKGROUND ---
    const bgGroup = new THREE.Group();
    const lineMat = new THREE.LineBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.8 });
    const points = [new THREE.Vector3(-30, 0, 0), new THREE.Vector3(30, 0, 0)];
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const hLines: THREE.Line[] = [];
    for(let i = -15; i <= 15; i++) {
        const l = new THREE.Line(lineGeo, lineMat);
        l.position.set(0, i * 0.9, -6);
        bgGroup.add(l);
        hLines.push(l);
    }
    const diagGroup = new THREE.Group();
    const diagGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -30, 0), new THREE.Vector3(0, 30, 0)]);
    const diagMat = new THREE.LineBasicMaterial({ color: 0x880088 });
    for(let i = -20; i <= 20; i++) {
        const l = new THREE.Line(diagGeo, diagMat);
        l.position.set(i * 1.5, 0, -6.1);
        l.rotation.z = 0.5;
        diagGroup.add(l);
    }
    bgGroup.add(diagGroup);
    scene.add(bgGroup);
    backgroundGridRef.current = bgGroup;

    // --- COMPOSER ---
    const composer = new EffectComposer(renderer);
    composerRef.current = composer;
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass( new THREE.Vector2( 256, 256 ), 1.2, 0.5, 0.9 );
    composer.addPass(bloom);
    const glitch = new GlitchPass();
    glitch.enabled = false;
    composer.addPass(glitch);
    glitchPassRef.current = glitch;

    // --- MOUSE LISTENER ---
    const handleMouseMove = (e: MouseEvent) => {
        mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // --- ANIMATION ---
    let frameId: number;
    let time = 0;
    let saccadeTimer = 0;
    let saccadeTarget = { x: 0, y: 0 };

    const animate = () => {
        time += 0.02;

        const pulse = 1 + (audioLevel || 0) * 0.4;
        if (backgroundGridRef.current) {
            backgroundGridRef.current.scale.set(pulse, pulse, 1);
            backgroundGridRef.current.rotation.z = Math.sin(time * 0.05) * 0.1;
        }

        if (headGroupRef.current) {
            headGroupRef.current.rotation.y = THREE.MathUtils.lerp(headGroupRef.current.rotation.y, mouseRef.current.x * 0.2, 0.05);
            headGroupRef.current.rotation.x = THREE.MathUtils.lerp(headGroupRef.current.rotation.x, mouseRef.current.y * 0.1, 0.05);
            headGroupRef.current.position.y = Math.sin(time * 0.5) * 0.05;
        }

        // Saccadic Eye Movement
        saccadeTimer += 0.01;
        if (saccadeTimer > Math.random() * 2 + 0.5) {
            saccadeTimer = 0;
            saccadeTarget.x = (Math.random() - 0.5) * 0.2; 
            saccadeTarget.y = (Math.random() - 0.5) * 0.1;
        }
        
        // Rotate the individual eye groups (ballGroup) inside the assembly
        if (leftEye.ballGroup && rightEye.ballGroup) {
            const tx = THREE.MathUtils.lerp(targetEyeRotation.current.x, (mouseRef.current.y * 0.3) + saccadeTarget.y, 0.1);
            const ty = THREE.MathUtils.lerp(targetEyeRotation.current.y, (mouseRef.current.x * 0.5) + saccadeTarget.x, 0.1);
            targetEyeRotation.current.x = tx;
            targetEyeRotation.current.y = ty;

            leftEye.ballGroup.rotation.x = tx;
            leftEye.ballGroup.rotation.y = ty;
            rightEye.ballGroup.rotation.x = tx;
            rightEye.ballGroup.rotation.y = ty;
        }

        hLines.forEach((l, i) => { l.position.y = ((time + i) % 20) - 10; });

        if (state === MaxState.GLITCHING && cameraRef.current) {
            cameraRef.current.position.x = (Math.random() - 0.5) * 0.5;
            cameraRef.current.rotation.z = (Math.random() - 0.5) * 0.05;
        } else if (cameraRef.current) {
            cameraRef.current.position.x = 0;
            cameraRef.current.rotation.z = 0;
        }

        composer.render();
        frameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        cancelAnimationFrame(frameId);
        if (mountRef.current && renderer.domElement) mountRef.current.removeChild(renderer.domElement);
        renderer.dispose();
        composer.dispose();
    };
  }, []);

  // Jaw
  useEffect(() => {
      let jawInterval: any;
      if (state === MaxState.SPEAKING && jawRef.current) {
          jawInterval = setInterval(() => {
              if (!jawRef.current) return;
              const target = Math.random() > 0.4 ? 0.35 : 0;
              jawRef.current.rotation.x = target;
          }, 60);
      } else if (jawRef.current) {
          jawRef.current.rotation.x = (audioLevel || 0) * 0.3 + 0.02;
      }
      if (glitchPassRef.current) {
          glitchPassRef.current.enabled = (state === MaxState.GLITCHING);
          glitchPassRef.current.goWild = (state === MaxState.GLITCHING);
      }
      return () => clearInterval(jawInterval);
  }, [state, audioLevel]);

  return <div ref={mountRef} className="w-full h-full bg-black cursor-none" />;
};
