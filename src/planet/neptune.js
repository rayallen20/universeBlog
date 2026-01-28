import * as THREE from 'three'
import {loadGLTF} from "../lib/loadGLTF";
import {scaleModel} from "../lib/scalModel";
import {centerModelToOrigin} from "../lib/centerModelToOrigin";
import {listMeshes} from "../lib/listMeshes";
import {initOrbitalGroupPosition} from "./helper/position";
import {createOrbitPath} from "./helper/orbitPath";
import {setSpinAutoRotation} from "./helper/autoRotation";
import {setOrbitalGroupPosition} from "./helper/revolution";
import {setShadowCastReceive} from "../lib/setShadow";

export const config = {
    groupName: 'NeptuneRoot',
    axisName: 'NeptuneAxis',
    spinName: 'NeptuneSpin',
    path: '../../assets/neptune/scene.gltf',
    scale: {
        size: 10.2,
    },
    autoRotation: {
        // 自转速度
        speed:0.34,
    },
    orbit: {
        // 长半轴
        semiMajorAxis: 1165.91,
        // 轨道偏心率
        eccentricity: 0.0087,
        // 轨道倾角(轨道面和黄道面形成的夹角) 单位: 角度
        dipAngle: 1.77,
        // 公转速度
        speed: 0.00001,
        path: {
            name: 'NeptuneOrbit',
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
        name: '海王星',
        intro: '一段海王星的介绍文字',
    },
}

/**
 * @type {THREE.Group} 轨道面倾角层
 * */
export const neptuneAxis = new THREE.Group()
neptuneAxis.name = config.axisName

/**
 * @type {THREE.Group} 海王星公转层 用于控制水星的公转
 * */
const neptuneRoot = new THREE.Group()
neptuneRoot.name = config.groupName
neptuneRoot.userData.bodyType = config.label.bodyType
neptuneRoot.userData.label = config.label.name
neptuneRoot.userData.intro = config.label.intro

/**
 * @type {THREE.Group} 海王星自转层 用于控制水星的自转
 * */
const neptuneSpin = new THREE.Group()
neptuneSpin.name = config.spinName

/**
 * @type {THREE.Object3D|null} 海王星模型实例 负责海王星的外观/缩放/居中
 * */
let neptuneModel = null

/**
 * @type {Object} 当前公转角的角度 用于计算海王星公转位置
 * Tips: 这里使用对象包装是为了在函数中传递引用类型 从而实现角度值的更新
 * */
let orbitAngle = {
    value: 0,
}

/**
 * @type {Array<THREE.Mesh>} 可拾取对象数组 用于存储海王星模型中所有可以被鼠标悬停检测的物体
 * */
export let pickableMeshes = []

/**
 * 本函数用于初始化海王星模型组 (模型组包括: 轨道组 -> 公转组 -> 自转组 -> 模型本体)
 * @return {Promise<void>}
 * @throws {Error} 如果加载海王星模型失败则抛出错误
 * */
export async function initNeptune() {
    let gltf = null
    try {
        gltf = await loadGLTF(config.path)
    } catch (err) {
        console.error('加载海王星模型失败:', err)
        throw err
    }

    neptuneModel = gltf.scene
    setShadowCastReceive(neptuneModel)

    scaleModel(neptuneModel, config.scale.size)
    centerModelToOrigin(neptuneModel)

    pickableMeshes = listMeshes(neptuneModel)
    for (const pickableMesh of pickableMeshes) {
        pickableMesh.userData.anchorPointName = config.groupName
    }

    neptuneSpin.clear()
    neptuneSpin.add(neptuneModel)

    neptuneRoot.clear()
    neptuneRoot.add(neptuneSpin)

    neptuneAxis.clear()
    neptuneAxis.add(neptuneRoot)

    // 初始化海王星位置
    initOrbitalGroupPosition(neptuneRoot, config.orbit.semiMajorAxis, config.orbit.eccentricity, orbitAngle.value)

    // 创建轨道路径并添加到轨道层中
    const orbitPath = createOrbitPath(config.orbit.semiMajorAxis, config.orbit.eccentricity, config.orbit.path)
    neptuneAxis.add(orbitPath)

    // 用于确认自转轴方向的辅助线
    // const axisHelper = new THREE.AxesHelper(10)
    // neptuneAxis.add(axisHelper)
}

/**
 * 本函数用于更新海王星的自转和公转状态
 * @param {boolean} needRevolution 是否需要更新公转位置
 * */
export function updateNeptune(needRevolution) {
    if (needRevolution) {
        setRevolution()
    }

    setSpinAutoRotation(neptuneSpin, config.autoRotation.speed)
}

/**
 * 本函数用于设置海王星的公转(移动neptuneRoot的位置)
 * @return {void}
 * */
function setRevolution() {
    orbitAngle.value += config.orbit.speed
    setOrbitalGroupPosition(neptuneRoot, orbitAngle, config.orbit.semiMajorAxis, config.orbit.eccentricity)
}