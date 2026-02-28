import * as THREE from 'three'

/**
 * 本常量用于定义透视相机实例
 * @type {THREE.PerspectiveCamera}
 * Tips: 参数示意见doc/PerspectiveCamera.png
 * */
export const camera = new THREE.PerspectiveCamera(
    // Tips: 注意这里的单位是角度而非弧度
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    // Tips: 远裁剪面的距离一定要远远大于天空球的半径 否则天空球会显示成一个黑色球体
    4000
)

/**
 * 本常量用于定义相机的位置
 * @type {THREE.Vector3}
 * */
const position = new THREE.Vector3(-11, 6, 40)
// 设置相机位置
camera.position.set(position.x, position.y, position.z)

/**
 * 本常量用于定义相机的朝向
 * @type {THREE.Vector3}
 * */
const lookAt = new THREE.Vector3(0, 0, 0)
// 设置相机朝向
camera.lookAt(lookAt)
