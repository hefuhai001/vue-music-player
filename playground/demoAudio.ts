import type { Track } from '../src'

/**
 * 演示音源：浏览器本地合成（纯数学运算生成 PCM → 编码成 WAV Blob）。
 * 不请求任何第三方 CDN，断网也能播放，避免示例地址失效/被墙导致 demo 不可用。
 */

const SAMPLE_RATE = 22050

type Voice = 'pluck' | 'pad' | 'bass'

interface LoopOptions {
  /** 每分钟拍数 */
  bpm: number
  /** 主音基频（Hz） */
  root: number
  /** 每小节和弦，单位为相对主音的半音数 */
  chords: number[][]
  /** 时长（秒） */
  seconds: number
}

function addTone(
  out: Float32Array,
  freq: number,
  start: number,
  dur: number,
  gain: number,
  voice: Voice,
) {
  const startIndex = Math.floor(start * SAMPLE_RATE)
  const length = Math.floor(dur * SAMPLE_RATE)
  const attack = voice === 'pad' ? 0.18 : 0.005
  const decay = voice === 'bass' ? 2.2 : 5.5

  for (let i = 0; i < length; i += 1) {
    const index = startIndex + i
    if (index >= out.length) break

    const t = i / SAMPLE_RATE
    const release = Math.max(0, Math.min(1, (dur - t) / 0.12))
    const env =
      voice === 'pad'
        ? Math.min(1, t / attack) * release
        : Math.exp(-t * decay) * Math.min(1, t / attack)
    if (env <= 0) continue

    const phase = 2 * Math.PI * freq * t
    let sample = Math.sin(phase)
    if (voice === 'pluck') sample += 0.32 * Math.sin(phase * 2) + 0.12 * Math.sin(phase * 3)
    else if (voice === 'pad') sample += 0.18 * Math.sin(phase * 2)

    out[index] += sample * env * gain
  }
}

function renderLoop({ bpm, root, chords, seconds }: LoopOptions): Float32Array {
  const total = Math.floor(SAMPLE_RATE * seconds)
  const out = new Float32Array(total)
  const beat = 60 / bpm
  const bar = beat * 4
  const bars = Math.ceil(seconds / bar)

  for (let b = 0; b < bars; b += 1) {
    const chord = chords[b % chords.length]
    const start = b * bar

    // 铺底和弦
    for (const semi of chord) {
      addTone(out, root * 2 ** (semi / 12), start, bar * 0.95, 0.1, 'pad')
    }
    // 低音
    addTone(out, root / 2, start, bar * 0.85, 0.16, 'bass')
    if (b % 2 === 1) addTone(out, root / 2, start + bar / 2, bar * 0.4, 0.1, 'bass')

    // 八分音符琶音
    for (let i = 0; i < 8; i += 1) {
      const semi = chord[i % chord.length] + (i >= 4 ? 12 : 0)
      addTone(out, root * 2 ** (semi / 12) * 2, start + (i * beat) / 2, beat * 0.9, 0.14, 'pluck')
    }
  }

  // 一阶低通，削掉高频毛刺
  let prev = 0
  for (let i = 0; i < total; i += 1) {
    prev += 0.32 * (out[i] - prev)
    out[i] = prev
  }

  // 归一化 + 首尾淡入淡出，避免爆音
  let peak = 0
  for (let i = 0; i < total; i += 1) peak = Math.max(peak, Math.abs(out[i]))
  const scale = peak > 0 ? 0.72 / peak : 0
  const fade = Math.floor(SAMPLE_RATE * 0.25)
  for (let i = 0; i < total; i += 1) {
    let v = out[i] * scale
    if (i < fade) v *= i / fade
    if (i > total - fade) v *= (total - i) / fade
    out[i] = v
  }

  return out
}

function encodeWav(samples: Float32Array): Blob {
  const bytes = samples.length * 2
  const buffer = new ArrayBuffer(44 + bytes)
  const view = new DataView(buffer)

  const writeText = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i))
  }

  writeText(0, 'RIFF')
  view.setUint32(4, 36 + bytes, true)
  writeText(8, 'WAVE')
  writeText(12, 'fmt ')
  view.setUint32(16, 16, true) // fmt 块长度
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // 单声道
  view.setUint32(24, SAMPLE_RATE, true)
  view.setUint32(28, SAMPLE_RATE * 2, true) // 字节率
  view.setUint16(32, 2, true) // 块对齐
  view.setUint16(34, 16, true) // 位深
  writeText(36, 'data')
  view.setUint32(40, bytes, true)

  for (let i = 0; i < samples.length; i += 1) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }

  return new Blob([view], { type: 'audio/wav' })
}

function createCover(from: string, to: string, glyph: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/>
      <stop offset="1" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" fill="url(#g)"/>
  <circle cx="100" cy="100" r="48" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1.5"/>
  <circle cx="100" cy="100" r="30" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="1.5"/>
  <text x="100" y="118" text-anchor="middle" font-family="Georgia, 'Songti SC', serif" font-size="40" fill="rgba(255,255,255,.92)">${glyph}</text>
</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

interface DemoDef extends LoopOptions {
  id: number
  title: string
  artist: string
  album: string
  cover: [string, string]
}

const DEFS: DemoDef[] = [
  {
    id: 1,
    title: '琥珀色的房间',
    artist: 'Synth Étude',
    album: 'Offline Demo',
    bpm: 88,
    root: 220,
    chords: [
      [0, 3, 7],
      [8, 12, 15],
      [3, 7, 10],
      [10, 14, 17],
    ],
    seconds: 26,
    cover: ['#9aa1ad', '#3a3f47'],
  },
  {
    id: 2,
    title: '夜行列车',
    artist: 'Synth Étude',
    album: 'Offline Demo',
    bpm: 104,
    root: 196,
    chords: [
      [0, 4, 7],
      [9, 12, 16],
      [5, 9, 12],
      [7, 11, 14],
    ],
    seconds: 31,
    cover: ['#4b6b7a', '#1c2733'],
  },
  {
    id: 3,
    title: '雨窗',
    artist: 'Synth Étude',
    album: 'Offline Demo',
    bpm: 72,
    root: 261.63,
    chords: [
      [0, 3, 7],
      [5, 8, 12],
      [3, 7, 10],
    ],
    seconds: 18,
    cover: ['#3f5f52', '#182721'],
  },
]

export function createDemoTracks(): Track[] {
  return DEFS.map((def) => ({
    id: def.id,
    title: def.title,
    artist: def.artist,
    album: def.album,
    src: URL.createObjectURL(encodeWav(renderLoop(def))),
    cover: createCover(def.cover[0], def.cover[1], def.title.slice(0, 1)),
    duration: def.seconds,
  }))
}
