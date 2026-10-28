<div align="center">

# @hefuhai001/vue-music-player

A themeable audio player component for Vue 3. Four built-in skins, fullscreen playback, LRC lyrics and a live spectrum — zero runtime dependencies besides `vue`.

[简体中文](https://github.com/hefuhai001/vue-music-player/blob/master/README.md) | English

[![npm](https://img.shields.io/npm/v/@hefuhai001/vue-music-player.svg)](https://www.npmjs.com/package/@hefuhai001/vue-music-player)
[![license](https://img.shields.io/npm/l/@hefuhai001/vue-music-player.svg)](./LICENSE)
[![vue](https://img.shields.io/badge/vue-3.3%2B-42b883.svg)](https://vuejs.org)
[![size](https://img.shields.io/badge/gzip-10.9%20KB%20JS%20%2B%206.6%20KB%20CSS-blue.svg)](#)

[GitHub](https://github.com/hefuhai001/vue-music-player) · [Gitee](https://gitee.com/hefuhai001/vue-music-player) · [Issues](https://github.com/hefuhai001/vue-music-player/issues)

</div>

---

## Installation

```bash
npm install @hefuhai001/vue-music-player
```

Or install a release straight from GitHub (replace `v1.0.0` with the version you need):

```bash
npm install github:hefuhai001/vue-music-player#v1.0.0
```

Requires Vue `>= 3.3`.

## Quick start

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
    lyric: '[00:12.00]First line\n[00:17.50]Second line',
  },
  { id: 2, title: 'Amber Room', artist: 'SoundHelix', src: '/audio/2.mp3' },
]
</script>

<template>
  <MusicPlayer :tracks="tracks" variant="modern" @play="onPlay" @change="onChange" />
</template>
```

The stylesheet must be imported once. Global registration works too:

```ts
import { createApp } from 'vue'
import { VueMusicPlayer } from '@hefuhai001/vue-music-player'
import '@hefuhai001/vue-music-player/style.css'

createApp(App).use(VueMusicPlayer).mount('#app')
// <MusicPlayer /> / <PlayerSlider /> / <PlayerPlaylist /> / <PlayerFullscreen /> are now available
```

## Skins

| `variant` | Visual language | Highlights |
| --- | --- | --- |
| `modern` | Glassmorphism | Cool gradient glow, large radius, rounded-square artwork, gradient play button |
| `retro` | 70s vinyl | Cream paper texture, ink border, hard shadow, mechanical key press, cassette-striped progress bar |
| `minimal` | Minimal | Pure white, hairline dividers, 1px progress track, outlined circular play button |
| `electronic` | Neon HUD | Black grid, cyan glow, scanlines, clipped-corner play button, monospace uppercase type |

```vue
<MusicPlayer :tracks="tracks" variant="retro" show-playlist />
```

All four skins share one DOM tree — switching costs no extra JS, and the same `variant` also applies to the fullscreen view.

## Fullscreen, lyrics and spectrum

The top-right button opens the fullscreen view: large cover, highlighted LRC lyrics, spectrum bars and full controls.

- Pass standard LRC text as `Track.lyric`; multiple time tags per line are supported and `[ar:]` / `[ti:]` metadata is ignored.
- Web Audio is only attached when every track is a same-origin / `blob:` / `data:` / `file:` source, so cross-origin audio is never muted. Otherwise it degrades to a CSS animation.

## API

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `tracks` | `Track[]` | required | Playlist |
| `variant` | `'modern' \| 'retro' \| 'minimal' \| 'electronic'` | `'modern'` | Visual skin |
| `autoplay` | `boolean` | `false` | Play after the first load (may be blocked by browser policy) |
| `volume` | `number` | `0.8` | Initial volume, `0 ~ 1` |
| `muted` | `boolean` | `false` | Start muted |
| `loop` | `'list' \| 'single' \| 'none'` | `'list'` | Loop playlist / single track / no loop |
| `showPlaylist` | `boolean` | `false` | Expand the playlist initially |
| `label` | `string` | `'Now playing'` | Small caption at the top |
| `accent` | `string` | — | Accent color, shorthand for overriding `--mp-accent` |

### Track

```ts
interface Track {
  id: string | number
  title: string
  artist?: string
  album?: string
  /** Audio URL; any format the browser can decode */
  src: string
  cover?: string
  /** Known duration in seconds; falls back to audio metadata */
  duration?: number
  /** LRC lyrics */
  lyric?: string
}
```

### Events

| Event | Payload | Description |
| --- | --- | --- |
| `play` / `pause` / `ended` | — | Playback state changes |
| `change` | `(track, index)` | Track changed |
| `timeupdate` | `(currentTime, duration)` | Playback progress |
| `error` | `(message)` | Loading or playback failed |

### Instance methods

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { MusicPlayer } from '@hefuhai001/vue-music-player'

const player = ref<InstanceType<typeof MusicPlayer> | null>(null)
</script>

<template>
  <MusicPlayer ref="player" :tracks="tracks" />
  <button @click="player?.toggleFullscreen()">Fullscreen</button>
</template>
```

| Member | Description |
| --- | --- |
| `play()` / `pause()` / `toggle()` | Playback control |
| `next()` / `prev()` | Next / previous (`prev` restarts the track when past 3 seconds) |
| `seek(seconds)` | Jump to a position |
| `selectTrack(index)` | Switch to and play a track |
| `setVolume(0 ~ 1)` / `toggleMute()` | Volume control |
| `setLoopMode(mode)` / `cycleLoopMode()` | Loop mode |
| `enterFullscreen()` / `exitFullscreen()` / `toggleFullscreen()` | Fullscreen playback |
| `audioEl` | Raw `HTMLAudioElement`, useful for custom visualization |
| `playing` / `currentTime` / `duration` / `currentTrack` / `currentIndex` / `fullscreenOpen` | Read-only reactive state |

## Composition API

Prefer your own UI? Use the playback core alone:

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

Other exports:

| Export | Description |
| --- | --- |
| `PlayerSlider` / `PlayerPlaylist` / `PlayerFullscreen` | Standalone UI parts |
| `useAudioAnalyser(audioEl, options)` | Web Audio spectrum pipeline |
| `isAnalysableSource(src)` | Whether a source can safely be routed through Web Audio |
| `parseLyric(lrc)` / `findLyricIndex(lines, time)` | LRC parsing and current-line lookup |
| `VueMusicPlayer` | Global registration plugin |

## Theming

Every visual parameter is a CSS variable and can be overridden on any ancestor element:

```css
.my-layout {
  --mp-accent: #d94f2b;
  --mp-radius: 12px;
  --mp-font-display: 'Songti SC', serif;
}
```

| Variable | Purpose |
| --- | --- |
| `--mp-accent` / `--mp-on-accent` / `--mp-accent-weak` / `--mp-glow` | Accent color and its derivatives |
| `--mp-bg` / `--mp-text` / `--mp-dim` / `--mp-dim-2` | Background and three text levels |
| `--mp-line` / `--mp-track` / `--mp-buffer` / `--mp-hover` | Borders, track, buffer, hover |
| `--mp-shadow` / `--mp-radius` / `--mp-pad` | Shadow, radius, padding |
| `--mp-font` / `--mp-font-display` / `--mp-font-mono` | Body, display and numeric fonts |
| `--mp-danger` | Error color |

## Browser support

- Chrome / Edge 88+, Firefox 78+, Safari 14+ (requires CSS variables, Pointer Events, `HTMLAudioElement`).
- Fullscreen relies on the Fullscreen API and falls back to a fixed overlay; the spectrum degrades to a CSS animation when unavailable.
- Build target is `ES2019` with no polyfills; playable formats depend on the browser — mp3 is a safe fallback.

## Links

- Changelog → [CHANGELOG.md](https://github.com/hefuhai001/vue-music-player/blob/master/CHANGELOG.md)
- Local development, project structure, releasing → [CONTRIBUTING.md](https://github.com/hefuhai001/vue-music-player/blob/master/CONTRIBUTING.md)
- Issues → [GitHub](https://github.com/hefuhai001/vue-music-player/issues) / [Gitee](https://gitee.com/hefuhai001/vue-music-player/issues)

## License

[MIT](./LICENSE) © hefuhai001
