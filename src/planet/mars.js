import * as THREE from 'three'
import {loadGLTF} from "../lib/loadGLTF";
import {setShadowCastReceive} from "../lib/setShadow";
import {scaleModel} from "../lib/scalModel";
import {centerModelToOrigin} from "../lib/centerModelToOrigin";
import {listMeshes} from "../lib/listMeshes";
import {initOrbitalGroupPosition} from "./helper/position";
import {createOrbitPath} from "./helper/orbitPath";
import {setOrbitalGroupPosition} from "./helper/revolution";
import {setSpinAutoRotation} from "./helper/autoRotation";

export const config = {
    groupName: 'marsRoot',
    spinName: 'marsSpin',
    axisName: 'marsAxis',
    path: '../assets/mars/scene.gltf',
    scale: {
        size: 1.4,
    },
    autoRotation: {
        speed: 0.12,
    },
    orbit: {
        // 长半轴
        semiMajorAxis: 59.21,
        // 轨道偏心率
        eccentricity: 0.0934,
        // 轨道倾角(轨道面和黄道面形成的夹角) 单位: 角度
        dipAngle: 1.85,
        // 公转速度
        speed: 0.0013,
        path: {
            // 轨道路径对象名称
            name: 'marsOrbit',
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
        name: '火星',
        intro: '一段火星的介绍文字',
    },
}

/**
 * @type {THREE.Group} 火星轨道面倾角层
 * */
export const marsAxis = new THREE.Group()
marsAxis.name = config.axisName

/**
 * @type {THREE.Group} 火星公转层
 * */
const marsRoot = new THREE.Group()
marsRoot.name = config.groupName
marsRoot.userData.bodyType = config.label.bodyType
marsRoot.userData.label = config.label.name
marsRoot.userData.intro = config.label.intro

/**
 * @type {THREE.Group} 火星自转层
 * */
const marsSpin = new THREE.Group()
marsSpin.name = config.spinName

/**
 * @type {THREE.Group|null} 火星模型
 * */
let marsModel = null

/**
 * @type {{value: number}} 火星公转角度 用于计算火星在轨道上的位置
 * */
let orbitAngle = {
    value: 0,
}

/**
 * @type {Array<THREE.Mesh>} 可拾取对象数组 用于存储火星模型中所有可以被鼠标悬停检测的物体
 * */
export let pickableMeshes = []

/**
 * 本函数用于初始化火星模型组 (模型组包括: 轨道组 -> 公转组 -> 自转组 -> 模型本体)
 * @return {Promise<void>}
 * @throws {Error} 如果加载火星模型失败则抛出错误
 * */
export async function initMars() {
    let gltf = null
    try {
        gltf = await loadGLTF(config.path)
    } catch (error) {
        throw new Error('加载火星模型失败: ' + error)
    }

    marsModel = gltf.scene
    setShadowCastReceive(marsModel)

    scaleModel(marsModel, config.scale.size)
    centerModelToOrigin(marsModel)

    pickableMeshes = listMeshes(marsModel)
    for (const pickableMesh of pickableMeshes) {
        pickableMesh.userData.anchorPointName = config.groupName
    }

    // 按层级挂载对象
    marsSpin.clear()
    marsSpin.add(marsModel)

    marsRoot.clear()
    marsRoot.add(marsSpin)

    marsAxis.clear()
    marsAxis.add(marsRoot)

    // 倾斜轨道层
    marsAxis.rotation.x = THREE.MathUtils.degToRad(config.orbit.dipAngle)

    // 初始化火星位置
    initOrbitalGroupPosition(marsRoot, orbitAngle.value, config.orbit.semiMajorAxis, config.orbit.eccentricity)

    // 创建轨道路径并添加到轨道层中
    const orbitPath = createOrbitPath(config.orbit.semiMajorAxis, config.orbit.eccentricity, config.orbit.path)
    marsAxis.add(orbitPath)
}

/**
 * 本函数用于更新火星的自转和公转状态
 * @param {boolean} needRevolution 是否需要更新公转位置
 * */
export function updateMars(needRevolution) {
    if (needRevolution) {
        setRevolution()
    }

    setSpinAutoRotation(marsSpin, config.autoRotation.speed)
}

/**
 * 本函数用于设置火星的公转(移动marsRoot的位置)
 * */
function setRevolution() {
    orbitAngle.value += config.orbit.speed
    setOrbitalGroupPosition(marsRoot, orbitAngle, config.orbit.semiMajorAxis, config.orbit.eccentricity)
}