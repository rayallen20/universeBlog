import * as THREE from 'three'
import {worldToScreen} from "../lib/worldToScreen";
import {camera} from "../base/camera";
import {renderer} from "../base/renderer";
import {calcOffset} from "./calcOffset";
import {sunAxis} from "../sun";

/**
 * @type {HTMLDivElement} 鼠标悬停时要显示的标签
 * */
const labelElement = document.querySelector('#hoverLabel')

/**
 * @type {HTMLDivElement}
 * */
const cardElement = document.querySelector('.card')

/**
 * 本函数用于当鼠标悬停在天体上时 显示对应的标签
 * @param {THREE.Object3D} hoveredObject 鼠标悬停的物体
 * */
export function showLabel(hoveredObject) {
    const hoveredBodyPosition = worldToScreen(hoveredObject, camera, renderer.domElement)

    // 若物体在镜头后方 则不需要显示标签
    if (hoveredBodyPosition.ndc.z > 1) {
        labelElement.style.display = 'none'
        return
    }

    // 获取标签的偏移量
    const offset = calcOffset(hoveredObject, sunAxis, camera, renderer.domElement)
    const dx = hoveredBodyPosition.screenX + offset.x
    const dy = hoveredBodyPosition.screenY + offset.y
    // 更新内容
    cardElement.textContent = hoveredObject.userData.label

    // 设置标签位置
    labelElement.style.display = 'block'
    labelElement.style.transform = `translate(${dx}px, ${dy}px)`
}

/**
 * 本函数用于隐藏标签
 * */
export function hiddenLabel() {
    labelElement.style.display = 'none'
}