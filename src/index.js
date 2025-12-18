import * as THREE from 'three'
import '../assets/index.css'
import {renderer} from './base/renderer'
import {camera} from './base/camera'
import {scene, initSceneEnvironment} from './base/scene'
import {skySphere, initSkySphereTexture, setAutoRotation as setSkySphereAutoRotation} from './skySphere'
import {axesHelper} from './base/axesHelper'
import {createOrbitControls} from './base/controls'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer'
import { RenderPass } from 'three/addons/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass'
import {initSun, setAutoRotation as setSunAutoRotation, sunAxis} from './sun.js'
import {initMercury, mercuryAxis, updateMercury} from "./plant/mercury";
import {initVenus, updateVenus, venusAxis} from "./plant/venus";
import {findHoveringObject, initHoverListener, setPickAble} from "./base/raycaster";

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
// 初始化鼠标悬停监听器
initHoverListener(renderer.domElement)

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

function animate() {
    requestAnimationFrame(animate)
    controls.update()

    // 设置天空球自转
    setSkySphereAutoRotation()

    // 设置太阳自转
    setSunAutoRotation()

    // 查找鼠标悬停的物体
    const hoveredObject = findHoveringObject(camera)
    let needRevolution = true
    if (hoveredObject !== null) {
        needRevolution = false
    }

    // 更新水星位置和自转
    updateMercury(needRevolution)

    // 更新金星位置和自转
    updateVenus(needRevolution)


    composer.render(scene, camera)
}

animate()
