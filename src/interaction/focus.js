import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls'
import {hidePanel, showPanel} from "../ui/panel";

const state = {
    // 标志当前是否处于聚焦状态的标量
    focused: false,
    // 当前被聚焦的物体
    targetObject: null,
    // 动画已运行时间
    elapsedTime: 0,
    // 动画总时长
    duration: 0.6,
    // 标志当前是否正在播放动画的标量
    isAnimating: false,
    // 动画播放的模式
    // focus: 聚焦到某个天体
    // clear: 从聚焦状态回退
    mode: '',
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
 * @type {THREE.Vector3} 被聚焦物体的世界坐标
 * */
const targetPosition = new THREE.Vector3()

/**
 * @type {THREE.Vector3} 相机动画起点位置的世界坐标
 * Tips: 这个起点既用于从不聚焦到聚焦的起点,也用于从聚焦到不聚焦的起点
 * */
const fromCameraPosition = new THREE.Vector3()

/**
 * @type {THREE.Vector3} 相机动画终点位置的世界坐标
 * Tips: 和起点相同,这个终点既用于从不聚焦到聚焦的终点,也用于从聚焦到不聚焦的终点
 * */
const toCameraPosition = new THREE.Vector3()

/**
 * @type {THREE.Vector3} 相机从被聚焦的天体向左移动的方向(因为要让球体在屏幕中央偏右的位置)
 * */
const cameraLeftDirection = new THREE.Vector3()

/**
 * @type {THREE.Vector3} 相机向前(z轴负方向)的方向(因为要让球体充满屏幕)
 * 也可以理解为是从被聚焦的天体指向相机的方向
 * */
const cameraForwardDirection = new THREE.Vector3()

/**
 * @type {THREE.Vector3} 轨道中心的起始位置
 * */
const fromControlsTarget = new THREE.Vector3()

/**
 * @type {THREE.Vector3} 轨道中心的目标位置
 * */
const toControlsTarget = new THREE.Vector3()

/**
 * @tpye {THREE.Vector3} 相机相对于天体位置的偏移量
 * Tips: 可以理解为cameraOffset控制了"相机从哪里看"
 * */
const cameraOffset = new THREE.Vector3()

/**
 * @tpye {THREE.Vector3} 轨道中心相对于被聚焦的天体中心的偏移量
 * Tips: 这里由于交互是聚焦时让被聚焦天体出现在屏幕中央偏右的位置,所以需要让轨道中心位置向左移动一些
 * Tips: 从原理上讲,即使设置了camera.lookAt(),相机也会围绕controls.target位置旋转
 * Tips: 所以可以理解为targetOffset控制了"相机看向哪里"
 * */
const targetOffset = new THREE.Vector3()

/**
 * @type {THREE.Vector3} 世界坐标系的上方向(y轴正方向)
 * */
const worldUp = new THREE.Vector3(0, 1, 0)

/**
 * @type {THREE.Vector3} 相机在聚焦前的位置(清除聚焦时需要将相机从当前位置恢复到该位置)
 * */
const homeCameraPosition = new THREE.Vector3(0, 0, 0)

/**
 * @type {THREE.Vector3} 轨道中心在聚焦前的target位置(清除聚焦时需要将轨道中心从当前位置恢复到该位置)
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
    console.log(object)
    controls.enabled = false

    state.focused = true
    state.targetObject = object
    state.elapsedTime = 0
    state.isAnimating = true

    object.getWorldPosition(targetPosition)

    // 记录本次动画开始时的相机位置和轨道中心位置
    fromCameraPosition.copy(camera.position)
    fromControlsTarget.copy(controls.target)

    // Tips: 这里的判断是因为若不判断,
    // Tips: 则在聚焦模式下,若再次点击天体,则会更新相机和轨道中心的起始位置为聚焦时的位置
    // Tips: 就无法回到聚焦前的位置了
    if (state.mode !== 'focus') {
        // 记录相机和轨道中心的起始位置(取消聚焦时要恢复到该位置)
        homeCameraPosition.copy(camera.position)
        homeControlsTarget.copy(controls.target)
        state.mode = 'focus'
    }

    // 计算从被聚焦物体看向相机的方向
    // 被聚焦物体看向相机的方向 = 相机位置 - 被聚焦物体位置
    // 最后的单位化是为了表述方向 因为后续有单独的一个阈值控制相机在该方向上移动的距离
    cameraForwardDirection.copy(camera.position).sub(targetPosition).normalize()
    // Tips: cross(a, b)的结果是垂直于a和b的向量
    // Tips: 所以这里用 世界上方向 叉乘 相机前方向
    // Tips: 再反转方向 得到相机左方向
    cameraLeftDirection.copy(worldUp).cross(cameraForwardDirection).multiplyScalar(-1).normalize()

    // 根据被聚焦的天体的大小计算合适的相机位置
    // step1. 计算被聚焦天体的半径
    const box = new THREE.Box3().setFromObject(state.targetObject)
    const sphere = new THREE.Sphere()
    box.getBoundingSphere(sphere)
    const radius = Math.max(sphere.radius, 1e-6)

    // step2. 计算相机到被聚焦天体的距离
    // Tips: 在透视相机中,若想让一个半径为radius的球体正好充满屏幕,相机到目标中心的距离为:
    // Tips: distance = radius / tan(fov/2)
    // Tips: 其中fov为垂直方向的视场角,单位为弧度(所以需要先把相机的fov从角度转换为弧度)
    const fovRad = THREE.MathUtils.degToRad(camera.fov)
    const fitDistance = radius / Math.tan(fovRad * 0.5)

    // Tips: 缩放因子越小 则相机离目标越近 天体在屏幕上显示得越大
    const zoomFactor = 0.75
    const desireDistance = fitDistance * zoomFactor

    // 让天体靠右: 把轨道中心位置向左移动一些
    // panel在屏幕横向的占比
    const panelRatio = 0.5
    // panel和天体之间的边距占比
    const margin = 0.05
    // 计算横向占比
    const horizontalShiftRatio = Math.min(panelRatio + margin, 0.85)

    // 计算水平视角
    // Tips: tan(fov/2) * aspect 相当于就是: 宽/相机到目标的距离
    // Tips: 这个值表示的是 tan(水平视场角/2)
    // Tips: 然后再通过atan()函数反求出(水平视场角/2) arctan(A) = tan(α) 其中A是数值 α为角度
    // Tips: 最后乘以2得到完整的水平视场角
    const fovX = 2 * Math.atan(Math.tan(fovRad * 0.5) * camera.aspect)
    //
    // tan(fovX/2): 水平方向的长度 / 相机到目标的距离
    // desireDistance: 相机到目标的距离
    // horizontalShiftRatio: panel+外边距的比例
    // targetShift: 轨道中心需要移动的距离
    const targetShift = desireDistance * Math.tan(fovX * 0.5) * horizontalShiftRatio

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

    state.elapsedTime = 0
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
 * 本函数用于更新聚焦状态 从起点位置到终点位置
 * @param {number} dtSeconds 帧间隔时间 单位: 秒
 * */
export function updateFocus(dtSeconds) {
    if (!state.isAnimating) {
        return
    }

    state.elapsedTime += dtSeconds
    const progress = Math.min(state.elapsedTime / state.duration, 1)
    const k = easeInOut(progress)

    if (state.mode === 'focus') {
        if (state.targetObject === null) {
            state.isAnimating = false
            return
        }

        // Tips: 这里我是出于扩展性的考虑,直接实现成目标位置会变化的版本了
        // Tips: 所以每一帧都重新获取目标位置并更新终点位置
        // step1. 获取目标位置
        state.targetObject.getWorldPosition(targetPosition)

        // step2. 根据获取到的目标位置重新计算终点位置
        // Tips: 相机终点位置 = 被聚焦物体的世界坐标 + 相机偏移量
        toCameraPosition.copy(targetPosition).add(cameraOffset)
        // Tips: 轨道中心终点位置 = 被聚焦物体的世界坐标 + 轨道中心偏移量
        toControlsTarget.copy(targetPosition).add(targetOffset)

        state.focused = true
    }

    // 更新相机位置和轨道中心位置
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
    if (progress >= 1) {
        state.elapsedTime = state.duration
        state.isAnimating = false
        controls.enabled = true

        // 动画结束后再清除状态
        if (state.mode === 'clear') {
            state.focused = false
            state.targetObject = null
        }
    }
}