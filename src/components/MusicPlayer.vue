<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import PlayerSlider from './PlayerSlider.vue'
import PlayerPlaylist from './PlayerPlaylist.vue'
import PlayerFullscreen from './PlayerFullscreen.vue'
import { useAudioPlayer } from '../composables/useAudioPlayer'
import { clamp01, formatTime } from '../utils/format'
import type { MusicPlayerProps, Track } from '../types'

const props = withDefaults(defineProps<MusicPlayerProps>(), {
  autoplay: false,
  volume: 0.8,
  muted: false,
  loop: 'list',
  showPlaylist: false,
  variant: 'modern',
  label: 'Now playing',
  accent: undefined,
})

const emit = defineEmits<{
  play: []
  pause: []
  ended: []
  change: [track: Track, index: number]
  timeupdate: [currentTime: number, duration: number]
  error: [message: string]
}>()

const {
  audioEl,
  tracks,
  playing,
  loading,
  currentTrack,
  currentIndex,
  currentTime,
  duration,
  buffered,
  volume,
  muted,
  loopMode,
  error,
  hasTracks,
  toggle,
  next,
  prev,
  seek,
  setVolume,
  toggleMute,
  cycleLoopMode,
  selectTrack,
} = useAudioPlayer({
  playlist: () => props.tracks,
  autoplay: () => props.autoplay,
  volume: () => props.volume,
  muted: () => props.muted,
  loop: () => props.loop,
  onPlay: () => emit('play'),
  onPause: () => emit('pause'),
  onEnded: () => emit('ended'),
  onTrackChange: (track, index) => {
    if (track) emit('change', track, index)
  },
  onTimeUpdate: (time, total) => emit('timeupdate', time, total),
  onError: (err) => emit('error', err.message),
})

/* --------------------------- 展示层派生状态 --------------------------- */

const playlistOpen = ref(props.showPlaylist)

const rootClass = computed(() => [
  `mp-player--${props.variant}`,
  { 'is-playing': playing.value, 'is-loading': loading.value },
])

const rootStyle = computed(() =>
  props.accent ? ({ '--mp-accent': props.accent } as Record<string, string>) : undefined,
)

const title = computed(() => currentTrack.value?.title ?? '未选择曲目')
const artist = computed(() => currentTrack.value?.artist ?? '未知歌手')
const album = computed(() => currentTrack.value?.album ?? '')
const cover = computed(() => currentTrack.value?.cover ?? '')
const initial = computed(() => (title.value.trim().slice(0, 1) || '♪').toUpperCase())

const totalDuration = computed(() => duration.value || currentTrack.value?.duration || 0)

/** 拖动时优先展示拖拽位置 */
const seekPreview = ref<number | null>(null)
const displayTime = computed(() =>
  seekPreview.value === null ? currentTime.value : seekPreview.value,
)
const progressRatio = computed(() =>
  totalDuration.value > 0 ? clamp01(displayTime.value / totalDuration.value) : 0,
)
const bufferedRatio = computed(() =>
  totalDuration.value > 0 ? clamp01(buffered.value / totalDuration.value) : 0,
)
const volumeRatio = computed(() => (muted.value ? 0 : clamp01(volume.value)))

const loopLabel = computed(
  () => ({ list: '列表循环', single: '单曲循环', none: '不循环' })[loopMode.value],
)

function onSeekPreview(ratio: number) {
  seekPreview.value = ratio * totalDuration.value
}

function onSeekCommit(ratio: number) {
  seek(ratio * totalDuration.value)
  seekPreview.value = null
}

function onVolumeInput(ratio: number) {
  setVolume(ratio)
}

function onSelectTrack(index: number) {
  selectTrack(index)
}

/* ----------------------------- 全屏模式 ----------------------------- */

const fullscreenOpen = ref(false)
const fullscreenRef = ref<InstanceType<typeof PlayerFullscreen> | null>(null)

async function enterFullscreen() {
  if (fullscreenOpen.value) return
  fullscreenOpen.value = true
  await nextTick()

  const el = fullscreenRef.value?.rootEl
  if (!el || document.fullscreenElement) return
  try {
    await el.requestFullscreen()
  } catch {
    /* 浏览器拒绝原生全屏时退化为整页覆盖层 */
  }
}

async function exitFullscreen() {
  fullscreenOpen.value = false
  if (document.fullscreenElement) {
    try {
      await document.exitFullscreen()
    } catch {
      /* noop */
    }
  }
}

function toggleFullscreen() {
  if (fullscreenOpen.value) void exitFullscreen()
  else void enterFullscreen()
}

/** 用户按 Esc 退出原生全屏时同步关闭覆盖层 */
function handleFullscreenChange() {
  if (!document.fullscreenElement && fullscreenOpen.value) {
    fullscreenOpen.value = false
  }
}

onMounted(() => document.addEventListener('fullscreenchange', handleFullscreenChange))
onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  if (document.fullscreenElement) void document.exitFullscreen()
})

defineExpose({
  audioEl,
  tracks,
  playing,
  loading,
  currentTrack,
  currentIndex,
  currentTime,
  duration,
  volume,
  muted,
  loopMode,
  error,
  hasTracks,
  play: () => (playing.value ? undefined : toggle()),
  pause: () => (playing.value ? toggle() : undefined),
  toggle,
  next,
  prev,
  seek,
  setVolume,
  toggleMute,
  cycleLoopMode,
  selectTrack,
  fullscreenOpen,
  enterFullscreen,
  exitFullscreen,
  toggleFullscreen,
})
</script>

