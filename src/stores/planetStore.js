import { defineStore } from 'pinia'
import { PLANET_CONFIGS } from '../planet/planetConfigs'
import { config as sunConfig } from '../sun'

export const usePlanetStore = defineStore('planet', {
    state: () => ({
        planets: [],
        loaded: false,
    }),
    getters: {
        getPlanetById: (state) => (id) => state.planets.find(p => p.id === id),
    },
    actions: {
        async fetchPlanets() {
            // Simulate API call - currently returns hardcoded data from existing configs
            const sunData = {
                id: 'sun',
                name: sunConfig.label.name,
                intro: sunConfig.label.intro,
                links: [],
                threeConfig: {
                    groupName: sunConfig.groupName,
                    axisName: sunConfig.axisName,
                    path: sunConfig.path,
                    scale: sunConfig.scale.size,
                    emissive: sunConfig.emissive,
                    autoRotation: sunConfig.autoRotation,
                    light: sunConfig.light,
                    position: { x: 0, y: 0, z: 0 },
                    label: sunConfig.label,
                },
            }

            const planetData = PLANET_CONFIGS.map(cfg => ({
                id: cfg.id,
                name: cfg.label.name,
                intro: cfg.label.intro,
                links: [],
                threeConfig: {
                    groupName: cfg.groupName,
                    axisName: cfg.axisName,
                    spinName: cfg.spinName,
                    path: cfg.path,
                    scale: cfg.scale,
                    rotationSpeed: cfg.rotationSpeed,
                    orbit: { ...cfg.orbit },
                    label: { ...cfg.label },
                    isOuter: cfg.isOuter,
                },
            }))

            this.planets = [sunData, ...planetData]
            this.loaded = true
        },
    },
})
