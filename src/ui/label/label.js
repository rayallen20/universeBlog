import * as THREE from 'three'
import {worldToScreen} from "../../lib/worldToScreen";
import {camera} from "../../base/camera";
import {renderer} from "../../base/renderer";
import {calcOffset} from "./calcOffset";
import {sunAxis} from "../../sun";
import {state} from "../../interaction/hover";
import {focusOn} from "../../interaction/focus";
import {findAncestorByName} from "../../lib/findAncestorByName";

/**
 * @type {HTMLDivElement} 鼠标悬停时要显示的标签
 * */
export const labelElement = document.querySelector('.labelWrap')

labelElement.addEventListener('pointerenter', (event) => {
    state.pointer.isLabelHover = true
})

labelElement.addEventListener('pointerleave', (event) => {
    state.pointer.isLabelHover = false
})

/**
 * @type {HTMLDivElement} 标签中的标题元素
 * */
const titleElement = document.querySelector('.contentLayer .content h2')

/**
 * @type {HTMLParagraphElement} 标签中的介绍元素
 * */
const introElement = document.querySelector('.contentLayer .content p')

/**
 * @type {HTMLButtonElement} 标签中的聚焦按钮元素
 * */
const focusOnButtonElement = document.querySelector('.contentLayer .bottomButton')
focusOnButtonElement.addEventListener('click', focusOnBody)

/**
 * 本函数用于聚焦到当前标签所表示的天体
 * @param {PointerEvent} event 鼠标事件对象
 * */
function focusOnBody(event) {
    // 有可能在label隐藏的动画期间(也就是opacity从1变为0的过程中)点击了按钮
    // 此时状态机已经进入了idle状态 只是label还没有完全隐藏 所以这里要判一下空 避免出现NPE问题
    if (state.active.entity === null) {
        return
    }

    const axisName = state.active.entity.userData.anchorPointName
    const focusObject = findAncestorByName(state.active.entity, axisName)
    focusOn(focusObject)
    hiddenLabel()
}

/**
 * 本函数用于当鼠标悬停在天体上时 显示对应的标签
 * @param {THREE.Object3D} hoveredObject 鼠标悬停的物体
 * */
export function showLabel(hoveredObject) {
    const hoveredBodyPosition = worldToScreen(hoveredObject, camera, renderer.domElement)

    // 若物体在镜头后方 则不需要显示标签
    if (hoveredBodyPosition.ndc.z > 1) {
        hiddenLabel()
        return
    }

    // 获取标签的偏移量
    const offset = calcOffset(hoveredObject, sunAxis, camera, renderer.domElement)
    const dx = hoveredBodyPosition.screenX + offset.x
    const dy = hoveredBodyPosition.screenY + offset.y

    // 更新内容
    titleElement.textContent = hoveredObject.userData.label
    introElement.textContent = hoveredObject.userData.intro

    // 设置标签位置
    labelElement.style.opacity = '1'
    labelElement.style.visibility = 'visible'

    labelElement.style.left = dx + 'px'
    labelElement.style.top = dy + 'px'
    labelElement.style.pointerEvents = 'auto'
}

/**
 * 本函数用于隐藏标签
 * */
export function hiddenLabel() {
    labelElement.style.opacity = '0'
    labelElement.style.visibility = 'hidden'
    labelElement.style.pointerEvents = 'none'
}

/**
 * 本函数用于判断给定的点是否靠近label所表示的矩形区域
 * @param {DOMRect} rect label所表示的矩形区域
 * @param {{x: number, y: number} } pointerPx 需要判断的点的屏幕坐标
 * @param {number} enterDistancePx 判定为靠近的距离阈值 (单位: 像素)
 * @return {boolean} 如果点靠近矩形区域则返回true 否则返回false
 * */
export function isNearLabel(rect, pointerPx, enterDistancePx) {
    const distance = pointToRectDistancePx(rect, pointerPx)
    return distance <= enterDistancePx
}

/**
 * 本函数用于判断给定的点是否远离label所表示的矩形区域
 * @param {DOMRect} rect label所表示的矩形区域
 * @param {{x: number, y: number} } pointerPx 需要判断的点的屏幕坐标
 * @param {number} exitDistancePx 判定为远离的距离阈值 (单位: 像素)
 * @return {boolean} 如果点远离矩形区域则返回true 否则返回false
 * */
export function isFarLabel(rect, pointerPx, exitDistancePx) {
    const distance = pointToRectDistancePx(rect, pointerPx)
    return distance >= exitDistancePx
}

/**
 * 本函数用于计算给定位置的点到label所表示的矩形区域的距离
 * @param {DOMRect} rect label所表示的矩形区域
 * @param {{x: number, y: number} } point 需要计算距离的点的屏幕坐标
 * @return {number} 返回点到矩形区域的距离 (单位: 像素)
 * */
function pointToRectDistancePx(rect, point) {
    // 屏幕坐标下的四条边
    const left = rect.left
    const right = rect.right
    const top = rect.top
    const bottom = rect.bottom

    // dx: 点到left的距离 或 点到right的距离
    let dx = 0
    if (point.x < left) {
        dx = left - point.x
    } else if (point.x > right) {
        dx = point.x - right
    }

    // dy: 点到top的距离 或 点到bottom的距离
    let dy = 0
    if (point.y < top) {
        dy = top - point.y
    } else if (point.y > bottom) {
        dy = point.y - bottom
    }

    return Math.hypot(dx, dy)
}
