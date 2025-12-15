import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'

/**
 * 本函数用于异步加载GLTF模型
 * @param {string} path 模型路径
 * @return {Promise<THREE.GLTF>} Promise对象 包含加载完成的GLTF模型
 * */
export function loadGLTF(path) {
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