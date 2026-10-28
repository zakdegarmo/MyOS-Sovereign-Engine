import { GameConfig } from '../game/GameConfig';

export class DebugUI {
    private container: HTMLElement;
    private isVisible: boolean = false;
    private toggleBtn: HTMLButtonElement | null = null;
    private handleKeydown: (e: KeyboardEvent) => void;

    constructor(parent?: HTMLElement) {
        this.container = document.createElement('div');
        this.container.id = 'debug-ui';
        Object.assign(this.container.style, {
            position: 'absolute',
            top: '10px',
            right: '10px',
            width: '300px',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: '#00ffff',
            fontFamily: 'monospace',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #00ffff',
            maxHeight: '90vh',
            overflowY: 'auto',
            display: 'none', // Start hidden
            flexDirection: 'column',
            gap: '10px',
            zIndex: '10000',
            boxShadow: '0 0 20px rgba(0,255,255,0.2)',
            pointerEvents: 'auto'
        });

        const title = document.createElement('h3');
        title.innerText = "SYSTEM TUNER";
        title.style.margin = '0 0 10px 0';
        title.style.textAlign = 'center';
        title.style.color = '#ff00ff';
        title.style.fontSize = '12px';
        title.style.letterSpacing = '2px';
        this.container.appendChild(title);

        if (parent) {
            parent.appendChild(this.container);
        } else {
            // Optional fallback, but we prefer sandboxing
            console.warn("[DebugUI] No parent provided for System Tuner. Defaulting to hidden background mounting.");
            document.body.appendChild(this.container);
        }

        this.handleKeydown = (e: KeyboardEvent) => {
            if (e.code === 'Backquote') { // `~` key
                this.toggle();
            }
        };
        window.addEventListener('keydown', this.handleKeydown);

        this.initControls();
    }

    public toggle() {
        this.isVisible = !this.isVisible;
        this.container.style.display = this.isVisible ? 'flex' : 'none';
        if (this.toggleBtn) {
            this.toggleBtn.style.opacity = this.isVisible ? '1' : '0.4';
        }
    }

    public destroy() {
        window.removeEventListener('keydown', this.handleKeydown);
        if (this.container.parentElement) {
            this.container.parentElement.removeChild(this.container);
        }
        if (this.toggleBtn && this.toggleBtn.parentElement) {
            this.toggleBtn.parentElement.removeChild(this.toggleBtn);
        }
    }

    private initControls() {
        // Camera Controls
        this.createSection("CAMERA CONFIG", [
            { label: "Offset X", obj: GameConfig.camera, prop: "offsetX", min: -100, max: 100 },
            { label: "Offset Y", obj: GameConfig.camera, prop: "offsetY", min: -50, max: 100 },
            { label: "Offset Z", obj: GameConfig.camera, prop: "offsetZ", min: -100, max: 50 },
            { label: "LookAt Y", obj: GameConfig.camera, prop: "lookAtHeight", min: -50, max: 50 },
            { label: "Smoothing", obj: GameConfig.camera, prop: "smoothness", min: 0.1, max: 20 },
            { label: "FOV Scale", obj: GameConfig.camera, prop: "fovSpeedEffect", min: 0, max: 2 },
        ]);

        // Physics Controls
        this.createSection("PHYSICS / TRICKS", [
            { label: "Gravity", obj: GameConfig.physics, prop: "gravity", min: 10, max: 200 },
            { label: "Jump Power", obj: GameConfig.physics, prop: "jumpStrength", min: 10, max: 200 },
            { label: "Trick Speed", obj: GameConfig.tricks, prop: "rotationSpeed", min: 1, max: 10 },
            { label: "Land Window", obj: GameConfig.tricks, prop: "landingWindow", min: 0.1, max: 2.0 },
        ]);

        // Show/Hide Toggle Button
        this.toggleBtn = document.createElement('button');
        this.toggleBtn.innerText = "~"; // Tilde hint
        Object.assign(this.toggleBtn.style, {
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            width: '24px',
            height: '24px',
            background: 'rgba(0, 255, 255, 0.1)',
            color: '#00ffff',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            borderRadius: '4px',
            cursor: 'pointer',
            zIndex: '10001',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: '0.4',
            transition: 'all 0.2s'
        });
        this.toggleBtn.onclick = () => this.toggle();
        
        if (this.container.parentElement) {
            this.container.parentElement.appendChild(this.toggleBtn);
        } else {
            console.warn("[DebugUI] No parent for toggle button. Mounting to document.body (Pollution Risk)");
            document.body.appendChild(this.toggleBtn);
        }
    }

