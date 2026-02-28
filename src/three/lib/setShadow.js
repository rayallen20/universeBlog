import * as THREE from 'three';

/**
 * 本函数用于设置模型及其子对象的投射阴影和接收阴影属性
 * @param {THREE.Object3D} root 需要设置阴影属性的模型根对象
 * @param {boolean} castShadow 是否启用投射阴影，默认为true
 * @param {boolean} receiveShadow 是否启用接收阴影，默认为true
 * */
export function setShadowCastReceive(root, castShadow = true, receiveShadow = true) {
    root.traverse((obj) => {
        if (!obj.isMesh) {
            return
        }

        obj.castShadow = castShadow
        obj.receiveShadow = receiveShadow
    })
}