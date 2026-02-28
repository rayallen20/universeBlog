<template>
  <div
    ref="labelRef"
    class="labelWrap"
    :style="wrapStyle"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
  >
    <!-- 裁剪区域 -->
    <div class="labelShape">
      <!-- 边框层 -->
      <div class="borderLayer">
        <!-- 顶部线系统 -->
        <div class="topSystem">
          <svg class="topSvg" viewBox="0 0 426 17" preserveAspectRatio="none">
            <defs>
              <linearGradient id="bgGradTop" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="426" y2="0">
                <stop offset="0%" stop-color="rgb(5,9,18)" stop-opacity="0.90"/>
                <stop offset="49.98%" stop-color="rgb(5,9,18)" stop-opacity="0.40"/>
                <stop offset="99.97%" stop-color="rgb(5,9,18)" stop-opacity="0.90"/>
              </linearGradient>
              <linearGradient id="strokeGradTop" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="426" y2="0">
                <stop offset="0%" stop-color="#51BCFF" stop-opacity="1"/>
                <stop offset="49.98%" stop-color="#51BCFF" stop-opacity="0.1"/>
                <stop offset="99.97%" stop-color="#51BCFF" stop-opacity="1"/>
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="426" height="2" fill="url(#bgGradTop)" />
            <path d="M0 0.5 H60" stroke="url(#strokeGradTop)" stroke-width="1" fill="none" stroke-linecap="butt" shape-rendering="crispEdges" />
            <path d="M60 0.5 L76 16.5 H350 L366 0.5" stroke="url(#strokeGradTop)" stroke-width="1" fill="none" stroke-linecap="butt" shape-rendering="crispEdges" />
            <path d="M366 0.5 H426" stroke="url(#strokeGradTop)" stroke-width="1" fill="none" stroke-linecap="butt" shape-rendering="crispEdges" />
          </svg>
        </div>

        <!-- 底部线系统 -->
        <div class="bottomSystem">
          <svg class="bottomSvg" viewBox="0 0 426 17" preserveAspectRatio="none">
            <defs>
              <linearGradient id="bgGradBottom" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="426" y2="0">
                <stop offset="0%" stop-color="rgb(5,9,18)" stop-opacity="0.90"/>
                <stop offset="49.98%" stop-color="rgb(5,9,18)" stop-opacity="0.40"/>
                <stop offset="99.97%" stop-color="rgb(5,9,18)" stop-opacity="0.90"/>
              </linearGradient>
              <linearGradient id="strokeGradBottom" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="426" y2="0">
                <stop offset="0%" stop-color="#51BCFF" stop-opacity="1"/>
                <stop offset="49.98%" stop-color="#51BCFF" stop-opacity="0.1"/>
                <stop offset="99.97%" stop-color="#51BCFF" stop-opacity="1"/>
              </linearGradient>
            </defs>
            <rect x="0" y="15" width="426" height="2" fill="url(#bgGradBottom)" />
            <path d="M0 16.5 H60" stroke="url(#strokeGradBottom)" stroke-width="1" fill="none" stroke-linecap="butt" shape-rendering="crispEdges" />
            <path d="M60 16.5 L76 0.5 H140" stroke="url(#strokeGradBottom)" stroke-width="1" fill="none" stroke-linecap="butt" shape-rendering="crispEdges" />
            <path d="M286 0.5 H350 L366 16.5" stroke="url(#strokeGradBottom)" stroke-width="1" fill="none" stroke-linecap="butt" shape-rendering="crispEdges" />
            <path d="M366 16.5 H426" stroke="url(#strokeGradBottom)" stroke-width="1" fill="none" stroke-linecap="butt" shape-rendering="crispEdges" />
          </svg>
        </div>

        <!-- 左边框轨道区域 -->
        <div class="leftRail">
          <div class="seg leftTop"></div>
          <div class="seg leftMid"></div>
          <div class="seg leftBottom"></div>
        </div>
      </div>

      <!-- 内部装饰件层 -->
      <div class="innerDecorLayer">
        <div class="leftTrapezoid"></div>
      </div>
    </div>

    <!-- 外部装饰件层 -->
    <div class="outerDecorLayer">
      <div class="seg rectangle"></div>
      <div class="rightTrapezoid"></div>
      <div class="rightBar"></div>
      <div class="stripeChip"></div>
    </div>

    <!-- 内容层 -->
    <div class="contentLayer">
      <div class="content">
        <h2>{{ planetName }}</h2>
        <div class="cutOffLine"></div>
        <p>{{ planetIntro }}</p>
      </div>
      <div class="buttonWrap">
        <button class="bottomButton" @click="onSeeMore">See More</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { useHoverStore } from '../stores/hoverStore'
