<template>
  <div ref="container" class="three-container"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer'
import { RenderPass } from 'three/addons/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'

import { usePlanetStore } from '../stores/planetStore'
import { useHoverStore } from '../stores/hoverStore'
import { useFocusStore } from '../stores/focusStore'

import { renderer } from '../three/base/renderer'
import { camera } from '../three/base/camera'
import { initSceneEnvironment, scene } from '../three/base/scene'
import { initSkySphereTexture, setAutoRotation as setSkySphereAutoRotation, skySphere } from '../three/skySphere'
import { axesHelper } from '../three/base/axesHelper'
import { createOrbitControls } from '../three/base/controls'
import { initSun, setAutoRotation as setSunAutoRotation, sunAxis, pickableMeshes as sunPickableMeshes } from '../three/sun'
import { planets, getOuterPlanets } from '../three/planet/planets'
import { setPickAble, findHoveringObject } from '../three/base/raycaster'
import { initFocus, setFocusStore, isFocused, focusOn, clearFocus, updateFocus } from '../three/interaction/focus'
import { state as hoverState, tickHover, checkHover, setHoverStore, setSunAxisRef } from '../three/interaction/hover'
import { getNDCCoordinate, setLeaveCoordinate } from '../three/lib/pointer'
import { findAncestorByName } from '../three/lib/findAncestorByName'

const container = ref(null)
const planetStore = usePlanetStore()
const hoverStore = useHoverStore()
const focusStore = useFocusStore()

let controls = null
let bloomComposer = null
let finalComposer = null
let animationFrameId = null
let lastTime = 0

// Click tracking
let downX = 0
let downY = 0

// Bloom constants
const BLOOM_SCENE = 1
const OUTER_LIGHT_LAYER = 2
const bloomLayer = new THREE.Layers()
bloomLayer.set(BLOOM_SCENE)

const darkMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 })
const materials = {}

function darkenNonBloomed(obj) {
    if (obj.isMesh && !bloomLayer.test(obj.layers)) {
        materials[obj.uuid] = obj.material
        obj.material = darkMaterial
    }
}

function restoreMaterial(obj) {
    if (materials[obj.uuid]) {
        obj.material = materials[obj.uuid]
        delete materials[obj.uuid]
    }
}

// Event handlers
function onPointerDown(event) {
    downX = event.clientX
    downY = event.clientY
}

function onPointerUp(event) {
    const moved = Math.hypot(event.clientX - downX, event.clientY - downY)
    if (moved > 5) return

    const picked = findHoveringObject(hoverState.pointer.ndcCoordinate, camera)
    if (picked !== null) {
        const axisName = picked.userData.anchorPointName
        const focusObject = findAncestorByName(picked, axisName)
        const planetId = focusObject.userData.planetId || focusObject.name
        focusOn(focusObject, planetId)
        hoverStore.hide()
        return
    }

    clearFocus()
}

function onPointerEnter() {
    hoverState.pointer.inCanvas = true
}

function onPointerMove(event) {
    hoverState.pointer.inCanvas = true
    hoverState.pointer.hasEverMoved = true
    getNDCCoordinate(event.clientX, event.clientY, renderer.domElement, hoverState.pointer.ndcCoordinate)
    hoverState.pointer.screenPx.x = event.clientX
    hoverState.pointer.screenPx.y = event.clientY
}

function onPointerLeave() {
    hoverState.pointer.inCanvas = false
    setLeaveCoordinate(hoverState.pointer.ndcCoordinate)
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    if (bloomComposer) bloomComposer.setSize(window.innerWidth, window.innerHeight)
    if (finalComposer) finalComposer.setSize(window.innerWidth, window.innerHeight)
}

// Animate loop
function animate() {
    animationFrameId = requestAnimationFrame(animate)

    setSkySphereAutoRotation()
    setSunAutoRotation()
    controls.update()

    const now = performance.now()
    tickHover(now, camera, renderer.domElement)

    // Check for pending focus/clear requests from Vue
    if (focusStore.pendingFocusId) {
        const planetId = focusStore.consumeFocusRequest()
        if (planetId) {
            // Find the Three.js object for this planetId
            const focusObject = findFocusObjectById(planetId)
            if (focusObject) {
                focusOn(focusObject, planetId)
                hoverStore.hide()
            }
        }
    }
    if (focusStore.pendingClear) {
        focusStore.consumeClearRequest()
        clearFocus()
    }

    let freeze = isFocused()
    if (!isFocused()) {
        freeze = checkHover(camera, renderer.domElement)
    }

    const deltaSecond = (now - lastTime) / 1000
    lastTime = now
    updateFocus(deltaSecond)

    planets.forEach(planet => planet.update(!freeze))

    // Selective bloom render
    scene.traverse(darkenNonBloomed)
    bloomComposer.render()
    scene.traverse(restoreMaterial)
    finalComposer.render()
}

