import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls'
import {hidePanel, showPanel} from "../ui/panel";

const state = {
    focused: false,
    targetObject: null,
    t: 0,
    duration: 0.6,
    isAnimating: false,
    // 动画播放的模式
    // focus: 聚焦到某个天体
    // clear: 从聚焦状态回退
    mode: 'focus',
}

/**
 * @type {THREE.PerspectiveCamera} 当前场景使用的相机
 * */
let camera

/**
 * @type {OrbitControls} 当前场景使用的轨道控制器
 * */
let controls

/**
 * @type {THREE.Vector3} 被聚焦物体的位置
 * */
const targetPosition = new THREE.Vector3()

/**
 * @type {THREE.Vector3} 相机起始位置
 * */
const fromCameraPosition = new THREE.Vector3()

/**
 * @type {THREE.Vector3} 相机目标位置
 * */
const toCameraPosition = new THREE.Vector3()

/**
 * @type {THREE.Vector3} 相机向左(x轴负方向)的方向(因为要让球体在屏幕中央偏右的位置)
 * */
const cameraLeftDirection = new THREE.Vector3()

/**
 * @type {THREE.Vector3} 相机向前(z轴负方向)的方向(因为要让球体充满屏幕)
 * */
const cameraForwardDirection = new THREE.Vector3()

/**
 * @type {THREE.Vector3} 控制器target的起始位置
 * */
const fromControlsTarget = new THREE.Vector3()

/**
 * @type {THREE.Vector3} 控制器target的目标位置
 * */
const toControlsTarget = new THREE.Vector3()

/**
 * @tpye {THREE.Vector3} 相机相对于天体位置的偏移量
 * */
const cameraOffset = new THREE.Vector3()

/**
 * @tpye {THREE.Vector3} 目标相对于天体位置的偏移量
 * */
const targetOffset = new THREE.Vector3()

/**
 * @type {THREE.Vector3} 世界坐标系的上方向(y轴正方向)
 * */
const worldUp = new THREE.Vector3(0, 1, 0)

/**
 * @type {THREE.Vector3} 相机的聚焦前的位置(清除聚焦时需要恢复到该位置)
 * */
const homeCameraPosition = new THREE.Vector3(0, 0, 0)

/**
 * @type {THREE.Vector3} 轨道控制器的聚焦前的target位置(清除聚焦时需要恢复到该位置)
 * */
const homeControlsTarget = new THREE.Vector3(0, 0, 0)

/**
 * 本函数用于初始化聚焦功能
 * @param {THREE.PerspectiveCamera} cam 当前场景使用的相机
 * @param {OrbitControls} orbitControls 当前场景使用的轨道控制器
 * */
export function initFocus(cam, orbitControls) {
    camera = cam
    controls = orbitControls
}

/**
 * 本函数用于确认当前是否处于聚焦状态
 * @return {boolean} 当前处于聚焦状态则返回true 否则返回false
 * */
export function isFocused() {
    return state.focused
}

/**
 * 本函数用于设置相机和轨道控制器聚焦到指定物体
 * @param {THREE.Object3D} object 要聚焦的物体
 * */
