import * as THREE from 'three'
import {findHoveringObject} from "../base/raycaster";
import {calcProjection, distanceToProjectionEdgePx} from "../lib/projection";

/**
 * @type {Object} state 本对象用于存储鼠标悬停交互的状态(可以认为是悬停状态的状态机)
 * @property {string} phase 当前悬停交互的阶段
 *      idle: 没有悬停任何物体
 *      body: 悬停在某个天体上
 *      sticky: 悬停在粘滞区上
 *      label: 悬停在label上
 * @property {THREE.Object3D|null} hitObject 当前射线检测命中的物体
 *      可能为空,因为当鼠标悬停在粘滞区/label上时,也要触发悬停状态的交互
 *      hitObject是随鼠标位置每帧更新的,但是active.entity是否随之更新取决于active.locked
 *      是否为true
 *      - active.locked === true: active.entity保持不变
 *      - active.locked === false: active.entity随hitObject更新
 * @property {Object} active 当前激活的天体的相关信息
 * @property {THREE.Object3D|null} active.entity 当前激活的天体对象
 * @property {boolean} active.locked 标记是否锁定前激活的天体
 *      - pointer.isLabelHover === true: 锁定当前激活的天体,不允许切换
 *      - pointer.isNearLabel === true: 锁定当前激活的天体,不允许切换
 *      也就是说,是否允许切换激活的天体,仅与用户是否靠近label或正在操作label有关
 * @property {Object} active.projection 存储当前激活天体的投影信息
 * @property {Object} active.projection.centerPx 存储当前激活天体投影在屏幕上的中心点坐标 (单位: 像素)
 * @property {number} active.projection.centerPx.x 当前激活天体投影中心点的X坐标 (单位: 像素)
 * @property {number} active.projection.centerPx.y 当前激活天体投影中心点的Y坐标 (单位: 像素)
 * @property {number} active.projection.radiusPx 当前激活天体投影的半径 (单位: 像素)
 * @property {number} active.projection.ndcZ 当前激活天体投影的NDC坐标的Z分量 (用于判断天体是否在镜头后方)
 * @property {Object} pointer 当前鼠标指针的状态
 * @property {boolean} pointer.inCanvas 标记当前鼠标指针是否在画布上
 *      主要是为了解决第一次加载后且鼠标没有进行位移时,默认鼠标在(0,0)位置的问题
 *      本字段仅用于更新NDC和判断raycaster的有效性,不作为悬停效果是否继续的唯一条件
 * @property {boolean} pointer.hasEverMoved 标记鼠标指针是否曾经移动过
 *      主要是为了解决第一次加载后且鼠标没有进行位移时,默认鼠标在(0,0)位置的问题
 *      本字段仅用于更新NDC和判断raycaster的有效性,不作为悬停效果是否继续的唯一条件
 * @property {THREE.Vector2} pointer.ndcCoordinate 存储当前鼠标指针的NDC坐标
 * @property {Object} pointer.screenPx 存储当前鼠标指针的屏幕坐标
 * @property {number} pointer.screenPx.x 鼠标指针的屏幕X坐标 (单位: 像素)
 * @property {number} pointer.screenPx.y 鼠标指针的屏幕Y坐标 (单位: 像素)
 * @property {boolean} pointer.isLabelHover 标记当前鼠标指针是否悬停在label上
 * @property {boolean} pointer.isNearLabel 标记当前鼠标指针是否靠近label
 * @property {Object} activeLabel 存储当前激活的label的状态
 * @property {DOMRect|null} activeLabel.rect 当前激活label的边界矩形 (用于判断鼠标是否靠近label)
 *      本字段必须在label DOM更新位置后刷新
 * @property {number} activeLabel.enterDistancePx 靠近label的距离阈值 (单位: 像素)
 *      鼠标距离label边界 <= 该值时即认为鼠标靠近label
 * @property {number} activeLabel.exitDistancePx 远离label的距离阈值 (单位: 像素)
 *      鼠标距离label边界 >= 该值时即认为鼠标远离label
 *      即:策略上来讲,进入更严格,退出更宽松,以防止抖动
 * @property {Object} sticky 存储当前粘滞区的状态
 *      关于粘滞区的概念,见/doc/粘滞区示意图.png
 *      粘滞区是一个环形区域,位于天体投影圆的外侧.该区域用于控制:
 *      - 是否继续显示label
 *      - 是否暂停公转
 *      更准确的说,sticky是一种状态,该状态用于当鼠标离开天体投影圆后,仍保持悬停效果的一种机制
 *      这种机制是为了确保当鼠标离开天体投影圆后,label不会立刻消失.而是会有一个过渡期,在这个过渡期内,label就会继续显示,公转继续暂停
 *      区域规则用于决定:
 *          - 是否可以提前退出sticky状态
 *          - 是否继续保持sticky状态
 *      时间规则用于决定:
 *          - 最早允许退出sticky状态的时刻
 *          - 最晚必须退出sticky状态的时刻00
 * @property {number} sticky.enterEdgeDistancePx 进入粘滞区的距离 (单位: 像素)
 *      这里的距离是指粘滞区这个环形区域距离被悬停天体投影到二维坐标系上的投影圆的距离
 * @property {number} sticky.exitEdgeDistancePx 退出粘滞区的距离 (单位: 像素)
 * @property {number} sticky.expireMs 粘滞效果的最长保留时长,超过该时长后即使鼠标仍停留在粘滞区,粘滞效果也要结束 (单位: 毫秒)
 * @property {number} sticky.minHoldMs 粘滞效果的最短保留时长,在该时长内即使鼠标离开粘滞区,粘滞效果也不会结束 (单位: 毫秒)
 *      设置该值是为了防止鼠标离开粘滞区后,进入label附近的区域之前,在这2个区域之间可能会有一个"缝隙",导致粘滞效果结束,label消失
 *      因此设置一个最短保留时长,确保在该时长内粘滞效果不会结束,给鼠标足够的时间移动到label附近区域
 *      关于区域之间的位置关系,见/doc/minHoldMs的作用.png
 * @property {number} sticky.lastHitAt 记录上次命中天体的时间戳 (单位: 毫秒)
 * @property {number} sticky.startedAt 记录粘滞效果开始(或者说进入粘滞区)的时间戳 (单位: 毫秒)
 * */
