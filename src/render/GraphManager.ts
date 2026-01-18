import * as THREE from 'three';
import { DATA_SET } from '../core/GundamData';

// Add interface for node interaction data
export interface NodeInteractionData {
    name: string;
    desc: string;
    type: string;
    year: number;
    color: string;
}

export class GraphManager {
    public group: THREE.Group;

    private pointSystem: THREE.Points;
    private lineSystem: THREE.LineSegments;
    private pointMat: THREE.ShaderMaterial;
    private hoveredNode: number | null = null;
    private shiftPressed: boolean = false;

    public constructor() {
        this.group = new THREE.Group();

        // Nodes
        const nodeGeo = new THREE.BufferGeometry();

        const positions: number[] = [];
        const colors: number[] = [];
        const sizes: number[] = [];
        const starts: number[] = [];
        const ends: number[] = [];

        for (const n of DATA_SET.nodes) {
            positions.push(n.position[0], n.position[1], n.position[2]);

            const c = new THREE.Color(n.color);
            colors.push(c.r, c.g, c.b);

            if (n.type === 'HUB') {
                sizes.push(1.8);
            } else if (n.type === 'RUIN') {
                sizes.push(1.5);
            } else if (n.type === 'MINOR') {
                sizes.push(0.8);
            } else {
                sizes.push(0.5);
            }

            starts.push(n.start || 0);
            ends.push(n.end || 999);
        }

        nodeGeo.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(positions, 3)
        );
        nodeGeo.setAttribute(
            'aColor',
            new THREE.Float32BufferAttribute(colors, 3)
        );
        nodeGeo.setAttribute(
            'aSize',
            new THREE.Float32BufferAttribute(sizes, 1)
        );
        nodeGeo.setAttribute(
            'aStart',
            new THREE.Float32BufferAttribute(starts, 1)
        );
        nodeGeo.setAttribute('aEnd', new THREE.Float32BufferAttribute(ends, 1));

        // Add node IDs for interaction
        const nodeIds: number[] = [];
        DATA_SET.nodes.forEach((n, i) => nodeIds.push(i));
        nodeGeo.setAttribute(
            'nodeId',
            new THREE.Float32BufferAttribute(nodeIds, 1)
        );

        const dotTex = this.createDotTexture();