import { useFocusStore } from '../stores/focusStore'
import { usePlanetStore } from '../stores/planetStore'

const hoverStore = useHoverStore()
const focusStore = useFocusStore()
const planetStore = usePlanetStore()

const labelRef = ref(null)

const planet = computed(() => {
  if (!hoverStore.planetId) return null
  return planetStore.getPlanetById(hoverStore.planetId)
})

const planetName = computed(() => planet.value?.name ?? '')
const planetIntro = computed(() => planet.value?.intro ?? '')

const wrapStyle = computed(() => ({
  left: hoverStore.screenX + 'px',
  top: hoverStore.screenY + 'px',
  opacity: hoverStore.visible ? 1 : 0,
  visibility: hoverStore.visible ? 'visible' : 'hidden',
  pointerEvents: hoverStore.visible ? 'auto' : 'none',
}))

function onPointerEnter() {
  hoverStore.isLabelHover = true
}

function onPointerLeave() {
  hoverStore.isLabelHover = false
}

function onSeeMore() {
  if (!hoverStore.planetId) return
  focusStore.requestFocus(hoverStore.planetId)
  hoverStore.hide()
}

// Update labelRect whenever position or visibility changes
watch(
  () => [hoverStore.visible, hoverStore.screenX, hoverStore.screenY],
  async () => {
    await nextTick()
    if (labelRef.value && hoverStore.visible) {
      hoverStore.updateLabelRect(labelRef.value.getBoundingClientRect())
    }
  }
)
</script>

<style scoped>
.labelWrap {
    --wrap-width: var(--w);
    --wrap-height: var(--h);

    --notch-start-x: 60px;
    --notch-depth: 16px;
    --notch-run-x: 16px;
    --notch-horizontal-width: calc(var(--wrap-width) - var(--notch-start-x) * 2 - var(--notch-run-x) * 2);

    --btn-width: 146px;
    --btn-center-x: 213px;

    --leftRail-width: 3px;
    --leftRail-top-width: 3px;
    --leftRail-top-height: 162px;
    --leftRail-middle-width: 1px;
    --leftRail-middle-height: 53px;
    --leftRail-bottom-width: 3px;
    --leftRail-bottom-height: 71px;
}

.labelWrap {
    position: fixed;
    top: 0;
    left: 0;
    width: var(--wrap-width);
    height: var(--wrap-height);

    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition:
            opacity 0.5s linear,
            visibility 0.5s linear;

    --top-notch-left-diagonal-end-x: calc(var(--notch-start-x) + var(--notch-run-x));
    --top-notch-horizontal-end-x: calc(var(--notch-horizontal-width) + var(--top-notch-left-diagonal-end-x));
    --top-notch-right-diagonal-end-x: calc(var(--top-notch-horizontal-end-x) + var(--notch-run-x));

    --bottom-notch-right-diagonal-start-x: calc(var(--wrap-width) - var(--notch-start-x));
    --bottom-notch-right-diagonal-end-x: calc(var(--bottom-notch-right-diagonal-start-x) - var(--notch-run-x));
    --bottom-notch-right-diagonal-end-y: calc(var(--wrap-height) - var(--notch-depth));
    --bottom-notch-horizontal-end-x: calc(var(--bottom-notch-right-diagonal-end-x) - var(--notch-horizontal-width));
    --bottom-notch-left-diagonal-end-x: calc(var(--bottom-notch-horizontal-end-x) - var(--notch-run-x));

    --left-collapse-start-y: calc(var(--wrap-height) - var(--leftRail-bottom-height));
    --left-collapse-end-x: calc(var(--leftRail-width) - var(--leftRail-middle-width));
    --left-collapse-end-y: calc(var(--left-collapse-start-y) - var(--leftRail-middle-height));
}

