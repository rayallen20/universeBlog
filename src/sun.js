import * as THREE from 'three'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'

/**
 * 本常量用于定义太阳模型的相关配置
 * @type {Object}
 * */
const config = {
    groupName: 'SunRoot',
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
        size: 4
    },
    autoRotation: {
        // 太阳自转速度
        speed: 0.01
    }
}

export const sunRoot = new THREE.Group()
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
    scaleModel(model)

    sunRoot.clear()
    sunRoot.add(model)
}

/**
 * 本函数用于异步加载GLTF模型
 * @param {string} path 模型路径
 * @return {Promise<THREE.GLTF>} Promise对象 包含加载完成的GLTF模型
 * */
function loadGLTF(path) {
    return new Promise((resolve, reject) => {
        new GLTFLoader().load(
            path,
            (gltf) => {
                resolve(gltf)
            },
            undefined,
            (err) => {
                reject(err)
            }
        )
    })
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
 * 本函数用于缩放模型
 * @param {THREE.Object3D} model 需要缩放的模型
 * @return {void}
 * */
function scaleModel(model) {
    // 获取模型的包围盒
    const box = new THREE.Box3().setFromObject(model)
    // const boxHelper = new THREE.Box3Helper(box, 0xffff00)
    // scene.add(boxHelper)

    // 计算包围盒尺寸
    const size = new THREE.Vector3()
    box.getSize(size)
    // TODO: 后续再创建其他星球时 需要根据太阳的尺寸来设置其他星球的尺寸
    // console.log('Box Size: ', size)

    // 计算包围盒中心
    const center = new THREE.Vector3()
    box.getCenter(center)
    // console.log('Box Center: ', center)

    // 把模型移动到原点
    model.position.sub(center)

    // 缩放模型
    const targetMaxSize = config.scale.size
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = targetMaxSize / maxDim
    model.scale.setScalar(scale)

    // TODO: 后续再创建其他星球时 需要根据太阳的尺寸来设置其他星球的尺寸
    // const box2 = new THREE.Box3().setFromObject(model)
    // const size2 = new THREE.Vector3()
    // box2.getSize(size2)
    // console.log('Resized Box Size: ', size2)
    // const boxHelper2 = new THREE.Box3Helper(box2, 0xff00ff)
    // scene.add(boxHelper2)
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