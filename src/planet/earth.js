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
    groupName: 'earthRoot',
    spinName: 'earthSpin',
    axisName: 'earthAxis',
    path: '../assets/earth/scene.gltf',
    scale: {
        size: 2.6,
    },
    autoRotation: {
        speed: 0.08,
    },
    orbit: {
        // 长半轴
        semiMajorAxis: 38.86,
        // 轨道偏心率
        eccentricity: 0.0167,
        // 轨道倾角(轨道面和黄道面形成的夹角) 单位: 角度
        dipAngle: 0,
        // 公转速度
        speed: 0.0024,
        path: {
            // 轨道路径对象名称
            name: 'earthOrbit',
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
        name: '地球',
        intro: '一段地球的介绍文字',
    },
}

/**
 * @type {THREE.Group} 地球轨道面倾角层
 * */
export const earthAxis = new THREE.Group()
earthAxis.name = config.axisName

/**
 * @type {THREE.Group} 地球公转层
 * */
const earthRoot = new THREE.Group()
earthRoot.name = config.groupName
earthRoot.userData.bodyType = config.label.bodyType
earthRoot.userData.label = config.label.name
earthRoot.userData.intro = config.label.intro

/**
 * @type {THREE.Group} 地球自转层
 * */
const earthSpin = new THREE.Group()
earthSpin.name = config.spinName

/**
 * @type {THREE.Group|null} 地球模型
 * */
let earthModel = null

/**
 * @type {{value: number}} 地球公转角度 用于计算地球在轨道上的位置
 * */
let orbitAngle = {
    value: 0,
}

/**
 * @type {Array<THREE.Mesh>} 可拾取对象数组 用于存储地球模型中所有可以被鼠标悬停检测的物体
 * */
export let pickableMeshes = []

/**
 * 本函数用于初始化地球模型组 (模型组包括: 轨道组 -> 公转组 -> 自转组 -> 模型本体)
 * @return {Promise<void>}
 * @throws {Error} 如果加载地球模型失败则抛出错误
 * */
export async function initEarth() {
    let gltf = null
    try {
        gltf = await loadGLTF(config.path)
    } catch (error) {
        throw new Error('加载地球模型失败: ' + error)
    }

    earthModel = gltf.scene
    setShadowCastReceive(earthModel)

    scaleModel(earthModel, config.scale.size)
    centerModelToOrigin(earthModel)

    pickableMeshes = listMeshes(earthModel)
    for (const pickableMesh of pickableMeshes) {
        pickableMesh.userData.anchorPointName = config.groupName
    }

    // 按层级挂载对象
    earthSpin.clear()
    earthSpin.add(earthModel)

    earthRoot.clear()
    earthRoot.add(earthSpin)

    earthAxis.clear()
    earthAxis.add(earthRoot)

    // 倾斜轨道层
    earthAxis.rotation.x = THREE.MathUtils.degToRad(config.orbit.dipAngle)

    // 初始化地球位置
    initOrbitalGroupPosition(earthRoot, orbitAngle.value, config.orbit.semiMajorAxis, config.orbit.eccentricity)

    // 创建轨道路径并添加到轨道层中
    const orbitPath = createOrbitPath(config.orbit.semiMajorAxis, config.orbit.eccentricity, config.orbit.path)
    earthAxis.add(orbitPath)

    // 用于确认自转轴方向的辅助线
    // const axisHelper = new THREE.AxesHelper(10)
    // earthAxis.add(axisHelper)
}

/**
 * 本函数用于更新地球的自转和公转状态
 * @param {boolean} needRevolution 是否需要更新公转位置
 * */
export function updateEarth(needRevolution) {
    if (needRevolution) {
        setRevolution()
    }

    setSpinAutoRotation(earthSpin, config.autoRotation.speed)
}

/**
 * 本函数用于设置地球的公转(移动earthRoot的位置)
 * */
function setRevolution() {
    orbitAngle.value += config.orbit.speed
    setOrbitalGroupPosition(earthRoot, orbitAngle, config.orbit.semiMajorAxis, config.orbit.eccentricity)
}