/**
 * 八大行星配置 按距太阳由近到远排列
 *
 * 配置项说明:
 * @property {string}  id            - 行星唯一标识符
 * @property {string}  groupName     - 公转层 Group 的 name, 也用于 anchorPointName 追溯祖先节点
 * @property {string}  axisName      - 轨道面倾角层 Group 的 name
 * @property {string}  spinName      - 自转层 Group 的 name
 * @property {string}  path          - GLTF 模型文件路径
 * @property {number}  scale         - 模型缩放比例
 * @property {number}  rotationSpeed - 自转速度 (负值表示逆向自转, 如金星)
 * @property {Object}  orbit         - 轨道参数
 * @property {number}  orbit.semiMajorAxis - 轨道长半轴 (决定行星离太阳的距离)
 * @property {number}  orbit.eccentricity  - 轨道偏心率 (0为正圆, 越大越椭)
 * @property {number}  orbit.dipAngle      - 轨道倾角, 轨道面与黄道面的夹角, 单位: 度
 * @property {number}  orbit.speed         - 公转速度 (每帧增加的角度值)
 * @property {Object}  label         - 悬停/聚焦时显示的标签信息
 * @property {string}  label.bodyType - 天体类型标识 (固定为 'planet')
 * @property {string}  label.name     - 天体中文名称
 * @property {string}  label.intro    - 天体介绍文字
 * @property {boolean} isOuter       - 是否为外行星 (木星及以远), 外行星启用 Layer 2 补光
 */
export const PLANET_CONFIGS = [
    {
        id: 'mercury',
        groupName: 'MercuryRoot',
        axisName: 'MercuryAxis',
        spinName: 'MercurySpin',
        path: '../../assets/mercury/scene.gltf',
        scale: 1,
        rotationSpeed: 0.04,
        orbit: {
            semiMajorAxis: 15,
            eccentricity: 0.2056,
            dipAngle: 7,
            speed: 0.01,
        },
        label: {
            bodyType: 'planet',
            name: '水星',
            intro: '一段水星的介绍文字',
        },
        isOuter: false,
    },
    {
        id: 'venus',
        groupName: 'venusRoot',
        axisName: 'venusAxis',
        spinName: 'venusSpin',
        path: '../assets/venus/scene.gltf',
        scale: 2.5,
        rotationSpeed: -0.0096,
        orbit: {
            semiMajorAxis: 28,
            eccentricity: 0.0068,
            dipAngle: 3.39,
            speed: 0.0039,
        },
        label: {
            bodyType: 'planet',
            name: '金星',
            intro: '一段金星的介绍文字',
        },
        isOuter: false,
    },
    {
        id: 'earth',
        groupName: 'earthRoot',
        axisName: 'earthAxis',
        spinName: 'earthSpin',
        path: '../assets/earth/scene.gltf',
        scale: 2.6,
        rotationSpeed: 0.08,
        orbit: {
            semiMajorAxis: 38.86,
            eccentricity: 0.0167,
            dipAngle: 0,
            speed: 0.0024,
        },
        label: {
            bodyType: 'planet',
            name: '地球',
            intro: '一段地球的介绍文字',
        },
        isOuter: false,
    },
    {
        id: 'mars',
        groupName: 'marsRoot',
        axisName: 'marsAxis',
        spinName: 'marsSpin',
        path: '../assets/mars/scene.gltf',
        scale: 1.4,
        rotationSpeed: 0.12,
        orbit: {
            semiMajorAxis: 59.21,
            eccentricity: 0.0934,
            dipAngle: 1.85,
            speed: 0.0013,
        },
        label: {
            bodyType: 'planet',
            name: '火星',
            intro: '一段火星的介绍文字',
        },
        isOuter: false,
    },
    {
        id: 'jupiter',
        groupName: 'jupiterRoot',
        axisName: 'jupiterAxis',
        spinName: 'jupiterSpin',
        path: '../assets/jupiter/scene.gltf',
        scale: 29.3,
        rotationSpeed: 0.23,
        orbit: {
            semiMajorAxis: 202.227,
            eccentricity: 0.0489,
            dipAngle: 1.304,
            speed: 0.0002,
        },
        label: {
            bodyType: 'planet',
            name: '木星',
            intro: '一段木星的介绍文字',
        },
        isOuter: true,
    },
    {
        id: 'saturn',
        groupName: 'saturnRoot',
        axisName: 'saturnAxis',
        spinName: 'saturnSpin',
        path: '../assets/saturn/scene.gltf',
        scale: 24.7,
        rotationSpeed: 0.07,
        orbit: {
            semiMajorAxis: 370.611,
            eccentricity: 0.0542,
            dipAngle: 2.484,
            speed: 0.00008,
        },
        label: {
            bodyType: 'planet',
            name: '土星',
            intro: '一段土星的介绍文字',
        },
        isOuter: true,
    },
    {
        id: 'uranus',
        groupName: 'uranusRoot',
        axisName: 'uranusAxis',
        spinName: 'uranusSpin',
        path: '../assets/uranus/scene.gltf',
        scale: 10.5,
        rotationSpeed: 0.13,
        orbit: {
            semiMajorAxis: 745.773,
            eccentricity: 0.0472,
            dipAngle: 0.771,
            speed: 0.00003,
        },
        label: {
            bodyType: 'planet',
            name: '天王星',
            intro: '一段天王星的介绍文字',
        },
        isOuter: true,
    },
    {
        id: 'neptune',
        groupName: 'NeptuneRoot',
        axisName: 'NeptuneAxis',
        spinName: 'NeptuneSpin',
        path: '../../assets/neptune/scene.gltf',
        scale: 10.2,
        rotationSpeed: 0.34,
        orbit: {
            semiMajorAxis: 1165.91,
            eccentricity: 0.0087,
            dipAngle: 1.77,
            speed: 0.00001,
        },
        label: {
            bodyType: 'planet',
            name: '海王星',
            intro: '一段海王星的介绍文字',
        },
        isOuter: true,
    },
]