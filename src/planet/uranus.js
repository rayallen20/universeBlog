import * as THREE from 'three'
import {loadGLTF} from "../lib/loadGLTF";
import {setShadowCastReceive} from "../lib/setShadow";
import {scaleModel} from "../lib/scalModel";
import {centerModelToOrigin} from "../lib/centerModelToOrigin";
import {listMeshes} from "../lib/listMeshes";
import {initOrbitalGroupPosition} from "./helper/position";
import {createOrbitPath} from "./helper/orbitPath";
import {setSpinAutoRotation} from "./helper/autoRotation";
import {setOrbitalGroupPosition} from "./helper/revolution";

export const config = {
    groupName: 'uranusRoot',
    spinName: 'uranusSpin',
    axisName: 'uranusAxis',
    path: '../assets/uranus/scene.gltf',
    scale: {
        size: 24.7,
    },
    autoRotation: {
        speed: 0.13,
    },
    orbit: {
        // 长半轴
        semiMajorAxis: 745.773,
        // 轨道偏心率
        eccentricity: 0.0472,
        // 轨道倾角(轨道面和黄道面形成的夹角) 单位: 角度
        dipAngle:  0.771,
        // 公转速度
        speed: 0.00003,
        path: {
            // 轨道路径对象名称
            name: 'uranusOrbit',
            // 轨道路径分段数
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
        name: '天王星',
        intro: '一段天王星的介绍文字',
    },
}

/**
 * @type {THREE.Group} 天王星轨道面倾角层
 * */
export const uranusAxis = new THREE.Group()
uranusAxis.name = config.axisName

/**
 * @type {THREE.Group} 天王星公转层
 * */
const uranusRoot = new THREE.Group()
uranusRoot.name = config.groupName
uranusRoot.userData.bodyType = config.label.bodyType
uranusRoot.userData.label = config.label.name
uranusRoot.userData.intro = config.label.intro

/**
 * @type {THREE.Group} 天王星自转层
 * */
const uranusSpin = new THREE.Group()
uranusSpin.name = config.spinName

/**
 * @type {THREE.Group|null} 天王星模型
 * */
let uranusModel = null

/**
 * @type {{value: number}} 天王星公转角度 用于计算天王星在轨道上的位置
 * Tips: 这里使用对象包装是为了在函数中传递引用类型 从而实现角度值的更新
 * */
let orbitAngle = {
    value: 0,
}

/**
 * @type {Array<THREE.Mesh>} 可拾取对象数组 用于存储天王星模型中所有可以被鼠标悬停检测的物体
 * */
export let pickableMeshes = []

/**
 * 本函数用于初始化天王星模型组 (模型组包括: 轨道组 -> 公转组 -> 自转组 -> 模型)
 * @return {Promise<void>}
 * @throws {Error} 如果加载金星模型失败则抛出错误
 * */
export async function initUranus() {
    let gltf = null
    try {
        gltf = await loadGLTF(config.path)
    } catch (error) {
        console.log('加载天王星模型失败:', error)
        throw error
    }

    uranusModel = gltf.scene
    setShadowCastReceive(uranusModel)

    scaleModel(uranusModel, config.scale.size)
    centerModelToOrigin(uranusModel)

    pickableMeshes = listMeshes(uranusModel)
    for (const pickableMesh of pickableMeshes) {
        pickableMesh.userData.anchorPointName = config.groupName
    }

    // 按层级挂载对象
    uranusSpin.clear()
    uranusSpin.add(uranusModel)

    uranusRoot.clear()
    uranusRoot.add(uranusSpin)

    uranusAxis.clear()
    uranusAxis.add(uranusRoot)

    // 倾斜轨道层
    uranusAxis.rotation.x = THREE.MathUtils.degToRad(config.orbit.dipAngle)

    // 初始化天王星位置
    initOrbitalGroupPosition(uranusRoot, orbitAngle.value, config.orbit.semiMajorAxis, config.orbit.eccentricity)

    // 创建轨道路径并添加到轨道层中
    const orbitPath = createOrbitPath(config.orbit.semiMajorAxis, config.orbit.eccentricity, config.orbit.path)
    uranusAxis.add(orbitPath)
}

/**
 * 本函数用于更新天王星的自转和公转状态
 * @param {boolean} needRevolution 是否需要更新公转位置
 * */
export function updateUranus(needRevolution) {
    if (needRevolution) {
        setRevolution()
    }

    setSpinAutoRotation(uranusSpin, config.autoRotation.speed)
}

/**
 * 本函数用于设置天王星的公转(移动uranusRoot的位置)
 * */
function setRevolution() {
    orbitAngle.value += config.orbit.speed
    setOrbitalGroupPosition(uranusRoot, orbitAngle, config.orbit.semiMajorAxis, config.orbit.eccentricity)
}