.labelShape {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(90deg, rgba(5, 9, 18, 0.90) 0%, rgba(5, 9, 18, 0.40) 49.98%, rgba(5, 9, 18, 0.90) 99.97%);
    clip-path: polygon(
            0px 0px,
            var(--notch-start-x) 0px,
            var(--top-notch-left-diagonal-end-x) var(--notch-depth),
            var(--top-notch-horizontal-end-x) var(--notch-depth),
            var(--top-notch-right-diagonal-end-x) 0px,
            var(--wrap-width) 0px,
            var(--wrap-width) var(--wrap-height),
            var(--bottom-notch-right-diagonal-start-x) var(--wrap-height),
            var(--bottom-notch-right-diagonal-end-x) var(--bottom-notch-right-diagonal-end-y),
            var(--bottom-notch-horizontal-end-x) var(--bottom-notch-right-diagonal-end-y),
            var(--bottom-notch-left-diagonal-end-x) var(--wrap-height),
            0px var(--wrap-height),
            0px var(--left-collapse-start-y),
            var(--left-collapse-end-x) var(--left-collapse-start-y),
            var(--left-collapse-end-x) var(--left-collapse-end-y),
            0px var(--left-collapse-end-y),
            0px 0px
    );
}

.borderLayer {
    position: absolute;
    inset: 0;
    z-index: 10;
}

.seg {
    position: absolute;
    background: var(--border);
}

.borderLayer .topSystem {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 17px;
    pointer-events: none;
}

.borderLayer .topSvg {
    display: block;
    width: 100%;
    height: 100%;
}

.borderLayer .bottomSystem {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 17px;
    pointer-events: none;
}

.borderLayer .bottomSvg {
    display: block;
    width: 100%;
    height: 100%;
}

.borderLayer .leftRail {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: var(--leftRail-width);
}

.borderLayer .leftRail .leftTop {
    top: 0;
    left: 0;
    width: var(--leftRail-top-width);
    height: var(--leftRail-top-height);
}

.borderLayer .leftRail .leftMid {
    top: 162px;
    right: 0;
    width: var(--leftRail-middle-width);
    height: var(--leftRail-middle-height);
}

.borderLayer .leftRail .leftBottom {
    bottom: 0;
    left: 0;
    width: var(--leftRail-bottom-width);
    height: var(--leftRail-bottom-height);
}

.innerDecorLayer {
    position: absolute;
    inset: 0;
    z-index: 20;
}

.innerDecorLayer .leftTrapezoid {
    position: absolute;
    top: 26px;
    left: 3px;
}

.outerDecorLayer {
    position: absolute;
    inset: 0;
    z-index: 20;
}

.outerDecorLayer .rectangle {
    top: calc(var(--leftRail-top-height) + 1px);
    left: -3px;
    width: 4px;
    height: 7px;
}

.outerDecorLayer .rightTrapezoid {
    position: absolute;
    background: var(--border);
    top: 0;
    right: -14px;
    width: 14px;
    height: 123px;
    clip-path: polygon(
            0px 0px,
            14px 15px,
            14px 108px,
            0px 123px
    );
}

.outerDecorLayer .rightBar {
    position: absolute;
    background: var(--border);
    top: 110px;
    right: -6px;
    bottom: 0;
    width: 6px;
}

.outerDecorLayer .stripeChip {
    position: absolute;
    top: 8px;
    right: 80px;
    width: 90px;
    height: 6px;
    background: repeating-linear-gradient(
            -40deg,
            transparent 0,
            transparent 1.2px,
            var(--border) 1.2px,
            var(--border) 9.64px
    );
}

.contentLayer {
    position: absolute;
    inset: 0;
    z-index: 30;
}

.contentLayer .content {
    position: absolute;
    width: 383px;
    height: 200px;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    color: #ffffff;
}

.contentLayer .content h2 {
    margin-bottom: 10px;
    font-family: "Source Han Serif CN", serif;
    font-size: 20px;
    font-style: normal;
    font-weight: 900;
    line-height: 20px;
    letter-spacing: 1px;
}

.contentLayer .content .cutOffLine {
    margin-bottom: 10px;
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

.contentLayer .content p {
    width: 100%;
    height: 154px;
    font-family: "Source Han Serif CN", serif;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 22px;
    letter-spacing: 1px;
}

.contentLayer .buttonWrap {
    display: inline-block;
    position: absolute;
    left: calc(var(--btn-center-x) - var(--btn-width) / 2);
    bottom: 0;
    transition: 0.2s;
}

.contentLayer .buttonWrap:hover {
    filter: drop-shadow(0 0 20px #5BDCFF);
}
</style>
