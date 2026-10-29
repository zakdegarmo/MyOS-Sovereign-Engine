import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class BarbarianTestStage {
    private container: HTMLElement;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private controls: OrbitControls;
    private clock: THREE.Clock;

    // 3D Chibi
    private mixer: THREE.AnimationMixer | null = null;
    private actionsMap: Map<string, THREE.AnimationAction> = new Map();
    private currentAction: THREE.AnimationAction | null = null;
    private isPlaying: boolean = true;

    // 2.5D Golem (8x8 Grid = 8 cols x 8 rows, 128x128 tiles on 1024x1024 sheet)
    private golemMesh: THREE.Mesh | null = null;
    private golemMaterial: THREE.MeshBasicMaterial | null = null;
    private golemTextures: { idle?: THREE.Texture; walk?: THREE.Texture; run?: THREE.Texture } = {};
    private currentGolemTexture: THREE.Texture | null = null;
    private golemFrameTimer: number = 0;
    private golemFrameIdx: number = 0;
    private golemNumFrames: number = 8;
    private golemRow: number = 0; // Row 0: South (front-facing)

    // 2D LPC Paperdoll (13 cols x 21 rows, 64x64 tiles on 832x1344 standard sheet)
    private lpcMesh: THREE.Mesh | null = null;
    private lpcTexture: THREE.Texture | null = null;
    private lpcMaterial: THREE.MeshBasicMaterial | null = null;
    private lpcFrameTimer: number = 0;
    private lpcFrameIdx: number = 0;
    private lpcRow: number = 10; // Row 10: South Walk
    private lpcNumFrames: number = 9;
    private lpcIsStaticFrame: boolean = false;

    constructor() {
        this.container = document.getElementById('canvas-container') || document.body;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x060913);
        this.scene.fog = new THREE.FogExp2(0x060913, 0.035);

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 2.6, 9.8);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2 + 0.02;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 22;
        this.controls.target.set(0, 1.2, 0);

        this.clock = new THREE.Clock();

        this.setupLights();
        this.setupEnvironment();
        this.setupPodiums();
        this.loadConceptArt();
        this.loadLpcPaperdoll();
        this.loadGolem();
        this.loadChibi3D();

        window.addEventListener('resize', this.onResize.bind(this));
        this.animate();
    }

    private setupLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 1.3);
        this.scene.add(ambient);

        const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
        keyLight.position.set(5, 9, 6);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        keyLight.shadow.bias = -0.0001;
        this.scene.add(keyLight);

        const fillCyan = new THREE.PointLight(0x38bdf8, 2.0, 25);
        fillCyan.position.set(-6, 4, -2);
        this.scene.add(fillCyan);

        const rimAmber = new THREE.PointLight(0xf59e0b, 2.0, 25);
        rimAmber.position.set(6, 4, -2);
        this.scene.add(rimAmber);
    }

    private setupEnvironment() {
        const floorGeo = new THREE.PlaneGeometry(32, 22);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x090d1a,
            roughness: 0.85,
            metalness: 0.2
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        const grid = new THREE.GridHelper(32, 32, 0x334155, 0x1e293b);
        grid.position.y = 0.001;
        this.scene.add(grid);
    }

    private createPodium(x: number, colorHex: number) {
        const group = new THREE.Group();
        group.position.set(x, 0, 0);

        const cylGeo = new THREE.CylinderGeometry(1.15, 1.25, 0.12, 32);
        const cylMat = new THREE.MeshStandardMaterial({
            color: colorHex,
            roughness: 0.35,
            metalness: 0.75
        });
        const cyl = new THREE.Mesh(cylGeo, cylMat);
        cyl.position.y = 0.06;
        cyl.receiveShadow = true;
        group.add(cyl);

        const ringGeo = new THREE.RingGeometry(1.3, 1.38, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.005;
        group.add(ring);

        this.scene.add(group);
        return group;
    }

    private setupPodiums() {
        this.createPodium(-4.5, 0x3b82f6);
        this.createPodium(-1.5, 0x10b981);
        this.createPodium(1.5, 0xf59e0b);
        this.createPodium(4.5, 0xf43f5e);
    }

    // 1. Concept Art Billboard
    private loadConceptArt() {
        const loader = new THREE.TextureLoader();
        loader.load('/textures/avatars/barbarian_lady_concept.png', (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            const geo = new THREE.PlaneGeometry(1.9, 3.4);
            const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(-4.5, 1.76, 0);
            this.scene.add(mesh);
        });
    }

    // 2. LPC Paperdoll (832x1344: 13 cols x 21 rows, 64x64 tiles)
    private loadLpcPaperdoll() {
        const loader = new THREE.TextureLoader();
        loader.load('/textures/avatars/lpc/barbarian_lady_lpc.png', (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
            tex.wrapS = THREE.ClampToEdgeWrapping;
            tex.wrapT = THREE.ClampToEdgeWrapping;

            // Exactly 1 tile out of 13 columns and 21 standard rows
            const repeatX = 1 / 13;
            const repeatY = 1 / 21;
            tex.repeat.set(repeatX, repeatY);

            // Row 10 is South Walk (0-indexed from top). UV offset.y = 1.0 - (row + 1) * repeatY
            tex.offset.set(0, 1.0 - (11 * repeatY));
            this.lpcTexture = tex;

            const geo = new THREE.PlaneGeometry(1.5, 2.2);
            this.lpcMaterial = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
            this.lpcMesh = new THREE.Mesh(geo, this.lpcMaterial);
            this.lpcMesh.position.set(-1.5, 1.35, 0);
            this.scene.add(this.lpcMesh);
        });
    }

    // 3. Golem 2.5D (1024x1024: 8 cols x 8 rows, 128x128 tiles)
    private loadGolem() {
        const loader = new THREE.TextureLoader();
        const setupGolemTex = (tex: THREE.Texture) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
            tex.wrapS = THREE.ClampToEdgeWrapping;
            tex.wrapT = THREE.ClampToEdgeWrapping;
            // Exactly 1 tile out of 8x8 matrix
            tex.repeat.set(1 / 8, 1 / 8);
            // Row 0 is South front-facing: offset.y = 1.0 - (0 + 1) * 0.125 = 0.875
            tex.offset.set(0, 0.875);
            return tex;
        };

        const idleTex = setupGolemTex(loader.load('/actions/barbarian_lady_golem_idle.png'));
        const walkTex = setupGolemTex(loader.load('/actions/barbarian_lady_golem_walk.png'));
        const runTex = setupGolemTex(loader.load('/actions/barbarian_lady_golem_run.png'));

        this.golemTextures = { idle: idleTex, walk: walkTex, run: runTex };
        this.currentGolemTexture = idleTex;

        const geo = new THREE.PlaneGeometry(1.6, 2.2);
        this.golemMaterial = new THREE.MeshBasicMaterial({ map: idleTex, transparent: true, side: THREE.DoubleSide });
        this.golemMesh = new THREE.Mesh(geo, this.golemMaterial);
        this.golemMesh.position.set(1.5, 1.35, 0);
        this.scene.add(this.golemMesh);
    }

    // 4. Chibi 3D Real-time Actor (from canonical mannequin_chibi_master.glb)
    private loadChibi3D() {
        const loader = new GLTFLoader();
        loader.load('/models/characters/barbarian_lady_chibi.glb', (gltf) => {
            const model = gltf.scene;
            model.position.set(4.5, 0.12, 0);
            model.scale.set(1.2, 1.2, 1.2);

            model.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            this.scene.add(model);

            this.mixer = new THREE.AnimationMixer(model);
            const selectEl = document.getElementById('action-select') as HTMLSelectElement;
            if (selectEl) selectEl.innerHTML = '';

            gltf.animations.forEach((clip) => {
                const action = this.mixer!.clipAction(clip);
                this.actionsMap.set(clip.name, action);

                if (selectEl) {
                    const opt = document.createElement('option');
                    opt.value = clip.name;
                    opt.textContent = clip.name;
                    selectEl.appendChild(opt);
                }
            });

            // Start with Idle_Loop
            const defaultAnim = this.actionsMap.has('Idle_Loop') ? 'Idle_Loop' : gltf.animations[0]?.name;
            if (defaultAnim) {
                this.switchAction(defaultAnim);
                if (selectEl) selectEl.value = defaultAnim;
            }

            this.bindControls();
        }, undefined, (err) => {
            console.error("Failed to load Chibi GLB:", err);
        });
    }

    public switchAction(name: string) {
        // 1. Switch 3D Chibi Animation
        const nextAction = this.actionsMap.get(name);
        if (nextAction && nextAction !== this.currentAction) {
            if (this.currentAction) {
                this.currentAction.fadeOut(0.25);
            }
            nextAction.reset().fadeIn(0.25).play();
            this.currentAction = nextAction;
        }

        const lower = name.toLowerCase();

        // 2. Synchronize 2.5D Golem Sprite Sheet & Action
        let golemTargetTex = this.golemTextures.idle;
        if (lower.includes('run') || lower.includes('sprint') || lower.includes('jog')) {
            golemTargetTex = this.golemTextures.run || this.golemTextures.walk || this.golemTextures.idle;
        } else if (lower.includes('walk') || lower.includes('crouch_fwd')) {
            golemTargetTex = this.golemTextures.walk || this.golemTextures.idle;
        } else {
            golemTargetTex = this.golemTextures.idle;
        }

        if (golemTargetTex && this.golemMesh && this.golemMaterial) {
            this.currentGolemTexture = golemTargetTex;
            this.golemMaterial.map = golemTargetTex;
            this.golemMaterial.needsUpdate = true;
            this.golemFrameIdx = 0;
            this.golemFrameTimer = 0;
            this.currentGolemTexture.offset.set(0, 0.875);
        }

        // 3. Synchronize 2D LPC Paperdoll Action Row
        // Row 10: Walk South (9 frames)
        // Row 14: Slash South (6 frames)
        // Row 2: Spellcast South (7 frames)
        // Row 20: Hurt/Death (6 frames)
        if (lower.includes('attack') || lower.includes('slash') || lower.includes('sword')) {
            this.lpcRow = 14;
            this.lpcNumFrames = 6;
            this.lpcIsStaticFrame = false;
        } else if (lower.includes('spell') || lower.includes('cast')) {
            this.lpcRow = 2;
            this.lpcNumFrames = 7;
            this.lpcIsStaticFrame = false;
        } else if (lower.includes('death') || lower.includes('hit')) {
            this.lpcRow = 20;
            this.lpcNumFrames = 6;
            this.lpcIsStaticFrame = false;
        } else if (lower.includes('walk') || lower.includes('run') || lower.includes('jog')) {
            this.lpcRow = 10;
            this.lpcNumFrames = 9;
            this.lpcIsStaticFrame = false;
        } else {
            // Idle stance: Row 10, stationary frame 0
            this.lpcRow = 10;
            this.lpcNumFrames = 1;
            this.lpcIsStaticFrame = true;
        }

        if (this.lpcTexture) {
            this.lpcFrameIdx = 0;
            this.lpcFrameTimer = 0;
            // Standard 21 rows
            this.lpcTexture.offset.y = 1.0 - ((this.lpcRow + 1) / 21);
            this.lpcTexture.offset.x = 0;
        }

        const badge = document.getElementById('current-anim-badge');
        if (badge) badge.textContent = name;
    }

    public togglePlay() {
        this.isPlaying = !this.isPlaying;
        if (this.currentAction) {
            this.currentAction.paused = !this.isPlaying;
        }
        const btn = document.getElementById('play-btn');
        if (btn) btn.textContent = this.isPlaying ? '⏸ Pause' : '▶ Play';
    }

    public setFocus(target: 'all' | 'concept' | 'lpc' | 'golem' | 'chibi') {
        switch (target) {
            case 'all':
                this.camera.position.set(0, 2.6, 9.8);
                this.controls.target.set(0, 1.2, 0);
                break;
            case 'concept':
                this.camera.position.set(-4.5, 1.9, 4.2);
                this.controls.target.set(-4.5, 1.7, 0);
                break;
            case 'lpc':
                this.camera.position.set(-1.5, 1.6, 3.4);
                this.controls.target.set(-1.5, 1.35, 0);
                break;
            case 'golem':
                this.camera.position.set(1.5, 1.6, 3.4);
                this.controls.target.set(1.5, 1.35, 0);
                break;
            case 'chibi':
                this.camera.position.set(4.5, 1.6, 3.4);
                this.controls.target.set(4.5, 1.25, 0);
                break;
        }
    }

    private bindControls() {
        const select = document.getElementById('action-select') as HTMLSelectElement;
        if (select) {
            select.onchange = () => this.switchAction(select.value);
        }

        const playBtn = document.getElementById('play-btn');
        if (playBtn) {
            playBtn.onclick = () => this.togglePlay();
        }

        const focusButtons = document.querySelectorAll('[data-focus]');
        focusButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                const f = btn.getAttribute('data-focus') as any;
                this.setFocus(f);
            });
        });
    }

    private onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    private animate() {
        requestAnimationFrame(this.animate.bind(this));
        const delta = this.clock.getDelta();

        if (this.isPlaying) {
            // Update 3D Skeletal Animation
            if (this.mixer) this.mixer.update(delta);

            // Animate 2D LPC Paperdoll
            if (this.lpcTexture && !this.lpcIsStaticFrame) {
                this.lpcFrameTimer += delta;
                if (this.lpcFrameTimer > 0.12) {
                    this.lpcFrameTimer = 0;
                    this.lpcFrameIdx = (this.lpcFrameIdx + 1) % this.lpcNumFrames;
                    this.lpcTexture.offset.x = (this.lpcFrameIdx % 13) / 13;
                }
            }

            // Animate 2.5D Golem (8 frames across row 0)
            if (this.currentGolemTexture) {
                this.golemFrameTimer += delta;
                if (this.golemFrameTimer > 0.12) {
                    this.golemFrameTimer = 0;
                    this.golemFrameIdx = (this.golemFrameIdx + 1) % this.golemNumFrames;
                    // UV x offset is frame / 8
                    this.currentGolemTexture.offset.x = (this.golemFrameIdx % 8) * 0.125;
                    this.currentGolemTexture.offset.y = 1.0 - ((this.golemRow + 1) * 0.125); // 0.875
                }
            }
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    (window as any).__barbarianStage = new BarbarianTestStage();
});
