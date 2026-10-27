<script setup lang="ts">
import { computed, ref } from 'vue'
import { clamp01 } from '../utils/format'

const props = withDefaults(
  defineProps<{
    /** 当前值，0 ~ 1 */
    modelValue: number
    /** 已缓冲比例，0 ~ 1 */
    buffered?: number
    disabled?: boolean
    /** 无障碍标签 */
    label?: string
    /** 键盘单步，0 ~ 1 */
    step?: number
  }>(),
  {
    buffered: 0,
    disabled: false,
    label: '进度',
    step: 0.05,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
  change: [value: number]
}>()

const trackRef = ref<HTMLElement | null>(null)
const dragging = ref(false)

const percent = computed(() => clamp01(props.modelValue) * 100)
const bufferPercent = computed(() => clamp01(props.buffered) * 100)
const ariaValue = computed(() => Math.round(clamp01(props.modelValue) * 100))

function ratioFromEvent(event: PointerEvent): number {
  const el = trackRef.value
  if (!el) return 0
  const rect = el.getBoundingClientRect()
  if (!rect.width) return 0
  return clamp01((event.clientX - rect.left) / rect.width)
}

function emitValue(value: number) {
  emit('update:modelValue', clamp01(value))
}

function onPointerDown(event: PointerEvent) {
  if (props.disabled) return
  event.preventDefault()
  dragging.value = true
  trackRef.value?.focus()
  try {
    trackRef.value?.setPointerCapture(event.pointerId)
  } catch {
    /* noop */
  }
  emitValue(ratioFromEvent(event))
}

function onPointerMove(event: PointerEvent) {
  if (!dragging.value || props.disabled) return
  emitValue(ratioFromEvent(event))
}

function onPointerUp(event: PointerEvent) {
  if (!dragging.value) return
  dragging.value = false
  try {
    trackRef.value?.releasePointerCapture(event.pointerId)
  } catch {
    /* noop */
  }
  emit('change', ratioFromEvent(event))
}

function onKeydown(event: KeyboardEvent) {
  if (props.disabled) return
  const key = event.key
  let next: number | null = null

  if (key === 'ArrowRight' || key === 'ArrowUp') next = props.modelValue + props.step
  else if (key === 'ArrowLeft' || key === 'ArrowDown') next = props.modelValue - props.step
  else if (key === 'Home') next = 0
  else if (key === 'End') next = 1

  if (next === null) return
  event.preventDefault()
  emitValue(next)
  emit('change', clamp01(next))
}
</script>

<template>
  <div
    ref="trackRef"
    class="mp-slider"
    :class="{ 'is-dragging': dragging, 'is-disabled': disabled }"
    role="slider"
    :tabindex="disabled ? -1 : 0"
    :aria-label="label"
    :aria-valuemin="0"
    :aria-valuemax="100"
    :aria-valuenow="ariaValue"
    :aria-disabled="disabled"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @keydown="onKeydown"
  >
    <div class="mp-slider__rail">
      <div class="mp-slider__buffer" :style="{ width: `${bufferPercent}%` }" />
      <div class="mp-slider__fill" :style="{ width: `${percent}%` }" />
    </div>
    <div class="mp-slider__thumb" :style="{ left: `${percent}%` }" />
  </div>
</template>