        this.pointMat = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            blending: THREE.NormalBlending,
            uniforms: {
                uMap: { value: dotTex },
                uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
                uBaseSize: { value: 12.0 },
                uCurrentYear: { value: 0 },
                uHoveredNode: { value: -1.0 },
                uTime: { value: 0.0 },
            },
            vertexShader: `
                attribute float aSize;
                attribute vec3 aColor;
                attribute float aStart;
                attribute float aEnd;
                attribute float nodeId;
                varying vec3 vColor;
                varying float vVisible;
                varying float vNodeId;
                uniform float uPixelRatio;
                uniform float uBaseSize;
                uniform float uCurrentYear;
                uniform float uHoveredNode;
                uniform float uTime;
                void main() {
                    vNodeId = nodeId;
                    vColor = aColor;
                    float isAlive = step(aStart, uCurrentYear) * step(uCurrentYear, aEnd);
                    vVisible = isAlive;
                    
                    // Hover effect
                    float hoverEffect = 0.0;
                    if (abs(nodeId - uHoveredNode) < 0.5) {
                        hoverEffect = sin(uTime * 5.0) * 0.3 + 0.7;
                    }
                    
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    if (isAlive < 0.5) {
                         gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
                    } else {
                        float dist = -mvPosition.z;
                        float baseSize = uBaseSize * aSize * uPixelRatio;
                        float size = baseSize * (1.0 + hoverEffect);
                        gl_PointSize = size * (40.0 / dist);
                        gl_Position = projectionMatrix * mvPosition;
                    }
                }
            `,
            fragmentShader: `
                uniform sampler2D uMap;
                varying vec3 vColor;
                varying float vVisible;
                varying float vNodeId;
                uniform float uHoveredNode;
                void main() {
                    if (vVisible < 0.1) discard;
                    vec4 tex = texture2D(uMap, gl_PointCoord);
                    if (tex.a < 0.05) discard;
                    
                    // Hover highlight
                    float isHovered = abs(vNodeId - uHoveredNode) < 0.5 ? 1.0 : 0.0;
                    vec3 finalColor = vColor;
                    if (isHovered > 0.5) {
                        finalColor = mix(vColor, vec3(1.0, 1.0, 0.8), 0.5);
                    }
                    
                    gl_FragColor = vec4(finalColor, tex.a * (0.8 + isHovered * 0.2));
                }
            `,
        });

        this.pointSystem = new THREE.Points(nodeGeo, this.pointMat);
        this.group.add(this.pointSystem);

        // Links
        const lineGeo = new THREE.BufferGeometry();
        const linePos: number[] = [];
        const lineCols: number[] = [];
        const c1 = new THREE.Color(0x1a2b3c);
        const c2 = new THREE.Color(0x2d4e66);

        for (const e of DATA_SET.edges) {
            const n1 = DATA_SET.nodes[e.from];
            const n2 = DATA_SET.nodes[e.to];
            linePos.push(n1.position[0], n1.position[1], n1.position[2]);
            linePos.push(n2.position[0], n2.position[1], n2.position[2]);
            lineCols.push(c1.r, c1.g, c1.b);
            lineCols.push(c2.r, c2.g, c2.b);
        }

        lineGeo.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(linePos, 3)
        );
        lineGeo.setAttribute(
            'color',
            new THREE.Float32BufferAttribute(lineCols, 3)
        );

        const lineMat = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.08,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });

        this.lineSystem = new THREE.LineSegments(lineGeo, lineMat);
        this.group.add(this.lineSystem);

        this.createLagrangeBelt();

        window.addEventListener('resize', () => {
            this.pointMat.uniforms.uPixelRatio.value = Math.min(
                window.devicePixelRatio,
                2
            );
        });

        // Keyboard event listeners for shift key
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Shift') {
                this.shiftPressed = true;
                this.onShiftStateChange(true);
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.key === 'Shift') {
                this.shiftPressed = false;
                this.onShiftStateChange(false);
            }
        });
    }

    public update(time: number, currentYear: number): void {
        const t = time * 0.001;
        this.pointMat.uniforms.uBaseSize.value = 12.0 + Math.sin(t * 0.5) * 1.0;
        this.pointMat.uniforms.uTime.value = t;
        this.group.rotation.y = t * 0.02;
        this.pointMat.uniforms.uCurrentYear.value = currentYear;
    }

    /**
     * Check for node interactions at screen coordinates
     */
    public checkInteractions(
        x: number,
        y: number,
        camera: THREE.Camera
    ): NodeInteractionData | null {
        // This would need to be implemented with raycaster
        // For now, returns null - implement when you need click interactions on nodes
        return null;
    }

    /**
     * Set hovered node for visual feedback
     */
    public setHoveredNode(nodeId: number | null): void {
        this.hoveredNode = nodeId;
        this.pointMat.uniforms.uHoveredNode.value =
            nodeId !== null ? nodeId : -1.0;
    }

    /**
     * Called when shift key state changes
     */
    private onShiftStateChange(pressed: boolean): void {
        this.shiftPressed = pressed;

        // Visual feedback when shift is pressed
        if (pressed) {
            this.pointMat.uniforms.uBaseSize.value *= 1.2; // Slightly enlarge nodes
        } else {
            this.pointMat.uniforms.uBaseSize.value = 12.0; // Reset to default
        }

        // Optional: Change link visibility based on shift
        if (this.lineSystem.material instanceof THREE.LineBasicMaterial) {
            this.lineSystem.material.opacity = pressed ? 0.15 : 0.08;
        }
    }

    /**
     * Get current shift state
     */
    public isShiftPressed(): boolean {
        return this.shiftPressed;
    }

    private createDotTexture(): THREE.Texture {
        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D context failed');

        const c = size / 2;
        ctx.beginPath();
        ctx.arc(c, c, size * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
        ctx.fill();

        const grad = ctx.createRadialGradient(
            c,
            c,
            size * 0.3,
            c,
            c,
            size * 0.5
        );
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(c, c, size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    private createLagrangeBelt() {
        const hubs = DATA_SET.nodes.filter(
            (n) =>
                n.id !== 'earth_core' &&
                (n.type === 'HUB' ||
                    n.id.includes('Side') ||
                    n.id.includes('Moon') ||
                    n.id.includes('Luna') ||
                    n.id.includes('Axis'))
        );

        if (hubs.length < 3) return;

        const sortedHubs = hubs
            .map((n) => {
                const vec = new THREE.Vector3(
                    n.position[0],
                    n.position[1],
                    n.position[2]
                );
                const angle = Math.atan2(vec.z, vec.x);
                return { vec, angle };
            })
            .sort((a, b) => a.angle - b.angle);

        const points = sortedHubs.map((item) => item.vec);
        const curve = new THREE.CatmullRomCurve3(
            points,
            true,
            'centripetal',
            0.5
        );

        const curvePoints = curve.getPoints(200);
        const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);

        const material = new THREE.LineBasicMaterial({
            color: 0x00aaff, // Cyan/Electric Blue
            transparent: true,
            opacity: 0.25,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false,
        });

        const belt = new THREE.LineLoop(geometry, material);
        this.group.add(belt);
    }

    /**
     * Cleanup resources
     */
    public dispose(): void {
        this.pointSystem.geometry.dispose();
        (this.pointSystem.material as THREE.Material).dispose();
        this.lineSystem.geometry.dispose();
        this.lineSystem.material.dispose();
        this.group.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                child.material.dispose();
            }
        });
    }
}
