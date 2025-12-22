import * as THREE from 'three'
import {loadGLTF} from "./lib/loadGLTF";
import {scaleModel} from "./lib/scalModel";
import {centerModelToOrigin} from "./lib/centerModelToOrigin";

/**
 * 本常量用于定义太阳模型的相关配置
 * @type {Object}
 * */
export const config = {
    // 太阳组名称
    groupName: 'sunRoot',
    // 太阳自转轴名称
    axisName: 'sunAxis',
    // 太阳模型的路径
    path: '../assets/sun/scene.gltf',
    // 太阳模型自发光相关配置
    emissive: {
        // 自发光颜色
        color: 0xffaa00,
        // 自发光强度
        intensity: 3.0,
    },
    scale: {
        // 太阳模型缩放比例
        size: 4,
    },
    autoRotation: {
        // 太阳自转速度
        speed: 0.01,
        // 太阳自转轴倾斜角度 单位: 角度
        dipAngle: 7.25,
    },
    light: {
        // 光源颜色
        color: 0xffaa00,
        // 光源强度
        intensity: 1000,
        // 光源衰减距离
        distance: 5000,
        // 光源衰减系数
        decay: 2,
        // 是否投射阴影
        castShadow: true,
        shadow: {
            // 阴影贴图偏差 设置该值是为了减少阴影失真和闪烁
            bias: -0.00005,
        },
    },
    position: new THREE.Vector3(0, 0, 0),
    label: {
        bodyType: 'sun',
        name: 'Sun',
    },
}

/**
 * @type {THREE.Group} 太阳自转轴组 用于控制太阳的自转轴倾斜
 * */
export const sunAxis = new THREE.Group()
sunAxis.name = config.axisName
sunAxis.userData.bodyType = config.label.bodyType
sunAxis.userData.label = config.label.name

/**
 * @type {THREE.Group} 太阳组 用于包含太阳模型和相关光源
 * */
const sunRoot = new THREE.Group()
sunRoot.name = config.groupName

/**
 * 本函数用于初始化太阳模型 并将其添加到sunRoot组中
 * @return {Promise<void>}
 * @throws {Error} 如果加载太阳模型失败则抛出错误
 * */
export async function initSun() {
    let gltf = null
    try {
        gltf = await loadGLTF(config.path)
    } catch (err) {
        console.error('加载太阳模型失败:', err)
        throw err
    }

    const model = gltf.scene
    setEmissive(model)
    scaleModel(model, config.scale.size)
    centerModelToOrigin(model)

    sunRoot.clear()
    sunRoot.add(model)

    // 创建太阳点光源并添加到sunRoot组中
    const light = createLight()
    sunRoot.add(light)

    // 旋转自转轴以实现倾斜效果
    // 也就是说视觉上看起来的倾斜 是先旋转自转轴 再进行自转的
    sunAxis.rotation.z = THREE.MathUtils.degToRad(config.autoRotation.dipAngle)

    sunAxis.clear()
    sunAxis.add(sunRoot)
    sunAxis.position.set(config.position.x, config.position.y, config.position.z)

    // 用于确认自转轴方向的辅助线
    // const axisHelper = new THREE.AxesHelper(15)
    // sunRoot.add(axisHelper)
}

/**
 * 本函数用于设置给定的模型的自发光效果
 * @param {THREE.Object3D} model 需要设置自发光效果的模型
 * @return {void}
 * */
function setEmissive(model) {
    const sunEmissive = new THREE.Color(config.emissive.color)
    model.traverse((obj) => {
        if (!obj.isMesh) {
            return
        }

        let materials = obj.material
        if (!Array.isArray(materials)) {
            materials = [obj.material]
        }

        for (const material of materials) {
            if (material === null || material === undefined) {
                continue
            }

            // 只对支持emissive属性(自发光属性)的材质进行修改
            if (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial || material.isMeshPhongMaterial || material.isMeshLambertMaterial) {
                material.emissive = sunEmissive
                material.emissiveIntensity = config.emissive.intensity
                material.needsUpdate = true
            }
        }
    })
}

/**
 * 本函数用于创建太阳的点光源
 * @return {THREE.PointLight} 太阳点光源实例
 * */
function createLight() {
    const light = new THREE.PointLight(
        config.light.color,
        config.light.intensity,
        config.light.distance,
        config.light.decay
        )
    light.castShadow = config.light.castShadow
    light.shadow.bias = config.light.shadow.bias

    light.position.set(0, 0, 0)
    return light
}

/**
 * 本函数用于设置太阳自转
 * */
export function setAutoRotation() {
    if (sunRoot.rotation.y >= Math.PI * 2) {
        sunRoot.rotation.y = 0
    }
    sunRoot.rotation.y += config.autoRotation.speed
}
