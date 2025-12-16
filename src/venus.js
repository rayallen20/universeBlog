import * as THREE from 'three'
import {loadGLTF} from "./lib/loadGLTF";
import {scaleModel} from "./lib/scalModel";
import {centerModelToOrigin} from "./lib/centerModelToOrigin";
import {initOrbitalGroupPosition} from "./planetHelper/position";
import {setOrbitalGroupPosition} from "./planetHelper/revolution";
import {setSpinAutoRotation} from "./planetHelper/autoRotation";
import {createOrbitPath} from "./planetHelper/orbitPath";
import {setShadowCastReceive} from "./lib/setShadow";

const config = {
    groupName: 'venusRoot',
    axisName: 'venusAxis',
    spinName: 'venusSpin',
    path: '../assets/venus/scene.gltf',
    scale: {
        size: 2.5,
    },
    autoRotation: {
        // 金星是逆时针方向自转的 所以自转速度为负值
        speed: -0.0096,
    },
    orbit: {
        // 长半轴
        semiMajorAxis: 28,
        // 轨道偏心率
        eccentricity: 0.0068,
        // 轨道倾角(轨道面和黄道面形成的夹角) 单位: 角度
        dipAngle: 3.39,
        // 公转速度
        speed: 0.0039,
        path: {
            // 轨道路径对象名称
            name: 'venusOrbit',
            // 轨道路径分段数
            segment: 256,
            // 轨道路径颜色
            color: 0x888888,
            // 轨道路径是否透明
            transparent: true,
            // 轨道路径透明度值
            opacity: 0.6,
        }
    }
}

/**
 * @type {THREE.Group} 轨道面倾角层
 * */
export const venusAxis = new THREE.Group()
venusAxis.name = config.axisName

/**
 * @type {THREE.Group} 金星公转层
 * */
const venusRoot = new THREE.Group()
venusRoot.name = config.groupName
venusAxis.add(venusRoot)

/**
 * @type {THREE.Group} 金星自转层
 * */
const venusSpin = new THREE.Group()
venusSpin.name = config.spinName
venusRoot.add(venusSpin)

/**
 * @type {THREE.Group|null} 金星模型
 * */
let venusModel = null

/**
 * @type {Object} 金星公转角度 用于计算金星在轨道上的位置
 * Tips: 这里使用对象包装是为了在函数中传递引用类型 从而实现角度值的更新
 * */
let orbitAngle = {
    value: 0,
}

/**
 * 本函数用于初始化金星模型组 (模型组包括: 轨道组 -> 公转组 -> 自转组 -> 模型)
 * @return {Promise<void>}
 * @throws {Error} 如果加载金星模型失败则抛出错误
 * */
export async function initVenus() {
    let gltf = null
    try {
        gltf = await loadGLTF(config.path)
    } catch (err) {
        console.error('加载金星模型失败:', err)
        throw err
    }

    venusModel = gltf.scene
    setShadowCastReceive(venusModel)

    scaleModel(venusModel, config.scale.size)
    centerModelToOrigin(venusModel)

    // 按层级挂载对象
    venusSpin.clear()
    venusSpin.add(venusModel)

    venusRoot.clear()
    venusRoot.add(venusSpin)

    venusAxis.clear()
    venusAxis.add(venusRoot)

    // 倾斜轨道层
    venusAxis.rotation.x = THREE.MathUtils.degToRad(config.orbit.dipAngle)

    // 初始化金星位置
    initOrbitalGroupPosition(venusRoot, orbitAngle.value, config.orbit.semiMajorAxis, config.orbit.eccentricity)

    // 创建轨道路径并添加到轨道层中
    const orbitPath = createOrbitPath(config.orbit.semiMajorAxis, config.orbit.eccentricity, config.orbit.path)
    venusAxis.add(orbitPath)

    // 用于确认自转轴方向的辅助线
    // const axisHelper = new THREE.AxesHelper(10)
    // venusAxis.add(axisHelper)
}

export function updateVenus() {
    setRevolution()
    setSpinAutoRotation(venusSpin, config.autoRotation.speed)
}

/**
 * 本函数用于设置金星的公转(移动venusRoot的位置)
 * @return {void}
 * */
function setRevolution() {
    orbitAngle.value += config.orbit.speed
    setOrbitalGroupPosition(venusRoot, orbitAngle, config.orbit.semiMajorAxis, config.orbit.eccentricity)
}