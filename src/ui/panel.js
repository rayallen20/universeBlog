import * as THREE from 'three'

/**
 * @type {HTMLDivElement} 用于显示天体信息的面板元素
 * */
const panelElement = document.querySelector('#panel')

/**
 * @type {HTMLDivElement} 面板中的内容元素
 * */
const contentContainerElement = document.querySelector('.content-container')

/**
 * @type {HTMLElement} 面板标题元素
 * */
const titleElement = document.querySelector('.content-container .title')

/**
 * @type {HTMLElement} 面板内容元素
 * */
const contentElement = document.querySelector('.content-container .content')

/**
 * @type {HTMLButtonElement} 关闭面板的按钮
 * */
const closeButton = document.querySelector('.close')

/**
 * @type {boolean} inited 本标量用于标记面板是否已经初始化
 * */
let inited = false

/**
 * 本函数用于初始化信息面板(为关闭按钮绑定事件)
 * @param {Function} onClose 面板关闭时的回调函数
 * */
export function initPanel(onClose) {
    if (inited) {
        return
    }

    closeButton.addEventListener('click', (event) => {
        event.stopPropagation()
        if (onClose !== null && onClose !== undefined) {
            onClose()
        }
    })

    inited = true
}

/**
 * 本函数用于显示信息面板
 * @param {THREE.Object3D} object 要显示信息的天体对象
 * */
export function showPanel(object) {
    panelElement.style.display = 'block'

    const name = object.userData.label
    const type = object.userData.bodyType
    const content = '一段介绍文字...'

    titleElement.innerText = name
    contentElement.innerText = `类型: ${type}\n\n介绍: ${content}`
}

/**
 * 本函数用于隐藏信息面板
 * */
export function hidePanel() {
    panelElement.style.display = 'none'
}
