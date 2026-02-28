import * as THREE from 'three'

/**
 * 本函数用于在对象的祖先链中查找具有指定名称的祖先对象
 * @param {THREE.Object3D} object 当前对象
 * @param {string} name 目标祖先对象的名称
 * @return {THREE.Object3D|null} 找到祖先对象则返回该对象 否则返回null
 * */
export function findAncestorByName(object, name) {
    let current = object
    while (current !== null) {
        if (current.name === name) {
            return current
        }
        current = current.parent
    }
    return null
}
