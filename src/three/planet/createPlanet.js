import * as THREE from 'three'
import {loadGLTF} from "../lib/loadGLTF"
import {setShadowCastReceive} from "../lib/setShadow"
import {scaleModel} from "../lib/scalModel"
import {centerModelToOrigin} from "../lib/centerModelToOrigin"
import {listMeshes} from "../lib/listMeshes"
import {initOrbitalGroupPosition} from "./helper/position"
import {createOrbitPath} from "./helper/orbitPath"
import {setOrbitalGroupPosition} from "./helper/revolution"
import {setSpinAutoRotation} from "./helper/autoRotation"

/**
 * 行星工厂函数
 * @param {Object} config 行星配置
 * @returns {{ config, axis, getPickableMeshes, init, update }}
 */
export function createPlanet(config) {
    // 轨道面倾角层
    const axis = new THREE.Group()
    axis.name = config.axisName

    // 公转层
    const root = new THREE.Group()
    root.name = config.groupName
    root.userData.bodyType = config.label.bodyType
    root.userData.label = config.label.name
    root.userData.intro = config.label.intro
    root.userData.planetId = config.id

    // 自转层
    const spin = new THREE.Group()
    spin.name = config.spinName

    let model = null
    let orbitAngle = { value: 0 }
    let pickableMeshes = []

    async function init() {
        const gltf = await loadGLTF(config.path)

        model = gltf.scene
        setShadowCastReceive(model)
        scaleModel(model, config.scale)
        centerModelToOrigin(model)

        pickableMeshes = listMeshes(model)
        for (const mesh of pickableMeshes) {
            mesh.userData.anchorPointName = config.groupName
        }

        // 按层级挂载: spin -> root -> axis
        spin.clear()
        spin.add(model)

        root.clear()
        root.add(spin)

        axis.clear()
        axis.add(root)

        // 倾斜轨道层
        axis.rotation.x = THREE.MathUtils.degToRad(config.orbit.dipAngle)

        // 初始化行星位置
        initOrbitalGroupPosition(root, orbitAngle.value, config.orbit.semiMajorAxis, config.orbit.eccentricity)

        // 创建轨道路径并添加到轨道层中
        const orbitPath = createOrbitPath(config.orbit.semiMajorAxis, config.orbit.eccentricity, {
            name: config.id + 'Orbit',
            segment: 256,
            color: 0x888888,
            transparent: true,
            opacity: 0.6,
        })
        axis.add(orbitPath)
    }

    function update(needRevolution) {
        if (needRevolution) {
            orbitAngle.value += config.orbit.speed
            setOrbitalGroupPosition(root, orbitAngle, config.orbit.semiMajorAxis, config.orbit.eccentricity)
        }
        setSpinAutoRotation(spin, config.rotationSpeed)
    }

    function getPickableMeshes() {
        return pickableMeshes
    }

    return { config, axis, getPickableMeshes, init, update }
}