export const state = {
    phase: 'idle',
    hitObject: null,
    active: {
        entity: null,
        locked: false,
        projection: {
            centerPx: {
                x: 0,
                y: 0,
            },
            radiusPx: 0,
            ndcZ: 0,
        },
    },
    pointer: {
        inCanvas: false,
        hasEverMoved: false,
        ndcCoordinate: new THREE.Vector2(0, 0),
        screenPx: {
            x: 0,
            y: 0,
        },
        isLabelHover: false,
        isNearLabel: false,
    },
    activeLabel: {
        rect: null,
        enterDistancePx: 8,
        exitDistancePx: 14,
    },
    sticky: {
        enterEdgeDistancePx: 16,
        exitEdgeDistancePx: 24,
        expireMs: 1000,
        minHoldMs: 300,
        lastHitAt: 0,
        startedAt: 0,
    },
}

/**
 * 本函数用于判断当前是否应该显示label
 * @return {boolean} 若当前悬停状态不为idle则返回true 否则返回false
 * */
export function shouldShowLabel() {
    return state.phase !== 'idle'
}

/**
 * 本函数用于判断当前是否应该停止天体的公转
 * @return {boolean} 若当前悬停状态不为idle则返回true 否则返回false
 * */
export function shouldFreezeRevolution() {
    return state.phase !== 'idle'
}

/**
 * 本函数用于从sticky/label状态切换至idle状态
 * */