export function focusOn(object) {
    controls.enabled = false

    state.focused = true
    state.targetObject = object
    state.t = 0
    state.isAnimating = true

    object.getWorldPosition(targetPosition)

    // 记录本次动画开始时的相机位置和控制器target位置
    fromCameraPosition.copy(camera.position)
    fromControlsTarget.copy(controls.target)

    // 记录相机和控制器target的起始位置(取消聚焦时要恢复到该位置)
    homeCameraPosition.copy(camera.position)
    homeControlsTarget.copy(controls.target)

    state.mode = 'focus'

    // 控制相机看向target的方向
    cameraForwardDirection.copy(camera.position).sub(targetPosition).normalize()
    // Tips: cross(a, b)的结果是垂直于a和b的向量
    // Tips: 所以这里用 世界上方向 叉乘 相机前方向
    // Tips: 再反转方向 得到相机左方向
    cameraLeftDirection.copy(worldUp).cross(cameraForwardDirection).multiplyScalar(-1).normalize()

    // 根据被点击的天体的大小计算合适的相机位置
    const box = new THREE.Box3().setFromObject(state.targetObject)
    const sphere = new THREE.Sphere()
    box.getBoundingSphere(sphere)
    const radius = Math.max(sphere.radius, 1e-6)

    const fovRad = THREE.MathUtils.degToRad(camera.fov)
    const fitDist = radius / Math.tan(fovRad * 0.5)

    // Tips: 缩放因子越小 则相机离目标越近 天体在屏幕上显示得越大
    const zoomFactor = 0.75
    const desireDistance = fitDist * zoomFactor

    // 让天体靠右: 把相机的target位置向左移动一些
    // panel在屏幕横向的占比
    const panelRatio = 0.5
    // panel和天体之间的边距占比
    const margin = 0.05
    const desiredNdcX = Math.min(panelRatio + margin, 0.85)

    // 计算水平视角
    const fovX = 2 * Math.atan(Math.tan(fovRad * 0.5) * camera.aspect)
    const targetShift = desireDistance * Math.tan(fovX * 0.5) * desiredNdcX

    cameraOffset.
    copy(cameraForwardDirection).
    multiplyScalar(desireDistance).
    addScaledVector(worldUp, 0)

    targetOffset.
    copy(cameraLeftDirection).
    multiplyScalar(targetShift).
    addScaledVector(worldUp, 0)

    // 计算终点位置
    toCameraPosition.copy(targetPosition).add(cameraOffset)
    toControlsTarget.copy(targetPosition).add(targetOffset)

    // 显示左侧面板
    showPanel(object)
}

/**
 * 本函数用于清除聚焦状态
 * */
export function clearFocus() {
    if (!state.focused) {
        return
    }

    // 从当前位置开始回退
    fromCameraPosition.copy(camera.position)
    fromControlsTarget.copy(controls.target)

    // 目标位置是聚焦前的位置
    toCameraPosition.copy(homeCameraPosition)
    toControlsTarget.copy(homeControlsTarget)

    state.t = 0
    state.isAnimating = true
    state.mode = 'clear'

    hidePanel()
}

/**
 * 本函数用于根据给定的时间计算一个缓动进度值 即: 先慢后快再慢的过渡效果
 * @param {number} t 时间 单位: 秒
 * @return {number} 返回当前的缓动进度值 范围在0~1之间
 * */
function easeInOut(t) {
    if (t < 0.5) {
        return 2 * t * t
    }

    return 1 - Math.pow(-2 * t + 2, 2) / 2
}

/**
 * 本函数用于更新聚焦状态
 * @param {number} dtSeconds 帧间隔时间 单位: 秒
 * */
export function updateFocus(dtSeconds) {
    if (!state.isAnimating) {
        return
    }

    state.t += dtSeconds
    const alpha = Math.min(state.t / state.duration, 1)
    const k = easeInOut(alpha)

    if (state.mode === 'focus') {
        if (state.targetObject === null) {
            state.isAnimating = false
            return
        }

        // 持续跟随目标位置
        state.targetObject.getWorldPosition(targetPosition)

        // 终点跟随目标位置更新
        toCameraPosition.copy(targetPosition).add(cameraOffset)
        toControlsTarget.copy(targetPosition).add(targetOffset)

        state.focused = true
    }

    // clear模式
    // camera.position.lerpVectors(fromCameraPosition, toCameraPosition, k)
    // controls.target.lerpVectors(fromControlsTarget, toControlsTarget, k)
    // controls.update()

    // 更新相机位置和控制器target位置
    // Tips: lerpVectors()方法用于在两个向量之间进行线性插值
    // Tips: 第一个参数是起始向量 第二个参数是目标向量 第三个参数是插值因子(0~1之间)
    // Tips: 当k=0时 结果等于起始向量 当k=1时 结果等于目标向量
    // Tips: 相当于就是在起始向量和目标向量之间根据k值进行插值计算出一个新的向量
    camera.position.lerpVectors(fromCameraPosition, toCameraPosition, k)
    controls.target.lerpVectors(fromControlsTarget, toControlsTarget, k)

    // 更新控制器
    // controls.target.copy(targetPosition)
    controls.update()

    // 动画完成
    if (alpha >= 1) {
        state.t = state.duration
        state.isAnimating = false

        // 动画结束后再清除状态
        if (state.mode === 'clear') {
            state.focused = false
            state.targetObject = null
        }

        controls.enabled = true
    }
}