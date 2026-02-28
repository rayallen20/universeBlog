import * as THREE from 'three'

/**
 * @type {THREE.Vector3} 本变量用于表示物体的世界坐标
 * Tips: 之所以在函数外创建该变量 是为了避免每次调用函数时都创建一个新的Vector3对象 减少GC压力
 * */
const worldPosition = new THREE.Vector3()

/**
 * 本函数用于将三维场景中的物体坐标转换为屏幕坐标
 * @param {THREE.Object3D} object 需要转换坐标的三维物体
 * @param {THREE.PerspectiveCamera} camera 用于渲染场景的相机
 * @param {HTMLElement} domElement 渲染场景的DOM元素 (通常是canvas)
 * @return {{screenX: number, screenY: number, ndc: THREE.Vector3}} 返回物体在屏幕上的坐标 (单位: 像素)
 * Tips: 返回NDC坐标是用于判断物体是否在镜头后方
 * */
export function worldToScreen(object, camera, domElement) {
    // 获取物体的世界坐标
    object.getWorldPosition(worldPosition)

    // 将世界坐标转化为NDC坐标
    worldPosition.project(camera)

    // 将NDC坐标转化为屏幕坐标
    const rect = domElement.getBoundingClientRect()
    const screenX = (worldPosition.x * 0.5 + 0.5) * rect.width + rect.left
    const screenY = (-worldPosition.y * 0.5 + 0.5) * rect.height + rect.top

    return {
        screenX,
        screenY,
        ndc: worldPosition.clone(),
    }
}