<div align="center">

# @hefuhai001/vue-music-player

A themeable audio player component for Vue 3. Ships with four built-in skins — **modern, retro, minimal and electronic** — plus fullscreen playback, LRC lyrics and a live spectrum. The playback core is decoupled from the UI, with zero runtime dependencies besides `vue`.

[简体中文](https://github.com/hefuhai001/vue-music-player/blob/main/README.md) | English

[![npm](https://img.shields.io/npm/v/@hefuhai001/vue-music-player.svg)](https://www.npmjs.com/package/@hefuhai001/vue-music-player)
[![license](https://img.shields.io/npm/l/@hefuhai001/vue-music-player.svg)](./LICENSE)
[![vue](https://img.shields.io/badge/vue-3.3%2B-42b883.svg)](https://vuejs.org)
[![size](https://img.shields.io/badge/gzip-10.9%20KB%20JS%20%2B%206.6%20KB%20CSS-blue.svg)](#)

[GitHub](https://github.com/hefuhai001/vue-music-player) · [Gitee](https://gitee.com/hefuhai001/vue-music-player) · [Issues](https://github.com/hefuhai001/vue-music-player/issues)

</div>

---

## Features

- **Four built-in skins**: `modern` (glassmorphism), `retro` (70s vinyl), `minimal`, `electronic` (neon HUD). They share one DOM tree — switching costs no extra JS.
- **Fullscreen playback**: uses the native Fullscreen API and falls back to a fixed overlay when unavailable; `Esc` exits and keeps state in sync.
- **LRC lyrics**: pass `Track.lyric` and the fullscreen view highlights and auto-scrolls lines.
- **Live spectrum**: driven by a Web Audio `AnalyserNode`; cross-origin sources automatically fall back to a CSS animation so the audio never gets muted.
- **Reusable core**: `useAudioPlayer()` is a pure composable, so you can build your own UI on top of it.
- **Fully themeable**: every color, font, radius and shadow is a `--mp-*` CSS variable that can be overridden locally.
- **Typed**: written in TypeScript, `.d.ts` shipped with the package.
- **Dual format**: ESM + CJS, with `vue` as a `peerDependency` to keep a single instance.
- **Accessible**: progress/volume sliders support keyboard (arrows, Home, End) and `aria-*` attributes.
- **SSR safe**: the audio element is created lazily on the client and cleaned up in `onBeforeUnmount`.
- **Size**: 41.9 KB JS (10.9 KB gzip) + 31.1 KB CSS (6.6 KB gzip).

## Installation

```bash
npm install @hefuhai001/vue-music-player
# or
pnpm add @hefuhai001/vue-music-player
yarn add @hefuhai001/vue-music-player
```

Requires Vue `>= 3.3`.

## Quick start

### Local import (recommended)

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

### Global registration

```ts
import { createApp } from 'vue'
import { VueMusicPlayer } from '@hefuhai001/vue-music-player'
import '@hefuhai001/vue-music-player/style.css'

createApp(App).use(VueMusicPlayer).mount('#app')
// <MusicPlayer /> / <PlayerSlider /> / <PlayerPlaylist /> / <PlayerFullscreen /> are now globally available
```

> The stylesheet has to be imported once, otherwise the component has no appearance.

## Skins

| `variant` | Visual language | Highlights |
| --- | --- | --- |
| `modern` | Glassmorphism | Cool gradient glow, 28px radius, rounded-square artwork, gradient play button, ripple ring while playing |
| `retro` | 70s vinyl | Cream paper texture, 2px ink border, 6px hard shadow, mechanical key press, cassette-striped progress bar |
| `minimal` | Minimal | Pure white, hairline dividers, 1px progress track, outlined circular play button |
| `electronic` | Neon HUD | Black grid, cyan glow, scanlines, clipped-corner play button, monospace uppercase type |

```vue
<MusicPlayer :tracks="tracks" variant="modern" />
<MusicPlayer :tracks="tracks" variant="retro" show-playlist />
<MusicPlayer :tracks="tracks" variant="minimal" />
<MusicPlayer :tracks="tracks" variant="electronic" />
```

The same `variant` also applies to the fullscreen view, so both views stay visually consistent.

## Fullscreen · Lyrics · Spectrum

The button in the top-right corner of the card opens the fullscreen view (`enterFullscreen()`) which contains a large cover, highlighted LRC lyrics, spectrum bars and progress/volume controls.

```ts
const tracks: Track[] = [
  {
    id: 1,
    title: 'Midnight Static',
    artist: 'SoundHelix',
    src: '/audio/1.mp3',
    // Standard LRC; multiple time tags per line are supported, [ar:]/[ti:] lines are ignored
    lyric: '[00:12.00]First line\n[00:17.50][01:20.00]Chorus reuses this line',
  },
]
```

About the spectrum:

- Web Audio is only attached when **every** track is a same-origin / `blob:` / `data:` / `file:` source, so cross-origin audio is never muted.
- Otherwise it degrades to a pure CSS animation — no functionality is lost.
- Use the exported `isAnalysableSource(src)` if you need to decide yourself.

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
| `showPlaylist` | `boolean` | `false` | Expand the playlist initially (afterwards controlled by the in-component button) |
| `label` | `string` | `'Now playing'` | Small caption at the top |
| `accent` | `string` | — | Accent color, shorthand for overriding `--mp-accent` |

### Track

```ts
interface Track {
  id: string | number
  title: string
  artist?: string
  album?: string
  /** Audio URL; any format the browser can decode (mp3 / aac / wav / flac ...) */
  src: string
  cover?: string
  /** Known duration in seconds; falls back to audio metadata */
  duration?: number
  /** LRC lyrics, highlighted line by line in fullscreen mode */
  lyric?: string
}
```

### Events

| Event | Payload | Description |
| --- | --- | --- |
| `play` / `pause` / `ended` | — | Playback state changes |
| `change` | `(track: Track, index: number)` | Track changed |
| `timeupdate` | `(currentTime: number, duration: number)` | Playback progress (~4 times per second) |
| `error` | `(message: string)` | Loading or playback failed |

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

## Other exports

| Export | Description |
| --- | --- |
| `PlayerSlider` | Accessible slider, reusable in your own player |
| `PlayerPlaylist` | Playlist |
| `PlayerFullscreen` | Fullscreen view, usable standalone (controlled: `playing` / `currentTime` / `duration` etc. come from the parent) |
| `useAudioPlayer(options)` | Playback core |
| `useAudioAnalyser(audioEl, options)` | Web Audio spectrum pipeline |
| `isAnalysableSource(src)` | Whether a source can safely be routed through Web Audio |
| `parseLyric(lrc)` / `findLyricIndex(lines, time)` | LRC parsing and binary search for the current line |
| `VueMusicPlayer` | Global registration plugin |

## Using the playback core

Prefer your own UI? Use `useAudioPlayer` directly:

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

It exposes the same state and commands as the component. The composable creates its own `Audio`
instance and destroys it when the owning component unmounts.

## Theming

Every visual parameter is a CSS variable and can be overridden on any ancestor element
(takes precedence over the skin defaults):

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

- Requires CSS variables, Pointer Events and `HTMLAudioElement` (Chrome / Edge 88+, Firefox 78+, Safari 14+).
- Fullscreen relies on the Fullscreen API; when refused or unsupported (some mobile browsers) it falls back to a fixed overlay.
- The spectrum relies on Web Audio and degrades to a CSS animation when unavailable.
- Build target is `ES2019`; no polyfills are included.
- Playback depends on the browser supporting the container format — mp3 is a safe fallback.

## Development

```bash
npm install
npm run dev        # playground at http://localhost:5173
npm run typecheck
npm run build      # dist/ (ESM + CJS + d.ts + style.css)
```

### Project structure

```
.
├─ src/
│  ├─ index.ts                 # Entry: components, composables, utils, types, plugin
│  ├─ types.ts                 # Track / LoopMode / PlayerVariant / Props
│  ├─ composables/
│  │  ├─ useAudioPlayer.ts     # Playback core
│  │  └─ useAudioAnalyser.ts   # Spectrum analysis
│  ├─ components/
│  │  ├─ MusicPlayer.vue       # Main card component
│  │  ├─ PlayerFullscreen.vue  # Fullscreen view (lyrics + spectrum)
│  │  ├─ PlayerSlider.vue      # Accessible slider
│  │  └─ PlayerPlaylist.vue    # Playlist
│  ├─ utils/
│  │  ├─ format.ts             # Time formatting
│  │  └─ lrc.ts                # LRC parsing
│  └─ styles/
│     ├─ base.css              # Structure layer
│     ├─ fullscreen.css        # Fullscreen view
│     └─ variants/             # Four skins
├─ playground/                 # Local demo (not published)
└─ vite.config.ts              # Library build
```

## Publishing

```bash
npm run build
npm publish          # publishConfig.access = public is already set
```

## Contributing

Issues and PRs are welcome in English or Chinese:

- [GitHub Issues](https://github.com/hefuhai001/vue-music-player/issues) / [Gitee Issues](https://gitee.com/hefuhai001/vue-music-player/issues)
- Please make sure `npm run typecheck` and `npm run build` pass before submitting.

## License

[MIT](./LICENSE) © hefuhai001
