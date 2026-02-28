import {PLANET_CONFIGS} from './planetConfigs'
import {createPlanet} from './createPlanet'

/**
 * 所有行星实例
 */
export const planets = PLANET_CONFIGS.map(config => createPlanet(config))

/**
 * 获取外行星列表（木星、土星、天王星、海王星）
 */
export function getOuterPlanets() {
    return planets.filter(p => p.config.isOuter)
}

/**
 * 获取所有行星的可拾取网格
 */
export function getAllPickableMeshes() {
    return planets.flatMap(p => p.getPickableMeshes())
}