<template>
  <div class="mp-player" :class="rootClass" :style="rootStyle">
    <header class="mp-head">
      <span class="mp-eyebrow">{{ label }}</span>
      <div class="mp-head__tools">
        <span class="mp-equalizer" :class="{ 'is-active': playing }" aria-hidden="true">
          <i v-for="n in 5" :key="n" :style="{ '--mp-bar': n }" />
        </span>
        <button
          type="button"
          class="mp-btn mp-btn--bare mp-fs-toggle"
          title="全屏播放"
          aria-label="全屏播放"
          :disabled="!hasTracks"
          @click="toggleFullscreen"
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
      </div>
    </header>

    <section class="mp-hero">
      <div class="mp-disc" :class="{ 'is-spinning': playing }">
        <div class="mp-disc__grooves" />
        <img v-if="cover" class="mp-disc__art" :src="cover" :alt="`${title} 封面`" />
        <span v-else class="mp-disc__art mp-disc__art--fallback">{{ initial }}</span>
      </div>
      <div class="mp-meta">
        <h3 class="mp-title" :title="title">{{ title }}</h3>
        <p class="mp-sub">
          {{ artist }}<span v-if="album" class="mp-album"> · {{ album }}</span>
        </p>
      </div>
    </section>

    <div class="mp-progress">
      <PlayerSlider
        :model-value="progressRatio"
        :buffered="bufferedRatio"
        :disabled="!hasTracks"
        label="播放进度"
        @update:model-value="onSeekPreview"
        @change="onSeekCommit"
      />
      <div class="mp-times">
        <span>{{ formatTime(displayTime) }}</span>
        <span>{{ formatTime(totalDuration) }}</span>
      </div>
    </div>

    <div class="mp-controls">
      <button
        type="button"
        class="mp-btn mp-btn--ghost mp-btn--sm"
        :class="{ 'is-active': loopMode !== 'none' }"
        :title="loopLabel"
        :aria-label="loopLabel"
        @click="cycleLoopMode"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4.5 12a7.5 7.5 0 0 1 12.8-5.3l2.2 2.2M19.5 12a7.5 7.5 0 0 1-12.8 5.3l-2.2-2.2"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
          <path
            d="M19.6 4.6v4.4h-4.4M4.4 19.4V15h4.4"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            v-if="loopMode === 'none'"
            d="M5 19L19 5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
          <text
            v-else-if="loopMode === 'single'"
            x="12"
            y="15.2"
            text-anchor="middle"
            font-size="8.5"
            font-weight="700"
            fill="currentColor"
          >
            1
          </text>
        </svg>
      </button>

      <button
        type="button"
        class="mp-btn mp-btn--ghost mp-btn--sm"
        title="上一首"
        aria-label="上一首"
        :disabled="!hasTracks"
        @click="prev"
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
        @click="toggle"
      >
        <svg v-if="playing" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 5.4h3.1v13.2H8zM12.9 5.4H16v13.2h-3.1z" />
        </svg>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8.6 5.2a.9.9 0 0 1 1.37-.76l9.1 5.94a.9.9 0 0 1 0 1.5l-9.1 5.94a.9.9 0 0 1-1.37-.76z" />
        </svg>
      </button>

      <button
        type="button"
        class="mp-btn mp-btn--ghost mp-btn--sm"
        title="下一首"
        aria-label="下一首"
        :disabled="!hasTracks"
        @click="next()"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14.8 5.6H17v12.8h-2.2zM5.6 6.3v11.4L14.8 12z" />
        </svg>
      </button>

      <button
        type="button"
        class="mp-btn mp-btn--ghost mp-btn--sm"
        :class="{ 'is-active': playlistOpen }"
        title="播放列表"
        aria-label="播放列表"
        :aria-expanded="playlistOpen"
        :disabled="!hasTracks"
        @click="playlistOpen = !playlistOpen"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 7h11M4 12h11M4 17h6.5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
          <circle cx="17.6" cy="16" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6" />
          <path d="M20.2 16V8.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        </svg>
      </button>
    </div>

    <div class="mp-foot">
      <button
        type="button"
        class="mp-btn mp-btn--bare"
        :title="muted ? '取消静音' : '静音'"
        :aria-label="muted ? '取消静音' : '静音'"
        @click="toggleMute"
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
        @update:model-value="onVolumeInput"
      />

      <span class="mp-count">
        {{ hasTracks ? currentIndex + 1 : 0 }} / {{ tracks.length }}
      </span>
    </div>

    <p v-if="error" class="mp-error">{{ error }}</p>

    <PlayerPlaylist
      v-if="playlistOpen && hasTracks"
      :tracks="tracks"
      :current-index="currentIndex"
      @select="onSelectTrack"
    />

    <PlayerFullscreen
      v-if="fullscreenOpen"
      ref="fullscreenRef"
      :variant="variant"
      :label="label"
      :title="title"
      :artist="artist"
      :album="album"
      :cover="cover"
      :initial="initial"
      :lyric="currentTrack?.lyric"
      :playing="playing"
      :loading="loading"
      :current-time="currentTime"
      :duration="totalDuration"
      :buffered="buffered"
      :volume="volumeRatio"
      :muted="muted"
      :has-tracks="hasTracks"
      @close="exitFullscreen"
      @toggle="toggle"
      @prev="prev"
      @next="next"
      @seek="seek"
      @volume="onVolumeInput"
      @mute="toggleMute"
    />
  </div>
</template>