// Find a Three.js object by planetId (for store-driven focus)
function findFocusObjectById(planetId) {
    if (planetId === 'sun') return sunAxis

    for (const planet of planets) {
        if (planet.config.id === planetId) {
            return planet.axis
        }
    }
    return null
}

onMounted(async () => {
    // 1. Fetch planet data
    await planetStore.fetchPlanets()

    // 2. Append renderer to container
    container.value.appendChild(renderer.domElement)

    // 3. Init scene environment
    try {
        await initSceneEnvironment(renderer)
    } catch (err) {
        console.error('初始化场景环境贴图失败:', err)
    }

    // 4. Init sky sphere
    try {
        await initSkySphereTexture()
        scene.add(skySphere)
    } catch (err) {
        console.error('初始化天空球贴图失败:', err)
    }

    // 5. Add axes helper
    scene.add(axesHelper)

    // 6. Create orbit controls
    controls = createOrbitControls(camera, renderer.domElement)

    // 7. Init sun
    try {
        await initSun()
        scene.add(sunAxis)
    } catch (err) {
        console.error('初始化太阳模型失败:', err)
    }

    // 8. Init all planets
    for (const planet of planets) {
        try {
            await planet.init()
            scene.add(planet.axis)
        } catch (err) {
            console.error(`初始化${planet.config.label.name}模型失败:`, err)
        }
    }

    // 9. Set pickable objects
    const allPickableMeshes = [sunPickableMeshes]
    planets.forEach(p => allPickableMeshes.push(p.getPickableMeshes()))
    setPickAble(allPickableMeshes)

    // 10. Init focus system with store
    setFocusStore(focusStore)
    initFocus(camera, controls)

    // 11. Init hover system with store
    setHoverStore(hoverStore)
    setSunAxisRef(sunAxis)

    // 12. Setup bloom layers
    sunAxis.traverse((obj) => {
        obj.layers.enable(BLOOM_SCENE)
    })

    camera.layers.enable(OUTER_LIGHT_LAYER)
    getOuterPlanets().forEach(planet => {
        planet.axis.traverse((obj) => {
            obj.layers.enable(OUTER_LIGHT_LAYER)
        })
    })

    // 13. Setup post-processing pipeline
    const renderScene = new RenderPass(scene, camera)

    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        2.2,    // strength
        0.55,   // radius
        0.88    // threshold
    )
    bloomComposer = new EffectComposer(renderer)
    bloomComposer.renderToScreen = false
    bloomComposer.addPass(renderScene)
    bloomComposer.addPass(bloomPass)

    const finalPass = new ShaderPass(
        new THREE.ShaderMaterial({
            uniforms: {
                baseTexture: { value: null },
                bloomTexture: { value: bloomComposer.renderTarget2.texture },
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D baseTexture;
                uniform sampler2D bloomTexture;
                varying vec2 vUv;

                void main() {
                    vec4 base = texture2D(baseTexture, vUv);
                    vec4 bloom = texture2D(bloomTexture, vUv);
                    gl_FragColor = base + bloom;
                }
            `,
        }),
        'baseTexture',
    )

    finalComposer = new EffectComposer(renderer)
    finalComposer.addPass(renderScene)
    finalComposer.addPass(finalPass)

    // 14. Register pointer events
    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointerup', onPointerUp)
    renderer.domElement.addEventListener('pointerenter', onPointerEnter)
    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('pointerleave', onPointerLeave)
    window.addEventListener('resize', onWindowResize)

    // 15. Start animation loop
    lastTime = performance.now()
    animate()
})

onBeforeUnmount(() => {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
    }
    renderer.domElement.removeEventListener('pointerdown', onPointerDown)
    renderer.domElement.removeEventListener('pointerup', onPointerUp)
    renderer.domElement.removeEventListener('pointerenter', onPointerEnter)
    renderer.domElement.removeEventListener('pointermove', onPointerMove)
    renderer.domElement.removeEventListener('pointerleave', onPointerLeave)
    window.removeEventListener('resize', onWindowResize)
    renderer.dispose()
})
</script>

<style scoped>
.three-container {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}
</style>
