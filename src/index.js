import * as THREE from 'three'
import '../assets/css/index.css'
import '../assets/css/font.css'
import '../assets/css/reset.css'
import '../assets/css/label/labelWrap.css'
import '../assets/css/label/labelShape.css'
import '../assets/css/label/borderLayer.css'
import '../assets/css/label/innerDecorLayer.css'
import '../assets/css/label/outerDecorLayer.css'
import '../assets/css/label/contentLayer.css'
import '../assets/css/panel/panelWrap.css'
import '../assets/css/panel/contentWrap.css'
import '../assets/css/panel/shortContentWrap.css'
import '../assets/css/panel/longContentWrap.css'
import '../assets/css/common/bottomButton.css'
import '../assets/css/common/leftTrapezoid.css'
import {renderer} from './base/renderer'
import {camera} from './base/camera'
import {initSceneEnvironment, scene} from './base/scene'
import {initSkySphereTexture, setAutoRotation as setSkySphereAutoRotation, skySphere} from './skySphere'
import {axesHelper} from './base/axesHelper'
import {createOrbitControls} from './base/controls'
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer'
import {RenderPass} from 'three/addons/postprocessing/RenderPass'
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass'
import {initSun, setAutoRotation as setSunAutoRotation, sunAxis} from './sun.js'
import {initMercury, mercuryAxis, updateMercury} from "./planet/mercury";
import {initVenus, updateVenus, venusAxis} from "./planet/venus";
import {hiddenLabel, isFarLabel, isNearLabel, labelElement, showLabel} from "./ui/label/label";
import {clearFocus, focusOn, initFocus, isFocused, updateFocus} from "./interaction/focus";
import {shouldFreezeRevolution, shouldShowLabel, state, tickHover} from "./interaction/hover";
import {getNDCCoordinate, setLeaveCoordinate} from "./lib/pointer";
import {findHoveringObject, setPickAble} from "./base/raycaster";
import {findAncestorByName} from "./lib/findAncestorByName";

document.body.appendChild(renderer.domElement)

// 初始化场景环境贴图
try {
    await initSceneEnvironment(renderer)
} catch (err) {
    console.error('初始化场景环境贴图失败:', err)
}

// 初始化天空球并添加到场景中
try {
    await initSkySphereTexture()
    scene.add(skySphere)
} catch (err) {
    console.error('初始化天空球贴图失败:', err)
}

// 添加坐标轴辅助线到场景中
scene.add(axesHelper)

// 加载轨道控制器
const controls = createOrbitControls(camera, renderer.domElement)

// 初始化太阳模型并添加到场景中
try {
    await initSun()
    scene.add(sunAxis)
} catch (err) {
    console.error('初始化太阳模型失败:', err)
}

// 初始化水星模型并添加到场景中
try {
    await initMercury()
    scene.add(mercuryAxis)
} catch (err) {
    console.error('初始化水星模型失败:', err)
}

// 初始化金星模型并添加到场景中
try {
    await initVenus()
    scene.add(venusAxis)
} catch (err) {
    console.error('初始化金星模型失败:', err)
}

// 设置可拾取对象
setPickAble()

// 初始化面板
initFocus(camera, controls)

// 后期处理 设置光晕效果
const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))

const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    40, // 光晕强度
    3.5, // 光晕扩散半径
    0.85 // 光晕阈值
)
composer.addPass(bloomPass)

// 窗口缩放自适应
window.addEventListener('resize', onWindowResize)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    composer.setSize(window.innerWidth, window.innerHeight)
}

// 点击聚焦
let downX = 0
let downY = 0

renderer.domElement.addEventListener('pointerdown', (event) => {
    downX = event.clientX
    downY = event.clientY
})

renderer.domElement.addEventListener('pointerup', (event) => {
    const upX = event.clientX
    const upY = event.clientY

    const dx = upX - downX
    const dy = upY - downY

    const moved = Math.hypot(dx, dy)
    // 超过某个阈值则视为拖拽而非点击
    if (moved > 5) {
        return
    }

    const picked = findHoveringObject(state.pointer.ndcCoordinate, camera)
    if (picked !== null) {
        const axisName = picked.userData.anchorPointName
        const focusObject = findAncestorByName(picked, axisName)
        focusOn(focusObject)
        hiddenLabel()
        return
    }

    // 如果没有拾取到任何物体 则取消聚焦
    clearFocus()
})

renderer.domElement.addEventListener('pointerenter', (event) => {
    state.pointer.inCanvas = true
})

renderer.domElement.addEventListener('pointermove', (event) => {
    // 防御性措施: 有些情况下pointerenter不触发但pointermove会触发
    state.pointer.inCanvas = true
    state.pointer.hasEverMoved = true

    getNDCCoordinate(event.clientX, event.clientY, renderer.domElement, state.pointer.ndcCoordinate)

    state.pointer.screenPx.x = event.clientX
    state.pointer.screenPx.y = event.clientY
})

renderer.domElement.addEventListener('pointerleave', (event) => {
    state.pointer.inCanvas = false
    setLeaveCoordinate(state.pointer.ndcCoordinate)
})

let lastTime = performance.now()
function animate() {
    requestAnimationFrame(animate)

    // 设置天空球自转
    setSkySphereAutoRotation()

    // 设置太阳自转
    setSunAutoRotation()

    controls.update()

    const now = performance.now()
    tickHover(now, camera, renderer.domElement)

    // 聚焦的优先级高于悬停 换言之,只要处于聚焦状态,则不需要检测悬停
    let freeze = isFocused()
    if (!isFocused()) {
        freeze = checkHover()
    }

    const deltaSecond = (now - lastTime) / 1000
    lastTime = now
    updateFocus(deltaSecond)

    // 更新水星位置和自转
    updateMercury(!freeze)

    // 更新金星位置和自转
    updateVenus(!freeze)

    composer.render(scene, camera)
}

/**
 * 本函数用于检测当前鼠标是否悬停在某个天体及其label上
 * @return {boolean} 若需要冻结公转则返回true,否则返回false
 * */
function checkHover() {
    const freeze = shouldFreezeRevolution()
    if (shouldShowLabel()) {
        const axisName = state.active.entity.userData.anchorPointName
        const activeObject = findAncestorByName(state.active.entity, axisName)
        showLabel(activeObject)

        state.activeLabel.rect = labelElement.getBoundingClientRect()
        // 按"严进宽出"的迟滞逻辑判定是否靠近label
        // 严进: 鼠标靠近label时,需要靠近距离较小才能判定为靠近
        // 宽出: 鼠标远离label时,需要离开的比较远才能判定为远离
        if (!state.pointer.isNearLabel) {
            state.pointer.isNearLabel = isNearLabel(state.activeLabel.rect, state.pointer.screenPx, state.activeLabel.enterDistancePx)
        } else {
            state.pointer.isNearLabel = !isFarLabel(state.activeLabel.rect, state.pointer.screenPx, state.activeLabel.exitDistancePx)
        }
    } else {
        hiddenLabel()
        state.activeLabel.rect = null
        state.pointer.isNearLabel = false
    }

    return freeze
}

animate()

// console.log(scene.children)