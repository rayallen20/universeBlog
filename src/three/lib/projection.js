import * as THREE from 'three'
import {scene} from "../base/scene";

/**
 * @type {THREE.Box3} 本变量用于表示一个包围盒
 * */
const box = new THREE.Box3()

/**
 * @type {THREE.Sphere} 本变量用于表示一个包围球
 * */
const sphere = new THREE.Sphere()

/**
 * @type {THREE.Matrix4} 本变量用于表示物体的世界变换矩阵的逆矩阵
 * */
const inverseMatrixWorld = new THREE.Matrix4()

/**
 * @type {THREE.Vector3} 本变量用于表示包围球中心点的世界坐标
 * */
const centerWorld = new THREE.Vector3()

/**
 * @type {THREE.Vector3} 本变量用于表示包围球中心点的NDC坐标
 * */
const centerNDC = new THREE.Vector3()

/**
 * @type {THREE.Vector3} 本变量用于表示在世界坐标系下,从包围球的球心出发,沿着相机右方向延伸1个半径长度后,所在的点的世界坐标
 * */
const cameraRightSampleWorld = new THREE.Vector3()

/**
 * @type {THREE.Vector3} 本变量用于表示表示在世界坐标系下,从包围球的球心出发,沿着相机右方向延伸1个半径长度后,所在的点的NDC坐标
 * */
const cameraRightSampleNDC = new THREE.Vector3()

/**
 * @type {THREE.Vector3} 本变量用于表示在世界坐标系下,相机右方向的单位向量
 * */
const cameraRightWorld = new THREE.Vector3()

/**
 * @type {THREE.Vector3} 本变量用于表示物体的世界在各个轴上的缩放值
 * */
const worldScale = new THREE.Vector3()

/**
 * 本函数用于计算给定的三维物体在屏幕上的投影信息
 * @param {THREE.Object3D} object 需要计算投影信息的三维物体
 * @param {THREE.PerspectiveCamera} camera 用于渲染场景的相机
 * @param {HTMLElement} domElement 渲染场景的DOM元素 (通常是canvas)
 * @return {{centerPx: {x: number, y: number}, radiusPx: number, ndcZ: number}} 返回物体在屏幕上的投影信息
 * */
export function calcProjection(object, camera, domElement) {
    const projection = {
        centerPx: {
            x: 0,
            y: 0,
        },
        radiusPx: 0,
        ndcZ: 0,
    }

    if (object === null || object === undefined) {
        return projection
    }

    object.updateWorldMatrix(true, false)
    camera.updateWorldMatrix(true, false)

    const { centerLocal, radiusLocal } = getBoundingSphere(object)

    // 计算包围球中心点的世界坐标
    centerWorld.copy(centerLocal).applyMatrix4(object.matrixWorld)
    // 将包围球中心点的世界坐标转换为NDC坐标
    centerNDC.copy(centerWorld).project(camera)
    // 将包围球中心点的NDC坐标转换为屏幕坐标
    const rect = domElement.getBoundingClientRect()
    const centerX = (centerNDC.x * 0.5 + 0.5) * rect.width + rect.left
    const centerY = (-centerNDC.y * 0.5 + 0.5) * rect.height + rect.top

    // 计算包围球在世界坐标系下的半径
    object.getWorldScale(worldScale)
    const maxScale = Math.max(worldScale.x, worldScale.y, worldScale.z) || 1
    const radiusWorld = radiusLocal * maxScale

    // 计算相机右方向的单位向量
    cameraRightWorld.setFromMatrixColumn(camera.matrixWorld, 0).normalize()

    // 计算在世界坐标系下,从包围球的球心出发,沿着相机右方向延伸1个半径长度后,所在的点的世界坐标
    // 简称该点为右侧采样点
    cameraRightSampleWorld.copy(centerWorld).addScaledVector(cameraRightWorld, radiusWorld)
    // 将右侧采样点的世界坐标转换为NDC坐标
    cameraRightSampleNDC.copy(cameraRightSampleWorld).project(camera)
    // 计算右侧采样点的屏幕坐标
    const edgeX = (cameraRightSampleNDC.x * 0.5 + 0.5) * rect.width + rect.left
    const edgeY = (-cameraRightSampleNDC.y * 0.5 + 0.5) * rect.height + rect.top

    // 在屏幕坐标系中,右侧采样点与包围球中心点的距离,即为包围球在屏幕上的半径
    // TODO: 这里我尝试使用命中的geometry的boundingSphere来计算投影半径,但发现半径依旧是偏大的
    // TODO: 而且/2之后的结果视觉效果上看起来就是正确了,我不知道为什么
    const radiusPx = Math.hypot(edgeX - centerX, edgeY - centerY) / 2

    projection.centerPx.x = centerX
    projection.centerPx.y = centerY
    projection.radiusPx = radiusPx
    projection.ndcZ = centerNDC.z

    return projection
}

