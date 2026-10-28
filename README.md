<div align="center">

# @hefuhai001/vue-music-player

一个可换肤的 Vue 3 音频播放器组件。内置 **现代 / 复古 / 简约 / 电子** 四套皮肤，支持全屏播放、LRC 歌词与实时频谱；播放内核与 UI 解耦，除 `vue` 外零运行时依赖。

简体中文 | [English](https://github.com/hefuhai001/vue-music-player/blob/main/README.en.md)

[![npm](https://img.shields.io/npm/v/@hefuhai001/vue-music-player.svg)](https://www.npmjs.com/package/@hefuhai001/vue-music-player)
[![license](https://img.shields.io/npm/l/@hefuhai001/vue-music-player.svg)](./LICENSE)
[![vue](https://img.shields.io/badge/vue-3.3%2B-42b883.svg)](https://vuejs.org)
[![size](https://img.shields.io/badge/gzip-10.9%20KB%20JS%20%2B%206.6%20KB%20CSS-blue.svg)](#)

[GitHub](https://github.com/hefuhai001/vue-music-player) · [Gitee](https://gitee.com/hefuhai001/vue-music-player) · [问题反馈](https://github.com/hefuhai001/vue-music-player/issues)

</div>

---

## 特性

- **四套内置皮肤**：`modern`（玻璃拟态）、`retro`（70s 唱片）、`minimal`（极简）、`electronic`（HUD 霓虹），共用同一份 DOM，切换不产生额外 JS。
- **全屏播放**：原生 Fullscreen API，不支持时自动退化为整页覆盖层；按 `Esc` 退出并同步状态。
- **LRC 歌词**：传入 `Track.lyric` 即可逐行高亮、自动滚动居中。
- **实时频谱**：全屏模式下用 Web Audio `AnalyserNode` 驱动频谱柱；跨域音源会自动降级为 CSS 律动，避免被浏览器静音。
- **内核可复用**：`useAudioPlayer()` 是纯逻辑组合式函数，可搭配完全自定义的 UI。
- **主题全开放**：颜色、字体、圆角、阴影全部是 `--mp-*` CSS 变量，可局部覆盖。
- **完整类型**：TypeScript 编写，随包输出 `.d.ts`。
- **双格式产物**：ESM + CJS，`vue` 作为 `peerDependencies` 保证单实例。
- **无障碍**：进度/音量滑块支持键盘（方向键 / Home / End）与 `aria-*` 属性。
- **SSR 友好**：音频元素在客户端惰性创建，`onBeforeUnmount` 自动解绑。
- **体积**：JS 41.9 KB（gzip 10.9 KB）+ CSS 31.1 KB（gzip 6.6 KB）。

## 安装

```bash
npm install @hefuhai001/vue-music-player
# 或
pnpm add @hefuhai001/vue-music-player
yarn add @hefuhai001/vue-music-player
```

要求：Vue `>= 3.3`。

## 快速开始

### 按需引入（推荐）

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

### 全局注册

```ts
import { createApp } from 'vue'
import { VueMusicPlayer } from '@hefuhai001/vue-music-player'
import '@hefuhai001/vue-music-player/style.css'

createApp(App).use(VueMusicPlayer).mount('#app')
// 之后模板中可直接使用 <MusicPlayer /> / <PlayerSlider /> / <PlayerPlaylist /> / <PlayerFullscreen />
```

> 样式文件必须引入一次，否则组件会缺少外观。

## 四种风格

| `variant` | 视觉语言 | 关键特征 |
| --- | --- | --- |
| `modern` | 现代玻璃拟态 | 冷色渐变光、28px 大圆角、圆角方形封面、渐变悬浮播放键、播放时外圈扩散 |
| `retro` | 复古 70s 唱片 | 奶油纸张纹理、2px 墨色描边、6px 硬投影、机械按压按键、磁带式条纹进度条 |
| `minimal` | 极简 | 纯白纸面、发丝分隔线、1px 进度轨、描边圆播放键 |
| `electronic` | 电子 HUD | 纯黑网格、霓虹青发光、扫描线、切角播放键、等宽全大写 |

```vue
<MusicPlayer :tracks="tracks" variant="modern" />
<MusicPlayer :tracks="tracks" variant="retro" show-playlist />
<MusicPlayer :tracks="tracks" variant="minimal" />
<MusicPlayer :tracks="tracks" variant="electronic" />
```

同一 `variant` 会同步作用于全屏视图，保证两种视图视觉一致。

## 全屏播放 · 歌词 · 频谱

卡片右上角的按钮进入全屏（`enterFullscreen()`），全屏视图包含：大封面、LRC 歌词逐行高亮、频谱律动、进度/音量控制。

```ts
const tracks: Track[] = [
  {
    id: 1,
    title: 'Midnight Static',
    artist: 'SoundHelix',
    src: '/audio/1.mp3',
    // 标准 LRC 文本：支持一行多个时间标签，自动忽略 [ar:]/[ti:] 等元信息
    lyric: '[00:12.00]第一句\n[00:17.50][01:20.00]副歌复用同一句',
  },
]
```

关于频谱：

- 只有当**所有**曲目都是同源 / `blob:` / `data:` / `file:` 音源时，才会接入 Web Audio 分析，避免跨域音源被浏览器静音。
- 条件不满足时自动降级为纯 CSS 律动动画，功能不受影响。
- 需要自行判断时可用导出的 `isAnalysableSource(src)`。

## API

### Props

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `tracks` | `Track[]` | 必填 | 播放列表 |
| `variant` | `'modern' \| 'retro' \| 'minimal' \| 'electronic'` | `'modern'` | 视觉风格 |
| `autoplay` | `boolean` | `false` | 首次加载后自动播放（可能被浏览器策略拦截） |
| `volume` | `number` | `0.8` | 初始音量，`0 ~ 1` |
| `muted` | `boolean` | `false` | 初始静音 |
| `loop` | `'list' \| 'single' \| 'none'` | `'list'` | 循环模式：列表循环 / 单曲循环 / 不循环 |
| `showPlaylist` | `boolean` | `false` | 初始是否展开播放列表（之后由组件内按钮控制） |
| `label` | `string` | `'Now playing'` | 顶部小标题 |
| `accent` | `string` | — | 强调色，等价于覆盖 `--mp-accent` |

### Track

```ts
interface Track {
  id: string | number
  title: string
  artist?: string
  album?: string
  /** 音频地址，支持 mp3 / aac / wav / flac 等浏览器可解码格式 */
  src: string
  cover?: string
  /** 已知时长（秒），缺省时由音频元数据自动获取 */
  duration?: number
  /** LRC 格式歌词文本，用于全屏模式逐行高亮 */
  lyric?: string
}
```

### 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `play` / `pause` / `ended` | — | 播放状态变化 |
| `change` | `(track: Track, index: number)` | 切换曲目 |
| `timeupdate` | `(currentTime: number, duration: number)` | 播放进度推进（约 4 次/秒） |
| `error` | `(message: string)` | 音频加载或播放失败 |

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
| `next()` / `prev()` | 上/下一首（`prev` 在播放超过 3 秒时为重播当前曲） |
| `seek(seconds)` | 跳转到指定秒数 |
| `selectTrack(index)` | 切换并播放指定曲目 |
| `setVolume(0 ~ 1)` / `toggleMute()` | 音量控制 |
| `setLoopMode(mode)` / `cycleLoopMode()` | 循环模式 |
| `enterFullscreen()` / `exitFullscreen()` / `toggleFullscreen()` | 全屏播放控制 |
| `audioEl` | 原生 `HTMLAudioElement`，可用于自定义可视化等高级用法 |
| `playing` / `currentTime` / `duration` / `currentTrack` / `currentIndex` / `fullscreenOpen` | 只读响应式状态 |

## 其他导出

| 导出 | 说明 |
| --- | --- |
| `PlayerSlider` | 无障碍滑块，可单独用于自定义播放器 |
| `PlayerPlaylist` | 播放列表 |
| `PlayerFullscreen` | 全屏视图，可独立使用（受控组件：`playing` / `currentTime` / `duration` 等由父级传入） |
| `useAudioPlayer(options)` | 播放内核 |
| `useAudioAnalyser(audioEl, options)` | Web Audio 频谱分析链路 |
| `isAnalysableSource(src)` | 判断音源能否安全接入 Web Audio |
| `parseLyric(lrc)` / `findLyricIndex(lines, time)` | LRC 解析与二分查找当前行 |
| `VueMusicPlayer` | 全局注册插件 |

## 复用播放内核

不想用内置 UI？直接使用 `useAudioPlayer`：

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

返回的状态与实例方法同名同义；组合式函数内部会创建独立的 `Audio` 实例，并在组件卸载时自动销毁。

## 主题定制

所有视觉参数都是 CSS 变量，在任意祖先节点覆盖即可（优先级高于皮肤默认值）：

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
| `--mp-font` / `--mp-font-display` / `--mp-font-mono` | 正文字体、标题字体、数字字体 |
| `--mp-danger` | 错误提示色 |

## 浏览器兼容

- 需要支持 CSS 变量、Pointer Events、`HTMLAudioElement` 的现代浏览器（Chrome / Edge 88+、Firefox 78+、Safari 14+）。
- 全屏依赖 Fullscreen API；浏览器拒绝或移动端不支持时自动退化为整页覆盖层。
- 频谱依赖 Web Audio API，不可用时降级为 CSS 动画。
- 构建产物语法目标为 `ES2019`，不含 polyfill。
- 音频能否播放取决于浏览器对该容器格式的支持，建议提供 mp3 作为兜底。

## 本地开发

```bash
npm install
npm run dev        # 启动 playground：http://localhost:5173
npm run typecheck  # 类型检查
npm run build      # 产出 dist/（ESM + CJS + d.ts + style.css）
```

### 目录结构

```
.
├─ src/
│  ├─ index.ts                 # 包入口：导出组件、组合式函数、工具、类型、插件
│  ├─ types.ts                 # Track / LoopMode / PlayerVariant / Props
│  ├─ composables/
│  │  ├─ useAudioPlayer.ts     # 播放内核
│  │  └─ useAudioAnalyser.ts   # 频谱分析
│  ├─ components/
│  │  ├─ MusicPlayer.vue       # 主组件（卡片）
│  │  ├─ PlayerFullscreen.vue  # 全屏视图（歌词 + 频谱）
│  │  ├─ PlayerSlider.vue      # 无障碍滑块
│  │  └─ PlayerPlaylist.vue    # 播放列表
│  ├─ utils/
│  │  ├─ format.ts             # 时间格式化
│  │  └─ lrc.ts                # LRC 解析
│  └─ styles/
│     ├─ base.css              # 结构层
│     ├─ fullscreen.css        # 全屏视图
│     └─ variants/             # 四套皮肤
├─ playground/                 # 本地演示页（不随包发布）
└─ vite.config.ts              # 库模式构建
```

## 发布

```bash
npm run build
npm publish          # package.json 已配置 publishConfig.access = public
```

## 贡献

欢迎提 Issue 与 PR，中英文均可：

- [GitHub Issues](https://github.com/hefuhai001/vue-music-player/issues) / [Gitee Issues](https://gitee.com/hefuhai001/vue-music-player/issues)
- 提交前请先跑通 `npm run typecheck` 与 `npm run build`。

## License

[MIT](./LICENSE) © hefuhai001
