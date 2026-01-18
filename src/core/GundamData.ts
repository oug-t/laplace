/**
 * Gundam Universal Century Timeline - Core Data Layer
 * 地球圈（Earth Sphere）地理数据符合UC标准设定
 * 坐标单位：抽象距离单位（1单位 ≈ 1000公里）
 */

export interface GraphNode {
    id: string;
    position: [number, number, number]; // [x, y, z]
    type: 'HUB' | 'MINOR' | 'DEBRIS' | 'RUIN';
    size: number; // 视觉大小乘数
    color: number; // HEX颜色值
    start?: number; // UC开始年份
    end?: number; // UC结束年份
    name?: string; // 显示名称
    desc?: string; // 描述文本
}

export interface GraphEdge {
    from: string; // 起点节点ID
    to: string; // 终点节点ID
    type?: 'MAJOR' | 'MINOR' | 'SIDE'; // 连接线类型
    active?: number[]; // 活跃时间区间 [start, end]
}

// 高达UC配色方案 - EVE风格
const PALETTE = {
    // 主要节点
    NODE_HUB: 0xaaccff, // 枢纽 - 淡蓝色
    NODE_MINOR: 0x334455, // 次要节点 - 深蓝灰
    NODE_DEBRIS: 0x445566, // 残骸 - 中灰蓝
    NODE_RUIN: 0xaa6655, // 遗迹 - 铜锈红

    // 势力/派系
    EFSF: 0x0088ff, // 地球联邦 - 亮蓝色
    ZEON: 0xff5500, // 吉翁 - 橙红色
    AEUG: 0x00cc88, // 奥古 - 青绿色
    TITANS: 0xaa22ff, // 提坦斯 - 紫色
    NEO_ZEON: 0xff3366, // 新吉翁 - 品红

    // 特殊地点
    EARTH: 0x00aaff, // 地球 - 青色
    MOON: 0x8899aa, // 月球 - 月灰色
    COLONY: 0x44dd88, // 殖民地 - 淡绿色
    LAGRANGE: 0x6699ff, // 拉格朗日点 - 淡紫蓝

    // 功能/事件
    BATTLE: 0xff4444, // 战斗 - 警示红
    EVENT: 0xffcc00, // 重大事件 - 琥珀色
    TECH: 0x00ddff, // 技术突破 - 亮青色
};

/**
 * 计算地月系拉格朗日点坐标
 * 假设月球在X轴正方向，轨道半径=15单位
 * 所有点都在XZ平面（Y=0），符合Three.js XZ平面惯例
 */
function calculateLagrangePoints(moonDistance: number = 15): {
    L1: [number, number, number];
    L2: [number, number, number];
    L3: [number, number, number];
    L4: [number, number, number];
    L5: [number, number, number];
} {
    // 地月质量比 μ = M_moon / (M_earth + M_moon) ≈ 0.01215
    const mu = 0.01215;

    // L1: 地月之间，约0.85倍地月距离（精确解需解方程，此处用近似）
    const L1_distance = moonDistance * (1 - Math.pow(mu / 3, 1 / 3));
    const L1: [number, number, number] = [L1_distance, 0, 0];

    // L2: 月球外侧，约1.15倍地月距离
    const L2_distance = moonDistance * (1 + Math.pow(mu / 3, 1 / 3));
    const L2: [number, number, number] = [L2_distance, 0, 0];

    // L3: 地球背面，略大于地月距离
    const L3_distance = moonDistance * (1 + (5 / 12) * mu); // 近似公式
    const L3: [number, number, number] = [-L3_distance, 0, 0];

    // L4、L5: 月球轨道前后60°的等边三角形点
    const angle60 = Math.PI / 3; // 60°弧度
    const L4: [number, number, number] = [
        moonDistance * Math.cos(angle60),
        0,
        moonDistance * Math.sin(angle60),
    ];

    const L5: [number, number, number] = [
        moonDistance * Math.cos(angle60),
        0,
        -moonDistance * Math.sin(angle60),
    ];

    return { L1, L2, L3, L4, L5 };
}

/**
 * 生成地月系节点（地球圈核心）
 * 符合高达UC标准地理设定
 */