function enterIdle() {
    state.phase = 'idle'

    state.active.entity = null
    state.active.locked = false
    state.activeLabel.rect = null

    // 这里不维护pointer.isLabelHover的状态,因为该状态由label DOM的事件监听器维护
    state.pointer.isNearLabel = false

    state.sticky.lastHitAt = 0
    state.sticky.startedAt = 0
}

/**
 * 本函数用于刷新当前激活天体的投影信息(该函数被逐帧调用)
 * @param {THREE.PerspectiveCamera} camera 当前场景使用的相机
 * @param {HTMLElement} domElement 渲染场景的DOM元素 (通常是canvas)
 * */
function flushProjection(camera, domElement) {
    if (state.active.entity === null) {
        return
    }

    const projection = calcProjection(state.active.entity, camera, domElement)
    state.active.projection.centerPx = projection.centerPx
    state.active.projection.radiusPx = projection.radiusPx
    state.active.projection.ndcZ = projection.ndcZ
}

/**
 * 本函数用于从sticky/label/idle状态切换至body状态
 * @param {THREE.Object3D} hitObject 当前命中的天体对象
 * @param {THREE.PerspectiveCamera} camera 当前场景使用的相机
 * @param {HTMLElement} domElement 渲染场景的DOM元素 (通常是canvas)
 * */
function enterBody(hitObject, camera, domElement) {
    // 防御性检测: 若当前激活天体被锁定 则不允许切换至body状态
    // 但其实如果当前激活天体被锁定,就不该进入body状态,所以这里仅作防御性检测
    if (state.active.locked) {
        return
    }

    // 此时由于这一帧还没显示label(因为刚进入body状态,显示label是由逐帧渲染函数animate()来控制的),
    // 所以不更新rect,等到下一帧显示label时再由animate()函数更新rect
    state.phase = 'body'
    state.active.entity = hitObject
    flushProjection(camera, domElement)
}

/**
 * 本函数用于从body/sticky状态切换至label状态
 * */
function enterLabel() {
    state.phase = 'label'
}

function enterSticky(nowMs) {
    state.phase = 'sticky'
    state.sticky.startedAt = nowMs
}

/**
 * 本函数用于逐帧更新鼠标悬停交互的状态
 * @param {number} nowMs 当前时间戳 (单位: 毫秒)
 * @param {THREE.PerspectiveCamera} camera 当前场景使用的相机
 * @param {HTMLElement} domElement 渲染场景的DOM元素 (通常是canvas)
 * */
