import type { App, Plugin } from 'vue'
import MusicPlayer from './components/MusicPlayer.vue'
import PlayerSlider from './components/PlayerSlider.vue'
import PlayerPlaylist from './components/PlayerPlaylist.vue'
import './styles/index.css'

export { MusicPlayer, PlayerSlider, PlayerPlaylist }
export { useAudioPlayer } from './composables/useAudioPlayer'

export type { AudioPlayer, UseAudioPlayerOptions } from './composables/useAudioPlayer'
export type { LoopMode, MusicPlayerProps, PlayerTheme, Track } from './types'

/** 全局注册插件：app.use(VueMusicPlayer) */
export const VueMusicPlayer: Plugin = {
  install(app: App) {
    app.component('MusicPlayer', MusicPlayer)
    app.component('PlayerSlider', PlayerSlider)
    app.component('PlayerPlaylist', PlayerPlaylist)
  },
}
