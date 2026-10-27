import type { App, Plugin } from 'vue'
import MusicPlayer from './components/MusicPlayer.vue'
import PlayerSlider from './components/PlayerSlider.vue'
import PlayerPlaylist from './components/PlayerPlaylist.vue'
import PlayerFullscreen from './components/PlayerFullscreen.vue'
import './styles/index.css'

export { MusicPlayer, PlayerSlider, PlayerPlaylist, PlayerFullscreen }
export { useAudioPlayer } from './composables/useAudioPlayer'
export { isAnalysableSource, useAudioAnalyser } from './composables/useAudioAnalyser'
export { findLyricIndex, parseLyric } from './utils/lrc'

export type { AudioPlayer, UseAudioPlayerOptions } from './composables/useAudioPlayer'
export type { AudioAnalyserHandle, UseAudioAnalyserOptions } from './composables/useAudioAnalyser'
export type { LyricLine } from './utils/lrc'
export type { LoopMode, MusicPlayerProps, PlayerVariant, Track } from './types'

/** 全局注册插件：app.use(VueMusicPlayer) */
export const VueMusicPlayer: Plugin = {
  install(app: App) {
    app.component('MusicPlayer', MusicPlayer)
    app.component('PlayerSlider', PlayerSlider)
    app.component('PlayerPlaylist', PlayerPlaylist)
    app.component('PlayerFullscreen', PlayerFullscreen)
  },
}
