import * as THREE from 'three'

/**
 * @type {THREE.Vector3} sunPosition 本变量用于存储太阳的世界坐标
 * */
const sunPosition = new THREE.Vector3()

/**
 * @type {THREE.Vector3} hoveredBodyPosition 本变量用于存储鼠标悬停的物体的世界坐标
 * Tips: body这个单词有天体的含义
 * */
const hoveredBodyPosition = new THREE.Vector3()

/**
 * @type {THREE.Vector3} sunToHoveredBodyDirection 本变量用于存储从太阳指向鼠标悬停的物体的方向向量
 * */
const sunToHoveredBodyDirection = new THREE.Vector3()

/**
 * 本函数用于计算鼠标悬停在星球上时要显示的div在屏幕上的偏移量
 * @param {THREE.Object3D} hoveredRoot 鼠标悬停的物体
 * @param {THREE.Group} sunAxis 太阳组
 * @param {THREE.PerspectiveCamera} camera 用于渲染场景的相机
 * @param {HTMLElement} domElement 渲染场景的DOM元素 (通常是canvas)
 * @return {{x: number, y: number}} 返回标签在屏幕上的偏移量 (单位: 像素)
 * */
export function calcOffset(hoveredRoot, sunAxis, camera, domElement) {
    let offset = {
        x: 0,
        y: 0,
    }

    // 若悬停的物体为太阳 则固定在左侧即可
    if (hoveredRoot.userData.bodyType === 'sun') {
        offset.x = -80
        offset.y = 0
        return offset
    }

    // 若悬停的物体为行星 则沿太阳到行星的方向偏移
    sunAxis.getWorldPosition(sunPosition)
    hoveredRoot.getWorldPosition(hoveredBodyPosition)

    sunToHoveredBodyDirection.copy(hoveredBodyPosition).sub(sunPosition)

    // 若太阳到行星的方向向量长度过小 则返回一个默认的偏移量
    if (sunToHoveredBodyDirection.lengthSq() < 1e-8) {
        offset.x = 60
        offset.y = 0
        return offset
    }

    const offsetScreen = calcPlantOffset(camera, domElement)

    const offsetPx = 50
    offset.x = offsetScreen.outwardScreenUnitX * offsetPx
    offset.y = offsetScreen.outwardScreenUnitY * offsetPx

    return offset
}

/**
 * 本函数用于计算沿太阳到行星方向的屏幕偏移量
 * @param {THREE.PerspectiveCamera} camera 用于渲染场景的相机
 * @param {HTMLElement} domElement 渲染场景的DOM元素 (通常是canvas)
 * @return {{outwardScreenUnitX: number, outwardScreenUnitY: number}} 返回屏幕空间中沿太阳到行星方向的单位向量
 * */
function calcPlantOffset(camera, domElement) {
    const rect = domElement.getBoundingClientRect()

    // 计算沿太阳到行星方向的屏幕偏移量
    // step1. 取鼠标悬停的天体的位置
    sunToHoveredBodyDirection.normalize()
    const hoveredBodyWorldPosition = hoveredBodyPosition.clone()

    // step2. 在该位置上加上一个沿太阳到行星方向的偏移量
    // Tips: 可以理解为是从行星位置出发 沿太阳到行星的方向再前进stepInWorldUnits个单位
    // Tips: 由于太阳到行星的方向一定是"向外"的 所以我命名时使用了outward这个词
    const stepInWorldUnits = 0.2
    const outwardStepWorldPosition = hoveredBodyPosition.clone().add(
        sunToHoveredBodyDirection.clone().multiplyScalar(stepInWorldUnits)
    )

    // step3. 将NDC坐标转化为屏幕坐标
    // Tips: 虽然project()方法会原地修改向量 但是这里为了表示已经从世界坐标转化为NDC坐标 所以新建了变量
    const hoveredBodyNdcPosition = hoveredBodyWorldPosition.project(camera)
    const outwardStepNdcPosition = outwardStepWorldPosition.project(camera)

    // 注意这里是相对于rect的左上角 所以不需要加上rect.left和rect.top
    const hoveredBodyScreenX = (hoveredBodyNdcPosition.x * 0.5 + 0.5) * rect.width
    const hoveredBodyScreenY = (-hoveredBodyNdcPosition.y * 0.5 + 0.5) * rect.height

    const outwardStepScreenX = (outwardStepNdcPosition.x * 0.5 + 0.5) * rect.width
    const outwardStepScreenY = (-outwardStepNdcPosition.y * 0.5 + 0.5) * rect.height

    // step4. 计算屏幕空间中2个向量的差值 即为偏移量
    const outwardScreenDeltaX = outwardStepScreenX - hoveredBodyScreenX
    const outwardScreenDeltaY = outwardStepScreenY - hoveredBodyScreenY

    // step5. 将偏移量归一化
    let outwardScreenLength = Math.hypot(outwardScreenDeltaX, outwardScreenDeltaY)
    // Tips: 这里2个向量的差值是有可能为0的 (比如stepInWorldUnits设置的过小导致的位移过少) 所以给一个边界保护的值
    if (outwardScreenLength === 0) {
        outwardScreenLength = 1
    }

    // step6. 计算最终偏移量
    const outwardScreenUnitX = outwardScreenDeltaX / outwardScreenLength
    const outwardScreenUnitY = outwardScreenDeltaY / outwardScreenLength

    return {
        outwardScreenUnitX,
        outwardScreenUnitY
    }
}