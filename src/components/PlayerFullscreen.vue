<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import PlayerSlider from './PlayerSlider.vue'
import type { AudioAnalyserHandle } from '../composables/useAudioAnalyser'
import type { PlayerVariant } from '../types'
import { clamp01, formatTime } from '../utils/format'
import { findLyricIndex, parseLyric } from '../utils/lrc'

const props = withDefaults(
  defineProps<{
    variant?: PlayerVariant
    label?: string
    title: string
    artist: string
    album?: string
    cover?: string
    initial?: string
    /** LRC 歌词 */
    lyric?: string
    playing: boolean
    loading?: boolean
    currentTime: number
    /** 总时长（秒） */
    duration: number
    /** 已缓冲秒数 */
    buffered?: number
    /** 音量比例 0 ~ 1（静音时由父级传 0） */
    volume: number
    muted?: boolean
    hasTracks?: boolean
    /** 实时频谱数据源；缺省或不可用时降级为 CSS 律动 */
    spectrum?: AudioAnalyserHandle
  }>(),
  {
    variant: 'modern',
    label: 'Now playing',
    album: '',
    cover: '',
    initial: '♪',
    lyric: '',
    loading: false,
    buffered: 0,
    muted: false,
    hasTracks: true,
  },
)

const emit = defineEmits<{
  close: []
  toggle: []
  prev: []
  next: []
  /** 跳转到指定秒数 */
  seek: [seconds: number]
  /** 音量比例 0 ~ 1 */
  volume: [ratio: number]
  mute: []
}>()

const rootEl = ref<HTMLElement | null>(null)
const lyricViewport = ref<HTMLElement | null>(null)

/** 无频谱数据时的兜底律动：让每根柱子的周期与相位错开 */
function barStyle(index: number) {
  return {
    '--i': index,
    animationDuration: `${(0.6 + ((index * 5) % 13) * 0.07).toFixed(2)}s`,
    animationDelay: `${(-((index % 17) + 1) * 0.08).toFixed(2)}s`,
  }
}

/* ---------------------------- 实时频谱律动 ---------------------------- */

const BAR_COUNT = 56
/** 每根柱子对应一段频段，用对数刻度映射，低频分辨率更高 */
const barsEl = ref<HTMLElement | null>(null)
const live = ref(false)
const levels = new Float32Array(BAR_COUNT)

let raf = 0
let lastFrame = 0
let beat = 0

function renderSpectrum(now: number) {
  raf = requestAnimationFrame(renderSpectrum)
  if (now - lastFrame < 30) return
  lastFrame = now

  const bars = barsEl.value?.children
  if (!bars) return

  // 暂停时直接收敛到基线，避免残留电平
  const bins = props.playing ? (props.spectrum?.read() ?? null) : null
  const maxBin = bins ? Math.max(2, Math.floor(bins.length * 0.82)) : 0
  let bass = 0

  for (let i = 0; i < BAR_COUNT; i += 1) {
    let target = 0

    if (bins) {
      const from = Math.max(1, Math.floor(maxBin ** (i / BAR_COUNT)))
      const to = Math.max(from + 1, Math.floor(maxBin ** ((i + 1) / BAR_COUNT)))
      let sum = 0
      for (let b = from; b < to; b += 1) sum += bins[b]
      const raw = sum / ((to - from) * 255)
      // 轻微压缩动态范围：弱段不至于看不见，强段也不会一片顶满
      target = raw < 0.04 ? 0 : raw ** 0.9
    }

    const prev = levels[i]
    // 起振快、回落慢，鼓点更利落
    const next = target > prev ? prev + (target - prev) * 0.5 : prev * 0.84
    levels[i] = next

    const node = bars[i] as HTMLElement | undefined
    if (node) node.style.transform = `scaleY(${(0.06 + next * 0.94).toFixed(3)})`
  }

  if (bins) {
    const limit = Math.min(8, bins.length)
    for (let b = 1; b < limit; b += 1) bass += bins[b]
    bass /= (limit - 1) * 255
  }
  beat = Math.max(bass, beat * 0.86)
  rootEl.value?.style.setProperty('--mp-beat', Math.min(1, beat).toFixed(3))
}

