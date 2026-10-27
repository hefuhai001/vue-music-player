import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from 'vue'
import type { LoopMode, Track } from '../types'
import { clamp01 } from '../utils/format'

export interface UseAudioPlayerOptions {
  /** 播放列表，支持数组 / ref / getter */
  playlist: MaybeRefOrGetter<Track[]>
  /** 首次加载后是否自动播放（浏览器可能拦截） */
  autoplay?: MaybeRefOrGetter<boolean | undefined>
  /** 初始音量 0 ~ 1 */
  volume?: MaybeRefOrGetter<number | undefined>
  /** 初始是否静音 */
  muted?: MaybeRefOrGetter<boolean | undefined>
  /** 初始循环模式 */
  loop?: MaybeRefOrGetter<LoopMode | undefined>
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
  onTimeUpdate?: (currentTime: number, duration: number) => void
  onTrackChange?: (track: Track | undefined, index: number) => void
  onError?: (error: Error) => void
}

/**
 * 音频播放内核：封装 HTMLAudioElement，提供响应式状态与命令式方法。
 * 不依赖任何 DOM 结构，可在任意组件 / 组合式函数中复用。
 */
export function useAudioPlayer(options: UseAudioPlayerOptions) {
  const tracks = computed<Track[]>(() => toValue(options.playlist) ?? [])

  const audioEl = shallowRef<HTMLAudioElement | null>(null)
  const currentIndex = ref(0)
  const playing = ref(false)
  const loading = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const buffered = ref(0)
  const volume = ref(clamp01(toValue(options.volume) ?? 0.8))
  const muted = ref(toValue(options.muted) ?? false)
  const loopMode = ref<LoopMode>(toValue(options.loop) ?? 'list')
  const error = ref<string | null>(null)

  const currentTrack = computed<Track | undefined>(() => tracks.value[currentIndex.value])
  const hasTracks = computed(() => tracks.value.length > 0)
  const progress = computed(() => (duration.value > 0 ? clamp01(currentTime.value / duration.value) : 0))

  let audio: HTMLAudioElement | null = null
  let playAfterLoad = false
  let firstLoad = true

  /* ---------------------------- 事件处理 ---------------------------- */

  function syncDuration() {
    const el = audio
    if (!el) return
    if (Number.isFinite(el.duration) && el.duration > 0) {
      duration.value = el.duration
    } else if (!duration.value) {
      duration.value = currentTrack.value?.duration ?? 0
    }
  }

  function handleTimeUpdate() {
    if (!audio) return
    currentTime.value = audio.currentTime
    options.onTimeUpdate?.(audio.currentTime, duration.value)
  }

  function handleProgress() {
    const el = audio
    if (!el) return
    const ranges = el.buffered
    buffered.value = ranges.length ? ranges.end(ranges.length - 1) : 0
  }

  function handlePlay() {
    playing.value = true
    loading.value = false
    options.onPlay?.()
  }

  function handlePause() {
    playing.value = false
    options.onPause?.()
  }

  function handleWaiting() {
    loading.value = true
  }

  function handleCanPlay() {
    loading.value = false
  }

  function handleEnded() {
    playing.value = false
    options.onEnded?.()

    const list = tracks.value
    if (!list.length) return

    if (loopMode.value === 'single') {
      seek(0)
      void play()
      return
    }
    if (currentIndex.value < list.length - 1) {
      load(currentIndex.value + 1, true)
      return
    }
    if (loopMode.value === 'list') {
      load(0, true)
      return
    }
    // 不循环：回到起点等待手动播放
    seek(0)
  }

  function handleError() {
    const el = audio
    const message = el?.error?.message || '音频加载失败'
    error.value = message
    loading.value = false
    playing.value = false
    options.onError?.(new Error(message))
  }

  /* ---------------------------- 初始化 ---------------------------- */

  function createAudio(): HTMLAudioElement | null {
    if (audio) return audio
    if (typeof window === 'undefined') return null

    const el = new Audio()
    el.preload = 'metadata'
    el.volume = clamp01(volume.value)
    el.muted = muted.value

    el.addEventListener('loadedmetadata', syncDuration)
    el.addEventListener('durationchange', syncDuration)
    el.addEventListener('timeupdate', handleTimeUpdate)
    el.addEventListener('progress', handleProgress)
    el.addEventListener('play', handlePlay)
    el.addEventListener('pause', handlePause)
    el.addEventListener('waiting', handleWaiting)
    el.addEventListener('playing', handleCanPlay)
    el.addEventListener('canplay', handleCanPlay)
    el.addEventListener('ended', handleEnded)
    el.addEventListener('error', handleError)

    audio = el
    audioEl.value = el
    return el
  }

  /* ---------------------------- 加载逻辑 ---------------------------- */

  function resolveUrl(src: string): string {
    try {
      return new URL(src, document.baseURI).href
    } catch {
      return src
    }
  }

  /** 把某首曲目真正塞进 audio 元素 */
  function applyTrack(track: Track, autoplay: boolean) {
    const el = createAudio()
    if (!el) return

    if (el.src === resolveUrl(track.src) && el.readyState > 0) {
      if (autoplay) void play()
      return
    }

    error.value = null
    loading.value = true
    currentTime.value = 0
    buffered.value = 0
    duration.value = track.duration ?? 0
    el.src = track.src
    el.load()

    if (autoplay) void play()
  }

  /** 切换索引并加载音频；autoplay 为 true 时加载完自动播放 */
  function load(index: number, autoplay = false) {
    const list = tracks.value
    if (!list.length) {
      stop()
      currentIndex.value = 0
      currentTime.value = 0
      duration.value = 0
      buffered.value = 0
      return
    }
    const next = ((index % list.length) + list.length) % list.length
    playAfterLoad = autoplay

    if (next === currentIndex.value) {
      // 索引未变时 watcher 不会触发，直接装载
      playAfterLoad = false
      applyTrack(list[next], autoplay)
      return
    }
    currentIndex.value = next
  }

  // currentTrack 变化（含首次）时装载 src
  watch(
    () => currentTrack.value?.src,
    () => {
      if (typeof window === 'undefined') return
      const el = createAudio()
      if (!el) return

      const track = currentTrack.value
      if (!track) {
        el.removeAttribute('src')
        return
      }

      applyTrack(track, playAfterLoad)
      playAfterLoad = false

      if (!firstLoad) {
        options.onTrackChange?.(track, currentIndex.value)
      }
      firstLoad = false
    },
    { immediate: true },
  )

  // 列表长度变化时纠正越界索引
  watch(
    () => tracks.value.length,
    (len) => {
      if (!len) {
        stop()
        currentIndex.value = 0
        return
      }
      if (currentIndex.value > len - 1) {
        load(len - 1, false)
      }
    },
  )

  onMounted(() => {
    if (toValue(options.autoplay)) void play()
  })

  /* ---------------------------- 播放命令 ---------------------------- */

  async function play() {
    if (!tracks.value.length) return
    const el = createAudio()
    if (!el) return
    if (!el.src) {
      load(currentIndex.value, true)
      return
    }
    try {
      loading.value = true
      await el.play()
    } catch (err) {
      loading.value = false
      const name = (err as DOMException)?.name
      // 快速切换音源时的 AbortError 属于正常中断
      if (name === 'AbortError') return
      error.value = (err as Error)?.message ?? '播放失败'
      options.onError?.(err as Error)
    }
  }

  function pause() {
    audio?.pause()
  }

  function toggle() {
    if (playing.value) pause()
    else void play()
  }

  function stop() {
    const el = audio
    if (!el) return
    el.pause()
    try {
      el.currentTime = 0
    } catch {
      /* noop */
    }
    currentTime.value = 0
    playing.value = false
  }

  function next(auto = false) {
    const list = tracks.value
    if (!list.length) return
    const atEnd = currentIndex.value >= list.length - 1
    if (atEnd) {
      if (auto && loopMode.value === 'none') {
        pause()
        return
      }
      load(0, auto ? true : playing.value)
      return
    }
    load(currentIndex.value + 1, auto ? true : playing.value)
  }

  function prev() {
    // 播放超过 3 秒时，上一首等同于重播当前曲
    if (currentTime.value > 3) {
      seek(0)
      return
    }
    load(currentIndex.value - 1, playing.value)
  }

  function seek(seconds: number) {
    const el = audio
    if (!el) return
    const limit = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : duration.value
    const target = Math.max(0, limit > 0 ? Math.min(seconds, limit) : seconds)
    try {
      el.currentTime = target
    } catch {
      /* 元数据未就绪时忽略 */
    }
    currentTime.value = target
  }

  function seekByRatio(ratio: number) {
    const total = duration.value || currentTrack.value?.duration || 0
    if (total > 0) seek(clamp01(ratio) * total)
  }

  function selectTrack(index: number) {
    load(index, true)
  }

  function setVolume(value: number) {
    const v = clamp01(value)
    volume.value = v
    if (!audio) return
    audio.volume = v
    if (v > 0 && audio.muted) {
      audio.muted = false
      muted.value = false
    }
  }

  function toggleMute() {
    const nextMuted = !muted.value
    muted.value = nextMuted
    if (audio) audio.muted = nextMuted
  }

  function setLoopMode(mode: LoopMode) {
    loopMode.value = mode
  }

  function cycleLoopMode() {
    const order: LoopMode[] = ['list', 'single', 'none']
    const i = order.indexOf(loopMode.value)
    loopMode.value = order[(i + 1) % order.length]
  }

  function destroy() {
    const el = audio
    if (!el) return
    el.pause()
    el.removeEventListener('loadedmetadata', syncDuration)
    el.removeEventListener('durationchange', syncDuration)
    el.removeEventListener('timeupdate', handleTimeUpdate)
    el.removeEventListener('progress', handleProgress)
    el.removeEventListener('play', handlePlay)
    el.removeEventListener('pause', handlePause)
    el.removeEventListener('waiting', handleWaiting)
    el.removeEventListener('playing', handleCanPlay)
    el.removeEventListener('canplay', handleCanPlay)
    el.removeEventListener('ended', handleEnded)
    el.removeEventListener('error', handleError)
    el.removeAttribute('src')
    audio = null
    audioEl.value = null
    playing.value = false
    loading.value = false
  }

  onBeforeUnmount(destroy)

  return {
    // 状态
    audioEl,
    currentIndex,
    currentTrack,
    tracks,
    playing,
    loading,
    currentTime,
    duration,
    buffered,
    volume,
    muted,
    loopMode,
    error,
    hasTracks,
    progress,
    // 命令
    play,
    pause,
    toggle,
    stop,
    next,
    prev,
    seek,
    seekByRatio,
    selectTrack,
    setVolume,
    toggleMute,
    setLoopMode,
    cycleLoopMode,
    destroy,
  }
}

export type AudioPlayer = ReturnType<typeof useAudioPlayer>
