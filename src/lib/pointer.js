import * as THREE from 'three'

/**
 * 本函数用于根据给定的客户端坐标(clientX, clientY)和DOM元素,计算对应的归一化设备(NDC)坐标
 * @param {number} clientX 鼠标的客户端X坐标 (相对于视口左上角)
 * @param {number} clientY 鼠标的客户端Y坐标 (相对于视口左上角)
 * @param {THREE.Vector2} out 输出的NDC坐标对象
 * @param {HTMLElement} domElement 渲染场景的DOM元素 (通常是canvas)
 * */
export function getNDCCoordinate(clientX, clientY, domElement, out) {
    const rect = domElement.getBoundingClientRect()

    const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1
    const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1
    out.set(ndcX, ndcY)
}

/**
 * 本函数用于将NDC坐标设置到视口外部 (用于表示鼠标离开视口)
 * @param {THREE.Vector2} out 需要设置的NDC坐标对象
 * */
export function setLeaveCoordinate(out) {
    out.set(9999, 9999)
}