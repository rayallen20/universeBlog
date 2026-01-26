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
    groupName: 'saturnRoot',
    spinName: 'saturnSpin',
    axisName: 'saturnAxis',
    path: '../assets/saturn/scene.gltf',
    scale: {
        size: 24.7,
    },
    autoRotation: {
        speed: 0.07,
    },
    orbit: {
        // 长半轴
        semiMajorAxis: 370.611,
        // 轨道偏心率
        eccentricity: 0.0542,
        // 轨道倾角(轨道面和黄道面形成的夹角) 单位: 角度
        dipAngle: 2.484,
        // 公转速度
        speed: 0.00008,
        path: {
            // 轨道路径对象名称
            name: 'saturnOrbit',
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
        name: '土星',
        intro: '一段土星的介绍文字',
    },
}

/**
 * @type {THREE.Group} 土星轨道面倾角层
 * */
export const saturnAxis = new THREE.Group()
saturnAxis.name = config.axisName

/**
 * @type {THREE.Group} 土星公转层
 * */
const saturnRoot = new THREE.Group()
saturnRoot.name = config.groupName
saturnRoot.userData.bodyType = config.label.bodyType
saturnRoot.userData.label = config.label.name
saturnRoot.userData.intro = config.label.intro

/**
 * @type {THREE.Group} 土星自转层
 * */
const saturnSpin = new THREE.Group()
saturnSpin.name = config.spinName

/**
 * @type {THREE.Group|null} 土星模型
 * */
let saturnModel = null

/**
 * @type {{value: number}} 土星公转角度 用于计算土星在轨道上的位置
 * Tips: 这里使用对象包装是为了在函数中传递引用类型 从而实现角度值的更新
 * */
let orbitAngle = {
    value: 0,
}

/**
 * @type {Array<THREE.Mesh>} 可拾取对象数组 用于存储土星模型中所有可以被鼠标悬停检测的物体
 * */
export let pickableMeshes = []

/**
 * 本函数用于初始化土星模型组 (模型组包括: 轨道组 -> 公转组 -> 自转组 -> 模型)
 * @return {Promise<void>}
 * @throws {Error} 如果加载金星模型失败则抛出错误
 * */
export async function initSaturn() {
    let gltf = null
    try {
        gltf = await loadGLTF(config.path)
    } catch (error) {
        console.log('加载土星模型失败:', error)
        throw error
    }

    saturnModel = gltf.scene
    setShadowCastReceive(saturnModel)

    scaleModel(saturnModel, config.scale.size)
    centerModelToOrigin(saturnModel)

    pickableMeshes = listMeshes(saturnModel)
    for (const pickableMesh of pickableMeshes) {
        pickableMesh.userData.anchorPointName = config.groupName
    }

    // 按层级挂载对象
    saturnSpin.clear()
    saturnSpin.add(saturnModel)

    saturnRoot.clear()
    saturnRoot.add(saturnSpin)

    saturnAxis.clear()
    saturnAxis.add(saturnRoot)

    // 倾斜轨道层
    saturnAxis.rotation.x = THREE.MathUtils.degToRad(config.orbit.dipAngle)

    // 初始化土星位置
    initOrbitalGroupPosition(saturnRoot, orbitAngle.value, config.orbit.semiMajorAxis, config.orbit.eccentricity)

    // 创建轨道路径并添加到轨道层中
    const orbitPath = createOrbitPath(config.orbit.semiMajorAxis, config.orbit.eccentricity, config.orbit.path)
    saturnAxis.add(orbitPath)
}

/**
 * 本函数用于更新土星的自转和公转状态
 * @param {boolean} needRevolution 是否需要更新公转位置
 * */
export function updateSaturn(needRevolution) {
    if (needRevolution) {
        setRevolution()
    }

    setSpinAutoRotation(saturnSpin, config.autoRotation.speed)
}

/**
 * 本函数用于设置土星的公转(移动saturnRoot的位置)
 * */
function setRevolution() {
    orbitAngle.value += config.orbit.speed
    setOrbitalGroupPosition(saturnRoot, orbitAngle, config.orbit.semiMajorAxis, config.orbit.eccentricity)
}