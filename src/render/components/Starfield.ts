import * as THREE from "three";

export function createStarfield(count: number = 2000): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
        // Random position in a large sphere
        const r = 400 + Math.random() * 400; // Distance from center
        const theta = 2 * Math.PI * Math.random();
        const phi = Math.acos(2 * Math.random() - 1);

        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        // Color variation: mostly white/blue, some faint red
        // This makes it look like deep space
        const starType = Math.random();
        if (starType > 0.9)
            color.setHex(0xaaeeff); // Blue giant
        else if (starType > 0.7)
            color.setHex(0xffddaa); // Yellow/Orange
        else color.setHex(0xffffff); // White

        // Random opacity variation handled in shader or via vertex colors
        // For simplicity, we just darken the color itself
        const brightness = 0.5 + Math.random() * 0.5;
        colors[i * 3] = color.r * brightness;
        colors[i * 3 + 1] = color.g * brightness;
        colors[i * 3 + 2] = color.b * brightness;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 1.5,
        vertexColors: true, // Use the colors we defined
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true,
    });

    return new THREE.Points(geometry, material);
}
