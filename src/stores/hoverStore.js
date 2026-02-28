import { defineStore } from 'pinia'

export const useHoverStore = defineStore('hover', {
    state: () => ({
        visible: false,
        planetId: null,
        screenX: 0,
        screenY: 0,
        labelRect: null,
        isLabelHover: false,
    }),
    actions: {
        show(planetId, x, y) {
            this.visible = true
            this.planetId = planetId
            this.screenX = x
            this.screenY = y
        },
        hide() {
            this.visible = false
            this.planetId = null
        },
        updatePosition(x, y) {
            this.screenX = x
            this.screenY = y
        },
        updateLabelRect(rect) {
            this.labelRect = rect
        },
    },
})
