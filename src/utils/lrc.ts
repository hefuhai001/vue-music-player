/** 一行已解析的歌词 */
export interface LyricLine {
  /** 该行开始时间（秒） */
  time: number
  /** 歌词文本 */
  text: string
}

/** 匹配 [mm:ss]、[mm:ss.xx]、[mm:ss:xx] 形式的时间标签 */
const TIME_TAG = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g

function toSeconds(minute: string, second: string, fraction?: string): number {
  const ms = fraction ? Number(fraction) / 10 ** fraction.length : 0
  return Number(minute) * 60 + Number(second) + ms
}

/**
 * 解析 LRC 歌词文本。
 * - 支持一行多个时间标签（副歌复用）
 * - 忽略 `[ar:xxx]` 之类的元信息行与空行
 * - 结果按时间升序排列
 */
export function parseLyric(lyric?: string | null): LyricLine[] {
  if (!lyric) return []

  const lines: LyricLine[] = []
  for (const raw of lyric.split(/\r?\n/)) {
    const times: number[] = []
    for (const match of raw.matchAll(TIME_TAG)) {
      times.push(toSeconds(match[1], match[2], match[3]))
    }
    if (!times.length) continue

    const text = raw.replace(TIME_TAG, '').trim()
    if (!text) continue

    for (const time of times) lines.push({ time, text })
  }

  return lines.sort((a, b) => a.time - b.time)
}

/** 二分查找当前时间对应的歌词行下标，未到达第一行时返回 -1 */
export function findLyricIndex(lines: LyricLine[], time: number): number {
  let low = 0
  let high = lines.length - 1
  let result = -1

  while (low <= high) {
    const mid = (low + high) >> 1
    if (lines[mid].time <= time) {
      result = mid
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  return result
}