export function tickHover(nowMs, camera, domElement) {
    // console.log(state.phase)

    // 逐帧刷新当前激活天体的投影信息
    flushProjection(camera, domElement)
    // 更新允许切换天体的标量
    state.active.locked = state.pointer.isLabelHover || state.pointer.isNearLabel

    // 刚加载时,鼠标未移动却默认在(0,0)位置,这种情况属于idle状态
    if (!state.pointer.hasEverMoved) {
        // console.log('强制进入idle2')
        enterIdle()
        return
    }

    if (state.phase === 'idle') {
        const hitObject = findHoveringObject(state.pointer.ndcCoordinate, camera)
        if (hitObject !== null) {
            enterBody(hitObject, camera, domElement)
            return
        }
    }

    if (state.phase === 'body') {
        // case1. 鼠标上一帧在天体A处悬停,这一帧出现在label上或label附近
        // 这里一定要让label的优先级最高,因为有可能出现label和天体投影重叠的情况,
        // 此时应该进入label状态而不是维持body状态
        if (state.pointer.isLabelHover || state.pointer.isNearLabel) {
            enterLabel()
            return
        }

        // case2. 鼠标上一帧在天体A处悬停,这一帧仍旧悬停在天体上(但不一定是天体A)
        const hitObject = findHoveringObject(state.pointer.ndcCoordinate, camera)
        if (hitObject !== null) {
            state.sticky.lastHitAt = nowMs
            // 2.1 悬停在了不同天体上
            if (hitObject !== state.active.entity) {
                enterBody(hitObject, camera, domElement)
            }

            // 2.2 仍旧悬停在同一天体A上 保持body状态不变即可(刷新投影信息已在之前调用flushProjection()时完成)
            return
        }

        // case3. 鼠标上一帧在天体A处悬停,这一帧出现在粘滞环区域内
        // 此时由于刚刚进入粘滞区,所以必然不会超过最短保留时长minHoldMs
        // 因此不需要检测sticky状态是否超时,直接进入sticky状态即可
        const distance = distanceToProjectionEdgePx(state.pointer.screenPx, state.active.projection.centerPx, state.active.projection.radiusPx)
        if (0 < distance && distance < state.sticky.enterEdgeDistancePx) {
            enterSticky(nowMs)
            return
        }

        // case4. 鼠标上一帧在天体A处悬停,这一帧不在天体上/label上/粘滞区内,则直接进入idle状态
        enterIdle()
    }

    if (state.phase === 'sticky') {
        // 防御性编程: 若这一帧激活天体不存在 则直接进入idle状态
        if (state.active.entity === null) {
            enterIdle()
            return
        }

        // console.log('near: ', state.pointer.isNearLabel, ' hover: ', state.pointer.isLabelHover)

        // case1. 鼠标上一帧在粘滞区内,这一帧出现在label上或label附近
        // 变更为label状态
        if (state.pointer.isLabelHover || state.pointer.isNearLabel) {
            // 清空sticky状态
            state.sticky.lastHitAt = 0
            state.sticky.startedAt = 0

            // 变更为label状态
            enterLabel()
            return
        }

        // case2. 鼠标上一帧在粘滞区内,这一帧悬停在天体上
        const hitObject = findHoveringObject(state.pointer.ndcCoordinate, camera)
        if (hitObject !== null) {
            // 清空sticky状态
            state.sticky.lastHitAt = 0
            state.sticky.startedAt = 0

            // 注意检查此时是否允许切换天体
            // 理论上这一帧的locked应该不会是true,因为若locked为true,则不可能进入sticky状态
            // 或者根据优先级已经转移到label状态了
            if (!state.active.locked) {
                enterBody(hitObject, camera, domElement)
                return
            }
        }

        // case3. sticky状态在这一帧到达了超时时间
        // 若超时,则退出sticky状态,进入idle状态
        // 这里要注意,若这一帧超时或距离超过阈值了,直接进入idle状态即可,因为如果能进入
        // label/body状态的话,直接就进入前面的case1/case2了,不会来到这里
        const elapsed = (nowMs - state.sticky.startedAt)
        if (elapsed >= state.sticky.expireMs) {
            // console.log('因为超时,从sticky进入idle')
            enterIdle()
            return
        }

        // case4. 鼠标上一帧在粘滞区内,这一帧移动到了粘滞区外
        // 此时需要检测是否超过了最短保留时长,超过最短保留时长后,再检测距离是否超过阈值
        if (elapsed < state.sticky.minHoldMs) {
            return
        }

        const distance = distanceToProjectionEdgePx(state.pointer.screenPx, state.active.projection.centerPx, state.active.projection.radiusPx)
        if (distance >= state.sticky.exitEdgeDistancePx) {
            // console.log('因为距离,从sticky进入idle')
            enterIdle()
        }
    }

    if (state.phase === 'label') {
        if (state.pointer.isLabelHover || state.pointer.isNearLabel) {
            return
        }

        // case1. 鼠标上一帧在label上,这一帧出现在某个天梯上
        const hitObject = findHoveringObject(state.pointer.ndcCoordinate, camera)
        if (hitObject !== null) {
            enterBody(hitObject, camera, domElement)
            return
        }


        // case2. 鼠标上一帧在label上,这一帧离开了label,此时直接进入idle状态
        enterIdle()
    }
}