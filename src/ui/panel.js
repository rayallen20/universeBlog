import * as THREE from 'three'

/**
 * @type {HTMLDivElement} 用于显示天体信息的面板元素
 * */
const panelElement = document.querySelector('.panelWrap')

/**
 * @type {HTMLElement} 面板标题元素
 * */
const titleElement = document.querySelector('.contentWrap .shortContentWrap h2')

/**
 * @type {HTMLElement} 面板内容元素
 * */
const contentElement = document.querySelector('.contentWrap .shortContentWrap p')

/**
 * 本函数用于显示信息面板
 * @param {THREE.Object3D} object 要显示信息的天体对象
 * */
export function showPanel(object) {
    panelElement.hidden = false
    panelElement.classList.remove('is-closing')

    titleElement.textContent = object.userData.label
    contentElement.textContent = object.userData.intro

    // 下一帧再加is-open 确保transition生效
    requestAnimationFrame(
        () => panelElement.classList.add('is-open')
    )
}

/**
 * 本函数用于隐藏信息面板
 * */
export function hidePanel() {
    panelElement.classList.remove('is-open')
    panelElement.classList.add('is-closing')

    const onEnd = (event) => {
        // 只关心transform结束
        if (event.propertyName !== 'transform') {
            return
        }

        panelElement.hidden = true
        panelElement.classList.remove('is-closing')
        panelElement.removeEventListener('transitionend', onEnd)
    }

    panelElement.addEventListener('transitionend', onEnd)
}
