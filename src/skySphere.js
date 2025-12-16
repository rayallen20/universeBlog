import * as THREE from 'three'

/**
 * 本常量用于定义天空球的相关配置
 * @type {Object}
 * */
const config = {
    // 天空球的半径
    radius: 1000,
    // 天空球的宽度分段数
    widthSegments: 64,
    // 天空球的高度分段数
    heightSegments: 64,
    // 天空球的贴图路径
    // 使用JPG纹理作为场景的**可缩放**的背景
    // TODO: 也可以使用exr格式的背景纹理 这样就可以少加载一次贴图了 因为场景背景也使用的是EXR格式的贴图
    texturePath: '../assets/environment/NightSkyHDRI008_TONEMAPPED.jpg',
    // 天空球网格对象的名称
    name: 'SkySphere',
    autoRotation: {
        speed: 0.0005,
    },
}

/**
 * 本常量用于定义天空球几何体
 * @type {THREE.SphereGeometry}
 * */
const geometry = new THREE.SphereGeometry(
    config.radius,
    config.widthSegments,
    config.heightSegments,
)

/**
 * 本常量用于定义天空球材质 该材质是占位用的 后续异步加载贴图后会替换掉
 * @type {THREE.MeshBasicMaterial}
 * */
const placeholderMaterial = new THREE.MeshBasicMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    // 占位颜色 避免视觉效果看起来很突兀
    color: 0x000000,
})

/**
 * 本常量用于定义天空球网格对象
 * @type {THREE.Mesh}
 * */
export const skySphere = new THREE.Mesh(geometry, placeholderMaterial)
skySphere.name = config.name

/**
 * 本函数用于返回一个Promise对象 该Promise用于加载天空球的贴图
 * @return {Promise<THREE.Texture>} Promise对象 包含加载完成的贴图
 * */
function loadTexture() {
    return new Promise((resolve, reject) => {
        new THREE.TextureLoader()
            .load(
                config.texturePath,
                (texture) => {
                    resolve(texture)
                },
                undefined,
                (err) => {
                    reject(err)
                }
            )
    })
}

/**
 * 本函数用于加载天空球的贴图并应用到天空球网格对象上
 * @throws {Error} 加载贴图失败时抛出错误
 * */
export async function initSkySphereTexture() {
    let texture
    try {
        texture = await loadTexture()
    } catch (error) {
        console.error('加载天空球贴图失败:', error)
        throw error
    }

    texture.colorSpace = THREE.SRGBColorSpace
    // 定义纹理贴图在水平方向上的包裹方式 即UV中的U
    texture.wrapS = THREE.ClampToEdgeWrapping
    // 定义纹理贴图在垂直方向上的包裹方式 即UV中的V
    texture.wrapT = THREE.ClampToEdgeWrapping

    skySphere.material = new THREE.MeshBasicMaterial({
        map: texture,
        // 由于是从里往外看 所以需要渲染背面
        side: THREE.BackSide,
        // 不进行深度写入 避免遮挡其他物体
        depthWrite: false,
    })

    skySphere.material.needsUpdate = true
}

/**
 * 本函数用于设置天空球的自转
 * */
export function setAutoRotation() {
    if (skySphere.rotation.y >= Math.PI * 2) {
        skySphere.rotation.y = 0
    }

    skySphere.rotation.y += config.autoRotation.speed
}