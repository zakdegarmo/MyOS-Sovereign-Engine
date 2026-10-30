/**
 * <myos:node>
 *   <id>node_55947209c743</id>
 *   <pillar>Existence ⬡</pillar>
 *   <file>apps/web/src/tests/bogShamanTestApp.ts</file>
 *   <sha256>55947209c74323b712a21a9ccb5f31247918d8682cea8743ba9b9fbc3c98a799</sha256>
 *   <summary>Core functional substrate module for MyOS Sovereign Engine.</summary>
 *   <exports>BogShamanTestApp</exports>
 * </myos:node>
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface UniversalAction {
    id: string;
    label: string;
    chibi: string;
    golem: string;
    lpcRow: number;
    lpcFrames: number;
}

export class BogShamanTestApp {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private clock: THREE.Clock;

    // Podium objects
    private conceptMesh: THREE.Mesh | null = null;
    private lpcMesh: THREE.Mesh | null = null;
    private golemMesh: THREE.Mesh | null = null;
    private chibiModel: THREE.Group | null = null;

    // Animation states
    private mixer: THREE.AnimationMixer | null = null;
    private chibiActions: Map<string, THREE.AnimationAction> = new Map();
    private activeChibiAction: THREE.AnimationAction | null = null;

    // LPC Texture & UV
    private lpcTexture: THREE.Texture | null = null;
    private lpcFrame = 0;
    private lpcTimer = 0;
    private lpcCurrentRow = 10;
    private lpcTotalFrames = 9;

    // Golem 2.5D Textures & UV
    private golemTextures: Map<string, THREE.Texture> = new Map();
    private currentGolemKey = 'idle';
    private golemFrame = 0;
    private golemTimer = 0;
    private golemRow = 0; // 0..7 octants

    // State
    private isPaused = false;
    private currentActionId = 'univ_idle';
    private headingDeg = 0; // 0..360
    private isTurntableActive = false;

    // Camera targets
    private targetCamPos = new THREE.Vector3(0, 2.0, 7.8);
    private targetLookAt = new THREE.Vector3(0, 1.0, 0);
    private currentLookAt = new THREE.Vector3(0, 1.0, 0);

    private readonly actions: UniversalAction[] = [
        { id: 'univ_idle', label: '🧘 Shamanic Idle', chibi: 'Idle_Loop', golem: 'idle', lpcRow: 10, lpcFrames: 9 },
        { id: 'univ_walk', label: '🚶 Swamp Walk', chibi: 'Walk_Loop', golem: 'walk', lpcRow: 10, lpcFrames: 9 },
        { id: 'univ_run', label: '🏃 Bog Stride', chibi: 'Jog_Fwd_Loop', golem: 'run', lpcRow: 10, lpcFrames: 9 },
        { id: 'univ_shoot', label: '✨ Cast Soul Spell', chibi: 'Spell_Simple_Shoot', golem: 'slash', lpcRow: 10, lpcFrames: 9 },
        { id: 'univ_crouch', label: '🛡️ Shamanic Chant', chibi: 'Idle_Loop', golem: 'idle', lpcRow: 10, lpcFrames: 9 }
    ];

    constructor() {
        this.clock = new THREE.Clock();
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x020704); // Deep murky swamp green-black
        this.scene.fog = new THREE.FogExp2(0x020704, 0.045);

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.copy(this.targetCamPos);

        const container = document.getElementById('canvas-container');
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        if (container) container.appendChild(this.renderer.domElement);

        this.setupLighting();
        this.setupPodiums();
        this.loadAssets();
        this.setupUI();

        window.addEventListener('resize', this.onWindowResize);
        this.animate();
    }

    private setupLighting(): void {
        const ambient = new THREE.AmbientLight(0x0d2818, 1.5);
        this.scene.add(ambient);

        const moonLight = new THREE.DirectionalLight(0xa7f3d0, 1.8);
        moonLight.position.set(5, 12, 8);
        moonLight.castShadow = true;
        moonLight.shadow.mapSize.width = 2048;
        moonLight.shadow.mapSize.height = 2048;
        this.scene.add(moonLight);

        // Amber soul-ember rim lights
        const emberLight1 = new THREE.PointLight(0xf59e0b, 2.5, 8);
        emberLight1.position.set(-1.5, 1.5, 1.0);
        this.scene.add(emberLight1);

        const emberLight2 = new THREE.PointLight(0xf59e0b, 2.5, 8);
        emberLight2.position.set(1.5, 1.5, 1.0);
        this.scene.add(emberLight2);
    }

    private setupPodiums(): void {
        const xPositions = [-4.5, -1.5, 1.5, 4.5];
        const podGeo = new THREE.CylinderGeometry(1.15, 1.3, 0.25, 32);
        const podMat = new THREE.MeshStandardMaterial({
            color: 0x052e16,
            roughness: 0.85,
            metalness: 0.1
        });

        const ringGeo = new THREE.TorusGeometry(1.18, 0.025, 16, 64);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });

        xPositions.forEach((x) => {
            const pod = new THREE.Mesh(podGeo, podMat);
            pod.position.set(x, 0.125, 0);
            pod.receiveShadow = true;
            this.scene.add(pod);

            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            ring.position.set(x, 0.25, 0);
            this.scene.add(ring);
        });

        // Ground stage
        const groundGeo = new THREE.PlaneGeometry(30, 20);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x02130b,
            roughness: 0.95,
            metalness: 0.05
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }

    private loadAssets(): void {
        const loader = new THREE.TextureLoader();

        // 1. Concept Plate
        loader.load(`/public/textures/avatars/bog_shaman_concept_transparent.png?v=${Date.now()}`, (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            const geo = new THREE.PlaneGeometry(1.79, 2.45);
            const mat = new THREE.MeshBasicMaterial({
                map: tex,
                transparent: true,
                alphaTest: 0.05,
                side: THREE.DoubleSide
            });
            this.conceptMesh = new THREE.Mesh(geo, mat);
            this.conceptMesh.position.set(-4.5, 1.35, 0);
            this.scene.add(this.conceptMesh);
            console.log("Loaded Bog Shaman Concept Plate successfully");
        });

        // 2. LPC 2D Paperdoll
        loader.load(`/public/textures/avatars/lpc/bog_shaman_lpc.png?v=${Date.now()}`, (tex) => {
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(1 / 13, 1 / 46);
            this.lpcTexture = tex;

            const geo = new THREE.PlaneGeometry(1.8, 1.8);
            const mat = new THREE.MeshBasicMaterial({
                map: tex,
                transparent: true,
                alphaTest: 0.05,
                side: THREE.DoubleSide
            });
            this.lpcMesh = new THREE.Mesh(geo, mat);
            this.lpcMesh.position.set(-1.5, 1.05, 0);
            this.scene.add(this.lpcMesh);
            this.updateLpcUV();
            console.log("Loaded Bog Shaman LPC Paperdoll successfully");
        });

        // 3. Golem 2.5D Sprite Sheet
        const golemActions = ['idle', 'walk', 'run', 'slash'];
        golemActions.forEach((key) => {
            loader.load(`/public/actions/bog_shaman_golem_${key}.png?v=${Date.now()}`, (tex) => {
                tex.magFilter = THREE.NearestFilter;
                tex.minFilter = THREE.NearestFilter;
                tex.wrapS = THREE.RepeatWrapping;
                tex.wrapT = THREE.RepeatWrapping;
                tex.repeat.set(1 / 8, 1 / 8);
                this.golemTextures.set(key, tex);

                if (key === 'idle' && !this.golemMesh) {
                    const geo = new THREE.PlaneGeometry(1.9, 1.9);
                    const mat = new THREE.MeshBasicMaterial({
                        map: tex,
                        transparent: true,
                        alphaTest: 0.05,
                        side: THREE.DoubleSide
                    });
                    this.golemMesh = new THREE.Mesh(geo, mat);
                    this.golemMesh.position.set(1.5, 1.1, 0);
                    this.scene.add(this.golemMesh);
                    this.updateGolemUV();
                    console.log("Loaded Bog Shaman Golem 2.5D successfully");
                }
            });
        });

        // 4. Chibi 3D Model
        const gltfLoader = new GLTFLoader();
        gltfLoader.load(`/public/models/characters/bog_shaman_chibi.glb?v=${Date.now()}`, (gltf) => {
            this.chibiModel = gltf.scene;
            this.chibiModel.position.set(4.5, 0.25, 0);
            this.chibiModel.scale.set(1.15, 1.15, 1.15);
            this.chibiModel.rotation.y = Math.PI; // Face front towards camera
            this.chibiModel.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            this.scene.add(this.chibiModel);

            this.mixer = new THREE.AnimationMixer(this.chibiModel);
            gltf.animations.forEach((clip) => {
                const action = this.mixer!.clipAction(clip);
                this.chibiActions.set(clip.name, action);
            });

            this.switchAction('univ_idle');
            console.log("Loaded Bog Shaman Chibi 3D Model successfully");
        });
    }

    private setupUI(): void {
        const actionSelect = document.getElementById('action-select') as HTMLSelectElement;
        if (actionSelect) {
            actionSelect.addEventListener('change', (e) => {
                const id = (e.target as HTMLSelectElement).value;
                this.switchAction(id);
            });
        }

        const playBtn = document.getElementById('play-btn');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.isPaused = !this.isPaused;
                playBtn.innerText = this.isPaused ? '▶ Play' : '⏸ Pause';
            });
        }

        // Compass 8-Way Buttons
        const compassDirs: { [k: string]: number } = {
            S: 0, SW: 45, W: 90, NW: 135, N: 180, NE: 225, E: 270, SE: 315
        };
        document.querySelectorAll('.compass-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.compass-btn').forEach((b) => b.classList.remove('active'));
                const target = e.currentTarget as HTMLElement;
                target.classList.add('active');
                const dir = target.dataset.dir || 'S';
                this.isTurntableActive = false;
                this.setHeading(compassDirs[dir] ?? 0);
            });
        });

        // Turntable button
        const turntableBtn = document.getElementById('turntable-btn');
        if (turntableBtn) {
            turntableBtn.addEventListener('click', () => {
                this.isTurntableActive = !this.isTurntableActive;
                turntableBtn.style.background = this.isTurntableActive ? '#15803d' : '';
            });
        }

        // Camera focus buttons
        document.querySelectorAll('.btn-camera').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const focus = (e.currentTarget as HTMLElement).dataset.focus;
                if (focus === 'all') {
                    this.targetCamPos.set(0, 2.0, 7.8);
                    this.targetLookAt.set(0, 1.0, 0);
                } else if (focus === 'concept') {
                    this.targetCamPos.set(-4.5, 1.4, 3.2);
                    this.targetLookAt.set(-4.5, 1.3, 0);
                } else if (focus === 'lpc') {
                    this.targetCamPos.set(-1.5, 1.2, 2.8);
                    this.targetLookAt.set(-1.5, 1.1, 0);
                } else if (focus === 'golem') {
                    this.targetCamPos.set(1.5, 1.2, 2.8);
                    this.targetLookAt.set(1.5, 1.1, 0);
                } else if (focus === 'chibi') {
                    this.targetCamPos.set(4.5, 1.3, 3.2);
                    this.targetLookAt.set(4.5, 1.1, 0);
                }
            });
        });
    }

    private switchAction(actionId: string): void {
        this.currentActionId = actionId;
        const act = this.actions.find((a) => a.id === actionId) || this.actions[0];

        // 1. Switch Chibi Action
        if (this.mixer) {
            const nextAction = this.chibiActions.get(act.chibi) || this.chibiActions.get('Idle_Loop');
            if (nextAction && nextAction !== this.activeChibiAction) {
                if (this.activeChibiAction) this.activeChibiAction.fadeOut(0.2);
                nextAction.reset().fadeIn(0.2).play();
                this.activeChibiAction = nextAction;
            }
        }

        // 2. Switch Golem Action Texture
        this.currentGolemKey = act.golem;
        if (this.golemMesh) {
            const tex = this.golemTextures.get(this.currentGolemKey);
            if (tex) {
                (this.golemMesh.material as THREE.MeshBasicMaterial).map = tex;
                (this.golemMesh.material as THREE.MeshBasicMaterial).needsUpdate = true;
            }
        }

        // 3. Switch LPC Row
        this.lpcCurrentRow = act.lpcRow;
        this.lpcTotalFrames = act.lpcFrames;
        this.lpcFrame = 0;
        this.golemFrame = 0;

        this.updateLpcUV();
        this.updateGolemUV();
    }

    private setHeading(deg: number): void {
        this.headingDeg = deg;

        // 1. Chibi 3D model rotation
        if (this.chibiModel) {
            this.chibiModel.rotation.y = Math.PI + THREE.MathUtils.degToRad(deg);
        }

        // 2. Golem 2.5D octant row (0..7)
        const octant = Math.round(deg / 45) % 8;
        this.golemRow = octant;
        this.updateGolemUV();

        // 3. LPC 4-way row mapping
        const cardinal = Math.round(deg / 90) % 4;
        const lpcDirectionRows: { [k: number]: number } = {
            0: 10, // South
            1: 9,  // West
            2: 8,  // North
            3: 11  // East
        };
        this.lpcCurrentRow = lpcDirectionRows[cardinal] ?? 10;
        this.updateLpcUV();
    }

    private updateLpcUV(): void {
        if (!this.lpcTexture) return;
        const col = this.lpcFrame;
        const row = this.lpcCurrentRow;
        this.lpcTexture.offset.set(col / 13, 1 - (row + 1) / 46);
    }

    private updateGolemUV(): void {
        const tex = this.golemTextures.get(this.currentGolemKey);
        if (!tex) return;
        const col = this.golemFrame;
        const row = this.golemRow;
        tex.offset.set(col / 8, 1 - (row + 1) / 8);
    }

    private onWindowResize = (): void => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    };

    private animate = (): void => {
        requestAnimationFrame(this.animate);
        const delta = this.clock.getDelta();

        // Smooth camera transitions
        this.camera.position.lerp(this.targetCamPos, 0.06);
        this.currentLookAt.lerp(this.targetLookAt, 0.06);
        this.camera.lookAt(this.currentLookAt);

        // Turntable rotation
        if (this.isTurntableActive && !this.isPaused) {
            this.headingDeg = (this.headingDeg + delta * 45) % 360;
            this.setHeading(this.headingDeg);
        }

        if (!this.isPaused) {
            // Update Chibi 3D
            if (this.mixer) this.mixer.update(delta);

            // Update LPC Frames
            this.lpcTimer += delta;
            const lpcSpeed = this.currentActionId === 'univ_run' ? 0.08 : 0.12;
            if (this.lpcTimer >= lpcSpeed) {
                this.lpcTimer = 0;
                this.lpcFrame = (this.lpcFrame + 1) % this.lpcTotalFrames;
                this.updateLpcUV();
            }

            // Update Golem Frames
            this.golemTimer += delta;
            const golemSpeed = this.currentActionId === 'univ_run' ? 0.08 : 0.12;
            if (this.golemTimer >= golemSpeed) {
                this.golemTimer = 0;
                this.golemFrame = (this.golemFrame + 1) % 8;
                this.updateGolemUV();
            }

            // Concept Plate subtle levitation bob
            if (this.conceptMesh) {
                const t = this.clock.getElapsedTime();
                this.conceptMesh.position.y = 1.35 + Math.sin(t * 2.0) * 0.02;
            }
        }

        this.renderer.render(this.scene, this.camera);
    };
}

new BogShamanTestApp();
