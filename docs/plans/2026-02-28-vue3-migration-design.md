# Vue 3 迁移设计文档

## 1. 目标

将当前 `onlyWebpack` 分支上纯 JS + DOM 操作的太阳系可视化项目，迁移为 Vue 3 驱动的架构。在 `main` 分支上实施。

## 2. 设计决策记录

|         决策项          |                       结论                       |
|:--------------------:|:----------------------------------------------:|
| Three.js 与 Vue 的职责边界 |  Three.js 负责 canvas 渲染 + 交互逻辑；Vue 负责所有 DOM UI  |
|         状态管理         |                     Pinia                      |
|         构建工具         |          继续使用 Webpack 5，添加 vue-loader          |
|   HoverLabel 子组件拆分   |                     不拆，单组件                     |
|   FocusPanel 子组件拆分   |                     不拆，单组件                     |
| Three.js ↔ Vue 通信方式  |               Pinia store 作为中间层                |
|        行星数据来源        |           后端 API（包括 3D 配置和 UI 展示数据）            |
|       行星展示数据管理       | planetStore 存 API 数据，hover/focus store 只传行星 ID |

## 3. 组件架构

### 3.1 组件树

```
App.vue                      ← 布局容器
├── ThreeCanvas.vue           ← canvas 挂载点
├── HoverLabel.vue            ← 悬停标签（边框 + 装饰 + 内容 合为一体）
└── FocusPanel.vue            ← 聚焦面板（摘要 + 链接列表 合为一体）
```

### 3.2 各组件职责

#### App.vue

- 挂载 `<div id="overlay">` 作为 UI 层容器（pointer-events: none）
- 包含 `<ThreeCanvas />`、`<HoverLabel />`、`<FocusPanel />` 三个子组件
- 不处理任何业务逻辑

#### ThreeCanvas.vue

- 提供一个 `<div ref="container">` 作为 canvas 挂载点
- 在 `onMounted` 中初始化 Three.js：
  - 等待 `planetStore` 数据就绪
  - 创建 renderer、camera、scene、controls
  - 根据 `planetStore` 中的配置加载行星
  - 初始化交互系统（hover、focus）
  - 启动 animate 循环
- 在 `onBeforeUnmount` 中清理 Three.js 资源（renderer.dispose 等）
- 监听 window resize 并更新渲染器/相机

#### HoverLabel.vue

- 从 `hoverStore` 读取：是否显示、屏幕位置 (x, y)
- 从 `planetStore` 按行星 ID 读取：名称、简介
- 通过 `ref` 获取自身 DOM 元素，将 `getBoundingClientRect()` 回写到 `hoverStore.labelRect`（供 Three.js hover 状态机做 label 阶段的距离判断）
- "See More" 按钮点击时调用 `focusStore.requestFocus(planetId)`
- 包含所有边框/装饰/内容的模板和 scoped 样式

#### FocusPanel.vue

- 从 `focusStore` 读取：是否显示
- 从 `planetStore` 按行星 ID 读取：名称、简介、链接列表
- 管理自身的进入/退出 CSS 过渡动画（slide + fade）
- 关闭按钮点击时调用 `focusStore.requestClear()`

## 4. 状态管理（Pinia Stores）

### 4.1 Store 总览

```
stores/
├── planetStore.js     ← API 数据：行星列表、3D 配置、UI 展示文本
├── hoverStore.js      ← hover 交互状态（Three.js ↔ Vue 桥梁）
└── focusStore.js      ← focus 交互状态（Three.js ↔ Vue 桥梁）
```

### 4.2 planetStore

```js
state: {
  planets: [],          // API 返回的行星数据数组
  loaded: false,        // 数据是否已加载
}

// 每个 planet 对象的结构（由 API 定义，此处为预期字段）:
// {
//   id: 'earth',
//   name: '地球',
//   intro: '太阳系第三颗行星...',
//   links: [{ title: '...', url: '...' }, ...],
//   threeConfig: {
//     gltfPath: 'assets/earth/scene.gltf',
//     scale: 1,
//     orbit: { semiMajorAxis, eccentricity, dipAngle, speed },
//     rotationSpeed: 0.01,
//     isOuter: false
//   }
// }

getters: {
  getPlanetById: (state) => (id) => state.planets.find(p => p.id === id)
}

actions: {
  async fetchPlanets()   // 调用后端 API，填充 planets 数组
}
```

