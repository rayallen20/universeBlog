<template>
  <div
    class="panelWrap"
    :class="panelClasses"
    :hidden="isHidden"
    @transitionend="onTransitionEnd"
  >
    <div class="contentWrap">
      <!-- 短内容区 -->
      <div class="shortContentWrap">
        <h2>{{ planetName }}</h2>
        <div class="cutOffLine"></div>
        <p>{{ planetIntro }}</p>
      </div>

      <!-- 长内容区 -->
      <div class="longContentWrap">
        <ul class="flexWrap">
          <li v-for="(link, index) in planetLinks" :key="index" class="flexItem">
            <div class="leftTrapezoid"></div>
            <a :href="link.url || '#'">{{ link.text || '一些文字' }}</a>
          </li>
          <!-- Placeholder items when no links available -->
          <template v-if="planetLinks.length === 0">
            <li v-for="i in 8" :key="'placeholder-' + i" class="flexItem">
              <div class="leftTrapezoid"></div>
              <a href="#">一些文字</a>
            </li>
          </template>
        </ul>
      </div>

      <!-- 底部按钮区 -->
      <div class="buttonWrap">
        <button class="bottomButton" @click="onClose">See More</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useFocusStore } from '../stores/focusStore'
import { usePlanetStore } from '../stores/planetStore'

const focusStore = useFocusStore()
const planetStore = usePlanetStore()

const isHidden = ref(true)
const isOpen = ref(false)
const isClosing = ref(false)

const planet = computed(() => {
  if (!focusStore.planetId) return null
  return planetStore.getPlanetById(focusStore.planetId)
})

const planetName = computed(() => planet.value?.name ?? '')
const planetIntro = computed(() => planet.value?.intro ?? '')
const planetLinks = computed(() => planet.value?.links ?? [])

const panelClasses = computed(() => ({
  'is-open': isOpen.value,
  'is-closing': isClosing.value,
}))

// Watch focusStore.focused to drive panel open/close transitions
watch(() => focusStore.focused, (focused) => {
  if (focused) {
    // Open panel
    isHidden.value = false
    isClosing.value = false
    // Next frame to ensure transition triggers
    requestAnimationFrame(() => {
      isOpen.value = true
    })
  } else {
    // Close panel
    isOpen.value = false
    isClosing.value = true
  }
})

function onTransitionEnd(event) {
  if (event.propertyName !== 'transform') return
  if (isClosing.value) {
    isHidden.value = true
    isClosing.value = false
  }
}

function onClose() {
  focusStore.requestClear()
}
</script>

<style scoped>
.panelWrap {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 40;

    transform: translateX(-100%);
    opacity: 0;
    pointer-events: none;
    transition: transform 0.6s ease, opacity 0.6s ease;
    will-change: transform, opacity;

    width: 60%;
    height: 100vh;
    background: linear-gradient(90deg, rgba(5, 9, 18, 0.90) 0%, rgba(5, 9, 18, 0.40) 49.98%, rgba(5, 9, 18, 0.90) 99.97%);
    padding: 149px 0 240px 132px;
}

.panelWrap.is-open {
    transform: translateX(0);
    opacity: 1;
    pointer-events: auto;
}

.panelWrap.is-closing {
    transform: translateX(-100%);
    opacity: 0;
    pointer-events: none;
}

.panelWrap[hidden] {
    display: block;
}

.contentWrap {
    width: 100%;
    height: 100%;
    color: #ffffff;
}

.panelWrap .buttonWrap {
    display: inline-block;
    bottom: 0;
    transition: 0.2s;
}

.panelWrap .buttonWrap:hover {
    filter: drop-shadow(0 0 20px #5BDCFF);
}

.contentWrap .shortContentWrap {
    width: 70%;
    margin-bottom: 70px;
}

.contentWrap .shortContentWrap h2 {
    margin-bottom: 16px;
    font-family: "Source Han Serif CN", serif;
    font-size: 40px;
    font-style: normal;
    font-weight: 900;
    line-height: 40px;
    letter-spacing: 2px;
}

.contentWrap .shortContentWrap .cutOffLine {
    margin-bottom: 16px;
    width: 60px;
    height: 3px;
    background: var(--border);
    clip-path: polygon(
            6px 0,
            60px 0,
            54px 3px,
            0 3px
    );
}

.contentWrap .shortContentWrap p {
    max-height: 160px;
    overflow: hidden;
    font-family: "Source Han Serif CN", serif;
    font-size: 18px;
    font-style: normal;
    font-weight: 400;
    line-height: 32px;
    letter-spacing: 1px;
}

.contentWrap .longContentWrap {
    width: 100%;
    height: 306px;
    margin-bottom: 40px;
}

.contentWrap .longContentWrap .flexWrap {
    width: 100%;
    height: 100%;
    --gap: 70px;
    display: flex;
    justify-content: space-between;
    align-content: space-between;
    flex-wrap: wrap;
}

.contentWrap .longContentWrap .flexWrap .flexItem {
    display: flex;
    column-gap: 16px;
    flex: 0 0 calc((100% - var(--gap)) / 2);
}

@media (max-width: 768px) {
    .contentWrap .longContentWrap .flexWrap .flexItem {
        flex-basis: 100%;
    }
}

.contentWrap .longContentWrap .flexWrap .flexItem a {
    font-family: "Source Han Serif CN", serif;
    font-size: 24px;
    font-style: normal;
    font-weight: 700;
    line-height: 33px;
    letter-spacing: 1px;
    transition: 0.2s;
}

.contentWrap .longContentWrap .flexWrap .flexItem a:hover {
    color: #51EEFF;
}
</style>
