import { onScopeDispose, ref, toValue, type MaybeRefOrGetter, type Ref } from 'vue'

export interface UseAudioAnalyserOptions {
  /** FFT 大小，需为 2 的幂，默认 512 */
  fftSize?: number
  /** 平滑系数 0 ~ 1，越大越平滑，默认 0.75 */
  smoothingTimeConstant?: number
  /**
   * 是否允许把音频元素接入 Web Audio。
   * 跨域音源若未返回 CORS 头，接入后会被浏览器静音，必须由调用方判断。
   */
  allow?: () => boolean
}

export interface AudioAnalyserHandle {
  /** 是否已成功接入频谱分析 */
  ready: Ref<boolean>
  /** 建立分析链路（幂等）；返回是否可用 */
  attach: () => boolean
  /** 恢复被浏览器挂起的音频上下文，建议在用户手势中调用 */
  resume: () => void
  /** 读取当前频谱（字节值 0 ~ 255），不可用时返回 null */
  read: () => Uint8Array | null
  /** 断开分析链路并释放上下文 */
  destroy: () => void
}

/**
 * 判断一个音源地址能否安全地接入 Web Audio 分析。
 * 只有同源、blob:、data:、file: 音源不会触发 CORS 静音。
 */
export function isAnalysableSource(src: string): boolean {
  if (!src) return true
  if (typeof window === 'undefined') return false

  let url: URL
  try {
    url = new URL(src, document.baseURI)
  } catch {
    return false
  }

  if (url.protocol === 'blob:' || url.protocol === 'data:' || url.protocol === 'file:') {
    return true
  }
  return url.origin === window.location.origin
}

/**
 * 用原生 Web Audio 把 <audio> 接入 AnalyserNode，实时读取频谱数据。
 * 不引入任何三方依赖；不可用时 ready 保持 false，由调用方降级。
 */
export function useAudioAnalyser(
  audio: MaybeRefOrGetter<HTMLAudioElement | null>,
  options: UseAudioAnalyserOptions = {},
): AudioAnalyserHandle {
  const ready = ref(false)

  let ctx: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let source: MediaElementAudioSourceNode | null = null
  let buffer: Uint8Array | null = null
  /** 不可恢复的失败（浏览器不支持 / 元素已被其他上下文占用） */
  let broken = false

  function teardown() {
    try {
      source?.disconnect()
    } catch {
      /* noop */
    }
    try {
      analyser?.disconnect()
    } catch {
      /* noop */
    }
    source = null
    analyser = null
    buffer = null

    const closing = ctx
    ctx = null
    if (closing && closing.state !== 'closed') void closing.close().catch(() => undefined)

    ready.value = false
  }

  function attach(): boolean {
    if (ready.value) return true
    if (broken || typeof window === 'undefined') return false
    if (options.allow && !options.allow()) return false

    const el = toValue(audio)
    if (!el) return false

    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) {
      broken = true
      return false
    }

    try {
      ctx = new Ctor()
      analyser = ctx.createAnalyser()
      analyser.fftSize = options.fftSize ?? 512
      analyser.smoothingTimeConstant = options.smoothingTimeConstant ?? 0.75

      source = ctx.createMediaElementSource(el)
      source.connect(analyser)
      analyser.connect(ctx.destination)

      buffer = new Uint8Array(analyser.frequencyBinCount)
      ready.value = true
      return true
    } catch {
      broken = true
      teardown()
      return false
    }
  }

  function resume() {
    if (!ctx) return
    if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined)
  }

  function read(): Uint8Array | null {
    if (!analyser || !buffer) return null
    analyser.getByteFrequencyData(buffer)
    return buffer
  }

  onScopeDispose(teardown)

  return { ready, attach, resume, read, destroy: teardown }
}
