import * as THREE from 'three'
import '../assets/index.css'
import {renderer} from './renderer'
import {camera} from './camera'
import {scene, initSceneEnvironment} from './scene'
import { skySphere, initSkySphereTexture } from './skySphere'
import {axesHelper} from './axesHelper'
import {createOrbitControls} from './controls'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer'
import { RenderPass } from 'three/addons/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass'
import { sunRoot, initSun, setAutoRotation } from './sun.js'

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
    scene.add(sunRoot)
} catch (err) {
    console.error('初始化太阳模型失败:', err)
}

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

    // 设置太阳自转
    setAutoRotation()

    composer.render(scene, camera)
}

animate()