### 4.3 hoverStore

```js
state: {
  visible: false,        // 标签是否显示
  planetId: null,        // 当前悬停的行星 ID
  screenX: 0,           // 标签在屏幕上的 X 坐标（px）
  screenY: 0,           // 标签在屏幕上的 Y 坐标（px）
  labelRect: null,       // Vue 组件回写的 DOMRect（供 Three.js 读取）
}

actions: {
  // Three.js 调用：
  show(planetId, x, y)
  hide()
  updatePosition(x, y)

  // Vue 组件调用：
  updateLabelRect(rect)
}
```

### 4.4 focusStore

```js
state: {
  focused: false,        // 是否处于聚焦状态
  planetId: null,        // 聚焦的行星 ID
}

actions: {
  // Vue 组件调用（HoverLabel "See More" 按钮）：
  requestFocus(planetId)

  // Vue 组件调用（FocusPanel 关闭按钮）：
  requestClear()

  // Three.js 调用（动画完成后更新状态）：
  setFocused(planetId)
  clearFocused()
}
```

## 5. 数据流

### 5.1 总体数据流图

```
┌──────────────┐    fetchPlanets()     ┌──────────────┐
│   后端 API   │ ───────────────────→  │  planetStore  │
└──────────────┘                       └──────┬───────┘
                                              │
                              ┌───────────────┼───────────────┐
                              │               │               │
                              ▼               ▼               ▼
                       ThreeCanvas.vue  HoverLabel.vue  FocusPanel.vue
                       (读取 threeConfig) (读取 name 等)  (读取详情)
```

### 5.2 Hover 交互流

```
 Three.js hover 状态机                hoverStore              HoverLabel.vue
         │                               │                         │
         │  show(planetId, x, y)         │                         │
         │ ─────────────────────────→    │                         │
         │                               │   watch visible/pos     │
         │                               │ ──────────────────→     │
         │                               │                         │
         │                               │   updateLabelRect()     │
         │                               │ ←──────────────────     │
         │  读取 labelRect 做距离判断     │                         │
         │ ←─────────────────────────    │                         │
```

### 5.3 Focus 交互流

```
 HoverLabel.vue          focusStore           Three.js focus 系统      FocusPanel.vue
      │                      │                        │                      │
      │  requestFocus(id)    │                        │                      │
      │ ───────────────→     │                        │                      │
      │                      │   watch requestFocus   │                      │
      │                      │ ──────────────────→    │                      │
      │                      │                        │ 执行相机动画          │
      │                      │   setFocused(id)       │                      │
      │                      │ ←──────────────────    │                      │
      │                      │                        │                      │
      │                      │   watch focused        │                      │
      │                      │ ──────────────────────────────────────→       │
      │                      │                        │         显示面板     │
```

### 5.4 初始化流程

```
1. Vue app 创建 & 挂载
2. App.vue mounted
3. ThreeCanvas.vue mounted
   3.1  await planetStore.fetchPlanets()      ← 请求 API
   3.2  创建 renderer, camera, scene, controls
   3.3  遍历 planetStore.planets，用 threeConfig 创建行星
   3.4  初始化 hover 状态机（传入 hoverStore 引用）
   3.5  初始化 focus 系统（传入 focusStore 引用）
   3.6  启动 animate()
```

## 6. Three.js 代码改动要点

### 6.1 保持不变的模块

| 模块 | 原因 |
|------|------|
| `base/renderer.js` | 纯 Three.js，不涉及 DOM UI |
| `base/camera.js` | 同上 |
| `base/scene.js` | 同上 |
| `base/raycaster.js` | 同上 |
| `planet/createPlanet.js` | 工厂函数，改为接收 API 配置即可 |
| `planet/helper/*` | 纯计算函数 |
| `sun.js` | 纯 Three.js |
| `skySphere.js` | 纯 Three.js |
| `lib/*` | 工具函数 |

### 6.2 需要修改的模块

| 模块 | 改动内容 |
|------|---------|
| `interaction/hover.js` | 删除所有 DOM 操作（showLabel/hiddenLabel）；改为调用 `hoverStore.show()`/`.hide()`/`.updatePosition()`；从 `hoverStore.labelRect` 读取 DOMRect 做距离判断 |
| `interaction/focus.js` | 删除 `showPanel()`/`hidePanel()` 的 DOM 操作；监听 `focusStore.requestFocus` 触发相机动画；动画完成后调用 `focusStore.setFocused()` |
| `planet/planetConfigs.js` | 删除硬编码配置；改为从 `planetStore.planets` 读取 `threeConfig` |

