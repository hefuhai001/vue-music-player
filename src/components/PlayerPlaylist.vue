<script setup lang="ts">
import type { Track } from '../types'
import { formatTime } from '../utils/format'

defineProps<{
  tracks: Track[]
  currentIndex: number
}>()

const emit = defineEmits<{
  select: [index: number]
}>()
</script>

<template>
  <div class="mp-playlist">
    <ul class="mp-playlist__list">
      <li v-for="(track, index) in tracks" :key="track.id">
        <button
          type="button"
          class="mp-playlist__item"
          :class="{ 'is-active': index === currentIndex }"
          :aria-current="index === currentIndex ? 'true' : undefined"
          @click="emit('select', index)"
        >
          <span class="mp-playlist__index">
            {{ String(index + 1).padStart(2, '0') }}
          </span>
          <span class="mp-playlist__text">
            <span class="mp-playlist__title">{{ track.title }}</span>
            <span class="mp-playlist__artist">{{ track.artist || '未知歌手' }}</span>
          </span>
          <span class="mp-playlist__duration">
            {{ track.duration ? formatTime(track.duration) : '--:--' }}
          </span>
        </button>
      </li>
    </ul>
    <p v-if="!tracks.length" class="mp-playlist__empty">播放列表为空</p>
  </div>
</template>
