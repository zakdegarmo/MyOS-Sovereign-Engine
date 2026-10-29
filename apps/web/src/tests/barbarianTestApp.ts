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

    private mixer: THREE.AnimationMixer | null = null;
    private actionsMap: Map<string, THREE.AnimationAction> = new Map();
    private currentAction: THREE.AnimationAction | null = null;
    private isPlaying: boolean = true;

    // Golem billboard texture animation
    private golemTexture: THREE.Texture | null = null;
    private golemIdleTexture: THREE.Texture | null = null;
    private golemWalkTexture: THREE.Texture | null = null;
    private golemFrameTimer: number = 0;
    private golemFrameIdx: number = 0;
    private golemMesh: THREE.Mesh | null = null;

    // LPC Paperdoll texture animation
    private lpcTexture: THREE.Texture | null = null;
    private lpcFrameTimer: number = 0;
    private lpcFrameIdx: number = 0;

    constructor() {
        this.container = document.getElementById('canvas-container') || document.body;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050814);
        this.scene.fog = new THREE.FogExp2(0x050814, 0.035);

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 2.8, 10.5);

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
        const ambient = new THREE.AmbientLight(0xffffff, 1.2);
        this.scene.add(ambient);

        const keyLight = new THREE.DirectionalLight(0xfff5ea, 2.0);
        keyLight.position.set(6, 10, 6);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        keyLight.shadow.bias = -0.0001;
        this.scene.add(keyLight);

        const rimBlue = new THREE.PointLight(0x38bdf8, 2.5, 20);
        rimBlue.position.set(-6, 4, -3);
        this.scene.add(rimBlue);

        const rimRose = new THREE.PointLight(0xf43f5e, 2.5, 20);
        rimRose.position.set(6, 4, -3);
        this.scene.add(rimRose);
    }

    private setupEnvironment() {
        // Floor Plane
        const floorGeo = new THREE.PlaneGeometry(30, 20);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x0a0f1d,
            roughness: 0.85,
            metalness: 0.2
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Grid Helper
        const grid = new THREE.GridHelper(30, 30, 0x334155, 0x1e293b);
        grid.position.y = 0.001;
        this.scene.add(grid);
    }

    private createPodium(x: number, colorHex: number, labelText: string, subText: string) {
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
        this.createPodium(-4.5, 0x3b82f6, "[1. CONCEPT ART]", "2D Reference");
        this.createPodium(-1.5, 0x10b981, "[2. LPC PAPERDOLL]", "64x64 Grid");
        this.createPodium(1.5, 0xf59e0b, "[3. GOLEM 2.5D]", "Directional Sheet");
        this.createPodium(4.5, 0xf43f5e, "[4. CHIBI 3D]", "Skeletal Biped");
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

    // 2. LPC Paperdoll
    private loadLpcPaperdoll() {
        const loader = new THREE.TextureLoader();
        loader.load('/textures/avatars/lpc/barbarian_lady_lpc.png', (tex) => {
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
            tex.repeat.set(1 / 13, 1 / 21);
            tex.offset.set(0, 1 - (11 / 21)); // South walk
            this.lpcTexture = tex;

            const geo = new THREE.PlaneGeometry(1.8, 2.2);
            const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(-1.5, 1.45, 0);
            this.scene.add(mesh);
        });
    }

    // 3. Golem 2.5D Billboard
    private loadGolem() {
        const loader = new THREE.TextureLoader();
        loader.load('/actions/barbarian_lady_golem_idle.png', (idleTex) => {
            idleTex.magFilter = THREE.NearestFilter;
            idleTex.minFilter = THREE.NearestFilter;
            idleTex.repeat.set(0.25, 0.25);
            idleTex.offset.set(0, 0.75);
            this.golemIdleTexture = idleTex;
            this.golemTexture = idleTex;

            loader.load('/actions/barbarian_lady_golem_walk.png', (walkTex) => {
                walkTex.magFilter = THREE.NearestFilter;
                walkTex.minFilter = THREE.NearestFilter;
                walkTex.repeat.set(0.25, 0.25);
                walkTex.offset.set(0, 0.75);
                this.golemWalkTexture = walkTex;
            });

            const geo = new THREE.PlaneGeometry(2.0, 2.4);
            const mat = new THREE.MeshBasicMaterial({ map: idleTex, transparent: true, side: THREE.DoubleSide });
            this.golemMesh = new THREE.Mesh(geo, mat);
            this.golemMesh.position.set(1.5, 1.45, 0);
            this.scene.add(this.golemMesh);
        });
    }

    // 4. Chibi 3D Real-time Actor
    private loadChibi3D() {
        const loader = new GLTFLoader();
        loader.load('/models/characters/barbarian_lady_chibi.glb', (gltf) => {
            const model = gltf.scene;
            model.position.set(4.5, 0.1, 0);
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

            // Start with Idle_Loop if present
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
        const nextAction = this.actionsMap.get(name);
        if (!nextAction || nextAction === this.currentAction) return;

        if (this.currentAction) {
            this.currentAction.fadeOut(0.25);
        }

        nextAction.reset().fadeIn(0.25).play();
        this.currentAction = nextAction;

        // Switch Golem texture to match movement vs idle
        const isWalk = name.toLowerCase().includes('walk') || name.toLowerCase().includes('jog') || name.toLowerCase().includes('run');
        if (this.golemMesh) {
            const targetTex = isWalk ? this.golemWalkTexture : this.golemIdleTexture;
            if (targetTex) {
                this.golemTexture = targetTex;
                (this.golemMesh.material as THREE.MeshBasicMaterial).map = targetTex;
            }
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
                this.camera.position.set(0, 2.8, 10.5);
                this.controls.target.set(0, 1.2, 0);
                break;
            case 'concept':
                this.camera.position.set(-4.5, 2.0, 4.5);
                this.controls.target.set(-4.5, 1.7, 0);
                break;
            case 'lpc':
                this.camera.position.set(-1.5, 1.8, 3.8);
                this.controls.target.set(-1.5, 1.4, 0);
                break;
            case 'golem':
                this.camera.position.set(1.5, 1.8, 3.8);
                this.controls.target.set(1.5, 1.4, 0);
                break;
            case 'chibi':
                this.camera.position.set(4.5, 1.8, 3.8);
                this.controls.target.set(4.5, 1.3, 0);
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
            if (this.mixer) this.mixer.update(delta);

            // Animate LPC paperdoll frames (9 frames cycle)
            if (this.lpcTexture) {
                this.lpcFrameTimer += delta;
                if (this.lpcFrameTimer > 0.12) {
                    this.lpcFrameTimer = 0;
                    this.lpcFrameIdx = (this.lpcFrameIdx + 1) % 9;
                    this.lpcTexture.offset.x = this.lpcFrameIdx / 13;
                }
            }

            // Animate Golem billboard frames (4 frames cycle)
            if (this.golemTexture) {
                this.golemFrameTimer += delta;
                if (this.golemFrameTimer > 0.14) {
                    this.golemFrameTimer = 0;
                    this.golemFrameIdx = (this.golemFrameIdx + 1) % 4;
                    this.golemTexture.offset.x = this.golemFrameIdx * 0.25;
                }
            }
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    (window as any).__barbarianStage = new BarbarianTestStage();
});