/**
 * 本函数用于获取给定物体的包围球球心和半径
 * @param {THREE.Object3D} object 需要计算包围球的三维物体
 * @return {{centerLocal: THREE.Vector3, radiusLocal: number}} 返回物体包围球在物体本地坐标系下的球心和半径
 * */
function getBoundingSphere(object) {
    const cacheKey = '__hoverLocalSphere'
    const cached = object.userData[cacheKey]
    if (cached !== undefined && cached !== null) {
        return cached
    }

    const data = {
        centerLocal: new THREE.Vector3(),
        radiusLocal: 0,
    }

    // 优先使用 geometry.boundingSphere
    if (object.isMesh && object.geometry) {

        const geom = object.geometry
        if (!geom.boundingSphere) {
            geom.computeBoundingSphere()
        }

        data.centerLocal.copy(geom.boundingSphere.center)
        data.radiusLocal = geom.boundingSphere.radius

        object.userData[cacheKey] = data
        return data
    }

    // setFromObject在计算包围盒时会遍历物体的所有子对象 所以这里使用缓存策略
    // 计算后将结果缓存在object.userData中 避免重复计算
    box.setFromObject(object)
    box.getBoundingSphere(sphere)

    // 将世界坐标转换为物体本地坐标
    inverseMatrixWorld.copy(object.matrixWorld).invert()
    const centerLocal = sphere.center.clone().applyMatrix4(inverseMatrixWorld)

    object.getWorldScale(worldScale)
    const maxScale = Math.max(worldScale.x, worldScale.y, worldScale.z) || 1
    const radiusLocal = sphere.radius / maxScale

    data.centerLocal.copy(centerLocal)
    data.radiusLocal = radiusLocal

    object.userData[cacheKey] = data

    return data
}

/**
 * 本函数用于计算指针位置到物体投影边缘的距离 (单位: 像素)
 * @param {{x: number, y: number}} pointerPx 指针在屏幕上的位置 (单位: 像素)
 * @param {{x: number, y: number}} centerPx 物体投影中心在屏幕上的位置 (单位: 像素)
 * @param {number} radiusPx 物体投影的半径 (单位: 像素)
 * @return {number} 返回指针位置到物体投影边缘的距离 (单位: 像素)
 * 若返回值大于0,则表示指针在投影边缘外部
 * 若返回值等于0,则表示指针在投影边缘上
 * 若返回值小于0,则表示指针在投影边缘内部
 * */
export function distanceToProjectionEdgePx(pointerPx, centerPx, radiusPx) {
    // console.log('接收到的鼠标位置: ', pointerPx)
    // console.log('接收到的投影中心位置: ', centerPx)
    // console.log('接收到的投影半径: ', radiusPx)

    const dx = pointerPx.x - centerPx.x
    const dy = pointerPx.y - centerPx.y
    const distanceToCenter = Math.hypot(dx, dy)

    // console.log('distanceToCenter=', distanceToCenter, 'radiusPx=', radiusPx, 'edge=', distanceToCenter - radiusPx)
    return distanceToCenter - radiusPx
}