# @xiaohe/vue-music-player

一个零运行时依赖（除 `vue`）的 Vue 3 音频播放器组件：黑胶唱片视觉、双主题、自绘进度/音量滑块、播放列表、完整 TS 类型。

## 安装

```bash
npm install @xiaohe/vue-music-player
```

> 发布前请先把 `package.json` 里的 `name` 改成你自己的包名（例如 `@你的scope/vue-music-player`）。

## 使用

### 按需引入

```vue
<script setup lang="ts">
import { MusicPlayer, type Track } from '@xiaohe/vue-music-player'
import '@xiaohe/vue-music-player/style.css'

const tracks: Track[] = [
  {
    id: 1,
    title: 'Midnight Static',
    artist: 'SoundHelix',
    album: 'Signal / Noise',
    src: '/audio/1.mp3',
    cover: '/cover/1.jpg',
  },
]
</script>

<template>
  <MusicPlayer :tracks="tracks" @play="onPlay" @change="onChange" />
</template>
```

### 全局注册

```ts
import { createApp } from 'vue'
import { VueMusicPlayer } from '@xiaohe/vue-music-player'
import '@xiaohe/vue-music-player/style.css'

createApp(App).use(VueMusicPlayer).mount('#app')
// 模板中可直接使用 <MusicPlayer />
```

## Props

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `tracks` | `Track[]` | 必填 | 播放列表 |
| `autoplay` | `boolean` | `false` | 首次加载后自动播放（受浏览器策略限制） |
| `volume` | `number` | `0.8` | 初始音量，0 ~ 1 |
| `muted` | `boolean` | `false` | 初始静音 |
| `loop` | `'list' \| 'single' \| 'none'` | `'list'` | 循环模式 |
| `showPlaylist` | `boolean` | `false` | 是否默认展开列表 |
| `variant` | `'modern' \| 'retro' \| 'minimal' \| 'electronic'` | `'modern'` | 视觉风格 |
| `label` | `string` | `'Now playing'` | 顶部小标题 |
| `accent` | `string` | — | 强调色，等价于覆盖 `--mp-accent` |

`Track`：

```ts
interface Track {
  id: string | number
  title: string
  artist?: string
  album?: string
  src: string
  cover?: string
  duration?: number // 秒，缺失时由音频元数据自动获取
}
```

## 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `play` / `pause` / `ended` | — | 播放状态变化 |
| `change` | `(track, index)` | 切换曲目 |
| `timeupdate` | `(currentTime, duration)` | 播放进度推进 |
| `error` | `(message)` | 音频加载/播放失败 |

## 实例方法

通过模板 ref 调用：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { MusicPlayer } from '@xiaohe/vue-music-player'

const player = ref<InstanceType<typeof MusicPlayer> | null>(null)
</script>

<template>
  <MusicPlayer ref="player" :tracks="tracks" />
</template>
```

| 方法 | 说明 |
| --- | --- |
| `play()` / `pause()` / `toggle()` | 播放控制 |
| `next()` / `prev()` | 上/下一首 |
| `seek(seconds)` | 跳转到指定秒 |
| `selectTrack(index)` | 切换并播放指定曲目 |
| `setVolume(0~1)` / `toggleMute()` | 音量控制 |
| `setLoopMode(mode)` / `cycleLoopMode()` | 循环模式 |
| `audioEl` | 原生 `HTMLAudioElement`，可用于可视化等高级用法 |

同时导出 `useAudioPlayer(options)` 组合式函数，可在自有 UI 里复用播放内核。

## 四种风格

| `variant` | 视觉语言 | 关键特征 |
| --- | --- | --- |
| `modern` | 现代玻璃拟态 | 冷色渐变光、28px 大圆角、圆角方形封面、蓝色渐变按钮、播放时外圈扩散 |
| `retro` | 复古 70s 唱片 | 奶油纸张纹理、2px 墨色描边、6px 硬投影、机械按键、磁带式条纹进度条、打字机数字 |
| `minimal` | 极简 | 纯白纸面、发丝分隔线、1px 进度条、描边圆形播放键、隐藏频谱条 |
| `electronic` | 电子 HUD | 纯黑网格、霓虹青、品红背光、扫描线、切角播放键、等宽全大写、闪烁光标 |

```vue
<MusicPlayer :tracks="tracks" variant="retro" />
<MusicPlayer :tracks="tracks" variant="electronic" show-playlist />
```

> 四套皮肤共用同一份 DOM 与播放内核，只通过 CSS 变量与皮肤类覆盖实现，切换不产生额外 JS。

## 主题定制

全部视觉参数都是 CSS 变量，在任意祖先节点覆盖即可（优先级高于皮肤默认值）：

```css
.my-layout {
  --mp-accent: #d94f2b;
  --mp-radius: 12px;
  --mp-font-display: 'Songti SC', serif;
  --mp-bg: #0f1115;
}
```

可用变量：`--mp-accent` `--mp-on-accent` `--mp-accent-weak` `--mp-bg` `--mp-text` `--mp-dim`
`--mp-dim-2` `--mp-line` `--mp-track` `--mp-buffer` `--mp-hover` `--mp-glow` `--mp-shadow`
`--mp-radius` `--mp-pad` `--mp-font` `--mp-font-display` `--mp-font-mono`。

## 本地开发

```bash
npm install
npm run dev       # 打开 playground（http://localhost:5173）
npm run build     # 产出 dist/（esm + cjs + d.ts + style.css）
npm run typecheck
```

## 发布

```bash
npm run build
npm publish --access public   # scoped 包需要 --access public
```

发布前修改 `package.json` 中的 `name`、`version`、`repository`、`author`。