    private createSection(title: string, controls: any[]) {
        const fieldset = document.createElement('fieldset');
        fieldset.style.border = '1px solid #444';
        fieldset.style.padding = '8px';
        fieldset.style.margin = '0';

        const legend = document.createElement('legend');
        legend.innerText = title;
        legend.style.color = '#ffff00';
        legend.style.fontSize = '0.9em';
        fieldset.appendChild(legend);

        controls.forEach(ctrl => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.justifyContent = 'space-between';
            row.style.fontSize = '0.8em';
            row.style.marginBottom = '4px';

            const label = document.createElement('label');
            label.innerText = ctrl.label;

            const valDisplay = document.createElement('span');
            valDisplay.innerText = ctrl.obj[ctrl.prop].toFixed(1);
            valDisplay.style.width = '30px';
            valDisplay.style.textAlign = 'right';

            const input = document.createElement('input');
            input.type = 'range';
            input.min = String(ctrl.min);
            input.max = String(ctrl.max);
            input.step = '0.1';
            input.value = String(ctrl.obj[ctrl.prop]);
            input.style.width = '100px';

            input.oninput = (e) => {
                const val = parseFloat((e.target as HTMLInputElement).value);
                ctrl.obj[ctrl.prop] = val;
                valDisplay.innerText = val.toFixed(1);
            };

            row.appendChild(label);
            row.appendChild(input);
            row.appendChild(valDisplay);
            fieldset.appendChild(row);
        });

        this.container.appendChild(fieldset);
    }

    public addFolder(title: string) {
        const fieldset = document.createElement('fieldset');
        fieldset.style.border = '1px solid #444';
        fieldset.style.padding = '8px';
        fieldset.style.margin = '0';

        const legend = document.createElement('legend');
        legend.innerText = title;
        legend.style.color = '#ffff00';
        legend.style.fontSize = '0.9em';
        fieldset.appendChild(legend);
        this.container.appendChild(fieldset);

        return {
            add: (obj: any, prop: string, min?: number, max?: number, step?: number) => {
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.alignItems = 'center';
                row.style.justifyContent = 'space-between';
                row.style.fontSize = '0.8em';
                row.style.marginBottom = '4px';

                const label = document.createElement('label');
                label.innerText = prop;

                const input = document.createElement('input');
                let valDisplay: HTMLSpanElement | null = null;

                if (typeof obj[prop] === 'function') {
                    // Button
                    input.type = 'button';
                    input.value = "Click Me";
                    input.style.width = '100%';
                    input.onclick = () => obj[prop]();
                    row.appendChild(input);
                } else {
                    // Slider
                    valDisplay = document.createElement('span');
                    valDisplay.innerText = Number(obj[prop]).toFixed(1);
                    valDisplay.style.width = '30px';
                    valDisplay.style.textAlign = 'right';

                    input.type = 'range';
                    input.min = String(min || 0);
                    input.max = String(max || 100);
                    input.step = String(step || 0.1);
                    input.value = String(obj[prop]);
                    input.style.width = '100px';

                    input.oninput = (e) => {
                        const val = parseFloat((e.target as HTMLInputElement).value);
                        obj[prop] = val;
                        if (valDisplay) valDisplay.innerText = val.toFixed(1);
                    };

                    row.appendChild(label);
                    row.appendChild(input);
                    row.appendChild(valDisplay);
                }
                fieldset.appendChild(row);

                return {
                    name: (newName: string) => {
                        if (input.type === 'button') input.value = newName;
                        else label.innerText = newName;
                        return this;
                    }
                };
            }
        };
    }
}
