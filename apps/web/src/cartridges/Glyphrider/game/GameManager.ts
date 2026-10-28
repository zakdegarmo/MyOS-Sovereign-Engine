import * as THREE from 'three';
import { OrbitControls, GLTFLoader } from 'three-stdlib';
import { Track, type TrackConfig } from './Track';
import { Racer, Archetype } from './Racer';
import { DebugUI } from '../ui/DebugUI';
import { GameConfig } from './GameConfig';
import { ParticleSystem } from './ParticleSystem';
import { SpeedLines } from './SpeedLines';
import { GhostSystem } from './GhostSystem';
import { GhostRacer } from './GhostRacer';
import type { LevelDefinition } from './CampaignTypes';
import { DirectorSystem } from './DirectorSystem';

export class GameManager {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private clock: any; // Using any to bypass potential Timer type gaps in @types/three
    private controls: OrbitControls;
    private debugUI: DebugUI;
    private particleSystem!: ParticleSystem;
    private shakeIntensity: number = 0;
    private speedLines!: SpeedLines;

    // Systems
    private director: DirectorSystem;

    // --- Performance: Reuse Objects to avoid GC ---
    private _tempVec3_1 = new THREE.Vector3();
    private _tempVec3_2 = new THREE.Vector3();
    private _tempVec3_3 = new THREE.Vector3();
    private _tempMat4 = new THREE.Matrix4();
    private _tempQuat = new THREE.Quaternion();

    private track: Track | null = null;
    private racers: Racer[] = [];
    private player: Racer | null = null;

    private shipModel: THREE.Object3D | null = null;

    private hudElements: { speed: HTMLElement, tricks: HTMLElement, laps: HTMLElement, score: HTMLElement, container?: HTMLElement } | null = null;
    private lapsInLevel: number = 0;
    private lastTrackT: number = 0;

    // Race State
    private totalLaps = 3;
    private raceStarted = false;
    private raceTime = 0;
    private score = 0;
    private gameMode: 'TIME_ATTACK' | 'SCORE_ATTACK' = 'SCORE_ATTACK';

    // Ghost
    private ghostSystem: GhostSystem;
    private ghostRacer: GhostRacer | null = null;

    // Campaign
    private currentLevel: LevelDefinition | null = null;
    public onExit: () => void = () => { };

    public selectedArchetype: string = 'BLUR';

    private parentContainer: HTMLElement | null = null;

    constructor(container?: HTMLElement) {
        this.parentContainer = container || document.body;
        this.debugUI = new DebugUI(this.parentContainer);

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#050010');
        this.scene.fog = new THREE.FogExp2(0x050010, 0.002);

        this.particleSystem = new ParticleSystem(this.scene, '#00ffff');
        this.speedLines = new SpeedLines(this.scene);
        this.ghostSystem = new GhostSystem();
        this.director = new DirectorSystem();

        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
        this.camera.position.set(0, 100, 300);

        // Renderer
        try {
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: true, 
                logarithmicDepthBuffer: false 
            });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            // --- CSS PRODUCTION HARDENING ---
            // These settings ensure the canvas is visible within the MyOS sandbox
            this.renderer.domElement.id = 'glyph-canvas';
            Object.assign(this.renderer.domElement.style, {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                zIndex: '0', // Base level
                display: 'block',
                pointerEvents: 'none'
            });
            // Force container-relative sizing
            this.renderer.domElement.setAttribute('style', this.renderer.domElement.getAttribute('style') + '; width: 100% !important; height: 100% !important;');
            
