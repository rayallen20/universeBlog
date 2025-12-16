import * as THREE from 'three'
import {loadGLTF} from "./lib/loadGLTF";
import {scaleModel} from "./lib/scalModel";
import {centerModelToOrigin} from "./lib/centerModelToOrigin";

const config = {
    groupName: 'MercuryRoot',
    axisName: 'MercuryAxis',
    spinName: 'MercurySpin',
    path: '../assets/mercury/scene.gltf',
    scale: {
        size: 1,
    },
    autoRotation: {
        // 自转速度
        speed: 0.04,
    },
    orbit: {
        name: 'MercurySpin',
        // 长半轴
        semiMajorAxis: 15,
        // 轨道偏心率
        eccentricity: 0.2056,
        // 轨道倾角(轨道面和黄道面形成的夹角) 单位: 角度
        dipAngle: 7,
        // 公转速度
        speed: 0.01,
        path: {
            segment: 256,
            // 轨道路径颜色
            color: 0x888888,
            // 轨道路径线宽
            lineWidth: 1.2,
            // 轨道路径是否透明
            transparent: true,
            // 轨道路径透明度值
            opacity: 0.4,
        }
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
mercuryAxis.add(mercuryRoot)

/**
 * @type {THREE.Group} 水星自转层 用于控制水星的自转
 * */
const mercurySpin = new THREE.Group()
mercurySpin.name = config.spinName
mercuryRoot.add(mercurySpin)

/**
 * @type {THREE.Object3D|null} 水星模型实例 负责水星的外观/缩放/居中
 * */
let mercuryModel = null

/**
 * @type {number} 当前公转角的角度 用于计算水星公转位置
 * */
let orbitAngle = 0

/**
 * 本函数用于初始化水星模型
 * @return {Promise<void>}
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

    // 缩放模型
    scaleModel(mercuryModel, config.scale.size)
    // 居中模型
    centerModelToOrigin(mercuryModel)

    // 按层级挂载
    mercuryRoot.clear()
    mercuryRoot.add(mercurySpin)

    mercurySpin.clear()
    mercurySpin.add(mercuryModel)

    // 倾斜自转轴
    mercuryAxis.rotation.x = THREE.MathUtils.degToRad(config.orbit.dipAngle)

    // 初始化水星位置
    initMercuryPosition()

    // 创建轨道路径并添加到自转轴组中
    const orbitPath = createOrbitPath()
    mercuryAxis.add(orbitPath)

    // 用于确认自转轴方向的辅助线
    // const axisHelper = new THREE.AxesHelper(10)
    // mercuryAxis.add(axisHelper)
}



/**
 * 本函数用于设置水星的初始位置
 * */
function initMercuryPosition() {
    const position = calcMercuryPosition(orbitAngle)

    mercuryRoot.position.set(position.x, 0, position.z)
}

/**
 * 本函数用于计算水星在轨道上的位置
 * @param {number} theta 公转角度
 * @return {{x: number, z: number}} 水星在轨道上的位置坐标
 * */
function calcMercuryPosition(theta) {
    // 计算水星在轨道上的位置
    const a = config.orbit.semiMajorAxis
    const e = config.orbit.eccentricity
    const b = a * Math.sqrt(1 - e * e)

    const x = a * (Math.cos(theta) - e)
    const z = b * Math.sin(theta)

    return {x, z}
}

/**
 * 本函数用于更新水星的自转和公转状态
 * */
export function updateMercury() {
    setAutoRotation()
    setRevolution()
}

/**
 * 本函数用于设置水星的公转(移动mercuryRoot的位置)
 * */
function setRevolution() {
    // 更新公转角参数
    orbitAngle += config.orbit.speed
    if (orbitAngle >= Math.PI * 2) {
        orbitAngle = 0
    }

    const position = calcMercuryPosition(orbitAngle)

    mercuryRoot.position.set(position.x, 0, position.z)
}

/**
 * 本函数用于设置水星的自转(更新mercurySpin的旋转)
 * */
function setAutoRotation() {
    if (mercurySpin.rotation.y >= Math.PI * 2) {
        mercurySpin.rotation.y = 0
    }

    mercurySpin.rotation.y += config.autoRotation.speed
}

/**
 * 本函数用于创建轨道路径
 * @return {THREE.LineLoop} 轨道路径实例
 * */
function createOrbitPath() {
    const points = []
    for (let i = 0; i < config.orbit.path.segment; i++) {
        const theta = (i / config.orbit.path.segment) * Math.PI * 2
        const position = calcMercuryPosition(theta)
        const x = position.x
        const z = position.z
        points.push(new THREE.Vector3(x, 0, z))
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({
        color: config.orbit.path.color,
        linewidth: config.orbit.path.lineWidth,
        transparent: config.orbit.path.transparent,
    })

    if(material.transparent) {
        material.opacity = config.orbit.path.opacity
    }

    const orbit = new THREE.LineLoop(geometry, material)
    orbit.name = config.orbit.name

    return orbit
}