### 6.3 删除的模块

| 模块 | 原因 |
|------|------|
| `ui/label/label.js` | 被 HoverLabel.vue 替代 |
| `ui/label/calcOffset.js` | 移入 hover 状态机或 HoverLabel.vue（视偏移计算逻辑归属而定） |
| `ui/panel.js` | 被 FocusPanel.vue 替代 |

## 7. 目录结构（迁移后）

```
src/
├── main.js                    ← Vue 应用入口（createApp + createPinia）
├── App.vue                    ← 布局容器
├── components/
│   ├── ThreeCanvas.vue        ← canvas 挂载点 + Three.js 生命周期
│   ├── HoverLabel.vue         ← 悬停标签
│   └── FocusPanel.vue         ← 聚焦面板
├── stores/
│   ├── planetStore.js         ← 行星 API 数据
│   ├── hoverStore.js          ← hover 状态桥梁
│   └── focusStore.js          ← focus 状态桥梁
├── three/                     ← Three.js 相关（从原 src/ 重组）
│   ├── base/
│   │   ├── renderer.js
│   │   ├── camera.js
│   │   ├── scene.js
│   │   ├── controls.js
│   │   └── raycaster.js
│   ├── planet/
│   │   ├── createPlanet.js
│   │   ├── planets.js
│   │   └── helper/
│   │       ├── position.js
│   │       ├── revolution.js
│   │       ├── autoRotation.js
│   │       └── orbitPath.js
│   ├── sun.js
│   ├── skySphere.js
│   ├── interaction/
│   │   ├── hover.js
│   │   └── focus.js
│   └── lib/
│       ├── loadGLTF.js
│       ├── listMeshes.js
│       ├── centerModelToOrigin.js
│       ├── scaleModel.js
│       ├── setShadow.js
│       ├── findAncestorByName.js
│       ├── worldToScreen.js
│       ├── projection.js
│       └── pointer.js
├── styles/                    ← 全局样式
│   ├── reset.css
│   ├── font.css
│   └── index.css
└── assets/                    ← 静态资源（字体等）
```

> 注：行星/装饰相关的 CSS 文件（原 `assets/css/label/`、`assets/css/panel/`、`assets/css/common/`）将被迁入各自 Vue 组件的 `<style scoped>` 中。

## 8. Webpack 配置变更

在现有 Webpack 5 配置上添加：

- `vue-loader` + `@vue/compiler-sfc`：支持 `.vue` 单文件组件
- `VueLoaderPlugin`：Webpack 插件
- 入口改为 `src/main.js`
- `resolve.alias`：`'vue'` 指向 `vue/dist/vue.runtime.esm-bundler.js`
- HTML 模板简化：`public/index.html` 只保留 `<div id="app">`，删除 labelWrap/panelWrap 的静态 HTML

## 9. 需要注意的技术点

### 9.1 Three.js 对象不可被 Vue 响应式代理

Three.js 的 `Object3D`、`Mesh` 等对象如果被 Vue 的 `reactive()` 或 `ref()` 包装，会因为 Proxy 代理导致内部逻辑异常。

**解决方案**：在 store 中存储 Three.js 对象时使用 `markRaw()`，或只存储原始数据（ID、坐标数值），不存储 Three.js 对象引用。

### 9.2 Label 位置的逐帧更新

HoverLabel 的屏幕位置需要每帧更新（跟随行星移动）。Three.js 在 `animate()` 中计算出 screenX/screenY 后写入 `hoverStore`，Vue 组件通过 watch 或 computed 响应式更新样式。

**性能考虑**：Pinia 的 state 是 reactive 的，每帧写入会触发 Vue 的响应式更新。如果性能有问题，可以改用 `shallowRef` 或降低更新频率。

### 9.3 labelRect 的回写时机

HoverLabel 需要在 DOM 更新后将自己的 `getBoundingClientRect()` 回写到 `hoverStore`。应该在 `onUpdated` 或 `watchEffect` + `nextTick` 中执行，确保拿到的是最新的布局信息。