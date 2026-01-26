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
    groupName: 'jupiterRoot',
    spinName: 'jupiterSpin',
    axisName: 'jupiterAxis',
    path: '../assets/jupiter/scene.gltf',
    scale: {
        size: 29.3,
    },
    autoRotation: {
        speed: 0.23,
    },
    orbit: {
        // 长半轴
        semiMajorAxis: 202.227,
        // 轨道偏心率
        eccentricity: 0.0489,
        // 轨道倾角(轨道面和黄道面形成的夹角) 单位: 角度
        dipAngle: 1.304,
        // 公转速度
        speed: 0.0002,
        path: {
            // 轨道路径对象名称
            name: 'jupiterOrbit',
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
        name: '木星',
        intro: '一段木星的介绍文字',
    },
}

/**
 * @type {THREE.Group} 木星轨道面倾角层
 * */
export const jupiterAxis = new THREE.Group()
jupiterAxis.name = config.axisName

/**
 * @type {THREE.Group} 木星公转层
 * */
const jupiterRoot = new THREE.Group()
jupiterRoot.name = config.groupName
jupiterRoot.userData.bodyType = config.label.bodyType
jupiterRoot.userData.label = config.label.name
jupiterRoot.userData.intro = config.label.intro

/**
 * @type {THREE.Group} 木星自转层
 * */
const jupiterSpin = new THREE.Group()
jupiterSpin.name = config.spinName

/**
 * @type {THREE.Group|null} 木星模型
 * */
let jupiterModel = null

/**
 * @type {{value: number}} 木星公转角度 用于计算木星在轨道上的位置
 * Tips: 这里使用对象包装是为了在函数中传递引用类型 从而实现角度值的更新
 * */
let orbitAngle = {
    value: 0,
}

/**
 * @type {Array<THREE.Mesh>} 可拾取对象数组 用于存储木星模型中所有可以被鼠标悬停检测的物体
 * */
export let pickableMeshes = []

/**
 * 本函数用于初始化木星模型组 (模型组包括: 轨道组 -> 公转组 -> 自转组 -> 模型)
 * @return {Promise<void>}
 * @throws {Error} 如果加载金星模型失败则抛出错误
 * */
export async function initJupiter() {
    let gltf = null
    try {
        gltf = await loadGLTF(config.path)
    } catch (error) {
        console.error('加载木星模型失败:', error)
        throw error
    }

    jupiterModel = gltf.scene
    setShadowCastReceive(jupiterModel)

    scaleModel(jupiterModel, config.scale.size)
    centerModelToOrigin(jupiterModel)

    pickableMeshes = listMeshes(jupiterModel)
    for (const pickableMesh of pickableMeshes) {
        pickableMesh.userData.anchorPointName = config.groupName
    }

    // 按层级挂载对象
    jupiterSpin.clear()
    jupiterSpin.add(jupiterModel)

    jupiterRoot.clear()
    jupiterRoot.add(jupiterSpin)

    jupiterAxis.clear()
    jupiterAxis.add(jupiterRoot)

    // 倾斜轨道层
    jupiterAxis.rotation.x = THREE.MathUtils.degToRad(config.orbit.dipAngle)

    // 初始化木星位置
    initOrbitalGroupPosition(jupiterRoot, orbitAngle.value, config.orbit.semiMajorAxis, config.orbit.eccentricity)

    // 创建轨道路径并添加到轨道层中
    const orbitPath = createOrbitPath(config.orbit.semiMajorAxis, config.orbit.eccentricity, config.orbit.path)
    jupiterAxis.add(orbitPath)
}

/**
 * 本函数用于更新木星的自转和公转状态
 * @param {boolean} needRevolution 是否需要更新公转位置
 * */
export function updateJupiter(needRevolution) {
    if (needRevolution) {
        setRevolution()
    }

    setSpinAutoRotation(jupiterSpin, config.autoRotation.speed)
}

/**
 * 本函数用于设置木星的公转(移动jupiterRoot的位置)
 * */
function setRevolution() {
    orbitAngle.value += config.orbit.speed
    setOrbitalGroupPosition(jupiterRoot, orbitAngle, config.orbit.semiMajorAxis, config.orbit.eccentricity)
}