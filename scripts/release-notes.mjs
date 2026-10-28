/**
 * 从 CHANGELOG.md 提取指定版本的说明，写入 release-notes.md。
 * 供 GitHub Actions 在创建 Release 时使用。
 *
 * 用法：VERSION=1.0.0 node scripts/release-notes.mjs
 * 找不到对应小节时以非 0 退出，调用方回退到自动生成的 release notes。
 */
import { readFileSync, writeFileSync } from 'node:fs'

const version = (process.env.VERSION ?? '').trim().replace(/^v/, '')
if (!version) {
  console.error('缺少 VERSION 环境变量')
  process.exit(1)
}

const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const heading = new RegExp(`^##\\s*\\[?v?${escaped}\\]?`)
const lines = readFileSync('CHANGELOG.md', 'utf8').split(/\r?\n/)

const start = lines.findIndex((line) => heading.test(line))
if (start === -1) {
  console.error(`CHANGELOG.md 中没有 ${version} 的小节`)
  process.exit(1)
}

let end = lines.length
for (let i = start + 1; i < lines.length; i += 1) {
  if (/^##\s/.test(lines[i])) {
    end = i
    break
  }
}

const body = lines
  .slice(start + 1, end)
  .join('\n')
  .trim()

if (!body) {
  console.error(`${version} 的小节内容为空`)
  process.exit(1)
}

writeFileSync('release-notes.md', `${body}\n`)
console.log(`已写入 release-notes.md（${body.length} 字符）`)