function startSpectrum() {
  if (raf || typeof window === 'undefined') return
  raf = requestAnimationFrame(renderSpectrum)
}

function stopSpectrum() {
  if (raf) cancelAnimationFrame(raf)
  raf = 0
}

/* ------------------------------ 进度 ------------------------------ */

const seekPreview = ref<number | null>(null)
const displayTime = computed(() => seekPreview.value ?? props.currentTime)
const progressRatio = computed(() =>
  props.duration > 0 ? clamp01(displayTime.value / props.duration) : 0,
)
const bufferedRatio = computed(() =>
  props.duration > 0 ? clamp01((props.buffered ?? 0) / props.duration) : 0,
)
const volumeRatio = computed(() => (props.muted ? 0 : clamp01(props.volume)))

function onSeekPreview(ratio: number) {
  seekPreview.value = ratio * props.duration
}

function onSeekCommit(ratio: number) {
  emit('seek', ratio * props.duration)
  seekPreview.value = null
}

/* ------------------------------ 歌词 ------------------------------ */

const lyricLines = computed(() => parseLyric(props.lyric))
const activeIndex = computed(() => findLyricIndex(lyricLines.value, props.currentTime))

function centerActiveLine() {
  const box = lyricViewport.value
  const index = activeIndex.value
  if (!box || index < 0) return
  const line = box.children[index] as HTMLElement | undefined
  if (!line) return
  box.scrollTo({
    top: line.offsetTop - box.clientHeight / 2 + line.offsetHeight / 2,
    behavior: 'smooth',
  })
}

watch(activeIndex, () => void nextTick(centerActiveLine))

watch(
  () => props.lyric,
  () =>
    void nextTick(() => {
      if (lyricViewport.value) lyricViewport.value.scrollTop = 0
      centerActiveLine()
    }),
)

/* ---------------------------- 全屏 / 键盘 ---------------------------- */

let prevBodyOverflow = ''

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

watch(
  () => props.spectrum?.ready.value ?? false,
  (isReady) => {
    if (!isReady) return
    live.value = true
    startSpectrum()
  },
)

watch(
  () => props.playing,
  (isPlaying) => {
    if (isPlaying) props.spectrum?.resume()
  },
)

onMounted(() => {
  prevBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  window.addEventListener('keydown', onKeydown)
  rootEl.value?.focus({ preventScroll: true })

  const handle = props.spectrum
  if (handle) {
    handle.resume()
    live.value = handle.attach() || handle.ready.value
    if (live.value) startSpectrum()
  }

  void nextTick(centerActiveLine)
})

onBeforeUnmount(() => {
  stopSpectrum()
  document.body.style.overflow = prevBodyOverflow
  window.removeEventListener('keydown', onKeydown)
})

defineExpose({ rootEl })
</script>

