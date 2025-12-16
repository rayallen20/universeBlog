import * as THREE from 'three'

/**
 * 本函数用于缩放模型
 * @param {THREE.Object3D} model 需要缩放的模型
 * @param {number} scaleSize 目标尺寸 超过1为放大 小于1为缩小
 * @return {void}
 * */
export function scaleModel(model, scaleSize) {
    // 获取模型的包围盒并计算包围盒尺寸
    // 这里是为了调试查看模型的实际尺寸
    const box = new THREE.Box3().setFromObject(model)
    const size = new THREE.Vector3()
    box.getSize(size)
    console.log('Box Size: ', size)

    // 按最大边缩放模型
    const maxDim = Math.max(size.x, size.y, size.z) || 1
    const scale = scaleSize / maxDim
    // model.scale.setScalar(scale)
    model.scale.setScalar(scale)

    // 获取缩放后的包围盒并计算包围盒尺寸
    // 这里是为了调试查看模型缩放后的实际尺寸
    const box2 = new THREE.Box3().setFromObject(model)
    const size2 = new THREE.Vector3()
    box2.getSize(size2)
    console.log('Resized Box Size: ', size2)
}