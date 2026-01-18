import * as THREE from "three";

export interface GraphNode {
    id: string;
    position: [number, number, number];
    type: "HUB" | "MINOR" | "DEBRIS";
    size: number;
    color: number;
}

export interface GraphEdge {
    from: number; // Index in the node array
    to: number; // Index in the node array
    opacity: number;
}

// Configuration for the "Look"
const PALETTE = {
    VOID: 0x050505,
    LINK_DIM: 0x112233, // Very faint blue
    LINK_BRIGHT: 0x446688, // Structure blue
    NODE_HUB: 0xaaccff, // Pale Cyan
    NODE_MINOR: 0x334455, // Dark Grey-Blue
    ACCENT: 0xffaa00, // Amber (Events)
};

export const DATA_SET = generateEarthSphere();

function generateEarthSphere() {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // 1. ANCHOR: EARTH (The Hub)
    // Instead of a sphere, Earth is a dense core of nodes
    nodes.push({
        id: "earth_core",
        position: [0, 0, 0],
        type: "HUB",
        size: 2.0,
        color: PALETTE.NODE_HUB,
    });

    // Generate "GEO Belt" (Satellites/Debris)
    for (let i = 0; i < 400; i++) {
        const r = 4.5 + Math.random() * 1.5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1); // Sphere distribution

        // Flatten slightly to equator
        const yScale = 0.2;
        nodes.push({
            id: `geo_${i}`,
            position: [
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta) * yScale,
                r * Math.cos(phi),
            ],
            type: "DEBRIS",
            size: 0.5,
            color: PALETTE.NODE_MINOR,
        });
    }

    // 2. CLUSTERS: The "Sides" (L-Points)
    // A Side is not a dot. It is a cloud of 50 colonies.
    const sideLocations = [
        { name: "Side 1", pos: [12, 4, 8] },
        { name: "Side 2", pos: [12, -4, 8] },
        { name: "Side 3 (Zeon)", pos: [-15, 0, 5] },
        { name: "Side 4", pos: [12, 4, -8] },
        { name: "Side 5", pos: [12, -4, -8] },
        { name: "Side 6", pos: [8, 10, 0] },
        { name: "Luna", pos: [15, 0, 0] }, // Moon is a cluster too
    ];

    sideLocations.forEach((side, idx) => {
        // Create the "Hub" for the Side
        const hubIdx = nodes.length;
        nodes.push({
            id: side.name,
            position: [side.pos[0], side.pos[1], side.pos[2]],
            type: "HUB",
            size: 1.5,
            color: side.name.includes("Zeon")
                ? PALETTE.ACCENT
                : PALETTE.NODE_HUB,
        });

        // Create the "Colony Cloud" around the hub
        for (let i = 0; i < 60; i++) {
            const offset = 1.5; // Spread of the cluster
            const p = side.pos;
            const x = p[0] + (Math.random() - 0.5) * offset;
            const y = p[1] + (Math.random() - 0.5) * offset;
            const z = p[2] + (Math.random() - 0.5) * offset;

            nodes.push({
                id: `${side.name}_colony_${i}`,
                position: [x, y, z],
                type: "MINOR",
                size: 0.8,
                color: PALETTE.NODE_MINOR,
            });

            // Link minor nodes to the Hub (Spiderweb effect)
            if (Math.random() > 0.7) {
                edges.push({
                    from: hubIdx,
                    to: nodes.length - 1,
                    opacity: 0.2,
                });
            }
        }

        // Link Hub to Earth (The Route)
        edges.push({ from: 0, to: hubIdx, opacity: 0.1 });
    });

    return { nodes, edges };
}
