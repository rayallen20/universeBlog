import * as THREE from 'three'
import {findAncestorByName} from "../lib/findAncestorByName";
import {config as sunConfig, sunAxis} from "../sun";
import {config as mercuryConfig, mercuryAxis} from "../plant/mercury";
import {config as venusConfig, venusAxis} from "../plant/venus";

/**
 * @type {THREE.Raycaster} 射线投射器 用于实现鼠标悬停在某个物体上时的交互效果
 * */
const raycaster = new THREE.Raycaster(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1),
    0,
    Infinity
)

/**
 * @type {THREE.Vector2} 鼠标位置 用于存储鼠标在屏幕上的位置坐标
 * */
const mousePosition = new THREE.Vector2(0, 0)

/**
 * @type {Array<THREE.Object3D>} 可拾取对象数组 用于存储场景中所有可以被鼠标悬停检测的物体
 * */
const pickAbleCollection = []

/**
 * 本函数用于获取所有可拾取对象
 * */
export function setPickAble() {
    sunAxis.traverse((object) => {
        if (object.name === sunConfig.groupName) {
            pickAbleCollection.push(object)
        }
    })

    mercuryAxis.traverse((object) => {
        if (object.name === mercuryConfig.groupName) {
            pickAbleCollection.push(object)
        }
    })

    venusAxis.traverse((object) => {
        if (object.name === venusConfig.groupName) {
            pickAbleCollection.push(object)
        }
    })
}

/**
 * @type {boolean} isListening 本标量用于标记鼠标悬停监听器是否已经初始化
 * */
let isListening = false

/**
 * 本函数用于初始化鼠标悬停监听器
 * @param {HTMLElement|Window} domElement 监听的DOM元素 通常为渲染器的domElement 但也有可能是window或document
 * */
export function initHoverListener(domElement) {
    if (isListening) {
        return
    }

    domElement.addEventListener('mousemove', (event) => {
        let rect

        if (domElement === window) {
            rect = {
                left: 0,
                top: 0,
                width: window.innerWidth,
                height: window.innerHeight,
            }
        } else {
            rect = domElement.getBoundingClientRect()
        }

        const ndcX = ((event.clientX - rect.left) / rect.width) * 2 - 1
        const ndcY = -((event.clientY - rect.top) / rect.height) * 2 + 1

        mousePosition.set(ndcX, ndcY)
    })
}

/**
 * 本函数用于寻找鼠标悬停的物体
 * @param {THREE.PerspectiveCamera} camera 当前场景使用的相机
 * @return {THREE.Object3D|null} 返回鼠标悬停的物体 如果没有悬停任何物体则返回null
 * */
export function findHoveringObject(camera) {
    let currentHovered = null

    raycaster.setFromCamera(mousePosition, camera)
    const intersects = raycaster.intersectObjects(pickAbleCollection, true)

    if (intersects.length === 0) {
        return currentHovered
    }

    // Tips: intersects中的元素是按照距离射线起点由近到远排序的所有射线命中的元素
    // Tips: 而本场景只需要检测到第1个命中的物体即可 没有穿透检测的需求
    const hitObject = intersects[0].object

    // 确认命中对象的祖先对象是否在可拾取对象集合中
    for (const pickable of pickAbleCollection) {
        const ancestor = findAncestorByName(hitObject, pickable.name)
        if (ancestor !== null) {
            currentHovered = ancestor
            return currentHovered
        }
    }

    return currentHovered
}

