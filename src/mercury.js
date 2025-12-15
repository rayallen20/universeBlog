import * as THREE from 'three'
import {loadGLTF} from "./lib/loadGLTF";
import {scaleModel} from "./lib/scalModel";

const config = {
    groupName: 'MercuryRoot',
    axisName: 'MercuryAxis',
    path: '../assets/mercury/scene.gltf',
    scale: {
        size: 1,
    },
    position: new THREE.Vector3(10, 0, 0),
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
            segment: 256,
            // 轨道路径颜色
            color: 0x888888,
            // 轨道路径线宽
            lineWidth: 1.2,
            // 轨道路径是否透明
            transparent: true,
            // 轨道路径透明度值
            opacity: 0.6,
        }
    },
}

/**
 * @type {THREE.Group} 水星自转轴组 用于控制水星的自转轴倾斜
 * */
export const mercuryAxis = new THREE.Group()
mercuryAxis.name = config.axisName

/**
 * @type {THREE.Group} 水星组 用于控制水星公转
 * */
const mercuryRoot = new THREE.Group()
mercuryRoot.name = config.groupName

mercuryAxis.add(mercuryRoot)

/**
 * @type {THREE.Object3D|null} 水星模型实例 用于控制水星自转
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

    // 将模型添加到水星组中
    mercuryRoot.clear()
    mercuryModel.position.set(0, 0, 0)
    mercuryRoot.add(mercuryModel)

    // 倾斜自转轴
    mercuryAxis.rotation.x = THREE.MathUtils.degToRad(config.orbit.dipAngle)

    // 初始化水星位置
    initMercuryPosition()

    // 创建轨道路径并添加到自转轴组中
    const orbitPath = createOrbitPath()
    mercuryAxis.add(orbitPath)
}

/**
 * 本函数用于设置水星的初始位置
 * */
function initMercuryPosition() {
    const position = calcMercuryPosition()

    mercuryRoot.position.set(position.x, 0, position.z)
}

export function updateMercury() {
    setAutoRotation()
    setRevolution()
}

/**
 * 本函数用于计算水星在轨道上的位置
 * @return {{x: number, z: number}} 水星在轨道上的位置坐标
 * */
function calcMercuryPosition() {
    // 计算水星在轨道上的位置
    const a = config.orbit.semiMajorAxis
    const e = config.orbit.eccentricity
    const b = a * Math.sqrt(1 - e * e)

    const x = a * Math.cos(orbitAngle)
    const z = b * Math.sin(orbitAngle)

    return {
        x: x,
        z: z,
    }
}

/**
 * 本函数用于设置水星的公转
 * */
function setRevolution() {
    // 更新公转角参数
    orbitAngle += config.orbit.speed
    if (orbitAngle >= Math.PI * 2) {
        orbitAngle = 0
    }

    const position = calcMercuryPosition()

    mercuryRoot.position.set(position.x, 0, position.z)
}

/**
 * 本函数用于设置水星的自转
 * */
function setAutoRotation() {
    if (mercuryModel.rotation.y >= Math.PI * 2) {
        mercuryModel.rotation.y = 0
    }

    mercuryModel.rotation.y += config.autoRotation.speed
}

/**
 * 本函数用于创建轨道路径
 * @return {THREE.LineLoop} 轨道路径实例
 * */
function createOrbitPath() {
    const a = config.orbit.semiMajorAxis
    const e = config.orbit.eccentricity
    const b = a * Math.sqrt(1 - e * e)

    const points = []
    for (let i = 0; i < config.orbit.path.segment; i++) {
        const theta = (i / config.orbit.path.segment) * Math.PI * 2
        const x = a * Math.cos(theta)
        const z = b * Math.sin(theta)
        points.push(new THREE.Vector3(x, 0, z))
    }

    // 最后一个点为第1个点 确保闭合一圈
    // points.push(points[0].clone())

    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({
        color: config.orbit.path.color,
        linewidth: config.orbit.path.lineWidth,
        transparent: config.orbit.path.transparent,
    })

    if(material.transparent) {
        material.opacity = config.orbit.path.opacity
    }

    return new THREE.LineLoop(geometry, material)
}
