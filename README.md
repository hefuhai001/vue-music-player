<div align="center">

# @hefuhai001/vue-music-player

可换肤的 Vue 3 音频播放器组件。四套内置风格，支持全屏播放、LRC 歌词与实时频谱，除 `vue` 外零运行时依赖。

简体中文 | [English](https://github.com/hefuhai001/vue-music-player/blob/master/README.en.md)

[![npm](https://img.shields.io/npm/v/@hefuhai001/vue-music-player.svg)](https://www.npmjs.com/package/@hefuhai001/vue-music-player)
[![license](https://img.shields.io/npm/l/@hefuhai001/vue-music-player.svg)](./LICENSE)
[![vue](https://img.shields.io/badge/vue-3.3%2B-42b883.svg)](https://vuejs.org)
[![size](https://img.shields.io/badge/gzip-10.9%20KB%20JS%20%2B%206.6%20KB%20CSS-blue.svg)](#)

[GitHub](https://github.com/hefuhai001/vue-music-player) · [Gitee](https://gitee.com/hefuhai001/vue-music-player) · [Issues](https://github.com/hefuhai001/vue-music-player/issues)

</div>

---

## 安装

```bash
npm install @hefuhai001/vue-music-player
```

要求 Vue `>= 3.3`。

## 快速开始

```vue
<script setup lang="ts">
import { MusicPlayer, type Track } from '@hefuhai001/vue-music-player'
import '@hefuhai001/vue-music-player/style.css'

const tracks: Track[] = [
  {
    id: 1,
    title: 'Midnight Static',
    artist: 'SoundHelix',
    album: 'Signal / Noise',
    src: '/audio/1.mp3',
    cover: '/cover/1.jpg',
    lyric: '[00:12.00]第一句歌词\n[00:17.50]第二句歌词',
  },
  { id: 2, title: 'Amber Room', artist: 'SoundHelix', src: '/audio/2.mp3' },
]
</script>

<template>
  <MusicPlayer :tracks="tracks" variant="modern" @play="onPlay" @change="onChange" />
</template>
```

样式文件必须引入一次。也可以全局注册：

```ts
import { createApp } from 'vue'
import { VueMusicPlayer } from '@hefuhai001/vue-music-player'
import '@hefuhai001/vue-music-player/style.css'

createApp(App).use(VueMusicPlayer).mount('#app')
// 之后可直接使用 <MusicPlayer /> / <PlayerSlider /> / <PlayerPlaylist /> / <PlayerFullscreen />
```

## 四种风格

| `variant` | 视觉语言 | 关键特征 |
| --- | --- | --- |
| `modern` | 现代玻璃拟态 | 冷色渐变光、大圆角、圆角方形封面、渐变悬浮播放键 |
| `retro` | 复古 70s 唱片 | 奶油纸张纹理、墨色描边、硬投影、机械按压按键、磁带式条纹进度条 |
| `minimal` | 极简 | 纯白纸面、发丝分隔线、1px 进度轨、描边圆播放键 |
| `electronic` | 电子 HUD | 纯黑网格、霓虹青发光、扫描线、切角播放键、等宽全大写 |

```vue
<MusicPlayer :tracks="tracks" variant="retro" show-playlist />
```

四套皮肤共用同一份 DOM，切换不产生额外 JS；同一 `variant` 会同步作用于全屏视图。

## 全屏、歌词与频谱

卡片右上角的按钮进入全屏，全屏视图包含大封面、LRC 歌词逐行高亮、频谱律动和完整控制。

- 歌词通过 `Track.lyric` 传入标准 LRC 文本，支持一行多个时间标签，自动忽略 `[ar:]` / `[ti:]` 等元信息。
- 只有所有曲目都是同源 / `blob:` / `data:` / `file:` 音源时才会接入 Web Audio 分析，避免跨域音源被浏览器静音；条件不满足时自动降级为 CSS 律动。

## API

### Props

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `tracks` | `Track[]` | 必填 | 播放列表 |
| `variant` | `'modern' \| 'retro' \| 'minimal' \| 'electronic'` | `'modern'` | 视觉风格 |
| `autoplay` | `boolean` | `false` | 首次加载后自动播放（可能被浏览器策略拦截） |
| `volume` | `number` | `0.8` | 初始音量，`0 ~ 1` |
| `muted` | `boolean` | `false` | 初始静音 |
| `loop` | `'list' \| 'single' \| 'none'` | `'list'` | 列表循环 / 单曲循环 / 不循环 |
| `showPlaylist` | `boolean` | `false` | 初始是否展开播放列表 |
| `label` | `string` | `'Now playing'` | 顶部小标题 |
| `accent` | `string` | — | 强调色，等价于覆盖 `--mp-accent` |

### Track

```ts
interface Track {
  id: string | number
  title: string
  artist?: string
  album?: string
  /** 音频地址，浏览器可解码的格式均可 */
  src: string
  cover?: string
  /** 已知时长（秒），缺省时读取音频元数据 */
  duration?: number
  /** LRC 歌词文本 */
  lyric?: string
}
```

### 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `play` / `pause` / `ended` | — | 播放状态变化 |
| `change` | `(track, index)` | 切换曲目 |
| `timeupdate` | `(currentTime, duration)` | 播放进度推进 |
| `error` | `(message)` | 加载或播放失败 |

### 实例方法

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { MusicPlayer } from '@hefuhai001/vue-music-player'

const player = ref<InstanceType<typeof MusicPlayer> | null>(null)
</script>

<template>
  <MusicPlayer ref="player" :tracks="tracks" />
  <button @click="player?.toggleFullscreen()">全屏</button>
</template>
```

| 成员 | 说明 |
| --- | --- |
| `play()` / `pause()` / `toggle()` | 播放控制 |
| `next()` / `prev()` | 上/下一首（播放超过 3 秒时 `prev` 为重播当前曲） |
| `seek(seconds)` | 跳转到指定秒数 |
| `selectTrack(index)` | 切换并播放指定曲目 |
| `setVolume(0 ~ 1)` / `toggleMute()` | 音量控制 |
| `setLoopMode(mode)` / `cycleLoopMode()` | 循环模式 |
| `enterFullscreen()` / `exitFullscreen()` / `toggleFullscreen()` | 全屏播放 |
| `audioEl` | 原生 `HTMLAudioElement`，可用于自定义可视化 |
| `playing` / `currentTime` / `duration` / `currentTrack` / `currentIndex` / `fullscreenOpen` | 只读响应式状态 |

## 组合式 API

不想用内置 UI，可以只用播放内核：

```vue
<script setup lang="ts">
import { useAudioPlayer } from '@hefuhai001/vue-music-player'

const { playing, currentTime, duration, progress, toggle, next, seek } = useAudioPlayer({
  playlist: () => tracks,
  loop: 'list',
  onEnded: () => console.log('ended'),
})
</script>
```

其他可用导出：

| 导出 | 说明 |
| --- | --- |
| `PlayerSlider` / `PlayerPlaylist` / `PlayerFullscreen` | 独立可用的 UI 部件 |
| `useAudioAnalyser(audioEl, options)` | Web Audio 频谱分析链路 |
| `isAnalysableSource(src)` | 判断音源能否安全接入 Web Audio |
| `parseLyric(lrc)` / `findLyricIndex(lines, time)` | LRC 解析与当前行查找 |
| `VueMusicPlayer` | 全局注册插件 |

## 主题定制

所有视觉参数都是 CSS 变量，在任意祖先节点覆盖即可：

```css
.my-layout {
  --mp-accent: #d94f2b;
  --mp-radius: 12px;
  --mp-font-display: 'Songti SC', serif;
}
```

| 变量 | 用途 |
| --- | --- |
| `--mp-accent` / `--mp-on-accent` / `--mp-accent-weak` / `--mp-glow` | 强调色及其衍生态 |
| `--mp-bg` / `--mp-text` / `--mp-dim` / `--mp-dim-2` | 背景与三级文字 |
| `--mp-line` / `--mp-track` / `--mp-buffer` / `--mp-hover` | 描边、轨道、缓冲、hover |
| `--mp-shadow` / `--mp-radius` / `--mp-pad` | 阴影、圆角、内边距 |
| `--mp-font` / `--mp-font-display` / `--mp-font-mono` | 正文、标题、数字字体 |
| `--mp-danger` | 错误提示色 |

## 浏览器兼容

- Chrome / Edge 88+、Firefox 78+、Safari 14+（需 CSS 变量、Pointer Events、`HTMLAudioElement`）。
- 全屏依赖 Fullscreen API，不支持或被拒绝时退化为整页覆盖层；频谱不可用时降级为 CSS 动画。
- 构建产物语法目标为 `ES2019`，不含 polyfill；音频格式取决于浏览器支持，建议提供 mp3 兜底。

## 相关链接

- 本地开发、目录结构、发布流程 → [CONTRIBUTING.md](https://github.com/hefuhai001/vue-music-player/blob/master/CONTRIBUTING.md)
- 问题反馈 → [GitHub Issues](https://github.com/hefuhai001/vue-music-player/issues) / [Gitee Issues](https://gitee.com/hefuhai001/vue-music-player/issues)

## License

[MIT](./LICENSE) © hefuhai001
