import * as THREE from 'three'
import { EXRLoader } from 'three/addons/loaders/EXRLoader'

/**
 * 本常量用于定义场景实例
 * @type {THREE.Scene}
 * */
export const scene = new THREE.Scene()

/**
 * 本常量用于定义场景环境贴图的路径
 * @type {string}
 * */
const SCENE_ENVIRONMENT_PATH = '../../assets/environment/NightSky_2K_HDR.exr'

/**
 * 本函数用于返回一个Promise对象 该Promise用于加载EXR格式的环境贴图
 * @return {Promise<THREE.DataTexture|THREE.CompressedTexture>} Promise对象 包含加载完成的EXR贴图
 * */
function loadEXR() {
    return new Promise((resolve, reject) => {
        new EXRLoader()
            .setDataType(THREE.FloatType)
            .load(
                SCENE_ENVIRONMENT_PATH,
                // onLoad回调
                (texture) => {
                    resolve(texture)
                },
                // onProgress回调
                undefined,
                // onError回调
                (err) => {
                    reject(err)
                }
            )
    })
}

/**
 * 本函数用于初始化场景的环境贴图
 * @param {THREE.WebGLRenderer} renderer 渲染器实例
 * @return {Promise<void>}
 * @throws {Error} 如果加载EXR贴图失败则抛出错误
 * */
export async function initSceneEnvironment(renderer) {
    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    // 预编译等距柱状着色器
    pmremGenerator.compileEquirectangularShader()

    let texture
    try {
        texture = await loadEXR()
    } catch (err) {
        console.error('加载EXR环境贴图失败:', err)
        pmremGenerator.dispose()
        throw err
    }

    // 将等距柱状贴图转换为 PMREM环境贴图
    const envMap = pmremGenerator.fromEquirectangular(texture).texture

    // 释放原始纹理和生成器
    texture.dispose()
    pmremGenerator.dispose()

    // 设置为场景的环境贴图
    // Tips: 这里没有设置场景的背景 是因为场景的背景由天空球实现
    // Tips: 否则无法实现场景背景的缩放
    scene.environment = envMap
}