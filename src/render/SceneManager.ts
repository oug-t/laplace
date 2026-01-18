import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TimeController } from "../core/TimeController";
import { createStarfield } from "./components/Starfield";
import { BackgroundShader } from "./components/BackgroundShader";
import { BattleManager } from "../core/BattleManager";

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

    constructor(container: HTMLElement) {
        this.scene = new THREE.Scene();

        // ----------------------------------------
        // Camera
        // ----------------------------------------

        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            2000
        );
        this.camera.position.set(0, 15, 35);
        this.camera.lookAt(0, 0, 0);

        // ----------------------------------------
        // Renderer
        // ----------------------------------------

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false,
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(this.renderer.domElement);

        // ----------------------------------------
        // Controls
        // ----------------------------------------

        this.controls = new OrbitControls(
            this.camera,
            this.renderer.domElement
        );
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 100;
        this.controls.enablePan = true;

        // ----------------------------------------
        // Backgrond
        // ----------------------------------------

        this.backgroundShader = new BackgroundShader();
        this.scene.add(this.backgroundShader.mesh);

        const starfield = createStarfield(4000);
        this.scene.add(starfield);

        // ----------------------------------------
        // Lighting
        // ----------------------------------------
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        sunLight.position.set(50, 20, 30);
        this.scene.add(sunLight);
        this.scene.add(new THREE.AmbientLight(0x404040, 3.0));

        // 6. Build Systems (Holo Earth)
        this.buildHoloEarth();

        this.battleMgr = new BattleManager();
        this.scene.add(this.battleMgr.group);

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        window.addEventListener("resize", () => this.onWindowResize());
    }

    private buildHoloEarth() {
        this.earthGroup = new THREE.Group();
        this.scene.add(this.earthGroup);
        const r = 4;

        // Layer 1: Occlusion Core
        const coreGeo = new THREE.SphereGeometry(r * 0.98, 32, 32);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        this.earthGroup.add(new THREE.Mesh(coreGeo, coreMat));

        // Layer 2: Holo Grid
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

        // Layer 3: Data Nodes
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
            "position",
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

        // ----------------------------------------
        // Moon
        // ----------------------------------------
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
        this.controls.update();

        if (this.moonGroup)
            this.moonGroup.rotation.y = timeController.currentYear * 0.5;
        if (this.earthGroup) {
            this.earthGroup.rotation.y += 0.001;
            this.earthGroup.children[1].rotation.y -= 0.0005;
        }

        if (this.battleMgr) this.battleMgr.update(timeController.currentYear);

        this.renderer.render(this.scene, this.camera);
    }

    // ... (Keep existing interaction/resize logic)
    public checkInteractions(x: number, y: number): any {
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
}