function generateEarthSphere(): GraphNode[] {
    const earth: GraphNode = {
        id: 'earth_core',
        position: [0, 0, 0],
        type: 'HUB',
        size: 4.0,
        color: PALETTE.EARTH,
        name: 'Earth',
        desc: '地球 - 人类文明的发源地，地球联邦政府所在地。UC世纪的政治、经济、文化中心。',
    };

    const moonOrbitRadius = 15;
    const moon: GraphNode = {
        id: 'moon',
        position: [moonOrbitRadius, 0, 0],
        type: 'HUB',
        size: 2.0,
        color: PALETTE.MOON,
        name: 'Moon',
        desc: '月球 - 地球唯一的天然卫星。UC 0020年代开始大规模殖民，拥有冯·布朗、格拉纳达等都市。',
    };

    // 计算拉格朗日点
    const { L1, L2, L3, L4, L5 } = calculateLagrangePoints(moonOrbitRadius);

    const lagrangeL1: GraphNode = {
        id: 'lagrange_l1',
        position: L1,
        type: 'MINOR',
        size: 1.2,
        color: PALETTE.LAGRANGE,
        name: 'L1 Point',
        desc: '地月系第一拉格朗日点 - 位于地球与月球之间，重力平衡点。UC时代初期的重要导航点。',
    };

    const lagrangeL2: GraphNode = {
        id: 'lagrange_l2',
        position: L2,
        type: 'MINOR',
        size: 1.2,
        color: PALETTE.LAGRANGE,
        name: 'L2 Point',
        desc: '地月系第二拉格朗日点 - 位于月球外侧，重力平衡点。UC 0080年代后成为重要军事据点。',
    };

    const lagrangeL3: GraphNode = {
        id: 'lagrange_l3',
        position: L3,
        type: 'MINOR',
        size: 1.2,
        color: PALETTE.LAGRANGE,
        name: 'L3 Point',
        desc: '地月系第三拉格朗日点 - 位于地球背面，与月球轨道相对。传说中的暗面区域。',
    };

    const lagrangeL4: GraphNode = {
        id: 'lagrange_l4',
        position: L4,
        type: 'HUB',
        size: 1.5,
        color: PALETTE.COLONY,
        name: 'L4 Cluster',
        desc: '地月系第四拉格朗日点 - 特洛伊点，UC 0050年代开始建设大型殖民地群。',
    };

    const lagrangeL5: GraphNode = {
        id: 'lagrange_l5',
        position: L5,
        type: 'HUB',
        size: 1.5,
        color: PALETTE.COLONY,
        name: 'L5 Cluster',
        desc: '地月系第五拉格朗日点 - 特洛伊点，Side 7所在地。UC 0079年V作战启动点。',
    };

    // 月球城市 - 紧贴月球表面（距离月球中心1.2单位）
    const vonBraun: GraphNode = {
        id: 'von_braun',
        position: [
            moonOrbitRadius + 1.2 * Math.cos(0), // 月球正面（朝向地球）
            0.5, // 略高于月球表面
            moonOrbitRadius + 1.2 * Math.sin(0),
        ],
        type: 'MINOR',
        size: 0.8,
        color: PALETTE.NODE_MINOR,
        start: 20, // UC 0020
        name: 'Von Braun City',
        desc: '冯·布朗市 - 月球正面最大都市，阿纳海姆电子公司总部所在地，UC世纪科技研发中心。',
    };

    const granada: GraphNode = {
        id: 'granada',
        position: [
            moonOrbitRadius + 1.2 * Math.cos(Math.PI), // 月球背面（背对地球）
            -0.5, // 略低于月球表面
            moonOrbitRadius + 1.2 * Math.sin(Math.PI),
        ],
        type: 'MINOR',
        size: 0.8,
        color: PALETTE.NODE_MINOR,
        start: 25, // UC 0025
        name: 'Granada',
        desc: '格拉纳达 - 月球背面工业都市，吉翁公国月球据点，大型宇宙舰船建造基地。',
    };

    // 地球轨道空间站（示例）
    const jaburoOrbit: GraphNode = {
        id: 'jaburo_orbit',
        position: [0, 5, 0], // 地球正上方
        type: 'MINOR',
        size: 1.0,
        color: PALETTE.EFSF,
        name: 'Jaburo Orbit',
        desc: '贾布罗轨道站 - 地球联邦军轨道防卫司令部，连接地球与宇宙的重要枢纽。',
    };

    return [
        earth,
        moon,
        lagrangeL1,
        lagrangeL2,
        lagrangeL3,
        lagrangeL4,
        lagrangeL5,
        vonBraun,
        granada,
        jaburoOrbit,
    ];
}

