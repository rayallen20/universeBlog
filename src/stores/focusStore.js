import { defineStore } from 'pinia'

export const useFocusStore = defineStore('focus', {
    state: () => ({
        focused: false,
        planetId: null,
        pendingFocusId: null,
        pendingClear: false,
    }),
    actions: {
        requestFocus(planetId) {
            this.pendingFocusId = planetId
        },
        requestClear() {
            this.pendingClear = true
        },
        setFocused(planetId) {
            this.focused = true
            this.planetId = planetId
            this.pendingFocusId = null
        },
        clearFocused() {
            this.focused = false
            this.planetId = null
            this.pendingClear = false
        },
        consumeFocusRequest() {
            const id = this.pendingFocusId
            this.pendingFocusId = null
            return id
        },
        consumeClearRequest() {
            this.pendingClear = false
        },
    },
})
