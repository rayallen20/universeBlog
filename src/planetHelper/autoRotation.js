import * as THREE from 'three';

/**
 * 本函数用于设置行星自转组的自转
 * @param {THREE.Group} model 行星自转组
 * @param {number} speed 自转速度 (单位: 角度)
 * @return {void}
 * */
export function setSpinAutoRotation(model, speed) {
    if (model.rotation.y >= Math.PI * 2) {
        model.rotation.y = 0
    }

    model.rotation.y += speed
}