/**
 * 生成地月系连接关系
 * 反映政治、军事、经济联系
 */
function generateEarthSphereEdges(): GraphEdge[] {
    return [
        // 核心连接 - 地月轴线
        { from: 'earth_core', to: 'moon', type: 'MAJOR' },

        // 地球与拉格朗日点连接
        { from: 'earth_core', to: 'lagrange_l1', type: 'MINOR' },
        { from: 'earth_core', to: 'lagrange_l2', type: 'MINOR' },
        { from: 'earth_core', to: 'lagrange_l3', type: 'MINOR' },
        { from: 'earth_core', to: 'lagrange_l4', type: 'MAJOR' },
        { from: 'earth_core', to: 'lagrange_l5', type: 'MAJOR' },

        // 月球与拉格朗日点连接
        { from: 'moon', to: 'lagrange_l1', type: 'MINOR' },
        { from: 'moon', to: 'lagrange_l2', type: 'MINOR' },
        { from: 'moon', to: 'lagrange_l4', type: 'MINOR' },
        { from: 'moon', to: 'lagrange_l5', type: 'MINOR' },

        // 月球城市连接
        { from: 'moon', to: 'von_braun', type: 'SIDE' },
        { from: 'moon', to: 'granada', type: 'SIDE' },

        // 拉格朗日点之间的连接（形成三角网络）
        { from: 'lagrange_l4', to: 'lagrange_l5', type: 'MINOR' },
        { from: 'lagrange_l1', to: 'lagrange_l2', type: 'MINOR' },

        // 地球轨道连接
        { from: 'earth_core', to: 'jaburo_orbit', type: 'SIDE' },
        { from: 'jaburo_orbit', to: 'moon', type: 'MINOR' },
    ];
}

// 导出完整数据集
export const DATA_SET = {
    nodes: generateEarthSphere(),
    edges: generateEarthSphereEdges(),

    // 时间范围：UC 0001 - UC 0200（覆盖主要UC历史）
    timeline: {
        start: 1, // UC 0001
        end: 200, // UC 0200
        majorEvents: [
            { year: 79, name: '一年战争爆发', color: PALETTE.BATTLE },
            { year: 87, name: '格利普斯战役', color: PALETTE.TITANS },
            { year: 88, name: '第一次新吉翁战争', color: PALETTE.NEO_ZEON },
            { year: 93, name: '第二次新吉翁战争', color: PALETTE.NEO_ZEON },
            { year: 105, name: '赞斯卡尔战争', color: PALETTE.EVENT },
            { year: 153, name: '金星圈冲突', color: PALETTE.BATTLE },
        ],
    },

    // 势力时间线（用于动态着色）
    factions: {
        EFSF: { start: 10, end: 200, color: PALETTE.EFSF },
        ZEON: { start: 68, end: 80, color: PALETTE.ZEON },
        AEUG: { start: 87, end: 88, color: PALETTE.AEUG },
        TITANS: { start: 83, end: 88, color: PALETTE.TITANS },
        NEO_ZEON: { start: 88, end: 93, color: PALETTE.NEO_ZEON },
    },
};

/**
 * 工具函数：根据年份获取节点颜色（考虑势力控制变化）
 */
export function getNodeColorForYear(nodeId: string, year: number): number {
    // 简化的逻辑：返回节点基础颜色
    // 后期可扩展为根据年份和势力关系动态着色
    const node = DATA_SET.nodes.find((n) => n.id === nodeId);
    return node ? node.color : PALETTE.NODE_MINOR;
}

/**
 * 工具函数：根据年份获取活跃的连接
 */
export function getActiveEdgesForYear(year: number): GraphEdge[] {
    return DATA_SET.edges.filter((edge) => {
        if (!edge.active) return true; // 没有时间限制则始终活跃

        const [start, end] = edge.active;
        return year >= start && year <= end;
    });
}

export default DATA_SET;