            // Force body to be a relative container
            if (this.parentContainer === document.body) {
                document.body.style.minHeight = '100vh';
                document.body.style.position = 'relative';
            }
        } catch (e) {
            console.error("Game Instance: WebGL Initialization failed critical check.", e);
            throw e; // Bubble up to index.tsx for the user-facing alert
        }
        
        this.parentContainer.appendChild(this.renderer.domElement);

        // HUD
        this.createHUD();

        // --- STABILITY: Create Crash Overlay Container ---
        if (!document.getElementById('glyph-error-hud')) {
            const errHud = document.createElement('div');
            errHud.id = 'glyph-error-hud';
            errHud.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:rgba(255,0,0,0.9); color:white; padding:20px; border:5px solid white; z-index:1000000; display:none; font-family:monospace; text-align:center; max-width:80%;';
            document.body.appendChild(errHud);
        }

        // Lights - Connected to Camera for continuous illumination during high-speed travel
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient);

        const dirLight = new THREE.DirectionalLight(0xff00ff, 2.0); // Magenta primary light
        dirLight.position.set(10, 20, 10);
        this.camera.add(dirLight); // Attach to camera

        const blueLight = new THREE.PointLight(0x00ffff, 2.0, 500); // Cyan rim light
        blueLight.position.set(-10, 5, -10);
        this.camera.add(blueLight); // Attach to camera
        
        // Dynamic Headlight (Directly in front of racer)
        const headLight = new THREE.SpotLight(0xffffff, 5.0, 1000, Math.PI / 6, 0.5);
        headLight.position.set(0, 0, 0);
        headLight.target.position.set(0, 0, -100);
        this.camera.add(headLight);
        this.camera.add(headLight.target);

        this.scene.add(this.camera); // Required when adding children to camera

        this.clock = (THREE as any).Timer ? new (THREE as any).Timer() : new THREE.Clock();
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        this.setupInputListeners();
        window.addEventListener('resize', () => this.onResize());
    }

    private createHUD() {
        if (this.parentContainer && this.parentContainer !== document.body) {
            // Cartridge mode uses GlyphriderCampaignHUD React overlay
            return;
        }
        const hudContainer = document.createElement('div');
        hudContainer.id = 'glyph-hud';
        hudContainer.style.position = 'absolute';
        hudContainer.style.top = '20px';
        hudContainer.style.left = '20px';
        hudContainer.style.zIndex = '2147483645'; // Above Canvas
        hudContainer.style.color = '#00ffff';
        hudContainer.style.fontFamily = 'Impact, sans-serif';
        hudContainer.style.fontSize = '24px';
        hudContainer.style.textShadow = '2px 2px #ff00ff';
        hudContainer.style.pointerEvents = 'none';

        const speedEl = document.createElement('div');
        const scoreEl = document.createElement('div');
        const lapsEl = document.createElement('div');
        const tricksEl = document.createElement('div');
        tricksEl.style.color = '#ffff00';
        tricksEl.style.marginTop = '10px';

        const exitBtn = document.createElement('button');
        exitBtn.innerText = "EXIT GAME";
        exitBtn.style.marginTop = '20px';
        exitBtn.style.padding = '10px';
        exitBtn.style.background = '#f00';
        exitBtn.style.color = '#fff';
        exitBtn.style.border = '1px solid #fff';
        exitBtn.style.cursor = 'pointer';
        exitBtn.style.pointerEvents = 'all'; // Enable click
        exitBtn.onclick = () => this.exitToMenu();

        hudContainer.appendChild(scoreEl);
        hudContainer.appendChild(speedEl);
        hudContainer.appendChild(lapsEl);
        hudContainer.appendChild(tricksEl);
        hudContainer.appendChild(exitBtn);
        this.parentContainer!.appendChild(hudContainer);

        this.hudElements = { speed: speedEl, laps: lapsEl, tricks: tricksEl, score: scoreEl, container: hudContainer };
    }

    public exitToMenu() {
        this.raceStarted = false;
        // Stop Loop? 
        // We can't easily cancel the requested frame without ID, but strict conditionals work.

        // Clean up UI
        if ((this.hudElements as any).container && this.parentContainer) {
            this.parentContainer.removeChild((this.hudElements as any).container);
            this.hudElements = null;
        }

        // Remove Canvas
        if (this.renderer && this.parentContainer) {
            this.parentContainer.removeChild(this.renderer.domElement);
            // Since we remove the canvas, we should probably dispose the instance?
            // But we are reusing `game` instance in index.tsx...
            // Wait, index.tsx does `const game = new GameManager()` ONCE.
            // If we remove the canvas, we need to append it again on init.
        }

        this.onExit();
    }


    public async init() {
        // Re-append canvas if missing
        if (this.parentContainer && !this.parentContainer.contains(this.renderer.domElement)) {
            this.parentContainer.appendChild(this.renderer.domElement);
        }

        if (!this.hudElements) this.createHUD();
        
        // Load Assets with a timeout/resilience
        try {
            await Promise.race([
                this.loadAssets(),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Asset Timeout (5s)")), 5000))
            ]);
        } catch (e) {
            console.warn("Asset load failed or timed out, using fallbacks:", e);
        }

        // Initialize Track and Racers if not present
        if (!this.track) {
            this.createTrack();
        }
        if (!this.player && this.shipModel) {
            this.createRacers();
        }

        // Start Loop if not already running
        if (!this.isAnimating) {
            this.isAnimating = true;
            this.animate();
        }
    }

    public startRace() {
        this.raceStarted = true;
        this.raceTime = 0;
        if (!this.track) this.createTrack();
        if (!this.player && this.shipModel) this.createRacers();
    }

    public showCriticalError(message: string) {
        const hud = document.getElementById('glyph-error-hud');
        if (hud) {
            hud.innerHTML = `<h2>CRITICAL CORE FAILURE</h2><p>${message}</p><button onclick="location.reload()">REBOOT SYSTEM</button>`;
            hud.style.display = 'block';
        }
        this.isRunning = false;
    }

    public loadLevel(level: LevelDefinition) {
        this.currentLevel = level;
        this.trackConfig = level.track; // Overwrite current config
        this.selectedArchetype = level.playerArchetype ? level.playerArchetype.toString() : this.selectedArchetype;

        // Reset/Recreate World
        this.createTrack(); // This now handles debug UI too

        // Racers
        this.createRacers(); // Uses selectedArchetype

        // Setup Ghost for this level ID
        const seed = level.id; // Use Level ID as seed for persistence!
        this.ghostSystem.startRecording(seed);

        if (this.shipModel) {
            this.ghostRacer = new GhostRacer(this.scene, this.track!, this.ghostSystem, this.shipModel);
        }

        this.raceStarted = true;
        this.raceTime = 0;

        // Update HUD with level info
        console.log(`Starting Level: ${level.name}`);
        if (this.hudElements) this.hudElements.laps.textContent = level.name;
    }

    private async loadAssets() {
        return new Promise<void>((resolve) => {
            const loader = new GLTFLoader();
            const tryLoad = (paths: string[], index: number) => {
                if (index >= paths.length) {
                    console.warn("All model paths failed, using procedural fallback geometry.");
                    const geometry = new THREE.ConeGeometry(1, 2, 4);
                    const material = new THREE.MeshStandardMaterial({ color: 0x00ffff, flatShading: true });
                    this.shipModel = new THREE.Mesh(geometry, material);
                    this.shipModel.rotation.x = Math.PI / 2;
                    resolve();
                    return;
                }
                const path = paths[index];
                loader.load(
                    path,
                    (gltf) => {
                        console.log(`[GLYPHRIDER] Successfully loaded stunt model from: ${path}`);
                        this.shipModel = gltf.scene;
                        this.shipModel.scale.set(0.65, 0.65, 0.65);
                        resolve();
                    },
                    undefined,
                    (err) => {
                        console.warn(`Could not load ${path}, trying next fallback...`, err);
                        tryLoad(paths, index + 1);
                    }
                );
            };

            tryLoad([
                '/models/astra_stuntcraft_hero.glb',
                '/assets/models/uni.glb',
                '/models/uniracer_hero.glb'
            ], 0);
        });
    }

    public trackConfig: TrackConfig = {
        radius: 200,
        tubeRadius: 30,
        tubularSegments: 400,
        radialSegments: 16,
        p: 3,
        q: 4,
        trackColor: '#00ffff'
    };

    public createTrack() {
        this.buildTrack(this.trackConfig);

        // --- SCENE DIAGNOSTICS ---
        console.group("Game Instance: 3D Scene Diagnostics");
        console.log("Active Scene Children:", this.scene.children.length);
        this.scene.children.forEach((child, i) => {
            console.log(`[${i}] ${child.type} - Name: ${child.name || 'unnamed'} - Visible: ${child.visible}`);
        });
        console.log("Camera Position:", this.camera.position);
        console.log("Renderer Canvas Info:", this.renderer.domElement.clientWidth, "x", this.renderer.domElement.clientHeight);
        console.groupEnd();
        // Fix: Don't keep adding folders every reset.
        // Assuming DebugUI handles cleanup or we check if exists?
        // Simpler: Just refresh params if needed. For now, standard behavior.

        const folderName = 'Track Generator';
        // Try to finding existing? The DebugUI wrapper doesn't expose it easily.
        // Let's just assume we can add it.
        const folder = this.debugUI.addFolder(folderName);

        const params = {
            p: this.trackConfig.p,
            q: this.trackConfig.q,
            radius: this.trackConfig.radius,
            tubeRadius: this.trackConfig.tubeRadius,
            morphDuration: 3.0,
            morph: () => {
                const newConfig = {
                    ...this.trackConfig,
                    p: params.p,
                    q: params.q,
                    radius: params.radius,
                    tubeRadius: params.tubeRadius
                };
                if (this.track) this.track.morphTo(newConfig);
            },
            triggerBreak: () => {
                if (this.track) this.track.morphTo(this.trackConfig, this.player?.trackT || 0);
            }
        };

        folder.add(params, 'p', 1, 20, 1).name('P (Loops)');
        folder.add(params, 'q', 1, 20, 1).name('Q (Twists)');
        folder.add(params, 'radius', 100, 1000, 10).name('Scale');
        folder.add(params, 'tubeRadius', 10, 100, 1).name('Tube Size');
        folder.add(params, 'morphDuration', 0.5, 10.0).name('Morph Time');
        folder.add(params, 'morph').name('MORPH TRACK');
        folder.add(params, 'triggerBreak').name('TRIGGER BREAK');
    }

    private buildTrack(config: TrackConfig) {
        if (this.track) {
            this.track.dispose();
            this.scene.remove(this.track.mesh);
        }
        this.track = new Track(this.scene, config);

        // Reset Racers to track start
        this.racers.forEach(r => r.reset(this.track!)); // ! asserted

        // Reset Ghost
        if (this.ghostSystem) {
            this.ghostSystem.saveRunIfBest(this.raceTime); // Save previous run

            // Restart
            const seed = `${config.p}-${config.q}-${config.radius}-${config.tubeRadius}`;
            this.ghostSystem.startRecording(seed);

            // Reset Race Time
            this.raceTime = 0;
        }
        if (this.ghostRacer) this.ghostRacer.reset(this.track);
    }

    public createRacers() {
        if (!this.track || !this.shipModel) return;

        // Clear existing
        this.racers.forEach(r => this.scene.remove(r.mesh));
        this.racers = [];

        // Player
        // Cast string to Enum (unsafe but functional for prototype)
        const typeKeys = Object.keys(Archetype).filter(k => isNaN(Number(k)));
        const type = this.selectedArchetype as Archetype || Archetype.BLUR;

        this.player = new Racer(this.scene, this.track, type, 0.0, this.shipModel);
        this.racers.push(this.player);

        // AI Opponent (Only if defined in level)
        if (this.currentLevel && this.currentLevel.opponentArchetype) {
            const ai = new Racer(this.scene, this.track, this.currentLevel.opponentArchetype, 0.02, this.shipModel);
            this.racers.push(ai);
        }
    }

    private isRunning: boolean = true;
    private isAnimating: boolean = false;
    private frameCount: number = 0;

    private animate = () => {
        if (!this.isRunning) return;
        requestAnimationFrame(this.animate);

        if (this.clock.update) this.clock.update();
        const delta = Math.min(this.clock.getDelta ? this.clock.getDelta() : (this.clock as THREE.Clock).getDelta(), 0.1);

        try {
            // Game Logic
            this.update(delta); 

            // Render
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        } catch (err: any) {
            this.showCriticalError(err.message || "Unknown Simulation Crash");
        }
    }





    public toggleGameMode() {
        this.gameMode = this.gameMode === 'SCORE_ATTACK' ? 'TIME_ATTACK' : 'SCORE_ATTACK';
        this.score = 0;
        this.raceTime = 0;
    }

    private update(delta: number) {
        // Director Update
        if (this.player) {
            // ... (Director logic same as before) ...
            this.director.update(delta, {
                speed: this.player.speed,
                isTricking: !this.player.isGrounded
            });

            const action = this.director.getAction();
            if (this.track) {
                if (action === 'MORPH') {
                    const nextConfig = this.director.generateNextConfig(this.trackConfig);
                    const gaps = this.director.generateGaps();
                    this.track.morphTo(nextConfig, this.player.trackT);
                    this.track.setGaps(gaps);
                    this.trackConfig = nextConfig;
                } else if (action === 'PULSE') {
                    this.track.pulse(1.0);
                }
            }
        }

        if (this.track && this.player) {
            this.track.update(delta, this.player.speed, this.player.trackT);
        }

        // Particle System
        if (this.player) {
            // Speed trail
            if (this.player.speed > 500) {
                this.particleSystem.emit(this.player.mesh.position, 2);
            }
            this.particleSystem.update(delta);

            // Speed Lines
            this.speedLines.update(delta, this.player.speed, this.camera);

            // Score Accumulation (Optimal Path)
            if (this.player.isOnOptimalPath && this.raceStarted) {
                // Points per second
                const pointsPerSec = 1000;
                this.score += pointsPerSec * delta;
            }
        }

        // Shake Decay
        this.shakeIntensity = THREE.MathUtils.lerp(this.shakeIntensity, 0, delta * 5);

        // Input Handling
        const input = this.getInput();

        this.racers.forEach(racer => {
            // ... existing racer update ...
            if (racer === this.player) {
                racer.update(delta, input);
            } else {
                // ... AI logic ...
                const targetAngle = 0;
                const error = targetAngle - racer.angle;
                const steer = error * 2.0;

                const aiInput = (racer as any)._aiInput || {
                    accelerate: true, brake: false, steer: 0, jump: false, pitch: 0, yaw: 0, roll: 0
                };
                (racer as any)._aiInput = aiInput;

                aiInput.steer = THREE.MathUtils.clamp(steer, -1, 1);
                racer.update(delta, aiInput);
            }
        });

        // Ghost Update
        if (this.raceStarted) {
            this.raceTime += delta;
            // Record Player
            if (this.player) {
                this.ghostSystem.recordFrame(this.player, this.raceTime);
            }
            // Update Ghost Visual
            if (this.ghostRacer) {
                this.ghostRacer.update(this.raceTime);
            }
        }

        // --- Level / Lap Tracking ---
        if (this.player && this.raceStarted) {
            const currentT = this.player.trackT;
            // Detect Wrap-around
            if (this.lastTrackT > 0.8 && currentT < 0.2) {
                this.lapsInLevel++;
                console.log(`Lap Complete: ${this.lapsInLevel}/3`);
                
                if (this.lapsInLevel >= 3) {
                    console.log(`STORY PROGRESSION: Level Complete. Ready for next dimension.`);
                    // NOTE: this.currentLevel++ removed (Logic Error: Object vs Number)
                    this.lapsInLevel = 0;
                    // Trigger haptic-like track pulse
                    if (this.track) this.track.pulse(2.0);
                    
                    // Stabilize and Save "Decad" via meta-ontology
                    const stats = this.player.getDecadStats();
                    RacerOntology.stabilize(stats);
                    // (Optional) localStorage.setItem('glyphrider_level', this.currentLevel.toString());
                }
            }
            this.lastTrackT = currentT;
        }

        // HUD Update (Final segments)
        if (this.hudElements && this.player) {
            this.hudElements.speed.textContent = `SPEED: ${(this.player.speed / 10).toFixed(0)} km/h`;
            this.hudElements.tricks.textContent = this.player.lastTrickText;

            // Score / Time Display
            if (this.gameMode === 'SCORE_ATTACK') {
                this.hudElements.score.textContent = `SCORE: ${Math.floor(this.score)}`;
            } else {
                this.hudElements.score.textContent = `TIME: ${this.raceTime.toFixed(2)}`;
            }
        }

        // Camera Follow
        if (this.player) {
            this.updateCamera(delta);
        }
    }

    public cameraMode: 'NORMAL' | 'WIDE' | 'REAR' | 'SIDE_2D' | 'TOP_DOWN' = 'NORMAL';

    public setCameraMode(mode: 'NORMAL' | 'WIDE' | 'REAR' | 'SIDE_2D' | 'TOP_DOWN') {
        this.cameraMode = mode;
        const label = this.cameraMode === 'SIDE_2D' ? '2.5D CLASSIC UNIRACER PROFILE' : this.cameraMode;
        console.log(`Switched Camera Mode: [${this.cameraMode}] (${label})`);
    }

    public toggleCamera() {
        if (this.cameraMode === 'NORMAL') this.setCameraMode('WIDE');
        else if (this.cameraMode === 'WIDE') this.setCameraMode('REAR');
        else if (this.cameraMode === 'REAR') this.setCameraMode('SIDE_2D');
        else if (this.cameraMode === 'SIDE_2D') this.setCameraMode('TOP_DOWN');
        else this.setCameraMode('NORMAL');
    }

    private updateCamera(delta: number) {
        if (!this.player) return;

        // --- 1. Determine Base Parameters based on Mode ---
        let baseFov = GameConfig.camera.baseFov;
        let offsetX = GameConfig.camera.offsetX;
        let offsetZ = GameConfig.camera.offsetZ;
        let offsetY = GameConfig.camera.offsetY;
        let lookBack = false;

        if (this.cameraMode === 'WIDE') {
            baseFov = 100;
            offsetZ = -60;
            offsetY = 30;
        } else if (this.cameraMode === 'REAR') {
            offsetZ = 40; // Front of player
            offsetY = 10;
            lookBack = true;
        } else if (this.cameraMode === 'SIDE_2D') {
            baseFov = 46; // Flatten perspective for wide 2.5D retro profile
            offsetX = 145; // Wide lateral side view of tube
            offsetY = 18;  // Height above track spine
            offsetZ = 12;  // Slight forward lead along track
        } else if (this.cameraMode === 'TOP_DOWN') {
            baseFov = 65;
            offsetX = 0;
            offsetY = 120;
            offsetZ = 0;
        }

        // --- 2. Dynamic FOV ---
        const speedRatio = Math.min(this.player.speed / 1000, 1.0);
        const fovSpread = this.cameraMode === 'SIDE_2D' ? 0.15 : GameConfig.camera.fovSpeedEffect;
        const targetFov = THREE.MathUtils.lerp(
            baseFov,
            GameConfig.camera.maxFov,
            speedRatio * fovSpread
        );
        this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, delta * 2);
        this.camera.updateProjectionMatrix();

        // --- 2.5 SPECIAL BRANCH: 2.5D CLASSIC PROFILE (DECOUPLED FROM CIRCUMFERENTIAL STRAFE) ---
        if (this.cameraMode === 'SIDE_2D') {
            const frame = this.track!.getFrenetAt((this.player as any).trackT ?? this.player.t ?? 0);
            const trackNormal = frame.normal;
            const trackBinormal = frame.binormal;
            const trackTangent = frame.tangent;

            const railPos = this._tempVec3_1.copy(this.player.railPosition);

            // Camera placed laterally along track binormal, independent of player.angle
            const idealPos = railPos.clone()
                .add(trackBinormal.clone().multiplyScalar(offsetX))
                .add(trackNormal.clone().multiplyScalar(offsetY))
                .add(trackTangent.clone().multiplyScalar(offsetZ));

            const lookTarget = railPos.clone()
                .add(trackTangent.clone().multiplyScalar(32))
                .add(trackNormal.clone().multiplyScalar(4));

            // Anti-Warp check
            if (this.camera.position.distanceTo(idealPos) > GameConfig.camera.snapThreshold) {
                this.camera.position.copy(idealPos);
                this.camera.up.copy(trackNormal);
                this.camera.lookAt(lookTarget);
                return;
            }

            // Wipeout Shake
            if (this.player.isWipingOut) {
                this.shakeIntensity = Math.max(this.shakeIntensity, 1.0);
            }
            if (this.shakeIntensity > 0.01) {
                const shake = this.shakeIntensity * 2;
                idealPos.x += (Math.random() - 0.5) * shake;
                idealPos.y += (Math.random() - 0.5) * shake;
                idealPos.z += (Math.random() - 0.5) * shake;
            }

            this.camera.position.copy(idealPos);
            this.camera.up.lerp(trackNormal, delta * 12);
            this.camera.lookAt(lookTarget);
            return;
        }

        // --- 3. Calculate Ideal Position (Rail Locked) ---
        // Avoid cloning. Use copy() to temp vars.

        const railPos = this._tempVec3_1.copy(this.player.railPosition);
        const railUp = this._tempVec3_2.copy(this.player.railUp);
        const railTangent = this._tempVec3_3.copy(this.player.railTangent);

        const radius = this.track!.tubeRadius + GameConfig.physics.groundOffset;
        const sideSign = GameConfig.track.side === 'INSIDE' ? -1 : 1;

        // Outside: Center + (Up * R)
        // Inside: Center - (Up * R) (Because Up points Inwards)
        const surfacePos = railPos.add(railUp.clone().multiplyScalar(radius * sideSign));

        const camRight = new THREE.Vector3().crossVectors(railUp, railTangent).normalize();
        // Allocating 'camRight' is small, but if we want 0 allocs we need more temps. 
        // It's fine for now, biggest culprit was the clones.

        const offset = new THREE.Vector3()
            .add(camRight.multiplyScalar(GameConfig.camera.offsetX))
            .add(railUp.clone().multiplyScalar(offsetY)) // use clone of temp to preserve railUp
            .add(railTangent.multiplyScalar(offsetZ));

        const idealPos = surfacePos.clone().add(offset);

        // --- 4. Anti-Warp / Wrap-Around Check ---
        // During Break/Morph, camera might snap wildly if we don't smooth it. 
        // For now, keep snap threshold but maybe increase it?
        if (this.camera.position.distanceTo(idealPos) > GameConfig.camera.snapThreshold) {
            this.camera.position.copy(idealPos); // Snap instantly
            const lookTarget = surfacePos.clone().add(railUp.clone().multiplyScalar(GameConfig.camera.lookAtHeight));
            this.camera.lookAt(lookTarget);
            return;
        }

        // --- 5. Shake ---
        // Wipeout Shake override
        if (this.player.isWipingOut) {
            this.shakeIntensity = Math.max(this.shakeIntensity, 1.0); // Max Shake
        }

        const speedRatioScale = Math.min(this.player.speed / 1000, 1.0);
        if (speedRatioScale > 0.8) {
            this.shakeIntensity = Math.max(this.shakeIntensity, (speedRatioScale - 0.8) * 0.2);
        }
        if (this.shakeIntensity > 0.01) {
            const shake = this.shakeIntensity * 2;
            idealPos.x += (Math.random() - 0.5) * shake;
            idealPos.y += (Math.random() - 0.5) * shake;
            idealPos.z += (Math.random() - 0.5) * shake;
        }

        // --- 6. Apply Movement (Cinematic Lag) ---
        // Smoothly interpolate position for "weighty" camera
        // High stiffness = tight follow, Low = lazy/heavy
        const positionStiffness = 8.0;
        this.camera.position.lerp(idealPos, delta * positionStiffness);

        // Safety: If too far, snap
        if (this.camera.position.distanceTo(idealPos) > 20) {
            this.camera.position.lerp(idealPos, delta * 20.0); // Catch up fast
        }


        // --- 7. Rotation (LookAt + Tilt) ---
        const lookTarget = surfacePos.clone().add(railUp.multiplyScalar(GameConfig.camera.lookAtHeight));

        if (lookBack) {
            lookTarget.copy(surfacePos);
        }

        this._tempMat4.lookAt(this.camera.position, lookTarget, this._tempVec3_2); // Recycled railUp

        // Add Roll Tilt based on steering/lateral velocity
        // "Rockstar" cameras often tilt into the turn
        const tiltAmount = THREE.MathUtils.clamp(this.player.lateralVelocity * -0.002, -0.3, 0.3);
        const tiltQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), tiltAmount);

        const targetQuaternion = this._tempQuat.setFromRotationMatrix(this._tempMat4);
        targetQuaternion.multiply(tiltQuat); // Apply tilt

        this.camera.quaternion.slerp(targetQuaternion, GameConfig.camera.smoothness * delta);
    }

    private getInput() {
        // Needs a real input system, hacking window keys for prototype step 1
        return (window as any).__glyphRiderInput || {};
    }

    private setupInputListeners() {
        const keys: Record<string, boolean> = {};
        (window as any).__glyphRiderInput = {
            accelerate: false, brake: false, steer: 0, jump: false, 
            pitch: 0, yaw: 0, roll: 0, stomp: false
        };

        window.addEventListener('keydown', (e) => {
            keys[e.key.toLowerCase()] = true;
            if (e.key.toLowerCase() === 'c') this.toggleCamera();
            if (e.key.toLowerCase() === 'm') this.toggleGameMode();
            this.updateInputObject(keys);
        });

        window.addEventListener('keyup', (e) => {
            keys[e.key.toLowerCase()] = false;
            this.updateInputObject(keys);
        });
    }

    private updateInputObject(keys: Record<string, boolean>) {
        const input = (window as any).__glyphRiderInput;
        input.accelerate = keys['w'] || keys['arrowup'];
        input.brake = keys['shift'];
        input.jump = keys[' '];
        input.stomp = keys['s'] || keys['arrowdown'];

        // Steering
        let steer = 0;
        if (keys['a'] || keys['arrowleft']) steer -= 1;
        if (keys['d'] || keys['arrowright']) steer += 1;
        input.steer = steer;

        // Tricks (Default mapping)
        input.pitch = (keys['i'] ? 1 : 0) - (keys['k'] ? 1 : 0);
        input.yaw = (keys['j'] ? 1 : 0) - (keys['l'] ? 1 : 0);
        input.roll = (keys['u'] ? 1 : 0) - (keys['o'] ? 1 : 0);
    }

    private onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    public dispose() {
        // Stop Loop
        this.isRunning = false;
        this.raceStarted = false;

        // Force Context Loss to help browser cleanup
        const gl = this.renderer.getContext();
        const extension = gl.getExtension('WEBGL_lose_context');
        if (extension) {
            extension.loseContext();
        }

        // Clean up Three.js
        this.renderer.dispose();
        this.renderer.forceContextLoss(); // Three.js method
        this.scene.clear();

        // Remove Canvas
        if (this.renderer.domElement && this.parentContainer && this.parentContainer.contains(this.renderer.domElement)) {
            this.parentContainer.removeChild(this.renderer.domElement);
        }

        // Remove HUD
        if (this.hudElements && this.hudElements.container && this.parentContainer && this.parentContainer.contains(this.hudElements.container)) {
            this.parentContainer.removeChild(this.hudElements.container);
        }
    }
}
