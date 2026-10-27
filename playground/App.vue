<script setup lang="ts">
import { ref } from 'vue'
import { MusicPlayer } from '../src'
import { demoTracks } from './tracks'

const events = ref<string[]>([])
const darkPlayer = ref<InstanceType<typeof MusicPlayer> | null>(null)

function log(name: string, payload?: unknown) {
  const time = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  const text = payload === undefined ? name : `${name} · ${JSON.stringify(payload)}`
  events.value = [`${time}  ${text}`, ...events.value].slice(0, 8)
}
</script>

<template>
  <main class="stage">
    <div class="stage__head">
      <p class="stage__eyebrow">Vue 3 component · npm ready</p>
      <h1 class="stage__title">Music Player</h1>
      <p class="stage__desc">
        深色 / 浅色双主题，唱片随播放旋转，进度与音量均为零依赖自绘滑块。
      </p>
    </div>

    <div class="stage__players">
      <MusicPlayer
        ref="darkPlayer"
        :tracks="demoTracks"
        show-playlist
        @change="log('change', $event?.title)"
        @play="log('play')"
        @pause="log('pause')"
        @ended="log('ended')"
      />

      <MusicPlayer
        :tracks="demoTracks"
        theme="light"
        accent="#2f6f6a"
        label="Light theme"
        :volume="0.5"
      />
    </div>

    <div class="stage__panel">
      <div class="stage__panel-head">
        <span>事件日志</span>
        <button type="button" @click="events = []">清空</button>
      </div>
      <ul>
        <li v-for="(item, index) in events" :key="index">{{ item }}</li>
        <li v-if="!events.length" class="is-empty">播放一下试试…</li>
      </ul>
    </div>

    <p class="stage__hint">
      命令式调用：<code>ref.play()</code> / <code>ref.next()</code> /
      <code>ref.seek(30)</code> / <code>ref.setVolume(0.3)</code>
    </p>
  </main>
</template>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(80% 60% at 12% 0%, #2a2118 0%, transparent 60%),
    radial-gradient(70% 60% at 90% 100%, #16202a 0%, transparent 62%),
    #0b0a09;
  color: #f4ece0;
  font-family: 'Avenir Next', 'Segoe UI', 'PingFang SC', system-ui, sans-serif;
}

.stage {
  max-width: 960px;
  margin: 0 auto;
  padding: 72px 24px 96px;
}

.stage__eyebrow {
  margin: 0 0 14px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: rgba(244, 236, 224, 0.45);
}

.stage__title {
  margin: 0;
  font-family: 'Iowan Old Style', 'Palatino Linotype', Palatino, 'Songti SC', Georgia, serif;
  font-size: clamp(40px, 7vw, 64px);
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.02em;
}

.stage__desc {
  max-width: 42ch;
  margin: 16px 0 0;
  font-size: 14px;
  line-height: 1.7;
  color: rgba(244, 236, 224, 0.55);
}

.stage__players {
  display: flex;
  flex-wrap: wrap;
  gap: 28px;
  align-items: flex-start;
  margin-top: 56px;
}

.stage__panel {
  max-width: 520px;
  margin-top: 44px;
  padding: 16px 18px;
  border: 1px solid rgba(246, 238, 226, 0.09);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.025);
}

.stage__panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(244, 236, 224, 0.4);
}

.stage__panel-head button {
  padding: 4px 10px;
  border: 1px solid rgba(246, 238, 226, 0.14);
  border-radius: 99px;
  background: transparent;
  color: rgba(244, 236, 224, 0.55);
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
}

.stage__panel-head button:hover {
  color: #f4ece0;
  border-color: rgba(246, 238, 226, 0.3);
}

.stage__panel ul {
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
  font-family: 'SFMono-Regular', ui-monospace, Consolas, monospace;
  font-size: 11.5px;
  line-height: 1.9;
  color: rgba(229, 164, 76, 0.85);
}

.stage__panel li.is-empty {
  color: rgba(244, 236, 224, 0.3);
}

.stage__hint {
  margin-top: 32px;
  font-size: 12px;
  color: rgba(244, 236, 224, 0.4);
}

.stage__hint code {
  padding: 1px 6px;
  border-radius: 6px;
  background: rgba(246, 238, 226, 0.07);
  color: rgba(244, 236, 224, 0.7);
}
</style>