<template>
  <Teleport to="body">
    <section
      ref="rootEl"
      class="mp-fs"
      :class="[
        `mp-fs--${variant}`,
        { 'is-playing': playing, 'is-loading': loading, 'is-live': live },
      ]"
      role="dialog"
      aria-modal="true"
      :aria-label="`${title} 全屏播放`"
      tabindex="-1"
    >
      <div class="mp-fs__backdrop" aria-hidden="true">
        <div
          v-if="cover"
          class="mp-fs__backdrop-img"
          :style="{ backgroundImage: `url(${cover})` }"
        />
        <div ref="barsEl" class="mp-fs__bars" :class="{ 'is-live': live }">
          <i v-for="n in BAR_COUNT" :key="n" :style="barStyle(n)" />
        </div>
      </div>

      <header class="mp-fs__head">
        <div class="mp-fs__heading">
          <p class="mp-fs__eyebrow">{{ label }}</p>
          <h2 class="mp-fs__title" :title="title">{{ title }}</h2>
          <p class="mp-fs__sub">
            {{ artist }}<span v-if="album" class="mp-fs__album"> · {{ album }}</span>
          </p>
        </div>
        <button
          type="button"
          class="mp-btn mp-btn--sm mp-fs__close"
          title="退出全屏"
          aria-label="退出全屏"
          @click="emit('close')"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4 9V4h5M20 15v5h-5M20 9V4h-5M4 15v5h5"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </header>

      <div class="mp-fs__body">
        <div class="mp-fs__visual">
          <div class="mp-fs__ring" aria-hidden="true" />
          <div class="mp-fs__disc" :class="{ 'is-spinning': playing }">
            <img v-if="cover" class="mp-fs__art" :src="cover" :alt="`${title} 封面`" />
            <span v-else class="mp-fs__art mp-fs__art--fallback">{{ initial }}</span>
          </div>
        </div>

        <div ref="lyricViewport" class="mp-fs__lyrics">
          <template v-if="lyricLines.length">
            <p
              v-for="(line, index) in lyricLines"
              :key="`${line.time}-${index}`"
              class="mp-fs__line"
              :class="{ 'is-active': index === activeIndex, 'is-past': index < activeIndex }"
              @click="emit('seek', line.time)"
            >
              {{ line.text }}
            </p>
          </template>
          <p v-else class="mp-fs__empty">{{ lyric ? '该曲目暂无逐行歌词' : '暂无歌词' }}</p>
        </div>
      </div>

      <footer class="mp-fs__foot">
        <PlayerSlider
          :model-value="progressRatio"
          :buffered="bufferedRatio"
          :disabled="!hasTracks"
          label="播放进度"
          @update:model-value="onSeekPreview"
          @change="onSeekCommit"
        />
        <div class="mp-fs__times">
          <span>{{ formatTime(displayTime) }}</span>
          <span>{{ formatTime(duration) }}</span>
        </div>

        <div class="mp-fs__controls">
          <div class="mp-fs__transport">
            <button
              type="button"
              class="mp-btn mp-btn--sm"
              title="上一首"
              aria-label="上一首"
              :disabled="!hasTracks"
              @click="emit('prev')"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 5.6h2.2v12.8H7zM18.4 6.3v11.4L9.2 12z" />
              </svg>
            </button>

            <button
              type="button"
              class="mp-btn mp-btn--primary"
              :aria-label="playing ? '暂停' : '播放'"
              :disabled="!hasTracks"
              @click="emit('toggle')"
            >
              <svg v-if="playing" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5.4h3.1v13.2H8zM12.9 5.4H16v13.2h-3.1z" />
              </svg>
              <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M8.6 5.2a.9.9 0 0 1 1.37-.76l9.1 5.94a.9.9 0 0 1 0 1.5l-9.1 5.94a.9.9 0 0 1-1.37-.76z"
                />
              </svg>
            </button>

            <button
              type="button"
              class="mp-btn mp-btn--sm"
              title="下一首"
              aria-label="下一首"
              :disabled="!hasTracks"
              @click="emit('next')"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M14.8 5.6H17v12.8h-2.2zM5.6 6.3v11.4L14.8 12z" />
              </svg>
            </button>
          </div>

          <div class="mp-fs__volume">
            <button
              type="button"
              class="mp-btn mp-btn--bare"
              :title="muted ? '取消静音' : '静音'"
              :aria-label="muted ? '取消静音' : '静音'"
              @click="emit('mute')"
            >
              <svg v-if="muted" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 9.4h2.8L11 6.1v11.8L6.8 14.6H4z" />
                <path
                  d="M15.4 9.6l5 4.8M20.4 9.6l-5 4.8"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                />
              </svg>
              <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 9.4h2.8L11 6.1v11.8L6.8 14.6H4z" />
                <path
                  d="M14.6 9.2a4 4 0 0 1 0 5.6M17.4 6.6a7.6 7.6 0 0 1 0 10.8"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                />
              </svg>
            </button>
            <PlayerSlider
              class="mp-volume"
              :model-value="volumeRatio"
              label="音量"
              @update:model-value="emit('volume', $event)"
            />
          </div>
        </div>
      </footer>
    </section>
  </Teleport>
</template>
