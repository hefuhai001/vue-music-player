export interface Track {
  /** 唯一标识，用于列表 key */
  id: string | number
  /** 曲名 */
  title: string
  /** 歌手 */
  artist?: string
  /** 专辑名 */
  album?: string
  /** 音频地址，支持 mp3 / flac / aac / m3u8(需浏览器支持) 等 */
  src: string
  /** 封面图地址 */
  cover?: string
  /** 已知时长（秒），未提供时由 audio 元数据自动获取 */
  duration?: number
}

/**
 * 循环模式
 * - `list`：列表循环
 * - `single`：单曲循环
 * - `none`：播完即停
 */
export type LoopMode = 'list' | 'single' | 'none'

/** 主题 */
export type PlayerTheme = 'dark' | 'light'

export interface MusicPlayerProps {
  /** 播放列表 */
  tracks: Track[]
  /** 首次加载后自动播放（可能被浏览器策略拦截） */
  autoplay?: boolean
  /** 初始音量 0 ~ 1 */
  volume?: number
  /** 初始静音 */
  muted?: boolean
  /** 初始循环模式 */
  loop?: LoopMode
  /** 是否默认展开播放列表 */
  showPlaylist?: boolean
  /** 主题 */
  theme?: PlayerTheme
  /** 顶部小标题 */
  label?: string
  /** 强调色，等价于覆盖 CSS 变量 --mp-accent */
  accent?: string
}
