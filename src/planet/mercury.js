import * as THREE from 'three'
import {loadGLTF} from "../lib/loadGLTF";
import {scaleModel} from "../lib/scalModel";
import {centerModelToOrigin} from "../lib/centerModelToOrigin";
import {initOrbitalGroupPosition} from "./helper/position";
import {setOrbitalGroupPosition} from "./helper/revolution";
import {setSpinAutoRotation} from "./helper/autoRotation";
import {createOrbitPath} from "./helper/orbitPath";
import {setShadowCastReceive} from "../lib/setShadow";
import {listMeshes} from "../lib/listMeshes";

export const config = {
    groupName: 'MercuryRoot',
    axisName: 'MercuryAxis',
    spinName: 'MercurySpin',
    path: '../../assets/mercury/scene.gltf',
    scale: {
        size: 1,
    },
    autoRotation: {
        // 自转速度
        speed: 0.04,
    },
    orbit: {
        // 长半轴
        semiMajorAxis: 15,
        // 轨道偏心率
        eccentricity: 0.2056,
        // 轨道倾角(轨道面和黄道面形成的夹角) 单位: 角度
        dipAngle: 7,
        // 公转速度
        speed: 0.01,
        path: {
            name: 'MercuryOrbit',
            segment: 256,
            // 轨道路径颜色
            color: 0x888888,
            // 轨道路径是否透明
            transparent: true,
            // 轨道路径透明度值
            opacity: 0.6,
        }
    },
    label: {
        bodyType: 'planet',
        name: 'Mercury',
    },
}

/**
 * @type {THREE.Group} 轨道面倾角层 用于倾斜整个系统
 * 这里说的整个系统是指: 轨道线 + 公转层 + 自转层 + 模型本体
 * 层级: mercuryAxis -> mercuryRoot -> mercurySpin -> mercuryModel
 * */
export const mercuryAxis = new THREE.Group()
mercuryAxis.name = config.axisName

/**
 * @type {THREE.Group} 水星公转层 用于控制水星的公转
 * */
const mercuryRoot = new THREE.Group()
mercuryRoot.name = config.groupName
mercuryRoot.userData.bodyType = config.label.bodyType
mercuryRoot.userData.label = config.label.name

/**
 * @type {THREE.Group} 水星自转层 用于控制水星的自转
 * */
const mercurySpin = new THREE.Group()
mercurySpin.name = config.spinName

/**
 * @type {THREE.Object3D|null} 水星模型实例 负责水星的外观/缩放/居中
 * */
let mercuryModel = null

/**
 * @type {Object} 当前公转角的角度 用于计算水星公转位置
 * Tips: 这里使用对象包装是为了在函数中传递引用类型 从而实现角度值的更新
 * */
let orbitAngle = {
    value: 0,
}

/**
 * @type {Array<THREE.Mesh>} 可拾取对象数组 用于存储水星模型中所有可以被鼠标悬停检测的物体
 * */
export let pickableMeshes = []

/**
 * 本函数用于初始化水星模型组 (模型组包括: 轨道组 -> 公转组 -> 自转组 -> 模型本体)
 * @return {Promise<void>}
 * @throws {Error} 如果加载水星模型失败则抛出错误
 * */
export async function initMercury() {
    let gltf = null
    try {
        gltf = await loadGLTF(config.path)
    } catch (err) {
        console.error('加载水星模型失败:', err)
        throw err
    }

    mercuryModel = gltf.scene
    setShadowCastReceive(mercuryModel)

    // 缩放模型
    scaleModel(mercuryModel, config.scale.size)
    // 居中模型
    centerModelToOrigin(mercuryModel)

    pickableMeshes = listMeshes(mercuryModel)
    for (const pickableMesh of pickableMeshes) {
        pickableMesh.userData.anchorPointName = config.groupName
    }

    // 按层级挂载对象
    mercurySpin.clear()
    mercurySpin.add(mercuryModel)

    mercuryRoot.clear()
    mercuryRoot.add(mercurySpin)

    mercuryAxis.clear()
    mercuryAxis.add(mercuryRoot)

    // 倾斜自转轴
    mercuryAxis.rotation.x = THREE.MathUtils.degToRad(config.orbit.dipAngle)

    // 初始化水星位置
    initOrbitalGroupPosition(mercuryRoot, orbitAngle.value, config.orbit.semiMajorAxis, config.orbit.eccentricity)

    // 创建轨道路径并添加到自转轴组中
    const orbitPath = createOrbitPath(config.orbit.semiMajorAxis, config.orbit.eccentricity, config.orbit.path)
    mercuryAxis.add(orbitPath)

    // 用于确认自转轴方向的辅助线
    // const axisHelper = new THREE.AxesHelper(10)
    // mercuryAxis.add(axisHelper)
}

/**
 * 本函数用于更新水星的自转和公转状态
 * @param {boolean} needRevolution 是否需要更新公转位置
 * */
export function updateMercury(needRevolution) {
    if (needRevolution) {
        setRevolution()
    }

    setSpinAutoRotation(mercurySpin, config.autoRotation.speed)
}

/**
 * 本函数用于设置水星的公转(移动mercuryRoot的位置)
 * @return {void}
 * */
function setRevolution() {
    // 更新公转角参数
    orbitAngle.value += config.orbit.speed
    setOrbitalGroupPosition(mercuryRoot, orbitAngle, config.orbit.semiMajorAxis, config.orbit.eccentricity)
}
