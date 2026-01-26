import * as THREE from 'three'
import {pickableMeshes as sunPickableMeshes} from "../sun";
import {pickableMeshes as venusPickableMeshes} from "../planet/venus";
import {pickableMeshes as mercuryPickableMeshes} from "../planet/mercury";
import {pickableMeshes as earthPickableMeshes} from "../planet/earth";
import {pickableMeshes as marsPickableMeshes} from "../planet/mars";
import {pickableMeshes as jupiterPickableMeshes} from "../planet/jupiter";
import {pickableMeshes as saturnPickableMeshes} from "../planet/saturn";
import {pickableMeshes as uranusPickableMeshes} from "../planet/uranus";

/**
 * @type {THREE.Raycaster} 射线投射器 用于检测鼠标悬停时与物体的交互
 * */
const raycaster = new THREE.Raycaster(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1),
    0,
    Infinity
)

/**
 * @type {Array<THREE.Mesh>} 可拾取对象数组 用于存储场景中所有可以被鼠标悬停检测的物体
 * */
const pickAbleCollection = []

/**
 * 本函数用于获取所有可拾取对象
 * */
export function setPickAble() {
    for (const sunPickableMesh of sunPickableMeshes) {
        pickAbleCollection.push(sunPickableMesh)
    }

    for (const venusPickableMesh of venusPickableMeshes) {
        pickAbleCollection.push(venusPickableMesh)
    }

    for (const mercuryPickableMesh of mercuryPickableMeshes) {
        pickAbleCollection.push(mercuryPickableMesh)
    }

    for (const earthPickableMesh of earthPickableMeshes) {
        pickAbleCollection.push(earthPickableMesh)
    }

    for (const marsPickableMesh of marsPickableMeshes) {
        pickAbleCollection.push(marsPickableMesh)
    }

    for (const jupiterPickableMesh of jupiterPickableMeshes) {
        pickAbleCollection.push(jupiterPickableMesh)
    }

    for (const saturnPickableMesh of saturnPickableMeshes) {
        pickAbleCollection.push(saturnPickableMesh)
    }

    for (const uranusPickableMesh of uranusPickableMeshes) {
        pickAbleCollection.push(uranusPickableMesh)
    }
}

/**
 * 本函数用于根据鼠标的NDC坐标和相机位置,查找鼠标悬停的物体
 * @param {THREE.Vector2} mouseNDC 鼠标的NDC坐标
 * @param {THREE.PerspectiveCamera} camera 用于渲染场景的相机
 * @return {THREE.Object3D|null} 返回鼠标悬停的物体 如果没有悬停在任何物体上则返回null
 * */
export function findHoveringObject(mouseNDC, camera) {
    let currentHovered = null

    raycaster.setFromCamera(mouseNDC, camera)
    const intersects = raycaster.intersectObjects(pickAbleCollection, false)

    if (intersects.length === 0) {
        return currentHovered
    }

    // Tips: intersects中的元素是按照距离射线起点由近到远排序的所有射线命中的元素
    // Tips: 而本场景只需要检测到第1个命中的物体即可 没有穿透检测的需求
    return intersects[0].object
}
