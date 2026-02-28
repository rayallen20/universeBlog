import * as THREE from 'three'

/**
 * 本常量用于定义坐标轴辅助线的相关配置
 * @type {Object}
 * */
const config = {
    // 坐标轴辅助线的长度
    size: 50,
    // 坐标轴辅助线对象的名称
    name: 'axesHelper',
}

/**
 * 本常量用于定义坐标轴辅助线实例
 * @type {THREE.AxesHelper}
 * */
export const axesHelper = new THREE.AxesHelper(config.size)
axesHelper.name = config.name
