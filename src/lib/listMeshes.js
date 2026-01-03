import * as THREE from 'three'

/**
 * 本函数用于列出给定的三维模型中的所有网格对象
 * @param {THREE.Group|THREE.Object3D} root 需要列出网格对象的三维模型
 * @return {Array<THREE.Mesh>} 返回包含所有网格对象的数组
 * */
export function listMeshes(root) {
    const meshes = []

    root.traverse(child => {
        if (child.isMesh) {
            meshes.push(child)
        }
    })

    return meshes
}