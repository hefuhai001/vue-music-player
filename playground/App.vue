<script setup lang="ts">
import { ref } from 'vue'
import { MusicPlayer } from '../src'
import type { PlayerVariant } from '../src'
import { demoTracks } from './tracks'

const events = ref<string[]>([])

const variants: { value: PlayerVariant; name: string; desc: string }[] = [
  { value: 'modern', name: '现代', desc: '玻璃拟态 · 冷色渐变光' },
  { value: 'retro', name: '复古', desc: '70s 唱片 · 奶油纸与硬投影' },
  { value: 'minimal', name: '简约', desc: '纯白纸面 · 发丝线' },
  { value: 'electronic', name: '电子', desc: 'HUD 霓虹 · 网格与扫描线' },
]

function log(name: string, payload?: unknown) {
  const time = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  const text = payload === undefined ? name : `${name} · ${JSON.stringify(payload)}`
  events.value = [`${time}  ${text}`, ...events.value].slice(0, 8)
}
</script>

<template>
  <main class="stage">
    <header class="stage__head">
      <p class="stage__eyebrow">Vue 3 component · npm ready</p>
      <h1 class="stage__title">Music Player</h1>
      <p class="stage__desc">
        同一套播放内核，四种视觉语言。通过 <code>variant</code> 切换，全部由 CSS 变量驱动。
      </p>
    </header>

    <section class="grid">
      <figure v-for="item in variants" :key="item.value" class="cell">
        <figcaption class="cell__cap">
          <span class="cell__name">{{ item.name }}</span>
          <span class="cell__desc">{{ item.desc }}</span>
        </figcaption>
        <MusicPlayer
          :tracks="demoTracks"
          :variant="item.value"
          :label="item.value.toUpperCase()"
          :show-playlist="false"
          @change="log(`${item.value}: change`, $event?.title)"
          @play="log(`${item.value}: play`)"
          @pause="log(`${item.value}: pause`)"
        />
      </figure>
    </section>

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
  max-width: 1020px;
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
  max-width: 46ch;
  margin: 16px 0 0;
  font-size: 14px;
  line-height: 1.7;
  color: rgba(244, 236, 224, 0.55);
}

.stage__desc code {
  padding: 1px 6px;
  border-radius: 6px;
  background: rgba(246, 238, 226, 0.07);
  font-size: 12.5px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 360px));
  gap: 56px 48px;
  align-items: start;
  justify-content: center;
  margin-top: 56px;
}

.cell {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
}

.cell__cap {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.cell__name {
  font-family: 'Iowan Old Style', 'Palatino Linotype', Palatino, 'Songti SC', Georgia, serif;
  font-size: 19px;
  font-weight: 600;
  color: rgba(244, 236, 224, 0.92);
}

.cell__desc {
  font-size: 11px;
  letter-spacing: 0.06em;
  color: rgba(244, 236, 224, 0.38);
}

.stage__panel {
  max-width: 520px;
  margin-top: 56px;
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
</style>
