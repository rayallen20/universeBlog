import * as THREE from 'three';
import {calcOrbitalGroupPosition} from "./position";

/**
 * 本函数用于设置行星公转组的位置
 * @param {THREE.Group} model 行星公转组
 * @param {Object} angle 行星在轨道上的角度位置 (单位: 角度)
 * @param {number} semiMajorAxis 行星轨道的半长轴长度
 * @param {number} eccentricity 行星轨道的离心率
 * @return {void}
 * */
export function setOrbitalGroupPosition(model, angle, semiMajorAxis, eccentricity) {
    if (angle.value >= Math.PI * 2) {
        angle.value = 0
    }

    const position = calcOrbitalGroupPosition(angle.value, semiMajorAxis, eccentricity)
    model.position.set(position.x, 0, position.z)
}