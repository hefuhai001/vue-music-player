# 更新日志

本项目的所有重要变更都记录在此文件。

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.0.0] - 2026-10-28

首个正式版本。

### 新增

- **四套内置皮肤**：`modern`（玻璃拟态）、`retro`（70s 唱片）、`minimal`（极简）、`electronic`（HUD 霓虹），共用同一份 DOM，通过 `variant` 切换，不产生额外 JS。
- **全屏播放**：基于原生 Fullscreen API，浏览器拒绝或移动端不支持时自动退化为整页覆盖层；按 `Esc` 退出并与组件状态同步。
- **LRC 歌词**：通过 `Track.lyric` 传入，全屏视图逐行高亮并自动居中滚动；支持一行多个时间标签，忽略 `[ar:]` / `[ti:]` 元信息。
- **实时频谱**：基于 Web Audio `AnalyserNode` 驱动频谱柱；跨域音源自动降级为 CSS 律动，避免被浏览器静音。
- **播放内核 `useAudioPlayer()`**：封装 `HTMLAudioElement`，提供完整响应式状态与命令，可与任意自定义 UI 组合。
- **工具导出**：`useAudioAnalyser()`、`isAnalysableSource()`、`parseLyric()`、`findLyricIndex()`。
- **独立部件**：`PlayerSlider`、`PlayerPlaylist`、`PlayerFullscreen` 可脱离主组件单独使用。
- **全局注册插件** `VueMusicPlayer`，支持 `app.use()`。
- **完整主题体系**：颜色、字体、圆角、阴影、间距全部由 `--mp-*` CSS 变量驱动。
- **无障碍**：滑块支持方向键 / Home / End，并输出 `aria-label`、`aria-valuenow` 等属性。
- **TypeScript**：全量类型定义，随包输出 `.d.ts`。

### 工程

- Vite 库模式构建，产出 ESM + CJS 双格式，`vue` 作为 `peerDependencies` 保证单实例。
- GitHub Actions：PR 与主干推送在 Node 18 / 20 / 22 三版本矩阵执行类型检查与构建。
- GitHub Actions：推送 `v*` 标签自动发布到 npm（含 provenance 签名）并创建 GitHub Release。
- 中英文双语文档；维护与发布指南拆分至 `CONTRIBUTING.md`。
- playground 内置本地合成音源（WAV Blob），不依赖任何 CDN，离线可试听。
