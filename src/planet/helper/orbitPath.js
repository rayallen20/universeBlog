import * as THREE from 'three';
import {calcOrbitalGroupPosition} from "./position";

/**
 * 本函数用于创建行星轨道路径
 * @param {number} semiMajorAxis 行星轨道的半长轴长度
 * @param {number} eccentricity 行星轨道的离心率
 * @param {Object} config 轨道路径的配置参数
 * @return {THREE.LineLoop} 创建的轨道路径对象
 * */
export function createOrbitPath(semiMajorAxis, eccentricity, config) {
    const points = []

    for (let i = 0; i < config.segment; i++) {
        const angle = (i / config.segment) * Math.PI * 2
        const position = calcOrbitalGroupPosition(angle, semiMajorAxis, eccentricity)
        const x = position.x
        const z = position.z
        points.push(new THREE.Vector3(x, 0, z))
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({
        color: config.color,
        opacity: config.opacity,
        transparent: config.transparent
    })

    if (material.transparent) {
        material.opacity = config.opacity
    }

    const orbit = new THREE.LineLoop(geometry, material)
    orbit.name = config.name

    return orbit
}