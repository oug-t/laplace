import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TimeController } from '../core/TimeController';
import { createStarfield } from './components/Starfield';
import { BackgroundShader } from './components/BackgroundShader';
import { BattleManager } from '../core/BattleManager';

export interface InteractionData {
    name: string;
    desc: string;
}

export class SceneManager {
    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    public renderer: THREE.WebGLRenderer;
    public controls: OrbitControls;

    private raycaster: THREE.Raycaster;
    private mouse: THREE.Vector2;
    private earthGroup: THREE.Group;
    private moonGroup: THREE.Group;
    private backgroundShader: BackgroundShader;
    private battleMgr: BattleManager;
    private shiftPressed: boolean;
    private lastRenderTime: number;

    constructor(container: HTMLElement) {
        this.scene = new THREE.Scene();
        this.shiftPressed = false;
        this.lastRenderTime = performance.now();

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            2000
        );
        this.camera.position.set(0, 15, 35);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false,
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000010); // Deep space blue-black
        container.appendChild(this.renderer.domElement);

        // Controls
        this.controls = new OrbitControls(
            this.camera,
            this.renderer.domElement
        );
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 100;
        this.controls.enablePan = true;
        this.controls.enableZoom = true;

        // Keyboard event listeners for shift key
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Shift') {
                this.shiftPressed = true;
                this.controls.enableZoom = false;
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.key === 'Shift') {
                this.shiftPressed = false;
                this.controls.enableZoom = true;
            }
        });

        // Background
        this.backgroundShader = new BackgroundShader();
        this.scene.add(this.backgroundShader.mesh);

        const starfield = createStarfield(4000);
        this.scene.add(starfield);

        // Lighting
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        sunLight.position.set(50, 20, 30);
        this.scene.add(sunLight);
        this.scene.add(new THREE.AmbientLight(0x404040, 3.0));

        this.buildHoloEarth();

        this.battleMgr = new BattleManager();
        this.scene.add(this.battleMgr.group);

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        window.addEventListener('resize', () => this.onWindowResize());
    }

    /**
     * Handles zoom input from mouse wheel (normal scroll)
     * Uses OrbitControls built-in zoom when shift is NOT pressed
     */
    public handleZoom(deltaY: number): void {
        // We don't need custom zoom logic anymore since OrbitControls handles it
        // This method is kept for API compatibility but does nothing
        // The actual zoom is handled by OrbitControls when enableZoom = true
        const zoomSpeed = 0.01;
        this.camera.position.z += deltaY * zoomSpeed;
    }

    /**
     * Updates OrbitControls zoom enable state based on shift key
     * This should be called from main.ts when shift state changes
     */
    public setZoomEnabled(enabled: boolean): void {
        this.controls.enableZoom = enabled;
    }

    /**
     * Check if shift is currently pressed (useful for UI feedback)
     */
    public isShiftPressed(): boolean {
        return this.shiftPressed;
    }

    private buildHoloEarth() {
        this.earthGroup = new THREE.Group();
        this.scene.add(this.earthGroup);
        const r = 4;

        // Occlusion Core
        const coreGeo = new THREE.SphereGeometry(r * 0.98, 32, 32);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        this.earthGroup.add(new THREE.Mesh(coreGeo, coreMat));

        // Holo Grid
        const wireGeo = new THREE.WireframeGeometry(
            new THREE.IcosahedronGeometry(r, 4)
        );
        const wireMat = new THREE.LineBasicMaterial({
            color: 0x0055aa,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending,
        });
        const wireMesh = new THREE.LineSegments(wireGeo, wireMat);
        this.earthGroup.add(wireMesh);

        // Data Nodes
        const pointsGeo = new THREE.BufferGeometry();
        const positions = [];
        for (let i = 0; i < 300; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);
            positions.push(x, y, z);
        }
        pointsGeo.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(positions, 3)
        );
        const pointsMat = new THREE.PointsMaterial({
            color: 0xaaccff,
            size: 0.1,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
        });
        this.earthGroup.add(new THREE.Points(pointsGeo, pointsMat));

        // Moon
        this.moonGroup = new THREE.Group();
        this.scene.add(this.moonGroup);

        const orbitRadius = 15;
        const orbitCurve = new THREE.EllipseCurve(
            0,
            0,
            orbitRadius,
            orbitRadius,
            0,
            2 * Math.PI,
            false,
            0
        );
        const orbitGeo = new THREE.BufferGeometry().setFromPoints(
            orbitCurve.getPoints(128)
        );
        const orbitMat = new THREE.LineBasicMaterial({
            color: 0x334455,
            transparent: true,
            opacity: 0.2,
        });
        const orbitLine = new THREE.LineLoop(orbitGeo, orbitMat);
        orbitLine.rotation.x = Math.PI / 2;
        this.scene.add(orbitLine);

        const moonGeo = new THREE.IcosahedronGeometry(1.0, 2);
        const moonWireGeo = new THREE.WireframeGeometry(moonGeo);
        const moonMat = new THREE.LineBasicMaterial({
            color: 0x445566,
            transparent: true,
            opacity: 0.3,
        });
        const moon = new THREE.LineSegments(moonWireGeo, moonMat);
        moon.position.set(orbitRadius, 0, 0);
        this.moonGroup.add(moon);
    }

    public render(timeController: TimeController) {
        // Update controls first
        this.controls.update();

        const currentYear = timeController.currentYear;
        const normalizedYear = (currentYear - 1) / 99; // UC 0001-0100 normalized to 0-1

        // Temporal update for all systems
        this.updateTemporalSystems(currentYear, normalizedYear, timeController);

        // EVE-inspired subtle background pulse
        this.updateBackgroundPulse(timeController);

        // Render frame
        this.renderer.render(this.scene, this.camera);

        // Update render timestamp
        this.lastRenderTime = performance.now();
    }

    /**
     * Update all temporal elements with current year context
     */
    /**
     * Update all temporal elements with current year context
     */
    private updateTemporalSystems(
        currentYear: number,
        normalizedYear: number,
        timeController: TimeController
    ): void {
        // Moon orbital position (linked to timeline)
        if (this.moonGroup) {
            // Full orbit every ~10 UC years for visual reference
            this.moonGroup.rotation.y = currentYear * 0.2;

            // FIX: Update moon position to follow orbit
            const orbitRadius = 15;
            const orbitProgress = currentYear * 0.2; // Same as rotation for consistency
            this.moonGroup.position.x = Math.cos(orbitProgress) * orbitRadius;
            this.moonGroup.position.z = Math.sin(orbitProgress) * orbitRadius;
            this.moonGroup.position.y = 0;
        }

        // Rest of your code...
    }

    /**
     * EVE-inspired subtle environmental effects
     */
    private updateBackgroundPulse(timeController: TimeController): void {
        // Subtle background pulse when time is moving
        if (timeController.isMoving && timeController.isMoving()) {
            const pulse = Math.sin(performance.now() * 0.002) * 0.05 + 0.95;
            this.renderer.setClearColor(
                new THREE.Color(0x000010).multiplyScalar(pulse)
            );
        } else {
            this.renderer.setClearColor(0x000010);
        }

        // Time transition glow effect
        if (timeController.inTransition && timeController.inTransition()) {
            const transitionStartTime =
                (timeController as any).transitionStartTime || 0;
            const transitionProgress = Math.min(
                (performance.now() - transitionStartTime) / 300,
                1
            );
            const glowIntensity = Math.sin(transitionProgress * Math.PI) * 0.1;

            // Add subtle post-processing-like effect via shader uniform
            if (
                this.backgroundShader &&
                typeof (this.backgroundShader as any).setGlow === 'function'
            ) {
                (this.backgroundShader as any).setGlow(glowIntensity);
            }
        }
    }

    public checkInteractions(x: number, y: number): InteractionData | null {
        this.mouse.set(
            (x / window.innerWidth) * 2 - 1,
            -(y / window.innerHeight) * 2 + 1
        );
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(
            this.scene.children,
            true
        );
        const hit = intersects.find((i) => i.object.userData.name);
        return hit ? hit.object.userData : null;
    }

    private onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    /**
     * Cleanup method to dispose of Three.js resources
     */
    public dispose(): void {
        // Remove event listeners
        window.removeEventListener('keydown', () => {});
        window.removeEventListener('keyup', () => {});

        // Dispose Three.js resources
        this.renderer.dispose();
        this.controls.dispose();
        this.scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                object.geometry.dispose();
                if (Array.isArray(object.material)) {
                    object.material.forEach((material) => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
    }

    /**
     * For future expansion: temporal highlighting system
     */
    public highlightTemporalRange(startYear: number, endYear: number): void {
        // Could be used for highlighting specific UC eras or events
        // Implementation depends on your visual design
        console.log(`Highlighting UC ${startYear} - UC ${endYear}`);
    }

    /**
     * Jump to a specific temporal viewpoint
     */
    public focusOnYear(year: number): void {
        // Smooth camera transition to focus on timeline position
        const targetPosition = new THREE.Vector3(
            0,
            15,
            35 - (year / 100) * 10 // Example: move along Z based on year
        );

        // Could implement smooth camera interpolation here
        this.camera.position.lerp(targetPosition, 0.1);
        this.controls.target.set(0, 0, 0);
    }

    /**
     * Reset view to default temporal position
     */
    public resetTemporalView(): void {
        this.camera.position.set(0, 15, 35);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }
}
