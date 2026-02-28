import * as THREE from 'three';

/**
 * 本函数用于初始化行星公转组的位置
 * @param {THREE.Group} model 行星模型所在的组
 * @param {number} angle 行星在轨道上的角度位置 (单位: 角度)
 * @param {number} semiMajorAxis 行星轨道的半长轴长度
 * @param {number} eccentricity 行星轨道的离心率
 * @return {void}
 * */
export function initOrbitalGroupPosition(model, angle, semiMajorAxis, eccentricity) {
    const position = calcOrbitalGroupPosition(angle, semiMajorAxis, eccentricity)
    model.position.set(position.x, 0, position.z)
}

/**
 * 本函数用于计算行星公转组在轨道上的位置坐标
 * @param {number} angle 行星在轨道上的角度位置 (单位: 角度)
 * @param {number} semiMajorAxis 行星轨道的半长轴长度
 * @param {number} eccentricity 行星轨道的离心率
 * @return {{x: number, z: number}} 返回行星在轨道上的位置坐标
 * */
export function calcOrbitalGroupPosition(angle, semiMajorAxis, eccentricity) {
    const b = semiMajorAxis * Math.sqrt(1 - eccentricity * eccentricity)

    const x = semiMajorAxis * (Math.cos(angle) - eccentricity)
    const z = b * Math.sin(angle)

    return {x, z}
}
