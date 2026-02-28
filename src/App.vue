<template>
  <ThreeCanvas />
  <div id="overlay">
    <HoverLabel />
    <FocusPanel />
  </div>
</template>

<script setup>
import ThreeCanvas from './components/ThreeCanvas.vue'
import HoverLabel from './components/HoverLabel.vue'
import FocusPanel from './components/FocusPanel.vue'

import '../assets/css/reset.css'
import '../assets/css/font.css'
import '../assets/css/index.css'
import '../assets/css/common/bottomButton.css'
import '../assets/css/common/leftTrapezoid.css'
</script>
