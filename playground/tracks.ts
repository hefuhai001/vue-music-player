import type { Track } from '../src'
import { createDemoTracks } from './demoAudio'

/**
 * 演示曲目：音源在浏览器本地合成（WAV Blob），不依赖任何外链。
 * 换成自己的音乐时，把 src 改成真实地址即可：
 *
 *   { id: 1, title: 'xxx', artist: 'yyy', src: '/audio/1.mp3', cover: '/cover/1.jpg' }
 */
export const demoTracks: Track[] = createDemoTracks()
